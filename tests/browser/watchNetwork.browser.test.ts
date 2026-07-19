// Task 2.2 — the watch loop's REAL-ENGINE zero-network guard (Chromium + Firefox).
//
// ── WHAT THIS TEST CANNOT DO, STATED FIRST SO NOTHING HERE IS OVER-READ ──────────────────────
//
// `tests/browser` LOADS NO EXTENSION. There is no background context, so `runtime.sendMessage`
// has no receiving end and **the real content→background round trip is not exercised by this file,
// or by any automated test in this repo, on any milestone.** That round trip is task 7.1's NAMED
// human-gate item ("watch a file:// doc through the content script and confirm it updates"), and a
// green run here must never be read as covering it.
//
// The harness cannot answer the spec §7-4 question either (does a `file://` fetch appear in the
// Resource-Timing buffer at all?). This page runs on an `http://localhost` origin and cannot fetch
// `file://` from it under any circumstances; only the background can, and there is no background.
// **§7-4 therefore moves to task 2.3**, where a real background console is already open for the
// Firefox question. Answering it from here would mean reporting a non-answer as an answer.
//
// ── WHAT IT DOES PROVE, and why each half is worth having ────────────────────────────────────
//
// 1. **The watch loop puts ZERO http(s) on the wire** across start → several ticks → stop, driven
//    through the PRODUCTION seam (`pollingDetector`, the real one, with an injected `read`) rather
//    than a re-implementation. This is spec §3.6-A: re-reading a local file the user themselves
//    opened is not a network call and must not light the indicator.
//
// 2. **`relayRead` never falls back to fetching its own URL.** This is the half with a genuine bug
//    behind it: a content script that quietly `fetch`ed `location.href` when the relay was
//    unavailable would put bytes on the wire from the one context with no network indicator, and on
//    an `http(s)` raw view it would SUCCEED — so the defect would hide behind a working feature.
//    Here the relay's transport is a fake that never answers, which is exactly the unavailable-
//    background case, and the assertion is that nothing was fetched anyway.
//
// The predicate is `/^https?:/i`, REUSED VERBATIM from the seven existing guard files
// (tocNetwork, settingsPort, wipe, folderMode.network, firefoxFallback, handlePersist,
// remoteMedia). It is http(s)-scoped on purpose: a `file://` read is not a network request, and a
// guard that counted it would be asserting the opposite of the spec.
//
// NON-VACUOUS: a live control `fetch` must register in the same buffer through the same window,
// using the AWAITED mechanism from `remoteMedia.browser.test.ts` — that suite's control was a
// sample-at-an-instant and flaked 1-in-10 on Firefox (progress.md watch item; retro 2026-07-19,
// finding 1). A new zero-network guard does not get to inherit a known-flaky instrument.
//
// Every probe URL is SAME-ORIGIN (built off location.origin), so a request that does fire hits the
// Vitest dev server as a 404 and never leaves the machine — but http(s) still classifies as an
// on-wire entry exactly as a CDN URL would.

import { describe, it, expect, beforeEach } from 'vitest';
import { pollingDetector } from '../../src/watch/changeDetector';
import { WATCH_READ, relayRead, type WatchMessage } from '../../src/watch/watchRelay';

let seq = 0;
const nextTok = () => `watch-${(seq += 1)}`;

/** The http(s) resource-timing entry names currently in the buffer. VERBATIM from the seven
 *  existing guard files — same buffer, same predicate, same meaning of "on the wire". */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** A macrotask + rAF + settle — the same window every other guard file uses. Sound for a ZERO
 *  assertion in the way a wait never can be: if no request fired, no wait length changes that. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/** THE CONTROL, awaited rather than sampled (see the header). Polls the same buffer the assertion
 *  reads until the probe appears or the budget expires, then asserts — so a real failure ("the
 *  observer is blind") still fails on `toContain` with the real diff, while a slow-but-genuine
 *  recording cannot produce a false red. */
