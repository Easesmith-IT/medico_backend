





// const PDFDocument = require('pdfkit');

// const generateInvoicePdf = (invoice) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 50 });
//     let buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => resolve(Buffer.concat(buffers)));
//     doc.on('error', reject);

//     let y = 50;

//     // === HEADER ===
//     doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c3e50').text('MEDICO PLATFORM', 50, y);
//     doc.fontSize(20).font('Helvetica').fillColor('#7f8c8d').text('Tax Invoice', 350, y, { width: 200, align: 'right' });
    
//     y += 35;
//     doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
//       .text(`Invoice #: ${invoice.invoiceNumber}`, 50, y)
//       .text(`Date: ${new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}`, 350, y, { width: 200, align: 'right' });
    
//     y += 30;
//     doc.strokeColor('#2c3e50').lineWidth(2).moveTo(50, y).lineTo(550, y).stroke();

//     // === INFO GRID ===
//     y += 30;
//     const boxHeight = 110;
//     // Patient box
//     doc.fillColor('#f9f9f9').rect(50, y, 240, boxHeight).fill();
//     doc.strokeColor('#3498db').lineWidth(3).moveTo(50, y).lineTo(50, y + boxHeight).stroke();
//     doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text('Billed To (Patient)', 65, y + 15);
//     doc.fontSize(10).font('Helvetica').fillColor('#333')
//       .text(`Name: ${invoice.patientId?.firstName || 'N/A'}`, 65, y + 35)
//       .text(`Phone: ${invoice.patientId?.phone || 'N/A'}`, 65, y + 50)
//       .text(`ID: ${invoice.patientId?._id || 'N/A'}`, 65, y + 65, { width: 210 });

//     // Doctor box
//     doc.fillColor('#f9f9f9').rect(310, y, 240, boxHeight).fill();
//     doc.strokeColor('#2ecc71').lineWidth(3).moveTo(310, y).lineTo(310, y + boxHeight).stroke();
//     doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text('Service Provider (Doctor)', 325, y + 15);
//     doc.fontSize(10).font('Helvetica').fillColor('#333')
//       .text(`Dr. ${invoice.doctorId?.firstName || 'N/A'}`, 325, y + 35)
//       .text(`Reg: ${invoice.doctorId?.medicalRegistrationNumber || 'N/A'}`, 325, y + 50)
//       .text(`Clinic: ${invoice.doctorId?.address?.city || 'N/A'}`, 325, y + 65);

//     // === ITEMS TABLE ===
//     y += boxHeight + 40;

//     // Define column positions and widths for perfect alignment
//     const col1 = 60;  // Description
//     const col2 = 330; // Qty
//     const col3 = 380; // Rate
//     const col4 = 450; // GST
//     const col5 = 500; // Amount

//     // Headers
//     doc.fillColor('#2c3e50').rect(50, y, 500, 30).fill();
//     doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
//     doc.text('Description', col1, y + 10);
//     doc.text('Qty', col2, y + 10, { width: 40, align: 'center' });
//     doc.text('Rate', col3, y + 10, { width: 60, align: 'right' });
//     doc.text('GST %', col4, y + 10, { width: 40, align: 'center' });
//     doc.text('Amount', col5, y + 10, { width: 45, align: 'right' });
    
//     y += 35;

//     const drawRow = (name, qty, rate, gst, total) => {
//       doc.fontSize(10).font('Helvetica').fillColor('#333');
//       doc.text(name, col1, y, { width: 260 });
//       doc.text(qty.toString(), col2, y, { width: 40, align: 'center' });
//       doc.text(`₹${rate}`, col3, y, { width: 60, align: 'right' });
//       doc.text(`${gst}%`, col4, y, { width: 40, align: 'center' });
//       doc.text(`₹${total.toFixed(2)}`, col5, y, { width: 45, align: 'right' });
      
//       doc.strokeColor('#eee').lineWidth(1).moveTo(50, y + 15).lineTo(550, y + 15).stroke();
//       y += 25;
//     };

//     // Medicines
//     if (invoice.medicines?.length) {
//         doc.fillColor('#f2f2f2').rect(50, y, 500, 20).fill();
//         doc.fillColor('#666').fontSize(9).font('Helvetica-Bold').text('MEDICINES & PHARMACY', col1, y + 6);
//         y += 25;
//         invoice.medicines.forEach(item => drawRow(item.name, item.quantity, item.pricePerUnit, item.gstPercentage, item.total));
//     }

//     // Equipment
//     if (invoice.additionalEquipment?.length) {
//         doc.fillColor('#f2f2f2').rect(50, y, 500, 20).fill();
//         doc.fillColor('#666').fontSize(9).font('Helvetica-Bold').text('ADDITIONAL EQUIPMENT & RENTALS', col1, y + 6);
//         y += 25;
//         invoice.additionalEquipment.forEach(item => drawRow(item.name, item.quantity, item.rate, item.gstPercentage, item.total));
//     }

//     // === SUMMARY ===
//     y += 20;
//     const summaryLabelX = 350;
//     const summaryValueX = 480;

//     doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
//       .text('Note: Computer generated invoice.', 50, y, { width: 250 });

//     const totals = [
//         { label: 'Subtotal:', value: invoice.totals?.subtotal },
//         { label: 'CGST (50%):', value: invoice.totals?.cgst },
//         { label: 'SGST (50%):', value: invoice.totals?.sgst }
//     ];

//     totals.forEach(item => {
//         doc.fillColor('#333').text(item.label, summaryLabelX, y, { width: 100, align: 'right' });
//         doc.text(`₹${item.value?.toFixed(2) || '0.00'}`, summaryValueX, y, { width: 65, align: 'right' });
//         y += 18;
//     });

