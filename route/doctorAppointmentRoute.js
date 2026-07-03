const express = require("express");
const { protect } = require("../middleware/auth");
const doctorAppointmentController = require("../controller/doctorAppointmentController");

const router = express.Router();

router.post(
  "/create",
  protect("patient","doctor"),
  doctorAppointmentController.createDoctorAppointment
);

router.get(
  "/my-appointments",
  protect("patient","doctor"),
  doctorAppointmentController.getMyPatientDoctorAppointments
);

router.get(
  "/doctor/my-appointments",
  protect("doctor"),
  doctorAppointmentController.getMyDoctorAppointments
);

router.get(
  "/doctor/patient-history/:patientId",
  protect("doctor"),
  doctorAppointmentController.getDoctorPatientHistory
);

router.get(
  "/doctor/my-patients",
  protect("doctor"),
  doctorAppointmentController.getMyDoctorPatients
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
  "/:appointmentId/reschedule",
  protect("doctor"),
  doctorAppointmentController.rescheduleDoctorAppointment
);

router.put(
  "/:appointmentId/cancel",
  protect("patient"),
  doctorAppointmentController.cancelMyDoctorAppointment
);

module.exports = router;
