const admin = require('firebase-admin');
const path = require('path');

// Check if already initialized
if (admin.apps.length === 0) {
  try {
    const serviceAccountPath = path.join(__dirname, 'medico-doctor-9f3aa-firebase-adminsdk-fbsvc-d5a26cb8e9.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  }
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 * @param {string} fcmToken - Recipient's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body/content
 * @param {object} [data] - Optional metadata payload
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    console.log('⚠️ No FCM token provided. Skipping notification.');
    return null;
  }

  // Convert all data values to strings as FCM payload requires string values
  const stringData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      stringData[key] = String(value);
    }
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: stringData,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('🚀 FCM push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error.message);
    return null;
  }
}

module.exports = {
  admin,
  sendPushNotification,
};
