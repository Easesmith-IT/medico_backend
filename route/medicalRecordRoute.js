const express = require("express");
const { protect } = require("../middleware/auth");
const medicalRecordController = require("../controller/medicalRecordController");

const router = express.Router();

router.post("/createMedicalRecord", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), medicalRecordController.createMedicalRecord);
router.get("/getPatientRecords/:patientId", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.getPatientRecords);
router.get("/getMyRecords", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.getMyRecords);
router.patch("/updateMedicalRecord/:id", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.updateMedicalRecord);
router.post("/shareMedicalRecord/:id/share", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.shareMedicalRecord);
router.delete("/deleteMedicalRecord/:id", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.deleteMedicalRecord);
router.get("/appointment/:appointmentId", protect("patient", "doctor", "admin", "superadmin", "subadmin"), medicalRecordController.getRecordsByAppointmentId);
router.get("/prescriptions/appointment/:appointmentId", protect("patient", "doctor", "admin", "superadmin", "subadmin"), medicalRecordController.getPrescriptionsByAppointmentId);

module.exports = router;
