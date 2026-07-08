const express = require("express");
const { protect } = require("../middleware/auth");
const callbackRequestController = require("../controller/callbackRequestController");

const router = express.Router();

router.post(
  "/",
  protect("patient"),
  callbackRequestController.createCallbackRequest
);

router.get(
  "/my-requests",
  protect("patient"),
  callbackRequestController.getMyCallbackRequests
);

router.get(
  "/doctor/my-requests",
  protect("doctor"),
  callbackRequestController.getDoctorCallbackRequests
);

router.get(
  "/doctor/:doctorId",
  protect("doctor", "admin", "superadmin", "subadmin"),
  callbackRequestController.getDoctorCallbackRequests
);

router.get(
  "/admin/all",
  protect("admin", "superadmin", "subadmin"),
  callbackRequestController.getAllCallbackRequests
);

router.patch(
  "/:id/status",
  protect("doctor", "admin", "superadmin", "subadmin"),
  callbackRequestController.updateCallbackRequestStatus
);

module.exports = router;
