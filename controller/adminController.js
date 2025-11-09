// // controllers/adminController.js

// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Admin = require('../models/adminModel');
// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const Otp = require('../models/otpModel');
// const { sendOtp } = require('../utils/otpUtils');
// const bcrypt = require('bcryptjs');

// // Import token utilities - EXACTLY like doctorController
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   generateOtpToken,
//   verifyToken,
//   setAuthCookies,
//   clearAuthCookies
// } = require('../utils/tokenUtils');

// // ============================================
// // ADMIN SIGNUP (superAdmin or subAdmin)
// // ============================================

// // exports.adminSignup = catchAsync(async (req, res, next) => {
// //   const { email, password, firstName, lastName, phone, role = 'superAdmin' } = req.body;

// //   console.log('');
// //   console.log(`${role.toUpperCase()} SIGNUP - STEP 1: Registration`);
// //   console.log('='.repeat(60));

// //   // Validation
// //   if (!email || !password || !firstName) {
// //     return next(
// //       new AppError('Email, password, and first name are required', 400)
// //     );
// //   }

// //   // Validate role
// //   if (role !== 'superAdmin' && role !== 'subAdmin') {
// //     return next(new AppError('Invalid role. Must be superAdmin or subAdmin', 400));
// //   }

// //   console.log(`Email: ${email}`);
// //   console.log(`Name: ${firstName} ${lastName || ''}`);
// //   console.log(`Role: ${role}`);

// //   // Check if admin already exists
// //   const existingAdmin = await Admin.findOne({
// //     $or: [{ email: email.toLowerCase() }, { phone }]
// //   });

// //   if (existingAdmin) {
// //     if (existingAdmin.email === email.toLowerCase()) {
// //       return next(
// //         new AppError(`${role} with this email already exists`, 409)
// //       );
// //     }
// //     if (existingAdmin.phone === phone) {
// //       return next(
// //         new AppError(`${role} with this phone already exists`, 409)
// //       );
// //     }
// //   }

// //   // Hash password using bcryptjs (10 rounds)
// //   const hashedPassword = await bcrypt.hash(password, 10);

// //   // Create admin/subadmin
// //   const newAdmin = new Admin({
// //     email: email.toLowerCase(),
// //     password: hashedPassword,
// //     firstName,
// //     lastName: lastName || '',
// //     phone,
// //     role: role, // Store role (superAdmin or subAdmin)
// //     status: 'active',
// //     isActive: true,
// //     tokenVersion: 0
// //   });

// //   await newAdmin.save();
// //   console.log(`SUCCESS: ${role} created in database`);

// //   // If phone is provided, send OTP
// //   if (phone) {
// //     const isOtpSent = await sendOtp(phone);

// //     if (!isOtpSent) {
// //       await Admin.findByIdAndDelete(newAdmin._id);
// //       return next(new AppError('Failed to send OTP. Please try again.', 400));
// //     }

// //     console.log('SUCCESS: OTP sent to phone');
// //     console.log('='.repeat(60));
// //     console.log('');

// //     return res.status(201).json({
// //       success: true,
// //       message: `${role} registered successfully. OTP sent to your phone.`,
// //       data: {
// //         admin: {
// //           id: newAdmin._id,
// //           email: newAdmin.email,
// //           firstName: newAdmin.firstName,
// //           phone: newAdmin.phone,
// //           role: newAdmin.role
// //         },
// //         nextStep: 'Verify OTP sent to your phone'
// //       }
// //     });
// //   }

// //   console.log('='.repeat(60));
// //   console.log('');

// //   // If no phone, return success without OTP
// //   res.status(201).json({
// //     success: true,
// //     message: `${role} registered successfully`,
// //     data: {
// //       admin: {
// //         id: newAdmin._id,
// //         email: newAdmin.email,
// //         firstName: newAdmin.firstName,
// //         role: newAdmin.role
// //       }
// //     }
// //   });
// // });
// exports.adminSignup = catchAsync(async (req, res, next) => {
//   const { email, password, firstName, lastName, phone, role = 'superAdmin' } = req.body;

//   console.log('');
//   console.log(`${role.toUpperCase()} SIGNUP - STEP 1: Registration`);
//   console.log('='.repeat(60));

//   // Validation
//   if (!email || !password || !firstName) {
//     return next(
//       new AppError('Email, password, and first name are required', 400)
//     );
//   }

//   // Validate role
//   if (role !== 'superAdmin' && role !== 'subAdmin') {
//     return next(new AppError('Invalid role. Must be superAdmin or subAdmin', 400));
//   }

//   console.log(`Email: ${email}`);
//   console.log(`Name: ${firstName} ${lastName || ''}`);
//   console.log(`Role: ${role}`);

//   // Check if admin already exists
//   const existingAdmin = await Admin.findOne({
//     $or: [{ email: email.toLowerCase() }, { phone }]
//   });

//   if (existingAdmin) {
//     if (existingAdmin.email === email.toLowerCase()) {
//       return next(
//         new AppError(`${role} with this email already exists`, 409)
//       );
//     }
//     if (existingAdmin.phone === phone) {
//       return next(
//         new AppError(`${role} with this phone already exists`, 409)
//       );
//     }
//   }

//   // Hash password using bcryptjs (10 rounds)
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Create admin/subadmin with isVerified: true
//   const newAdmin = new Admin({
//     email: email.toLowerCase(),
//     password: hashedPassword,
//     firstName,
//     lastName: lastName || '',
//     phone,
//     role: role,
//     status: 'active',
//     isActive: true,
//     isVerified: true, // ⭐ Set to true immediately - no OTP needed
//     tokenVersion: 0
//   });

//   await newAdmin.save();
//   console.log(`SUCCESS: ${role} created in database`);
//   console.log(`isVerified: true`);

//   console.log('='.repeat(60));
//   console.log('');

//   // Return success - admin can login immediately
//   res.status(201).json({
//     success: true,
//     message: `${role} registered successfully. You can now login with your email and password.`,
//     data: {
//       admin: {
//         id: newAdmin._id,
//         email: newAdmin.email,
//         firstName: newAdmin.firstName,
//         phone: newAdmin.phone,
//         role: newAdmin.role,
//         isVerified: true
//       },
//       nextStep: 'Login with your email and password'
//     }
//   });
// });
// exports.adminSignup = catchAsync(async (req, res, next) => {
//   const { email, password, firstName, lastName, phone, role = 'superAdmin' } = req.body;

//   console.log('');
//   console.log(`${role.toUpperCase()} SIGNUP - STEP 1: Registration`);
//   console.log('='.repeat(60));

//   // Validation
//   if (!email || !password || !firstName) {
//     return next(
//       new AppError('Email, password, and first name are required', 400)
//     );
//   }

//   // Validate role
//   if (role !== 'superAdmin' && role !== 'subAdmin') {
//     return next(new AppError('Invalid role. Must be superAdmin or subAdmin', 400));
//   }

//   console.log(`Email: ${email}`);
//   console.log(`Name: ${firstName} ${lastName || ''}`);
//   console.log(`Role: ${role}`);

//   // Check if admin already exists
//   const existingAdmin = await Admin.findOne({
//     $or: [{ email: email.toLowerCase() }, { phone }]
//   });

