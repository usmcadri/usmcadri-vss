/* =========================================================
   VSS Accessibility Tools – shared app logic
   Handles: preset definitions, overlay application,
            text settings, reading highlight, chatbot widget
   ========================================================= */

"use strict";

// ── Preset library ────────────────────────────────────────
const PRESETS = {
  whiteBalance: [
    { name: "Neutral",          filter: "" },
    { name: "Warm (3000K)",     filter: "sepia(0.35) saturate(1.1)" },
    { name: "Cool (7000K)",     filter: "hue-rotate(15deg) saturate(0.9)" },
    { name: "Soft Yellow",      filter: "sepia(0.5) saturate(1.3) brightness(1.05)" },
    { name: "Rose Tint",        filter: "hue-rotate(340deg) saturate(1.2)" },
  ],
  visionCondition: [
    { name: "Default",          filter: "" },
    { name: "Low Contrast",     filter: "contrast(0.75)" },
    { name: "Reduce Glare",     filter: "brightness(0.82) contrast(0.9)" },
    { name: "Soft Focus",       filter: "brightness(0.9) saturate(0.8)" },
    { name: "Blue Light Block", filter: "sepia(0.25) brightness(0.95)" },
  ],
  noir: [
    { name: "None",             filter: "" },
    { name: "Classic NoIR",     filter: "sepia(0.8) saturate(0.2) brightness(0.85)" },
    { name: "Amber",            filter: "sepia(1) hue-rotate(10deg) brightness(0.9)" },
    { name: "Rose",             filter: "sepia(0.6) hue-rotate(320deg) saturate(1.4)" },
    { name: "Green Tint",       filter: "sepia(0.4) hue-rotate(100deg) saturate(1.2)" },
  ],
};

// ── Build preset dropdown ─────────────────────────────────
function populatePresets(category) {
  const sel = document.getElementById("presetName");
  if (!sel) return;
  sel.innerHTML = "";
  const list = PRESETS[category] || [];
  list.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

// ── Apply current settings to a target element ───────────
function applySettings(target) {
  if (!target) return;

  const category = val("presetCategory") || "whiteBalance";
  const idx      = parseInt(val("presetName") || "0", 10);
  const alpha    = parseInt(val("overlayAlpha") || "35", 10);
  const fs       = parseInt(val("fontSize") || "18", 10);
  const lh       = parseFloat(val("lineHeight") || "1.6");

  const preset = (PRESETS[category] || [])[idx] || {};
  const filter = preset.filter || "";

  target.style.filter         = filter;
  target.style.setProperty("--viewer-font-size",    fs + "px");
  target.style.setProperty("--viewer-line-height",  lh);

  // Overlay strength via opacity on a pseudo-element isn't easy;
  // we encode it as a data-attr for extension content scripts.
  target.dataset.overlayAlpha = alpha;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : null;
}

// ── Wire up controls ──────────────────────────────────────
function initControls() {
  const catSel = document.getElementById("presetCategory");
  if (catSel) {
    populatePresets(catSel.value);
    catSel.addEventListener("change", () => populatePresets(catSel.value));
  }

  // Update pill labels
  const rangePills = [
    { rangeId: "overlayAlpha", pillId: "overlayAlphaValue", suffix: "%" },
    { rangeId: "fontSize",     pillId: "fontSizeValue",     suffix: "px" },
    { rangeId: "lineHeight",   pillId: "lineHeightValue",   suffix: "" },
  ];

  rangePills.forEach(({ rangeId, pillId, suffix }) => {
    const input = document.getElementById(rangeId);
    const pill  = document.getElementById(pillId);
    if (!input || !pill) return;
    const update = () => { pill.textContent = input.value + suffix; };
    input.addEventListener("input", update);
    update();
  });

  // Reset
  const resetBtn = document.getElementById("reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const defaults = { overlayAlpha: 35, fontSize: 18, lineHeight: 1.6 };
      Object.entries(defaults).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = v;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    });
  }

  // Apply on any change
  const all = ["presetCategory","presetName","overlayAlpha","fontSize","lineHeight"];
  all.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => applySettings(document.getElementById("viewer")));
  });

  // Initial apply
  applySettings(document.getElementById("viewer"));
}

