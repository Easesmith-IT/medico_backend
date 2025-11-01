const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
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
  // password: {
  //   type: String,
  //   required: [true, 'Please provide a password'],
  //   minlength: 8,
  //   select: false
  // },


  password: {
  type: String,
  required: false,  // Change from true to false
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
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  // Professional Details
  medicalRegistrationNumber: {
    type: String,
    required: [true, 'Please provide medical registration number'],
    unique: true
  },
  issuingMedicalCouncil: {
    type: String,
    required: [true, 'Please provide issuing medical council']
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  specialization: {
    type: String,
    required: [true, 'Please provide your specialization']
  },
  subSpecialties: [String],
  currentWorkplace: String,
  designation: String,
  professionalBio: {
    type: String,
    maxlength: 500
  },
  consultationFees: {
    type: Number,
    default: 0
  },

  // Educational Qualifications
  degrees: [String],
  university: String,
  graduationYear: Number,
  certifications: [String],
  residencies: [String],
  trainingsWorkshops: [String],

  // Verification Documents
  verificationDocuments: {
    identityProof: String,
    degreesCertificates: [String],
    medicalCouncilRegistration: String
  },

  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  rejectionReason: String,

  // Clinic Details
  clinics: [{
    clinicName: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    contactInfo: {
      phone: String,
      email: String
    },
    operatingHours: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      slots: [{
        startTime: String,
        endTime: String
      }]
    }],
    images: [String],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    servicesOffered: [String],
    paymentMethods: [String]
  }],

  // Availability
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timeSlots: [{
      start: String,
      end: String
    }]
  },

  // Authentication
  role: {
    type: String,
    default: 'doctor'
  },
  tokenVersion: {
    type: Number,
    default: 0,
    select: false
  },
    isPhoneVerified: {
    type: Boolean,
    default: false
  },
  // Authentication Tokens
  refreshToken: {
    type: String,
    default: null,
    select: false
  },

  // Ratings & Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },

  // Social Features
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  followersCount: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
// doctorSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });
// Hash password before saving
doctorSchema.pre('save', async function(next) {
  // Only hash if password is modified AND exists
  if (!this.isModified('password') || !this.password) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


// Update timestamp
doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
doctorSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
