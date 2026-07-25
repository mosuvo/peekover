// @vitest-environment jsdom
//
// watchController — the jsdom-testable half (spec 005 task 4.2).
//
// WHAT IS HERE AND WHAT DELIBERATELY IS NOT. Two things about this controller are honest logic
// rather than layout, so they are proven here: the PURE at-bottom predicate, and the contract that
// the re-render carries `preserveReading: true`. Everything else this module does — whether the
// follow actually lands at the bottom, whether it is instant under `prefers-reduced-motion`,
// whether a reader scrolled mid-document is left alone — is layout and media emulation, which
// jsdom returns all-zero and cannot fake. Those live in tests/browser/watchControl.browser.test.ts
// and are proven on Chromium AND Firefox.
//
// The `render` and `signal` dependencies are INJECTED for exactly this reason (the settingsPort /
// changeDetector precedent): the options `mount` is handed are observable without a real engine.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWatchController,
  isAtBottom,
  AT_BOTTOM_SLACK_PX,
  COOLDOWN_MULTIPLIER,
} from './watchController';
import type { ChangeDetector, OnText } from './changeDetector';
import type { MountOptions } from '../render/mount';
import { resetWatchRegistryForTest } from './watchRegistry';

/** A detector whose callback this test drives by hand — the seam, with no timers involved. */
function fakeDetector(): { detector: ChangeDetector; fire: (text: string) => void; stops: number } {
  let cb: OnText | null = null;
  const state = { stops: 0 };
  return {
    detector: {
      start(next) {
        cb = next;
      },
      stop() {
        cb = null;
        state.stops += 1;
      },
    },
    fire: (text) => cb?.(text),
    get stops() {
      return state.stops;
    },
  };
}

describe('isAtBottom — the pure predicate (task 4.2)', () => {
  it('is true exactly at the bottom', () => {
    expect(isAtBottom(500, 1000, 500)).toBe(true);
  });

  it('is true within the slack, and false beyond it', () => {
    // The boundary asserted from BOTH sides, so a change to the slack cannot pass unnoticed.
    expect(isAtBottom(500 - AT_BOTTOM_SLACK_PX, 1000, 500)).toBe(true);
    expect(isAtBottom(500 - AT_BOTTOM_SLACK_PX - 1, 1000, 500)).toBe(false);
  });

  it('is false in the middle of a document — the case the whole decision exists for', () => {
    expect(isAtBottom(200, 5000, 500)).toBe(false);
    expect(isAtBottom(0, 5000, 500)).toBe(false);
  });

  it('is true for a box that does not overflow at all', () => {
    // Not a degenerate case: there is nothing to follow, so the follow is a no-op either way.
    expect(isAtBottom(0, 400, 500)).toBe(true);
  });
});

