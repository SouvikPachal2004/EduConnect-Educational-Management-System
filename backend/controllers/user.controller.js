const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (role) {
      filter.role = role;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get users
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await User.countDocuments(filter);
    
    successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Users fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch users', 500, error.message);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch user', 500, error.message);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, department, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    const userData = user.toObject();
    delete userData.password;
    
    successResponse(res, userData, 'User updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update user', 500, error.message);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete user', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};