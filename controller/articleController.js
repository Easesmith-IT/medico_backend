// const Article = require('../models/articleModel');
// const AppError = require('../utils/appError');
// const {
//   uploadImageToCloudinary,
//   uploadVideoToCloudinary,
//   deleteFromCloudinary,
//   uploadMultipleImagesToCloudinary
// } = require('../config/cloudinaryConfig');

// /**
//  * Create Article
//  */
// const createArticle = async (req, res, next) => {
//   try {
//     const { 
//       location, 
//       category,
//       tags, 
//       title, 
//       description, 
//       articleType,
//       textContent
//     } = req.body;

//     // Get user info from protect middleware
//     const createdBy = req.user._id;
//     const creatorModel = req.userModel;

//     // Validation
//     if (!location || !category || !title || !articleType) {
//       return next(new AppError('Location, category, title, and articleType are required', 400));
//     }

//     // Validate articleType
//     const validTypes = ['article', 'video', 'image'];
//     if (!validTypes.includes(articleType.toLowerCase())) {
//       return next(new AppError('Article type must be "article", "video", or "image"', 400));
//     }

//     // Parse tags
//     const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

//     const articleData = {
//       createdBy,
//       creatorModel,
//       location,
//       category,
//       tags: parsedTags,
//       title,
//       description: description || '',
//       articleType: articleType.toLowerCase(),
//       content: {}
//     };

//     // Handle content based on article type
//     if (articleType.toLowerCase() === 'article') {
//       if (!textContent) {
//         return next(new AppError('Text content is required for article type', 400));
//       }
//       articleData.content.text = textContent;
//     } 
//     else if (articleType.toLowerCase() === 'video') {
//       if (!req.file) {
//         return next(new AppError('Video file is required for video type', 400));
//       }
      
//       // Upload video to Cloudinary
//       const videoResult = await uploadVideoToCloudinary(
//         req.file.buffer,
//         req.file.originalname
//       );
      
//       articleData.content.video = {
//         url: videoResult.secure_url,
//         publicId: videoResult.public_id,
//         filename: req.file.originalname,
//         size: req.file.size,
//         duration: videoResult.duration || null
//       };
//     } 
//     else if (articleType.toLowerCase() === 'image') {
//       if (!req.files || req.files.length === 0) {
//         return next(new AppError('At least one image file is required for image type', 400));
//       }
      
//       // Upload multiple images to Cloudinary
//       const imageResults = await uploadMultipleImagesToCloudinary(
//         req.files.map(f => f.buffer),
//         req.files.map(f => f.originalname)
//       );
      
//       articleData.content.images = imageResults.map((result, index) => ({
//         url: result.secure_url,
//         publicId: result.public_id,
//         filename: req.files[index].originalname,
//         size: req.files[index].size,
//         width: result.width,
//         height: result.height
//       }));
//     }

//     // Create article in database
//     const article = await Article.create(articleData);
//     await article.populate('createdBy', 'name email specialization profileImage');

//     res.status(201).json({
//       success: true,
//       message: 'Article created successfully',
//       article
//     });

//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get all articles (PUBLIC)
//  */
// const getAllArticles = async (req, res, next) => {
//   try {
//     const { 
//       creatorId, 
//       creatorModel,
//       location, 
//       category, 
//       tags, 
//       articleType, 
//       page = 1, 
//       limit = 10 
//     } = req.query;
    
//     const filter = { status: 'published' };
    
//     if (creatorId) filter.createdBy = creatorId;
//     if (creatorModel) filter.creatorModel = creatorModel;
//     if (location) filter.location = new RegExp(location, 'i');
//     if (category) filter.category = new RegExp(category, 'i');
//     if (tags) filter.tags = { $in: tags.split(',').map(tag => tag.trim()) };
//     if (articleType) filter.articleType = articleType.toLowerCase();

//     const skip = (page - 1) * limit;

//     const articles = await Article.find(filter)
//       .populate('createdBy', 'name email specialization profileImage')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Article.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       count: articles.length,
//       total,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       articles
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get single article (PUBLIC)
//  */
// const getArticleById = async (req, res, next) => {
//   try {
//     const article = await Article.findById(req.params.id)
//       .populate('createdBy', 'name email specialization profileImage');

