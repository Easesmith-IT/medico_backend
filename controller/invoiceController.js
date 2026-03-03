const mongoose = require('mongoose');
const ejs = require('ejs')
const catchAsync = require('../utils/catchAsync'); 
const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const Patient = require('../models/bookingModel');
const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
const PDFDocument = require('pdfkit');
const moment = require('moment');
// const puppeteer = require('puppeteer');
const path = require('path');
const crypto = require("node:crypto");
const { uploadInvoiceToCloudinary } = require('../config/cloudinaryConfig');
const os = require('os');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium-min');
const {User}= require("../models/bookingModel");
const upload = require('../middleware/multerConfig');
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

//before
exports.generateInvoice = async (req, res) => {
  try {
    const { 
      bookingId, 
      patientId, 
      doctorId, 
      billingDetails, 
      medicines, 
      additionalEquipment 
    } = req.body;

    // Validate categories exist for medicines
    if (medicines?.length > 0) {
      for (let med of medicines) {
        if (med.categoryId) {
          const category = await ItemCategory.findById(med.categoryId);
          if (!category || !category.isActive) {
            return res.status(400).json({
              success: false,
              message: `Invalid medicine category: ${med.name}`
            });
          }
          med.categoryName = category.name; // Denormalize
        }
      }
    }

    // Validate categories exist for equipment
    if (additionalEquipment?.length > 0) {
      for (let equip of additionalEquipment) {
        if (equip.categoryId) {
          const category = await ItemCategory.findById(equip.categoryId);
          if (!category || !category.isActive) {
            return res.status(400).json({
              success: false,
              message: `Invalid equipment category: ${equip.name}`
            });
          }
          equip.categoryName = category.name; // Denormalize
        }
      }
    }

    const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    
    const newInvoice = new Invoice({
      invoiceNumber,
      bookingId,
      patientId,
      doctorId,
      billingDetails,
      medicines,
      additionalEquipment,
    });

    const savedInvoice = await newInvoice.save();
    
    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: savedInvoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// exports.downloadInvoice = [
//   upload.single('attachment'), // Optional file
  
//   async (req, res) => {
//     let browser;
    
//     try {
//       // Handle both bookingId and invoiceId
//       let invoice;
//       const { bookingId, invoiceId } = req.params;
      
//       if (invoiceId) {
//         invoice = await Invoice.findById(invoiceId)
//           .populate("patientId")
//           .populate("doctorId");
//       } else if (bookingId) {
//         invoice = await Invoice.findOne({ bookingId })
//           .populate("patientId")
//           .populate("doctorId");
        
//         // Auto-create if no invoice
//         if (!invoice) {
//           const booking = await Booking.findById(bookingId);
//           if (booking) {
//             invoice = await Invoice.create({
//               invoiceNumber: `INV-${Date.now()}`,
//               bookingId,
//               patientId: booking.patientId,
//               doctorId: booking.servicePartnerId || null
//             });
//             invoice = await Invoice.findById(invoice._id)
//               .populate("patientId")
//               .populate("doctorId");
//           }
//         }
//       }
      
//       if (!invoice) {
//         return res.status(404).send("Invoice not found");
//       }

//       const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
//       const html = await ejs.renderFile(templatePath, { 
//         invoice,
//         hasAttachment: !!req.file,
//         attachmentName: req.file?.originalname 
//       });

//       // ✅ YOUR EXACT PUPPETEER FIX
//       const isProduction = process.env.NODE_ENV === 'production';
      
//       browser = await puppeteer.launch({
//         args: isProduction ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
//         defaultViewport: chromium.defaultViewport,
//         executablePath: isProduction 
//           ? await chromium.executablePath() 
//           : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//         headless: isProduction ? chromium.headless : true,
//       });

//       const page = await browser.newPage();
//       await page.setContent(html, { waitUntil: "networkidle0" });
//       const pdf = await page.pdf({ 
//         format: "A4", 
//         printBackground: true,
//         margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
//       });

//       // Cleanup temp file
//       if (req.file) {
//         fs.unlinkSync(req.file.path);
//       }

//       res.set({ 
//         "Content-Type": "application/pdf", 
//         "Content-Disposition": `attachment; filename=INV-${invoice.invoiceNumber}.pdf`,
//         "Content-Length": pdf.length
//       });
//       res.send(pdf);
      
//     } catch (error) {
//       console.error('PDF Error:', error);
      
//       // Cleanup temp file on error
//       if (req.file) {
//         fs.unlink(req.file.path, () => {});
//       }
      
//       res.status(500).json({ error: error.message });
//     } finally {
//       if (browser) {
//         await browser.close();
//       }
//     }
//   }
// ];




// exports.downloadInvoice = catchAsync(async (req, res, next) => {
//   try {
//     let invoice;
    
//     // ✅ HANDLE BOTH bookingId AND invoiceId
//     const { bookingId, invoiceId } = req.params;
//     const { bookingId: queryBookingId } = req.query;
    
//     const targetBookingId = bookingId || queryBookingId;
    
//     // 1. Try invoiceId first
//     if (invoiceId) {
//       invoice = await Invoice.findById(invoiceId)
//         .populate("patientId", "firstName phone address")
//         .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
//     } 
//     // 2. Try bookingId
//     else if (targetBookingId) {
//       invoice = await Invoice.findOne({ bookingId: targetBookingId })
//         .populate("patientId", "firstName phone address")
//         .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
      
//       // 3. No invoice? Auto-create minimal invoice
//       if (!invoice) {
//         const booking = await Booking.findById(targetBookingId)
//           .populate('serviceId', 'name category')
//           .populate('servicePartnerId', 'firstName phone specialization');
        
//         if (!booking) {
//           return res.status(404).json({ success: false, message: "Booking not found" });
//         }
        
//         const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
//         invoice = await Invoice.create({
//           invoiceNumber,
//           bookingId: targetBookingId,
//           patientId: booking.patientId,
//           doctorId: booking.servicePartnerId?._id || null,
//           billingDetails: {
//             serviceName: booking.serviceId?.name || 'Service',
//             durationMinutes: booking.duration || 30,
//             calculatedBase: booking.pricing?.totalAmount || 500,
//           },
//           totals: {
//             subtotal: booking.pricing?.totalAmount || 500,
//             grandTotal: booking.pricing?.totalAmount || 500
//           }
//         });
        
//         // Mark booking as invoiced
//         booking.isInvoiceGenerated = true;
//         await booking.save();
//       }
//     }
    
//     if (!invoice) {
//       return res.status(404).json({ success: false, message: "Invoice not found" });
//     }

//     // ✅ Generate PDF using your template
//     const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
//     const html = await ejs.renderFile(templatePath, { invoice });

//     const browser = await puppeteer.launch({
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//       headless: true,
//     });
    
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });
//     const pdf = await page.pdf({ 
//       format: "A4", 
//       printBackground: true,
//       margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
//     });
//     await browser.close();

