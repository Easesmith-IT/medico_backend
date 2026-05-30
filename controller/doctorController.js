



// controllers/doctorController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const Otp = require('../models/otpModel');
const mongoose = require("mongoose");
const { sendOtp } = require('../utils/otpUtils');
const jwt = require('jsonwebtoken');
const City = require('../models/availableCities'); 
const { getChangedFields, writeProfileAudit } = require('../utils/profileAudit');
const Clinic = require('../models/doctorModel');
// Import token utilities (NOT from middleware)
const {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies
} = require('../utils/tokenUtils');

// ============================================
// SIGNUP FLOW
// ============================================

// exports.doctorSignup = catchAsync(async (req, res, next) => {
//   const {
//     firstName,
//     email,
//     phone,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     dateOfBirth,
//     gender,
//     address,
//     yearsOfExperience,
//     consultationFees,
//     degrees,
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio
//   } = req.body;

//   console.log('');
//   console.log('DOCTOR SIGNUP - STEP 1: Registration');
//   console.log('='.repeat(60));

//   if (
//     !firstName ||
//     !email ||
//     !phone ||
//     !medicalRegistrationNumber ||
//     !issuingMedicalCouncil ||
//     !specialization
//   ) {
//     return next(
//       new AppError(
//         'Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization',
//         400
//       )
//     );
//   }

//   console.log(`Phone: ${phone}`);
//   console.log(`Email: ${email}`);
//   console.log(`firstName: ${firstName}`);

//   const existingDoctor = await Doctor.findOne({
//     $or: [{ email }, { phone }, { medicalRegistrationNumber }]
//   });

//   if (existingDoctor) {
//     if (existingDoctor.email === email) {
//       return next(new AppError('Doctor with this email already exists', 400));
//     }
//     if (existingDoctor.phone === phone) {
//       return next(
//         new AppError('Doctor with this phone number already exists', 400)
//       );
//     }
//     if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
//       return next(
//         new AppError('Doctor with this registration number already exists', 400)
//       );
//     }
//   }

//   const newDoctor = new Doctor({
//     firstName,
//     email,
//     phone,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     dateOfBirth,
//     gender,
//     address,
//     yearsOfExperience: yearsOfExperience || 0,
//     consultationFees: consultationFees || 0,
//     degrees: degrees || [],
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio,
//     isPhoneVerified: false,
//     verificationStatus: 'pending',
//     tokenVersion: 0
//   });

//   await newDoctor.save();
//   console.log('SUCCESS: Doctor created in database');

//   const isOtpSent = await sendOtp(phone);

//   if (!isOtpSent) {
//     await Doctor.findByIdAndDelete(newDoctor._id);
//     return next(new AppError('Failed to send OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP sent to phone');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(201).json({
//     success: true,
//     message: 'Registration successful. OTP sent to your phone.',
//     data: {
//       doctor: {
//         id: newDoctor._id,
//         firstName: newDoctor.firstName,
//         email: newDoctor.email,
//         phone: newDoctor.phone,
//         medicalRegistrationNumber: newDoctor.medicalRegistrationNumber
//       },
//       nextStep: 'Verify OTP sent to your phone'
//     }
//   });
// });

//main one without city id
// exports.doctorSignup = catchAsync(async (req, res, next) => {
//   const {
//     firstName,
//     lastName,
//     email,
//     phone,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     dateOfBirth,
//     gender,
//     address,
//     yearsOfExperience,
//     consultationFees,
//     degrees,
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio
//   } = req.body;

//   console.log('');
//   console.log('DOCTOR SIGNUP - STEP 1: Registration');
//   console.log('='.repeat(60));

//   if (
//     !firstName ||
//     !email ||
//     !phone ||
//     !medicalRegistrationNumber ||
//     !issuingMedicalCouncil ||
//     !specialization
//   ) {
//     return next(
//       new AppError(
//         'Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization',
//         400
//       )
//     );
//   }

//   console.log(`Phone: ${phone}`);
//   console.log(`Email: ${email}`);
//   console.log(`FirstName: ${firstName}`);

//   const existingDoctor = await Doctor.findOne({
//     $or: [{ email }, { phone }, { medicalRegistrationNumber }]
//   });

//   if (existingDoctor) {
//     if (existingDoctor.email === email) {
//       return next(new AppError('Doctor with this email already exists', 400));
//     }
//     if (existingDoctor.phone === phone) {
//       return next(
//         new AppError('Doctor with this phone number already exists', 400)
//       );
//     }
//     if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
//       return next(
//         new AppError('Doctor with this registration number already exists', 400)
//       );
//     }
//   }

//   const newDoctor = new Doctor({
//     firstName,
//     lastName: lastName || '',
//     email,
//     phone,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     dateOfBirth,
//     gender,
//     address,
//     yearsOfExperience: yearsOfExperience || 0,
//     consultationFees: consultationFees || 0,
//     degrees: degrees || [],
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio,
//     isPhoneVerified: false,
//     verificationStatus: 'pending',
//     tokenVersion: 0
//   });

//   await newDoctor.save();
//   console.log('SUCCESS: Doctor created in database');

//   const isOtpSent = await sendOtp(phone);

