// utils/otpUtils.js

const axios = require('axios');
const otpSchema = require('../models/otpModel');

/**
 * Format phone number for Textlocal SMS gateway
 */
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  
  // Return just the 10-digit number without country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2); // Remove 91
  }
  
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  if (cleaned.startsWith('91')) {
    return cleaned.substring(2);
  }
  
  throw new Error(`Invalid phone number format: ${phone}`);
};

/**
 * Validate phone number
 */
const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10 && cleaned.match(/^[6-9]\d{9}$/)) {
    return true;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return true;
  }
  
  return false;
};

/**
 * Send OTP via Textlocal SMS Gateway
 * @param {string} phone - Phone number to send OTP
 * @returns {Promise<boolean>}
 */
const sendOtp = async (phone) => {
  try {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    console.log('');
    console.log('SENDING OTP - TEXTLOCAL GATEWAY');
    console.log('='.repeat(60));
    console.log(`Phone Number: ${phone}`);

    if (!validatePhoneNumber(phone)) {
      console.error(`ERROR: Invalid phone number format: ${phone}`);
      throw new Error('Phone number must be a valid 10-digit Indian number');
    }
    console.log('SUCCESS: Phone number validated');

    const formattedPhone = formatPhoneNumber(phone);
    console.log(`SUCCESS: Formatted phone: ${formattedPhone}`);

    const apiKey = process.env.API_KEY_OTP;
    const senderId = process.env.SENDER_ID;
    const templateId = process.env.TEMPLATE_ID;

    if (!apiKey || !senderId || !templateId) {
      console.error('ERROR: Missing SMS credentials in .env file');
      console.error(`  API_KEY_OTP: ${apiKey ? 'SET' : 'MISSING'}`);
      console.error(`  SENDER_ID: ${senderId ? 'SET' : 'MISSING'}`);
      console.error(`  TEMPLATE_ID: ${templateId ? 'SET' : 'MISSING'}`);
      throw new Error('SMS gateway configuration incomplete');
    }
    console.log('SUCCESS: API credentials verified');
    console.log(`  API Key: ${apiKey.substring(0, 5)}***`);
    console.log(`  Sender ID: ${senderId}`);
    console.log(`  Template ID: ${templateId}`);

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`SUCCESS: Generated OTP: ${otp}`);

    // CRITICAL: Match the exact approved template format
    // Your template expects: "Your One Time Password (OTP) for CodIntern is: {OTP} It is valid for 15 minutes only. Please do not share this OTP with anyone. CODINTERN PRIVATE LIMITED"
    const message = `Your One Time Password (OTP) for CodIntern is: ${otp} It is valid for 15 minutes only. Please do not share this OTP with anyone. CODINTERN PRIVATE LIMITED`;
    console.log(`SUCCESS: Message constructed (${message.length} chars)`);
    console.log(`Message: ${message}`);

    console.log('');
    console.log('Sending to Textlocal Gateway...');
    console.log('Endpoint: https://manage.txly.in/vb/apikey.php');
    console.log('Method: GET');

    // Build URL with proper formatting
    const apiUrl = `https://manage.txly.in/vb/apikey.php?apikey=${apiKey}&senderid=${senderId}&templateid=${templateId}&number=${formattedPhone}&message=${encodeURIComponent(message)}`;

    console.log('');
    console.log('URL:', apiUrl);
    console.log('');

    const apiResponse = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Medico-Backend/1.0',
        'Accept': 'application/json'
      }
    });

    console.log('');
    console.log(`API Response Status: ${apiResponse.status}`);
    console.log('Response Data:', JSON.stringify(apiResponse.data, null, 2));

    if (apiResponse.status !== 200) {
      console.error(`ERROR: Failed to send OTP - Status ${apiResponse.status}`);
      return false;
    }

    // Check for error in response
    const responseStr = JSON.stringify(apiResponse.data).toLowerCase();
    if (responseStr.includes('error') || 
        responseStr.includes('failed') || 
        responseStr.includes('invalid')) {
      console.error('ERROR: SMS API returned error:', apiResponse.data);
      return false;
    }

    console.log('SUCCESS: SMS sent successfully via Textlocal');

    // Set OTP expiration (15 minutes to match template)
    const expirationTimeframe = 15 * 60 * 1000;
    const otpExpiresAt = new Date(Date.now() + expirationTimeframe);

    // Save to database
    const existingOtpDoc = await otpSchema.findOne({ phone });

    if (existingOtpDoc) {
      existingOtpDoc.otp = otp;
      existingOtpDoc.otpExpiresAt = otpExpiresAt;
      existingOtpDoc.attempts = 0;
      existingOtpDoc.sentAt = new Date();
      existingOtpDoc.deliveryStatus = 'sent';
      await existingOtpDoc.save();
      console.log('SUCCESS: OTP updated in database');
    } else {
      const otpDoc = new otpSchema({
        phone,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
        attempts: 0,
        sentAt: new Date(),
        deliveryStatus: 'sent'
      });
      await otpDoc.save();
      console.log('SUCCESS: New OTP created in database');
    }

    console.log('='.repeat(60));
    console.log('');
    return true;

  } catch (err) {
    console.error('');
    console.error('ERROR SENDING OTP');
    console.error('='.repeat(60));
    console.error(`Error Message: ${err.message}`);
    console.error(`Error Code: ${err.code}`);
    if (err.response) {
      console.error(`Response Status: ${err.response.status}`);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('='.repeat(60));
    console.error('');
    return false;
  }
};

