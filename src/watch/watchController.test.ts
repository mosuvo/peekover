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
  CHANGED_AGAIN_NOTE,
  DIFF_DISPLAYED_ATTR,
} from './watchController';
import type { ChangeDetector, OnText } from './changeDetector';
import type { MountOptions } from '../render/mount';
import { resetWatchRegistryForTest, watchNote } from './watchRegistry';
// TEST FILES ARE EXEMPT FROM THE 5.1 IMPORT FENCE (diffEngine.test.ts's allowlist walks PRODUCTION
// `.ts` only). That exemption is what makes the drift check below possible at all: production
// `watchController.ts` may not import the view, so the test imports BOTH sides and compares them.
import { DIFF_HOST_ATTR, DIFF_ACTIVE } from '../render/diffView';
// The same exemption, for the same reason (012 task 4.1): the controller reads `data-mode` by
// literal, and the drift check at the bottom of the D-8 block drives the module that writes it.
import { enterEditMode, exitEditMode } from '../render/readerMode';

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

// ════ TASK 6.3 — D-11: A DISPLAYED DIFF DEFERS THE RE-RENDER (DECISION 4) ═════════════════════
//
// The rule under test: while D-15's `data-diff` attribute is on the host, `onText` coalesces and
// renders NOTHING; when the attribute goes away, the withheld text renders and the reader is told
// the document moved while they were comparing.
//
// ── WHAT IS PROVEN HERE AND WHAT IS NOT ──────────────────────────────────────────────────────
//
// The DEFERRAL is state-machine logic over one attribute, which jsdom models exactly (it has a real
// MutationObserver). What jsdom cannot see is whether the diff was ever actually on screen, whether
// the reading column stayed hidden while it was, and whether the real affordance's exit gesture
// reaches the attribute at all — those are the real-engine half, in
// tests/browser/watchDiffDefer.browser.test.ts, on Chromium AND Firefox.
//
// ── WHY THE ATTRIBUTE IS SET BY HAND HERE ────────────────────────────────────────────────────
//
// Calling `enterDiff` would import `diffView` into this suite's graph for no gain: the controller's
// contract is with the ATTRIBUTE, not with the view, and setting it directly is the honest way to
// test a contract stated in exactly those terms. The risk that buys — that the two sides drift on
// how the attribute is SPELLED — is what the drift check at the bottom of this block is for.

/** Yield long enough for jsdom to deliver a MutationObserver batch. Microtasks, not timers, so it
 *  is safe under `vi.useFakeTimers()` — the callback is queued on the microtask checkpoint. */
async function observerTick(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
}

/** Open a diff on this host, the way `diffView.enterDiff` does — the attribute, and nothing else. */
function enterDiffOn(host: HTMLElement): void {
  host.setAttribute(DIFF_DISPLAYED_ATTR, DIFF_ACTIVE);
}
/** Close it, the way `diffView.exitDiff` and `mount()`'s D-15 clears both do. */
function exitDiffOn(host: HTMLElement): void {
  host.removeAttribute(DIFF_DISPLAYED_ATTR);
}

