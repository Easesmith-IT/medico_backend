


// controllers/authController.js

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendOtp, verifyOtp, resendOtp } = require('../utils/otpUtils');

const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Admin = require('../models/adminModel');

const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies
} = require('../middleware/auth');

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get User Model based on Role
const getUserModel = (role) => {
  const models = {
    doctor: Doctor,
    patient: Patient,
    admin: Admin
  };
  return models[role];
};

// ============================================
// OTP FUNCTIONS (All Users)
// ============================================

/**
 * Send OTP - Works for Doctor, Patient, Admin
 */
const getOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const isOtpSent = await sendOtp(phone);

  if (!isOtpSent) {
    return next(new AppError('Failed to send OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your phone',
    data: { phone }
  });
});

/**
 * Resend OTP
 */
const resendOtpHandler = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const isOtpResent = await resendOtp(phone);

  if (!isOtpResent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
    data: { phone }
  });
});

/**
 * Verify OTP - Works for Doctor, Patient, Admin
 */
const verifyOtpHandler = catchAsync(async (req, res, next) => {
  const { phone, otp, role } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  // Verify OTP
  const isOtpValid = await verifyOtp(phone, otp);

  if (!isOtpValid) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // If role provided, check if user exists and auto-login
  if (role) {
    const UserModel = getUserModel(role);
    if (!UserModel) {
      return next(new AppError('Invalid role specified', 400));
    }

    const user = await UserModel.findOne({ phone }).select('+tokenVersion');

    if (user) {
      // Auto-login user
      const accessToken = generateAccessToken(user._id, role, user.tokenVersion);
      const refreshToken = generateRefreshToken(user._id, role, user.tokenVersion);

      setTokenCookies(res, accessToken, refreshToken);

      return res.status(200).json({
        success: true,
        message: 'OTP verified and logged in successfully',
        data: {
          user: {
            _id: user._id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: role
          }
        }
      });
    }
  }

  // OTP verified but user not found or role not provided
  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: { phone, verified: true }
  });
});

// ============================================
// PASSWORD-BASED LOGIN (Alternative)
// ============================================

/**
 * Role-Based Login with Email & Password
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  // 1) Validate input
  if (!email || !password || !role) {
    return next(new AppError('Please provide email, password, and role', 400));
  }

  // 2) Get user model based on role
  const UserModel = getUserModel(role);
  if (!UserModel) {
    return next(new AppError('Invalid role specified', 400));
  }

  // 3) Find user and include password & tokenVersion
  const user = await UserModel.findOne({ email }).select('+password +tokenVersion');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 4) Compare password
  const isPasswordCorrect = await user.comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 5) Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // 6) For doctors, check verification status
  if (role === 'doctor' && user.verificationStatus !== 'approved') {
    return next(new AppError(`Your account is ${user.verificationStatus}. Please wait for admin approval.`, 403));
  }

  // 7) Generate tokens
  const accessToken = generateAccessToken(user._id, role, user.tokenVersion);
  const refreshToken = generateRefreshToken(user._id, role, user.tokenVersion);

  // 8) Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // 9) Remove password from output
  user.password = undefined;
  user.tokenVersion = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      role
    }
  });
});

// ============================================
// LOGOUT FUNCTIONS
// ============================================

/**
 * Logout (Single Device)
 */
const logout = catchAsync(async (req, res, next) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Logout All Devices (Forceful Logout)
 */
const logoutAll = catchAsync(async (req, res, next) => {
  const { phone, role } = req.body;

  // Validate input
  if (!phone || !role) {
    return next(new AppError('Please provide phone number and role', 400));
  }

  // Get user model based on role
  const UserModel = getUserModel(role);
  if (!UserModel) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Find user
  const user = await UserModel.findOne({ phone }).select('+tokenVersion');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Increment tokenVersion to invalidate all tokens
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully'
  });
});

// ============================================
// AUTH STATUS & VERIFICATION
// ============================================

/**
 * Check Authentication Status
 */
const checkAuthStatus = catchAsync(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(200).json({
      status: 'success',
      isAuthenticated: false,
      data: null
    });
  }

  try {
    let decoded;

    // Try access token first
    try {
      decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      // If access token expired, try refresh token
      if (err.name === 'TokenExpiredError' && refreshToken) {
        decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
      } else {
        throw err;
      }
    }

    // Get user
    const UserModel = getUserModel(decoded.role);
    const user = await UserModel.findById(decoded.id).select('+tokenVersion');

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(200).json({
        status: 'success',
        isAuthenticated: false,
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      isAuthenticated: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: decoded.role
      }
    });

  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({
      status: 'success',
      isAuthenticated: false,
      data: null
    });
  }
});

/**
 * Verify User by Phone (Check if user exists)
 */
const verifyUserExists = catchAsync(async (req, res, next) => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    return next(new AppError('Phone number and role are required', 400));
  }

  const UserModel = getUserModel(role);
  if (!UserModel) {
    return next(new AppError('Invalid role specified', 400));
  }

  const user = await UserModel.findOne({ phone });

  if (!user) {
    return res.status(200).json({
      success: true,
      exists: false,
      message: 'User not found. Please sign up first.'
    });
  }

  res.status(200).json({
    success: true,
    exists: true,
    message: 'User found',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role
    }
  });
});



