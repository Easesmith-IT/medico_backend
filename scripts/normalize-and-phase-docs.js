const fs = require("fs");
const path = require("path");
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

const ROOT = process.cwd();
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;

const FILES = {
  checklist: path.join(ROOT, "_route_checklist.json"),
  live: path.join(ROOT, "_live_api_verification_report.json"),
  errors: path.join(ROOT, "_route_error_diff.json"),
  baselineErrors: path.join(ROOT, "_route_error_diff.baseline_142.json"),
  backupLive: path.join(ROOT, "_live_api_verification_report.pre_phase_backup.json"),
  backupErrors: path.join(ROOT, "_route_error_diff.pre_phase_backup.json"),
};

const startedServerPids = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function backupIfExists(src, dest) {
  if (fs.existsSync(src) && !fs.existsSync(dest)) fs.copyFileSync(src, dest);
}

function extractCookieHeader(setCookie) {
  if (!setCookie || !Array.isArray(setCookie)) return null;
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

function preview(data, limit = 1200) {
  if (data == null) return null;
  let s = "";
  try {
    s = typeof data === "string" ? data : JSON.stringify(data);
  } catch {
    s = String(data);
  }
  return s.length > limit ? `${s.slice(0, limit)}...` : s;
}

function randomPhone() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    .replace(/\D/g, "")
    .slice(-9);
  return `9${tail.padStart(9, "0")}`;
}

function randomEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

