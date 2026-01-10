const express = require('express');
const { 
  getAllDepartments, 
  getDepartmentById, 
  createDepartment,
  updateDepartment,
  deleteDepartment 
} = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Admin and Managing Authority routes
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorize('admin', 'managing_authority'), createDepartment);
router.put('/:id', authorize('admin', 'managing_authority'), updateDepartment);
router.delete('/:id', authorize('admin', 'managing_authority'), deleteDepartment);

module.exports = router;
