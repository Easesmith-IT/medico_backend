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

// Import controllers/modules
const chatController = require('../controller/chatController');
const patientController = require('../controller/patientController');
const fcm = require('../config/firebase-notify/firebase');

// Mock FCM push notification handler to spy on calls
let fcmCalls = [];
fcm.sendPushNotification = async (fcmToken, title, body, data = {}, targetRole = 'doctor') => {
  fcmCalls.push({ fcmToken, title, body, data, targetRole });
  console.log(`\n📢 [MOCK FCM] Push Notification Sent!`);
  console.log(`   To: ${targetRole.toUpperCase()}`);
  console.log(`   Token: ${fcmToken}`);
  console.log(`   Title: ${title}`);
  console.log(`   Body: ${body}`);
  console.log(`   Data Payload:`, data);
  return { success: true, messageId: 'mock-fcm-message-id' };
};

// Helper to run a controller method asynchronously and return the response/error
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
    
    Promise.resolve(controllerMethod(req, mockRes, next)).catch(reject);
  });
};

async function runFcmIntegrationTest() {
  console.log('🔄 Connecting to Database...');
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected.');

  // 1. Setup Test Users
  console.log('\n👤 Setting up test users...');
  let testDoctor = await Doctor.findOne({ email: 'test_doctor_fcm@example.com' });
  if (!testDoctor) {
    testDoctor = await Doctor.create({
      firstName: 'Test Doctor FCM',
      email: 'test_doctor_fcm@example.com',
      password: 'password123',
      phone: '9999991111',
      medicalRegistrationNumber: 'REG-FCM-123',
      issuingMedicalCouncil: 'Test Council',
      specialization: 'General',
      isActive: true,
      fcmToken: null
    });
  } else {
    testDoctor.fcmToken = null;
    await testDoctor.save();
  }
  console.log(`   Doctor ID: ${testDoctor._id}, Initial FCM Token: ${testDoctor.fcmToken}`);

  let testPatient = await Patient.findOne({ email: 'test_patient_fcm@example.com' });
  if (!testPatient) {
    testPatient = await Patient.create({
      firstName: 'Test Patient FCM',
      email: 'test_patient_fcm@example.com',
      password: 'password123',
      phone: '8888881111',
      isActive: true,
      isVerified: true,
      fcmToken: null
    });
  } else {
    testPatient.fcmToken = null;
    await testPatient.save();
  }
  console.log(`   Patient ID: ${testPatient._id}, Initial FCM Token: ${testPatient.fcmToken}`);

  // Clean up any existing chats/appointments
  await ChatRoom.deleteMany({
    'participants.userId': { $in: [testDoctor._id, testPatient._id] }
  });
  await Message.deleteMany({
    chatRoomId: { $exists: true }
  });
  await DoctorAppointment.deleteMany({
    doctorId: testDoctor._id,
    patientId: testPatient._id
  });
  console.log('🧹 Cleaned up old test data.');

  // 2. Test Patient Profile Update with whitelisted fcmToken
  console.log('\n🧪 Test 1: Updating Patient Profile fcmToken...');
  const mockReqUpdatePatient = {
    params: { id: testPatient._id.toString() },
    user: { id: testPatient._id.toString(), role: 'patient' },
    body: {
      fcmToken: 'patient_profile_token_123'
    }
  };

  const updatePatientRes = await runController(patientController.updatePatient, mockReqUpdatePatient);
  console.log(`   Status Code: ${updatePatientRes.statusCode}`);
  
  const verifiedPatient = await Patient.findById(testPatient._id);
  console.log(`   Saved Patient FCM Token: ${verifiedPatient.fcmToken}`);
  if (verifiedPatient.fcmToken !== 'patient_profile_token_123') {
    throw new Error('FCM token was not updated in Patient profile update');
  }
  console.log('   ✅ Test 1 Passed.');

  // 3. Test Doctor Token update via new PATCH /chats/fcm-token
  console.log('\n🧪 Test 2: Updating Doctor FCM Token via chatController...');
  const mockReqUpdateDoctorFcm = {
    user: { id: testDoctor._id.toString(), role: 'doctor' },
    body: {
      fcmToken: 'doctor_chat_token_456'
    }
  };

  const updateDoctorFcmRes = await runController(chatController.updateFcmToken, mockReqUpdateDoctorFcm);
  console.log(`   Status Code: ${updateDoctorFcmRes.statusCode}`);
  console.log(`   Response JSON:`, JSON.stringify(updateDoctorFcmRes.payload, null, 2));

  const verifiedDoctor = await Doctor.findById(testDoctor._id);
  console.log(`   Saved Doctor FCM Token: ${verifiedDoctor.fcmToken}`);
  if (verifiedDoctor.fcmToken !== 'doctor_chat_token_456') {
    throw new Error('FCM token was not updated for Doctor via chatController');
  }
  console.log('   ✅ Test 2 Passed.');

  // 4. Test Patient Token update via new PATCH /chats/fcm-token
  console.log('\n🧪 Test 3: Updating Patient FCM Token via chatController...');
  const mockReqUpdatePatientFcm = {
    user: { id: testPatient._id.toString(), role: 'patient' },
    body: {
      fcmToken: 'patient_chat_token_789'
    }
  };

  const updatePatientFcmRes = await runController(chatController.updateFcmToken, mockReqUpdatePatientFcm);
  console.log(`   Status Code: ${updatePatientFcmRes.statusCode}`);
  console.log(`   Response JSON:`, JSON.stringify(updatePatientFcmRes.payload, null, 2));

  const verifiedPatient2 = await Patient.findById(testPatient._id);
  console.log(`   Saved Patient FCM Token: ${verifiedPatient2.fcmToken}`);
  if (verifiedPatient2.fcmToken !== 'patient_chat_token_789') {
    throw new Error('FCM token was not updated for Patient via chatController');
  }
  console.log('   ✅ Test 3 Passed.');

  // 5. Test Push Notification delivery when offline
  console.log('\n🧪 Test 4: Sending message to trigger FCM notification for offline recipient...');
  
  // Create booking/appointment
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

  // Create chat room
  const mockReqCreateRoom = {
    body: {
      recipientId: testDoctor._id,
      recipientRole: 'doctor'
    },
    user: {
      id: testPatient._id,
      role: 'patient'
    }
  };
  const createRoomRes = await runController(chatController.createOrGetRoom, mockReqCreateRoom);
  const room = createRoomRes.payload.data;
  console.log(`   Chat Room created with ID: ${room._id}`);

  // Send message. The Doctor is offline (not joined in socket room).
  // So the FCM push notification logic should trigger!
  fcmCalls = [];
  const textMsg = 'Hi Doctor, I am offline in the app but sending this message. You should receive a push notification.';
  await chatController.processMessageSending(
    room._id,
    testPatient._id,
    'Patient',
    textMsg
  );

  console.log(`   Total FCM calls recorded: ${fcmCalls.length}`);
  if (fcmCalls.length !== 1) {
    throw new Error('Expected 1 FCM push notification to be sent, but got ' + fcmCalls.length);
  }

  const call = fcmCalls[0];
  if (call.fcmToken !== 'doctor_chat_token_456') {
    throw new Error(`Expected notification to be sent to Doctor's token 'doctor_chat_token_456', but got ${call.fcmToken}`);
  }
  if (call.targetRole !== 'doctor') {
    throw new Error(`Expected recipient role to be 'doctor', but got ${call.targetRole}`);
  }
  console.log('   ✅ Test 4 Passed.');

  console.log('\n🎉 ALL FCM INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
}

runFcmIntegrationTest()
  .catch(err => {
    console.error('❌ FCM Integration Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB.');
  });
