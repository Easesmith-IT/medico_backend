const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    createdByRole: {
      type: String,
      enum: ["patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
