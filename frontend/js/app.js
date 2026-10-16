

"use strict";
import { apiRequest, getToken } from "./api.js";


const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

const makeId = () =>
  window.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;



const Store = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(`makeitmine_${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("Storage read error:", error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        `makeitmine_${key}`,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.error("Storage write error:", error);
      showToast("Unable to save data in this browser.", "error");
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(`makeitmine_${key}`);
  }
};

/* ---------- TOAST NOTIFICATIONS ---------- */

function showToast(message, type = "success") {
  let container = $("#toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");

    Object.assign(container.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "99999",
      display: "grid",
      gap: "10px",
      maxWidth: "calc(100vw - 40px)"
    });

    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.setAttribute("role", "status");

  Object.assign(toast.style, {
    padding: "13px 18px",
    borderRadius: "10px",
    background: type === "error"
      ? "#b91c1c"
      : type === "warning"
      ? "#b45309"
      : "#166534",
    color: "#ffffff",
    fontSize: "14px",
    boxShadow: "0 5px 20px rgba(0,0,0,.15)"
  });

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

/* ---------- CURRENCY ---------- */

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

/* ---------- CART MANAGEMENT ---------- */

async function syncGuestCartToBackend() {
  if (!getToken()) return false;

  const localItems = Store.get("cart", []);
  if (!localItems.length) {
    await Cart.refreshFromBackend();
    return true;
  }

  try {
    // Backend cart is the source of truth. Merge guest items into it.
    const result = await apiRequest("/cart");
    const backendItems = Cart.mapBackendItems(result);
    const syncedIds = new Set(backendItems.map(item => item.id));

    for (const item of localItems) {
      // Don't add an item again if the backend already contains it.
      if (syncedIds.has(item.id)) continue;

      await apiRequest("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: item.id,
          quantity: item.quantity || 1,
          size: item.size || "",
          color: item.color || "",
          designId: item.customization?.designId || null
        })
      });

      syncedIds.add(item.id);
    }

    await Cart.refreshFromBackend();
    return true;
  } catch (error) {
    console.error("Guest cart sync error:", error);
    showToast(error.message || "Unable to sync cart.", "error");
    return false;
  }
}


const Cart = {
  getAll() {
    return Store.get("cart", []);
  },

  getCount() {
    return this.getAll().reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  },

  getTotal() {
    return this.getAll().reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  },

  // Convert backend cart response into the format used by renderCart().
 
mapBackendItems(result) {
  const backendCart = result.cart || result;
  const items = backendCart.items || [];

  return items
    .filter(item => item.product || item.name)
    .map(item => {
      const product =
        item.product && typeof item.product === "object"
          ? item.product
          : {};

      const customization =
        item.design?.customization ||
        item.design ||
        {};

      return {
        id: String(product._id || item.productId || item._id),
        name: product.name || item.name || "Product",
        price: Number(
          item.priceAtAdd ??
          item.totalPrice ??
          product.price ??
          0
        ),
        image:
          product.images?.[0] ||
          item.previewImage ||
          "",
        category: product.category || item.productType || "",
        quantity: Number(item.quantity || 1),
        cartItemId: String(item._id || ""),
        size: item.size || "",
        color: item.color || "",
        customization: customization
      };
    });
},


  async refreshFromBackend() {
    if (!getToken()) {
      this.refresh();
      return;
    }

    try {
      const result = await apiRequest("/cart");
      const items = this.mapBackendItems(result);

      Store.set("cart", items);
      this.refresh();
    } catch (error) {
      console.error("Fetch cart error:", error);
      showToast(error.message || "Unable to load your cart.", "error");
    }
  },

  async add(product, quantity = 1) {
    
    console.log("PRODUCT RECEIVED:", product);
    console.log("PRODUCT ID:", product?.id, product?._id);

    if (!product.id || !product.name ||
        !Number.isFinite(product.price)) {
      showToast("Product information is incomplete.", "error");
      return false;
    }


    if (product.price < 0 || !Number.isInteger(quantity) ||
        quantity < 1 || quantity > 100) {
      showToast("Invalid product price or quantity.", "error");
      return false;
    }

    if (getToken()) {
      try {
        const result = await apiRequest("/cart/items", {
          method: "POST",
          body: JSON.stringify({
            productId: product.id,
            quantity,
            size: product.size || "",
            color: product.color || "",
            designId: product.customization?.designId || null
          })
        });

        const items = this.mapBackendItems(result);
        Store.set("cart", items);
        this.refresh();
        showToast(`${product.name} added to your cart.`);
        return true;
      } catch (error) {
        console.error("Add to cart error:", error);
        showToast(error.message || "Unable to add item.", "error");
        return false;
      }
    }
    const cart = this.getAll();

    const existing = cart.find(item =>
      item.id === product.id &&
      JSON.stringify(item.customization || {}) ===
      JSON.stringify(product.customization || {})
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        ...product,
        quantity,
        cartItemId: makeId()
      });
    }

    if (!Store.set("cart", cart)) return false;

    this.refresh();
    showToast(`${product.name} added to your cart.`);
    return true;
  },

  async update(cartItemId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      showToast("Quantity must be between 1 and 100.", "error");
      return false;
    }

    if (getToken()) {
      try {
        await apiRequest(
          `/cart/items/${encodeURIComponent(cartItemId)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ quantity })
          }
        );

        await this.refreshFromBackend();
        return true;
      } catch (error) {
        console.error("Update cart error:", error);
        showToast(error.message || "Unable to update quantity.", "error");
        await this.refreshFromBackend();
        return false;
      }
    }

    const cart = this.getAll();
    const item = cart.find(item => item.cartItemId === cartItemId);

    if (!item) return false;

    item.quantity = quantity;

    if (!Store.set("cart", cart)) return false;

    this.refresh();
    return true;
  },

  async remove(cartItemId) {
    if (getToken()) {
      try {
        await apiRequest(
          `/cart/items/${encodeURIComponent(cartItemId)}`,
          { method: "DELETE" }
        );

        await this.refreshFromBackend();
        showToast("Item removed from cart.");
        return true;
      } catch (error) {
        console.error("Remove cart item error:", error);
        showToast(error.message || "Unable to remove item.", "error");
        await this.refreshFromBackend();
        return false;
      }
    }

    const cart = this.getAll().filter(
      item => item.cartItemId !== cartItemId
    );

    if (!Store.set("cart", cart)) return false;

    this.refresh();
    showToast("Item removed from cart.");
    return true;
  },

  async clear() {
    if (getToken()) {
      try {
        await apiRequest("/cart", { method: "DELETE" });
      } catch (error) {
        console.error("Clear cart error:", error);
        showToast(error.message || "Unable to clear cart.", "error");
        return false;
      }
    }

    Store.set("cart", []);
    this.refresh();
    return true;
  },

  refresh() {
    $$("[data-cart-count]").forEach(element => {
      element.textContent = this.getCount();
    });

    $$("[data-cart-total]").forEach(element => {
      element.textContent = formatPrice(this.getTotal());
    });

    renderCart();
  }
};


