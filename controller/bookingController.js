// controllers/bookingController.js
const Booking = require('../models/bookingModel');
const Service = require('../models/serviceModel');
const { autoFilterSlots } = require('../utils/timeFIlter');
const { formatDuration } = require('../utils/timeFormat');

exports.createBooking = async (req, res) => {
  try {
    const patientId = req.user && req.user.id ? req.user.id : req.body.patientId;

    const {
      serviceId,
      appointmentDate,  // 'YYYY-MM-DD'
      startTime,        // 'HH:mm' e.g. "10:00"
      endTime,          // 'HH:mm' e.g. "10:30"
      duration,         // optional minutes
      shiftType,        // optional string
      servicePartnerId, // optional ObjectId
      notes,
      category,         // optional string
      modes             // optional array of strings
    } = req.body;

    if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'patientId, serviceId, appointmentDate, startTime, and endTime are required'
      });
    }

    const service = await Service.findById(serviceId);

    if (!service || !service.isActive || service.isDeleted) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive' });
    }

    // Use category and modes from Service if not provided in request
    const bookingCategory = category || service.category || null;
    const bookingModes = Array.isArray(modes) && modes.length > 0 ? modes : service.modes || [];

    // Check slot conflicts
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictQuery = {
      serviceId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['Cancelled', 'Rejected'] },
      'slotTime.startTime': startTime,
      'slotTime.endTime': endTime
    };

    if (servicePartnerId) {
      conflictQuery.servicePartnerId = servicePartnerId;
    }

    const existingBooking = await Booking.findOne(conflictQuery);
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Slot already booked. Choose another slot.'
      });
    }

    // Calculate duration (if not provided, use difference between start and end time)
    let bookingDuration = duration;
    if (!bookingDuration) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
      if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
    }

    // Calculate pricing snapshot
    const pricing = service.calculateTotalPrice(
      bookingDuration,
      false, // includeEquipment - adjust if needed
      shiftType || null
    );

    const newBooking = new Booking({
      patientId,
      serviceId,
      category: bookingCategory,
      modes: bookingModes,
      servicePartnerId: servicePartnerId || null,
      appointmentDate: new Date(appointmentDate),
      slotTime: { startTime, endTime },
      duration: bookingDuration,
      shiftType: shiftType || null,
      status: 'Pending',
      pricing,
      notes: notes || '',
      createdBy: {
        userId: patientId,
        userModel: 'Patient'
      }
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...newBooking.toObject(),
        formattedDuration: formatDuration(bookingDuration),
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};




exports.getBookedServicesByPatientId = async (req, res) => {
  try {
    const patientId = req.user && req.user.id ? req.user.id : req.params.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const { status, dateFilterType, startDate, endDate } = req.query;

    let query = { patientId };

    if (status) {
      query.status = status;
    }

    // Date filters
    if (dateFilterType === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
    } else if (dateFilterType === 'week') {
      const now = new Date();
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: firstDayOfWeek, $lte: lastDayOfWeek };
    } else if (dateFilterType === 'custom' && startDate && endDate) {
      query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name category modes')
      .populate('servicePartnerId', 'name email phone')
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get booked services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booked services',
      error: error.message
    });
  }
};