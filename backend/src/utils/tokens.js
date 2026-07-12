const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, jti: crypto.randomBytes(16).toString('hex') }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// We store only a hash of the refresh token in MongoDB (never the raw token),
// mirroring how you'd store a password - so a DB leak alone can't be replayed.
const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

const refreshTokenExpiryDate = () => {
  const days = parseInt((process.env.JWT_REFRESH_EXPIRES_IN || '30d').replace('d', ''), 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
};
