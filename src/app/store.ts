// store — Peekover's IndexedDB layer: the CRUD over the stores 002/004 introduce,
// built on the local `idbCore` raw wrapper (NO `idb` dependency — plan.md §Libraries).
//
// Database `peekover` v3, six object stores (plan.md §IndexedDB · 006 §1.2):
//   - folders  : remembered folders. On Chromium a row carries the structured-cloneable
//                FileSystemDirectoryHandle (a capability REF, never file contents); on
//                Firefox the handle is absent (metadata-only, display).
//   - recents  : bounded "recently opened" list (ordering computed by pure recents.ts).
//   - pins     : user-pinned files/folders (ordering computed by pure recents.ts).
//   - settings : one global reader-settings row (theme + TOC carry-over). Added at
//                DB_VERSION 2 (spec 004). The v1→v2 upgrade is ADDITIVE — idbCore's
//                onupgradeneeded only creates the missing `settings` store, never drops
//                or rebuilds folders/recents/pins, so existing 002 rows survive intact.
//                No record-shape migration (that is idbCore's documented STOP signal).
//   - snapshotMeta : per-document snapshot index (spec 006 task 1.1), keyPath `docId`,
//                `{docId, entries:[{id, ts, bytes}]}` — the small bounded rows listing,
//                eviction and byte-accounting read (D-4: never the snapshot text).
//   - snapshots : snapshot bodies (spec 006 task 1.1), keyPath `id`, `{id, text}` — fetched
//                only when a diff renders, never materialised by describeStored (D-4).
//                Both are added EMPTY at DB_VERSION 3: the schema exists but nothing writes to
//                them yet (capture wiring is task 1.4), so "file contents are never stored"
//                stays true through this commit. The v2→v3 upgrade is additive-by-name like
//                v1→v2 (idbCore only creates the missing stores), so existing
//                folders/recents/pins/settings rows survive intact.
//
// Nothing consumes settings yet — group 2 wires the SettingsPort onto get/putSettings. It
// is pure-ish data layer: no DOM, no UI. Browser-only at runtime (IndexedDB is a browser
// global); it is exercised in the real-engine browser project, never jsdom (storage
// persistence + the schema upgrade are jsdom-blind properties — retro standing rule).

import { openDb, get, getAll, put, del, clear, type IdbSchema } from './idbCore';
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings';

// The settings VOCABULARY (the `Settings` shape + its default) is owned by the canonical,
// dependency-free `src/settings/settings.ts` (group 2 consolidation). The store keeps only the
// PERSISTENCE-shaped concerns below (`SettingsRecord` = the row incl. its keyPath id, and
// `SETTINGS_ID`). We re-export the canonical pair so existing callers that import `Settings` /
// `DEFAULT_SETTINGS` from the store keep working unchanged — the store stays the one-stop
// data-layer surface without redefining the type.
export { DEFAULT_SETTINGS };
export type { Settings };

/** Database identity — a single versioned schema (plan.md §IndexedDB). Bumped 1→2 for
 *  the additive `settings` store (spec 004), 2→3 for the additive `snapshotMeta` +
 *  `snapshots` stores (spec 006 task 1.1), which land EMPTY. */
export const DB_NAME = 'peekover';
export const DB_VERSION = 3;

/** The object-store names, as a const map (no magic strings at call sites). */
export const STORES = {
  folders: 'folders',
  recents: 'recents',
  pins: 'pins',
  settings: 'settings',
  // spec 006 task 1.1 — added EMPTY at DB_VERSION 3; nothing writes to them until task 1.4.
  snapshotMeta: 'snapshotMeta',
  snapshots: 'snapshots',
} as const;
export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * A remembered folder. `handle` is present only where the platform can persist a live
 * capability (Chromium): it is a structured-cloneable reference to the directory, not its
 * contents. Firefox rows omit it (a read-only snapshot cannot be reopened silently).
 */
export interface FolderRecord {
  id: string;
  name: string;
  handle?: FileSystemDirectoryHandle;
  addedAt: number;
  lastOpenedAt: number;
}

/** A recently opened file within a remembered folder. Identity is (folderId, path). */
export interface RecentRecord {
  id: string;
  folderId: string;
  path: string;
  name: string;
  openedAt: number;
}

/** A user pin — a file or a whole folder — surfaced for one-gesture reopen. */
export interface PinRecord {
  id: string;
  kind: 'file' | 'folder';
  folderId: string;
  path: string;
  name: string;
  pinnedAt: number;
}

/** The stored settings row: the global {@link Settings} plus its fixed keyPath id. This is the
 *  PERSISTENCE shape (owned here); the `Settings` vocabulary + `DEFAULT_SETTINGS` live in the
 *  canonical `src/settings/settings.ts` (imported + re-exported above). */
export interface SettingsRecord extends Settings {
  id: string;
}

/** The one settings row's key — a single global reader-settings row (no per-doc settings). */
export const SETTINGS_ID = 'reader';

