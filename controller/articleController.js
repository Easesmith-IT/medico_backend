


const Article = require('../models/articleModel');
const AppError = require('../utils/appError');
const City = require('../models/availableCities'); 
const {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  uploadMultipleImagesToCloudinary
} = require('../config/cloudinaryConfig');

// const createArticle = async (req, res, next) => {
//   try {
//     const { 
//       doctorId,
//       location, 
//       category,
//       tags, 
//       title, 
//       description, 
//       articleType,
//       textContent
//     } = req.body;

//     const createdBy = doctorId || req.user._id;
//     const creatorModel = req.userModel;

//     if (!location || !category || !title || !articleType) {
//       return next(new AppError('Location, category, title, and articleType are required', 400));
//     }

//     if (!tags || tags.length === 0) {
//       return next(new AppError('At least one tag is required', 400));
//     }

//     const validTypes = ['article', 'video', 'image'];
//     if (!validTypes.includes(articleType.toLowerCase())) {
//       return next(new AppError('Article type must be "article", "video", or "image"', 400));
//     }

//     const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : Array.isArray(tags) ? tags : [];

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



//with filtewrs 
const createArticle = async (req, res, next) => {
  try {
    const { 
      doctorId,
      cityName,  // Changed from location to cityName
      category,
      tags, 
      title, 
      description, 
      articleType,
      textContent
    } = req.body;

    const createdBy = doctorId || req.user._id;
    const creatorModel = req.userModel;

    // Validate required fields
    if (!cityName || !category || !title || !articleType) {
      return next(new AppError('cityName, category, title, and articleType are required', 400));
    }

    // Find city by name
    const city = await City.findOne({ name: cityName.toLowerCase().trim() });
    if (!city) {
      return next(new AppError('City not found. Please provide a valid city name', 404));
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
      cityId: city._id,  // Use cityId from the found city
      category,
      tags: parsedTags,
      title,
      description: description || '',
      articleType: articleType.toLowerCase(),
      content: {}
    };

    // Handle content based on article type
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
    
    // Populate both creator and city information
    await article.populate([
      { path: 'createdBy', select: 'name email specialization profileImage' },
      { path: 'cityId', select: 'name latitude longitude' }
    ]);

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
      cityId,
      cityName,
      category, 
      tags, 
      articleType,
      longitude,
      latitude,
      maxDistance = 50000,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // REMOVED: const filter = { status: 'published' };
    const filter = {};  // Empty filter - show ALL articles
    let articles;
    let total;

    // Build basic filters
    if (creatorId) filter.createdBy = creatorId;
    if (creatorModel) filter.creatorModel = creatorModel;
    if (category) filter.category = new RegExp(category, 'i');
    if (tags) filter.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    if (articleType) filter.articleType = articleType.toLowerCase();

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // OPTION 1: Nearby search using coordinates
    if (longitude && latitude) {
      const lng = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const distance = parseInt(maxDistance);

      const nearbyCities = await City.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            maxDistance: distance,
            spherical: true
          }
        }
      ]);

      if (nearbyCities.length > 0) {
        const cityIds = nearbyCities.map(city => city._id);
        
        // Find doctors from these cities
        const Doctor = mongoose.model('Doctor');
        const doctorsInCity = await Doctor.find({ 
          cityId: { $in: cityIds } 
        }).select('_id');
        const doctorIds = doctorsInCity.map(doc => doc._id);

        filter.$or = [
          { cityId: { $in: cityIds } },
          { createdBy: { $in: doctorIds }, creatorModel: 'Doctor' }
        ];
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          articles: []
        });
      }

      articles = await Article.find(filter)
        .populate('createdBy', 'name email specialization profileImage cityId')
        .populate('cityId', 'name latitude longitude')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Article.countDocuments(filter);
    }
    // OPTION 2: Filter by specific cityId
    else if (cityId) {
      if (!mongoose.Types.ObjectId.isValid(cityId)) {
        return next(new AppError('Invalid cityId format', 400));
      }

      const Doctor = mongoose.model('Doctor');
      const doctorsInCity = await Doctor.find({ cityId }).select('_id');
      const doctorIds = doctorsInCity.map(doc => doc._id);

      filter.$or = [
        { cityId: cityId },
        { createdBy: { $in: doctorIds }, creatorModel: 'Doctor' }
      ];

      articles = await Article.find(filter)
        .populate('createdBy', 'name email specialization profileImage cityId')
        .populate('cityId', 'name latitude longitude')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Article.countDocuments(filter);
    }
    // OPTION 3: Filter by city name
    else if (cityName) {
      const city = await City.findOne({ name: cityName.toLowerCase().trim() });
      
      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      const Doctor = mongoose.model('Doctor');
      const doctorsInCity = await Doctor.find({ cityId: city._id }).select('_id');
      const doctorIds = doctorsInCity.map(doc => doc._id);

      filter.$or = [
        { cityId: city._id },
        { createdBy: { $in: doctorIds }, creatorModel: 'Doctor' }
      ];

      articles = await Article.find(filter)
        .populate('createdBy', 'name email specialization profileImage cityId')
        .populate('cityId', 'name latitude longitude')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Article.countDocuments(filter);
    }
    // OPTION 4: No city filter - get all articles
    else {
      articles = await Article.find(filter)
        .populate('createdBy', 'name email specialization profileImage cityId')
        .populate('cityId', 'name latitude longitude')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Article.countDocuments(filter);
    }

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