//     res.set({ 
//       "Content-Type": "application/pdf", 
//       "Content-Disposition": `attachment; filename=INV-${invoice.invoiceNumber}.pdf`
//     });
//     res.send(pdf);
    
//   } catch (error) {
//     console.error('PDF Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });






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


exports.downloadInvoice = [
  upload.single('attachment'), // ✅ Uses YOUR multer config
  
  async (req, res) => {
    let browser;
    
    try {
      let invoice;
      const { bookingId, invoiceId } = req.params;
      const queryBookingId = req.query.bookingId; // ✅ For generateinv route
      
      // ✅ Handles ALL 3 routes
      if (invoiceId) {
        invoice = await Invoice.findById(invoiceId)
          .populate("patientId", "firstName phone address email")
          .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
      } else if (bookingId || queryBookingId) {
        const targetBookingId = bookingId || queryBookingId;
        
        invoice = await Invoice.findOne({ bookingId: targetBookingId })
          .populate("patientId", "firstName phone address email")
          .populate("doctorId", "firstName specialization medicalRegistrationNumber phone address");
        
        // ✅ Auto-create invoice if missing
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

      // ✅ Generate HTML with YOUR attachment support
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

      // ✅ PUPPETEER FIXED - Cross-platform Chrome path
      const chromePath = process.platform === 'win32' 
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === 'darwin'
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "/usr/bin/google-chrome";

      const isProduction = process.env.NODE_ENV === 'production';
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        executablePath: chromePath  // ✅ Fixes puppeteer-core error
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ 
        format: "A4", 
        printBackground: true,
        margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
      });

      // ✅ Cleanup YOUR temp file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      // ✅ FORCE DOWNLOAD headers
      res.set({ 
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="INV-${invoice.invoiceNumber}.pdf"`,
        "Content-Length": pdf.length,
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.send(pdf);
      
    } catch (error) {
      console.error('PDF Error:', error);
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      res.status(500).json({ error: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }
];



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

// exports.getPatientInvoicesByServiceProvider = catchAsync(async (req, res, next) => {
//   const patientId = req.params.patientId;
//   const { details = "basic", dateFilterType, startDate, endDate, treatmentId: queryTreatmentId } = req.query;

//   if (!mongoose.Types.ObjectId.isValid(patientId)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid patient ID format",
//     });
//   }

//   const patient = await Patient.findById(patientId);
//   if (!patient) {
//     return res.status(404).json({
//       success: false,
//       message: "Patient not found",
//     });
//   }

//   let query = { patientId };

//   if (queryTreatmentId) {
//     if (!mongoose.Types.ObjectId.isValid(queryTreatmentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid treatment ID format",
//       });
//     }
//     query.treatmentId = queryTreatmentId;
//   }

//   // Date filters
//   if (dateFilterType === "today") {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//   } else if (dateFilterType === "week") {
//     const now = new Date();
//     const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//     firstDayOfWeek.setHours(0, 0, 0, 0);
//     const lastDayOfWeek = new Date(firstDayOfWeek);
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//     lastDayOfWeek.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//   } else if (dateFilterType === "month") {
//     const now = new Date();
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     firstDayOfMonth.setHours(0, 0, 0, 0);
//     const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//     lastDayOfMonth.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
//   } else if (dateFilterType === "custom" && startDate && endDate) {
//     query.appointmentDate = {
//       $gte: new Date(startDate),
//       $lte: new Date(endDate),
//     };
//   }

//   // ✅ FIXED: No invoiceId populate - works with your schema
//   const bookings = await Booking.find(query)
//     .populate("serviceId", "name category modes")
//     .populate("servicePartnerId", "name email phone")
//     .populate("treatmentId", "status validTill")
//     .select('+isInvoiceGenerated')
//     .sort({ appointmentDate: -1 });

//   const totalBookings = bookings.length;
//   const completedBookings = bookings.filter((b) =>
//     ["Completed", "TreatmentCompleted"].includes(b.status)
//   ).length;
//   const progressPercentage =
//     totalBookings > 0
//       ? Math.round((completedBookings / totalBookings) * 100)
//       : 0;

//   const stats = {
//     totalSessions: totalBookings,
//     completedSessions: completedBookings,
//     pendingSessions: bookings.filter((b) => b.status === "Pending").length,
//     inProgressSessions: bookings.filter((b) => b.status === "In-Progress").length,
//     progressPercentage,
//   };

//   const baseUrl = `${req.protocol}://${req.get('host')} `;

//   // ✅ PERFECT BUTTON LOGIC
//   const bookingsWithInvoiceStatus = bookings.map(booking => {
//     const isInvoiceGenerated = Boolean(booking.isInvoiceGenerated || false);
//     const isTreatmentCompleted = booking.status === "Completed" || booking.status === "TreatmentCompleted";
    
//     return {
//       ...booking.toObject(),
//       isInvoiceGenerated, // ✅ true/false
//       invoiceStatus: isInvoiceGenerated ? 'generated' : 'pending',
//       // ✅ DOWNLOAD: Direct link (works)
//       // ✅ GENERATE: Frontend POST call needed
//       invoiceAction: isInvoiceGenerated
//         ? `${baseUrl}/api/v1/invoice/${booking._id}/download`
//         : null,
//       generateAction: !isInvoiceGenerated ? booking._id : null, // For frontend POST
//       showInvoiceButton: isTreatmentCompleted,
//       buttonText: isInvoiceGenerated ? '📥 Download Invoice' : '➕ Generate Invoice',
//       buttonType: isInvoiceGenerated ? 'download' : 'generate',
//       buttonVariant: isInvoiceGenerated ? 'success' : 'warning',
//       isTreatmentCompleted
//     };
//   });

//   const response = {
//     success: true,
//     count: bookings.length,
//     stats,
//     data: bookingsWithInvoiceStatus,
//   };

//   if (details === "full") {
//     const invoices = await Invoice.find({
//       bookingId: { $in: bookings.map((b) => b._id) },
//     })
//       .populate("patientId", "name email phone")
//       .populate("doctorId", "name email phone");

//     response.invoices = invoices.map(inv => ({
//       ...inv.toObject(),
//       downloadUrl: `${baseUrl}/api/v1/invoice/${inv._id}/download`
//     }));
    
//     response.invoiceSummary = {
//       totalInvoices: invoices.length,
//       hasInvoices: invoices.length > 0,
//     };
//   }

//   res.status(200).json(response);
// });
exports.getPatientInvoicesByServiceProvider = catchAsync(async (req, res, next) => {
  const patientId = req.params.patientId;
  const { 
    details = "basic", 
    dateFilterType, 
    startDate, 
    endDate, 
    treatmentId: queryTreatmentId 
  } = req.query;

  // 1. Validate ID format ONLY
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID format",
    });
  }

  // ✅ 2. NO Patient validation - bookings work regardless

  // 3. Build Query
  let query = { patientId };

  if (queryTreatmentId && mongoose.Types.ObjectId.isValid(queryTreatmentId)) {
    query.treatmentId = queryTreatmentId;
  }

  // 4. Date Filters
  if (dateFilterType === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
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
      $lte: new Date(endDate),
    };
  }

  // 5. Execute Booking Search
  const bookings = await Booking.find(query)
    .populate("serviceId", "name category modes price")
    .populate("servicePartnerId", "name email phone firstName")
    .populate("treatmentId", "status validTill")
    .sort({ appointmentDate: -1 });

  // 6. Stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) =>
    ["Completed", "TreatmentCompleted"].includes(b.status)
  ).length;
  const progressPercentage =
    totalBookings > 0
      ? Math.round((completedBookings / totalBookings) * 100)
      : 0;

  const stats = {
    totalSessions: totalBookings,
    completedSessions: completedBookings,
    pendingSessions: bookings.filter((b) => b.status === "Pending").length,
    inProgressSessions: bookings.filter((b) => b.status === "In-Progress").length,
    progressPercentage,
  };

  // 7. Base URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // 8. Generate Response Data (robust handling for missing isInvoiceGenerated)
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
      isTreatmentCompleted,
    };
  });

  // 9. Final Response
  const response = {
    success: true,
    count: bookings.length,
    stats,
    data: bookingsWithInvoiceStatus,
  };

  // 10. Full Details with Invoices
  if (details === "full") {
    const invoices = await Invoice.find({
      bookingId: { $in: bookings.map((b) => b._id) },
    })
      .populate("patientId", "name email phone")
      .populate("doctorId", "name email phone");

    response.invoices = invoices.map(inv => ({
      ...inv.toObject(),
      downloadUrl: `${baseUrl}/api/v1/invoice/${inv._id}/download`,
    }));

    response.invoiceSummary = {
      totalInvoices: invoices.length,
      hasInvoices: invoices.length > 0,
    };
  }

  res.status(200).json(response);
});


