// const crypto = require("crypto");
// const Booking = require("../models/bookingModel");
// const Payment = require("../models/paymentModel");
// const Treatment = require("../models/treatmentModel");
// const razorpay = require("../config/razorpay");

// const ADMIN_ROLES = new Set(["admin", "superadmin", "subadmin"]);
// const PROVIDER_ROLES = new Set(["serviceprovider"]);

// const normalizeAmount = (value) => {
//   const amount = Number(value || 0);
//   return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 0;
// };

// const getRole = (req) => (req.user?.role || "").toString().toLowerCase();

// const isObjectIdEqual = (a, b) => String(a || "") === String(b || "");

// const canAccessTreatment = (req, treatment) => {
//   const role = getRole(req);

//   if (ADMIN_ROLES.has(role)) {
//     return true;
//   }

//   if (role === "patient") {
//     return isObjectIdEqual(treatment.patientId, req.user?.id);
//   }

//   if (PROVIDER_ROLES.has(role)) {
//     return isObjectIdEqual(treatment.servicePartnerId, req.user?.id);
//   }

//   return false;
// };

// const canManageManualLedgerActions = (req) => ADMIN_ROLES.has(getRole(req));

// const getTreatmentOr404 = async (treatmentId) => Treatment.findById(treatmentId);

// // const buildRazorpayReceipt = (prefix, entityId) => {
// //   const safePrefix = String(prefix || "pay").slice(0, 8);
// //   const shortId = String(entityId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-12);
// //   const stamp = Date.now().toString().slice(-10);
// //   return `${safePrefix}_${shortId}_${stamp}`.slice(0, 40);
// // };

// const recalculateLedger = (payment) => {
//   const totalPaid = (payment.transactions || [])
//     .filter((item) => item.status === "Paid")
//     .reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);

//   const totalRefunded = (payment.refunds || [])
//     .filter((item) => item.status === "Processed")
//     .reduce((sum, item) => sum + Number(item.amount || 0), 0);

//   payment.totalPaid = Number(totalPaid.toFixed(2));
//   payment.totalRefunded = Number(totalRefunded.toFixed(2));
//   payment.remainingBalance = Number(
//     Math.max(Number(payment.totalBillAmount || 0) - payment.totalPaid + payment.totalRefunded, 0).toFixed(2)
//   );
// };

// const syncPaymentLedger = async (payment, treatment) => {
//   const bookings = await Booking.find({ treatmentId: treatment._id }).select(
//     "_id pricing.totalAmount servicePartnerId"
//   );

//   const totalBillAmount = bookings.reduce(
//     (sum, booking) => sum + Number(booking.pricing?.totalAmount || 0),
//     0
//   );

//   payment.patientId = treatment.patientId;
//   payment.servicePartnerId = treatment.servicePartnerId || null;
//   payment.bookingIds = bookings.map((booking) => booking._id);
//   payment.totalBillAmount = Number(totalBillAmount.toFixed(2));
//   payment.billBreakdown = {
//     ...(payment.billBreakdown || {}),
//     subtotal: payment.totalBillAmount,
//     gstAmount: Number(payment.billBreakdown?.gstAmount || 0),
//     cgst: Number(payment.billBreakdown?.cgst || 0),
//     sgst: Number(payment.billBreakdown?.sgst || 0),
//     grandTotal: payment.totalBillAmount,
//   };

//   recalculateLedger(payment);
//   return payment;
// };

// const getOrCreatePaymentLedger = async (treatment) => {
//   let payment = await Payment.findOne({ treatmentId: treatment._id });

//   if (!payment) {
//     payment = new Payment({
//       treatmentId: treatment._id,
//       patientId: treatment.patientId,
//       servicePartnerId: treatment.servicePartnerId || null,
//       bookingIds: [],
//       totalBillAmount: 0,
//       totalPaid: 0,
//       totalRefunded: 0,
//       remainingBalance: 0,
//       billBreakdown: {
//         subtotal: 0,
//         gstAmount: 0,
//         cgst: 0,
//         sgst: 0,
//         grandTotal: 0,
//       },
//       paymentStatus: "Unpaid",
//       transactions: [],
//       refunds: [],
//     });
//   }

//   await syncPaymentLedger(payment, treatment);
//   await payment.save();
//   return payment;
// };

// const inferStage = (payment, incomingAmount) => {
//   const amount = normalizeAmount(incomingAmount);
//   const paidSoFar = Number(payment.totalPaid || 0);
//   const remainingBefore = Number(payment.remainingBalance || 0);

//   if (paidSoFar <= 0) {
//     return "Advance";
//   }

//   if (amount >= remainingBefore) {
//     return "Final";
//   }

//   return "Partial";
// };

