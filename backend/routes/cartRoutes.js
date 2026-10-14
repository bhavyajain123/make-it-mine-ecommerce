const express = require("express");
const router=express.Router();
const protect= require("../middleware/authMiddleware");

const{
     getCart,
      addCartItem,
      updateCartItem,
      removeCartItem,
      clearCart,
}=require("../controllers/cartController");
router.get("/", protect, getCart);
router.post("/items", protect, addCartItem);
router.patch("/items/:id", protect, updateCartItem);
router.delete("/items/:id", protect, removeCartItem);
router.delete("/", protect, clearCart);

module.exports = router;