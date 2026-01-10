const express = require('express');
const { 
  getStudentPrediction,
  getClassPredictions,
  getAtRiskStudents
} = require('../controllers/prediction.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);

// Teacher, HOD, and Admin can access predictions
router.get('/students/:studentId', authorize('teacher', 'hod', 'admin'), getStudentPrediction);
router.get('/classes/:classId', authorize('teacher', 'hod', 'admin'), getClassPredictions);
router.get('/at-risk', authorize('teacher', 'hod', 'admin'), getAtRiskStudents);

module.exports = router;