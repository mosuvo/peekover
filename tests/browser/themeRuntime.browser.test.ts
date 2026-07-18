// Theme runtime — the REAL-ENGINE proof (tasks 3.2, 3.3). Two things here are jsdom-blind:
//
//   1. `prefers-color-scheme` itself. A PAGE cannot fake it — it is an OS/browser setting with
//      no in-page API. jsdom has no matchMedia at all (the unit suite stubs one), so "an OS
//      flip re-themes an already-open reader" — the spec §3.4 staleness property — is simply
//      not expressible there. Here it is driven as a GENUINE flip via the `emulateColorScheme`
//      browser command (Playwright `page.emulateMedia`, the same server-side seam 003 used for
//      reduced-motion), which is the one cross-engine way to reach it.
//
//   2. COMPUTED TOKENS. jsdom does not cascade or compute styles, so "the shell root and the
//      reader host resolve the SAME --paper/--ink" (3.3 coherence) and "an attribute selector
//      beats a media rule" can only be measured in a laid-out engine.
//
// HARNESS SANITY (the non-vacuous guard, mirroring the remote-media control-fetch and TOC
// control-scroll discipline): the first test proves the emulation is actually SEEN by the page
// — matchMedia flips AND a `change` event fires. If an engine ever stops delivering that, this
// suite goes red loudly rather than silently passing every "the OS flip was ignored" assertion
// for the wrong reason.
//
// WHAT THIS STILL DOES NOT PROVE: emulated `prefers-color-scheme` is the browser's own media
// state, not a real OS theme switch performed by the user in Windows/macOS settings. The
// binding from the actual OS to the browser's media state is the browser's job, not ours, but
// it is unexercised here — it stays part of the 8.1 human gate. What IS proven is everything
// downstream of that signal: our listener, the registry broadcast, the auto/manual gate, and
// the computed cascade.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateColorScheme(value: 'light' | 'dark' | null): Promise<void>;
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)';
const DOC = '# Heading\n\nSome body text.\n';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


/**
 * Apply an emulated OS color scheme and WAIT until the page actually observes it. The command
 * is executed server-side (Playwright), so the change reaches the page asynchronously — a
 * synchronous assertion right after the await races it and reads the stale value (observed
 * on both engines while building this suite). Polling on the page's OWN matchMedia is the
 * honest barrier: it returns only once the thing under test can see the new state.
 */
async function emulateOs(scheme: 'light' | 'dark'): Promise<void> {
  await commands.emulateColorScheme(scheme);
  const want = scheme === 'dark';
  for (let i = 0; i < 50; i += 1) {
    if (window.matchMedia(DARK_QUERY).matches === want) return;
    await sleep(20);
  }
  throw new Error(`emulated color scheme never reached the page: wanted ${scheme}`);
}

/**
 * Flip the emulated OS scheme and return only once the engine has DELIVERED a `change` event
 * to a control listener on the page. This is the barrier every assertion below waits on, and
 * it matters for two reasons:
 *
 *   - `matches` and the `change` event are not simultaneous. Chromium reports the new `matches`
 *     immediately but dispatches `change` on a later task (measured while building this suite:
 *     a fixed 50 ms wait made the Chromium runs flake red while Firefox passed). Polling
 *     `matches` alone is therefore NOT enough to know our listener has run.
 *   - it makes the NEGATIVE tests honest. "A manual theme ignores the OS flip" must not pass
 *     because the flip had not arrived yet. Waiting for a control listener to fire proves the
 *     engine delivered the very event our runtime listener also received — so if the host did
 *     not change, it is because the code chose not to, not because nothing happened.
 */
async function flipOsAndAwaitDelivery(scheme: 'light' | 'dark'): Promise<void> {
  const mq = window.matchMedia(DARK_QUERY);
  let delivered = false;
  const onChange = () => {
    delivered = true;
  };
  mq.addEventListener('change', onChange);
  try {
    await emulateOs(scheme);
    for (let i = 0; i < 100; i += 1) {
      if (delivered) return;
      await sleep(20);
    }
    throw new Error(`OS flip to ${scheme} never delivered a change event to the page`);
  } finally {
    mq.removeEventListener('change', onChange);
  }
}

/**
 * Wait until `host` carries the expected `data-theme`, or fail. The barrier for POSITIVE
 * assertions ("the flip re-themed it").
 *
 * Why polling rather than asserting straight after `flipOsAndAwaitDelivery`: the control
 * listener there lives on a DIFFERENT MediaQueryList object than the runtime's, and the order
 * in which an engine notifies separate MQL objects for the same query is not specified. In
 * Chromium the control was observed firing BEFORE the runtime's listener, so an immediate
 * assertion read the pre-flip value and failed intermittently (Firefox happened to notify in
 * the other order — a textbook engine-timing flake the unit env cannot show). Polling on the
 * OBSERVABLE OUTCOME removes the ordering assumption entirely. It cannot mask a broken
 * broadcast: a host that is never re-themed simply times out and fails.
 */
