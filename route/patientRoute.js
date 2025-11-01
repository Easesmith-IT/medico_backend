// // route/patientRoute.js

// const express = require('express');
// const router = express.Router();
// const patientController = require('../controller/patientController');
// const { verifyAccessToken } = require('../middleware/auth');

// // ============================================
// // PATIENT AUTH (Signup, Login, Logout)
// // ============================================

// router.post('/signup', patientController.patientSignup);
// router.post('/verify-signup-otp', patientController.verifySignupOtp);
// router.post('/resend-signup-otp', patientController.resendSignupOtp);
// router.post('/login', patientController.patientLogin);
// router.post('/verify-login-otp', patientController.verifyLoginOtp);
// router.post('/resend-login-otp', patientController.resendLoginOtp);
// router.post('/check-auth', patientController.checkAuthStatus);
// router.post('/logout', verifyAccessToken, patientController.logout);

// // ============================================
// // PATIENT OPERATIONS
// // ============================================

// router.get('/', patientController.getAllPatients);
// router.get('/:id', patientController.getPatientById);
// router.get('/me', verifyAccessToken, patientController.getMyProfile);
// router.put('/profile', verifyAccessToken, patientController.updateProfile);

// module.exports = router;
