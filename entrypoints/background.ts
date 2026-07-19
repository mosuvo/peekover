import { defineBackground, browser } from '#imports';
import { getSettings, putSettings } from '@/src/app/store';
import { createSettingsListener } from '@/src/settings/settingsPort';
import { createWatchListener } from '@/src/watch/watchRelay';

// Minimal background service worker. Peekover makes zero network calls by default
// (AGENTS.md non-negotiable #1). It registers THREE listeners and no other logic:
//   1. the toolbar action (spec 002),
//   2. the settings message handler (spec 004, the second listener — task 2.3), and
//   3. the watch relay (spec 005, the third listener — task 2.2).
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
// (3) A content script runs in the PAGE's origin and cannot reliably re-read its own
// `file://` document; THIS context can. So watch's polling loop — which lives in the
// page, not here — asks the background for fresh bytes each tick and gets one response.
// The background holds NO watch state: no timer, no registry, nothing to lose when the
// MV3 worker is evicted (which is what dissolves spec §7-6), and the watch dies with the
// tab that owns it. Reading a `file://` URL the user themselves opened is not a network
// call and lights no indicator (spec §3.6-A); `createWatchListener` REFUSES anything that
// is not a `file://` markdown URL, so this can never become a general read oracle — that
// validation, not this comment, is the guarantee (src/watch/watchRelay.ts). Still no
// permission required, so `permissions: []` holds (CI-pinned by tests/manifest.test.ts).
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    void browser.tabs.create({ url: browser.runtime.getURL('/app.html') });
  });

  browser.runtime.onMessage.addListener(createSettingsListener({ getSettings, putSettings }));

  // Both listeners see every message; each returns `false` for what is not its own, so they
  // coexist without either hijacking the other's response channel (settingsPort.ts header).
  browser.runtime.onMessage.addListener(
    createWatchListener(async (url) => {
      const response = await fetch(url);
      // A `file://` fetch reports `status: 0` on a successful read in some engines, so `ok` alone
      // is not a usable signal here — a missing file rejects or yields an empty body instead.
      if (!response.ok && response.status !== 0) {
        throw new Error(`cannot read file (status ${response.status})`);
      }
      return response.text();
    }),
  );
});
