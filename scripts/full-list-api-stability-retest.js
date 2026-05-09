const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Service = require("../models/serviceModel");
const ServiceProvider = require("../models/serviceProviderModel");
const City = require("../models/availableCities");
const Booking = require("../models/bookingModel");
const Treatment = require("../models/treatmentModel");
const { generateAccessToken } = require("../utils/tokenUtils");

const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
const REPORT_JSON = path.resolve(process.cwd(), "_full_list_api_stability_report.json");
const REPORT_MD = path.resolve(process.cwd(), "_full_list_api_stability_report.md");

function nowIso() {
  return new Date().toISOString();
}

function sanitizeBody(body) {
  if (body === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(body));
  } catch {
    return body;
  }
}

function clipJson(value, max = 4000) {
  const s = JSON.stringify(value);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}...<truncated>` : s;
}

async function ensureServer() {
  try {
    const health = await axios.get(`${BASE_URL}/health`, { timeout: 5000, validateStatus: () => true });
    if (health.status === 200) return;
  } catch (_) {}

  const child = spawn("node", ["server.js"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  for (let i = 0; i < 60; i += 1) {
    try {
      const health = await axios.get(`${BASE_URL}/health`, { timeout: 5000, validateStatus: () => true });
      if (health.status === 200) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server /health check failed");
}

function futureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function randomPhone() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, "").slice(-9);
  return `9${tail.padStart(9, "0")}`;
}

function randomEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000000)}@example.com`;
}

async function requestEvidence(catalog, area, route, method, url, { headers = {}, body = undefined } = {}) {
  const started = Date.now();
  let response;
  try {
    response = await axios({
      method,
      url,
      headers,
      data: body,
      timeout: 25000,
      validateStatus: () => true,
    });
  } catch (err) {
    response = {
      status: 0,
      data: { success: false, message: err.message },
      headers: {},
    };
  }

  const entry = {
    area,
    route,
    request: {
      method: method.toUpperCase(),
      url,
      headers: {
        hasAuthorization: Boolean(headers.Authorization),
        hasCookie: Boolean(headers.Cookie),
        contentType: headers["Content-Type"] || headers["content-type"] || null,
      },
      body: sanitizeBody(body),
    },
    response: {
      status: response.status,
      body: sanitizeBody(response.data),
    },
    durationMs: Date.now() - started,
    timestamp: nowIso(),
  };

  catalog.push(entry);
  return entry;
}

async function ensureProviderFixture(refs) {
  const password = "Stability@123";
  let provider = await ServiceProvider.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

  if (!provider) {
    provider = await ServiceProvider.create({
      firstName: "Stability",
      lastName: "Provider",
      ownerName: "Stability Owner",
      age: 30,
      dateOfBirth: new Date("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("stability.provider"),
      password,
      currentAddress: {
        street: "A-1",
        locality: "Center",
        city: refs.cityName || "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
      },
      permanentAddress: {
        street: "A-1",
        locality: "Center",
        city: refs.cityName || "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
        sameAsCurrent: true,
      },
      services: [{ serviceId: refs.serviceId, serviceName: "General", experienceYears: 2 }],
      qualification: "BSc Nursing",
      registrationNumber: `REG-STABILITY-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 5,
      bankDetails: {
        accountHolderName: "Stability Provider",
        accountNumber: `${Date.now()}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "SBI",
      },
      serviceCities: [refs.cityId],
      approvalStatus: "Approved",
      isActive: true,
      isVerified: true,
      tokenVersion: 0,
    });
  } else {
    if (!provider.mobile) provider.mobile = randomPhone();
    if (!provider.email) provider.email = randomEmail("stability.provider");
    provider.password = password;
    provider.isActive = true;
    provider.isVerified = true;
    provider.approvalStatus = "Approved";
    if (!Array.isArray(provider.serviceCities) || provider.serviceCities.length === 0) {
      provider.serviceCities = [refs.cityId];
    }
    if (!Array.isArray(provider.services) || provider.services.length === 0) {
      provider.services = [{ serviceId: refs.serviceId, serviceName: "General", experienceYears: 2 }];
    }
    await provider.save({ validateBeforeSave: false });
  }

  return { provider, password };
}

