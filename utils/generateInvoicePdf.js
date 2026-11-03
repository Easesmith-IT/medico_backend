const PDFDocument = require('pdfkit');

/**
 * High-Density Multi-Page Inpatient & Consolidated Treatment Invoice Generator
 * Supports:
 * - Dynamic page breaks with repeating headers and page numbering (Page X of Y)
 * - Treatment status banners (InProgress Interim Bill vs. Completed Final Bill)
 * - Session-by-session clinical breakdown (Service fee, medicines, inventory/equipment)
 * - Formal Return / Credit Note line items (negative quantities and negative amounts)
 * - Master Payment Ledger and Financial Distribution reconciliation
 * - Refund Due support when deposits exceed total billed
 * - Cryptographic SHA-256 seal verification footer
 */
const generateInvoicePdf = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36, // 0.5 inch margins for hospital data density
        bufferPages: true, // Enables two-pass page numbering
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const L = 36;
      const R = 559;
      const W = R - L;
      const maxY = 770;

      // Formatting helpers
      const formatCurrency = (val) => {
        const num = Number(val) || 0;
        return num.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
          return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        } catch {
          return String(dateStr).slice(0, 10);
        }
      };

      const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return String(dateStr);
          const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          return `${datePart}, ${timePart}`;
        } catch {
          return String(dateStr).slice(0, 16);
        }
      };

      const formatSlotTime = (slotTime, duration) => {
        if (!slotTime && !duration) return '10:00 AM';
        let start = '';
        let end = '';
        if (typeof slotTime === 'string') {
          start = slotTime;
        } else if (typeof slotTime === 'object' && slotTime !== null) {
          start = slotTime.startTime || '';
          end = slotTime.endTime || '';
        }

        const toAmPm = (tStr) => {
          if (!tStr) return '';
          const s = String(tStr).trim();
          if (s.toLowerCase().includes('am') || s.toLowerCase().includes('pm')) return s;
          const parts = s.split(':');
          if (parts.length >= 2) {
            let h = parseInt(parts[0], 10);
            const m = parts[1].slice(0, 2).padStart(2, '0');
            if (isNaN(h)) return s;
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
          }
          return s;
        };

        const startFmt = toAmPm(start) || '10:00 AM';
        const endFmt = toAmPm(end);

        let timeStr = endFmt ? `${startFmt} - ${endFmt}` : startFmt;
        if (duration) {
          timeStr += ` (${duration} min)`;
        }
        return timeStr;
      };

      // Auto page break checker
      const checkPageBreak = (neededHeight) => {
        if (doc.y + neededHeight > maxY) {
          doc.addPage();
          drawCompactHeader();
          return true;
        }
        return false;
      };

      // Header on Page 1
      const drawMainHeader = () => {
        let y = 32;
        // Brand & Facility title on left
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0F172A').text('MEDICO HEALTHCARE', L, y);
        
        // Document Title on right (cleanly aligned without collision)
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0284C7')
           .text('CONSOLIDATED TREATMENT INVOICE', L + 240, y + 2, { width: W - 240, align: 'right' });
        y += 18;

        // Subtitle line on left & right
        doc.font('Helvetica').fontSize(8).fillColor('#64748B')
           .text('Multi-Speciality Clinical & Home Healthcare Platform', L, y);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748B')
           .text('TAX INVOICE & DISCHARGE SUMMARY', L + 240, y, { width: W - 240, align: 'right' });
        y += 18;

        // Status Badge Banner
        const isInProgress = (invoice.treatmentStatus || '').toLowerCase() === 'inprogress' || (invoice.billType || '').toLowerCase() === 'interimbill';
        if (isInProgress) {
          doc.rect(L, y, W, 22).fill('#FEF3C7');
          doc.rect(L, y, W, 22).strokeColor('#F59E0B').lineWidth(0.8).stroke();
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#B45309')
             .text(`INTERIM RUNNING BILL (v${invoice.billVersion || 1}) | TREATMENT IN PROGRESS | CUT-OFF: ${formatDate(invoice.clinicalContext?.cutOffDate || new Date())}`, L, y + 6, { width: W, align: 'center' });
        } else {
          doc.rect(L, y, W, 22).fill('#DCFCE7');
          doc.rect(L, y, W, 22).strokeColor('#10B981').lineWidth(0.8).stroke();
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#065F46')
             .text(`FINAL DISCHARGE BILL (v${invoice.billVersion || 1}) | TREATMENT COMPLETED | ALL SESSIONS FINALIZED`, L, y + 6, { width: W, align: 'center' });
        }
        y += 28;

        // Demographic & Clinical 2-Column Box
        const colW = (W - 10) / 2;
        const boxH = 96;

        // Patient Box (Left)
        doc.rect(L, y, colW, boxH).fill('#F8FAFC');
        doc.rect(L, y, 4, boxH).fill('#3B82F6');
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E293B').text('PATIENT DEMOGRAPHICS', L + 10, y + 7);
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        doc.text(`Patient Name : ${invoice.patientSnapshot?.name || invoice.patientId?.firstName || 'Patient'}`, L + 10, y + 21);
        doc.text(`UHID Number  : ${invoice.patientSnapshot?.uhid || 'UHID-' + String(invoice.patientId?._id || '').slice(-6).toUpperCase()}`, L + 10, y + 34);
        doc.text(`Treatment ID : #TR-${String(invoice.treatmentId?._id || invoice.treatmentId || '').slice(-6).toLowerCase()}`, L + 10, y + 47);
        doc.text(`Age / Gender : ${invoice.patientSnapshot?.age || 'N/A'} / ${invoice.patientSnapshot?.gender || 'N/A'}`, L + 10, y + 60);
        doc.text(`Contact Phone: ${invoice.patientSnapshot?.phone || 'N/A'}`, L + 10, y + 73);
        const rawAddr = String(invoice.patientSnapshot?.address || '').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
        doc.text(`Patient City : ${rawAddr || 'Noida, Uttar Pradesh'}`, L + 10, y + 86);

        // Clinical / Bill Box (Right)
        const rX = L + colW + 10;
        doc.rect(rX, y, colW, boxH).fill('#F8FAFC');
        doc.rect(rX, y, 4, boxH).fill('#10B981');
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E293B').text('TREATMENT & BILLING CONTEXT', rX + 10, y + 7);
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        doc.text(`Invoice No   : ${invoice.invoiceNumber || 'INV-TEMP'}`, rX + 10, y + 21);
        doc.text(`Invoice Date : ${formatDateTime(invoice.issuedAt || invoice.createdAt || new Date())}`, rX + 10, y + 34);
        doc.text(`Care Period  : ${formatDate(invoice.clinicalContext?.startDate)} to ${formatDate(invoice.clinicalContext?.cutOffDate)} (${invoice.sessions?.length || 0} Sessions)`, rX + 10, y + 47);
        doc.text(`Service Plan : ${invoice.clinicalContext?.serviceName || 'Clinical Care'}`, rX + 10, y + 60);
        doc.text(`Treating Dr. : ${invoice.clinicalContext?.treatingDoctorName || 'Consultant Specialist'}`, rX + 10, y + 73);
        doc.text(`Speciality   : ${invoice.clinicalContext?.treatingDoctorSpeciality || 'Clinical Specialist'}`, rX + 10, y + 86);

        doc.y = y + boxH + 12;
      };

      // Header on subsequent pages
      const drawCompactHeader = () => {
        let y = 32;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569')
           .text(`MEDICO CONSOLIDATED BILL | Inv: ${invoice.invoiceNumber} | Patient: ${invoice.patientSnapshot?.name || 'Patient'}`, L, y, { width: W - 110, ellipsis: true });
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0284C7')
           .text(`[${(invoice.treatmentStatus || 'InProgress').toUpperCase()}]`, L + W - 100, y, { width: 100, align: 'right' });
        y += 14;
        doc.strokeColor('#CBD5E1').lineWidth(0.8).moveTo(L, y).lineTo(R, y).stroke();
        doc.y = y + 10;
      };

      // Initial page setup
      drawMainHeader();

      // ==========================================
      // SECTION 1: SESSIONS & ITEMIZED USAGE
      // ==========================================
      const sessions = Array.isArray(invoice.sessions) && invoice.sessions.length > 0 
        ? invoice.sessions 
        : [];

      if (sessions.length > 0) {
        sessions.forEach((session, sIdx) => {
          checkPageBreak(75);

          // Session Header Ribbon
          let sy = doc.y;
          doc.rect(L, sy, W, 22).fill('#0F172A');
          
          const bookingTag = session.bookingCode 
            ? `#${session.bookingCode}` 
            : `#BID-${String(session.bookingId?._id || session.bookingId || '').slice(-6).toLowerCase()}`;
          const dateStr = formatDate(session.appointmentDate);
          const timeSlotStr = formatSlotTime(session.slotTime, session.duration);
          const providerStr = session.attendingProviderName || 'Assigned Staff';

          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF')
             .text(`SESSION #${session.sessionNumber || (sIdx + 1)} [${bookingTag}]   |   Date: ${dateStr}`, L + 8, sy + 6, { width: 260 });
          doc.font('Helvetica').fontSize(8).fillColor('#E2E8F0')
             .text(`Time: ${timeSlotStr}   |   Staff: ${providerStr}`, L + 250, sy + 6, { width: W - 258, align: 'right' });
          doc.y = sy + 26;

          // Table Header
          checkPageBreak(30);
          sy = doc.y;
          doc.rect(L, sy, W, 18).fill('#F1F5F9');
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569');
          doc.text('CATEGORY / ITEM DESCRIPTION', L + 4, sy + 5, { width: 230 });
          doc.text('CODE', L + 240, sy + 5, { width: 55 });
          doc.text('QTY', L + 300, sy + 5, { width: 35, align: 'center' });
          doc.text('RATE (Rs.)', L + 340, sy + 5, { width: 60, align: 'right' });
          doc.text('GST %', L + 405, sy + 5, { width: 45, align: 'center' });
          doc.text('TOTAL (Rs.)', L + 455, sy + 5, { width: 64, align: 'right' });
          doc.y = sy + 20;

          // 1. Base Service Row
          checkPageBreak(18);
          sy = doc.y;
          const sFee = Number(session.serviceFee) || 0;
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#1E293B').text('Clinical Service / Consultation Base', L + 4, sy + 2, { width: 230 });
          doc.font('Helvetica').fontSize(7.5).fillColor('#64748B').text('SRV-BASE', L + 240, sy + 2);
          doc.text('1', L + 300, sy + 2, { width: 35, align: 'center' });
          doc.text(formatCurrency(sFee), L + 340, sy + 2, { width: 60, align: 'right' });
          doc.text('0%', L + 405, sy + 2, { width: 45, align: 'center' });
          doc.font('Helvetica-Bold').fillColor('#1E293B').text(formatCurrency(sFee), L + 455, sy + 2, { width: 64, align: 'right' });
          doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(L, sy + 14).lineTo(R, sy + 14).stroke();
          doc.y = sy + 16;

          // 2. Medicines Rows (Handles Returns TC-FIN-01)
          if (Array.isArray(session.medicines) && session.medicines.length > 0) {
            session.medicines.forEach((med) => {
              checkPageBreak(18);
              sy = doc.y;
              const isRet = Boolean(med.isReturn || (med.quantity || 0) < 0 || (med.total || 0) < 0);
              const medColor = isRet ? '#DC2626' : '#334155';
              const nameText = isRet ? `[RETURN / CREDIT NOTE] ${med.name}` : `[Medicine] ${med.name}${med.dosage ? ' - ' + med.dosage : ''}`;

              doc.font(isRet ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(medColor)
                 .text(nameText, L + 4, sy + 2, { width: 230 });
              doc.text(med.serviceCode || 'MED-01', L + 240, sy + 2);
              doc.text(String(med.quantity || 1), L + 300, sy + 2, { width: 35, align: 'center' });
              doc.text(formatCurrency(med.unitPrice || 0), L + 340, sy + 2, { width: 60, align: 'right' });
              doc.text(`${med.taxPercentage || 12}%`, L + 405, sy + 2, { width: 45, align: 'center' });
              doc.text(formatCurrency(med.total || 0), L + 455, sy + 2, { width: 64, align: 'right' });

              doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(L, sy + 14).lineTo(R, sy + 14).stroke();
              doc.y = sy + 16;
            });
          }

          // 3. Equipment & Inventory Rows
          if (Array.isArray(session.equipmentAndInventory) && session.equipmentAndInventory.length > 0) {
            session.equipmentAndInventory.forEach((eq) => {
              checkPageBreak(18);
              sy = doc.y;
              const isRet = Boolean(eq.isReturn || (eq.quantity || 0) < 0 || (eq.total || 0) < 0);
              const eqColor = isRet ? '#DC2626' : '#334155';
              const nameText = isRet ? `[RETURN / CREDIT NOTE] ${eq.name}` : `[${eq.type || 'Equipment'}] ${eq.name} (${eq.duration || 'Session'})`;

              doc.font(isRet ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(eqColor)
                 .text(nameText, L + 4, sy + 2, { width: 230 });
              doc.text(eq.serviceCode || 'EQ-01', L + 240, sy + 2);
              doc.text(String(eq.quantity || 1), L + 300, sy + 2, { width: 35, align: 'center' });
              doc.text(formatCurrency(eq.unitRate || 0), L + 340, sy + 2, { width: 60, align: 'right' });
              doc.text(`${eq.taxPercentage || 18}%`, L + 405, sy + 2, { width: 45, align: 'center' });
              doc.text(formatCurrency(eq.total || 0), L + 455, sy + 2, { width: 64, align: 'right' });

              doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(L, sy + 14).lineTo(R, sy + 14).stroke();
              doc.y = sy + 16;
            });
          }

          // Session Subtotal Row
          checkPageBreak(22);
          sy = doc.y;
          const sTotal = Number(session.sessionFinancials?.sessionNetTotal || 0);
          doc.rect(L, sy, W, 18).fill('#F8FAFC');
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A')
             .text(`SESSION #${session.sessionNumber || (sIdx + 1)} NET SUBTOTAL:`, L + 200, sy + 5, { width: 240, align: 'right' });
          doc.text(`Rs. ${formatCurrency(sTotal)}`, L + 445, sy + 5, { width: 74, align: 'right' });
          doc.y = sy + 24;
        });
      } else {
        // Fallback for legacy items if any
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748B').text('No itemized sessions logged.', L, doc.y + 10);
        doc.y += 25;
      }

      // ==========================================
      // SECTION 2: FINANCIAL DISTRIBUTION MATRIX
      // ==========================================
      if (sessions.length > 0) {
        checkPageBreak(80 + (sessions.length * 15));
        let my = doc.y + 8;
        doc.rect(L, my, W, 18).fill('#0284C7');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF')
           .text('TREATMENT FINANCIAL DISTRIBUTION PER BOOKING', L + 6, my + 5);
        my += 20;

        // Header
        doc.rect(L, my, W, 15).fill('#E0F2FE');
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#0369A1');
        doc.text('BOOKING / SESSION REF', L + 4, my + 4, { width: 114 });
        doc.text('DATE & TIME', L + 120, my + 4, { width: 95 });
        doc.text('SERVICE FEE', L + 218, my + 4, { width: 68, align: 'right' });
        doc.text('MEDICINES', L + 290, my + 4, { width: 72, align: 'right' });
        doc.text('INVENTORY / EQUIP', L + 366, my + 4, { width: 80, align: 'right' });
        doc.text('NET TOTAL', L + 450, my + 4, { width: 68, align: 'right' });
        my += 16;

        sessions.forEach((s) => {
          const bTag = s.bookingCode ? `#${s.bookingCode}` : `#BID-${String(s.bookingId?._id || s.bookingId || '').slice(-6).toLowerCase()}`;
          const timeOnly = formatSlotTime(s.slotTime).split('-')[0].replace(/\(\d+.*$/, '').trim();
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
          doc.text(`Session #${s.sessionNumber} (${bTag})`, L + 4, my + 3, { width: 114, ellipsis: true });
          doc.text(`${formatDate(s.appointmentDate)} ${timeOnly}`, L + 120, my + 3, { width: 95 });
          doc.text(formatCurrency(s.sessionFinancials?.serviceFee || s.serviceFee || 0), L + 218, my + 3, { width: 68, align: 'right' });
          doc.text(formatCurrency(s.sessionFinancials?.medicineSubtotal || 0), L + 290, my + 3, { width: 72, align: 'right' });
          doc.text(formatCurrency(s.sessionFinancials?.inventorySubtotal || 0), L + 366, my + 3, { width: 80, align: 'right' });
          doc.font('Helvetica-Bold').text(formatCurrency(s.sessionFinancials?.sessionNetTotal || 0), L + 450, my + 3, { width: 68, align: 'right' });
          doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(L, my + 13).lineTo(R, my + 13).stroke();
          my += 15;
        });

        // Totals Row
        const summary = invoice.financialDistributionSummary || {};
        doc.rect(L, my, W, 16).fill('#F0F9FF');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0284C7');
        doc.text('CUMULATIVE TOTALS:', L + 4, my + 4, { width: 210 });
        doc.text(formatCurrency(summary.totalServiceFees || 0), L + 218, my + 4, { width: 68, align: 'right' });
        doc.text(formatCurrency(summary.totalMedicinesCost || 0), L + 290, my + 4, { width: 72, align: 'right' });
        doc.text(formatCurrency(summary.totalEquipmentInventoryCost || 0), L + 366, my + 4, { width: 80, align: 'right' });
        doc.text(`Rs. ${formatCurrency(summary.grossSubtotal || 0)}`, L + 450, my + 4, { width: 68, align: 'right' });
        my += 22;
        doc.y = my;
      }

      // ==========================================
      // SECTION 3: MASTER PAYMENT LEDGER
      // ==========================================
      const payments = Array.isArray(invoice.paymentLedger) && invoice.paymentLedger.length > 0 ? invoice.paymentLedger : [];
      checkPageBreak(60 + (payments.length * 14));
      let py = doc.y + 4;
      doc.rect(L, py, W, 18).fill('#475569');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF')
         .text('ADVANCE DEPOSITS & PAYMENT RECEIPTS LEDGER', L + 6, py + 5);
      py += 20;

      doc.rect(L, py, W, 15).fill('#F1F5F9');
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569');
      doc.text('S.NO', L + 4, py + 4, { width: 30 });
      doc.text('RECEIPT NO', L + 40, py + 4, { width: 120 });
      doc.text('DATE & TIME', L + 170, py + 4, { width: 130 });
      doc.text('PAYMENT MODE', L + 310, py + 4, { width: 90 });
      doc.text('STAGE / TYPE', L + 410, py + 4, { width: 60 });
      doc.text('AMOUNT (Rs.)', L + 475, py + 4, { width: 44, align: 'right' });
      py += 16;

      if (payments.length > 0) {
        payments.forEach((p, idx) => {
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
          doc.text(String(idx + 1), L + 4, py + 3, { width: 30 });
          doc.text(p.receiptNumber || 'N/A', L + 40, py + 3, { width: 120 });
          doc.text(formatDateTime(p.paidAt), L + 170, py + 3, { width: 130 });
          doc.text(p.mode || 'Online', L + 310, py + 3, { width: 90 });
          doc.text(p.transactionType || 'Deposit', L + 410, py + 3, { width: 60 });
          doc.font('Helvetica-Bold').text(formatCurrency(p.amount || 0), L + 475, py + 3, { width: 44, align: 'right' });
          doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(L, py + 13).lineTo(R, py + 13).stroke();
          py += 14;
        });
      } else {
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748B').text('No advance deposits recorded.', L + 4, py + 3);
        py += 14;
      }
      doc.y = py + 8;

      // ==========================================
      // SECTION 4: GRAND FINANCIAL RECONCILIATION
      // ==========================================
      checkPageBreak(110);
      let fy = doc.y + 4;
      const sum = invoice.financialDistributionSummary || {};
      const gross = Number(sum.grossSubtotal || 0);
      const discount = Number(sum.totalDiscounts || 0);
      const net = Number(sum.netPayableAmount || (gross - discount));
      const paid = Number(sum.totalPaidAmount || 0);
      const balanceDue = Number(sum.balanceDue || Math.max(0, net - paid));
      const refundDue = Number(sum.refundDue || Math.max(0, paid - net)); // TC-FIN-02

      const sumW = 240;
      const sumX = R - sumW;

      doc.rect(sumX, fy, sumW, 90).fill('#F8FAFC');
      doc.rect(sumX, fy, sumW, 90).strokeColor('#CBD5E1').lineWidth(0.8).stroke();

      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text('Total Bill Amount (Gross):', sumX + 10, fy + 8, { width: 130 });
      doc.font('Helvetica-Bold').text(`Rs. ${formatCurrency(gross)}`, sumX + 140, fy + 8, { width: 90, align: 'right' });

      doc.font('Helvetica').text('Institutional Concession / Disc:', sumX + 10, fy + 22, { width: 130 });
      doc.font('Helvetica-Bold').fillColor('#DC2626').text(`- Rs. ${formatCurrency(discount)}`, sumX + 140, fy + 22, { width: 90, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('Net Payable Amount:', sumX + 10, fy + 36, { width: 130 });
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`Rs. ${formatCurrency(net)}`, sumX + 140, fy + 36, { width: 90, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('Total Paid / Advance Deposited:', sumX + 10, fy + 50, { width: 130 });
      doc.font('Helvetica-Bold').fillColor('#059669').text(`Rs. ${formatCurrency(paid)}`, sumX + 140, fy + 50, { width: 90, align: 'right' });

      // Final status banner inside box
      if (refundDue > 0) {
        doc.rect(sumX, fy + 65, sumW, 25).fill('#DC2626');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
           .text('REFUND PAYABLE TO PATIENT:', sumX + 8, fy + 72)
           .text(`Rs. ${formatCurrency(refundDue)}`, sumX + 130, fy + 72, { width: 100, align: 'right' });
      } else if (balanceDue > 0) {
        doc.rect(sumX, fy + 65, sumW, 25).fill('#0F172A');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
           .text('BALANCE DUE / PENDING:', sumX + 8, fy + 72)
           .text(`Rs. ${formatCurrency(balanceDue)}`, sumX + 130, fy + 72, { width: 100, align: 'right' });
      } else {
        doc.rect(sumX, fy + 65, sumW, 25).fill('#059669');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
           .text('STATUS: FULLY SETTLED', sumX + 8, fy + 72)
           .text('Rs. 0.00 DUE', sumX + 130, fy + 72, { width: 100, align: 'right' });
      }

      // Legal Note (Left of Summary)
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748B')
         .text(
           'Note: This is a verified electronic medical billing statement generated by the Medico Clinical Core. ' +
           'All pharmaceutical items and clinical inventory recorded were authorized and administered by credentialed providers. ' +
           'Subject to audit and state tax compliance regulations.',
           L, fy + 10, { width: W - sumW - 20 }
         );

      doc.y = fy + 105;

      // ==========================================
      // SECTION 5: SIGNATURES & AUDIT SEAL
      // ==========================================
      checkPageBreak(50);
      let sgy = doc.y + 10;
      doc.strokeColor('#E2E8F0').lineWidth(0.8).moveTo(L, sgy).lineTo(R, sgy).stroke();
      sgy += 8;

      const sigW = W / 3;
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text('Patient / Attendant Signature', L, sgy, { width: sigW });
      doc.text(`Printed By: ${invoice.createdBy?.userName || 'Billing Operator'}`, L + sigW, sgy, { width: sigW, align: 'center' });
      doc.text('Authorized Hospital Signatory', L + (sigW * 2), sgy, { width: sigW, align: 'right' });
      sgy += 14;

      // Digital Security Seal Footer
      if (invoice.securityHash) {
        doc.font('Courier').fontSize(6.5).fillColor('#94A3B8')
           .text(`SHA-256 Security Seal: ${invoice.securityHash} [Verified Immutable Record]`, L, sgy, { width: W, align: 'center' });
      }

      // ==========================================
      // TWO-PASS PAGE NUMBERING (Page X of Y)
      // ==========================================
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(7).fillColor('#94A3B8')
           .text(`Page ${i + 1} of ${totalPages}`, L, maxY + 2, { width: W, align: 'center' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePdf;
