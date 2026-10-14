const form = document.getElementById("giftForm");
const submitBtn = document.getElementById("submitBtn");
const results = document.getElementById("results");
const giftCards = document.getElementById("giftCards");
const intro = document.getElementById("intro");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  results.hidden = true;
  errorMessage.hidden = true;
  giftCards.replaceChildren();

  submitBtn.disabled = true;
  submitBtn.textContent = "Finding thoughtful gifts...";

  const request = {
    occasion: document.getElementById("occasion").value,
    recipient: document.getElementById("recipient").value.trim(),
    budget: Number(document.getElementById("budget").value),
    interests: document.getElementById("interests").value.trim()
  };

  try {
    const response = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    intro.textContent = data.intro;

    data.gifts.forEach((gift, index) => {
      const card = document.createElement("article");
      card.className = "gift-card";

      const number = document.createElement("div");
      number.className = "gift-number";
      number.textContent = `GIFT IDEA 0${index + 1}`;

      const title = document.createElement("h3");
      title.textContent = gift.name;

      const price = document.createElement("div");
      price.className = "price";
      price.textContent = `Approx. ₹${Number(gift.estimatedPrice).toLocaleString("en-IN")}`;

      const reason = document.createElement("p");
      reason.textContent = gift.reason;

      const personalHeading = document.createElement("h4");
      personalHeading.textContent = "Make it personal";

      const personal = document.createElement("p");
      personal.textContent = gift.personalTouch;

      card.append(number, title, price, reason, personalHeading, personal);
      giftCards.appendChild(card);
    });

    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    errorMessage.textContent =
      error.message || "Unable to get gift suggestions.";
    errorMessage.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Find my gift ideas <span>→</span>';
  }
});