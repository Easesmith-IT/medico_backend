

// const {
//   verifyToken,
//   verifyTokenSafe,
//   generateAccessToken,
//   generateRefreshToken,
// } = require("../utils/tokenUtils");
// const AppError = require("../utils/appError");
// const Patient = require("../models/patientModel");
// const Doctor = require("../models/doctorModel");
// const Admin = require("../models/adminModel");
// const ServiceProvider = require("../models/serviceProviderModel");
// /**
//  * PROTECT MIDDLEWARE - Automatic token refresh on expiry
// //  * @param  {...string} allowedRoles - Optional roles for authorization
// //  */


// const shouldRenewRefreshToken = (decoded) => {
//   const now = Date.now() / 1000;
//   const timeUntilExpiry = decoded.exp - now;
//   const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);

//   // Renew if less than 30 days remaining
//   return daysUntilExpiry < 30;
// };

// const protect = (...allowedRoles) => {
//   const normalizedAllowedRoles = allowedRoles
//     .flat()
//     .filter((r) => typeof r === "string")
//     .map((r) => r.toLowerCase());

//   return async (req, res, next) => {
//     try {
//       console.log("Cookies:", req.cookies);
//       console.log("Headers:", req.headers.authorization);
//       console.log("All headers:", req.headers);

//       let { accessToken, refreshToken } = req.cookies;

//       // Check Authorization header fallback
//       if (
//         !accessToken &&
//         req.headers.authorization &&
//         req.headers.authorization.startsWith("Bearer")
//       ) {
//         accessToken = req.headers.authorization.split(" ")[1];
//         console.log("Using token from Authorization header");
//       }

//       // If no tokens at all → block
//       if (
//         (!accessToken || accessToken === "undefined") &&
//         (!refreshToken || refreshToken === "undefined")
//       ) {
//         clearAuthCookies(res);
//         return next(new AppError("Not authorized to access this route", 401));
//       }

//       let decoded;

//       // ---------------------------------------------------------
//       // 1) TRY ACCESS TOKEN
//       // ---------------------------------------------------------
//       if (accessToken && accessToken !== "undefined") {
//         try {
//           decoded = verifyToken(accessToken, "access");
//           console.log("Access token decoded:", decoded);

//           const user = await loadUserByRole(decoded.role, decoded.id, true);
//           console.log("user", user);

//           if (user) {
//             req.user = decoded;
//             return authorizeAndContinue(
//               req,
//               decoded?.role,
//               normalizedAllowedRoles,
//               next
//             );
//           }
//         } catch (err) {
//           console.log("Access token expired, attempting refresh:", err.message);
//         }
//       }

//       // ---------------------------------------------------------
//       // 2) TRY REFRESH TOKEN
//       // ---------------------------------------------------------
//       if (refreshToken && refreshToken !== "undefined") {
//         try {
//           const refreshDecoded = verifyToken(refreshToken, "refresh");
//           console.log("Refresh token decoded:", {
//             id: refreshDecoded.id,
//             role: refreshDecoded.role,
//             tokenVersion: refreshDecoded.tokenVersion,
//           });

//           let user = await loadUserByRole(
//             refreshDecoded.role,
//             refreshDecoded.id,
//             true
//           );

//           if (!user) {
//             console.log("User not found for refresh token");

//             clearAuthCookies(res);

//             req.user = null;
//             return next();
//           }

//           // Ensure tokenVersion field exists
//           if (user.tokenVersion === undefined || user.tokenVersion === null) {
//             user.tokenVersion = 0;
//             await user.save({ validateBeforeSave: false });
//           }

//           console.log("Refresh token verified successfully");

//           // Generate new tokens
//           const newAccessToken = generateAccessToken(
//             user._id,
//             refreshDecoded.role,
//             user.tokenVersion
//           );

//           let newRefreshToken = refreshToken;

//           if (shouldRenewRefreshToken(refreshDecoded)) {
//             newRefreshToken = generateRefreshToken(
//               user._id,
//               refreshDecoded.role,
//               user.tokenVersion
//             );
//           }

//           // Set cookies
//           res.cookie("accessToken", newAccessToken, {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none",
//             maxAge: 24 * 60 * 60 * 1000,
//           });

//           if (newRefreshToken !== refreshToken) {
//             res.cookie("refreshToken", newRefreshToken, {
//               httpOnly: true,
//               secure: true,
//               sameSite: "none",
//               maxAge: 365 * 24 * 60 * 60 * 1000,
//             });
//           }

//           req.user = refreshDecoded;

//           return authorizeAndContinue(
//             req,
//             refreshDecoded?.role,
//             normalizedAllowedRoles,
//             next
//           );
//         } catch (err) {
//           console.log("Refresh token failed:", err.message);

//           clearAuthCookies(res);

//           req.user = null;
//           return next();
//         }
//       }

//       req.user = null;
//       return next();
//     } catch (err) {
//       next(err);
//     }
//   };
// };


// async function loadUserByRole(role, id, includeTokenVersion = false) {
//   if (!role) return null;

//   const selectFields = includeTokenVersion
//     ? "+tokenVersion isActive email"
//     : "";

