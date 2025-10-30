const express = require('express');
const doctorController = require('../controller/doctorController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public Routes
router.post('/signup', doctorController.doctorSignup);
router.post('/login', doctorController.doctorLogin);
router.post('/logout', doctorController.doctorLogout);
router.post('/logout-all', doctorController.doctorLogoutAll);

router.get('/', doctorController.getAllDoctors);
router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);
router.get('/:id', doctorController.getDoctorById);

// Protected Routes (Doctor Only)
router.use(protect, restrictTo('doctor'));

router.get('/me/profile', doctorController.getMyProfile);
router.patch('/me/update', doctorController.updateDoctor);
router.patch('/me/availability', doctorController.updateAvailability);
router.post('/me/verification-documents', doctorController.uploadVerificationDocuments);

// Clinic Management
router.post('/me/clinics', doctorController.addClinic);
router.patch('/me/clinics/:clinicId', doctorController.updateClinic);
router.delete('/me/clinics/:clinicId', doctorController.deleteClinic);

module.exports = router;
