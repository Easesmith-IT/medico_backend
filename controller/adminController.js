


const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');  

const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Admin = require('../models/adminModel');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies
} = require('../middleware/auth');



exports.adminSignup = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and first name are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = new Admin({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName: lastName || '',
      status: 'active'
    });

    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: newAdmin._id,
        email: newAdmin.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    // Set cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        adminId: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message
    });
  }
};


// Admin Login
exports.adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Find admin and include password & tokenVersion
  const admin = await Admin.findOne({ email }).select('+password +tokenVersion');

  if (!admin) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3) Compare password
  const isPasswordCorrect = await admin.comparePassword(password, admin.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 4) Check if admin is active
  if (!admin.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // 5) Generate tokens
  const accessToken = generateAccessToken(admin._id, 'admin', admin.tokenVersion);
  const refreshToken = generateRefreshToken(admin._id, 'admin', admin.tokenVersion);

  // 6) Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // 7) Remove password from output
  admin.password = undefined;
  admin.tokenVersion = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: admin,
      role: 'admin'
    }
  });
});

// Admin Logout
exports.adminLogout = catchAsync(async (req, res, next) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Admin Logout All Devices
exports.adminLogoutAll = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  // Validate input
  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  // Find admin
  const admin = await Admin.findOne({ phone }).select('+tokenVersion');
  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Increment tokenVersion to invalidate all tokens
  admin.tokenVersion += 1;
  await admin.save({ validateBeforeSave: false });

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully'
  });
});
