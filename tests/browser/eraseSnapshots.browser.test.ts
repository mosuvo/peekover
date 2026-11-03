// Task 1.6 (D-13) — the REAL-ENGINE "erase snapshots" proof, driven through the PRODUCTION UI
// click (both Chromium + Firefox). [§3.4 · plan §0 D-13]
//
// Storage persistence + the snapshot stores are JSDOM-BLIND (jsdom's IndexedDB does not exercise
// the engine's real serialize/commit path — the retro standing rule), so this runs against the
// engine's OWN IndexedDB. And per the M5 seam rule, a test per seam must drive the PRODUCTION
// ENTRY PATH: here that is the real user gesture — mount the app shell with the real default store,
// open the "Stored data" panel, and CLICK the erase-snapshots control (start → confirm). A test
// that called `store.eraseSnapshots()` directly would prove the store function, not the control
// that ships to users (the exact hole M5 was written to close).
//
// The property, non-vacuous + red-first:
//   • NON-VACUITY: describeStored() shows a real snapshot line BEFORE the erase — a snapshot
//     genuinely existed, so the empty tail is a real finding, not an empty instrument.
//   • ERASE clears BOTH snapshot stores (snapshotMeta + snapshots).
//   • SURVIVAL: folders / recents / pins / the reader-settings row / the capture-flag row are ALL
//     still present, byte-identical where read back — erasing snapshots is not erasing settings.
//   • RED-FIRST (1 thing): mutating eraseSnapshots to ALSO clear a non-snapshot store (folders)
//     reddens exactly that store's survival assertion. Restored byte-identical.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mountAppShell } from '../../src/app/appShell';
import {
  putFolder,
  putRecent,
  putPin,
  putSettings,
  setCaptureEnabled,
  getFolders,
  getRecents,
  getPins,
  getSettings,
  getCaptureEnabled,
  describeStored,
  wipeAll,
  connection,
  STORES,
  __resetConnectionForTest,
  type FolderRecord,
} from '../../src/app/store';
import { storeSnapshot, getSnapshotMeta } from '../../src/app/snapshots';
import { getAll } from '../../src/app/idbCore';
import { SEP } from '../../src/app/recents';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C235); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

let uid = 0;
const nextId = () => `t${(uid += 1)}-${Math.trunc(performance.now())}`;

/** Poll a predicate to true (async work fired by a UI click resolves off the click handler). */
async function waitFor(pred: () => boolean | Promise<boolean>, tries = 100): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (await pred()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('waitFor: condition never became true');
}

function folderRow(over: Partial<FolderRecord> = {}): FolderRecord {
  const t = performance.now();
  return { id: nextId(), name: 'notes', addedAt: t, lastOpenedAt: t, ...over };
}

/** How many rows live in the (content) snapshots store — asserted directly, not via meta. */
async function snapshotRowCount(): Promise<number> {
  return (await getAll<{ id: string; text: string }>(await connection(), STORES.snapshots)).length;
}

describe('erase snapshots — real-engine, through the production UI click', () => {
  const containers: HTMLElement[] = [];

  beforeEach(async () => {
    await wipeAll(); // durably empty DB → unambiguous counts
  });
  afterEach(() => {
    for (const c of containers.splice(0)) c.remove();
    __resetConnectionForTest();
  });

  it('clicking "Erase snapshots" clears both snapshot stores and leaves everything else intact', async () => {
    // --- Seed: one of everything, plus a REAL snapshot. -----------------------------------------
    const folderId = nextId();
    await putFolder(folderRow({ id: folderId, name: 'my-notes' }));
    await putRecent({ id: nextId(), folderId, path: 'a.md', name: 'a.md', openedAt: performance.now() });
    await putPin({ id: nextId(), kind: 'file', folderId, path: 'a.md', name: 'a.md', pinnedAt: performance.now() });
    await putSettings({ theme: 'dark' });
    await setCaptureEnabled(false); // a stored capture preference (D-12) that MUST survive the erase
    const docId = folderId + SEP + 'a.md';
    await storeSnapshot(docId, '# Version one\n\nthe outgoing text of a watched document');

    // --- NON-VACUITY (load-bearing): a snapshot genuinely exists before the erase. --------------
    const before = await describeStored();
    expect(before.snapshots.count).toBeGreaterThan(0);
    // The real snapshot line is uniquely "N snapshot of M watched document …" — matched on "watched
    // document" so it can NEVER be satisfied by the surviving capture-flag line ("Snapshot capture is
    // turned off …"), which also contains the word "snapshot". This keeps the tail truly load-bearing.
    const snapshotLine = before.lines.find((l) => /watched document/i.test(l));
    expect(snapshotLine).toBeDefined(); // describeStored shows a real snapshot line
    expect(await getSnapshotMeta()).not.toHaveLength(0);
    expect(await snapshotRowCount()).toBeGreaterThan(0);

    // --- Drive the PRODUCTION entry path: mount the shell, open the panel, click the control. ----
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    mountAppShell(container); // real default store (no injected fake) → the real erase runs

    container.querySelector<HTMLButtonElement>('.peekover-app__storage-toggle')!.click();
    // The panel loads its summary asynchronously; wait until the enabled erase-start button appears.
    await waitFor(() => {
      const start = container.querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]');
      return !!start && !start.disabled;
    });
    // The panel itself surfaces the snapshot-count line (the UI mirror of the non-vacuity assertion
    // above) — "watched document" again, so the always-present disclosure/capture copy can't satisfy it.
    expect(container.querySelector('.peekover-storage')!.textContent).toMatch(/watched document/i);

    container.querySelector<HTMLButtonElement>('[data-erase-snapshots="start"]')!.click();
    const confirm = container.querySelector<HTMLButtonElement>('[data-erase-snapshots="confirm"]');
    expect(confirm).not.toBeNull();
    confirm!.click();

    // The erase is fire-and-forget off the click; wait for the snapshot stores to drain.
    await waitFor(async () => (await getSnapshotMeta()).length === 0);

    // --- ERASE: both snapshot stores are empty. -------------------------------------------------
    expect(await getSnapshotMeta()).toEqual([]);
    expect(await snapshotRowCount()).toBe(0);
    const after = await describeStored();
    expect(after.snapshots.count).toBe(0);
    expect(after.lines.some((l) => /watched document/i.test(l))).toBe(false); // no snapshot line remains

    // --- SURVIVAL: erasing snapshots is not erasing settings. -----------------------------------
    const folders = await getFolders();
    expect(folders).toHaveLength(1);
    expect(folders[0].id).toBe(folderId);
    expect(folders[0].name).toBe('my-notes');
    expect(await getRecents()).toHaveLength(1);
    expect(await getPins()).toHaveLength(1);
    // The reader-settings row survives byte-for-byte (theme still dark, not reset to a default).
    expect((await getSettings()).theme).toBe('dark');
    // The capture-flag row survives (still off) — the control never touched the settings store.
    expect(await getCaptureEnabled()).toBe(false);
    expect(after.captureFlag).toBe(false);
  });
});
