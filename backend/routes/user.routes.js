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

// Admin and Managing Authority routes
router.get('/', authorize('admin', 'managing_authority'), getAllUsers);
router.get('/:id', authorize('admin', 'managing_authority'), getUserById);
router.put('/:id', authorize('admin', 'managing_authority'), updateUser);
router.delete('/:id', authorize('admin', 'managing_authority'), deleteUser);

module.exports = router;