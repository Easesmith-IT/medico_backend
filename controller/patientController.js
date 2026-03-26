



// controller/patientController.js
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const Booking = require('../models/bookingModel');
const City = require('../models/availableCities');
const {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  setAuthCookies,
  clearAuthCookies,
  verifyToken
} = require('../utils/tokenUtils');
const otpUtils = require('../utils/otpUtils');


// exports.patientSignup = catchAsync(async (req, res, next) => {
//   const { firstName, email, phone, password, dateOfBirth, gender, address, bloodGroup, emergencyContact } = req.body;

//   console.log('\n');
//   console.log('PATIENT SIGNUP - OTP Generation');
//   console.log('='.repeat(60));

//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   console.log('Phone:', phone);

//   if (!otpUtils.validatePhoneNumber(phone)) {
//     return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
//   }

//   // Check if patient already exists with this phone
//   const existingPatient = await Patient.findOne({ phone });

//   // CASE 1: PHONE EXISTS → LOGIN FLOW
//   if (existingPatient) {
//     console.log('✅ Phone found in database → LOGIN FLOW');

//     if (!existingPatient.isVerified) {
//       console.log('⚠️ Patient not verified yet → Complete signup verification');

//       const otp = Math.floor(100000 + Math.random() * 900000).toString();
//       const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

//       existingPatient.signupOtp = otp;
//       existingPatient.signupOtpExpiry = otpExpiry;

//       if (firstName) existingPatient.firstName = firstName;
//       if (email) existingPatient.email = email;
//       if (password) existingPatient.password = password;
//       if (dateOfBirth) existingPatient.dateOfBirth = dateOfBirth;
//       if (gender) existingPatient.gender = gender;
//       if (address) existingPatient.address = address;
//       if (bloodGroup) existingPatient.bloodGroup = bloodGroup;
//       if (emergencyContact) existingPatient.emergencyContact = emergencyContact;

//       await existingPatient.save({ validateBeforeSave: false });

//       const smsSent = await otpUtils.sendOtp(phone);

//       if (!smsSent) {
//         return next(new AppError('Failed to send OTP. Please try again.', 500));
//       }

//       const otpToken = generateOtpToken(phone, 'patient');

//       console.log('='.repeat(60));
//       console.log('\n');

//       return res.status(200).json({
//         success: true,
//         action: 'verify-signup',
//         message: 'Phone found but not verified. OTP sent to complete signup.',
//         data: {
//           otpToken,
//           expiresIn: 600,
//           phone: phone.slice(-4)
//         }
//       });
//     }

//     // Patient verified → LOGIN
//     console.log('✅ Patient verified → SEND LOGIN OTP');

//     if (!existingPatient.isActive) {
//       return next(new AppError('Your account has been deactivated. Please contact support.', 403));
//     }

//     const smsSent = await otpUtils.sendOtp(phone);

//     if (!smsSent) {
//       return next(new AppError('Failed to send OTP. Please try again.', 500));
//     }

//     const otpToken = generateOtpToken(phone, 'patient');

//     console.log('='.repeat(60));
//     console.log('\n');

//     return res.status(200).json({
//       success: true,
//       action: 'login',
//       message: 'Account found. OTP sent to your phone for login.',
//       data: {
//         otpToken,
//         expiresIn: 600,
//         phone: phone.slice(-4)
//       }
//     });
//   }

//   // CASE 2: NEW SIGNUP
//   console.log('🆕 Phone NOT found → NEW SIGNUP FLOW');

//   if (!firstName || !email || !password) {
//     return next(new AppError('Please provide firstName, email, and password', 400));
//   }

//   const existingEmail = await Patient.findOne({ email });
//   if (existingEmail) {
//     return next(new AppError('Patient with this email already exists', 400));
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

//   const smsSent = await otpUtils.sendOtp(phone);

//   if (!smsSent) {
//     return next(new AppError('Failed to send OTP. Please check your phone number and try again.', 500));
//   }

//   const newPatient = await Patient.create({
//     firstName,
//     email,
//     phone,
//     password,
//     dateOfBirth: dateOfBirth || null,
//     gender: gender || null,
//     address: address || null,
//     bloodGroup: bloodGroup || null,
//     emergencyContact: emergencyContact || { name: null, phone: null, relation: null },
//     signupOtp: otp,
//     signupOtpExpiry: otpExpiry,
//     isVerified: false,      // ✅ Explicitly set to false
//     isActive: false,        // ✅ Explicitly set to false
//     tokenVersion: 0
//   });

//   const otpToken = generateOtpToken(phone, 'patient');

//   console.log('✅ New patient created - Awaiting OTP verification');
//   console.log('='.repeat(60));
//   console.log('\n');

//   res.status(200).json({
//     success: true,
//     action: 'signup',
//     message: 'New account created. OTP sent to your phone number.',
//     data: {
//       otpToken,
//       expiresIn: 600,
//       phone: phone.slice(-4)
//     }
//   });
// });
exports.patientSignup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    bloodGroup,
    emergencyContact,
    otherCities = []
  } = req.body;

  console.log('\n');
  console.log('PATIENT SIGNUP - OTP Generation');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  if (!address || !address.cityId) {
    return next(new AppError('Address with cityId is required', 400));
  }

  // Validate cityId inside address exists
  const cityExists = await City.findById(address.cityId);
  if (!cityExists) {
    return next(new AppError('Invalid city ID in address', 400));
  }

  // Validate otherCities exists in City collection
  for (const cityId of otherCities) {
    const exists = await City.findById(cityId);
    if (!exists) {
      return next(new AppError(`Invalid other city id: ${cityId}`, 400));
    }
  }

  const existingPatient = await Patient.findOne({ phone });

  if (existingPatient) {
    console.log(' Phone found in database → LOGIN FLOW');

    if (!existingPatient.isVerified) {
      console.log('Patient not verified yet → Complete signup verification');

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      existingPatient.signupOtp = otp;
      existingPatient.signupOtpExpiry = otpExpiry;

      if (firstName) existingPatient.firstName = firstName;
      if (email) existingPatient.email = email;
      if (password) existingPatient.password = password;
      if (dateOfBirth) existingPatient.dateOfBirth = dateOfBirth;
      if (gender) existingPatient.gender = gender;
      if (address) existingPatient.address = address;
      if (bloodGroup) existingPatient.bloodGroup = bloodGroup;
      if (emergencyContact) existingPatient.emergencyContact = emergencyContact;
      if (otherCities.length > 0) existingPatient.otherCities = otherCities;

      await existingPatient.save({ validateBeforeSave: false });

      const smsSent = await otpUtils.sendOtp(phone);
      if (!smsSent) {
        return next(new AppError('Failed to send OTP. Please try again.', 500));
      }

      const otpToken = generateOtpToken(phone, 'patient');

      console.log('='.repeat(60));
      console.log('\n');

      return res.status(200).json({
        success: true,
        action: 'verify-signup',
        message: 'Phone found but not verified. OTP sent to complete signup.',
        data: {
          otpToken,
          expiresIn: 600,
          phone: phone.slice(-4)
        }
      });
    }

    // Patient verified → LOGIN OTP
    console.log(' Patient verified → SEND LOGIN OTP');

    if (!existingPatient.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    const smsSent = await otpUtils.sendOtp(phone);
    if (!smsSent) {
      return next(new AppError('Failed to send OTP. Please try again.', 500));
    }

    const otpToken = generateOtpToken(phone, 'patient');

    console.log('='.repeat(60));
    console.log('\n');

    return res.status(200).json({
      success: true,
      action: 'login',
      message: 'Account found. OTP sent to your phone for login.',
      data: {
        otpToken,
        expiresIn: 600,
        phone: phone.slice(-4)
      }
    });
  }

  // NEW SIGNUP
  if (!firstName || !email || !password) {
    return next(new AppError('Please provide firstName, email, and password', 400));
  }

  const existingEmail = await Patient.findOne({ email });
  if (existingEmail) {
    return next(new AppError('Patient with this email already exists', 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const smsSent = await otpUtils.sendOtp(phone);
  if (!smsSent) {
    return next(new AppError('Failed to send OTP. Please check your phone number and try again.', 500));
  }

  const newPatient = await Patient.create({
    firstName,
    email,
    phone,
    password,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    address, // with cityId inside address
    bloodGroup: bloodGroup || null,
    emergencyContact: emergencyContact || { name: null, phone: null, relation: null },
    signupOtp: otp,
    signupOtpExpiry: otpExpiry,
    isVerified: false,
    isActive: false,
    tokenVersion: 0,
    otherCities
  });

  const otpToken = generateOtpToken(phone, 'patient');

  console.log(' New patient created - Awaiting OTP verification');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    action: 'signup',
    message: 'New account created. OTP sent to your phone number.',
    data: {
      otpToken,
      expiresIn: 600,
      phone: phone.slice(-4)
    }
  });
});

