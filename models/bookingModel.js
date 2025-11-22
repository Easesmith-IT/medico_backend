









const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // ============= BOOKING IDENTIFICATION =============
  bookingId: { 
    type: String, 
    unique: true,
    index: true
  },
  
  // ============= PARTICIPANTS =============
  // Patient who books the service
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: [true, 'Patient ID is required'],
    index: true
  },
  
  // Optional: Specific doctor requested by patient
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor',
    default: null,
    index: true
  },
  
  // Required: Service being booked
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'],
    index: true
  },
  
  // Service Partner assigned by Admin
  servicePartnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServicePartner',
    default: null,
    index: true
  },
  
  servicePartnerType: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Physiotherapist', 'Attendant', null],
    default: null
  },
  
  // ============= SERVICE DETAILS =============
  serviceType: { 
    type: String, 
    enum: [
      'Doctor Visit', 
      'Nursing', 
      'Physiotherapy', 
      'Attendant Care', 
      'Ventilator', 
      'Oxygen Therapy'
    ],
    required: [true, 'Service type is required']
  },

  // Service category for business logic
  serviceCategory: {
    type: String,
    enum: ['consultation', 'nursing', 'equipment'],
    required: [true, 'Service category is required'],
    index: true
  },
  
  serviceMode: {
    type: String,
    enum: ['Home Service', 'Visit Provider Location'],
    required: [true, 'Service mode is required']
  },

  // For nursing services - shift type
  shiftType: {
    type: String,
    enum: ['hourly', '8-hour', '12-hour', '24-hour', 'day-shift', 'night-shift', null],
    default: null,
    validate: {
      validator: function(value) {
        if (this.serviceCategory === 'nursing') {
          return value !== null;
        }
        return true;
      },
      message: 'Shift type is required for nursing services'
    }
  },
  
  // ============= PATIENT PREFERENCES =============
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
  
  // ============= APPOINTMENT TIME =============
  appointmentDate: { 
    type: Date, 
    required: [true, 'Appointment date is required'],
    index: true,
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Appointment date cannot be in the past'
    }
  },
  
  // Slot Time with 24-hour format
  slotTime: {
    startTime: { 
      type: String, 
      required: [true, 'Start time is required'],
      validate: {
        validator: function(value) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
        message: 'Start time must be in 24-hour format (HH:MM)'
      }
    },
    endTime: { 
      type: String, 
      required: [true, 'End time is required'],
      validate: {
        validator: function(value) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
        message: 'End time must be in 24-hour format (HH:MM)'
      }
    },
    displayFormat: {
      type: String,
      enum: ['12-hour', '24-hour'],
      default: '24-hour'
    }
  },
  
  duration: { 
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Minimum duration is 15 minutes'],
    max: [1440, 'Maximum duration is 24 hours (1440 minutes)']
  },
  
  // ============= LOCATION DETAILS =============
  location: {
    type: { 
      type: String, 
      enum: ['home', 'provider'], 
      required: [true, 'Location type is required']
    },
    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      pincode: {
        type: String,
        validate: {
          validator: function(value) {
            return !value || /^\d{6}$/.test(value);
          },
          message: 'Pincode must be 6 digits'
        }
      },
      landmark: {
        type: String,
        trim: true
      },
      coordinates: {
        latitude: { 
          type: Number, 
          min: [-90, 'Latitude must be between -90 and 90'], 
          max: [90, 'Latitude must be between -90 and 90']
        },
        longitude: { 
          type: Number, 
          min: [-180, 'Longitude must be between -180 and 180'], 
          max: [180, 'Longitude must be between -180 and 180']
        }
      }
    }
  },

  // ============= PRICING DETAILS =============
  pricing: {
    basePrice: { 
      type: Number, 
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    equipmentCharges: { 
      type: Number, 
      default: 0,
      min: [0, 'Equipment charges cannot be negative']
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    taxPercentage: {
      type: Number,
      required: [true, 'Tax percentage is required'],
      default: 18,
      min: [0, 'Tax percentage cannot be negative'],
      max: [100, 'Tax percentage cannot exceed 100']
    },
    taxes: { 
      type: Number, 
      required: [true, 'Tax amount is required'],
      min: [0, 'Taxes cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    couponCode: {
      type: String,
      trim: true
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
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    }
  },

  // ============= PAYMENT DETAILS =============
  paymentType: { 
    type: String, 
    enum: ['Prepaid', 'Postpaid'], 
    required: [true, 'Payment type is required']
  },
  
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially Refunded'],
    default: 'Pending',
    index: true
  },
  
  paymentId: {
    type: String,
    trim: true
  },
  
  transactionId: {
    type: String,
    trim: true,
    index: true
  },
  
  paymentGateway: {
    type: String,
    enum: ['Razorpay', 'Paytm', 'PhonePe', 'GooglePay', 'Cash', 'UPI', null],
    default: null
  },
  
  paymentDate: Date,

  paymentDetails: {
    orderId: String,
    signature: String,
    method: String, // card, netbanking, upi, wallet
    cardLast4: String,
    upiId: String
  },

  // ============= PARTNER PAYOUT TRACKING =============
  partnerPayout: {
    amount: {
      type: Number,
      min: [0, 'Payout amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['Pending', 'Processed', 'Failed', null],
      default: null
    },
    paidAt: Date,
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'UPI', 'Wallet', null]
    },
    transactionId: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String
    }
  },

  // ============= BOOKING STATUS =============
  status: {
    type: String,
    enum: [
      'Pending',
      'Partner Assigned',
      'Confirmed',
      'Scheduled',
      'Rescheduled',
      'On Going',
      'Completed',
      'Cancelled',
      'Disapproved',
      'No Show'
    ],
    default: 'Pending',
    index: true
  },
  
  subStatus: {
    type: String,
    enum: ['On the Way', 'Reached', 'Service Started', 'Service Completed', 'Not Available', null],
    default: null
  },

  statusTimeline: [{
    status: {
      type: String,
      enum: [
        'Pending',
        'Partner Assigned',
        'Confirmed',
        'Scheduled',
        'On Going',
        'Completed',
        'Cancelled',
        'Disapproved'
      ]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String,
      name: String
    },
    remarks: String
  }],

  // ============= ADMIN WORKFLOW =============
  adminApproval: {
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Disapproved'], 
      default: 'Pending',
      index: true
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    },
    approvedAt: Date,
    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    disapprovalReason: String,
    partnerAssignedBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin'
    },
    partnerAssignedAt: Date
  },

  // ============= PARTNER ACCEPTANCE =============
  partnerAcceptance: {
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', null],
      default: null
    },
    respondedAt: Date,
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    autoAccepted: {
      type: Boolean,
      default: false
    }
  },

  // ============= CANCELLATION DETAILS =============
  cancellation: {
    cancelledBy: { 
      type: String, 
      enum: ['Patient', 'Partner', 'Admin', null],
      default: null
    },
    cancelledAt: Date,
    reason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    cancellationFee: {
      type: Number,
      default: 0,
      min: [0, 'Cancellation fee cannot be negative']
    },
    refundAmount: { 
      type: Number, 
      min: [0, 'Refund amount cannot be negative']
    },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Failed', null],
      default: null
    },
    refundTransactionId: String,
    refundProcessedAt: Date,
    refundMode: {
      type: String,
      enum: ['Original Payment Method', 'Bank Transfer', 'Wallet', null]
    }
  },

  // ============= RESCHEDULING HISTORY =============
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
    rescheduledAt: { 
      type: Date, 
      default: Date.now 
    },
    reason: {
      type: String,
      maxlength: [500, 'Reschedule reason cannot exceed 500 characters']
    },
    oldPartnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ServicePartner' 
    },
    newPartnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ServicePartner' 
    },
    rescheduleFee: {
      type: Number,
      default: 0
    }
  }],

  // ============= SERVICE TRACKING =============
  serviceTracking: {
    startTime: Date,
    endTime: Date,
    actualDuration: Number, // in minutes
    serviceNotes: {
      type: String,
      maxlength: [2000, 'Service notes cannot exceed 2000 characters']
    },
    vitals: {
      bloodPressure: String,
      temperature: String,
      pulse: String,
      oxygenLevel: String,
      weight: String
    },
    medicationsAdministered: [{
      name: String,
      dosage: String,
      time: Date
    }],
    proceduresPerformed: [{
      procedure: String,
      time: Date,
      notes: String
    }]
  },

  // ============= FEEDBACK & RATING =============
  feedback: {
    rating: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    submittedAt: Date,
    
    // Detailed ratings
    serviceQuality: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5']
    },
    timeliness: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5']
    },
    professionalism: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness: { 
      type: Number, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5']
    },
    
    // Feedback flags
    wouldRecommend: {
      type: Boolean,
      default: null
    },
    adminReview: {
      reviewed: {
        type: Boolean,
        default: false
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      reviewedAt: Date,
      isPublic: {
        type: Boolean,
        default: true
      }
    }
  },

  // ============= INVOICE DETAILS =============
  invoice: {
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    invoiceUrl: String,
    generatedAt: Date,
    isGenerated: { 
      type: Boolean, 
      default: false 
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloadedAt: Date
  },

  // ============= PRESCRIPTION & REPORTS =============
  prescription: {
    prescriptionUrl: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    diagnosis: String,
    followUpDate: Date,
    labTests: [{
      testName: String,
      priority: {
        type: String,
        enum: ['Normal', 'Urgent', 'Critical']
      }
    }]
  },

  medicalReports: [{
    reportType: {
      type: String,
      enum: ['Lab Report', 'X-Ray', 'MRI', 'CT Scan', 'Other']
    },
    reportUrl: String,
    uploadedAt: Date,
    uploadedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String
    },
    notes: String
  }],

  // ============= NOTES =============
  partnerNotes: {
    type: String,
    maxlength: [2000, 'Partner notes cannot exceed 2000 characters']
  },
  
  adminNotes: {
    type: String,
    maxlength: [2000, 'Admin notes cannot exceed 2000 characters']
  },

  internalNotes: [{
    note: String,
    addedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String,
      name: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }],

  // ============= NOTIFICATIONS =============
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
        'payment_failed',
        'reminder',
        'status_update',
        'service_started',
        'service_completed',
        'feedback_request',
        'refund_processed'
      ]
    },
    recipient: {
      type: String,
      enum: ['Patient', 'Partner', 'Admin', 'All']
    },
    recipientId: mongoose.Schema.Types.ObjectId,
    message: {
      type: String,
      maxlength: [500, 'Notification message cannot exceed 500 characters']
    },
    sentAt: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ['sent', 'failed', 'read'],
      default: 'sent'
    },
    readAt: Date,
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in-app']
    }
  }],

  // ============= REMINDERS =============
  reminders: [{
    reminderType: {
      type: String,
      enum: ['appointment', 'medication', 'follow-up']
    },
    scheduledAt: Date,
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],

  // ============= COMMUNICATION LOGS =============
  communicationLogs: [{
    type: {
      type: String,
      enum: ['call', 'sms', 'email', 'chat', 'video-call']
    },
    from: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String,
      name: String
    },
    to: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String,
      name: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: Number, // in seconds for calls
    summary: String,
    recordingUrl: String
  }],

  // ============= EMERGENCY CONTACTS =============
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  },

  // ============= METADATA =============
  metadata: {
    bookingSource: {
      type: String,
      enum: ['web', 'mobile-app', 'admin-panel', 'partner-app', 'api'],
      default: 'web'
    },
    deviceInfo: {
      type: String,
      os: String,
      browser: String,
      ipAddress: String
    },
    referralSource: String,
    marketingCampaign: String,
    utmParameters: {
      source: String,
      medium: String,
      campaign: String
    }
  },

  // ============= FLAGS =============
  flags: {
    isUrgent: {
      type: Boolean,
      default: false
    },
    requiresFollowUp: {
      type: Boolean,
      default: false
    },
    isEmergency: {
      type: Boolean,
      default: false
    },
    vipPatient: {
      type: Boolean,
      default: false
    },
    hasComplaint: {
      type: Boolean,
      default: false
    },
    needsReview: {
      type: Boolean,
      default: false
    }
  },

  // ============= SOFT DELETE =============
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  deletedAt: Date,
  
  deletedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    userType: String,
    name: String
  },

  deletionReason: String

}, { 
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: '__v'
});

