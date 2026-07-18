// Task 1.1 (+ 1.3 below) — the REAL-ENGINE settings-store proof, both Chromium + Firefox.
// [spec 004 §3 persistence] · plan.md §Store foundation.
//
// The IndexedDB SCHEMA UPGRADE (v1→v2) and storage round-trip are JSDOM-BLIND: jsdom has no
// IndexedDB at all, and even where a fake exists it does not exercise the engine's real
// open/upgrade/commit path (the retro standing rule — storage + upgrade proven in a real
// engine, never jsdom). So these run against each engine's OWN IndexedDB.
//
// Properties proven here (task 1.1), all real-engine, all non-vacuous:
//   1. ROUND-TRIP + MERGE. putSettings writes; getSettings reads back; a patch merges onto
//      the current row rather than replacing it. State-tolerant (asserts only the fields it
//      writes), so a leftover row can never mask a bug.
//   2. ADDITIVE v1→v2 UPGRADE. A hand-built v1 DB (the pre-004 folders/recents/pins schema)
//      seeded with one row per store, then opened at v2 through the REAL store layer,
//      PRESERVES every seeded row AND gains a working `settings` store. RED-FIRST: if the
//      upgrade dropped/recreated the stores the seeded rows would vanish and the preservation
//      asserts FAIL (verified red by patching onupgradeneeded to delete+recreate — recorded
//      in progress.md). NON-VACUOUS: the seeded rows are genuinely read back through the
//      store, and the on-disk schema (version 2 + the four store names) is asserted directly.

import { describe, it, expect, afterEach } from 'vitest';
import {
  putFolder,
  getFolders,
  getRecents,
  getPins,
  getSettings,
  putSettings,
  wipeAll,
  describeStored,
  __resetConnectionForTest,
  DB_NAME,
  DB_VERSION,
  DEFAULT_SETTINGS,
} from '../../src/app/store';

// The upgrade test seeds via RAW IndexedDB: it must build the *v1* schema by hand, which the
// store layer (now v2) can no longer open.

/** Delete the whole peekover DB and RESOLVE ONLY once it is truly gone (onsuccess). We never
 *  resolve on `blocked`: seedV1 then opens at v1, which a surviving v2 DB would reject with a
 *  VersionError — so a premature resolve would corrupt the test. The memoized connection is
 *  closed + given a tick first, so `blocked` (if it fires at all) clears and success follows. */
function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // onblocked: intentionally do nothing — wait for the connection to drop, then success.
  });
}

/** Close the memoized store connection and wait a macrotask so its async close settles before
 *  a delete/reopen (idbCore's __resetConnectionForTest closes on a microtask). */
async function resetAndSettle(): Promise<void> {
  __resetConnectionForTest();
  await new Promise((r) => setTimeout(r, 0));
}

/** Build the pre-004 v1 schema by hand (folders/recents/pins, NO settings) and seed one row
 *  in each store — the exact on-disk shape a 002 user has before upgrading. Closes when done
 *  so the store's subsequent v2 open is not blocked by this v1 connection. */
async function seedV1(): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('folders', { keyPath: 'id' });
      d.createObjectStore('recents', { keyPath: 'id' });
      d.createObjectStore('pins', { keyPath: 'id' });
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
  await putRaw('folders', { id: 'seed-folder', name: 'seeded-notes', addedAt: 1, lastOpenedAt: 2 });
  await putRaw('recents', { id: 'seed-recent', folderId: 'seed-folder', path: 'a.md', name: 'a.md', openedAt: 3 });
  await putRaw('pins', { id: 'seed-pin', kind: 'file', folderId: 'seed-folder', path: 'a.md', name: 'a.md', pinnedAt: 4 });
  db.close();
}

// Every test leaves a clean slate (DB deleted) so leftover rows never escape this file — a
// settings row is invisible to the pre-1.3 describeStored, but wipe.browser.test.ts must not
// inherit one. Deleting the whole DB is the strongest reset and re-creates fresh at v2 on the
// next store open.
afterEach(async () => {
  await resetAndSettle();
  await deleteDatabase(DB_NAME);
});

