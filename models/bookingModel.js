
const mongoose = require("mongoose");

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["Online", "Cash", "UPI"],
      required: true,
    },
    stage: {
      type: String,
      enum: ["Booking", "TreatmentCompletion"],
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
    paidAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    // models/bookingModel.js - Treatment document link
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
    },
    treatmentStatus: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },

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
      ref: "ServiceProvider",
      default: null,
    },

    // Booking date (date part only)
    appointmentDate: {
      type: Date,
      required: true,
    },

    // Patient chosen slot time
    slotTime: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: false },
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 30,
    },

    // Status of booking
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Rescheduled",
        "Cancelled",
        "In-Progress",
        "Completed",
        "Confirmed",
        "Started",
      ],
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
      basePrice: {
        type: Number,
        default: 0,
      },
      equipmentCharges: {
        type: Number,
        default: 0,
      },
      subtotal: {
        type: Number,
        default: 0,
      },
      taxPercentage: {
        type: Number,
        default: 0,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
    },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: false,
    },

    // Record who created the booking (Patient, Admin etc.)
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.userModel",
      },
      userModel: {
        type: String,
        enum: ["Patient", "Admin", "SuperAdmin", "ServiceProvider"],
        default: "Patient",
      },
    },

    invoiceUrl: {
      type: String,
      default: null,
    },

    // Cancellation related fields
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      maxlength: 500,
      default: null,
    },

    adminApprovalRequired: {
      type: Boolean,
      default: false,
    },

    requestedCancellationAt: {
      type: Date,
      default: null,
    },

    originalStatus: {
      type: String,
      default: null,
    },

    timeRemainingAtRequest: {
      type: Number,
      default: null,
    },

    // Add this field BEFORE closing the schema in bookingModel.js
    previousBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    isInvoiceGenerated: {
      type: Boolean,
      default: false,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },

    // -----------------------------
    // NEW OPTIONAL PARTIAL PAYMENT FIELDS
    // backward-compatible with old data
    // -----------------------------
    paymentMethod: {
      type: String,
      enum: ["None", "Online", "Cash", "UPI"],
      default: "None",
    },

    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isAdvancePaid: {
      type: Boolean,
      default: false,
    },

    isFinalPaymentDone: {
      type: Boolean,
      default: false,
    },

    lastRazorpayOrderId: {
      type: String,
      default: null,
      trim: true,
    },

    lastRazorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    paymentHistory: {
      type: [paymentEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for performance
bookingSchema.index({ serviceId: 1, appointmentDate: 1 });
bookingSchema.index({ patientId: 1, appointmentDate: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ treatmentStatus: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);