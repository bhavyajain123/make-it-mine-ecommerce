const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND = {
  name: "MakeItMine",
  tagline: "Made personal. Made with love.",
  maroon: "#4f1a2b",
  gold: "#b8975a",
  cream: "#fdf9f3",
  sand: "#f5ece1",
  text: "#2b2b2b",
  muted: "#8a8a8a",
};

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://make-it-mine-ecommerce-frontend.vercel.app";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const paymentLabel = (m) => {
  if (!m) return "—";
  const s = String(m).toLowerCase();
  if (s === "cod" || s.includes("cash")) return "Cash on Delivery";
  if (s === "upi") return "UPI";
  return String(m).charAt(0).toUpperCase() + String(m).slice(1);
};

function buildItemRow(item) {
  const options = [
    item.size ? `Size: ${esc(item.size)}` : "",
    item.color ? `Colour: ${esc(item.color)}` : "",
    item.design ? "Custom design attached" : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  const img = item.productImage
    ? `<img src="${esc(item.productImage)}" width="72" height="72" alt="${esc(
        item.productName
      )}" style="display:block;border-radius:8px;object-fit:cover;border:1px solid #eadfce;" />`
    : "";

  return `
  <tr>
    <td width="88" valign="top" style="padding:14px 0;border-bottom:1px solid #eee3d3;">${img}</td>
    <td valign="top" style="padding:14px 12px;border-bottom:1px solid #eee3d3;">
      <div style="font-size:15px;font-weight:600;color:${BRAND.text};">${esc(item.productName)}</div>
      ${options ? `<div style="font-size:12px;color:${BRAND.muted};margin-top:4px;">${options}</div>` : ""}
      <div style="font-size:13px;color:${BRAND.muted};margin-top:4px;">Qty: ${esc(item.quantity)} × ${money(item.unitPrice)}</div>
    </td>
    <td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid #eee3d3;font-size:15px;font-weight:600;color:${BRAND.text};white-space:nowrap;">
      ${money(item.lineTotal ?? item.unitPrice * item.quantity)}
    </td>
  </tr>`;
}

function buildTotalRow(label, value, opts = {}) {
  const { bold = false, color = BRAND.text } = opts;
  return `
  <tr>
    <td style="padding:6px 0;font-size:${bold ? 16 : 14}px;color:${bold ? BRAND.maroon : BRAND.muted};${bold ? "font-weight:700;" : ""}">${label}</td>
    <td align="right" style="padding:6px 0;font-size:${bold ? 18 : 14}px;color:${color};${bold ? "font-weight:700;" : ""}">${value}</td>
  </tr>`;
}

function buildHtml(order) {
  const items = order.items || [];
  const addr = order.shippingAddress || {};
  const orderNumber = order.orderNumber || order.orderId || order._id;

  const subtotal = order.subtotal ?? items.reduce((s, i) => s + (i.lineTotal || 0), 0);
  const shipping = order.shippingFee ?? 0;
  const discount = order.discount ?? order.discountAmount ?? order.couponDiscount ?? 0;
  const total =
    order.total ?? order.totalAmount ?? order.grandTotal ?? subtotal + shipping - discount;

  const etaFrom = fmtDate(order.estimatedDeliveryFrom);
  const etaTo = fmtDate(order.estimatedDeliveryTo);
  const eta = etaFrom && etaTo ? `${etaFrom} – ${etaTo}` : etaFrom || etaTo;

  const addressLines = [
    addr.fullName,
    addr.addressLine,
    addr.landmark,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.postalCode,
    addr.phone ? `Phone: ${addr.phone}` : "",
  ]
    .filter(Boolean)
    .map(esc)
    .join("<br/>");

  const trackUrl = `${FRONTEND_URL}/order-tracking.html?orderId=${order._id}`;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${BRAND.sand};font-family:Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Your order ${esc(orderNumber)} is confirmed. We're getting your gifts ready with a little extra love.</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.sand};padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.cream};border-radius:14px;overflow:hidden;">

        <!-- Header -->
        <tr><td align="center" style="background:${BRAND.maroon};padding:28px 20px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#ffffff;letter-spacing:.5px;">Make<span style="color:${BRAND.gold};">It</span>Mine</div>
          <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};margin-top:6px;text-transform:uppercase;">${BRAND.tagline}</div>
        </td></tr>

        <!-- Hero -->
        <tr><td align="center" style="padding:36px 30px 10px;">
          <div style="width:56px;height:56px;line-height:56px;border-radius:50%;background:#e7f0e6;color:#3b7a4a;font-size:28px;margin:0 auto 16px;">&#10003;</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:${BRAND.maroon};">Order Confirmed!</div>
          <p style="font-size:15px;line-height:1.6;color:${BRAND.muted};margin:12px 0 0;">
            Hi ${esc((addr.fullName || "there").split(" ")[0])}, thank you for choosing MakeItMine.<br/>
            Your order is in our hands and we're getting your gifts ready with <strong style="color:${BRAND.maroon};">a little extra love.</strong>
          </p>
        </td></tr>

        <!-- Order meta -->
        <tr><td style="padding:22px 30px 6px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.sand};border-radius:10px;">
            <tr>
              <td style="padding:16px 18px;">
                <div style="font-size:11px;letter-spacing:1.5px;color:${BRAND.muted};text-transform:uppercase;">Order number</div>
                <div style="font-size:15px;font-weight:700;color:${BRAND.maroon};margin-top:4px;">${esc(orderNumber)}</div>
              </td>
              ${
                eta
                  ? `<td style="padding:16px 18px;" align="right">
                <div style="font-size:11px;letter-spacing:1.5px;color:${BRAND.muted};text-transform:uppercase;">Estimated delivery</div>
                <div style="font-size:15px;font-weight:700;color:${BRAND.maroon};margin-top:4px;">${eta}</div>
              </td>`
                  : ""
              }
            </tr>
          </table>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:22px 30px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND.maroon};margin-bottom:6px;">A little something for you</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${items.map(buildItemRow).join("")}
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding:14px 30px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${buildTotalRow("Subtotal", money(subtotal))}
            ${buildTotalRow("Shipping", shipping > 0 ? money(shipping) : "FREE")}
            ${
              discount > 0
                ? buildTotalRow(
                    `Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`,
                    "− " + money(discount),
                    { color: "#3b7a4a" }
                  )
                : ""
            }
            <tr><td colspan="2" style="border-top:2px solid ${BRAND.gold};padding-top:6px;"></td></tr>
            ${buildTotalRow("Total", money(total), { bold: true })}
          </table>
        </td></tr>

        <!-- Address + Payment -->
        <tr><td style="padding:24px 30px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right:10px;">
                <div style="font-size:11px;letter-spacing:1.5px;color:${BRAND.muted};text-transform:uppercase;margin-bottom:8px;">Shipping to</div>
                <div style="font-size:14px;line-height:1.6;color:${BRAND.text};">${addressLines}</div>
              </td>
              <td width="50%" valign="top" style="padding-left:10px;">
                <div style="font-size:11px;letter-spacing:1.5px;color:${BRAND.muted};text-transform:uppercase;margin-bottom:8px;">Payment method</div>
                <div style="font-size:14px;line-height:1.6;color:${BRAND.text};">${esc(paymentLabel(order.paymentMethod))}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:30px 30px 10px;">
          <a href="${trackUrl}" style="display:inline-block;background:${BRAND.maroon};color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:15px 34px;border-radius:6px;">Track your order</a>
        </td></tr>

        <!-- Help -->
        <tr><td align="center" style="padding:18px 30px 30px;">
          <p style="font-size:13px;line-height:1.6;color:${BRAND.muted};margin:0;">
            Questions about your order? Just reply to this email or visit our
            <a href="${FRONTEND_URL}/contact.html" style="color:${BRAND.maroon};">contact page</a>.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="background:${BRAND.sand};padding:20px 30px;">
          <div style="font-size:12px;color:${BRAND.muted};line-height:1.7;">
            <a href="${FRONTEND_URL}/refund-return.html" style="color:${BRAND.muted};">Refund &amp; Returns</a> &nbsp;|&nbsp;
            <a href="${FRONTEND_URL}/privacy.html" style="color:${BRAND.muted};">Privacy</a> &nbsp;|&nbsp;
            <a href="${FRONTEND_URL}/faq.html" style="color:${BRAND.muted};">FAQ</a><br/>
            &copy; ${new Date().getFullYear()} MakeItMine. Made with love.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(order) {
  const items = order.items || [];
  const orderNumber = order.orderNumber || order.orderId || order._id;
  const lines = items.map(
    (i) => `- ${i.productName} x${i.quantity}  ${money(i.lineTotal)}`
  );
  return [
    "Order Confirmed!",
    `Order number: ${orderNumber}`,
    "",
    ...lines,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${order.shippingFee > 0 ? money(order.shippingFee) : "FREE"}`,
    "",
    `Track your order: ${FRONTEND_URL}/order-tracking.html?orderId=${order._id}`,
    "",
    "Thank you for shopping with MakeItMine.",
  ].join("\n");
}

async function sendOrderConfirmation(order, customerEmail) {
  if (!customerEmail) throw new Error("customerEmail missing");

  // createdOrder may be a Mongoose document; convert to plain object
  const o = typeof order.toObject === "function" ? order.toObject() : order;
  const orderNumber = o.orderNumber || o.orderId || o._id;

  const { data, error } = await resend.emails.send({
    from: "MakeItMine <onboarding@resend.dev>", // domain verify hone ke baad: orders@yourdomain.com
    to: customerEmail,
    subject: `Order Confirmed 🎁 ${orderNumber}`,
    html: buildHtml(o),
    text: buildText(o),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  console.log("Email sent:", data);
  return data;
}

module.exports = { sendOrderConfirmation };