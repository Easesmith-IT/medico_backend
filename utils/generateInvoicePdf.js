const PDFDocument = require("pdfkit");

const generateInvoicePdf = (invoice) => {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({ margin: 40 });

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    doc.on("error", reject);

    // ===== HEADER =====
    doc.fontSize(20).text("MEDICO PLATFORM", { align: "center" });
    doc.fontSize(14).text("Tax Invoice", { align: "center" });

    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toDateString()}`);

    doc.moveDown();

    // ===== PATIENT =====
    doc.fontSize(14).text("Patient Details");
    doc.fontSize(12).text(`Name: ${invoice.patientId?.firstName || "N/A"}`);
    doc.text(`Phone: ${invoice.patientId?.phone || "N/A"}`);

    doc.moveDown();

    // ===== DOCTOR =====
    doc.fontSize(14).text("Doctor Details");
    doc.fontSize(12).text(`Doctor: ${invoice.doctorId?.firstName || "N/A"}`);
    doc.text(`Specialization: ${invoice.doctorId?.specialization || "N/A"}`);

    doc.moveDown();

    // ===== MEDICINES =====
    doc.fontSize(14).text("Medicines");

    invoice.medicines?.forEach((med) => {
      doc.text(`${med.name} | Qty: ${med.quantity} | ₹${med.total}`);
    });

    doc.moveDown();

    // ===== EQUIPMENT =====
    doc.fontSize(14).text("Additional Equipment");

    invoice.additionalEquipment?.forEach((item) => {
      doc.text(`${item.name} | Qty: ${item.quantity} | ₹${item.total}`);
    });

    doc.moveDown();

    // ===== TOTAL =====
    doc.fontSize(16).text(
      `Grand Total: ₹${invoice.totals?.grandTotal || 0}`,
      { align: "right" }
    );

    doc.end();

  });
};

module.exports = generateInvoicePdf;