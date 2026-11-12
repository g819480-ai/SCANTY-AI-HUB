
      try {
        const primaryModel = env.GEMINI_MODEL || "gemini-3.8-flash";
        const fallbackModel = "gemini-3.5-flash-lite";

        async function askGemini(model) {
          const endpoint =
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

          for (let attempt = 0; attempt < 3; attempt++) {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY
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

        let result = await askGemini(primaryModel);

        if (!result) {
          result = await askGemini(fallbackModel);
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
            error: "The AI did not return a response. Please try again."
          }, 502);
        }

        return json({ reply });

      } catch (error) {
        return json({
          error: error.message || "Unable to connect to Gemini."
        }, 502);
      }
