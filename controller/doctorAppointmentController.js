const mongoose = require("mongoose");
const DoctorAppointment = require("../models/doctorAppointmentModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const City = require("../models/availableCities");

const toMinutes = (time) => {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return hours * 60 + minutes;
};

const resolveDuration = (startTime, endTime, duration) => {
  const explicitDuration = Number(duration || 0);
  if (explicitDuration > 0) return explicitDuration;

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || end <= start) return 30;

  return end - start;
};

exports.createDoctorAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const loggedInDoctorId = req.user?.id || req.user?._id;
    const {
      doctorId: requestedDoctorId,
      patientId,
      previousAppointmentId,
      appointmentDate,
      startTime,
      endTime,
      duration,
      notes,
      cityId,
    } = req.body;

    const doctorId = requestedDoctorId || loggedInDoctorId;

    if (!doctorId || String(doctorId) !== String(loggedInDoctorId)) {
      return res.status(403).json({
        success: false,
        message: "Doctors can schedule appointments only for themselves",
      });
    }

    if (!patientId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "patientId, appointmentDate, startTime and endTime required",
      });
    }

    await session.startTransaction();
    transactionStarted = true;

    const doctor = await Doctor.findById(doctorId)
      .select("firstName lastName email phone specialization isActive")
      .session(session);
    if (!doctor || doctor.isActive === false) {
      throw new Error("Doctor not found or inactive");
    }

    const patient = await Patient.findById(patientId)
      .select("firstName phone address.cityId")
      .session(session);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const bookingCityId = cityId || patient.address?.cityId || null;
    const bookingCity = bookingCityId
      ? await City.findById(bookingCityId).session(session)
      : null;
    if (bookingCityId && !bookingCity?.isActive) {
      throw new Error("Invalid or inactive city");
    }

    let previousAppointment = null;
    if (previousAppointmentId) {
      previousAppointment = await DoctorAppointment.findById(previousAppointmentId).session(session);
      if (!previousAppointment || previousAppointment.isDeleted) {
        throw new Error("Previous appointment not found");
      }
      if (String(previousAppointment.doctorId) !== String(doctorId)) {
        throw new Error("Previous appointment does not belong to this doctor");
      }
      if (String(previousAppointment.patientId) !== String(patientId)) {
        throw new Error("Previous appointment patient does not match");
      }
      if (!["Completed", "TreatmentCompleted"].includes(previousAppointment.status)) {
        throw new Error(
          `Previous appointment must be completed first (current: "${previousAppointment.status}")`
        );
      }
    }

    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointment = await DoctorAppointment.findOne({
      doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": startTime,
      "slotTime.endTime": endTime,
      isDeleted: false,
    }).session(session);

    if (existingAppointment) {
      throw new Error("Your slot is already booked");
    }

    const appointmentDuration = resolveDuration(startTime, endTime, duration);
    const appointment = new DoctorAppointment({
      patientId,
      doctorId,
      previousAppointmentId: previousAppointment?._id || null,
      sessionNumber: previousAppointment
        ? Number(previousAppointment.sessionNumber || 1) + 1
        : 1,
      appointmentDate: new Date(appointmentDate),
      slotTime: { startTime, endTime },
      duration: appointmentDuration,
      status: "Pending",
      notes:
        notes ||
        (previousAppointment
          ? `Next doctor appointment after completed appointment ${previousAppointmentId}`
          : ""),
      city: bookingCity?._id || null,
      treatmentFlow: Boolean(previousAppointment),
      createdBy: {
        userId: doctorId,
        userModel: "Doctor",
      },
    });

    await appointment.save({ session });

    if (previousAppointment) {
      previousAppointment.nextAppointmentId = appointment._id;
      await previousAppointment.save({ session });
    }

    await session.commitTransaction();

    const populatedAppointment = await DoctorAppointment.findById(appointment._id)
      .populate("doctorId", "firstName lastName email phone specialization")
      .populate("patientId", "firstName phone")
      .populate("city", "name")
      .populate("previousAppointmentId", "appointmentDate status")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Doctor appointment created successfully",
      data: {
        appointment: populatedAppointment,
        flow: previousAppointment ? "completed-to-next-doctor-appointment" : "new-doctor-appointment",
      },
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await session.abortTransaction();
      } catch (rollbackError) {
        console.error("Doctor appointment rollback failed:", rollbackError);
      }
    }

    const clientError =
      error.message.includes("not found") ||
      error.message.includes("inactive") ||
      error.message.includes("already booked") ||
      error.message.includes("required") ||
      error.message.includes("completed") ||
      error.message.includes("does not belong") ||
      error.message.includes("does not match");

    if (clientError) {
      return res.status(error.message.includes("booked") ? 409 : 400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Doctor appointment create error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create doctor appointment",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

exports.getMyDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.user?._id;
    const { status, patientId, page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = { doctorId, isDeleted: false };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;

    const [appointments, total] = await Promise.all([
      DoctorAppointment.find(query)
        .populate("patientId", "firstName phone")
        .populate("city", "name")
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      DoctorAppointment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor appointments",
      error: error.message,
    });
  }
};
