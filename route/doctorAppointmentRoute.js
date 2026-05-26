const express = require("express");
const { protect } = require("../middleware/auth");
const doctorAppointmentController = require("../controller/doctorAppointmentController");

const router = express.Router();

router.post(
  "/create",
  protect("patient"),
  doctorAppointmentController.createDoctorAppointment
);

router.get(
  "/my-appointments",
  protect("patient"),
  doctorAppointmentController.getMyPatientDoctorAppointments
);

router.get(
  "/doctor/my-appointments",
  protect("doctor"),
  doctorAppointmentController.getMyDoctorAppointments
);

router.get(
  "/:appointmentId",
  protect("patient", "doctor"),
  doctorAppointmentController.getDoctorAppointmentById
);

router.patch(
  "/:appointmentId/status",
  protect("doctor"),
  doctorAppointmentController.updateDoctorAppointmentStatus
);

router.put(
  "/:appointmentId/cancel",
  protect("patient"),
  doctorAppointmentController.cancelMyDoctorAppointment
);

module.exports = router;
