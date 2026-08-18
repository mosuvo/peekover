// store — Peekover's IndexedDB layer: the CRUD over the stores 002/004 introduce,
// built on the local `idbCore` raw wrapper (NO `idb` dependency — plan.md §Libraries).
//
// Database `peekover` v4, eight object stores (plan.md §IndexedDB · 006 §1.2 · 007 §5):
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
//   - diagramMeta : the rendered-diagram cache index (spec 007 task 4.2), keyPath `key`,
//                `{key, bytes, lastUsed}` — the small bounded rows eviction and byte
//                accounting read (D-4's planDiagramWrite), never the SVG.
//   - diagrams : rendered diagram bodies (spec 007 task 4.2), keyPath `key`, `{key, svg}` —
//                fetched only on a cache hit for the one diagram being rendered.
//                TWO stores, not one (D-2): `getAll` is documented for "small bounded stores
//                — no cursor needed" (idbCore.ts:116-119) and describeStored() materialises
//                whole stores, so an inline SVG would make every trust-panel open deserialise
//                every cached diagram. Both are added EMPTY at DB_VERSION 4 — this schema
//                bump STORES NOTHING (the cache is wired in task 4.3). The v3→v4 upgrade is
//                additive-by-name like the two before it, so all six existing stores' rows
//                survive intact (proven on real engines in idbVersionchange.browser.test.ts).
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
 *  `snapshots` stores (spec 006 task 1.1), and 3→4 for the additive `diagramMeta` +
 *  `diagrams` stores (spec 007 task 4.2) — each pair lands EMPTY. */
export const DB_NAME = 'peekover';
export const DB_VERSION = 4;

/** The object-store names, as a const map (no magic strings at call sites). */
export const STORES = {
  folders: 'folders',
  recents: 'recents',
  pins: 'pins',
  settings: 'settings',
  // spec 006 task 1.1 — added EMPTY at DB_VERSION 3; nothing writes to them until task 1.4.
  snapshotMeta: 'snapshotMeta',
  snapshots: 'snapshots',
  // spec 007 task 4.2 — added EMPTY at DB_VERSION 4; nothing writes to them until task 4.3.
  diagramMeta: 'diagramMeta',
  diagrams: 'diagrams',
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

/** The full v4 schema handed to idbCore.openDb. Exported so store.test.ts can assert its
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
    // spec 007 task 4.2 — added EMPTY; both keyed by D-3's composite key STRING (one keyPath,
    // no compound key — idbCore.ts:5-9 keeps compound keys and indexes off the table).
    { name: STORES.diagramMeta, keyPath: 'key' },
    { name: STORES.diagrams, keyPath: 'key' },
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
 * The shared memoized connection, for sibling data-layer modules that must write to the SAME
 * connection rather than opening a second one (which would fight idbCore's versionchange
 * close-and-drop). `snapshots.ts`'s IDB layer (006 task 1.4) is the one caller — the pure/IDB
 * split keeps its byte-accounting jsdom-testable while its writes ride this one connection.
 */
export function connection(): Promise<IDBDatabase> {
  return db();
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
  return {
    ...DEFAULT_SETTINGS,
    theme: row.theme,
    tocOpen: row.tocOpen,
    tocWidth: row.tocWidth,
    // The D-12 hand-enumeration trap (task 5.1's ledger entry): a legacy row predating 5.1 has no
    // `codeTheme` at all, so a bare `row.codeTheme` would write `undefined` here instead of falling
    // back to the default — the same `??` guard `settingsPort.ts`'s `coerceSettings` and this
    // file's own `describeStored()` already use for the same field.
    codeTheme: row.codeTheme ?? DEFAULT_SETTINGS.codeTheme,
  };
}

/** Merge `patch` onto the current settings and write the single global row. Resolves once
 *  the write commits, so the next getSettings sees it. */
export async function putSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const merged: SettingsRecord = { id: SETTINGS_ID, ...current, ...patch };
  return put(await db(), STORES.settings, merged);
}

