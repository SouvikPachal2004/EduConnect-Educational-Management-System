const ApprovalRequest = require('../models/ApprovalRequest');
const Department = require('../models/Department');
const Course = require('../models/Course');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');
const { normalizeDepartmentName, getDepartmentAliases } = require('../utils/departmentCatalog');

/**
 * Create a new approval request
 * POST /api/approvals
 */
const createApprovalRequest = async (req, res) => {
  try {
    const { requestType, title, description, departmentData, eventData, metadata } = req.body;

    // Validate request type
    const validTypes = ['department', 'course', 'fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];
    if (!validTypes.includes(requestType)) {
      return errorResponse(res, 'Invalid request type', 400);
    }

    const { courseData } = req.body;

    // Create approval request
    const approvalRequest = new ApprovalRequest({
      requestType,
      title,
      description,
      requestedBy: req.user.id,
      departmentData,
      courseData,
      eventData,
      metadata,
      status: 'pending',
    });

    await approvalRequest.save();

    // Populate requester info
    await approvalRequest.populate('requestedBy', 'name email role');

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'approval_request_created',
      actionLabel: 'Approval Request Created',
      description: `Created ${requestType} approval request: ${title}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: { requestType, title }
    });

    successResponse(res, approvalRequest, 'Approval request created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create approval request', 500, error.message);
  }
};

/**
 * Get all approval requests (with filters)
 * GET /api/approvals
 */
const getApprovalRequests = async (req, res) => {
  try {
    const { status, requestType, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;

    // If user is admin or hod, show only their requests
    // If user is managing_authority, show all requests
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      filter.requestedBy = req.user.id;
    }

    const skip = (page - 1) * limit;
    const requests = await ApprovalRequest.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ApprovalRequest.countDocuments(filter);

    successResponse(res, {
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Approval requests fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch approval requests', 500, error.message);
  }
};

/**
 * Get a single approval request by ID
 * GET /api/approvals/:id
 */
const getApprovalRequestById = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role');

    if (!request) {
      return errorResponse(res, 'Approval request not found', 404);
    }

    // Check authorization
    if (req.user.role === 'admin' && request.requestedBy._id.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to view this request', 403);
    }

    successResponse(res, request, 'Approval request fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch approval request', 500, error.message);
  }
};

/**
 * Approve an approval request
 * PUT /api/approvals/:id/approve
 */
const approveRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'name email role');

    if (!request) {
      return errorResponse(res, 'Approval request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'Request has already been processed', 400);
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvalDate = new Date();

    // Merge any extra metadata (e.g. principal's modified event date)
    if (req.body.metadata && typeof req.body.metadata === 'object') {
      request.metadata = { ...(request.metadata || {}), ...req.body.metadata };
    }

    // If it's a department request, create the department
    if (request.requestType === 'department' && request.departmentData) {
      const departmentName = normalizeDepartmentName(request.departmentData.name);
      const existingDepartment = await Department.findOne({
        name: { $in: getDepartmentAliases(departmentName) },
      });

      const departmentPayload = {
        name: departmentName,
        hod: request.departmentData.hod || request.departmentData.hodEmail || 'Not assigned',
        faculty: Number(request.departmentData.faculty) || 0,
        students: Number(request.departmentData.students) || 0,
        established: Number(request.departmentData.established) || new Date().getFullYear(),
        isActive: true,
      };

      const department = existingDepartment || new Department(departmentPayload);
      Object.assign(department, departmentPayload);
      await department.save();
    }

    await request.save();

    // Populate approver info
    await request.populate('approvedBy', 'name email role');

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'approval_request_approved',
      actionLabel: 'Approval Request Approved',
      description: `Approved ${request.requestType} request: ${request.title}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: { requestType: request.requestType, title: request.title }
    });

    successResponse(res, request, 'Request approved successfully');
  } catch (error) {
    errorResponse(res, 'Failed to approve request', 500, error.message);
  }
};

/**
 * Reject an approval request
 * PUT /api/approvals/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const request = await ApprovalRequest.findById(req.params.id)
      .populate('requestedBy', 'name email role');

    if (!request) {
      return errorResponse(res, 'Approval request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'Request has already been processed', 400);
    }

    // Update request status
    request.status = 'rejected';
    request.approvedBy = req.user.id;
    request.approvalDate = new Date();
    request.rejectionReason = rejectionReason || 'No reason provided';
    await request.save();

    // Populate approver info
    await request.populate('approvedBy', 'name email role');

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'approval_request_rejected',
      actionLabel: 'Approval Request Rejected',
      description: `Rejected ${request.requestType} request: ${request.title}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: { requestType: request.requestType, title: request.title, reason: rejectionReason }
    });

    successResponse(res, request, 'Request rejected successfully');
  } catch (error) {
    errorResponse(res, 'Failed to reject request', 500, error.message);
  }
};

/**
 * Delete an approval request (only by requester if pending)
 * DELETE /api/approvals/:id
 */
const deleteApprovalRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return errorResponse(res, 'Approval request not found', 404);
    }

    // Only requester can delete their own pending requests
    if (request.requestedBy.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this request', 403);
    }

    if (request.status !== 'pending') {
      return errorResponse(res, 'Cannot delete processed requests', 400);
    }

    await request.deleteOne();

    // Log activity
    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'approval_request_deleted',
      actionLabel: 'Approval Request Deleted',
      description: `Deleted ${request.requestType} request: ${request.title}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: { requestType: request.requestType, title: request.title }
    });

    successResponse(res, null, 'Approval request deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete approval request', 500, error.message);
  }
};

/**
 * Get approval statistics
 * GET /api/approvals/stats
 */
const getApprovalStats = async (req, res) => {
  try {
    const filter = {};
    
    // If user is admin, show only their stats
    if (req.user.role === 'admin') {
      filter.requestedBy = req.user.id;
    }

    const totalRequests = await ApprovalRequest.countDocuments(filter);
    const pendingRequests = await ApprovalRequest.countDocuments({ ...filter, status: 'pending' });
    const approvedRequests = await ApprovalRequest.countDocuments({ ...filter, status: 'approved' });
    const rejectedRequests = await ApprovalRequest.countDocuments({ ...filter, status: 'rejected' });

    // Count by request type
    const byType = await ApprovalRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$requestType', count: { $sum: 1 } } }
    ]);

    successResponse(res, {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }, 'Approval statistics fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch approval statistics', 500, error.message);
  }
};

module.exports = {
  createApprovalRequest,
  getApprovalRequests,
  getApprovalRequestById,
  approveRequest,
  rejectRequest,
  deleteApprovalRequest,
  getApprovalStats,
};
