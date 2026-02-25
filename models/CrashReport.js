const mongoose = require("mongoose");

const crashReportSchema = new mongoose.Schema(
  {
    // Application info
    appName: {
      type: String,
      trim: true,
    },

    appVersion: {
      type: String,
    },

    environment: {
      type: String,
      enum: ["development", "staging", "production"],
    },

    // Crash details
    errorName: {
      type: String,
    },

    errorId: {
      type: String,
      index: true,
    },

    source: {
      type: String,
      enum: ["FRONTEND", "BACKEND"],
      default: "BACKEND",
    },

    errorMessage: {
      type: String,
    },

    stackTrace: {
      type: String,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    // Request context
    request: {
      method: String,
      url: String,
      headers: Object,
      body: Object,
      params: Object,
      query: Object,
      ip: String,
    },

    // Device / Client info
    device: {
      platform: String,
      os: String,
      osVersion: String,
      deviceModel: String,
      browser: String,
    },

    // User (optional)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType",
      default: null,
    },

    userType: {
      type: String,
      enum: [
        "Doctor",
        "Patient",
        "Admin",
        "Hospital",
        "ServiceProvider",
        "MedicalStudent",
      ],
      default: "Patient",
    },

    // Crash occurrence time
    crashAt: {
      type: Date,
      default: Date.now, // stores date + time
      index: true,
    },

    // Status tracking
    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
    },

    screenName: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt still available
  },
);

module.exports = mongoose.model("CrashReport", crashReportSchema);
