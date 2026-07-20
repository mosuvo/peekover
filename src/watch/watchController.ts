// watchController — the detector→re-render loop (spec 005 task 4.2), and the two judgement calls
// this milestone had to make about what an update should LOOK like.
//
// It owns exactly one job: when the detector reports new text, re-render the reader in place
// without losing the reader's mode or their place (`preserveReading`, task 3.3), fire a brief
// update signal, and follow the new content ONLY if the reader was already at the bottom.
//
// Debounce is deliberately NOT here. It is group 5's, chosen FROM measurement (5.1 measures, 5.2
// decides, 5.3 implements) — the split exists because 004's 4.1 inference did not survive contact
// with 4.2's measurement, and the only reason a budget-breaching gate never shipped is that the
// measuring task was forbidden from choosing.
//
// ══ DECISION 1 — FOLLOW IS OPT-IN-BY-POSITION. THE SPEC WINS OVER THE MOCKUP. ═════════════════
//
// `design/mockup.html` calls `p.scrollIntoView({block:'center', behavior:'smooth'})` on EVERY
// simulated update, unconditionally. **That behaviour is not shipped, and the divergence is
// deliberate rather than an oversight.** Spec §4: *"While watch is active and the reader has
// scrolled away from the bottom, when the document updates, the system shall NOT move them —
// following is opt-in-by-position, never a hijack."*
//
// The mockup is a demo in which the author is always looking at the paragraph being written, so an
// unconditional scroll always feels right there. In the product it is the opposite: an agent
// rewriting a file emits updates continuously, and yanking a reader who is deliberately reading
// §2 down to §9 on every keystroke is the single most intrusive thing this feature could do. So:
// at the bottom → follow (the reader is tailing the output, and following is what they want);
// scrolled away → do not move them at all.
//
// **Do not "fix" this to match the mockup.** The mockup is the design source for the badge's LOOK,
// not for this behaviour, and the two disagree on purpose.
//
// ══ DECISION 2 — THE UPDATE SIGNAL FLASHES THE CONTROL, NOT THE DOCUMENT ══════════════════════
//
// The mockup flashes the CHANGED ELEMENT (`.flash{animation:flash 1.6s}` — `--hl-soft` fading to
// transparent). That is the right design, and it is unbuildable in 005: knowing WHICH element
// changed requires a diff, and the diff is 006. The three candidates, and why this one:
//
//   (a) flash the changed element — needs 006's diff. Building a diff to get a flash would be
//       inverting the milestone split (D-1) for a visual affordance.
//   (b) flash the whole reading column / reader root — a full-width background wash across the
//       entire document on EVERY agent keystroke. That is not "brief and non-intrusive"; it is
//       the most intrusive option on the list, and it violates the standing acceptance criterion
//       that the document stays the hero.
//   (c) flash the WATCH CONTROL itself — the chrome whose whole meaning is already "this file is
//       live". A ~1.6s highlighter wash on a 100px pill in the corner, using the mockup's own
//       flash keyframe and duration, so the reader gets an unmistakable "it just updated" cue in
//       their peripheral vision while the document itself never moves or flickers.
//
// (c) ships. It is honest about what 005 knows (the file changed) rather than implying knowledge
// it does not have (where it changed), and it costs nothing to replace: when 006 lands the diff,
// the per-element flash becomes an ADDITION to this, not a rewrite of it.
//
// **THE TOAST IS DEFERRED TO 006, DELIBERATELY.** The mockup's bottom-centre
// "◈ File changed on disk — rendered live" toast is optional for 005 (tasks.md 4.2) and is not
// built: the reader has no toast primitive today, so it would be a new piece of chrome — a new
// corner, a new stacking context, a new dismissal contract, and a new set of geometry assertions
// against the five pieces of chrome already in the corners. The pill flash carries the same
// information at a fraction of the surface area. If 006 wants the toast (it has more to SAY —
// "3 lines added"), it builds the primitive then.