describe('watchController — D-11: a displayed diff defers the re-render (task 6.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('DEFERS while the diff is displayed: no render, and no timer armed either', async () => {
    const r = rig(40);
    r.controller.start(r.host);
    r.fire('v0'); // the immediate first render, BEFORE the diff — the baseline the reader is on
    expect(r.renders).toHaveLength(1);

    enterDiffOn(r.host);
    r.clock.advance(5000); // well past any cooldown from the render above
    r.fire('v1 — arrives while the comparison is open');
    await observerTick();

    // NOT RENDERED — the comparison the user opened is still what is on screen.
    expect(r.renders.map((x) => x.text)).toEqual(['v0']);
    // AND NO TIMER. This is the half a naive "skip this one render" would fail: an armed timer
    // would fire mid-diff and replace the comparison a second later, which is the same defect
    // with a delay on it. There is no time at which the deferred text becomes renderable — only
    // a gesture — so there is nothing for a timer to be aimed at.
    expect(vi.getTimerCount(), 'no timer may be armed by a deferred change').toBe(0);
    // ...and no signal either: nothing visibly updated, so nothing may flash.
    expect(r.signals).toBe(1);
  });

  it('FLUSHES ON EXIT: removing the attribute renders the withheld text', async () => {
    const r = rig(40);
    r.controller.start(r.host);
    r.fire('v0');
    enterDiffOn(r.host);
    r.clock.advance(5000);
    r.fire('v1');
    await observerTick();
    expect(r.renders).toHaveLength(1); // still withheld

    exitDiffOn(r.host);
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
    expect(r.renders[1].host).toBe(r.host);
  });

  it('SAYS SO: the exit flush sets the "changed again" note (the gate-3 line)', async () => {
    const r = rig(40);
    r.controller.start(r.host);
    expect(watchNote()).toBeNull(); // `start()` cleared it — the note below is this event's
    r.fire('v0');
    enterDiffOn(r.host);
    r.clock.advance(5000);
    r.fire('v1');
    await observerTick();
    expect(watchNote(), 'the line must not appear while the diff is still up').toBeNull();

    exitDiffOn(r.host);
    await observerTick();

    expect(watchNote()).toBe(CHANGED_AGAIN_NOTE);
    // Never blank (AGENTS.md #5): whatever 9.1 decides about the wording, it resolves to a
    // non-empty sentence rather than an empty note element.
    expect(CHANGED_AGAIN_NOTE.length).toBeGreaterThan(0);
  });

  it('NO CHANGE, NO LINE: exiting a diff nothing arrived during says nothing at all', async () => {
    // ★ THE ONE THAT PROVES THE FLAG IS DOING WORK. Without `pendingSetByDefer`, every diff exit
    // would announce a change — a sentence about an event that did not happen, which is the same
    // dishonesty this decision exists to remove, pointed the other way.
    const r = rig(40);
    r.controller.start(r.host);
    r.fire('v0');

    enterDiffOn(r.host);
    r.clock.advance(5000);
    exitDiffOn(r.host); // ...and nothing arrived in between
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0']); // no re-render
    expect(watchNote()).toBeNull(); // and no line
  });

  it('COALESCES during the diff: three changes become ONE render of the NEWEST text', async () => {
    // The coalescer's own rule (DECISION 3) is unchanged by the deferral — one slot, newest wins.
    // The count AND the content, for the same reason 5.3 asserted both: keeping the FIRST text
    // would pass a count-only test and would be the wrong answer.
    const r = rig(40);
    r.controller.start(r.host);
    r.fire('v0');
    enterDiffOn(r.host);
    r.clock.advance(5000);

    r.fire('v1');
    r.fire('v2');
    r.fire('v3');
    await observerTick();
    expect(r.renders).toHaveLength(1);

    exitDiffOn(r.host);
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v3']); // ONE render, and it is the newest
    expect(r.signals).toBe(2); // one flash per visible update, still
  });

  it('A DOCUMENT SWITCH DURING A DIFF DISCARDS the deferred text — A never lands in B', async () => {
    // 4.3's cross-feed bug, one more level up. `readerPane.select()` / `appShell.selectFolderFile`
    // are stop-then-start with a DIFFERENT host, and a deferred text surviving that would put file
    // A's content into file B's reader the moment A's stale attribute happened to clear.
    const r = rig(40);
    const hostB = midDocumentHost();

    r.controller.start(r.host); // watching file A
    r.fire('A: rendered');
    enterDiffOn(r.host);
    r.clock.advance(5000);
    r.fire('A: deferred'); // withheld behind A's diff when the user switches away

    r.controller.stop(); // ...what the switch does first
    r.controller.start(hostB); // ...and then B mounts
    exitDiffOn(r.host); // A's attribute clears afterwards (mount()'s D-15 clear, or a late gesture)
    await observerTick();
    r.clock.advance(5000);

    expect(r.renders).toHaveLength(1); // A's deferred text never rendered anywhere
    expect(r.renders.some((x) => x.host === hostB)).toBe(false);
    expect(watchNote()).toBeNull(); // and B is told nothing about A's change

    // ...and B is not left in a deferred state either: its first change renders immediately.
    r.fire('B: first');
    expect(r.renders).toHaveLength(2);
    expect(r.renders[1]).toMatchObject({ text: 'B: first', host: hostB });
  });

  it('A TIMER ARMED BEFORE THE DIFF OPENED does not fire underneath it — it converts', async () => {
    // THE PATH THAT DOES NOT GO THROUGH `onText`. A cooldown timer armed moments before the user
    // opened the comparison is still in flight when they do; letting it fire would replace the
    // comparison a beat later, which is the deferral defeated by timing rather than by logic.
    const r = rig(400); // an expensive render, so the cooldown is long enough to open a diff inside
    r.controller.start(r.host);
    r.fire('v0'); // renders, and arms a 400 ms cooldown
    r.fire('v1'); // inside it -> pending, timer armed
    expect(vi.getTimerCount(), 'the cooldown timer really is armed').toBe(1);

    enterDiffOn(r.host); // the user opens a comparison with that timer still in flight
    r.clock.advance(2000); // the timer fires in here

    expect(r.renders.map((x) => x.text)).toEqual(['v0']); // it did NOT render under the diff
    expect(vi.getTimerCount(), 'and it did not re-arm itself either').toBe(0);

    exitDiffOn(r.host);
    await observerTick();

    // The text was not lost — it converted to a deferred one and flushes, line and all.
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
    expect(watchNote()).toBe(CHANGED_AGAIN_NOTE);
  });

  it('THE CONTENT-SCRIPT SHAPE (docId null) is ONE code path, inert because nothing sets the flag', async () => {
    // D-14 keeps the diff feature off that surface entirely, so `data-diff` is never set there and
    // the deferral never fires — an ARCHITECTURAL fact about which graph registers a diff context
    // (proven as one in diffChrome.browser.test.ts), not a runtime branch in this module.
    //
    // What is proven HERE is the other half of that claim: the controller does not BRANCH on the
    // surface. A `docId: null` controller runs the identical code — it installs the same observer
    // and honours the same condition — so the content script's behaviour is 5.3's unchanged
    // because the attribute is absent, and for no other reason.
    resetWatchRegistryForTest();
    const fake = fakeDetector();
    const clock = fakeClock();
    const renders: string[] = [];
    const controller = createWatchController({
      detector: fake.detector,
      docId: null, // ← exactly what contentWatch.ts passes
      render: (text) => renders.push(text),
      signal: () => {},
      now: clock.now,
    });
    const host = midDocumentHost();
    controller.start(host);

    // Absent the attribute, the coalescer is 5.3's, untouched: the first change renders at once.
    fake.fire('v0');
    expect(renders).toEqual(['v0']);
    expect(watchNote()).toBeNull();

    // NON-VACUOUS — the observer and the condition really ARE installed on this shape. Set the
    // attribute by hand (which no content-script code path ever does) and the same defer/flush
    // runs. If this controller had been built without them, this half would render immediately
    // and the note would never appear.
    enterDiffOn(host);
    clock.advance(5000);
    fake.fire('v1');
    await observerTick();
    expect(renders).toEqual(['v0']); // deferred
    exitDiffOn(host);
    await observerTick();
    expect(renders).toEqual(['v0', 'v1']); // flushed
    expect(watchNote()).toBe(CHANGED_AGAIN_NOTE);
  });

  it('DRIFT CHECK: the hard-coded attribute equals diffView\'s exported DIFF_HOST_ATTR', () => {
    // ★ THE PRICE OF NOT IMPORTING. The 5.1 fence (Clause C) forbids production
    // `watchController.ts` from importing `./diffView`, so the attribute name is a literal on this
    // side and an export on that one. Two spellings of one name can drift, and the failure mode if
    // they did is SILENT: the deferral would simply stop firing, a diff would be replaced under
    // the reader, and every test that sets the attribute by hand would still pass. This assertion
    // is what turns that into a red build. Test files are fence-exempt, which is what lets one
    // file import both sides.
    expect(DIFF_DISPLAYED_ATTR).toBe(DIFF_HOST_ATTR);
    // The VALUE too, not just the attribute name: `enterDiff` writes `DIFF_ACTIVE` into it, and
    // the controller's `hasAttribute` check is value-agnostic on purpose (any diff is a diff) —
    // so this pins that the view still writes a non-empty value rather than a bare attribute
    // some future presence check might read differently.
    expect(DIFF_ACTIVE.length).toBeGreaterThan(0);
  });
});

