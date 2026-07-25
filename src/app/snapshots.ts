// snapshots — snapshot byte accounting + eviction PLANNING (pure) PLUS the thin IDB layer
// that applies a plan (task 1.4). The pure core has no DOM, no IndexedDB, no I/O; the IDB
// layer below (`storeSnapshot`, `deleteSnapshotsForFolder`, the read helpers) is browser-only
// at runtime and shares store.ts's single memoized connection.
//
// This is the separable seam plan §1.2 / D-4 calls out: the bounds/eviction maths is pure
// arithmetic over `snapshotMeta.entries`, so it is jsdom-testable in isolation (`bytesOf`,
// `planSnapshotWrite`); the IDB read/write is the thin, separate layer 1.4 adds here and is
// proven in the real-engine browser project (storage is jsdom-blind). Same pure/DOM/engine
// split `recents.ts` uses for the recents caps.
//
// `planSnapshotWrite` computes WHAT to evict; it applies nothing and generates no ids. The IDB
// layer is where deletion ORDERING lands (META FIRST, then content — plan §1.2, load-bearing):
// the incoming snapshot's meta entry is written BEFORE its content row, so a crash between the
// two IDB transactions (idbCore writes one store per transaction — §4-5, not atomic) leaves a
// meta entry pointing at missing content — §4's already-required "comparison unavailable" state,
// self-reclaiming lazily — rather than an orphaned content row the byte-accounting can never see.

// The IDB layer (below) reuses store.ts's single memoized connection + idbCore's raw ops; `SEP`
// is imported from recents.ts, never re-declared (§4-9 coupling). The pure core above uses none
// of these — it stays jsdom-testable in isolation.
import { get, getAll, put, del } from './idbCore';
import { connection, STORES } from './store';
import { SEP } from './recents';

/**
 * One snapshot's metadata row inside a document's `snapshotMeta` record. Declared HERE (not
 * imported from `store.ts`) so callers depend on this pure module for the meta shape — the
 * D-4 split intent: listing, byte-accounting and eviction reason over `snapshotMeta` alone,
 * never over snapshot content. `bytes` is the TextEncoder-exact byte length written at
 * capture, so eviction never reads content. `ts` is a millisecond timestamp.
 */
export type SnapshotMetaEntry = { id: string; ts: number; bytes: number };

/** A document's snapshot index: the per-`docId` record in the `snapshotMeta` store (D-4). */
export type SnapshotMeta = { docId: string; entries: SnapshotMetaEntry[] };

/**
 * The three retention bounds, taken as a PARAMETER rather than read from the constants below,
 * so 7.3's number-swap is trivial and every unit test can pass small, explicit fixture bounds.
 * Axes are fixed by D-16 — DECIDED, not chosen here: `countPerDoc` is per-document; `totalBytes`
 * and `maxAgeMs` are global across the whole store. All three are assumed positive; the planner
 * does not validate them (its caller, 1.4, passes `DEFAULT_BOUNDS`).
 */
export type SnapshotBounds = { countPerDoc: number; totalBytes: number; maxAgeMs: number };

/**
 * PROPOSED default — NOT chosen (D-8): task 7.2 picks the real number from 7.1's measurements,
 * and 1.2 is explicitly forbidden from choosing it. Per-document cap (D-16 axis: count is
 * per-document — decided, do not reopen).
 *
 * Tradeoff it balances: session-scale history vs picker legibility. Too low and a normal
 * editing session loses states the user might diff against; too high and §3.7's diff-target
 * picker becomes an unreadable wall of near-identical entries. 20 mirrors the house recents cap
 * (`recents.ts` `DEFAULT_RECENTS_CAP`) as a familiar "short, honest list" scale.
 *
 * The 7.1 signal that would move it: the recorded count of distinct render-states per watched
 * session. If typical sessions produce far more — or far fewer — meaningfully-different states
 * than ~20, 7.2 moves this to match the measurement.
 */
export const SNAPSHOT_COUNT_PER_DOC = 20;

/**
 * PROPOSED default — NOT chosen (D-8): 7.2 picks from 7.1's data; 1.2 may not choose it. Global
 * cap across all documents (D-16 axis: bytes are global — decided).
 *
 * Tradeoff it balances: on-disk footprint vs meaningful history. Peekover is reader-first and
 * zero-network; snapshot storage must stay a modest on-device cost, but too small a ceiling
 * evicts real history the moment a second large document is watched. §1.6 treats 1 MB as the
 * per-document diff-render ceiling, so 5 MiB holds roughly a handful of large documents' worth
 * of history before the global byte sweep bites.
 *
 * The 7.1 signal that would move it: the recorded real snapshot sizes/counts the eviction acts
 * on. If real captured documents run much larger or much smaller than the 50 KB / 1 MB render
 * baselines, 7.2 moves this.
 */
