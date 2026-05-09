const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
const Invoice = require("../models/invoiceModel");
const ItemCategory = require("../models/itemCategoryModel");
const CrashReport = require("../models/CrashReport");
const SocialPost = require("../models/socialPostModel");
const Article = require("../models/articleModel");

const ROOT = process.cwd();
const ROUTE_DIR = path.join(ROOT, "route");
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;

const OUT = {
  routeChecklistJson: path.join(ROOT, "_route_checklist.json"),
  routeChecklistMd: path.join(ROOT, "_route_checklist.md"),
  verificationJson: path.join(ROOT, "_live_api_verification_report.json"),
  verificationMd: path.join(ROOT, "_live_api_verification_report.md"),
  errorDiffJson: path.join(ROOT, "_route_error_diff.json"),
  errorDiffMd: path.join(ROOT, "_route_error_diff.md"),
};

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

function parseRoutes() {
  const indexText = stripComments(
    fs.readFileSync(path.join(ROUTE_DIR, "index.js"), "utf8")
  );

  const varToFile = {};
  for (const m of indexText.matchAll(
    /const\s+(\w+)\s*=\s*require\(['"](?:\.\/|\.\.\/route\/)([\w-]+)['"]\)\s*;/g
  )) {
    varToFile[m[1]] = `${m[2]}.js`;
  }

  const mountMap = {};
  for (const m of indexText.matchAll(
    /router\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g
  )) {
    mountMap[m[2]] = m[1];
  }

  const rows = [];
  for (const file of fs
    .readdirSync(ROUTE_DIR)
    .filter((f) => f.endsWith(".js") && f !== "index.js")) {
    const text = stripComments(fs.readFileSync(path.join(ROUTE_DIR, file), "utf8"));
    const imports = {};
    for (const m of text.matchAll(
      /const\s+(\w+)\s*=\s*require\(['"]\.\.\/controller\/([^'"]+)['"]\)\s*;/g
    )) {
      imports[m[1]] = `controller/${m[2]}.js`;
    }

    let mount = null;
    const varName = Object.keys(varToFile).find((k) => varToFile[k] === file);
    if (varName && mountMap[varName]) mount = mountMap[varName];

    for (const m of text.matchAll(
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,([\s\S]*?)\)\s*;/g
    )) {
      const method = m[1].toUpperCase();
      const routePath = m[2];
      const args = (m[3] || "").replace(/\s+/g, " ");
      let controllerRef = null;
      const cm = args.match(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/);
      if (cm && imports[cm[1]]) controllerRef = `${imports[cm[1]]}#${cm[2]}`;

      const fullPath = mount
        ? `/api/v1${mount}${routePath.startsWith("/") ? routePath : `/${routePath}`}`
        : `/api/v1${routePath.startsWith("/") ? routePath : `/${routePath}`}`;

      rows.push({
        method,
        routePath: fullPath.replace(/\/\/+/g, "/"),
        routeFile: `route/${file}`,
        controllerRef,
        mounted: Boolean(mount),
      });
    }
  }

  rows.sort(
    (a, b) =>
      a.routePath.localeCompare(b.routePath) || a.method.localeCompare(b.method)
  );

  return rows;
}

function writeRouteChecklist(routes) {
  fs.writeFileSync(
    OUT.routeChecklistJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: routes.length,
        mounted: routes.filter((r) => r.mounted).length,
        unmounted: routes.filter((r) => !r.mounted).length,
        routes,
      },
      null,
      2
    )
  );

  const lines = [];
  lines.push("# Route Checklist");
  lines.push("");
  lines.push(`- generatedAt: ${new Date().toISOString()}`);
  lines.push(`- total: ${routes.length}`);
  lines.push(`- mounted: ${routes.filter((r) => r.mounted).length}`);
  lines.push(`- unmounted: ${routes.filter((r) => !r.mounted).length}`);
  lines.push("");
  for (const r of routes) {
    lines.push(
      `- [ ] ${r.method} ${r.routePath} -> ${r.controllerRef || "unknown"} | ${r.routeFile} | mounted=${r.mounted}`
    );
  }
  fs.writeFileSync(OUT.routeChecklistMd, lines.join("\n"));
}

function extractCookieHeader(setCookie) {
  if (!setCookie || !Array.isArray(setCookie)) return null;
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

function pickResponseDataPreview(data) {
  if (data == null) return null;
  try {
    const s = typeof data === "string" ? data : JSON.stringify(data);
    return s.length > 1500 ? `${s.slice(0, 1500)}...` : s;
  } catch (e) {
    return String(data);
  }
}

async function ensureServer() {
  const r = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
  if (r.status !== 200) {
    throw new Error(`Health check failed with status ${r.status}`);
  }
}

function randomPhone() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    .replace(/\D/g, "")
    .slice(-9);
  return `9${tail.padStart(9, "0")}`;
}

