// routes/cityRoutes.js

const router = require('express').Router();
const cityController = require('../controller/cityController');
const {  protect } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No Authentication)
// ============================================

// Get all cities
router.get('/getAllCities', cityController.getAllCities);

// Get city by ID
router.get('/cities/:cityId', cityController.getCityById);

// ============================================
// ADMIN ROUTES (Authentication Required)
// ============================================

// Add new city (Admin only)
router.post('/admin/cities', protect("superadmin", "subadmin"), cityController.addCity);

// Update city (Admin only)
router.put(
  "/admin/cities/:cityId",
  protect("superadmin", "subadmin"),
  cityController.updateCity
);

// Delete city (Admin only)
router.delete(
  "/admin/cities/:cityId",
  protect("superadmin", "subadmin"),
  cityController.deleteCity
);
// Example route to toggle city active status
router.patch(
  "/admin/cities/toggle/:cityId",
  protect("superadmin", "subadmin"),
  cityController.toggleCityStatus
);



router.patch("/:cityId/toggle", cityController.toggleCityStatus);

//  GEO TEST
router.get("/find/by-location", cityController.findCityByLocation);

module.exports = router;
