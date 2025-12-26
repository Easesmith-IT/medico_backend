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

    // 2) Validate & resolve doctorId + cityId
    let doctorId = req.user._id || req.user.id;
    
    // Admin roles can override with specific doctor + city
    const isAdminRole = ['admin', 'superadmin', 'subadmin'].includes(req.user.role);
    
    if (isAdminRole) {
      if (req.body.doctorId) {
        if (!mongoose.Types.ObjectId.isValid(req.body.doctorId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid doctorId format'
          });
        }
        doctorId = req.body.doctorId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'doctorId required for admin users'
        });
      }
      
      if (!req.body.cityId) {
        return res.status(400).json({
          success: false,
          message: 'cityId required for admin users'
        });
      }
      
      if (!mongoose.Types.ObjectId.isValid(req.body.cityId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cityId format'
        });
      }
    } else {
      // Doctor users: validate they exist and get their primary city
      const doctor = await Doctor.findById(doctorId).select('cities');
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      
      if (!doctor.cities || !doctor.cities.length) {
        return res.status(400).json({
          success: false,
          message: 'Doctor must have at least one city assigned'
        });
      }
      
      // Use doctor's primary city (first one)
      req.body.cityId = doctor.cities[0]._id || doctor.cities[0];
    }

    // 3) Build post data
    const postData = {
      doctor: doctorId,
      city: req.body.cityId,  // ✅ Always set
      type,
      content: req.body.content || '',
      mediaUrls: req.file ? [`/images/${req.file.filename}`] : [],
      hashtags: Array.isArray(req.body.hashtags)
        ? req.body.hashtags
        : (req.body.hashtags
          ? String(req.body.hashtags).split(',').map(h => h.trim()).filter(Boolean)
          : []),
      mentions: Array.isArray(req.body.mentions)
        ? req.body.mentions.map(id => mongoose.Types.ObjectId(id))
        : (req.body.mentions
          ? String(req.body.mentions).split(',').map(m => m.trim()).filter(Boolean).map(id => mongoose.Types.ObjectId(id))
          : [])
    };

    // 4) Save post
    const post = new Post(postData);
    await post.save();
    await post.populate('mentions', 'firstName lastName');

    // 5) Build creator object (always from post.doctor)
    const doctor = await Doctor.findById(post.doctor)
      .select('firstName lastName address cities clinics specialization subSpecialties designation profilePhoto')
      .populate('cities', 'name');

    let creator;
    if (doctor) {
      // Name
      const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');

      // Location priority: Post.city -> Doctor.cities -> address.city -> clinic.address.city
      let city = 'Not specified';
      
      // ✅ Priority 1: Use post.city
      if (post.city) {
        city = (await City.findById(post.city).select('name').lean()).name || city;
      } 
      // Priority 2: Doctor's cities
      else if (doctor.cities?.length && doctor.cities[0]?.name) {
        city = doctor.cities[0].name;
      } 
      // Priority 3: address.city
      else if (doctor.address?.city) {
        city = doctor.address.city;
      } 
      // Priority 4: clinic.address.city
      else if (doctor.clinics?.length && doctor.clinics[0]?.address?.city) {
        city = doctor.clinics[0].address.city;
      }

      // Normalize subSpecialties
      const subSpecialties = Array.isArray(doctor.subSpecialties)
        ? doctor.subSpecialties.join(', ')
        : doctor.subSpecialties;

      // Position
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
      // Admin fallback (shouldn't happen with validation)
      creator = {
        _id: post.doctor,
        name: 'System Admin',
        location: null,
        position: null,
        profilePhoto: null,
        role: 'admin'
      };
    }

    // 6) Response
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




