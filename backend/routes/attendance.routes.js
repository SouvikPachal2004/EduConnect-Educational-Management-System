const express = require('express');
const { 
  markAttendance,
  getAttendanceForClass,
  getAttendanceSummaryForStudent,
  getAttendanceSummaryForClass
} = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher can mark attendance
router.post('/', authorize('teacher', 'admin'), markAttendance);

// Anyone can get attendance records (with appropriate filtering in controller)
router.get('/', getAttendanceForClass);

// Student can get their attendance summary, teacher/admin can get any student's summary
router.get('/summary/student', getAttendanceSummaryForStudent);

// Teacher can get class attendance summary
router.get('/summary/class/:classId', authorize('teacher', 'admin'), getAttendanceSummaryForClass);

module.exports = router;