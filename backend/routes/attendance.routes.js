const express = require('express');
const { 
  markAttendance,
  markAttendanceViaFaceRecognition,
  launchFaceRecognitionSystem,
  getAttendanceForClass,
  getAttendanceSummaryForStudent,
  getAttendanceSummaryForClass,
  getDepartmentAttendance,
  storeDateWiseAttendance,
  getDateWiseAttendance
} = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher can mark attendance
router.post('/', authorize('teacher', 'admin'), markAttendance);

// Teacher can mark attendance via face recognition
router.post('/face-recognition', authorize('teacher', 'admin'), markAttendanceViaFaceRecognition);

// Teacher can launch face recognition system
router.post('/launch-face-recognition', authorize('teacher', 'admin'), launchFaceRecognitionSystem);

// Anyone can get attendance records (with appropriate filtering in controller)
router.get('/', getAttendanceForClass);

// Teacher can get department-wise attendance
router.get('/department', authorize('teacher'), getDepartmentAttendance);

// Teacher can store date-wise attendance for calendar
router.post('/date-wise', authorize('teacher'), storeDateWiseAttendance);

// Get date-wise attendance for calendar view
router.get('/date-wise', authorize('teacher'), getDateWiseAttendance);

// Student can get their attendance summary, teacher/admin can get any student's summary
router.get('/summary/student', getAttendanceSummaryForStudent);

// Teacher can get class attendance summary
router.get('/summary/class/:classId', authorize('teacher', 'admin'), getAttendanceSummaryForClass);

module.exports = router;