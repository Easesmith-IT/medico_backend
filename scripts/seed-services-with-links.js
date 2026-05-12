require("dotenv").config();
const mongoose = require("mongoose");

const City = require("../models/availableCities");
const Service = require("../models/serviceModel");
const Doctor = require("../models/doctorModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Admin = require("../models/adminModel");

const TARGET_CITIES = ["kanpur", "lucknow", "noida", "delhi", "mumbai"];

function titleCase(s) {
  return String(s || "")
    .split(" ")
    .map((x) => (x ? x[0].toUpperCase() + x.slice(1) : x))
    .join(" ");
}

function normalizeRoleForServiceCreator(role) {
  const r = String(role || "").toLowerCase();
  if (r === "superadmin") return "SuperAdmin";
  return "Admin";
}

function buildServiceTemplates(cityName) {
  const cityTitle = titleCase(cityName);
  return [
    {
      key: `consultation-${cityName}`,
      name: `${cityTitle} Doctor Consultation`,
      category: "consultation",
      nursingType: null,
      description: `In-person or home consultation service in ${cityTitle} with trained medical professionals.`,
      basePrice: 900,
      equipmentCharges: 0,
      taxPercentage: 18,
      modes: ["Home Service", "Visit Provider Location"],
      supportsDuration: true,
      defaultDuration: 30,
      durationOptions: [15, 30, 45, 60],
      slotConfig: {
        consultationSlots: {
          enabled: true,
          startTime: "09:00",
          endTime: "19:00",
          slotDuration: 30,
        },
        nursingSlots: {
          enabled: false,
          shiftTypes: [],
          minDuration: 60,
          maxDuration: 1440,
          available24x7: true,
          allowCustomDuration: true,
        },
        equipmentBooking: {
          enabled: false,
          minDuration: 60,
          maxDuration: 720,
          available24x7: true,
        },
      },
      paymentMode: "Both",
    },
    {
      key: `nursing-${cityName}`,
      name: `${cityTitle} Home Nursing Care`,
      category: "nursing",
      nursingType: "12-hour",
      description: `Skilled nursing support in ${cityTitle} including post-operative and chronic care monitoring.`,
      basePrice: 1500,
      equipmentCharges: 200,
      taxPercentage: 18,
      modes: ["Home Service"],
      supportsDuration: true,
      defaultDuration: 720,
      durationOptions: [60, 480, 720, 1440],
      slotConfig: {
        consultationSlots: {
          enabled: false,
          startTime: "09:00",
          endTime: "19:00",
          slotDuration: 30,
        },
        nursingSlots: {
          enabled: true,
          shiftTypes: ["hourly", "8-hour", "12-hour", "24-hour", "day-shift", "night-shift"],
          minDuration: 60,
          maxDuration: 1440,
          available24x7: true,
          allowCustomDuration: true,
        },
        equipmentBooking: {
          enabled: false,
          minDuration: 60,
          maxDuration: 720,
          available24x7: true,
        },
      },
      paymentMode: "Both",
    },
    {
      key: `equipment-${cityName}`,
      name: `${cityTitle} Medical Equipment Support`,
      category: "equipment",
      nursingType: null,
      description: `At-home medical equipment setup and support in ${cityTitle} for patient comfort and recovery.`,
      basePrice: 1200,
      equipmentCharges: 400,
      taxPercentage: 18,
      modes: ["Home Service"],
      supportsDuration: true,
      defaultDuration: 120,
      durationOptions: [60, 120, 240, 480, 720],
      slotConfig: {
        consultationSlots: {
          enabled: false,
          startTime: "09:00",
          endTime: "19:00",
          slotDuration: 30,
        },
        nursingSlots: {
          enabled: false,
          shiftTypes: [],
          minDuration: 60,
          maxDuration: 1440,
          available24x7: true,
          allowCustomDuration: true,
        },
        equipmentBooking: {
          enabled: true,
          minDuration: 60,
          maxDuration: 720,
          available24x7: true,
        },
      },
      paymentMode: "Prepaid",
    },
  ];
}

async function getCreatorAdmin() {
  const admin = await Admin.findOne({
    role: { $in: ["superAdmin", "subAdmin", "superadmin", "subadmin"] },
  })
    .sort({ createdAt: 1 })
    .select("_id firstName lastName email role")
    .lean();

  if (!admin) {
    throw new Error("No Admin/SuperAdmin found for createdBy metadata");
  }
  return admin;
}

function serviceProviderEntry(serviceDoc, fallbackYears) {
  return {
    serviceId: serviceDoc._id,
    serviceName: serviceDoc.name,
    experienceYears: Math.max(1, Number(fallbackYears || 1)),
    specialization: titleCase(serviceDoc.category),
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const cityDocs = await City.find({
    name: { $in: TARGET_CITIES },
  })
    .select("_id name")
    .lean();

  if (cityDocs.length !== TARGET_CITIES.length) {
    const found = new Set(cityDocs.map((c) => c.name));
    const missing = TARGET_CITIES.filter((n) => !found.has(n));
    throw new Error(`Missing required cities: ${missing.join(", ")}`);
  }

  const cityByName = new Map(cityDocs.map((c) => [c.name, c]));
  const creator = await getCreatorAdmin();
  const creatorName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim() || "Admin";
  const creatorModel = normalizeRoleForServiceCreator(creator.role);

  const createdServices = [];
  for (const cityName of TARGET_CITIES) {
    const city = cityByName.get(cityName);
    const templates = buildServiceTemplates(cityName);

    for (const tpl of templates) {
      const payload = {
        name: tpl.name,
        category: tpl.category,
        nursingType: tpl.category === "nursing" ? tpl.nursingType : null,
        description: tpl.description,
        basePrice: tpl.basePrice,
        equipmentCharges: tpl.equipmentCharges,
        taxPercentage: tpl.taxPercentage,
        modes: tpl.modes,
        slotConfig: tpl.slotConfig,
        supportsDuration: tpl.supportsDuration,
        defaultDuration: tpl.defaultDuration,
        durationOptions: tpl.durationOptions,
        cities: [city._id],
        createdBy: {
          userId: creator._id,
          userModel: creatorModel,
          name: creatorName,
          email: creator.email,
        },
        paymentMode: tpl.paymentMode,
        isActive: true,
        isDeleted: false,
      };

      const doc = await Service.create(payload);
      createdServices.push({
        _id: doc._id,
        name: doc.name,
        category: doc.category,
        cityName,
        cityId: city._id,
      });
    }
  }

  const servicesByCity = TARGET_CITIES.reduce((acc, cityName) => {
    acc[cityName] = createdServices.filter((s) => s.cityName === cityName);
    return acc;
  }, {});

  const providerLinkSummary = [];
  const doctorLinkSummary = [];
  let unresolvedCities = 0;

  for (const cityName of TARGET_CITIES) {
    const city = cityByName.get(cityName);
    const cityServices = servicesByCity[cityName];

    const providers = await ServiceProvider.find({
      isDeleted: { $ne: true },
      serviceCities: city._id,
    }).select("_id yearsOfExperience services");

    const doctors = await Doctor.find({
      cities: city._id,
      isActive: true,
    }).select("_id services");

    if (!providers.length || !doctors.length) {
      unresolvedCities += 1;
    }

    let providersUpdated = 0;
    for (const p of providers) {
      const existing = Array.isArray(p.services) ? p.services : [];
      const existingIds = new Set(existing.map((x) => String(x.serviceId)));
      const merged = [...existing];

      for (const svc of cityServices) {
        if (!existingIds.has(String(svc._id))) {
          merged.push(serviceProviderEntry(svc, p.yearsOfExperience));
        }
      }

      p.services = merged;
      await p.save();
      providersUpdated += 1;
    }

    let doctorsUpdated = 0;
    for (const d of doctors) {
      const arr = Array.isArray(d.services) ? d.services : [];
      const ids = new Set(arr.map((x) => String(x)));
      for (const svc of cityServices) {
        if (!ids.has(String(svc._id))) {
          arr.push(svc._id);
        }
      }
      d.services = arr;
      await d.save();
      doctorsUpdated += 1;
    }

    providerLinkSummary.push({ city: cityName, updatedProviders: providersUpdated });
    doctorLinkSummary.push({ city: cityName, updatedDoctors: doctorsUpdated });
  }

  const perCityServiceCount = TARGET_CITIES.map((cityName) => ({
    city: cityName,
    count: servicesByCity[cityName].length,
  }));

  const result = {
    insertedServiceCount: createdServices.length,
    perCityServiceCount,
    providerLinkSummary,
    doctorLinkSummary,
    unresolvedCityCount: unresolvedCities,
    sampleServices: createdServices.slice(0, 8).map((s) => ({
      id: String(s._id),
      name: s.name,
      category: s.category,
      city: s.cityName,
    })),
  };

  console.log("SEED_SERVICES_WITH_LINKS_SUMMARY", JSON.stringify(result, null, 2));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("SEED_SERVICES_WITH_LINKS_ERR", err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