import { mount, type MountOptions } from '../render/mount';
import { resolveScrollContainer } from '../render/scrollContainer';
import type { ChangeDetector } from './changeDetector';
import { notifyWatchChanged, setWatchNote, type WatchTarget } from './watchRegistry';
import { signalWatchUpdate } from './watchControl';

/**
 * How many CONSECUTIVE failed reads mean the watch is dead rather than merely interrupted.
 *
 * PROVISIONAL, and deliberately not an asserted acceptance threshold (the standing rule). The
 * shape of the number matters more than its value: it must be >1, because a file being rewritten
 * can briefly fail to open and a watch that died on the first blip would be useless against
 * exactly the agent-writes-continuously workload this feature exists for; and it must be small,
 * because spec §4 forbids retrying forever. Three ticks is a few seconds at the current poll
 * interval — long enough to ride out a rewrite, short enough that a deleted file is reported while
 * the user still remembers deleting it.
 */
export const DEAD_AFTER_FAILURES = 3;

/**
 * How close to the bottom still counts as being AT the bottom.
 *
 * PROVISIONAL and deliberately not an asserted acceptance threshold (the standing "no un-measured
 * threshold" rule) — it exists because sub-pixel scroll positions, fractional device pixels and a
 * reader who scrolled *almost* to the end all need to read as "tailing". It is a UX slack value,
 * not a performance budget, so 5.1/5.2 have no business measuring it.
 */
export const AT_BOTTOM_SLACK_PX = 24;

/**
 * PURE: is a scroll box at (or within slack of) its bottom?
 *
 * The one piece of real logic in this module, so it is unit-tested in jsdom while everything that
 * depends on layout is proven in a real engine.
 *
 * A box that does not overflow at all (`scrollHeight <= clientHeight`) is trivially at its bottom,
 * and that answer is the correct one rather than a degenerate case: there is nothing to follow, so
 * the follow is a no-op either way.
 */
export function isAtBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  slack: number = AT_BOTTOM_SLACK_PX,
): boolean {
  return scrollHeight - clientHeight - scrollTop <= slack;
}

/** The render call the controller makes. Injected so the unit test can observe the options it is
 *  handed WITHOUT a real engine; production passes `mount`. */
export type RenderFn = (text: string, host: HTMLElement, options: MountOptions) => void;

export interface WatchControllerOptions {
  /** The detector this controller drives (task 1.1's polled one, or 1.2's observer). */
  detector: ChangeDetector;
  /** Whether the reader is the app page's contained pane — threaded to `mount` AND to the scroll
   *  container resolver, which genuinely differs per surface (task 3.1's extracted trap guard). */
  contained?: boolean;
  /** Injected for the unit test; defaults to the real `mount`. */
  render?: RenderFn;
  /** Injected for the unit test; defaults to the real control flash. */
  signal?: (host: HTMLElement) => void;
}

/**
 * Build the controller as a {@link WatchTarget} — the shape task 4.1's registry holds and the
 * rebuilt-every-mount control drives. Registering it REPLACES whatever occupied the slot (4.1's
 * thin detector-backed adapter), which is why the control must read the registry at click time
 * rather than capture a reference.
 */
