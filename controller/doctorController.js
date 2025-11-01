// // // controllers/doctorController.js

// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Doctor = require('../models/doctorModel');
// const Otp = require('../models/otpModel');
// const { sendOtp, verifyOtp, resendOtp, clearOtp, formatPhoneNumber, validatePhoneNumber } = require('../utils/otpUtils');

// const {
//   generateAccessToken,
//   generateRefreshToken,
//   setTokenCookies
// } = require('../middleware/auth');
// const jwt = require('jsonwebtoken');




// exports.doctorSignup = catchAsync(async (req, res, next) => {
//   const {
//     name,
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

//   if (!name || !email || !phone || !medicalRegistrationNumber || !issuingMedicalCouncil || !specialization) {
//     return next(new AppError(
//       'Required fields: name, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization',
//       400
//     ));
//   }

//   console.log(`Phone: ${phone}`);
//   console.log(`Email: ${email}`);
//   console.log(`Name: ${name}`);

//   const existingDoctor = await Doctor.findOne({
//     $or: [
//       { email },
//       { phone },
//       { medicalRegistrationNumber }
//     ]
//   });

//   if (existingDoctor) {
//     if (existingDoctor.email === email) {
//       return next(new AppError('Doctor with this email already exists', 400));
//     }
//     if (existingDoctor.phone === phone) {
//       return next(new AppError('Doctor with this phone number already exists', 400));
//     }
//     if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
//       return next(new AppError('Doctor with this registration number already exists', 400));
//     }
//   }

//   const newDoctor = new Doctor({
//     name,
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
//         name: newDoctor.name,
//         email: newDoctor.email,
//         phone: newDoctor.phone,
//         medicalRegistrationNumber: newDoctor.medicalRegistrationNumber
//       },
//       nextStep: 'Verify OTP sent to your phone'
//     }
//   });
// });

// // ============================================
// // SIGNUP OTP VERIFICATION
// // ============================================
// exports.verifySignupOtp = catchAsync(async (req, res, next) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return next(new AppError('Phone number and OTP are required', 400));
//   }

//   console.log('');
//   console.log('DOCTOR SIGNUP - STEP 2: OTP Verification');
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
//     return next(new AppError('Doctor not found. Please register first.', 404));
//   }

//   if (doctor.isPhoneVerified) {
//     return next(new AppError('Phone already verified. Please login instead.', 400));
//   }

//   // Update doctor
//   doctor.isPhoneVerified = true;
//   doctor.verificationStatus = 'approved';
//   await doctor.save();

//   console.log('VERIFY - After update, isPhoneVerified:', doctor.isPhoneVerified);

//   // Delete OTP
//   await Otp.deleteOne({ phone });
//   console.log('SUCCESS: OTP deleted');

//   // Generate tokens
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

//   // Save refresh token
//   doctor.refreshToken = refreshToken;
//   await doctor.save();

//   // Set cookies and get tokens for response
//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   console.log('SUCCESS: Tokens generated and cookies set');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'Phone verified successfully. Registration complete.',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       doctor: {
//         id: doctor._id,
//         name: doctor.name,
//         phone: doctor.phone,
//         email: doctor.email,
//         verificationStatus: doctor.verificationStatus,
//         isPhoneVerified: doctor.isPhoneVerified
//       }
//     }
//   });
// });

// // ============================================
// // RESEND SIGNUP OTP
// // ============================================
// exports.resendSignupOtp = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return next(new AppError('Phone number is required', 400));
//   }

//   const doctor = await Doctor.findOne({ phone });

//   if (!doctor) {
//     return next(new AppError('Doctor not found. Please register first.', 404));
//   }

//   if (doctor.isPhoneVerified) {
//     return next(new AppError('Phone already verified. Please login instead.', 400));
//   }

//   const isOtpResent = await sendOtp(phone);

//   if (!isOtpResent) {
//     return next(new AppError('Failed to resend OTP. Please try again.', 400));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'OTP resent successfully',
//     data: { phone }
//   });
// });

// // ============================================
// // LOGIN FLOW
// // ============================================

// exports.doctorLogin = catchAsync(async (req, res, next) => {
//   const { phone, role = 'doctor' } = req.body;

//   if (!phone) {
//     return next(new AppError('Phone number is required', 400));
//   }

//   if (role !== 'doctor') {
//     return next(new AppError('Invalid role. Expected: doctor', 400));
//   }

//   console.log('');
//   console.log('DOCTOR LOGIN - STEP 1: Send OTP');
//   console.log('='.repeat(60));
//   console.log(`Phone: ${phone}`);

//   const doctor = await Doctor.findOne({ phone });

