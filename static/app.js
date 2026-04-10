/**
 * app.js — shared UI logic for both the web app (index.html) and the
 * browser-extension popup (extension/popup.html).
 *
 * Responsibilities:
 *  - Define colour presets for every category
 *  - Populate the preset-name <select> based on the chosen category
 *  - Apply the colour overlay to #overlay (web) or inject a <style> (extension)
 *  - Apply font-size / line-height to the viewer content
 *  - Wire up the Reset button and display pills
 */
(function () {
  "use strict";

  // ── Preset data ────────────────────────────────────────────────────────────
  // Each entry maps a display name → { r, g, b } overlay colour.
  const PRESETS = {
    whiteBalance: {
      "Neutral":     { r: 255, g: 255, b: 255 },
      "Warm":        { r: 255, g: 220, b: 180 },
      "Cool":        { r: 180, g: 210, b: 255 },
      "Daylight":    { r: 255, g: 244, b: 230 },
      "Candlelight": { r: 255, g: 197, b: 143 },
    },
    visionCondition: {
      "High Contrast": { r:   0, g:   0, b:   0 },
      "Reduced Glare": { r: 100, g: 100, b: 100 },
      "Muted":         { r: 200, g: 200, b: 200 },
      "Grayscale":     { r: 150, g: 150, b: 150 },
    },
    noir: {
      "FL-41 Rose": { r: 255, g: 180, b: 180 },
      "Amber":      { r: 255, g: 191, b:   0 },
      "Gray":       { r: 128, g: 128, b: 128 },
      "Plum":       { r: 180, g: 100, b: 180 },
      "Yellow":     { r: 255, g: 255, b:   0 },
    },
  };

  // Default control values
  const DEFAULTS = {
    presetCategory: "whiteBalance",
    presetName:     "Neutral",
    overlayAlpha:   35,
    fontSize:       18,
    lineHeight:     1.6,
  };

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const categoryEl    = document.getElementById("presetCategory");
  const nameEl        = document.getElementById("presetName");
  const alphaEl       = document.getElementById("overlayAlpha");
  const alphaValueEl  = document.getElementById("overlayAlphaValue");
  const fontSizeEl    = document.getElementById("fontSize");
  const fontSizeValEl = document.getElementById("fontSizeValue");
  const lineHeightEl  = document.getElementById("lineHeight");
  const lineHtValEl   = document.getElementById("lineHeightValue");
  const resetBtn      = document.getElementById("reset");

  // The overlay element lives in the full web-app page; the extension applies
  // styles globally via a <style> tag injected into every page it covers.
  const overlayEl = document.getElementById("overlay");

  // ── Populate preset names ──────────────────────────────────────────────────
  function populatePresetNames(category, selectedName) {
    if (!nameEl) return;
    const options = Object.keys(PRESETS[category] || {});
    nameEl.innerHTML = "";
    for (const name of options) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      nameEl.appendChild(opt);
    }
    // Restore saved selection if it exists in this category
    if (selectedName && options.includes(selectedName)) {
      nameEl.value = selectedName;
    }
  }

  // ── Apply overlay colour ───────────────────────────────────────────────────
  function applyOverlay() {
    const category = categoryEl ? categoryEl.value : DEFAULTS.presetCategory;
    const name     = nameEl     ? nameEl.value     : DEFAULTS.presetName;
    const alpha    = alphaEl    ? Number(alphaEl.value) / 100 : DEFAULTS.overlayAlpha / 100;

    const colour = (PRESETS[category] || {})[name];
    if (!colour) return;

    const rgba = `rgba(${colour.r}, ${colour.g}, ${colour.b}, ${alpha.toFixed(2)})`;

    if (overlayEl) {
      overlayEl.style.backgroundColor = rgba;
    }
  }

  // ── Apply text settings ────────────────────────────────────────────────────
  function applyText() {
    const viewer = document.getElementById("viewer");
    if (!viewer) return;

    if (fontSizeEl)   viewer.style.fontSize  = fontSizeEl.value + "px";
    if (lineHeightEl) viewer.style.lineHeight = lineHeightEl.value;
  }

  // ── Update display pills ───────────────────────────────────────────────────
  function updatePills() {
    if (alphaEl    && alphaValueEl)  alphaValueEl.textContent  = alphaEl.value    + "%";
    if (fontSizeEl && fontSizeValEl) fontSizeValEl.textContent = fontSizeEl.value + "px";
    if (lineHeightEl && lineHtValEl) lineHtValEl.textContent   = lineHeightEl.value;
  }

  // ── Reset to defaults ──────────────────────────────────────────────────────
  function resetToDefaults() {
    if (categoryEl)   categoryEl.value   = DEFAULTS.presetCategory;
    if (alphaEl)      alphaEl.value      = DEFAULTS.overlayAlpha;
    if (fontSizeEl)   fontSizeEl.value   = DEFAULTS.fontSize;
    if (lineHeightEl) lineHeightEl.value = DEFAULTS.lineHeight;

    populatePresetNames(DEFAULTS.presetCategory, DEFAULTS.presetName);
    if (nameEl) nameEl.value = DEFAULTS.presetName;

    updatePills();
    applyOverlay();
    applyText();
  }

  // ── Event wiring ───────────────────────────────────────────────────────────
  if (categoryEl) {
    categoryEl.addEventListener("change", () => {
      populatePresetNames(categoryEl.value);
      applyOverlay();
    });
  }

  if (nameEl)       nameEl.addEventListener("change", applyOverlay);

  if (alphaEl) {
    alphaEl.addEventListener("input", () => {
      updatePills();
      applyOverlay();
    });
  }

  if (fontSizeEl) {
    fontSizeEl.addEventListener("input", () => {
      updatePills();
      applyText();
    });
  }

  if (lineHeightEl) {
    lineHeightEl.addEventListener("input", () => {
      updatePills();
      applyText();
    });
  }

  if (resetBtn) resetBtn.addEventListener("click", resetToDefaults);

  // ── Initialise ─────────────────────────────────────────────────────────────
  const initCategory = categoryEl ? categoryEl.value : DEFAULTS.presetCategory;
  populatePresetNames(initCategory);
  updatePills();
  applyOverlay();
  applyText();

  // Expose PRESETS so popup.js (and other scripts) can read them if needed
  window.VSS = { PRESETS, DEFAULTS };
})();
