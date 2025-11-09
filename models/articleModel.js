const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorModel',
    required: true
  },
  creatorModel: {
    type: String,
    required: true,
    enum: ['Doctor', 'Hospital']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
    // e.g., "Cardiology"
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
  articleType: {
    type: String,
    enum: ['article', 'video', 'image'],
    required: true,
    lowercase: true
  },
  content: {
    // For Article type (text)
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
  timestamps: true
});

// Indexes for better query performance
articleSchema.index({ createdBy: 1, creatorModel: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ location: 1 });
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ articleType: 1 });

// Virtual for article URL
articleSchema.virtual('articleUrl').get(function() {
  return `/articles/${this._id}`;
});

// Ensure virtuals are included in JSON
articleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema);
