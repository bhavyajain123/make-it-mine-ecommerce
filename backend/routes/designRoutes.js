
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    createDesign,
    getMyDesigns,
    getDesignById,
    updateDesign,
    deleteDesign,
} = require("../controllers/designController");

router.get("/my", protect, getMyDesigns);
router.post("/", protect, createDesign);
router.get("/:id", protect, getDesignById);
router.patch("/:id", protect, updateDesign);
router.delete("/:id", protect, deleteDesign);

module.exports = router;
