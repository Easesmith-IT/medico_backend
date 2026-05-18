const mongoose = require("mongoose");

const settlementRequestSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
      index: true,
    },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      default: null,
      index: true,
    },
    servicePartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      default: null,
      index: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    requesterRole: {
      type: String,
      default: "",
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    amountRequested: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid", "pending", "approved", "rejected", "paid"],
      default: "Pending",
      index: true,
    },
    requestedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    payoutReference: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SettlementRequest", settlementRequestSchema);

