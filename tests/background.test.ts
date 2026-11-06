// THE BACKGROUND'S INSTALL LISTENER (M13 task 6.2; plan D-11; G-10).
//
// The setup guide opens in a new tab once, when Peekover is first installed — never on an extension
// update, a browser update or a shared-module update. The real `entrypoints/background.ts` is run here
// against a fake `browser` (its `#imports` replaced), so the test drives the listener the background
// actually registers, and checks the tab it asks for is the extension's own page.
//
// Placed in tests/, not beside the entry as tasks.md names it: WXT treats any `entrypoints/*.ts` as an
// unlisted script (it would ship), and the unit project does not include `entrypoints/`.

import { describe, it, expect, vi, beforeEach } from 'vitest';

type Listener = (details: { reason: string; previousVersion?: string }) => unknown;

const fake = vi.hoisted(() => {
  const installed: Listener[] = [];
  const created: Array<{ url?: string }> = [];
  const browser = {
    action: { onClicked: { addListener: vi.fn() } },
    runtime: {
      id: 'peekover-test-id',
      getURL: (path: string) => `chrome-extension://peekover-test-id${path.startsWith('/') ? '' : '/'}${path}`,
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: (fn: Listener) => installed.push(fn) },
    },
    tabs: {
      create: vi.fn(async (props: { url?: string }) => {
        created.push(props);
        return {};
      }),
    },
  };
  return { installed, created, browser };
});

vi.mock('#imports', () => ({
  defineBackground: (main: () => void) => ({ main }),
  browser: fake.browser,
}));
// The other two listeners' modules, by the entry's own `@/` specifiers (WXT's alias, not the unit
// project's): stubbed, as this file tests only the install listener.
//
// 6.2a: the store's guide mark is faked by its contract — `claimGuideShown()` resolves true when THIS
// call stored the mark, false when it was already there (the real one is an IndexedDB `add`, proven on
// both engines in tests/browser/guideMark.browser.test.ts); `wipe()` stands for "Wipe all data".
const mark = vi.hoisted(() => {
  const state = { stored: false, broken: false, claims: 0 };
  return {
    state,
    claimGuideShown: async () => {
      state.claims += 1;
      if (state.broken) throw new Error('IndexedDB unavailable');
      if (state.stored) return false;
      state.stored = true;
      return true;
    },
    wipe: () => {
      state.stored = false;
    },
  };
});
vi.mock('@/src/app/store', () => ({ getSettings: vi.fn(), putSettings: vi.fn(), claimGuideShown: mark.claimGuideShown }));
vi.mock('@/src/settings/settingsPort', () => ({ createSettingsListener: () => () => false }));
vi.mock('@/src/watch/watchRelay', () => ({ createWatchListener: () => () => false }));

async function startBackground(): Promise<void> {
  fake.installed.length = 0;
  fake.created.length = 0;
  mark.state.stored = false;
  mark.state.broken = false;
  mark.state.claims = 0;
  const mod = (await import('../entrypoints/background')) as unknown as { default: { main: () => void } };
  mod.default.main();
}

async function fire(reason: string): Promise<Array<{ url?: string }>> {
  for (const listener of fake.installed) await listener({ reason, previousVersion: reason === 'update' ? '0.0.9' : undefined });
  // The listener's storage work is not awaited by the browser; let it settle before reading tabs.
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0));
  return fake.created.slice();
}

describe('6.2 — the setup guide opens on install, never on an update (D-11; G-10)', () => {
  beforeEach(startBackground);

  it('the background registers an install listener', () => {
    expect(fake.installed.length, 'runtime.onInstalled listeners').toBeGreaterThanOrEqual(1);
  });

  it('"install" opens exactly one tab, at the extension\'s own onboarding page', async () => {
    const tabs = await fire('install');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]!.url).toBe('chrome-extension://peekover-test-id/onboarding.html');
    expect(Object.keys(tabs[0]!), 'only a url — no window, no tab field read').toEqual(['url']);
  });

  // Chrome names the browser update "chrome_update"; Firefox "browser_update" (MDN, 2026-11-06).
  for (const reason of ['update', 'chrome_update', 'browser_update', 'shared_module_update']) {
    it(`"${reason}" opens nothing`, async () => {
      expect(await fire(reason), `tabs opened on "${reason}"`).toEqual([]);
    });
  }

  it('a reason it does not know opens nothing', async () => {
    expect(await fire('something_new')).toEqual([]);
  });

  // ── 6.2a — at most once, whatever the browser reports (HUMAN DIRECTION, 2026-11-06) ──────────────
  // A command-line-loaded Chromium reports "install" at every browser start (6.2's measurement).

  it('6.2a: "install" twice opens ONE tab — the second finds the guide mark', async () => {
    await fire('install');
    const tabs = await fire('install');
    expect(tabs, 'tabs opened by two "install" events').toHaveLength(1);
  });

  it('6.2a: the mark already stored → "install" opens no tab', async () => {
    mark.state.stored = true;
    expect(await fire('install'), 'tabs opened with the mark present').toEqual([]);
  });

  it('6.2a: opening the guide stores the mark', async () => {
    await fire('install');
    expect(mark.state.stored, 'the mark after the guide opened').toBe(true);
  });

  it('6.2a: every other reason opens no tab and leaves the mark alone', async () => {
    for (const reason of ['update', 'chrome_update', 'browser_update', 'shared_module_update', 'something_new']) {
      expect(await fire(reason), `tabs opened on "${reason}"`).toEqual([]);
    }
    expect(mark.state.claims, 'mark reads/writes on a non-install reason').toBe(0);
    expect(mark.state.stored).toBe(false);
  });

  it('6.2a: "Wipe all data" clears the mark but opens nothing; a later real install opens the guide again', async () => {
    await fire('install');
    expect(fake.created).toHaveLength(1);
    mark.wipe();
    for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0));
    expect(fake.created, 'tabs opened by the wipe itself').toHaveLength(1);
    expect(await fire('install'), 'after a wipe, a real install re-arms the guide').toHaveLength(2);
  });

  it('6.2a: storage that cannot be read opens no tab (never twice outranks once)', async () => {
    mark.state.broken = true;
    expect(await fire('install')).toEqual([]);
  });

  it('the toolbar action still opens the app page (unchanged)', async () => {
    const click = fake.browser.action.onClicked.addListener.mock.calls.at(-1)![0] as () => void;
    click();
    await Promise.resolve();
    expect(fake.created.at(-1)!.url).toBe('chrome-extension://peekover-test-id/app.html');
  });
});