//   if (existingAdmin) {
//     if (existingAdmin.email === email.toLowerCase()) {
//       return next(
//         new AppError(`${role} with this email already exists`, 409)
//       );
//     }
//     if (existingAdmin.phone === phone) {
//       return next(
//         new AppError(`${role} with this phone already exists`, 409)
//       );
//     }
//   }

//   // Hash password using bcryptjs (10 rounds)
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Create admin/subadmin with isVerified: true
//   const newAdmin = new Admin({
//     email: email.toLowerCase(),
//     password: hashedPassword,
//     firstName,
//     lastName: lastName || '',
//     phone,
//     role: role,
//     status: 'active',
//     isActive: true,
//     isVerified: true, // ⭐ Set to true immediately - no OTP needed
//     tokenVersion: 0
//   });

//   await newAdmin.save();
//   console.log(`SUCCESS: ${role} created in database`);
//   console.log(`isVerified: true`);

//   console.log('='.repeat(60));
//   console.log('');

//   // Return success - admin can login immediately
//   res.status(201).json({
//     success: true,
//     message: `${role} registered successfully. You can now login with your email and password.`,
//     data: {
//       admin: {
//         id: newAdmin._id,
//         email: newAdmin.email,
//         firstName: newAdmin.firstName,
//         phone: newAdmin.phone,
//         role: newAdmin.role,
//         isVerified: true
//       },
//       nextStep: 'Login with your email and password'
//     }
//   });
// });
// exports.adminSignup = catchAsync(async (req, res, next) => {
//   const { email, password, firstName, lastName, phone, role = 'superAdmin' } = req.body;

//   console.log('');
//   console.log(`${role.toUpperCase()} SIGNUP - STEP 1: Registration`);
//   console.log('='.repeat(60));

//   // Validation
//   if (!email || !password || !firstName) {
//     return next(
//       new AppError('Email, password, and first name are required', 400)
//     );
//   }

//   // Validate role
//   if (role !== 'superAdmin' && role !== 'subAdmin') {
//     return next(new AppError('Invalid role. Must be superAdmin or subAdmin', 400));
//   }

//   console.log(`Email: ${email}`);
//   console.log(`Name: ${firstName} ${lastName || ''}`);
//   console.log(`Role: ${role}`);

//   // Check if admin already exists
//   const existingAdmin = await Admin.findOne({
//     $or: [{ email: email.toLowerCase() }, { phone }]
//   });

//   if (existingAdmin) {
//     if (existingAdmin.email === email.toLowerCase()) {
//       return next(
//         new AppError(`${role} with this email already exists`, 409)
//       );
//     }
//     if (existingAdmin.phone === phone) {
//       return next(
//         new AppError(`${role} with this phone already exists`, 409)
//       );
//     }
//   }

//   // Hash password using bcryptjs (10 rounds)
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Create admin/subadmin with isVerified: true
//   const newAdmin = new Admin({
//     email: email.toLowerCase(),
//     password: hashedPassword,
//     firstName,
//     lastName: lastName || '',
//     phone,
//     role: role,
//     status: 'active',
//     isActive: true,
//     isVerified: true, // ⭐ Set to true immediately - no OTP needed
//     tokenVersion: 0
//   });

//   await newAdmin.save();
//   console.log(`SUCCESS: ${role} created in database`);
//   console.log(`isVerified: true`);

//   console.log('='.repeat(60));
//   console.log('');

//   // Return success - admin can login immediately
//   res.status(201).json({
//     success: true,
//     message: `${role} registered successfully. You can now login with your email and password.`,
//     data: {
//       admin: {
//         id: newAdmin._id,
//         email: newAdmin.email,
//         firstName: newAdmin.firstName,
//         phone: newAdmin.phone,
//         role: newAdmin.role,
//         isVerified: true
//       },
//       nextStep: 'Login with your email and password'
//     }
//   });
// });

// exports.verifySignupOtp = catchAsync(async (req, res, next) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return next(new AppError('Phone number and OTP are required', 400));
//   }

//   console.log('');
//   console.log('ADMIN SIGNUP - STEP 2: Verify OTP');
//   console.log('='.repeat(60));
//   console.log(`Phone: ${phone}`);

//   // Verify OTP from database
//   const otpDoc = await Otp.findOne({ phone });

//   if (!otpDoc) {
//     console.log('ERROR: OTP not found');
//     return next(new AppError('OTP not found. Please request a new one.', 400));
//   }

//   console.log(`OTP in DB: ${otpDoc.otp}, OTP received: ${otp}`);

//   // Check if OTP is expired
//   if (otpDoc.otpExpiresAt < new Date()) {
//     console.log('ERROR: OTP expired');
//     await Otp.deleteOne({ phone });
//     return next(new AppError('OTP has expired. Please request a new one.', 400));
//   }

//   // Check if OTP matches
//   if (otpDoc.otp !== parseInt(otp)) {
//     console.log('ERROR: Invalid OTP');
//     return next(new AppError('Invalid OTP. Please try again.', 400));
//   }

//   console.log('SUCCESS: OTP verified');

//   // Find admin by phone
//   const admin = await Admin.findOne({ phone }).select('+isVerified');

//   if (!admin) {
//     console.log('ERROR: Admin not found');
//     return next(new AppError('Admin not found', 404));
//   }

//   console.log(`Admin before update - isVerified: ${admin.isVerified}`);

//   // Mark admin as verified using updateOne
//   const updateResult = await Admin.updateOne(
//     { _id: admin._id },
//     { $set: { isVerified: true } }
//   );

//   console.log(`Update result: ${JSON.stringify(updateResult)}`);

//   // Fetch updated admin
//   const updatedAdmin = await Admin.findById(admin._id).select('+isVerified');
//   console.log(`Admin after update - isVerified: ${updatedAdmin.isVerified}`);

//   // Delete OTP after successful verification
//   await Otp.deleteOne({ phone });
//   console.log('SUCCESS: OTP deleted from database');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'Phone verified successfully. Your account is now active.',
//     data: {
//       admin: {
//         id: updatedAdmin._id,
//         email: updatedAdmin.email,
//         firstName: updatedAdmin.firstName,
//         phone: updatedAdmin.phone,
//         role: updatedAdmin.role,
//         isVerified: updatedAdmin.isVerified
//       },
//       nextStep: 'You can now login with email and password'
//     }
//   });
// });

// // ADMIN LOGIN (Email + Password + OTP)

// // ============================================
// // ADMIN LOGIN (Email + Password only)
// // ============================================
// exports.adminLogin = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   console.log('');
//   console.log('ADMIN LOGIN - Email + Password Authentication');
//   console.log('='.repeat(60));

//   // Validation
//   if (!email || !password) {
//     return next(new AppError('Please provide email and password', 400));
//   }

//   const emailLower = email.toLowerCase();
//   console.log(`Email: ${emailLower}`);

//   // ⭐ FIX: Select ALL required fields explicitly
//   const admin = await Admin.findOne({ email: emailLower })
//     .select('+password +tokenVersion +isVerified +isActive +role');

