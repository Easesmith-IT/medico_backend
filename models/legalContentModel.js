const mongoose = require("mongoose");

const legalContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["privacyPolicy", "termsAndConditions"],
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["global", "patient", "doctor", "serviceProvider"],
      default: "global",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    contentHtml: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      role: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

legalContentSchema.index({ type: 1, audience: 1 }, { unique: true });

module.exports = mongoose.model("LegalContent", legalContentSchema);
