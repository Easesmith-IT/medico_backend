// controllers/doctorController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Doctor = require('../models/doctorModel');
const { sendOtp, verifyOtp, resendOtp, clearOtp } = require('../utils/otpUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies
} = require('../middleware/auth');

// ============================================
// OTP LOGIN ONLY
// ============================================

/**
 * Doctor: Send OTP (Post-Login)
 */
const doctorPostLogin = catchAsync(async (req, res, next) => {
  const { phone, role } = req.body;

  // Validate input
  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  if (role !== 'doctor') {
    return next(new AppError('Invalid role. Expected: doctor', 400));
  }

  // Check if doctor exists
  const doctor = await Doctor.findOne({ phone });
  if (!doctor) {
    return next(new AppError('Doctor not found. Please register first.', 404));
  }

  // Check if doctor is active
  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  // Check verification status
  if (doctor.verificationStatus !== 'approved') {
    return next(new AppError(`Your account is ${doctor.verificationStatus}. Please wait for admin approval.`, 403));
  }

  // Send OTP using utility function
  const isOtpSent = await sendOtp(phone);

  if (!isOtpSent) {
    return next(new AppError('Failed to send OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your registered phone',
    data: { phone, role: 'doctor' }
  });
});

/**
 * Doctor: Verify OTP
 */
const doctorVerifyOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;

  // Validate input
  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  // Verify OTP using utility function
  const isOtpValid = await verifyOtp(phone, otp);

  if (!isOtpValid) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Find doctor
  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Check if doctor is active
  if (!doctor.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  // Generate tokens
  const accessToken = generateAccessToken(doctor._id, 'doctor', doctor.tokenVersion);
  const refreshToken = generateRefreshToken(doctor._id, 'doctor', doctor.tokenVersion);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Send response
  res.status(200).json({
    success: true,
    message: 'OTP verified. Logged in successfully.',
    data: {
      doctor: {
        _id: doctor._id,
        phone: doctor.phone,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor',
        verificationStatus: doctor.verificationStatus
      }
    }
  });
});

/**
 * Doctor: Resend OTP
 */
const doctorResendOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  // Check if doctor exists
  const doctor = await Doctor.findOne({ phone });
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Resend OTP using utility function
  const isOtpResent = await resendOtp(phone);

  if (!isOtpResent) {
    return next(new AppError('Failed to resend OTP. Please try again.', 400));
  }

  res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
    data: { phone }
  });
});

/**
 * Doctor: Logout (Single Device)
 */
const doctorLogout = catchAsync(async (req, res, next) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Doctor: Logout All Devices
 */
const doctorLogoutAll = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  // Validate input
  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  // Find doctor
  const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  // Increment tokenVersion to invalidate all tokens
  doctor.tokenVersion += 1;
  await doctor.save({ validateBeforeSave: false });

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully'
  });
});

// ============================================
// DOCTOR SIGNUP & PROFILE
// ============================================

/**
 * Doctor Signup
 */
const doctorSignup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    medicalRegistrationNumber,
    issuingMedicalCouncil,
    specialization,
    yearsOfExperience,
    consultationFees,
    degrees,
    university,
    graduationYear,
    currentWorkplace,
    designation,
    professionalBio
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password || !medicalRegistrationNumber || !issuingMedicalCouncil || !specialization) {
    return next(new AppError('Please provide all required fields: name, email, phone, password, medicalRegistrationNumber, issuingMedicalCouncil, specialization', 400));
  }

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({ 
    $or: [{ email }, { phone }, { medicalRegistrationNumber }] 
  });
  
  if (existingDoctor) {
    if (existingDoctor.email === email) {
      return next(new AppError('Doctor with this email already exists', 400));
    }
    if (existingDoctor.phone === phone) {
      return next(new AppError('Doctor with this phone number already exists', 400));
    }
    if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
      return next(new AppError('Doctor with this medical registration number already exists', 400));
    }
  }

  // Create new doctor
  const newDoctor = await Doctor.create({
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    medicalRegistrationNumber,
    issuingMedicalCouncil,
    specialization,
    yearsOfExperience: yearsOfExperience || 0,
    consultationFees: consultationFees || 0,
    degrees: degrees || [],
    university,
    graduationYear,
    currentWorkplace,
    designation,
    professionalBio,
    tokenVersion: 0,
    verificationStatus: 'pending'
  });

  // Generate tokens
  const accessToken = generateAccessToken(newDoctor._id, 'doctor', newDoctor.tokenVersion);
  const refreshToken = generateRefreshToken(newDoctor._id, 'doctor', newDoctor.tokenVersion);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Remove password from output
  newDoctor.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'Doctor registration successful. Awaiting admin verification.',
    data: {
      user: newDoctor
    }
  });
});

