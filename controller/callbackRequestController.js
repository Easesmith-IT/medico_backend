const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const CallbackRequest = require("../models/callbackRequestModel");
const Doctor = require("../models/doctorModel");

const ADMIN_ROLES = new Set(["admin", "superadmin", "subadmin"]);

const getUserId = (req) => req.user?.id || req.user?._id;
const getRole = (req) => String(req.user?.role || "").toLowerCase().replace(/[_\s]/g, "");

const normalizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

const populateRequest = (query) =>
  query
    .populate("patientId", "firstName lastName phone email profilePhoto")
    .populate("doctorId", "firstName lastName phone email specialization profilePhoto consultationFees averageRating");

exports.createCallbackRequest = catchAsync(async (req, res, next) => {
  const patientId = getUserId(req);
  const { doctorId, phone, countryCode = "+91", note = "", preferredDate, preferredTime = "" } = req.body;

  if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Valid doctorId is required", 400));
  }

  const normalizedPhone = normalizePhone(phone);
  if (!/^[0-9]{10}$/.test(normalizedPhone)) {
    return next(new AppError("Please provide a valid 10-digit mobile number", 400));
  }

  const doctor = await Doctor.findById(doctorId).select("_id isActive").lean();
  if (!doctor) return next(new AppError("Doctor not found", 404));
  if (doctor.isActive === false) return next(new AppError("Doctor is not active", 400));

  const callbackRequest = await CallbackRequest.create({
    patientId,
    doctorId,
    phone: normalizedPhone,
    countryCode,
    note,
    preferredDate: preferredDate || null,
    preferredTime,
    source: "doctor_profile",
  });

  const populatedRequest = await populateRequest(
    CallbackRequest.findById(callbackRequest._id)
  );

  res.status(201).json({
    success: true,
    message: "Call back request submitted successfully",
    data: { callbackRequest: populatedRequest },
  });
});

exports.getMyCallbackRequests = catchAsync(async (req, res) => {
  const callbackRequests = await populateRequest(
    CallbackRequest.find({ patientId: getUserId(req) }).sort({ createdAt: -1 })
  );

  res.status(200).json({
    success: true,
    count: callbackRequests.length,
    data: { callbackRequests },
  });
});

exports.getDoctorCallbackRequests = catchAsync(async (req, res, next) => {
  const role = getRole(req);
  const doctorId = req.params.doctorId || getUserId(req);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Valid doctorId is required", 400));
  }

  if (role === "doctor" && String(doctorId) !== String(getUserId(req))) {
    return next(new AppError("Not allowed to view callback requests for this doctor", 403));
  }

  const filter = { doctorId };
  if (req.query.status) filter.status = req.query.status;

  const callbackRequests = await populateRequest(
    CallbackRequest.find(filter).sort({ createdAt: -1 })
  );

  res.status(200).json({
    success: true,
    count: callbackRequests.length,
    data: { callbackRequests },
  });
});

exports.getAllCallbackRequests = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.doctorId && mongoose.Types.ObjectId.isValid(req.query.doctorId)) {
    filter.doctorId = req.query.doctorId;
  }
  if (req.query.patientId && mongoose.Types.ObjectId.isValid(req.query.patientId)) {
    filter.patientId = req.query.patientId;
  }

  const callbackRequests = await populateRequest(
    CallbackRequest.find(filter).sort({ createdAt: -1 })
  );

  res.status(200).json({
    success: true,
    count: callbackRequests.length,
    data: { callbackRequests },
  });
});

exports.updateCallbackRequestStatus = catchAsync(async (req, res, next) => {
  const role = getRole(req);
  const { status, note } = req.body;
  const allowedStatuses = ["requested", "contacted", "completed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return next(new AppError("Invalid callback request status", 400));
  }

  const callbackRequest = await CallbackRequest.findById(req.params.id);
  if (!callbackRequest) return next(new AppError("Call back request not found", 404));

  if (role === "doctor" && String(callbackRequest.doctorId) !== String(getUserId(req))) {
    return next(new AppError("Not allowed to update this callback request", 403));
  }

  callbackRequest.status = status;
  if (note !== undefined) callbackRequest.note = note;
  callbackRequest.handledBy = getUserId(req);
  callbackRequest.handledByModel = ADMIN_ROLES.has(role) ? "Admin" : "Doctor";
  callbackRequest.handledAt = new Date();

  await callbackRequest.save();

  const populatedRequest = await populateRequest(
    CallbackRequest.findById(callbackRequest._id)
  );

  res.status(200).json({
    success: true,
    message: "Call back request updated successfully",
    data: { callbackRequest: populatedRequest },
  });
});