//     if (!article) {
//       return next(new AppError('Article not found', 404));
//     }

//     res.status(200).json({
//       success: true,
//       article
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get my articles
//  */
// const getMyArticles = async (req, res, next) => {
//   try {
//     const createdBy = req.user._id;
//     const creatorModel = req.userModel;
//     const { status } = req.query;

//     const filter = { createdBy, creatorModel };
//     if (status) filter.status = status;

//     const articles = await Article.find(filter).sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: articles.length,
//       articles
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Update article
//  */
// const updateArticle = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const createdBy = req.user._id;

//     const article = await Article.findOne({ _id: id, createdBy });

//     if (!article) {
//       return next(new AppError('Article not found or you do not have permission', 404));
//     }

//     const updateData = { ...req.body };
//     if (updateData.tags && typeof updateData.tags === 'string') {
//       updateData.tags = JSON.parse(updateData.tags);
//     }

//     const updatedArticle = await Article.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate('createdBy', 'name email specialization profileImage');

//     res.status(200).json({
//       success: true,
//       message: 'Article updated successfully',
//       article: updatedArticle
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Delete article
//  */
// const deleteArticle = async (req, res, next) => {
//   try {
//     const createdBy = req.user._id;
//     const article = await Article.findOne({ _id: req.params.id, createdBy });

//     if (!article) {
//       return next(new AppError('Article not found or you do not have permission', 404));
//     }

//     // Delete video from Cloudinary if exists
//     if (article.content.video?.publicId) {
//       await deleteFromCloudinary(article.content.video.publicId, 'video');
//     }

//     // Delete images from Cloudinary if exist
//     if (article.content.images?.length > 0) {
//       const deletePromises = article.content.images.map(img =>
//         deleteFromCloudinary(img.publicId, 'image')
//       );
//       await Promise.all(deletePromises);
//     }

//     await Article.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Article deleted successfully'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Publish article
//  */
// const publishArticle = async (req, res, next) => {
//   try {
//     const createdBy = req.user._id;
//     const article = await Article.findOneAndUpdate(
//       { _id: req.params.id, createdBy },
//       { status: 'published' },
//       { new: true }
//     ).populate('createdBy', 'name email specialization profileImage');

//     if (!article) {
//       return next(new AppError('Article not found or you do not have permission', 404));
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Article published successfully',
//       article
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   createArticle,
//   getAllArticles,
//   getArticleById,
//   getMyArticles,
//   updateArticle,
//   deleteArticle,
//   publishArticle
// };


const Article = require('../models/articleModel');
const AppError = require('../utils/appError');
const {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  uploadMultipleImagesToCloudinary
} = require('../config/cloudinaryConfig');

const createArticle = async (req, res, next) => {
  try {
    const { 
      doctorId,
      location, 
      category,
      tags, 
      title, 
      description, 
      articleType,
      textContent
    } = req.body;

    const createdBy = doctorId || req.user._id;
    const creatorModel = req.userModel;

    if (!location || !category || !title || !articleType) {
      return next(new AppError('Location, category, title, and articleType are required', 400));
    }

    if (!tags || tags.length === 0) {
      return next(new AppError('At least one tag is required', 400));
    }

    const validTypes = ['article', 'video', 'image'];
    if (!validTypes.includes(articleType.toLowerCase())) {
      return next(new AppError('Article type must be "article", "video", or "image"', 400));
    }

    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : Array.isArray(tags) ? tags : [];

    const articleData = {
      createdBy,
      creatorModel,
      location,
      category,
      tags: parsedTags,
      title,
      description: description || '',
      articleType: articleType.toLowerCase(),
      content: {}
    };

    if (articleType.toLowerCase() === 'article') {
      if (!textContent) {
        return next(new AppError('Text content is required for article type', 400));
      }
      articleData.content.text = textContent;
    } 
    else if (articleType.toLowerCase() === 'video') {
      if (!req.file) {
        return next(new AppError('Video file is required for video type', 400));
      }
      
      const videoResult = await uploadVideoToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      
      articleData.content.video = {
        url: videoResult.secure_url,
        publicId: videoResult.public_id,
        filename: req.file.originalname,
        size: req.file.size,
        duration: videoResult.duration || null
      };
    } 
    else if (articleType.toLowerCase() === 'image') {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('At least one image file is required for image type', 400));
      }
      
      const imageResults = await uploadMultipleImagesToCloudinary(
        req.files.map(f => f.buffer),
        req.files.map(f => f.originalname)
      );
      
      articleData.content.images = imageResults.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        filename: req.files[index].originalname,
        size: req.files[index].size,
        width: result.width,
        height: result.height
      }));
    }

    const article = await Article.create(articleData);
    await article.populate('createdBy', 'name email specialization profileImage');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });

  } catch (error) {
    next(error);
  }
};