/**
 * Get My Profile (Logged In Doctor)
 */
const getMyProfile = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user._id).select('-password -tokenVersion');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doctor
    }
  });
});

/**
 * Update Doctor Profile
 */
const updateDoctor = catchAsync(async (req, res, next) => {
  // Don't allow password, role, tokenVersion, verificationStatus, medicalRegistrationNumber updates here
  const { password, role, tokenVersion, verificationStatus, medicalRegistrationNumber, ...updateData } = req.body;

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -tokenVersion');

  if (!updatedDoctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      doctor: updatedDoctor
    }
  });
});

// ============================================
// PUBLIC DOCTOR ENDPOINTS
// ============================================

/**
 * Get All Doctors (Public)
 */
const getAllDoctors = catchAsync(async (req, res, next) => {
  const { specialization, city, page = 1, limit = 10 } = req.query;

  // Build filter - only show verified and active doctors
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

  // Pagination
  const skip = (page - 1) * limit;

  const doctors = await Doctor.find(filter)
    .select('-password -tokenVersion -verificationDocuments')
    .skip(skip)
    .limit(parseInt(limit))
    .sort('-averageRating -createdAt');

  const total = await Doctor.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      doctors
    }
  });
});

/**
 * Get Doctor By ID (Public)
 */
const getDoctorById = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .select('-password -tokenVersion -verificationDocuments');

  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  if (doctor.verificationStatus !== 'approved') {
    return next(new AppError('Doctor profile is not publicly available', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      doctor
    }
  });
});

/**
 * Get Doctors By Specialization
 */
const getDoctorsBySpecialization = catchAsync(async (req, res, next) => {
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
    status: 'success',
    results: doctors.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: {
      doctors
    }
  });
});

// ============================================
// AVAILABILITY MANAGEMENT
// ============================================

/**
 * Update Availability
 */
const updateAvailability = catchAsync(async (req, res, next) => {
  const { days, timeSlots } = req.body;

  if (!days || !timeSlots) {
    return next(new AppError('Please provide days and timeSlots', 400));
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.user._id,
    { availability: { days, timeSlots } },
    { new: true, runValidators: true }
  ).select('-password -tokenVersion');

  if (!updatedDoctor) {
    return next(new AppError('Doctor not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Availability updated successfully',
    data: {
      doctor: updatedDoctor
    }
  });
});

// ============================================
// CLINIC MANAGEMENT
// ============================================

/**
 * Add Clinic
 */
const addClinic = catchAsync(async (req, res, next) => {
  const clinicData = req.body;

  if (!clinicData.clinicName || !clinicData.address) {
    return next(new AppError('Please provide clinic name and address', 400));
  }

  const doctor = await Doctor.findById(req.user._id);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.clinics.push(clinicData);
  await doctor.save();

  res.status(201).json({
    status: 'success',
    message: 'Clinic added successfully',
    data: {
      clinics: doctor.clinics
    }
  });
});

/**
 * Update Clinic
 */
const updateClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;
  const updateData = req.body;

  const doctor = await Doctor.findById(req.user._id);
  
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
    status: 'success',
    message: 'Clinic updated successfully',
    data: {
      clinic
    }
  });
});

