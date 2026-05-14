const mongoose = require("mongoose");

const adminSecurityPolicySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    passwordRotationDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 365,
    },
    mfaRequiredForAdmins: {
      type: Boolean,
      default: false,
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSecurityPolicy", adminSecurityPolicySchema);
