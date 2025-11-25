// //original one
// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({

//   // Service name
//   name: { 
//     type: String, 
//     required: true,
//     // enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
//   },

//   // Description
//   description: { 
//     type: String, 
//     required: true 
//   },

//   // Pricing
//   basePrice: { 
//     type: Number, 
//     required: true 
//   },
//   equipmentCharges: { 
//     type: Number, 
//     default: 0 
//   },
//   taxPercentage: { 
//     type: Number, 
//     required: true, 
//     default: 18 
//   },

//   // Modes (Home/Clinic)
//   modes: [{
//     type: String,
//     enum: ['Home Service', 'Visit Provider Location']
//   }],

//   // Duration options
//   supportsDuration: { 
//     type: Boolean, 
//     default: false 
//   },
//   defaultDuration: { 
//     type: Number, 
//     default: 30 
//   },
//   durationOptions: [Number],

//   // Available Cities
//   cities: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'City',
//     required: true
//   }],

//   // Creator Details (Admin / Doctor)
//   createdBy: {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       refPath: 'createdBy.userModel',
//       required: true
//     },
//     userModel: {
//       type: String,
//       enum: ['Admin', 'Doctor'],
//       required: true
//     },
//     name: {
//       type: String,
//       required: true
//     },
//     email: {
//       type: String,
//       required: true
//     }
//   },

//   // Payment Mode
//   paymentMode: {
//     type: String,
//     enum: ['Prepaid', 'Postpaid', 'Both'],
//     default: 'Both'
//   },

//   // Active/Inactive
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },

//   // Media
//   icon: String,
//   image: String,

// }, { timestamps: true });

// // Indexes for faster queries
// serviceSchema.index({ name: 1 });
// serviceSchema.index({ cities: 1 });
// serviceSchema.index({ isActive: 1 });

// module.exports = mongoose.model('Service', serviceSchema);



const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    // Service name
    name: {
      type: String,
      required: true,
      // enum: [
      //   'Doctor Visit',
      //   'Nursing', // Can be 24-hour or consultation-based
      //   'Physiotherapy',
      //   'Attendant Care',
      //   'Ventilator',
      //   'Oxygen Therapy'
      // ]
    },

    // Service category for slot generation logic
    category: {
      type: String,
      enum: ["consultation", "nursing", "equipment"], // Added 'nursing' as separate category
      required: true,
    },

    // Sub-category for nursing services
    nursingType: {
      type: String,
      enum: ["hourly", "full-day", "full-night", "12-hour", "24-hour", null],
      default: null,
      validate: {
        validator: function (value) {
          // Only validate if category is 'nursing'
          if (this.category === "nursing") {
            return value !== null;
          }
          return true;
        },
        message: "Nursing type is required for nursing services",
      },
    },

    // Description
    description: {
      type: String,
      required: true,
    },

    timeFormat: {
      type: String,
    },

    // Pricing
    basePrice: {
      type: Number,
      required: true,
      min: [0, "Base price cannot be negative"],
    },
    equipmentCharges: {
      type: Number,
      default: 0,
      min: [0, "Equipment charges cannot be negative"],
    },
    taxPercentage: {
      type: Number,
      required: true,
      default: 18,
      min: [0, "Tax percentage cannot be negative"],
      max: [100, "Tax percentage cannot exceed 100"],
    },

    // Modes (Home/Clinic)
    modes: [
      {
        type: String,
        enum: ["Home Service", "Visit Provider Location"],
        required: true,
      },
    ],

    // Slot Configuration
    slotConfig: {
      // For consultation services (30-minute slots, 9 AM - 7 PM)
      consultationSlots: {
        enabled: { type: Boolean, default: true },
        startTime: {
          type: String,
          default: "09:00",
          validate: {
            validator: function (v) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format",
          },
        },
        endTime: {
          type: String,
          default: "19:00",
          validate: {
            validator: function (v) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Invalid time format",
          },
        },
        slotDuration: {
          type: Number,
          default: 30, // minutes
          enum: [15, 30, 45, 60],
        },
      },

      // For nursing services (flexible: hourly, 12-hour, 24-hour)
      nursingSlots: {
        enabled: { type: Boolean, default: false },
        shiftTypes: [
          {
            type: String,
            enum: [
              "hourly",
              "8-hour",
              "12-hour",
              "24-hour",
              "day-shift",
              "night-shift",
            ],
          },
        ],
        minDuration: { type: Number, default: 60 }, // minimum 1 hour
        maxDuration: { type: Number, default: 1440 }, // maximum 24 hours
        available24x7: { type: Boolean, default: true },
        allowCustomDuration: { type: Boolean, default: true },
      },

      // For equipment services (24-hour format, flexible duration)
      equipmentBooking: {
        enabled: { type: Boolean, default: false },
        minDuration: { type: Number, default: 60 }, // minimum 1 hour
        maxDuration: { type: Number, default: 720 }, // maximum 12 hours
        available24x7: { type: Boolean, default: true },
      },
    },

    // Duration options
    supportsDuration: {
      type: Boolean,
      default: false,
    },
    defaultDuration: {
      type: Number,
      default: 30,
    },
    durationOptions: [
      {
        type: Number,
        validate: {
          validator: function (v) {
            return v > 0 && v <= 1440;
          },
          message: "Duration must be between 1 and 1440 minutes (24 hours)",
        },
      },
    ],

    // Available Cities
    cities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true,
      },
    ],

    // Creator Details (Admin / Doctor)
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.userModel",
        required: true,
      },
      userModel: {
        type: String,
        enum: ["Admin", "SuperAdmin"],
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    },

    // Payment Mode
    paymentMode: {
      type: String,
      enum: ["Prepaid", "Postpaid", "Both"],
      default: "Both",
    },

    // Active/Inactive
    isActive: {
      type: Boolean,
      default: true,
    },

    // Media
    icon: String,
    image: String,

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userModel: String,
    },
  },
  { timestamps: true }
);