/* ---------- WISHLIST MANAGEMENT ---------- */

const Wishlist = {
  getAll() {
    return Store.get("wishlist", []);
  },

  has(productId) {
    return this.getAll().some(item => item.id === productId);
  },

  toggle(product) {
    if (!product.id || !product.name) {
      showToast("Product information is incomplete.", "error");
      return;
    }

    const items = this.getAll();
    const index = items.findIndex(item => item.id === product.id);

    if (index >= 0) {
      items.splice(index, 1);
      showToast("Removed from wishlist.");
    } else {
      items.push(product);
      showToast("Added to wishlist.");
    }

    if (!Store.set("wishlist", items)) return;

    this.refresh();
  },

  remove(productId) {
    Store.set(
      "wishlist",
      this.getAll().filter(item => item.id !== productId)
    );

    this.refresh();
    showToast("Removed from wishlist.");
  },

  refresh() {
    const items = this.getAll();

    $$("[data-wishlist-count]").forEach(element => {
      element.textContent = items.length;
    });

    $$("[data-wishlist-toggle]").forEach(button => {
      const productId = button.dataset.productId ||
        button.closest("[data-product-id]")?.dataset.productId;

      const active = this.has(productId);

      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderWishlist();
  }
};



function getProductFromElement(element) {
const card = element.closest(".product-card") || element;

const id = card.dataset.productId || element.dataset.productId || "";
const name = card.dataset.productName ||
card.querySelector(".product-title")?.textContent?.trim() || "";

const priceText = card.dataset.productPrice ||
card.querySelector(".current-price")?.textContent ||
card.querySelector(".product-price")?.textContent || "";

const price = Number(String(priceText).replace(/[^0-9.]/g, ""));

const image = card.dataset.productImage ||
card.querySelector("img")?.getAttribute("src") || "";

return {
id,
name,
price,
image,
category: card.dataset.category || "",
customization: {}
};
}


function initProductActions() {
  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-to-cart]");

    if (addButton) {
      console.log("ADD BUTTON CLICKED");
      event.preventDefault();

      const product = getProductFromElement(addButton);

      const quantityInput = $("[data-product-quantity]") ||
        $("#quantity");

      const quantity = Math.max(
        1,
        Math.floor(Number(quantityInput?.value) || 1)
      );
        console.log("PRODUCT DATA:", product);
  console.log("PRODUCT ID:", product?.id, product?._id);

      Cart.add(product, quantity);
      return;
    }

  

    const wishlistButton = event.target.closest(
      "[data-wishlist-toggle]"
    );

    if (wishlistButton) {
      event.preventDefault();

      const product = getProductFromElement(wishlistButton);
      Wishlist.toggle(product);
      return;
    }

    const removeCartButton = event.target.closest(
      "[data-remove-cart-item]"
    );

    if (removeCartButton) {
      event.preventDefault();
      Cart.remove(removeCartButton.dataset.removeCartItem);
      return;
    }

    const removeWishlistButton = event.target.closest(
      "[data-remove-wishlist-item]"
    );

    if (removeWishlistButton) {
      event.preventDefault();
      Wishlist.remove(removeWishlistButton.dataset.removeWishlistItem);
    }
  });
  