//   console.log(`Admin found: ${!!admin}`);
//   if (admin) {
//     console.log(`Email in DB: ${admin.email}`);
//     console.log(`isVerified: ${admin.isVerified}`);
//     console.log(`isActive: ${admin.isActive}`);
//   }

//   // ⭐ If admin not found - detailed debugging
//   if (!admin) {
//     console.log(`ERROR: No admin found with email: ${emailLower}`);
//     console.log('Possible causes:');
//     console.log('1. Email not registered');
//     console.log('2. Email case mismatch');
//     console.log('3. Database connection issue');
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // Check if admin is verified BEFORE password comparison
//   if (!admin.isVerified) {
//     console.log('ERROR: Admin not verified');
//     return next(
//       new AppError('Please verify your phone number via OTP before logging in', 403)
//     );
//   }

//   // Check if admin is active
//   if (!admin.isActive) {
//     console.log('ERROR: Admin account is inactive');
//     return next(
//       new AppError('Your account has been deactivated. Please contact support.', 403)
//     );
//   }

//   // Compare password using bcryptjs
//   const isPasswordCorrect = await bcrypt.compare(password, admin.password);

//   console.log(`Password match: ${isPasswordCorrect}`);
//   console.log(`Stored hash starts with: ${admin.password.substring(0, 10)}...`);

//   if (!isPasswordCorrect) {
//     console.log('ERROR: Password does not match');
//     return next(new AppError('Invalid email or password', 401));
//   }

//   console.log(`SUCCESS: Credentials validated for ${admin.role}`);

//   // Get admin role
//   const adminRole = admin.role || 'superAdmin';

//   // Generate tokens
//   const accessToken = generateAccessToken(admin._id, adminRole, admin.tokenVersion);
//   const refreshToken = generateRefreshToken(admin._id, adminRole, admin.tokenVersion);

//   admin.refreshToken = refreshToken;
//   await admin.save({ validateBeforeSave: false });

//   const tokens = setAuthCookies(res, accessToken, refreshToken);

//   // Remove sensitive data
//   admin.password = undefined;
//   admin.tokenVersion = undefined;

//   console.log('SUCCESS: Tokens generated and login completed');
//   console.log('='.repeat(60));
//   console.log('');

//   res.status(200).json({
//     success: true,
//     message: 'Login successful',
//     data: {
//       accessToken: tokens.accessToken,
//       refreshToken: tokens.refreshToken,
//       admin: {
//         id: admin._id,
//         email: admin.email,
//         firstName: admin.firstName,
//         lastName: admin.lastName,
//         role: admin.role
//       },
//       role: adminRole
//     }
//   });
// });

// // exports.adminLogin = catchAsync(async (req, res, next) => {
// //   const { email, password, phone } = req.body;

// //   console.log('');
// //   console.log('ADMIN LOGIN - STEP 1: Validate Credentials');
// //   console.log('='.repeat(60));

// //   // Validate input
// //   if (!email || !password) {
// //     return next(new AppError('Please provide email and password', 400));
// //   }

// //   console.log(`Email: ${email}`);

// //   // Find admin and include password & tokenVersion
// //   const admin = await Admin.findOne({ email: email.toLowerCase() })
// //     .select('+password +tokenVersion');

// //   if (!admin) {
// //     return next(new AppError('Invalid email or password', 401));
// //   }

// //   // Compare password using bcryptjs
// //   const isPasswordCorrect = await bcrypt.compare(password, admin.password);
// //   if (!isPasswordCorrect) {
// //     return next(new AppError('Invalid email or password', 401));
// //   }

// //   // Check if admin is active
// //   if (!admin.isActive) {
// //     return next(
// //       new AppError('Your account has been deactivated. Please contact support.', 403)
// //     );
// //   }

// //   console.log(`SUCCESS: Credentials validated for ${admin.role}`);

// //   // Get admin role (superAdmin or subAdmin)
// //   const adminRole = admin.role || 'superAdmin';

// //   // If phone is available, send OTP
// //   if (admin.phone || phone) {
// //     const phoneToUse = admin.phone || phone;
// //     const isOtpSent = await sendOtp(phoneToUse);

// //     if (!isOtpSent) {
// //       return next(new AppError('Failed to send OTP. Please try again.', 400));
// //     }

// //     console.log('SUCCESS: OTP sent to phone');
// //     console.log('='.repeat(60));
// //     console.log('');

// //     return res.status(200).json({
// //       success: true,
// //       message: 'Credentials validated. OTP sent to your phone.',
// //       data: {
// //         phone: phoneToUse,
// //         role: adminRole,
// //         nextStep: 'Verify OTP'
// //       }
// //     });
// //   }

// //   // If no phone, generate tokens directly using utils
// //   const accessToken = generateAccessToken(admin._id, adminRole, admin.tokenVersion);
// //   const refreshToken = generateRefreshToken(admin._id, adminRole, admin.tokenVersion);

// //   admin.refreshToken = refreshToken;
// //   await admin.save({ validateBeforeSave: false });

// //   const tokens = setAuthCookies(res, accessToken, refreshToken);

// //   // Remove password from output
// //   admin.password = undefined;
// //   admin.tokenVersion = undefined;

// //   console.log('SUCCESS: Tokens generated (no OTP required)');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'Login successful',
// //     data: {
// //       accessToken: tokens.accessToken,
// //       refreshToken: tokens.refreshToken,
// //       admin: {
// //         id: admin._id,
// //         email: admin.email,
// //         firstName: admin.firstName,
// //         lastName: admin.lastName,
// //         role: admin.role
// //       },
// //       role: adminRole
// //     }
// //   });
// // });

// // // ============================================
// // // VERIFY LOGIN OTP
// // // ============================================

// // exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
// //   const { phone, otp, email } = req.body;

// //   if (!phone || !otp) {
// //     return next(new AppError('Phone number and OTP are required', 400));
// //   }

// //   console.log('');
// //   console.log('ADMIN LOGIN - STEP 2: Verify OTP');
// //   console.log('='.repeat(60));
// //   console.log(`Phone: ${phone}`);

// //   // Verify OTP
// //   const otpDoc = await Otp.findOne({ phone });

// //   if (
// //     !otpDoc ||
// //     otpDoc.otp !== parseInt(otp) ||
// //     otpDoc.otpExpiresAt < new Date()
// //   ) {
// //     console.log('ERROR: Invalid or expired OTP');
// //     return next(new AppError('Invalid or expired OTP', 400));
// //   }

// //   // Find admin
// //   let admin;
// //   if (email) {
// //     admin = await Admin.findOne({ email: email.toLowerCase() }).select('+tokenVersion');
// //   } else {
// //     admin = await Admin.findOne({ phone }).select('+tokenVersion');
// //   }

// //   if (!admin) {
// //     return next(new AppError('Admin not found', 404));
// //   }

// //   if (!admin.isActive) {
// //     return next(
// //       new AppError('Your account has been deactivated.', 403)
// //     );
// //   }

// //   // Delete OTP
// //   await Otp.deleteOne({ phone });
// //   console.log('SUCCESS: OTP verified');

// //   // Get admin role (superAdmin or subAdmin)
// //   const adminRole = admin.role || 'superAdmin';

