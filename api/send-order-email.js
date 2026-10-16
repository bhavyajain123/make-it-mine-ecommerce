import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, name, orderId, items, total } = req.body;

  const rows = items.map(i => `<li>${i.name} - ₹${i.price}</li>`).join('');

  await resend.emails.send({
    from: 'Make It Mine <orders@yourdomain.com>',
    to: email,
    subject: `Order Confirmed #${orderId}`,
    html: `<h2>Thank you, ${name}!</h2>
           <p>Your order has been placed.</p>
           <ul>${rows}</ul>
           <p><b>Total: ₹${total}</b></p>`
  });
  res.status(200).json({ ok: true });
}