const mongoose = require("mongoose");

const doctorAppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    previousAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAppointment",
      default: null,
    },
    nextAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAppointment",
      default: null,
    },
    sessionNumber: {
      type: Number,
      min: 1,
      default: 1,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    slotTime: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    duration: {
      type: Number,
      default: 30,
      min: 1,
    },
    serviceType: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      trim: true,
      default: "",
    },
    consultationFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
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
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      default: null,
    },
    treatmentFlow: {
      type: Boolean,
      default: false,
    },
    validTill: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.userModel",
        required: true,
      },
      userModel: {
        type: String,
        enum: ["Patient", "Doctor", "Admin", "SuperAdmin"],
        default: "Patient",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

doctorAppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
doctorAppointmentSchema.index({ patientId: 1, appointmentDate: -1 });
doctorAppointmentSchema.index({ status: 1 });
doctorAppointmentSchema.index({ previousAppointmentId: 1 });
doctorAppointmentSchema.index({
  doctorId: 1,
  appointmentDate: 1,
  "slotTime.startTime": 1,
  "slotTime.endTime": 1,
});

module.exports = mongoose.model("DoctorAppointment", doctorAppointmentSchema);
