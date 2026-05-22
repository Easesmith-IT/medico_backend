const mongoose = require("mongoose");

const socialNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["patient"],
      default: "patient",
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["doctor"],
      default: "doctor",
    },
    type: {
      type: String,
      enum: ["doctor_post_created"],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["Post"],
      default: "Post",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

socialNotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("SocialNotification", socialNotificationSchema);
