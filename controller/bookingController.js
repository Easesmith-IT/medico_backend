// controllers/bookingController.js
const Booking = require('../models/bookingModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Service = require('../models/serviceModel');

// Create Booking (Patient)
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       doctorId,
//       serviceType,
//       serviceMode,
//       appointmentDate,
//       slotTime,
//       duration,
//       location,
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway
//     } = req.body;

//     const patientId = req.user.id;

//     // Verify doctor exists and is verified
//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor || doctor.verificationStatus !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: 'Doctor not available or not verified'
//       });
//     }

//     // Check slot availability
//     const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
//     if (!isAvailable) {
//       return res.status(400).json({
//         success: false,
//         message: 'Selected slot is not available'
//       });
//     }

//     // Get service pricing
//     const service = await Service.findOne({ name: serviceType });
//     if (!service || !service.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service not available'
//       });
//     }

//     // Calculate pricing
//     const basePrice = service.basePrice;
//     const equipmentCharges = service.equipmentCharges || 0;
//     const taxes = (basePrice + equipmentCharges) * (service.taxPercentage / 100);
//     const totalAmount = basePrice + equipmentCharges + taxes;

//     // Validate payment for Prepaid
//     if (paymentType === 'Prepaid' && !paymentId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment required for prepaid booking'
//       });
//     }

//     // Create booking
//     const booking = new Booking({
//       patientId,
//       doctorId,
//       serviceType,
//       serviceMode,
//       appointmentDate: new Date(appointmentDate),
//       slotTime,
//       duration: duration || service.defaultDuration,
//       location,
//       pricing: {
//         basePrice,
//         equipmentCharges,
//         taxes,
//         totalAmount
//       },
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway,
//       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
//       adminApproval: { status: 'Pending' }
//     });

//     await booking.save();

//     // Book the slot in doctor's availability
//     doctor.bookSlot(appointmentDate, slotTime.startTime, booking._id);
//     await doctor.save();

//     // Send notification (implement notification service)
//     // await sendNotification(patientId, 'Booking request received');

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully. Awaiting admin approval.',
//       data: booking
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   }
// };
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       doctorId,
//       serviceId,
//       serviceMode,
//       appointmentDate,
//       slotTime,
//       duration,
//       location,
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway
//     } = req.body;

//     const patientId = req.user.id;

//     // Verify doctor exists and is verified
//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor || doctor.verificationStatus !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: 'Doctor not available or not verified'
//       });
//     }

//     // Check slot availability
//     const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
//     if (!isAvailable) {
//       return res.status(400).json({
//         success: false,
//         message: 'Selected slot is not available'
//       });
//     }

//     // Get service pricing using serviceId
//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service not available'
//       });
//     }

//     // Calculate pricing
//     const basePrice = service.basePrice;
//     const equipmentCharges = service.equipmentCharges || 0;
//     const taxes = (basePrice + equipmentCharges) * (service.taxPercentage / 100);
//     const totalAmount = basePrice + equipmentCharges + taxes;

//     // Validate payment for Prepaid
//     if (paymentType === 'Prepaid' && !paymentId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment required for prepaid booking'
//       });
//     }

//     // Create booking - bookingId will be auto-generated by pre-validate hook
//     const booking = new Booking({
//       patientId,
//       doctorId,
//       serviceType: service.name,
//       serviceMode,
//       appointmentDate: new Date(appointmentDate),
//       slotTime,
//       duration: duration || service.defaultDuration,
//       location,
//       pricing: {
//         basePrice,
//         equipmentCharges,
//         taxes,
//         totalAmount
//       },
//       paymentType,
//       paymentId,
//       transactionId,
//       paymentGateway,
//       paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
//       status: 'Pending', //Now valid enum value
//       adminApproval: { status: 'Pending' }
//     });

//     await booking.save();

//     // Book the slot in doctor's availability
//     doctor.bookSlot(appointmentDate, slotTime.startTime, booking._id);
//     await doctor.save();

