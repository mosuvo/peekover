// diffRegistry — the PRODUCTION-PATH seam proof (M6 task 2.1), Chromium AND Firefox.
//
// NEW FILE rather than an extension of snapshotCapture.browser.test.ts, chosen deliberately: the
// diff registry is its own subject (which context PRODUCTION registers, and that the content script
// registers NONE), it needs its own `resetDiffRegistryForTest` in beforeEach, and keeping it apart
// makes the red-first mutation's blast radius — installContentWatch only — unmistakable.
//
// THE M5 SEAM RULE IS THE POINT. M5's "built, tested, wired to nothing" defect came from tests that
// registered the thing under test themselves before mounting. So the app-page case here drives the
// REAL user-gesture chain — mountAppShell → open folder → click the file — and NEVER hand-calls
// `registerDiffContext`; the only registration observed is the one `installWatchForFile` performs.
// The content-script case drives the production `installContentWatch` path and observes the registry
// stay EMPTY, because `contentWatch.ts` imports no symbol from `diffRegistry` at all.
//
// Both are real-engine facts: which surface's production graph reaches the register-once holder is
// not something jsdom's module wiring can prove differently from the shipped bundle, so it is proven
// here, on both engines.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { mount } from '../../src/render/mount';
import { installContentWatch } from '../../src/watch/contentWatch';
import {
  registerDiffContext,
  getDiffContext,
  isDiffContextRegistered,
  resetDiffRegistryForTest,
  type DiffContext,
} from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { SEP } from '../../src/app/recents';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';

const DOC_A = '# Version A\n\nalpha body text.\n';
const DOC_B = '# Version B\n\nbravo body text.\n';

/** A store that captures nothing — the grant flow's IndexedDB writes are irrelevant here. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** An in-memory, PERSISTABLE folder source — one markdown file read from memory. `persistable:true`
 *  is what makes the app-page surface WATCHABLE (watchAvailability §148), so `installWatchForFile`
 *  reaches its `registerWatchTarget` / `registerDiffContext` site rather than early-returning on the
 *  Firefox-picker "cannot watch" branch. No handle is needed — `detectorForFile` polls when a handle
 *  is absent, and this test never starts the watch. */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: name, name, read: async () => text }],
  };
}

/** A stand-in for the background relay (the snapshotCapture precedent): answers the real `WATCH_READ`
 *  wire shape so `relayRead` / `pollingDetector` are production code under test. */
function fakeBackground(initial: string): {
  send: (m: WatchMessage) => Promise<unknown>;
  write: (t: string) => void;
} {
  let text = initial;
  return {
    send: async (m) => {
      expect(m.type).toBe(WATCH_READ);
      return { ok: true, text };
    },
    write: (t) => {
      text = t;
    },
  };
}

function makeHost(tag: string): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** A dummy context for the reset-genuineness proof — the holder never calls its closures. */
function dummyContext(docId: string): DiffContext {
  return {
    docId,
    getCurrentSource: () => undefined,
    fetchMeta: async () => [],
    fetchText: async () => undefined,
    showDiff: () => ({ ok: true }),
    hideDiff: () => undefined,
  };
}

const containers: HTMLElement[] = [];

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll(); // durably-empty snapshot stores, so a registered fetchMeta reads []
  document.body.replaceChildren();
});

afterEach(() => {
  __resetConnectionForTest();
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
});

describe('diff registry — the app page PRODUCTION path registers a wired context (task 2.1)', () => {
  it('mountAppShell → open folder → select file registers a diff context wired to the on-screen source', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const source = memorySource('doc.md', DOC_A);
    const app = mountAppShell(container, {
      openFolder: async () => ({ ok: true, source }),
      store: fakeStore(),
    });

    await app.openFolder();

    // NON-VACUOUS: nothing is registered until a file is actually SELECTED — opening the folder
    // paints the no-selection state and calls no install.
    expect(isDiffContextRegistered()).toBe(false);

    // The real user gesture — click the file in the tree. This drives `selectFolderFile`, whose
    // synchronous head runs `installWatchForFile` (the ONLY production diff registration). We drive
    // this and NEVER call registerDiffContext ourselves — the whole point of the M5 seam rule.
    const fileBtn = container.querySelector<HTMLButtonElement>(
      '[role="treeitem"][data-kind="file"]',
    );
    expect(fileBtn?.textContent).toBe('doc.md');
    fileBtn!.click();

    await waitFor(() => isDiffContextRegistered());
    expect(isDiffContextRegistered()).toBe(true);

    const ctx = getDiffContext()!;
    // The docId is `folderId + SEP + path`; folderId is a minted id, so we assert the SHAPE 1.4
    // constructs rather than a value we cannot predict.
    expect(ctx.docId.endsWith(SEP + 'doc.md')).toBe(true);
    expect(ctx.docId.length).toBeGreaterThan((SEP + 'doc.md').length);

    // getCurrentSource is wired to the RIGHT host: once the file has rendered, it returns exactly the
    // on-screen source (proves the reader-source WeakMap closure reaches the reader pane's host).
    const host = await waitFor(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    await waitFor(() => host.shadowRoot?.querySelector('h1'));
    expect(ctx.getCurrentSource()).toBe(DOC_A);

    // fetchMeta reads meta only (D-4); no snapshot has been captured in this test, so it is empty —
    // an array, non-null.
    expect(await ctx.fetchMeta()).toEqual([]);
  });
});

describe('diff registry — the content-script PRODUCTION path registers NOTHING (§3.2)', () => {
  it('installContentWatch imports no diffRegistry symbol, so the registry stays empty before AND after', async () => {
    // THE RESET IS GENUINE — order-independent proof: a stale registration does not survive
    // resetDiffRegistryForTest (the reset beforeEach runs). Then we start from a clean empty.
    registerDiffContext(dummyContext('stale-folder' + SEP + 'stale.md'));
    expect(isDiffContextRegistered()).toBe(true);
    resetDiffRegistryForTest();
    expect(isDiffContextRegistered()).toBe(false);

    // PRODUCTION content-script path: installContentWatch builds and registers the real watch target
    // (docId null). A file change re-renders — and STILL nothing registers with the diff registry.
    const bg = fakeBackground(DOC_A);
    installContentWatch({
      url: 'file:///tmp/watched.md',
      send: bg.send,
      backgroundCanReadFileUrls: true,
      intervalMs: 30,
    });

    // BEFORE the re-render: the install alone registered no diff context.
    expect(isDiffContextRegistered()).toBe(false);

    const host = makeHost('peekover-root');
    mount(DOC_A, host);
    const pill = host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-watch')!;
    pill.click();
    expect(isWatching()).toBe(true);

    // Let the polling detector take its silent baseline read of A, then change the file to B and let
    // a poll re-render it — the production content-script re-render path, running for real.
    await new Promise((r) => setTimeout(r, 100));
    bg.write(DOC_B);
    await waitFor(() =>
      host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('Version B'),
    );

    // AFTER the install and a real re-render: the content-script surface registered NO diff context.
    // This is the assertion the red-first mutation (adding registerDiffContext to installContentWatch)
    // reddens; the app-page test above stays green because its registration is architecturally
    // separate.
    expect(isDiffContextRegistered()).toBe(false);
  });
});
