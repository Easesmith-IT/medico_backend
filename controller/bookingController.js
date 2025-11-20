// // controllers/bookingController.js
// const Booking = require('../models/bookingModel');
// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const Service = require('../models/serviceModel');

// // Create Booking (Patient)
// // exports.createBooking = async (req, res) => {
// //   try {
// //     const {
// //       doctorId,
// //       serviceType,
// //       serviceMode,
// //       appointmentDate,
// //       slotTime,
// //       duration,
// //       location,
// //       paymentType,
// //       paymentId,
// //       transactionId,
// //       paymentGateway
// //     } = req.body;

// //     const patientId = req.user.id;

// //     // Verify doctor exists and is verified
// //     const doctor = await Doctor.findById(doctorId);
// //     if (!doctor || doctor.verificationStatus !== 'approved') {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Doctor not available or not verified'
// //       });
// //     }

// //     // Check slot availability
// //     const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
// //     if (!isAvailable) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Selected slot is not available'
// //       });
// //     }

// //     // Get service pricing
// //     const service = await Service.findOne({ name: serviceType });
// //     if (!service || !service.isActive) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Service not available'
// //       });
// //     }

// //     // Calculate pricing
// //     const basePrice = service.basePrice;
// //     const equipmentCharges = service.equipmentCharges || 0;
// //     const taxes = (basePrice + equipmentCharges) * (service.taxPercentage / 100);
// //     const totalAmount = basePrice + equipmentCharges + taxes;

// //     // Validate payment for Prepaid
// //     if (paymentType === 'Prepaid' && !paymentId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Payment required for prepaid booking'
// //       });
// //     }

// //     // Create booking
// //     const booking = new Booking({
// //       patientId,
// //       doctorId,
// //       serviceType,
// //       serviceMode,
// //       appointmentDate: new Date(appointmentDate),
// //       slotTime,
// //       duration: duration || service.defaultDuration,
// //       location,
// //       pricing: {
// //         basePrice,
// //         equipmentCharges,
// //         taxes,
// //         totalAmount
// //       },
// //       paymentType,
// //       paymentId,
// //       transactionId,
// //       paymentGateway,
// //       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
// //       adminApproval: { status: 'Pending' }
// //     });

// //     await booking.save();

// //     // Book the slot in doctor's availability
// //     doctor.bookSlot(appointmentDate, slotTime.startTime, booking._id);
// //     await doctor.save();

// //     // Send notification (implement notification service)
// //     // await sendNotification(patientId, 'Booking request received');

// //     res.status(201).json({
// //       success: true,
// //       message: 'Booking created successfully. Awaiting admin approval.',
// //       data: booking
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating booking',
// //       error: error.message
// //     });
// //   }
// // };
// // exports.createBooking = async (req, res) => {
// //   try {
// //     const {
// //       doctorId,
// //       serviceId,
// //       serviceMode,
// //       appointmentDate,
// //       slotTime,
// //       duration,
// //       location,
// //       paymentType,
// //       paymentId,
// //       transactionId,
// //       paymentGateway
// //     } = req.body;

// //     const patientId = req.user.id;

// //     // Verify doctor exists and is verified
// //     const doctor = await Doctor.findById(doctorId);
// //     if (!doctor || doctor.verificationStatus !== 'approved') {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Doctor not available or not verified'
// //       });
// //     }

// //     // Check slot availability
// //     const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
// //     if (!isAvailable) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Selected slot is not available'
// //       });
// //     }

// //     // Get service pricing using serviceId
// //     const service = await Service.findById(serviceId);
// //     if (!service || !service.isActive) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Service not available'
// //       });
// //     }

// //     // Calculate pricing
// //     const basePrice = service.basePrice;
// //     const equipmentCharges = service.equipmentCharges || 0;
// //     const taxes = (basePrice + equipmentCharges) * (service.taxPercentage / 100);
// //     const totalAmount = basePrice + equipmentCharges + taxes;

// //     // Validate payment for Prepaid
// //     if (paymentType === 'Prepaid' && !paymentId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Payment required for prepaid booking'
// //       });
// //     }

// //     // Create booking - bookingId will be auto-generated by pre-validate hook
// //     const booking = new Booking({
// //       patientId,
// //       doctorId,
// //       serviceType: service.name,
// //       serviceMode,
// //       appointmentDate: new Date(appointmentDate),
// //       slotTime,
// //       duration: duration || service.defaultDuration,
// //       location,
// //       pricing: {
// //         basePrice,
// //         equipmentCharges,
// //         taxes,
// //         totalAmount
// //       },
// //       paymentType,
// //       paymentId,
// //       transactionId,
// //       paymentGateway,
// //       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
// //       status: 'Pending', //Now valid enum value
// //       adminApproval: { status: 'Pending' }
// //     });

// //     await booking.save();

// //     // Book the slot in doctor's availability
// //     doctor.bookSlot(appointmentDate, slotTime.startTime, booking._id);
// //     await doctor.save();

// //     res.status(201).json({
// //       success: true,
// //       message: 'Booking created successfully. Awaiting admin approval.',
// //       data: booking
// //     });
// //   } catch (error) {
// //     console.error('Booking creation error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating booking',
// //       error: error.message
// //     });
// //   }
// // };
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const {
//       doctorId,
//       serviceId,
//       serviceMode,
//       appointmentDate,
//       slotTime,
//       duration,
//       shiftType,
//       location,
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway,
//       paymentDetails,
//       includeEquipment,
//       emergencyContact,
//       couponCode
//     } = req.body;

//     const patientId = req.user.id;

//     // Validate required fields
//     if (!serviceId) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Service ID is required'
//       });
//     }

//     if (!serviceMode || !['Home Service', 'Visit Provider Location'].includes(serviceMode)) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Valid service mode is required'
//       });
//     }

//     if (!slotTime || !slotTime.startTime || !slotTime.endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Slot time with startTime and endTime is required'
//       });
//     }

//     // Get service details
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Service not available or inactive'
//       });
//     }

//     const serviceCategory = service.category;

//     // Validate consultation services (9 AM - 7 PM, 30-minute slots)
//     if (serviceCategory === 'consultation') {
//       const [startHour, startMin] = slotTime.startTime.split(':').map(Number);
//       const [endHour, endMin] = slotTime.endTime.split(':').map(Number);

//       if (startHour < 9 || startHour >= 19) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation services are only available between 09:00 and 19:00'
//         });
//       }

//       const startMinutes = startHour * 60 + startMin;
//       const endMinutes = endHour * 60 + endMin;
//       const slotDuration = endMinutes - startMinutes;

//       if (slotDuration !== 30) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation slots must be exactly 30 minutes'
//         });
//       }

//       if (startMin !== 0 && startMin !== 30) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation slots must start at :00 or :30 minutes'
//         });
//       }
//     }

//     // Validate nursing services
//     if (serviceCategory === 'nursing') {
//       if (!shiftType) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Shift type is required for nursing services'
//         });
//       }

//       if (!service.slotConfig.nursingSlots.shiftTypes.includes(shiftType)) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: `This nursing service does not support ${shiftType} shift`
//         });
//       }
//     }

//     // Validate equipment services
//     if (serviceCategory === 'equipment') {
//       const calculatedDuration = duration || 60;
//       if (calculatedDuration < 60 || calculatedDuration > 720) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Equipment services require duration between 60-720 minutes'
//         });
//       }
//     }

//     // Validate doctor if specified
//     let doctor = null;
//     if (doctorId) {
//       doctor = await Doctor.findById(doctorId).session(session);
//       if (!doctor || doctor.verificationStatus !== 'approved') {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Doctor not found or not approved'
//         });
//       }

//       // Check doctor slot availability
//       const existingDoctorBooking = await Booking.findOne({
//         doctorId,
//         appointmentDate: {
//           $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
//           $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
//         },
//         'slotTime.startTime': slotTime.startTime,
//         status: { $nin: ['Cancelled', 'Disapproved'] }
//       }).session(session);

//       if (existingDoctorBooking) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'This doctor already has a booking in this time slot'
//         });
//       }
//     }

//     // Validate appointment date
//     const appointmentDateTime = new Date(appointmentDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     if (appointmentDateTime < today) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Appointment date cannot be in the past'
//       });
//     }

//     // Calculate duration
//     let bookingDuration;
//     if (serviceCategory === 'nursing' && shiftType) {
//       const shiftDurations = {
//         'hourly': duration || 60,
//         '8-hour': 480,
//         '12-hour': 720,
//         '24-hour': 1440,
//         'day-shift': 720,
//         'night-shift': 720
//       };
//       bookingDuration = shiftDurations[shiftType];
//     } else {
//       bookingDuration = duration || service.defaultDuration || 30;
//     }

//     // Calculate pricing
//     const pricingDetails = service.calculateTotalPrice 
//       ? service.calculateTotalPrice(bookingDuration, includeEquipment, shiftType)
//       : {
//           basePrice: service.basePrice,
//           equipmentCharges: includeEquipment ? (service.equipmentCharges || 0) : 0,
//           subtotal: service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0),
//           taxPercentage: service.taxPercentage || 18,
//           taxAmount: (service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0)) * ((service.taxPercentage || 18) / 100),
//           totalAmount: service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0) + ((service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0)) * ((service.taxPercentage || 18) / 100))
//         };

//     // Apply coupon if provided
//     let discount = 0;
//     if (couponCode) {
//       // Add your coupon validation logic here
//       discount = 0; // Calculate discount based on coupon
//     }

//     // Validate payment
//     if (paymentType === 'Prepaid' && !paymentId) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Payment ID is required for prepaid bookings'
//       });
//     }

//     // Validate location
//     if (serviceMode === 'Home Service' && (!location || !location.address)) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Complete address is required for home service'
//       });
//     }

//     // Create booking
//     const booking = new Booking({
//       patientId,
//       doctorId: doctorId || null,
//       serviceId,
//       serviceType: service.name,
//       serviceCategory: serviceCategory,
//       shiftType: serviceCategory === 'nursing' ? shiftType : null,
//       serviceMode,
//       appointmentDate: appointmentDateTime,
//       slotTime: {
//         startTime: slotTime.startTime,
//         endTime: slotTime.endTime,
//         displayFormat: '24-hour'
//       },
//       duration: bookingDuration,
//       location: serviceMode === 'Home Service' ? {
//         type: 'home',
//         address: location.address
//       } : {
//         type: 'provider',
//         address: location.providerAddress || {}
//       },
//       pricing: {
//         basePrice: pricingDetails.basePrice,
//         equipmentCharges: pricingDetails.equipmentCharges,
//         subtotal: pricingDetails.subtotal,
//         taxPercentage: pricingDetails.taxPercentage,
//         taxes: pricingDetails.taxAmount,
//         discount: discount,
//         couponCode: couponCode || null,
//         totalAmount: pricingDetails.totalAmount - discount
//       },
//       paymentType,
//       paymentId: paymentId || null,
//       transactionId: transactionId || null,
//       paymentGateway: paymentGateway || null,
//       paymentDetails: paymentDetails || {},
//       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
//       paymentDate: paymentType === 'Prepaid' ? new Date() : null,
//       status: 'Pending',
//       adminApproval: { 
//         status: 'Pending' 
//       },
//       emergencyContact: emergencyContact || {},
//       metadata: {
//         bookingSource: req.headers['x-booking-source'] || 'web',
//         deviceInfo: {
//           userAgent: req.headers['user-agent'],
//           ipAddress: req.ip
//         }
//       }
//     });

//     await booking.save({ session });

//     // Book doctor slot if specified
//     if (doctor && doctor.bookSlot) {
//       doctor.bookSlot(appointmentDateTime, slotTime.startTime, booking._id);
//       await doctor.save({ session });
//     }

//     // Add notification
//     booking.notifications.push({
//       type: 'booking_confirmation',
//       recipient: 'Patient',
//       recipientId: patientId,
//       message: `Booking ${booking.bookingId} created successfully. Awaiting admin approval.`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });
//     await booking.save({ session });

//     await session.commitTransaction();

//     // Populate response
//     await booking.populate([
//       { path: 'patientId', select: 'name email phone' },
//       { path: 'doctorId', select: 'name specialization email phone' },
//       { path: 'serviceId', select: 'name description basePrice category nursingType' }
//     ]);

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully',
//       data: {
//         booking,
//         serviceInfo: {
//           category: serviceCategory,
//           ...(serviceCategory === 'nursing' && {
//             shiftType,
//             duration: `${bookingDuration} minutes`,
//             available: '24x7'
//           }),
//           ...(serviceCategory === 'consultation' && {
//             slotDuration: '30 minutes',
//             timeRange: '09:00-19:00'
//           }),
//           ...(serviceCategory === 'equipment' && {
//             duration: `${bookingDuration} minutes`,
//             available: '24x7'
//           })
//         }
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Booking creation error:', error);
    
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: 'Slot conflict: This time slot is already booked'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };


