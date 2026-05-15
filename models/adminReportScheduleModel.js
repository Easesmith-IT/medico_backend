const mongoose = require("mongoose");

const adminReportScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    reportType: {
      type: String,
      enum: ["command-center"],
      default: "command-center",
      index: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
      default: "weekly",
    },
    format: {
      type: String,
      enum: ["csv", "json"],
      default: "csv",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminReportSchedule", adminReportScheduleSchema);