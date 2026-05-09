const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

const DB = process.env.MONGODB_URI;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

async function generateTokens() {
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const Patient = require('./models/patientModel');
  const Doctor = require('./models/doctorModel');
  const Admin = require('./models/adminModel');
  const ServiceProvider = require('./models/serviceProviderModel');
  
  const patient = await Patient.findOne({ email: 'riya.sharma@example.com' }).select('+tokenVersion').lean();
  const doctor = await Doctor.findOne({ email: 'testravi@gmail.com' }).select('+tokenVersion').lean();
  const admin = await Admin.findOne({ email: 'admin@medico.com' }).select('+tokenVersion').lean();
  const provider = await ServiceProvider.findOne({ email: 'rahull.provider@example.com' }).select('+tokenVersion').lean();
  
  function signToken(user, role) {
    const tv = user.tokenVersion || 0;
    const accessToken = jwt.sign({ id: user._id.toString(), role: role.toLowerCase(), tokenVersion: tv, type: 'access' }, ACCESS_SECRET, { expiresIn: '365d' });
    const refreshToken = jwt.sign({ id: user._id.toString(), role: role.toLowerCase(), tokenVersion: tv, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '90d' });
    return { accessToken, refreshToken, id: user._id.toString(), email: user.email, firstName: user.firstName };
  }
  
  const result = {
    patient: patient ? signToken(patient, 'patient') : null,
    doctor: doctor ? signToken(doctor, 'doctor') : null,
    admin: admin ? signToken(admin, 'superAdmin') : null,
    provider: provider ? signToken(provider, 'serviceprovider') : null,
  };
  
  const subadmin = await Admin.findOne({ role: 'subAdmin' }).select('+tokenVersion').lean();
  if (subadmin) result.subadmin = signToken(subadmin, 'subAdmin');
  
  // Also get a verified/approved doctor for protected routes
  const approvedDoctor = await Doctor.findOne({ verificationStatus: 'approved', isActive: true }).select('+tokenVersion').lean();
  if (approvedDoctor) {
    result.approvedDoctor = signToken(approvedDoctor, 'doctor');
    result.approvedDoctor.id = approvedDoctor._id.toString();
  } else {
    // fallback - use the same doctor
    result.approvedDoctor = result.doctor;
  }
  
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}
generateTokens().catch(err => { console.error(err.message); process.exit(1); });
