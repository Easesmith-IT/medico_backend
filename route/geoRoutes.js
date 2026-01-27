const express = require("express");
const router = express.Router();
const geoController = require("../controller/geoController");

router.post("/check-location", geoController.checkAddressInPolygon);

module.exports = router;






