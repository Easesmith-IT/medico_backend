

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
} = require("../utils/tokenUtils");
const AppError = require("../utils/appError");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Admin = require("../models/adminModel");
const ServiceProvider = require("../models/serviceProviderModel");

const isProduction = process.env.NODE_ENV === "production";

/**
 * Decide if refresh token should be renewed
 */
const shouldRenewRefreshToken = (decoded) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - now;
  const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);
  return daysUntilExpiry < 30;
};

/**
 * ✅ FIXED: Load user by role - handles ALL case variations
 */
async function loadUserByRole(role, id, includeTokenVersion = false) {
  if (!role || !id) {
    console.log("❌ loadUserByRole: missing role/id", { role, id });
    return null;
  }

  const selectFields = includeTokenVersion
    ? "+tokenVersion isActive email"
    : "";

  // ✅ FORCE LOWERCASE for switch matching
  const roleLower = role.toString().toLowerCase();
  console.log("🔍 loadUserByRole: roleLower =", roleLower);

  switch (roleLower) {
    case "doctor":
      return await Doctor.findById(id).select(selectFields);
    case "patient":
      return await Patient.findById(id).select(selectFields);
    case "admin":
    case "superadmin":
    case "subadmin":
      return await Admin.findById(id).select(selectFields);
    default:
      console.log("❌ UNKNOWN ROLE:", roleLower);
      return null;
  }
}

/**
 * ✅ FIXED: Main protect middleware
 */
const protect = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .flat()
    .filter((r) => typeof r === "string")
    .map((r) => r.toLowerCase());

  return async (req, res, next) => {
    try {
      console.log("🔥 PROTECT START");
      let { accessToken, refreshToken } = req.cookies;

      // Fallback: Authorization header
      if (
        !accessToken &&
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        accessToken = req.headers.authorization.split(" ")[1];
        console.log("Using token from Authorization header");
      }

      // No tokens → 401
      if (
        (!accessToken || accessToken === "undefined") &&
        (!refreshToken || refreshToken === "undefined")
      ) {
        clearAuthCookies(res);
        return next(new AppError("Not authorized to access this route", 401));
      }

      let decoded, userDoc;

      // 1) TRY ACCESS TOKEN
      if (accessToken && accessToken !== "undefined") {
        try {
          decoded = verifyToken(accessToken, "access");
          console.log("✅ Access token decoded:", decoded);

          userDoc = await loadUserByRole(decoded.role, decoded.id, true);
          
          if (userDoc) {
            // ✅ FIXED: Proper req.user structure for controller
            req.user = {
              ...userDoc.toObject(),
              id: decoded.id,
              _id: decoded.id,        // ✅ Controller needs _id
              role: decoded.role.toLowerCase(),  // ✅ Lowercase for controller
              tokenVersion: decoded.tokenVersion,
              isActive: userDoc.isActive !== false,  // ✅ Ensure boolean
              type: decoded.type,
            };
            console.log("✅ req.user set (access):", { id: req.user.id, role: req.user.role });

            return authorizeAndContinue(
              req,
              req.user.role,
              normalizedAllowedRoles,
              next
            );
          }
        } catch (err) {
          console.log("Access token expired, trying refresh:", err.message);
        }
      }

      // 2) TRY REFRESH TOKEN
      if (refreshToken && refreshToken !== "undefined") {
        try {
          const refreshDecoded = verifyToken(refreshToken, "refresh");
          console.log("✅ Refresh token decoded:", {
            id: refreshDecoded.id,
            role: refreshDecoded.role,
          });

          userDoc = await loadUserByRole(refreshDecoded.role, refreshDecoded.id, true);

          if (!userDoc) {
            console.log("❌ User not found for refresh");
            clearAuthCookies(res);
            return next(new AppError("User not found", 401));
          }

          // Fix tokenVersion
          if (userDoc.tokenVersion === undefined || userDoc.tokenVersion === null) {
            userDoc.tokenVersion = 0;
            await userDoc.save({ validateBeforeSave: false });
          }

          // Generate new tokens
          const newAccessToken = generateAccessToken(
            userDoc._id,
            refreshDecoded.role,
            userDoc.tokenVersion
          );

          let newRefreshToken = refreshToken;
          if (shouldRenewRefreshToken(refreshDecoded)) {
            newRefreshToken = generateRefreshToken(
              userDoc._id,
              refreshDecoded.role,
              userDoc.tokenVersion
            );
          }

          // Set new cookies
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

          // ✅ FIXED: Proper req.user structure for controller
          req.user = {
            ...userDoc.toObject(),
            id: refreshDecoded.id,
            _id: refreshDecoded.id,           // ✅ Controller needs _id
            role: refreshDecoded.role.toLowerCase(),  // ✅ Lowercase
            tokenVersion: refreshDecoded.tokenVersion,
            isActive: userDoc.isActive !== false,     // ✅ Ensure boolean
            type: refreshDecoded.type,
          };

          console.log("✅ req.user set (refresh):", { id: req.user.id, role: req.user.role });

          return authorizeAndContinue(
            req,
            req.user.role,
            normalizedAllowedRoles,
            next
          );
        } catch (err) {
          console.log("❌ Refresh failed:", err.message);
          clearAuthCookies(res);
          return next(new AppError("Invalid refresh token", 401));
        }
      }

      // No valid tokens
      return next(new AppError("No valid tokens", 401));
    } catch (err) {
      console.log("❌ PROTECT ERROR:", err);
      next(err);
    }
  };
};

/**
 * Clear auth cookies
 */
function clearAuthCookies(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(isProduction && { domain: ".rehabmedico.in" }),
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("isAuthenticated", {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    ...(isProduction && { domain: ".rehabmedico.in" }),
  });
}

/**
 * Role + isActive authorization
 */
function authorizeAndContinue(req, role, allowedRoles, next) {
  const userRole = role?.toLowerCase();
  
  if (!userRole) {
    return next(new AppError("Invalid token payload", 401));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return next(
      new AppError(`Access denied. Allowed: ${allowedRoles.join(", ")}`, 403)
    );
  }

  if (req.user.isActive === false) {
    return next(new AppError("Account disabled", 403));
  }

  console.log("✅ AUTHORIZED:", { role: userRole });
  next();
}

// Keep all your other middleware unchanged
const verifyAccessToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return next(new AppError("No access token provided", 401));
    }
    const decoded = verifyToken(token, "access");
    req.user = {
      ...decoded,
      _id: decoded.id,
      role: decoded.role?.toLowerCase(),
      isActive: true
    };
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
      return next(new AppError("Access denied. Admin privileges required.", 403));
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
      return next(new AppError("Access denied. Super admin privileges required.", 403));
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
      return next(new AppError("Access denied. Doctor privileges required.", 403));
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
      return next(new AppError("Access denied. Patient privileges required.", 403));
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
