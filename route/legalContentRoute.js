const express = require("express");

const legalContentController = require("../controller/legalContentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/privacy-policy", legalContentController.getPrivacyPolicy);
router.patch(
  "/privacy-policy",
  protect("admin", "superadmin", "subadmin"),
  legalContentController.updatePrivacyPolicy
);

router.get("/terms-and-conditions", legalContentController.listTermsAndConditions);
router.get(
  "/terms-and-conditions/:audience",
  legalContentController.getTermsAndConditions
);
router.patch(
  "/terms-and-conditions/:audience",
  protect("admin", "superadmin", "subadmin", "patient", "doctor", "serviceprovider"),
  legalContentController.updateTermsAndConditions
);

module.exports = router;
