
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });

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
        const model = env.GEMINI_MODEL || "gemini-2.5-flash";

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: message }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
              }
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          return json({
            error: result?.error?.message || "Gemini request failed."
          }, 502);
        }

        const reply = result?.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim();

        if (!reply) {
          return json({ error: "No AI response received." }, 502);
        }

        return json({ reply });

      } catch (error) {
        return json({
          error: "Unable to connect to Gemini."
        }, 502);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
