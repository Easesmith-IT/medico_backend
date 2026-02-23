// controllers/bookingController.js
const Booking = require("../models/bookingModel");
const Service = require("../models/serviceModel");
const { autoFilterSlots } = require("../utils/timeFIlter");
const { formatDuration } = require("../utils/timeFormat");
const City = require("../models/availableCities");
const mongoose = require("mongoose");
const Patient = require("../models/patientModel");

const Treatment = require("../models/treatmentModel");
// exports.createBooking = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;

//     const {
//       serviceId,
//       appointmentDate,  // 'YYYY-MM-DD'
//       startTime,        // 'HH:mm' e.g. "10:00"
//       endTime,          // 'HH:mm' e.g. "10:30"
//       duration,         // optional minutes
//       shiftType,        // optional string
//       servicePartnerId, // optional ObjectId
//       notes,
//       category,         // optional string
//       modes             // optional array of strings
//     } = req.body;

//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: 'patientId, serviceId, appointmentDate, startTime, and endTime are required'
//       });
//     }

//     const service = await Service.findById(serviceId);

//     if (!service || !service.isActive || service.isDeleted) {
//       return res.status(404).json({ success: false, message: 'Service not found or inactive' });
//     }

//     // Use category and modes from Service if not provided in request
//     const bookingCategory = category || service.category || null;
//     const bookingModes = Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

//     // Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ['Cancelled', 'Rejected'] },
//       'slotTime.startTime': startTime,
//       'slotTime.endTime': endTime
//     };

//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingBooking = await Booking.findOne(conflictQuery);
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: 'Slot already booked. Choose another slot.'
//       });
//     }

//     // Calculate duration (if not provided, use difference between start and end time)
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(':').map(Number);
//       const [eh, em] = endTime.split(':').map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }

//     // Calculate pricing snapshot
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false, // includeEquipment - adjust if needed
//       shiftType || null
//     );

//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: bookingCategory,
//       modes: bookingModes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: 'Pending',
//       pricing,
//       notes: notes || '',
//       createdBy: {
//         userId: patientId,
//         userModel: 'Patient'
//       }
//     });

//     await newBooking.save();

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully',
//       data: {
//         ...newBooking.toObject(),
//         formattedDuration: formatDuration(bookingDuration),
//       }
//     });
//   } catch (error) {
//     console.error('Error creating booking:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   }
// };

// exports.createBooking = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;

//     const {
//       serviceId,
//       appointmentDate,  // 'YYYY-MM-DD'
//       startTime,        // 'HH:mm'
//       endTime,          // 'HH:mm'
//       duration,         // optional minutes
//       shiftType,        // optional string
//       servicePartnerId, // optional ObjectId
//       notes,
//       category,         // optional string
//       modes             // optional array of strings
//     } = req.body;

//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: 'patientId, serviceId, appointmentDate, startTime, and endTime are required'
//       });
//     }

//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive || service.isDeleted) {
//       return res.status(404).json({ success: false, message: 'Service not found or inactive' });
//     }

//     // Verify city from availableCities collection if cityId provided in request body
//     let bookingCity = null;
//     if (req.body.cityId) {
//       bookingCity = await City.findById(req.body.cityId);
//       if (!bookingCity) {
//         return res.status(400).json({ success: false, message: 'Invalid city selected' });
//       }
//     }

//     // Use category and modes from Service if not provided in request
//     const bookingCategory = category || service.category || null;
//     const bookingModes = Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

//     // Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ['Cancelled', 'Rejected'] },
//       'slotTime.startTime': startTime,
//       'slotTime.endTime': endTime
//     };
//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingBooking = await Booking.findOne(conflictQuery);
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: 'Slot already booked. Choose another slot.'
//       });
//     }

//     // Calculate duration (if not provided, difference between start and end times)
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(':').map(Number);
//       const [eh, em] = endTime.split(':').map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }

//     // Calculate pricing snapshot
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false,
//       shiftType || null
//     );

//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: bookingCategory,
//       modes: bookingModes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: 'Pending',
//       pricing,
//       notes: notes || '',
//       city: bookingCity ? bookingCity._id : undefined,
//       createdBy: {
//         userId: patientId,
//         userModel: 'Patient'
//       }
//     });

//     await newBooking.save();

//     // Populate city details before sending response
//     const populatedBooking = await newBooking.populate('city', 'name latitude longitude');

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully',
//       data: {
//         ...populatedBooking.toObject(),
//         formattedDuration: formatDuration(bookingDuration),
//       }
//     });
//   } catch (error) {
//     console.error('Error creating booking:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   }
// };


//main
// exports.createBooking = async (req, res) => {
//   try {
//     const patientId =
//       req.user && req.user.id ? req.user.id : req.body.patientId;

//     const {
//       serviceId,
//       appointmentDate, // 'YYYY-MM-DD'
//       startTime, // 'HH:mm'
//       endTime, // 'HH:mm'
//       duration, // optional minutes
//       shiftType, // optional string
//       servicePartnerId, // optional ObjectId
//       notes,
//       category, // optional string
//       modes, // optional array of strings
//       cityId, // optional booking city id from body
//     } = req.body;

//     if (
//       !patientId ||
//       !serviceId ||
//       !appointmentDate ||
//       !startTime ||
//       !endTime
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "patientId, serviceId, appointmentDate, startTime, and endTime are required",
//       });
//     }

//     // 1) Validate service
//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive || service.isDeleted) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Service not found or inactive" });
//     }