//     // Grand Total
//     y += 10;
//     doc.fillColor('#2c3e50').rect(summaryLabelX, y, 200, 35).fill();
//     doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
//     doc.text('GRAND TOTAL:', summaryLabelX + 10, y + 12);
//     doc.text(`₹${invoice.totals?.grandTotal?.toFixed(2) || '0.00'}`, summaryValueX, y + 12, { width: 65, align: 'right' });

//     doc.end();
//   });
// };


// module.exports =  generateInvoicePdf ;



// Enhanced utility functions
// function cleanNumber(value) {
//   if (value == null || value === '') return 0;
//   return Number(String(value).replace(/[^\d.]/g, ''));
// }

// function formatDate(date) {
//   return new Date(date).toLocaleDateString('en-IN', { 
//     day: '2-digit', 
//     month: 'short', 
//     year: 'numeric' 
//   });
// }
// Enhanced utility functions - ADD THESE AT THE BOTTOM

// const PDFDocument = require('pdfkit');

// const generateInvoicePdf = (invoice) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 15 * 2.83465 });
//     let buffers = [];

//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => resolve(Buffer.concat(buffers)));
//     doc.on('error', reject);

//     const L = 42;
//     const R = 553;
//     const W = R - L;

//     let y = 40;

//     // HEADER
//     doc.font('Helvetica-Bold').fontSize(22).fillColor('#2c3e50')
//       .text('MEDICO PLATFORM', L, y);

//     doc.font('Helvetica').fontSize(17).fillColor('#7f8c8d')
//       .text('TAX INVOICE', L, y + 4, { width: W, align: 'right' });

//     y += 34;

//     doc.font('Helvetica').fontSize(10).fillColor('#7f8c8d')
//       .text(`Invoice #: ${formatInvoiceNumber(invoice.invoiceNumber)}`, L, y)
//       .text(`Date: ${formatDate(invoice.issuedAt || invoice.createdAt)}`, L, y, { width: W, align: 'right' });

//     y += 14;

//     doc.lineWidth(2.5).strokeColor('#2c3e50').moveTo(L, y).lineTo(R, y).stroke();

//     y += 18;

//     // INFO GRID
//     const colW = (W / 2) - 8;
//     const boxH = 105;

//     // Patient Box
//     doc.fillColor('#f9f9f9').rect(L, y, colW, boxH).fill();
//     doc.fillColor('#3498db').rect(L, y, 4, boxH).fill();

//     doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
//       .text('BILLED TO (PATIENT)', L + 10, y + 10);

//     const patientName = invoice.patientId?.firstName || 'N/A';
//     const patientPhone = invoice.patientId?.phone || 'N/A';
//     const patientAddr = invoice.patientId?.address
//       ? `${invoice.patientId.address.street || ''}, ${invoice.patientId.address.city || ''}, ${invoice.patientId.address.pincode || ''}`.replace(/^,\s*/, '')
//       : 'Address Not Provided';
//     const patientId = invoice.patientId?._id
//       ? String(invoice.patientId._id).slice(-8)
//       : 'N/A';

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Name: ', L + 10, y + 26, { continued: true })
//       .font('Helvetica').text(patientName);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Phone: ', L + 10, y + 40, { continued: true })
//       .font('Helvetica').text(patientPhone);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Address: ', L + 10, y + 54, { continued: true })
//       .font('Helvetica').text(patientAddr, { width: colW - 20 });

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('ID: ', L + 10, y + 80, { continued: true })
//       .font('Helvetica').text(patientId);

//     // Doctor Box
//     const dColX = L + colW + 16;
//     doc.fillColor('#f9f9f9').rect(dColX, y, colW, boxH).fill();
//     doc.fillColor('#2ecc71').rect(dColX, y, 4, boxH).fill();

//     doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
//       .text('SERVICE PROVIDER (DOCTOR)', dColX + 10, y + 10);

//     const doctorName = `Dr. ${invoice.doctorId?.firstName || 'N/A'}`;
//     const specialization = invoice.doctorId?.specialization || 'General';
//     const regNo = invoice.doctorId?.medicalRegistrationNumber || 'N/A';
//     const doctorPhone = invoice.doctorId?.phone || 'N/A';
//     const clinicLoc = invoice.doctorId?.address
//       ? `${invoice.doctorId.address.city || ''}, ${invoice.doctorId.address.state || ''}`.replace(/^,\s*/, '')
//       : 'N/A';

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text(doctorName, dColX + 10, y + 26);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Specialization: ', dColX + 10, y + 40, { continued: true })
//       .font('Helvetica').text(specialization);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Reg No: ', dColX + 10, y + 54, { continued: true })
//       .font('Helvetica').text(regNo);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Phone: ', dColX + 10, y + 68, { continued: true })
//       .font('Helvetica').text(doctorPhone);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Clinic: ', dColX + 10, y + 82, { continued: true })
//       .font('Helvetica').text(clinicLoc);

//     y += boxH + 20;

//     // ITEMS TABLE
//     const cols = {
//       desc:  L,
//       qty:   L + 270,
//       rate:  L + 330,
//       gst:   L + 390,
//       total: L + 445
//     };

//     doc.fillColor('#2c3e50').rect(L, y, W, 26).fill();
//     doc.font('Helvetica-Bold').fontSize(9).fillColor('white')
//       .text('DESCRIPTION', cols.desc  + 4, y + 8, { width: 265 })
//       .text('QTY',         cols.qty,        y + 8, { width: 55,  align: 'center' })
//       .text('RATE',        cols.rate,        y + 8, { width: 55,  align: 'right' })
//       .text('GST %',       cols.gst,         y + 8, { width: 50,  align: 'center' })
//       .text('AMOUNT',      cols.total,       y + 8, { width: 65,  align: 'right' });

