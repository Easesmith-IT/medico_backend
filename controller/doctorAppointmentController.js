const mongoose = require("mongoose");
const DoctorAppointment = require("../models/doctorAppointmentModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const City = require("../models/availableCities");
const { calculateAdjustedFee } = require("../utils/feeCalculator");

const ACTIVE_STATUSES = [
  "Pending",
  "Approved",
  "Rescheduled",
  "In-Progress",
  "Confirmed",
  "Started",
];

const COMPLETED_STATUSES = ["Completed", "TreatmentCompleted"];
const CANCELLED_STATUSES = ["Cancelled", "Rejected"];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const toMinutes = (time) => {
  const parts = String(time || "").split(":").map(Number);
  if (parts.length !== 2) return null;

  const [hours, minutes] = parts;
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const getDayRange = (date) => {
  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime())) return null;

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const resolveDuration = (startTime, endTime, duration) => {
  const explicitDuration = Number(duration || 0);
  if (explicitDuration > 0) return explicitDuration;

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || end <= start) return 30;

  return end - start;
};

const normalizeDay = (day) => String(day || "").trim().toLowerCase();

const getDayName = (date) => DAY_NAMES[new Date(date).getDay()];

const isTimeInsideRange = (startTime, endTime, range) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const rangeStart = toMinutes(range?.start || range?.startTime);
  const rangeEnd = toMinutes(range?.end || range?.endTime);

  if (start === null || end === null || rangeStart === null || rangeEnd === null) {
    return false;
  }

  return start >= rangeStart && end <= rangeEnd;
};

const hasTimeOverlap = (startTime, endTime, rangeStartTime, rangeEndTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const rangeStart = toMinutes(rangeStartTime);
  const rangeEnd = toMinutes(rangeEndTime);

  if (start === null || end === null || rangeStart === null || rangeEnd === null) {
    return false;
  }

  return start < rangeEnd && end > rangeStart;
};

const buildListQuery = (baseQuery, queryParams) => {
  const { status, patientId, doctorId, fromDate, toDate } = queryParams;
  const query = { ...baseQuery, isDeleted: false };

  if (status) query.status = status;
  if (patientId && !baseQuery.patientId) query.patientId = patientId;
  if (doctorId && !baseQuery.doctorId) query.doctorId = doctorId;

  if (fromDate || toDate) {
    query.appointmentDate = {};
    if (fromDate) query.appointmentDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.appointmentDate.$lte = end;
    }
  }

  return query;
};

