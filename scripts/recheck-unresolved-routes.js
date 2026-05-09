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

const ROOT = process.cwd();
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
const SOURCE = path.join(ROOT, "post-fix-route-failures.json");
const OUT_JSON = path.join(ROOT, "_route_recheck_11_report.json");
const OUT_MD = path.join(ROOT, "_route_recheck_11_report.md");
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

function pickMsg(data, err) {
  return (
    data?.message ||
    data?.error?.message ||
    data?.error ||
    err ||
    ""
  );
}

function cookieFromSetCookie(setCookie) {
  if (!Array.isArray(setCookie)) return null;
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function apiReq({ method, url, body, cookie }) {
  const start = Date.now();
  try {
    const res = await axios({
      method,
      url,
      data: body,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      validateStatus: () => true,
      timeout: 30000,
    });
    return {
      status: res.status,
      body: res.data,
      message: pickMsg(res.data, null),
      durationMs: Date.now() - start,
      requestError: null,
    };
  } catch (e) {
    return {
      status: 0,
      body: null,
      message: pickMsg(null, e.message),
      durationMs: Date.now() - start,
      requestError: `${e.code ? `${e.code}: ` : ""}${e.message}`,
    };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServer() {
  try {
    const probe = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (probe.status === 200) return;
  } catch (_) {}

  const { spawn } = require("child_process");
  const child = spawn("node", ["server.js"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  STARTED_PIDS.push(child.pid);

  for (let i = 0; i < 40; i += 1) {
    try {
      const h = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (h.status === 200) return;
    } catch (_) {}
    await sleep(750);
  }
  throw new Error("Health check failed after server start attempt");
}

async function fetchOtp(phone) {
  return Otp.findOne({ phone }).sort({ createdAt: -1 }).lean();
}

async function loginPatient(sessions) {
  const patient = await Patient.findOne({ isVerified: true, isActive: true }).lean();
  if (!patient?.phone) return;

  await apiReq({
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
  if (cookie) {
    sessions.patient = { cookie, userId: String(patient._id) };
  }
}

async function loginDoctor(sessions) {
  const doctor = await Doctor.findOne({ isPhoneVerified: true, isActive: true }).lean();
  if (!doctor?.phone) return;

  await apiReq({
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
  if (cookie) {
    sessions.doctor = { cookie, userId: String(doctor._id) };
  }
}

async function loginAdmin(sessions) {
  const password = process.env.TEST_ADMIN_PASSWORD || "RouteTest@123";
  let admin = await Admin.findOne({ role: { $in: ["superAdmin", "subAdmin"] } }).select("+password");

  if (!admin) {
    const hash = await bcrypt.hash(password, 10);
    admin = await Admin.create({
      firstName: "Recheck",
      lastName: "Admin",
      email: randomEmail("recheck.admin").toLowerCase(),
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
  if (cookie) {
    sessions.admin = { cookie, userId: String(admin._id) };
  }
}

async function loginServiceProvider(sessions) {
  const password = process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123";
  let provider = await ServiceProvider.findOne({ isDeleted: { $ne: true } }).select("+password").sort({ createdAt: -1 });

  if (!provider) {
    const city = await City.findOne({ isActive: true }).lean() || await City.findOne({}).lean();
    const service = await Service.findOne({ isActive: true, isDeleted: { $ne: true } }).lean() || await Service.findOne({}).lean();
    if (!city || !service) return;

    provider = await ServiceProvider.create({
      firstName: "Recheck",
      lastName: "Provider",
      ownerName: "Recheck Owner",
      age: 30,
      dateOfBirth: new Date("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("recheck.provider"),
      password,
      currentAddress: {
        street: "A-1",
        locality: "Center",
        city: city.name || "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
      },
      permanentAddress: {
        street: "A-1",
        locality: "Center",
        city: city.name || "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
        sameAsCurrent: true,
      },
      services: [{ serviceId: service._id, serviceName: "General", experienceYears: 2 }],
      qualification: "BSc Nursing",
      registrationNumber: `REG-RECHECK-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 4,
      bankDetails: {
        accountHolderName: "Recheck Provider",
        accountNumber: `${Date.now()}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "SBI",
      },
      serviceCities: [city._id],
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
    await provider.save({ validateBeforeSave: false });
  }

  const login = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/login`,
    { email: provider.email, password },
    { validateStatus: () => true }
  );
  const cookie = cookieFromSetCookie(login.headers["set-cookie"]);
  if (cookie) {
    sessions.serviceProvider = { cookie, userId: String(provider._id) };
  }
}

function issueFor(status, msg) {
  if (status === 500) return "Backend bug (unhandled/runtime/server-side failure)";
  if (status === 401 || status === 403) return "Auth/role restriction";
  if (status === 404) return "Data precondition missing / referenced resource not found";
  if (status === 409) return "Business-rule conflict (slot/state conflict)";
  if (status === 400) return "Validation/input/precondition failure";
  if (status >= 200 && status < 400) return "No issue (route passed in this retest)";
  return "Transport/external failure";
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error("post-fix-route-failures.json not found");
  }
  const source = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const items = Array.isArray(source.unresolved) ? source.unresolved : [];
  if (!items.length) {
    throw new Error("No unresolved routes in source file");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await ensureServer();

  const sessions = {};
  await loginPatient(sessions);
  await loginDoctor(sessions);
  await loginAdmin(sessions);
  await loginServiceProvider(sessions);

  const byContext = {
    patient: sessions.patient?.cookie || null,
    doctor: sessions.doctor?.cookie || null,
    admin: sessions.admin?.cookie || null,
    serviceProvider: sessions.serviceProvider?.cookie || null,
    public: null,
  };

  const rows = [];
  for (const item of items) {
    const method = String(item.method || "").toUpperCase();
    const execPath = item.requestUrl || item.path;
    const url = `${BASE_URL}${execPath}`;
    const reqBody = item.requestBody || {};
    const ctx = item.context || "public";
    const cookie = byContext[ctx] || null;
    const resp = await apiReq({ method, url, body: reqBody, cookie });

    rows.push({
      method,
      path: item.path,
      executedUrl: execPath,
      context: ctx,
      requestBody: reqBody,
      responseStatus: resp.status,
      responseBody: resp.body,
      responseMessage: resp.message,
      requestError: resp.requestError,
      durationMs: resp.durationMs,
      issue: issueFor(resp.status, resp.message),
    });
  }

  const out = {
    generatedAt: nowIso(),
    baseUrl: BASE_URL,
    totalRoutesRetested: rows.length,
    rows,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));

  const md = [];
  md.push("# Unresolved Route Recheck (No Fix)");
  md.push("");
  md.push(`- generatedAt: ${out.generatedAt}`);
  md.push(`- baseUrl: ${out.baseUrl}`);
  md.push(`- totalRoutesRetested: ${out.totalRoutesRetested}`);
  md.push("");
  rows.forEach((r, i) => {
    md.push(`## ${i + 1}. ${r.method} ${r.path}`);
    md.push(`- Context used: ${r.context}`);
    md.push(`- Executed URL: ${r.executedUrl}`);
    md.push(`- Response status: ${r.responseStatus}`);
    md.push(`- Issue: ${r.issue}`);
    md.push(`- Request body: \`${JSON.stringify(r.requestBody)}\``);
    md.push(`- Response body: \`${JSON.stringify(r.responseBody)}\``);
    md.push("");
  });
  fs.writeFileSync(OUT_MD, md.join("\n"));

  await mongoose.disconnect();
  for (const pid of STARTED_PIDS) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }
  console.log(JSON.stringify({ outJson: OUT_JSON, outMd: OUT_MD, count: rows.length }, null, 2));
}

main().catch(async (err) => {
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
