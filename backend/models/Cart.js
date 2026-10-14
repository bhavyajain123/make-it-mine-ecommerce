
const mongoose = require("mongoose");
const cartItemSchema = new mongoose.Schema({
 product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null
},
  quantity:{
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  size:{
    type: String,
    default: "",
    maxlength: 30,
  },

  color:{
    type: String,
    default: "",
    maxlength: 50,
  },

  design:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
    default: null,
  },

  priceAtAdd:{
    type: Number,
    required: true,
    min: 0,
  },
});


const cartSchema = new mongoose.Schema (
  {
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items:{
      type: [cartItemSchema],
      default: [],

    },
    
  },

  { timestamps: true}

);
module.exports = mongoose.model("Cart", cartSchema);
