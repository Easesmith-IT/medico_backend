// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const doctorSchema = new mongoose.Schema({
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
//   // password: {
//   //   type: String,
//   //   required: [true, 'Please provide a password'],
//   //   minlength: 8,
//   //   select: false
//   // },


//   password: {
//   type: String,
//   required: false,  // Change from true to false
//   select: false
// },

//   profilePhoto: {
//     type: String,
//     default: null
//   },
//   dateOfBirth: {
//     type: Date
//   },
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other']
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: String,
//     pincode: String
//   },
//     cities: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'City',
//       default: [] // Initialize as empty array
//     }
//   ],

//   // Professional Details
//   medicalRegistrationNumber: {
//     type: String,
//     required: [true, 'Please provide medical registration number'],
//     unique: true
//   },
//   issuingMedicalCouncil: {
//     type: String,
//     required: [true, 'Please provide issuing medical council']
//   },
//   yearsOfExperience: {
//     type: Number,
//     default: 0
//   },
//   specialization: {
//     type: String,
//     required: [true, 'Please provide your specialization']
//   },
//   subSpecialties: [String],
//   currentWorkplace: String,
//   designation: String,
//   professionalBio: {
//     type: String,
//     maxlength: 500
//   },
//   consultationFees: {
//     type: Number,
//     default: 0
//   },

//   // Educational Qualifications
//   degrees: [String],
//   university: String,
//   graduationYear: Number,
//   certifications: [String],
//   residencies: [String],
//   trainingsWorkshops: [String],

//   // Verification Documents
//   verificationDocuments: {
//     identityProof: String,
//     degreesCertificates: [String],
//     medicalCouncilRegistration: String
//   },

//   // Verification Status
//   verificationStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   verifiedAt: Date,
//   rejectionReason: String,

//   // Clinic Details
//   clinics: [{
//     clinicName: String,
//     address: {
//       street: String,
//       city: String,
//       state: String,
//       pincode: String
//     },
//     contactInfo: {
//       phone: String,
//       email: String
//     },
//     operatingHours: [{
//       day: {
//         type: String,
//         enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
//       },
//       slots: [{
//         startTime: String,
//         endTime: String
//       }]
//     }],
//     images: [String],
//     location: {
//       type: {
//         type: String,
//         enum: ['Point'],
//         default: 'Point'
//       },
//       coordinates: {
//         type: [Number], // [longitude, latitude]
//         index: '2dsphere'
//       }
//     },
//     servicesOffered: [String],
//     paymentMethods: [String]
//   }],

//   // Availability
//   availability: {
//     days: [{
//       type: String,
//       enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
//     }],
//     timeSlots: [{
//       start: String,
//       end: String
//     }]
//   },

//   // Authentication
//   role: {
//     type: String,
//     default: 'doctor'
//   },
//   tokenVersion: {
//     type: Number,
//     default: 0,
//     select: false
//   },
//     isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },
//   // Authentication Tokens
//   refreshToken: {
//     type: String,
//     default: null,
//     select: false
//   },

//   // Ratings & Reviews
//   averageRating: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 5
//   },
//   totalReviews: {
//     type: Number,
//     default: 0
//   },

//   // Social Features
//   followers: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Patient'
//   }],
//   followersCount: {
//     type: Number,
//     default: 0
//   },

//   // Status
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

// // Hash password before saving
// // doctorSchema.pre('save', async function(next) {
// //   if (!this.isModified('password')) return next();
  
// //   this.password = await bcrypt.hash(this.password, 12);
// //   next();
// // });
// // Hash password before saving
// doctorSchema.pre('save', async function(next) {
//   // Only hash if password is modified AND exists
//   if (!this.isModified('password') || !this.password) return next();
  
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });


// // Update timestamp
// doctorSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Compare password method
// doctorSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

// const Doctor = mongoose.model('Doctor', doctorSchema);

// module.exports = Doctor;



// //with slot booking 
// // models/Doctor.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const doctorSchema = new mongoose.Schema({
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
//     required: false,
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
//     enum: ['male', 'female', 'other']
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     country: String,
//     pincode: String
//   },
//   cities: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'City',
//       default: []
//     }
//   ],

