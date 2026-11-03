// captureDisclosure — the D-3 persistent capture disclosure, PRODUCTION-PATH proof (M6 task 3.1),
// Chromium AND Firefox.
//
// NEW FILE, not an extension of watchControl.browser.test.ts or diffRegistry.browser.test.ts: the
// subject is the disclosure's SURFACE GATE — shown where the surface can watch AND has a registered
// diff context, absent everywhere else — and it needs both `resetDiffRegistryForTest` and a wipeAll
// in beforeEach. Keeping it apart makes the red-first mutation's blast radius unmistakable.
//
// THE M5 SEAM RULE IS THE POINT (the 2.1 precedent, inherited verbatim). The app-page case drives
// the REAL user-gesture chain — mountAppShell → open folder → click the file — and NEVER hand-calls
// `buildDisclosure` or `registerDiffContext`; the only registration observed is the one
// `installWatchForFile` performs, and the disclosure is read out of the shipped reader shadow. The
// content-script cases drive the production `installContentWatch` path. Presence-by-render, never a
// hand-fired subscription — anything less would prove nothing about the shipped bundle.
//
// THE THREE SURFACES, AND WHY THE MIDDLE ONE IS LOAD-BEARING:
//   • APP PAGE — since 013 task 4.5 its disclosure is the one-time notice below the toolbar, not this element
//     (C084, replaced: snapshotNotice.browser.test.ts).
//   • CHROMIUM CONTENT-SCRIPT file:// — CAN watch (a real target is registered), but no diff
//     context → the disclosure MUST be absent. This is the exact surface a `watchAvailable()`-only
//     gate ships it to (the D-14 trap); the red-first mutation below reddens HERE and only here.
//   • FIREFOX / remote content-script — cannot watch at all → absent, the first-gate suppression.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { installContentWatch } from '../../src/watch/contentWatch';
import { resetDiffRegistryForTest, isDiffContextRegistered } from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest, watchAvailable } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_DISCLOSURE_CLASS } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';

const DOC_A = '# Version A\n\nalpha body text.\n';

const DISCLOSURE = `.${WATCH_DISCLOSURE_CLASS}`;

/** Stand-in for the background relay (the diffRegistry precedent): answers the real `WATCH_READ`
 *  wire shape so `relayRead` / `pollingDetector` are production code under test. */
function fakeBackground(initial: string): { send: (m: WatchMessage) => Promise<unknown> } {
  return {
    send: async (m) => {
      expect(m.type).toBe(WATCH_READ);
      return { ok: true, text: initial };
    },
  };
}

function makeHost(tag: string): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

const containers: HTMLElement[] = [];

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(() => {
  __resetConnectionForTest();
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
});

// REPLACED (C084) at 013 task 4.5: "the app page PRODUCTION path renders it" (the shadow-root disclosure in the
// reader chrome). The app page mounts its reader with `pills: false`, so the disclosure is no longer built there:
// its replacement is the one-time snapshot notice below the toolbar, with the same §3.6 clauses (this device only,
// never uploaded, where to manage it), and the Stored data panel's permanent statement of them —
// tests/browser/snapshotNotice.browser.test.ts (D-8; first watch, "Got it", reload, Wipe, the panel's clauses).

describe('capture disclosure — the Chromium content-script file:// surface (the D-14 trap)', () => {
  it('CAN watch there, yet the disclosure is ABSENT — the registry half of the gate does the work', async () => {
    // installContentWatch on a Chromium build (backgroundCanReadFileUrls: true) over a file:// URL
    // registers a REAL watch target — so watchAvailable() is true — but imports no diffRegistry
    // symbol, so isDiffContextRegistered() stays false.
    const bg = fakeBackground(DOC_A);
    installContentWatch({
      url: 'file:///tmp/watched.md',
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });

    const host = makeHost('peekover-root');
    mount(DOC_A, host);

    // Non-vacuity: this surface really CAN watch (the pill is present, watchAvailable is true) —
    // exactly the condition a watchAvailable()-only gate would wrongly disclose on.
    expect(watchAvailable()).toBe(true);
    expect(host.shadowRoot!.querySelector('.peekover-watch')).toBeTruthy();
    expect(isDiffContextRegistered()).toBe(false);

    // ...and the disclosure is absent, because the second gate half is false here.
    expect(host.shadowRoot!.querySelector(DISCLOSURE)).toBeNull();
  });
});

describe('capture disclosure — the Firefox / remote content-script surface (first-gate suppression)', () => {
  it('cannot watch at all, so the disclosure is ABSENT', async () => {
    // A Firefox file:// content script: the background cannot read file:// there, so
    // installContentWatch registers NO target — watchAvailable() is false.
    const bg = fakeBackground(DOC_A);
    installContentWatch({
      url: 'file:///tmp/watched.md',
      send: bg.send,
      backgroundCanReadFileUrls: false,
      intervalMs: 30,
    });

    const host = makeHost('peekover-root');
    mount(DOC_A, host);

    expect(watchAvailable()).toBe(false);
    expect(isDiffContextRegistered()).toBe(false);
    expect(host.shadowRoot!.querySelector(DISCLOSURE)).toBeNull();
  });
});
