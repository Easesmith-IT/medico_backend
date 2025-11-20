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










const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    unique: true
  },
  
  // Participants - Patient books with Medico
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  // Optional: If patient wants to book a specific doctor
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor',
    required: false,
    default: null
  },
  
  // Required: Service being booked (e.g., Doctor Visit, Nursing, etc.)
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required']
  },
  
  // Service Partner assigned by Medico (could be doctor or other service provider)
  servicePartnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePartner',
    required: false,
    default: null
  },
  
  servicePartnerType: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Physiotherapist', 'Attendant', null],
    default: null
  },
  
  // Service Details - Booked through Medico
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
  
  // Patient preferences (optional)
  preferredPartner: {
    partnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'preferredPartner.partnerModel'
    },
    partnerModel: {
      type: String,
      enum: ['Doctor', 'ServicePartner', null],
      default: null
    },
    partnerName: String,
    isAssigned: { type: Boolean, default: false }
  },
  
  // Appointment Time
  appointmentDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Appointment date cannot be in the past'
    }
  },
  
  slotTime: {
    startTime: { 
      type: String, 
      required: true,
      validate: {
        validator: function(value) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: { 
      type: String, 
      required: true,
      validate: {
        validator: function(value) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
        message: 'End time must be in HH:MM format'
      }
    }
  },
  
  duration: { 
    type: Number,
    min: [15, 'Minimum duration is 15 minutes'],
    max: [480, 'Maximum duration is 8 hours']
  },
  
  // Location details
  location: {
    type: { 
      type: String, 
      enum: ['home', 'provider'], 
      required: true 
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
        validate: {
          validator: function(value) {
            return !value || /^\d{6}$/.test(value);
          },
          message: 'Pincode must be 6 digits'
        }
      },
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
      }
    }
  },

  // Pricing - Set by Medico
  pricing: {
    basePrice: { 
      type: Number, 
      required: true,
      min: [0, 'Base price cannot be negative']
    },
    equipmentCharges: { 
      type: Number, 
      default: 0,
      min: [0, 'Equipment charges cannot be negative']
    },
    taxes: { 
      type: Number, 
      required: true,
      min: [0, 'Taxes cannot be negative']
    },
    partnerCommission: {
      type: Number,
      min: [0, 'Commission cannot be negative'],
      default: 0
    },
    medicoRevenue: {
      type: Number,
      min: [0, 'Revenue cannot be negative'],
      default: 0
    },
    totalAmount: { 
      type: Number, 
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },

  // Payment - Goes to Medico
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
  paymentGateway: {
    type: String,
    enum: ['Razorpay', 'Paytm', 'PhonePe', 'GooglePay', 'Cash', null],
    default: null
  },

  // Partner Payout Tracking
  partnerPayout: {
    amount: Number,
    status: {
      type: String,
      enum: ['Pending', 'Processed', 'Failed', null],
      default: null
    },
    paidAt: Date,
    paymentMethod: String,
    transactionId: String
  },

  // Booking Status
  status: {
    type: String,
    enum: [
      'Pending',
      'Partner Assigned',
      'Scheduled',
      'Rescheduled',
      'On Going',
      'Cancelled',
      'Disapproved',
      'Completed'
    ],
    default: 'Pending'
  },
  
  subStatus: {
    type: String,
    enum: ['On the Way', 'Reached', 'Not Available', 'Completed', null],
    default: null
  },

  // Admin Workflow
  adminApproval: {
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Disapproved'], 
      default: 'Pending' 
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    },
    approvedAt: Date,
    remarks: String,
    partnerAssignedBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin'
    },
    partnerAssignedAt: Date
  },

  // Partner Acceptance
  partnerAcceptance: {
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', null],
      default: null
    },
    respondedAt: Date,
    rejectionReason: String
  },

  // Cancellation
  cancellation: {
    cancelledBy: { 
      type: String, 
      enum: ['Patient', 'Partner', 'Admin', null],
      default: null
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: { type: Number, min: 0 },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Failed', null],
      default: null
    }
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
    rescheduledBy: {
      type: String,
      enum: ['Patient', 'Partner', 'Admin']
    },
    rescheduledAt: { type: Date, default: Date.now },
    reason: String,
    oldPartnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ServicePartner' 
    },
    newPartnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ServicePartner' 
    }
  }],

  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    submittedAt: Date,
    serviceQuality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },

  // Invoice
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    generatedAt: Date,
    isGenerated: { type: Boolean, default: false }
  },

  partnerNotes: {
    type: String,
    maxlength: [1000, 'Partner notes cannot exceed 1000 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },

  notifications: [{
    type: {
      type: String,
      enum: [
        'booking_confirmation',
        'booking_approved',
        'partner_assigned',
        'partner_accepted',
        'partner_rejected',
        'booking_cancelled',
        'booking_rescheduled',
        'payment_received',
        'reminder',
        'status_update'
      ]
    },
    recipient: {
      type: String,
      enum: ['Patient', 'Partner', 'Admin']
    },
    message: String,
    sentAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['sent', 'failed'],
      default: 'sent'
    }
  }]

}, { 
  timestamps: true,
  versionKey: '__v'
});

