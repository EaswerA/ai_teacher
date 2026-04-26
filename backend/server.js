import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const configuredModelList = (process.env.OLLAMA_MODELS || "")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const fallbackModelList = [process.env.OLLAMA_MODEL || "llama3.2:1b", "qwen2.5:1.5b", "phi3:mini"];
const ollamaModels = [...new Set((configuredModelList.length > 0 ? configuredModelList : fallbackModelList).filter(Boolean))];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: "ollama",
    model: ollamaModels[0],
    models: ollamaModels,
    baseUrl: ollamaBaseUrl
  });
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

function shouldTryNextModel(error) {
  const message = String(error?.message || "");
  return /not found|model|404|500|502|503|504|network|timeout/i.test(message);
}

async function chatWithOllamaModel({ model, systemPrompt, messages }) {
  const url = `${ollamaBaseUrl}/api/chat`;

  let response;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9
          }
        })
      });

      break;
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        throw new Error(`Network error while calling Ollama model ${model}: ${error.message}`);
      }
    }
  }

  if (!response) {
    const networkError = new Error(`Network error while calling Ollama model ${model}: ${lastError?.message || "Unknown error"}`);
    networkError.model = model;
    throw networkError;
  }

  if (!response.ok) {
    const text = await response.text();
    const httpError = new Error(`Ollama error ${response.status} for model ${model}: ${text}`);
    httpError.status = response.status;
    httpError.model = model;
    throw httpError;
  }

  return response.json();
}

async function chatWithOllama({ systemPrompt, messages }) {
  const errors = [];

  for (const model of ollamaModels) {
    try {
      const data = await chatWithOllamaModel({ model, systemPrompt, messages });
      return { data, modelUsed: model };
    } catch (error) {
      errors.push(error?.message || `Unknown error for model ${model}`);

      if (!shouldTryNextModel(error)) {
        break;
      }
    }
  }

  throw new Error(`All configured Ollama models failed. ${errors.join(" | ")}`);
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
    const { data, modelUsed } = await chatWithOllama({ systemPrompt, messages });

    const reply =
      data?.message?.content?.trim() ||
      data?.response?.trim() ||
      "I could not generate a response.";

    return res.json({ reply, model: modelUsed });
  } catch (error) {
    console.error(error);

    return res.status(502).json({
      error: "Could not reach local Ollama. Make sure Ollama is running and at least one configured model is pulled.",
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`AI Teacher backend running on http://localhost:${port}`);
});
