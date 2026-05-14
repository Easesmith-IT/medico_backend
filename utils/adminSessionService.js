const AdminSession = require("../models/adminSessionModel");
const { hashToken } = require("./adminSecurity");

const getCookieToken = (req, key) => req?.cookies?.[key] || "";

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
  req?.socket?.remoteAddress ||
  "";

const createOrUpdateAdminSession = async ({ adminId, refreshToken, req }) => {
  if (!adminId || !refreshToken) return null;

  const refreshTokenHash = hashToken(refreshToken);
  const now = new Date();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const session = await AdminSession.findOneAndUpdate(
    { adminId, refreshTokenHash },
    {
      $set: {
        userAgent: req?.headers?.["user-agent"] || "",
        ipAddress: getClientIp(req),
        isCurrent: true,
        revokedAt: null,
        expiresAt,
        lastSeenAt: now,
      },
    },
    { new: true, upsert: true }
  );

  return session;
};

const touchAdminSession = async (refreshToken) => {
  if (!refreshToken) return null;
  const refreshTokenHash = hashToken(refreshToken);
  return AdminSession.findOneAndUpdate(
    { refreshTokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { lastSeenAt: new Date() } },
    { new: true }
  );
};

const isSessionActiveByRefreshToken = async (refreshToken, adminId = null) => {
  if (!refreshToken) return false;
  const refreshTokenHash = hashToken(refreshToken);
  const filter = {
    refreshTokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  };
  if (adminId) filter.adminId = adminId;

  const session = await AdminSession.findOne(filter).select("_id");
  return Boolean(session);
};

const revokeSessionByRefreshToken = async (refreshToken) => {
  if (!refreshToken) return { modifiedCount: 0 };
  const refreshTokenHash = hashToken(refreshToken);
  return AdminSession.updateMany(
    { refreshTokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), isCurrent: false } }
  );
};

const revokeAllAdminSessions = async (adminId, excludeSessionId = null) => {
  if (!adminId) return { modifiedCount: 0 };
  const filter = { adminId, revokedAt: null };
  if (excludeSessionId) filter._id = { $ne: excludeSessionId };

  return AdminSession.updateMany(filter, {
    $set: { revokedAt: new Date(), isCurrent: false },
  });
};

const resolveRequestRefreshToken = (req) => getCookieToken(req, "refreshToken");

module.exports = {
  createOrUpdateAdminSession,
  touchAdminSession,
  isSessionActiveByRefreshToken,
  revokeSessionByRefreshToken,
  revokeAllAdminSessions,
  resolveRequestRefreshToken,
};
