const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const AdminActionLog = require("../models/adminActionLogModel");

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
  req?.socket?.remoteAddress ||
  "";

const normalizeDocs = (docs) => {
  if (!Array.isArray(docs) && docs && (docs.identityProof || docs.degreesCertificates || docs.medicalCouncilRegistration)) {
    const legacyDocs = [];
    if (docs.identityProof) legacyDocs.push({ docType: "identityProof", url: docs.identityProof.url || docs.identityProof });
    (Array.isArray(docs.degreesCertificates) ? docs.degreesCertificates : [docs.degreesCertificates])
      .filter(Boolean)
      .forEach((entry) => legacyDocs.push({ docType: "degreeCertificate", url: entry.url || entry }));
    if (docs.medicalCouncilRegistration) {
      legacyDocs.push({
        docType: "medicalCouncilRegistration",
        url: docs.medicalCouncilRegistration.url || docs.medicalCouncilRegistration,
        docNumber: docs.medicalCouncilRegistration.docNumber || docs.medicalCouncilRegistration.number || "",
      });
    }
    docs = legacyDocs;
  }
  const list = Array.isArray(docs) ? docs : [docs].filter(Boolean);
  return list.map((doc) => ({
    docType: doc.docType || doc.type || "other",
    url: doc.url || doc.documentUrl || doc.certificateUrl,
    docNumber: doc.docNumber || doc.documentNumber || doc.number || "",
    issuedAt: doc.issuedAt || doc.issueDate || null,
    expiresAt: doc.expiresAt || doc.expiryDate || null,
    status: doc.status || "pending",
    reviewedBy: doc.reviewedBy || null,
    reviewedAt: doc.reviewedAt || null,
    rejectionReason: doc.rejectionReason || "",
  })).filter((doc) => doc.url);
};

exports.uploadVerificationDocuments = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user?.id || req.user?._id);
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const docs = normalizeDocs(req.body.documents || req.body);
  if (docs.length === 0) {
    return next(new AppError("At least one verification document is required", 400));
  }

  doctor.verificationDocuments = [...(doctor.verificationDocuments || []), ...docs];
  doctor.verificationStatus = "pending";
  await doctor.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: "Verification documents uploaded successfully",
    data: { verificationDocuments: doctor.verificationDocuments },
  });
});

exports.submitVerification = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.user?.id || req.user?._id);
  if (!doctor) return next(new AppError("Doctor not found", 404));
  if (!doctor.verificationDocuments || doctor.verificationDocuments.length === 0) {
    return next(new AppError("Upload verification documents before submitting", 400));
  }

  doctor.verificationSubmittedAt = new Date();
  doctor.verificationStatus = "pending";
  await doctor.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Verification submitted successfully",
    data: { doctor },
  });
});

exports.getVerificationQueue = catchAsync(async (req, res) => {
  const status = req.query.status || "pending";
  const doctors = await Doctor.find({ verificationStatus: status })
    .select("-password -tokenVersion")
    .sort({ verificationSubmittedAt: 1, createdAt: 1 })
    .lean();

  res.status(200).json({ success: true, data: doctors });
});

exports.reviewDoctorVerification = catchAsync(async (req, res, next) => {
  const { status, documentReviews = [], verificationNotes = "", rejectionReason = "" } = req.body;
  const allowed = new Set(["approved", "rejected", "pending"]);
  if (status && !allowed.has(status)) return next(new AppError("Invalid verification status", 400));

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const before = doctor.toObject();
  const reviewsByType = new Map(documentReviews.map((doc) => [doc.docType, doc]));
  doctor.verificationDocuments = (doctor.verificationDocuments || []).map((doc) => {
    const review = reviewsByType.get(doc.docType) || {};
    if (!review.status) return doc;
    doc.status = review.status;
    doc.reviewedBy = req.user?.id || req.user?._id;
    doc.reviewedAt = new Date();
    doc.rejectionReason = review.rejectionReason || "";
    return doc;
  });
  doctor.verificationStatus = status || doctor.verificationStatus;
  doctor.verificationReviewedAt = new Date();
  doctor.verificationNotes = verificationNotes;
  doctor.rejectionReason = rejectionReason || doctor.rejectionReason;
  if (doctor.verificationStatus === "approved") doctor.verifiedAt = new Date();
  await doctor.save({ validateBeforeSave: false });

  await AdminActionLog.create({
    adminId: req.user?.id || req.user?._id,
    actionType: "doctor.verification.review",
    entityType: "Doctor",
    entityId: doctor._id,
    before,
    after: doctor.toObject(),
    reason: verificationNotes || rejectionReason,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "",
  });

  res.status(200).json({
    success: true,
    message: "Doctor verification reviewed successfully",
    data: { doctor },
  });
});

exports.getExpiringVerificationDocs = catchAsync(async (req, res) => {
  const days = Math.max(Number(req.query.days || 30), 1);
  const now = new Date();
  const until = new Date();
  until.setDate(until.getDate() + days);

  const doctors = await Doctor.find({
    verificationDocuments: {
      $elemMatch: {
        expiresAt: { $gte: now, $lte: until },
      },
    },
  })
    .select("firstName lastName email phone verificationStatus verificationDocuments")
    .lean();

  res.status(200).json({ success: true, data: doctors });
});
