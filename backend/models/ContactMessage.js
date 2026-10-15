const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    topic: { type: String, required: true, trim: true, maxlength: 100 },
    orderNumber: { type: String, trim: true, maxlength: 60, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);