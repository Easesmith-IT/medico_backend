const express = require('express');
const patientController = require('../controller/patientController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public Routes
router.post('/signup', patientController.patientSignup);
router.post('/login', patientController.patientLogin);
router.post('/logout', patientController.patientLogout);
router.post('/logout-all', patientController.patientLogoutAll);

// Protected Routes (Patient Only)
router.use(protect, restrictTo('patient'));

router.get('/me/profile', patientController.getMyProfile);
router.patch('/me/update', patientController.updatePatient);

// Medical Information Management
router.patch('/me/medical-history', patientController.updateMedicalHistory);
router.delete('/me/medical-history/:historyId', patientController.deleteMedicalHistory);
router.post('/me/allergies', patientController.addAllergy);
router.delete('/me/allergies', patientController.removeAllergy);
router.post('/me/medications', patientController.addMedication);
router.delete('/me/medications', patientController.removeMedication);

// Follow/Unfollow Doctors
router.post('/follow/:doctorId', patientController.followDoctor);
router.delete('/unfollow/:doctorId', patientController.unfollowDoctor);

module.exports = router;