//     // 2) Load patient and ensure patient has a city
//     const patient = await Patient.findById(patientId).select("address.cityId");
//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (!patient.address || !patient.address.cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient city not set. Please update your address first.",
//       });
//     }

//     // 3) Determine booking city and enforce that patient belongs to it
//     let bookingCity = null;

//     if (cityId) {
//       // City explicitly sent in request
//       bookingCity = await City.findById(cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid city selected",
//         });
//       }

//       // Patient must belong to this city
//       if (bookingCity._id.toString() !== patient.address.cityId.toString()) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "Booking not allowed: patient does not belong to the selected city",
//         });
//       }
//     } else {
//       // No cityId in body → default to patient city
//       bookingCity = await City.findById(patient.address.cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Patient city is invalid or not available",
//         });
//       }
//     }

//     // 4) Use category and modes from Service if not provided
//     const bookingCategory = category || service.category || null;
//     const bookingModes =
//       Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

//     // 5) Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//     };
//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingBooking = await Booking.findOne(conflictQuery);
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "Slot already booked. Choose another slot.",
//       });
//     }

//     // 6) Calculate duration
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = eh * 60 + em - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }

//     // 7) Pricing snapshot
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false,
//       shiftType || null
//     );

//     // 8) Create booking
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: bookingCategory,
//       modes: bookingModes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id, // always set to validated city
//       createdBy: {
//         userId: patientId,
//         userModel: "Patient",
//       },
//     });

//     await newBooking.save();

//     // 9) Populate city before response
//     const populatedBooking = await newBooking.populate(
//       "city",
//       "name latitude longitude"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       data: populatedBooking,
//     });
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating booking",
//       error: error.message,
//     });
//   }
// };






//before treatment id 
// exports.createBooking = async (req, res) => {
//   try {
//     const patientId =
//       req.user && req.user.id ? req.user.id : req.body.patientId;

//     const {
//       serviceId,
//       appointmentDate, // 'YYYY-MM-DD'
//       startTime, // 'HH:mm'
//       endTime, // 'HH:mm'
//       duration, // optional minutes
//       shiftType, // optional string
//       servicePartnerId, // optional ObjectId
//       notes,
//       category, // optional string
//       modes, // optional array of strings
//       cityId, // optional booking city id from body
//     } = req.body;

//     if (
//       !patientId ||
//       !serviceId ||
//       !appointmentDate ||
//       !startTime ||
//       !endTime
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "patientId, serviceId, appointmentDate, startTime, and endTime are required",
//       });
//     }

//     // 1) Validate service
//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive || service.isDeleted) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Service not found or inactive" });
//     }

//     // 2) Load patient and ensure patient has a city
//     const patient = await Patient.findById(patientId).select("address.cityId");
//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     if (!patient.address || !patient.address.cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient city not set. Please update your address first.",
//       });
//     }

//     // 3) Determine booking city - NEW LOGIC
//     // Patient can login anywhere, update to ANY available city, book ANY available city
//     let bookingCity = null;

//     if (cityId) {
//       // City explicitly sent → must be VALID AVAILABLE city only
//       bookingCity = await City.findById(cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid city selected - must be available city",
//         });
//       }
//       // Patient can book ANY available city (updated via address update form)
//     } else {
//       // No cityId → default to patient.address.cityId (their current available city)
//       bookingCity = await City.findById(patient.address.cityId);
//       if (!bookingCity) {
//         return res.status(400).json({
//           success: false,
//           message: "Patient city is invalid or not available",
//         });
//       }
//     }

//     // 4) Use category and modes from Service if not provided
//     const bookingCategory = category || service.category || null;
//     const bookingModes =
//       Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

//     // 5) Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//     };
//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingBooking = await Booking.findOne(conflictQuery);
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "Slot already booked. Choose another slot.",
//       });
//     }

//     // 6) Calculate duration
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = eh * 60 + em - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }

//     // 7) Pricing snapshot
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false,
//       shiftType || null
//     );

//     // 8) Create booking
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: bookingCategory,
//       modes: bookingModes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id, // always set to validated available city
//       createdBy: {
//         userId: patientId,
//         userModel: "Patient",
//       },
//     });

//     await newBooking.save();

//     // 9) Populate city before response
//     const populatedBooking = await newBooking.populate(
//       "city",
//       "name latitude longitude"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       data: populatedBooking,
//     });
//   } catch (error) {
//     console.error("Error creating booking:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating booking",
//       error: error.message,
//     });
//   }
// };
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;
//     const { serviceId, appointmentDate, startTime, endTime, duration, shiftType, servicePartnerId, notes, category, modes, cityId } = req.body;

//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, and endTime are required",
//       });
//     }

//     await session.startTransaction();

//     // 1) Validate service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive || service.isDeleted) {
//       await session.abortTransaction();
//       return res.status(404).json({ success: false, message: "Service not found or inactive" });
//     }

//     // 2) Load patient and ensure patient has a city
//     const patient = await Patient.findById(patientId).select("address.cityId").session(session);
//     if (!patient || !patient.address?.cityId) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Patient city not set" });
//     }

//     // 3) Determine booking city
//     let bookingCity = cityId ? await City.findById(cityId).session(session) : 
//                              await City.findById(patient.address.cityId).session(session);
//     if (!bookingCity) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Invalid city" });
//     }

//     // 4) Check slot conflicts
//     const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);
//     const conflictQuery = {
//       serviceId, appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime, "slotTime.endTime": endTime
//     };
//     if (servicePartnerId) conflictQuery.servicePartnerId = servicePartnerId;

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       await session.abortTransaction();
//       return res.status(409).json({ success: false, message: "Slot already booked" });
//     }

