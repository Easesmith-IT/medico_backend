// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const adminSchema = new mongoose.Schema({
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
//     unique: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Please provide a password'],
//     minlength: 8,
//     select: false
//   },
//   role: {
//     type: String,
//     default: 'admin'
//   },
//     isVerified: {
//     type: Boolean,
//     default: false,
//     select: false  //  CRITICAL: Must have select: false
//   },
//   tokenVersion: {
//     type: Number,
//     default: 0,
//     select: false
//   },
//   permissions: [{
//     type: String,
//     enum: ['user_management', 'doctor_verification', 'content_moderation', 'payment_management', 'system_admin']
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });



// // Update timestamp
// adminSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Compare password method
// adminSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

// const Admin = mongoose.model('Admin', adminSchema);

// module.exports = Admin;
// models/adminModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
    trim: true
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
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
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // ⭐ CRITICAL: Password is not selected by default
  },
  role: {
    type: String,
    enum: ['superAdmin', 'subAdmin'],
    default: 'superAdmin',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: true, // ⭐ Set to true by default (no OTP needed)
    select: false // ⭐ CRITICAL: Not selected by default, use .select('+isVerified')
  },
  isActive: {
    type: Boolean,
    default: true // Admin is active by default
  },
  tokenVersion: {
    type: Number,
    default: 0,
    select: false // ⭐ CRITICAL: Not selected by default, use .select('+tokenVersion')
  },
  permissions: [{
    type: String,
    enum: ['user_management', 'doctor_verification', 'content_moderation', 'payment_management', 'system_admin']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  refreshToken: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ⭐ NO PRE-SAVE HOOKS FOR PASSWORD
// Password is hashed ONLY in controller to prevent double hashing

// Update timestamp on save
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method (optional - for future use)
adminSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
