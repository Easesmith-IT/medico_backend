const mongoose = require("mongoose");

const settlementRequestSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
      index: true,
    },
    servicePartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
      index: true,
    },
    amountRequested: {
      type: Number,
      required: true,
      min: 0,
    },
    amountApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid"],
      default: "Pending",
      index: true,
    },
    requestedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    reviewedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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