// ════ 012 TASK 4.1 — D-8: EDIT MODE DEFERS THE RE-RENDER; LEAVING IT FLUSHES ═════════════════════
//
// The rule under test: while the host's `data-mode` is the literal `edit`, the loop renders
// NOTHING — by either path, `onText` or a cooldown timer already in flight — and holds the newest
// text in the one pending slot. When the host leaves edit and no diff is displayed, that text
// renders once, through the same `renderNow` every other watch render takes.
//
// The attribute is set by hand, as the D-11 block above does and for the same reason; the drift
// check at the bottom drives the real `enterEditMode` / `exitEditMode` instead. Whether a real
// editor survives a real external change is the real-engine half, in
// tests/browser/editorWatch.browser.test.ts.
//
// ── WHAT IS NOT HERE ─────────────────────────────────────────────────────────────────────────────
//
// Nothing in this block reads the editor's dirty attribute, and neither does the controller at
// 4.1: every exit from edit flushes. What a DIRTY exit should do instead is task 4.2's.

/** A mid-document host in the mode `mount()` leaves a rendered document in. */
function readingHost(): HTMLElement {
  const host = midDocumentHost();
  host.setAttribute('data-mode', 'reading');
  return host;
}

describe('watchController — D-8: edit mode defers the re-render (012 task 4.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('DEFERS while data-mode="edit": no render, no timer, no signal — the text is held', async () => {
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    expect(r.renders).toHaveLength(1);

    host.setAttribute('data-mode', 'edit');
    await observerTick();
    r.clock.advance(5000); // well past any cooldown from the render above
    r.fire('v1 — arrives while the document is being edited');
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0']);
    expect(vi.getTimerCount(), 'no timer may be armed by a deferred change').toBe(0);
    expect(r.signals).toBe(1);

    // HELD, not dropped: the same text is what the exit renders.
    host.setAttribute('data-mode', 'reading');
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual([
      'v0',
      'v1 — arrives while the document is being edited',
    ]);
  });

  it('A TIMER ARMED BEFORE EDIT ENTRY and firing during it renders nothing — it converts', async () => {
    // The `flushPending` site — the path `onText`'s condition does not cover.
    const r = rig(400);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0'); // renders, and arms a 400 ms cooldown
    r.fire('v1'); // inside it -> pending, timer armed
    expect(vi.getTimerCount(), 'the cooldown timer really is armed').toBe(1);

    host.setAttribute('data-mode', 'edit');
    await observerTick();
    r.clock.advance(2000); // the timer fires in here

    expect(r.renders.map((x) => x.text)).toEqual(['v0']);
    expect(vi.getTimerCount(), 'and it did not re-arm itself either').toBe(0);

    host.setAttribute('data-mode', 'reading');
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']); // converted, not lost
  });

  it('LEAVING EDIT flushes exactly ONE render, carrying the NEWEST deferred text', async () => {
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    host.setAttribute('data-mode', 'edit');
    await observerTick();
    r.clock.advance(5000);

    r.fire('v1');
    r.fire('v2');
    r.fire('v3');
    await observerTick();
    expect(r.renders).toHaveLength(1);

    host.setAttribute('data-mode', 'reading');
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v3']);
    expect(r.renders[1].host).toBe(host);
    expect(r.signals).toBe(2); // the flush is a watch render like any other: one flash
    r.clock.advance(5000);
    expect(r.renders, 'and nothing renders it a second time').toHaveLength(2);
  });

  it('leaving edit for RAW flushes too — the exit is "not edit", whichever mode it returns to', async () => {
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    host.setAttribute('data-mode', 'edit');
    r.clock.advance(5000);
    r.fire('v1');

    host.setAttribute('data-mode', 'raw');
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
  });

  it('A reading <-> raw FLIP WITH NOTHING PENDING renders nothing', async () => {
    // The observer now sees every mode flip, and `mount()` itself rewrites `data-mode` on every
    // render. None of those may cause a render.
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    r.clock.advance(5000);

    host.setAttribute('data-mode', 'raw');
    await observerTick();
    host.setAttribute('data-mode', 'reading');
    await observerTick();
    host.setAttribute('data-mode', 'reading'); // what a re-render writes: the same value again
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0']);
    expect(r.signals).toBe(1);
    expect(watchNote()).toBeNull();
  });

  it('a reading <-> raw flip does not release a COOLDOWN-pending render early', async () => {
    // Pending on the clock is not pending on a deferral: only the timer may release it.
    const r = rig(400);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    const finishedAt = r.clock.now();
    r.fire('v1'); // inside the 400 ms cooldown

    host.setAttribute('data-mode', 'raw');
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0']);

    advanceUntilRender(r, finishedAt);
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
    expect(r.renders[1].at - finishedAt).toBeGreaterThanOrEqual(400 * COOLDOWN_MULTIPLIER);
  });

  it('WITH A DIFF DISPLAYED, leaving edit does NOT flush — the diff still defers', async () => {
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    enterDiffOn(host);
    host.setAttribute('data-mode', 'edit');
    await observerTick();
    r.clock.advance(5000);
    r.fire('v1');

    host.setAttribute('data-mode', 'reading'); // edit ends, the comparison is still open
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0']);

    exitDiffOn(host);
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
    expect(watchNote()).toBe(CHANGED_AGAIN_NOTE); // it DID arrive while a comparison was open
  });

  it('AND THE REVERSE: closing a diff while still editing does not flush — edit still defers', async () => {
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    host.setAttribute('data-mode', 'edit');
    enterDiffOn(host);
    await observerTick();
    r.clock.advance(5000);
    r.fire('v1');

    exitDiffOn(host);
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0']);

    host.setAttribute('data-mode', 'reading');
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
  });

  it('THE "CHANGED AGAIN" LINE IS THE COMPARISON’S: an edit-only deferral flushes without it', async () => {
    // The line reads "…while the comparison was open". No comparison was open here, so saying it
    // would be a sentence about an event that did not happen (the D-11 block's own standard).
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');
    host.setAttribute('data-mode', 'edit');
    await observerTick();
    r.clock.advance(5000);
    r.fire('v1');

    host.setAttribute('data-mode', 'reading');
    await observerTick();

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']); // non-vacuous: the flush did run
    expect(watchNote()).toBeNull();
  });

  it('DRIFT CHECK: the literals are what readerMode really writes on entering and leaving edit', async () => {
    // The controller may not import `readerMode`'s mode names any more than `diffView`'s attribute
    // (Clause C), so it reads `data-mode` / `edit` as literals. This drives the real writer: if
    // either spelling moved, the deferral would silently stop firing and this goes red.
    const r = rig(40);
    const host = readingHost();
    r.controller.start(host);
    r.fire('v0');

    await enterEditMode(host, { loader: async () => ({}) });
    await observerTick();
    r.clock.advance(5000);
    r.fire('v1');
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0']);

    exitEditMode(host);
    await observerTick();
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v1']);
  });
});
