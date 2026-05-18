const mongoose = require("mongoose");

const profileAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "actorModel",
      default: null,
      index: true,
    },
    actorModel: {
      type: String,
      enum: ["Admin", "Doctor", "Patient", "ServiceProvider"],
      default: "Admin",
    },
    actorRole: {
      type: String,
      required: true,
      index: true,
    },
    targetModel: {
      type: String,
      enum: ["Admin", "Doctor", "Patient"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetModel",
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
      index: true,
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
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

profileAuditLogSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });
profileAuditLogSchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.model("ProfileAuditLog", profileAuditLogSchema);
