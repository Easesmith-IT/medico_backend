const bcrypt = require("bcryptjs");

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Admin = require("../models/adminModel");
const AdminSession = require("../models/adminSessionModel");
const AdminAuditLog = require("../models/adminAuditLogModel");
const AdminSecurityPolicy = require("../models/adminSecurityPolicyModel");
const {
  generateMfaSecret,
  generateTotpCode,
  verifyTotpCode,
  hashToken,
} = require("../utils/adminSecurity");
const {
  resolveRequestRefreshToken,
  revokeAllAdminSessions,
  revokeSessionByRefreshToken,
} = require("../utils/adminSessionService");
const { writeAdminAuditLog } = require("../utils/adminAuditLogger");

const normalizeRole = (role = "") =>
  String(role || "")
    .toLowerCase()
    .replace(/[_\s]/g, "");

const getMe = async (req) => {
  const adminId = req.user?.id || req.user?._id;
  if (!adminId) throw new AppError("Unauthorized", 401);
  const admin = await Admin.findById(adminId).select(
    "+password +mfaSecret firstName lastName email role status isActive permissions mfaEnabled mfaVerifiedAt passwordChangedAt tokenVersion"
  );
  if (!admin) throw new AppError("Admin not found", 404);
  return admin;
};

exports.getMySessions = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const sessions = await AdminSession.find({ adminId: admin._id })
    .sort({ lastSeenAt: -1, createdAt: -1 })
    .lean();

  const currentRefresh = resolveRequestRefreshToken(req);
  const currentHash = currentRefresh ? hashToken(currentRefresh) : "";

  res.status(200).json({
    success: true,
    results: sessions.length,
    data: sessions.map((session) => ({
      _id: session._id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrentSession: currentHash && session.refreshTokenHash === currentHash,
      revokedAt: session.revokedAt,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
    })),
  });
});

exports.revokeMySessionById = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const session = await AdminSession.findOne({
    _id: req.params.sessionId,
    adminId: admin._id,
  });

  if (!session) {
    return next(new AppError("Session not found", 404));
  }

  session.revokedAt = new Date();
  session.isCurrent = false;
  await session.save();

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.session.revoke.one",
    severity: "MEDIUM",
    metadata: { sessionId: String(session._id) },
  });

  res.status(200).json({
    success: true,
    message: "Session revoked successfully",
  });
});

exports.revokeMyAllSessions = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const currentRefresh = resolveRequestRefreshToken(req);
  const currentHash = currentRefresh ? hashToken(currentRefresh) : null;
  const currentSession = currentHash
    ? await AdminSession.findOne({ adminId: admin._id, refreshTokenHash: currentHash }).select("_id")
    : null;

  const updateResult = await revokeAllAdminSessions(admin._id, currentSession?._id || null);

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.session.revoke.all",
    severity: "HIGH",
    metadata: { modifiedCount: updateResult.modifiedCount || 0 },
  });

  res.status(200).json({
    success: true,
    message: "All other sessions revoked successfully",
    data: {
      modifiedCount: updateResult.modifiedCount || 0,
    },
  });
});

exports.forceLogoutSubAdmin = catchAsync(async (req, res, next) => {
  const actor = await getMe(req);
  const target = await Admin.findById(req.params.id).select(
    "+tokenVersion role email firstName lastName"
  );
  if (!target) {
    return next(new AppError("Admin not found", 404));
  }

  if (String(target._id) === String(actor._id)) {
    return next(new AppError("You cannot force logout your own account", 403));
  }

  if (normalizeRole(target.role) === "superadmin") {
    return next(new AppError("Force logout is restricted for superAdmin accounts", 403));
  }

  target.tokenVersion = (target.tokenVersion || 0) + 1;
  await target.save({ validateBeforeSave: false });
  const sessionResult = await revokeAllAdminSessions(target._id);

  await writeAdminAuditLog({
    req,
    actorAdminId: actor._id,
    actorEmail: actor.email,
    targetAdminId: target._id,
    action: "admin.session.force-logout",
    severity: "HIGH",
    metadata: { modifiedCount: sessionResult.modifiedCount || 0 },
  });

  res.status(200).json({
    success: true,
    message: "Target admin has been logged out from all devices",
    data: {
      targetAdminId: target._id,
      revokedSessions: sessionResult.modifiedCount || 0,
    },
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return next(new AppError("currentPassword and newPassword are required", 400));
  }

  if (String(newPassword).length < 8) {
    return next(new AppError("New password must be at least 8 characters", 400));
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, admin.password);
  if (!isCurrentValid) {
    return next(new AppError("Current password is incorrect", 400));
  }

  admin.password = await bcrypt.hash(newPassword, 10);
  admin.passwordChangedAt = new Date();
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();

  await revokeAllAdminSessions(admin._id);
  await revokeSessionByRefreshToken(resolveRequestRefreshToken(req));

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.profile.password.update",
    severity: "CRITICAL",
  });

  res.status(200).json({
    success: true,
    message: "Password updated successfully. Please login again.",
  });
});

