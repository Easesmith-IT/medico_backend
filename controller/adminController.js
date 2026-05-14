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

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Admin = require("../models/adminModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const PatientAddress = require("../models/patientAddressModel");
const Otp = require("../models/otpModel");
const { sendOtp } = require("../utils/otpUtils");
const bcrypt = require("bcryptjs");
const City = require("../models/availableCities");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/tokenUtils");
const Booking = require("../models/bookingModel");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const Service = require("../models/serviceModel");
const Treatment = require("../models/treatmentModel");
const ServiceProvider = require("../models/serviceProviderModel");
const { formatDuration } = require("../utils/timeFormat");
const mongoose = require("mongoose");
const {
  createOrUpdateAdminSession,
  revokeSessionByRefreshToken,
  revokeAllAdminSessions,
  resolveRequestRefreshToken,
} = require("../utils/adminSessionService");
const { writeAdminAuditLog } = require("../utils/adminAuditLogger");

const normalizeRole = (role = "") =>
  String(role || "")
    .toLowerCase()
    .replace(/[_\s]/g, "");

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
  if (String(otpDoc.otp) !== String(otp)) {
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
  await createOrUpdateAdminSession({
    adminId: admin._id,
    refreshToken: tokens.refreshToken,
    req,
  });

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.auth.login",
    module: "auth",
    severity: "MEDIUM",
  });

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
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions || [],
        status: admin.status,
        isActive: admin.isActive,
      },
    },
  });
});

// ============================================
// LOGOUT
// ============================================

exports.logout = catchAsync(async (req, res, next) => {
  const refreshToken = resolveRequestRefreshToken(req);
  await revokeSessionByRefreshToken(refreshToken);
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
  await revokeAllAdminSessions(admin._id);

  await writeAdminAuditLog({
    req,
    actorAdminId: req.user?.id || null,
    actorEmail: email.toLowerCase(),
    targetAdminId: admin._id,
    action: "admin.auth.logout-all-devices",
    module: "auth",
    severity: "HIGH",
  });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
});

// GET /api/admin/subadmins
exports.getSubAdmins = catchAsync(async (req, res, next) => {
  let { status, isActive, search, page = 1, limit = 20 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = { role: "subAdmin" };

  // Status filter
  if (status) filter.status = status;

  // isActive filter
  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }

  // Search filter: name, email, phone
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const skip = (page - 1) * limit;

  const subAdmins = await Admin.find(filter)
    .select(
      "firstName lastName email phone role status isActive createdAt permissions"
    )
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const count = await Admin.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: subAdmins.length,
    pagination: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
    data: subAdmins,
  });
});

const buildAdminPayload = (adminDoc) => ({
  _id: adminDoc._id,
  firstName: adminDoc.firstName,
  lastName: adminDoc.lastName,
  email: adminDoc.email,
  phone: adminDoc.phone,
  role: adminDoc.role,
  status: adminDoc.status,
  isActive: adminDoc.isActive,
  permissions: adminDoc.permissions || [],
  createdAt: adminDoc.createdAt,
  updatedAt: adminDoc.updatedAt,
});

const ensureNoSelfTarget = (requesterId, targetId, next) => {
  if (String(requesterId || "") === String(targetId || "")) {
    return next(new AppError("You cannot perform this action on your own account", 403));
  }
  return null;
};

const assertSuperAdminInvariant = async (targetRole, updatedRole, targetStatus, next) => {
  const currentRole = normalizeRole(targetRole);
  const nextRole = normalizeRole(updatedRole || targetRole);
  const willDeactivate = String(targetStatus || "").toLowerCase() === "inactive";

  if (currentRole === "superadmin" && (nextRole !== "superadmin" || willDeactivate)) {
    const activeSuperAdminCount = await Admin.countDocuments({
      role: "superAdmin",
      status: "active",
      isActive: true,
    });

    if (activeSuperAdminCount <= 1) {
      return next(
        new AppError("Cannot deactivate or demote the last active superAdmin", 400)
      );
    }
  }

  return null;
};

// GET /api/admin/subadmins/:id
exports.getSubAdminById = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.params.id).select(
    "firstName lastName email phone role status isActive permissions createdAt updatedAt"
  );

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: buildAdminPayload(admin),
  });
});

// PATCH /api/admin/subadmins/:id
exports.updateSubAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const admin = await Admin.findById(id).select(
    "firstName lastName email phone role status isActive permissions password"
  );
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  const selfError = ensureNoSelfTarget(req.user?.id || req.user?._id, admin._id, next);
  if (selfError) return;

  const allowedFields = new Set([
    "firstName",
    "lastName",
    "email",
    "phone",
    "role",
    "permissions",
    "status",
    "password",
  ]);

  Object.keys(req.body || {}).forEach((field) => {
    if (!allowedFields.has(field)) {
      delete req.body[field];
    }
  });

  if (req.body.role && !["superAdmin", "subAdmin"].includes(req.body.role)) {
    return next(new AppError("Invalid role. Must be superAdmin or subAdmin", 400));
  }

  if (req.body.status && !["active", "inactive"].includes(req.body.status)) {
    return next(new AppError("Invalid status. Must be active or inactive", 400));
  }

  if (req.body.email) {
    const duplicateByEmail = await Admin.findOne({
      _id: { $ne: admin._id },
      email: String(req.body.email).toLowerCase(),
    }).select("_id");
    if (duplicateByEmail) {
      return next(new AppError("Email already in use by another admin", 409));
    }
    admin.email = String(req.body.email).toLowerCase();
  }

  if (req.body.phone) {
    const duplicateByPhone = await Admin.findOne({
      _id: { $ne: admin._id },
      phone: String(req.body.phone),
    }).select("_id");
    if (duplicateByPhone) {
      return next(new AppError("Phone already in use by another admin", 409));
    }
    admin.phone = String(req.body.phone);
  }

  if (req.body.firstName !== undefined) admin.firstName = req.body.firstName;
  if (req.body.lastName !== undefined) admin.lastName = req.body.lastName;

  const originalRole = admin.role;

  if (req.body.permissions !== undefined) {
    admin.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  }

  const invariantError = await assertSuperAdminInvariant(
    originalRole,
    req.body.role,
    req.body.status,
    next
  );
  if (invariantError) return;

  if (req.body.role !== undefined) {
    admin.role = req.body.role;
  }

  if (req.body.status !== undefined) {
    admin.status = req.body.status;
    admin.isActive = req.body.status === "active";
  }

  if (req.body.password) {
    admin.password = await bcrypt.hash(req.body.password, 10);
  }

  await admin.save();

  await writeAdminAuditLog({
    req,
    actorAdminId: req.user?.id || null,
    actorEmail: req.user?.email || "",
    targetAdminId: admin._id,
    action: "admin.subadmin.update",
    severity: "HIGH",
    metadata: {
      updatedFields: Object.keys(req.body || {}),
      status: admin.status,
      role: admin.role,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Admin updated successfully",
    data: buildAdminPayload(admin),
  });
});