//   if (!isOtpSent) {
//     await Doctor.findByIdAndDelete(newDoctor._id);
//     return next(new AppError('Failed to send OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP sent to phone');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(201).json({
//     success: true,
//     message: 'Registration successful. OTP sent to your phone.',
//     data: {
//       doctor: {
//         id: newDoctor._id,
//         firstName: newDoctor.firstName,
//         email: newDoctor.email,
//         phone: newDoctor.phone,
//         medicalRegistrationNumber: newDoctor.medicalRegistrationNumber
//       },
//       nextStep: 'Verify OTP sent to your phone'
//     }
//   });
// });
//with city id 
exports.doctorSignup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    medicalRegistrationNumber,
    issuingMedicalCouncil,
    specialization,
    dateOfBirth,
    gender,
    address,
    yearsOfExperience,
    consultationFees,
    degrees,
    university,
    graduationYear,
    currentWorkplace,
    designation,
    professionalBio,
    cityId,  // Single city - or cityIds: [] for multiple
  } = req.body;

  console.log('');
  console.log('DOCTOR SIGNUP - STEP 1: Registration');
  console.log('='.repeat(60));

  // Updated required fields validation
  if (
    !firstName ||
    !email ||
    !phone ||
    !medicalRegistrationNumber ||
    !issuingMedicalCouncil ||
    !specialization ||
    !cityId
  ) {
    return next(
      new AppError(
        'Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization, cityId',
        400
      )
    );
  }

  console.log(`Phone: ${phone}`);
  console.log(`Email: ${email}`);
  console.log(`FirstName: ${firstName}`);
  console.log(`CityId: ${cityId}`);

  // Check for existing doctor
  const existingDoctor = await Doctor.findOne({
    $or: [{ email }, { phone }, { medicalRegistrationNumber }]
  });

  if (existingDoctor) {
    if (existingDoctor.email === email) {
      return next(new AppError('Doctor with this email already exists', 400));
    }
    if (existingDoctor.phone === phone) {
      return next(
        new AppError('Doctor with this phone number already exists', 400)
      );
    }
    if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
      return next(
        new AppError('Doctor with this registration number already exists', 400)
      );
    }
  }

  // ✅ UPDATED: Validate city EXISTS (active/inactive both allowed)
  const city = await City.findById(cityId);  // Only check existence, ignore isActive
  
  if (!city) {
    return next(new AppError('Selected city does not exist in available cities', 400));
  }

  console.log(`✅ Valid city found: ${city.name} (ID: ${city._id}) - Status: ${city.isActive ? 'Active' : 'Inactive'}`);

  // Create new doctor with city reference
  const newDoctor = new Doctor({
    firstName,
    lastName: lastName || '',
    email,
    phone,
    medicalRegistrationNumber,
    issuingMedicalCouncil,
    specialization,
    dateOfBirth,
    gender,
    address,
    yearsOfExperience: yearsOfExperience || 0,
    consultationFees: consultationFees || 0,
    degrees: degrees || [],
    university,
    graduationYear,
    currentWorkplace,
    designation,
    professionalBio,
    cities: [city._id],  // ✅ Add city regardless of active status
    isPhoneVerified: false,
    verificationStatus: 'pending',
    tokenVersion: 0
  });

  await newDoctor.save();
  console.log('SUCCESS: Doctor created in database with city reference');

  const isOtpSent = await sendOtp(phone);

  if (!isOtpSent) {
    await Doctor.findByIdAndDelete(newDoctor._id);
    return next(new AppError('Failed to send OTP. Please try again.', 400));
  }

  console.log('SUCCESS: OTP sent to phone');
  console.log('='.repeat(60));
  console.log('');

  res.status(201).json({
    success: true,
    message: 'Registration successful. OTP sent to your phone.',
    data: {
      doctor: {
        id: newDoctor._id,
        firstName: newDoctor.firstName,
        email: newDoctor.email,
        phone: newDoctor.phone,
        medicalRegistrationNumber: newDoctor.medicalRegistrationNumber,
        cities: newDoctor.cities,  // Include cities in response
        cityName: city.name       // Bonus: include city name
      },
      nextStep: 'Verify OTP sent to your phone'
    }
  });
});

exports.verifySignupOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  console.log('');
  console.log('DOCTOR SIGNUP - STEP 2: OTP Verification');
  console.log('='.repeat(60));
  console.log(`Phone: ${phone}`);

  const otpDoc = await Otp.findOne({ phone });

  if (
    !otpDoc ||
    otpDoc.otp !== (otp) ||
    otpDoc.otpExpiresAt < new Date()
  ) {
    console.log('ERROR: Invalid or expired OTP');
    console.log(`otpDoc: ${otpDoc}, otpDoc.otp: ${otpDoc ? otpDoc.otp : 'N/A'}`);
    return next(new AppError('Invalid or expired OTP', 400));
  }

  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found. Please register first.', 404));
  }

  if (doctor.isPhoneVerified) {
    return next(
      new AppError('Phone already verified. Please login instead.', 400)
    );
  }

  doctor.isPhoneVerified = true;
  doctor.verificationStatus = 'approved';
  await doctor.save();

  console.log('VERIFY - After update, isPhoneVerified:', doctor.isPhoneVerified);

  await Otp.deleteOne({ phone });
  console.log('SUCCESS: OTP deleted');

  // Generate tokens using utility functions - 3 separate parameters
  const accessToken = generateAccessToken(
    doctor._id,
    'doctor',
    doctor.tokenVersion
  );
  const refreshToken = generateRefreshToken(
    doctor._id,
    'doctor',
    doctor.tokenVersion
  );

  doctor.refreshToken = refreshToken;
  await doctor.save();

  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('SUCCESS: Tokens generated and cookies set');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'Phone verified successfully. Registration complete.',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        phone: doctor.phone,
        email: doctor.email,
        verificationStatus: doctor.verificationStatus,
        isPhoneVerified: doctor.isPhoneVerified
      }
    }
  });
});

exports.resendSignupOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const doctor = await Doctor.findOne({ phone });

  if (!doctor) {
    return next(new AppError('Doctor not found. Please register first.', 404));
  }

  if (doctor.isPhoneVerified) {
    return next(
      new AppError('Phone already verified. Please login instead.', 400)
    );
  }

  const isOtpResent = await sendOtp(phone);

  if (!isOtpResent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
    data: { phone }
  });
});

// ============================================
// LOGIN FLOW
// ============================================

exports.doctorLogin = catchAsync(async (req, res, next) => {
  const { phone, role = 'doctor' } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  if (role !== 'doctor') {
    return next(new AppError('Invalid role. Expected: doctor', 400));
  }

  console.log('');
  console.log('DOCTOR LOGIN - STEP 1: Send OTP');
  console.log('='.repeat(60));
  console.log(`Phone: ${phone}`);

  const doctor = await Doctor.findOne({ phone });

  if (!doctor) {
    return next(new AppError('Doctor not found. Please register first.', 404));
  }

  if (!doctor.isPhoneVerified) {
    return next(
      new AppError('Phone not verified. Please complete signup first.', 400)
    );
  }

  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  const isOtpSent = await sendOtp(phone);

  if (!isOtpSent) {
    return next(new AppError('Failed to send OTP. Please try again.', 400));
  }

  console.log('SUCCESS: OTP sent to phone');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your registered phone',
    data: {
      phone,
      role: 'doctor',
      nextStep: 'Verify OTP'
    }
  });
});

// exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return next(new AppError('Phone number and OTP are required', 400));
//   }

//   console.log('');
//   console.log('DOCTOR LOGIN - STEP 2: Verify OTP');
//   console.log('='.repeat(60));
//   console.log(`Phone: ${phone}`);

//   const otpDoc = await Otp.findOne({ phone });

//   if (
//     !otpDoc ||
//     otpDoc.otp !== parseInt(otp) ||
//     otpDoc.otpExpiresAt < new Date()
//   ) {
//     console.log('ERROR: Invalid or expired OTP');
//     return next(new AppError('Invalid or expired OTP', 400));
//   }

//   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   if (!doctor.isPhoneVerified) {
//     return next(
//       new AppError('Phone not verified. Please complete signup first.', 400)
//     );
//   }

//   if (!doctor.isActive) {
//     return next(new AppError('Your account has been deactivated.', 403));
//   }

//   await Otp.deleteOne({ phone });
//   console.log('SUCCESS: OTP verified');

//   // Generate tokens using utility functions - 3 separate parameters
//   const accessToken = generateAccessToken(
//     doctor._id,
//     'doctor',
//     doctor.tokenVersion
//   );
//   const refreshToken = generateRefreshToken(
//     doctor._id,
//     'doctor',
//     doctor.tokenVersion
//   );

//   doctor.refreshToken = refreshToken;
//   await doctor.save();

//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'OTP verified. Logged in successfully.',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       doctor: {
//         id: doctor._id,
//         firstName: doctor.firstName,
//         phone: doctor.phone,
//         email: doctor.email,
//         verificationStatus: doctor.verificationStatus
//       }
//     }
//   });
// });
exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  // 1. Basic Validation
  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  console.log('');
  console.log('DOCTOR LOGIN - STEP 2: Verify OTP');
  console.log('='.repeat(60));
  console.log(`Phone: ${phone}`);

  // 2. Find the LATEST OTP for this phone number
  const otpDoc = await Otp.findOne({ phone }).sort({ createdAt: -1 });

  // 3. Check if document exists
  if (!otpDoc) {
    console.log('ERROR: No OTP record found in database');
    return next(new AppError('No OTP found for this number. Please request a new one.', 400));
  }

  // 4. Manual Expiry Check (Safety fallback for MongoDB TTL delay)
  if (otpDoc.otpExpiresAt < new Date()) {
    console.log('ERROR: OTP document exists but is expired');
    return next(new AppError('OTP has expired. Please resend.', 400));
  }

  // 5. Secure String Comparison (Prevents parseInt/leading zero issues)
  if (otpDoc.otp.toString() !== otp.toString()) {
    otpDoc.attempts = (otpDoc.attempts || 0) + 1;
    await otpDoc.save();
    
    console.log(`ERROR: OTP Mismatch. Attempt ${otpDoc.attempts}/5`);
    return next(new AppError('Invalid OTP', 400));
  }

  // 6. Fetch Doctor & Validate Status
  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (!doctor.isPhoneVerified) {
    return next(new AppError('Phone not verified. Please complete signup first.', 400));
  }

  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  // 7. Cleanup: Delete all used OTPs for this phone
  await Otp.deleteMany({ phone });
  console.log('SUCCESS: OTP verified and deleted');

  // 8. Generate Tokens using 3-parameter utility pattern
  const accessToken = generateAccessToken(
    doctor._id,
    'doctor',
    doctor.tokenVersion
  );
  const refreshToken = generateRefreshToken(
    doctor._id,
    'doctor',
    doctor.tokenVersion
  );

  // 9. Update Doctor's refresh token and persist
  doctor.refreshToken = refreshToken;
  await doctor.save();

  // 10. Set Authentication Cookies
  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('SUCCESS: Tokens generated and cookies set');
  console.log('='.repeat(60));
  console.log('');

  // 11. Send Response
  res.status(200).json({
    success: true,
    message: 'OTP verified. Logged in successfully.',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        verificationStatus: doctor.verificationStatus
      }
    }
  });
});

exports.resendLoginOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const doctor = await Doctor.findOne({ phone });

  if (!doctor) {
    return next(new AppError('Doctor not found. Please register first.', 404));
  }

  if (!doctor.isPhoneVerified) {
    return next(
      new AppError('Phone not verified. Please complete signup first.', 400)
    );
  }

  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  const isOtpResent = await sendOtp(phone);

  if (!isOtpResent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
    data: { phone }
  });
});


// LOGOUT


exports.logout = catchAsync(async (req, res, next) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

exports.logoutAllDevices = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.tokenVersion = (doctor.tokenVersion || 0) + 1;
  await doctor.save({ validateBeforeSave: false });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});


// PROFILE MANAGEMENT


exports.getMyProfile = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user?._id || req.user?.id).select(
    '-password -tokenVersion'
  );

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { doctor }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const {
    password,
    role,
    tokenVersion,
    verificationStatus,
    medicalRegistrationNumber,
    ...updateData
  } = req.body;

  const doctorId = req.user?._id || req.user?.id;
  const beforeDoctor = await Doctor.findById(doctorId).select('-password -tokenVersion');

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    doctorId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');

  if (!updatedDoctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const changedFields = getChangedFields(beforeDoctor, updatedDoctor, Object.keys(updateData));
  await writeProfileAudit({
    req,
    actorId: doctorId,
    actorRole: 'doctor',
    targetModel: 'Doctor',
    targetId: doctorId,
    action: 'update',
    changedFields,
    before: beforeDoctor,
    after: updatedDoctor
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { doctor: updatedDoctor }
  });
});


// AUTHENTICATION STATUS


exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  console.log('=== DEBUG: Inside checkAuthStatus ===');
  console.log('Cookies:', req.cookies);

  const { accessToken, refreshToken } = req.cookies || {};
  console.log('Refresh token present:', !!refreshToken);

  if (!refreshToken || refreshToken === 'undefined') {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      message: 'refresh token expired',
      shouldLogout: true
    });
  }

  if (accessToken && accessToken !== 'undefined') {
    try {
      const decoded = verifyToken(accessToken, 'access');
      console.log('Access token valid:', decoded.id);

      const doctor = await Doctor.findById(decoded.id);

      if (doctor) {
        res.cookie('isAuthenticated', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 90 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: doctor._id,
            firstName: doctor.firstName,
            phone: doctor.phone,
            email: doctor.email,
            verificationStatus: doctor.verificationStatus
          }
        });
      }
    } catch (error) {
      console.log('Access token verification failed:', error.message);
    }
  }

  if (refreshToken && refreshToken !== 'undefined') {
    try {
      const decoded = verifyToken(refreshToken, 'refresh');
      console.log('Refresh token valid:', decoded.id);

      const doctor = await Doctor.findById(decoded.id).select('+tokenVersion');

      if (doctor) {
        console.log('Token versions - Doctor:', doctor.tokenVersion, 'Decoded:', decoded.tokenVersion);
      }

      if (!doctor || doctor.tokenVersion !== decoded.tokenVersion) {
        return next(new AppError('Invalid refresh token - please login again', 401));
      }

      // Generate new access token - 3 separate parameters
      const newAccessToken = generateAccessToken(
        doctor._id,
        'doctor',
        doctor.tokenVersion
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000
      });

      res.cookie('isAuthenticated', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 90 * 24 * 60 * 60 * 1000
      });

      res.setHeader('X-New-Token', newAccessToken);
      res.setHeader('X-Token-Refreshed', 'true');

      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        data: {
          id: doctor._id,
          firstName: doctor.firstName,
          phone: doctor.phone,
          email: doctor.email,
          verificationStatus: doctor.verificationStatus
        }
      });
    } catch (error) {
      console.log('Refresh token verification failed:', error.message);
      return next(new AppError('Session expired - please login again', 401));
    }
  }

  res.cookie('isAuthenticated', 'false', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 90 * 24 * 60 * 60 * 1000
  });

  return res.status(200).json({
    success: false,
    isAuthenticated: false,
    message: 'Authentication required - please login',
    shouldLogout: true
  });
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================
exports.getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select(
    '-password -tokenVersion -verificationDocuments'
  );

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { doctor }
  });
});


exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const { specialization, city, page = 1, limit = 10 } = req.query;

  const filter = {
    isActive: true,
    verificationStatus: 'approved'
  };

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' };
  }

  if (city) {
    filter['address.city'] = { $regex: city, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const doctors = await Doctor.find(filter)
    .select('-password -tokenVersion -verificationDocuments')
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-averageRating -createdAt');

  const total = await Doctor.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { doctors }
  });
});


exports.getDoctorsBySpecialization = catchAsync(async (req, res, next) => {
  const { specialization } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const doctors = await Doctor.find({
    specialization: { $regex: specialization, $options: 'i' },
    verificationStatus: 'approved',
    isActive: true
  })
    .select('-password -tokenVersion -verificationDocuments')
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-averageRating');

  const total = await Doctor.countDocuments({
    specialization: { $regex: specialization, $options: 'i' },
    verificationStatus: 'approved',
    isActive: true
  });

  res.status(200).json({
    success: true,
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { doctors }
  });
});

// ============================================
// AVAILABILITY MANAGEMENT
// ============================================

exports.updateAvailability = catchAsync(async (req, res, next) => {
  const { days, timeSlots } = req.body;

  if (!days || !timeSlots) {
    return next(new AppError('Please provide days and timeSlots', 400));
  }

  const normalizedTimeSlots = (timeSlots || []).map((slot) => ({
    start: slot.start || slot.startTime,
    end: slot.end || slot.endTime,
  }));

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.user?._id || req.user?.id,
    { availability: { days, timeSlots: normalizedTimeSlots } },
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');

  if (!updatedDoctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Availability updated successfully',
    data: { doctor: updatedDoctor }
  });
});

// ============================================
// CLINIC MANAGEMENT
// ============================================

// exports.addClinic = catchAsync(async (req, res, next) => {
//   const clinicData = req.body;

//   // if (!clinicData.clinicfirstName || !clinicData.address) {
//   //   return next(new AppError('Please provide clinic firstName and address', 400));
//   // }
// if (!clinicData.clinicName || !clinicData.address) {
//   return next(new AppError('Please provide clinic name and address', 400));
// }
//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.push(clinicData);
//   await doctor.save();

//   res.status(201).json({
//     success: true,
//     message: 'Clinic added successfully',
//     data: { clinics: doctor.clinics }
//   });
// });






exports.addClinic = catchAsync(async (req, res, next) => {
  const { clinics } = req.body;

  if (!clinics || !Array.isArray(clinics) || clinics.length === 0) {
    return next(new AppError('Please provide clinics array', 400));
  }

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (!Array.isArray(doctor.clinics)) {
    doctor.clinics = [];
  }

  const preparedClinics = [];

  for (const clinic of clinics) {
    if (!clinic.clinicName || !clinic.address) {
      return next(
        new AppError('Each clinic must have clinicName and address', 400)
      );
    }

    if (!clinic.cityId) {
      return next(new AppError('cityId is required for each clinic', 400));
    }

    if (
      !clinic.location ||
      clinic.location.type !== 'Point' ||
      !Array.isArray(clinic.location.coordinates) ||
      clinic.location.coordinates.length !== 2
    ) {
      return next(
        new AppError('Each clinic must have valid location coordinates', 400)
      );
    }

    const doctorHasCity = doctor.cities.some(
      (city) => city.toString() === clinic.cityId.toString()
    );

    if (!doctorHasCity) {
      return next(
        new AppError('Doctor is not allowed to add clinic in this city', 403)
      );
    }

    // const matchedCity = await City.findOne({
    //   _id: clinic.cityId,
    //   isActive: true,
    //   area: {
    //     $geoWithin: {
    //       $geometry: {
    //         type: 'Point',
    //         coordinates: clinic.location.coordinates
    //       }
    //     }
    //   }
    // });



    // Simply verify that the city exists and is active in your database
const matchedCity = await City.findOne({
  _id: clinic.cityId,
  isActive: true
});

if (!matchedCity) {
  return next(
    new AppError('The selected city is either invalid or inactive', 400)
  );
}
    // if (!matchedCity) {
    //   return next(
    //     new AppError('Clinic location is outside the selected city area', 400)
    //   );
    // }

    preparedClinics.push({
      ...clinic,
      doctorId: doctor._id,
      cityId: clinic.cityId
    });
  }

  doctor.clinics.push(...preparedClinics);
  await doctor.save();

  res.status(201).json({
    success: true,
    message: 'Clinics added successfully',
    data: {
      doctorId: doctor._id,
      clinics: doctor.clinics
    }
  });
});
// exports.addClinic = catchAsync(async (req, res, next) => {
//   const { clinics } = req.body;

