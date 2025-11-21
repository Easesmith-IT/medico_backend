
function autoFilterSlots(slotConfig, category, timeFormat = '24-hour') {
  if (!slotConfig || typeof slotConfig !== 'object') return {};

  const filteredSlotConfig = {};

  switch (category) {
    case 'consultation':
      if (slotConfig.consultationSlots && slotConfig.consultationSlots.enabled) {
        filteredSlotConfig.consultationSlots = { ...slotConfig.consultationSlots };
        // Could add time format conversion for startTime/endTime here if needed
      }
      break;

    case 'nursing':
      if (slotConfig.nursingSlots && slotConfig.nursingSlots.enabled) {
        filteredSlotConfig.nursingSlots = { ...slotConfig.nursingSlots };
      }
      break;

    case 'equipment':
      if (slotConfig.equipmentBooking && slotConfig.equipmentBooking.enabled) {
        filteredSlotConfig.equipmentBooking = { ...slotConfig.equipmentBooking };
      }
      break;

    default:
      // For unknown category, include all enabled slots
      if (slotConfig.consultationSlots && slotConfig.consultationSlots.enabled) {
        filteredSlotConfig.consultationSlots = { ...slotConfig.consultationSlots };
      }
      if (slotConfig.nursingSlots && slotConfig.nursingSlots.enabled) {
        filteredSlotConfig.nursingSlots = { ...slotConfig.nursingSlots };
      }
      if (slotConfig.equipmentBooking && slotConfig.equipmentBooking.enabled) {
        filteredSlotConfig.equipmentBooking = { ...slotConfig.equipmentBooking };
      }
  }

  return filteredSlotConfig;
}

module.exports = { autoFilterSlots };
