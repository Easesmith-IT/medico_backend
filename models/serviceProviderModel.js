//best schema with required images

// const mongoose = require('mongoose');

// const serviceProviderSchema = new mongoose.Schema({
//   // Personal Information
//   firstName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   lastName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   ownerName:{
//     type: String,
//     required: false,
//   },
//   age: {
//     type: Number,
//     required: true,
//     min: [18, 'Service provider must be at least 18 years old'],
//     max: [70, 'Age cannot exceed 70']
//   },
//   dateOfBirth: {
//     type: Date,
//     required: true
//   },
//   gender: {
//     type: String,
//     enum: ['Male', 'Female', 'Other'],
//     required: true
//   },

//   // Contact Information
//   mobile: {
//     type: String,
//     required: true,
//     unique: true,
//     validate: {
//       validator: function(v) {
//         return /^[0-9]{10}$/.test(v);
//       },
//       message: 'Mobile number must be 10 digits'
//     }
//   },
//   alternateNumber: {
//     type: String,
//     validate: {
//       validator: function(v) {
//         return !v || /^[0-9]{10}$/.test(v);
//       },
//       message: 'Alternate number must be 10 digits'
//     }
//   },
//   landline: {
//     type: String,
//     validate: {
//       validator: function(v) {
//         return !v || /^[0-9]{6,12}$/.test(v);
//       },
//       message: 'Invalid landline number'
//     }
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//     validate: {
//       validator: function(v) {
//         return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
//       },
//       message: 'Invalid email format'
//     }
//   },

//   // Address Details
//   currentAddress: {
//     street: { type: String, required: true },
//     locality: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     country: { type: String, required: true, default: 'India' },
//     pincode: { 
//       type: String, 
//       required: true,
//       validate: {
//         validator: function(v) {
//           return /^[0-9]{6}$/.test(v);
//         },
//         message: 'Pincode must be 6 digits'
//       }
//     },
//     landmark: String
//   },

//   permanentAddress: {
//     street: { type: String, required: true },
//     locality: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     country: { type: String, required: true, default: 'India' },
//     pincode: { 
//       type: String, 
//       required: true,
//       validate: {
//         validator: function(v) {
//           return /^[0-9]{6}$/.test(v);
//         },
//         message: 'Pincode must be 6 digits'
//       }
//     },
//     landmark: String,
//     sameAsCurrent: { type: Boolean, default: false }
//   },

//   workAddress: {
//     clinicName: String,
//     street: String,
//     locality: String,
//     city: String,
//     state: String,
//     country: { type: String, default: 'India' },
//     pincode: String,
//     landmark: String
//   },

//   // Service Details
//   services: [{
//     serviceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Service',
//       required: true
//     },
//     serviceName: String,
//     experienceYears: {
//       type: Number,
//       min: 0,
//       required: true
//     },
//     specialization: String
//   }],

//   // Professional Information
//   qualification: {
//     type: String,
//     required: true
//   },
//   registrationNumber: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   registrationCouncil: {
//     type: String,
//     required: true
//   },
//   yearsOfExperience: {
//     type: Number,
//     required: true,
//     min: 0
//   },

//   // Documents (Store URLs from Cloudinary)
//   documents: {
//     // Identity Proof
//     identityProof: {
//       type: { type: String, enum: ['Aadhar', 'PAN', 'Voter ID', 'Passport'] },
//       documentUrl: String,
//       documentNumber: String,
//       verified: { type: Boolean, default: false }
//     },
    
//     // Address Proof
//     addressProof: {
//       type: { type: String, enum: ['Aadhar', 'Utility Bill', 'Rent Agreement', 'Passport'] },
//       documentUrl: String,
//       verified: { type: Boolean, default: false }
//     },

//     // Educational Certificates
//     educationalCertificates: [{
//       degree: { type: String, required: true },
//       institution: String,
//       year: Number,
//       certificateUrl: { type: String, required: true },
//       verified: { type: Boolean, default: false }
//     }],

//     // Professional Certificates
//     professionalCertificates: [{
//       certificateName: { type: String, required: true },
//       issuingAuthority: String,
//       issueDate: Date,
//       expiryDate: Date,
//       certificateUrl: { type: String, required: true },
//       verified: { type: Boolean, default: false }
//     }],

//     // Registration Certificate
//     registrationCertificate: {
//       certificateUrl: { type: String, required: true },
//       issueDate: Date,
//       expiryDate: Date,
//       verified: { type: Boolean, default: false }
//     },

