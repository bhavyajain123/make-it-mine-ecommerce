import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";


dotenv.config();

const app = express();




const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

  


async function generateWithRetry(prompt) {
  if (!ai) {
    throw new Error("GEMINI_API_KEY .env file mein configure nahi hai.");
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
   model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (!response || !response.text) {
        throw new Error("Gemini ne empty response diya.");
      }

      return response;
    } catch (error) {
      const status = Number(error.status || error.error?.code);

      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === 2) {
        throw error;
      }

      const delay = attempt * 3000;

      console.log(
        `Gemini error ${status}. Retrying in ${delay / 1000}s...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error("Gemini request failed after retries.");
}


app.post("/api/gifts", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key .env file mein configure karo."
      });
    }

    const { occasion, budget, recipient, interests } = req.body;

    const amount = Number(budget);

    if (
      typeof occasion !== "string" ||
      typeof recipient !== "string" ||
      typeof interests !== "string" ||
      !occasion.trim() ||
      !recipient.trim() ||
      !interests.trim() ||
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 1000000
    ) {
      return res.status(400).json({
        error: "Valid occasion, recipient, interests aur budget enter karo."
      });
    }

    const prompt = `
You are MakeItMine's friendly gift recommendation assistant.

Suggest exactly 3 thoughtful gift ideas using these preferences:
Occasion: ${occasion.trim().slice(0, 100)}
Recipient: ${recipient.trim().slice(0, 100)}
Maximum budget: INR ${amount}
Interests: ${interests.trim().slice(0, 300)}

Rules:
- Keep every suggested gift within the budget.
- Do not claim products are in stock or available in the store.
- Give realistic approximate prices in INR.
- Return simple, valid JSON only, with this format:
{
  "intro": "A short friendly introduction",
  "gifts": [
    {
      "name": "Gift idea",
      "estimatedPrice": 500,
      "reason": "Why it suits the recipient",
      "personalTouch": "One way to personalize it"
    }
  ]
}
`;

const response = await generateWithRetry(prompt);
const responseText = response?.text;

if (!responseText || !responseText.trim()) {
  throw new Error("Gemini ne valid text response nahi diya.");
}

let result;

try {
  result = JSON.parse(responseText);
} catch {
  console.error("Invalid Gemini JSON response:", responseText);
  throw new Error("Gemini ne valid JSON return nahi kiya.");
}

console.log("Gemini response received");


console.log("Gemini response received");
console.log(response.text);




    if (!Array.isArray(result.gifts) || result.gifts.length !== 3) {
      throw new Error("AI returned an unexpected response.");
    }

    const gifts = result.gifts.map((gift) => ({
      name: String(gift.name || "Gift idea").slice(0, 120),
      estimatedPrice: Math.min(
        amount,
        Math.max(0, Number(gift.estimatedPrice) || 0)
      ),
      reason: String(gift.reason || "").slice(0, 500),
      personalTouch: String(gift.personalTouch || "").slice(0, 300)
    }));

    res.json({
      intro: String(result.intro || "Here are your gift ideas!"),
      gifts
    });
  }  catch (error) {
  console.error("Gemini error details:", error);

  res.status(500).json({
    error: error.message || "Gift suggestions generate nahi ho paaye."
  });
}
});

app.listen(PORT, () => {
  console.log(`MakeItMine AI running at http://localhost:${PORT}`);
});