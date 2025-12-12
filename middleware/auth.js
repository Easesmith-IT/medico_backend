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

const {
  verifyToken,
  verifyTokenSafe,
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");
const AppError = require("../utils/appError");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Admin = require("../models/adminModel");
const ServiceProvider = require("../models/serviceProviderModel");
/**
 * PROTECT MIDDLEWARE - Automatic token refresh on expiry
//  * @param  {...string} allowedRoles - Optional roles for authorization
//  */

// const protect = (...allowedRoles) => {
//   // Normalize allowedRoles (array of strings from rest params)
//   // Flatten roles and convert each to lowercase safely
//   const roles = allowedRoles
//     .flat()
//     .filter(r => typeof r === 'string')
//     .map(r => r.toLowerCase());

//   return async (req, res, next) => {
//     try {
//       let token;

//       if (req.cookies?.accessToken) {
//         token = req.cookies.accessToken;
//       } else if (
//         req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')
//       ) {
//         token = req.headers.authorization.split(' ')[1];
//       }

//       if (!token) {
//         return next(new AppError('You are not logged in. Please log in to get access', 401));
//       }

//       token = token.trim().replace(/^["']|["']$/g, '');

//       if (!token || token === 'undefined' || token === 'null') {
//         return next(new AppError('Invalid token. Please log in again', 401));
//       }

//       let decoded;
//       try {
//         decoded = verifyToken(token, 'access');
//       } catch (tokenError) {
//         return next(new AppError('Invalid or expired token. Please log in again', 401));
//       }

//       if (!decoded || !decoded.role || !decoded.id) {
//         return next(new AppError('Invalid token payload', 401));
//       }

//       // Normalize role (map superadmin to admin)
//       const userRole = decoded.role.toLowerCase() === 'superadmin' ? 'admin' : decoded.role.toLowerCase();

//       if (roles.length > 0 && !roles.includes(userRole)) {
//         return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
//       }

//       // Load user document from DB based on role
//       let currentUser;
//       let userModel;
//       switch (userRole) {
//         case 'patient':
//           currentUser = await Patient.findById(decoded.id).select('+tokenVersion isActive');
//           userModel = 'Patient';
//           break;
//         case 'doctor':
//           currentUser = await Doctor.findById(decoded.id).select('+tokenVersion isActive');
//           userModel = 'Doctor';
//           break;
//         case 'admin':
//           currentUser = await Admin.findById(decoded.id).select('+tokenVersion isActive email');
//           userModel = 'Admin';
//           break;
//         // Add other roles as necessary
//         default:
//           return next(new AppError('Your role is not authorized.', 403));
//       }

//       if (!currentUser) {
//         return next(new AppError('The user belonging to this token no longer exists', 401));
//       }

//       if (currentUser.tokenVersion !== decoded.tokenVersion) {
//         return next(new AppError('Your session has been invalidated. Please log in again', 401));
//       }

//       if (currentUser.isActive === false) {
//         return next(new AppError('Your account has been deactivated. Please contact support', 403));
//       }

//       req.user = {
//         ...currentUser.toObject(),
//         id: decoded.id,
//         role: userRole
//       };
//       req.userModel = userModel;

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };

// const protect = (...allowedRoles) => {
//   const normalizedAllowedRoles = allowedRoles
//     .flat()
//     .filter(r => typeof r === 'string')
//     .map(r => r.toLowerCase());

//   return async (req, res, next) => {
//     try {
//       let token =
//         req.cookies?.accessToken ||
//         (req.headers.authorization?.startsWith('Bearer')
//           ? req.headers.authorization.split(' ')[1]
//           : null);

//       if (!token)
//         return next(new AppError('You are not logged in. Please log in', 401));

//       token = token.trim().replace(/^["']|["']$/g, '');
//       if (!token || token === 'undefined' || token === 'null')
//         return next(new AppError('Invalid token. Please relogin', 401));

//       let decoded;
//       try {
//         decoded = verifyToken(token, 'access');
//       } catch {
//         return next(new AppError('Invalid or expired token', 401));
//       }

