
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
async function generateText(instructions, input) {
  const response = await openai.responses.create({
    model: textModel,
    instructions,
    input,
  });

  return response.output_text;
}
function validateText(value, field, maxLength = 200) {
  if (typeof value !== "string" || !value.trim()) {
    return `${field} is required`;
  }

  if (value.trim().length > maxLength) {
    return `${field} must be ${maxLength} characters or fewer`;
  }

  return null;
}

function parseJson(text) {
  // Model output is expected to be JSON, but still validate parsing.
  const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}
exports.giftRecommendations = async (req, res) => {
  try {
    const { occasion, recipient, budget, interests } = req.body;

    const error =
      validateText(occasion, "occasion", 100) ||
      validateText(recipient, "recipient", 100);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (
      typeof budget !== "number" ||
      !Number.isFinite(budget) ||
      budget < 100 ||
      budget > 100000
    ) {
      return res.status(400).json({
        message: "Budget must be a number between ₹100 and ₹100000",
      });
    }

    if (
      interests !== undefined &&
      (typeof interests !== "string" || interests.length > 300)
    ) {
      return res.status(400).json({ message: "Invalid interests" });
    }

    const text = await generateText(
      `You are a gift assistant for an Indian custom gift store.
Return only valid JSON in this shape:
{"suggestions":[{"name":"...","productType":"tshirt|hoodie|mug|phone-case|other","estimatedPrice":500,"reason":"...","customizationIdea":"..."}]}
Give 3 suggestions. Keep every estimatedPrice within the supplied budget.
These are suggestions, not verified live inventory. Never claim a product is in stock.`,
      JSON.stringify({ occasion, recipient, budget, interests: interests || "" })
    );

    const result = parseJson(text);

    if (!Array.isArray(result.suggestions)) {
      throw new Error("Unexpected AI response format");
    }

    return res.status(200).json({
      budget,
      suggestions: result.suggestions.slice(0, 3),
      note: "Suggestions are AI-generated; prices and stock must be checked in the store.",
    });
  } catch (error) {
    console.error("Gift recommendations error:", error.message);
    return res.status(502).json({
      message: "Gift recommendations are temporarily unavailable",
    });
  }
};


exports.giftMessage = async (req, res) => {
  try {
    const { recipient, occasion, tone, details } = req.body;

    const error =
      validateText(recipient, "recipient", 100) ||
      validateText(occasion, "occasion", 100);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const allowedTones = ["heartfelt", "funny", "romantic", "formal", "short"];

    if (tone !== undefined && !allowedTones.includes(tone)) {
      return res.status(400).json({ message: "Invalid message tone" });
    }

    if (
      details !== undefined &&
      (typeof details !== "string" || details.length > 500)
    ) {
      return res.status(400).json({ message: "Details must be under 500 characters" });
    }

    const message = await generateText(
      "Write one original, personalized gift message. Avoid clichés where possible. Return only the message, without explanations or quotation marks.",
      JSON.stringify({
        recipient,
        occasion,
        tone: tone || "heartfelt",
        details: details || "",
      })
    );

    return res.status(200).json({
      message: message.trim(),
    });
  } catch (error) {
    console.error("Gift message error:", error.message);
    return res.status(502).json({
      message: "Unable to generate a gift message right now",
    });
  }
};


exports.designSuggestions = async (req, res) => {
  try {
    const { productType, theme, text, colors } = req.body;

    const error =
      validateText(productType, "productType", 50) ||
      validateText(theme, "theme", 150);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (text !== undefined && (typeof text !== "string" || text.length > 100)) {
      return res.status(400).json({ message: "Text must be under 100 characters" });
    }

    if (
      colors !== undefined &&
      (!Array.isArray(colors) ||
        colors.length > 6 ||
        colors.some((c) => typeof c !== "string" || c.length > 30))
    ) {
      return res.status(400).json({ message: "Invalid colors" });
    }

    const resultText = await generateText(
      `You are a creative designer for custom gifts.
Return only valid JSON:
{"ideas":[{"title":"...","description":"...","colorPalette":["..."],"imagePrompt":"..."}]}
Return 3 distinct concepts. Keep imagePrompt suitable for a printable design.
Avoid copyrighted characters, logos, or imitating a living artist's style.`,
      JSON.stringify({
        productType,
        theme,
        text: text || "",
        colors: colors || [],
      })
    );

    const result = parseJson(resultText);

    if (!Array.isArray(result.ideas)) {
      throw new Error("Unexpected AI response format");
    }

    return res.status(200).json({
      ideas: result.ideas.slice(0, 3),
    });
  } catch (error) {
    console.error("Design suggestions error:", error.message);
    return res.status(502).json({
      message: "Unable to generate design ideas right now",
    });
  }
};

const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
exports.generateDesign = async (req, res) => {
  try {
    const { prompt, productType } = req.body;

    const error =
      validateText(prompt, "prompt", 1000) ||
      validateText(productType, "productType", 50);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: `Create a clean, original, print-ready custom gift graphic for a ${productType}. Theme: ${prompt}. Show the artwork only, centered on a plain background. Do not create a product mockup.`,
      size: "1024x1024",
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      return res.status(502).json({
        message: "The image service returned no image",
      });
    }

    const outputDir = path.join(
      process.cwd(),
      "uploads",
      "ai-designs"
    );

    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${randomUUID()}.png`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      Buffer.from(base64, "base64")
    );

    return res.status(201).json({
      message: "Design generated successfully",
      imageUrl: `/uploads/ai-designs/${filename}`,
    });
 } catch (error) {
  console.error("Gift recommendations error:", error);

  return res.status(502).json({
    message: "Gift recommendations are temporarily unavailable"
  });
}
};

