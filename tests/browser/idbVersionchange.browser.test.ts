// Task 1.2 — the REAL-ENGINE close-and-drop-on-versionchange proof, both Chromium + Firefox.
// [spec 004 §7-2] · plan.md §Store foundation.
//
// IndexedDB's versionchange choreography is JSDOM-BLIND (jsdom has no real multi-connection
// upgrade path). This is the codebase's FIRST DB_VERSION bump, so the guard ships WITH it:
// idbCore registers `db.onversionchange` on every connection to CLOSE itself when another
// context needs to upgrade, then drops the owner's memo. Without it, a second surface (or a
// reloaded page) opening the new version BLOCKS forever behind the held old connection.
//
// The proof is a matched PAIR that makes the observable difference explicit:
//   POSITIVE — a v1 connection opened THROUGH idbCore steps aside on a competing v2 open, so
//     the v2 open PROCEEDS. This resolves ONLY because idbCore closed v1; remove `db.close()`
//     and this same open blocks → openDb rejects → the await throws (RED-FIRST, recorded in
//     progress.md).
//   NEGATIVE CONTROL (non-vacuous) — a v1 connection opened RAW (no versionchange handler, the
//     pre-1.2 world) does NOT step aside, so the v2 open is BLOCKED and openDb rejects. This is
//     the difference the handler removes, proven live, not asserted.

import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { openDb, getAll, type IdbSchema } from '../../src/app/idbCore';
import { SCHEMA } from '../../src/app/store';

let seq = 0;
const nextName = () => `peekover-vc-${(seq += 1)}-${Math.trunc(performance.now())}`;

const schemaV1 = (name: string): IdbSchema => ({
  name,
  version: 1,
  stores: [{ name: 'a', keyPath: 'id' }],
});
const schemaV2 = (name: string): IdbSchema => ({
  name,
  version: 2,
  stores: [
    { name: 'a', keyPath: 'id' },
    { name: 'b', keyPath: 'id' },
  ],
});

/** Best-effort delete of a throwaway DB; resolves however it ends (never hang a teardown). */
function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

/** Open a connection with NO onversionchange handler — the pre-1.2 world (a connection that
 *  refuses to step aside for an upgrade). */
function rawOpen(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => req.result.createObjectStore('a', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const created: string[] = [];
afterEach(async () => {
  for (const n of created.splice(0)) await deleteDatabase(n);
});

describe('idbCore db.onversionchange — close-and-drop by construction (real engine)', () => {
  it('a held v1 connection steps aside on a competing v2 open, and the v2 open PROCEEDS', async () => {
    const name = nextName();
    created.push(name);

    let versionChangeFired = false;
    const v1 = await openDb(schemaV1(name), {
      onVersionChange: () => {
        versionChangeFired = true;
      },
    });
    expect(v1.version).toBe(1);

    // Open v2 on the same DB while v1 is still held. This resolves ONLY because idbCore's
    // db.onversionchange closed v1 (the negative control below shows a non-stepping connection
    // blocks the same open). RED-FIRST: delete `db.close()` in idbCore and this await throws
    // the "blocked" rejection (verified — recorded in progress.md).
    const v2 = await openDb(schemaV2(name));

    expect(versionChangeFired).toBe(true); // v1 received the signal and stepped aside…
    expect(v2.version).toBe(2); // …and the upgrade completed (not blocked)
    expect(Array.from(v2.objectStoreNames)).toContain('b');
    v2.close();
  });

  it('NEGATIVE CONTROL: a raw (non-stepping) v1 connection BLOCKS the v2 open — the difference the handler removes', async () => {
    const name = nextName();
    created.push(name);

    // Raw v1 open with NO versionchange handler: it will not close on a competing upgrade…
    const rawV1 = await rawOpen(name, 1);
    expect(rawV1.version).toBe(1);

    // …so the v2 open is blocked, and idbCore surfaces the block as a rejection rather than
    // hanging (never a silent stall). This is exactly what the POSITIVE test avoids.
    await expect(openDb(schemaV2(name))).rejects.toThrow(/blocked/i);

    rawV1.close();
  });
});

// --- task 1.1: the REAL peekover schema's v2→v3 additive upgrade preserves existing rows ------
//
// The cases above prove the versionchange CHOREOGRAPHY on throwaway {a,b} DBs; they assert
// nothing about a real user's rows surviving a version bump (the gap plan §3-4 names). 006 bumps
// DB_VERSION 2→3 (adding snapshotMeta + snapshots), a version real data crosses. This case seeds
// a v2-shaped DB with one row per pre-existing store, opens it at v3 through idbCore's real
// additive openDb with the production SCHEMA, and asserts every seeded row survives byte-identical
// AND the two new stores exist and are empty.
//
// It is a LIVE DISCRIMINATOR, not a tautology: the v2 store list is derived FROM the production
// SCHEMA (minus the two 006 stores), so dropping a pre-existing store from store.ts's
// STORES/SCHEMA removes it from the seed, and only THAT store's row-survival case reds (RED-FIRST,
// recorded in progress.md). Seed shapes are exactly those settingsStore.browser.test.ts seeds
// (folders/recents/pins) plus the SettingsRecord row — none invented here.

const NEW_006_STORES = ['snapshotMeta', 'snapshots'];
/** The two stores 007 task 4.2 adds at v4 — absent from BOTH the v2 and the v3 seed below. */
const NEW_007_STORES = ['diagramMeta', 'diagrams'];

/** The pre-006 store list, coupled to the production SCHEMA (so a dropped store drops from the
 *  seed too). keyPath comes straight from SCHEMA — all four pre-existing stores are keyPath 'id'. */
const preexistingStores = (): ReadonlyArray<{ name: string; keyPath: string }> =>
  SCHEMA.stores.filter(
    (s) => !NEW_006_STORES.includes(s.name) && !NEW_007_STORES.includes(s.name),
  );

/** One seeded row per pre-existing store — the exact shapes settingsStore.browser seeds. */
const SEED_ROWS: Record<string, Record<string, unknown>> = {
  folders: { id: 'seed-folder', name: 'seeded-notes', addedAt: 1, lastOpenedAt: 2 },
  recents: { id: 'seed-recent', folderId: 'seed-folder', path: 'a.md', name: 'a.md', openedAt: 3 },
  pins: { id: 'seed-pin', kind: 'file', folderId: 'seed-folder', path: 'a.md', name: 'a.md', pinnedAt: 4 },
  settings: { id: 'reader', theme: 'dark', tocOpen: true, tocWidth: 300 },
};

/** Build an OLD-version DB by raw open (bypassing idbCore, so the upgrade under test is the only
 *  one idbCore performs) holding exactly `stores`, seed the one row each has a shape for in
 *  `rows`, then close so the subsequent newer-version open is not blocked. */
async function seedRawDb(
  name: string,
  version: number,
  stores: ReadonlyArray<{ name: string; keyPath: string }>,
  SEED_ROWS: Record<string, Record<string, unknown>>,
): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const d = req.result;
      for (const s of stores) d.createObjectStore(s.name, { keyPath: s.keyPath });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const putRaw = (store: string, value: unknown) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(store).put(value);
    });
  for (const s of stores) {
    const row = SEED_ROWS[s.name];
    if (row) await putRaw(s.name, row);
  }
  db.close();
}

