const express = require('express');
const adminController = require('../controller/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public Routes
router.post('/signup', adminController.adminSignup);
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);
router.post('/logout-all', adminController.adminLogoutAll);

// // Protect all routes after this middleware
// router.use(protect, restrictTo('admin'));

// // Admin Profile Management
// router.get('/me/profile', adminController.getMyProfile);
// router.patch('/me/update', adminController.updateAdmin);

// // Dashboard Statistics
// router.get('/dashboard/stats', adminController.getDashboardStats);
// router.get('/dashboard/pending-verifications', adminController.getPendingVerifications);

// // Doctor Management
// router.get('/doctors', adminController.getAllDoctors);
// router.get('/doctors/:id', adminController.getDoctorById);
// router.patch('/doctors/:doctorId/verify', adminController.verifyDoctor);
// router.delete('/doctors/:id', adminController.deleteDoctor);
// router.patch('/doctors/:id/reactivate', adminController.reactivateDoctor);

// // Patient Management
// router.get('/patients', adminController.getAllPatients);
// router.get('/patients/:id', adminController.getPatientById);
// router.delete('/patients/:id', adminController.deletePatient);
// router.patch('/patients/:id/reactivate', adminController.reactivatePatient);

// // Admin Management
// router.get('/admins', adminController.getAllAdmins);
// router.patch('/admins/:adminId/permissions', adminController.updateAdminPermissions);
// router.delete('/admins/:id', adminController.deactivateAdmin);

module.exports = router;