//   // Professional Details
//   medicalRegistrationNumber: {
//     type: String,
//     required: [true, 'Please provide medical registration number'],
//     unique: true
//   },
//   issuingMedicalCouncil: {
//     type: String,
//     required: [true, 'Please provide issuing medical council']
//   },
//   yearsOfExperience: {
//     type: Number,
//     default: 0
//   },
//   specialization: {
//     type: String,
//     required: [true, 'Please provide your specialization']
//   },
//   subSpecialties: [String],
//   currentWorkplace: String,
//   designation: String,
//   professionalBio: {
//     type: String,
//     maxlength: 500
//   },
//   consultationFees: {
//     type: Number,
//     default: 0
//   },

//   // Educational Qualifications
//   degrees: [String],
//   university: String,
//   graduationYear: Number,
//   certifications: [String],
//   residencies: [String],
//   trainingsWorkshops: [String],

//   // Verification Documents
//   verificationDocuments: {
//     identityProof: String,
//     degreesCertificates: [String],
//     medicalCouncilRegistration: String
//   },

//   // Verification Status
//   verificationStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   verifiedAt: Date,
//   rejectionReason: String,

//   // Clinic Details
//   clinics: [{
//     clinicName: String,
//     address: {
//       street: String,
//       city: String,
//       state: String,
//       pincode: String
//     },
//     contactInfo: {
//       phone: String,
//       email: String
//     },
//     operatingHours: [{
//       day: {
//         type: String,
//         enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
//       },
//       slots: [{
//         startTime: String,
//         endTime: String
//       }]
//     }],
//     images: [String],
//     location: {
//       type: {
//         type: String,
//         enum: ['Point'],
//         default: 'Point'
//       },
//       coordinates: {
//         type: [Number], // [longitude, latitude]
//         index: '2dsphere'
//       }
//     },
//     servicesOffered: [String],
//     paymentMethods: [String]
//   }],


//   services: [{
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'Service'
// }],


//   // Enhanced Availability System with Booking Integration
//   availability: {
//     // General weekly availability (your original field)
//     days: [{
//       type: String,
//       enum: ['Monday', "Tuesday", "Wednesday", "Thursday", "Friday","Saturday","Sunday"]
//     }],
    
//     // General time slots (your original field)
//     timeSlots: [{
//       start: String,
//       end: String
//     }],
    
//     // NEW: Daily slot configuration for booking system
//     dailySlots: [{
//       date: { 
//         type: Date, 
//         required: true 
//       },
//       dayOfWeek: { 
//         type: String, 
//         enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
//       },
//       isAvailable: { 
//         type: Boolean, 
//         default: true 
//       },
//       slots: [{
//         startTime: { type: String, required: true }, // "09:00"
//         endTime: { type: String, required: true },   // "09:30"
//         duration: { type: Number, default: 30 },     // minutes
//         isBooked: { type: Boolean, default: false },
//         isSlotAvailable: { type: Boolean, default: true }, // NEW: Individual slot availability
//         bookingId: { 
//           type: mongoose.Schema.Types.ObjectId, 
//           ref: 'Booking' 
//         },
//         status: {
//           type: String,
//           enum: ['available', 'booked', 'blocked'],
//           default: 'available'
//         }
//       }],
//       breakTimes: [{
//         startTime: String,
//         endTime: String,
//         reason: String
//       }]
//     }],
    
//     // NEW: Service-specific availability
//     serviceAvailability: [{
//       serviceType: {
//         type: String,
//         enum: ['Doctor Visit', 'Nursing', 'Physiotherapy', 'Attendant Care']
//       },
//       isOffering: { type: Boolean, default: true },
//       modes: [{
//         type: String,
//         enum: ['Home Service', 'Visit Provider Location']
//       }],
//       pricing: {
//         basePrice: Number,
//         equipmentCharges: Number
//       },
//       slotDuration: { type: Number, default: 30 }, // minutes
//       maxBookingsPerDay: { type: Number, default: 20 }
//     }],
    