// const buildLedgerResponse = (payment) => ({
//   paymentId: payment._id,
//   treatmentId: payment.treatmentId,
//   patientId: payment.patientId,
//   servicePartnerId: payment.servicePartnerId,
//   bookingIds: payment.bookingIds,
//   invoiceId: payment.invoiceId,
//   currency: payment.currency,
//   totalBillAmount: payment.totalBillAmount,
//   totalPaid: payment.totalPaid,
//   totalRefunded: payment.totalRefunded,
//   remainingBalance: payment.remainingBalance,
//   paymentStatus: payment.paymentStatus,
//   transactions: payment.transactions,
//   refunds: payment.refunds,
//   updatedAt: payment.updatedAt,
// });

// exports.getTreatmentPaymentLedger = async (req, res) => {
//   try {
//     const { treatmentId } = req.params;
//     const treatment = await getTreatmentOr404(treatmentId);

//     if (!treatment) {
//       return res.status(404).json({
//         success: false,
//         message: "Treatment not found",
//       });
//     }

//     if (!canAccessTreatment(req, treatment)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to access this payment ledger",
//       });
//     }

//     const payment = await getOrCreatePaymentLedger(treatment);

//     return res.status(200).json({
//       success: true,
//       message: "Payment ledger fetched successfully",
//       data: buildLedgerResponse(payment),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payment ledger",
//       error: error.message,
//     });
//   }
// };
// const buildRazorpayReceipt = (prefix, entityId) => {
//   const safePrefix = String(prefix || "pay").slice(0, 8);
//   const shortId = String(entityId || "")
//     .replace(/[^a-zA-Z0-9]/g, "")
//     .slice(-12);
//   const stamp = Date.now().toString().slice(-10);

//   return `${safePrefix}_${shortId}_${stamp}`.slice(0, 40);
// };

// // exports.createTreatmentOnlineOrder = async (req, res) => {
// //   try {
// //     const { treatmentId } = req.params;
// //     const { amount } = req.body;

// //     const treatment = await getTreatmentOr404(treatmentId);
// //     if (!treatment) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Treatment not found",
// //       });
// //     }

// //     if (!canAccessTreatment(req, treatment) || getRole(req) !== "patient") {
// //       return res.status(403).json({
// //         success: false,
// //         message: "Only the treatment owner can create an online payment order",
// //       });
// //     }

// //     const payment = await getOrCreatePaymentLedger(treatment);
// //     const requestedAmount = normalizeAmount(amount);

// //     if (requestedAmount <= 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "A valid amount is required",
// //       });
// //     }

// //     if (requestedAmount > Number(payment.remainingBalance || 0)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Amount exceeds the remaining treatment balance",
// //       });
// //     }

// //     const stage = inferStage(payment, requestedAmount);
// //     const order = await razorpay.orders.create({
// //       amount: Math.round(requestedAmount * 100),
// //       currency: payment.currency || "INR",
// //       receipt: buildRazorpayReceipt("treatpay", treatment._id),
// //       notes: {
// //         treatmentId: String(treatment._id),
// //         paymentStage: stage,
// //       },
// //      razorpayOrderId: order.id,
// //       razorpayPaymentId: null,
// //       razorpaySignature: null,    });

// //     payment.transactions.push({
// //       type: "Charge",
// //       stage,
// //       method: "Online",
// //       amountPaid: requestedAmount,
// //       currency: payment.currency || "INR",
// //       status: "Pending",

// //       note: `Pending ${stage.toLowerCase()} payment`,
// //       collectedBy: null,
// //     });

// //     recalculateLedger(payment);
// //     await payment.save();

// //     return res.status(200).json({
// //       success: true,
// //       message: "Online payment order created successfully",
// //       data: {
// //         paymentId: payment._id,
// //         treatmentId: treatment._id,
// //         orderId: order.id,
// //         amount: order.amount,
// //         currency: order.currency,
// //         stage,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("CREATE ORDER ERROR:", error);
// //     console.error("STACK:", error.stack);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to create online payment order",
// //       error: error.message,
// //     });
// //   }
// // };
// exports.createTreatmentOnlineOrder = async (req, res) => {
//   try {
//     const { treatmentId } = req.params;
//     const { amount } = req.body;

//     const treatment = await getTreatmentOr404(treatmentId);
//     if (!treatment) {
//       return res.status(404).json({
//         success: false,
//         message: "Treatment not found",
//       });
//     }

//     if (!canAccessTreatment(req, treatment) || getRole(req) !== "patient") {
//       return res.status(403).json({
//         success: false,
//         message: "Only the treatment owner can create an online payment order",
//       });
//     }

//     const payment = await getOrCreatePaymentLedger(treatment);
//     const requestedAmount = normalizeAmount(amount);

//     if (requestedAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "A valid amount is required",
//       });
//     }

//     if (requestedAmount > Number(payment.remainingBalance || 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "Amount exceeds the remaining treatment balance",
//       });
//     }

//     const stage = inferStage(payment, requestedAmount);