exports.verifySignupOtp = catchAsync(async (req, res, next) => {
  const { phone, otp, dateOfBirth, gender, address, bloodGroup, emergencyContact } = req.body;

  console.log('\n');
  console.log('PATIENT SIGNUP VERIFICATION - OTP Verification');
  console.log('='.repeat(60));

  if (!phone || !otp) {
    return next(new AppError('Please provide phone and OTP', 400));
  }

  console.log('Phone:', phone);
  console.log('OTP:', otp);

  // Verify OTP
  const isOtpValid = await otpUtils.verifyOtp(phone, otp);
  if (!isOtpValid) {
    return next(new AppError('Invalid OTP. Please try again.', 400));
  }

  console.log(' OTP verified successfully');

  // Find patient
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return next(new AppError('Phone number not found. Please sign up first.', 404));
  }

  console.log('Patient found:', patient.firstName);
  console.log('Current isVerified BEFORE:', patient.isVerified);
  console.log('Current isActive BEFORE:', patient.isActive);

  if (patient.isVerified) {
    console.log(' Patient already verified');
    return next(new AppError('Phone number already verified. Please login instead.', 400));
  }

  //  SET VERIFICATION FLAGS EXPLICITLY
  patient.isVerified = true;
  patient.isActive = true;
  patient.signupOtp = undefined;
  patient.signupOtpExpiry = undefined;

  // Update optional fields if provided
  if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
  if (gender) patient.gender = gender;
  if (address) patient.address = address;
  if (bloodGroup) patient.bloodGroup = bloodGroup;
  if (emergencyContact) patient.emergencyContact = emergencyContact;

  // Save to database
  await patient.save({ validateBeforeSave: false });

  console.log(' Patient saved - isVerified AFTER:', patient.isVerified);
  console.log(' Patient saved - isActive AFTER:', patient.isActive);

  //  VERIFY FROM DB
  const verifiedPatient = await Patient.findById(patient._id);
  console.log('Verification from DB - isVerified:', verifiedPatient.isVerified);
  console.log('Verification from DB - isActive:', verifiedPatient.isActive);

  // Generate tokens (365 days)
  const accessToken = generateAccessToken(verifiedPatient._id, 'patient', verifiedPatient.tokenVersion || 0);
  const refreshToken = generateRefreshToken(verifiedPatient._id, 'patient', verifiedPatient.tokenVersion || 0);

  // Save refresh token
  verifiedPatient.refreshToken = refreshToken;
  await verifiedPatient.save({ validateBeforeSave: false });

  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('Tokens generated and cookies set (365 days)');
  console.log('='.repeat(60));
  console.log('\n');

  // Remove sensitive fields
  verifiedPatient.password = undefined;
  verifiedPatient.tokenVersion = undefined;
  verifiedPatient.signupOtp = undefined;
  verifiedPatient.signupOtpExpiry = undefined;

  res.status(201).json({
    success: true,
    message: 'Patient registration completed successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...verifiedPatient.toObject(),
        isVerified: true,    //  Explicitly include in response
        isActive: true       //  Explicitly include in response
      }
    }
  });
});


exports.resendSignupOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  console.log('\n');
  console.log('RESEND SIGNUP OTP');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  const patient = await Patient.findOne({ phone, isVerified: false });

  if (!patient) {
    return next(new AppError('Unverified patient not found with this phone number', 404));
  }

  const smsSent = await otpUtils.resendOtp(phone);

  if (!smsSent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 500));
  }

  const otpToken = generateOtpToken(phone, 'patient');

  console.log('✅ Signup OTP resent');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    message: 'OTP resent to your phone number',
    data: {
      otpToken,
      expiresIn: 600,
      phone: phone.slice(-4)
    }
  });
});


exports.patientLogin = catchAsync(async (req, res, next) => {
  const { email, phone } = req.body;

  console.log('\n');
  console.log('PATIENT LOGIN - OTP Request');
  console.log('='.repeat(60));

  if (!email && !phone) {
    return next(new AppError('Please provide email or phone number', 400));
  }

  // Find patient
  const patient = await Patient.findOne({
    $or: [{ email }, { phone }]
  });

  if (!patient) {
    console.log('❌ Patient not found');
    return next(new AppError('Patient not found with provided credentials', 404));
  }

  console.log('Patient found:', patient.firstName);
  console.log('isVerified:', patient.isVerified);
  console.log('isActive:', patient.isActive);

  // ✅ CHECK IF VERIFIED
  if (!patient.isVerified) {
    console.log('❌ Patient not verified');
    return next(new AppError('Please complete signup verification first', 403));
  }

  // ✅ CHECK IF ACTIVE
  if (!patient.isActive) {
    console.log('❌ Patient not active');
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  console.log('✅ Patient verified and active → Sending OTP');

  // Send OTP
  const smsSent = await otpUtils.sendOtp(patient.phone);

  if (!smsSent) {
    return next(new AppError('Failed to send OTP. Please try again.', 500));
  }

  const otpToken = generateOtpToken(patient.phone, 'patient');

  console.log('✅ Login OTP sent');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    message: 'OTP sent to your phone number',
    data: {
      otpToken,
      expiresIn: 600,
      phone: patient.phone.slice(-4)
    }
  });
});
// exports.patientLogin = catchAsync(async (req, res, next) => {
//   console.log("\n🔥 PATIENT LOGIN - FULL DEBUG");
//   console.log("=".repeat(70));
//   console.log("REQUEST BODY:", req.body);
//   console.log("PATH:", req.path);
//   console.log("Patient model loaded:", !!Patient);

//   const { email, phone } = req.body;

//   if (!email && !phone) {
//     console.log("❌ Missing email/phone");
//     return next(new AppError("Please provide email or phone number", 400));
//   }

//   // 🔥 STEP 1: Database health check
//   try {
//     const totalPatients = await Patient.countDocuments();
//     console.log("Total patients in DB:", totalPatients);

//     const samplePatients = await Patient.find({}).limit(2).select("phone email _id");
//     console.log("Sample patients:", samplePatients);

//     const phoneSamples = await Patient.find({ phone: { $exists: true } })
//       .select("phone")
//       .limit(3);
//     console.log("Phone field samples:", phoneSamples.map(p => p.phone));
//   } catch (dbErr) {
//     console.log("🚨 DATABASE ERROR:", dbErr.message);
//     return next(new AppError("Database error", 500));
//   }

//   // 🔥 STEP 2: Normalize input
//   const phoneStr = phone ? phone.toString().trim() : undefined;
//   console.log("Normalized phone:", phoneStr);

//   // 🔥 STEP 3: Try multiple query variations
//   const queries = [
//     { phone: phoneStr },                    // Exact phone
//     { "phone": phoneStr },                  // String field
//     { mobile: phoneStr },                   // Maybe mobile field
//     { phoneNumber: phoneStr },              // Maybe phoneNumber field
//     { phone: { $regex: phoneStr.slice(-10), $options: "i" } }  // Partial match
//   ];

//   let patient = null;
//   for (let i = 0; i < queries.length; i++) {
//     patient = await Patient.findOne(queries[i]).select(
//       "_id phone email firstName isDeleted isActive isVerified tokenVersion"
//     );
//     if (patient) {
//       console.log(`✅ FOUND with query ${i + 1}:`, queries[i]);
//       break;
//     }
//   }

//   console.log("FINAL PATIENT:", patient ? "FOUND" : "NULL");
//   if (patient) {
//     console.log("Patient details:", {
//       id: patient._id,
//       phone: patient.phone,
//       email: patient.email,
//       isActive: patient.isActive,
//       isVerified: patient.isVerified
//     });
//   }

//   if (!patient) {
//     console.log("❌ NO PATIENT FOUND - Check field names in schema");
//     return next(new AppError("Patient not found with provided credentials", 404));
//   }

//   // ✅ VALIDATION CHECKS
//   if (!patient.isVerified) {
//     console.log("❌ Not verified");
//     return next(new AppError("Please complete signup verification first", 403));
//   }

//   if (!patient.isActive) {
//     console.log("❌ Not active");
//     return next(new AppError("Your account has been deactivated. Please contact support.", 403));
//   }

//   console.log("✅ Patient validated → Sending OTP");

//   // 🔥 SEND OTP
//   try {
//     const smsSent = await otpUtils.sendOtp(patient.phone);
//     console.log("SMS sent:", smsSent);

//     if (!smsSent) {
//       return next(new AppError("Failed to send OTP. Please try again.", 500));
//     }
//   } catch (smsErr) {
//     console.log("SMS Error:", smsErr.message);
//     return next(new AppError("OTP service unavailable", 500));
//   }

//   // 🔥 GENERATE OTP TOKEN
//   const otpToken = generateOtpToken(patient.phone, "patient");
//   console.log("OTP Token generated");

//   console.log("✅ LOGIN SUCCESS");
//   console.log("=".repeat(70));

//   res.status(200).json({
//     success: true,
//     message: "OTP sent to your phone number",
//     data: {
//       otpToken,
//       expiresIn: 600, // 10 minutes
//       phone: patient.phone.slice(-4),
//       patientId: patient._id
//     }
//   });
// });

exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  console.log('\n');
  console.log('PATIENT LOGIN VERIFICATION - OTP Verification');
  console.log('='.repeat(60));

  if (!phone || !otp) {
    return next(new AppError('Please provide phone and OTP', 400));
  }

  // Verify OTP
  const isOtpValid = await otpUtils.verifyOtp(phone, otp);
  if (!isOtpValid) {
    return next(new AppError('Invalid OTP. Please try again.', 400));
  }

  console.log('✅ OTP verified');

  // Find patient
  const patient = await Patient.findOne({ phone }).select('+tokenVersion');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  console.log('Patient found:', patient.firstName);
  console.log('isVerified:', patient.isVerified);
  console.log('isActive:', patient.isActive);

  // ✅ CHECK VERIFICATION STATUS
  if (!patient.isVerified) {
    console.log('❌ Patient not verified');
    return next(new AppError('Please complete signup verification first', 403));
  }

  // ✅ CHECK ACTIVE STATUS
  if (!patient.isActive) {
    console.log('❌ Patient not active');
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  console.log('✅ Patient verified and active');

  // Generate tokens (365 days)
  const accessToken = generateAccessToken(patient._id, 'patient', patient.tokenVersion);
  const refreshToken = generateRefreshToken(patient._id, 'patient', patient.tokenVersion);

  patient.refreshToken = refreshToken;
  await patient.save({ validateBeforeSave: false });

  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('✅ Tokens generated (365 days)');
  console.log('='.repeat(60));
  console.log('\n');

  patient.password = undefined;
  patient.tokenVersion = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: patient
    }
  });
});


exports.resendLoginOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  console.log('\n');
  console.log('RESEND LOGIN OTP');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return next(new AppError('Patient not found with provided phone number', 404));
  }

  if (!patient.isVerified) {
    return next(new AppError('Please complete signup verification first', 403));
  }

  if (!patient.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  const smsSent = await otpUtils.resendOtp(phone);

  if (!smsSent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 500));
  }

  const otpToken = generateOtpToken(phone, 'patient');

  console.log('✅ Login OTP resent');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    message: 'OTP resent to your phone number',
    data: {
      otpToken,
      expiresIn: 600,
      phone: phone.slice(-4)
    }
  });
});


exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  console.log('DEBUG: Inside checkAuthStatus');

  const { accessToken, refreshToken } = req.cookies;

  if (!refreshToken || refreshToken === 'undefined') {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      message: 'Refresh token expired',
      shouldLogout: true
    });
  }

  if (accessToken && accessToken !== 'undefined') {
    try {
      const decoded = verifyToken(accessToken, 'access');
      const patient = await Patient.findById(decoded.id);

      if (patient) {
        res.cookie('isAuthenticated', true, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: patient._id,
            firstName: patient.firstName,
            phone: patient.phone,
            email: patient.email,
            isVerified: patient.isVerified,
            isActive: patient.isActive
          }
        });
      }
    } catch (error) {
      console.log('Access token verification failed');
    }
  }

  if (refreshToken && refreshToken !== 'undefined') {
    try {
      const decoded = verifyToken(refreshToken, 'refresh');
      const patient = await Patient.findById(decoded.id).select('+tokenVersion');

      if (patient && patient.tokenVersion === decoded.tokenVersion) {
        const newAccessToken = generateAccessToken(patient._id, 'patient', patient.tokenVersion);

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000
        });

        res.cookie('isAuthenticated', true, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 365 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: patient._id,
            firstName: patient.firstName,
            phone: patient.phone,
            email: patient.email,
            isVerified: patient.isVerified,
            isActive: patient.isActive
          }
        });
      }
    } catch (error) {
      console.log('Refresh token verification failed');
    }
  }

  return res.status(200).json({
    success: false,
    isAuthenticated: false,
    message: 'Authentication required',
    shouldLogout: true
  });
});


exports.logout = catchAsync(async (req, res, next) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});


exports.patientLogoutAll = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  const patient = await Patient.findOne({ phone }).select('+tokenVersion');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.tokenVersion = (patient.tokenVersion || 0) + 1;
  await patient.save({ validateBeforeSave: false });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});


exports.getMyProfile = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.user?.id)
    .select('-password -tokenVersion')
    .populate('following', 'firstName specialization profilePhoto averageRating');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});



// exports.updatePatient = catchAsync(async (req, res, next) => {
//   console.log('\n');
//   console.log('🔧 UPDATE PATIENT PROFILE - COMPREHENSIVE');
//   console.log('='.repeat(60));
  
//   // 🔍 STEP 1: Check authentication and validate ID
//   console.log('🔍 Step 1: Checking authentication and ID validation');
//   console.log('   Patient ID from token:', req.user?.id);
//   console.log('   Patient ID from URL:', req.params.id);
//   console.log('   User object exists:', !!req.user);
  
//   if (!req.user || !req.user.id) {
//     console.log('❌ Step 1 FAILED: No user ID found in request');
//     return next(new AppError('Authentication required', 401));
//   }

//   // 🔒 SECURITY: Validate user can only update their own profile
//   if (req.params.id !== req.user.id) {
//     console.log('❌ Step 1 FAILED: Unauthorized - ID mismatch');
//     console.log('   Attempted to update ID:', req.params.id);
//     console.log('   Authenticated user ID:', req.user.id);
//     return next(new AppError('You are not authorized to update this profile', 403));
//   }
//   console.log('✅ Step 1 PASSED: Authentication and authorization successful');

//   // 🔍 STEP 2: Check if user exists in database
//   console.log('🔍 Step 2: Checking if user exists in database');
//   const userExists = await Patient.findById(req.params.id);
//   console.log('   User found:', !!userExists);
  
//   if (!userExists) {
//     console.log('❌ Step 2 FAILED: User not found in database');
//     return next(new AppError('The user belonging to this token no longer exists', 401));
//   }
//   console.log('✅ Step 2 PASSED: User exists');

//   // 🔍 STEP 3: Log incoming data
//   console.log('🔍 Step 3: Processing request body');
//   console.log('   Update fields received:', Object.keys(req.body));
//   console.log('   Body content:', JSON.stringify(req.body, null, 2));

//   // ✅ SECURITY: Remove sensitive fields
//   const { 
//     password, 
//     role, 
//     tokenVersion, 
//     isVerified, 
//     isActive,
//     _id,
//     id,
//     createdAt,
//     updatedAt,
//     signupOtp,
//     signupOtpExpiry,
//     loginOtp,
//     loginOtpExpiry,
//     refreshToken,
//     __v,
//     following,
//     followingCount,
//     medicalHistory,
//     allergies,
//     currentMedications,
//     savedPosts,
//     ...updateData 
//   } = req.body;

//   console.log('   Safe update data:', updateData);

//   // ✅ WHITELIST: Only these fields can be updated
//   const allowedFields = [
//     'firstName',
//     'email',
//     'phone',
//     'profilePhoto',
//     'dateOfBirth',
//     'gender',
//     'address',
//     'bloodGroup',
//     'emergencyContact'
//   ];

//   const fieldsToUpdate = Object.keys(updateData).filter(field => allowedFields.includes(field));
//   console.log('   Fields to update:', fieldsToUpdate);
  
//   if (fieldsToUpdate.length === 0) {
//     console.log('⚠️  Step 3 WARNING: No valid fields to update');
//     return res.status(400).json({
//       success: false,
//       message: 'No valid fields provided for update'
//     });
//   }
//   console.log('✅ Step 3 PASSED: Fields validated');

//   // 🔍 STEP 4: Email validation
//   if (updateData.email) {
//     console.log('🔍 Step 4a: Validating email');
//     const emailRegex = /^\S+@\S+\.\S+$/;
//     if (!emailRegex.test(updateData.email)) {
//       console.log('❌ Step 4a FAILED: Invalid email format');
//       return next(new AppError('Please provide a valid email', 400));
//     }

//     console.log('   Checking email uniqueness...');
//     const existingEmail = await Patient.findOne({ 
//       email: updateData.email,
//       _id: { $ne: req.params.id }
//     });

//     if (existingEmail) {
//       console.log('❌ Step 4a FAILED: Email already in use');
//       return next(new AppError('Email already in use', 400));
//     }
//     console.log('✅ Step 4a PASSED: Email valid and unique');
//   }

//   // 🔍 STEP 5: Phone validation
//   if (updateData.phone) {
//     console.log('🔍 Step 4b: Validating phone');
//     const phoneRegex = /^[0-9]{10}$/;
//     if (!phoneRegex.test(updateData.phone)) {
//       console.log('❌ Step 4b FAILED: Invalid phone format');
//       return next(new AppError('Phone number must be a valid 10-digit number', 400));
//     }

//     console.log('   Checking phone uniqueness...');
//     const existingPhone = await Patient.findOne({ 
//       phone: updateData.phone,
//       _id: { $ne: req.params.id }
//     });

//     if (existingPhone) {
//       console.log('❌ Step 4b FAILED: Phone already in use');
//       return next(new AppError('Phone number already in use', 400));
//     }
//     console.log('✅ Step 4b PASSED: Phone valid and unique');
//   }

//   // 🔍 STEP 6: firstName validation
//   if (updateData.firstName) {
//     console.log('🔍 Step 4c: Validating firstName');
//     if (updateData.firstName.trim().length === 0) {
//       console.log('❌ Step 4c FAILED: First name empty');
//       return next(new AppError('First name cannot be empty', 400));
//     }
//     console.log('✅ Step 4c PASSED: First name valid');
//   }

