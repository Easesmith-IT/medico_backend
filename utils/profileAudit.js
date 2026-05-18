const ProfileAuditLog = require("../models/profileAuditLogModel");

const SECRET_FIELDS = new Set([
  "password",
  "refreshToken",
  "tokenVersion",
  "signupOtp",
  "signupOtpExpiry",
  "loginOtp",
  "loginOtpExpiry",
]);

const roleToModel = (role = "") => {
  const normalized = String(role).toLowerCase().replace(/[_\s]/g, "");
  if (normalized === "doctor") return "Doctor";
  if (normalized === "patient") return "Patient";
  if (normalized === "serviceprovider") return "ServiceProvider";
  return "Admin";
};

const targetRoleToModel = (role = "") => {
  const normalized = String(role).toLowerCase().replace(/[_\s]/g, "");
  if (normalized === "doctor") return "Doctor";
  if (normalized === "patient") return "Patient";
  return "Admin";
};

const toPlain = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject({ depopulate: true });
  return { ...doc };
};

const sanitize = (value) => {
  if (!value || typeof value !== "object") return value;
  const plain = toPlain(value);
  const output = Array.isArray(plain) ? [] : {};

  Object.keys(plain).forEach((key) => {
    if (SECRET_FIELDS.has(key)) return;
    const item = plain[key];
    if (item && typeof item === "object" && !(item instanceof Date)) {
      output[key] = sanitize(item);
    } else {
      output[key] = item;
    }
  });

  return output;
};

const stableStringify = (value) => {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value);
  return JSON.stringify(value);
};

const getChangedFields = (before, after, candidateFields = []) => {
  const beforePlain = sanitize(before) || {};
  const afterPlain = sanitize(after) || {};
  const fields = candidateFields.length
    ? candidateFields
    : Array.from(new Set([...Object.keys(beforePlain), ...Object.keys(afterPlain)]));

  return fields.filter((field) => {
    if (SECRET_FIELDS.has(field)) return false;
    return stableStringify(beforePlain[field]) !== stableStringify(afterPlain[field]);
  });
};

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
  req?.socket?.remoteAddress ||
  "";

const writeProfileAudit = async ({
  req,
  actorId,
  actorRole,
  targetModel,
  targetId,
  action = "update",
  changedFields = [],
  before = null,
  after = null,
}) => {
  if (!targetModel || !targetId) return null;

  return ProfileAuditLog.create({
    actorId: actorId || req?.user?.id || req?.user?._id || null,
    actorModel: roleToModel(actorRole || req?.user?.role),
    actorRole: actorRole || req?.user?.role || "admin",
    targetModel,
    targetId,
    action,
    changedFields,
    before: sanitize(before),
    after: sanitize(after),
    ip: getClientIp(req),
    userAgent: req?.headers?.["user-agent"] || "",
  });
};

module.exports = {
  getChangedFields,
  roleToModel,
  targetRoleToModel,
  writeProfileAudit,
};
