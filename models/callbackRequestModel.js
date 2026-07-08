const mongoose = require("mongoose");

const callbackRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit mobile number"],
    },
    countryCode: {
      type: String,
      default: "+91",
      trim: true,
    },
    status: {
      type: String,
      enum: ["requested", "contacted", "completed", "cancelled"],
      default: "requested",
      index: true,
    },
    source: {
      type: String,
      enum: ["doctor_profile", "other"],
      default: "doctor_profile",
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    preferredDate: {
      type: Date,
      default: null,
    },
    preferredTime: {
      type: String,
      default: "",
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "handledByModel",
      default: null,
    },
    handledByModel: {
      type: String,
      enum: ["Doctor", "Admin", null],
      default: null,
    },
    handledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

callbackRequestSchema.index({ patientId: 1, doctorId: 1, status: 1, createdAt: -1 });
callbackRequestSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("CallbackRequest", callbackRequestSchema);
