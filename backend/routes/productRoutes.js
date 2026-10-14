const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const{
    getProducts,
    getProductById,
    getFeaturedProducts,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
}=require("../controllers/productController");

router.get("/featured" , getFeaturedProducts);
router.get("/search", searchProducts);
router.get("/",getProducts);
router.get("/:id", getProductById);
router.post("/",protect,adminOnly,createProduct);
router.patch("/:id",protect,adminOnly,updateProduct);
router.delete("/:id" ,protect,adminOnly,deleteProduct);

module.exports = router;