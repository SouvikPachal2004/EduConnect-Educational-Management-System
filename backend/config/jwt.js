const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'educonnect_default_secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'educonnect_default_secret');
};

module.exports = {
  generateToken,
  verifyToken,
};