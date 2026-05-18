const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const ProfileAuditLog = require("../models/profileAuditLogModel");
const { targetRoleToModel } = require("../utils/profileAudit");

const parsePage = (value) => Math.max(Number(value || 1), 1);
const parseLimit = (value) => Math.min(Math.max(Number(value || 10), 1), 100);

exports.listProfileChanges = catchAsync(async (req, res) => {
  const {
    targetRole,
    targetId,
    from,
    to,
    actorId,
  } = req.query;
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const skip = (page - 1) * limit;
  const match = {};

  if (targetRole) match.targetModel = targetRoleToModel(targetRole);
  if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
    match.targetId = new mongoose.Types.ObjectId(targetId);
  }
  if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
    match.actorId = new mongoose.Types.ObjectId(actorId);
  }
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const [rows, total] = await Promise.all([
    ProfileAuditLog.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ProfileAuditLog.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});