async function waitForTheme(host: HTMLElement, expected: string): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (host.getAttribute('data-theme') === expected) return;
    await sleep(20);
  }
  expect(host.getAttribute('data-theme')).toBe(expected); // timed out -> report reality
}

/** A CONTAINED reader host: a plain <div>, exactly what `readerPane.ts` mounts into on the app
 *  page. Deliberately NOT a <peekover-root> — the pre-004 listener re-themed by
 *  `querySelectorAll('peekover-root')`, so this host is precisely the one it could never find. */
function mountContainedReader(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  mount(DOC, host, { contained: true });
  return host;
}

/** A full-page reader host: the <peekover-root> custom element the content script mounts. */
function mountFullPageReader(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  mount(DOC, host);
  return host;
}

beforeEach(async () => {
  resetThemeHostsForTest();
  // Re-install the OS listener per test — see resetThemeWatchForTest's note: a MediaQueryList
  // created inside a test callback goes silent after the first emulated flip, so a listener
  // installed by an EARLIER test would not see this test's flip. Production installs once.
  resetThemeWatchForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await emulateOs('light');
});

afterEach(async () => {
  setThemeSetting('auto');
  resetThemeHostsForTest();
  document.body.replaceChildren();
  await commands.emulateColorScheme(null);
});

describe('theme runtime — harness sanity (non-vacuous guard)', () => {
  it('emulated OS flips are genuinely observed by the page (matches + change event)', async () => {
    const mq = window.matchMedia(DARK_QUERY);
    expect(mq.matches).toBe(false);

    const seen: boolean[] = [];
    mq.addEventListener('change', (e) => seen.push(e.matches));

    await flipOsAndAwaitDelivery('dark');
    expect(mq.matches).toBe(true);
    // A real `change` event — not merely a polled attribute read. Our listener depends on it.
    expect(seen).toEqual([true]);
  });
});

describe('theme runtime — OS flip re-themes registered hosts (spec §3.4)', () => {
  it('re-themes an already-open CONTAINED (app-page) reader under Auto', async () => {
    const host = mountContainedReader();
    expect(host.getAttribute('data-theme')).toBe('light');

    await flipOsAndAwaitDelivery('dark');

    // RED BEFORE THE REGISTRY SWAP: the M1 listener broadcast via
    // querySelectorAll('peekover-root'), which cannot match this <div> — the host stayed
    // 'light' forever. This assertion IS the stale-host bug.
    await waitForTheme(host, 'dark');
  });

  it('re-themes the full-page reader under Auto (no M1 regression)', async () => {
    const host = mountFullPageReader();
    expect(host.getAttribute('data-theme')).toBe('light');

    await flipOsAndAwaitDelivery('dark');

    await waitForTheme(host, 'dark');
  });

  it('re-themes TWO registered reader hosts from a single flip', async () => {
    const contained = mountContainedReader();
    const fullPage = mountFullPageReader();

    await flipOsAndAwaitDelivery('dark');

    // One listener, one broadcast, every registered surface — the property the registry buys.
    // (The app-shell ROOT joins this set in 3.3, which is where shell↔reader coherence is
    // asserted; the shell is not yet a registered host here.)
    await waitForTheme(contained, 'dark');
    await waitForTheme(fullPage, 'dark');
  });
});

describe('theme runtime — a MANUAL setting ignores the OS (spec §4)', () => {
  it('ignores an OS flip while a manual theme is set', async () => {
    const host = mountContainedReader();
    setThemeSetting('light'); // user pins light
    expect(host.getAttribute('data-theme')).toBe('light');

    await flipOsAndAwaitDelivery('dark'); // OS goes dark beneath it

    // Manual wins: the listener re-resolves ONLY under `auto`.
    expect(host.getAttribute('data-theme')).toBe('light');
    // ...and the OS really did flip — so this is not passing because nothing happened.
    expect(window.matchMedia(DARK_QUERY).matches).toBe(true);
  });

  it('resumes following the OS when the setting returns to auto', async () => {
    const host = mountContainedReader();
    setThemeSetting('light');
    await flipOsAndAwaitDelivery('dark');
    expect(host.getAttribute('data-theme')).toBe('light');

    setThemeSetting('auto'); // back to Auto — re-resolves immediately against the live OS

    expect(host.getAttribute('data-theme')).toBe('dark');
  });
});
