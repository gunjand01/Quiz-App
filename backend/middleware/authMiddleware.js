const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { promisify } = require('util');
const AppError = require('../error-handler/AppError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
  
    if (!token) {
      return next(new AppError('Please login to access this route', 401));
    }
  
    // Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
  
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token does not exist.', 401));
    }
  
    // Grant access to the protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token! Please log in again.', 401));
    }
    return next(new AppError('Failed to authenticate token.', 401));
  }
};

module.exports = { protect };
                      