// store — Peekover's IndexedDB layer: the CRUD over the three stores 002 introduces,
// built on the local `idbCore` raw wrapper (NO `idb` dependency — plan.md §Libraries).
//
// Database `peekover` v1, three keyPath('id') object stores (plan.md §IndexedDB):
//   - folders : remembered folders. On Chromium a row carries the structured-cloneable
//               FileSystemDirectoryHandle (a capability REF, never file contents); on
//               Firefox the handle is absent (metadata-only, display).
//   - recents : bounded "recently opened" list (ordering computed by pure recents.ts).
//   - pins    : user-pinned files/folders (ordering computed by pure recents.ts).
//
// SCOPE SPLIT across group 2's two tasks:
//   - task 2.1 (this file's first commit): the CRUD + schema + record types.
//   - task 2.2: `wipeAll()` + `describeStored()` — the trust controls that ship WITH
//               the first thing that stores anything (spec §6.17 / trust story).
//
// Nothing consumes this yet — group 3 wires the folder walk into it. It is pure-ish data
// layer: no DOM, no UI. Browser-only at runtime (IndexedDB is a browser global); it is
// exercised in the real-engine browser project, never jsdom (storage persistence is a
// jsdom-blind property — retro standing rule).

import { openDb, get, getAll, put, del, clear, type IdbSchema } from './idbCore';

/** Database identity — a single versioned schema (plan.md §IndexedDB). */
export const DB_NAME = 'peekover';
export const DB_VERSION = 1;

/** The three object-store names, as a const map (no magic strings at call sites). */
export const STORES = {
  folders: 'folders',
  recents: 'recents',
  pins: 'pins',
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

/** The full v1 schema handed to idbCore.openDb. */
const SCHEMA: IdbSchema = {
  name: DB_NAME,
  version: DB_VERSION,
  stores: [
    { name: STORES.folders, keyPath: 'id' },
    { name: STORES.recents, keyPath: 'id' },
    { name: STORES.pins, keyPath: 'id' },
  ],
};

// One memoized connection per page. openDb is idempotent; memoizing avoids reopening on
// every call and keeps a stable connection for the app page's lifetime.
let dbPromise: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDb(SCHEMA);
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

// --- trust controls (task 2.2) -----------------------------------------------
//
// Storage ships WITH the way to see and erase it — the first thing that stores anything
// arrives alongside `wipeAll()` and `describeStored()` (spec §6.17 / trust story). Not
// deferred: the transparency + erase path is part of THIS group, not a later nicety.

/**
 * Erase everything Peekover has stored: clear all three stores. This drops remembered
 * folders (and their persisted handles), the recents list, and all pins — the "wipe all
 * data" control. Each `clear()` resolves on its transaction commit (idbCore), so once
 * this resolves the stores are durably empty and a subsequent read sees zero records.
 * Cleared sequentially so a failure surfaces deterministically rather than racing.
 */
export async function wipeAll(): Promise<void> {
  const conn = await db();
  await clear(conn, STORES.folders);
  await clear(conn, STORES.recents);
  await clear(conn, STORES.pins);
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
  total: number;
  /** Plain-language, trust-facing description — one line per non-empty record class. */
  lines: string[];
}

/** Pluralize a count for the plain-language lines ("1 folder" / "3 folders"). */
function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Read all three stores and produce the transparency summary. Reads are independent, so
 * they run concurrently. Nothing here writes or hides state — it is a faithful mirror of
 * what `wipeAll()` would erase.
 */
export async function describeStored(): Promise<StoredSummary> {
  const conn = await db();
  const [folderRows, recents, pins] = await Promise.all([
    getAll<FolderRecord>(conn, STORES.folders),
    getAll<RecentRecord>(conn, STORES.recents),
    getAll<PinRecord>(conn, STORES.pins),
  ]);

  const folders: StoredFolderInfo[] = folderRows.map((f) => ({
    id: f.id,
    name: f.name,
    persisted: f.handle !== undefined,
    addedAt: f.addedAt,
    lastOpenedAt: f.lastOpenedAt,
  }));

  const total = folders.length + recents.length + pins.length;

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
  if (total === 0) {
    lines.push('Nothing stored — Peekover is holding no folders, recents, or pins on this device.');
  }

  return { folders, recents, pins, total, lines };
}
