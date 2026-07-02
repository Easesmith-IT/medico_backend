const express = require("express");
const router = express.Router();
const favoriteController = require("../controller/favoriteController");
const { protect } = require("../middleware/auth");

router.use(protect("patient"));

router.get("/", favoriteController.getMyFavorites);
router.post("/doctor/:doctorId/toggle", favoriteController.toggleFavoriteDoctor);
router.post("/post/:postId/toggle", favoriteController.toggleSavedPost);

module.exports = router;
