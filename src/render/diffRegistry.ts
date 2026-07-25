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

import type { SnapshotMetaEntry } from '../app/snapshots';

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