//     y += 30;

//     if (invoice.medicines?.length) {
//       y = drawCategoryRow(doc, 'MEDICINES & PHARMACY', y, L, W);
//       y = drawItemRows(doc, invoice.medicines, y, cols, 'medicine');
//     }

//     if (invoice.additionalEquipment?.length) {
//       y = drawCategoryRow(doc, 'ADDITIONAL EQUIPMENT & RENTALS', y, L, W);
//       y = drawItemRows(doc, invoice.additionalEquipment, y, cols, 'equipment');
//     }

//     y += 20;

//     // SUMMARY SECTION
//     const noteW = W * 0.55;
//     const sumX  = L + noteW + 10;
//     const sumW  = W - noteW - 10;

//     // Note - left side
//     doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
//       .text('Note: ', L, y, { continued: true })
//       .font('Helvetica').fillColor('#7f8c8d')
//       .text(
//         'This is a computer-generated invoice and does not require a physical signature. ' +
//         'Healthcare services may be subject to different GST exemptions based on local laws.',
//         { width: noteW - 10 }
//       );

//     // Summary rows - pushed 50px below note to prevent overlap
//     const summaryRows = [
//       ['Subtotal:',  invoice.totals?.subtotal || 0],
//       ['CGST (9%):', invoice.totals?.cgst     || 0],
//       ['SGST (9%):', invoice.totals?.sgst     || 0],
//     ];

//     let sy = y + 50;
//     summaryRows.forEach(([label, val]) => {
//       doc.font('Helvetica').fontSize(10).fillColor('#333')
//         .text(label, sumX, sy, { width: sumW * 0.55, align: 'left' })
//         .text(`Rs. ${formatCurrency(val)}`, sumX + sumW * 0.55, sy, { width: sumW * 0.45, align: 'right' });
//       sy += 22;
//     });

//     // Grand Total
//     sy += 12;
//     doc.fillColor('#2c3e50').rect(sumX, sy, sumW, 36).fill();
//     doc.font('Helvetica-Bold').fontSize(12).fillColor('white')
//       .text('GRAND TOTAL:', sumX + 8, sy + 11, { width: sumW * 0.55 })
//       .text(`Rs. ${formatCurrency(invoice.totals?.grandTotal || 0)}`, sumX + sumW * 0.55, sy + 11, { width: sumW * 0.45 - 8, align: 'right' });

//     doc.end();
//   });
// };

// // Category row helper
// function drawCategoryRow(doc, title, y, L, W) {
//   doc.fillColor('#f2f2f2').rect(L, y, W, 20).fill();
//   doc.font('Helvetica-Bold').fontSize(9).fillColor('#666')
//     .text(title, L + 6, y + 5);
//   return y + 24;
// }

// // Item rows helper
// // function drawItemRows(doc, items, y, cols, type) {
// //   items.forEach(item => {
// //     const rate = type === 'medicine' ? item.pricePerUnit : item.rate;

// //     doc.font('Helvetica').fontSize(9).fillColor('#333')
// //       .text(item.name || 'Item', cols.desc + 4, y, { width: 262 });

// //     doc.text(String(item.quantity || 1), cols.qty,   y, { width: 55, align: 'center' });
// //     doc.text(`Rs. ${formatCurrency(rate)}`,  cols.rate,  y, { width: 55, align: 'right' });
// //     doc.text(`${item.gstPercentage || 0}%`,  cols.gst,   y, { width: 50, align: 'center' });
// //     doc.text(`Rs. ${formatCurrency(item.total)}`, cols.total, y, { width: 65, align: 'right' });

// //     doc.lineWidth(0.5).strokeColor('#eeeeee')
// //       .moveTo(cols.desc, y + 16)
// //       .lineTo(cols.desc + 511, y + 16)
// //       .stroke();

// //     y += 20;
// //   });
// //   return y;
// // }
// function drawItemRows(doc, items, y, cols, type) {
//   items.forEach(item => {
//     const rate    = type === 'medicine' ? item.pricePerUnit : item.rate;
//     const hasDate = type === 'medicine' && item.addedDate;
//     const rowH    = hasDate ? 30 : 20;

//     // Item name
//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text(item.name || 'Item', cols.desc + 4, y, { width: 262 });

//     // ✅ addedDate shown below name — works with Date object or ISO string
//     if (hasDate) {
//       let dateStr = '';
//       try {
//         dateStr = new Date(item.addedDate).toLocaleDateString('en-IN', {
//           day: '2-digit', month: 'short', year: 'numeric'
//         });
//       } catch {
//         dateStr = String(item.addedDate).slice(0, 10);
//       }
//       doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
//         .text(`Prescribed: ${dateStr}`, cols.desc + 4, y + 11, { width: 262 });
//     }

//     // Numeric columns
//     doc.font('Helvetica').fontSize(9).fillColor('#333');
//     doc.text(String(item.quantity || 1),          cols.qty,   y, { width: 55, align: 'center' });
//     doc.text(`Rs. ${formatCurrency(rate)}`,        cols.rate,  y, { width: 55, align: 'right'  });
//     doc.text(`${item.gstPercentage || 0}%`,        cols.gst,   y, { width: 50, align: 'center' });
//     doc.text(`Rs. ${formatCurrency(item.total)}`,  cols.total, y, { width: 65, align: 'right'  });

