const mongoose = require('mongoose');
const ejs = require('ejs');
const catchAsync = require('../utils/catchAsync'); 
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const puppeteer = require('puppeteer-core');
const path = require('path');
const crypto = require("node:crypto");
const fs = require('fs').promises;
const upload = require('../middleware/multerConfig');

// ✅ UNIVERSAL BROWSER LAUNCHER - Windows + Lambda + Mac + Linux
// async function launchBrowser(isProduction) {
//   if (isProduction) {
//     // Lambda Production
//     try {
//       const chromium = require('@sparticuz/chromium');
//       return puppeteer.launch({
//         args: chromium.args,
//         defaultViewport: chromium.defaultViewport,
//         executablePath: await chromium.executablePath(),
//         headless: true,
//         pipe: true
//       });
//     } catch (e) {
//       return puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//       });
//     }
//   } else {
//     // Local Dev - Cross-platform Chrome
//     const chromePaths = {
//       win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//       darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
//       linux: "/usr/bin/google-chrome"
//     };
    
//     return puppeteer.launch({
//       headless: true,
//       executablePath: chromePaths[process.platform] || undefined,
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-gpu'
//       ]
//     });
//   }
// }
// ✅ LAMBDA-PROVEN WORKING
async function launchBrowser(isProduction) {
  if (isProduction) {
    // FORCE Lambda chromium (ignores chromium-min)
    const chromium = require('@sparticuz/chromium');
    
    // Lambda-specific args FIRST
    const lambdaArgs = [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ];
    
    return puppeteer.launch({
      args: lambdaArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: 'new',  // Puppeteer v23+
      pipe: true
    });
  } else {
    return puppeteer.launch({
      headless: true,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
}


/** 
 * 1. GENERATE INVOICE 
 * POST /api/v1/invoice/generateinv
 */
exports.generateInvoice = catchAsync(async (req, res, next) => {
  const { 
    bookingId, 
    patientId, 
    doctorId, 
    billingDetails, 
    medicines = [], 
    additionalEquipment = [], 
    paymentStatus = "Unpaid" 
  } = req.body;

  // 1. Validate booking exists & completed
  const booking = await Booking.findById(bookingId)
    .populate('serviceId', 'name category')
    .populate('servicePartnerId', 'firstName specialization');
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found"
    });
  }
  
  if (!["Completed", "TreatmentCompleted"].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: "Invoice only for completed bookings"
    });
  }

  // 2. Validate categories (simplified)
  for (let med of medicines) {
    if (med.categoryId) med.categoryName = med.categoryName || 'Medicine';
  }
  for (let equip of additionalEquipment) {
    if (equip.categoryId) equip.categoryName = equip.categoryName || 'Equipment';
  }

  // 3. Create invoice
  const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  
  const newInvoice = new Invoice({
    invoiceNumber,
    bookingId,
    patientId,
    doctorId: doctorId || booking.servicePartnerId?._id,
    billingDetails: {
      ...billingDetails,
      serviceName: billingDetails.serviceName || booking.serviceId?.name || "Doctor Visit",
      durationMinutes: billingDetails.durationMinutes || booking.duration || 30,
      calculatedBase: billingDetails.calculatedBase || booking.pricing?.totalAmount || 590
    },
    medicines,
    additionalEquipment,
    paymentStatus,
    totals: {
      subtotal: billingDetails.calculatedBase || 590,
      grandTotal: billingDetails.calculatedBase || 590,
      gstAmount: 0,
      cgst: 0,
      sgst: 0
    }
  });

  const savedInvoice = await newInvoice.save();
  
  // 4. Mark booking as invoiced
  booking.isInvoiceGenerated = true;
  await booking.save();

  res.status(201).json({
    success: true,
    message: "Invoice generated successfully",
    data: savedInvoice,
    pdfUrl: null
  });
});

/** 
 * 2. DOWNLOAD INVOICE PDF 
 * GET /api/v1/invoice/:invoiceId/download
 * GET /api/v1/invoice/:bookingId/download  
 * GET /api/v1/invoice/download?bookingId=xxx
 */
