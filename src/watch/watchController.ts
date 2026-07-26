// watchController — the detector→re-render loop (spec 005 task 4.2), and the two judgement calls
// this milestone had to make about what an update should LOOK like.
//
// It owns exactly one job: when the detector reports new text, re-render the reader in place
// without losing the reader's mode or their place (`preserveReading`, task 3.3), fire a brief
// update signal, and follow the new content ONLY if the reader was already at the bottom.
//
// Debounce was deliberately NOT here at 4.2. It is group 5's, chosen FROM measurement (5.1
// measures, 5.2 decides, 5.3 implements) — the split exists because 004's 4.1 inference did not
// survive contact with 4.2's measurement, and the only reason a budget-breaching gate never
// shipped is that the measuring task was forbidden from choosing. It has now been decided and it
// lives below, as DECISION 3.
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
// ══ DECISION 3 — THE COOLDOWN IS COST-PROPORTIONAL, NOT A FIXED WINDOW (tasks 5.2 + 5.3) ══════
//
// Decided by the human at 5.2 from 5.1's measurements, recorded in decisions.md (2026-07-21)
// BEFORE this code was written. The rule, in one sentence:
//
//     After a render finishes, refuse the next one until roughly as long as that render TOOK has
//     elapsed — and coalesce whatever arrives in between into ONE pending render carrying the
//     NEWEST text.
//
// WHY PROPORTIONAL RATHER THAN A NUMBER. 5.1 measured the render at both ends of the plausible
// range: 50 KB blocks ~35 ms synchronously (~50 ms to the 2nd rAF), 1 MB blocks ~717 ms (~806 ms).
// A window chosen for one of those is wrong for the other by a factor of ~16. Proportional means
// the reader gets as much idle as it just spent rendering, whatever the document turned out to be:
// ~50 ms at 50 KB — far below the 1 s poll interval, so it is invisible on every realistic file —
// and ~800 ms at 1 MB, where it is the difference between the main thread being roughly half free
// and not free at all.
//
// WHY THIS BECAME NECESSARY AT 4.7 AND NOT BEFORE. `mount()` is SYNCHRONOUS, so detector callbacks
// cannot interleave — they QUEUE. Until 4.7 every shipped path polled at 1 Hz, and a 1 Hz source
// cannot produce a burst; 4.7 wired `observerDetector`, which 5.1 measured firing within ~19 ms of
// a write. Ten changes arriving during an 800 ms render is ~8 s of solid blocking with no way to
// scroll, cancel or even repaint. That is the failure this exists to prevent.
//
// THE THREE CLAUSES, EACH LOAD-BEARING:
//   • FROM THE END, NOT THE START. Measuring the cooldown from when the render STARTED would leave
//     no gap at all — the render itself would consume the whole window and the next one could
//     begin the instant it returned.
//   • MULTIPLIER 1.0. The reader gets as much idle as it spent rendering. Any other multiplier
//     would be a threshold nobody measured (the standing rule), and this one explains itself.
//   • COALESCE, DO NOT QUEUE. At most ONE pending render, and the NEWEST text replaces whatever
//     was pending. **This is a viewer, not a log** — nobody needs the intermediate states of a
//     file being written, and a queue would guarantee the pile-up the cooldown exists to stop.
//
// AND THE FIRST RENDER AFTER A START IS IMMEDIATE. There is no prior cost to be proportional to,
// so there is nothing to justify making the user wait: be responsive by default, throttle only on
// evidence. `start()` resets the cooldown for the same reason.
//
// The update signal therefore fires once per RENDER, not once per CHANGE. That is correct rather
// than a compromise: the signal means "the view you are looking at just updated", and a coalesced
// burst produces exactly one visible update. One flash per flash.
//
// **THE TOAST IS DEFERRED TO 006, DELIBERATELY.** The mockup's bottom-centre
// "◈ File changed on disk — rendered live" toast is optional for 005 (tasks.md 4.2) and is not
// built: the reader has no toast primitive today, so it would be a new piece of chrome — a new
// corner, a new stacking context, a new dismissal contract, and a new set of geometry assertions
// against the five pieces of chrome already in the corners. The pill flash carries the same
// information at a fraction of the surface area. If 006 wants the toast (it has more to SAY —
// "3 lines added"), it builds the primitive then.
//
// ══ DECISION 4 — A DISPLAYED DIFF DEFERS THE RE-RENDER, AND SAYS SO ON EXIT (006 D-11) ════════
//
// 006 gives the reader a second thing to look at in the same host: an inline diff against a saved
// snapshot (`diffView.ts`, task 6.1; the affordance that opens it is 6.2). While that is on screen,
// re-rendering the reading column underneath it would replace a comparison the user deliberately
// opened, with no indication that anything happened. So:
//
//     WHILE A DIFF IS DISPLAYED, `onText` COALESCES BUT NEVER RENDERS. On exit the deferred text
//     renders — and the reader is TOLD that the document moved while they were comparing.
//
// Both halves are load-bearing, and the second is a product decision (gate 3, decisions.md
// 2026-07-23): deferring silently and then swapping silently is the same dishonesty two layers
// down. The line's legibility — useful or noise — is a task 9.1 human-gate item, not something
// this module can self-certify.
//
// HOW IT KNOWS, AND WHY THAT IS AN ATTRIBUTE READ RATHER THAN AN IMPORT. D-15 makes `data-diff` on
// the host the single source of truth for "a diff is displayed": `diffView.ts` sets it, the reader
// CSS hides the reading column off it, `mount.ts` clears it on a document switch. This module READS
// that attribute and imports nothing — the 5.1 two-layer import fence (Clause C, expanded at 6.2)
// forbids `watchController.ts` from importing `./diffView`, because this module is in the
// CONTENT-SCRIPT bundle's graph and the view drags the `diff` package behind it. So the attribute
// name is a hard-coded literal here, and a unit test asserts it still equals the view's exported
// `DIFF_HOST_ATTR` — a rename reddens loudly instead of silently disabling the deferral.
//
// WHY A MutationObserver AND NOT AN EXIT CALLBACK. There is more than one way out of a diff — the
// affordance's exit gesture (6.2), `mount()`'s clear-on-document-switch (D-15, two sites), and
// whatever a later task adds. An explicit signal would have to be threaded through every one of
// them, and the one that got missed would strand the deferred text forever. Watching the attribute
// covers them all uniformly, and holds no policy of its own: it reads D-15's flag and flushes.
//
// AND THE CONTENT SCRIPT IS UNCHANGED BY CONSTRUCTION. D-14 keeps the whole diff feature off that
// surface (no affordance, no view, no registry), so `data-diff` is never set there, the deferral
// never fires, and the coalescer behaves exactly as 5.3 shipped. That is an architectural fact
// about which graph reaches the registry, not a runtime check — and it is proven as one.