const listAppointments = async (baseQuery, req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const query = buildListQuery(baseQuery, req.query);

  const [appointments, total] = await Promise.all([
    DoctorAppointment.find(query)
      .populate("doctorId", "firstName lastName email phone specialization consultationFees")
      .populate("patientId", "firstName lastName email phone mobile profilePhoto")
      .populate("city", "name")
      .populate("previousAppointmentId", "appointmentDate status")
      .populate("nextAppointmentId", "appointmentDate status")
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
};

const reserveDoctorSlot = async ({
  doctorId,
  appointmentId,
  dayStart,
  dayEnd,
  startTime,
  endTime,
}) => {
  return Doctor.findOneAndUpdate(
    {
      _id: doctorId,
      availability: {
        $exists: true,
      },
      "availability.dailySlots": {
        $elemMatch: {
          date: { $gte: dayStart, $lte: dayEnd },
          slots: {
            $elemMatch: {
              startTime,
              endTime,
              isBooked: { $ne: true },
              isSlotAvailable: { $ne: false },
              status: "available",
            },
          },
        },
      },
    },
    {
      $set: {
        "availability.dailySlots.$[day].slots.$[slot].isBooked": true,
        "availability.dailySlots.$[day].slots.$[slot].isSlotAvailable": false,
        "availability.dailySlots.$[day].slots.$[slot].status": "booked",
        "availability.dailySlots.$[day].slots.$[slot].bookingId": appointmentId,
        "availability.dailySlots.$[day].slots.$[slot].doctorAppointmentId": appointmentId,
      },
    },
    {
      new: true,
      arrayFilters: [
        { "day.date": { $gte: dayStart, $lte: dayEnd } },
        {
          "slot.startTime": startTime,
          "slot.endTime": endTime,
          "slot.isBooked": { $ne: true },
          "slot.isSlotAvailable": { $ne: false },
          "slot.status": "available",
        },
      ],
      select: "firstName lastName email phone specialization consultationFees availability",
    }
  );
};

const reserveDoctorSlotFromWeeklyAvailability = async ({
  doctorId,
  appointmentId,
  dayStart,
  dayEnd,
  startTime,
  endTime,
  duration,
}) => {
  const doctor = await Doctor.findById(doctorId).select(
    "firstName lastName email phone specialization consultationFees availability"
  );

  if (!doctor) return null;

  if (!doctor.availability || typeof doctor.availability !== "object") {
    return null;
  }

  const appointmentDay = getDayName(dayStart);
  const availableDays = Array.isArray(doctor.availability.days)
    ? doctor.availability.days
    : [];
  const timeSlots = Array.isArray(doctor.availability.timeSlots)
    ? doctor.availability.timeSlots
    : [];

  const isDayAvailable = availableDays
    .map(normalizeDay)
    .includes(normalizeDay(appointmentDay));
  const isTimeAvailable = timeSlots.some((range) =>
    isTimeInsideRange(startTime, endTime, range)
  );

  if (!isDayAvailable || !isTimeAvailable) return null;

  if (!Array.isArray(doctor.availability.dailySlots)) {
    doctor.availability.dailySlots = [];
  }

  let dailySlot = doctor.availability.dailySlots.find((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= dayStart && itemDate <= dayEnd;
  });

  if (!dailySlot) {
    dailySlot = {
      date: dayStart,
      dayOfWeek: appointmentDay,
      isAvailable: true,
      slots: [],
      breakTimes: [],
    };
    doctor.availability.dailySlots.push(dailySlot);
  }

  if (dailySlot.isAvailable === false) return null;

  if (!Array.isArray(dailySlot.breakTimes)) {
    dailySlot.breakTimes = [];
  }

  const overlapsBreak = dailySlot.breakTimes.some((breakTime) =>
    hasTimeOverlap(startTime, endTime, breakTime.startTime, breakTime.endTime)
  );
  if (overlapsBreak) return null;

  if (!Array.isArray(dailySlot.slots)) {
    dailySlot.slots = [];
  }

  const existingSlot = dailySlot.slots.find(
    (slot) => slot.startTime === startTime && slot.endTime === endTime
  );

  if (existingSlot) {
    if (
      existingSlot.isBooked ||
      existingSlot.isSlotAvailable === false ||
      existingSlot.status === "booked" ||
      existingSlot.status === "blocked"
    ) {
      return null;
    }

    existingSlot.isBooked = true;
    existingSlot.isSlotAvailable = false;
    existingSlot.status = "booked";
    existingSlot.bookingId = appointmentId;
    existingSlot.doctorAppointmentId = appointmentId;
  } else {
    dailySlot.slots.push({
      startTime,
      endTime,
      duration,
      isBooked: true,
      isSlotAvailable: false,
      bookingId: appointmentId,
      doctorAppointmentId: appointmentId,
      status: "booked",
    });
  }

  doctor.markModified("availability.dailySlots");
  await doctor.save();
  return doctor;
};

const releaseDoctorSlot = async ({ doctorId, appointmentId, appointmentDate, startTime, endTime }) => {
  const dayRange = getDayRange(appointmentDate);
  if (!dayRange) return;

  await Doctor.updateOne(
    { _id: doctorId },
    {
      $set: {
        "availability.dailySlots.$[day].slots.$[slot].isBooked": false,
        "availability.dailySlots.$[day].slots.$[slot].isSlotAvailable": true,
        "availability.dailySlots.$[day].slots.$[slot].status": "available",
      },
      $unset: {
        "availability.dailySlots.$[day].slots.$[slot].bookingId": "",
        "availability.dailySlots.$[day].slots.$[slot].doctorAppointmentId": "",
      },
    },
    {
      arrayFilters: [
        { "day.date": { $gte: dayRange.start, $lte: dayRange.end } },
        {
          "slot.startTime": startTime,
          "slot.endTime": endTime,
          "slot.doctorAppointmentId": appointmentId,
        },
      ],
    }
  );
};

const reserveSlotForAppointment = async ({
  doctorId,
  appointmentId,
  dayRange,
  startTime,
  endTime,
  duration,
}) => {
  let reservedDoctor = await reserveDoctorSlot({
    doctorId,
    appointmentId,
    dayStart: dayRange.start,
    dayEnd: dayRange.end,
    startTime,
    endTime,
  });

  if (!reservedDoctor) {
    reservedDoctor = await reserveDoctorSlotFromWeeklyAvailability({
      doctorId,
      appointmentId,
      dayStart: dayRange.start,
      dayEnd: dayRange.end,
      startTime,
      endTime,
      duration,
    });
  }

  return reservedDoctor;
};

exports.createDoctorAppointment = async (req, res) => {
  const appointmentId = new mongoose.Types.ObjectId();
  let slotReserved = false;

  try {
    const loggedInUserId = req.user?.id || req.user?._id;
    const userRole = String(req.user?.role || "").toLowerCase().replace(/[_\s]/g, "");
    const {
      doctorId: requestedDoctorId,
      patientId: requestedPatientId,
      previousAppointmentId,
      appointmentDate,
      startTime,
      endTime,
      duration,
      notes,
      cityId,
      serviceType,
      mode,
    } = req.body || {};

    const isDoctorRequest = userRole === "doctor";
    const isPatientRequest = userRole === "patient";
    const patientId = isDoctorRequest ? requestedPatientId : loggedInUserId;
    const doctorId = isDoctorRequest ? loggedInUserId : requestedDoctorId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: isDoctorRequest
          ? "patientId is required for doctor-created appointments"
          : "Patient ID not found in token",
      });
    }

    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "doctorId, appointmentDate, startTime and endTime are required",
      });
    }

    if (isDoctorRequest && requestedDoctorId && String(requestedDoctorId) !== String(loggedInUserId)) {
      return res.status(403).json({
        success: false,
        message: "Doctors can create appointments only for themselves",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId",
      });
    }

        const dayRange = getDayRange(appointmentDate);
    if (!dayRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointmentDate",
      });
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "Invalid startTime or endTime",
      });
    }

    const [patient, doctor] = await Promise.all([
      Patient.findById(patientId).select("firstName lastName phone address.cityId"),
      Doctor.findById(doctorId).select(
        "firstName lastName email phone specialization consultationFees isActive availability currency feeAdjustments"
      ),
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!doctor || doctor.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or inactive",
      });
    }

    const existingAppointment = await DoctorAppointment.findOne({
      doctorId,
      appointmentDate: { $gte: dayRange.start, $lte: dayRange.end },
      status: { $in: ACTIVE_STATUSES },
      "slotTime.startTime": startTime,
      "slotTime.endTime": endTime,
      isDeleted: false,
    }).lean();

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This doctor slot is already booked. Choose another slot.",
      });
    }

    let previousAppointment = null;
    if (previousAppointmentId) {
      previousAppointment = await DoctorAppointment.findOne({
        _id: previousAppointmentId,
        patientId,
        doctorId,
        isDeleted: false,
      });

      if (!previousAppointment) {
        return res.status(404).json({
          success: false,
          message: "Previous doctor appointment not found",
        });
      }

      if (!COMPLETED_STATUSES.includes(previousAppointment.status)) {
        return res.status(400).json({
          success: false,
          message: `Previous appointment must be completed first (current: "${previousAppointment.status}")`,
        });
      }
    }

    const bookingCityId = cityId || patient.address?.cityId || null;
    let bookingCity = null;
    if (bookingCityId) {
      bookingCity = await City.findById(bookingCityId);
      if (!bookingCity || bookingCity.isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive city",
        });
      }
    }

    const dailySlot = doctor.availability?.dailySlots?.find(
      ds => new Date(ds.date).toDateString() === new Date(appointmentDate).toDateString()
    );
    const finalFees = calculateAdjustedFee(doctor, appointmentDate, startTime, dailySlot);

    const appointmentDuration = resolveDuration(startTime, endTime, duration);
    const reservedDoctor = await reserveSlotForAppointment({
      doctorId,
      appointmentId,
      dayRange,
      startTime,
      endTime,
      duration: appointmentDuration,
    });
    slotReserved = Boolean(reservedDoctor);

    const appointment = await DoctorAppointment.create({
      _id: appointmentId,
      patientId,
      doctorId,
      previousAppointmentId: previousAppointment?._id || null,
      sessionNumber: previousAppointment
        ? Number(previousAppointment.sessionNumber || 1) + 1
        : 1,
      appointmentDate: new Date(appointmentDate),
      slotTime: { startTime, endTime },
      duration: appointmentDuration,
      serviceType: serviceType || "",
      mode: mode || "",
      consultationFees: Number(finalFees || 0),
      currency: doctor.currency || "INR",
      status: "Pending",
      notes: notes || "",
      city: bookingCity?._id || null,
      treatmentFlow: Boolean(previousAppointment),
      createdBy: {
        userId: loggedInUserId,
        userModel: isDoctorRequest ? "Doctor" : "Patient",
      },
    });
    slotReserved = false;

    if (previousAppointment) {
      try {
        previousAppointment.nextAppointmentId = appointment._id;
        await previousAppointment.save();
      } catch (linkError) {
        console.error("Failed to link previous doctor appointment:", linkError);
      }
    }

    const populatedAppointment = await DoctorAppointment.findById(appointment._id)
      .populate("doctorId", "firstName lastName email phone specialization consultationFees")
      .populate("patientId", "firstName lastName email phone mobile profilePhoto")
      .populate("city", "name")
      .populate("previousAppointmentId", "appointmentDate status")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Doctor appointment booked successfully",
      data: {
        appointment: populatedAppointment,
        flow: previousAppointment ? "follow-up-doctor-appointment" : "new-doctor-appointment",
      },
    });
  } catch (error) {
    if (slotReserved) {
      await releaseDoctorSlot({
        doctorId: req.body?.doctorId,
        appointmentId,
        appointmentDate: req.body?.appointmentDate,
        startTime: req.body?.startTime,
        endTime: req.body?.endTime,
      });
    }

    console.error("Doctor appointment create error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create doctor appointment",
      error: error.message,
    });
  }
};

