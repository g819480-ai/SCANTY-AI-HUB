
const json = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

async function askGemini(model, message, apiKey) {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: message }]
        }],
        generationConfig: {
          maxOutputTokens: 2048
        }
      })
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status !== 503) {
      const error = await response.json();
      throw new Error(
        error?.error?.message || "Gemini API request failed."
      );
    }

    if (attempt < 2) {
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * (2 ** attempt))
      );
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        name: "SCANTY AI HUB",
        runtime: "Cloudflare Workers",
        aiConfigured: Boolean(env.GEMINI_API_KEY)
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON request." }, 400);
      }

      const message = String(body?.message || "").trim();

      if (!message) {
        return json({ error: "Message is required." }, 400);
      }

      if (!env.GEMINI_API_KEY) {
        return json({
          error: "Gemini API key is not configured."
        }, 503);
      }

      try {
        const primaryModel =
          env.GEMINI_MODEL || "gemini-3.8-flash";

        let result = await askGemini(
          primaryModel,
          message,
          env.GEMINI_API_KEY
        );

        if (!result) {
          result = await askGemini(
            "gemini-3.5-flash-lite",
            message,
            env.GEMINI_API_KEY
          );
        }

        if (!result) {
          return json({
            error: "Our AI services are busy. Please try again shortly."
          }, 503);
        }

        const reply = result?.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim();

        if (!reply) {
          return json({
            error: "The AI did not return a response."
          }, 502);
        }

        return json({ reply });

      } catch (error) {
        return json({
          error: error.message || "Unable to connect to Gemini."
        }, 502);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