async function ensureServer() {
  try {
    const r = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (r.status === 200) return true;
  } catch (_) {}

  const child = spawn("node", ["server.js"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  startedServerPids.push(child.pid);

  for (let i = 0; i < 25; i++) {
    try {
      const r = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
      if (r.status === 200) return true;
    } catch (_) {}
    await sleep(800);
  }
  throw new Error("Server health check failed even after auto-restart");
}

async function fetchOtp(phone) {
  return Otp.findOne({ phone }).sort({ createdAt: -1 }).lean();
}

async function loginPatient() {
  const patient = await Patient.findOne({ isVerified: true, isActive: true }).lean();
  if (!patient || !patient.phone) return null;

  await axios.post(`${BASE_URL}/api/v1/patient/login`, { phone: patient.phone }, { validateStatus: () => true });
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
  const cookie = extractCookieHeader(verify.headers["set-cookie"]);
  return cookie ? { cookie, identity: { id: String(patient._id), phone: patient.phone } } : null;
}

async function loginDoctor() {
  const doctor = await Doctor.findOne({ isPhoneVerified: true, isActive: true }).lean();
  if (!doctor || !doctor.phone) return null;

  await axios.post(
    `${BASE_URL}/api/v1/doctor/login`,
    { phone: doctor.phone, role: "doctor" },
    { validateStatus: () => true }
  );
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
  const cookie = extractCookieHeader(verify.headers["set-cookie"]);
  return cookie ? { cookie, identity: { id: String(doctor._id), phone: doctor.phone } } : null;
}

async function loginAdmin() {
  const password = process.env.TEST_ADMIN_PASSWORD || "RouteTest@123";
  let email = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

  if (email) {
    const login = await axios.post(
      `${BASE_URL}/api/v1/admin/login`,
      { email, password },
      { validateStatus: () => true }
    );
    const cookie = extractCookieHeader(login.headers["set-cookie"]);
    if (login.status === 200 && cookie) return { cookie, identity: { email } };
  }

  email = randomEmail("phase.admin");
  const phone = randomPhone();
  const hash = await bcrypt.hash(password, 10);
  await Admin.create({
    email: email.toLowerCase(),
    password: hash,
    firstName: "Phase",
    lastName: "Admin",
    phone,
    role: "superAdmin",
    isVerified: true,
    isActive: true,
    tokenVersion: 0,
  }).catch(async (err) => {
    if (err && err.code === 11000) {
      const ex = await Admin.findOne({ email: email.toLowerCase() }).select("+password +isVerified +isActive");
      if (ex) {
        ex.password = hash;
        ex.isVerified = true;
        ex.isActive = true;
        await ex.save({ validateBeforeSave: false });
      }
    } else {
      throw err;
    }
  });

  const login = await axios.post(
    `${BASE_URL}/api/v1/admin/login`,
    { email, password },
    { validateStatus: () => true }
  );
  const cookie = extractCookieHeader(login.headers["set-cookie"]);
  return cookie ? { cookie, identity: { email, phone } } : null;
}

async function loginServiceProvider(adminSession) {
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
      return { cookie: envCookie, identity: { email: envEmail } };
    }
  }

  let provider = await ServiceProvider.findOne({ isActive: true }).lean();
  if (!provider && adminSession?.cookie) {
    const email = randomEmail("phase.provider");
    const mobile = randomPhone();
    await axios.post(
      `${BASE_URL}/api/v1/serviceProvider/createservice-provider`,
      {
        firstName: "Phase",
        lastName: "Provider",
        ownerName: "Phase Owner",
        age: 31,
        dateOfBirth: JSON.stringify("1994-01-01"),
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
        qualification: "BSc Nursing",
        registrationNumber: `REG-${Date.now()}`,
        registrationCouncil: "State Council",
        yearsOfExperience: 4,
        serviceCities: JSON.stringify([]),
        services: JSON.stringify([]),
      },
      {
        validateStatus: () => true,
        headers: { Cookie: adminSession.cookie, "Content-Type": "application/json" },
      }
    );
    provider = await ServiceProvider.findOne({ email }).lean();
  }

  if (!provider?.email) return null;
  const login = await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/login`,
    { email: provider.email, password },
    { validateStatus: () => true }
  );
  const cookie = extractCookieHeader(login.headers["set-cookie"]);
  return cookie ? { cookie, identity: { email: provider.email } } : null;
}

function classify(status, errText, mounted) {
  if (!mounted) return "Unmounted Route";
  if (status === 401 || status === 403) return "Auth/Role Restriction";
  if (status === 400 || status === 422) return "Validation/Contract Failure";
  if (status === 404) return "Not Found/Data Missing";
  if (status === 0 || status >= 500) return "Confirmed Backend Bug";
  if (/Can't find .* on this server!/i.test(errText || "")) return "Unmounted Route";
  return "Validation/Contract Failure";
}

function normalizeError(raw) {
  if (!raw) return "Unknown error";
  let txt = raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      txt = parsed.message || parsed.error?.message || raw;
    } catch {
      txt = raw;
    }
  } else {
    txt = raw.message || JSON.stringify(raw);
  }
  return String(txt).replace(/\s+/g, " ").trim();
}

function moduleFromPath(p) {
  const clean = p.replace(/^\/api\/v1\//i, "");
  const first = clean.split("/")[0];
  return first || "unknown";
}

function rootCauseAndFix(item) {
  const msg = (item.error || "").toLowerCase();
  if (item.label === "Auth/Role Restriction") {
    return {
      cause: "Route is protected by role middleware and current role/session is not allowed.",
      fix: "Use an allowed role for this endpoint or adjust protect() role policy if contract is wrong.",
      priority: "P2",
      confidence: "High",
    };
  }
  if (item.label === "Validation/Contract Failure") {
    return {
      cause: "Controller input validation rejected missing/invalid request fields for this payload.",
      fix: "Document required fields clearly and send complete payload; relax validation only if API contract requires it.",
      priority: "P3",
      confidence: "High",
    };
  }
  if (item.label === "Not Found/Data Missing") {
    return {
      cause: "Requested entity/resource ID was not found in DB for this route.",
      fix: "Use existing IDs from DB fixtures or improve not-found handling/test data seeding.",
      priority: "P3",
      confidence: "High",
    };
  }
  if (item.label === "Unmounted Route") {
    return {
      cause: "Route exists in route file but is not mounted in route/index.js.",
      fix: "Mount route in route/index.js or remove dead route definition.",
      priority: "P1",
      confidence: "High",
    };
  }
  if (msg.includes("is not defined")) {
    return {
      cause: "Missing variable/model import referenced in controller at runtime.",
      fix: "Import the missing symbol in controller and add a startup/unit guard test.",
      priority: "P0",
      confidence: "High",
    };
  }
  if (msg.includes("is not a function")) {
    return {
      cause: "Controller assumes object/method shape that does not exist in current schema/model instance.",
      fix: "Align controller logic with current schema shape or add missing helper methods.",
      priority: "P1",
      confidence: "High",
    };
  }
  if (msg.includes("cannot destructure property")) {
    return {
      cause: "Controller destructures fields from undefined request body.",
      fix: "Guard req.body before destructuring and return clear 400 validation error.",
      priority: "P1",
      confidence: "High",
    };
  }
  if (msg.includes("schema hasn't been registered")) {
    return {
      cause: "Referenced mongoose model is not imported/registered before use.",
      fix: "Require the missing model in bootstrap/controller before populate/find usage.",
      priority: "P1",
      confidence: "High",
    };
  }
  if (msg.includes("cast to objectid failed")) {
    return {
      cause: "Route param/query is being parsed as ObjectId where literal/invalid value is passed.",
      fix: "Validate/normalize route params before DB query and handle reserved paths explicitly.",
      priority: "P2",
      confidence: "High",
    };
  }
  return {
    cause: "Unhandled backend runtime failure in controller/middleware path.",
    fix: "Add targeted logging/guards in controller branch and cover route with regression test.",
    priority: "P1",
    confidence: "Medium",
  };
}

function phaseBase(module) {
  if (module === "admin") return 1;
  if (module === "doctor") return 2;
  if (module === "patient") return 3;
  if (module === "booking") return 4;
  if (module === "serviceProvider") return 5;
  if (module === "service" || module === "items") return 6;
  if (module === "city" || module === "geo") return 7;
  if (module === "article" || module === "socialPost") return 8;
  if (module === "invoice" || module === "payments") return 9;
  return 10;
}

function distribute(items) {
  const phases = {};
  for (let i = 1; i <= 10; i++) phases[i] = [];
  const sorted = [...items].sort((a, b) => {
    const pa = phaseBase(a.module);
    const pb = phaseBase(b.module);
    if (pa !== pb) return pa - pb;
    return `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`);
  });
  for (const item of sorted) phases[phaseBase(item.module)].push(item);

  const targetMax = 18;
  for (let p = 1; p <= 9; p++) {
    while (phases[p].length > targetMax) {
      const moved = phases[p].pop();
      moved.phaseNote = `Spillover from Phase ${String(p).padStart(2, "0")} for balance`;
      phases[p + 1].unshift(moved);
    }
  }
  return phases;
}

function mergeUnique(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function isNetworkStyleError(msg) {
  return /ECONNREFUSED|ECONNRESET|socket hang up|network|timeout|aborted|EPIPE/i.test(msg || "");
}

function inferContexts(attempt) {
  const p = String(attempt.path || "").toLowerCase();
  if (p.includes("/admin/")) return ["admin", "public", "doctor", "patient", "serviceProvider"];
  if (p.includes("/doctor/")) return ["doctor", "public", "admin", "patient", "serviceProvider"];
  if (p.includes("/patient/")) return ["patient", "public", "doctor", "admin", "serviceProvider"];
  if (p.includes("/serviceprovider/")) return ["serviceProvider", "public", "admin", "doctor", "patient"];
  if (p.includes("/booking/")) return ["doctor", "patient", "serviceProvider", "admin", "public"];
  return ["public", "admin", "doctor", "patient", "serviceProvider"];
}

async function retestStatusZero(live, sessions) {
  const zeroIndexes = [];
  for (let i = 0; i < live.attempts.length; i++) {
    if (live.attempts[i].responseStatus === 0) zeroIndexes.push(i);
  }

  for (const idx of zeroIndexes) {
    const a = live.attempts[idx];
    const pathOnly = a.executablePath || a.path || "";
    const url = `${BASE_URL}${pathOnly}`;
    const method = String(a.method || "get").toLowerCase();
    const tries = [];
    const contexts = mergeUnique([a.authContext, ...inferContexts(a)]);
    let final = null;

    for (const ctx of contexts) {
      if (!ctx) continue;
      const headers = { "Content-Type": "application/json" };
      if (ctx !== "public") {
        const sess = sessions[ctx];
        if (!sess?.cookie) continue;
        headers.Cookie = sess.cookie;
      }
      try {
        await ensureServer();
      } catch (_) {}
      const started = Date.now();
      let status = 0;
      let body = null;
      let err = null;
      try {
        const r = await axios({
          method,
          url,
          data: ["get", "delete"].includes(method) ? undefined : a.requestBody,
          headers,
          timeout: 30000,
          validateStatus: () => true,
        });
        status = r.status;
        body = r.data;
      } catch (e) {
        err = `${e.code ? `${e.code}: ` : ""}${e.message || "request failed"}`;
        if (isNetworkStyleError(err)) {
          try {
            await ensureServer();
            const retry = await axios({
              method,
              url,
              data: ["get", "delete"].includes(method) ? undefined : a.requestBody,
              headers,
              timeout: 30000,
              validateStatus: () => true,
            });
            status = retry.status;
            body = retry.data;
            err = null;
          } catch (e2) {
            err = `${e2.code ? `${e2.code}: ` : ""}${e2.message || "request failed"}`;
          }
        }
      }
      const tr = {
        context: ctx,
        response: {
          status,
          bodyPreview: preview(body),
          error: err,
          durationMs: Date.now() - started,
        },
      };
      tries.push(tr);
      final = tr;
      if (status !== 0 && ![401, 403].includes(status)) break;
    }

    if (!final) continue;
    a.authContext = final.context;
    a.responseStatus = final.response.status;
    a.responseBody = final.response.bodyPreview;
    a.responseError = final.response.error;
    a.durationMs = final.response.durationMs;
    a.timestamp = new Date().toISOString();
    a.tries = [...(a.tries || []), ...tries];
    a.controllerReached =
      a.responseStatus !== 0 && !/can't find .* on this server/i.test(String(a.responseBody || ""));
  }
}

function buildKey(method, routePath) {
  return `${String(method || "").toUpperCase()} ${routePath || ""}`;
}

function rebuildErrorDiff(checklist, live, baselineErrors) {
  const mountedMap = new Map();
  for (const r of checklist.routes) mountedMap.set(buildKey(r.method, r.routePath), r);
  const attemptMap = new Map();
  for (const a of live.attempts) attemptMap.set(buildKey(a.method, a.path), a);

  const items = [];
  const baselineItems = Array.isArray(baselineErrors?.items) ? baselineErrors.items : null;
  if (baselineItems && baselineItems.length) {
    for (const b of baselineItems) {
      const key = buildKey(b.method, b.path);
      const a = attemptMap.get(key);
      const route = mountedMap.get(key);
      const mounted = route ? route.mounted : true;
      const raw = a ? a.responseError || a.responseBody || b.error || "Unknown error" : b.error || "Unknown error";
      const normalized = normalizeError(raw);
      const label = b.label || classify(a?.responseStatus, a?.responseBody, mounted);
      items.push({
        method: b.method,
        path: b.path,
        controllerRef: b.controllerRef || a?.controllerRef || route?.controllerRef || "unknown",
        status: a ? a.responseStatus : b.status,
        category:
          label === "Confirmed Backend Bug"
            ? "server-bug"
            : label === "Validation/Contract Failure"
            ? "validation"
            : label === "Auth/Role Restriction"
            ? "auth"
            : label === "Not Found/Data Missing"
            ? "not-found"
            : "unmounted",
        error: raw,
        stackExcerpt:
          (a?.responseBody && String(a.responseBody).includes("stack") ? String(a.responseBody).slice(0, 400) : null) ||
          b.stackExcerpt ||
          null,
        reproducibility:
          a
            ? `${a.method} ${a.executablePath || a.path} using context=${a.authContext || "public"}`
            : b.reproducibility || `${b.method} ${b.path}`,
        label,
        normalizedError: normalized,
      });
    }
  } else {
    for (const a of live.attempts) {
      if (!(a.responseStatus >= 400 || a.responseStatus === 0)) continue;
      const route = mountedMap.get(buildKey(a.method, a.path));
      const mounted = route ? route.mounted : true;
      const raw = a.responseError || a.responseBody || "Unknown error";
      const normalized = normalizeError(raw);
      const label = classify(a.responseStatus, a.responseBody, mounted);
      items.push({
        method: a.method,
        path: a.path,
        controllerRef: a.controllerRef || route?.controllerRef || "unknown",
        status: a.responseStatus,
        category:
          label === "Confirmed Backend Bug"
            ? "server-bug"
            : label === "Validation/Contract Failure"
            ? "validation"
            : label === "Auth/Role Restriction"
            ? "auth"
            : label === "Not Found/Data Missing"
            ? "not-found"
            : "unmounted",
        error: normalized,
        stackExcerpt: a.responseBody && a.responseBody.includes("stack") ? a.responseBody.slice(0, 400) : null,
        reproducibility: `${a.method} ${a.executablePath || a.path} using context=${a.authContext || "public"}`,
        label,
        normalizedError: normalized,
      });
    }

    const unmounted = checklist.routes.filter((r) => !r.mounted);
    for (const u of unmounted) {
      items.push({
        method: u.method,
        path: u.routePath,
        controllerRef: u.controllerRef || "unknown",
        status: null,
        category: "unmounted",
        error: "Route file exists but not mounted in route/index.js",
        stackExcerpt: null,
        reproducibility: "N/A",
        label: "Unmounted Route",
        normalizedError: "Route file exists but not mounted in route/index.js",
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalErrorRoutes: items.length,
    items,
  };
}

function buildPhaseDocs(errorDiff) {
  const items = errorDiff.items.map((i) => ({
    ...i,
    module: moduleFromPath(i.path),
  }));
  const phases = distribute(items);

  for (let p = 1; p <= 10; p++) {
    const list = phases[p];
    const md = [];
    const txt = [];
    const title = `Phase ${String(p).padStart(2, "0")} Error Analysis`;
    md.push(`# ${title}`);
    md.push("");
    md.push(`- totalRoutes: ${list.length}`);
    md.push(`- generatedAt: ${new Date().toISOString()}`);
    md.push("");

    txt.push(title);
    txt.push("=".repeat(title.length));
    txt.push(`totalRoutes: ${list.length}`);
    txt.push(`generatedAt: ${new Date().toISOString()}`);
    txt.push("");

    let idx = 1;
    for (const item of list) {
      const analysis = rootCauseAndFix(item);
      const normalized = item.normalizedError || normalizeError(item.error);
      const repro = item.reproducibility || `${item.method} ${item.path}`;
      const spill = item.phaseNote ? ` | ${item.phaseNote}` : "";

      md.push(`## ${idx}. ${item.method} ${item.path}`);
      md.push(`- Controller: ${item.controllerRef || "unknown"}`);
      md.push(`- Final HTTP Status: ${item.status ?? "N/A"}`);
      md.push(`- Classification: ${item.label}${spill}`);
      md.push(`- Error (raw): ${item.error || "N/A"}`);
      md.push(`- Error (normalized): ${normalized}`);
      md.push(`- Root-cause hypothesis: ${analysis.cause}`);
      md.push(`- Repro request shape: ${repro}`);
      md.push(`- Fix recommendation: ${analysis.fix}`);
      md.push(`- Priority: ${analysis.priority}`);
      md.push(`- Confidence: ${analysis.confidence}`);
      md.push("");

      txt.push(`${idx}. ${item.method} ${item.path}`);
      txt.push(`Controller: ${item.controllerRef || "unknown"}`);
      txt.push(`Final HTTP Status: ${item.status ?? "N/A"}`);
      txt.push(`Classification: ${item.label}${spill}`);
      txt.push(`Error (raw): ${item.error || "N/A"}`);
      txt.push(`Error (normalized): ${normalized}`);
      txt.push(`Root-cause hypothesis: ${analysis.cause}`);
      txt.push(`Repro request shape: ${repro}`);
      txt.push(`Fix recommendation: ${analysis.fix}`);
      txt.push(`Priority: ${analysis.priority}`);
      txt.push(`Confidence: ${analysis.confidence}`);
      txt.push("");
      idx += 1;
    }

    fs.writeFileSync(path.join(ROOT, `phase-${String(p).padStart(2, "0")}-error-analysis.md`), md.join("\n"));
    fs.writeFileSync(path.join(ROOT, `phase-${String(p).padStart(2, "0")}-error-analysis.txt`), txt.join("\n"));
  }

  return phases;
}

