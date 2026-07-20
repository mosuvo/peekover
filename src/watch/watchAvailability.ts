// watchAvailability — the PURE decision about whether watching can work here, and the plain
// language explaining it when it cannot (spec 005 task 4.4, spec §4 Degradation, §7-8).
//
// ══ THE PRECONDITION, AND ITS ANSWER ══════════════════════════════════════════════════════════
//
// Task 4.4 could not start until 2.3's question was answered and RECORDED. It is
// (`docs/ai/decisions.md`, 2026-07-19), and it took the NEGATIVE branch:
//
//   Chromium background `fetch("file:///…")` → `{status: 200, bytes: 845}`, fresh bytes.
//   Firefox 152                              → THREW: "Security Error: Content at
//                                              moz-extension://<id>/… may not load or link to
//                                              file:///…", then "NetworkError when attempting to
//                                              fetch resource."
//
// That is **Gecko's URI security policy, not a missing toggle or manifest key — no permission
// grants it.** Combined with task-0's finding that a content script cannot re-read its own file
// either, BOTH halves of the Firefox content-script route are closed. So this task covers TWO
// Firefox cases, not one:
//
//   (a) the app page opened via the FILE INPUT rather than by drag — permanently stale reads;
//   (b) the content-script `file://` reader — watching cannot work at all.
//
// ══ WHY THIS IS NOT ENGINE SNIFFING, STATED BECAUSE M2 SET THE OPPOSITE PRECEDENT ═════════════
//
// `firefoxFolderSource.ts` is explicit that "everything above the seam branches on `persistable`,
// never on the engine", and that rule is kept here. Two different things are being decided and
// each uses the honest signal for its own question:
//
//   • THE APP PAGE asks a question about the SOURCE, not the engine: were these files handed over
//     as live, re-readable handles, or as a frozen copy? That is answered by `persistable` plus
//     the ROUTE the folder arrived by — never by an engine check. A Chromium build taking a
//     degraded route degrades identically, which is the property engine-sniffing would lose.
//
//     **THE ROUTE IS LOAD-BEARING AND THE SEAM CANNOT SUPPLY IT.** `folderSourceFromFileList`
//     (picker) and `folderSourceFromDataTransfer` (drag) BOTH return `persistable: false` on
//     Firefox — measured by reading the seam, not assumed — so `persistable` alone cannot tell
//     the two apart. They differ in the one way that matters: on the DRAG path `File.text()`
//     reads FRESH BYTES from disk (task 1.1's header — metadata is frozen, content is not),
//     whereas the picker path is frozen through and through (~45 polls across a real on-disk
//     edit, nothing moved). `appShell` calls those two routes from two DISTINCT call sites, so it
//     knows which one it took and passes it in. Teaching `folderSource` a `watchable` bit would be
//     the tidier home for this and is the right 006 cleanup; it is out of 005's file fence.
//
//   • THE CONTENT SCRIPT asks a question about the ENGINE, because that is genuinely what varies:
//     whether this BUILD's background can read `file://` at all. It is a build-time constant for a
//     per-engine build, established by measurement at 2.3 and unchangeable at runtime — not a
//     capability that varies per document, per user, or per grant. Passing it in (rather than
//     reading `import.meta.env` here) keeps this module pure and `#imports`-free, exactly as
//     `changeDetector` and `watchRelay` are.
//
// ══ WHAT SHIPS IS AN EXPLANATION, NOT A DISABLED CONTROL ══════════════════════════════════════
//
// Spec §4 Degradation, and the same honesty posture M2 took for Firefox's read-only folder
// snapshot (`READ_ONLY_SNAPSHOT_NOTE`). A user told nothing assumes a bug; a user given a greyed-out
// button assumes they did something wrong. Both notes below therefore say WHAT is not happening,
// WHY, and — this is the part that makes them worth shipping — WHAT TO DO INSTEAD, because in both
// cases there genuinely is a working route the user can take.
//
// Whether the copy READS as honest rather than broken is human-gate 7.1, not a test.

/** Where the reader is running, and what it needs to know to answer the watch question. */
export type WatchSurface =
  | {
      surface: 'content-script';
      /** Can THIS BUILD's background read `file://` URLs? Chromium yes; Firefox no (2.3). */
      backgroundCanReadFileUrls: boolean;
    }
  | {
      surface: 'app-page';
      /** The seam's honesty bit: a live, re-openable handle (Chromium) vs a frozen snapshot. */
      persistable: boolean;
      /** How the folder arrived. Only `appShell` knows this — see the header. */
      route: 'drop' | 'picker';
    };

/** The answer: watch, or explain. Never "watch, but the button does nothing". */
export interface WatchDecision {
  watchable: boolean;
  /** Plain-language explanation, or null when watching simply works. */
  note: string | null;
}

/** (b) The Firefox content-script reader — a `file://` page opened from the file manager. */
export const FIREFOX_CONTENT_SCRIPT_NOTE =
  "Watching isn't available for files opened directly from your file manager in Firefox. " +
  'Firefox does not let extensions re-read a file:// page, so Peekover cannot see changes here. ' +
  "Open the file's folder in Peekover's app page instead — watching works there.";

/** (a) The Firefox app page, folder chosen through the file picker rather than dragged. */
export const FIREFOX_PICKER_NOTE =
  "Watching isn't available for folders opened with the file picker in Firefox — the browser " +
  'hands Peekover a frozen copy of each file, so later changes on disk never arrive. ' +
  'Drag the folder onto this page instead and watching will work.';

/**
 * PURE: can this surface watch, and if not, what should the user be told?
 *
 * Every branch is reachable and each has a test. The DEFAULT is watchable — a surface that can
 * re-read is the normal case, and the explanations are the exceptions.
 */
export function watchCapability(input: WatchSurface): WatchDecision {
  if (input.surface === 'content-script') {
    // Chromium: the background reads the file and relays it (task 2.2). Firefox: Gecko refuses,
    // and no permission changes that — so the honest answer is an explanation, not a toggle.
    return input.backgroundCanReadFileUrls
      ? { watchable: true, note: null }
      : { watchable: false, note: FIREFOX_CONTENT_SCRIPT_NOTE };
  }

  // App page. A live handle (Chromium, either route) always re-reads.
  if (input.persistable) return { watchable: true, note: null };

  // A frozen snapshot. The DRAG route still yields fresh BYTES from `File.text()` even though its
  // metadata never moves — which is exactly why task 1.1's detector compares CONTENT and not
  // metadata, and why this route is watchable at all.
  if (input.route === 'drop') return { watchable: true, note: null };

  // The picker route is frozen through and through. Nothing re-reads; say so, and point at the
  // route that works.
  return { watchable: false, note: FIREFOX_PICKER_NOTE };
}
