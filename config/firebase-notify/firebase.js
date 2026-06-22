const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let doctorApp = null;
let patientApp = null;

// Initialize Doctor app (Default App)
if (admin.apps.length === 0) {
  try {
    let serviceAccount = null;

    // 1. Try to load the dedicated Firebase Admin SDK file first
    const sdkPath = path.join(__dirname, 'medico-doctor-9f3aa-firebase-adminsdk-fbsvc-d5a26cb8e9.json');
    if (fs.existsSync(sdkPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(sdkPath, 'utf8'));
      } catch (err) {
        console.warn('⚠️ Failed to parse Doctor SDK JSON file:', err.message);
      }
    }

    // 2. Try to load from config/gcpbucket.json (parent folder of config/firebase-notify)
    if (!serviceAccount) {
      const serviceAccountPath = path.join(__dirname, '..', 'gcpbucket.json');
      if (fs.existsSync(serviceAccountPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️ Failed to parse gcpbucket.json from parent directory for Doctor:', err.message);
        }
      }
    }

    // 3. Fallback to process.env.GCP_SERVICE_ACCOUNT
    if (!serviceAccount && process.env.GCP_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
      } catch (err) {
        console.warn('⚠️ Failed to parse GCP_SERVICE_ACCOUNT environment variable for Doctor:', err.message);
      }
    }

    // 4. Fallback to local gcpbucket.json in the same directory
    if (!serviceAccount) {
      const localGcpPath = path.join(__dirname, 'gcpbucket.json');
      if (fs.existsSync(localGcpPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(localGcpPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️ Failed to parse local gcpbucket.json for Doctor:', err.message);
        }
      }
    }

    if (serviceAccount) {
      doctorApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK (Doctor/Default) initialized successfully');
    } else {
      console.warn('⚠️ Doctor Firebase service account credentials not found. Default app not initialized.');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK (Doctor/Default) initialization failed:', error.message);
  }
} else {
  doctorApp = admin.app();
}

// Initialize Patient app (Named App 'patient')
patientApp = admin.apps.find(app => app.name === 'patient');
if (!patientApp) {
  try {
    let patientServiceAccount = null;

    // 1. Try to load from firebase-notify folder
    const patientSdkPath = path.join(__dirname, 'medico-patient-firebase-adminsdk-fbsvc-f6fe1f9a92.json');
    if (fs.existsSync(patientSdkPath)) {
      try {
        patientServiceAccount = JSON.parse(fs.readFileSync(patientSdkPath, 'utf8'));
      } catch (err) {
        console.warn('⚠️ Failed to parse Patient SDK JSON file from local folder:', err.message);
      }
    }

    // 2. Try to load from parent folder (config/)
    if (!patientServiceAccount) {
      const parentPatientSdkPath = path.join(__dirname, '..', 'medico-patient-firebase-adminsdk-fbsvc-f6fe1f9a92.json');
      if (fs.existsSync(parentPatientSdkPath)) {
        try {
          patientServiceAccount = JSON.parse(fs.readFileSync(parentPatientSdkPath, 'utf8'));
        } catch (err) {
          console.warn('⚠️ Failed to parse Patient SDK JSON file from parent folder:', err.message);
        }
      }
    }

    // 3. Fallback to process.env.PATIENT_GCP_SERVICE_ACCOUNT
    if (!patientServiceAccount && process.env.PATIENT_GCP_SERVICE_ACCOUNT) {
      try {
        patientServiceAccount = JSON.parse(process.env.PATIENT_GCP_SERVICE_ACCOUNT);
      } catch (err) {
        console.warn('⚠️ Failed to parse PATIENT_GCP_SERVICE_ACCOUNT environment variable:', err.message);
      }
    }

    if (patientServiceAccount) {
      patientApp = admin.initializeApp({
        credential: admin.credential.cert(patientServiceAccount),
      }, 'patient');
      console.log('✅ Firebase Admin SDK (Patient) initialized successfully');
    } else {
      console.warn('⚠️ Patient Firebase service account credentials not found. Patient app not initialized.');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK (Patient) initialization failed:', error.message);
  }
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 * @param {string} fcmToken - Recipient's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body/content
 * @param {object} [data] - Optional metadata payload
 * @param {string} [targetRole] - Recipient's role ('doctor' or 'patient')
 */
async function sendPushNotification(fcmToken, title, body, data = {}, targetRole = 'doctor') {
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
    let messagingInstance;
    const normalizedRole = (targetRole || 'doctor').toLowerCase();

    if (normalizedRole === 'patient') {
      if (!patientApp) {
        throw new Error('Patient Firebase app is not initialized');
      }
      messagingInstance = patientApp.messaging();
    } else {
      if (!doctorApp) {
        throw new Error('Doctor/Default Firebase app is not initialized');
      }
      messagingInstance = doctorApp.messaging();
    }

    const response = await messagingInstance.send(message);
    console.log(`🚀 FCM push notification sent successfully to ${normalizedRole}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Failed to send FCM notification to ${targetRole}:`, error.message);
    return null;
  }
}

module.exports = {
  admin,
  doctorApp,
  patientApp,
  sendPushNotification,
};
