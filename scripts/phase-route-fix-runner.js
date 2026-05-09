const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const FormData = require("form-data");
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
const Invoice = require("../models/invoiceModel");
const Payment = require("../models/paymentModel");
const ItemCategory = require("../models/itemCategoryModel");
const CrashReport = require("../models/CrashReport");
const Post = require("../models/socialPostModel");
const Article = require("../models/articleModel");

const ROOT = process.cwd();
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
const OUT_JSON = path.join(ROOT, "_phase_fix_execution_report.json");
const OUT_MD = path.join(ROOT, "post-fix-route-failures.md");
const OUT_ERR_JSON = path.join(ROOT, "post-fix-route-failures.json");
const CONTRACT_LOG = path.join(ROOT, "api-contract-change-log.md");

const startedServerPids = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function extractCookieHeader(setCookie) {
  if (!setCookie || !Array.isArray(setCookie)) return null;
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

function pickPreview(data, limit = 1200) {
  if (data == null) return null;
  try {
    const raw = typeof data === "string" ? data : JSON.stringify(data);
    return raw.length > limit ? `${raw.slice(0, limit)}...` : raw;
  } catch {
    return String(data);
  }
}

async function ensureServer() {
  try {
    const r = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    if (r.status === 200) return;
  } catch (_) {}

  const child = spawn("node", ["server.js"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  startedServerPids.push(child.pid);

  for (let i = 0; i < 35; i++) {
    try {
      const r = await axios.get(`${BASE_URL}/health`, { timeout: 4000 });
      if (r.status === 200) return;
    } catch (_) {}
    await sleep(800);
  }
  throw new Error("Server did not become healthy");
}

async function fetchOtp(phone) {
  return Otp.findOne({ phone }).sort({ createdAt: -1 }).lean();
}

async function loginPatient(sessions) {
  const patient = await Patient.findOne({ isVerified: true, isActive: true }).lean();
  if (!patient?.phone) return null;
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
  if (!cookie) return null;
  sessions.patient = { cookie, identity: { id: String(patient._id), phone: patient.phone, email: patient.email } };
  return sessions.patient;
}

async function loginDoctor(sessions) {
  const doctor = await Doctor.findOne({ isPhoneVerified: true, isActive: true }).lean();
  if (!doctor?.phone) return null;
  await axios.post(`${BASE_URL}/api/v1/doctor/login`, { phone: doctor.phone, role: "doctor" }, { validateStatus: () => true });
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
  if (!cookie) return null;
  sessions.doctor = { cookie, identity: { id: String(doctor._id), phone: doctor.phone, email: doctor.email } };
  return sessions.doctor;
}

async function loginAdmin(sessions) {
  const password = process.env.TEST_ADMIN_PASSWORD || "RouteTest@123";
  const envEmail = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  if (envEmail) {
    const login = await axios.post(`${BASE_URL}/api/v1/admin/login`, { email: envEmail, password }, { validateStatus: () => true });
    const cookie = extractCookieHeader(login.headers["set-cookie"]);
    if (login.status === 200 && cookie) {
      const admin = await Admin.findOne({ email: envEmail.toLowerCase() }).lean();
      const role = String(admin?.role || "");
      if (role === "superAdmin" || role === "subAdmin") {
        sessions.admin = { cookie, identity: { id: admin ? String(admin._id) : null, email: envEmail, phone: admin?.phone } };
        return sessions.admin;
      }
    }
  }

  const email = randomEmail("phase.admin");
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
    if (err?.code === 11000) {
      const ex = await Admin.findOne({ email: email.toLowerCase() }).select("+password +isVerified +isActive");
      if (ex) {
        ex.password = hash;
        ex.isVerified = true;
        ex.isActive = true;
        await ex.save({ validateBeforeSave: false });
      }
      return;
    }
    throw err;
  });

  const login = await axios.post(`${BASE_URL}/api/v1/admin/login`, { email, password }, { validateStatus: () => true });
  const cookie = extractCookieHeader(login.headers["set-cookie"]);
  if (!cookie) return null;
  const admin = await Admin.findOne({ email: email.toLowerCase() }).lean();
  sessions.admin = { cookie, identity: { id: admin ? String(admin._id) : null, email, phone } };
  return sessions.admin;
}

async function loginServiceProvider(sessions, refs) {
  const password = process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123";
  const envEmail = process.env.TEST_PROVIDER_EMAIL;
  if (envEmail) {
    const login = await axios.post(`${BASE_URL}/api/v1/serviceProvider/login`, { email: envEmail, password }, { validateStatus: () => true });
    const cookie = extractCookieHeader(login.headers["set-cookie"]);
    if (login.status === 200 && cookie) {
      const provider = await ServiceProvider.findOne({ email: envEmail }).lean();
      if (provider?.isActive) {
        sessions.serviceProvider = { cookie, identity: { id: provider ? String(provider._id) : null, email: envEmail } };
        return sessions.serviceProvider;
      }
    }
  }

  const existingProvider = await ServiceProvider.findOne({ isDeleted: { $ne: true } }).select("+password").sort({ createdAt: -1 });
  if (existingProvider?.email) {
    existingProvider.password = password;
    existingProvider.isActive = true;
    existingProvider.isVerified = true;
    existingProvider.approvalStatus = "Approved";
    await existingProvider.save({ validateBeforeSave: false });
    const loginExisting = await axios.post(
      `${BASE_URL}/api/v1/serviceProvider/login`,
      { email: existingProvider.email, password },
      { validateStatus: () => true }
    );
    const existingCookie = extractCookieHeader(loginExisting.headers["set-cookie"]);
    if (loginExisting.status === 200 && existingCookie) {
      sessions.serviceProvider = {
        cookie: existingCookie,
        identity: { id: String(existingProvider._id), email: existingProvider.email },
      };
      return sessions.serviceProvider;
    }
  }

  if (!sessions.admin?.cookie) return null;
  const email = randomEmail("phase.provider");
  const mobile = randomPhone();
  await axios.post(
    `${BASE_URL}/api/v1/serviceProvider/createservice-provider`,
    {
      firstName: "Phase",
      lastName: "Provider",
      ownerName: "Phase Owner",
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
      services: JSON.stringify([{ serviceId: refs.serviceId, serviceName: "General", experienceYears: 2 }]),
      qualification: "BSc Nursing",
      registrationNumber: `REG-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 4,
      serviceCities: JSON.stringify([refs.cityId]),
      bankDetails: JSON.stringify({
        accountHolderName: "Phase Provider",
        accountNumber: `${Date.now()}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "State Bank",
      }),
    },
    { validateStatus: () => true, headers: { Cookie: sessions.admin.cookie, "Content-Type": "application/json" } }
  );

  const login = await axios.post(`${BASE_URL}/api/v1/serviceProvider/login`, { email, password }, { validateStatus: () => true });
  const cookie = extractCookieHeader(login.headers["set-cookie"]);
  if (!cookie) return null;
  const provider = await ServiceProvider.findOne({ email }).lean();
  sessions.serviceProvider = { cookie, identity: { id: provider ? String(provider._id) : null, email } };
  return sessions.serviceProvider;
}

