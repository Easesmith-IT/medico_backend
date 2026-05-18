const mongoose = require("mongoose");
const { Parser } = require("json2csv");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const Payment = require("../models/paymentModel");
const Treatment = require("../models/treatmentModel");
const Service = require("../models/serviceModel");
const Booking = require("../models/bookingModel");
const SettlementRequest = require("../models/settlementRequestModel");
const DisputeCase = require("../models/disputeCaseModel");
const AdminActionLog = require("../models/adminActionLogModel");
const payController = require("./payController");

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parsePage = (query) => Math.max(parseNumber(query.page, 1), 1);
const parseLimit = (query) =>
  Math.min(Math.max(parseNumber(query.limit, 10), 1), 200);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const objectIdOrNull = (value) =>
  mongoose.Types.ObjectId.isValid(value || "")
    ? new mongoose.Types.ObjectId(value)
    : null;

const sortDirection = (order) =>
  String(order || "desc").toLowerCase() === "asc" ? 1 : -1;

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
  req?.socket?.remoteAddress ||
  "";

const normalizeLedgerFilters = (query) => {
  const baseMatch = {};
  const treatmentMatch = {};
  const bookingMatch = {};

  if (query.paymentStatus) {
    baseMatch.paymentStatus = query.paymentStatus;
  }

  const patientId = objectIdOrNull(query.patientId);
  if (patientId) baseMatch.patientId = patientId;

  const providerId = objectIdOrNull(query.providerId);
  if (providerId) baseMatch.servicePartnerId = providerId;

  const minBill = parseNumber(query.minBill, null);
  const maxBill = parseNumber(query.maxBill, null);
  if (minBill !== null || maxBill !== null) {
    baseMatch.totalBillAmount = {};
    if (minBill !== null) baseMatch.totalBillAmount.$gte = minBill;
    if (maxBill !== null) baseMatch.totalBillAmount.$lte = maxBill;
  }

  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;
  if (fromDate || toDate) {
    baseMatch.updatedAt = {};
    if (fromDate && !Number.isNaN(fromDate.getTime())) {
      baseMatch.updatedAt.$gte = fromDate;
    }
    if (toDate && !Number.isNaN(toDate.getTime())) {
      const dateEnd = new Date(toDate);
      dateEnd.setHours(23, 59, 59, 999);
      baseMatch.updatedAt.$lte = dateEnd;
    }
  }

  const treatmentId = objectIdOrNull(query.treatmentId);
  if (treatmentId) baseMatch.treatmentId = treatmentId;

  const serviceId = objectIdOrNull(query.serviceId);
  if (serviceId) treatmentMatch.serviceId = serviceId;

  const cityId = objectIdOrNull(query.cityId);
  if (cityId) bookingMatch.city = cityId;

  return {
    baseMatch,
    treatmentMatch,
    bookingMatch,
    search: String(query.search || "").trim(),
  };
};

const getLedgerAggregationBase = (query = {}) => {
  const { baseMatch, treatmentMatch, bookingMatch, search } =
    normalizeLedgerFilters(query);

  const pipeline = [{ $match: baseMatch }];

  pipeline.push(
    {
      $lookup: {
        from: "treatments",
        localField: "treatmentId",
        foreignField: "_id",
        as: "treatment",
      },
    },
    { $unwind: { path: "$treatment", preserveNullAndEmptyArrays: true } }
  );

  if (Object.keys(treatmentMatch).length > 0) {
    pipeline.push({ $match: { "treatment.serviceId": treatmentMatch.serviceId } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "services",
        localField: "treatment.serviceId",
        foreignField: "_id",
        as: "service",
      },
    },
    { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "patients",
        localField: "patientId",
        foreignField: "_id",
        as: "patient",
      },
    },
    { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "serviceproviders",
        localField: "servicePartnerId",
        foreignField: "_id",
        as: "servicePartner",
      },
    },
    { $unwind: { path: "$servicePartner", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "bookings",
        localField: "bookingIds",
        foreignField: "_id",
        as: "bookings",
      },
    },
    {
      $addFields: {
        latestBooking: { $arrayElemAt: ["$bookings", -1] },
      },
    },
    {
      $lookup: {
        from: "cities",
        localField: "latestBooking.city",
        foreignField: "_id",
        as: "city",
      },
    },
    { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } }
  );

  if (Object.keys(bookingMatch).length > 0) {
    pipeline.push({ $match: { "latestBooking.city": bookingMatch.city } });
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    pipeline.push({
      $match: {
        $or: [
          { "patient.firstName": regex },
          { "patient.email": regex },
          { "patient.phone": regex },
          { "servicePartner.firstName": regex },
          { "servicePartner.lastName": regex },
          { "servicePartner.email": regex },
          { "servicePartner.mobile": regex },
          { "service.name": regex },
          { "city.name": regex },
          { paymentStatus: regex },
          { _id: objectIdOrNull(search) || new mongoose.Types.ObjectId("000000000000000000000000") },
        ],
      },
    });
  }

  return pipeline;
};

