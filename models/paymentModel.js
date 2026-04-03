const mongoose = require("mongoose");

// Every time patient makes a payment (partial or full), one entry here
const transactionSchema = new mongoose.Schema(
  {
    razorpayOrderId:   { type: String, required: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    amountPaid:    { type: Number, required: true }, // ₹ — NOT paise
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    failureReason: { type: String, default: null },
    paidAt:        { type: Date,   default: null },
  },
  { _id: true }
);

// Every refund against a specific transaction
const refundSchema = new mongoose.Schema(
  {
    razorpayRefundId:  { type: String, required: true },
    razorpayPaymentId: { type: String, required: true }, // which txn was refunded
    refundAmount:      { type: Number, required: true },
    reason:            { type: String, default: "Patient request" },
    status: {
      type: String,
      enum: ["Pending", "Processed"],
      default: "Pending",
    },
    refundedAt: { type: Date, default: null },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    // ── References (match your exact model names) ──────────────────────────
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    servicePartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",   // matches your bookingModel ref
      default: null,
    },

    // All booking IDs under this treatment that form this bill
    // (matches bookingModel's treatmentId field — inverse lookup)
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],

    // Linked invoice (your invoiceModel has invoiceNumber, totals.grandTotal etc.)
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    // ── Bill amounts (pulled from invoiceModel.totals on bill generation) ──
    totalBillAmount:  { type: Number, required: true }, // = invoice.totals.grandTotal
    totalPaid:        { type: Number, default: 0 },     // running sum of paid txns
    totalRefunded:    { type: Number, default: 0 },     // running sum of refunds
    remainingBalance: { type: Number, default: 0 },     // auto-computed in pre-save

    // ── Bill breakdown (mirrors invoiceModel.totals exactly) ───────────────
    billBreakdown: {
      subtotal:    { type: Number, default: 0 },  // invoice.totals.subtotal
      gstAmount:   { type: Number, default: 0 },  // invoice.totals.gstAmount
      cgst:        { type: Number, default: 0 },  // invoice.totals.cgst
      sgst:        { type: Number, default: 0 },  // invoice.totals.sgst
      grandTotal:  { type: Number, default: 0 },  // invoice.totals.grandTotal
    },

    // ── Payment status (auto-computed in pre-save) ─────────────────────────
    paymentStatus: {
      type: String,
      // intentionally mirrors invoiceModel.paymentStatus values + extras
      enum: ["Unpaid", "Partially Paid", "Paid", "Refunded", "PartialRefund"],
      default: "Unpaid",
      index: true,
    },

    // ── Transaction log (each partial/full payment attempt) ────────────────
    transactions: [transactionSchema],

    // ── Refund log ─────────────────────────────────────────────────────────
    refunds: [refundSchema],

    // ── Webhook audit ──────────────────────────────────────────────────────
    lastWebhookEvent:       { type: String, default: null },
    lastWebhookProcessedAt: { type: Date,   default: null },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save: auto-compute remainingBalance + paymentStatus ────────────────
paymentSchema.pre("save", function (next) {
  // remaining = what patient still owes
  this.remainingBalance = +(
    this.totalBillAmount - this.totalPaid + this.totalRefunded
  ).toFixed(2);

  // Derive status
  if (this.totalPaid <= 0) {
    this.paymentStatus = "Unpaid";
  } else if (this.totalRefunded >= this.totalBillAmount) {
    this.paymentStatus = "Refunded";
  } else if (this.totalRefunded > 0 && this.totalRefunded < this.totalPaid) {
    this.paymentStatus = "PartialRefund";
  } else if (this.totalPaid >= this.totalBillAmount) {
    this.paymentStatus = "Paid";
  } else {
    this.paymentStatus = "Partially Paid"; // matches invoiceModel enum value
  }

  next();
});

module.exports = mongoose.model("Payment", paymentSchema);