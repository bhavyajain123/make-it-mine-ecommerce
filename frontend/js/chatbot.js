(function () {
  if (window.__mimChatLoaded) return;
  window.__mimChatLoaded = true;

  var API_ORIGIN = window.API_ORIGIN ||
    (location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://mim-backend-api-2026-bj111234.onrender.com");

  var STORE_KEY = "mim_chat_history";
  var MAX_SENT = 6;
  var busy = false;
  var history = [];

  try {
    history = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
    if (!Array.isArray(history)) history = [];
  } catch (e) {
    history = [];
  }

  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-20)));
    } catch (e) { /* storage unavailable */ }
  }

  var style = document.createElement("style");
  style.textContent =
    "#mimChatBtn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border:0;border-radius:50%;background:#6d2238;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:9990;display:flex;align-items:center;justify-content:center}" +
    "#mimChatBtn:focus-visible,#mimChatPanel button:focus-visible{outline:3px solid #c9a05a;outline-offset:2px}" +
    "#mimChatPanel{position:fixed;right:20px;bottom:90px;width:340px;height:470px;max-height:calc(100vh - 110px);background:#fff;border:1px solid #eaded5;border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.25);z-index:9991;display:flex;flex-direction:column;overflow:hidden;font-family:inherit}" +
    "#mimChatPanel[hidden]{display:none}" +
    ".mimc-head{background:#6d2238;color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}" +
    ".mimc-head strong{display:block;font-size:15px}" +
    ".mimc-head small{font-size:11px;opacity:.85}" +
    ".mimc-close{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}" +
    ".mimc-msgs{flex:1;overflow-y:auto;padding:14px;background:#fffaf6;display:flex;flex-direction:column;gap:8px}" +
    ".mimc-msg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".mimc-bot{align-self:flex-start;background:#fff;border:1px solid #eaded5;color:#382820}" +
    ".mimc-user{align-self:flex-end;background:#6d2238;color:#fff}" +
    ".mimc-typing{color:#806b60;font-style:italic}" +
    ".mimc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#fffaf6}" +
    ".mimc-chips[hidden]{display:none}" +
    ".mimc-chip{border:1px solid #d9c3b6;background:#fff;color:#6d2238;border-radius:99px;padding:6px 10px;font-size:12px;cursor:pointer}" +
    ".mimc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #eaded5;background:#fff}" +
    ".mimc-form input{flex:1;min-width:0;padding:10px;border:1px solid #e5d4c9;border-radius:8px;font:inherit;font-size:14px}" +
    ".mimc-form button{border:0;border-radius:8px;background:#6d2238;color:#fff;padding:0 14px;font-weight:bold;cursor:pointer}" +
    ".mimc-form button:disabled{opacity:.6;cursor:wait}" +
    ".mimc-note{font-size:10px;color:#806b60;text-align:center;padding:0 10px 8px;background:#fff}" +
    "@media(max-width:560px){#mimChatPanel{left:10px;right:10px;width:auto;bottom:84px;height:72vh}}";
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "mimChatBtn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Open chat helper");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var panel = document.createElement("div");
  panel.id = "mimChatPanel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "MakeItMine helper chat");
  panel.innerHTML =
    '<div class="mimc-head"><div><strong>MakeItMine Helper</strong><small>AI assistant</small></div>' +
    '<button type="button" class="mimc-close" aria-label="Close chat">&times;</button></div>' +
    '<div class="mimc-msgs" aria-live="polite"></div>' +
    '<div class="mimc-chips"></div>' +
    '<form class="mimc-form"><input type="text" maxlength="500" placeholder="Ask about gifts, delivery..." aria-label="Your message" autocomplete="off"><button type="submit">Send</button></form>' +
    '<div class="mimc-note">AI answers can be wrong. Log in to ask about your orders.</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector(".mimc-msgs");
  var chips = panel.querySelector(".mimc-chips");
  var form = panel.querySelector(".mimc-form");
  var input = form.querySelector("input");
  var sendBtn = form.querySelector("button");

  function addMessage(role, text) {
    var el = document.createElement("div");
    el.className = "mimc-msg " + (role === "user" ? "mimc-user" : "mimc-bot");
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function open() {
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close chat helper");
    input.focus();
  }

  function close() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open chat helper");
    btn.focus();
  }

  btn.addEventListener("click", function () { panel.hidden ? open() : close(); });
  panel.querySelector(".mimc-close").addEventListener("click", close);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) close();
  });

  addMessage("bot", "Hi! I'm the MakeItMine AI helper. Ask me about customizing a gift, payments, delivery or finding the right present.");
  history.forEach(function (turn) {
    addMessage(turn.role === "assistant" ? "bot" : "user", turn.text);
  });

  var suggestions = [
    "How do I customize a gift?",
    "What payment options do you have?",
    "Delivery and shipping?",
        "Where is my order?",
    "Returns and refunds?",
    "Help me find a gift"
  ];

  suggestions.forEach(function (text) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "mimc-chip";
    chip.textContent = text;
    chip.addEventListener("click", function () { send(text); });
    chips.appendChild(chip);
  });

  if (history.length) chips.hidden = true;

  async function send(text) {
    text = String(text || "").trim();
    if (!text || busy) return;

    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    chips.hidden = true;

    var prior = history.slice(-MAX_SENT);
    addMessage("user", text);
    history.push({ role: "user", text: text });
    save();

    var typing = addMessage("bot", "Typing...");
    typing.classList.add("mimc-typing");

        var reply;
    var link = "";
    var token = null;
    try { token = localStorage.getItem("mim_token"); } catch (e) {}
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    try {
      var response = await fetch(API_ORIGIN + "/api/chat", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ message: text, history: prior }),
        signal: AbortSignal.timeout(90000)
      });

      var data = await response.json().catch(function () { return {}; });

      if (!response.ok || !data.reply) {
        throw new Error(data.message || "Sorry, I could not answer right now.");
      }

      reply = data.reply;
            link = typeof data.link === "string" ? data.link : "";
      history.push({ role: "assistant", text: reply });
      save();
    } catch (error) {
      reply = error.name === "TimeoutError"
        ? "This is taking too long. Please try again."
        : error.message || "Sorry, I could not answer right now.";
    }

    typing.remove();
        var botEl = addMessage("bot", reply);
    if (link && /^(login|order-tracking)\.html(\?id=[a-f0-9]{24})?$/i.test(link)) {
      var a = document.createElement("a");
      a.href = link;
      a.textContent = link.indexOf("login") === 0 ? "Log in" : "Track this order";
      a.style.cssText = "color:#6d2238;font-weight:bold;display:inline-block;margin-top:6px";
      botEl.appendChild(document.createElement("br"));
      botEl.appendChild(a);
    }
    

    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    send(input.value);
  });
})();