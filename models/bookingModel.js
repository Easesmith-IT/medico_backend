// models/bookingModel.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Patient who books
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Service booked
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    // Optional: reference service category as string (not required)
    category: {
      type: String,
      enum: ["consultation", "nursing", "equipment"],
      required: false,
    },

    // Optional: booking modes (copied from Service, not required)
    modes: [
      {
        type: String,
        enum: ["Home Service", "Visit Provider Location"],
        required: false,
      },
    ],

    // Optional: partner or provider assigned
    servicePartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor", // Or appropriate model
      default: null,
    },

    // Booking date (date part only)
    appointmentDate: {
      type: Date,
      required: true,
    },

    // Patient chosen slot time
    slotTime: {
      startTime: { type: String, required: true }, // e.g. '10:00'
      endTime: { type: String, required: true }, // e.g. '10:30'
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 30,
    },

    // Status of booking
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Rescheduled", "Cancelled"],
      default: "Pending",
    },
    statusReason: {
      type: String,
    },

    // Notes or instructions from patient
    notes: {
      type: String,
      default: "",
    },

    // Price snapshot (optional)
    pricing: {
      basePrice: Number,
      equipmentCharges: Number,
      subtotal: Number,
      taxPercentage: Number,
      taxAmount: Number,
      totalAmount: Number,
    },

    // Record who created the booking (Patient, Admin etc.)
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.userModel",
      },
      userModel: {
        type: String,
        enum: ["Patient", "Admin", "SuperAdmin"],
        default: "Patient",
      },
    },
  },
  { timestamps: true }
);

// Indexes for performance
bookingSchema.index({ serviceId: 1, appointmentDate: 1 });
bookingSchema.index({ patientId: 1, appointmentDate: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
