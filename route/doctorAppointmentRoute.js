const express = require("express");
const { protect } = require("../middleware/auth");
const doctorAppointmentController = require("../controller/doctorAppointmentController");

const router = express.Router();

router.post(
  "/create",
  protect("doctor"),
  doctorAppointmentController.createDoctorAppointment
);

router.get(
  "/my-appointments",
  protect("doctor"),
  doctorAppointmentController.getMyDoctorAppointments
);

module.exports = router;