//   // 🔍 STEP 7: dateOfBirth validation
//   if (updateData.dateOfBirth) {
//     console.log('🔍 Step 4d: Validating dateOfBirth');
//     const dob = new Date(updateData.dateOfBirth);
//     if (isNaN(dob.getTime())) {
//       console.log('❌ Step 4d FAILED: Invalid date format');
//       return next(new AppError('Please provide a valid date of birth', 400));
//     }

//     if (dob > new Date()) {
//       console.log('❌ Step 4d FAILED: Date in future');
//       return next(new AppError('Date of birth cannot be in the future', 400));
//     }
//     console.log('✅ Step 4d PASSED: Date of birth valid');
//   }

//   // 🔍 STEP 8: gender validation
//   if (updateData.gender) {
//     console.log('🔍 Step 4e: Validating gender');
//     if (!['male', 'female', 'other'].includes(updateData.gender)) {
//       console.log('❌ Step 4e FAILED: Invalid gender value');
//       return next(new AppError('Invalid gender. Must be male, female, or other', 400));
//     }
//     console.log('✅ Step 4e PASSED: Gender valid');
//   }

//   // 🔍 STEP 9: bloodGroup validation
//   if (updateData.bloodGroup) {
//     console.log('🔍 Step 4f: Validating blood group');
//     const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
//     if (!validBloodGroups.includes(updateData.bloodGroup)) {
//       console.log('❌ Step 4f FAILED: Invalid blood group');
//       return next(new AppError('Invalid blood group', 400));
//     }
//     console.log('✅ Step 4f PASSED: Blood group valid');
//   }

//   // 🔍 STEP 10: address validation
//   if (updateData.address && typeof updateData.address === 'object') {
//     console.log('🔍 Step 4g: Validating address');
//     const { city, state, country } = updateData.address;
    
//     if (city && city.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: City empty');
//       return next(new AppError('City cannot be empty', 400));
//     }
//     if (state && state.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: State empty');
//       return next(new AppError('State cannot be empty', 400));
//     }
//     if (country && country.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: Country empty');
//       return next(new AppError('Country cannot be empty', 400));
//     }
//     console.log('✅ Step 4g PASSED: Address valid');
//   }

//   // 🔍 STEP 11: emergencyContact validation
//   if (updateData.emergencyContact && typeof updateData.emergencyContact === 'object') {
//     console.log('🔍 Step 4h: Validating emergency contact');
//     const { name, phone: emergencyPhone, relation } = updateData.emergencyContact;
    
//     if (name && name.trim().length === 0) {
//       console.log('❌ Step 4h FAILED: Emergency contact name empty');
//       return next(new AppError('Emergency contact name cannot be empty', 400));
//     }

//     if (emergencyPhone) {
//       const phoneRegex = /^[0-9]{10}$/;
//       if (!phoneRegex.test(emergencyPhone)) {
//         console.log('❌ Step 4h FAILED: Emergency phone invalid');
//         return next(new AppError('Emergency contact phone must be a valid 10-digit number', 400));
//       }
//     }

//     if (relation && relation.trim().length === 0) {
//       console.log('❌ Step 4h FAILED: Relation empty');
//       return next(new AppError('Emergency contact relation cannot be empty', 400));
//     }
//     console.log('✅ Step 4h PASSED: Emergency contact valid');
//   }

//   // 🔍 STEP 12: Build filtered update data
//   console.log('🔍 Step 5: Building filtered update data');
//   const filteredUpdateData = {};
//   for (const field of allowedFields) {
//     if (field in updateData) {
//       filteredUpdateData[field] = updateData[field];
//     }
//   }

//   console.log('   Final update data:', JSON.stringify(filteredUpdateData, null, 2));
//   console.log('✅ Step 5 PASSED: Update data prepared');

//   // 🔍 STEP 13: Update patient in database
//   console.log('🔍 Step 6: Updating patient in database...');
//   console.log('   Patient ID:', req.params.id);
//   console.log('   Update options: { new: true, runValidators: true }');
  
//   let updatedPatient;
  
//   try {
//     updatedPatient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       filteredUpdateData,
//       { 
//         new: true,
//         runValidators: true
//       }
//     ).select('-password -tokenVersion -refreshToken -signupOtp -loginOtp -signupOtpExpiry -loginOtpExpiry');

//     console.log('   Update query executed');
//     console.log('   Updated patient exists:', !!updatedPatient);

//     if (!updatedPatient) {
//       console.log('❌ Step 6 FAILED: Patient not found after update');
//       return next(new AppError('Patient not found', 404));
//     }
    
//     console.log('✅ Step 6 PASSED: Patient updated successfully');
//     console.log('   Updated fields:', Object.keys(filteredUpdateData));

//   } catch (error) {
//     console.log('❌ Step 6 FAILED: Database error');
//     console.log('   Error name:', error.name);
//     console.log('   Error message:', error.message);
//     console.log('   Error stack:', error.stack);
//     return next(error);
//   }

//   // 🔍 STEP 14: Send response
//   console.log('🔍 Step 7: Sending response to client');
//   console.log('='.repeat(60));
//   console.log('✅ SUCCESS: Profile updated successfully');
//   console.log('='.repeat(60));
//   console.log('\n');

//   res.status(200).json({
//     success: true,
//     message: 'Profile updated successfully',
//     data: {
//       patient: updatedPatient,
//       updatedFields: fieldsToUpdate
//     }
//   });

//   console.log('✅ Step 7 PASSED: Response sent to client');
// });


