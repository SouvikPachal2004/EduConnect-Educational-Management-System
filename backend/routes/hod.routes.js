const express = require('express');
const {
  getHodDashboard,
  getDepartmentTeachers,
  getDepartmentStudents,
  getDepartmentClasses,
  getDepartmentCourses,
  getDepartmentAttendance,
  getDepartmentGrades,
  getHodMessages,
  updateClass,
} = require('../controllers/hod.controller');
const {
  createSubject,
  getDepartmentSubjects,
  assignSubjectToTeacher,
  updateSubject,
  deleteSubject,
  getSubjectById,
} = require('../controllers/subject.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('hod'));

// HOD dashboard stats
router.get('/dashboard', getHodDashboard);

// Department management
router.get('/teachers', getDepartmentTeachers);
router.get('/students', getDepartmentStudents);
router.get('/classes', getDepartmentClasses);
router.put('/classes/:id', updateClass);
router.get('/courses', getDepartmentCourses);
router.get('/attendance', getDepartmentAttendance);
router.get('/grades', getDepartmentGrades);
router.get('/messages', getHodMessages);

// Subject management (HOD creates and assigns subjects)
router.post('/subjects', createSubject);
router.get('/subjects', getDepartmentSubjects);
router.get('/subjects/:id', getSubjectById);
router.put('/subjects/:id', updateSubject);
router.put('/subjects/:id/assign', assignSubjectToTeacher);
router.delete('/subjects/:id', deleteSubject);

module.exports = router;