//     const order = await razorpay.orders.create({
//       amount: Math.round(requestedAmount * 100),
//       currency: payment.currency || "INR",
//       receipt: buildRazorpayReceipt("treatpay", treatment._id),
//       notes: {
//         treatmentId: String(treatment._id),
//         paymentStage: stage,
//       },
//     });

//     payment.transactions.push({
//       type: "Charge",
//       stage,
//       method: "Online",
//       amountPaid: requestedAmount,
//       currency: payment.currency || "INR",
//       status: "Pending",
//       note: `Pending ${stage.toLowerCase()} payment`,
//       collectedBy: null,
//       razorpayOrderId: order.id,
//       razorpayPaymentId: null,
//       razorpaySignature: null,
//     });

//     recalculateLedger(payment);
//     await payment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Online payment order created successfully",
//       data: {
//         paymentId: payment._id,
//         treatmentId: treatment._id,
//         key: process.env.RAZORPAY_API_KEY,
//         orderId: order.id,
//         amount: order.amount,
//         currency: order.currency,
//         stage,
//       },
//     });
//   } catch (error) {
//     console.error("CREATE ORDER ERROR:", error);
//     console.error("STACK:", error.stack);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create online payment order",
//       error: error.message,
//     });
//   }
// };
// exports.verifyTreatmentOnlinePayment = async (req, res) => {
//   try {
//     const { treatmentId } = req.params;
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
//       });
//     }

//     const treatment = await getTreatmentOr404(treatmentId);
//     if (!treatment) {
//       return res.status(404).json({
//         success: false,
//         message: "Treatment not found",
//       });
//     }

//     if (!canAccessTreatment(req, treatment) || getRole(req) !== "patient") {
//       return res.status(403).json({
//         success: false,
//         message: "Only the treatment owner can verify an online payment",
//       });
//     }

//     const payment = await Payment.findOne({ treatmentId });
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment ledger not found for this treatment",
//       });

//     }

//     const transaction = [...(payment.transactions || [])]
//       .reverse()
//       .find(
//         (item) =>
//           item.razorpayOrderId === razorpay_order_id &&
//           item.method === "Online" &&
//           item.status === "Pending"
//       );

//     if (!transaction) {
//       return res.status(404).json({
//         success: false,
//         message: "Pending online transaction not found for this order",
//       });
//     }

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       transaction.status = "Failed";
//       transaction.failureReason = "Signature verification failed";
//       await payment.save();

//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     transaction.status = "Paid";
//     transaction.razorpayPaymentId = razorpay_payment_id;
//     transaction.razorpaySignature = razorpay_signature;
//     transaction.paidAt = new Date();
//     transaction.failureReason = null;

//     recalculateLedger(payment);
//     await payment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Online payment verified successfully",
//       data: buildLedgerResponse(payment),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify online payment",
//       error: error.message,
//     });
//   }
// };

// exports.recordManualPayment = async (req, res) => {
//   try {
//     const { treatmentId } = req.params;
//     const { amount, method, stage, note = "", referenceNumber = null } = req.body;

//     if (!canManageManualLedgerActions(req)) {
//       return res.status(403).json({
//         success: false,
//         message: "Only admins can record manual payments",
//       });
//     }

//     const treatment = await getTreatmentOr404(treatmentId);
//     if (!treatment) {
//       return res.status(404).json({
//         success: false,
//         message: "Treatment not found",
//       });
//     }

//     const payment = await getOrCreatePaymentLedger(treatment);
//     const receivedAmount = normalizeAmount(amount);
//     const allowedMethods = new Set(["Cash", "UPI", "Card", "BankTransfer"]);

//     if (receivedAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "A valid amount is required",
//       });
//     }

//     if (!allowedMethods.has(method)) {
//       return res.status(400).json({
//         success: false,
//         message: "Manual payment method must be Cash, UPI, Card, or BankTransfer",
//       });
//     }

//     if (receivedAmount > Number(payment.remainingBalance || 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "Amount exceeds the remaining treatment balance",
//       });
//     }

//     const resolvedStage = ["Advance", "Partial", "Final"].includes(stage)
//       ? stage
//       : inferStage(payment, receivedAmount);

//     payment.transactions.push({
//       type: "Charge",
//       stage: resolvedStage,
//       method,
//       amountPaid: receivedAmount,
//       currency: payment.currency || "INR",
//       status: "Paid",
//       razorpayOrderId: null,
//       razorpayPaymentId: referenceNumber,
//       razorpaySignature: null,
//       note,
//       collectedBy: req.user?.id || null,
//       paidAt: new Date(),
//     });

//     payment.lastWebhookEvent = "MANUAL_COLLECTION";
//     payment.lastWebhookProcessedAt = new Date();
//     recalculateLedger(payment);
//     await payment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Manual payment recorded successfully",
//       data: buildLedgerResponse(payment),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to record manual payment",
//       error: error.message,
//     });
//   }
// };