//     // Row divider
//     doc.lineWidth(0.5).strokeColor('#eeeeee')
//       .moveTo(cols.desc, y + rowH)
//       .lineTo(cols.desc + 511, y + rowH)
//       .stroke();

//     y += rowH + 4;
//   });
//   return y;
// }
// // Formatters
// function formatInvoiceNumber(num) {
//   return cleanNumber(num).toString().slice(-8).padStart(8, '0');
// }

// function formatDate(dateStr) {
//   try {
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit', month: 'short', year: 'numeric'
//     });
//   } catch {
//     return '09 Mar 2026';
//   }
// }

// function formatCurrency(value) {
//   return cleanNumber(value).toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   });
// }

// function cleanNumber(value) {
//   if (!value) return 0;
//   return Number(String(value).replace(/[^\d.]/g, '').replace(/\.(?=.*\.)/g, '')) || 0;
// }

// module.exports = generateInvoicePdf;
const PDFDocument = require('pdfkit');

const generateInvoicePdf = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 15 * 2.83465 });
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const L = 42;
    const R = 553;
    const W = R - L;

    let y = 40;

    // HEADER
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#2c3e50')
      .text('MEDICO PLATFORM', L, y);
    doc.font('Helvetica').fontSize(17).fillColor('#7f8c8d')
      .text('TAX INVOICE', L, y + 4, { width: W, align: 'right' });

    y += 34;

    doc.font('Helvetica').fontSize(10).fillColor('#7f8c8d')
      .text(`Invoice #: ${formatInvoiceNumber(invoice.invoiceNumber)}`, L, y)
      .text(`Date: ${formatDate(invoice.issuedAt || invoice.createdAt)}`, L, y, { width: W, align: 'right' });

    y += 14;
    doc.lineWidth(2.5).strokeColor('#2c3e50').moveTo(L, y).lineTo(R, y).stroke();
    y += 18;

    // INFO GRID
    const colW = (W / 2) - 8;
    const boxH = 105;

    // Patient Box
    doc.fillColor('#f9f9f9').rect(L, y, colW, boxH).fill();
    doc.fillColor('#3498db').rect(L, y, 4, boxH).fill();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
      .text('BILLED TO (PATIENT)', L + 10, y + 10);

    const patientName  = invoice.patientId?.firstName || 'N/A';
    const patientPhone = invoice.patientId?.phone || 'N/A';
    const patientAddr  = invoice.patientId?.address
      ? `${invoice.patientId.address.street || ''}, ${invoice.patientId.address.city || ''}, ${invoice.patientId.address.pincode || ''}`.replace(/^,\s*/, '')
      : 'Address Not Provided';
    const patientId = invoice.patientId?._id ? String(invoice.patientId._id).slice(-8) : 'N/A';

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Name: ',    L + 10, y + 26, { continued: true }).font('Helvetica').text(patientName);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Phone: ',   L + 10, y + 40, { continued: true }).font('Helvetica').text(patientPhone);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Address: ', L + 10, y + 54, { continued: true }).font('Helvetica').text(patientAddr, { width: colW - 20 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('ID: ',      L + 10, y + 80, { continued: true }).font('Helvetica').text(patientId);

    // Doctor Box
    const dColX = L + colW + 16;
    doc.fillColor('#f9f9f9').rect(dColX, y, colW, boxH).fill();
    doc.fillColor('#2ecc71').rect(dColX, y, 4, boxH).fill();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
      .text('SERVICE PROVIDER (DOCTOR)', dColX + 10, y + 10);

    const doctorName      = `Dr. ${invoice.doctorId?.firstName || 'N/A'}`;
    const specialization  = invoice.doctorId?.specialization || 'General';
    const regNo           = invoice.doctorId?.medicalRegistrationNumber || 'N/A';
    const doctorPhone     = invoice.doctorId?.phone || 'N/A';
    const clinicLoc       = invoice.doctorId?.address
      ? `${invoice.doctorId.address.city || ''}, ${invoice.doctorId.address.state || ''}`.replace(/^,\s*/, '')
      : 'N/A';

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text(doctorName, dColX + 10, y + 26);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Specialization: ', dColX + 10, y + 40, { continued: true }).font('Helvetica').text(specialization);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Reg No: ',         dColX + 10, y + 54, { continued: true }).font('Helvetica').text(regNo);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Phone: ',          dColX + 10, y + 68, { continued: true }).font('Helvetica').text(doctorPhone);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text('Clinic: ',         dColX + 10, y + 82, { continued: true }).font('Helvetica').text(clinicLoc);

    y += boxH + 20;

    // ITEMS TABLE
    const cols = {
      desc:  L,
      qty:   L + 270,
      rate:  L + 330,
      gst:   L + 390,
      total: L + 445
    };
    doc.fillColor('#2c3e50').rect(L, y, W, 26).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('white')
      .text('DESCRIPTION', cols.desc + 4, y + 8, { width: 265 })
      .text('QTY',         cols.qty,       y + 8, { width: 55, align: 'center' })
      .text('RATE',        cols.rate,       y + 8, { width: 55, align: 'right'  })
      .text('GST %',       cols.gst,        y + 8, { width: 50, align: 'center' })
      .text('AMOUNT',      cols.total,      y + 8, { width: 65, align: 'right'  });

    y += 30;

    const hasMedicines = Array.isArray(invoice.medicines) && invoice.medicines.length > 0;
    const hasEquipment = Array.isArray(invoice.additionalEquipment) && invoice.additionalEquipment.length > 0;

    if (hasMedicines) {
      y = drawCategoryRow(doc, 'MEDICINES & PHARMACY', y, L, W);
      y = drawItemRows(doc, invoice.medicines, y, cols, 'medicine');
    }

    if (hasEquipment) {
      y = drawCategoryRow(doc, 'ADDITIONAL EQUIPMENT & RENTALS', y, L, W);
      y = drawItemRows(doc, invoice.additionalEquipment, y, cols, 'equipment');
    }

    if (!hasMedicines && !hasEquipment) {
      const serviceName = invoice.billingDetails?.serviceName || 'Healthcare Consultation & Service';
      const baseRate = Number(invoice.totals?.subtotal || invoice.billingDetails?.calculatedBase || invoice.billingDetails?.basePrice || 0);
      const taxPercent = Number(invoice.billingDetails?.taxPercentage || 18);
      const totalAmount = Number(invoice.totals?.grandTotal || (baseRate + (baseRate * taxPercent / 100)));

      y = drawCategoryRow(doc, 'CONSULTATION & HEALTHCARE SERVICES', y, L, W);
      const serviceItem = [{
        name: serviceName,
        quantity: 1,
        rate: baseRate,
        gstPercentage: taxPercent,
        total: totalAmount
      }];
      y = drawItemRows(doc, serviceItem, y, cols, 'equipment');
    }

    y += 20;

    // SUMMARY SECTION
    const noteW = W * 0.55;
    const sumX  = L + noteW + 10;
    const sumW  = W - noteW - 10;

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
      .text('Note: ', L, y, { continued: true })
      .font('Helvetica').fillColor('#7f8c8d')
      .text(
        'This is a computer-generated invoice and does not require a physical signature. ' +
        'Healthcare services may be subject to different GST exemptions based on local laws.',
        { width: noteW - 10 }
      );

    const summaryRows = [
      ['Subtotal:',  invoice.totals?.subtotal || 0],
      ['CGST (9%):', invoice.totals?.cgst     || 0],
      ['SGST (9%):', invoice.totals?.sgst     || 0],
    ];

    let sy = y + 50;
    summaryRows.forEach(([label, val]) => {
      doc.font('Helvetica').fontSize(10).fillColor('#333')
        .text(label, sumX, sy, { width: sumW * 0.55, align: 'left' })
        .text(`Rs. ${formatCurrency(val)}`, sumX + sumW * 0.55, sy, { width: sumW * 0.45, align: 'right' });
      sy += 22;
    });

    sy += 12;
    doc.fillColor('#2c3e50').rect(sumX, sy, sumW, 36).fill();
    doc.font('Helvetica-Bold').fontSize(12).fillColor('white')
      .text('GRAND TOTAL:', sumX + 8, sy + 11, { width: sumW * 0.55 })
      .text(`Rs. ${formatCurrency(invoice.totals?.grandTotal || 0)}`, sumX + sumW * 0.55, sy + 11, { width: sumW * 0.45 - 8, align: 'right' });

    doc.end();
  });
};

