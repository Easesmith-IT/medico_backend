// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controller/serviceController');
const { verifyAdminRole } = require('../middleware/auth');

// PUBLIC ROUTES (No Authentication Required)


// Get All Available Services
router.get('/', 
  serviceController.getAllServices
);

// Get Service Details
router.get('/:serviceId', 
  serviceController.getServiceDetails
);

// Get Verified Providers by Service Type
router.get('/providers/:serviceType', 
  serviceController.getProvidersByService
);

// Get Provider Full Profile
router.get('/provider/profile/:doctorId', 
  serviceController.getProviderProfile
);


// ADMIN ROUTES


// Create Service - Admin Only
router.post('/admin/create', 
  verifyAdminRole,
  serviceController.createService
);

// Update Service - Admin Only
router.put('/admin/update/:serviceId', 
  verifyAdminRole,
  serviceController.updateService
);

// Delete/Deactivate Service - Admin Only
router.delete('/admin/delete/:serviceId', 
  verifyAdminRole,
  serviceController.deleteService
);

module.exports = router;
