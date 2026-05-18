const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["doctor", "serviceProvider"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "pending",
      index: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ patientId: 1, bookingId: 1, targetType: 1, targetId: 1 }, { unique: true });
reviewSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
