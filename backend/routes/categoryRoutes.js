const express =require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/",async (req,res)=>{
    try{
        const categories = await Product.distinct("category", {
    isActive: true,
});

        res.status(200).json({categories});
    }catch(error){
        console.error(error);
        res.status(500).json({
            message:"failed to fetch categories",
        });
    }
});
module.exports = router;