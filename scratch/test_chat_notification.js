const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Setup a mock environment for models and socket utils
const socketUtil = require('../utils/socket');
const fcm = require('../config/firebase-notify/firebase');

// Mock mongoose Models
const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const DoctorAppointment = require('../models/doctorAppointmentModel');

// Backup original functions to restore later
const originalChatRoomFindById = ChatRoom.findById;
const originalMessageCreate = Message.create;
const originalMessageFindById = Message.findById;
const originalDoctorFindById = Doctor.findById;
const originalPatientFindById = Patient.findById;
const originalDoctorAppointmentFindOne = DoctorAppointment.findOne;
const originalGetIo = socketUtil.getIo;
const originalIsUserInRoom = socketUtil.isUserInRoom;
const originalSendPushNotification = fcm.sendPushNotification;

let mockFcmSent = false;
let mockFcmPayload = null;

async function runTests() {
  console.log('\n--- Running Chat Notification Logic Tests ---');

  // Define Mock Data
  const mockRoomId = new mongoose.Types.ObjectId();
  const mockSenderId = new mongoose.Types.ObjectId();
  const mockRecipientId = new mongoose.Types.ObjectId();
  const mockMessageId = new mongoose.Types.ObjectId();

  const mockRoom = {
    _id: mockRoomId,
    roomType: 'doctor-patient',
    participants: [
      { userId: mockSenderId, userModel: 'Doctor' },
      { userId: mockRecipientId, userModel: 'Patient' }
    ],
    unreadCounts: new Map(),
    save: async function() { return this; }
  };

  const mockMessage = {
    _id: mockMessageId,
    chatRoomId: mockRoomId,
    senderId: mockSenderId,
    senderModel: 'Doctor',
    text: 'Hello, this is a test message!',
    messageType: 'text',
    createdAt: new Date()
  };

  const mockRecipientUser = {
    _id: mockRecipientId,
    firstName: 'Patient Bob',
    fcmToken: 'mock-fcm-token-123'
  };

  const mockSenderUser = {
    _id: mockSenderId,
    firstName: 'Doctor Alice'
  };

  // Setup Mocks
  ChatRoom.findById = () => ({
    ...mockRoom
  });

  // Bypass booking check by returning true for booking
  DoctorAppointment.findOne = () => ({
    _id: new mongoose.Types.ObjectId(),
    status: 'Confirmed'
  });

  Message.create = async () => mockMessage;
  Message.findById = () => ({
    populate: () => mockMessage
  });

  Doctor.findById = async (id) => {
    if (id.toString() === mockSenderId.toString()) return mockSenderUser;
    return null;
  };

  Patient.findById = async (id) => {
    if (id.toString() === mockRecipientId.toString()) return mockRecipientUser;
    return null;
  };

  socketUtil.getIo = () => ({
    to: () => ({
      emit: () => {}
    })
  });

  fcm.sendPushNotification = async (fcmToken, title, body, data) => {
    mockFcmSent = true;
    mockFcmPayload = { fcmToken, title, body, data };
    return 'mock-response-id';
  };

  const chatController = require('../controller/chatController');

  // Test Case 1: Recipient is ACTIVE in the room -> FCM should NOT be sent
  console.log('\nTest Case 1: Recipient is active in the room...');
  socketUtil.isUserInRoom = () => true; // Active
  mockFcmSent = false;
  mockFcmPayload = null;

  await chatController.processMessageSending(mockRoomId, mockSenderId, 'Doctor', 'Hello!');
  
  if (!mockFcmSent) {
    console.log('✅ PASS: FCM notification was NOT sent when the recipient was active in the room.');
  } else {
    console.log('❌ FAIL: FCM notification was sent even though the recipient was active in the room.');
  }

  // Test Case 2: Recipient is NOT active in the room -> FCM SHOULD be sent
  console.log('\nTest Case 2: Recipient is NOT active in the room...');
  socketUtil.isUserInRoom = () => false; // Inactive / Offline
  mockFcmSent = false;
  mockFcmPayload = null;

  await chatController.processMessageSending(mockRoomId, mockSenderId, 'Doctor', 'Hello!');

  if (mockFcmSent) {
    console.log('✅ PASS: FCM notification WAS sent when the recipient was inactive in the room.');
    console.log('Payload details:');
    console.log('- Token:', mockFcmPayload.fcmToken);
    console.log('- Title:', mockFcmPayload.title);
    console.log('- Body:', mockFcmPayload.body);
    console.log('- Data RoomId:', mockFcmPayload.data.roomId);
  } else {
    console.log('❌ FAIL: FCM notification was NOT sent when the recipient was inactive.');
  }

  // Restore mocks
  ChatRoom.findById = originalChatRoomFindById;
  Message.create = originalMessageCreate;
  Message.findById = originalMessageFindById;
  Doctor.findById = originalDoctorFindById;
  Patient.findById = originalPatientFindById;
  DoctorAppointment.findOne = originalDoctorAppointmentFindOne;
  socketUtil.getIo = originalGetIo;
  socketUtil.isUserInRoom = originalIsUserInRoom;
  fcm.sendPushNotification = originalSendPushNotification;

  console.log('\n--- Finished Chat Notification Logic Tests ---');
}

runTests().catch(console.error);
