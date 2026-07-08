// const express = require('express');
// const authRoutes = require('./authRoutes');
// const doctorRoute = require('./doctorRoute');
// const patientRoute = require('./patientRoute');
// const adminRoute = require('./adminRoute');
// const cityRoute= require('../route/cityRoute');
// const articleRoute= require('../route/articleRoute');
// const bookingRoute= require('../route/bookingRoute');
// const serviceRoute= require('../route/serviceRoute');
// const serviceProviderRoute= require('../route/serviceProvider');
// const socialPostRoute = require('../route/socialPostRoute');
// const invoiceRoute = require('../route/invoiceRoute');
// const router = express.Router();

// // Mount all routes
// // router.use('/auth', authRoutes);      // Common auth operations
// router.use('/doctor', doctorRoute);   // All doctor routes
// router.use('/patient', patientRoute); // All patient routes
// router.use('/admin', adminRoute);     // All admin routes
// router.use('/city',cityRoute);
// router.use('/article',articleRoute);
// router.use('/booking',bookingRoute);
// router.use('/service',serviceRoute);
// router.use('/serviceProvider',serviceProviderRoute)
// router.use('/invoice',invoiceRoute)
// router.use('/socialPost',socialPostRoute) // Social media posts
// router.use("/geo", geoRoutes);


// module.exports = router;




const express = require('express');

const authRoutes = require('./authRoutes');
const doctorRoute = require('./doctorRoute');
const patientRoute = require('./patientRoute');
const adminRoute = require('./adminRoute');

const cityRoute = require('../route/cityRoute');
const articleRoute = require('../route/articleRoute');
const bookingRoute = require('../route/bookingRoute');
const serviceRoute = require('../route/serviceRoute');
const serviceProviderRoute = require('../route/serviceProvider');
const socialPostRoute = require('../route/socialPostRoute');
const invoiceRoute = require('../route/invoiceRoute');
const geoRoutes = require('../route/geoRoutes');
const crashReportRoutes = require("../route/crashReportRoutes");
const itemRoute = require('../route/itemRoute');
const uploadsRoute = require('../route/uploadRoute');
const paymentRoute = require('../route/paymentRoute');
const seperatePatientAddressRoute = require('../route/seperatePatientAddressRoute')
const adminPaymentRoute = require("../route/adminPaymentRoute");
const medicalRecordRoute = require("../route/medicalRecordRoute");
const reviewRoute = require("../route/reviewRoute");
const supportRoute = require("../route/supportRoute");
const doctorAppointmentRoute = require("../route/doctorAppointmentRoute");
const chatRoute = require("../route/chatRoute");
const favoriteRoute = require("../route/favoriteRoute");
const legalContentRoute = require("../route/legalContentRoute");
const callbackRequestRoute = require("../route/callbackRequestRoute");

const router = express.Router();


// Mount routes
router.use('/', authRoutes);
router.use("/admin/payments", adminPaymentRoute);
router.use('/doctor', doctorRoute);
router.use('/patient', patientRoute);
router.use('/admin', adminRoute);
router.use('/city', cityRoute);
router.use('/article', articleRoute);
router.use('/booking', bookingRoute);
router.use('/service', serviceRoute);
router.use('/serviceProvider', serviceProviderRoute);
router.use('/invoice', invoiceRoute);
router.use('/socialPost', socialPostRoute);
router.use('/geo', geoRoutes);
router.use("/crash-report", crashReportRoutes);
router.use('/items',itemRoute);
router.use('/uploadfile',uploadsRoute) // File upload route
router.use('/payments', paymentRoute);
router.use('/medical-records', medicalRecordRoute);
router.use('/reviews', reviewRoute);
router.use('/support', supportRoute);
router.use('/doctor-appointments', doctorAppointmentRoute);
router.use('/seperatepatientAddress', seperatePatientAddressRoute);
router.use('/chats', chatRoute);
router.use('/favorites', favoriteRoute);
router.use('/legal', legalContentRoute);
router.use('/callback-requests', callbackRequestRoute);
module.exports = router;
