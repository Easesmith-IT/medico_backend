const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const Service = require("../models/serviceModel");
const City = require("../models/availableCities");
const Post = require("../models/socialPostModel");
const CrashReport = require("../models/CrashReport");
const DisputeCase = require("../models/disputeCaseModel");
const SettlementRequest = require("../models/settlementRequestModel");
const AdminReportSchedule = require("../models/adminReportScheduleModel");
const AdminReportRun = require("../models/adminReportRunModel");

const REPORTS_DIR = path.join(__dirname, "..", "temp", "admin-reports");
const GRAIN_VALUES = new Set(["day", "week", "month"]);
const FREQUENCY_VALUES = new Set(["daily", "weekly", "monthly"]);
const FORMAT_VALUES = new Set(["csv", "json"]);

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const normalizeObjectId = (value, fieldName) => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} must be a valid ObjectId`, 400);
  }
  return new mongoose.Types.ObjectId(value);
};

const ensureReportsDirectory = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
};

const normalizeDateRange = (query = {}) => {
  const now = new Date();
  const parsedFrom = parseDateSafe(query.fromDate);
  const parsedTo = parseDateSafe(query.toDate);

  const toDate = endOfDay(parsedTo || now);
  const fromDefault = new Date(toDate);
  fromDefault.setDate(fromDefault.getDate() - 29);
  const fromDate = startOfDay(parsedFrom || fromDefault);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new AppError("fromDate cannot be greater than toDate", 400);
  }

  return { fromDate, toDate };
};

const normalizeGrain = (value) => {
  const grain = String(value || "day").toLowerCase();
  if (!GRAIN_VALUES.has(grain)) {
    throw new AppError("grain must be one of day|week|month", 400);
  }
  return grain;
};

const toBucketStart = (date, grain) => {
  const value = startOfDay(date);

  if (grain === "week") {
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diff);
    return startOfDay(value);
  }

  if (grain === "month") {
    value.setDate(1);
    return startOfDay(value);
  }

  return value;
};

const addBucketStep = (date, grain) => {
  const value = new Date(date);
  if (grain === "week") {
    value.setDate(value.getDate() + 7);
    return value;
  }
  if (grain === "month") {
    value.setMonth(value.getMonth() + 1);
    return value;
  }
  value.setDate(value.getDate() + 1);
  return value;
};

const formatBucketLabel = (date, grain) => {
  if (grain === "month") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
  if (grain === "week") {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const buildBuckets = ({ fromDate, toDate, grain }) => {
  const buckets = [];
  let cursor = toBucketStart(fromDate, grain);
  const end = endOfDay(toDate);

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    buckets.push({
      key,
      label: formatBucketLabel(cursor, grain),
      start: new Date(cursor),
    });
    cursor = addBucketStep(cursor, grain);
  }

  return buckets;
};

const makeSeries = (buckets) => {
  const base = {};
  buckets.forEach((bucket) => {
    base[bucket.key] = 0;
  });
  return base;
};

const incrementSeries = (seriesMap, buckets, dateValue, grain, amount = 1) => {
  if (!dateValue) return;
  const value = parseDateSafe(dateValue);
  if (!value) return;
  const key = toBucketStart(value, grain).toISOString().slice(0, 10);
  if (Object.prototype.hasOwnProperty.call(seriesMap, key)) {
    seriesMap[key] += Number(amount || 0);
  }
};

const toSeriesArray = (seriesMap, buckets, decimals = 0) =>
  buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value:
      decimals > 0
        ? Number((seriesMap[bucket.key] || 0).toFixed(decimals))
        : Math.round(seriesMap[bucket.key] || 0),
  }));

const computeNextRunAt = (fromDate = new Date(), frequency = "weekly") => {
  const next = new Date(fromDate);
  next.setSeconds(0, 0);

  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  next.setDate(next.getDate() + 7);
  return next;
};

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null);

const uniqueObjectIds = (values = []) => {
  const set = new Set();
  values.forEach((value) => {
    if (!value) return;
    set.add(String(value));
  });
  return Array.from(set).map((id) => new mongoose.Types.ObjectId(id));
};

const buildReportFilters = (query = {}) => {
  const { fromDate, toDate } = normalizeDateRange(query);
  const grain = normalizeGrain(query.grain);
  const cityId = normalizeObjectId(query.cityId, "cityId");
  const serviceId = normalizeObjectId(query.serviceId, "serviceId");

  return {
    fromDate,
    toDate,
    grain,
    cityId,
    serviceId,
  };
};

const buildCommandCenterPayload = async (query = {}) => {
  const filters = buildReportFilters(query);
  const { fromDate, toDate, grain, cityId, serviceId } = filters;

  const bookingMatch = {
    appointmentDate: { $gte: fromDate, $lte: toDate },
  };
  if (cityId) bookingMatch.city = cityId;
  if (serviceId) bookingMatch.serviceId = serviceId;

  const bookings = await Booking.find(bookingMatch)
    .select("_id patientId treatmentId status appointmentDate createdAt serviceId city")
    .lean();

  const scopedTreatmentIds = uniqueObjectIds(bookings.map((item) => item.treatmentId));
  const scopedPatientIds = uniqueObjectIds(bookings.map((item) => item.patientId));

  const paymentScopeMatch = {};
  if (scopedTreatmentIds.length > 0) {
    paymentScopeMatch.treatmentId = { $in: scopedTreatmentIds };
  } else if (cityId || serviceId) {
    paymentScopeMatch.treatmentId = { $in: [] };
  }

  const patientsMatch = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (cityId) {
    patientsMatch["address.cityId"] = cityId;
  }

  const doctorsMatch = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (cityId) doctorsMatch.cities = cityId;
  if (serviceId) doctorsMatch["services.serviceId"] = serviceId;

  const disputesRangeMatch = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (scopedTreatmentIds.length > 0) {
    disputesRangeMatch.treatmentId = { $in: scopedTreatmentIds };
  } else if (cityId || serviceId) {
    disputesRangeMatch.treatmentId = { $in: [] };
  }

  const supportDisputesMatch = {
    status: { $in: ["Open", "UnderReview"] },
  };
  if (scopedTreatmentIds.length > 0) {
    supportDisputesMatch.treatmentId = { $in: scopedTreatmentIds };
  } else if (cityId || serviceId) {
    supportDisputesMatch.treatmentId = { $in: [] };
  }

  const postMatch = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (cityId) postMatch.city = cityId;

  const crashUnresolvedMatch = {
    resolved: false,
  };

  const [patients, doctors, payments, disputes, hiddenPosts, visiblePosts, unresolvedCrashes, openDisputesCount] =
    await Promise.all([
      Patient.find(patientsMatch).select("_id createdAt").lean(),
      Doctor.find(doctorsMatch)
        .select("_id createdAt verificationStatus verifiedAt isActive")
        .lean(),
      Payment.find(paymentScopeMatch)
        .select("_id totalBillAmount totalPaid totalRefunded remainingBalance updatedAt paymentStatus treatmentId transactions refunds")
        .lean(),
      DisputeCase.find(disputesRangeMatch).select("_id createdAt status").lean(),
      Post.find({ ...postMatch, isHidden: true })
        .select("_id content doctor hiddenAt hiddenBy createdAt")
        .sort({ hiddenAt: -1, updatedAt: -1 })
        .limit(5)
        .lean(),
      Post.countDocuments({ ...postMatch, isHidden: false }),
      CrashReport.countDocuments(crashUnresolvedMatch),
      DisputeCase.countDocuments(supportDisputesMatch),
    ]);

  const settlementsMatch = {};
  const paymentIds = uniqueObjectIds(payments.map((item) => item._id));
  if (paymentIds.length > 0) {
    settlementsMatch.paymentId = { $in: paymentIds };
  } else if (cityId || serviceId) {
    settlementsMatch.paymentId = { $in: [] };
  }

  const [pendingSettlements, cancellationRequestsCount] = await Promise.all([
    SettlementRequest.find({
      ...settlementsMatch,
      status: { $in: ["Pending", "Approved"] },
    })
      .select("_id status amountRequested createdAt")
      .lean(),
    Booking.countDocuments({
      ...bookingMatch,
      status: "Cancellation Requested",
    }),
  ]);

  const buckets = buildBuckets({ fromDate, toDate, grain });
  const usersSeries = makeSeries(buckets);
  const doctorsSeries = makeSeries(buckets);
  const appointmentsSeries = makeSeries(buckets);
  const revenueSeries = makeSeries(buckets);
  const disputesSeries = makeSeries(buckets);

  patients.forEach((item) => incrementSeries(usersSeries, buckets, item.createdAt, grain, 1));
  doctors.forEach((item) => incrementSeries(doctorsSeries, buckets, item.createdAt, grain, 1));
  bookings.forEach((item) => incrementSeries(appointmentsSeries, buckets, item.appointmentDate, grain, 1));
  disputes.forEach((item) => incrementSeries(disputesSeries, buckets, item.createdAt, grain, 1));

  let paidInRange = 0;
  let refundedInRange = 0;
  let gmv = 0;
  let outstanding = 0;

  payments.forEach((payment) => {
    gmv += Number(payment.totalBillAmount || 0);
    outstanding += Number(payment.remainingBalance || 0);

    (payment.transactions || []).forEach((transaction) => {
      const isPaid = String(transaction.status || "").toLowerCase() === "paid";
      const paidAt = parseDateSafe(transaction.paidAt || transaction.createdAt);
      if (!isPaid || !paidAt) return;
      if (paidAt.getTime() < fromDate.getTime() || paidAt.getTime() > toDate.getTime()) return;

      const amount = Number(transaction.amountPaid || 0);
      paidInRange += amount;
      incrementSeries(revenueSeries, buckets, paidAt, grain, amount);
    });

    (payment.refunds || []).forEach((refund) => {
      const status = String(refund.status || "").toLowerCase();
      if (!["processed", "approved"].includes(status)) return;
      const refundedAt = parseDateSafe(refund.refundedAt || refund.createdAt);
      if (!refundedAt) return;
      if (refundedAt.getTime() < fromDate.getTime() || refundedAt.getTime() > toDate.getTime()) return;
      refundedInRange += Number(refund.amount || 0);
    });
  });

  const settlementAging = {
    "0_7": 0,
    "8_15": 0,
    "16_30": 0,
    "31_plus": 0,
  };

  pendingSettlements.forEach((item) => {
    const createdAt = parseDateSafe(item.createdAt);
    if (!createdAt) return;
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays <= 7) settlementAging["0_7"] += 1;
    else if (ageDays <= 15) settlementAging["8_15"] += 1;
    else if (ageDays <= 30) settlementAging["16_30"] += 1;
    else settlementAging["31_plus"] += 1;
  });

  const approvedDoctorsInRange = doctors.filter(
    (doctor) =>
      String(doctor.verificationStatus || "").toLowerCase() === "approved" &&
      parseDateSafe(doctor.verifiedAt) &&
      parseDateSafe(doctor.verifiedAt).getTime() >= fromDate.getTime() &&
      parseDateSafe(doctor.verifiedAt).getTime() <= toDate.getTime()
  ).length;

  const firstBookingPipeline = [
    {
      $match: {
        ...(cityId ? { city: cityId } : {}),
        ...(serviceId ? { serviceId } : {}),
      },
    },
    {
      $group: {
        _id: "$patientId",
        firstBookingDate: { $min: "$appointmentDate" },
      },
    },
    {
      $match: {
        firstBookingDate: { $gte: fromDate, $lte: toDate },
      },
    },
    { $count: "count" },
  ];

  const firstBookingResult = await Booking.aggregate(firstBookingPipeline);
  const firstBookingCount = firstBookingResult[0]?.count || 0;

  const registrationCount = patients.length;
  const approvalCount = approvedDoctorsInRange;

  const moderationRecentActions = hiddenPosts.map((post) => ({
    postId: String(post._id),
    doctorId: post.doctor ? String(post.doctor) : null,
    action: "hide",
    timestamp: post.hiddenAt || post.createdAt,
    actor: post.hiddenBy ? String(post.hiddenBy) : null,
    excerpt: String(post.content || "").slice(0, 120),
  }));

  const payload = {
    kpis: {
      users: {
        value: await Patient.countDocuments(cityId ? { isActive: true, "address.cityId": cityId } : { isActive: true }),
        periodNew: registrationCount,
      },
      doctors: {
        value: await Doctor.countDocuments({
          isActive: true,
          ...(cityId ? { cities: cityId } : {}),
          ...(serviceId ? { "services.serviceId": serviceId } : {}),
        }),
        periodNew: doctors.length,
      },
      appointments: {
        value: bookings.length,
      },
      revenue: {
        value: Number(paidInRange.toFixed(2)),
      },
      disputes: {
        value: disputes.length,
      },
    },
    trends: {
      grain,
      labels: buckets.map((item) => item.label),
      series: {
        users: toSeriesArray(usersSeries, buckets),
        doctors: toSeriesArray(doctorsSeries, buckets),
        appointments: toSeriesArray(appointmentsSeries, buckets),
        revenue: toSeriesArray(revenueSeries, buckets, 2),
        disputes: toSeriesArray(disputesSeries, buckets),
      },
    },
    funnel: {
      registration: registrationCount,
      approval: approvalCount,
      firstBooking: firstBookingCount,
      registrationToApprovalRate:
        registrationCount > 0
          ? Number(((approvalCount / registrationCount) * 100).toFixed(2))
          : 0,
      approvalToFirstBookingRate:
        approvalCount > 0
          ? Number(((firstBookingCount / approvalCount) * 100).toFixed(2))
          : 0,
    },
    moderation: {
      hiddenPosts: hiddenPosts.length,
      visiblePosts,
      recentActions: moderationRecentActions,
    },
    support: {
      openDisputes: openDisputesCount,
      unresolvedCrashes,
      cancellationRequests: cancellationRequestsCount,
    },
    finance: {
      gmv: Number(gmv.toFixed(2)),
      paid: Number(paidInRange.toFixed(2)),
      refunded: Number(refundedInRange.toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
      settlementPendingCount: pendingSettlements.length,
      settlementPendingAmount: Number(
        pendingSettlements
          .reduce((sum, item) => sum + Number(item.amountRequested || 0), 0)
          .toFixed(2)
      ),
      settlementAging,
    },
    filtersApplied: {
      fromDate: toIsoDate(fromDate),
      toDate: toIsoDate(toDate),
      cityId: cityId ? String(cityId) : null,
      serviceId: serviceId ? String(serviceId) : null,
      grain,
    },
  };

  return payload;
};

const flattenPayloadForCsv = (payload) => {
  const rows = [];

  Object.entries(payload.kpis || {}).forEach(([metric, value]) => {
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([subKey, subValue]) => {
        rows.push({
          section: "kpi",
          metric,
          key: subKey,
          value: subValue,
          label: null,
          dateKey: null,
        });
      });
    } else {
      rows.push({
        section: "kpi",
        metric,
        key: "value",
        value,
        label: null,
        dateKey: null,
      });
    }
  });

  Object.entries(payload.trends?.series || {}).forEach(([seriesKey, points]) => {
    (points || []).forEach((point) => {
      rows.push({
        section: "trend",
        metric: seriesKey,
        key: "value",
        value: point.value,
        label: point.label,
        dateKey: point.key,
      });
    });
  });

  Object.entries(payload.funnel || {}).forEach(([metric, value]) => {
    rows.push({
      section: "funnel",
      metric,
      key: "value",
      value,
      label: null,
      dateKey: null,
    });
  });

  Object.entries(payload.support || {}).forEach(([metric, value]) => {
    rows.push({
      section: "support",
      metric,
      key: "value",
      value,
      label: null,
      dateKey: null,
    });
  });

  Object.entries(payload.finance || {}).forEach(([metric, value]) => {
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([subKey, subValue]) => {
        rows.push({
          section: "finance",
          metric,
          key: subKey,
          value: subValue,
          label: null,
          dateKey: null,
        });
      });
    } else {
      rows.push({
        section: "finance",
        metric,
        key: "value",
        value,
        label: null,
        dateKey: null,
      });
    }
  });

  rows.push({
    section: "moderation",
    metric: "hiddenPosts",
    key: "value",
    value: payload.moderation?.hiddenPosts || 0,
    label: null,
    dateKey: null,
  });

  rows.push({
    section: "moderation",
    metric: "visiblePosts",
    key: "value",
    value: payload.moderation?.visiblePosts || 0,
    label: null,
    dateKey: null,
  });

  (payload.moderation?.recentActions || []).forEach((action, index) => {
    rows.push({
      section: "moderation_action",
      metric: `action_${index + 1}`,
      key: action.action,
      value: action.postId,
      label: action.excerpt || null,
      dateKey: action.timestamp ? new Date(action.timestamp).toISOString() : null,
    });
  });

  return rows;
};

const renderPayloadToBuffer = (payload, format = "csv") => {
  const normalizedFormat = String(format || "csv").toLowerCase();
  if (!FORMAT_VALUES.has(normalizedFormat)) {
    throw new AppError("format must be csv or json", 400);
  }

  if (normalizedFormat === "json") {
    const content = JSON.stringify(payload, null, 2);
    return {
      buffer: Buffer.from(content, "utf8"),
      mimeType: "application/json",
      extension: "json",
    };
  }

  const rows = flattenPayloadForCsv(payload);
  const parser = new Parser({
    fields: ["section", "metric", "key", "value", "label", "dateKey"],
  });
  const csv = parser.parse(rows);

  return {
    buffer: Buffer.from(csv, "utf8"),
    mimeType: "text/csv",
    extension: "csv",
  };
};

const runSchedule = async (schedule, triggeredByAdminId) => {
  ensureReportsDirectory();

  const run = await AdminReportRun.create({
    scheduleId: schedule._id,
    reportType: schedule.reportType,
    filters: schedule.filters || {},
    format: schedule.format,
    status: "running",
    startedAt: new Date(),
    triggeredByAdminId,
  });

  try {
    const payload = await buildCommandCenterPayload(schedule.filters || {});
    const rendered = renderPayloadToBuffer(payload, schedule.format);
    const timestamp = Date.now();
    const fileName = `command-center-${String(schedule._id)}-${timestamp}.${rendered.extension}`;
    const outputPath = path.join(REPORTS_DIR, fileName);

    fs.writeFileSync(outputPath, rendered.buffer);

    run.status = "completed";
    run.completedAt = new Date();
    run.outputFilePath = outputPath;
    run.outputFileName = fileName;
    run.outputMimeType = rendered.mimeType;
    run.outputSizeBytes = rendered.buffer.length;
    run.metadata = {
      filtersApplied: payload.filtersApplied,
      generatedAt: new Date().toISOString(),
    };
    await run.save();

    schedule.lastRunAt = new Date();
    schedule.nextRunAt = schedule.active
      ? computeNextRunAt(schedule.lastRunAt, schedule.frequency)
      : null;
    await schedule.save({ validateBeforeSave: false });

    return run;
  } catch (error) {
    run.status = "failed";
    run.completedAt = new Date();
    run.error = error?.message || "Report generation failed";
    await run.save();
    throw error;
  }
};

exports.getCommandCenterReport = catchAsync(async (req, res) => {
  const payload = await buildCommandCenterPayload(req.query || {});

  res.status(200).json({
    success: true,
    message: "Command center analytics fetched successfully",
    data: payload,
  });
});

exports.getCommandCenterFilterOptions = catchAsync(async (_req, res) => {
  const [cities, services] = await Promise.all([
    City.find({ isActive: true }).select("_id name").sort({ name: 1 }).lean(),
    Service.find({ isActive: true, isDeleted: { $ne: true } })
      .select("_id name category")
      .sort({ name: 1 })
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    message: "Command center filter options fetched successfully",
    data: {
      cities,
      services,
      grains: ["day", "week", "month"],
      formats: ["csv", "json"],
      scheduleFrequencies: ["daily", "weekly", "monthly"],
    },
  });
});

exports.exportCommandCenterReport = catchAsync(async (req, res) => {
  const payload = await buildCommandCenterPayload(req.query || {});
  const format = String(req.query.format || "csv").toLowerCase();
  const rendered = renderPayloadToBuffer(payload, format);
  const fileName = `command-center-${Date.now()}.${rendered.extension}`;

  res.setHeader("Content-Type", rendered.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.status(200).send(rendered.buffer);
});

exports.createReportSchedule = catchAsync(async (req, res, next) => {
  const {
    name,
    reportType = "command-center",
    filters = {},
    frequency = "weekly",
    format = "csv",
    active = true,
  } = req.body || {};

  if (!name || !String(name).trim()) {
    return next(new AppError("name is required", 400));
  }

  if (reportType !== "command-center") {
    return next(new AppError("reportType must be command-center", 400));
  }

  const normalizedFrequency = String(frequency).toLowerCase();
  if (!FREQUENCY_VALUES.has(normalizedFrequency)) {
    return next(new AppError("frequency must be daily|weekly|monthly", 400));
  }

  const normalizedFormat = String(format).toLowerCase();
  if (!FORMAT_VALUES.has(normalizedFormat)) {
    return next(new AppError("format must be csv|json", 400));
  }

  if (typeof filters !== "object" || Array.isArray(filters)) {
    return next(new AppError("filters must be an object", 400));
  }

  await buildCommandCenterPayload(filters);

  const schedule = await AdminReportSchedule.create({
    name: String(name).trim(),
    reportType,
    filters,
    frequency: normalizedFrequency,
    format: normalizedFormat,
    active: Boolean(active),
    nextRunAt: active ? computeNextRunAt(new Date(), normalizedFrequency) : null,
    createdByAdminId: req.user?.id,
    updatedByAdminId: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Report schedule created successfully",
    data: schedule,
  });
});

exports.listReportSchedules = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const match = {};
  if (req.query.active === "true") match.active = true;
  if (req.query.active === "false") match.active = false;

  const [schedules, total] = await Promise.all([
    AdminReportSchedule.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdByAdminId", "firstName lastName email")
      .populate("updatedByAdminId", "firstName lastName email")
      .lean(),
    AdminReportSchedule.countDocuments(match),
  ]);

  const scheduleIds = schedules.map((item) => item._id);
  const latestRuns =
    scheduleIds.length > 0
      ? await AdminReportRun.aggregate([
          { $match: { scheduleId: { $in: scheduleIds } } },
          { $sort: { startedAt: -1 } },
          {
            $group: {
              _id: "$scheduleId",
              latestRun: { $first: "$$ROOT" },
            },
          },
        ])
      : [];

  const latestRunMap = {};
  latestRuns.forEach((item) => {
    latestRunMap[String(item._id)] = item.latestRun;
  });

  const data = schedules.map((item) => ({
    ...item,
    latestRun: latestRunMap[String(item._id)] || null,
  }));

  res.status(200).json({
    success: true,
    message: "Report schedules fetched successfully",
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.updateReportSchedule = catchAsync(async (req, res, next) => {
  const { scheduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    return next(new AppError("Invalid schedule ID format", 400));
  }

  const schedule = await AdminReportSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Report schedule not found", 404));
  }

  const patch = req.body || {};

  if (patch.name !== undefined) {
    const value = String(patch.name || "").trim();
    if (!value) return next(new AppError("name cannot be empty", 400));
    schedule.name = value;
  }

  if (patch.frequency !== undefined) {
    const frequency = String(patch.frequency || "").toLowerCase();
    if (!FREQUENCY_VALUES.has(frequency)) {
      return next(new AppError("frequency must be daily|weekly|monthly", 400));
    }
    schedule.frequency = frequency;
  }

  if (patch.format !== undefined) {
    const format = String(patch.format || "").toLowerCase();
    if (!FORMAT_VALUES.has(format)) {
      return next(new AppError("format must be csv|json", 400));
    }
    schedule.format = format;
  }

  if (patch.filters !== undefined) {
    if (typeof patch.filters !== "object" || Array.isArray(patch.filters)) {
      return next(new AppError("filters must be an object", 400));
    }
    await buildCommandCenterPayload(patch.filters);
    schedule.filters = patch.filters;
  }

  if (patch.active !== undefined) {
    schedule.active = Boolean(patch.active);
  }

  schedule.updatedByAdminId = req.user?.id;

  if (schedule.active) {
    const now = new Date();
    if (!schedule.nextRunAt || schedule.nextRunAt.getTime() <= now.getTime()) {
      schedule.nextRunAt = computeNextRunAt(now, schedule.frequency);
    }
  } else {
    schedule.nextRunAt = null;
  }

  await schedule.save();

  res.status(200).json({
    success: true,
    message: "Report schedule updated successfully",
    data: schedule,
  });
});

exports.runReportSchedule = catchAsync(async (req, res, next) => {
  const { scheduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    return next(new AppError("Invalid schedule ID format", 400));
  }

  const schedule = await AdminReportSchedule.findById(scheduleId);
  if (!schedule) {
    return next(new AppError("Report schedule not found", 404));
  }

  const run = await runSchedule(schedule, req.user?.id);

  res.status(200).json({
    success: true,
    message: "Report schedule executed successfully",
    data: run,
  });
});

exports.runDueReportSchedules = catchAsync(async (req, res) => {
  const now = new Date();
  const schedules = await AdminReportSchedule.find({
    active: true,
    nextRunAt: { $lte: now },
  })
    .sort({ nextRunAt: 1 })
    .limit(50);

  const results = [];

  for (const schedule of schedules) {
    try {
      const run = await runSchedule(schedule, req.user?.id);
      results.push({
        scheduleId: String(schedule._id),
        status: "completed",
        runId: String(run._id),
      });
    } catch (error) {
      results.push({
        scheduleId: String(schedule._id),
        status: "failed",
        error: error?.message || "run failed",
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Due report schedules execution finished",
    data: {
      total: schedules.length,
      completed: results.filter((item) => item.status === "completed").length,
      failed: results.filter((item) => item.status === "failed").length,
      results,
    },
  });
});

exports.listReportRuns = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const match = {};
  if (req.query.status) match.status = req.query.status;

  if (req.query.scheduleId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.scheduleId)) {
      return next(new AppError("scheduleId must be a valid ObjectId", 400));
    }
    match.scheduleId = req.query.scheduleId;
  }

  const [rows, total] = await Promise.all([
    AdminReportRun.find(match)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("scheduleId", "name frequency active")
      .populate("triggeredByAdminId", "firstName lastName email")
      .lean(),
    AdminReportRun.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    message: "Report runs fetched successfully",
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.downloadReportRun = catchAsync(async (req, res, next) => {
  const { runId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(runId)) {
    return next(new AppError("Invalid run ID format", 400));
  }

  const run = await AdminReportRun.findById(runId).lean();
  if (!run) {
    return next(new AppError("Report run not found", 404));
  }

  if (run.status !== "completed" || !run.outputFilePath) {
    return next(new AppError("Report file is not available for this run", 400));
  }

  if (!fs.existsSync(run.outputFilePath)) {
    return next(new AppError("Report file not found on server", 404));
  }

  return res.download(run.outputFilePath, run.outputFileName || path.basename(run.outputFilePath));
});