//       console.log("decoded", decoded);

//       const userRole = decoded.role?.toLowerCase();
//       if (!userRole || !decoded.id)
//         return next(new AppError('Invalid token payload', 401));

//       // STRICT ROLE CHECK
//       if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
//         return next(
//           new AppError(
//             `Access denied. Allowed roles: ${normalizedAllowedRoles.join(', ')}`,
//             403
//           )
//         );
//       }

//       // Load actual user record
//       let currentUser;
//       switch (userRole) {
//         case 'patient':
//           currentUser = await Patient.findById(decoded.id).select('+tokenVersion isActive');
//           break;
//         case 'doctor':
//           currentUser = await Doctor.findById(decoded.id).select('+tokenVersion isActive');
//           break;
//         case 'admin':
//         case 'superadmin':
//         case 'subadmin':
//           currentUser = await Admin.findById(decoded.id).select('+tokenVersion isActive email');
//           break;
//         default:
//           return next(new AppError('Unauthorized role', 403));
//       }

//       if (!currentUser)
//         return next(new AppError('User no longer exists', 401));

//       if (currentUser.tokenVersion !== decoded.tokenVersion)
//         return next(new AppError('Session expired. Relogin', 401));

//       if (currentUser.isActive === false)
//         return next(new AppError('Account disabled', 403));

//       req.user = {
//         ...currentUser.toObject(),
//         id: decoded.id,
//         role: userRole
//       };

//       next();
//     } catch (err) {
//       next(err);
//     }
//   };
// };

const shouldRenewRefreshToken = (decoded) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - now;
  const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);

  // Renew if less than 30 days remaining
  return daysUntilExpiry < 30;
};

const protect = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .flat()
    .filter((r) => typeof r === "string")
    .map((r) => r.toLowerCase());

  return async (req, res, next) => {
    try {
      console.log("Cookies:", req.cookies);
      console.log("Headers:", req.headers.authorization);
      console.log("All headers:", req.headers);

      let { accessToken, refreshToken } = req.cookies;

      // Check Authorization header fallback
      if (
        !accessToken &&
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        accessToken = req.headers.authorization.split(" ")[1];
        console.log("Using token from Authorization header");
      }

      // If no tokens at all → block
      if (
        (!accessToken || accessToken === "undefined") &&
        (!refreshToken || refreshToken === "undefined")
      ) {
        return next(new AppError("Not authorized to access this route", 401));
      }

      let decoded;

      // ---------------------------------------------------------
      // 1) TRY ACCESS TOKEN
      // ---------------------------------------------------------
      if (accessToken && accessToken !== "undefined") {
        try {
          decoded = verifyToken(accessToken, "access");
          console.log("Access token decoded:", decoded);

          const user = await loadUserByRole(decoded.role, decoded.id, true);
          console.log("user", user);

          if (user) {
            req.user = decoded;
            return authorizeAndContinue(
              req,
              decoded?.role,
              normalizedAllowedRoles,
              next
            );
          }
        } catch (err) {
          console.log("Access token expired, attempting refresh:", err.message);
        }
      }

      // ---------------------------------------------------------
      // 2) TRY REFRESH TOKEN
      // ---------------------------------------------------------
      if (refreshToken && refreshToken !== "undefined") {
        try {
          const refreshDecoded = verifyToken(refreshToken, "refresh");
          console.log("Refresh token decoded:", {
            id: refreshDecoded.id,
            role: refreshDecoded.role,
            tokenVersion: refreshDecoded.tokenVersion,
          });

          let user = await loadUserByRole(
            refreshDecoded.role,
            refreshDecoded.id,
            true
          );

          if (!user) {
            console.log("User not found for refresh token");

            clearAuthCookies(res);

            req.user = null;
            return next();
          }

          // Ensure tokenVersion field exists
          if (user.tokenVersion === undefined || user.tokenVersion === null) {
            user.tokenVersion = 0;
            await user.save({ validateBeforeSave: false });
          }

          console.log("Refresh token verified successfully");

          // Generate new tokens
          const newAccessToken = generateAccessToken(
            user._id,
            refreshDecoded.role,
            user.tokenVersion
          );

          let newRefreshToken = refreshToken;

          if (shouldRenewRefreshToken(refreshDecoded)) {
            newRefreshToken = generateRefreshToken(
              user._id,
              refreshDecoded.role,
              user.tokenVersion
            );
          }

          // Set cookies
          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
          });

          if (newRefreshToken !== refreshToken) {
            res.cookie("refreshToken", newRefreshToken, {
              httpOnly: true,
              secure: true,
              sameSite: "none",
              maxAge: 365 * 24 * 60 * 60 * 1000,
            });
          }

          req.user = refreshDecoded;

          return authorizeAndContinue(
            req,
            refreshDecoded?.role,
            normalizedAllowedRoles,
            next
          );
        } catch (err) {
          console.log("Refresh token failed:", err.message);

          clearAuthCookies(res);

          req.user = null;
          return next();
        }
      }

      req.user = null;
      return next();
    } catch (err) {
      next(err);
    }
  };
};

