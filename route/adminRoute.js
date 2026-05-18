// route/adminRoute.js

const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const adminGovernanceController = require("../controller/adminGovernanceController");
const adminReportController = require("../controller/adminReportController");
const adminTreatmentController = require("../controller/adminTreatmentController");
const profileAuditController = require("../controller/profileAuditController");
const doctorVerificationController = require("../controller/doctorVerificationController");
const reviewController = require("../controller/reviewController");
const supportController = require("../controller/supportController");
const adminOpsController = require("../controller/adminOpsController");
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
  "/sessions/me",
  protect("superadmin", "subadmin"),
  adminGovernanceController.getMySessions
);
router.delete(
  "/sessions/:sessionId",
  protect("superadmin", "subadmin"),
  adminGovernanceController.revokeMySessionById
);
router.delete(
  "/sessions/me/all",
  protect("superadmin", "subadmin"),
  adminGovernanceController.revokeMyAllSessions
);
router.post(
  "/subadmins/:id/force-logout",
  protect("superadmin", "subadmin"),
  adminGovernanceController.forceLogoutSubAdmin
);

router.patch(
  "/profile/password",
  protect("superadmin", "subadmin"),
  adminGovernanceController.updateMyPassword
);
router.post(
  "/mfa/setup",
  protect("superadmin", "subadmin"),
  adminGovernanceController.setupMfa
);
router.post(
  "/mfa/verify",
  protect("superadmin", "subadmin"),
  adminGovernanceController.verifyMfa
);
router.post(
  "/mfa/disable",
  protect("superadmin", "subadmin"),
  adminGovernanceController.disableMfa
);
router.patch(
  "/security-policy",
  protect("superadmin", "subadmin"),
  adminGovernanceController.updateSecurityPolicy
);
router.get(
  "/audit-logs",
  protect("superadmin", "subadmin"),
  adminGovernanceController.getAuditLogs
);
router.get(
  "/audit-logs/export",
  protect("superadmin", "subadmin"),
  adminGovernanceController.exportAuditLogs
);
router.get(
  "/audit/profile-changes",
  protect("admin", "superadmin", "subadmin"),
  profileAuditController.listProfileChanges
);
router.get(
  "/actions/logs",
  protect("admin", "superadmin", "subadmin"),
  adminOpsController.listAdminActionLogs
);
router.get(
  "/ops/queues",
  protect("admin", "superadmin", "subadmin"),
  adminOpsController.getOpsQueues
);

router.get(
  "/subadmins",
  protect("superadmin", "subadmin"),
  adminController.getSubAdmins,
);
router.get(
  "/subadmins/:id",
  protect("superadmin", "subadmin"),
  adminController.getSubAdminById
);
router.patch(
  "/subadmins/:id",
  protect("superadmin", "subadmin"),
  adminController.updateSubAdmin
);
router.delete(
  "/subadmins/:id",
  protect("superadmin", "subadmin"),
  adminController.deleteSubAdmin
);
router.patch(
  "/subadmins/:id/toggle-status",
  protect("superadmin", "subadmin"),
  adminController.toggleSubAdminStatus
);

router.get("/services/names", adminController.getServiceNames);
router.get("/patients/names", adminController.getPatientNames);
router.get(
  "/patients/:patientId/treatments",
  protect("superadmin", "subadmin", "admin"),
  adminController.getPatientTreatmentsForBooking
);
router.get(
  "/treatments",
  protect("admin", "superadmin", "subadmin"),
  adminTreatmentController.listTreatments
);
router.get(
  "/treatments/:treatmentId",
  protect("admin", "superadmin", "subadmin"),
  adminTreatmentController.getTreatmentDetail
);
router.patch(
  "/treatments/:treatmentId/status",
  protect("superadmin", "subadmin"),
  adminTreatmentController.updateTreatmentStatus
);
router.post(
  "/treatments/:treatmentId/complete",
  protect("superadmin", "subadmin"),
  adminTreatmentController.completeTreatment
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
router.get(
  "/doctors/verification-queue",
  protect("admin", "superadmin", "subadmin"),
  doctorVerificationController.getVerificationQueue
);
router.get(
  "/doctors/verification-expiring",
  protect("admin", "superadmin", "subadmin"),
  doctorVerificationController.getExpiringVerificationDocs
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
router.patch(
  "/doctors/:id/verification-review",
  protect("admin", "superadmin", "subadmin"),
  doctorVerificationController.reviewDoctorVerification
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

router.get(
  "/reports/command-center",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.getCommandCenterReport
);
router.get(
  "/reports/filter-options",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.getCommandCenterFilterOptions
);
router.get(
  "/reports/command-center/export",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.exportCommandCenterReport
);

router.post(
  "/reports/schedules",
  protect("superadmin", "subadmin"),
  adminReportController.createReportSchedule
);
router.get(
  "/reports/schedules",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.listReportSchedules
);
router.patch(
  "/reports/schedules/:scheduleId",
  protect("superadmin", "subadmin"),
  adminReportController.updateReportSchedule
);
router.post(
  "/reports/schedules/:scheduleId/run",
  protect("superadmin", "subadmin"),
  adminReportController.runReportSchedule
);
router.post(
  "/reports/schedules/run-due",
  protect("superadmin", "subadmin"),
  adminReportController.runDueReportSchedules
);
router.get(
  "/reports/runs",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.listReportRuns
);
router.get(
  "/reports/runs/:runId/download",
  protect("admin", "superadmin", "subadmin"),
  adminReportController.downloadReportRun
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
router.get(
  "/support/tickets",
  protect("admin", "superadmin", "subadmin"),
  supportController.listTickets
);
router.patch(
  "/support/tickets/:id",
  protect("admin", "superadmin", "subadmin"),
  supportController.updateTicket
);
router.patch(
  "/reviews/:id/moderation",
  protect("admin", "superadmin", "subadmin"),
  reviewController.moderateReview
);
// DELETE /api/v1/patients/admin/patient/:patientId/medications
router.delete('/patient/:patientId/medications', protect('superadmin', 'subadmin', 'admin'),   adminController.adminRemoveMedication);
router.post(
  "/addEquipments",
  protect("superadmin", "subadmin","admin"),
  adminController.addEquipment
);
module.exports = router;
