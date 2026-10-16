
const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Design = require("../models/Design");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { geocodeAddress } = require("../services/geocode");
const dispatch = require("../config/dispatch");

const { estimateDelivery } = require("../services/deliveryEstimate");
const { sendOrderConfirmation } = require("../services/orderEmail");
const RETRY_AFTER_FAILURE_MS = 6 * 60 * 60 * 1000;
const validId = (id) => mongoose.isValidObjectId(id);

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { addressId, paymentMethod, couponCode, isGift, giftMessage } = req.body;
    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({
         message: "Valid addressId is required",
         });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "paymentMethod must be cod or online",
      });
    }
    let createdOrder;
    await session.withTransaction(async () => {
      const address = await Address.findOne({
        _id: addressId,
        user: req.user._id,
      }).session(session);

      if (!address){
        const error = new Error("Delivery address not found");
        error.statusCode = 404;
        throw error;
      }

      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your cart is empty");
        error.statusCode = 400;
        throw error;
      }

     
const orderItems = [];
let subtotal = 0;

for (const cartItem of cart.items) {
  let product = null;
  let productName = "";
  let productImage = "";
  let unitPrice = 0;

  // Case 1: Normal product
  if (cartItem.product) {
    product = await Product.findOne({
      _id: cartItem.product,
      isActive: true,
    }).session(session);

    if (!product) {
      const error = new Error(
        "A product in your cart is unavailable"
      );
      error.statusCode = 400;
      throw error;
    }

    // Check and reduce stock only for normal products
    const stockUpdate = await Product.updateOne(
      {
        _id: product._id,
        isActive: true,
        stock: { $gte: cartItem.quantity },
      },
      { $inc: { stock: -cartItem.quantity } },
      { session }
    );

    if (stockUpdate.modifiedCount !== 1) {
      const error = new Error(
        `Insufficient stock for ${product.name}`
      );
      error.statusCode = 409;
      throw error;
    }

    productName = product.name;
    productImage = product.images?.[0] || "";
    unitPrice = Number(product.price);
  }

  // Case 2: Custom-only design, without a Product
  else if (cartItem.design) {
    const design = await Design.findOne({
      _id: cartItem.design,
      user: req.user._id,
    }).session(session);

    if (!design) {
      const error = new Error(
        "Your saved design was not found"
      );
      error.statusCode = 400;
      throw error;
    }

    productName = design.name;
    productImage = design.previewImage || "";

    // Use a server-stored design price, not a client-supplied price.
    unitPrice = Number(
      design.customization?.options?.totalPrice
    );

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      const error = new Error(
        "Valid price is missing for your saved design"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Neither a product nor a design exists
  else {
    const error = new Error(
      "A cart item has no product or saved design"
    );
    error.statusCode = 400;
    throw error;
  }

  const lineTotal = unitPrice * cartItem.quantity;
  subtotal += lineTotal;

  orderItems.push({
    product: product?._id || null,
    productName,
    productImage,
    quantity: cartItem.quantity,
    size: cartItem.size,
    color: cartItem.color,
    design: cartItem.design || null,
    unitPrice,
    lineTotal,
  });
}

     
      const shippingFee = 0;

      
let discount = 0;
let appliedCouponCode = "";

if (couponCode !== undefined && couponCode !== null && couponCode !== "") {
  if (typeof couponCode !== "string" || couponCode.trim().length > 50) {
    const error = new Error("Invalid coupon code");
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = couponCode.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
  }).session(session);

  const now = new Date();

  if (!coupon || coupon.startsAt > now || coupon.expiresAt <= now) {
    const error = new Error("Invalid or expired coupon");
    error.statusCode = 400;
    throw error;
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    const error = new Error("Coupon usage limit reached");
    error.statusCode = 400;
    throw error;
  }

  if (subtotal < coupon.minOrderAmount) {
    const error = new Error(
      `Minimum order amount is ₹${coupon.minOrderAmount}`
    );
    error.statusCode = 400;
    throw error;
  }

  discount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(
    subtotal,
    Math.round(discount * 100) / 100
  );

  appliedCouponCode = coupon.code;
  const updatedCoupon = await Coupon.findOneAndUpdate(
  {
    _id: coupon._id,
    isActive: true,
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    ],
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  },
  {
    $inc: { usedCount: 1 },
  },
  {
    new: true,
    session,
  }
);

if (!updatedCoupon) {
  const error = new Error("Coupon usage limit reached or coupon expired");
  error.statusCode = 400;
  throw error;
}
}

createdOrder = new Order({
  orderNumber: `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
  user: req.user._id,
  items: orderItems,
      
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine: address.addressLine,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
       subtotal,
shippingFee,
couponCode: appliedCouponCode,
discount,
totalAmount: subtotal + shippingFee - discount,
paymentMethod,
        isGift: isGift === true,
        giftMessage:
          typeof giftMessage === "string" ? giftMessage.trim().slice(0, 500) : "",
        paymentStatus: "pending",
        status: "placed",
        statusHistory: [
          { status: "placed", note: "Order placed successfully" },
        ],
      });

      const estimate = estimateDelivery({ state: address.state });
createdOrder.estimatedDelivery = estimate.maxDate;
createdOrder.estimatedDeliveryFrom = estimate.minDate;

      await createdOrder.save({ session });

      cart.items = [];
      await cart.save({ session });
    });

       
    sendOrderConfirmation({
      to: req.user.email,
      name: req.user.name || createdOrder.shippingAddress?.fullName,
      order: createdOrder,
    }).catch((e) => console.error("Order email failed:", e.message));

    return res.status(201).json({
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Unable to create order",
    });
  } finally {
    await session.endSession();
  }
}
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);
    return res.status(500).json({ 
        message: "Unable to fetch orders",
     });
  }
};


exports.getOrderById = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ 
        message: "Invalid order ID" ,
    });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("items.design", "name productType previewImage");

    if (!order) {
      return res.status(404).json({
         message: "Order not found",
         });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Get order error:", error.message);
    return res.status(500).json({
         message: "Unable to fetch order",
         });
  }
};


exports.getOrderTracking = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const addr = order.shippingAddress || {};
    let location =
      addr.location &&
      Number.isFinite(addr.location.lat) &&
      Number.isFinite(addr.location.lng)
        ? {
            lat: addr.location.lat,
            lng: addr.location.lng,
            precision: addr.location.precision || "city",
          }
        : null;

    if (!location) {
      const failedRecently =
        addr.locationFailedAt &&
        Date.now() - new Date(addr.locationFailedAt).getTime() <
          RETRY_AFTER_FAILURE_MS;

      if (!failedRecently) {
        const found = await geocodeAddress(addr);

        await Order.updateOne(
          { _id: order._id },
          found
            ? {
                $set: {
                  "shippingAddress.location": found,
                  "shippingAddress.locationFailedAt": null,
                },
              }
            : { $set: { "shippingAddress.locationFailedAt": new Date() } }
        );

        location = found;
      }
    }

    const destination = location
      ? {
          lat: location.lat,
          lng: location.lng,
          precision: location.precision,
          label: [addr.city, addr.state].filter(Boolean).join(", "),
        }
      : null;

    return res.status(200).json({
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        estimatedDelivery: order.estimatedDelivery,
        estimatedDeliveryFrom: order.estimatedDeliveryFrom,
        createdAt: order.createdAt,
        destination,
        dispatch: {
          name: dispatch.name,
          lat: dispatch.lat,
          lng: dispatch.lng,
        },
      },
    });
  } catch (error) {
    console.error("Tracking error:", error.message);
    return res.status(500).json({ message: "Unable to fetch tracking" });
  }
};
exports.requestCancellation = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
         message: "Invalid order ID" ,
        });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
         message: "Order not found" ,
        });
    }

    if (!["placed", "confirmed", "processing"].includes(order.status)) {
      return res.status(400).json({
        message: "This order can no longer be cancelled through this endpoint",
      });
    }

    const reason =
      typeof req.body.reason === "string"
        ? req.body.reason.trim().slice(0, 500)
        : "";

    order.status = "cancellation_requested";
    order.cancellationReason = reason;
    order.cancellationRequestedAt = new Date();
    order.statusHistory.push({
      status: "cancellation_requested",
      note: reason || "Cancellation requested by customer",
    });

    await order.save();
    return res.status(200).json({
      message: "Cancellation request submitted",
      order,
    });
  } catch (error) {
    console.error("Cancellation request error:", error.message);
    return res.status(500).json({
      message: "Unable to submit cancellation request",
    });
  }
};
