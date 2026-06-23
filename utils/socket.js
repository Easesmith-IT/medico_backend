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
      let textOrPayload;

      if (typeof data === 'object' && data !== null) {
        roomId = data.roomId;
        textOrPayload = data;
      } else {
        roomId = data;
        textOrPayload = arg2;
      }

      if (!userId) {
        socket.emit('message_error', { message: 'Authentication required. No userId provided.' });
        return;
      }
      if (!roomId) {
        socket.emit('message_error', { roomId, message: 'Invalid message payload: roomId is required.' });
        return;
      }

      // Validate message payload based on message type
      if (typeof textOrPayload === 'object' && textOrPayload !== null) {
        const msgType = textOrPayload.messageType || 'text';
        if (msgType === 'text') {
          if (!textOrPayload.text || !textOrPayload.text.trim()) {
            socket.emit('message_error', { roomId, message: 'Invalid message payload: text is required for text messages.' });
            return;
          }
        } else if (msgType === 'image' || msgType === 'document') {
          if (!textOrPayload.mediaUrl || !textOrPayload.mediaUrl.trim()) {
            socket.emit('message_error', { roomId, message: `Invalid message payload: mediaUrl is required for '${msgType}' type.` });
            return;
          }
        } else {
          socket.emit('message_error', { roomId, message: `Invalid message payload: unsupported messageType '${msgType}'.` });
          return;
        }
      } else {
        // Simple string format (must be a text message)
        if (!textOrPayload || typeof textOrPayload !== 'string' || !textOrPayload.trim()) {
          socket.emit('message_error', { roomId, message: 'Invalid message payload: message text is required.' });
          return;
        }
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
          textOrPayload
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

/**
 * Checks if a specific user is currently active inside a socket room
 * @param {string} userId - ID of the user
 * @param {string} roomId - ID of the room
 * @returns {boolean} True if user is in room, false otherwise
 */
function isUserInRoom(userId, roomId) {
  console.log(`[Socket Check] Checking if user ${userId} is in room ${roomId}`);
  if (!io) {
    console.log(`[Socket Check] io is not initialized.`);
    return false;
  }
  if (!userId || !roomId) {
    console.log(`[Socket Check] Missing userId (${userId}) or roomId (${roomId}).`);
    return false;
  }
  const socketId = activeSockets.get(userId.toString());
  console.log(`[Socket Check] User socket ID: ${socketId || 'offline/none'}`);
  if (!socketId) return false;

  const roomSockets = io.sockets.adapter.rooms.get(roomId.toString());
  const inRoom = !!(roomSockets && roomSockets.has(socketId));
  console.log(`[Socket Check] Room sockets: ${roomSockets ? Array.from(roomSockets).join(', ') : 'none'}. User in room: ${inRoom}`);
  return inRoom;
}

module.exports = {
  initSocket,
  getIo,
  getActiveSockets,
  isUserInRoom
};

