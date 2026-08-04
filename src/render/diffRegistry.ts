// diffRegistry — the ONE module-level register-once holder for THIS context's diff context, and
// the surface signal D-3 (task 3.1) and D-14 (task 6.2) both read to decide whether a diff exists
// to offer here at all (plan §1.4).
//
// ── WHY THIS EXISTS NOW, EMPTY, AHEAD OF THE ENGINE (5.1) AND THE VIEW (6.1) ──────────────────
//
// A SIBLING of `watchRegistry.ts`, built to the same register-once precedent and inheriting the
// same rebuilt-every-mount rule: `mount()` rebuilds its chrome on EVERY render, so the affordance
// that offers a diff (6.2) must ask THIS module at render time rather than capture a reference that
// the next re-render would strand. The holder holds NOTHING that outlives its registration.
//
// It is set here, before there is any diff to run, because two LATER tasks READ its emptiness as a
// gate and so need it to already exist:
//   • D-3 (task 3.1) suppresses the persistent capture disclosure on a surface that registered no
//     diff context — the honest signal that nothing here was ever captured to diff.
//   • D-14 (task 6.2) grows the diff affordance ONLY where a context is registered: "a surface that
//     registered no diff target grows no diff chrome at all" (decisions.md, D-14).
// Both gate on {@link isDiffContextRegistered}, which returns the boolean directly so neither has to
// dereference a nullable context.
//
// ── THE M5 SEAM RULE IS LOAD-BEARING HERE ────────────────────────────────────────────────────
//
// "Built, tested, and wired to nothing" was M5's recurring defect: a watch test that called
// `registerWatchTarget(...)` itself before mounting proved nothing about which target PRODUCTION
// registers. This second registry inherits that obligation exactly: the ONLY production path that
// registers a diff context is `appShell.installWatchForFile` (the app page, gated on `docId != null`
// like 1.4's capture gate). The content-script graph (`contentWatch.ts`) imports NO symbol from this
// module and so registers nothing — that ABSENCE is an architectural fact its production-path test
// pins by driving `installContentWatch` and observing the registry stay empty, never by hand-calling
// `registerDiffContext`.
//
// ── DATA ONLY — NO ENGINE, NO VIEW, NO `diff` DEPENDENCY ──────────────────────────────────────
//
// This module holds the DATA a diff needs (a docId, a current-source getter, snapshot fetch
// closures) and imports only a TYPE. It carries no UI and not the `diff` package — so it is safe to
// import from BOTH surfaces. The import-fence that keeps the actual `diff` dependency off the
// content-script graph is 5.1's job; 2.1 only sets the empty registry the affordance side of that
// fence reads.
//
// ── 6.2: THE CONTEXT ALSO CARRIES THE *CAPABILITY*, AS PROVISIONED CLOSURES ────────────────────
//
// This is still DATA ONLY, and that is precisely why the capability arrives this way. Plan §1.4
// fences THREE modules off the content-script graph — `diff` (the package), `diffEngine.ts` (its
// only importer) AND `diffView.ts` ("Imported by `appShell.ts`, never by `mount.ts` — `mount.ts`
// importing it would drag the view into the content-script graph and put the hole back in the
// fence it is the point of §1.4 to close"). The affordance (`diffChrome.ts`) IS imported by
// `mount.ts`, so it can import none of the three. It therefore reaches all of them through
// {@link DiffContext.showDiff} / {@link DiffContext.hideDiff} — closures the APP PAGE provisions at
// `appShell.installWatchForFile`, in a graph `mount.ts` never reaches.
//
// The closures are deliberately COARSE ("show a diff of these two texts on this host"), not a
// `computeDiff` + `enterDiff` pair. A finer seam would have to carry the hunk shape across the
// fence, which means re-declaring `DiffHunk` here for no benefit — the affordance does nothing
// with hunks but hand them straight on. One capability in, one result out; the hunks never cross.
//
// {@link DiffOutcome} mirrors `diffView.ts`'s `DiffEnterResult` STRUCTURALLY rather than importing
// it, for the reason 6.1's header already records: the import fence is a SOURCE-TEXT scanner, so
// even a zero-runtime `import type … from './diffView'` would read as an importer of the view. The
// provisioning site in `appShell.ts` assigns the real `enterDiff` to this field, so `tsc --noEmit`
// catches any drift between the two declarations — the same drift guard 6.1's mirror relies on.
//
// ── 008 D-3: A SECOND, OPTIONAL CAPABILITY PAIR — THE SAME MOVE, A SECOND TIME ─────────────────
//
// {@link DiffContext.fetchFiles} / {@link DiffContext.fetchFileText} widen the comparison target
// from "this document's own history" to "another file in this folder". THE REASONING IS NOT
// RE-DERIVED: the 6.2 amendment directly above is the precedent, and it already argued why a
// capability arrives here as PROVISIONED CLOSURES — this module is data only and sits on BOTH
// graphs, so the side that holds the folder list (the app page) hands the capability across, and
// the affordance calls it without importing anything the fence keeps out.
//
// Both members are OPTIONAL, which is what makes this additive rather than a reshape: every
// existing `createDiffContext` call site and every existing test fake stays valid untouched, and a
// context with snapshots but NO folder list is a legal, designed state (the `AppStore`
// optional-reader discipline, `appShell.ts:150-158`).
//
// THE DISCRIMINANT IS NOT HERE. Which kind a chosen row is lives on the ROW (`dataset.targetKind`,
// D-4) — the only place that needs it. This context carries two INDEPENDENT capabilities, never a
// tagged union: a union would push a `kind` through both closures to reach one branch.