//   if (!clinics || !Array.isArray(clinics) || clinics.length === 0) {
//     return next(new AppError('Please provide clinics array', 400));
//   }

//   for (const clinic of clinics) {
//     if (!clinic.clinicName || !clinic.address) {
//       return next(
//         new AppError('Each clinic must have clinicName and address', 400)
//       );
//     }
//   }

//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.push(...clinics);

//   await doctor.save();

//   res.status(201).json({
//     success: true,
//     message: 'Clinics added successfully',
//     data: {
//       clinics: doctor.clinics
//     }
//   });
// });
exports.updateClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;
  const { clinics } = req.body;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // =========================
  // MULTIPLE CLINICS UPDATE
  // =========================
  if (Array.isArray(clinics) && clinics.length > 0) {

    const updatedClinics = [];

    clinics.forEach((clinicData) => {
      if (!clinicData._id) {
        return;
      }

      const clinic = doctor.clinics.id(clinicData._id);

      if (clinic) {
        Object.assign(clinic, clinicData);
        updatedClinics.push(clinic);
      }
    });

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Clinics updated successfully',
      data: {
        clinics: updatedClinics
      }
    });
  }

  // =========================
  // SINGLE CLINIC UPDATE
  // =========================
  const clinic = doctor.clinics.id(clinicId);

  if (!clinic) {
    return next(new AppError('Clinic not found', 404));
  }

  Object.assign(clinic, req.body);

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Clinic updated successfully',
    data: {
      clinic
    }
  });
});


exports.deleteClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;
  const { clinicIds } = req.body;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // =========================
  // MULTIPLE CLINICS DELETE
  // =========================
  if (Array.isArray(clinicIds) && clinicIds.length > 0) {

    clinicIds.forEach((id) => {
      doctor.clinics.pull(id);
    });

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Clinics deleted successfully',
      data: null
    });
  }

  // =========================
  // SINGLE CLINIC DELETE
  // =========================
  doctor.clinics.pull(clinicId);

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Clinic deleted successfully',
    data: null
  });
});
// exports.updateClinic = catchAsync(async (req, res, next) => {
//   const { clinicId } = req.params;
//   const updateData = req.body;

//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   const clinic = doctor.clinics.id(clinicId);

//   if (!clinic) {
//     return next(new AppError('Clinic not found', 404));
//   }

//   Object.assign(clinic, updateData);
//   await doctor.save();

//   res.status(200).json({
//     success: true,
//     message: 'Clinic updated successfully',
//     data: { clinic }
//   });
// });

// exports.deleteClinic = catchAsync(async (req, res, next) => {
//   const { clinicId } = req.params;

//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.pull(clinicId);
//   await doctor.save();

//   res.status(200).json({
//     success: true,
//     message: 'Clinic deleted successfully',
//     data: null
//   });
// });


exports.getAllClinics = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    results: doctor.clinics ? doctor.clinics.length : 0,
    data: {
      clinics: doctor.clinics || []
    }
  });
});


exports.getClinicById = catchAsync(async (req, res, next) => {

  const { clinicId } = req.params;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const clinic = doctor.clinics.id(clinicId);

  if (!clinic) {
    return next(new AppError('Clinic not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      clinic
    }
  });
});





// ============================================
// VERIFICATION DOCUMENTS
// ============================================

exports.uploadVerificationDocuments = catchAsync(async (req, res, next) => {
  const {
    identityProof,
    degreesCertificates,
    medicalCouncilRegistration
  } = req.body;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const toStringOrNull = (value) => {
    if (value == null) return null;
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
      if (typeof value.url === "string" && value.url.trim()) return value.url.trim();
      if (typeof value.number === "string" && value.number.trim()) return value.number.trim();
      if (typeof value.regNo === "string" && value.regNo.trim()) return value.regNo.trim();
      return JSON.stringify(value);
    }
    return String(value);
  };

  const toStringArray = (value) => {
    if (value == null) return [];
    if (!Array.isArray(value)) return [toStringOrNull(value)].filter(Boolean);
    return value.map((entry) => toStringOrNull(entry)).filter(Boolean);
  };

  if (identityProof) {
    doctor.verificationDocuments.identityProof = toStringOrNull(identityProof);
  }

  if (degreesCertificates) {
    doctor.verificationDocuments.degreesCertificates = toStringArray(
      degreesCertificates
    );
  }

  if (medicalCouncilRegistration) {
    doctor.verificationDocuments.medicalCouncilRegistration =
      toStringOrNull(medicalCouncilRegistration);
  }

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Verification documents uploaded successfully',
    data: {
      verificationDocuments: doctor.verificationDocuments
    }
  });
});


//doctior city 
// 1. Get logged-in doctor's all cities
// 1. Get doctor's all cities by doctor ID
exports.getDoctorCities = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  console.log('');
  console.log('GET DOCTOR: MY CITIES');
  console.log('='.repeat(60));
  console.log(`Doctor ID: ${doctorId}`);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  const doctor = await Doctor.findById(doctorId).populate('cities', 'name latitude longitude state country');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  console.log(`Doctor: ${doctor.firstName} ${doctor.lastName || ''}`);
  console.log(`Total Cities: ${doctor.cities.length}`);
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'Cities retrieved successfully',
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        medicalRegistrationNumber: doctor.medicalRegistrationNumber,
        specialization: doctor.specialization,
        totalCities: doctor.cities.length,
        cities: doctor.cities
      }
    }
  });
});