exports.downloadInvoice = [
  upload.single('attachment'),
  catchAsync(async (req, res, next) => {
    let browser;
    
    try {
      let invoice;
      const { bookingId, invoiceId } = req.params;
      const queryBookingId = req.query.bookingId;
      const targetBookingId = bookingId || queryBookingId;

      // Handle ALL routes
      if (invoiceId) {
        invoice = await Invoice.findById(invoiceId)
          .populate("patientId", "firstName phone address email")
          .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
      } else if (targetBookingId) {
        invoice = await Invoice.findOne({ bookingId: targetBookingId })
          .populate("patientId", "firstName phone address email")
          .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
        
        // Auto-create minimal invoice
        if (!invoice) {
          const booking = await Booking.findById(targetBookingId)
            .populate('serviceId', 'name category')
            .populate('servicePartnerId', 'firstName phone specialization');
         
          if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
          }
         
          invoice = await Invoice.create({
            invoiceNumber: `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
            bookingId: targetBookingId,
            patientId: booking.patientId._id,
            doctorId: booking.servicePartnerId?._id || null,
            billingDetails: {
              serviceName: booking.serviceId?.name || 'Service',
              durationMinutes: booking.duration || 30,
              calculatedBase: booking.pricing?.totalAmount || 500,
            },
            totals: {
              subtotal: booking.pricing?.totalAmount || 500,
              grandTotal: booking.pricing?.totalAmount || 500
            }
          });
         
          invoice = await Invoice.findById(invoice._id)
            .populate("patientId", "firstName phone address email")
            .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
        }
      }
     
      if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
      }

      // Generate HTML template
      const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
      const html = await ejs.renderFile(templatePath, {
        invoice: {
          ...invoice.toObject(),
          patientId: invoice.patientId || { firstName: 'N/A' },
          doctorId: invoice.doctorId || { firstName: 'N/A' },
          hasAttachment: !!req.file,
          attachmentName: req.file?.originalname
        }
      });

      // 🔥 UNIVERSAL BROWSER LAUNCH
      browser = await launchBrowser(process.env.NODE_ENV === 'production');
     
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      
      const pdf = await page.pdf({ 
        format: "A4", 
        printBackground: true,
        margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
      });

      // Cleanup attachment
      if (req.file?.path) {
        require('fs').unlinkSync(req.file.path);
      }

      // Dual response: PDF stream or JSON
      const filename = `INV-${invoice.invoiceNumber}.pdf`;
      const wantsPdf = req.headers.accept === 'application/pdf' || req.query.format === 'pdf';
      
      if (wantsPdf) {
        res.set({ 
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdf.length,
          "Cache-Control": "no-store"
        });
        res.send(pdf);
      } else {
        res.json({
          success: true,
          message: "PDF generated successfully",
          filename,
          size: pdf.length,
          downloadUrl: `${req.originalUrl}?format=pdf`
        });
      }
     
    } catch (error) {
      console.error('PDF Error:', error);
      if (req.file?.path) {
        require('fs').unlink(req.file.path, () => {});
      }
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    } finally {
      if (browser) await browser.close();
    }
  })
];

/** 
 * 3. GET SINGLE INVOICE (JSON)
 * GET /api/v1/invoice/:invoiceId
 */
exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.invoiceId)
    .populate("patientId", "firstName phone address email")
    .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
  
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

/** 
 * 4. GET PATIENT INVOICES BY SERVICE PROVIDER
 * GET /api/v1/service-provider/:patientId/invoices?details=full&dateFilterType=today
 */
exports.getPatientInvoicesByServiceProvider = catchAsync(async (req, res, next) => {
  const patientId = req.params.patientId;
  const { 
    details = "basic", 
    dateFilterType, 
    startDate, 
    endDate, 
    treatmentId: queryTreatmentId 
  } = req.query;

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID format"
    });
  }

  // Build query
  let query = { patientId };

  if (queryTreatmentId && mongoose.Types.ObjectId.isValid(queryTreatmentId)) {
    query.treatmentId = queryTreatmentId;
  }

  // Date filters
  if (dateFilterType === "today") {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
  } else if (dateFilterType === "week") {
    const now = new Date();
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
  } else if (dateFilterType === "month") {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
  } else if (dateFilterType === "custom" && startDate && endDate) {
    query.appointmentDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Find bookings
  const bookings = await Booking.find(query)
    .populate("serviceId", "name category modes price")
    .populate("servicePartnerId", "name email phone firstName")
    .populate("treatmentId", "status validTill")
    .sort({ appointmentDate: -1 });

  // Calculate stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => 
    ["Completed", "TreatmentCompleted"].includes(b.status)
  ).length;
  const progressPercentage = totalBookings > 0 
    ? Math.round((completedBookings / totalBookings) * 100) 
    : 0;

  const stats = {
    totalSessions: totalBookings,
    completedSessions: completedBookings,
    pendingSessions: bookings.filter(b => b.status === "Pending").length,
    inProgressSessions: bookings.filter(b => b.status === "In-Progress").length,
    progressPercentage
  };

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Enhanced bookings with invoice status
  const bookingsWithInvoiceStatus = bookings.map(booking => {
    const isInvoiceGenerated = Boolean(
      booking.isInvoiceGenerated === true || 
      booking.isInvoiceGenerated === 'true' || 
      booking.get('isInvoiceGenerated')
    );
    
    const isTreatmentCompleted = ["Completed", "TreatmentCompleted"].includes(booking.status);

    return {
      ...booking.toObject(),
      isInvoiceGenerated,
      invoiceStatus: isInvoiceGenerated ? 'generated' : 'pending',
      invoiceAction: isInvoiceGenerated
        ? `${baseUrl}/api/v1/invoice/${booking._id}/download`
        : `${baseUrl}/api/v1/invoice/generateinv/${patientId}?bookingId=${booking._id}`,
      generateAction: !isInvoiceGenerated ? booking._id : null,
      showInvoiceButton: isTreatmentCompleted,
      buttonText: isInvoiceGenerated ? '📥 Download Invoice' : '➕ Generate Invoice',
      buttonType: isInvoiceGenerated ? 'download' : 'generate',
      buttonVariant: isInvoiceGenerated ? 'success' : 'warning',
      isTreatmentCompleted
    };
  });

  const response = {
    success: true,
    count: bookings.length,
    stats,
    data: bookingsWithInvoiceStatus
  };

  // Full details with invoices
  if (details === "full") {
    const invoices = await Invoice.find({
      bookingId: { $in: bookings.map(b => b._id) }
    })
      .populate("patientId", "name email phone")
      .populate("doctorId", "name email phone");

    response.invoices = invoices.map(inv => ({
      ...inv.toObject(),
      downloadUrl: `${baseUrl}/api/v1/invoice/${inv._id}/download`
    }));

    response.invoiceSummary = {
      totalInvoices: invoices.length,
      hasInvoices: invoices.length > 0
    };
  }

  res.status(200).json(response);
});

/** 
 * 5. GET ALL INVOICES (Admin)
 * GET /api/v1/invoice
 */
exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, patientId, bookingId } = req.query;
  
  const query = {};
  if (status) query.paymentStatus = status;
  if (patientId) query.patientId = patientId;
  if (bookingId) query.bookingId = bookingId;

  const invoices = await Invoice.find(query)
    .populate("patientId", "firstName phone")
    .populate("doctorId", "firstName specialization")
    .populate("bookingId", "appointmentDate status")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Invoice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: invoices.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: invoices
  });
});

/** 
 * 6. UPDATE INVOICE PAYMENT STATUS
 * PATCH /api/v1/invoice/:id/payment
 */
exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentStatus, paymentMethod, transactionId } = req.body;
  
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus,
      paymentDetails: {
        method: paymentMethod,
        transactionId,
        updatedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  )
    .populate("patientId", "firstName phone")
    .populate("doctorId", "firstName specialization");

  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  res.status(200).json({
    success: true,
    message: "Payment status updated",
    data: invoice
  });
});

/** 
 * 7. DELETE INVOICE
 * DELETE /api/v1/invoice/:id
 */
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  
  if (!invoice) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  // Unmark booking
  await Booking.findByIdAndUpdate(invoice.bookingId, {
    isInvoiceGenerated: false
  });

  res.status(200).json({
    success: true,
    message: "Invoice deleted successfully"
  });
});