import type { SnapshotMetaEntry } from '../app/snapshots';

/**
 * The result of asking for a diff — a STRUCTURAL MIRROR of `DiffEnterResult` in `./diffView` (see
 * the header for why it is mirrored rather than imported). On failure `reason` is human-readable,
 * for the affordance to surface beside the untouched document (the fallback, plan §1.5): the
 * document stays on screen, `data-diff` is never set, never blank (AGENTS.md #5).
 */
export type DiffOutcome = { ok: true } | { ok: false; reason: string };

/**
 * One OTHER file offered as a comparison target (D-3) — the narrowest shape the picker needs: a
 * `path` to hand back to {@link DiffContext.fetchFileText}, and a `name` to put in the row's text.
 *
 * Deliberately NOT `MarkdownFile` (`../app/folderSource`), of which this is a structural subset so
 * a filtered `activeSource.files` is assignable with no adapter. Declaring the narrow shape here
 * keeps `read()` out of the affordance's reach — text arrives ONLY through the provisioned
 * closure — and keeps this module's type-only edge list where it is.
 */
export interface DiffFileEntry {
  /** Slash-separated path from the folder root — the key {@link DiffContext.fetchFileText} takes. */
  path: string;
  /** The file's own name, e.g. `intro.md`, for the row's text. */
  name: string;
}

/**
 * The DATA a diff needs about the document on screen — never any UI, never an engine. Assembled by
 * the app page's install site ({@link appShell}'s `installWatchForFile`) from 1.3's reader-source
 * getter and 1.4's snapshot store, and held here for the affordance (6.2) and view (6.1) to read.
 *
 * The closures capture their source functions; the SHAPE is registry-local (declared here, imported
 * from nowhere) so this module stays a pure holder.
 */
