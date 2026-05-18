const mongoose = require("mongoose");

const supportTicketMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("SupportTicketMessage", supportTicketMessageSchema);
