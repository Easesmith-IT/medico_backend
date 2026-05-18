const mongoose = require("mongoose");

const medicalRecordAccessLogSchema = new mongoose.Schema(
  {
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: true,
      index: true,
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    viewerRole: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "view", "update", "share", "delete"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("MedicalRecordAccessLog", medicalRecordAccessLogSchema);