// DELETE /api/admin/subadmins/:id
exports.deleteSubAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const admin = await Admin.findById(id).select(
    "firstName lastName email phone role status isActive permissions tokenVersion"
  );
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  const selfError = ensureNoSelfTarget(req.user?.id || req.user?._id, admin._id, next);
  if (selfError) return;

  const invariantError = await assertSuperAdminInvariant(admin.role, admin.role, "inactive", next);
  if (invariantError) return;

  admin.status = "inactive";
  admin.isActive = false;
  admin.permissions = [];
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save({ validateBeforeSave: false });
  await revokeAllAdminSessions(admin._id);

  await writeAdminAuditLog({
    req,
    actorAdminId: req.user?.id || null,
    actorEmail: req.user?.email || "",
    targetAdminId: admin._id,
    action: "admin.subadmin.delete",
    severity: "CRITICAL",
    metadata: { status: admin.status },
  });

  res.status(200).json({
    status: "success",
    message: "Admin deleted successfully",
    data: buildAdminPayload(admin),
  });
});

// PATCH /api/admin/subadmins/:id/toggle-status
exports.toggleSubAdminStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // -----------------------
  // Fetch admin
  // -----------------------
  const admin = await Admin.findById(id);

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  const selfError = ensureNoSelfTarget(req.user?.id || req.user?._id, admin._id, next);
  if (selfError) return;

  // -----------------------
  // Toggle status
  // -----------------------
  const nextStatus = admin.status === "active" ? "inactive" : "active";
  const invariantError = await assertSuperAdminInvariant(
    admin.role,
    admin.role,
    nextStatus,
    next
  );
  if (invariantError) return;

  admin.status = nextStatus;
  admin.isActive = admin.status === "active";

  await admin.save();

  await writeAdminAuditLog({
    req,
    actorAdminId: req.user?.id || null,
    actorEmail: req.user?.email || "",
    targetAdminId: admin._id,
    action: "admin.subadmin.toggle-status",
    severity: "HIGH",
    metadata: { status: admin.status },
  });

  res.status(200).json({
    status: "success",
    message: `Subadmin status updated to ${admin.status}`,
    data: {
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      status: admin.status,
      isActive: admin.isActive,
    },
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
      const admin = await Admin.findById(decoded.id).select(
        "email firstName lastName role permissions status isActive"
      );
      const normalizedTokenRole = normalizeRole(decoded.role);

      if (
        admin &&
        (normalizedTokenRole === "superadmin" ||
          normalizedTokenRole === "subadmin")
      ) {
        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role || decoded.role,
            permissions: admin.permissions || [],
            status: admin.status,
            isActive: admin.isActive,
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
      const admin = await Admin.findById(decoded.id).select(
        "+tokenVersion email firstName lastName role permissions status isActive"
      );

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
          lastName: admin.lastName,
          role: adminRole,
          permissions: admin.permissions || [],
          status: admin.status,
          isActive: admin.isActive,
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

  console.log("doctors", doctors);

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
    res.setHeader("Content-Disposition", "attachment; filename=PATIENTS.csv");
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

exports.exportAppointments = catchAsync(async (req, res, next) => {
  const { from, to, format = "csv" } = req.query;

  // ----------------------------
  // 🧠 Dynamic Filter (ONLY DATE)
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

  // ----------------------------
  // 📦 Fetch with populated fields
  // ----------------------------
  const appointments = await Booking.find(query)
    .populate("patientId", "firstName lastName phone email")
    .populate("serviceId", "name basePrice")
    .populate("servicePartnerId", "firstName lastName")
    .lean();

  if (!appointments.length) {
    return res.status(404).json({ message: "No appointments found" });
  }

  // ----------------------------
  // 📤 EXPORT AS CSV
  // ----------------------------
  if (format === "csv") {
    const flat = appointments.map((a) => ({
      patientName: `${a.patientId?.firstName || ""} ${
        a.patientId?.lastName || ""
      }`,
      patientPhone: a.patientId?.phone || "—",
      serviceName: a.serviceId?.name || "—",
      partnerName: a.servicePartnerId
        ? `${a.servicePartnerId.firstName} ${a.servicePartnerId.lastName}`
        : "—",
      appointmentDate: new Date(a.appointmentDate).toLocaleDateString(),
      slot: `${a.slotTime?.startTime} - ${a.slotTime?.endTime}`,
      status: a.status,
      totalAmount: a.pricing?.totalAmount || "—",
      createdAt: new Date(a.createdAt).toLocaleString(),
    }));

    const csvFields = [
      "patientName",
      "patientPhone",
      "serviceName",
      "partnerName",
      "appointmentDate",
      "slot",
      "status",
      "totalAmount",
      "createdAt",
    ];

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(flat);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=APPOINTMENTS.csv"
    );
    res.write("\uFEFF");
    return res.end(csv);
  }

  // ----------------------------
  // 📄 EXPORT AS PDF
  // ----------------------------
  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const fileName = "appointments.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    doc.pipe(res);

    doc.fontSize(20).font("Helvetica-Bold").text("Appointment Report", {
      align: "center",
    });

    doc.moveDown(1);
    doc.fontSize(12).text(`Total Appointments: ${appointments.length}`);
    doc.moveDown(1.5);

    const headers = [
      "Patient",
      "Service",
      "Partner",
      "Date",
      "Slot",
      "Status",
      "Amount",
    ];
    const colWidths = [90, 90, 90, 60, 70, 60, 60];
    let x = 40;
    let y = doc.y;

    doc
      .rect(x - 5, y - 2, 520, 20)
      .fill("#f0f0f0")
      .stroke();
    doc.fillColor("black").font("Helvetica-Bold");

    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });

    y += 22;
    doc
      .moveTo(35, y - 5)
      .lineTo(560, y - 5)
      .stroke();

    doc.font("Helvetica").fontSize(10);

    appointments.forEach((a, index) => {
      const row = [
        `${a.patientId?.firstName || ""} ${a.patientId?.lastName || ""}`,
        a.serviceId?.name || "-",
        a.servicePartnerId
          ? `${a.servicePartnerId.firstName} ${a.servicePartnerId.lastName}`
          : "-",
        new Date(a.appointmentDate).toLocaleDateString(),
        `${a.slotTime?.startTime} - ${a.slotTime?.endTime}`,
        a.status,
        a.pricing?.totalAmount || "-",
      ];

      if (index % 2 === 0) {
        doc
          .rect(35, y - 2, 520, 18)
          .fill("#fafafa")
          .stroke();
        doc.fillColor("black");
      }

      let xPos = 40;
      row.forEach((cell, i) => {
        doc.text(String(cell), xPos, y, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      y += 18;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
    return;
  }

  return res.status(400).json({
    message: "Invalid format. Use ?format=csv or ?format=pdf",
  });
});

// exports.createBookingByAdmin = async (req, res) => {
//   try {
//     const adminId = req.user?.id; // Admin logged in

//     if (!adminId) {
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }

//     const {
//       patientId,
//       serviceId,
//       appointmentDate, // 'YYYY-MM-DD'
//       startTime, // 'HH:mm'
//       endTime, // 'HH:mm'
//       duration,
//       shiftType,
//       servicePartnerId,
//       notes,
//       category,
//       modes,
//       cityId,
//     } = req.body;

//     // ----------------------------
//     // Required fields
//     // ----------------------------
//     if (!patientId || !serviceId || !appointmentDate || !startTime) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "patientId, serviceId, appointmentDate, startTime are required",
//       });
//     }

//     // 1) Validate service
//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive || service.isDeleted) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Service not found or inactive" });
//     }

//     // 2) Load patient and ensure patient has a city
//     const patient = await Patient.findById(patientId).select("address.cityId");
//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (!patient.address || !patient.address.cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient city not set. Please update your address first.",
//       });
//     }

//     // 3) Determine booking city and enforce that patient belongs to it
//     let bookingCity = null;

//     if (cityId) {
//       // City explicitly sent in request
//       bookingCity = await City.findById(cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid city selected",
//         });
//       }

//       // Patient must belong to this city
//       if (bookingCity._id.toString() !== patient.address.cityId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "Booking not allowed: patient does not belong to the selected city",
//         });
//       }
//     } else {
//       // No cityId in body → default to patient city
//       bookingCity = await City.findById(patient.address.cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Patient city is invalid or not available",
//         });
//       }
//     }

//     // 4) Use category and modes from Service if not provided
//     const bookingCategory = category || service.category || null;
//     const bookingModes =
//       Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

//     // 5) Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);

//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//     };

//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingBooking = await Booking.findOne(conflictQuery);
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "Slot already booked. Choose another slot.",
//       });
//     }

//     // 6) Calculate duration
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = eh * 60 + em - (sh * 60 + sm);

//       if (bookingDuration <= 0) {
//         bookingDuration = service.defaultDuration || 30;
//       }
//     }

//     // 7) Pricing snapshot
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false,
//       shiftType || null
//     );

//     // 8) Create Booking
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: bookingCategory,
//       modes: bookingModes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Approved", // Admin-created bookings are usually auto-approved
//       pricing,
//       notes: notes || "",
//       city: bookingCity ? bookingCity._id : undefined,
//       createdBy: {
//         userId: adminId,
//         userModel: "Admin",
//       },
//     });

//     await newBooking.save();

//     // 9) Populate city before response
//     const populatedBooking = await newBooking.populate(
//       "city",
//       "name latitude longitude"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Booking created successfully by admin",
//       data: {
//         ...populatedBooking.toObject(),
//         formattedDuration: formatDuration(bookingDuration),
//       },
//     });
//   } catch (error) {
//     console.error("Admin Booking Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating booking by admin",
//       error: error.message,
//     });
//   }
// };

// exports.updateBookingByAdmin = async (req, res) => {
//   try {
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }

//     const { bookingId } = req.params;

//     const {
//       patientId,
//       appointmentDate,
//       startTime,
//       endTime,
//       duration,
//       servicePartnerId,
//       status,
//       statusReason,
//       notes,
//       category,
//       modes,
//       shiftType,
//       cityId,
//     } = req.body;
//     console.log("req.body", req.body);

//     // ------------------------------------------------------------
//     // Fetch booking
//     // ------------------------------------------------------------
//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     // ------------------------------------------------------------
//     // Patient/service cannot be changed by admin
//     // ------------------------------------------------------------
//     const service = await Service.findById(booking.serviceId);
//     if (!service) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Service missing for booking" });
//     }

//     const patient = await Patient.findById(patientId).select("address.cityId");
//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (!patient.address || !patient.address.cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient city not set. Please update your address first.",
//       });
//     }

//     // 3) Determine booking city and enforce that patient belongs to it
//     let bookingCity = null;

//     if (cityId) {
//       // City explicitly sent in request
//       bookingCity = await City.findById(cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid city selected",
//         });
//       }

//       // Patient must belong to this city
//       if (bookingCity._id.toString() !== patient.address.cityId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "Booking not allowed: patient does not belong to the selected city",
//         });
//       }
//     } else {
//       // No cityId in body → default to patient city
//       bookingCity = await City.findById(patient.address.cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Patient city is invalid or not available",
//         });
//       }
//     }

//     // ------------------------------------------------------------
//     // Update category/modes
//     // ------------------------------------------------------------
//     if (category) booking.category = category;
//     if (Array.isArray(modes)) booking.modes = modes;

//     // ------------------------------------------------------------
//     // Update notes
//     // ------------------------------------------------------------
//     if (notes !== undefined) booking.notes = notes;

//     // ------------------------------------------------------------
//     // Update status
//     // ------------------------------------------------------------
//     if (status) {
//       booking.status = status;
//       if (statusReason) booking.statusReason = statusReason;
//     }

//     // ------------------------------------------------------------
//     // Update partner assignment
//     // ------------------------------------------------------------
//     if (servicePartnerId !== undefined) {
//       booking.servicePartnerId = servicePartnerId || null;
//     }

//     // ------------------------------------------------------------
//     // Update time + conflict check
//     // ------------------------------------------------------------
//     if (appointmentDate || startTime || endTime) {
//       const newDate = appointmentDate
//         ? new Date(appointmentDate)
//         : booking.appointmentDate;

//       const newStart = startTime || booking.slotTime.startTime;
//       const newEnd = endTime || booking.slotTime.endTime;

//       // Check conflict
//       const dayStart = new Date(newDate);
//       dayStart.setHours(0, 0, 0, 0);

//       const dayEnd = new Date(newDate);
//       dayEnd.setHours(23, 59, 59, 999);

//       const conflictQuery = {
//         _id: { $ne: bookingId }, // exclude current booking
//         serviceId: booking.serviceId,
//         appointmentDate: { $gte: dayStart, $lte: dayEnd },
//         status: { $nin: ["Cancelled", "Rejected"] },
//         "slotTime.startTime": newStart,
//         "slotTime.endTime": newEnd,
//       };

//       if (servicePartnerId) {
//         conflictQuery.servicePartnerId = servicePartnerId;
//       }

//       console.log("conflictQuery", conflictQuery);

//       const conflict = await Booking.findOne(conflictQuery);
//       if (conflict) {
//         return res.status(409).json({
//           success: false,
//           message: "Updated slot conflicts with another booking",
//         });
//       }

//       // Apply updated values
//       booking.appointmentDate = newDate;
//       booking.slotTime.startTime = newStart;
//       booking.slotTime.endTime = newEnd;
//     }

//     // ------------------------------------------------------------
//     // Update duration (auto or manual)
//     // ------------------------------------------------------------
//     let finalDuration = duration;

//     const st = booking.slotTime.startTime;
//     const et = booking.slotTime.endTime;

//     if (!finalDuration) {
//       const [sh, sm] = st.split(":").map(Number);
//       const [eh, em] = et.split(":").map(Number);

//       finalDuration = eh * 60 + em - (sh * 60 + sm);
//       if (finalDuration <= 0) {
//         finalDuration = service.defaultDuration || 30;
//       }
//     }

//     booking.duration = finalDuration;

//     // ------------------------------------------------------------
//     // Recalculate pricing snapshot
//     // ------------------------------------------------------------
//     booking.pricing = service.calculateTotalPrice(
//       finalDuration,
//       false,
//       shiftType || booking.shiftType
//     );

//     if (shiftType) booking.shiftType = shiftType;

//     // ------------------------------------------------------------
//     // Save with updatedBy info
//     // ------------------------------------------------------------
//     // booking.createdBy = {
//     //   userId: adminId,
//     //   userModel: "Admin",
//     // };

//     await booking.save();

//     // Populate city for response
//     const populated = await booking.populate("city", "name latitude longitude");

//     res.status(200).json({
//       success: true,
//       message: "Booking updated successfully",
//       data: {
//         ...populated.toObject(),
//         formattedDuration: formatDuration(finalDuration),
//       },
//     });
//   } catch (error) {
//     console.error("Admin Update Booking Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating booking",
//       error: error.message,
//     });
//   }
// };

exports.createBookingByAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      patientId,
      serviceId,
      treatmentId,
      createNewTreatment,
      appointmentDate,
      startTime,
      endTime,
      duration,
      shiftType,
      servicePartnerId,
      notes,
      category,
      modes,
      cityId,
    } = req.body;

    // ------------------------------------------------------------
    // Required fields
    // ------------------------------------------------------------
    if (!patientId || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message:
          "patientId, serviceId, appointmentDate and startTime are required",
      });
    }

    // ------------------------------------------------------------
    // Validate service
    // ------------------------------------------------------------
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive || service.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // ------------------------------------------------------------
    // Validate patient and patient city
    // ------------------------------------------------------------
    const patient = await Patient.findById(patientId).select("address.cityId");
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!patient.address?.cityId) {
      return res.status(400).json({
        success: false,
        message: "Patient city not set. Please update patient address first.",
      });
    }

    // ------------------------------------------------------------
    // Determine booking city
    // ------------------------------------------------------------
    let bookingCityId = patient.address.cityId;

    if (cityId) {
      const cityDoc = await City.findById(cityId);
      if (!cityDoc) {
        return res.status(400).json({
          success: false,
          message: "Invalid city selected",
        });
      }

      if (cityDoc._id.toString() !== patient.address.cityId.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "Booking not allowed. Patient does not belong to the selected city.",
        });
      }

      bookingCityId = cityDoc._id;
    }

    // ------------------------------------------------------------
    // Booking category & modes
    // ------------------------------------------------------------
    const bookingCategory = category || service.category || null;
    const bookingModes =
      Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

    // ------------------------------------------------------------
    // Prepare date range for conflict checks
    // ------------------------------------------------------------
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // ------------------------------------------------------------
    // Compute endTime if missing
    // ------------------------------------------------------------
    let computedEndTime = endTime;
    let computedDuration = duration;

    if (!computedEndTime) {
      let dur = computedDuration || service.defaultDuration || 30;

      const [sh, sm] = startTime.split(":").map(Number);
      const totalStartMinutes = sh * 60 + sm;
      const totalEndMinutes = totalStartMinutes + dur;

      const eh = Math.floor(totalEndMinutes / 60);
      const em = totalEndMinutes % 60;

      computedEndTime = `${eh.toString().padStart(2, "0")}:${em
        .toString()
        .padStart(2, "0")}`;
    }

    // ------------------------------------------------------------
    // Duration calculation if missing
    // ------------------------------------------------------------
    if (!computedDuration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = computedEndTime.split(":").map(Number);

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      computedDuration = endMinutes - startMinutes;
      if (computedDuration <= 0) {
        computedDuration = service.defaultDuration || 30;
      }
    }

    // ------------------------------------------------------------
    // Check slot conflict
    // ------------------------------------------------------------
    const conflictQuery = {
      serviceId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": startTime,
      "slotTime.endTime": computedEndTime,
    };

    if (servicePartnerId) {
      conflictQuery.servicePartnerId = servicePartnerId;
    }

    const existingBooking = await Booking.findOne(conflictQuery);
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked. Choose another slot.",
      });
    }

    // ------------------------------------------------------------
    // Pricing snapshot
    // ------------------------------------------------------------
    const pricing = service.calculateTotalPrice(
      computedDuration,
      false,
      shiftType || null
    );

    let treatment = null;
    let treatmentCreated = false;
    const shouldCreateTreatment =
      createNewTreatment === true || createNewTreatment === "true";

    if (treatmentId) {
      if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid treatmentId",
        });
      }

      treatment = await Treatment.findById(treatmentId);
      if (!treatment) {
        return res.status(404).json({
          success: false,
          message: "Treatment not found",
        });
      }

      if (String(treatment.patientId) !== String(patientId)) {
        return res.status(400).json({
          success: false,
          message: "Selected treatment does not belong to this patient",
        });
      }

      if (String(treatment.serviceId) !== String(serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Selected treatment is not linked to the selected service",
        });
      }
    } else if (shouldCreateTreatment) {
      treatment = await Treatment.create({
        patientId,
        serviceId,
        servicePartnerId: servicePartnerId || undefined,
        status: "Active",
        startDate: new Date(appointmentDate),
      });
      treatmentCreated = true;
    } else {
      treatment = await Treatment.findOne({ patientId, serviceId }).sort({
        createdAt: -1,
      });
      if (!treatment) {
        return res.status(400).json({
          success: false,
          message:
            "No treatment found. Select an existing treatment or create a new treatment.",
        });
      }
    }

    const previousCount = await Booking.countDocuments({ treatmentId: treatment._id });
    const nextSessionNumber = previousCount + 1;

    // ------------------------------------------------------------
    // Create booking
    // ------------------------------------------------------------
    const newBooking = new Booking({
      treatmentId: treatment._id,
      sessionNumber: nextSessionNumber,
      patientId,
      serviceId,
      category: bookingCategory,
      modes: bookingModes,
      servicePartnerId: servicePartnerId || null,
      appointmentDate: new Date(appointmentDate),
      slotTime: {
        startTime,
        endTime: computedEndTime,
      },
      duration: computedDuration,
      shiftType: shiftType || null,
      status: "Approved",
      pricing,
      notes: notes || "",
      city: bookingCityId,
      createdBy: {
        userId: adminId,
        userModel: "Admin",
      },
    });

    await newBooking.save();
    await Treatment.updateOne(
      { _id: treatment._id },
      {
        $set: {
          currentBookingId: newBooking._id,
          lastBookingAt: new Date(),
        },
      }
    );

    const populated = await newBooking.populate(
      "city",
      "name latitude longitude"
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...populated.toObject(),
        treatment: {
          _id: treatment._id,
          status: treatment.status,
          createdNew: treatmentCreated,
        },
        formattedDuration: formatDuration(computedDuration),
      },
    });
  } catch (error) {
    console.error("Admin Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating booking by admin",
      error: error.message,
    });
  }
};

