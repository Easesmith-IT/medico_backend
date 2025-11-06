// routes/cityRoutes.js

const router = require('express').Router();
const cityController = require('../controller/cityController');
const { verifyAccessToken } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No Authentication)
// ============================================

// Get all cities
router.get('/cities', cityController.getAllCities);

// Get city by ID
router.get('/cities/:cityId', cityController.getCityById);

// ============================================
// ADMIN ROUTES (Authentication Required)
// ============================================

// Add new city (Admin only)
router.post('/admin/cities', verifyAccessToken, cityController.addCity);

// Update city (Admin only)
router.put('/admin/cities/:cityId', verifyAccessToken, cityController.updateCity);

// Delete city (Admin only)
router.delete('/admin/cities/:cityId', verifyAccessToken, cityController.deleteCity);

module.exports = router;
