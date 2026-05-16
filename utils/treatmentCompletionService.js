const mongoose = require("mongoose");
const crypto = require("crypto");

const Booking = require("../models/bookingModel");
const Treatment = require("../models/treatmentModel");
const Invoice = require("../models/invoiceModel");
const Payment = require("../models/paymentModel");
const {
  OPEN_BOOKING_STATUSES,
  TREATMENT_STATES,
} = require("./treatmentLifecycle");

class CompletionFlowError extends Error {
  constructor(message, statusCode = 400, code = "COMPLETE_FLOW_ERROR") {
    super(message);
    this.name = "CompletionFlowError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const applyEquipmentCharges = (booking, equipment = []) => {
  if (!Array.isArray(equipment) || equipment.length === 0) return;

  let extraCharge = 0;
  booking.additionalEquipment = equipment.map((item = {}) => {
    const charge = toNumber(item.charge, 0);
    extraCharge += charge;
    return {
      name: item.name,
      charge,
    };
  });

  booking.pricing.equipmentCharges = toNumber(booking.pricing?.equipmentCharges, 0) + extraCharge;
  booking.pricing.totalAmount = toNumber(booking.pricing?.totalAmount, 0) + extraCharge;
};

const finalizeTreatmentCompletion = async ({
  bookingId,
  actorId,
  equipment = [],
  session,
} = {}) => {
  if (!bookingId) {
    throw new CompletionFlowError(
      "Booking ID is required to complete treatment",
      400,
      "MISSING_BOOKING_ID"
    );
  }

  const booking = await Booking.findById(bookingId)
    .populate("serviceId", "name category taxPercentage")
    .session(session);

  if (!booking || booking.status === "Cancelled") {
    throw new CompletionFlowError("Booking not found or cancelled", 404, "BOOKING_NOT_FOUND");
  }

  if (!booking.treatmentId) {
    throw new CompletionFlowError(
      "This booking is not linked to a treatment",
      400,
      "MISSING_TREATMENT_LINK"
    );
  }

  const treatment = await Treatment.findById(booking.treatmentId).session(session);
  if (!treatment) {
    throw new CompletionFlowError("Treatment not found", 404, "TREATMENT_NOT_FOUND");
  }

  if (booking.status === "Completed" && treatment.status === TREATMENT_STATES.COMPLETED) {
    return {
      alreadyCompleted: true,
      booking,
      treatment,
      invoice: booking.invoiceId || null,
    };
  }

  if (booking.status === "Completed" && treatment.status !== TREATMENT_STATES.COMPLETED) {
    throw new CompletionFlowError(
      "Booking is already completed but treatment is not completed. Admin repair required.",
      409,
      "BOOKING_TREATMENT_STATE_MISMATCH"
    );
  }

  const allowedTreatmentStates = [
    TREATMENT_STATES.ACTIVE,
    TREATMENT_STATES.IN_PROGRESS,
    TREATMENT_STATES.COMPLETED,
  ];

  if (!allowedTreatmentStates.includes(String(treatment.status || ""))) {
    throw new CompletionFlowError(
      "Treatment must be Active or InProgress",
      400,
      "INVALID_TREATMENT_STATE"
    );
  }

  if (!treatment.currentBookingId || String(treatment.currentBookingId) !== String(booking._id)) {
    throw new CompletionFlowError(
      "Treatment has no current booking link for completion",
      409,
      "MISSING_CURRENT_BOOKING"
    );
  }

  const openFutureCount = await Booking.countDocuments({
    treatmentId: treatment._id,
    _id: { $ne: booking._id },
    status: { $in: Array.from(OPEN_BOOKING_STATUSES) },
  }).session(session);

  if (openFutureCount > 0) {
    throw new CompletionFlowError(
      "Cannot complete treatment while pending/open sessions exist",
      409,
      "PENDING_SESSIONS_EXIST"
    );
  }

  booking.advanceAmount = 0;
  booking.paidAmount = 0;
  booking.isAdvancePaid = false;
  booking.paymentHistory = [];

  applyEquipmentCharges(booking, equipment);

  const totalAmount = toNumber(booking.pricing?.totalAmount, 0);
  booking.dueAmount = totalAmount;
  booking.paymentStatus = "Unpaid";
  booking.isFinalPaymentDone = false;
  booking.payNow = true;

  booking.status = "Completed";
  booking.serviceEndedAt = new Date();

  treatment.status = TREATMENT_STATES.COMPLETED;
  treatment.endDate = booking.serviceEndedAt;
  treatment.lastBookingAt = booking.serviceEndedAt;

  const invoicePayload = {
    invoiceNumber: `INV-${Date.now()}-${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`,
    bookingId: booking._id,
    patientId: booking.patientId,
    doctorId: booking.servicePartnerId || actorId || null,
    billingDetails: {
      serviceName: booking.serviceId?.name,
      category: booking.serviceId?.category || booking.category,
      totalAmount: booking.pricing.totalAmount,
      paidAmount: 0,
      dueAmount: booking.dueAmount,
      paymentStatus: "Unpaid",
      durationMinutes: booking.duration,
      basePrice: booking.pricing?.basePrice,
      calculatedBase: booking.pricing?.subtotal,
      taxPercentage: booking.serviceId?.taxPercentage || booking.pricing?.taxPercentage || 0,
      shiftType: booking.shiftType || null,
    },
    paymentStatus: "Unpaid",
    isInvoiceGenerated: true,
    issuedAt: new Date(),
  };

  const invoice = await Invoice.create([invoicePayload], { session });
  const savedInvoice = invoice[0];

  booking.invoiceId = savedInvoice._id;
  booking.invoiceGenerated = true;
  treatment.invoiceId = savedInvoice._id;
  treatment.invoiceGenerated = true;

  await booking.save({ session });
  await treatment.save({ session });

  const payment = await Payment.findOne({ treatmentId: treatment._id }).session(session);
  if (payment) {
    payment.invoiceId = savedInvoice._id;
    payment.paymentStatus = booking.paymentStatus;
    payment.totalBillAmount = toNumber(booking.pricing?.totalAmount, payment.totalBillAmount);
    payment.totalPaid = 0;
    payment.remainingBalance = booking.dueAmount;
    payment.updatedAt = new Date();
    await payment.save({ session });
  }

  return {
    alreadyCompleted: false,
    booking,
    treatment,
    invoice: savedInvoice,
  };
};

const completeTreatmentWithTransaction = async ({
  bookingId,
  actorId,
  equipment = [],
} = {}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await finalizeTreatmentCompletion({
      bookingId,
      actorId,
      equipment,
      session,
    });
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  CompletionFlowError,
  finalizeTreatmentCompletion,
  completeTreatmentWithTransaction,
};
