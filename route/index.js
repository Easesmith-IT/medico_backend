const express = require('express');
const authRoutes = require('./authRoutes');
const doctorRoute = require('./doctorRoute');
const patientRoute = require('./patientRoute');
const adminRoute = require('./adminRoute');

const router = express.Router();

// Mount all routes
// router.use('/auth', authRoutes);      // Common auth operations
router.use('/doctor', doctorRoute);   // All doctor routes
// router.use('/patient', patientRoute); // All patient routes
router.use('/admin', adminRoute);     // All admin routes

module.exports = router;
