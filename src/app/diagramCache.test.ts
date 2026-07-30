// Task 4.1 — the PURE diagram-cache layer: D-3's key derivation and D-4's eviction planning.
// No engine, no IDB, no DOM — hashing and arithmetic — so it lives in the fast unit project with
// no jsdom pragma, exactly like `snapshots.test.ts` and `recents.test.ts`. `crypto.subtle` comes
// from the platform (Node's WebCrypto here, the page's in the browser); it is not stubbed.
//
// ★ GROUP 4's RED-FIRSTS ARE CORRECTNESS CONTROLS, NOT TRUST CONTROLS. Groups 2–3 proved "nothing
// leaks", so their controls fetched when they shouldn't. Nothing here can leak — this module has
// no I/O at all. What it can do is return the WRONG ANSWER: a key that collides when its inputs
// differ (or misses when they are identical), and an eviction that removes the WRONG ROWS. The
// two named cases below are built to fail on identity — a named key, a named row — never on a
// count, because a count is exactly what a wrong-axis implementation still gets right.
//
// Fixtures use SMALL bounds passed EXPLICITLY so cases are readable, and — per D-8 — NO test pins
// an exported bound VALUE as an expected number. The values are proposed, not chosen; 8.4 picks
// them and 8.5 sets them, and these cases must stay green across that swap.

import { describe, it, expect } from 'vitest';
import {
  diagramCacheKey,
  planDiagramWrite,
  bytesOf,
  PROPOSED_BOUNDS,
  PROPOSED_DIAGRAM_COUNT,
  PROPOSED_DIAGRAM_TOTAL_BYTES,
  PROPOSED_DIAGRAM_MAX_AGE_MS,
  type DiagramMetaRow,
  type DiagramBounds,
} from './diagramCache';
import { SEP } from './recents';
import { bytesOf as snapshotBytesOf } from './snapshots';

/** A fixed millisecond clock, so every fixture's ages read relative to it. */
const NOW = 1_000_000;

const FENCE = 'graph TD;\n  A[Start] --> B{Choice};\n  B --> C[End];';
const VERSION = '11.16.0';

/**
 * A fixture row that ALSO carries a creation timestamp. `DiagramMetaRow` has no `createdAt` field
 * — that absence is D-4's design — so this extra property exists ONLY to make the
 * lastUsed-vs-creation discriminator expressible: it is what an implementation ordering on the
 * wrong axis would read. It is assignable to `DiagramMetaRow`, so the planner never sees it.
 */
type FixtureRow = DiagramMetaRow & { createdAt: number };

const row = (key: string, lastUsed: number, bytes: number, createdAt = lastUsed): FixtureRow => ({
  key,
  lastUsed,
  bytes,
  createdAt,
});

/** Apply a plan the way the (later) IDB layer would, so post-write bound state is assertable. */
function applyPlan(
  allMeta: readonly DiagramMetaRow[],
  incomingKey: string,
  incomingBytes: number,
  now: number,
  bounds: DiagramBounds,
): DiagramMetaRow[] {
  const plan = planDiagramWrite(allMeta, incomingKey, incomingBytes, now, bounds);
  if (!plan.store) throw new Error('applyPlan called on a refused write');
  const kept = allMeta.filter((r) => !plan.evictKeys.includes(r.key) && r.key !== incomingKey);
  return [...kept, { key: incomingKey, bytes: incomingBytes, lastUsed: now }];
}

const totalBytes = (rows: readonly DiagramMetaRow[]) => rows.reduce((a, r) => a + r.bytes, 0);

// ── D-3: the key ──────────────────────────────────────────────────────────────────────────────