//   switch (role.toLowerCase()) {
//     case "doctor":
//       return await Doctor.findById(id).select(selectFields);

//     case "patient":                           //  ADD THIS LINE
//       return await Patient.findById(id).select(selectFields);

//     case "admin":
//     case "superadmin":
//     case "subadmin":
//       return await Admin.findById(id).select(selectFields);

//     default:
//       return null;
//   }
// }

// const isProduction = process.env.NODE_ENV === "production";

// function clearAuthCookies(res) {
//  const cookieOptions = {
//    httpOnly: true,
//    secure: isProduction,
//    sameSite: isProduction ? "none" : "lax",
//    ...(isProduction && { domain: ".rehabmedico.in" }),
//  };

//  // Clear accessToken
//  res.clearCookie("accessToken", cookieOptions);

//  // Clear refreshToken
//  res.clearCookie("refreshToken", cookieOptions);

//  // Clear isAuthenticated (this one is not httpOnly)
//  res.clearCookie("isAuthenticated", {
//    httpOnly: false,
//    secure: isProduction,
//    sameSite: isProduction ? "none" : "lax",
//    ...(isProduction && { domain: ".rehabmedico.in" }),
//  });
// }

// function authorizeAndContinue(req, role, allowedRoles, next) {
//   // const userRole = role;
//   const userRole = role?.toLowerCase(); 
//   if (!userRole) {
//     return next(new AppError("Invalid token payload", 401));
//   }

//   if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
//     return next(
//       new AppError(
//         `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
//         403
//       )
//     );
//   }

//   if (req.user.isActive === false) {
//     return next(new AppError("Account disabled", 403));
//   }

//   return next();
// }

// const verifyAccessToken = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError("No access token provided", 401));
//     }

//     const decoded = verifyToken(token, "access");
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// const verifyRefreshToken = (req, res, next) => {
//   try {
//     const token = req.cookies?.refreshToken;

//     if (!token) {
//       return next(new AppError("No refresh token provided", 401));
//     }

//     const decoded = verifyToken(token, "refresh");
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// const verifyOtpToken = (req, res, next) => {
//   try {
//     const token = req.headers["x-otp-token"] || req.body.otpToken;

//     if (!token) {
//       return next(new AppError("No OTP token provided", 401));
//     }

//     const decoded = verifyToken(token, "otp");
//     req.otpData = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// const verifyAdminRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError("No access token provided", 401));
//     }

//     const decoded = verifyToken(token, "access");

//     if (decoded.role !== "superAdmin" && decoded.role !== "subAdmin") {
//       return next(
//         new AppError("Access denied. Admin privileges required.", 403)
//       );
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
//       return next(new AppError("No access token provided", 401));
//     }

//     const decoded = verifyToken(token, "access");

//     if (decoded.role !== "superAdmin") {
//       return next(
//         new AppError("Access denied. Super admin privileges required.", 403)
//       );
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// const verifyDoctorRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError("No access token provided", 401));
//     }

//     const decoded = verifyToken(token, "access");

//     if (decoded.role !== "doctor") {
//       return next(
//         new AppError("Access denied. Doctor privileges required.", 403)
//       );
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// const verifyPatientRole = (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(new AppError("No access token provided", 401));
//     }

//     const decoded = verifyToken(token, "access");

//     if (decoded.role !== "patient") {
//       return next(
//         new AppError("Access denied. Patient privileges required.", 403)
//       );
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
//   verifyPatientRole,
// };


// authMiddleware.js (or wherever this file lives)
const {
  verifyToken,
  verifyTokenSafe,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/tokenUtils");
const AppError = require("../utils/appError");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Admin = require("../models/adminModel");
const ServiceProvider = require("../models/serviceProviderModel");

/**
 * Decide if refresh token should be renewed (every 30 days)
 */
const shouldRenewRefreshToken = (decoded) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - now;
  const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);
  return daysUntilExpiry < 30;
};

/**
 * Load user by role and handle tokenVersion synchronization
 */
async function loadUserByRole(role, id, includeTokenVersion = false) {
  if (!role || !id) {
    console.log("loadUserByRole: missing role/id", { role, id });
    return null;
  }

  const selectFields = includeTokenVersion ? "+tokenVersion isActive email" : "";
  const roleLower = role.toLowerCase();
  
  let userDoc;
  switch (roleLower) {
    case "doctor":
      userDoc = await Doctor.findById(id).select(selectFields);
      break;
    case "patient":
      userDoc = await Patient.findById(id).select(selectFields);
      break;
    case "admin":
    case "superadmin":
    case "subadmin":
      userDoc = await Admin.findById(id).select(selectFields);
      break;
    case "serviceprovider":
      userDoc = await ServiceProvider.findById(id).select(selectFields);
      break;
    default:
      return null;
  }

  if (userDoc && includeTokenVersion) {
    if (userDoc.tokenVersion === undefined || userDoc.tokenVersion === null) {
      userDoc.tokenVersion = 0;
      await userDoc.save({ validateBeforeSave: false });
    }
    if (typeof userDoc.tokenVersion !== 'number') {
      userDoc.tokenVersion = parseInt(userDoc.tokenVersion) || 0;
      await userDoc.save({ validateBeforeSave: false });
    }
  }

  return userDoc;
}

