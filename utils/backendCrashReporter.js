const CrashReport = require("../models/CrashReport");

module.exports = async function reportBackendCrash(err, req) {
  const errorName = err.name || "Error";
  const errorMessage = err.message || "Unknown error";
  const stackTrace = err.stack || "";
  const errorId = `ERR_${Date.now()}`;

  console.log("req.user", req.user);

  try {
    await CrashReport.create({
      source: "BACKEND",

      errorId,
      errorName,
      errorMessage,
      stackTrace,

      severity: "HIGH",
      environment: process.env.NODE_ENV || "development",

      // ✅ matches schema
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: process.env.NODE_ENV === "production" ? undefined : req.body,
        headers: {
          "user-agent": req.headers["user-agent"],
          host: req.headers.host,
        },
        ip: req.ip,
      },

      // Auth context
      userId: req.user?.id || null,
      userType: (() => {
        const role = (req.user?.role || '').toLowerCase();
        if (role === 'doctor') return 'Doctor';
        if (role === 'patient') return 'Patient';
        if (['admin', 'superadmin', 'subadmin'].includes(role)) return 'Admin';
        if (role === 'serviceprovider') return 'ServiceProvider';
        if (role === 'hospital') return 'Hospital';
        if (role === 'medicalstudent') return 'MedicalStudent';
        return 'Patient'; // fallback
      })(),
    });
  } catch (e) {
    // Never crash the app because crash reporting failed
    console.error("❌ Backend crash reporting failed:", e);
  }
};
