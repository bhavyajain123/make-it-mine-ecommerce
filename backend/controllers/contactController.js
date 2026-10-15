const ContactMessage = require("../models/ContactMessage");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

exports.submitContact = async (req, res) => {
  try {
    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 254).toLowerCase();
    const phone = clean(req.body.phone, 20);
    const topic = clean(req.body.topic, 100);
    const orderNumber = clean(req.body.orderNumber, 60);
    const message = clean(req.body.message, 1500);

    if (!name) {
      return res.status(400).json({ message: "Please enter your name" });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!topic) {
      return res.status(400).json({ message: "Please choose what we can help with" });
    }
    if (message.length < 5) {
      return res.status(400).json({ message: "Please write a short message" });
    }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: "Please enter a valid phone number" });
    }

    await ContactMessage.create({
      name,
      email,
      phone,
      topic,
      orderNumber,
      message,
    });

    return res.status(201).json({
      message: "Thank you! Your message has been sent. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact form error:", error.message);
    return res.status(500).json({
      message: "Could not send your message right now. Please try again.",
    });
  }
};