//     // 5) Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     // ✅ 6) CREATE BOOKING FIRST
//     const newBooking = new Booking({
//       patientId, serviceId, category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime }, duration: bookingDuration,
//       shiftType: shiftType || null, status: "Pending", pricing,
//       notes: notes || "", city: bookingCity._id,
//       createdBy: { userId: patientId, userModel: "Patient" },
//       // ✅ Treatment fields
//       treatmentStatus: 'Active',
//       invoiceGenerated: false
//     });
//     await newBooking.save({ session });

//     // ✅ 7) CREATE TREATMENT (ObjectId)
//     const treatment = new Treatment({
//       bookingId: newBooking._id,
//       patientId, serviceId, servicePartnerId: servicePartnerId || null,
//       appointmentDate: newBooking.appointmentDate,
//       slotTime: newBooking.slotTime,
//       status: 'Active'
//     });
//     await treatment.save({ session });

//     // ✅ 8) LINK treatmentId back to booking
//     newBooking.treatmentId = treatment._id;
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     // Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name latitude longitude')
//       .populate('treatmentId', 'status validTill')
//       .session(session);

//     res.status(201).json({
//       success: true,
//       message: "Booking & Treatment created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId: treatment._id  // ✅ Track this ObjectId
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating booking:", error);
//     res.status(500).json({ success: false, message: "Error creating booking", error: error.message });
//   } finally {
//     session.endSession();
//   }
// };
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;
    const { serviceId, appointmentDate, startTime, endTime, duration, shiftType, servicePartnerId, notes, category, modes, cityId } = req.body;

    if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "patientId, serviceId, appointmentDate, startTime, and endTime are required",
      });
    }

    await session.startTransaction();

    // 1) Validate service
    const service = await Service.findById(serviceId).session(session);
    if (!service || !service.isActive || service.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Service not found or inactive" });
    }

    // 2) Load patient and ensure patient has a city
    const patient = await Patient.findById(patientId).select("address.cityId").session(session);
    if (!patient || !patient.address?.cityId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Patient city not set" });
    }

    // 3) Determine booking city
    let bookingCity = cityId ? await City.findById(cityId).session(session) : 
                       await City.findById(patient.address.cityId).session(session);
    if (!bookingCity) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid city" });
    }

    // 4) Check slot conflicts
    const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);
    const conflictQuery = {
      serviceId, appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": startTime, "slotTime.endTime": endTime
    };
    if (servicePartnerId) conflictQuery.servicePartnerId = servicePartnerId;

    const existingBooking = await Booking.findOne(conflictQuery).session(session);
    if (existingBooking) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "Slot already booked" });
    }

    // 5) Calculate duration & pricing
    let bookingDuration = duration;
    if (!bookingDuration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
      if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
    }
    const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

    // ✅ 6) CHECK EXISTING ACTIVE TREATMENT FOR SAME PATIENT
    const existingTreatment = await Treatment.findOne({
      patientId,
      status: { $in: ['Active', 'InProgress'] }  // Not completed
    }).session(session);

    let treatmentId;

    // ✅ 7) IF NO ACTIVE TREATMENT → CREATE NEW
    if (!existingTreatment) {
      const treatment = new Treatment({
        patientId, 
        serviceId, 
        servicePartnerId: servicePartnerId || null,
        appointmentDate: new Date(appointmentDate),
        slotTime: { startTime, endTime },
        status: 'Active'
      });
      await treatment.save({ session });
      treatmentId = treatment._id;
    } 
    // ✅ 8) ELSE → REUSE EXISTING treatmentId
    else {
      treatmentId = existingTreatment._id;
      console.log(`🔄 Reusing existing treatmentId: ${treatmentId} for patient: ${patientId}`);
    }

    // ✅ 9) CREATE BOOKING with SAME treatmentId
    const newBooking = new Booking({
      patientId, 
      serviceId, 
      category: category || service.category,
      modes: Array.isArray(modes) && modes.length ? modes : service.modes,
      servicePartnerId: servicePartnerId || null,
      appointmentDate: new Date(appointmentDate),
      slotTime: { startTime, endTime }, 
      duration: bookingDuration,
      shiftType: shiftType || null, 
      status: "Pending", 
      pricing,
      notes: notes || "", 
      city: bookingCity._id,
      createdBy: { userId: patientId, userModel: "Patient" },
      treatmentId,  // ← SAME treatmentId across all bookings!
      treatmentStatus: 'Active',
      invoiceGenerated: false
    });
    await newBooking.save({ session });

    await session.commitTransaction();

    // Populate response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('city', 'name latitude longitude')
      .populate('treatmentId', 'status validTill');

    res.status(201).json({
      success: true,
      message: "Booking & Treatment created successfully",
      data: {
        booking: populatedBooking,
        treatmentId: treatmentId  // ← SAME across all bookings for this patient!
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "Error creating booking", error: error.message });
  } finally {
    session.endSession();
  }
};

exports.getBookedServicesByPatientId = async (req, res) => {
  try {
    const patientId =
      req.user && req.user.id ? req.user.id : req.params.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const { status, dateFilterType, startDate, endDate } = req.query;

    let query = { patientId };

    if (status) {
      query.status = status;
    }

    // Date filters
    if (dateFilterType === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
    } else if (dateFilterType === "week") {
      const now = new Date();
      const firstDayOfWeek = new Date(
        now.setDate(now.getDate() - now.getDay())
      );
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
    } else if (dateFilterType === "custom" && startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bookings = await Booking.find(query)
      .populate("serviceId", "name category modes")
      .populate("servicePartnerId", "name email phone")
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get booked services error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booked services",
      error: error.message,
    });
  }
};