// // Get Patient Bookings
// exports.getPatientBookings = async (req, res) => {
//   try {
//     const patientId = req.user.id;
//     const { status, filter } = req.query; // filter: upcoming, ongoing, past

//     const query = { patientId };
    
//     if (status) {
//       query.status = status;
//     }

//     // Filter by time
//     if (filter === 'upcoming') {
//       query.appointmentDate = { $gte: new Date() };
//       query.status = { $in: ['Scheduled', 'Rescheduled'] };
//     } else if (filter === 'ongoing') {
//       query.status = 'On Going';
//     } else if (filter === 'past') {
//       query.$or = [
//         { status: 'Completed' },
//         { appointmentDate: { $lt: new Date() } }
//       ];
//     }

//     const bookings = await Booking.find(query)
//       .populate('doctorId', 'firstName specialization yearsOfExperience averageRating profilePhoto')
//       .sort({ appointmentDate: -1 });

//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching bookings',
//       error: error.message
//     });
//   }
// };

// // Get Doctor Appointments
// exports.getDoctorAppointments = async (req, res) => {
//   try {
//     const doctorId = req.user.id;
//     const { date, status } = req.query;

//     const query = { doctorId };
    
//     if (date) {
//       const startOfDay = new Date(date);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(date);
//       endOfDay.setHours(23, 59, 59, 999);
      
//       query.appointmentDate = {
//         $gte: startOfDay,
//         $lte: endOfDay
//       };
//     }
    
//     if (status) query.status = status;

//     const appointments = await Booking.find(query)
//       .populate('patientId', 'name age gender phone address')
//       .sort({ appointmentDate: 1, 'slotTime.startTime': 1 });

//     res.status(200).json({
//       success: true,
//       count: appointments.length,
//       data: appointments
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching appointments',
//       error: error.message
//     });
//   }
// };

// // Update Sub-Status (Provider)
// exports.updateSubStatus = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { subStatus } = req.body;
//     const doctorId = req.user.id;

//     const booking = await Booking.findOne({ bookingId, doctorId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     booking.subStatus = subStatus;
    
//     if (subStatus === 'On the Way' || subStatus === 'Reached') {
//       booking.status = 'On Going';
//     }

//     await booking.save();

//     // Send notification to patient
//     // await sendNotification(booking.patientId, `Provider ${subStatus}`);

//     res.status(200).json({
//       success: true,
//       message: 'Sub-status updated successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating sub-status',
//       error: error.message
//     });
//   }
// };

// // Complete Appointment (Provider)
// exports.completeAppointment = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { providerNotes } = req.body;
//     const doctorId = req.user.id;

//     const booking = await Booking.findOne({ bookingId, doctorId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     booking.status = 'Completed';
//     booking.subStatus = 'Completed';
//     booking.providerNotes = providerNotes;

//     // Generate invoice for postpaid
//     if (booking.paymentType === 'Postpaid') {
//       booking.invoice = {
//         invoiceNumber: `INV${booking.bookingId}`,
//         generatedAt: new Date(),
//         isGenerated: true
//         // invoiceUrl will be set after PDF generation
//       };
//     }

//     await booking.save();

//     // Send completion notification
//     // await sendNotification(booking.patientId, 'Service completed');

//     res.status(200).json({
//       success: true,
//       message: 'Appointment completed successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error completing appointment',
//       error: error.message
//     });
//   }
// };

// // Admin Approve Booking
// exports.approveBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { remarks } = req.body;
//     const adminId = req.user.id;

//     const booking = await Booking.findOne({ bookingId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.adminApproval.status !== 'Pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Booking already processed'
//       });
//     }

//     booking.adminApproval = {
//       status: 'Approved',
//       approvedBy: adminId,
//       approvedAt: new Date(),
//       remarks
//     };
//     booking.status = 'Scheduled';

//     await booking.save();

//     // Send notification to patient and doctor
//     // await sendNotification(booking.patientId, 'Booking approved');
//     // await sendNotification(booking.doctorId, 'New appointment scheduled');

//     res.status(200).json({
//       success: true,
//       message: 'Booking approved successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error approving booking',
//       error: error.message
//     });
//   }
// };

// // Admin Disapprove Booking
// exports.disapproveBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { remarks } = req.body;
//     const adminId = req.user.id;

//     if (!remarks) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide reason for disapproval'
//       });
//     }

//     const booking = await Booking.findOne({ bookingId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     booking.adminApproval = {
//       status: 'Disapproved',
//       approvedBy: adminId,
//       approvedAt: new Date(),
//       remarks
//     };
//     booking.status = 'Disapproved';

//     await booking.save();

//     // Release the slot
//     const doctor = await Doctor.findById(booking.doctorId);
//     if (doctor) {
//       doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);
//       await doctor.save();
//     }

//     // Refund if prepaid
//     if (booking.paymentType === 'Prepaid') {
//       booking.paymentStatus = 'Refunded';
//       await booking.save();
//       // Implement refund logic here
//     }

//     // Send notification
//     // await sendNotification(booking.patientId, `Booking disapproved: ${remarks}`);

//     res.status(200).json({
//       success: true,
//       message: 'Booking disapproved',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error disapproving booking',
//       error: error.message
//     });
//   }
// };

// // Cancel Booking
// exports.cancelBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { reason } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     const booking = await Booking.findOne({ bookingId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     // Check if user has permission to cancel
//     if (userRole === 'patient' && booking.patientId.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to cancel this booking'
//       });
//     }

//     if (userRole === 'doctor' && booking.doctorId.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to cancel this booking'
//       });
//     }