document.addEventListener("change", event => {
  const input = event.target.closest("[data-cart-quantity]");
  if (!input) return;

  const cartItemId = input.dataset.cartQuantity;
  const quantity = Number(input.value);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    showToast("Enter a quantity between 1 and 100.", "error");
    Cart.refresh();
    return;
  }

  Cart.update(cartItemId, quantity);
});

}



function renderCart() {
  const container = $("[data-cart-items]");
  if (!container) return;

  const items = Cart.getAll();
  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your cart is empty. Find a gift you love!";
    container.appendChild(empty);

    $$("[data-cart-subtotal]").forEach(element => {
      element.textContent = formatPrice(0);
    });

    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.cartItemId = item.cartItemId;

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.name;
      image.width = 80;
      image.loading = "lazy";
      row.appendChild(image);
    }

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = item.name;

    const price = document.createElement("p");
    price.textContent = formatPrice(item.price);

    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "100";
    quantity.value = item.quantity;
    quantity.setAttribute("aria-label", `Quantity for ${item.name}`);
    quantity.dataset.cartQuantity = item.cartItemId;

    const subtotal = document.createElement("p");
    subtotal.textContent = formatPrice(item.price * item.quantity);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.removeCartItem = item.cartItemId;

    details.append(title, price, quantity, subtotal, remove);
    row.appendChild(details);
    container.appendChild(row);
  });

  $$("[data-cart-subtotal]").forEach(element => {
    element.textContent = formatPrice(Cart.getTotal());
  });
}

function initCartQuantityChanges() {
  document.addEventListener("change", event => {
    const input = event.target.closest("[data-cart-quantity]");
    if (!input) return;

    const quantity = Math.floor(Number(input.value));

    if (!Number.isFinite(quantity) || quantity < 1) {
      showToast("Enter a quantity of at least 1.", "warning");
      input.value = "1";
      return;
    }

    Cart.update(input.dataset.cartQuantity, quantity);
  });
}

/* ---------- WISHLIST PAGE RENDERING ---------- */

