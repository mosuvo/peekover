// diagramCache — the diagram cache: D-3's KEY derivation and D-4's eviction PLANNING (task 4.1's
// PURE layer, below), plus the IndexedDB read/write layer that task 4.3 wires beneath the enhancer
// (the second half of this file). 4.1 stored nothing and was reached by nothing; 4.2 added the two
// stores; 4.3 is the irreducible commit that connects them and corrects every trust surface in the
// same breath (D-14).
//
// The pure/IDB split is `snapshots.ts`'s (plan §1.2): the key maths and the bounds maths are
// arithmetic and hashing over metadata, so they are testable in isolation in the fast unit
// project; the IDB read/write is a separate layer, exercised on real engines only.
//
// ── ★ THE SEAM: THIS MODULE IS APP-PAGE-ONLY, AND THE EDGE RUNS ONE WAY ───────────────────────
//
// This module imports `store.ts`. `store.ts` must NEVER import this module. That asymmetry is
// load-bearing rather than stylistic: the content script reaches `store.ts` (via `snapshots.ts` →
// `storeSnapshot`), so an edge in the other direction would put the whole cache — and, through the
// enhancer that calls it, a path toward the engine — onto the content-script graph. §3.2 keeps the
// enhancer app-page-only, so the ONLY importer of this module is `diagramEnhancer.ts`, which the
// content-script entry cannot reach. `diagramImportFence.test.ts` walks both graphs and is the
// structural gate on exactly this; the byte fence cannot see a type-only or tree-shaken edge.
//
// ── WHY THIS IS A SIBLING OF `planSnapshotWrite`, NOT A GENERALISATION (D-4) ──────────────────
//
// `planDiagramWrite` deliberately duplicates the SHAPE of `snapshots.ts:170-240` without sharing
// its code. This is not duplication-by-laziness — the two algorithms genuinely differ:
//
//   - `planSnapshotWrite`: one PER-DOCUMENT count sweep + two global sweeps, ordered on `ts`,
//     a creation timestamp, because a snapshot is a historical record whose age IS its meaning.
//   - `planDiagramWrite`: THREE GLOBAL sweeps, ordered on `lastUsed`, because a cache entry's
//     value is its likelihood of being hit again.
//
// A diagram key carries a content hash and nothing else — there is NO document for a count to be
// per-. So if some later pass "tidies these up" into one parameterised helper, the tidy-up
// silently offers this cache a per-document axis it has no document to be per-, and changes a
// shipped, tested 006 function from inside 007 for no gain. The two functions are named apart so
// that refactor reads as the behaviour change it is. `bytesOf` IS imported from `snapshots.ts`
// (it is the same TextEncoder-exact byte length, and the trust panel surfaces one figure, not
// two); `SEP` IS imported from `recents.ts`. Neither is re-implemented here.

import { get, put, del, getAll } from './idbCore';
import { connection, STORES } from './store';
import { SEP } from './recents';
import { bytesOf } from './snapshots';
import type { EffectiveTheme } from '../settings/settings';

// `bytesOf` is re-exported so 4.3's caller has one import site for the cache's byte accounting
// without reaching past this module into the snapshot layer for it. It is the SAME function —
// this is a re-export, not a second implementation.
export { bytesOf };

/**
 * One row of the `diagramMeta` store (4.2's shape: `{ key, bytes, lastUsed }`). Declared HERE
 * rather than imported from `store.ts` so the eviction maths depends on this pure module for the
 * meta shape — the same split intent `snapshots.ts` uses.
 *
 * ★ THERE IS NO `createdAt` FIELD, AND ITS ABSENCE IS THE DESIGN (D-4). Ordering on creation
 * would evict the light rendering of the diagram the user is reading RIGHT NOW, purely because
 * they first rendered it before lunch. `lastUsed` is the only time axis this cache has, and a
 * cache HIT touches it (a small write on the read path, confined to the meta store — the cost
 * D-2's two-store split makes affordable).
 */
export type DiagramMetaRow = { key: string; bytes: number; lastUsed: number };

/**
 * The three retention bounds, taken as a PARAMETER rather than read from the constants below, so
 * 8.5's number-swap is trivial and every unit case can pass small, explicit fixture bounds.
 * ALL THREE ARE GLOBAL (D-4) — `count` is a store-wide row count, not a per-anything count.
 */
export type DiagramBounds = { count: number; totalBytes: number; maxAgeMs: number };