describe('settings round-trip + merge (real engine)', () => {
  it('putSettings writes, getSettings reads back, and a patch MERGES onto the current row', async () => {
    await putSettings({ theme: 'dark', tocOpen: null, tocWidth: null });
    expect(await getSettings()).toMatchObject({ theme: 'dark' });

    // A patch touches only its own fields; the rest of the row survives (merge, not replace).
    await putSettings({ tocOpen: true, tocWidth: 288 });
    const s = await getSettings();
    expect(s.theme).toBe('dark'); // untouched by the second patch → the merge is real
    expect(s.tocOpen).toBe(true);
    expect(s.tocWidth).toBe(288);

    // Last-write-wins on a single key, other fields preserved.
    await putSettings({ theme: 'light' });
    const s2 = await getSettings();
    expect(s2.theme).toBe('light');
    expect(s2.tocOpen).toBe(true);
    expect(s2.tocWidth).toBe(288);
  });
});

describe('settings store — additive v1→v2 upgrade (real engine; jsdom-blind)', () => {
  it('the 1→2 upgrade PRESERVES folders/recents/pins AND adds a working settings store (red-first vs a drop/recreate)', async () => {
    // Start strictly below v2: remove any existing peekover DB, then hand-build v1 and seed it.
    await resetAndSettle();
    await deleteDatabase(DB_NAME);
    await seedV1();

    // Open at v2 through the REAL store layer (DB_VERSION === 2). idbCore's additive
    // onupgradeneeded creates only the missing `settings` store and leaves the three seeded
    // stores — and their rows — intact.
    await resetAndSettle();

    // NON-VACUOUS + RED-FIRST: the seeded rows are genuinely read back through the store. Had
    // the upgrade dropped/recreated the stores, these rows would be gone and each toContain
    // would FAIL.
    const folders = await getFolders();
    const recents = await getRecents();
    const pins = await getPins();
    expect(folders.map((f) => f.id)).toContain('seed-folder');
    expect(folders.find((f) => f.id === 'seed-folder')?.name).toBe('seeded-notes');
    expect(recents.map((r) => r.id)).toContain('seed-recent');
    expect(pins.map((p) => p.id)).toContain('seed-pin');

    // The new settings store EXISTS and starts empty → getSettings returns the default…
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    // …and is genuinely writable (round-trips a merged value through the just-created store).
    await putSettings({ theme: 'dark', tocOpen: true, tocWidth: 321 });
    expect(await getSettings()).toEqual({ theme: 'dark', tocOpen: true, tocWidth: 321 });

    // Assert the on-disk schema directly: version 2, all four stores present.
    await resetAndSettle();
    const raw = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME); // no version → read the current schema as-is
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    expect(raw.version).toBe(DB_VERSION);
    expect(raw.version).toBe(2);
    expect(Array.from(raw.objectStoreNames)).toEqual(
      expect.arrayContaining(['folders', 'recents', 'pins', 'settings']),
    );
    raw.close();
  });
});

// --- task 1.3: wipeAll + describeStored include settings ---------------------------
//
// The trust story: the first thing that stores settings ships WITH the way to see and erase
// them. describeStored surfaces a settings line when a row exists; wipeAll erases it so the
// theming falls back to the Auto default. Both are jsdom-blind (IndexedDB), so real-engine.

describe('wipeAll + describeStored include settings (real engine)', () => {
  it('describeStored surfaces the settings line; after wipeAll getSettings falls back to the Auto DEFAULT (red-first vs a settings-skipping wipe)', async () => {
    // Customize settings + store a folder, so the pre/post states are unambiguous.
    await putSettings({ theme: 'dark', tocOpen: true, tocWidth: 300 });
    await putFolder({ id: 'wf', name: 'w', addedAt: 1, lastOpenedAt: 2 });

    const before = await describeStored();
    expect(before.settings).toEqual({ theme: 'dark', tocOpen: true, tocWidth: 300 });
    expect(before.total).toBe(2); // 1 folder + the settings row
    const beforeText = before.lines.join(' ');
    expect(beforeText).toContain('display settings');
    expect(beforeText).toContain('no file contents');

    // The wipe-all control erases settings too.
    await wipeAll();

    // RED-FIRST: with `clear(settings)` removed from wipeAll, the dark row survives → this
    // toEqual(DEFAULT_SETTINGS) FAILS and `after.settings` stays non-null (verified — recorded
    // in progress.md). getSettings falling back to the Auto default is the theming safety net.
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    const after = await describeStored();
    expect(after.settings).toBeNull();
    expect(after.total).toBe(0);
    const afterText = after.lines.join(' ');
    expect(afterText).not.toContain('display settings');
    expect(afterText).toContain('Nothing stored');
  });
});
