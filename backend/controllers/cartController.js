
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Design = require("../models/Design");
const validId = (id) => mongoose.isValidObjectId(id);

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });

  }
  return cart;
}
async function populateCart(cart) {
  await cart.populate({
    path: "items.product",
    select: "name price images stock isActive",
  });

  await cart.populate({
    path: "items.design",
    select: "name productType previewImage customization",
  });

  return cart;
}


exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        items: [],
        totalItems: 0,
        subtotal: 0,
      });
    }

    await populateCart(cart);
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0
    );

    const totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return res.status(200).json({
      cart,
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
    });
  } catch (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({
         message: "Unable to fetch cart", 
        });
  }
};



exports.addCartItem = async (req, res) => {
  try {
    const {
      productId,
      quantity = 1,
      size = "",
      color = "",
      designId = null,
      customPrice = null
    } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        message: "Quantity must be an integer between 1 and 100"
      });
    }

    if (typeof size !== "string" || typeof color !== "string") {
      return res.status(400).json({
        message: "Invalid size or color"
      });
    }

    let product = null;
    let design = null;

    // A valid product is required for normal store products.
    if (productId) {
      if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid productId" });
      }

      product = await Product.findOne({
        _id: productId,
        isActive: true
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: "Not enough stock available",
          availableStock: product.stock
        });
      }
    }

    // A design is optional for normal products, but must be valid
    // and owned by the logged-in user if one is supplied.
    if (designId) {
      if (!validId(designId)) {
        return res.status(400).json({ message: "Invalid designId" });
      }

      design = await Design.findOne({
        _id: designId,
        user: req.user._id
      });

      if (!design) {
        return res.status(404).json({
          message: "Saved design not found"
        });
      }

      if (
        product &&
        design.product &&
        design.product.toString() !== product._id.toString()
      ) {
        return res.status(400).json({
          message: "Design belongs to a different product"
        });
      }
    }

    // Require either a valid store product or a saved design.
    if (!product && !design) {
      return res.status(400).json({
        message: "A valid productId or designId is required"
      });
    }

   const price = product
  ? Number(product.price)
  : Number(design?.customization?.options?.totalPrice);

if (!Number.isFinite(price) || price <= 0) {
  return res.status(400).json({
    message: "Valid saved design price is required"
  });
}

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: "Valid item price is required" });
    }

    const cart = await getOrCreateCart(req.user._id);

    const existingItem = cart.items.find(item =>
      String(item.product || "") === String(product?._id || "") &&
      String(item.design || "") === String(design?._id || "") &&
      item.size === size &&
      item.color === color
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product && newQuantity > product.stock) {
        return res.status(400).json({
          message: "Requested quantity exceeds available stock",
          availableStock: product.stock
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.priceAtAdd = price;
    } else {
      cart.items.push({
        product: product?._id || null,
        design: design?._id || null,
        quantity,
        size: size.trim(),
        color: color.trim(),
        priceAtAdd: price
      });
    }

    await cart.save();
    await populateCart(cart);

    return res.status(201).json({
      message: "Item added to cart",
      cart
    });
  } catch (error) {
    console.error("Add cart item error:", error);
    return res.status(500).json({
      message: "Unable to add item to cart"
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
         message: "Invalid cart item ID",
         });
    }

    const { quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        message: "Quantity must be an integer between 1 and 100",
      });
    }
    const cart = await Cart.findOne({
         user: req.user._id ,
        });

    if (!cart) {
      return res.status(404).json({
         message: "Cart not found",
         });
    }

    const item = cart.items.id(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        message: "Cart item not found",
     });
    }

    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
      return res.status(400).json({
         message: "Product is unavailable",
         });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
        availableStock: product.stock,
      });
    }

    item.quantity = quantity;
    item.priceAtAdd = product.price;
    await cart.save();
    await populateCart(cart);
    return res.status(200).json({
      message: "Cart quantity updated",
      cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error.message);
    return res.status(500).json({ 
        message: "Unable to update cart item",
     });
  }
};
exports.removeCartItem = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
         message: "Invalid cart item ID",
         });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ 
        message: "Cart not found" ,
    });
    }
    const item = cart.items.id(req.params.id);

    if (!item) {
      return res.status(404).json({
         message: "Cart item not found" ,
        });
    }

    item.deleteOne();
    await cart.save();

    return res.status(200).json({
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    return res.status(500).json({ message: "Unable to remove cart item" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        message: "Cart is already empty",
        items: [],
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      items: [],
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    return res.status(500).json({ message: "Unable to clear cart" });
  }
};