// ── THE BOUND VALUES ARE PROPOSED. THEY ARE NOT CHOSEN. ───────────────────────────────────────
//
// D-8: the AXES are settled (D-4 — count, bytes, age, all global, oldest-first on `lastUsed`);
// the VALUES are not, and this task is FORBIDDEN from choosing them. Tasks 8.1–8.3 MEASURE
// (rendered-SVG byte sizes across diagram kinds, the 50-diagram footprint, accumulation over a
// realistic reading session, and — for each axis — whether it actually BINDS in practice, since
// an axis that never binds is chosen wrong). Task 8.4 is the HUMAN GATE that picks the numbers
// and records each one with the measurement that justifies it. Task 8.5 sets these constants to
// those values and removes the PROPOSED framing.
//
// So: every number below is a placeholder that makes the module runnable and the unit cases
// expressible. NONE of them is a decision, and none may be cited as one — not in a doc, not in
// `PERMISSIONS.md`, not in a review. The reasoning attached to each is the reasoning for the
// STARTING POINT, i.e. what the measurement should push against, not a justification of the
// value. If you are reading this comment, the bounds are still open.

/**
 * PROPOSED — NOT CHOSEN (see the block above; 8.4 is the gate). Global row cap.
 *
 * Starting point, and what it should be measured against: rows are per (diagram × effective
 * theme), so §3.7's theme-flip round trip means a single document's diagrams can occupy up to
 * 2× (3× with sepia) their count in rows. 100 is roughly "one long agent-output document's
 * diagrams in every theme it has been read in, plus recent history" — deliberately generous,
 * because if the count axis never binds in 8.2's accumulation cell, that is itself the finding.
 */
export const PROPOSED_DIAGRAM_COUNT = 100;

/**
 * PROPOSED — NOT CHOSEN (see the block above; 8.4 is the gate). Global byte cap over stored SVG.
 *
 * Starting point, and what it should be measured against: this is the SAFETY cap — the axis that
 * must hold when a document carries a few very large diagrams rather than many small ones. 8 MB
 * is a guess at "generous, still bounded" with NO measurement behind it; 8.1's per-kind SVG
 * sizes are the first real evidence, and the ratio between this and the count cap is what
 * decides which axis binds first.
 */
export const PROPOSED_DIAGRAM_TOTAL_BYTES = 8 * 1024 * 1024;

/**
 * PROPOSED — NOT CHOSEN (see the block above; 8.4 is the gate). Global age cap on `lastUsed`.
 *
 * Starting point, and what it should be measured against: this is the ABANDONMENT valve, not a
 * capacity bound — it reclaims rows for documents the user stopped reading, and (per plan §7's
 * open question) it is also what lets a `mermaid` version bump's stranded rows go without a
 * purge-on-upgrade write. 30 days is the conventional starting point; whether it ever binds
 * before the other two is an 8.2 question.
 */
export const PROPOSED_DIAGRAM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** The proposed bounds as one record. PROPOSED, NOT CHOSEN — see the block above. */
export const PROPOSED_BOUNDS: DiagramBounds = {
  count: PROPOSED_DIAGRAM_COUNT,
  totalBytes: PROPOSED_DIAGRAM_TOTAL_BYTES,
  maxAgeMs: PROPOSED_DIAGRAM_MAX_AGE_MS,
};

// ── D-3: THE KEY ──────────────────────────────────────────────────────────────────────────────