/** The full v3 schema handed to idbCore.openDb. Exported so store.test.ts can assert its
 *  shape at the current version; no production code reads it (openDb below is the sole use). */
export const SCHEMA: IdbSchema = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: [
    { name: STORES.folders, keyPath: 'id' },
    { name: STORES.recents, keyPath: 'id' },
    { name: STORES.pins, keyPath: 'id' },
    { name: STORES.settings, keyPath: 'id' },
    // spec 006 task 1.1 — added EMPTY; snapshotMeta is keyed per document, snapshots per id.
    { name: STORES.snapshotMeta, keyPath: 'docId' },
    { name: STORES.snapshots, keyPath: 'id' },
  ],
};

// One memoized connection per page. openDb is idempotent; memoizing avoids reopening on
// every call and keeps a stable connection for the app page's lifetime.
//
// The `onVersionChange` hook is the other half of idbCore's close-and-drop (spec §7-2): when
// another context (a second surface, a reloaded page) opens a NEWER DB_VERSION, idbCore
// closes THIS connection, then calls this hook so we forget it — the next db() reopens fresh
// at the new version instead of holding a closed/stale connection open and blocking the
// upgrade. This is the same memo the test seam below resets; here it is dropped by construction.
let dbPromise: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDb(SCHEMA, {
      onVersionChange: () => {
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

/**
 * TEST SEAM: drop the memoized connection (and optionally close it) so a fresh open
 * happens next call. Not used in production paths — real-engine tests use it to isolate
 * one test's connection from another's on the shared page. Never touches stored data.
 */
export function __resetConnectionForTest(): void {
  if (dbPromise) {
    void dbPromise.then((d) => d.close()).catch(() => undefined);
  }
  dbPromise = null;
}

// --- folders -----------------------------------------------------------------

export async function putFolder(record: FolderRecord): Promise<void> {
  return put(await db(), STORES.folders, record);
}
export async function getFolder(id: string): Promise<FolderRecord | undefined> {
  return get<FolderRecord>(await db(), STORES.folders, id);
}
export async function getFolders(): Promise<FolderRecord[]> {
  return getAll<FolderRecord>(await db(), STORES.folders);
}
export async function deleteFolder(id: string): Promise<void> {
  return del(await db(), STORES.folders, id);
}

// --- recents -----------------------------------------------------------------

export async function putRecent(record: RecentRecord): Promise<void> {
  return put(await db(), STORES.recents, record);
}
export async function getRecents(): Promise<RecentRecord[]> {
  return getAll<RecentRecord>(await db(), STORES.recents);
}
export async function deleteRecent(id: string): Promise<void> {
  return del(await db(), STORES.recents, id);
}

// --- pins --------------------------------------------------------------------

export async function putPin(record: PinRecord): Promise<void> {
  return put(await db(), STORES.pins, record);
}
export async function getPins(): Promise<PinRecord[]> {
  return getAll<PinRecord>(await db(), STORES.pins);
}
export async function deletePin(id: string): Promise<void> {
  return del(await db(), STORES.pins, id);
}

// --- settings (spec 004) -----------------------------------------------------
//
// One global reader-settings row. Read returns the stored row (merged over the defaults so
// a partial legacy row still yields a complete Settings) or the defaults when nothing is
// stored yet; write merges a patch onto the current row and commits it. Both go through
// idbCore's write discipline, so putSettings resolves only once the write has durably
// committed (a subsequent getSettings observes it).

/** The persisted reading preferences, or {@link DEFAULT_SETTINGS} when nothing is stored. */
export async function getSettings(): Promise<Settings> {
  const row = await get<SettingsRecord>(await db(), STORES.settings, SETTINGS_ID);
  if (!row) return { ...DEFAULT_SETTINGS };
  // Merge over the defaults so any field a future/partial row omits stays well-defined.
  return { ...DEFAULT_SETTINGS, theme: row.theme, tocOpen: row.tocOpen, tocWidth: row.tocWidth };
}

/** Merge `patch` onto the current settings and write the single global row. Resolves once
 *  the write commits, so the next getSettings sees it. */
export async function putSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const merged: SettingsRecord = { id: SETTINGS_ID, ...current, ...patch };
  return put(await db(), STORES.settings, merged);
}

// --- trust controls (task 2.2) -----------------------------------------------
//
// Storage ships WITH the way to see and erase it — the first thing that stores anything
// arrives alongside `wipeAll()` and `describeStored()` (spec §6.17 / trust story). Not
// deferred: the transparency + erase path is part of THIS group, not a later nicety.

/**
 * Erase everything Peekover has stored: clear all four stores. This drops remembered
 * folders (and their persisted handles), the recents list, all pins, AND the reader
 * settings — the "wipe all data" control. Each `clear()` resolves on its transaction
 * commit (idbCore), so once this resolves the stores are durably empty and a subsequent
 * read sees zero records (getSettings then falls back to the Auto default).
 * Cleared sequentially so a failure surfaces deterministically rather than racing.
 */
export async function wipeAll(): Promise<void> {
  const conn = await db();
  await clear(conn, STORES.folders);
  await clear(conn, STORES.recents);
  await clear(conn, STORES.pins);
  await clear(conn, STORES.settings);
}

/** One remembered folder as the transparency view sees it — the live handle object is
 *  NOT surfaced (we disclose THAT one exists via `persisted`, never the object itself),
 *  and file CONTENTS are never stored at all, so there is nothing hidden to leak. */
export interface StoredFolderInfo {
  id: string;
  name: string;
  /** True iff a live directory handle is stored (Chromium remembered); false = metadata-only. */
  persisted: boolean;
  addedAt: number;
  lastOpenedAt: number;
}

/**
 * The complete, plain-language picture of what Peekover has stored — the "what's stored"
 * view's read path. Surfaces EVERY record in all three stores (no hidden state), plus a
 * `total` and human-readable `lines`. Folder handles are reported only as `persisted`
 * (their presence, not the object); file contents are never stored, so this is the whole
 * truth of on-device state.
 */
export interface StoredSummary {
  folders: StoredFolderInfo[];
  recents: RecentRecord[];
  pins: PinRecord[];
  /** The stored reader settings, or `null` when nothing is stored (the user never customized).
   *  REQUIRED as of task 5.2 (the group-1 carry-over): 1.3 left it optional only to keep the
   *  shell's designed `EMPTY_SUMMARY` literal valid without a cross-group edit, which was a
   *  scope-fence concession, not a design choice. `describeStored` has always set it, so the
   *  type now says what the code already did, and a future summary literal that forgets the
   *  field fails to compile instead of silently reporting "no settings stored". Non-null ⇒ a
   *  settings row exists and is counted + described. */
  settings: Settings | null;
  total: number;
  /** Plain-language, trust-facing description — one line per non-empty record class. */
  lines: string[];
}

/** Pluralize a count for the plain-language lines ("1 folder" / "3 folders"). */
function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The PURE plain-language description of on-device state — extracted from `describeStored`
 * so it is unit-testable without an engine (IndexedDB is jsdom-blind). One line per
 * non-empty record class, in the same order the stores are listed; a single "nothing
 * stored" line when everything is empty. `total` is passed in (it is the caller's derived
 * count) so this stays a pure string builder.
 */
export function buildStoredLines(input: {
  folders: StoredFolderInfo[];
  recents: RecentRecord[];
  pins: PinRecord[];
  settings: Settings | null;
  total: number;
}): string[] {
  const { folders, recents, pins, settings, total } = input;
  const lines: string[] = [];
  if (folders.length) {
    const remembered = folders.filter((f) => f.persisted).length;
    const detail = remembered
      ? ` (${plural(remembered, 'with folder access remembered for one-click reopen')})`
      : '';
    lines.push(`${plural(folders.length, 'remembered folder')}${detail} — names only, never file contents.`);
  }
  if (recents.length) {
    lines.push(`${plural(recents.length, 'recently opened file')} — path + name, so the list can reopen them.`);
  }
  if (pins.length) {
    lines.push(`${plural(pins.length, 'pinned item')} — path + name for quick access.`);
  }
  if (settings) {
    lines.push('Theme / display settings — stored on-device, no file contents.');
  }
  if (total === 0) {
    // Kept verbatim (folders/recents/pins) to stay identical to the shell's designed
    // EMPTY_SUMMARY literal — when total is 0 there are no settings either, so the
    // enumeration is complete in spirit and the two strings never diverge.
    lines.push('Nothing stored — Peekover is holding no folders, recents, or pins on this device.');
  }
  return lines;
}

/**
 * Read all four stores and produce the transparency summary. Reads are independent, so
 * they run concurrently. Nothing here writes or hides state — it is a faithful mirror of
 * what `wipeAll()` would erase. The settings row is surfaced only when it EXISTS (the user
 * customized); an unstored default is not a stored record and is not counted.
 */
export async function describeStored(): Promise<StoredSummary> {
  const conn = await db();
  const [folderRows, recents, pins, settingsRow] = await Promise.all([
    getAll<FolderRecord>(conn, STORES.folders),
    getAll<RecentRecord>(conn, STORES.recents),
    getAll<PinRecord>(conn, STORES.pins),
    get<SettingsRecord>(conn, STORES.settings, SETTINGS_ID),
  ]);

  const folders: StoredFolderInfo[] = folderRows.map((f) => ({
    id: f.id,
    name: f.name,
    persisted: f.handle !== undefined,
    addedAt: f.addedAt,
    lastOpenedAt: f.lastOpenedAt,
  }));

  const settings: Settings | null = settingsRow
    ? { theme: settingsRow.theme, tocOpen: settingsRow.tocOpen, tocWidth: settingsRow.tocWidth }
    : null;

  const total = folders.length + recents.length + pins.length + (settings ? 1 : 0);
  const lines = buildStoredLines({ folders, recents, pins, settings, total });

  return { folders, recents, pins, settings, total, lines };
}
