// Task 1.2 — the PURE byte-accounting + eviction-PLANNING logic. No engine: pure arithmetic
// over `snapshotMeta.entries`, so it lives in the fast unit project (no jsdom pragma needed),
// exactly like `recents.test.ts`. This module has NO browser-visible behaviour — no DOM, no IDB,
// no rAF — so there is no browser projection and no `describe.each` over surfaces. The IDB
// read/write layer (and deletion ORDERING: meta-first, then content) is 1.4's, proven there.
//
// Fixtures use SMALL bounds passed EXPLICITLY so cases are readable and 7.3's number-swap leaves
// them green. No test pins an exported bound value as an expected number (that is 7.2's job, not
// 1.2's — G). docIds are opaque test strings ('docA'/'docB'/…); no SEP literal appears here
// (SEP export + docId construction is 1.4's territory).

import { describe, it, expect } from 'vitest';
import {
  bytesOf,
  planSnapshotWrite,
  DEFAULT_BOUNDS,
  type SnapshotMeta,
  type SnapshotBounds,
} from './snapshots';

/** A fixed millisecond clock, so every fixture's ages are readable relative to it. */
const NOW = 1_000_000;

const entry = (id: string, ts: number, bytes: number) => ({ id, ts, bytes });
const doc = (docId: string, entries: ReturnType<typeof entry>[]): SnapshotMeta => ({ docId, entries });

/** A single flattened surviving entry, for asserting post-plan bound state. */
type Flat = { id: string; docId: string; ts: number; bytes: number };

/**
 * Reconstruct the store's flat entry list AFTER applying a plan: existing entries minus the
 * evicted ids, plus the incoming entry when the plan stores it. Lets each bound be checked
 * against the resulting state rather than against the plan's internals.
 */
function survivorsAfter(
  allMeta: readonly SnapshotMeta[],
  docId: string,
  incoming: { id: string; ts: number; bytes: number },
  plan: ReturnType<typeof planSnapshotWrite>,
): Flat[] {
  const flat: Flat[] = [];
  for (const m of allMeta) for (const e of m.entries) flat.push({ id: e.id, docId: m.docId, ts: e.ts, bytes: e.bytes });
  if (!plan.store) return flat; // refused: nothing stored, nothing evicted
  const drop = new Set(plan.evictIds);
  flat.push({ id: incoming.id, docId, ts: incoming.ts, bytes: incoming.bytes });
  return flat.filter((f) => !drop.has(f.id));
}

// ---------------------------------------------------------------------------------------------
// A — bytesOf: encoded byte length, NOT string length
// ---------------------------------------------------------------------------------------------

describe('bytesOf', () => {
  it('counts ASCII bytes one-per-char', () => {
    expect(bytesOf('hello')).toBe(5);
  });

  it('counts ENCODED bytes, not UTF-16 code units (the discriminator vs string.length)', () => {
    const emoji = '😀'; // U+1F600: 4 UTF-8 bytes, but a 2-unit surrogate pair in JS strings
    expect(bytesOf(emoji)).toBe(new TextEncoder().encode(emoji).length);
    expect(bytesOf(emoji)).not.toBe(emoji.length); // 4 !== 2 — string.length would under-count
  });

  it('is 0 for the empty string', () => {
    expect(bytesOf('')).toBe(0);
  });

  it('passes CRLF through UNNORMALISED — the raw CR is counted (D-5 normalise is the caller\'s job)', () => {
    // 'line1' (5) + CR (1) + LF (1) + 'line2' (5) = 12; the LF-only form is one byte shorter.
    expect(bytesOf('line1\r\nline2')).toBe(12);
    expect(bytesOf('line1\r\nline2')).toBe(bytesOf('line1\nline2') + 1);
  });
});

// ---------------------------------------------------------------------------------------------
// B — single-oversized short-circuit (§4: a rejection evicts nothing)
// ---------------------------------------------------------------------------------------------

describe('planSnapshotWrite — single-oversized short-circuit', () => {
  const bounds: SnapshotBounds = { countPerDoc: 10, totalBytes: 100, maxAgeMs: 1_000_000 };
  const allMeta = [doc('docA', [entry('a1', NOW - 100, 10), entry('a2', NOW - 50, 10)])];

  it('refuses a snapshot larger than the whole byte bound, evicting NOTHING', () => {
    const plan = planSnapshotWrite(allMeta, 'docA', 'incA', 150, NOW, bounds);
    // The refused variant carries NO evict list — "nothing evicted" is structural.
    expect(plan).toEqual({ store: false, reason: 'oversized' });
  });

  it('NON-VACUOUS control: the SAME fixture with a within-bounds incoming plans normally', () => {
    const plan = planSnapshotWrite(allMeta, 'docA', 'incA', 50, NOW, bounds);
    expect(plan.store).toBe(true);
    if (plan.store) expect(plan.evictIds).toEqual([]); // 70 bytes total, 3 entries, all fresh — nothing to evict
  });
});

