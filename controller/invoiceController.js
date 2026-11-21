const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const treatmentInvoiceService = require('../services/treatmentInvoiceService');
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const generateInvoicePdf = require('../utils/generateInvoicePdf');

exports.generateTreatmentInvoice = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { institutionalDiscount = 0, finalAdjustments = [] } = req.body || {};

    const requestedBy = {
      id: req.user?.id,
      name: req.user?.name || req.user?.firstName || 'Clinical Administrator',
      role: req.user?.role || 'Admin',
    };

    const invoice = await treatmentInvoiceService.compileAndMaterializeTreatmentInvoice({
      treatmentId,
      requestedBy,
      institutionalDiscount: Number(institutionalDiscount) || 0,
      finalAdjustments: Array.isArray(finalAdjustments) ? finalAdjustments : [],
    });

    return res.status(201).json({
      success: true,
      message: 'Treatment consolidated invoice compiled and materialized successfully',
      data: invoice,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      code: error.code || undefined,
    });
  }
};

exports.getTreatmentInvoice = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const invoice = await treatmentInvoiceService.getLatestTreatmentInvoice(treatmentId, req.user);
    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTreatmentInvoiceHistory = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const history = await treatmentInvoiceService.getTreatmentInvoiceHistory(treatmentId, req.user);
    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const rawId = req.params.invoiceId;
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format' });
    }

    let invoice = await Invoice.findById(rawId);

    // If caller passed a bookingId, resolve its Treatment's latest consolidated invoice
    if (!invoice) {
      const booking = await Booking.findById(rawId).select('treatmentId').lean();
      if (booking?.treatmentId) {
        invoice = await Invoice.findOne({
          treatmentId: booking.treatmentId,
          invoiceType: 'TreatmentConsolidated',
          isLatest: true,
        });
        if (!invoice) {
          invoice = await treatmentInvoiceService.compileAndMaterializeTreatmentInvoice({
            treatmentId: booking.treatmentId,
          });
        }
      }
    }

    if (!invoice || invoice.invoiceType !== 'TreatmentConsolidated') {
      return res.status(404).json({
        success: false,
        message: 'Consolidated invoice not found',
      });
    }

    if (invoice.securityHash && !treatmentInvoiceService.verifyInvoiceSecurityHash(invoice)) {
      return res.status(403).json({
        success: false,
        message: 'Security validation failed: Invoice cryptographic signature is invalid or record has been tampered with.',
      });
    }

    if (req.headers.accept && req.headers.accept.includes('application/json') && invoice.pdfUrl && invoice.pdfUrl.startsWith('http') && req.query.regenerate !== 'true') {
      return res.json({ success: true, downloadUrl: invoice.pdfUrl });
    }

    if (invoice.localPdfPath && fs.existsSync(invoice.localPdfPath) && req.query.regenerate !== 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber || 'invoice'}.pdf"`);
      return res.sendFile(path.resolve(invoice.localPdfPath));
    }

    if (invoice.pdfUrl && invoice.pdfUrl.startsWith('http') && req.query.regenerate !== 'true') {
      return res.redirect(invoice.pdfUrl);
    }

    const pdfBuffer = await generateInvoicePdf(typeof invoice.toObject === 'function' ? invoice.toObject() : invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber || 'invoice'}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate('patientId doctorId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    return res.status(200).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
