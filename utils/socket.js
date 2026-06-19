const { Server } = require('socket.io');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');

let io;
const activeSockets = new Map(); // userId -> socketId

/**
 * Initializes the Socket.IO Server on the HTTP Server instance
 * @param {object} server - HTTP Server instance
 * @returns {object} Socket.IO Server instance
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins, matched with server CORS
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    const handshakeRole = socket.handshake.query.role; // 'doctor' or 'patient'

    if (userId) {
      activeSockets.set(userId.toString(), socket.id);
      console.log(`🔌 User connected: ${userId} (${handshakeRole || 'unknown role'}) | Socket ID: ${socket.id}`);
    } else {
      console.log(`🔌 Anonymous client connected | Socket ID: ${socket.id}`);
    }

    // Join a chat room (supports both string and object payload)
    socket.on('join_room', (data) => {
      let roomId;
      if (typeof data === 'string') {
        roomId = data;
      } else if (data && data.roomId) {
        roomId = data.roomId;
      }

      if (!roomId) {
        console.warn(`⚠️ join_room failed: No roomId provided by socket ${socket.id}`);
        return;
      }

      socket.join(roomId.toString());
      console.log(`🚪 Socket ${socket.id} (User: ${userId}) joined room ${roomId}`);
    });

    // Leave a chat room (supports both string and object payload)
    socket.on('leave_room', (data) => {
      let roomId;
      if (typeof data === 'string') {
        roomId = data;
      } else if (data && data.roomId) {
        roomId = data.roomId;
      }

      if (!roomId) return;
      socket.leave(roomId.toString());
      console.log(`🚪 Socket ${socket.id} left room ${roomId}`);
    });

    // Handle real-time messaging (supports both object and multi-argument payload)
    socket.on('send_message', async (data, arg2) => {
      let roomId;
      let text;

      if (typeof data === 'object' && data !== null) {
        roomId = data.roomId;
        text = data.text;
      } else {
        roomId = data;
        text = arg2;
      }

      if (!userId) {
        socket.emit('message_error', { message: 'Authentication required. No userId provided.' });
        return;
      }
      if (!roomId || !text || !text.trim()) {
        socket.emit('message_error', { roomId, message: 'Invalid message payload' });
        return;
      }

      try {
        const chatController = require('../controller/chatController');
        
        // Robustly determine senderModel from DB check
        let senderModel = 'Patient';
        const isDoctor = await Doctor.exists({ _id: userId });
        if (isDoctor) {
          senderModel = 'Doctor';
        } else {
          const isPatient = await Patient.exists({ _id: userId });
          if (isPatient) {
            senderModel = 'Patient';
          } else if (handshakeRole && handshakeRole.toLowerCase() === 'doctor') {
            senderModel = 'Doctor';
          }
        }

        // Process message sending
        const message = await chatController.processMessageSending(
          roomId, 
          userId, 
          senderModel, 
          text
        );

        // Acknowledge sending back to client
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('❌ Socket send_message error:', error.message);
        socket.emit('message_error', { roomId, message: error.message });
      }
    });

    // Handle marking messages as seen in real-time (supports both string and object payload)
    socket.on('mark_seen', async (data) => {
      let roomId;
      if (typeof data === 'string') {
        roomId = data;
      } else if (data && data.roomId) {
        roomId = data.roomId;
      }

      if (!userId || !roomId) return;

      try {
        const Message = require('../models/messageModel');
        const ChatRoom = require('../models/chatRoomModel');

        // Mark messages from other user as seen
        await Message.updateMany(
          { chatRoomId: roomId, senderId: { $ne: userId }, seen: false },
          { $set: { seen: true, seenAt: new Date() } }
        );

        // Reset user's unread count in ChatRoom
        const room = await ChatRoom.findById(roomId);
        if (room) {
          room.unreadCounts.set(userId.toString(), 0);
          await room.save();
        }

        // Notify room participants that messages have been read
        io.to(roomId.toString()).emit('messages_seen', { roomId, markedBy: userId });
        console.log(`👀 Room ${roomId} marked seen by User ${userId}`);
      } catch (error) {
        console.error('❌ Socket mark_seen error:', error.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (userId) {
        activeSockets.delete(userId.toString());
        console.log(`🔌 User disconnected: ${userId} | Socket ID: ${socket.id}`);
      } else {
        console.log(`🔌 Anonymous client disconnected | Socket ID: ${socket.id}`);
      }
    });
  });

  return io;
}

/**
 * Returns initialized Socket.IO instance
 * @returns {object} Socket.IO Server instance
 */
function getIo() {
  return io;
}

/**
 * Returns memory map of active sockets
 * @returns {Map<string, string>} Map of userId -> socketId
 */
function getActiveSockets() {
  return activeSockets;
}

module.exports = {
  initSocket,
  getIo,
  getActiveSockets
};
