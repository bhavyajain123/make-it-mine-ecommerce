const Subscriber = require("../models/Subscriber");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.subscribe = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address" });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res
        .status(200)
        .json({ message: "You're already subscribed. Thank you!" });
    }

    await Subscriber.create({ email });

    return res.status(201).json({ message: "Thanks for joining us!" });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(200)
        .json({ message: "You're already subscribed. Thank you!" });
    }
    console.error("Newsletter error:", error.message);
    return res
      .status(500)
      .json({ message: "Could not subscribe right now. Please try again." });
  }
};