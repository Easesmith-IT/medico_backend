const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const   serviceProviderController = require('../controller/providerController');

// Only allow superadmin and subadmin to create service provider
router.post('/service-provider', protect('superadmin', 'subadmin'),serviceProviderController.createServiceProvider);






// Get all service providers - can be public or protected as needed
router.get(
  '/service-providers',
  // optionally add protect() if you want to restrict access
  serviceProviderController.getAllServiceProviders
);

// Get service provider by ID - can be public or protected as needed
router.get(
  '/service-provider/:id',
  // optionally add protect() if you want to restrict access
  serviceProviderController.getServiceProviderById
);

// Update service provider by ID - admin only
router.put(
  '/service-provider/:id',
  protect('superadmin', 'subadmin'),
  serviceProviderController.updateServiceProvider
);

// Soft delete service provider by ID - admin only
router.delete(
  '/service-provider/:id',
  protect('superadmin', 'subadmin'),
  serviceProviderController.deleteServiceProvider
);

module.exports = router;


// const express = require('express');
// const router = express.Router();

// const serviceProviderController = require('../controller/providerController');
// const { protect } = require('../middleware/auth');

// router.post('/service-provider', protect('superadmin', 'subadmin'), serviceProviderController.createServiceProvider);
// router.get('/service-providers', serviceProviderController.getAllServiceProviders);
// router.get('/service-provider/:id', serviceProviderController.getServiceProviderById);
// router.put('/service-provider/:id', protect('superadmin', 'subadmin'), serviceProviderController.updateServiceProvider);
// router.delete('/service-provider/:id', protect('superadmin', 'subadmin'), serviceProviderController.deleteServiceProvider);

// module.exports = router;
