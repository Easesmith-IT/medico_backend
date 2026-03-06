const express = require("express");
const multer = require("multer");
const uploadFile = require("../utils/uploadFile");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {

    const url = await uploadFile(req.file);

    res.status(200).json({
      message: "File uploaded successfully",
      url: url
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;