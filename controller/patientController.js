const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies
} = require('../middleware/auth');

// Patient Signup
exports.patientSignup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    bloodGroup,
    emergencyContact
  } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password) {
    return next(new AppError('Please provide all required fields: name, email, phone, password', 400));
  }

  // Check if patient already exists
  const existingPatient = await Patient.findOne({ $or: [{ email }, { phone }] });
  
  if (existingPatient) {
    if (existingPatient.email === email) {
      return next(new AppError('Patient with this email already exists', 400));
    }
    if (existingPatient.phone === phone) {
      return next(new AppError('Patient with this phone number already exists', 400));
    }
  }

  // Create new patient
  const newPatient = await Patient.create({
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    address,
    bloodGroup,
    emergencyContact,
    tokenVersion: 0
  });

  // Generate tokens
  const accessToken = generateAccessToken(newPatient._id, 'patient', newPatient.tokenVersion);
  const refreshToken = generateRefreshToken(newPatient._id, 'patient', newPatient.tokenVersion);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Remove password from output
  newPatient.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'Patient registration successful',
    data: {
      user: newPatient
    }
  });
});

// Patient Login
exports.patientLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Find patient and include password & tokenVersion
  const patient = await Patient.findOne({ email }).select('+password +tokenVersion');

  if (!patient) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3) Compare password
  const isPasswordCorrect = await patient.comparePassword(password, patient.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 4) Check if patient is active
  if (!patient.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // 5) Generate tokens
  const accessToken = generateAccessToken(patient._id, 'patient', patient.tokenVersion);
  const refreshToken = generateRefreshToken(patient._id, 'patient', patient.tokenVersion);

  // 6) Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // 7) Remove password from output
  patient.password = undefined;
  patient.tokenVersion = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: patient,
      role: 'patient'
    }
  });
});

// Patient Logout
exports.patientLogout = catchAsync(async (req, res, next) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Patient Logout All Devices
exports.patientLogoutAll = catchAsync(async (req, res, next) => {
  const { phone } = req.body;

  // Validate input
  if (!phone) {
    return next(new AppError('Please provide phone number', 400));
  }

  // Find patient
  const patient = await Patient.findOne({ phone }).select('+tokenVersion');
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  // Increment tokenVersion to invalidate all tokens
  patient.tokenVersion += 1;
  await patient.save({ validateBeforeSave: false });

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully'
  });
});

// Get Patient Profile (Current Logged In)
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const patient = await Patient.findById(req.user._id)
    .select('-password -tokenVersion')
    .populate('following', 'name specialization profilePhoto averageRating');

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      patient
    }
  });
});

// Update Patient Profile
exports.updatePatient = catchAsync(async (req, res, next) => {
  // Don't allow password, role, tokenVersion updates here
  const { password, role, tokenVersion, ...updateData } = req.body;

  const updatedPatient = await Patient.findByIdAndUpdate(
    req.user._id,
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
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      patient: updatedPatient
    }
  });
});

// Update Medical History
exports.updateMedicalHistory = catchAsync(async (req, res, next) => {
  const { condition, diagnosedDate, notes } = req.body;

  if (!condition) {
    return next(new AppError('Please provide condition details', 400));
  }

  const patient = await Patient.findById(req.user._id);

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
    status: 'success',
    message: 'Medical history updated successfully',
    data: {
      medicalHistory: patient.medicalHistory
    }
  });
});

// Delete Medical History Entry
exports.deleteMedicalHistory = catchAsync(async (req, res, next) => {
  const { historyId } = req.params;

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.medicalHistory.pull(historyId);
  await patient.save();

  res.status(200).json({
    status: 'success',
    message: 'Medical history entry deleted successfully',
    data: {
      medicalHistory: patient.medicalHistory
    }
  });
});

// Add Allergy
exports.addAllergy = catchAsync(async (req, res, next) => {
  const { allergy } = req.body;

  if (!allergy) {
    return next(new AppError('Please provide allergy details', 400));
  }

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.allergies.includes(allergy)) {
    return next(new AppError('Allergy already exists', 400));
  }

  patient.allergies.push(allergy);
  await patient.save();

  res.status(200).json({
    status: 'success',
    message: 'Allergy added successfully',
    data: {
      allergies: patient.allergies
    }
  });
});

// Remove Allergy
exports.removeAllergy = catchAsync(async (req, res, next) => {
  const { allergy } = req.body;

  if (!allergy) {
    return next(new AppError('Please provide allergy to remove', 400));
  }

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.allergies = patient.allergies.filter(a => a !== allergy);
  await patient.save();

  res.status(200).json({
    status: 'success',
    message: 'Allergy removed successfully',
    data: {
      allergies: patient.allergies
    }
  });
});

// Add Current Medication
exports.addMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;

  if (!medication) {
    return next(new AppError('Please provide medication details', 400));
  }

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  if (patient.currentMedications.includes(medication)) {
    return next(new AppError('Medication already exists', 400));
  }

  patient.currentMedications.push(medication);
  await patient.save();

  res.status(200).json({
    status: 'success',
    message: 'Medication added successfully',
    data: {
      currentMedications: patient.currentMedications
    }
  });
});

// Remove Current Medication
exports.removeMedication = catchAsync(async (req, res, next) => {
  const { medication } = req.body;

  if (!medication) {
    return next(new AppError('Please provide medication to remove', 400));
  }

  const patient = await Patient.findById(req.user._id);

  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }

  patient.currentMedications = patient.currentMedications.filter(m => m !== medication);
  await patient.save();

  res.status(200).json({
    status: 'success',
    message: 'Medication removed successfully',
    data: {
      currentMedications: patient.currentMedications
    }
  });
});

// Follow Doctor
exports.followDoctor = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }

  const patient = await Patient.findById(req.user._id);

  // Check if already following
  if (patient.following.includes(doctorId)) {
    return next(new AppError('Already following this doctor', 400));
  }

  // Add to patient's following list
  patient.following.push(doctorId);
  patient.followingCount += 1;
  await patient.save();

  // Add to doctor's followers list
  doctor.followers.push(req.user._id);
  doctor.followersCount += 1;
  await doctor.save();

  res.status(200).json({
    status: 'success',
    message: 'Doctor followed successfully',
    data: {
      following: patient.following
    }
  });
});

// Unfollow Doctor
exports.unfollowDoctor = catchAsync(async (req, res, next) => {
  const { doctorId } = req.params;

  const patient = await Patient.findById(req.user._id);

  // Check if following
  if (!patient.following.includes(doctorId)) {
    return next(new AppError('Not following this doctor', 400));
  }

  // Remove from patient's following list
  patient.following.pull(doctorId);
  patient.followingCount -= 1;
  await patient.save();

  // Remove from doctor's followers list
  await Doctor.findByIdAndUpdate(doctorId, {
    $pull: { followers: req.user._id },
    $inc: { followersCount: -1 }
  });

  res.status(200).json({
    status: 'success',
    message: 'Doctor unfollowed successfully',
    data: {
      following: patient.following
    }
  });
});
