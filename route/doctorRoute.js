// routes/doctorRoutes.js

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  doctorPostLogin,
  doctorVerifyOtp,
  doctorResendOtp,
  doctorLogout,
  doctorLogoutAll,
  doctorSignup,
  getMyProfile,
  updateDoctor,
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpecialization,
  updateAvailability,
  addClinic,
  updateClinic,
  deleteClinic,
  uploadVerificationDocuments
} = require('../controller/doctorController');

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.post('/signup', doctorSignup);
router.post('/post-login', doctorPostLogin);           // Send OTP
router.post('/verify-otp', doctorVerifyOtp);           // Verify OTP
router.post('/resend-otp', doctorResendOtp);           // Resend OTP

// Public Doctor Endpoints
router.get('/all', getAllDoctors);
router.get('/by-specialization/:specialization', getDoctorsBySpecialization);
router.get('/:id', getDoctorById);

// ========== PROTECTED ROUTES ==========
router.post('/logout', protect, doctorLogout);
router.post('/logout-all', doctorLogoutAll);

// Profile
router.get('/profile/me', protect, getMyProfile);
router.put('/profile/update', protect, updateDoctor);

// Availability
router.put('/availability/update', protect, updateAvailability);

// Clinics
router.post('/clinics/add', protect, addClinic);
router.put('/clinics/:clinicId', protect, updateClinic);
router.delete('/clinics/:clinicId', protect, deleteClinic);

// Verification Documents
router.post('/verification/upload-documents', protect, uploadVerificationDocuments);

module.exports = router;





















































// const express = require('express');
// const doctorController = require('../controller/doctorController');
// const { protect, restrictTo } = require('../middleware/auth');

// const router = express.Router();

// // Public Routes
// router.post('/signup', doctorController.doctorSignup);
// router.post('/login', doctorController.doctorLogin);
// router.post('/logout', doctorController.doctorLogout);
// router.post('/logout-all', doctorController.doctorLogoutAll);

// router.get('/', doctorController.getAllDoctors);
// router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);
// router.get('/:id', doctorController.getDoctorById);

// // Protected Routes (Doctor Only)
// router.use(protect, restrictTo('doctor'));

// router.get('/me/profile', doctorController.getMyProfile);
// router.patch('/me/update', doctorController.updateDoctor);
// router.patch('/me/availability', doctorController.updateAvailability);
// router.post('/me/verification-documents', doctorController.uploadVerificationDocuments);

// // Clinic Management
// router.post('/me/clinics', doctorController.addClinic);
// router.patch('/me/clinics/:clinicId', doctorController.updateClinic);
// router.delete('/me/clinics/:clinicId', doctorController.deleteClinic);

// module.exports = router;
