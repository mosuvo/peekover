// contentWatch — the content script's ENTIRE watch wiring, in one importable function
// (spec 005 task 4.8).
//
// ── WHY THIS MODULE EXISTS, AND IT IS NOT TIDINESS ───────────────────────────────────────────
//
// This wiring lived inline in `entrypoints/peekover.content.ts`, and it shipped BROKEN: the
// registered target's `start()` called `detector.start(() => {})` — an EMPTY callback — so a
// change on the `file://` surface was detected, relayed, read, compared... and rendered nowhere.
// Task 4.1 wrote that adapter deliberately and said so ("4.2 registers the real controller into
// the SAME slot, at which point this adapter is simply replaced"); 4.2 then replaced it in
// `appShell.ts` ONLY. The content script kept the placeholder for the rest of the milestone, and
// 4.6 restated the mechanism verbatim as evidence for a different argument without anyone
// connecting it to "so watch does nothing there". A human found it at the 7.1 gate.
//
// **No test could see it, and that is the part worth fixing.** A WXT entrypoint imports the
// virtual `#imports` module, so no unit or browser test can load `peekover.content.ts` at all —
// its contents are, structurally, unreachable by the suite. Everything it wires is therefore
// exactly as trustworthy as a code review, which is how three separate instances of the same
// class shipped in this milestone (`observerDetector` imported by nothing, the pill missing on
// the first file opened, and this).
//
// So the fix for the CLASS is to stop putting logic where tests cannot reach: this module takes
// everything the entrypoint used to decide and do, and leaves the entrypoint holding only the
// three values that are genuinely WXT/engine-bound and cannot be anything else —
// `location.href`, `browser.runtime.sendMessage`, and the build-time `import.meta.env.FIREFOX`.
// It is the same move `runReader.ts` made for the render path ("extracted from here so they are
// unit-testable; the entrypoint only wires WXT's config to runReader()") and the same one 4.7
// made with `detectorForFile.ts`.
//
// ── WHY NOT IN `watchRelay.ts`, WHICH ALREADY HELD THE PLACEHOLDER ──────────────────────────
//
// Because `entrypoints/background.ts` imports `watchRelay` for `createWatchListener`, and a real
// controller means importing `watchController` → `mount` → the whole render pipeline. Putting
// that import in `watchRelay.ts` would hang the reader's parse/sanitize/highlight chain off the
// SERVICE WORKER's module graph and make `watchRelay.test.ts` (node, no DOM) depend on the DOM.
// `watchRelay` states its zero-dependency posture in its own header and it is load-bearing;
// this module is where the DOM-ward dependencies belong, and nothing in the background imports it.
//
// ── SEQUENCING: THE HOST DOES NOT EXIST YET, AND THE CONTROLLER DOES NOT NEED IT ────────────
//
// This runs at `document_start`, where there is no `<peekover-root>` and no shadow root — the
// reader is mounted later by `runReader()` at DOMContentLoaded. That is not a problem to work
// around: `WatchTarget.start(host)` takes the host as an ARGUMENT (`watchRegistry.ts`), and the
// host it is given is the one the WATCH PILL was built for — the pill is rebuilt by every
// `mount()` and passes its own host at click time (`watchControl.ts`). So the controller is
// constructed host-free, exactly as `appShell.installWatchForFile` constructs it before
// `selectFile()` mounts anything. Registering EARLY is not merely safe here, it is required:
// `buildWatchControl` decides at MOUNT time whether a pill exists at all, so a target registered
// after the first mount would leave that first render with no control — the second defect 4.7
// found on the app page, and the reason this call stays where the entrypoint always made it.

import { pollingDetector } from './changeDetector';
import { createWatchController } from './watchController';
import { registerWatchTarget, setWatchNote } from './watchRegistry';
import { watchCapability } from './watchAvailability';
import {
  WATCH_INTERVAL_MS,
  isWatchableFileUrl,
  relayRead,
  type WatchMessenger,
} from './watchRelay';

export interface ContentWatchOptions {
  /** The document's own URL. `location.href` in production. */
  url: string;
  /** The transport `relayRead` asks the background through. `browser.runtime.sendMessage`. */
  send: WatchMessenger;
  /**
   * Can the BACKGROUND read `file://` on this build? `!import.meta.env.FIREFOX` in production —
   * a BUILD-TIME constant, never a runtime engine sniff, and passed in as a plain boolean so this
   * module (like `watchCapability` itself) stays free of `import.meta`. 2.3 measured the Firefox
   * answer and it was negative; see `watchAvailability.ts`.
   */
  backgroundCanReadFileUrls: boolean;
  /** Poll interval. Defaults to the shipped {@link WATCH_INTERVAL_MS}; injected only so a test
   *  can drive several ticks without waiting several seconds (the `detectorForFile` precedent). */
  intervalMs?: number;
}

/**
 * Decide whether this content-script surface can watch, and — when it can — build the detector,
 * build the REAL controller and register it as the context's one {@link WatchTarget}.
 *
 * Registers nothing on a surface that cannot watch (Firefox's `file://` reader, and the remote
 * raw hosts that are out of 005's scope), setting the designed explanation instead: no toggle at
 * all beats a toggle that cannot keep its promise (spec §4 Degradation).
 *
 * **Starts nothing.** Watching is a user gesture on the pill (spec §4 Trust); this only makes it
 * possible.
 */
export function installContentWatch(options: ContentWatchOptions): void {
  const { url, send, backgroundCanReadFileUrls, intervalMs = WATCH_INTERVAL_MS } = options;

  const decision = watchCapability({
    surface: 'content-script',
    backgroundCanReadFileUrls,
    // Gate on the RELAY's own predicate — the authority on what the background will read — so a
    // remote raw view gets the scope note and registers NO detector, rather than a live-looking
    // control the relay refuses every tick.
    documentIsWatchableFile: isWatchableFileUrl(url),
  });

  if (!decision.watchable) {
    setWatchNote(decision.note);
    return;
  }

  // `pollingDetector` is the right implementation for this surface on BOTH engines and is not a
  // Firefox fallback: `FileSystemObserver.observe()` takes a `FileSystemHandle`, and a content
  // script has only a URL with no URL→handle API anywhere (plan §1.1). The event-driven path is
  // the APP PAGE's, and only the app page's — 4.7 made the 2×2 real, it did not collapse it.
  const detector = pollingDetector(relayRead(url, send), intervalMs);

  // THE REAL CONTROLLER, and `contained: false` because this surface IS the page: `:host` is the
  // fixed, inset:0 takeover that scrolls (`resolveScrollContainer`), unlike the app page's pane.
  // The controller also owns `DEAD_AFTER_FAILURES` and passes its own `onError` into the detector,
  // which is what gives this surface a dead-read state at all — the placeholder passed none, so a
  // file deleted while watched here failed silently and forever.
  // `docId: null` — the content script has no `folderId`, so it constructs no snapshot identity and
  // captures nothing (§3.2). This null is the enforcement that keeps capture off this surface.
  registerWatchTarget(createWatchController({ detector, contained: false, docId: null }));
}
