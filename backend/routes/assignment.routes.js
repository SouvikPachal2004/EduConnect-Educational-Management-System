const express = require('express');
const { 
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  gradeSubmission
} = require('../controllers/assignment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher can create assignments
router.post('/', authorize('teacher', 'admin'), createAssignment);

// Anyone can get assignments (with appropriate filtering in controller)
router.get('/', getAllAssignments);

// Anyone can get a specific assignment
router.get('/:id', getAssignmentById);

// Teacher can update/delete assignments
router.put('/:id', authorize('teacher', 'admin'), updateAssignment);
router.delete('/:id', authorize('teacher', 'admin'), deleteAssignment);

// Student can submit assignments
router.post('/:id/submit', authorize('student'), submitAssignment);

// Teacher can view submissions and grade them
router.get('/:id/submissions', authorize('teacher', 'admin'), getSubmissionsForAssignment);
router.put('/submissions/:id/grade', authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;