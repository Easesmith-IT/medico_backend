

// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Patient = require('../models/patientModel');
// const Doctor = require('../models/doctorModel');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   generateOtpToken,
//   setAuthCookies,
//   clearAuthCookies,
//   verifyToken
// } = require('../utils/tokenUtils');
// const otpUtils = require('../utils/otpUtils');

// // ============================================
// // PATIENT SIGNUP (OTP Request)
// // ============================================

// // controllers/patientController.js

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
//   console.log('PATIENT SIGNUP - OTP Generation');
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
//   console.log(`Gender: ${gender || 'Not provided'}`);
//   console.log(`Blood Group: ${bloodGroup || 'Not provided'}`);

//   // Validate phone number format
//   if (!otpUtils.validatePhoneNumber(phone)) {
//     return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
//   }

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

//   // Generate OTP (6 digits)
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//   console.log(`Generated OTP: ${otp}`);

//   // SEND OTP VIA TEXTLOCAL SMS GATEWAY
//   console.log('');
//   console.log('Attempting to send OTP via SMS gateway...');
//   const smsSent = await otpUtils.sendOtp(phone);

//   if (!smsSent) {
//     console.error('ERROR: Failed to send OTP via SMS');
//     return next(
//       new AppError(
//         'Failed to send OTP. Please check your phone number and try again.',
//         500
//       )
//     );
//   }

//   console.log('SUCCESS: OTP sent via SMS');

//   // Create unverified patient record with all fields
//   const newPatient = await Patient.create({
//     firstName,
//     email,
//     phone,
//     password,
//     dateOfBirth: dateOfBirth || null,
//     gender: gender || null,
//     address: address || null,
//     bloodGroup: bloodGroup || null,
//     emergencyContact: emergencyContact || {
//       name: null,
//       phone: null,
//       relationship: null
//     },
//     signupOtp: otp,
//     signupOtpExpiry: otpExpiry,
//     isVerified: false,
//     isActive: false,
//     tokenVersion: 0
//   });

//   console.log('SUCCESS: Patient created in database with OTP');

//   // Generate OTP token for verification
//   const otpToken = generateOtpToken(phone, 'patient');

//   console.log('SUCCESS: OTP sent to phone');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'OTP sent to your phone number',
//     data: {
//       patient: {
//         id: newPatient._id,
//         firstName: newPatient.firstName,
//         email: newPatient.email,
//         phone: newPatient.phone
//       },
//       otpToken,
//       expiresIn: 600, // 10 minutes in seconds
//       phone: phone.slice(-4) // Return last 4 digits for UI
//     }
//   });
// });


// // ============================================
// // VERIFY SIGNUP OTP
// // ============================================

// exports.verifySignupOtp = catchAsync(async (req, res, next) => {
//   const { phone, otp, dateOfBirth, gender, address, bloodGroup, emergencyContact } = req.body;

//   console.log('');
//   console.log('PATIENT SIGNUP VERIFICATION - OTP Verification');
//   console.log('='.repeat(60));

//   // Validate required fields
//   if (!phone || !otp) {
//     return next(new AppError('Please provide phone and OTP', 400));
//   }

//   console.log(`Phone: ${phone}`);
//   console.log(`OTP: ${otp}`);

//   // Verify OTP using your OTP utility
//   const isOtpValid = await otpUtils.verifyOtp(phone, otp);

//   if (!isOtpValid) {
//     return next(new AppError('Invalid OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP verified');

//   // Find patient by phone (whether verified or not)
//   const patient = await Patient.findOne({ phone });

//   if (!patient) {
//     return next(
//       new AppError('Phone number not found. Please sign up first.', 404)
//     );
//   }

//   // Check if already verified
//   if (patient.isVerified) {
//     return next(
//       new AppError('Phone number already verified. Please login instead.', 400)
//     );
//   }

//   // Update patient with verification
//   patient.isVerified = true;
//   patient.isActive = true;
//   patient.signupOtp = undefined;
//   patient.signupOtpExpiry = undefined;

//   // Update optional fields if provided
//   if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
//   if (gender) patient.gender = gender;
//   if (address) patient.address = address;
//   if (bloodGroup) patient.bloodGroup = bloodGroup;
//   if (emergencyContact) patient.emergencyContact = emergencyContact;

