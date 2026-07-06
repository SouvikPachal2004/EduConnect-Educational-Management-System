const express = require('express');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authorize('admin', 'teacher', 'managing_authority'), createCourse);
router.put('/:id', authorize('admin', 'teacher', 'managing_authority'), updateCourse);
router.delete('/:id', authorize('admin', 'teacher', 'managing_authority'), deleteCourse);

module.exports = router;
