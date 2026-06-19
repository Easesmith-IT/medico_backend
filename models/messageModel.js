const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Doctor', 'Patient'],
    required: true
  },
  text: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    },
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'document'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    required: function() {
      return this.messageType !== 'text';
    },
    default: null
  },
  mediaName: {
    type: String,
    default: null
  },
  mediaSize: {
    type: Number,
    default: null
  },
  seen: {
    type: Boolean,
    default: false
  },
  seenAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