function renderWishlist() {
  const container = $("[data-wishlist-items]");
  if (!container) return;

  const items = Wishlist.getAll();
  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your wishlist is empty.";
    container.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "wishlist-item";

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.name;
      image.width = 100;
      image.loading = "lazy";
      card.appendChild(image);
    }

    const title = document.createElement("h3");
    title.textContent = item.name;

    const price = document.createElement("p");
    price.textContent = formatPrice(item.price);

    const add = document.createElement("button");
    add.type = "button";
    add.textContent = "Add to Cart";
    add.dataset.wishlistAdd = item.id;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.removeWishlistItem = item.id;

    card.append(title, price, add, remove);
    container.appendChild(card);
  });
}

function initWishlistActions() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-wishlist-add]");
    if (!button) return;

    const product = Wishlist.getAll().find(
      item => item.id === button.dataset.wishlistAdd
    );

    if (product && Cart.add(product)) {
      Wishlist.remove(product.id);
    }
  });
}

/* ---------- PRODUCT SEARCH ---------- */

function initProductSearch() {
  const inputs = $$("[data-product-search]");

  inputs.forEach(input => {
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();

      $$("[data-product-id]").forEach(card => {
        const text = [
          card.dataset.productName,
          card.dataset.category,
          card.textContent
        ].join(" ").toLowerCase();

        card.hidden = !text.includes(query);
      });
    });
  });
}

/* ---------- CATEGORY FILTER ---------- */

function initCategoryFilters() {
  $$("[data-category-filter]").forEach(control => {
    control.addEventListener("change", () => {
      const category = control.value.trim().toLowerCase();

      $$("[data-product-id]").forEach(card => {
        const productCategory = (
          card.dataset.category || ""
        ).toLowerCase();

        card.hidden =
          category !== "all" &&
          category !== "" &&
          productCategory !== category;
      });
    });
  });
}

/* ---------- GIFT CUSTOMIZATION ---------- */

function initCustomization() {
  const form = $("[data-customize-form]");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const productId = data.productId ||
      form.dataset.productId;

    const name = data.productName ||
      form.dataset.productName;

    const price = Number(data.productPrice ||
      form.dataset.productPrice);

    if (!productId || !name || !Number.isFinite(price)) {
      showToast("Please select a valid product first.", "error");
      return;
    }

    const customization = {
      recipientName: String(data.recipientName || "").trim(),
      message: String(data.message || "").trim(),
      color: String(data.color || "").trim(),
      font: String(data.font || "").trim(),
      occasion: String(data.occasion || "").trim()
    };

    const product = {
      id: productId,
      name,
      price,
      image: form.dataset.productImage || "",
      customization
    };

    if (Cart.add(product)) {
      showToast("Your personalized gift is ready for the cart!");
    }
  });
}

async function sendOrderEmail({ email, name, orderId, items, total, paymentMethod }) {
  if (!email) return;

  try {
    await fetch("/api/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true, // redirect ke baad bhi request cancel nahi hogi
      body: JSON.stringify({
        email,
        name,
        orderId,
        items: items.map(i => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        total,
        paymentMethod
      })
    });
  } catch (error) {
    // Email fail hone par order fail nahi hona chahiye
    console.error("Order email failed:", error);
  }
}

/* ---------- CHECKOUT ---------- */