exports.getServiceSummaryByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.query; // optional filter

    if (!serviceId) {
      return res
        .status(400)
        .json({ success: false, message: "Service ID is required" });
    }

    const query = { serviceId };
    if (status) {
      query.status = status; // filter by Approved/Rejected etc.
    }

    const bookings = await Booking.find(query)
      .populate("patientId", "name email phone")
      .populate("servicePartnerId", "name email phone")
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get service summary error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching service summary",
      error: error.message,
    });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      appointmentDate,
      startTime,
      endTime,
      duration,
      shiftType,
      servicePartnerId,
    } = req.body;

    if (!bookingId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID, appointmentDate, startTime, and endTime are required for rescheduling",
      });
    }

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (["Cancelled", "Rejected"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule cancelled or rejected bookings",
      });
    }

    const service = booking.serviceId;

    // Check for conflicting booking in new slot
    const dateObj = new Date(appointmentDate);
    const dayStart = new Date(dateObj.setHours(0, 0, 0, 0));
    const dayEnd = new Date(dateObj.setHours(23, 59, 59, 999));

    const conflictQuery = {
      _id: { $ne: bookingId },
      serviceId: service._id,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": startTime,
      "slotTime.endTime": endTime,
    };

    if (servicePartnerId) {
      conflictQuery.servicePartnerId = servicePartnerId;
    }

    const conflict = await Booking.findOne(conflictQuery);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "The selected slot is already booked. Choose another slot.",
      });
    }

    // Calculate duration if not provided
    let bookingDuration = duration;
    if (!bookingDuration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      bookingDuration = eh * 60 + em - (sh * 60 + sm);
      if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
    }

    // Recalculate pricing
    const pricing = service.calculateTotalPrice(
      bookingDuration,
      false,
      shiftType || booking.shiftType || null
    );

    // Update booking
    booking.appointmentDate = new Date(appointmentDate);
    booking.slotTime = { startTime, endTime };
    booking.duration = bookingDuration;
    booking.shiftType = shiftType || booking.shiftType || null;
    booking.servicePartnerId =
      servicePartnerId || booking.servicePartnerId || null;
    booking.pricing = pricing;
    booking.status = "Rescheduled";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully",
      data: {
        ...booking.toObject(),
        formattedDuration: formatDuration(bookingDuration),
        serviceCategory: service.category,
      },
    });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error rescheduling booking",
      error: error.message,
    });
  }
};


// exports.cancelBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     if (!bookingId) {
//       return res.status(400).json({ success: false, message: 'Booking ID is required' });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({ success: false, message: 'Booking not found' });
//     }

//     if (booking.status === 'Cancelled') {
//       return res.status(400).json({ success: false, message: 'Booking already cancelled' });
//     }

