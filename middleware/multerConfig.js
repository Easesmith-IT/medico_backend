
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
const crypto = require("crypto");
const fs = require("fs");

// 1. Define local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "temp");
    // Ensure the local 'temp' folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generates a unique name: fieldname-timestamp-randomhex.extension
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 2. Setup file filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, png, webp) and PDFs are allowed!"));
  }
};

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
  fileFilter: fileFilter,
});

module.exports = upload;
