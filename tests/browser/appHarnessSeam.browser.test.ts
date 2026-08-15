// appHarnessSeam — the REAL-ENGINE proofs for task 2.1's `__peekoverHarness` query-gated seam
// (D-1, Ruling 1 — decisions.md's M9 GATE 2 entry). Chromium AND Firefox.
//
// ══ WHY THIS DRIVES `entrypoints/app/main.ts` DIRECTLY, VIA A FRESH DYNAMIC IMPORT ═════════════
//
// The seam is side-effect-only top-level code in the real bundled entrypoint — there is no
// exported function to call, by design (mirrors the content entrypoint's runReader()-only shape,
// AGENTS.md's "side-effects only" bootstrap discipline). So this suite imports the module itself,
// after arranging the two things its top level reads: a `#app` element in the DOM, and
// `location.href`'s query string.
//
// Each `loadMain()` call appends a fresh cache-busting query param to the import specifier
// (`?peekoverHarnessTest=N`) so Vite treats it as a DISTINCT module and re-runs the entrypoint's
// top level from scratch — `isHarness` is re-read, `window.__peekoverHarness` is (re)installed or
// not, per the CURRENT `location.href` at that instant. This is deliberately narrower than
// `vi.resetModules()`: only the entrypoint itself gets a fresh instance; `appShell.ts` and its own
// module-scoped registries (theme hosts, watch targets) stay the SAME singletons across every
// `loadMain()` call in this file, exactly as they would across repeated `mountAppShell()` calls in
// any other browser test here (folderGrant.browser.test.ts, agentBadge.browser.test.ts) — nothing
// about the entrypoint's re-import perturbs how those already-tested modules behave.
//
// Imported by a plain RELATIVE path, not the `@/…` alias `wxt prepare` generates for the bundler:
// `wxt build` resolves either specifier form identically, but this suite runs under plain Vitest,
// which has no `@/…` resolver configured (`vitest.config.ts` carries none) — task 2.1 changed the
// entrypoint's own import of `appShell` to a relative path for exactly this reason.
//
// ══ WHY `history.replaceState`, NOT A STUBBED `location` ═══════════════════════════════════════
//
// Mirrors `agentBadge.browser.test.ts`'s `withDocUrl`: stubbing `location` would remove the
// production `new URL(location.href).searchParams.has(...)` parse from the path under test, and
// the whole point of a real-engine suite here is that the guard reads a REAL URL through the REAL
// API. `replaceState` moves the actual href instead. The browser project's test files share ONE
// browser window per engine (`vitest.config.ts`'s own header comment), so the href is restored to
// what it was before this file ran, in a `finally`, on every call — never left behind for whatever
// test runs next.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';

declare global {
  interface Window {
    __peekoverHarness?: {
      openFromHandle(handle: FileSystemDirectoryHandle): Promise<void>;
    };
  }
}

// ── DOM + URL scaffolding ────────────────────────────────────────────────────────────────────

const originalHref = location.href;
let appRoot: HTMLDivElement | null = null;

function mountRoot(): void {
  appRoot = document.createElement('div');
  appRoot.id = 'app';
  document.body.appendChild(appRoot);
}

function unmountRoot(): void {
  appRoot?.remove();
  appRoot = null;
}

/** Move the REAL `location.href` to `location.pathname + suffix` for the duration of `fn`,
 *  restoring the original href unconditionally — see header note. `suffix` is the full desired
 *  search+hash, e.g. `'?__peekoverHarness'` or `'#__peekoverHarness'` or `''`. */
async function withUrlSuffix<T>(suffix: string, fn: () => Promise<T>): Promise<T> {
  history.replaceState(null, '', location.pathname + suffix);
  try {
    return await fn();
  } finally {
    history.replaceState(null, '', originalHref);
  }
}

let importSeq = 0;
/** Fresh top-level evaluation of the real entrypoint, under the CURRENT `location.href` — see
 *  header note on why this is a cache-busted import rather than `vi.resetModules()`. */
