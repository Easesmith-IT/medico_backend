// controllers/post.controller.js
const Post = require('../models/socialPostModel');
const SocialPostReport = require('../models/socialPostReportModel');
const mongoose = require('mongoose');
const { verifyToken } = require("../utils/tokenUtils");
const jwt = require('jsonwebtoken');
const uploadFile = require('../utils/uploadFile');
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
const Patient = require('../models/patientModel');

const ServiceProvider = require('../models/serviceProviderModel');
const Service = require('../models/serviceModel');
const SocialNotification = require('../models/socialNotificationModel');

const normalizeUser = (req) => {
  const user = req.user || {};
  const rawRole = user.role || user.userRole || "";
  const userRole = rawRole.toLowerCase();
  const userIdRaw = user._id || user.id || user.userId || "";
  const userId = userIdRaw ? userIdRaw.toString() : "";
  return { userId, userRole };
};

const isPostVisible = (post) => !post.isHidden && !post.hiddenAt;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const incrementMap = (map, key, amount = 1) => {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
};

const getPostIdSet = (items = []) =>
  new Set(items.map((item) => item.postId?.toString()).filter(Boolean));

const buildPatientInterestProfile = async (patient, userId) => {
  const savedPostIds = getPostIdSet(patient.savedPosts || []);
  const savedPosts = savedPostIds.size
    ? await Post.find({ _id: { $in: Array.from(savedPostIds) } })
        .select("doctor type hashtags")
        .lean()
    : [];

  const likedPosts = await Post.find({
    "likes.userId": userId,
    "likes.userRole": "patient",
  })
    .select("doctor type hashtags")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  const doctorAffinity = new Map();
  const hashtagAffinity = new Map();
  const typeAffinity = new Map();

  const learnFromPost = (post, weight) => {
    incrementMap(doctorAffinity, post.doctor?.toString(), weight);
    incrementMap(typeAffinity, post.type, weight);
    (post.hashtags || []).forEach((tag) =>
      incrementMap(hashtagAffinity, String(tag).toLowerCase(), weight)
    );
  };

  savedPosts.forEach((post) => learnFromPost(post, 3));
  likedPosts.forEach((post) => learnFromPost(post, 2));

  return {
    savedPostIds,
    doctorAffinity,
    hashtagAffinity,
    typeAffinity,
  };
};

const scoreSocialPost = (post, profile, now = new Date()) => {
  const createdAt = new Date(post.createdAt || now);
  const ageHours = Math.max((now.getTime() - createdAt.getTime()) / (60 * 60 * 1000), 0);
  const recencyScore = Math.exp(-ageHours / 72);

  const stats = post.stats || {};
  const engagementRaw =
    Number(stats.likes || 0) * 2 +
    Number(stats.saves || 0) * 3 +
    Number(stats.comments || 0) * 0.75 +
    Number(stats.views || 0) * 0.05;
  const engagementScore = clamp(Math.log1p(engagementRaw) / Math.log1p(75));

  const doctorId = post.doctor?._id?.toString?.() || post.doctor?.toString?.();
  const doctorAffinityScore = clamp((profile.doctorAffinity.get(doctorId) || 0) / 10);
  const typeAffinityScore = clamp((profile.typeAffinity.get(post.type) || 0) / 8);
  const hashtagScore = clamp(
    (post.hashtags || []).reduce(
      (sum, tag) => sum + (profile.hashtagAffinity.get(String(tag).toLowerCase()) || 0),
      0
    ) / 12
  );
  const mediaQualityScore = post.mediaUrls?.length ? 0.08 : 0;
  const alreadySavedPenalty = profile.savedPostIds.has(post._id.toString()) ? 0.06 : 0;

  const recommendationScore =
    recencyScore * 0.38 +
    engagementScore * 0.26 +
    doctorAffinityScore * 0.16 +
    hashtagScore * 0.12 +
    typeAffinityScore * 0.08 +
    mediaQualityScore -
    alreadySavedPenalty;

  const reasons = [];
  if (recencyScore > 0.72) reasons.push("recent");
  if (engagementScore > 0.35) reasons.push("high_engagement");
  if (doctorAffinityScore > 0) reasons.push("doctor_affinity");
  if (hashtagScore > 0) reasons.push("topic_match");
  if (typeAffinityScore > 0) reasons.push("format_match");

  return {
    recommendationScore: Number(recommendationScore.toFixed(4)),
    recommendationReasons: reasons,
  };
};

