// idbCore — a tiny promisified wrapper over RAW IndexedDB. NO `idb` dependency.
//
// The locked-minimal-dependency posture (AGENTS.md stack; plan.md §Libraries) says: the
// storage surface Peekover touches is small — one database, three keyPath object stores,
// and get/getAll/put/delete/clear — so it is owned here as ~a screen of auditable code
// rather than pulling in the `idb` package. If this file starts sprouting real edge-case
// complexity (cursors, indexes, versioned migrations, blocked-upgrade choreography),
// that is the STOP-and-flag signal: `idb` is the honest fallback, but raw+local is the
// default and the whole point of the decision.
//
// Two deliberate correctness choices, not gold-plating:
//   1. WRITES (put/delete/clear) resolve on `transaction.oncomplete`, not merely on the
//      request's `onsuccess`. A request succeeds before its transaction commits; resolving
//      on request-success would let a caller (e.g. wipeAll → read-back-zero) observe the
//      DB before the write is durable. oncomplete is the real "it landed" signal.
//   2. READS (get/getAll) resolve on request-success — a readonly transaction has no
//      durability to await, and the result is on the request itself.
//
// No DOM, but browser-only at runtime: `indexedDB` is a browser global. This module is
// imported by store.ts and exercised in the real-engine browser project, never in jsdom
// (storage persistence is a jsdom-blind, real-engine property — retro standing rule).

/** The minimal schema idbCore needs to open/upgrade a database: name, version, stores. */
export interface IdbSchema {
  name: string;
  version: number;
  /** Each store is created keyed by an in-record property (keyPath). No indexes. */
  stores: ReadonlyArray<{ name: string; keyPath: string }>;
}

/** Open-time hooks. `onVersionChange` fires AFTER this connection has closed itself in
 *  response to another context's upgrade (see openDb) — the owner uses it to drop any
 *  memoized reference so the next call reopens at the new version. */
export interface OpenOptions {
  onVersionChange?: () => void;
}

/**
 * Open (creating/upgrading if needed) the database described by `schema`. On an upgrade
 * this creates any missing object store with its keyPath; it never drops or rebuilds an
 * existing store (a real migration is the complexity STOP signal above).
 *
 * VERSIONCHANGE (spec §7-2, by construction): a database can only be upgraded when no
 * other connection is open at the old version. The FIRST DB_VERSION bump (1→2) makes this
 * real — a second surface (or a reloaded page) opening v2 while this connection holds v1
 * would BLOCK forever. So on open we register `db.onversionchange` to CLOSE this connection
 * the instant another context needs to upgrade, then invoke `onVersionChange` so the owner
 * forgets the now-closed connection (the next call reopens at the new version). idbCore owns
 * the close (it created the connection); the owner owns its own memoization — the same seam
 * store.ts's `__resetConnectionForTest` already uses. Same spirit as tocView's `isConnected`
 * liveness prune: the guard ships WITH the thing that needs it.
 */
export function openDb(schema: IdbSchema, options: OpenOptions = {}): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(schema.name, schema.version);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of schema.stores) {
        if (!db.objectStoreNames.contains(s.name)) {
          db.createObjectStore(s.name, { keyPath: s.keyPath });
        }
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        // Step out of the way of a competing upgrade: close, then let the owner drop its
        // memo so the very next call reopens fresh at the new version (never a stale, or
        // blocking, connection).
        db.close();
        options.onVersionChange?.();
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    // A concurrent connection that did NOT step aside blocks this open — surface it rather
    // than hang forever (never a silent stall; AGENTS.md #5 in spirit). With the handler
    // above registered on every idbCore connection, this is now only reachable against a
    // connection opened outside idbCore.
    req.onblocked = () => reject(new Error(`IndexedDB open blocked: ${schema.name} v${schema.version}`));
  });
}

/** Resolve an IDBRequest (read path): the value is on the request at success time. */
function readRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Run a write op inside a fresh readwrite transaction and resolve on COMMIT (oncomplete),
 * so a resolved write is durably observable by the next read. `op` issues the request(s)
 * on the store; its own onerror aborts the transaction, which rejects here via onabort.
 */
function write(
  db: IDBDatabase,
  store: string,
  op: (s: IDBObjectStore) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB write aborted: ${store}`));
    op(tx.objectStore(store));
  });
}

/** Get one record by key, or `undefined` if absent. */
export function get<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return readRequest<T | undefined>(db.transaction(store, 'readonly').objectStore(store).get(key));
}

/** Get every record in a store (small bounded stores — no cursor needed). */
export function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return readRequest<T[]>(db.transaction(store, 'readonly').objectStore(store).getAll());
}

/** Put (insert or replace by keyPath) one record; resolves once the write commits. */
export function put<T>(db: IDBDatabase, store: string, value: T): Promise<void> {
  return write(db, store, (s) => s.put(value));
}

/** Delete one record by key; resolves once the write commits. */
export function del(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return write(db, store, (s) => s.delete(key));
}

/** Clear every record from a store; resolves once the write commits. */
export function clear(db: IDBDatabase, store: string): Promise<void> {
  return write(db, store, (s) => s.clear());
}