describe('diagramCacheKey (D-3)', () => {
  it('is SHA-256 hex of the fence text, joined to theme and engineVersion by SEP', async () => {
    const key = await diagramCacheKey(FENCE, 'light', VERSION);
    const parts = key.split(SEP);

    // Round-trip: the three components come back out, in order, undamaged.
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(parts[1]).toBe('light');
    expect(parts[2]).toBe(VERSION);
  });

  it('matches the published SHA-256 vectors (it is a real digest, not a stand-in)', async () => {
    // Known-answer test: without it, "64 hex characters" would pass for any hash-shaped string.
    const empty = await diagramCacheKey('', 'light', VERSION);
    expect(empty.split(SEP)[0]).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );

    const abc = await diagramCacheKey('abc', 'light', VERSION);
    expect(abc.split(SEP)[0]).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is stable: identical inputs derive the identical key (a cache that always misses is not one)', async () => {
    const a = await diagramCacheKey(FENCE, 'dark', VERSION);
    const b = await diagramCacheKey(FENCE, 'dark', VERSION);
    expect(a).toBe(b);
  });

  it('★ two themes of ONE diagram derive TWO DISTINCT keys', async () => {
    const light = await diagramCacheKey(FENCE, 'light', VERSION);
    const dark = await diagramCacheKey(FENCE, 'dark', VERSION);

    // The hash and the engine version are IDENTICAL — only the effective theme differs. If the
    // key were `hash` alone (theme/version in the record body), these two would be the SAME key.
    expect(light.split(SEP)[0]).toBe(dark.split(SEP)[0]);
    expect(light.split(SEP)[2]).toBe(dark.split(SEP)[2]);
    expect(light).not.toBe(dark);
  });

  it('★ two themes of ONE diagram COEXIST AS TWO ROWS (§3.7, asserted on the store)', async () => {
    const light = await diagramCacheKey(FENCE, 'light', VERSION);
    const dark = await diagramCacheKey(FENCE, 'dark', VERSION);

    // The claim at the level it actually matters: writing both leaves TWO rows, neither evicting
    // the other, with bound headroom to spare. Under a hash-only key the second write REPLACES
    // the first (one keyPath, one row), so the very next flip back misses — and §3.7 requires
    // that after the first flip every subsequent flip in EITHER direction is a hit.
    const bounds: DiagramBounds = { count: 10, totalBytes: 10_000, maxAgeMs: 1_000_000_000 };
    const afterLight = applyPlan([], light, 500, NOW, bounds);
    const afterDark = applyPlan(afterLight, dark, 500, NOW + 1, bounds);

    expect(afterDark).toHaveLength(2);
    expect(afterDark.map((r) => r.key).sort()).toEqual([light, dark].sort());
  });

  it('sepia is a third distinct row, and the theme in the key is the EFFECTIVE theme', async () => {
    const keys = await Promise.all(
      (['light', 'dark', 'sepia'] as const).map((t) => diagramCacheKey(FENCE, t, VERSION)),
    );
    expect(new Set(keys).size).toBe(3);
    // `'auto'` cannot appear in a key: `diagramCacheKey` takes `EffectiveTheme`, so passing a
    // `ThemeSetting` of `'auto'` is a COMPILE error, not a runtime collision between two
    // different renderings sharing one row.
    expect(keys.map((k) => k.split(SEP)[1])).toEqual(['light', 'dark', 'sepia']);
  });

  it('an engine version bump makes old rows unreachable rather than wrong', async () => {
    const before = await diagramCacheKey(FENCE, 'light', '11.16.0');
    const after = await diagramCacheKey(FENCE, 'light', '11.17.0');
    expect(before).not.toBe(after);
  });

  it('different fence text derives a different key (no collision on distinct content)', async () => {
    const a = await diagramCacheKey(FENCE, 'light', VERSION);
    const b = await diagramCacheKey(`${FENCE}\n  C --> D;`, 'light', VERSION);
    expect(a).not.toBe(b);
  });

  it('★ carries SEP as six VISIBLE characters and NO NUL byte', async () => {
    const key = await diagramCacheKey(FENCE, 'light', VERSION);
    // AGENTS.md's control-character rule. `SEP` is backslash-u-0-0-0-0 as TEXT; if it were ever
    // rewritten to an actual U+0000 the key would carry a control byte into IndexedDB.
    expect(key).not.toContain('\u0000');
    expect(key).toContain('\\u0000');
    expect(SEP).toHaveLength(6);
  });
});