//   await patient.save({ validateBeforeSave: false });

//   console.log('SUCCESS: Patient verified and activated');

//   // Generate tokens
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

//   // Set cookies
//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   // Remove sensitive fields from output
//   patient.password = undefined;
//   patient.tokenVersion = undefined;

//   res.status(201).json({
//     success: true,
//     message: 'Patient registration completed successfully',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       user: patient,
//       role: 'patient'
//     }
//   });
// });


// // RESEND SIGNUP OTP


// exports.resendSignupOtp = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   console.log('');
//   console.log('PATIENT RESEND OTP');
//   console.log('='.repeat(60));

//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   console.log(`Phone: ${phone}`);

//   // Validate phone number format
//   if (!otpUtils.validatePhoneNumber(phone)) {
//     return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
//   }

//   // Find unverified patient
//   const patient = await Patient.findOne({ phone, isVerified: false });

//   if (!patient) {
//     return next(
//       new AppError('Invalid phone number or patient already verified', 400)
//     );
//   }

//   // SEND OTP VIA SMS GATEWAY (resend)
//   console.log('');
//   console.log('Attempting to resend OTP via SMS gateway...');
//   const smsSent = await otpUtils.resendOtp(phone);

//   if (!smsSent) {
//     console.error('ERROR: Failed to resend OTP via SMS');
//     return next(
//       new AppError(
//         'Failed to resend OTP. Please try again.',
//         500
//       )
//     );
//   }

//   console.log('SUCCESS: OTP resent via SMS');

//   console.log('SUCCESS: OTP resent');
//   console.log('='.repeat(60));
//   console.log('');

//   // Generate OTP token
//   const otpToken = generateOtpToken(phone, 'patient');

//   res.status(200).json({
//     success: true,
//     message: 'OTP resent to your phone number',
//     data: {
//       otpToken,
//       expiresIn: 600, // 10 minutes in seconds
//       phone: phone.slice(-4)
//     }
//   });
// });

// // ============================================
// // PATIENT LOGIN - REQUEST LOGIN OTP
// // ============================================

// exports.patientLogin = catchAsync(async (req, res, next) => {
//   const { email, phone } = req.body;

//   console.log('');
//   console.log('PATIENT LOGIN - OTP Request');
//   console.log('='.repeat(60));

//   // Validate required fields - either email or phone
//   if (!email && !phone) {
//     return next(new AppError('Please provide email or phone number', 400));
//   }

//   console.log(`Email: ${email || 'N/A'}`);
//   console.log(`Phone: ${phone || 'N/A'}`);

//   // Find patient by email or phone
//   const patient = await Patient.findOne({
//     $or: [{ email }, { phone }]
//   });

//   if (!patient) {
//     return next(new AppError('Patient not found with provided credentials', 404));
//   }

//   // Check if patient is verified
//   if (!patient.isVerified) {
//     return next(
//       new AppError('Please complete signup verification first', 403)
//     );
//   }

//   // Check if patient is active
//   if (!patient.isActive) {
//     return next(
//       new AppError('Your account has been deactivated. Please contact support.', 403)
//     );
//   }

//   console.log('SUCCESS: Patient found and verified');

//   // Validate phone number format
//   if (!otpUtils.validatePhoneNumber(patient.phone)) {
//     return next(new AppError('Invalid phone number format on file', 400));
//   }

//   // SEND LOGIN OTP VIA SMS
//   console.log('');
//   console.log('Attempting to send login OTP via SMS gateway...');
//   const smsSent = await otpUtils.sendOtp(patient.phone);

//   if (!smsSent) {
//     console.error('ERROR: Failed to send login OTP via SMS');
//     return next(
//       new AppError(
//         'Failed to send OTP. Please try again.',
//         500
//       )
//     );
//   }

//   console.log('SUCCESS: Login OTP sent via SMS');

//   // Generate OTP token for verification
//   const otpToken = generateOtpToken(patient.phone, 'patient');

//   console.log('SUCCESS: OTP sent to phone');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'OTP sent to your phone number',
//     data: {
//       otpToken,
//       expiresIn: 600, // 10 minutes in seconds
//       phone: patient.phone.slice(-4), // Return last 4 digits for UI
//       userId: patient._id
//     }
//   });
// });

// // ============================================
// // VERIFY LOGIN OTP
// // ============================================

// exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
//   const { phone, otp } = req.body;

//   console.log('');
//   console.log('PATIENT LOGIN VERIFICATION - OTP Verification');
//   console.log('='.repeat(60));

//   // Validate required fields
//   if (!phone || !otp) {
//     return next(new AppError('Please provide phone and OTP', 400));
//   }

//   console.log(`Phone: ${phone}`);
//   console.log(`OTP: ${otp}`);

//   // Verify OTP using your OTP utility
//   const isOtpValid = await otpUtils.verifyOtp(phone, otp);

//   if (!isOtpValid) {
//     return next(new AppError('Invalid OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP verified');

//   // Find patient
//   const patient = await Patient.findOne({ phone }).select('+tokenVersion');

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   // Check if patient is verified and active
//   if (!patient.isVerified) {
//     return next(new AppError('Please complete signup verification first', 403));
//   }

//   if (!patient.isActive) {
//     return next(
//       new AppError('Your account has been deactivated. Please contact support.', 403)
//     );
//   }

//   console.log('SUCCESS: Patient verified for login');

//   // Generate tokens
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

//   // Set cookies
//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   // Remove sensitive fields from output
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
// // RESEND LOGIN OTP
// // ============================================

// exports.resendLoginOtp = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   console.log('');
//   console.log('PATIENT RESEND LOGIN OTP');
//   console.log('='.repeat(60));

//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   console.log(`Phone: ${phone}`);

//   // Validate phone number format
//   if (!otpUtils.validatePhoneNumber(phone)) {
//     return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
//   }

//   // Find patient
//   const patient = await Patient.findOne({ phone });

//   if (!patient) {
//     return next(new AppError('Patient not found with provided phone number', 404));
//   }

//   // Check if patient is verified and active
//   if (!patient.isVerified) {
//     return next(new AppError('Please complete signup verification first', 403));
//   }

//   if (!patient.isActive) {
//     return next(
//       new AppError('Your account has been deactivated. Please contact support.', 403)
//     );
//   }

//   // SEND LOGIN OTP VIA SMS GATEWAY (resend)
//   console.log('');
//   console.log('Attempting to resend login OTP via SMS gateway...');
//   const smsSent = await otpUtils.resendOtp(phone);

//   if (!smsSent) {
//     console.error('ERROR: Failed to resend login OTP via SMS');
//     return next(
//       new AppError(
//         'Failed to resend OTP. Please try again.',
//         500
//       )
//     );
//   }

//   console.log('SUCCESS: Login OTP resent via SMS');
//   console.log('='.repeat(60));
//   console.log('');

//   // Generate OTP token
//   const otpToken = generateOtpToken(phone, 'patient');

//   res.status(200).json({
//     success: true,
//     message: 'OTP resent to your phone number',
//     data: {
//       otpToken,
//       expiresIn: 600, // 10 minutes in seconds
//       phone: phone.slice(-4)
//     }
//   });
// });

// // ============================================
// // LOGOUT
// // ============================================

// exports.logout = catchAsync(async (req, res, next) => {
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

//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   const patient = await Patient.findOne({ phone }).select('+tokenVersion');

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   patient.tokenVersion = (patient.tokenVersion || 0) + 1;
//   await patient.save({ validateBeforeSave: false });

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

//   if (patient.following.includes(doctorId)) {
//     return next(new AppError('Already following this doctor', 400));
//   }

//   patient.following.push(doctorId);
//   patient.followingCount += 1;
//   await patient.save();

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

//   if (!patient.following.includes(doctorId)) {
//     return next(new AppError('Not following this doctor', 400));
//   }

//   patient.following.pull(doctorId);
//   patient.followingCount -= 1;
//   await patient.save();

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


// //getbyid 
// // ============================================
// // GET PATIENT BY ID
// // ============================================

// exports.getPatientById = catchAsync(async (req, res, next) => {
//   const { patientId } = req.params;

//   // Validate if patientId is provided
//   if (!patientId) {
//     return next(new AppError('Please provide patient ID', 400));
//   }

//   // Find patient by ID
//   const patient = await Patient.findById(patientId);

//   // Check if patient exists
//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   // Remove sensitive data
//   patient.password = undefined;
//   patient.tokenVersion = undefined;
//   patient.refreshToken = undefined;