//     booking.status = 'Cancelled';
//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Booking cancelled successfully',
//       data: booking
//     });
//   } catch (error) {
//     console.error('Cancel booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error cancelling booking',
//       error: error.message
//     });
//   }
// };
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body; // Patient cancellation reason
    
    if (!bookingId) {
      return res
        .status(400)
        .json({ 
        success: false, 
        message: "Booking ID is required" 
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking already cancelled' 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if booking is in the past
    const now = new Date();
    if (booking.appointmentDate < now) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel past appointments' 
      });
    }

    // Calculate time difference in hours
    const timeDiffMs = booking.appointmentDate - now;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    const originalStatus = booking.status;
    let newStatus = 'Cancelled';
    let adminApprovalRequired = false;

    if (timeDiffHours <= 12) {
      // Direct cancellation within 12 hours
      newStatus = 'Cancelled';
      booking.status = newStatus;
      booking.cancelledBy = 'patient';
      booking.cancelledAt = now;
      booking.cancellationReason = reason || 'No reason provided';
      booking.adminApprovalRequired = false;
      
      await booking.save();
      
      // Optional: Send notification to doctor about cancellation
      // await sendCancellationNotification(booking);
      
      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: {
          ...booking.toObject(),
          cancellationType: 'direct',
          timeRemaining: Math.round(timeDiffHours * 60) + ' minutes'
        }
      });
      
    } else {
      // After 12 hours - requires admin approval
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cancellation reason is required (minimum 10 characters)' 
        });
      }

      // Create pending cancellation request
      booking.status = 'Cancellation Requested';
      booking.cancelledBy = 'patient';
      booking.requestedCancellationAt = now;
      booking.cancellationReason = reason;
      booking.originalStatus = originalStatus;
      booking.adminApprovalRequired = true;
      booking.timeRemainingAtRequest = timeDiffHours;
      
      await booking.save();
      
      // Optional: Send notification to admin for approval
      // await notifyAdminForCancellation(booking);
      
      res.status(200).json({
        success: true,
        message: 'Cancellation request submitted for admin approval',
        data: {
          ...booking.toObject(),
          cancellationType: 'pending_approval',
          timeRemaining: Math.round(timeDiffHours) + ' hours'
        }
      });
    }
    
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: 'Error processing cancellation request',
      error: error.message
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      serviceId,
      patientId,
      servicePartnerId,
      category,
      mode,
      city,
      search,
      filterBy,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const match = {};

    if (status) match.status = status;
    if (serviceId) match.serviceId = new mongoose.Types.ObjectId(serviceId);
    if (patientId) match.patientId = new mongoose.Types.ObjectId(patientId);
    if (servicePartnerId)
      match.servicePartnerId = new mongoose.Types.ObjectId(servicePartnerId);
    if (category) match.category = category;
    if (mode) match.modes = mode;

    const now = new Date();
    if (filterBy === "today") {
      match.appointmentDate = {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      };
    } else if (filterBy === "week") {
      match.appointmentDate = {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      };
    } else if (startDate || endDate) {
      match.appointmentDate = {};
      if (startDate) match.appointmentDate.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        match.appointmentDate.$lte = e;
      }
    }

    // const aggregationPipeline = [
    //   { $match: match },
    //   {
    //     $lookup: {
    //       from: 'patients',
    //       localField: 'patientId',
    //       foreignField: '_id',
    //       as: 'patient'
    //     }
    //   },
    //   { $unwind: "$patient" },
    //   {
    //     $lookup: {
    //       from: 'availablecities',
    //       localField: 'patient.city',
    //       foreignField: '_id',
    //       as: 'patient.city'
    //     }
    //   },
    //   { $unwind: { path: "$patient.city", preserveNullAndEmptyArrays: true } },
    //   {
    //     $lookup: {
    //       from: 'services',
    //       localField: 'serviceId',
    //       foreignField: '_id',
    //       as: 'service'
    //     }
    //   },
    //   { $unwind: "$service" },
    //   {
    //     $lookup: {
    //       from: 'doctors',
    //       localField: 'servicePartnerId',
    //       foreignField: '_id',
    //       as: 'servicePartner'
    //     }
    //   },
    //   { $unwind: { path: "$servicePartner", preserveNullAndEmptyArrays: true } },
    //   {
    //     $lookup: {
    //       from: 'availablecities',
    //       localField: 'servicePartner.city',
    //       foreignField: '_id',
    //       as: 'servicePartner.city'
    //     }
    //   },
    //   { $unwind: { path: "$servicePartner.city", preserveNullAndEmptyArrays: true } }
    // ];

    const aggregationPipeline = [
      { $match: match },

      // --- Patient Lookup ---
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      // --- Service Lookup ---
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },

      // --- Service Partner Lookup ---
      {
        $lookup: {
          from: "doctors",
          localField: "servicePartnerId",
          foreignField: "_id",
          as: "servicePartner",
        },
      },
      {
        $unwind: {
          path: "$servicePartner",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (city && mongoose.Types.ObjectId.isValid(city)) {
      aggregationPipeline.push({
        $match: { city: new mongoose.Types.ObjectId(city) },
      });
    }

    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { "patient.firstName": new RegExp(search, "i") },
            { "patient.phone": new RegExp(search, "i") },
            { "service.name": new RegExp(search, "i") },
            { "servicePartner.name": new RegExp(search, "i") },
          ],
        },
      });
    }

    aggregationPipeline.push(
      { $sort: { appointmentDate: -1 } },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limitNum }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const results = await Booking.aggregate(aggregationPipeline);

    const bookings = results[0]?.paginatedResults || [];
    const totalCount = results[0]?.totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      count: bookings.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      page: pageNum,
      limit: limitNum,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings with filters:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

exports.getByIdBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("patientId", "firstName email phone")
      .populate("serviceId", "name category modes")
      .populate("servicePartnerId", "name email phone");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

// exports.updateServiceStatus = async (req, res) => {

//   try {
//     const { bookingId } = req.params;
//     const { status, equipment } = req.body; 
//     const providerId = req.user.id;

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     // Verify authorized provider (ensure it is a string comparison)
//     if (booking.servicePartnerId.toString() !== providerId.toString()) {
//       return res.status(403).json({ success: false, message: "Unauthorized provider" });
//     }

//     if (status === "Started") {
//       // Prevent starting a booking that is already done or cancelled
//       if (["Completed", "Cancelled", "Rejected"].includes(booking.status)) {
//         return res.status(400).json({ success: false, message: "Invalid status transition" });
//       }
//       booking.status = "In-Progress";
//       booking.serviceStartedAt = new Date();
//     } 
//     else if (status === "Completed") {
//       // Must be started before it can be completed
//       if (booking.status !== "In-Progress") {
//         return res.status(400).json({ success: false, message: "Service must be 'In-Progress' to complete" });
//       }

//       booking.status = "Completed";
//       booking.serviceEndedAt = new Date();

//       // Handle Manual Equipment Charges
//       if (equipment && Array.isArray(equipment)) {
//         let extraCharge = 0;
//         booking.additionalEquipment = equipment.map(item => {
//           const charge = Number(item.charge || 0);
//           extraCharge += charge;
//           return { name: item.name, charge: charge };
//         });
        
//         // Update Pricing Snapshot
//         booking.pricing.equipmentCharges = extraCharge; 
        
//         // Calculate final total based on original basePrice + new manual charges
//         const baseAmount = booking.pricing.basePrice || 0;
//         booking.pricing.totalAmount = baseAmount + extraCharge;
//       }
//     } else {
//       return res.status(400).json({ success: false, message: "Invalid status provided" });
//     }

//     await booking.save();
//     res.status(200).json({
//       success: true,
//       message: `Status updated to ${booking.status}`,
//       data: booking
//     });
//   } catch (error) {
//     console.error("Update status error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


// exports.updateServiceStatus = async (req, res) => {
//   try {
//     console.log("========== UPDATE SERVICE STATUS ==========");

