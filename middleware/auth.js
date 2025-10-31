// const jwt = require('jsonwebtoken');
// const { promisify } = require('util');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const Admin = require('../models/adminModel');

// // Generate Access Token (1 day)
// exports.generateAccessToken = (userId, role, tokenVersion) => {
//   return jwt.sign(
//     { id: userId, role: role, tokenVersion: tokenVersion },
//     process.env.JWT_ACCESS_SECRET,
//     { expiresIn: '1d' }
//   );
// };

// // Generate Refresh Token (1 year)
// exports.generateRefreshToken = (userId, role, tokenVersion) => {
//   return jwt.sign(
//     { id: userId, role: role, tokenVersion: tokenVersion },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: '365d' }
//   );
// };

// // Set Token Cookies
// exports.setTokenCookies = (res, accessToken, refreshToken) => {
//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'none'
//   };

//   res.cookie('accessToken', accessToken, {
//     ...cookieOptions,
//     maxAge: 24 * 60 * 60 * 1000 // 1 day
//   });

//   res.cookie('refreshToken', refreshToken, {
//     ...cookieOptions,
//     maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
//   });
// };

// // Get User Model based on Role
// const getUserModel = (role) => {
//   const models = {
//     doctor: Doctor,
//     patient: Patient,
//     admin: Admin
//   };
//   return models[role];
// };

// // Protect Middleware
// exports.protect = catchAsync(async (req, res, next) => {
//   // 1) Extract tokens from cookies
//   const accessToken = req.cookies.accessToken;
//   const refreshToken = req.cookies.refreshToken;

//   if (!accessToken && !refreshToken) {
//     return next(new AppError('You are not logged in. Please log in to get access.', 401));
//   }

//   let decoded;
//   let user;

//   // 2) Try to verify access token first
//   try {
//     decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_ACCESS_SECRET);
    
//     // Get user model based on role
//     const UserModel = getUserModel(decoded.role);
//     if (!UserModel) {
//       return next(new AppError('Invalid user role', 401));
//     }

//     // Find user and check tokenVersion
//     user = await UserModel.findById(decoded.id).select('+tokenVersion');
    
//     if (!user) {
//       return next(new AppError('User no longer exists', 401));
//     }

//     if (user.tokenVersion !== decoded.tokenVersion) {
//       return next(new AppError('Token has been invalidated. Please log in again.', 401));
//     }

//     // Grant access
//     req.user = user;
//     req.role = decoded.role;
//     return next();

//   } catch (accessErr) {
//     // 3) If access token expired, try refresh token
//     if (accessErr.name === 'TokenExpiredError' && refreshToken) {
//       try {
//         decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
        
//         const UserModel = getUserModel(decoded.role);
//         if (!UserModel) {
//           return next(new AppError('Invalid user role', 401));
//         }

//         user = await UserModel.findById(decoded.id).select('+tokenVersion');
        
//         if (!user) {
//           return next(new AppError('User no longer exists', 401));
//         }

//         if (user.tokenVersion !== decoded.tokenVersion) {
//           res.clearCookie('accessToken');
//           res.clearCookie('refreshToken');
//           return next(new AppError('Token has been invalidated. Please log in again.', 401));
//         }

//         // Generate new access token
//         const newAccessToken = exports.generateAccessToken(user._id, decoded.role, user.tokenVersion);
        
//         // Optionally renew refresh token if it's close to expiry (< 30 days)
//         const tokenExp = decoded.exp * 1000;
//         const now = Date.now();
//         const daysRemaining = (tokenExp - now) / (1000 * 60 * 60 * 24);
        
//         let newRefreshToken = refreshToken;
//         if (daysRemaining < 30) {
//           newRefreshToken = exports.generateRefreshToken(user._id, decoded.role, user.tokenVersion);
//         }

//         // Set new cookies
//         exports.setTokenCookies(res, newAccessToken, newRefreshToken);

//         // Grant access
//         req.user = user;
//         req.role = decoded.role;
//         return next();

//       } catch (refreshErr) {
//         res.clearCookie('accessToken');
//         res.clearCookie('refreshToken');
//         return next(new AppError('Invalid token. Please log in again.', 401));
//       }
//     } else {
//       res.clearCookie('accessToken');
//       res.clearCookie('refreshToken');
//       return next(new AppError('Invalid token. Please log in again.', 401));
//     }
//   }
// });

// // Restrict To (Role-based Authorization)
// exports.restrictTo = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.role)) {
//       return next(new AppError('You do not have permission to perform this action', 403));
//     }
//     next();
//   };
// };



