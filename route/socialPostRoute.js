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



// router.post('/likePost/:id/toggle', protect(['doctor', 'patient']),  postCtrl.toggleLikePost);
router.post('/commentPost/:id', protect(['doctor', 'patient']),  postCtrl.addComment);
// router.post('/followDoctor', protect(['doctor', 'patient','admin', 'superadmin', 'subadmin']),  postCtrl.toggleFollowDoctor); // Follow doctor
router.post('/followDoctor', protect(['doctor', 'patient','admin', 'superadmin', 'subadmin']), postCtrl.toggleFollowDoctor);

// AFTER
router.post(
'/likePost/:id/toggle',
  protect(['doctor', 'patient', 'admin', 'superadmin', 'subadmin']),
  postCtrl.toggleLikePost
);


router.get('/feed',  postCtrl.getSocialFeed);
router.get('/getPostById/:id', postCtrl.getPostById);
router.post('/addComment/:id', protect(['doctor', 'patient','admin', 'superadmin', 'subadmin']), postCtrl.addComment);

router.patch(
  '/posts/:id/hide',
  protect(['admin', 'superadmin', 'subadmin']),
  postCtrl.toggleHidePost
);


router.delete(
  '/posts/:id',
  protect(['doctor', 'admin', 'superadmin', 'subadmin']),
  postCtrl.deletePost
);

module.exports = router;