// exports.recordManualRefund = async (req, res) => {
//   try {
//     const { treatmentId } = req.params;
//     const {
//       amount,
//       reason,
//       mode,
//       refundType,
//       note = "",
//       referenceTransactionId = null,
//     } = req.body;

//     if (!canManageManualLedgerActions(req)) {
//       return res.status(403).json({
//         success: false,
//         message: "Only admins can process manual refunds",
//       });
//     }

//     const treatment = await getTreatmentOr404(treatmentId);
//     if (!treatment) {
//       return res.status(404).json({
//         success: false,
//         message: "Treatment not found",
//       });
//     }

//     const payment = await getOrCreatePaymentLedger(treatment);
//     const refundAmount = normalizeAmount(amount);
//     const refundableAmount = Math.max(
//       Number(payment.totalPaid || 0) - Number(payment.totalRefunded || 0),
//       0
//     );

//     if (refundAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "A valid refund amount is required",
//       });
//     }

//     if (!reason || !mode) {
//       return res.status(400).json({
//         success: false,
//         message: "reason and mode are required for a manual refund",
//       });
//     }

//     if (refundAmount > refundableAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Refund amount exceeds the refundable balance",
//       });
//     }

//     payment.refunds.push({
//       refundType:
//         refundType && ["Full", "Partial"].includes(refundType)
//           ? refundType
//           : refundAmount === refundableAmount
//             ? "Full"
//             : "Partial",
//       amount: refundAmount,
//       reason,
//       status: "Processed",
//       mode,
//       referenceTransactionId,
//       adminId: req.user?.id || null,
//       approvedBy: req.user?.id || null,
//       refundedAt: new Date(),
//       note,
//     });

//     payment.lastWebhookEvent = "MANUAL_REFUND";
//     payment.lastWebhookProcessedAt = new Date();
//     recalculateLedger(payment);
//     await payment.save();

//     return res.status(200).json({
//       success: true,
//       message: "Manual refund recorded successfully",
//       data: buildLedgerResponse(payment),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to record manual refund",
//       error: error.message,
//     });
//   }
// };

const crypto = require("crypto");
const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const Payment = require("../models/paymentModel");
const Treatment = require("../models/treatmentModel");
const SettlementRequest = require("../models/settlementRequestModel");
const QrPaymentIntent = require("../models/qrPaymentIntentModel");
const razorpay = require("../config/razorpay");

const ADMIN_ROLES = new Set(["admin", "superadmin", "subadmin"]);
const PROVIDER_ROLES = new Set(["serviceprovider"]);

const normalizeAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 0;
};

const getRole = (req) => (req.user?.role || "").toString().toLowerCase();
const isObjectIdEqual = (a, b) => String(a || "") === String(b || "");

const canAccessTreatment = (req, treatment) => {
  const role = getRole(req);

  if (ADMIN_ROLES.has(role)) return true;
  if (role === "patient")
    return isObjectIdEqual(treatment.patientId, req.user?.id);
  if (PROVIDER_ROLES.has(role))
    return isObjectIdEqual(treatment.servicePartnerId, req.user?.id);

  return false;
};

const canManageManualLedgerActions = (req) => ADMIN_ROLES.has(getRole(req));
const getTreatmentOr404 = async (treatmentId) =>
  Treatment.findById(treatmentId);

const buildRazorpayReceipt = (prefix, entityId) => {
  const safePrefix = String(prefix || "pay").slice(0, 8);
  const shortId = String(entityId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-12);
  const stamp = Date.now().toString().slice(-10);
  return `${safePrefix}_${shortId}_${stamp}`.slice(0, 40);
};

const recalculateLedger = (payment) => {
  const totalPaid = (payment.transactions || [])
    .filter((item) => item.status === "Paid")
    .reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);

  const totalRefunded = (payment.refunds || [])
    .filter((item) => item.status === "Processed")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  payment.totalPaid = Number(totalPaid.toFixed(2));
  payment.totalRefunded = Number(totalRefunded.toFixed(2));
  payment.remainingBalance = Number(
    Math.max(
      Number(payment.totalBillAmount || 0) -
        payment.totalPaid +
        payment.totalRefunded,
      0,
    ).toFixed(2),
  );

  if (payment.totalPaid <= 0) {
    payment.paymentStatus = "Unpaid";
  } else if (payment.remainingBalance <= 0) {
    payment.paymentStatus = "Paid";
  } else {
    payment.paymentStatus = "Partially Paid";
  }
};

const BOOKING_PAYMENT_METHODS = new Set(["Online", "Cash", "UPI"]);

const toBookingPaymentMethod = (method) => {
  if (BOOKING_PAYMENT_METHODS.has(method)) return method;
  return method ? "UPI" : "None";
};

const toBookingPaymentStatus = (payment) => {
  const totalPaid = Number(payment.totalPaid || 0);
  const remainingBalance = Number(payment.remainingBalance || 0);

  if (totalPaid <= 0) return "Unpaid";
  if (remainingBalance <= 0) return "Paid";
  return "Partially Paid";
};