exports.updatePatient = catchAsync(async (req, res, next) => {
  console.log('\n');
  console.log('UPDATE PATIENT PROFILE');
  console.log('='.repeat(60));
  
  // STEP 1: Check authentication and validate ID
  console.log('Step 1: Checking authentication and ID validation');
  console.log('   Patient ID from token:', req.user?.id);
  console.log('   Patient ID from URL:', req.params.id);
  console.log('   User object exists:', !!req.user);
  console.log('   User role:', req.user?.role);
  
  if (!req.user || !req.user.id) {
    console.log('Step 1 FAILED: No user ID found in request');
    return next(new AppError('Authentication required', 401));
  }

  // SECURITY: Check user permissions
  const allowedRoles = ['admin', 'superadmin', 'admin', 'superAdmin', 'patient'];
  const userRole = req.user.role?.toLowerCase();
  
  const isPatientOwner = req.params.id === req.user.id;
  const isAdminRole = allowedRoles.includes(userRole);
  
  if (!isPatientOwner && !isAdminRole) {
    console.log('Step 1 FAILED: Unauthorized - insufficient permissions');
    console.log('   Attempted to update ID:', req.params.id);
    console.log('   Authenticated user ID:', req.user.id);
    console.log('   User role:', userRole);
    return next(new AppError('You are not authorized to update this profile', 403));
  }
  
  console.log('Step 1 PASSED: Authentication and authorization successful');
  console.log('   Access type:', isPatientOwner ? 'Patient (self)' : 'Admin role');

  // STEP 2: Check if user exists in database
  console.log('Step 2: Checking if user exists in database');
  const userExists = await Patient.findById(req.params.id);
  console.log('   User found:', !!userExists);
  
  if (!userExists) {
    console.log('Step 2 FAILED: User not found in database');
    return next(new AppError('The patient does not exist', 404));
  }
  console.log('Step 2 PASSED: User exists');

  // STEP 3: Log incoming data
  console.log('Step 3: Processing request body');
  console.log('   Update fields received:', Object.keys(req.body));
  console.log('   Body content:', JSON.stringify(req.body, null, 2));

  // SECURITY: Remove sensitive fields
  const { 
    password, 
    role, 
    tokenVersion, 
    isVerified, 
    isActive,
    _id,
    id,
    createdAt,
    updatedAt,
    signupOtp,
    signupOtpExpiry,
    loginOtp,
    loginOtpExpiry,
    refreshToken,
    __v,
    following,
    followingCount,
    medicalHistory,
    allergies,
    currentMedications,
    savedPosts,
    ...updateData 
  } = req.body;

  console.log('   Safe update data:', updateData);

  // WHITELIST: Only these fields can be updated
  const allowedFields = [
    'firstName',
    'email',
    'phone',
    'profilePhoto',
    'dateOfBirth',
    'gender',
    'address',
    'bloodGroup',
    'emergencyContact'
  ];

  const fieldsToUpdate = Object.keys(updateData).filter(field => allowedFields.includes(field));
  console.log('   Fields to update:', fieldsToUpdate);
  
  if (fieldsToUpdate.length === 0) {
    console.log('Step 3 WARNING: No valid fields to update');
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update'
    });
  }
  console.log('Step 3 PASSED: Fields validated');

  // STEP 4: Email validation (ALLOW SAME EMAIL - NO UNIQUENESS CHECK)
  if (updateData.email) {
    console.log('Step 4a: Validating email');
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(updateData.email)) {
      console.log('Step 4a FAILED: Invalid email format');
      return next(new AppError('Please provide a valid email', 400));
    }
    console.log('   Skipping email uniqueness check - allow same email');
    console.log('Step 4a PASSED: Email format valid');
  }

  // STEP 5: Phone validation (ALLOW SAME PHONE - NO UNIQUENESS CHECK)
  if (updateData.phone) {
    console.log('Step 4b: Validating phone');
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(updateData.phone)) {
      console.log('Step 4b FAILED: Invalid phone format');
      return next(new AppError('Phone number must be a valid 10-digit number', 400));
    }
    console.log('   Skipping phone uniqueness check - allow same phone');
    console.log('Step 4b PASSED: Phone format valid');
  }

  // STEP 6: firstName validation
  if (updateData.firstName) {
    console.log('Step 4c: Validating firstName');
    if (updateData.firstName.trim().length === 0) {
      console.log('Step 4c FAILED: First name empty');
      return next(new AppError('First name cannot be empty', 400));
    }
    console.log('Step 4c PASSED: First name valid');
  }

  // STEP 7: dateOfBirth validation
  if (updateData.dateOfBirth) {
    console.log('Step 4d: Validating dateOfBirth');
    const dob = new Date(updateData.dateOfBirth);
    if (isNaN(dob.getTime())) {
      console.log('Step 4d FAILED: Invalid date format');
      return next(new AppError('Please provide a valid date of birth', 400));
    }

    if (dob > new Date()) {
      console.log('Step 4d FAILED: Date in future');
      return next(new AppError('Date of birth cannot be in the future', 400));
    }
    console.log('Step 4d PASSED: Date of birth valid');
  }

  // STEP 8: gender validation
  if (updateData.gender) {
    console.log('Step 4e: Validating gender');
    if (!['male', 'female', 'other'].includes(updateData.gender)) {
      console.log('Step 4e FAILED: Invalid gender value');
      return next(new AppError('Invalid gender. Must be male, female, or other', 400));
    }
    console.log('Step 4e PASSED: Gender valid');
  }

  // STEP 9: bloodGroup validation
  if (updateData.bloodGroup) {
    console.log('Step 4f: Validating blood group');
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(updateData.bloodGroup)) {
      console.log('Step 4f FAILED: Invalid blood group');
      return next(new AppError('Invalid blood group', 400));
    }
    console.log('Step 4f PASSED: Blood group valid');
  }

  // STEP 10: address validation
  if (updateData.address && typeof updateData.address === 'object') {
    console.log('Step 4g: Validating address');
    const { city, state, country } = updateData.address;
    
    if (city && city.trim().length === 0) {
      console.log('Step 4g FAILED: City empty');
      return next(new AppError('City cannot be empty', 400));
    }
    if (state && state.trim().length === 0) {
      console.log('Step 4g FAILED: State empty');
      return next(new AppError('State cannot be empty', 400));
    }
    if (country && country.trim().length === 0) {
      console.log('Step 4g FAILED: Country empty');
      return next(new AppError('Country cannot be empty', 400));
    }
    console.log('Step 4g PASSED: Address valid');
  }

  // STEP 11: emergencyContact validation
  if (updateData.emergencyContact && typeof updateData.emergencyContact === 'object') {
    console.log('Step 4h: Validating emergency contact');
    const { name, phone: emergencyPhone, relation } = updateData.emergencyContact;
    
    if (name && name.trim().length === 0) {
      console.log('Step 4h FAILED: Emergency contact name empty');
      return next(new AppError('Emergency contact name cannot be empty', 400));
    }

    if (emergencyPhone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(emergencyPhone)) {
        console.log('Step 4h FAILED: Emergency phone invalid');
        return next(new AppError('Emergency contact phone must be a valid 10-digit number', 400));
      }
    }

    if (relation && relation.trim().length === 0) {
      console.log('Step 4h FAILED: Relation empty');
      return next(new AppError('Emergency contact relation cannot be empty', 400));
    }
    console.log('Step 4h PASSED: Emergency contact valid');
  }

  // STEP 12: Build filtered update data
  console.log('Step 5: Building filtered update data');
  const filteredUpdateData = {};
  for (const field of allowedFields) {
    if (field in updateData) {
      filteredUpdateData[field] = updateData[field];
    }
  }

  console.log('   Final update data:', JSON.stringify(filteredUpdateData, null, 2));
  console.log('Step 5 PASSED: Update data prepared');

  // STEP 13: Update patient in database
  console.log('Step 6: Updating patient in database...');
  console.log('   Patient ID:', req.params.id);
  console.log('   Update options: { new: true, runValidators: true }');
  
  let updatedPatient;
  
  try {
    updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      filteredUpdateData,
      { 
        new: true,
        runValidators: true
      }
    ).select('-password -tokenVersion -refreshToken -signupOtp -loginOtp -signupOtpExpiry -loginOtpExpiry');

    console.log('   Update query executed');
    console.log('   Updated patient exists:', !!updatedPatient);

    if (!updatedPatient) {
      console.log('Step 6 FAILED: Patient not found after update');
      return next(new AppError('Patient not found', 404));
    }
    
    console.log('Step 6 PASSED: Patient updated successfully');
    console.log('   Updated fields:', Object.keys(filteredUpdateData));

  } catch (error) {
    console.log('Step 6 FAILED: Database error');
    console.log('   Error name:', error.name);
    console.log('   Error message:', error.message);
    console.log('   Error stack:', error.stack);
    return next(error);
  }

  // STEP 14: Send response
  console.log('Step 7: Sending response to client');
  console.log('='.repeat(60));
  console.log('SUCCESS: Profile updated successfully');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      patient: updatedPatient,
      updatedFields: fieldsToUpdate,
      updatedBy: {
        userId: req.user.id,
        role: req.user.role,
        isPatientOwner: isPatientOwner
      }
    }
  });

  console.log('Step 7 PASSED: Response sent to client');
});


// exports.updatePatient = catchAsync(async (req, res, next) => {
//   console.log('\n');
//   console.log('🔧 UPDATE PATIENT PROFILE - COMPREHENSIVE');
//   console.log('='.repeat(60));
  
//   // 🔍 STEP 1: Check authentication and validate ID
//   console.log('🔍 Step 1: Checking authentication and ID validation');
//   console.log('   Patient ID from token:', req.user?.id);
//   console.log('   Patient ID from URL:', req.params.id);
//   console.log('   User object exists:', !!req.user);
//   console.log('   User role:', req.user?.role);
  
//   if (!req.user || !req.user.id) {
//     console.log('❌ Step 1 FAILED: No user ID found in request');
//     return next(new AppError('Authentication required', 401));
//   }

//   // 🔒 SECURITY: Check user permissions
//   const allowedRoles = ['admin', 'superadmin', 'admin', 'superAdmin', 'patient'];
//   const userRole = req.user.role?.toLowerCase();
  
//   const isPatientOwner = req.params.id === req.user.id;
//   const isAdminRole = allowedRoles.includes(userRole);
  
//   if (!isPatientOwner && !isAdminRole) {
//     console.log('❌ Step 1 FAILED: Unauthorized - insufficient permissions');
//     console.log('   Attempted to update ID:', req.params.id);
//     console.log('   Authenticated user ID:', req.user.id);
//     console.log('   User role:', userRole);
//     return next(new AppError('You are not authorized to update this profile', 403));
//   }
  
//   console.log('✅ Step 1 PASSED: Authentication and authorization successful');
//   console.log('   Access type:', isPatientOwner ? 'Patient (self)' : 'Admin role');

//   // 🔍 STEP 2: Check if user exists in database
//   console.log('🔍 Step 2: Checking if user exists in database');
//   const userExists = await Patient.findById(req.params.id);
//   console.log('   User found:', !!userExists);
  
//   if (!userExists) {
//     console.log('❌ Step 2 FAILED: User not found in database');
//     return next(new AppError('The patient does not exist', 404));
//   }
//   console.log('✅ Step 2 PASSED: User exists');

//   // 🔍 STEP 3: Log incoming data
//   console.log('🔍 Step 3: Processing request body');
//   console.log('   Update fields received:', Object.keys(req.body));
//   console.log('   Body content:', JSON.stringify(req.body, null, 2));

//   // ✅ SECURITY: Remove sensitive fields
//   const { 
//     password, 
//     role, 
//     tokenVersion, 
//     isVerified, 
//     isActive,
//     _id,
//     id,
//     createdAt,
//     updatedAt,
//     signupOtp,
//     signupOtpExpiry,
//     loginOtp,
//     loginOtpExpiry,
//     refreshToken,
//     __v,
//     following,
//     followingCount,
//     medicalHistory,
//     allergies,
//     currentMedications,
//     savedPosts,
//     ...updateData 
//   } = req.body;

//   console.log('   Safe update data:', updateData);

//   // ✅ WHITELIST: Only these fields can be updated
//   const allowedFields = [
//     'firstName',
//     'email',
//     'phone',
//     'profilePhoto',
//     'dateOfBirth',
//     'gender',
//     'address',
//     'bloodGroup',
//     'emergencyContact'
//   ];

//   const fieldsToUpdate = Object.keys(updateData).filter(field => allowedFields.includes(field));
//   console.log('   Fields to update:', fieldsToUpdate);
  
//   if (fieldsToUpdate.length === 0) {
//     console.log('⚠️  Step 3 WARNING: No valid fields to update');
//     return res.status(400).json({
//       success: false,
//       message: 'No valid fields provided for update'
//     });
//   }
//   console.log('✅ Step 3 PASSED: Fields validated');

//   // 🔍 STEP 4: Email validation
//   if (updateData.email) {
//     console.log('🔍 Step 4a: Validating email');
//     const emailRegex = /^\S+@\S+\.\S+$/;
//     if (!emailRegex.test(updateData.email)) {
//       console.log('❌ Step 4a FAILED: Invalid email format');
//       return next(new AppError('Please provide a valid email', 400));
//     }

