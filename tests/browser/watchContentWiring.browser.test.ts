// Task 4.8 — the CONTENT SCRIPT's registered watch target actually RE-RENDERS.
//
// ── THE DEFECT, AND WHY EVERY GREEN TEST IN THIS MILESTONE MISSED IT ────────────────────────
//
// `entrypoints/peekover.content.ts` registered a target built by `watchRelay.registerWatchDetector`,
// whose `start()` called `detector.start(() => {})` — an EMPTY callback. So on a `file://` page the
// full relay ran (the human measured 88 background `fetch` calls over ~90 s, each returning 200 and
// 28623 bytes) and the reader never updated. Task 4.1 wrote that adapter deliberately, as a
// placeholder 4.2 would replace; 4.2 replaced it in `appShell.ts` and nowhere else.
//
// **Nothing in the repo could see it, and the reason is structural.** Every watch suite —
// `watchLifecycle`, `watchRemount`, `watchAnchor`, `watchControl`, `watchObserverWiring` — calls
// `registerWatchTarget(createWatchController({…}))` ITSELF before mounting. That is a perfectly
// good way to test the controller, the pill and the registry, and it is exactly why they all
// passed: they never ask WHICH target production registers. This is the third instance of that one
// class in 005 (`observerDetector` wired to nothing → 4.7; the pill missing on the first file
// opened → 4.7; and this), so the assertion below is deliberately the one no other file makes:
//
//     drive the PRODUCTION registration function, then prove a detector callback carrying new
//     text re-renders the content-script host.
//
// ── WHAT THIS PROVES, AND — PLAINLY — WHAT IT DOES NOT ─────────────────────────────────────
//
// The harness loads NO extension, so it cannot run a content script, cannot serve a `file://`
// document, and has no `browser.runtime`. The honest maximum is to drive everything the entrypoint
// now delegates — `installContentWatch`, which owns the capability decision, `relayRead`,
// `pollingDetector`, the real `createWatchController`, and the real registry — with the three
// WXT/engine-bound values injected: the URL (a `file:///…md` string), the messenger (a fake
// standing in for `browser.runtime.sendMessage`, answering the real `WATCH_READ` wire shape), and
// the build-time Firefox constant.
//
// What remains outside it is exactly three lines of `peekover.content.ts` and the browser's own
// injection. Two of them are pinned as SOURCE TEXT in `src/watch/contentWatch.test.ts` (the
// entrypoint calls this function, and no production `registerWatchTarget` call site hand-builds a
// target), because reading a WXT entrypoint as text is the only way any test can reach it. The
// genuine end-to-end — an extension loaded, a real `file://` document, a real agent rewriting it —
// is 7.1's, and is where this defect was found in the first place.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { installContentWatch } from '../../src/watch/contentWatch';
import { DEAD_AFTER_FAILURES, DEAD_READ_NOTE, createWatchController } from '../../src/watch/watchController';
import {
  isWatching,
  registerWatchTarget,
  resetWatchRegistryForTest,
  watchAvailable,
  watchNote,
} from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import {
  FIREFOX_CONTENT_SCRIPT_NOTE,
  REMOTE_DOCUMENT_NOTE,
} from '../../src/watch/watchAvailability';
import { WATCH_READ, WATCH_INTERVAL_MS, type WatchMessage } from '../../src/watch/watchRelay';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setReaderMode } from '../../src/render/readerMode';
import type { ChangeDetector } from '../../src/watch/changeDetector';

const FILE_URL = 'file:///D:/notes/watched.md';
const REMOTE_URL = 'https://raw.githubusercontent.com/o/r/main/README.md';

const V1 = '# Watched\n\nThe first version, already on screen.\n';
const V2 = '# Watched\n\nthe agent rewrote this on disk.\n';

