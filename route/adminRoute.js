// route/adminRoute.js

const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { verifyAccessToken } = require('../middleware/auth');



router.post('/signup', adminController.adminSignup);
router.post('/login', adminController.adminLogin);
router.post('/verify-signup-otp', adminController.verifySignupOtp);
// router.post('/resend-login-otp', adminController.resendLoginOtp);
router.post('/check-auth', adminController.checkAuthStatus);
// router.post('/logout', verifyAccessToken, adminController.logout);
router.post('/logout', adminController.logout);
router.post('/logout-all-devices', adminController.logoutAllDevices);



router.get('/me', verifyAccessToken, adminController.getMyProfile);
router.put('/updateProfile', verifyAccessToken, adminController.updateProfile);


router.post("/doctors/create", verifyAccessToken, adminController.createDoctor);
router.get('/doctors', verifyAccessToken, adminController.getAllDoctors);
router.get('/doctors/:id', verifyAccessToken, adminController.getDoctorById);
router.put('/doctors/:id/approve', verifyAccessToken, adminController.approveDoctor);
router.put('/doctors/:id/reject', verifyAccessToken, adminController.rejectDoctor);
router.delete('/doctors/:id', verifyAccessToken, adminController.deleteDoctor);



router.post('/patients/create', verifyAccessToken, adminController.createPatient);
router.get('/patients/export', verifyAccessToken, adminController.exportPatients);
router.get('/patients', verifyAccessToken, adminController.getAllPatients);
router.get('/patients/:id', verifyAccessToken, adminController.getPatientById);
router.put('/patients/:id/block', verifyAccessToken, adminController.blockPatient);
router.delete('/patients/:id', verifyAccessToken, adminController.deletePatient);


router.get('/reports/dashboard', verifyAccessToken, adminController.getDashboardStats);
router.get('/reports/doctors', verifyAccessToken, adminController.getDoctorStats);

router.patch('/bookings/:bookingId/status',adminController.updateBookingStatus);


//add doc by cities 
// Admin only routes


// Add doctor to cities
router.post('/admin/doctor/add-cities', verifyAccessToken,adminController.addDoctorToCities);

// Remove doctor from cities
router.post('/admin/doctor/remove-cities', verifyAccessToken,adminController.removeDoctorFromCities);

// Replace all cities for a doctor
router.put('/admin/doctor/update-cities', verifyAccessToken,adminController.updateDoctorCities);

// Get specific doctor's cities
router.get('/admin/doctor/:doctorId/cities', verifyAccessToken,adminController.getDoctorCities);

// Get all doctors in a specific city
router.get('/admin/city/:cityId/doctors', verifyAccessToken,adminController.getDoctorsByCity);

module.exports = router;
