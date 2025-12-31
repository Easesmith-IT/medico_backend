

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


const shouldRenewRefreshToken = (decoded) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - now;
  const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);

  // Renew if less than 30 days remaining
  return daysUntilExpiry < 30;
};

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

//wprking one

// const protect = (...allowedRoles) => {
//   const normalizedAllowedRoles = allowedRoles.flat().filter(r => typeof r === "string").map(r => r.toLowerCase());

//   return async (req, res, next) => {
//     try {
//       let { accessToken, refreshToken } = req.cookies;

//       // Header Fallback
//       if (!accessToken && req.headers.authorization?.startsWith("Bearer")) {
//         accessToken = req.headers.authorization.split(" ")[1]?.trim().replace(/^["'](.+)["']$/, '$1');
//       }

//       // ---------------------------------------------------------
//       // 1) TRY ACCESS TOKEN
//       // ---------------------------------------------------------
//       if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
//         try {
//           const decoded = verifyToken(accessToken, "access");
//           const user = await loadUserByRole(decoded.role, decoded.id, true);

//           if (user) {
//             // FIX: Attach email and firstName for the Service Schema validation
//             req.user = { 
//               ...decoded, 
//               isActive: user.isActive,
//               email: user.email,
//               firstName: user.firstName 
//             }; 
//             return authorizeAndContinue(req, decoded?.role, normalizedAllowedRoles, next);
//           }
//         } catch (err) {
//           // Just log the error; don't use 'refreshDecoded' here as it doesn't exist yet
//           console.log("Access token invalid, moving to refresh check...");
//         }
//       }

//       // ---------------------------------------------------------
//       // 2) TRY REFRESH TOKEN
//       // ---------------------------------------------------------
//       if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
//         try {
//           const refreshDecoded = verifyToken(refreshToken, "refresh");
//           let user = await loadUserByRole(refreshDecoded.role, refreshDecoded.id, true);

//           if (!user) {
//             clearAuthCookies(res);
//             return next(new AppError("Session expired. Please login again.", 401));
//           }

//           // Generate new access token
//           const newAccessToken = generateAccessToken(user._id, refreshDecoded.role, user.tokenVersion);

//           res.cookie("accessToken", newAccessToken, {
//             httpOnly: true, secure: true, sameSite: "none", maxAge: 24 * 60 * 60 * 1000,
//           });

//           // FIX: Attach email and firstName here for refreshed sessions
//           req.user = { 
//             ...refreshDecoded, 
//             isActive: user.isActive,
//             email: user.email,
//             firstName: user.firstName
//           };

//           // return authorizeAndContinue(req, refreshDecoded?.role, normalizedAllowedRoles, next);
//           req.user.role = decoded.role.toLowerCase();
// return authorizeAndContinue(req, req.user.role, normalizedAllowedRoles, next);

//         } catch (err) {
//           clearAuthCookies(res);
//           return next(new AppError("Session expired. Please login again.", 401));
//         }
//       }

//       return next(new AppError("Authentication required", 401));
//     } catch (err) {
//       next(err);
//     }
//   };
// };

const protect = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .flat()
    .filter(r => typeof r === "string")
    .map(r => r.toLowerCase());

  return async (req, res, next) => {
    try {
      let { accessToken, refreshToken } = req.cookies;

      // Header fallback
      if (!accessToken && req.headers.authorization?.startsWith("Bearer")) {
        accessToken = req.headers.authorization.split(" ")[1]?.trim();
      }

      // -------------------- ACCESS TOKEN --------------------
      if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
        try {
          const decoded = verifyToken(accessToken, "access");
          const user = await loadUserByRole(decoded.role, decoded.id, true);

          if (user) {
            req.user = {
              ...decoded,
              role: decoded.role.toLowerCase(), // 🔥 FIX
              isActive: user.isActive,
              email: user.email,
              firstName: user.firstName
            };

            return authorizeAndContinue(
              req,
              req.user.role,                 // 🔥 FIX
              normalizedAllowedRoles,
              next
            );
          }
        } catch (err) {
          console.log("Access token invalid, trying refresh...");
        }
      }

      // -------------------- REFRESH TOKEN --------------------
      if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
        try {
          const refreshDecoded = verifyToken(refreshToken, "refresh");
          const user = await loadUserByRole(refreshDecoded.role, refreshDecoded.id, true);

          if (!user) {
            clearAuthCookies(res);
            return next(new AppError("Session expired. Please login again.", 401));
          }

          const newAccessToken = generateAccessToken(
            user._id,
            refreshDecoded.role.toLowerCase(), // 🔥 FIX
            user.tokenVersion
          );

          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
          });

          req.user = {
            ...refreshDecoded,
            role: refreshDecoded.role.toLowerCase(), // 🔥 FIX
            isActive: user.isActive,
            email: user.email,
            firstName: user.firstName
          };

          return authorizeAndContinue(
            req,
            req.user.role,                 // 🔥 FIX
            normalizedAllowedRoles,
            next
          );
        } catch (err) {
          clearAuthCookies(res);
          return next(new AppError("Session expired. Please login again.", 401));
        }
      }

      return next(new AppError("Authentication required", 401));
    } catch (err) {
      next(err);
    }
  };
};


