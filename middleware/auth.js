// const { verifyToken } = require('../utils/tokenUtils');
// const AppError = require('../utils/appError');
// const Patient = require('../models/patientModel');
// const Doctor = require('../models/doctorModel');

// /**
//  * PROTECT MIDDLEWARE - Main authentication for protected routes
//  * @param  {...string} allowedRoles - Optional roles for article creation (e.g., 'doctor', 'hospital')
//  */
// const protect = (...allowedRoles) => {
//   return async (req, res, next) => {
//     try {
//       let token;

//       // Get token from cookies or Authorization header
//       if (req.cookies && req.cookies.accessToken) {
//         token = req.cookies.accessToken;
//       } else if (
//         req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')
//       ) {
//         token = req.headers.authorization.split(' ')[1];
//       }

//       if (!token || token === 'undefined') {
//         return next(new AppError('You are not logged in. Please log in to get access', 401));
//       }

//       // Verify token
//       const decoded = verifyToken(token, 'access');

//       // Load full user from database based on role
//       let currentUser;
//       let userModel;

//       if (decoded.role === 'patient') {
//         currentUser = await Patient.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Patient';
//       } else if (decoded.role === 'doctor') {
//         currentUser = await Doctor.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Doctor';
//       } else if (decoded.role === 'hospital') {
//         currentUser = await Hospital.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Hospital';
//       }

//       if (!currentUser) {
//         return next(new AppError('The user belonging to this token no longer exists', 401));
//       }

//       // Check token version (for logout all devices)
//       if (currentUser.tokenVersion !== decoded.tokenVersion) {
//         return next(new AppError('Your session has been invalidated. Please log in again', 401));
//       }

//       // Check if user is active
//       if (currentUser.isActive === false) {
//         return next(new AppError('Your account has been deactivated. Please contact support', 403));
//       }

//       // Grant access
//       req.user = currentUser;
//       req.user.role = decoded.role;
//       req.userModel = userModel;

//       // If specific roles are required (for article creation, etc.)
//       if (allowedRoles.length > 0) {
//         const userRole = decoded.role?.toLowerCase();

//         // Check if user has required role
//         if (!allowedRoles.includes(userRole)) {
//           return next(new AppError(
//             `Access denied. Required roles: ${allowedRoles.join(', ')}`,
//             403
//           ));
//         }

//         // Attach user model for use in controller
//         req.userData = currentUser;
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };

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

// /**
//  * Verify Admin Role (superAdmin or subAdmin)
//  */
// const verifyAdminRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     if (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin') {
//       return next(new AppError('Access denied. Admin privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Verify Super Admin Role
//  */
// const verifySuperAdminRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError('No access token provided', 401));
//     }

//     const decoded = verifyToken(token, 'access');
    
//     if (decoded.role !== 'superAdmin') {
//       return next(new AppError('Access denied. Super admin privileges required.', 403));
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Verify Doctor Role
//  */
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
//   protect,              
//   verifyAccessToken,
//   verifyRefreshToken,
//   verifyOtpToken,
//   verifyAdminRole,
//   verifySuperAdminRole,
//   verifyDoctorRole,
//   verifyPatientRole
// };


// // const { verifyToken } = require('../utils/tokenUtils');
// // const AppError = require('../utils/appError');
// // const Patient = require('../models/patientModel');
// // const Doctor = require('../models/doctorModel');

// // /**
// //  * PROTECT MIDDLEWARE - Main authentication for protected routes
// //  */
// // const protect = async (req, res, next) => {
// //   try {
// //     let token;

// //     // Get token from cookies or Authorization header
// //     if (req.cookies && req.cookies.accessToken) {
// //       token = req.cookies.accessToken;
// //     } else if (
// //       req.headers.authorization &&
// //       req.headers.authorization.startsWith('Bearer')
// //     ) {
// //       token = req.headers.authorization.split(' ')[1];
// //     }

// //     if (!token || token === 'undefined') {
// //       return next(new AppError('You are not logged in. Please log in to get access', 401));
// //     }

// //     // Verify token
// //     const decoded = verifyToken(token, 'access');

// //     // Load full user from database based on role
// //     let currentUser;
// //     if (decoded.role === 'patient') {
// //       currentUser = await Patient.findById(decoded.id).select('+tokenVersion');
// //     } else if (decoded.role === 'doctor') {
// //       currentUser = await Doctor.findById(decoded.id).select('+tokenVersion');
// //     }

// //     if (!currentUser) {
// //       return next(new AppError('The user belonging to this token no longer exists', 401));
// //     }

// //     // Check token version (for logout all devices)
// //     if (currentUser.tokenVersion !== decoded.tokenVersion) {
// //       return next(new AppError('Your session has been invalidated. Please log in again', 401));
// //     }

// //     // Check if user is active
// //     if (currentUser.isActive === false) {
// //       return next(new AppError('Your account has been deactivated. Please contact support', 403));
// //     }

// //     // Grant access
// //     req.user = currentUser;
// //     req.user.role = decoded.role;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Access Token
// //  */
// // const verifyAccessToken = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.accessToken;

