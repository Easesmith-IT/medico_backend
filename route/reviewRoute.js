const express = require("express");
const { protect } = require("../middleware/auth");
const reviewController = require("../controller/reviewController");

const router = express.Router();

router.post("/createReview", protect("patient","serviceprovider"), reviewController.createReview);
router.get("/listReviews", reviewController.listReviews);
router.patch("/updateReview/:id", protect("patient"), reviewController.updateReview);
router.delete("/deleteReview:id", protect("patient"), reviewController.deleteReview);
router.patch("/admin/:id/moderation", protect("admin", "superadmin", "subadmin"), reviewController.moderateReview);

module.exports = router;