//   res.status(200).json({
//     success: true,
//     message: 'Patient retrieved successfully',
//     data: {
//       patient
//     }
//   });
// });



// controller/patientController.js

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

/**
 * ====================================================================
 * UNIFIED SIGNUP (Auto-detect existing phone)
 * ====================================================================
 */
exports.patientSignup = catchAsync(async (req, res, next) => {
  const { firstName, email, phone, password, dateOfBirth, gender, address, bloodGroup, emergencyContact } = req.body;

  console.log('\n');
  console.log('PATIENT SIGNUP - OTP Generation');
  console.log('='.repeat(60));

  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  console.log('Phone:', phone);

  if (!otpUtils.validatePhoneNumber(phone)) {
    return next(new AppError('Phone number must be a valid 10-digit Indian number', 400));
  }

  // Check if patient already exists with this phone
  const existingPatient = await Patient.findOne({ phone });

  // CASE 1: PHONE EXISTS → LOGIN FLOW
  if (existingPatient) {
    console.log('✅ Phone found in database → LOGIN FLOW');

    if (!existingPatient.isVerified) {
      console.log('⚠️ Patient not verified yet → Complete signup verification');

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

    // Patient verified → LOGIN
    console.log('✅ Patient verified → SEND LOGIN OTP');

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

  // CASE 2: NEW SIGNUP
  console.log('🆕 Phone NOT found → NEW SIGNUP FLOW');

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
    address: address || null,
    bloodGroup: bloodGroup || null,
    emergencyContact: emergencyContact || { name: null, phone: null, relation: null },
    signupOtp: otp,
    signupOtpExpiry: otpExpiry,
    isVerified: false,      // ✅ Explicitly set to false
    isActive: false,        // ✅ Explicitly set to false
    tokenVersion: 0
  });

  const otpToken = generateOtpToken(phone, 'patient');

  console.log('✅ New patient created - Awaiting OTP verification');
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

/**
 * ====================================================================
 * VERIFY SIGNUP OTP - ✅ FIXED VERSION
 * ====================================================================
 */
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

  console.log('✅ OTP verified successfully');

  // Find patient
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return next(new AppError('Phone number not found. Please sign up first.', 404));
  }

  console.log('Patient found:', patient.firstName);
  console.log('Current isVerified BEFORE:', patient.isVerified);
  console.log('Current isActive BEFORE:', patient.isActive);

  if (patient.isVerified) {
    console.log('⚠️ Patient already verified');
    return next(new AppError('Phone number already verified. Please login instead.', 400));
  }

  // ✅ SET VERIFICATION FLAGS EXPLICITLY
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

  console.log('✅ Patient saved - isVerified AFTER:', patient.isVerified);
  console.log('✅ Patient saved - isActive AFTER:', patient.isActive);

  // ✅ VERIFY FROM DB
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

  console.log('✅ Tokens generated and cookies set (365 days)');
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
        isVerified: true,    // ✅ Explicitly include in response
        isActive: true       // ✅ Explicitly include in response
      }
    }
  });
});

/**
 * ====================================================================
 * RESEND SIGNUP OTP
 * ====================================================================
 */
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

/**
 * ====================================================================
 * PATIENT LOGIN - REQUEST LOGIN OTP
 * ====================================================================
 */
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

/**
 * ====================================================================
 * VERIFY LOGIN OTP
 * ====================================================================
 */
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

/**
 * ====================================================================
 * RESEND LOGIN OTP
 * ====================================================================
 */
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

/**
 * ====================================================================
 * CHECK AUTH STATUS (Auto-refresh tokens)
 * ====================================================================
 */
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

/**
 * ====================================================================
 * LOGOUT
 * ====================================================================
 */
