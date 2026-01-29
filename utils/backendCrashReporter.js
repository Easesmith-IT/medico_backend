const CrashReport = require("../models/CrashReport");

module.exports = async function reportBackendCrash(err, req) {
  try {
    await CrashReport.create({
      source: "backend",

      errorName: err.name,
      errorMessage: err.message,
      stackTrace: err.stack,

      // Request context
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,

      // ⚠️ optional: sanitize body in prod
      body: process.env.NODE_ENV === "production" ? undefined : req.body,

      headers: {
        "user-agent": req.headers["user-agent"],
        host: req.headers.host,
      },

      // Auth context (if available)
      userId: req.user?._id,
      userType: req.user?.role,

      environment: process.env.NODE_ENV,
      severity: "HIGH",

      createdAt: new Date(),
    });
  } catch (e) {
    // Never crash the app because crash reporting failed
    console.error("❌ Backend crash reporting failed:", e);
  }
};
