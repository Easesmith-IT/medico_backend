const mongoose = require('mongoose');
const ejs = require('ejs')
const catchAsync = require('../utils/catchAsync'); 
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const Patient = require('../models/patientModel');
const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
// const PDFDocument = require('pdfkit');
const moment = require('moment');
// const puppeteer = require('puppeteer');
const path = require('path');
const crypto = require("node:crypto");
const { uploadInvoiceToCloudinary } = require('../config/cloudinaryConfig');
const PDFDocument = require("pdfkit");
const uploadFile = require("../utils/uploadFile");
const os = require('os');
const fs = require('fs');
const generateInvoicePdf = require("../utils/generateInvoicePdf");
// const puppeteer = require('puppeteer-core');



// const chromium = require('@sparticuz/chromium-min');


// exports.generateInvoice = async (req, res) => {

//   try {
//     const { bookingId, patientId, doctorId, billingDetails, medicines, additionalEquipment } = req.body;

//     // Generate unique invoice number: INV-TIMESTAMP-HEX
//     const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//     const newInvoice = new Invoice({
//       invoiceNumber,
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment,
//     });

//     // The pre-save hook in the schema will handle all calculations for totals and GST [web:1]
//     const savedInvoice = await newInvoice.save();

//     res.status(201).json({
//       success: true,
//       message: "Invoice generated successfully",
//       data: savedInvoice,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

//best one 
// exports.generateInvoice = async (req, res) => {
//   try {
//     const { 
//       bookingId, 
//       patientId, 
//       doctorId, 
//       billingDetails, 
//       medicines, 
//       additionalEquipment 
//     } = req.body;

//     // Validate categories exist for medicines
//     if (medicines?.length > 0) {
//       for (let med of medicines) {
//         if (med.categoryId) {
//           const category = await ItemCategory.findById(med.categoryId);
//           if (!category || !category.isActive) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid medicine category: ${med.name}`
//             });
//           }
//           med.categoryName = category.name; // Denormalize
//         }
//       }
//     }

//     // Validate categories exist for equipment
//     if (additionalEquipment?.length > 0) {
//       for (let equip of additionalEquipment) {
//         if (equip.categoryId) {
//           const category = await ItemCategory.findById(equip.categoryId);
//           if (!category || !category.isActive) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid equipment category: ${equip.name}`
//             });
//           }
//           equip.categoryName = category.name; // Denormalize
//         }
//       }
//     }

//     const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    
//     const newInvoice = new Invoice({
//       invoiceNumber,
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment,
//     });

//     const savedInvoice = await newInvoice.save();
    
//     res.status(201).json({
//       success: true,
//       message: "Invoice generated successfully",
//       data: savedInvoice,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// exports.generateInvoice = async (req, res) => {
//   try {

//     const {
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment
//     } = req.body;

//     const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//     const newInvoice = new Invoice({
//       invoiceNumber,
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment
//     });

//     const savedInvoice = await newInvoice.save();

//     // ---------- GENERATE PDF ----------
//     const pdfBuffer = await generateInvoicePdf(savedInvoice);

//     const file = {
//       originalname: `${invoiceNumber}.pdf`,
//       buffer: pdfBuffer
//     };

//     const pdfUrl = await uploadFile(file);

//     savedInvoice.invoiceUrl = pdfUrl;
//     savedInvoice.isInvoiceGenerated = true;

//     await savedInvoice.save();

//     res.status(201).json({
//       success: true,
//       message: "Invoice generated successfully",
//       data: savedInvoice
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }; //best obne



