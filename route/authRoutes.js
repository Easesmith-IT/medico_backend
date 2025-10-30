const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

// Common Auth Status Check (can be used by all roles)
router.get('/check-status', authController.checkAuthStatus);

module.exports = router;