const rankSocialPosts = (posts, profile, sort = "recommended") => {
  const now = new Date();
  const scored = posts.map((post) => {
    const postObject = typeof post.toObject === "function" ? post.toObject() : post;
    return {
      ...postObject,
      ...scoreSocialPost(postObject, profile, now),
    };
  });

  if (sort === "recent") {
    return scored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (sort === "trending") {
    return scored.sort((a, b) => {
      const aStats = a.stats || {};
      const bStats = b.stats || {};
      const aEngagement = Number(aStats.likes || 0) * 2 + Number(aStats.saves || 0) * 3 + Number(aStats.comments || 0);
      const bEngagement = Number(bStats.likes || 0) * 2 + Number(bStats.saves || 0) * 3 + Number(bStats.comments || 0);
      return bEngagement - aEngagement || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  const perDoctorSeen = new Map();
  return scored
    .sort((a, b) => b.recommendationScore - a.recommendationScore || new Date(b.createdAt) - new Date(a.createdAt))
    .map((post) => {
      const doctorId = post.doctor?._id?.toString?.() || post.doctor?.toString?.() || "";
      const seen = perDoctorSeen.get(doctorId) || 0;
      perDoctorSeen.set(doctorId, seen + 1);
      return {
        ...post,
        recommendationScore: Number((post.recommendationScore - seen * 0.035).toFixed(4)),
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore || new Date(b.createdAt) - new Date(a.createdAt));
};

const notifyFollowersForPost = async (doctor, post) => {
  const followers = await Patient.find({ following: doctor._id })
    .select("_id")
    .lean();

  if (!followers.length) return;

  const doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "A doctor";
  await SocialNotification.insertMany(
    followers.map((patient) => ({
      recipientId: patient._id,
      actorId: doctor._id,
      type: "doctor_post_created",
      entityId: post._id,
      message: `${doctorName} posted new content`,
    })),
    { ordered: false }
  );
};

// CREATE POST
// exports.createPost = async (req, res, next) => {
//   try {
//     // 1) Resolve post type
//     let type;

//     if (req.file) {
//       const isImage = req.file.mimetype.startsWith('image/');
//       type = isImage ? 'GALLERY' : 'REEL';
//     } else {
//       const requestedType = (req.body.type || 'TEXT').toUpperCase();
//       type = ['TEXT', 'GALLERY', 'REEL', 'ARTICLE'].includes(requestedType)
//         ? requestedType
//         : 'TEXT';
//     }

//     // 2) Build post data
//     const postData = {
//       doctor: req.user._id || req.user.id, // doctor or admin id
//       type,
//       content: req.body.content || '',
//       mediaUrls: req.file ? [`/images/${req.file.filename}`] : [],
//       hashtags: Array.isArray(req.body.hashtags)
//         ? req.body.hashtags
//         : (req.body.hashtags
//           ? String(req.body.hashtags).split(',').map(h => h.trim())
//           : []),
//       mentions: Array.isArray(req.body.mentions)
//         ? req.body.mentions
//         : (req.body.mentions
//           ? String(req.body.mentions).split(',').map(m => m.trim())
//           : [])
//     };

//     // 3) Save post
//     const post = new Post(postData);
//     await post.save();
//     await post.populate('mentions', 'firstName lastName');

//     // 4) Build creator object
//     let creator;

//     const doctor = await Doctor.findById(post.doctor)
//       .select(
//         'firstName lastName address cities clinics specialization subSpecialties designation profilePhoto'
//       )
//       .populate('cities', 'name');

//     if (doctor) {
//       // Name
//       const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');

//       // Location priority: City model -> address.city -> clinic.address.city
//       let city = 'Not specified';

//       if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//         city = doctor.cities[0].name;
//       } else if (doctor.address?.city) {
//         // only if address is an object with city
//         city = doctor.address.city;
//       } else if (
//         doctor.clinics &&
//         doctor.clinics.length &&
//         doctor.clinics[0]?.address?.city
//       ) {
//         city = doctor.clinics[0].address.city;
//       }

//       // Normalize subSpecialties (array/string)
//       const subSpecialties = Array.isArray(doctor.subSpecialties)
//         ? doctor.subSpecialties.join(', ')
//         : doctor.subSpecialties;

//       // Position: specialization + subSpecialties + designation
//       const positionParts = [
//         doctor.specialization,
//         subSpecialties,
//         doctor.designation
//       ].filter(Boolean);

//       const position = positionParts.join(', ');

//       creator = {
//         _id: doctor._id,
//         name,
//         location: city,
//         position,
//         profilePhoto: doctor.profilePhoto || null,
//         role: 'doctor',
//         cities: (doctor.cities || []).map(c => c._id || c)
//       };
//     } else {
//       // Admin fallback
//       const admin = await Admin.findById(post.doctor).select('firstName');
//       creator = {
//         _id: post.doctor,
//         name: `${admin?.firstName || 'Admin'} Admin`,
//         location: null,
//         position: null,
//         profilePhoto: null,
//         role: 'admin'
//       };
//     }

//     // 5) Response
//     res.status(201).json({
//       success: true,
//       data: {
//         ...post.toObject(),
//         creator
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.createPost = async (req, res, next) => {
  try {
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user);

    // 1) Post type
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

    // 2) Get USER ID from JWT
    const userId = req.user?._id || req.user?.id;
    
    if (!userId || userId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: `Invalid user ID: ${userId}`
      });
    }

    console.log('User ID from JWT:', userId);

    // 3) Find Doctor record + CITY
    const doctor = await Doctor.findById(userId).select('cities firstName lastName').lean();
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found for user: ${userId}`
      });
    }

    console.log('Doctor found:', doctor._id, 'Cities:', doctor.cities);

    // 4) CITY VALIDATION (SCHEMA REQUIRES IT)
    if (!doctor.cities || !doctor.cities.length || !doctor.cities[0]) {
      return res.status(400).json({
        success: false,
        message: 'Doctor must have at least one city assigned in cities array'
      });
    }

    const cityId = doctor.cities[0];
    console.log('Using city ID:', cityId);

    // 5) Safe hashtags/mentions
    const hashtags = Array.isArray(req.body.hashtags)
      ? req.body.hashtags
      : (req.body.hashtags
        ? String(req.body.hashtags).split(',').map(h => h.trim()).filter(Boolean)
        : []);

    const mentions = Array.isArray(req.body.mentions)
      ? req.body.mentions.filter(id => id && id.length === 24)
      : (req.body.mentions
        ? String(req.body.mentions).split(',').map(m => m.trim()).filter(id => id && id.length === 24)
        : []);

    // 6) COMPLETE Post Data (ALL REQUIRED FIELDS)
    let mediaUrls = [];
    if (req.file) {
      const url = await uploadFile(req.file);
      mediaUrls = [url];
    } else if (req.body.mediaUrls) {
      mediaUrls = Array.isArray(req.body.mediaUrls)
        ? req.body.mediaUrls
        : [req.body.mediaUrls];
    }

    const postData = {
      doctor: userId,
      city: cityId,
      type,
      content: req.body.content || '',
      mediaUrls,
      hashtags,
      mentions,
      isHidden: false
    };

    console.log('Saving post data:', postData);

    // 7) Save post
    const post = new Post(postData);
    await post.save();
    await notifyFollowersForPost(doctor, post);

    console.log('Post saved:', post._id);

    // 8) Creator info
    const creator = {
      _id: doctor._id,
      name: [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') || 'Doctor',
      location: 'City',
      position: 'Specialist',
      profilePhoto: null,
      role: 'doctor',
      cities: [cityId]
    };

    // 9) Success response
    res.status(201).json({
      success: true,
      data: {
        _id: post._id.toString(),
        doctor: post.doctor.toString(),
        city: post.city.toString(),
        type: post.type,
        content: post.content,
        mediaUrls: post.mediaUrls,
        hashtags: post.hashtags,
        mentions: post.mentions,
        isHidden: post.isHidden,
        createdAt: post.createdAt,
        creator
      }
    });

  } catch (err) {
    console.error('FULL ERROR:', err.message);
    console.error('ERROR STACK:', err.stack);
    res.status(500).json({ 
      status: 'error', 
      message: err.message 
    });
  }
};



// GET POSTS (Feed)
// GET POSTS main one
// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find()
//       .populate({
//         path: 'doctor',
//         select: 'firstName lastName address cities specialization profilePhoto clinics',
//         populate: { path: 'cities', select: 'name' }
//       })
//       .populate('mentions', 'firstName lastName')
//       .sort({ createdAt: -1 })
//       .limit(20);

//     const postsWithCreators = posts.map(post => {
//       const doctor = post.doctor;

//       const name = doctor
//         ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
//         : 'Admin';

//       let city = 'Not specified';

//       if (doctor) {
//         if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//           city = doctor.cities[0].name;
//         } else if (doctor.address?.city) {
//           city = doctor.address.city;
//         } else if (
//           doctor.clinics &&
//           doctor.clinics.length &&
//           doctor.clinics[0]?.address?.city
//         ) {
//           city = doctor.clinics[0].address.city;
//         }
//       }

//       const position = doctor?.specialization || 'Doctor';

//       return {
//         ...post.toObject(),
//         creator: {
//           _id: doctor?._id || post.doctor,
//           name,
//           location: city,
//           position,
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

// exports.getPosts = async (req, res, next) => {
//   try {
//     const userId = req.user?._id;
//     const userRole = req.user?.role; // 'doctor' | 'patient' | 'admin' | ...

//     const posts = await Post.find()
//       .populate({
//         path: 'doctor',
//         select: 'firstName lastName address cities specialization profilePhoto clinics',
//         populate: { path: 'cities', select: 'name' }
//       })
//       .populate('mentions', 'firstName lastName')
//       .sort({ createdAt: -1 })
//       .limit(20);

//     const postsWithCreators = posts.map(post => {
//       const doctor = post.doctor;

//       const name = doctor
//         ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
//         : 'Admin';

//       let city = 'Not specified';

//       if (doctor) {
//         if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//           city = doctor.cities[0].name;
//         } else if (doctor.address?.city) {
//           city = doctor.address.city;
//         } else if (
//           doctor.clinics &&
//           doctor.clinics.length &&
//           doctor.clinics[0]?.address?.city
//         ) {
//           city = doctor.clinics[0].address.city;
//         }
//       }

//       const position = doctor?.specialization || 'Doctor';

//       const isLiked = !!post.likes?.some(
//         l =>
//           l.userId.toString() === userId?.toString() &&
//           l.userRole === userRole
//       );

//       const isFollowed = !!post.follows?.some(
//         f =>
//           f.followerId.toString() === userId?.toString() &&
//           f.followerRole === userRole &&
//           f.followingId.toString() === doctor?._id?.toString()
//       );

//       return {
//         ...post.toObject(),
//         creator: {
//           _id: doctor?._id || post.doctor,
//           name,
//           location: city,
//           position,
//           profilePhoto: doctor?.profilePhoto || null,
//           role: doctor ? 'doctor' : 'admin'
//         },
//         isLiked,
//         isFollowed
//       };
//     });

//     res.json(postsWithCreators);
//   } catch (err) {
//     next(err);
//   }
// }; //original

exports.getPosts = async (req, res, next) => {
  try {
    const { userId, userRole } = normalizeUser(req);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const query = { isHidden: { $ne: true } };

    const [posts, total, followDocs] = await Promise.all([
      Post.find(query)
      .populate({
        path: 'doctor',
        select:
          'firstName lastName address cities specialization profilePhoto clinics',
        populate: { path: 'cities', select: 'name' }
      })
      .populate('mentions', 'firstName lastName')
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
      userId
        ? Post.find({
            'follows.followerId': userId,
            'follows.followerRole': userRole
          }).select('doctor follows')
        : []
    ]);

    const followedDoctorIds = new Set();
    followDocs.forEach((doc) => {
      (doc.follows || []).forEach((follow) => {
        const followerId = follow.followerId?.toString();
        const followerRole = (follow.followerRole || '').toLowerCase();
        if (followerId === userId && followerRole === userRole) {
          const followingId = follow.followingId || doc.doctor;
          if (followingId) followedDoctorIds.add(followingId.toString());
        }
      });
    });

    const postsWithCreators = await Promise.all(
      posts.map(async post => {
        const doctor = post.doctor;

        const name = doctor
          ? [doctor.firstName, doctor.lastName]
              .filter(Boolean)
              .join(' ')
          : 'Admin';

        let city = 'Not specified';

        if (doctor) {
          if (
            doctor.cities &&
            doctor.cities.length &&
            doctor.cities[0]?.name
          ) {
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

        const isLiked = !!post.likes?.some(
          (like) =>
            like.userId?.toString() === userId &&
            (like.userRole || '').toLowerCase() === userRole
        );
        const isFollowed = doctor?._id
          ? followedDoctorIds.has(doctor._id.toString())
          : false;

        return {
          ...post.toObject(),
          creator: {
            _id: doctor?._id || post.doctor,
            name,
            location: city,
            position,
            profilePhoto: doctor?.profilePhoto || null,
            role: doctor ? 'doctor' : 'admin'
          },
          isLiked,
          isFollowed
        };
      })
    );

    res.json(postsWithCreators);
  } catch (err) {
    next(err);
  }
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




// exports.deletePost = async (req, res, next) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

//     const userId = req.user._id || req.user.id;
//     if (post.doctor.toString() !== userId.toString()) {
//       return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
//     }

//     await Post.findByIdAndDelete(req.params.id);
//     res.json({ success: true, message: 'Post deleted successfully' });
//   } catch (err) { 
//     next(err); 
//   }
// };
exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const user = req.user || {};
    const rawRole = user.role || user.userRole || '';
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || '';
    const userId = userIdRaw ? userIdRaw.toString() : '';

    // 1) Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // 2) Check role
    const isAdminRole =
      userRole === 'admin' ||
      userRole === 'superadmin' ||
      userRole === 'subadmin';

    const isOwner =
      post.doctor && post.doctor.toString() === userId.toString();

    // Only doctor who created it OR an admin-type role can delete
    if (!isOwner && !isAdminRole) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete this post' });
    }

    // 3) Delete post (hard delete)
    await Post.findByIdAndDelete(postId);

    return res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// exports.toggleHidePost = async (req, res, next) => {
//   try {
//     const postId = req.params.id;
//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || '';
//     const userRole = rawRole.toLowerCase();
//     const adminIdRaw = user._id || user.id || user.userId || '';
//     const adminId = adminIdRaw ? adminIdRaw.toString() : '';

//     const isAdminRole =
//       userRole === 'admin' ||
//       userRole === 'superadmin' ||
//       userRole === 'subadmin';

//     if (!isAdminRole || !adminId) {
//       return res
//         .status(403)
//         .json({ success: false, message: 'Only admins can hide posts' });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res
//         .status(404)
//         .json({ success: false, message: 'Post not found' });
//     }

//     // Toggle hide
//     const willHide = !post.isHidden;

//     post.isHidden = willHide;
//     post.hiddenAt = willHide ? new Date() : null;
//     post.hiddenBy = willHide ? adminId : null;

//     await post.save();

//     return res.json({
//       success: true,
//       action: willHide ? 'hidden' : 'unhidden',
//       isHidden: post.isHidden
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.toggleHidePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const user = req.user || {};
    const rawRole = user.role || user.userRole || '';
    const userRole = rawRole.toLowerCase();
    const adminIdRaw = user._id || user.id || user.userId || '';
    const adminId = adminIdRaw ? adminIdRaw.toString() : '';

    const isAdminRole =
      userRole === 'admin' ||
      userRole === 'superadmin' ||
      userRole === 'subadmin';

    if (!isAdminRole || !adminId) {
      return res
        .status(403)
        .json({ success: false, message: 'Only admins can hide posts' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // Toggle hide
    const willHide = !post.isHidden;

    post.isHidden = willHide;
    post.hiddenAt = willHide ? new Date() : null;
    post.hiddenBy = willHide ? adminId : null;

    await post.save();

    return res.json({
      success: true,
      action: willHide ? 'hidden' : 'unhidden',
      isHidden: post.isHidden
    });
  } catch (err) {
    next(err);
  }
};




// exports.getPostById = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user?._id;
//     const userRole = req.user?.role;

//     const post = await Post.findById(id)
//       .populate({
//         path: 'doctor',
//         select: 'firstName lastName address cities specialization profilePhoto clinics',
//         populate: { path: 'cities', select: 'name' }
//       })
//       .populate('mentions', 'firstName lastName');

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const doctor = post.doctor;

//     const name = doctor
//       ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
//       : 'Admin';

//     let city = 'Not specified';

//     if (doctor) {
//       if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//         city = doctor.cities[0].name;
//       } else if (doctor.address?.city) {
//         city = doctor.address.city;
//       } else if (
//         doctor.clinics &&
//         doctor.clinics.length &&
//         doctor.clinics[0]?.address?.city
//       ) {
//         city = doctor.clinics[0].address.city;
//       }
//     }

//     const position = doctor?.specialization || 'Doctor';

//     const isLiked = !!post.likes?.some(
//       l =>
//         l.userId.toString() === userId?.toString() &&
//         l.userRole === userRole
//     );

//     const isFollowed = !!post.follows?.some(
//       f =>
//         f.followerId.toString() === userId?.toString() &&
//         f.followerRole === userRole &&
//         f.followingId.toString() === doctor?._id?.toString()
//     );

//     const postWithCreator = {
//       ...post.toObject(),
//       creator: {
//         _id: doctor?._id || post.doctor,
//         name,
//         location: city,
//         position,
//         profilePhoto: doctor?.profilePhoto || null,
//         role: doctor ? 'doctor' : 'admin'
//       },
//       isLiked,
//       isFollowed
//     };

//     res.json(postWithCreator);
//   } catch (err) {
//     next(err);
//   }
// };


// exports.toggleLikePost = async (req, res, next) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Post not found" });
//     }

//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userId = (user._id || user.id || user.userId || "").toString();

//     const isAdminRole =
//       userRole === "admin" ||
//       userRole === "superadmin" ||
//       userRole === "subadmin";

//     // If request is coming from an admin-type user, do NOT throw "user not found" error
//     // Option A: completely disallow like/unlike for admin-side calls
//     if (isAdminRole) {
//       return res.status(200).json({
//         success: true,
//         message: "Admins do not toggle likes on posts",
//       });
//     }

//     // For patient/doctor/etc – strict check
//     if (!userId || !userRole) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found on request",
//       });
//     }

//     // ---- like/unlike logic stays the same ----
//     post.likes = Array.isArray(post.likes) ? post.likes : [];

//     const existingLike = post.likes.find((like) => {
//       if (!like || !like.userId) return false;
//       const likeUserId = like.userId.toString();
//       const likeUserRole = (like.userRole || "").toLowerCase();
//       return likeUserId === userId && likeUserRole === userRole;
//     });

//     if (existingLike) {
//       post.likes = post.likes.filter((like) => {
//         if (!like || !like.userId) return true;
//         const likeUserId = like.userId.toString();
//         const likeUserRole = (like.userRole || "").toLowerCase();
//         return !(likeUserId === userId && likeUserRole === userRole);
//       });
//     } else {
//       post.likes.push({
//         userId,
//         userRole,
//         createdAt: new Date(),
//       });
//     }

//     post.stats = post.stats || {};
//     post.stats.likes = post.likes.length;

//     await post.save();

//     return res.json({
//       success: true,
//       likes: post.stats.likes,
//       userHasLiked: !existingLike,
//     });
//   } catch (err) {
//     next(err);
//   }
// };



//without sync
// exports.getPostById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // normalize user exactly like toggleFollowDoctor
//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     const post = await Post.findById(id)
//       .populate({
//         path: 'doctor',
//         select: 'firstName lastName address cities specialization profilePhoto clinics',
//         populate: { path: 'cities', select: 'name' }
//       })
//       .populate('mentions', 'firstName lastName');

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const doctor = post.doctor;

//     const name = doctor
//       ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
//       : 'Admin';

//     let city = 'Not specified';

//     if (doctor) {
//       if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//         city = doctor.cities[0].name;
//       } else if (doctor.address?.city) {
//         city = doctor.address.city;
//       } else if (
//         doctor.clinics &&
//         doctor.clinics.length &&
//         doctor.clinics[0]?.address?.city
//       ) {
//         city = doctor.clinics[0].address.city;
//       }
//     }

//     const position = doctor?.specialization || 'Doctor';

//     // isLiked from this post.likes
//     const isLiked = !!post.likes?.some(l =>
//       l.userId.toString() === userId &&
//       (l.userRole || '').toLowerCase() === userRole
//     );

//     // read follow status from the doctor’s social doc,
//     // same place toggleFollowDoctor writes to
//     let isFollowed = false;
//     if (doctor && userId && userRole) {
//       const social = await Post.findOne({ doctor: doctor._id });

//       if (social && Array.isArray(social.follows)) {
//         isFollowed = !!social.follows.find(f => {
//           if (!f || !f.followerId) return false;
//           const followUserId = f.followerId.toString();
//           const followUserRole = (f.followerRole || '').toLowerCase();
//           const followingId = f.followingId?.toString();
//           return (
//             followUserId === userId &&
//             followUserRole === userRole &&
//             followingId === doctor._id.toString()
//           );
//         });
//       }
//     }

//     const postWithCreator = {
//       ...post.toObject(),
//       creator: {
//         _id: doctor?._id || post.doctor,
//         name,
//         location: city,
//         position,
//         profilePhoto: doctor?.profilePhoto || null,
//         role: doctor ? 'doctor' : 'admin'
//       },
//       isLiked,
//       isFollowed
//     };

//     return res.json(postWithCreator);
//   } catch (err) {
//     next(err);
//   }
// };
//best one
// exports.getPostById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // 1) Normalize user EXACTLY like toggleFollowDoctor
//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     const post = await Post.findById(id)
//       .populate({
//         path: "doctor",
//         select:
//           "firstName lastName address cities specialization profilePhoto clinics",
//         populate: { path: "cities", select: "name" },
//       })
//       .populate("mentions", "firstName lastName");

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const doctor = post.doctor;

//     const name = doctor
//       ? [doctor.firstName, doctor.lastName].filter(Boolean).join(" ")
//       : "Admin";

//     let city = "Not specified";

//     if (doctor) {
//       if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//         city = doctor.cities[0].name;
//       } else if (doctor.address?.city) {
//         city = doctor.address.city;
//       } else if (
//         doctor.clinics &&
//         doctor.clinics.length &&
//         doctor.clinics[0]?.address?.city
//       ) {
//         city = doctor.clinics[0].address.city;
//       }
//     }

//     const position = doctor?.specialization || "Doctor";

//     // 2) isLiked from THIS post.likes array
//     const isLiked = !!post.likes?.some((l) => {
//       const likeUserId = l.userId?.toString();
//       const likeUserRole = (l.userRole || "").toLowerCase();
//       return likeUserId === userId && likeUserRole === userRole;
//     });

//     // 3) isFollowed from the doctor’s SOCIAL doc (where toggleFollowDoctor writes)
//     let isFollowed = false;

//     console.log("GET POST userId:", userId, "userRole:", userRole);
//     console.log("GET POST doctorId:", doctor?._id?.toString());

//     if (doctor && userId && userRole) {
//       const social = await Post.findOne({ doctor: doctor._id });

//       console.log("SOCIAL DOC ID:", social?._id?.toString());
//       console.log("SOCIAL FOLLOWS:", social?.follows);

//       if (social && Array.isArray(social.follows)) {
//         isFollowed = !!social.follows.find((f) => {
//           if (!f || !f.followerId) return false;

//           const followUserId = f.followerId.toString();
//           const followUserRole = (f.followerRole || "").toLowerCase();
//           const followingId = f.followingId?.toString();

//           console.log("COMPARE FOLLOW:", {
//             followUserId,
//             followUserRole,
//             followingId,
//           });

//           return (
//             followUserId === userId &&
//             followUserRole === userRole &&
//             followingId === doctor._id.toString()
//           );
//         });
//       }
//     }

//     const postWithCreator = {
//       ...post.toObject(),
//       creator: {
//         _id: doctor?._id || post.doctor,
//         name,
//         location: city,
//         position,
//         profilePhoto: doctor?.profilePhoto || null,
//         role: doctor ? "doctor" : "admin",
//       },
//       isLiked,
//       isFollowed,
//     };

//     return res.json(postWithCreator);
//   } catch (err) {
//     next(err);
//   }
// };

exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1) Normalize user EXACTLY like toggleFollowDoctor
    const user = req.user || {};
    const rawRole = user.role || user.userRole || "";
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || "";
    const userId = userIdRaw ? userIdRaw.toString() : "";

    const post = await Post.findById(id)
      .populate({
        path: "doctor",
        select:
          "firstName lastName address cities specialization profilePhoto clinics",
        populate: { path: "cities", select: "name" },
      })
      .populate("mentions", "firstName lastName");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const doctor = post.doctor;

    const name = doctor
      ? [doctor.firstName, doctor.lastName].filter(Boolean).join(" ")
      : "Admin";

    let city = "Not specified";

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

    const position = doctor?.specialization || "Doctor";

    // 2) isLiked from THIS post.likes array
    const isLiked = !!post.likes?.some((l) => {
      const likeUserId = l.userId?.toString();
      const likeUserRole = (l.userRole || "").toLowerCase();
      return likeUserId === userId && likeUserRole === userRole;
    });

    // 3) isFollowed from the doctor’s SOCIAL doc (where toggleFollowDoctor writes)
    let isFollowed = false;

    console.log("GET POST userId:", userId, "userRole:", userRole);
    console.log("GET POST doctorId:", doctor?._id?.toString());

    if (doctor && userId && userRole) {
      const social = await Post.findOne({ doctor: doctor._id });

      console.log("SOCIAL DOC ID:", social?._id?.toString());
      console.log("SOCIAL FOLLOWS:", social?.follows);

      if (social && Array.isArray(social.follows)) {
        isFollowed = !!social.follows.find((f) => {
          if (!f || !f.followerId) return false;

          const followUserId = f.followerId.toString();
          const followUserRole = (f.followerRole || "").toLowerCase();
          const followingId = f.followingId?.toString();

          console.log("COMPARE FOLLOW:", {
            followUserId,
            followUserRole,
            followingId,
          });

          return (
            followUserId === userId &&
            followUserRole === userRole &&
            followingId === doctor._id.toString()
          );
        });
      }
    }

    const postWithCreator = {
      ...post.toObject(),
      creator: {
        _id: doctor?._id || post.doctor,
        name,
        location: city,
        position,
        profilePhoto: doctor?.profilePhoto || null,
        role: doctor ? "doctor" : "admin",
      },
      doctorId: doctor?._id || post.doctor, // <- explicit doctor id
      isLiked,
      isFollowed,
    };

    return res.json(postWithCreator);
  } catch (err) {
    next(err);
  }
};

//main
// exports.toggleLikePost = async (req, res, next) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Post not found" });
//     }

//     console.log('toggleLikePost req.user =', req.user); // debug

//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     const isAdminRole =
//       userRole === "admin" ||
//       userRole === "superadmin" ||
//       userRole === "subadmin";

//     // Admins: no like/unlike, but no 401 either
//     if (isAdminRole) {
//       return res.status(200).json({
//         success: true,
//         message: "Admins do not toggle likes on posts",
//         likes: post.stats?.likes || post.likes?.length || 0,
//         userHasLiked: false,
//       });
//     }

//     // Only fail if protect really did not attach any user
//     if (!userId || !userRole) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found on request",
//       });
//     }

//     // ---- like/unlike logic stays the same ----
//     post.likes = Array.isArray(post.likes) ? post.likes : [];

//     const existingLike = post.likes.find((like) => {
//       if (!like || !like.userId) return false;
//       const likeUserId = like.userId.toString();
//       const likeUserRole = (like.userRole || "").toLowerCase();
//       return likeUserId === userId && likeUserRole === userRole;
//     });

//     if (existingLike) {
//       post.likes = post.likes.filter((like) => {
//         if (!like || !like.userId) return true;
//         const likeUserId = like.userId.toString();
//         const likeUserRole = (like.userRole || "").toLowerCase();
//         return !(likeUserId === userId && likeUserRole === userRole);
//       });
//     } else {
//       post.likes.push({
//         userId,
//         userRole,
//         createdAt: new Date(),
//       });
//     }

//     post.stats = post.stats || {};
//     post.stats.likes = post.likes.length;

//     await post.save();

//     return res.json({
//       success: true,
//       likes: post.stats.likes,
//       userHasLiked: !existingLike,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
exports.toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    console.log('toggleLikePost req.user =', req.user);

    // 1. Robust User Data Extraction
    const user = req.user || {};
    const rawRole = user.role || user.userRole || "";
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || "";
    const userId = userIdRaw ? userIdRaw.toString() : "";

    // 2. Authorization Check
    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found on request",
      });
    }

    // 3. Initialize Likes Array
    post.likes = Array.isArray(post.likes) ? post.likes : [];

    // 4. Find Existing Like
    const existingLike = post.likes.find((like) => {
      if (!like || !like.userId) return false;
      const lUserId = like.userId.toString();
      const lUserRole = (like.userRole || "").toLowerCase();
      return lUserId === userId && lUserRole === userRole;
    });

    // 5. Toggle Logic
    if (existingLike) {
      // UNLIKE: Filter out the current user's like
      post.likes = post.likes.filter((like) => {
        if (!like || !like.userId) return true;
        const lUserId = like.userId.toString();
        const lUserRole = (like.userRole || "").toLowerCase();
        return !(lUserId === userId && lUserRole === userRole);
      });
    } else {
      // LIKE: Add new like object
      post.likes.push({
        userId,
        userRole,
        createdAt: new Date(),
      });
    }

    // 6. Update Stats and Save
    post.stats = post.stats || {};
    post.stats.likes = post.likes.length;

    await post.save();

    return res.json({
      success: true,
      likes: post.stats.likes,
      userHasLiked: !existingLike,
    });
  } catch (err) {
    next(err);
  }
};


// exports.toggleLikePost = async (req, res, next) => {
//   try {
//     console.log('🔍 req.user:', JSON.stringify(req.user?.id, req.user?.role, null, 2));
    
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).json({ success: false, message: "Post not found" });
//     }

//     // ✅ 100% TRUST protect() middleware - NO token verification here
//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     console.log('🔍 Parsed:', { userRole, userId });

//     // ✅ Admin handling (exact same as your file)
//     const isAdminRole = userRole === "admin" || userRole === "superadmin" || userRole === "subadmin";
//     if (isAdminRole) {
//       return res.status(200).json({
//         success: true,
//         message: "Admins do not toggle likes on posts",
//         likes: post.stats?.likes || post.likes?.length || 0,
//         userHasLiked: false,
//       });
//     }

//     // ✅ Only fail if protect didn't attach user
//     if (!userId || !userRole) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found on request",
//         debug: { hasUser: !!req.user, userRole, userId }
//       });
//     }

//     // ✅ ATOMIC UPDATE - FIXES city validation error
//     const existingLike = post.likes?.find(like => 
//       like?.userId?.toString() === userId && 
//       (like.userRole || '').toLowerCase() === userRole
//     );

//     const operation = existingLike 
//       ? { $pull: { likes: { userId, userRole } } }
//       : { $push: { likes: { userId, userRole, createdAt: new Date() } } };

//     const updatedPost = await Post.findByIdAndUpdate(
//       req.params.id,
//       { 
//         ...operation,
//         $set: { 
//           'stats.likes': existingLike 
//             ? Math.max(0, (post.stats?.likes || post.likes?.length || 0) - 1)
//             : (post.stats?.likes || post.likes?.length || 0) + 1 
//         }
//       },
//       { new: true, runValidators: false }
//     ).select('stats.likes');

//     res.json({
//       success: true,
//       likes: updatedPost.stats.likes,
//       userHasLiked: !existingLike,
//     });
//   } catch (err) {
//     console.error('toggleLikePost ERROR:', err);
//     next(err);
//   }
// };





// exports.toggleLikePost = async (req, res, next) => {

//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

//     const userId = req.user._id.toString();
//     const userRole = req.user.role;  // ✅ 'doctor' or 'patient'

//     const existingLike = post.likes?.find(like => 
//       like.userId.toString() === userId && like.userRole === userRole
//     );

//     if (existingLike) {
//       post.likes = post.likes.filter(like => 
//         !(like.userId.toString() === userId && like.userRole === userRole)
//       );
//     } else {
//       post.likes = post.likes || [];
//       post.likes.push({ userId: req.user._id, userRole });
//     }
    
//     post.stats.likes = post.likes.length;
//     await post.save();

//     res.json({ 
//       success: true, 
//       likes: post.stats.likes, 
//       userHasLiked: !existingLike 
//     });
//   } catch (err) { next(err); }
// };


// Toggle Follow (Doctor follows Doctor, Patient follows Doctor)
// exports.toggleFollowDoctor = async (req, res, next) => {
//   try {
//     const { targetDoctorId } = req.body;
//     const followerId = req.user._id.toString();
//     const followerRole = req.user.role;
    
//     // Find or create social doc for target doctor
//     let social = await Social.findOne({ doctor: targetDoctorId });
//     if (!social) {
//       social = new Social({ doctor: targetDoctorId });
//       await social.save();
//     }

//     const existingFollow = social.follows.find(follow => 
//       follow.followerId.toString() === followerId && 
//       follow.followerRole === followerRole
//     );

//     if (existingFollow) {
//       // Unfollow
//       social.follows = social.follows.filter(follow => 
//         !(follow.followerId.toString() === followerId && follow.followerRole === followerRole)
//       );
//     } else {
//       // Follow
//       social.follows.push({
//         followerId: req.user._id,
//         followerRole,
//         followingId: targetDoctorId
//       });
//     }
    
//     social.stats.followers = social.follows.length;
//     await social.save();

//     res.json({ 
//       success: true, 
//       action: existingFollow ? 'unfollowed' : 'followed',
//       following: !existingFollow,
//       followers: social.stats.followers 
//     });
//   } catch (err) { next(err); }
// };
//main without sync
// exports.toggleFollowDoctor = async (req, res, next) => {
//   try {
//     // 1. Find/create doc FIRST (like post = await Post.findById())
//     const { targetDoctorId } = req.body;
//     if (!targetDoctorId) {
//       return res.status(400).json({ success: false, message: "targetDoctorId required" });
//     }

//     let social = await Post.findOne({ doctor: targetDoctorId });
//     if (!social) {
//       social = new Post({
//         doctor: targetDoctorId,
//         follows: [],
//         stats: { followers: 0 },
//       });
//     }

//     // 2. EXACT user normalization (line-by-line copy)
//     console.log('toggleFollowDoctor req.user =', req.user); // debug

//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     // 3. EXACT admin check
//     const isAdminRole =
//       userRole === "admin" ||
//       userRole === "superadmin" ||
//       userRole === "subadmin";

//     if (isAdminRole) {
//       return res.status(200).json({
//         success: true,
//         message: "Admins do not follow doctors",
//         following: false,
//         followers: social.stats?.followers || social.follows?.length || 0,
//       });
//     }

//     // 4. EXACT auth check
//     if (!userId || !userRole) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found on request",
//       });
//     }

//     // 5. EXACT toggle logic pattern
//     social.follows = Array.isArray(social.follows) ? social.follows : [];

//     const existingFollow = social.follows.find((follow) => {
//       if (!follow || !follow.followerId) return false;
//       const followUserId = follow.followerId.toString();
//       const followUserRole = (follow.followerRole || "").toLowerCase();
//       return followUserId === userId && followUserRole === userRole;
//     });

//     if (existingFollow) {
//       social.follows = social.follows.filter((follow) => {
//         if (!follow || !follow.followerId) return true;
//         const followUserId = follow.followerId.toString();
//         const followUserRole = (follow.followerRole || "").toLowerCase();
//         return !(followUserId === userId && followUserRole === userRole);
//       });
//     } else {
//       social.follows.push({
//         followerId: userId,
//         followerRole: userRole,
//         followingId: targetDoctorId,
//         createdAt: new Date(),
//       });
//     }

//     // 6. EXACT stats update
//     social.stats = social.stats || {};
//     social.stats.followers = social.follows.length;

//     await social.save();

//     // 7. EXACT response shape
//     return res.json({
//       success: true,
//       action: existingFollow ? "unfollowed" : "followed",
//       following: !existingFollow,
//       followers: social.stats.followers,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

//before admin
// exports.toggleFollowDoctor = async (req, res, next) => {
//   try {
//     const { targetDoctorId } = req.body;
//     if (!targetDoctorId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "targetDoctorId required" });
//     }

//     let social = await Post.findOne({ doctor: targetDoctorId });
//     if (!social) {
//       social = new Post({
//         doctor: targetDoctorId,
//         follows: [],
//         stats: { followers: 0 },
//       });
//     }

//     console.log("toggleFollowDoctor req.user =", req.user);

//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || "";
//     const userRole = rawRole.toLowerCase();
//     const userIdRaw = user._id || user.id || user.userId || "";
//     const userId = userIdRaw ? userIdRaw.toString() : "";

//     const isAdminRole =
//       userRole === "admin" ||
//       userRole === "superadmin" ||
//       userRole === "subadmin";

//     if (isAdminRole) {
//       return res.status(200).json({
//         success: true,
//         message: "Admins do not follow doctors",
//         following: false,
//         followers: social.stats?.followers || social.follows?.length || 0,
//       });
//     }

//     if (!userId || !userRole) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: user not found on request",
//       });
//     }

//     social.follows = Array.isArray(social.follows) ? social.follows : [];

//     const existingFollow = social.follows.find((follow) => {
//       if (!follow || !follow.followerId) return false;
//       const followUserId = follow.followerId.toString();
//       const followUserRole = (follow.followerRole || "").toLowerCase();
//       return followUserId === userId && followUserRole === userRole;
//     });

//     if (existingFollow) {
//       social.follows = social.follows.filter((follow) => {
//         if (!follow || !follow.followerId) return true;
//         const followUserId = follow.followerId.toString();
//         const followUserRole = (follow.followerRole || "").toLowerCase();
//         return !(followUserId === userId && followUserRole === userRole);
//       });
//     } else {
//       social.follows.push({
//         followerId: userId,
//         followerRole: userRole,
//         followingId: targetDoctorId,
//         createdAt: new Date(),
//       });
//     }

//     social.stats = social.stats || {};
//     social.stats.followers = social.follows.length;

//     await social.save();

//     return res.json({
//       success: true,
//       action: existingFollow ? "unfollowed" : "followed",
//       following: !existingFollow,
//       followers: social.stats.followers,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
exports.toggleFollowDoctor = async (req, res, next) => {
  try {
    const { targetDoctorId } = req.body;
    if (!targetDoctorId) {
      return res
        .status(400)
        .json({ success: false, message: "targetDoctorId required" });
    }

    // Find or create social document for the doctor
    let social = await Post.findOne({ doctor: targetDoctorId });
    if (!social) {
      social = new Post({
        doctor: targetDoctorId,
        type: 'TEXT',
        follows: [],
        stats: { followers: 0 },
      });
    }

    // Normalize user
    const user = req.user || {};
    const rawRole = user.role || user.userRole || "";
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || "";
    const userId = userIdRaw ? userIdRaw.toString() : "";

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found on request",
      });
    }

    social.follows = Array.isArray(social.follows) ? social.follows : [];

    // Check if user/admin already follows
    const existingFollowIndex = social.follows.findIndex((follow) => {
      if (!follow || !follow.followerId) return false;
      const followUserId = follow.followerId.toString();
      const followUserRole = (follow.followerRole || "").toLowerCase();
      return followUserId === userId && followUserRole === userRole;
    });

    let action = "";
    let following = false;

    if (existingFollowIndex !== -1) {
      // Unfollow
      social.follows.splice(existingFollowIndex, 1);
      action = "unfollowed";
      following = false;
    } else {
      // Follow
      social.follows.push({
        followerId: userId,
        followerRole: userRole,
        followingId: targetDoctorId,
        createdAt: new Date(),
      });
      action = "followed";
      following = true;
    }

    // Update followers count
    social.stats = social.stats || {};
    social.stats.followers = social.follows.length;

    await social.save();

    if (userRole === "patient") {
      const patient = await Patient.findById(userId);
      if (patient) {
        if (!Array.isArray(patient.following)) {
          patient.following = [];
        }

        const alreadyFollowing = patient.following.some(
          (doctorId) => doctorId && doctorId.toString() === targetDoctorId.toString()
        );

        if (following && !alreadyFollowing) {
          patient.following.push(targetDoctorId);
        }

        if (!following && alreadyFollowing) {
          patient.following = patient.following.filter(
            (doctorId) => doctorId && doctorId.toString() !== targetDoctorId.toString()
          );
        }

        patient.followingCount = patient.following.length;
        await patient.save();

        if (following && !alreadyFollowing) {
          await Doctor.findByIdAndUpdate(targetDoctorId, {
            $addToSet: { followers: userId },
            $inc: { followersCount: 1 },
          });
        }

        if (!following && alreadyFollowing) {
          await Doctor.findByIdAndUpdate(targetDoctorId, {
            $pull: { followers: userId },
            $inc: { followersCount: -1 },
          });
        }
      }
    }

    return res.json({
      success: true,
      action,
      following,
      followers: social.stats.followers,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPostByIdByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Normalize user
    const user = req.user || {};
    const rawRole = user.role || user.userRole || "";
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || "";
    const userId = userIdRaw ? userIdRaw.toString() : "";

    const isAdminRole = ['admin', 'superadmin', 'subadmin'].includes(userRole);

    // Fetch post
    const post = await Post.findById(id)
      .populate({
        path: "doctor",
        select:
          "firstName lastName address cities specialization profilePhoto clinics",
        populate: { path: "cities", select: "name" },
      })
      .populate("mentions", "firstName lastName");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // If post is hidden and user is not admin, block access
    if (post.isHidden && !isAdminRole) {
      return res.status(403).json({ message: "Post is hidden" });
    }

    const doctor = post.doctor;

    const name = doctor
      ? [doctor.firstName, doctor.lastName].filter(Boolean).join(" ")
      : "Admin";

    let city = "Not specified";
    if (doctor) {
      if (doctor.cities?.length && doctor.cities[0]?.name) {
        city = doctor.cities[0].name;
      } else if (doctor.address?.city) {
        city = doctor.address.city;
      } else if (doctor.clinics?.length && doctor.clinics[0]?.address?.city) {
        city = doctor.clinics[0].address.city;
      }
    }

    const position = doctor?.specialization || "Doctor";

    // Check if user liked the post
    const isLiked = !!post.likes?.some((l) => {
      const likeUserId = l.userId?.toString();
      const likeUserRole = (l.userRole || "").toLowerCase();
      return likeUserId === userId && likeUserRole === userRole;
    });

    // Check if user follows doctor
    let isFollowed = false;
    if (doctor && userId && userRole) {
      const social = await Post.findOne({ doctor: doctor._id });
      if (social?.follows?.length) {
        isFollowed = social.follows.some((f) => {
          if (!f?.followerId) return false;
          const followUserId = f.followerId.toString();
          const followUserRole = (f.followerRole || "").toLowerCase();
          const followingId = f.followingId?.toString();
          return followUserId === userId &&
            followUserRole === userRole &&
            followingId === doctor._id.toString();
        });
      }
    }

    const postWithCreator = {
      ...post.toObject(),
      creator: {
        _id: doctor?._id || post.doctor,
        name,
        location: city,
        position,
        profilePhoto: doctor?.profilePhoto || null,
        role: doctor ? "doctor" : "admin",
      },
      doctorId: doctor?._id || post.doctor,
      isLiked,
      isFollowed,
      isHidden: post.isHidden || false, // <-- sync with toggleHidePost
    };

    return res.json(postWithCreator);
  } catch (err) {
    next(err);
  }
};


// exports.toggleFollowDoctor = async (req, res, next) => {
//   try {
//     // req.user comes from protect: { id, role, ... }
//     const userId = req.user?.id || req.user?._id;
//     const userRole = req.user?.role;

//     if (!userId || !userRole) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const { targetDoctorId } = req.body;
//     const followerId = userId.toString();
//     const followerRole = userRole;

//     // Use Post as the social stats model
//     let social = await Post.findOne({ doctor: targetDoctorId });
//     if (!social) {
//       social = new Post({
//         doctor: targetDoctorId,
//         follows: [],
//         stats: { followers: 0 },
//       });
//       await social.save();
//     }

//     const existingFollow = social.follows.find(
//       (follow) =>
//         follow?.followerId &&
//         follow.followerId.toString() === followerId &&
//         follow.followerRole === followerRole
//     );

//     if (existingFollow) {
//       // Unfollow
//       social.follows = social.follows.filter(
//         (follow) =>
//           !(
//             follow?.followerId &&
//             follow.followerId.toString() === followerId &&
//             follow.followerRole === followerRole
//           )
//       );
//     } else {
//       // Follow
//       social.follows.push({
//         followerId: userId,          // string or ObjectId
//         followerRole,
//         followingId: targetDoctorId,
//       });
//     }

//     social.stats.followers = social.follows.length;
//     await social.save();

//     res.json({
//       success: true,
//       action: existingFollow ? 'unfollowed' : 'followed',
//       following: !existingFollow,
//       followers: social.stats.followers,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// Add Comment
// exports.addComment = async (req, res, next) => {
//   try {
//     const { text } = req.body;
//     const social = await Social.findById(req.params.id);
    
//     if (!social) return res.status(404).json({ success: false, message: 'Post not found' });
    
//     social.comments.push({
//       userId: req.user._id,
//       userRole: req.user.role,
//       text: text.trim()
//     });
//     social.stats.comments = social.comments.length;
//     await social.save();

//     res.json({ success: true, totalComments: social.stats.comments });
//   } catch (err) { next(err); }
// };
exports.addComment = async (req, res, next) => {
  try {
    const { userRole } = normalizeUser(req);
    if (userRole === "patient") {
      return res.status(403).json({
        success: false,
        message: "Patients are not allowed to comment on social posts",
      });
    }

    const { text } = req.body;
    const { id } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Add comment
    post.comments.push({
      userId: req.user._id || req.user.id,
      userRole: req.user.role,
      text: text.trim()
    });
    
    post.stats.comments = post.comments.length;
    await post.save();

    // Populate just the new comment for response
    const newComment = post.comments[post.comments.length - 1];
    await post.populate('comments.userId', 'firstName lastName profilePhoto role');
    const populatedNewComment = post.comments[post.comments.length - 1];

    res.json({ 
      success: true, 
      totalComments: post.stats.comments,
      newComment: populatedNewComment 
    });
  } catch (err) {
    next(err);
  }
};
// Get Posts + Follows
exports.getSocialFeed = async (req, res, next) => {
  try {
    const { userId, userRole } = normalizeUser(req);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const sort = ["recommended", "recent", "trending"].includes(req.query.sort)
      ? req.query.sort
      : "recommended";

    if (!userId || userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view personalized feed",
      });
    }

    const patient = await Patient.findById(userId).select("following savedPosts").lean();
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const followedDoctorIds = patient.following || [];
    if (!followedDoctorIds.length) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        algorithm: {
          sort,
          inputs: ["followedDoctors", "recency", "engagement", "likes", "saves", "hashtags", "postType"],
        },
      });
    }

    const profile = await buildPatientInterestProfile(patient, userId);
    const candidateLimit = Math.min(Math.max(page * limit * 5, limit), 250);
    const postQuery = {
      doctor: { $in: followedDoctorIds },
      isHidden: false,
      hiddenAt: null,
    };

    const [socials, total] = await Promise.all([
      Post.find(postQuery)
      .populate('doctor', 'firstName lastName profilePhoto specialization')
      .sort({ createdAt: -1 })
      .limit(candidateLimit),
      Post.countDocuments(postQuery),
    ]);

    const rankedPosts = rankSocialPosts(socials, profile, sort);
    const paginatedPosts = rankedPosts.slice((page - 1) * limit, page * limit);

    const feed = paginatedPosts.map((postObject) => {
      return {
        ...postObject,
        isLiked: !!postObject.likes?.some((like) => {
          const likeUserId = like.userId?.toString();
          const likeUserRole = (like.userRole || "").toLowerCase();
          return likeUserId === userId && likeUserRole === userRole;
        }),
        isSaved: profile.savedPostIds.has(postObject._id.toString()),
      };
    });

    res.json({
      success: true,
      data: feed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      algorithm: {
        sort,
        candidateLimit,
        inputs: ["followedDoctors", "recency", "engagement", "likes", "saves", "hashtags", "postType"],
      },
    });
  } catch (err) { next(err); }
};

exports.toggleSavePost = async (req, res, next) => {
  try {
    const { userId, userRole } = normalizeUser(req);
    if (!userId || userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can save posts",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post || !isPostVisible(post)) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!post.doctor) {
      return res.status(400).json({
        success: false,
        message: "Only doctor posts can be saved",
      });
    }

    const patient = await Patient.findById(userId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    patient.savedPosts = Array.isArray(patient.savedPosts) ? patient.savedPosts : [];
    const existingIndex = patient.savedPosts.findIndex(
      (item) => item.postId?.toString() === post._id.toString()
    );

    const isSaved = existingIndex === -1;
    if (isSaved) {
      patient.savedPosts.push({ postId: post._id, savedAt: new Date() });
      post.stats = post.stats || {};
      post.stats.saves = Number(post.stats.saves || 0) + 1;
    } else {
      patient.savedPosts.splice(existingIndex, 1);
      post.stats = post.stats || {};
      post.stats.saves = Math.max(Number(post.stats.saves || 0) - 1, 0);
    }

    await Promise.all([patient.save(), post.save()]);

    res.json({
      success: true,
      saved: isSaved,
      saves: post.stats.saves,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const { userId, userRole } = normalizeUser(req);
    if (!userId || userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view saved posts",
      });
    }

    const patient = await Patient.findById(userId)
      .select("savedPosts")
      .populate({
        path: "savedPosts.postId",
        match: { isHidden: false, hiddenAt: null },
        populate: { path: "doctor", select: "firstName lastName profilePhoto specialization" },
      });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const data = (patient.savedPosts || [])
      .filter((item) => item.postId)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getMySocialNotifications = async (req, res, next) => {
  try {
    const { userId, userRole } = normalizeUser(req);
    if (!userId || userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view social notifications",
      });
    }

    const notifications = await SocialNotification.find({ recipientId: userId })
      .populate("actorId", "firstName lastName profilePhoto specialization")
      .populate("entityId", "content type mediaUrls createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};


// GET /social/follow-stats/me
// GET /social/follow-stats/me
exports.getMyFollowStats = async (req, res, next) => {
  try {
    const user = req.user || {};
    const rawRole = user.role || user.userRole || '';
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || '';
    const userId = userIdRaw ? userIdRaw.toString() : '';

    if (!userId || (userRole !== 'doctor' && userRole !== 'patient')) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and patients can view follow stats'
      });
    }

    let followers = [];
    let following = [];

    if (userRole === 'doctor') {
      // 1) Followers of this doctor: any Post doc where doctor = doctorId and follows.followingId = doctorId
      const followerPosts = await Post.find({
        doctor: userId,
        'follows.followingId': userId
      }).select('follows');

      const followerIdsSet = new Set();
      const patientFollowerIdsSet = new Set();

      followerPosts.forEach(p => {
        (p.follows || []).forEach(f => {
          if (f.followingId?.toString() === userId && f.followerId) {
            const fId = f.followerId.toString();
            const fRole = (f.followerRole || '').toLowerCase();
            if (fRole === 'patient') {
              patientFollowerIdsSet.add(fId);
            } else {
              followerIdsSet.add(fId);
            }
          }
        });
      });

      const [doctorFollowers, patientFollowers] = await Promise.all([
        Doctor.find({ _id: { $in: Array.from(followerIdsSet) } })
          .select('firstName lastName profilePhoto specialization'),
        Patient.find({ _id: { $in: Array.from(patientFollowerIdsSet) } })
          .select('firstName lastName profilePhoto')
      ]);

      // Combine followers info
      followers = [
        ...doctorFollowers.map(d => ({ ...d.toObject ? d.toObject() : d, role: 'doctor' })),
        ...patientFollowers.map(p => ({ ...p.toObject ? p.toObject() : p, role: 'patient' }))
      ];

      // 2) Following (doctors this doctor follows): any Post doc where follows.followerId = doctorId
      const followingPosts = await Post.find({
        'follows.followerId': userId,
        'follows.followerRole': 'doctor'
      }).select('doctor follows');

      const followingIdsSet = new Set();
      followingPosts.forEach(p => {
        (p.follows || []).forEach(f => {
          if (
            f.followerId?.toString() === userId &&
            f.followerRole === 'doctor' &&
            f.followingId
          ) {
            followingIdsSet.add(f.followingId.toString());
          }
        });
      });

      const followingDoctors = await Doctor.find({ _id: { $in: Array.from(followingIdsSet) } })
        .select('firstName lastName profilePhoto specialization');
      
      following = followingDoctors.map(d => ({ ...d.toObject ? d.toObject() : d, role: 'doctor' }));

    } else if (userRole === 'patient') {
      // Patients have no followers in this model (only doctors can be followed)
      followers = [];

      // Following (doctors this patient follows): any Post doc where follows.followerId = patientId
      const followingPosts = await Post.find({
        'follows.followerId': userId,
        'follows.followerRole': 'patient'
      }).select('doctor follows');

      const followingIdsSet = new Set();
      followingPosts.forEach(p => {
        (p.follows || []).forEach(f => {
          if (
            f.followerId?.toString() === userId &&
            f.followerRole === 'patient' &&
            f.followingId
          ) {
            followingIdsSet.add(f.followingId.toString());
          }
        });
      });

      const followingDoctors = await Doctor.find({ _id: { $in: Array.from(followingIdsSet) } })
        .select('firstName lastName profilePhoto specialization');
      
      following = followingDoctors.map(d => ({ ...d.toObject ? d.toObject() : d, role: 'doctor' }));
    }

    return res.json({
      success: true,
      data: {
        followersCount: followers.length,
        followingCount: following.length,
        followers,
        following
      }
    });
  } catch (err) {
    next(err);
  }
};






// exports.searchSocialPosts = async (req, res) => {
//   try {
//     const {
//       q = '',
//       type = 'all',
//       specialization,
//       city,
//       serviceId,
//       doctor,
//       page = 1,
//       limit = 10
//     } = req.query;

//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;

//     const results = {};

//     // ✅ 1. DOCTORS SEARCH
//     if (type === 'all' || type === 'doctors') {
//       const doctorQuery = { 
//         isActive: true,
//         verificationStatus: 'approved' 
//       };

//       if (q) {
//         doctorQuery.$or = [
//           { firstName: { $regex: q, $options: 'i' } },
//           { lastName: { $regex: q, $options: 'i' } },
//           { specialization: { $regex: q, $options: 'i' } },
//           { professionalBio: { $regex: q, $options: 'i' } },
//           { currentWorkplace: { $regex: q, $options: 'i' } },
//           { address: { $regex: q, $options: 'i' } }
//         ];
//       }

//       if (specialization) {
//         doctorQuery.specialization = { $regex: specialization, $options: 'i' };
//       }

//       if (city) {
//         doctorQuery.$or = [
//           { 'address.city': { $regex: city, $options: 'i' } },  // ✅ Fixed: address.city (nested)
//           { 'cities.name': { $regex: city, $options: 'i' } }
//         ];
//       }

//       const [doctors, doctorTotal] = await Promise.all([
//         Doctor.find(doctorQuery)
//           .select('_id firstName lastName email phone profilePhoto specialization currentWorkplace designation professionalBio consultationFees averageRating cities')
//           .populate('cities', 'name')
//           .limit(limitNum)
//           .skip(skip)
//           .lean(),
//         Doctor.countDocuments(doctorQuery)
//       ]);

//       results.doctors = {
//         data: doctors,
//         total: doctorTotal
//       };
//     }

//     // ✅ 2. SERVICE PROVIDERS
//     if (type === 'all' || type === 'serviceProviders') {
//       const spQuery = { 
//         isActive: true,
//         approvalStatus: 'Approved',
//         isDeleted: false
//       };

//       if (q) {
//         spQuery.$or = [
//           { firstName: { $regex: q, $options: 'i' } },
//           { lastName: { $regex: q, $options: 'i' } },
//           { ownerName: { $regex: q, $options: 'i' } },
//           { mobile: q },
//           { email: { $regex: q, $options: 'i' } },
//           { 'currentAddress.city': { $regex: q, $options: 'i' } },
//           { qualification: { $regex: q, $options: 'i' } }
//         ];
//       }

//       if (specialization) {
//         spQuery['services.specialization'] = { $regex: specialization, $options: 'i' };
//       }

//       if (city) {
//         spQuery.$or = [
//           { 'currentAddress.city': { $regex: city, $options: 'i' } },
//           { 'serviceCities.name': { $regex: city, $options: 'i' } }
//         ];
//       }

//       if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
//         spQuery['services.serviceId'] = mongoose.Types.ObjectId(serviceId);
//       }

//       const [serviceProviders, spTotal] = await Promise.all([
//         ServiceProvider.find(spQuery)
//           .select('_id firstName lastName ownerName mobile email currentAddress qualification approvalStatus serviceCities rating')
//           .populate('services.serviceId', 'name')
//           .populate('serviceCities', 'name')
//           .limit(limitNum)
//           .skip(skip)
//           .lean(),
//         ServiceProvider.countDocuments(spQuery)
//       ]);

//       results.serviceProviders = {
//         data: serviceProviders,
//         total: spTotal
//       };
//     }

//     // ✅ 3. SERVICES
//     if (type === 'all' || type === 'services') {
//       const serviceQuery = { isActive: true };

//       if (q) {
//         serviceQuery.$or = [
//           { name: { $regex: q, $options: 'i' } },
//           { description: { $regex: q, $options: 'i' } }
//         ];
//       }

//       const [services, serviceTotal] = await Promise.all([
//         Service.find(serviceQuery)
//           .select('_id name description basePrice icon image')
//           .populate('cities', 'name')
//           .limit(limitNum)
//           .skip(skip)
//           .lean(),
//         Service.countDocuments(serviceQuery)
//       ]);

//       results.services = {
//         data: services,
//         total: serviceTotal
//       };
//     }

//     // ✅ 4. POSTS
//     if (type === 'all' || type === 'posts') {
//       const postQuery = { 
//         isHidden: false,
//         hiddenAt: { $exists: false }
//       };

//       if (q) postQuery.$text = { $search: q };
//       if (doctor && mongoose.Types.ObjectId.isValid(doctor)) {
//         postQuery.doctor = mongoose.Types.ObjectId(doctor);
//       }

//       const [posts, postTotal] = await Promise.all([
//         Post.find(postQuery)
//           .select('_id doctor city type content hashtags mentions isHidden createdAt')
//           .populate('doctor', 'firstName lastName socialHandle')
//           .populate('city', 'name')
//           .limit(limitNum)
//           .skip(skip)
//           .lean(),
//         Post.countDocuments(postQuery)
//       ]);

//       results.posts = {
//         data: posts,
//         total: postTotal
//       };
//     }

//     res.json({
//       success: true,
//       data: results,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         totalResults: Object.values(results).reduce((sum, r) => sum + (r?.total || 0), 0)
//       }
//     });

//   } catch (error) {
//     console.error('❌ SearchSocialPosts ERROR:', {
//       message: error.message,
//       name: error.name,
//       models: {
//         Doctor: typeof Doctor,
//         ServiceProvider: typeof ServiceProvider,
//         Service: typeof Service,
//         Post: typeof Post
//       }
//     });
//     res.status(500).json({
//       success: false,
//       message: 'Search failed',
//       debug: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };


exports.searchSocialPosts = async (req, res) => {
  try {
    const {
      q = '',
      type = 'all',
      specialization,
      city,
      serviceId,
      doctor,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const results = {};

    //  1. DOCTORS SEARCH
    if (type === 'all' || type === 'doctors') {
      const doctorQuery = { 
        isActive: true,
        verificationStatus: 'approved' 
      };

      if (q) {
        doctorQuery.$or = [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { specialization: { $regex: q, $options: 'i' } },
          { professionalBio: { $regex: q, $options: 'i' } },
          { currentWorkplace: { $regex: q, $options: 'i' } },
          { address: { $regex: q, $options: 'i' } },
          { socialHandle: { $regex: q, $options: 'i' } } // ✅ Added social handle search
        ];
      }

      if (specialization) {
        doctorQuery.specialization = { $regex: specialization, $options: 'i' };
      }

      if (city) {
        doctorQuery.$or = [
          { 'address.city': { $regex: city, $options: 'i' } },  // ✅ Fixed: address.city (nested)
          { 'cities.name': { $regex: city, $options: 'i' } }
        ];
      }

      const [doctors, doctorTotal] = await Promise.all([
        Doctor.find(doctorQuery)
          .select('_id firstName lastName email phone profilePhoto specialization currentWorkplace designation professionalBio consultationFees averageRating cities socialHandle') // ✅ Added socialHandle to select
          .populate('cities', 'name')
          .limit(limitNum)
          .skip(skip)
          .lean(),
        Doctor.countDocuments(doctorQuery)
      ]);

      results.doctors = {
        data: doctors,
        total: doctorTotal
      };
    }

    // ✅ 2. SERVICE PROVIDERS
    if (type === 'all' || type === 'serviceProviders') {
      const spQuery = { 
        isActive: true,
        approvalStatus: 'Approved',
        isDeleted: false
      };

      if (q) {
        spQuery.$or = [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { ownerName: { $regex: q, $options: 'i' } },
          { mobile: q },
          { email: { $regex: q, $options: 'i' } },
          { 'currentAddress.city': { $regex: q, $options: 'i' } },
          { qualification: { $regex: q, $options: 'i' } },
          { socialHandle: { $regex: q, $options: 'i' } } //  Added social handle search
        ];
      }

      if (specialization) {
        spQuery['services.specialization'] = { $regex: specialization, $options: 'i' };
      }

      if (city) {
        spQuery.$or = [
          { 'currentAddress.city': { $regex: city, $options: 'i' } },
          { 'serviceCities.name': { $regex: city, $options: 'i' } }
        ];
      }

      if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
        spQuery['services.serviceId'] = mongoose.Types.ObjectId(serviceId);
      }

      const [serviceProviders, spTotal] = await Promise.all([
        ServiceProvider.find(spQuery)
          .select('_id firstName lastName ownerName mobile email currentAddress qualification approvalStatus serviceCities rating socialHandle') // ✅ Added socialHandle to select
          .populate('services.serviceId', 'name')
          .populate('serviceCities', 'name')
          .limit(limitNum)
          .skip(skip)
          .lean(),
        ServiceProvider.countDocuments(spQuery)
      ]);

      results.serviceProviders = {
        data: serviceProviders,
        total: spTotal
      };
    }

    //  3. SERVICES
    if (type === 'all' || type === 'services') {
      const serviceQuery = { isActive: true };

      if (q) {
        serviceQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ];
      }

      const [services, serviceTotal] = await Promise.all([
        Service.find(serviceQuery)
          .select('_id name description basePrice icon image')
          .populate('cities', 'name')
          .limit(limitNum)
          .skip(skip)
          .lean(),
        Service.countDocuments(serviceQuery)
      ]);

      results.services = {
        data: services,
        total: serviceTotal
      };
    }

    //  4. POSTS
    if (type === 'all' || type === 'posts') {
      const postQuery = { 
        isHidden: false,
        hiddenAt: { $exists: false }
      };

      if (q) postQuery.content = { $regex: q, $options: 'i' };
      if (doctor && mongoose.Types.ObjectId.isValid(doctor)) {
        postQuery.doctor = mongoose.Types.ObjectId(doctor);
      }

      const [posts, postTotal] = await Promise.all([
        Post.find(postQuery)
          .select('_id doctor city type content hashtags mentions isHidden createdAt')
          .populate('doctor', 'firstName lastName socialHandle')
          .populate('city', 'name')
          .limit(limitNum)
          .skip(skip)
          .lean(),
        Post.countDocuments(postQuery)
      ]);

      results.posts = {
        data: posts,
        total: postTotal
      };
    }

    res.json({
      success: true,
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalResults: Object.values(results).reduce((sum, r) => sum + (r?.total || 0), 0)
      }
    });

  } catch (error) {
    console.error(' SearchSocialPosts ERROR:', {
      message: error.message,
      name: error.name,
      models: {
        Doctor: typeof Doctor,
        ServiceProvider: typeof ServiceProvider,
        Service: typeof Service,
        Post: typeof Post
      }
    });
    res.status(500).json({
      success: false,
      message: 'Search failed',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// exports.toggleHidePost = async (req, res, next) => {
//   try {
//     const postId = req.params.id;
//     const user = req.user || {};
//     const rawRole = user.role || user.userRole || '';
//     const userRole = rawRole.toLowerCase();
//     const adminIdRaw = user._id || user.id || user.userId || '';
//     const adminId = adminIdRaw ? adminIdRaw.toString() : '';

//     const isAdminRole =
//       userRole === 'admin' ||
//       userRole === 'superadmin' ||
//       userRole === 'subadmin';

//     if (!isAdminRole || !adminId) {
//       return res
//         .status(403)
//         .json({ success: false, message: 'Only admins can toggle posts' });
//     }

//     // Handle toggle hide/unhide OR get posts
//     if (req.query.action === 'get') {
//       // Admin-only posts retrieval (includes hidden posts)
//       const posts = await Post.find()
//         .populate({
//           path: 'doctor',
//           select: 'firstName lastName address cities specialization profilePhoto clinics',
//           populate: { path: 'cities', select: 'name' }
//         })
//         .populate('mentions', 'firstName lastName')
//         .sort({ createdAt: -1 })
//         .limit(20);

//       const postsWithCreators = posts.map(post => {
//         const doctor = post.doctor;
//         const name = doctor
//           ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
//           : 'Admin';

//         let city = 'Not specified';
//         if (doctor) {
//           if (doctor.cities && doctor.cities.length && doctor.cities[0]?.name) {
//             city = doctor.cities[0].name;
//           } else if (doctor.address?.city) {
//             city = doctor.address.city;
//           } else if (
//             doctor.clinics &&
//             doctor.clinics.length &&
//             doctor.clinics[0]?.address?.city
//           ) {
//             city = doctor.clinics[0].address.city;
//           }
//         }

//         const position = doctor?.specialization || 'Doctor';

//         return {
//           ...post.toObject(),
//           creator: {
//             _id: doctor?._id || post.doctor,
//             name,
//             location: city,
//             position,
//             profilePhoto: doctor?.profilePhoto || null,
//             role: doctor ? 'doctor' : 'admin'
//           },
//           isHidden: post.isHidden || false,
//           hiddenAt: post.hiddenAt || null,
//           hiddenBy: post.hiddenBy || null
//         };
//       });

//       return res.json({
//         success: true,
//         posts: postsWithCreators,
//         total: posts.length
//       });
//     }

//     // Toggle hide/unhide functionality
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res
//         .status(404)
//         .json({ success: false, message: 'Post not found' });
//     }

//     const willHide = !post.isHidden;
//     post.isHidden = willHide;
//     post.hiddenAt = willHide ? new Date() : null;
//     post.hiddenBy = willHide ? adminId : null;

//     await post.save();

//     return res.json({
//       success: true,
//       action: willHide ? 'hidden' : 'unhidden',
//       isHidden: post.isHidden,
//       postId: post._id
//     });

//   } catch (err) {
//     next(err);
//   }
// };























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

// REPORT POST
exports.reportPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { userId, userRole } = normalizeUser(req);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for reporting is required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if duplicate report
    const existingReport = await SocialPostReport.findOne({ postId, reporterId: userId });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    // Create report
    const report = new SocialPostReport({
      postId,
      reporterId: userId,
      reporterRole: userRole,
      reason
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Post reported successfully',
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// GET FLAGGED POSTS QUEUE (Admin review queue)
exports.getFlaggedPosts = async (req, res, next) => {
  try {
    const user = req.user || {};
    const rawRole = user.role || user.userRole || '';
    const userRole = rawRole.toLowerCase();

    const isAdmin = ['admin', 'superadmin', 'subadmin'].includes(userRole);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      SocialPostReport.find(query)
        .populate({
          path: 'postId',
          populate: {
            path: 'doctor',
            select: 'firstName lastName email profilePhoto specialization'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SocialPostReport.countDocuments(query)
    ]);

    // Batch resolve reporter details
    const reporterIds = reports.map(r => r.reporterId);
    const [doctors, patients, admins] = await Promise.all([
      Doctor.find({ _id: { $in: reporterIds } }).select('firstName lastName email profilePhoto').lean(),
      Patient.find({ _id: { $in: reporterIds } }).select('firstName lastName email profilePhoto').lean(),
      Admin.find({ _id: { $in: reporterIds } }).select('firstName lastName email').lean()
    ]);

    const doctorMap = new Map(doctors.map(d => [d._id.toString(), d]));
    const patientMap = new Map(patients.map(p => [p._id.toString(), p]));
    const adminMap = new Map(admins.map(a => [a._id.toString(), a]));

    const reportsWithReporters = reports.map(report => {
      const reportObj = report.toObject();
      let reporter = null;
      const role = (report.reporterRole || '').toLowerCase();
      const idStr = report.reporterId.toString();

      if (role === 'doctor') {
        const doc = doctorMap.get(idStr);
        if (doc) {
          reporter = {
            _id: doc._id,
            name: [doc.firstName, doc.lastName].filter(Boolean).join(' '),
            email: doc.email,
            profilePhoto: doc.profilePhoto || null,
            role: 'doctor'
          };
        }
      } else if (role === 'patient') {
        const pat = patientMap.get(idStr);
        if (pat) {
          reporter = {
            _id: pat._id,
            name: [pat.firstName, pat.lastName].filter(Boolean).join(' '),
            email: pat.email,
            profilePhoto: pat.profilePhoto || null,
            role: 'patient'
          };
        }
      } else if (['admin', 'superadmin', 'subadmin'].includes(role)) {
        const adm = adminMap.get(idStr);
        if (adm) {
          reporter = {
            _id: adm._id,
            name: [adm.firstName, adm.lastName].filter(Boolean).join(' ') || 'Admin',
            email: adm.email,
            role: role
          };
        }
      }

      if (!reporter) {
        reporter = {
          _id: report.reporterId,
          name: 'Unknown User',
          role: report.reporterRole
        };
      }

      reportObj.reporter = reporter;
      return reportObj;
    });

    res.json({
      success: true,
      data: reportsWithReporters,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
};

// RESOLVE/DISMISS POST REPORT
exports.resolvePostReport = async (req, res, next) => {
  try {
    const user = req.user || {};
    const rawRole = user.role || user.userRole || '';
    const userRole = rawRole.toLowerCase();
    const adminIdRaw = user._id || user.id || user.userId || '';
    const adminId = adminIdRaw ? adminIdRaw.toString() : null;

    const isAdmin = ['admin', 'superadmin', 'subadmin'].includes(userRole);
    if (!isAdmin || !adminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { reportId } = req.params;
    const { status, resolutionNotes, hidePost } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be resolved or dismissed'
      });
    }

    const report = await SocialPostReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    report.resolutionNotes = resolutionNotes || '';
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();

    await report.save();

    // If requested, hide the post
    if (status === 'resolved' && hidePost) {
      const post = await Post.findById(report.postId);
      if (post && !post.isHidden) {
        post.isHidden = true;
        post.hiddenAt = new Date();
        post.hiddenBy = adminId;
        await post.save();
      }
    }

    res.json({
      success: true,
      message: `Report marked as ${status} successfully`,
      data: report
    });
  } catch (err) {
    next(err);
  }
};