//     console.log('   Checking email uniqueness...');
//     const existingEmail = await Patient.findOne({ 
//       email: updateData.email,
//       _id: { $ne: req.params.id }
//     });

//     if (existingEmail) {
//       console.log('❌ Step 4a FAILED: Email already in use');
//       return next(new AppError('Email already in use', 400));
//     }
//     console.log('✅ Step 4a PASSED: Email valid and unique');
//   }

//   // 🔍 STEP 5: Phone validation
//   if (updateData.phone) {
//     console.log('🔍 Step 4b: Validating phone');
//     const phoneRegex = /^[0-9]{10}$/;
//     if (!phoneRegex.test(updateData.phone)) {
//       console.log('❌ Step 4b FAILED: Invalid phone format');
//       return next(new AppError('Phone number must be a valid 10-digit number', 400));
//     }

//     console.log('   Checking phone uniqueness...');
//     const existingPhone = await Patient.findOne({ 
//       phone: updateData.phone,
//       _id: { $ne: req.params.id }
//     });

//     if (existingPhone) {
//       console.log('❌ Step 4b FAILED: Phone already in use');
//       return next(new AppError('Phone number already in use', 400));
//     }
//     console.log('✅ Step 4b PASSED: Phone valid and unique');
//   }

//   // 🔍 STEP 6: firstName validation
//   if (updateData.firstName) {
//     console.log('🔍 Step 4c: Validating firstName');
//     if (updateData.firstName.trim().length === 0) {
//       console.log('❌ Step 4c FAILED: First name empty');
//       return next(new AppError('First name cannot be empty', 400));
//     }
//     console.log('✅ Step 4c PASSED: First name valid');
//   }

//   // 🔍 STEP 7: dateOfBirth validation
//   if (updateData.dateOfBirth) {
//     console.log('🔍 Step 4d: Validating dateOfBirth');
//     const dob = new Date(updateData.dateOfBirth);
//     if (isNaN(dob.getTime())) {
//       console.log('❌ Step 4d FAILED: Invalid date format');
//       return next(new AppError('Please provide a valid date of birth', 400));
//     }

//     if (dob > new Date()) {
//       console.log('❌ Step 4d FAILED: Date in future');
//       return next(new AppError('Date of birth cannot be in the future', 400));
//     }
//     console.log('✅ Step 4d PASSED: Date of birth valid');
//   }

//   // 🔍 STEP 8: gender validation
//   if (updateData.gender) {
//     console.log('🔍 Step 4e: Validating gender');
//     if (!['male', 'female', 'other'].includes(updateData.gender)) {
//       console.log('❌ Step 4e FAILED: Invalid gender value');
//       return next(new AppError('Invalid gender. Must be male, female, or other', 400));
//     }
//     console.log('✅ Step 4e PASSED: Gender valid');
//   }

//   // 🔍 STEP 9: bloodGroup validation
//   if (updateData.bloodGroup) {
//     console.log('🔍 Step 4f: Validating blood group');
//     const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
//     if (!validBloodGroups.includes(updateData.bloodGroup)) {
//       console.log('❌ Step 4f FAILED: Invalid blood group');
//       return next(new AppError('Invalid blood group', 400));
//     }
//     console.log('✅ Step 4f PASSED: Blood group valid');
//   }

//   // 🔍 STEP 10: address validation
//   if (updateData.address && typeof updateData.address === 'object') {
//     console.log('🔍 Step 4g: Validating address');
//     const { city, state, country } = updateData.address;
    
//     if (city && city.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: City empty');
//       return next(new AppError('City cannot be empty', 400));
//     }
//     if (state && state.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: State empty');
//       return next(new AppError('State cannot be empty', 400));
//     }
//     if (country && country.trim().length === 0) {
//       console.log('❌ Step 4g FAILED: Country empty');
//       return next(new AppError('Country cannot be empty', 400));
//     }
//     console.log('✅ Step 4g PASSED: Address valid');
//   }

//   // 🔍 STEP 11: emergencyContact validation
//   if (updateData.emergencyContact && typeof updateData.emergencyContact === 'object') {
//     console.log('🔍 Step 4h: Validating emergency contact');
//     const { name, phone: emergencyPhone, relation } = updateData.emergencyContact;
    
//     if (name && name.trim().length === 0) {
//       console.log('❌ Step 4h FAILED: Emergency contact name empty');
//       return next(new AppError('Emergency contact name cannot be empty', 400));
//     }

//     if (emergencyPhone) {
//       const phoneRegex = /^[0-9]{10}$/;
//       if (!phoneRegex.test(emergencyPhone)) {
//         console.log('❌ Step 4h FAILED: Emergency phone invalid');
//         return next(new AppError('Emergency contact phone must be a valid 10-digit number', 400));
//       }
//     }

//     if (relation && relation.trim().length === 0) {
//       console.log('❌ Step 4h FAILED: Relation empty');
//       return next(new AppError('Emergency contact relation cannot be empty', 400));
//     }
//     console.log('✅ Step 4h PASSED: Emergency contact valid');
//   }

//   // 🔍 STEP 12: Build filtered update data
//   console.log('🔍 Step 5: Building filtered update data');
//   const filteredUpdateData = {};
//   for (const field of allowedFields) {
//     if (field in updateData) {
//       filteredUpdateData[field] = updateData[field];
//     }
//   }

//   console.log('   Final update data:', JSON.stringify(filteredUpdateData, null, 2));
//   console.log('✅ Step 5 PASSED: Update data prepared');

//   // 🔍 STEP 13: Update patient in database
//   console.log('🔍 Step 6: Updating patient in database...');
//   console.log('   Patient ID:', req.params.id);
//   console.log('   Update options: { new: true, runValidators: true }');
  
//   let updatedPatient;
  
//   try {
//     updatedPatient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       filteredUpdateData,
//       { 
//         new: true,
//         runValidators: true
//       }
//     ).select('-password -tokenVersion -refreshToken -signupOtp -loginOtp -signupOtpExpiry -loginOtpExpiry');

//     console.log('   Update query executed');
//     console.log('   Updated patient exists:', !!updatedPatient);

//     if (!updatedPatient) {
//       console.log('❌ Step 6 FAILED: Patient not found after update');
//       return next(new AppError('Patient not found', 404));
//     }
    
//     console.log('✅ Step 6 PASSED: Patient updated successfully');
//     console.log('   Updated fields:', Object.keys(filteredUpdateData));

//   } catch (error) {
//     console.log('❌ Step 6 FAILED: Database error');
//     console.log('   Error name:', error.name);
//     console.log('   Error message:', error.message);
//     console.log('   Error stack:', error.stack);
//     return next(error);
//   }

//   // 🔍 STEP 14: Send response
//   console.log('🔍 Step 7: Sending response to client');
//   console.log('='.repeat(60));
//   console.log('✅ SUCCESS: Profile updated successfully');
//   console.log('='.repeat(60));
//   console.log('\n');

//   res.status(200).json({
//     success: true,
//     message: 'Profile updated successfully',
//     data: {
//       patient: updatedPatient,
//       updatedFields: fieldsToUpdate,
//       updatedBy: {
//         userId: req.user.id,
//         role: req.user.role,
//         isPatientOwner: isPatientOwner
//       }
//     }
//   });

//   console.log('✅ Step 7 PASSED: Response sent to client');
// });


//medical history 
// Update Medical History (add medical issues)
exports.updateMedicalHistory = catchAsync(async (req, res, next) => { //update 
  const { condition, diagnosedDate, notes } = req.body;

  if (!condition) {
    return next(new AppError('Please provide condition details', 400));
  }

  const patient = await Patient.findById(req.user?.id);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.medicalHistory.push({
    condition,
    diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : new Date(),
    notes,
  });

  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medical history updated successfully',
    data: { medicalHistory: patient.medicalHistory },
  });
});

// Add Medication
// exports.addMedication = catchAsync(async (req, res, next) => { //add medications
//   const medication = req.body.medication;
//   if (!medication) {
//     return next(new AppError('Please provide medication details', 400));
//   }

//   const patient = await Patient.findById(req.user?.id);
//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   if (patient.currentMedications.includes(medication)) {
//     return next(new AppError('Medication already exists', 400));
//   }

//   patient.currentMedications.push(medication);
//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Medication added successfully',
//     data: { currentMedications: patient.currentMedications },
//   });
// });









// Remove Medication
exports.removeMedication = catchAsync(async (req, res, next) => { //remove 
  const medication = req.body.medication;
  if (!medication) {
    return next(new AppError('Please provide medication to remove', 400));
  }

  const patient = await Patient.findById(req.user?.id);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.currentMedications = patient.currentMedications.filter(
    (m) => m !== medication
  );

  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medication removed successfully',
    data: { currentMedications: patient.currentMedications },
  });
});


// exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
//   const { condition, diagnosedDate, notes } = req.body;

//   if (!condition) {
//     return next(new AppError('Please provide condition details', 400));
//   }

//   const patient = await Patient.findById(req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   patient.medicalHistory.push({
//     condition,
//     diagnosedDate: diagnosedDate || new Date(),
//     notes
//   });

