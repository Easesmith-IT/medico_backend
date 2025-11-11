// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
  },
  description: { type: String, required: true },
  
  // Admin-managed pricing
  basePrice: { type: Number, required: true },
  equipmentCharges: { type: Number, default: 0 },
  taxPercentage: { type: Number, required: true, default: 18 },
  
  // Service modes
  modes: [{
    type: String,
    enum: ['Home Service', 'Visit Provider Location']
  }],
  
  // Duration support
  supportsDuration: { type: Boolean, default: false },
  defaultDuration: { type: Number, default: 30 }, // minutes
  durationOptions: [Number], // [30, 60, 90, 120]
  
  // Payment configuration (Admin-configurable)
  paymentMode: {
    type: String,
    enum: ['Prepaid', 'Postpaid', 'Both'],
    default: 'Both'
  },
  
  isActive: { type: Boolean, default: true },
  icon: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
