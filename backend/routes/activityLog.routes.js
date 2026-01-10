const express = require('express');
const { 
  getAllActivityLogs, 
  getActivityLogById, 
  createActivityLog,
  deleteActivityLog,
  clearOldLogs
} = require('../controllers/activityLog.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Admin and Managing Authority routes
router.get('/', authorize('admin', 'managing_authority'), getAllActivityLogs);
router.get('/:id', getActivityLogById);
router.post('/', createActivityLog);
router.delete('/clear/old', authorize('admin'), clearOldLogs);
router.delete('/:id', authorize('admin'), deleteActivityLog);

module.exports = router;
