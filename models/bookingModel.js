
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
      required: true,
    },
    // treatmentStatus: {
    //   type: String,
    //   enum: ["Active", "Completed", "Cancelled","Pending"],
    //   default: "Active",
    // },

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
    sessionNumber: {
      type: Number,
      min: 1,
      required: true,
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
            // "Temporary", 
            //     "PendingPayment",
        "Pending",
        "Approved",
        "Rejected",
        "Rescheduled",
        "Cancellation Requested",
        "Cancelled",
        "In-Progress",
        "Completed",
        "TreatmentCompleted",
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

    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientAddress",
      default: null,
    },

    serviceAddressSnapshot: {
      label: { type: String, trim: true, default: "" },
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
      state: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      landmark: { type: String, trim: true, default: "" },
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

    nextBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    treatmentFlow: {
      type: Boolean,
      default: false,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    invoiceGenerated: {
      type: Boolean,
      default: false,
    },

    serviceStartedAt: {
      type: Date,
      default: null,
    },

    serviceEndedAt: {
      type: Date,
      default: null,
    },

    validTill: {
      type: Date,
      default: null,
    },

    additionalEquipment: [
      {
        name: { type: String, trim: true },
        charge: { type: Number, min: 0, default: 0 },
      },
    ],

    medicinesUsed: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory.items", default: null },
        name: { type: String, required: true, trim: true },
        categoryName: { type: String, default: "Medicine" },
        serviceCode: { type: String, default: "" },
        dosage: { type: String, default: "" },
        quantity: { type: Number, required: true }, // Can be negative for credit returns
        unitPrice: { type: Number, required: true, min: 0 },
        taxPercentage: { type: Number, default: 12 },
        total: { type: Number, required: true },
        isReturn: { type: Boolean, default: false },
        administeredAt: { type: Date, default: Date.now },
      },
    ],

    inventoryAndEquipmentUsed: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemCategory.items", default: null },
        name: { type: String, required: true, trim: true },
        categoryName: { type: String, default: "Equipment & Rentals" },
        serviceCode: { type: String, default: "" },
        type: { type: String, enum: ["Equipment", "Inventory", "Consumable"], default: "Equipment" },
        quantity: { type: Number, required: true }, // Can be negative for credit returns
        duration: { type: String, default: "1 Session" },
        unitRate: { type: Number, required: true, min: 0 },
        taxPercentage: { type: Number, default: 18 },
        total: { type: Number, required: true },
        isReturn: { type: Boolean, default: false },
        usedAt: { type: Date, default: Date.now },
      },
    ],

    sessionFinancialSnapshot: {
      serviceFee: { type: Number, default: 0 },
      medicinesTotal: { type: Number, default: 0 },
      inventoryTotal: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      netTotal: { type: Number, default: 0 },
      isBilled: { type: Boolean, default: false },
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },

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

    payNow: {
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
// bookingSchema.index({ treatmentStatus: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index(
  { servicePartnerId: 1, appointmentDate: 1, "slotTime.startTime": 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["Pending", "Approved", "In-Progress", "Confirmed"] },
      servicePartnerId: { $type: "objectId" },
    },
  }
);

// Pre-validate hook: Temporal & state integrity guard
bookingSchema.pre("validate", function (next) {
  if (this.isModified("status")) {
    const isCompletedStatus = ["Completed", "TreatmentCompleted"].includes(this.status);
    if (isCompletedStatus && this.appointmentDate && !this._bypassTemporalValidation) {
      const { getScheduledDateRange, getTodayDateStr } = require("../utils/bookingTemporalValidator");
      const { dateStr } = getScheduledDateRange(this.appointmentDate, this.slotTime);
      const todayStr = getTodayDateStr();
      if (dateStr && dateStr > todayStr) {
        return next(
          new Error(
            `Data integrity violation: Cannot save booking status as '${this.status}' for a future appointment date (${dateStr}).`
          )
        );
      }
    }
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
