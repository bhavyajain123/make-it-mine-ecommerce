
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  giftRecommendations,
  giftMessage,
  designSuggestions,
  generateDesign,
} = require("../controllers/aiController");
router.post("/gift-recommendations", protect, giftRecommendations);
router.post("/gift-message", protect, giftMessage);
router.post("/design-suggestions", protect, designSuggestions);
router.post("/generate-design", protect, generateDesign);

module.exports = router;
