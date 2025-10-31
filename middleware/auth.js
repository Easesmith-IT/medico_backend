// middleware/authMiddleware.js

const { verifyToken } = require('../utils/tokenUtils');
const AppError = require('../utils/appError');

/**
 * Verify Access Token
 */
const verifyAccessToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return next(new AppError('No refresh token provided', 401));
    }

    const decoded = verifyToken(token, 'refresh');
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP Token
 */
const verifyOtpToken = (req, res, next) => {
  try {
    const token = req.headers['x-otp-token'] || req.body.otpToken;

    if (!token) {
      return next(new AppError('No OTP token provided', 401));
    }

    const decoded = verifyToken(token, 'otp');
    req.otpData = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyAccessToken,
  verifyRefreshToken,
  verifyOtpToken
};
