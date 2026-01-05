
const ejs = require('ejs')

const Invoice = require('../models/invoiceModel');
const Booking = require('../models/bookingModel');
const Patient = require('../models/bookingModel');
const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const puppeteer = require('puppeteer');
const path = require('path');
const crypto = require("node:crypto");
const { uploadInvoiceToCloudinary } = require('../config/cloudinaryConfig');
const os = require('os');
const fs = require('fs');



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

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate("patientId")
      .populate("doctorId");

    if (!invoice) return res.status(404).send("Invoice not found");

    const templatePath = path.join(__dirname, "..", "views", "invoice-template.ejs");
    const html = await ejs.renderFile(templatePath, { invoice });

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=INV-${invoice.invoiceNumber}.pdf` });
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


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