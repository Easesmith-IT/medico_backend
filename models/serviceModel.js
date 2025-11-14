// // models/Service.js
// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: true,
//     enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
//   },
//   description: { type: String, required: true },
  
//   // Admin-managed pricing
//   basePrice: { type: Number, required: true },
//   equipmentCharges: { type: Number, default: 0 },
//   taxPercentage: { type: Number, required: true, default: 18 },
  
//   // Service modes
//   modes: [{
//     type: String,
//     enum: ['Home Service', 'Visit Provider Location']
//   }],
  
//   // Duration support
//   supportsDuration: { type: Boolean, default: false },
//   defaultDuration: { type: Number, default: 30 }, // minutes
//   durationOptions: [Number], // [30, 60, 90, 120]
  
//   // Payment configuration (Admin-configurable)
//   paymentMode: {
//     type: String,
//     enum: ['Prepaid', 'Postpaid', 'Both'],
//     default: 'Both'
//   },
  
//   isActive: { type: Boolean, default: true },
//   icon: String,
//   image: String
// }, { timestamps: true });

// module.exports = mongoose.model('Service', serviceSchema);



// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Service name (fixed enum)
  name: { 
    type: String, 
    required: true,
    enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
  },
  
  // Service description
  description: { 
    type: String, 
    required: true 
  },
  
  // Admin-managed pricing
  basePrice: { 
    type: Number, 
    required: true 
  },
  equipmentCharges: { 
    type: Number, 
    default: 0 
  },
  taxPercentage: { 
    type: Number, 
    required: true, 
    default: 18 
  },
  
  // Service modes (where service can be provided)
  modes: [{
    type: String,
    enum: ['Home Service', 'Visit Provider Location']
  }],
  
  // Duration support (for time-based services)
  supportsDuration: { 
    type: Boolean, 
    default: false 
  },
  defaultDuration: { 
    type: Number, 
    default: 30 
  }, // minutes
  durationOptions: [Number], // [30, 60, 90, 120]
  
  // Payment configuration (Admin-configurable)
  paymentMode: {
    type: String,
    enum: ['Prepaid', 'Postpaid', 'Both'],
    default: 'Both'
  },
  
  // Cities where service is available
  cities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  }],
  
  // Creator tracking (Admin or Doctor)
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdBy.userModel',
      required: true
    },
    userModel: {
      type: String,
      enum: ['Admin', 'Doctor'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  
  // Service status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Media assets
  icon: String,
  image: String
  
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
serviceSchema.index({ name: 1 });
serviceSchema.index({ cities: 1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
