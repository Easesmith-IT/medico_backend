const mongoose = require("mongoose");

const Treatment = require("../models/treatmentModel");
const Booking = require("../models/bookingModel");
const Patient = require("../models/patientModel");
const Payment = require("../models/paymentModel");
const {
  TREATMENT_STATES,
  OPEN_BOOKING_STATUSES,
  getAllowedTreatmentActions,
  canTransitionStatus,
} = require("../utils/treatmentLifecycle");
const {
  completeTreatmentWithTransaction,
  CompletionFlowError,
} = require("../utils/treatmentCompletionService");
const {
  computeTreatmentRecommendations,
} = require("../utils/treatmentRecommendationService");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const objectIdOrNull = (value) =>
  mongoose.Types.ObjectId.isValid(value || "")
    ? new mongoose.Types.ObjectId(value)
    : null;

const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIdString = (value) => (value ? String(value) : "");

const computeListStats = ({ bookings = [], currentBookingId = null }) => {
  const currentId = toIdString(currentBookingId);
  const totalSessions = bookings.length;
  const completedSessions = bookings.filter((entry) =>
    ["Completed", "TreatmentCompleted"].includes(String(entry.status || ""))
  ).length;

  const openOtherSessions = bookings.filter((entry) => {
    const isOpen = OPEN_BOOKING_STATUSES.has(String(entry.status || ""));
    if (!isOpen) return false;
    return toIdString(entry._id) !== currentId;
  }).length;

  return {
    totalSessions,
    completedSessions,
    pendingSessions: Math.max(totalSessions - completedSessions, 0),
    progressPercentage: totalSessions
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0,
    hasOpenFutureSessions: openOtherSessions > 0,
  };
};

const baseTreatmentPopulate = [
  { path: "patientId", select: "firstName lastName phone email" },
  { path: "serviceId", select: "name category" },
  {
    path: "servicePartnerId",
    select: "firstName lastName email mobile",
  },
  {
    path: "currentBookingId",
    select:
      "_id appointmentDate status sessionNumber city servicePartnerId slotTime createdAt",
    populate: [{ path: "city", select: "name" }],
  },
  { path: "invoiceId", select: "_id invoiceNumber invoiceUrl issuedAt isInvoiceGenerated" },
];