//   if (!doctor) {
//     return next(new AppError('Doctor not found. Please register first.', 404));
//   }

//   if (!doctor.isPhoneVerified) {
//     return next(new AppError('Phone not verified. Please complete signup first.', 400));
//   }

//   if (!doctor.isActive) {
//     return next(new AppError('Your account has been deactivated.', 403));
//   }

//   const isOtpSent = await sendOtp(phone);

//   if (!isOtpSent) {
//     return next(new AppError('Failed to send OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP sent to phone');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'OTP sent successfully to your registered phone',
//     data: {
//       phone,
//       role: 'doctor',
//       nextStep: 'Verify OTP'
//     }
//   });
// });

// // ============================================
// // LOGIN OTP VERIFICATION
// // ============================================
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
//     return next(new AppError('Phone not verified. Please complete signup first.', 400));
//   }

//   if (!doctor.isActive) {
//     return next(new AppError('Your account has been deactivated.', 403));
//   }

//   // Delete OTP
//   await Otp.deleteOne({ phone });
//   console.log('SUCCESS: OTP verified');

//   // Generate tokens
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

//   // Save refresh token
//   doctor.refreshToken = refreshToken;
//   await doctor.save();

//   // Set cookies and get tokens for response
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
//         name: doctor.name,
//         phone: doctor.phone,
//         email: doctor.email,
//         verificationStatus: doctor.verificationStatus
//       }
//     }
//   });
// });

// // ============================================
// // RESEND LOGIN OTP
// // ============================================
// exports.resendLoginOtp = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return next(new AppError('Phone number is required', 400));
//   }

//   const doctor = await Doctor.findOne({ phone });

//   if (!doctor) {
//     return next(new AppError('Doctor not found. Please register first.', 404));
//   }

//   if (!doctor.isPhoneVerified) {
//     return next(new AppError('Phone not verified. Please complete signup first.', 400));
//   }

//   if (!doctor.isActive) {
//     return next(new AppError('Your account has been deactivated.', 403));
//   }

//   const isOtpResent = await sendOtp(phone);

//   if (!isOtpResent) {
//     return next(new AppError('Failed to resend OTP. Please try again.', 400));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'OTP resent successfully',
//     data: { phone }
//   });
// });





// // exports.doctorSignup = catchAsync(async (req, res, next) => {
// //   const {
// //     name,
// //     email,
// //     phone,
// //     medicalRegistrationNumber,
// //     issuingMedicalCouncil,
// //     specialization,
// //     dateOfBirth,
// //     gender,
// //     address,
// //     yearsOfExperience,
// //     consultationFees,
// //     degrees,
// //     university,
// //     graduationYear,
// //     currentWorkplace,
// //     designation,
// //     professionalBio
// //   } = req.body;

// //   console.log('');
// //   console.log('DOCTOR SIGNUP - STEP 1: Registration');
// //   console.log('='.repeat(60));

// //   if (!name || !email || !phone || !medicalRegistrationNumber || !issuingMedicalCouncil || !specialization) {
// //     return next(new AppError(
// //       'Required fields: name, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization',
// //       400
// //     ));
// //   }

// //   console.log(`Phone: ${phone}`);
// //   console.log(`Email: ${email}`);
// //   console.log(`Name: ${name}`);

// //   const existingDoctor = await Doctor.findOne({
// //     $or: [
// //       { email },
// //       { phone },
// //       { medicalRegistrationNumber }
// //     ]
// //   });

// //   if (existingDoctor) {
// //     if (existingDoctor.email === email) {
// //       return next(new AppError('Doctor with this email already exists', 400));
// //     }
// //     if (existingDoctor.phone === phone) {
// //       return next(new AppError('Doctor with this phone number already exists', 400));
// //     }
// //     if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
// //       return next(new AppError('Doctor with this registration number already exists', 400));
// //     }
// //   }

// //   const newDoctor = new Doctor({
// //     name,
// //     email,
// //     phone,
// //     medicalRegistrationNumber,
// //     issuingMedicalCouncil,
// //     specialization,
// //     dateOfBirth,
// //     gender,
// //     address,
// //     yearsOfExperience: yearsOfExperience || 0,
// //     consultationFees: consultationFees || 0,
// //     degrees: degrees || [],
// //     university,
// //     graduationYear,
// //     currentWorkplace,
// //     designation,
// //     professionalBio,
// //     isPhoneVerified: false,
// //     verificationStatus: 'pending',
// //     tokenVersion: 0
// //   });

// //   await newDoctor.save();
// //   console.log('SUCCESS: Doctor created in database');

// //   const isOtpSent = await sendOtp(phone);