async function loadMain(): Promise<void> {
  importSeq += 1;
  await import(/* @vite-ignore */ `../../entrypoints/app/main.ts?peekoverHarnessTest=${importSeq}`);
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

beforeEach(() => {
  delete window.__peekoverHarness;
  mountRoot();
});

afterEach(() => {
  delete window.__peekoverHarness;
  unmountRoot();
  history.replaceState(null, '', originalHref);
});

// ── 1/2 — inertness (negative) and the harness (positive), the pair finding 1 requires ─────────

describe('the query-gated branch — negative and positive, in the same file (finding 1)', () => {
  it('WITHOUT the param: installs no global, and normal app-page init still completes', async () => {
    await withUrlSuffix('', async () => loadMain());

    expect(window.__peekoverHarness).toBeUndefined();
    // Normal init reference: the idle "Open a folder" CTA renders — unchanged from HEAD.
    expect(appRoot!.querySelector('.peekover-app__cta')).not.toBeNull();
  });

  it('WITH the param: installs window.__peekoverHarness.openFromHandle, additively', async () => {
    await withUrlSuffix('?__peekoverHarness', async () => loadMain());

    expect(typeof window.__peekoverHarness?.openFromHandle).toBe('function');
    // The harness is additive — normal init is not replaced or skipped.
    expect(appRoot!.querySelector('.peekover-app__cta')).not.toBeNull();
  });
});

// ── 3 — the predicate is paranoid: no false-positive on a near-miss ────────────────────────────

describe('the predicate never false-positives on a near-miss', () => {
  const misses: Array<[string, string]> = [
    ['missing underscores', '?peekoverHarness'],
    ['different case', '?__peekoverharness'],
    ['a fragment, not a query', '#__peekoverHarness'],
    ["embedded in another key's value", '?other=__peekoverHarness'],
  ];

  it.each(misses)('%s (%s) never installs the global', async (_label, suffix) => {
    await withUrlSuffix(suffix, async () => loadMain());
    expect(window.__peekoverHarness).toBeUndefined();
  });
});

// ── 4 — the handle-only surface: never silently succeeds on a non-handle input ──────────────────

describe('the harness surface accepts nothing but a real FileSystemDirectoryHandle', () => {
  const badInputs: Array<[string, unknown]> = [
    ['a plain object', { name: 'not-a-handle', kind: 'directory' }],
    ['a string', '/some/path'],
    ['a URL', new URL('file:///tmp')],
  ];

  it.each(badInputs)('%s is rejected, never minted into a handle', async (_label, bad) => {
    await withUrlSuffix('?__peekoverHarness', async () => loadMain());
    await expect(
      window.__peekoverHarness!.openFromHandle(bad as FileSystemDirectoryHandle),
    ).rejects.toThrow();
  });
});

// ── 5 — the positive half: a real handle reaches the SAME reader state openFolder() would ──────
//
// The OS folder chooser cannot be driven headlessly (Task 0), so — exactly as
// folderGrant.browser.test.ts does for the CTA's own path — the grant stand-in is a REAL OPFS
// `FileSystemDirectoryHandle`, populated in-test. Everything downstream is the real engine path:
// the real `folderSourceFromHandle` (never re-implemented here), the real bounded walk, the real
// `getFile().text()` read, the real M1 `mount()` render. The assertions below are the SAME shape
// folderGrant.browser.test.ts's own "drives the FULL app-page grant flow" test uses for the CTA's
// `openFolder()` path — chip, file list, rendered heading from real disk bytes — proving the
// harness path reaches the identical observable state, not a parallel one.

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

let seq = 0;
const nextName = () => `peekover-harness-${(seq += 1)}-${Math.trunc(performance.now())}`;

async function opfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (await navigator.storage?.getDirectory?.()) ?? null;
  } catch {
    return null;
  }
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

/** Feature-detect the real OPFS path — mirrors folderGrant.browser.test.ts's own probe exactly,
 *  so this suite skips cleanly (never a false failure) on an engine without it. */
async function detectSupport(): Promise<boolean> {
  const root = await opfsRoot();
  if (!root) return false;
  const probeName = `peekover-harness-probe-${Math.trunc(performance.now())}`;
  try {
    const dir = await root.getDirectoryHandle(probeName, { create: true });
    await writeFile(dir, 'x.md', '# x');
    if (typeof dir.values !== 'function') return false;
    const first = await dir.values()[Symbol.asyncIterator]().next();
    await root.removeEntry(probeName, { recursive: true });
    return !first.done;
  } catch {
    try {
      await root.removeEntry(probeName, { recursive: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

let supported = false;
beforeAll(async () => {
  supported = await detectSupport();
});

const createdDirs: string[] = [];
async function makeDir(): Promise<FileSystemDirectoryHandle> {
  const root = (await opfsRoot())!;
  const name = nextName();
  createdDirs.push(name);
  return root.getDirectoryHandle(name, { create: true });
}
afterEach(async () => {
  const root = await opfsRoot();
  if (!root) return;
  for (const name of createdDirs.splice(0)) {
    try {
      await root.removeEntry(name, { recursive: true });
    } catch {
      /* ignore */
    }
  }
});

describe('the positive half — a real handle reaches the SAME reader state openFolder() would', () => {
  it('drives the harness to the granted chip, file list, and rendered content from real disk bytes', async () => {
    if (!supported) return; // Firefox / no-OPFS engine — feature-detected, never a false failure.

    const dir = await makeDir();
    await writeFile(dir, 'notes.md', '# Harness render\n\nfrom the query-gated seam');

    await withUrlSuffix('?__peekoverHarness', async () => loadMain());
    await window.__peekoverHarness!.openFromHandle(dir);

    const chip = await waitFor(() => appRoot!.querySelector('.peekover-app__chip'));
    expect(chip.textContent).toContain('granted:');
    const fileBtn = await waitFor(() =>
      appRoot!.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
    );
    expect(fileBtn.textContent).toBe('notes.md');

    fileBtn.click();
    const h1 = await waitFor(() =>
      appRoot!.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('h1'),
    );
    expect(h1.textContent).toContain('Harness render');
  });

  it('is the same applyOutcome/mountAppShell path the CTA uses: an equivalent folder driven through a directly-injected openFolder() (folderGrant.browser.test.ts\'s own pattern) reaches an identically-shaped chip + file list', async () => {
    if (!supported) return;

    const dir = await makeDir();
    await writeFile(dir, 'notes.md', '# Control render\n\nfrom a directly-injected openFolder');

    const { folderSourceFromHandle } = await import('../../src/app/chromiumFolderSource');
    const container = document.createElement('div');
    document.body.appendChild(container);
    try {
      const app = mountAppShell(container, {
        openFolder: async () => ({ ok: true, source: await folderSourceFromHandle(dir) }),
        store: fakeStore(),
      });
      await app.openFolder();

      const chip = container.querySelector('.peekover-app__chip');
      expect(chip?.textContent).toContain('granted:');
      const fileBtn = container.querySelector<HTMLButtonElement>(
        '[role="treeitem"][data-kind="file"]',
      );
      expect(fileBtn?.textContent).toBe('notes.md');
    } finally {
      container.remove();
    }
  });
});
