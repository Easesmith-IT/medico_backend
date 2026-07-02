const mongoose = require("mongoose");

const doctorSpecialtySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Specialty key is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Specialty key can only contain lowercase letters, numbers, and hyphens"],
    },
    name: {
      type: String,
      required: [true, "Specialty name is required"],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, "Doctor specialization is required"],
      trim: true,
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    icon: {
      type: String,
      required: [true, "Specialty icon key is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

doctorSpecialtySchema.index({ isDeleted: 1, isActive: 1, order: 1 });
doctorSpecialtySchema.index({ name: 1 });

module.exports =
  mongoose.models.DoctorSpecialty ||
  mongoose.model("DoctorSpecialty", doctorSpecialtySchema);
