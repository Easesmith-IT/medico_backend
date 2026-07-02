const express = require("express");
const router = express.Router();
const serviceController = require("../controller/serviceController");
const {
  protect,
  verifyAdminRole,
  verifyDoctorRole,
} = require("../middleware/auth");
const { createUpload } = require("../middleware/gcpUploadMiddleware.js");

// Reusable GCP upload: image + icon for createService
const serviceImageUpload = createUpload({
  fields: [
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ],
  fileTypes: "image",
  maxFileSize: 5 * 1024 * 1024, // 5MB
});

// Get All Services
router.get("/getAllServices", serviceController.getAllServices);

// Search Services
router.get("/search", serviceController.searchServices);

// Select and save multiple services for a patient
router.post(
  "/selectService",
  protect("patient", "admin", "doctor","superadmin", "superAdmin"),
  serviceController.selectService,
);

// Get Services by Category
router.get("/category/:category", serviceController.getServicesByCategory);

// Get Nursing Services by Type
router.get("/nursing/:nursingType", serviceController.getNursingServicesByType);

// Get Services by City
router.get("/city/:cityId", serviceController.getServicesByCity);

// Calculate Service Price
router.get("/:id/price", serviceController.calculateServicePrice);

// Get Available Slots for Service
router.get("/:serviceId/slots", serviceController.getAvailableSlots);

// Get Service by ID
router.get("/getServiceById/:id", serviceController.getServiceById);

// Create Service - Only Admin can
// router.post('/createService', protect('admin'), serviceController.createService);

router.post(
  "/createService",
  protect("admin", "superadmin"),
  serviceImageUpload,
  serviceController.createService,
);

// Get Service Statistics
router.get(
  "/admin/statistics",
  verifyAdminRole,
  serviceController.getServiceStatistics,
);

// Bulk Update Services
router.post(
  "/admin/bulk-update",
  verifyAdminRole,
  serviceController.bulkUpdateServices,
);

// Update Service

router.patch(
  "/services/:id",
  protect("admin", "superadmin"), // Only allow these roles
  serviceImageUpload,
  serviceController.updateService,
);
// Delete Service (Soft Delete)
// router.delete('/deleteService/:id', verifyAdminRole, serviceController.deleteService);
router.delete(
  "/service/:id",
  protect("admin", "superadmin"),
  serviceController.deleteService,
);
// Restore Service
router.post("/:id/restore", verifyAdminRole, serviceController.restoreService);

// Toggle Service Status
// router.patch('/:id/toggle-status', verifyAdminRole, serviceController.toggleServiceStatus);
router.patch(
  "/:id/toggle-status",
  protect("admin", "superadmin"),
  serviceController.toggleServiceStatus,
);


module.exports = router;
