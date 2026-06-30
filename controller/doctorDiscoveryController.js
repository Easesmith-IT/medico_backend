const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Service = require("../models/serviceModel");
const Treatment = require("../models/treatmentModel");

const parsePage = (value) => Math.max(Number(value || 1), 1);
const parseLimit = (value) => Math.min(Math.max(Number(value || 10), 1), 100);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeStringArray = (value) => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .flatMap((item) => String(item || "").split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const buildRecommendationFilter = (query = {}) => {
  const filter = { isActive: true, verificationStatus: "approved" };

  if (query.cityId && mongoose.Types.ObjectId.isValid(query.cityId)) {
    filter.cities = new mongoose.Types.ObjectId(query.cityId);
  }
  if (query.ratingMin) filter.averageRating = { $gte: Number(query.ratingMin) };
  if (query.availableDate) {
    const start = new Date(query.availableDate);
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

  return filter;
};

const getDoctorsForStep = async (baseFilter, stepFilter, limit, excludedIds = []) => {
  const filter = { ...baseFilter, ...stepFilter };
  if (excludedIds.length > 0) filter._id = { $nin: excludedIds };

  return Doctor.find(filter)
    .select("-password -tokenVersion -verificationDocuments")
    .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

const getRecommendedDoctorsForService = async (service, reqQuery = {}) => {
  const limit = parseLimit(reqQuery.limit || 5);
  const baseFilter = buildRecommendationFilter(reqQuery);
  const recommendedSpecializations = normalizeStringArray(
    service.recommendedSpecializations,
  );
  const recommendedSubSpecialties = normalizeStringArray(
    service.recommendedSubSpecialties,
  );

  const steps = [];
  if (recommendedSpecializations.length > 0) {
    steps.push({
      matchedBy: "specialization",
      filter: {
        $or: recommendedSpecializations.map((specialization) => ({
          specialization: {
            $regex: `^${escapeRegex(specialization)}$`,
            $options: "i",
          },
        })),
      },
    });
  }

  steps.push({
    matchedBy: "linkedService",
    filter: { services: service._id },
  });

  if (recommendedSubSpecialties.length > 0) {
    steps.push({
      matchedBy: "subSpecialty",
      filter: {
        $or: recommendedSubSpecialties.map((subSpecialty) => ({
          subSpecialties: {
            $regex: `^${escapeRegex(subSpecialty)}$`,
            $options: "i",
          },
        })),
      },
    });
  }

  steps.push({
    matchedBy: "topRatedFallback",
    filter: {},
  });

  const doctors = [];
  const seenIds = [];
  const matchedBy = [];

  for (const step of steps) {
    if (doctors.length >= limit) break;
    const stepDoctors = await getDoctorsForStep(
      baseFilter,
      step.filter,
      limit - doctors.length,
      seenIds,
    );

    if (stepDoctors.length > 0) {
      matchedBy.push(step.matchedBy);
      stepDoctors.forEach((doctor) => {
        doctors.push({ ...doctor, recommendationMatchedBy: step.matchedBy });
        seenIds.push(doctor._id);
      });
    }
  }

  return {
    doctors,
    meta: {
      serviceId: service._id,
      serviceName: service.name,
      recommendedSpecializations,
      recommendedSubSpecialties,
      matchedBy,
      fallbackUsed: matchedBy.includes("topRatedFallback"),
    },
  };
};

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

exports.getRecommendedDoctorsByService = catchAsync(async (req, res, next) => {
  const { serviceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError("Invalid service ID format", 400));
  }

  const service = await Service.findOne({
    _id: serviceId,
    isActive: true,
    isDeleted: { $ne: true },
  }).lean();

  if (!service) return next(new AppError("Service not found", 404));

  const { doctors, meta } = await getRecommendedDoctorsForService(
    service,
    req.query,
  );

  res.status(200).json({
    success: true,
    results: doctors.length,
    data: { doctors, recommendation: meta },
  });
});

exports.getRecommendedDoctorsByTreatment = catchAsync(async (req, res, next) => {
  const { treatmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
    return next(new AppError("Invalid treatment ID format", 400));
  }

  const treatment = await Treatment.findById(treatmentId)
    .populate(
      "serviceId",
      "name category recommendedSpecializations recommendedSubSpecialties isActive isDeleted",
    )
    .lean();

  if (!treatment) return next(new AppError("Treatment not found", 404));
  if (!treatment.serviceId || treatment.serviceId.isDeleted) {
    return next(new AppError("Treatment service not found", 404));
  }

  const { doctors, meta } = await getRecommendedDoctorsForService(
    treatment.serviceId,
    req.query,
  );

  res.status(200).json({
    success: true,
    results: doctors.length,
    data: {
      doctors,
      recommendation: {
        ...meta,
        treatmentId: treatment._id,
      },
    },
  });
});