/**
 * Delete Clinic
 */
const deleteClinic = catchAsync(async (req, res, next) => {
  const { clinicId } = req.params;

  const doctor = await Doctor.findById(req.user._id);
  
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  doctor.clinics.pull(clinicId);
  await doctor.save();

  res.status(200).json({
    status: 'success',
    message: 'Clinic deleted successfully',
    data: null
  });
});

// ============================================
// VERIFICATION DOCUMENTS
// ============================================

/**
 * Upload Verification Documents
 */
const uploadVerificationDocuments = catchAsync(async (req, res, next) => {
  const { identityProof, degreesCertificates, medicalCouncilRegistration } = req.body;

  const doctor = await Doctor.findById(req.user._id);
  
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
    doctor.verificationDocuments.medicalCouncilRegistration = medicalCouncilRegistration;
  }

  await doctor.save();

  res.status(200).json({
    status: 'success',
    message: 'Verification documents uploaded successfully',
    data: {
      verificationDocuments: doctor.verificationDocuments
    }
  });
});

// ============================================
// MODULE EXPORTS - All functions at the end
// ============================================

// OTP Login Functions
exports.doctorPostLogin = doctorPostLogin;
exports.doctorVerifyOtp = doctorVerifyOtp;
exports.doctorResendOtp = doctorResendOtp;
exports.doctorLogout = doctorLogout;
exports.doctorLogoutAll = doctorLogoutAll;

// Signup & Profile Functions
exports.doctorSignup = doctorSignup;
exports.getMyProfile = getMyProfile;
exports.updateDoctor = updateDoctor;

// Public Doctor Endpoints
exports.getAllDoctors = getAllDoctors;
exports.getDoctorById = getDoctorById;
exports.getDoctorsBySpecialization = getDoctorsBySpecialization;

// Availability Management
exports.updateAvailability = updateAvailability;

// Clinic Management
exports.addClinic = addClinic;
exports.updateClinic = updateClinic;
exports.deleteClinic = deleteClinic;

// Verification Documents
exports.uploadVerificationDocuments = uploadVerificationDocuments;










































































// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const Doctor = require('../models/doctorModel');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   setTokenCookies
// } = require('../middleware/auth');

// // Doctor Signup
// exports.doctorSignup = catchAsync(async (req, res, next) => {
//   const {
//     name,
//     email,
//     phone,
//     password,
//     dateOfBirth,
//     gender,
//     address,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     yearsOfExperience,
//     consultationFees,
//     degrees,
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio
//   } = req.body;

//   // Validate required fields
//   if (!name || !email || !phone || !password || !medicalRegistrationNumber || !issuingMedicalCouncil || !specialization) {
//     return next(new AppError('Please provide all required fields: name, email, phone, password, medicalRegistrationNumber, issuingMedicalCouncil, specialization', 400));
//   }

//   // Check if doctor already exists
//   const existingDoctor = await Doctor.findOne({ 
//     $or: [{ email }, { phone }, { medicalRegistrationNumber }] 
//   });
  
//   if (existingDoctor) {
//     if (existingDoctor.email === email) {
//       return next(new AppError('Doctor with this email already exists', 400));
//     }
//     if (existingDoctor.phone === phone) {
//       return next(new AppError('Doctor with this phone number already exists', 400));
//     }
//     if (existingDoctor.medicalRegistrationNumber === medicalRegistrationNumber) {
//       return next(new AppError('Doctor with this medical registration number already exists', 400));
//     }
//   }

