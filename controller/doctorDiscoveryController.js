const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");

const parsePage = (value) => Math.max(Number(value || 1), 1);
const parseLimit = (value) => Math.min(Math.max(Number(value || 10), 1), 100);

exports.searchDoctors = catchAsync(async (req, res) => {
  const {
    cityId,
    specialization,
    subSpecialty,
    feeMin,
    feeMax,
    ratingMin,
    availableDate,
    sort = "rating",
  } = req.query;

  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const filter = { isActive: true, verificationStatus: "approved" };

  if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
    filter.cities = new mongoose.Types.ObjectId(cityId);
  }
  if (specialization) filter.specialization = { $regex: specialization, $options: "i" };
  if (subSpecialty) filter.subSpecialties = { $regex: subSpecialty, $options: "i" };
  if (feeMin || feeMax) {
    filter.consultationFees = {};
    if (feeMin) filter.consultationFees.$gte = Number(feeMin);
    if (feeMax) filter.consultationFees.$lte = Number(feeMax);
  }
  if (ratingMin) filter.averageRating = { $gte: Number(ratingMin) };
  if (availableDate) {
    const start = new Date(availableDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter["availability.dailySlots"] = {
      $elemMatch: {
        date: { $gte: start, $lt: end },
        isAvailable: true,
        "slots.status": "available",
        "slots.isBooked": false,
        "slots.isSlotAvailable": true,
      },
    };
  }

  const sortMap = {
    rating: { averageRating: -1, totalReviews: -1, createdAt: -1 },
    feeLow: { consultationFees: 1 },
    feeHigh: { consultationFees: -1 },
    newest: { createdAt: -1 },
  };

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .select("-password -tokenVersion")
      .sort(sortMap[sort] || sortMap.rating)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: doctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.getPublicProfile = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({
    _id: req.params.id,
    isActive: true,
  })
    .select("-password -tokenVersion")
    .lean();

  if (!doctor) return next(new AppError("Doctor not found", 404));

  res.status(200).json({
    success: true,
    data: { doctor },
  });
});