//     // NEW: Area coverage for home services
//     serviceCoverage: {
//       areas: [String], // Area names
//       maxDistance: { type: Number, default: 10 }, // km
//       homeServiceCharges: { type: Number, default: 0 }
//     },
    
//     // NEW: Auto-generate slots configuration
//     autoSlotGeneration: {
//       enabled: { type: Boolean, default: false },
//       defaultDuration: { type: Number, default: 30 }, // minutes
//       bufferBetweenSlots: { type: Number, default: 5 }, // minutes
//       advanceBookingDays: { type: Number, default: 30 }
//     }
//   },

//   // Authentication
//   role: {
//     type: String,
//     default: 'doctor'
//   },
//   tokenVersion: {
//     type: Number,
//     default: 0,
//     select: false
//   },
//   isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },
//   refreshToken: {
//     type: String,
//     default: null,
//     select: false
//   },

//   // Ratings & Reviews
//   averageRating: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 5
//   },
//   totalReviews: {
//     type: Number,
//     default: 0
//   },

//   // Social Features
//   followers: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Patient'
//   }],
//   followersCount: {
//     type: Number,
//     default: 0
//   },

//   // Status
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

// // Hash password before saving
// doctorSchema.pre('save', async function(next) {
//   if (!this.isModified('password') || !this.password) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Update timestamp
// doctorSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Compare password method
// doctorSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

// // Method to generate slots for a date range
// // doctorSchema.methods.generateSlots = async function(startDate, endDate, slotConfig) {
// //   const slots = [];
// //   const currentDate = new Date(startDate);
  
// //   while (currentDate <= endDate) {
// //     const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
// //     // Check if doctor is available on this day
// //     if (this.availability.days.includes(dayOfWeek.toLowerCase())) {
// //       const dailySlot = {
// //         date: new Date(currentDate),
// //         dayOfWeek,
// //         isAvailable: true,
// //         slots: []
// //       };
      
// //       // Generate time slots based on time ranges
// //       this.availability.timeSlots.forEach(timeRange => {
// //         const [startHour, startMin] = timeRange.start.split(':');
// //         const [endHour, endMin] = timeRange.end.split(':');
        
// //         let slotStart = new Date(currentDate);
// //         slotStart.setHours(parseInt(startHour), parseInt(startMin), 0);
        
// //         const rangeEnd = new Date(currentDate);
// //         rangeEnd.setHours(parseInt(endHour), parseInt(endMin), 0);
        
// //         const duration = slotConfig?.duration || this.availability.autoSlotGeneration.defaultDuration;
// //         const buffer = slotConfig?.buffer || this.availability.autoSlotGeneration.bufferBetweenSlots;
        
// //         while (slotStart < rangeEnd) {
// //           const slotEnd = new Date(slotStart.getTime() + duration * 60000);
          
// //           if (slotEnd <= rangeEnd) {
// //             dailySlot.slots.push({
// //               startTime: slotStart.toTimeString().substring(0, 5),
// //               endTime: slotEnd.toTimeString().substring(0, 5),
// //               duration,
// //               isBooked: false,
// //               isSlotAvailable: true,
// //               status: 'available'
// //             });
// //           }
          
// //           slotStart = new Date(slotEnd.getTime() + buffer * 60000);
// //         }
// //       });
      
// //       if (dailySlot.slots.length > 0) {
// //         slots.push(dailySlot);
// //       }
// //     }
    
// //     currentDate.setDate(currentDate.getDate() + 1);
// //   }
  
// //   return slots;
// // };
// doctorSchema.methods.generateSlots = async function(startDate, endDate, slotConfig) {
//   if (!this.availability.timeSlots || this.availability.timeSlots.length === 0) {
//     throw new Error("Doctor's availability.timeSlots are not configured");
//   }

//   const slots = [];
//   const currentDate = new Date(startDate);
//   const availableDaysLower = this.availability.days.map(d => d.toLowerCase());

//   while (currentDate <= endDate) {
//     const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
//     const dayOfWeekLower = dayOfWeek.toLowerCase();

//     if (availableDaysLower.includes(dayOfWeekLower)) {
//       const dailySlot = {
//         date: new Date(currentDate),
//         dayOfWeek,
//         isAvailable: true,
//         slots: []
//       };

