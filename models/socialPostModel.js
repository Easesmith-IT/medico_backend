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
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
  content: { type: String, default: '' }, // markdown/text for TEXT/ARTICLE
  mediaUrls: [{ type: String }], // images/videos for GALLERY/REEL
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  
  // Per-user likes tracking (no separate model needed)
  likes: [{
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],
  
  // Analytics counters (denormalized for fast reads)
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Optimized indexes for Medico Media
postSchema.index({ doctor: 1, createdAt: -1 });     // Doctor timeline
postSchema.index({ hashtags: 1 });                  // Hashtag discovery
postSchema.index({ 'likes.doctor': 1 });            // Like queries
postSchema.index({ type: 1, createdAt: -1 });       // Content type feeds
postSchema.index({ mentions: 1 });                  // @mentions notifications

module.exports = mongoose.model('Post', postSchema);
