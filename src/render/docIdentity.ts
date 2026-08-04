// docIdentity — the ONE module-level register-once holder for THIS context's document name, and
// the seam the agent-file badge (1.3) reads at build time to decide whether to exist at all
// (008 plan §1.1, D-1).
//
// ── WHY A REGISTRY AND NOT `MountOptions` — this is the whole of D-1 ──────────────────────────
//
// The THIRD instance of the register-once pattern, after `watchRegistry.ts` (005 D-A) and
// `diffRegistry.ts` (006 §1.4). It exists for the same reason both of those do, sharpened: the
// thing that consumes the name is rebuilt on EVERY render (`mount()`'s `replaceChildren` drops the
// previous chrome), while the name arrives ONCE per document open, from an entrypoint that runs
// long before any chrome exists.
//
// A name threaded through `MountOptions` instead would not survive a watch re-render on EITHER
// surface, and that — not tidiness — is what forced the seam (plan D-1):
//   • the app page re-renders through `renderWithDiagrams` (`appShell.ts:137-140`), a module-level
//     `const` with no file in scope, so it would have to close over app state — i.e. become
//     module-level state anyway, by a longer road;
//   • the content script's `contentWatch.ts:121` passes no `render` at all and gets bare `mount`,
//     so the name would be DROPPED outright — and dropped the first time an agent edits the file,
//     which is precisely the moment the badge is meant to be on screen.
//
// So the badge holds nothing. It asks THIS module at build time — the property `diffRegistry.ts:5-10`
// states for its own siblings: the affordance "must ask THIS module at render time rather than
// capture a reference that the next re-render would strand".
//
// ── LAST-WRITE-WINS, AND THERE IS NO UNREGISTER ──────────────────────────────────────────────
//
// `registerWatchTarget` and `registerDiffContext` both replace rather than race, and so does this.
// A stale name is not a hazard here the way a stale controller would be: the next document open
// OVERWRITES it before anything mounts, and the app page's `select(null)` path never mounts at all,
// so there is no render in which a stale name could be read. That is why this registry has no
// production reset — `resetWatchTarget`'s counterpart would answer a question ("this surface can no
// longer name its document") that nothing asks.
//
// ── DATA ONLY, AND THE IMPORT LIST IS EMPTY — THE PROPERTY THAT MAKES IT SAFE ON BOTH GRAPHS ──
//
// This module holds a STRING and imports NOTHING — not even a type. `diffRegistry.ts:32-38` makes
// the weaker version of this argument for itself ("holds the DATA … and imports only a TYPE …  so
// it is safe to import from BOTH surfaces"); with no import at all there is no edge for a future
// fence to have to reason about, which is what keeps this module from ever becoming a fence hazard
// on the content-script graph it is about to join. `docIdentity.test.ts` asserts that emptiness
// STRUCTURALLY, over the source text, because it is an architectural property and not a byte one:
// a type-only import would erase to zero bytes and still be an edge (007 §3.4's own reasoning).
//
// ── UNDEFINED, NOT NULL — the one place this diverges from its two siblings ───────────────────
//
// Both sibling registries hold an OBJECT and read as `T | null`, where `null` is a deliberate
// "empty" distinct from the declared-but-unassigned state, and both pair it with a presence
// predicate (`watchAvailable`, `isDiffContextRegistered`) that a consumer gates on. This holds a
// bare string and has NO presence predicate, because its one consumer (1.3's `buildAgentBadge`)
// gates on `isAgentFile(name)` — recognition, not presence — and an unrecognized name and an
// absent one produce the same `[]`. So there is one empty state rather than two, and `undefined`
// is it: the uninitialized value and the read result are the same value, with nothing to keep in
// step. Task 1.1's Verify pins this ("read-before-register returns undefined").

/** This context's document name, or `undefined` in a context that has registered none — a focused
 *  test, or any render reached before an entrypoint named the document. Absence is not an error:
 *  the badge's resting state is `[]` (D-2), so an unnamed document simply grows no badge. */
let name: string | undefined;

/**
 * Register this context's document name. Called ONCE per document open by the production entry
 * paths (task 1.4): the app page's `appShell.installWatchForFile`, beside `registerDiffContext`,
 * and the content script's `runReader`, after the renderable gate that already holds the URL.
 *
 * Last registration wins — the next open OVERWRITES rather than races, mirroring
 * `registerWatchTarget` and `registerDiffContext`. There is deliberately no unregister; see the
 * header.
 *
 * ★ Unlike the diff context, this is NOT gated on a folder id at its caller: a badge needs only a
 * basename, which `MarkdownFile.name` always carries, and gating it on `activeFolderId` would
 * silently drop the badge on any app-page open where no folder is active (plan D-1).
 */
export function registerDocIdentity(next: string): void {
  name = next;
}

/**
 * The registered document name, or `undefined`. Read at BUILD time by the badge (1.3), never
 * captured — a reference captured into a closure would be stranded by the next re-render, which is
 * the whole reason this module exists.
 */
export function getDocIdentity(): string | undefined {
  return name;
}

/** Test-only: forget the registered name so suites do not leak one into another (the
 *  `resetDiffRegistryForTest` / `resetWatchRegistryForTest` precedent). NOT called in production —
 *  and there is no production counterpart, deliberately (see the header). */
export function resetDocIdentityForTest(): void {
  name = undefined;
}
