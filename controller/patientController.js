// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Patient = require('../models/patientModel');
// const Doctor = require('../models/doctorModel');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   setAuthCookies,
//   clearAuthCookies,
//   verifyToken
// } = require('../utils/tokenUtils');

// // ============================================
// // PATIENT SIGNUP
// // ============================================

// exports.patientSignup = catchAsync(async (req, res, next) => {
//   const {
//     firstName,
//     email,
//     phone,
//     password,
//     dateOfBirth,
//     gender,
//     address,
//     bloodGroup,
//     emergencyContact
//   } = req.body;

//   console.log('');
//   console.log('PATIENT SIGNUP - Registration');
//   console.log('='.repeat(60));

//   // Validate required fields
//   if (!firstName || !email || !phone || !password) {
//     return next(
//       new AppError(
//         'Please provide all required fields: firstName, email, phone, password',
//         400
//       )
//     );
//   }

//   console.log(`firstName: ${firstName}`);
//   console.log(`Email: ${email}`);
//   console.log(`Phone: ${phone}`);

//   // Check if patient already exists
//   const existingPatient = await Patient.findOne({
//     $or: [{ email }, { phone }]
//   });

//   if (existingPatient) {
//     if (existingPatient.email === email) {
//       return next(
//         new AppError('Patient with this email already exists', 400)
//       );
//     }
//     if (existingPatient.phone === phone) {
//       return next(
//         new AppError('Patient with this phone number already exists', 400)
//       );
//     }
//   }

//   // Create new patient
//   const newPatient = await Patient.create({
//     firstName,
//     email,
//     phone,
//     password,
//     dateOfBirth,
//     gender,
//     address,
//     bloodGroup,
//     emergencyContact,
//     tokenVersion: 0
//   });

//   console.log('SUCCESS: Patient created in database');

//   // Generate tokens
//   const accessToken = generateAccessToken(
//     newPatient._id,
//     'patient',
//     newPatient.tokenVersion
//   );
//   const refreshToken = generateRefreshToken(
//     newPatient._id,
//     'patient',
//     newPatient.tokenVersion
//   );

//   // Save refresh token to database
//   newPatient.refreshToken = refreshToken;
//   await newPatient.save({ validateBeforeSave: false });

//   // Set cookies
//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   // Remove password from output
//   newPatient.password = undefined;
//   newPatient.tokenVersion = undefined;

//   res.status(201).json({
//     success: true,
//     message: 'Patient registration successful',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       user: newPatient,
//       role: 'patient'
//     }
//   });
// });

// // ============================================
// // PATIENT LOGIN
// // ============================================

// exports.patientLogin = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   console.log('');
//   console.log('PATIENT LOGIN - Authentication');
//   console.log('='.repeat(60));

//   // 1) Validate input
//   if (!email || !password) {
//     return next(new AppError('Please provide email and password', 400));
//   }

//   console.log(`Email: ${email}`);

//   // 2) Find patient and include password & tokenVersion
//   const patient = await Patient.findOne({ email }).select(
//     '+password +tokenVersion'
//   );

//   if (!patient) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 3) Compare password
//   const isPasswordCorrect = await patient.comparePassword(
//     password,
//     patient.password
//   );

//   if (!isPasswordCorrect) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 4) Check if patient is active
//   if (!patient.isActive) {
//     return next(
//       new AppError(
//         'Your account has been deactivated. Please contact support.',
//         403
//       )
//     );
//   }

//   console.log('SUCCESS: Patient authenticated');

//   // 5) Generate tokens
//   const accessToken = generateAccessToken(
//     patient._id,
//     'patient',
//     patient.tokenVersion
//   );
//   const refreshToken = generateRefreshToken(
//     patient._id,
//     'patient',
//     patient.tokenVersion
//   );

//   // Save refresh token to database
//   patient.refreshToken = refreshToken;
//   await patient.save({ validateBeforeSave: false });

//   // 6) Set cookies
//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   // 7) Remove sensitive fields from output
//   patient.password = undefined;
//   patient.tokenVersion = undefined;

//   res.status(200).json({
//     success: true,
//     message: 'Login successful',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       user: patient,
//       role: 'patient'
//     }
//   });
// });

