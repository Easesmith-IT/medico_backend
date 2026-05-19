const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");
const Review = require("../models/reviewModel");
const Doctor = require("../models/doctorModel");
const ServiceProvider = require("../models/serviceProviderModel");

const APPROVED = "approved";
const getUserId = (req) => req.user?.id || req.user?._id;

const normalizeTargetType = (targetType = "") => {
  const normalized = String(targetType).trim();
  if (normalized === "servicePartner") return "serviceProvider";
  return normalized;
};

const getTargetModel = (targetType) =>
  targetType === "doctor" ? Doctor : targetType === "serviceProvider" ? ServiceProvider : null;

const recalculateAggregate = async (targetType, targetId) => {
  const Model = getTargetModel(targetType);
  if (!Model) return;

  const [result] = await Review.aggregate([
    { $match: { targetType, targetId: new mongoose.Types.ObjectId(targetId), status: APPROVED } },
    { $group: { _id: "$targetId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  await Model.findByIdAndUpdate(targetId, {
    averageRating: result ? Number(result.averageRating.toFixed(2)) : 0,
    totalReviews: result ? result.totalReviews : 0,
  });
};

exports.createReview = catchAsync(async (req, res, next) => {
  const { bookingId, targetId, rating, comment = "" } = req.body;
  const targetType = normalizeTargetType(req.body.targetType);
  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new AppError("Booking not found", 404));
  if (!getTargetModel(targetType)) {
    return next(new AppError("targetType must be doctor or serviceProvider", 400));
  }
  if (String(booking.patientId) !== String(getUserId(req))) {
    return next(new AppError("Only the booking patient can review", 403));
  }
  if (!["Completed", "TreatmentCompleted"].includes(booking.status)) {
    return next(new AppError("Only completed bookings can be reviewed", 400));
  }

  const review = await Review.create({
    patientId: getUserId(req),
    bookingId,
    targetType,
    targetId,
    rating,
    comment,
  });

  res.status(201).json({ success: true, data: { review } });
});

exports.listReviews = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const match = {};
  if (req.query.targetType) match.targetType = normalizeTargetType(req.query.targetType);
  if (req.query.targetId && mongoose.Types.ObjectId.isValid(req.query.targetId)) {
    match.targetId = new mongoose.Types.ObjectId(req.query.targetId);
  }

  const [rows, total] = await Promise.all([
    Review.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError("Review not found", 404));
  if (String(review.patientId) !== String(getUserId(req))) return next(new AppError("Not allowed", 403));

  if (req.body.rating != null) review.rating = req.body.rating;
  if (req.body.comment != null) review.comment = req.body.comment;
  review.status = "pending";
  review.moderatedBy = null;
  review.moderatedAt = null;
  await review.save();
  await recalculateAggregate(review.targetType, review.targetId);

  res.status(200).json({ success: true, data: { review } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError("Review not found", 404));
  if (String(review.patientId) !== String(getUserId(req))) return next(new AppError("Not allowed", 403));

  const { targetType, targetId } = review;
  await review.deleteOne();
  await recalculateAggregate(targetType, targetId);

  res.status(200).json({ success: true, message: "Review deleted successfully" });
});

exports.moderateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError("Review not found", 404));
  if (!["pending", "approved", "rejected", "hidden"].includes(req.body.status)) {
    return next(new AppError("Invalid review status", 400));
  }

  review.status = req.body.status;
  review.moderatedBy = getUserId(req);
  review.moderatedAt = new Date();
  await review.save();
  await recalculateAggregate(review.targetType, review.targetId);

  res.status(200).json({ success: true, data: { review } });
});
