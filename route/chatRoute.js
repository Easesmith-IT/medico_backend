const express = require('express');
const chatController = require('../controller/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All chat routes are protected - user must be logged in (can be Doctor or Patient)
router.use(protect('doctor', 'patient'));

router.route('/')
  .post(chatController.createOrGetRoom)
  .get(chatController.getChats);

router.route('/:roomId/messages')
  .get(chatController.getChatMessages)
  .post(chatController.sendMessage);

router.patch('/:roomId/seen', chatController.markAsSeen);

module.exports = router;