// // ============================================
// // PATIENT LOGOUT
// // ============================================

// exports.patientLogout = catchAsync(async (req, res, next) => {
//   clearAuthCookies(res);

//   res.status(200).json({
//     success: true,
//     message: 'Logged out successfully'
//   });
// });

// // ============================================
// // PATIENT LOGOUT ALL DEVICES
// // ============================================

// exports.patientLogoutAll = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   // Validate input
//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   // Find patient
//   const patient = await Patient.findOne({ phone }).select('+tokenVersion');

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   // Increment tokenVersion to invalidate all tokens
//   patient.tokenVersion = (patient.tokenVersion || 0) + 1;
//   await patient.save({ validateBeforeSave: false });

//   // Clear cookies
//   clearAuthCookies(res);

//   res.status(200).json({
//     success: true,
//     message: 'Logged out from all devices successfully'
//   });
// });

// // ============================================
// // AUTHENTICATION STATUS
// // ============================================

// exports.checkAuthStatus = catchAsync(async (req, res, next) => {
//   console.log('=== DEBUG: Inside checkAuthStatus ===');
//   console.log('Cookies:', req.cookies);

//   const { accessToken, refreshToken } = req.cookies || {};
//   console.log('Refresh token present:', !!refreshToken);

//   if (!refreshToken || refreshToken === 'undefined') {
//     return res.status(200).json({
//       success: true,
//       isAuthenticated: false,
//       message: 'Refresh token expired',
//       shouldLogout: true
//     });
//   }

//   // Check access token first
//   if (accessToken && accessToken !== 'undefined') {
//     try {
//       const decoded = verifyToken(accessToken, 'access');
//       console.log('Access token valid:', decoded.id);

//       const patient = await Patient.findById(decoded.id);

//       if (patient) {
//         res.cookie('isAuthenticated', 'true', {
//           httpOnly: false,
//           secure: process.env.NODE_ENV === 'production',
//           sameSite: 'strict',
//           maxAge: 90 * 24 * 60 * 60 * 1000
//         });

//         return res.status(200).json({
//           success: true,
//           isAuthenticated: true,
//           data: {
//             id: patient._id,
//             firstName: patient.firstName,
//             phone: patient.phone,
//             email: patient.email
//           }
//         });
//       }
//     } catch (error) {
//       console.log('Access token verification failed:', error.message);
//     }
//   }

//   // Try to refresh using refresh token
//   if (refreshToken && refreshToken !== 'undefined') {
//     try {
//       const decoded = verifyToken(refreshToken, 'refresh');
//       console.log('Refresh token valid:', decoded.id);

//       const patient = await Patient.findById(decoded.id).select(
//         '+tokenVersion'
//       );

//       if (patient) {
//         console.log(
//           'Token versions - Patient:',
//           patient.tokenVersion,
//           'Decoded:',
//           decoded.tokenVersion
//         );
//       }

//       if (!patient || patient.tokenVersion !== decoded.tokenVersion) {
//         return next(
//           new AppError('Invalid refresh token - please login again', 401)
//         );
//       }

//       // Generate new access token
//       const newAccessToken = generateAccessToken(
//         patient._id,
//         'patient',
//         patient.tokenVersion
//       );

//       res.cookie('accessToken', newAccessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 5 * 60 * 1000
//       });

//       res.cookie('isAuthenticated', 'true', {
//         httpOnly: false,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 90 * 24 * 60 * 60 * 1000
//       });

//       res.setHeader('X-New-Token', newAccessToken);
//       res.setHeader('X-Token-Refreshed', 'true');

//       return res.status(200).json({
//         success: true,
//         isAuthenticated: true,
//         data: {
//           id: patient._id,
//           firstName: patient.firstName,
//           phone: patient.phone,
//           email: patient.email
//         }
//       });
//     } catch (error) {
//       console.log('Refresh token verification failed:', error.message);
//       return next(new AppError('Session expired - please login again', 401));
//     }
//   }

//   res.cookie('isAuthenticated', 'false', {
//     httpOnly: false,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//     maxAge: 90 * 24 * 60 * 60 * 1000
//   });

