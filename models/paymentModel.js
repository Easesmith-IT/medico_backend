const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Charge", "RefundAdjustment"],
      default: "Charge",
    },
    stage: {
      type: String,
      enum: ["Advance", "Partial", "Final"],
      required: true,
    },
    method: {
      type: String,
      enum: ["Online", "Cash", "UPI", "Card", "BankTransfer"],
      required: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

const refundSchema = new mongoose.Schema(
  {
    refundType: {
      type: String,
      enum: ["Full", "Partial"],
      required: true,
    },
    razorpayRefundId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      default: "Patient request",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processed", "Initiated", "Approved", "Rejected"],
      default: "Pending",
    },
    mode: {
      type: String,
      enum: ["Cash", "BankTransfer", "UPI", "Adjustment"],
      required: true,
    },
    referenceTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { _id: true, timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
      unique: true,
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
      ref: "ServiceProvider",
      default: null,
    },
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    totalBillAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    billBreakdown: {
      subtotal: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Refunded", "PartialRefund"],
      default: "Unpaid",
      index: true,
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    refunds: {
      type: [refundSchema],
      default: [],
    },
    lastWebhookEvent: {
      type: String,
      default: null,
      trim: true,
    },
    lastWebhookProcessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.pre("save", function (next) {
  const totalPaid = (this.transactions || [])
    .filter((item) => item.status === "Paid")
    .reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);

  const totalRefunded = (this.refunds || [])
    .filter((item) => item.status === "Processed")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  this.totalPaid = Number(totalPaid.toFixed(2));
  this.totalRefunded = Number(totalRefunded.toFixed(2));
  this.remainingBalance = Number(
    Math.max(Number(this.totalBillAmount || 0) - this.totalPaid + this.totalRefunded, 0).toFixed(2)
  );

  if (this.totalPaid <= 0 && this.totalRefunded <= 0) {
    this.paymentStatus = "Unpaid";
  } else if (this.totalRefunded > 0 && this.totalPaid - this.totalRefunded <= 0) {
    this.paymentStatus = "Refunded";
  } else if (this.totalRefunded > 0) {
    this.paymentStatus = "PartialRefund";
  } else if (this.remainingBalance === 0) {
    this.paymentStatus = "Paid";
  } else {
    this.paymentStatus = "Partially Paid";
  }

  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
