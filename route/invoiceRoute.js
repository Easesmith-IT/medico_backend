const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');

// Generate Invoice (creates DB record + PDF)
router.post('/generate', invoiceController.generateInvoice);

// Download Invoice PDF
router.get('/download/:invoiceId', invoiceController.downloadInvoice);
router.get('/:invoiceId/download', invoiceController.downloadInvoice);
// Get Invoice Details
router.get('/:invoiceId', invoiceController.getInvoice);
router.get('/generateinv/:patientId', 
//   protect(['serviceProvider']), 
  invoiceController.getPatientInvoicesByServiceProvider
);
module.exports = router;