// //   if (!isOtpSent) {
// //     await Doctor.findByIdAndDelete(newDoctor._id);
// //     return next(new AppError('Failed to send OTP. Please try again.', 400));
// //   }

// //   console.log('SUCCESS: OTP sent to phone');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(201).json({
// //     success: true,
// //     message: 'Registration successful. OTP sent to your phone.',
// //     data: {
// //       doctor: {
// //         id: newDoctor._id,
// //         name: newDoctor.name,
// //         email: newDoctor.email,
// //         phone: newDoctor.phone,
// //         medicalRegistrationNumber: newDoctor.medicalRegistrationNumber
// //       },
// //       nextStep: 'Verify OTP sent to your phone'
// //     }
// //   });
// // });

// // // exports.verifySignupOtp = catchAsync(async (req, res, next) => {
// // //   const { phone, otp } = req.body;

// // //   if (!phone || !otp) {
// // //     return next(new AppError('Phone number and OTP are required', 400));
// // //   }

// // //   console.log('');
// // //   console.log('DOCTOR SIGNUP - STEP 2: OTP Verification');
// // //   console.log('='.repeat(60));
// // //   console.log(`Phone: ${phone}`);

// // //   const otpDoc = await Otp.findOne({ phone });

// // //   if (
// // //     !otpDoc ||
// // //     otpDoc.otp !== parseInt(otp) ||
// // //     otpDoc.otpExpiresAt < new Date()
// // //   ) {
// // //     console.log('ERROR: Invalid or expired OTP');
// // //     return next(new AppError('Invalid or expired OTP', 400));
// // //   }

// // //   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

// // //   if (!doctor) {
// // //     return next(new AppError('Doctor not found. Please register first.', 404));
// // //   }

// // //   if (doctor.isPhoneVerified) {
// // //     return next(new AppError('Phone already verified. Please login instead.', 400));
// // //   }

// // //   doctor.isPhoneVerified = true;
// // //   doctor.verificationStatus = 'approved';
// // //   await doctor.save();

// // //   await Otp.deleteOne({ phone });

// // //   console.log('SUCCESS: Phone verified');

// // //   // FIX: Call with 3 separate parameters, NOT as object, and NO await
// // //   const accessToken = generateAccessToken(
// // //     doctor._id,
// // //     'doctor',
// // //     doctor.tokenVersion
// // //   );

// // //   const refreshToken = generateRefreshToken(
// // //     doctor._id,
// // //     'doctor',
// // //     doctor.tokenVersion
// // //   );

// // //   doctor.refreshToken = refreshToken;
// // //   await doctor.save();

// // //   // FIX: Call with 3 separate parameters, NOT as object
// // //   setTokenCookies(res, accessToken, refreshToken);

// // //   console.log('SUCCESS: Tokens generated');
// // //   console.log('='.repeat(60));
// // //   console.log('');

// // //   res.status(200).json({
// // //     success: true,
// // //     message: 'Phone verified successfully. Registration complete.',
// // //     data: {
// // //       accessToken,
// // //       refreshToken,
// // //       doctor: {
// // //         id: doctor._id,
// // //         name: doctor.name,
// // //         phone: doctor.phone,
// // //         email: doctor.email,
// // //         verificationStatus: doctor.verificationStatus,
// // //         isPhoneVerified: doctor.isPhoneVerified
// // //       }
// // //     }
// // //   });
// // // });


// // exports.verifySignupOtp = catchAsync(async (req, res, next) => {
// //   const { phone, otp } = req.body;

// //   if (!phone || !otp) {
// //     return next(new AppError('Phone number and OTP are required', 400));
// //   }

// //   console.log('');
// //   console.log('DOCTOR SIGNUP - STEP 2: OTP Verification');
// //   console.log('='.repeat(60));
// //   console.log(`Phone: ${phone}`);

// //   const otpDoc = await Otp.findOne({ phone });

// //   if (
// //     !otpDoc ||
// //     otpDoc.otp !== parseInt(otp) ||
// //     otpDoc.otpExpiresAt < new Date()
// //   ) {
// //     console.log('ERROR: Invalid or expired OTP');
// //     return next(new AppError('Invalid or expired OTP', 400));
// //   }

// //   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found. Please register first.', 404));
// //   }

// //   if (doctor.isPhoneVerified) {
// //     return next(new AppError('Phone already verified. Please login instead.', 400));
// //   }

// //   // FIX: Use findByIdAndUpdate with new: true to get updated document
// //   const updatedDoctor = await Doctor.findByIdAndUpdate(
// //     doctor._id,
// //     {
// //       isPhoneVerified: true,
// //       verificationStatus: 'approved'
// //     },
// //     { new: true }
// //   ).select('+tokenVersion');