//     booking.status = 'Cancelled';
//     booking.cancellation = {
//       cancelledBy: userRole.charAt(0).toUpperCase() + userRole.slice(1),
//       cancelledAt: new Date(),
//       reason
//     };

//     await booking.save();

//     // Release the slot
//     const doctor = await Doctor.findById(booking.doctorId);
//     if (doctor) {
//       doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);
//       await doctor.save();
//     }

//     // Handle refund for prepaid
//     if (booking.paymentType === 'Prepaid') {
//       booking.paymentStatus = 'Refunded';
//       await booking.save();
//       // Implement refund logic
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Booking cancelled successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error cancelling booking',
//       error: error.message
//     });
//   }
// };

// // Reschedule Booking
// exports.rescheduleBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { newDate, newSlot, reason } = req.body;
//     const userRole = req.user.role;

//     const booking = await Booking.findOne({ bookingId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     const doctor = await Doctor.findById(booking.doctorId);

//     // Check new slot availability
//     const isAvailable = doctor.isSlotAvailable(newDate, newSlot.startTime);
//     if (!isAvailable) {
//       return res.status(400).json({
//         success: false,
//         message: 'New slot is not available'
//       });
//     }

//     // Save reschedule history
//     booking.rescheduleHistory.push({
//       oldDate: booking.appointmentDate,
//       oldSlot: booking.slotTime,
//       newDate: new Date(newDate),
//       newSlot,
//       rescheduledBy: userRole.charAt(0).toUpperCase() + userRole.slice(1),
//       rescheduledAt: new Date(),
//       reason
//     });

//     // Release old slot
//     doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);

//     // Book new slot
//     doctor.bookSlot(newDate, newSlot.startTime, booking._id);
//     await doctor.save();

//     // Update booking
//     booking.appointmentDate = new Date(newDate);
//     booking.slotTime = newSlot;
//     booking.status = 'Rescheduled';

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Booking rescheduled successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error rescheduling booking',
//       error: error.message
//     });
//   }
// };

// // Rebook Appointment
// exports.rebookAppointment = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { appointmentDate, slotTime } = req.body;
//     const patientId = req.user.id;

//     const originalBooking = await Booking.findOne({ bookingId, patientId });

//     if (!originalBooking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Original booking not found'
//       });
//     }

//     // Check slot availability
//     const doctor = await Doctor.findById(originalBooking.doctorId);
//     const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
    
//     if (!isAvailable) {
//       return res.status(400).json({
//         success: false,
//         message: 'Selected slot is not available'
//       });
//     }

//     // Create new booking with same details
//     const newBooking = new Booking({
//       patientId: originalBooking.patientId,
//       doctorId: originalBooking.doctorId,
//       serviceType: originalBooking.serviceType,
//       serviceMode: originalBooking.serviceMode,
//       appointmentDate: new Date(appointmentDate),
//       slotTime,
//       duration: originalBooking.duration,
//       location: originalBooking.location,
//       pricing: originalBooking.pricing,
//       paymentType: originalBooking.paymentType,
//       adminApproval: { status: 'Pending' }
//     });

//     await newBooking.save();

//     // Book the slot
//     doctor.bookSlot(appointmentDate, slotTime.startTime, newBooking._id);
//     await doctor.save();

//     res.status(201).json({
//       success: true,
//       message: 'Appointment rebooked successfully',
//       data: newBooking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error rebooking appointment',
//       error: error.message
//     });
//   }
// };

// // Submit Feedback & Rating
// exports.submitFeedback = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { rating, review } = req.body;
//     const patientId = req.user.id;

//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid rating (1-5)'
//       });
//     }

//     const booking = await Booking.findOne({ bookingId, patientId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.status !== 'Completed') {
//       return res.status(400).json({
//         success: false,
//         message: 'Can only rate completed appointments'
//       });
//     }

//     booking.feedback = {
//       rating,
//       review,
//       submittedAt: new Date()
//     };

//     await booking.save();

//     // Update doctor's average rating
//     const doctor = await Doctor.findById(booking.doctorId);
//     const allBookings = await Booking.find({ 
//       doctorId: booking.doctorId,
//       'feedback.rating': { $exists: true }
//     });

//     const totalRating = allBookings.reduce((sum, b) => sum + b.feedback.rating, 0);
//     doctor.averageRating = (totalRating / allBookings.length).toFixed(1);
//     doctor.totalReviews = allBookings.length;
//     await doctor.save();

//     res.status(200).json({
//       success: true,
//       message: 'Feedback submitted successfully',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error submitting feedback',
//       error: error.message
//     });
//   }
// };

// // Get Pending Approvals (Admin)
// exports.getPendingApprovals = async (req, res) => {
//   try {
//     const bookings = await Booking.find({ 
//       'adminApproval.status': 'Pending' 
//     })
//       .populate('patientId', 'name phone address')
//       .populate('doctorId', 'firstName specialization')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: bookings.length,
//       data: bookings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching pending approvals',
//       error: error.message
//     });
//   }
// };

// // Get All Bookings (Admin)
// exports.getAllBookings = async (req, res) => {
//   try {
//     const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

//     const query = {};
    
//     if (status) query.status = status;
    
//     if (startDate && endDate) {
//       query.appointmentDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const bookings = await Booking.find(query)
//       .populate('patientId', 'name phone')
//       .populate('doctorId', 'firstName specialization')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const count = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: bookings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching bookings',
//       error: error.message
//     });
//   }
// };





// // ADD THESE TWO MISSING FUNCTIONS TO controllers/bookingController.js

// // Get Single Booking Details
// exports.getBookingDetails = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     const booking = await Booking.findOne({ bookingId })
//       .populate('patientId', 'name phone email profilePhoto age gender address')
//       .populate('doctorId', 'firstName specialization yearsOfExperience averageRating profilePhoto consultationFees');

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     // Authorization check
//     if (userRole === 'patient' && booking.patientId._id.toString() !== userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to view this booking'
//       });
//     }

//     if (userRole === 'doctor' && booking.doctorId._id.toString() !== userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to view this booking'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching booking details',
//       error: error.message
//     });
//   }
// };

// // Get Booking Stats (Admin)
// exports.getBookingStats = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     const matchQuery = {};
    
//     if (startDate && endDate) {
//       matchQuery.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const stats = await Booking.aggregate([
//       { $match: matchQuery },
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 },
//           totalRevenue: { $sum: '$pricing.totalAmount' }
//         }
//       }
//     ]);

//     const totalBookings = await Booking.countDocuments(matchQuery);
//     const pendingApprovals = await Booking.countDocuments({
//       ...matchQuery,
//       'adminApproval.status': 'Pending'
//     });
//     const completedBookings = await Booking.countDocuments({
//       ...matchQuery,
//       status: 'Completed'
//     });

//     const totalRevenue = await Booking.aggregate([
//       { $match: { ...matchQuery, paymentStatus: 'Completed' } },
//       { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         totalBookings,
//         pendingApprovals,
//         completedBookings,
//         totalRevenue: totalRevenue[0]?.total || 0,
//         statusBreakdown: stats
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching booking stats',
//       error: error.message
//     });
//   }
// };





// module.exports = exports;









