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

/**
 * Open (creating/upgrading if needed) the database described by `schema`. On an upgrade
 * this creates any missing object store with its keyPath; it never drops or rebuilds an
 * existing store (v1 only — a real migration is the complexity STOP signal above).
 */
export function openDb(schema: IdbSchema): Promise<IDBDatabase> {
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
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // A concurrent open holding an older version blocks the upgrade — surface it rather
    // than hang forever (never a silent stall; AGENTS.md #5 in spirit).
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
