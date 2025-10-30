const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Admin = require('../models/adminModel');

// Generate Access Token (1 day)
exports.generateAccessToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role: role, tokenVersion: tokenVersion },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1d' }
  );
};

// Generate Refresh Token (1 year)
exports.generateRefreshToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role: role, tokenVersion: tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '365d' }
  );
};

// Set Token Cookies
exports.setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
  });
};

// Get User Model based on Role
const getUserModel = (role) => {
  const models = {
    doctor: Doctor,
    patient: Patient,
    admin: Admin
  };
  return models[role];
};

// Protect Middleware
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Extract tokens from cookies
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  let user;

  // 2) Try to verify access token first
  try {
    decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_ACCESS_SECRET);
    
    // Get user model based on role
    const UserModel = getUserModel(decoded.role);
    if (!UserModel) {
      return next(new AppError('Invalid user role', 401));
    }

    // Find user and check tokenVersion
    user = await UserModel.findById(decoded.id).select('+tokenVersion');
    
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    // Grant access
    req.user = user;
    req.role = decoded.role;
    return next();

  } catch (accessErr) {
    // 3) If access token expired, try refresh token
    if (accessErr.name === 'TokenExpiredError' && refreshToken) {
      try {
        decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        const UserModel = getUserModel(decoded.role);
        if (!UserModel) {
          return next(new AppError('Invalid user role', 401));
        }

        user = await UserModel.findById(decoded.id).select('+tokenVersion');
        
        if (!user) {
          return next(new AppError('User no longer exists', 401));
        }

        if (user.tokenVersion !== decoded.tokenVersion) {
          res.clearCookie('accessToken');
          res.clearCookie('refreshToken');
          return next(new AppError('Token has been invalidated. Please log in again.', 401));
        }

        // Generate new access token
        const newAccessToken = exports.generateAccessToken(user._id, decoded.role, user.tokenVersion);
        
        // Optionally renew refresh token if it's close to expiry (< 30 days)
        const tokenExp = decoded.exp * 1000;
        const now = Date.now();
        const daysRemaining = (tokenExp - now) / (1000 * 60 * 60 * 24);
        
        let newRefreshToken = refreshToken;
        if (daysRemaining < 30) {
          newRefreshToken = exports.generateRefreshToken(user._id, decoded.role, user.tokenVersion);
        }

        // Set new cookies
        exports.setTokenCookies(res, newAccessToken, newRefreshToken);

        // Grant access
        req.user = user;
        req.role = decoded.role;
        return next();

      } catch (refreshErr) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return next(new AppError('Invalid token. Please log in again.', 401));
      }
    } else {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  }
});

// Restrict To (Role-based Authorization)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
