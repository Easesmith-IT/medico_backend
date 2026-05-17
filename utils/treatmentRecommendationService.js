const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Service = require("../models/serviceModel");
const { OPEN_BOOKING_STATUSES } = require("./treatmentLifecycle");

const toIdString = (value) => (value ? String(value) : "");

const computeSessionIntelligence = (bookings) => {
  if (!bookings.length) return { total: 0, gaps: [], adherence: "unknown", averageGapDays: null };

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
  );

  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].appointmentDate);
    const curr = new Date(sorted[i].appointmentDate);
    const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
    gaps.push(diffDays);
  }

  const averageGapDays = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;

  const completed = sorted.filter((b) =>
    ["Completed", "TreatmentCompleted"].includes(String(b.status))
  ).length;

  const adherence =
    sorted.length < 2 ? "insufficient_data"
    : completed === sorted.length ? "on_track"
    : completed >= sorted.length / 2 ? "moderate"
    : "behind";

  return { total: sorted.length, gaps, adherence, averageGapDays };
};

const computeRiskAssessment = ({
  treatment,
  bookings,
  payment,
  now,
}) => {
  const risks = [];

  const validTill = treatment.validTill ? new Date(treatment.validTill) : null;
  if (validTill) {
    const daysLeft = Math.ceil((validTill - now) / (24 * 60 * 60 * 1000));
    if (daysLeft < 0) risks.push({ type: "expired", severity: "high", message: "Treatment validity has expired" });
    else if (daysLeft <= 3) risks.push({ type: "near_expiry", severity: "high", message: `Treatment expires in ${daysLeft} day(s)` });
    else if (daysLeft <= 7) risks.push({ type: "near_expiry", severity: "medium", message: `Treatment expires in ${daysLeft} day(s)` });
  }

  const openBookings = bookings.filter((b) => OPEN_BOOKING_STATUSES.has(String(b.status)));
  if (openBookings.length > 0) {
    risks.push({ type: "open_sessions", severity: "medium", message: `${openBookings.length} session(s) still open` });
  }

  if (payment) {
    const outstanding = Number(payment.remainingBalance || 0);
    if (outstanding > 0) {
      risks.push({ type: "outstanding_balance", severity: outstanding > 5000 ? "high" : "medium", message: `Outstanding balance of ${outstanding}` });
    }
  }

  const completed = bookings.filter((b) =>
    ["Completed", "TreatmentCompleted"].includes(String(b.status))
  ).length;
  const total = bookings.length || 1;
  const completionPct = Math.round((completed / total) * 100);

  if (completionPct < 100 && treatment.status !== "Completed") {
    const stuckBookings = bookings.filter((b) =>
      ["Pending", "Approved"].includes(String(b.status))
    );
    if (stuckBookings.length > 0) {
      risks.push({ type: "stalled", severity: "high", message: `${stuckBookings.length} booking(s) stalled in "${stuckBookings[0].status}" state` });
    }
  }

  return risks;
};

const buildActionRecommendations = ({
  treatment,
  bookings,
  payment,
  allowedActions,
  riskAssessment,
  now,
}) => {
  const actions = [];

  if (allowedActions.includes("activate")) {
    actions.push({ key: "activate_treatment", severity: "high", message: "Treatment is inactive. Activate to begin validity.", cta: "Activate Now" });
  }

  if (allowedActions.includes("expire")) {
    actions.push({ key: "expire_treatment", severity: "medium", message: "Manual expiry recommended for this treatment.", cta: "Expire Treatment" });
  }

  if (allowedActions.includes("complete")) {
    actions.push({ key: "complete_treatment", severity: "high", message: "Treatment ready for completion. Finalize and generate invoice.", cta: "Complete Treatment" });
  }

  const hasHighRisk = riskAssessment.some((r) => r.severity === "high");
  if (hasHighRisk && !allowedActions.includes("complete")) {
    actions.push({ key: "review_risks", severity: "high", message: "High-risk flags detected. Review treatment immediately.", cta: "Review Risks" });
  }

  if (payment) {
    const outstanding = Number(payment.remainingBalance || 0);
    if (outstanding > 0 && treatment.status !== "Completed") {
      actions.push({ key: "collect_payment", severity: outstanding > 5000 ? "high" : "medium", message: `Pending collection of ${outstanding}.`, cta: "Collect Payment" });
    }
  }

  if (bookings.length === 0 && treatment.status === "Active") {
    actions.push({ key: "missing_sessions", severity: "high", message: "No bookings linked to this active treatment.", cta: "Add Session" });
  }

  return actions;
};

