/**
 * utils/bookingTemporalValidator.js
 *
 * Enforces business rules and temporal constraints for bookings and appointments:
 * 1. An appointment cannot be started (In-Progress / Started) if its scheduled date is in the future.
 * 2. An appointment cannot be completed (Completed / TreatmentCompleted) if its scheduled date is in the future.
 * 3. An appointment must be started (In-Progress / Started) before it can transition to Completed.
 * 4. A treatment plan cannot be marked Completed if other sessions under the plan are still pending/in-progress.
 */

const { OPEN_BOOKING_STATUSES } = require('./treatmentLifecycle');

const TIMEZONE = 'Asia/Kolkata';

/**
 * Extracts normalized YYYY-MM-DD dateStr and scheduled start/end Date objects in IST (+05:30).
 */
function getScheduledDateRange(appointmentDate, slotTime = {}) {
  if (!appointmentDate) {
    return {
      dateStr: null,
      scheduledStart: null,
      scheduledEnd: null,
    };
  }

  const d = new Date(appointmentDate);
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

  let startHour = 0;
  let startMin = 0;
  if (slotTime?.startTime) {
    const parts = String(slotTime.startTime).trim().match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
    if (parts) {
      startHour = parseInt(parts[1], 10);
      startMin = parseInt(parts[2], 10);
      const meridiem = parts[3]?.toUpperCase();
      if (meridiem === 'PM' && startHour < 12) startHour += 12;
      if (meridiem === 'AM' && startHour === 12) startHour = 0;
    }
  }

  let endHour = 23;
  let endMin = 59;
  if (slotTime?.endTime) {
    const parts = String(slotTime.endTime).trim().match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
    if (parts) {
      endHour = parseInt(parts[1], 10);
      endMin = parseInt(parts[2], 10);
      const meridiem = parts[3]?.toUpperCase();
      if (meridiem === 'PM' && endHour < 12) endHour += 12;
      if (meridiem === 'AM' && endHour === 12) endHour = 0;
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startIso = `${dateStr}T${pad(startHour)}:${pad(startMin)}:00+05:30`;
  const endIso = `${dateStr}T${pad(endHour)}:${pad(endMin)}:00+05:30`;

  return {
    dateStr,
    scheduledStart: new Date(startIso),
    scheduledEnd: new Date(endIso),
  };
}

/**
 * Returns today's date string YYYY-MM-DD in IST.
 */
function getTodayDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Validates whether a booking or doctor appointment can transition to In-Progress / Started.
 */
function validateBookingCanStart(booking, now = new Date()) {
  const currentStatus = String(booking.status || '');
  if (currentStatus === 'Pending') {
    return {
      isValid: false,
      message: 'Cannot start service. Booking must be accepted by the provider first.',
      statusCode: 400,
    };
  }

  if (currentStatus === 'Cancellation Requested') {
    return {
      isValid: false,
      message: 'Cannot start service. Booking has a pending cancellation request.',
      statusCode: 400,
    };
  }

  if (['Completed', 'TreatmentCompleted'].includes(currentStatus)) {
    return {
      isValid: false,
      message: `Cannot start a service that is already ${currentStatus}.`,
      statusCode: 400,
    };
  }

  if (['Cancelled', 'Rejected'].includes(currentStatus)) {
    return {
      isValid: false,
      message: `Cannot start a ${currentStatus.toLowerCase()} service.`,
      statusCode: 400,
    };
  }

  const { dateStr, scheduledStart } = getScheduledDateRange(booking.appointmentDate, booking.slotTime);
  const todayStr = getTodayDateStr();

  if (dateStr && dateStr > todayStr) {
    return {
      isValid: false,
      message: `Cannot start service for an appointment scheduled for a future date (${dateStr}).`,
      statusCode: 400,
    };
  }

  // Allow starting up to 2 hours before scheduled slot on the appointment day
  if (scheduledStart && scheduledStart.getTime() - now.getTime() > 2 * 60 * 60 * 1000) {
    return {
      isValid: false,
      message: `Service cannot be started more than 2 hours before the scheduled slot (${booking.slotTime?.startTime || ''}).`,
      statusCode: 400,
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a booking or doctor appointment can transition to Completed / TreatmentCompleted.
 */
function validateBookingCanComplete(booking, options = {}) {
  const { allowDirectFromApproved = false, now = new Date() } = options;
  const currentStatus = String(booking.status || '');

  if (['Cancelled', 'Rejected'].includes(currentStatus)) {
    return {
      isValid: false,
      message: `Cannot complete a ${currentStatus.toLowerCase()} booking.`,
      statusCode: 400,
    };
  }

  // Check temporal date constraint
  const { dateStr } = getScheduledDateRange(booking.appointmentDate, booking.slotTime);
  const todayStr = getTodayDateStr();

  if (dateStr && dateStr > todayStr) {
    return {
      isValid: false,
      message: `Cannot mark a future scheduled booking as Completed (Scheduled date: ${dateStr}).`,
      statusCode: 400,
    };
  }

  // State machine check: Must be started before it can be completed
  const hasStarted = ['In-Progress', 'Started'].includes(currentStatus) || Boolean(booking.serviceStartedAt);
  if (!hasStarted && !allowDirectFromApproved) {
    return {
      isValid: false,
      message: `Service must be started (In-Progress) before it can be marked as Completed. Current status: ${currentStatus}.`,
      statusCode: 400,
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a treatment plan can be completed.
 * Ensures no other linked sessions are currently open or scheduled in the future.
 */
async function validateTreatmentCanComplete(TreatmentModel, BookingModel, treatmentId, currentBookingId, session = null) {
  if (!treatmentId) return { isValid: true };

  const treatment = await TreatmentModel.findById(treatmentId).session(session);
  if (!treatment) {
    return { isValid: false, message: 'Linked treatment not found.', statusCode: 404 };
  }

  // Query any other open/pending sessions in this treatment
  const openSessionsQuery = {
    treatmentId: treatment._id,
    _id: { $ne: currentBookingId },
    status: { $in: Array.from(OPEN_BOOKING_STATUSES) },
  };

  const openSessions = await BookingModel.find(openSessionsQuery)
    .select('_id sessionNumber appointmentDate status')
    .session(session)
    .lean();

  if (openSessions.length > 0) {
    const sessionDetails = openSessions
      .map((s) => `Session #${s.sessionNumber || '?'}`)
      .join(', ');
    return {
      isValid: false,
      message: `Cannot complete treatment plan: ${openSessions.length} other session(s) (${sessionDetails}) are still pending/in-progress. Complete or cancel remaining sessions first.`,
      statusCode: 409,
      openSessions,
    };
  }

  return { isValid: true, treatment };
}

module.exports = {
  TIMEZONE,
  getScheduledDateRange,
  getTodayDateStr,
  validateBookingCanStart,
  validateBookingCanComplete,
  validateTreatmentCanComplete,
};
