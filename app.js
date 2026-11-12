const form = document.querySelector("#chat-form");
const input = document.querySelector("#prompt");
const messages = document.querySelector("#messages");

function addMessage(text, role="ai") {
  const row = document.createElement("div");
  row.className = `message ${role === "user" ? "user" : "ai"}`;
  row.innerHTML = `<span class="avatar">${role === "user" ? "U" : "S"}</span><div><p></p></div>`;
  row.querySelector("p").textContent = text;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  addMessage(message, "user");
  input.value = "";
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "…";
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({message})
    });
    const data = await r.json();
    addMessage(data.reply || data.error || "No response received.");
  } catch {
    addMessage("SCANTY AI could not reach the server. Check the deployment and API configuration.");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Send <span>↗</span>';
  }
});

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.prompt;
    input.focus();
  });
});