export function createWatchController(options: WatchControllerOptions): WatchTarget {
  const { detector, contained = false, render = mount, signal = signalWatchUpdate } = options;
  let host: HTMLElement | null = null;
  let running = false;
  let consecutiveFailures = 0;

  /** Stop without going through the WatchTarget surface, so the dead-read path and an explicit
   *  user stop share one teardown and cannot drift apart. */
  function stopSelf(): void {
    if (!running) return;
    running = false;
    host = null;
    consecutiveFailures = 0;
    detector.stop();
    notifyWatchChanged();
  }

  function onReadError(): void {
    if (!running) return;
    consecutiveFailures += 1;
    if (consecutiveFailures < DEAD_AFTER_FAILURES) return;
    // THE DEAD-READ POLICY (task 4.3), and every clause of it is deliberate:
    //   • it STOPS rather than retrying forever — a watch that cannot read is burning a timer for
    //     nothing, and spec §4 forbids failing silently just as it forbids retrying blindly;
    //   • it explains, in plain language, WITHOUT a re-render — so the last good render stays
    //     exactly where it is. Never a blank page (AGENTS.md #5), and never a mystery either;
    //   • the toggle STAYS, because retrying is the user's call to make, not ours.
    stopSelf();
    setWatchNote(
      'Stopped watching — this file could not be read. It may have been moved, renamed, or ' +
        'deleted. The last version that was read is still shown above.',
    );
  }

  function onText(text: string): void {
    const target = host;
    if (!running || !target) return;
    consecutiveFailures = 0; // a good read clears the streak; only CONSECUTIVE failures count

    // CAPTURED BEFORE THE RE-RENDER, and it has to be: after `replaceChildren` the box's geometry
    // is the NEW document's, so "were they at the bottom" is a question only the old layout can
    // answer. This is the whole of decision 1 — one boolean, read at the one moment it is true.
    const scroller = resolveScrollContainer(target, contained);
    const wasAtBottom = isAtBottom(
      scroller.scrollTop,
      scroller.scrollHeight,
      scroller.clientHeight,
    );

    // `preserveReading: true` is what makes this a WATCH re-render rather than a fresh open: mode
    // and reading place survive (task 3.3). Every other caller omits the flag and keeps the
    // unconditional reset that `readerPane.select()` depends on.
    render(text, target, { contained, preserveReading: true });

    // The signal fires on EVERY update; the follow only when they were tailing.
    signal(target);
    if (wasAtBottom) followToBottom(scroller);
  }

  return {
    start(next) {
      if (running) return;
      running = true;
      host = next;
      consecutiveFailures = 0;
      // Starting clears any previous explanation: the user has just asked to watch THIS file, and
      // a stale "stopped watching" note from the last one would be a lie about the current state.
      setWatchNote(null);
      detector.start(onText, onReadError);
      notifyWatchChanged();
    },
    stop: stopSelf,
    isWatching: () => running,
  };
}

/**
 * Scroll to the bottom, correctly, across the reflow window.
 *
 * THE HARNESS LESSON FROM 3.2, APPLIED TO PRODUCTION CODE. `mount()` is synchronous, but the
 * reader has NOT finished restyling when it returns: measured at 3.2, `scrollHeight` read
 * 81798 px at first overflow and 26069 px once settled — a 3x reflow. A `scrollTop` write in that
 * window CLAMPS to a stale maximum, silently landing somewhere wrong. So the write is repeated on
 * the next two frames.
 *
 * It is repeated ONLY WHEN THE GEOMETRY ACTUALLY MOVED, which matters for more than efficiency:
 * `:host` is `scroll-behavior:smooth`, so an unconditional re-write every frame would restart the
 * smooth animation on each one and the scroll would crawl instead of gliding. Re-targeting the
 * same destination is a no-op the engine ignores; re-targeting a CHANGED one is the correction
 * this exists for.
 *
 * Reduced motion needs no branch here: `readerCss.ts` already flips `:host{scroll-behavior}` to
 * `auto` under `@media (prefers-reduced-motion:reduce)`, so the same `scrollTop` write that
 * glides by default lands instantly under `reduce` — the mechanism 003's TOC navigation already
 * relies on, reused rather than reinvented.
 */
function followToBottom(scroller: HTMLElement): void {
  let lastHeight = -1;
  const write = (): void => {
    if (scroller.scrollHeight === lastHeight) return;
    lastHeight = scroller.scrollHeight;
    scroller.scrollTop = scroller.scrollHeight;
  };
  write();
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    write();
    requestAnimationFrame(write);
  });
}