// ── D-4: eviction planning ────────────────────────────────────────────────────────────────────

describe('planDiagramWrite — the three GLOBAL sweeps (D-4)', () => {
  it('GLOBAL age: evicts every row last used before the cutoff, regardless of headroom', () => {
    const bounds: DiagramBounds = { count: 100, totalBytes: 1_000_000, maxAgeMs: 10_000 };
    const rows = [
      row('stale-1', NOW - 50_000, 10),
      row('fresh-1', NOW - 5_000, 10),
      row('stale-2', NOW - 20_000, 10),
      row('fresh-2', NOW - 1, 10),
    ];

    const plan = planDiagramWrite(rows, 'incoming', 10, NOW, bounds);

    expect(plan).toEqual({ store: true, evictKeys: ['stale-1', 'stale-2'] });
  });

  it('GLOBAL count: evicts the least-recently-used rows down to the cap', () => {
    const bounds: DiagramBounds = { count: 3, totalBytes: 1_000_000, maxAgeMs: 1_000_000_000 };
    const rows = [
      row('lru-1', NOW - 900, 10),
      row('mid', NOW - 500, 10),
      row('lru-2', NOW - 800, 10),
      row('recent', NOW - 10, 10),
    ];

    // Five rows post-write, cap 3 → the two least-recently-used go, oldest-first.
    const plan = planDiagramWrite(rows, 'incoming', 10, NOW, bounds);

    expect(plan).toEqual({ store: true, evictKeys: ['lru-1', 'lru-2'] });
  });

  it('GLOBAL bytes: evicts least-recently-used rows until the byte bound holds', () => {
    const bounds: DiagramBounds = { count: 100, totalBytes: 1_000, maxAgeMs: 1_000_000_000 };
    const rows = [
      row('big-lru', NOW - 900, 600),
      row('big-recent', NOW - 10, 600),
      row('small-mid', NOW - 500, 100),
    ];

    // Post-write total = 600 + 600 + 100 + 200 = 1500 over a 1000 bound. Evicting `big-lru`
    // leaves 900 — under the bound — so `small-mid` survives despite also being older than
    // `big-recent`. The sweep stops as soon as the bound holds.
    const plan = planDiagramWrite(rows, 'incoming', 200, NOW, bounds);

    expect(plan).toEqual({ store: true, evictKeys: ['big-lru'] });
  });

  it('evicts nothing when all three bounds already hold', () => {
    const bounds: DiagramBounds = { count: 10, totalBytes: 10_000, maxAgeMs: 1_000_000_000 };
    const rows = [row('a', NOW - 100, 50), row('b', NOW - 50, 50)];

    expect(planDiagramWrite(rows, 'incoming', 50, NOW, bounds)).toEqual({
      store: true,
      evictKeys: [],
    });
  });

  it('MULTI-BOUND SIMULTANEITY: the store is within ALL THREE bounds afterwards', () => {
    const bounds: DiagramBounds = { count: 4, totalBytes: 1_000, maxAgeMs: 10_000 };
    // Violates all three at once: 7 rows post-write (cap 4), 1_700 bytes (cap 1_000), and two
    // rows past the age cutoff.
    const rows = [
      row('ancient-1', NOW - 90_000, 300),
      row('ancient-2', NOW - 40_000, 300),
      row('old', NOW - 9_000, 300),
      row('mid-1', NOW - 5_000, 300),
      row('mid-2', NOW - 3_000, 200),
      row('recent', NOW - 100, 200),
    ];

    const survivors = applyPlan(rows, 'incoming', 100, NOW, bounds);

    expect(survivors.length).toBeLessThanOrEqual(bounds.count);
    expect(totalBytes(survivors)).toBeLessThanOrEqual(bounds.totalBytes);
    for (const r of survivors) {
      expect(r.lastUsed).toBeGreaterThanOrEqual(NOW - bounds.maxAgeMs);
    }
    // And the incoming row is present — a plan that satisfies the bounds by discarding the row it
    // was asked to store would pass the three checks above and be useless.
    expect(survivors.map((r) => r.key)).toContain('incoming');
  });

  it('SINGLE-OVERSIZED: refused whole, with NO eviction', () => {
    const bounds: DiagramBounds = { count: 2, totalBytes: 1_000, maxAgeMs: 10_000 };
    // A store that WOULD be swept on all three axes if the write went ahead — so "no eviction"
    // is a real claim, not a vacuous one against an already-compliant store.
    const rows = [
      row('ancient', NOW - 90_000, 400),
      row('old', NOW - 50_000, 400),
      row('recent', NOW - 10, 400),
    ];

    const plan = planDiagramWrite(rows, 'incoming', 1_001, NOW, bounds);

    expect(plan).toEqual({ store: false, reason: 'oversized' });
    expect(plan).not.toHaveProperty('evictKeys');
    // The disposition is skip-the-cache-and-re-render, degrading QUIETLY: there is no message
    // field, no error, and nothing for a user to act on. The refusal is the whole vocabulary.
  });

  it('a write at the exact byte bound is stored, not refused (the boundary is inclusive)', () => {
    const bounds: DiagramBounds = { count: 10, totalBytes: 1_000, maxAgeMs: 1_000_000_000 };
    expect(planDiagramWrite([], 'incoming', 1_000, NOW, bounds)).toEqual({
      store: true,
      evictKeys: [],
    });
  });

  it('re-writing an existing key REPLACES its row rather than adding one', () => {
    const bounds: DiagramBounds = { count: 2, totalBytes: 1_000, maxAgeMs: 1_000_000_000 };
    const rows = [row('dup', NOW - 900, 100), row('other', NOW - 500, 100)];

    // Two rows, cap 2, re-writing one of them: post-write there are still 2 rows, so nothing is
    // evicted. An append-shaped projection would see 3, and evict `other` for no reason.
    const plan = planDiagramWrite(rows, 'dup', 150, NOW, bounds);
    expect(plan).toEqual({ store: true, evictKeys: [] });

    const survivors = applyPlan(rows, 'dup', 150, NOW, bounds);
    expect(survivors).toHaveLength(2);
    expect(survivors.find((r) => r.key === 'dup')).toEqual({ key: 'dup', bytes: 150, lastUsed: NOW });
  });

  it('is deterministic and mutates nothing', () => {
    const bounds: DiagramBounds = { count: 2, totalBytes: 1_000, maxAgeMs: 10_000 };
    const rows = [row('a', NOW - 900, 100), row('b', NOW - 500, 100), row('c', NOW - 100, 100)];
    const before = JSON.stringify(rows);

    const first = planDiagramWrite(rows, 'incoming', 100, NOW, bounds);
    const second = planDiagramWrite(rows, 'incoming', 100, NOW, bounds);

    expect(first).toEqual(second);
    expect(JSON.stringify(rows)).toBe(before);
  });
});