describe('planSnapshotWrite — first snapshot for a brand-new docId', () => {
  it('treats a docId with no existing SnapshotMeta record as an empty entries list', () => {
    const bounds: SnapshotBounds = { countPerDoc: 5, totalBytes: 1_000, maxAgeMs: 1_000_000 };
    const allMeta = [doc('docOther', [entry('o1', NOW - 100, 10)])];
    // 'docNew' is absent from allMeta — its first snapshot stores with nothing to evict.
    const plan = planSnapshotWrite(allMeta, 'docNew', 'incNew', 10, NOW, bounds);
    expect(plan).toEqual({ store: true, evictIds: [] });
  });
});

// ---------------------------------------------------------------------------------------------
// C — multi-bound convergence (single doc, so all three bounds compose on one document)
// ---------------------------------------------------------------------------------------------

describe('planSnapshotWrite — multi-bound convergence', () => {
  it('after applying the plan, ALL THREE bounds hold simultaneously', () => {
    const bounds: SnapshotBounds = { countPerDoc: 2, totalBytes: 100, maxAgeMs: 10_000 };
    // docC violates all three at once: 4 existing + incoming = 5 (> count 2); e1/e2 older than
    // the 10_000 cutoff (age); 5 × 40 = 200 bytes (> 100).
    const allMeta = [
      doc('docC', [
        entry('e1', NOW - 50_000, 40),
        entry('e2', NOW - 40_000, 40),
        entry('e3', NOW - 5_000, 40),
        entry('e4', NOW - 1_000, 40),
      ]),
    ];
    const incoming = { id: 'incC', ts: NOW, bytes: 40 };
    const plan = planSnapshotWrite(allMeta, 'docC', incoming.id, incoming.bytes, NOW, bounds);
    expect(plan.store).toBe(true);

    const survivors = survivorsAfter(allMeta, 'docC', incoming, plan);
    const cutoff = NOW - bounds.maxAgeMs;

    // Bound 1 — per-document count.
    const inDocC = survivors.filter((s) => s.docId === 'docC').length;
    expect(inDocC).toBeLessThanOrEqual(bounds.countPerDoc);
    // Bound 2 — total bytes.
    const totalBytes = survivors.reduce((sum, s) => sum + s.bytes, 0);
    expect(totalBytes).toBeLessThanOrEqual(bounds.totalBytes);
    // Bound 3 — max age (no survivor older than the cutoff).
    expect(survivors.every((s) => s.ts >= cutoff)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// D — oldest-first ordering (eviction is a proper subset of one doc, oldest → newest)
// ---------------------------------------------------------------------------------------------

describe('planSnapshotWrite — oldest-first ordering', () => {
  it('evicts a proper subset of the oldest entries, listed oldest-to-newest', () => {
    // Only the count bound bites (bytes/age slack), so exactly the 3 oldest of docD's 5 go.
    const bounds: SnapshotBounds = { countPerDoc: 2, totalBytes: 1_000, maxAgeMs: 1_000_000 };
    const allMeta = [
      doc('docD', [
        entry('d1', NOW - 500, 10),
        entry('d2', NOW - 400, 10),
        entry('d3', NOW - 300, 10),
        entry('d4', NOW - 200, 10),
      ]),
    ];
    const plan = planSnapshotWrite(allMeta, 'docD', 'incD', 10, NOW, bounds);
    expect(plan.store).toBe(true);
    if (plan.store) {
      // Oldest-to-newest, not newest-first, not unordered; d4 + incD (the two newest) survive.
      expect(plan.evictIds).toEqual(['d1', 'd2', 'd3']);
    }
  });
});

// ---------------------------------------------------------------------------------------------
// E — TWO-DOC AXIS DISCRIMINATORS (D-16: count PER-DOC; bytes + age GLOBAL)
// ---------------------------------------------------------------------------------------------

describe('planSnapshotWrite — axis discriminators (D-16)', () => {
  it('E1 — PER-DOC count: each doc evicts within itself down to the cap, never across docs', () => {
    // Only count bites (bytes/age slack). Both docs exceed the per-doc cap of 2.
    const bounds: SnapshotBounds = { countPerDoc: 2, totalBytes: 100_000, maxAgeMs: 1_000_000 };
    const allMeta = [
      doc('docA', [
        entry('a1', NOW - 500, 10),
        entry('a2', NOW - 400, 10),
        entry('a3', NOW - 300, 10),
        entry('a4', NOW - 200, 10),
      ]),
      doc('docB', [entry('b1', NOW - 450, 10), entry('b2', NOW - 350, 10), entry('b3', NOW - 250, 10)]),
    ];
    // Incoming lands in docA → docA has 5 (excess 3), docB has 3 (excess 1). Total excess = 4.
    const plan = planSnapshotWrite(allMeta, 'docA', 'incA', 10, NOW, bounds);
    expect(plan.store).toBe(true);
    if (!plan.store) return;

    // Total evictions = excess-A + excess-B (a GLOBAL-count impl would evict a different count).
    expect(plan.evictIds).toHaveLength(4);
    // Each doc's evicted ids are a PREFIX of that doc's oldest entries (evictIds is oldest-first).
    expect(plan.evictIds.filter((id) => id.startsWith('a'))).toEqual(['a1', 'a2', 'a3']);
    expect(plan.evictIds.filter((id) => id.startsWith('b'))).toEqual(['b1']);
    // No doc's NEWEST entries are evicted.
    for (const survivor of ['a4', 'incA', 'b2', 'b3']) expect(plan.evictIds).not.toContain(survivor);
  });

  it('E2 — GLOBAL bytes: evicts globally-oldest until the store fits, across docs', () => {
    // Count + age slack; neither doc alone exceeds the byte cap, but the SUM does (heavy a1).
    const bounds: SnapshotBounds = { countPerDoc: 100, totalBytes: 100, maxAgeMs: 1_000_000 };
    const allMeta = [
      doc('docA', [entry('a1', NOW - 500, 80), entry('a2', NOW - 400, 10)]), // 90
      doc('docB', [entry('b1', NOW - 300, 10), entry('b2', NOW - 200, 10)]), // 20
    ];
    const incoming = { id: 'incB', ts: NOW, bytes: 10 }; // → projected total 120 > 100
    const plan = planSnapshotWrite(allMeta, 'docB', incoming.id, incoming.bytes, NOW, bounds);
    expect(plan.store).toBe(true);

    // A per-doc-only byte impl would evict nothing here (each doc < cap) and stay OVER 100.
    const totalBytes = survivorsAfter(allMeta, 'docB', incoming, plan).reduce((sum, s) => sum + s.bytes, 0);
    expect(totalBytes).toBeLessThanOrEqual(bounds.totalBytes);
  });

  it('E3 — GLOBAL age: every entry past the cutoff is evicted regardless of doc; fresh untouched', () => {
    // Count + byte slack; old entries live in docA, fresh in docB, cutoff brackets them.
    const bounds: SnapshotBounds = { countPerDoc: 100, totalBytes: 100_000, maxAgeMs: 10_000 };
    const allMeta = [
      doc('docA', [entry('a1', NOW - 50_000, 10), entry('a2', NOW - 40_000, 10)]), // both stale
      doc('docB', [entry('b1', NOW - 5_000, 10), entry('b2', NOW - 1_000, 10)]), // both fresh
    ];
    // Incoming lands in docB — so an age impl scoped to the incoming doc would MISS docA's stale rows.
    const plan = planSnapshotWrite(allMeta, 'docB', 'incB', 10, NOW, bounds);
    expect(plan.store).toBe(true);
    if (!plan.store) return;

    // Stale rows in the OTHER doc are evicted; fresh rows (and the incoming) are untouched.
    expect([...plan.evictIds].sort()).toEqual(['a1', 'a2']);
    for (const fresh of ['b1', 'b2', 'incB']) expect(plan.evictIds).not.toContain(fresh);
  });
});

// ---------------------------------------------------------------------------------------------
// G — no test pins an exported bound value; DEFAULT_BOUNDS is asserted by SHAPE only
// ---------------------------------------------------------------------------------------------

describe('DEFAULT_BOUNDS', () => {
  it('is a positive-valued bounds record (shape, not the proposed numbers — 7.2 chooses those)', () => {
    expect(Object.keys(DEFAULT_BOUNDS).sort()).toEqual(['countPerDoc', 'maxAgeMs', 'totalBytes']);
    expect(DEFAULT_BOUNDS.countPerDoc).toBeGreaterThan(0);
    expect(DEFAULT_BOUNDS.totalBytes).toBeGreaterThan(0);
    expect(DEFAULT_BOUNDS.maxAgeMs).toBeGreaterThan(0);
  });
});
