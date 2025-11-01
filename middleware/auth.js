// // middleware/authMiddleware.js

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

// module.exports = {
//   verifyAccessToken,
//   verifyRefreshToken,
//   verifyOtpToken
// };


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


 //* Verify Admin Role (superAdmin or subAdmin)

const verifyAdminRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    // Check if role is superAdmin or subAdmin
    if (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin') {
      return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};


const verifySuperAdminRole = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError('No access token provided', 401));
    }

    const decoded = verifyToken(token, 'access');
    
    // Check if role is superAdmin only
    if (decoded.role !== 'superAdmin') {
      return next(new AppError('Access denied. Super admin privileges required.', 403));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};


//  * Verify Doctor Role

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
  verifyAccessToken,
  verifyRefreshToken,
  verifyOtpToken,
  verifyAdminRole,
  verifySuperAdminRole,
  verifyDoctorRole,
  verifyPatientRole
};