exports.generateInvoice = async (req, res) => {
  try {
    const {
      bookingId,
      patientId,
      doctorId,
      serviceId,
      billingDetails,
      medicines,
      additionalEquipment
    } = req.body;

    // Validate required bookingId
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId format' });
    }

    // Calculate total for each medicine + preserve addedDate
    const medicinesWithTotal = (medicines || []).map(med => {
      const base = med.quantity * med.pricePerUnit;
      const gst  = (base * med.gstPercentage) / 100;
      return {
        ...med,
        total:     parseFloat((base + gst).toFixed(2)),
        addedDate: med.addedDate ? new Date(med.addedDate) : new Date()
      };
    });

    // Calculate total for each equipment
    const equipmentWithTotal = (additionalEquipment || []).map(eq => {
      const base = eq.quantity * eq.rate;
      const gst  = (base * eq.gstPercentage) / 100;
      return {
        ...eq,
        total: parseFloat((base + gst).toFixed(2))
      };
    });

    // Calculate invoice totals
    const medSubtotal = medicinesWithTotal.reduce((sum, m) => sum + (m.quantity * m.pricePerUnit), 0);
    const eqSubtotal  = equipmentWithTotal.reduce((sum, e) => sum + (e.quantity * e.rate), 0);
    const subtotal    = parseFloat((medSubtotal + eqSubtotal).toFixed(2));

    const gstAmount = parseFloat((
      medicinesWithTotal.reduce((sum, m) => sum + ((m.quantity * m.pricePerUnit * m.gstPercentage) / 100), 0) +
      equipmentWithTotal.reduce((sum, e) => sum + ((e.quantity * e.rate * e.gstPercentage) / 100), 0)
    ).toFixed(2));

    const cgst       = parseFloat((gstAmount / 2).toFixed(2));
    const sgst       = parseFloat((gstAmount / 2).toFixed(2));
    const grandTotal = parseFloat((subtotal + gstAmount).toFixed(2));

    const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const newInvoice = new Invoice({
      invoiceNumber,
      bookingId,
      patientId,
      doctorId,
      serviceId,
      billingDetails,
      medicines:           medicinesWithTotal,
      additionalEquipment: equipmentWithTotal,
      totals: { subtotal, gstAmount, cgst, sgst, grandTotal }
    });

    const savedInvoice = await newInvoice.save();

    // ✅ Populate patient & doctor — this also brings back addedDate from saved medicines
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate('patientId', 'firstName phone address')
      .populate('doctorId',  'firstName phone specialization medicalRegistrationNumber address')
      .lean(); // .lean() converts to plain JS object so addedDate is a real Date
console.log('medicines with dates:', JSON.stringify(populatedInvoice.medicines, null, 2));
    // ---------- GENERATE PDF with populated data ----------
    const pdfBuffer = await generateInvoicePdf(populatedInvoice);

    const file = {
      originalname: `${invoiceNumber}.pdf`,
      buffer: pdfBuffer
    };

    const pdfUrl = await uploadFile(file);

    savedInvoice.invoiceUrl         = pdfUrl;
    savedInvoice.isInvoiceGenerated = true;
    await savedInvoice.save();

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data:    savedInvoice
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// exports.generateInvoice = async (req, res) => {
//   try {

//     const {
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment
//     } = req.body;

//     const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//     const newInvoice = new Invoice({
//       invoiceNumber,
//       bookingId,
//       patientId,
//       doctorId,
//       billingDetails,
//       medicines,
//       additionalEquipment
//     });

//     const savedInvoice = await newInvoice.save();

//     // ---------- GENERATE PDF ----------
//     const doc = new PDFDocument();

//     let buffers = [];
//     doc.on("data", buffers.push.bind(buffers));

//     doc.on("end", async () => {

//       const pdfBuffer = Buffer.concat(buffers);

//       const file = {
//         originalname: `${invoiceNumber}.pdf`,
//         buffer: pdfBuffer
//       };

//       const pdfUrl = await uploadFile(file);

//       savedInvoice.invoiceUrl = pdfUrl;
//       savedInvoice.isInvoiceGenerated = true;

//       await savedInvoice.save();

//       res.status(201).json({
//         success: true,
//         message: "Invoice generated successfully",
//         data: savedInvoice
//       });

//     });

//     doc.fontSize(20).text("Invoice", { align: "center" });
//     doc.moveDown();

//     doc.text(`Invoice Number: ${invoiceNumber}`);
//     doc.text(`Booking ID: ${bookingId}`);
//     doc.text(`Total: ₹${billingDetails.calculatedBase}`);

//     doc.end();

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


//best one
// exports.downloadInvoice = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.invoiceId)
//       .populate("patientId")
//       .populate("doctorId");

//     if (!invoice) return res.status(404).send("Invoice not found");

//     const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
//     const html = await ejs.renderFile(templatePath, { invoice });

//     // --- FIX STARTS HERE ---
//     const isProduction = process.env.NODE_ENV === 'production';
    
//     const browser = await puppeteer.launch({
//       args: isProduction ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
//       defaultViewport: chromium.defaultViewport,
//       executablePath: isProduction 
//         ? await chromium.executablePath() 
//         : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Path for Windows
//       headless: isProduction ? chromium.headless : true,
//     });
//     // --- FIX ENDS HERE ---

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });
//     const pdf = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     res.set({ 
//       "Content-Type": "application/pdf", 
//       "Content-Disposition": `attachment; filename=INV-${invoice.invoiceNumber}.pdf` 
//     });
//     res.send(pdf);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("patientId")
      .populate("doctorId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    // If already generated return URL
    if (invoice.isInvoiceGenerated && invoice.invoiceUrl) {
      return res.json({
        success: true,
        downloadUrl: invoice.invoiceUrl
      });
    }

    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    // ---------- PDF CONTENT ----------
    doc.fontSize(20).text("Invoice", { align: "center" });

    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Patient: ${invoice.patientId?.name || ""}`);
    doc.text(`Doctor: ${invoice.doctorId?.name || ""}`);
    doc.text(`Date: ${new Date().toDateString()}`);

    doc.moveDown();

    doc.text("Medicines");

    invoice.medicines?.forEach((med, i) => {
      doc.text(`${i + 1}. ${med.name} - ₹${med.price}`);
    });

    doc.moveDown();

    doc.text("Additional Equipment");

    invoice.additionalEquipment?.forEach((equip, i) => {
      doc.text(`${i + 1}. ${equip.name} - ₹${equip.price}`);
    });

    doc.moveDown();

    doc.text(`Total Amount: ₹${invoice.billingDetails?.totalAmount}`);

    const done = new Promise((resolve, reject) => {
      doc.once("end", resolve);
      doc.once("error", reject);
    });
    doc.end();
    await done;

    const pdfBuffer = Buffer.concat(buffers);
    const file = {
      originalname: `${invoice.invoiceNumber}.pdf`,
      buffer: pdfBuffer,
    };

    const pdfUrl = await uploadFile(file);
    invoice.invoiceUrl = pdfUrl;
    invoice.isInvoiceGenerated = true;
    await invoice.save();

    return res.json({
      success: true,
      downloadUrl: pdfUrl,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// exports.downloadInvoice = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.invoiceId)
//       .populate("patientId")
//       .populate("doctorId");

//     if (!invoice) return res.status(404).send("Invoice not found");

//     const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
//     const html = await ejs.renderFile(templatePath, { invoice });

//     const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });
//     const pdf = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=INV-${invoice.invoiceNumber}.pdf` });
//     res.send(pdf);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.downloadInvoice = async (req, res) => {
//   try {
//     // 1. Fetch data from DB
//     const invoice = await Invoice.findById(req.params.invoiceId).populate("patientId doctorId");
//     if (!invoice) return res.status(404).json({ message: "Invoice not found" });

