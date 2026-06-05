const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAppointment",
      default: null,
      index: true,
    },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      default: null,
      index: true,
    },
    recordType: {
      type: String,
      enum: ["prescription", "report", "caseHistory", "other"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    files: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["private", "patient", "doctor", "shared"],
      default: "patient",
      index: true,
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        role: {
          type: String,
          enum: ["doctor", "patient", "admin", "serviceprovider"],
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    uploadedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
