// utils/formatUtils.js

/**
 * Convert minutes into a human-readable duration string.
 * Examples:
 * 30   -> "0.5 hours"
 * 60   -> "1 hour"
 * 90   -> "1.5 hours"
 * 1440 -> "24 hours"
 *
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(minutes) {
  const map = {
    30: '0.5 hours',
    45: '0.75 hours',
    60: '1 hour',
    90: '1.5 hours',
    120: '2 hours',
    150: '2.5 hours',
    180: '3 hours',
    240: '4 hours',
    360: '6 hours',
    480: '8 hours',
    720: '12 hours',
    1440: '24 hours'
  };

  if (map[minutes]) {
    return map[minutes];
  }

  if (minutes > 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  // fallback: show decimal hours rounded to two decimals
  return `${(minutes / 60).toFixed(2)} hours`;
}

module.exports = { formatDuration };