//     console.log("➡️ req.user:", req.user);
//     console.log("➡️ req.user.id:", req.user?.id);
//     console.log("➡️ req.user.role:", req.user?.role);

//     const { bookingId } = req.params;
//     const { status, equipment } = req.body;
//     const providerId = req.user?.id;

//     console.log("➡️ bookingId:", bookingId);
//     console.log("➡️ requested status:", status);

//     if (!providerId) {
//       console.log("❌ providerId missing in req.user");
//       return res.status(401).json({
//         success: false,
//         message: "Invalid authenticated user",
//       });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       console.log("❌ Booking not found");
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     console.log("➡️ booking.servicePartnerId:", booking.servicePartnerId?.toString());
//     console.log("➡️ providerId (from token):", providerId.toString());

//     // Verify authorized provider
//     if (booking.servicePartnerId.toString() !== providerId.toString()) {
//       console.log("❌ Unauthorized provider");
//       console.log(
//         "❌ MISMATCH:",
//         booking.servicePartnerId.toString(),
//         "!==",
//         providerId.toString()
//       );

//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized provider",
//       });
//     }

//     // ---------------- STATUS TRANSITIONS ----------------
//     if (status === "Started") {
//       console.log("➡️ Attempting to START service");

//       if (["Completed", "Cancelled", "Rejected","In-Progress"].includes(booking.status)) {
//         console.log("❌ Invalid status transition from:", booking.status);
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status transition",
//         });
//       }

//       booking.status = "In-Progress";
//       booking.serviceStartedAt = new Date();
//     } 
//     else if (status === "Completed") {
//       console.log("➡️ Attempting to COMPLETE service");

//       if (booking.status !== "In-Progress") {
//         console.log(
//           "❌ Cannot complete. Current status:",
//           booking.status
//         );
//         return res.status(400).json({
//           success: false,
//           message: "Service must be 'In-Progress' to complete",
//         });
//       }

//       booking.status = "Completed";
//       booking.serviceEndedAt = new Date();

//       // Handle Manual Equipment Charges
//       if (equipment && Array.isArray(equipment)) {
//         console.log("➡️ Equipment received:", equipment);

//         let extraCharge = 0;
//         booking.additionalEquipment = equipment.map(item => {
//           const charge = Number(item.charge || 0);
//           extraCharge += charge;
//           return { name: item.name, charge };
//         });

//         booking.pricing.equipmentCharges = extraCharge;

//         const baseAmount = booking.pricing.basePrice || 0;
//         booking.pricing.totalAmount = baseAmount + extraCharge;

//         console.log("➡️ Equipment charges:", extraCharge);
//         console.log("➡️ Final amount:", booking.pricing.totalAmount);
//       }
//     } else {
//       console.log("❌ Invalid status provided:", status);
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status provided",
//       });
//     }

//     await booking.save();

//     console.log("✅ Status updated successfully:", booking.status);
//     console.log("==========================================");

//     res.status(200).json({
//       success: true,
//       message: `Status updated to ${booking.status}`,
//       data: booking,
//     });
//   } catch (error) {
//     console.error("🔥 Update status error:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };
//before treatment id
// exports.updateServiceStatus = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { status, equipment } = req.body;
//     const providerId = req.user?.id;

//     if (!providerId) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid authenticated user",
//       });
//     }

//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     // Verify authorized provider
//     if (!booking.servicePartnerId || booking.servicePartnerId.toString() !== providerId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized provider",
//       });
//     }

//     // Handle transition to In-Progress
//     if (status === "Started" || status === "In-Progress") {
//       // Prevent transition if booking is already in a terminal state
//       if (["Completed", "Cancelled", "Rejected"].includes(booking.status)) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot move to In-Progress from current status: ${booking.status}`,
//         });
//       }

//       booking.status = "In-Progress";
//       booking.serviceStartedAt = new Date();
//     } 
//     // Handle transition to Completed
//     else if (status === "Completed") {
//       // Business rule: Must be In-Progress before it can be Completed
//       if (booking.status !== "In-Progress") {
//         return res.status(400).json({
//           success: false,
//           message: "Service must be 'In-Progress' to be marked as Completed",
//         });
//       }

//       booking.status = "Completed";
//       booking.serviceEndedAt = new Date();

//       // Calculate extra charges if equipment is provided
//       if (equipment && Array.isArray(equipment)) {
//         let extraCharge = 0;
//         booking.additionalEquipment = equipment.map(item => {
//           const charge = Number(item.charge || 0);
//           extraCharge += charge;
//           return { name: item.name, charge };
//         });

//         if (!booking.pricing) booking.pricing = {};
        
//         booking.pricing.equipmentCharges = extraCharge;
//         const baseAmount = booking.pricing.basePrice || 0;
//         booking.pricing.totalAmount = baseAmount + extraCharge;
//       }
//     } 
//     else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status provided. Use 'Started', 'In-Progress', or 'Completed'",
//       });
//     }

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: `Status updated to ${booking.status}`,
//       data: booking,
//     });
//   } catch (error) {
//     console.error("Update status error:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };
// ✅ bookingController.js - ONLY THIS FUNCTION NEEDS CHANGE
// exports.updateServiceStatus = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { status } = req.body;  // "In-Progress", "Completed", "TreatmentCompleted"
//     const providerId = req.user?.id;

//     if (!providerId) {
//       return res.status(401).json({ success: false, message: "Service provider required" });
//     }