//   // Create new doctor
//   const newDoctor = await Doctor.create({
//     name,
//     email,
//     phone,
//     password,
//     dateOfBirth,
//     gender,
//     address,
//     medicalRegistrationNumber,
//     issuingMedicalCouncil,
//     specialization,
//     yearsOfExperience: yearsOfExperience || 0,
//     consultationFees: consultationFees || 0,
//     degrees: degrees || [],
//     university,
//     graduationYear,
//     currentWorkplace,
//     designation,
//     professionalBio,
//     tokenVersion: 0,
//     verificationStatus: 'pending'
//   });

//   // Generate tokens
//   const accessToken = generateAccessToken(newDoctor._id, 'doctor', newDoctor.tokenVersion);
//   const refreshToken = generateRefreshToken(newDoctor._id, 'doctor', newDoctor.tokenVersion);

//   // Set cookies
//   setTokenCookies(res, accessToken, refreshToken);

//   // Remove password from output
//   newDoctor.password = undefined;

//   res.status(201).json({
//     status: 'success',
//     message: 'Doctor registration successful. Awaiting admin verification.',
//     data: {
//       user: newDoctor
//     }
//   });
// });

// // Doctor Login
// exports.doctorLogin = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   // 1) Validate input
//   if (!email || !password) {
//     return next(new AppError('Please provide email and password', 400));
//   }

//   // 2) Find doctor and include password & tokenVersion
//   const doctor = await Doctor.findOne({ email }).select('+password +tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 3) Compare password
//   const isPasswordCorrect = await doctor.comparePassword(password, doctor.password);
//   if (!isPasswordCorrect) {
//     return next(new AppError('Invalid email or password', 401));
//   }

//   // 4) Check if doctor is active
//   if (!doctor.isActive) {
//     return next(new AppError('Your account has been deactivated. Please contact support.', 403));
//   }

//   // 5) Check verification status
//   if (doctor.verificationStatus !== 'approved') {
//     return next(new AppError(`Your account is ${doctor.verificationStatus}. Please wait for admin approval.`, 403));
//   }

//   // 6) Generate tokens
//   const accessToken = generateAccessToken(doctor._id, 'doctor', doctor.tokenVersion);
//   const refreshToken = generateRefreshToken(doctor._id, 'doctor', doctor.tokenVersion);

//   // 7) Set cookies
//   setTokenCookies(res, accessToken, refreshToken);

//   // 8) Remove password from output
//   doctor.password = undefined;
//   doctor.tokenVersion = undefined;

//   res.status(200).json({
//     status: 'success',
//     message: 'Login successful',
//     data: {
//       user: doctor,
//       role: 'doctor'
//     }
//   });
// });

// // Doctor Logout
// exports.doctorLogout = catchAsync(async (req, res, next) => {
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     status: 'success',
//     message: 'Logged out successfully'
//   });
// });

// // Doctor Logout All Devices
// exports.doctorLogoutAll = catchAsync(async (req, res, next) => {
//   const { phone } = req.body;

//   // Validate input
//   if (!phone) {
//     return next(new AppError('Please provide phone number', 400));
//   }

//   // Find doctor
//   const doctor = await Doctor.findOne({ phone }).select('+tokenVersion');
//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   // Increment tokenVersion to invalidate all tokens
//   doctor.tokenVersion += 1;
//   await doctor.save({ validateBeforeSave: false });

//   // Clear cookies
//   res.clearCookie('accessToken');
//   res.clearCookie('refreshToken');

//   res.status(200).json({
//     status: 'success',
//     message: 'Logged out from all devices successfully'
//   });
// });

// // Get All Doctors (Public)
// exports.getAllDoctors = catchAsync(async (req, res, next) => {
//   const { specialization, city, page = 1, limit = 10 } = req.query;

//   // Build filter - only show verified and active doctors
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

//   // Pagination
//   const skip = (page - 1) * limit;

//   const doctors = await Doctor.find(filter)
//     .select('-password -tokenVersion -verificationDocuments')
//     .skip(skip)
//     .limit(parseInt(limit))
//     .sort('-averageRating -createdAt');

