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
import { assertRegistrationsUseFactory } from '../../tests/util/seamPin';

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

// THE SEAM PIN — the diff registry's twin of the M5 watch pin, built on the SAME shared helper
// (D-2, task 4.1). It lives here, beside the registry it guards, rather than in contentWatch.test.ts:
// each registry's call-site pin sits next to that registry. The M5 seam rule is load-bearing here
// (diffRegistry.ts header): the only production path that registers a diff context is
// appShell.installWatchForFile, and after 2.1 that registration sits in the SAME file block as the
// watch registration — exactly the side-by-side shape a file-scoped matcher is weakest against.
describe('THE SEAM PIN — every production diff context is built by its factory (D-2)', () => {
  it('every production registerDiffContext call site builds its context with createDiffContext', () => {
    assertRegistrationsUseFactory({
      roots: ['src', 'entrypoints'],
      registerName: 'registerDiffContext',
      factoryName: 'createDiffContext',
      // One production call site: appShell.installWatchForFile (clause 1 — inline
      // createDiffContext({...}) after the 4.1 wrap). The content-script graph imports no symbol
      // from diffRegistry and registers none (2.1's proven architectural fact), so there is no
      // second site and no un-loadable entrypoint pin.
      minCallSites: 1,
    });
  });
});
