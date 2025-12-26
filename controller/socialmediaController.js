// controllers/post.controller.js
const Post = require('../models/socialPostModel');
const mongoose = require('mongoose');
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
    const postData = {
      doctor: userId,
      city: cityId,
      type,
      content: req.body.content || '',
      mediaUrls: req.file ? [`/images/${req.file.filename}`] : [],
      hashtags,
      mentions,
      isHidden: false
    };

    console.log('Saving post data:', postData);

    // 7) Save post
    const post = new Post(postData);
    await post.save();

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

exports.getPosts = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role; // 'doctor' | 'patient' | 'admin' | ...

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

      const isLiked = !!post.likes?.some(
        l =>
          l.userId.toString() === userId?.toString() &&
          l.userRole === userRole
      );

      const isFollowed = !!post.follows?.some(
        f =>
          f.followerId.toString() === userId?.toString() &&
          f.followerRole === userRole &&
          f.followingId.toString() === doctor?._id?.toString()
      );

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
    });

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


exports.toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    console.log('toggleLikePost req.user =', req.user); // debug

    const user = req.user || {};
    const rawRole = user.role || user.userRole || "";
    const userRole = rawRole.toLowerCase();
    const userIdRaw = user._id || user.id || user.userId || "";
    const userId = userIdRaw ? userIdRaw.toString() : "";

    const isAdminRole =
      userRole === "admin" ||
      userRole === "superadmin" ||
      userRole === "subadmin";

    // Admins: no like/unlike, but no 401 either
    if (isAdminRole) {
      return res.status(200).json({
        success: true,
        message: "Admins do not toggle likes on posts",
        likes: post.stats?.likes || post.likes?.length || 0,
        userHasLiked: false,
      });
    }

    // Only fail if protect really did not attach any user
    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found on request",
      });
    }

    // ---- like/unlike logic stays the same ----
    post.likes = Array.isArray(post.likes) ? post.likes : [];

    const existingLike = post.likes.find((like) => {
      if (!like || !like.userId) return false;
      const likeUserId = like.userId.toString();
      const likeUserRole = (like.userRole || "").toLowerCase();
      return likeUserId === userId && likeUserRole === userRole;
    });

    if (existingLike) {
      post.likes = post.likes.filter((like) => {
        if (!like || !like.userId) return true;
        const likeUserId = like.userId.toString();
        const likeUserRole = (like.userRole || "").toLowerCase();
        return !(likeUserId === userId && likeUserRole === userRole);
      });
    } else {
      post.likes.push({
        userId,
        userRole,
        createdAt: new Date(),
      });
    }

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
    const socials = await Social.find()
      .populate('doctor', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: socials });
  } catch (err) { next(err); }
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

    if (!userId || userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can view follow stats for themselves'
      });
    }

    // 1) Followers: any Post doc where doctor = me and follows.followingId = me
    const followerPosts = await Post.find({
      doctor: userId,
      'follows.followingId': userId
    }).select('follows');

    const followerIdsSet = new Set();

    followerPosts.forEach(p => {
      (p.follows || []).forEach(f => {
        if (
          f.followingId?.toString() === userId &&
          f.followerId
        ) {
          followerIdsSet.add(f.followerId.toString());
        }
      });
    });

    const followerIds = Array.from(followerIdsSet);

    const followers = await Doctor.find({ _id: { $in: followerIds } })
      .select('firstName lastName profilePhoto specialization');

    // 2) Following: any Post doc where some follows.followerId = me
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

    const followingIds = Array.from(followingIdsSet);

    const following = await Doctor.find({ _id: { $in: followingIds } })
      .select('firstName lastName profilePhoto specialization');

    return res.json({
      success: true,
      data: {
        followersCount: followerIds.length,
        followingCount: followingIds.length,
        followers,
        following
      }
    });
  } catch (err) {
    next(err);
  }
};






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

    // ✅ 1. DOCTORS SEARCH
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
          { address: { $regex: q, $options: 'i' } }
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
          .select('_id firstName lastName email phone profilePhoto specialization currentWorkplace designation professionalBio consultationFees averageRating cities')
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
          { qualification: { $regex: q, $options: 'i' } }
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
          .select('_id firstName lastName ownerName mobile email currentAddress qualification approvalStatus serviceCities rating')
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

    // ✅ 3. SERVICES
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

    // ✅ 4. POSTS
    if (type === 'all' || type === 'posts') {
      const postQuery = { 
        isHidden: false,
        hiddenAt: { $exists: false }
      };

      if (q) postQuery.$text = { $search: q };
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
    console.error('❌ SearchSocialPosts ERROR:', {
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