// 2. Get doctor's cities filtered by city name
exports.getDoctorCitiesByName = catchAsync(async (req, res, next) => {
  const { doctorId, cityName } = req.params;

  console.log('');
  console.log('GET DOCTOR: CITIES BY NAME');
  console.log('='.repeat(60));
  console.log(`Doctor ID: ${doctorId}`);
  console.log(`City Name: ${cityName}`);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  if (!cityName || cityName.trim().length === 0) {
    return next(new AppError('City name is required', 400));
  }

  const doctor = await Doctor.findById(doctorId).populate({
    path: 'cities',
    select: 'name latitude longitude state country',
    match: { name: { $regex: cityName, $options: 'i' } }
  });

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  console.log(`Doctor: ${doctor.firstName} ${doctor.lastName || ''}`);
  console.log(`Matching Cities: ${doctor.cities.length}`);
  console.log('='.repeat(60));
  console.log('');

  if (doctor.cities.length === 0) {
    return res.status(404).json({
      success: false,
      message: `Doctor is not available in city: ${cityName}`,
      data: {
        cities: []
      }
    });
  }

  res.status(200).json({
    success: true,
    message: `Cities matching "${cityName}" retrieved successfully`,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        totalCities: doctor.cities.length,
        cities: doctor.cities
      }
    }
  });
});



