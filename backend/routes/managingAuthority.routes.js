const express = require('express');
const {
  getDashboard,
  getAllDepartmentsWithStats,
  getAllFaculty,
  getAllStudents,
  getOverallAttendance,
  getOverallGrades,
  createUser,
  updateUser,
  deleteUser,
  getDeptCgpa,
  alertLowCgpaDept,
} = require('../controllers/managingAuthority.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('managing_authority', 'admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Departments
router.get('/departments', getAllDepartmentsWithStats);

// Faculty
router.get('/faculty', getAllFaculty);

// Students
router.get('/students', getAllStudents);

// Attendance
router.get('/attendance', getOverallAttendance);

// Grades
router.get('/grades', getOverallGrades);

// Department CGPA
router.get('/dept-cgpa', getDeptCgpa);

// Alert HOD + students for low CGPA
router.post('/alert-low-cgpa', alertLowCgpaDept);

// User management
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
