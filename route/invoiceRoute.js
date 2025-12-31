const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');

// Generate Invoice (creates DB record + PDF)
router.post('/generate', invoiceController.generateInvoice);

// Download Invoice PDF
router.get('/download/:invoiceId', invoiceController.downloadInvoice);

// Get Invoice Details
router.get('/:invoiceId', invoiceController.getInvoice);

module.exports = router;
