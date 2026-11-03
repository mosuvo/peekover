// App-page shell theme control — the REAL-ENGINE proof (task 5.2), Chromium AND Firefox.
//
// Two properties, and they fail in different ways, so they are asserted separately.
//
//   COHERENCE. The header control must theme the shell root AND the contained reader pane
//   together — no half-themed screen (spec §7-3). Asserted on COMPUTED `--paper`/`--ink`, not on
//   the `data-theme` attribute: the attribute is what our code writes, the computed token is what
//   the engine actually resolved, and the two diverge exactly when the cascade is wrong (which is
//   the bug 3.3 existed to fix). This follows the group-3 precedent in themeRuntime.browser.test.ts
//   deliberately — an attribute-only assertion would have passed on the pre-3.3 shell.
//
//   PERSISTENCE. A pick must survive. This drives the REAL `directPort` over each engine's REAL
//   IndexedDB, then RE-MOUNTS the shell and checks the setting comes back.
//
// WHAT "PERSISTS" HONESTLY MEANS HERE. This harness loads no unpacked extension and never
// navigates, so a re-mount is NOT a browser reload: the page, the module graph and the module-level
// theme state all survive it. To keep the test from passing on that leftover in-memory state, each
// persistence test resets the runtime to `auto` and drops the memoized DB connection before
// re-mounting — so the value it reads back demonstrably came off disk, not out of a live module.
// That is as close as this harness gets. The true reload (open the app page fresh, confirm the
// theme is still there) is human gate 8.1.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page, commands } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest, resetThemeSaveSinkForTest } from '../../src/theme/themeControl';
import {
  getSettings,
  putSettings,
  wipeAll,
  __resetConnectionForTest,
} from '../../src/app/store';
import type { Settings } from '../../src/settings/settings';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C302, C303, C305, C306, C307); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateColorScheme(value: 'light' | 'dark' | null): Promise<void>;
  }
}

const DOC = '# Heading\n\nSome body text.\n\n## Second\n\nMore text.\n';
const HEADER_CONTROL = '.peekover-app__theme-toggle';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const token = (el: HTMLElement, name: string) =>
  getComputedStyle(el).getPropertyValue(name).trim().toUpperCase();

function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

/** A store fake with NO settings methods — the shell must still mount and the control still work
 *  (persistence is best-effort). The persistence tests use the REAL store instead. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** The REAL store, so a pick goes through directPort into this engine's own IndexedDB. */
function realStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    getSettings,
    putSettings,
  };
}

/** Mount the real shell, open a folder and select the file — yielding the shell root, the
 *  contained reader host readerPane created, and the header control. All production paths. */
async function mountShell(store: AppStore): Promise<{
  container: HTMLElement;
  shell: HTMLElement;
  reader: HTMLElement;
  control: HTMLButtonElement;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', DOC) }),
    store,
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();

  let reader: HTMLElement | null = null;
  for (let i = 0; i < 100 && !reader; i += 1) {
    reader = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (!reader) await sleep(20);
  }
  if (!reader) throw new Error('contained reader host never appeared');

  return {
    container,
    shell: container.querySelector<HTMLElement>('.peekover-app')!,
    reader,
    control: container.querySelector<HTMLButtonElement>(HEADER_CONTROL)!,
  };
}

/** Wait until the header control's label settles on `expected`. The shell's settings load is
 *  async, so a mount-time read races it — this waits for the observable outcome, the same
 *  discipline themeRuntime.browser.test.ts uses for the OS flip. */
async function waitForLabel(control: HTMLButtonElement, expected: string): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (control.textContent === expected) return;
    await sleep(20);
  }
  expect(control.textContent).toBe(expected); // timed out -> report reality
}

beforeEach(async () => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeSaveSinkForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await commands.emulateColorScheme('light');
});

afterEach(async () => {
  setThemeSetting('auto');
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeSaveSinkForTest();
  document.body.replaceChildren();
  await commands.emulateColorScheme(null);
});

// ── The control exists, in the header, beside the storage toggle ──────────────────────────

describe('shell theme control — present and wired', () => {
  it('renders in the header beside the storage toggle', async () => {
    const { shell, control } = await mountShell(fakeStore());
    expect(control).toBeTruthy();
    expect(control.tagName).toBe('BUTTON');

    const header = shell.querySelector<HTMLElement>('.peekover-app__header')!;
    expect(header.contains(control)).toBe(true);
    // Beside, not nested in, the storage toggle — one control group in the header.
    const storage = shell.querySelector<HTMLElement>('.peekover-app__storage-toggle')!;
    expect(storage.parentElement).toBe(control.parentElement);
  });

  it('offers auto/light/dark and starts on the Auto default', async () => {
    const { control } = await mountShell(fakeStore());
    await waitForLabel(control, 'Theme: Auto');

    control.click();
    expect(control.textContent).toBe('Theme: Light');
    control.click();
    expect(control.textContent).toBe('Theme: Dark');
    control.click();
    expect(control.textContent).toBe('Theme: Auto'); // no sepia (D-1 = A)
  });
});

