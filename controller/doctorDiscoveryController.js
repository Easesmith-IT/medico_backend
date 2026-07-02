const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const DoctorSpecialty = require("../models/doctorSpecialtyModel");
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

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseBoolean = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

const normalizeDoctorSpecializations = (specialty) => [
  ...new Set(
    [specialty.specialization, ...(specialty.aliases || [])]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean),
  ),
];

const countDoctorsBySpecialization = async (specialties) => {
  const specializationSet = new Set();

  specialties.forEach((specialty) => {
    normalizeDoctorSpecializations(specialty).forEach((specialization) => {
      specializationSet.add(specialization);
    });
  });

  if (specializationSet.size === 0) return new Map();

  const counts = await Doctor.aggregate([
    {
      $match: {
        isActive: true,
        verificationStatus: "approved",
      },
    },
    {
      $project: {
        specializationKey: {
          $toLower: { $trim: { input: "$specialization" } },
        },
      },
    },
    {
      $match: {
        specializationKey: { $in: [...specializationSet] },
      },
    },
    {
      $group: {
        _id: "$specializationKey",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((item) => [item._id, item.count]));
};

const formatSpecialty = (specialty, countMap) => {
  const doctorCount = normalizeDoctorSpecializations(specialty).reduce(
    (total, specialization) => total + (countMap.get(specialization) || 0),
    0,
  );

  return {
    id: specialty._id,
    key: specialty.key,
    name: specialty.name,
    specialization: specialty.specialization,
    aliases: specialty.aliases || [],
    icon: specialty.icon,
    description: specialty.description || "",
    order: specialty.order,
    isActive: specialty.isActive,
    doctorCount,
    doctorsEndpoint: `/api/v1/doctor/search?specialization=${encodeURIComponent(
      specialty.specialization,
    )}`,
  };
};

const findSpecialtyByIdOrKey = async (idOrKey, includeDeleted = false) => {
  const query = mongoose.Types.ObjectId.isValid(idOrKey)
    ? { _id: idOrKey }
    : { key: String(idOrKey || "").toLowerCase() };

  if (!includeDeleted) query.isDeleted = false;

  return DoctorSpecialty.findOne(query);
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

exports.getDoctorSpecialties = catchAsync(async (req, res) => {
  const {
    includeInactive = "false",
    limit,
  } = req.query;

  const filter = { isDeleted: false };
  if (includeInactive !== "true") filter.isActive = true;

  let query = DoctorSpecialty.find(filter).sort({ order: 1, name: 1 });
  if (limit) query = query.limit(parseLimit(limit));

  const specialties = await query.lean();
  const countMap = await countDoctorsBySpecialization(specialties);

  res.status(200).json({
    success: true,
    count: specialties.length,
    data: {
      specialties: specialties.map((specialty) =>
        formatSpecialty(specialty, countMap),
      ),
    },
  });
});

exports.getDoctorSpecialtyByKey = catchAsync(async (req, res, next) => {
  const specialty = await findSpecialtyByIdOrKey(req.params.key);

  if (!specialty || !specialty.isActive) {
    return next(new AppError("Doctor specialty not found", 404));
  }

  const specialtyObject = specialty.toObject();
  const countMap = await countDoctorsBySpecialization([specialtyObject]);

  res.status(200).json({
    success: true,
    data: {
      specialty: formatSpecialty(specialtyObject, countMap),
    },
  });
});

exports.createDoctorSpecialty = catchAsync(async (req, res, next) => {
  const { name, specialization, icon, aliases, description, order, isActive } =
    req.body;
  const key = slugify(req.body.key || name);

  if (!key || !name || !specialization || !icon) {
    return next(
      new AppError("Required fields: key/name, specialization, and icon", 400),
    );
  }

  const specialty = await DoctorSpecialty.create({
    key,
    name: String(name).trim(),
    specialization: String(specialization).trim(),
    icon: String(icon).trim(),
    aliases: normalizeStringArray(aliases),
    description,
    order: order !== undefined ? Number(order) : 0,
    isActive: parseBoolean(isActive, true),
  });

  res.status(201).json({
    success: true,
    message: "Doctor specialty created successfully",
    data: { specialty },
  });
});

exports.updateDoctorSpecialty = catchAsync(async (req, res, next) => {
  const specialty = await findSpecialtyByIdOrKey(req.params.idOrKey);

  if (!specialty) {
    return next(new AppError("Doctor specialty not found", 404));
  }

  const allowedFields = [
    "name",
    "specialization",
    "icon",
    "description",
    "order",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] === undefined) return;
    specialty[field] =
      field === "isActive" ? parseBoolean(req.body[field], specialty.isActive) : req.body[field];
  });

  if (req.body.key !== undefined) {
    const nextKey = slugify(req.body.key);
    if (!nextKey) return next(new AppError("Specialty key is invalid", 400));
    specialty.key = nextKey;
  }

  if (req.body.aliases !== undefined) {
    specialty.aliases = normalizeStringArray(req.body.aliases);
  }

  await specialty.save();

  res.status(200).json({
    success: true,
    message: "Doctor specialty updated successfully",
    data: { specialty },
  });
});

exports.deleteDoctorSpecialty = catchAsync(async (req, res, next) => {
  const specialty = await findSpecialtyByIdOrKey(req.params.idOrKey);

  if (!specialty) {
    return next(new AppError("Doctor specialty not found", 404));
  }

  specialty.isActive = false;
  specialty.isDeleted = true;
  await specialty.save();

  res.status(200).json({
    success: true,
    message: "Doctor specialty deleted successfully",
  });
});

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
