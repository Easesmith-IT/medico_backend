const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DB = process.env.MONGODB_URI;

// Load Models
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const DoctorAppointment = require('../models/doctorAppointmentModel');
const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');

// Import logic under test
const chatController = require('../controller/chatController');

/**
 * Helper to run a controller method asynchronously and return the response or error
 */
const runController = (controllerMethod, req, customRes = {}) => {
  return new Promise((resolve, reject) => {
    const mockRes = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(payload) {
        resolve({ statusCode: this.statusCode, payload });
      },
      ...customRes
    };
    
    const next = (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ nextCalled: true });
      }
    };
    
    // Call controller and catch any unhandled promise rejections
    Promise.resolve(controllerMethod(req, mockRes, next)).catch(reject);
  });
};

async function runTest() {
  console.log('🔄 Connecting to Database...');
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected.');

  // 1. Setup Test Users
  console.log('\n👤 Setting up test users...');
  let testDoctor = await Doctor.findOne({ email: 'test_doctor_chat@example.com' });
  if (!testDoctor) {
    testDoctor = await Doctor.create({
      firstName: 'Test Doctor Chat',
      email: 'test_doctor_chat@example.com',
      password: 'password123',
      phone: '9999999999',
      medicalRegistrationNumber: 'REG-CHAT-123',
      issuingMedicalCouncil: 'Test Council',
      specialization: 'General',
      isActive: true,
      fcmToken: 'mock_fcm_token_doctor'
    });
    console.log('Created test Doctor:', testDoctor._id);
  } else {
    testDoctor.fcmToken = 'mock_fcm_token_doctor';
    await testDoctor.save();
    console.log('Found existing test Doctor:', testDoctor._id);
  }

  let testPatient = await Patient.findOne({ email: 'test_patient_chat@example.com' });
  if (!testPatient) {
    testPatient = await Patient.create({
      firstName: 'Test Patient Chat',
      email: 'test_patient_chat@example.com',
      password: 'password123',
      phone: '8888888888',
      isActive: true,
      fcmToken: 'mock_fcm_token_patient'
    });
    console.log('Created test Patient:', testPatient._id);
  } else {
    testPatient.fcmToken = 'mock_fcm_token_patient';
    await testPatient.save();
    console.log('Found existing test Patient:', testPatient._id);
  }

  // Clean up any existing chats/appointments for a clean test run
  await ChatRoom.deleteMany({
    'participants.userId': { $in: [testDoctor._id, testPatient._id] }
  });
  await Message.deleteMany({
    senderId: { $in: [testDoctor._id, testPatient._id] }
  });
  await DoctorAppointment.deleteMany({
    doctorId: testDoctor._id,
    patientId: testPatient._id
  });
  console.log('🧹 Cleaned up old test chats and appointments.');

  // 2. Test Booking Verification: Doctor-Patient Chat Blocked Without Appointment
  console.log('\n🧪 Testing Booking Verification...');
  console.log('Attempting to check booking verification when no booking exists...');
  const verifyNoBooking = await chatController.verifyBookingExists(testDoctor._id, testPatient._id);
  console.log(`Booking exists? ${verifyNoBooking} (Expected: false)`);
  if (verifyNoBooking !== false) {
    throw new Error('Verification failed: expected no booking to exist');
  }

  // Try to create chat room when no booking exists - should fail
  const mockReqFail = {
    body: {
      recipientId: testDoctor._id,
      recipientRole: 'doctor'
    },
    user: {
      id: testPatient._id,
      role: 'patient'
    }
  };

  let createFailed = false;
  try {
    await runController(chatController.createOrGetRoom, mockReqFail);
  } catch (err) {
    console.log('✅ Correctly blocked room creation. Error message:', err.message);
    createFailed = true;
  }

  if (!createFailed) {
    throw new Error('Expected chat room creation to fail without a booking, but it did not fail.');
  }

  // 3. Create a valid appointment
  console.log('\nCreating approved DoctorAppointment between Doctor and Patient...');
  const appt = await DoctorAppointment.create({
    patientId: testPatient._id,
    doctorId: testDoctor._id,
    appointmentDate: new Date(),
    slotTime: { startTime: '10:00', endTime: '10:30' },
    status: 'Approved',
    createdBy: {
      userId: testPatient._id,
      userModel: 'Patient'
    }
  });
  console.log('Created appointment ID:', appt._id);

  console.log('Checking booking verification again...');
  const verifyBooking = await chatController.verifyBookingExists(testDoctor._id, testPatient._id);
  console.log(`Booking exists? ${verifyBooking} (Expected: true)`);
  if (verifyBooking !== true) {
    throw new Error('Verification failed: expected booking to exist');
  }

  // 4. Create Chat Room (with valid booking)
  console.log('\n🧪 Testing Chat Room Creation with valid booking...');
  const mockReqCreate = {
    body: {
      recipientId: testDoctor._id,
      recipientRole: 'doctor'
    },
    user: {
      id: testPatient._id,
      role: 'patient'
    }
  };

  const createRoomRes = await runController(chatController.createOrGetRoom, mockReqCreate);
  const createdRoom = createRoomRes.payload.data;
  console.log('Response HTTP Status:', createRoomRes.statusCode);
  console.log('✅ Chat Room created/retrieved successfully. ID:', createdRoom._id);

  // 5. Test Send Message
  console.log('\n🧪 Testing Send Message Logic...');
  const textMsg = 'Hello Doctor, I have had a mild fever since yesterday.';
  console.log(`Sending message: "${textMsg}"`);
  
  const msgResult = await chatController.processMessageSending(
    createdRoom._id,
    testPatient._id,
    'Patient',
    textMsg
  );

  console.log('✅ Message processed and saved. ID:', msgResult._id);
  console.log('Message text:', msgResult.text);
  console.log('Sender Role:', msgResult.senderModel);

  // Verify room updates
  const roomAfterMsg = await ChatRoom.findById(createdRoom._id);
  console.log('Room Last Message ID:', roomAfterMsg.lastMessage);
  console.log('Doctor Unread Count:', roomAfterMsg.unreadCounts.get(testDoctor._id.toString()));

  if (roomAfterMsg.unreadCounts.get(testDoctor._id.toString()) !== 1) {
    throw new Error('Unread count was not incremented correctly');
  }

  // 6. Test Get Messages & Mark Seen
  console.log('\n🧪 Testing Message Retrieval & Seen Marking...');
  const mockReqGetMsgs = {
    params: { roomId: createdRoom._id },
    user: {
      id: testDoctor._id,
      role: 'doctor'
    }
  };

  const getMsgsRes = await runController(chatController.getChatMessages, mockReqGetMsgs);
  const fetchedMessages = getMsgsRes.payload.data;

  console.log(`Fetched ${fetchedMessages.length} message(s) from chat room.`);
  console.log(`First message text: "${fetchedMessages[0].text}"`);
  console.log(`First message seen status: ${fetchedMessages[0].seen}`);

  // Retrieve room state again to check unread count was reset for Doctor
  const roomAfterSeen = await ChatRoom.findById(createdRoom._id);
  console.log('Doctor Unread Count after viewing messages:', roomAfterSeen.unreadCounts.get(testDoctor._id.toString()));
  if (roomAfterSeen.unreadCounts.get(testDoctor._id.toString()) !== 0) {
    throw new Error('Doctor unread count was not reset to 0');
  }

  console.log('\n🎉 ALL LOGICAL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
}

runTest()
  .catch(err => {
    console.error('❌ Test failed with error:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB.');
  });