// exports.getPatientInvoicesByServiceProvider = catchAsync(async (req, res, next) => {
//   let patientId;
  
//   // ✅ FLEXIBLE: Works with /invoice/:patientId OR /service-provider/:spId/patient/:patientId
//   if (req.params.patientId) {
//     patientId = req.params.patientId;
//   } else {
//     return res.status(400).json({
//       success: false,
//       message: "Patient ID required",
//     });
//   }

//   const { details = "basic", serviceProviderId, dateFilterType, startDate, endDate } = req.query;

//   // Validate patient ID
//   if (!mongoose.Types.ObjectId.isValid(patientId)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid patient ID format",
//     });
//   }

//   // Optional: Filter by service provider (if provided)
//   let query = { patientId };
//   if (serviceProviderId && mongoose.Types.ObjectId.isValid(serviceProviderId)) {
//     query.servicePartnerId = serviceProviderId;
//   }

//   // Date filters (same logic)
//   if (dateFilterType === "today") {
//     const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
//     const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//   } else if (dateFilterType === "week") {
//     const now = new Date();
//     const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//     firstDayOfWeek.setHours(0, 0, 0, 0);
//     const lastDayOfWeek = new Date(firstDayOfWeek); 
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//     lastDayOfWeek.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//   } // ... other date filters