exports.listTreatments = async (req, res) => {
  try {
    const page = Math.max(parseNumber(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseNumber(req.query.limit, 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = {};
    const {
      status,
      patientId,
      serviceId,
      servicePartnerId,
      search,
      cityId,
      validFrom,
      validTo,
      hasCurrentBooking,
      isActive,
    } = req.query;

    if (status && Object.values(TREATMENT_STATES).includes(status)) {
      filters.status = status;
    }

    const patientObjectId = objectIdOrNull(patientId);
    if (patientObjectId) filters.patientId = patientObjectId;

    const serviceObjectId = objectIdOrNull(serviceId);
    if (serviceObjectId) filters.serviceId = serviceObjectId;

    const providerObjectId = objectIdOrNull(servicePartnerId);
    if (providerObjectId) filters.servicePartnerId = providerObjectId;

    if (hasCurrentBooking === "true") {
      filters.currentBookingId = { $ne: null };
    } else if (hasCurrentBooking === "false") {
      filters.currentBookingId = null;
    }

    if (typeof isActive !== "undefined" && isActive !== "") {
      filters.isActive = isActive === "true";
    }

    const validFromDate = parseDateOrNull(validFrom);
    const validToDate = parseDateOrNull(validTo);
    if (validFromDate || validToDate) {
      filters.validTill = {};
      if (validFromDate) filters.validTill.$gte = validFromDate;
      if (validToDate) {
        validToDate.setHours(23, 59, 59, 999);
        filters.validTill.$lte = validToDate;
      }
    }

    const treatments = await Treatment.find(filters)
      .populate(baseTreatmentPopulate)
      .sort({ updatedAt: -1 })
      .lean();

    const searchText = String(search || "").trim().toLowerCase();
    const cityFilterId = toIdString(cityId);

    const filtered = treatments.filter((treatment) => {
      if (cityFilterId) {
        const bookingCityId = toIdString(treatment?.currentBookingId?.city?._id);
        if (!bookingCityId || bookingCityId !== cityFilterId) return false;
      }

      if (!searchText) return true;

      const blob = [
        treatment._id,
        treatment.status,
        treatment.patientId?.firstName,
        treatment.patientId?.lastName,
        treatment.patientId?.phone,
        treatment.patientId?.email,
        treatment.serviceId?.name,
        treatment.servicePartnerId?.firstName,
        treatment.servicePartnerId?.lastName,
      ]
        .map((item) => String(item || "").toLowerCase())
        .join(" ");

      return blob.includes(searchText);
    });

    const paginated = filtered.slice(skip, skip + limit);
    const treatmentIds = paginated.map((item) => item._id);

    const [bookings, payments] = await Promise.all([
      treatmentIds.length
        ? Booking.find({ treatmentId: { $in: treatmentIds } })
            .select("_id treatmentId status appointmentDate sessionNumber")
            .sort({ appointmentDate: 1 })
            .lean()
        : Promise.resolve([]),
      treatmentIds.length
        ? Payment.find({ treatmentId: { $in: treatmentIds } })
            .select(
              "_id treatmentId paymentStatus remainingBalance totalBillAmount totalPaid totalRefunded invoiceId"
            )
            .populate("invoiceId", "_id invoiceNumber invoiceUrl issuedAt isInvoiceGenerated")
            .lean()
        : Promise.resolve([]),
    ]);

    const bookingMap = new Map();
    for (const booking of bookings) {
      const key = toIdString(booking.treatmentId);
      if (!bookingMap.has(key)) bookingMap.set(key, []);
      bookingMap.get(key).push(booking);
    }

    const paymentMap = new Map(
      payments.map((item) => [toIdString(item.treatmentId), item])
    );

    const rows = paginated.map((treatment) => {
      const id = toIdString(treatment._id);
      const treatmentBookings = bookingMap.get(id) || [];
      const stats = computeListStats({
        bookings: treatmentBookings,
        currentBookingId: treatment.currentBookingId?._id,
      });
      const payment = paymentMap.get(id) || null;

      const allowedActions = getAllowedTreatmentActions({
        status: treatment.status,
        hasCurrentBooking: Boolean(treatment.currentBookingId?._id),
        hasOpenFutureSessions: stats.hasOpenFutureSessions,
      });

      return {
        _id: treatment._id,
        status: treatment.status,
        isActive: Boolean(treatment.isActive),
        startDate: treatment.startDate,
        endDate: treatment.endDate,
        validTill: treatment.validTill,
        updatedAt: treatment.updatedAt,
        createdAt: treatment.createdAt,
        patient: treatment.patientId || null,
        service: treatment.serviceId || null,
        provider: treatment.servicePartnerId || null,
        currentBooking: treatment.currentBookingId || null,
        sessions: {
          total: stats.totalSessions,
          completed: stats.completedSessions,
          pending: stats.pendingSessions,
        },
        progressPercentage: stats.progressPercentage,
        payment: payment
          ? {
              paymentId: payment._id,
              paymentStatus: payment.paymentStatus,
              remainingBalance: payment.remainingBalance,
              totalBillAmount: payment.totalBillAmount,
              totalPaid: payment.totalPaid,
              totalRefunded: payment.totalRefunded,
            }
          : null,
        invoice: payment?.invoiceId || treatment.invoiceId || null,
        allowedActions,
      };
    });

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalCount: filtered.length,
      totalPages: Math.max(Math.ceil(filtered.length / limit), 1),
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching admin treatments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch treatments",
      error: error.message,
    });
  }
};

exports.getTreatmentDetail = async (req, res) => {
  try {
    const { treatmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
        code: "INVALID_TREATMENT_ID",
      });
    }

    const treatment = await Treatment.findById(treatmentId)
      .populate(baseTreatmentPopulate)
      .lean();

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
        code: "TREATMENT_NOT_FOUND",
      });
    }

    const [bookings, payment, patient] = await Promise.all([
      Booking.find({ treatmentId })
        .select(
          "_id appointmentDate status sessionNumber previousBookingId nextBookingId servicePartnerId slotTime city createdAt updatedAt"
        )
        .populate("city", "name")
        .sort({ sessionNumber: 1, appointmentDate: 1 })
        .lean(),
      Payment.findOne({ treatmentId })
        .select(
          "_id paymentStatus remainingBalance totalBillAmount totalPaid totalRefunded invoiceId updatedAt"
        )
        .populate("invoiceId", "_id invoiceNumber invoiceUrl issuedAt isInvoiceGenerated")
        .lean(),
      Patient.findById(treatment.patientId)
        .select(
          "firstName lastName phone email profilePhoto bloodGroup gender dateOfBirth medicalHistory allergies currentMedications"
        )
        .lean(),
    ]);

    const currentBookingId = toIdString(treatment.currentBookingId?._id);
    const currentIndex = bookings.findIndex(
      (item) => toIdString(item._id) === currentBookingId
    );

    const previousBooking = currentIndex > 0 ? bookings[currentIndex - 1] : null;
    const nextBooking =
      currentIndex >= 0 && currentIndex < bookings.length - 1
        ? bookings[currentIndex + 1]
        : null;

    const stats = computeListStats({
      bookings,
      currentBookingId: treatment.currentBookingId?._id,
    });

    const allowedActions = getAllowedTreatmentActions({
      status: treatment.status,
      hasCurrentBooking: Boolean(treatment.currentBookingId?._id),
      hasOpenFutureSessions: stats.hasOpenFutureSessions,
    });

    const recommendations = await computeTreatmentRecommendations({
      treatment,
      bookings,
      payment,
      patient,
      allowedActions,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...treatment,
        chain: {
          previousBooking,
          currentBooking: treatment.currentBookingId || null,
          nextBooking,
          sessions: bookings,
        },
        sessions: {
          total: stats.totalSessions,
          completed: stats.completedSessions,
          pending: stats.pendingSessions,
        },
        progressPercentage: stats.progressPercentage,
        payment: payment
          ? {
              paymentId: payment._id,
              paymentStatus: payment.paymentStatus,
              remainingBalance: payment.remainingBalance,
              totalBillAmount: payment.totalBillAmount,
              totalPaid: payment.totalPaid,
              totalRefunded: payment.totalRefunded,
            }
          : null,
        invoice: payment?.invoiceId || treatment.invoiceId || null,
        allowedActions,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error fetching treatment detail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch treatment detail",
      error: error.message,
    });
  }
};

