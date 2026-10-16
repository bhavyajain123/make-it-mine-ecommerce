const mongoose = require("mongoose");
const Order = require("../models/Order");

exports.submitUpiReference = async (req, res) => {
  try {
    const { orderId, reference } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Valid orderId is required" });
    }

    const ref = typeof reference === "string" ? reference.trim() : "";

    if (!/^[A-Za-z0-9]{8,35}$/.test(ref)) {
      return res.status(400).json({
        message: "Enter a valid transaction ID / UTR (8-35 letters or numbers)",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "online") {
      return res.status(400).json({ message: "This order is not an online payment" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "This order is already paid" });
    }

    const alreadyUsed = await Order.findOne({
      upiReference: ref,
      _id: { $ne: order._id },
    });

    if (alreadyUsed) {
      return res.status(409).json({
        message: "This transaction ID has already been used for another order",
      });
    }

    order.upiReference = ref;
    order.upiReferenceSubmittedAt = new Date();
    order.statusHistory.push({
      status: order.status,
      note: "UPI reference submitted, awaiting payment verification",
    });

    await order.save();

    return res.status(200).json({
      message: "Payment reference received. We'll confirm your order after verification.",
    });
  } catch (error) {
    console.error("UPI reference error:", error.message);
    return res.status(500).json({ message: "Could not save the payment reference" });
  }
};