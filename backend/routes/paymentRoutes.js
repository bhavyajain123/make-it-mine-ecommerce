const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { submitUpiReference } = require("../controllers/paymentController");

router.post("/upi-reference", protect, submitUpiReference);

module.exports = router;