// controllers/bookingController.js
const path = require('path');
const PDFDocument = require('pdfkit');
const Booking = require("../models/bookingModel");
const Service = require("../models/serviceModel");
const catchAsync = require('../utils/catchAsync');
const { autoFilterSlots } = require("../utils/timeFIlter");
const { formatDuration } = require("../utils/timeFormat");
const City = require("../models/availableCities");
const mongoose = require("mongoose");
const Patient = require("../models/patientModel");
const ServiceProvider = require("../models/serviceProviderModel");
const {User}= require("../models/bookingModel");
const ItemCategory = require('../models/itemCategoryModel');
const Treatment = require("../models/treatmentModel");
const Payment = require("../models/paymentModel");
const crypto = require('crypto');   
const Invoice = require("../models/invoiceModel");
// const upload = require("../middleware/multerConfig");
const fs = require('fs');
// const Invoice = require('../models/Invoice'); // Your Invoice model path
const { generateInvoicePdf } = require('../utils/generateInvoicePdf'); // Your PDF generator path
const  uploadFile  = require('../utils/uploadFile')
const razorpayInstance = require("../config/razorpay");
//original one
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;
//     const { serviceId, appointmentDate, startTime, endTime, duration, shiftType, servicePartnerId, notes, category, modes, cityId, } = req.body;

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
//                        await City.findById(patient.address.cityId).session(session);
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

//     // ✅ 6) CHECK EXISTING ACTIVE TREATMENT FOR SAME PATIENT
//     const existingTreatment = await Treatment.findOne({
//       patientId,
//       status: { $in: ['Active', 'InProgress'] }  // Not completed
//     }).session(session);

//     let treatmentId;

//     // ✅ 7) IF NO ACTIVE TREATMENT → CREATE NEW
//     if (!existingTreatment) {
//       const treatment = new Treatment({
//         patientId, 
//         serviceId, 
//         servicePartnerId: servicePartnerId || null,
//         appointmentDate: new Date(appointmentDate),
//         slotTime: { startTime, endTime },
//         status: 'Active'
//       });
//       await treatment.save({ session });
//       treatmentId = treatment._id;
//     } 
//     // ✅ 8) ELSE → REUSE EXISTING treatmentId
//     else {
//       treatmentId = existingTreatment._id;
//       console.log(`🔄 Reusing existing treatmentId: ${treatmentId} for patient: ${patientId}`);
//     }

//     // ✅ 9) CREATE BOOKING with SAME treatmentId
//     // const newBooking = new Booking({
//     //   patientId, 
//     //   serviceId, 
//     //   category: category || service.category,
//     //   modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//     //   servicePartnerId: servicePartnerId || null,
//     //   appointmentDate: new Date(appointmentDate),
//     //   slotTime: { startTime, endTime }, 
//     //   duration: bookingDuration,
//     //   shiftType: shiftType || null, 
//     //   status: "Pending", 
//     //   pricing,
//     //   notes: notes || "", 
//     //   city: bookingCity._id,
//     //   createdBy: { userId: patientId, userModel: "Patient" },
//     //   treatmentId,  // ← SAME treatmentId across all bookings!
//     //   treatmentStatus: 'Active',
//     //   invoiceGenerated: false
//     // });


//     const newBooking = new Booking({
//   patientId,
//   serviceId,
//   category: category || service.category,
//   modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//   servicePartnerId: servicePartnerId || null,
//   appointmentDate: new Date(appointmentDate),
//   slotTime: { startTime, endTime },
//   duration: bookingDuration,
//   shiftType: shiftType || null,
//   status: "Pending",
//   pricing,
//   notes: notes || "",
//   city: bookingCity._id,
//   createdBy: { userId: patientId, userModel: "Patient" },
//   treatmentStatus: "Active",
//   invoiceGenerated: false
// });

// await newBooking.save({ session });
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     // Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name latitude longitude')
//       .populate('treatmentId', 'status validTill');

//     res.status(201).json({
//       success: true,
//       message: "Booking & Treatment created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId: treatmentId  // ← SAME across all bookings for this patient!
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


//flex without payament
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
//                        await City.findById(patient.address.cityId).session(session);
//     if (!bookingCity) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Invalid city" });
//     }

//     // 4) Check slot conflicts
//     const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime
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
// const totalAmount = Number(pricing?.totalAmount || 0);
// const payNow = req.body.payNow === true || req.body.payNow === "true";
// const advanceAmount = payNow ? Number(req.body.advanceAmount || 0) : 0;

// if (advanceAmount < 0 || advanceAmount > totalAmount) {
//   await session.abortTransaction();
//   return res.status(400).json({
//     success: false,
//     message: "Invalid advance amount",
//   });
// }

// const paidAmount = advanceAmount;
// const dueAmount = totalAmount - paidAmount;

// let paymentStatus = "Unpaid";
// if (paidAmount > 0 && dueAmount > 0) paymentStatus = "Partially Paid";
// if (dueAmount === 0 && totalAmount > 0) paymentStatus = "Paid";
//     // -------------------------------
//     // ✅ CREATE BOOKING FIRST
//     // -------------------------------

//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { userId: patientId, userModel: "Patient" },
//       treatmentStatus: 'Active',
//       invoiceGenerated: false,


//   advanceAmount,
//   paidAmount,
//   dueAmount,
//   paymentStatus,
//   paymentMethod: paidAmount > 0 ? "Online" : "None",
//   paymentRequiredAt: "TreatmentCompletion",
//   isFinalPaymentDone: dueAmount === 0,
//   paymentHistory:
//     paidAmount > 0
//       ? [
//           {
//             amount: paidAmount,
//             method: "Online",
//             stage: "Booking",
//             note: "Advance payment at booking time",
//           },
//         ]
//       : [],

//     });

//     await newBooking.save({ session });

//     // -------------------------------
//     // ✅ CREATE TREATMENT WITH bookingId
//     // -------------------------------

//     const treatment = new Treatment({
//       bookingId: newBooking._id,
//       patientId,
//       serviceId,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       status: 'Active'
//     });

//     await treatment.save({ session });

//     // -------------------------------
//     // ✅ LINK BOOKING → TREATMENT
//     // -------------------------------

//     newBooking.treatmentId = treatment._id;
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name latitude longitude')
//       .populate('treatmentId', 'status validTill');

//     res.status(201).json({
//       success: true,
//       message: "Booking & Treatment created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId: treatment._id
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating booking:", error);

//     res.status(500).json({
//       success: false,
//       message: "Error creating booking",
//       error: error.message
//     });

//   } finally {
//     session.endSession();
//   }
// };





// exports.getBookedServicesByPatientId = async (req, res) => {
//   try {
//     const patientId =
//       req.user && req.user.id ? req.user.id : req.params.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required",
//       });
//     }

//     const { status, dateFilterType, startDate, endDate } = req.query;

//     let query = { patientId };

//     if (status) {
//       query.status = status;
//     }

//     // Date filters
//     if (dateFilterType === "today") {
//       const todayStart = new Date();
//       todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date();
//       todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(
//         now.setDate(now.getDate() - now.getDay())
//       );
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     const bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//         .populate("treatmentId", "status validTill") 
//       .sort({ appointmentDate: -1, createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings,
//     });
//   } catch (error) {
//     console.error("Get booked services error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booked services",
//       error: error.message,
//     });
//   }
// };






// exports.getBookedServicesByPatientId = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.params.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required",
//       });
//     }

//     console.log("🔍 DEBUG - Patient ID:", patientId); // Add this
//     console.log("🔍 DEBUG - Query params:", req.query); // Add this

//     const { status, dateFilterType, startDate, endDate } = req.query;

//     let query = { patientId };

//     if (status) {
//       query.status = status;
//     }

//     // Date filters
//     if (dateFilterType === "today") {
//       const todayStart = new Date();
//       todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date();
//       todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//       console.log("🔍 DEBUG - Today filter:", { todayStart, todayEnd }); // Add this
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//       console.log("🔍 DEBUG - Week filter:", { firstDayOfWeek, lastDayOfWeek }); // Add this
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//       console.log("🔍 DEBUG - Custom filter:", { startDate, endDate }); // Add this
//     }

//     console.log("🔍 DEBUG - Final MongoDB query:", JSON.stringify(query, null, 2)); // Add this

//     const bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//       .populate("treatmentId", "status validTill")
//       .populate("invoiceId")
//       .sort({ appointmentDate: -1, createdAt: -1 });

//     console.log("🔍 DEBUG - Raw bookings found:", bookings.length); // Add this
//     console.log("🔍 DEBUG - Sample booking:", bookings[0]); // Add this

//     // Add invoice fields to each booking
//     const bookingsWithInvoiceData = await Promise.all(
//       bookings.map(async (booking) => {
//         let invoiceUrl = null;
//         let isInvoiceGenerated = false;

//         if (booking.treatmentId?.status === "completed" && booking.invoiceId) {
//           isInvoiceGenerated = true;
//           invoiceUrl = booking.invoiceId.invoiceUrl || null;
//         }

//         return {
//           ...booking.toObject(),
//           invoiceUrl,
//           isInvoiceGenerated,
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       count: bookingsWithInvoiceData.length,
//       data: bookingsWithInvoiceData,
//       debug: {
//         patientId,
//         queryParams: req.query,
//         mongoQuery: query,
//         rawCount: bookings.length,
//       },
//     });
//   } catch (error) {
//     console.error("Get booked services error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booked services",
//       error: error.message,
//     });
//   }
// };


// exports.getBookedServicesByPatientId = [
//   upload.single('attachment'),
//   catchAsync(async (req, res) => {
//     const patientId = req.params.patientId;
//     const { details = "basic", download, dateFilterType, startDate, endDate, treatmentId: queryTreatmentId } = req.query;

//     const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');
//     await fs.mkdir(UPLOADS_DIR, { recursive: true });

//     // 🔥 PDF DOWNLOAD
//     if (download && mongoose.Types.ObjectId.isValid(download)) {
//       return handlePdfDownload(req, res, download, UPLOADS_DIR);
//     }

//     // VALIDATE PATIENT
//     if (!mongoose.Types.ObjectId.isValid(patientId)) {
//       return res.status(400).json({ success: false, message: "Invalid patient ID" });
//     }

//     const patient = await Patient.findById(patientId) || await User.findById(patientId);
//     if (!patient) {
//       return res.status(404).json({ success: false, message: "Patient not found" });
//     }

//     // BUILD QUERY
//     let query = { patientId };
//     if (queryTreatmentId && mongoose.Types.ObjectId.isValid(queryTreatmentId)) {
//       query.treatmentId = queryTreatmentId;
//     }

//     // DATE FILTERS
//     if (dateFilterType === "today") {
//       const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//     } else if (dateFilterType === "month") {
//       const now = new Date();
//       const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       firstDayOfMonth.setHours(0, 0, 0, 0);
//       const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//       lastDayOfMonth.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     // FETCH BOOKINGS
//     const bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes price")
//       .populate("servicePartnerId", "name email phone firstName")
//       .populate("treatmentId", "status validTill")
//       .sort({ appointmentDate: -1 });

//     // STATS
//     const stats = {
//       totalSessions: bookings.length,
//       completedSessions: bookings.filter(b => ["Completed", "TreatmentCompleted"].includes(b.status)).length,
//       approvedSessions: bookings.filter(b => b.status === "Approved").length,
//       pendingSessions: bookings.filter(b => b.status === "Pending").length,
//       progressPercentage: bookings.length > 0 ? Math.round((stats.completedSessions / bookings.length) * 100) : 0,
//     };

//     // 🔥 DOWNLOAD LINKS
//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? 'https://api.rehabmedico.in/api'
//       : `${req.protocol}://${req.get('host')}`;

//     const bookingsWithLinks = bookings.map(booking => {
//       const hasInvoice = Boolean(booking.isInvoiceGenerated);
//       const isDownloadable = ["Approved", "Completed", "TreatmentCompleted"].includes(booking.status);

//       return {
//         ...booking.toObject(),
//         isInvoiceGenerated: hasInvoice,
//         invoiceStatus: hasInvoice ? '✅ Generated' : '⚠️ Pending',
//         downloadUrl: `${baseUrl}/v1/booking/patient/${patientId}/bookings?download=${booking._id}`,
//         directLocalUrl: `${baseUrl.replace('/api', '')}/invoices/INV-${booking._id.slice(-8)}.pdf`,
//         canDownload: isDownloadable,
//         buttonText: hasInvoice ? '📥 Download PDF' : '➕ Generate PDF',
//         buttonType: hasInvoice ? 'success' : 'warning',
//       };
//     });

//     const response = {
//       success: true,
//       count: bookings.length,
//       stats,
//       data: bookingsWithLinks,
//     };

//     if (details === "full") {
//       const invoices = await Invoice.find({ bookingId: { $in: bookings.map(b => b._id) } });
//       response.invoices = invoices.map(inv => ({
//         ...inv.toObject(),
//         downloadUrl: `${baseUrl}/v1/booking/patient/${patientId}/bookings?download=${inv.bookingId}`,
//       }));
//     }

//     res.status(200).json(response);
//   })
// ];

// 🔥 SHARED PDF DOWNLOAD HANDLER

// This is exported as getBookedServicesByPatientId
// exports.getBookedServicesByPatientId = catchAsync(async (req, res, next) => {
//   const patientId = req.params.patientId; // from route `/patient/:patientId/bookings`
//   const { details = "basic", dateFilterType, startDate, endDate, treatmentId: queryTreatmentId } = req.query;

//   if (!mongoose.Types.ObjectId.isValid(patientId)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid patient ID format",
//     });
//   }

//   // 1. Optional: verify patient exists (if you want)
//   const patient = await Patient.findById(patientId);
//   if (!patient) {
//     return res.status(404).json({
//       success: false,
//       message: "Patient not found",
//     });
//   }

//   // 2. Build Booking filter (by patientId)
//   let query = { patientId };

//   // Optional: also filter by treatmentId from query
//   if (queryTreatmentId) {
//     if (!mongoose.Types.ObjectId.isValid(queryTreatmentId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid treatment ID format",
//       });
//     }
//     query.treatmentId = queryTreatmentId;
//   }

