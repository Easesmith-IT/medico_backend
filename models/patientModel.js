const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  // Personal Information
  name: {
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
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  // Medical Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  allergies: [String],
  currentMedications: [String],

  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  // Authentication
  role: {
    type: String,
    default: 'patient'
  },
  tokenVersion: {
    type: Number,
    default: 0,
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
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update timestamp
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
patientSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
