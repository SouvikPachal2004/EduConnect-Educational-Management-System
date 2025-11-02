const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate auth token
const generateAuthToken = (user) => {
  return generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAuthToken,
};