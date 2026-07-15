import { defineBackground, browser } from '#imports';

// Minimal background service worker. Peekover makes zero network calls by default
// (AGENTS.md non-negotiable #1) — this registers exactly one listener and no more.
//
// The toolbar action (spec 002 / task 1.1) has no popup, so a click dispatches
// `action.onClicked` here; we open the bundled app page in a FULL TAB. A full-tab
// extension page — not a popup — is the surface where showDirectoryPicker() and
// requestPermission() actually work (spec §3, Task-0-verified); the action's only
// job is to open that page. `tabs.create` with the extension's OWN URL needs no
// `tabs` permission (only reading privileged tab fields would), so `permissions: []`
// is preserved — CI-pinned by tests/manifest.test.ts.
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    void browser.tabs.create({ url: browser.runtime.getURL('/app.html') });
  });
});
