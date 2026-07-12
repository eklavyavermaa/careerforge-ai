const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User.model');

// Verifies the access token (sent as a Bearer header) and attaches `req.user`.
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  const decoded = verifyAccessToken(token); // throws JsonWebTokenError/TokenExpiredError -> handled centrally

  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!currentUser.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was changed recently. Please log in again.', 401));
  }

  req.user = currentUser;
  next();
});

// Role-based access control, e.g. restrictTo('admin')
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};
