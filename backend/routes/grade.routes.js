const express = require('express');
const { 
  createGrade,
  getGradesForStudent,
  getGradesForClass,
  updateGrade,
  deleteGrade,
  getGradeSummaryForStudent
} = require('../controllers/grade.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher can create grades
router.post('/', authorize('teacher', 'admin'), createGrade);

// Student can get their grades, teacher/admin can get any student's grades
router.get('/student', getGradesForStudent);

// Teacher can get class grades
router.get('/class/:classId', authorize('teacher', 'admin'), getGradesForClass);

// Teacher can update/delete grades
router.put('/:id', authorize('teacher', 'admin'), updateGrade);
router.delete('/:id', authorize('teacher', 'admin'), deleteGrade);

// Student can get their grade summary, teacher/admin can get any student's summary
router.get('/summary/student', getGradeSummaryForStudent);

module.exports = router;