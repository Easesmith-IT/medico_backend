const { Server } = require('socket.io');

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
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    const role = socket.handshake.query.role; // 'doctor' or 'patient'

    if (userId) {
      activeSockets.set(userId.toString(), socket.id);
      console.log(`🔌 User connected: ${userId} (${role || 'unknown role'}) | Socket ID: ${socket.id}`);
    } else {
      console.log(`🔌 Anonymous client connected | Socket ID: ${socket.id}`);
    }

    // Join a chat room
    socket.on('join_room', ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId.toString());
      console.log(`🚪 Socket ${socket.id} joined room ${roomId}`);
    });

    // Leave a chat room
    socket.on('leave_room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId.toString());
      console.log(`🚪 Socket ${socket.id} left room ${roomId}`);
    });

    // Handle real-time messaging
    socket.on('send_message', async (payload) => {
      const { roomId, text, messageType = 'text', mediaUrl, mediaName, mediaSize } = payload || {};

      if (!userId) {
        socket.emit('message_error', { message: 'Authentication required. No userId provided.' });
        return;
      }
      if (!roomId) {
        socket.emit('message_error', { message: 'Room ID is required' });
        return;
      }

      if (messageType === 'text' && (!text || !text.trim())) {
        socket.emit('message_error', { roomId, message: 'Invalid message payload: text is required for text message type' });
        return;
      }

      if (messageType !== 'text' && !mediaUrl) {
        socket.emit('message_error', { roomId, message: 'Invalid message payload: mediaUrl is required for media message type' });
        return;
      }

      try {
        const chatController = require('../controller/chatController');
        
        // Capitalize role for Mongoose refPath
        let senderModel = 'Patient';
        if (role && role.toLowerCase() === 'doctor') {
          senderModel = 'Doctor';
        }

        // Process message sending (booking check, DB save, unread counts, Socket emit, FCM offline notify)
        const message = await chatController.processMessageSending(
          roomId, 
          userId, 
          senderModel, 
          {
            text,
            messageType,
            mediaUrl,
            mediaName,
            mediaSize
          }
        );

        // Acknowledge sending back to client
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('❌ Socket send_message error:', error.message);
        socket.emit('message_error', { roomId, message: error.message });
      }
    });

    // Handle marking messages as seen in real-time
    socket.on('mark_seen', async ({ roomId }) => {
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