exports.updateBookingByAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { bookingId } = req.params;

    const {
      patientId,
      appointmentDate,
      startTime,
      endTime,
      duration,
      servicePartnerId,
      status,
      statusReason,
      notes,
      category,
      modes,
      shiftType,
      cityId,
      treatmentId,
      createNewTreatment,
    } = req.body;

    // Fetch booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Ensure service exists (service cannot be changed)
    const service = await Service.findById(booking.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service missing for booking",
      });
    }

    // Determine which patient to validate: provided patientId or existing booking.patientId
    const effectivePatientId = patientId || booking.patientId;
    const patient = await Patient.findById(effectivePatientId).select(
      "address.cityId"
    );
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }
    if (!patient.address?.cityId) {
      return res.status(400).json({
        success: false,
        message: "Patient city not set. Please update patient address first.",
      });
    }

    // Determine booking city and ensure patient belongs to it
    let bookingCityDoc = null;
    if (cityId) {
      bookingCityDoc = await City.findById(cityId);
      if (!bookingCityDoc) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid city selected" });
      }
      if (bookingCityDoc._id.toString() !== patient.address.cityId.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "Booking not allowed: patient does not belong to the selected city",
        });
      }
    } else {
      bookingCityDoc = await City.findById(patient.address.cityId);
      if (!bookingCityDoc) {
        return res.status(400).json({
          success: false,
          message: "Patient city is invalid or not available",
        });
      }
    }

    // Update category/modes if provided
    if (category) booking.category = category;
    if (Array.isArray(modes)) booking.modes = modes;

    // Update notes (allow empty string)
    if (notes !== undefined) booking.notes = notes;

    // Update status & reason
    if (status) {
      booking.status = status;
      if (statusReason) booking.statusReason = statusReason;
    }

    // Update partner assignment (allow null to unassign)
    if (servicePartnerId !== undefined) {
      booking.servicePartnerId = servicePartnerId || null;
    }

    // Time & conflict handling:
    // We'll compute the effective appointmentDate, start and end times:
    const effectiveDate = appointmentDate
      ? new Date(appointmentDate)
      : booking.appointmentDate;
    const effectiveStart = startTime || booking.slotTime?.startTime;
    let effectiveEnd = endTime || booking.slotTime?.endTime;
    let providedDuration = duration; // possibly undefined

    // If start is missing at this point, error - startTime is required for times update
    if (!effectiveStart) {
      return res.status(400).json({
        success: false,
        message: "startTime is required to update slot/time information",
      });
    }

    // Compute end time if missing using duration or service.defaultDuration
    if (!effectiveEnd) {
      const dur = providedDuration || service.defaultDuration || 30;
      const [sh, sm] = effectiveStart.split(":").map(Number);
      const totalStartMins = sh * 60 + sm;
      const totalEndMins = totalStartMins + dur;
      const eh = Math.floor(totalEndMins / 60);
      const em = totalEndMins % 60;
      effectiveEnd = `${eh.toString().padStart(2, "0")}:${em
        .toString()
        .padStart(2, "0")}`;
    }

    // Recompute duration if not provided
    let finalDuration = providedDuration;
    if (!finalDuration) {
      const [sh, sm] = effectiveStart.split(":").map(Number);
      const [eh, em] = effectiveEnd.split(":").map(Number);
      finalDuration = eh * 60 + em - (sh * 60 + sm);
      if (finalDuration <= 0) {
        finalDuration = service.defaultDuration || 30;
      }
    }

    // Resolve treatment for this booking update
    const shouldCreateTreatment =
      createNewTreatment === true || createNewTreatment === "true";
    const oldTreatmentId = booking.treatmentId ? String(booking.treatmentId) : null;
    let resolvedTreatment = null;
    let treatmentCreated = false;
    const effectiveServicePartnerId =
      servicePartnerId !== undefined ? servicePartnerId : booking.servicePartnerId;

    if (treatmentId) {
      if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid treatmentId",
        });
      }

      resolvedTreatment = await Treatment.findById(treatmentId);
      if (!resolvedTreatment) {
        return res.status(404).json({
          success: false,
          message: "Treatment not found",
        });
      }

      if (String(resolvedTreatment.patientId) !== String(effectivePatientId)) {
        return res.status(400).json({
          success: false,
          message: "Selected treatment does not belong to this patient",
        });
      }

      if (String(resolvedTreatment.serviceId) !== String(booking.serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Selected treatment is not linked to this booking service",
        });
      }
    } else if (shouldCreateTreatment) {
      const treatmentPayload = {
        patientId: effectivePatientId,
        serviceId: booking.serviceId,
        status: "Active",
        startDate: new Date(effectiveDate),
      };
      if (effectiveServicePartnerId) {
        treatmentPayload.servicePartnerId = effectiveServicePartnerId;
      }
      resolvedTreatment = await Treatment.create(treatmentPayload);
      treatmentCreated = true;
    } else if (booking.treatmentId) {
      resolvedTreatment = await Treatment.findById(booking.treatmentId);
    }

    if (!resolvedTreatment) {
      resolvedTreatment = await Treatment.findOne({
        patientId: effectivePatientId,
        serviceId: booking.serviceId,
      }).sort({ createdAt: -1 });
    }

    if (!resolvedTreatment) {
      return res.status(400).json({
        success: false,
        message:
          "No treatment found. Select an existing treatment or create a new treatment.",
      });
    }

    // Conflict check only if any of date/start/end/partner changed (or always check to be safe)
    const dayStart = new Date(effectiveDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(effectiveDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictQuery = {
      _id: { $ne: bookingId }, // exclude current booking
      serviceId: booking.serviceId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": effectiveStart,
      "slotTime.endTime": effectiveEnd,
    };

    // if a new partner was provided (or existing booking has one), conflict should check against the partner we will assign
    if (servicePartnerId !== undefined) {
      conflictQuery.servicePartnerId = servicePartnerId || null;
    } else if (booking.servicePartnerId) {
      conflictQuery.servicePartnerId = booking.servicePartnerId;
    }

    const conflict = await Booking.findOne(conflictQuery);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Updated slot conflicts with another booking",
      });
    }

    // Apply time updates
    booking.appointmentDate = effectiveDate;
    booking.slotTime = {
      startTime: effectiveStart,
      endTime: effectiveEnd,
    };

    // Apply duration & pricing & shiftType
    booking.duration = finalDuration;
    booking.pricing = service.calculateTotalPrice(
      finalDuration,
      false,
      shiftType || booking.shiftType
    );
    if (shiftType) booking.shiftType = shiftType;
    booking.treatmentId = resolvedTreatment._id;

    const isTreatmentChanged =
      !oldTreatmentId || oldTreatmentId !== String(resolvedTreatment._id);
    if (!booking.sessionNumber || isTreatmentChanged) {
      const existingSessionCount = await Booking.countDocuments({
        treatmentId: resolvedTreatment._id,
        _id: { $ne: booking._id },
      });
      booking.sessionNumber = existingSessionCount + 1;
    }

    // Update city to bookingCityDoc
    booking.city = bookingCityDoc._id;


    // Save
    await booking.save();

    if (oldTreatmentId && oldTreatmentId !== String(resolvedTreatment._id)) {
      await Treatment.updateOne(
        { _id: oldTreatmentId, currentBookingId: booking._id },
        { $set: { currentBookingId: null } }
      );
    }

    const treatmentPatch = {
      currentBookingId: booking._id,
      lastBookingAt: new Date(effectiveDate),
    };
    if (resolvedTreatment.status === "Completed") {
      treatmentPatch.status = "Active";
      resolvedTreatment.status = "Active";
    }
    await Treatment.updateOne(
      { _id: resolvedTreatment._id },
      { $set: treatmentPatch }
    );

    // Populate city for response
    const populated = await booking.populate("city", "name latitude longitude");

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: {
        ...populated.toObject(),
        treatment: {
          _id: resolvedTreatment._id,
          status: resolvedTreatment.status,
          createdNew: treatmentCreated,
        },
        formattedDuration: formatDuration(finalDuration),
      },
    });
  } catch (error) {
    console.error("Admin Update Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating booking",
      error: error.message,
    });
  }
};


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

  const hasStatusFilter =
    typeof isActive !== "undefined" &&
    isActive !== null &&
    isActive !== "" &&
    isActive !== "null";

  if (hasStatusFilter) {
    filter.isActive = isActive === "true";
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

  const savedAddresses = await PatientAddress.find({ patientId: patient._id })
    .sort({ isPrimary: -1, createdAt: 1 })
    .lean();

  const mappedAddresses = savedAddresses.map((address) => ({
    _id: address._id,
    label: address.label || "home",
    street: address.street || "",
    city: address.city || "",
    cityId: address.cityId || null,
    state: address.state || "",
    country: address.country || "",
    pincode: address.pincode || "",
    landmark: address.landmark || "",
    isDefault: Boolean(address.isPrimary),
    isPrimary: Boolean(address.isPrimary),
  }));

  if (mappedAddresses.length === 0 && patient.address) {
    mappedAddresses.push({
      _id: "legacy-primary-address",
      label: "home",
      street: patient.address.street || "",
      city: patient.address.city || "",
      cityId: patient.address.cityId || null,
      state: patient.address.state || "",
      country: patient.address.country || "",
      pincode: patient.address.pincode || "",
      landmark: patient.address.landmark || "",
      isDefault: true,
      isPrimary: true,
    });
  }

  const patientData =
    typeof patient.toObject === "function" ? patient.toObject() : patient;

  patientData.addresses = mappedAddresses;

  res.status(200).json({
    success: true,
    data: { patient: patientData },
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

  console.log("");
  console.log("ADMIN: ADD DOCTOR TO CITIES");
  console.log("=".repeat(60));
  console.log(`Doctor ID: ${doctorId}`);
  console.log(`Cities count: ${cityIds?.length || 0}`);

  // Validate input
  if (!doctorId) {
    return next(new AppError("Doctor ID is required", 400));
  }

  if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
    return next(
      new AppError(
        "Please provide an array of cityIds with at least one city",
        400
      )
    );
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Invalid doctor ID format", 400));
  }

  for (const cityId of cityIds) {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return next(new AppError(`Invalid city ID format: ${cityId}`, 400));
    }
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  console.log(`Doctor: ${doctor.firstName} ${doctor.lastName || ""}`);

  // Verify all cities exist
  const cities = await City.find({ _id: { $in: cityIds } });

  if (cities.length !== cityIds.length) {
    const foundCityIds = cities.map((c) => c._id.toString());
    const missingCityIds = cityIds.filter(
      (id) => !foundCityIds.includes(id.toString())
    );
    return next(
      new AppError(`Some cities not found: ${missingCityIds.join(", ")}`, 404)
    );
  }

  console.log("SUCCESS: All cities verified");

  // Add cities to doctor (avoid duplicates)
  const existingCityIds = doctor.cities.map((id) => id.toString());
  const newCityIds = cityIds.filter(
    (id) => !existingCityIds.includes(id.toString())
  );

  const duplicateCityIds = cityIds.filter((id) =>
    existingCityIds.includes(id.toString())
  );

  if (newCityIds.length === 0) {
    console.log("INFO: Doctor already added to all these cities");
    return res.status(200).json({
      success: true,
      message: "Doctor is already associated with all these cities",
      alreadyAdded: duplicateCityIds.length,
      newlyAdded: 0,
      data: {
        doctor: {
          id: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          email: doctor.email,
          phone: doctor.phone,
          totalCities: doctor.cities.length,
        },
      },
    });
  }

  doctor.cities.push(...newCityIds);
  await doctor.save();

  console.log(`SUCCESS: Doctor added to ${newCityIds.length} new cities`);
  if (duplicateCityIds.length > 0) {
    console.log(
      `INFO: ${duplicateCityIds.length} cities were already associated`
    );
  }
  console.log("=".repeat(60));
  console.log("");

  // Populate city details before response
  await doctor.populate("cities", "name latitude longitude");

  res.status(200).json({
    success: true,
    message: `Doctor added to ${newCityIds.length} cities successfully${
      duplicateCityIds.length > 0
        ? ` (${duplicateCityIds.length} already associated)`
        : ""
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
        totalCities: doctor.cities.length,
      },
    },
  });
});

// ============================================
// ADMIN: REMOVE DOCTOR FROM CITIES
// ============================================

exports.removeDoctorFromCities = catchAsync(async (req, res, next) => {
  const { doctorId, cityIds } = req.body;

  console.log("");
  console.log("ADMIN: REMOVE DOCTOR FROM CITIES");
  console.log("=".repeat(60));

  if (!doctorId) {
    return next(new AppError("Doctor ID is required", 400));
  }

  if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
    return next(
      new AppError(
        "Please provide an array of cityIds with at least one city",
        400
      )
    );
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Invalid doctor ID format", 400));
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  const initialCount = doctor.cities.length;
  doctor.cities = doctor.cities.filter(
    (id) => !cityIds.includes(id.toString())
  );

  const removedCount = initialCount - doctor.cities.length;

  await doctor.save();
  await doctor.populate("cities", "name latitude longitude");

  console.log(`SUCCESS: Removed doctor from ${removedCount} cities`);
  console.log("=".repeat(60));
  console.log("");

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
        totalCities: doctor.cities.length,
      },
    },
  });
});

// ============================================
// ADMIN: UPDATE DOCTOR CITIES (REPLACE ALL)
// ============================================

exports.updateDoctorCities = catchAsync(async (req, res, next) => {
  const { doctorId, cityIds } = req.body;

  console.log("");
  console.log("ADMIN: UPDATE DOCTOR CITIES (REPLACE ALL)");
  console.log("=".repeat(60));

  if (!doctorId) {
    return next(new AppError("Doctor ID is required", 400));
  }

  if (!cityIds || !Array.isArray(cityIds)) {
    return next(new AppError("Please provide an array of cityIds", 400));
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Invalid doctor ID format", 400));
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  // Verify all cities exist (if cityIds is not empty)
  if (cityIds.length > 0) {
    const cities = await City.find({ _id: { $in: cityIds } });

    if (cities.length !== cityIds.length) {
      const foundCityIds = cities.map((c) => c._id.toString());
      const missingCityIds = cityIds.filter(
        (id) => !foundCityIds.includes(id.toString())
      );
      return next(
        new AppError(`Some cities not found: ${missingCityIds.join(", ")}`, 404)
      );
    }
  }

  const previousCount = doctor.cities.length;
  doctor.cities = cityIds;
  await doctor.save();
  await doctor.populate("cities", "name latitude longitude");

  console.log(
    `SUCCESS: Doctor cities updated from ${previousCount} to ${cityIds.length}`
  );
  console.log("=".repeat(60));
  console.log("");

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
        totalCities: doctor.cities.length,
      },
    },
  });
});

// ============================================
// ADMIN: GET DOCTOR'S CITIES
// ============================================

exports.getDoctorCities = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  if (!doctorId) {
    return next(new AppError("Doctor ID is required", 400));
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Invalid doctor ID format", 400));
  }

  const doctor = await Doctor.findById(doctorId).populate(
    "cities",
    "name latitude longitude"
  );

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
      },
      cities: doctor.cities,
      totalCities: doctor.cities.length,
    },
  });
});

// ============================================
// ADMIN: GET ALL DOCTORS WITH CITY FILTER
// ============================================

exports.getDoctorsByCity = catchAsync(async (req, res, next) => {
  const { cityId, page = 1, limit = 10 } = req.query;

  if (!cityId) {
    return next(new AppError("City ID is required", 400));
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    return next(new AppError("Invalid city ID format", 400));
  }

  // Check if city exists
  const city = await City.findById(cityId);
  if (!city) {
    return next(new AppError("City not found", 404));
  }

  const skip = (page - 1) * limit;

  const doctors = await Doctor.find({ cities: cityId })
    .select("-password -tokenVersion -verificationDocuments")
    .skip(skip)
    .limit(parseInt(limit))
    .populate("cities", "name")
    .sort("-createdAt");

  const total = await Doctor.countDocuments({ cities: cityId });

  res.status(200).json({
    success: true,
    city: {
      id: city._id,
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    },
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalDoctors: total,
    data: { doctors },
  });
});

// Admin: Update booking status (approve/cancel/reject/etc.)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and new status are required",
      });
    }

    const allowedStatuses = [
      "Approved",
      "Cancelled",
      "Rejected",
      "Pending",
      "Rescheduled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    // Update only status and reason, don't revalidate full document
    const updateFields = { status };
    if (reason) updateFields.statusReason = reason;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateFields },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: booking,
    });
  } catch (error) {
    console.error("Admin booking status update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.message,
    });
  }
};

exports.getServiceNames = async (req, res) => {
  try {
    const services = await Service.find(
      { isDeleted: false, isActive: true }, // Only active data
      {
        name: 1,
        "slotConfig.consultationSlots.startTime": 1,
        "slotConfig.consultationSlots.endTime": 1,
      }
    ).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching service names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service names",
    });
  }
};

exports.getPatientNames = async (req, res) => {
  const { searchQuery } = req.query;
  const filter = { isActive: true };

  if (searchQuery) {
    filter.$or = [
      { firstName: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
      { phone: { $regex: searchQuery, $options: "i" } },
    ];
  }

  if (mongoose.Types.ObjectId.isValid(searchQuery)) {
    filter.$or.push({ _id: searchQuery });
  }

  try {
    const patients = await Patient.find(filter, {
      firstName: 1,
      lastName: 1,
      phone: 1,
      address: 1,
    }).sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Error fetching patient names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient names",
    });
  }
};

exports.getPatientTreatmentsForBooking = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { serviceId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patientId",
      });
    }

    const patient = await Patient.findById(patientId).select("_id");
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const filter = { patientId };
    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid serviceId",
        });
      }
      filter.serviceId = serviceId;
    }

    const treatments = await Treatment.find(filter)
      .select(
        "_id patientId serviceId servicePartnerId status currentBookingId startDate endDate validTill createdAt updatedAt"
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const treatmentIds = treatments.map((item) => item._id);
    const counts = treatmentIds.length
      ? await Booking.aggregate([
          { $match: { treatmentId: { $in: treatmentIds } } },
          { $group: { _id: "$treatmentId", sessionsCount: { $sum: 1 } } },
        ])
      : [];
    const sessionsMap = new Map(
      counts.map((item) => [String(item._id), item.sessionsCount])
    );

    return res.status(200).json({
      success: true,
      count: treatments.length,
      data: treatments.map((item) => ({
        ...item,
        sessionsCount: sessionsMap.get(String(item._id)) || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching patient treatments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient treatments",
      error: error.message,
    });
  }
};

// exports.getServiceProviderNames = async (req, res) => {
//   try {
//     const providers = await ServiceProvider.find(
//       { isDeleted: false }, // Only active/non-deleted
//       { firstName: 1, lastName: 1, ownerName: 1 } // Projection
//     ).sort({ firstName: 1 }); // Sort A → Z

//     res.status(200).json({
//       success: true,
//       count: providers.length,
//       data: providers,
//     });
//   } catch (error) {
//     console.error("Error fetching service provider names:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch service provider names",
//     });
//   }
// };

exports.getServiceProviderNames = async (req, res) => {
  try {
    const { serviceId, cityId } = req.query;

    const filter = {
      isDeleted: false,
      approvalStatus: "Approved",
      isActive: true,
    };

    // Apply service filter only if provided
    if (serviceId) {
      filter["services.serviceId"] = serviceId;
    }

    if (cityId) {
      filter.serviceCities = cityId;
    }

    const providers = await ServiceProvider.find(filter, {
      firstName: 1,
      lastName: 1,
      ownerName: 1,

      "documents.profilePhoto": 1,
      yearsOfExperience: 1,
      rating: 1,

      "currentAddress.street": 1,
      "currentAddress.locality": 1,
      "currentAddress.city": 1,
      "currentAddress.state": 1,
      "currentAddress.country": 1,
      "currentAddress.pincode": 1,

      approvalStatus: 1,
      services: 1, // optional: returns service list if needed
    }).sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      count: providers.length,
      data: providers,
    });
  } catch (error) {
    console.error("Error fetching service provider names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service provider names",
    });
  }
};

//toggle api for doctor

exports.toggleDoctorStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const adminRole = req.user?.role;
  console.log("req.user", req.user);

  if (
    !adminRole ||
    !["superAdmin", "subAdmin", "superadmin", "subadmin"].includes(adminRole)
  ) {
    return next(new AppError("Only admins can toggle doctor status", 403));
  }

  const doctor = await Doctor.findById(id).select("-password -tokenVersion");
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  doctor.isActive = !doctor.isActive;
  await doctor.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `Doctor ${
      doctor.isActive ? "activated" : "deactivated"
    } successfully`,
    data: doctor,
  });
});

exports.togglePatientStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const adminRole = req.user?.role;
  if (
    !adminRole ||
    !["superAdmin", "subAdmin", "superadmin", "subadmin"].includes(adminRole)
  ) {
    return next(new AppError("Only admins can toggle patient status", 403));
  }

  const patient = await Patient.findById(id).select("-password -tokenVersion");
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  patient.isActive = !patient.isActive;
  await patient.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `Patient ${
      patient.isActive ? "activated" : "deactivated"
    } successfully`,
    data: patient,
  });
});

//approved cancellation
exports.approveCancellation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, adminReason } = req.body; // 'approve' or 'reject'

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "Cancellation Requested") {
      return res.status(400).json({
        success: false,
        message: "No pending cancellation request found",
      });
    }

    if (action === "approve") {
      booking.status = "Cancelled";
      booking.adminApprovedCancellation = true;
      booking.adminApprovedAt = new Date();
      booking.adminReason = adminReason;
    } else if (action === "reject") {
      // Restore original status
      booking.status = booking.originalStatus || "Confirmed";
      booking.adminRejectedCancellation = true;
      booking.adminRejectedAt = new Date();
      booking.adminReason = adminReason;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "reject"',
      });
    }

    // Clear temporary fields
    booking.requestedCancellationAt = null;
    booking.originalStatus = null;
    booking.timeRemainingAtRequest = null;

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Cancellation ${action}d successfully`,
      data: booking,
    });
  } catch (error) {
    console.error("Admin approval error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing admin approval",
      error: error.message,
    });
  }
};
// POST /admin/patient/:patientId/medications
exports.adminAddMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;
  const { patientId } = req.params;

  if (!medication) {
    return next(new AppError("Please provide medication details", 400));
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  if (patient.currentMedications.includes(medication)) {
    return next(new AppError("Medication already exists", 400));
  }

  patient.currentMedications.push(medication);
  await patient.save();

  res.status(200).json({
    success: true,
    message: "Medication added successfully by admin",
    data: { currentMedications: patient.currentMedications },
  });
});

