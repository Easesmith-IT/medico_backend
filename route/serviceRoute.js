// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controller/serviceController');
const { protect } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================




router.get('/getAllServices', serviceController.getAllServices);
router.get('/getServiceById/:serviceId', serviceController.getServiceById);
router.get('/services/:cityId', serviceController.getServicesByCity);
router.get('/creator/:creatorId', serviceController.getServicesByCreator);
router.get('/availableServices', protect(), serviceController.getAvailableServices);
router.get('/providers/:serviceId', serviceController.getProvidersByService);
router.get('/fullServiceInfo/:serviceId', serviceController.getFullServiceInfo);

// === PROTECTED ROUTES ===
router.post('/createService', protect('admin','superAdmin'), serviceController.createService);
router.put('/updateService/:serviceId', protect('admin', 'doctor'), serviceController.updateService);
router.post('/selectService', protect('doctor'), serviceController.selectService);

module.exports = router;

















// Get all services with filters and pagination
// // GET /api/services?page=1&limit=10&cityId=xxx&isActive=true&search=doctor&sortBy=basePrice&order=asc
// router.get('/getAllServices', serviceController.getAllServices);

// // Get service by ID
// // GET /api/services/:serviceId
// router.get('/:serviceId', serviceController.getServiceById);

// // Get services by city
// // GET /api/services/city/:cityId
// router.get('/city/:cityId', serviceController.getServicesByCity);

// // Get services by creator
// // GET /api/services/creator/:creatorId?role=admin
// router.get('/creator/:creatorId', serviceController.getServicesByCreator);

// // ==================== PROTECTED ROUTES ====================

// // Create service (Admin or Doctor only)
// // POST /api/services
// // router.post('/createService', protect('admin', 'doctor'), serviceController.createService);
// router.post('/createService', protect('admin', 'doctor'), serviceController.createService);

// // Update service (Admin or Doctor only)
// // PUT /api/services/:serviceId
// router.put('/updateService/:serviceId', protect('admin', 'doctor'), serviceController.updateService);

// module.exports = router;
