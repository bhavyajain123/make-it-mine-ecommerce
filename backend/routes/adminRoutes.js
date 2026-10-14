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


router.use(protect, adminOnly);
router.get("/dashboard", getDashboard);
router.get("/orders", getAllOrders);
router.patch("/:id/status", updateOrderStatus);
router.get("/users", getAllUsers);
router.get("/products", getAllProducts);
router.patch("/products/:id/stock", updateProductStock);

module.exports = router;

