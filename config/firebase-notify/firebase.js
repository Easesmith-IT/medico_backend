// const admin = require('firebase-admin');
// const path = require('path');
// const fs = require('fs');

// let doctorApp = null;
// let patientApp = null;

// // Initialize Doctor app (Default App)
// if (admin.apps.length === 0) {
//   try {
//     let serviceAccount = null;

//     // 1. Try to load the dedicated Firebase Admin SDK file first (check firebase-notify/ and config/ folders dynamically)
//     const searchDirs = [__dirname, path.join(__dirname, '..')];
//     for (const dir of searchDirs) {
//       if (fs.existsSync(dir)) {
//         try {
//           const files = fs.readdirSync(dir);
//           const doctorSdkFile = files.find(f => f.startsWith('medico-doctor-') && f.endsWith('.json'));
//           if (doctorSdkFile) {
//             const sdkPath = path.join(dir, doctorSdkFile);
//             serviceAccount = JSON.parse(fs.readFileSync(sdkPath, 'utf8'));
//             break;
//           }
//         } catch (err) {
//           console.warn('⚠️ Failed to scan or parse Doctor SDK JSON file in ' + dir + ':', err.message);
//         }
//       }
//     }

//     // 2. Try to load from config/gcpbucket.json (parent folder of config/firebase-notify)
//     if (!serviceAccount) {
//       const serviceAccountPath = path.join(__dirname, '..', 'gcpbucket.json');
//       if (fs.existsSync(serviceAccountPath)) {
//         try {
//           serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
//         } catch (err) {
//           console.warn('⚠️ Failed to parse gcpbucket.json from parent directory for Doctor:', err.message);
//         }
//       }
//     }

//     // 3. Fallback to process.env.GCP_SERVICE_ACCOUNT
//     if (!serviceAccount && process.env.GCP_SERVICE_ACCOUNT) {
//       try {
//         serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
//       } catch (err) {
//         console.warn('⚠️ Failed to parse GCP_SERVICE_ACCOUNT environment variable for Doctor:', err.message);
//       }
//     }

//     // 4. Fallback to local gcpbucket.json in the same directory
//     if (!serviceAccount) {
//       const localGcpPath = path.join(__dirname, 'gcpbucket.json');
//       if (fs.existsSync(localGcpPath)) {
//         try {
//           serviceAccount = JSON.parse(fs.readFileSync(localGcpPath, 'utf8'));
//         } catch (err) {
//           console.warn('⚠️ Failed to parse local gcpbucket.json for Doctor:', err.message);
//         }
//       }
//     }

//     if (serviceAccount) {
//       doctorApp = admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//       });
//       console.log('✅ Firebase Admin SDK (Doctor/Default) initialized successfully');
//     } else {
//       console.warn('⚠️ Doctor Firebase service account credentials not found. Default app not initialized.');
//     }
//   } catch (error) {
//     console.error('❌ Firebase Admin SDK (Doctor/Default) initialization failed:', error.message);
//   }
// } else {
//   doctorApp = admin.app();
// }

// // Initialize Patient app (Named App 'patient')
// patientApp = admin.apps.find(app => app.name === 'patient');
// if (!patientApp) {
//   try {
//     let patientServiceAccount = null;

//     // 1. Try to load the dedicated Patient Firebase Admin SDK file dynamically (check firebase-notify/ and config/ folders)
//     const searchDirs = [__dirname, path.join(__dirname, '..')];
//     for (const dir of searchDirs) {
//       if (fs.existsSync(dir)) {
//         try {
//           const files = fs.readdirSync(dir);
//           const patientSdkFile = files.find(f => f.startsWith('medico-patient-') && f.endsWith('.json'));
//           if (patientSdkFile) {
//             const sdkPath = path.join(dir, patientSdkFile);
//             patientServiceAccount = JSON.parse(fs.readFileSync(sdkPath, 'utf8'));
//             break;
//           }
//         } catch (err) {
//           console.warn('⚠️ Failed to scan or parse Patient SDK JSON file in ' + dir + ':', err.message);
//         }
//       }
//     }

//     // 3. Fallback to process.env.PATIENT_GCP_SERVICE_ACCOUNT
//     if (!patientServiceAccount && process.env.PATIENT_GCP_SERVICE_ACCOUNT) {
//       try {
//         patientServiceAccount = JSON.parse(process.env.PATIENT_GCP_SERVICE_ACCOUNT);
//       } catch (err) {
//         console.warn('⚠️ Failed to parse PATIENT_GCP_SERVICE_ACCOUNT environment variable:', err.message);
//       }
//     }