const CONTROL_BUDGET_MS = 5000;
async function controlFetchRegisters(): Promise<void> {
  const probe = new URL(`/__peekover_watch_probe__/${nextTok()}.txt`, location.origin).href;
  await fetch(probe).catch(() => undefined);

  const deadline = performance.now() + CONTROL_BUDGET_MS;
  while (!networkedUrls().includes(probe) && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  expect(networkedUrls(), 'control fetch must register — else the observer is blind').toContain(
    probe,
  );
}

describe('watch loop — real-engine zero-network (bytes on the wire)', () => {
  beforeEach(() => {
    performance.clearResourceTimings();
  });

  it('start → several ticks → stop fires ZERO http(s), and a control fetch DOES register', async () => {
    // The production seam, with the read injected exactly as the content script injects it. The
    // fake stands in for the relay's ANSWER, not for the loop: the loop under test is the real one.
    let reads = 0;
    const detector = pollingDetector(async () => {
      reads += 1;
      return `# doc\n\nrevision ${reads}`; // changing text, so the callback path runs too
    }, 20);

    const seen: string[] = [];
    detector.start((text) => seen.push(text));
    // Long enough for several ticks at a 20 ms interval.
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    detector.stop();
    await flush();

    // The loop genuinely ran — otherwise the zero-assert below would be vacuous for the most
    // boring possible reason (nothing happened at all).
    expect(reads, 'the watch loop never ticked — the zero-network assert would be vacuous').toBeGreaterThan(2);
    expect(seen.length, 'the change callback never fired').toBeGreaterThan(0);

    // GROUND TRUTH: not one http(s) request across start → ticks → stop.
    expect(networkedUrls()).toEqual([]);

    // NON-VACUOUS: the same buffer, the same window, does see a real request.
    await controlFetchRegisters();
  });

  it('relayRead NEVER fetches its own URL — not even when the relay does not answer', async () => {
    // An `http(s)` document URL is the dangerous case, and it is deliberately the one used here: a
    // silent `fetch(location.href)` fallback would SUCCEED on this origin, so a shape-only test
    // would not notice. `href` is same-origin, so even the bug would stay on this machine.
    const docUrl = new URL(`/__peekover_watch_doc__/${nextTok()}.md`, location.origin).href;

    // A transport that never answers — exactly the "no receiving end" case a content script hits
    // when the background is asleep, evicted, or (as here) absent entirely.
    const read = relayRead(docUrl, async () => undefined);

    // Settle WITHOUT asserting yet. The network assertion below must be the one that catches a
    // direct-fetch fallback — if an `await expect(...).rejects` ran first it would short-circuit,
    // and the zero-network guard would never be the thing under test (verified: with a fallback
    // injected, this ordering fails on `networkedUrls()`, not on the rejection).
    const outcome = await read().then(
      () => 'resolved',
      () => 'rejected',
    );
    await flush();

    // GROUND TRUTH: it asked the background and gave up. It did not go to the wire itself.
    expect(networkedUrls(), 'relayRead fetched its own URL as a fallback').toEqual([]);
    expect(outcome, 'relayRead must reject, never resolve with substitute content').toBe('rejected');

    await controlFetchRegisters();
  });

  it('a full watch loop over relayRead stays silent when every read fails', async () => {
    // The composed production path: the real detector polling the real relay client, with only the
    // transport faked. A failing read is transient by construction (pollingDetector swallows it and
    // keeps polling), so this is the shape that would repeat a leaky fallback dozens of times.
    const docUrl = new URL(`/__peekover_watch_doc__/${nextTok()}.md`, location.origin).href;
    let attempts = 0;
    const detector = pollingDetector(
      relayRead(docUrl, async () => {
        attempts += 1;
        return { ok: false, error: 'no receiving end' };
      }),
      20,
    );

    detector.start(() => {
      throw new Error('a failing read must never deliver text');
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    detector.stop();
    await flush();

    expect(attempts, 'the relay was never called — vacuous').toBeGreaterThan(2);
    expect(networkedUrls()).toEqual([]);

    await controlFetchRegisters();
  });

  it('the WATCH_READ message is what actually goes over the transport', async () => {
    // Pins the wire shape from the CLIENT side, so a renamed type or a dropped url would be caught
    // here rather than only at the human gate, where it is far more expensive to see.
    const docUrl = 'file:///C:/Users/dev/notes.md';
    const sent: WatchMessage[] = [];
    const read = relayRead(docUrl, async (message) => {
      sent.push(message);
      return { ok: true, text: '# fresh' };
    });

    await expect(read()).resolves.toBe('# fresh');
    expect(sent).toEqual([{ type: WATCH_READ, url: docUrl }]);
  });
});