//   // 3. Date filters (same as before)
//   if (dateFilterType === "today") {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//   } else if (dateFilterType === "week") {
//     const now = new Date();
//     const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//     firstDayOfWeek.setHours(0, 0, 0, 0);
//     const lastDayOfWeek = new Date(firstDayOfWeek);
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//     lastDayOfWeek.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//   } else if (dateFilterType === "month") {
//     const now = new Date();
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     firstDayOfMonth.setHours(0, 0, 0, 0);
//     const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//     lastDayOfMonth.setHours(23, 59, 59, 999);
//     query.appointmentDate = { $gte: firstDayOfMonth, $lte: lastDayOfMonth };
//   } else if (dateFilterType === "custom" && startDate && endDate) {
//     query.appointmentDate = {
//       $gte: new Date(startDate),
//       $lte: new Date(endDate),
//     };
//   }

//   // 4. Get filtered bookings – latest on top
//   const bookings = await Booking.find(query)
//     .populate("serviceId", "name category modes")
//     .populate("servicePartnerId", "firstName lastName email mobile phone")
//     .populate("treatmentId", "status validTill")
//     .sort({ appointmentDate: -1 }); // latest booking first

//   // 5. Stats (unchanged)
//   const totalBookings = bookings.length;
//   const completedBookings = bookings.filter((b) =>
//     ["Completed", "TreatmentCompleted"].includes(b.status)
//   ).length;
//   const progressPercentage =
//     totalBookings > 0
//       ? Math.round((completedBookings / totalBookings) * 100)
//       : 0;

//   const stats = {
//     totalSessions: totalBookings,
//     completedSessions: completedBookings,
//     pendingSessions: bookings.filter((b) => b.status === "Pending").length,
//     inProgressSessions: bookings.filter((b) => b.status === "In-Progress").length,
//     progressPercentage,
//   };

//   const response = {
//     success: true,
//     count: bookings.length,
//     data: bookings,
//   };

//   if (details === "full") {
//     response.data.invoices = await Invoice.find({
//       bookingId: { $in: bookings.map((b) => b._id) },
//     });
//   }

//   res.status(200).json(response);
// });

//flexible
// exports.getBookedServicesByPatientId = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.params.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required",
//       });
//     }

//     const { status, dateFilterType, startDate, endDate, generateInvoice } = req.query;

//     let query = { patientId };
//     if (status) query.status = status;

//     // Date filters logic
//     if (dateFilterType === "today") {
//       const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     // 1. Initial Data Fetch
//     let bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//       .populate("treatmentId", "status validTill")
//       .populate("patientId", "firstName phone")
//       .lean(); // Use lean for faster processing and easier object manipulation

//     let invoicesGeneratedCount = 0;

//     // 2. 🔥 Auto-Generate Invoices if requested
//     if (generateInvoice === 'true') {
//       const completedWithoutInvoice = bookings.filter(b => 
//         b.treatmentStatus === 'Completed' && !b.invoiceUrl
//       );

//       for (const booking of completedWithoutInvoice) {
//         try {
//           const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//           // Generate PDF Buffer
//           const pdfBuffer = await new Promise((resolve, reject) => {
//             const doc = new PDFDocument({ margin: 40 });
//             let buffers = [];
//             doc.on('data', buffers.push.bind(buffers));
//             doc.on('end', () => resolve(Buffer.concat(buffers)));
//             doc.on('error', reject);

//             doc.fontSize(20).text("MEDICO PLATFORM", { align: "center" }).moveDown();
//             doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
//             doc.text(`Patient: ${booking.patientId?.firstName || 'N/A'}`);
//             doc.text(`Service: ${booking.serviceId?.name || 'N/A'}`);
//             doc.text(`Date: ${new Date().toLocaleDateString()}`);
//             doc.moveDown();
//             doc.fontSize(14).text(`Total Amount: ₹${booking.pricing?.totalAmount || 0}`, { bold: true });
//             doc.end();
//           });

//           // Upload to Storage
//           const file = { originalname: `${invoiceNumber}.pdf`, buffer: pdfBuffer };
//           const pdfUrl = await uploadFile(file);

//           // Update Database
//           await Booking.findByIdAndUpdate(booking._id, {
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true
//           });

//           const newInvoice = new Invoice({
//             invoiceNumber,
//             bookingId: booking._id,
//             patientId: booking.patientId?._id || booking.patientId,
//             doctorId: booking.servicePartnerId?._id,
//             billingDetails: booking.pricing,
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true
//           });
//           await newInvoice.save();

//           invoicesGeneratedCount++;
//         } catch (err) {
//           console.error(`Error generating invoice for ${booking._id}:`, err.message);
//         }
//       }

//       // 3. RE-FETCH to get updated URLs in response
//       bookings = await Booking.find(query)
//         .populate("serviceId", "name category modes")
//         .populate("servicePartnerId", "firstName lastName email mobile phone")
//         .populate("treatmentId", "status validTill")
//         .populate("patientId", "firstName phone")
//         .lean()
//         .sort({ appointmentDate: -1, createdAt: -1 });
//     }

//     // 4. Final Response
//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings,
//       invoicesGenerated: invoicesGeneratedCount,
//       generateInvoiceUsed: generateInvoice === 'true'
//     });

//   } catch (error) {
//     console.error("Get booked services error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booked services",
//       error: error.message,
//     });
//   }
// };


//me
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;
//     const {
//       serviceId,
//       appointmentDate,
//       startTime,
//       endTime,
//       duration,
//       shiftType,
//       servicePartnerId,
//       notes,
//       category,
//       modes,
//       cityId
//     } = req.body;

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
//     let bookingCity = cityId
//       ? await City.findById(cityId).session(session)
//       : await City.findById(patient.address.cityId).session(session);

//     if (!bookingCity) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Invalid city" });
//     }

//     // 4) Check slot conflicts
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);

//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime
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
//     const totalAmount = Number(pricing?.totalAmount || 0);

//     // ✅ Optional payment at booking time
//     const payNow = req.body.payNow === true || req.body.payNow === "true";
//     const advanceAmount = payNow ? Number(req.body.advanceAmount || 0) : 0;

//     if (advanceAmount < 0 || advanceAmount > totalAmount) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "Invalid advance amount",
//       });
//     }

//     const paidAmount = advanceAmount;
//     const dueAmount = totalAmount - paidAmount;

//     let paymentStatus = "Unpaid";
//     if (paidAmount > 0 && dueAmount > 0) paymentStatus = "Partially Paid";
//     if (dueAmount === 0 && totalAmount > 0) paymentStatus = "Paid";

//     // -------------------------------
//     // ✅ CREATE BOOKING FIRST
//     // -------------------------------
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { userId: patientId, userModel: "Patient" },
//       treatmentStatus: "Active",
//       invoiceGenerated: false,

//       // ✅ Payment option integrated
//       payNow: false, // booking create ke time mandatory payment nahi
//       advanceAmount,
//       paidAmount,
//       dueAmount,
//       paymentStatus,
//       paymentMethod: paidAmount > 0 ? "Online" : "None",
//       paymentRequiredAt: "TreatmentCompletion",
//       isAdvancePaid: paidAmount > 0,
//       isFinalPaymentDone: dueAmount === 0,
//       paymentHistory:
//         paidAmount > 0
//           ? [
//               {
//                 amount: paidAmount,
//                 method: "Online",
//                 stage: "Booking",
//                 note: "Advance payment at booking time",
//               },
//             ]
//           : [],
//     });

//     await newBooking.save({ session });

// let razorpayOrder = null;

// if (payNow && advanceAmount > 0) {
//   razorpayOrder = await razorpayInstance.orders.create({
//     amount: Math.round(advanceAmount * 100), // in paise
//     currency: "INR",
//     receipt: `booking_${newBooking._id}`,
//     notes: {
//       bookingId: String(newBooking._id),
//       patientId: String(patientId),
//       serviceId: String(serviceId),
//     },
//   });

//   newBooking.lastRazorpayOrderId = razorpayOrder.id;
//   await newBooking.save({ session });
// }

// // res.status(201).json({
// //   success: true,
// //   message: "Booking & Treatment created successfully",
// //   data: {
// //     booking: populatedBooking,
// //     treatmentId: treatment._id,
// //     razorpay: razorpayOrder
// //       ? {
// //           orderId: razorpayOrder.id,
// //           amount: razorpayOrder.amount,
// //           currency: razorpayOrder.currency,
// //           key: process.env.RAZORPAY_API_KEY,
// //         }
// //       : null,
// //   }
// // });


//     // -------------------------------
//     // ✅ CREATE TREATMENT WITH bookingId
//     // -------------------------------
//     const treatment = new Treatment({
//       bookingId: newBooking._id,
//       patientId,
//       serviceId,
//       servicePartnerId: servicePartnerId || null,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       status: "Active"
//     });

//     await treatment.save({ session });

//     // -------------------------------
//     // ✅ LINK BOOKING → TREATMENT
//     // -------------------------------
//     newBooking.treatmentId = treatment._id;
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate("city", "name latitude longitude")
//       .populate("treatmentId", "status validTill");

//     // res.status(201).json({
//     //   success: true,
//     //   message: "Booking & Treatment created successfully",
//     //   data: {
//     //     booking: populatedBooking,
//     //     treatmentId: treatment._id
//     //   }
//     // });
// return res.status(201).json({
//   success: true,
//   message: "Booking & Treatment created successfully",
//   data: {
//     booking: populatedBooking,
//     treatmentId: treatment._id,
//     razorpay: razorpayOrder
//       ? {
//           orderId: razorpayOrder.id,
//           amount: razorpayOrder.amount,
//           currency: razorpayOrder.currency,
//           key: process.env.RAZORPAY_API_KEY,
//         }
//       : null,
//   }
// });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating booking:", error);

//     res.status(500).json({
//       success: false,
//       message: "Error creating booking",
//       error: error.message
//     });

//   } finally {
//     session.endSession();
//   }
// };



// const Treatment = require("../models/treatmentModel");
const paymentController = require("../controller/payController");

// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       treatmentId,
//       patientId,
//       servicePartnerId,
//       pricing,
//       bookingDate,
//       slot,
//       paymentOption,
//       amount,
//       ...rest
//     } = req.body;

//     let resolvedTreatmentId = treatmentId;

//     if (!resolvedTreatmentId) {
//       const treatment = await Treatment.create({
//         patientId,
//         servicePartnerId,
//         createdBy: req.user?.id || patientId,
//         status: "Active",
//       });
//       resolvedTreatmentId = treatment._id;
//     }

//     const booking = await Booking.create({
//       ...rest,
//       treatmentId: resolvedTreatmentId,
//       patientId,
//       servicePartnerId,
//       bookingDate,
//       slot,
//       pricing: {
//         totalAmount: Number(pricing?.totalAmount || 0),
//         ...pricing,
//       },
//       paymentOption: paymentOption || "PayLater",
//       createdBy: req.user?.id || patientId,
//     });

//     const paymentLedger = await paymentController.ensurePaymentLedgerForBooking({
//       treatmentId: resolvedTreatmentId,
//     });

