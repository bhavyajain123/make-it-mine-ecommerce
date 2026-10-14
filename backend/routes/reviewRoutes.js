
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getProductReviews,
  createProductReview,
} = require("../controllers/reviewController");

router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);

module.exports = router;