describe('watchController — the re-render contract (task 4.2)', () => {
  it('re-renders with preserveReading: true when the detector reports new text', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn<(t: string, h: HTMLElement, o: MountOptions) => void>();
    const host = document.createElement('div');

    const controller = createWatchController({ detector, docId: null, render, signal: () => {} });
    controller.start(host);
    fire('# new text');

    // THE FLAG IS THE POINT: without it `mount()` resets the reader to Reading mode and to the top
    // of the document on every agent keystroke (task 3.3's direction (a)).
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toBe('# new text');
    expect(render.mock.calls[0][1]).toBe(host);
    expect(render.mock.calls[0][2]).toMatchObject({ preserveReading: true });
  });

  it('threads `contained` to the render, so the app-page pane stays contained across an update', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn<(t: string, h: HTMLElement, o: MountOptions) => void>();

    createWatchController({ detector, docId: null, contained: true, render, signal: () => {} }).start(
      document.createElement('div'),
    );
    fire('# x');

    // Dropping this would make the app page's reader re-render as a full-page takeover mid-watch,
    // painting over the shell — the contained-surface regression M2 already paid for once.
    expect(render.mock.calls[0][2]).toMatchObject({ contained: true, preserveReading: true });
  });

  it('fires the update signal on every update', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const signal = vi.fn();
    const host = document.createElement('div');

    // FROZEN CLOCK, and it is not decoration. This test is about the render contract, not about
    // 5.3's cooldown: with a zero-cost render the cooldown is zero either way, but on the WALL
    // clock "zero" is a race between the render body and the gap between two `fire` calls. Freezing
    // it makes the intended condition (no cooldown) exact instead of probable. The cooldown's own
    // behaviour is proven below, on a clock whose every millisecond is deliberate.
    createWatchController({ detector, docId: null, render: () => {}, signal, now: () => 0 }).start(host);
    fire('a');
    fire('b');

    expect(signal).toHaveBeenCalledTimes(2);
    expect(signal).toHaveBeenCalledWith(host);
  });

  it('reports its running state, and stop() reaches the detector', () => {
    resetWatchRegistryForTest();
    const fake = fakeDetector();
    const controller = createWatchController({
      detector: fake.detector,
      docId: null,
      render: () => {},
      signal: () => {},
    });

    expect(controller.isWatching()).toBe(false);
    controller.start(document.createElement('div'));
    expect(controller.isWatching()).toBe(true);

    controller.stop();
    expect(controller.isWatching()).toBe(false);
    expect(fake.stops).toBe(1);
  });

  it('does not re-render after stop, even if a late read delivers', () => {
    // The detector already guards this (task 1.1), but the controller must not RELY on that: an
    // in-flight read delivering after a stop would re-render a reader the user switched away from.
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn();
    const controller = createWatchController({ detector, docId: null, render, signal: () => {} });

    controller.start(document.createElement('div'));
    controller.stop();
    fire('late text');

    expect(render).not.toHaveBeenCalled();
  });

  it('start() is idempotent — a second start does not double-subscribe', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn();
    const controller = createWatchController({ detector, docId: null, render, signal: () => {} });
    const host = document.createElement('div');

    controller.start(host);
    controller.start(host);
    fire('x');

    expect(render).toHaveBeenCalledTimes(1);
  });
});

// ════ TASK 5.3 — THE COST-PROPORTIONAL COOLDOWN (decided by the human at 5.2) ════════════════
//
// The rule under test: after a render finishes, the next one may not START until as long as that
// render TOOK has elapsed; whatever arrives in between coalesces into ONE pending render carrying
// the NEWEST text; the first render after a start is immediate.
//
// ── WHY THE CLOCK IS INJECTED RATHER THAN FAKED WHOLESALE ───────────────────────────────────
//
// The distinguishing property is that the cooldown is PROPORTIONAL TO WHAT A RENDER COST, so the
// test has to control that cost. A jsdom render costs nothing measurable, so `now` is injected
// (the same seam `render` and `signal` already use) and the fake render BURNS clock time. Timer
// time is advanced 1 ms at a time in lockstep with that clock, so a render's start time is exact
// and the measured wait is a number, not an approximation.
//
// ── THE ONE TEST THAT DISTINGUISHES WHAT WAS SHIPPED ───────────────────────────────────────
//
// "the cooldown SCALES WITH the render cost" is the only test here that a FIXED window would fail.
// Coalescing, newest-wins, stop-cancels and switch-discards all pass just as happily against a
// hardcoded 250 ms. Red-first proven both ways — see tasks.md 5.3.

/** A clock whose every millisecond is deliberate: `burn` is time a render consumed, `advance` is
 *  time passing with timers running. They are separate because a synchronous render does NOT let
 *  timers run — that is the whole reason callbacks queue rather than interleave. */
function fakeClock(): { now: () => number; burn: (ms: number) => void; advance: (ms: number) => void } {
  let t = 10_000;
  return {
    now: () => t,
    burn: (ms) => {
      t += ms;
    },
    advance: (ms) => {
      // 1 ms at a time so a timer fires at its due millisecond and not at the end of a big jump —
      // otherwise every measured wait would be rounded up to the step size.
      for (let i = 0; i < ms; i += 1) {
        t += 1;
        vi.advanceTimersByTime(1);
      }
    },
  };
}

