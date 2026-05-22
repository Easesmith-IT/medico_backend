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

const socialPostSchema = new mongoose.Schema({
  // Post data
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
  content: { type: String, default: '' },
  mediaUrls: [{ type: String }],
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  

city: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'City', 
  required:  false // or false if optional
},


   isHidden: {
    type: Boolean,
    default: false
  },
  hiddenAt: {
    type: Date,
    default: null
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // or 'Admin' / 'Doctor' depending on your auth model
    default: null
  },
  //  FIXED: Embedded likes (Doctor + Patient) - lowercase enum
  likes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { 
      type: String, 
      enum: ['doctor', 'patient', 'admin', 'superadmin', 'subadmin'],  // ✅ Matches req.user.role
      required: true 
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // FIXED: Embedded comments (Doctor + Patient) - lowercase enum
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { 
      type: String, 
    enum: ['doctor', 'patient', 'admin', 'superadmin', 'subadmin'] ,
      required: true 
    },
    text: { type: String, required: true, trim: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdAt: { type: Date, default: Date.now }
  }],
  
  //  FIXED: Embedded follows - lowercase enum
  follows: [{
    followerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    followerRole: { 
      type: String, 
    //   enum: ['doctor', 'patient'],  //  Matches req.user.role
     enum: ['doctor', 'patient', 'admin', 'superadmin', 'subadmin'],
      required: true 
    },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Analytics counters
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Optimized indexes
socialPostSchema.index({ doctor: 1, createdAt: -1 });        // Doctor timeline
socialPostSchema.index({ hashtags: 1 });                      // Hashtag search
socialPostSchema.index({ 'likes.userId': 1 });                // Like queries
socialPostSchema.index({ 'likes.userRole': 1 });              // Role-based likes
socialPostSchema.index({ 'comments.userId': 1 });             // Comment queries
socialPostSchema.index({ 'follows.followerId': 1 });          // Follower queries
socialPostSchema.index({ 'follows.followingId': 1 });         // Following queries
socialPostSchema.index({ type: 1, createdAt: -1 });           // Content feeds
socialPostSchema.index({ mentions: 1 });                      // Mentions notifications
socialPostSchema.index({ doctor: 1, isHidden: 1, hiddenAt: 1, createdAt: -1 });
socialPostSchema.index({ "stats.likes": -1, "stats.saves": -1, createdAt: -1 });

//  FIXED: Export as 'Post' to match controller
module.exports = mongoose.model('Post', socialPostSchema);





// const mongoose = require('mongoose');

// const socialSchema = new mongoose.Schema({
//   // Post data
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   type: { type: String, enum: ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'], required: true },
//   content: { type: String, default: '' },
//   mediaUrls: [{ type: String }],
//   hashtags: [{ type: String }],
//   mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  
//   // Embedded likes (Doctor + Patient)
//   likes: [{
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     userRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
//     createdAt: { type: Date, default: Date.now }
//   }],
  
//   // Embedded comments (Doctor + Patient)
//   comments: [{
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     userRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
//     text: { type: String, required: true, trim: true },
//     parentCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
//     createdAt: { type: Date, default: Date.now }
//   }],
  
//   // Embedded follows (Doctor ↔ Doctor, Patient → Doctor)
//   follows: [{
//     followerId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     followerRole: { type: String, enum: ['Doctor', 'Patient'], required: true },
//     followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Only doctors can be followed
//     createdAt: { type: Date, default: Date.now }
//   }],
  
//   stats: {
//     views: { type: Number, default: 0 },
//     likes: { type: Number, default: 0 },
//     comments: { type: Number, default: 0 },
//     saves: { type: Number, default: 0 },
//     shares: { type: Number, default: 0 },
//     followers: { type: Number, default: 0 } // Doctor followers count
//   }
// }, { timestamps: true });

// // Indexes
// socialSchema.index({ doctor: 1, createdAt: -1 });
// socialSchema.index({ hashtags: 1 });
// socialSchema.index({ 'likes.userId': 1 });
// socialSchema.index({ 'follows.followerId': 1 });
// socialSchema.index({ 'follows.followingId': 1 });

// module.exports = mongoose.model('Social', socialSchema);








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