//     if (patientServiceAccount) {
//       patientApp = admin.initializeApp({
//         credential: admin.credential.cert(patientServiceAccount),
//       }, 'patient');
//       console.log('✅ Firebase Admin SDK (Patient) initialized successfully');
//     } else {
//       console.warn('⚠️ Patient Firebase service account credentials not found. Patient app not initialized.');
//     }
//   } catch (error) {
//     console.error('❌ Firebase Admin SDK (Patient) initialization failed:', error.message);
//   }
// }

// /**
//  * Sends a push notification using Firebase Cloud Messaging
//  * @param {string} fcmToken - Recipient's FCM token
//  * @param {string} title - Notification title
//  * @param {string} body - Notification body/content
//  * @param {object} [data] - Optional metadata payload
//  * @param {string} [targetRole] - Recipient's role ('doctor' or 'patient')
//  */
// async function sendPushNotification(fcmToken, title, body, data = {}, targetRole = 'doctor') {
//   if (!fcmToken) {
//     console.log('⚠️ No FCM token provided. Skipping notification.');
//     return null;
//   }

//   // Convert all data values to strings as FCM payload requires string values
//   const stringData = {};
//   for (const [key, value] of Object.entries(data)) {
//     if (value !== null && value !== undefined) {
//       stringData[key] = String(value);
//     }
//   }

//   const message = {
//     token: fcmToken,
//     notification: {
//       title,
//       body,
//     },
//     data: stringData,
//   };

//   try {
//     let messagingInstance;
//     const normalizedRole = (targetRole || 'doctor').toLowerCase();

//     if (normalizedRole === 'patient') {
//       if (!patientApp) {
//         throw new Error('Patient Firebase app is not initialized');
//       }
//       messagingInstance = patientApp.messaging();
//     } else {
//       if (!doctorApp) {
//         throw new Error('Doctor/Default Firebase app is not initialized');
//       }
//       messagingInstance = doctorApp.messaging();
//     }

//     const response = await messagingInstance.send(message);
//     console.log(`🚀 FCM push notification sent successfully to ${normalizedRole}:`, response);
//     return response;
//   } catch (error) {
//     console.error(`❌ Failed to send FCM notification to ${targetRole}:`, error.message);
//     return null;
//   }
// }

// module.exports = {
//   admin,
//   doctorApp,
//   patientApp,
//   sendPushNotification,
// };



const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let doctorApp = null;
let patientApp = null;

/**
 * Safely load JSON credentials from file
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`⚠️ Failed to parse JSON file at ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Search a directory for a Firebase service account file by prefix
 */
function findServiceAccountByPrefix(prefix, searchDirs = []) {
  for (const dir of searchDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      const matchedFile = files.find(
        (file) => file.startsWith(prefix) && file.endsWith('.json')
      );

      if (matchedFile) {
        const fullPath = path.join(dir, matchedFile);
        const parsed = readJsonFile(fullPath);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn(`⚠️ Failed scanning directory ${dir}:`, err.message);
    }
  }
  return null;
}

/**
 * Load Doctor Firebase credentials
 */
function loadDoctorServiceAccount() {
  const searchDirs = [__dirname, path.join(__dirname, '..')];

  let serviceAccount =
    findServiceAccountByPrefix('medico-doctor-', searchDirs) ||
    readJsonFile(path.join(__dirname, '..', 'gcpbucket.json')) ||
    (process.env.GCP_SERVICE_ACCOUNT
      ? safelyParseEnvJson(process.env.GCP_SERVICE_ACCOUNT, 'GCP_SERVICE_ACCOUNT')
      : null) ||
    readJsonFile(path.join(__dirname, 'gcpbucket.json'));

  return serviceAccount;
}

/**
 * Load Patient Firebase credentials
 */
function loadPatientServiceAccount() {
  const searchDirs = [__dirname, path.join(__dirname, '..')];

  let serviceAccount =
    findServiceAccountByPrefix('medico-patient-', searchDirs) ||
    (process.env.PATIENT_GCP_SERVICE_ACCOUNT
      ? safelyParseEnvJson(process.env.PATIENT_GCP_SERVICE_ACCOUNT, 'PATIENT_GCP_SERVICE_ACCOUNT')
      : null);

  return serviceAccount;
}

/**
 * Parse JSON from env safely
 */
function safelyParseEnvJson(value, envName) {
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn(`⚠️ Failed to parse ${envName}:`, err.message);
    return null;
  }
}

/**
 * Initialize Doctor app
 */
function initDoctorApp() {
  try {
    const existingDefault = admin.apps.find((app) => app.name === '[DEFAULT]');
    if (existingDefault) {
      doctorApp = existingDefault;
      console.log('✅ Firebase Admin SDK (Doctor/Default) already initialized');
      return;
    }

    const doctorServiceAccount = loadDoctorServiceAccount();
    if (!doctorServiceAccount) {
      console.warn('⚠️ Doctor Firebase service account credentials not found. Default app not initialized.');
      return;
    }

    doctorApp = admin.initializeApp(
      {
        credential: admin.credential.cert(doctorServiceAccount),
      },
      '[DEFAULT]'
    );

    console.log(
      '✅ Firebase Admin SDK (Doctor/Default) initialized successfully',
      doctorServiceAccount.project_id ? `| project: ${doctorServiceAccount.project_id}` : ''
    );
  } catch (error) {
    console.error('❌ Firebase Admin SDK (Doctor/Default) initialization failed:', error.message);
  }
}

/**
 * Initialize Patient app
 */
function initPatientApp() {
  try {
    const existingPatient = admin.apps.find((app) => app.name === 'patient');
    if (existingPatient) {
      patientApp = existingPatient;
      console.log('✅ Firebase Admin SDK (Patient) already initialized');
      return;
    }

    const patientServiceAccount = loadPatientServiceAccount();
    if (!patientServiceAccount) {
      console.warn('⚠️ Patient Firebase service account credentials not found. Patient app not initialized.');
      return;
    }

    patientApp = admin.initializeApp(
      {
        credential: admin.credential.cert(patientServiceAccount),
      },
      'patient'
    );

    console.log(
      '✅ Firebase Admin SDK (Patient) initialized successfully',
      patientServiceAccount.project_id ? `| project: ${patientServiceAccount.project_id}` : ''
    );
  } catch (error) {
    console.error('❌ Firebase Admin SDK (Patient) initialization failed:', error.message);
  }
}

initDoctorApp();
initPatientApp();

/**
 * Get Firebase messaging instance
 * Prefer project/app selection by stored targetProject, not by role.
 *
 * targetProject examples:
 * - 'doctor'
 * - 'patient'
 *
 * Fallback:
 * - targetRole === 'patient' => patient app
 * - otherwise => doctor app
 */
function getMessagingInstance({ targetProject, targetRole }) {
  const normalizedProject = (targetProject || '').toLowerCase().trim();
  const normalizedRole = (targetRole || 'doctor').toLowerCase().trim();

  if (normalizedProject === 'patient') {
    if (!patientApp) {
      throw new Error('Patient Firebase app is not initialized');
    }
    return { messaging: patientApp.messaging(), appName: 'patient' };
  }

  if (normalizedProject === 'doctor') {
    if (!doctorApp) {
      throw new Error('Doctor/Default Firebase app is not initialized');
    }
    return { messaging: doctorApp.messaging(), appName: 'doctor' };
  }

  if (normalizedRole === 'patient') {
    if (!patientApp) {
      throw new Error('Patient Firebase app is not initialized');
    }
    return { messaging: patientApp.messaging(), appName: 'patient' };
  }

  if (!doctorApp) {
    throw new Error('Doctor/Default Firebase app is not initialized');
  }

  return { messaging: doctorApp.messaging(), appName: 'doctor' };
}

/**
 * Convert all data payload values to strings
 */
function normalizeFcmData(data = {}) {
  const stringData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      stringData[key] = String(value);
    }
  }
  return stringData;
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 *
 * @param {string} fcmToken
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}]
 * @param {string} [targetRole='doctor']
 * @param {string|null} [targetProject=null]  // recommended: store this in DB with token
 */
async function sendPushNotification(
  fcmToken,
  title,
  body,
  data = {},
  targetRole = 'doctor',
  targetProject = null
) {
  if (!fcmToken || typeof fcmToken !== 'string' || !fcmToken.trim()) {
    console.log('⚠️ No valid FCM token provided. Skipping notification.');
    return null;
  }

  const stringData = normalizeFcmData(data);

  const message = {
    token: fcmToken.trim(),
    notification: {
      title: title || 'New Notification',
      body: body || '',
    },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'chat_messages',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
      headers: {
        'apns-priority': '10',
      },
    },
  };

  try {
    const { messaging, appName } = getMessagingInstance({ targetProject, targetRole });

    const response = await messaging.send(message);

    console.log(`🚀 FCM push notification sent successfully via ${appName}:`, response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send FCM notification');
    console.error('targetRole:', targetRole);
    console.error('targetProject:', targetProject);
    console.error('error.code:', error.code || 'N/A');
    console.error('error.message:', error.message || 'Unknown error');

    if (error.code === 'messaging/mismatched-credential') {
      console.error(
        '⚠️ Token belongs to a different Firebase project than the credential used to send it.'
      );
    }

    if (error.code === 'messaging/registration-token-not-registered') {
      console.error(
        '⚠️ Token is no longer registered. Remove this token from DB or refresh it from client.'
      );
    }

    if (error.code === 'messaging/invalid-registration-token') {
      console.error(
        '⚠️ Invalid FCM token format. Verify token capture from client app.'
      );
    }

    return null;
  }
}

module.exports = {
  admin,
  doctorApp,
  patientApp,
  sendPushNotification,
  getMessagingInstance,
};