// utils/otpUtils.js

const axios = require('axios');
const otpGenerator = require('otp-generator');
const otpSchema = require('../models/otpModel');

/**
 * Send OTP via SMS to any user (Doctor, Patient, Admin)
 * @param {string} phone - Phone number to send OTP
 * @returns {Promise<boolean>} - True if OTP sent successfully, false otherwise
 */
const sendOtp = async (phone) => {
  try {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    console.log(phone, '📱 Sending OTP to phone');

    // Generate 4-digit OTP
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
      lowerCaseAlphabets: false,
    });

    console.log(otp, ' Generated OTP');

    // Construct the message
    const message = `Your One-Time Login Password OTP for Medico is: ${otp}. It is valid for 5 minutes only. Please do not share this OTP with anyone.`;

    // Construct the API URL
    const apiUrl = `https://manage.txly.in/vb/apikey.php?apikey=${process.env.API_KEY_OTP}&senderid=${process.env.SENDER_ID}&templateid=${process.env.TEMPLATE_ID}&number=${phone}&message=${encodeURIComponent(message)}`;

    console.log('Sending OTP via SMS API...');

    // Send the OTP via SMS API
    const apiResponse = await axios.get(apiUrl);

    console.log(' API Response:', apiResponse.status);

    // Check if the API request was successful
    if (apiResponse.status !== 200) {
      console.log(' Failed to send OTP:', apiResponse.data);
      return false;
    }

    // Define the OTP expiration time (5 minutes)
    const expirationTimeframe = 5 * 60 * 1000;
    const otpExpiresAt = new Date(Date.now() + expirationTimeframe);

    // Check if an OTP already exists for the phone number
    const existingOtpDoc = await otpSchema.findOne({ phone });

    if (existingOtpDoc) {
      // Update existing OTP
      existingOtpDoc.otp = otp;
      existingOtpDoc.otpExpiresAt = otpExpiresAt;
      existingOtpDoc.attempts = 0;
      await existingOtpDoc.save();
      console.log(' OTP updated for existing phone');
    } else {
      // Create a new OTP document
      const otpDoc = new otpSchema({
        phone,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
        attempts: 0,
      });
      await otpDoc.save();
      console.log(' New OTP created');
    }

    return true;
  } catch (err) {
    console.error(' Error sending OTP:', err.message);
    return false;
  }
};

/**
 * Verify OTP for any user (Doctor, Patient, Admin)
 * @param {string} phone - Phone number to verify OTP
 * @param {string} enteredOTP - OTP entered by user
 * @returns {Promise<boolean>} - True if OTP is valid, false otherwise
 */
const verifyOtp = async (phone, enteredOTP) => {
  try {
    if (!phone || !enteredOTP) {
      throw new Error('Phone number and OTP are required');
    }

    console.log(phone, ' Verifying OTP for phone');

    // Find the OTP document for the provided phone number
    const otpDoc = await otpSchema.findOne({ phone });

    // Check if the OTP document exists
    if (!otpDoc) {
      console.log(' No OTP found for this phone');
      return false;
    }

    // Check if OTP is null (already used)
    if (!otpDoc.otp) {
      console.log(' OTP already used');
      return false;
    }

    // Compare the entered OTP with the stored OTP
    if (Number(enteredOTP) !== Number(otpDoc.otp)) {
      // Increment attempts
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;

      console.log(` OTP mismatch. Attempts: ${otpDoc.attempts}`);

      // Delete if too many attempts (5)
      if (otpDoc.attempts >= 5) {
        await otpSchema.deleteOne({ phone });
        console.log('Too many attempts - OTP deleted');
      } else {
        await otpDoc.save();
      }

      return false;
    }

    // Check if the OTP has expired
    const currentTime = new Date().getTime();
    if (currentTime > otpDoc.otpExpiresAt.getTime()) {
      await otpSchema.deleteOne({ phone });
      console.log(' OTP expired');
      return false;
    }

    // Delete the OTP after successful verification
    await otpSchema.deleteOne({ phone });

    console.log(' OTP verified successfully');
    return true;
  } catch (err) {
    console.error(' Error verifying OTP:', err.message);
    return false;
  }
};

/**
 * Resend OTP to a phone number
 * @param {string} phone - Phone number to resend OTP
 * @returns {Promise<boolean>} - True if OTP resent successfully
 */
const resendOtp = async (phone) => {
  try {
    console.log(phone, '📱 Resending OTP');

    // Delete existing OTP
    await otpSchema.deleteOne({ phone });
    console.log('🗑️  Deleted old OTP');

    // Send new OTP
    const sent = await sendOtp(phone);

    if (!sent) {
      console.log(' Failed to resend OTP');
      return false;
    }

    console.log(' OTP resent successfully');
    return true;
  } catch (err) {
    console.error(' Error resending OTP:', err.message);
    return false;
  }
};

/**
 * Clear OTP for a phone number (e.g., after logout)
 * @param {string} phone - Phone number
 * @returns {Promise<boolean>}
 */
const clearOtp = async (phone) => {
  try {
    await otpSchema.deleteOne({ phone });
    console.log(`  OTP cleared for ${phone}`);
    return true;
  } catch (err) {
    console.error(' Error clearing OTP:', err.message);
    return false;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  clearOtp
};
