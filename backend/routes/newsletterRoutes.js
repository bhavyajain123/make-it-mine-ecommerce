const express = require("express");
const router = express.Router();
const { subscribe } = require("../controllers/newsletterController");

// Public route: no login needed
router.post("/subscribe", subscribe);

module.exports = router;