require("dotenv").config();

const mongoose = require("mongoose");
const DoctorSpecialty = require("../models/doctorSpecialtyModel");

const specialties = [
  {
    key: "heart",
    name: "Heart",
    specialization: "Cardiology",
    aliases: ["Cardiologist", "Heart Specialist"],
    icon: "heart",
    description: "Heart specialist doctors",
    order: 1,
    isActive: true,
    isDeleted: false,
  },
  {
    key: "dental",
    name: "Dental",
    specialization: "Dentist",
    aliases: ["Dental Surgeon"],
    icon: "tooth",
    description: "Dental care doctors",
    order: 2,
    isActive: true,
    isDeleted: false,
  },
  {
    key: "brain",
    name: "Brain",
    specialization: "Neurology",
    aliases: ["Neurologist"],
    icon: "brain",
    description: "Brain and nervous system specialists",
    order: 3,
    isActive: true,
    isDeleted: false,
  },
  {
    key: "stomach",
    name: "Stomach",
    specialization: "Gastroenterology",
    aliases: ["Gastroenterologist"],
    icon: "stomach",
    description: "Stomach and digestive health specialists",
    order: 4,
    isActive: true,
    isDeleted: false,
  },
  {
    key: "lung",
    name: "Lung",
    specialization: "Pulmonology",
    aliases: ["Pulmonologist"],
    icon: "lungs",
    description: "Lung and respiratory specialists",
    order: 5,
    isActive: true,
    isDeleted: false,
  },
  {
    key: "mental",
    name: "Mental",
    specialization: "Psychiatry",
    aliases: ["Psychiatrist", "Mental Health"],
    icon: "brain-circuit",
    description: "Mental health specialist doctors",
    order: 6,
    isActive: true,
    isDeleted: false,
  },
];

async function seedDoctorSpecialties() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const result = await DoctorSpecialty.bulkWrite(
    specialties.map((specialty) => ({
      updateOne: {
        filter: { key: specialty.key },
        update: { $set: specialty },
        upsert: true,
      },
    })),
  );

  const count = await DoctorSpecialty.countDocuments({ isDeleted: false });

  console.log(
    `Doctor specialties seeded. matched=${result.matchedCount} modified=${result.modifiedCount} upserted=${result.upsertedCount} total=${count}`,
  );
}

seedDoctorSpecialties()
  .catch((error) => {
    console.error("Doctor specialties seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
