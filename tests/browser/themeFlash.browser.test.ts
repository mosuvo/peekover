// Theme + first paint — the REAL-ENGINE integration for task 4.2 (D-2 as MEASURED).
//
// WHAT 4.2 ACTUALLY SHIPS, and therefore what is provable here. D-2 chose block-until-read
// behind a short paint gate, conditional on 4.2 re-measuring it. The re-measure killed the
// gate (it cost ~25-35 ms on cold start and pushed the 50 KB cold cell to ~173 ms against a
// <150 ms budget — numbers in progress.md, task 4.2), so the shipped mitigation is D-2's own
// recorded fallback: the reader mounts under Auto and the persisted theme re-themes it
// INSTANTLY through the theme registry whenever it lands. Two properties follow, and they are
// what this file proves on BOTH engines:
//
//   1. The late-arriving setting re-themes an ALREADY-MOUNTED reader, synchronously, with no
//      re-mount and no transition. This is the whole fallback mechanism. It is the test with a
//      real red-first: break the registry broadcast and it fails.
//   2. An unreachable settings path cannot withhold, delay, or blank the reader. In the shipped
//      shape this is STRUCTURAL — runReader never learns about the settings promise, so there
//      is no await to hang on — and the test below pins that structure so a future change that
//      re-introduces a dependency (a gate, an await, a "wait for theme" flag) breaks loudly.
//      Stated plainly rather than dressed up: this one cannot be made to fail by mutating the
//      current source, because the current source contains no coupling to mutate. It is a
//      REGRESSION PIN, not a proof of a mechanism.
//
// THE HARNESS LOADS NO EXTENSION (the standing group-2 limitation, restated so nobody reads
// more into this file than it proves). Vitest's browser project runs pages in a plain browser
// context: no unpacked extension, no background service worker, therefore no content-script
// context and no `browser.runtime` with a receiving end. So the production wiring is NOT
// exercised end to end here; what is exercised is the same `runReader` + theme-registry
// modules the content script runs, driven by a real engine with real timers and a real rAF.
//
// WHAT REMAINS HUMAN-GATE-ONLY (8.1). "Persisted dark -> open a .md file -> dark is the FIRST
// painted state, with no visible flip" needs a loaded extension, and Playwright cannot load one
// into Firefox at all (playwright#7297, CLOSED as out-of-scope). Chromium's half is asserted by
// `pnpm perf:flash`, which reads the theme actually present at first paint. Firefox's half —
// and, on both engines, whether a human EYE sees a flip on a cold start (the 4.2 numbers make
// cold a ~10 ms photo finish, not a guarantee) — is 8.1. No engine here can see a flash.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runReader, removeHideStyle, HIDE_STYLE_ID, SAFETY_UNHIDE_MS } from '../../src/render/runReader';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';

const DOC = '# Heading\n\nSome body text.\n';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Poll until `predicate` holds or `budget` ms elapse. Returns whether it held. Used instead of
 *  a fixed sleep so a fast engine is not waited on and a slow one is not flaked out. */
async function waitFor(predicate: () => boolean, budget: number): Promise<boolean> {
  const deadline = performance.now() + budget;
  while (performance.now() < deadline) {
    if (predicate()) return true;
    await sleep(10);
  }
  return predicate();
}

/** Seed the page the way a browser renders a raw .md file: text inside a <pre>. */
function seedRawPage(markdown: string): HTMLElement {
  const pre = document.createElement('pre');
  pre.textContent = markdown;
  document.body.appendChild(pre);
  return pre;
}

function readerHost(): HTMLElement | null {
  return document.querySelector('peekover-root');
}

describe('theme + first paint — the 4.2 instant re-theme, and never-blank (real engine)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    removeHideStyle();
    resetThemeHostsForTest();
    resetThemeWatchForTest();
    setThemeSetting('auto'); // production's pre-load default
  });

  afterEach(() => {
    // The hide rule is `body > :not(peekover-root){display:none}` — leaving it installed would
    // hide the NEXT test's fixtures (and the runner's own DOM). Always tear it down.
    removeHideStyle();
    document.querySelectorAll('peekover-root').forEach((el) => el.remove());
    document.body.innerHTML = '';
    resetThemeHostsForTest();
    setThemeSetting('auto');
  });

  it('a late-arriving persisted theme re-themes the ALREADY-MOUNTED reader instantly', async () => {
    // THE SHIPPED FALLBACK, end to end and with no new code in the render path: the reader is
    // already up under Auto when the settings land, exactly as on a cold start. mount() must
    // have REGISTERED its host with the theme registry, and setThemeSetting's broadcast must
    // reach it — synchronously, in the same turn, with no transition and no re-mount.
    seedRawPage(DOC);

    runReader({ isRenderable: () => true });

    const mounted = await waitFor(() => readerHost() !== null, 2000);
    expect(mounted).toBe(true);

    // Pick the theme the reader is NOT currently showing, so this cannot pass by accident on a
    // machine whose OS preference happens to match the value we set.
    const before = readerHost()!.getAttribute('data-theme');
    expect(['light', 'dark']).toContain(before); // themed Auto, never unthemed
    const late = before === 'dark' ? 'light' : 'dark';

    setThemeSetting(late); // what the entrypoint's load().then() does when settings arrive

    // Synchronous: the assertion runs in the same turn as the broadcast. An implementation that
    // deferred, animated or re-mounted would fail here.
    expect(readerHost()!.getAttribute('data-theme')).toBe(late);
    expect(readerHost()!.getAttribute('data-theme')).not.toBe(before);
    expect(readerHost()!.getAttribute('data-mode')).toBe('reading');
    expect(document.querySelectorAll('peekover-root').length).toBe(1); // nothing re-mounted
  });

  it('the reader mounts and reveals WITHOUT the settings ever arriving (never-blank, structural)', async () => {
    // The dead-background case. A hung settings path is modelled the only honest way available
    // here — by simply never calling setThemeSetting — and the reader must reach a complete,
    // themed, revealed state regardless. This pins the structure: nothing in the render path
    // may come to depend on the settings promise.
    seedRawPage(DOC);
    const hangingSettings = new Promise<void>(() => {}); // never settles, and nothing awaits it
    void hangingSettings;

    runReader({ isRenderable: () => true });

    const mounted = await waitFor(() => readerHost() !== null, 2000);

    expect(mounted).toBe(true);
    expect(readerHost()!.getAttribute('data-mode')).toBe('reading');
    expect(readerHost()!.shadowRoot?.querySelector('.peekover-reader')).not.toBeNull();
    expect(['light', 'dark']).toContain(readerHost()!.getAttribute('data-theme')); // themed Auto
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // revealed on commit
  });

  it('the 3 s safety floor still reveals the raw text when nothing can mount and no settings arrive', async () => {
    // The worst case the design admits: source unreadable forever AND settings never arriving.
    // It must still end with the user reading the raw text rather than staring at a page we hid.
    const pre = seedRawPage(DOC);

    runReader({
      isRenderable: () => true,
      mount: () => false, // no committable source, ever
    });

    const revealed = await waitFor(
      () => document.getElementById(HIDE_STYLE_ID) === null,
      SAFETY_UNHIDE_MS + 1500,
    );

    expect(revealed).toBe(true);
    expect(document.body.contains(pre)).toBe(true); // the raw source is back on screen
    expect(pre.style.display).not.toBe('none');
  });
});
