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
 * CHOSEN default (D-8 — task 7.2's human gate, `decisions.md` 2026-07-26). Per-document cap
 * (D-16 axis: count is per-document — decided, do not reopen). 1.2 proposed 20 and was forbidden
 * from choosing; the human chose 15 from 7.1's measurements.
 *
 * Tradeoff it balances: session-scale history vs picker legibility. Too low and a normal
 * editing session loses states the user might diff against; too high and §3.7's diff-target
 * picker becomes an unreadable wall of near-identical entries. 15 is moderate history depth,
 * chosen over both deeper (20+, which keeps stale early state) and shallower (10, tight for an
 * active session). The picker scrolls internally at this depth BY DESIGN, not as a cost —
 * `readerCss.ts:401` caps it at `min(46vh,320px)` with `overflow:auto`.
 *
 * ★ THIS IS THE BOUND THAT BINDS NORMAL USAGE — bytes is the safety cap, age the abandonment
 * valve. Tuning any one of the three in isolation against the wrong purpose is the mistake
 * `decisions.md`'s mental-model note exists to prevent; its revisit-when lives there, not here.
 */
export const SNAPSHOT_COUNT_PER_DOC = 15;

/**
 * CHOSEN default (D-8 — task 7.2's human gate, `decisions.md` 2026-07-26). Global cap across all
 * documents (D-16 axis: bytes are global — decided). 1.2 proposed 5 MiB; the human chose 20 MiB.
 *
 * Tradeoff it balances: on-disk footprint vs meaningful history. Peekover is reader-first and
 * zero-network; snapshot storage must stay a modest on-device cost, but too small a ceiling
 * evicts real history the moment a second large document is watched.
 *
 * ★ WHY IT MOVED, and it is the one number 7.1's measurement actually redirected: 5 MiB was the
 * plan's defensive proposal ("invisible on any disk"), and 7.1 measured it BINDING AT 4 SNAPSHOTS
 * for a 1 MB document — the thinnest history exactly where deep history is most valuable, since
 * large documents evolve more meaningfully than small ones. At 20 MiB a 1 MB document fits ~17
 * snapshots, which is ABOVE `SNAPSHOT_COUNT_PER_DOC`, so count binds first as designed; ~420 fit
 * at 50 KB. Still 0.02% of a 100 GB drive.
 *
 * ★ This bound is the SAFETY CAP for the pathological "many large documents" case, NOT the
 * everyday constraint — count is what bounds normal usage.
 */
export const SNAPSHOT_TOTAL_BYTES = 20 * 1024 * 1024;

/**
 * CHOSEN default (D-8 — task 7.2's human gate, `decisions.md` 2026-07-26). Global cap across all
 * documents (D-16 axis: age is global — decided).
 *
 * ★ THE VALUE DID NOT MOVE, AND THAT IS ITSELF THE DECISION: 1.2 proposed 30 days and 7.2 kept it
 * DELIBERATELY, after weighing 7 and 90 as alternatives. Reviewed and chosen, not skipped.
 *
 * Tradeoff it balances: forget-horizon vs continuity. 7 days would change what a snapshot IS —
 * "recent working state" rather than "the history of this document". 90 would leave stale state
 * occupying the pool for a full quarter after abandonment. 30 days covers common project cadences
 * (weekly / biweekly / monthly review) while cleaning abandoned experiments within a month.
 *
 * ★ AGE IS THE SAFETY VALVE FOR ABANDONMENT, not a constraint on working memory — count and bytes
 * bound active usage. At 20 MiB bytes rarely bind in typical use, which makes age the effective
 * garbage collector for the "watched briefly, then forgot" document.
 *
 * ★ One semantic, logged in `decisions.md` and worth knowing BEFORE touching eviction: age is
 * measured from a snapshot's TIMESTAMP, not from last access — an actively-worked document still
 * loses its 30-day-old snapshots. Accepted because newer, more relevant snapshots exist by then.
 */
export const SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The CHOSEN defaults assembled into one bounds record. 1.4 passes THIS to `planSnapshotWrite`
 * in production; unit tests pass small explicit bounds instead, which is why 7.3's number-swap
 * left every one of them green. The three constants are referenced BY NAME, so a chosen value
 * propagates to every consumer through a single edit — no call site carries a literal.
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
 * Fire-and-forget at the call site (task 1.4's `void storeSnapshot(...)`): a failure completes
 * the re-render normally rather than surfacing (§4). Callers pass the ALREADY-outgoing source.
 *
 * ★ IT NEVER REJECTS (013 task 4.4 addendum, 2026-11-03). `void` does not catch: until this, a
 * write that met a CLOSING connection — idbCore's `versionchange` close (another context upgrading
 * the database), or a test's connection reset — threw `InvalidStateError` from `db.transaction()`
 * and escaped as an UNHANDLED rejection (CI runs 50, 54 and 55). The write is now skipped quietly:
 * nothing is logged or reported (no telemetry, AGENTS.md #2), and nothing already kept is touched —
 * the META FIRST order below means a write cut short leaves at worst a dangling meta entry, which
 * is safe and self-reclaiming (§1.2). Pinned by snapshotCapture.browser.test.ts ("a write that
 * meets a closing connection is skipped quietly").
 */
export async function storeSnapshot(docId: string, text: string): Promise<void> {
  try {
    await writeSnapshot(docId, text);
  } catch {
    // Skipped quietly — see above. A snapshot is a convenience for Compare, never a gate.
  }
}

async function writeSnapshot(docId: string, text: string): Promise<void> {
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
