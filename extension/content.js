/**
 * VSS Accessibility Tools – content script
 *
 * Responsibilities:
 *  1. Apply CSS filter preset (overlay) to <html> element
 *  2. Inject / remove the reading ruler (horizontal highlight bar)
 *  3. Listen for settings messages from the popup
 */

(function () {
  "use strict";

  // ── Preset filter definitions (mirror of app.js) ─────────
  const PRESETS = {
    whiteBalance: [
      { filter: "" },
      { filter: "sepia(0.35) saturate(1.1)" },
      { filter: "hue-rotate(15deg) saturate(0.9)" },
      { filter: "sepia(0.5) saturate(1.3) brightness(1.05)" },
      { filter: "hue-rotate(340deg) saturate(1.2)" },
    ],
    visionCondition: [
      { filter: "" },
      { filter: "contrast(0.75)" },
      { filter: "brightness(0.82) contrast(0.9)" },
      { filter: "brightness(0.9) saturate(0.8)" },
      { filter: "sepia(0.25) brightness(0.95)" },
    ],
    noir: [
      { filter: "" },
      { filter: "sepia(0.8) saturate(0.2) brightness(0.85)" },
      { filter: "sepia(1) hue-rotate(10deg) brightness(0.9)" },
      { filter: "sepia(0.6) hue-rotate(320deg) saturate(1.4)" },
      { filter: "sepia(0.4) hue-rotate(100deg) saturate(1.2)" },
    ],
  };

  // ── Apply filter to the root element ─────────────────────
  function applyFilter(category, idx) {
    const list = PRESETS[category] || PRESETS.whiteBalance;
    const preset = list[parseInt(idx, 10)] || list[0];
    document.documentElement.style.filter = preset.filter || "";
  }

  // ── Reading ruler ─────────────────────────────────────────
  let ruler = null;

  function createRuler() {
    if (ruler) return;
    ruler = document.createElement("div");
    ruler.id = "vss-ruler";
    ruler.style.cssText = [
      "position:fixed",
      "left:0",
      "right:0",
      "pointer-events:none",
      "z-index:2147483646",
      "height:2.4em",
      "background:rgba(88,166,255,0.10)",
      "border-top:1px solid rgba(88,166,255,0.25)",
      "border-bottom:1px solid rgba(88,166,255,0.25)",
      "transition:top 0.06s linear",
      "top:-100px",
    ].join(";");
    document.body.appendChild(ruler);
  }

  function removeRuler() {
    if (ruler) {
      ruler.remove();
      ruler = null;
    }
    document.removeEventListener("mousemove", onMouseMove);
  }

  function onMouseMove(e) {
    if (!ruler) return;
    const lineH = parseFloat(getComputedStyle(document.body).lineHeight) || 24;
    const rulerH = Math.max(lineH, 28);
    ruler.style.height = rulerH + "px";
    ruler.style.top = (e.clientY - rulerH / 2) + "px";
  }

  function enableRuler() {
    createRuler();
    document.addEventListener("mousemove", onMouseMove);
  }

  // ── Apply full settings object ────────────────────────────
  function applySettings(state) {
    if (!state) return;
    applyFilter(state.presetCategory, state.presetName);

    // Reading ruler toggle
    if (state.rulerEnabled) {
      enableRuler();
    } else {
      removeRuler();
    }
  }

  // ── Listen for messages from popup ───────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "VSS_SETTINGS") {
      applySettings(msg.state);
    }
  });

  // ── Restore saved settings on page load ──────────────────
  chrome.storage.sync.get("vssSettings", (res) => {
    if (res && res.vssSettings) {
      applySettings(res.vssSettings);
    }
  });
})();
