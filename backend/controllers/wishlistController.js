
const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    }).populate({
      path: "products",
      match: { isActive: true },
      select: "name price images category stock",
    });

    return res.status(200).json({
      products: wishlist?.products || [],
      count: wishlist?.products?.length || 0,
    });
  } catch (error) {
    console.error("Get wishlist error:", error.message);
    return res.status(500).json({ 
        message: "Unable to fetch wishlist" ,
    });
  }
};
exports.addWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Valid productId is required",
      });
    }
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
         message: "Product not found",
         });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      {user: req.user._id },
      {$addToSet: { products: product._id } },
      {new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Product added to wishlist",
      products: wishlist.products,
    });
  } catch (error) {
    console.error("Add wishlist item error:", error.message);
    return res.status(500).json({
         message: "Unable to update wishlist",
         });
  }
};
exports.removeWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
         message: "Invalid product ID",
         });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: productId } },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({
         message: "Wishlist not found",
         });
    }

    return res.status(200).json({
      message: "Product removed from wishlist",
      products: wishlist.products,
    });
  } catch (error) {
    console.error("Remove wishlist item error:", error.message);
    return res.status(500).json({
         message: "Unable to remove product",
         });
  }
};
