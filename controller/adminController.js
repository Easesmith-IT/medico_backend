// controllers/adminController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Otp = require('../models/otpModel');
const { sendOtp } = require('../utils/otpUtils');
const bcrypt = require('bcryptjs');

// Import token utilities - EXACTLY like doctorController
const {
  generateAccessToken,
  generateRefreshToken,
  generateOtpToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies
} = require('../utils/tokenUtils');

// ============================================
// ADMIN SIGNUP (superAdmin or subAdmin)
// ============================================

exports.adminSignup = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phone, role = 'superAdmin' } = req.body;

  console.log('');
  console.log(`${role.toUpperCase()} SIGNUP - STEP 1: Registration`);
  console.log('='.repeat(60));

  // Validation
  if (!email || !password || !firstName) {
    return next(
      new AppError('Email, password, and first name are required', 400)
    );
  }

  // Validate role
  if (role !== 'superAdmin' && role !== 'subAdmin') {
    return next(new AppError('Invalid role. Must be superAdmin or subAdmin', 400));
  }

  console.log(`Email: ${email}`);
  console.log(`Name: ${firstName} ${lastName || ''}`);
  console.log(`Role: ${role}`);

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }]
  });

  if (existingAdmin) {
    if (existingAdmin.email === email.toLowerCase()) {
      return next(
        new AppError(`${role} with this email already exists`, 409)
      );
    }
    if (existingAdmin.phone === phone) {
      return next(
        new AppError(`${role} with this phone already exists`, 409)
      );
    }
  }

  // Hash password using bcryptjs (10 rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin/subadmin
  const newAdmin = new Admin({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName: lastName || '',
    phone,
    role: role, // Store role (superAdmin or subAdmin)
    status: 'active',
    isActive: true,
    tokenVersion: 0
  });

  await newAdmin.save();
  console.log(`SUCCESS: ${role} created in database`);

  // If phone is provided, send OTP
  if (phone) {
    const isOtpSent = await sendOtp(phone);
    
    if (!isOtpSent) {
      await Admin.findByIdAndDelete(newAdmin._id);
      return next(new AppError('Failed to send OTP. Please try again.', 400));
    }

    console.log('SUCCESS: OTP sent to phone');
    console.log('='.repeat(60));
    console.log('');

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully. OTP sent to your phone.`,
      data: {
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          phone: newAdmin.phone,
          role: newAdmin.role
        },
        nextStep: 'Verify OTP sent to your phone'
      }
    });
  }

  console.log('='.repeat(60));
  console.log('');

  // If no phone, return success without OTP
  res.status(201).json({
    success: true,
    message: `${role} registered successfully`,
    data: {
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        role: newAdmin.role
      }
    }
  });
});

// ============================================
// ADMIN LOGIN (Email + Password + OTP)
// ============================================

exports.adminLogin = catchAsync(async (req, res, next) => {
  const { email, password, phone } = req.body;

  console.log('');
  console.log('ADMIN LOGIN - STEP 1: Validate Credentials');
  console.log('='.repeat(60));

  // Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  console.log(`Email: ${email}`);

  // Find admin and include password & tokenVersion
  const admin = await Admin.findOne({ email: email.toLowerCase() })
    .select('+password +tokenVersion');

  if (!admin) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Compare password using bcryptjs
  const isPasswordCorrect = await bcrypt.compare(password, admin.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if admin is active
  if (!admin.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 403)
    );
  }

  console.log(`SUCCESS: Credentials validated for ${admin.role}`);

  // Get admin role (superAdmin or subAdmin)
  const adminRole = admin.role || 'superAdmin';

  // If phone is available, send OTP
  if (admin.phone || phone) {
    const phoneToUse = admin.phone || phone;
    const isOtpSent = await sendOtp(phoneToUse);

    if (!isOtpSent) {
      return next(new AppError('Failed to send OTP. Please try again.', 400));
    }

    console.log('SUCCESS: OTP sent to phone');
    console.log('='.repeat(60));
    console.log('');

    return res.status(200).json({
      success: true,
      message: 'Credentials validated. OTP sent to your phone.',
      data: {
        phone: phoneToUse,
        role: adminRole,
        nextStep: 'Verify OTP'
      }
    });
  }

  // If no phone, generate tokens directly using utils
  const accessToken = generateAccessToken(admin._id, adminRole, admin.tokenVersion);
  const refreshToken = generateRefreshToken(admin._id, adminRole, admin.tokenVersion);

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  const tokens = setAuthCookies(res, accessToken, refreshToken);

  // Remove password from output
  admin.password = undefined;
  admin.tokenVersion = undefined;

  console.log('SUCCESS: Tokens generated (no OTP required)');
  console.log('='.repeat(60));
  console.log('');

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      },
      role: adminRole
    }
  });
});

// ============================================
// VERIFY LOGIN OTP
// ============================================

exports.verifyLoginOtp = catchAsync(async (req, res, next) => {
  const { phone, otp, email } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  console.log('');
  console.log('ADMIN LOGIN - STEP 2: Verify OTP');
  console.log('='.repeat(60));
  console.log(`Phone: ${phone}`);

  // Verify OTP
  const otpDoc = await Otp.findOne({ phone });

  if (
    !otpDoc ||
    otpDoc.otp !== parseInt(otp) ||
    otpDoc.otpExpiresAt < new Date()
  ) {
    console.log('ERROR: Invalid or expired OTP');
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Find admin
  let admin;
  if (email) {
    admin = await Admin.findOne({ email: email.toLowerCase() }).select('+tokenVersion');
  } else {
    admin = await Admin.findOne({ phone }).select('+tokenVersion');
  }

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  if (!admin.isActive) {
    return next(
      new AppError('Your account has been deactivated.', 403)
    );
  }

  // Delete OTP
  await Otp.deleteOne({ phone });
  console.log('SUCCESS: OTP verified');

  // Get admin role (superAdmin or subAdmin)
  const adminRole = admin.role || 'superAdmin';

  // Generate tokens using utility functions - 3 separate parameters (like doctor)
  const accessToken = generateAccessToken(admin._id, adminRole, admin.tokenVersion);
  const refreshToken = generateRefreshToken(admin._id, adminRole, admin.tokenVersion);

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

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
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        role: admin.role
      },
      role: adminRole
    }
  });
});

// ============================================
// RESEND LOGIN OTP
// ============================================

exports.resendLoginOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  const admin = await Admin.findOne({ phone });

  if (!admin) {
    return next(new AppError('Admin not found. Please register first.', 404));
  }

  if (!admin.isActive) {
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
// LOGOUT ALL DEVICES
// ============================================

exports.logoutAllDevices = catchAsync(async (req, res, next) => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    return next(new AppError('Please provide phone number or email', 400));
  }

  let admin;
  if (email) {
    admin = await Admin.findOne({ email: email.toLowerCase() }).select('+tokenVersion');
  } else {
    admin = await Admin.findOne({ phone }).select('+tokenVersion');
  }

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Increment tokenVersion to invalidate all tokens
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save({ validateBeforeSave: false });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// ============================================
// PROFILE MANAGEMENT
// ============================================

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.user?._id || req.user?.id).select(
    '-password -tokenVersion'
  );

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { admin }
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { password, tokenVersion, role, ...updateData } = req.body;

  const updatedAdmin = await Admin.findByIdAndUpdate(
    req.user?._id || req.user?.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');

  if (!updatedAdmin) {
    return next(new AppError('Admin not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { admin: updatedAdmin }
  });
});

// ============================================
// AUTHENTICATION STATUS
// ============================================

exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  console.log('=== DEBUG: Admin checkAuthStatus ===');
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

      const admin = await Admin.findById(decoded.id);

      if (admin && (decoded.role === 'superAdmin' || decoded.role === 'subAdmin')) {
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
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: decoded.role
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

      const admin = await Admin.findById(decoded.id).select('+tokenVersion');

      if (admin) {
        console.log('Token versions - Admin:', admin.tokenVersion, 'Decoded:', decoded.tokenVersion);
      }

      if (!admin || admin.tokenVersion !== decoded.tokenVersion || 
          (decoded.role !== 'superAdmin' && decoded.role !== 'subAdmin')) {
        return next(new AppError('Invalid refresh token - please login again', 401));
      }

      // Generate new access token using utils function
      const adminRole = admin.role || decoded.role;
      const newAccessToken = generateAccessToken(
        admin._id,
        adminRole,
        admin.tokenVersion
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
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: adminRole
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
// DOCTOR MANAGEMENT
// ============================================

exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.verificationStatus = status;

  const doctors = await Doctor.find(filter)
    .select('-password -tokenVersion')
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-createdAt');

  const total = await Doctor.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { doctors }
  });
});

exports.getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select(
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

exports.approveDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'approved', isActive: true },
    { new: true }
  ).select('-password -tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Doctor approved successfully',
    data: { doctor }
  });
});

exports.rejectDoctor = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'rejected', rejectionReason: reason },
    { new: true }
  ).select('-password -tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Doctor rejected successfully',
    data: { doctor }
  });
});

exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Doctor deleted successfully',
    data: null
  });
});

// ============================================
// PATIENT MANAGEMENT
// ============================================

exports.getAllPatients = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const patients = await Patient.find()
    .select('-password -tokenVersion')
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-createdAt');

  const total = await Patient.countDocuments();

  res.status(200).json({
    success: true,
    results: patients.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: { patients }
  });
});

exports.getPatientById = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id).select(
    '-password -tokenVersion'
  );

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { patient }
  });
});

exports.blockPatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password -tokenVersion');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Patient blocked successfully',
    data: { patient }
  });
});

exports.deletePatient = catchAsync(async (req, res, next) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Patient deleted successfully',
    data: null
  });
});

// ============================================
// DASHBOARD STATS
// ============================================

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const totalPatients = await Patient.countDocuments({ isActive: true });
  const pendingDoctors = await Doctor.countDocuments({
    verificationStatus: 'pending'
  });
  const approvedDoctors = await Doctor.countDocuments({
    verificationStatus: 'approved'
  });

  res.status(200).json({
    success: true,
    data: {
      totalDoctors,
      totalPatients,
      pendingDoctors,
      approvedDoctors
    }
  });
});

exports.getDoctorStats = catchAsync(async (req, res, next) => {
  const stats = {
    active: await Doctor.countDocuments({ isActive: true }),
    inactive: await Doctor.countDocuments({ isActive: false }),
    pending: await Doctor.countDocuments({ verificationStatus: 'pending' }),
    approved: await Doctor.countDocuments({ verificationStatus: 'approved' }),
    rejected: await Doctor.countDocuments({ verificationStatus: 'rejected' })
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});