// --- snapshot-capture flag (D-12, task 1.5) ----------------------------------
//
// The capture off-switch is its OWN ROW in the settings store, NOT a field on the shared
// `Settings` record — plan §0 D-12. Two reasons, both load-bearing:
//   1. A `Settings` field would be fetched by the content script on every reader start and acted
//      on by nothing (it captures on no surface, §3.2).
//   2. `getSettings()` above HAND-ENUMERATES its fields (`theme`/`tocOpen`/`tocWidth`) — plan §4-1's
//      trap: a new `Settings` field would persist through `putSettings` then SILENTLY VANISH on
//      read, with no type error and no test failure. D-12 routes AROUND that trap rather than
//      fixing it; the trap stays live for whoever adds the next `Settings` field.
// So the flag is a SECOND row in the same store, keyed `CAPTURE_SETTINGS_ID`, with its OWN record
// type (`CaptureRecord`) — never unioned with `SettingsRecord`. `getSettings()`/`putSettings()`
// read/write only the `SETTINGS_ID='reader'` row, so they are untouched by this addition; these two
// read/write only the `'capture'` row, by key. Two independent record types keyed 'reader' and
// 'capture' coexist in the one `keyPath:'id'` store without either seeing the other.

/** The capture-flag row: its keyPath id plus the flag. A DIFFERENT record type from
 *  {@link SettingsRecord} on purpose (D-12) — the two rows share the store, not a shape. */
interface CaptureRecord {
  id: string;
  enabled: boolean;
}

/** The capture-flag row's key — the second row in the settings store, distinct from
 *  {@link SETTINGS_ID}. Read by key so `getSettings()`'s hand-enumeration never sees it. */
export const CAPTURE_SETTINGS_ID = 'capture';

/**
 * Whether snapshot capture is enabled (D-12, task 1.5). Reads the `'capture'` row by key.
 *
 * ★ Returns TRUE (the default) when NO row exists — and read-with-default IS the reset mechanism:
 * `wipeAll()` clears the settings store (both rows), so after a wipe the row is gone and this reads
 * the default (on) again, with no code in `wipeAll` (Piece 4). This ROUTES AROUND `getSettings()`'s
 * hand-enumerate trap (plan §4-1): it reads its own key, never a `Settings` field, so the trap that
 * would swallow a new `Settings` field cannot touch this flag — and the trap stays deliberately live.
 *
 * ★ D-3 CROSS-REFERENCE (task 3.1, plan §0 D-12/D-3): the wipe-reset's SAFETY depends on D-3's
 * persistent capture disclosure re-appearing on the next watch — a user who wipes then re-watches
 * must see the disclosure again, exactly as a new user would. D-3 ships at task 3.1 (later than this
 * task). This is a COMMENT, not a code coupling: if a future change to 3.1 makes that disclosure
 * one-shot, D-12's wipe-reset is void (pinned in D-3) — so this note names the dependency so the
 * breakage is loud, not silent.
 */
export async function getCaptureEnabled(): Promise<boolean> {
  const row = await get<CaptureRecord>(await db(), STORES.settings, CAPTURE_SETTINGS_ID);
  return row ? row.enabled : true;
}

/**
 * Persist the snapshot-capture flag (D-12, task 1.5) — writes the `'capture'` row. Resolves once the
 * write commits. ROUTES AROUND `getSettings()`'s trap (plan §4-1): it writes its own key by its own
 * record type, so `Settings`/`getSettings`/`putSettings` are wholly untouched (D-12's whole point).
 */
export async function setCaptureEnabled(enabled: boolean): Promise<void> {
  const row: CaptureRecord = { id: CAPTURE_SETTINGS_ID, enabled };
  return put(await db(), STORES.settings, row);
}

// --- trust controls (task 2.2) -----------------------------------------------
//
// Storage ships WITH the way to see and erase it — the first thing that stores anything
// arrives alongside `wipeAll()` and `describeStored()` (spec §6.17 / trust story). Not
// deferred: the transparency + erase path is part of THIS group, not a later nicety.

/**
 * Erase everything Peekover has stored: clear all EIGHT stores. This drops remembered folders
 * (and their persisted handles), the recents list, all pins, the reader settings, AND — since
 * 006 task 1.4 — the two snapshot stores (the past text states of watched documents), AND — since
 * 007 task 4.3 — the two diagram-cache stores (rendered SVGs) — the "wipe all data" control. Each
 * `clear()` resolves on its transaction commit (idbCore), so once this resolves the stores are
 * durably empty and a subsequent read sees zero records (getSettings then falls back to the Auto
 * default). Cleared sequentially so a failure surfaces deterministically rather than racing. Both
 * meta/content pairs are cleared META FIRST (§1.2), the same safe ordering the capture and cache
 * write paths use — a dangling meta entry is the benign failure, an orphaned content row is not.
 */
export async function wipeAll(): Promise<void> {
  const conn = await db();
  await clear(conn, STORES.folders);
  await clear(conn, STORES.recents);
  await clear(conn, STORES.pins);
  await clear(conn, STORES.settings);
  await clear(conn, STORES.snapshotMeta);
  await clear(conn, STORES.snapshots);
  await clear(conn, STORES.diagramMeta);
  await clear(conn, STORES.diagrams);
}