const toBookingPaymentStage = (stage) =>
  stage === "Advance" ? "Booking" : "TreatmentCompletion";

const buildBookingPaymentSnapshot = (payment) => {
  const paidTransactions = (payment.transactions || []).filter(
    (transaction) => transaction.status === "Paid",
  );
  const latestPaidTransaction = [...paidTransactions].sort(
    (left, right) =>
      new Date(right.paidAt || right.createdAt || 0) -
      new Date(left.paidAt || left.createdAt || 0),
  )[0];
  const latestOnlineTransaction = [...paidTransactions]
    .filter((transaction) => transaction.method === "Online")
    .sort(
      (left, right) =>
        new Date(right.paidAt || right.createdAt || 0) -
        new Date(left.paidAt || left.createdAt || 0),
    )[0];
  const advanceAmount = paidTransactions
    .filter((transaction) => transaction.stage === "Advance")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amountPaid || 0),
      0,
    );
  const remainingBalance = Number(payment.remainingBalance || 0);

  return {
    paymentStatus: toBookingPaymentStatus(payment),
    paymentMethod: toBookingPaymentMethod(latestPaidTransaction?.method),
    advanceAmount: Number(advanceAmount.toFixed(2)),
    paidAmount: Number(Number(payment.totalPaid || 0).toFixed(2)),
    dueAmount: Number(remainingBalance.toFixed(2)),
    isAdvancePaid: advanceAmount > 0,
    isFinalPaymentDone: Number(payment.totalPaid || 0) > 0 && remainingBalance <= 0,
    payNow: remainingBalance > 0,
    lastRazorpayOrderId: latestOnlineTransaction?.razorpayOrderId || null,
    lastRazorpayPaymentId: latestOnlineTransaction?.razorpayPaymentId || null,
    paymentHistory: paidTransactions.map((transaction) => ({
      amount: Number(transaction.amountPaid || 0),
      method: toBookingPaymentMethod(transaction.method),
      stage: toBookingPaymentStage(transaction.stage),
      razorpayOrderId: transaction.razorpayOrderId || null,
      razorpayPaymentId: transaction.razorpayPaymentId || null,
      paidAt: transaction.paidAt || transaction.updatedAt || new Date(),
      note: transaction.note || "",
    })),
  };
};

const syncBookingsFromPaymentLedger = async (payment) => {
  const bookingIds = (payment.bookingIds || []).filter(Boolean);
  const query = {
    $or: [
      ...(bookingIds.length ? [{ _id: { $in: bookingIds } }] : []),
      ...(payment.treatmentId ? [{ treatmentId: payment.treatmentId }] : []),
    ],
  };

  if (!query.$or.length) return;

  await Booking.updateMany(query, {
    $set: buildBookingPaymentSnapshot(payment),
  });
};

const syncPaymentLedger = async (payment, treatment) => {
  const bookings = await Booking.find({ treatmentId: treatment._id }).select(
    "_id pricing.totalAmount servicePartnerId",
  );

  const totalBillAmount = bookings.reduce(
    (sum, booking) => sum + Number(booking.pricing?.totalAmount || 0),
    0,
  );

  payment.patientId = treatment.patientId;
  payment.servicePartnerId =
    treatment.servicePartnerId || bookings[0]?.servicePartnerId || null;
  payment.bookingIds = bookings.map((booking) => booking._id);
  payment.currency = payment.currency || "INR";
  payment.totalBillAmount = Number(totalBillAmount.toFixed(2));
  payment.billBreakdown = {
    ...(payment.billBreakdown || {}),
    subtotal: payment.totalBillAmount,
    gstAmount: Number(payment.billBreakdown?.gstAmount || 0),
    cgst: Number(payment.billBreakdown?.cgst || 0),
    sgst: Number(payment.billBreakdown?.sgst || 0),
    grandTotal: payment.totalBillAmount,
  };

  recalculateLedger(payment);
  return payment;
};

const getOrCreatePaymentLedger = async (treatment) => {
  let payment = await Payment.findOne({ treatmentId: treatment._id });

  if (!payment) {
    payment = new Payment({
      treatmentId: treatment._id,
      patientId: treatment.patientId,
      servicePartnerId: treatment.servicePartnerId || null,
      bookingIds: [],
      currency: "INR",
      totalBillAmount: 0,
      totalPaid: 0,
      totalRefunded: 0,
      remainingBalance: 0,
      billBreakdown: {
        subtotal: 0,
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        grandTotal: 0,
      },
      paymentStatus: "Unpaid",
      transactions: [],
      refunds: [],
    });
  }

  await syncPaymentLedger(payment, treatment);
  await payment.save();
  return payment;
};

const inferStage = (payment, incomingAmount) => {
  const amount = normalizeAmount(incomingAmount);
  const paidSoFar = Number(payment.totalPaid || 0);
  const remainingBefore = Number(payment.remainingBalance || 0);

  if (paidSoFar <= 0) return "Advance";
  if (amount >= remainingBefore) return "Final";
  return "Partial";
};

