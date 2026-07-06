const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Get next available roll number for a given program (per-program counter)
router.get('/next-roll/:programId', authorize('admin', 'managing_authority'), async (req, res) => {
  try {
    const User = require('../models/User');
    // Only look at students in THIS program
    const programStudents = await User.find({ role: 'student', program: req.params.programId })
      .select('studentId').lean();

    // Find the MAX roll in this program, next = max + 1 (BCA first student = 1)
    let maxRoll = 0;
    programStudents.forEach(s => {
      if (s.studentId) {
        const num = parseInt(String(s.studentId).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxRoll) maxRoll = num;
      }
    });

    const nextRoll = maxRoll + 1;

    res.json({ success: true, nextRoll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin and Managing Authority routes
router.get('/', authorize('admin', 'managing_authority'), getAllUsers);
router.get('/:id', authorize('admin', 'managing_authority'), getUserById);
router.put('/:id', authorize('admin', 'managing_authority'), updateUser);
router.delete('/:id', authorize('admin', 'managing_authority'), deleteUser);

module.exports = router;