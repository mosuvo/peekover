import { defineBackground, browser } from '#imports';
import { getSettings, putSettings } from '@/src/app/store';
import { createSettingsListener } from '@/src/settings/settingsPort';

// Minimal background service worker. Peekover makes zero network calls by default
// (AGENTS.md non-negotiable #1). It registers TWO listeners and no other logic:
//   1. the toolbar action (spec 002), and
//   2. the settings message handler (spec 004, the second listener — task 2.3).
//
// (1) The toolbar action has no popup, so a click dispatches `action.onClicked` here;
// we open the bundled app page in a FULL TAB. A full-tab extension page — not a popup —
// is the surface where showDirectoryPicker()/requestPermission() actually work (spec §3,
// Task-0-verified). `tabs.create` with the extension's OWN URL needs no `tabs` permission
// (only reading privileged tab fields would), so `permissions: []` is preserved.
//
// (2) The content-script reader's own origin cannot see the extension IndexedDB, so it
// reaches settings by messaging THIS context (plan §1.2). We answer against store.ts —
// the background's OWN memoized idbCore connection, correct across an extension update
// because of task 1.2's `db.onversionchange` close-and-drop. Content→own-background
// messaging is always available with NO permission, so `permissions: []` still holds
// (CI-pinned by tests/manifest.test.ts). The listener's cross-engine async-response
// contract (return true + sendResponse) lives in createSettingsListener.
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    void browser.tabs.create({ url: browser.runtime.getURL('/app.html') });
  });

  browser.runtime.onMessage.addListener(createSettingsListener({ getSettings, putSettings }));
});
