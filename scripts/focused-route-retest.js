const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const Otp = require('../models/otpModel');
const Patient = require('../models/patientModel');
const ServiceProvider = require('../models/serviceProviderModel');
const City = require('../models/availableCities');
const Service = require('../models/serviceModel');
const Booking = require('../models/bookingModel');
const Treatment = require('../models/treatmentModel');

const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;

function cookieFromSetCookie(setCookie) {
  if (!Array.isArray(setCookie)) return null;
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

function randomPhone() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, '').slice(-9);
  return `9${tail.padStart(9, '0')}`;
}

function randomEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

function futureDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureServer() {
  try {
    const probe = await axios.get(`${BASE_URL}/health`, { timeout: 4000 });
    if (probe.status === 200) return;
  } catch (_) {}

  const child = spawn('node', ['server.js'], { cwd: process.cwd(), detached: true, stdio: 'ignore' });
  child.unref();

  for (let i = 0; i < 40; i += 1) {
    try {
      const h = await axios.get(`${BASE_URL}/health`, { timeout: 4000 });
      if (h.status === 200) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server health check failed');
}

async function ensureProviderAndLogin(refs) {
  const password = process.env.TEST_PROVIDER_PASSWORD || 'RouteSP@123';
  let provider = await ServiceProvider.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

  if (!provider) {
    provider = await ServiceProvider.create({
      firstName: 'Focused',
      lastName: 'Provider',
      ownerName: 'Focused Owner',
      age: 30,
      dateOfBirth: new Date('1995-01-01'),
      gender: 'Male',
      mobile: randomPhone(),
      email: randomEmail('focused.provider'),
      password,
      currentAddress: {
        street: 'A-1', locality: 'Center', city: refs.cityName || 'Lucknow', state: 'UP', country: 'India', pincode: '226001'
      },
      permanentAddress: {
        street: 'A-1', locality: 'Center', city: refs.cityName || 'Lucknow', state: 'UP', country: 'India', pincode: '226001', sameAsCurrent: true
      },
      services: [{ serviceId: refs.serviceId, serviceName: 'General', experienceYears: 2 }],
      qualification: 'BSc Nursing',
      registrationNumber: `REG-FOCUSED-${Date.now()}`,
      registrationCouncil: 'State Council',
      yearsOfExperience: 5,
      bankDetails: {
        accountHolderName: 'Focused Provider', accountNumber: `${Date.now()}`.slice(-12), ifscCode: 'SBIN0001234', bankName: 'SBI'
      },
      serviceCities: [refs.cityId],
      approvalStatus: 'Approved',
      isActive: true,
      isVerified: true,
      tokenVersion: 0,
    });
  } else {
    provider.password = password;
    provider.isActive = true;
    provider.isVerified = true;
    provider.approvalStatus = 'Approved';
    if (!Array.isArray(provider.serviceCities) || provider.serviceCities.length === 0) provider.serviceCities = [refs.cityId];
    if (!Array.isArray(provider.services) || provider.services.length === 0) {
      provider.services = [{ serviceId: refs.serviceId, serviceName: 'General', experienceYears: 2 }];
    }
    await provider.save({ validateBeforeSave: false });
  }

  const login = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/login`,
    { email: provider.email, password },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(login.headers['set-cookie']);
  if (!cookie) throw new Error(`Service provider login failed. status=${login.status}`);

  return { provider, cookie, loginStatus: login.status, loginBody: login.data };
}

async function run() {
  await ensureServer();
  await mongoose.connect(process.env.MONGODB_URI);

  const city = (await City.findOne({ isActive: true }).lean()) || (await City.findOne({}).lean());
  const service = (await Service.findOne({ isActive: true, isDeleted: { $ne: true } }).lean()) || (await Service.findOne({}).lean());
  const patient = (await Patient.findOne({ isVerified: true, isActive: true }).lean()) || (await Patient.findOne({}).lean());

  if (!city || !service || !patient) throw new Error('Missing city/service/patient baseline fixture');

  const patientDoc = await Patient.findById(patient._id);
  if (!patientDoc.address) patientDoc.address = {};
  if (!patientDoc.address.cityId) {
    patientDoc.address.cityId = city._id;
    await patientDoc.save({ validateBeforeSave: false });
  }

  const refs = {
    cityId: String(city._id),
    cityName: city.name || 'Lucknow',
    serviceId: String(service._id),
    patientId: String(patient._id),
  };

  const providerSession = await ensureProviderAndLogin(refs);
  const providerId = String(providerSession.provider._id);

  const prevTreatment = await Treatment.create({
    bookingId: null,
    patientId: patient._id,
    serviceId: service._id,
    servicePartnerId: providerId,
    startDate: new Date(futureDate(2)),
    status: 'Active',
    currentBookingId: null,
    lastBookingAt: new Date(),
    invoiceGenerated: false,
    isActive: true,
  });

  const prevBooking = await Booking.create({
    treatmentId: prevTreatment._id,
    patientId: patient._id,
    serviceId: service._id,
    servicePartnerId: providerId,
    sessionNumber: 1,
    appointmentDate: new Date(futureDate(2)),
    slotTime: { startTime: '10:00', endTime: '10:30' },
    duration: 30,
    status: 'Completed',
    city: city._id,
    pricing: { basePrice: 100, equipmentCharges: 0, subtotal: 100, taxPercentage: 18, taxAmount: 18, totalAmount: 118 },
    createdBy: { userId: providerId, userModel: 'ServiceProvider' },
  });

  await Treatment.updateOne(
    { _id: prevTreatment._id },
    { $set: { bookingId: prevBooking._id, currentBookingId: prevBooking._id, lastBookingAt: new Date() } }
  );

  const activeTreatment = await Treatment.create({
    bookingId: null,
    patientId: patient._id,
    serviceId: service._id,
    servicePartnerId: providerId,
    startDate: new Date(futureDate(3)),
    status: 'Active',
    currentBookingId: null,
    lastBookingAt: new Date(),
    invoiceGenerated: false,
    isActive: true,
  });

  const activeBooking = await Booking.create({
    treatmentId: activeTreatment._id,
    patientId: patient._id,
    serviceId: service._id,
    servicePartnerId: providerId,
    sessionNumber: 2,
    appointmentDate: new Date(futureDate(3)),
    slotTime: { startTime: '11:00', endTime: '11:30' },
    duration: 30,
    status: 'Approved',
    city: city._id,
    pricing: { basePrice: 120, equipmentCharges: 0, subtotal: 120, taxPercentage: 18, taxAmount: 21.6, totalAmount: 141.6 },
    createdBy: { userId: providerId, userModel: 'ServiceProvider' },
  });

  await Treatment.updateOne(
    { _id: activeTreatment._id },
    { $set: { bookingId: activeBooking._id, currentBookingId: activeBooking._id, lastBookingAt: new Date() } }
  );

  const req1 = {
    method: 'PUT',
    url: `${BASE_URL}/api/v1/booking/update-status/${activeBooking._id}`,
    body: { status: 'TreatmentCompleted' },
  };
  const res1 = await axios.put(req1.url, req1.body, {
    headers: { Cookie: providerSession.cookie, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  const req2 = {
    method: 'POST',
    url: `${BASE_URL}/api/v1/booking/providerBookings`,
    body: {
      patientId: String(patient._id),
      previousBookingId: String(prevBooking._id),
      serviceId: String(service._id),
      appointmentDate: futureDate(7),
      startTime: '16:00',
      endTime: '16:30',
      duration: 30,
      shiftType: 'afternoon',
      notes: 'Focused retest follow-up',
      category: service.category || 'consultation',
      modes: Array.isArray(service.modes) && service.modes.length ? [service.modes[0]] : ['Home Service'],
      cityId: String(city._id),
    },
  };
  const res2 = await axios.post(req2.url, req2.body, {
    headers: { Cookie: providerSession.cookie, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    auth: {
      role: 'serviceProvider',
      providerId,
      loginStatus: providerSession.loginStatus,
    },
    fixtures: {
      patientId: String(patient._id),
      serviceId: String(service._id),
      cityId: String(city._id),
      updateStatusBookingId: String(activeBooking._id),
      updateStatusTreatmentId: String(activeTreatment._id),
      providerBookingsPreviousBookingId: String(prevBooking._id),
      providerBookingsPreviousTreatmentId: String(prevTreatment._id),
    },
    evidence: [
      {
        route: 'PUT /api/v1/booking/update-status/:bookingId',
        request: req1,
        response: { status: res1.status, body: res1.data },
      },
      {
        route: 'POST /api/v1/booking/providerBookings',
        request: req2,
        response: { status: res2.status, body: res2.data },
      },
    ],
  };

  console.log(JSON.stringify(output, null, 2));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  try { await mongoose.disconnect(); } catch (_) {}
  console.error(JSON.stringify({ error: err.message, stack: err.stack }, null, 2));
  process.exit(1);
});
