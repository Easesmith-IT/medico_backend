const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/appError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary with /images subfolder
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Cloudinary response
 */
const uploadImageToCloudinary = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'articles/images', // Store in /articles/images folder
        public_id: `${Date.now()}-${filename.split('.')[0]}`,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(new AppError(`Cloudinary upload error: ${error.message}`, 500));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload video to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Cloudinary response
 */
const uploadVideoToCloudinary = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'articles/videos',
        public_id: `${Date.now()}-${filename.split('.')[0]}`,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(new AppError(`Cloudinary upload error: ${error.message}`, 500));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource (image, video)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error(`Error deleting from Cloudinary: ${error.message}`);
    throw new AppError(`Failed to delete file from Cloudinary: ${error.message}`, 500);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @param {Array<string>} filenames - Array of original filenames
 * @returns {Promise<Array>} Array of Cloudinary responses
 */
const uploadMultipleImagesToCloudinary = async (fileBuffers, filenames) => {
  try {
    const uploadPromises = fileBuffers.map((buffer, index) =>
      uploadImageToCloudinary(buffer, filenames[index])
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new AppError(`Failed to upload multiple images: ${error.message}`, 500);
  }
};

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  uploadMultipleImagesToCloudinary
};
