const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Treatment = require('../models/treatmentModel');
const Booking = require('../models/bookingModel');
const Invoice = require('../models/invoiceModel');
const Patient = require('../models/patientModel');
const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
const generateInvoicePdf = require('../utils/generateInvoicePdf');
const uploadFile = require('../utils/uploadFile');

// In-flight concurrency lock map to prevent double-click race conditions (TC-SEC-01)
const inFlightGenerationLocks = new Set();

const round2 = (num) => {
  return Math.round(((Number(num) || 0) + Number.EPSILON) * 100) / 100;
};

/**
 * Compiles and materializes an immutable multi-session treatment invoice snapshot.
 * Executed strictly on-demand. Never modifies treatment.status!
 */
const compileAndMaterializeTreatmentInvoice = async ({
  treatmentId,
  requestedBy = {},
  institutionalDiscount = 0,
}) => {
  if (!treatmentId || !mongoose.Types.ObjectId.isValid(treatmentId)) {
    const err = new Error('Invalid or missing treatmentId');
    err.statusCode = 400;
    throw err;
  }

  // 1. Concurrency guard (TC-SEC-01)
  const lockKey = treatmentId.toString();
  if (inFlightGenerationLocks.has(lockKey)) {
    const err = new Error('Invoice generation is already in progress for this treatment. Please wait.');
    err.statusCode = 409;
    throw err;
  }
  inFlightGenerationLocks.add(lockKey);

  try {
    // 2. Load treatment and verify existence
    const treatment = await Treatment.findById(treatmentId)
      .populate('patientId')
      .populate('serviceId')
      .populate('servicePartnerId');

    if (!treatment) {
      const err = new Error('Treatment not found');
      err.statusCode = 404;
      throw err;
    }

    // Determine status & billType based on current treatment state
    const isCompleted = (treatment.status || '').toLowerCase() === 'completed';
    const treatmentStatus = isCompleted ? 'Completed' : 'InProgress';
    const billType = isCompleted ? 'FinalBill' : 'InterimBill';

    // 3. Fetch only COMPLETED bookings under treatmentId (TC-LIFE-01, TC-LIFE-04)
    const bookings = await Booking.find({
      treatmentId,
      status: 'Completed',
    })
      .sort({ sessionNumber: 1, appointmentDate: 1 })
      .populate('servicePartnerId', 'firstName lastName specialization medicalRegistrationNumber');

    if (!bookings || bookings.length === 0) {
      const err = new Error('No completed care sessions found to invoice for this treatment');
      err.statusCode = 400;
      err.code = 'NO_COMPLETED_SESSIONS_TO_INVOICE';
      throw err;
    }

    // 4. Idempotency Check (TC-LIFE-03)
    const currentCompletedIds = bookings.map((b) => b._id.toString()).sort();
    const existingLatest = await Invoice.findOne({ treatmentId, isLatest: true });

    if (existingLatest) {
      const existingBilledIds = (existingLatest.bookingIds || []).map((id) => id.toString()).sort();
      const sameBookings = JSON.stringify(currentCompletedIds) === JSON.stringify(existingBilledIds);
      const sameStatus = existingLatest.treatmentStatus === treatmentStatus;

      // Check if any booking updated after the existing invoice was issued
      const invoiceIssuedTime = new Date(existingLatest.issuedAt).getTime();
      const hasRecentBookingUpdates = bookings.some((b) => new Date(b.updatedAt).getTime() > invoiceIssuedTime);

      if (sameBookings && sameStatus && !hasRecentBookingUpdates && institutionalDiscount === (existingLatest.financialDistributionSummary?.totalDiscounts || 0)) {
        // Safe return of cached invoice: no new sessions to bill
        return existingLatest;
      }
    }

    // 5. Compile session-by-session items and calculate financials (TC-FIN-01, TC-FIN-03)
    let totalServiceFees = 0;
    let totalMedicinesCost = 0;
    let totalEquipmentInventoryCost = 0;
    const compiledSessions = [];
    const paymentLedger = [];

    bookings.forEach((booking, idx) => {
      const sFee = round2(booking.sessionFinancialSnapshot?.serviceFee || booking.pricing?.basePrice || 0);
      const meds = (booking.medicinesUsed || []).map((m) => ({
        medicineId: m.medicineId,
        name: m.name,
        categoryName: m.categoryName || 'Medicine',
        serviceCode: m.serviceCode || '',
        dosage: m.dosage || '',
        quantity: m.quantity, // Can be negative for returns
        unitPrice: round2(m.unitPrice),
        taxPercentage: m.taxPercentage || 12,
        total: round2(m.total),
        isReturn: Boolean(m.isReturn || m.quantity < 0 || m.total < 0),
        administeredAt: m.administeredAt || booking.appointmentDate,
      }));

      const equip = (booking.inventoryAndEquipmentUsed || []).map((e) => ({
        itemId: e.itemId,
        name: e.name,
        categoryName: e.categoryName || 'Equipment & Rentals',
        serviceCode: e.serviceCode || '',
        type: e.type || 'Equipment',
        quantity: e.quantity, // Can be negative for returns
        duration: e.duration || '1 Session',
        unitRate: round2(e.unitRate),
        taxPercentage: e.taxPercentage || 18,
        total: round2(e.total),
        isReturn: Boolean(e.isReturn || e.quantity < 0 || e.total < 0),
      }));

      const sessionMedTotal = round2(meds.reduce((sum, m) => sum + m.total, 0));
      const sessionEquipTotal = round2(equip.reduce((sum, e) => sum + e.total, 0));
      const sessionNet = round2(sFee + sessionMedTotal + sessionEquipTotal);

      totalServiceFees = round2(totalServiceFees + sFee);
      totalMedicinesCost = round2(totalMedicinesCost + sessionMedTotal);
      totalEquipmentInventoryCost = round2(totalEquipmentInventoryCost + sessionEquipTotal);

      const bookingCode = `BID-${String(booking._id).slice(-6).toLowerCase()}`;
      compiledSessions.push({
        bookingId: booking._id,
        bookingCode,
        sessionNumber: booking.sessionNumber || idx + 1,
        appointmentDate: booking.appointmentDate,
        slotTime: booking.slotTime || { startTime: '10:00 AM', endTime: '11:00 AM' },
        duration: booking.duration || 60,
        attendingProviderName: `${booking.servicePartnerId?.firstName || ''} ${booking.servicePartnerId?.lastName || ''}`.trim() || 'Assigned Staff',
        serviceFee: sFee,
        medicines: meds,
        equipmentAndInventory: equip,
        sessionFinancials: {
          serviceFee: sFee,
          medicineSubtotal: sessionMedTotal,
          inventorySubtotal: sessionEquipTotal,
          sessionNetTotal: sessionNet,
        },
      });

      // Master Payment Ledger: Collate advance payments and deposits
      if (Array.isArray(booking.paymentHistory)) {
        booking.paymentHistory.forEach((p, pIdx) => {
          paymentLedger.push({
            receiptNumber: p.razorpayPaymentId || `REC-${String(booking._id).slice(-4)}-${pIdx + 1}`,
            paidAt: p.paidAt || booking.appointmentDate,
            mode: p.method || 'Online',
            transactionType: p.stage || 'Advance',
            amount: round2(p.amount),
            gatewayPaymentId: p.razorpayPaymentId || null,
          });
        });
      }
    });

    // 6. Overall Treatment Financial Reconciliation
    const grossSubtotal = round2(totalServiceFees + totalMedicinesCost + totalEquipmentInventoryCost);
    const discountAmount = round2(institutionalDiscount);
    const netPayableAmount = Math.max(0, round2(grossSubtotal - discountAmount));
    const totalPaidAmount = round2(paymentLedger.reduce((sum, p) => sum + p.amount, 0));

    // Handle Balance Due vs. Refund Due (TC-FIN-02)
    let balanceDue = 0;
    let refundDue = 0;
    if (totalPaidAmount > netPayableAmount) {
      refundDue = round2(totalPaidAmount - netPayableAmount);
      balanceDue = 0;
    } else {
      balanceDue = round2(netPayableAmount - totalPaidAmount);
      refundDue = 0;
    }

    // 7. Versioning logic
    let nextVersion = 1;
    if (existingLatest) {
      nextVersion = (existingLatest.billVersion || 1) + 1;
      existingLatest.isLatest = false;
      await existingLatest.save();
    }

    const billPrefix = treatmentStatus === 'Completed' ? 'FIN' : 'INT';
    const invoiceNumber = `INV-${billPrefix}-${Date.now().toString().slice(-8)}`;

    const patient = treatment.patientId || {};
    const patientSnapshot = {
      uhid: `UHID-${String(patient._id || '').slice(-6).toUpperCase()}`,
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
      phone: patient.phone || 'N/A',
      age: patient.age ? String(patient.age) : '38 Y',
      gender: patient.gender || 'Female',
      address: patient.address ? `${patient.address.street || ''}, ${patient.address.city || ''}`.trim() : 'Address on file',
    };

    // Accurately determine care period across all treatment sessions
    const sortedBookings = [...bookings].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    const firstSessionDate = sortedBookings[0]?.appointmentDate || treatment.startDate || new Date();
    const lastSessionDate = sortedBookings[sortedBookings.length - 1]?.appointmentDate || treatment.endDate || firstSessionDate;

    const clinicalContext = {
      serviceName: treatment.serviceId?.name || 'Healthcare Service',
      treatmentCategory: treatment.serviceId?.category || 'General Care',
      treatingDoctorName: `Dr. ${treatment.servicePartnerId?.firstName || 'Medical Specialist'} ${treatment.servicePartnerId?.lastName || ''}`.trim(),
      treatingDoctorSpeciality: treatment.servicePartnerId?.specialization || 'Clinical Specialist',
      treatingDoctorRegNo: treatment.servicePartnerId?.medicalRegistrationNumber || 'REG-78892',
      startDate: firstSessionDate,
      cutOffDate: lastSessionDate,
      completedSessionsCount: bookings.length,
    };

    // 8. Generate HMAC SHA-256 Digital Seal (TC-SEC-02)
    const signPayload = `${invoiceNumber}|${grossSubtotal}|${netPayableAmount}|${totalPaidAmount}|${patientSnapshot.uhid}`;
    const securityHash = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'medico_production_secret_key')
      .update(signPayload)
      .digest('hex');

    // Build the Invoice Document in RAM
    const invoiceDoc = new Invoice({
      invoiceNumber,
      invoiceType: 'TreatmentConsolidated',
      treatmentStatus,
      billType,
      billVersion: nextVersion,
      isLatest: true,
      previousInvoiceId: existingLatest?._id || null,
      treatmentId: treatment._id,
      patientId: patient._id,
      doctorId: treatment.servicePartnerId?._id || null,
      bookingIds: bookings.map((b) => b._id),
      patientSnapshot,
      clinicalContext,
      sessions: compiledSessions,
      financialDistributionSummary: {
        totalServiceFees,
        totalMedicinesCost,
        totalEquipmentInventoryCost,
        grossSubtotal,
        totalDiscounts: discountAmount,
        totalTax: 0,
        netPayableAmount,
        totalPaidAmount,
        balanceDue,
        refundDue,
      },
      paymentLedger,
      securityHash,
      pdfUrl: '',
      issuedAt: new Date(),
      isInvoiceGenerated: true,
      paymentStatus: balanceDue === 0 ? 'Paid' : totalPaidAmount > 0 ? 'Partially Paid' : 'Unpaid',
      issuedAt: new Date(),
      createdBy: {
        userId: requestedBy.id || null,
        userName: requestedBy.name || 'Clinical Administrator',
        role: requestedBy.role || 'Admin',
      },
    });

    // 9. Generate Multi-Page PDF on Server
    const pdfBuffer = await generateInvoicePdf(invoiceDoc.toObject());

    // Local Disk Storage Retention (TC-PDF-03)
    const localUploadsDir = path.join(__dirname, '..', 'uploads', 'invoices');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }
    const localPdfPath = path.join(localUploadsDir, `${invoiceNumber}.pdf`);
    fs.writeFileSync(localPdfPath, pdfBuffer);
    invoiceDoc.localPdfPath = localPdfPath;

    // Cloud CDN Upload with Local Fallback (TC-PDF-03)
    let cdnUrl = null;
    try {
      cdnUrl = await uploadFile({
        originalname: `${invoiceNumber}.pdf`,
        buffer: pdfBuffer,
      });
    } catch (uploadErr) {
      console.warn(`[TreatmentInvoiceService] Cloud CDN upload failed, falling back to local stream path: ${uploadErr.message}`);
    }

    invoiceDoc.pdfUrl = cdnUrl || `/api/v1/invoice/download/${invoiceDoc._id}`;
    invoiceDoc.invoiceUrl = invoiceDoc.pdfUrl;

    // 10. Save immutable materialized invoice
    const savedInvoice = await invoiceDoc.save();

    // 11. Link invoice to Treatment without modifying treatment.status!
    treatment.invoiceId = savedInvoice._id;
    treatment.invoiceGenerated = true;
    if (!Array.isArray(treatment.invoicesHistory)) treatment.invoicesHistory = [];
    treatment.invoicesHistory.push(savedInvoice._id);
    await treatment.save();

    return savedInvoice;
  } finally {
    inFlightGenerationLocks.delete(lockKey);
  }
};