/**
 * Verify OTP
 */
const verifyOtp = async (phone, enteredOTP) => {
  try {
    if (!phone || !enteredOTP) {
      throw new Error('Phone number and OTP are required');
    }

    console.log('');
    console.log('VERIFYING OTP');
    console.log('='.repeat(60));
    console.log(`Phone: ${phone}`);

    if (!validatePhoneNumber(phone)) {
      console.error('ERROR: Invalid phone format');
      return false;
    }

    const otpDoc = await otpSchema.findOne({ phone });

    if (!otpDoc) {
      console.log('ERROR: No OTP found for this phone');
      return false;
    }

    if (!otpDoc.otp) {
      console.log('ERROR: OTP already used');
      return false;
    }

    if (Number(enteredOTP) !== Number(otpDoc.otp)) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      console.log(`ERROR: OTP mismatch (Attempt ${otpDoc.attempts}/5)`);

      if (otpDoc.attempts >= 5) {
        await otpSchema.deleteOne({ phone });
        console.log('BLOCKED: Too many attempts - OTP deleted');
      } else {
        await otpDoc.save();
      }
      return false;
    }

    const currentTime = new Date().getTime();
    if (currentTime > otpDoc.otpExpiresAt.getTime()) {
      await otpSchema.deleteOne({ phone });
      console.log('ERROR: OTP expired');
      return false;
    }

    await otpSchema.deleteOne({ phone });
    console.log('SUCCESS: OTP verified successfully');
    console.log('='.repeat(60));
    console.log('');
    return true;

  } catch (err) {
    console.error(`ERROR: Verifying OTP: ${err.message}`);
    return false;
  }
};

/**
 * Resend OTP
 */
const resendOtp = async (phone) => {
  try {
    console.log('');
    console.log('RESENDING OTP');
    console.log('='.repeat(60));
    console.log(`Phone: ${phone}`);

    await otpSchema.deleteOne({ phone });
    console.log('DELETED: Old OTP removed');

    const sent = await sendOtp(phone);
    return sent;

  } catch (err) {
    console.error(`ERROR: Resending OTP: ${err.message}`);
    return false;
  }
};

/**
 * Clear OTP
 */
const clearOtp = async (phone) => {
  try {
    await otpSchema.deleteOne({ phone });
    console.log(`SUCCESS: OTP cleared for ${phone}`);
    return true;
  } catch (err) {
    console.error(`ERROR: Clearing OTP: ${err.message}`);
    return false;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  clearOtp,
  formatPhoneNumber,
  validatePhoneNumber
};
