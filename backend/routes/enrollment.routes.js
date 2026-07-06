const express = require('express');
const {
  sendEnrollmentInvites,
  getPendingEnrollments,
  getMyEnrollments,
  acceptEnrollment,
  rejectEnrollment,
  getClassEnrollmentStats,
  getClassEnrollmentRequests,
} = require('../controllers/enrollment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher routes
router.post('/invite', authorize('teacher'), sendEnrollmentInvites);
router.get('/class/:classId/stats', authorize('teacher', 'hod'), getClassEnrollmentStats);
router.get('/class/:classId/requests', authorize('teacher', 'hod'), getClassEnrollmentRequests);

// Student routes
router.get('/pending', authorize('student'), getPendingEnrollments);
router.get('/my-requests', authorize('student'), getMyEnrollments);
router.post('/:id/accept', authorize('student'), acceptEnrollment);
router.post('/:id/reject', authorize('student'), rejectEnrollment);

module.exports = router;