//   return res.status(200).json({
//     success: false,
//     isAuthenticated: false,
//     message: 'Authentication required - please login',
//     shouldLogout: true
//   });
// });

// // ============================================
// // PROFILE MANAGEMENT
// // ============================================

// exports.getMyProfile = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findById(req.user?._id || req.user?.id)
//     .select('-password -tokenVersion')
//     .populate('following', 'firstName specialization profilePhoto averageRating');

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       patient
//     }
//   });
// });

// exports.updatePatient = catchAsync(async (req, res, next) => {
//   // Don't allow password, role, tokenVersion updates here
//   const { password, role, tokenVersion, ...updateData } = req.body;

//   const updatedPatient = await Patient.findByIdAndUpdate(
//     req.user?._id || req.user?.id,
//     updateData,
//     {
//       new: true,
//       runValidators: true
//     }
//   ).select('-password -tokenVersion');

//   if (!updatedPatient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Profile updated successfully',
//     data: {
//       patient: updatedPatient
//     }
//   });
// });

// // ============================================
// // MEDICAL HISTORY MANAGEMENT
// // ============================================

// exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
//   const { condition, diagnosedDate, notes } = req.body;

//   if (!condition) {
//     return next(new AppError('Please provide condition details', 400));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

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

// exports.deleteMedicalHistory = catchAsync(async (req, res, next) => {
//   const { historyId } = req.params;

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   patient.medicalHistory.pull(historyId);
//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Medical history entry deleted successfully',
//     data: {
//       medicalHistory: patient.medicalHistory
//     }
//   });
// });

// // ============================================
// // ALLERGY MANAGEMENT
// // ============================================

// exports.addAllergy = catchAsync(async (req, res, next) => {
//   const { allergy } = req.body;

//   if (!allergy) {
//     return next(new AppError('Please provide allergy details', 400));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   if (patient.allergies.includes(allergy)) {
//     return next(new AppError('Allergy already exists', 400));
//   }

//   patient.allergies.push(allergy);
//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Allergy added successfully',
//     data: {
//       allergies: patient.allergies
//     }
//   });
// });

// exports.removeAllergy = catchAsync(async (req, res, next) => {
//   const { allergy } = req.body;

//   if (!allergy) {
//     return next(new AppError('Please provide allergy to remove', 400));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   patient.allergies = patient.allergies.filter(a => a !== allergy);
//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Allergy removed successfully',
//     data: {
//       allergies: patient.allergies
//     }
//   });
// });

// // ============================================
// // MEDICATION MANAGEMENT
// // ============================================

// exports.addMedication = catchAsync(async (req, res, next) => {
//   const { medication } = req.body;

//   if (!medication) {
//     return next(new AppError('Please provide medication details', 400));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

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
//     data: {
//       currentMedications: patient.currentMedications
//     }
//   });
// });

// exports.removeMedication = catchAsync(async (req, res, next) => {
//   const { medication } = req.body;

//   if (!medication) {
//     return next(new AppError('Please provide medication to remove', 400));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   patient.currentMedications = patient.currentMedications.filter(
//     m => m !== medication
//   );
//   await patient.save();

//   res.status(200).json({
//     success: true,
//     message: 'Medication removed successfully',
//     data: {
//       currentMedications: patient.currentMedications
//     }
//   });
// });

// // ============================================
// // DOCTOR FOLLOWING
// // ============================================

// exports.followDoctor = catchAsync(async (req, res, next) => {
//   const { doctorId } = req.params;

//   const doctor = await Doctor.findById(doctorId);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   // Check if already following
//   if (patient.following.includes(doctorId)) {
//     return next(new AppError('Already following this doctor', 400));
//   }

//   // Add to patient's following list
//   patient.following.push(doctorId);
//   patient.followingCount += 1;
//   await patient.save();

//   // Add to doctor's followers list
//   doctor.followers.push(req.user._id);
//   doctor.followersCount += 1;
//   await doctor.save();

//   res.status(200).json({
//     success: true,
//     message: 'Doctor followed successfully',
//     data: {
//       following: patient.following
//     }
//   });
// });

