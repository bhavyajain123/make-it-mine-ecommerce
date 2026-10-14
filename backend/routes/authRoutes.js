const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  firebaseLogin,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

router.post("/firebase", firebaseLogin);
router.post("/register",register);
router.post("/login",login);
router.post("/logout",protect,logout);

router.get("/me", protect, (req, res) => {
    res.status(200).json({
        user:{
            id: req.user._id,
            name: req.user.name,
            email:req.user.email,
            phone: req.user.phone,
        },
    });
});


module.exports= router;