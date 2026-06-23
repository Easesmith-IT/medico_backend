const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const DoctorAppointment = require('../models/doctorAppointmentModel');
const fcm = require('../config/firebase-notify/firebase');
const socketUtil = require('../utils/socket');

async function debugChatNotifications() {
  console.log('🔄 Connecting to Database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  // Find a chat room
  console.log('\n🔍 Searching for chat rooms in the database...');
  const rooms = await ChatRoom.find();
  if (rooms.length === 0) {
    console.log('❌ No chat rooms found in the database. Cannot debug chat notification flow.');
    return;
  }

  console.log(`Found ${rooms.length} chat rooms. Debugging the first one:`);
  const room = rooms[0];
  console.log(`  - Room ID: ${room._id}`);
  console.log(`  - Room Type: ${room.roomType}`);
  console.log(`  - Participants:`);

  let sender = null;
  let recipient = null;

  for (const part of room.participants) {
    let user;
    if (part.userModel === 'Doctor') {
      user = await Doctor.findById(part.userId);
    } else {
      user = await Patient.findById(part.userId);
    }

    const name = user ? `${user.firstName || user.name}` : 'Unknown';
    const email = user ? user.email : 'N/A';
    const fcmToken = user ? user.fcmToken : 'N/A';

    console.log(`    * ${part.userModel}: ${name} (${part.userId})`);
    console.log(`      Email: ${email}`);
    console.log(`      FCM Token: "${fcmToken}" (Length: ${fcmToken ? fcmToken.length : 0})`);

    if (!sender) {
      sender = { id: part.userId, model: part.userModel, name, user };
    } else if (!recipient) {
      recipient = { id: part.userId, model: part.userModel, name, user };
    }
  }

  if (!sender || !recipient) {
    console.log('❌ The room does not have two valid participants.');
    return;
  }

  console.log(`\n🧪 Simulating message sending from ${sender.name} (${sender.model}) to ${recipient.name} (${recipient.model})`);

  // Step 1: Check booking/appointment for doctor-patient
  if (room.roomType === 'doctor-patient') {
    console.log('\nStep 1: Checking appointment/booking validation...');
    const doctorPart = room.participants.find(p => p.userModel === 'Doctor');
    const patientPart = room.participants.find(p => p.userModel === 'Patient');
    
    const booking = await DoctorAppointment.findOne({
      doctorId: doctorPart.userId,
      patientId: patientPart.userId,
      status: { 
        $in: ['Approved', 'Confirmed', 'In-Progress', 'Completed', 'TreatmentCompleted', 'Started', 'Pending'] 
      },
      isDeleted: { $ne: true }
    });
    
    console.log(`  - Booking exists in DB: ${booking ? '✅ Yes' : '❌ No'}`);
    if (!booking) {
      console.log('  ⚠️ Validation Check: Message sending would fail with 403 Forbidden because no active booking exists between Doctor and Patient.');
    }
  }

  // Step 2: Check socket active/room status
  console.log('\nStep 2: Checking socket room activity...');
  // Since we are running outside the main server process, we check what the socket server would see.
  // We initialize a mock io/socket environment to trace socketUtil.isUserInRoom
  const isRoomActive = socketUtil.isUserInRoom(recipient.id, room._id);
  console.log(`  - Is recipient actively in socket room (isRoomActive): ${isRoomActive}`);
  console.log(`  - activeSockets map contains recipient: ${socketUtil.getActiveSockets().has(recipient.id.toString())}`);

  // Step 3: Check recipient token status
  console.log('\nStep 3: Checking recipient FCM token...');
  const fcmToken = recipient.user ? recipient.user.fcmToken : null;
  console.log(`  - FCM Token value: "${fcmToken}"`);
  if (!fcmToken) {
    console.log('  ❌ FAILURE: Recipient has no FCM token saved in the database! Notification will be skipped.');
  } else if (fcmToken.trim() === '') {
    console.log('  ❌ FAILURE: Recipient FCM token is an empty string! Notification will be skipped.');
  } else {
    console.log('  ✅ Recipient FCM token is present.');
  }

  // Step 4: Run actual push notification test with recipient token (if token exists)
  if (fcmToken) {
    console.log('\nStep 4: Attempting to send actual FCM notification using the credentials...');
    console.log(`  - Recipient role: ${recipient.model.toLowerCase()}`);
    console.log(`  - Sender name: ${sender.name}`);

    const result = await fcm.sendPushNotification(
      fcmToken,
      `New message from ${sender.name} (Debug)`,
      `This is a debugging push notification to check if your chat notification is triggering.`,
      {
        roomId: room._id.toString(),
        messageId: 'debug_message_id_123',
        senderId: sender.id.toString(),
        senderRole: sender.model.toLowerCase(),
        type: 'chat_message'
      },
      recipient.model.toLowerCase()
    );

    console.log(`  - Result of sendPushNotification: ${result ? '✅ SUCCESS' : '❌ FAILED'}`);
  }
}

debugChatNotifications()
  .catch(err => console.error('Error during debugging:', err))
  .finally(() => mongoose.disconnect());