exports.searchSocialDoctors = async (req, res, next) => {
  try {
    const {
      q,                  // generic search: name/specialization/city
      name,               // doctor name
      specialization,     // specialization or subSpecialty
      category,           // clinic city OR service name
      city,               // clinic city specifically OR cityId
      type,               // post type filter
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // --- Build Doctor Filter ---
    const doctorFilter = {};

    // 1. Generic search (name + specialization + city)
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      doctorFilter.$or = [
        { firstName: regex },
        { lastName: regex },
        { specialization: regex },
        { subSpecialties: regex },
        { 'address.city': regex },
        { 'clinics.address.city': regex },
        // ✅ NEW: Search by city name (populated)
        { 'cities.name': regex }
      ];
    }

    // 2. Name search
    if (name && name.trim()) {
      const regex = new RegExp(name.trim(), 'i');
      doctorFilter.$or = doctorFilter.$or || [];
      doctorFilter.$or.push(
        { firstName: regex },
        { lastName: regex }
      );
    }

    // 3. Specialization search
    if (specialization && specialization.trim()) {
      const regex = new RegExp(specialization.trim(), 'i');
      doctorFilter.$or = doctorFilter.$or || [];
      doctorFilter.$or.push(
        { specialization: regex },
        { subSpecialties: regex }
      );
    }

    // 4. Category/City search
    if (category && category.trim()) {
      const regex = new RegExp(category.trim(), 'i');
      doctorFilter.$or = doctorFilter.$or || [];
      doctorFilter.$or.push(
        { 'address.city': regex },
        { 'clinics.address.city': regex },
        { 'cities.name': regex }  // ✅ NEW: Category can be city name
      );
    }

    // 5. City-specific search (✅ UPDATED - supports city name OR cityId)
    if (city && city.trim()) {
      const cityRegex = new RegExp(city.trim(), 'i');
      
      // Handle both city name and city ID
      if (city.length === 24 && /^[0-9a-fA-F]{24}$/.test(city)) {
        // ✅ City ID search (ObjectId)
        doctorFilter['cities'] = city;
      } else {
        // ✅ City name search
        doctorFilter.$or = doctorFilter.$or || [];
        doctorFilter.$or.push(
          { 'address.city': cityRegex },
          { 'clinics.address.city': cityRegex },
          { 'cities.name': cityRegex }  // ✅ NEW: Primary city search
        );
      }
    }

    // Require at least one filter
    if (Object.keys(doctorFilter).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide search params: q, name, specialization, category, or city'
      });
    }

    // --- Find matching doctors ---
    const doctors = await Doctor.find(doctorFilter)
      .select('firstName lastName specialization subSpecialties profilePhoto address cities clinics services')
      .populate('cities', 'name')  // ✅ Populates city names
      .populate('services', 'name')
      .lean();

    if (!doctors.length) {
      return res.json({ 
        success: true, 
        data: [], 
        total: 0, 
        page: pageNum, 
        limit: limitNum 
      });
    }

    const doctorIds = doctors.map(d => d._id);

    // --- Get their posts ---
    const postFilter = {
      doctor: { $in: doctorIds },
      isHidden: { $ne: true }
    };

    if (type) {
      postFilter.type = type.toUpperCase();
    }

    const [posts, total] = await Promise.all([
      Post.find(postFilter)
        .populate('doctor', 'firstName lastName specialization subSpecialties profilePhoto address cities clinics')
        .populate('mentions', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      
      Post.countDocuments(postFilter)
    ]);

    // --- Format response (✅ UPDATED city logic) ---
    const data = posts.map(post => {
      const doctor = post.doctor;
      
      // ✅ IMPROVED: Get primary city from cities array first
      let primaryCity = doctor?.cities?.[0]?.name || 
                       doctor?.address?.city || 
                       doctor?.clinics?.[0]?.address?.city ||
                       'Not specified';

      return {
        ...post,
        creator: {
          id: doctor?._id || post.doctor,
          name: [doctor?.firstName, doctor?.lastName].filter(Boolean).join(' '),
          specialization: doctor?.specialization,
          subSpecialties: doctor?.subSpecialties,
          city: primaryCity,  // ✅ Now prioritizes cities array
          profilePhoto: doctor?.profilePhoto,
          clinicsCount: doctor?.clinics?.length || 0,
          servicesCount: doctor?.services?.length || 0,
          role: 'doctor'
        }
      };
    });

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      data
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