// Category row helper
function drawCategoryRow(doc, title, y, L, W) {
  doc.fillColor('#f2f2f2').rect(L, y, W, 20).fill();
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#666').text(title, L + 6, y + 5);
  return y + 24;
}

// ✅ Item rows — shows "Prescribed: DD Mon YYYY" under each medicine name
// ✅ Item rows — date shown inline on same line as medicine name
function drawItemRows(doc, items, y, cols, type) {
  items.forEach(item => {
    const rate    = type === 'medicine' ? item.pricePerUnit : item.rate;
    const hasDate = type === 'medicine' && item.addedDate;
    const rowH    = hasDate ? 30 : 20;

    // Medicine name
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
      .text(item.name || 'Item', cols.desc + 4, y, { width: 180 });

    // Date on same line — "Prescribed:" label + bold date value
    if (hasDate) {
      let dateStr = '';
      try {
        dateStr = new Date(item.addedDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      } catch {
        dateStr = String(item.addedDate).slice(0, 10);
      }

      // "Prescribed:" in grey
      doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
        .text('Prescribed:', cols.desc + 190, y + 1, { continued: true })
      // date value in bold dark
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#374151')
        .text(` ${dateStr}`, { width: 80 });
    }

    // Numeric columns
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    doc.text(String(item.quantity || 1),         cols.qty,   y, { width: 55, align: 'center' });
    doc.text(`Rs. ${formatCurrency(rate)}`,       cols.rate,  y, { width: 55, align: 'right'  });
    doc.text(`${item.gstPercentage || 0}%`,       cols.gst,   y, { width: 50, align: 'center' });
    doc.text(`Rs. ${formatCurrency(item.total)}`, cols.total, y, { width: 65, align: 'right'  });

    doc.lineWidth(0.5).strokeColor('#eeeeee')
      .moveTo(cols.desc, y + rowH)
      .lineTo(cols.desc + 511, y + rowH)
      .stroke();

    y += rowH + 4;
  });
  return y;
}



function formatInvoiceNumber(num) {
  return cleanNumber(num).toString().slice(-8).padStart(8, '0');
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return '09 Mar 2026';
  }
}

function formatCurrency(value) {
  return cleanNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cleanNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d.]/g, '').replace(/\.(?=.*\.)/g, '')) || 0;
}

module.exports = generateInvoicePdf;
module.exports.generateInvoicePdf = generateInvoicePdf;
// const PDFDocument = require('pdfkit');

// const generateInvoicePdf = (invoice) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 15 * 2.83465 }); // 15mm margins like @page
//     let buffers = [];

//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => resolve(Buffer.concat(buffers)));
//     doc.on('error', reject);

//     const L = 42;       // left margin (~15mm)
//     const R = 553;      // right edge
//     const W = R - L;    // usable width ~511

