const express = require("express");
const { protect } = require("../middleware/auth");
const adminPaymentController = require("../controller/adminPaymentController");

const router = express.Router();

const readRoles = ["admin", "superadmin", "subadmin"];
const mutateRoles = ["superadmin", "subadmin"];

router.get(
  "/ledgers",
  protect(...readRoles),
  adminPaymentController.listPaymentLedgers
);

router.get(
  "/ledgers/:paymentId",
  protect(...readRoles),
  adminPaymentController.getPaymentLedgerDetail
);

router.get(
  "/transactions",
  protect(...readRoles),
  adminPaymentController.listTransactions
);

router.get(
  "/refunds",
  protect(...readRoles),
  adminPaymentController.listRefunds
);

router.post(
  "/treatments/:treatmentId/manual-collection",
  protect(...mutateRoles),
  adminPaymentController.adminManualCollection
);

router.post(
  "/treatments/:treatmentId/refunds/manual",
  protect(...mutateRoles),
  adminPaymentController.adminManualRefund
);

router.post(
  "/settlements",
  protect(...mutateRoles),
  adminPaymentController.createSettlementRequest
);

router.get(
  "/settlements",
  protect(...readRoles),
  adminPaymentController.listSettlementRequests
);

router.patch(
  "/settlements/:settlementId/status",
  protect(...mutateRoles),
  adminPaymentController.updateSettlementStatus
);

router.post(
  "/disputes",
  protect(...mutateRoles),
  adminPaymentController.createDisputeCase
);

router.get(
  "/disputes",
  protect(...readRoles),
  adminPaymentController.listDisputes
);

router.patch(
  "/disputes/:disputeId/status",
  protect(...mutateRoles),
  adminPaymentController.updateDisputeStatus
);

router.get(
  "/summary",
  protect(...readRoles),
  adminPaymentController.getPaymentsSummary
);

router.get(
  "/export",
  protect(...readRoles),
  adminPaymentController.exportPaymentsData
);

module.exports = router;

