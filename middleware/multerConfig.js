
// const multer = require("multer");
// const path = require("path");
// const crypto = require("crypto");

// const storage = multer.diskStorage({
//   destination: "/tmp", 
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 90000000 }, // 90MB
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = [
//       'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
//       'video/mp4', 'video/avi', 'video/mov', 'video/mkv','application/pdf'
//     ];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error(`Only images/videos allowed`), false);
//     }
//   }
// });

// module.exports = upload;

const multer = require("multer");
const path = require("path");

// 1. Use memory storage to capture file buffers for cloud uploads
const storage = multer.memoryStorage();

// 2. Setup file filter for security (allowing images, PDFs, and videos)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp|mp4|avi|mov|mkv/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image|pdf|video/i.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, png, webp), PDFs, and videos (mp4, avi, mov, mkv) are allowed!"));
  }
};

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit to 100MB (for video uploads)
  fileFilter: fileFilter,
});

module.exports = upload;