//       this.availability.timeSlots.forEach(timeRange => {
//         if (!timeRange.start || !timeRange.end) {
//           // Skip invalid time ranges, optionally log for debugging
//           console.warn(`Skipping invalid time range: ${JSON.stringify(timeRange)}`);
//           return;
//         }

//         const [startHour, startMin] = timeRange.start.split(':').map(Number);
//         const [endHour, endMin] = timeRange.end.split(':').map(Number);

//         let slotStart = new Date(currentDate);
//         slotStart.setHours(startHour, startMin, 0, 0);

//         const rangeEnd = new Date(currentDate);
//         rangeEnd.setHours(endHour, endMin, 0, 0);

//         const duration = slotConfig?.duration || this.availability.autoSlotGeneration.defaultDuration;
//         const buffer = slotConfig?.buffer || this.availability.autoSlotGeneration.bufferBetweenSlots;

//         while (slotStart.getTime() + duration * 60000 <= rangeEnd.getTime()) {
//           const slotEnd = new Date(slotStart.getTime() + duration * 60000);
//           dailySlot.slots.push({
//             startTime: slotStart.toTimeString().slice(0, 5),
//             endTime: slotEnd.toTimeString().slice(0, 5),
//             duration,
//             isBooked: false,
//             isSlotAvailable: true,
//             status: 'available'
//           });

//           slotStart = new Date(slotEnd.getTime() + buffer * 60000);
//         }
//       });

//       if (dailySlot.slots.length > 0) {
//         slots.push(dailySlot);
//       }
//     }
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   return slots;
// };



// // Method to check if a specific slot is available
// doctorSchema.methods.isSlotAvailable = function(date, startTime) {
//   const dailySlot = this.availability.dailySlots.find(
//     ds => ds.date.toDateString() === new Date(date).toDateString()
//   );
  
//   if (!dailySlot || !dailySlot.isAvailable) return false;
  
//   const slot = dailySlot.slots.find(
//     s => s.startTime === startTime && 
//          s.status === 'available' && 
//          !s.isBooked && 
//          s.isSlotAvailable === true
//   );
  
//   return !!slot;
// };

// // Method to book a slot
// doctorSchema.methods.bookSlot = function(date, startTime, bookingId) {
//   const dailySlot = this.availability.dailySlots.find(
//     ds => ds.date.toDateString() === new Date(date).toDateString()
//   );
  
//   if (!dailySlot) throw new Error('No availability for this date');
  
//   const slot = dailySlot.slots.find(s => s.startTime === startTime);
  
//   if (!slot) throw new Error('Slot not found');
//   if (slot.isBooked) throw new Error('Slot already booked');
//   if (!slot.isSlotAvailable) throw new Error('Slot is not available');
  
//   slot.isBooked = true;
//   slot.isSlotAvailable = false;
//   slot.bookingId = bookingId;
//   slot.status = 'booked';
  
//   return slot;
// };

// // Method to release a slot
// doctorSchema.methods.releaseSlot = function(date, startTime) {
//   const dailySlot = this.availability.dailySlots.find(
//     ds => ds.date.toDateString() === new Date(date).toDateString()
//   );
  
//   if (!dailySlot) return false;
  
//   const slot = dailySlot.slots.find(s => s.startTime === startTime);
  
//   if (slot) {
//     slot.isBooked = false;
//     slot.isSlotAvailable = true;
//     slot.bookingId = null;
//     slot.status = 'available';
//     return true;
//   }
  
//   return false;
// };

// // Method to toggle slot availability
// doctorSchema.methods.toggleSlotAvailability = function(date, startTime, isAvailable) {
//   const dailySlot = this.availability.dailySlots.find(
//     ds => ds.date.toDateString() === new Date(date).toDateString()
//   );
  
//   if (!dailySlot) throw new Error('No slots found for this date');
  
//   const slot = dailySlot.slots.find(s => s.startTime === startTime);
  
//   if (!slot) throw new Error('Slot not found');
  
//   slot.isSlotAvailable = isAvailable;
  
