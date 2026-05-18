const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const MedicalRecord = require("../models/medicalRecordModel");
const MedicalRecordAccessLog = require("../models/medicalRecordAccessLogModel");

const ADMIN_ROLES = new Set(["admin", "superadmin", "subadmin"]);
const getRole = (req) => String(req.user?.role || "").toLowerCase();
const getUserId = (req) => req.user?.id || req.user?._id;

const logAccess = (req, recordId, action) =>
  MedicalRecordAccessLog.create({
    recordId,
    viewerId: getUserId(req),
    viewerRole: getRole(req),
    action,
  });

const canAccessRecord = (req, record) => {
  const role = getRole(req);
  const userId = String(getUserId(req) || "");
  if (ADMIN_ROLES.has(role)) return true;
  if (role === "patient" && String(record.patientId) === userId) return true;
  if (role === "doctor" && String(record.doctorId || "") === userId) return true;
  return (record.sharedWith || []).some(
    (entry) => String(entry.userId) === userId && String(entry.role).toLowerCase() === role
  );
};

exports.createMedicalRecord = catchAsync(async (req, res, next) => {
  const role = getRole(req);
  if (!["doctor", "patient", "admin", "superadmin", "subadmin"].includes(role)) {
    return next(new AppError("Not allowed to create medical records", 403));
  }

  const payload = {
    patientId: req.body.patientId,
    doctorId: req.body.doctorId || (role === "doctor" ? getUserId(req) : null),
    bookingId: req.body.bookingId || null,
    treatmentId: req.body.treatmentId || null,
    recordType: req.body.recordType,
    title: req.body.title,
    notes: req.body.notes || "",
    files: req.body.files || [],
    visibility: req.body.visibility || "patient",
    uploadedBy: {
      userId: getUserId(req),
      role,
    },
  };

  if (role === "patient" && String(payload.patientId) !== String(getUserId(req))) {
    return next(new AppError("Patients can only create records for themselves", 403));
  }

  const record = await MedicalRecord.create(payload);
  await logAccess(req, record._id, "create");

  res.status(201).json({ success: true, data: { record } });
});

exports.getPatientRecords = catchAsync(async (req, res, next) => {
  const patientId = req.params.patientId;
  const role = getRole(req);
  if (role === "patient" && String(patientId) !== String(getUserId(req))) {
    return next(new AppError("Patients can only view their own records", 403));
  }

  const records = await MedicalRecord.find({ patientId, isDeleted: false }).sort({ createdAt: -1 });
  const allowed = records.filter((record) => canAccessRecord(req, record));
  await Promise.all(allowed.map((record) => logAccess(req, record._id, "view")));

  res.status(200).json({ success: true, data: allowed });
});

exports.getMyRecords = catchAsync(async (req, res) => {
  const role = getRole(req);
  const userId = getUserId(req);
  const filter = { isDeleted: false };
  if (role === "patient") filter.patientId = userId;
  if (role === "doctor") filter.doctorId = userId;

  const records = await MedicalRecord.find(filter).sort({ createdAt: -1 });
  const allowed = records.filter((record) => canAccessRecord(req, record));
  await Promise.all(allowed.map((record) => logAccess(req, record._id, "view")));

  res.status(200).json({ success: true, data: allowed });
});

exports.updateMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.isDeleted) return next(new AppError("Medical record not found", 404));
  if (!canAccessRecord(req, record)) return next(new AppError("Not allowed", 403));

  ["recordType", "title", "notes", "files", "visibility"].forEach((field) => {
    if (field in req.body) record[field] = req.body[field];
  });
  await record.save();
  await logAccess(req, record._id, "update");

  res.status(200).json({ success: true, data: { record } });
});

exports.shareMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.isDeleted) return next(new AppError("Medical record not found", 404));
  if (!canAccessRecord(req, record)) return next(new AppError("Not allowed", 403));

  const entries = Array.isArray(req.body.sharedWith) ? req.body.sharedWith : [req.body];
  entries.forEach((entry) => {
    if (entry.userId && entry.role && mongoose.Types.ObjectId.isValid(entry.userId)) {
      const exists = record.sharedWith.some(
        (item) => String(item.userId) === String(entry.userId) && item.role === entry.role
      );
      if (!exists) record.sharedWith.push({ userId: entry.userId, role: entry.role });
    }
  });
  record.visibility = "shared";
  await record.save();
  await logAccess(req, record._id, "share");

  res.status(200).json({ success: true, data: { record } });
});

exports.deleteMedicalRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.isDeleted) return next(new AppError("Medical record not found", 404));
  if (!canAccessRecord(req, record)) return next(new AppError("Not allowed", 403));

  record.isDeleted = true;
  await record.save();
  await logAccess(req, record._id, "delete");

  res.status(200).json({ success: true, message: "Medical record deleted successfully" });
});
