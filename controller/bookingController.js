const Booking = require('../models/bookingModel');
const Service = require('../models/serviceModel');
const mongoose = require('mongoose');
const { autoFilterSlots } = require('../utils/timeFIlter');
const { formatDuration } = require('../utils/timeFormat');

// Book Service by Patient Id (logged-in user)
exports.createBooking = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      serviceId, cityId, date, startTime, duration, address, notes,
      paymentType, paymentId, transactionId, paymentGateway, timeFormat = '24-hour',
      preferredPartnerId
    } = req.body;

    if (!serviceId || !cityId || !date || !startTime || !duration || !address) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const service = await Service.findOne({ _id: serviceId, isActive: true, isDeleted: false });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    // Validate duration based on service category
    if (service.category === 'consultation' && duration !== 30) {
      return res.status(400).json({ success: false, message: 'Consultation services must be 30 minutes' });
    }
    if (['nursing', 'equipment'].includes(service.category) && (duration < 60 || duration > 1440)) {
      return res.status(400).json({ success: false, message: 'Duration must be between 1 hour and 24 hours' });
    }

    // Build start and end time strings
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

    // Calculate pricing
    const pricing = service.calculateTotalPrice(duration, false, null);

    // Prepare booking document
    const booking = new Booking({
      patientId,
      serviceId,
      cityId,
      serviceType: service.name,
      serviceCategory: service.category,
      serviceMode: service.modes[0] || 'Home Service',
      appointmentDate: new Date(date),
      slotTime: {
        startTime,
        endTime: endTimeStr,
        displayFormat: timeFormat
      },
      duration,
      durationFormatted: formatDuration(duration),
      location: {
        type: 'home',
        address
      },
      pricing,
      paymentType,
      paymentId,
      transactionId,
      paymentGateway,
      notes,
      status: 'Pending',
      partner: preferredPartnerId || null
    });

    await booking.save();

    res.status(201).json({ success: true, message: 'Booking created', data: booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Error creating booking', error: error.message });
  }
};

// Get Service/Appointment Request Summary info by Service Id with status filter
exports.getServiceSummary = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.query;

    const query = { serviceId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .sort({ appointmentDate: -1 });

    const summary = bookings.map(b => ({
      bookingId: b._id,
      patientName: `${b.patientId.firstName} ${b.patientId.lastName}`,
      appointmentDate: b.appointmentDate,
      status: b.status,
      durationFormatted: b.durationFormatted,
      notes: b.notes
    }));

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get service summary error:', error);
    res.status(500).json({ success: false, message: 'Error fetching summary', error: error.message });
  }
};

// Get all booked services by logged-in Patient Id with filters for status and date range (Today, Week, Custom)
exports.getPatientBookings = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status, dateFilter, startDate, endDate } = req.query;
    const query = { patientId };

    if (status) query.status = status;

    const now = new Date();
    if (dateFilter === 'today') {
      query.appointmentDate = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lte: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (dateFilter === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      query.appointmentDate = {
        $gte: new Date(firstDay.setHours(0, 0, 0, 0)),
        $lte: new Date(lastDay.setHours(23, 59, 59, 999)),
      };
    } else if (dateFilter === 'custom' && startDate && endDate) {
      query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name category')
      .populate('servicePartnerId', 'firstName lastName phone')
      .sort({ appointmentDate: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get patient bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
  }
};

// Reschedule service by booking id: change slot, date or partner (status dependent)
exports.rescheduleBooking = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { bookingId } = req.params;
    const { newDate, newStartTime, newPartnerId, reason } = req.body;

    if (!newDate || !newStartTime) {
      return res.status(400).json({ success: false, message: 'New date and start time are required' });
    }

    const booking = await Booking.findOne({ _id: bookingId, patientId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!['Pending', 'Approved', 'Confirmed', 'Scheduled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be rescheduled in current status' });
    }

    const [hours, minutes] = newStartTime.split(':').map(Number);
    const startDateTime = new Date(newDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    const endDateTime = new Date(startDateTime.getTime() + booking.duration * 60000);
    const endTimeStr = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

    // Check for slot conflict with partner or self
    const conflict = await Booking.findOne({
      _id: { $ne: bookingId },
      servicePartnerId: newPartnerId || booking.servicePartnerId,
      appointmentDate: new Date(newDate),
      'slotTime.startTime': { $lt: endTimeStr },
      'slotTime.endTime': { $gt: newStartTime },
      status: { $nin: ['Cancelled', 'Disapproved'] },
    });
    if (conflict) return res.status(400).json({ success: false, message: 'Selected time slot is not available' });

    booking.appointmentDate = new Date(newDate);
    booking.slotTime.startTime = newStartTime;
    booking.slotTime.endTime = endTimeStr;
    if (newPartnerId) booking.servicePartnerId = newPartnerId;
    booking.status = 'Rescheduled';
    booking.rescheduleHistory.push({
      oldDate: booking.appointmentDate,
      oldSlot: { startTime: booking.slotTime.startTime, endTime: booking.slotTime.endTime },
      newDate: new Date(newDate),
      newSlot: { startTime: newStartTime, endTime: endTimeStr },
      rescheduledBy: 'Patient',
      rescheduledAt: new Date(),
      reason,
    });

    await booking.save();
    res.json({ success: true, message: 'Booking rescheduled successfully', data: booking });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ success: false, message: 'Error rescheduling booking', error: error.message });
  }
};

