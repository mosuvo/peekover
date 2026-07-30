// Task 2.2 — the REAL-ENGINE trust-controls proof (both Chromium + Firefox).
// [§9 wipe-all] · plan.md §Sequencing item 2 (store-side zero-network lands with group 2).
//
// Storage persistence, wipe, and structured-clone of a handle are JSDOM-BLIND: jsdom's
// IndexedDB (and OPFS) do not exercise the engine's real serialize/commit path, and jsdom
// is blind to bytes-on-wire (the M1 fetch leak shipped through a fully green jsdom stack —
// retro standing rule). So these run against the engine's OWN IndexedDB in the browser
// project. Three properties, all real-engine, all non-vacuous:
//
//   1. WIPE LEAVES ZERO. Populate all three stores (so describeStored sees them), wipeAll(),
//      read every store back → zero records. RED-FIRST: this FAILS against a no-op wipe —
//      the pre-wipe asserts prove data was really there, so a surviving record fails the
//      post-wipe zero-count assert. (Verified red by stubbing wipeAll to a no-op; see the
//      run recorded in progress.md.)
//   2. HANDLE ROUND-TRIP (same session). Put a folder row carrying a REAL OPFS
//      FileSystemDirectoryHandle, getAll it back, assert the handle survived structured
//      clone (`isSameEntry`). This is the store's structured-cloneable-handle property.
//      The across-RELOAD ground truth is task 5.1 (handlePersist.browser.test.ts), not
//      here. Feature-detected: an engine that cannot clone a handle into IndexedDB falls
//      back to a metadata-only row and skips the isSameEntry assert (both engines stay
//      green; the real path is exercised wherever supported).
//   3. ZERO NETWORK (bytes on the wire). open + put (incl. a handle) + getAll + describe +
//      wipe fire ZERO network requests — asserted on the browser's Resource Timing buffer,
//      exactly the remoteMedia.browser.test.ts discipline. Non-vacuous: a CONTROL same-
//      origin fetch is then shown to appear in the same buffer, proving the observation
//      mechanism genuinely sees requests (so the zero-count is a real result, not a broken
//      observer). The dedicated §9 zero-network guard file is task 3.4; this is the store
//      slice the plan sequences into group 2.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  putFolder,
  putRecent,
  putPin,
  getFolders,
  getRecents,
  getPins,
  wipeAll,
  describeStored,
  clearDiagramCache,
  putSettings,
  getSettings,
  setCaptureEnabled,
  getCaptureEnabled,
  __resetConnectionForTest,
  type FolderRecord,
} from '../../src/app/store';
import { storeSnapshot, getSnapshotMeta } from '../../src/app/snapshots';
import { storeDiagram, readDiagram } from '../../src/app/diagramCache';
// `SEP` is IMPORTED, never re-declared and never written as a literal separator here — both the
// snapshot `docId` and the diagram cache key are SEP-joined, and a hand-typed separator in a test
// is how a real control byte ends up in a source file (it runs green, which is the trap).
import { SEP } from '../../src/app/recents';

// A macrotask + rAF + settle — long enough that any request fired during the window has
// reached the Resource Timing buffer (mirrors remoteMedia.browser.test.ts's flush).
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

let uid = 0;
const nextId = () => `t${(uid += 1)}-${Math.trunc(performance.now())}`;

/** Try to obtain a real OPFS directory handle (populated in-test). Null if unsupported. */
async function opfsHandle(name: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const root = await navigator.storage?.getDirectory?.();
    if (!root) return null;
    return await root.getDirectoryHandle(name, { create: true });
  } catch {
    return null;
  }
}

function folderRow(over: Partial<FolderRecord> = {}): FolderRecord {
  const t = performance.now();
  return { id: nextId(), name: 'notes', addedAt: t, lastOpenedAt: t, ...over };
}

