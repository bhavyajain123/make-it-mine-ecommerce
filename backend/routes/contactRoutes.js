const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");

// Public route: no login needed
router.post("/", submitContact);

module.exports = router;