export const SNAPSHOT_TOTAL_BYTES = 5 * 1024 * 1024;

/**
 * PROPOSED default — NOT chosen (D-8): 7.2 picks from 7.1's data; 1.2 may not choose it. Global
 * cap across all documents (D-16 axis: age is global — decided).
 *
 * Tradeoff it balances: forget-horizon vs continuity. A short horizon keeps storage fresh and
 * keeps "history" honestly recent, but drops continuity for a document the user returns to after
 * a break; a long horizon preserves continuity at the cost of holding stale states. 30 days keeps
 * "the last month of this document" without retaining indefinitely.
 *
 * The 7.1 signal that would move it: the record of how quickly the count/byte caps bind in
 * practice. If they bind first (history saturates within a session), age rarely triggers and can
 * be generous; if watched sessions are sparse and far apart, age becomes the effective bound and
 * 7.2 tightens or loosens it accordingly.
 */
export const SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The proposed defaults assembled into one bounds record. 1.4 passes THIS to `planSnapshotWrite`
 * in production; unit tests pass small explicit bounds instead, so 7.3's number-swap leaves them
 * green. Still PROPOSED end-to-end — 7.2 chooses the numbers, 7.3 swaps the constants above.
 */
export const DEFAULT_BOUNDS: SnapshotBounds = {
  countPerDoc: SNAPSHOT_COUNT_PER_DOC,
  totalBytes: SNAPSHOT_TOTAL_BYTES,
  maxAgeMs: SNAPSHOT_MAX_AGE_MS,
};

/**
 * Exact encoded byte length of `text`. Synchronous, TextEncoder-based — the SAME figure the
 * trust panel surfaces (§1.3), so it MUST be encoded byte length, NOT string length: a multi-byte
 * character (UTF-8 length ≠ UTF-16 code-unit count) discriminates the two. Source-of-truth on raw
 * bytes — CRLF and every other character pass through unnormalised; D-5 normalisation is the
 * caller's job at capture, not this function's.
 */
