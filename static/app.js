/* ===================================================================
   VSS Accessibility Tools — app.js
   Shared between the Flask web app and the Chrome extension popup.
   The Flask app uses this for full document handling.
   The extension popup (popup.js) extends it with chrome.storage.
   =================================================================== */

(function () {
  'use strict';

  /* ── 1. Preset library ─────────────────────────────────────────── */

  /* Harvard accessibility-inspired background palette */
  const BG_PALETTE = [
    '#fdf8f2', // Warm White (default)
    '#fdf6e3', // Harvard Warm
    '#fffde6', // Pale Yellow
    '#e8f4ff', // Pale Blue
    '#e8f9f0', // Pale Green
    '#f0eaff', // Soft Lavender
    '#f5ebe0', // Sepia
    '#f5f5f5', // Light Gray
    '#1a1a2e', // Dark Navy
    '#0d0d0d', // Near Black
    '#000000', // Black
    '#ffffff', // White
  ];

  const TEXT_PALETTE = [
    '#1a1a1a', // Near Black (default)
    '#000000', // Black
    '#2c1810', // Dark Brown
    '#0a1a2f', // Dark Navy
    '#0a1f14', // Dark Forest
    '#3b2f1e', // Dark Sepia
    '#e0e0f0', // Soft Light
    '#f0f0f0', // Off-White
    '#ffffff', // White
    '#ffff00', // Yellow
    '#00ffcc', // Cyan
  ];

  const PRESETS = {
    accessibility: {
      'Default': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#fdf8f2', textColor: '#1a1a1a',
        brightness: 100, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
      'Dyslexia Friendly': {
        fontFamily: 'OpenDyslexic, sans-serif',
        fontSize: 20, lineHeight: 1.9, letterSpacing: 0.05, wordSpacing: 0.1,
        margin: 50, maxWidth: 750,
        bgColor: '#fffde6', textColor: '#1a1a1a',
        brightness: 100, whitePoint: 10, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
      'Low Vision': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 26, lineHeight: 2.0, letterSpacing: 0.04, wordSpacing: 0.12,
        margin: 60, maxWidth: 700,
        bgColor: '#ffffff', textColor: '#000000',
        brightness: 100, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
      'Harvard Warm': {
        fontFamily: 'Georgia, serif',
        fontSize: 18, lineHeight: 1.7, letterSpacing: 0.01, wordSpacing: 0.05,
        margin: 48, maxWidth: 800,
        bgColor: '#fdf6e3', textColor: '#2c1810',
        brightness: 98, whitePoint: 8, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
    },
    visual: {
      'Sepia': {
        fontFamily: 'Georgia, serif',
        fontSize: 18, lineHeight: 1.7, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#f5ebe0', textColor: '#3b2f1e',
        brightness: 95, whitePoint: 15, grayscale: false,
        overlayAlpha: 20, overlayColor: '255,180,0',
      },
      'Cream': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#fffef0', textColor: '#1a1a1a',
        brightness: 100, whitePoint: 5, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
      'Cool Blue': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#e8f4ff', textColor: '#0a1a2f',
        brightness: 98, whitePoint: 0, grayscale: false,
        overlayAlpha: 10, overlayColor: '100,180,255',
      },
      'Soft Green': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#e8f9f0', textColor: '#0a1f14',
        brightness: 98, whitePoint: 0, grayscale: false,
        overlayAlpha: 8, overlayColor: '150,210,150',
      },
      'Night Mode': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.7, letterSpacing: 0.01, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#1a1a2e', textColor: '#e0e0f0',
        brightness: 90, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,180,0',
      },
      'NoIR Amber': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#fdf8f2', textColor: '#1a1a1a',
        brightness: 95, whitePoint: 20, grayscale: false,
        overlayAlpha: 35, overlayColor: '255,180,0',
      },
    },
    contrast: {
      'High Contrast': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 20, lineHeight: 1.8, letterSpacing: 0.02, wordSpacing: 0.05,
        margin: 40, maxWidth: 800,
        bgColor: '#ffffff', textColor: '#000000',
        brightness: 100, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,255,255',
      },
      'Dark Mode': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#0d0d0d', textColor: '#f0f0f0',
        brightness: 100, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,255,255',
      },
      'Yellow on Black': {
        fontFamily: "'Courier New', monospace",
        fontSize: 18, lineHeight: 1.7, letterSpacing: 0.03, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#000000', textColor: '#ffff00',
        brightness: 100, whitePoint: 0, grayscale: false,
        overlayAlpha: 0, overlayColor: '255,255,255',
      },
      'Grayscale': {
        fontFamily: "'Atkinson Hyperlegible', sans-serif",
        fontSize: 18, lineHeight: 1.6, letterSpacing: 0, wordSpacing: 0,
        margin: 40, maxWidth: 800,
        bgColor: '#f5f5f5', textColor: '#1a1a1a',
        brightness: 100, whitePoint: 0, grayscale: true,
        overlayAlpha: 0, overlayColor: '255,255,255',
      },
    },
  };

  /* ── 2. Application state ──────────────────────────────────────── */
  const DEFAULT = PRESETS.accessibility['Default'];
  let state = Object.assign({}, DEFAULT);

  /* ── 3. Element references ─────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);

  const el = {
    presetCategory:     $('presetCategory'),
    presetName:         $('presetName'),
    applyPreset:        $('applyPreset'),
    reset:              $('reset'),

    fontFamily:         $('fontFamily'),
    fontSize:           $('fontSize'),       fontSizeValue:       $('fontSizeValue'),
    lineHeight:         $('lineHeight'),     lineHeightValue:     $('lineHeightValue'),
    letterSpacing:      $('letterSpacing'),  letterSpacingValue:  $('letterSpacingValue'),
    wordSpacing:        $('wordSpacing'),    wordSpacingValue:    $('wordSpacingValue'),

    margin:             $('margin'),         marginValue:         $('marginValue'),
    maxWidth:           $('maxWidth'),       maxWidthValue:       $('maxWidthValue'),

    bgColor:            $('bgColor'),        bgPalette:           $('bgPalette'),
    textColor:          $('textColor'),      textPalette:         $('textPalette'),

    brightness:         $('brightness'),     brightnessValue:     $('brightnessValue'),
    whitePoint:         $('whitePoint'),     whitePointValue:     $('whitePointValue'),
    grayscale:          $('grayscale'),

    overlayColor:       $('overlayColor'),
    overlayAlpha:       $('overlayAlpha'),   overlayAlphaValue:   $('overlayAlphaValue'),

    fileInput:          $('fileInput'),
    filename:           $('filename'),
    exportBtn:          $('exportBtn'),
    exportFormat:       $('exportFormat'),
    docContent:         $('docContent'),
    docOverlay:         $('docOverlay'),

    settingsToggle:     $('settingsToggle'),
    controls:           $('controls'),
  };

  /* ── 4. Apply state → CSS variables ───────────────────────────── */
  function applySettings() {
    const root = document.documentElement;

    root.style.setProperty('--doc-font-family',    state.fontFamily);
    root.style.setProperty('--doc-font-size',      state.fontSize + 'px');
    root.style.setProperty('--doc-line-height',    state.lineHeight);
    root.style.setProperty('--doc-letter-spacing', state.letterSpacing + 'em');
    root.style.setProperty('--doc-word-spacing',   state.wordSpacing + 'em');
    root.style.setProperty('--doc-padding',        state.margin + 'px');
    root.style.setProperty('--doc-max-width',      state.maxWidth + 'px');
    root.style.setProperty('--doc-bg',             state.bgColor);
    root.style.setProperty('--doc-color',          state.textColor);

    // CSS filter: grayscale + brightness
    const filters = [];
    if (state.grayscale)            filters.push('grayscale(100%)');
    if (state.brightness !== 100)   filters.push('brightness(' + (state.brightness / 100) + ')');
    root.style.setProperty('--doc-filter', filters.length ? filters.join(' ') : 'none');

    // Tint overlay: combines white-point reduction and explicit overlay strength
    if (el.docOverlay) {
      const wpAlpha   = (state.whitePoint / 100) * 0.4;     // max 40 % from white-point
      const tintAlpha = state.overlayAlpha / 100;
      const combined  = Math.min(wpAlpha + tintAlpha, 0.88);
      const rgb       = state.overlayColor || '255,180,0';
      el.docOverlay.style.backgroundColor = 'rgba(' + rgb + ',' + combined + ')';
    }
  }

  /* ── 5. Sync form controls → display values ────────────────────── */
  function syncDisplay() {
    function setVal(id, val)  { if (el[id])              el[id].value   = val; }
    function setTxt(id, text) { if (el[id])              el[id].textContent = text; }
    function setChk(id, bool) { if (el[id])              el[id].checked = bool; }

    setVal('fontFamily',    state.fontFamily);
    setVal('fontSize',      state.fontSize);
    setTxt('fontSizeValue',      state.fontSize + 'px');
    setVal('lineHeight',    state.lineHeight);
    setTxt('lineHeightValue',    state.lineHeight);
    setVal('letterSpacing', state.letterSpacing);
    setTxt('letterSpacingValue', state.letterSpacing + 'em');
    setVal('wordSpacing',   state.wordSpacing);
    setTxt('wordSpacingValue',   state.wordSpacing + 'em');
    setVal('margin',        state.margin);
    setTxt('marginValue',        state.margin + 'px');
    setVal('maxWidth',      state.maxWidth);
    setTxt('maxWidthValue',      state.maxWidth + 'px');
    setVal('bgColor',       state.bgColor);
    setVal('textColor',     state.textColor);
    setVal('brightness',    state.brightness);
    setTxt('brightnessValue',    state.brightness + '%');
    setVal('whitePoint',    state.whitePoint);
    setTxt('whitePointValue',    state.whitePoint + '%');
    setChk('grayscale',     state.grayscale);
    setVal('overlayColor',  state.overlayColor);
    setVal('overlayAlpha',  state.overlayAlpha);
    setTxt('overlayAlphaValue',  state.overlayAlpha + '%');
  }

  /* ── 6. Preset helpers ─────────────────────────────────────────── */
  function populatePresets(category) {
    if (!el.presetName) return;
    el.presetName.innerHTML = '';
    const group = PRESETS[category] || {};
    for (const name of Object.keys(group)) {
      const opt = document.createElement('option');
      opt.value = opt.textContent = name;
      el.presetName.appendChild(opt);
    }
  }

  /* ── 7. Colour palette builder ─────────────────────────────────── */
  function buildPalette(container, colours, onClick) {
    if (!container) return;
    container.innerHTML = '';
    for (const hex of colours) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette__swatch';
      btn.style.background = hex;
      btn.title = hex;
      btn.setAttribute('aria-label', 'Color ' + hex);
      btn.addEventListener('click', () => onClick(hex));
      container.appendChild(btn);
    }
  }

  /* ── 8. Event listener helper ──────────────────────────────────── */
  function on(elem, event, fn) {
    if (elem) elem.addEventListener(event, fn);
  }

  /* ── 9. Control event listeners ────────────────────────────────── */

  // Presets
  on(el.presetCategory, 'change', () => populatePresets(el.presetCategory.value));

  on(el.applyPreset, 'click', () => {
    const cat    = el.presetCategory ? el.presetCategory.value : 'accessibility';
    const name   = el.presetName     ? el.presetName.value     : '';
    const preset = (PRESETS[cat] || {})[name];
    if (preset) {
      state = Object.assign({}, preset);
      syncDisplay();
      applySettings();
    }
  });

  on(el.reset, 'click', () => {
    state = Object.assign({}, DEFAULT);
    syncDisplay();
    applySettings();
  });

  // Typography
  on(el.fontFamily, 'change', () => {
    state.fontFamily = el.fontFamily.value;
    applySettings();
  });
  on(el.fontSize, 'input', () => {
    state.fontSize = parseFloat(el.fontSize.value);
    if (el.fontSizeValue) el.fontSizeValue.textContent = state.fontSize + 'px';
    applySettings();
  });
  on(el.lineHeight, 'input', () => {
    state.lineHeight = parseFloat(el.lineHeight.value);
    if (el.lineHeightValue) el.lineHeightValue.textContent = state.lineHeight;
    applySettings();
  });
  on(el.letterSpacing, 'input', () => {
    state.letterSpacing = parseFloat(el.letterSpacing.value);
    if (el.letterSpacingValue) el.letterSpacingValue.textContent = state.letterSpacing + 'em';
    applySettings();
  });
  on(el.wordSpacing, 'input', () => {
    state.wordSpacing = parseFloat(el.wordSpacing.value);
    if (el.wordSpacingValue) el.wordSpacingValue.textContent = state.wordSpacing + 'em';
    applySettings();
  });

  // Layout
  on(el.margin, 'input', () => {
    state.margin = parseFloat(el.margin.value);
    if (el.marginValue) el.marginValue.textContent = state.margin + 'px';
    applySettings();
  });
  on(el.maxWidth, 'input', () => {
    state.maxWidth = parseFloat(el.maxWidth.value);
    if (el.maxWidthValue) el.maxWidthValue.textContent = state.maxWidth + 'px';
    applySettings();
  });

  // Colors
  on(el.bgColor,   'input', () => { state.bgColor   = el.bgColor.value;   applySettings(); });
  on(el.textColor, 'input', () => { state.textColor = el.textColor.value; applySettings(); });

  // Visual filters
  on(el.brightness, 'input', () => {
    state.brightness = parseFloat(el.brightness.value);
    if (el.brightnessValue) el.brightnessValue.textContent = state.brightness + '%';
    applySettings();
  });
  on(el.whitePoint, 'input', () => {
    state.whitePoint = parseFloat(el.whitePoint.value);
    if (el.whitePointValue) el.whitePointValue.textContent = state.whitePoint + '%';
    applySettings();
  });
  on(el.grayscale, 'change', () => { state.grayscale = el.grayscale.checked; applySettings(); });
  on(el.overlayColor,'change', () => { state.overlayColor = el.overlayColor.value;            applySettings(); });
  on(el.overlayAlpha,'input',  () => { state.overlayAlpha = parseFloat(el.overlayAlpha.value);
                                       if (el.overlayAlphaValue) el.overlayAlphaValue.textContent = state.overlayAlpha + '%'; applySettings(); });

  // Mobile settings toggle
  on(el.settingsToggle, 'click', () => el.controls && el.controls.classList.toggle('is-open'));

  /* ── 10. Document upload ───────────────────────────────────────── */
  on(el.fileInput, 'change', async () => {
    const file = el.fileInput && el.fileInput.files && el.fileInput.files[0];
    if (!file) return;

    if (el.filename) el.filename.textContent = 'Uploading…';

    const form = new FormData();
    form.append('file', file);

    try {
      const res  = await fetch('/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || 'Upload failed');
        if (el.filename) el.filename.textContent = 'Upload failed';
        return;
      }

      if (el.docContent) {
        el.docContent.innerHTML = '';
        // Render each line as a <p> so contenteditable behaves naturally
        for (const line of data.text.split('\n')) {
          const p = document.createElement('p');
          p.textContent = line || '\u00A0'; // non-breaking space keeps empty lines visible
          el.docContent.appendChild(p);
        }
      }

      if (el.filename)  el.filename.textContent = data.filename;
      if (el.exportBtn) {
        el.exportBtn.disabled    = false;
        el.exportBtn._filename   = data.filename;
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
      if (el.filename) el.filename.textContent = 'Upload failed';
    }
  });

  /* ── 11. Export ────────────────────────────────────────────────── */
  on(el.exportBtn, 'click', async () => {
    if (!el.docContent || (el.exportBtn && el.exportBtn.disabled)) return;

    const text     = el.docContent.innerText || el.docContent.textContent || '';
    const fmt      = el.exportFormat ? el.exportFormat.value : 'txt';
    const filename = (el.exportBtn && el.exportBtn._filename) || 'document.txt';

    const payload = {
      text,
      format: fmt,
      filename,
      settings: {
        fontFamily: state.fontFamily,
        fontSize:   state.fontSize,
        lineHeight: state.lineHeight,
        margin:     state.margin,
        maxWidth:   state.maxWidth,
      },
    };

    try {
      const res = await fetch('/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err && err.error) || 'Export failed');
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename.replace(/\.[^.]+$/, '') + '.' + fmt;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export error: ' + err.message);
    }
  });

  /* ── 12. Initialise ────────────────────────────────────────────── */
  function init() {
    if (el.presetCategory) populatePresets(el.presetCategory.value);

    buildPalette(el.bgPalette, BG_PALETTE, (hex) => {
      state.bgColor = hex;
      if (el.bgColor) el.bgColor.value = hex;
      applySettings();
    });

    buildPalette(el.textPalette, TEXT_PALETTE, (hex) => {
      state.textColor = hex;
      if (el.textColor) el.textColor.value = hex;
      applySettings();
    });

    syncDisplay();
    applySettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose state API for popup.js (chrome.storage sync) */
  window.__vssGetState = () => Object.assign({}, state);
  window.__vssSetState = (patch) => { Object.assign(state, patch); syncDisplay(); applySettings(); };
})();
