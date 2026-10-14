const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadDesignImage } = require("../controllers/uploadController");


router.post(
  "/design-image",
  protect,
  upload.single("image"),
  uploadDesignImage
);
router.use((err, req, res, next) => {
    if(err instanceof require("multer").MulterError){
        return res.status(400).json({
            message:
            err.code ==="limit file size"
         ? "Image must be 5 mb or smaller"
         :err.message,
        });
        }

         if (err){
            return res.status(400).json({
                message:err.message
            })
        }
        next();
    });
    module.exports=router;
    