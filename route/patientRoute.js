// // route/patientRoute.js

// const express = require('express');
// const router = express.Router();
// const patientController = require('../controller/patientController');
// const { verifyAccessToken } = require('../middleware/auth');


// // PATIENT AUTH (Signup, Login, Logout)


// router.post('/signup', patientController.patientSignup);
// router.post('/verify-signup-otp', patientController.verifySignupOtp);
// router.post('/resend-signup-otp', patientController.resendSignupOtp);
// router.post('/login', patientController.patientLogin);
// router.post('/verify-login-otp', patientController.verifyLoginOtp);
// router.post('/resend-login-otp', patientController.resendLoginOtp);
// router.post('/check-auth', patientController.checkAuthStatus);
// router.post('/logout', verifyAccessToken, patientController.logout);


// // PATIENT OPERATIONS


// router.get('/', patientController.getAllPatients);
// router.get('/:id', patientController.getPatientById);
// router.get('/me', verifyAccessToken, patientController.getMyProfile);
// router.put('/profile', verifyAccessToken, patientController.updateProfile);

// module.exports = router;


const express = require('express');
const router = express.Router();
const patientController = require('../controller/patientController');
const { protect } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES - Signup with OTP
// ============================================
router.post('/signup', patientController.patientSignup);
router.post('/verify-signup-otp', patientController.verifySignupOtp);
router.post('/resend-signup-otp', patientController.resendSignupOtp);

// ============================================
// PUBLIC ROUTES - Login with OTP
// ============================================
router.post('/login', patientController.patientLogin);
router.post('/verify-login-otp', patientController.verifyLoginOtp);
router.post('/resend-login-otp', patientController.resendLoginOtp);

// ============================================
// PUBLIC ROUTES - Check Auth & Logout
// ============================================
router.post('/check-auth', patientController.checkAuthStatus);
router.post('/logout', patientController.logout);
router.post('/logout-all', patientController.patientLogoutAll);

// ============================================
// PROTECTED ROUTES - Profile Management
// ============================================
router.get('/profile', protect(), patientController.getMyProfile);
router.patch('/updateProfile/:id', protect(), patientController.updatePatient);

// ============================================
// PROTECTED ROUTES - Medical History
// ============================================
router.post('/medical-history', protect(), patientController.updateMedicalHistory);
router.delete('/medical-history/:historyId', protect(), patientController.deleteMedicalHistory);


// PROTECTED ROUTES - Allergies

router.post('/allergies', protect(), patientController.addAllergy);
router.delete('/allergies', protect(), patientController.removeAllergy);


// PROTECTED ROUTES - Medications

router.post('/medications', protect(), patientController.addMedication);
router.delete('/medications', protect(), patientController.removeMedication);

// ============================================
// PROTECTED ROUTES - Doctor Following
// ============================================
router.post('/follow/:doctorId', protect(), patientController.followDoctor);
router.delete('/unfollow/:doctorId', protect(), patientController.unfollowDoctor);


//getByID
router.get('/getById/:patientId',patientController.getPatientById);


module.exports = router;



















// const express = require('express');
// const router = express.Router();
// const patientController = require('../controller/patientController');
// const { protect } = require('../middleware/auth');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   setAuthCookies,
//   clearAuthCookies,
//   verifyToken
// } = require('../utils/tokenUtils');

// // ============================================
// // PUBLIC ROUTES (No authentication required)
// // ============================================

// // Authentication routes
// router.post('/signup', patientController.patientSignup);
// router.post('/login', patientController.patientLogin);
// router.post('/logout', patientController.patientLogout);
// router.post('/logout-all', patientController.patientLogoutAll);

// // Check authentication status
// router.get('/auth-status', patientController.checkAuthStatus);

// // ============================================
// // PROTECTED ROUTES (Authentication required)
// // ============================================

// // Profile management
// router.get('/profile', protect, patientController.getMyProfile);
// router.patch('/profile', protect, patientController.updatePatient);

// // Medical history management
// router.post('/medical-history', protect, patientController.updateMedicalHistory);
// router.delete('/medical-history/:historyId', protect, patientController.deleteMedicalHistory);

// // Allergy management
// router.post('/allergies', protect, patientController.addAllergy);
// router.delete('/allergies', protect, patientController.removeAllergy);

// // Medication management
// router.post('/medications', protect, patientController.addMedication);
// router.delete('/medications', protect, patientController.removeMedication);

// // Doctor following
// router.post('/follow/:doctorId', protect, patientController.followDoctor);
// router.delete('/unfollow/:doctorId', protect, patientController.unfollowDoctor);

// module.exports = router;
