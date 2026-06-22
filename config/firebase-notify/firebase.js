const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if already initialized
if (admin.apps.length === 0) {
  try {
    let serviceAccount = null;

    // Try to load from config/gcpbucket.json (parent folder of config/firebase-notify)
    const serviceAccountPath = path.join(__dirname, '..', 'gcpbucket.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      } catch (err) {
        console.warn('⚠️ Failed to parse gcpbucket.json from parent directory:', err.message);
      }
    }

    // Fallback to process.env.GCP_SERVICE_ACCOUNT
    if (!serviceAccount && process.env.GCP_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
      } catch (err) {
        console.warn('⚠️ Failed to parse GCP_SERVICE_ACCOUNT environment variable:', err.message);
      }
    }

    // Fallback to local file in the same directory (in case of other configurations)
    if (!serviceAccount) {
      const localGcpPath = path.join(__dirname, 'gcpbucket.json');
      if (fs.existsSync(localGcpPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(localGcpPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️ Failed to parse local gcpbucket.json:', err.message);
        }
      }
    }

    // Fallback to specific SDK file inside firebase-notify folder
    if (!serviceAccount) {
      const sdkPath = path.join(__dirname, 'medico-doctor-9f3aa-firebase-adminsdk-fbsvc-d5a26cb8e9.json');
      if (fs.existsSync(sdkPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(sdkPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️ Failed to parse SDK JSON file:', err.message);
        }
      }
    }

    if (!serviceAccount) {
      throw new Error('Service account file (gcpbucket.json) or GCP_SERVICE_ACCOUNT environment variable not found.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
