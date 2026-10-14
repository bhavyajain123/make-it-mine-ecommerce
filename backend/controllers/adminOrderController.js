const Product = require("../models/Product");
const mongoose = require("mongoose");
const Order = require("../models/Order");

const allowedTransitions = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancellation_requested: ["cancelled", "confirmed", "processing"],
  cancelled: [],
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, carrier, estimatedDelivery } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid order ID",
    });
  }

  const validStatuses = [
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
    });
  }

  if (
    status === "shipped" &&
    (typeof trackingNumber !== "string" || !trackingNumber.trim())
  ) {
    return res.status(400).json({
      message: "Tracking number is required when shipping an order",
    });
  }

  if (
    trackingNumber !== undefined &&
    typeof trackingNumber !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid tracking number",
    });
  }

  if (carrier !== undefined && typeof carrier !== "string") {
    return res.status(400).json({
      message: "Invalid carrier",
    });
  }

  let deliveryDate;

  if (estimatedDelivery !== undefined) {
    deliveryDate = new Date(estimatedDelivery);

    if (Number.isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        message: "Invalid estimated delivery date",
      });
    }
  }

  const session = await mongoose.startSession();

  try {
    let updatedOrder;

    await session.withTransaction(async () => {
     
      const order = await Order.findById(id).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      const previousStatus = order.status;
      const allowed = allowedTransitions[previousStatus] || [];

      if (!allowed.includes(status)) {
        const error = new Error(
          `Cannot change order from ${previousStatus} to ${status}`
        );
        error.statusCode = 400;
        throw error;
      }

     
      if (status === "cancelled") {
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(
            session
          );

          if (product) {
            product.stock += item.quantity;
            await product.save({ session });
          }
        }
      }

      if (trackingNumber !== undefined) {
        order.trackingNumber = trackingNumber.trim().slice(0, 100);
      }

      if (carrier !== undefined) {
        order.carrier = carrier.trim().slice(0, 100);
      }

      if (deliveryDate !== undefined) {
        order.estimatedDelivery = deliveryDate;
      }

      order.status = status;
      order.statusHistory.push({
        status,
        note:
          status === "cancelled"
            ? "Order cancelled by admin"
            : `Order status updated to ${status}`,
      });

      await order.save({ session });
      updatedOrder = order;
    });

    return res.status(200).json({
      message:
        status === "cancelled"
          ? "Order cancelled and stock restored successfully"
          : "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin status update error:", error.message);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : "Unable to update order status",
    });
  } finally {
    await session.endSession();
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "placed",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(500).json({
      message: "Unable to update order status",
    });
  }
};