//     if (paymentOption === "PayNow") {
//       req.params.treatmentId = String(resolvedTreatmentId);
//       req.body.amount = amount || paymentLedger.remainingBalance;
//       return paymentController.createTreatmentOnlineOrder(req, res);
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       data: {
//         booking,
//         payment: {
//           paymentId: paymentLedger._id,
//           treatmentId: paymentLedger.treatmentId,
//           totalBillAmount: paymentLedger.totalBillAmount,
//           totalPaid: paymentLedger.totalPaid,
//           totalRefunded: paymentLedger.totalRefunded,
//           remainingBalance: paymentLedger.remainingBalance,
//           paymentStatus: paymentLedger.paymentStatus,
//         },
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create booking",
//       error: error.message,
//     });
//   }
// };
//latest
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;
//     const {
//       serviceId,
//       appointmentDate,
//       startTime,
//       endTime,
//       duration,
//       shiftType,
//       servicePartnerId,
//       notes,
//       category,
//       modes,
//       cityId,
//     } = req.body;

//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, and endTime are required",
//       });
//     }

//     await session.startTransaction();

//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive || service.isDeleted) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: "Service not found or inactive",
//       });
//     }

//     const patient = await Patient.findById(patientId).select("address.cityId").session(session);
//     if (!patient || !patient.address?.cityId) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "Patient city not set",
//       });
//     }

//     const bookingCity = cityId
//       ? await City.findById(cityId).session(session)
//       : await City.findById(patient.address.cityId).session(session);

//     if (!bookingCity) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "Invalid city",
//       });
//     }

//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);

//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//       status: { $nin: ["Cancelled", "Rejected"] },
//     };

//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const existingActiveBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingActiveBooking) {
//       await session.abortTransaction();
//       return res.status(409).json({
//         success: false,
//         message: "Slot is already reserved for this service",
//       });
//     }

//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) {
//         bookingDuration = service.defaultDuration || 30;
//       }
//     }

//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);
//     const totalAmount = Number(pricing?.totalAmount || 0);

//     const treatment = new Treatment({
//       patientId,
//       serviceId,
//       servicePartnerId: servicePartnerId || null,
//       startDate: new Date(appointmentDate),
//       status: "Active",
//       currentBookingId: null,
//       lastBookingAt: new Date(appointmentDate),
//       invoiceGenerated: false,
//       isActive: true,
//     });

//     await treatment.save({ session });

//     const newBooking = new Booking({
//       treatmentId: treatment._id,
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId: servicePartnerId || null,
//       sessionNumber: 1,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { userId: patientId, userModel: "Patient" },
//       invoiceUrl: null,
//     });

//     await newBooking.save({ session });

//     treatment.currentBookingId = newBooking._id;
//     await treatment.save({ session });

//     const payment = new Payment({
//       treatmentId: treatment._id,
//       patientId,
//       servicePartnerId: servicePartnerId || null,
//       bookingIds: [newBooking._id],
//       totalBillAmount: totalAmount,
//       totalPaid: 0,
//       totalRefunded: 0,
//       remainingBalance: totalAmount,
//       billBreakdown: {
//         subtotal: Number(pricing?.subtotal || 0),
//         gstAmount: Number(pricing?.taxAmount || 0),
//         cgst: 0,
//         sgst: 0,
//         grandTotal: totalAmount,
//       },
//       paymentStatus: "Unpaid",
//       transactions: [],
//       refunds: [],
//     });

//     await payment.save({ session });
//     await session.commitTransaction();

//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate("city", "name latitude longitude")
//       .populate("treatmentId", "status startDate validTill");

//     return res.status(201).json({
//       success: true,
//       message: "Booking, treatment, and payment ledger created successfully.",
//       data: {
//         treatmentId: treatment._id,
//         paymentId: payment._id,
//         booking: populatedBooking,
//         nextStep: "Use /api/v1/payments/treatments/:treatmentId/online/order or /manual-collection to collect payment",
//       },
//     });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     console.error("Error creating booking/treatment/payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating booking",
//       error: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };


//without due amount 
// exports.getBookedServicesByPatientId = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.params.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required",
//       });
//     }

//     const { status, dateFilterType, startDate, endDate, generateInvoice } = req.query;

//     let query = { patientId };
//     if (status) query.status = status;

//     // Date filters logic
//     if (dateFilterType === "today") {
//       const todayStart = new Date();
//       todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date();
//       todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     // 1. Initial Data Fetch
//     let bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//       .populate("treatmentId", "status validTill")  // ✅ treatmentId populated
//       .populate("patientId", "firstName phone")
//       .lean();

//     let invoicesGeneratedCount = 0;

//     // 2. Auto‑Generate Invoices if requested
//     if (generateInvoice === "true") {
//       const completedWithoutInvoice = bookings.filter(
//         (b) => b.treatmentStatus === "Completed" && !b.invoiceUrl
//       );

//       for (const booking of completedWithoutInvoice) {
//         try {
//           const invoiceNumber = `INV-${Date.now()}-${crypto
//             .randomBytes(2)
//             .toString("hex")
//             .toUpperCase()}`;

//           const pdfBuffer = await new Promise((resolve, reject) => {
//             const doc = new PDFDocument({ margin: 40 });
//             let buffers = [];
//             doc.on("data", buffers.push.bind(buffers));
//             doc.on("end", () => resolve(Buffer.concat(buffers)));
//             doc.on("error", reject);

//             doc.fontSize(20).text("MEDICO PLATFORM", { align: "center" }).moveDown();
//             doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
//             doc.text(`Patient: ${booking.patientId?.firstName || "N/A"}`);
//             doc.text(`Service: ${booking.serviceId?.name || "N/A"}`);
//             doc.text(`Date: ${new Date().toLocaleDateString()}`);
//             doc.moveDown();
//             doc.fontSize(14).text(
//               `Total Amount: ₹${booking.pricing?.totalAmount || 0}`,
//               { bold: true }
//             );
//             doc.end();
//           });

//           const file = { originalname: `${invoiceNumber}.pdf`, buffer: pdfBuffer };
//           const pdfUrl = await uploadFile(file);

//           await Booking.findByIdAndUpdate(booking._id, {
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true,
//           });

//           const newInvoice = new Invoice({
//             invoiceNumber,
//             bookingId: booking._id,
//             patientId: booking.patientId?._id || booking.patientId,
//             doctorId: booking.servicePartnerId?._id,
//             billingDetails: booking.pricing,
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true,
//           });
//           await newInvoice.save();

//           invoicesGeneratedCount++;
//         } catch (err) {
//           console.error(`Error generating invoice for ${booking._id}:`, err.message);
//         }
//       }

//       // 3. Re‑fetch to get updated URLs
//       bookings = await Booking.find(query)
//         .populate("serviceId", "name category modes")
//         .populate("servicePartnerId", "firstName lastName email mobile phone")
//         .populate("treatmentId", "status validTill")
//         .populate("patientId", "firstName phone")
//         .lean()
//         .sort({ appointmentDate: -1, createdAt: -1 });
//     }

//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings,
//       invoicesGenerated: invoicesGeneratedCount,
//       generateInvoiceUsed: generateInvoice === "true",
//     });
//   } catch (error) {
//     console.error("Get booked services error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booked services",
//       error: error.message,
//     });
//   }
// };


exports.createBooking = async (req, res) => {
  try {
    const {
      treatmentId,
      serviceId,
      servicePartnerId,
      pricing,
      bookingDate,
      slot,
      startTime,
      endTime,
      sessionNumber, // ✅ REQUIRED
      paymentOption,
      amount,
      ...rest
    } = req.body;

    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID not found in token",
      });
    }

    // ❌ Validate required fields early (better error)
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "startTime and endTime are required",
      });
    }

    if (!sessionNumber) {
      return res.status(400).json({
        success: false,
        message: "sessionNumber is required",
      });
    }

    let resolvedTreatmentId = treatmentId;
    let createdTreatmentInThisRequest = false;

    // ✅ Create Treatment if not provided
    if (!resolvedTreatmentId) {
      const treatment = await Treatment.create({
        patientId,
        servicePartnerId,
        serviceId,
        createdBy: patientId,
        status: "Active",
      });

      resolvedTreatmentId = treatment._id;
      createdTreatmentInThisRequest = true;
    }

    const appointmentDate = rest.appointmentDate || bookingDate;
    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "appointmentDate is required",
      });
    }

    let computedPricing = null;
    if (serviceId) {
      const serviceDoc = await Service.findById(serviceId);
      if (serviceDoc) {
        let durationForPricing = Number(rest.duration || 0);
        if (!durationForPricing && startTime && endTime) {
          const [sh, sm] = String(startTime).split(":").map(Number);
          const [eh, em] = String(endTime).split(":").map(Number);
          const diff = eh * 60 + em - (sh * 60 + sm);
          durationForPricing = diff > 0 ? diff : 0;
        }

        computedPricing = serviceDoc.calculateTotalPrice(
          durationForPricing || undefined,
          false,
          rest.shiftType || null
        );
      }
    }

    const finalPricing = {
      basePrice: Number(pricing?.basePrice ?? computedPricing?.basePrice ?? 0),
      equipmentCharges: Number(
        pricing?.equipmentCharges ?? computedPricing?.equipmentCharges ?? 0
      ),
      subtotal: Number(pricing?.subtotal ?? computedPricing?.subtotal ?? 0),
      taxPercentage: Number(
        pricing?.taxPercentage ?? computedPricing?.taxPercentage ?? 0
      ),
      taxAmount: Number(pricing?.taxAmount ?? computedPricing?.taxAmount ?? 0),
      totalAmount: Number(pricing?.totalAmount ?? computedPricing?.totalAmount ?? 0),
    };

    // ✅ Create Booking (FIXED STRUCTURE)
    const booking = await Booking.create({
      ...rest,
      treatmentId: resolvedTreatmentId,
      patientId,
      serviceId,
      servicePartnerId,
      appointmentDate: new Date(appointmentDate),
      slot,

      // ✅ FIXED: match schema
      slotTime: {
        startTime,
        endTime,
      },

      sessionNumber, // ✅ REQUIRED FIELD

      pricing: finalPricing,

      paymentOption: paymentOption || "PayLater",
      createdBy: patientId,
    });

    const treatmentPatch = {
      currentBookingId: booking._id,
      lastBookingAt: new Date(appointmentDate),
    };

    if (createdTreatmentInThisRequest) {
      treatmentPatch.bookingId = booking._id;
    }

    await Treatment.findByIdAndUpdate(resolvedTreatmentId, {
      $set: treatmentPatch,
    });

    // ✅ Payment Ledger
    const paymentLedger =
      await paymentController.ensurePaymentLedgerForBooking({
        treatmentId: resolvedTreatmentId,
      });

    // ✅ Pay Now flow
    if (paymentOption === "PayNow") {
      req.params.treatmentId = String(resolvedTreatmentId);
      req.body.amount = amount || paymentLedger.remainingBalance;

      return paymentController.createTreatmentOnlineOrder(req, res);
    }

    // ✅ Payment calculations
    const totalAmount =
      Number(paymentLedger?.totalBillAmount) ||
      Number(booking?.pricing?.totalAmount) ||
      0;

    const paidAmount = Number(paymentLedger?.totalPaid || 0);
    const refundedAmount = Number(paymentLedger?.totalRefunded || 0);

    const dueAmount = Number(
      paymentLedger?.remainingBalance ??
        Math.max(totalAmount - paidAmount + refundedAmount, 0)
    );

    const paymentStatusRaw = paymentLedger?.paymentStatus || "Unpaid";
    const paymentStatus = paymentStatusRaw.toLowerCase();

    const isPaymentPending =
      paymentStatus === "pending" ||
      paymentStatus === "partially paid" ||
      paymentStatus === "unpaid" ||
      dueAmount > 0;

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        booking,
        payment: {
          paymentId: paymentLedger._id,
          treatmentId: paymentLedger.treatmentId,
          totalBillAmount: totalAmount,
          totalPaid: paidAmount,
          totalRefunded: refundedAmount,
          remainingBalance: dueAmount,
          paymentStatus: paymentStatusRaw,
          isPaymentPending,
        },
      },
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};




exports.getBookedServicesByPatientId = async (req, res) => {
  try {
    const patientId = req.user?.id || req.params.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const {
      status,
      dateFilterType,
      startDate,
      endDate,
      generateInvoice,
      details = "basic",
    } = req.query;

    const query = { patientId };

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
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
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

    const fetchBookings = async () =>
      Booking.find(query)
        .populate("serviceId", "name category modes")
        .populate("servicePartnerId", "firstName lastName email mobile phone")
        .populate("treatmentId", "status validTill")
        .populate("patientId", "firstName phone")
        .lean()
        .sort({ appointmentDate: -1, createdAt: -1 });

    const enrichBookingsWithPaymentDetails = async (bookingDocs) => {
      if (details !== "full" || !bookingDocs.length) {
        return bookingDocs;
      }

      const treatmentIds = [
        ...new Set(
          bookingDocs
            .map((booking) =>
              booking.treatmentId?._id
                ? String(booking.treatmentId._id)
                : booking.treatmentId
                ? String(booking.treatmentId)
                : null
            )
            .filter(Boolean)
        ),
      ];

      const payments = treatmentIds.length
        ? await Payment.find({ treatmentId: { $in: treatmentIds } }).lean()
        : [];
      const paymentMap = new Map(
        payments.map((payment) => [String(payment.treatmentId), payment])
      );

      return bookingDocs.map((booking) => {
        const treatmentId = booking.treatmentId?._id
          ? String(booking.treatmentId._id)
          : booking.treatmentId
          ? String(booking.treatmentId)
          : null;
        const payment = treatmentId ? paymentMap.get(treatmentId) : null;
        const transactions = Array.isArray(payment?.transactions)
          ? payment.transactions
          : [];
        const paidTransactions = transactions.filter(
          (transaction) => transaction.status === "Paid"
        );
        const advanceAmount = paidTransactions
          .filter((transaction) => transaction.stage === "Advance")
          .reduce(
            (sum, transaction) =>
              sum + Number(transaction.amountPaid ?? transaction.amount ?? 0),
            0
          );
        const latestPaidTransaction = [...paidTransactions].sort(
          (left, right) =>
            new Date(right.paidAt || right.createdAt || 0) -
            new Date(left.paidAt || left.createdAt || 0)
        )[0];
        const latestOnlineTransaction = [...paidTransactions]
          .filter(
            (transaction) =>
              transaction.method === "Online" ||
              transaction.gateway === "Razorpay"
          )
          .sort(
            (left, right) =>
              new Date(right.paidAt || right.createdAt || 0) -
              new Date(left.paidAt || left.createdAt || 0)
          )[0];
        const paidAmount = Number(
          payment?.totalPaid ?? payment?.totals?.totalPaid ?? 0
        );
        const totalRefunded = Number(
          payment?.totalRefunded ?? payment?.totals?.totalRefunded ?? 0
        );
        const baseBillAmount = Number(
          payment?.totalBillAmount ??
            payment?.billableAmount ??
            booking.pricing?.totalAmount ??
            0
        );
        const dueAmount = Number(
          payment?.remainingBalance ??
            payment?.totals?.remainingBalance ??
            Math.max(baseBillAmount - paidAmount + totalRefunded, 0)
        );
        const rawPaymentStatus = payment?.paymentStatus || "Unpaid";

        return {
          ...booking,
          treatmentStatus: booking.treatmentId?.status || null,
          paymentStatus:
            rawPaymentStatus === "PartialRefund"
              ? "Partial Refund"
              : rawPaymentStatus,
          paymentMethod: latestPaidTransaction?.method || "None",
          advanceAmount,
          paidAmount,
          dueAmount,
          isAdvancePaid: advanceAmount > 0,
          isFinalPaymentDone: paidAmount > 0 && dueAmount === 0,
          lastRazorpayOrderId: latestOnlineTransaction?.razorpayOrderId || null,
          lastRazorpayPaymentId:
            latestOnlineTransaction?.razorpayPaymentId || null,
          paymentHistory: transactions.map((transaction) => ({
            amount: Number(transaction.amountPaid ?? transaction.amount ?? 0),
            method: transaction.method || "None",
            stage: transaction.stage || null,
            razorpayOrderId: transaction.razorpayOrderId || null,
            razorpayPaymentId: transaction.razorpayPaymentId || null,
            note: transaction.note || "",
            paidAt: transaction.paidAt || null,
            status: transaction.status || null,
          })),
        };
      });
    };

    let bookings = await fetchBookings();
    let invoicesGeneratedCount = 0;

    if (generateInvoice === "true") {
      const completedWithoutInvoice = bookings.filter(
        (booking) =>
          booking.treatmentId?.status === "Completed" && !booking.invoiceUrl
      );

      for (const booking of completedWithoutInvoice) {
        try {
          const invoiceNumber = `INV-${Date.now()}-${crypto
            .randomBytes(2)
            .toString("hex")
            .toUpperCase()}`;

          const pdfBuffer = await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40 });
            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);

            doc.fontSize(20).text("MEDICO PLATFORM", { align: "center" }).moveDown();
            doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
            doc.text(`Patient: ${booking.patientId?.firstName || "N/A"}`);
            doc.text(`Service: ${booking.serviceId?.name || "N/A"}`);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown();
            doc.fontSize(14).text(
              `Total Amount: Rs.${booking.pricing?.totalAmount || 0}`,
              { bold: true }
            );
            doc.end();
          });

          const file = {
            originalname: `${invoiceNumber}.pdf`,
            buffer: pdfBuffer,
          };

          const pdfUrl = await uploadFile(file);

          await Booking.findByIdAndUpdate(booking._id, {
            invoiceUrl: pdfUrl,
            isInvoiceGenerated: true,
          });

          const newInvoice = new Invoice({
            invoiceNumber,
            bookingId: booking._id,
            patientId: booking.patientId?._id || booking.patientId,
            doctorId: booking.servicePartnerId?._id,
            billingDetails: booking.pricing,
            invoiceUrl: pdfUrl,
            isInvoiceGenerated: true,
          });

          await newInvoice.save();
          invoicesGeneratedCount++;
        } catch (err) {
          console.error(`Error generating invoice for ${booking._id}:`, err.message);
        }
      }

      bookings = await fetchBookings();
    }

    const responseData = await enrichBookingsWithPaymentDetails(bookings);

    return res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData,
      detailsUsed: details,
      invoicesGenerated: invoicesGeneratedCount,
      generateInvoiceUsed: generateInvoice === "true",
    });
  } catch (error) {
    console.error("Get booked services error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booked services",
      error: error.message,
    });
  }
};
// exports.getBookedServicesByPatientId = async (req, res) => {
//   try {
//     const patientId = req.user && req.user.id ? req.user.id : req.params.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Patient ID is required",
//       });
//     }