// //   // Generate tokens using utility functions - 3 separate parameters (like doctor)
// //   const accessToken = generateAccessToken(admin._id, adminRole, admin.tokenVersion);
// //   const refreshToken = generateRefreshToken(admin._id, adminRole, admin.tokenVersion);

// //   admin.refreshToken = refreshToken;
// //   await admin.save({ validateBeforeSave: false });

// //   const tokens = setAuthCookies(res, accessToken, refreshToken);

// //   console.log('SUCCESS: Tokens generated and cookies set');
// //   console.log('='.repeat(60));
// //   console.log('');

// //   res.status(200).json({
// //     success: true,
// //     message: 'OTP verified. Logged in successfully.',
// //     data: {
// //       accessToken: tokens.accessToken,
// //       refreshToken: tokens.refreshToken,
// //       admin: {
// //         id: admin._id,
// //         email: admin.email,
// //         firstName: admin.firstName,
// //         lastName: admin.lastName,
// //         phone: admin.phone,
// //         role: admin.role
// //       },
// //       role: adminRole
// //     }
// //   });
// // });

// // // ============================================
// // // RESEND LOGIN OTP
// // // ============================================

// // exports.resendLoginOtp = catchAsync(async (req, res, next) => {
// //   const { phone } = req.body;

// //   if (!phone) {
// //     return next(new AppError('Phone number is required', 400));
// //   }

// //   const admin = await Admin.findOne({ phone });

// //   if (!admin) {
// //     return next(new AppError('Admin not found. Please register first.', 404));
// //   }

// //   if (!admin.isActive) {
// //     return next(new AppError('Your account has been deactivated.', 403));
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
//   clearAuthCookies(res);

//   res.status(200).json({
//     success: true,
//     message: 'Logged out successfully'
//   });
// });

// // ============================================
// // LOGOUT ALL DEVICES
// // ============================================

// exports.logoutAllDevices = catchAsync(async (req, res, next) => {
//   const { phone, email } = req.body;

//   if (!phone && !email) {
//     return next(new AppError('Please provide phone number or email', 400));
//   }

//   let admin;
//   if (email) {
//     admin = await Admin.findOne({ email: email.toLowerCase() }).select('+tokenVersion');
//   } else {
//     admin = await Admin.findOne({ phone }).select('+tokenVersion');
//   }

//   if (!admin) {
//     return next(new AppError('Admin not found', 404));
//   }

//   // Increment tokenVersion to invalidate all tokens
//   admin.tokenVersion = (admin.tokenVersion || 0) + 1;
//   await admin.save({ validateBeforeSave: false });

//   clearAuthCookies(res);

//   res.status(200).json({
//     success: true,
//     message: 'Logged out from all devices successfully'
//   });
// });

// // ============================================
// // PROFILE MANAGEMENT
// // ============================================

// exports.getMyProfile = catchAsync(async (req, res, next) => {
//   const admin = await Admin.findById(req.user?._id || req.user?.id).select(
//     '-password -tokenVersion'
//   );

//   if (!admin) {
//     return next(new AppError('Admin not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: { admin }
//   });
// });

// exports.updateProfile = catchAsync(async (req, res, next) => {
//   const { password, tokenVersion, role, ...updateData } = req.body;

//   const updatedAdmin = await Admin.findByIdAndUpdate(
//     req.user?._id || req.user?.id,
//     updateData,
//     { new: true, runValidators: true }
//   ).select('-password -tokenVersion');

//   if (!updatedAdmin) {
//     return next(new AppError('Admin not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Profile updated successfully',
//     data: { admin: updatedAdmin }
//   });
// });

// // AUTHENTICATION STATUS

// exports.checkAuthStatus = catchAsync(async (req, res, next) => {
//   console.log('=== DEBUG: Admin checkAuthStatus ===');
//   console.log('Cookies:', req.cookies);

//   const { accessToken, refreshToken } = req.cookies || {};
//   console.log('Refresh token present:', !!refreshToken);

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
//       const decoded = verifyToken(accessToken, 'access');
//       console.log('Access token valid:', decoded.id);

//       const admin = await Admin.findById(decoded.id);

//       if (admin && (decoded.role === 'superAdmin' || decoded.role === 'subAdmin')) {
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
//             id: admin._id,
//             email: admin.email,
//             firstName: admin.firstName,
//             lastName: admin.lastName,
//             role: decoded.role
//           }
//         });
//       }
//     } catch (error) {
//       console.log('Access token verification failed:', error.message);
//     }
//   }

//   if (refreshToken && refreshToken !== 'undefined') {
//     try {
//       const decoded = verifyToken(refreshToken, 'refresh');
//       console.log('Refresh token valid:', decoded.id);

//       const admin = await Admin.findById(decoded.id).select('+tokenVersion');

//       if (admin) {
//         console.log('Token versions - Admin:', admin.tokenVersion, 'Decoded:', decoded.tokenVersion);
//       }

//       if (!admin || admin.tokenVersion !== decoded.tokenVersion ||
//           (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin')) {
//         return next(new AppError('Invalid refresh token - please login again', 401));
//       }

//       // Generate new access token using utils function
//       const adminRole = admin.role || decoded.role;
//       const newAccessToken = generateAccessToken(
//         admin._id,
//         adminRole,
//         admin.tokenVersion
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
//           id: admin._id,
//           email: admin.email,
//           firstName: admin.firstName,
//           lastName: admin.lastName,
//           role: adminRole
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
// // DOCTOR MANAGEMENT
// // ============================================

// exports.getAllDoctors = catchAsync(async (req, res, next) => {
//   const { page = 1, limit = 10, status } = req.query;
//   const skip = (page - 1) * limit;

//   const filter = {};
//   if (status) filter.verificationStatus = status;

//   const doctors = await Doctor.find(filter)
//     .select('-password -tokenVersion')
//     .skip(skip)
//     .limit(parseInt(limit))
//     .sort('-createdAt');

//   const total = await Doctor.countDocuments(filter);

//   res.status(200).json({
//     success: true,
//     results: doctors.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: { doctors }
//   });
// });

// exports.getDoctorById = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findById(req.params.id).select(
//     '-password -tokenVersion'
//   );

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: { doctor }
//   });
// });

// exports.approveDoctor = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findByIdAndUpdate(
//     req.params.id,
//     { verificationStatus: 'approved', isActive: true },
//     { new: true }
//   ).select('-password -tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Doctor approved successfully',
//     data: { doctor }
//   });
// });

// exports.rejectDoctor = catchAsync(async (req, res, next) => {
//   const { reason } = req.body;

//   const doctor = await Doctor.findByIdAndUpdate(
//     req.params.id,
//     { verificationStatus: 'rejected', rejectionReason: reason },
//     { new: true }
//   ).select('-password -tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Doctor rejected successfully',
//     data: { doctor }
//   });
// });

// exports.deleteDoctor = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findByIdAndDelete(req.params.id);

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Doctor deleted successfully',
//     data: null
//   });
// });

// // ============================================
// // PATIENT MANAGEMENT
// // ============================================