//     // 2. Define path to your local 'temp' folder
//     const uploadDir = path.join(__dirname, "..", "temp");
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
//     const fileName = `inv-${invoice.invoiceNumber}.pdf`;
//     const localPath = path.join(uploadDir, fileName);

//     // 3. Render HTML and Generate PDF
//     const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
//     const htmlContent = await ejs.renderFile(templatePath, { invoice });

//     const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    
//     // Save to local 'temp' folder
//     await page.pdf({ path: localPath, format: "A4" });
//     await browser.close();

//     // 4. Send the file as a response
//     // Option A: res.sendFile (Opens in browser)
//     // Option B: res.download (Forces download)
//     res.status(200).sendFile(localPath, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         res.status(500).send("Could not send the file.");
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };




// exports.downloadInvoice = async (req, res) => {
//   try {
//     const { invoiceId } = req.params;
//       console.log("Searching for ID:", invoiceId);
//     // Find by MongoDB _id instead of custom invoiceNumber
//     const invoice = await Invoice.findById(invoiceId)
//       .populate("patientId")
//       .populate("doctorId");

//     if (!invoice) return res.status(404).json({ message: "Invoice not found" });

//     const templatePath = path.join(__dirname, "../views/invoice-template.ejs");
//     const htmlContent = await ejs.renderFile(templatePath, { invoice });

//     const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true
//     });

//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     res.status(500).json({ message: "Error generating PDF", error: error.message });
//   }
// };

// 3. Get Invoice Details (JSON)
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate("patientId doctorId");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getPatientInvoicesByServiceProvider = catchAsync(async (req, res, next) => {
  let patientId;
  
  // ✅ FLEXIBLE: Works with /invoice/:patientId OR /service-provider/:spId/patient/:patientId
  if (req.params.patientId) {
    patientId = req.params.patientId;
  } else {
    return res.status(400).json({
      success: false,
      message: "Patient ID required",
    });
  }

  const { details = "basic", serviceProviderId, dateFilterType, startDate, endDate } = req.query;

  // Validate patient ID
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID format",
    });
  }

  // Optional: Filter by service provider (if provided)
  let query = { patientId };
  if (serviceProviderId && mongoose.Types.ObjectId.isValid(serviceProviderId)) {
    query.servicePartnerId = serviceProviderId;
  }

  // Date filters (same logic)
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
  } // ... other date filters

  const bookings = await Booking.find(query)
    .populate("serviceId", "name category modes")
    .populate("servicePartnerId", "name email phone")
    .populate("treatmentId", "status validTill")
    .sort({ appointmentDate: -1 });

  const stats = {
    totalSessions: bookings.length,
    completedSessions: bookings.filter(b => ["Completed", "TreatmentCompleted"].includes(b.status)).length,
    pendingSessions: bookings.filter(b => b.status === "Pending").length,
    inProgressSessions: bookings.filter(b => b.status === "In-Progress").length,
  };

  const response = {
    success: true,
    count: bookings.length,
    stats,
    data: bookings,
  };

  // FULL details → Add invoices with CORRECT URLs
  if (details === "full") {
    const invoices = await Invoice.find({
      bookingId: { $in: bookings.map(b => b._id) },
    })
      .populate("patientId", "name email phone")
      .populate("doctorId", "name email phone");

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    response.data = {
      bookings,
      invoices: invoices.map(inv => ({
        ...inv.toObject(),
        // downloadUrl: `${baseUrl}/api/v1/invoice/${inv._id}/download`  //    FIXED URL
              downloadUrl: `${baseUrl}/api/v1/patient/${patientId}/bookings?download=${inv.bookingId}`,
      })),
      invoiceSummary: {
        totalInvoices: invoices.length,
        hasInvoices: invoices.length > 0,
      }
    };
  }

  res.status(200).json(response);
});

