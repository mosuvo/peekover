// M13 TASK 6.2a — the setup guide's "shown" mark, on each engine's real IndexedDB.
//
// The background opens the guide only if `claimGuideShown()` resolves true: the call that STORES the
// mark wins, every later one finds it. The mark is a row of Peekover's own `settings` store (the
// extension origin's IndexedDB — no permission on either engine), so "Wipe all data" clears it with
// the rest; the wipe opens nothing, it only re-arms the guide for a real future install. The Stored
// data panel, which shows everything held, names the mark while it is stored.
//
// Harness-shared-state (AGENTS.md): IndexedDB survives between browser files, so each test starts
// from a wipe and asserts on its own claims, never on what an earlier file left.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { claimGuideShown, describeStored, wipeAll, __resetConnectionForTest } from '../../src/app/store';

const GUIDE_LINE = 'The setup guide was shown — remembered so it opens only once.';

describe('6.2a — the guide mark on a real engine', () => {
  beforeEach(async () => {
    await wipeAll();
  });
  afterEach(() => {
    __resetConnectionForTest();
  });

  it('the first claim stores the mark; the second finds it', async () => {
    expect(await claimGuideShown(), 'first claim').toBe(true);
    expect(await claimGuideShown(), 'second claim').toBe(false);
  });

  it('two claims at once: exactly one wins (the store does the check, not the caller)', async () => {
    const results = await Promise.all([claimGuideShown(), claimGuideShown(), claimGuideShown()]);
    expect(results.filter(Boolean), String(results)).toHaveLength(1);
  });

  it('the mark survives a fresh connection (it is stored, not in memory)', async () => {
    expect(await claimGuideShown()).toBe(true);
    __resetConnectionForTest();
    expect(await claimGuideShown()).toBe(false);
  });

  it('"Wipe all data" clears the mark, and the next claim wins again', async () => {
    expect(await claimGuideShown()).toBe(true);
    await wipeAll();
    expect(await claimGuideShown(), 'claim after wipe').toBe(true);
  });

  it('the Stored data panel names the mark while it is stored, and not after a wipe', async () => {
    const before = await describeStored();
    expect(before.lines).not.toContain(GUIDE_LINE);
    expect(before.guideShown).toBe(false);

    await claimGuideShown();
    const marked = await describeStored();
    expect(marked.guideShown).toBe(true);
    expect(marked.lines).toContain(GUIDE_LINE);
    expect(marked.total, 'the mark is counted').toBe(before.total + 1);

    await wipeAll();
    const wiped = await describeStored();
    expect(wiped.guideShown).toBe(false);
    expect(wiped.lines).not.toContain(GUIDE_LINE);
  });
});