//     res.status(201).json({
//       success: true,
//       message: 'Booking created successfully. Awaiting admin approval.',
//       data: booking
//     });
//   } catch (error) {
//     console.error('Booking creation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating booking',
//       error: error.message
//     });
//   }
// };
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      doctorId, // Optional
      serviceId, // Required
      serviceMode,
      appointmentDate,
      slotTime,
      duration,
      location,
      paymentType,
      paymentId,
      transactionId,
      paymentGateway
    } = req.body;

    const patientId = req.user.id;

    // Validate required serviceId
    if (!serviceId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    // Get service details - REQUIRED
    const service = await Service.findById(serviceId).session(session);
    if (!service || !service.isActive) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Service not available or inactive'
      });
    }

    // Optional: Verify doctor if specified
    let doctor = null;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      if (doctor.verificationStatus !== 'approved') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Doctor is not verified or approved'
        });
      }

      // Check slot availability if doctor is specified
      const appointmentDateTime = new Date(appointmentDate);
      const isAvailable = doctor.isSlotAvailable(appointmentDateTime, slotTime.startTime);
      
      if (!isAvailable) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Selected slot is not available for this doctor'
        });
      }

      // Double-check no existing booking for this doctor's slot
      const existingBooking = await Booking.findOne({
        doctorId,
        appointmentDate: appointmentDateTime,
        'slotTime.startTime': slotTime.startTime,
        status: { $nin: ['Cancelled', 'Disapproved'] }
      }).session(session);

      if (existingBooking) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'This slot was just booked for this doctor. Please select another slot.'
        });
      }
    }

    // Calculate pricing from service
    const basePrice = service.basePrice;
    const equipmentCharges = service.equipmentCharges || 0;
    const taxPercentage = service.taxPercentage || 0;
    const taxes = (basePrice + equipmentCharges) * (taxPercentage / 100);
    const totalAmount = basePrice + equipmentCharges + taxes;

    // Validate payment for Prepaid
    if (paymentType === 'Prepaid' && !paymentId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Payment ID required for prepaid booking'
      });
    }

    // Validate appointment date
    const appointmentDateTime = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDateTime < today) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    // Create booking
    const booking = new Booking({
      patientId,
      doctorId: doctorId || null, // Optional
      serviceId, // Required
      serviceType: service.serviceType || service.name,
      serviceMode,
      appointmentDate: appointmentDateTime,
      slotTime,
      duration: duration || service.defaultDuration || 30,
      location,
      pricing: {
        basePrice,
        equipmentCharges,
        taxes,
        totalAmount
      },
      paymentType,
      paymentId: paymentId || null,
      transactionId: transactionId || null,
      paymentGateway: paymentGateway || null,
      paymentStatus: paymentType === 'Prepaid' ? 'Completed' : 'Pending',
      status: 'Pending',
      adminApproval: { status: 'Pending' }
    });

    await booking.save({ session });

    // If doctor is specified, book the slot atomically
    if (doctor) {
      doctor.bookSlot(appointmentDateTime, slotTime.startTime, booking._id);
      await doctor.save({ session });
    }

    // Send notification
    booking.notifications.push({
      type: 'booking_confirmation',
      recipient: 'Patient',
      message: `Booking created successfully: ${booking.bookingId}. Awaiting admin approval.`,
      sentAt: new Date(),
      status: 'sent'
    });
    await booking.save({ session });

    await session.commitTransaction();

    // Populate response
    await booking.populate([
      { path: 'patientId', select: 'name email phone' },
      { path: 'doctorId', select: 'name specialization' },
      { path: 'serviceId', select: 'name serviceType basePrice' }
    ]);

    res.status(201).json({
      success: true,
      message: doctorId 
        ? 'Booking created with preferred doctor. Awaiting admin approval.' 
        : 'Booking created. Admin will assign a service partner.',
      data: booking
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Booking creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get Patient Bookings
exports.getPatientBookings = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status, filter } = req.query; // filter: upcoming, ongoing, past

    const query = { patientId };
    
    if (status) {
      query.status = status;
    }

    // Filter by time
    if (filter === 'upcoming') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['Scheduled', 'Rescheduled'] };
    } else if (filter === 'ongoing') {
      query.status = 'On Going';
    } else if (filter === 'past') {
      query.$or = [
        { status: 'Completed' },
        { appointmentDate: { $lt: new Date() } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('doctorId', 'firstName specialization yearsOfExperience averageRating profilePhoto')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get Doctor Appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, status } = req.query;

    const query = { doctorId };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (status) query.status = status;

    const appointments = await Booking.find(query)
      .populate('patientId', 'name age gender phone address')
      .sort({ appointmentDate: 1, 'slotTime.startTime': 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// Update Sub-Status (Provider)
exports.updateSubStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { subStatus } = req.body;
    const doctorId = req.user.id;

    const booking = await Booking.findOne({ bookingId, doctorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.subStatus = subStatus;
    
    if (subStatus === 'On the Way' || subStatus === 'Reached') {
      booking.status = 'On Going';
    }

    await booking.save();

    // Send notification to patient
    // await sendNotification(booking.patientId, `Provider ${subStatus}`);

    res.status(200).json({
      success: true,
      message: 'Sub-status updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sub-status',
      error: error.message
    });
  }
};

// Complete Appointment (Provider)
exports.completeAppointment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { providerNotes } = req.body;
    const doctorId = req.user.id;

    const booking = await Booking.findOne({ bookingId, doctorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'Completed';
    booking.subStatus = 'Completed';
    booking.providerNotes = providerNotes;

    // Generate invoice for postpaid
    if (booking.paymentType === 'Postpaid') {
      booking.invoice = {
        invoiceNumber: `INV${booking.bookingId}`,
        generatedAt: new Date(),
        isGenerated: true
        // invoiceUrl will be set after PDF generation
      };
    }

    await booking.save();

    // Send completion notification
    // await sendNotification(booking.patientId, 'Service completed');

    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing appointment',
      error: error.message
    });
  }
};

// Admin Approve Booking
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.adminApproval.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking already processed'
      });
    }

    booking.adminApproval = {
      status: 'Approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      remarks
    };
    booking.status = 'Scheduled';

    await booking.save();

    // Send notification to patient and doctor
    // await sendNotification(booking.patientId, 'Booking approved');
    // await sendNotification(booking.doctorId, 'New appointment scheduled');

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving booking',
      error: error.message
    });
  }
};