import { mount, type MountOptions } from '../render/mount';
import { resolveScrollContainer } from '../render/scrollContainer';
import { readerSourceFor } from '../render/readerMode';
import { normalise, storeSnapshot } from '../app/snapshots';
import { getCaptureFlag } from '../app/captureFlag';
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
 * The plain-language explanation for a watch that DIED because the file stopped being readable.
 *
 * Extracted from `onReadError` below and exported at task 4.7 for ONE reason: the observer path
 * reaches the same user-facing state by a different mechanism. `onReadError` counts consecutive
 * failed POLLS; `observerDetector`'s dead-observation ladder reports `onDead` when a dead record
 * turns out to sit over a file that can no longer be opened. Same fact, same thing to say — so
 * there is one string, not two that could drift into saying different things about one event.
 */
export const DEAD_READ_NOTE =
  'Stopped watching — this file could not be read. It may have been moved, renamed, or ' +
  'deleted. The last version that was read is still shown above.';

/**
 * How much idle the reader gets per unit of render cost (task 5.2's decision).
 *
 * 1.0 — the cooldown equals the last render's measured cost, so the reader gets as much idle as it
 * just spent rendering. **NOT a tuned constant and deliberately not one:** every other value would
 * be a threshold no measurement supports, whereas this one states its own reasoning. If 7.1 finds
 * the reader laggy at normal sizes, the honest move is to loosen or remove the mechanism (recorded
 * revisit-when), not to hunt for a number.
 */
