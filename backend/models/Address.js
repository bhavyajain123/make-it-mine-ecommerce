
const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{10}$/,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
      match: /^[0-9]{6}$/,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Address", addressSchema);
