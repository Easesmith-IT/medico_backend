// controllers/bookingPaymentController.js
const crypto = require("crypto");
const Booking = require("../models/bookingModel");
const razorpay = require("../config/razorpay");
const { normalizeAmount, derivePaymentStatus } = require("../utils/bookingPayment");

// exports.createBookingAdvanceOrder = async (req, res) => {
//   try {
//     const { bookingId, amount } = req.body;

//     if (!bookingId || amount === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "bookingId and amount are required",
//       });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const requestedAmount = normalizeAmount(amount);
//     const totalAmount = normalizeAmount(booking.pricing?.totalAmount || 0);

//     if (requestedAmount <= 0 || requestedAmount > totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking advance amount",
//       });
//     }

//     const order = await razorpay.orders.create({
//       amount: Math.round(requestedAmount * 100),
//       currency: "INR",
//       receipt: `booking_advance_${booking._id}`,
//       notes: {
//         bookingId: String(booking._id),
//         paymentStage: "Booking",
//       },
//     });

//     booking.razorpayOrderId = order.id;
//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Advance payment order created successfully",
//       data: {
//         key: process.env.RAZORPAY_API_KEY,
//         orderId: order.id,
//         amount: requestedAmount,
//         currency: order.currency,
//         bookingId: booking._id,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create booking advance payment order",
//       error: error.message,
//     });
//   }
// };

// exports.verifyBookingAdvancePayment = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       amount,
//       paymentMethod = "Online",
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     if (
//       !bookingId ||
//       !amount ||
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "bookingId, amount, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
//       });
//     }

//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const incomingAmount = normalizeAmount(amount);
//     const totalAmount = normalizeAmount(booking.pricing?.totalAmount || 0);
//     const updatedPaidAmount = normalizeAmount(
//       Number(booking.paidAmount || 0) + incomingAmount
//     );

//     if (updatedPaidAmount > totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Paid amount cannot exceed total booking amount",
//       });
//     }

//     const paymentSummary = derivePaymentStatus({
//       totalAmount,
//       paidAmount: updatedPaidAmount,
//     });

//     booking.razorpayOrderId = razorpay_order_id;
//     booking.razorpayPaymentId = razorpay_payment_id;
//     booking.razorpaySignature = razorpay_signature;
//     booking.paymentMethod = paymentMethod;
//     booking.advanceAmount = normalizeAmount(
//       Number(booking.advanceAmount || 0) + incomingAmount
//     );
//     booking.paidAmount = paymentSummary.paidAmount;
//     booking.dueAmount = paymentSummary.dueAmount;
//     booking.paymentStatus = paymentSummary.paymentStatus;
//     booking.isAdvancePaid = paymentSummary.isAdvancePaid;
//     booking.isFinalPaymentDone = paymentSummary.isFinalPaymentDone;

//     booking.paymentHistory.push({
//       amount: incomingAmount,
//       method: paymentMethod,
//       stage: "Booking",
//       razorpayOrderId: razorpay_order_id,
//       razorpayPaymentId: razorpay_payment_id,
//       note: "Advance payment verified",
//     });

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Advance payment verified successfully",
//       data: booking,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify booking advance payment",
//       error: error.message,
//     });
//   }
// };

exports.createBookingAdvanceOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "bookingId and amount are required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // only temporary/pending bookings should be allowed
    if (!["Temporary", "PendingPayment"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking is not eligible for advance payment",
      });
    }

    const requestedAmount = normalizeAmount(amount);
    const totalAmount = normalizeAmount(booking.pricing?.totalAmount || 0);

    if (requestedAmount <= 0 || requestedAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking advance amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(requestedAmount * 100),
      currency: "INR",
      receipt: `booking_advance_${booking._id}`,
      notes: {
        bookingId: String(booking._id),
        paymentStage: "Booking",
      },
    });

    booking.razorpayOrderId = order.id;
    booking.advanceAmount = requestedAmount;
    booking.status = "PendingPayment"; // temporary booking moved to payment pending
    booking.paymentStatus = "Unpaid";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Advance payment order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        bookingStatus: booking.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking advance payment order",
      error: error.message,
    });
  }
};


exports.verifyBookingAdvancePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "bookingId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log("booking-log", booking);
    console.log("razorpay_order_id", razorpay_order_id);
    

    // if (booking.lastRazorpayOrderId !== razorpay_order_id) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid order id for this booking",
    //   });
    // }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const paidAmount = Number(booking.advanceAmount || 0);
    const totalAmount = Number(booking.pricing?.totalAmount || 0);
    const dueAmount = Math.max(totalAmount - paidAmount, 0);

    booking.status = "Confirmed";
    booking.paidAmount = paidAmount;
    booking.dueAmount = dueAmount;
    booking.paymentStatus = dueAmount === 0 ? "Paid" : "Partially Paid";
    booking.paymentMethod = "Online";
    booking.isAdvancePaid = true;
    booking.isFinalPaymentDone = dueAmount === 0;
    booking.lastRazorpayPaymentId = razorpay_payment_id;
    booking.paymentHistory = [
      ...(booking.paymentHistory || []),
      {
        amount: paidAmount,
        method: "Online",
        stage: "Booking",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        note: "Advance payment completed successfully",
        paidAt: new Date(),
      },
    ];

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking confirmed after successful advance payment",
      data: {
        bookingId: booking._id,
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        dueAmount: booking.dueAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify booking advance payment",
      error: error.message,
    });
  }
};