// async function loadUserByRole(role, id, includeTokenVersion = false) {
//   if (!role) return null;

//   const selectFields = includeTokenVersion
//     ? "+tokenVersion isActive email"
//     : "";

//   switch (role.toLowerCase()) {
//     case "doctor":
//       return await Doctor.findById(id).select(selectFields);

//     case "admin":
//     case "superadmin":
//     case "subadmin":
//       return await Admin.findById(id).select(selectFields);

//     default:
//       return null;
//   }
// }
async function loadUserByRole(role, id, includeTokenVersion = false) {
  if (!role) return null;

  const selectFields = includeTokenVersion
    ? "+tokenVersion isActive email"
    : "";

  switch (role.toLowerCase()) {
    case "doctor":
      return await Doctor.findById(id).select(selectFields);

    case "patient":                           // ✅ ADD THIS LINE
      return await Patient.findById(id).select(selectFields);

    case "admin":
    case "superadmin":
    case "subadmin":
      return await Admin.findById(id).select(selectFields);

    default:
      return null;
  }
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}

function authorizeAndContinue(req, role, allowedRoles, next) {
  // const userRole = role;
  const userRole = role?.toLowerCase(); 
  if (!userRole) {
    return next(new AppError("Invalid token payload", 401));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return next(
      new AppError(
        `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
        403
      )
    );
  }

  if (req.user.isActive === false) {
    return next(new AppError("Account disabled", 403));
  }

  return next();
}

const verifyAccessToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(new AppError("No access token provided", 401));
    }

    const decoded = verifyToken(token, "access");
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
      return next(new AppError("No refresh token provided", 401));
    }

    const decoded = verifyToken(token, "refresh");
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyOtpToken = (req, res, next) => {
  try {
    const token = req.headers["x-otp-token"] || req.body.otpToken;

    if (!token) {
      return next(new AppError("No OTP token provided", 401));
    }

    const decoded = verifyToken(token, "otp");
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
      return next(new AppError("No access token provided", 401));
    }

    const decoded = verifyToken(token, "access");

    if (decoded.role !== "superAdmin" && decoded.role !== "subAdmin") {
      return next(
        new AppError("Access denied. Admin privileges required.", 403)
      );
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
      return next(new AppError("No access token provided", 401));
    }

    const decoded = verifyToken(token, "access");

    if (decoded.role !== "superAdmin") {
      return next(
        new AppError("Access denied. Super admin privileges required.", 403)
      );
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
      return next(new AppError("No access token provided", 401));
    }

    const decoded = verifyToken(token, "access");

    if (decoded.role !== "doctor") {
      return next(
        new AppError("Access denied. Doctor privileges required.", 403)
      );
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
      return next(new AppError("No access token provided", 401));
    }

    const decoded = verifyToken(token, "access");

    if (decoded.role !== "patient") {
      return next(
        new AppError("Access denied. Patient privileges required.", 403)
      );
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
  verifyPatientRole,
};
