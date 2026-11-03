const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');
const { protect } = require('../middleware/auth');

// ==========================================
// TREATMENT CONSOLIDATED INVOICES (ENTERPRISE)
// ==========================================

// 1. Generate Materialized Snapshot on demand (Doctor, Attending Provider, Admin)
router.post(
  '/treatment/:treatmentId/generate',
  protect(['admin', 'superadmin', 'doctor', 'serviceprovider', 'serviceProvider']),
  invoiceController.generateTreatmentInvoice
);

// 2. Fetch Latest Materialized Invoice (O(1) read - Doctor, Attending Provider, Admin, Patient)
router.get(
  '/treatment/:treatmentId/current',
  protect(['admin', 'superadmin', 'doctor', 'serviceprovider', 'serviceProvider', 'patient']),
  invoiceController.getTreatmentInvoice
);

// 3. Treatment Invoice Version History (Audit & Insurance)
router.get(
  '/treatment/:treatmentId/history',
  protect(['admin', 'superadmin', 'doctor', 'serviceprovider', 'serviceProvider', 'patient']),
  invoiceController.getTreatmentInvoiceHistory
);

// ==========================================
// LEGACY SINGLE BOOKING & GENERAL INVOICES
// ==========================================

// Legacy Single-Booking Generate
router.post('/generate', invoiceController.generateInvoice);

// Legacy Service Provider Invoices
router.get(
  '/generateinv/:patientId',
  invoiceController.getPatientInvoicesByServiceProvider
);

// Download PDF (Handles both TreatmentConsolidated and Legacy Single Booking)
router.get('/download/:invoiceId', invoiceController.downloadInvoice);
router.get('/:invoiceId/download', invoiceController.downloadInvoice);

// Generic Invoice Details by ID
router.get('/:invoiceId', invoiceController.getInvoice);

module.exports = router;