//   if (!isAvailable) {
//     slot.status = 'blocked';
//   } else if (!slot.isBooked) {
//     slot.status = 'available';
//   }
  
//   return slot;
// };

// // Method to get all available slots for a date range
// doctorSchema.methods.getAvailableSlotsByDateRange = function(startDate, endDate) {
//   return this.availability.dailySlots.filter(ds => {
//     const slotDate = new Date(ds.date);
//     return slotDate >= new Date(startDate) && 
//            slotDate <= new Date(endDate) &&
//            ds.isAvailable;
//   }).map(ds => ({
//     date: ds.date,
//     dayOfWeek: ds.dayOfWeek,
//     slots: ds.slots.filter(s => 
//       s.status === 'available' && 
//       !s.isBooked && 
//       s.isSlotAvailable === true
//     )
//   })).filter(ds => ds.slots.length > 0);
// };

// // Method to add break time
// doctorSchema.methods.addBreakTime = function(date, startTime, endTime, reason) {
//   const dailySlot = this.availability.dailySlots.find(
//     ds => ds.date.toDateString() === new Date(date).toDateString()
//   );
  
//   if (!dailySlot) throw new Error('No slots found for this date');
  
//   if (!dailySlot.breakTimes) {
//     dailySlot.breakTimes = [];
//   }
  
//   dailySlot.breakTimes.push({
//     startTime,
//     endTime,
//     reason
//   });
  
//   // Block slots during break time
//   dailySlot.slots.forEach(slot => {
//     if (slot.startTime >= startTime && slot.startTime < endTime) {
//       slot.status = 'blocked';
//       slot.isSlotAvailable = false;
//     }
//   });
  
//   return dailySlot;
// };

// const Doctor = mongoose.model('Doctor', doctorSchema);

