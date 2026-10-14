
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} = require("../controllers/wishlistController");

router.use(protect);
router.get("/", getWishlist);
router.post("/items", addWishlistItem);
router.delete("/items/:productId", removeWishlistItem);

module.exports = router;