exports.logout = catchAsync(async (req, res, next) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * ====================================================================
 * LOGOUT ALL DEVICES
 * ====================================================================
 */
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

/**
 * ====================================================================
 * PROFILE MANAGEMENT
 * ====================================================================
 */
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
//   const { password, role, tokenVersion, isVerified, isActive, ...updateData } = req.body;

//   const updatedPatient = await Patient.findByIdAndUpdate(
//     req.user?.id,
//     updateData,
//     { new: true, runValidators: true }
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
exports.updatePatient = catchAsync(async (req, res, next) => {
  console.log('\n');
  console.log('UPDATE PATIENT PROFILE - COMPREHENSIVE');
  console.log('='.repeat(60));
  console.log('Patient ID:', req.user?.id);

  // ✅ Check if user exists in database
  const userExists = await Patient.findById(req.user?.id);
  if (!userExists) {
    return next(new AppError('The user belonging to this token no longer exists', 401));
  }

  console.log('Update fields:', Object.keys(req.body));

  // ✅ SECURITY: Remove sensitive fields
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

  console.log('Safe update data:', updateData);

  // ✅ WHITELIST: Only these fields can be updated
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
  console.log('Fields to update:', fieldsToUpdate);

  // ✅ Email uniqueness
  if (updateData.email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(updateData.email)) {
      return next(new AppError('Please provide a valid email', 400));
    }

    const existingEmail = await Patient.findOne({ 
      email: updateData.email,
      _id: { $ne: req.user?.id }
    });

    if (existingEmail) {
      return next(new AppError('Email already in use', 400));
    }
  }

  // ✅ Phone uniqueness
  if (updateData.phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(updateData.phone)) {
      return next(new AppError('Phone number must be a valid 10-digit number', 400));
    }

    const existingPhone = await Patient.findOne({ 
      phone: updateData.phone,
      _id: { $ne: req.user?.id }
    });

    if (existingPhone) {
      return next(new AppError('Phone number already in use', 400));
    }
  }

  // ✅ firstName validation
  if (updateData.firstName && updateData.firstName.trim().length === 0) {
    return next(new AppError('First name cannot be empty', 400));
  }

  // ✅ dateOfBirth validation
  if (updateData.dateOfBirth) {
    const dob = new Date(updateData.dateOfBirth);
    if (isNaN(dob.getTime())) {
      return next(new AppError('Please provide a valid date of birth', 400));
    }

    if (dob > new Date()) {
      return next(new AppError('Date of birth cannot be in the future', 400));
    }
  }

  // ✅ gender validation
  if (updateData.gender && !['male', 'female', 'other'].includes(updateData.gender)) {
    return next(new AppError('Invalid gender. Must be male, female, or other', 400));
  }

  // ✅ bloodGroup validation
  if (updateData.bloodGroup) {
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(updateData.bloodGroup)) {
      return next(new AppError('Invalid blood group', 400));
    }
  }

  // ✅ address validation
  if (updateData.address && typeof updateData.address === 'object') {
    const { city, state, country } = updateData.address;
    if (city && city.trim().length === 0) {
      return next(new AppError('City cannot be empty', 400));
    }
    if (state && state.trim().length === 0) {
      return next(new AppError('State cannot be empty', 400));
    }
    if (country && country.trim().length === 0) {
      return next(new AppError('Country cannot be empty', 400));
    }
  }

  // ✅ emergencyContact validation
  if (updateData.emergencyContact && typeof updateData.emergencyContact === 'object') {
    const { name, phone: emergencyPhone, relation } = updateData.emergencyContact;
    
    if (name && name.trim().length === 0) {
      return next(new AppError('Emergency contact name cannot be empty', 400));
    }

    if (emergencyPhone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(emergencyPhone)) {
        return next(new AppError('Emergency contact phone must be a valid 10-digit number', 400));
      }
    }

    if (relation && relation.trim().length === 0) {
      return next(new AppError('Emergency contact relation cannot be empty', 400));
    }
  }

  // ✅ Build filtered update data
  const filteredUpdateData = {};
  for (const field of allowedFields) {
    if (field in updateData) {
      filteredUpdateData[field] = updateData[field];
    }
  }

  console.log('Final update data:', filteredUpdateData);

  // ✅ Update patient
  const updatedPatient = await Patient.findByIdAndUpdate(
    req.user?.id,
    filteredUpdateData,
    { 
      new: true,
      runValidators: true
    }
  ).select('-password -tokenVersion -refreshToken -signupOtp -loginOtp -signupOtpExpiry -loginOtpExpiry');

  console.log('✅ Patient profile updated successfully');
  console.log('='.repeat(60));
  console.log('\n');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      patient: updatedPatient,
      updatedFields: fieldsToUpdate
    }
  });
});

/**
 * ====================================================================
 * MEDICAL HISTORY
 * ====================================================================
 */
exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
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
