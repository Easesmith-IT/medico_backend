const ProfileAuditLog = require("../models/profileAuditLogModel");

const SENSITIVE_FIELDS = new Set([
  "password",
  "tokenVersion",
  "refreshToken",
  "signupOtp",
  "signupOtpExpiry",
  "loginOtp",
  "loginOtpExpiry",
  "otp",
  "__v",
]);

const TARGET_ROLE_TO_MODEL = {
  admin: "Admin",
  superadmin: "Admin",
  superAdmin: "Admin",
  subadmin: "Admin",
  subAdmin: "Admin",
  doctor: "Doctor",
  patient: "Patient",
};

const normalizeValue = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && value._bsontype === "ObjectID") {
    return value.toString();
  }
  if (value && typeof value.toString === "function" && value._bsontype === "ObjectId") {
    return value.toString();
  }
  return value;
};

const toPlainObject = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === "function") {
    return doc.toObject({ depopulate: true, versionKey: false });
  }
  return { ...doc };
};

const sanitizeSnapshot = (doc) => {
  const plain = toPlainObject(doc);
  if (!plain) return null;

  return Object.entries(plain).reduce((snapshot, [key, value]) => {
    if (!SENSITIVE_FIELDS.has(key)) {
      snapshot[key] = value;
    }
    return snapshot;
  }, {});
};

const valuesAreEqual = (left, right) => {
  return JSON.stringify(normalizeValue(left)) === JSON.stringify(normalizeValue(right));
};

const getChangedFields = (before, after, candidateFields) => {
  const beforeSnapshot = sanitizeSnapshot(before) || {};
  const afterSnapshot = sanitizeSnapshot(after) || {};
  const fields = candidateFields && candidateFields.length
    ? candidateFields
    : Array.from(new Set([...Object.keys(beforeSnapshot), ...Object.keys(afterSnapshot)]));

  return fields.filter((field) => {
    if (SENSITIVE_FIELDS.has(field)) return false;
    return !valuesAreEqual(beforeSnapshot[field], afterSnapshot[field]);
  });
};

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const getActorId = (req) => req.user?.id || req.user?._id;

const writeProfileAuditLog = async ({
  req,
  targetModel,
  targetId,
  action,
  before,
  after,
  changedFields,
}) => {
  const actorId = getActorId(req);
  const actorRole = req.user?.role;

  if (!actorId || !actorRole) {
    throw new Error("Cannot write profile audit log without authenticated actor");
  }

  return ProfileAuditLog.create({
    actorId,
    actorRole,
    targetModel,
    targetId,
    action,
    changedFields: changedFields || getChangedFields(before, after),
    before: sanitizeSnapshot(before),
    after: sanitizeSnapshot(after),
    ip: getRequestIp(req),
    userAgent: req.get("user-agent") || req.headers["user-agent"] || null,
  });
};

const targetRoleToModel = (targetRole) => {
  if (!targetRole) return null;
  return TARGET_ROLE_TO_MODEL[targetRole] || TARGET_ROLE_TO_MODEL[targetRole.toLowerCase()] || null;
};

module.exports = {
  getChangedFields,
  sanitizeSnapshot,
  targetRoleToModel,
  writeProfileAuditLog,
};