// ============= PRE-VALIDATION HOOKS =============

bookingSchema.pre('validate', async function(next) {
  try {
    // Generate unique booking ID
    if (!this.bookingId) {
      const count = await mongoose.model('Booking').countDocuments();
      const timestamp = Date.now();
      this.bookingId = `MED${timestamp}${String(count + 1).padStart(4, '0')}`;
    }

    // Validate and calculate duration from slot times
    if (this.slotTime && this.slotTime.startTime && this.slotTime.endTime) {
      const [startHour, startMin] = this.slotTime.startTime.split(':').map(Number);
      const [endHour, endMin] = this.slotTime.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        return next(new Error('End time must be after start time'));
      }

      // Auto-calculate duration if not provided
      if (!this.duration) {
        this.duration = endMinutes - startMinutes;
      }
    }

    // Validate consultation slot timing (9 AM - 7 PM)
    if (this.serviceCategory === 'consultation' && this.slotTime) {
      const [hour] = this.slotTime.startTime.split(':').map(Number);
      if (hour < 9 || hour >= 19) {
        return next(new Error('Consultation slots must be between 09:00 and 19:00'));
      }
    }

    // Validate nursing service duration based on shift type
    if (this.serviceCategory === 'nursing' && this.shiftType) {
      const shiftDurations = {
        'hourly': { min: 60, max: 480 },
        '8-hour': { min: 480, max: 480 },
        '12-hour': { min: 720, max: 720 },
        '24-hour': { min: 1440, max: 1440 },
        'day-shift': { min: 720, max: 720 },
        'night-shift': { min: 720, max: 720 }
      };

      const shiftConfig = shiftDurations[this.shiftType];
      if (shiftConfig && (this.duration < shiftConfig.min || this.duration > shiftConfig.max)) {
        return next(new Error(`Duration must be ${shiftConfig.min} minutes for ${this.shiftType} shift`));
      }
    }

    // Calculate commission and revenue split (70-30)
    if (this.pricing && this.pricing.totalAmount && this.servicePartnerId) {
      const commissionRate = 0.30; // Medico takes 30%
      this.pricing.partnerCommission = Math.round(this.pricing.totalAmount * (1 - commissionRate));
      this.pricing.medicoRevenue = Math.round(this.pricing.totalAmount * commissionRate);
    }

    // Generate invoice number if invoice is being created
    if (this.invoice.isGenerated && !this.invoice.invoiceNumber) {
      const invoiceCount = await mongoose.model('Booking').countDocuments({ 
        'invoice.isGenerated': true 
      });
      this.invoice.invoiceNumber = `INV${Date.now()}${String(invoiceCount + 1).padStart(5, '0')}`;
      this.invoice.generatedAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============= PRE-SAVE HOOKS =============

// Check for slot conflicts before saving
bookingSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('appointmentDate') || this.isModified('slotTime') || this.isModified('servicePartnerId')) {
      
      // Check partner availability
      if (this.servicePartnerId) {
        const overlap = await mongoose.model('Booking').findOne({
          _id: { $ne: this._id },
          servicePartnerId: this.servicePartnerId,
          appointmentDate: {
            $gte: new Date(this.appointmentDate).setHours(0, 0, 0, 0),
            $lt: new Date(this.appointmentDate).setHours(23, 59, 59, 999)
          },
          status: { $nin: ['Cancelled', 'Disapproved'] },
          isDeleted: false,
          $or: [
            {
              'slotTime.startTime': { $lt: this.slotTime.endTime },
              'slotTime.endTime': { $gt: this.slotTime.startTime }
            }
          ]
        });
        
        if (overlap) {
          return next(new Error('Service partner already has a booking in this time slot'));
        }
      }

      // Check doctor availability if specified
      if (this.doctorId) {
        const doctorOverlap = await mongoose.model('Booking').findOne({
          _id: { $ne: this._id },
          doctorId: this.doctorId,
          appointmentDate: {
            $gte: new Date(this.appointmentDate).setHours(0, 0, 0, 0),
            $lt: new Date(this.appointmentDate).setHours(23, 59, 59, 999)
          },
          status: { $nin: ['Cancelled', 'Disapproved'] },
          isDeleted: false,
          $or: [
            {
              'slotTime.startTime': { $lt: this.slotTime.endTime },
              'slotTime.endTime': { $gt: this.slotTime.startTime }
            }
          ]
        });
        
        if (doctorOverlap) {
          return next(new Error('Doctor already has a booking in this time slot'));
        }
      }
    }

    // Add status to timeline when status changes
    if (this.isModified('status')) {
      this.statusTimeline.push({
        status: this.status,
        timestamp: new Date()
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Soft delete pre-hook
bookingSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============= INSTANCE METHODS =============

// Check if admin can assign partner
bookingSchema.methods.canAssignPartner = function() {
  return this.adminApproval.status === 'Approved' && !this.servicePartnerId;
};

// Check if booking can be cancelled
bookingSchema.methods.canCancel = function() {
  return ['Pending', 'Partner Assigned', 'Confirmed', 'Scheduled'].includes(this.status);
};

// Check if booking can be rescheduled
bookingSchema.methods.canReschedule = function() {
  return ['Scheduled', 'Partner Assigned', 'Confirmed'].includes(this.status);
};

// Format time for 12-hour display
bookingSchema.methods.formatTimeFor12Hour = function() {
  const convert = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
  };

  return {
    startTime: convert(this.slotTime.startTime),
    endTime: convert(this.slotTime.endTime)
  };
};

// Calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  const now = new Date();
  const appointmentTime = new Date(this.appointmentDate);
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (hoursUntilAppointment >= 24) {
    refundPercentage = 100; // Full refund
  } else if (hoursUntilAppointment >= 12) {
    refundPercentage = 75; // 75% refund
  } else if (hoursUntilAppointment >= 6) {
    refundPercentage = 50; // 50% refund
  } else {
    refundPercentage = 0; // No refund
  }

  const cancellationFee = this.pricing.totalAmount * ((100 - refundPercentage) / 100);
  const refundAmount = this.pricing.totalAmount - cancellationFee;

  return {
    refundAmount,
    cancellationFee,
    refundPercentage
  };
};

// Mark service as started
bookingSchema.methods.startService = async function() {
  this.status = 'On Going';
  this.subStatus = 'Service Started';
  this.serviceTracking.startTime = new Date();
  await this.save();
};

// Mark service as completed
bookingSchema.methods.completeService = async function() {
  this.status = 'Completed';
  this.subStatus = 'Service Completed';
  this.serviceTracking.endTime = new Date();
  
  if (this.serviceTracking.startTime) {
    const duration = (this.serviceTracking.endTime - this.serviceTracking.startTime) / (1000 * 60);
    this.serviceTracking.actualDuration = Math.round(duration);
  }
  
  await this.save();
};

// ============= STATIC METHODS =============

// Get pending bookings for admin approval
bookingSchema.statics.getPendingAssignments = function() {
  return this.find({
    'adminApproval.status': 'Approved',
    servicePartnerId: null,
    status: 'Pending',
    isDeleted: false
  })
  .populate('patientId', 'name email phone')
  .populate('doctorId', 'name specialization')
  .populate('serviceId', 'name serviceType basePrice category')
  .sort({ createdAt: 1 });
};

// Get partner bookings
bookingSchema.statics.getPartnerBookings = function(partnerId, status = null, startDate = null, endDate = null) {
  const query = { 
    servicePartnerId: partnerId,
    isDeleted: false
  };
  
  if (status) query.status = status;
  
  if (startDate && endDate) {
    query.appointmentDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name specialization')
    .populate('serviceId', 'name serviceType basePrice')
    .sort({ appointmentDate: 1, 'slotTime.startTime': 1 });
};

// Get doctor bookings
bookingSchema.statics.getDoctorBookings = function(doctorId, status = null) {
  const query = { 
    doctorId,
    isDeleted: false
  };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('patientId', 'name email phone')
    .populate('servicePartnerId', 'name email phone')
    .populate('serviceId', 'name serviceType basePrice')
    .sort({ appointmentDate: 1, 'slotTime.startTime': 1 });
};

// Get patient bookings
bookingSchema.statics.getPatientBookings = function(patientId, status = null) {
  const query = { 
    patientId,
    isDeleted: false
  };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('serviceId', 'name serviceType basePrice')
    .populate('doctorId', 'name specialization')
    .populate('servicePartnerId', 'name email phone')
    .sort({ appointmentDate: -1 });
};

// Revenue report
bookingSchema.statics.getRevenueReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        paymentStatus: 'Completed',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.totalAmount' },
        medicoRevenue: { $sum: '$pricing.medicoRevenue' },
        partnerCommissions: { $sum: '$pricing.partnerCommission' },
        totalBookings: { $sum: 1 },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        totalRefunds: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Refunded'] }, '$cancellation.refundAmount', 0]
          }
        }
      }
    }
  ]);
};