/**
 * Erase ONLY the two snapshot stores — the "erase snapshots" control (D-13, task 1.6). A sibling
 * of {@link wipeAll}, but narrow by design: it clears `snapshotMeta` + `snapshots` and NOTHING else.
 *
 * ★ INVARIANT (D-13): clears ONLY the two snapshot stores. What SURVIVES, untouched: remembered
 * folders, recents, pins, the reader settings row (`SETTINGS_ID`), AND the snapshot-capture flag row
 * (`CAPTURE_SETTINGS_ID`, D-12 / task 1.5). Erasing snapshots is not erasing settings — both settings
 * rows survive, so a user who erases their saved document text keeps their theme AND their capture
 * preference exactly as they were. That is the honest disclosure the trust story requires (§3.4).
 *
 * Contrast with {@link wipeAll}, which also drops folders/recents/pins/settings and thereby RESETS
 * the capture flag to its default (on) by clearing its row. This does neither.
 *
 * Cleared sequentially and META FIRST (§1.2, the same safe ordering {@link storeSnapshot} and
 * {@link wipeAll} use): a crash between the two clears leaves a dangling meta entry (benign — the
 * byte-accounting reads meta, and the missing-content path self-reclaims lazily per §1.2), never an
 * orphaned content row (invisible bytes the accounting can't see). Each `clear()` resolves on its
 * transaction commit, so once this resolves both stores are durably empty.
 *
 * Per-document erase is DEFERRED with a home (D-13; spec §6) — the moment §3.7's picker shows a
 * per-document list it becomes a reasonable expectation, but it is out of scope here (scope, not
 * principle). This global control is the whole of what 1.6 ships.
 */
export async function eraseSnapshots(): Promise<void> {
  const conn = await db();
  await clear(conn, STORES.snapshotMeta);
  await clear(conn, STORES.snapshots);
}

/**
 * Erase ONLY the two diagram-cache stores — the "Clear diagram cache" control (D-5, task 4.3). A
 * sibling of {@link eraseSnapshots} and narrow in exactly the same way: it clears `diagramMeta` +
 * `diagrams` and NOTHING else.
 *
 * ★ INVARIANT (D-5): clears ONLY the two diagram stores. What SURVIVES, untouched: remembered
 * folders, recents, pins, the reader settings row (`SETTINGS_ID`), the snapshot-capture flag row
 * (`CAPTURE_SETTINGS_ID`), AND every watched-document snapshot. This is the gesture that pays for
 * D-5's revoke exemption: a content-hash cache key carries no folder identity, so revoking a folder
 * cannot clear the diagrams that folder's documents rendered — this control is what the user has
 * instead, and it must therefore cost them nothing else they stored.
 *
 * Cleared sequentially and META FIRST — the same ordering {@link storeDiagram} writes in and
 * {@link eraseSnapshots} clears in. The cache is REGENERABLE, which makes this the most forgiving
 * of the three erase controls: anything a crash strands is re-rendered on next sight, never lost.
 *
 * Not atomic, and deliberately so (`idbCore.ts:97-109` is one transaction per store): a multi-store
 * transaction helper would be `idbCore.ts:5-9`'s documented STOP signal, and no correctness claim
 * here needs one.
 */
export async function clearDiagramCache(): Promise<void> {
  const conn = await db();
  await clear(conn, STORES.diagramMeta);
  await clear(conn, STORES.diagrams);
}