// ── ★ THE D-4 DISCRIMINATOR ───────────────────────────────────────────────────────────────────

describe('★ planDiagramWrite orders on lastUsed, NOT creation (the D-4 discriminator)', () => {
  // This fixture exists to make the two orderings DISAGREE about WHICH ROW GOES. Only the count
  // bound binds (age and bytes have headroom), so exactly one row is evicted, and the two
  // candidate axes name DIFFERENT rows:
  //
  //   key                | createdAt   | lastUsed   | oldest by createdAt | oldest by lastUsed
  //   -------------------+-------------+------------+---------------------+-------------------
  //   read-now-old-row   | NOW-900_000 | NOW-1_000  | ← 1st (evicted)     | 3rd (kept)
  //   stale-new-row      | NOW- 10_000 | NOW-500_000| 3rd (kept)          | ← 1st (evicted)
  //   middle-row         | NOW-500_000 | NOW-100_000| 2nd                 | 2nd
  //
  // `read-now-old-row` is D-4's actual scenario: the light rendering of the diagram the user is
  // reading RIGHT NOW, first rendered long ago. A creation-ordered cache throws it away and the
  // very next theme flip misses — the §3.7 round trip that the cache exists to make a hit.
  const bounds: DiagramBounds = { count: 3, totalBytes: 1_000_000, maxAgeMs: 1_000_000_000 };
  const rows: FixtureRow[] = [
    row('read-now-old-row', NOW - 1_000, 100, NOW - 900_000),
    row('stale-new-row', NOW - 500_000, 100, NOW - 10_000),
    row('middle-row', NOW - 100_000, 100, NOW - 500_000),
  ];

  it('evicts the least-recently-USED row by NAME, not merely the right NUMBER of rows', () => {
    const plan = planDiagramWrite(rows, 'incoming', 100, NOW, bounds);
    expect(plan.store).toBe(true);

    // ★ Identity, not count. A creation-ordered implementation evicts exactly ONE row here too —
    // it is `read-now-old-row`, the wrong one — so `toHaveLength(1)` would pass against the bug.
    expect(plan.store === true && plan.evictKeys).toEqual(['stale-new-row']);
  });

  it('never evicts the row being read right now, however long ago it was first rendered', () => {
    const plan = planDiagramWrite(rows, 'incoming', 100, NOW, bounds);
    const evicted = plan.store === true ? plan.evictKeys : [];

    expect(evicted).not.toContain('read-now-old-row');
    expect(evicted).not.toContain('middle-row');
    // The fixture's ONLY difference between the two orderings is which of these two rows goes.
    expect(rows.find((r) => r.key === 'read-now-old-row')!.createdAt).toBeLessThan(
      rows.find((r) => r.key === 'stale-new-row')!.createdAt,
    );
    expect(rows.find((r) => r.key === 'read-now-old-row')!.lastUsed).toBeGreaterThan(
      rows.find((r) => r.key === 'stale-new-row')!.lastUsed,
    );
  });

  it('a HIT that touches lastUsed changes WHICH row the next write evicts', () => {
    // The touch is the mechanism the ordering depends on: reading `stale-new-row` moves it out of
    // the eviction seat and puts `middle-row` in it. If a hit did not touch `lastUsed`, this
    // assertion would still name `stale-new-row`.
    const touched = rows.map((r) => (r.key === 'stale-new-row' ? { ...r, lastUsed: NOW - 5 } : r));

    const plan = planDiagramWrite(touched, 'incoming', 100, NOW, bounds);
    expect(plan.store === true && plan.evictKeys).toEqual(['middle-row']);
  });
});

// ── Boundaries this task is fenced by ─────────────────────────────────────────────────────────

describe('module boundaries (4.1 fences)', () => {
  it('bytesOf is the SAME function as snapshots.ts exports, not a re-implementation', () => {
    expect(bytesOf).toBe(snapshotBytesOf);
    // Encoded byte length, not string length — the multi-byte character that discriminates them.
    expect(bytesOf('é')).toBe(2);
  });

  it('PROPOSED_BOUNDS is composed of the three named tuneable constants', () => {
    // Structural, deliberately NOT numeric: D-8 forbids this task from treating any bound value
    // as chosen, so no case here may pin one as an expected number. 8.4 chooses; 8.5 sets them;
    // these cases stay green across that swap because they assert wiring, not values.
    expect(PROPOSED_BOUNDS).toEqual({
      count: PROPOSED_DIAGRAM_COUNT,
      totalBytes: PROPOSED_DIAGRAM_TOTAL_BYTES,
      maxAgeMs: PROPOSED_DIAGRAM_MAX_AGE_MS,
    });
  });
});
