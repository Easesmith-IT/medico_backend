

// const jwt = require("jsonwebtoken");
// const AppError = require("./appError");

// /**
//  * Generate Access Token (5 minutes)
//  */
// const generateAccessToken = (userId, userRole, tokenVersion = 0) => {
//   if (!userId) {
//     throw new AppError("UserId is required to generate access token", 400);
//   }

//   const payload = {
//     id: userId,
//     // role: userRole,
//        role: userRole.toLowerCase(), 
//     tokenVersion,
//     type: "access",
//   };

//   const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
//     expiresIn: "365d",
//   });

//   return token;
// };

// /**
//  * Generate Refresh Token (90 days)
//  */
// const generateRefreshToken = (userId, userRole, tokenVersion = 0) => {
//   if (!userId) {
//     throw new AppError("UserId is required to generate refresh token", 400);
//   }

//   const payload = {
//     id: userId,
//     // role: userRole,
//      role: userRole.toLowerCase(), 
//     tokenVersion,
//     type: "refresh",
//   };

//   const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
//     expiresIn: "90d",
//   });

//   return token;
// };

// /**
//  * Generate OTP Token
//  */
// const generateOtpToken = (phone, userRole) => {
//   if (!phone) {
//     throw new AppError("Phone is required to generate OTP token", 400);
//   }

//   const payload = {
//     phone,
//     role: userRole,
//     type: "otp",
//   };

//   const token = jwt.sign(
//     payload,
//     process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET,
//     { expiresIn: "10m" }
//   );

//   return token;
// };

// /**
//  * Verify Token (throws error)
//  */
// const verifyToken = (token, tokenType = "access") => {
//   try {
//     const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

//     if (!cleanToken) {
//       throw new Error("Token not provided");
//     }

//     let secret;

//     if (tokenType === "access") {
//       secret = process.env.JWT_ACCESS_SECRET;
//     } else if (tokenType === "refresh") {
//       secret = process.env.JWT_REFRESH_SECRET;
//     } else if (tokenType === "otp") {
//       secret = process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET;
//     }

//     const decoded = jwt.verify(cleanToken, secret);
//     return decoded;
//   } catch (error) {
//     throw new AppError(
//       `Invalid or expired ${tokenType} token: ${error.message}`,
//       401
//     );
//   }
// };

// /**
//  * Verify Token SAFELY (returns null, no error thrown)
//  */
// const verifyTokenSafe = (token, tokenType = "access") => {
//   try {
//     const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

//     if (!cleanToken) {
//       return null;
//     }

//     let secret;

//     if (tokenType === "access") {
//       secret = process.env.JWT_ACCESS_SECRET;
//     } else if (tokenType === "refresh") {
//       secret = process.env.JWT_REFRESH_SECRET;
//     } else if (tokenType === "otp") {
//       secret = process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET;
//     }

//     const decoded = jwt.verify(cleanToken, secret);
//     return decoded;
//   } catch (error) {
//     return null;
//   }
// };

// /**
//  * Set Authentication Cookies
//  */
// // const setAuthCookies = (res, accessToken, refreshToken) => {
// //   res.cookie("accessToken", accessToken, {
// //     httpOnly: true,
// //     // secure: process.env.NODE_ENV === "production",
// //     secure: true,
// //     // sameSite: 'strict',
// //     sameSite: "none",
// //     maxAge: 5 * 60 * 1000,
// //     domain: ".rehabmedico.in",
// //   });

// //   res.cookie("refreshToken", refreshToken, {
// //     httpOnly: true,
// //     // secure: process.env.NODE_ENV === "production",
// //     secure: true,
// //     // sameSite: 'strict',
// //     sameSite: "none",
// //     maxAge: 90 * 24 * 60 * 60 * 1000,
// //     domain: ".rehabmedico.in",
// //   });

// //   res.cookie("isAuthenticated", true, {
// //     httpOnly: false,
// //     // secure: process.env.NODE_ENV === "production",
// //     secure: true,
// //     // sameSite: 'strict',
// //     sameSite: "none",
// //     maxAge: 90 * 24 * 60 * 60 * 1000,
// //     domain: ".rehabmedico.in",
// //   });

// //   return {
// //     accessToken,
// //     refreshToken,
// //   };
// // };

// const isProduction = process.env.NODE_ENV === "production";

// const setAuthCookies = (res, accessToken, refreshToken) => {
//   const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     maxAge: 5 * 60 * 1000,
//   };

//   if (isProduction) {
//     cookieOptions.domain = ".rehabmedico.in";
//   }

//   // Access Token
//   res.cookie("accessToken", accessToken, cookieOptions);

//   // Refresh Token
//   res.cookie("refreshToken", refreshToken, {
//     ...cookieOptions,
//     maxAge: 90 * 24 * 60 * 60 * 1000,
//   });

//   // Non-httpOnly cookie
//   res.cookie("isAuthenticated", true, {
//     httpOnly: false,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     maxAge: 90 * 24 * 60 * 60 * 1000,
//     ...(isProduction && { domain: ".rehabmedico.in" }),
//   });

//   return { accessToken, refreshToken };
// };


// // const clearAuthCookies = (res) => {
// //   res.clearCookie("accessToken");
// //   res.clearCookie("refreshToken");
// //   res.clearCookie("isAuthenticated");
// // };

