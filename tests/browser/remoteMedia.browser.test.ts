// The REAL-ENGINE remote-media no-leak guard (decisions.md 2026-07-14 correction-
// of-record). This is the ground-truth counterpart to the jsdom NO-LEAK / ORDERING
// tests in src/render/mount.test.ts: those inspect DOM SHAPE (jsdom loads no
// subresources, so "no fetchable node in the committed tree" is only a PROXY for
// "no request fired"). The class of bug they cannot see is bytes-on-wire — a fetch
// that fires from a node that is later neutralized. That is exactly what shipped:
// `root.innerHTML = html` on a `document.createElement('div')` dispatches remote
// <img> fetches at the innerHTML step (the div is owned by a browsing-context
// document), BEFORE applyMediaPolicy runs — and synchronous removal does not cancel
// the in-flight request. jsdom's DOM-shape checks stayed green through the whole leak.
//
// This suite runs the REAL mount() in headless Chromium AND Firefox and asserts on
// the browser's own Resource Timing buffer — an entry appears there only when the
// engine actually put the request on the wire. Probe-confirmed to catch the current
// leak in both engines before the fix (see the RED run recorded in progress.md).
//
// Zero-network discipline of the TEST itself: every probe URL is SAME-ORIGIN (built
// off location.origin) so any request that does fire hits the Vitest dev server (a
// 404) rather than the public internet — but the http(s) scheme still classifies as
// `remote`, so the policy blocks it by default exactly as it would a real CDN URL.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';

// A unique path token per document so one test's resource-timing entries can never
// be mistaken for another's (the buffer persists across tests on the shared page).
let seq = 0;
function freshDoc(): { token: string; urls: string[]; markdown: string } {
  seq += 1;
  const token = `peek-${seq}`;
  // Same-origin, absolute, http(s) → classifyMediaUrl() returns 'remote' → BLOCKED.
  const url = (n: number) =>
    new URL(`/__peekover_probe__/${token}/${n}.png`, location.origin).href;
  const urls = [url(1), url(2), url(3)];
  const markdown = [
    `![one](${urls[0]})`,
    '',
    `![two](${urls[1]})`,
    '',
    `inline ![three](${urls[2]}) here`,
  ].join('\n');
  return { token, urls, markdown };
}

/** Resource-timing entry names (full URLs) the engine actually fetched for `token`. */
function fetchedUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_probe__/${token}/`));
}

// A macrotask + rAF + settle: long enough that a fetch fired at innerHTML/insertion
// time has reached the Resource Timing buffer (the same-origin 404 resolves fast).
// If a request fired, it is recorded within this window; if none did, the buffer
// stays empty no matter how long we wait — so this is a sound "zero requests" proof.
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => setTimeout(resolve, 60));
    }, 120);
  });
}

describe('remote media — real-engine no-leak (bytes on the wire)', () => {
  let host: HTMLElement;

  beforeEach(() => {
    // Start each test from a clean buffer so counts are unambiguous.
    performance.clearResourceTimings();
    host = document.createElement('peekover-root');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('fires ZERO image requests before opt-in (the exact leak that shipped)', async () => {
    const { token, markdown } = freshDoc();

    mount(markdown, host);
    await flush();

    // GROUND TRUTH: the engine put nothing on the wire for these images.
    expect(fetchedUrls(token)).toEqual([]);

    // And the committed tree is in the blocked state: no live <img>, three inert
    // placeholders, the opt-in pill, and the network indicator still dark.
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelectorAll('.peekover-remote').length).toBe(3);
    expect(shadow.querySelector('.peekover-remote-load')?.textContent).toBe(
      '3 remote images blocked · Load',
    );
    expect(host.hasAttribute('data-network')).toBe(false);
  });

  it('DOES fire the requests after opt-in (we did not over-correct into blocking Load)', async () => {
    const { token, urls, markdown } = freshDoc();

    mount(markdown, host);
    await flush();
    // Pre-condition: still zero on the wire before the click.
    expect(fetchedUrls(token)).toEqual([]);

    const shadow = host.shadowRoot!;
    const loadBar = shadow.querySelector<HTMLButtonElement>('.peekover-remote-load')!;
    loadBar.click();
    await flush();

    // The three real <img>s were inserted and the engine fetched all three URLs —
    // opt-in genuinely reaches the network (the other half of "correct").
    const fetched = fetchedUrls(token);
    for (const u of urls) expect(fetched).toContain(u);

    const imgs = [...shadow.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(imgs).toEqual(urls);
    // Indicator lit, one-shot pill and placeholders gone.
    expect(host.getAttribute('data-network')).toBe('active');
    expect(shadow.querySelector('.peekover-remote')).toBeNull();
    expect(shadow.querySelector('.peekover-remote-load')).toBeNull();
  });
});
