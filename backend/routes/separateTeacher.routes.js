const express = require('express');
const { 
  getStudentsByTeacherDepartment,
  getGradesByTeacherDepartment
} = require('../controllers/user.controller');
const { 
  updateDepartmentGrade,
  getDepartmentGrades,
  getStudentDepartmentGrade,
  exportDepartmentGrades,
  initializeDepartmentGrades
} = require('../controllers/separateDepartmentGrade.controller');
const {
  getMyAssignedSubjects,
  createClassForSubject,
} = require('../controllers/subject.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher can get students in their department
router.get('/students', authorize('teacher'), getStudentsByTeacherDepartment);

// Teacher can get grades for students in their department
router.get('/grades', authorize('teacher'), getGradesByTeacherDepartment);

// Department grade management with separate collections
router.post('/department-grades', authorize('teacher'), updateDepartmentGrade);
router.get('/department-grades', authorize('teacher'), getDepartmentGrades);
router.get('/department-grades/student/:studentId', authorize('teacher'), getStudentDepartmentGrade);
router.get('/department-grades/export', authorize('teacher'), exportDepartmentGrades);
router.post('/department-grades/initialize', authorize('teacher'), initializeDepartmentGrades);

// Subject-linked class creation
router.get('/my-subjects', authorize('teacher'), getMyAssignedSubjects);
router.post('/subjects/:id/create-class', authorize('teacher'), createClassForSubject);

module.exports = router;