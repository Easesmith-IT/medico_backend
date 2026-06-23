const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ChatRoom = require('../models/chatRoomModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');

async function scanAllChats() {
  console.log('🔄 Connecting to Database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  const rooms = await ChatRoom.find();
  console.log(`\nFound ${rooms.length} chat rooms. Scanning participants...`);

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    console.log(`\n--------------------------------------------`);
    console.log(`Room [${i + 1}/${rooms.length}] - ID: ${room._id} - Type: ${room.roomType}`);
    
    for (const part of room.participants) {
      let user = null;
      if (part.userModel === 'Doctor') {
        user = await Doctor.findById(part.userId);
      } else if (part.userModel === 'Patient') {
        user = await Patient.findById(part.userId);
      }

      if (!user) {
        console.log(`  ❌ Participant NOT FOUND in DB! Role: ${part.userModel}, ID: ${part.userId}`);
        continue;
      }

      const fcmToken = user.fcmToken;
      const name = `${user.firstName || user.name || 'N/A'}`;
      console.log(`  * Participant: ${part.userModel} - Name: "${name}" - ID: ${part.userId}`);
      console.log(`    FCM Token: ${fcmToken ? `"${fcmToken.substring(0, 30)}..." (length: ${fcmToken.length})` : '❌ NULL/MISSING'}`);
    }
  }
}

scanAllChats()
  .catch(err => console.error(err))
  .finally(() => mongoose.disconnect());
