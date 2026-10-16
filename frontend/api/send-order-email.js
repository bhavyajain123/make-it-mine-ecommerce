import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { email, name, orderId, items = [], total, paymentMethod } = req.body;

    const rows = items.map(i =>
      `<li>${i.name} × ${i.quantity} - ₹${(i.price * i.quantity).toFixed(2)}</li>`
    ).join('');

    const { data, error } = await resend.emails.send({
      from: 'Make It Mine <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmed #${orderId}`,
      html: `<h2>Thank you, ${name}!</h2>
             <p>Your order has been placed (${paymentMethod}).</p>
             <ul>${rows}</ul>
             <p><b>Total: ₹${total}</b></p>`
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ ok: false, error });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}