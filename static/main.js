/**
 * main.js – document-specific logic for the VSS Document Viewer web app.
 *
 * Responsibilities:
 *   • File upload (via button or drag-and-drop)
 *   • Displaying and editing document text
 *   • White-point brightness filter
 *   • Background and text colour pickers
 *   • Font family selector (System / OpenDyslexic / Courier New)
 *   • Margin control
 *   • Sidebar toggle (small screens)
 *   • Document export as .txt
 */
(function () {
  'use strict';

  // ── Font map ───────────────────────────────────────────────────────────────
  const FONT_MAP = {
    system:       "system-ui, -apple-system, sans-serif",
    opendyslexic: "'OpenDyslexic', 'Comic Sans MS', cursive",
    courier:      "'Courier New', 'Courier', monospace",
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let currentFilename = '';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  let toastTimer = null;
  function showToast(msg, ms) {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), ms || 3000);
  }

  // ── Document display ───────────────────────────────────────────────────────
  function showDocument(text, filename) {
    currentFilename = filename;
    const content     = el('viewerContent');
    const placeholder = el('viewerPlaceholder');
    const exportBtn   = el('exportBtn');
    if (!content) return;
    content.textContent = text;
    content.hidden = false;
    if (placeholder) placeholder.hidden = true;
    if (exportBtn)   exportBtn.disabled = false;
    content.focus();
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const ALLOWED_EXTS = ['.txt', '.docx', '.pdf'];

  function handleFile(file) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      showToast('Only .txt, .docx, and .pdf files are supported.', 4500);
      return;
    }

    showToast('Loading\u2026', 60000);

    const fd = new FormData();
    fd.append('file', file);

    fetch('/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(data => {
        if (data.error) { showToast(data.error, 5000); return; }
        showDocument(data.content, data.filename);
        showToast('Document loaded.', 2500);
      })
      .catch(() => showToast('Upload failed. Please try again.', 4500));
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExport() {
    const content = el('viewerContent');
    if (!content) return;
    const text = content.innerText || content.textContent || '';

    fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, filename: currentFilename }),
    })
      .then(async res => {
        if (!res.ok) { showToast('Export failed.', 3000); return; }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const disp = res.headers.get('Content-Disposition') || '';
        const m    = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)/i);
        a.download = m ? decodeURIComponent(m[1]) : 'document_edited.txt';
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Exported successfully.', 2500);
      })
      .catch(() => showToast('Export failed.', 3000));
  }

  // ── White point ────────────────────────────────────────────────────────────
  function applyWhitePoint(value) {
    const wrap = el('viewerWrap');
    if (!wrap) return;
    const pct  = Math.max(30, Math.min(100, parseInt(value, 10) || 90));
    wrap.style.filter = `brightness(${pct}%)`;
    const badge = el('whitePointValue');
    if (badge) badge.textContent = pct + '%';
  }

  // ── Background colour ──────────────────────────────────────────────────────
  function applyBgColor(value) {
    const wrap        = el('viewerWrap');
    const placeholder = el('viewerPlaceholder');
    if (wrap)        wrap.style.background        = value;
    if (placeholder) placeholder.style.background = value;
  }

  // ── Text colour ────────────────────────────────────────────────────────────
  function applyTextColor(value) {
    const content = el('viewerContent');
    if (content) content.style.color = value;
  }

  // ── Font family ────────────────────────────────────────────────────────────
  function applyFontFamily(value) {
    const content = el('viewerContent');
    if (content) content.style.fontFamily = FONT_MAP[value] || FONT_MAP.system;
  }

  // ── Margins ────────────────────────────────────────────────────────────────
  function applyMargins(value) {
    const content = el('viewerContent');
    if (!content) return;
    const pct = Math.max(0, Math.min(20, parseInt(value, 10) || 5));
    content.style.paddingLeft  = pct + '%';
    content.style.paddingRight = pct + '%';
    const badge = el('marginsValue');
    if (badge) badge.textContent = pct + '%';
  }

  // ── Sidebar toggle ─────────────────────────────────────────────────────────
  function initSidebarToggle() {
    const btn   = el('sidebarToggle');
    const panel = el('controls');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => panel.classList.toggle('is-open'));
  }

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  function initDragDrop() {
    const wrap = el('viewerWrap');
    if (!wrap) return;

    wrap.addEventListener('dragover', e => {
      e.preventDefault();
      wrap.classList.add('drag-over');
    });

    ['dragleave', 'dragend'].forEach(evt =>
      wrap.addEventListener(evt, () => wrap.classList.remove('drag-over'))
    );

    wrap.addEventListener('drop', e => {
      e.preventDefault();
      wrap.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  // ── Load OpenDyslexic font ─────────────────────────────────────────────────
  function loadOpenDyslexicFont() {
    if (document.getElementById('od-font-style')) return;
    const style = document.createElement('style');
    style.id = 'od-font-style';
    style.textContent = [
      '@font-face {',
      "  font-family: 'OpenDyslexic';",
      "  src: url('https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@master/compiled/OpenDyslexic-Regular.otf')",
      "       format('opentype');",
      '  font-weight: normal;',
      '  font-style: normal;',
      '  font-display: swap;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Wire up all controls ───────────────────────────────────────────────────
  function initControls() {
    const fileInput  = el('fileInput');
    const exportBtn  = el('exportBtn');
    const whitePoint = el('whitePoint');
    const bgColor    = el('bgColor');
    const textColor  = el('textColor');
    const fontFamily = el('fontFamily');
    const margins    = el('margins');

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        handleFile(fileInput.files[0]);
        fileInput.value = '';   // allow re-selecting the same file
      });
    }

    if (exportBtn) exportBtn.addEventListener('click', handleExport);

    if (whitePoint) {
      whitePoint.addEventListener('input', () => applyWhitePoint(whitePoint.value));
      applyWhitePoint(whitePoint.value);
    }

    if (bgColor) {
      bgColor.addEventListener('input', () => applyBgColor(bgColor.value));
      applyBgColor(bgColor.value);
    }

    if (textColor) {
      textColor.addEventListener('input', () => applyTextColor(textColor.value));
      applyTextColor(textColor.value);
    }

    if (fontFamily) {
      fontFamily.addEventListener('change', () => applyFontFamily(fontFamily.value));
    }

    if (margins) {
      margins.addEventListener('input', () => applyMargins(margins.value));
      applyMargins(margins.value);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    loadOpenDyslexicFont();
    initControls();
    initSidebarToggle();
    initDragDrop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