/**
 * A stand-in for `browser.runtime.sendMessage` + the background's `createWatchListener`.
 *
 * It answers the REAL wire shape (`{ok:true,text}` / `{ok:false,error}`), so `relayRead`'s own
 * parsing, rejection and error-message handling are production code under test — only the
 * transport is fake, exactly as `settingsPort`'s suites fake theirs.
 */
function fakeBackground(initial: string): {
  send: (message: WatchMessage) => Promise<unknown>;
  write: (text: string) => void;
  fail: (reason: string) => void;
  calls: () => number;
  lastUrl: () => string | null;
} {
  let text = initial;
  let error: string | null = null;
  let calls = 0;
  let lastUrl: string | null = null;
  return {
    send: async (message) => {
      calls += 1;
      expect(message.type).toBe(WATCH_READ);
      lastUrl = message.url;
      if (error !== null) return { ok: false, error };
      return { ok: true, text };
    },
    write: (next) => {
      error = null;
      text = next;
    },
    fail: (reason) => {
      error = reason;
    },
    calls: () => calls,
    lastUrl: () => lastUrl,
  };
}

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
const pillIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLButtonElement>('.peekover-watch');
const noteIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-watch-note');
const columnText = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-reader')?.textContent ?? '';

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const hosts: HTMLElement[] = [];

/**
 * The content script's own order, and it is load-bearing: `installContentWatch` runs at
 * `document_start`, LONG BEFORE any host exists, and `runReader()` mounts afterwards. Registering
 * after the first mount would leave that render with no pill at all — `buildWatchControl` decides
 * at mount time (the second defect 4.7 found on the app page). So the target is registered against
 * NO host, and the host reaches it later, through the pill's click.
 */
function mountAfterInstall(source = V1): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  hosts.push(host);
  mount(source, host); // `contained` omitted — the full-page content-script surface
  return host;
}

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

// ════ THE ASSERTION THE 7.1 GATE MADE BY HAND ════════════════════════════════════════════════

