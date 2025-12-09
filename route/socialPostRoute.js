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



router.post('/likePost/:id/toggle', protect(['doctor', 'patient']),  postCtrl.toggleLikePost);
router.post('/commentPost/:id', protect(['doctor', 'patient']),  postCtrl.addComment);
router.post('/followDoctor', protect(['doctor', 'patient']),  postCtrl.toggleFollowDoctor); // Follow doctor
router.get('/feed',  postCtrl.getSocialFeed);

module.exports = router;