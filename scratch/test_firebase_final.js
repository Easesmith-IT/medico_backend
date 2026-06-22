const fcm = require('../config/firebase-notify/firebase');

console.log('Testing sendPushNotification with configured firebase.js...');

fcm.sendPushNotification(
  'd8n5bV7_R3-K7c8E899vVn:APA91bE3g7c8d9e0f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3',
  'Final Test Title',
  'Final Test Body'
)
.then(response => {
  if (response) {
    console.log('✅ Send succeeded!');
    process.exit(0);
  } else {
    console.log('❌ Send failed (returned null/false).');
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