export function bytesOf(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * The outcome of planning a snapshot write, WITHOUT applying it. Either the incoming snapshot is
 * refused whole (single-oversized short-circuit — §4: a rejection shall not evict other documents'
 * snapshots), or it is storable and `evictIds` lists the ids to delete afterwards, oldest-first.
 */
export type WritePlan =
  | { store: false; reason: 'oversized' }
  | { store: true; evictIds: string[] };

/** Internal projected entry: a meta entry tagged with its doc + a stable tiebreak order. */
type Projected = { id: string; docId: string; ts: number; bytes: number; order: number };

/** Oldest-first: by timestamp, then by stable encounter order so ties are deterministic. */
function oldestFirst(a: Projected, b: Projected): number {
  return a.ts - b.ts || a.order - b.order;
}

/**
 * Plan a snapshot write over the whole store's metadata, returning a `WritePlan` and applying
 * nothing. Deterministic on identical input; mutates nothing (`allMeta` is a readonly array of
 * readonly records). Assumes positive bounds — its caller (1.4) passes `DEFAULT_BOUNDS`.
 *
 * Algorithm — ONE specified thing (D-16 axes, plan §1.2):
 *
 *  1. PRE-check: if `incomingBytes` alone exceeds `bounds.totalBytes`, the snapshot is refused
 *     whole — `{ store: false, reason: 'oversized' }`, NO eviction. §4 verbatim: a single-oversized
 *     rejection shall not evict other documents' snapshots in the attempt.
 *  2. Otherwise project the post-write state (all existing entries plus the incoming entry appended
 *     to `docId` — an absent `docId` is treated as an empty entries list) and compute the eviction
 *     set so that after evicting it ALL THREE bounds hold simultaneously. Three sweeps compose
 *     deterministically; a later sweep never un-marks an earlier one:
 *       - per-document count (D-16: PER-DOC): for each doc over `countPerDoc`, mark that doc's
 *         OLDEST entries until its count == the cap.
 *       - global age (D-16: GLOBAL): mark any entry with `ts < now - maxAgeMs`, regardless of doc.
 *       - global bytes (D-16: GLOBAL): while the sum of non-evicted bytes exceeds `totalBytes`,
 *         mark the GLOBALLY-oldest unevicted entry, regardless of doc.
 *  3. `evictIds` is ordered oldest-to-newest. `incomingId` is opaque — invented by the caller;
 *     this module never generates ids. The just-written incoming entry is never itself evicted
 *     (it is newest, and the pre-check guarantees it fits once everything else is gone).
 */
export function planSnapshotWrite(
  allMeta: readonly SnapshotMeta[],
  docId: string,
  incomingId: string,
  incomingBytes: number,
  now: number,
  bounds: SnapshotBounds,
): WritePlan {
  // 1. Single-oversized short-circuit — refuse whole, evict nothing (§4 verbatim).
  if (incomingBytes > bounds.totalBytes) {
    return { store: false, reason: 'oversized' };
  }

  // 2. Project the post-write state: every existing entry, plus the incoming appended to its doc.
  const projected: Projected[] = [];
  let order = 0;
  let sawDoc = false;
  for (const meta of allMeta) {
    for (const e of meta.entries) {
      projected.push({ id: e.id, docId: meta.docId, ts: e.ts, bytes: e.bytes, order: order++ });
    }
    if (meta.docId === docId) {
      projected.push({ id: incomingId, docId, ts: now, bytes: incomingBytes, order: order++ });
      sawDoc = true;
    }
  }
  if (!sawDoc) {
    // docId had no existing SnapshotMeta record — treat as an empty entries list.
    projected.push({ id: incomingId, docId, ts: now, bytes: incomingBytes, order });
  }

  const evicted = new Set<string>();

  // Sweep 1 — per-document count (D-16: PER-DOC). Mark each over-cap doc's oldest down to the cap.
  const byDoc = new Map<string, Projected[]>();
  for (const p of projected) {
    const arr = byDoc.get(p.docId);
    if (arr) arr.push(p);
    else byDoc.set(p.docId, [p]);
  }
  for (const arr of byDoc.values()) {
    if (arr.length > bounds.countPerDoc) {
      const oldest = [...arr].sort(oldestFirst);
      const excess = arr.length - bounds.countPerDoc;
      for (let i = 0; i < excess; i++) evicted.add(oldest[i].id);
    }
  }

  // Sweep 2 — global age (D-16: GLOBAL). Mark anything older than the cutoff, regardless of doc.
  const cutoff = now - bounds.maxAgeMs;
  for (const p of projected) {
    if (p.ts < cutoff) evicted.add(p.id);
  }

  // Sweep 3 — global bytes (D-16: GLOBAL). While over the byte bound, evict the globally-oldest
  // still-surviving entry. Runs LAST over what sweeps 1–2 left, so it never un-marks them.
  const survivors = projected.filter((p) => !evicted.has(p.id)).sort(oldestFirst);
  let sum = survivors.reduce((acc, p) => acc + p.bytes, 0);
  for (let i = 0; i < survivors.length && sum > bounds.totalBytes; i++) {
    evicted.add(survivors[i].id);
    sum -= survivors[i].bytes;
  }

  // Final eviction list, oldest-to-newest.
  const evictIds = projected
    .filter((p) => evicted.has(p.id))
    .sort(oldestFirst)
    .map((p) => p.id);

  return { store: true, evictIds };
}

// ── The IDB layer (task 1.4) ────────────────────────────────────────────────────────────────
//
// Browser-only at runtime. It reuses store.ts's single memoized connection (never opens a
// second one, which would fight idbCore's versionchange close-and-drop) and idbCore's raw
// get/getAll/put/delete (imported at the top). `SEP` comes from recents.ts (§4-9 coupling).

/** One stored snapshot body: the `snapshots` store row (D-4 — split from `snapshotMeta`). */
export type SnapshotRow = { id: string; text: string };

/**
 * LF normalisation for the capture/diff boundary (D-5). Pure and total: `\r\n` → `\n`, nothing
 * else touched. The ENTIRE D-5 half at capture — `changeDetector.ts` is deliberately NOT changed
 * (plan §3-6): storing no snapshot when the outgoing and incoming texts are equal after this is
 * what keeps a CRLF→LF rewrite from producing an all-changed comparison, without altering 005's
 * shipped exact-string re-render detection. 5.1's `diffEngine` reuses this exported function.
 */
export function normalise(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

/** An opaque, collision-resistant snapshot id (the `snapshots`/`snapshotMeta.entries` key). The
 *  pure planner treats it as opaque — id generation is the IDB layer's job, never the planner's. */
let snapCounter = 0;
function newSnapshotId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  snapCounter += 1;
  return `s-${Date.now()}-${snapCounter}`;
}

/**
 * Read every `snapshotMeta` record (small bounded rows — `idbCore.getAll` is safe, idbCore.ts:116).
 * Never reads a content row: listing, eviction and byte-accounting live on meta alone (D-4).
 */
export async function getSnapshotMeta(): Promise<SnapshotMeta[]> {
  return getAll<SnapshotMeta>(await connection(), STORES.snapshotMeta);
}

/** Fetch one snapshot's text by id, or `undefined` when the content row is missing (the lazy
 *  self-reclaim window — §1.2). Reads a single content row, on demand only (never in bulk). */
export async function getSnapshotText(id: string): Promise<string | undefined> {
  const row = await get<SnapshotRow>(await connection(), STORES.snapshots, id);
  return row?.text;
}

/**
 * Capture one snapshot of `text` for `docId`, applying the pure eviction plan META FIRST.
 *
 * Reads all `snapshotMeta`, plans the write against `DEFAULT_BOUNDS`, and:
 *  - `store: false` (single-oversized short-circuit) → does nothing: no eviction, no write (§4).
 *  - `store: true` → writes the incoming META entry (+ removes evicted entries from their meta
 *    records) BEFORE the incoming content row, then deletes the evicted content rows last. That
 *    ordering keeps every crash window failing toward a dangling meta entry (safe, self-reclaiming)
 *    rather than an orphaned content row (invisible bytes the accounting under-reports) — §1.2.
 *
 * Fire-and-forget at the call site (task 1.4's `void storeSnapshot(...)`): a rejection completes
 * the re-render normally rather than surfacing (§4). Callers pass the ALREADY-outgoing source.
 */
export async function storeSnapshot(docId: string, text: string): Promise<void> {
  const conn = await connection();
  const allMeta = await getAll<SnapshotMeta>(conn, STORES.snapshotMeta);
  const incomingId = newSnapshotId();
  const incomingBytes = bytesOf(text);
  const now = Date.now();

  const plan = planSnapshotWrite(allMeta, docId, incomingId, incomingBytes, now, DEFAULT_BOUNDS);
  if (!plan.store) return; // single-oversized: no eviction, no write.

  const evicted = new Set(plan.evictIds);

  // Project the post-plan meta state: drop evicted entries everywhere, append the incoming to its
  // doc. Only records that actually change are written (idbCore is one transaction per put/del).
  const byDoc = new Map<string, SnapshotMeta>();
  for (const m of allMeta) {
    byDoc.set(m.docId, { docId: m.docId, entries: m.entries.filter((e) => !evicted.has(e.id)) });
  }
  const incomingRec = byDoc.get(docId) ?? { docId, entries: [] };
  incomingRec.entries = [...incomingRec.entries, { id: incomingId, ts: now, bytes: incomingBytes }];
  byDoc.set(docId, incomingRec);

  const changed = (m: SnapshotMeta): boolean =>
    m.docId === docId || allMeta.some((o) => o.docId === m.docId && o.entries.length !== m.entries.length);

  // META FIRST — the incoming meta entry lands before its content row.
  for (const rec of byDoc.values()) {
    if (!changed(rec)) continue;
    if (rec.entries.length === 0) await del(conn, STORES.snapshotMeta, rec.docId);
    else await put(conn, STORES.snapshotMeta, rec);
  }
  // Incoming content row (after its meta entry).
  await put<SnapshotRow>(conn, STORES.snapshots, { id: incomingId, text });
  // Evicted content rows last — their meta entries are already gone.
  for (const id of plan.evictIds) await del(conn, STORES.snapshots, id);
}

/**
 * D-10 revoke-erase: delete every snapshot whose `docId` is inside `folderId`.
 *
 * ★ The boundary is `folderId + SEP`, NOT a bare `folderId.startsWith`. The fallback id form
 * (`f-100-1`) can be a string prefix of another (`f-100-10`), so a bare-prefix scan over-deletes
 * on an erase path where over-deletion is silent and unrecoverable. `SEP` cannot appear inside a
 * `folderId` (crypto.randomUUID is hex+hyphens; the fallback is digits+hyphens), so `folderId + SEP`
 * is an exact boundary. Meta rows first, then content rows (safe crash direction, §1.2).
 */
export async function deleteSnapshotsForFolder(folderId: string): Promise<void> {
  const conn = await connection();
  const allMeta = await getAll<SnapshotMeta>(conn, STORES.snapshotMeta);
  const prefix = folderId + SEP;
  const targets = allMeta.filter((m) => m.docId.startsWith(prefix));
  for (const m of targets) await del(conn, STORES.snapshotMeta, m.docId);
  for (const m of targets) for (const e of m.entries) await del(conn, STORES.snapshots, e.id);
}
