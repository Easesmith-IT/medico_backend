const express = require('express');
const authRoutes = require('./authRoutes');
const doctorRoute = require('./doctorRoute');
const patientRoute = require('./patientRoute');
const adminRoute = require('./adminRoute');
const cityRoute= require('../route/cityRoute');
const articleRoute= require('../route/articleRoute');
const bookingRoute= require('../route/bookingRoute');
const serviceRoute= require('../route/serviceRoute');


const router = express.Router();

// Mount all routes
// router.use('/auth', authRoutes);      // Common auth operations
router.use('/doctor', doctorRoute);   // All doctor routes
router.use('/patient', patientRoute); // All patient routes
router.use('/admin', adminRoute);     // All admin routes
router.use('/city',cityRoute);
router.use('/article',articleRoute);
router.use('booking',bookingRoute);
router.use('/service',serviceRoute);

module.exports = router;
