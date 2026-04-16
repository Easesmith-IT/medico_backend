const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payController");
const { protect } = require("../middleware/auth");

router.post(
  "/booking/:bookingId/advance/order",
  protect(["patient"]),
  paymentController.createBookingAdvanceOrder  
);

router.post(
  "/booking/:bookingId/advance/verify", 
  protect(["patient"]),
  paymentController.verifyBookingAdvancePayment
);

router.post(
  "/booking/:bookingId/final/order",
  protect(["patient"]),
  paymentController.createCompletionDueOrder
);

router.post(
  "/booking/:bookingId/final/verify",
  protect(["patient"]),
  paymentController.verifyCompletionDuePayment
);

module.exports = router;



