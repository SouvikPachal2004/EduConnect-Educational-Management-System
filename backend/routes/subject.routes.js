const express = require('express');
const {
  createSubject,
  getDepartmentSubjects,
  assignSubjectToTeacher,
  updateSubject,
  deleteSubject,
  getMyAssignedSubjects,
  createClassForSubject,
  getSubjectById,
} = require('../controllers/subject.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// ─── HOD routes ───────────────────────────────────────────────────────────────
// Create a subject (HOD only)
router.post('/', authorize('hod'), createSubject);

// Get all subjects in HOD's department
router.get('/department', authorize('hod'), getDepartmentSubjects);

// Assign subject to a teacher (HOD only)
router.put('/:id/assign', authorize('hod'), assignSubjectToTeacher);

// Update subject (HOD only)
router.put('/:id', authorize('hod'), updateSubject);

// Delete subject (HOD only)
router.delete('/:id', authorize('hod'), deleteSubject);

// ─── Teacher routes ───────────────────────────────────────────────────────────
// Get subjects assigned to the logged-in teacher
router.get('/my-subjects', authorize('teacher'), getMyAssignedSubjects);

// Create a class for an assigned subject (Teacher only)
router.post('/:id/create-class', authorize('teacher'), createClassForSubject);

// ─── Shared ───────────────────────────────────────────────────────────────────
// Get subject by ID (hod, teacher, admin)
router.get('/:id', authorize('hod', 'teacher', 'admin'), getSubjectById);

module.exports = router;