exports.getDoctorsByCityName = catchAsync(async (req, res, next) => {
  const { cityName } = req.params;

  console.log('');
  console.log('GET DOCTORS BY CITY NAME');
  console.log('='.repeat(60));
  console.log(`City Name: ${cityName}`);

  if (!cityName || cityName.trim().length === 0) {
    return next(new AppError('City name is required', 400));
  }

  // Find city by name
  const city = await City.findOne({ name: { $regex: cityName, $options: 'i' } });

  if (!city) {
    return next(new AppError(`City not found: ${cityName}`, 404));
  }

  console.log(`City Found: ${city.name}`);
  console.log(`City ID: ${city._id}`);

  // Find all doctors that have this city
  const doctors = await Doctor.find({ cities: city._id }).populate('cities', 'name latitude longitude state country');

  console.log(`Total Doctors in ${city.name}: ${doctors.length}`);
  console.log('='.repeat(60));
  console.log('');

  if (doctors.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No doctors found in city: ${cityName}`,
      data: {
        city: {
          id: city._id,
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          state: city.state,
          country: city.country
        },
        doctors: []
      }
    });
  }

  res.status(200).json({
    success: true,
    message: `${doctors.length} doctor(s) found in ${cityName}`,
    data: {
      city: {
        id: city._id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        state: city.state,
        country: city.country
      },
      totalDoctors: doctors.length,
      doctors: doctors.map(doctor => ({
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        medicalRegistrationNumber: doctor.medicalRegistrationNumber,
        specialization: doctor.specialization,
        cities: doctor.cities,
        totalCities: doctor.cities.length
      }))
    }
  });
});





// exports.setupWeeklyAvailability = async (req, res) => {
//   try {
//     const doctorId = req.user.id;
//     let { days, timeSlots, serviceAvailability, serviceCoverage, autoSlotGeneration } = req.body;

//     const doctor = await Doctor.findById(doctorId);

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     // Validate days: must be array of ["Monday", ...] and not empty
//     const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//     if (days) {
//       if (!Array.isArray(days) || days.length === 0 || !days.every(day => validDays.includes(day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()))) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid days. Each must be a valid weekday, e.g., "Monday".'
//         });
//       }
//       // Normalize days to capitalized form for DB
//       doctor.availability.days = days.map(day => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
//     }

//     // Validate timeSlots: must be array of {start, end} with both present and HH:mm format
//     if (timeSlots) {
//       if (!Array.isArray(timeSlots) || timeSlots.length === 0 || !timeSlots.every(slot =>
//         slot.start && slot.end &&
//         /^\d{2}:\d{2}$/.test(slot.start) &&
//         /^\d{2}:\d{2}$/.test(slot.end)
//       )) {
//         return res.status(400).json({
//           success: false,
//           message: 'Each timeSlot must have start and end as "HH:mm" strings.'
//         });
//       }
//       doctor.availability.timeSlots = timeSlots;
//     }

//     if (serviceAvailability) doctor.availability.serviceAvailability = serviceAvailability;
//     if (serviceCoverage) doctor.availability.serviceCoverage = serviceCoverage;
//     if (autoSlotGeneration) {
//       doctor.availability.autoSlotGeneration = {
//         ...doctor.availability.autoSlotGeneration,
//         ...autoSlotGeneration
//       };
//     }

//     await doctor.save();

//     res.status(200).json({
//       success: true,
//       message: 'Availability configured successfully',
//       data: doctor.availability
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error configuring availability',
//       error: error.message
//     });
//   }
// };

// Generate Daily Slots
// exports.generateDailySlots = async (req, res) => {
//   try {
//     const doctorId = req.user.id;
//     const { startDate, endDate, slotDuration, bufferTime } = req.body;

//     const doctor = await Doctor.findById(doctorId);
    
//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     const slotConfig = {
//       duration: slotDuration,
//       buffer: bufferTime
//     };

//     const generatedSlots = await doctor.generateSlots(
//       new Date(startDate),
//       new Date(endDate),
//       slotConfig
//     );

//     // Merge with existing slots
//     generatedSlots.forEach(newSlot => {
//       const existingIndex = doctor.availability.dailySlots.findIndex(
//         ds => ds.date.toDateString() === newSlot.date.toDateString()
//       );
      
//       if (existingIndex === -1) {
//         doctor.availability.dailySlots.push(newSlot);
//       }
//     });

//     await doctor.save();

//     res.status(200).json({
//       success: true,
//       message: `Generated slots for ${generatedSlots.length} days`,
//       data: generatedSlots
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error generating slots',
//       error: error.message
//     });
//   }
// };



exports.configureAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { 
      days, 
      timeSlots, 
      serviceAvailability, 
      serviceCoverage,
      slotDuration,
      bufferTime,
      startDate,
      endDate 
    } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.availability || typeof doctor.availability !== "object") {
      doctor.availability = {};
    }
    if (!Array.isArray(doctor.availability.days)) {
      doctor.availability.days = [];
    }
    if (!Array.isArray(doctor.availability.timeSlots)) {
      doctor.availability.timeSlots = [];
    }
    if (!Array.isArray(doctor.availability.dailySlots)) {
      doctor.availability.dailySlots = [];
    }
    if (
      !doctor.availability.autoSlotGeneration ||
      typeof doctor.availability.autoSlotGeneration !== "object"
    ) {
      doctor.availability.autoSlotGeneration = {
        enabled: false,
        defaultDuration: 30,
        bufferBetweenSlots: 0,
        advanceBookingDays: 30,
      };
    }

    // Validate days
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (days) {
      if (!Array.isArray(days) || days.length === 0 || !days.every(day => validDays.includes(day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()))) {
        return res.status(400).json({ success: false, message: 'Invalid days format' });
      }
      doctor.availability.days = days.map(day => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
    }

    // Validate timeSlots
    if (timeSlots) {
      if (!Array.isArray(timeSlots) || timeSlots.length === 0 || !timeSlots.every(slot =>
        slot.start && slot.end && /^\d{2}:\d{2}$/.test(slot.start) && /^\d{2}:\d{2}$/.test(slot.end)
      )) {
        return res.status(400).json({ success: false, message: 'Each timeSlot must have start and end as HH:mm' });
      }
      doctor.availability.timeSlots = timeSlots;
    }

    // ✅ Handle Mixed type - accepts string, array, or object
    if (serviceAvailability !== undefined) {
      doctor.availability.serviceAvailability = serviceAvailability;
      doctor.markModified('availability.serviceAvailability');
    }

    // ✅ Handle Mixed type - accepts array or object
    if (serviceCoverage !== undefined) {
      doctor.availability.serviceCoverage = serviceCoverage;
      doctor.markModified('availability.serviceCoverage');
    }

    // Auto-generate daily slots if date range + slot config provided
    let slotsGenerated = false;
    if (startDate && endDate && slotDuration) {
      if (
        !Array.isArray(doctor.availability.days) ||
        doctor.availability.days.length === 0 ||
        !Array.isArray(doctor.availability.timeSlots) ||
        doctor.availability.timeSlots.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Configure availability.days and availability.timeSlots before auto slot generation",
        });
      }

      const slotConfig = {
        duration: slotDuration,
        buffer: bufferTime ?? 0
      };

      const generatedSlots = await doctor.generateSlots(
        new Date(startDate),
        new Date(endDate),
        slotConfig
      );

      generatedSlots.forEach(newSlot => {
        const existingIndex = doctor.availability.dailySlots.findIndex(
          ds => ds.date.toDateString() === newSlot.date.toDateString()
        );
        if (existingIndex === -1) {
          doctor.availability.dailySlots.push(newSlot);
        }
      });
      slotsGenerated = true;
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Availability configured successfully',
      data: {
        availability: doctor.availability,
        slotsGenerated
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error configuring availability', 
      error: error.message 
    });
  }
};



// Get doctor's service availability by doctor ID
// exports.getServiceAvailability = async (req, res) => {
//   try {
//     const { doctorId } = req.params;

//     // Find doctor and populate services
//     const doctor = await Doctor.findById(doctorId)
//       .select('firstName email phone specialization consultationFees availability services')
//       .populate('services', 'name description price duration');

//     if (!doctor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Doctor not found' 
//       });
//     }

//     // Check if doctor is active
//     if (!doctor.isActive) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Doctor is not currently active' 
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         doctorInfo: {
//           id: doctor._id,
//           name: doctor.firstName,
//           email: doctor.email,
//           phone: doctor.phone,
//           specialization: doctor.specialization,
//           consultationFees: doctor.consultationFees
//         },
//         services: doctor.services,
//         availability: {
//           days: doctor.availability.days,
//           timeSlots: doctor.availability.timeSlots,
//           serviceAvailability: doctor.availability.serviceAvailability,
//           serviceCoverage: doctor.availability.serviceCoverage,
//           autoSlotGeneration: doctor.availability.autoSlotGeneration
//         },
//         dailySlots: doctor.availability.dailySlots
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching service availability', 
//       error: error.message 
//     });
//   }
// };

exports.getServiceAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId)
      .select('firstName email phone specialization consultationFees availability services')
      .populate('services', 'name description price duration');

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    //  REMOVE THIS CHECK
    // if (!doctor.isActive) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Doctor is not currently active' 
    //   });
    // }

    res.status(200).json({
      success: true,
      data: {
        doctorInfo: {
          id: doctor._id,
          name: doctor.firstName,
          email: doctor.email,
          phone: doctor.phone,
          specialization: doctor.specialization,
          consultationFees: doctor.consultationFees
        },
        services: doctor.services,
        availability: {
          days: doctor.availability.days,
          timeSlots: doctor.availability.timeSlots,
          serviceAvailability: doctor.availability.serviceAvailability,
          serviceCoverage: doctor.availability.serviceCoverage,
          autoSlotGeneration: doctor.availability.autoSlotGeneration
        },
        dailySlots: doctor.availability.dailySlots
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching service availability', 
      error: error.message 
    });
  }
};



// Get Available Slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findById(doctorId)
      .select('firstName specialization availability averageRating consultationFees');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    let availableSlots = [];
    if (typeof doctor.getAvailableSlotsByDateRange === "function") {
      availableSlots = doctor.getAvailableSlotsByDateRange(startDate, endDate);
    } else {
      const allDaily = Array.isArray(doctor.availability?.dailySlots) ? doctor.availability.dailySlots : [];
      let filtered = allDaily;
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date("1970-01-01");
        const end = endDate ? new Date(endDate) : new Date("2999-12-31");
        filtered = allDaily.filter((d) => {
          const slotDate = new Date(d.date);
          return slotDate >= start && slotDate <= end;
        });
      }
      availableSlots = filtered.map((d) => ({
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        slots: (d.slots || []).filter((s) => s.status === "available" && !s.isBooked && s.isSlotAvailable !== false),
      }));
    }

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.firstName,
        specialization: doctor.specialization,
        rating: doctor.averageRating,
        fees: doctor.consultationFees
      },
      availableSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
};

// Toggle Slot Availability
exports.toggleSlotAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, startTime, isSlotAvailable } = req.body;

    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    let updatedSlot = null;
    if (typeof doctor.toggleSlotAvailability === "function") {
      updatedSlot = doctor.toggleSlotAvailability(date, startTime, isSlotAvailable);
    } else {
      const dailySlot = doctor.availability.dailySlots.find(
        (ds) => new Date(ds.date).toDateString() === new Date(date).toDateString()
      );
      if (!dailySlot) {
        return res.status(404).json({
          success: false,
          message: "No slots found for this date",
        });
      }
      const slot = dailySlot.slots.find((s) => s.startTime === startTime);
      if (!slot) {
        return res.status(404).json({
          success: false,
          message: "Slot not found",
        });
      }
      slot.isSlotAvailable = Boolean(isSlotAvailable);
      slot.status = slot.isSlotAvailable ? "available" : "blocked";
      updatedSlot = slot;
    }
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Slot ${isSlotAvailable ? 'enabled' : 'disabled'} successfully`,
      data: updatedSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// Add Break Time
exports.addBreakTime = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, startTime, endTime, reason } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "date, startTime and endTime are required",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    let updatedSlot;
    if (typeof doctor.addBreakTime === "function") {
      updatedSlot = doctor.addBreakTime(date, startTime, endTime, reason);
    } else {
      const targetDate = new Date(date);
      if (Number.isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }
      if (!doctor.availability || typeof doctor.availability !== "object") {
        doctor.availability = {};
      }
      if (!Array.isArray(doctor.availability.dailySlots)) {
        doctor.availability.dailySlots = [];
      }
      let dailySlot = doctor.availability.dailySlots.find(
        (ds) => new Date(ds.date).toDateString() === targetDate.toDateString()
      );
      if (!dailySlot) {
        dailySlot = { date: targetDate, slots: [], breakTimes: [] };
        doctor.availability.dailySlots.push(dailySlot);
      }
      if (!Array.isArray(dailySlot.breakTimes)) {
        dailySlot.breakTimes = [];
      }
      updatedSlot = { startTime, endTime, reason: reason || "Break", isRecurring: false };
      dailySlot.breakTimes.push(updatedSlot);
      if (Array.isArray(dailySlot.slots)) {
        dailySlot.slots.forEach((slot) => {
          if (slot.startTime >= startTime && slot.startTime < endTime && !slot.isBooked) {
            slot.status = "blocked";
            slot.isSlotAvailable = false;
          }
        });
      }
    }
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Break time added successfully',
      data: updatedSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};




//remove break time 
exports.removeBreakTime = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id || req.user._id;
  const { date, startTime } = req.body;

  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const dailySlot = doctor.availability.dailySlots.find(
    ds => ds.date.toDateString() === new Date(date).toDateString()
  );

  if (!dailySlot) {
    return next(new AppError('No slots found for this date', 404));
  }

  const breakIndex = dailySlot.breakTimes.findIndex(
    bt => bt.startTime === startTime
  );

  if (breakIndex === -1) {
    return next(new AppError('Break time not found', 404));
  }

  const breakTime = dailySlot.breakTimes[breakIndex];
  dailySlot.breakTimes.splice(breakIndex, 1);

  // Unblock slots that were blocked due to this break
  dailySlot.slots.forEach(slot => {
    if (slot.startTime >= breakTime.startTime && 
        slot.startTime < breakTime.endTime && 
        !slot.isBooked) {
      slot.status = 'available';
      slot.isSlotAvailable = true;
    }
  });

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Break time removed successfully',
    data: dailySlot
  });
});

