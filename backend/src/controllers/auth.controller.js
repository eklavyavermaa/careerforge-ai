const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Settings = require('../models/Settings.model');
const RefreshToken = require('../models/RefreshToken.model');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
} = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const { logEvent } = require('../utils/events');

const REFRESH_COOKIE_NAME = 'cf_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const issueTokenPair = async (user, req, res) => {
  const accessToken = signAccessToken(user._id);
  const rawRefreshToken = signRefreshToken(user._id);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: refreshTokenExpiryDate(),
  });

  res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, refreshCookieOptions);
  return accessToken;
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ name, email, password });

  // Bootstrap related documents so the rest of the app can assume they exist.
  await Promise.all([
    Profile.create({ user: user._id }),
    Settings.create({ user: user._id }),
  ]);

  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationEmail(user, rawToken);
  } catch (err) {
    // Non-fatal: user can request a resend. Don't fail registration over email delivery.
    console.error('[Email] Failed to send verification email:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your account.',
    data: { user },
  });
});

// @desc    Verify email via token
// @route   POST /api/v1/auth/verify-email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  if (!token) return next(new AppError('Verification token is required.', 400));

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return next(new AppError('Verification link is invalid or has expired.', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
exports.resendVerification = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return 200 to avoid leaking which emails exist in the system.
  if (!user || user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    });
  }

  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, rawToken);

  res.status(200).json({
    success: true,
    message: 'If an unverified account exists for this email, a verification link has been sent.',
  });
});

// @desc    Log in
// @route   POST /api/v1/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokenPair(user, req, res);

  logEvent(user._id, 'login', {});

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: { user, accessToken },
  });
});

// @desc    Refresh access token using rotation + reuse detection
// @route   POST /api/v1/auth/refresh
exports.refresh = catchAsync(async (req, res, next) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) return next(new AppError('No refresh token provided.', 401));

  let decoded;
  try {
    decoded = verifyRefreshToken(rawToken);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  const tokenHash = hashToken(rawToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken || storedToken.isRevoked) {
    // Possible token reuse/theft: revoke all sessions for this user as a precaution.
    if (storedToken) {
      await RefreshToken.updateMany({ user: storedToken.user }, { isRevoked: true });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    return next(new AppError('Session invalid. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or is deactivated.', 401));
  }

  // Rotate: revoke the old refresh token and issue a brand new pair.
  storedToken.isRevoked = true;
  const newRawRefreshToken = signRefreshToken(user._id);
  storedToken.replacedByTokenHash = hashToken(newRawRefreshToken);
  await storedToken.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRawRefreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: refreshTokenExpiryDate(),
  });

  res.cookie(REFRESH_COOKIE_NAME, newRawRefreshToken, refreshCookieOptions);

  const accessToken = signAccessToken(user._id);

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
});

// @desc    Log out (revokes current refresh token)
// @route   POST /api/v1/auth/logout
exports.logout = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) {
    await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { isRevoked: true });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @desc    Request a password reset email
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Same anti-enumeration pattern as resendVerification.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, rawToken);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send reset email. Please try again later.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  });
});

// @desc    Reset password using token from email
// @route   POST /api/v1/auth/reset-password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(new AppError('Reset link is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Invalidate all existing sessions after a password reset.
  await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.',
  });
});

// @desc    Get currently authenticated user
// @route   GET /api/v1/auth/me
exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
