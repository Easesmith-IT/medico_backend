

// const express = require('express');
// const { protect } = require('../middleware/auth');

// const {
//   doctorSignup,
//   verifySignupOtp,
//   resendSignupOtp,
//   doctorLogin,
//   verifyLoginOtp,
//   resendLoginOtp,
//   logout,
//   logoutAllDevices,
//   getMyProfile,
//   updateProfile,
//   checkAuthStatus,
//   updateAvailability,
//   addClinic,
//   updateClinic,
//   deleteClinic,
//   uploadVerificationDocuments,
//   getAllDoctors,
//   getDoctorById,
//   getDoctorsBySpecialization
// } = require('../controller/doctorController');

// const router = express.Router();


// router.post('/signup', doctorSignup);
// router.post('/signup/verify-otp', verifySignupOtp);
// router.post('/signup/resend-otp', resendSignupOtp);

// router.post('/login', doctorLogin);
// router.post('/login/verify-otp', verifyLoginOtp);
// router.post('/login/resend-otp', resendLoginOtp);

// router.post('/logout', logout);
// router.post('/logout-all-devices', logoutAllDevices);

// // ============================================
// // CHECK AUTH (GET - Non-ID)
// // ============================================

// router.get('/check-auth', checkAuthStatus);

// // ============================================
// // PROTECTED ROUTES (Logged In Only)
// // ============================================

// router.get('/profile', protect, getMyProfile);
// router.put('/profile', protect, updateProfile);

// router.put('/availability', protect, updateAvailability);

// router.post('/clinic', protect, addClinic);
// router.put('/clinic/:clinicId', protect, updateClinic);
// router.delete('/clinic/:clinicId', protect, deleteClinic);

// router.post('/verification-documents', protect, uploadVerificationDocuments);

// // ============================================
// // PUBLIC ROUTES - SPECIFIC PATTERNS (Before Generic)
// // ============================================

// router.get('/specialization/:specialization', getDoctorsBySpecialization);

// // ============================================
// // PUBLIC ROUTES - GENERIC PATTERNS (MUST BE LAST)
// // ============================================

// router.get('/', getAllDoctors);
// router.get('/:id', getDoctorById);

// module.exports = router;








// routes/doctorRoutes.js

const express = require('express');
const router = express.Router();
const doctorController = require('../controller/doctorController');
const { verifyAccessToken } = require('../middleware/auth');
const { protect } = require('../middleware/auth');


// Public routes
router.post('/signup', doctorController.doctorSignup);
router.post('/verify-signup-otp', doctorController.verifySignupOtp);
router.post('/resend-signup-otp', doctorController.resendSignupOtp);
router.post('/login', doctorController.doctorLogin);
router.post('/verify-login-otp', doctorController.verifyLoginOtp);
router.post('/resend-login-otp', doctorController.resendLoginOtp);
router.post('/check-auth', doctorController.checkAuthStatus);
router.get('/getAllDoctors', doctorController.getAllDoctors);
router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);
router.get('/getDoctorById/:id', doctorController.getDoctorById);

// Protected routes
router.post('/logout', verifyAccessToken, doctorController.logout);
router.post('/logout-all-devices', doctorController.logoutAllDevices);
router.get('/getMyProfile', verifyAccessToken, doctorController.getMyProfile);
router.put('/updateProfile', verifyAccessToken, doctorController.updateProfile);
router.put('/availability', verifyAccessToken, doctorController.updateAvailability);
router.post('/clinic', verifyAccessToken, doctorController.addClinic);
router.put('/clinic/:clinicId', verifyAccessToken, doctorController.updateClinic);
router.delete('/clinic/:clinicId', verifyAccessToken, doctorController.deleteClinic);
router.post('/verification-documents', verifyAccessToken, doctorController.uploadVerificationDocuments);


//citywise 
router.get('/doctor/my-cities/:doctorId', doctorController.getDoctorCities);
router.get('/doctor/cities/by-name/:doctorId/:cityName', doctorController.getDoctorCitiesByName);

router.get('/doctors/city/:cityName', doctorController.getDoctorsByCityName);




//availabe slot route 
router.get('/slots/:doctorId', 
  doctorController.getAvailableSlots
);


// DOCTOR ROUTES


// Setup Weekly Availability - Doctor Only
// router.post('/setup', 
//   protect('doctor'),
//   doctorController.setupWeeklyAvailability
// );

// // Generate Daily Slots for Date Range - Doctor Only
// router.post('/generate-slots', 
//   protect('doctor'),
//   doctorController.generateDailySlots
// );


router.post('/availability', 
  protect('doctor'),
  doctorController.configureAvailability
);

router.get('/:doctorId/service-availability', 
  doctorController.getServiceAvailability
);



// Toggle Individual Slot Availability - Doctor Only
router.put('/toggle-slot', 
  protect('doctor'),
  doctorController.toggleSlotAvailability
);

// Add Break Time - Doctor Only
router.post('/break-time', 
  protect('doctor'),
  doctorController.addBreakTime
);

// Remove Break Time - Doctor Only
router.delete('/break-time', 
  protect('doctor'),
  doctorController.removeBreakTime
);

// Get Doctor's Own Availability - Doctor Only
router.get('/my-availability', 
  protect('doctor'),
  doctorController.getMyAvailability
);

// Update Service Availability - Doctor Only
router.put('/service-availability', 
  protect('doctor'),
  doctorController.updateServiceAvailability
);

// Update Service Coverage Areas - Doctor Only
router.put('/service-coverage', 
  protect('doctor'),
  doctorController.updateServiceCoverage
);

// Bulk Block/Unblock Slots - Doctor Only
router.put('/bulk-manage-slots', 
  protect('doctor'),
  doctorController.bulkManageSlots
);


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
