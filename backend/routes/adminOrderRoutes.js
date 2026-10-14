const express = require("express");
const router = express.Router();
const protect=require("../middleware/authMiddleware");
const adminOnly=require("../middleware/adminMiddleware");
const {
  updateOrderStatus,
} = require("../controllers/adminOrderController");

router.patch("/:id/status",protect,adminOnly,updateOrderStatus);
module.exports=router;

