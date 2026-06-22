const admin = require('firebase-admin');

const serviceAccountPath = 'C:\\Users\\mansi\\Downloads\\abhicares-partner-firebase-adminsdk-fbsvc-3af2fd3066.json';
console.log('Loading credentials from:', serviceAccountPath);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
  console.log('✅ Initialization succeeded!');
  
  // Try sending a message using dryRun
  const message = {
    token: 'd8n5bV7_R3-K7c8E899vVn:APA91bE3g7c8d9e0f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3',
    notification: {
      title: 'Test Title',
      body: 'Test Body',
    },
  };
  
  admin.messaging().send(message, true)
    .then(response => {
      console.log('✅ Send (dry run) succeeded:', response);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Send (dry run) failed:', err.message, err.code);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  process.exit(1);
}
