// watchRegistry — the ONE module-level register-once holder for this context's watch, and the
// seam the rebuilt-every-mount control reaches start/stop through (task 4.1, decision D-A).
//
// ── WHY A REGISTRY AND NOT A CLOSURE — this is the whole point of task 4.1 ───────────────────
//
// `mount()` rebuilds its chrome on EVERY render (`replaceChildren` drops the previous control),
// but the thing being controlled — the detector, and from 4.2 the controller — is built ONCE per
// context, by the entrypoint, long before any control exists. So a control that captured a
// controller reference in its click closure would work exactly once: the first watch-driven
// re-render replaces the button, and the new button's closure is built by a `mount()` that has no
// controller to capture. The watch would silently stop being stoppable.
//
// That is not a hypothetical — it is the SAME shape 004's theme control hit (`registerThemeSaveSink`,
// D-A), and it is sharpened here because watch mode is precisely the feature whose success CAUSES
// the re-render that would destroy the closure. The control therefore holds NOTHING; it asks this
// module at click time.
//
// ── HOW THIS SUBSUMES 2.2's HOLDER RATHER THAN SITTING BESIDE IT ─────────────────────────────
//
// Task 2.2 built `registerWatchDetector` / `getWatchDetector` in `watchRelay.ts` because its wiring
// had to put the constructed detector somewhere reachable, and it FLAGGED (tasks.md 2.2, final
// paragraph) that 4.1 "should extend or subsume it, not invent a second registry beside it".
//
// This module is that subsumption, and it uses the precedent already in the codebase: when group 6
// of 004 needed the theme-only save seam for the TOC as well, it did NOT add a second seam — it
// generalized the mechanism into `settingsSeam.ts` and left `registerThemeSaveSink` as a one-line
// DELEGATE (`themeControl.ts`, decision D-E). Same move here:
//
//   • the single holder lives HERE, and holds a WatchTarget (the richer shape the control needs);
//   • `watchRelay.registerWatchDetector` / `getWatchDetector` keep their names, their signatures
//     and their call sites (`entrypoints/peekover.content.ts` is unchanged), and now delegate into
//     this module, adapting the bare `ChangeDetector` they receive into a WatchTarget.
//
// So there is exactly ONE piece of module state for the context's watch, reachable under two
// names, and the entrypoint that registers a detector and the control that starts it are talking
// about the same object — which is the property a second registry would have quietly broken.

/**
 * What the control drives. Deliberately WIDER than `ChangeDetector`'s `start`/`stop`:
 *
 *  - `start` takes the HOST, because starting a watch is a statement about a specific rendered
 *    reader — 4.2's controller re-mounts into exactly that host, and 4.3 stops the watch when a
 *    different document takes the host over.
 *  - `isWatching` exists because the control is rebuilt mid-watch and must render the CURRENT
 *    state rather than assume "off" (the re-render case again).
 *
 * 4.1 registers a thin detector-backed target through `watchRelay`'s delegate; 4.2 registers the
 * full controller into the same slot. Nothing above this seam can tell which one it holds.
 */
export interface WatchTarget {
  /** Begin watching, rendering updates into `host`. A no-op if already watching. */
  start(host: HTMLElement): void;
  /** Stop watching. Idempotent. */
  stop(): void;
  /** Is a watch currently running? */
  isWatching(): boolean;
}

/** The context's watch target, or null in a context that never built one (a focused test, a
 *  surface with no watchable file). A null target is not an error — see `watchAvailable`. */
let target: WatchTarget | null = null;

/** Listeners re-labelling live controls when the watch state changes from ANYWHERE — a click, or
 *  4.2/4.3 stopping the watch itself on a dead read or a document switch. Module-level and
 *  append-only for the context's life: the control does NOT subscribe per instance (that would
 *  leak one listener per re-render); `watchControl.ts` subscribes ONCE and syncs a pruned set. */
const listeners = new Set<() => void>();

/**
 * Register this context's watch target. Called ONCE per context by whoever built it — the content
 * script at `document_start` (via `registerWatchDetector`), the app page when a file is opened.
 * Last registration wins, which is what lets 4.2's controller replace 4.1's detector-backed target
 * in the same slot rather than racing it.
 */
export function registerWatchTarget(next: WatchTarget): void {
  target = next;
  notifyWatchChanged();
}

/** The registered target, or null. The control asks for this at CLICK time, never at build time. */
export function getWatchTarget(): WatchTarget | null {
  return target;
}

/**
 * Can this surface watch at all? False in a context that registered nothing — which is the honest
 * state for the Firefox surfaces task 4.4 covers, and for any reader mounted over a document with
 * no file behind it. The control renders its EXPLANATION state rather than a dead button (4.4);
 * it never renders a control that looks live and does nothing.
 */
export function watchAvailable(): boolean {
  return target !== null;
}

/** Is the context's watch running right now? False when nothing is registered. */
export function isWatching(): boolean {
  return target?.isWatching() ?? false;
}

/** Subscribe to watch-state changes. Called ONCE by `watchControl.ts` (see `listeners`). */
export function onWatchChanged(listener: () => void): void {
  listeners.add(listener);
}

/** Announce a state change. Called by the registry's own mutators AND by the target itself when
 *  it stops on its own (4.3's dead read / document switch), so the control can never be left
 *  showing "watching" over a watch that has died. */
export function notifyWatchChanged(): void {
  for (const listener of listeners) listener();
}

/** Test-only: forget the registered target and every listener, so suites do not leak one into
 *  another (the `resetThemeControlsForTest` / `resetSettingsSeamForTest` precedent). */
export function resetWatchRegistryForTest(): void {
  target = null;
  listeners.clear();
}
