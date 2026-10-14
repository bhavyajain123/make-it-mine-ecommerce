
const mongoose = require("mongoose");
const orderItemSchema = new mongoose.Schema({
product: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product",
  default: null,
},

  productName:{ type: String, required: true },
  productImage:{ type: String, default: "" },
  quantity:{ type: Number, required: true, min: 1 },
  size:{ type: String, default: "" },
  color:  { type: String , default : "" },
  design:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
    default: null,
  },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
});

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items:{
      type:[orderItemSchema],
      required: true,
      validate:{
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    shippingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },
   
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      default: "",
      trim: true,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },



    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
          "shipped",
         "out_for_delivery",
         "delivered",
         "cancellation_requested",
         "cancelled",
      ],
      default: "placed",
    },
    trackingNumber: { type: String, default: "" },
    carrier: { type: String, default: "" },
    estimatedDelivery: { type: Date, default: null },

    cancellationReason: { type: String, default: "" },
    cancellationRequestedAt: { type: Date, default: null },

    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps:true }
);
module.exports = mongoose.model("Order", orderSchema);
