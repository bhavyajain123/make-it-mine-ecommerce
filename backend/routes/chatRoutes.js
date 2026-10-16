const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/chatController");
const { createRateLimiter } = require("../middleware/rateLimit");

const perVisitor = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "You are sending messages too quickly. Please try again in a few minutes.",
});

const wholeSite = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 400,
  key: () => "all",
  message: "Our helper is very busy right now. Please try later or use the Contact page.",
});

// Public route. Per-visitor limit runs first so abusers never use up the site-wide limit.
router.post("/", perVisitor, wholeSite, chat);

module.exports = router;