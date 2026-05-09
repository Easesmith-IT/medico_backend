const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { spawn } = require("child_process");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const Otp = require("../models/otpModel");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Admin = require("../models/adminModel");
const ServiceProvider = require("../models/serviceProviderModel");
const City = require("../models/availableCities");
const Service = require("../models/serviceModel");
const Booking = require("../models/bookingModel");
const Treatment = require("../models/treatmentModel");

const ROOT = process.cwd();
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
const IN_FAILED = path.join(ROOT, "post-fix-route-failures.json");
const OUT_JSON = path.join(ROOT, "_failed_api_retest_report.json");
const OUT_MD = path.join(ROOT, "_failed_api_retest_report.md");
const STARTED_PIDS = [];

function nowIso() {
  return new Date().toISOString();
}

function randomPhone() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, "").slice(-9);
  return `9${tail.padStart(9, "0")}`;
}

function randomEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

function preview(data, max = 2000) {
  if (data == null) return null;
  try {
    const raw = typeof data === "string" ? data : JSON.stringify(data);
    return raw.length > max ? `${raw.slice(0, max)}...` : raw;
  } catch {
    return String(data);
  }
}

function cookieFromSetCookie(setCookie) {
  if (!Array.isArray(setCookie)) return null;
  return setCookie.map((v) => v.split(";")[0]).join("; ");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServer() {
  try {
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (res.status === 200) return;
  } catch (_) {}

  const child = spawn("node", ["server.js"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  STARTED_PIDS.push(child.pid);

  for (let i = 0; i < 45; i += 1) {
    try {
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 4000 });
      if (res.status === 200) return;
    } catch (_) {}
    await sleep(750);
  }
  throw new Error("Server health check failed");
}

async function fetchOtp(phone) {
  return Otp.findOne({ phone }).sort({ createdAt: -1 }).lean();
}

async function http({ method, url, body, cookie, headers = {} }) {
  const start = Date.now();
  let status = 0;
  let data = null;
  let error = null;
  try {
    const res = await axios({
      method,
      url,
      data: body,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      validateStatus: () => true,
      timeout: 25000,
    });
    status = res.status;
    data = res.data;
    return { ok: true, status, data, error: null, durationMs: Date.now() - start };
  } catch (e) {
    error = `${e.code ? `${e.code}: ` : ""}${e.message || "request failed"}`;
    return { ok: false, status, data, error, durationMs: Date.now() - start };
  }
}

async function loginPatient(sessions) {
  const patient = await Patient.findOne({ isVerified: true, isActive: true }).lean();
  if (!patient?.phone) throw new Error("No active verified patient found");

  await http({
    method: "POST",
    url: `${BASE_URL}/api/v1/patient/login`,
    body: { phone: patient.phone },
  });

  let otp = await fetchOtp(patient.phone);
  if (!otp) {
    await Otp.create({
      phone: patient.phone,
      otp: "123456",
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      type: "login",
      attempts: 0,
      deliveryStatus: "sent",
    });
    otp = await fetchOtp(patient.phone);
  }

  const verify = await axios.post(
    `${BASE_URL}/api/v1/patient/verify-login-otp`,
    { phone: patient.phone, otp: String(otp.otp) },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(verify.headers["set-cookie"]);
  if (!cookie) throw new Error("Patient cookie generation failed");
  sessions.patient = { cookie, userId: String(patient._id), phone: patient.phone };
}

async function loginDoctor(sessions) {
  const doctor = await Doctor.findOne({ isPhoneVerified: true, isActive: true }).lean();
  if (!doctor?.phone) throw new Error("No active verified doctor found");

  await http({
    method: "POST",
    url: `${BASE_URL}/api/v1/doctor/login`,
    body: { phone: doctor.phone, role: "doctor" },
  });

  let otp = await fetchOtp(doctor.phone);
  if (!otp) {
    await Otp.create({
      phone: doctor.phone,
      otp: "123456",
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      type: "login",
      attempts: 0,
      deliveryStatus: "sent",
    });
    otp = await fetchOtp(doctor.phone);
  }

  const verify = await axios.post(
    `${BASE_URL}/api/v1/doctor/verify-login-otp`,
    { phone: doctor.phone, otp: String(otp.otp) },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(verify.headers["set-cookie"]);
  if (!cookie) throw new Error("Doctor cookie generation failed");
  sessions.doctor = { cookie, userId: String(doctor._id), phone: doctor.phone };
}

async function loginAdmin(sessions) {
  const password = process.env.TEST_ADMIN_PASSWORD || "RouteTest@123";
  let admin = await Admin.findOne({ role: { $in: ["superAdmin", "subAdmin"] } }).select("+password");

  if (!admin) {
    const hash = await bcrypt.hash(password, 10);
    admin = await Admin.create({
      firstName: "Retest",
      lastName: "Admin",
      email: randomEmail("retest.admin").toLowerCase(),
      phone: randomPhone(),
      password: hash,
      role: "superAdmin",
      isActive: true,
      isVerified: true,
      tokenVersion: 0,
    });
  } else {
    admin.password = await bcrypt.hash(password, 10);
    admin.isActive = true;
    await admin.save({ validateBeforeSave: false });
  }

  const login = await axios.post(
    `${BASE_URL}/api/v1/admin/login`,
    { email: admin.email, password },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(login.headers["set-cookie"]);
  if (!cookie) throw new Error(`Admin login failed with status ${login.status}`);
  sessions.admin = { cookie, userId: String(admin._id), email: admin.email };
}

async function ensureProviderAndLogin(sessions, refs) {
  const password = process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123";
  let provider = await ServiceProvider.findOne({ isDeleted: { $ne: true } })
    .select("+password")
    .sort({ createdAt: -1 });

  if (!provider) {
    provider = await ServiceProvider.create({
      firstName: "Retest",
      lastName: "Provider",
      ownerName: "Retest Owner",
      age: 30,
      dateOfBirth: new Date("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("retest.provider"),
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
      registrationNumber: `REG-RETEST-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 5,
      bankDetails: {
        accountHolderName: "Retest Provider",
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

  const login = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/login`,
    { email: provider.email, password },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(login.headers["set-cookie"]);
  if (!cookie) throw new Error(`Service provider login failed with status ${login.status}`);
  sessions.serviceProvider = { cookie, userId: String(provider._id), email: provider.email };
}

async function ensureRefs(sessions) {
  let city = await City.findOne({ isActive: true }).lean();
  if (!city) city = await City.findOne({}).lean();
  if (!city) throw new Error("No city found in DB");

  const patient = await Patient.findById(sessions.patient.userId);
  if (!patient) throw new Error("Patient session user not found");
  if (!patient.address) patient.address = {};
  if (!patient.address.cityId) {
    patient.address.cityId = city._id;
    await patient.save({ validateBeforeSave: false });
  }

  let service = await Service.findOne({ isActive: true, isDeleted: { $ne: true } }).lean();
  if (!service) service = await Service.findOne({}).lean();
  if (!service) throw new Error("No service found in DB");

  return {
    cityId: String(city._id),
    cityName: city.name || "lucknow",
    serviceId: String(service._id),
    patientId: sessions.patient.userId,
    doctorId: sessions.doctor.userId,
    providerId: sessions.serviceProvider ? sessions.serviceProvider.userId : null,
  };
}

function futureDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function slotByOffset(minOffset = 0) {
  const baseHour = 9 + Math.floor((minOffset % 480) / 30);
  const start = `${String(baseHour).padStart(2, "0")}:${minOffset % 60 === 0 ? "00" : "30"}`;
  const next = new Date(`2000-01-01T${start}:00Z`);
  next.setUTCMinutes(next.getUTCMinutes() + 30);
  const end = `${String(next.getUTCHours()).padStart(2, "0")}:${String(next.getUTCMinutes()).padStart(2, "0")}`;
  return { startTime: start, endTime: end, duration: 30 };
}

async function createCompletedBookingFixture(refs) {
  const appointmentDate = new Date(futureDate(2));
  const { startTime, endTime, duration } = slotByOffset(60);

  const treatment = await Treatment.create({
    bookingId: null,
    patientId: refs.patientId,
    serviceId: refs.serviceId,
    servicePartnerId: refs.providerId,
    startDate: appointmentDate,
    status: "Active",
    currentBookingId: null,
    lastBookingAt: appointmentDate,
    invoiceGenerated: false,
    isActive: true,
  });

  const booking = await Booking.create({
    treatmentId: treatment._id,
    patientId: refs.patientId,
    serviceId: refs.serviceId,
    servicePartnerId: refs.providerId,
    sessionNumber: 1,
    appointmentDate,
    slotTime: { startTime, endTime },
    duration,
    status: "Completed",
    city: refs.cityId,
    pricing: {
      basePrice: 100,
      equipmentCharges: 0,
      subtotal: 100,
      taxPercentage: 18,
      taxAmount: 18,
      totalAmount: 118,
    },
    createdBy: { userId: refs.providerId, userModel: "ServiceProvider" },
  });

  await Treatment.updateOne(
    { _id: treatment._id },
    { $set: { bookingId: booking._id, currentBookingId: booking._id, lastBookingAt: appointmentDate } }
  );

  return String(booking._id);
}

async function runRetest() {
  if (!fs.existsSync(IN_FAILED)) throw new Error("post-fix-route-failures.json not found");
  const input = JSON.parse(fs.readFileSync(IN_FAILED, "utf8"));
  const failed = Array.isArray(input.unresolved) ? input.unresolved : [];
  if (!failed.length) throw new Error("No unresolved routes found in post-fix-route-failures.json");

  await ensureServer();
  await mongoose.connect(process.env.MONGODB_URI);

  const sessions = {};
  await loginPatient(sessions);
  await loginDoctor(sessions);
  await loginAdmin(sessions);
  let refs = await ensureRefs(sessions);
  await ensureProviderAndLogin(sessions, refs);
  refs = await ensureRefs(sessions);
  refs.providerId = sessions.serviceProvider.userId;
  refs.completedBookingId = await createCompletedBookingFixture(refs);

  const evidence = [];
  let adminCreatedBookingId = null;
  let patientCreatedBookingId = null;
  let patientCreatedTreatmentId = null;
  let paymentOrder = null;

  for (const route of failed) {
    const method = String(route.method || "").toUpperCase();
    const pathTemplate = route.path;
    const routeKey = `${method} ${pathTemplate}`;
    let execPath = route.requestUrl || pathTemplate;
    let cookie = null;
    let requestBody = route.requestBody ? JSON.parse(JSON.stringify(route.requestBody)) : {};
    const notes = [];

    if (routeKey === "POST /api/v1/admin/bookings/create") {
      const slot = slotByOffset(150);
      requestBody = {
        patientId: refs.patientId,
        serviceId: refs.serviceId,
        appointmentDate: futureDate(3),
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 30,
        cityId: refs.cityId,
        servicePartnerId: refs.providerId,
      };
      cookie = sessions.admin.cookie;
    } else if (routeKey === "PATCH /api/v1/admin/bookings/update/:bookingId") {
      const bookingId = adminCreatedBookingId || execPath.split("/").pop();
      execPath = `/api/v1/admin/bookings/update/${bookingId}`;
      const slot = slotByOffset(210);
      requestBody = {
        patientId: refs.patientId,
        appointmentDate: futureDate(3),
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 30,
        status: "Approved",
        notes: "retest update",
        cityId: refs.cityId,
        servicePartnerId: refs.providerId,
      };
      cookie = sessions.admin.cookie;
    } else if (routeKey === "POST /api/v1/booking/create") {
      const slot = slotByOffset(270);
      requestBody = {
        patientId: refs.patientId,
        serviceId: refs.serviceId,
        appointmentDate: futureDate(4),
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 30,
        cityId: refs.cityId,
      };
      cookie = sessions.patient.cookie;
    } else if (routeKey === "POST /api/v1/booking/providerBookings") {
      const slot = slotByOffset(330);
      requestBody = {
        patientId: refs.patientId,
        previousBookingId: refs.completedBookingId,
        serviceId: refs.serviceId,
        appointmentDate: futureDate(5),
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 30,
        cityId: refs.cityId,
      };
      cookie = sessions.serviceProvider.cookie;
    } else if (routeKey === "PUT /api/v1/booking/reschedule/:bookingId") {
      const bookingId = patientCreatedBookingId || execPath.split("/").pop();
      execPath = `/api/v1/booking/reschedule/${bookingId}`;
      const slot = slotByOffset(390);
      requestBody = {
        appointmentDate: futureDate(6),
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: 30,
        reason: "retest reschedule",
      };
      cookie = sessions.patient.cookie;
    } else if (routeKey === "PUT /api/v1/booking/update-status/:bookingId") {
      const bookingId = adminCreatedBookingId || execPath.split("/").pop();
      execPath = `/api/v1/booking/update-status/${bookingId}`;
      requestBody = { status: "In-Progress", notes: "retest status update" };
      cookie = sessions.serviceProvider.cookie;
    } else if (routeKey === "POST /api/v1/geo/check-location") {
      requestBody = {
        address: "Delhi, India",
        polygon: [
          [77.05, 28.4],
          [77.45, 28.4],
          [77.45, 28.9],
          [77.05, 28.9],
        ],
      };
      cookie = null;
    } else if (routeKey === "PATCH /api/v1/city/:cityId/toggle") {
      execPath = `/api/v1/city/${refs.cityId}/toggle`;
      requestBody = {};
      cookie = null;
    } else if (routeKey === "POST /api/v1/article/create") {
      requestBody = {
        cityName: String(refs.cityName || "lucknow").toLowerCase(),
        category: "General Health",
        title: `Retest Article ${Date.now()}`,
        articleType: "article",
        textContent: "Retest article content",
        tags: ["retest", "health"],
      };
      cookie = sessions.doctor.cookie;
    } else if (routeKey === "POST /api/v1/payments/treatments/:treatmentId/online/verify") {
      const treatmentId = patientCreatedTreatmentId || execPath.split("/")[5];
      execPath = `/api/v1/payments/treatments/${treatmentId}/online/verify`;
      cookie = sessions.patient.cookie;

      const orderRes = await http({
        method: "POST",
        url: `${BASE_URL}/api/v1/payments/treatments/${treatmentId}/online/order`,
        body: { amount: 1 },
        cookie,
      });
      notes.push({
        preStep: "create_online_order",
        status: orderRes.status,
        response: preview(orderRes.data),
        error: orderRes.error,
      });
      if (orderRes.status === 200 && orderRes.data?.data?.orderId) {
        paymentOrder = orderRes.data.data;
        const razorpay_payment_id = `pay_retest_${Date.now()}`;
        const secret = process.env.RAZORPAY_API_SECRET || "";
        const razorpay_signature = crypto
          .createHmac("sha256", secret)
          .update(`${paymentOrder.orderId}|${razorpay_payment_id}`)
          .digest("hex");

        requestBody = {
          razorpay_order_id: paymentOrder.orderId,
          razorpay_payment_id,
          razorpay_signature,
        };
      } else {
        requestBody = {
          razorpay_order_id: "order_missing_precondition",
          razorpay_payment_id: "pay_missing_precondition",
          razorpay_signature: "sig_missing_precondition",
        };
      }
    }

    const url = `${BASE_URL}${execPath}`;
    const result = await http({ method, url, body: requestBody, cookie });
    const responseMsg =
      result.data?.message ||
      result.data?.error ||
      result.error ||
      "";

    if (routeKey === "POST /api/v1/admin/bookings/create" && result.status === 201) {
      adminCreatedBookingId = result.data?.data?._id || result.data?.data?.booking?._id || null;
      if (adminCreatedBookingId) notes.push({ extracted: "adminCreatedBookingId", value: adminCreatedBookingId });
    }
    if (routeKey === "POST /api/v1/booking/create" && result.status === 201) {
      patientCreatedBookingId = result.data?.data?.booking?._id || null;
      patientCreatedTreatmentId = result.data?.data?.treatmentId || null;
      if (patientCreatedBookingId) notes.push({ extracted: "patientCreatedBookingId", value: patientCreatedBookingId });
      if (patientCreatedTreatmentId) notes.push({ extracted: "patientCreatedTreatmentId", value: patientCreatedTreatmentId });
    }

    evidence.push({
      routeKey,
      originalStatus: route.status,
      method,
      pathTemplate,
      executedPath: execPath,
      authContextUsed:
        cookie === sessions.admin.cookie
          ? "admin"
          : cookie === sessions.doctor.cookie
          ? "doctor"
          : cookie === sessions.patient.cookie
          ? "patient"
          : cookie === sessions.serviceProvider.cookie
          ? "serviceProvider"
          : "public",
      requestBody,
      responseStatus: result.status,
      responseMessage: responseMsg,
      responseBodyPreview: preview(result.data),
      requestError: result.error,
      durationMs: result.durationMs,
      notes,
      resolved: result.status >= 200 && result.status < 400,
    });
  }

  const summary = {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    inputFailedCount: failed.length,
    resolvedCount: evidence.filter((e) => e.resolved).length,
    unresolvedCount: evidence.filter((e) => !e.resolved).length,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, evidence }, null, 2));

  const md = [];
  md.push("# Failed API Re-test Report");
  md.push("");
  md.push(`- generatedAt: ${summary.generatedAt}`);
  md.push(`- baseUrl: ${summary.baseUrl}`);
  md.push(`- inputFailedCount: ${summary.inputFailedCount}`);
  md.push(`- resolvedCount: ${summary.resolvedCount}`);
  md.push(`- unresolvedCount: ${summary.unresolvedCount}`);
  md.push("");

  for (const item of evidence) {
    const mark = item.resolved ? "x" : " ";
    md.push(`- [${mark}] ${item.method} ${item.executedPath} (from ${item.pathTemplate})`);
    md.push(`  - oldStatus: ${item.originalStatus}`);
    md.push(`  - newStatus: ${item.responseStatus}`);
    md.push(`  - authContextUsed: ${item.authContextUsed}`);
    md.push(`  - message: ${item.responseMessage || "n/a"}`);
    md.push(`  - requestBody: \`${preview(item.requestBody, 600)}\``);
    md.push(`  - response: \`${item.responseBodyPreview || item.requestError || "n/a"}\``);
    if (item.notes && item.notes.length) {
      md.push(`  - notes: \`${preview(item.notes, 700)}\``);
    }
  }

  fs.writeFileSync(OUT_MD, md.join("\n"));

  await mongoose.disconnect();
  for (const pid of STARTED_PIDS) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }

  return { summary, outputs: { OUT_JSON, OUT_MD } };
}

runRetest()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(async (err) => {
    try {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    } catch (_) {}
    for (const pid of STARTED_PIDS) {
      try {
        process.kill(pid, "SIGTERM");
      } catch (_) {}
    }
    console.error("FAILED", err);
    process.exit(1);
  });