exports.getMyPatientDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userRole = String(req.user?.role || "").toLowerCase().replace(/[_\s]/g, "");
    if (userRole === "doctor") {
      return listAppointments({ doctorId: userId }, req, res);
    }

    const patientId = userId;
    return listAppointments({ patientId }, req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient doctor appointments",
      error: error.message,
    });
  }
};

exports.getMyDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.user?._id;
    return listAppointments({ doctorId }, req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor appointments",
      error: error.message,
    });
  }
};

exports.getDoctorAppointmentById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const role = String(req.user?.role || "").toLowerCase().replace(/[_\s]/g, "");
    const appointmentId = req.params.appointmentId || req.params.id;

    const query = { _id: appointmentId, isDeleted: false };
    if (role === "patient") query.patientId = userId;
    if (role === "doctor") query.doctorId = userId;

    const appointment = await DoctorAppointment.findOne(query)
      .populate("doctorId", "firstName lastName email phone specialization consultationFees")
      .populate("patientId", "firstName lastName email phone mobile profilePhoto")
      .populate("city", "name")
      .populate("previousAppointmentId", "appointmentDate status")
      .populate("nextAppointmentId", "appointmentDate status")
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Doctor appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor appointment",
      error: error.message,
    });
  }
};

exports.updateDoctorAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.user?._id;
    const appointmentId = req.params.appointmentId || req.params.id;
    const { status, statusReason } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Rescheduled",
      "Cancellation Requested",
      "Cancelled",
      "In-Progress",
      "Completed",
      "TreatmentCompleted",
      "Confirmed",
      "Started",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      doctorId,
      isDeleted: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Doctor appointment not found or not assigned to you",
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    if (statusReason !== undefined) appointment.statusReason = statusReason;
    await appointment.save();

    if (
      !CANCELLED_STATUSES.includes(oldStatus) &&
      CANCELLED_STATUSES.includes(status)
    ) {
      await releaseDoctorSlot({
        doctorId,
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.slotTime.startTime,
        endTime: appointment.slotTime.endTime,
      });
    }

    const populatedAppointment = await DoctorAppointment.findById(appointment._id)
      .populate("doctorId", "firstName lastName email phone specialization consultationFees")
      .populate("patientId", "firstName lastName email phone mobile profilePhoto")
      .populate("city", "name")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Doctor appointment status updated successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update doctor appointment status",
      error: error.message,
    });
  }
};

