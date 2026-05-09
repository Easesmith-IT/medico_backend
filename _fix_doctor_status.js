const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixDoctor() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const Doctor = require('./models/doctorModel');
  
  // Toggle the test doctor back to active
  const doc = await Doctor.findByIdAndUpdate(
    '6984506e772be643087318b0',
    { isActive: true, verificationStatus: 'approved' },
    { new: true }
  ).select('firstName isActive verificationStatus');
  
  console.log('Doctor updated:', doc?.firstName, 'active:', doc?.isActive, 'status:', doc?.verificationStatus);
  
  // Also enable the other doctor
  await Doctor.findByIdAndUpdate('6986e431ccdcddc78d94b5bf', { isActive: true }).select('firstName isActive');
  
  await mongoose.disconnect();
}
fixDoctor().catch(err => { console.error(err.message); process.exit(1); });
