// utils/tokenUtils.js

const jwt = require('jsonwebtoken');
const AppError = require('./appError');

/**
 * Generate Access Token
 * @param {string} userId - User ID
 * @param {string} userRole - Role (doctor, patient, admin)
 * @param {number} tokenVersion - Token version for invalidation
 * @returns {string} Access token
 */
const generateAccessToken = (userId, userRole, tokenVersion = 0) => {
  if (!userId) {
    throw new AppError('UserId is required to generate access token', 400);
  }

  const payload = {
    id: userId,
    role: userRole,
    tokenVersion,
    type: 'access'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' } // 5 minutes expiry
  );

  return token;
};

/**
 * Generate Refresh Token
 * @param {string} userId - User ID
 * @param {string} userRole - Role (doctor, patient, admin)
 * @param {number} tokenVersion - Token version for invalidation
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId, userRole, tokenVersion = 0) => {
  if (!userId) {
    throw new AppError('UserId is required to generate refresh token', 400);
  }

  const payload = {
    id: userId,
    role: userRole,
    tokenVersion,
    type: 'refresh'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '90d' } // 90 days expiry
  );

  return token;
};

/**
 * Generate OTP Token (Short-lived, for OTP verification)
 * @param {string} phone - Phone number
 * @param {string} userRole - Role (doctor, patient, admin)
 * @returns {string} OTP token
 */
const generateOtpToken = (phone, userRole) => {
  if (!phone) {
    throw new AppError('Phone is required to generate OTP token', 400);
  }

  const payload = {
    phone,
    role: userRole,
    type: 'otp'
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET,
    { expiresIn: '10m' } // 10 minutes expiry
  );

  return token;
};

/**
 * Verify Token
 * @param {string} token - Token to verify
 * @param {string} tokenType - Type of token (access, refresh, otp)
 * @returns {object} Decoded token data
 */
const verifyToken = (token, tokenType = 'access') => {
  try {
    let secret;

    if (tokenType === 'access') {
      secret = process.env.JWT_ACCESS_SECRET;
    } else if (tokenType === 'refresh') {
      secret = process.env.JWT_REFRESH_SECRET;
    } else if (tokenType === 'otp') {
      secret = process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET;
    }

    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    throw new AppError(`Invalid or expired ${tokenType} token: ${error.message}`, 401);
  }
};

/**
 * Set Authentication Cookies
 * @param {object} res - Response object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @returns {object} Tokens for response
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 5 * 60 * 1000 // 5 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
  });

  res.cookie('isAuthenticated', true, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 90 * 24 * 60 * 60 * 1000
  });

  return {
    accessToken,
    refreshToken
  };




  
};
  const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('isAuthenticated');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies
};