// Get bookings by date range
bookingSchema.statics.getBookingsByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    appointmentDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isDeleted: false,
    ...filters
  };

  return this.find(query)
    .populate('patientId', 'name email phone')
    .populate('serviceId', 'name serviceType basePrice')
    .populate('servicePartnerId', 'name email phone')
    .populate('doctorId', 'name specialization')
    .sort({ appointmentDate: 1, 'slotTime.startTime': 1 });
};

// Get upcoming bookings (for reminders)
bookingSchema.statics.getUpcomingBookings = function(hours = 24) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));

  return this.find({
    appointmentDate: {
      $gte: now,
      $lte: futureTime
    },
    status: { $in: ['Scheduled', 'Partner Assigned', 'Confirmed'] },
    isDeleted: false
  })
  .populate('patientId', 'name email phone')
  .populate('servicePartnerId', 'name email phone');
};

// Analytics: Service category breakdown
bookingSchema.statics.getServiceCategoryAnalytics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'Completed',
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$serviceCategory',
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageRating: { $avg: '$feedback.rating' }
      }
    },
    {
      $sort: { totalBookings: -1 }
    }
  ]);
};

// ============= INDEXES =============

bookingSchema.index({ patientId: 1, status: 1 });
bookingSchema.index({ doctorId: 1, appointmentDate: 1 });
bookingSchema.index({ serviceId: 1, serviceCategory: 1 });
bookingSchema.index({ servicePartnerId: 1, appointmentDate: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'adminApproval.status': 1 });
bookingSchema.index({ status: 1, appointmentDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ serviceType: 1, serviceMode: 1 });
bookingSchema.index({ paymentStatus: 1, paymentType: 1 });
bookingSchema.index({ 'partnerPayout.status': 1 });
bookingSchema.index({ isDeleted: 1 });
bookingSchema.index({ transactionId: 1 });
bookingSchema.index({ 'invoice.invoiceNumber': 1 });