//   const bookings = await Booking.find(query)
//     .populate("serviceId", "name category modes")
//     .populate("servicePartnerId", "name email phone")
//     .populate("treatmentId", "status validTill")
//     .sort({ appointmentDate: -1 });

//   const stats = {
//     totalSessions: bookings.length,
//     completedSessions: bookings.filter(b => ["Completed", "TreatmentCompleted"].includes(b.status)).length,
//     pendingSessions: bookings.filter(b => b.status === "Pending").length,
//     inProgressSessions: bookings.filter(b => b.status === "In-Progress").length,
//   };

//   const response = {
//     success: true,
//     count: bookings.length,
//     stats,
//     data: bookings,
//   };

//   // FULL details → Add invoices with CORRECT URLs
//   if (details === "full") {
//     const invoices = await Invoice.find({
//       bookingId: { $in: bookings.map(b => b._id) },
//     })
//       .populate("patientId", "name email phone")
//       .populate("doctorId", "name email phone");

//     const baseUrl = `${req.protocol}://${req.get('host')}`;
    
//     response.data = {
//       bookings,
//       invoices: invoices.map(inv => ({
//         ...inv.toObject(),
//         downloadUrl: `${baseUrl}/api/v1/invoice/${inv._id}/download`  // ✅ FIXED URL
//       })),
//       invoiceSummary: {
//         totalInvoices: invoices.length,
//         hasInvoices: invoices.length > 0,
//       }
//     };
//   }

//   res.status(200).json(response);
// });