// //     if (!token) {
// //       return next(new AppError('No access token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'access');
// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Refresh Token
// //  */
// // const verifyRefreshToken = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.refreshToken;

// //     if (!token) {
// //       return next(new AppError('No refresh token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'refresh');
// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify OTP Token
// //  */
// // const verifyOtpToken = (req, res, next) => {
// //   try {
// //     const token = req.headers['x-otp-token'] || req.body.otpToken;

// //     if (!token) {
// //       return next(new AppError('No OTP token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'otp');
// //     req.otpData = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Admin Role (superAdmin or subAdmin)
// //  */
// // const verifyAdminRole = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.accessToken;

// //     if (!token) {
// //       return next(new AppError('No access token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'access');
    
// //     if (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin') {
// //       return next(new AppError('Access denied. Admin privileges required.', 403));
// //     }

// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Super Admin Role
// //  */
// // const verifySuperAdminRole = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.accessToken;

// //     if (!token) {
// //       return next(new AppError('No access token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'access');
    
// //     if (decoded.role !== 'superAdmin') {
// //       return next(new AppError('Access denied. Super admin privileges required.', 403));
// //     }

// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Doctor Role
// //  */
// // const verifyDoctorRole = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.accessToken;

// //     if (!token) {
// //       return next(new AppError('No access token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'access');
    
// //     if (decoded.role !== 'doctor') {
// //       return next(new AppError('Access denied. Doctor privileges required.', 403));
// //     }

// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // /**
// //  * Verify Patient Role
// //  */
// // const verifyPatientRole = (req, res, next) => {
// //   try {
// //     const token = req.cookies?.accessToken;

// //     if (!token) {
// //       return next(new AppError('No access token provided', 401));
// //     }

// //     const decoded = verifyToken(token, 'access');
    
// //     if (decoded.role !== 'patient') {
// //       return next(new AppError('Access denied. Patient privileges required.', 403));
// //     }

// //     req.user = decoded;
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // module.exports = {
// //   protect,              
// //   verifyAccessToken,
// //   verifyRefreshToken,
// //   verifyOtpToken,
// //   verifyAdminRole,
// //   verifySuperAdminRole,
// //   verifyDoctorRole,
// //   verifyPatientRole
// // };



// middleware/auth.js

const { verifyToken, verifyTokenSafe, generateAccessToken } = require('../utils/tokenUtils');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');
/**
 * PROTECT MIDDLEWARE - Automatic token refresh on expiry
 * @param  {...string} allowedRoles - Optional roles for authorization
 */
// const protect = (...allowedRoles) => {
//   return async (req, res, next) => {
//     try {
//       let token;
//       let refreshToken;

//       // Get token from cookies or Authorization header
//       if (req.cookies && req.cookies.accessToken) {
//         token = req.cookies.accessToken;
//         refreshToken = req.cookies.refreshToken;
//       } else if (
//         req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')
//       ) {
//         token = req.headers.authorization.split(' ')[1];
//         refreshToken = req.headers['x-refresh-token'];
//       }

//       if (!token || token === 'undefined') {
//         return next(new AppError('You are not logged in. Please log in to get access', 401));
//       }

//       // Try to verify access token SAFELY (returns null if expired, doesn't throw error)
//       let decoded = verifyTokenSafe(token, 'access');

//       // If access token is expired or invalid, try refresh token
//       if (!decoded) {
//         if (!refreshToken) {
//           return next(new AppError('Token expired. Please login again.', 401));
//         }

//         // Verify refresh token SAFELY
//         decoded = verifyTokenSafe(refreshToken, 'refresh');

//         if (!decoded) {
//           return next(new AppError('Session expired. Please login again.', 401));
//         }

//         // Generate new access token
//         const newAccessToken = generateAccessToken(
//           decoded.id,
//           decoded.role,
//           decoded.tokenVersion
//         );

//         // Set new token in response header or cookie
//         if (req.cookies) {
//           res.cookie('accessToken', newAccessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 5 * 60 * 1000
//           });
//         } else {
//           res.set('X-New-Access-Token', newAccessToken);
//         }

//         token = newAccessToken;
//       }

//       // Load full user from database based on role
//       let currentUser;
//       let userModel;

//       if (decoded.role === 'patient') {
//         currentUser = await Patient.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Patient';
//       } else if (decoded.role === 'doctor') {
//         currentUser = await Doctor.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Doctor';
//       } else if (decoded.role === 'hospital') {
//         currentUser = await Hospital.findById(decoded.id).select('+tokenVersion');
//         userModel = 'Hospital';
//       }

//       if (!currentUser) {
//         return next(new AppError('The user belonging to this token no longer exists', 401));
//       }

//       // Check token version (for logout all devices)
//       if (currentUser.tokenVersion !== decoded.tokenVersion) {
//         return next(new AppError('Your session has been invalidated. Please log in again', 401));
//       }

//       // Check if user is active
//       if (currentUser.isActive === false) {
//         return next(new AppError('Your account has been deactivated. Please contact support', 403));
//       }

//       // Grant access
//       req.user = currentUser;
//       req.user.role = decoded.role;
//       req.userModel = userModel;

