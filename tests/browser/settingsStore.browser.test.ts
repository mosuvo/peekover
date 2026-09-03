// Task 1.1 (+ 1.3 below) — the REAL-ENGINE settings-store proof, both Chromium + Firefox.
// [spec 004 §3 persistence] · plan.md §Store foundation.
//
// The IndexedDB SCHEMA UPGRADE (v1 → the store's current version) and storage round-trip are
// JSDOM-BLIND: jsdom has no
// IndexedDB at all, and even where a fake exists it does not exercise the engine's real
// open/upgrade/commit path (the retro standing rule — storage + upgrade proven in a real
// engine, never jsdom). So these run against each engine's OWN IndexedDB.
//
// Properties proven here (task 1.1), all real-engine, all non-vacuous:
//   1. ROUND-TRIP + MERGE. putSettings writes; getSettings reads back; a patch merges onto
//      the current row rather than replacing it. State-tolerant (asserts only the fields it
//      writes), so a leftover row can never mask a bug.
//   2. ADDITIVE UPGRADE. A hand-built v1 DB (the pre-004 folders/recents/pins schema)
//      seeded with one row per store, then opened at the store's current version through the
//      REAL store layer,
//      PRESERVES every seeded row AND gains a working `settings` store. RED-FIRST: if the
//      upgrade dropped/recreated the stores the seeded rows would vanish and the preservation
//      asserts FAIL (verified red by patching onupgradeneeded to delete+recreate — recorded
//      in progress.md). NON-VACUOUS: the seeded rows are genuinely read back through the
//      store, and the on-disk schema (the store's declared version + the four pre-existing store
//      names) is asserted directly.

import { describe, it, expect, afterEach } from 'vitest';
import {
  putFolder,
  getFolders,
  getRecents,
  getPins,
  getSettings,
  putSettings,
  getCaptureEnabled,
  setCaptureEnabled,
  wipeAll,
  describeStored,
  __resetConnectionForTest,
  DB_NAME,
  DB_VERSION,
  DEFAULT_SETTINGS,
} from '../../src/app/store';

// The upgrade test seeds via RAW IndexedDB: it must build the *v1* schema by hand, which the
// store layer (now at a newer DB_VERSION) can no longer open.

/** Delete the whole peekover DB and RESOLVE ONLY once it is truly gone (onsuccess). We never
 *  resolve on `blocked`: seedV1 then opens at v1, which a surviving higher-version DB would reject with a
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
 *  so the store's subsequent open (at its current version) is not blocked by this v1 connection. */
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
// inherit one. Deleting the whole DB is the strongest reset and re-creates fresh at the store's
// current version on the next store open.
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

  it('putSettings({codeTheme}) writes, getSettings reads it back — the D-12 hand-enumeration trap task 5.1 filed, closed at task 5.2', async () => {
    // Red-first (task 5.2): before store.ts's getSettings() extended its hand-enumeration to
    // include codeTheme, this wrote fine but read back DEFAULT_SETTINGS.codeTheme regardless —
    // the exact signature this assertion pins.
    await putSettings({ codeTheme: 'vitesse-black' });
    expect(await getSettings()).toMatchObject({ codeTheme: 'vitesse-black' });

    // Merges onto the row like every other field — a second patch untouched by codeTheme survives it.
    await putSettings({ theme: 'dark' });
    const s = await getSettings();
    expect(s.codeTheme).toBe('vitesse-black');
    expect(s.theme).toBe('dark');
  });

  it('putSettings({lastExportFormat}) writes, getSettings reads it back — the D-6 hand-enumeration trap task 8.2 filed and closed in the same task', async () => {
    // Red-first, same class as the codeTheme test above: before store.ts's getSettings() extended
    // its hand-enumeration to include lastExportFormat, this would write fine but read back
    // DEFAULT_SETTINGS.lastExportFormat (null) regardless — the exact signature this pins.
    await putSettings({ lastExportFormat: 'pdf' });
    expect(await getSettings()).toMatchObject({ lastExportFormat: 'pdf' });

    // Merges onto the row like every other field — a second patch untouched by it survives.
    await putSettings({ theme: 'dark' });
    const s = await getSettings();
    expect(s.lastExportFormat).toBe('pdf');
    expect(s.theme).toBe('dark');
  });
});