module.exports = {
  // OTP Functions
  getOtp,
  resendOtpHandler,
  verifyOtpHandler,

  // Authentication Functions
  login,
  logout,
  logoutAll,

  // Status Functions
  checkAuthStatus,
  verifyUserExists
};























// const jwt = require('jsonwebtoken');
// const { promisify } = require('util');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');  

// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const Admin = require('../models/adminModel');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   setTokenCookies
// } = require('../middleware/auth');

// // Get User Model based on Role
// const getUserModel = (role) => {
//   const models = {
//     doctor: Doctor,
//     patient: Patient,
//     admin: Admin
//   };
//   return models[role];
// };

// // Role-Based Login (Single Endpoint)
// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password, role } = req.body;

//   // 1) Validate input
//   if (!email || !password || !role) {
//     return next(new AppError('Please provide email, password, and role', 400));
//   }

//   // 2) Get user model based on role
//   const UserModel = getUserModel(role);
//   if (!UserModel) {
//     return next(new AppError('Invalid role specified', 400));
//   }

//   // 3) Find user and include password & tokenVersion
//   const user = await UserModel.findOne({ email }).select('+password +tokenVersion');

//   if (!user) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 4) Compare password
//   const isPasswordCorrect = await user.comparePassword(password, user.password);
//   if (!isPasswordCorrect) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 5) Check if user is active
//   if (!user.isActive) {
//     return next(new AppError('Your account has been deactivated. Please contact support.', 403));
//   }

//   // 6) For doctors, check verification status
//   if (role === 'doctor' && user.verificationStatus !== 'approved') {
//     return next(new AppError(`Your account is ${user.verificationStatus}. Please wait for admin approval.`, 403));
//   }

//   // 7) Generate tokens
//   const accessToken = generateAccessToken(user._id, role, user.tokenVersion);
//   const refreshToken = generateRefreshToken(user._id, role, user.tokenVersion);

//   // 8) Set cookies
//   setTokenCookies(res, accessToken, refreshToken);

//   // 9) Remove password from output
//   user.password = undefined;
//   user.tokenVersion = undefined;

//   res.status(200).json({
//     status: 'success',
//     message: 'Login successful',
//     data: {
//       user,
//       role
//     }
//   });
// });

// // Logout (Single Device)
// exports.logout = catchAsync(async (req, res, next) => {
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     status: 'success',
//     message: 'Logged out successfully'
//   });
// });

// // Logout All Devices (Forceful Logout)
// exports.logoutAll = catchAsync(async (req, res, next) => {
//   const { phone, role } = req.body;

//   // Validate input
//   if (!phone || !role) {
//     return next(new AppError('Please provide phone number and role', 400));
//   }

//   // Get user model based on role
//   const UserModel = getUserModel(role);
//   if (!UserModel) {
//     return next(new AppError('Invalid role specified', 400));
//   }

//   // Find user
//   const user = await UserModel.findOne({ phone }).select('+tokenVersion');
//   if (!user) {
//     return next(new AppError('User not found', 404));
//   }

//   // Increment tokenVersion to invalidate all tokens
//   user.tokenVersion += 1;
//   await user.save({ validateBeforeSave: false });

//   // Clear cookies
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     status: 'success',
//     message: 'Logged out from all devices successfully'
//   });
// });

// // Check Auth Status
// exports.checkAuthStatus = catchAsync(async (req, res, next) => {
//   const accessToken = req.cookies.accessToken;
//   const refreshToken = req.cookies.refreshToken;

//   if (!accessToken && !refreshToken) {
//     return res.status(200).json({
//       status: 'success',
//       isAuthenticated: false,
//       data: null
//     });
//   }

//   try {
//     let decoded;
    
//     // Try access token first
//     try {
//       decoded = await promisify(jwt.verify)(accessToken, process.env.JWT_ACCESS_SECRET);
//     } catch (err) {
//       // If access token expired, try refresh token
//       if (err.name === 'TokenExpiredError' && refreshToken) {
//         decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
//       } else {
//         throw err;
//       }
//     }

//     // Get user
//     const UserModel = getUserModel(decoded.role);
//     const user = await UserModel.findById(decoded.id).select('+tokenVersion');

//     if (!user || user.tokenVersion !== decoded.tokenVersion) {
//       res.clearCookie('accessToken');
//       res.clearCookie('refreshToken');
//       return res.status(200).json({
//         status: 'success',
//         isAuthenticated: false,
//         data: null
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       isAuthenticated: true,
//       data: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: decoded.role
//       }
//     });

//   } catch (err) {
//     res.clearCookie('accessToken');
//     res.clearCookie('refreshToken');
//     return res.status(200).json({
//       status: 'success',
//       isAuthenticated: false,
//       data: null
//     });
//   }
// });