export interface DiffContext {
  /** The document identity `folderId + SEP + path` (1.4). String, not nullable — the registration
   *  itself is gated on `docId != null` at the caller, mirroring 1.4's capture gate. */
  docId: string;
  /** The source currently displayed for this document, or `undefined` when the host was never seen
   *  (1.3's `readerSourceFor` preserves the "never registered" case rather than faking an empty
   *  document). A closure over `readerSourceFor(host)`. */
  getCurrentSource(): string | undefined;
  /** This document's snapshot meta entries — meta ONLY (D-4), an empty array when none exist. A
   *  closure over `getSnapshotMeta` (1.4), filtered to this `docId`. */
  fetchMeta(): Promise<SnapshotMetaEntry[]>;
  /** One snapshot's text by id, or `undefined` when the content row is gone (§1.2's designed
   *  self-reclaim window — the diff view's "comparison unavailable" state). A closure over
   *  `getSnapshotText` (1.4). */
  fetchText(snapshotId: string): Promise<string | undefined>;
  /** Diff `before` against `after` and show it on `host` — the whole capability behind ONE closure
   *  (task 6.2). Provisioned by `appShell`, the only module that imports the engine AND the view;
   *  the affordance calls it without importing either (plan §1.4's fence — see the header). Returns
   *  `{ok:false, reason}` for the fallback path, having changed nothing on screen. */
  showDiff(host: HTMLElement, before: string, after: string): DiffOutcome;
  /** Leave the diff view on `host` and restore the reading place. A no-op when no diff is shown.
   *  Provisioned alongside {@link showDiff}, over the same fence, for the same reason. */
  hideDiff(host: HTMLElement): void;
  /** OPTIONAL (D-3) — the OTHER files in this folder that could be compared against, ABSENT on a
   *  surface that has no folder list at all. A closure over `activeSource.files` provisioned at the
   *  same install site, EXCLUDING the open document itself: "another file", never one that would
   *  offer an always-empty diff against itself. Empty array when the folder holds no other
   *  markdown — the picker says so rather than listing nothing. */
  fetchFiles?(): Promise<DiffFileEntry[]>;
  /** OPTIONAL (D-3) — one other file's text by {@link DiffFileEntry.path}, or `undefined` when it
   *  cannot be read, which lands in the SAME fallback as a missing snapshot: the document stays on
   *  screen and the diff is never entered. A FRESH read of that entry, never a stored copy.
   *  Provisioned alongside {@link fetchFiles} and absent whenever it is. */
  fetchFileText?(path: string): Promise<string | undefined>;
}

/**
 * Build a {@link DiffContext} from its parts — the identity-map factory D-2 (task 4.1) adds so
 * that `registerDiffContext(createDiffContext(...))` has the SAME `registerX(createY(...))` shape
 * as `registerWatchTarget(createWatchController(...))`. It exists for the SEAM PIN, not for
 * behaviour: the shared call-site-scoped helper (tests/util/seamPin.ts) can then enforce, uniformly
 * across BOTH registries, that every production registration's argument is built by its factory —
 * the check a file-scoped matcher cannot make once two registrations sit side by side in one file
 * (appShell.installWatchForFile, after 2.1). Trivial today (it returns its config unchanged); the
 * value is that it establishes the seam a second registry consumer must pass through.
 */
export function createDiffContext(config: {
  docId: string;
  getCurrentSource(): string | undefined;
  fetchMeta(): Promise<SnapshotMetaEntry[]>;
  fetchText(snapshotId: string): Promise<string | undefined>;
  showDiff(host: HTMLElement, before: string, after: string): DiffOutcome;
  hideDiff(host: HTMLElement): void;
  // OPTIONAL, mirroring {@link DiffContext} — a caller that provisions the D-3 pair passes it
  // through the same factory, and one that does not is unchanged and still type-checks.
  fetchFiles?(): Promise<DiffFileEntry[]>;
  fetchFileText?(path: string): Promise<string | undefined>;
}): DiffContext {
  return config;
}

/** The context's diff context, or null in a context that registered none (the content script, a
 *  focused test, an app-page surface that cannot watch). A null context is not an error — see
 *  {@link isDiffContextRegistered}. */
let context: DiffContext | null = null;

/**
 * Register this context's diff context. Called ONCE per file open by the production entry path
 * ({@link appShell}'s `installWatchForFile`, app page only). Last registration wins, mirroring
 * `registerWatchTarget`: the next file open OVERWRITES rather than races, and a stale context is
 * harmless because its consumers gate on presence, not liveness — `fetchMeta` over a stale `docId`
 * simply returns `[]`.
 */
export function registerDiffContext(next: DiffContext): void {
  context = next;
}

/** The registered diff context, or null. Read at render time by the affordance (6.2) and the view
 *  (6.1), never captured at build time. */
export function getDiffContext(): DiffContext | null {
  return context;
}

/**
 * Is a diff context registered on this surface? The cheap presence gate D-3 (task 3.1) and D-14
 * (task 6.2) both read — returning the boolean directly so callers never dereference the nullable
 * context. False on the content script (no import there), true on the app page once
 * `installWatchForFile` has run for a file with a `docId`.
 */
export function isDiffContextRegistered(): boolean {
  return context !== null;
}

/** Test-only: forget the registered context so suites do not leak one into another (the
 *  `resetWatchRegistryForTest` precedent). NOT called in production. */
export function resetDiffRegistryForTest(): void {
  context = null;
}