/** One remembered folder as the transparency view sees it — the live handle object is
 *  NOT surfaced (we disclose THAT one exists via `persisted`, never the object itself).
 *  A folder record carries no file contents; watched-document snapshots (the one stored
 *  thing that IS contents) are a separate store, disclosed via `StoredSummary.snapshots`. */
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
 * view's read path. Surfaces EVERY record in every store (no hidden state), plus a `total`
 * and human-readable `lines`. Folder handles are reported only as `persisted` (their presence,
 * not the object); watched-document snapshots ARE file contents and are disclosed in full via
 * `snapshots` (count + document count + bytes), so this remains the whole truth of on-device state.
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
  /** On-device snapshot state (006 task 1.4): how many past text states are stored, across how
   *  many watched documents, and their total encoded bytes — read from `snapshotMeta` ALONE (D-4),
   *  never from content. REQUIRED for the same compile-time forcing reason `settings` is: a summary
   *  literal that forgets it fails to compile rather than silently reporting "no snapshots stored"
   *  — and snapshots are the first stored thing that IS file contents, so a hidden zero here is the
   *  exact trust-surface failure `PERMISSIONS.md` exists to deny. `count === 0` ⇒ no snapshot line. */
  snapshots: { count: number; docs: number; bytes: number };
  /** The stored snapshot-capture preference (D-12, task 1.5), or `null` when NO `'capture'` row
   *  exists (the user never toggled — capture is at its default of on, and nothing is stored). A
   *  row exists only when the user changed the flag, so `boolean` here ⇒ a real stored record the
   *  panel must disclose (`total` counts it, a line describes it). REQUIRED for the same compile-time
   *  forcing reason `settings`/`snapshots` are: a summary literal that forgets it fails to compile
   *  rather than silently hiding a stored preference — the exact "no hidden state" posture
   *  `describeStored`/`PERMISSIONS.md` exist to hold (store.ts's precedent, and D-12 reads BOTH
   *  settings rows or the panel hides a record). `null` ⇒ no capture line. */
  captureFlag: boolean | null;
  /** On-device diagram-cache state (007 task 4.3): how many rendered SVGs are cached and their
   *  total stored bytes — read from `diagramMeta` ALONE (D-2), never from the `diagrams` content
   *  store, so a trust-panel open never deserialises a single SVG. REQUIRED for the same
   *  compile-time forcing reason `settings`/`snapshots`/`captureFlag` are: a summary literal that
   *  forgets it fails to compile rather than silently reporting "no diagrams cached" — and a cache
   *  the panel cannot see is precisely the hidden state D-14 binds this field to the first cached
   *  SVG to prevent. `count === 0` ⇒ no diagram line. */
  diagrams: { count: number; bytes: number };
  total: number;
  /** Plain-language, trust-facing description — one line per non-empty record class. */
  lines: string[];
}

/** Pluralize a count for the plain-language lines ("1 folder" / "3 folders"). */
function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** A human-readable byte size for the snapshot line (deterministic, so the line is unit-testable):
 *  bytes under 1 KiB, else KB / MB to one decimal. The snapshot store is the first on-device state
 *  whose SIZE the trust panel must disclose, so the figure is surfaced, not hidden. */
