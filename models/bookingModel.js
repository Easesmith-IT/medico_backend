// // models/Booking.js
// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//   bookingId: { 
//     type: String, 
//     unique: true, 
//     required: true 
//   },
  
//   // Participants
//   patientId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Patient', 
//     required: true 
//   },
//   doctorId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Doctor', 
//     required: true 
//   },
  
//   // Service Details
//   serviceType: { 
//     type: String, 
//     enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care'],
//     required: true 
//   },
//   serviceMode: {
//     type: String,
//     enum: ['Home Service', 'Visit Provider Location'],
//     required: true
//   },
  
//   // Appointment Time
//   appointmentDate: { type: Date, required: true },
//   slotTime: {
//     startTime: { type: String, required: true },
//     endTime: { type: String, required: true }
//   },
//   duration: { type: Number }, // in minutes
  
//   // Location details
//   location: {
//     type: { type: String, enum: ['home', 'provider'], required: true },
//     address: {
//       street: String,
//       city: String,
//       state: String,
//       pincode: String,
//       coordinates: {
//         latitude: Number,
//         longitude: Number
//       }
//     }
//   },

//   // Pricing (cost breakdown)
//   pricing: {
//     basePrice: { type: Number, required: true },
//     equipmentCharges: { type: Number, default: 0 },
//     taxes: { type: Number, required: true },
//     totalAmount: { type: Number, required: true }
//   },

//   // Payment Handling
//   paymentType: { 
//     type: String, 
//     enum: ['Prepaid', 'Postpaid'], 
//     required: true 
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
//     default: 'Pending'
//   },
//   paymentId: String,
//   transactionId: String,
//   paymentGateway: String,

//   // Appointment Lifecycle Status
//   status: {
//     type: String,
//     enum: ['Scheduled', 'Rescheduled', 'On Going', 'Cancelled', 'Disapproved', 'Completed'],
//     default: 'Pending'
//   },
  
//   // Provider Sub-Status (for Home Services)
//   subStatus: {
//     type: String,
//     enum: ['On the Way', 'Reached', 'Not Available', 'Completed', null],
//     default: null
//   },

//   // Admin Approval Workflow
//   adminApproval: {
//     status: { 
//       type: String, 
//       enum: ['Pending', 'Approved', 'Disapproved'], 
//       default: 'Pending' 
//     },
//     approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
//     approvedAt: Date,
//     remarks: String
//   },

//   // Cancellation
//   cancellation: {
//     cancelledBy: { 
//       type: String, 
//       enum: ['Patient', 'Doctor', 'Admin'] 
//     },
//     cancelledAt: Date,
//     reason: String
//   },

//   // Rescheduling
//   rescheduleHistory: [{
//     oldDate: Date,
//     oldSlot: {
//       startTime: String,
//       endTime: String
//     },
//     newDate: Date,
//     newSlot: {
//       startTime: String,
//       endTime: String
//     },
//     rescheduledBy: String,
//     rescheduledAt: Date,
//     reason: String
//   }],

//   // Feedback & Rating
//   feedback: {
//     rating: { type: Number, min: 1, max: 5 },
//     review: String,
//     submittedAt: Date
//   },

//   // Invoice Generation
//   invoice: {
//     invoiceNumber: String,
//     invoiceUrl: String,
//     generatedAt: Date,
//     isGenerated: { type: Boolean, default: false }
//   },

//   // Provider Notes
//   providerNotes: String,
//   adminNotes: String,

//   // Notifications
//   notifications: [{
//     type: String,
//     message: String,
//     sentAt: Date,
//     status: { type: String, enum: ['sent', 'failed'] }
//   }]

// }, { timestamps: true });

// // Generate booking ID before saving
// bookingSchema.pre('save', async function(next) {
//   if (!this.bookingId) {
//     const count = await mongoose.model('Booking').countDocuments();
//     this.bookingId = `MED${Date.now()}${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// // Index for faster queries
// bookingSchema.index({ patientId: 1, status: 1 });
// bookingSchema.index({ doctorId: 1, appointmentDate: 1 });
// bookingSchema.index({ bookingId: 1 });
// bookingSchema.index({ 'adminApproval.status': 1 });

// module.exports = mongoose.model('Booking', bookingSchema);


// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    unique: true
    // Removed required: true - let pre-save hook handle it
  },
  
  // Participants
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  
  // Service Details
  serviceType: { 
    type: String, 
    enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care'],
    required: true 
  },
  serviceMode: {
    type: String,
    enum: ['Home Service', 'Visit Provider Location'],
    required: true
  },
  
  // Appointment Time
  appointmentDate: { type: Date, required: true },
  slotTime: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  duration: { type: Number },
  
  // Location details
  location: {
    type: { type: String, enum: ['home', 'provider'], required: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },

  // Pricing
  pricing: {
    basePrice: { type: Number, required: true },
    equipmentCharges: { type: Number, default: 0 },
    taxes: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
  },

  // Payment Handling
  paymentType: { 
    type: String, 
    enum: ['Prepaid', 'Postpaid'], 
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentId: String,
  transactionId: String,
  paymentGateway: String,

  // ✅ FIXED: Added 'Pending' to enum
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Rescheduled', 'On Going', 'Cancelled', 'Disapproved', 'Completed'],
    default: 'Pending'
  },
  
  subStatus: {
    type: String,
    enum: ['On the Way', 'Reached', 'Not Available', 'Completed', null],
    default: null
  },

  // Admin Approval Workflow
  adminApproval: {
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Disapproved'], 
      default: 'Pending' 
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: Date,
    remarks: String
  },

  // Cancellation
  cancellation: {
    cancelledBy: { 
      type: String, 
      enum: ['Patient', 'Doctor', 'Admin'] 
    },
    cancelledAt: Date,
    reason: String
  },

  // Rescheduling
  rescheduleHistory: [{
    oldDate: Date,
    oldSlot: {
      startTime: String,
      endTime: String
    },
    newDate: Date,
    newSlot: {
      startTime: String,
      endTime: String
    },
    rescheduledBy: String,
    rescheduledAt: Date,
    reason: String
  }],

  // Feedback & Rating
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    submittedAt: Date
  },

  // Invoice Generation
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    generatedAt: Date,
    isGenerated: { type: Boolean, default: false }
  },

  providerNotes: String,
  adminNotes: String,

  notifications: [{
    type: String,
    message: String,
    sentAt: Date,
    status: { type: String, enum: ['sent', 'failed'] }
  }]

}, { timestamps: true });

//  FIXED: Generate booking ID in pre-validate hook (runs before validation)
bookingSchema.pre('validate', async function(next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `MED${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes
bookingSchema.index({ patientId: 1, status: 1 });
bookingSchema.index({ doctorId: 1, appointmentDate: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'adminApproval.status': 1 });

module.exports = mongoose.model('Booking', bookingSchema);
