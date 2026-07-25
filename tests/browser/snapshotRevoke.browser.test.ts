// Snapshot revoke-erase (D-10) — the REAL-ENGINE proof (M6 task 1.4), Chromium AND Firefox.
//
// Revoking a folder erases THAT folder's snapshots and leaves every other folder's intact — the
// existing-policy application §3.3 requires (contents must not outlive access to their folder). The
// boundary is `folderId + SEP`, NOT a bare `folderId.startsWith`, because the fallback id form can be
// a string prefix of another (`f-100-1` prefixes `f-100-10`) and over-deletion here is silent and
// unrecoverable. Both properties are real-engine facts (what actually remains in IndexedDB), proven
// non-vacuously (each folder demonstrably HAD snapshots before the revoke).
//
// The PRODUCTION entry path — appShell.revokeAccess → deleteSnapshotsForFolder, erasing before the
// folder-row delete — is driven in the jsdom seam test (appShell.test.ts, the M5 rule). Here we prove
// the erase's correctness in a real engine, including the delimiter boundary the jsdom test cannot.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storeSnapshot, getSnapshotMeta, getSnapshotText, deleteSnapshotsForFolder } from '../../src/app/snapshots';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { SEP } from '../../src/app/recents';

async function entriesFor(docId: string): Promise<{ id: string; ts: number; bytes: number }[]> {
  const all = await getSnapshotMeta();
  return all.find((m) => m.docId === docId)?.entries ?? [];
}

beforeEach(async () => {
  await wipeAll();
});
afterEach(() => {
  __resetConnectionForTest();
});

describe('snapshot revoke-erase — D-10 (task 1.4)', () => {
  it("erases the revoked folder's snapshots and leaves another folder's intact", async () => {
    const X = 'f-alpha';
    const Y = 'f-beta';
    const docX = X + SEP + 'a.md';
    const docY = Y + SEP + 'a.md';
    await storeSnapshot(docX, '# X\n\nfolder X body.\n');
    await storeSnapshot(docY, '# Y\n\nfolder Y body.\n');

    // NON-VACUITY: both folders really have a snapshot before the revoke.
    const yEntriesBefore = await entriesFor(docY);
    expect(await entriesFor(docX)).toHaveLength(1);
    expect(yEntriesBefore).toHaveLength(1);

    await deleteSnapshotsForFolder(X);

    // X's snapshot — meta AND content — is gone; Y's is untouched.
    expect(await entriesFor(docX)).toHaveLength(0);
    expect(await entriesFor(docY)).toHaveLength(1);
    expect(await getSnapshotText(yEntriesBefore[0].id)).toBe('# Y\n\nfolder Y body.\n');
  });

  it('the delimiter boundary: revoking `f-100-1` does NOT erase prefix-colliding `f-100-10`', async () => {
    // The exact hazard the `folderId + SEP` boundary exists for: a bare `startsWith(folderId)` would
    // treat `f-100-10` as inside `f-100-1` and over-delete it. Red-first proven by mutating
    // deleteSnapshotsForFolder to drop the `+ SEP` (see the task report's verbatim RED run).
    const A = 'f-100-1';
    const B = 'f-100-10';
    const docA = A + SEP + 'x.md';
    const docB = B + SEP + 'x.md';
    await storeSnapshot(docA, '# A\n\nfolder f-100-1.\n');
    await storeSnapshot(docB, '# B\n\nfolder f-100-10.\n');

    // NON-VACUITY: both prefix-colliding folders really have a snapshot before the revoke.
    const bEntriesBefore = await entriesFor(docB);
    expect(await entriesFor(docA)).toHaveLength(1);
    expect(bEntriesBefore).toHaveLength(1);

    await deleteSnapshotsForFolder(A);

    // f-100-1 erased; f-100-10 SURVIVES — the boundary is exact, not a bare prefix.
    expect(await entriesFor(docA)).toHaveLength(0);
    expect(await entriesFor(docB)).toHaveLength(1);
    expect(await getSnapshotText(bEntriesBefore[0].id)).toBe('# B\n\nfolder f-100-10.\n');
  });
});