// Compound indexes for complex queries
bookingSchema.index({ 
  patientId: 1, 
  appointmentDate: -1, 
  status: 1 
});

bookingSchema.index({ 
  serviceCategory: 1, 
  status: 1, 
  createdAt: -1 
});

// Unique slot constraint for partner
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
      servicePartnerId: { $ne: null },
      isDeleted: false
    }
  }
);

// Unique slot constraint for doctor
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
      doctorId: { $ne: null },
      isDeleted: false
    }
  }
);

// Text search index
bookingSchema.index({ 
  bookingId: 'text', 
  partnerNotes: 'text', 
  adminNotes: 'text',
  'serviceTracking.serviceNotes': 'text'
});

// Geospatial index for location-based queries
bookingSchema.index({ 
  'location.address.coordinates': '2dsphere' 
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

bookingSchema.virtual('isConsultationService').get(function() {
  return this.serviceCategory === 'consultation';
});

bookingSchema.virtual('isNursingService').get(function() {
  return this.serviceCategory === 'nursing';
});

bookingSchema.virtual('isEquipmentService').get(function() {
  return this.serviceCategory === 'equipment';
});

bookingSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === 'Completed';
});

bookingSchema.virtual('isUpcoming').get(function() {
  return this.appointmentDate > new Date() && this.status !== 'Cancelled';
});

bookingSchema.virtual('isPast').get(function() {
  return this.appointmentDate < new Date();
});

bookingSchema.virtual('canBeRated').get(function() {
  return this.status === 'Completed' && !this.feedback.rating;
});

// Virtual populate for related documents
bookingSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('servicePartner', {
  ref: 'ServicePartner',
  localField: 'servicePartnerId',
  foreignField: '_id',
  justOne: true
});

// Enable virtuals in JSON and Object outputs
bookingSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

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
