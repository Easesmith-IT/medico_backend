// const mongoose = require('mongoose');

// const articleSchema = new mongoose.Schema({
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: 'creatorModel',
//     required: true
//   },
//   creatorModel: {
//     type: String,
//     required: true,
//     enum: ['Doctor', 'Hospital']
//   },
//   location: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   category: {
//     type: String,
//     required: true,
//     trim: true
//     // e.g., "Cardiology"
//   },
//   tags: [{
//     type: String,
//     trim: true
//     // e.g., ["Heart Disease", "Hypertension", "Cholesterol"]
//   }],
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     trim: true
//   },
//   articleType: {
//     type: String,
//     enum: ['article', 'video', 'image'],
//     required: true,
//     lowercase: true
//   },
//   content: {
//     // For Article type (text)
//     text: {
//       type: String
//     },
//     // For Video type
//     video: {
//       url: String,
//       publicId: String,
//       filename: String,
//       size: Number,
//       duration: Number
//     },
//     // For Image type (multiple images)
//     images: [{
//       url: String,
//       publicId: String,
//       filename: String,
//       size: Number,
//       width: Number,
//       height: Number
//     }]
//   },
//   status: {
//     type: String,
//     enum: ['draft', 'published', 'archived'],
//     default: 'draft'
//   },
//   views: {
//     type: Number,
//     default: 0
//   },
//   likes: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// // Indexes for better query performance
// articleSchema.index({ createdBy: 1, creatorModel: 1 });
// articleSchema.index({ category: 1 });
// articleSchema.index({ tags: 1 });
// articleSchema.index({ location: 1 });
// articleSchema.index({ status: 1, createdAt: -1 });
// articleSchema.index({ articleType: 1 });

// // Virtual for article URL
// articleSchema.virtual('articleUrl').get(function() {
//   return `/articles/${this._id}`;
// });

// // Ensure virtuals are included in JSON
// articleSchema.set('toJSON', { virtuals: true });

// module.exports = mongoose.model('Article', articleSchema);


const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  // Creator Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorModel',
    required: true,
    index: true
  },
  creatorModel: {
    type: String,
    required: true,
    enum: ['Doctor', 'Hospital']
  },
  
  // Location Fields (supporting both old and new formats)
  // OLD FIELD: Keep for backward compatibility with existing articles
  location: {
    type: String,
    trim: true,
    index: true
    // e.g., "Mumbai", "Delhi", "Bangalore"
  },
  // NEW FIELD: For new articles with city reference
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    index: true
  },
  
  // Article Content Fields
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
    // e.g., "Cardiology", "Neurology", "Pediatrics"
  },
  tags: [{
    type: String,
    trim: true
    // e.g., ["Heart Disease", "Hypertension", "Cholesterol"]
  }],
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Article Type
  articleType: {
    type: String,
    enum: ['article', 'video', 'image'],
    required: true,
    lowercase: true
  },
  
  // Content based on article type
  content: {
    // For Article type (text content)
    text: {
      type: String
    },
    // For Video type
    video: {
      url: String,
      publicId: String,
      filename: String,
      size: Number,
      duration: Number
    },
    // For Image type (multiple images)
    images: [{
      url: String,
      publicId: String,
      filename: String,
      size: Number,
      width: Number,
      height: Number
    }]
  },
  
  // Status and Engagement
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
articleSchema.index({ createdBy: 1, creatorModel: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ location: 1 });        // OLD: For location string searches
articleSchema.index({ cityId: 1 });          // NEW: For cityId reference searches
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ articleType: 1 });
articleSchema.index({ location: 1, status: 1 });     // Compound index
articleSchema.index({ cityId: 1, status: 1 });       // Compound index

// Virtual for article URL
articleSchema.virtual('articleUrl').get(function() {
  return `/articles/${this._id}`;
});

// Virtual for getting city name (works for both old and new format)
articleSchema.virtual('cityName').get(function() {
  if (this.cityId && this.cityId.name) {
    return this.cityId.name;
  }
  return this.location || 'Unknown';
});

// Pre-save hook to ensure at least one location field is set
articleSchema.pre('save', function(next) {
  if (!this.location && !this.cityId) {
    return next(new Error('Either location or cityId must be provided'));
  }
  next();
});

// Method to check if article uses new format
articleSchema.methods.usesNewFormat = function() {
  return !!this.cityId;
};

// Method to get location info
articleSchema.methods.getLocationInfo = function() {
  if (this.cityId) {
    return {
      type: 'cityId',
      value: this.cityId,
      isNew: true
    };
  }
  return {
    type: 'location',
    value: this.location,
    isNew: false
  };
};

module.exports = mongoose.model('Article', articleSchema);