// //   console.log('VERIFY - After update, isPhoneVerified:', updatedDoctor.isPhoneVerified);

// //   // Delete OTP after successful update
// //   await Otp.deleteOne({ phone });
// //   console.log('SUCCESS: OTP deleted');

// //   // Generate tokens with updated doctor
// //   const accessToken = generateAccessToken(
// //     updatedDoctor._id,
// //     'doctor',
// //     updatedDoctor.tokenVersion
// //   );

// //   const refreshToken = generateRefreshToken(
// //     updatedDoctor._id,
// //     'doctor',
// //     updatedDoctor.tokenVersion
// //   );

// //   // Save refresh token
// //   await Doctor.findByIdAndUpdate(
// //     updatedDoctor._id,
// //     { refreshToken },
// //     { new: true }
// //   );

// //   setTokenCookies(res, accessToken, refreshToken);

// //   console.log('SUCCESS: Tokens generated');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'Phone verified successfully. Registration complete.',
// //     data: {
// //       accessToken,
// //       refreshToken,
// //       doctor: {
// //         id: updatedDoctor._id,
// //         name: updatedDoctor.name,
// //         phone: updatedDoctor.phone,
// //         email: updatedDoctor.email,
// //         verificationStatus: updatedDoctor.verificationStatus,
// //         isPhoneVerified: updatedDoctor.isPhoneVerified
// //       }
// //     }
// //   });
// // });

// // exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
// //   const { phone, otp } = req.body;

// //   if (!phone || !otp) {
// //     return next(new AppError('Phone number and OTP are required', 400));
// //   }

// //   console.log('');
// //   console.log('DOCTOR LOGIN - STEP 2: Verify OTP');
// //   console.log('='.repeat(60));
// //   console.log(`Phone: ${phone}`);

// //   const otpDoc = await Otp.findOne({ phone });

// //   if (
// //     !otpDoc ||
// //     otpDoc.otp !== parseInt(otp) ||
// //     otpDoc.otpExpiresAt < new Date()
// //   ) {
// //     console.log('ERROR: Invalid or expired OTP');
// //     return next(new AppError('Invalid or expired OTP', 400));
// //   }

// //   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found', 404));
// //   }

// //   if (!doctor.isPhoneVerified) {
// //     return next(new AppError('Phone not verified. Please complete signup first.', 400));
// //   }

// //   if (!doctor.isActive) {
// //     return next(new AppError('Your account has been deactivated.', 403));
// //   }

// //   await Otp.deleteOne({ phone });

// //   console.log('SUCCESS: OTP verified');

// //   // FIX: Call with 3 separate parameters, NOT as object, and NO await
// //   const accessToken = generateAccessToken(
// //     doctor._id,
// //     'doctor',
// //     doctor.tokenVersion
// //   );

// //   // const refreshToken = generateRefreshToken(
// //   //   doctor._id,
// //   //   'doctor',
// //   //   doctor.tokenVersion
// //   // );
// // const refreshToken = generateRefreshToken(
// //   doctor._id,
// //   'doctor',
// //   doctor.tokenVersion
// // );

// //   doctor.refreshToken = refreshToken;
// //   await doctor.save();

// //   // FIX: Call with 3 separate parameters, NOT as object
// //   setTokenCookies(res, accessToken, refreshToken);

// //   console.log('SUCCESS: Tokens generated and login complete');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP verified. Logged in successfully.',
// //     data: {
// //       accessToken,
// //       refreshToken,
// //       doctor: {
// //         id: doctor._id,
// //         name: doctor.name,
// //         phone: doctor.phone,
// //         email: doctor.email,
// //         verificationStatus: doctor.verificationStatus
// //       }
// //     }
// //   });
// // });


// // exports.resendSignupOtp = catchAsync(async (req, res, next) => {
// //   const { phone } = req.body;

// //   if (!phone) {
// //     return next(new AppError('Phone number is required', 400));
// //   }

// //   const doctor = await Doctor.findOne({ phone });

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found. Please register first.', 404));
// //   }

// //   if (doctor.isPhoneVerified) {
// //     return next(new AppError('Phone already verified. Please login instead.', 400));
// //   }

// //   const isOtpResent = await sendOtp(phone);

// //   if (!isOtpResent) {
// //     return next(new AppError('Failed to resend OTP. Please try again.', 400));
// //   }

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP resent successfully',
// //     data: { phone }
// //   });
// // });


// // // LOGIN FLOW


// // // exports.doctorLogin = catchAsync(async (req, res, next) => {
// // //   const { phone, role = 'doctor' } = req.body;

// // //   if (!phone) {
// // //     return next(new AppError('Phone number is required', 400));
// // //   }

