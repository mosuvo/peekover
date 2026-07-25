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
//   • APP PAGE — can watch, diff context registered → the disclosure IS present.
//   • CHROMIUM CONTENT-SCRIPT file:// — CAN watch (a real target is registered), but no diff
//     context → the disclosure MUST be absent. This is the exact surface a `watchAvailable()`-only
//     gate ships it to (the D-14 trap); the red-first mutation below reddens HERE and only here.
//   • FIREFOX / remote content-script — cannot watch at all → absent, the first-gate suppression.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
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

/** A store that captures nothing — the grant flow's IndexedDB writes are irrelevant here. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** An in-memory, PERSISTABLE folder source — `persistable:true` is what makes the app-page surface
 *  WATCHABLE, so `installWatchForFile` reaches its `registerWatchTarget` / `registerDiffContext`
 *  site rather than early-returning on the "cannot watch" branch. */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: name, name, read: async () => text }],
  };
}

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

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
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

describe('capture disclosure — the app page PRODUCTION path renders it (task 3.1, D-3)', () => {
  it('mountAppShell → open folder → select file makes the disclosure appear in the reader chrome', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const source = memorySource('doc.md', DOC_A);
    const app = mountAppShell(container, {
      openFolder: async () => ({ ok: true, source }),
      store: fakeStore(),
    });

    await app.openFolder();

    // NON-VACUOUS: before a file is selected nothing is registered and there is no reader chrome, so
    // the disclosure is genuinely absent — the presence assertion below is a real change of state.
    expect(isDiffContextRegistered()).toBe(false);
    expect(container.querySelector<HTMLElement>('.peekover-app__reader__host')).toBeNull();

    // The real user gesture — click the file in the tree. This drives `selectFolderFile`, whose
    // synchronous head runs `installWatchForFile` (which registers BOTH the watch target and the
    // diff context), and then mounts the reader — so the disclosure paints on the first render.
    const fileBtn = container.querySelector<HTMLButtonElement>(
      '[role="treeitem"][data-kind="file"]',
    );
    expect(fileBtn?.textContent).toBe('doc.md');
    fileBtn!.click();

    const host = await waitFor(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    const disclosure = await waitFor(() =>
      host.shadowRoot?.querySelector<HTMLElement>(DISCLOSURE),
    );

    // Present, un-hidden, and announced as a polite status region.
    expect(disclosure.hidden).toBe(false);
    expect(getComputedStyle(disclosure).display).not.toBe('none');
    expect(disclosure.getAttribute('role')).toBe('status');

    // The copy tells the §3.6 truth: on THIS DEVICE ONLY, NEVER uploaded, and WHERE to manage it.
    const text = disclosure.textContent ?? '';
    expect(text).toContain('this device only');
    expect(text).toContain('never uploaded');
    expect(text).toContain('Stored data');

    // PERSISTENCE (D-12's safety rests on it): it survives a re-render. Re-mounting the same reader
    // host runs `buildWatchChrome` again with both gates still true — the disclosure is rebuilt, not
    // consumed. A one-shot disclosure would be gone here.
    mount(DOC_A, host, { contained: true, preserveReading: true });
    const afterRemount = host.shadowRoot!.querySelector<HTMLElement>(DISCLOSURE);
    expect(afterRemount).toBeTruthy();
    expect(afterRemount!.hidden).toBe(false);
  });
});

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
