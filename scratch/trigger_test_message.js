const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ChatRoom = require('../models/chatRoomModel');
const Message = require('../models/messageModel');
const chatController = require('../controller/chatController');

async function triggerTestMessage() {
  console.log('🔄 Connecting to Database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  const roomId = '6a3393e17b9cb48a920ec6f5';
  const senderId = '6a22cc13dcce2ce0b2f29769'; // Dr. Sidd Mehta (Doctor)
  const senderModel = 'Doctor';
  const text = 'Hello Ravi, this is a simulated doctor-to-patient message to verify the Patient FCM application delivery!';

  console.log(`\n💬 Triggering processMessageSending...`);
  console.log(`  - Room: ${roomId}`);
  console.log(`  - Sender: ${senderId} (${senderModel})`);
  console.log(`  - Content: "${text}"`);
  console.log(`--------------------------------------------------`);

  const message = await chatController.processMessageSending(
    roomId,
    senderId,
    senderModel,
    text
  );

  console.log(`--------------------------------------------------`);
  console.log(`✅ Message processed successfully. Message ID: ${message._id}`);
}

triggerTestMessage()
  .catch(err => console.error('❌ Error during trigger:', err))
  .finally(() => mongoose.disconnect());
