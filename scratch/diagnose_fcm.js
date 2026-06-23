const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables
dotenv.config();

const firebase = require('../config/firebase-notify/firebase');

async function diagnoseApp(app, name, role) {
  console.log(`\n==========================================`);
  console.log(`🔍 Diagnosing Firebase App: ${name} (${role})`);
  console.log(`==========================================`);

  if (!app) {
    console.log(`❌ Error: App is NOT initialized.`);
    return false;
  }

  console.log(`✅ App initialized successfully. Project ID: ${app.options.credential.projectId || 'N/A'}`);

  // We will perform a dryRun send.
  // We use a dummy token format that mimics a real FCM token structure.
  // If the credentials are invalid, Firebase will fail with an Auth error.
  // If the credentials are valid, Firebase will process the authorization and return a token-specific error
  // (e.g., 'messaging/invalid-argument' or 'messaging/registration-token-not-registered').
  const dummyToken = 'f1_token_placeholder_for_testing_authentication_status_1234567890123456789012345678901234567890123456789012345678901234567890';
  
  const message = {
    token: dummyToken,
    notification: {
      title: 'FCM Connection Test',
      body: 'Testing Firebase credentials and authentication.'
    },
    data: {
      test: 'true'
    }
  };

  try {
    console.log(`📡 Sending test dry-run message to FCM API...`);
    // dryRun = true means it validates the message and authorization without sending a real push notification.
    const response = await app.messaging().send(message, true);
    console.log(`✅ Connection/Auth Test Succeeded (Dry-run response):`, response);
    return true;
  } catch (error) {
    console.log(`ℹ️ FCM Response received:`);
    console.log(`  - Message: ${error.message}`);
    console.log(`  - Code: ${error.code}`);
    
    // Check if the error code indicates successful authentication
    // Standard auth failures throw "messaging/authentication-error", "app/invalid-credential", etc.
    // Valid credential but invalid token throws "messaging/invalid-argument" or "messaging/registration-token-not-registered".
    const successfulAuthCodes = [
      'messaging/invalid-argument',
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token'
    ];

    const isTokenError = successfulAuthCodes.includes(error.code) || error.message.includes('registration token');

    if (isTokenError) {
      console.log(`\n🎉 SUCCESS: FCM is CONNECTED and AUTHENTICATED!`);
      console.log(`   Explanation: The Firebase API successfully verified our credentials and processed the request.`);
      console.log(`   It returned a token error because our test token is a placeholder, which confirms the channel is fully open.`);
      return true;
    } else {
      console.log(`\n❌ FAILURE: FCM Authentication failed.`);
      console.log(`   Explanation: The API request failed due to credentials, permissions, or connectivity issues.`);
      return false;
    }
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting FCM Diagnostics...');
  
  const doctorSuccess = await diagnoseApp(firebase.doctorApp, 'Doctor/Default App', 'doctor');
  const patientSuccess = await diagnoseApp(firebase.patientApp, 'Patient App', 'patient');
  
  console.log(`\n==========================================`);
  console.log(`📊 Diagnostic Summary:`);
  console.log(`  - Doctor App FCM: ${doctorSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`  - Patient App FCM: ${patientSuccess ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`==========================================`);
  
  process.exit(doctorSuccess && patientSuccess ? 0 : 1);
}

runDiagnostics().catch(err => {
  console.error('Unhandled error during diagnostics:', err);
  process.exit(1);
});
