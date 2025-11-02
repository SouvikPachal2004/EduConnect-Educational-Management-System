const express = require('express');
const { 
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
} = require('../controllers/class.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher and admin can create classes
router.post('/', authorize('teacher', 'admin'), createClass);

// Anyone can get classes (with appropriate filtering in controller)
router.get('/', getAllClasses);

// Anyone can get a specific class
router.get('/:id', getClassById);

// Teacher and admin can update/delete classes
router.put('/:id', authorize('teacher', 'admin'), updateClass);
router.delete('/:id', authorize('teacher', 'admin'), deleteClass);

// Teacher can manage class enrollment
router.post('/:id/students', authorize('teacher', 'admin'), addStudentToClass);
router.delete('/:id/students', authorize('teacher', 'admin'), removeStudentFromClass);

module.exports = router;