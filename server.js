import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "SCANTY AI HUB", version: "1.0.0" });
});

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Message is required." });

  // Provider-agnostic starter. Add your chosen AI provider through
  // AI_API_URL, AI_API_KEY and AI_MODEL in .env.
  if (!process.env.AI_API_URL || !process.env.AI_API_KEY) {
    return res.json({
      reply: "SCANTY AI HUB is online. Connect your AI provider in .env to enable live AI responses.",
      setupRequired: true
    });
  }

  try {
    const response = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          { role: "system", content: "You are SCANTY AI, the helpful AI assistant inside SCANTY AI HUB." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || "AI provider request failed." });
    }

    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.output_text ??
      "The AI provider returned no readable response.";

    res.json({ reply });
  } catch (error) {
    console.error("AI request failed:", error);
    res.status(502).json({ error: "Could not reach the AI provider." });
  }
});

app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SCANTY AI HUB running on port ${PORT}`);
});
