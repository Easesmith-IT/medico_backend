const mongoose = require("mongoose");

const qrPaymentIntentSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["treatment", "booking", "payment"],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amount: {
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
    provider: {
      type: String,
      default: "manual-qr",
      trim: true,
    },
    providerRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QrPaymentIntent", qrPaymentIntentSchema);