const buildLedgerResponse = (payment) => ({
  paymentId: payment._id,
  treatmentId: payment.treatmentId,
  patientId: payment.patientId,
  servicePartnerId: payment.servicePartnerId,
  bookingIds: payment.bookingIds,
  invoiceId: payment.invoiceId,
  currency: payment.currency,
  totalBillAmount: payment.totalBillAmount,
  totalPaid: payment.totalPaid,
  totalRefunded: payment.totalRefunded,
  remainingBalance: payment.remainingBalance,
  paymentStatus: payment.paymentStatus,
  transactions: payment.transactions,
  refunds: payment.refunds,
  updatedAt: payment.updatedAt,
});

exports.getTreatmentPaymentLedger = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const treatment = await getTreatmentOr404(treatmentId);

    if (!treatment) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment not found" });
    }

    if (!canAccessTreatment(req, treatment)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this payment ledger",
      });
    }

    const payment = await getOrCreatePaymentLedger(treatment);

    return res.status(200).json({
      success: true,
      message: "Payment ledger fetched successfully",
      data: buildLedgerResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment ledger",
      error: error.message,
    });
  }
};

exports.createTreatmentOnlineOrder = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid treatment ID format",
      });
    }

    const treatment = await getTreatmentOr404(treatmentId);
    if (!treatment) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment not found" });
    }

    if (!canAccessTreatment(req, treatment) || getRole(req) !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only the treatment owner can create an online payment order",
      });
    }

    const payment = await getOrCreatePaymentLedger(treatment);
    const requestedAmount = normalizeAmount(amount || payment.remainingBalance);

    if (requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No payable amount found for this treatment",
      });
    }

    if (Number(payment.totalBillAmount || 0) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Booking amount is not available yet. Create booking first, then pay.",
      });
    }

    if (requestedAmount > Number(payment.remainingBalance || 0)) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds the remaining treatment balance",
      });
    }

    // const existingPending = (payment.transactions || []).find(
    //   (item) => item.method === "Online" && item.status === "Pending",
    // );

    // Check for active pending payment (max 15 mins old)
const now = new Date();
const PENDING_TIMEOUT_MINUTES = 15;

let existingPending = null;

for (const item of payment.transactions || []) {
  if (item.method === "Online" && item.status === "Pending") {
    const createdAt = item.createdAt || item.updatedAt;

    const ageInMinutes = createdAt
      ? (now - new Date(createdAt)) / (1000 * 60)
      : 9999;

    // Expire old pending transactions automatically
    if (ageInMinutes > PENDING_TIMEOUT_MINUTES) {
      item.status = "Failed";
      item.failureReason = "Payment session expired";
    } else {
      existingPending = item;
    }
  }
}

// Save expired updates
await payment.save();

// Reuse existing active order instead of throwing error
if (existingPending) {
  return res.status(200).json({
    success: true,
    message: "Existing pending payment found",
    data: {
      paymentId: payment._id,
      treatmentId: treatment._id,
      key: process.env.RAZORPAY_API_KEY,
      orderId: existingPending.razorpayOrderId,
      amount: Math.round(
        Number(existingPending.amountPaid || 0) * 100,
      ),
      currency:
        existingPending.currency || payment.currency || "INR",
      stage: existingPending.stage,
      isExisting: true,
    },
  });
}

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "A pending online payment already exists for this treatment",
        data: {
          paymentId: payment._id,
          orderId: existingPending.razorpayOrderId,
          amount: Math.round(Number(existingPending.amountPaid || 0) * 100),
          currency: existingPending.currency || payment.currency || "INR",
          stage: existingPending.stage,
        },
      });
    }

    const stage = inferStage(payment, requestedAmount);

    const order = await razorpay.orders.create({
      amount: Math.round(requestedAmount * 100),
      currency: payment.currency || "INR",
      receipt: buildRazorpayReceipt("treatpay", treatment._id),
      notes: {
        treatmentId: String(treatment._id),
        paymentStage: stage,
      },
    });

    payment.transactions.push({
      type: "Charge",
      stage,
      method: "Online",
      amountPaid: requestedAmount,
      currency: payment.currency || "INR",
      status: "Pending",
      note: `Pending ${stage.toLowerCase()} payment`,
      collectedBy: null,
      razorpayOrderId: order.id,
      razorpayPaymentId: null,
      razorpaySignature: null,
      paidAt: null,
      failureReason: null,
    });

    recalculateLedger(payment);
    await payment.save();
    await syncBookingsFromPaymentLedger(payment);

    return res.status(200).json({
      success: true,
      message: "Online payment order created successfully",
      data: {
        paymentId: payment._id,
        treatmentId: treatment._id,
        key: process.env.RAZORPAY_API_KEY,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        stage,
      },
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create online payment order",
      error: error.message,
    });
  }
};

