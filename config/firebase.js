const admin = require('firebase-admin');
const serviceAccount = require('./firebase-notifydr/medico-doctor-9f3aa-firebase-adminsdk-fbsvc-d5a26cb8e9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;