const multer = require("multer");
const path  = require("path");
const fs = require("fs");
const uploadDir=path.join(
    process.cwd(),
    "uploads",
    "designs"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destinations:(req,file,cb)=>{
          cb(null, uploadDir);
    },
      filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = [".jpg", ".jpeg", ".png", ".webp"].includes(extension)
      ? extension
      : "";
       cb(null, `${Date.now()}-${require("crypto").randomUUID()}${safeExtension}`);
      },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)){
       return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
  }
  cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits:{
        fileSize:5*1024*1024,
        files:1,
    },
});