//     const booking = await Booking.findById(bookingId)
//       .populate('serviceId', 'name category basePrice equipmentCharges taxPercentage');

//     if (!booking || booking.status === 'Cancelled') {
//       return res.status(404).json({ success: false, message: "Booking cancelled" });
//     }

//     if (booking.servicePartnerId?.toString() !== providerId.toString()) {
//       return res.status(403).json({ success: false, message: "Unauthorized provider" });
//     }

//     // ✅ TEST CASE 1: Regular booking statuses (NO INVOICE)
//     const bookingStatuses = ["Pending", "Approved", "Rejected", "Rescheduled", "Cancelled", "In-Progress", "Completed"];
//     if (bookingStatuses.includes(status)) {
//       // Update booking.status normally - NO INVOICE
//       booking.status = status;
      
//       if (status === 'In-Progress') booking.serviceStartedAt = new Date();
//       if (status === 'Completed') booking.serviceEndedAt = new Date();
      
//       // treatmentStatus remains unchanged
//       booking.treatmentStatus = booking.treatmentStatus || 'Active';
      
//       await booking.save();
      
//       return res.status(200).json({
//         success: true,
//         message: `Booking status updated to "${status}"`,
//         data: {
//           bookingStatus: status,
//           treatmentStatus: booking.treatmentStatus,
//           invoiceGenerated: false  // ← NO INVOICE
//         }
//       });
//     }

//     // ✅ TEST CASE 2: TreatmentCompleted (INVOICE GENERATED)
//     if (status.toLowerCase() === 'treatmentcompleted') {
//       if (booking.treatmentStatus !== 'Active') {
//         return res.status(400).json({ success: false, message: "Treatment must be Active" });
//       }
//       if (booking.invoiceGenerated) {
//         return res.status(400).json({ success: false, message: "Invoice already generated" });
//       }

//       // Generate invoice FIRST
//       const invoicePayload = {
//         bookingId: booking._id,
//         patientId: booking.patientId,
//         doctorId: providerId,
//         billingDetails: {
//           serviceName: booking.serviceId.name,
//           category: booking.serviceId.category,
//           durationMinutes: booking.duration,
//           basePrice: booking.pricing.basePrice,
//           equipmentCharges: booking.pricing.equipmentCharges || 0,
//           taxPercentage: booking.serviceId.taxPercentage || 18
//         }
//       };

//       const InvoiceController = require('./invoiceController');
//       const invoiceResponse = await InvoiceController.generateInvoice({ body: invoicePayload }, {});

//       if (!invoiceResponse.data) {
//         return res.status(500).json({ success: false, message: "Invoice generation failed" });
//       }

//       // Update BOTH statuses
//       booking.status = 'Completed';
//       booking.treatmentStatus = 'Completed';
//       booking.serviceEndedAt = new Date();
//       booking.invoiceId = invoiceResponse.data._id;
//       booking.invoiceGenerated = true;

//       await booking.save();

//       return res.status(200).json({
//         success: true,
//         message: " Treatment completed & Invoice generated",
//         data: {
//           bookingStatus: 'Completed',
//           treatmentStatus: 'Completed',
//           invoiceGenerated: true,
//           invoiceId: invoiceResponse.data._id,
//           invoiceNumber: invoiceResponse.data.invoiceNumber
//         }
//       });
//     }

//     return res.status(400).json({ 
//       success: false, 
//       message: 'Valid: "In-Progress", "Completed", "TreatmentCompleted"' 
//     });