//       // If specific roles are required
//       if (allowedRoles.length > 0) {
//         const userRole = decoded.role?.toLowerCase();

//         if (!allowedRoles.includes(userRole)) {
//           return next(new AppError(
//             `Access denied. Required roles: ${allowedRoles.join(', ')}`,
//             403
//           ));
//         }

//         req.userData = currentUser;
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };

// Keep all other middleware functions the same...



// const protect = (...allowedRoles) => {
//   return async (req, res, next) => {
//     try {
//       let token;

//       // Get token from cookies or Authorization header
//       if (req.cookies && req.cookies.accessToken) {
//         token = req.cookies.accessToken;
//       } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         token = req.headers.authorization.split(' ')[1];
//       }

//       // Better token validation
//       if (!token) {
//         return next(new AppError('You are not logged in. Please log in to get access', 401));
//       }

//       // Remove any potential quotes or whitespace
//       token = token.trim().replace(/^["']|["']$/g, '');

//       // Check if token is not 'undefined' or 'null' string
//       if (token === 'undefined' || token === 'null' || token === '') {
//         return next(new AppError('Invalid token. Please log in again', 401));
//       }

//       // Verify token - wrap in try-catch for better error handling
//       let decoded;
//       try {
//         decoded = verifyToken(token, 'access');
//       } catch (tokenError) {
//         console.error('Token verification error:', tokenError.message);
//         return next(new AppError('Invalid or expired token. Please log in again', 401));
//       }

//       // Load full user from database based on role
//       let currentUser;
//       let userModel;

//       if (decoded.role === 'patient') {
//         currentUser = await Patient.findById(decoded.id).select('tokenVersion isActive');
//         userModel = 'Patient';
//       } else if (decoded.role === 'doctor') {
//         currentUser = await Doctor.findById(decoded.id).select('tokenVersion isActive');
//         userModel = 'Doctor';
//       } else if (decoded.role === 'admin' || decoded.role === 'superAdmin') {
//         currentUser = await Admin.findById(decoded.id).select('tokenVersion isActive');
//         userModel = 'Admin';
//       }

//       if (!currentUser) {
//         return next(new AppError('The user belonging to this token no longer exists', 401));
//       }

//       // Check token version
//       if (currentUser.tokenVersion !== decoded.tokenVersion) {
//         return next(new AppError('Your session has been invalidated. Please log in again', 401));
//       }

//       // Check if user is active
//       if (currentUser.isActive === false) {
//         return next(new AppError('Your account has been deactivated. Please contact support', 403));
//       }

//       // Grant access
//       req.user = {
//         ...currentUser.toObject(),
//         id: decoded.id,
//         role: decoded.role
//       };
//       req.userModel = userModel;

//       // If specific roles are required
//       if (allowedRoles.length > 0) {
//         const userRole = decoded.role?.toLowerCase();
//         const normalizedRole = userRole === 'superadmin' ? 'admin' : userRole;
        
//         if (!allowedRoles.includes(normalizedRole)) {
//           return next(new AppError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403));
//         }
//       }

//       next();
//     } catch (error) {
//       console.error('Auth middleware error:', error);
//       next(error);
//     }
//   };
// };


const protect = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      let token;

      if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access', 401));
      }

      token = token.trim().replace(/^["']|["']$/g, '');

      if (token === 'undefined' || token === 'null' || token === '') {
        return next(new AppError('Invalid token. Please log in again', 401));
      }

      let decoded;
      try {
        decoded = verifyToken(token, 'access');
      } catch (tokenError) {
        console.error('Token verification error:', tokenError.message);
        return next(new AppError('Invalid or expired token. Please log in again', 401));
      }

      let currentUser;
      let userModel;

      if (decoded.role === 'patient') {
        currentUser = await Patient.findById(decoded.id).select('tokenVersion isActive');
        userModel = 'Patient';
      } else if (decoded.role === 'doctor') {
        currentUser = await Doctor.findById(decoded.id).select('tokenVersion isActive');
        userModel = 'Doctor';
      } else if (decoded.role === 'admin' || decoded.role === 'superAdmin') {
        currentUser = await Admin.findById(decoded.id).select('tokenVersion isActive');
        userModel = 'Admin';
      }

      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists', 401));
      }

      if (currentUser.tokenVersion !== decoded.tokenVersion) {
        return next(new AppError('Your session has been invalidated. Please log in again', 401));
      }

      if (currentUser.isActive === false) {
        return next(new AppError('Your account has been deactivated. Please contact support', 403));
      }

      // Normalize role for consistency: map superadmin to admin, lowercase all
      const userRoleRaw = decoded.role?.toLowerCase();
      const normalizedRole = userRoleRaw === 'superadmin' ? 'admin' : userRoleRaw;

      req.user = {
        ...currentUser.toObject(),
        id: decoded.id,
        role: normalizedRole
      };
      req.userModel = userModel;

      if (allowedRoles.length > 0) {
        if (!allowedRoles.includes(normalizedRole)) {
          return next(new AppError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403));
        }
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      next(error);
    }
  };
};

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