// exports.getAllPatients = catchAsync(async (req, res, next) => {
//   const { page = 1, limit = 10 } = req.query;
//   const skip = (page - 1) * limit;

//   const patients = await Patient.find()
//     .select('-password -tokenVersion')
//     .skip(skip)
//     .limit(parseInt(limit))
//     .sort('-createdAt');

//   const total = await Patient.countDocuments();

//   res.status(200).json({
//     success: true,
//     results: patients.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: { patients }
//   });
// });

// exports.getPatientById = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findById(req.params.id).select(
//     '-password -tokenVersion'
//   );

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     data: { patient }
//   });
// });

// exports.blockPatient = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findByIdAndUpdate(
//     req.params.id,
//     { isActive: false },
//     { new: true }
//   ).select('-password -tokenVersion');

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Patient blocked successfully',
//     data: { patient }
//   });
// });

// exports.deletePatient = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findByIdAndDelete(req.params.id);

//   if (!patient) {
//     return next(new AppError('Patient not found', 404));
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Patient deleted successfully',
//     data: null
//   });
// });

// // ============================================
// // DASHBOARD STATS
// // ============================================

// exports.getDashboardStats = catchAsync(async (req, res, next) => {
//   const totalDoctors = await Doctor.countDocuments({ isActive: true });
//   const totalPatients = await Patient.countDocuments({ isActive: true });
//   const pendingDoctors = await Doctor.countDocuments({
//     verificationStatus: 'pending'
//   });
//   const approvedDoctors = await Doctor.countDocuments({
//     verificationStatus: 'approved'
//   });

//   res.status(200).json({
//     success: true,
//     data: {
//       totalDoctors,
//       totalPatients,
//       pendingDoctors,
//       approvedDoctors
//     }
//   });
// });

// exports.getDoctorStats = catchAsync(async (req, res, next) => {
//   const stats = {
//     active: await Doctor.countDocuments({ isActive: true }),
//     inactive: await Doctor.countDocuments({ isActive: false }),
//     pending: await Doctor.countDocuments({ verificationStatus: 'pending' }),
//     approved: await Doctor.countDocuments({ verificationStatus: 'approved' }),
//     rejected: await Doctor.countDocuments({ verificationStatus: 'rejected' })
//   };

//   res.status(200).json({
//     success: true,
//     data: stats
//   });
// });

// controllers/adminController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Otp = require('../models/otpModel');
const { sendOtp } = require('../utils/otpUtils');
const bcrypt = require('bcryptjs');
const City = require('../models/availableCities'); 
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/tokenUtils");

const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// ============================================
// ADMIN SIGNUP - STEP 1: Create Account
// ============================================

exports.adminSignup = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role = "superAdmin",
  } = req.body;

  console.log("");
  console.log("ADMIN SIGNUP - STEP 1: Create Account");
  console.log("=".repeat(60));

  // Validation
  if (!email || !password || !firstName || !phone) {
    return next(
      new AppError("Email, password, first name, and phone are required", 400)
    );
  }

  // Validate role
  if (role !== "superAdmin" && role !== "subAdmin") {
    return next(new AppError("Invalid role", 400));
  }

  const emailLower = email.toLowerCase();

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({
    $or: [{ email: emailLower }, { phone }],
  });

  if (existingAdmin) {
    if (existingAdmin.email === emailLower) {
      return next(new AppError("Email already registered", 409));
    }
    if (existingAdmin.phone === phone) {
      return next(new AppError("Phone already registered", 409));
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin with isVerified: false (needs OTP)
  const newAdmin = new Admin({
    email: emailLower,
    password: hashedPassword,
    firstName,
    lastName: lastName || "",
    phone,
    role,
    isVerified: false, // ⭐ Not verified yet - OTP needed
    isActive: true,
    tokenVersion: 0,
  });

  await newAdmin.save();

  console.log(`✓ Admin created (unverified): ${emailLower}`);

  // Send OTP to phone
  const isOtpSent = await sendOtp(phone);

  if (!isOtpSent) {
    // Delete admin if OTP fails
    await Admin.findByIdAndDelete(newAdmin._id);
    console.log("❌ Failed to send OTP");
    return next(new AppError("Failed to send OTP. Please try again.", 400));
  }

  console.log(`✓ OTP sent to phone: ${phone}`);
  console.log("=".repeat(60));
  console.log("");

  res.status(201).json({
    success: true,
    message: "Admin registered. OTP sent to your phone.",
    data: {
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        phone: newAdmin.phone,
        role: newAdmin.role,
      },
      nextStep: "Verify OTP sent to your phone",
    },
  });
});

// ============================================
// ADMIN SIGNUP - STEP 2: Verify OTP
// ============================================

exports.verifySignupOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  console.log("");
  console.log("ADMIN SIGNUP - STEP 2: Verify OTP");
  console.log("=".repeat(60));

  if (!phone || !otp) {
    return next(new AppError("Phone and OTP required", 400));
  }

  console.log(`Phone: ${phone}`);

  // Verify OTP from database
  const otpDoc = await Otp.findOne({ phone });

  if (!otpDoc) {
    console.log("❌ OTP not found");
    return next(new AppError("OTP not found. Request new one.", 400));
  }

  // Check if expired
  if (otpDoc.otpExpiresAt < new Date()) {
    console.log("❌ OTP expired");
    await Otp.deleteOne({ phone });
    return next(new AppError("OTP expired. Request new one.", 400));
  }

  // Check if matches
  if (otpDoc.otp !== parseInt(otp)) {
    console.log("❌ Invalid OTP");
    return next(new AppError("Invalid OTP. Try again.", 400));
  }

  console.log("✓ OTP verified");

  // Find admin
  const admin = await Admin.findOne({ phone });

  if (!admin) {
    console.log("❌ Admin not found");
    return next(new AppError("Admin not found", 404));
  }

  // Mark as verified
  admin.isVerified = true;
  await admin.save({ validateBeforeSave: false });

  console.log(`✓ Admin verified: ${admin.email}`);

  // Delete OTP
  await Otp.deleteOne({ phone });

  console.log("=".repeat(60));
  console.log("");

  res.status(200).json({
    success: true,
    message: "Phone verified! Your account is active. You can now login.",
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        phone: admin.phone,
        role: admin.role,
        isVerified: true,
      },
      nextStep: "Login with email and password",
    },
  });
});

// ============================================
// ADMIN LOGIN - Email + Password Only (NO OTP)
// ============================================