describe('4.8 — the content script registers a target that RE-RENDERS (both engines)', () => {
  it('a change on disk reaches the reader, through the production registration path', async () => {
    // THE RED-FIRST ASSERTION. Against the shipped `registerWatchDetector` placeholder
    // (`detector.start(() => {})`) every line up to and including the poll passes — the relay is
    // called, the text differs, the detector fires — and this last wait times out, because the
    // callback goes nowhere. That is the shipped bug, stated as a test.
    const bg = fakeBackground(V1);
    installContentWatch({
      url: FILE_URL,
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });

    const host = mountAfterInstall();
    expect(columnText(host)).toContain('The first version');

    // The user gesture — the real pill, which passes ITS host to the target it looks up at click
    // time. This is the only route by which a host ever reaches the controller on this surface.
    const pill = pillIn(host)!;
    expect(pill).toBeTruthy();
    pill.click();
    expect(isWatching()).toBe(true);
    expect(host.getAttribute('data-watch')).toBe('active');

    // `pollingDetector`'s first read is a silent BASELINE, so the write must land after it or it
    // is absorbed and nothing ever fires (its documented semantics).
    await waitFor(() => bg.calls() > 0);
    bg.write(V2);

    await waitFor(() => columnText(host).includes('the agent rewrote this on disk'));

    // ...and the relay was asked for the RIGHT document, through the real `WATCH_READ` message.
    expect(bg.lastUrl()).toBe(FILE_URL);
    expect(isWatching()).toBe(true);
  });

  it('keeps re-rendering across updates — the pill the render destroys is not the seam', async () => {
    // The re-render replaces the control that was clicked (`mount()` commits with
    // `replaceChildren`). A second update proves the loop survives its own first success, which is
    // the property `watchRegistry` exists for — asserted here on the surface that never had it.
    const bg = fakeBackground(V1);
    installContentWatch({
      url: FILE_URL,
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });
    const host = mountAfterInstall();
    const firstPill = pillIn(host)!;
    firstPill.click();

    await waitFor(() => bg.calls() > 0);
    bg.write(V2);
    await waitFor(() => columnText(host).includes('the agent rewrote this on disk'));

    // The clicked control is gone, replaced by the render it caused.
    expect(firstPill.isConnected).toBe(false);
    // ...and the new one shows the CURRENT state rather than "off".
    expect(pillIn(host)!.getAttribute('aria-pressed')).toBe('true');
    expect(host.getAttribute('data-watch')).toBe('active');

    bg.write('# Watched\n\nand rewrote it a second time.\n');
    await waitFor(() => columnText(host).includes('and rewrote it a second time'));
  });

  it('preserveReading applies here too — Raw survives an update, carrying the new text', async () => {
    // 3.3's property, on the surface it was never exercised on. Without it, every agent keystroke
    // would throw a reader who chose Raw back into Reading.
    const bg = fakeBackground(V1);
    installContentWatch({
      url: FILE_URL,
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });
    const host = mountAfterInstall();
    pillIn(host)!.click();

    setReaderMode(host, 'raw');
    expect(host.getAttribute('data-mode')).toBe('raw');

    await waitFor(() => bg.calls() > 0);
    bg.write(V2);
    await waitFor(() =>
      (shadowOf(host).querySelector<HTMLElement>('.peekover-raw')?.textContent ?? '').includes(
        'the agent rewrote this on disk',
      ),
    );
    expect(host.getAttribute('data-mode')).toBe('raw');
  });

  it('runs at the SHIPPED poll interval when none is injected — the default is wired, not assumed', async () => {
    // The three tests above inject a short interval so they do not spend seconds waiting. This one
    // takes the production default, so the constant the entrypoint relies on is genuinely on the
    // path. Two intervals: the baseline read, then the read that sees the change.
    const bg = fakeBackground(V1);
    installContentWatch({ url: FILE_URL, send: bg.send, backgroundCanReadFileUrls: true });
    const host = mountAfterInstall();
    pillIn(host)!.click();

    await waitFor(() => bg.calls() > 0, Math.ceil((WATCH_INTERVAL_MS * 2) / 20));
    bg.write(V2);
    await waitFor(
      () => columnText(host).includes('the agent rewrote this on disk'),
      Math.ceil((WATCH_INTERVAL_MS * 3) / 20),
    );
  });
});

// ════ THE DEAD-READ POLICY, WHICH THIS SURFACE PREVIOUSLY COULD NOT REACH ════════════════════

describe('4.8 — a dead read on the content-script surface surfaces the designed state', () => {
  it('explains after DEAD_AFTER_FAILURES consecutive failures, without blanking the reader', async () => {
    // The placeholder passed NO `onError` (`detector.start(cb)` with one argument), and
    // `DEAD_AFTER_FAILURES` is owned by the controller — so a file deleted while watched on this
    // surface failed SILENTLY and forever. Wiring the real controller fixes it, and this is the
    // assertion that says so rather than assuming it.
    const bg = fakeBackground(V1);
    installContentWatch({
      url: FILE_URL,
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 20,
    });
    const host = mountAfterInstall();
    pillIn(host)!.click();

    await waitFor(() => bg.calls() > 0);
    bg.fail('refused: not a watchable file:// markdown URL');

    await waitFor(() => watchNote() !== null);
    expect(watchNote()).toBe(DEAD_READ_NOTE);
    expect(isWatching()).toBe(false);

    // Never blank, never silent (AGENTS.md #5): the last good render is untouched, the note is
    // visible beside it, and the toggle stays because retrying is the user's call.
    expect(columnText(host)).toContain('The first version');
    expect(noteIn(host)!.hidden).toBe(false);
    expect(noteIn(host)!.textContent).toBe(DEAD_READ_NOTE);
    expect(pillIn(host)).toBeTruthy();
    expect(pillIn(host)!.getAttribute('aria-pressed')).toBe('false');
  });

  it('a SINGLE failed read does not kill the watch — a file mid-rewrite is transient', async () => {
    // The non-vacuity control for the test above: if any failure stopped the watch, that test
    // would pass while proving only that the note mechanism works. `DEAD_AFTER_FAILURES` is > 1
    // precisely for the agent-writes-continuously workload this feature exists for.
    const bg = fakeBackground(V1);
    installContentWatch({
      url: FILE_URL,
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 20,
    });
    const host = mountAfterInstall();
    pillIn(host)!.click();

    await waitFor(() => bg.calls() > 0);
    bg.fail('briefly unreadable');
    const at = bg.calls();
    await waitFor(() => bg.calls() > at); // exactly one failed read observed
    bg.write(V2); // ...and the file comes back before the streak completes

    await waitFor(() => columnText(host).includes('the agent rewrote this on disk'));
    expect(isWatching()).toBe(true);
    expect(watchNote()).toBeNull();
    expect(DEAD_AFTER_FAILURES).toBeGreaterThan(1);
  });
});

