const express = require('express');
const {
  createApprovalRequest,
  getApprovalRequests,
  getApprovalRequestById,
  approveRequest,
  rejectRequest,
  deleteApprovalRequest,
  getApprovalStats,
} = require('../controllers/approval.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get approval statistics
router.get('/stats', authorize('admin', 'managing_authority'), getApprovalStats);

// Create approval request (admin + hod)
router.post('/', authorize('admin', 'hod'), createApprovalRequest);

// Get all approval requests
router.get('/', authorize('admin', 'managing_authority', 'hod'), getApprovalRequests);

// Get single approval request
router.get('/:id', authorize('admin', 'managing_authority', 'hod'), getApprovalRequestById);

// Approve request (managing_authority only)
router.put('/:id/approve', authorize('managing_authority'), approveRequest);

// Reject request (managing_authority only)
router.put('/:id/reject', authorize('managing_authority'), rejectRequest);

// Delete approval request (admin + hod, own requests only)
router.delete('/:id', authorize('admin', 'hod'), deleteApprovalRequest);

module.exports = router;