exports.rescheduleDoctorAppointment = async (req, res) => {
  const doctorId = req.user?.id || req.user?._id;
  const appointmentId = req.params.appointmentId || req.params.id;
  let newSlotReserved = false;
  let oldSlotReleased = false;
  let oldSlot = null;
  let newSlot = null;

  try {
    const { appointmentDate, startTime, endTime, duration, notes, statusReason } = req.body || {};

    if (!appointmentId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "appointmentId, appointmentDate, startTime and endTime are required",
      });
    }

    const dayRange = getDayRange(appointmentDate);
    if (!dayRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointmentDate",
      });
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "Invalid startTime or endTime",
      });
    }

    const appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      doctorId,
      isDeleted: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Doctor appointment not found or not assigned to you",
      });
    }

    if (CANCELLED_STATUSES.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule cancelled or rejected doctor appointments",
      });
    }

    const conflict = await DoctorAppointment.findOne({
      _id: { $ne: appointment._id },
      doctorId,
      appointmentDate: { $gte: dayRange.start, $lte: dayRange.end },
      status: { $in: ACTIVE_STATUSES },
      "slotTime.startTime": startTime,
      "slotTime.endTime": endTime,
      isDeleted: false,
    }).lean();

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "The selected doctor slot is already booked. Choose another slot.",
      });
    }

    oldSlot = {
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.slotTime.startTime,
      endTime: appointment.slotTime.endTime,
    };
    newSlot = {
      appointmentDate,
      startTime,
      endTime,
    };

    const appointmentDuration = resolveDuration(startTime, endTime, duration);
    const reservedDoctor = await reserveSlotForAppointment({
      doctorId,
      appointmentId: appointment._id,
      dayRange,
      startTime,
      endTime,
      duration: appointmentDuration,
    });
    newSlotReserved = Boolean(reservedDoctor);

    appointment.appointmentDate = new Date(appointmentDate);
    appointment.slotTime = { startTime, endTime };
    appointment.duration = appointmentDuration;
    appointment.status = "Rescheduled";
    if (notes !== undefined) appointment.notes = notes;
    if (statusReason !== undefined) appointment.statusReason = statusReason;
    await appointment.save();

    await releaseDoctorSlot({
      doctorId,
      appointmentId: appointment._id,
      appointmentDate: oldSlot.appointmentDate,
      startTime: oldSlot.startTime,
      endTime: oldSlot.endTime,
    });
    oldSlotReleased = true;

    const populatedAppointment = await DoctorAppointment.findById(appointment._id)
      .populate("doctorId", "firstName lastName email phone specialization consultationFees")
      .populate("patientId", "firstName lastName email phone mobile profilePhoto")
      .populate("city", "name")
      .populate("previousAppointmentId", "appointmentDate status")
      .populate("nextAppointmentId", "appointmentDate status")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Doctor appointment rescheduled successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    if (newSlotReserved && newSlot) {
      await releaseDoctorSlot({
        doctorId,
        appointmentId,
        appointmentDate: newSlot.appointmentDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
      });
    }

    if (oldSlotReleased && oldSlot) {
      const oldDayRange = getDayRange(oldSlot.appointmentDate);
      if (oldDayRange) {
        await reserveSlotForAppointment({
          doctorId,
          appointmentId,
          dayRange: oldDayRange,
          startTime: oldSlot.startTime,
          endTime: oldSlot.endTime,
          duration: resolveDuration(oldSlot.startTime, oldSlot.endTime),
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to reschedule doctor appointment",
      error: error.message,
    });
  }
};

exports.cancelMyDoctorAppointment = async (req, res) => {
  try {
    const patientId = req.user?.id || req.user?._id;
    const appointmentId = req.params.appointmentId || req.params.id;
    const { reason } = req.body || {};

    const appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      patientId,
      isDeleted: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Doctor appointment not found",
      });
    }

    if (CANCELLED_STATUSES.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "Doctor appointment is already cancelled or rejected",
      });
    }

    appointment.status = "Cancelled";
    appointment.statusReason = reason || "";
    await appointment.save();

    await releaseDoctorSlot({
      doctorId: appointment.doctorId,
      appointmentId: appointment._id,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.slotTime.startTime,
      endTime: appointment.slotTime.endTime,
    });

    return res.status(200).json({
      success: true,
      message: "Doctor appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel doctor appointment",
      error: error.message,
    });
  }
};