function initCheckout() {
  const form = $("[data-checkout-form]");
  if (!form || form.dataset.backendBound === "true") return;

  form.dataset.backendBound = "true";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

       if (!getToken()) {
      showToast("Please login before placing your order.", "error");
      window.location.href = "login.html";
      return;
    }

    // UPI order already placed? Bring the QR back instead of creating another order.
    window.__upi = window.__upi || {};
    const selectedPayment = form.querySelector(
      'input[name="payment"]:checked'
    )?.value;

    if (selectedPayment === "upi" && window.__upi.orderId) {
      const existingPanel = document.getElementById("upiPaymentPanel");
      if (existingPanel) {
        existingPanel.hidden = false;
        existingPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      showToast("Your order is placed. Please pay using the QR and submit your transaction ID.");
      return;
    }

    await Cart.refreshFromBackend();


    const cart = Cart.getAll();

    if (!cart.length) {
      showToast("Your cart is empty.", "error");
      return;
    }

    const getValue = id =>
      document.getElementById(id)?.value?.trim() || "";

    const firstName = getValue("firstName");
    const lastName = getValue("lastName");
    const fullName = `${firstName} ${lastName}`.trim();

    const phone = getValue("phone");
    const addressLine = getValue("address");
    const landmark = getValue("landmark");
    const city = getValue("city");
    const state = getValue("state");
    const postalCode = getValue("pincode");
    const addressType = getValue("addressType").toLowerCase() || "home";
    const email = getValue("email");

    if (!/^\d{10}$/.test(phone)) {
      showToast("Enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (!/^\d{6}$/.test(postalCode)) {
      showToast("Enter a valid 6-digit PIN code.", "error");
      return;
    }

    const payment = form.querySelector(
      'input[name="payment"]:checked'
    )?.value;
    console.log("Selected payment:", payment);

    if (!payment) {
      showToast("Please select a payment method.", "error");
      return;
    }

    // The backend currently accepts only "cod" or "online".
    const paymentMethod = payment === "cod" ? "cod" : "online";

    const submitButton = $("#placeOrder", form);
    if (submitButton) submitButton.disabled = true;

    try {
      // 1. Save delivery address.
      const addressResult = await apiRequest("/addresses", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          phone,
          addressLine,
          landmark,
          city,
          state,
          postalCode,
          country: "India",
          addressType,
          isDefault: false
        })
      });

      // Support common address response formats.
      const address = addressResult.address ||
        addressResult.data ||
        addressResult;

      const addressId = address?._id || address?.id;

      if (!addressId) {
        throw new Error(
          "Address was submitted, but its ID was not returned. Check the address API response."
        );
      }

      // 2. Create the order from the backend cart.
      const orderResult = await apiRequest("/orders", {
        method: "POST",
               body: JSON.stringify({
          addressId,
          paymentMethod,
          isGift: !!document.getElementById("giftOrder")?.checked,
          giftMessage: getValue("giftMessage") || undefined,
          couponCode: getValue("couponInput") || undefined
        })
      });

     
    
      const order = orderResult.order || orderResult.data || orderResult;
      const orderId = order._id || order.id || order.orderNumber;

      if (!orderId) {
        throw new Error("Order ID was not returned by the server.");
      }

          if (payment === "cod") {
        sessionStorage.setItem(
          "makeitmine_last_order_id",
          String(orderId)
        );

        // ✅ NEW: confirmation email (cart khali hone se pehle, redirect se pehle)
        

        await Cart.refreshFromBackend();

        showToast("Order placed successfully!");

        window.location.href =
          `order-success.html?orderId=${encodeURIComponent(orderId)}`;

        return;
      }

      // UPI: show QR on the checkout page.
      if (payment === "upi") {
        const upiPanel = document.getElementById("upiPaymentPanel");
        const upiAmount = document.getElementById("upiAmount");
        console.log("Selected payment:", payment);
console.log("UPI panel found:", !!upiPanel);

        if (!upiPanel) {
          throw new Error(
            "UPI QR panel missing. Add it to checkout.html first."
          );
        }

        sessionStorage.setItem(
          "mim_pending_upi_order",
          String(orderId)
        );

        if (upiAmount) {
          const total =
            order.totalAmount ??
            order.total ??
            order.finalAmount;

          upiAmount.textContent =
            total != null
              ? `Please pay ₹${Number(total).toFixed(2)}`
              : "Please pay the final amount shown in your order summary.";
        }

        upiPanel.hidden = false;
        upiPanel.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        showToast("Scan the QR code to pay.");
        return;
      }

      throw new Error("Please select COD or UPI.");

    } catch (error) {
      console.error("Checkout error:", error);

      showToast(
        error.message || "Unable to place your order.",
        "error"
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}


/* ---------- REFUND REQUEST ---------- */

function initRefundRequest() {
  const form = $("[data-refund-form]");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const details = Object.fromEntries(formData.entries());

    const orderId = String(details.orderId || "").trim();
    const reason = String(details.reason || "").trim();

    if (!orderId || !reason) {
      showToast("Please enter your order ID and refund reason.", "error");
      return;
    }

    const requests = Store.get("refundRequests", []);

    const request = {
      id: `REF-${Date.now()}`,
      orderId,
      reason,
      details,
      status: "Submitted",
      createdAt: new Date().toISOString()
    };

    requests.unshift(request);

    if (!Store.set("refundRequests", requests)) return;

    form.reset();

    const result = $("[data-refund-confirmation]");

    if (result) {
      result.textContent =
        `Demo refund request ${request.id} saved in this browser.`;
      result.hidden = false;
    }

    showToast("Refund request saved successfully.");
  });
}