function parsePhaseRoutes(phaseNo) {
  const file = path.join(ROOT, `phase-${String(phaseNo).padStart(2, "0")}-error-analysis.md`);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const routes = [];
  let current = null;
  for (const line of lines) {
    const h = line.match(/^##\s+\d+\.\s+([A-Z]+)\s+(\S+)/);
    if (h) {
      current = { method: h[1], path: h[2], controllerRef: "unknown" };
      routes.push(current);
      continue;
    }
    const c = line.match(/^- Controller:\s+(.+)$/);
    if (c && current) current.controllerRef = c[1];
  }
  return routes;
}

async function ensureFixtures(sessions) {
  const refs = {};
  refs.city = (await City.findOne({ isActive: true }).lean()) || (await City.findOne({}).lean());
  refs.patient = await Patient.findById(sessions.patient?.identity?.id).lean();
  refs.doctor = await Doctor.findById(sessions.doctor?.identity?.id).lean();
  refs.admin = sessions.admin?.identity?.id ? await Admin.findById(sessions.admin.identity.id).lean() : await Admin.findOne({}).lean();
  refs.serviceProvider =
    sessions.serviceProvider?.identity?.id
      ? await ServiceProvider.findById(sessions.serviceProvider.identity.id).lean()
      : await ServiceProvider.findOne({ isDeleted: { $ne: true } }).lean();
  if (refs.serviceProvider?._id && refs.serviceProvider.isActive !== true) {
    await ServiceProvider.updateOne({ _id: refs.serviceProvider._id }, { $set: { isActive: true } });
    refs.serviceProvider = await ServiceProvider.findById(refs.serviceProvider._id).lean();
  }
  refs.itemCategory = await ItemCategory.findOne({ isDeleted: { $ne: true } }).lean();
  refs.subAdmin = await Admin.findOne({ role: "subAdmin" }).lean();

  refs.service = await Service.findOne({
    isDeleted: { $ne: true },
    isActive: true,
    category: { $exists: true, $ne: null },
    "createdBy.userId": { $exists: true, $ne: null },
    "createdBy.userModel": { $exists: true, $ne: null },
    "createdBy.email": { $exists: true, $ne: null },
  }).lean();

  if (!refs.service && refs.admin && refs.city) {
    const adminRole = String(refs.admin.role || "").toLowerCase();
    const created = await Service.create({
      name: `Phase Fixture Service ${Date.now()}`,
      category: "consultation",
      description: "Phase fixture service",
      basePrice: 200,
      taxPercentage: 18,
      modes: ["Home Service"],
      cities: [refs.city._id],
      createdBy: {
        userId: refs.admin._id,
        userModel: adminRole.includes("super") ? "SuperAdmin" : "Admin",
        name: refs.admin.firstName || refs.admin.email || "Phase Admin",
        email: refs.admin.email || "phase-admin@example.com",
      },
      isActive: true,
      isDeleted: false,
    });
    refs.service = created.toObject();
  }

  if ((!sessions.serviceProvider?.cookie || !refs.serviceProvider?.isActive) && sessions.admin?.cookie) {
    await loginServiceProvider(sessions, {
      cityId: String(refs.city._id),
      serviceId: String(refs.service._id),
    }).catch(() => {});
    if (sessions.serviceProvider?.identity?.id) {
      refs.serviceProvider = await ServiceProvider.findById(sessions.serviceProvider.identity.id).lean();
    }
  }

  if (!refs.itemCategory) {
    const createdCategory = await ItemCategory.create({
      name: `Phase Category ${Date.now()}`,
      description: "Phase category fixture",
      type: "medicine",
      items: [{ name: "Phase Item", unitPrice: 10, isActive: true }],
      isDeleted: false,
      createdBy: refs.admin?._id,
    });
    refs.itemCategory = createdCategory.toObject();
  }

  if (!refs.subAdmin && refs.admin) {
    const subAdminPassword = await bcrypt.hash("RouteTest@123", 10);
    const createdSubAdmin = await Admin.create({
      email: randomEmail("phase.subadmin").toLowerCase(),
      password: subAdminPassword,
      firstName: "Phase",
      lastName: "SubAdmin",
      phone: randomPhone(),
      role: "subAdmin",
      isVerified: true,
      isActive: true,
      tokenVersion: 0,
    });
    refs.subAdmin = createdSubAdmin.toObject();
  }

  if (!refs.city || !refs.service || !refs.patient || !refs.doctor) {
    throw new Error("Missing core fixture references (city/service/patient/doctor)");
  }

  if (!refs.patient.address || !refs.patient.address.cityId) {
    await Patient.updateOne(
      { _id: refs.patient._id },
      { $set: { "address.cityId": refs.city._id, "address.city": refs.city.name || "Lucknow" } }
    );
    refs.patient = await Patient.findById(refs.patient._id).lean();
  }

  if (!Array.isArray(refs.doctor.cities) || !refs.doctor.cities.some((c) => String(c) === String(refs.city._id))) {
    await Doctor.updateOne({ _id: refs.doctor._id }, { $addToSet: { cities: refs.city._id } });
    refs.doctor = await Doctor.findById(refs.doctor._id).lean();
  }

  const today = new Date();
  const bookingDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const bookingDateStr = bookingDate.toISOString().slice(0, 10);
  let treatment = await Treatment.findOne({ patientId: refs.patient._id, serviceId: refs.service._id }).lean();
  if (!treatment) {
    treatment = await Treatment.create({
      patientId: refs.patient._id,
      serviceId: refs.service._id,
      servicePartnerId: refs.serviceProvider?._id || null,
      status: "Active",
    });
    treatment = treatment.toObject();
  }

  let booking = await Booking.findOne({ treatmentId: treatment._id }).lean();
  if (!booking) {
    booking = await Booking.create({
      treatmentId: treatment._id,
      patientId: refs.patient._id,
      serviceId: refs.service._id,
      servicePartnerId: refs.serviceProvider?._id || null,
      sessionNumber: 1,
      appointmentDate: bookingDate,
      slotTime: { startTime: "10:00", endTime: "10:30" },
      duration: 30,
      status: "Approved",
      city: refs.city._id,
      pricing: {
        basePrice: refs.service.basePrice || 100,
        subtotal: refs.service.basePrice || 100,
        taxPercentage: refs.service.taxPercentage || 18,
        taxAmount: 18,
        totalAmount: 118,
      },
      createdBy: { userId: refs.patient._id, userModel: "Patient" },
    });
    booking = booking.toObject();
    await Treatment.updateOne(
      { _id: treatment._id },
      { $set: { bookingId: booking._id, currentBookingId: booking._id, lastBookingAt: new Date() } }
    );
  }

  let providerBooking = null;
  if (refs.serviceProvider?._id) {
    providerBooking = await Booking.findOne({
      servicePartnerId: refs.serviceProvider._id,
      patientId: refs.patient._id,
      serviceId: refs.service._id,
      status: { $nin: ["Cancelled", "Rejected"] },
    }).lean();

    if (!providerBooking) {
      providerBooking = await Booking.create({
        treatmentId: treatment._id,
        patientId: refs.patient._id,
        serviceId: refs.service._id,
        servicePartnerId: refs.serviceProvider._id,
        sessionNumber: (await Booking.countDocuments({ treatmentId: treatment._id })) + 1,
        appointmentDate: bookingDate,
        slotTime: { startTime: "12:00", endTime: "12:30" },
        duration: 30,
        status: "Approved",
        city: refs.city._id,
        pricing: {
          basePrice: refs.service.basePrice || 100,
          subtotal: refs.service.basePrice || 100,
          taxPercentage: refs.service.taxPercentage || 18,
          taxAmount: 18,
          totalAmount: 118,
        },
        createdBy: { userId: refs.admin?._id || refs.patient._id, userModel: "Admin" },
      });
      providerBooking = providerBooking.toObject();
      await Treatment.updateOne(
        { _id: treatment._id },
        { $set: { currentBookingId: providerBooking._id, lastBookingAt: new Date() } }
      );
    }
  }

  let completedProviderBooking = null;
  if (refs.serviceProvider?._id) {
    completedProviderBooking = await Booking.findOne({
      servicePartnerId: refs.serviceProvider._id,
      patientId: refs.patient._id,
      serviceId: refs.service._id,
      status: "Completed",
      treatmentStatus: { $in: ["Active", "InProgress", "Completed"] },
    }).lean();

    if (!completedProviderBooking && providerBooking) {
      completedProviderBooking = await Booking.create({
        treatmentId: treatment._id,
        patientId: refs.patient._id,
        serviceId: refs.service._id,
        servicePartnerId: refs.serviceProvider._id,
        sessionNumber: (await Booking.countDocuments({ treatmentId: treatment._id })) + 1,
        appointmentDate: bookingDate,
        slotTime: { startTime: "13:00", endTime: "13:30" },
        duration: 30,
        status: "Completed",
        treatmentStatus: "Active",
        city: refs.city._id,
        pricing: {
          basePrice: refs.service.basePrice || 100,
          subtotal: refs.service.basePrice || 100,
          taxPercentage: refs.service.taxPercentage || 18,
          taxAmount: 18,
          totalAmount: 118,
        },
        createdBy: { userId: refs.admin?._id || refs.patient._id, userModel: "Admin" },
      });
      completedProviderBooking = completedProviderBooking.toObject();
    }
  }

  let cancellationBooking = await Booking.findOne({
    patientId: refs.patient._id,
    serviceId: refs.service._id,
    status: "Cancellation Requested",
  }).lean();
  if (!cancellationBooking) {
    cancellationBooking = await Booking.create({
      treatmentId: treatment._id,
      patientId: refs.patient._id,
      serviceId: refs.service._id,
      servicePartnerId: refs.serviceProvider?._id || null,
      sessionNumber: (await Booking.countDocuments({ treatmentId: treatment._id })) + 1,
      appointmentDate: bookingDate,
      slotTime: { startTime: "14:00", endTime: "14:30" },
      duration: 30,
      status: "Approved",
      cancelledBy: "patient",
      requestedCancellationAt: new Date(),
      originalStatus: "Approved",
      adminApprovalRequired: true,
      city: refs.city._id,
      pricing: {
        basePrice: refs.service.basePrice || 100,
        subtotal: refs.service.basePrice || 100,
        taxPercentage: refs.service.taxPercentage || 18,
        taxAmount: 18,
        totalAmount: 118,
      },
      createdBy: { userId: refs.patient._id, userModel: "Patient" },
    });
    await Booking.collection.updateOne(
      { _id: cancellationBooking._id },
      {
        $set: {
          status: "Cancellation Requested",
          requestedCancellationAt: new Date(),
          originalStatus: "Approved",
          adminApprovalRequired: true,
          cancelledBy: "patient",
        },
      }
    );
    cancellationBooking = await Booking.findById(cancellationBooking._id).lean();
  }

  const doctorForSlots = await Doctor.findById(refs.doctor._id);
  if (doctorForSlots) {
    if (!doctorForSlots.availability || typeof doctorForSlots.availability !== "object") {
      doctorForSlots.availability = {};
    }
    if (!Array.isArray(doctorForSlots.availability.dailySlots)) {
      doctorForSlots.availability.dailySlots = [];
    }
    const existingDaily = doctorForSlots.availability.dailySlots.find(
      (ds) => new Date(ds.date).toDateString() === new Date(bookingDateStr).toDateString()
    );
    if (!existingDaily) {
      doctorForSlots.availability.dailySlots.push({
        date: new Date(bookingDateStr),
        dayOfWeek: new Date(bookingDateStr).toLocaleDateString("en-US", { weekday: "long" }),
        isAvailable: true,
        slots: [
          { startTime: "09:00", endTime: "09:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
          { startTime: "10:00", endTime: "10:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
          { startTime: "12:00", endTime: "12:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
        ],
        breakTimes: [],
      });
      await doctorForSlots.save({ validateBeforeSave: false });
    }
  }

  let invoice = await Invoice.findOne({ bookingId: booking._id }).lean();
  if (!invoice) {
    invoice = await Invoice.create({
      invoiceNumber: `INV-PHASE-${Date.now()}`,
      bookingId: booking._id,
      patientId: refs.patient._id,
      doctorId: refs.serviceProvider?._id || null,
      billingDetails: {
        category: "consultation",
        serviceName: refs.service.name || "Service",
        durationMinutes: 30,
        basePrice: refs.service.basePrice || 100,
        calculatedBase: refs.service.basePrice || 100,
        taxPercentage: 18,
      },
      medicines: [],
      additionalEquipment: [],
      isInvoiceGenerated: false,
    });
    invoice = invoice.toObject();
  }

  let payment = await Payment.findOne({ treatmentId: treatment._id }).lean();
  if (!payment) {
    payment = await Payment.create({
      treatmentId: treatment._id,
      patientId: refs.patient._id,
      servicePartnerId: refs.serviceProvider?._id || null,
      bookingIds: [booking._id],
      invoiceId: invoice._id,
      totalBillAmount: 118,
      remainingBalance: 118,
      paymentStatus: "Unpaid",
      billBreakdown: { subtotal: 100, gstAmount: 18, cgst: 9, sgst: 9, grandTotal: 118 },
      transactions: [],
      refunds: [],
    });
    payment = payment.toObject();
  }

  let article = await Article.findOne({ createdBy: refs.doctor._id }).lean();
  if (!article) {
    article = await Article.create({
      createdBy: refs.doctor._id,
      creatorModel: "Doctor",
      cityId: refs.city._id,
      location: refs.city.name || "lucknow",
      category: "General Health",
      tags: ["phase"],
      title: `Phase Article ${Date.now()}`,
      description: "Phase test article",
      articleType: "article",
      content: { text: "phase article content" },
      status: "published",
    });
    article = article.toObject();
  }

  let post = await Post.findOne({ doctor: refs.doctor._id }).lean();
  if (!post) {
    post = await Post.create({
      doctor: refs.doctor._id,
      city: refs.city._id,
      type: "TEXT",
      content: "Phase social post",
      hashtags: ["phase"],
    });
    post = post.toObject();
  }

  let crash = await CrashReport.findOne({}).lean();
  if (!crash) {
    crash = await CrashReport.create({
      appName: "Medico App",
      appVersion: "1.0.0",
      environment: "development",
      errorName: "PhaseSeedError",
      errorMessage: "Phase seed",
      severity: "LOW",
      userId: refs.patient._id,
      userType: "Patient",
    });
    crash = crash.toObject();
  }

  const otpPhones = [sessions.patient?.identity?.phone, sessions.doctor?.identity?.phone, refs.admin?.phone].filter(Boolean);
  for (const phone of otpPhones) {
    await Otp.create({
      phone,
      otp: "123456",
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      type: "login",
      attempts: 0,
      deliveryStatus: "sent",
    }).catch(() => {});
  }

  const pendingAdminPhone = randomPhone();
  const pendingDoctorPhone = randomPhone();
  const pendingPatientPhone = randomPhone();

  const pendingAdminPassword = await bcrypt.hash("RouteTest@123", 10);
  await Admin.create({
    email: randomEmail("pending.admin").toLowerCase(),
    password: pendingAdminPassword,
    firstName: "Pending",
    lastName: "Admin",
    phone: pendingAdminPhone,
    role: "superAdmin",
    isVerified: false,
    isActive: true,
    tokenVersion: 0,
  }).catch(() => {});

  await Doctor.create({
    firstName: "PendingDoctor",
    email: randomEmail("pending.doctor"),
    phone: pendingDoctorPhone,
    medicalRegistrationNumber: `PENDING-MED-${Date.now()}`,
    issuingMedicalCouncil: "Medical Council",
    specialization: "General",
    cities: [refs.city._id],
    isPhoneVerified: false,
    isActive: true,
    verificationStatus: "pending",
  }).catch(() => {});

  await Patient.create({
    firstName: "PendingPatient",
    email: randomEmail("pending.patient"),
    phone: pendingPatientPhone,
    password: "RouteTest@123",
    isVerified: false,
    isActive: false,
    address: { cityId: refs.city._id, city: refs.city.name || "Lucknow", state: "UP", country: "India", pincode: "226001" },
  }).catch(() => {});

  await Otp.deleteMany({ phone: { $in: [pendingAdminPhone, pendingDoctorPhone, pendingPatientPhone] } });
  await Otp.create([
    { phone: pendingAdminPhone, otp: 123456, otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" },
    { phone: pendingDoctorPhone, otp: "123456", otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" },
    { phone: pendingPatientPhone, otp: 123456, otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" },
  ]).catch(() => {});

  const tempDoctor = await Doctor.create({
    firstName: `TmpDoc${Date.now()}`,
    email: randomEmail("tmp.doc"),
    phone: randomPhone(),
    medicalRegistrationNumber: `TMP-MED-${Date.now()}`,
    issuingMedicalCouncil: "Medical Council",
    specialization: "General",
    cities: [refs.city._id],
    isPhoneVerified: true,
    isActive: true,
    verificationStatus: "approved",
  });

  const tempPatient = await Patient.create({
    firstName: `TmpPat${Date.now()}`,
    email: randomEmail("tmp.patient"),
    phone: randomPhone(),
    password: "RouteTest@123",
    isVerified: true,
    isActive: true,
    address: { cityId: refs.city._id, city: refs.city.name || "Lucknow" },
  });

  const tempArticle = await Article.create({
    createdBy: refs.doctor._id,
    creatorModel: "Doctor",
    cityId: refs.city._id,
    location: refs.city.name || "lucknow",
    category: "General Health",
    tags: ["tmp"],
    title: `Tmp Article ${Date.now()}`,
    description: "Tmp article",
    articleType: "article",
    content: { text: "tmp article content" },
    status: "draft",
  });

  const tempPost = await Post.create({
    doctor: refs.doctor._id,
    city: refs.city._id,
    type: "TEXT",
    content: "tmp post",
  });

  const tempService = await Service.create({
    name: `Tmp Service ${Date.now()}`,
    category: "consultation",
    description: "Temp service for destructive route checks",
    basePrice: 150,
    taxPercentage: 18,
    modes: ["Home Service"],
    cities: [refs.city._id],
    createdBy: {
      userId: refs.admin._id,
      userModel: String(refs.admin.role || "").toLowerCase().includes("super") ? "SuperAdmin" : "Admin",
      name: refs.admin.firstName || refs.admin.email || "Phase Admin",
      email: refs.admin.email || "phase-admin@example.com",
    },
    isActive: true,
    isDeleted: false,
  });

  const adminDoctor = await Doctor.create({
    firstName: `AdmDoc${Date.now()}`,
    email: randomEmail("adm.doc"),
    phone: randomPhone(),
    medicalRegistrationNumber: `ADM-MED-${Date.now()}`,
    issuingMedicalCouncil: "Medical Council",
    specialization: "General",
    cities: [refs.city._id],
    isPhoneVerified: true,
    isActive: true,
    verificationStatus: "approved",
  });

  const adminPatient = await Patient.create({
    firstName: `AdmPat${Date.now()}`,
    email: randomEmail("adm.patient"),
    phone: randomPhone(),
    password: "RouteTest@123",
    isVerified: true,
    isActive: true,
    address: { cityId: refs.city._id, city: refs.city.name || "Lucknow", state: "UP", country: "India", pincode: "226001" },
  });

  const tempCity = await City.create({
    name: `phasecity${Date.now()}`,
    latitude: 26.8467,
    longitude: 80.9462,
    area: {
      type: "Polygon",
      coordinates: [[
        [80.94, 26.84],
        [80.95, 26.84],
        [80.95, 26.85],
        [80.94, 26.85],
        [80.94, 26.84],
      ]],
    },
    isActive: true,
  }).catch(() => null);

  const tempItemCategory = await ItemCategory.create({
    name: `Tmp Category ${Date.now()}`,
    description: "Temp category for update/toggle routes",
    type: "medicine",
    items: [{ name: "Tmp Item", unitPrice: 12, isActive: true }],
    isDeleted: false,
    createdBy: refs.admin?._id,
  });

  const tempDeleteItemCategory = await ItemCategory.create({
    name: `TmpDel Category ${Date.now()}`,
    description: "Temp category for delete route",
    type: "medicine",
    items: [{ name: "Tmp Del Item", unitPrice: 11, isActive: true }],
    isDeleted: false,
    createdBy: refs.admin?._id,
  });

  const doctorWithCities = await Doctor.findById(refs.doctor._id).populate("cities", "name").lean();
  const doctorCityName = doctorWithCities?.cities?.[0]?.name || refs.city.name || "Lucknow";

  return {
    cityId: String(refs.city._id),
    cityName: refs.city.name || "Lucknow",
    doctorCityName,
    serviceId: String(refs.service._id),
    patientId: String(refs.patient._id),
    doctorId: String(refs.doctor._id),
    adminId: refs.admin ? String(refs.admin._id) : null,
    serviceProviderId: refs.serviceProvider ? String(refs.serviceProvider._id) : null,
    bookingId: String(booking._id),
    treatmentId: String(treatment._id),
    invoiceId: String(invoice._id),
    paymentId: String(payment._id),
    itemCategoryId: refs.itemCategory ? String(refs.itemCategory._id) : null,
    articleId: String(article._id),
    socialPostId: String(post._id),
    crashId: String(crash._id),
    tempDoctorId: String(tempDoctor._id),
    tempPatientId: String(tempPatient._id),
    adminDoctorId: String(adminDoctor._id),
    adminPatientId: String(adminPatient._id),
    tempArticleId: String(tempArticle._id),
    tempSocialPostId: String(tempPost._id),
    tempServiceId: String(tempService._id),
    tempItemCategoryId: String(tempItemCategory._id),
    tempDeleteItemCategoryId: String(tempDeleteItemCategory._id),
    tempCityId: tempCity?._id ? String(tempCity._id) : String(refs.city._id),
    subAdminId: refs.subAdmin ? String(refs.subAdmin._id) : null,
    providerBookingId: providerBooking ? String(providerBooking._id) : String(booking._id),
    completedProviderBookingId: completedProviderBooking ? String(completedProviderBooking._id) : (providerBooking ? String(providerBooking._id) : String(booking._id)),
    cancellationBookingId: cancellationBooking ? String(cancellationBooking._id) : String(booking._id),
    adminEmail: refs.admin?.email || sessions.admin?.identity?.email || null,
    adminPhone: refs.admin?.phone || sessions.admin?.identity?.phone || null,
    serviceProviderEmail: refs.serviceProvider?.email || sessions.serviceProvider?.identity?.email || null,
    doctorPhone: sessions.doctor?.identity?.phone || null,
    patientPhone: sessions.patient?.identity?.phone || null,
    pendingAdminPhone,
    pendingDoctorPhone,
    pendingPatientPhone,
    slotDate: bookingDateStr,
    clinicId: refs.doctor?.clinics?.[0]?._id ? String(refs.doctor.clinics[0]._id) : null,
  };
}

function withPhasePathParams(routePath, refs, method) {
  let p = routePath;
  const lp = routePath.toLowerCase();
  const bookingReplacement = lp.includes("/admin/admin/booking/approve-cancellation/")
    ? (refs.cancellationBookingId || refs.bookingId)
    : lp.includes("/booking/completed-details/")
      ? (refs.completedProviderBookingId || refs.providerBookingId || refs.bookingId)
      : lp.includes("/booking/update-status/")
        ? (refs.providerBookingId || refs.bookingId)
        : lp.includes("/booking/reschedule/")
          ? refs.bookingId
          : refs.bookingId;
  p = p.replace(/:bookingId\b/g, bookingReplacement);
  p = p.replace(/:patientId\b/g, refs.patientId);
  p = p.replace(/:doctorId\b/g, refs.doctorId);
  p = p.replace(/:serviceId\b/g, refs.serviceId);
  if (lp.includes("/city/admin/cities/") && ["PUT", "PATCH", "DELETE"].includes(String(method || "").toUpperCase())) {
    p = p.replace(/:cityId\b/g, refs.tempCityId || refs.cityId);
  } else {
    p = p.replace(/:cityId\b/g, refs.cityId);
  }
  p = p.replace(/:invoiceId\b/g, refs.invoiceId);
  p = p.replace(/:treatmentId\b/g, refs.treatmentId);
  p = p.replace(/:providerId\b/g, refs.serviceProviderId || refs.doctorId);
  p = p.replace(/:crashId\b/g, refs.crashId);
  p = p.replace(/:postId\b/g, refs.socialPostId);
  p = p.replace(/:clinicId\b/g, refs.clinicId || "507f1f77bcf86cd799439016");
  p = p.replace(/:historyId\b/g, "507f1f77bcf86cd799439017");
  p = p.replace(/:cityName\b/g, refs.doctorCityName || refs.cityName || "Lucknow");
  p = p.replace(/:specialization\b/g, "General");
  p = p.replace(/:category\b/g, "consultation");
  p = p.replace(/:nursingType\b/g, "hourly");

  if (/:id\b/.test(p)) {
    if (lp.includes("/serviceprovider/service-provider/appointments/")) {
      p = p.replace(/:id\b/g, refs.providerBookingId || refs.bookingId);
    }
    if (p.includes("/admin/doctors/")) p = p.replace(/:id\b/g, method === "DELETE" ? refs.tempDoctorId : (refs.adminDoctorId || refs.doctorId));
    else if (p.includes("/admin/patients/")) p = p.replace(/:id\b/g, method === "DELETE" ? refs.tempPatientId : (refs.adminPatientId || refs.patientId));
    else if (p.includes("/admin/subadmins/")) p = p.replace(/:id\b/g, refs.subAdminId || refs.adminId || refs.patientId);
    else if (p.includes("/service-provider/") || lp.includes("/serviceprovider/")) p = p.replace(/:id\b/g, refs.serviceProviderId || refs.doctorId);
    else if (p.includes("/patient/updateProfile/")) p = p.replace(/:id\b/g, refs.patientId);
    else if (lp.includes("/doctor/getdoctorbyid/")) p = p.replace(/:id\b/g, refs.doctorId);
    else if (p.includes("/items/")) {
      const m = String(method || "").toUpperCase();
      const itemTargetId = m === "DELETE"
        ? (refs.tempDeleteItemCategoryId || refs.tempItemCategoryId || refs.itemCategoryId || refs.serviceId)
        : (refs.tempItemCategoryId || refs.itemCategoryId || refs.serviceId);
      p = p.replace(/:id\b/g, itemTargetId);
    }
    else if (p.includes("/service/") || p.includes("/services/")) {
      const routeMethod = String(method || "").toUpperCase();
      const serviceTargetId = routeMethod === "DELETE" ? (refs.tempServiceId || refs.serviceId) : refs.serviceId;
      p = p.replace(/:id\b/g, serviceTargetId);
    }
    else if (p.includes("/article/")) p = p.replace(/:id\b/g, ["PUT", "PATCH", "DELETE"].includes(method) ? refs.tempArticleId : refs.articleId);
    else if (p.includes("/socialPost/")) p = p.replace(/:id\b/g, method === "DELETE" ? refs.tempSocialPostId : refs.socialPostId);
    else p = p.replace(/:id\b/g, refs.itemCategoryId || refs.serviceId);
  }

  return p;
}

function routeContexts(routePath) {
  const p = routePath.toLowerCase();
  if (p.includes("/booking/my-bookings/:providerid")) return ["serviceProvider", "doctor", "admin", "patient", "public"];
  if (p.includes("/booking/providerbookings")) return ["serviceProvider", "doctor", "admin", "patient", "public"];
  if (p.includes("/booking/completed-details/")) return ["serviceProvider", "doctor", "admin", "patient", "public"];
  if (p.includes("/booking/update-status/")) return ["doctor", "serviceProvider", "admin", "patient", "public"];
  if (p.includes("/socialpost/")) return ["doctor", "patient", "admin", "serviceProvider", "public"];
  if (p.includes("/article/")) return ["doctor", "admin", "patient", "public"];
  if (p.includes("/admin/")) return ["admin", "public"];
  if (p.includes("/doctor/")) return ["doctor", "public"];
  if (p.includes("/patient/")) return ["patient", "public"];
  if (p.includes("/serviceprovider/")) return ["serviceProvider", "admin", "public"];
  if (p.includes("/booking/")) return ["patient", "doctor", "serviceProvider", "admin", "public"];
  if (p.includes("/payments/")) return ["patient", "admin", "serviceProvider", "public", "doctor"];
  return ["public", "admin", "doctor", "patient", "serviceProvider"];
}

function payloadFor(method, routePath, refs) {
  const key = `${method.toUpperCase()} ${routePath}`;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isoDate = tomorrow.toISOString().slice(0, 10);
  const slotFromSeed = (seed = 0) => {
    const slotIndex = (Math.floor((Date.now() / 1000) + seed) % 20) + 2; // 10:00 to 19:30
    const minutes = slotIndex * 30;
    const sh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const sm = String(minutes % 60).padStart(2, "0");
    const endMinutes = minutes + 30;
    const eh = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const em = String(endMinutes % 60).padStart(2, "0");
    return { startTime: `${sh}:${sm}`, endTime: `${eh}:${em}`, duration: 30 };
  };
  const bookingSlot = slotFromSeed(0);
  const rescheduleSlot = slotFromSeed(11);
  const providerSlot = slotFromSeed(7);
  const commonBooking = { appointmentDate: isoDate, startTime: bookingSlot.startTime, endTime: bookingSlot.endTime, duration: 30 };

  const map = {
    "POST /api/v1/admin/logout-all-devices": { email: refs.adminEmail || "admin@example.com" },
    "POST /api/v1/admin/login": { email: refs.adminEmail, password: process.env.TEST_ADMIN_PASSWORD || "RouteTest@123" },
    "POST /api/v1/admin/verify-signup-otp": { phone: refs.pendingAdminPhone || refs.adminPhone, otp: "123456" },
    "POST /api/v1/admin/patient/:patientId/medications": { medication: "Paracetamol" },
    "POST /api/v1/admin/patients/create": { firstName: "Phase Patient", email: randomEmail("phase.patient"), phone: randomPhone(), password: "RouteTest@123" },
    "POST /api/v1/admin/admin/doctor/add-cities": { doctorId: refs.doctorId, cityIds: [refs.cityId] },
    "POST /api/v1/admin/admin/doctor/remove-cities": { doctorId: refs.doctorId, cityIds: [refs.cityId] },
    "PUT /api/v1/admin/admin/doctor/update-cities": { doctorId: refs.doctorId, cityIds: [refs.cityId] },
    "PATCH /api/v1/admin/bookings/:bookingId/status": { status: "Approved", reason: "phase-fix" },
    "POST /api/v1/admin/bookings/create": { patientId: refs.patientId, serviceId: refs.serviceId, ...commonBooking, cityId: refs.cityId },
    "PATCH /api/v1/admin/bookings/update/:bookingId": { patientId: refs.patientId, ...commonBooking, status: "Approved", notes: "phase update", cityId: refs.cityId },
    "POST /api/v1/admin/doctors/create": {
      firstName: "Phase Doctor",
      email: randomEmail("phase.doctor"),
      phone: randomPhone(),
      medicalRegistrationNumber: `MED-${Date.now()}`,
      issuingMedicalCouncil: "Medical Council",
      specialization: "General",
      cityId: refs.cityId,
    },
    "POST /api/v1/admin/addEquipments": {
      name: `Phase Equipment ${Date.now()}`,
      description: "Phase equipment service",
      basePrice: 100,
      equipmentCharges: 20,
      cities: [refs.cityId],
      minDuration: 60,
      maxDuration: 180,
    },
    "POST /api/v1/admin/admin/booking/approve-cancellation/:bookingId": { action: "reject", adminReason: "phase check" },
    "POST /api/v1/doctor/resend-login-otp": { phone: refs.doctorPhone },
    "POST /api/v1/doctor/signup": {
      firstName: "Phase Doctor",
      email: randomEmail("phase.doc.signup"),
      phone: randomPhone(),
      medicalRegistrationNumber: `MED-${Date.now()}`,
      issuingMedicalCouncil: "Medical Council",
      specialization: "General",
      cityId: refs.cityId,
    },
    "POST /api/v1/doctor/verify-login-otp": { phone: refs.doctorPhone, otp: "123456" },
    "POST /api/v1/doctor/verify-signup-otp": { phone: refs.pendingDoctorPhone || refs.doctorPhone, otp: "123456" },
    "POST /api/v1/doctor/resend-signup-otp": { phone: refs.pendingDoctorPhone || refs.doctorPhone },
    "POST /api/v1/doctor/logout-all-devices": { phone: refs.doctorPhone },
    "PUT /api/v1/doctor/availability": { days: ["Monday", "Tuesday"], timeSlots: [{ startTime: "09:00", endTime: "12:00" }] },
    "POST /api/v1/doctor/clinic": { clinicfirstName: "Phase Clinic", address: { street: "A-1", city: "Lucknow" } },
    "PUT /api/v1/doctor/toggle-slot": { date: refs.slotDate || isoDate, startTime: "09:00", isSlotAvailable: false },
    "POST /api/v1/doctor/break-time": { date: refs.slotDate || isoDate, startTime: "10:00", endTime: "10:30", reason: "phase break" },
    "DELETE /api/v1/doctor/break-time": { date: refs.slotDate || isoDate, startTime: "10:00" },
    "PUT /api/v1/doctor/bulk-manage-slots": { date: refs.slotDate || isoDate, action: "block", timeRange: { start: "09:00", end: "09:30" } },
    "POST /api/v1/patient/medical-history": { condition: "Diabetes", notes: "phase test" },
    "POST /api/v1/patient/login": { phone: refs.patientPhone },
    "POST /api/v1/patient/signup": {
      firstName: "Phase Patient Signup",
      email: randomEmail("phase.patient.signup"),
      phone: randomPhone(),
      password: "RouteTest@123",
      address: { cityId: refs.cityId, city: "Lucknow", state: "UP", country: "India", pincode: "226001" },
    },
    "POST /api/v1/patient/verify-login-otp": { phone: refs.patientPhone, otp: "123456" },
    "POST /api/v1/patient/verify-signup-otp": { phone: refs.pendingPatientPhone || refs.patientPhone, otp: "123456" },
    "POST /api/v1/patient/resend-login-otp": { phone: refs.patientPhone },
    "POST /api/v1/patient/resend-signup-otp": { phone: refs.pendingPatientPhone || refs.patientPhone },
    "POST /api/v1/patient/allergies": { allergy: "Dust" },
    "DELETE /api/v1/patient/allergies": { allergy: "Dust" },
    "POST /api/v1/patient/medications": { medication: "Paracetamol" },
    "DELETE /api/v1/patient/medications": { medication: "Paracetamol" },
    "POST /api/v1/patient/logout-all": { phone: refs.patientPhone },
    "PATCH /api/v1/patient/updateProfile/:id": { firstName: `PhaseUpdated${Date.now()}` },
    "POST /api/v1/booking/providerBookings": {
      patientId: refs.patientId,
      previousBookingId: refs.completedProviderBookingId || refs.providerBookingId || refs.bookingId,
      serviceId: refs.serviceId,
      appointmentDate: isoDate,
      startTime: providerSlot.startTime,
      endTime: providerSlot.endTime,
      duration: 30,
      cityId: refs.cityId,
    },
    "POST /api/v1/booking/create": {
      patientId: refs.patientId,
      serviceId: refs.serviceId,
      ...commonBooking,
      cityId: refs.cityId,
    },
    "POST /api/v1/booking/completed-details/:bookingId": {
      bookingId: refs.completedProviderBookingId || refs.providerBookingId || refs.bookingId,
      billingDetails: { calculatedBase: 100, taxPercentage: 18 },
      categories: [],
    },
    "PUT /api/v1/booking/update-status/:bookingId": { status: "In-Progress", notes: "phase status update" },
    "PUT /api/v1/booking/cancel/:bookingId": { reason: "Need to cancel this appointment due to schedule conflict" },
    "PUT /api/v1/booking/reschedule/:bookingId": {
      appointmentDate: isoDate,
      startTime: rescheduleSlot.startTime,
      endTime: rescheduleSlot.endTime,
      reason: "phase reschedule",
      duration: 30,
    },
    "POST /api/v1/items/create": {
      name: `Phase Category ${Date.now()}`,
      description: "Phase category",
      type: "medicine",
      items: [{ name: "Phase Item 1", unitPrice: 15, isActive: true }],
    },
    "PUT /api/v1/items/update/:id": {
      name: `Phase Category Updated ${Date.now()}`,
      description: "Updated phase category",
      type: "medicine",
      items: [{ name: "Phase Item 1", unitPrice: 17, isActive: true }],
      isActive: true,
    },
    "PATCH /api/v1/items/toggle-status/:id": {},
    "POST /api/v1/service/createService": {
      name: `Phase Service ${Date.now()}`,
      category: "consultation",
      description: "Phase service description",
      basePrice: 200,
      cities: [refs.cityId],
      modes: ["Home Service"],
    },
    "POST /api/v1/service/admin/bulk-update": { serviceIds: [refs.serviceId], updates: { isActive: true } },
    "PATCH /api/v1/service/:id/toggle-status": { status: "toggle" },
    "PATCH /api/v1/service/services/:id": { description: `Phase updated description ${Date.now()}`, basePrice: 210 },
    "POST /api/v1/service/:id/restore": {},
    "POST /api/v1/city/admin/cities": {
      name: `phasecity${Date.now()}`,
      latitude: 26.8467,
      longitude: 80.9462,
      polygon: [
        [80.94, 26.84],
        [80.95, 26.84],
        [80.95, 26.85],
        [80.94, 26.85],
      ],
    },
    "PUT /api/v1/city/admin/cities/:cityId": { name: `phasecityupd${Date.now()}` },
    "PATCH /api/v1/city/admin/cities/toggle/:cityId": {},
    "POST /api/v1/geo/check-location": {
      address: `${refs.cityName || "Lucknow"}, India`,
      polygon: [
        [80.94, 26.84],
        [80.95, 26.84],
        [80.95, 26.85],
        [80.94, 26.85],
      ],
    },
    "POST /api/v1/article/create": {
      cityName: refs.cityName || "Lucknow",
      category: "General Health",
      title: `Phase Article ${Date.now()}`,
      articleType: "article",
      textContent: "Phase article content",
      location: "Lucknow",
      tags: ["phase", "health"],
    },
    "PUT /api/v1/article/updateArticle/:id": { title: `Phase Article Updated ${Date.now()}`, description: "updated" },
    "PATCH /api/v1/article/:id/publish": {},
    "POST /api/v1/socialPost/createPost": { type: "TEXT", content: `Phase social content ${Date.now()}` },
    "POST /api/v1/socialPost/followDoctor": { targetDoctorId: refs.doctorId },
    "POST /api/v1/socialPost/likePost/:id/toggle": {},
    "POST /api/v1/socialPost/commentPost/:id": { text: "phase comment" },
    "POST /api/v1/socialPost/addComment/:id": { text: "phase comment two" },
    "PATCH /api/v1/socialPost/posts/:id/hide": {},
    "POST /api/v1/serviceProvider/createservice-provider": {
      firstName: "Phase",
      lastName: "Provider",
      ownerName: "Phase Owner",
      age: 30,
      dateOfBirth: JSON.stringify("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("phase.create.provider"),
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
      services: JSON.stringify([{ serviceId: refs.serviceId, serviceName: "General", experienceYears: 2 }]),
      qualification: "BSc Nursing",
      registrationNumber: `REG-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 4,
      serviceCities: JSON.stringify([refs.cityId]),
      bankDetails: JSON.stringify({
        accountHolderName: "Phase Provider",
        accountNumber: `${Date.now()}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "State Bank",
      }),
    },
    "POST /api/v1/serviceProvider/login": {
      email: process.env.TEST_PROVIDER_EMAIL || refs.serviceProviderEmail || "phase-provider@example.com",
      password: process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123",
    },
    "PUT /api/v1/serviceProvider/service-provider/:id": {
      firstName: "PhaseUpdated",
      lastName: "Provider",
      ownerName: "Phase Owner",
      age: 31,
      dateOfBirth: JSON.stringify("1995-01-01"),
      gender: "Male",
      mobile: randomPhone(),
      email: randomEmail("phase.update.provider"),
      password: process.env.TEST_PROVIDER_PASSWORD || "RouteSP@123",
      currentAddress: JSON.stringify({
        street: "B-1",
        locality: "Center",
        city: "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
      }),
      permanentAddress: JSON.stringify({
        street: "B-1",
        locality: "Center",
        city: "Lucknow",
        state: "UP",
        country: "India",
        pincode: "226001",
        sameAsCurrent: true,
      }),
      services: JSON.stringify([{ serviceId: refs.serviceId, serviceName: "General", experienceYears: 3 }]),
      qualification: "BSc Nursing",
      registrationNumber: `UPD-REG-${Date.now()}`,
      registrationCouncil: "State Council",
      yearsOfExperience: 5,
      serviceCities: JSON.stringify([refs.cityId]),
      bankDetails: JSON.stringify({
        accountHolderName: "Phase Provider",
        accountNumber: `${Date.now()}`.slice(-12),
        ifscCode: "SBIN0001234",
        bankName: "State Bank",
      }),
    },
    "POST /api/v1/invoice/generate": {
      bookingId: refs.bookingId,
      patientId: refs.patientId,
      doctorId: refs.serviceProviderId,
      serviceId: refs.serviceId,
      billingDetails: {
        category: "consultation",
        serviceName: "Phase Consultation",
        durationMinutes: 30,
        basePrice: 100,
        calculatedBase: 100,
        taxPercentage: 18,
      },
      medicines: [{ name: "Paracetamol", quantity: 1, pricePerUnit: 10, gstPercentage: 12 }],
      additionalEquipment: [],
    },
    "POST /api/v1/payments/treatments/:treatmentId/manual-collection": {
      amount: 50,
      method: "Cash",
      stage: "Advance",
      note: "phase collection",
    },
    "POST /api/v1/payments/treatments/:treatmentId/refunds/manual": {
      amount: 10,
      mode: "Adjustment",
      refundType: "Partial",
      reason: "phase refund",
    },
    "POST /api/v1/payments/treatments/:treatmentId/online/order": { amount: 20 },
    "POST /api/v1/payments/treatments/:treatmentId/online/verify": {
      razorpay_order_id: "order_test_phase",
      razorpay_payment_id: "pay_test_phase",
      razorpay_signature: "sig_test_phase",
    },
    "POST /api/v1/crash-report/create": {
      appName: "Medico App",
      appVersion: "1.0.0",
      environment: "development",
      errorName: "PhaseExecutionError",
      errorMessage: "Phase route test crash payload",
      severity: "LOW",
      userId: refs.patientId,
      userType: "Patient",
    },
  };

  if (map[key] !== undefined) return map[key];
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return {};
  return null;
}

function queryFor(method, routePath, refs) {
  const key = `${method.toUpperCase()} ${routePath}`;
  if (key === "GET /api/v1/admin/admin/city/:cityId/doctors") return { cityId: refs.cityId };
  if (key === "DELETE /api/v1/admin/patient/:patientId/medications") return { medication: "Paracetamol" };
  if (key === "GET /api/v1/doctor/slots/:doctorId") {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { startDate: tomorrow, endDate: tomorrow };
  }
  if (key === "GET /api/v1/service/:serviceId/slots") {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { date: tomorrow };
  }
  if (key === "GET /api/v1/city/find/by-location") return { lat: "26.8467", lng: "80.9462" };
  return null;
}

function parseMessage(data) {
  if (!data) return "";
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return parsed.message || parsed.error?.message || data;
    } catch {
      return data;
    }
  }
  return data.message || data.error?.message || "";
}

async function doHttp({ method, url, headers, body, isMultipart }) {
  if (isMultipart) {
    const form = new FormData();
    for (const [k, v] of Object.entries(body || {})) {
      if (k === "__file__") continue;
      if (Array.isArray(v) || typeof v === "object") form.append(k, JSON.stringify(v));
      else if (v != null) form.append(k, String(v));
    }
    form.append("file", Buffer.from("phase-upload-content"), { filename: "phase.txt", contentType: "text/plain" });
    const res = await axios({
      method,
      url,
      data: form,
      timeout: 40000,
      validateStatus: () => true,
      headers: { ...headers, ...form.getHeaders() },
    });
    return res;
  }
  return axios({
    method,
    url,
    headers,
    data: ["get"].includes(method.toLowerCase()) ? undefined : body,
    timeout: 40000,
    validateStatus: () => true,
  });
}

async function attemptRoute(route, sessions, refs) {
  const execPath = withPhasePathParams(route.path, refs, route.method.toUpperCase());
  const contexts = routeContexts(route.path);
  const method = route.method.toUpperCase();
  const routeKey = `${method} ${route.path}`;
  const bodyBase = payloadFor(method, route.path, refs);
  const query = queryFor(method, route.path, refs);
  const isMultipart = route.path === "/api/v1/uploadfile/upload";
  const tries = [];
  let best = null;

  if (routeKey === "POST /api/v1/admin/verify-signup-otp" && refs.pendingAdminPhone) {
    await Admin.updateOne({ phone: refs.pendingAdminPhone }, { $set: { isVerified: false, isActive: true } });
    await Otp.deleteMany({ phone: refs.pendingAdminPhone });
    await Otp.create({ phone: refs.pendingAdminPhone, otp: 123456, otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" });
  }
  if (routeKey === "POST /api/v1/doctor/verify-signup-otp" && refs.pendingDoctorPhone) {
    await Doctor.updateOne({ phone: refs.pendingDoctorPhone }, { $set: { isPhoneVerified: false, isActive: true, verificationStatus: "pending" } });
    await Otp.deleteMany({ phone: refs.pendingDoctorPhone });
    await Otp.create({ phone: refs.pendingDoctorPhone, otp: "123456", otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" });
  }
  if (routeKey === "POST /api/v1/patient/verify-signup-otp" && refs.pendingPatientPhone) {
    await Patient.updateOne({ phone: refs.pendingPatientPhone }, { $set: { isVerified: false, isActive: false } });
    await Otp.deleteMany({ phone: refs.pendingPatientPhone });
    await Otp.create({ phone: refs.pendingPatientPhone, otp: 123456, otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "signup", attempts: 0, deliveryStatus: "sent" });
  }
  if (routeKey === "POST /api/v1/patient/verify-login-otp" && refs.patientPhone) {
    await Patient.updateOne({ _id: refs.patientId }, { $set: { isVerified: true, isActive: true } });
    await Otp.deleteMany({ phone: refs.patientPhone });
    await Otp.create({ phone: refs.patientPhone, otp: 123456, otpExpiresAt: new Date(Date.now() + 20 * 60 * 1000), type: "login", attempts: 0, deliveryStatus: "sent" });
  }
  if (routeKey === "POST /api/v1/patient/login" && refs.patientId) {
    await Patient.updateOne({ _id: refs.patientId }, { $set: { isVerified: true, isActive: true } });
  }
  if (routeKey === "POST /api/v1/doctor/resend-login-otp" && refs.doctorId) {
    await Doctor.updateOne({ _id: refs.doctorId }, { $set: { isPhoneVerified: true, isActive: true } });
  }
  if (
    ["POST /api/v1/doctor/break-time", "DELETE /api/v1/doctor/break-time", "PUT /api/v1/doctor/bulk-manage-slots", "PUT /api/v1/doctor/toggle-slot"].includes(routeKey) &&
    refs.doctorId
  ) {
    const slotDate = (bodyBase && bodyBase.date) || refs.slotDate || new Date().toISOString().slice(0, 10);
    const doc = await Doctor.findById(refs.doctorId);
    if (doc) {
      if (!doc.availability || typeof doc.availability !== "object") doc.availability = {};
      if (!Array.isArray(doc.availability.dailySlots)) doc.availability.dailySlots = [];
      let ds = doc.availability.dailySlots.find((d) => new Date(d.date).toDateString() === new Date(slotDate).toDateString());
      if (!ds) {
        ds = { date: new Date(slotDate), dayOfWeek: new Date(slotDate).toLocaleDateString("en-US", { weekday: "long" }), isAvailable: true, slots: [], breakTimes: [] };
        doc.availability.dailySlots.push(ds);
      }
      if (!Array.isArray(ds.slots) || ds.slots.length === 0) {
        ds.slots = [
          { startTime: "09:00", endTime: "09:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
          { startTime: "10:00", endTime: "10:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
          { startTime: "12:00", endTime: "12:30", duration: 30, status: "available", isBooked: false, isSlotAvailable: true },
        ];
      }
      await doc.save({ validateBeforeSave: false });
    }
  }
  if (routeKey === "DELETE /api/v1/patient/unfollow/:doctorId" && refs.patientId && refs.doctorId) {
    await Patient.updateOne({ _id: refs.patientId }, { $addToSet: { following: refs.doctorId } });
    await Doctor.updateOne({ _id: refs.doctorId }, { $addToSet: { followers: refs.patientId } });
  }
  if (routeKey === "DELETE /api/v1/admin/patient/:patientId/medications" && refs.patientId) {
    await Patient.updateOne({ _id: refs.patientId }, { $addToSet: { currentMedications: "Paracetamol" } });
  }

  for (const ctx of contexts) {
    if (ctx !== "public" && !sessions[ctx]?.cookie) continue;
    const headers = { "Content-Type": "application/json" };
    if (ctx !== "public") headers.Cookie = sessions[ctx].cookie;
    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
    const url = `${BASE_URL}${execPath}${qs}`;
    let body = bodyBase ? JSON.parse(JSON.stringify(bodyBase)) : null;

    if (routeKey === "POST /api/v1/payments/treatments/:treatmentId/online/verify" && ctx === "patient") {
      const match = execPath.match(/\/payments\/treatments\/([^/]+)\/online\/verify/i);
      const treatmentId = match?.[1] || refs.treatmentId;
      const orderUrl = `${BASE_URL}/api/v1/payments/treatments/${treatmentId}/online/order`;
      const orderRes = await doHttp({ method: "POST", url: orderUrl, headers, body: { amount: 20 }, isMultipart: false });
      const orderId = orderRes?.data?.data?.orderId;
      if (orderRes.status === 200 && orderId && body && typeof body === "object") {
        const razorpayPaymentId = `pay_phase_${Date.now()}`;
        const signature = crypto
          .createHmac("sha256", process.env.RAZORPAY_API_SECRET || "")
          .update(`${orderId}|${razorpayPaymentId}`)
          .digest("hex");
        body.razorpay_order_id = orderId;
        body.razorpay_payment_id = razorpayPaymentId;
        body.razorpay_signature = signature;
      }
    }

    const started = Date.now();
    let status = 0;
    let responseBody = null;
    let responseError = null;
    try {
      await ensureServer();
      const res = await doHttp({ method, url, headers, body, isMultipart });
      status = res.status;
      responseBody = res.data;
    } catch (e) {
      responseError = `${e.code ? `${e.code}: ` : ""}${e.message || "request failed"}`;
    }

    let parsedMessage = parseMessage(responseBody);
    if (status === 409 && /slot/i.test(parsedMessage || "") && body && typeof body === "object") {
      const retrySlots = [
        { startTime: "16:00", endTime: "16:30" },
        { startTime: "17:00", endTime: "17:30" },
        { startTime: "18:00", endTime: "18:30" },
        { startTime: "19:00", endTime: "19:30" },
      ];
      for (const s of retrySlots) {
        body.startTime = s.startTime;
        body.endTime = s.endTime;
        body.duration = 30;
        try {
          const retryRes = await doHttp({ method, url, headers, body, isMultipart });
          status = retryRes.status;
          responseBody = retryRes.data;
          responseError = null;
          parsedMessage = parseMessage(responseBody);
          if (status < 400 || status !== 409) break;
        } catch (e3) {
          responseError = `${e3.code ? `${e3.code}: ` : ""}${e3.message || "request failed"}`;
          break;
        }
      }
    }

    if (status === 400 && /required/i.test(parsedMessage || "") && body && typeof body === "object") {
      if (/new status/i.test(parsedMessage)) body.status = "Approved";
      if (/doctor id/i.test(parsedMessage)) body.doctorId = refs.doctorId;
      if (/city id/i.test(parsedMessage)) body.cityId = refs.cityId;
      if (/patient id/i.test(parsedMessage)) body.patientId = refs.patientId;
      if (/service id/i.test(parsedMessage)) body.serviceId = refs.serviceId;
      if (/phone/i.test(parsedMessage) && !body.phone) body.phone = refs.patientPhone || refs.doctorPhone || refs.adminPhone;
      if (/otp/i.test(parsedMessage) && !body.otp) body.otp = "123456";
      if (/medication/i.test(parsedMessage) && !body.medication) body.medication = "Paracetamol";
      if (/amount/i.test(parsedMessage) && !body.amount) body.amount = 10;
      try {
        const retryRes = await doHttp({ method, url, headers, body, isMultipart });
        status = retryRes.status;
        responseBody = retryRes.data;
        responseError = null;
        parsedMessage = parseMessage(responseBody);
      } catch (e2) {
        responseError = `${e2.code ? `${e2.code}: ` : ""}${e2.message || "request failed"}`;
      }
    }

    const pass = status >= 200 && status < 400;
    const record = {
      context: ctx,
      status,
      requestUrl: `${execPath}${qs}`,
      requestBody: body,
      responseBodyPreview: pickPreview(responseBody),
      responseError,
      normalizedMessage: parsedMessage || responseError || "",
      durationMs: Date.now() - started,
      pass,
    };
    tries.push(record);
    if (!best) best = record;
    if (pass) {
      best = record;
      break;
    }
    if (status !== 0 && ![401, 403].includes(status)) {
      best = record;
      break;
    }
  }

  return {
    method,
    path: route.path,
    controllerRef: route.controllerRef,
    executablePath: execPath,
    tries,
    final: best || {
      context: "none",
      status: 0,
      requestUrl: execPath,
      requestBody: bodyBase,
      responseBodyPreview: null,
      responseError: "No usable auth context",
      normalizedMessage: "No usable auth context",
      durationMs: 0,
      pass: false,
    },
  };
}

function writeContractLog() {
  if (fs.existsSync(CONTRACT_LOG)) return;
  fs.writeFileSync(
    CONTRACT_LOG,
    [
      "# API Contract Change Log",
      "",
      "No request/response contract changes have been applied yet.",
      "Any future contract change will be added only after explicit user approval.",
      "",
    ].join("\n")
  );
}

function writeFailureReports(allPhaseResults) {
  const unresolved = [];
  const md = [];
  md.push("# Post-Fix Route Failures");
  md.push("");
  md.push(`- generatedAt: ${nowIso()}`);
  md.push("");

  for (const phase of allPhaseResults) {
    const failed = phase.routes.filter((r) => !(r.final && r.final.pass));
    md.push(`## Phase ${String(phase.phase).padStart(2, "0")}`);
    md.push(`- totalRoutes: ${phase.routes.length}`);
    md.push(`- fixedRoutes: ${phase.routes.length - failed.length}`);
    md.push(`- unresolvedRoutes: ${failed.length}`);
    md.push("");
    for (const item of failed) {
      const category = item.final.status >= 500 || item.final.status === 0
        ? "Backend bug / external block"
        : item.final.status === 401 || item.final.status === 403
        ? "Auth/role restriction"
        : item.final.status === 404
        ? "Data precondition missing"
        : "Validation/contract mismatch";
      unresolved.push({
        phase: phase.phase,
        method: item.method,
        path: item.path,
        controllerRef: item.controllerRef,
        status: item.final.status,
        context: item.final.context,
        error: item.final.normalizedMessage,
        category,
        requestUrl: item.final.requestUrl,
        requestBody: item.final.requestBody,
      });
      md.push(`- ${item.method} ${item.path} | status=${item.final.status} | context=${item.final.context}`);
      md.push(`  controller: ${item.controllerRef || "unknown"}`);
      md.push(`  category: ${category}`);
      md.push(`  error: ${item.final.normalizedMessage || item.final.responseError || "unknown"}`);
      md.push(`  request: ${item.final.requestUrl}`);
    }
    md.push("");
  }

  fs.writeFileSync(OUT_MD, md.join("\n"));
  fs.writeFileSync(
    OUT_ERR_JSON,
    JSON.stringify(
      {
        generatedAt: nowIso(),
        totalUnresolvedRoutes: unresolved.length,
        unresolved,
      },
      null,
      2
    )
  );
}

async function main() {
  writeContractLog();
  await ensureServer();
  await mongoose.connect(process.env.MONGODB_URI);

  const sessions = {};
  await loginPatient(sessions);
  await loginDoctor(sessions);
  await loginAdmin(sessions);
  const refs = await ensureFixtures(sessions);
  await loginServiceProvider(sessions, refs);
  const finalRefs = await ensureFixtures(sessions);

  const allPhaseResults = [];
  for (let phase = 1; phase <= 10; phase++) {
    const routes = parsePhaseRoutes(phase).sort((a, b) => {
      const order = { GET: 1, POST: 2, PATCH: 3, PUT: 4, DELETE: 5 };
      return (order[a.method] || 9) - (order[b.method] || 9);
    });
    const results = [];
    for (const route of routes) {
      const hit = await attemptRoute(route, sessions, finalRefs);
      results.push(hit);
    }
    allPhaseResults.push({ phase, routes: results });
  }

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: nowIso(),
        baseUrl: BASE_URL,
        refs: finalRefs,
        phases: allPhaseResults,
      },
      null,
      2
    )
  );
  writeFailureReports(allPhaseResults);

  await mongoose.disconnect();
  for (const pid of startedServerPids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_) {}
  }

  const summary = allPhaseResults.map((p) => ({
    phase: p.phase,
    totalRoutes: p.routes.length,
    fixedRoutes: p.routes.filter((r) => r.final?.pass).length,
    unresolvedRoutes: p.routes.filter((r) => !r.final?.pass).length,
  }));
  console.log(JSON.stringify({ summary, outputs: { OUT_JSON, OUT_MD, OUT_ERR_JSON, CONTRACT_LOG } }, null, 2));
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
