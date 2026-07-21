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
//   • `watchRelay.registerWatchDetector` / `getWatchDetector` initially kept their names and
//     signatures and delegated into this module, adapting the bare `ChangeDetector` they received
//     into a WatchTarget.
//
// ── THOSE DELEGATES WERE DELETED AT 4.8. THIS IS NOW THE ONLY WAY IN. ────────────────────────
//
// The adapter WAS the defect 7.1 found: a bare `ChangeDetector` has nowhere to render TO, so the
// WatchTarget it synthesized called `detector.start(() => {})` — the content-script `file://`
// surface detected every change and rendered none of them, and passed no `onError`, so a deleted
// file failed silently and forever. `registerWatchDetector`, `getWatchDetector` and
// `resetWatchDetectorForTest` are GONE (the first had one caller, now `installContentWatch`; the
// other two had no callers anywhere, including tests). D-E's delegate precedent did not apply —
// no remaining call sites, no compat obligation, and the thing being delegated cannot be built
// correctly at all. `src/watch/contentWatch.test.ts` pins the replacement rule: every production
// `registerWatchTarget(...)` call site builds its target with `createWatchController`.
//
// So there is exactly ONE piece of module state for the context's watch, under ONE name, and the
// entrypoint that registers a target and the control that starts it are talking about the same
// object — which is the property a second registry would have quietly broken.

/**
 * What the control drives. Deliberately WIDER than `ChangeDetector`'s `start`/`stop`:
 *
 *  - `start` takes the HOST, because starting a watch is a statement about a specific rendered
 *    reader — 4.2's controller re-mounts into exactly that host, and 4.3 stops the watch when a
 *    different document takes the host over.
 *  - `isWatching` exists because the control is rebuilt mid-watch and must render the CURRENT
 *    state rather than assume "off" (the re-render case again).
 *
 * Every production registration builds this with `createWatchController` (pinned by
 * `contentWatch.test.ts` since 4.8). Nothing above this seam can tell which controller it holds —
 * the app page and the content script register into the same slot, last one wins.
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

// --- the designed explanation (tasks 4.3 + 4.4) --------------------------------------
//
// One channel serves both honesty cases, because they are the same case from the user's side —
// "watching is not happening, and here is why in plain language":
//   • 4.3, a watch that DIED: the file stopped being readable (moved, renamed, deleted, permission
//     revoked, or task 1.2's dead observation). The watch stops; the last good render stays on
//     screen (AGENTS.md #5 — never blank, and never a silent failure either).
//   • 4.4, a watch that could never START on this surface: Firefox's file-input app-page route and
//     its content-script `file://` reader (decisions.md 2026-07-19).
//
// It is deliberately NOT a disabled control and NOT a dead toggle (spec §4 Degradation): a user who
// is told nothing assumes a bug, and a user given a greyed-out button assumes they did something
// wrong. They are told what happened and why.

/** The plain-language explanation currently in force, or null when watching is simply normal. */
let note: string | null = null;

/**
 * Set (or clear, with null) the designed explanation. Notifies immediately, so the note appears
 * WITHOUT a re-render — which is the load-bearing part on 4.3's path: the whole point is that the
 * last good render stays exactly where it is while the explanation arrives beside it.
 */
export function setWatchNote(next: string | null): void {
  note = next;
  notifyWatchChanged();
}

/** The current explanation, or null. */
export function watchNote(): string | null {
  return note;
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
  note = null;
  listeners.clear();
}

/**
 * Stop whatever watch is running in this context, if any (task 4.3).
 *
 * THE APP PAGE CALLS THIS ON EVERY DOCUMENT SWITCH, and it prevents a real bug rather than an edge
 * case: `readerPane.select()` re-mounts the SHARED host with a different file, so a watch left
 * running would keep feeding the OLD file's content into the NEW document's reader — the reader
 * would silently show file A's text under file B's name. Closing the tab ends a watch by
 * construction (§1.2); switching documents does not, so it is done explicitly here.
 */
export function stopWatch(): void {
  target?.stop();
}

/**
 * Drop the registered target entirely — this surface can no longer watch (task 4.4).
 *
 * Distinct from {@link stopWatch}, and the difference is what the user sees: `stopWatch` leaves the
 * toggle in place because watching is still POSSIBLE and simply is not running; this removes it,
 * so `buildWatchChrome` renders the explanation ALONE. The app page calls it when a selected file
 * came from a route that cannot re-read (Firefox's picker), where offering a toggle would be a
 * promise the surface cannot keep.
 */
export function resetWatchTarget(): void {
  target?.stop();
  target = null;
  notifyWatchChanged();
}