// ============= PRE-VALIDATION HOOKS =============

bookingSchema.pre('validate', async function(next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `MED${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }

  // Validate slot times
  if (this.slotTime && this.slotTime.startTime && this.slotTime.endTime) {
    const start = new Date(`1970-01-01T${this.slotTime.startTime}`);
    const end = new Date(`1970-01-01T${this.slotTime.endTime}`);
    
    if (end <= start) {
      return next(new Error('End time must be after start time'));
    }
  }

  // Calculate commission and revenue split
  if (this.pricing && this.pricing.totalAmount && this.servicePartnerId) {
    const commissionRate = 0.30; // Medico takes 30%, partner gets 70%
    this.pricing.partnerCommission = this.pricing.totalAmount * (1 - commissionRate);
    this.pricing.medicoRevenue = this.pricing.totalAmount * commissionRate;
  }

  next();
});

// ============= INSTANCE METHODS =============

bookingSchema.methods.canAssignPartner = function() {
  return this.adminApproval.status === 'Approved' && 
         !this.servicePartnerId;
};

bookingSchema.methods.notifyPartnerAssignment = async function() {
  this.notifications.push({
    type: 'partner_assigned',
    recipient: 'Partner',
    message: `New booking assigned: ${this.bookingId}`,
    sentAt: new Date(),
    status: 'sent'
  });
  await this.save();
};

// ============= STATIC METHODS =============

bookingSchema.statics.getPendingAssignments = function() {
  return this.find({
    'adminApproval.status': 'Approved',
    servicePartnerId: null,
    status: 'Pending'
  }).populate('patientId doctorId serviceId');
};

bookingSchema.statics.getPartnerBookings = function(partnerId, status = null) {
  const query = { servicePartnerId: partnerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('patientId doctorId serviceId')
    .sort({ appointmentDate: 1 });
};

bookingSchema.statics.getDoctorBookings = function(doctorId, status = null) {
  const query = { doctorId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('patientId servicePartnerId serviceId')
    .sort({ appointmentDate: 1 });
};

// ============= INDEXES =============

bookingSchema.index({ patientId: 1, status: 1 });
bookingSchema.index({ doctorId: 1, appointmentDate: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ servicePartnerId: 1, appointmentDate: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'adminApproval.status': 1 });
bookingSchema.index({ status: 1, appointmentDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ serviceType: 1, serviceMode: 1 });

bookingSchema.index(
  { 
    servicePartnerId: 1, 
    appointmentDate: 1, 
    'slotTime.startTime': 1 
  }, 
  { 
    unique: true,
    name: 'unique_partner_slot',
    partialFilterExpression: { 
      status: { $nin: ['Cancelled', 'Disapproved'] },
      servicePartnerId: { $ne: null }
    }
  }
);

bookingSchema.index(
  { 
    doctorId: 1, 
    appointmentDate: 1, 
    'slotTime.startTime': 1 
  }, 
  { 
    unique: true,
    name: 'unique_doctor_slot',
    sparse: true,
    partialFilterExpression: { 
      status: { $nin: ['Cancelled', 'Disapproved'] },
      doctorId: { $ne: null }
    }
  }
);

bookingSchema.index({ 
  bookingId: 'text', 
  partnerNotes: 'text', 
  adminNotes: 'text' 
});

// ============= VIRTUAL FIELDS =============

bookingSchema.virtual('isPartnerAssigned').get(function() {
  return this.servicePartnerId !== null;
});

bookingSchema.virtual('isDoctorSpecified').get(function() {
  return this.doctorId !== null;
});

bookingSchema.virtual('partnerEarnings').get(function() {
  return this.pricing.partnerCommission || 0;
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);



























// models/Booking.js
// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//   bookingId: { 
//     type: String, 
//     unique: true
//     // Removed required: true - let pre-save hook handle it
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
//   duration: { type: Number },
  
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

//   // Pricing
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

//   // ✅ FIXED: Added 'Pending' to enum
//   status: {
//     type: String,
//     enum: ['Pending', 'Scheduled', 'Rescheduled', 'On Going', 'Cancelled', 'Disapproved', 'Completed'],
//     default: 'Pending'
//   },
  
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

//   providerNotes: String,
//   adminNotes: String,

//   notifications: [{
//     type: String,
//     message: String,
//     sentAt: Date,
//     status: { type: String, enum: ['sent', 'failed'] }
//   }]

// }, { timestamps: true });

// //  FIXED: Generate booking ID in pre-validate hook (runs before validation)
// bookingSchema.pre('validate', async function(next) {
//   if (!this.bookingId) {
//     const count = await mongoose.model('Booking').countDocuments();
//     this.bookingId = `MED${Date.now()}${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// // Indexes
// bookingSchema.index({ patientId: 1, status: 1 });
// bookingSchema.index({ doctorId: 1, appointmentDate: 1 });
// bookingSchema.index({ bookingId: 1 });
// bookingSchema.index({ 'adminApproval.status': 1 });

// module.exports = mongoose.model('Booking', bookingSchema);
