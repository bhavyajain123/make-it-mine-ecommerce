
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getOrderTracking,
    requestCancellation,
} = require("../controllers/orderController");

router.get("/my", protect, getMyOrders);
router.post("/", protect, createOrder);
router.get("/:id/tracking", protect, getOrderTracking);
router.patch("/:id/cancel", protect, requestCancellation);
router.get("/:id", protect, getOrderById);

module.exports = router;
