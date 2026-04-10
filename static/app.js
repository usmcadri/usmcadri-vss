/**
 * app.js – shared UI logic for the VSS Document Viewer web app
 * and the VSS Tools browser-extension popup.
 *
 * Responsibilities:
 *   • Populate and react to the colour-preset dropdowns
 *   • Apply a tint overlay to #viewerOverlay
 *   • Apply font-size and line-height as CSS custom properties
 */
(function () {
  'use strict';

  // ── Preset colour definitions ──────────────────────────────────────────────
  // Each entry defines the RGB of the tint colour applied over the document.
  const PRESETS = {
    whiteBalance: {
      'Warm':    { r: 255, g: 200, b: 120 },
      'Cool':    { r: 100, g: 140, b: 255 },
      'Neutral': { r: 200, g: 200, b: 200 },
      'Sepia':   { r: 220, g: 175, b: 110 },
    },
    visionCondition: {
      'Standard VSS':  { r: 180, g: 170, b: 210 },
      'Photophobia':   { r:   0, g:   0, b:   0 },
      'Low Contrast':  { r: 180, g: 180, b: 180 },
      'Migraine Ease': { r: 120, g: 200, b: 170 },
    },
    noir: {
      'Amber':  { r: 255, g: 176, b:   0 },
      'Red':    { r: 255, g:  80, b:  80 },
      'Grey':   { r: 128, g: 128, b: 128 },
      'Yellow': { r: 255, g: 240, b:   0 },
      'Rose':   { r: 255, g: 150, b: 200 },
    },
  };

  const DEFAULTS = { alpha: 35, fontSize: 18, lineHeight: 1.6 };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Overlay ────────────────────────────────────────────────────────────────
  function applyOverlay() {
    const overlay = el('viewerOverlay');
    if (!overlay) return;

    const category = (el('presetCategory') || {}).value || 'whiteBalance';
    const name     = (el('presetName')     || {}).value || '';
    const alpha    = parseInt((el('overlayAlpha') || { value: DEFAULTS.alpha }).value, 10);

    const group = PRESETS[category] || {};
    const c     = group[name] || { r: 200, g: 200, b: 200 };
    // Cap effective opacity at 0.55 so text remains legible
    const a = ((alpha / 100) * 0.55).toFixed(3);

    overlay.style.background = `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
  }

  // ── Typography (CSS custom properties) ────────────────────────────────────
  function applyFontSize(value) {
    const px = Math.max(14, Math.min(28, parseInt(value, 10) || DEFAULTS.fontSize));
    document.documentElement.style.setProperty('--viewer-font-size', px + 'px');
    const badge = el('fontSizeValue');
    if (badge) badge.textContent = px + 'px';
  }

  function applyLineHeight(value) {
    const lh = Math.max(1.2, Math.min(3.0, parseFloat(value) || DEFAULTS.lineHeight));
    document.documentElement.style.setProperty('--viewer-line-height', lh);
    const badge = el('lineHeightValue');
    if (badge) badge.textContent = lh.toFixed(1);
  }

  // ── Preset name dropdown ───────────────────────────────────────────────────
  function populatePresetNames(category) {
    const select = el('presetName');
    if (!select) return;
    select.innerHTML = '';
    Object.keys(PRESETS[category] || {}).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetAll() {
    const alphaEl      = el('overlayAlpha');
    const alphaBadge   = el('overlayAlphaValue');
    const fontSizeEl   = el('fontSize');
    const lineHeightEl = el('lineHeight');
    const categoryEl   = el('presetCategory');

    if (alphaEl)    alphaEl.value = DEFAULTS.alpha;
    if (alphaBadge) alphaBadge.textContent = DEFAULTS.alpha + '%';
    if (fontSizeEl) { fontSizeEl.value = DEFAULTS.fontSize; applyFontSize(DEFAULTS.fontSize); }
    if (lineHeightEl) { lineHeightEl.value = DEFAULTS.lineHeight; applyLineHeight(DEFAULTS.lineHeight); }
    if (categoryEl) {
      categoryEl.value = 'whiteBalance';
      populatePresetNames('whiteBalance');
    }
    applyOverlay();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    const categoryEl   = el('presetCategory');
    const alphaEl      = el('overlayAlpha');
    const alphaBadge   = el('overlayAlphaValue');
    const fontSizeEl   = el('fontSize');
    const lineHeightEl = el('lineHeight');
    const resetBtn     = el('reset');

    if (categoryEl) {
      populatePresetNames(categoryEl.value);
      categoryEl.addEventListener('change', () => {
        populatePresetNames(categoryEl.value);
        applyOverlay();
      });
    }

    const presetNameEl = el('presetName');
    if (presetNameEl) presetNameEl.addEventListener('change', applyOverlay);

    if (alphaEl) {
      alphaEl.addEventListener('input', () => {
        if (alphaBadge) alphaBadge.textContent = alphaEl.value + '%';
        applyOverlay();
      });
    }

    if (fontSizeEl) {
      fontSizeEl.addEventListener('input', () => applyFontSize(fontSizeEl.value));
      applyFontSize(fontSizeEl.value);
    }

    if (lineHeightEl) {
      lineHeightEl.addEventListener('input', () => applyLineHeight(lineHeightEl.value));
      applyLineHeight(lineHeightEl.value);
    }

    if (resetBtn) resetBtn.addEventListener('click', resetAll);

    applyOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
