const User = require('../models/User');
const { hashPassword, comparePassword, generateAuthToken } = require('../utils/auth.utils');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response.utils');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
    });

    // Generate student/teacher ID based on role
    if (role === 'student') {
      user.studentId = `STU${Date.now()}`;
    } else if (role === 'teacher') {
      user.teacherId = `TEA${Date.now()}`;
    }

    await user.save();

    // Generate auth token
    const token = generateAuthToken(user);

    // Return success response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      teacherId: user.teacherId,
    };

    successResponse(res, { user: userData, token }, 'User registered successfully', 201);
  } catch (error) {
    errorResponse(res, 'Registration failed', 500, error.message);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if password is correct
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate auth token
    const token = generateAuthToken(user);

    // Return success response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      teacherId: user.teacherId,
    };

    successResponse(res, { user: userData, token }, 'Login successful');
  } catch (error) {
    errorResponse(res, 'Login failed', 500, error.message);
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch user', 500, error.message);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};