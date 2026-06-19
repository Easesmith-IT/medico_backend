const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');
const chatController = require('../controller/chatController');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");

    const roomId = '6a3286623ad37aec43a56359';
    const doctorId = '6a32839cf0dbf2fcfa5ca764';
    const patientId = '6a32855a5e7b51f086ceaacd';

    console.log("\n--- Cleanup previous test messages in room ---");
    const deleteResult = await Message.deleteMany({ chatRoomId: roomId });
    console.log(`Deleted ${deleteResult.deletedCount} messages.`);

    console.log("\n--- Test 1: Sending plain text message (Doctor) ---");
    const msg1 = await chatController.processMessageSending(
      roomId,
      doctorId,
      'Doctor',
      'Hello, this is a plain text test message.'
    );
    console.log("Msg1 created successfully:", {
      id: msg1._id,
      text: msg1.text,
      messageType: msg1.messageType,
      mediaUrl: msg1.mediaUrl
    });

    console.log("\n--- Test 2: Sending image message with caption (Doctor) ---");
    const msg2 = await chatController.processMessageSending(
      roomId,
      doctorId,
      'Doctor',
      {
        text: 'Here is the diagram we discussed.',
        messageType: 'image',
        mediaUrl: 'http://localhost:5005/uploads/1718812345-diagram.png',
        mediaName: 'diagram.png',
        mediaSize: 204856
      }
    );
    console.log("Msg2 created successfully:", {
      id: msg2._id,
      text: msg2.text,
      messageType: msg2.messageType,
      mediaUrl: msg2.mediaUrl,
      mediaName: msg2.mediaName,
      mediaSize: msg2.mediaSize
    });

    console.log("\n--- Test 3: Sending document message without caption (Patient) ---");
    const msg3 = await chatController.processMessageSending(
      roomId,
      patientId,
      'Patient',
      {
        messageType: 'document',
        mediaUrl: 'http://localhost:5005/uploads/1718819876-report.pdf',
        mediaName: 'lab_report.pdf',
        mediaSize: 1024567
      }
    );
    console.log("Msg3 created successfully:", {
      id: msg3._id,
      text: msg3.text,
      messageType: msg3.messageType,
      mediaUrl: msg3.mediaUrl,
      mediaName: msg3.mediaName,
      mediaSize: msg3.mediaSize
    });

    console.log("\n--- Test 4: Verify unread counts & last message in ChatRoom ---");
    const room = await ChatRoom.findById(roomId).populate('lastMessage');
    console.log("ChatRoom updated last message:", {
      id: room.lastMessage._id,
      text: room.lastMessage.text,
      messageType: room.lastMessage.messageType,
      mediaUrl: room.lastMessage.mediaUrl
    });
    console.log("ChatRoom unread counts:", Object.fromEntries(room.unreadCounts));

    console.log("\n--- Test 5: Verify negative validation (Missing mediaUrl for image) ---");
    try {
      await chatController.processMessageSending(
        roomId,
        doctorId,
        'Doctor',
        {
          messageType: 'image',
          mediaName: 'invalid.png'
        }
      );
      console.log("❌ ERROR: Validation should have failed for missing mediaUrl!");
    } catch (err) {
      console.log("✅ Expected validation error caught:", err.message);
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });
