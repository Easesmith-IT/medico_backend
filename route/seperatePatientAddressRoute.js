const express = require("express");
const seperateAddressController= require("../controller/seperateAddressPatient");
const { protect } = require("../middleware/auth");

const router = express.Router();





router.get("/getMyAddress", protect(),seperateAddressController.getMyAddresses);
router.post("/addPatientAddress",  protect(),seperateAddressController.addPatientAddress);
// router.patch("/updatePatientAddress", protect(),seperateAddressController.updatePatientAddress);
// router.delete("/deletePatientAddress/:addressId", seperateAddressController.deletePatientAddress);


router.patch(
  "/updatePatientAddress/:addressId",
  protect(),
  seperateAddressController.updatePatientAddress
);

router.delete(
  "/deletePatientAddress/:addressId",
  protect(),
  seperateAddressController.deletePatientAddress
);
router.patch("/setPrimaryAddress/:addressId/set-primary", seperateAddressController.setPrimaryAddress);

module.exports = router;