// module.exports = Doctor;



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
  password: {
    type: String,
    required: false,
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
  cities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],

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
  verificationDocuments: [{
    docType: { type: String, default: "other", trim: true },
    url: { type: String, default: "", trim: true },
    docNumber: { type: String, default: "", trim: true },
    issuedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true }
  }],

  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  rejectionReason: String,
  verificationSubmittedAt: Date,
  verificationReviewedAt: Date,
  verificationNotes: {
    type: String,
    default: "",
    trim: true
  },

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
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
        type: [Number],
        index: '2dsphere'
      }
    },
    servicesOffered: [String],
    paymentMethods: [String]
  }],

  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],

  // ✅ FLEXIBLE Availability System (backward compatible)
  availability: {
    // Weekly schedule
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    
    // Weekly time slots
    timeSlots: [{
      start: { type: String, required: true },
      end: { type: String, required: true }
    }],
    
    // ✅ FIXED: Accepts both string ('both') AND old object structure
    serviceAvailability: {
      type: mongoose.Schema.Types.Mixed,
      default: 'both'
    },
    
    // ✅ FIXED: Accepts both array of strings AND old object structure
    serviceCoverage: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    
    // Auto-generation settings
    autoSlotGeneration: {
      enabled: { type: Boolean, default: false },
      defaultDuration: { type: Number, default: 30 },
      bufferBetweenSlots: { type: Number, default: 5 },
      advanceBookingDays: { type: Number, default: 30 }
    },
    
    // Generated daily slots (for booking)
    dailySlots: [{
      date: { 
        type: Date, 
        required: true 
      },
      dayOfWeek: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
      },
      isAvailable: { 
        type: Boolean, 
        default: true 
      },
      slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        duration: { type: Number, default: 30 },
        isBooked: { type: Boolean, default: false },
        isSlotAvailable: { type: Boolean, default: true },
        bookingId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Booking' 
        },
        status: {
          type: String,
          enum: ['available', 'booked', 'blocked'],
          default: 'available'
        }
      }],
      breakTimes: [{
        startTime: String,
        endTime: String,
        reason: String
      }]
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
// Add after followersCount
socialHandle: {
  type: String,
  unique: true,
  sparse: true,  // allows multiple nulls
  trim: true
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
doctorSchema.pre('save', async function(next) {
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

// Generate slots method
doctorSchema.methods.generateSlots = async function(startDate, endDate, slotConfig) {
  const availability = this.availability || {};
  const days = Array.isArray(availability.days) ? availability.days : [];
  const timeSlots = Array.isArray(availability.timeSlots) ? availability.timeSlots : [];

  if (timeSlots.length === 0) {
    throw new Error("Doctor's availability.timeSlots are not configured");
  }
  if (days.length === 0) {
    throw new Error("Doctor's availability.days are not configured");
  }

  const slots = [];
  const currentDate = new Date(startDate);
  const availableDaysLower = days.map(d => d.toLowerCase());

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeekLower = dayOfWeek.toLowerCase();

    if (availableDaysLower.includes(dayOfWeekLower)) {
      const dailySlot = {
        date: new Date(currentDate),
        dayOfWeek,
        isAvailable: true,
        slots: []
      };

      timeSlots.forEach(timeRange => {
        if (!timeRange.start || !timeRange.end) {
          return;
        }

        const [startHour, startMin] = timeRange.start.split(':').map(Number);
        const [endHour, endMin] = timeRange.end.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);

        const rangeEnd = new Date(currentDate);
        rangeEnd.setHours(endHour, endMin, 0, 0);

        const durationValue = Number(
          slotConfig?.duration ??
            availability?.autoSlotGeneration?.defaultDuration ??
            30
        );
        const bufferValue = Number(
          slotConfig?.buffer ??
            availability?.autoSlotGeneration?.bufferBetweenSlots ??
            0
        );
        const duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 30;
        const buffer = Number.isFinite(bufferValue) && bufferValue >= 0 ? bufferValue : 0;

        while (slotStart.getTime() + duration * 60000 <= rangeEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);
          dailySlot.slots.push({
            startTime: slotStart.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            duration,
            isBooked: false,
            isSlotAvailable: true,
            status: 'available'
          });

          slotStart = new Date(slotEnd.getTime() + buffer * 60000);
        }
      });

      if (dailySlot.slots.length > 0) {
        slots.push(dailySlot);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

// Check slot availability
doctorSchema.methods.isSlotAvailable = function(date, startTime) {
  const dailySlot = this.availability.dailySlots.find(
    ds => ds.date.toDateString() === new Date(date).toDateString()
  );
  
  if (!dailySlot || !dailySlot.isAvailable) return false;
  
  const slot = dailySlot.slots.find(
    s => s.startTime === startTime && 
         s.status === 'available' && 
         !s.isBooked && 
         s.isSlotAvailable === true
  );
  
  return !!slot;
};

// Book a slot
doctorSchema.methods.bookSlot = function(date, startTime, bookingId) {
  const dailySlot = this.availability.dailySlots.find(
    ds => ds.date.toDateString() === new Date(date).toDateString()
  );
  
  if (!dailySlot) throw new Error('No availability for this date');
  
  const slot = dailySlot.slots.find(s => s.startTime === startTime);
  
  if (!slot) throw new Error('Slot not found');
  if (slot.isBooked) throw new Error('Slot already booked');
  if (!slot.isSlotAvailable) throw new Error('Slot is not available');
  
  slot.isBooked = true;
  slot.isSlotAvailable = false;
  slot.bookingId = bookingId;
  slot.status = 'booked';
  
  return slot;
};

// Release a slot
doctorSchema.methods.releaseSlot = function(date, startTime) {
  const dailySlot = this.availability.dailySlots.find(
    ds => ds.date.toDateString() === new Date(date).toDateString()
  );
  
  if (!dailySlot) return false;
  
  const slot = dailySlot.slots.find(s => s.startTime === startTime);
  
  if (slot) {
    slot.isBooked = false;
    slot.isSlotAvailable = true;
    slot.bookingId = null;
    slot.status = 'available';
    return true;
  }
  
  return false;
};
doctorSchema.index({ socialHandle: 1 });  // Fast handle lookup
doctorSchema.index({ cities: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ subSpecialties: 1 });
doctorSchema.index({ consultationFees: 1 });
doctorSchema.index({ averageRating: -1 });
doctorSchema.index({ "availability.dailySlots.date": 1 });
doctorSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  socialHandle: 'text',     // ✅ Text search
  specialization: 'text'
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
