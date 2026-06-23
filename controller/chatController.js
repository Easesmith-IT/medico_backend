const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const DoctorAppointment = require('../models/doctorAppointmentModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const fcm = require('../config/firebase-notify/firebase');
const socketUtil = require('../utils/socket');

/**
 * Capitalizes role to match Mongoose Model names
 */
const capitalizeModel = (role) => {
  if (!role) return '';
  const lower = role.toLowerCase();
  if (lower === 'doctor') return 'Doctor';
  if (lower === 'patient') return 'Patient';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Checks if there is a valid booking/appointment between Doctor and Patient
 */
const verifyBookingExists = async (doctorId, patientId) => {
  const booking = await DoctorAppointment.findOne({
    doctorId,
    patientId,
    status: { 
      $in: ['Approved', 'Confirmed', 'In-Progress', 'Completed', 'TreatmentCompleted', 'Started', 'Pending'] 
    },
    isDeleted: { $ne: true }
  });
  return !!booking;
};

/**
 * Shared helper to process message creation, socket emission, and FCM trigger
 */
const processMessageSending = async (roomId, senderId, senderModel, textOrPayload) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  // Validate booking if doctor-patient chat
  if (room.roomType === 'doctor-patient') {
    const doctorPart = room.participants.find(p => p.userModel === 'Doctor');
    const patientPart = room.participants.find(p => p.userModel === 'Patient');
    
    if (doctorPart && patientPart) {
      const bookingExists = await verifyBookingExists(doctorPart.userId, patientPart.userId);
      if (!bookingExists) {
        throw new AppError('Chat is blocked. A valid booking/appointment between Doctor and Patient is required.', 403);
      }
    }
  }

  let text = '';
  let messageType = 'text';
  let mediaUrl = null;
  let mediaName = null;
  let mediaSize = null;

  if (typeof textOrPayload === 'string') {
    text = textOrPayload;
  } else if (textOrPayload && typeof textOrPayload === 'object') {
    text = textOrPayload.text || '';
    messageType = textOrPayload.messageType || 'text';
    mediaUrl = textOrPayload.mediaUrl || null;
    mediaName = textOrPayload.mediaName || null;
    mediaSize = textOrPayload.mediaSize || null;
  }

  // Save message to database
  const message = await Message.create({
    chatRoomId: roomId,
    senderId,
    senderModel,
    text,
    messageType,
    mediaUrl,
    mediaName,
    mediaSize
  });

  // Find recipient
  const recipientPart = room.participants.find(p => p.userId.toString() !== senderId.toString());
  
  // Update last message & increment recipient unread count
  room.lastMessage = message._id;
  if (recipientPart) {
    const recIdStr = recipientPart.userId.toString();
    const currentUnread = room.unreadCounts.get(recIdStr) || 0;
    room.unreadCounts.set(recIdStr, currentUnread + 1);
  }
  await room.save();

  // Populate message sender
  const populatedMessage = await Message.findById(message._id)
    .populate({
      path: 'senderId',
      select: 'firstName email phone profilePhoto role'
    });

  // Emit Socket.IO event to all sockets joined in the room
  const io = socketUtil.getIo();
  if (io) {
    io.to(roomId.toString()).emit('new_message', populatedMessage);
  }

  // Trigger FCM push notification to guarantee delivery.
  // We send the notification even if the socket room check is active, because
  // mobile apps can keep socket connections alive in the background (stale room status).
  // The frontend app will suppress the visible banner if the user is actively viewing the chat room.
  if (recipientPart) {
    const recipientId = recipientPart.userId.toString();
    console.log(`[FCM Trigger] Checking notification for recipient ${recipientId} in room ${roomId}`);
    
    // Fetch recipient to retrieve fcmToken
    let recipientUser;
    if (recipientPart.userModel === 'Doctor') {
      recipientUser = await Doctor.findById(recipientId);
    } else {
      recipientUser = await Patient.findById(recipientId);
    }

    console.log(`[FCM Trigger] Recipient user found in DB: ${!!recipientUser}`);
    if (recipientUser) {
      console.log(`[FCM Trigger] Recipient FCM Token: "${recipientUser.fcmToken || 'none/null'}"`);
    }

    if (recipientUser && recipientUser.fcmToken) {
      // Fetch sender to include name in notification
      let senderUser;
      if (senderModel === 'Doctor') {
        senderUser = await Doctor.findById(senderId);
      } else {
        senderUser = await Patient.findById(senderId);
      }
      
      const senderName = senderUser ? (senderUser.firstName || senderUser.name) : 'User';
      const notificationTitle = `New message from ${senderName}`;
      
      let notificationBody = text;
      if (messageType === 'image') {
        notificationBody = text ? `📷 Image: ${text}` : '📷 Sent an image';
      } else if (messageType === 'document') {
        notificationBody = text ? `📄 Document: ${text}` : `📄 Sent a document: ${mediaName || 'file'}`;
      }

      if (notificationBody && notificationBody.length > 60) {
        notificationBody = `${notificationBody.substring(0, 60)}...`;
      }
      
      console.log(`[FCM Trigger] Sending push notification to ${recipientPart.userModel.toLowerCase()}: "${notificationTitle}" - "${notificationBody}"`);
      
      const response = await fcm.sendPushNotification(
        recipientUser.fcmToken,
        notificationTitle,
        notificationBody,
        {
          roomId: roomId.toString(),
          messageId: message._id.toString(),
          senderId: senderId.toString(),
          senderRole: senderModel.toLowerCase(),
          type: 'chat_message'
        },
        recipientPart.userModel.toLowerCase()
      );
      console.log(`[FCM Trigger] Notification dispatch result: ${response ? 'Success' : 'Failed/Skipped'}`);
    } else {
      console.log(`[FCM Trigger] Skipped: Recipient user has no FCM token saved.`);
    }
  }

  return populatedMessage;
};

/**
 * Create or get an existing chat room
 */
exports.createOrGetRoom = catchAsync(async (req, res, next) => {
  const { recipientId, recipientRole } = req.body;
  
  if (!recipientId || !recipientRole) {
    return next(new AppError('Please provide recipientId and recipientRole', 400));
  }

  const senderModel = capitalizeModel(req.user.role);
  const recipientModel = capitalizeModel(recipientRole);

  if (senderModel === 'Patient' && recipientModel === 'Patient') {
    return next(new AppError('Patients cannot initiate chat with other patients', 400));
  }

  let roomType = 'doctor-doctor';
  if (senderModel === 'Patient' || recipientModel === 'Patient') {
    roomType = 'doctor-patient';
    
    // Check doctor-patient booking validation
    const doctorId = senderModel === 'Doctor' ? req.user.id : recipientId;
    const patientId = senderModel === 'Patient' ? req.user.id : recipientId;
    
    const bookingExists = await verifyBookingExists(doctorId, patientId);
    if (!bookingExists) {
      return next(new AppError('Chat creation is blocked. A valid booking/appointment between Doctor and Patient is required.', 403));
    }
  }

  // Find if room already exists
  let room = await ChatRoom.findOne({
    participants: {
      $all: [
        { $elemMatch: { userId: req.user.id, userModel: senderModel } },
        { $elemMatch: { userId: recipientId, userModel: recipientModel } }
      ]
    }
  });

  if (!room) {
    room = await ChatRoom.create({
      participants: [
        { userId: req.user.id, userModel: senderModel },
        { userId: recipientId, userModel: recipientModel }
      ],
      roomType
    });
  }

  const populatedRoom = await ChatRoom.findById(room._id)
    .populate({
      path: 'participants.userId',
      select: 'firstName email phone profilePhoto specialization specializationName subSpecialties isActive role'
    });

  res.status(200).json({
    status: 'success',
    data: populatedRoom
  });
});

/**
 * Get list of chat rooms for the logged-in user
 */
exports.getChats = catchAsync(async (req, res, next) => {
  const senderModel = capitalizeModel(req.user.role);

  const rooms = await ChatRoom.find({
    participants: {
      $elemMatch: { userId: req.user.id, userModel: senderModel }
    }
  })
  .populate({
    path: 'participants.userId',
    select: 'firstName email phone profilePhoto specialization specializationName subSpecialties isActive role'
  })
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

  // Map and format room representation for the response
  const activeSockets = socketUtil.getActiveSockets();
  const chatList = rooms.map(room => {
    const otherParticipant = room.participants.find(
      p => p.userId && p.userId._id.toString() !== req.user.id.toString()
    );

    if (!otherParticipant || !otherParticipant.userId) return null;

    const userDetail = otherParticipant.userId;
    const isOnline = activeSockets.has(userDetail._id.toString());

    return {
      _id: room._id,
      roomType: room.roomType,
      unreadCount: room.unreadCounts.get(req.user.id.toString()) || 0,
      updatedAt: room.updatedAt,
      lastMessage: room.lastMessage ? {
        _id: room.lastMessage._id,
        text: room.lastMessage.text,
        messageType: room.lastMessage.messageType || 'text',
        mediaUrl: room.lastMessage.mediaUrl || null,
        mediaName: room.lastMessage.mediaName || null,
        mediaSize: room.lastMessage.mediaSize || null,
        senderId: room.lastMessage.senderId,
        seen: room.lastMessage.seen,
        createdAt: room.lastMessage.createdAt
      } : null,
      recipient: {
        _id: userDetail._id,
        name: userDetail.firstName || '',
        role: otherParticipant.userModel.toLowerCase(),
        profileImage: userDetail.profilePhoto || null,
        specialization: userDetail.specialization || null,
        isOnline: isOnline
      }
    };
  }).filter(Boolean);

  res.status(200).json({
    status: 'success',
    results: chatList.length,
    data: chatList
  });
});

/**
 * Get message history for a room, and mark other user's messages as read
 */
exports.getChatMessages = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return next(new AppError('Chat room not found', 404));
  }

  // Ensure user is participant of the room
  const isParticipant = room.participants.some(p => p.userId.toString() === req.user.id.toString());
  if (!isParticipant) {
    return next(new AppError('You are not authorized to view messages in this chat room', 403));
  }

  // Mark all unread messages from other participants in this room as seen
  await Message.updateMany(
    { chatRoomId: roomId, senderId: { $ne: req.user.id }, seen: false },
    { $set: { seen: true, seenAt: new Date() } }
  );

  // Clear unread count for the current user
  room.unreadCounts.set(req.user.id.toString(), 0);
  await room.save();

  // Retrieve messages
  const messages = await Message.find({ chatRoomId: roomId })
    .populate({
      path: 'senderId',
      select: 'firstName email phone profilePhoto role'
    })
    .sort({ createdAt: 1 }); // Oldest first for chronological order

  // Notify other user that messages are seen via socket
  const io = socketUtil.getIo();
  if (io) {
    io.to(roomId.toString()).emit('messages_seen', { roomId, markedBy: req.user.id });
  }

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: messages
  });
});

