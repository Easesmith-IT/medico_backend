const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const serviceProviderController = require("../controller/providerController");
const { createUpload } = require("../middleware/gcpUploadMiddleware.js");

const serviceProviderImageUpload = createUpload({
  fields: [
    { name: "profilePhoto", maxCount: 1 },

    { name: "identityProofFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },

    { name: "educationalCertificatesFiles", maxCount: 10 },
    { name: "professionalCertificatesFiles", maxCount: 10 },

    { name: "registrationCertificateFile", maxCount: 1 },

    { name: "experienceCertificatesFiles", maxCount: 10 },

    { name: "policeVerificationFile", maxCount: 1 },
  ],
  fileTypes: "imageAndPdf",
  maxFileSize: 5 * 1024 * 1024,
});

router.get(
  "/service-providers/by-service/:serviceId",
  serviceProviderController.getProvidersByServiceId,
);
// Only allow superadmin and subadmin to create service provider
router.post(
  "/createservice-provider",
  protect("superadmin", "subadmin"),
  serviceProviderImageUpload,
  serviceProviderController.createServiceProvider,
);
router.post("/login", serviceProviderController.loginServiceProvider);
// Get all service providers - can be public or protected as needed
router.get(
  "/getAllServiceProviders",
  // optionally add protect() if you want to restrict access
  serviceProviderController.getAllServiceProviders,
);

// Get service provider by ID - can be public or protected as needed
router.get(
  "/service-provider/appointments",
  protect(),
  serviceProviderController.getServiceProviderAppointments,
);

router.get(
  "/service-provider/appointments/:id",
  protect(),
  serviceProviderController.getSingleAppointment,
);

router.get(
  "/service-provider/:id",
  // optionally add protect() if you want to restrict access
  serviceProviderController.getServiceProviderById,
);

// Update service provider by ID - admin only
router.put(
  "/service-provider/:id",
  protect("superadmin", "subadmin"),
  serviceProviderImageUpload,
  serviceProviderController.updateServiceProvider,
);

// Soft delete service provider by ID - admin only
router.delete(
  "/service-provider/:id",
  protect("superadmin", "subadmin"),
  serviceProviderController.deleteServiceProvider,
);

router.patch(
  "/:id/toggle-status",
  protect("superadmin", "subadmin"),
  serviceProviderController.toggleStatus,
);

// router.post('/providerBookings',
//   protect(['serviceprovider']),
//   serviceProviderController.createProviderBooking
// );

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
