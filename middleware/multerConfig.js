// const multer = require('multer');
// const path = require('path');

// // Use memory storage since we're uploading to Cloudinary
// const storage = multer.memoryStorage();

// // File filter for images and videos
// const fileFilter = (req, file, cb) => {
//   const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
//   const allowedVideoMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv'];

//   if (allowedImageMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else if (allowedVideoMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Invalid file type. Only images and videos are allowed. Received: ${file.mimetype}`), false);
//   }
// };

// // Create upload instance
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024 // 100MB limit
//   }
// });

// module.exports = upload;

// Set storage engine
// middleware/multerConfig.js (COMMON for ALL images)
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: "/tmp", 
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 90000000 }, // 90MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/mkv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only images/videos allowed`), false);
    }
  }
});

module.exports = upload;