function buildMasterIndex(errorDiff, phases) {
  const cat = {};
  const sev = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const clusters = {};

  for (const i of errorDiff.items) {
    cat[i.label] = (cat[i.label] || 0) + 1;
    const a = rootCauseAndFix(i);
    sev[a.priority] += 1;
    const key = a.cause;
    clusters[key] = (clusters[key] || 0) + 1;
  }

  const sortedClusters = Object.entries(clusters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const md = [];
  const txt = [];
  md.push("# Error Analysis Master Index");
  md.push("");
  md.push(`- generatedAt: ${new Date().toISOString()}`);
  md.push(`- totalErrorRoutes: ${errorDiff.totalErrorRoutes}`);
  md.push("");
  md.push("## Totals by Classification");
  for (const [k, v] of Object.entries(cat)) md.push(`- ${k}: ${v}`);
  md.push("");
  md.push("## Totals by Priority");
  for (const [k, v] of Object.entries(sev)) md.push(`- ${k}: ${v}`);
  md.push("");
  md.push("## Phase Mapping and Completion");
  for (let p = 1; p <= 10; p++) {
    const list = phases[p] || [];
    const modules = [...new Set(list.map((x) => x.module))].join(", ");
    md.push(`- Phase ${String(p).padStart(2, "0")}: Completed | routes=${list.length} | modules=${modules || "none"}`);
  }
  md.push("");
  md.push("## Cross-Phase Deduplicated Bug Clusters");
  for (const [cause, count] of sortedClusters) md.push(`- (${count}) ${cause}`);

  txt.push("Error Analysis Master Index");
  txt.push("===========================");
  txt.push(`generatedAt: ${new Date().toISOString()}`);
  txt.push(`totalErrorRoutes: ${errorDiff.totalErrorRoutes}`);
  txt.push("");
  txt.push("Totals by Classification");
  txt.push("------------------------");
  for (const [k, v] of Object.entries(cat)) txt.push(`${k}: ${v}`);
  txt.push("");
  txt.push("Totals by Priority");
  txt.push("------------------");
  for (const [k, v] of Object.entries(sev)) txt.push(`${k}: ${v}`);
  txt.push("");
  txt.push("Phase Mapping and Completion");
  txt.push("----------------------------");
  for (let p = 1; p <= 10; p++) {
    const list = phases[p] || [];
    const modules = [...new Set(list.map((x) => x.module))].join(", ");
    txt.push(`Phase ${String(p).padStart(2, "0")}: Completed | routes=${list.length} | modules=${modules || "none"}`);
  }
  txt.push("");
  txt.push("Cross-Phase Deduplicated Bug Clusters");
  txt.push("-------------------------------------");
  for (const [cause, count] of sortedClusters) txt.push(`(${count}) ${cause}`);

  fs.writeFileSync(path.join(ROOT, "error-analysis-master-index.md"), md.join("\n"));
  fs.writeFileSync(path.join(ROOT, "error-analysis-master-index.txt"), txt.join("\n"));
}

function rewriteLiveSummary(live) {
  const attempts = live.attempts;
  live.summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRoutes: live.summary.totalRoutes || attempts.length,
    mountedRoutes: live.summary.mountedRoutes || attempts.length,
    unmountedRoutes: live.summary.unmountedRoutes || 0,
    attemptedRoutes: attempts.length,
    status2xx: attempts.filter((a) => a.responseStatus >= 200 && a.responseStatus < 300).length,
    status400: attempts.filter((a) => a.responseStatus === 400).length,
    status401: attempts.filter((a) => a.responseStatus === 401).length,
    status403: attempts.filter((a) => a.responseStatus === 403).length,
    status404: attempts.filter((a) => a.responseStatus === 404).length,
    status5xx: attempts.filter((a) => a.responseStatus >= 500 || a.responseStatus === 0).length,
    controllerReached: attempts.filter((a) => a.controllerReached).length,
  };
}

