const mongoose = require('mongoose');
const treatmentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true  // Ek booking = ek treatment
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  servicePartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },
  
  // Valid for 5 days (prescription logic)
  validTill: { type: Date, default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  status: { 
    type: String, 
    enum: ['Active', 'InProgress', 'Completed', 'Expired', 'Cancelled'], 
    default: 'Active' 
  },
  
  appointmentDate: { type: Date, required: true },
  slotTime: {
    startTime: String,
    endTime: String
  },
  
  invoiceGenerated: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  
}, { timestamps: true 
});


module.exports = mongoose.model('Treatment', treatmentSchema);
