

// const { verifyToken } = require('../utils/tokenUtils');
// const AppError = require('../utils/appError');

// /**
//  * Verify Access Token
//  */
// const verifyAccessToken = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Verify Refresh Token
//  */
// const verifyRefreshToken = (req, res, next) => {
//   try {
//     const token = req.cookies?.refreshToken;

//     if (!token) {
//       return next(new AppError('No refresh token provided', 401));
//     }

//     const decoded = verifyToken(token, 'refresh');
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Verify OTP Token
//  */
// const verifyOtpToken = (req, res, next) => {
//   try {
//     const token = req.headers['x-otp-token'] || req.body.otpToken;

//     if (!token) {
//       return next(new AppError('No OTP token provided', 401));
//     }

//     const decoded = verifyToken(token, 'otp');
//     req.otpData = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };


//  //* Verify Admin Role (superAdmin or subAdmin)

// const verifyAdminRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     // Check if role is superAdmin or subAdmin
//     if (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin') {
//       return next(new AppError('Access denied. Admin privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };


// const verifySuperAdminRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     // Check if role is superAdmin only
//     if (decoded.role !== 'superAdmin') {
//       return next(new AppError('Access denied. Super admin privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };


// //  * Verify Doctor Role

// const verifyDoctorRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     if (decoded.role !== 'doctor') {
//       return next(new AppError('Access denied. Doctor privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Verify Patient Role
//  */
// const verifyPatientRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     if (decoded.role !== 'patient') {
//       return next(new AppError('Access denied. Patient privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   verifyAccessToken,
//   verifyRefreshToken,
//   verifyOtpToken,
//   verifyAdminRole,
//   verifySuperAdminRole,
//   verifyDoctorRole,
//   verifyPatientRole
// };


// middleware/authMiddleware.js

const { verifyToken } = require('../utils/tokenUtils');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');

/**
 * PROTECT MIDDLEWARE - Main authentication for protected routes
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies or Authorization header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token || token === 'undefined') {
      return next(new AppError('You are not logged in. Please log in to get access', 401));
    }

    // Verify token
    const decoded = verifyToken(token, 'access');

    // Load full user from database based on role
    let currentUser;
    if (decoded.role === 'patient') {
      currentUser = await Patient.findById(decoded.id).select('+tokenVersion');
    } else if (decoded.role === 'doctor') {
      currentUser = await Doctor.findById(decoded.id).select('+tokenVersion');
    }

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Check token version (for logout all devices)
    if (currentUser.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError('Your session has been invalidated. Please log in again', 401));
    }

    // Check if user is active
    if (currentUser.isActive === false) {
      return next(new AppError('Your account has been deactivated. Please contact support', 403));
    }

    // Grant access
    req.user = currentUser;
    req.user.role = decoded.role;
    next();
  } catch (error) {
    next(error);
  }
};

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

/**
 * Verify Admin Role (superAdmin or subAdmin)
 */
const verifyAdminRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    if (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin') {
      return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Super Admin Role
 */
const verifySuperAdminRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    if (decoded.role !== 'superAdmin') {
      return next(new AppError('Access denied. Super admin privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Doctor Role
 */
const verifyDoctorRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    if (decoded.role !== 'doctor') {
      return next(new AppError('Access denied. Doctor privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Patient Role
 */
const verifyPatientRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    if (decoded.role !== 'patient') {
      return next(new AppError('Access denied. Patient privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,              
  verifyAccessToken,
  verifyRefreshToken,
  verifyOtpToken,
  verifyAdminRole,
  verifySuperAdminRole,
  verifyDoctorRole,
  verifyPatientRole
};
