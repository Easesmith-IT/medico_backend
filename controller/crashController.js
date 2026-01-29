const CrashReport = require("../models/CrashReport");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");


exports.createCrashReport = catchAsync(async (req, res, next) => {
  const {
    appName,
    appVersion,
    environment,
    errorName,
    errorMessage,
    stackTrace,
    severity,
    request,
    device,
    userId,
    userType = "User",
    screenName,
  } = req.body;

  console.log("");
  console.log("CRASH REPORT - CREATE");
  console.log("=".repeat(60));

  // ----------------------------
  // Required field validation
  // ----------------------------
  // if (
  //   !appName ||
  //   !appVersion ||
  //   !environment ||
  //   !errorName ||
  //   !errorMessage ||
  //   !severity
  // ) {
  //   return next(
  //     new AppError(
  //       "Required fields: appName, appVersion, environment, errorName, errorMessage, severity",
  //       400,
  //     ),
  //   );
  // }

  console.log(`App: ${appName} (${appVersion})`);
  console.log(`Environment: ${environment}`);
  console.log(`Severity: ${severity}`);
  console.log(`UserType: ${userType}`);

  //  const errorId = crypto
  //    .createHash("sha256")
  //    .update(
  //      `${errorName || ""}|${errorMessage || ""}|${stackTrace || ""}`,
  //    )
  //    .digest("hex");

  const errorId = `ERR_${Date.now()}`;


  // ----------------------------
  // Create crash report
  // ----------------------------
  const crash = await CrashReport.create({
    appName,
    appVersion,
    environment,
    errorName,
    errorMessage,
    stackTrace,
    severity,
    screenName,
    errorId,
    source: "FRONTEND",

    request: request || {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    },

    device,
    userId: userId || null,
    userType,
  });

  console.log(`SUCCESS: Crash report saved (ID: ${crash._id})`);
  console.log("=".repeat(60));
  console.log("");

  return res.status(201).json({
    success: true,
    message: "Crash report saved successfully",
    data: {
      crashId: crash._id,
      appName: crash.appName,
      environment: crash.environment,
      severity: crash.severity,
      crashAt: crash.crashAt,
    },
  });
});


exports.getCrashReports = catchAsync(async (req, res, next) => {
  const {
    environment,
    severity,
    resolved,
    screenName,
    appName,
    userType,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "crashAt",
    sortOrder = "desc",
  } = req.query;

  // ----------------------------
  // Build Dynamic Filter
  // ----------------------------
  const filter = {};

  if (environment) filter.environment = environment;
  if (severity) filter.severity = severity;
  if (screenName) filter.screenName = screenName;
  if (appName) filter.appName = appName;
  if (userType) filter.userType = userType;

  if (resolved !== undefined) {
    filter.resolved = resolved === "true";
  }

  if (fromDate || toDate) {
    filter.crashAt = {};
    if (fromDate) filter.crashAt.$gte = new Date(fromDate);
    if (toDate) filter.crashAt.$lte = new Date(toDate);
  }

  // ----------------------------
  // Pagination & Sorting
  // ----------------------------
  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // ----------------------------
  // Query
  // ----------------------------
  const [data, total] = await Promise.all([
    CrashReport.find(filter)
      .populate("userId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CrashReport.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    message: "Crash reports fetched successfully",
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
    data,
  });
});

exports.getSingleCrashReport = catchAsync(async (req, res, next) => {
  const { crashId } = req.params;

  console.log("");
  console.log("CRASH REPORT - GET SINGLE");
  console.log("=".repeat(60));

  if (!crashId) {
    return next(new AppError("Crash report ID is required", 400));
  }

  const crash = await CrashReport.findById(crashId)
    .populate("userId", "name email")
    .lean();

  if (!crash) {
    return next(new AppError("Crash report not found", 404));
  }

  console.log(`SUCCESS: Crash report found (ID: ${crash._id})`);
  console.log("=".repeat(60));
  console.log("");

  return res.status(200).json({
    success: true,
    message: "Crash report fetched successfully",
    data: crash,
  });
});