//     // Experience Certificates
//     experienceCertificates: [{
//       organization: String,
//       role: String,
//       from: Date,
//       to: Date,
//       certificateUrl: String,
//       verified: { type: Boolean, default: false }
//     }],

//     // Police Verification
//     policeVerification: {
//       certificateUrl: String,
//       issueDate: Date,
//       verified: { type: Boolean, default: false }
//     },

//     // Profile Photo
//     profilePhoto: {
//       type: String,
//       required: true
//     }
//   },

//   // Bank Details (for payment)
//   bankDetails: {
//     accountHolderName: { type: String, required: true },
//     accountNumber: { type: String, required: true },
//     ifscCode: { type: String, required: true },
//     bankName: String,
//     branchName: String,
//     upiId: String
//   },

//   // Availability
//   availability: {
//     days: [{
//       type: String,
//       enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
//     }],
//     timeSlots: [{
//       startTime: String,
//       endTime: String
//     }],
//     available24x7: { type: Boolean, default: false }
//   },

//   // Service Areas (Cities where provider can serve)
//   serviceCities: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'City',
//     required: true
//   }],

//   // Rating & Reviews
//   rating: {
//     average: { type: Number, default: 0, min: 0, max: 5 },
//     totalReviews: { type: Number, default: 0 }
//   },

//   // Admin Approval Workflow
//   approvalStatus: {
//     type: String,
//     enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
//     default: 'Pending'
//   },
//   approvedBy: {
//     adminId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Admin'
//     },
//     adminName: String,
//     approvedAt: Date
//   },
//   rejectionReason: String,
//   suspensionReason: String,