/** getAll that returns null when the store does not exist, so a dropped store reds its row-survival
 *  case cleanly (a mismatched value) instead of throwing before the assertion is reached. */
async function readStore(db: IDBDatabase, store: string): Promise<unknown[] | null> {
  try {
    return await getAll<unknown>(db, store);
  } catch {
    return null;
  }
}

/** The production SCHEMA as it stood at v3 — store.ts's stores minus the two 007 task 4.2 adds,
 *  pinned to version 3. Still live-coupled: dropping or renaming a store in store.ts drops it
 *  here too, so its row-survival case below reds. (Before 4.2 this was `SCHEMA` itself; SCHEMA is
 *  now v4, and 006's proof is specifically the SINGLE additive v2→v3 step, so it is pinned rather
 *  than allowed to silently become a v2→v4 jump. The v3→v4 step is the next describe.) */
const schemaAtV3 = (name: string): IdbSchema => ({
  name,
  version: 3,
  stores: SCHEMA.stores.filter((s) => !NEW_007_STORES.includes(s.name)),
});

describe('peekover schema v2→v3 additive upgrade preserves existing rows (real engine)', () => {
  const name = nextName();
  let v3!: IDBDatabase;

  beforeAll(async () => {
    // Seed a v2-shaped DB, then open it at v3 through idbCore's real additive openDb with the
    // production stores (name overridden to this throwaway DB; the store list is store.ts's).
    await seedRawDb(name, 2, preexistingStores(), SEED_ROWS);
    v3 = await openDb(schemaAtV3(name));
  });
  afterAll(async () => {
    v3?.close();
    await deleteDatabase(name);
  });

  it('opens at DB_VERSION 3', () => {
    expect(v3.version).toBe(3);
  });

  // One case per pre-existing store: the seeded row survives the upgrade byte-identical. RED-FIRST
  // — dropping a store from store.ts's STORES/SCHEMA drops it from the seed, so its store is absent
  // at v3, readStore returns null, and ONLY this case reds (exactly one).
  it.each(Object.entries(SEED_ROWS))('preserves the seeded %s row byte-identical', async (store, row) => {
    expect(await readStore(v3, store)).toEqual([row]);
  });

  it('creates the two 006 stores, present and EMPTY', async () => {
    const names = Array.from(v3.objectStoreNames);
    expect(names).toContain('snapshotMeta');
    expect(names).toContain('snapshots');
    expect(await getAll(v3, 'snapshotMeta')).toEqual([]);
    expect(await getAll(v3, 'snapshots')).toEqual([]);
  });
});