exports.adminRemoveMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.query;
  const { patientId } = req.params;

  if (!medication) {
    return next(
      new AppError("Please provide medication details to remove", 400)
    );
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  const initialLength = patient.currentMedications.length;
  patient.currentMedications.pull(medication); // Mongoose $pull operator [web:9][web:10]
  await patient.save();

  if (patient.currentMedications.length === initialLength) {
    return next(new AppError("Medication not found in patient's list", 404));
  }

  res.status(200).json({
    success: true,
    message: "Medication removed successfully by admin",
    data: { currentMedications: patient.currentMedications },
  });
});
// exports.addEquipment = async (req, res) => {
//   try {
//     const { 
//       name, 
//       description, 
//       basePrice, 
//       equipmentCharges, 
//       cities, 
//       image,
//       minDuration,
//       maxDuration 
//     } = req.body;

//     // Build the equipment document
//     const newEquipment = new Service({
//       name,
//       description,
//       category: 'equipment', // Fixed for this admin action
//       basePrice,
//       equipmentCharges: equipmentCharges || 0,
//       cities,
//       image,
//       modes: ["Home Service"],
//       slotConfig: {
//         equipmentBooking: {
//           enabled: true,
//           minDuration: minDuration || 60,
//           maxDuration: maxDuration || 1440, // Default to 24-hour limit
//           available24x7: true
//         }
//       },
//       // Uses data from your 'protect' middleware
//       createdBy: {
//         userId: req.user.id,
//         userModel: req.user.role === 'superAdmin' ? 'SuperAdmin' : 'Admin',
//         name: req.user.firstName,
//         email: req.user.email
//       }
//     });