/**
 * SHA-256 of `text`, hex-encoded, via `crypto.subtle.digest`. Async, which is free here (the
 * enhancer that will call this is already async). Greenfield — nothing else in `src/` hashes
 * anything, so there is no existing convention to match.
 *
 * The input is encoded UTF-8 (`TextEncoder`), so the digest is over BYTES: two fence texts that
 * differ only in a multi-byte character produce different digests, and the same text always
 * produces the same digest regardless of platform.
 */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * D-3's cache key: `hash + SEP + theme + SEP + engineVersion`, as ONE composite string, because
 * that string is the keyPath VALUE.
 *
 * ★ THE COMPOSITE IS FORCED, NOT PREFERRED. `IdbSchema` allows one `keyPath` and no compound
 * keys. The question that matters is whether `theme` and `engineVersion` could instead live in
 * the record BODY with an equality check on read, keyed on `hash` alone — and they cannot,
 * because of a §3.7 REQUIREMENT rather than a preference: with `hash` as the key, the dark render
 * of a diagram OVERWRITES its light render, and §3.7 requires that after the first flip every
 * subsequent flip in either direction is a HIT. That needs both renderings to coexist as rows.
 * A hash-keyed store cannot hold two. (The unit suite asserts this directly — two themes of one
 * diagram must produce two distinct keys, which is the whole reason this shape exists.)
 *
 * Components:
 *  - `fenceText` — the fence's text content. Hashed, never stored in the key.
 *  - `theme` — the EFFECTIVE theme (`'light' | 'dark' | 'sepia'`), NEVER the `ThemeSetting`.
 *    Keying on the setting would put `'auto'` in the key, and `'auto'` renders as two different
 *    things; the type here makes that a compile error rather than a runtime collision.
 *  - `engineVersion` — passed in from `diagramEngine.engineVersion()` (a resolved-package read),
 *    never a hardcoded constant: a constant goes stale on exactly the Dependabot bump that is the
 *    entire reason the version is in the key. A bump moves the value, which makes old rows
 *    unreachable — reclaimed by the age bound rather than by a purge-on-upgrade write.
 *
 * `SEP` is IMPORTED from `recents.ts`, never re-declared — the same reuse and the same collision
 * argument 006 §1.1 made. A hex digest, a three-value theme literal and a semver string can none
 * of them contain it. ★ `SEP` is the six VISIBLE characters backslash-u-0-0-0-0, never a NUL
 * byte (AGENTS.md's control-character rule) — the unit suite asserts the key contains no U+0000.
 */
export async function diagramCacheKey(
  fenceText: string,
  theme: EffectiveTheme,
  engineVersion: string,
): Promise<string> {
  const hash = await sha256Hex(fenceText);
  return `${hash}${SEP}${theme}${SEP}${engineVersion}`;
}

// ── D-4: EVICTION PLANNING ────────────────────────────────────────────────────────────────────

/**
 * The outcome of planning a diagram-cache write, WITHOUT applying it. Either the incoming SVG is
 * refused whole (single-oversized short-circuit — the structure of `snapshots.ts:178-181`), or it
 * is storable and `evictKeys` lists the keys to delete afterwards, oldest-first on `lastUsed`.
 *
 * ★ THE DISPOSITION OF `{ store: false }` IS: SKIP THE CACHE, RE-RENDER THAT DIAGRAM FROM THE
 * ENGINE EVERY TIME, DEGRADE QUIETLY (D-4; §4's *render diagrams normally without caching and
 * shall not present the failure as a blocking error*). NO user-facing message — a diagram that
 * renders correctly and merely re-renders is not a failure the user has an action for.
 */
export type DiagramWritePlan =
  | { store: false; reason: 'oversized' }
  | { store: true; evictKeys: string[] };

/** Internal projected row: a meta row plus a stable tiebreak order. */
type Projected = { key: string; lastUsed: number; bytes: number; order: number };

/** Oldest-first on `lastUsed`, then stable encounter order so ties are deterministic. */
function oldestFirst(a: Projected, b: Projected): number {
  return a.lastUsed - b.lastUsed || a.order - b.order;
}

/**
 * Plan a diagram-cache write over the whole `diagramMeta` store, returning a `DiagramWritePlan`
 * and applying nothing. Deterministic on identical input; mutates nothing (`allMeta` is a
 * readonly array of readonly rows). Assumes positive bounds — 4.3 passes the module constants.
 *
 * Algorithm — a SIBLING of `planSnapshotWrite`, with D-4's axis assignment:
 *
 *  1. PRE-check: if `incomingBytes` alone exceeds `bounds.totalBytes`, the write is refused whole
 *     — `{ store: false, reason: 'oversized' }`, and NO eviction. One oversized SVG must not cost
 *     the user every other cached diagram in an attempt that was going to fail anyway.
 *  2. Otherwise project the post-write state (every existing row, plus the incoming row at
 *     `lastUsed = now`) and compute the eviction set so that after evicting it ALL THREE bounds
 *     hold SIMULTANEOUSLY. Three sweeps, ALL GLOBAL, composing deterministically — a later sweep
 *     never un-marks an earlier one:
 *       - global age: mark any row whose `lastUsed < now - maxAgeMs`.
 *       - global count: while more rows survive than `count`, mark the globally-oldest survivor.
 *       - global bytes: while the surviving bytes exceed `totalBytes`, mark the globally-oldest
 *         survivor.
 *  3. `evictKeys` is ordered oldest-to-newest.
 *
 * ★ RE-WRITING AN EXISTING KEY REPLACES ITS ROW, it does not add one. The key is deterministic
 * (D-3), and `diagramMeta`'s keyPath is `key`, so an IDB `put` of a key already present is an
 * overwrite. Projecting it as an append would double-count its bytes and evict rows the real
 * write never needed to.
 *
 * The incoming row is never itself evicted: it is newest (`lastUsed = now`, and the stable
 * tiebreak puts it last among equals), and the pre-check guarantees it fits once everything else
 * is gone. That relies on no stored row carrying a FUTURE `lastUsed` — true because this cache's
 * only writer is us, stamping the same clock. Same invariant `planSnapshotWrite` rests on.
 */
export function planDiagramWrite(
  allMeta: readonly DiagramMetaRow[],
  incomingKey: string,
  incomingBytes: number,
  now: number,
  bounds: DiagramBounds,
): DiagramWritePlan {
  // 1. Single-oversized short-circuit — refuse whole, evict nothing.
  if (incomingBytes > bounds.totalBytes) {
    return { store: false, reason: 'oversized' };
  }

  // 2. Project the post-write state. A row at `incomingKey` is REPLACED in place, not appended.
  const projected: Projected[] = [];
  let order = 0;
  let replaced = false;
  for (const row of allMeta) {
    if (row.key === incomingKey) {
      projected.push({ key: incomingKey, lastUsed: now, bytes: incomingBytes, order: order++ });
      replaced = true;
    } else {
      projected.push({ key: row.key, lastUsed: row.lastUsed, bytes: row.bytes, order: order++ });
    }
  }
  if (!replaced) {
    projected.push({ key: incomingKey, lastUsed: now, bytes: incomingBytes, order });
  }

  const evicted = new Set<string>();

  // Sweep 1 — GLOBAL age. Mark anything whose last use is older than the cutoff.
  const cutoff = now - bounds.maxAgeMs;
  for (const p of projected) {
    if (p.lastUsed < cutoff) evicted.add(p.key);
  }

  // Sweep 2 — GLOBAL count. Mark the globally-oldest survivors until the row count is at the cap.
  // Runs over what sweep 1 left, so it never un-marks it.
  const afterAge = projected.filter((p) => !evicted.has(p.key)).sort(oldestFirst);
  const excess = afterAge.length - bounds.count;
  for (let i = 0; i < excess && i < afterAge.length; i++) {
    evicted.add(afterAge[i].key);
  }

  // Sweep 3 — GLOBAL bytes. While over the byte bound, evict the globally-oldest still-surviving
  // row. Runs LAST over what sweeps 1–2 left, so it never un-marks them.
  const survivors = projected.filter((p) => !evicted.has(p.key)).sort(oldestFirst);
  let sum = survivors.reduce((acc, p) => acc + p.bytes, 0);
  for (let i = 0; i < survivors.length && sum > bounds.totalBytes; i++) {
    evicted.add(survivors[i].key);
    sum -= survivors[i].bytes;
  }

  // Final eviction list, oldest-to-newest.
  const evictKeys = projected
    .filter((p) => evicted.has(p.key))
    .sort(oldestFirst)
    .map((p) => p.key);

  return { store: true, evictKeys };
}

// ── THE IDB LAYER (task 4.3) ──────────────────────────────────────────────────────────────────
//
// Everything above is pure and sealed (4.1). Everything below reads and writes the two stores 4.2
// added, on the ONE memoized connection `store.ts` owns (`connection()`) — never a second `openDb`,
// which would fight idbCore's versionchange close-and-drop. This is `snapshots.ts`'s IDB half in
// the same shape, for the same reasons.
//
// ── ★ META IS AUTHORITATIVE, AND THE ORDERING IS META FIRST, THEN CONTENT ─────────────────────
//
// The `diagramMeta` row DEFINES membership: {@link readDiagram} misses unless the meta row exists,
// and {@link describeStored} counts and sizes from meta alone (D-2). Both halves of a cache entry
// are written and deleted as two SINGLE-STORE transactions, in that order, because `idbCore.ts`
// is one transaction per store (`:97-109`) and a multi-store transaction helper is its documented
// STOP signal (`:5-9`). It is therefore NOT atomic, and the ordering is chosen so the crash window
// fails in the recoverable direction:
//
//   • WRITE (meta, then content). A crash between leaves a meta row pointing at MISSING CONTENT.
//     That is a MISS — the diagram is simply re-rendered, and the re-render overwrites both rows by
//     keyPath, so the state SELF-RECLAIMS. Bytes are briefly OVER-reported by the panel, never
//     under: the trust surface errs toward admitting more storage than is really held.
//   • EVICT (meta, then content). A crash between leaves a content row no meta row names. It is
//     unreachable (meta is authoritative), so it serves nothing and is re-written in place the next
//     time that exact key is rendered.
//
// The direction the ordering EXISTS to forbid is content-first-on-write: content stored under a key
// no meta row accounts for is bytes the panel cannot see, and an under-reporting trust panel is the
// one failure `PERMISSIONS.md` exists to deny.
//
// ── EVERY ENTRY POINT DEGRADES QUIETLY ────────────────────────────────────────────────────────
//
// §4: a cache that cannot read or write must let diagrams "render normally without caching" and
// "shall not present the failure as a blocking error". So every function below swallows its own
// storage errors — a read failure is a miss, a write failure is a diagram that re-renders next
// time. Neither is a user-facing message, because neither is something the user has an action for.

/** One row of the `diagrams` content store (4.2's shape). The SVG string, and nothing else. */
type DiagramRow = { key: string; svg: string };

/**
 * The cached SVG for `key`, or `undefined` on a miss. A HIT touches `lastUsed` (D-4: the cache's
 * only time axis is recency of USE, so reading is what keeps an entry alive).
 *
 * Meta is read FIRST and is authoritative — a content row whose meta row is gone (the eviction
 * crash window above) is deliberately NOT served, so the store the panel describes and the store
 * the reader reads are the same store.
 *
 * The `lastUsed` touch is awaited rather than fired-and-forgotten: it is one small write on the
 * meta store, and awaiting it means a subsequent `planDiagramWrite` sweep can never sort against a
 * stale timestamp it was told had already been updated.
 */
export async function readDiagram(key: string): Promise<string | undefined> {
  try {
    const conn = await connection();
    const meta = await get<DiagramMetaRow>(conn, STORES.diagramMeta, key);
    if (!meta) return undefined; // never cached, or evicted — a miss either way.
    const row = await get<DiagramRow>(conn, STORES.diagrams, key);
    if (!row) return undefined; // meta without content: the write crash window. A miss; self-heals.
    await put<DiagramMetaRow>(conn, STORES.diagramMeta, { ...meta, lastUsed: Date.now() });
    return row.svg;
  } catch {
    return undefined; // storage unavailable → a miss → the caller renders. §4's quiet degradation.
  }
}

/**
 * Store `svg` under `key`, applying D-4's plan.
 *
 * Reads all of `diagramMeta` (small, bounded, meta-only — never a content row), plans against
 * {@link PROPOSED_BOUNDS}, and then:
 *  - `store: false` (single-oversized short-circuit) → does NOTHING: no eviction, no write, no
 *    message. That diagram re-renders from the engine every time, quietly, per D-4 and §4.
 *  - `store: true` → writes the incoming META row, then the incoming CONTENT row, then deletes the
 *    evicted META rows, then the evicted CONTENT rows — meta before content at every step (see the
 *    ordering note above).
 *
 * ★ THE BOUNDS ARE STILL PROPOSED, NOT CHOSEN (D-8). Passing `PROPOSED_BOUNDS` here is what makes
 * the cache runnable; it is NOT a decision, and 8.4 remains the gate that picks the numbers.
 */
export async function storeDiagram(key: string, svg: string): Promise<void> {
  try {
    const conn = await connection();
    const allMeta = await getAll<DiagramMetaRow>(conn, STORES.diagramMeta);
    const incomingBytes = bytesOf(svg);
    const now = Date.now();

    const plan = planDiagramWrite(allMeta, key, incomingBytes, now, PROPOSED_BOUNDS);
    if (!plan.store) return; // single-oversized: no eviction, no write, no error (§4).

    // META FIRST — the incoming meta row lands before its content row.
    await put<DiagramMetaRow>(conn, STORES.diagramMeta, { key, bytes: incomingBytes, lastUsed: now });
    await put<DiagramRow>(conn, STORES.diagrams, { key, svg });

    // Evicted meta rows before evicted content rows, same direction.
    for (const evicted of plan.evictKeys) await del(conn, STORES.diagramMeta, evicted);
    for (const evicted of plan.evictKeys) await del(conn, STORES.diagrams, evicted);
  } catch {
    // A write that failed is a diagram that re-renders next time. Not a user-facing failure (§4).
  }
}
