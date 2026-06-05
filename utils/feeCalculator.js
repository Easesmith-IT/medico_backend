/**
 * Helper to parse a fee input (string or number) into a numeric fee amount
 * and optionally detect the currency.
 * Supported currency symbols: $, ₹, €, £
 * Supported currency codes: USD, INR, EUR, GBP
 */
const parseFeesAndCurrency = (feeInput) => {
  if (typeof feeInput === 'number') {
    return { fees: feeInput, currency: null };
  }
  if (typeof feeInput !== 'string') {
    return { fees: 0, currency: null };
  }
  
  let currency = null;
  const upperInput = feeInput.toUpperCase();
  
  if (feeInput.includes('$')) currency = 'USD';
  else if (feeInput.includes('₹') || upperInput.includes('INR')) currency = 'INR';
  else if (feeInput.includes('€') || upperInput.includes('EUR')) currency = 'EUR';
  else if (feeInput.includes('£') || upperInput.includes('GBP')) currency = 'GBP';
  
  // Remove currency symbols, commas, spaces
  const cleaned = feeInput.replace(/[$\u20B9€£\s,]/g, '');
  const fees = parseFloat(cleaned);
  
  return { 
    fees: isNaN(fees) ? 0 : fees, 
    currency 
  };
};

/**
 * Calculates the adjusted consultation fee based on doctor availability rules
 * Rules include weekend markups, peak hours, custom dates (holidays), and low availability
 * @param {Object} doctor Doctor document
 * @param {Date|String} appointmentDate Date of the slot/appointment
 * @param {String} startTime Start time of slot (e.g. "18:00")
 * @param {Object} dailySlot Daily slot object to check remaining slot counts for low-availability rule
 */
const calculateAdjustedFee = (doctor, appointmentDate, startTime, dailySlot = null) => {
  const baseFee = doctor.consultationFees || 0;
  
  if (!doctor.feeAdjustments || !doctor.feeAdjustments.enabled || !doctor.feeAdjustments.rules) {
    return baseFee;
  }
  
  const dateObj = new Date(appointmentDate);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Friday"
  const isWeekend = ['Saturday', 'Sunday'].includes(dayName);
  
  let totalAdjustmentPercent = 0;
  let totalAdjustmentAbsolute = 0;
  
  for (const rule of doctor.feeAdjustments.rules) {
    let matches = false;
    
    if (rule.adjustmentType === 'weekend' && isWeekend) {
      matches = true;
    } 
    else if (rule.adjustmentType === 'custom-date' && rule.customDate) {
      const ruleDateStr = new Date(rule.customDate).toDateString();
      if (dateObj.toDateString() === ruleDateStr) {
        matches = true;
      }
    } 
    else if (rule.adjustmentType === 'peak-hours' && startTime && rule.startTime && rule.endTime) {
      if (startTime >= rule.startTime && startTime <= rule.endTime) {
        matches = true;
      }
    } 
    else if (rule.adjustmentType === 'low-availability' && dailySlot && rule.thresholdSlots !== undefined) {
      const availableSlotsCount = (dailySlot.slots || []).filter(
        s => s.status === 'available' && !s.isBooked && s.isSlotAvailable !== false
      ).length;
      if (availableSlotsCount < rule.thresholdSlots) {
        matches = true;
      }
    }
    
    if (matches) {
      if (rule.valueType === 'percentage') {
        totalAdjustmentPercent += rule.value;
      } else if (rule.valueType === 'absolute') {
        totalAdjustmentAbsolute += rule.value;
      }
    }
  }
  
  let adjustedFee = baseFee + totalAdjustmentAbsolute + (baseFee * totalAdjustmentPercent / 100);
  return Math.max(0, Math.round(adjustedFee * 100) / 100);
};

module.exports = {
  parseFeesAndCurrency,
  calculateAdjustedFee
};
