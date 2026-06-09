const mongoose = require('mongoose');

const socialPostReportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    reporterRole: {
      type: String,
      enum: ['doctor', 'patient', 'admin', 'superadmin', 'subadmin'],
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Prevent duplicate reports from the same user on the same post
socialPostReportSchema.index({ postId: 1, reporterId: 1 }, { unique: true });

module.exports = mongoose.model('SocialPostReport', socialPostReportSchema);
