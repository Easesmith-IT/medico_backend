// // routes/doctorRoutes.js

// const express = require('express');
// const { protect } = require('../middleware/auth');
// const {
//   doctorPostLogin,
//   doctorVerifyOtp,
//   doctorResendOtp,
//   doctorLogout,
//   doctorLogoutAll,
//   doctorSignup,
//   getMyProfile,
//   updateDoctor,
//   getAllDoctors,
//   getDoctorById,
//   getDoctorsBySpecialization,
//   updateAvailability,
//   addClinic,
//   updateClinic,
//   deleteClinic,
//   uploadVerificationDocuments
// } = require('../controller/doctorController');

// const router = express.Router();

// // ========== PUBLIC ROUTES ==========
// router.post('/signup', doctorSignup);
// router.post('/post-login', doctorPostLogin);           // Send OTP
// router.post('/verify-otp', doctorVerifyOtp);           // Verify OTP
// router.post('/resend-otp', doctorResendOtp);           // Resend OTP

// // Public Doctor Endpoints
// router.get('/all', getAllDoctors);
// router.get('/by-specialization/:specialization', getDoctorsBySpecialization);
// router.get('/:id', getDoctorById);

// // ========== PROTECTED ROUTES ==========
// router.post('/logout', protect, doctorLogout);
// router.post('/logout-all', doctorLogoutAll);

// // Profile
// router.get('/profile/me', protect, getMyProfile);
// router.put('/profile/update', protect, updateDoctor);

// // Availability
// router.put('/availability/update', protect, updateAvailability);

// // Clinics
// router.post('/clinics/add', protect, addClinic);
// router.put('/clinics/:clinicId', protect, updateClinic);
// router.delete('/clinics/:clinicId', protect, deleteClinic);

// // Verification Documents
// router.post('/verification/upload-documents', protect, uploadVerificationDocuments);

// module.exports = router;




// routes/doctorRoutes.js

// routes/doctorRoutes.js



// routes/doctorRoute.js

const express = require('express');
const { protect } = require('../middleware/auth');

const {
  doctorSignup,
  verifySignupOtp,
  resendSignupOtp,
  doctorLogin,
  verifyLoginOtp,
  resendLoginOtp,
  logout,
  logoutAllDevices,
  getMyProfile,
  updateProfile,
  checkAuthStatus,
  updateAvailability,
  addClinic,
  updateClinic,
  deleteClinic,
  uploadVerificationDocuments,
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpecialization
} = require('../controller/doctorController');

const router = express.Router();

// ============================================
// AUTH ROUTES (POST)
// ============================================

router.post('/signup', doctorSignup);
router.post('/signup/verify-otp', verifySignupOtp);
router.post('/signup/resend-otp', resendSignupOtp);

router.post('/login', doctorLogin);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/login/resend-otp', resendLoginOtp);

router.post('/logout', logout);
router.post('/logout-all-devices', logoutAllDevices);

// ============================================
// CHECK AUTH (GET - Non-ID)
// ============================================

router.get('/check-auth', checkAuthStatus);

// ============================================
// PROTECTED ROUTES (Logged In Only)
// ============================================

router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateProfile);

router.put('/availability', protect, updateAvailability);

router.post('/clinic', protect, addClinic);
router.put('/clinic/:clinicId', protect, updateClinic);
router.delete('/clinic/:clinicId', protect, deleteClinic);

router.post('/verification-documents', protect, uploadVerificationDocuments);

// ============================================
// PUBLIC ROUTES - SPECIFIC PATTERNS (Before Generic)
// ============================================

router.get('/specialization/:specialization', getDoctorsBySpecialization);

// ============================================
// PUBLIC ROUTES - GENERIC PATTERNS (MUST BE LAST)
// ============================================

router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

module.exports = router;









// const express = require('express');
// const router = express.Router();
// const doctorController = require('../controller/doctorController');
// const protect = require('../middleware/auth');

// // ============================================
// // AUTH ROUTES (POST)
// // ============================================

// router.post('/signup', doctorController.doctorSignup);
// router.post('/signup/verify-otp', doctorController.verifySignupOtp);
// router.post('/signup/resend-otp', doctorController.resendSignupOtp);

// router.post('/login', doctorController.doctorLogin);
// router.post('/login/verify-otp', doctorController.verifyLoginOtp);
// router.post('/login/resend-otp', doctorController.resendLoginOtp);

// router.post('/logout', doctorController.logout);
// router.post('/logout-all-devices', doctorController.logoutAllDevices);

// // ============================================
// // CHECK AUTH (GET - Non-ID)
// // ============================================

// router.get('/check-auth', doctorController.checkAuthStatus);

// // ============================================
// // PROTECTED ROUTES (Logged In Only)
// // ============================================

// router.get('/profile', protect, doctorController.getMyProfile);
// router.put('/profile', protect, doctorController.updateProfile);

// router.put('/availability', protect, doctorController.updateAvailability);

// router.post('/clinic', protect, doctorController.addClinic);
// router.put('/clinic/:clinicId', protect, doctorController.updateClinic);
// router.delete('/clinic/:clinicId', protect, doctorController.deleteClinic);

// router.post('/verification-documents', protect, doctorController.uploadVerificationDocuments);

// // ============================================
// // PUBLIC ROUTES - SPECIFIC PATTERNS (Before Generic)
// // ============================================

// router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);

// // ============================================
// // PUBLIC ROUTES - GENERIC PATTERNS (MUST BE LAST)
// // ============================================

// router.get('/', doctorController.getAllDoctors);
// router.get('/:id', doctorController.getDoctorById);

// module.exports = router;

















































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
