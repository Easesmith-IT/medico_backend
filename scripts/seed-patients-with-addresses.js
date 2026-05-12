require("dotenv").config();
const mongoose = require("mongoose");

const Patient = require("../models/patientModel");
const City = require("../models/availableCities");
const Doctor = require("../models/doctorModel");
const Service = require("../models/serviceModel");
const PatientAddress = require("../models/patientAddressModel");

const TARGET_CITIES = ["kanpur", "lucknow", "noida", "delhi", "mumbai"];
const PATIENTS_PER_CITY = 5;

const CITY_STATE_MAP = {
  kanpur: "Uttar Pradesh",
  lucknow: "Uttar Pradesh",
  noida: "Uttar Pradesh",
  delhi: "Delhi",
  mumbai: "Maharashtra",
};

const MALE_FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Rohan",
  "Kunal",
  "Arjun",
  "Ishaan",
  "Manav",
  "Yash",
  "Sarthak",
];

const FEMALE_FIRST_NAMES = [
  "Aanya",
  "Ananya",
  "Ira",
  "Kavya",
  "Meera",
  "Nisha",
  "Priya",
  "Riya",
  "Saanvi",
  "Tanvi",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Singh",
  "Khan",
  "Patel",
  "Mishra",
  "Yadav",
  "Kapoor",
  "Joshi",
  "Kulkarni",
  "Agarwal",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATIONS = ["Father", "Mother", "Brother", "Sister", "Spouse"];
const ALLERGIES = [
  "Dust allergy",
  "Pollen allergy",
  "Shellfish allergy",
  "Lactose intolerance",
  "Peanut allergy",
];
const CURRENT_MEDS = [
  "Paracetamol 650mg",
  "Vitamin D3 weekly",
  "Metformin 500mg",
  "Levocetirizine 5mg",
  "Pantoprazole 40mg",
];

const MEDICAL_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Migraine",
  "Asthma",
  "Hypothyroidism",
];

const MEDICATION_HISTORY = [
  { name: "Telmisartan", purpose: "Blood pressure control" },
  { name: "Metformin", purpose: "Blood sugar control" },
  { name: "Levothyroxine", purpose: "Thyroid support" },
  { name: "Montelukast", purpose: "Allergy and asthma support" },
  { name: "Vitamin B12", purpose: "Nutritional support" },
];