// middleware/auth.js

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Admin = require('../models/adminModel');

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate Access Token (1 day)
 */
exports.generateAccessToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role: role, tokenVersion: tokenVersion },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * Generate Refresh Token (1 year)
 */
exports.generateRefreshToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role: role, tokenVersion: tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '365d' }
  );
};

// ============================================
// COOKIE MANAGEMENT
// ============================================

/**
 * Set Token Cookies
 */
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

/**
 * Clear Token Cookies
 */
exports.clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// ============================================
// USER MODEL HELPER
// ============================================

/**
 * Get User Model based on Role
 */
const getUserModel = (role) => {
  const models = {
    doctor: Doctor,
    patient: Patient,
    admin: Admin
  };
  return models[role];
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Protect Middleware - Verify Authentication
 */
exports.protect = catchAsync(async (req, res, next) => {
  console.log('');
  console.log('PROTECT MIDDLEWARE - Verifying authentication');
  console.log('='.repeat(60));

  // 1) Extract tokens from cookies
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  console.log(`Access Token: ${accessToken ? 'Present' : 'Missing'}`);
  console.log(`Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);

  if (!accessToken && !refreshToken) {
    console.log('ERROR: No tokens found');
    console.log('='.repeat(60));
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  let user;

  // 2) Try to verify access token first
  try {
    console.log('Verifying access token...');
    decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_ACCESS_SECRET);
    console.log(`✓ Access token verified for user: ${decoded.id}`);

    // Get user model based on role
    const UserModel = getUserModel(decoded.role);
    if (!UserModel) {
      console.log('ERROR: Invalid user role');
      console.log('='.repeat(60));
      return next(new AppError('Invalid user role', 401));
    }

    // Find user and check tokenVersion
    user = await UserModel.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      console.log('ERROR: User no longer exists');
      console.log('='.repeat(60));
      return next(new AppError('User no longer exists', 401));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      console.log('ERROR: Token version mismatch');
      exports.clearTokenCookies(res);
      console.log('='.repeat(60));
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    console.log('✓ User authenticated with access token');
    console.log('='.repeat(60));

    // Grant access
    req.user = user;
    req.role = decoded.role;
    return next();

  } catch (accessErr) {
    console.log(`Access token error: ${accessErr.name}`);

    // 3) If access token expired, try refresh token
    if (accessErr.name === 'TokenExpiredError' && refreshToken) {
      console.log('Access token expired, attempting refresh...');

      try {
        decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log(`✓ Refresh token verified for user: ${decoded.id}`);

        const UserModel = getUserModel(decoded.role);
        if (!UserModel) {
          console.log('ERROR: Invalid user role');
          console.log('='.repeat(60));
          return next(new AppError('Invalid user role', 401));
        }

        user = await UserModel.findById(decoded.id).select('+tokenVersion');

        if (!user) {
          console.log('ERROR: User no longer exists');
          console.log('='.repeat(60));
          return next(new AppError('User no longer exists', 401));
        }

        if (user.tokenVersion !== decoded.tokenVersion) {
          console.log('ERROR: Refresh token invalidated');
          exports.clearTokenCookies(res);
          console.log('='.repeat(60));
          return next(new AppError('Token has been invalidated. Please log in again.', 401));
        }

        // Generate new access token
        const newAccessToken = exports.generateAccessToken(
          user._id,
          decoded.role,
          user.tokenVersion
        );

        console.log('✓ Generated new access token');

        // Optionally renew refresh token if close to expiry (< 30 days)
        const tokenExp = decoded.exp * 1000;
        const now = Date.now();
        const daysRemaining = (tokenExp - now) / (1000 * 60 * 60 * 24);

        console.log(`Refresh token expires in: ${Math.floor(daysRemaining)} days`);

        let newRefreshToken = refreshToken;
        if (daysRemaining < 30) {
          console.log('Refresh token close to expiry, generating new one...');
          newRefreshToken = exports.generateRefreshToken(
            user._id,
            decoded.role,
            user.tokenVersion
          );
          console.log('✓ Generated new refresh token');
        }

        // Set new cookies
        exports.setTokenCookies(res, newAccessToken, newRefreshToken);
        console.log('✓ Cookies updated');

        // Grant access
        req.user = user;
        req.role = decoded.role;

        console.log('✓ User authenticated with refreshed token');
        console.log('='.repeat(60));
        return next();

      } catch (refreshErr) {
        console.log(`Refresh token error: ${refreshErr.name}`);
        console.log('ERROR: Token refresh failed');
        exports.clearTokenCookies(res);
        console.log('='.repeat(60));
        return next(new AppError('Invalid token. Please log in again.', 401));
      }
    } else {
      console.log('ERROR: No valid refresh token available');
      exports.clearTokenCookies(res);
      console.log('='.repeat(60));
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  }
});

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================

/**
 * Restrict To - Role-based Authorization
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('');
    console.log('RESTRICT MIDDLEWARE - Checking authorization');
    console.log('='.repeat(60));
    console.log(`User Role: ${req.role}`);
    console.log(`Required Roles: ${roles.join(', ')}`);

    if (!roles.includes(req.role)) {
      console.log('ERROR: Unauthorized access');
      console.log('='.repeat(60));
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    console.log('✓ Authorization granted');
    console.log('='.repeat(60));
    next();
  };
};

// ============================================
// TOKEN REFRESH ENDPOINT
// ============================================

/**
 * Refresh Access Token Endpoint
 * POST /api/v1/auth/refresh-token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  console.log('');
  console.log('REFRESH TOKEN - Request received');
  console.log('='.repeat(60));

  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    console.log('ERROR: No refresh token provided');
    console.log('='.repeat(60));
    return next(new AppError('Refresh token not found. Please log in again.', 401));
  }

  try {
    // Verify refresh token
    const decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    console.log(`✓ Refresh token verified for user: ${decoded.id}`);

    // Find user
    const UserModel = getUserModel(decoded.role);
    if (!UserModel) {
      console.log('ERROR: Invalid user role');
      console.log('='.repeat(60));
      return next(new AppError('Invalid user role', 401));
    }

    const user = await UserModel.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      console.log('ERROR: User no longer exists');
      console.log('='.repeat(60));
      return next(new AppError('User no longer exists.', 401));
    }

    // Check token version
    if (user.tokenVersion !== decoded.tokenVersion) {
      console.log('ERROR: Token version mismatch');
      exports.clearTokenCookies(res);
      console.log('='.repeat(60));
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    // Generate new access token
    const newAccessToken = exports.generateAccessToken(
      user._id,
      decoded.role,
      user.tokenVersion
    );

    console.log('✓ Generated new access token');

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    console.log('✓ Access token cookie set');
    console.log('='.repeat(60));
    console.log('');

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
      user: {
        id: user._id,
        role: decoded.role
      }
    });

  } catch (err) {
    console.log(`ERROR: ${err.name}`);
    exports.clearTokenCookies(res);
    console.log('='.repeat(60));

    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid refresh token. Please log in again.', 401));
  }
});

// ============================================
// LOGOUT HANDLER
// ============================================

/**
 * Logout - Invalidate tokens
 */
exports.logout = catchAsync(async (req, res, next) => {
  console.log('');
  console.log('LOGOUT - Request received');
  console.log('='.repeat(60));

  const user = req.user;

  if (!user) {
    console.log('ERROR: No user found in request');
    console.log('='.repeat(60));
    return next(new AppError('No active session to logout from', 401));
  }

  console.log(`User: ${user._id}`);
  console.log(`Role: ${req.role}`);

  // Clear cookies
  exports.clearTokenCookies(res);

  console.log('✓ Cookies cleared');
  console.log('✓ Logged out successfully');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Logout All Devices - Invalidate all tokens
 */
exports.logoutAllDevices = catchAsync(async (req, res, next) => {
  console.log('');
  console.log('LOGOUT ALL DEVICES - Request received');
  console.log('='.repeat(60));

  const user = req.user;

  if (!user) {
    console.log('ERROR: No user found in request');
    console.log('='.repeat(60));
    return next(new AppError('No active session to logout from', 401));
  }

  console.log(`User: ${user._id}`);
  console.log(`Role: ${req.role}`);
  console.log(`Current Token Version: ${user.tokenVersion}`);

  // Increment token version to invalidate all tokens
  const UserModel = getUserModel(req.role);
  const updatedUser = await UserModel.findByIdAndUpdate(
    user._id,
    { tokenVersion: user.tokenVersion + 1 },
    { new: true }
  );

  console.log(`✓ Token version incremented to: ${updatedUser.tokenVersion}`);

  // Clear cookies
  exports.clearTokenCookies(res);

  console.log('✓ Cookies cleared');
  console.log('✓ All devices logged out');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});
