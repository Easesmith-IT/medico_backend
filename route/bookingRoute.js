
// const express = require('express');
// const router = express.Router();
// const bookingController = require('../controller/bookingController');
// const { protect } = require('../middleware/auth');

// // Patient can create a new booking
// router.post('/create', protect(['patient']), bookingController.createBooking);

// // Admin or Provider can get service appointment summaries by service ID
// // router.get('/service-summary/:serviceId', protect(['admin', 'provider']), bookingController.getServiceSummary);
// router.get('/patient/:patientId/bookings',bookingController.getBookedServicesByPatientId);
// // // Patient can get all their bookings with optional filters
// // router.get('/my-bookings', protect(['patient']), bookingController.getPatientBookings);

// // // Patient can reschedule their booking by booking ID
// // router.put('/reschedule/:bookingId', protect(['patient']), bookingController.rescheduleBooking);


// module.exports = router;

const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');
const { protect } = require('../middleware/auth');

// Patient creates booking
router.post('/create', protect(['patient']), bookingController.createBooking);

// Admin/Provider get service summaries by service ID
// router.get('/service-summary/:serviceId', protect(['admin', 'provider']), bookingController.getServiceSummaryByServiceId);
router.get('/service-summary/:serviceId', bookingController.getServiceSummaryByServiceId);
// Get bookings by patient ID
router.get('/patient/:patientId/bookings', protect(['admin', 'patient']), bookingController.getBookedServicesByPatientId);

// Get my bookings (patient)
router.get('/my-bookings', protect(['patient']), (req, res, next) => {
  req.params.patientId = req.user.id; // inject patientId
  next();
}, bookingController.getBookedServicesByPatientId);

// Reschedule booking (patient)
router.put('/reschedule/:bookingId', protect(['patient']), bookingController.rescheduleBooking);

//TODO rebooking folow up booking(dr bhulya phir se chahiye rebook follow up )


router.get('/getAllBookings', bookingController.getAllBookings);

router.get('/bookings/:bookingId', bookingController.getByIdBooking);
// Cancel booking (patient)
router.put('/cancel/:bookingId', protect(['patient']), bookingController.cancelBooking);


// Add equipment (Admin only)
router.put(
  '/update-status/:bookingId', 
  // protect(['doctor','serviceprovider']), 
   protect('doctor', 'serviceprovider'),
  bookingController.updateServiceStatus
);
router.get(
    '/my-bookings/:providerId', 
    protect('serviceprovider'), 
    bookingController.getBookingsByServiceProvider
);



router.post('/completed-details/:bookingId', protect('serviceProvider'), bookingController.bookingCompletedDetails);




router.post('/providerBookings', 
  protect('serviceprovider'), 
    bookingController.createProviderBooking
);


module.exports = router;
