const express = require("express");
const router= express.Router();

const protect = require("../middleware/authMiddleware");

const{
    updateProfile,
    changePassword,
}= require("../controllers/userController");

router.patch("/profile", protect,updateProfile);
router.patch("/change-password",protect,changePassword);


module.exports = router;