function writeReports(report) {
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const lines = [];
  lines.push(`# Full List API Stability Retest`);
  lines.push(``);
  lines.push(`- GeneratedAt: ${report.generatedAt}`);
  lines.push(`- BaseURL: ${report.baseUrl}`);
  lines.push(`- TotalChecks: ${report.summary.totalChecks}`);
  lines.push(`- Non2xxChecks: ${report.summary.non2xxChecks}`);
  lines.push(``);
  lines.push(`## Checklist`);
  lines.push(``);
  for (const e of report.evidence) {
    const ok = e.response.status >= 200 && e.response.status < 300 ? "x" : " ";
    lines.push(`- [${ok}] ${e.route} | ${e.response.status} | area=${e.area}`);
    lines.push(`  - req: ${clipJson(e.request.body || {})}`);
    lines.push(`  - res: ${clipJson(e.response.body || {})}`);
  }

  fs.writeFileSync(REPORT_MD, lines.join("\n"));
}

async function run() {
  await ensureServer();
  await mongoose.connect(process.env.MONGODB_URI);

  const evidence = [];
  const cleanup = [];

  try {
    const city = (await City.findOne({ isActive: true }).lean()) || (await City.findOne({}).lean());
    const service =
      (await Service.findOne({ isActive: true, isDeleted: { $ne: true } }).lean()) ||
      (await Service.findOne({}).lean());
    const patient =
      (await Patient.findOne({ isActive: true }).lean()) ||
      (await Patient.findOne({}).lean());
    let doctor =
      (await Doctor.findOne({ isActive: true, isPhoneVerified: true }).sort({ createdAt: -1 })) ||
      (await Doctor.findOne({}).sort({ createdAt: -1 }));

    if (!city || !service || !patient || !doctor) {
      throw new Error("Missing baseline fixtures: city/service/patient/doctor");
    }

    if (doctor.tokenVersion == null) {
      doctor.tokenVersion = 0;
      await doctor.save({ validateBeforeSave: false });
    }

    const refs = {
      cityId: String(city._id),
      cityName: city.name || "Lucknow",
      serviceId: String(service._id),
      patientId: String(patient._id),
      doctorId: String(doctor._id),
    };

    const { provider, password } = await ensureProviderFixture(refs);
    refs.providerId = String(provider._id);

    const doctorToken = generateAccessToken(doctor._id, "doctor", doctor.tokenVersion || 0);
    const doctorHeaders = {
      Authorization: `Bearer ${doctorToken}`,
      "Content-Type": "application/json",
    };

    const originalAvailability = doctor.availability ? JSON.parse(JSON.stringify(doctor.availability)) : null;
    await Doctor.updateOne({ _id: doctor._id }, { $unset: { availability: 1 } });
    cleanup.push(async () => {
      if (originalAvailability) {
        await Doctor.updateOne({ _id: doctor._id }, { $set: { availability: originalAvailability } });
      }
    });

    const doctorAvailabilityBody = {
      days: ["Monday", "Tuesday"],
      timeSlots: [{ start: "09:00", end: "11:00" }],
      slotDuration: 30,
      startDate: futureDate(1),
      endDate: futureDate(2),
      serviceAvailability: { consultation: true },
      serviceCoverage: { mode: "Home Service" },
    };
    await requestEvidence(
      evidence,
      "doctor-availability-hardening",
      "POST /api/v1/doctor/availability",
      "post",
      `${BASE_URL}/api/v1/doctor/availability`,
      { headers: doctorHeaders, body: doctorAvailabilityBody }
    );

    await requestEvidence(
      evidence,
      "route-conflict-verification",
      "PUT /api/v1/doctor/availability",
      "put",
      `${BASE_URL}/api/v1/doctor/availability`,
      {
        headers: doctorHeaders,
        body: { days: ["Monday"], timeSlots: [{ start: "10:00", end: "12:00" }] },
      }
    );

    await requestEvidence(
      evidence,
      "article-geo-filter",
      "GET /api/v1/article/articles?longitude&latitude",
      "get",
      `${BASE_URL}/api/v1/article/articles?longitude=77.5946&latitude=12.9716&maxDistance=50000&page=1&limit=5`
    );
    await requestEvidence(
      evidence,
      "article-city-filter",
      "GET /api/v1/article/articles?cityId",
      "get",
      `${BASE_URL}/api/v1/article/articles?cityId=${refs.cityId}&page=1&limit=5`
    );
    await requestEvidence(
      evidence,
      "article-city-filter-alias",
      "GET /api/v1/article/getallarticle?cityId",
      "get",
      `${BASE_URL}/api/v1/article/getallarticle?cityId=${refs.cityId}&page=1&limit=5`
    );
    await requestEvidence(
      evidence,
      "article-cityname-filter",
      "GET /api/v1/article/articles?cityName",
      "get",
      `${BASE_URL}/api/v1/article/articles?cityName=${encodeURIComponent(refs.cityName)}&page=1&limit=5`
    );

    await requestEvidence(
      evidence,
      "social-search-regression",
      "GET /api/v1/socialPost/search?q=health",
      "get",
      `${BASE_URL}/api/v1/socialPost/search?q=health&type=posts&page=1&limit=5`
    );

    const loginCommonHeaders = { "Content-Type": "application/json" };
    await requestEvidence(
      evidence,
      "provider-login-regression",
      "POST /api/v1/serviceProvider/login (email only)",
      "post",
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { headers: loginCommonHeaders, body: { email: provider.email, password } }
    );
    await requestEvidence(
      evidence,
      "provider-login-regression",
      "POST /api/v1/serviceProvider/login (mobile only)",
      "post",
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { headers: loginCommonHeaders, body: { mobile: provider.mobile, password } }
    );
    await requestEvidence(
      evidence,
      "provider-login-regression",
      "POST /api/v1/serviceProvider/login (neither email/mobile)",
      "post",
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { headers: loginCommonHeaders, body: { password } }
    );
    await requestEvidence(
      evidence,
      "provider-login-regression",
      "POST /api/v1/serviceProvider/login (wrong credential)",
      "post",
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { headers: loginCommonHeaders, body: { email: provider.email, password: `${password}_wrong` } }
    );

    const wasActive = provider.isActive;
    provider.isActive = false;
    await provider.save({ validateBeforeSave: false });
    cleanup.push(async () => {
      await ServiceProvider.updateOne({ _id: provider._id }, { $set: { isActive: wasActive } });
    });
    await requestEvidence(
      evidence,
      "provider-login-regression",
      "POST /api/v1/serviceProvider/login (inactive provider)",
      "post",
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { headers: loginCommonHeaders, body: { email: provider.email, password } }
    );

    const treatment = await Treatment.create({
      bookingId: null,
      patientId: patient._id,
      serviceId: service._id,
      servicePartnerId: provider._id,
      startDate: new Date(futureDate(3)),
      status: "Active",
      currentBookingId: null,
      lastBookingAt: new Date(),
      invoiceGenerated: false,
      isActive: true,
    });

    const booking = await Booking.create({
      treatmentId: treatment._id,
      patientId: patient._id,
      serviceId: service._id,
      servicePartnerId: provider._id,
      sessionNumber: 1,
      appointmentDate: new Date(futureDate(3)),
      slotTime: { startTime: "09:30", endTime: "10:00" },
      duration: 30,
      status: "Approved",
      city: city._id,
      pricing: {
        basePrice: 150,
        equipmentCharges: 0,
        subtotal: 150,
        taxPercentage: 18,
        taxAmount: 27,
        totalAmount: 177,
      },
      createdBy: { userId: patient._id, userModel: "Patient" },
    });

    await Treatment.updateOne(
      { _id: treatment._id },
      { $set: { bookingId: booking._id, currentBookingId: booking._id, lastBookingAt: new Date() } }
    );

    const invoicePayload = {
      bookingId: String(booking._id),
      patientId: String(patient._id),
      doctorId: String(provider._id),
      serviceId: String(service._id),
      billingDetails: {
        category: "consultation",
        serviceName: service.name || "Consultation",
        shiftType: "hourly",
        durationMinutes: 30,
        basePrice: 150,
        calculatedBase: 150,
        taxPercentage: 0,
      },
      medicines: [
        { name: "Pain Relief", quantity: 1, pricePerUnit: 50, gstPercentage: 0 },
      ],
      additionalEquipment: [],
    };
    await requestEvidence(
      evidence,
      "invoice-generate-resilience",
      "POST /api/v1/invoice/generate",
      "post",
      `${BASE_URL}/api/v1/invoice/generate`,
      { headers: { "Content-Type": "application/json" }, body: invoicePayload }
    );

    const summary = {
      totalChecks: evidence.length,
      non2xxChecks: evidence.filter((e) => e.response.status < 200 || e.response.status >= 300).length,
    };

    const report = {
      generatedAt: nowIso(),
      baseUrl: BASE_URL,
      fixtures: refs,
      summary,
      evidence,
    };

    writeReports(report);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    for (const fn of cleanup.reverse()) {
      try {
        await fn();
      } catch (_) {}
    }
    await mongoose.disconnect();
  }
}

run().catch(async (error) => {
  try {
    await mongoose.disconnect();
  } catch (_) {}
  const failure = {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    error: error.message,
    stack: error.stack,
  };
  fs.writeFileSync(REPORT_JSON, JSON.stringify(failure, null, 2));
  fs.writeFileSync(REPORT_MD, `# Full List API Stability Retest\n\nFailed: ${error.message}\n`);
  console.error(JSON.stringify(failure, null, 2));
  process.exit(1);
});