/**
 * Fast O(1) Fetch of the Latest Materialized Invoice (Zero Runtime Bridge Query)
 */
const getLatestTreatmentInvoice = async (treatmentId, user = null) => {
  if (!treatmentId || !mongoose.Types.ObjectId.isValid(treatmentId)) {
    const err = new Error('Invalid treatmentId');
    err.statusCode = 400;
    throw err;
  }

  const invoice = await Invoice.findOne({ treatmentId, isLatest: true }).lean();
  if (!invoice) {
    const err = new Error('No invoice found for this treatment');
    err.statusCode = 404;
    throw err;
  }

  // Security Check: Patient can only view their own invoice (TC-SEC-03)
  if (user && user.role === 'patient') {
    if (invoice.patientId && invoice.patientId.toString() !== user.id.toString()) {
      const err = new Error('Unauthorized invoice access');
      err.statusCode = 403;
      throw err;
    }
  }

  return invoice;
};

/**
 * Get all historical versions (v1, v2, Final) for audit & insurance verification
 */
const getTreatmentInvoiceHistory = async (treatmentId, user = null) => {
  if (!treatmentId || !mongoose.Types.ObjectId.isValid(treatmentId)) {
    const err = new Error('Invalid treatmentId');
    err.statusCode = 400;
    throw err;
  }

  const invoices = await Invoice.find({ treatmentId })
    .select('_id invoiceNumber billType billVersion treatmentStatus issuedAt financialDistributionSummary pdfUrl isLatest')
    .sort({ billVersion: -1 })
    .lean();

  return invoices;
};

/**
 * Validates cryptographic SHA-256 HMAC digital seal (TC-SEC-02)
 */
const verifyInvoiceSecurityHash = (invoice) => {
  if (!invoice || !invoice.securityHash) return false;
  const summary = invoice.financialDistributionSummary || {};
  const signPayload = `${invoice.invoiceNumber}|${summary.grossSubtotal}|${summary.netPayableAmount}|${summary.totalPaidAmount}|${invoice.patientSnapshot?.uhid || ''}`;
  const computedHash = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'medico_production_secret_key')
    .update(signPayload)
    .digest('hex');

  return computedHash === invoice.securityHash;
};

module.exports = {
  compileAndMaterializeTreatmentInvoice,
  getLatestTreatmentInvoice,
  getTreatmentInvoiceHistory,
  verifyInvoiceSecurityHash,
};
