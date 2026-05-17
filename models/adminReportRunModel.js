const mongoose = require("mongoose");

const adminReportRunSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminReportSchedule",
      default: null,
      index: true,
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
    format: {
      type: String,
      enum: ["csv", "json"],
      default: "csv",
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    outputFilePath: {
      type: String,
      default: "",
      trim: true,
    },
    outputFileName: {
      type: String,
      default: "",
      trim: true,
    },
    outputMimeType: {
      type: String,
      default: "",
      trim: true,
    },
    outputSizeBytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: "",
      trim: true,
    },
    triggeredByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminReportRun", adminReportRunSchema);