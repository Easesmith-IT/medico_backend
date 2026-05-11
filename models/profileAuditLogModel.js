const mongoose = require("mongoose");

const profileAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
      trim: true,
    },
    targetModel: {
      type: String,
      enum: ["Admin", "Doctor", "Patient"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },
    changedFields: {
      type: [String],
      default: [],
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

profileAuditLogSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });
profileAuditLogSchema.index({ actorId: 1, createdAt: -1 });
profileAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ProfileAuditLog", profileAuditLogSchema);