//     let y = 40;

//     // =============================================
//     // HEADER - matches .header-table style
//     // brand-name: font-size:28px bold color:#2c3e50
//     // invoice-label: right, font-size:22px color:#7f8c8d uppercase
//     // border-bottom: 3px solid #2c3e50
//     // =============================================
//     doc.font('Helvetica-Bold').fontSize(22).fillColor('#2c3e50')
//       .text('MEDICO PLATFORM', L, y);

//     doc.font('Helvetica').fontSize(17).fillColor('#7f8c8d')
//       .text('TAX INVOICE', L, y + 4, { width: W, align: 'right' });

//     y += 34;

//     // Invoice # and Date row (font-size:12px color:#7f8c8d)
//     doc.font('Helvetica').fontSize(10).fillColor('#7f8c8d')
//       .text(`Invoice #: ${formatInvoiceNumber(invoice.invoiceNumber)}`, L, y)
//       .text(`Date: ${formatDate(invoice.issuedAt || invoice.createdAt)}`, L, y, { width: W, align: 'right' });

//     y += 14;

//     // Header bottom border: 3px solid #2c3e50
//     doc.lineWidth(2.5).strokeColor('#2c3e50').moveTo(L, y).lineTo(R, y).stroke();

//     y += 18; // margin-bottom ~30px scaled

//     // =============================================
//     // INFO GRID - matches .info-grid / .info-box
//     // Two columns, each ~half width
//     // Patient box: border-left: 4px solid #3498db, bg:#f9f9f9
//     // Doctor box:  border-left: 4px solid #2ecc71, bg:#f9f9f9
//     // =============================================
//     const colW = (W / 2) - 8;
//     const boxH = 105;

//     // --- Patient Box ---
//     doc.fillColor('#f9f9f9').rect(L, y, colW, boxH).fill();
//     doc.fillColor('#3498db').rect(L, y, 4, boxH).fill(); // left border

//     doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
//       .text('BILLED TO (PATIENT)', L + 10, y + 10);

//     const patientName = invoice.patientId?.firstName || 'N/A';
//     const patientPhone = invoice.patientId?.phone || 'N/A';
//     const patientAddr = invoice.patientId?.address
//       ? `${invoice.patientId.address.street || ''}, ${invoice.patientId.address.city || ''}, ${invoice.patientId.address.pincode || ''}`.replace(/^,\s*/, '')
//       : 'Address Not Provided';
//     const patientId = invoice.patientId?._id
//       ? String(invoice.patientId._id).slice(-8)
//       : 'N/A';

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Name: ', L + 10, y + 26, { continued: true })
//       .font('Helvetica').text(patientName);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Phone: ', L + 10, y + 40, { continued: true })
//       .font('Helvetica').text(patientPhone);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Address: ', L + 10, y + 54, { continued: true })
//       .font('Helvetica').text(patientAddr, { width: colW - 20 });

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('ID: ', L + 10, y + 80, { continued: true })
//       .font('Helvetica').text(patientId);

//     // --- Doctor Box ---
//     const dColX = L + colW + 16;
//     doc.fillColor('#f9f9f9').rect(dColX, y, colW, boxH).fill();
//     doc.fillColor('#2ecc71').rect(dColX, y, 4, boxH).fill(); // left border

//     doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
//       .text('SERVICE PROVIDER (DOCTOR)', dColX + 10, y + 10);

//     const doctorName = `Dr. ${invoice.doctorId?.firstName || 'N/A'}`;
//     const specialization = invoice.doctorId?.specialization || 'General';
//     const regNo = invoice.doctorId?.medicalRegistrationNumber || 'N/A';
//     const doctorPhone = invoice.doctorId?.phone || 'N/A';
//     const clinicLoc = invoice.doctorId?.address
//       ? `${invoice.doctorId.address.city || ''}, ${invoice.doctorId.address.state || ''}`.replace(/^,\s*/, '')
//       : 'N/A';

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text(doctorName, dColX + 10, y + 26);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Specialization: ', dColX + 10, y + 40, { continued: true })
//       .font('Helvetica').text(specialization);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Reg No: ', dColX + 10, y + 54, { continued: true })
//       .font('Helvetica').text(regNo);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Phone: ', dColX + 10, y + 68, { continued: true })
//       .font('Helvetica').text(doctorPhone);

//     doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
//       .text('Clinic: ', dColX + 10, y + 82, { continued: true })
//       .font('Helvetica').text(clinicLoc);

//     y += boxH + 20;

//     // =============================================
//     // ITEMS TABLE
//     // th: bg:#2c3e50, color:white, fontSize:10, uppercase, padding:12px
//     // td: border-bottom:1px solid #eee, fontSize:10, padding:12
//     // .row-category: bg:#f2f2f2, bold, fontSize:9, color:#666
//     // =============================================
//     const cols = {
//       desc:   L,
//       qty:    L + 270,
//       rate:   L + 330,
//       gst:    L + 390,
//       total:  L + 445
//     };

//     // Table header
//     doc.fillColor('#2c3e50').rect(L, y, W, 26).fill();
//     doc.font('Helvetica-Bold').fontSize(9).fillColor('white')
//       .text('DESCRIPTION',  cols.desc  + 4, y + 8, { width: 265 })
//       .text('QTY',          cols.qty,        y + 8, { width: 55,  align: 'center' })
//       .text('RATE',         cols.rate,        y + 8, { width: 55,  align: 'right' })
//       .text('GST %',        cols.gst,         y + 8, { width: 50,  align: 'center' })
//       .text('AMOUNT',       cols.total,       y + 8, { width: 65,  align: 'right' });

