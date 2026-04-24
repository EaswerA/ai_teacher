import "dotenv/config";
import express from "express";
import cors from "cors";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const app = express();
const port = process.env.PORT || 3001;

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const geminiBaseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: geminiModel, provider: "gemini", apiKeyConfigured: Boolean(geminiApiKey) });
});

function buildSystemPrompt({ subject, level, mode }) {
  return [
    "You are a human-like AI teacher. Be warm, encouraging, and precise.",
    `Primary subject: ${subject}.`,
    `Student level: ${level}.`,
    `Teaching mode: ${mode}.`,
    "Rules:",
    "1) Teach using simple language first, then add depth.",
    "2) Ask one short follow-up question to check understanding.",
    "3) For maths, show step-by-step solutions clearly.",
    "4) For science, relate ideas to real-world examples.",
    "5) Never shame the learner. Always be supportive.",
    "6) Keep responses under 250 words unless the student asks for more detail."
  ].join("\n");
}

function toGeminiContents(messages) {
  return messages
    .filter((msg) => (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
}

async function chatWithGemini({ systemPrompt, messages }) {
  const url = `${geminiBaseUrl}/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

  let response;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: toGeminiContents(messages),
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 600
          }
        }),
        signal: AbortSignal.timeout(15000)
      });

      break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        throw new Error(`Network error while calling Gemini: ${error.message}`);
      }
    }
  }

  if (!response) {
    throw new Error(`Network error while calling Gemini: ${lastError?.message || "Unknown error"}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gemini error ${response.status}: ${text}. If this is a NOT_FOUND model error, set GEMINI_MODEL in backend/.env to an available model such as gemini-2.0-flash.`
    );
  }

  return response.json();
}

app.post("/api/chat", async (req, res) => {
  const { message, history = [], subject = "Maths", level = "Middle school", mode = "Tutor" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const systemPrompt = buildSystemPrompt({ subject, level, mode });

  const messages = [
    ...history.slice(-10),
    { role: "user", content: message.trim() }
  ];

  try {
    if (!geminiApiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Add it to backend/.env and restart the backend."
      });
    }

    const data = await chatWithGemini({ systemPrompt, messages });

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("\n")
        .trim() || "I could not generate a response.";

    return res.json({ reply });
  } catch (error) {
    console.error(error);

    return res.status(502).json({
      error: "Could not reach Gemini. Check your API key and internet connection.",
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`AI Teacher backend running on http://localhost:${port}`);
});
