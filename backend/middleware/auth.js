// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) {
        return res.status(401).json({ message: 'Token is invalid: User not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;