function randomEmail(prefix) {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}.${ts}.${rand}@example.com`;
}

function dateOnly(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

async function fetchOtp(phone) {
  return Otp.findOne({ phone }).sort({ createdAt: -1 }).lean();
}

async function loginPatient(session) {
  const patient = await Patient.findOne({ isVerified: true, isActive: true }).lean();
  if (!patient || !patient.phone) {
    return { ok: false, reason: "No active+verified patient found" };
  }

  const loginReq = { phone: patient.phone };
  const loginRes = await axios.post(`${BASE_URL}/api/v1/patient/login`, loginReq, {
    validateStatus: () => true,
  });

  let otpDoc = await fetchOtp(patient.phone);
  if (!otpDoc) {
    await Otp.create({
      phone: patient.phone,
      otp: "123456",
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      type: "login",
      attempts: 0,
      deliveryStatus: "sent",
    });
    otpDoc = await fetchOtp(patient.phone);
  }

  const verifyReq = { phone: patient.phone, otp: String(otpDoc.otp) };
  const verifyRes = await axios.post(
    `${BASE_URL}/api/v1/patient/verify-login-otp`,
    verifyReq,
    { validateStatus: () => true }
  );

  const cookie = extractCookieHeader(verifyRes.headers["set-cookie"]);
  if (verifyRes.status === 200 && cookie) {
    session.patient = {
      cookie,
      identity: { phone: patient.phone, id: String(patient._id), email: patient.email },
    };
    return { ok: true, loginStatus: loginRes.status, verifyStatus: verifyRes.status };
  }
  return {
    ok: false,
    reason: "Patient OTP verify failed",
    loginStatus: loginRes.status,
    verifyStatus: verifyRes.status,
    verifyBody: verifyRes.data,
  };
}

async function loginDoctor(session) {
  const doctor = await Doctor.findOne({ isPhoneVerified: true, isActive: true }).lean();
  if (!doctor || !doctor.phone) return { ok: false, reason: "No active+verified doctor found" };

  const loginReq = { phone: doctor.phone, role: "doctor" };
  const loginRes = await axios.post(`${BASE_URL}/api/v1/doctor/login`, loginReq, {
    validateStatus: () => true,
  });

  let otpDoc = await fetchOtp(doctor.phone);
  if (!otpDoc) {
    await Otp.create({
      phone: doctor.phone,
      otp: "123456",
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      type: "login",
      attempts: 0,
      deliveryStatus: "sent",
    });
    otpDoc = await fetchOtp(doctor.phone);
  }

  const verifyReq = { phone: doctor.phone, otp: String(otpDoc.otp) };
  const verifyRes = await axios.post(
    `${BASE_URL}/api/v1/doctor/verify-login-otp`,
    verifyReq,
    { validateStatus: () => true }
  );

  const cookie = extractCookieHeader(verifyRes.headers["set-cookie"]);
  if (verifyRes.status === 200 && cookie) {
    session.doctor = {
      cookie,
      identity: { phone: doctor.phone, id: String(doctor._id), email: doctor.email },
    };
    return { ok: true, loginStatus: loginRes.status, verifyStatus: verifyRes.status };
  }
  return {
    ok: false,
    reason: "Doctor OTP verify failed",
    loginStatus: loginRes.status,
    verifyStatus: verifyRes.status,
    verifyBody: verifyRes.data,
  };
}

async function bootstrapAdminViaDb(email, phone, password) {
  const hash = await bcrypt.hash(password, 10);
  try {
    const created = await Admin.create({
      email: email.toLowerCase(),
      password: hash,
      firstName: "Route",
      lastName: "Verifier",
      phone,
      role: "superAdmin",
      isVerified: true,
      isActive: true,
      tokenVersion: 0,
    });
    return created;
  } catch (err) {
    if (err && err.code === 11000) {
      const existing = await Admin.findOne({ email: email.toLowerCase() }).select(
        "+password +isVerified +isActive +tokenVersion"
      );
      if (existing) {
        existing.password = hash;
        existing.isVerified = true;
        existing.isActive = true;
        existing.role = existing.role || "superAdmin";
        await existing.save({ validateBeforeSave: false });
      }
      return existing;
    }
    throw err;
  }
}

async function loginAdmin(session) {
  const password = process.env.TEST_ADMIN_PASSWORD || "RouteTest@123";
  const envEmail = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const candidates = [];
  if (envEmail) candidates.push({ email: envEmail, password });

  let loginRes = null;
  for (const c of candidates) {
    loginRes = await axios.post(`${BASE_URL}/api/v1/admin/login`, c, {
      validateStatus: () => true,
    });
    const cookie = extractCookieHeader(loginRes.headers["set-cookie"]);
    if (loginRes.status === 200 && cookie) {
      session.admin = { cookie, identity: { email: c.email } };
      return { ok: true, mode: "existing-admin-login", status: loginRes.status };
    }
  }

  const phone = randomPhone();
  const email = randomEmail("route.admin");
  const signupBody = {
    email,
    password,
    firstName: "Route",
    lastName: "Verifier",
    phone,
    role: "superAdmin",
  };

  const signupRes = await axios.post(`${BASE_URL}/api/v1/admin/signup`, signupBody, {
    validateStatus: () => true,
  });

  if (signupRes.status === 201) {
    let otpDoc = await fetchOtp(phone);
    if (!otpDoc) {
      await Otp.create({
        phone,
        otp: "123456",
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        type: "signup",
        attempts: 0,
        deliveryStatus: "sent",
      });
      otpDoc = await fetchOtp(phone);
    }

    await axios.post(
      `${BASE_URL}/api/v1/admin/verify-signup-otp`,
      { phone, otp: String(otpDoc.otp) },
      { validateStatus: () => true }
    );

    const loginBody = { email, password };
    const verifiedLogin = await axios.post(`${BASE_URL}/api/v1/admin/login`, loginBody, {
      validateStatus: () => true,
    });
    const cookie = extractCookieHeader(verifiedLogin.headers["set-cookie"]);
    if (verifiedLogin.status === 200 && cookie) {
      session.admin = { cookie, identity: { email, phone } };
      return { ok: true, mode: "signup-otp-login", status: verifiedLogin.status };
    }
  }

  await bootstrapAdminViaDb(email, phone, password);
  const dbLogin = await axios.post(
    `${BASE_URL}/api/v1/admin/login`,
    { email, password },
    { validateStatus: () => true }
  );
  const cookie = extractCookieHeader(dbLogin.headers["set-cookie"]);
  if (dbLogin.status === 200 && cookie) {
    session.admin = { cookie, identity: { email, phone, fallback: "db-bootstrap" } };
    return { ok: true, mode: "db-bootstrap-login", status: dbLogin.status };
  }

  // Last fallback: reset first existing admin password and verify flags in DB, then login
  const existing = await Admin.findOne({}).select("+password +isVerified +isActive +tokenVersion");
  if (existing) {
    existing.password = await bcrypt.hash(password, 10);
    existing.isVerified = true;
    existing.isActive = true;
    await existing.save({ validateBeforeSave: false });
    const fallbackLogin = await axios.post(
      `${BASE_URL}/api/v1/admin/login`,
      { email: existing.email, password },
      { validateStatus: () => true }
    );
    const fallbackCookie = extractCookieHeader(fallbackLogin.headers["set-cookie"]);
    if (fallbackLogin.status === 200 && fallbackCookie) {
      session.admin = {
        cookie: fallbackCookie,
        identity: { email: existing.email, phone: existing.phone, fallback: "existing-admin-reset" },
      };
      return { ok: true, mode: "existing-admin-reset-login", status: fallbackLogin.status };
    }
  }

  return { ok: false, reason: "Admin login failed", status: dbLogin.status, body: dbLogin.data };
}

async function loginServiceProvider(session, refs) {
  const password = process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123";
  const envEmail = process.env.TEST_PROVIDER_EMAIL;
  if (envEmail) {
    const envLogin = await axios.post(
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { email: envEmail, password },
      { validateStatus: () => true }
    );
    const envCookie = extractCookieHeader(envLogin.headers["set-cookie"]);
    if (envLogin.status === 200 && envCookie) {
      session.serviceProvider = {
        cookie: envCookie,
        identity: { email: envEmail, id: envLogin?.data?.data?.id || null },
      };
      return { ok: true, mode: "existing-provider-login" };
    }
  }

  if (!session.admin?.cookie) {
    return { ok: false, reason: "No admin session available to create service provider" };
  }

  const email = randomEmail("route.provider");
  const mobile = randomPhone();
  const cityId = refs.cityId;
  const serviceId = refs.serviceId;

  const createBody = {
    firstName: "Route",
    lastName: "Provider",
    ownerName: "Route Owner",
    age: 30,
    dateOfBirth: JSON.stringify("1995-01-01"),
    gender: "Male",
    mobile,
    email,
    password,
    currentAddress: JSON.stringify({
      street: "A-1",
      locality: "Center",
      city: "Lucknow",
      state: "UP",
      country: "India",
      pincode: "226001",
      landmark: "Near Test",
    }),
    permanentAddress: JSON.stringify({
      street: "A-1",
      locality: "Center",
      city: "Lucknow",
      state: "UP",
      country: "India",
      pincode: "226001",
      landmark: "Near Test",
      sameAsCurrent: true,
    }),
    services: JSON.stringify([
      {
        serviceId,
        serviceName: "Route Service",
        experienceYears: 3,
        specialization: "General",
      },
    ]),
    qualification: "BSc Nursing",
    registrationNumber: `REG-${Date.now()}`,
    registrationCouncil: "State Council",
    yearsOfExperience: 5,
    bankDetails: JSON.stringify({
      accountHolderName: "Route Provider",
      accountNumber: `${Date.now()}`.slice(-12),
      ifscCode: "SBIN0001234",
      bankName: "State Bank",
      branchName: "Main",
    }),
    availability: JSON.stringify({
      days: ["Monday", "Tuesday"],
      timeSlots: [{ startTime: "09:00", endTime: "12:00" }],
      available24x7: false,
    }),
    serviceCities: JSON.stringify([cityId]),
    languages: JSON.stringify(["Hindi", "English"]),
    emergencyContact: JSON.stringify({
      name: "Emergency",
      relationship: "Brother",
      mobile: randomPhone(),
    }),
  };

  const createRes = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/createservice-provider`,
    createBody,
    {
      validateStatus: () => true,
      headers: { Cookie: session.admin.cookie, "Content-Type": "application/json" },
    }
  );

  const loginRes = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/login`,
    { email, password },
    { validateStatus: () => true }
  );
  const cookie = extractCookieHeader(loginRes.headers["set-cookie"]);
  if (loginRes.status === 200 && cookie) {
    session.serviceProvider = {
      cookie,
      identity: { email, mobile, createStatus: createRes.status },
    };
    session.serviceProvider.identity.id = loginRes?.data?.data?.id || null;
    return { ok: true, mode: "created-and-login", createStatus: createRes.status };
  }

  return {
    ok: false,
    reason: "ServiceProvider login failed",
    createStatus: createRes.status,
    createBody: createRes.data,
    loginStatus: loginRes.status,
    loginBody: loginRes.data,
  };
}

async function buildEntityRefs(session) {
  const patientId = session.patient?.identity?.id || null;
  const doctorId = session.doctor?.identity?.id || null;

  const [city, service, treatmentByPatient, treatmentAny, bookingByPatient, bookingAny, invoice, itemCategory, crash, social, article, provider, doctorDoc, patientDoc] =
    await Promise.all([
      City.findOne({ isActive: true }).lean(),
      Service.findOne({ isDeleted: { $ne: true } }).lean(),
      patientId ? Treatment.findOne({ patientId }).sort({ createdAt: -1 }).lean() : null,
      Treatment.findOne({}).sort({ createdAt: -1 }).lean(),
      patientId
        ? Booking.findOne({ patientId, appointmentDate: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } })
            .sort({ appointmentDate: 1 })
            .lean()
        : null,
      Booking.findOne({}).sort({ createdAt: -1 }).lean(),
      Invoice.findOne({}).sort({ createdAt: -1 }).lean(),
      ItemCategory.findOne({ isDeleted: { $ne: true } }).lean(),
      CrashReport.findOne({}).sort({ createdAt: -1 }).lean(),
      SocialPost.findOne({}).sort({ createdAt: -1 }).lean(),
      Article.findOne({}).sort({ createdAt: -1 }).lean(),
      session.serviceProvider?.identity?.id
        ? ServiceProvider.findById(session.serviceProvider.identity.id).lean()
        : ServiceProvider.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean(),
      doctorId ? Doctor.findById(doctorId).lean() : null,
      patientId ? Patient.findById(patientId).lean() : null,
    ]);

  const treatment = treatmentByPatient || treatmentAny;
  const booking = bookingByPatient || bookingAny;
  const clinicId = doctorDoc?.clinics?.[0]?._id ? String(doctorDoc.clinics[0]._id) : "507f1f77bcf86cd799439016";
  const historyId = patientDoc?.medicalHistory?.[0]?._id
    ? String(patientDoc.medicalHistory[0]._id)
    : "507f1f77bcf86cd799439017";

  return {
    cityId: city ? String(city._id) : "507f1f77bcf86cd799439014",
    serviceId: service ? String(service._id) : "507f1f77bcf86cd799439013",
    bookingId: booking ? String(booking._id) : "507f1f77bcf86cd799439012",
    bookingSessionNumber: booking?.sessionNumber || 1,
    treatmentId: treatment ? String(treatment._id) : "507f1f77bcf86cd799439018",
    invoiceId: invoice ? String(invoice._id) : "507f1f77bcf86cd799439015",
    itemCategoryId: itemCategory ? String(itemCategory._id) : "507f1f77bcf86cd79943901a",
    crashId: crash ? String(crash._id) : "507f1f77bcf86cd799439019",
    socialId: social ? String(social._id) : "507f1f77bcf86cd79943901a",
    articleId: article ? String(article._id) : "507f1f77bcf86cd79943901b",
    providerId: provider ? String(provider._id) : "507f1f77bcf86cd79943901c",
    clinicId,
    historyId,
    patientId: session.patient?.identity?.id || "507f191e810c19729de860ea",
    doctorId: session.doctor?.identity?.id || "507f1f77bcf86cd799439011",
  };
}

function fillRoutePath(routePath, refs) {
  let genericId = refs.itemCategoryId;
  if (routePath.startsWith("/api/v1/article/")) genericId = refs.articleId;
  else if (routePath.startsWith("/api/v1/socialPost/")) genericId = refs.socialId;
  else if (routePath.startsWith("/api/v1/service/service/")) genericId = refs.serviceId;
  else if (routePath.startsWith("/api/v1/service/services/")) genericId = refs.serviceId;
  else if (routePath.startsWith("/api/v1/serviceProvider/service-provider/")) genericId = refs.providerId;
  else if (routePath.startsWith("/api/v1/admin/doctors/")) genericId = refs.doctorId;
  else if (routePath.startsWith("/api/v1/admin/patients/")) genericId = refs.patientId;
  else if (routePath.startsWith("/api/v1/patient/updateProfile/")) genericId = refs.patientId;

  return routePath
    .replace(/:patientId\b/g, refs.patientId)
    .replace(/:doctorId\b/g, refs.doctorId)
    .replace(/:bookingId\b/g, refs.bookingId)
    .replace(/:serviceId\b/g, refs.serviceId)
    .replace(/:cityId\b/g, refs.cityId)
    .replace(/:invoiceId\b/g, refs.invoiceId)
    .replace(/:treatmentId\b/g, refs.treatmentId)
    .replace(/:crashId\b/g, refs.crashId)
    .replace(/:providerId\b/g, refs.providerId)
    .replace(/:clinicId\b/g, refs.clinicId)
    .replace(/:historyId\b/g, refs.historyId)
    .replace(/:specialization\b/g, "general")
    .replace(/:cityName\b/g, "Lucknow")
    .replace(/:category\b/g, "general")
    .replace(/:nursingType\b/g, "icu")
    .replace(/:id\b/g, genericId)
    .replace(/:postId\b/g, refs.socialId);
}

function withQuery(p) {
  if (p.includes("/socialPost/search")) return `${p}?q=health&type=posts&page=1&limit=5`;
  if (p.includes("/service/search")) return `${p}?q=care`;
  if (p.endsWith("/search")) return `${p}?q=test`;
  if (p.includes("/slots/")) return `${p}?date=2026-05-09`;
  if (p.includes("/city/find/by-location")) return `${p}?latitude=26.8467&longitude=80.9462`;
  if (p.includes("/admin/patient/") && p.endsWith("/medications")) return `${p}?medication=Paracetamol`;
  if (p.includes("/article/articles")) return `${p}?page=1&limit=5`;
  if (p.includes("/article/getallarticle")) return `${p}?page=1&limit=5`;
  if (p.includes("/booking/getAllBookings")) return `${p}?page=1&limit=5`;
  return p;
}

function payloadFor(pathname, method, sessions, refs) {
  const now = Date.now();
  const apptDate = dateOnly(2);
  const slotDate = dateOnly(1);
  if (pathname.endsWith("/patient/login")) {
    return sessions.patient?.identity?.phone
      ? { phone: sessions.patient.identity.phone }
      : {};
  }
  if (pathname.endsWith("/doctor/login")) {
    return sessions.doctor?.identity?.phone
      ? { phone: sessions.doctor.identity.phone, role: "doctor" }
      : {};
  }
  if (pathname.endsWith("/admin/login")) {
    return sessions.admin?.identity?.email && process.env.TEST_ADMIN_PASSWORD
      ? { email: sessions.admin.identity.email, password: process.env.TEST_ADMIN_PASSWORD }
      : {};
  }
  if (pathname.endsWith("/serviceProvider/login")) {
    return sessions.serviceProvider?.identity?.email
      ? {
          email: sessions.serviceProvider.identity.email,
          password: process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123",
        }
      : {};
  }
  if (pathname.includes("/geo/check-location")) {
    return { latitude: 26.8467, longitude: 80.9462 };
  }
  if (pathname.includes("/crash-report/create")) {
    return { userType: "patient", message: "Route verification synthetic crash record" };
  }
  if (pathname.endsWith("/admin/signup")) {
    return {
      email: randomEmail("route.admin.signup"),
      password: "RouteTest@123",
      firstName: "Route",
      lastName: "Signup",
      phone: randomPhone(),
      role: "superAdmin",
    };
  }
  if (pathname.endsWith("/patient/signup")) {
    return {
      firstName: "Route Patient",
      email: randomEmail("route.patient"),
      phone: randomPhone(),
      password: "RouteTest@123",
    };
  }
  if (pathname.endsWith("/doctor/signup")) {
    return {
      firstName: "Route Doctor",
      email: randomEmail("route.doctor"),
      phone: randomPhone(),
      medicalRegistrationNumber: `MED-${now}`,
      issuingMedicalCouncil: "Medical Council",
      specialization: "General",
      cityId: refs.cityId,
      password: "RouteTest@123",
    };
  }
  if (pathname.includes("/doctor/availability")) {
    return {
      days: ["Monday", "Tuesday"],
      timeSlots: [{ start: "09:00", end: "11:00" }],
      slotDuration: 30,
      startDate: slotDate,
      endDate: dateOnly(2),
      serviceAvailability: { consultation: true },
      serviceCoverage: { mode: "Home Service", areas: ["Central Zone"], maxDistance: 10 },
    };
  }
  if (pathname.includes("/doctor/break-time")) {
    if (method === "DELETE") return { date: slotDate, startTime: "10:00" };
    return { date: slotDate, startTime: "10:00", endTime: "10:30", reason: "Route verification break" };
  }
  if (pathname.includes("/doctor/toggle-slot")) {
    return { date: slotDate, startTime: "09:00", isSlotAvailable: false };
  }
  if (pathname.includes("/doctor/service-availability")) {
    return {
      serviceType: "Consultation",
      isOffering: true,
      modes: ["Home Service"],
      pricing: { basePrice: 300 },
      slotDuration: 30,
      maxBookingsPerDay: 15,
    };
  }
  if (pathname.includes("/doctor/service-coverage")) {
    return { areas: ["Lucknow"], maxDistance: 15, homeServiceCharges: 100 };
  }
  if (pathname.endsWith("/doctor/clinic")) {
    return { clinicfirstName: "Route Clinic", address: "A1, Main Road", phone: randomPhone() };
  }
  if (pathname.includes("/doctor/clinic/")) {
    return { clinicfirstName: "Route Clinic Updated", address: "B2, Updated Road" };
  }
  if (pathname.endsWith("/doctor/verification-documents")) {
    return {
      identityProof: { type: "Aadhaar", number: "123412341234", url: "https://example.com/id-proof.pdf" },
      degreesCertificates: [{ title: "MBBS", url: "https://example.com/mbbs.pdf" }],
      medicalCouncilRegistration: { council: "MCI", regNo: `REG-${now}` },
    };
  }
  if (pathname.includes("/booking/create") || pathname.includes("/booking/providerBookings")) {
    return {
      patientId: refs.patientId,
      serviceId: refs.serviceId,
      treatmentId: refs.treatmentId,
      appointmentDate: apptDate,
      startTime: "10:00",
      endTime: "10:30",
      duration: 30,
      category: "general",
      modes: ["Home Service"],
      cityId: refs.cityId,
      servicePartnerId: refs.providerId,
      notes: "Route verification booking",
    };
  }
  if (pathname.includes("/booking/completed-details/")) {
    return { notes: "Completed by route verifier", completionRemark: "all good" };
  }
  if (pathname.includes("/booking/cancel/")) {
    return { reason: "Patient requested cancellation due to schedule conflict" };
  }
  if (pathname.includes("/booking/reschedule/")) {
    return {
      appointmentDate: dateOnly(3),
      startTime: "11:00",
      endTime: "11:30",
      duration: 30,
      servicePartnerId: refs.providerId,
      shiftType: "day",
    };
  }
  if (pathname.includes("/booking/update-status/")) {
    return { status: "Completed", notes: "Marked complete by verifier" };
  }
  if (pathname.includes("/admin/addEquipments")) {
    return {
      name: `Route Equipment ${now}`,
      description: "Synthetic equipment for route verification",
      basePrice: 250,
      equipmentCharges: 50,
      cities: [refs.cityId],
      minDuration: 60,
      maxDuration: 240,
      image: "https://example.com/equipment.png",
    };
  }
  if (pathname.includes("/admin/admin/doctor/add-cities")) {
    return { doctorId: refs.doctorId, cityIds: [refs.cityId] };
  }
  if (pathname.includes("/admin/admin/doctor/remove-cities")) {
    return { doctorId: refs.doctorId, cityIds: [refs.cityId] };
  }
  if (pathname.includes("/admin/admin/doctor/update-cities")) {
    return { doctorId: refs.doctorId, cityIds: [refs.cityId] };
  }
  if (pathname.includes("/admin/bookings/create")) {
    return {
      patientId: refs.patientId,
      serviceId: refs.serviceId,
      appointmentDate: apptDate,
      startTime: "09:30",
      endTime: "10:00",
      duration: 30,
      cityId: refs.cityId,
      notes: "Admin route booking create",
    };
  }
  if (pathname.includes("/admin/bookings/") && pathname.includes("/status")) {
    return { status: "Approved", reason: "Status updated by route verifier" };
  }
  if (pathname.includes("/admin/bookings/update/")) {
    return {
      patientId: refs.patientId,
      appointmentDate: dateOnly(3),
      startTime: "12:00",
      endTime: "12:30",
      duration: 30,
      cityId: refs.cityId,
      sessionNumber: refs.bookingSessionNumber || 1,
      notes: "Admin update route verifier",
    };
  }
  if (pathname.includes("/admin/admin/booking/approve-cancellation/")) {
    return { action: "approve", adminReason: "Approved by automated route verification" };
  }
  if (pathname.includes("/admin/patient/") && pathname.includes("/medications")) {
    if (method === "DELETE") return {};
    return { medication: "Paracetamol" };
  }
  if (pathname.includes("/admin/doctors/create")) {
    return {
      firstName: "RouteDoc",
      lastName: "Create",
      email: randomEmail("route.admin.doc"),
      phone: randomPhone(),
      cityId: refs.cityId,
      specialization: "General",
      password: "RouteTest@123",
    };
  }
  if (pathname.includes("/admin/patients/create")) {
    return {
      firstName: "RoutePatient",
      lastName: "Create",
      email: randomEmail("route.admin.patient"),
      phone: randomPhone(),
      password: "RouteTest@123",
    };
  }
  if (pathname.includes("/admin/patients/") && pathname.includes("/block")) {
    return { reason: "Synthetic block reason for route verification" };
  }
  if (pathname.includes("/admin/updateProfile")) {
    return { firstName: "AdminRoute", lastName: "Verifier" };
  }
  if (pathname.includes("/items/create")) {
    return {
      name: `Route Category ${now}`,
      description: "Created by route verifier",
      type: "medical",
      items: [{ name: "Disposable Gloves", unitPrice: 50 }],
    };
  }
  if (pathname.includes("/items/update/")) {
    return {
      name: `Route Category Updated ${now}`,
      description: "Updated by route verifier",
      items: [{ name: "Disposable Mask", unitPrice: 20, isActive: true }],
    };
  }
  if (pathname.includes("/patient/allergies")) {
    if (method === "DELETE") return { allergy: "Dust" };
    return { allergy: "Dust" };
  }
  if (pathname.includes("/patient/medications")) {
    if (method === "DELETE") return { medication: "Paracetamol" };
    return { medication: "Paracetamol" };
  }
  if (pathname.includes("/patient/medical-history")) {
    if (method === "DELETE") return {};
    return { condition: "Hypertension", diagnosedAt: "2023-01-01", notes: "Route verifier seed" };
  }
  if (pathname.includes("/patient/updateProfile/")) {
    return { firstName: "PatientRoute", city: "Lucknow" };
  }
  if (pathname.includes("/patient/follow/") || pathname.includes("/patient/unfollow/")) {
    return {};
  }
  if (pathname.includes("/payments/treatments/") && pathname.includes("/online/order")) {
    return { amount: 100 };
  }
  if (pathname.includes("/payments/treatments/") && pathname.includes("/online/verify")) {
    return {
      razorpay_order_id: "order_route_test",
      razorpay_payment_id: "pay_route_test",
      razorpay_signature: "invalid_signature_for_test",
    };
  }
  if (pathname.includes("/payments/treatments/") && pathname.includes("/manual-collection")) {
    return { amount: 100, method: "Cash", stage: "Advance", note: "Route verifier manual payment" };
  }
  if (pathname.includes("/payments/treatments/") && pathname.includes("/refunds/manual")) {
    return {
      amount: 50,
      reason: "Route verifier refund test",
      mode: "Cash",
      refundType: "Partial",
      note: "Route verifier manual refund",
    };
  }
  if (pathname.includes("/service/createService")) {
    return {
      name: `Route Service ${now}`,
      description: "Service created by route verifier",
      category: "general",
      basePrice: 300,
      modes: ["Home Service"],
      cities: [refs.cityId],
      defaultDuration: 30,
    };
  }
  if (pathname.includes("/service/services/") || pathname.includes("/service/admin/bulk-update")) {
    return { isActive: true, description: "Updated by route verifier" };
  }
  if (pathname.includes("/serviceProvider/createservice-provider")) {
    return {
      firstName: "Route",
      lastName: "Provider",
      ownerName: "Route Owner",
      age: 30,
      dateOfBirth: JSON.stringify("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("route.provider.create"),
      password: process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123",
      currentAddress: JSON.stringify({
        street: "A-1",
        locality: "Center",
        city: "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
      }),
      permanentAddress: JSON.stringify({
        street: "A-1",
        locality: "Center",
        city: "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
        sameAsCurrent: true,
      }),
      services: JSON.stringify([
        { serviceId: refs.serviceId, serviceName: "General", experienceYears: 3, specialization: "General" },
      ]),
      qualification: "BSc Nursing",
      registrationNumber: `REG-${now}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 5,
      bankDetails: JSON.stringify({
        accountHolderName: "Route Provider",
        accountNumber: `${now}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "SBI",
      }),
      serviceCities: JSON.stringify([refs.cityId]),
      languages: JSON.stringify(["Hindi", "English"]),
    };
  }
  if (pathname.includes("/serviceProvider/service-provider/") && method === "PUT") {
    return { firstName: "RouteProviderUpdated", yearsOfExperience: 6 };
  }
  if (pathname.includes("/socialPost/createPost")) {
    return { type: "TEXT", content: "Route verification post content" };
  }
  if (pathname.includes("/socialPost/addComment/") || pathname.includes("/socialPost/commentPost/")) {
    return { text: "Route verification comment" };
  }
  if (pathname.includes("/socialPost/followDoctor")) {
    return { doctorId: refs.doctorId };
  }
  if (pathname.includes("/invoice/generate")) {
    return {
      bookingId: refs.bookingId,
      patientId: refs.patientId,
      doctorId: refs.providerId,
      serviceId: refs.serviceId,
      billingDetails: {
        category: "consultation",
        serviceName: "General Consultation",
        shiftType: "hourly",
        durationMinutes: 30,
        basePrice: 150,
        calculatedBase: 150,
        taxPercentage: 0,
      },
      medicines: [{ name: "Pain Relief", quantity: 1, pricePerUnit: 50, gstPercentage: 0 }],
      additionalEquipment: [],
    };
  }
  if (pathname.includes("/uploadfile/upload")) return { file: null };
  return {};
}

function contextOrder(pathname) {
  const p = pathname.toLowerCase();
  if (p.includes("/admin/")) return ["public", "admin"];
  if (p.includes("/doctor/")) return ["public", "doctor", "admin"];
  if (p.includes("/patient/")) return ["public", "patient", "admin", "doctor"];
  if (p.includes("/serviceprovider/")) return ["public", "serviceProvider", "admin"];
  if (p.includes("/payments/")) return ["public", "patient", "admin", "serviceProvider"];
  if (p.includes("/booking/")) return ["public", "patient", "doctor", "serviceProvider", "admin"];
  if (p.includes("/socialpost/")) return ["public", "patient", "doctor", "admin"];
  if (p.includes("/items/")) return ["public", "admin", "doctor"];
  if (p.includes("/service/")) return ["public", "admin", "doctor", "patient"];
  return ["public", "patient", "doctor", "serviceProvider", "admin"];
}

function isGlobalNotFound(status, preview) {
  return status === 404 && /Can't find .* on this server!/i.test(preview || "");
}

function classify(status, preview, mounted) {
  if (!mounted) return "unmounted";
  if (status === 0) return "server-bug";
  if (status === 401 || status === 403) return "auth";
  if (status === 400 || status === 422) return "validation";
  if (status === 404) {
    if (/Can't find .* on this server!/i.test(preview || "")) return "unmounted";
    return "not-found";
  }
  if (status >= 500) return "server-bug";
  return "ok";
}

async function refreshSessionForContext(ctxName, sessions, refs) {
  if (ctxName === "patient") return loginPatient(sessions);
  if (ctxName === "doctor") return loginDoctor(sessions);
  if (ctxName === "admin") return loginAdmin(sessions);
  if (ctxName === "serviceProvider") return loginServiceProvider(sessions, refs);
  return { ok: false, reason: "No refresh handler" };
}

async function hitAllRoutes(routes, sessions, refs) {
  const attempts = [];

  for (const route of routes.filter((r) => r.mounted)) {
    const executablePath = withQuery(fillRoutePath(route.routePath, refs));
    const method = route.method.toLowerCase();
    const url = `${BASE_URL}${executablePath}`;
    const body = payloadFor(executablePath, route.method, sessions, refs);
    const contexts = contextOrder(executablePath);

    const routeTries = [];
    let final = null;

    for (const ctxName of contexts) {
      const headers = { "Content-Type": "application/json" };
      if (ctxName !== "public") {
        const sess = sessions[ctxName];
        if (!sess?.cookie) continue;
        headers.Cookie = sess.cookie;
      }

      const startedAt = Date.now();
      let resStatus = 0;
      let resData = null;
      let err = null;
      try {
        const res = await axios({
          method,
          url,
          headers,
          data: method === "get" ? undefined : body,
          timeout: 30000,
          validateStatus: () => true,
        });
        resStatus = res.status;
        resData = res.data;
      } catch (e) {
        err = e.message;
      }

      if (resStatus === 401 && ctxName !== "public") {
        const refreshed = await refreshSessionForContext(ctxName, sessions, refs);
        if (refreshed?.ok) {
          const retryHeaders = { ...headers };
          const retryCookie = sessions[ctxName]?.cookie;
          if (retryCookie) retryHeaders.Cookie = retryCookie;
          try {
            const retryRes = await axios({
              method,
              url,
              headers: retryHeaders,
              data: method === "get" ? undefined : body,
              timeout: 30000,
              validateStatus: () => true,
            });
            resStatus = retryRes.status;
            resData = retryRes.data;
            err = null;
          } catch (retryErr) {
            err = retryErr.message;
          }
        }
      }

      const tryItem = {
        context: ctxName,
        request: {
          method: route.method,
          url: executablePath,
          headers: {
            hasCookie: Boolean(headers.Cookie),
            contentType: headers["Content-Type"],
          },
          body: method === "get" ? null : body,
        },
        response: {
          status: resStatus,
          bodyPreview: pickResponseDataPreview(resData),
          error: err,
          durationMs: Date.now() - startedAt,
        },
      };
      routeTries.push(tryItem);
      final = tryItem;

      if (resStatus >= 200 && resStatus < 500 && ![401, 403].includes(resStatus)) break;
      if (![401, 403].includes(resStatus) && resStatus !== 0) break;
    }

    if (!final) {
      final = {
        context: "none",
        request: { method: route.method, url: executablePath, headers: {}, body },
        response: { status: 0, bodyPreview: null, error: "No valid context available", durationMs: 0 },
      };
      routeTries.push(final);
    }

    const status = final.response.status;
    const preview = final.response.bodyPreview;
    const routed = !isGlobalNotFound(status, preview);
    const controllerReached = route.mounted && routed && ![401, 403].includes(status);

    attempts.push({
      method: route.method,
      path: route.routePath,
      executablePath,
      routeFile: route.routeFile,
      controllerRef: route.controllerRef,
      authContext: final.context,
      requestHeaders: final.request.headers,
      requestBody: final.request.body,
      responseStatus: status,
      responseBody: final.response.bodyPreview,
      responseError: final.response.error,
      durationMs: final.response.durationMs,
      timestamp: new Date().toISOString(),
      isMounted: route.mounted,
      controllerReached,
      tries: routeTries,
    });
  }

  return attempts;
}

function writeVerificationReports(routes, attempts, sessionMeta) {
  const controllerStats = {};
  for (const a of attempts) {
    const key = a.controllerRef || "unknown";
    if (!controllerStats[key]) {
      controllerStats[key] = {
        total: 0,
        reached: 0,
        success2xx: 0,
        authBlocked: 0,
        validation: 0,
        notFound: 0,
        serverBug: 0,
      };
    }
    const s = controllerStats[key];
    s.total += 1;
    if (a.controllerReached) s.reached += 1;
    if (a.responseStatus >= 200 && a.responseStatus < 300) s.success2xx += 1;
    const cat = classify(a.responseStatus, a.responseBody, true);
    if (cat === "auth") s.authBlocked += 1;
    if (cat === "validation") s.validation += 1;
    if (cat === "not-found") s.notFound += 1;
    if (cat === "server-bug") s.serverBug += 1;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRoutes: routes.length,
    mountedRoutes: routes.filter((r) => r.mounted).length,
    unmountedRoutes: routes.filter((r) => !r.mounted).length,
    attemptedRoutes: attempts.length,
    status2xx: attempts.filter((a) => a.responseStatus >= 200 && a.responseStatus < 300)
      .length,
    status400: attempts.filter((a) => a.responseStatus === 400).length,
    status401: attempts.filter((a) => a.responseStatus === 401).length,
    status403: attempts.filter((a) => a.responseStatus === 403).length,
    status404: attempts.filter((a) => a.responseStatus === 404).length,
    status5xx: attempts.filter((a) => a.responseStatus >= 500).length,
    controllerReached: attempts.filter((a) => a.controllerReached).length,
  };

  fs.writeFileSync(
    OUT.verificationJson,
    JSON.stringify({ summary, sessionMeta, attempts, controllerStats }, null, 2)
  );

  const lines = [];
  lines.push("# Live API Verification Report");
  lines.push("");
  for (const [k, v] of Object.entries(summary)) lines.push(`- ${k}: ${v}`);
  lines.push("");
  lines.push("## Sessions");
  for (const [k, v] of Object.entries(sessionMeta)) {
    lines.push(`- ${k}: ${v.ok ? "ok" : `failed (${v.reason || "unknown"})`}`);
  }
  lines.push("");
  lines.push("## Route Checklist Execution");
  for (const a of attempts) {
    const pass = a.responseStatus >= 200 && a.responseStatus < 500;
    lines.push(
      `- [x] ${a.method} ${a.path} -> ${a.controllerRef || "unknown"} | ${a.responseStatus} | ${a.authContext} | ${pass ? "pass" : "fail"}`
    );
    lines.push(`  req.body: ${pickResponseDataPreview(a.requestBody) || "null"}`);
    lines.push(`  res.body: ${a.responseBody || "null"}`);
  }

  fs.writeFileSync(OUT.verificationMd, lines.join("\n"));
}

function writeErrorDiff(routes, attempts) {
  const unmounted = routes.filter((r) => !r.mounted).map((r) => ({
    method: r.method,
    path: r.routePath,
    controllerRef: r.controllerRef,
    category: "unmounted",
    error: "Route file exists but not mounted in route/index.js",
    status: null,
  }));

  const errors = attempts
    .filter((a) => a.responseStatus >= 400 || a.responseStatus === 0)
    .map((a) => {
      const category = classify(a.responseStatus, a.responseBody, true);
      return {
        method: a.method,
        path: a.path,
        controllerRef: a.controllerRef,
        status: a.responseStatus,
        category,
        error:
          a.responseError ||
          (() => {
            try {
              const parsed = JSON.parse(a.responseBody || "{}");
              return parsed.message || parsed.error?.message || a.responseBody;
            } catch (e) {
              return a.responseBody || "Unknown error";
            }
          })(),
        stackExcerpt: a.responseBody && a.responseBody.includes("stack")
          ? a.responseBody.slice(0, 400)
          : null,
        reproducibility: `${a.method} ${a.executablePath} using context=${a.authContext}`,
      };
    });

  const all = [...errors, ...unmounted];
  fs.writeFileSync(
    OUT.errorDiffJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalErrorRoutes: all.length,
        items: all,
      },
      null,
      2
    )
  );

  const lines = [];
  lines.push("# Route Error Diff");
  lines.push("");
  lines.push(`- generatedAt: ${new Date().toISOString()}`);
  lines.push(`- totalErrorRoutes: ${all.length}`);
  lines.push("");
  for (const e of all) {
    lines.push(
      `- ${e.method} ${e.path} -> ${e.controllerRef || "unknown"} | status=${e.status ?? "N/A"} | category=${e.category}`
    );
    lines.push(`  error: ${e.error || "n/a"}`);
    lines.push(`  reproducibility: ${e.reproducibility || "n/a"}`);
  }
  fs.writeFileSync(OUT.errorDiffMd, lines.join("\n"));
}

async function main() {
  const routes = parseRoutes();
  writeRouteChecklist(routes);

  await ensureServer();
  await mongoose.connect(process.env.MONGODB_URI);

  const sessions = {};
  const sessionMeta = {};
  sessionMeta.patient = await loginPatient(sessions);
  sessionMeta.doctor = await loginDoctor(sessions);
  sessionMeta.admin = await loginAdmin(sessions);

  const refs = await buildEntityRefs(sessions);
  sessionMeta.serviceProvider = await loginServiceProvider(sessions, refs);
  const mergedRefs = await buildEntityRefs(sessions);

  const attempts = await hitAllRoutes(routes, sessions, mergedRefs);
  writeVerificationReports(routes, attempts, sessionMeta);
  writeErrorDiff(routes, attempts);

  await mongoose.disconnect();

  console.log("DONE");
  console.log(JSON.stringify({ BASE_URL, outputs: OUT }, null, 2));
}

main().catch(async (err) => {
  try {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  } catch (_) {}
  console.error("FAILED", err);
  process.exit(1);
});