// Admin Disapprove Booking
exports.disapproveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reason for disapproval'
      });
    }

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.adminApproval = {
      status: 'Disapproved',
      approvedBy: adminId,
      approvedAt: new Date(),
      remarks
    };
    booking.status = 'Disapproved';

    await booking.save();

    // Release the slot
    const doctor = await Doctor.findById(booking.doctorId);
    if (doctor) {
      doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);
      await doctor.save();
    }

    // Refund if prepaid
    if (booking.paymentType === 'Prepaid') {
      booking.paymentStatus = 'Refunded';
      await booking.save();
      // Implement refund logic here
    }

    // Send notification
    // await sendNotification(booking.patientId, `Booking disapproved: ${remarks}`);

    res.status(200).json({
      success: true,
      message: 'Booking disapproved',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error disapproving booking',
      error: error.message
    });
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has permission to cancel
    if (userRole === 'patient' && booking.patientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (userRole === 'doctor' && booking.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    booking.status = 'Cancelled';
    booking.cancellation = {
      cancelledBy: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      cancelledAt: new Date(),
      reason
    };

    await booking.save();

    // Release the slot
    const doctor = await Doctor.findById(booking.doctorId);
    if (doctor) {
      doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);
      await doctor.save();
    }

    // Handle refund for prepaid
    if (booking.paymentType === 'Prepaid') {
      booking.paymentStatus = 'Refunded';
      await booking.save();
      // Implement refund logic
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Reschedule Booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, newSlot, reason } = req.body;
    const userRole = req.user.role;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const doctor = await Doctor.findById(booking.doctorId);

    // Check new slot availability
    const isAvailable = doctor.isSlotAvailable(newDate, newSlot.startTime);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'New slot is not available'
      });
    }

    // Save reschedule history
    booking.rescheduleHistory.push({
      oldDate: booking.appointmentDate,
      oldSlot: booking.slotTime,
      newDate: new Date(newDate),
      newSlot,
      rescheduledBy: userRole.charAt(0).toUpperCase() + userRole.slice(1),
      rescheduledAt: new Date(),
      reason
    });

    // Release old slot
    doctor.releaseSlot(booking.appointmentDate, booking.slotTime.startTime);

    // Book new slot
    doctor.bookSlot(newDate, newSlot.startTime, booking._id);
    await doctor.save();

    // Update booking
    booking.appointmentDate = new Date(newDate);
    booking.slotTime = newSlot;
    booking.status = 'Rescheduled';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rescheduling booking',
      error: error.message
    });
  }
};

