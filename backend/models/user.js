const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
name: {
type: String,
required: true,
trim: true,
},

email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
},

// Firebase se authenticate hone wale users ke liye
firebaseUid: {
  type: String,
  unique: true,
  sparse: true,
},

// Existing JWT/password users ke liye
password: {
  type: String,
  select: false,
  required: function () {
    return !this.firebaseUid;
  },
},

phone: {
  type: String,
  default: "",
},

role: {
  type: String,
  enum: ["user", "admin"],
  default: "user",
},

},
{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);