// ============= INDEXES =============
serviceSchema.index({ name: 1, isActive: 1 });
serviceSchema.index({ cities: 1, isActive: 1 });
serviceSchema.index({ isActive: 1, isDeleted: 1 });
serviceSchema.index({ 'createdBy.userId': 1 });
serviceSchema.index({ category: 1, nursingType: 1 });

// ============= PRE HOOKS =============
serviceSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ============= STATIC METHODS =============

// Generate 30-minute slots for consultation services (9 AM - 7 PM)
serviceSchema.statics.generateConsultationSlots = function(date, existingBookings = []) {
  const slots = [];
  const startHour = 9;
  const endHour = 19;
  const slotDuration = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      const totalMinutes = hour * 60 + minute + slotDuration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const isBooked = existingBookings.some(booking => {
        const bookingDate = new Date(booking.appointmentDate);
        const queryDate = new Date(date);
        
        return bookingDate.toDateString() === queryDate.toDateString() &&
               booking.slotTime.startTime === startTime &&
               booking.status !== 'Cancelled' &&
               booking.status !== 'Disapproved';
      });

      slots.push({
        startTime,
        endTime,
        duration: slotDuration,
        isAvailable: !isBooked,
        slot: `${startTime} - ${endTime}`
      });
    }
  }

  return slots;
};

// Get available slots for specific service and date
serviceSchema.statics.getAvailableSlots = async function(serviceId, date, partnerId = null) {
  const service = await this.findById(serviceId);
  if (!service) throw new Error('Service not found');

  const Booking = mongoose.model('Booking');
  
  const query = {
    serviceId,
    appointmentDate: {
      $gte: new Date(date).setHours(0, 0, 0, 0),
      $lt: new Date(date).setHours(23, 59, 59, 999)
    },
    status: { $nin: ['Cancelled', 'Disapproved'] }
  };

  if (partnerId) {
    query.servicePartnerId = partnerId;
  }

  const existingBookings = await Booking.find(query);

  // For consultation services - generate 30-minute slots
  if (service.category === 'consultation' && service.slotConfig.consultationSlots.enabled) {
    return this.generateConsultationSlots(date, existingBookings);
  }

  // For nursing services - return shift-based availability
  if (service.category === 'nursing' && service.slotConfig.nursingSlots.enabled) {
    return {
      type: 'nursing',
      available24x7: service.slotConfig.nursingSlots.available24x7,
      shiftTypes: service.slotConfig.nursingSlots.shiftTypes,
      minDuration: service.slotConfig.nursingSlots.minDuration,
      maxDuration: service.slotConfig.nursingSlots.maxDuration,
      allowCustomDuration: service.slotConfig.nursingSlots.allowCustomDuration,
      nursingType: service.nursingType,
      bookedSlots: existingBookings.map(b => ({
        startTime: b.slotTime.startTime,
        endTime: b.slotTime.endTime,
        duration: b.duration,
        shiftType: b.shiftType
      }))
    };
  }

  // For equipment services - return 24-hour availability
  if (service.category === 'equipment' && service.slotConfig.equipmentBooking.enabled) {
    return {
      type: 'equipment',
      available24x7: true,
      minDuration: service.slotConfig.equipmentBooking.minDuration,
      maxDuration: service.slotConfig.equipmentBooking.maxDuration,
      bookedSlots: existingBookings.map(b => ({
        startTime: b.slotTime.startTime,
        endTime: b.slotTime.endTime,
        duration: b.duration
      }))
    };
  }

  return [];
};

