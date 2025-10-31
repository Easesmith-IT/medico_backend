const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    otp: {
      type: Number,
      required: [true, 'OTP is required']
    },
    otpExpiresAt: {
      type: Date,
      required: [true, 'OTP expiry time is required'],
      index: { expires: 0 } // Auto-delete expired OTPs
    },
    type: {
      type: String,
      enum: ['general', 'signup', 'login', 'reset'],
      default: 'general'
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    userId: mongoose.Schema.Types.ObjectId
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', otpSchema);