/**
 * HTTP Fallback for sending a text message
 */
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { text, messageType, mediaUrl, mediaName, mediaSize } = req.body;

  const msgType = messageType || 'text';

  if (msgType === 'text' && (!text || !text.trim())) {
    return next(new AppError('Please provide message text', 400));
  }

  if (msgType !== 'text' && !mediaUrl) {
    return next(new AppError('Please provide media URL', 400));
  }

  const senderModel = capitalizeModel(req.user.role);
  const populatedMessage = await processMessageSending(roomId, req.user.id, senderModel, {
    text,
    messageType: msgType,
    mediaUrl,
    mediaName,
    mediaSize
  });

  res.status(201).json({
    status: 'success',
    data: populatedMessage
  });
});

/**
 * Mark messages in a chat room as read manually
 */
exports.markAsSeen = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return next(new AppError('Chat room not found', 404));
  }

  const isParticipant = room.participants.some(p => p.userId.toString() === req.user.id.toString());
  if (!isParticipant) {
    return next(new AppError('You are not authorized to access this room', 403));
  }

  // Mark unread messages as read
  await Message.updateMany(
    { chatRoomId: roomId, senderId: { $ne: req.user.id }, seen: false },
    { $set: { seen: true, seenAt: new Date() } }
  );

  // Clear unread count
  room.unreadCounts.set(req.user.id.toString(), 0);
  await room.save();

  const io = socketUtil.getIo();
  if (io) {
    io.to(roomId.toString()).emit('messages_seen', { roomId, markedBy: req.user.id });
  }

  res.status(200).json({
    status: 'success',
    message: 'Messages marked as seen'
  });
});

/**
 * Update FCM token for the logged-in user (Doctor or Patient)
 */
exports.updateFcmToken = catchAsync(async (req, res, next) => {
  const { fcmToken } = req.body;

  if (fcmToken === undefined) {
    return next(new AppError('Please provide an fcmToken in the request body', 400));
  }

  const userId = req.user.id;
  const role = req.user.role?.toLowerCase();

  let user;
  if (role === 'doctor') {
    user = await Doctor.findByIdAndUpdate(userId, { fcmToken }, { new: true, runValidators: true });
  } else if (role === 'patient') {
    user = await Patient.findByIdAndUpdate(userId, { fcmToken }, { new: true, runValidators: true });
  } else {
    return next(new AppError('Invalid user role. FCM token can only be updated for Doctors or Patients.', 400));
  }

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'FCM token updated successfully',
    data: {
      userId: user._id,
      role,
      fcmToken: user.fcmToken
    }
  });
});

// Export processMessageSending so Socket.IO logic can share it directly
exports.processMessageSending = processMessageSending;
exports.verifyBookingExists = verifyBookingExists;
