


// // routes/bookingRoutes.js
// const express = require('express');
// const router = express.Router();
// const bookingController = require('../controller/bookingController');
// const { 
//   protect, 
//   verifyPatientRole, 
//   verifyDoctorRole, 
//   verifyAdminRole 
// } = require('../middleware/auth');

// // ============================================
// // PATIENT ROUTES
// // ============================================

// // Create Booking - Patient Only
// // router.post('/create', 
// //   protect('patient'),
// //   bookingController.createBooking
// // );
// router.post('/create', protect('patient'), bookingController.createBooking);

// // Get Patient's Bookings
// router.get('/my-bookings', 
//   protect('patient'),
//   bookingController.getPatientBookings
// );

// // Submit Feedback & Rating - Patient Only
// router.post('/feedback/:id', 
//   protect('patient'),
//   bookingController.submitFeedback
// );

// // ============================================
// // SERVICE PARTNER ROUTES
// // ============================================

// // Get Partner's Bookings
// router.get('/partner/bookings', 
//   protect('partner'),
//   bookingController.getPartnerBookings
// );

// // Accept Booking - Partner Only
// router.post('/:id/accept', 
//   protect('partner'),
//   bookingController.partnerAcceptBooking
// );

// // Reject Booking - Partner Only
// router.post('/:id/reject', 
//   protect('partner'),
//   bookingController.partnerRejectBooking
// );

// // Start Service - Partner Only
// router.post('/:id/start', 
//   protect('partner'),
//   bookingController.startService
// );

// // Complete Service - Partner Only
// router.post('/:id/complete', 
//   protect('partner'),
//   bookingController.completeService
// );

// // ============================================
// // DOCTOR ROUTES
// // ============================================

// // Get Doctor's Appointments (using getDoctorBookings function)
// router.get('/doctor/appointments', 
//   protect('doctor'),
//   bookingController.getDoctorBookings
// );

// // ============================================
// // ADMIN ROUTES (MUST BE BEFORE GENERIC ROUTES)
// // ============================================

// // Get Pending Approvals - Admin Only
// router.get('/admin/pending-approvals', 
//   verifyAdminRole,
//   bookingController.getPendingAssignments
// );

// // Get All Bookings - Admin Only
// router.get('/admin/all-bookings', 
//   verifyAdminRole,
//   bookingController.getAllBookings
// );

// // Get Booking Stats - Admin Only
// router.get('/admin/stats', 
//   verifyAdminRole,
//   bookingController.getDashboardStats
// );

// // Approve Booking - Admin Only
// router.post('/admin/approve/:id', 
//   verifyAdminRole,
//   bookingController.approveBooking
// );

// // Disapprove Booking - Admin Only
// router.post('/admin/disapprove/:id', 
//   verifyAdminRole,
//   bookingController.disapproveBooking
// );

// // Assign Partner - Admin Only
// router.post('/admin/assign-partner/:id', 
//   verifyAdminRole,
//   bookingController.assignPartner
// );

// // Generate Invoice - Admin or Patient
// router.post('/:id/invoice', 
//   protect('admin', 'patient'),
//   bookingController.generateInvoice
// );

// // ============================================
// // COMMON ROUTES (Patient, Partner, Doctor, Admin)
// // ============================================

// // Cancel Booking - Patient, Partner, Doctor, or Admin
// router.post('/cancel/:id', 
//   protect('patient', 'partner', 'doctor', 'admin'),
//   bookingController.cancelBooking
// );

// // Reschedule Booking - Patient, Partner, Doctor, or Admin
// router.post('/reschedule/:id', 
//   protect('patient', 'partner', 'doctor', 'admin'),
//   bookingController.rescheduleBooking
// );

// // Get Available Slots (Public - no auth required)
// router.get('/slots/available', 
//   bookingController.getAvailableSlots
// );

// // ============================================
// // GENERIC ROUTES (MUST BE LAST)
// // ============================================

// // Get Single Booking Details - Any authenticated user
// router.get('/:id', 
//   protect(),
//   bookingController.getBookingById
// );

// module.exports = router;
const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');
const { protect } = require('../middleware/auth');

// Patient can create a new booking
router.post('/create', protect(['patient']), bookingController.createBooking);

// Admin or Provider can get service appointment summaries by service ID
// router.get('/service-summary/:serviceId', protect(['admin', 'provider']), bookingController.getServiceSummary);
router.get('/patient/:patientId/bookings',bookingController.getBookedServicesByPatientId);
// // Patient can get all their bookings with optional filters
// router.get('/my-bookings', protect(['patient']), bookingController.getPatientBookings);

// // Patient can reschedule their booking by booking ID
// router.put('/reschedule/:bookingId', protect(['patient']), bookingController.rescheduleBooking);


module.exports = router;

