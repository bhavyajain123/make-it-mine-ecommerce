const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const inr = (n) => `₹${Number(n || 0).toFixed(2)}`;

async function sendOrderConfirmation({ to, name, order }) {
  if (!resend) {
    console.error("Order email skipped: RESEND_API_KEY missing");
    return;
  }
  if (!to) {
    console.error("Order email skipped: no recipient email");
    return;
  }

  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0">${esc(i.productName)} × ${i.quantity}</td>
        <td style="padding:8px 0;text-align:right">${inr(i.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const a = order.shippingAddress || {};
  const payment = order.paymentMethod === "cod" ? "Cash on Delivery" : "Online / UPI";

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2b2b2b">
    <h2 style="color:#6b1f33">Thank you, ${esc(name || "there")}! 🎁</h2>
    <p>Your order <b>${esc(order.orderNumber)}</b> has been placed.</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee">${rows}</table>
    <p style="text-align:right;margin:8px 0">Subtotal: ${inr(order.subtotal)}</p>
    ${order.discount > 0 ? `<p style="text-align:right;margin:8px 0">Discount: -${inr(order.discount)}</p>` : ""}
    <p style="text-align:right;margin:8px 0">Shipping: ${order.shippingFee ? inr(order.shippingFee) : "FREE"}</p>
    <p style="text-align:right;font-size:18px;color:#6b1f33"><b>Total: ${inr(order.totalAmount)}</b></p>
    <p><b>Payment:</b> ${payment}</p>
    <p><b>Delivering to:</b><br>${esc(a.fullName)}<br>${esc(a.addressLine)}${a.landmark ? ", " + esc(a.landmark) : ""}<br>${esc(a.city)}, ${esc(a.state)} - ${esc(a.postalCode)}<br>Phone: ${esc(a.phone)}</p>
    <p style="color:#888;font-size:12px">MakeItMine - Made personal. Made with love.</p>
  </div>`;

  const { error } = await resend.emails.send({
    from: "MakeItMine <onboarding@resend.dev>",
    to,
    subject: `Order Confirmed ${order.orderNumber}`,
    html,
  });

  if (error) console.error("Resend error:", error);
}

module.exports = { sendOrderConfirmation };