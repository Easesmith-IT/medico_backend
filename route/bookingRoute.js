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


// // PATIENT ROUTES


// // Create Booking - Patient Only
// router.post('/create', 
//   protect('patient'),
//   bookingController.createBooking
// );

// // Get Patient's Bookings
// router.get('/my-bookings', 
//   protect('patient'),
//   bookingController.getPatientBookings
// );

// // Rebook Appointment - Patient Only
// router.post('/rebook/:bookingId', 
//   protect('patient'),
//   bookingController.rebookAppointment
// );

// // Submit Feedback & Rating - Patient Only
// router.post('/feedback/:bookingId', 
//   protect('patient'),
//   bookingController.submitFeedback
// );

// // DOCTOR ROUTES


// // Get Doctor's Appointments
// router.get('/doctor/appointments', 
//   protect('doctor'),
//   bookingController.getDoctorAppointments
// );

// // Update Sub-Status (On the Way, Reached, etc.) - Doctor Only
// router.put('/doctor/update-substatus/:bookingId', 
//   protect('doctor'),
//   bookingController.updateSubStatus
// );

// // Complete Appointment - Doctor Only
// router.put('/doctor/complete/:bookingId', 
//   protect('doctor'),
//   bookingController.completeAppointment
// );


// // COMMON ROUTES (Patient, Doctor, Admin)


// // Cancel Booking - Patient, Doctor, or Admin
// router.put('/cancel/:bookingId', 
//   protect(),
//   bookingController.cancelBooking
// );

// // Reschedule Booking - Patient or Doctor
// router.put('/reschedule/:bookingId', 
//   protect('patient', 'doctor'),
//   bookingController.rescheduleBooking
// );

// // Get Single Booking Details
// router.get('/:bookingId', 
//   protect(),
//   bookingController.getBookingDetails
// );


// // ADMIN ROUTES

// // Get Pending Approvals - Admin Only
// router.get('/admin/pending-approvals', 
//   verifyAdminRole,
//   bookingController.getPendingApprovals
// ); 

// // Approve Booking - Admin Only
// router.put('/admin/approve/:bookingId', 
//   verifyAdminRole,
//   bookingController.approveBooking
// );

// // Disapprove Booking - Admin Only
// router.put('/admin/disapprove/:bookingId', 
//   verifyAdminRole,
//   bookingController.disapproveBooking
// );

// // Get All Bookings - Admin Only
// router.get('/admin/all-bookings', 
//   verifyAdminRole,
//   bookingController.getAllBookings
// );

// // Get Booking Stats - Admin Only
// router.get('/admin/stats', 
//   verifyAdminRole,
//   bookingController.getBookingStats
// );

// module.exports = router;



// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');
const { 
  protect, 
  verifyPatientRole, 
  verifyDoctorRole, 
  verifyAdminRole 
} = require('../middleware/auth');

// ============================================
// PATIENT ROUTES
// ============================================

// Create Booking - Patient Only
router.post('/create', 
  protect('patient'),
  bookingController.createBooking
);

// Get Patient's Bookings
router.get('/my-bookings', 
  protect('patient'),
  bookingController.getPatientBookings
);

// Rebook Appointment - Patient Only
router.post('/rebook/:bookingId', 
  protect('patient'),
  bookingController.rebookAppointment
);

// Submit Feedback & Rating - Patient Only
router.post('/feedback/:bookingId', 
  protect('patient'),
  bookingController.submitFeedback
);

// ============================================
// DOCTOR ROUTES
// ============================================

// Get Doctor's Appointments
router.get('/doctor/appointments', 
  protect('doctor'),
  bookingController.getDoctorAppointments
);

// Update Sub-Status (On the Way, Reached, etc.) - Doctor Only
router.put('/doctor/update-substatus/:bookingId', 
  protect('doctor'),
  bookingController.updateSubStatus
);

// Complete Appointment - Doctor Only
router.put('/doctor/complete/:bookingId', 
  protect('doctor'),
  bookingController.completeAppointment
);

// ============================================
// ADMIN ROUTES (MUST BE BEFORE GENERIC ROUTES)
// ============================================

// Get Pending Approvals - Admin Only
router.get('/admin/pending-approvals', 
  verifyAdminRole,
  bookingController.getPendingApprovals
);

// Get All Bookings - Admin Only
router.get('/admin/all-bookings', 
  verifyAdminRole,
  bookingController.getAllBookings
);

// Get Booking Stats - Admin Only
router.get('/admin/stats', 
  verifyAdminRole,
  bookingController.getBookingStats
);

// Approve Booking - Admin Only
router.put('/admin/approve/:bookingId', 
  verifyAdminRole,
  bookingController.approveBooking
);

// Disapprove Booking - Admin Only
router.put('/admin/disapprove/:bookingId', 
  verifyAdminRole,
  bookingController.disapproveBooking
);

// ============================================
// COMMON ROUTES (Patient, Doctor, Admin)
// ============================================

// Cancel Booking - Patient, Doctor, or Admin
router.put('/cancel/:bookingId', 
  protect(),
  bookingController.cancelBooking
);

// Reschedule Booking - Patient or Doctor
router.put('/reschedule/:bookingId', 
  protect('patient', 'doctor'),
  bookingController.rescheduleBooking
);

// ============================================
// GENERIC ROUTES (MUST BE LAST)
// ============================================

// Get Single Booking Details (MOVED TO END)
router.get('/:bookingId', 
  protect(),
  bookingController.getBookingDetails
);

module.exports = router;