exports.createBookingAdvanceOrderCompat = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
    }

    const booking = await Booking.findById(bookingId).select(
      "_id treatmentId patientId",
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!booking.treatmentId) {
      return res.status(400).json({
        success: false,
        message: "This booking is not linked to a treatment",
      });
    }

    req.params.treatmentId = String(booking.treatmentId);
    return exports.createTreatmentOnlineOrder(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create online payment order",
      error: error.message,
    });
  }
};

exports.verifyTreatmentOnlinePayment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const treatment = await getTreatmentOr404(treatmentId);
    if (!treatment) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment not found" });
    }

    if (!canAccessTreatment(req, treatment) || getRole(req) !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only the treatment owner can verify an online payment",
      });
    }

    const payment = await Payment.findOne({ treatmentId: treatment._id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment ledger not found for this treatment",
      });
    }

    const transaction = [...(payment.transactions || [])]
      .reverse()
      .find(
        (item) =>
          item.razorpayOrderId === razorpay_order_id &&
          item.method === "Online" &&
          item.status === "Pending",
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Pending online transaction not found for this order",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      transaction.status = "Failed";
      transaction.failureReason = "Signature verification failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    transaction.status = "Paid";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.paidAt = new Date();
    transaction.failureReason = null;

    recalculateLedger(payment);
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Online payment verified successfully",
      data: buildLedgerResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify online payment",
      error: error.message,
    });
  }
};

exports.recordManualPayment = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const {
      amount,
      method,
      stage,
      note = "",
      referenceNumber = null,
    } = req.body;

    if (!canManageManualLedgerActions(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can record manual payments",
      });
    }

    const treatment = await getTreatmentOr404(treatmentId);
    if (!treatment) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment not found" });
    }

    const payment = await getOrCreatePaymentLedger(treatment);
    const receivedAmount = normalizeAmount(amount);
    const allowedMethods = new Set(["Cash", "UPI", "Card", "BankTransfer"]);

    if (receivedAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid amount is required" });
    }

    if (!allowedMethods.has(method)) {
      return res.status(400).json({
        success: false,
        message:
          "Manual payment method must be Cash, UPI, Card, or BankTransfer",
      });
    }

    if (receivedAmount > Number(payment.remainingBalance || 0)) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds the remaining treatment balance",
      });
    }

    const resolvedStage = ["Advance", "Partial", "Final"].includes(stage)
      ? stage
      : inferStage(payment, receivedAmount);

    payment.transactions.push({
      type: "Charge",
      stage: resolvedStage,
      method,
      amountPaid: receivedAmount,
      currency: payment.currency || "INR",
      status: "Paid",
      razorpayOrderId: null,
      razorpayPaymentId: referenceNumber,
      razorpaySignature: null,
      note,
      collectedBy: req.user?.id || null,
      paidAt: new Date(),
    });

    payment.lastWebhookEvent = "MANUAL_COLLECTION";
    payment.lastWebhookProcessedAt = new Date();
    recalculateLedger(payment);
    await payment.save();
    await syncBookingsFromPaymentLedger(payment);

    return res.status(200).json({
      success: true,
      message: "Manual payment recorded successfully",
      data: buildLedgerResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record manual payment",
      error: error.message,
    });
  }
};

exports.recordManualRefund = async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const {
      amount,
      reason,
      mode,
      refundType,
      note = "",
      referenceTransactionId = null,
    } = req.body;

    if (!canManageManualLedgerActions(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can process manual refunds",
      });
    }

    const treatment = await getTreatmentOr404(treatmentId);
    if (!treatment) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment not found" });
    }

    const payment = await getOrCreatePaymentLedger(treatment);
    const refundAmount = normalizeAmount(amount);
    const refundableAmount = Math.max(
      Number(payment.totalPaid || 0) - Number(payment.totalRefunded || 0),
      0,
    );

    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid refund amount is required",
      });
    }

    if (!reason || !mode) {
      return res.status(400).json({
        success: false,
        message: "reason and mode are required for a manual refund",
      });
    }

    if (refundAmount > refundableAmount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds the refundable balance",
      });
    }

    payment.refunds.push({
      refundType:
        refundType && ["Full", "Partial"].includes(refundType)
          ? refundType
          : refundAmount === refundableAmount
            ? "Full"
            : "Partial",
      amount: refundAmount,
      reason,
      status: "Processed",
      mode,
      referenceTransactionId,
      adminId: req.user?.id || null,
      approvedBy: req.user?.id || null,
      refundedAt: new Date(),
      note,
    });

    payment.lastWebhookEvent = "MANUAL_REFUND";
    payment.lastWebhookProcessedAt = new Date();
    recalculateLedger(payment);
    await payment.save();
    await syncBookingsFromPaymentLedger(payment);

    return res.status(200).json({
      success: true,
      message: "Manual refund recorded successfully",
      data: buildLedgerResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record manual refund",
      error: error.message,
    });
  }
};

