const multer = require('multer');
const path = require('path');

// Use memory storage since we're uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv'];

  if (allowedImageMimes.includes(file.mimetype)) {
    cb(null, true);
  } else if (allowedVideoMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only images and videos are allowed. Received: ${file.mimetype}`), false);
  }
};

// Create upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

module.exports = upload;