// ── Reading highlight (paragraph hover) ──────────────────
function initReadingHighlight() {
  const toggle = document.getElementById("highlightToggle");
  const viewer  = document.getElementById("viewer");
  if (!viewer) return;

  let enabled = toggle ? toggle.checked : true;

  function onHover(e) {
    if (!enabled) return;
    const para = e.target.closest("p, li, blockquote, h1, h2, h3, h4, h5, h6");
    viewer.querySelectorAll(".hl-line").forEach(el => el.classList.remove("hl-line"));
    if (para) para.classList.add("hl-line");
  }

  viewer.addEventListener("mousemove", onHover);
  viewer.addEventListener("mouseleave", () => {
    viewer.querySelectorAll(".hl-line").forEach(el => el.classList.remove("hl-line"));
  });

  if (toggle) {
    toggle.addEventListener("change", () => { enabled = toggle.checked; });
  }
}

// ── Chatbot widget ────────────────────────────────────────
(function initChatbot() {
  const FAB_HTML = `
  <div id="chatbot-fab">
    <button class="fab-btn" id="chatFab" title="Open AI assistant" aria-label="Open chat assistant">💬</button>
    <div class="chat-panel hidden" id="chatPanel" role="dialog" aria-label="AI Reading Assistant">
      <div class="chat-header">
        <span class="chat-header__icon">🤖</span>
        <span class="chat-header__title">Reading Assistant</span>
        <button class="chat-header__close" id="chatClose" title="Close">✕</button>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-row">
        <textarea class="chat-input" id="chatInput" placeholder="Ask about the document…" rows="1"></textarea>
        <button class="chat-send-btn" id="chatSend" title="Send" aria-label="Send message">➤</button>
      </div>
    </div>
  </div>`;

  // Inject into body once DOM is ready
  function mount() {
    if (document.getElementById("chatbot-fab")) return;
    const div = document.createElement("div");
    div.innerHTML = FAB_HTML.trim();
    document.body.appendChild(div.firstChild);
    bindChatbot();
  }

  function bindChatbot() {
    const fab      = document.getElementById("chatFab");
    const panel    = document.getElementById("chatPanel");
    const closeBtn = document.getElementById("chatClose");
    const input    = document.getElementById("chatInput");
    const sendBtn  = document.getElementById("chatSend");
    const messages = document.getElementById("chatMessages");
    if (!fab || !panel) return;

    // Toggle panel
    fab.addEventListener("click", () => {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) {
        input.focus();
        maybeGreet();
      }
    });
    closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

    // Send on Enter (Shift+Enter = newline)
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    sendBtn.addEventListener("click", sendMessage);

    let greeted = false;
    function maybeGreet() {
      if (greeted) return;
      greeted = true;
      appendMsg("bot", "👋 Hi! Upload a document and I'll summarize it for you. You can also ask me anything about the content.");
    }

    function appendMsg(role, text) {
      const div = document.createElement("div");
      div.className = `chat-msg chat-msg--${role}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function setLoading(busy) {
      sendBtn.disabled = busy;
      input.disabled   = busy;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";

      appendMsg("user", text);
      setLoading(true);
      const typing = appendMsg("bot chat-msg--typing", "…");

      try {
        const reply = await callChatAPI(text);
        typing.className = "chat-msg chat-msg--bot";
        typing.textContent = reply;
      } catch (err) {
        typing.className = "chat-msg chat-msg--bot";
        typing.textContent = "⚠️ " + (err.message || "Could not get a response.");
      } finally {
        setLoading(false);
        messages.scrollTop = messages.scrollHeight;
      }
    }
  }

  // ── API call ──────────────────────────────────────────────
  async function callChatAPI(userMsg) {
    // Gather document context from the viewer (if present)
    const viewer = document.getElementById("viewer");
    const docText = viewer ? viewer.innerText.slice(0, 6000) : "";

    // POST to the Flask backend /chat endpoint
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg, context: docText }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    return data.reply || "(no response)";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

// ── Boot ──────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { initControls(); initReadingHighlight(); });
} else {
  initControls();
  initReadingHighlight();
}