//   // Status
//   isActive: {
//     type: Boolean,
//     default: false // Becomes true only after admin approval
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isAvailable: {
//     type: Boolean,
//     default: true
//   },

//   // Emergency Contact
//   emergencyContact: {
//     name: String,
//     relationship: String,
//     mobile: String
//   },

//   // Additional Info
//   languages: [{
//     type: String
//   }],
//   about: {
//     type: String,
//     maxlength: 500
//   },

//   // Soft Delete
//   isDeleted: {
//     type: Boolean,
//     default: false
//   },
//   deletedAt: Date,
//   deletedBy: {
//     userId: mongoose.Schema.Types.ObjectId,
//     userModel: String
//   }

// }, { timestamps: true });

// // ============= INDEXES =============
// serviceProviderSchema.index({ mobile: 1 });
// serviceProviderSchema.index({ email: 1 });
// serviceProviderSchema.index({ approvalStatus: 1, isActive: 1 });
// serviceProviderSchema.index({ serviceCities: 1, isActive: 1 });
// serviceProviderSchema.index({ 'services.serviceId': 1 });
// serviceProviderSchema.index({ registrationNumber: 1 });

// // ============= PRE HOOKS =============
// serviceProviderSchema.pre(/^find/, function(next) {
//   this.find({ isDeleted: { $ne: true } });
//   next();
// });

// // ============= METHODS =============

// // Copy current address to permanent address
// serviceProviderSchema.methods.copyCurrentToPermanent = function() {
//   if (this.permanentAddress.sameAsCurrent) {
//     this.permanentAddress = {
//       ...this.currentAddress,
//       sameAsCurrent: true
//     };
//   }
// };

// // Check if all required documents are uploaded
// serviceProviderSchema.methods.areDocumentsComplete = function() {
//   const docs = this.documents;
//   return !!(
//     docs.identityProof?.documentUrl &&
//     docs.addressProof?.documentUrl &&
//     docs.educationalCertificates?.length > 0 &&
//     docs.registrationCertificate?.certificateUrl &&
//     docs.profilePhoto
//   );
// };

// // Check if all documents are verified
// serviceProviderSchema.methods.areDocumentsVerified = function() {
//   const docs = this.documents;
//   const eduVerified = docs.educationalCertificates?.every(cert => cert.verified);
//   const profVerified = docs.professionalCertificates?.length === 0 || 
//                        docs.professionalCertificates?.every(cert => cert.verified);
  
//   return !!(
//     docs.identityProof?.verified &&
//     docs.addressProof?.verified &&
//     eduVerified &&
//     docs.registrationCertificate?.verified &&
//     profVerified
//   );
// };

// // Get full name
// serviceProviderSchema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });

// module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);



//image false 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const serviceProviderSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: true,
    min: [18, 'Service provider must be at least 18 years old'],
    max: [70, 'Age cannot exceed 70']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },

  // Contact Information
  mobile: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  alternateNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Alternate number must be 10 digits'
    }
  },
  landline: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{6,12}$/.test(v);
      },
      message: 'Invalid landline number'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
 password: { type: String, required: false, select: false },

  // Address Details
  currentAddress: {
    street: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{6}$/.test(v);
        },
        message: 'Pincode must be 6 digits'
      }
    },
    landmark: String
  },

  permanentAddress: {
    street: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{6}$/.test(v);
        },
        message: 'Pincode must be 6 digits'
      }
    },
    landmark: String,
    sameAsCurrent: { type: Boolean, default: false }
  },

  workAddress: {
    clinicName: String,
    street: String,
    locality: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    landmark: String
  },

  // Service Details
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    serviceName: String,
    experienceYears: {
      type: Number,
      min: 0,
      required: true
    },
    specialization: String
  }],

  // Professional Information
  qualification: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  registrationCouncil: {
    type: String,
    required: true
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },

  // Documents (Optional Images)
  documents: {
    // Identity Proof
    identityProof: {
      type: { type: String, enum: ['Aadhar', 'PAN', 'Voter ID', 'Passport'] },
      documentUrl: { type: String, required: false },
      documentNumber: String,
      verified: { type: Boolean, default: false }
    },

    // Address Proof
    addressProof: {
      type: { type: String, enum: ['Aadhar', 'Utility Bill', 'Rent Agreement', 'Passport'] },
      documentUrl: { type: String, required: false },
      verified: { type: Boolean, default: false }
    },

    // Educational Certificates
    educationalCertificates: [{
      degree: { type: String, required: true },
      institution: String,
      year: Number,
      certificateUrl: { type: String, required: false },
      verified: { type: Boolean, default: false }
    }],

    // Professional Certificates
    professionalCertificates: [{
      certificateName: { type: String, required: true },
      issuingAuthority: String,
      issueDate: Date,
      expiryDate: Date,
      certificateUrl: { type: String, required: false },
      verified: { type: Boolean, default: false }
    }],

    // Registration Certificate
    registrationCertificate: {
      certificateUrl: { type: String, required: false },
      issueDate: Date,
      expiryDate: Date,
      verified: { type: Boolean, default: false }
    },

    // Experience Certificates
    experienceCertificates: [{
      organization: String,
      role: String,
      from: Date,
      to: Date,
      certificateUrl: { type: String, required: false },
      verified: { type: Boolean, default: false }
    }],

    // Police Verification
    policeVerification: {
      certificateUrl: { type: String, required: false },
      issueDate: Date,
      verified: { type: Boolean, default: false }
    },

    // Profile Photo (OPTIONAL NOW)
    profilePhoto: {
      type: String,
      required: false
    }
  },

  // Bank Details
  bankDetails: {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: String,
    branchName: String,
    upiId: String
  },

  // Availability
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    timeSlots: [{
      startTime: String,
      endTime: String
    }],
    available24x7: { type: Boolean, default: false }
  },

  // Service Areas
  serviceCities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  }],

  // Rating & Reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },

  // Admin Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
    default: 'Pending'
  },
  approvedBy: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminName: String,
    approvedAt: Date
  },
  rejectionReason: String,
  suspensionReason: String,

  // Status Flags
  isActive: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    mobile: String
  },

  // Additional Info
  languages: [{ type: String }],
  about: {
    type: String,
    maxlength: 500
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    userModel: String
  }

}, { timestamps: true });

// Indexes
serviceProviderSchema.index({ mobile: 1 });
serviceProviderSchema.index({ email: 1 });
serviceProviderSchema.index({ approvalStatus: 1, isActive: 1 });
serviceProviderSchema.index({ serviceCities: 1, isActive: 1 });
serviceProviderSchema.index({ 'services.serviceId': 1 });
serviceProviderSchema.index({ registrationNumber: 1 });

// Pre Hooks
serviceProviderSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});
serviceProviderSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password

// Methods
serviceProviderSchema.methods.copyCurrentToPermanent = function () {
  if (this.permanentAddress.sameAsCurrent) {
    this.permanentAddress = {
      ...this.currentAddress,
      sameAsCurrent: true
    };
  }
};

serviceProviderSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
serviceProviderSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