exports.setupMfa = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);

  const secret = generateMfaSecret();
  admin.mfaSecret = secret;
  admin.mfaEnabled = false;
  admin.mfaVerifiedAt = null;
  await admin.save({ validateBeforeSave: false });

  const previewCode = generateTotpCode(secret);

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.mfa.setup",
    severity: "HIGH",
  });

  res.status(200).json({
    success: true,
    message: "MFA secret generated. Verify OTP to enable MFA.",
    data: {
      secret,
      algorithm: "TOTP-SHA1",
      digits: 6,
      periodSeconds: 30,
      otpPreviewForTesting: previewCode,
    },
  });
});

exports.verifyMfa = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const { otp } = req.body || {};

  if (!otp) {
    return next(new AppError("OTP is required", 400));
  }

  if (!admin.mfaSecret) {
    return next(new AppError("MFA setup not initialized", 400));
  }

  const isValid = verifyTotpCode(admin.mfaSecret, otp);
  if (!isValid) {
    return next(new AppError("Invalid OTP", 400));
  }

  admin.mfaEnabled = true;
  admin.mfaVerifiedAt = new Date();
  await admin.save({ validateBeforeSave: false });

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.mfa.verify",
    severity: "HIGH",
  });

  res.status(200).json({
    success: true,
    message: "MFA enabled successfully",
    data: {
      mfaEnabled: true,
      mfaVerifiedAt: admin.mfaVerifiedAt,
    },
  });
});

exports.disableMfa = catchAsync(async (req, res, next) => {
  const admin = await getMe(req);
  const { otp } = req.body || {};

  const policy = await AdminSecurityPolicy.findOne({ key: "global" }).lean();
  if (policy?.mfaRequiredForAdmins) {
    return next(new AppError("MFA is enforced by security policy", 400));
  }

  if (admin.mfaEnabled) {
    if (!otp || !verifyTotpCode(admin.mfaSecret, otp)) {
      return next(new AppError("Valid OTP is required to disable MFA", 400));
    }
  }

  admin.mfaEnabled = false;
  admin.mfaSecret = "";
  admin.mfaVerifiedAt = null;
  await admin.save({ validateBeforeSave: false });

  await writeAdminAuditLog({
    req,
    actorAdminId: admin._id,
    actorEmail: admin.email,
    targetAdminId: admin._id,
    action: "admin.mfa.disable",
    severity: "HIGH",
  });

  res.status(200).json({
    success: true,
    message: "MFA disabled successfully",
  });
});

exports.updateSecurityPolicy = catchAsync(async (req, res, next) => {
  const actor = await getMe(req);
  const role = normalizeRole(actor.role);
  if (role !== "superadmin") {
    return next(new AppError("Only superAdmin can update security policy", 403));
  }

  const { passwordRotationDays, mfaRequiredForAdmins } = req.body || {};

  const update = {};
  if (passwordRotationDays !== undefined) {
    const days = Number(passwordRotationDays);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      return next(new AppError("passwordRotationDays must be between 1 and 365", 400));
    }
    update.passwordRotationDays = days;
  }
  if (mfaRequiredForAdmins !== undefined) {
    update.mfaRequiredForAdmins = Boolean(mfaRequiredForAdmins);
  }
  update.updatedByAdminId = actor._id;

  const policy = await AdminSecurityPolicy.findOneAndUpdate(
    { key: "global" },
    { $set: update, $setOnInsert: { key: "global" } },
    { upsert: true, new: true, runValidators: true }
  );

  await writeAdminAuditLog({
    req,
    actorAdminId: actor._id,
    actorEmail: actor.email,
    action: "admin.security-policy.update",
    severity: "CRITICAL",
    metadata: update,
  });

  res.status(200).json({
    success: true,
    message: "Security policy updated successfully",
    data: policy,
  });
});

exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    action,
    severity,
    actorAdminId,
    fromDate,
    toDate,
  } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (severity) filter.severity = severity;
  if (actorAdminId) filter.actorAdminId = actorAdminId;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
  const skip = (pageNumber - 1) * limitNumber;

  const logs = await AdminAuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  const count = await AdminAuditLog.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: logs.length,
    pagination: {
      total: count,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(count / limitNumber),
    },
    data: logs,
  });
});

exports.exportAuditLogs = catchAsync(async (req, res, next) => {
  const { action, severity, actorAdminId, fromDate, toDate } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (severity) filter.severity = severity;
  if (actorAdminId) filter.actorAdminId = actorAdminId;
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const logs = await AdminAuditLog.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const rows = logs.map((item) => ({
    id: String(item._id),
    createdAt: item.createdAt,
    actorAdminId: item.actorAdminId ? String(item.actorAdminId) : "",
    actorEmail: item.actorEmail || "",
    targetAdminId: item.targetAdminId ? String(item.targetAdminId) : "",
    action: item.action,
    module: item.module,
    severity: item.severity,
    ipAddress: item.ipAddress || "",
    userAgent: item.userAgent || "",
    metadata: JSON.stringify(item.metadata || {}),
  }));

  res.status(200).json({
    success: true,
    message: "Audit export generated",
    data: {
      total: rows.length,
      rows,
    },
  });
});