exports.updateTreatmentStatus = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { targetStatus, reason, validTill } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
        code: "INVALID_TREATMENT_ID",
      });
    }

    const treatment = await Treatment.findById(treatmentId);
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
        code: "TREATMENT_NOT_FOUND",
      });
    }

    if (!canTransitionStatus({ currentStatus: treatment.status, targetStatus })) {
      return res.status(400).json({
        success: false,
        message: `Transition not allowed from ${treatment.status} to ${targetStatus}`,
        code: "INVALID_TREATMENT_TRANSITION",
      });
    }

    if (targetStatus === TREATMENT_STATES.ACTIVE) {
      const nextValidTill = parseDateOrNull(validTill);
      if (!nextValidTill) {
        return res.status(400).json({
          success: false,
          message: "validTill is required to activate treatment",
          code: "MISSING_VALID_TILL",
        });
      }
      treatment.validTill = nextValidTill;
    }

    if (targetStatus === TREATMENT_STATES.EXPIRED && !String(reason || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required to expire treatment",
        code: "MISSING_EXPIRE_REASON",
      });
    }

    treatment.status = targetStatus;
    await treatment.save();

    return res.status(200).json({
      success: true,
      message: `Treatment moved to ${targetStatus}`,
      data: {
        _id: treatment._id,
        status: treatment.status,
        validTill: treatment.validTill,
      },
    });
  } catch (error) {
    console.error("Error updating treatment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update treatment status",
      error: error.message,
    });
  }
};

exports.completeTreatment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { equipment = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID",
        code: "INVALID_TREATMENT_ID",
      });
    }

    const treatment = await Treatment.findById(treatmentId).select(
      "_id status currentBookingId"
    );

    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment not found",
        code: "TREATMENT_NOT_FOUND",
      });
    }

    const allowedStates = [TREATMENT_STATES.ACTIVE, TREATMENT_STATES.IN_PROGRESS];
    if (!allowedStates.includes(String(treatment.status || "")) && treatment.status !== TREATMENT_STATES.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: `Complete action not allowed from ${treatment.status}`,
        code: "INVALID_TREATMENT_STATE",
      });
    }

    if (!treatment.currentBookingId) {
      return res.status(409).json({
        success: false,
        message: "Treatment has no current booking link for completion",
        code: "MISSING_CURRENT_BOOKING",
      });
    }

    const result = await completeTreatmentWithTransaction({
      bookingId: treatment.currentBookingId,
      actorId: req.user?.id || null,
      equipment,
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyCompleted
        ? "Treatment already completed"
        : "Treatment completed successfully",
      data: {
        alreadyCompleted: Boolean(result.alreadyCompleted),
        treatmentId,
        bookingId: result.booking?._id || treatment.currentBookingId,
        invoiceId: result.invoice?._id || result.booking?.invoiceId || null,
        status: result.treatment?.status || TREATMENT_STATES.COMPLETED,
      },
    });
  } catch (error) {
    if (error instanceof CompletionFlowError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    console.error("Error completing treatment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete treatment",
      error: error.message,
    });
  }
};
