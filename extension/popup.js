// Persist the same control values used by static/app.js.
// app.js runs first and initializes defaults; here we restore and then save on changes.
(function () {
  const KEY = "vssSettings";
  const ids = ["presetCategory", "presetName", "overlayAlpha", "fontSize", "lineHeight"];

  function readControls() {
    const state = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      state[id] = el.value;
    }
    return state;
  }

  function writeControls(state) {
    for (const id of ids) {
      if (!(id in state)) continue;
      const el = document.getElementById(id);
      if (!el) continue;

      el.value = state[id];

      // Trigger input/change so app.js applies immediately
      const evtType = el.tagName === "SELECT" ? "change" : "input";
      el.dispatchEvent(new Event(evtType, { bubbles: true }));
    }
  }

  function attachSave() {
    const save = () => chrome.storage.sync.set({ [KEY]: readControls() });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;

      const evtType = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evtType, save);
    }
  }

  chrome.storage.sync.get(KEY, (res) => {
    if (res && res[KEY]) writeControls(res[KEY]);
    attachSave();
  });
})();