// // //   if (role !== 'doctor') {
// // //     return next(new AppError('Invalid role. Expected: doctor', 400));
// // //   }

// // //   console.log('');
// // //   console.log('DOCTOR LOGIN - STEP 1: Send OTP');
// // //   console.log('='.repeat(60));
// // //   console.log(`Phone: ${phone}`);

// // //   const doctor = await Doctor.findOne({ phone });

// // //   if (!doctor) {
// // //     return next(new AppError('Doctor not found. Please register first.', 404));
// // //   }

// // //   if (!doctor.isPhoneVerified) {
// // //     return next(new AppError('Phone not verified. Please complete signup first.', 400));
// // //   }

// // //   if (!doctor.isActive) {
// // //     return next(new AppError('Your account has been deactivated.', 403));
// // //   }

// // //   const isOtpSent = await sendOtp(phone);

// // //   if (!isOtpSent) {
// // //     return next(new AppError('Failed to send OTP. Please try again.', 400));
// // //   }

// // //   console.log('SUCCESS: OTP sent to phone');
// // //   console.log('='.repeat(60));
// // //   console.log('');

// // //   res.status(200).json({
// // //     success: true,
// // //     message: 'OTP sent successfully to your registered phone',
// // //     data: {
// // //       phone,
// // //       role: 'doctor',
// // //       nextStep: 'Verify OTP'
// // //     }
// // //   });
// // // });
// // exports.doctorLogin = catchAsync(async (req, res, next) => {
// //   const { phone, role = 'doctor' } = req.body;

// //   if (!phone) {
// //     return next(new AppError('Phone number is required', 400));
// //   }

// //   if (role !== 'doctor') {
// //     return next(new AppError('Invalid role. Expected: doctor', 400));
// //   }

// //   console.log('');
// //   console.log('DOCTOR LOGIN - STEP 1: Send OTP');
// //   console.log('='.repeat(60));
// //   console.log(`Phone: ${phone}`);

// //   // ADD DEBUG: Check what's actually in the database
// //   const doctor = await Doctor.findOne({ phone });

// //   console.log('DEBUG - Doctor found:', !!doctor);
// //   if (doctor) {
// //     console.log('DEBUG - isPhoneVerified:', doctor.isPhoneVerified);
// //     console.log('DEBUG - isActive:', doctor.isActive);
// //     console.log('DEBUG - verificationStatus:', doctor.verificationStatus);
// //   }

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found. Please register first.', 404));
// //   }

// //   // IMPORTANT: Check phone verification status BEFORE attempting login
// //   if (!doctor.isPhoneVerified) {
// //     console.log('ERROR: Phone not verified');
// //     return next(new AppError('Phone not verified. Please complete signup first.', 400));
// //   }

// //   if (!doctor.isActive) {
// //     return next(new AppError('Your account has been deactivated.', 403));
// //   }

// //   const isOtpSent = await sendOtp(phone);

// //   if (!isOtpSent) {
// //     return next(new AppError('Failed to send OTP. Please try again.', 400));
// //   }

// //   console.log('SUCCESS: OTP sent to phone');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP sent successfully to your registered phone',
// //     data: {
// //       phone,
// //       role: 'doctor',
// //       nextStep: 'Verify OTP'
// //     }
// //   });
// // });

// // exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
// //   const { phone, otp } = req.body;

// //   if (!phone || !otp) {
// //     return next(new AppError('Phone number and OTP are required', 400));
// //   }

// //   console.log('');
// //   console.log('DOCTOR LOGIN - STEP 2: Verify OTP');
// //   console.log('='.repeat(60));
// //   console.log(`Phone: ${phone}`);

// //   const otpDoc = await Otp.findOne({ phone });

// //   if (
// //     !otpDoc ||
// //     otpDoc.otp !== parseInt(otp) ||
// //     otpDoc.otpExpiresAt < new Date()
// //   ) {
// //     console.log('ERROR: Invalid or expired OTP');
// //     return next(new AppError('Invalid or expired OTP', 400));
// //   }

// //   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found', 404));
// //   }

// //   if (!doctor.isPhoneVerified) {
// //     return next(new AppError('Phone not verified. Please complete signup first.', 400));
// //   }

// //   if (!doctor.isActive) {
// //     return next(new AppError('Your account has been deactivated.', 403));
// //   }

// //   await Otp.deleteOne({ phone });

// //   console.log('SUCCESS: OTP verified');

// //   const refreshToken = await generateRefreshToken({
// //     id: doctor?._id,
// //     customId: doctor?.customId,
// //     tokenVersion: doctor?.tokenVersion
// //   });