// Calculate total price with nursing-specific pricing
serviceSchema.methods.calculateTotalPrice = function(duration = null, includeEquipment = false, shiftType = null) {
  let baseAmount = this.basePrice;
  
  // For nursing services with shift-based pricing
  if (this.category === 'nursing' && shiftType) {
    const shiftMultipliers = {
      'hourly': 1,
      '8-hour': 7, // 7 hours worth (1 hour break included)
      '12-hour': 11, // 11 hours worth
      '24-hour': 22, // 22 hours worth (2 hours break)
      'day-shift': 11,
      'night-shift': 11
    };
    
    baseAmount = this.basePrice * (shiftMultipliers[shiftType] || 1);
  } else if (duration && this.supportsDuration) {
    // For hourly calculation
    const hours = Math.ceil(duration / 60);
    baseAmount = this.basePrice * hours;
  }

  const equipment = includeEquipment ? this.equipmentCharges : 0;
  const subtotal = baseAmount + equipment;
  const taxAmount = (subtotal * this.taxPercentage) / 100;
  const total = subtotal + taxAmount;

  return {
    basePrice: baseAmount,
    equipmentCharges: equipment,
    subtotal,
    taxPercentage: this.taxPercentage,
    taxAmount,
    totalAmount: total
  };
};


// Add this before module.exports
serviceSchema.methods.formatDuration = function(minutes) {
  if (minutes === 60) return 'hourly';
  if (minutes === 720) return '12-hour';
  if (minutes === 1440) return '24-hour';
  return `${minutes} minutes`;
};

// Add a method to get formatted duration options
serviceSchema.methods.getFormattedDurationOptions = function() {
  return this.durationOptions.map(minutes => this.formatDuration(minutes));
};


module.exports = mongoose.model('Service', serviceSchema);








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
//     cities: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'City',
//     required: true
//   }],
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



// models/Service.js //with creator
// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//   // Service name (fixed enum)
//   name: { 
//     type: String, 
//     required: true,
//     enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
//   },
  
//   // Service description
//   description: { 
//     type: String, 
//     required: true 
//   },
  
//   // Admin-managed pricing
//   basePrice: { 
//     type: Number, 
//     required: true 
//   },
//   equipmentCharges: { 
//     type: Number, 
//     default: 0 
//   },
//   taxPercentage: { 
//     type: Number, 
//     required: true, 
//     default: 18 
//   },
  
//   // Service modes (where service can be provided)
//   modes: [{
//     type: String,
//     enum: ['Home Service', 'Visit Provider Location']
//   }],
  
//   // Duration support (for time-based services)
//   supportsDuration: { 
//     type: Boolean, 
//     default: false 
//   },
//   defaultDuration: { 
//     type: Number, 
//     default: 30 
//   }, // minutes
//   durationOptions: [Number], // [30, 60, 90, 120]
  
//   // Payment configuration (Admin-configurable)
//   paymentMode: {
//     type: String,
//     enum: ['Prepaid', 'Postpaid', 'Both'],
//     default: 'Both'
//   },
  
//   // Cities where service is available
//   cities: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'City',
//     required: true
//   }],
  
//   // Creator tracking (Admin or Doctor)
//   createdBy: {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       refPath: 'createdBy.userModel',
//       required: true
//     },
//     userModel: {
//       type: String,
//       enum: ['Admin', 'Doctor'],
//       required: true
//     },
//     name: {
//       type: String,
//       required: true
//     },
//     email: {
//       type: String,
//       required: true
//     }
//   },
  
//   // Service status
//   isActive: { 
//     type: Boolean, 
//     default: true 
//   },
  
//   // Media assets
//   icon: String,
//   image: String
  
// }, { 
//   timestamps: true // Automatically adds createdAt and updatedAt
// });

// // Index for better query performance
// serviceSchema.index({ name: 1 });
// serviceSchema.index({ cities: 1 });
// serviceSchema.index({ isActive: 1 });

// module.exports = mongoose.model('Service', serviceSchema);
