// // routes/serviceRoutes.js
// const express = require("express");
// const router = express.Router();
// const serviceController = require("../controller/serviceController");
// const { protect } = require("../middleware/auth");

// // ==================== PUBLIC ROUTES ====================

// router.get("/getAllServices", serviceController.getAllServices);
// router.get("/getServiceById/:serviceId", serviceController.getServiceById);
// router.get("/services/:cityId", serviceController.getServicesByCity);
// router.get("/creator/:creatorId", serviceController.getServicesByCreator);
// router.get(
//   "/availableServices",
//   protect(),
//   serviceController.getAvailableServices
// );
// router.get("/providers/:serviceId", serviceController.getProvidersByService);
// router.get("/fullServiceInfo/:serviceId", serviceController.getFullServiceInfo);

// // === PROTECTED ROUTES ===
// router.post(
//   "/createService",
//   protect("admin", "superAdmin"),
//   serviceController.createService
// );
// router.put(
//   "/updateService/:serviceId",
//   protect("admin", "doctor"),
//   serviceController.updateService
// );
// router.post(
//   "/selectService",
//   protect("doctor"),
//   serviceController.selectService
// );
// router.patch(
//   "/:serviceId/toggle-active",
//   protect("admin"),
//   serviceController.toggleServiceActive
// );

// module.exports = router;

// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controller/serviceController');
const { 
  protect, 
  verifyAdminRole, 
  verifyDoctorRole 
} = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Get All Services
router.get('/getAllServices', 
  serviceController.getAllServices
);

// Search Services
router.get('/search', 
  serviceController.searchServices
);

// Get Services by Category
router.get('/category/:category', 
  serviceController.getServicesByCategory
);

// Get Nursing Services by Type
// router.get('/nursing/:nursingType', 
//   serviceController.getNursingServicesByType
// );

// Get Services by City
router.get('/city/:cityId', 
  serviceController.getServicesByCity
);

// Calculate Service Price
router.get('/:id/price', 
  serviceController.calculateServicePrice
);

// Get Available Slots for Service
router.get('/:serviceId/slots', 
  serviceController.getAvailableSlots
);

// Get Service by ID
router.get('/:id', 
  serviceController.getServiceById
);

// ============================================
// ADMIN & DOCTOR ROUTES
// ============================================

// Create Service - Admin & Doctor
router.post('/createService', 
  // protect('admin', 'doctor'),
  protect('admin'),
  serviceController.createService
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get Service Statistics
router.get('/admin/statistics', 
  verifyAdminRole,
  serviceController.getServiceStatistics
);

// Bulk Update Services
router.post('/admin/bulk-update', 
  verifyAdminRole,
  serviceController.bulkUpdateServices
);

// Update Service
router.put('/:id', 
  verifyAdminRole,
  serviceController.updateService
);

// Delete Service (Soft Delete)
router.delete('/:id', 
  verifyAdminRole,
  serviceController.deleteService
);

// Restore Service
router.post('/:id/restore', 
  verifyAdminRole,
  serviceController.restoreService
);

// Toggle Service Status
router.patch('/:id/toggle-status', 
  verifyAdminRole,
  serviceController.toggleServiceStatus
);

module.exports = router;
