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

import { openDb, get, getAll, put, del, type IdbSchema } from './idbCore';

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