const ADDRESS_LABELS = ["home", "work", "other"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function pickDistinctCities(allCities, primaryName) {
  const remaining = allCities.filter((c) => c.name !== primaryName);
  const shuffled = [...remaining].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

function generatePincode(cityName, variant = 0) {
  if (cityName === "kanpur") return String(208001 + variant);
  if (cityName === "lucknow") return String(226001 + variant);
  if (cityName === "noida") return String(201301 + variant);
  if (cityName === "delhi") return String(110001 + variant);
  if (cityName === "mumbai") return String(400001 + variant);
  return String(100000 + randomInt(1000, 8999));
}

function formatCityName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function buildAddress(cityDoc, idx, label) {
  const cityName = cityDoc.name.toLowerCase();
  const cityTitle = formatCityName(cityName);
  const state = CITY_STATE_MAP[cityName] || "India";
  const sector = randomInt(1, 60);
  const building = randomInt(10, 999);

  return {
    label,
    street: `${building}, Sector ${sector}, ${cityTitle}`,
    city: cityTitle,
    cityId: cityDoc._id,
    state,
    country: "India",
    pincode: generatePincode(cityName, idx),
    landmark: `${cityTitle} ${label === "home" ? "Metro" : label === "work" ? "Business Park" : "Market"}`,
  };
}

function getGender(index) {
  return index % 2 === 0 ? "male" : "female";
}

function buildName(seedIndex, gender) {
  const first =
    gender === "male"
      ? pick(MALE_FIRST_NAMES, seedIndex)
      : pick(FEMALE_FIRST_NAMES, seedIndex);
  const last = pick(LAST_NAMES, seedIndex + 3);
  return `${first} ${last}`;
}

function generateUniquePhone(usedPhones, globalSeed) {
  // Indian 10-digit format starting with 9
  let attempt = 0;
  while (attempt < 10000) {
    const tail = String(100000000 + globalSeed * 337 + attempt).slice(-9);
    const phone = `9${tail}`;
    if (!usedPhones.has(phone)) {
      usedPhones.add(phone);
      return phone;
    }
    attempt += 1;
  }
  throw new Error("Unable to generate unique phone");
}

function generateUniqueEmail(usedEmails, fullName, cityName, globalSeed) {
  let attempt = 0;
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  while (attempt < 10000) {
    const email = `${base}.${cityName}.${globalSeed}.${attempt}@rehabmedico.in`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
    attempt += 1;
  }
  throw new Error("Unable to generate unique email");
}

function buildMedicalHistory(seedIndex) {
  return [
    {
      condition: pick(MEDICAL_CONDITIONS, seedIndex),
      diagnosedDate: new Date(2018 + (seedIndex % 5), seedIndex % 12, 5 + (seedIndex % 20)),
      severity: pick(["mild", "moderate", "severe"], seedIndex),
      status: pick(["active", "managed", "remission", "chronic"], seedIndex + 1),
      notes: "Regular follow-up advised.",
      addedBy: "doctor",
      addedAt: new Date(),
    },
  ];
}

function buildMedicationHistory(seedIndex, doctorId) {
  const med = pick(MEDICATION_HISTORY, seedIndex);
  return [
    {
      medicationName: med.name,
      dosage: "1 tablet",
      frequency: pick(
        ["daily", "twice-daily", "thrice-daily", "weekly", "as-needed"],
        seedIndex
      ),
      startDate: new Date(2024, seedIndex % 12, 1 + (seedIndex % 20)),
      endDate: null,
      duration: "Ongoing",
      purpose: med.purpose,
      prescribedBy: {
        doctorId: doctorId || undefined,
        doctorName: doctorId ? "Assigned Doctor" : "Consulting Doctor",
        datePrescribed: new Date(2024, seedIndex % 12, 2 + (seedIndex % 20)),
      },
      status: "active",
      sideEffects: "",
      notes: "Patient tolerating medication well.",
      addedAt: new Date(),
    },
  ];
}

function buildTreatmentProgress(seedIndex, doctorId, serviceId) {
  return [
    {
      appointmentId: undefined,
      serviceId: serviceId || undefined,
      doctorId: doctorId || undefined,
      visitDate: new Date(2025, seedIndex % 12, 3 + (seedIndex % 20)),
      diagnosis: pick(MEDICAL_CONDITIONS, seedIndex),
      recommendations: "Hydration, sleep hygiene, and regular exercise.",
      nextVisitDate: new Date(2026, (seedIndex + 1) % 12, 10 + (seedIndex % 10)),
      progressNotes: "Condition stable with current plan.",
      vitals: {
        bloodPressure: `${110 + (seedIndex % 20)}/${70 + (seedIndex % 15)}`,
        pulse: 70 + (seedIndex % 20),
        temperature: 98.2 + (seedIndex % 6) * 0.1,
        weight: 55 + (seedIndex % 25),
        bloodSugar: 92 + (seedIndex % 30),
      },
      labResults: "Routine blood work within normal limits.",
      updatedAt: new Date(),
    },
  ];
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const cities = await City.find({
    name: { $in: TARGET_CITIES },
  })
    .select("_id name latitude longitude")
    .lean();

  if (cities.length !== TARGET_CITIES.length) {
    const found = new Set(cities.map((c) => c.name));
    const missing = TARGET_CITIES.filter((name) => !found.has(name));
    throw new Error(`Missing required cities in DB: ${missing.join(", ")}`);
  }

  const cityByName = new Map(cities.map((c) => [c.name, c]));
  const allCityDocs = TARGET_CITIES.map((name) => cityByName.get(name));

  const [doctors, services, existingPatients] = await Promise.all([
    Doctor.find({ isActive: true }).select("_id").lean(),
    Service.find({ isActive: true }).select("_id").lean(),
    Patient.find({})
      .select("email phone")
      .lean(),
  ]);

  const doctorPool = doctors.map((d) => d._id);
  const servicePool = services.map((s) => s._id);

  const usedEmails = new Set(existingPatients.map((p) => (p.email || "").toLowerCase()));
  const usedPhones = new Set(existingPatients.map((p) => p.phone));

  const seededPatientIds = [];
  const summaryInserted = [];

  let globalSeed = Date.now() % 100000;

  for (const cityName of TARGET_CITIES) {
    const primaryCity = cityByName.get(cityName);

    for (let i = 0; i < PATIENTS_PER_CITY; i += 1) {
      globalSeed += 1;
      const gender = getGender(globalSeed);
      const fullName = buildName(globalSeed + i, gender);
      const email = generateUniqueEmail(usedEmails, fullName, cityName, globalSeed);
      const phone = generateUniquePhone(usedPhones, globalSeed);
      const doctorId = doctorPool.length ? doctorPool[globalSeed % doctorPool.length] : undefined;
      const serviceId = servicePool.length
        ? servicePool[globalSeed % servicePool.length]
        : undefined;

      const altCities = pickDistinctCities(allCityDocs, cityName);
      const addressDocs = [
        buildAddress(primaryCity, i, ADDRESS_LABELS[0]),
        buildAddress(altCities[0], i + 1, ADDRESS_LABELS[1]),
        buildAddress(altCities[1], i + 2, ADDRESS_LABELS[2]),
      ];

      const primaryAddress = addressDocs[0];

      const patient = await Patient.create({
        firstName: fullName,
        email,
        phone,
        password: "Patient@123",
        profilePhoto: null,
        dateOfBirth: new Date(1978 + (globalSeed % 25), globalSeed % 12, 1 + (globalSeed % 27)),
        gender,
        address: {
          street: primaryAddress.street,
          city: primaryAddress.city,
          cityId: primaryAddress.cityId,
          state: primaryAddress.state,
          country: primaryAddress.country,
          pincode: primaryAddress.pincode,
        },
        bloodGroup: pick(BLOOD_GROUPS, globalSeed),
        medicalHistory: buildMedicalHistory(globalSeed),
        medicationHistory: buildMedicationHistory(globalSeed, doctorId),
        treatmentProgress: buildTreatmentProgress(globalSeed, doctorId, serviceId),
        allergies: [pick(ALLERGIES, globalSeed), pick(ALLERGIES, globalSeed + 2)],
        currentMedications: [pick(CURRENT_MEDS, globalSeed)],
        emergencyContact: {
          name: `${pick(MALE_FIRST_NAMES, globalSeed + 7)} ${pick(LAST_NAMES, globalSeed + 9)}`,
          phone: generateUniquePhone(usedPhones, globalSeed + 20000),
          relation: pick(RELATIONS, globalSeed),
        },
        role: "patient",
        isVerified: true,
        isActive: true,
        tokenVersion: 0,
        refreshToken: null,
        following: [],
        followingCount: 0,
        savedPosts: [],
        mediaFiles: [
          {
            url: `https://cdn.rehabmedico.in/patients/${email.replace(/[^a-z0-9]/g, "")}/scan-1.jpg`,
            type: "image",
            uploadedAt: new Date(),
            uploadedBy: "doctor",
          },
        ],
      });

      const insertedAddresses = [];
      for (let a = 0; a < addressDocs.length; a += 1) {
        const addr = addressDocs[a];
        const row = await PatientAddress.create({
          patientId: patient._id,
          label: addr.label,
          street: addr.street,
          city: addr.city,
          cityId: addr.cityId,
          state: addr.state,
          country: addr.country,
          pincode: addr.pincode,
          landmark: addr.landmark,
          isPrimary: a === 0,
        });
        insertedAddresses.push(row);
      }

      const primary = insertedAddresses.find((a) => a.isPrimary);
      await Patient.findByIdAndUpdate(patient._id, {
        $set: {
          address: {
            street: primary.street,
            city: primary.city,
            cityId: primary.cityId,
            state: primary.state,
            country: primary.country,
            pincode: primary.pincode,
          },
        },
      });

      seededPatientIds.push(patient._id);
      summaryInserted.push({
        patientId: String(patient._id),
        name: patient.firstName,
        city: cityName,
        email: patient.email,
        phone: patient.phone,
      });
    }
  }

  const insertedPatients = await Patient.find({ _id: { $in: seededPatientIds } })
    .select("_id address.cityId")
    .lean();

  const countByCity = TARGET_CITIES.map((cityName) => {
    const city = cityByName.get(cityName);
    const count = insertedPatients.filter(
      (p) => String(p.address?.cityId) === String(city._id)
    ).length;
    return { city: cityName, count };
  });

  const allSeededAddresses = await PatientAddress.find({
    patientId: { $in: seededPatientIds },
  })
    .select("patientId isPrimary street city cityId state country pincode landmark")
    .lean();

  const addressCountByPatient = new Map();
  const primaryCountByPatient = new Map();
  const primaryByPatient = new Map();

  for (const addr of allSeededAddresses) {
    const id = String(addr.patientId);
    addressCountByPatient.set(id, (addressCountByPatient.get(id) || 0) + 1);
    if (addr.isPrimary) {
      primaryCountByPatient.set(id, (primaryCountByPatient.get(id) || 0) + 1);
      primaryByPatient.set(id, addr);
    }
  }

  const mismatches = [];
  for (const p of insertedPatients) {
    const id = String(p._id);
    const primary = primaryByPatient.get(id);
    if (!primary) {
      mismatches.push({ patientId: id, reason: "missing_primary_address" });
      continue;
    }
    if (String(primary.cityId) !== String(p.address?.cityId)) {
      mismatches.push({
        patientId: id,
        reason: "city_id_mismatch",
        patientCityId: String(p.address?.cityId || ""),
        primaryCityId: String(primary.cityId),
      });
    }
  }

  const invalidAddressCountPatients = [];
  const invalidPrimaryCountPatients = [];
  for (const id of seededPatientIds.map(String)) {
    if ((addressCountByPatient.get(id) || 0) !== 3) {
      invalidAddressCountPatients.push(id);
    }
    if ((primaryCountByPatient.get(id) || 0) !== 1) {
      invalidPrimaryCountPatients.push(id);
    }
  }

  const uniqueEmailCount = new Set(summaryInserted.map((x) => x.email.toLowerCase())).size;
  const uniquePhoneCount = new Set(summaryInserted.map((x) => x.phone)).size;

  const cityIdsSet = new Set(allCityDocs.map((c) => String(c._id)));
  const invalidCityRefCount = allSeededAddresses.filter(
    (a) => !cityIdsSet.has(String(a.cityId))
  ).length;

  console.log(
    "SEED_PATIENTS_SUMMARY",
    JSON.stringify(
      {
        insertedPatientCount: seededPatientIds.length,
        sampleInsertedPatients: summaryInserted.slice(0, 10),
        perCityPrimaryAddressCount: countByCity,
        totalPatientAddressRows: allSeededAddresses.length,
        uniqueEmailCount,
        uniquePhoneCount,
        patientsWithInvalidAddressCount: invalidAddressCountPatients.length,
        patientsWithInvalidPrimaryCount: invalidPrimaryCountPatients.length,
        primaryAddressSyncMismatchCount: mismatches.length,
        invalidCityReferenceCount: invalidCityRefCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("SEED_PATIENTS_WITH_ADDRESSES_ERR", err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