describe('trust controls — real-engine wipe + describe + zero-network', () => {
  // Start every test from a durably empty DB so counts are unambiguous. wipeAll() is the
  // reset (it is itself under test elsewhere in this file); the pre-populate asserts below
  // re-establish a known non-empty state before each wipe assertion.
  beforeEach(async () => {
    await wipeAll();
  });
  afterEach(() => {
    __resetConnectionForTest();
  });

  it('populates all three stores, then wipeAll() leaves ZERO records (red-first vs a no-op wipe)', async () => {
    const folderId = nextId();
    await putFolder(folderRow({ id: folderId }));
    await putRecent({ id: nextId(), folderId, path: 'a.md', name: 'a.md', openedAt: performance.now() });
    await putPin({ id: nextId(), kind: 'file', folderId, path: 'a.md', name: 'a.md', pinnedAt: performance.now() });

    // Pre-wipe: the data is REALLY there (this is what makes the post-wipe zero non-vacuous).
    expect(await getFolders()).toHaveLength(1);
    expect(await getRecents()).toHaveLength(1);
    expect(await getPins()).toHaveLength(1);
    const before = await describeStored();
    expect(before.total).toBe(3);

    await wipeAll();

    // Post-wipe: every store is empty. FAILS if wipeAll were a no-op (records would remain).
    expect(await getFolders()).toEqual([]);
    expect(await getRecents()).toEqual([]);
    expect(await getPins()).toEqual([]);
    const after = await describeStored();
    expect(after.total).toBe(0);
    expect(after.lines.join(' ')).toContain('Nothing stored');
  });

  it('describeStored() reports the full picture in plain language and hides nothing', async () => {
    const folderId = nextId();
    await putFolder(folderRow({ id: folderId, name: 'my-notes' }));
    await putRecent({ id: nextId(), folderId, path: 'x/y.md', name: 'y.md', openedAt: performance.now() });

    const summary = await describeStored();
    expect(summary.total).toBe(2);
    // Every stored record is surfaced — no hidden state.
    expect(summary.folders.map((f) => f.name)).toContain('my-notes');
    expect(summary.recents.map((r) => r.path)).toContain('x/y.md');
    // Plain-language lines describe what's stored: folders/recents are names + paths only. The
    // blanket "never file contents" was dropped at 006 task 1.4 — watched-document snapshots ARE
    // stored contents, disclosed by their own line when any exist (none are seeded here, so the
    // folder line's re-scoped "names only" is what stands in).
    const text = summary.lines.join(' ');
    expect(text).toContain('remembered folder');
    expect(text).toContain('names only');
    expect(text).toContain('recently opened file');
  });

  it('persists a folder row carrying a REAL directory handle, structured-clone-intact (same session)', async () => {
    const handle = await opfsHandle('peekover-store-test');
    const folderId = nextId();
    let clonedHandle = false;

    try {
      await putFolder(folderRow({ id: folderId, name: 'with-handle', handle: handle ?? undefined }));
      clonedHandle = handle !== null;
    } catch {
      // Engine cannot structured-clone a handle into IndexedDB — fall back to metadata-only
      // (clonedHandle stays false, set at init).
      await putFolder(folderRow({ id: folderId, name: 'with-handle' }));
    }

    const rows = await getFolders();
    const row = rows.find((f) => f.id === folderId)!;
    expect(row).toBeDefined();
    expect(row.name).toBe('with-handle');

    if (clonedHandle && handle) {
      // The rehydrated handle is the SAME entry — the structured clone round-tripped a
      // live capability ref through IndexedDB (not file contents). isSameEntry is async.
      expect(row.handle).toBeDefined();
      expect(await row.handle!.isSameEntry(handle)).toBe(true);
      // describeStored discloses that a handle IS remembered (its presence, not the object).
      const summary = await describeStored();
      expect(summary.folders.find((f) => f.id === folderId)?.persisted).toBe(true);
    } else {
      // Metadata-only fallback: no handle stored, and describeStored says so honestly.
      expect(row.handle).toBeUndefined();
    }
  });

  it('open + put(+handle) + getAll + describe + wipe fire ZERO network requests (bytes on the wire)', async () => {
    performance.clearResourceTimings();

    // Exercise the full storage surface, including a real handle put where supported.
    const handle = await opfsHandle('peekover-net-test');
    const folderId = nextId();
    try {
      await putFolder(folderRow({ id: folderId, handle: handle ?? undefined }));
    } catch {
      await putFolder(folderRow({ id: folderId }));
    }
    await putRecent({ id: nextId(), folderId, path: 'a.md', name: 'a.md', openedAt: performance.now() });
    await putPin({ id: nextId(), kind: 'folder', folderId, path: '', name: 'notes', pinnedAt: performance.now() });
    await getFolders();
    await getRecents();
    await getPins();
    await describeStored();
    await wipeAll();
    await flush();

    // GROUND TRUTH: not one http(s) request hit the wire for any storage op. (OPFS +
    // IndexedDB are on-device; a handle `put` is structured clone, not a fetch.)
    const networked = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => /^https?:/i.test(name));
    expect(networked).toEqual([]);

    // NON-VACUOUS: prove the observer actually sees requests — a control same-origin fetch
    // DOES land in the buffer. Same-origin + unique path → the vitest dev server 404s it;
    // it never leaves the machine, but http(s) still classifies as a real networked entry.
    const probe = new URL(`/__peekover_store_probe__/${nextId()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flush();
    const afterProbe = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => /^https?:/i.test(name));
    expect(afterProbe).toContain(probe);
  });
});

// ── "Clear diagram cache" — the narrow control, and what it must NOT touch (D-5, task 4.3) ────
//
// This is the gesture that PAYS FOR D-5's revoke exemption. A content-hash cache key carries no
// folder identity, so revoking a folder cannot clear the diagrams that folder's documents
// rendered; `PERMISSIONS.md`'s new ledger row says so in as many words, and what it offers the
// user instead is this one click. A control that quietly took anything else with it would make
// that disclosure a lie — so every survivor is asserted BY NAME, not as a total.
//
// ★ WHY EACH SURVIVOR IS ITS OWN ASSERTION. A single `total` check would pass a control that
// cleared one store and grew another, and would name nothing when it failed. The red-first below
// (a control that also clears the settings store) reds exactly ONE assertion — the settings
// survivor — which is what makes each of these a real, independently-falsifiable claim.
describe('"Clear diagram cache" clears the cache and NOTHING else (D-5, task 4.3)', () => {
  beforeEach(async () => {
    await wipeAll();
  });
  afterEach(() => {
    __resetConnectionForTest();
  });

  /** Populate every store the panel describes, so each survivor below has something to survive. */
  async function populateEverything(): Promise<{ folderId: string; docId: string; key: string }> {
    const folderId = nextId();
    await putFolder(folderRow({ id: folderId, name: 'keep-me' }));
    await putRecent({ id: nextId(), folderId, path: 'a.md', name: 'a.md', openedAt: performance.now() });
    await putPin({ id: nextId(), kind: 'file', folderId, path: 'a.md', name: 'a.md', pinnedAt: performance.now() });
    await putSettings({ theme: 'dark' });
    await setCaptureEnabled(false); // the SECOND settings row (D-12) — its own record
    const docId = folderId + SEP + 'a.md';
    await storeSnapshot(docId, '# a past text state of a watched document\n');
    const key = ['cafebabe', 'light', '11.16.0'].join(SEP);
    await storeDiagram(key, '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>');
    return { folderId, docId, key };
  }

  it('★ erases every cached diagram and leaves folders/recents/pins/settings/snapshots/capture INTACT', async () => {
    const { key } = await populateEverything();

    // PRE: a diagram REALLY existed. Without this the post-clear zero is vacuous — an empty cache
    // "clears" perfectly in every implementation, including a no-op one.
    expect(await readDiagram(key), 'a cached diagram must exist BEFORE the clear').toBeTruthy();
    const before = await describeStored();
    expect(before.diagrams.count).toBe(1);
    expect(before.diagrams.bytes).toBeGreaterThan(0);
    expect(before.lines.join(' ')).toContain('Diagrams cached: 1 rendered');

    await clearDiagramCache();

    // THE CACHE IS GONE — both stores, meta and content.
    expect(await readDiagram(key)).toBeUndefined();
    const after = await describeStored();
    expect(after.diagrams.count).toBe(0);
    expect(after.diagrams.bytes).toBe(0);
    expect(after.lines.join(' ')).not.toContain('Diagrams cached');

    // ★ AND EVERY SURVIVOR, ONE ASSERTION EACH, BY NAME.
    expect(await getFolders(), 'folders must survive').toHaveLength(1);
    expect((await getFolders())[0].name).toBe('keep-me');
    expect(await getRecents(), 'recents must survive').toHaveLength(1);
    expect(await getPins(), 'pins must survive').toHaveLength(1);
    expect((await getSettings()).theme, 'the reader settings row must survive').toBe('dark');
    expect(await getSnapshotMeta(), 'watched-document snapshots must survive').toHaveLength(1);
    expect(await getCaptureEnabled(), 'the capture flag row must survive').toBe(false);
  });

  it('wipeAll() DOES erase the diagram cache, and the panel then reports none', async () => {
    const { key } = await populateEverything();
    expect(await readDiagram(key)).toBeTruthy(); // the pre-state, again non-vacuously

    await wipeAll();

    // The nuclear control takes the cache with everything else — all EIGHT stores.
    expect(await readDiagram(key)).toBeUndefined();
    const after = await describeStored();
    expect(after.diagrams).toEqual({ count: 0, bytes: 0 });
    expect(after.total).toBe(0);
    expect(after.lines.join(' ')).toContain('Nothing stored');
    // ...and the capture flag is back to its read-with-default (on), as D-12 specifies.
    expect(await getCaptureEnabled()).toBe(true);
  });
});
