// controllers/post.controller.js
const Post = require('../models/socialPostModel');

// exports.createPost = async (req, res, next) => {
//   try {
//     const post = new Post({
//       ...req.body,
//       doctor: req.user.id
//     });
//     await post.save();
//     await post.populate('mentions');
//     res.status(201).json(post);
//   } catch (err) { next(err); }
// };



// exports.createPost = async (req, res, next) => {
//   try {
//     const postData = {
//       ...req.body,
//       doctor: req.user._id || req.user.id,
//       type: req.file ? 
//         (req.file.mimetype.startsWith('image/') ? 'image' : 'video') : 
//         (req.body.type || 'text'),
//       image: req.file ? `/images/${req.file.filename}` : req.body.image || null
//     };

//     const post = new Post(postData);
//     await post.save();
//     await post.populate('mentions', 'name profilePhoto');
    
//     res.status(201).json({
//       success: true,
//       data: post
//     });
//   } catch (err) { 
//     next(err); 
//   }
// };


exports.createPost = async (req, res, next) => {
  try {
    let type;

    if (req.file) {
      // If there is a file, decide between GALLERY / REEL
      const isImage = req.file.mimetype.startsWith('image/');
      type = isImage ? 'GALLERY' : 'REEL';
    } else {
      // No file: TEXT or ARTICLE; default to TEXT
      const requestedType = (req.body.type || 'TEXT').toUpperCase();
      type = ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'].includes(requestedType)
        ? requestedType
        : 'TEXT';
    }

    const postData = {
      doctor: req.user._id || req.user.id,
      type, //  always a valid enum
      content: req.body.content || '',
      mediaUrls: req.file ? [`/images/${req.file.filename}`] : [],
      hashtags: Array.isArray(req.body.hashtags)
        ? req.body.hashtags
        : (req.body.hashtags ? String(req.body.hashtags).split(',').map(h => h.trim()) : []),
      mentions: Array.isArray(req.body.mentions)
        ? req.body.mentions
        : (req.body.mentions ? String(req.body.mentions).split(',').map(m => m.trim()) : [])
    };

    const post = new Post(postData);
    await post.save();
    await post.populate('mentions', 'name profilePhoto');

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};


exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('doctor', 'name profilePhoto')
      .populate('mentions', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (err) { next(err); }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'stats.likes': 1 } },
      { new: true }
    );
    res.json({ likes: post.stats.likes });
  } catch (err) { next(err); }
};


// exports.toggleLikePost = async (req, res, next) => {

//   try {
//     const doctorId = req.user.id;
//     const postId = req.params.id;

//     const post = await Post.findById(postId).select('_id');
//     if (!post) return res.status(404).json({ message: 'Post not found' });

//     const existing = await PostLike.findOne({ post: postId, doctor: doctorId });

//     let liked;
//     if (!existing) {
//       // like
//       await PostLike.create({ post: postId, doctor: doctorId });
//       const updated = await Post.findByIdAndUpdate(
//         postId,
//         { $inc: { 'stats.likes': 1 } },
//         { new: true }
//       ).select('stats.likes');
//       liked = true;
//       return res.json({ liked, likes: updated.stats.likes });
//     } else {
//       // unlike
//       await PostLike.deleteOne({ _id: existing._id });
//       const updated = await Post.findByIdAndUpdate(
//         postId,
//         { $inc: { 'stats.likes': -1 } },
//         { new: true }
//       ).select('stats.likes');
//       liked = false;
//       return res.json({ liked, likes: updated.stats.likes });
//     }
//   } catch (err) { next(err); }
// };