exports.adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  console.log("");
  console.log("ADMIN LOGIN");
  console.log("=".repeat(60));

  if (!email || !password) {
    return next(new AppError("Email and password required", 400));
  }

  const emailLower = email.toLowerCase();
  console.log(`Email: ${emailLower}`);

  // Get admin with password
  const admin = await Admin.findOne({ email: emailLower }).select(
    "+password +tokenVersion +isVerified +isActive"
  );

  if (!admin) {
    console.log("❌ Admin not found");
    return next(new AppError("Invalid email or password", 401));
  }

  // Check if verified
  if (!admin.isVerified) {
    console.log("❌ Admin not verified");
    return next(new AppError("Please verify your phone via OTP first", 403));
  }

  // Check if active
  if (!admin.isActive) {
    console.log("❌ Admin inactive");
    return next(new AppError("Admin account disabled", 403));
  }

  // Compare password
  const isPasswordCorrect = await bcrypt.compare(password, admin.password);

  if (!isPasswordCorrect) {
    console.log("❌ Password mismatch");
    return next(new AppError("Invalid email or password", 401));
  }

  console.log("✓ Credentials valid");

  // Generate tokens
  const adminRole = admin.role || "superAdmin";
  const accessToken = generateAccessToken(
    admin._id,
    adminRole,
    admin.tokenVersion
  );
  const refreshToken = generateRefreshToken(
    admin._id,
    adminRole,
    admin.tokenVersion
  );

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  const tokens = setAuthCookies(res, accessToken, refreshToken);

  console.log("✓ Login successful");
  console.log("=".repeat(60));
  console.log("");

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        role: admin.role,
      },
    },
  });
});

// ============================================
// LOGOUT
// ============================================

exports.logout = catchAsync(async (req, res, next) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// ============================================
// LOGOUT ALL DEVICES
// ============================================

exports.logoutAllDevices = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email required", 400));
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
    "+tokenVersion"
  );

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save({ validateBeforeSave: false });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
});

// ============================================
// GET PROFILE
// ============================================

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.user?.id || req.user?._id).select(
    "-password -tokenVersion"
  );

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { admin },
  });
});

// ============================================
// UPDATE PROFILE
// ============================================

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { password, tokenVersion, role, ...updateData } = req.body;

  const updatedAdmin = await Admin.findByIdAndUpdate(
    req.user?.id || req.user?._id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password -tokenVersion");

  if (!updatedAdmin) {
    return next(new AppError("Admin not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: { admin: updatedAdmin },
  });
});

// ============================================
// CHECK AUTH STATUS
// ============================================

exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies || {};

  if (!refreshToken || refreshToken === "undefined") {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
    });
  }

  // Try access token
  if (accessToken && accessToken !== "undefined") {
    try {
      const decoded = verifyToken(accessToken, "access");
      const admin = await Admin.findById(decoded.id);

      if (
        admin &&
        (decoded.role === "superAdmin" || decoded.role === "subAdmin")
      ) {
        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            role: decoded.role,
          },
        });
      }
    } catch (error) {
      console.log("Access token expired");
    }
  }

  // Try refresh token
  if (refreshToken && refreshToken !== "undefined") {
    try {
      const decoded = verifyToken(refreshToken, "refresh");
      const admin = await Admin.findById(decoded.id).select("+tokenVersion");

      if (!admin || admin.tokenVersion !== decoded.tokenVersion) {
        return res.status(200).json({
          success: true,
          isAuthenticated: false,
        });
      }

      const adminRole = admin.role || decoded.role;
      const newAccessToken = generateAccessToken(
        admin._id,
        adminRole,
        admin.tokenVersion
      );

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        data: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          role: adminRole,
        },
      });
    } catch (error) {
      console.log("Refresh token expired");
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
      });
    }
  }

  return res.status(200).json({
    success: true,
    isAuthenticated: false,
  });
});

// ============================================
// DOCTOR MANAGEMENT
// ============================================

exports.createDoctor = catchAsync(async (req, res, next) => {
  console.log("req.body", req.body);

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
  } = req.body;

  if (
    !firstName ||
    !email ||
    !phone ||
    !medicalRegistrationNumber ||
    !issuingMedicalCouncil ||
    !specialization
  ) {
    return next(
      new AppError(
        "Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization",
        400
      )
    );
  }

  console.log(`Phone: ${phone}`);
  console.log(`Email: ${email}`);
  console.log(`FirstName: ${firstName}`);

  const existingDoctor = await Doctor.findOne({
    $or: [{ email }, { phone }, { medicalRegistrationNumber }],
  });

  if (existingDoctor) {
    if (existingDoctor.email === email) {
      return next(new AppError("Doctor with this email already exists", 400));
    }
    if (existingDoctor.phone === phone) {
      return next(
        new AppError("Doctor with this phone number already exists", 400)
      );
    }
    if (
      existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber
    ) {
      return next(
        new AppError("Doctor with this registration number already exists", 400)
      );
    }
  }

  const newDoctor = new Doctor({
    firstName,
    lastName: lastName || "",
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
    verificationStatus: "pending",
    tokenVersion: 0,
  });

  await newDoctor.save();

  res.status(201).json({
    success: true,
    message: "Doctor created successfully.",
    data: {
      doctor: {
        id: newDoctor._id,
        firstName: newDoctor.firstName,
        email: newDoctor.email,
        phone: newDoctor.phone,
        medicalRegistrationNumber: newDoctor.medicalRegistrationNumber,
      },
    },
  });
});

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.verificationStatus = status;

  const doctors = await Doctor.find(filter)
    .select("-password -tokenVersion")
    .skip(skip)
    .limit(parseInt(limit))
    .sort("-createdAt");

  const total = await Doctor.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { doctors },
  });
});

exports.getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select(
    "-password -tokenVersion"
  );

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { doctor },
  });
});

exports.approveDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: "approved", isActive: true },
    { new: true }
  ).select("-password -tokenVersion");

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Doctor approved",
    data: { doctor },
  });
});

exports.rejectDoctor = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: "rejected", rejectionReason: reason },
    { new: true }
  ).select("-password -tokenVersion");

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Doctor rejected",
    data: { doctor },
  });
});

exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Doctor deleted",
  });
});

// ============================================
// PATIENT MANAGEMENT
// ============================================