const buildTimeline = ({ treatment, bookings, now }) => {
  const events = [];

  if (treatment.createdAt) {
    events.push({ type: "treatment_created", title: "Treatment Created", description: "Treatment record was created in the system.", timestamp: treatment.createdAt, actor: "System" });
  }

  if (treatment.startDate) {
    events.push({ type: "treatment_started", title: "Treatment Started", description: "Treatment validity period began.", timestamp: treatment.startDate, actor: "System" });
  }

  bookings.forEach((booking) => {
    if (booking.createdAt) {
      events.push({
        type: "session_created",
        title: `Session #${booking.sessionNumber || "-"} Created`,
        description: `Booking created for ${booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString("en-IN") : "-"}`,
        timestamp: booking.createdAt,
        actor: "System",
      });
    }
  });

  const statusTransitionDates = {
    Active: treatment.startDate || treatment.updatedAt,
    InProgress: treatment.updatedAt,
    Completed: treatment.endDate || treatment.updatedAt,
    Expired: treatment.updatedAt,
    Cancelled: treatment.updatedAt,
  };

  if (statusTransitionDates[treatment.status]) {
    events.push({
      type: `treatment_${treatment.status.toLowerCase()}`,
      title: `Treatment ${treatment.status}`,
      description: `Treatment moved to "${treatment.status}" state.`,
      timestamp: statusTransitionDates[treatment.status],
      actor: "System",
    });
  }

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return events;
};

const findAlternativeProviders = async ({ serviceId, cityId, excludeProviderId }) => {
  try {
    const match = {};
    if (serviceId) match.services = new mongoose.Types.ObjectId(serviceId);

    const providers = await ServiceProvider.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "availablecities",
          localField: "serviceCities",
          foreignField: "_id",
          as: "cityDetails",
        },
      },
      {
        $match: cityId
          ? { "serviceCities": new mongoose.Types.ObjectId(cityId) }
          : {},
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          mobile: 1,
          yearsOfExperience: 1,
          "rating.average": 1,
          "serviceCities": 1,
          "documents.profilePhoto": 1,
          isAvailable: 1,
        },
      },
      { $limit: 10 },
    ]);

    return providers
      .filter((p) => toIdString(p._id) !== toIdString(excludeProviderId))
      .slice(0, 5)
      .map((item) => ({
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phone: item.mobile,
        yearsOfExperience: item.yearsOfExperience || 0,
        rating: item.rating?.average || 0,
        profilePhoto: item.documents?.profilePhoto || null,
        isAvailable: item.isAvailable !== false,
      }));
  } catch {
    return [];
  }
};

const findSimilarServices = async ({ serviceId, excludeCategory }) => {
  try {
    const current = serviceId
      ? await Service.findById(serviceId).select("category").lean()
      : null;

    const match = {};
    if (current?.category) {
      match.category = current.category;
    }

    const services = await Service.aggregate([
      { $match: match },
      { $sample: { size: 6 } },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          description: 1,
          basePrice: 1,
          taxPercentage: 1,
        },
      },
    ]);

    return services
      .filter((s) => toIdString(s._id) !== toIdString(serviceId))
      .slice(0, 4)
      .map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        description: item.description || "",
        basePrice: item.basePrice || 0,
        taxPercentage: item.taxPercentage || 0,
      }));
  } catch {
    return [];
  }
};

