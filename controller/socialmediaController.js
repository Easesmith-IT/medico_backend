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

// controllers/socialController.js

const Doctor = require('../models/doctorModel');
const Admin = require('../models/adminModel');

// CREATE POST
exports.createPost = async (req, res, next) => {
  try {
    // 1) Resolve post type
    let type;

    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      type = isImage ? 'GALLERY' : 'REEL';
    } else {
      const requestedType = (req.body.type || 'TEXT').toUpperCase();
      type = ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'].includes(requestedType)
        ? requestedType
        : 'TEXT';
    }

    // 2) Build post data
    const postData = {
      doctor: req.user._id || req.user.id, // doctor or admin id
      type,
      content: req.body.content || '',
      mediaUrls: req.file ? [`/images/${req.file.filename}`] : [],
      hashtags: Array.isArray(req.body.hashtags)
        ? req.body.hashtags
        : (req.body.hashtags
          ? String(req.body.hashtags).split(',').map(h => h.trim())
          : []),
      mentions: Array.isArray(req.body.mentions)
        ? req.body.mentions
        : (req.body.mentions
          ? String(req.body.mentions).split(',').map(m => m.trim())
          : [])
    };

    // 3) Save post
    const post = new Post(postData);
    await post.save();
    await post.populate('mentions', 'firstName lastName');

    // 4) Build creator object
    let creator;

    const doctor = await Doctor.findById(post.doctor)
      .select(
        'firstName lastName address cities clinics specialization subSpecialties designation profilePhoto'
      )
      .populate('cities', 'name');

    if (doctor) {
      // Name
      const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');

      // Location priority: City model -> address.city -> clinic.address.city
      let city = 'Not specified';

      if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
        city = doctor.cities[0].name;
      } else if (doctor.address?.city) {
        // only if address is an object with city
        city = doctor.address.city;
      } else if (
        doctor.clinics &&
        doctor.clinics.length &&
        doctor.clinics[0]?.address?.city
      ) {
        city = doctor.clinics[0].address.city;
      }

      // Normalize subSpecialties (array/string)
      const subSpecialties = Array.isArray(doctor.subSpecialties)
        ? doctor.subSpecialties.join(', ')
        : doctor.subSpecialties;

      // Position: specialization + subSpecialties + designation
      const positionParts = [
        doctor.specialization,
        subSpecialties,
        doctor.designation
      ].filter(Boolean);

      const position = positionParts.join(', ');

      creator = {
        _id: doctor._id,
        name,
        location: city,
        position,
        profilePhoto: doctor.profilePhoto || null,
        role: 'doctor',
        cities: (doctor.cities || []).map(c => c._id || c)
      };
    } else {
      // Admin fallback
      const admin = await Admin.findById(post.doctor).select('firstName');
      creator = {
        _id: post.doctor,
        name: `${admin?.firstName || 'Admin'} Admin`,
        location: null,
        position: null,
        profilePhoto: null,
        role: 'admin'
      };
    }

    // 5) Response
    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        creator
      }
    });
  } catch (err) {
    next(err);
  }
};


// GET POSTS (Feed)
// GET POSTS
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate({
        path: 'doctor',
        select: 'firstName lastName address cities specialization profilePhoto clinics',
        populate: { path: 'cities', select: 'name' }
      })
      .populate('mentions', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20);

    const postsWithCreators = posts.map(post => {
      const doctor = post.doctor;

      const name = doctor
        ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
        : 'Admin';

      let city = 'Not specified';

      if (doctor) {
        if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
          city = doctor.cities[0].name;
        } else if (doctor.address?.city) {
          city = doctor.address.city;
        } else if (
          doctor.clinics &&
          doctor.clinics.length &&
          doctor.clinics[0]?.address?.city
        ) {
          city = doctor.clinics[0].address.city;
        }
      }

      const position = doctor?.specialization || 'Doctor';

      return {
        ...post.toObject(),
        creator: {
          _id: doctor?._id || post.doctor,
          name,
          location: city,
          position,
          profilePhoto: doctor?.profilePhoto || null,
          role: doctor ? 'doctor' : 'admin'
        }
      };
    });

    res.json(postsWithCreators);
  } catch (err) {
    next(err);
  }
};

// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find()
//       .populate({
//         path: 'doctor',
//         select: 'firstName lastName location position profilePhoto'  // ✅ Added location + position
//       })
//       .populate('mentions', 'firstName lastName')
//       .sort({ createdAt: -1 })
//       .limit(20);

//     // ✅ Transform for consistent creator format
//     const postsWithCreators = posts.map(post => {
//       const doctor = post.doctor;
      
//       return {
//         ...post.toObject(),
//         creator: {
//           _id: doctor._id || post.doctor,
//           name: doctor ? `${doctor.firstName} ${doctor.lastName}`.trim() : 'Admin',
//           location: doctor?.location || null,
//           position: doctor?.position || null,
//           profilePhoto: doctor?.profilePhoto || null,
//           role: doctor ? 'doctor' : 'admin'
//         }
//       };
//     });

//     res.json(postsWithCreators);
//   } catch (err) { 
//     next(err); 
//   }
// };

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




exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id || req.user.id;
    if (post.doctor.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) { 
    next(err); 
  }
};



// exports.toggleLikePost = async (req, res, next) => {
//   try {
//     const post = await Post.findById(req.params.id); 
//     if (!social) return res.status(404).json({ success: false, message: 'Post not found' });

//     const userId = req.user._id.toString();
//     const userRole = req.user.role;
//     const existingLike = social.likes.find(like => 
//       like.userId.toString() === userId && like.userRole === userRole
//     );

//     if (existingLike) {
//       social.likes = social.likes.filter(like => 
//         !(like.userId.toString() === userId && like.userRole === userRole)
//       );
//     } else {
//       social.likes.push({ userId: req.user._id, userRole });
//     }
//     social.stats.likes = social.likes.length;
//     await social.save();

//     res.json({ success: true, likes: social.stats.likes, userHasLiked: !existingLike });
//   } catch (err) { next(err); }
// };

exports.toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id.toString();
    const userRole = req.user.role;  // ✅ 'doctor' or 'patient'

    const existingLike = post.likes?.find(like => 
      like.userId.toString() === userId && like.userRole === userRole
    );

    if (existingLike) {
      post.likes = post.likes.filter(like => 
        !(like.userId.toString() === userId && like.userRole === userRole)
      );
    } else {
      post.likes = post.likes || [];
      post.likes.push({ userId: req.user._id, userRole });
    }
    
    post.stats.likes = post.likes.length;
    await post.save();

    res.json({ 
      success: true, 
      likes: post.stats.likes, 
      userHasLiked: !existingLike 
    });
  } catch (err) { next(err); }
};


// Toggle Follow (Doctor follows Doctor, Patient follows Doctor)
exports.toggleFollowDoctor = async (req, res, next) => {
  try {
    const { targetDoctorId } = req.body;
    const followerId = req.user._id.toString();
    const followerRole = req.user.role;
    
    // Find or create social doc for target doctor
    let social = await Social.findOne({ doctor: targetDoctorId });
    if (!social) {
      social = new Social({ doctor: targetDoctorId });
      await social.save();
    }

    const existingFollow = social.follows.find(follow => 
      follow.followerId.toString() === followerId && 
      follow.followerRole === followerRole
    );

    if (existingFollow) {
      // Unfollow
      social.follows = social.follows.filter(follow => 
        !(follow.followerId.toString() === followerId && follow.followerRole === followerRole)
      );
    } else {
      // Follow
      social.follows.push({
        followerId: req.user._id,
        followerRole,
        followingId: targetDoctorId
      });
    }
    
    social.stats.followers = social.follows.length;
    await social.save();

    res.json({ 
      success: true, 
      action: existingFollow ? 'unfollowed' : 'followed',
      following: !existingFollow,
      followers: social.stats.followers 
    });
  } catch (err) { next(err); }
};

// Add Comment
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const social = await Social.findById(req.params.id);
    
    if (!social) return res.status(404).json({ success: false, message: 'Post not found' });
    
    social.comments.push({
      userId: req.user._id,
      userRole: req.user.role,
      text: text.trim()
    });
    social.stats.comments = social.comments.length;
    await social.save();

    res.json({ success: true, totalComments: social.stats.comments });
  } catch (err) { next(err); }
};

// Get Posts + Follows
exports.getSocialFeed = async (req, res, next) => {
  try {
    const socials = await Social.find()
      .populate('doctor', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: socials });
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