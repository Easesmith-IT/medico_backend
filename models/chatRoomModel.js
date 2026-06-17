const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participants.userModel',
      required: true
    },
    userModel: {
      type: String,
      enum: ['Doctor', 'Patient'],
      required: true
    }
  }],
  roomType: {
    type: String,
    enum: ['doctor-doctor', 'doctor-patient'],
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

// Index on participants.userId for quick lookup of rooms for a given user
chatRoomSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
