// Generate tokens directly from DB for testing
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

const DB = process.env.MONGODB_URI;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key';

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
    const accessToken = jwt.sign({ id: user._id.toString(), role, tokenVersion: tv }, ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ id: user._id.toString(), role, tokenVersion: tv }, REFRESH_TOKEN_SECRET, { expiresIn: '365d' });
    return { accessToken, refreshToken, id: user._id.toString(), email: user.email, firstName: user.firstName };
  }
  
  const result = {
    patient: patient ? signToken(patient, 'patient') : null,
    doctor: doctor ? signToken(doctor, 'doctor') : null,
    admin: admin ? signToken(admin, 'superAdmin') : null,
    provider: provider ? signToken(provider, 'serviceprovider') : null,
    subadmin: null
  };
  
  // Get a subadmin too
  const subadmin = await Admin.findOne({ role: 'subAdmin' }).select('+tokenVersion').lean();
  if (subadmin) {
    result.subadmin = signToken(subadmin, 'subAdmin');
  }
  
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}
generateTokens().catch(err => { console.error(err.message); process.exit(1); });
