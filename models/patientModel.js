// // models/patientModel.js

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const patientSchema = new mongoose.Schema({
//   // Personal Information
//   firstName: {
//     type: String,
//     required: [true, 'Please provide your name'],
//     trim: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Please provide your email'],
//     unique: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
//   },
//   phone: {
//     type: String,
//     required: [true, 'Please provide your phone number'],
//     unique: true,
//     match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
//   },
//   password: {
//     type: String,
//     required: [true, 'Please provide a password'],
//     minlength: 8,
//     select: false
//   },
//   profilePhoto: {
//     type: String,
//     default: null
//   },
//   dateOfBirth: {
//     type: Date
//   },
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other'],
//     default: null
//   },
//   address: {
//     street: String,
//     city: String,
//       cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
//     state: String,
//     country: String,
//     pincode: String
//   },

//   // Medical Information
//   bloodGroup: {
//     type: String,
//     enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
//     default: null
//   },
//   // medicalHistory: [{
//   //   condition: String,
//   //   diagnosedDate: Date,
//   //   notes: String,
//   //   addedAt: {
//   //     type: Date,
//   //     default: Date.now
//   //   }
//   // }],
  
//   allergies: [String],
//   currentMedications: [String],

//   // Emergency Contact
//   emergencyContact: {
//     name: String,
//     phone: String,
//     relation: String
//   },

//   // Authentication & Verification (✅ CRITICAL FIELDS)
//   role: {
//     type: String,
//     default: 'patient'
//   },
  
//   // ✅ Verification Status - Must be explicit
//   isVerified: {
//     type: Boolean,
//     default: false,
//     index: true  // Add index for faster queries
//   },
  
//   // ✅ Account Status
//   isActive: {
//     type: Boolean,
//     default: false  // Only true after OTP verification
//   },

//   // ✅ OTP for Signup Verification
//   signupOtp: {
//     type: String,
//     select: false
//   },
//   signupOtpExpiry: {
//     type: Date,
//     select: false
//   },

//   // ✅ OTP for Login
//   loginOtp: {
//     type: String,
//     select: false
//   },
//   loginOtpExpiry: {
//     type: Date,
//     select: false
//   },

//   // Token Management
//   tokenVersion: {
//     type: Number,
//     default: 0,
//     select: false
//   },

//   refreshToken: {
//     type: String,
//     select: false
//   },

//   // Social Features
//   following: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Doctor'
//   }],
//   followingCount: {
//     type: Number,
//     default: 0
//   },
//   savedPosts: [{
//     postId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Post'
//     },
//     savedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],

//   // Timestamps
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Hash password before saving (only if modified)
// patientSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();

//   try {
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Update timestamp
// patientSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Compare password method
// patientSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

// // Indexes for better query performance
// patientSchema.index({ phone: 1 });
// patientSchema.index({ email: 1 });
// patientSchema.index({ isVerified: 1, isActive: 1 });

// const Patient = mongoose.model('Patient', patientSchema);

// module.exports = Patient;


// models/patientModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  profilePhoto: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  address: {
    street: String,
    city: String,
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    state: String,
    country: String,
    pincode: String
  },

  // Medical Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  
  // Enhanced Medical History
  medicalHistory: [{
    condition: { type: String, required: true },
    diagnosedDate: { type: Date },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    status: { type: String, enum: ['active', 'managed', 'remission', 'chronic'] },
    notes: String,
    addedBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    addedAt: { type: Date, default: Date.now }
  }],

  // FIXED: Comprehensive Medication History with proper nested refPath
  medicationHistory: [{
    medicationName: { type: String, required: true },
    dosage: String,
    frequency: { type: String, enum: ['daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'] },
    startDate: { type: Date, required: true },
    endDate: Date,
    duration: String,
    purpose: String,
    prescribedBy: {
      doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Doctor'  // ✅ Now properly referenced for population
      },
      doctorName: String,
      datePrescribed: Date
    },
    status: { type: String, enum: ['active', 'completed', 'discontinued', 'paused'], default: 'active' },
    sideEffects: String,
    notes: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // FIXED: Treatment Progress with proper ref paths
  treatmentProgress: [{
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Doctor'  // ✅ Direct ref for easy population
    },
    visitDate: Date,
    diagnosis: String,
    recommendations: String,
    nextVisitDate: Date,
    progressNotes: String,
    vitals: {
      bloodPressure: String,
      pulse: Number,
      temperature: Number,
      weight: Number,
      bloodSugar: Number
    },
    labResults: String,
    updatedAt: { type: Date, default: Date.now }
  }],

  // Allergies and Current Medications
  allergies: [String],
  currentMedications: [String],

  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  // Authentication & Verification
  role: {
    type: String,
    default: 'patient'
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  fcmToken: {
    type: String,
    default: null
  },

  // OTP Fields
  signupOtp: {
    type: String,
    select: false
  },
  signupOtpExpiry: {
    type: Date,
    select: false
  },
  loginOtp: {
    type: String,
    select: false
  },
  loginOtpExpiry: {
    type: Date,
    select: false
  },

  // Token Management
  tokenVersion: {
    type: Number,
    default: 0,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  },

  // Social Features
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  followingCount: {
    type: Number,
    default: 0
  },
  savedPosts: [{
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Add to patientSchema.treatmentProgress[].vitals (or as separate field)
mediaFiles: [{
  url: String,
  type: { type: String, enum: ['image', 'video'] },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: String  // doctor/patient name
}],
fcmToken: {
  type: String,
  default: null
},
fcmProject: {
  type: String,
  enum: ['doctor', 'patient', null],
  default: null
},

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // ✅ Enable strictPopulate to handle nested paths safely
  strictPopulate: false
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp before saving
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better query performance
patientSchema.index({ phone: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ isVerified: 1, isActive: 1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

