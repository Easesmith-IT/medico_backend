const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');

// Generate Invoice (creates DB record + PDF)
// router.post('/generate', invoiceController.generateInvoice);

// // Download Invoice PDF
// router.get('/download/:invoiceId', invoiceController.downloadInvoice);
// router.get('/:invoiceId/download', invoiceController.downloadInvoice);
// // Get Invoice Details
// router.get('/:invoiceId', invoiceController.getInvoice);
// router.get('/generateinv/:patientId', 
// //   protect(['serviceProvider']), 
//   invoiceController.getPatientInvoicesByServiceProvider
// );



router.post('/generate', invoiceController.generateInvoice);

// 2. generateinv BEFORE /:invoiceId
router.get('/generateinv/:patientId', 
  // protect(['serviceProvider']), 
  invoiceController.getPatientInvoicesByServiceProvider
);

// 3. Download routes
// router.get('/download/:invoiceId', invoiceController.downloadInvoice);
// router.get('/:invoiceId/download', invoiceController.downloadInvoice);
// ✅ ONE ROUTE handles ALL link types
router.get("/download/:invoiceId", invoiceController.downloadInvoice);

// 4. Generic param route LAST
router.get('/:invoiceId', invoiceController.getInvoice);

module.exports = router;