// Get Doctor's Own Availability
exports.getMyAvailability = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id || req.user._id;

  const doctor = await Doctor.findById(doctorId)
    .select('availability firstName specialization');
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: doctor.availability
  });
});

// Update Service Availability
exports.updateServiceAvailability = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id || req.user._id;
  const { serviceType, isOffering, modes, pricing, slotDuration, maxBookingsPerDay } = req.body;

  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (!doctor.availability || typeof doctor.availability !== "object") {
    doctor.availability = {};
  }
  if (!Array.isArray(doctor.availability.serviceAvailability)) {
    doctor.availability.serviceAvailability = [];
  }

  const serviceIndex = doctor.availability.serviceAvailability.findIndex(
    sa => sa.serviceType === serviceType
  );

  if (serviceIndex > -1) {
    // Update existing
    doctor.availability.serviceAvailability[serviceIndex] = {
      serviceType,
      isOffering,
      modes,
      pricing,
      slotDuration,
      maxBookingsPerDay
    };
  } else {
    // Add new
    doctor.availability.serviceAvailability.push({
      serviceType,
      isOffering,
      modes,
      pricing,
      slotDuration,
      maxBookingsPerDay
    });
  }

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Service availability updated successfully',
    data: doctor.availability.serviceAvailability
  });
});

// Update Service Coverage
exports.updateServiceCoverage = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id || req.user._id;
  const { areas, maxDistance, homeServiceCharges } = req.body;

  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.availability.serviceCoverage = {
    areas: areas || doctor.availability.serviceCoverage.areas,
    maxDistance: maxDistance || doctor.availability.serviceCoverage.maxDistance,
    homeServiceCharges: homeServiceCharges || doctor.availability.serviceCoverage.homeServiceCharges
  };

  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Service coverage updated successfully',
    data: doctor.availability.serviceCoverage
  });
});

// Bulk Manage Slots
exports.bulkManageSlots = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id || req.user._id;
  const { date, action, timeRange } = req.body; // action: 'block' or 'unblock'

  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const dailySlot = doctor.availability.dailySlots.find(
    ds => ds.date.toDateString() === new Date(date).toDateString()
  );

  if (!dailySlot) {
    return next(new AppError('No slots found for this date', 404));
  }

  let updatedCount = 0;

  dailySlot.slots.forEach(slot => {
    if (timeRange) {
      // Block/unblock slots within time range
      if (slot.startTime >= timeRange.start && slot.startTime < timeRange.end) {
        if (!slot.isBooked) {
          slot.isSlotAvailable = action === 'unblock';
          slot.status = action === 'block' ? 'blocked' : 'available';
          updatedCount++;
        }
      }
    } else {
      // Block/unblock all slots
      if (!slot.isBooked) {
        slot.isSlotAvailable = action === 'unblock';
        slot.status = action === 'block' ? 'blocked' : 'available';
        updatedCount++;
      }
    }
  });

  await doctor.save();

  res.status(200).json({
    success: true,
    message: `${updatedCount} slots ${action}ed successfully`,
    data: dailySlot
  });
});
