// // models/Post.js
// const mongoose = require('mongoose');

// const postSchema = new mongoose.Schema({
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
//   content: { type: String, default: '' }, // markdown/text for TEXT/ARTICLE
//   mediaUrls: [{ type: String }], // images/videos for GALLERY/REEL
//   hashtags: [{ type: String }],
//   mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
//   stats: {
//     views: { type: Number, default: 0 },
//     likes: { type: Number, default: 0 },
//     comments: { type: Number, default: 0 },
//     saves: { type: Number, default: 0 },
//     shares: { type: Number, default: 0 }   
//   }
// }, { timestamps: true });

// postSchema.index({ doctor: 1, createdAt: -1 });
// postSchema.index({ hashtags: 1 });
// module.exports = mongoose.model('Post', postSchema);




// models/Post.js - Complete Medico Media Schema




// models/Social.js - Complete Medico Media (Posts + Follows)
const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema({
  // Post data
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
  content: { type: String, default: '' },
  mediaUrls: [{ type: String }],
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  
  // Embedded likes (Doctor + Patient)
  likes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Embedded comments (Doctor + Patient)
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
    text: { type: String, required: true, trim: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Embedded follows (Doctor ↔ Doctor, Patient → Doctor)
  follows: [{
    followerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    followerRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Only doctors can be followed
    createdAt: { type: Date, default: Date.now }
  }],
  
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    followers: { type: Number, default: 0 } // Doctor followers count
  }
}, { timestamps: true });

// Indexes
socialSchema.index({ doctor: 1, createdAt: -1 });
socialSchema.index({ hashtags: 1 });
socialSchema.index({ 'likes.userId': 1 });
socialSchema.index({ 'follows.followerId': 1 });
socialSchema.index({ 'follows.followingId': 1 });

module.exports = mongoose.model('Social', socialSchema);








// const mongoose = require('mongoose');

// const postSchema = new mongoose.Schema({
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
//   content: { type: String, default: '' }, // markdown/text for TEXT/ARTICLE
//   mediaUrls: [{ type: String }], // images/videos for GALLERY/REEL
//   hashtags: [{ type: String }],
//   mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  
//   // Per-user likes tracking (no separate model needed)
//   likes: [{
//     doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
//   }],
  
//   // Analytics counters (denormalized for fast reads)
//   stats: {
//     views: { type: Number, default: 0 },
//     likes: { type: Number, default: 0 },
//     comments: { type: Number, default: 0 },
//     saves: { type: Number, default: 0 },
//     shares: { type: Number, default: 0 }
//   }
// }, { timestamps: true });

// // Optimized indexes for Medico Media
// postSchema.index({ doctor: 1, createdAt: -1 });     // Doctor timeline
// postSchema.index({ hashtags: 1 });                  // Hashtag discovery
// postSchema.index({ 'likes.doctor': 1 });            // Like queries
// postSchema.index({ type: 1, createdAt: -1 });       // Content type feeds
// postSchema.index({ mentions: 1 });                  // @mentions notifications

// module.exports = mongoose.model('Post', postSchema);