const getAllArticles = async (req, res, next) => {
  try {
    const { 
      creatorId, 
      creatorModel,
      location, 
      category, 
      tags, 
      articleType, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filter = { status: 'published' };
    
    if (creatorId) filter.createdBy = creatorId;
    if (creatorModel) filter.creatorModel = creatorModel;
    if (location) filter.location = new RegExp(location, 'i');
    if (category) filter.category = new RegExp(category, 'i');
    if (tags) filter.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    if (articleType) filter.articleType = articleType.toLowerCase();

    const skip = (page - 1) * limit;

    const articles = await Article.find(filter)
      .populate('createdBy', 'name email specialization profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: articles.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      articles
    });
  } catch (error) {
    next(error);
  }
};

const getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('createdBy', 'name email specialization profileImage');

    if (!article) {
      return next(new AppError('Article not found', 404));
    }

    res.status(200).json({
      success: true,
      article
    });
  } catch (error) {
    next(error);
  }
};

const getMyArticles = async (req, res, next) => {
  try {
    const createdBy = req.user._id;
    const creatorModel = req.userModel;
    const { status } = req.query;

    const filter = { createdBy, creatorModel };
    if (status) filter.status = status;

    const articles = await Article.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    next(error);
  }
};

const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const createdBy = req.user._id;

    const article = await Article.findOne({ _id: id, createdBy });

    if (!article) {
      return next(new AppError('Article not found or you do not have permission', 404));
    }

    const updateData = { ...req.body };
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email specialization profileImage');

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

const deleteArticle = async (req, res, next) => {
  try {
    const createdBy = req.user._id;
    const article = await Article.findOne({ _id: req.params.id, createdBy });

    if (!article) {
      return next(new AppError('Article not found or you do not have permission', 404));
    }

    if (article.content.video?.publicId) {
      await deleteFromCloudinary(article.content.video.publicId, 'video');
    }

    if (article.content.images?.length > 0) {
      const deletePromises = article.content.images.map(img =>
        deleteFromCloudinary(img.publicId, 'image')
      );
      await Promise.all(deletePromises);
    }

    await Article.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const publishArticle = async (req, res, next) => {
  try {
    const createdBy = req.user._id;
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, createdBy },
      { status: 'published' },
      { new: true }
    ).populate('createdBy', 'name email specialization profileImage');

    if (!article) {
      return next(new AppError('Article not found or you do not have permission', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Article published successfully',
      article
    });
  } catch (error) {
    next(error);
  }
};



//get article by doctor id 
// PUBLIC - Get all articles by doctor ID (no auth required) //publish one
// const getArticlesByDoctorId = async (req, res, next) => {
//   try {
//     const { doctorId } = req.params;
//     const { status, page = 1, limit = 10 } = req.query;

//     const filter = { createdBy: doctorId };
    
//     // If status is not specified, only show published articles (public view)
//     if (status) {
//       filter.status = status;
//     } else {
//       filter.status = 'published';
//     }

//     const skip = (page - 1) * limit;

//     const articles = await Article.find(filter)
//       .populate('createdBy', 'name email specialization profileImage')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Article.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       count: articles.length,
//       total,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       articles
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//showing all without publish 
const getArticlesByDoctorId = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { createdBy: doctorId };
    
    // Only filter by status if explicitly provided in query
    if (status) {
      filter.status = status;
    }
    //  Removed the else block - now shows all articles by default

    const skip = (page - 1) * limit;

    const articles = await Article.find(filter)
      .populate('createdBy', 'name email specialization profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: articles.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      articles
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  getMyArticles,
  updateArticle,
  deleteArticle,
  getArticlesByDoctorId ,
  publishArticle
};