function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
  snapshots: { count: number; docs: number; bytes: number };
  captureFlag: boolean | null;
  diagrams: { count: number; bytes: number };
  total: number;
}): string[] {
  const { folders, recents, pins, settings, snapshots, captureFlag, diagrams, total } = input;
  const lines: string[] = [];
  if (folders.length) {
    const remembered = folders.filter((f) => f.persisted).length;
    const detail = remembered
      ? ` (${plural(remembered, 'with folder access remembered for one-click reopen')})`
      : '';
    // Re-scoped at 006 task 1.4: the blanket "never file contents" is no longer true of the store
    // as a WHOLE (snapshots ARE contents), so it is dropped here and the line speaks only for its
    // own record class — a remembered folder is still names + (Chromium) a capability handle, never
    // the folder's files. The snapshot line below carries the honest disclosure of stored contents.
    lines.push(`${plural(folders.length, 'remembered folder')}${detail} — names only.`);
  }
  if (recents.length) {
    lines.push(`${plural(recents.length, 'recently opened file')} — path + name, so the list can reopen them.`);
  }
  if (pins.length) {
    lines.push(`${plural(pins.length, 'pinned item')} — path + name for quick access.`);
  }
  if (settings) {
    // Re-scoped likewise: settings are on-device (true) — the "no file contents" fragment was part
    // of the now-false store-wide claim, so it is dropped and the line speaks only for settings.
    lines.push('Theme / display settings — stored on-device.');
  }
  if (snapshots.count > 0) {
    // The honest disclosure of the first stored thing that IS file contents: a bounded number of
    // past text states of watched documents, kept on THIS device only and never uploaded.
    lines.push(
      `${plural(snapshots.count, 'snapshot')} of ${plural(snapshots.docs, 'watched document')} — ` +
        `${humanBytes(snapshots.bytes)} of document text kept on this device only, never uploaded.`,
    );
  }
  if (captureFlag !== null) {
    // A `'capture'` row exists only when the user toggled the flag from its default (D-12), so it
    // is a real stored preference the "no hidden state" panel discloses. The value is stated plainly
    // so the trust surface never implies capture is on when the user turned it off (or vice versa).
    lines.push(
      captureFlag
        ? 'Snapshot capture is turned on — a stored preference on this device.'
        : 'Snapshot capture is turned off — a stored preference; no new snapshots are being kept.',
    );
  }
  if (diagrams.count > 0) {
    // ★ VERBATIM, NOT AUTHORED HERE (gate-2 sub-decision (a), banked at `cab93c7`; tasks.md 4.3).
    // The settled wording is `Diagrams cached: N rendered (~size) — Clear diagram cache`, and it
    // names BOTH halves of the snapshot pair's shape it was written to match
    // (`storageControls.ts:241-280`): this disclosure line, and the control whose button reads
    // `Clear diagram cache`. This half renders `N` and `size`; `storageControls.ts` renders the
    // other. `humanBytes` is REUSED (not a second size formatter) so the panel speaks one figure.
    lines.push(`Diagrams cached: ${diagrams.count} rendered (~${humanBytes(diagrams.bytes)})`);
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
  // Snapshot accounting reads `snapshotMeta` ONLY — never a content row (D-4's whole point): count,
  // document count and total bytes all live on the small bounded meta rows, so the panel never
  // materialises a single snapshot's text to report how much is stored.
  // D-12 (task 1.5): the panel reads BOTH settings rows or it hides a stored record. The reader
  // (SETTINGS_ID) and the capture flag (CAPTURE_SETTINGS_ID) are two independent rows in the one
  // settings store, read by their distinct keys — so `getSettings()`'s hand-enumeration (§4-1) is
  // never involved and the capture row can never leak into the reader-settings surface, or back.
  // ★ The diagram accounting reads `diagramMeta` ONLY — never the `diagrams` content store. This is
  // the whole reason D-2 split the cache into two stores: `getAll` documents itself for "small
  // bounded stores — no cursor needed" (idbCore.ts:116-119) and this function materialises whole
  // stores, so an inline SVG would make EVERY trust-panel open deserialise EVERY cached diagram.
  // The meta row carries `bytes`, which is all the panel needs to speak the size honestly.
  const [folderRows, recents, pins, settingsRow, captureRow, snapshotMetaRows, diagramMetaRows] =
    await Promise.all([
      getAll<FolderRecord>(conn, STORES.folders),
      getAll<RecentRecord>(conn, STORES.recents),
      getAll<PinRecord>(conn, STORES.pins),
      get<SettingsRecord>(conn, STORES.settings, SETTINGS_ID),
      get<CaptureRecord>(conn, STORES.settings, CAPTURE_SETTINGS_ID),
      getAll<{ docId: string; entries: { id: string; ts: number; bytes: number }[] }>(
        conn,
        STORES.snapshotMeta,
      ),
      // The row shape is spelled inline rather than imported from `diagramCache.ts`, deliberately:
      // `store.ts` IS content-script-reachable (via `snapshots.ts`), and importing the cache module
      // here would drag the cache onto the content-script graph. The seam runs the other way — the
      // cache imports the store. (Pinned by `diagramImportFence.test.ts`'s reachability walk.)
      getAll<{ key: string; bytes: number; lastUsed: number }>(conn, STORES.diagramMeta),
    ]);

  const folders: StoredFolderInfo[] = folderRows.map((f) => ({
    id: f.id,
    name: f.name,
    persisted: f.handle !== undefined,
    addedAt: f.addedAt,
    lastOpenedAt: f.lastOpenedAt,
  }));

  const settings: Settings | null = settingsRow
    ? {
        theme: settingsRow.theme,
        tocOpen: settingsRow.tocOpen,
        tocWidth: settingsRow.tocWidth,
        codeTheme: settingsRow.codeTheme ?? DEFAULT_SETTINGS.codeTheme,
      }
    : null;

  // `null` when no `'capture'` row exists (default on, nothing stored); the flag's value otherwise
  // (a stored preference the user set) — disclosed in `total` + a line, never hidden (D-12).
  const captureFlag: boolean | null = captureRow ? captureRow.enabled : null;

  const withEntries = snapshotMetaRows.filter((m) => m.entries.length > 0);
  const snapshots = {
    count: withEntries.reduce((n, m) => n + m.entries.length, 0),
    docs: withEntries.length,
    bytes: withEntries.reduce((n, m) => n + m.entries.reduce((b, e) => b + e.bytes, 0), 0),
  };

  const diagrams = {
    count: diagramMetaRows.length,
    bytes: diagramMetaRows.reduce((n, r) => n + r.bytes, 0),
  };

  const total =
    folders.length +
    recents.length +
    pins.length +
    (settings ? 1 : 0) +
    snapshots.count +
    (captureFlag !== null ? 1 : 0) +
    diagrams.count;
  const lines = buildStoredLines({
    folders,
    recents,
    pins,
    settings,
    snapshots,
    captureFlag,
    diagrams,
    total,
  });

  return { folders, recents, pins, settings, snapshots, captureFlag, diagrams, total, lines };
}
