
const ejs = require('ejs')

const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const Patient = require('../models/bookingModel');
const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const crypto = require("node:crypto");

exports.generateInvoice = async (req, res) => {
  try {
    const { bookingId, patientId, doctorId, billingDetails, medicines, additionalEquipment } = req.body;

    // Generate unique invoice number: INV-TIMESTAMP-HEX
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

    // The pre-save hook in the schema will handle all calculations for totals and GST [web:1]
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

// 2. Download Invoice PDF
// exports.downloadInvoice = async (req, res) => {
//   try {
//     const { invoiceNumber } = req.params;
//     const invoice = await Invoice.findOne({ invoiceNumber }).populate("patientId doctorId");

//     if (!invoice) return res.status(404).json({ message: "Invoice not found" });

//     // Render HTML using EJS [web:21][web:40]
//     const templatePath = path.join(__dirname, "../views/invoice-template.ejs");
//     const htmlContent = await ejs.renderFile(templatePath, { invoice });

//     // Launch Puppeteer [web:23][web:47]
//     const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" }
//     });

//     await browser.close();

//     // Set headers for file download [web:44][web:49]
//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=Invoice-${invoiceNumber}.pdf`,
//       "Content-Length": pdfBuffer.length,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     res.status(500).json({ message: "Error generating PDF", error: error.message });
//   }
// };


exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate("patientId doctorId");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // 1. Render HTML
    // const templatePath = path.join(__dirname, "../views/invoice-template.ejs");

    const templatePath = path.join(process.cwd(), "views", "invoice-template.ejs");
console.log("Looking for template at:", templatePath);

    const htmlContent = await ejs.renderFile(templatePath, { invoice });

    // 2. Generate PDF in system temp
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    
    // Use the system temp directory for universal access
    const tempPath = path.join("/tmp", `inv-${invoice.invoiceNumber}.pdf`);
    await page.pdf({ path: tempPath, format: "A4" });
    await browser.close();

    // 3. Upload to Cloudinary for GLOBAL access [web:27][web:30]
    const uploadResult = await cloudinary.uploader.upload(tempPath, {
      resource_type: "raw", // Needed for PDF files
      public_id: `invoices/${invoice.invoiceNumber}`,
      access_mode: "public"
    });

    // 4. Delete local temp file
    fs.unlinkSync(tempPath);

    // 5. Return the GLOBAL URL to the user
    res.status(200).json({
      success: true,
      message: "Invoice generated and uploaded globally",
      pdfUrl: uploadResult.secure_url // This link works everywhere! [web:33]
    });

  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};
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