exports.computeTreatmentRecommendations = async ({
  treatment,
  bookings = [],
  payment,
  patient,
  allowedActions = [],
}) => {
  const now = new Date();

  const allPatientBookings = patient?._id
    ? await Booking.find({ patientId: patient._id, _id: { $ne: null } })
        .select("_id appointmentDate status")
        .sort({ appointmentDate: -1 })
        .lean()
    : [];

  const sessionIntel = computeSessionIntelligence(bookings);

  const pastAppointments = allPatientBookings.length;
  const lastVisitDate =
    allPatientBookings.length > 0
      ? allPatientBookings[0].appointmentDate
      : null;

  const completedSessions = bookings.filter((b) =>
    ["Completed", "TreatmentCompleted"].includes(String(b.status))
  ).length;
  const totalSessions = bookings.length || 1;
  const completionPercentage = Math.round((completedSessions / totalSessions) * 100);
  const isOverdue =
    treatment.validTill && new Date(treatment.validTill) < now;
  const treatmentNearExpiry =
    treatment.validTill &&
    !isOverdue &&
    Math.ceil((new Date(treatment.validTill) - now) / (24 * 60 * 60 * 1000)) <= 3;

  const riskAssessment = computeRiskAssessment({ treatment, bookings, payment, now });

  const actionRecommendations = buildActionRecommendations({
    treatment,
    bookings,
    payment,
    allowedActions,
    riskAssessment,
    now,
  });

  const timeline = buildTimeline({ treatment, bookings, now });

  const patientHistory = {
    pastAppointments,
    lastVisitDate,
    medicalConditions: (patient?.medicalHistory || []).map((e) => e.condition).filter(Boolean),
    allergies: patient?.allergies || [],
    medicationsCount: (patient?.currentMedications || []).length,
    bloodGroup: patient?.bloodGroup || null,
    gender: patient?.gender || null,
    dateOfBirth: patient?.dateOfBirth || null,
  };

  const sessionIntelligence = {
    totalSessions,
    completedSessions,
    pendingSessions: totalSessions - completedSessions,
    completionPercentage,
    adherence: sessionIntel.adherence,
    averageGapDays: sessionIntel.averageGapDays,
    sessionGaps: sessionIntel.gaps.slice(0, 10),
  };

  const patientId = treatment.patientId?._id || treatment.patientId;
  const serviceId = treatment.serviceId?._id || treatment.serviceId;
  const providerId = treatment.servicePartnerId?._id || treatment.servicePartnerId;

  const [alternativeProviders, similarServices] = await Promise.all([
    findAlternativeProviders({ serviceId, cityId: null, excludeProviderId: providerId }),
    findSimilarServices({ serviceId, excludeCategory: null }),
  ]);

  return {
    patientHistory,
    sessionIntelligence,
    riskAssessment,
    actionRecommendations,
    alternativeProviders,
    similarServices,
    analytics: {
      paymentStatus: payment?.paymentStatus || "Unknown",
      totalAmount: payment?.totalBillAmount || 0,
      paidAmount: payment?.totalPaid || 0,
      pendingAmount: payment?.remainingBalance || 0,
      totalRefunded: payment?.totalRefunded || 0,
      treatmentValidityDays: treatment.validTill
        ? Math.ceil((new Date(treatment.validTill) - now) / (24 * 60 * 60 * 1000))
        : null,
      completionPercentage,
      isOverdue,
      treatmentNearExpiry,
      startDate: treatment.startDate,
      endDate: treatment.endDate,
      validTill: treatment.validTill,
    },
    timeline,
    patient: {
      _id: patient?._id,
      firstName: patient?.firstName,
      lastName: patient?.lastName,
      phone: patient?.phone,
      email: patient?.email,
      profilePhoto: patient?.profilePhoto,
    },
  };
};