//     y += 30;

//     // Medicines section
//     if (invoice.medicines?.length) {
//       y = drawCategoryRow(doc, 'MEDICINES & PHARMACY', y, L, W);
//       y = drawItemRows(doc, invoice.medicines, y, cols, 'medicine');
//     }

//     // Equipment section
//     if (invoice.additionalEquipment?.length) {
//       y = drawCategoryRow(doc, 'ADDITIONAL EQUIPMENT & RENTALS', y, L, W);
//       y = drawItemRows(doc, invoice.additionalEquipment, y, cols, 'equipment');
//     }

//     y += 10;

//     // =============================================
//     // SUMMARY - matches .summary-wrapper
//     // Left note: fontSize:9, color:#7f8c8d
//     // Right table: subtotal/cgst/sgst rows normal
//     // grand-total-row: bg:#2c3e50, color:white, bold, fontSize:13
//     // =============================================
//     const noteW = W * 0.55;
//     const sumX  = L + noteW + 10;
//     const sumW  = W - noteW - 10;

//     doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
//       .text('Note: ', L, y, { continued: true })
//       .font('Helvetica').fillColor('#7f8c8d')
//       .text(
//         'This is a computer-generated invoice and does not require a physical signature. ' +
//         'Healthcare services may be subject to different GST exemptions based on local laws.',
//         { width: noteW - 10 }
//       );

//     // Summary rows
//     const summaryRows = [
//       ['Subtotal:',   invoice.totals?.subtotal  || 0],
//       ['CGST (9%):',  invoice.totals?.cgst      || 0],
//       ['SGST (9%):',  invoice.totals?.sgst      || 0],
//     ];

//     let sy = y;
//     summaryRows.forEach(([label, val]) => {
//       doc.font('Helvetica').fontSize(10).fillColor('#333')
//         .text(label, sumX, sy, { width: sumW * 0.55, align: 'left' })
//         .text(`Rs. ${formatCurrency(val)}`, sumX + sumW * 0.55, sy, { width: sumW * 0.45, align: 'right' });
//       sy += 18;
//     });

//     // Grand total row: bg:#2c3e50, color:white, bold, fontSize:13
//     sy += 4;
//     doc.fillColor('#2c3e50').rect(sumX, sy, sumW, 32).fill();
//     doc.font('Helvetica-Bold').fontSize(12).fillColor('white')
//       .text('GRAND TOTAL:', sumX + 8, sy + 9, { width: sumW * 0.55 })
//       .text(`Rs. ${formatCurrency(invoice.totals?.grandTotal || 0)}`, sumX + sumW * 0.55, sy + 9, { width: sumW * 0.45 - 8, align: 'right' });

//     doc.end();
//   });
// };

// // =============================================
// // HELPER: Category row (.row-category)
// // bg:#f2f2f2, bold, fontSize:9, color:#666
// // =============================================
// function drawCategoryRow(doc, title, y, L, W) {
//   doc.fillColor('#f2f2f2').rect(L, y, W, 20).fill();
//   doc.font('Helvetica-Bold').fontSize(9).fillColor('#666')
//     .text(title, L + 6, y + 5);
//   return y + 24;
// }

// // =============================================
// // HELPER: Item rows (td style)
// // fontSize:10, color:#333, border-bottom:1px solid #eee
// // NO rupee superscript - use plain "Rs."
// // =============================================
// function drawItemRows(doc, items, y, cols, type) {
//   items.forEach(item => {
//     const rate = type === 'medicine' ? item.pricePerUnit : item.rate;

//     doc.font('Helvetica').fontSize(9).fillColor('#333')
//       .text(item.name || 'Item', cols.desc + 4, y, { width: 262 });

//     doc.text(String(item.quantity || 1), cols.qty, y, { width: 55, align: 'center' });

//     doc.text(`Rs. ${formatCurrency(rate)}`, cols.rate, y, { width: 55, align: 'right' });

//     doc.text(`${item.gstPercentage || 0}%`, cols.gst, y, { width: 50, align: 'center' });

//     doc.text(`Rs. ${formatCurrency(item.total)}`, cols.total, y, { width: 65, align: 'right' });

//     // border-bottom: 1px solid #eee
//     doc.lineWidth(0.5).strokeColor('#eeeeee')
//       .moveTo(cols.desc, y + 16)
//       .lineTo(cols.desc + 511, y + 16)
//       .stroke();

//     y += 20;
//   });
//   return y;
// }

// // =============================================
// // FORMATTERS
// // =============================================
// function formatInvoiceNumber(num) {
//   return cleanNumber(num).toString().slice(-8).padStart(8, '0');
// }

// function formatDate(dateStr) {
//   try {
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit', month: 'short', year: 'numeric'
//     });
//   } catch {
//     return '09 Mar 2026';
//   }
// }

// function formatCurrency(value) {
//   return cleanNumber(value).toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   });
// }

// function cleanNumber(value) {
//   if (!value) return 0;
//   return Number(String(value).replace(/[^\d.]/g, '').replace(/\.(?=.*\.)/g, '')) || 0;
// }

// module.exports = generateInvoicePdf;





// const PDFDocument = require('pdfkit');

// const generateInvoicePdf = (invoice) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ size: 'A4', margin: 50 });
//     let buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => resolve(Buffer.concat(buffers)));
//     doc.on('error', reject);

//     let y = 50;

//     // === HEADER ===
//     doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c3e50').text('MEDICO PLATFORM', 50, y);
//     doc.fontSize(20).font('Helvetica').fillColor('#7f8c8d').text('Tax Invoice', 350, y, { width: 200, align: 'right' });
    
