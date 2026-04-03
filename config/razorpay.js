const Razorpay = require("razorpay");
require("dotenv").config();

if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
  throw new Error("RAZORPAY_API_KEY or RAZORPAY_API_SECRET missing in .env");
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

module.exports = razorpayInstance;