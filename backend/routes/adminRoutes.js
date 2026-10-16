const express = require("express");
const router = express.Router();
const protect=require("../middleware/authMiddleware");
const adminOnly= require("../middleware/adminMiddleware");
const{
     getDashboard,
  getAllOrders,
  getAllUsers,
  getAllProducts,
  updateProductStock,
} = require("../controllers/adminController");
const {
  updateOrderStatus,
} = require("../controllers/adminOrderController");

const { getInsights, productCopy } = require("../controllers/adminAiController");
const { createRateLimiter } = require("../middleware/rateLimit");

const aiLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  key: (req) => String(req.user._id),
  message: "Too many AI requests. Please try again later.",
});


router.use(protect, adminOnly);
router.get("/dashboard", getDashboard);
router.get("/orders", getAllOrders);
router.patch("/:id/status", updateOrderStatus);
router.get("/users", getAllUsers);
router.get("/products", getAllProducts);
router.patch("/products/:id/stock", updateProductStock);
router.get("/ai/insights", aiLimit, getInsights);
router.post("/ai/product-copy", aiLimit, productCopy);

module.exports = router;

