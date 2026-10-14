
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/user");
const Product = require("../models/Product");

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      paidSales,
      recentOrders,
      pendingOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber user totalAmount status paymentStatus createdAt"),
      Order.countDocuments({
        status: {
          $in: ["placed", "confirmed", "processing"],
        },
      }),
    ]);

    return res.status(200).json({
      summary: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        totalPaidSales: paidSales[0]?.total || 0,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    return res.status(500).json({
      message: "Unable to load dashboard",
    });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch orders",
    });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [users, total] = await Promise.all([
      User.find()
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch users",
    });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin products error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch products",
    });
  }
};


exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 1000000
    ) {
      return res.status(400).json({
        message: "Stock must be a whole number from 0 to 1000000",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { stock } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product stock updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update stock error:", error.message);
    return res.status(500).json({
      message: "Unable to update stock",
    });
  }
};