// //   const accessToken = await generateAccessToken({
// //     id: doctor?._id,
// //     customId: doctor?.customId,
// //     tokenVersion: doctor?.tokenVersion
// //   });

// //   doctor.refreshToken = refreshToken;
// //   await doctor.save();

// //   const userInfo = {
// //     id: doctor._id,
// //     customId: doctor.customId,
// //     name: doctor.name,
// //     phone: doctor.phone,
// //     email: doctor.email
// //   };

// //   setTokenCookies({
// //     res,
// //     accessToken,
// //     refreshToken,
// //     userInfo
// //   });

// //   console.log('SUCCESS: Tokens generated and login complete');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP verified. Logged in successfully.',
// //     data: {
// //       cookies: {
// //         accessToken,
// //         refreshToken,
// //         userInfo
// //       },
// //       doctor: {
// //         id: doctor._id,
// //         customId: doctor.customId,
// //         name: doctor.name,
// //         phone: doctor.phone,
// //         email: doctor.email,
// //         verificationStatus: doctor.verificationStatus
// //       }
// //     }
// //   });
// // });

// // exports.resendLoginOtp = catchAsync(async (req, res, next) => {
// //   const { phone } = req.body;

// //   if (!phone) {
// //     return next(new AppError('Phone number is required', 400));
// //   }

// //   const doctor = await Doctor.findOne({ phone });

// //   if (!doctor) {
// //     return next(new AppError('Doctor not found', 404));
// //   }

// //   if (!doctor.isPhoneVerified) {
// //     return next(new AppError('Phone not verified. Please complete signup first.', 400));
// //   }

// //   const isOtpResent = await sendOtp(phone);

// //   if (!isOtpResent) {
// //     return next(new AppError('Failed to resend OTP. Please try again.', 400));
// //   }

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP resent successfully',
// //     data: { phone }
// //   });
// // });

// // ============================================
// // LOGOUT
// // ============================================

// exports.logout = catchAsync(async (req, res, next) => {
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     success: true,
//     message: 'Logged out successfully'
//   });
// });

// exports.logoutAllDevices = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return next(new AppError('Phone number is required', 400));
//   }

//   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.tokenVersion = (doctor.tokenVersion || 0) + 1;
//   await doctor.save({ validateBeforeSave: false });

//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     success: true,
//     message: 'Logged out from all devices successfully'
//   });
// });

// // ============================================
// // PROFILE MANAGEMENT
// // ============================================

// exports.getMyProfile = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findById(req.user?._id || req.user?.id).select('-password -tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       doctor
//     }
//   });
// });

// exports.updateProfile = catchAsync(async (req, res, next) => {
//   const { password, role, tokenVersion, verificationStatus, medicalRegistrationNumber, ...updateData } = req.body;

//   const updatedDoctor = await Doctor.findByIdAndUpdate(
//     req.user?._id || req.user?.id,
//     updateData,
//     {
//       new: true,
//       runValidators: true
//     }
//   ).select('-password -tokenVersion');

//   if (!updatedDoctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Profile updated successfully',
//     data: {
//       doctor: updatedDoctor
//     }
//   });
// });

// // ============================================
// // AUTHENTICATION STATUS
// // ============================================

// exports.checkAuthStatus = catchAsync(async (req, res, next) => {
//   console.log('=== DEBUG: Inside checkAuthStatus ===');
//   console.log('Cookies:', req.cookies);

//   const { accessToken, refreshToken } = req.cookies || {};
//   console.log('Cookies: refreshToken', refreshToken);

//   const isProduction = process.env.NODE_ENV === 'production';

//   if (!refreshToken || refreshToken === 'undefined') {
//     return res.status(200).json({
//       success: true,
//       isAuthenticated: false,
//       message: 'refresh token expired',
//       shouldLogout: true
//     });
//   }

//   if (accessToken && accessToken !== 'undefined') {
//     try {
//       const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
//       console.log('Access token decoded:', decoded);

//       let doctor = await Doctor.findById(decoded.id);

//       if (doctor) {
//         res.cookie('isAuthenticated', true, {
//           httpOnly: false,
//           secure: true,
//           sameSite: 'none',
//           maxAge: 90 * 24 * 60 * 60 * 1000
//         });
//         return res.status(200).json({
//           success: true,
//           isAuthenticated: true,
//           data: {
//             id: doctor._id,
//             name: doctor.name,
//             phone: doctor.phone,
//             email: doctor.email,
//             verificationStatus: doctor.verificationStatus
//           }
//         });
//       }
//     } catch (error) {
//       console.log('Access token verification failed:', error.message);
//     }
//   }

//   if (refreshToken && refreshToken !== 'undefined') {
//     try {
//       const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//       console.log('Refresh token decoded:', decoded);

