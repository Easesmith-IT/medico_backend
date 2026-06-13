const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DB = process.env.MONGODB_URI;

async function testPatientComment() {
  console.log('Connecting to database...');
  await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.');

  const Patient = require('../models/patientModel');
  const Post = require('../models/socialPostModel');
  const { addComment } = require('../controller/socialmediaController');

  // Let's find a patient
  const patient = await Patient.findOne({ isActive: true });
  if (!patient) {
    throw new Error('No active patient found to test with.');
  }
  console.log(`Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient._id})`);

  // Let's find a post
  // We can search for any post in the collection
  const post = await Post.findOne();
  if (!post) {
    throw new Error('No post found to comment on.');
  }
  console.log(`Using post ID: ${post._id}`);

  // Create mock req, res, next
  const req = {
    user: {
      _id: patient._id,
      role: 'patient',
      userRole: 'patient',
      firstName: patient.firstName,
      lastName: patient.lastName,
    },
    params: {
      id: post._id.toString(),
    },
    body: {
      text: 'Test comment from verification script ' + new Date().toISOString(),
    },
  };

  let responseData = null;
  let responseStatus = 200;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const next = (err) => {
    if (err) {
      throw err;
    }
  };

  console.log('Invoking addComment controller...');
  await addComment(req, res, next);

  console.log(`Response Status: ${responseStatus}`);
  console.log('Response Body:', JSON.stringify(responseData, null, 2));

  if (responseStatus !== 200 || !responseData.success) {
    throw new Error(`Comment addition failed. Status: ${responseStatus}, Message: ${responseData.message}`);
  }

  console.log('Comment successfully added!');

  // Cleanup: Remove the newly added comment so we don't dirty the database
  const postAfter = await Post.findById(post._id);
  if (postAfter) {
    const commentIndex = postAfter.comments.findIndex(
      (c) => c.text === req.body.text && c.userId.toString() === patient._id.toString()
    );
    if (commentIndex !== -1) {
      postAfter.comments.splice(commentIndex, 1);
      postAfter.stats.comments = postAfter.comments.length;
      await postAfter.save();
      console.log('Database cleaned up successfully.');
    }
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
}

testPatientComment().catch((err) => {
  console.error('Test failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
