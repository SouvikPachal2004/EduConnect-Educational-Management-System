const Department = require('../models/Department');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    
    successResponse(res, {
      departments,
      count: departments.length
    }, 'Departments retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching departments', 500, error.message);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }
    
    successResponse(res, department, 'Department retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching department', 500, error.message);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin/Managing Authority)
const createDepartment = async (req, res) => {
  try {
    const { name, hod, faculty, students, established } = req.body;
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return errorResponse(res, 'Department with this name already exists', 400);
    }
    
    const department = await Department.create({
      name,
      hod,
      faculty,
      students,
      established
    });
    
    // Log activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userName: req.user.name,
        action: 'department_creation',
        actionLabel: 'Department creation',
        description: `Created department: ${name}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'success'
      });
    }
    
    successResponse(res, department, 'Department created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Error creating department', 500, error.message);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin/Managing Authority)
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    successResponse(res, updatedDepartment, 'Department updated successfully');
  } catch (error) {
    errorResponse(res, 'Error updating department', 500, error.message);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin/Managing Authority)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }
    
    // Soft delete
    department.isActive = false;
    await department.save();
    
    // Log activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userName: req.user.name,
        action: 'department_deletion',
        actionLabel: 'Department deletion',
        description: `Deleted department: ${department.name}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'success'
      });
    }
    
    successResponse(res, null, 'Department deleted successfully');
  } catch (error) {
    errorResponse(res, 'Error deleting department', 500, error.message);
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