//       let doctor = await Doctor.findById(decoded.id);

//       console.log('Doctor found:', doctor);
//       console.log('Token versions - Doctor:', doctor?.tokenVersion, 'Decoded:', decoded.tokenVersion);

//       if (!doctor || doctor.tokenVersion !== decoded.tokenVersion) {
//         return next(new AppError('Invalid refresh token - please login again', 401));
//       }

//       const newAccessToken = await generateAccessToken({
//         id: doctor?._id,
//         customId: doctor?.customId,
//         tokenVersion: doctor?.tokenVersion
//       });

//       res.cookie('accessToken', newAccessToken, {
//         httpOnly: true,
//         secure: true,
//         sameSite: 'none',
//         maxAge: 5 * 60 * 1000
//       });

//       res.cookie('isAuthenticated', true, {
//         httpOnly: false,
//         secure: true,
//         sameSite: 'none',
//         maxAge: 90 * 24 * 60 * 60 * 1000
//       });

//       res.setHeader('X-New-Token', newAccessToken);
//       res.setHeader('X-Token-Refreshed', 'true');

//       return res.status(200).json({
//         success: true,
//         isAuthenticated: true,
//         data: {
//           id: doctor._id,
//           name: doctor.name,
//           phone: doctor.phone,
//           email: doctor.email,
//           verificationStatus: doctor.verificationStatus
//         }
//       });
//     } catch (error) {
//       console.log('Refresh token verification failed:', error.message);
//       return next(new AppError('Session expired - please login again', 401));
//     }
//   }

//   res.cookie('isAuthenticated', false, {
//     httpOnly: false,
//     secure: true,
//     sameSite: 'none',
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
// // PUBLIC DOCTOR ENDPOINTS
// // ============================================

// exports.getAllDoctors = catchAsync(async (req, res, next) => {
//   const { specialization, city, page = 1, limit = 10 } = req.query;

//   const filter = {
//     isActive: true,
//     verificationStatus: 'approved'
//   };

//   if (specialization) {
//     filter.specialization = { $regex: specialization, $options: 'i' };
//   }

//   if (city) {
//     filter['address.city'] = { $regex: city, $options: 'i' };
//   }

//   const skip = (page - 1) * limit;

//   const doctors = await Doctor.find(filter)
//     .select('-password -tokenVersion -verificationDocuments')
//     .skip(skip)
//     .limit(parseInt(limit))
//     .sort('-averageRating -createdAt');

//   const total = await Doctor.countDocuments(filter);

//   res.status(200).json({
//     success: true,
//     results: doctors.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: {
//       doctors
//     }
//   });
// });

// exports.getDoctorById = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findById(req.params.id)
//     .select('-password -tokenVersion -verificationDocuments');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       doctor
//     }
//   });
// });

// exports.getDoctorsBySpecialization = catchAsync(async (req, res, next) => {
//   const { specialization } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   const skip = (page - 1) * limit;

//   const doctors = await Doctor.find({
//     specialization: { $regex: specialization, $options: 'i' },
//     verificationStatus: 'approved',
//     isActive: true
//   })
//     .select('-password -tokenVersion -verificationDocuments')
//     .skip(skip)
//     .limit(parseInt(limit))
//     .sort('-averageRating');

//   const total = await Doctor.countDocuments({
//     specialization: { $regex: specialization, $options: 'i' },
//     verificationStatus: 'approved',
//     isActive: true
//   });

//   res.status(200).json({
//     success: true,
//     results: doctors.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: {
//       doctors
//     }
//   });
// });

// // ============================================
// // AVAILABILITY MANAGEMENT
// // ============================================

// exports.updateAvailability = catchAsync(async (req, res, next) => {
//   const { days, timeSlots } = req.body;

//   if (!days || !timeSlots) {
//     return next(new AppError('Please provide days and timeSlots', 400));
//   }

//   const updatedDoctor = await Doctor.findByIdAndUpdate(
//     req.user?._id || req.user?.id,
//     { availability: { days, timeSlots } },
//     { new: true, runValidators: true }
//   ).select('-password -tokenVersion');

//   if (!updatedDoctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Availability updated successfully',
//     data: {
//       doctor: updatedDoctor
//     }
//   });
// });

// // ============================================
// // CLINIC MANAGEMENT
// // ============================================

// exports.addClinic = catchAsync(async (req, res, next) => {
//   const clinicData = req.body;

//   if (!clinicData.clinicName || !clinicData.address) {
//     return next(new AppError('Please provide clinic name and address', 400));
//   }

//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.push(clinicData);
//   await doctor.save();