describe('settings store — additive upgrade (real engine; jsdom-blind)', () => {
  it('an additive upgrade PRESERVES folders/recents/pins AND adds a working settings store (red-first vs a drop/recreate)', async () => {
    // Start strictly below the store's version: remove any existing peekover DB, then hand-build v1 and seed it.
    await resetAndSettle();
    await deleteDatabase(DB_NAME);
    await seedV1();

    // Open through the REAL store layer (at its declared DB_VERSION). idbCore's additive
    // onupgradeneeded creates the stores the current schema adds and leaves the three seeded
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
    expect(await getSettings()).toEqual({
      theme: 'dark',
      tocOpen: true,
      tocWidth: 321,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });

    // Assert the on-disk schema directly: the store's declared version, all four pre-existing
    // stores present.
    await resetAndSettle();
    const raw = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME); // no version → read the current schema as-is
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    expect(raw.version).toBe(DB_VERSION);
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
    expect(before.settings).toEqual({
      theme: 'dark',
      tocOpen: true,
      tocWidth: 300,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });
    expect(before.total).toBe(2); // 1 folder + the settings row
    const beforeText = before.lines.join(' ');
    expect(beforeText).toContain('display settings');
    // 006 task 1.4 re-scoped the settings line: the "no file contents" fragment (part of the
    // now-false store-wide claim) was dropped; it still discloses the on-device home.
    expect(beforeText).toContain('stored on-device');

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

// --- task 1.5 (D-12): the capture off-switch is its OWN settings ROW ---------------
//
// The flag is a SECOND row in the settings store, keyed 'capture', with its own record type — so
// `getSettings()`'s hand-enumeration (plan §4-1's trap) never sees it and stays byte-untouched. All
// of this is jsdom-blind (IndexedDB + the real read/write path), so it is proven here, non-vacuously.

describe('capture flag — its own settings row, getSettings untouched (D-12, task 1.5, real engine)', () => {
  it('defaults ON with no row; round-trips false/true; and getSettings stays exactly {theme,tocOpen,tocWidth,codeTheme,lastExportFormat}', async () => {
    // Piece 1 DEFAULT — a fresh store has no 'capture' row, so read-with-default returns on.
    expect(await getCaptureEnabled()).toBe(true);

    // ★ Piece 2 SHAPE INVARIANT — with NO reader row, getSettings returns exactly the five fields
    // (task 8.2 grew this from four to five — D-6's own field).
    expect(Object.keys(await getSettings()).sort()).toEqual([
      'codeTheme',
      'lastExportFormat',
      'theme',
      'tocOpen',
      'tocWidth',
    ]);

    // Piece 1 ROUND-TRIP — write the capture row false; it reads back false, a second row in the
    // SAME store as the reader settings.
    await setCaptureEnabled(false);
    expect(await getCaptureEnabled()).toBe(false);

    // ★ Piece 2 (the load-bearing half): a stored 'capture' row does NOT bleed into getSettings —
    // its shape is still exactly the five fields, whether or not a 'reader' row also exists. A
    // second shared-record field bleeding across rows would redden this.
    expect(Object.keys(await getSettings()).sort()).toEqual([
      'codeTheme',
      'lastExportFormat',
      'theme',
      'tocOpen',
      'tocWidth',
    ]);
    await putSettings({ theme: 'dark' }); // now BOTH rows exist in the settings store…
    expect(Object.keys(await getSettings()).sort()).toEqual([
      'codeTheme',
      'lastExportFormat',
      'theme',
      'tocOpen',
      'tocWidth',
    ]);
    expect(await getSettings()).toMatchObject({ theme: 'dark' }); // reader row unaffected by capture
    expect(await getCaptureEnabled()).toBe(false); // capture row unaffected by the reader write

    // Round-trip back to on — the row persists true (a toggled-back-on state is still a stored row).
    await setCaptureEnabled(true);
    expect(await getCaptureEnabled()).toBe(true);
  });

  it('describeStored reads BOTH settings rows: a stored capture flag is counted and disclosed (Piece 3)', async () => {
    // No capture row yet → captureFlag is null, no capture line, not counted.
    const fresh = await describeStored();
    expect(fresh.captureFlag).toBeNull();
    expect(fresh.lines.join(' ')).not.toMatch(/snapshot capture is turned/i);

    // Toggle capture off → a 'capture' row exists → the panel discloses it (no hidden state).
    await setCaptureEnabled(false);
    const after = await describeStored();
    expect(after.captureFlag).toBe(false);
    expect(after.total).toBe(1); // the capture row is the only stored record, and it IS counted
    expect(after.lines.join(' ')).toMatch(/snapshot capture is turned off/i);

    // A reader row alongside it → BOTH rows counted (the two-row read is genuine, not either/or).
    await putSettings({ theme: 'dark' });
    const both = await describeStored();
    expect(both.captureFlag).toBe(false);
    expect(both.settings).toEqual({
      theme: 'dark',
      tocOpen: null,
      tocWidth: null,
      codeTheme: 'github-dark',
      lastExportFormat: null,
    });
    expect(both.total).toBe(2); // reader row + capture row
  });

  it('wipeAll resets the flag to its default (on) automatically — read-with-default, no wipeAll change (Piece 4)', async () => {
    // Seed the flag off — and prove it (non-vacuous: the reset below is a real transition, not a
    // store that was on all along).
    await setCaptureEnabled(false);
    expect(await getCaptureEnabled()).toBe(false);

    await wipeAll();

    // The 'capture' row was cleared with the rest of the settings store, so read-with-default now
    // returns the default (on). wipeAll gained NO capture-specific code — the reset is automatic.
    expect(await getCaptureEnabled()).toBe(true);
    const after = await describeStored();
    expect(after.captureFlag).toBeNull(); // no row after wipe
    expect(after.total).toBe(0);
  });
});
