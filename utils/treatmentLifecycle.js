const TERMINAL_BOOKING_STATUSES = new Set(["Completed", "TreatmentCompleted", "Cancelled", "Rejected"]);
const OPEN_BOOKING_STATUSES = new Set([
  "Pending",
  "Approved",
  "In-Progress",
  "Confirmed",
  "Started",
  "Rescheduled",
  "Cancellation Requested",
]);

const TREATMENT_STATES = {
  ACTIVE: "Active",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const isValidTreatmentState = (state = "") =>
  Object.values(TREATMENT_STATES).includes(String(state || ""));

const getAllowedTreatmentActions = ({
  status,
  hasCurrentBooking,
  hasOpenFutureSessions,
} = {}) => {
  const normalized = String(status || "");
  const actions = [];

  if (normalized === TREATMENT_STATES.EXPIRED) {
    actions.push("activate");
  }

  if (normalized === TREATMENT_STATES.ACTIVE) {
    actions.push("expire");
  }

  if (
    (normalized === TREATMENT_STATES.ACTIVE ||
      normalized === TREATMENT_STATES.IN_PROGRESS) &&
    hasCurrentBooking &&
    !hasOpenFutureSessions
  ) {
    actions.push("complete");
  }

  return actions;
};

const canTransitionStatus = ({ currentStatus, targetStatus }) => {
  const current = String(currentStatus || "");
  const target = String(targetStatus || "");

  if (current === TREATMENT_STATES.EXPIRED && target === TREATMENT_STATES.ACTIVE) {
    return true;
  }

  if (current === TREATMENT_STATES.ACTIVE && target === TREATMENT_STATES.EXPIRED) {
    return true;
  }

  return false;
};

module.exports = {
  TERMINAL_BOOKING_STATUSES,
  OPEN_BOOKING_STATUSES,
  TREATMENT_STATES,
  isValidTreatmentState,
  getAllowedTreatmentActions,
  canTransitionStatus,
};
