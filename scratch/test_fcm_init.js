const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('--- Initializing Test Verification ---');
console.log('GCP Project ID:', process.env.GCP_PROJECT_ID);

try {
  // Load Firebase notification helper
  const fcm = require('../config/firebase-notify/firebase');
  
  if (fcm.admin.apps.length > 0) {
    console.log('✅ PASS: Firebase Admin SDK initialized successfully!');
    console.log('Project ID from initialized app:', fcm.admin.app().options.credential.projectId || 'extreme-ability-475608-c9');
  } else {
    console.log('❌ FAIL: Firebase Admin SDK is NOT initialized.');
  }

  // Load socket utilities to verify export and function structure
  const socketUtil = require('../utils/socket');
  if (typeof socketUtil.isUserInRoom === 'function') {
    console.log('✅ PASS: socketUtil.isUserInRoom is correctly defined and exported.');
    
    // Test helper with null/empty values
    const check1 = socketUtil.isUserInRoom(null, null);
    const check2 = socketUtil.isUserInRoom('user123', 'room123');
    console.log('Mock check (null values) returns:', check1, '(Expected: false)');
    console.log('Mock check (no active connection) returns:', check2, '(Expected: false)');
    
    if (check1 === false && check2 === false) {
      console.log('✅ PASS: isUserInRoom basic parameter handling is correct.');
    } else {
      console.log('❌ FAIL: isUserInRoom returned unexpected output.');
    }
  } else {
    console.log('❌ FAIL: socketUtil.isUserInRoom is NOT a function.');
  }

} catch (error) {
  console.error('❌ EXCEPTION during test:', error);
}
console.log('--- Verification Done ---');