//     const { status, dateFilterType, startDate, endDate, generateInvoice } = req.query;

//     let query = { patientId };
//     if (status) query.status = status;

//     // Date filters logic
//     if (dateFilterType === "today") {
//       const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
//     } else if (dateFilterType === "week") {
//       const now = new Date();
//       const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
//       firstDayOfWeek.setHours(0, 0, 0, 0);
//       const lastDayOfWeek = new Date(firstDayOfWeek);
//       lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
//       lastDayOfWeek.setHours(23, 59, 59, 999);
//       query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
//     } else if (dateFilterType === "custom" && startDate && endDate) {
//       query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     // 1. Initial Data Fetch
//     let bookings = await Booking.find(query)
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//       .populate("treatmentId", "status validTill")
//       .populate("patientId", "firstName phone")
//       .lean();

//     let invoicesGeneratedCount = 0;

//     // 2. 🔥 Auto-Generate Invoices if requested
//     if (generateInvoice === 'true') {
//       const completedWithoutInvoice = bookings.filter(b => 
//         b.treatmentStatus === 'Completed' && !b.invoiceUrl
//       );

//       for (const booking of completedWithoutInvoice) {
//         try {
//           const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//           // Generate PDF Buffer
//           const pdfBuffer = await new Promise((resolve, reject) => {
//             const doc = new PDFDocument({ margin: 40 });
//             let buffers = [];
//             doc.on('data', buffers.push.bind(buffers));
//             doc.on('end', () => resolve(Buffer.concat(buffers)));
//             doc.on('error', reject);

//             doc.fontSize(20).text("MEDICO PLATFORM", { align: "center" }).moveDown();
//             doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
//             doc.text(`Patient: ${booking.patientId?.firstName || 'N/A'}`);
//             doc.text(`Service: ${booking.serviceId?.name || 'N/A'}`);
//             doc.text(`Date: ${new Date().toLocaleDateString()}`);
//             doc.moveDown();
//             doc.fontSize(14).text(`Total Amount: ₹${booking.pricing?.totalAmount || 0}`, { bold: true });
//             doc.end();
//           });

//           // Upload to Storage
//           const file = { originalname: `${invoiceNumber}.pdf`, buffer: pdfBuffer };
//           const pdfUrl = await uploadFile(file);

//           // Update Database
//           await Booking.findByIdAndUpdate(booking._id, {
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true
//           });

//           const newInvoice = new Invoice({
//             invoiceNumber,
//             bookingId: booking._id,
//             patientId: booking.patientId?._id || booking.patientId,
//             doctorId: booking.servicePartnerId?._id,
//             billingDetails: booking.pricing,
//             invoiceUrl: pdfUrl,
//             isInvoiceGenerated: true
//           });
//           await newInvoice.save();

//           invoicesGeneratedCount++;
//         } catch (err) {
//           console.error(`Error generating invoice for ${booking._id}:`, err.message);
//         }
//       }

//       // 3. RE-FETCH to get updated URLs in response
//       bookings = await Booking.find(query)
//         .populate("serviceId", "name category modes")
//         .populate("servicePartnerId", "firstName lastName email mobile phone")
//         .populate("treatmentId", "status validTill")
//         .populate("patientId", "firstName phone")
//         .lean()
//         .sort({ appointmentDate: -1, createdAt: -1 });
//     }

//     // 4. Final Response
//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings,
//       invoicesGenerated: invoicesGeneratedCount,
//       generateInvoiceUsed: generateInvoice === 'true'
//     });

//   } catch (error) {
//     console.error("Get booked services error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booked services",
//       error: error.message,
//     });
//   }
// };
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
      .populate("servicePartnerId", "firstName lastName email mobile phone")
        .populate("treatmentId", "status validTill") 
      .sort({ appointmentDate: -1, createdAt: -1 });

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

// exports.rescheduleBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const {
//       appointmentDate,
//       startTime,
//       endTime,
//       duration,
//       shiftType,
//       servicePartnerId,
//     } = req.body;

//     if (!bookingId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Booking ID, appointmentDate, startTime, and endTime are required for rescheduling",
//       });
//     }

//     const booking = await Booking.findById(bookingId).populate("serviceId");
//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     if (["Cancelled", "Rejected"].includes(booking.status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot reschedule cancelled or rejected bookings",
//       });
//     }

//     const service = booking.serviceId;

//     // Check for conflicting booking in new slot
//     const dateObj = new Date(appointmentDate);
//     const dayStart = new Date(dateObj.setHours(0, 0, 0, 0));
//     const dayEnd = new Date(dateObj.setHours(23, 59, 59, 999));

//     const conflictQuery = {
//       _id: { $ne: bookingId },
//       serviceId: service._id,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//     };

//     if (servicePartnerId) {
//       conflictQuery.servicePartnerId = servicePartnerId;
//     }

//     const conflict = await Booking.findOne(conflictQuery);
//     if (conflict) {
//       return res.status(409).json({
//         success: false,
//         message: "The selected slot is already booked. Choose another slot.",
//       });
//     }

//     // Calculate duration if not provided
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = eh * 60 + em - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }

//     // Recalculate pricing
//     const pricing = service.calculateTotalPrice(
//       bookingDuration,
//       false,
//       shiftType || booking.shiftType || null
//     );

//     // Update booking
//     booking.appointmentDate = new Date(appointmentDate);
//     booking.slotTime = { startTime, endTime };
//     booking.duration = bookingDuration;
//     booking.shiftType = shiftType || booking.shiftType || null;
//     booking.servicePartnerId =
//       servicePartnerId || booking.servicePartnerId || null;
//     booking.pricing = pricing;
//     booking.status = "Rescheduled";

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: "Booking rescheduled successfully",
//       data: {
//         ...booking.toObject(),
//         formattedDuration: formatDuration(bookingDuration),
//         serviceCategory: service.category,
//       },
//     });
//   } catch (error) {
//     console.error("Reschedule booking error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error rescheduling booking",
//       error: error.message,
//     });
//   }
// };


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


exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // ✅ Safe: check req.body first
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing. Please send appointmentDate, startTime and endTime.",
      });
    }

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
          "Booking ID, appointmentDate, startTime, and endTime are required",
        received: Object.keys(req.body || {}),
      });
    }

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["Cancelled", "Rejected"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule cancelled or rejected bookings",
      });
    }

    const service = booking.serviceId;

    // Check conflicting slot
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

    // Calculate duration
    let bookingDuration = duration;
    if (!bookingDuration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      bookingDuration = eh * 60 + em - (sh * 60 + sm);
      if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
    }

    const pricing = service.calculateTotalPrice(
      bookingDuration,
      false,
      shiftType || booking.shiftType || null
    );

    // Update booking (⚠️ treatmentId NOT changed = same for next booking)
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        appointmentDate: new Date(appointmentDate),
        slotTime: { startTime, endTime },
        duration: bookingDuration,
        shiftType: shiftType || booking.shiftType || null,
        servicePartnerId: servicePartnerId || booking.servicePartnerId || null,
        pricing,
        status: "Rescheduled",
        // ✅ treatmentId field not touched here
      },
      { new: true, runValidators: true }
    )
      .populate("serviceId", "name category modes")
      .populate("servicePartnerId", "firstName lastName email mobile phone")
      .populate("treatmentId", "status validTill")  // ✅ shows in response
      .populate("patientId", "firstName phone")
      .lean();

    res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully",
      data: {
        ...updatedBooking,
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

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body || {}; // Patient cancellation reason
    
    if (!bookingId) {
      return res
        .status(400)
        .json({ 
        success: false, 
        message: "Booking ID is required" 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking already cancelled' 
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

      {
  $lookup: {
    from: "treatments",
    localField: "treatmentId",
    foreignField: "_id",
    as: "treatment",
  },
},
{ $unwind: { path: "$treatment", preserveNullAndEmptyArrays: true } },

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

// exports.getByIdBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     if (!bookingId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Booking ID is required" });
//     }

//     const booking = await Booking.findById(bookingId)
//       .populate("patientId", "firstName email phone")
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone");
      
   

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     res.status(200).json({
//       success: true,
//       data: booking,
//     });
//   } catch (error) {
//     console.error("Get booking by ID error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booking",
//       error: error.message,
//     });
//   }
// };

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

exports.getByIdBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("patientId", "firstName lastName email phone profilePhoto allergies currentMedications medicalHistory address createdAt")
      .populate("serviceId", "name category modes basePrice taxPercentage description")
      .populate({
        path: "servicePartnerId",
        select: "firstName lastName email mobile yearsOfExperience rating serviceCities services documents.profilePhoto availability isAvailable",
        populate: {
          path: "serviceCities",
          select: "name"
        }
      })
      .populate("city", "name")
      .populate("treatmentId", "status validTill startDate endDate currentBookingId servicePartnerId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const now = new Date();

    // Format provider response
    let provider = null;
    if (booking.servicePartnerId) {
      provider = {
        id: booking.servicePartnerId._id,
        firstName: booking.servicePartnerId.firstName,
        lastName: booking.servicePartnerId.lastName,
        name: `${booking.servicePartnerId.firstName || ""} ${booking.servicePartnerId.lastName || ""}`.trim(),
        email: booking.servicePartnerId.email,
        phone: booking.servicePartnerId.mobile,
        city: (booking.servicePartnerId.serviceCities || []).map((c) => c.name),
        yearsOfExperience: booking.servicePartnerId.yearsOfExperience || null,
        rating: booking.servicePartnerId.rating?.average || 0,
        isAvailable: booking.servicePartnerId.isAvailable,
        profilePhoto: booking.servicePartnerId.documents?.profilePhoto || null,
      };
    }

    const patient = booking.patientId;
    const treatment = booking.treatmentId;
    const service = booking.serviceId;

    const paymentLedger = treatment?._id
      ? await Payment.findOne({ treatmentId: treatment._id })
          .select(
            "paymentStatus totalBillAmount totalPaid totalRefunded remainingBalance invoiceId currency transactions refunds updatedAt createdAt"
          )
          .populate("transactions.collectedBy", "firstName lastName email")
          .populate("refunds.adminId", "firstName lastName email")
          .populate("refunds.approvedBy", "firstName lastName email")
          .lean()
      : null;

    const allPatientBookings = await Booking.find({
      patientId: booking.patientId,
      _id: { $ne: booking._id },
      status: { $nin: ["Cancelled", "Rejected"] },
    })
      .select("_id appointmentDate status")
      .sort({ appointmentDate: -1 })
      .lean();

    const completedHistory = allPatientBookings.filter((entry) =>
      ["Completed", "TreatmentCompleted"].includes(String(entry.status || ""))
    );

    const lastVisitDate = completedHistory.length
      ? completedHistory[0].appointmentDate
      : null;

    const treatmentBookings = treatment?._id
      ? await Booking.find({ treatmentId: treatment._id })
          .select("_id appointmentDate status sessionNumber servicePartnerId")
          .sort({ sessionNumber: 1, appointmentDate: 1 })
          .lean()
      : [];

    const currentIndex = treatmentBookings.findIndex(
      (entry) => String(entry._id) === String(booking._id)
    );
    const previousBooking = currentIndex > 0 ? treatmentBookings[currentIndex - 1] : null;
    const nextBooking =
      currentIndex >= 0 && currentIndex < treatmentBookings.length - 1
        ? treatmentBookings[currentIndex + 1]
        : null;
    const completedSessions = treatmentBookings.filter((entry) =>
      ["Completed", "TreatmentCompleted"].includes(String(entry.status || ""))
    ).length;

    const alternativeProviders = booking.city?._id
      ? await ServiceProvider.find({
          _id: { $ne: booking.servicePartnerId?._id },
          isDeleted: { $ne: true },
          isActive: true,
          approvalStatus: "Approved",
          serviceCities: booking.city._id,
          "services.serviceId": booking.serviceId?._id,
        })
          .select(
            "firstName lastName email mobile yearsOfExperience rating serviceCities documents.profilePhoto"
          )
          .populate("serviceCities", "name")
          .limit(3)
          .lean()
      : [];

    const similarServices = await Service.find({
      _id: { $ne: booking.serviceId?._id },
      isActive: true,
      category: booking.serviceId?.category,
      ...(booking.city?._id ? { cities: booking.city._id } : {}),
    })
      .select("name category description basePrice taxPercentage")
      .limit(3)
      .lean();

    const isOverdue =
      booking.appointmentDate &&
      new Date(booking.appointmentDate).getTime() < now.getTime() &&
      !["Completed", "Cancelled", "Rejected", "TreatmentCompleted"].includes(
        String(booking.status || "")
      );

    const actionRecommendations = [];
    const bookingStatus = String(booking.status || "");
    const paymentStatus = String(paymentLedger?.paymentStatus || booking.paymentStatus || "Unpaid");
    const treatmentStatus = String(treatment?.status || "Active");
    const treatmentValidityMs = treatment?.validTill
      ? new Date(treatment.validTill).getTime() - now.getTime()
      : null;
    const treatmentNearExpiry =
      treatmentValidityMs !== null &&
      treatmentValidityMs > 0 &&
      treatmentValidityMs <= 48 * 60 * 60 * 1000;

    if (bookingStatus === "Pending") {
      actionRecommendations.push({
        key: "approve-booking",
        severity: "high",
        message: "Booking request is pending review.",
        cta: "Approve Booking",
        targetStatus: "Approved",
      });
      actionRecommendations.push({
        key: "review-request",
        severity: "medium",
        message: "Verify schedule, provider and payment preconditions.",
        cta: "Review Request",
        targetStatus: "Pending",
      });
    }
    if (bookingStatus === "Approved") {
      actionRecommendations.push({
        key: "mark-in-progress",
        severity: "medium",
        message: "Appointment approved. Start visit workflow when service begins.",
        cta: "Mark In Progress",
        targetStatus: "In-Progress",
      });
    }
    if (bookingStatus === "In-Progress") {
      actionRecommendations.push({
        key: "complete-appointment",
        severity: "high",
        message: "Visit in progress. Complete appointment when done.",
        cta: "Complete Appointment",
        targetStatus: "Completed",
      });
    }
    if (["Completed", "TreatmentCompleted"].includes(bookingStatus)) {
      actionRecommendations.push({
        key: "generate-invoice",
        severity: "medium",
        message: booking.invoiceGenerated
          ? "Invoice already generated for this booking."
          : "Generate invoice for completed appointment.",
        cta: booking.invoiceGenerated ? "View Invoice" : "Generate Invoice",
        targetStatus: bookingStatus,
      });
      actionRecommendations.push({
        key: "follow-up",
        severity: "low",
        message: "Schedule follow-up if treatment requires next session.",
        cta: "Follow Up Patient",
        targetStatus: bookingStatus,
      });
    }
    if (bookingStatus === "Cancellation Requested") {
      actionRecommendations.push({
        key: "review-cancellation",
        severity: "high",
        message: "Cancellation request is awaiting admin decision.",
        cta: "Review Cancellation",
        targetStatus: bookingStatus,
      });
    }
    if (isOverdue) {
      actionRecommendations.push({
        key: "contact-patient",
        severity: "high",
        message: "Appointment is overdue. Contact patient/provider immediately.",
        cta: "Contact Patient",
        targetStatus: bookingStatus,
      });
    }

    const completionPercentage = treatmentBookings.length
      ? Math.round((completedSessions / treatmentBookings.length) * 100)
      : ["Completed", "TreatmentCompleted"].includes(bookingStatus)
      ? 100
      : 0;

    const timeline = [
      {
        type: "booking_created",
        title: "Booking Created",
        description: "Appointment booking was created.",
        timestamp: booking.createdAt,
        actor: booking.createdBy?.userModel || "System",
      },
      booking.status === "Approved"
        ? {
            type: "booking_approved",
            title: "Booking Approved",
            description: "Appointment moved to approved state.",
            timestamp: booking.updatedAt,
            actor: "Admin",
          }
        : null,
      booking.serviceStartedAt
        ? {
            type: "visit_started",
            title: "Visit Started",
            description: "Provider marked visit start.",
            timestamp: booking.serviceStartedAt,
            actor: "Provider",
          }
        : null,
      booking.serviceEndedAt
        ? {
            type: "visit_completed",
            title: "Visit Completed",
            description: "Provider marked visit completion.",
            timestamp: booking.serviceEndedAt,
            actor: "Provider",
          }
        : null,
      ...(paymentLedger?.transactions || []).map((tx) => ({
        type: "payment_received",
        title: `Payment ${tx.status}`,
        description: `${tx.stage} • ${tx.method} • ${tx.amountPaid || 0}`,
        timestamp: tx.paidAt || tx.createdAt,
        actor:
          tx.collectedBy
            ? `${tx.collectedBy.firstName || ""} ${tx.collectedBy.lastName || ""}`.trim() ||
              tx.collectedBy.email
            : "System",
      })),
      ...(paymentLedger?.refunds || []).map((refund) => ({
        type: "refund_update",
        title: `Refund ${refund.status}`,
        description: `${refund.refundType} refund • ${refund.amount || 0}`,
        timestamp: refund.refundedAt || refund.updatedAt || refund.createdAt,
        actor:
          refund.approvedBy
            ? `${refund.approvedBy.firstName || ""} ${refund.approvedBy.lastName || ""}`.trim() ||
              refund.approvedBy.email
            : refund.adminId
            ? `${refund.adminId.firstName || ""} ${refund.adminId.lastName || ""}`.trim() ||
              refund.adminId.email
            : "Admin",
      })),
      paymentLedger?.lastWebhookProcessedAt
        ? {
            type: "webhook",
            title: "Payment Webhook Processed",
            description: paymentLedger.lastWebhookEvent || "Webhook event handled",
            timestamp: paymentLedger.lastWebhookProcessedAt,
            actor: "Gateway",
          }
        : null,
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

    const recommendations = {
      patientHistory: {
        pastAppointments: allPatientBookings.length,
        lastVisitDate,
        medicalConditions: (patient?.medicalHistory || []).map((entry) => entry.condition).filter(Boolean),
        allergies: patient?.allergies || [],
        medicationsCount: (patient?.currentMedications || []).length,
      },
      treatmentFlow: {
        previousBooking,
        nextBooking,
        sessionProgress: completedSessions,
        totalSessions: treatmentBookings.length || booking.sessionNumber || 1,
      },
      alternativeProviders: alternativeProviders.map((item) => ({
        id: item._id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phone: item.mobile,
        yearsOfExperience: item.yearsOfExperience || 0,
        rating: item.rating?.average || 0,
        city: (item.serviceCities || []).map((city) => city.name).filter(Boolean),
        profilePhoto: item.documents?.profilePhoto || null,
      })),
      similarServices: similarServices.map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        description: item.description || "",
        basePrice: item.basePrice || 0,
        taxPercentage: item.taxPercentage || 0,
      })),
      actionRecommendations,
      analytics: {
        paymentStatus,
        totalAmount: paymentLedger?.totalBillAmount || booking.pricing?.totalAmount || 0,
        paidAmount: paymentLedger?.totalPaid || booking.paidAmount || 0,
        pendingAmount:
          paymentLedger?.remainingBalance ??
          Math.max(
            Number(booking.pricing?.totalAmount || 0) - Number(booking.paidAmount || 0),
            0
          ),
        totalRefunded: paymentLedger?.totalRefunded || 0,
        treatmentValidityDays: treatment?.validTill
          ? Math.ceil((new Date(treatment.validTill).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : null,
        completionPercentage,
        isOverdue,
        treatmentNearExpiry,
      },
      timeline,
    };

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        patient: booking.patientId,
        service: booking.serviceId,
        provider: provider,
        bookingCity: booking.city?.name,
        bookingCityId: booking.city?._id || null,
        appointmentDate: booking.appointmentDate,
        slotTime: booking.slotTime,
        status: booking.status,
        pricing: booking.pricing,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount || 0,
        dueAmount: booking.dueAmount || 0,
        sessionNumber: booking.sessionNumber || 1,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        createdBy: booking.createdBy || null,
        invoiceId: booking.invoiceId || null,
        invoiceGenerated: booking.invoiceGenerated || false,
        treatment: booking.treatmentId,
        paymentLedger,
        recommendations,
      },
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
//flex
// exports.getByIdBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     if (!bookingId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Booking ID is required" });
//     }

//     const booking = await Booking.findById(bookingId)
//       .populate("patientId", "firstName email phone")
//       .populate("serviceId", "name category modes")
//       .populate("servicePartnerId", "firstName lastName email mobile phone")
//       .populate("treatmentId", "status validTill");  
//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     res.status(200).json({
//       success: true,
//       data: booking,
//     });
//   } catch (error) {
//     console.error("Get booking by ID error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching booking",
//       error: error.message,
//     });
//   }
// };
//flex
// exports.updateServiceStatus = async (req, res) => { //todo after completeion of booking need to add details about medicine,equipment,billing date   
//                                                     //get api for all the details of booking and invoice and treatment and show in frontend
//   try {
//     const { bookingId } = req.params;
//     const { status } = req.body;
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

//     // Regular booking statuses (NO INVOICE)
//     const bookingStatuses = ["Pending", "Approved", "Rejected", "Rescheduled", "Cancelled", "In-Progress", "Completed"];
//     if (bookingStatuses.includes(status)) {
//       booking.status = status;
//       if (status === 'In-Progress') booking.serviceStartedAt = new Date();
//       if (status === 'Completed') booking.serviceEndedAt = new Date();
//       booking.treatmentStatus = booking.treatmentStatus || 'Active';
      
//       await booking.save();
      
//       return res.status(200).json({
//         success: true,
//         message: `Booking status updated to "${status}"`,
//         data: {
//           bookingStatus: status,
//           treatmentStatus: booking.treatmentStatus,
//           invoiceGenerated: false
//         }
//       });
//     }

//     // TreatmentCompleted → Generate Invoice + Complete Treatment
//     if (status.toLowerCase() === 'treatmentcompleted') {
//       if (booking.treatmentStatus !== 'Active') {
//         return res.status(400).json({ success: false, message: "Treatment must be Active" });
//       }
//       if (booking.invoiceGenerated) {
//         return res.status(400).json({ success: false, message: "Invoice already generated" });
//       }

//       // ✅ DIRECT INVOICE CREATION
//       const Invoice = require('../models/invoiceModel');
//       const crypto = require('crypto');
      
//       const invoicePayload = {
//         invoiceNumber: `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
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

//       const newInvoice = new Invoice(invoicePayload);
//       const savedInvoice = await newInvoice.save();

//       booking.status = 'Completed';
//       booking.treatmentStatus = 'Completed';
//       booking.serviceEndedAt = new Date();
//       booking.invoiceId = savedInvoice._id;
//       booking.invoiceGenerated = true;
//       await booking.save();

//       return res.status(200).json({
//         success: true,
//         message: "Treatment completed & Invoice generated",
//         data: {
//           bookingStatus: 'Completed',
//           treatmentStatus: 'Completed',
//           invoiceGenerated: true,
//           invoiceId: savedInvoice._id,
//           invoiceNumber: savedInvoice.invoiceNumber
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
    const { status, equipment } = req.body;  // equipment for extra charges
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

    const treatment = booking.treatmentId
      ? await Treatment.findById(booking.treatmentId).select("status")
      : null;

    // Regular booking statuses (NO INVOICE, NO PAYMENT CHECK)
    const bookingStatuses = ["Pending", "Approved", "Rejected", "Rescheduled", "Cancelled", "In-Progress"];
    if (bookingStatuses.includes(status)) {
      booking.status = status;
      if (status === 'In-Progress') booking.serviceStartedAt = new Date();
      
      // Initialize payment fields if first time
      if (!booking.paidAmount) booking.paidAmount = 0;
      if (!booking.dueAmount) {
        const totalAmount = Number(booking.pricing?.totalAmount || 0);
        booking.dueAmount = totalAmount;
        booking.paymentStatus = totalAmount > 0 ? "Unpaid" : "Paid";
      }
      
      await booking.save();
      
      return res.status(200).json({
        success: true,
        message: `Booking status updated to "${status}"`,
        data: {
          bookingStatus: status,
          treatmentStatus: treatment?.status || null,
          paymentStatus: booking.paymentStatus,
          dueAmount: booking.dueAmount,
          invoiceGenerated: false
        }
      });
    }

    // ✅ TREATMENT COMPLETION - PAYMENT MANDATORY POINT
    // if (status.toLowerCase() === 'treatmentcompleted') {
    //   if (booking.treatmentStatus !== 'Active') {
    //     return res.status(400).json({ success: false, message: "Treatment must be Active" });
    //   }

    //   // 1. MARK TREATMENT COMPLETE
    //   booking.status = 'Completed';
    //   booking.treatmentStatus = 'Completed';
    //   booking.serviceEndedAt = new Date();

    //   // 2. HANDLE EQUIPMENT CHARGES (if provided)
    //   if (equipment && Array.isArray(equipment)) {
    //     let extraCharge = 0;
    //     booking.additionalEquipment = equipment.map(item => {
    //       const charge = Number(item.charge || 0);
    //       extraCharge += charge;
    //       return { name: item.name, charge };
    //     });

    //     // Update final pricing
    //     const baseAmount = Number(booking.pricing?.basePrice || 0);
    //     const taxAmount = Number(booking.pricing?.taxAmount || 0);
    //     booking.pricing.equipmentCharges = extraCharge;
    //     booking.pricing.totalAmount = baseAmount + extraCharge + taxAmount;
    //   }

    //   // 3. CALCULATE FINAL PAYMENT STATUS
    //   const totalAmount = Number(booking.pricing?.totalAmount || 0);
    //   const alreadyPaid = Number(booking.paidAmount || 0);
      
    //   booking.dueAmount = Math.max(0, totalAmount - alreadyPaid);
      
    //   if (booking.dueAmount === 0) {
    //     booking.paymentStatus = "Paid";
    //     booking.isFinalPaymentDone = true;
    //   } else if (alreadyPaid > 0) {
    //     booking.paymentStatus = "Partially Paid";
    //     booking.isFinalPaymentDone = false;
    //   } else {
    //     booking.paymentStatus = "Unpaid";
    //     booking.isFinalPaymentDone = false;
    //   }

    //   // 4. GENERATE INVOICE (even if payment pending)
    //   const Invoice = require('../models/invoiceModel');
    //   const crypto = require('crypto');
      
    //   const invoicePayload = {
    //     invoiceNumber: `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    //     bookingId: booking._id,
    //     patientId: booking.patientId,
    //     doctorId: providerId,
    //     billingDetails: {
    //       serviceName: booking.serviceId.name,
    //       category: booking.serviceId.category,
    //       durationMinutes: booking.duration,
    //       basePrice: booking.pricing.basePrice,
    //       equipmentCharges: booking.pricing.equipmentCharges || 0,
    //       subtotal: booking.pricing.subtotal || 0,
    //       taxPercentage: booking.serviceId.taxPercentage || 18,
    //       totalAmount: totalAmount,
    //       paidAmount: alreadyPaid,
    //       dueAmount: booking.dueAmount,
    //       paymentStatus: booking.paymentStatus  // ✅ Key addition
    //     }
    //   };

    //   const newInvoice = new Invoice(invoicePayload);
    //   const savedInvoice = await newInvoice.save();

    //   booking.invoiceId = savedInvoice._id;
    //   booking.invoiceGenerated = true;
    //   await booking.save();

    //   return res.status(200).json({
    //     success: true,
    //     message: `Treatment completed. ${booking.dueAmount > 0 ? 'Payment pending: ₹' + booking.dueAmount : 'Payment cleared'}`,
    //     data: {
    //       bookingStatus: 'Completed',
    //       treatmentStatus: 'Completed',
    //       invoiceGenerated: true,
    //       invoiceId: savedInvoice._id,
    //       invoiceNumber: savedInvoice.invoiceNumber,
    //       paymentStatus: booking.paymentStatus,
    //       totalAmount: totalAmount,
    //       paidAmount: alreadyPaid,
    //       dueAmount: booking.dueAmount,
    //       paymentRequired: booking.dueAmount > 0,
    //       needsPayment: booking.dueAmount > 0
    //     }
    //   });
    // }
// ✅ TREATMENT COMPLETION - ADVANCE RESET + FINAL PAYMENT READY
if (status.toLowerCase() === 'treatmentcompleted') {
  if (booking.status === "Completed") {
    if (treatment?.status === "Completed") {
      return res.status(200).json({
        success: true,
        message: "Booking and treatment already completed",
        data: {
          bookingStatus: "Completed",
          treatmentStatus: "Completed",
          alreadyCompleted: true,
          paymentStatus: booking.paymentStatus || null,
          dueAmount: Number(booking.dueAmount || 0),
          invoiceGenerated: Boolean(booking.invoiceGenerated),
        },
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "Booking is already completed but treatment is not completed. Admin repair required.",
    });
  }

  // Backward compatibility: legacy data can keep treatment as Completed
  // while a newly scheduled follow-up booking is still pending.
  const allowedTreatmentStates = ["Active", "Completed"];
  if (!treatment || !allowedTreatmentStates.includes(treatment.status)) {
    return res.status(400).json({ success: false, message: "Treatment must be Active" });
  }

  // 🔥 1. RESET ADVANCE PAYMENT (tumhari main requirement)
  booking.advanceAmount = 0;           // ✅ Advance clear
  booking.paidAmount = 0;              // ✅ Paid amount clear  
  booking.isAdvancePaid = false;       // ✅ Flag reset
  booking.paymentHistory = [];         // ✅ History clear

  // 2. Recalculate FULL amount as due (no advance deduction)
  const totalAmount = Number(booking.pricing?.totalAmount || 0);
  booking.dueAmount = totalAmount;     // ✅ Full amount due now
  booking.paymentStatus = "Unpaid";    // ✅ Reset to Unpaid
  booking.isFinalPaymentDone = false;  // ✅ Final payment pending
  booking.payNow = true;               // ✅ Enable final payment

  // 3. Mark treatment complete
  booking.status = 'Completed';
  booking.serviceEndedAt = new Date();
  treatment.status = "Completed";

  // 4. Handle equipment charges (if any)
  if (equipment && Array.isArray(equipment)) {
    let extraCharge = 0;
    booking.additionalEquipment = equipment.map(item => {
      const charge = Number(item.charge || 0);
      extraCharge += charge;
      return { name: item.name, charge };
    });
    booking.pricing.equipmentCharges = extraCharge;
    booking.pricing.totalAmount += extraCharge;  // Update total
    booking.dueAmount = booking.pricing.totalAmount;  // Full updated amount due
  }

  // 5. Generate invoice with CLEAN payment status
  const invoicePayload = {
    invoiceNumber: `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    bookingId: booking._id,
    patientId: booking.patientId,
    doctorId: providerId,
    billingDetails: {
      serviceName: booking.serviceId.name,
      category: booking.serviceId.category,
      totalAmount: booking.pricing.totalAmount,
      paidAmount: 0,        // ✅ Zero after advance reset
      dueAmount: booking.dueAmount,  // ✅ Full amount
      paymentStatus: "Unpaid"         // ✅ Fresh start
    }
  };

  const newInvoice = new Invoice(invoicePayload);
  const savedInvoice = await newInvoice.save();
  
  booking.invoiceId = savedInvoice._id;
  booking.invoiceGenerated = true;
  await treatment.save();
  await booking.save();

  return res.status(200).json({
    success: true,
    message: `Treatment completed. Full payment now due: ₹${booking.dueAmount}`,
    data: {
      bookingStatus: 'Completed',
      treatmentStatus: 'Completed',
      advanceReset: true,           // ✅ Confirmation
      paymentStatus: 'Unpaid',      // ✅ Fresh
      totalAmount: booking.pricing.totalAmount,
      dueAmount: booking.dueAmount,
      payNow: true,                 // ✅ Ready for final payment
      invoiceGenerated: true
    }
  });
}
    return res.status(400).json({ 
      success: false, 
      message: 'Valid: "In-Progress", "TreatmentCompleted"' 
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTreatmentById = catchAsync(async (req, res, next) => {
  const { treatmentId } = req.params;
  const { details = 'basic' } = req.query;
  
  if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid treatment ID format'
    });
  }

  // 1. Fetch treatment with patient ownership check
  const treatment = await Treatment.findById(treatmentId)
    .populate('patientId', 'firstName phone email')
    .populate('serviceId', 'name category basePrice modes')
    .populate('servicePartnerId', 'firstName specialization phone');

  if (!treatment) {
    return res.status(404).json({
      success: false,
      message: 'Treatment not found'
    });
  }

  // 2. Verify patient owns this treatment
  const patientId = req.user?.id || req.body.patientId;
  if (treatment.patientId._id.toString() !== patientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized - not your treatment'
    });
  }

  // 3. Get all bookings for this treatment (your existing pattern)
  const bookings = await Booking.find({ treatmentId })
    .populate('serviceId', 'name category')
    .populate('servicePartnerId', 'firstName specialization')
    .populate('city', 'name')
    .sort({ appointmentDate: 1 })
    .lean();

  // 4. Calculate treatment progress
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => 
    ['Completed', 'TreatmentCompleted'].includes(b.status)
  ).length;
  const progressPercentage = totalBookings > 0 
    ? Math.round((completedBookings / totalBookings) * 100) 
    : 0;

  // 5. Summary stats
  const stats = {
    totalSessions: totalBookings,
    completedSessions: completedBookings,
    pendingSessions: bookings.filter(b => b.status === 'Pending').length,
    inProgressSessions: bookings.filter(b => b.status === 'In-Progress').length,
    progressPercentage,
    status: treatment.status,
    validTill: treatment.validTill,
    nextBooking: bookings.find(b => b.status === 'Pending') || null
  };

  const response = {
    success: true,
    data: {
      treatment: {
        ...treatment.toObject(),
        _id: treatment._id.toString()  // Clean ObjectId
      },
      bookings,
      stats,
      summary: `${completedBookings}/${totalBookings} sessions completed (${progressPercentage}%)`
    }
  };

  if (details === 'full') {
    // Add invoice/equipment/medicine details from your bookingCompletedDetails
    response.data.invoices = await Invoice.find({ bookingId: { $in: bookings.map(b => b._id) } });
  }

  res.status(200).json(response);
});


//adding booking details 
// exports.bookingCompletedDetails = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const {
//       billingDetails,  // { calculatedBase, taxPercentage, serviceName, category, shiftType, durationMinutes }
//       medicines = [],
//       additionalEquipment = []
//     } = req.body;
//     const providerId = req.user?.id;

//     if (!providerId) {
//       return res.status(401).json({ success: false, message: "Service provider required" });
//     }

//     // Fetch booking with populated service details
//     const booking = await Booking.findById(bookingId)
//       .populate('serviceId', 'name category basePrice equipmentCharges taxPercentage')
//       .populate('patientId', 'name phoneNumber'); // For invoice display

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     if (booking.servicePartnerId?.toString() !== providerId.toString()) {
//       return res.status(403).json({ success: false, message: "Unauthorized provider" });
//     }

//     // ✅ CRITICAL: Only allow for COMPLETED bookings
//     if (booking.status !== 'Completed') {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Booking must be Completed first. Use updateServiceStatus to complete it." 
//       });
//     }

//     if (!booking.patientId) {
//       return res.status(400).json({ success: false, message: "Patient ID missing from booking" });
//     }

//     // ✅ ENHANCED: Validate & attach category details for MEDICINES
//     const validatedMedicines = [];
//     for (let med of medicines) {
//       const validatedMed = { ...med };
      
//       // If categoryId provided, validate & fetch category details
//       if (validatedMed.categoryId) {
//         const category = await ItemCategory.findOne({
//           _id: validatedMed.categoryId, 
//           isActive: true, 
//           isDeleted: false 
//         });
        
//         if (!category) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid medicine category: ${validatedMed.name || 'Unknown'}`
//           });
//         }
//         // ✅ Attach full category details
//         validatedMed.categoryName = category.name;
//         validatedMed.categoryDescription = category.description || '';
//         validatedMed.categoryId = category._id;
//       } else {
//         // If no categoryId, mark as uncategorized (still allow)
//         validatedMed.categoryName = 'Uncategorized';
//       }
      
//       validatedMedicines.push(validatedMed);
//     }

//     // ✅ ENHANCED: Validate & attach category details for EQUIPMENT
//     const validatedEquipment = [];
//     for (let equip of additionalEquipment) {
//       const validatedEquip = { ...equip };
      
//       // If categoryId provided, validate & fetch category details
//       if (validatedEquip.categoryId) {
//         const category = await ItemCategory.findOne({
//           _id: validatedEquip.categoryId, 
//           isActive: true, 
//           isDeleted: false 
//         });
        
//         if (!category) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid equipment category: ${validatedEquip.name || 'Unknown'}`
//           });
//         }
//         // ✅ Attach full category details
//         validatedEquip.categoryName = category.name;
//         validatedEquip.categoryDescription = category.description || '';
//         validatedEquip.categoryId = category._id;
//       } else {
//         // If no categoryId, mark as uncategorized (still allow)
//         validatedEquip.categoryName = 'Uncategorized';
//       }
      
//       validatedEquipment.push(validatedEquip);
//     }

//     let invoice;
//     const invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

//     // Check if basic invoice exists (from TreatmentCompleted) - UPDATE it
//     if (booking.invoiceId) {
//       invoice = await Invoice.findById(booking.invoiceId);
//       if (!invoice) {
//         return res.status(404).json({ success: false, message: "Invoice not found" });
//       }

//       // ✅ UPDATE with full category details
//       invoice.invoiceNumber = invoiceNumber;
//       invoice.billingDetails = { 
//         ...invoice.billingDetails, 
//         ...billingDetails,
//         serviceName: booking.serviceId?.name || billingDetails.serviceName,
//         category: booking.serviceId?.category || billingDetails.category
//       };
//       invoice.medicines = validatedMedicines;
//       invoice.additionalEquipment = validatedEquipment;
//       invoice.issuedAt = new Date();

//     } else {
//       // Create new detailed invoice with service details from booking
//       const invoicePayload = {
//         invoiceNumber,
//         bookingId: booking._id,
//         patientId: booking.patientId,
//         doctorId: providerId,
//         billingDetails: {
//           ...billingDetails,
//           serviceName: booking.serviceId?.name || billingDetails.serviceName,
//           category: booking.serviceId?.category || billingDetails.category,
//           durationMinutes: booking.duration || billingDetails.durationMinutes
//         },
//         medicines: validatedMedicines,
//         additionalEquipment: validatedEquipment
//       };

//       invoice = new Invoice(invoicePayload);
//     }

//     const savedInvoice = await invoice.save();

//     // Link/update booking
//     booking.invoiceId = savedInvoice._id;
//     booking.invoiceGenerated = true;
//     await booking.save();

//     return res.status(201).json({
//       success: true,
//       message: "Booking details with categories added and invoice generated/updated successfully",
//       data: {
//         bookingStatus: booking.status,
//         invoiceGenerated: true,
//         invoiceId: savedInvoice._id,
//         invoiceNumber: savedInvoice.invoiceNumber,
//         grandTotal: savedInvoice.totals.grandTotal,
//         patientName: booking.patientId?.name,
//         invoice: savedInvoice  // Full invoice with category details for frontend
//       }
//     });

//   } catch (error) {
//     console.error("Error in bookingCompletedDetails:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };







// exports.bookingCompletedDetails = async (req, res) => {
//   try {
//     const { 
//       bookingId, 
//       patientId, 
//       doctorId, 
//       billingDetails, 
//       medicines = [],
//       additionalEquipment = [],
//       categories = []
//     } = req.body;

//     const providerId = req.user?.id;
    
//     if (!providerId) {
//       return res.status(401).json({ success: false, message: "Service provider required" });
//     }

//     const actualBookingId = bookingId || req.params.bookingId;
//     if (!actualBookingId) {
//       return res.status(400).json({ success: false, message: "Booking ID required" });
//     }

//     const booking = await Booking.findById(actualBookingId)
//       .populate('serviceId', 'name category basePrice equipmentCharges taxPercentage')
//       .populate('patientId', 'name phoneNumber');

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     if (booking.servicePartnerId?.toString() !== providerId.toString()) {
//       return res.status(403).json({ success: false, message: "Unauthorized provider" });
//     }

//     if (!['Completed', 'In-Progress'].includes(booking.status)) {
//       return res.status(400).json({ success: false, message: "Booking must be Completed/In-Progress" });
//     }

//     // ✅ PROCESS ITEMS
//     const processedMedicines = processSimpleItems(medicines, 'medicine');
//     const processedEquipment = processSimpleItems(additionalEquipment, 'equipment');
//     const processedCategories = await processCategoryItems(categories);

//     // ✅ FIXED TOTALS CALCULATION
//     const medicinesTotal = processedMedicines.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
//     const equipmentTotal = processedEquipment.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
//     const categoriesTotal = processedCategories.reduce((sum, cat) => sum + parseFloat(cat.categoryTotal), 0);
    
//     const calculatedBase = parseFloat(billingDetails?.calculatedBase) || 0;
//     const subTotal = calculatedBase + medicinesTotal + equipmentTotal + categoriesTotal;
//     const taxPercentage = parseFloat(billingDetails?.taxPercentage) || 18;
//     const taxAmount = subTotal * (taxPercentage / 100);
//     const grandTotal = subTotal + taxAmount;

//     const billingSummary = {
//       bookingId: booking._id,
//       patientId: patientId || booking.patientId,
//       doctorId: doctorId || providerId,
//       patientName: booking.patientId?.name,
//       bookingStatus: booking.status,
      
//       billingDetails: {
//         ...billingDetails,
//         serviceName: booking.serviceId?.name || billingDetails?.serviceName || 'Service',
//         serviceCategory: booking.serviceId?.category || billingDetails?.category || 'general',
//         calculatedBase: calculatedBase
//       },
      
//       medicines: processedMedicines,
//       additionalEquipment: processedEquipment,
//       categories: processedCategories,
      
//       totals: {
//         medicinesTotal: medicinesTotal.toFixed(2),
//         equipmentTotal: equipmentTotal.toFixed(2),
//         categoriesTotal: categoriesTotal.toFixed(2),
//         subTotal: subTotal.toFixed(2),
//         taxAmount: taxAmount.toFixed(2),
//         grandTotal: grandTotal.toFixed(2),
//         taxPercentage
//       }
//     };

//     res.status(200).json({
//       success: true,
//       message: "Booking completion details processed successfully",
//       data: billingSummary
//     });

//   } catch (error) {
//     console.error("Error in bookingCompletedDetails:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ================================
// // HELPER FUNCTIONS (FIXED)
// const processSimpleItems = (items, type) => {
//   if (!Array.isArray(items)) return [];
//   return items.map(item => ({
//     name: item.name || 'Unnamed Item',
//     quantity: parseInt(item.quantity) || 0,
//     unitPrice: parseFloat(item.unitPrice) || 0,
//     totalPrice: (parseInt(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
//     type
//   }));
// };

// const processCategoryItems = async (categoriesData) => {
//   if (!Array.isArray(categoriesData)) return [];
  
//   const ItemCategory = require('../models/itemCategoryModel');
//   const result = [];
  
//   for (let catEntry of categoriesData) {
//     const catId = catEntry.categoryId;
//     let category = null;
    
//     if (catId) {
//       try {
//         category = await ItemCategory.findOne({
//           _id: catId, 
//           isActive: true, 
//           isDeleted: false
//         });
//       } catch (err) {
//         console.warn(`Category ${catId} not found`);
//       }
//     }
    
//     const items = (catEntry.items || []).map(item => ({
//       name: item.name || 'Unnamed Item',
//       quantity: parseInt(item.quantity) || 0,
//       unitPrice: parseFloat(item.unitPrice) || 0,
//       totalPrice: (parseInt(item.quantity) * parseFloat(item.unitPrice)).toFixed(2)
//     }));
    
//     const categoryTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    
//     const categoryObj = {
//       category: category || { 
//         _id: catId || null, 
//         name: catEntry.category?.name || 'Uncategorized', 
//         description: catEntry.category?.description || '' 
//       },
//       items,
//       categoryTotal: categoryTotal.toFixed(2)
//     };
    
//     if (items.length > 0) {
//       result.push(categoryObj);
//     }
//   }
  
//   return result;
// };
exports.bookingCompletedDetails = catchAsync(async (req, res) => {
  const { 
    bookingId, 
    billingDetails = {}, 
    categories = []  // [{categoryId, items: [{name, quantity, unitPrice}]}]
  } = req.body;

  const providerId = req.user.id;

  // 1. Validate provider & booking
  const booking = await Booking.findById(bookingId)
    .populate('serviceId', 'name category basePrice equipmentCharges')
    .populate('patientId', 'name phoneNumber')
    .populate('servicePartnerId');

  if (!booking) {
    return res.status(404).json({ 
      success: false, 
      message: 'Booking not found' 
    });
  }

  if (booking.servicePartnerId._id.toString() !== providerId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized provider' 
    });
  }

  // 2. ✅ VALIDATE YOUR ADMIN CATEGORIES
  const processedCategories = await processBillingCategories(categories);

  // 3. Calculate totals
  const serviceBase = parseFloat(billingDetails.calculatedBase) || 
                     booking.serviceId?.basePrice || 0;
  
  const categoriesTotal = processedCategories.reduce(
    (sum, cat) => sum + parseFloat(cat.categoryTotal || 0), 0
  );
  
  const subTotal = serviceBase + categoriesTotal;
  const taxPercentage = parseFloat(billingDetails.taxPercentage) || 18;
  const taxAmount = subTotal * (taxPercentage / 100);
  const grandTotal = subTotal + taxAmount;

  // 4. Response
  res.status(200).json({
    success: true,
    message: 'Billing processed successfully',
    data: {
      bookingId: booking._id,
      patientName: booking.patientId?.name,
      serviceName: booking.serviceId?.name,
      
      billingDetails: {
        serviceBase: serviceBase.toFixed(2),
        serviceCategory: booking.serviceId?.category
      },
      
      // ✅ Your validated categories
      categories: processedCategories,
      
      totals: {
        serviceBase: serviceBase.toFixed(2),
        categoriesTotal: categoriesTotal.toFixed(2),
        subTotal: subTotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        taxPercentage,
        grandTotal: grandTotal.toFixed(2)
      }
    }
  });

});

const processBillingCategories = async (categoriesData) => {
  if (!Array.isArray(categoriesData)) return [];

  const processed = [];

  for (const catEntry of categoriesData) {
    const { categoryId, items = [] } = catEntry;

    // ✅ VALIDATE category exists and is active
    const category = await ItemCategory.findOne({
      _id: categoryId,
      isActive: true,
      isDeleted: false
    })
    .populate({
      path: 'items',
      match: { isActive: true }, // Only active items
      select: 'name unitPrice _id'
    })
    .lean();

    if (!category) continue; // Skip invalid categories

    // ✅ Get all allowed item names from this category
    const allowedItemNames = category.items.map(item => item.name.toLowerCase());

    // ✅ Filter ONLY items that exist in this category
    const validItems = items
      .filter(item => {
        // Must have required fields
        if (!item.name?.trim() || (item.quantity || 0) <= 0 || (item.unitPrice || 0) <= 0) {
          return false;
        }

        // ✅ CRITICAL: Item name MUST exist in category's items array
        return allowedItemNames.includes(item.name.trim().toLowerCase());
      })
      .map(item => {
        // Find the exact matching item from category to validate unitPrice
        const categoryItem = category.items.find(catItem => 
          catItem.name.toLowerCase() === item.name.trim().toLowerCase()
        );

        return {
          _id: categoryItem?._id,           // ✅ Original item ID
          name: item.name.trim(),
          unitPrice: categoryItem?.unitPrice || parseFloat(item.unitPrice), // Use category's price if available
          quantity: parseInt(item.quantity),
          totalPrice: (parseInt(item.quantity) * 
            (categoryItem?.unitPrice || parseFloat(item.unitPrice))).toFixed(2)
        };
      });

    if (validItems.length === 0) continue;

    const categoryTotal = validItems.reduce(
      (sum, item) => sum + parseFloat(item.totalPrice), 0
    );

    processed.push({
      categoryId: category._id,
      categoryName: category.name,
      description: category.description,
      items: validItems,
      itemCount: validItems.length,
      categoryTotal: categoryTotal.toFixed(2)
    });
  }

  return processed;
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
        const requestedProviderId = req.params.providerId;
        const loggedInProviderId = req.user?.id ? String(req.user.id) : null;
        const providerId = loggedInProviderId || requestedProviderId;

        // 1. Validate the provider ID format
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Service Provider ID"
            });
        }

        const treatmentIds = await Treatment.find({ servicePartnerId: providerId })
            .distinct('_id');

        const bookingQuery = treatmentIds.length > 0
            ? {
                $or: [
                    { servicePartnerId: providerId },
                    {
                        $and: [
                            { treatmentId: { $in: treatmentIds } },
                            {
                                $or: [
                                    { servicePartnerId: null },
                                    { servicePartnerId: { $exists: false } }
                                ]
                            }
                        ]
                    }
                ]
            }
            : { servicePartnerId: providerId };

        const bookings = await Booking.find(bookingQuery)
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







//provider booking 
// exports.createProviderBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   let transactionStarted = false;
  
//   try {
//     const servicePartnerId = req.user.id;
//     const { patientId, previousBookingId, serviceId, appointmentDate, startTime, endTime, duration, shiftType, notes, category, modes, cityId } = req.body;

//     // 1. VALIDATION - NO SESSION NEEDED
//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, endTime required",
//       });
//     }

//     // 2. START TRANSACTION ONLY FOR DB OPERATIONS
//     await session.startTransaction();
//     transactionStarted = true;

//     // 3. Validate Service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive || service.isDeleted) {
//       throw new Error("Service not found or inactive");  // Will trigger rollback
//     }

//     // 4. Validate Patient
//     const patient = await Patient.findById(patientId)
//       .select("address.cityId firstName phone")
//       .session(session);
//     if (!patient) {
//       throw new Error("Patient not found");
//     }

//     // 5. Validate City
//     let bookingCity = cityId ? await City.findById(cityId).session(session) : 
//                              await City.findById(patient.address.cityId).session(session);
//     if (!bookingCity || !bookingCity.isActive) {
//       throw new Error("Invalid or inactive city");
//     }

//     // 6. Previous Booking Validation
//     let previousTreatmentId = null;
//     if (previousBookingId) {
//       const previousBooking = await Booking.findById(previousBookingId)
//         .populate('treatmentId', 'status')
//         .session(session);
        
//       if (!previousBooking) {
//         throw new Error("Previous booking not found");
//       }
      
//       if (previousBooking.treatmentId?.status !== 'Completed') {
//         throw new Error("Can only create follow-up after treatment completion");
//       }
      
//       previousTreatmentId = previousBooking.treatmentId._id;
//     }

//     // 7. Check slot conflicts
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
//       servicePartnerId: servicePartnerId
//     };

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       throw new Error("Your slot already booked");
//     }

//     // 8. Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     // 9. CREATE NEW TREATMENT
//     const newTreatment = new Treatment({
//       patientId,
//       serviceId,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       status: 'Active',
//       previousTreatmentId: previousTreatmentId || null
//     });
//     await newTreatment.save({ session });
//     const treatmentId = newTreatment._id;

//     // 10. CREATE BOOKING
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { userId: servicePartnerId, userModel: "ServiceProvider" },
//       treatmentId,
//       treatmentStatus: 'Active',
//       invoiceGenerated: false,
//       previousBookingId: previousBookingId || null
//     });
//     await newBooking.save({ session });

//     // 11. COMMIT - Only reaches here if ALL operations succeed
//     await session.commitTransaction();

//     // Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name latitude longitude')
//       .populate('treatmentId', 'status validTill previousTreatmentId')
//       .populate('patientId', 'firstName phone')
//       .populate('previousBookingId', 'appointmentDate status treatmentId');

//     res.status(201).json({
//       success: true,
//       message: "Provider booking created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId,
//         previousDetails: previousBookingId ? {
//           bookingId: previousBookingId,
//           previousTreatmentId,
//         } : null
//       }
//     });

//   } catch (error) {
//     // Rollback ONLY if transaction was started AND error is database-related
//     if (transactionStarted) {
//       try {
//         await session.abortTransaction();
//       } catch (rollbackError) {
//         console.error("Rollback failed:", rollbackError);
//       }
//     }
    
//     // Handle validation/business logic errors separately
//     if (error.message.includes("not found") || error.message.includes("inactive")) {
//       const statusCode = error.message.includes("slot") ? 409 : 404;
//       return res.status(statusCode).json({ 
//         success: false, 
//         message: error.message 
//       });
//     }
    
//     console.error("Provider booking error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Error creating provider booking", 
//       error: error.message 
//     });
//   } finally {
//     await session.endSession();
//   }
// };


//flex
// exports.createProviderBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   let transactionStarted = false;
  
//   try {
//     const servicePartnerId = req.user.id;
//     const { 
//       patientId, 
//       previousBookingId, 
//       serviceId, 
//       appointmentDate, 
//       startTime, 
//       endTime, 
//       duration, 
//       shiftType, 
//       notes, 
//       category, 
//       modes, 
//       cityId 
//     } = req.body;

//     // 1. Input validation
//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, endTime required"
//       });
//     }

//     // 2. Start transaction
//     await session.startTransaction();
//     transactionStarted = true;

//     // 3. Validate Service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service?.isActive || service?.isDeleted) {
//       throw new Error("Service not found or inactive");
//     }

//     // 4. Validate Patient
//     const patient = await Patient.findById(patientId)
//       .select("address.cityId firstName phone")
//       .session(session);
//     if (!patient) {
//       throw new Error("Patient not found");
//     }

//     // 5. Validate City
//     const bookingCityId = cityId || patient.address.cityId;
//     const bookingCity = await City.findById(bookingCityId).session(session);
//     if (!bookingCity?.isActive) {
//       throw new Error("Invalid or inactive city");
//     }

//     // 6. ✅ EXACT FLOW: Current booking COMPLETED → Next booking (treatment in progress)
//     if (!previousBookingId) {
//       throw new Error("previousBookingId is required - current booking must be completed first");
//     }

//     const prevBooking = await Booking.findById(previousBookingId).session(session);
//     if (!prevBooking) {
//       throw new Error("Previous booking not found");
//     }

//     // ✅ CURRENT BOOKING MUST BE COMPLETED
//     if (prevBooking.status !== 'Completed') {
//       throw new Error(`Current booking must have status: "Completed" (current: "${prevBooking.status}")`);
//     }

//     // ✅ TREATMENT STATUS doesn't matter for completed bookings
//     const validTreatmentStatuses = ['Active', 'InProgress', 'Completed'];
//     if (!validTreatmentStatuses.includes(prevBooking.treatmentStatus)) {
//       throw new Error(`Previous booking treatmentStatus must be valid (current: "${prevBooking.treatmentStatus}")`);
//     }

//     // 7. Check slot conflicts (provider-specific)
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);
    
//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ['Cancelled', 'Rejected'] },
//       'slotTime.startTime': startTime,
//       'slotTime.endTime': endTime,
//       servicePartnerId: servicePartnerId
//     };

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       throw new Error("Your slot is already booked");
//     }

//     // 8. Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(':').map(Number);
//       const [eh, em] = endTime.split(':').map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
    
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     // 9. ✅ NEXT BOOKING: Treatment is in progress
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: 'Pending',  // New booking starts as Pending
//       pricing,
//       notes: notes || `Next treatment session after completed booking ${previousBookingId}`,
//       city: bookingCity._id,
//       createdBy: { 
//         userId: servicePartnerId, 
//         userModel: 'ServiceProvider' 
//       },
//       treatmentStatus: 'Active',  // ✅ Treatment is ready to start (in progress phase)
//       validTill: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days prescription
//       invoiceGenerated: false,
//       previousBookingId: previousBookingId,
//       treatmentFlow: true
//     });

//     await newBooking.save({ session });

//     // 10. Link back to chain
//     await Booking.findByIdAndUpdate(
//       previousBookingId,
//       { nextBookingId: newBooking._id },
//       { session }
//     );

//     // 11. Commit transaction
//     await session.commitTransaction();

//     // 12. Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name')
//       .populate('patientId', 'firstName phone')
//       .populate('serviceId', 'name category basePrice')
//       .populate('previousBookingId', 'appointmentDate status treatmentStatus');

//     res.status(201).json({
//       success: true,
//       message: 'Next treatment booking created successfully after completed booking',
//       data: {
//         booking: populatedBooking,
//         flow: 'completed-to-inprogress',
//         previousBooking: {
//           bookingId: previousBookingId,
//           status: 'Completed',
//           treatmentStatus: prevBooking.treatmentStatus
//         }
//       }
//     });

//   } catch (error) {
//     if (transactionStarted) {
//       try {
//         await session.abortTransaction();
//       } catch (rollbackError) {
//         console.error('Transaction rollback failed:', rollbackError);
//       }
//     }

//     if (error.message.includes('not found') || error.message.includes('inactive') || 
//         error.message.includes('must have') || error.message.includes('already booked') ||
//         error.message.includes('required')) {
//       const statusCode = error.message.includes('booked') ? 409 : 400;
//       return res.status(statusCode).json({
//         success: false,
//         message: error.message
//       });
//     }

//     console.error('Provider booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create provider booking',
//       error: error.message
//     });
//   } finally {
//     await session.endSession();
//   }
// };

exports.createProviderBooking = async (req, res) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const servicePartnerId = req.user.id;

    const {
      patientId,
      previousBookingId,
      serviceId,
      appointmentDate,
      startTime,
      endTime,
      duration,
      shiftType,
      notes,
      category,
      modes,
      cityId,
    } = req.body;

    // 1. Input validation
    if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "patientId, serviceId, appointmentDate, startTime, endTime required",
      });
    }

    // 2. Start transaction
    await session.startTransaction();
    transactionStarted = true;

    // 3. Validate Service
    const service = await Service.findById(serviceId).session(session);
    if (!service?.isActive || service?.isDeleted) {
      throw new Error("Service not found or inactive");
    }

    // 4. Validate Patient
    const patient = await Patient.findById(patientId)
      .select("address.cityId firstName phone")
      .session(session);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // 5. Validate City
    const bookingCityId = cityId || patient.address.cityId;
    const bookingCity = await City.findById(bookingCityId).session(session);
    if (!bookingCity?.isActive) {
      throw new Error("Invalid or inactive city");
    }

    // 6. Must have previousBookingId and that booking must be completed
    if (!previousBookingId) {
      throw new Error(
        "previousBookingId is required - current booking must be completed first"
      );
    }

    const prevBooking = await Booking.findById(previousBookingId).session(
      session
    );
    if (!prevBooking) {
      throw new Error("Previous booking not found");
    }

    // ✅ Current booking must be Completed
    if (prevBooking.status !== "Completed") {
      throw new Error(
        `Current booking must have status: "Completed" (current: "${prevBooking.status}")`
      );
    }

    // ✅ Ensure previous booking has valid treatment status
    const prevTreatment = prevBooking.treatmentId
      ? await Treatment.findById(prevBooking.treatmentId).session(session).select("status")
      : null;
    const prevTreatmentStatus = prevTreatment?.status || null;

    const validTreatmentStatuses = ["Active", "InProgress", "Completed"];
    if (
      prevTreatmentStatus &&
      !validTreatmentStatuses.includes(prevTreatmentStatus)
    ) {
      throw new Error(
        `Previous booking treatment status must be valid (current: "${prevTreatmentStatus}")`
      );
    }

    // 7. Check slot conflicts (provider-specific)
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictQuery = {
      serviceId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled", "Rejected"] },
      "slotTime.startTime": startTime,
      "slotTime.endTime": endTime,
      servicePartnerId: servicePartnerId,
    };

    const existingBooking = await Booking.findOne(conflictQuery).session(
      session
    );
    if (existingBooking) {
      throw new Error("Your slot is already booked");
    }

    // 8. Calculate duration & pricing
    let bookingDuration = duration;
    if (!bookingDuration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      bookingDuration = eh * 60 + em - (sh * 60 + sm);
      if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
    }

    const pricing = service.calculateTotalPrice(
      bookingDuration,
      false,
      shiftType || null
    );

    // If treatment was previously completed, re-activate it for the new session.
    if (prevTreatment && prevTreatment.status === "Completed") {
      prevTreatment.status = "Active";
      prevTreatment.lastBookingAt = new Date();
      await prevTreatment.save({ session });
    }

    // 9. ✅ NEXT BOOKING: reuse same treatmentId
    const nextSessionNumber = Number(prevBooking.sessionNumber || 1) + 1;
    const newBooking = new Booking({
      patientId,
      serviceId,
      category: category || service.category,
      modes: Array.isArray(modes) && modes.length ? modes : service.modes,
      servicePartnerId,
      sessionNumber: nextSessionNumber,
      appointmentDate: new Date(appointmentDate),
      slotTime: { startTime, endTime },
      duration: bookingDuration,
      shiftType: shiftType || null,
      status: "Pending", // New booking starts as Pending
      pricing,
      notes:
        notes ||
        `Next treatment session after completed booking ${previousBookingId}`,
      city: bookingCity._id,
      createdBy: {
        userId: servicePartnerId,
        userModel: "ServiceProvider",
      },
      validTill: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days prescription
      invoiceGenerated: false,
      previousBookingId: previousBookingId,
      treatmentFlow: true,

      // ✅ NEW: carry same treatmentId from previous booking
      treatmentId: prevBooking.treatmentId,
    });

    await newBooking.save({ session });

    // 10. Link back to chain
    await Booking.findByIdAndUpdate(
      previousBookingId,
      { nextBookingId: newBooking._id },
      { session }
    );

    // 11. Commit transaction
    await session.commitTransaction();

    // 12. ✅ Populate response, including treatmentId
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("city", "name")
      .populate("patientId", "firstName phone")
      .populate("serviceId", "name category basePrice")
      .populate("previousBookingId", "appointmentDate status treatmentId")
      .populate("treatmentId", "status validTill"); // ✅ this shows treatmentId in response

    res.status(201).json({
      success: true,
      message:
        "Next treatment booking created successfully after completed booking",
      data: {
        booking: populatedBooking,
        flow: "completed-to-inprogress",
        previousBooking: {
          bookingId: previousBookingId,
          status: "Completed",
          treatmentStatus: prevTreatmentStatus,
        },
      },
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await session.abortTransaction();
      } catch (rollbackError) {
        console.error("Transaction rollback failed:", rollbackError);
      }
    }

    // User‑friendly error handling
    if (
      error.message.includes("not found") ||
      error.message.includes("inactive") ||
      error.message.includes("must have") ||
      error.message.includes("already booked") ||
      error.message.includes("required")
    ) {
      const statusCode = error.message.includes("booked") ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Provider booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create provider booking",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};






//   const session = await mongoose.startSession();
//   let transactionStarted = false;
  
//   try {
//     const servicePartnerId = req.user.id;
//     const { 
//       patientId, 
//       previousBookingId, 
//       serviceId, 
//       appointmentDate, 
//       startTime, 
//       endTime, 
//       duration, 
//       shiftType, 
//       notes, 
//       category, 
//       modes, 
//       cityId 
//     } = req.body;

//     // 1. Input validation
//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, endTime required"
//       });
//     }

//     // 2. Start transaction
//     await session.startTransaction();
//     transactionStarted = true;

//     // 3. Validate Service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service?.isActive || service?.isDeleted) {
//       throw new Error("Service not found or inactive");
//     }

//     // 4. Validate Patient
//     const patient = await Patient.findById(patientId)
//       .select("address.cityId firstName phone")
//       .session(session);
//     if (!patient) {
//       throw new Error("Patient not found");
//     }

//     // 5. Validate City
//     const bookingCityId = cityId || patient.address.cityId;
//     const bookingCity = await City.findById(bookingCityId).session(session);
//     if (!bookingCity?.isActive) {
//       throw new Error("Invalid or inactive city");
//     }

//     // 6. ✅ ENFORCE PREVIOUS BOOKING FLOW
//     if (!previousBookingId) {
//       throw new Error("previousBookingId is required for next booking in treatment flow");
//     }

//     const prevBooking = await Booking.findById(previousBookingId).session(session);
//     if (!prevBooking) {
//       throw new Error("Previous booking not found");
//     }
    
//     // Current booking must be Completed to schedule next
//     if (prevBooking.treatmentStatus !== 'Completed') {
//       throw new Error(`Previous booking must have treatmentStatus: "Completed" to schedule next booking (current: "${prevBooking.treatmentStatus}")`);
//     }

//     // 7. Check slot conflicts (provider-specific)
//     const dayStart = new Date(appointmentDate);
//     dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate);
//     dayEnd.setHours(23, 59, 59, 999);
    
//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ['Cancelled', 'Rejected'] },
//       'slotTime.startTime': startTime,
//       'slotTime.endTime': endTime,
//       servicePartnerId: servicePartnerId
//     };

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       throw new Error("Your slot is already booked");
//     }

//     // 8. Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(':').map(Number);
//       const [eh, em] = endTime.split(':').map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
    
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     // 9. ✅ CREATE NEXT BOOKING IN TREATMENT FLOW
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: 'Confirmed',  // ✅ Auto-confirm next booking in treatment flow
//       pricing,
//       notes: notes || `Next booking after completed treatment (${previousBookingId})`,
//       city: bookingCity._id,
//       createdBy: { 
//         userId: servicePartnerId, 
//         userModel: 'ServiceProvider' 
//       },
//       treatmentStatus: 'Scheduled',  // ✅ Next phase: treatment is scheduled but not started
//       invoiceGenerated: false,
//       previousBookingId: previousBookingId,
//       treatmentFlow: true  // ✅ Flag for treatment continuation flow
//     });

//     await newBooking.save({ session });

//     // 10. Update previous booking with nextBookingId (for chain tracking)
//     await Booking.findByIdAndUpdate(
//       previousBookingId,
//       { nextBookingId: newBooking._id },
//       { session }
//     );

//     // 11. Commit transaction
//     await session.commitTransaction();

//     // 12. Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name')
//       .populate('patientId', 'firstName phone')
//       .populate('serviceId', 'name category basePrice')
//       .populate('previousBookingId', 'appointmentDate status treatmentStatus');

//     res.status(201).json({
//       success: true,
//       message: 'Next treatment booking created successfully after completed booking',
//       data: {
//         booking: populatedBooking,
//         treatmentFlow: true,
//         previousBooking: {
//           bookingId: previousBookingId,
//           treatmentStatus: 'Completed',
//           nextBookingScheduled: true
//         }
//       }
//     });

//   } catch (error) {
//     if (transactionStarted) {
//       try {
//         await session.abortTransaction();
//       } catch (rollbackError) {
//         console.error('Transaction rollback failed:', rollbackError);
//       }
//     }

//     // Business logic errors
//     if (error.message.includes('not found') || error.message.includes('inactive') || 
//         error.message.includes('must have') || error.message.includes('already booked') ||
//         error.message.includes('required for next booking')) {
//       const statusCode = error.message.includes('booked') ? 409 : 400;
//       return res.status(statusCode).json({
//         success: false,
//         message: error.message
//       });
//     }

//     console.error('Provider booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create provider booking',
//       error: error.message
//     });
//   } finally {
//     await session.endSession();
//   }
// };












// exports.createProviderBooking = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     // ServiceProvider creates booking after treatment completion
//     const servicePartnerId = req.user.id; // Logged-in provider
//     const { 
//       patientId, 
//       previousBookingId, 
//       serviceId, 
//       appointmentDate, 
//       startTime, 
//       endTime, 
//       duration, 
//       shiftType, 
//       notes, 
//       category, 
//       modes, 
//       cityId 
//     } = req.body;

//     // 1. VALIDATION - Required fields
//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, endTime required",
//       });
//     }

//     await session.startTransaction();

//     // 2. Validate Service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive || service.isDeleted) {
//       await session.abortTransaction();
//       return res.status(404).json({ 
//         success: false, 
//         message: "Service not found or inactive" 
//       });
//     }

//     // 3. Validate Patient
//     const patient = await Patient.findById(patientId)
//       .select("address.cityId firstName phone")
//       .session(session);
//     if (!patient) {
//       await session.abortTransaction();
//       return res.status(400).json({ 
//         success: false, 
//         message: "Patient not found" 
//       });
//     }

//     // 4. Validate City
//     let bookingCity = cityId ? await City.findById(cityId).session(session) : 
//                              await City.findById(patient.address.cityId).session(session);
//     if (!bookingCity || !bookingCity.isActive) {
//       await session.abortTransaction();
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid or inactive city" 
//       });
//     }

//     // 5. ✅ PREVIOUS BOOKING VALIDATION (ONLY if provided)
//     let previousTreatmentId = null;
//     if (previousBookingId) {
//       const previousBooking = await Booking.findById(previousBookingId)
//         .populate('treatmentId', 'status')
//         .session(session);
        
//       if (!previousBooking) {
//         await session.abortTransaction();
//         return res.status(404).json({ 
//           success: false, 
//           message: "Previous booking not found" 
//         });
//       }
      
//       // ✅ CRITICAL: Must be COMPLETED treatment
//       if (previousBooking.treatmentId?.status !== 'Completed') {
//         await session.abortTransaction();
//         return res.status(400).json({ 
//           success: false, 
//           message: "Can only create follow-up after treatment completion" 
//         });
//       }
      
//       previousTreatmentId = previousBooking.treatmentId._id;
//     }

//     // 6. Check Provider's own slot conflicts
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
//       servicePartnerId: servicePartnerId  // Only check provider's own bookings
//     };

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       await session.abortTransaction();
//       return res.status(409).json({ 
//         success: false, 
//         message: "Your slot already booked" 
//       });
//     }

//     // 7. Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     // 8. ✅ ALWAYS CREATE NEW TREATMENT (follow-up = new treatment chain)
//     const newTreatment = new Treatment({
//       patientId,
//       serviceId,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       status: 'Active',
//       previousTreatmentId: previousTreatmentId || null  // Link to completed chain
//     });
//     await newTreatment.save({ session });
//     const treatmentId = newTreatment._id;

//     // 9. Create Booking (PROVIDER-CREATED)
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId,  // Current logged-in provider
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",  // Provider creates as Pending (needs patient confirmation?)
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { 
//         userId: servicePartnerId, 
//         userModel: "ServiceProvider" 
//       },  // ✅ Provider created this
//       treatmentId,
//       treatmentStatus: 'Active',
//       invoiceGenerated: false,
//       previousBookingId: previousBookingId || null
//     });
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     // 10. Populate response
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name')
//       .populate('treatmentId', 'status validTill previousTreatmentId')
//       .populate('patientId', 'firstName phone')
//       .populate('previousBookingId', 'appointmentDate status')
//       .lean();

//     res.status(201).json({
//       success: true,
//       message: "Provider follow-up booking created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId,
//         previousDetails: previousBookingId ? {
//           bookingId: previousBookingId,
//           previousTreatmentId,
//         } : null
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Provider booking error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Error creating provider booking", 
//       error: error.message 
//     });
//   } finally {
//     session.endSession();
//   }
// };




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