// --- task 4.2: the REAL peekover schema's v3→v4 additive upgrade preserves existing rows -------
//
// 007 task 4.2 bumps DB_VERSION 3→4, adding `diagramMeta` + `diagrams`. A version real user data
// crosses, so the SAME gap 006 §3-4 names is re-closed for THIS bump, on real engines (jsdom's IDB
// does not run the upgrade path faithfully, so versionchange is jsdom-blind).
//
// The load-bearing claim is NOT "the two new stores appear" — that is trivially true of any
// additive schema and proves nothing about safety. It is that the SIX EXISTING stores' ROWS SURVIVE
// the bump. So the discriminator is pointed at the dangerous half: the v3 seed's store list is
// derived FROM the production SCHEMA (minus the two 4.2 stores), so a SCHEMA that DROPS or RENAMES
// an existing store drops it from the seed, that store is then absent at v4, readStore returns
// null, and ONLY that store's ROW-SURVIVAL case reds — naming the lost rows, not "expected true".
// The new-store-presence case below stays GREEN under that ablation, which is the point.
//
// Seed shapes are the real record types, not invented: folders/recents/pins/settings as above,
// snapshotMeta `{docId, entries:[{id, ts, bytes}]}` (snapshots.ts:33-36) and snapshots `{id, text}`
// (the SnapshotRow put at snapshots.ts:332).

/** The pre-4.2 store list — the SIX stores that exist at v3 — coupled to the production SCHEMA. */
const preexistingV3Stores = (): ReadonlyArray<{ name: string; keyPath: string }> =>
  SCHEMA.stores.filter((s) => !NEW_007_STORES.includes(s.name));

/** One seeded row per store that exists at v3. The four above plus the two 006 stores, whose
 *  keyPaths differ (`docId` / `id`) — taken from SCHEMA, not restated. */
const SEED_ROWS_V3: Record<string, Record<string, unknown>> = {
  ...SEED_ROWS,
  snapshotMeta: {
    docId: 'seed-folder/a.md',
    entries: [{ id: 'seed-snap', ts: 10, bytes: 42 }],
  },
  snapshots: { id: 'seed-snap', text: '# seeded snapshot\n' },
};

describe('peekover schema v3→v4 additive upgrade preserves existing rows (real engine, task 4.2)', () => {
  const name = nextName();
  let v4!: IDBDatabase;

  beforeAll(async () => {
    // Seed a v3-shaped DB with a row in EVERY one of the six existing stores, then open it at v4
    // through idbCore's real additive openDb with the production SCHEMA (name overridden to this
    // throwaway DB; version + stores are store.ts's own — this is the shipped bump, not a mock).
    await seedRawDb(name, 3, preexistingV3Stores(), SEED_ROWS_V3);
    v4 = await openDb({ ...SCHEMA, name });
  });
  afterAll(async () => {
    v4?.close();
    await deleteDatabase(name);
  });

  it('opens at DB_VERSION 4', () => {
    expect(v4.version).toBe(4);
    expect(v4.version).toBe(SCHEMA.version);
  });

  // ★ THE CLAIM: one case per pre-existing store, asserting the seeded row survives the bump
  // byte-identical. This is the assertion the drop/rename ablation reds (RED-FIRST, recorded in
  // progress.md) — readStore yields null for the vanished store, so the failure names the store
  // and the lost row rather than a bare boolean.
  it.each(Object.entries(SEED_ROWS_V3))(
    'preserves the seeded %s row byte-identical across the v3→v4 bump',
    async (store, row) => {
      expect(await readStore(v4, store)).toEqual([row]);
    },
  );

  // Coverage guard: the six cases above are the six stores that exist at v3 — so a store added to
  // SCHEMA without a seed row cannot slip through the survival sweep unasserted.
  it('covers every one of the six pre-4.2 stores with a survival case', () => {
    expect(Object.keys(SEED_ROWS_V3).sort()).toEqual(preexistingV3Stores().map((s) => s.name).sort());
    expect(preexistingV3Stores()).toHaveLength(6);
  });

  // The easy half, asserted separately and deliberately NOT the red-first target.
  it('creates the two 4.2 diagram stores, present and EMPTY (this bump stores nothing)', async () => {
    const names = Array.from(v4.objectStoreNames);
    expect(names).toContain('diagramMeta');
    expect(names).toContain('diagrams');
    expect(await getAll(v4, 'diagramMeta')).toEqual([]);
    expect(await getAll(v4, 'diagrams')).toEqual([]);
  });
});