exports.createPatient = catchAsync(async (req, res, next) => {
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
  } = req.body;

  console.log("");
  console.log("PATIENT CREATION");
  console.log("=".repeat(60));

  // Validate required fields
  if (!firstName || !email || !phone || !password) {
    return next(
      new AppError(
        "Please provide all required fields: firstName, email, phone, password",
        400
      )
    );
  }

  console.log(`First Name: ${firstName}`);
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone}`);
  console.log(`Gender: ${gender || "Not provided"}`);
  console.log(`Blood Group: ${bloodGroup || "Not provided"}`);

  // Validate phone number format
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return next(
      new AppError("Phone number must be a valid 10-digit Indian number", 400)
    );
  }

  // Check if patient already exists
  const existingPatient = await Patient.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingPatient) {
    if (existingPatient.email === email) {
      return next(new AppError("Patient with this email already exists", 400));
    }
    if (existingPatient.phone === phone) {
      return next(
        new AppError("Patient with this phone number already exists", 400)
      );
    }
  }

  // Create verified & active patient directly
  const newPatient = await Patient.create({
    firstName,
    email,
    phone,
    password,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    address: address || null,
    bloodGroup: bloodGroup || null,
    emergencyContact: emergencyContact || {
      name: null,
      phone: null,
      relationship: null,
    },
    isVerified: true,
    isActive: true,
    tokenVersion: 0,
  });

  console.log("SUCCESS: Patient created in database");
  console.log("=".repeat(60));
  console.log("");

  res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: {
      id: newPatient._id,
      firstName: newPatient.firstName,
      email: newPatient.email,
      phone: newPatient.phone,
    },
  });
});

exports.exportPatients = catchAsync(async (req, res, next) => {
  const { from, to, format = "csv", gender, bloodGroup, isActive } = req.query;

  // ----------------------------
  // 🧠 Build dynamic filter
  // ----------------------------
  const query = {};
  if (from || to) {
    query.createdAt = {};
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (gender) query.gender = gender;
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (isActive !== undefined) query.isActive = isActive === "true";

  // ----------------------------
  // 📋 Select fields to export
  // ----------------------------
  const fields = [
    "firstName",
    "email",
    "phone",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "address.city",
    "address.state",
    "address.country",
    "emergencyContact.name",
    "emergencyContact.phone",
    "emergencyContact.relation",
    "isActive",
    "createdAt",
  ];

  const patients = await Patient.find(query).lean();

  if (!patients.length) {
    return res.status(404).json({ message: "No patients found" });
  }

  // ----------------------------
  // 📤 EXPORT AS CSV
  // ----------------------------
  if (format === "csv") {
    // Flatten nested fields for CSV export
    const flatPatients = patients.map((p) => ({
      firstName: p.firstName || "—",
      email: p.email || "—",
      phone: p.phone || "—",
      dateOfBirth: p.dateOfBirth
        ? new Date(p.dateOfBirth).toLocaleDateString()
        : "—",
      gender: p.gender || "—",
      bloodGroup: p.bloodGroup || "—",
      city: p.address?.city || "—",
      state: p.address?.state || "—",
      country: p.address?.country || "—",
      emergencyName: p.emergencyContact?.name || "—",
      emergencyPhone: p.emergencyContact?.phone || "—",
      emergencyRelation: p.emergencyContact?.relation || "—",
      isActive: p.isActive ? "Active" : "Inactive",
      createdAt: new Date(p.createdAt).toLocaleString(),
    }));

    const csvFields = [
      "firstName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "city",
      "state",
      "country",
      "emergencyName",
      "emergencyPhone",
      "emergencyRelation",
      "isActive",
      "createdAt",
    ];

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(flatPatients);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=patients.csv");
    res.write("\uFEFF"); // Add UTF-8 BOM
    return res.end(csv);
  }

  // ----------------------------
  // 📄 EXPORT AS PDF
  // ----------------------------
 if (format === "pdf") {
   const doc = new PDFDocument({ margin: 40, size: "A4" });
   const fileName = "patients.pdf";

   res.setHeader("Content-Type", "application/pdf");
   res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
   doc.pipe(res);

   // ----------------------------
   // 🏷️ Title
   // ----------------------------
   doc
     .fontSize(20)
     .font("Helvetica-Bold")
     .text("Patient Records Report", { align: "center" });
   doc.moveDown(1);
   doc
     .fontSize(12)
     .font("Helvetica")
     .text(`Total Patients: ${patients.length}`);
   doc.moveDown(1.5);

   // ----------------------------
   // 🧾 Table Header
   // ----------------------------
   const headers = [
     "Name",
     "Email",
     "Phone",
     "DOB",
     "Gender",
     "Blood",
     "City",
   ];
   const colWidths = [70, 160, 70, 60, 55, 45, 60, 75, 55];
   const startX = 40;
   let y = doc.y;

   // Draw header background
   doc
     .rect(startX - 5, y - 2, 520, 20)
     .fill("#f0f0f0")
     .stroke();
   doc.fillColor("black").font("Helvetica-Bold");

   let x = startX;
   headers.forEach((header, i) => {
     doc.text(header, x, y, { width: colWidths[i], align: "left" });
     x += colWidths[i];
   });

   y += 22;
   doc
     .moveTo(startX - 5, y - 5)
     .lineTo(560, y - 5)
     .stroke();

   // ----------------------------
   // 📋 Table Rows
   // ----------------------------
   doc.font("Helvetica").fontSize(10);
   patients.forEach((p, index) => {
     const row = [
       p.firstName || "-",
       p.email || "-",
       p.phone || "-",
       p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : "-",
       p.gender || "-",
       p.bloodGroup || "-",
       p.address?.city || "-",
     ];

     // Alternate row color
     if (index % 2 === 0) {
       doc
         .rect(startX - 5, y - 2, 520, 18)
         .fill("#fafafa")
         .stroke();
       doc.fillColor("black");
     }

     let x = startX;
     row.forEach((cell, i) => {
       doc.text(String(cell), x, y, { width: colWidths[i], align: "left" });
       x += colWidths[i];
     });

     y += 18;
     if (y > 750) {
       doc.addPage();
       y = 50;
     }
   });

   // ----------------------------
   // ✅ End PDF
   // ----------------------------
   doc.end();
   return;
 }


  // ----------------------------
  // ❌ Unsupported format
  // ----------------------------
  return res.status(400).json({
    message: "Invalid format. Use ?format=csv or ?format=pdf",
  });
});

exports.getAllPatients = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    searchQuery = "",
    gender,
    bloodGroup,
    isActive,
  } = req.query;

  console.log(" req.query", req.query);

  const skip = (page - 1) * limit;

  // Build dynamic filter
  const filter = {};

  // 🔍 Search by name, email, or phone
  if (searchQuery) {
    filter.$or = [
      { firstName: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
      { phone: { $regex: searchQuery, $options: "i" } },
    ];
  }

  // 🧩 Filter by gender
  if (gender) {
    filter.gender = gender;
  }

  // 🩸 Filter by blood group
  if (bloodGroup) {
    filter.bloodGroup = bloodGroup;
  }

  // ⚙️ Filter by active status
  console.log(
    `typeof isActive !== "undefined"`,
    typeof isActive !== "undefined"
  );

  if (isActive !== "null") {
    filter.isActive = isActive === "true"; // convert string → boolean
  }

  // Fetch patients with filters
  const patients = await Patient.find(filter)
    .select("-password -tokenVersion")
    .skip(skip)
    .limit(parseInt(limit))
    .sort("-createdAt");

  const total = await Patient.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: patients.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalRecords: total,
    filtersUsed: filter,
    data: { patients },
  });
});

exports.getPatientById = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id).select(
    "-password -tokenVersion"
  );

  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { patient },
  });
});

exports.blockPatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select("-password -tokenVersion");

  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Patient blocked",
    data: { patient },
  });
});

exports.deletePatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Patient deleted",
  });
});

// ============================================
// DASHBOARD STATS
// ============================================

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const totalPatients = await Patient.countDocuments({ isActive: true });
  const pendingDoctors = await Doctor.countDocuments({
    verificationStatus: "pending",
  });
  const approvedDoctors = await Doctor.countDocuments({
    verificationStatus: "approved",
  });

  res.status(200).json({
    success: true,
    data: {
      totalDoctors,
      totalPatients,
      pendingDoctors,
      approvedDoctors,
    },
  });
});

exports.getDoctorStats = catchAsync(async (req, res, next) => {
  const stats = {
    active: await Doctor.countDocuments({ isActive: true }),
    inactive: await Doctor.countDocuments({ isActive: false }),
    pending: await Doctor.countDocuments({ verificationStatus: "pending" }),
    approved: await Doctor.countDocuments({ verificationStatus: "approved" }),
    rejected: await Doctor.countDocuments({ verificationStatus: "rejected" }),
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});




//added doctor city 
exports.addDoctorToCities = catchAsync(async (req, res, next) => {
  const { doctorId, cityIds } = req.body;

  console.log('');
  console.log('ADMIN: ADD DOCTOR TO CITIES');
  console.log('='.repeat(60));
  console.log(`Doctor ID: ${doctorId}`);
  console.log(`Cities count: ${cityIds?.length || 0}`);

  // Validate input
  if (!doctorId) {
    return next(new AppError('Doctor ID is required', 400));
  }

  if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
    return next(
      new AppError(
        'Please provide an array of cityIds with at least one city',
        400
      )
    );
  }

  // Validate MongoDB ObjectId format
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  for (const cityId of cityIds) {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return next(
        new AppError(`Invalid city ID format: ${cityId}`, 400)
      );
    }
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  console.log(`Doctor: ${doctor.firstName} ${doctor.lastName || ''}`);

  // Verify all cities exist
  const cities = await City.find({ _id: { $in: cityIds } });

  if (cities.length !== cityIds.length) {
    const foundCityIds = cities.map(c => c._id.toString());
    const missingCityIds = cityIds.filter(
      id => !foundCityIds.includes(id.toString())
    );
    return next(
      new AppError(
        `Some cities not found: ${missingCityIds.join(', ')}`,
        404
      )
    );
  }

  console.log('SUCCESS: All cities verified');

  // Add cities to doctor (avoid duplicates)
  const existingCityIds = doctor.cities.map(id => id.toString());
  const newCityIds = cityIds.filter(
    id => !existingCityIds.includes(id.toString())
  );

  const duplicateCityIds = cityIds.filter(
    id => existingCityIds.includes(id.toString())
  );

  if (newCityIds.length === 0) {
    console.log('INFO: Doctor already added to all these cities');
    return res.status(200).json({
      success: true,
      message: 'Doctor is already associated with all these cities',
      alreadyAdded: duplicateCityIds.length,
      newlyAdded: 0,
      data: {
        doctor: {
          id: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          email: doctor.email,
          phone: doctor.phone,
          totalCities: doctor.cities.length
        }
      }
    });
  }

  doctor.cities.push(...newCityIds);
  await doctor.save();

  console.log(`SUCCESS: Doctor added to ${newCityIds.length} new cities`);
  if (duplicateCityIds.length > 0) {
    console.log(`INFO: ${duplicateCityIds.length} cities were already associated`);
  }
  console.log('='.repeat(60));
  console.log('');

  // Populate city details before response
  await doctor.populate('cities', 'name latitude longitude');

  res.status(200).json({
    success: true,
    message: `Doctor added to ${newCityIds.length} cities successfully${
      duplicateCityIds.length > 0
        ? ` (${duplicateCityIds.length} already associated)`
        : ''
    }`,
    newlyAdded: newCityIds.length,
    alreadyAdded: duplicateCityIds.length,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        medicalRegistrationNumber: doctor.medicalRegistrationNumber,
        specialization: doctor.specialization,
        cities: doctor.cities,
        totalCities: doctor.cities.length
      }
    }
  });
});

// ============================================
// ADMIN: REMOVE DOCTOR FROM CITIES
// ============================================

exports.removeDoctorFromCities = catchAsync(async (req, res, next) => {
  const { doctorId, cityIds } = req.body;

  console.log('');
  console.log('ADMIN: REMOVE DOCTOR FROM CITIES');
  console.log('='.repeat(60));

  if (!doctorId) {
    return next(new AppError('Doctor ID is required', 400));
  }

  if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
    return next(
      new AppError(
        'Please provide an array of cityIds with at least one city',
        400
      )
    );
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const initialCount = doctor.cities.length;
  doctor.cities = doctor.cities.filter(
    id => !cityIds.includes(id.toString())
  );

  const removedCount = initialCount - doctor.cities.length;

  await doctor.save();
  await doctor.populate('cities', 'name latitude longitude');

  console.log(`SUCCESS: Removed doctor from ${removedCount} cities`);
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: `Doctor removed from ${removedCount} cities successfully`,
    removedCount,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        cities: doctor.cities,
        totalCities: doctor.cities.length
      }
    }
  });
});

// ============================================
// ADMIN: UPDATE DOCTOR CITIES (REPLACE ALL)
// ============================================

exports.updateDoctorCities = catchAsync(async (req, res, next) => {
  const { doctorId, cityIds } = req.body;

  console.log('');
  console.log('ADMIN: UPDATE DOCTOR CITIES (REPLACE ALL)');
  console.log('='.repeat(60));

  if (!doctorId) {
    return next(new AppError('Doctor ID is required', 400));
  }

  if (!cityIds || !Array.isArray(cityIds)) {
    return next(new AppError('Please provide an array of cityIds', 400));
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Verify all cities exist (if cityIds is not empty)
  if (cityIds.length > 0) {
    const cities = await City.find({ _id: { $in: cityIds } });

    if (cities.length !== cityIds.length) {
      const foundCityIds = cities.map(c => c._id.toString());
      const missingCityIds = cityIds.filter(
        id => !foundCityIds.includes(id.toString())
      );
      return next(
        new AppError(
          `Some cities not found: ${missingCityIds.join(', ')}`,
          404
        )
      );
    }
  }

  const previousCount = doctor.cities.length;
  doctor.cities = cityIds;
  await doctor.save();
  await doctor.populate('cities', 'name latitude longitude');

  console.log(`SUCCESS: Doctor cities updated from ${previousCount} to ${cityIds.length}`);
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: `Doctor cities updated successfully`,
    previousCitiesCount: previousCount,
    newCitiesCount: cityIds.length,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        cities: doctor.cities,
        totalCities: doctor.cities.length
      }
    }
  });
});

// ============================================
// ADMIN: GET DOCTOR'S CITIES
// ============================================

exports.getDoctorCities = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  if (!doctorId) {
    return next(new AppError('Doctor ID is required', 400));
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError('Invalid doctor ID format', 400));
  }

  const doctor = await Doctor.findById(doctorId).populate(
    'cities',
    'name latitude longitude'
  );

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone
      },
      cities: doctor.cities,
      totalCities: doctor.cities.length
    }
  });
});

// ============================================
// ADMIN: GET ALL DOCTORS WITH CITY FILTER
// ============================================

exports.getDoctorsByCity = catchAsync(async (req, res, next) => {
  const { cityId, page = 1, limit = 10 } = req.query;

  if (!cityId) {
    return next(new AppError('City ID is required', 400));
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    return next(new AppError('Invalid city ID format', 400));
  }

  // Check if city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new AppError('City not found', 404));
  }

  const skip = (page - 1) * limit;

  const doctors = await Doctor.find({ cities: cityId })
    .select('-password -tokenVersion -verificationDocuments')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('cities', 'name')
    .sort('-createdAt');

  const total = await Doctor.countDocuments({ cities: cityId });

  res.status(200).json({
    success: true,
    city: {
      id: city._id,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude
    },
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalDoctors: total,
    data: { doctors }
  });
});









module.exports = exports;