// const clearAuthCookies = (res) => {
//   const cookieOptions = {
//     httpOnly: true,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     ...(isProduction && { domain: ".rehabmedico.in" }),
//   };

//   // Clear accessToken
//   res.clearCookie("accessToken", cookieOptions);

//   // Clear refreshToken
//   res.clearCookie("refreshToken", cookieOptions);

//   // Clear isAuthenticated (this one is not httpOnly)
//   res.clearCookie("isAuthenticated", {
//     httpOnly: false,
//     secure: isProduction,
//     sameSite: isProduction ? "none" : "lax",
//     ...(isProduction && { domain: ".rehabmedico.in" }),
//   });
// };

// module.exports = {
//   generateAccessToken,
//   generateRefreshToken,
//   generateOtpToken,
//   verifyToken,
//   verifyTokenSafe, // ← MAKE SURE THIS IS EXPORTED
//   setAuthCookies,
//   clearAuthCookies,
// };





const jwt = require("jsonwebtoken");
const AppError = require("./appError");

const isProduction = process.env.NODE_ENV === "production";

/**
 * Generate Access Token (5 minutes - auto-refreshed)
 */
const generateAccessToken = (userId, userRole, tokenVersion = 0) => {
  if (!userId) {
    throw new AppError("UserId is required to generate access token", 400);
  }

  const payload = {
    id: userId,
    role: userRole.toLowerCase(), 
    tokenVersion,
    type: "access",
  };

  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "5m",  // Short-lived, auto-refreshed
  });

  return token;
};

/**
 * Generate Refresh Token (90 days - NO frequent login!)
 */
const generateRefreshToken = (userId, userRole, tokenVersion = 0) => {
  if (!userId) {
    throw new AppError("UserId is required to generate refresh token", 400);
  }

  const payload = {
    id: userId,
    role: userRole.toLowerCase(), 
    tokenVersion,
    type: "refresh",
  };

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "90d",  // 90 days session!
  });

  return token;
};

/**
 * Generate OTP Token
 */
const generateOtpToken = (phone, userRole) => {
  if (!phone) {
    throw new AppError("Phone is required to generate OTP token", 400);
  }

  const payload = {
    phone,
    role: userRole,
    type: "otp",
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET,
    { expiresIn: "10m" }
  );

  return token;
};

/**
 * Verify Token (throws error)
 */
const verifyToken = (token, tokenType = "access") => {
  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    if (!cleanToken) {
      throw new Error("Token not provided");
    }

    let secret;

    if (tokenType === "access") {
      secret = process.env.JWT_ACCESS_SECRET;
    } else if (tokenType === "refresh") {
      secret = process.env.JWT_REFRESH_SECRET;
    } else if (tokenType === "otp") {
      secret = process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET;
    }

    const decoded = jwt.verify(cleanToken, secret);
    return decoded;
  } catch (error) {
    throw new AppError(
      `Invalid or expired ${tokenType} token: ${error.message}`,
      401
    );
  }
};

/**
 * Verify Token SAFELY (returns null, no error thrown)
 */
const verifyTokenSafe = (token, tokenType = "access") => {
  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    if (!cleanToken) {
      return null;
    }

    let secret;

    if (tokenType === "access") {
      secret = process.env.JWT_ACCESS_SECRET;
    } else if (tokenType === "refresh") {
      secret = process.env.JWT_REFRESH_SECRET;
    } else if (tokenType === "otp") {
      secret = process.env.JWT_OTP_SECRET || process.env.JWT_ACCESS_SECRET;
    }

    const decoded = jwt.verify(cleanToken, secret);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * ✅ FIXED: API-ready cookies (localhost + production)
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const commonOptions = {
    httpOnly: true,
  };

  // Production: Live domain (.rehabmedico.in)
  if (isProduction) {
    Object.assign(commonOptions, {
      secure: true,
      sameSite: "none",
      domain: ".rehabmedico.in"
    });
  }
  // Dev: Localhost works automatically (no domain needed)

  // Access token (5min - auto-refreshed by protect)
  res.cookie("accessToken", accessToken, {
    ...commonOptions,
    maxAge: 5 * 60 * 1000  // 5 minutes
  });

  // Refresh token (90 days - NO login needed!)
  res.cookie("refreshToken", refreshToken, {
    ...commonOptions,
    maxAge: 90 * 24 * 60 * 60 * 1000  // 90 days
  });

  // Frontend-readable flag
  res.cookie("isAuthenticated", "true", {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000,
    ...(isProduction && { domain: ".rehabmedico.in" })
  });

  return { accessToken, refreshToken };
};

const clearAuthCookies = (res) => {
  const prodOptions = isProduction ? {
    secure: true,
    sameSite: "none",
    domain: ".rehabmedico.in"
  } : {};

  res.clearCookie("accessToken", { httpOnly: true, ...prodOptions });
  res.clearCookie("refreshToken", { httpOnly: true, ...prodOptions });
  res.clearCookie("isAuthenticated", { 
    httpOnly: false, 
    ...(isProduction ? prodOptions : {}) 
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  verifyToken,
  verifyTokenSafe,
  setAuthCookies,
  clearAuthCookies,
};
