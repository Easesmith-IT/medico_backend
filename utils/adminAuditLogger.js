const AdminAuditLog = require("../models/adminAuditLogModel");

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
  req?.socket?.remoteAddress ||
  "";

const writeAdminAuditLog = async ({
  req,
  actorAdminId = null,
  actorEmail = "",
  targetAdminId = null,
  action,
  module = "admin-governance",
  severity = "MEDIUM",
  metadata = {},
}) => {
  if (!action) return null;

  return AdminAuditLog.create({
    actorAdminId,
    actorEmail,
    targetAdminId,
    action,
    module,
    severity,
    metadata,
    ipAddress: getClientIp(req),
    userAgent: req?.headers?.["user-agent"] || "",
  });
};

module.exports = {
  writeAdminAuditLog,
};