export const COOLDOWN_MULTIPLIER = 1;

/**
 * D-15's "a diff is displayed" flag, as a LITERAL — deliberately not an import (DECISION 4).
 *
 * `diffView.ts` exports this exact name as `DIFF_HOST_ATTR`, and that is the module that sets and
 * clears it. Importing it from here would put `diffView` — and behind it the `diff` package — into
 * the content-script bundle's import graph, which the 5.1 fence (Clause C) exists to forbid. Two
 * readers of one attribute cannot drift in MEANING (plan §0 D-15 argues exactly this); what they
 * CAN do is drift in SPELLING, so `watchController.test.ts` asserts this literal still equals the
 * view's export. That check is the whole price of not importing, and it is paid in a test file,
 * which the fence exempts.
 */
export const DIFF_DISPLAYED_ATTR = 'data-diff';

/**
 * The D-11 "changed again" line — the gate-3 product decision, in the copy that shipped.
 *
 * ★ COPY, NOT LOGIC. Its legibility (does this read as useful, or as noise?) is a task 9.1
 * human-gate item; an agent cannot self-certify it, and a "reads as noise" verdict there is a
 * finding to record, not a licence to delete the line quietly.
 *
 * WHAT IT IS ALLOWED TO SAY, and each clause is a constraint the draft is held to:
 *   • it names WHAT happened (the document changed) and WHEN (while the comparison was open) —
 *     nothing else. It does NOT say what changed, how many lines, or which version this is: the
 *     6.2 affordance is a diff-target picker, not a version browser (§3.7 divergence 2), and
 *     copy that implied otherwise would promise a feature that does not exist;
 *   • it says where the newer document IS, in the same register `DEAD_READ_NOTE` already uses
 *     ("...is still shown above") — because this line arrives at the moment the reader's view
 *     changes under them, and pointing at the result is the honest half of admitting it;
 *   • it offers no restore, undo or revert verb. Nothing here can put the old text back.
 *
 * WHY IT GOES THROUGH THE NOTE CHANNEL. `setWatchNote` already means precisely "something you
 * should know about the watch you asked for", it renders beside the reader WITHOUT a re-render,
 * and it is the channel 4.3's dead-read explanation and 4.4's unavailable-surface explanation both
 * use. A second channel for a third sentence of the same kind would be new chrome nobody walked.
 */
export const CHANGED_AGAIN_NOTE =
  'This document changed again while the comparison was open — the newer version is shown above.';

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
  /**
   * The snapshot document identity `folderId + SEP + path`, or `null` for a surface that captures
   * nothing (task 1.4). REQUIRED-not-optional deliberately: the null case is EXPLICIT, so no call
   * site can omit it and silently default to a captured "unknown". The app page passes a constructed
   * id (`appShell.installWatchForFile`); the content script passes `null` (`contentWatch.ts`) — and
   * that `docId != null` guard, not a second check, is what keeps capture app-page-only (§3.2).
   */
  docId: string | null;
  /** Whether the reader is the app page's contained pane — threaded to `mount` AND to the scroll
   *  container resolver, which genuinely differs per surface (task 3.1's extracted trap guard). */
  contained?: boolean;
  /** Injected for the unit test; defaults to the real `mount`. */
  render?: RenderFn;
  /** Injected for the unit test; defaults to the real control flash. */
  signal?: (host: HTMLElement) => void;
  /**
   * The clock the cooldown is measured on. Injected for exactly the same reason `render` and
   * `signal` are (the settingsPort / changeDetector precedent): a test needs to control how long a
   * render *costs* in order to prove the cooldown is proportional to it, and a real render in jsdom
   * costs nothing measurable. Production passes `performance.now`, which is the right instrument —
   * `mount()` is synchronous, so a reading either side of it IS the block, exactly.
   */
  now?: () => number;
}