const getSortField = (sortBy = "updatedAt") => {
  const allowed = new Set([
    "updatedAt",
    "createdAt",
    "totalBillAmount",
    "totalPaid",
    "totalRefunded",
    "remainingBalance",
    "paymentStatus",
  ]);
  return allowed.has(sortBy) ? sortBy : "updatedAt";
};

exports.listPaymentLedgers = catchAsync(async (req, res) => {
  const page = parsePage(req.query);
  const limit = parseLimit(req.query);
  const skip = (page - 1) * limit;

  const sortBy = getSortField(req.query.sortBy);
  const sortOrder = sortDirection(req.query.sortOrder);
  const basePipeline = getLedgerAggregationBase(req.query);

  const pipeline = [
    ...basePipeline,
    {
      $project: {
        _id: 1,
        treatmentId: "$treatment._id",
        paymentStatus: 1,
        totalBillAmount: 1,
        totalPaid: 1,
        totalRefunded: 1,
        remainingBalance: 1,
        currency: 1,
        updatedAt: 1,
        createdAt: 1,
        patient: {
          _id: "$patient._id",
          firstName: "$patient.firstName",
          email: "$patient.email",
          phone: "$patient.phone",
        },
        servicePartner: {
          _id: "$servicePartner._id",
          firstName: "$servicePartner.firstName",
          lastName: "$servicePartner.lastName",
          email: "$servicePartner.email",
          mobile: "$servicePartner.mobile",
        },
        service: {
          _id: "$service._id",
          name: "$service.name",
          category: "$service.category",
        },
        city: {
          _id: "$city._id",
          name: "$city.name",
        },
        bookingCount: { $size: "$bookingIds" },
      },
    },
    {
      $facet: {
        data: [{ $sort: { [sortBy]: sortOrder } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Payment.aggregate(pipeline);
  const rows = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.status(200).json({
    success: true,
    message: "Payment ledgers fetched successfully",
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

const getAdminActor = (admin) => {
  if (!admin || typeof admin !== "object") return null;
  const firstName = String(admin.firstName || "").trim();
  const lastName = String(admin.lastName || "").trim();
  const name = `${firstName} ${lastName}`.trim() || firstName || "Admin";
  return {
    _id: admin._id,
    name,
    email: admin.email || null,
  };
};

const computePaymentHealth = (payment, settlementSummary) => {
  const totalBill = Number(payment?.totalBillAmount || 0);
  const totalPaid = Number(payment?.totalPaid || 0);
  const totalRefunded = Number(payment?.totalRefunded || 0);
  const remainingBalance = Number(payment?.remainingBalance || 0);
  const netPaid = Math.max(totalPaid - totalRefunded, 0);
  const completionPercentage =
    totalBill > 0 ? Math.min(Math.round((netPaid / totalBill) * 100), 100) : 0;
  const dueRatio = totalBill > 0 ? remainingBalance / totalBill : 0;
  const outstandingRisk =
    remainingBalance <= 0
      ? "Low"
      : dueRatio > 0.5
        ? "High"
        : dueRatio > 0.2
          ? "Medium"
          : "Low";

  return {
    completionPercentage,
    outstandingRisk,
    dues: remainingBalance,
    settlementPending:
      settlementSummary?.status === "Pending" ||
      settlementSummary?.status === "Approved",
  };
};

const buildPaymentTimeline = (payment, settlementSummary) => {
  const timeline = [];

  timeline.push({
    type: "ledger",
    title: "Ledger created",
    description: "Payment ledger initialized for treatment billing.",
    timestamp: payment.createdAt,
    actor: null,
  });

  (payment.transactions || []).forEach((tx) => {
    timeline.push({
      type: "transaction",
      title: `${tx.stage || "Payment"} transaction ${String(tx.status || "Pending").toLowerCase()}`,
      description: `${tx.method || "Unknown"} • ₹${Number(tx.amountPaid || 0).toFixed(2)}`,
      timestamp: tx.paidAt || tx.createdAt,
      actor: getAdminActor(tx.collectedBy),
    });
  });

  (payment.refunds || []).forEach((refund) => {
    timeline.push({
      type: "refund",
      title: `${refund.refundType || "Refund"} refund ${String(refund.status || "Pending").toLowerCase()}`,
      description: `${refund.mode || "Unknown"} • ₹${Number(refund.amount || 0).toFixed(2)}${
        refund.reason ? ` • ${refund.reason}` : ""
      }`,
      timestamp: refund.refundedAt || refund.createdAt,
      actor: getAdminActor(refund.approvedBy) || getAdminActor(refund.adminId),
    });
  });

  if (payment.lastWebhookEvent || payment.lastWebhookProcessedAt) {
    timeline.push({
      type: "webhook",
      title: "Webhook processed",
      description: payment.lastWebhookEvent || "Payment gateway event processed.",
      timestamp: payment.lastWebhookProcessedAt || payment.updatedAt,
      actor: null,
    });
  }

  if (settlementSummary?._id) {
    timeline.push({
      type: "settlement",
      title: `Settlement ${String(settlementSummary.status || "Pending").toLowerCase()}`,
      description: `Requested ₹${Number(
        settlementSummary.amountRequested || 0
      ).toFixed(2)}`,
      timestamp: settlementSummary.paidAt || settlementSummary.updatedAt || settlementSummary.createdAt,
      actor:
        getAdminActor(settlementSummary.reviewedByAdminId) ||
        getAdminActor(settlementSummary.requestedByAdminId),
    });
  }

  timeline.push({
    type: "status",
    title: `Ledger status: ${payment.paymentStatus || "Unknown"}`,
    description: "Latest ledger status update.",
    timestamp: payment.updatedAt,
    actor: null,
  });

  return timeline
    .filter((event) => event.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

exports.getPaymentLedgerDetail = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return next(new AppError("Invalid payment ID format", 400));
  }

  const payment = await Payment.findById(paymentId)
    .select(
      "_id treatmentId patientId servicePartnerId bookingIds invoiceId currency totalBillAmount totalPaid totalRefunded remainingBalance billBreakdown paymentStatus transactions refunds lastWebhookEvent lastWebhookProcessedAt createdAt updatedAt"
    )
    .populate("patientId", "firstName lastName email phone profilePhoto")
    .populate("servicePartnerId", "firstName lastName email mobile profilePhoto")
    .populate("treatmentId", "serviceId status startDate endDate currentBookingId")
    .populate("bookingIds", "appointmentDate status city pricing slotTime serviceId")
    .populate("invoiceId", "invoiceNumber issuedAt invoiceUrl isInvoiceGenerated totals")
    .populate("transactions.collectedBy", "firstName lastName email")
    .populate("refunds.adminId", "firstName lastName email")
    .populate("refunds.approvedBy", "firstName lastName email")
    .lean();

  if (!payment) {
    return next(new AppError("Payment ledger not found", 404));
  }

  const bookingCityIds = (payment.bookingIds || [])
    .map((b) => b.city)
    .filter(Boolean);

  const cityMap = {};
  if (bookingCityIds.length > 0) {
    const cities = await mongoose
      .model("City")
      .find({ _id: { $in: bookingCityIds } })
      .select("_id name")
      .lean();
    cities.forEach((city) => {
      cityMap[String(city._id)] = { _id: city._id, name: city.name };
    });
  }

  let service = null;
  if (payment.treatmentId?.serviceId) {
    service = await Service.findById(payment.treatmentId.serviceId)
      .select("name category image")
      .lean();
  }

  const settlementSummary = await SettlementRequest.findOne({ paymentId })
    .sort({ createdAt: -1 })
    .populate("requestedByAdminId", "firstName lastName email")
    .populate("reviewedByAdminId", "firstName lastName email")
    .lean();

  const paymentHealth = computePaymentHealth(payment, settlementSummary);
  const timeline = buildPaymentTimeline(payment, settlementSummary);

  res.status(200).json({
    success: true,
    message: "Payment ledger detail fetched successfully",
    data: {
      ...payment,
      service,
      paymentHealth,
      settlementSummary,
      timeline,
      bookingSummaries: (payment.bookingIds || []).map((booking) => ({
        _id: booking._id,
        appointmentDate: booking.appointmentDate,
        status: booking.status,
        slotTime: booking.slotTime,
        pricing: booking.pricing,
        serviceId: booking.serviceId,
        city: booking.city ? cityMap[String(booking.city)] || booking.city : null,
      })),
    },
  });
});

const listTransactionsCore = async (query) => {
  const page = parsePage(query);
  const limit = parseLimit(query);
  const skip = (page - 1) * limit;

  const basePipeline = getLedgerAggregationBase(query);
  const status = query.status ? String(query.status) : null;
  const method = query.method ? String(query.method) : null;
  const stage = query.stage ? String(query.stage) : null;

  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;

  const pipeline = [
    ...basePipeline,
    { $unwind: "$transactions" },
  ];

  const txMatch = {};
  if (status) txMatch["transactions.status"] = status;
  if (method) txMatch["transactions.method"] = method;
  if (stage) txMatch["transactions.stage"] = stage;
  if (
    fromDate &&
    !Number.isNaN(fromDate.getTime()) &&
    toDate &&
    !Number.isNaN(toDate.getTime())
  ) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    txMatch["transactions.createdAt"] = { $gte: fromDate, $lte: end };
  } else if (fromDate && !Number.isNaN(fromDate.getTime())) {
    txMatch["transactions.createdAt"] = { $gte: fromDate };
  } else if (toDate && !Number.isNaN(toDate.getTime())) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    txMatch["transactions.createdAt"] = { $lte: end };
  }

  if (Object.keys(txMatch).length > 0) pipeline.push({ $match: txMatch });

  pipeline.push(
    {
      $project: {
        _id: 0,
        transactionId: "$transactions._id",
        paymentId: "$_id",
        treatmentId: "$treatment._id",
        patient: {
          _id: "$patient._id",
          firstName: "$patient.firstName",
          email: "$patient.email",
          phone: "$patient.phone",
        },
        servicePartner: {
          _id: "$servicePartner._id",
          firstName: "$servicePartner.firstName",
          lastName: "$servicePartner.lastName",
        },
        amountPaid: "$transactions.amountPaid",
        method: "$transactions.method",
        stage: "$transactions.stage",
        status: "$transactions.status",
        currency: "$transactions.currency",
        razorpayOrderId: "$transactions.razorpayOrderId",
        razorpayPaymentId: "$transactions.razorpayPaymentId",
        paidAt: "$transactions.paidAt",
        createdAt: "$transactions.createdAt",
        note: "$transactions.note",
      },
    },
    {
      $facet: {
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await Payment.aggregate(pipeline);
  const rows = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

exports.listTransactions = catchAsync(async (req, res) => {
  const result = await listTransactionsCore(req.query);
  res.status(200).json({
    success: true,
    message: "Transactions fetched successfully",
    ...result,
  });
});

const listRefundsCore = async (query) => {
  const page = parsePage(query);
  const limit = parseLimit(query);
  const skip = (page - 1) * limit;
  const basePipeline = getLedgerAggregationBase(query);

  const status = query.status ? String(query.status) : null;
  const mode = query.mode ? String(query.mode) : null;
  const refundType = query.refundType ? String(query.refundType) : null;
  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;

  const pipeline = [...basePipeline, { $unwind: "$refunds" }];

  const refundMatch = {};
  if (status) refundMatch["refunds.status"] = status;
  if (mode) refundMatch["refunds.mode"] = mode;
  if (refundType) refundMatch["refunds.refundType"] = refundType;
  if (
    fromDate &&
    !Number.isNaN(fromDate.getTime()) &&
    toDate &&
    !Number.isNaN(toDate.getTime())
  ) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    refundMatch["refunds.createdAt"] = { $gte: fromDate, $lte: end };
  } else if (fromDate && !Number.isNaN(fromDate.getTime())) {
    refundMatch["refunds.createdAt"] = { $gte: fromDate };
  } else if (toDate && !Number.isNaN(toDate.getTime())) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    refundMatch["refunds.createdAt"] = { $lte: end };
  }

  if (Object.keys(refundMatch).length > 0) pipeline.push({ $match: refundMatch });

  pipeline.push(
    {
      $project: {
        _id: 0,
        refundId: "$refunds._id",
        paymentId: "$_id",
        treatmentId: "$treatment._id",
        patient: {
          _id: "$patient._id",
          firstName: "$patient.firstName",
          email: "$patient.email",
          phone: "$patient.phone",
        },
        servicePartner: {
          _id: "$servicePartner._id",
          firstName: "$servicePartner.firstName",
          lastName: "$servicePartner.lastName",
        },
        amount: "$refunds.amount",
        status: "$refunds.status",
        mode: "$refunds.mode",
        refundType: "$refunds.refundType",
        reason: "$refunds.reason",
        note: "$refunds.note",
        refundedAt: "$refunds.refundedAt",
        createdAt: "$refunds.createdAt",
      },
    },
    {
      $facet: {
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await Payment.aggregate(pipeline);
  const rows = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

exports.listRefunds = catchAsync(async (req, res) => {
  const result = await listRefundsCore(req.query);
  res.status(200).json({
    success: true,
    message: "Refunds fetched successfully",
    ...result,
  });
});

exports.adminManualCollection = catchAsync(async (req, res) =>
  payController.recordManualPayment(req, res)
);

exports.adminManualRefund = catchAsync(async (req, res) =>
  payController.recordManualRefund(req, res)
);

exports.createSettlementRequest = catchAsync(async (req, res, next) => {
  const { paymentId, treatmentId, servicePartnerId, amountRequested, notes = "" } =
    req.body;

  if (!paymentId || !treatmentId || !servicePartnerId) {
    return next(
      new AppError("paymentId, treatmentId and servicePartnerId are required", 400)
    );
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) return next(new AppError("Payment ledger not found", 404));

  const requested = parseNumber(amountRequested, NaN);
  if (!Number.isFinite(requested) || requested <= 0) {
    return next(new AppError("A valid amountRequested is required", 400));
  }

  const available = Math.max(
    Number(payment.totalPaid || 0) - Number(payment.totalRefunded || 0),
    0
  );
  if (requested > available) {
    return next(
      new AppError("amountRequested exceeds available payable balance", 400)
    );
  }

  const created = await SettlementRequest.create({
    paymentId,
    treatmentId,
    servicePartnerId,
    amountRequested: requested,
    amountApproved: 0,
    status: "Pending",
    requestedByAdminId: req.user?.id,
    notes,
  });

  res.status(201).json({
    success: true,
    message: "Settlement request created successfully",
    data: created,
  });
});

exports.listSettlementRequests = catchAsync(async (req, res) => {
  const page = parsePage(req.query);
  const limit = parseLimit(req.query);
  const skip = (page - 1) * limit;
  const match = {};

  if (req.query.status) {
    const normalized =
      String(req.query.status).charAt(0).toUpperCase() +
      String(req.query.status).slice(1).toLowerCase();
    match.status = { $in: [req.query.status, normalized, String(req.query.status).toLowerCase()] };
  }
  const providerId = objectIdOrNull(req.query.providerId);
  if (providerId) match.servicePartnerId = providerId;
  const paymentId = objectIdOrNull(req.query.paymentId);
  if (paymentId) match.paymentId = paymentId;

  const [rows, total] = await Promise.all([
    SettlementRequest.find(match)
      .populate("servicePartnerId", "firstName lastName email mobile")
      .populate("paymentId", "paymentStatus totalBillAmount totalPaid totalRefunded")
      .populate("treatmentId", "status serviceId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SettlementRequest.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    message: "Settlement requests fetched successfully",
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.updateSettlementStatus = catchAsync(async (req, res, next) => {
  const settlementId = req.params.settlementId || req.params.id;
  const actionStatusMap = {
    approve: "Approved",
    reject: "Rejected",
    "mark-paid": "Paid",
    markPaid: "Paid",
  };
  const rawStatus = req.body.status || actionStatusMap[req.body.action];
  const status = rawStatus
    ? String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1).toLowerCase()
    : rawStatus;
  const { amountApproved, payoutReference = "", notes = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(settlementId)) {
    return next(new AppError("Invalid settlement ID format", 400));
  }

  const settlement = await SettlementRequest.findById(settlementId);
  if (!settlement) return next(new AppError("Settlement request not found", 404));
  const before = settlement.toObject();
  const currentStatus =
    String(settlement.status || "Pending").charAt(0).toUpperCase() +
    String(settlement.status || "Pending").slice(1).toLowerCase();

  const transitions = {
    Pending: new Set(["Approved", "Rejected"]),
    Approved: new Set(["Paid"]),
    Rejected: new Set([]),
    Paid: new Set([]),
  };

  if (!status || !transitions[currentStatus]?.has(status)) {
    return next(
      new AppError(
        `Invalid settlement status transition: ${settlement.status} -> ${status}`,
        400
      )
    );
  }

  if (status === "Approved") {
    const approved = parseNumber(amountApproved, NaN);
    if (!Number.isFinite(approved) || approved <= 0) {
      return next(new AppError("A valid amountApproved is required", 400));
    }
    if (approved > settlement.amountRequested) {
      return next(
        new AppError("amountApproved cannot exceed amountRequested", 400)
      );
    }
    settlement.amountApproved = approved;
  }

  if (status === "Paid") {
    if (!payoutReference) {
      return next(new AppError("payoutReference is required for Paid status", 400));
    }
    settlement.paidAt = new Date();
    settlement.payoutReference = payoutReference;
    const payment = settlement.paymentId ? await Payment.findById(settlement.paymentId) : null;
    if (payment) {
      payment.lastWebhookEvent = "SETTLEMENT_PAID";
      payment.lastWebhookProcessedAt = new Date();
      await payment.save();
    }
  }

  settlement.status = status;
  settlement.reviewedByAdminId = req.user?.id || settlement.reviewedByAdminId;
  settlement.reviewedBy = req.user?.id || settlement.reviewedBy;
  settlement.reviewedAt = new Date();
  if (notes) settlement.notes = notes;

  await settlement.save();
  await AdminActionLog.create({
    adminId: req.user?.id || req.user?._id,
    actionType: "payments.settlement.update",
    entityType: "SettlementRequest",
    entityId: settlement._id,
    before,
    after: settlement.toObject(),
    reason: notes,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "",
  });

  res.status(200).json({
    success: true,
    message: "Settlement status updated successfully",
    data: settlement,
  });
});

exports.createDisputeCase = catchAsync(async (req, res, next) => {
  const {
    paymentId,
    treatmentId,
    referenceType = "ledger",
    referenceId = null,
    category = "General",
    description,
    assignedToAdminId = null,
    evidenceUrls = [],
  } = req.body;

  if (!paymentId || !treatmentId || !description) {
    return next(
      new AppError("paymentId, treatmentId and description are required", 400)
    );
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) return next(new AppError("Payment ledger not found", 404));

  const created = await DisputeCase.create({
    paymentId,
    treatmentId,
    referenceType,
    referenceId,
    category,
    description,
    status: "Open",
    openedByAdminId: req.user?.id,
    assignedToAdminId,
    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
  });

  res.status(201).json({
    success: true,
    message: "Dispute case created successfully",
    data: created,
  });
});

exports.listDisputes = catchAsync(async (req, res) => {
  const page = parsePage(req.query);
  const limit = parseLimit(req.query);
  const skip = (page - 1) * limit;
  const match = {};

  if (req.query.status) match.status = req.query.status;
  if (req.query.category) match.category = req.query.category;
  const paymentId = objectIdOrNull(req.query.paymentId);
  if (paymentId) match.paymentId = paymentId;

  const [rows, total] = await Promise.all([
    DisputeCase.find(match)
      .populate("paymentId", "paymentStatus totalBillAmount totalPaid totalRefunded")
      .populate("treatmentId", "status serviceId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DisputeCase.countDocuments(match),
  ]);

  res.status(200).json({
    success: true,
    message: "Disputes fetched successfully",
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.updateDisputeStatus = catchAsync(async (req, res, next) => {
  const { disputeId } = req.params;
  const {
    status,
    resolution = "",
    assignedToAdminId = null,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    return next(new AppError("Invalid dispute ID format", 400));
  }

  const dispute = await DisputeCase.findById(disputeId);
  if (!dispute) return next(new AppError("Dispute case not found", 404));

  const transitions = {
    Open: new Set(["UnderReview", "Resolved", "Rejected"]),
    UnderReview: new Set(["Resolved", "Rejected"]),
    Resolved: new Set([]),
    Rejected: new Set([]),
  };

  if (!status || !transitions[dispute.status]?.has(status)) {
    return next(
      new AppError(
        `Invalid dispute status transition: ${dispute.status} -> ${status}`,
        400
      )
    );
  }

  dispute.status = status;
  if (assignedToAdminId !== null) dispute.assignedToAdminId = assignedToAdminId;
  if (status === "Resolved" || status === "Rejected") {
    dispute.resolution = resolution || dispute.resolution;
    dispute.resolvedAt = new Date();
  }
  await dispute.save();

  res.status(200).json({
    success: true,
    message: "Dispute status updated successfully",
    data: dispute,
  });
});

exports.getPaymentsSummary = catchAsync(async (_req, res) => {
  const [ledgerSummary] = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalLedgers: { $sum: 1 },
        totalBillAmount: { $sum: "$totalBillAmount" },
        totalPaid: { $sum: "$totalPaid" },
        totalRefunded: { $sum: "$totalRefunded" },
        totalRemaining: { $sum: "$remainingBalance" },
        unpaidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Unpaid"] }, 1, 0] },
        },
        partialPaidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Partially Paid"] }, 1, 0] },
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] },
        },
        partialRefundCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PartialRefund"] }, 1, 0] },
        },
        refundedCount: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Refunded"] }, 1, 0] },
        },
      },
    },
  ]);

  const [settlementSummary, disputeSummary] = await Promise.all([
    SettlementRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] } },
          amountRequested: { $sum: "$amountRequested" },
          amountApproved: { $sum: "$amountApproved" },
        },
      },
    ]),
    DisputeCase.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] } },
          underReview: {
            $sum: { $cond: [{ $eq: ["$status", "UnderReview"] }, 1, 0] },
          },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,
    message: "Payments summary fetched successfully",
    data: {
      ledger: ledgerSummary || {
        totalLedgers: 0,
        totalBillAmount: 0,
        totalPaid: 0,
        totalRefunded: 0,
        totalRemaining: 0,
        unpaidCount: 0,
        partialPaidCount: 0,
        paidCount: 0,
        partialRefundCount: 0,
        refundedCount: 0,
      },
      settlement: settlementSummary[0] || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0,
        amountRequested: 0,
        amountApproved: 0,
      },
      dispute: disputeSummary[0] || {
        total: 0,
        open: 0,
        underReview: 0,
        resolved: 0,
        rejected: 0,
      },
    },
  });
});

