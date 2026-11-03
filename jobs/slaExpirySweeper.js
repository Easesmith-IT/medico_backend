const Booking = require("../models/bookingModel");
const DoctorAppointment = require("../models/doctorAppointmentModel");
const { getScheduledDateRange } = require("../utils/bookingTemporalValidator");

const SLA_TIMEOUT_HOURS = 12;
const NEAR_TERM_HOURS = 2;

async function processSlaSweeper() {
  try {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - SLA_TIMEOUT_HOURS * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + NEAR_TERM_HOURS * 60 * 60 * 1000);

    // 1. Service Bookings Sweeper
    const pendingBookings = await Booking.find({
      status: "Pending",
      escalatedToAdmin: { $ne: true },
    }).limit(100);

    for (const booking of pendingBookings) {
      let isExpired = false;
      let reason = "";

      if (booking.createdAt && booking.createdAt <= twelveHoursAgo) {
        isExpired = true;
        reason = "12-hour SLA unresponded by provider";
      } else if (booking.appointmentDate) {
        const { scheduledStart } = getScheduledDateRange(booking.appointmentDate, booking.slotTime);
        if (scheduledStart && scheduledStart <= twoHoursFromNow) {
          isExpired = true;
          reason = "Near-term appointment within 2 hours";
        }
      }

      if (isExpired) {
        const updated = await Booking.updateOne(
          { _id: booking._id, status: "Pending", escalatedToAdmin: { $ne: true } },
          {
            $set: {
              escalatedToAdmin: true,
              escalatedAt: now,
              escalationReason: reason,
            },
          }
        );
        if (updated.modifiedCount > 0) {
          console.log(`[SLA Sweeper] Booking ${booking._id} escalated to Admin (${reason}).`);
        }
      }
    }

    // 2. Doctor Appointments Sweeper
    const pendingAppointments = await DoctorAppointment.find({
      status: "Pending",
      escalatedToAdmin: { $ne: true },
    }).limit(100);

    for (const apt of pendingAppointments) {
      let isExpired = false;
      let reason = "";

      if (apt.createdAt && apt.createdAt <= twelveHoursAgo) {
        isExpired = true;
        reason = "12-hour SLA unresponded by doctor";
      } else if (apt.appointmentDate) {
        const { scheduledStart } = getScheduledDateRange(apt.appointmentDate, apt.slotTime);
        if (scheduledStart && scheduledStart <= twoHoursFromNow) {
          isExpired = true;
          reason = "Near-term appointment within 2 hours";
        }
      }

      if (isExpired) {
        const updated = await DoctorAppointment.updateOne(
          { _id: apt._id, status: "Pending", escalatedToAdmin: { $ne: true } },
          {
            $set: {
              escalatedToAdmin: true,
              escalatedAt: now,
              escalationReason: reason,
            },
          }
        );
        if (updated.modifiedCount > 0) {
          console.log(`[SLA Sweeper] Doctor Appointment ${apt._id} escalated to Admin (${reason}).`);
        }
      }
    }
  } catch (error) {
    console.error("[SLA Sweeper Error]:", error.message);
  }
}

module.exports = { processSlaSweeper };
