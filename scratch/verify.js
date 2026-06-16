const express = require('express');
const mongoose = require('mongoose');

console.log('Loading models...');
try {
  require('../models/socialPostModel');
  require('../models/doctorModel');
  require('../models/patientModel');
  require('../models/serviceProviderModel');
  console.log('Models loaded successfully.');
} catch (e) {
  console.error('Error loading models:', e);
  process.exit(1);
}

console.log('Loading controller...');
try {
  const socialmediaController = require('../controller/socialmediaController');
  if (typeof socialmediaController.getPostsByDoctorId !== 'function') {
    throw new Error('getPostsByDoctorId is not a function');
  }
  if (typeof socialmediaController.getPhotosOnlyPostsByDoctorId !== 'function') {
    throw new Error('getPhotosOnlyPostsByDoctorId is not a function');
  }
  console.log('Controller loaded and contains new methods successfully.');
} catch (e) {
  console.error('Error loading controller:', e);
  process.exit(1);
}

console.log('Loading route...');
try {
  const router = require('../route/socialPostRoute');
  console.log('Route loaded successfully.');
} catch (e) {
  console.error('Error loading routes:', e);
  process.exit(1);
}

console.log('All tests passed successfully!');
process.exit(0);