// Rebook Appointment
exports.rebookAppointment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { appointmentDate, slotTime } = req.body;
    const patientId = req.user.id;

    const originalBooking = await Booking.findOne({ bookingId, patientId });

    if (!originalBooking) {
      return res.status(404).json({
        success: false,
        message: 'Original booking not found'
      });
    }

    // Check slot availability
    const doctor = await Doctor.findById(originalBooking.doctorId);
    const isAvailable = doctor.isSlotAvailable(appointmentDate, slotTime.startTime);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected slot is not available'
      });
    }

    // Create new booking with same details
    const newBooking = new Booking({
      patientId: originalBooking.patientId,
      doctorId: originalBooking.doctorId,
      serviceType: originalBooking.serviceType,
      serviceMode: originalBooking.serviceMode,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      duration: originalBooking.duration,
      location: originalBooking.location,
      pricing: originalBooking.pricing,
      paymentType: originalBooking.paymentType,
      adminApproval: { status: 'Pending' }
    });

    await newBooking.save();

    // Book the slot
    doctor.bookSlot(appointmentDate, slotTime.startTime, newBooking._id);
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Appointment rebooked successfully',
      data: newBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rebooking appointment',
      error: error.message
    });
  }
};

// Submit Feedback & Rating
exports.submitFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review } = req.body;
    const patientId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating (1-5)'
      });
    }

    const booking = await Booking.findOne({ bookingId, patientId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed appointments'
      });
    }

    booking.feedback = {
      rating,
      review,
      submittedAt: new Date()
    };

    await booking.save();

    // Update doctor's average rating
    const doctor = await Doctor.findById(booking.doctorId);
    const allBookings = await Booking.find({ 
      doctorId: booking.doctorId,
      'feedback.rating': { $exists: true }
    });

    const totalRating = allBookings.reduce((sum, b) => sum + b.feedback.rating, 0);
    doctor.averageRating = (totalRating / allBookings.length).toFixed(1);
    doctor.totalReviews = allBookings.length;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// Get Pending Approvals (Admin)
exports.getPendingApprovals = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      'adminApproval.status': 'Pending' 
    })
      .populate('patientId', 'name phone address')
      .populate('doctorId', 'firstName specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

// Get All Bookings (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    
    if (status) query.status = status;
    
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('patientId', 'name phone')
      .populate('doctorId', 'firstName specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};





// ADD THESE TWO MISSING FUNCTIONS TO controllers/bookingController.js

// Get Single Booking Details
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findOne({ bookingId })
      .populate('patientId', 'name phone email profilePhoto age gender address')
      .populate('doctorId', 'firstName specialization yearsOfExperience averageRating profilePhoto consultationFees');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Authorization check
    if (userRole === 'patient' && booking.patientId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    if (userRole === 'doctor' && booking.doctorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error.message
    });
  }
};

// Get Booking Stats (Admin)
exports.getBookingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments(matchQuery);
    const pendingApprovals = await Booking.countDocuments({
      ...matchQuery,
      'adminApproval.status': 'Pending'
    });
    const completedBookings = await Booking.countDocuments({
      ...matchQuery,
      status: 'Completed'
    });

    const totalRevenue = await Booking.aggregate([
      { $match: { ...matchQuery, paymentStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingApprovals,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking stats',
      error: error.message
    });
  }
};





module.exports = exports;
