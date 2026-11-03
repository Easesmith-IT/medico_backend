const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  invoiceType: {
    type: String,
    enum: ['SingleBooking', 'TreatmentConsolidated'],
    default: 'TreatmentConsolidated',
    index: true,
  },
  treatmentStatus: {
    type: String,
    enum: ['InProgress', 'Completed'],
    default: 'InProgress',
    index: true,
  },
  billType: {
    type: String,
    enum: ['InterimBill', 'FinalBill'],
    default: 'InterimBill',
  },
  billVersion: { type: Number, default: 1 },
  isLatest: { type: Boolean, default: true, index: true },
  previousInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

  // Linked References
  treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Treatment', default: null, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }, // Optional for consolidated
  bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },

  // Patient Demographics Snapshot
  patientSnapshot: {
    uhid: { type: String, default: '' },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    age: { type: String, default: 'N/A' },
    gender: { type: String, default: 'N/A' },
    address: { type: String, default: '' },
  },

  // Clinical Context Snapshot
  clinicalContext: {
    serviceName: { type: String, default: 'Healthcare Service' },
    treatmentCategory: { type: String, default: 'General' },
    treatingDoctorName: { type: String, default: '' },
    treatingDoctorSpeciality: { type: String, default: 'General Medicine' },
    treatingDoctorRegNo: { type: String, default: '' },
    startDate: { type: Date, default: null },
    cutOffDate: { type: Date, default: null },
    completedSessionsCount: { type: Number, default: 0 },
  },

  // Materialized Multi-Session Breakdown (All bookings that happened)
  sessions: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      bookingCode: { type: String, default: '' },
      sessionNumber: { type: Number, default: 1 },
      appointmentDate: { type: Date, default: Date.now },
      slotTime: {
        startTime: { type: String, default: '' },
        endTime: { type: String, default: '' },
      },
      duration: { type: Number, default: 60 },
      attendingProviderName: { type: String, default: '' },
      serviceFee: { type: Number, default: 0 },
      medicines: [
        {
          name: { type: String, required: true },
          categoryName: { type: String, default: 'Medicine' },
          serviceCode: { type: String, default: '' },
          dosage: { type: String, default: '' },
          quantity: { type: Number, required: true }, // Negative for returns
          unitPrice: { type: Number, required: true },
          taxPercentage: { type: Number, default: 12 },
          total: { type: Number, required: true },
          isReturn: { type: Boolean, default: false },
          administeredAt: { type: Date, default: Date.now },
        }
      ],
      equipmentAndInventory: [
        {
          name: { type: String, required: true },
          categoryName: { type: String, default: 'Equipment & Rentals' },
          serviceCode: { type: String, default: '' },
          type: { type: String, default: 'Equipment' },
          quantity: { type: Number, required: true }, // Negative for returns
          duration: { type: String, default: '1 Session' },
          unitRate: { type: Number, required: true },
          taxPercentage: { type: Number, default: 18 },
          total: { type: Number, required: true },
          isReturn: { type: Boolean, default: false },
        }
      ],
      sessionFinancials: {
        serviceFee: { type: Number, default: 0 },
        medicineSubtotal: { type: Number, default: 0 },
        inventorySubtotal: { type: Number, default: 0 },
        sessionNetTotal: { type: Number, default: 0 },
      }
    }
  ],

  // Comprehensive Financial Distribution Summary
  financialDistributionSummary: {
    totalServiceFees: { type: Number, default: 0 },
    totalMedicinesCost: { type: Number, default: 0 },
    totalEquipmentInventoryCost: { type: Number, default: 0 },
    grossSubtotal: { type: Number, default: 0 },
    totalDiscounts: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    netPayableAmount: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    refundDue: { type: Number, default: 0 },
  },

  // Chronological Master Payment Receipts Ledger
  paymentLedger: [
    {
      receiptNumber: { type: String, required: true },
      paidAt: { type: Date, default: Date.now },
      mode: { type: String, default: 'Online' },
      transactionType: { type: String, default: 'Advance' },
      amount: { type: Number, required: true },
      gatewayPaymentId: { type: String, default: null },
    }
  ],

  // Legacy single-booking fields (maintained for backward compatibility)
  billingDetails: {
    category: { type: String, enum: ["consultation", "nursing", "equipment"] },
    serviceName: String,
    shiftType: String,
    durationMinutes: Number,
    basePrice: Number,
    calculatedBase: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 }
  },
  medicines: [{
    name: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCategory' },
    categoryName: String,
    quantity: { type: Number, default: 1 },
    pricePerUnit: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 12 },
    total: { type: Number, default: 0 },
    addedDate: { type: Date, default: Date.now }
  }],
  additionalEquipment: [{
    name: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCategory' },
    categoryName: String,
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    total: { type: Number, default: 0 },
    addedDate: { type: Date, default: Date.now }
  }],
  totals: {
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },

  // Assets, Security & Delivery
  invoiceUrl: { type: String, default: null }, // CDN URL
  pdfUrl: { type: String, default: null },
  localPdfPath: { type: String, default: null },
  securityHash: { type: String, default: null },
  isInvoiceGenerated: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid'], default: 'Unpaid' },
  issuedAt: { type: Date, default: Date.now },
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
    userName: { type: String, default: 'System' },
    role: { type: String, default: 'Admin' },
  }
}, { timestamps: true });

// Pre-save calculation strictly for single-booking invoices
invoiceSchema.pre('save', function (next) {
  if (this.invoiceType === 'TreatmentConsolidated' || !this.billingDetails) {
    return next();
  }

  const billingBase = parseFloat(this.billingDetails.calculatedBase) || 0;
  const billingTax = (billingBase * (parseFloat(this.billingDetails.taxPercentage) || 0)) / 100;

  let medSub = 0, medTax = 0;
  if (Array.isArray(this.medicines)) {
    this.medicines.forEach(m => {
      const base = (m.quantity || 0) * (m.pricePerUnit || 0);
      const tax = (base * (m.gstPercentage || 0)) / 100;
      m.total = base + tax;
      medSub += base; medTax += tax;
    });
  }

  let equipSub = 0, equipTax = 0;
  if (Array.isArray(this.additionalEquipment)) {
    this.additionalEquipment.forEach(e => {
      const base = (e.quantity || 0) * (e.rate || 0);
      const tax = (base * (e.gstPercentage || 0)) / 100;
      e.total = base + tax;
      equipSub += base; equipTax += tax;
    });
  }

  if (!this.totals) this.totals = {};
  this.totals.subtotal = billingBase + medSub + equipSub;
  this.totals.gstAmount = billingTax + medTax + equipTax;
  this.totals.cgst = this.totals.gstAmount / 2;
  this.totals.sgst = this.totals.gstAmount / 2;
  this.totals.grandTotal = this.totals.subtotal + this.totals.gstAmount;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
