const mongoose = require("mongoose");

const disputeCaseSchema = new mongoose.Schema(
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
    referenceType: {
      type: String,
      enum: ["transaction", "refund", "ledger"],
      required: true,
      default: "ledger",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["Open", "UnderReview", "Resolved", "Rejected"],
      default: "Open",
      index: true,
    },
    openedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    assignedToAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisputeCase", disputeCaseSchema);