interface CooldownRig {
  controller: ReturnType<typeof createWatchController>;
  fire: (text: string) => void;
  stops: () => number;
  renders: { text: string; host: HTMLElement; at: number }[];
  signals: number;
  clock: ReturnType<typeof fakeClock>;
  host: HTMLElement;
}

/**
 * A host that reads as MID-DOCUMENT rather than at the bottom.
 *
 * Not cosmetic: jsdom reports every scroll metric as 0, so `isAtBottom(0,0,0)` is TRUE and every
 * render would trigger `followToBottom`, which schedules `requestAnimationFrame` — counted by
 * `vi.getTimerCount()` under fake timers. The pending-render timer is what this suite counts, so
 * the rig puts the reader where a reader usually is (in the middle) and the count means what it
 * says. The follow itself is layout, and is proven in the real engine (4.2's browser suite).
 */
function midDocumentHost(): HTMLElement {
  const host = document.createElement('div');
  Object.defineProperty(host, 'scrollHeight', { value: 5000 });
  Object.defineProperty(host, 'clientHeight', { value: 500 });
  return host;
}

/** A controller whose render costs exactly `costMs` of clock time, every time. */
function rig(costMs: number): CooldownRig {
  resetWatchRegistryForTest();
  const fake = fakeDetector();
  const clock = fakeClock();
  const renders: { text: string; host: HTMLElement; at: number }[] = [];
  const counters = { signals: 0 };
  const controller = createWatchController({
    detector: fake.detector,
    docId: null,
    render: (text, host) => {
      renders.push({ text, host, at: clock.now() });
      clock.burn(costMs); // THE RENDER'S COST — the quantity the cooldown is proportional to
    },
    signal: () => {
      counters.signals += 1;
    },
    now: clock.now,
  });
  return {
    controller,
    fire: fake.fire,
    stops: () => fake.stops,
    renders,
    get signals() {
      return counters.signals;
    },
    clock,
    host: midDocumentHost(),
  };
}

/** Advance until a render lands, or give up. Returns how long it took. */
function advanceUntilRender(r: CooldownRig, from: number, limit = 5000): number {
  const target = r.renders.length + 1;
  for (let i = 0; i < limit && r.renders.length < target; i += 1) r.clock.advance(1);
  return r.clock.now() - from;
}

