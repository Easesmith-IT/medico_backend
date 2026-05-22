// routes/post.routes.js
const express = require('express');
const router = express.Router();
const postCtrl = require('../controller/socialmediaController');
const postUpload = require('../middleware/multerConfig');
const { protect } = require('../middleware/auth');
 const {verifyAccessToken}= require('../middleware/auth')
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

// router.post('/likePost/:id/like', postCtrl.likePost);



// router.post('/likePost/:id/toggle', protect(['doctor', 'patient']),  postCtrl.toggleLikePost);
router.post('/commentPost/:id', protect(['doctor', 'admin', 'superadmin', 'subadmin']),  postCtrl.addComment);
// router.post('/followDoctor', protect(['doctor', 'patient','admin', 'superadmin', 'subadmin']),  postCtrl.toggleFollowDoctor); // Follow doctor
router.post('/followDoctor', protect(['doctor', 'patient','admin', 'superadmin', 'subadmin']), postCtrl.toggleFollowDoctor);

// AFTER
// router.post(
// '/likePost/:id/toggle',
//   protect(['doctor', 'patient', 'admin', 'superadmin', 'subadmin']),
//   postCtrl.toggleLikePost
// );


router.post(
  '/likePost/:id/toggle',
  protect(['doctor', 'patient', 'admin', 'superadmin', 'subadmin']),
  postCtrl.toggleLikePost
);
router.post(
  '/savePost/:id/toggle',
  protect(['patient']),
  postCtrl.toggleSavePost
);
router.get(
  '/savedPosts',
  protect(['patient']),
  postCtrl.getSavedPosts
);
router.get(
  '/notifications',
  protect(['patient']),
  postCtrl.getMySocialNotifications
);
router.get('/feed', protect(['patient']), postCtrl.getSocialFeed);
// router.get('/getPostById/:id', postCtrl.getPostById);
router.get(
  '/getPostById/:id',
  protect(['doctor', 'patient', 'admin', 'superadmin', 'subadmin']),
  postCtrl.getPostById
);
router.post('/addComment/:id', protect(['doctor', 'admin', 'superadmin', 'subadmin']), postCtrl.addComment);

router.patch(
  '/posts/:id/hide',
  protect(['admin', 'superadmin', 'subadmin']),
  postCtrl.toggleHidePost
);
// router.post(
//   '/hidePost/:id/toggle',
//   protect(['admin', 'superadmin', 'subadmin']),
//   postCtrl.toggleHidePost
// );
router.delete(
  '/posts/:id',
  protect(['doctor', 'admin', 'superadmin', 'subadmin']),
  postCtrl.deletePost
);
router.get(
  '/follow-stats/me',
  protect(['doctor']),
  postCtrl.getMyFollowStats
);
router.get(
  '/getPostByAdmin/:id',
  protect(['admin', 'superadmin', 'subadmin']),
  postCtrl.getPostByIdByAdmin
);



router.get('/search', postCtrl.searchSocialPosts); 
module.exports = router;
