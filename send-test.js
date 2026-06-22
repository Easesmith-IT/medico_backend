const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const Doctor = require('./models/doctorModel');
const Patient = require('./models/patientModel');
const fcm = require('./config/firebase-notify/firebase');

async function sendManualNotification() {
  const args = process.argv.slice(2);
  let targetToken = args[0];
  let targetName = 'Target Device';

  if (!targetToken) {
    console.log('No token provided. Connecting to database to find a user with an active FCM token...');
    await connectDB();

    // Check Doctor
    const doctor = await Doctor.findOne({ fcmToken: { $ne: null, $exists: true, $ne: '' } });
    if (doctor) {
      targetToken = doctor.fcmToken;
      targetName = `Dr. ${doctor.firstName} (${doctor.email})`;
    } else {
      // Check Patient
      const patient = await Patient.findOne({ fcmToken: { $ne: null, $exists: true, $ne: '' } });
      if (patient) {
        targetToken = patient.fcmToken;
        targetName = `${patient.firstName} (${patient.email})`;
      }
    }

    if (!targetToken) {
      console.log('⚠️ No users (Doctors or Patients) found with an active FCM token in the database.');
      await mongoose.connection.close();
      process.exit(1);
    }
  }

  console.log(`Sending manual push notification to: ${targetName}`);
  console.log(`FCM Token: ${targetToken}`);

  const result = await fcm.sendPushNotification(
    targetToken,
    'Manual Backend Notification',
    'This is a manually triggered push notification from your backend server.',
    { type: 'manual_test', sender: 'backend' }
  );

  console.log('Result:', result ? '✅ SUCCESS' : '❌ FAILED');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

sendManualNotification().catch(err => {
  console.error('Error:', err);
  if (mongoose.connection.readyState !== 0) {
    mongoose.connection.close();
  }
  process.exit(1);
});