/**
 * Build the controller as a {@link WatchTarget} — the shape task 4.1's registry holds and the
 * rebuilt-every-mount control drives. Registering it REPLACES whatever occupied the slot (4.1's
 * thin detector-backed adapter), which is why the control must read the registry at click time
 * rather than capture a reference.
 */
export function createWatchController(options: WatchControllerOptions): WatchTarget {
  const {
    detector,
    docId,
    contained = false,
    render = mount,
    signal = signalWatchUpdate,
    now = () => performance.now(),
  } = options;
  let host: HTMLElement | null = null;
  let running = false;
  let consecutiveFailures = 0;

  // ── The cost-proportional cooldown's entire state (DECISION 3) ────────────────────────────
  /** The earliest time the next render may START. 0 = no cooldown, render immediately. */
  let readyAt = 0;
  /** The one pending text, or null. There is never a second: the newest REPLACES this. */
  let pendingText: string | null = null;
  /** The timer that will flush {@link pendingText}. Cancelled by every teardown path. */
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  // ── D-11's entire additional state (DECISION 4) ────────────────────────────────────────────
  /**
   * Is {@link pendingText} waiting on a DIFF EXIT rather than on the cooldown?
   *
   * The distinction is what keeps the "changed again" line honest. A cooldown-pending render is
   * about to happen anyway and the reader will simply see it; a DEFERRED one is text the reader
   * has been kept from on purpose, and telling them about it is the whole of the gate-3 decision.
   * Without this flag, exiting a diff during which nothing arrived would still fire the line —
   * a sentence about an event that did not occur.
   */
  let pendingSetByDefer = false;
  /** Watches the host's `data-diff` so every exit path flushes. Null while not watching. */
  let diffObserver: MutationObserver | null = null;

  /** Is a diff on screen in this host right now? D-15's attribute, read directly (DECISION 4). */
  function diffDisplayed(target: HTMLElement): boolean {
    return target.hasAttribute(DIFF_DISPLAYED_ATTR);
  }

  /**
   * Install the exit watcher on the host this watch is rendering into.
   *
   * Cheap and unconditional — every surface gets one, including the content script where
   * `data-diff` is never set and the callback therefore never runs (D-14). That is deliberate:
   * ONE code path, and the surface difference stays an architectural fact about which graph
   * registers a diff context rather than a runtime branch this module has to keep true.
   */
  function installDiffObserver(target: HTMLElement): void {
    diffObserver?.disconnect();
    diffObserver = new MutationObserver(() => {
      if (!diffDisplayed(target)) onDiffExited();
    });
    diffObserver.observe(target, { attributes: true, attributeFilter: [DIFF_DISPLAYED_ATTR] });
  }

  /**
   * The diff came off the screen: render what was withheld, and say that it was withheld.
   *
   * ORDER MATTERS — the render first, the line second. The line points at the document ("shown
   * above"), so it must not arrive before the document it describes.
   *
   * The cooldown is deliberately NOT re-checked here. It exists to stop a BURST of renders piling
   * onto the main thread; this is a single render released by a user gesture, after a window in
   * which the loop rendered nothing at all — there is no pile-up to prevent, and making the reader
   * wait after they closed the comparison would look like a hang. `renderNow` sets `readyAt` from
   * this render's own cost on the way out, so the next change is throttled normally.
   */
  function onDiffExited(): void {
    const target = host;
    if (!running || !target || !pendingSetByDefer || pendingText === null) return;
    const text = pendingText;
    pendingText = null;
    pendingSetByDefer = false;
    renderNow(text, target);
    setWatchNote(CHANGED_AGAIN_NOTE);
  }

  /**
   * Drop the pending render, timer and all.
   *
   * BOTH HALVES MATTER, and the second one is a bug this milestone has already met one level down.
   * Clearing `pendingText` alone would leave a live timer that fires into a *restarted* watch —
   * and a document switch is precisely `stop()` then `start()` with a DIFFERENT host
   * (`readerPane.select()` / `appShell.selectFolderFile`). That timer would put **file A's text
   * into file B's reader**: the cross-feed bug 4.3 proved and fixed at the detector level,
   * reappearing at the controller level. Cancel the timer, not just the intent.
   */
  function cancelPending(): void {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    pendingText = null;
    // D-11: a DEFERRED pending text is dropped by exactly the same teardown, for exactly the same
    // reason — and the flag has to go with it, or a later diff exit on the NEW document would
    // fire the "changed again" line about a change that happened in the OLD one.
    pendingSetByDefer = false;
  }

  /** Stop without going through the WatchTarget surface, so the dead-read path and an explicit
   *  user stop share one teardown and cannot drift apart. */
  function stopSelf(): void {
    if (!running) return;
    running = false;
    host = null;
    consecutiveFailures = 0;
    cancelPending();
    // D-11: the exit watcher belongs to the host this watch was rendering into, so it goes when
    // the watch does. A surviving observer would call `onDiffExited` for a host nobody is watching.
    diffObserver?.disconnect();
    diffObserver = null;
    readyAt = 0;
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
    setWatchNote(DEAD_READ_NOTE);
  }

  /**
   * Re-render NOW, and set the cooldown from what that render actually cost.
   *
   * The whole synchronous block is timed, not just `render()`: reading the scroll geometry forces
   * layout and the signal touches the DOM, and it is the block as a whole — start to return — that
   * the main thread cannot do anything else during. `followToBottom`'s rAF corrections are
   * deliberately OUTSIDE it: they run on later frames and are not part of the block.
   */
  function renderNow(text: string, target: HTMLElement): void {
    const started = now();

    // THE OUTGOING SOURCE, read BEFORE render() overwrites the reader-source WeakMap with `text`
    // (D-1 — a READ; the value already exists, mount() stashed it on the last render). This is a
    // WeakMap.get, negligible against the render it precedes; the actual capture WRITE is issued
    // below, after `readyAt`, so it never inflates the cost-proportional cooldown.
    const outgoing = readerSourceFor(target);

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

    // The signal fires on EVERY RENDER — once per visible update, so a coalesced burst flashes
    // once (DECISION 3). The follow fires only when they were tailing (DECISION 1).
    signal(target);

    // FROM THE END, NOT THE START. See DECISION 3: measuring from the start would leave no gap.
    readyAt = now();
    readyAt += (readyAt - started) * COOLDOWN_MULTIPLIER;

    if (wasAtBottom) followToBottom(scroller);

    // CAPTURE (task 1.4, §1.1) — OUTSIDE the timed block above and fire-and-forget. An awaited write
    // would inflate `readyAt` and the cooldown with it; a rejection is swallowed to the designed
    // state (§4: a failed snapshot completes the re-render normally). `docId != null` is the
    // app-page-only guard (§3.2); the D-5 normalise equality means a pure CRLF↔LF change stores
    // nothing (`changeDetector.ts` is untouched — the cost lands here, at capture).
    //
    // `getCaptureFlag()` is the D-12 off-switch (task 1.5), read HERE at RENDER TIME (not at
    // controller construction) so toggling capture off in the storage panel stops capture on the
    // NEXT render. It is the synchronous mirror of the persisted `'capture'` settings row (a
    // module-level cache in `captureFlag.ts`, loaded + written by `appShell`); replacing the
    // former defaulted-ON const with this read is the whole of Piece 5. On the content-script
    // surface `docId` is null, so capture is off there regardless of the flag (§3.2 unchanged).
    if (
      getCaptureFlag() &&
      docId != null &&
      outgoing != null &&
      normalise(outgoing) !== normalise(text)
    ) {
      void storeSnapshot(docId, outgoing);
    }
  }

  /** The cooldown expired (or the timer fired early): render whatever is pending, if anything. */
  function flushPending(): void {
    pendingTimer = null;
    const target = host;
    if (!running || !target || pendingText === null) return;
    // D-11 (DECISION 4), AND IT IS NOT COVERED BY `onText`'s CONDITION. A cooldown timer armed
    // moments BEFORE the diff opened is still in flight when it does, and letting it fire would
    // replace the comparison underneath the reader — the precise thing the deferral exists to
    // prevent, arriving by the one path that does not go through `onText`. So the pending text
    // CONVERTS: the timer is already cleared above, the text stays in the single slot, and it is
    // re-labelled as deferred so the exit flushes it and accounts for it.
    if (diffDisplayed(target)) {
      pendingSetByDefer = true;
      return;
    }
    // A timer may fire fractionally early (clamping, a coarse clock, a busy main thread). Then the
    // cooldown has NOT actually elapsed, so re-arm for the remainder rather than rendering early —
    // the cooldown is defined by the clock, not by whenever the timer happened to run.
    const remaining = readyAt - now();
    if (remaining > 0) {
      pendingTimer = setTimeout(flushPending, remaining);
      return;
    }
    const text = pendingText;
    pendingText = null;
    renderNow(text, target);
  }

  function onText(text: string): void {
    const target = host;
    if (!running || !target) return;
    consecutiveFailures = 0; // a good read clears the streak; only CONSECUTIVE failures count

    // D-11 (DECISION 4) — THE WHOLE OF THE DEFERRAL, and it is one condition. A diff is on screen,
    // so nothing renders: no render, no timer, no signal. The text takes the coalescer's single
    // pending slot (newest wins, exactly as during a cooldown) and `onDiffExited` releases it when
    // D-15's attribute goes away. No timer is armed on purpose — there is no time at which this
    // becomes renderable, only a gesture, so a timer would be a promise about a clock that has
    // nothing to do with it. `cancelPending` drops both the text and the defer flag on every
    // teardown, so a document switch during a displayed diff loses this text exactly as it loses
    // a cooldown-pending one — 4.3's cross-feed bug does not reappear one level up.
    if (diffDisplayed(target)) {
      pendingText = text;
      pendingSetByDefer = true;
      return;
    }

    const wait = readyAt - now();
    if (wait <= 0 && pendingTimer === null) {
      renderNow(text, target);
      return;
    }

    // COALESCE, DO NOT QUEUE (DECISION 3). One slot, and the newest text takes it — the older
    // pending text is DROPPED, unrendered, because nobody wants to watch a file's intermediate
    // states scroll past. The existing timer is left alone: it is already aimed at `readyAt`, and
    // re-arming it on every change would be a trailing debounce, which STARVES against an agent
    // that never stops writing (5.2's recorded rejection).
    pendingText = text;
    if (pendingTimer === null) pendingTimer = setTimeout(flushPending, wait);
  }

  return {
    start(next) {
      if (running) return;
      running = true;
      host = next;
      consecutiveFailures = 0;
      // D-11: the exit watcher is installed with the host, before anything can be deferred into it.
      installDiffObserver(next);
      // THE FIRST RENDER OF A WATCH IS IMMEDIATE: there is no prior cost to be proportional to, so
      // there is nothing to make the user wait for. This also clears any cooldown left over from a
      // watch on a DIFFERENT document — the previous file's render cost says nothing about this
      // one, and `cancelPending` guarantees no timer from it survives either.
      readyAt = 0;
      cancelPending();
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