const resolvePaymentForEntity = async (entityType, entityId) => {
  if (entityType === "payment") return Payment.findById(entityId);
  if (entityType === "treatment") {
    const treatment = await Treatment.findById(entityId);
    if (!treatment) return null;
    return getOrCreatePaymentLedger(treatment);
  }
  if (entityType === "booking") {
    const booking = await Booking.findById(entityId);
    if (!booking?.treatmentId) return null;
    const treatment = await Treatment.findById(booking.treatmentId);
    if (!treatment) return null;
    return getOrCreatePaymentLedger(treatment);
  }
  return null;
};

exports.requestSettlement = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.user?._id;
    const requesterRole = getRole(req);
    const amount = normalizeAmount(req.body.amount);
    const treatmentId = req.body.treatmentId || null;
    const paymentId = req.body.paymentId || null;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "A valid amount is required" });
    }

    const payment = paymentId
      ? await Payment.findById(paymentId)
      : treatmentId
        ? await Payment.findOne({ treatmentId })
        : null;

    const settlement = await SettlementRequest.create({
      paymentId: payment?._id || paymentId || null,
      treatmentId: payment?.treatmentId || treatmentId,
      servicePartnerId: payment?.servicePartnerId || req.body.servicePartnerId || null,
      requesterId,
      requesterRole,
      amount,
      amountRequested: amount,
      currency: req.body.currency || payment?.currency || "INR",
      status: "pending",
      notes: req.body.notes || "",
    });

    if (payment) {
      payment.lastWebhookEvent = "SETTLEMENT_REQUESTED";
      payment.lastWebhookProcessedAt = new Date();
      await payment.save();
    }

    return res.status(201).json({ success: true, data: { settlement } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to request settlement", error: error.message });
  }
};

exports.listMySettlements = async (req, res) => {
  try {
    const settlements = await SettlementRequest.find({
      requesterId: req.user?.id || req.user?._id,
      requesterRole: getRole(req),
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: settlements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch settlements", error: error.message });
  }
};

exports.generateQrPaymentIntent = async (req, res) => {
  try {
    const { entityType = "treatment", entityId, provider = "manual-qr" } = req.body;
    const amount = normalizeAmount(req.body.amount);
    const currency = req.body.currency || "INR";

    if (!entityId || amount <= 0) {
      return res.status(400).json({ success: false, message: "entityId and valid amount are required" });
    }

    const payment = await resolvePaymentForEntity(entityType, entityId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment entity not found" });

    const providerRef = `QR-${Date.now()}-${String(entityId).slice(-6)}`;
    const expiresAt = new Date(Date.now() + Number(req.body.ttlMinutes || 15) * 60 * 1000);
    const intent = await QrPaymentIntent.create({
      entityType,
      entityId,
      amount,
      currency,
      provider,
      providerRef,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      data: {
        intent,
        qrData: `${provider}:${providerRef}:${currency}:${amount}`,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate QR intent", error: error.message });
  }
};

exports.verifyQrPaymentIntent = async (req, res) => {
  try {
    const { providerRef } = req.body;
    const intent = await QrPaymentIntent.findOne({ providerRef });
    if (!intent) return res.status(404).json({ success: false, message: "QR payment intent not found" });
    if (intent.status !== "pending") {
      return res.status(400).json({ success: false, message: `QR payment is already ${intent.status}` });
    }
    if (intent.expiresAt < new Date()) {
      intent.status = "expired";
      await intent.save();
      return res.status(400).json({ success: false, message: "QR payment intent expired" });
    }

    const payment = await resolvePaymentForEntity(intent.entityType, intent.entityId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment ledger not found" });

    payment.transactions.push({
      type: "Charge",
      stage: req.body.stage || "Partial",
      method: "UPI",
      amountPaid: intent.amount,
      currency: intent.currency,
      status: "Paid",
      paidAt: new Date(),
      note: `QR payment verified: ${providerRef}`,
      razorpayPaymentId: req.body.providerPaymentId || providerRef,
    });
    payment.lastWebhookEvent = "QR_PAYMENT_VERIFIED";
    payment.lastWebhookProcessedAt = new Date();
    recalculateLedger(payment);
    await payment.save();
    await syncBookingsFromPaymentLedger(payment);

    intent.status = "verified";
    intent.verifiedAt = new Date();
    await intent.save();

    return res.status(200).json({ success: true, data: { intent, ledger: buildLedgerResponse(payment) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to verify QR payment", error: error.message });
  }
};

exports.ensurePaymentLedgerForBooking = async ({ treatmentId }) => {
  if (!treatmentId) throw new Error("treatmentId is required");

  const treatment = await Treatment.findById(treatmentId);
  if (!treatment) throw new Error("Treatment not found");

  const payment = await getOrCreatePaymentLedger(treatment);
  return payment;
};
