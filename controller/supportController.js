const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const SupportTicket = require("../models/supportTicketModel");
const SupportTicketMessage = require("../models/supportTicketMessageModel");

const ADMIN_ROLES = new Set(["admin", "superadmin", "subadmin"]);
const getRole = (req) => String(req.user?.role || "").toLowerCase();
const getUserId = (req) => req.user?.id || req.user?._id;

exports.createTicket = catchAsync(async (req, res, next) => {
  const { subject, category = "general", priority = "medium", message, attachments = [] } = req.body;
  if (!subject) return next(new AppError("subject is required", 400));

  const ticket = await SupportTicket.create({
    createdBy: getUserId(req),
    createdByRole: getRole(req),
    subject,
    category,
    priority,
    lastActivityAt: new Date(),
  });

  if (message) {
    await SupportTicketMessage.create({
      ticketId: ticket._id,
      senderId: getUserId(req),
      senderRole: getRole(req),
      message,
      attachments,
    });
  }

  res.status(201).json({ success: true, data: { ticket } });
});

exports.getMyTickets = catchAsync(async (req, res) => {
  const tickets = await SupportTicket.find({
    createdBy: getUserId(req),
    createdByRole: getRole(req),
  }).sort({ lastActivityAt: -1 });

  res.status(200).json({ success: true, data: tickets });
});

exports.listTickets = catchAsync(async (req, res) => {
  const match = {};
  if (req.query.status) match.status = req.query.status;
  if (req.query.priority) match.priority = req.query.priority;
  if (req.query.assignee && mongoose.Types.ObjectId.isValid(req.query.assignee)) {
    match.assigneeId = req.query.assignee;
  }

  const tickets = await SupportTicket.find(match).sort({ lastActivityAt: -1 }).lean();
  res.status(200).json({ success: true, data: tickets });
});

exports.updateTicket = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return next(new AppError("Support ticket not found", 404));

  ["priority", "status", "assigneeId", "category"].forEach((field) => {
    if (field in req.body) ticket[field] = req.body[field];
  });
  ticket.lastActivityAt = new Date();
  await ticket.save();

  res.status(200).json({ success: true, data: { ticket } });
});

exports.addMessage = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return next(new AppError("Support ticket not found", 404));

  const role = getRole(req);
  const isOwner = String(ticket.createdBy) === String(getUserId(req)) && ticket.createdByRole === role;
  if (!isOwner && !ADMIN_ROLES.has(role)) return next(new AppError("Not allowed", 403));

  const message = await SupportTicketMessage.create({
    ticketId: ticket._id,
    senderId: getUserId(req),
    senderRole: role,
    message: req.body.message,
    attachments: req.body.attachments || [],
  });

  ticket.lastActivityAt = new Date();
  await ticket.save();

  res.status(201).json({ success: true, data: { message } });
});
