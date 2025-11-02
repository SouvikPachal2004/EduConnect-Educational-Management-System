const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response.utils');
const { verifyToken } = require('../config/jwt');

// Protect route middleware
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return errorResponse(res, 'Not authorized, no token', 401);
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return errorResponse(res, 'Not authorized, user not found', 401);
    }
    
    next();
  } catch (error) {
    errorResponse(res, 'Not authorized, token failed', 401, error.message);
  }
};

// Authorize roles middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authorized', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `User role '${req.user.role}' is not authorized to access this route`, 403);
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize,
};