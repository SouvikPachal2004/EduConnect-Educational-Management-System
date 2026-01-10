const User = require('../models/User');
const { hashPassword, comparePassword, generateAuthToken } = require('../utils/auth.utils');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');

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

    // Generate role-specific ID based on role
    if (role === 'student') {
      // Use provided studentId if available, otherwise generate one
      user.studentId = req.body.studentId || `STU${Date.now()}`;
    } else if (role === 'teacher') {
      user.teacherId = `TEA${Date.now()}`;
    } else if (role === 'admin') {
      // Admins don't need special IDs, but we could generate one if needed
      // For now, we'll leave it as is
    } else if (role === 'hod') {
      // HODs are teachers with special roles, so they get teacher IDs
      user.teacherId = `HOD${Date.now()}`;
    } else if (role === 'managing_authority') {
      // Managing authority members don't need special IDs
    }

    await user.save();

    // Log user creation activity
    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'user_creation',
      actionLabel: 'User Registration',
      description: `New ${role} user registered with email ${email}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: {
        role: role,
        department: department,
        studentId: user.studentId,
        teacherId: user.teacherId
      }
    });

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
      // Log failed login attempt
      await logActivity({
        userId: user._id,
        userName: user.name,
        action: 'login',
        actionLabel: 'Login attempt',
        description: `Failed login attempt - invalid password`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'failed'
      });
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate auth token
    const token = generateAuthToken(user);
    
    // Log successful login
    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'login',
      actionLabel: 'Login',
      description: `Successful login as ${user.role}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success'
    });

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