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

import { describe, it, expect, afterEach } from 'vitest';
import { openDb, type IdbSchema } from '../../src/app/idbCore';

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
