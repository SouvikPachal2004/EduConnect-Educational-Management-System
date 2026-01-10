const express = require('express');
const { 
  createStudentMapping,
  getStudentByFaceId,
  markAttendanceByFace,
  getStudentMappings,
  deleteStudentMapping,
  takeAttendance
} = require('../controllers/faceRecognition.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher and admin can manage student mappings
router.post('/mappings', authorize('teacher', 'admin'), createStudentMapping);
router.get('/mappings', authorize('teacher', 'admin'), getStudentMappings);
router.delete('/mappings/:faceId', authorize('teacher', 'admin'), deleteStudentMapping);

// Get student by face ID (for face recognition system)
router.get('/students/:faceId', authorize('teacher', 'admin'), getStudentByFaceId);

// Mark attendance by face recognition (teacher only)
router.post('/attendance', authorize('teacher'), markAttendanceByFace);

// Take attendance using face recognition system (teacher only)
router.post('/take-attendance', authorize('teacher'), takeAttendance);

module.exports = router;