const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Service = require('../models/serviceModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const ServicePartner = require('../models/serviceModel');
const Admin = require('../models/adminModel');

// ============= HELPER FUNCTIONS =============

const formatDuration = (minutes) => {
  if (minutes === 30) return '0.5 hours';
  if (minutes === 45) return '0.75 hours';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1.5 hours';
  if (minutes === 120) return '2 hours';
  if (minutes === 150) return '2.5 hours';
  if (minutes === 180) return '3 hours';
  if (minutes === 240) return '4 hours';
  if (minutes === 360) return '6 hours';
  if (minutes === 480) return '8 hours';
  if (minutes === 720) return '12 hours';
  if (minutes === 1440) return '24 hours';
  
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${minutes / 60} hours`;
};

const formatTime = (time24, format = '24-hour') => {
  if (!time24) return null;
  
  const timeStr = time24.toString();
  let hours, minutes;
  
  if (timeStr.includes(':')) {
    [hours, minutes] = timeStr.split(':').map(Number);
  } else if (time24 instanceof Date) {
    hours = time24.getHours();
    minutes = time24.getMinutes();
  } else {
    return timeStr;
  }
  
  if (format === '12-hour') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseTime = (timeString) => {
  if (!timeString) return null;
  
  const time12Regex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.match(time12Regex);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  return timeString;
};

const calculateEndTime = (startTime, durationMinutes) => {
  const start = new Date(startTime);
  return new Date(start.getTime() + durationMinutes * 60000);
};

const validateTimeSlot = async (serviceId, startTime, durationMinutes, partnerId = null, excludeBookingId = null) => {
  const endTime = calculateEndTime(startTime, durationMinutes);
  
  const query = {
    service: serviceId,
    status: { $nin: ['cancelled', 'rejected', 'completed'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };

  if (partnerId) {
    query.partner = partnerId;
  }

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return !conflictingBooking;
};

const validateDuration = (duration, category) => {
  if (category === 'consultation') {
    return duration === 30;
  }
  return duration >= 60 && duration <= 1440;
};

// ============= PATIENT FUNCTIONS =============

exports.createBooking = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      serviceId,
      cityId,
      date, // ✅ Date in YYYY-MM-DD format
      startTime, // ✅ Time can be in 12-hour or 24-hour format
      duration, // ✅ Duration in MINUTES
      address,
      notes,
      paymentMethod,
      preferredPartnerId,
      timeFormat // ✅ Patient's preferred time format (12-hour or 24-hour)
    } = req.body;

    // Validate required fields
    if (!serviceId || !cityId || !date || !startTime || !duration || !address) {
      return res.status(400).json({
        success: false,
        message: 'Service, city, date, start time, duration, and address are required'
      });
    }

    // Verify service exists and is active
    const service = await Service.findOne({ 
      _id: serviceId, 
      isActive: true, 
      isDeleted: false,
      cities: cityId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or not available in this city'
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // ✅ Validate duration based on service category
    if (!validateDuration(duration, service.category)) {
      return res.status(400).json({
        success: false,
        message: service.category === 'consultation' 
          ? 'Consultation services must be 30 minutes'
          : 'Duration must be between 1 hour (60 minutes) and 24 hours (1440 minutes)'
      });
    }

    // ✅ Parse start time (handle both 12-hour and 24-hour formats)
    const parsedStartTime = parseTime(startTime);
    if (!parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use either 12-hour (e.g., "02:30 PM") or 24-hour (e.g., "14:30") format'
      });
    }

    // ✅ Create full start time with date
    const [hours, minutes] = parsedStartTime.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Check if booking is in the past
    if (startDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a time slot in the past'
      });
    }

    // Calculate end time
    const endDateTime = calculateEndTime(startDateTime, duration);

    // Validate time slot availability
    const isSlotAvailable = await validateTimeSlot(serviceId, startDateTime, duration, preferredPartnerId);
    if (!isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available. Please choose a different time.'
      });
    }

    // Calculate pricing
    const pricing = service.calculateTotalPrice(duration, false, null);

    // Create booking
    const booking = new Booking({
      patient: patientId,
      service: serviceId,
      city: cityId,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      durationFormatted: formatDuration(duration), // ✅ Store formatted duration
      address,
      notes,
      pricing,
      paymentMethod: paymentMethod || 'Cash',
      timeFormat: timeFormat || service.timeFormat || '24-hour', // ✅ Store patient's time format preference
      status: service.category === 'consultation' ? 'confirmed' : 'pending',
      requiresAdminApproval: service.category !== 'consultation',
      partner: preferredPartnerId || null
    });

    await booking.save();

    // Populate response
    await booking.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'service', select: 'name category basePrice' },
      { path: 'city', select: 'name' }
    ]);

    // ✅ Format times in response according to patient's preference
    const responseTimeFormat = timeFormat || '24-hour';
    const formattedBooking = {
      ...booking.toObject(),
      startTimeFormatted: formatTime(startDateTime, responseTimeFormat),
      endTimeFormatted: formatTime(endDateTime, responseTimeFormat),
      durationFormatted: formatDuration(duration)
    };

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: formattedBooking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

exports.getPatientBookings = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', timeFormat = '24-hour' } = req.query;

    const query = { patient: patientId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const bookings = await Booking.find(query)
      .populate('service', 'name category icon basePrice')
      .populate('partner', 'firstName lastName phone rating')
      .populate('city', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    // Format times in each booking
    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    }));

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findOne({ 
      _id: id, 
      patient: patientId,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Completed booking not found'
      });
    }

    if (booking.feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this booking'
      });
    }

    booking.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await booking.save();

    // Update partner rating if applicable
    if (booking.partner) {
      const partner = await Partner.findById(booking.partner);
      if (partner) {
        const totalBookings = partner.completedBookings || 0;
        const currentRating = partner.rating || 0;
        const newRating = (currentRating * totalBookings + rating) / (totalBookings + 1);
        partner.rating = newRating;
        await partner.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: booking
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// ============= SERVICE PARTNER FUNCTIONS =============

exports.getPartnerBookings = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const { status, page = 1, limit = 10, timeFormat = '24-hour' } = req.query;

    const query = { partner: partnerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('patient', 'firstName lastName phone address')
      .populate('service', 'name category basePrice duration')
      .populate('city', 'name')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    }));

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get partner bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

exports.partnerAcceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;

    const booking = await Booking.findOne({ 
      _id: id, 
      partner: partnerId,
      status: 'assigned'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already processed'
      });
    }

    booking.status = 'confirmed';
    booking.partnerResponse = {
      status: 'accepted',
      timestamp: new Date()
    };

    await booking.save();
    await booking.populate('patient service city');

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });

  } catch (error) {
    console.error('Partner accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting booking',
      error: error.message
    });
  }
};

exports.partnerRejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;
    const { reason } = req.body;

    const booking = await Booking.findOne({ 
      _id: id, 
      partner: partnerId,
      status: 'assigned'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already processed'
      });
    }

    booking.status = 'pending_reassignment';
    booking.partner = null;
    booking.partnerResponse = {
      status: 'rejected',
      reason,
      timestamp: new Date()
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected. Admin will reassign.',
      data: booking
    });

  } catch (error) {
    console.error('Partner reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message
    });
  }
};

exports.startService = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;

    const booking = await Booking.findOne({ 
      _id: id, 
      partner: partnerId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Confirmed booking not found'
      });
    }

    booking.status = 'in_progress';
    booking.serviceStartedAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Service started successfully',
      data: booking
    });

  } catch (error) {
    console.error('Start service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting service',
      error: error.message
    });
  }
};

exports.completeService = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.user.id;
    const { notes } = req.body;

    const booking = await Booking.findOne({ 
      _id: id, 
      partner: partnerId,
      status: 'in_progress'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'In-progress booking not found'
      });
    }

    booking.status = 'completed';
    booking.serviceCompletedAt = new Date();
    booking.completionNotes = notes;

    await booking.save();

    // Update partner completed bookings count
    await Partner.findByIdAndUpdate(partnerId, { 
      $inc: { completedBookings: 1 } 
    });

    res.status(200).json({
      success: true,
      message: 'Service completed successfully',
      data: booking
    });

  } catch (error) {
    console.error('Complete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing service',
      error: error.message
    });
  }
};

// ============= DOCTOR FUNCTIONS =============

exports.getDoctorBookings = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, date, page = 1, limit = 20, timeFormat = '24-hour' } = req.query;

    // Find consultation services created by this doctor
    const services = await Service.find({
      category: 'consultation',
      'createdBy.userId': doctorId
    }).select('_id');

    const serviceIds = services.map(s => s._id);

    const query = { 
      service: { $in: serviceIds }
    };

    if (status) query.status = status;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startDate, $lte: endDate };
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('patient', 'firstName lastName email phone age gender')
      .populate('service', 'name duration basePrice')
      .populate('city', 'name')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    }));

    res.status(200).json({
      success: true,
      data: {
        appointments: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get doctor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// ============= ADMIN FUNCTIONS =============

exports.getPendingAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 20, timeFormat = '24-hour' } = req.query;

    const query = {
      $or: [
        { status: 'pending' },
        { status: 'pending_reassignment' }
      ]
    };

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('patient', 'firstName lastName phone')
      .populate('service', 'name category')
      .populate('city', 'name')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    }));

    res.status(200).json({
      success: true,
      data: {
        pendingBookings: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pending assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const {
      status,
      category,
      cityId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      timeFormat = '24-hour'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (cityId) query.city = cityId;

    if (category) {
      const services = await Service.find({ category }).select('_id');
      query.service = { $in: services.map(s => s._id) };
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const bookings = await Booking.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('service', 'name category basePrice')
      .populate('partner', 'firstName lastName phone rating')
      .populate('city', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    const formattedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    }));

    res.status(200).json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'in_progress' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.finalPrice' } } }
      ]),

      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      Booking.aggregate([
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceData'
          }
        },
        { $unwind: '$serviceData' },
        { $group: { _id: '$serviceData.category', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending: stats[0],
        confirmed: stats[1],
        inProgress: stats[2],
        completed: stats[3],
        cancelled: stats[4],
        totalRevenue: stats[5][0]?.total || 0,
        byStatus: stats[6],
        byCategory: stats[7]
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ 
      _id: id, 
      status: 'pending' 
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Pending booking not found'
      });
    }

    booking.status = 'approved';
    booking.approvedBy = {
      userId: req.user.id,
      timestamp: new Date()
    };

    await booking.save();
    await booking.populate('patient service city');

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });

  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving booking',
      error: error.message
    });
  }
};

exports.disapproveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({ 
      _id: id, 
      status: 'pending' 
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Pending booking not found'
      });
    }

    booking.status = 'rejected';
    booking.rejectionReason = reason;
    booking.rejectedBy = {
      userId: req.user.id,
      timestamp: new Date()
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });

  } catch (error) {
    console.error('Disapprove booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message
    });
  }
};

exports.assignPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required'
      });
    }

    const booking = await Booking.findOne({ 
      _id: id,
      status: { $in: ['approved', 'pending_reassignment'] }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be assigned'
      });
    }

    // Verify partner exists
    const partner = await Partner.findById(partnerId);
    
    if (!partner || !partner.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found or inactive'
      });
    }

    booking.partner = partnerId;
    booking.status = 'assigned';
    booking.assignedBy = {
      userId: req.user.id,
      timestamp: new Date()
    };

    await booking.save();
    await booking.populate('patient service partner city');

    res.status(200).json({
      success: true,
      message: 'Partner assigned successfully',
      data: booking
    });

  } catch (error) {
    console.error('Assign partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning partner',
      error: error.message
    });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { timeFormat = '24-hour' } = req.query;

    const query = { _id: id };
    
    if (userRole === 'patient') {
      query.patient = userId;
    }

    const booking = await Booking.findOne(query)
      .populate('patient', 'firstName lastName email phone address')
      .populate('service', 'name category basePrice taxPercentage')
      .populate('partner', 'firstName lastName')
      .populate('city', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const invoice = {
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      date: new Date(),
      booking: {
        id: booking._id,
        service: booking.service.name,
        category: booking.service.category,
        startTime: formatTime(booking.startTime, timeFormat),
        endTime: formatTime(booking.endTime, timeFormat),
        duration: formatDuration(booking.duration)
      },
      patient: {
        name: `${booking.patient.firstName} ${booking.patient.lastName}`,
        email: booking.patient.email,
        phone: booking.patient.phone,
        address: booking.address
      },
      partner: booking.partner ? {
        name: `${booking.partner.firstName} ${booking.partner.lastName}`
      } : null,
      pricing: booking.pricing,
      paymentMethod: booking.paymentMethod,
      status: booking.status
    };

    res.status(200).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
};

// ============= COMMON FUNCTIONS =============

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    const query = { _id: id };

    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'partner') {
      query.partner = userId;
    } else if (userRole === 'doctor') {
      const services = await Service.find({ 'createdBy.userId': userId }).select('_id');
      query.service = { $in: services.map(s => s._id) };
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${booking.status} booking`
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      by: userRole,
      userId,
      reason,
      timestamp: new Date()
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { date, newStartTime, reason } = req.body;

    if (!date || !newStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Date and new start time are required'
      });
    }

    const query = { _id: id };

    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'partner') {
      query.partner = userId;
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    if (['completed', 'cancelled', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule ${booking.status} booking`
      });
    }

    // Parse new start time
    const parsedNewStartTime = parseTime(newStartTime);
    if (!parsedNewStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format'
      });
    }

    // Create new start time
    const [hours, minutes] = parsedNewStartTime.split(':').map(Number);
    const newStartDateTime = new Date(date);
    newStartDateTime.setHours(hours, minutes, 0, 0);

    if (newStartDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a time in the past'
      });
    }

    // Validate new time slot
    const isAvailable = await validateTimeSlot(
      booking.service,
      newStartDateTime,
      booking.duration,
      booking.partner,
      booking._id
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'New time slot is not available'
      });
    }

    const newEndDateTime = calculateEndTime(newStartDateTime, booking.duration);

    booking.rescheduling = {
      oldStartTime: booking.startTime,
      oldEndTime: booking.endTime,
      newStartTime: newStartDateTime,
      newEndTime: newEndDateTime,
      by: userRole,
      userId,
      reason,
      timestamp: new Date()
    };

    booking.startTime = newStartDateTime;
    booking.endTime = newEndDateTime;

    await booking.save();
    await booking.populate('patient service partner city');

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling booking',
      error: error.message
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, date, cityId, partnerId, timeFormat = '24-hour' } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Service ID and date are required'
      });
    }

    const service = await Service.findOne({ 
      _id: serviceId, 
      isActive: true,
      isDeleted: false
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      service: serviceId,
      partner: partnerId || null,
      status: { $nin: ['cancelled', 'rejected'] },
      startTime: { $gte: queryDate, $lte: endDate }
    }).select('startTime endTime');

    let availableSlots = [];

    if (service.category === 'consultation') {
      // Generate 30-minute slots
      const slotConfig = service.slotConfig.consultationSlots;
      const startHour = parseInt(slotConfig.startTime.split(':')[0]);
      const endHour = parseInt(slotConfig.endTime.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(queryDate);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);

          const isBooked = existingBookings.some(booking => 
            (slotStart >= booking.startTime && slotStart < booking.endTime) ||
            (slotEnd > booking.startTime && slotEnd <= booking.endTime)
          );

          if (!isBooked && slotStart > new Date()) {
            availableSlots.push({
              startTime: formatTime(slotStart, timeFormat),
              endTime: formatTime(slotEnd, timeFormat),
              duration: '0.5 hours',
              available: true
            });
          }
        }
      }
    } else {
      // For nursing and equipment: 24x7 with flexible duration
      const flexibleOptions = service.slotConfig.nursingSlots?.flexibleDurationOptions || 
                             service.slotConfig.equipmentBooking?.flexibleDurationOptions ||
                             [];
      
      availableSlots = [{
        type: '24x7 Service',
        message: 'This service is available 24/7. You can book any time slot with your preferred duration.',
        durationOptions: flexibleOptions.map(opt => opt.label),
        bookingInstructions: 'Select your preferred start time and duration when creating the booking.',
        timeFormat: timeFormat
      }];
    }

    res.status(200).json({
      success: true,
      service: {
        id: service._id,
        name: service.name,
        category: service.category
      },
      date: queryDate.toDateString(),
      timeFormat,
      data: availableSlots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { timeFormat = '24-hour' } = req.query;

    const booking = await Booking.findById(id)
      .populate('patient', 'firstName lastName email phone address')
      .populate('service', 'name category basePrice icon image')
      .populate('partner', 'firstName lastName phone email rating')
      .populate('city', 'name latitude longitude');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Role-based access control
    if (userRole === 'patient' && booking.patient._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (userRole === 'partner' && booking.partner && booking.partner._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (userRole === 'doctor') {
      const service = await Service.findOne({ 
        _id: booking.service._id,
        'createdBy.userId': userId 
      });
      
      if (!service) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const formattedBooking = {
      ...booking.toObject(),
      startTimeFormatted: formatTime(booking.startTime, timeFormat),
      endTimeFormatted: formatTime(booking.endTime, timeFormat),
      durationFormatted: formatDuration(booking.duration)
    };

    res.status(200).json({
      success: true,
      data: formattedBooking
    });

  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

module.exports = exports;

// controllers/bookingController.js
// const mongoose = require('mongoose');
// const Booking = require('../models/bookingModel');
// const Service = require('../models/serviceModel');
// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const ServicePartner = require('../models/serviceModel');
// const Admin = require('../models/adminModel');

// ============= CREATE BOOKING =============
// exports.createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const {
//       doctorId,
//       serviceId,
//       serviceMode,
//       appointmentDate,
//       slotTime,
//       duration,
//       shiftType,
//       location,
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway,
//       paymentDetails,
//       includeEquipment,
//       emergencyContact,
//       couponCode
//     } = req.body;

//     const patientId = req.user.id;

//     // Validate required fields
//     if (!serviceId) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Service ID is required'
//       });
//     }

//     if (!serviceMode || !['Home Service', 'Visit Provider Location'].includes(serviceMode)) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Valid service mode is required'
//       });
//     }

//     if (!slotTime || !slotTime.startTime || !slotTime.endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Slot time with startTime and endTime is required'
//       });
//     }

//     // Get service details
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Service not available or inactive'
//       });
//     }

//     const serviceCategory = service.category;

//     // Validate consultation services (9 AM - 7 PM, 30-minute slots)
//     if (serviceCategory === 'consultation') {
//       const [startHour, startMin] = slotTime.startTime.split(':').map(Number);
//       const [endHour, endMin] = slotTime.endTime.split(':').map(Number);

//       if (startHour < 9 || startHour >= 19) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation services are only available between 09:00 and 19:00'
//         });
//       }

//       const startMinutes = startHour * 60 + startMin;
//       const endMinutes = endHour * 60 + endMin;
//       const slotDuration = endMinutes - startMinutes;

//       if (slotDuration !== 30) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation slots must be exactly 30 minutes'
//         });
//       }

//       if (startMin !== 0 && startMin !== 30) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Consultation slots must start at :00 or :30 minutes'
//         });
//       }
//     }

//     // Validate nursing services
//     if (serviceCategory === 'nursing') {
//       if (!shiftType) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Shift type is required for nursing services'
//         });
//       }

//       if (!service.slotConfig.nursingSlots.shiftTypes.includes(shiftType)) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: `This nursing service does not support ${shiftType} shift`
//         });
//       }
//     }

//     // Validate equipment services
//     if (serviceCategory === 'equipment') {
//       const calculatedDuration = duration || 60;
//       if (calculatedDuration < 60 || calculatedDuration > 720) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Equipment services require duration between 60-720 minutes'
//         });
//       }
//     }

//     // Validate doctor if specified
//     let doctor = null;
//     if (doctorId) {
//       doctor = await Doctor.findById(doctorId).session(session);
//       if (!doctor || doctor.verificationStatus !== 'approved') {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Doctor not found or not approved'
//         });
//       }

//       // Check doctor slot availability
//       const existingDoctorBooking = await Booking.findOne({
//         doctorId,
//         appointmentDate: {
//           $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
//           $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
//         },
//         'slotTime.startTime': slotTime.startTime,
//         status: { $nin: ['Cancelled', 'Disapproved'] }
//       }).session(session);

//       if (existingDoctorBooking) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'This doctor already has a booking in this time slot'
//         });
//       }
//     }

//     // Validate appointment date
//     const appointmentDateTime = new Date(appointmentDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     if (appointmentDateTime < today) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Appointment date cannot be in the past'
//       });
//     }

//     // Calculate duration
//     let bookingDuration;
//     if (serviceCategory === 'nursing' && shiftType) {
//       const shiftDurations = {
//         'hourly': duration || 60,
//         '8-hour': 480,
//         '12-hour': 720,
//         '24-hour': 1440,
//         'day-shift': 720,
//         'night-shift': 720
//       };
//       bookingDuration = shiftDurations[shiftType];
//     } else {
//       bookingDuration = duration || service.defaultDuration || 30;
//     }

//     // Calculate pricing
//     const pricingDetails = service.calculateTotalPrice 
//       ? service.calculateTotalPrice(bookingDuration, includeEquipment, shiftType)
//       : {
//           basePrice: service.basePrice,
//           equipmentCharges: includeEquipment ? (service.equipmentCharges || 0) : 0,
//           subtotal: service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0),
//           taxPercentage: service.taxPercentage || 18,
//           taxAmount: (service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0)) * ((service.taxPercentage || 18) / 100),
//           totalAmount: service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0) + ((service.basePrice + (includeEquipment ? (service.equipmentCharges || 0) : 0)) * ((service.taxPercentage || 18) / 100))
//         };

//     // Apply coupon if provided
//     let discount = 0;
//     if (couponCode) {
//       // Add your coupon validation logic here
//       discount = 0; // Calculate discount based on coupon
//     }

//     // Validate payment
//     if (paymentType === 'Prepaid' && !paymentId) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Payment ID is required for prepaid bookings'
//       });
//     }

//     // Validate location
//     if (serviceMode === 'Home Service' && (!location || !location.address)) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Complete address is required for home service'
//       });
//     }

//     // Create booking
//     const booking = new Booking({
//       patientId,
//       doctorId: doctorId || null,
//       serviceId,
//       serviceType: service.name,
//       serviceCategory: serviceCategory,
//       shiftType: serviceCategory === 'nursing' ? shiftType : null,
//       serviceMode,
//       appointmentDate: appointmentDateTime,
//       slotTime: {
//         startTime: slotTime.startTime,
//         endTime: slotTime.endTime,
//         displayFormat: '24-hour'
//       },
//       duration: bookingDuration,
//       location: serviceMode === 'Home Service' ? {
//         type: 'home',
//         address: location.address
//       } : {
//         type: 'provider',
//         address: location.providerAddress || {}
//       },
//       pricing: {
//         basePrice: pricingDetails.basePrice,
//         equipmentCharges: pricingDetails.equipmentCharges,
//         subtotal: pricingDetails.subtotal,
//         taxPercentage: pricingDetails.taxPercentage,
//         taxes: pricingDetails.taxAmount,
//         discount: discount,
//         couponCode: couponCode || null,
//         totalAmount: pricingDetails.totalAmount - discount
//       },
//       paymentType,
//       paymentId: paymentId || null,
//       transactionId: transactionId || null,
//       paymentGateway: paymentGateway || null,
//       paymentDetails: paymentDetails || {},
//       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
//       paymentDate: paymentType === 'Prepaid' ? new Date() : null,
//       status: 'Pending',
//       adminApproval: { 
//         status: 'Pending' 
//       },
//       emergencyContact: emergencyContact || {},
//       metadata: {
//         bookingSource: req.headers['x-booking-source'] || 'web',
//         deviceInfo: {
//           userAgent: req.headers['user-agent'],
//           ipAddress: req.ip
//         }
//       }
//     });

//     await booking.save({ session });

//     // Book doctor slot if specified
//     if (doctor && doctor.bookSlot) {
//       doctor.bookSlot(appointmentDateTime, slotTime.startTime, booking._id);
//       await doctor.save({ session });
//     }

//     // Add notification
//     booking.notifications.push({
//       type: 'booking_confirmation',
//       recipient: 'Patient',
//       recipientId: patientId,
//       message: `Booking ${booking.bookingId} created successfully. Awaiting admin approval.`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });
//     await booking.save({ session });

//     await session.commitTransaction();

//     // Populate response
//     await booking.populate([
//       { path: 'patientId', select: 'name email phone' },
//       { path: 'doctorId', select: 'name specialization email phone' },
//       { path: 'serviceId', select: 'name description basePrice category nursingType' }
//     ]);

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully',
//       data: {
//         booking,
//         serviceInfo: {
//           category: serviceCategory,
//           ...(serviceCategory === 'nursing' && {
//             shiftType,
//             duration: `${bookingDuration} minutes`,
//             available: '24x7'
//           }),
//           ...(serviceCategory === 'consultation' && {
//             slotDuration: '30 minutes',
//             timeRange: '09:00-19:00'
//           }),
//           ...(serviceCategory === 'equipment' && {
//             duration: `${bookingDuration} minutes`,
//             available: '24x7'
//           })
//         }
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Booking creation error:', error);
    
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: 'Slot conflict: This time slot is already booked'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= GET ALL BOOKINGS (ADMIN) =============
// exports.getAllBookings = async (req, res) => {
//   try {
//     const {
//       status,
//       serviceCategory,
//       paymentStatus,
//       startDate,
//       endDate,
//       page = 1,
//       limit = 10,
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     const query = { isDeleted: false };

//     // Apply filters
//     if (status) query.status = status;
//     if (serviceCategory) query.serviceCategory = serviceCategory;
//     if (paymentStatus) query.paymentStatus = paymentStatus;

//     if (startDate && endDate) {
//       query.appointmentDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const skip = (page - 1) * limit;
//     const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

//     const bookings = await Booking.find(query)
//       .populate('patientId', 'name email phone')
//       .populate('serviceId', 'name serviceType basePrice category')
//       .populate('servicePartnerId', 'name email phone')
//       .populate('doctorId', 'name specialization')
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get all bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching bookings',
//       error: error.message
//     });
//   }
// };

// // ============= GET BOOKING BY ID =============
// exports.getBookingById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const booking = await Booking.findById(id)
//       .populate('patientId', 'name email phone address')
//       .populate('serviceId', 'name description basePrice category nursingType')
//       .populate('servicePartnerId', 'name email phone specialization')
//       .populate('doctorId', 'name email phone specialization')
//       .populate('adminApproval.approvedBy', 'firstName lastName email')
//       .populate('adminApproval.partnerAssignedBy', 'firstName lastName email');

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: booking
//     });

//   } catch (error) {
//     console.error('Get booking by ID error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching booking',
//       error: error.message
//     });
//   }
// };

// // ============= GET PATIENT BOOKINGS =============
// exports.getPatientBookings = async (req, res) => {
//   try {
//     const patientId = req.user.id;
//     const { status, upcoming, page = 1, limit = 10 } = req.query;

//     const query = { patientId, isDeleted: false };

//     if (status) query.status = status;

//     if (upcoming === 'true') {
//       query.appointmentDate = { $gte: new Date() };
//       query.status = { $nin: ['Completed', 'Cancelled', 'Disapproved'] };
//     }

//     const skip = (page - 1) * limit;

//     const bookings = await Booking.find(query)
//       .populate('serviceId', 'name serviceType basePrice category')
//       .populate('doctorId', 'name specialization')
//       .populate('servicePartnerId', 'name email phone')
//       .sort({ appointmentDate: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get patient bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching patient bookings',
//       error: error.message
//     });
//   }
// };

// // ============= GET PARTNER BOOKINGS =============
// exports.getPartnerBookings = async (req, res) => {
//   try {
//     const partnerId = req.user.id;
//     const { status, date, page = 1, limit = 10 } = req.query;

//     const query = { servicePartnerId: partnerId, isDeleted: false };

//     if (status) query.status = status;

//     if (date) {
//       const startOfDay = new Date(date);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(date);
//       endOfDay.setHours(23, 59, 59, 999);
      
//       query.appointmentDate = {
//         $gte: startOfDay,
//         $lte: endOfDay
//       };
//     }

//     const skip = (page - 1) * limit;

//     const bookings = await Booking.find(query)
//       .populate('patientId', 'name email phone')
//       .populate('serviceId', 'name serviceType basePrice')
//       .sort({ appointmentDate: 1, 'slotTime.startTime': 1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get partner bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching partner bookings',
//       error: error.message
//     });
//   }
// };

// // ============= APPROVE BOOKING (ADMIN) =============
// exports.approveBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { remarks } = req.body;
//     const adminId = req.user.id;

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.adminApproval.status !== 'Pending') {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Booking already processed'
//       });
//     }

//     booking.adminApproval.status = 'Approved';
//     booking.adminApproval.approvedBy = adminId;
//     booking.adminApproval.approvedAt = new Date();
//     booking.adminApproval.remarks = remarks || '';
//     booking.status = 'Partner Assigned';

//     // Add notification
//     booking.notifications.push({
//       type: 'booking_approved',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Your booking ${booking.bookingId} has been approved. Partner will be assigned soon.`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     await booking.populate([
//       { path: 'patientId', select: 'name email phone' },
//       { path: 'serviceId', select: 'name serviceType' }
//     ]);

//     res.status(200).json({
//       success: true,
//       message: 'Booking approved successfully',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Approve booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error approving booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= DISAPPROVE BOOKING (ADMIN) =============
// exports.disapproveBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const adminId = req.user.id;

//     if (!reason) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Disapproval reason is required'
//       });
//     }

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     booking.adminApproval.status = 'Disapproved';
//     booking.adminApproval.approvedBy = adminId;
//     booking.adminApproval.approvedAt = new Date();
//     booking.adminApproval.disapprovalReason = reason;
//     booking.status = 'Disapproved';

//     // Process refund if payment was made
//     if (booking.paymentStatus === 'Completed') {
//       booking.paymentStatus = 'Refunded';
//       booking.cancellation.refundAmount = booking.pricing.totalAmount;
//       booking.cancellation.refundStatus = 'Pending';
//     }

//     // Add notification
//     booking.notifications.push({
//       type: 'booking_cancelled',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Your booking ${booking.bookingId} has been disapproved. Reason: ${reason}`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Booking disapproved successfully',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Disapprove booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error disapproving booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= ASSIGN PARTNER (ADMIN) =============
// exports.assignPartner = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { partnerId, partnerType } = req.body;
//     const adminId = req.user.id;

//     if (!partnerId || !partnerType) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Partner ID and partner type are required'
//       });
//     }

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (!booking.canAssignPartner()) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot assign partner to this booking'
//       });
//     }

//     // Verify partner exists
//     const partner = await ServicePartner.findById(partnerId).session(session);
//     if (!partner) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Service partner not found'
//       });
//     }

//     // Check partner availability
//     const partnerConflict = await Booking.findOne({
//       servicePartnerId: partnerId,
//       appointmentDate: {
//         $gte: new Date(booking.appointmentDate).setHours(0, 0, 0, 0),
//         $lt: new Date(booking.appointmentDate).setHours(23, 59, 59, 999)
//       },
//       $or: [
//         {
//           'slotTime.startTime': { $lt: booking.slotTime.endTime },
//           'slotTime.endTime': { $gt: booking.slotTime.startTime }
//         }
//       ],
//       status: { $nin: ['Cancelled', 'Disapproved'] }
//     }).session(session);

//     if (partnerConflict) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Partner already has a booking in this time slot'
//       });
//     }

//     booking.servicePartnerId = partnerId;
//     booking.servicePartnerType = partnerType;
//     booking.adminApproval.partnerAssignedBy = adminId;
//     booking.adminApproval.partnerAssignedAt = new Date();
//     booking.status = 'Scheduled';
//     booking.partnerAcceptance.status = 'Pending';

//     // Add notifications
//     booking.notifications.push({
//       type: 'partner_assigned',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Service partner has been assigned to your booking ${booking.bookingId}`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     booking.notifications.push({
//       type: 'partner_assigned',
//       recipient: 'Partner',
//       recipientId: partnerId,
//       message: `New booking ${booking.bookingId} has been assigned to you`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     await booking.populate([
//       { path: 'patientId', select: 'name email phone' },
//       { path: 'servicePartnerId', select: 'name email phone' },
//       { path: 'serviceId', select: 'name serviceType' }
//     ]);

//     res.status(200).json({
//       success: true,
//       message: 'Partner assigned successfully',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Assign partner error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error assigning partner',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= PARTNER ACCEPT BOOKING =============
// exports.partnerAcceptBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const partnerId = req.user.id;

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.servicePartnerId.toString() !== partnerId) {
//       await session.abortTransaction();
//       return res.status(403).json({
//         success: false,
//         message: 'You are not assigned to this booking'
//       });
//     }

//     if (booking.partnerAcceptance.status !== 'Pending') {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Booking already processed'
//       });
//     }

//     booking.partnerAcceptance.status = 'Accepted';
//     booking.partnerAcceptance.respondedAt = new Date();
//     booking.status = 'Confirmed';

//     // Add notification
//     booking.notifications.push({
//       type: 'partner_accepted',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Your booking ${booking.bookingId} has been confirmed by the service partner`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Booking accepted successfully',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Partner accept booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error accepting booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= PARTNER REJECT BOOKING =============
// exports.partnerRejectBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const partnerId = req.user.id;

//     if (!reason) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required'
//       });
//     }

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.servicePartnerId.toString() !== partnerId) {
//       await session.abortTransaction();
//       return res.status(403).json({
//         success: false,
//         message: 'You are not assigned to this booking'
//       });
//     }

//     booking.partnerAcceptance.status = 'Rejected';
//     booking.partnerAcceptance.respondedAt = new Date();
//     booking.partnerAcceptance.rejectionReason = reason;
//     booking.servicePartnerId = null;
//     booking.servicePartnerType = null;
//     booking.status = 'Partner Assigned';

//     // Add notification
//     booking.notifications.push({
//       type: 'partner_rejected',
//       recipient: 'Admin',
//       message: `Partner rejected booking ${booking.bookingId}. Reason: ${reason}`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Booking rejected. Admin will assign another partner.',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Partner reject booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error rejecting booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= CANCEL BOOKING =============
// exports.cancelBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     if (!reason) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'Cancellation reason is required'
//       });
//     }

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (!booking.canCancel()) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'This booking cannot be cancelled'
//       });
//     }

//     // Verify user authorization
//     if (userRole === 'patient' && booking.patientId.toString() !== userId) {
//       await session.abortTransaction();
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to cancel this booking'
//       });
//     }

//     if (userRole === 'partner' && booking.servicePartnerId.toString() !== userId) {
//       await session.abortTransaction();
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to cancel this booking'
//       });
//     }

//     // Calculate refund
//     const refundDetails = booking.calculateRefund();

//     booking.status = 'Cancelled';
//     booking.cancellation.cancelledBy = userRole === 'admin' ? 'Admin' : userRole === 'patient' ? 'Patient' : 'Partner';
//     booking.cancellation.cancelledAt = new Date();
//     booking.cancellation.reason = reason;
//     booking.cancellation.cancellationFee = refundDetails.cancellationFee;
//     booking.cancellation.refundAmount = refundDetails.refundAmount;

//     if (booking.paymentStatus === 'Completed' && refundDetails.refundAmount > 0) {
//       booking.cancellation.refundStatus = 'Pending';
//       booking.paymentStatus = 'Refunded';
//     }

//     // Add notifications
//     const recipients = ['Patient'];
//     if (booking.servicePartnerId) recipients.push('Partner');
//     recipients.push('Admin');

//     recipients.forEach(recipient => {
//       booking.notifications.push({
//         type: 'booking_cancelled',
//         recipient,
//         message: `Booking ${booking.bookingId} has been cancelled. Reason: ${reason}`,
//         sentAt: new Date(),
//         status: 'sent',
//         channel: 'in-app'
//       });
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Booking cancelled successfully',
//       data: {
//         booking,
//         refundDetails: {
//           refundAmount: refundDetails.refundAmount,
//           cancellationFee: refundDetails.cancellationFee,
//           refundPercentage: refundDetails.refundPercentage
//         }
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Cancel booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error cancelling booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= RESCHEDULE BOOKING =============
// exports.rescheduleBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const { newDate, newSlotTime, reason } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     if (!newDate || !newSlotTime || !newSlotTime.startTime || !newSlotTime.endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'New date and slot time are required'
//       });
//     }

//     const booking = await Booking.findById(id).session(session);

//     if (!booking) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (!booking.canReschedule()) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'This booking cannot be rescheduled'
//       });
//     }

//     // Validate new date
//     const newAppointmentDate = new Date(newDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (newAppointmentDate < today) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: 'New appointment date cannot be in the past'
//       });
//     }

//     // Check partner availability for new slot
//     if (booking.servicePartnerId) {
//       const conflict = await Booking.findOne({
//         _id: { $ne: booking._id },
//         servicePartnerId: booking.servicePartnerId,
//         appointmentDate: {
//           $gte: new Date(newDate).setHours(0, 0, 0, 0),
//           $lt: new Date(newDate).setHours(23, 59, 59, 999)
//         },
//         'slotTime.startTime': newSlotTime.startTime,
//         status: { $nin: ['Cancelled', 'Disapproved'] }
//       }).session(session);

//       if (conflict) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: 'Partner already has a booking in this new time slot'
//         });
//       }
//     }

//     // Add to reschedule history
//     booking.rescheduleHistory.push({
//       oldDate: booking.appointmentDate,
//       oldSlot: {
//         startTime: booking.slotTime.startTime,
//         endTime: booking.slotTime.endTime
//       },
//       newDate: newAppointmentDate,
//       newSlot: {
//         startTime: newSlotTime.startTime,
//         endTime: newSlotTime.endTime
//       },
//       rescheduledBy: userRole === 'admin' ? 'Admin' : userRole === 'patient' ? 'Patient' : 'Partner',
//       rescheduledAt: new Date(),
//       reason: reason || 'Not specified'
//     });

//     // Update booking
//     booking.appointmentDate = newAppointmentDate;
//     booking.slotTime.startTime = newSlotTime.startTime;
//     booking.slotTime.endTime = newSlotTime.endTime;
//     booking.status = 'Rescheduled';

//     // Add notification
//     booking.notifications.push({
//       type: 'booking_rescheduled',
//       recipient: 'All',
//       message: `Booking ${booking.bookingId} has been rescheduled to ${newAppointmentDate.toDateString()} at ${newSlotTime.startTime}`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save({ session });
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: 'Booking rescheduled successfully',
//       data: booking
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Reschedule booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error rescheduling booking',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // ============= START SERVICE =============
// exports.startService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const partnerId = req.user.id;

//     const booking = await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.servicePartnerId.toString() !== partnerId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to start this service'
//       });
//     }

//     if (booking.status !== 'Confirmed' && booking.status !== 'Scheduled') {
//       return res.status(400).json({
//         success: false,
//         message: 'Service cannot be started at this stage'
//       });
//     }

//     await booking.startService();

//     // Add notification
//     booking.notifications.push({
//       type: 'service_started',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Your service for booking ${booking.bookingId} has started`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Service started successfully',
//       data: booking
//     });

//   } catch (error) {
//     console.error('Start service error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error starting service',
//       error: error.message
//     });
//   }
// };

// // ============= COMPLETE SERVICE =============
// exports.completeService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { serviceNotes, vitals, medicationsAdministered, proceduresPerformed } = req.body;
//     const partnerId = req.user.id;

//     const booking = await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.servicePartnerId.toString() !== partnerId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to complete this service'
//       });
//     }

//     if (booking.status !== 'On Going') {
//       return res.status(400).json({
//         success: false,
//         message: 'Service must be started before it can be completed'
//       });
//     }

//     await booking.completeService();

//     // Update service tracking
//     if (serviceNotes) booking.serviceTracking.serviceNotes = serviceNotes;
//     if (vitals) booking.serviceTracking.vitals = vitals;
//     if (medicationsAdministered) booking.serviceTracking.medicationsAdministered = medicationsAdministered;
//     if (proceduresPerformed) booking.serviceTracking.proceduresPerformed = proceduresPerformed;

//     // Update payout
//     if (booking.pricing.partnerCommission) {
//       booking.partnerPayout.amount = booking.pricing.partnerCommission;
//       booking.partnerPayout.status = 'Pending';
//     }

//     // Add notification
//     booking.notifications.push({
//       type: 'service_completed',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Your service for booking ${booking.bookingId} has been completed`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     booking.notifications.push({
//       type: 'feedback_request',
//       recipient: 'Patient',
//       recipientId: booking.patientId,
//       message: `Please rate your experience for booking ${booking.bookingId}`,
//       sentAt: new Date(),
//       status: 'sent',
//       channel: 'in-app'
//     });

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Service completed successfully',
//       data: booking
//     });

//   } catch (error) {
//     console.error('Complete service error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error completing service',
//       error: error.message
//     });
//   }
// };

// // ============= SUBMIT FEEDBACK =============
// exports.submitFeedback = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { rating, review, serviceQuality, timeliness, professionalism, cleanliness, wouldRecommend } = req.body;
//     const patientId = req.user.id;

//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rating must be between 1 and 5'
//       });
//     }

//     const booking = await Booking.findById(id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.patientId.toString() !== patientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to submit feedback for this booking'
//       });
//     }

//     if (booking.status !== 'Completed') {
//       return res.status(400).json({
//         success: false,
//         message: 'Feedback can only be submitted for completed bookings'
//       });
//     }

//     if (booking.feedback.rating) {
//       return res.status(400).json({
//         success: false,
//         message: 'Feedback already submitted for this booking'
//       });
//     }

//     booking.feedback = {
//       rating,
//       review: review || '',
//       submittedAt: new Date(),
//       serviceQuality: serviceQuality || rating,
//       timeliness: timeliness || rating,
//       professionalism: professionalism || rating,
//       cleanliness: cleanliness || rating,
//       wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true
//     };

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Feedback submitted successfully',
//       data: booking
//     });

//   } catch (error) {
//     console.error('Submit feedback error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error submitting feedback',
//       error: error.message
//     });
//   }
// };

// // ============= GENERATE INVOICE =============
// exports.generateInvoice = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const booking = await Booking.findById(id)
//       .populate('patientId', 'name email phone address')
//       .populate('serviceId', 'name description')
//       .populate('servicePartnerId', 'name email phone');

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     if (booking.invoice.isGenerated) {
//       return res.status(200).json({
//         success: true,
//         message: 'Invoice already generated',
//         data: {
//           invoiceNumber: booking.invoice.invoiceNumber,
//           invoiceUrl: booking.invoice.invoiceUrl
//         }
//       });
//     }

//     // Generate invoice logic here (PDF generation, etc.)
//     // For now, just marking as generated

//     booking.invoice.isGenerated = true;
//     booking.invoice.generatedAt = new Date();
//     booking.invoice.invoiceUrl = `/invoices/${booking.bookingId}.pdf`; // Example URL

//     await booking.save();

//     res.status(200).json({
//       success: true,
//       message: 'Invoice generated successfully',
//       data: {
//         invoiceNumber: booking.invoice.invoiceNumber,
//         invoiceUrl: booking.invoice.invoiceUrl
//       }
//     });

//   } catch (error) {
//     console.error('Generate invoice error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating invoice',
//       error: error.message
//     });
//   }
// };

// // ============= GET AVAILABLE SLOTS =============
// exports.getAvailableSlots = async (req, res) => {
//   try {
//     const { serviceId, date, partnerId } = req.query;

//     if (!serviceId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service ID and date are required'
//       });
//     }

//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service not found or inactive'
//       });
//     }

//     const availableSlots = await Service.getAvailableSlots(
//       serviceId, 
//       new Date(date), 
//       partnerId
//     );

//     res.status(200).json({
//       success: true,
//       serviceCategory: service.category,
//       serviceType: service.name,
//       date: new Date(date).toDateString(),
//       data: availableSlots
//     });

//   } catch (error) {
//     console.error('Error fetching available slots:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching available slots',
//       error: error.message
//     });
//   }
// };

// // ============= GET DASHBOARD STATS (ADMIN) =============
// exports.getDashboardStats = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     const dateFilter = {};
//     if (startDate && endDate) {
//       dateFilter.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const stats = await Promise.all([
//       // Total bookings
//       Booking.countDocuments({ ...dateFilter, isDeleted: false }),
      
//       // Pending approvals
//       Booking.countDocuments({ 
//         'adminApproval.status': 'Pending',
//         isDeleted: false
//       }),
      
//       // Completed bookings
//       Booking.countDocuments({ 
//         ...dateFilter,
//         status: 'Completed',
//         isDeleted: false
//       }),
      
//       // Revenue
//       Booking.aggregate([
//         {
//           $match: {
//             ...dateFilter,
//             paymentStatus: 'Completed',
//             isDeleted: false
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             totalRevenue: { $sum: '$pricing.totalAmount' },
//             medicoRevenue: { $sum: '$pricing.medicoRevenue' }
//           }
//         }
//       ]),
      
//       // Service category breakdown
//       Booking.aggregate([
//         {
//           $match: {
//             ...dateFilter,
//             isDeleted: false
//           }
//         },
//         {
//           $group: {
//             _id: '$serviceCategory',
//             count: { $sum: 1 }
//           }
//         }
//       ])
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         totalBookings: stats[0],
//         pendingApprovals: stats[1],
//         completedBookings: stats[2],
//         revenue: stats[3][0] || { totalRevenue: 0, medicoRevenue: 0 },
//         serviceCategoryBreakdown: stats[4]
//       }
//     });

//   } catch (error) {
//     console.error('Get dashboard stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching dashboard stats',
//       error: error.message
//     });
//   }
// };


// // ============= GET DOCTOR BOOKINGS =============
// exports.getDoctorBookings = async (req, res) => {
//   try {
//     const doctorId = req.user.id;
//     const { status, date, upcoming, page = 1, limit = 10 } = req.query;

//     const query = { doctorId, isDeleted: false };

//     if (status) query.status = status;

//     if (date) {
//       const startOfDay = new Date(date);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(date);
//       endOfDay.setHours(23, 59, 59, 999);
      
//       query.appointmentDate = {
//         $gte: startOfDay,
//         $lte: endOfDay
//       };
//     }

//     if (upcoming === 'true') {
//       query.appointmentDate = { $gte: new Date() };
//       query.status = { $nin: ['Completed', 'Cancelled', 'Disapproved'] };
//     }

//     const skip = (page - 1) * limit;

//     const bookings = await Booking.find(query)
//       .populate('patientId', 'name email phone address')
//       .populate('serviceId', 'name serviceType basePrice category')
//       .populate('servicePartnerId', 'name email phone')
//       .sort({ appointmentDate: 1, 'slotTime.startTime': 1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get doctor bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching doctor bookings',
//       error: error.message
//     });
//   }
// };

// // ============= GET PENDING ASSIGNMENTS (ADMIN) =============
// exports.getPendingAssignments = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, serviceCategory } = req.query;

//     const query = {
//       'adminApproval.status': 'Approved',
//       'status': 'Partner Assigned',
//       'servicePartnerId': null,
//       isDeleted: false
//     };

//     if (serviceCategory) {
//       query.serviceCategory = serviceCategory;
//     }

//     const skip = (page - 1) * limit;

//     const bookings = await Booking.find(query)
//       .populate('patientId', 'name email phone')
//       .populate('serviceId', 'name serviceType basePrice category')
//       .populate('doctorId', 'name specialization')
//       .populate('adminApproval.approvedBy', 'firstName lastName email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get pending assignments error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching pending assignments',
//       error: error.message
//     });
//   }
// };

// module.exports = exports;