describe('watchController — the cost-proportional cooldown (task 5.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the FIRST change immediately — nothing to be proportional to yet', () => {
    const r = rig(40);
    r.controller.start(r.host);
    const at = r.clock.now();

    r.fire('first');

    // Responsive by default; throttle only on evidence. A watch that made the user wait for its
    // very first update would be paying a cost it has not yet measured.
    expect(r.renders).toHaveLength(1);
    expect(r.renders[0]).toMatchObject({ text: 'first', at });
  });

  it('COALESCES a burst into ONE render carrying the NEWEST text', () => {
    // THE COUNT AND THE CONTENT, both — a coalescer that keeps the FIRST text passes a count-only
    // test, and keeping the first text is the wrong answer: this is a viewer, not a log.
    const r = rig(40);
    r.controller.start(r.host);

    r.fire('v0'); // the immediate first render; the burst is what follows it
    expect(r.renders).toHaveLength(1);

    for (let i = 1; i <= 10; i += 1) r.fire(`v${i}`); // ten changes inside the 40 ms cooldown
    expect(r.renders, 'nothing may render during the cooldown').toHaveLength(1);

    advanceUntilRender(r, r.clock.now());

    expect(r.renders).toHaveLength(2); // ONE render for ten changes
    expect(r.renders[1].text).toBe('v10'); // ...and it is the NEWEST text
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v10']); // v1..v9 never rendered at all
  });

  it('THE COOLDOWN SCALES WITH THE RENDER COST — the test a fixed window fails', () => {
    // ★ THE ONE THAT PROVES WHAT WAS SHIPPED. Everything else in this file passes just as happily
    // against a hardcoded 250 ms window; only this distinguishes proportional from fixed.
    const measure = (costMs: number): number => {
      const r = rig(costMs);
      r.controller.start(r.host);
      r.fire('first'); // immediate; costs `costMs` of clock time
      const finishedAt = r.clock.now();
      r.fire('second'); // lands inside the cooldown -> pending
      expect(r.renders).toHaveLength(1);
      advanceUntilRender(r, finishedAt);
      expect(r.renders).toHaveLength(2);
      return r.renders[1].at - finishedAt; // waited from the END of the first render
    };

    const cheap = measure(10);
    const expensive = measure(400);

    // Each waits its OWN cost, measured from when that render FINISHED (multiplier 1.0).
    expect(cheap).toBeGreaterThanOrEqual(10 * COOLDOWN_MULTIPLIER);
    expect(cheap).toBeLessThan(30);
    expect(expensive).toBeGreaterThanOrEqual(400 * COOLDOWN_MULTIPLIER);
    expect(expensive).toBeLessThan(430);
    // The relation is the point: 40x the render cost, ~40x the cooldown. A fixed window makes this
    // ratio 1 whatever the document costs to render.
    expect(expensive).toBeGreaterThan(cheap * 10);
  });

  it('a QUIET GAP produces a render per change — no starvation, no lag', () => {
    // The property a pure trailing debounce loses: it waits for N ms of quiet, and an agent writing
    // continuously never provides any. Here, changes spaced beyond the cooldown each render at once.
    const r = rig(40);
    r.controller.start(r.host);

    r.fire('a');
    r.clock.advance(200);
    r.fire('b');
    r.clock.advance(200);
    r.fire('c');

    expect(r.renders.map((x) => x.text)).toEqual(['a', 'b', 'c']);
    expect(vi.getTimerCount(), 'no timer should be left pending').toBe(0);
  });

  it('the signal fires once per RENDER, not once per CHANGE', () => {
    // Stated rather than discovered: a coalesced burst is ONE visible update, so it gets ONE flash.
    // The signal means "what you are looking at just changed", and it did so once.
    const r = rig(40);
    r.controller.start(r.host);

    r.fire('v0');
    for (let i = 1; i <= 6; i += 1) r.fire(`v${i}`);
    advanceUntilRender(r, r.clock.now());

    expect(r.renders).toHaveLength(2);
    expect(r.signals).toBe(2);
  });

  it('stop() CANCELS a pending render — a stopped watch never renders again', () => {
    const r = rig(40);
    r.controller.start(r.host);
    r.fire('rendered');
    r.fire('pending'); // inside the cooldown
    expect(vi.getTimerCount(), 'the pending render should be armed').toBe(1);

    r.controller.stop();

    // The TIMER is gone, not merely disarmed by a running-flag check at fire time. That difference
    // is the next test: a live timer survives into a RESTARTED watch on a different document.
    expect(vi.getTimerCount()).toBe(0);
    r.clock.advance(5000);
    expect(r.renders.map((x) => x.text)).toEqual(['rendered']);
  });

  it('A DOCUMENT SWITCH DISCARDS the pending render — file A never lands in file B', () => {
    // ASSERTED DIRECTLY RATHER THAN INFERRED FROM stop(). This is 4.3's cross-feed bug one level
    // up: `readerPane.select()` / `appShell.selectFolderFile` stop the watch and re-mount the
    // SHARED host with a different file, so a queued render firing afterwards would put file A's
    // text into file B's reader — with no error and no clue, the silent-wrong-answer class.
    const r = rig(40);
    const hostB = midDocumentHost();

    r.controller.start(r.host); // watching file A
    r.fire('A: rendered');
    r.fire('A: pending'); // in flight when the user switches away

    r.controller.stop(); // ...what readerPane.select() does FIRST
    r.controller.start(hostB); // ...and then the new document mounts

    r.clock.advance(5000);

    expect(r.renders).toHaveLength(1); // A's pending text never rendered
    expect(r.renders.some((x) => x.host === hostB)).toBe(false); // and never reached B's host

    // ...and B is not left throttled by A's render cost either: its first change is immediate.
    r.fire('B: first');
    expect(r.renders).toHaveLength(2);
    expect(r.renders[1]).toMatchObject({ text: 'B: first', host: hostB });
  });
});