//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Medical history updated successfully',
//     data: {
//       medicalHistory: patient.medicalHistory
//     }
//   });
// });

exports.deleteMedicalHistory = catchAsync(async (req, res, next) => {
  const { historyId } = req.params;

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.medicalHistory.pull(historyId);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medical history entry deleted successfully',
    data: {
      medicalHistory: patient.medicalHistory
    }
  });
});

/**
 * ====================================================================
 * ALLERGIES
 * ====================================================================
 */
exports.addAllergy = catchAsync(async (req, res, next) => {
  const { allergy } = req.body;

  if (!allergy) {
    return next(new AppError('Please provide allergy details', 400));
  }

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.allergies.includes(allergy)) {
    return next(new AppError('Allergy already exists', 400));
  }

  patient.allergies.push(allergy);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Allergy added successfully',
    data: {
      allergies: patient.allergies
    }
  });
});

exports.removeAllergy = catchAsync(async (req, res, next) => {
  const { allergy } = req.body;

  if (!allergy) {
    return next(new AppError('Please provide allergy to remove', 400));
  }

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.allergies = patient.allergies.filter(a => a !== allergy);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Allergy removed successfully',
    data: {
      allergies: patient.allergies
    }
  });
});

/**
 * ====================================================================
 * MEDICATIONS
 * ====================================================================
 */
exports.addMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;

  if (!medication) {
    return next(new AppError('Please provide medication details', 400));
  }

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.currentMedications.includes(medication)) {
    return next(new AppError('Medication already exists', 400));
  }

  patient.currentMedications.push(medication);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medication added successfully',
    data: {
      currentMedications: patient.currentMedications
    }
  });
});

exports.removeMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;

  if (!medication) {
    return next(new AppError('Please provide medication to remove', 400));
  }

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.currentMedications = patient.currentMedications.filter(m => m !== medication);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medication removed successfully',
    data: {
      currentMedications: patient.currentMedications
    }
  });
});

/**
 * ====================================================================
 * DOCTOR FOLLOWING
 * ====================================================================
 */
exports.followDoctor = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.following.includes(doctorId)) {
    return next(new AppError('Already following this doctor', 400));
  }

  patient.following.push(doctorId);
  patient.followingCount = (patient.followingCount || 0) + 1;
  await patient.save();

  doctor.followers.push(req.user.id);
  doctor.followersCount = (doctor.followersCount || 0) + 1;
  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Doctor followed successfully',
    data: {
      following: patient.following
    }
  });
});

exports.unfollowDoctor = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const patient = await Patient.findById(req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (!patient.following.includes(doctorId)) {
    return next(new AppError('Not following this doctor', 400));
  }

  patient.following.pull(doctorId);
  patient.followingCount = Math.max(0, (patient.followingCount || 1) - 1);
  await patient.save();

  await Doctor.findByIdAndUpdate(
    doctorId,
    {
      $pull: { followers: req.user.id },
      $inc: { followersCount: -1 }
    }
  );

  res.status(200).json({
    success: true,
    message: 'Doctor unfollowed successfully',
    data: {
      following: patient.following
    }
  });
});

/**
 * ====================================================================
 * GET PATIENT BY ID
 * ====================================================================
 */
exports.getPatientById = catchAsync(async (req, res, next) => {
  const { patientId } = req.params;

  if (!patientId) {
    return next(new AppError('Please provide patient ID', 400));
  }

  const patient = await Patient.findById(patientId);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.password = undefined;
  patient.tokenVersion = undefined;
  patient.refreshToken = undefined;

  res.status(200).json({
    success: true,
    message: 'Patient retrieved successfully',
    data: patient
  });
});

/**
 * ====================================================================
 * GET ALL PATIENTS
 * ====================================================================
 */
exports.getAllPatients = catchAsync(async (req, res, next) => {
  const patients = await Patient.find()
    .select('-password -tokenVersion -refreshToken -signupOtp -loginOtp');

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients
  });
});




// ULTIMATE: Get ALL patient treatment + booking history
// exports.getCompletePatientTreatmentHistory = async (req, res) => {
//   try {
//     const patientId = req.user?.id || req.params.patientId || req.query.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required"
//       });
//     }

//     const { page = 1, limit = 50, status, dateFilterType } = req.query;
//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 50;
//     const skip = (pageNum - 1) * limitNum;

//     // 1. Get Patient Medical Data
//     const patient = await Patient.findById(patientId)
//       .select('firstName phone email medicalHistory medicationHistory treatmentProgress allergies bloodGroup currentMedications address')
//       .populate('medicationHistory.doctorId', 'firstName specialization')
//       .populate('treatmentProgress.doctorId', 'firstName specialization');

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found"
//       });
//     }

//     // 2. Build booking match query
//     let bookingMatch = { patientId: new mongoose.Types.ObjectId(patientId) };
//     if (status) bookingMatch.status = status;

//     // Date filters
//     const now = new Date();
//     if (dateFilterType === "today") {
//       const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//       const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
//       bookingMatch.appointmentDate = { $gte: todayStart, $lt: todayEnd };
//     } else if (dateFilterType === "week") {
//       const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//       bookingMatch.appointmentDate = { $gte: weekStart };
//     }

//     // 3. COMPREHENSIVE Aggregation for ALL bookings + services + doctors
//     const bookingPipeline = [
//       { $match: bookingMatch },
//       // Services
//       {
//         $lookup: {
//           from: "services",
//           localField: "serviceId",
//           foreignField: "_id",
//           as: "service",
//           pipeline: [{ $project: { 
//             name: 1, category: 1, nursingType: 1, 
//             description: 1, basePrice: 1, modes: 1 
//           }}]
//         }
//       },
//       { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      
//       // Doctors/Service Partners
//       {
//         $lookup: {
//           from: "doctors",
//           localField: "servicePartnerId",
//           foreignField: "_id",
//           as: "doctor",
//           pipeline: [{ $project: { 
//             firstName: 1, phone: 1, specialization: 1, 
//             yearsOfExperience: 1, cities: 1 
//           }}]
//         }
//       },
//       { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      
//       // City
//       {
//         $lookup: {
//           from: "availablecities",
//           localField: "city",
//           foreignField: "_id",
//           as: "cityDetails",
//           pipeline: [{ $project: { name: 1 } }]
//         }
//       },
//       { $unwind: { path: "$cityDetails", preserveNullAndEmptyArrays: true } },

//       // Project booking details
//       {
//         $project: {
//           type: "booking",
//           bookingId: "$_id",
//           appointmentDate: 1,
//           slotTime: { startTime: 1, endTime: 1 },
//           duration: 1,
//           serviceName: "$service.name",
//           serviceCategory: "$service.category",
//           serviceNursingType: "$service.nursingType",
//           serviceModes: "$service.modes",
//           doctorName: "$doctor.firstName",
//           doctorSpecialization: "$doctor.specialization",
//           doctorPhone: "$doctor.phone",
//           cityName: "$cityDetails.name",
//           status: 1,
//           statusReason: { $ifNull: ["$statusReason", ""] },
//           cancelledBy: 1,
//           cancelledAt: 1,
//           cancellationReason: 1,
//           pricing: 1,
//           notes: 1,
//           createdAt: 1
//         }
//       }
//     ];

//     // 4. Get ALL bookings
//     const bookingsResult = await Booking.aggregate([
//       ...bookingPipeline,
//       { $sort: { appointmentDate: -1, createdAt: -1 } },
//       {
//         $facet: {
//           paginatedBookings: [{ $skip: skip }, { $limit: limitNum }],
//           totalBookings: [{ $count: "count" }]
//         }
//       }
//     ]);

//     const allBookings = await Booking.aggregate([
//       ...bookingPipeline,
//       { $sort: { appointmentDate: -1, createdAt: -1 } }
//     ]);

//     // 5. Transform Medical History into timeline format
//     const medicalTimeline = [];

//     // Medical Conditions
//     patient.medicalHistory?.forEach((condition, index) => {
//       medicalTimeline.push({
//         type: "medicalCondition",
//         condition: condition.condition,
//         diagnosedDate: condition.diagnosedDate,
//         status: condition.status || "active",
//         severity: condition.severity || "unknown",
//         notes: condition.notes || "",
//         addedAt: condition.addedAt || patient.createdAt,
//         timelineIndex: index
//       });
//     });

//     // Medications
//     patient.medicationHistory?.forEach((med, index) => {
//       medicalTimeline.push({
//         type: "medication",
//         medicationName: med.medicationName,
//         dosage: med.dosage,
//         frequency: med.frequency,
//         startDate: med.startDate,
//         endDate: med.endDate,
//         status: med.status,
//         purpose: med.purpose,
//         prescribedBy: med.prescribedBy?.doctorName || "Unknown",
//         timelineIndex: index
//       });
//     });

//     // Treatment Progress
//     patient.treatmentProgress?.forEach((progress, index) => {
//       medicalTimeline.push({
//         type: "treatmentProgress",
//         visitDate: progress.visitDate,
//         diagnosis: progress.diagnosis,
//         recommendations: progress.recommendations,
//         progressNotes: progress.progressNotes,
//         vitals: progress.vitals,
//         doctorName: progress.doctorId?.firstName || "Unknown",
//         timelineIndex: index
//       });
//     });