/**
 * Role authorization helper
 */
function authorizeAndContinue(req, role, allowedRoles, next) {
  const userRole = role?.toLowerCase();
  
  if (!userRole) {
    return next(new AppError("Invalid user role", 401));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return next(new AppError(`Access denied for ${userRole}`, 403));
  }

  if (req.user.isActive === false) {
    return next(new AppError("Account disabled", 403));
  }

  next();
}

/**
 * MAIN PROTECT MIDDLEWARE
 * Fixed: Added optional chaining to prevent 'undefined' property crashes
 */
const protect = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .flat()
    .filter((r) => typeof r === "string")
    .map((r) => r.toLowerCase());

  return async (req, res, next) => {
    try {
      // FIX: Use optional chaining (?.) on req.cookies
      let accessToken = req.cookies?.accessToken;
      let refreshToken = req.cookies?.refreshToken;

      if (!accessToken && req.headers.authorization?.startsWith("Bearer")) {
        accessToken = req.headers.authorization.split(" ")[1];
      }

      if ((!accessToken || accessToken === "undefined") && (!refreshToken || refreshToken === "undefined")) {
        clearAuthCookies(res);
        return next(new AppError("Please login first", 401));
      }

      let decoded, userDoc;

      // 1. TRY ACCESS TOKEN
      if (accessToken && accessToken !== "undefined") {
        try {
          decoded = verifyToken(accessToken, "access");
          userDoc = await loadUserByRole(decoded.role, decoded.id, true);
          
          if (userDoc && userDoc.tokenVersion === decoded.tokenVersion) {
            req.user = {
              ...userDoc.toObject(),
              id: decoded.id,
              _id: decoded.id,
              role: decoded.role,
              tokenVersion: decoded.tokenVersion,
              isActive: userDoc.isActive !== false,
            };

            return authorizeAndContinue(req, req.user.role, normalizedAllowedRoles, next);
          }
        } catch (err) {
          console.log("Access expired, checking refresh...");
        }
      }

      // 2. TRY REFRESH TOKEN (Auto-Refresh)
      if (refreshToken && refreshToken !== "undefined") {
        try {
          const refreshDecoded = verifyToken(refreshToken, "refresh");
          userDoc = await loadUserByRole(refreshDecoded.role, refreshDecoded.id, true);
          
          if (!userDoc || userDoc.tokenVersion !== refreshDecoded.tokenVersion) {
            clearAuthCookies(res);
            return next(new AppError("Session invalid", 401));
          }

          const newAccessToken = generateAccessToken(userDoc._id, refreshDecoded.role, userDoc.tokenVersion);
          let newRefreshToken = refreshToken;
          
          if (shouldRenewRefreshToken(refreshDecoded)) {
            newRefreshToken = generateRefreshToken(userDoc._id, refreshDecoded.role, userDoc.tokenVersion);
          }

          setAuthCookies(res, newAccessToken, newRefreshToken);

          req.user = {
            ...userDoc.toObject(),
            id: refreshDecoded.id,
            _id: refreshDecoded.id,
            role: refreshDecoded.role,
            tokenVersion: refreshDecoded.tokenVersion,
            isActive: userDoc.isActive !== false,
          };

          return authorizeAndContinue(req, req.user.role, normalizedAllowedRoles, next);
        } catch (err) {
          clearAuthCookies(res);
          return next(new AppError("Session expired. Please login again", 401));
        }
      }

      return next(new AppError("Authentication failed", 401));
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Simple access token verification
 */
const verifyAccessToken = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    let token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return next(new AppError("No access token", 401));

    const decoded = verifyToken(token, "access");
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role, tokenVersion: decoded.tokenVersion, isActive: true };
    next();
  } catch (error) {
    next(error);
  }
};

const verifyRefreshToken = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    const token = req.cookies?.refreshToken;
    if (!token) return next(new AppError("No refresh token", 401));
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
    if (!token) return next(new AppError("No OTP token", 401));
    const decoded = verifyToken(token, "otp");
    req.otpData = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-specific middlewares
 */
const verifyAdminRole = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    let token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return next(new AppError("No token", 401));
    const decoded = verifyToken(token, "access");
    if (!["admin", "superadmin", "subadmin"].includes(decoded.role)) return next(new AppError("Admin required", 403));
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

const verifySuperAdminRole = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    let token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return next(new AppError("No token", 401));
    const decoded = verifyToken(token, "access");
    if (decoded.role !== "superadmin") return next(new AppError("Super admin required", 403));
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyDoctorRole = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    let token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return next(new AppError("No token", 401));
    const decoded = verifyToken(token, "access");
    if (decoded.role !== "doctor") return next(new AppError("Doctor required", 403));
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyPatientRole = (req, res, next) => {
  try {
    // FIX: Use optional chaining
    let token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return next(new AppError("No token", 401));
    const decoded = verifyToken(token, "access");
    if (decoded.role !== "patient") return next(new AppError("Patient required", 403));
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

