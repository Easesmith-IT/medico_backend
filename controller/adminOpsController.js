const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AdminActionLog = require("../models/adminActionLogModel");
const Doctor = require("../models/doctorModel");
const SettlementRequest = require("../models/settlementRequestModel");
const SupportTicket = require("../models/supportTicketModel");
const Review = require("../models/reviewModel");

exports.listAdminActionLogs = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const match = {};

  if (req.query.actorId && mongoose.Types.ObjectId.isValid(req.query.actorId)) {
    match.adminId = new mongoose.Types.ObjectId(req.query.actorId);
  }
  if (req.query.entityType) match.entityType = req.query.entityType;
  if (req.query.actionType) match.actionType = req.query.actionType;
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }

  const [rows, total] = await Promise.all([
    AdminActionLog.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AdminActionLog.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

exports.getOpsQueues = catchAsync(async (_req, res) => {
  const [
    verificationPending,
    settlementsPending,
    supportOpen,
    reviewsPending,
  ] = await Promise.all([
    Doctor.countDocuments({ verificationStatus: "pending" }),
    SettlementRequest.countDocuments({ status: { $in: ["pending", "Pending"] } }),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    Review.countDocuments({ status: "pending" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      verificationPending,
      settlementsPending,
      supportOpen,
      reviewsPending,
      totalPending: verificationPending + settlementsPending + supportOpen + reviewsPending,
    },
  });
});
