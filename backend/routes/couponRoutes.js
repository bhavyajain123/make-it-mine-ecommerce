
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { validateCoupon } = require("../controllers/couponController");

router.post("/validate", protect, validateCoupon);
module.exports = router;
