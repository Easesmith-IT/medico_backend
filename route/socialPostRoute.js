// routes/post.routes.js
const express = require('express');
const router = express.Router();
const postCtrl = require('../controller/socialmediaController');
const postUpload = require('../middleware/multerConfig');
const { protect } = require('../middleware/auth');
// router.post('/createPost', postCtrl.createPost);
// router.post('/createPost', protect('doctor'), postCtrl.createPost);
// router.post('/createPost', 
//   protect('doctor'), 
//   postUpload.single('image'), 
//   postCtrl.createPost
// );


router.post(
  '/createPost',
  protect('doctor', 'admin', 'superadmin', 'subadmin'),
  postUpload.single('image'),
  postCtrl.createPost
);

router.get('/getPosts', postCtrl.getPosts);

router.post('/likePost/:id/like', postCtrl.likePost);

module.exports = router;