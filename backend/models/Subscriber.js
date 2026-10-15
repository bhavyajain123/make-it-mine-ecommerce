const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    source: { type: String, default: "website" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriber", subscriberSchema);