//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.updateServiceStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const providerId = req.user?.id;

    if (!providerId) {
      return res.status(401).json({ success: false, message: "Service provider required" });
    }

    const booking = await Booking.findById(bookingId)
      .populate('serviceId', 'name category basePrice equipmentCharges taxPercentage');

    if (!booking || booking.status === 'Cancelled') {
      return res.status(404).json({ success: false, message: "Booking cancelled" });
    }

    if (booking.servicePartnerId?.toString() !== providerId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized provider" });
    }

    // Regular booking statuses (NO INVOICE)
    const bookingStatuses = ["Pending", "Approved", "Rejected", "Rescheduled", "Cancelled", "In-Progress", "Completed"];
    if (bookingStatuses.includes(status)) {
      booking.status = status;
      if (status === 'In-Progress') booking.serviceStartedAt = new Date();
      if (status === 'Completed') booking.serviceEndedAt = new Date();
      booking.treatmentStatus = booking.treatmentStatus || 'Active';
      
      await booking.save();
      
      return res.status(200).json({
        success: true,
        message: `Booking status updated to "${status}"`,
        data: {
          bookingStatus: status,
          treatmentStatus: booking.treatmentStatus,
          invoiceGenerated: false
        }
      });
    }

    // TreatmentCompleted → Generate Invoice + Complete Treatment
    if (status.toLowerCase() === 'treatmentcompleted') {
      if (booking.treatmentStatus !== 'Active') {
        return res.status(400).json({ success: false, message: "Treatment must be Active" });
      }
      if (booking.invoiceGenerated) {
        return res.status(400).json({ success: false, message: "Invoice already generated" });
      }

      // ✅ DIRECT INVOICE CREATION
      const Invoice = require('../models/invoiceModel');
      const crypto = require('crypto');
      
      const invoicePayload = {
        invoiceNumber: `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        bookingId: booking._id,
        patientId: booking.patientId,
        doctorId: providerId,
        billingDetails: {
          serviceName: booking.serviceId.name,
          category: booking.serviceId.category,
          durationMinutes: booking.duration,
          basePrice: booking.pricing.basePrice,
          equipmentCharges: booking.pricing.equipmentCharges || 0,
          taxPercentage: booking.serviceId.taxPercentage || 18
        }
      };

      const newInvoice = new Invoice(invoicePayload);
      const savedInvoice = await newInvoice.save();

      booking.status = 'Completed';
      booking.treatmentStatus = 'Completed';
      booking.serviceEndedAt = new Date();
      booking.invoiceId = savedInvoice._id;
      booking.invoiceGenerated = true;
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Treatment completed & Invoice generated",
        data: {
          bookingStatus: 'Completed',
          treatmentStatus: 'Completed',
          invoiceGenerated: true,
          invoiceId: savedInvoice._id,
          invoiceNumber: savedInvoice.invoiceNumber
        }
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Valid: "In-Progress", "Completed", "TreatmentCompleted"' 
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


//before id
// exports.getBookingsByServiceProvider = async (req, res, next) => {
//     try {
//         const { providerId } = req.params;

//         // 1. Validate the ID format
//         if (!mongoose.Types.ObjectId.isValid(providerId)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid Service Provider ID"
//             });
//         }

//         // 2. Fetch bookings using the correct schema field: servicePartnerId
//         const bookings = await Booking.find({ 
//             servicePartnerId: providerId 
//         })
//         .populate({
//             path: 'patientId', // Matches your schema
//             select: 'firstName lastName email mobile profilePhoto'
//         })
//         .populate({
//             path: 'serviceId', // Matches your schema
//             select: 'name category modes'
//         })
//         .populate({
//             path: 'city',
//             select: 'name'
//         })
//         .sort({ createdAt: -1 });

//         // 3. Return response
//         return res.status(200).json({
//             success: true,
//             count: bookings.length,
//             message: bookings.length === 0 ? "No bookings found" : "Bookings retrieved successfully",
//             data: bookings
//         });

//     } catch (err) {
//         console.error("Error fetching provider bookings:", err.message);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: err.message
//         });
//     }
// };


exports.getBookingsByServiceProvider = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        // 1. Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Service Provider ID"
            });
        }

        // 2. Fetch bookings using the correct schema field: servicePartnerId
        const bookings = await Booking.find({ 
            servicePartnerId: providerId 
        })
        .populate({
            path: 'patientId',
            select: 'firstName lastName email mobile profilePhoto'
        })
        .populate({
            path: 'serviceId',
            select: 'name category modes'
        })
        .populate({
            path: 'city',
            select: 'name'
        })
        // 
        .populate({
            path: 'treatmentId',
            select: 'status validTill'
        })
        .sort({ createdAt: -1 });

        // 3. Return response (UNCHANGED)
        return res.status(200).json({
            success: true,
            count: bookings.length,
            message: bookings.length === 0 ? "No bookings found" : "Bookings retrieved successfully",
            data: bookings
        });

    } catch (err) {
        console.error("Error fetching provider bookings:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};
// exports.getBookingsByServiceProvider = async (req, res, next) => {
//     try {
//         const { providerId } = req.params;

//         // 1. Fetch bookings for the specific provider
//         // Filtering by serviceProvider ID and often status (e.g., 'booked', 'confirmed')
//         const bookings = await Booking.find({ 
//             serviceProvider: providerId 
//         })
//         .populate({
//             path: 'patient',
//             select: 'firstName lastName email phone profilePhoto'
//         })
//         .populate({
//             path: 'serviceId',
//             select: 'name description basePrice icon'
//         })
//         .sort({ createdAt: -1 });

//         // 2. Check if bookings exist
//         if (!bookings || bookings.length === 0) {
//             return res.status(200).json({
//                 success: true,
//                 count: 0,
//                 message: "No bookings found for this service provider",
//                 data: []
//             });
//         }

//         // 3. Return response
//         res.status(200).json({
//             success: true,
//             count: bookings.length,
//             data: bookings
//         });

//     } catch (err) {
//         console.error("Error fetching provider bookings:", err.message);
//         next(err);
//     }
// };








// exports.addEquipment = async (req, res) => {
//   try {
//     const { 
//       name, 
//       description, 
//       basePrice, 
//       equipmentCharges, 
//       cities, 
//       image,
//       minDuration,
//       maxDuration 
//     } = req.body;

//     // 1. Validate mandatory fields for equipment
//     if (!name || !basePrice || !cities) {
//       return res.status(400).json({ message: "Name, Base Price, and Cities are required" });
//     }

//     // 2. Create the new service document with 'equipment' category
//     const newEquipment = new Service({
//       name,
//       description,
//       category: 'equipment', // Fixed for this function
//       basePrice,
//       equipmentCharges: equipmentCharges || 0,
//       cities,
//       image,
//       // Configure equipment booking logic based on your schema
//       slotConfig: {
//         equipmentBooking: {
//           enabled: true,
//           minDuration: minDuration || 60,
//           maxDuration: maxDuration || 720,
//           available24x7: true
//         }
//       },
//       // Admin metadata (from your auth middleware)
//       createdBy: {
//         userId: req.user._id,
//          userModel: req.user.role === 'superAdmin' ? 'SuperAdmin' : 'Admin', 
//         // userModel: req.user.role, // "Admin" or "SuperAdmin"
//         name: req.user.name,
//         email: req.user.email
//       }
//     });

//     // 3. Save to MongoDB
//     const savedEquipment = await newEquipment.save();

//     res.status(201).json({
//       status: 'success',
//       data: savedEquipment
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: error.message
//     });
//   }
// };