// ════ THE SURFACES THAT MUST REGISTER NOTHING (4.4 / 4.6-rescope, now through this path) ═════

describe('4.8 — the un-watchable content-script surfaces register NO target at all', () => {
  it('Firefox: the designed explanation, no toggle, and nothing polling', async () => {
    const bg = fakeBackground(V1);
    installContentWatch({ url: FILE_URL, send: bg.send, backgroundCanReadFileUrls: false });
    const host = mountAfterInstall();

    expect(watchAvailable()).toBe(false);
    expect(pillIn(host)).toBeNull();
    expect(noteIn(host)!.textContent).toBe(FIREFOX_CONTENT_SCRIPT_NOTE);
    // AGENTS.md #5: only WATCH degrades. The document renders normally.
    expect(columnText(host)).toContain('The first version');
    // No detector was ever built, so the relay is never asked — not once, not per second.
    await new Promise<void>((r) => setTimeout(r, 80));
    expect(bg.calls()).toBe(0);
  });

  it('a remote raw view: the scope note, no toggle, and no refused relay traffic', async () => {
    const bg = fakeBackground(V1);
    installContentWatch({ url: REMOTE_URL, send: bg.send, backgroundCanReadFileUrls: true });
    const host = mountAfterInstall();

    expect(watchAvailable()).toBe(false);
    expect(pillIn(host)).toBeNull();
    expect(noteIn(host)!.textContent).toBe(REMOTE_DOCUMENT_NOTE);
    await new Promise<void>((r) => setTimeout(r, 80));
    expect(bg.calls()).toBe(0);
  });
});

// ════ THE APP PAGE IS UNAFFECTED ═════════════════════════════════════════════════════════════

describe('4.8 — the app page keeps the registry semantics it already had', () => {
  it('a later app-page registration REPLACES the content one, and the pill drives the new target', () => {
    // The two surfaces share ONE slot, last-registration-wins (`watchRegistry.ts`) — which is what
    // let 4.2 replace 4.1's placeholder on the app page in the first place. 4.8 changes WHICH
    // target the content script puts in that slot; it must not change the slot's rules, and this
    // is the cheap in-file statement of that. The app page's own path is proven, unmodified, by
    // `watchObserverWiring.browser.test.ts` and `watchLifecycle.browser.test.ts`.
    const bg = fakeBackground(V1);
    installContentWatch({ url: FILE_URL, send: bg.send, backgroundCanReadFileUrls: true });
    expect(watchAvailable()).toBe(true);

    let appStarts = 0;
    const appDetector: ChangeDetector = {
      start() {
        appStarts += 1;
      },
      stop() {},
    };
    registerWatchTarget(createWatchController({ detector: appDetector, contained: true, docId: null }));

    const host = mountAfterInstall();
    pillIn(host)!.click();

    expect(appStarts).toBe(1); // the app page's detector, not the content script's
    expect(bg.calls()).toBe(0); // ...and the relay was never polled
    expect(isWatching()).toBe(true);
  });
});