// exports.unfollowDoctor = catchAsync(async (req, res, next) => {
//   const { doctorId } = req.params;

//   const patient = await Patient.findById(req.user?._id || req.user?.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   // Check if following
//   if (!patient.following.includes(doctorId)) {
//     return next(new AppError('Not following this doctor', 400));
//   }

//   // Remove from patient's following list
//   patient.following.pull(doctorId);
//   patient.followingCount -= 1;
//   await patient.save();

//   // Remove from doctor's followers list
//   await Doctor.findByIdAndUpdate(doctorId, {
//     $pull: { followers: req.user._id },
//     $inc: { followersCount: -1 }
//   });

//   res.status(200).json({
//     success: true,
//     message: 'Doctor unfollowed successfully',
//     data: {
//       following: patient.following
//     }
//   });
// });


const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  setAuthCookies,
  clearAuthCookies,
  verifyToken
} = require('../utils/tokenUtils');
const otpUtils = require('../utils/otpUtils');

// ============================================
// PATIENT SIGNUP (OTP Request)
// ============================================

exports.patientSignup = catchAsync(async (req, res, next) => {
  const { firstName, email, phone, password } = req.body;

  console.log('');
  console.log('PATIENT SIGNUP - OTP Generation');
  console.log('='.repeat(60));

  // Validate required fields
  if (!firstName || !email || !phone || !password) {
    return next(
      new AppError(
        'Please provide all required fields: firstName, email, phone, password',
        400
      )
    );
  }

  console.log(`firstName: ${firstName}`);
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone}`);

  // Validate phone number format
  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  // Check if patient already exists
  const existingPatient = await Patient.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingPatient) {
    if (existingPatient.email === email) {
      return next(
        new AppError('Patient with this email already exists', 400)
      );
    }
    if (existingPatient.phone === phone) {
      return next(
        new AppError('Patient with this phone number already exists', 400)
      );
    }
  }

  // Generate OTP (6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  console.log(`Generated OTP: ${otp}`);

  // SEND OTP VIA TEXTLOCAL SMS GATEWAY
  console.log('');
  console.log('Attempting to send OTP via SMS gateway...');
  const smsSent = await otpUtils.sendOtp(phone);

  if (!smsSent) {
    console.error('ERROR: Failed to send OTP via SMS');
    return next(
      new AppError(
        'Failed to send OTP. Please check your phone number and try again.',
        500
      )
    );
  }

  console.log('SUCCESS: OTP sent via SMS');

  // Create unverified patient record
  const newPatient = await Patient.create({
    firstName,
    email,
    phone,
    password,
    signupOtp: otp,
    signupOtpExpiry: otpExpiry,
    isVerified: false,
    isActive: false,
    tokenVersion: 0
  });

  console.log('SUCCESS: Patient created in database with OTP');

  // Generate OTP token for verification
  const otpToken = generateOtpToken(phone, 'patient');

  console.log('SUCCESS: OTP sent to phone');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'OTP sent to your phone number',
    data: {
      otpToken,
      expiresIn: 600, // 10 minutes in seconds
      phone: phone.slice(-4) // Return last 4 digits for UI
    }
  });
});

// ============================================
// VERIFY SIGNUP OTP
// ============================================

exports.verifySignupOtp = catchAsync(async (req, res, next) => {
  const { phone, otp, dateOfBirth, gender, address, bloodGroup, emergencyContact } = req.body;

  console.log('');
  console.log('PATIENT SIGNUP VERIFICATION - OTP Verification');
  console.log('='.repeat(60));

  // Validate required fields
  if (!phone || !otp) {
    return next(new AppError('Please provide phone and OTP', 400));
  }

  console.log(`Phone: ${phone}`);
  console.log(`OTP: ${otp}`);

  // Verify OTP using your OTP utility
  const isOtpValid = await otpUtils.verifyOtp(phone, otp);

  if (!isOtpValid) {
    return next(new AppError('Invalid OTP. Please try again.', 400));
  }

  console.log('SUCCESS: OTP verified');

  // Find unverified patient
  const patient = await Patient.findOne({ phone, isVerified: false });

  if (!patient) {
    return next(
      new AppError('Invalid phone number or patient already verified', 400)
    );
  }

  // Update patient with verification
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

  await patient.save({ validateBeforeSave: false });

  console.log('SUCCESS: Patient verified and activated');

  // Generate tokens
  const accessToken = generateAccessToken(
    patient._id,
    'patient',
    patient.tokenVersion
  );
  const refreshToken = generateRefreshToken(
    patient._id,
    'patient',
    patient.tokenVersion
  );

  // Save refresh token to database
  patient.refreshToken = refreshToken;
  await patient.save({ validateBeforeSave: false });

  // Set cookies
  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('SUCCESS: Tokens generated and cookies set');
  console.log('='.repeat(60));
  console.log('');

  // Remove sensitive fields from output
  patient.password = undefined;
  patient.tokenVersion = undefined;

  res.status(201).json({
    success: true,
    message: 'Patient registration completed successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: patient,
      role: 'patient'
    }
  });
});

// ============================================
// RESEND SIGNUP OTP
// ============================================

exports.resendSignupOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  console.log('');
  console.log('PATIENT RESEND OTP');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  console.log(`Phone: ${phone}`);

  // Validate phone number format
  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  // Find unverified patient
  const patient = await Patient.findOne({ phone, isVerified: false });

  if (!patient) {
    return next(
      new AppError('Invalid phone number or patient already verified', 400)
    );
  }

  // SEND OTP VIA SMS GATEWAY (resend)
  console.log('');
  console.log('Attempting to resend OTP via SMS gateway...');
  const smsSent = await otpUtils.resendOtp(phone);

  if (!smsSent) {
    console.error('ERROR: Failed to resend OTP via SMS');
    return next(
      new AppError(
        'Failed to resend OTP. Please try again.',
        500
      )
    );
  }

  console.log('SUCCESS: OTP resent via SMS');

  console.log('SUCCESS: OTP resent');
  console.log('='.repeat(60));
  console.log('');

  // Generate OTP token
  const otpToken = generateOtpToken(phone, 'patient');

  res.status(200).json({
    success: true,
    message: 'OTP resent to your phone number',
    data: {
      otpToken,
      expiresIn: 600, // 10 minutes in seconds
      phone: phone.slice(-4)
    }
  });
});

// ============================================
// PATIENT LOGIN - REQUEST LOGIN OTP
// ============================================

exports.patientLogin = catchAsync(async (req, res, next) => {
  const { email, phone } = req.body;

  console.log('');
  console.log('PATIENT LOGIN - OTP Request');
  console.log('='.repeat(60));

  // Validate required fields - either email or phone
  if (!email && !phone) {
    return next(new AppError('Please provide email or phone number', 400));
  }

  console.log(`Email: ${email || 'N/A'}`);
  console.log(`Phone: ${phone || 'N/A'}`);

  // Find patient by email or phone
  const patient = await Patient.findOne({
    $or: [{ email }, { phone }]
  });

  if (!patient) {
    return next(new AppError('Patient not found with provided credentials', 404));
  }

  // Check if patient is verified
  if (!patient.isVerified) {
    return next(
      new AppError('Please complete signup verification first', 403)
    );
  }

  // Check if patient is active
  if (!patient.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 403)
    );
  }

  console.log('SUCCESS: Patient found and verified');

  // Validate phone number format
  if (!otpUtils.validatePhoneNumber(patient.phone)) {
    return next(new AppError('Invalid phone number format on file', 400));
  }

  // SEND LOGIN OTP VIA SMS
  console.log('');
  console.log('Attempting to send login OTP via SMS gateway...');
  const smsSent = await otpUtils.sendOtp(patient.phone);

  if (!smsSent) {
    console.error('ERROR: Failed to send login OTP via SMS');
    return next(
      new AppError(
        'Failed to send OTP. Please try again.',
        500
      )
    );
  }

  console.log('SUCCESS: Login OTP sent via SMS');

  // Generate OTP token for verification
  const otpToken = generateOtpToken(patient.phone, 'patient');

  console.log('SUCCESS: OTP sent to phone');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'OTP sent to your phone number',
    data: {
      otpToken,
      expiresIn: 600, // 10 minutes in seconds
      phone: patient.phone.slice(-4), // Return last 4 digits for UI
      userId: patient._id
    }
  });
});

// ============================================
// VERIFY LOGIN OTP
// ============================================

exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  console.log('');
  console.log('PATIENT LOGIN VERIFICATION - OTP Verification');
  console.log('='.repeat(60));

  // Validate required fields
  if (!phone || !otp) {
    return next(new AppError('Please provide phone and OTP', 400));
  }

  console.log(`Phone: ${phone}`);
  console.log(`OTP: ${otp}`);

  // Verify OTP using your OTP utility
  const isOtpValid = await otpUtils.verifyOtp(phone, otp);

  if (!isOtpValid) {
    return next(new AppError('Invalid OTP. Please try again.', 400));
  }

  console.log('SUCCESS: OTP verified');

  // Find patient
  const patient = await Patient.findOne({ phone }).select('+tokenVersion');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  // Check if patient is verified and active
  if (!patient.isVerified) {
    return next(new AppError('Please complete signup verification first', 403));
  }

  if (!patient.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 403)
    );
  }

  console.log('SUCCESS: Patient verified for login');

  // Generate tokens
  const accessToken = generateAccessToken(
    patient._id,
    'patient',
    patient.tokenVersion
  );
  const refreshToken = generateRefreshToken(
    patient._id,
    'patient',
    patient.tokenVersion
  );

  // Save refresh token to database
  patient.refreshToken = refreshToken;
  await patient.save({ validateBeforeSave: false });

  // Set cookies
  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log('SUCCESS: Tokens generated and cookies set');
  console.log('='.repeat(60));
  console.log('');

  // Remove sensitive fields from output
  patient.password = undefined;
  patient.tokenVersion = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: patient,
      role: 'patient'
    }
  });
});

// ============================================
// RESEND LOGIN OTP
// ============================================

exports.resendLoginOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  console.log('');
  console.log('PATIENT RESEND LOGIN OTP');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  console.log(`Phone: ${phone}`);

  // Validate phone number format
  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  // Find patient
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return next(new AppError('Patient not found with provided phone number', 404));
  }

  // Check if patient is verified and active
  if (!patient.isVerified) {
    return next(new AppError('Please complete signup verification first', 403));
  }

  if (!patient.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 403)
    );
  }

  // SEND LOGIN OTP VIA SMS GATEWAY (resend)
  console.log('');
  console.log('Attempting to resend login OTP via SMS gateway...');
  const smsSent = await otpUtils.resendOtp(phone);

  if (!smsSent) {
    console.error('ERROR: Failed to resend login OTP via SMS');
    return next(
      new AppError(
        'Failed to resend OTP. Please try again.',
        500
      )
    );
  }

  console.log('SUCCESS: Login OTP resent via SMS');
  console.log('='.repeat(60));
  console.log('');

  // Generate OTP token
  const otpToken = generateOtpToken(phone, 'patient');

  res.status(200).json({
    success: true,
    message: 'OTP resent to your phone number',
    data: {
      otpToken,
      expiresIn: 600, // 10 minutes in seconds
      phone: phone.slice(-4)
    }
  });
});

// ============================================
// LOGOUT
// ============================================

exports.logout = catchAsync(async (req, res, next) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================
// PATIENT LOGOUT ALL DEVICES
// ============================================

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

// ============================================
// AUTHENTICATION STATUS
// ============================================

exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  console.log('=== DEBUG: Inside checkAuthStatus ===');
  console.log('Cookies:', req.cookies);

  const { accessToken, refreshToken } = req.cookies || {};
  console.log('Refresh token present:', !!refreshToken);

  if (!refreshToken || refreshToken === 'undefined') {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      message: 'Refresh token expired',
      shouldLogout: true
    });
  }

  // Check access token first
  if (accessToken && accessToken !== 'undefined') {
    try {
      const decoded = verifyToken(accessToken, 'access');
      console.log('Access token valid:', decoded.id);

      const patient = await Patient.findById(decoded.id);

      if (patient) {
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
            id: patient._id,
            firstName: patient.firstName,
            phone: patient.phone,
            email: patient.email
          }
        });
      }
    } catch (error) {
      console.log('Access token verification failed:', error.message);
    }
  }

  // Try to refresh using refresh token
  if (refreshToken && refreshToken !== 'undefined') {
    try {
      const decoded = verifyToken(refreshToken, 'refresh');
      console.log('Refresh token valid:', decoded.id);

      const patient = await Patient.findById(decoded.id).select(
        '+tokenVersion'
      );

      if (patient) {
        console.log(
          'Token versions - Patient:',
          patient.tokenVersion,
          'Decoded:',
          decoded.tokenVersion
        );
      }

      if (!patient || patient.tokenVersion !== decoded.tokenVersion) {
        return next(
          new AppError('Invalid refresh token - please login again', 401)
        );
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(
        patient._id,
        'patient',
        patient.tokenVersion
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
          id: patient._id,
          firstName: patient.firstName,
          phone: patient.phone,
          email: patient.email
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
// PROFILE MANAGEMENT
// ============================================

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.user?._id || req.user?.id)
    .select('-password -tokenVersion')
    .populate('following', 'firstName specialization profilePhoto averageRating');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      patient
    }
  });
});

exports.updatePatient = catchAsync(async (req, res, next) => {
  const { password, role, tokenVersion, ...updateData } = req.body;

  const updatedPatient = await Patient.findByIdAndUpdate(
    req.user?._id || req.user?.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -tokenVersion');

  if (!updatedPatient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      patient: updatedPatient
    }
  });
});

// ============================================
// MEDICAL HISTORY MANAGEMENT
// ============================================

exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
  const { condition, diagnosedDate, notes } = req.body;

  if (!condition) {
    return next(new AppError('Please provide condition details', 400));
  }

  const patient = await Patient.findById(req.user?._id || req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.medicalHistory.push({
    condition,
    diagnosedDate: diagnosedDate || new Date(),
    notes
  });

  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medical history updated successfully',
    data: {
      medicalHistory: patient.medicalHistory
    }
  });
});

exports.deleteMedicalHistory = catchAsync(async (req, res, next) => {
  const { historyId } = req.params;

  const patient = await Patient.findById(req.user?._id || req.user?.id);

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

// ============================================
// ALLERGY MANAGEMENT
// ============================================

exports.addAllergy = catchAsync(async (req, res, next) => {
  const { allergy } = req.body;

  if (!allergy) {
    return next(new AppError('Please provide allergy details', 400));
  }

  const patient = await Patient.findById(req.user?._id || req.user?.id);

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

  const patient = await Patient.findById(req.user?._id || req.user?.id);

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

// ============================================
// MEDICATION MANAGEMENT
// ============================================

exports.addMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;

  if (!medication) {
    return next(new AppError('Please provide medication details', 400));
  }

  const patient = await Patient.findById(req.user?._id || req.user?.id);

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

  const patient = await Patient.findById(req.user?._id || req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.currentMedications = patient.currentMedications.filter(
    m => m !== medication
  );
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medication removed successfully',
    data: {
      currentMedications: patient.currentMedications
    }
  });
});

// ============================================
// DOCTOR FOLLOWING
// ============================================

exports.followDoctor = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const patient = await Patient.findById(req.user?._id || req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.following.includes(doctorId)) {
    return next(new AppError('Already following this doctor', 400));
  }

  patient.following.push(doctorId);
  patient.followingCount += 1;
  await patient.save();

  doctor.followers.push(req.user._id);
  doctor.followersCount += 1;
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

  const patient = await Patient.findById(req.user?._id || req.user?.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (!patient.following.includes(doctorId)) {
    return next(new AppError('Not following this doctor', 400));
  }

  patient.following.pull(doctorId);
  patient.followingCount -= 1;
  await patient.save();

  await Doctor.findByIdAndUpdate(doctorId, {
    $pull: { followers: req.user._id },
    $inc: { followersCount: -1 }
  });

  res.status(200).json({
    success: true,
    message: 'Doctor unfollowed successfully',
    data: {
      following: patient.following
    }
  });
});
