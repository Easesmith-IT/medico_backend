// route/adminRoute.js

const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { protect } = require("../middleware/auth");

router.post("/signup", adminController.adminSignup);
router.post("/login", adminController.adminLogin);
router.post("/verify-signup-otp", adminController.verifySignupOtp);
// router.post('/resend-login-otp', adminController.resendLoginOtp);
router.post("/check-auth", adminController.checkAuthStatus);
// router.post('/logout', protect("superadmin", "subadmin"), adminController.logout);
router.post("/logout", adminController.logout);
router.post("/logout-all-devices", adminController.logoutAllDevices);

router.get(
  "/subadmins",
  protect("superadmin", "subadmin"),
  adminController.getSubAdmins,
);
router.patch(
  "/subadmins/:id/toggle-status",
  adminController.toggleSubAdminStatus
);

router.get("/services/names", adminController.getServiceNames);
router.get("/patients/names", adminController.getPatientNames);
router.get(
  "/patients/:patientId/treatments",
  protect("superadmin", "subadmin", "admin"),
  adminController.getPatientTreatmentsForBooking
);
router.get("/service-providers/names", adminController.getServiceProviderNames);

router.get(
  "/me",
  protect("superadmin", "subadmin"),
  adminController.getMyProfile
);
router.put(
  "/updateProfile",
  protect("superadmin", "subadmin"),
  adminController.updateProfile
);

router.post(
  "/doctors/create",
  protect("superadmin", "subadmin"),
  adminController.createDoctor
);
router.get("/doctors", protect("superadmin","subadmin","admin"), adminController.getAllDoctors);
router.get(
  "/doctors/:id",
  protect("superadmin", "subadmin"),
  adminController.getDoctorById
);
router.put(
  "/doctors/:id/approve",
  protect("superadmin", "subadmin"),
  adminController.approveDoctor
);
router.put(
  "/doctors/:id/reject",
  protect("superadmin", "subadmin"),
  adminController.rejectDoctor
);
router.delete(
  "/doctors/:id",
  protect("superadmin", "subadmin"),
  adminController.deleteDoctor
);

router.post(
  "/patients/create",
  protect("superadmin", "subadmin"),
  adminController.createPatient
);
router.get(
  "/patients/export",
  protect("superadmin", "subadmin"),
  adminController.exportPatients
);
router.get(
  "/patients",
  protect("superadmin", "subadmin"),
  adminController.getAllPatients
);
router.get(
  "/patients/:id",
  protect("superadmin", "subadmin"),
  adminController.getPatientById
);
router.put(
  "/patients/:id/block",
  protect("superadmin", "subadmin"),
  adminController.blockPatient
);
router.delete(
  "/patients/:id",
  protect("superadmin", "subadmin"),
  adminController.deletePatient
);

router.get(
  "/reports/dashboard",
  protect("superadmin", "subadmin"),
  adminController.getDashboardStats
);
router.get(
  "/reports/doctors",
  protect("superadmin", "subadmin"),
  adminController.getDoctorStats
);

router.patch(
  "/bookings/:bookingId/status",
  adminController.updateBookingStatus
);

router.get(
  "/bookings/export",
  protect("superadmin", "subadmin"),
  adminController.exportAppointments
);

router.post(
  "/bookings/create",
  protect("superadmin", "subadmin"),
  adminController.createBookingByAdmin
);

router.patch(
  "/bookings/update/:bookingId",
  protect("superadmin", "subadmin"),
  adminController.updateBookingByAdmin
);

//add doc by cities
// Admin only routes

// Add doctor to cities
router.post(
  "/admin/doctor/add-cities",
  protect("superadmin", "subadmin"),
  adminController.addDoctorToCities
);

// Remove doctor from cities
router.post(
  "/admin/doctor/remove-cities",
  protect("superadmin", "subadmin"),
  adminController.removeDoctorFromCities
);

// Replace all cities for a doctor
router.put(
  "/admin/doctor/update-cities",
  protect("superadmin", "subadmin"),
  adminController.updateDoctorCities
);

// Get specific doctor's cities
router.get(
  "/admin/doctor/:doctorId/cities",
  protect("superadmin", "subadmin"),
  adminController.getDoctorCities
);

// Get all doctors in a specific city
router.get(
  "/admin/city/:cityId/doctors",
  protect("superadmin", "subadmin"),
  adminController.getDoctorsByCity
);


router.patch(
  '/doctors/:id/toggle-status',
  protect('superadmin', 'subadmin'),
  adminController.toggleDoctorStatus
);


router.patch(
  '/patients/:id/toggle-status',
  protect('superadmin', 'subadmin'),
  adminController.togglePatientStatus
);



router.post(
  "/admin/booking/approve-cancellation/:bookingId",
  protect("superadmin", "subadmin"),
  adminController.approveCancellation
);
router.post(
  '/patient/:patientId/medications', 
  protect('admin', 'superadmin', 'subadmin'),
  adminController.adminAddMedication
);
// DELETE /api/v1/patients/admin/patient/:patientId/medications
router.delete('/patient/:patientId/medications', protect('superadmin', 'subadmin', 'admin'),   adminController.adminRemoveMedication);
router.post(
  "/addEquipments",
  protect("superadmin", "subadmin","admin"),
  adminController.addEquipment
);
module.exports = router;