/* ---------- LOGIN / REGISTER DEMO ---------- */


function initAuthForms() {
  $$("form[data-auth-form]").forEach((form) => {
    if (form.dataset.backendBound === "true") return;
    form.dataset.backendBound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = Object.fromEntries(new FormData(form).entries());
      const type = form.dataset.authForm;
      const button = form.querySelector('[type="submit"]');

      if (type === "register" &&
          data.password !== data.confirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }

      try {
        if (button) button.disabled = true;

        const endpoint =
          type === "register" ? "/auth/register" : "/auth/login";

        const payload = {
          email: String(data.email || "").trim(),
          password: data.password,
        };

        if (type === "register") {
          payload.name = String(
            data.name || data.fullName || ""
          ).trim();
        }

        const result = await apiRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!result.token) {
          throw new Error("Backend did not return a login token.");
        }

        localStorage.setItem("mim_token", result.token);

        if (result.user) {
          localStorage.setItem(
            "makeitmine_user",
            JSON.stringify(result.user)
          );
        }

        
showToast(
  type === "register"
    ? "Account created successfully!"
    : "Login successful!"
);

// Sync the guest cart after authentication.
const synced = await syncGuestCartToBackend();

if (!synced) {
  console.warn("Cart sync did not complete. Continuing to profile.");
}

location.href = "profile.html";

      } catch (error) {
        console.error("Authentication error:", error);
        showToast(error.message || "Authentication failed.", "error");
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
}


/* ---------- PASSWORD VISIBILITY ---------- */

function initPasswordToggles() {
  $$("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.passwordToggle);
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";

      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
    });
  });
}

/* ---------- MOBILE NAVIGATION ---------- */

function initMobileNavigation() {
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

/* ---------- NEWSLETTER DEMO ---------- */

function initNewsletter() {
  $$("form[data-newsletter-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const email = String(
        new FormData(form).get("email") || ""
      ).trim().toLowerCase();

      if (!email) {
        showToast("Please enter your email.", "warning");
        return;
      }

      const subscribers = Store.get("newsletter", []);

      if (!subscribers.includes(email)) {
        subscribers.push(email);

        if (!Store.set("newsletter", subscribers)) return;
      }

      form.reset();
      showToast("Email saved for the newsletter demo.");
    });
  });
}



function initCurrentYear() {
  $$("[data-current-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initProductActions();
  initCartQuantityChanges();
  initWishlistActions();
  initProductSearch();
  initCategoryFilters();
  initCustomization();
  initCheckout();
  initRefundRequest();
  initAuthForms();
  initPasswordToggles();
  initMobileNavigation();
  initNewsletter();
  initCurrentYear();

  Cart.refresh();
  Wishlist.refresh();

  console.log("MakeItMine application initialized.");
});


window.MakeItMine = {
  Store,
  Cart,
  Wishlist,
  showToast,
  formatPrice,
  apiRequest
};
function setupAccountLink() {
  const loggedIn = Boolean(localStorage.getItem("mim_token"));
  const target = loggedIn ? "profile.html" : "login.html";
  const label = loggedIn ? "My account" : "Log in";

  // Agar header mein Account link pehle se hai to bas uska link aur label sahi kar do
  const existing = document.querySelector(
    'header a[aria-label="Account"], header a[aria-label="My account"], header a.account-link, header a[href="login.html"], header a[href="profile.html"]'
  );

  if (existing) {
    existing.href = target;
    existing.setAttribute("aria-label", label);
    existing.title = label;
    return;
  }

  // Nahi hai to wishlist icon ke bagal mein naya Account icon jodo, usi style mein
  const wishlistLink = document.querySelector('header a[href*="wishlist"]');
  if (!wishlistLink) return;

  const link = wishlistLink.cloneNode(false);
  link.removeAttribute("id");
  link.href = target;
  link.setAttribute("aria-label", label);
  link.title = label;
  link.textContent = "♙";

  wishlistLink.parentNode.insertBefore(link, wishlistLink);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAccountLink);
} else {
  setupAccountLink();
}