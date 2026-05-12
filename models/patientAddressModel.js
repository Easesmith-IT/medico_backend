const mongoose = require("mongoose");

const patientAddressSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    pincode: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

patientAddressSchema.index({ patientId: 1 });
patientAddressSchema.index({ patientId: 1, isPrimary: 1 });

module.exports = mongoose.model("PatientAddress", patientAddressSchema);