// const protect = (...allowedRoles) => {
//   const normalizedAllowedRoles = allowedRoles
//     .flat()
//     .filter((r) => typeof r === "string")
//     .map((r) => r.toLowerCase());

//   return async (req, res, next) => {
//     try {
//       let { accessToken, refreshToken } = req.cookies;

//       // 1. Robust Authorization header fallback
//       if (
//         !accessToken &&
//         req.headers.authorization &&
//         req.headers.authorization.startsWith("Bearer")
//       ) {
//         // .trim() and .replace removes potential malformed characters like quotes or spaces
//         accessToken = req.headers.authorization.split(" ")[1]?.trim().replace(/^["'](.+)["']$/, '$1');
//         console.log("Using token from Authorization header");
//       }

//       // 2. Immediate block if no tokens present
//       if (
//         (!accessToken || accessToken === "undefined" || accessToken === "null") &&
//         (!refreshToken || refreshToken === "undefined" || refreshToken === "null")
//       ) {
//         clearAuthCookies(res);
//         return next(new AppError("Not authorized to access this route", 401));
//       }

//       // ---------------------------------------------------------
//       // 1) TRY ACCESS TOKEN
//       // ---------------------------------------------------------
//       if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
//         try {
//           const decoded = verifyToken(accessToken, "access");
//           const user = await loadUserByRole(decoded.role, decoded.id, true);

//           if (user) {
//             // req.user = { ...decoded, isActive: user.isActive }; // Attach user status
//                req.user = { 
//             ...refreshDecoded, 
//             isActive: user.isActive,
//             email: user.email,
//             firstName: user.firstName
//           };
//             return authorizeAndContinue(
//               req,
//               decoded?.role,
//               normalizedAllowedRoles,
//               next
//             );
//           }
//         } catch (err) {
//           // If the token is physically malformed, do not attempt refresh; block immediately
//           if (err.message.includes("jwt malformed")) {
//             console.log("Blocking malformed JWT");
//             return next(new AppError("Invalid token format. Please login again.", 401));
//           }
//           console.log("Access token expired/invalid, attempting refresh:", err.message);
//         }
//       }

//       // ---------------------------------------------------------
//       // 2) TRY REFRESH TOKEN
//       // ---------------------------------------------------------
//       if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
//         try {
//           const refreshDecoded = verifyToken(refreshToken, "refresh");
//           let user = await loadUserByRole(refreshDecoded.role, refreshDecoded.id, true);

//           if (!user) {
//             clearAuthCookies(res);
//             return next(new AppError("Session expired. Please login again.", 401));
//           }

//           // Safety check for token version
//           if (user.tokenVersion === undefined || user.tokenVersion === null) {
//             user.tokenVersion = 0;
//             await user.save({ validateBeforeSave: false });
//           }

//           // Generate new access token
//           const newAccessToken = generateAccessToken(user._id, refreshDecoded.role, user.tokenVersion);

//           // Set refreshed access token cookie
//           res.cookie("accessToken", newAccessToken, {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none",
//             maxAge: 24 * 60 * 60 * 1000,
//           });

//           req.user = { ...refreshDecoded, isActive: user.isActive };
//           return authorizeAndContinue(req, refreshDecoded?.role, normalizedAllowedRoles, next);
//         } catch (err) {
//           clearAuthCookies(res);
//           return next(new AppError("Session expired. Please login again.", 401));
//         }
//       }

//       // 3. Final Fallback: If logic reaches here, authentication failed
//       return next(new AppError("Authentication required", 401));
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
// async function loadUserByRole(role, id, includeTokenVersion = false) {
//   if (!role) return null;

//   // Add firstName to selectFields so it is fetched from DB
//   const selectFields = includeTokenVersion
//     ? "+tokenVersion isActive email firstName role"
//     : "firstName email isActive role";

//   switch (role.toLowerCase()) {
//     case "doctor":
//       return await Doctor.findById(id).select(selectFields);
//           case "serviceprovider": // Add support for the new model
//       return await ServiceProvider.findById(id).select(selectFields);
//     case "patient":
//       return await Patient.findById(id).select(selectFields);
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
    ? "+tokenVersion isActive email firstName role"
    : "firstName email isActive role";

  switch (role.toLowerCase()) {
    case "doctor":
      return await Doctor.findById(id).select(selectFields);

    case "serviceprovider":
      return await ServiceProvider.findById(id).select(selectFields);

    case "patient":
      return await Patient.findById(id).select(selectFields);

    case "admin":
    case "superadmin":
    case "subadmin":
      return await Admin.findById(id).select(selectFields);

    default:
      return null;
  }
}


const isProduction = process.env.NODE_ENV === "production";

function clearAuthCookies(res) {
 const cookieOptions = {
   httpOnly: true,
   secure: isProduction,
   sameSite: isProduction ? "none" : "lax",
   ...(isProduction && { domain: ".rehabmedico.in" }),
 };

 // Clear accessToken
 res.clearCookie("accessToken", cookieOptions);

 // Clear refreshToken
 res.clearCookie("refreshToken", cookieOptions);

 // Clear isAuthenticated (this one is not httpOnly)
 res.clearCookie("isAuthenticated", {
   httpOnly: false,
   secure: isProduction,
   sameSite: isProduction ? "none" : "lax",
   ...(isProduction && { domain: ".rehabmedico.in" }),
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


// authMiddleware.js (or wherever this file lives)

