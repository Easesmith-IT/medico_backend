const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DB = process.env.MONGODB_URI;

async function getUsers() {
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const Patient = require('./models/patientModel');
  const Doctor = require('./models/doctorModel');
  const Admin = require('./models/adminModel');
  const ServiceProvider = require('./models/serviceProviderModel');
  
  const patients = await Patient.find({ isActive: true }).select('firstName lastName email phone role isPhoneVerified').limit(5).lean();
  const doctors = await Doctor.find({ isActive: true }).select('firstName lastName email phone role verificationStatus').limit(5).lean();
  const admins = await Admin.find({}).select('firstName lastName email phone role').limit(5).lean();
  const providers = await ServiceProvider.find({ isActive: true }).select('firstName lastName email phone role').limit(5).lean();
  
  console.log(JSON.stringify({ patients, doctors, admins, providers }, null, 2));
  await mongoose.disconnect();
}
getUsers().catch(err => { console.error(err.message); process.exit(1); });
