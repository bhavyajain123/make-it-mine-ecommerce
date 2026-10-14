
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (
      typeof code !== "string" ||
      !code.trim() ||
      code.trim().length > 50
    ) {
      return res.status(400).json({
        message: "A valid coupon code is required",
      });
    }
    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        message: "Invalid or inactive coupon",
      });
    }

    const now = new Date();

    if (coupon.startsAt > now || coupon.expiresAt <= now) {
      return res.status(400).json({
        valid: false,
        message: "Coupon is not currently active",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        valid: false,
        message: "Coupon usage limit has been reached",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        valid: false,
        message: "Your cart is empty",
      });
    }
    
let subtotal = 0;

for (const item of cart.items) {
  if (item.product) {
    const product = await Product.findOne({
      _id: item.product,
      isActive: true
    });

    if (!product) {
      return res.status(400).json({
        valid: false,
        message: "A product in your cart is unavailable"
      });
    }

    subtotal += Number(item.priceAtAdd) * item.quantity;
  } else if (item.design) {
    // Customized gift: use the saved price in the cart.
    subtotal += Number(item.priceAtAdd) * item.quantity;
  } else {
    return res.status(400).json({
      valid: false,
      message: "A cart item has no product or saved design"
    });
  }
}

subtotal = Number(subtotal.toFixed(2));


    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
        minOrderAmount: coupon.minOrderAmount,
      });
    }

    let discount = coupon.discountType === "percentage"
      ? subtotal * coupon.discountValue / 100
      : coupon.discountValue;

    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    
    discount = Math.min(subtotal, Math.round(discount * 100) / 100);

    return res.status(200).json({
      valid: true,
      code: coupon.code,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      totalAfterDiscount: Number((subtotal - discount).toFixed(2)),
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Validate coupon error:", error.message);
    return res.status(500).json({
      message: "Unable to validate coupon",
    });
  }
};
