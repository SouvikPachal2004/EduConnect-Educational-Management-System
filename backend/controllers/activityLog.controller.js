const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse } = require('../utils/response.utils');

// @desc    Get all activity logs
// @route   GET /api/activity-logs
// @access  Private (Admin/Managing Authority)
const getAllActivityLogs = async (req, res) => {
  try {
    const { limit = 50, action, status, startDate, endDate } = req.query;
    
    console.log('Received query parameters:', { limit, action, status, startDate, endDate });
    
    // Build filter query
    const filter = {};
    
    if (action) {
      filter.action = action;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        // Create start of day
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        console.log('Start date object (beginning of day):', startDateObj);
        filter.timestamp.$gte = startDateObj;
      }
      if (endDate) {
        // Create end of day
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        console.log('End date object (end of day):', endDateObj);
        filter.timestamp.$lte = endDateObj;
      }
      console.log('Date filter applied:', filter.timestamp);
    }
    
    console.log('Fetching activity logs with filter:', filter);
    
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    console.log('Found', logs.length, 'activity logs');
    
    const total = await ActivityLog.countDocuments(filter);
    
    successResponse(res, {
      logs,
      count: logs.length,
      total
    }, 'Activity logs retrieved successfully');
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    errorResponse(res, 'Error fetching activity logs', 500, error.message);
  }
};

// @desc    Get single activity log
// @route   GET /api/activity-logs/:id
// @access  Private
const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!log) {
      return errorResponse(res, 'Activity log not found', 404);
    }
    
    successResponse(res, log, 'Activity log retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching activity log', 500, error.message);
  }
};

// @desc    Create new activity log
// @route   POST /api/activity-logs
// @access  Private
const createActivityLog = async (req, res) => {
  try {
    const { action, actionLabel, description, status, metadata } = req.body;
    
    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    
    const log = await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action,
      actionLabel,
      ipAddress,
      description,
      status: status || 'success',
      metadata: metadata || {}
    });
    
    successResponse(res, log, 'Activity log created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Error creating activity log', 500, error.message);
  }
};

// @desc    Delete activity log
// @route   DELETE /api/activity-logs/:id
// @access  Private (Admin only)
const deleteActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    
    if (!log) {
      return errorResponse(res, 'Activity log not found', 404);
    }
    
    await log.deleteOne();
    
    successResponse(res, null, 'Activity log deleted successfully');
  } catch (error) {
    errorResponse(res, 'Error deleting activity log', 500, error.message);
  }
};

// @desc    Clear old activity logs
// @route   DELETE /api/activity-logs/clear/old
// @access  Private (Admin only)
const clearOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    successResponse(res, { 
      deletedCount: result.deletedCount 
    }, `Deleted activity logs older than ${days} days`);
  } catch (error) {
    errorResponse(res, 'Error clearing old logs', 500, error.message);
  }
};

module.exports = {
  getAllActivityLogs,
  getActivityLogById,
  createActivityLog,
  deleteActivityLog,
  clearOldLogs
};
