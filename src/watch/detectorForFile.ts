// detectorForFile — THE FACTORY THAT CHOOSES A DETECTOR (spec 005 task 4.7, plan §1.1).
//
// `changeDetector.ts` says it in its own header: "every platform difference pushed up into the
// factory that CHOOSES a detector". Until 4.7 that factory did not exist. `observerDetector` was
// built (1.2), real-engine tested against a real `FileSystemObserver`, measured at 5.1 — and
// imported by NOTHING. Every shipped watch path polled at 1 Hz, so spec §4's
//
//     "While watching on Chromium ON THE APP PAGE, the system shall detect changes
//      WITHOUT POLLING"
//
// was FALSE in shipped code, and plan §1.1's 2×2 rested on it. This module is the wiring that
// makes it true. It is the only place in the product that decides between the two detectors.
//
// ── THE BRANCH IS A CAPABILITY CHECK, AND THAT IS NOT A STYLE PREFERENCE ─────────────────────
//
// `firefoxFolderSource.ts` set the standing rule for M2 and it is kept verbatim here:
// "everything above the seam branches on `persistable`, never on the engine". Same rule, same
// reason, one level down — the question asked below is
//
//     do I have a handle, and does this engine have an observer to point at it?
//
// and NEVER `import.meta.env.FIREFOX`. That matters for a reason an engine sniff would get
// wrong rather than merely for tidiness:
//
//   • Firefox reaches the fallback BY ABSENCE. Its picker route yields `File`s and its drag
//     route yields `FileSystemFileEntry` (the OLD Entries API — not a `FileSystemHandle` at
//     all), so `file.handle` is simply undefined and the first clause fails. No Firefox module
//     needed changing to make that happen, which is the property being claimed.
//   • A picker-disabled Chromium (Brave, a flag-gated build) has no handle either, and degrades
//     IDENTICALLY — the exact case `folderSource.isDirectoryPickerSupported`'s plan-gate ruling
//     already established, and the case an engine sniff would silently get wrong.
//   • HANDLE BUT NO OBSERVER falls back too. `observerDetector` would survive that on its own
//     (its ladder degrades to polling when `observe()` fails), but choosing polling UP FRONT
//     costs nothing, avoids a doomed `observe()` and a spurious degraded report, and keeps the
//     branch honest: it asks for BOTH halves of the capability it is about to use.
//
// ── WHAT THIS DOES NOT COLLAPSE ─────────────────────────────────────────────────────────────
//
// **The content script still polls, and that is correct** — it has only a URL, and there is no
// URL→handle API (plan §1.1, spec §3.2). It never calls this factory. 4.7 makes the 2×2 REAL;
// it does not reduce it to a per-engine split.

import { pollingDetector, type ChangeDetector } from './changeDetector';
import {
  observerDetector,
  globalObserverCtor,
  type DeadReason,
  type FileSystemObserverCtor,
} from './observerDetector';
import { WATCH_INTERVAL_MS } from './watchRelay';

/**
 * What the factory needs from a file: the reader every route has, and the handle only some
 * routes have. Structurally satisfied by `MarkdownFile` (`src/app/folderSource.ts`) — declared
 * as its own minimal shape so `src/watch/` keeps importing nothing from `src/app/`.
 */
export interface WatchableFile {
  /** Read the file's current text. Present on every route; the polled path's whole input. */
  read(): Promise<string>;
  /** The live handle, where the route has one. Absent ⇒ this file is polled. */
  handle?: FileSystemFileHandle;
}

export interface DetectorForFileOptions {
  /** Poll interval for the polled path. Defaults to the shipped {@link WATCH_INTERVAL_MS}. */
  intervalMs?: number;
  /**
   * `undefined` (the default) asks the ENGINE via `globalObserverCtor()`. `null` states "this
   * engine has no observer" explicitly — which is what lets a test exercise the
   * handle-but-no-observer fallback on Chromium, where the real constructor exists and cannot
   * be taken away. A constructor value is passed straight through to `observerDetector`.
   */
  observerCtor?: FileSystemObserverCtor | null;
  /** The observation is dead and the file is unreadable — 1.2's ladder, reported to the caller
   *  that owns the UI. Only ever fires on the observer path. */
  onDead?: (reason: DeadReason, detail: string) => void;
  /** Detection DEGRADED from events to polling but is still live (1.2's ladder). */
  onFallback?: (detail: string) => void;
}

/**
 * Choose and build the detector for `file`.
 *
 * Handle present AND an observer constructor available → {@link observerDetector} (event-driven,
 * no polling loop). Anything else → {@link pollingDetector} over `file.read()`, byte-for-byte the
 * behaviour every route had before 4.7.
 *
 * Both satisfy the same `ChangeDetector` seam, so `watchController` — and everything above it —
 * cannot tell which one it is holding. That is the seam's entire purpose and it is what makes
 * this a one-line change at the call site.
 */
export function detectorForFile(
  file: WatchableFile,
  options: DetectorForFileOptions = {},
): ChangeDetector {
  const { intervalMs = WATCH_INTERVAL_MS, onDead, onFallback } = options;
  // `undefined` means "ask the engine"; an explicit `null` means "there is none" (see the option).
  const ctor = options.observerCtor === undefined ? globalObserverCtor() : options.observerCtor;

  if (file.handle && ctor) {
    return observerDetector(file.handle, { observerCtor: ctor, onDead, onFallback });
  }
  return pollingDetector(() => file.read(), intervalMs);
}
