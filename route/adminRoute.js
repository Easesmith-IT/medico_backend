// route/adminRoute.js

const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { verifyAccessToken } = require('../middleware/auth');



router.post('/signup', adminController.adminSignup);
router.post('/login', adminController.adminLogin);
router.post('/verify-login-otp', adminController.verifyLoginOtp);
router.post('/resend-login-otp', adminController.resendLoginOtp);
router.post('/check-auth', adminController.checkAuthStatus);
router.post('/logout', verifyAccessToken, adminController.logout);
router.post('/logout-all-devices', adminController.logoutAllDevices);



router.get('/me', verifyAccessToken, adminController.getMyProfile);
router.put('/updateProfile', verifyAccessToken, adminController.updateProfile);



router.get('/doctors', verifyAccessToken, adminController.getAllDoctors);
router.get('/doctors/:id', verifyAccessToken, adminController.getDoctorById);
router.put('/doctors/:id/approve', verifyAccessToken, adminController.approveDoctor);
router.put('/doctors/:id/reject', verifyAccessToken, adminController.rejectDoctor);
router.delete('/doctors/:id', verifyAccessToken, adminController.deleteDoctor);



router.get('/patients', verifyAccessToken, adminController.getAllPatients);
router.get('/patients/:id', verifyAccessToken, adminController.getPatientById);
router.put('/patients/:id/block', verifyAccessToken, adminController.blockPatient);
router.delete('/patients/:id', verifyAccessToken, adminController.deletePatient);


router.get('/reports/dashboard', verifyAccessToken, adminController.getDashboardStats);
router.get('/reports/doctors', verifyAccessToken, adminController.getDoctorStats);

module.exports = router;
