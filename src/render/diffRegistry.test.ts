// diffRegistry — the pure holder's behaviour (jsdom). The PRODUCTION-PATH proof (which context
// production registers, and that the content script registers none) is the real-engine seam test
// in tests/browser/diffRegistry.browser.test.ts; this file only pins the holder's own contract:
// register replaces, presence flips, reset clears.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerDiffContext,
  getDiffContext,
  isDiffContextRegistered,
  resetDiffRegistryForTest,
  type DiffContext,
} from './diffRegistry';

/** A minimal context — the holder never calls its closures, so plain stubs suffice here. */
function ctx(docId: string): DiffContext {
  return {
    docId,
    getCurrentSource: () => undefined,
    fetchMeta: async () => [],
    fetchText: async () => undefined,
  };
}

beforeEach(() => {
  resetDiffRegistryForTest();
});

describe('diffRegistry — the register-once holder (task 2.1)', () => {
  it('starts empty: nothing registered, getDiffContext is null', () => {
    expect(isDiffContextRegistered()).toBe(false);
    expect(getDiffContext()).toBeNull();
  });

  it('register flips presence and returns the SAME context by identity', () => {
    const c = ctx('folder-a/a.md');
    registerDiffContext(c);
    expect(isDiffContextRegistered()).toBe(true);
    expect(getDiffContext()).toBe(c); // identity, not a copy
  });

  it('register REPLACES — last write wins (mirrors registerWatchTarget)', () => {
    const first = ctx('folder-a/a.md');
    const second = ctx('folder-b/b.md');
    registerDiffContext(first);
    registerDiffContext(second);
    expect(getDiffContext()).toBe(second);
    expect(getDiffContext()).not.toBe(first);
  });

  it('reset returns to empty — a stale registration does not persist', () => {
    registerDiffContext(ctx('folder-a/a.md'));
    expect(isDiffContextRegistered()).toBe(true);
    resetDiffRegistryForTest();
    expect(isDiffContextRegistered()).toBe(false);
    expect(getDiffContext()).toBeNull();
  });
});