//     y += 35;
//     doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
//       .text('Invoice #: ' + invoice.invoiceNumber, 50, y)
//       .text('Date: ' + new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN'), 350, y, { width: 200, align: 'right' });
    
//     y += 30;
//     doc.strokeColor('#2c3e50').lineWidth(2).moveTo(50, y).lineTo(550, y).stroke();

//     // === INFO GRID ===
//     y += 30;
//     const boxHeight = 110;
//     // Patient box
//     doc.fillColor('#f9f9f9').rect(50, y, 240, boxHeight).fill();
//     doc.strokeColor('#3498db').lineWidth(3).moveTo(50, y).lineTo(50, y + boxHeight).stroke();
//     doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text('Billed To (Patient)', 65, y + 15);
//     doc.fontSize(10).font('Helvetica').fillColor('#333')
//       .text('Name: ' + (invoice.patientId?.firstName || 'N/A'), 65, y + 35)
//       .text('Phone: ' + (invoice.patientId?.phone || 'N/A'), 65, y + 50)
//       .text('ID: ' + (invoice.patientId?._id || 'N/A'), 65, y + 65, { width: 210 });

//     // Doctor box
//     doc.fillColor('#f9f9f9').rect(310, y, 240, boxHeight).fill();
//     doc.strokeColor('#2ecc71').lineWidth(3).moveTo(310, y).lineTo(310, y + boxHeight).stroke();
//     doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text('Service Provider (Doctor)', 325, y + 15);
//     doc.fontSize(10).font('Helvetica').fillColor('#333')
//       .text('Dr. ' + (invoice.doctorId?.firstName || 'N/A'), 325, y + 35)
//       .text('Reg: ' + (invoice.doctorId?.medicalRegistrationNumber || 'N/A'), 325, y + 50)
//       .text('Clinic: ' + (invoice.doctorId?.address?.city || 'N/A'), 325, y + 65);

//     // === ITEMS TABLE ===
//     y += boxHeight + 40;

//     const col1 = 60;
//     const col2 = 330;
//     const col3 = 380;
//     const col4 = 450;
//     const col5 = 500;

//     // Headers
//     doc.fillColor('#2c3e50').rect(50, y, 500, 30).fill();
//     doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
//     doc.text('Description', col1, y + 10);
//     doc.text('Qty', col2, y + 10, { width: 40, align: 'center' });
//     doc.text('Rate', col3, y + 10, { width: 60, align: 'right' });
//     doc.text('GST %', col4, y + 10, { width: 40, align: 'center' });
//     doc.text('Amount', col5, y + 10, { width: 45, align: 'right' });
    
//     y += 35;

//     const drawRow = (name, qty, rate, gst, total) => {
//       doc.fontSize(10).font('Helvetica').fillColor('#333');
//       doc.text(name, col1, y, { width: 260 });
//       doc.text(qty.toString(), col2, y, { width: 40, align: 'center' });
//       doc.text('₹' + rate, col3, y, { width: 60, align: 'right' });
//       doc.text(gst + '%', col4, y, { width: 40, align: 'center' });
//       doc.text('₹' + total.toFixed(2), col5, y, { width: 45, align: 'right' });
      
//       doc.strokeColor('#eee').lineWidth(1).moveTo(50, y + 15).lineTo(550, y + 15).stroke();
//       y += 25;
//     };

//     // Medicines
//     if (invoice.medicines?.length) {
//         doc.fillColor('#f2f2f2').rect(50, y, 500, 20).fill();
//         doc.fillColor('#666').fontSize(9).font('Helvetica-Bold').text('MEDICINES & PHARMACY', col1, y + 6);
//         y += 25;
//         invoice.medicines.forEach(item => drawRow(item.name, item.quantity, item.pricePerUnit, item.gstPercentage, item.total));
//     }

//     // Equipment
//     if (invoice.additionalEquipment?.length) {
//         doc.fillColor('#f2f2f2').rect(50, y, 500, 20).fill();
//         doc.fillColor('#666').fontSize(9).font('Helvetica-Bold').text('ADDITIONAL EQUIPMENT & RENTALS', col1, y + 6);
//         y += 25;
//         invoice.additionalEquipment.forEach(item => drawRow(item.name, item.quantity, item.rate, item.gstPercentage, item.total));
//     }

//     // === SUMMARY ===
//     y += 20;
//     const summaryLabelX = 350;
//     const summaryValueX = 480;

//     doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d')
//       .text('Note: Computer generated invoice.', 50, y, { width: 250 });

//     const totals = [
//         { label: 'Subtotal:', value: invoice.totals?.subtotal },
//         { label: 'CGST (50%):', value: invoice.totals?.cgst },
//         { label: 'SGST (50%):', value: invoice.totals?.sgst }
//     ];

//     totals.forEach(item => {
//         doc.fillColor('#333').text(item.label, summaryLabelX, y, { width: 100, align: 'right' });
//         doc.text('₹' + (item.value?.toFixed(2) || '0.00'), summaryValueX, y, { width: 65, align: 'right' });
//         y += 18;
//     });

//     // Grand Total
//     y += 10;
//     doc.fillColor('#2c3e50').rect(summaryLabelX, y, 200, 35).fill();
//     doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
//     doc.text('GRAND TOTAL:', summaryLabelX + 10, y + 12);
//     doc.text('₹' + (invoice.totals?.grandTotal?.toFixed(2) || '0.00'), summaryValueX, y + 12, { width: 65, align: 'right' });

//     doc.end();
//   });
// };

// module.exports = generateInvoicePdf;

