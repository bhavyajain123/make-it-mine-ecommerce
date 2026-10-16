const { data, error } = await resend.emails.send({
  from: "Resend <onboarding@resend.dev>",
  to: customerEmail,
  subject: "Order Confirmation",
  html: html,
});

if (error) {
  console.error("Resend error:", error);
  throw new Error(error.message);
}
console.log("Email sent:", data);