//     const savedEquipment = await newEquipment.save();

//     res.status(201).json({
//       success: true,
//       message: "Equipment added successfully by admin",
//       data: savedEquipment
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: `Validation Error: ${error.message}`
//     });
//   }
// };


exports.addEquipment = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      basePrice, 
      equipmentCharges, 
      cities, 
      image,
      minDuration,
      maxDuration 
    } = req.body;

    // 1. Validate that cities exist and are ACTIVE
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ success: false, message: "At least one city ID is required." });
    }

    // Fetch cities that match the IDs AND are active
    const activeCities = await City.find({ 
      _id: { $in: cities },
      isActive: true 
    }).select('name');
    
    // Check if any provided IDs were missing or inactive
    if (activeCities.length !== cities.length) {
      const foundIds = activeCities.map(c => c._id.toString());
      const invalidIds = cities.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({ 
        success: false, 
        message: "Some cities are invalid or inactive",
        invalidIds 
      });
    }

    // 2. Build the equipment document
    const newEquipment = new Service({
      name,
      description,
      category: 'equipment',
      basePrice,
      equipmentCharges: equipmentCharges || 0,
      cities, // Storing the validated ObjectIds
      image,
      modes: ["Home Service"],
      slotConfig: {
        equipmentBooking: {
          enabled: true,
          minDuration: minDuration || 60,
          maxDuration: maxDuration || 1440,
          available24x7: true
        }
      },
      createdBy: {
        userId: req.user.id,
        userModel: req.user.role === 'superAdmin' ? 'SuperAdmin' : 'Admin',
        name: req.user.firstName,
        email: req.user.email
      }
    });

    const savedEquipment = await newEquipment.save();

    res.status(201).json({
      success: true,
      message: `Equipment added successfully for ${activeCities.map(c => c.name).join(', ')}`,
      data: savedEquipment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Validation Error: ${error.message}`
    });
  }
};


// exports.addEquipment = async (req, res) => {
//   try {
//     const { 
//       name, 
//       description, 
//       basePrice, 
//       equipmentCharges, 
//       cities, 
//       image,
//       minDuration,
//       maxDuration 
//     } = req.body;

//     // 1. City ID Validation Logic
//     if (!cities || !Array.isArray(cities) || cities.length === 0) {
//       return res.status(400).json({ success: false, message: "At least one valid city is required." });
//     }

//     // Check if provided city IDs exist in the City collection
//     const validCities = await City.find({ _id: { $in: cities } }).select('_id');
    
//     if (validCities.length !== cities.length) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "One or more provided city IDs are invalid or not available in the city module." 
//       });
//     }

//     // 2. Build and save the equipment document
//     const newEquipment = new Service({
//       name,
//       description,
//       category: 'equipment',
//       basePrice,
//       equipmentCharges: equipmentCharges || 0,
//       cities, // These are now verified to exist
//       image,
//       modes: ["Home Service"],
//       slotConfig: {
//         equipmentBooking: {
//           enabled: true,
//           minDuration: minDuration || 60,
//           maxDuration: maxDuration || 1440,
//           available24x7: true
//         }
//       },
//       createdBy: {
//         userId: req.user.id,
//         userModel: req.user.role === 'superAdmin' ? 'SuperAdmin' : 'Admin',
//         name: req.user.firstName,
//         email: req.user.email
//       }
//     });

//     const savedEquipment = await newEquipment.save();

//     res.status(201).json({
//       success: true,
//       message: "Equipment added successfully with valid city mappings",
//       data: savedEquipment
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: `Validation Error: ${error.message}`
//     });
//   }
// };
module.exports = exports;


