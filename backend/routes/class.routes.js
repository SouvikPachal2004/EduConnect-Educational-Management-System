const express = require('express');
const { 
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  updateClassMode,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
} = require('../controllers/class.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Teacher, HOD, and admin can create classes
router.post('/', authorize('teacher', 'admin', 'hod'), createClass);

// Anyone can get classes (with appropriate filtering in controller)
router.get('/', getAllClasses);

// Anyone can get a specific class
router.get('/:id', getClassById);

// Teacher, HOD, and admin can update/delete classes
router.put('/:id', authorize('teacher', 'admin', 'hod'), updateClass);
router.delete('/:id', authorize('teacher', 'admin', 'hod'), deleteClass);

// Update class mode (virtual/physical) — teacher or HOD
router.put('/:id/mode', authorize('teacher', 'admin', 'hod'), updateClassMode);

// Set meeting link directly (called when Start Class creates a meeting room)
router.put('/:id/meeting-link', authorize('teacher', 'admin', 'hod'), async (req, res) => {
  try {
    const { meetingLink } = req.body;
    const Class = require('../models/Class');
    await Class.findByIdAndUpdate(req.params.id, { meetingLink: meetingLink || '' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Teacher can manage class enrollment
router.post('/:id/students', authorize('teacher', 'admin'), addStudentToClass);
router.delete('/:id/students', authorize('teacher', 'admin'), removeStudentFromClass);

module.exports = router;