//   const total = await Doctor.countDocuments(filter);

//   res.status(200).json({
//     status: 'success',
//     results: doctors.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: {
//       doctors
//     }
//   });
// });

// // Get Doctor By ID (Public)
// exports.getDoctorById = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findById(req.params.id)
//     .select('-password -tokenVersion -verificationDocuments');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   if (doctor.verificationStatus !== 'approved') {
//     return next(new AppError('Doctor profile is not publicly available', 403));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       doctor
//     }
//   });
// });

// // Get Doctor Profile (Current Logged In)
// exports.getMyProfile = catchAsync(async (req, res, next) => {
//   const doctor = await Doctor.findById(req.user._id).select('-password -tokenVersion');

//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       doctor
//     }
//   });
// });

// // Update Doctor Profile
// exports.updateDoctor = catchAsync(async (req, res, next) => {
//   // Don't allow password, role, tokenVersion, verificationStatus, medicalRegistrationNumber updates here
//   const { password, role, tokenVersion, verificationStatus, medicalRegistrationNumber, ...updateData } = req.body;

//   const updatedDoctor = await Doctor.findByIdAndUpdate(
//     req.user._id,
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
//     status: 'success',
//     message: 'Profile updated successfully',
//     data: {
//       doctor: updatedDoctor
//     }
//   });
// });

// // Update Availability
// exports.updateAvailability = catchAsync(async (req, res, next) => {
//   const { days, timeSlots } = req.body;

//   if (!days || !timeSlots) {
//     return next(new AppError('Please provide days and timeSlots', 400));
//   }

//   const updatedDoctor = await Doctor.findByIdAndUpdate(
//     req.user._id,
//     { availability: { days, timeSlots } },
//     { new: true, runValidators: true }
//   ).select('-password -tokenVersion');

//   if (!updatedDoctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     message: 'Availability updated successfully',
//     data: {
//       doctor: updatedDoctor
//     }
//   });
// });

// // Get Doctors By Specialization
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
//     status: 'success',
//     results: doctors.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     data: {
//       doctors
//     }
//   });
// });

// // Add Clinic
// exports.addClinic = catchAsync(async (req, res, next) => {
//   const clinicData = req.body;

//   if (!clinicData.clinicName || !clinicData.address) {
//     return next(new AppError('Please provide clinic name and address', 400));
//   }

//   const doctor = await Doctor.findById(req.user._id);
  
//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.push(clinicData);
//   await doctor.save();

//   res.status(201).json({
//     status: 'success',
//     message: 'Clinic added successfully',
//     data: {
//       clinics: doctor.clinics
//     }
//   });
// });

// // Update Clinic
// exports.updateClinic = catchAsync(async (req, res, next) => {
//   const { clinicId } = req.params;
//   const updateData = req.body;

//   const doctor = await Doctor.findById(req.user._id);
  
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
//     status: 'success',
//     message: 'Clinic updated successfully',
//     data: {
//       clinic
//     }
//   });
// });

// // Delete Clinic
// exports.deleteClinic = catchAsync(async (req, res, next) => {
//   const { clinicId } = req.params;

//   const doctor = await Doctor.findById(req.user._id);
  
//   if (!doctor) {
//     return next(new AppError('Doctor not found', 404));
//   }

//   doctor.clinics.pull(clinicId);
//   await doctor.save();

//   res.status(200).json({
//     status: 'success',
//     message: 'Clinic deleted successfully',
//     data: null
//   });
// });

// // Upload Verification Documents (for admin verification)
// exports.uploadVerificationDocuments = catchAsync(async (req, res, next) => {
//   const { identityProof, degreesCertificates, medicalCouncilRegistration } = req.body;

//   const doctor = await Doctor.findById(req.user._id);
  
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
//     status: 'success',
//     message: 'Verification documents uploaded successfully',
//     data: {
//       verificationDocuments: doctor.verificationDocuments
//     }
//   });
// });