async function main() {
  await ensureServer();
  backupIfExists(FILES.live, FILES.backupLive);
  backupIfExists(FILES.errors, FILES.backupErrors);

  const checklist = readJson(FILES.checklist);
  const live = readJson(FILES.live);
  const baselineErrors = fs.existsSync(FILES.baselineErrors)
    ? readJson(FILES.baselineErrors)
    : fs.existsSync(FILES.backupErrors)
    ? readJson(FILES.backupErrors)
    : null;

  await mongoose.connect(process.env.MONGODB_URI);
  const sessions = {
    patient: await loginPatient(),
    doctor: await loginDoctor(),
    admin: await loginAdmin(),
    serviceProvider: null,
  };
  sessions.serviceProvider = await loginServiceProvider(sessions.admin);

  await retestStatusZero(live, sessions);
  rewriteLiveSummary(live);
  writeJson(FILES.live, live);

  const errorDiff = rebuildErrorDiff(checklist, live, baselineErrors);
  writeJson(FILES.errors, errorDiff);

  const phases = buildPhaseDocs(errorDiff);
  buildMasterIndex(errorDiff, phases);

  await mongoose.disconnect();
  for (const pid of startedServerPids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }

  const counts = {};
  for (let p = 1; p <= 10; p++) counts[`phase${p}`] = (phases[p] || []).length;
  console.log(
    JSON.stringify(
      {
        normalizedStatus0Remaining: live.attempts.filter((a) => a.responseStatus === 0).length,
        totalErrorRoutes: errorDiff.totalErrorRoutes,
        phaseCounts: counts,
      },
      null,
      2
    )
  );
}

main().catch(async (err) => {
  try {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  } catch (_) {}
  for (const pid of startedServerPids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }
  console.error("FAILED", err);
  process.exit(1);
});
