const express = require("express");
const { protect } = require("../middleware/auth");
const medicalRecordController = require("../controller/medicalRecordController");

const router = express.Router();

router.post("/createMedicalRecord", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), medicalRecordController.createMedicalRecord);
router.get("/getPatientRecords/:patientId", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.getPatientRecords);
router.get("/getMyRecords", protect("patient", "doctor", "admin", "superadmin", "subadmin"), medicalRecordController.getMyRecords);
router.patch("/updateMedicalRecord/:id", protect("patient", "doctor", "admin", "superadmin", "subadmin","serviceprovider"), medicalRecordController.updateMedicalRecord);
router.post("/shareMedicalRecord/:id/share", protect("patient", "doctor", "admin", "superadmin", "subadmin"), medicalRecordController.shareMedicalRecord);
router.delete("/deleteMedicalRecord/:id", protect("patient", "doctor", "admin", "superadmin", "subadmin"), medicalRecordController.deleteMedicalRecord);

module.exports = router;