// ── COHERENCE: shell + reader move together, on COMPUTED tokens ──────────────────────────

describe('shell theme control — shell and reader pane stay coherent (spec §7-3)', () => {
  it('a header pick themes BOTH the shell root and the contained reader pane (dark)', async () => {
    const { shell, reader, control } = await mountShell(fakeStore());

    control.click(); // auto -> light
    control.click(); // light -> dark

    // The COMPUTED tokens, not the attribute: this is what the engine actually resolved, and it
    // is what a half-themed screen would betray.
    expect(token(shell, '--paper')).toBe(token(reader, '--paper'));
    expect(token(shell, '--ink')).toBe(token(reader, '--ink'));
    expect(token(shell, '--paper')).toBe('#12141C');
    expect(token(shell, '--ink')).toBe('#EAEBF3');
  });

  it('and under a manual LIGHT pick on an OS-light machine', async () => {
    const { shell, reader, control } = await mountShell(fakeStore());

    control.click(); // auto -> light

    expect(token(shell, '--paper')).toBe(token(reader, '--paper'));
    expect(token(shell, '--ink')).toBe(token(reader, '--ink'));
    expect(token(shell, '--paper')).toBe('#FBFBF8');
  });

  // RETIRED (C304) at 013 task 4.5: "keeps the in-reader pill and the header control showing the SAME selection" —
  // the in-reader pill is gone from the app page (`pills: false`), so there are no two controls to agree. What
  // takes its place is asserted: the app page carries exactly ONE theme control, the toolbar's.
  it('the app page carries ONE theme control — the toolbar\'s — and no in-reader pill', async () => {
    const { reader, control } = await mountShell(fakeStore());
    expect(reader.shadowRoot!.querySelector('.peekover-theme-toggle'), 'no in-reader pill').toBeNull();
    expect(document.querySelectorAll('.peekover-app .peekover-theme-toggle')).toHaveLength(1);
    control.click();
    expect(control.textContent).toBe('Theme: Light');
  });
});

// ── PERSISTENCE: through the real directPort + the engine's real IndexedDB ───────────────

describe('shell theme control — the choice persists (real IndexedDB)', () => {
  afterEach(async () => {
    // Leave no row behind for the next test / suite.
    try {
      await wipeAll();
    } catch {
      /* best-effort cleanup */
    }
    __resetConnectionForTest();
    await sleep(0);
  });

  it('a header pick is written to the store', async () => {
    const { control } = await mountShell(realStore());
    await waitForLabel(control, 'Theme: Auto');

    control.click(); // auto -> light
    control.click(); // light -> dark

    // Read the row back through the store itself, not the port's cache.
    for (let i = 0; i < 100; i += 1) {
      const stored: Settings = await getSettings();
      if (stored.theme === 'dark') return;
      await sleep(20);
    }
    expect((await getSettings()).theme).toBe('dark'); // timed out -> report reality
  });

  it('comes back on a RE-MOUNT, read from disk rather than live module state', async () => {
    const first = await mountShell(realStore());
    await waitForLabel(first.control, 'Theme: Auto');
    first.control.click();
    first.control.click(); // -> dark, persisted

    for (let i = 0; i < 100 && (await getSettings()).theme !== 'dark'; i += 1) await sleep(20);
    expect((await getSettings()).theme).toBe('dark');

    // Tear the page state down and make the in-memory value WRONG, so a re-mount that failed to
    // read from disk would show 'auto' and fail. Without this the test would pass on leftover
    // module state and prove nothing about persistence.
    document.body.replaceChildren();
    resetThemeHostsForTest();
    resetThemeControlsForTest();
    resetThemeSaveSinkForTest();
    setThemeSetting('auto');
    __resetConnectionForTest();
    await sleep(0);

    const second = await mountShell(realStore());

    // The shell's own directPort.load() resolved the persisted dark and applied it.
    await waitForLabel(second.control, 'Theme: Dark');
    expect(token(second.shell, '--paper')).toBe('#12141C');
    expect(token(second.reader, '--paper')).toBe('#12141C');

    // NOT A BROWSER RELOAD — see the file header. This is a re-mount reading the real IndexedDB
    // with the in-memory state deliberately reset; the genuine reload is human gate 8.1.
  });

  it('falls back to Auto when the store has no settings row', async () => {
    await wipeAll();
    __resetConnectionForTest();
    await sleep(0);

    const { control, shell } = await mountShell(realStore());

    await waitForLabel(control, 'Theme: Auto');
    // OS is emulated light, and Auto follows the OS.
    expect(token(shell, '--paper')).toBe('#FBFBF8');
  });

  it('still applies a pick when the store has NO settings methods at all', async () => {
    // A minimal fake store: persistence is impossible, but the UI must not throw or freeze —
    // the pick still governs this view (AGENTS.md #5, best-effort storage).
    const { shell, control } = await mountShell(fakeStore());
    control.click();
    control.click();
    expect(token(shell, '--paper')).toBe('#12141C');
  });
});
