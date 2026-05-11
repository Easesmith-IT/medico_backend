const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payController");
const { protect } = require("../middleware/auth");

router.get(
  "/treatments/:treatmentId/ledger",
  protect("patient", "serviceprovider", "admin", "superadmin", "subadmin"),
  paymentController.getTreatmentPaymentLedger
);

router.post(
  "/treatments/:treatmentId/online/order",
  protect("patient"),
  paymentController.createTreatmentOnlineOrder
);

router.post(
  "/booking/:bookingId/advance/order",
  protect("patient"),
  paymentController.createBookingAdvanceOrderCompat
);

router.post(
  "/treatments/:treatmentId/online/verify",
  protect("patient"),
  paymentController.verifyTreatmentOnlinePayment
);

router.post(
  "/treatments/:treatmentId/manual-collection",
  protect("admin", "superadmin", "subadmin"),
  paymentController.recordManualPayment
);

router.post(
  "/treatments/:treatmentId/refunds/manual",
  protect("admin", "superadmin", "subadmin"),
  paymentController.recordManualRefund
);

module.exports = router;
