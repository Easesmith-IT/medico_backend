
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
      'video/mp4', 'video/avi', 'video/mov', 'video/mkv','application/pdf'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only images/videos allowed`), false);
    }
  }
});

module.exports = upload;

