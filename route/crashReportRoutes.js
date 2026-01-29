const express = require("express");
const router = express.Router();
const crashController = require("../controller/crashController");

router.post("/create", crashController.createCrashReport);
router.get("/get", crashController.getCrashReports);
router.get("/get/:crashId", crashController.getSingleCrashReport);

module.exports = router;