//     // 6. Combine ALL into unified timeline
//     const unifiedTimeline = [
//       ...allBookings,
//       ...medicalTimeline
//     ].sort((a, b) => {
//       const dateA = new Date(a.appointmentDate || a.diagnosedDate || a.startDate || a.visitDate || a.addedAt || new Date(0));
//       const dateB = new Date(b.appointmentDate || b.diagnosedDate || b.startDate || b.visitDate || b.addedAt || new Date(0));
//       return dateB - dateA;
//     });

//     // 7. Summary statistics
//     const stats = {
//       totalBookings: allBookings.length,
//       activeMedications: patient.medicationHistory?.filter(m => m.status === 'active').length || 0,
//       ongoingConditions: patient.medicalHistory?.filter(c => ['active', 'chronic'].includes(c.status)).length || 0,
//       totalTreatmentVisits: patient.treatmentProgress?.length || 0,
//       allergies: patient.allergies || "None recorded",
//       bloodGroup: patient.bloodGroup || "Not specified"
//     };

//     res.status(200).json({
//       success: true,
//       data: {
//         patient: {
//           name: patient.firstName,
//           phone: patient.phone,
//           email: patient.email,
//           address: patient.address
//         },
//         timeline: unifiedTimeline.slice(0, 100), // Limit to recent 100 events
//         paginatedBookings: bookingsResult[0]?.paginatedBookings || [],
//         pagination: {
//           currentPage: pageNum,
//           totalBookings: bookingsResult[0]?.totalBookings[0]?.count || 0,
//           totalPages: Math.ceil((bookingsResult[0]?.totalBookings[0]?.count || 0) / limitNum),
//           pageSize: limitNum
//         },
//         summary: stats,
//         medicalSnapshot: {
//           activeMedications: patient.medicationHistory?.filter(m => m.status === 'active') || [],
//           ongoingConditions: patient.medicalHistory?.filter(c => ['active', 'chronic'].includes(c.status)) || [],
//           recentTreatments: patient.treatmentProgress?.slice(-5) || []
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Complete patient history error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching complete patient history",
//       error: error.message
//     });
//   }
// };






exports.getCompletePatientTreatmentHistory = async (req, res) => {
  try {
    let patientId = req.query.patientId || req.user?.id;

    console.log("🔍 DEBUG - Raw patientId:", patientId, "user:", req.user?.id, "role:", req.user?.role);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    if (typeof patientId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Patient ID format"
        });
      }
      patientId = new mongoose.Types.ObjectId(patientId);
    }

    // ✅ FIXED: Case-insensitive role matching
    const userRole = (req.user?.role || 'public').toLowerCase();
    const isPatientOwner = req.user?.id === patientId.toString();
    const isAdmin = ['admin', 'superadmin', 'superAdmin', 'SuperAdmin'].includes(userRole);
    const isDoctor = userRole === 'doctor';

    console.log("🔍 DEBUG - Permissions:", { 
      rawRole: req.user?.role,
      normalizedRole: userRole,
      isPatientOwner, 
      isAdmin, 
      isDoctor,
      patientId: patientId.toString()
    });

    const patient = await Patient.findById(patientId)
      .select('firstName phone email medicalHistory medicationHistory treatmentProgress allergies bloodGroup currentMedications address')
      .populate([
        { path: 'medicationHistory.prescribedBy.doctorId', select: 'firstName specialization profilePhoto' },
        { path: 'treatmentProgress.doctorId', select: 'firstName specialization profilePhoto' }
      ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with ID: ${patientId}`
      });
    }

    // ✅ FIXED Authorization
    if (!isPatientOwner && !isAdmin && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role}' cannot view patient ${patientId}`
      });
    }

    // ... rest of your existing code remains exactly the same ...
    const { page = 1, limit = 50, status, dateFilterType } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    let bookingMatch = { patientId: patientId };
    if (status) bookingMatch.status = status;

    const now = new Date();
    if (dateFilterType === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      bookingMatch.appointmentDate = { $gte: todayStart, $lt: todayEnd };
    } else if (dateFilterType === "week") {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      bookingMatch.appointmentDate = { $gte: weekStart };
    }

    const bookingPipeline = [
      { $match: bookingMatch },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
          pipeline: [{ $project: { 
            name: 1, category: 1, nursingType: 1, 
            description: 1, basePrice: 1, modes: 1 
          }}]
        }
      },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "doctors",
          localField: "servicePartnerId",
          foreignField: "_id",
          as: "doctor",
          pipeline: [{ $project: { 
            firstName: 1, phone: 1, specialization: 1, 
            yearsOfExperience: 1, cities: 1 
          }}]
        }
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "availablecities",
          localField: "city",
          foreignField: "_id",
          as: "cityDetails",
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: "$cityDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: "booking",
          bookingId: "$_id",
          appointmentDate: 1,
          slotTime: { startTime: 1, endTime: 1 },
          duration: 1,
          serviceName: "$service.name",
          serviceCategory: "$service.category",
          serviceNursingType: "$service.nursingType",
          serviceModes: "$service.modes",
          doctorName: "$doctor.firstName",
          doctorSpecialization: "$doctor.specialization",
          doctorPhone: "$doctor.phone",
          cityName: "$cityDetails.name",
          status: 1,
          statusReason: { $ifNull: ["$statusReason", ""] },
          cancelledBy: 1,
          cancelledAt: 1,
          cancellationReason: 1,
          pricing: 1,
          notes: 1,
          createdAt: 1
        }
      }
    ];

    const bookingsResult = await Booking.aggregate([
      ...bookingPipeline,
      { $sort: { appointmentDate: -1, createdAt: -1 } },
      {
        $facet: {
          paginatedBookings: [{ $skip: skip }, { $limit: limitNum }],
          totalBookings: [{ $count: "count" }]
        }
      }
    ]);

    const allBookings = await Booking.aggregate([
      ...bookingPipeline,
      { $sort: { appointmentDate: -1, createdAt: -1 } }
    ]);

    const medicalTimeline = [];
    patient.medicalHistory?.forEach((condition, index) => {
      medicalTimeline.push({
        type: "medicalCondition",
        condition: condition.condition,
        diagnosedDate: condition.diagnosedDate,
        status: condition.status || "active",
        severity: condition.severity || "unknown",
        notes: condition.notes || "",
        addedAt: condition.addedAt || patient.createdAt,
        timelineIndex: index
      });
    });

    patient.medicationHistory?.forEach((med, index) => {
      medicalTimeline.push({
        type: "medication",
        medicationName: med.medicationName,
        dosage: med.dosage,
        frequency: med.frequency,
        startDate: med.startDate,
        endDate: med.endDate,
        status: med.status,
        purpose: med.purpose,
        prescribedBy: med.prescribedBy?.doctorId?.firstName || med.prescribedBy?.doctorName || "Unknown",
        timelineIndex: index
      });
    });

    patient.treatmentProgress?.forEach((progress, index) => {
      medicalTimeline.push({
        type: "treatmentProgress",
        visitDate: progress.visitDate,
        diagnosis: progress.diagnosis,
        recommendations: progress.recommendations,
        progressNotes: progress.progressNotes,
        vitals: progress.vitals,
        doctorName: progress.doctorId?.firstName || "Unknown",
        timelineIndex: index
      });
    });

    const unifiedTimeline = [
      ...allBookings,
      ...medicalTimeline
    ].sort((a, b) => {
      const dateA = new Date(a.appointmentDate || a.diagnosedDate || a.startDate || a.visitDate || a.addedAt || new Date(0));
      const dateB = new Date(b.appointmentDate || b.diagnosedDate || b.startDate || b.visitDate || b.addedAt || new Date(0));
      return dateB - dateA;
    });

    const stats = {
      totalBookings: allBookings.length,
      activeMedications: patient.medicationHistory?.filter(m => m.status === 'active').length || 0,
      ongoingConditions: patient.medicalHistory?.filter(c => ['active', 'chronic'].includes(c.status)).length || 0,
      totalTreatmentVisits: patient.treatmentProgress?.length || 0,
      allergies: patient.allergies?.join(', ') || "None recorded",
      bloodGroup: patient.bloodGroup || "Not specified"
    };

    res.status(200).json({
      success: true,
      data: {
        patient: {
          name: patient.firstName,
          phone: patient.phone,
          email: patient.email,
          address: patient.address
        },
        timeline: unifiedTimeline.slice(0, 100),
        paginatedBookings: bookingsResult[0]?.paginatedBookings || [],
        pagination: {
          currentPage: pageNum,
          totalBookings: bookingsResult[0]?.totalBookings[0]?.count || 0,
          totalPages: Math.ceil((bookingsResult[0]?.totalBookings[0]?.count || 0) / limitNum),
          pageSize: limitNum
        },
        summary: stats,
        medicalSnapshot: {
          activeMedications: patient.medicationHistory?.filter(m => m.status === 'active') || [],
          ongoingConditions: patient.medicalHistory?.filter(c => ['active', 'chronic'].includes(c.status)) || [],
          recentTreatments: patient.treatmentProgress?.slice(-5) || []
        }
      }
    });

  } catch (error) {
    console.error("❌ Complete patient history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complete patient history",
      error: error.message
    });
  }
};

