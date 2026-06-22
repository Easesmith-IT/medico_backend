const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const DB = process.env.MONGODB_URI;

async function checkTokens() {
  console.log('Connecting to DB:', DB);
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const Patient = require('../models/patientModel');
  const Doctor = require('../models/doctorModel');
  
  const patientsWithToken = await Patient.find({ fcmToken: { $exists: true, $ne: null } }).select('firstName lastName fcmToken');
  const doctorsWithToken = await Doctor.find({ fcmToken: { $exists: true, $ne: null } }).select('firstName lastName fcmToken');
  
  console.log('Patients with FCM token:', patientsWithToken.length);
  patientsWithToken.forEach(p => console.log(`Patient: ${p.firstName} ${p.lastName}, Token: ${p.fcmToken ? p.fcmToken.substring(0, 20) + '...' : 'none'}`));
  
  console.log('Doctors with FCM token:', doctorsWithToken.length);
  doctorsWithToken.forEach(d => console.log(`Doctor: ${d.firstName} ${d.lastName}, Token: ${d.fcmToken ? d.fcmToken.substring(0, 20) + '...' : 'none'}`));
  
  await mongoose.disconnect();
}

checkTokens().catch(err => {
  console.error(err);
  process.exit(1);
});