const toCsv = (rows, fields) => {
  const parser = new Parser({ fields });
  return parser.parse(rows);
};

exports.exportPaymentsData = catchAsync(async (req, res, next) => {
  const type = String(req.query.type || "ledgers").toLowerCase();
  const query = { ...req.query, page: 1, limit: 10000 };

  let rows = [];
  let fields = [];

  if (type === "ledgers") {
    const { data } = await (async () => {
      const page = 1;
      const limit = 10000;
      const base = getLedgerAggregationBase(query);
      const pipeline = [
        ...base,
        {
          $project: {
            paymentId: "$_id",
            treatmentId: "$treatment._id",
            patientName: "$patient.firstName",
            patientPhone: "$patient.phone",
            providerName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$servicePartner.firstName", ""] },
                    " ",
                    { $ifNull: ["$servicePartner.lastName", ""] },
                  ],
                },
              },
            },
            serviceName: "$service.name",
            cityName: "$city.name",
            paymentStatus: "$paymentStatus",
            totalBillAmount: "$totalBillAmount",
            totalPaid: "$totalPaid",
            totalRefunded: "$totalRefunded",
            remainingBalance: "$remainingBalance",
            updatedAt: "$updatedAt",
          },
        },
        { $sort: { updatedAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];
      return { data: await Payment.aggregate(pipeline) };
    })();
    rows = data;
    fields = Object.keys(rows[0] || {
      paymentId: "",
      treatmentId: "",
      patientName: "",
      patientPhone: "",
      providerName: "",
      serviceName: "",
      cityName: "",
      paymentStatus: "",
      totalBillAmount: "",
      totalPaid: "",
      totalRefunded: "",
      remainingBalance: "",
      updatedAt: "",
    });
  } else if (type === "transactions") {
    const result = await listTransactionsCore(query);
    rows = result.data;
    fields = Object.keys(rows[0] || {
      transactionId: "",
      paymentId: "",
      treatmentId: "",
      amountPaid: "",
      method: "",
      stage: "",
      status: "",
      currency: "",
      createdAt: "",
    });
  } else if (type === "refunds") {
    const result = await listRefundsCore(query);
    rows = result.data;
    fields = Object.keys(rows[0] || {
      refundId: "",
      paymentId: "",
      treatmentId: "",
      amount: "",
      status: "",
      mode: "",
      refundType: "",
      createdAt: "",
    });
  } else if (type === "settlements") {
    rows = await SettlementRequest.find({})
      .populate("servicePartnerId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    rows = rows.map((item) => ({
      settlementId: item._id,
      paymentId: item.paymentId,
      treatmentId: item.treatmentId,
      servicePartnerId: item.servicePartnerId?._id || item.servicePartnerId,
      servicePartnerName: `${item.servicePartnerId?.firstName || ""} ${item.servicePartnerId?.lastName || ""}`.trim(),
      amountRequested: item.amountRequested,
      amountApproved: item.amountApproved,
      status: item.status,
      paidAt: item.paidAt,
      createdAt: item.createdAt,
    }));
    fields = Object.keys(rows[0] || {
      settlementId: "",
      paymentId: "",
      treatmentId: "",
      servicePartnerId: "",
      servicePartnerName: "",
      amountRequested: "",
      amountApproved: "",
      status: "",
      paidAt: "",
      createdAt: "",
    });
  } else if (type === "disputes") {
    rows = await DisputeCase.find({})
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    rows = rows.map((item) => ({
      disputeId: item._id,
      paymentId: item.paymentId,
      treatmentId: item.treatmentId,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      category: item.category,
      status: item.status,
      description: item.description,
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt,
    }));
    fields = Object.keys(rows[0] || {
      disputeId: "",
      paymentId: "",
      treatmentId: "",
      referenceType: "",
      referenceId: "",
      category: "",
      status: "",
      description: "",
      createdAt: "",
      resolvedAt: "",
    });
  } else {
    return next(
      new AppError(
        "Invalid export type. Use ledgers|transactions|refunds|settlements|disputes",
        400
      )
    );
  }

  const csv = toCsv(rows, fields);
  const fileName = `payments-${type}-${Date.now()}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(csv);
});