// exports.verifyBookingAdvancePayment = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "bookingId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
//       });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     if (booking.razorpayOrderId !== razorpay_order_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid order id for this booking",
//       });
//     }

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(`${booking.razorpayOrderId}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }

//     const paidAmount = normalizeAmount(booking.advanceAmount || 0);
//     const totalAmount = normalizeAmount(booking.pricing?.totalAmount || 0);
//     const dueAmount = Math.max(totalAmount - paidAmount, 0);

//     booking.status = "Confirmed";
//     booking.paidAmount = paidAmount;
//     booking.dueAmount = dueAmount;
//     booking.paymentStatus = dueAmount === 0 ? "Paid" : "Partially Paid";
//     booking.paymentMethod = "Online";
//     booking.isAdvancePaid = true;
//     booking.isFinalPaymentDone = dueAmount === 0;
//     booking.paymentHistory = [
//       ...(booking.paymentHistory || []),
//       {
//         amount: paidAmount,
//         method: "Online",
//         stage: "Booking",
//         razorpayOrderId: razorpay_order_id,
//         razorpayPaymentId: razorpay_payment_id,
//         note: "Advance payment completed successfully",
//         paidAt: new Date(),
//       },
//     ];

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Booking confirmed after successful advance payment",
//       data: {
//         bookingId: booking._id,
//         bookingStatus: booking.status,
//         paymentStatus: booking.paymentStatus,
//         paidAmount: booking.paidAmount,
//         dueAmount: booking.dueAmount,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify booking advance payment",
//       error: error.message,
//     });
//   }
// };








// exports.verifyBookingAdvancePayment = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature",
//       });
//     }

//     booking.lastRazorpayOrderId = razorpay_order_id;
//     booking.lastRazorpayPaymentId = razorpay_payment_id;
//     booking.paymentMethod = "Online";
//     booking.isAdvancePaid = booking.paidAmount > 0;

//     if (booking.paymentHistory?.length > 0) {
//       booking.paymentHistory[0].razorpayOrderId = razorpay_order_id;
//       booking.paymentHistory[0].razorpayPaymentId = razorpay_payment_id;
//       booking.paymentHistory[0].note = "Advance payment verified successfully";
//     } else {
//       booking.paymentHistory = [
//         {
//           amount: booking.paidAmount,
//           method: "Online",
//           stage: "Booking",
//           razorpayOrderId: razorpay_order_id,
//           razorpayPaymentId: razorpay_payment_id,
//           note: "Advance payment verified successfully",
//           paidAt: new Date(),
//         },
//       ];
//     }

//     await booking.save();

//     const updatedBooking = await Booking.findById(bookingId)
//       .populate("city", "name latitude longitude")
//       .populate("treatmentId", "status validTill");

//     return res.status(200).json({
//       success: true,
//       message: "Advance payment verified successfully",
//       data: {
//         booking: updatedBooking,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Payment verification failed",
//       error: error.message,
//     });
//   }
// };
exports.createCompletionDueOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Remaining payment can be collected only after booking completion",
      });
    }

    const dueAmount = normalizeAmount(booking.dueAmount);
    if (dueAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No due amount remaining",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(dueAmount * 100),
      currency: "INR",
      receipt: `booking_final_${booking._id}`,
      notes: {
        bookingId: String(booking._id),
        paymentStage: "TreatmentCompletion",
      },
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Final payment order created successfully",
      data: {
        key: process.env.RAZORPAY_API_KEY,
        orderId: order.id,
        amount: dueAmount,
        currency: order.currency,
        bookingId: booking._id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create final payment order",
      error: error.message,
    });
  }
};

exports.verifyCompletionDuePayment = async (req, res) => {
  try {
    const {
      bookingId,
      paymentMethod = "Online",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "bookingId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Final payment is allowed only after booking completion",
      });
    }

    const finalDueAmount = normalizeAmount(booking.dueAmount);
    if (finalDueAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Booking has no pending payment",
      });
    }

    const totalAmount = normalizeAmount(booking.pricing?.totalAmount || 0);
    const updatedPaidAmount = normalizeAmount(
      Number(booking.paidAmount || 0) + finalDueAmount
    );

    const paymentSummary = derivePaymentStatus({
      totalAmount,
      paidAmount: updatedPaidAmount,
    });

    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentMethod = paymentMethod;
    booking.paidAmount = paymentSummary.paidAmount;
    booking.dueAmount = paymentSummary.dueAmount;
    booking.paymentStatus = paymentSummary.paymentStatus;
    booking.isAdvancePaid = paymentSummary.isAdvancePaid;
    booking.isFinalPaymentDone = paymentSummary.isFinalPaymentDone;

    booking.paymentHistory.push({
      amount: finalDueAmount,
      method: paymentMethod,
      stage: "TreatmentCompletion",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      note: "Final payment collected after treatment completion",
    });

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Final payment verified successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify final payment",
      error: error.message,
    });
  }
};