//   res.status(201).json({
//     success: true,
//     message: 'Clinic added successfully',
//     data: {
//       clinics: doctor.clinics
//     }
//   });
// });

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
//     data: {
//       clinic
//     }
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

// // ============================================
// // VERIFICATION DOCUMENTS
// // ============================================

// exports.uploadVerificationDocuments = catchAsync(async (req, res, next) => {
//   const { identityProof, degreesCertificates, medicalCouncilRegistration } = req.body;

//   const doctor = await Doctor.findById(req.user?._id || req.user?.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   if (identityProof) {
//     doctor.verificationDocuments.identityProof = identityProof;
//   }

//   if (degreesCertificates) {
//     doctor.verificationDocuments.degreesCertificates = degreesCertificates;
//   }

//   if (medicalCouncilRegistration) {
//     doctor.verificationDocuments.medicalCouncilRegistration = medicalCouncilRegistration;
//   }

//   await doctor.save();

//   res.status(200).json({
//     success: true,
//     message: 'Verification documents uploaded successfully',
//     data: {
//       verificationDocuments: doctor.verificationDocuments
//     }
//   });
// });



// controllers/doctorController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const Otp = require('../models/otpModel');
const { sendOtp } = require('../utils/otpUtils');
const jwt = require('jsonwebtoken');

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

exports.doctorSignup = catchAsync(async (req, res, next) => {
  const {
    name,
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
    professionalBio
  } = req.body;

  console.log('');
  console.log('DOCTOR SIGNUP - STEP 1: Registration');
  console.log('='.repeat(60));

  if (
    !name ||
    !email ||
    !phone ||
    !medicalRegistrationNumber ||
    !issuingMedicalCouncil ||
    !specialization
  ) {
    return next(
      new AppError(
        'Required fields: name, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization',
        400
      )
    );
  }

  console.log(`Phone: ${phone}`);
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);

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

  const newDoctor = new Doctor({
    name,
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
    isPhoneVerified: false,
    verificationStatus: 'pending',
    tokenVersion: 0
  });

  await newDoctor.save();
  console.log('SUCCESS: Doctor created in database');

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
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        medicalRegistrationNumber: newDoctor.medicalRegistrationNumber
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
    otpDoc.otp !== parseInt(otp) ||
    otpDoc.otpExpiresAt < new Date()
  ) {
    console.log('ERROR: Invalid or expired OTP');
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
        name: doctor.name,
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

exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  console.log('');
  console.log('DOCTOR LOGIN - STEP 2: Verify OTP');
  console.log('='.repeat(60));
  console.log(`Phone: ${phone}`);

  const otpDoc = await Otp.findOne({ phone });

  if (
    !otpDoc ||
    otpDoc.otp !== parseInt(otp) ||
    otpDoc.otpExpiresAt < new Date()
  ) {
    console.log('ERROR: Invalid or expired OTP');
    return next(new AppError('Invalid or expired OTP', 400));
  }

  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (!doctor.isPhoneVerified) {
    return next(
      new AppError('Phone not verified. Please complete signup first.', 400)
    );
  }

  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  await Otp.deleteOne({ phone });
  console.log('SUCCESS: OTP verified');

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

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.user?._id || req.user?.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');

  if (!updatedDoctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { doctor: updatedDoctor }
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
            name: doctor.name,
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
          name: doctor.name,
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

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.user?._id || req.user?.id,
    { availability: { days, timeSlots } },
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

exports.addClinic = catchAsync(async (req, res, next) => {
  const clinicData = req.body;

  if (!clinicData.clinicName || !clinicData.address) {
    return next(new AppError('Please provide clinic name and address', 400));
  }

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.clinics.push(clinicData);
  await doctor.save();

  res.status(201).json({
    success: true,
    message: 'Clinic added successfully',
    data: { clinics: doctor.clinics }
  });
});

exports.updateClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;
  const updateData = req.body;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const clinic = doctor.clinics.id(clinicId);

  if (!clinic) {
    return next(new AppError('Clinic not found', 404));
  }

  Object.assign(clinic, updateData);
  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Clinic updated successfully',
    data: { clinic }
  });
});

exports.deleteClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;

  const doctor = await Doctor.findById(req.user?._id || req.user?.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.clinics.pull(clinicId);
  await doctor.save();

  res.status(200).json({
    success: true,
    message: 'Clinic deleted successfully',
    data: null
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

  if (identityProof) {
    doctor.verificationDocuments.identityProof = identityProof;
  }

  if (degreesCertificates) {
    doctor.verificationDocuments.degreesCertificates = degreesCertificates;
  }

  if (medicalCouncilRegistration) {
    doctor.verificationDocuments.medicalCouncilRegistration =
      medicalCouncilRegistration;
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
