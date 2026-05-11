const mongoose = require('mongoose');
const treatmentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    default: undefined,
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  servicePartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },
   startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  // Valid for 5 days (prescription logic)
  validTill: { type: Date, default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  status: { 
    type: String, 
    enum: ['Active', 'InProgress', 'Completed', 'Expired', 'Cancelled'], 
    default: 'Active' 
  },
   currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    lastBookingAt: {
      type: Date,
      default: null,
    },
  invoiceGenerated: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  isActive: {
      type: Boolean,
      default: true,
    },
  
}, { timestamps: true 
});


module.exports = mongoose.model('Treatment', treatmentSchema);
