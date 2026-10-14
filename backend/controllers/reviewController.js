
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
         message: "Invalid product ID",
         });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
         message: "Product not found",
         });
    }

    const reviews = await Review.find({ product: id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    const summary = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      reviews,
      summary: summary[0] || {
        averageRating: 0,
        totalReviews: 0,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error.message);
    return res.status(500).json({
         message: "Unable to fetch reviews",
         });
  }
}; 
exports.createProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
         message: "Invalid product ID",
         });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    if (
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Comment is required and must be under 1000 characters",
      });
    }
    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
         message: "Product not found" ,
        });
    }
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "delivered",
      "items.product": id,
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        message: "Only customers who received this product can review it",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product: id,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product",
      });
    }
    console.error("Create review error:", error.message);
    return res.status(500).json({
         message: "Unable to submit review",
         });
  }
};
