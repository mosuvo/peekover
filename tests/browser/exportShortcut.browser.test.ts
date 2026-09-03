// The Ctrl/Cmd+S export shortcut (task 8.1, D-5) in a REAL ENGINE, Chromium AND Firefox.
//
// Two claims, two describe blocks:
//
//   (A) WHERE the listener lives. `entrypoints/app/main.ts` binds it, app-page-only, inside its
//       own `if (root)` block — the deliberate INVERSION of `readerMode.ts`'s
//       `installToggleShortcut`, which is installed from a module BOTH surfaces run and scopes
//       itself only by DOM shape (`data-mode` present). Proven by driving the SAME keystroke
//       against a real content-script-shaped host (`mount()`, no main.ts involved) BEFORE
//       main.ts's top level ever runs, then again after — only the second dispatch reacts. This
//       is RED-FIRST and can genuinely fail: if 8.1 had reused `readerMode.ts`'s DOM-shape
//       pattern instead, the FIRST dispatch (content-script-shaped host, no main.ts) would
//       already react, because that pattern doesn't care which script installed it.
//
//   (B) THE ONE DISPATCH PATH. `appShell.ts`'s five export functions are lifted so a panel click
//       and `AppController.triggerLastExport()` (main.ts's own caller) reach the IDENTICAL
//       function — never a second `saveSettings({...}); <export>()` pair. Proven directly against
//       `mountAppShell()` (no need to drive main.ts's own keydown wiring for this half): a row
//       click and a `triggerLastExport()` call produce the SAME real artifact / the SAME
//       `window.print()` call, and `lastExportFormat: null` (before any export has ever run) is a
//       graceful no-op that picks no default (task 10.1 owns that).
//
// ══ THE preventDefault TEST-HONESTY LIMIT (Q4, `diagramLightbox`'s own doc comment #5) ══════════
//
// A dispatched (non-trusted) `KeyboardEvent` lets a test read `event.defaultPrevented` — a JS
// property, readable on synthetic events too — so these tests CAN assert the handler calls
// `preventDefault()`. They CANNOT observe the browser's native "Save Page As" dialog being
// absent: that is a trusted-event-only default no automated harness can watch (the same limit
// `tocNetwork.browser.test.ts`'s own backtick-shortcut test accepts for its document-level
// handler). "Suppresses the native save dialog" is therefore proven as "our handler calls
// `preventDefault()` on a Ctrl/Cmd+S keydown" — the browser's own contract does the rest.
//
// ══ WHY SECTION (A) COUNTS REACTIONS INSTEAD OF ASSERTING AN ABSOLUTE "false" ═══════════════════
//
// `vitest.config.ts`'s own header comment records that the browser project's test files run
// SERIALLY and share ONE real `document`/`window` per engine (task 4.5's own viewport-leak fix —
// a HARNESS property, not reset between files). `appHarnessSeam.browser.test.ts` (task 2.1)
// dynamically re-imports this same `entrypoints/app/main.ts` many times across its own `it`
// blocks; after this task, EVERY one of those imports installs a real `document`-level keydown
// listener that nothing ever tears down. So by the time this file's own tests run, `document` may
// already carry zero, one, or several such listeners left over from an earlier file — an absolute
// "Ctrl+S does nothing yet" assertion would be contaminated by that leftover state and could fail
// (or pass by accident) depending on file run order, not on this task's own code.
//
// The fix: never assert an absolute reaction count. Spy on `KeyboardEvent.prototype.preventDefault`
// (a single call-count instrument every installed listener — leaked or fresh — feeds into
// identically, since they are all instances of the SAME production code) and compare it BEFORE and
// AFTER a specific change, in the SAME test. A DELTA of 0 or +1 is meaningful and correct
// regardless of how many stray listeners already exist, because the claim under test is never
// "the count is exactly N" but "doing X changed the count by exactly this much."

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppController, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { currentSettings, resetSettingsSeamForTest, saveSettings } from '../../src/settings/settingsSeam';

function preventDefaultSpy(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(KeyboardEvent.prototype, 'preventDefault');
}

/** Dispatch a Ctrl/Cmd+S keydown and return exactly how many installed listeners called
 *  `preventDefault()` for THIS ONE dispatch. Clears the spy's call log FIRST — `spy.mock.calls`
 *  is cumulative since the spy was created, so without clearing, a second measurement in the same
 *  test would include the first dispatch's calls too (the bug an earlier draft of this file hit:
 *  "expected 3 to be 2" — the first dispatch's count leaking into the second's). */
function reactionsTo(
  spy: ReturnType<typeof vi.spyOn>,
  target: EventTarget,
  opts: { meta?: boolean } = {},
): number {
  spy.mockClear();
  dispatchCtrlS(target, opts);
  return spy.mock.calls.length;
}

interface ExportDownloadProbe {
  suggestedFilename: string;
  html: string;
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
}

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    armExportDownload(): Promise<true>;
    collectExportDownload(): Promise<ExportDownloadProbe>;
  }
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Dispatch a Ctrl/Cmd+S keydown at `target` (bubbling to `document`, where main.ts's listener —
 *  and any leaked ones — live). See the header note on why a dispatched event, not a trusted
 *  gesture, is the right (and honestly-scoped) instrument here, and why callers read reaction
 *  COUNTS off a `preventDefault` spy rather than this function's own return value. */
function dispatchCtrlS(target: EventTarget, opts: { meta?: boolean } = {}): boolean {
  const event = new KeyboardEvent('keydown', {
    key: 's',
    ctrlKey: !opts.meta,
    metaKey: !!opts.meta,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

// ── (A) WHERE THE LISTENER LIVES ────────────────────────────────────────────────────────────────

const originalHref = location.href;
let appRoot: HTMLDivElement | null = null;
const csHosts: HTMLElement[] = [];

function mountAppRoot(): void {
  appRoot = document.createElement('div');
  appRoot.id = 'app';
  document.body.appendChild(appRoot);
}

let importSeq = 0;
/** Fresh top-level evaluation of the real entrypoint — mirrors `appHarnessSeam.browser.test.ts`'s
 *  own `loadMain` exactly (cache-busted so `if (root)`'s body genuinely re-runs, installing a
 *  fresh keydown listener each time this is called). */
async function loadMain(): Promise<void> {
  importSeq += 1;
  await import(/* @vite-ignore */ `../../entrypoints/app/main.ts?exportShortcutTest=${importSeq}`);
}

beforeEach(() => {
  mountAppRoot();
  resetSettingsSeamForTest();
});

afterEach(() => {
  appRoot?.remove();
  appRoot = null;
  for (const h of csHosts.splice(0)) h.remove();
  history.replaceState(null, '', originalHref);
  resetSettingsSeamForTest();
});

describe('task 8.1 (D-5) — the Ctrl/Cmd+S listener is app-page-only, never scoped by DOM shape', () => {
  it('★ RED-FIRST: a content-script-shaped host (real data-mode) adds ZERO reactions; loading main.ts adds exactly ONE', async () => {
    const spy = preventDefaultSpy();
    try {
      const baseline = reactionsTo(spy, document); // whatever pre-existing listeners contribute

      // The content-script-shaped host: a real `mount()`ed reader, `data-mode` present — the
      // EXACT shape `readerMode.ts`'s own `installToggleShortcut` scopes itself by. If 8.1 had
      // (wrongly) reused that DOM-shape pattern instead of binding in main.ts, mounting this
      // alone would add a reaction here, before main.ts is ever imported.
      const csHost = document.createElement('peekover-root');
      document.body.appendChild(csHost);
      csHosts.push(csHost);
      mount('# Content-script surface\n\nBody text.', csHost, {});
      expect(
        csHost.getAttribute('data-mode'),
        'firing control: the shape must be genuinely real',
      ).toBe('reading');

      const afterCsMount = reactionsTo(spy, document);
      expect(afterCsMount, 'DOM shape alone must add nothing').toBe(baseline);

      await loadMain(); // NOW the app page's own script runs — the only thing that changed

      const afterMain = reactionsTo(spy, document);
      expect(afterMain, 'main.ts running must add exactly one new reaction').toBe(afterCsMount + 1);
    } finally {
      spy.mockRestore();
    }
  });

  it('reacts to Cmd+S (metaKey) exactly as it reacts to Ctrl+S (ctrlKey)', async () => {
    await loadMain();
    const spy = preventDefaultSpy();
    try {
      const reactions = reactionsTo(spy, document, { meta: true });
      expect(reactions, 'the freshly installed listener must also react to the metaKey variant').toBeGreaterThan(0);
    } finally {
      spy.mockRestore();
    }
  });

  it("ignores the key while focus is in an editable field (mirrors readerMode.ts's own isEditableTarget guard) — the native dialog is left free to appear", async () => {
    await loadMain();
    const spy = preventDefaultSpy();
    try {
      const normal = reactionsTo(spy, document);
      expect(normal, 'firing control: at least the freshly installed listener must react normally').toBeGreaterThan(0);

      const input = document.createElement('input');
      appRoot!.appendChild(input);
      input.focus();
      expect(document.activeElement).toBe(input);

      const guarded = reactionsTo(spy, input); // bubbles to document; e.target is the focused input
      expect(guarded, 'no reaction while focus is in an editable field').toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('Q2 — lastExportFormat is null before any export has ever run: preventDefault STILL fires, but no export runs and no default is picked (defers to task 10.1)', async () => {
    expect(currentSettings().lastExportFormat).toBeNull(); // firing control: genuinely null

    await loadMain();
    const spy = preventDefaultSpy();
    try {
      const reactions = reactionsTo(spy, document);
      expect(reactions, 'the dialog is suppressed regardless of the null case').toBeGreaterThan(0);
    } finally {
      spy.mockRestore();
    }

    expect(currentSettings().lastExportFormat).toBeNull(); // still null — no default was picked
  });
});

// ── (B) THE ONE DISPATCH PATH ────────────────────────────────────────────────────────────────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function mdFile(path: string, text = `# ${path}\n\nBody of ${path}.`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

function memorySource(): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [mdFile('alpha.md')],
  };
}

const containers: HTMLElement[] = [];

/** `exportPanel.browser.test.ts`'s own `mountWithFile` shape, plus the `AppController` itself —
 *  this block needs `triggerLastExport()` directly, not just the rendered DOM. */
async function mountWithFile(): Promise<{
  app: AppController;
  container: HTMLElement;
  toggle: HTMLButtonElement;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource() }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = await waitFor(() =>
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  );
  fileBtn.click();
  await waitFor(() => container.querySelector('.peekover-app__reader__host'));

  return {
    app,
    container,
    toggle: container.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!,
  };
}

async function openPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return waitFor(() => container.querySelector<HTMLElement>('.peekover-export'));
}

const htmlRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="html"]')!;
const pdfRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="pdf"]')!;

describe('task 8.1 (D-5) — triggerLastExport() reaches the IDENTICAL function a panel click does', () => {
  afterEach(() => {
    for (const c of containers.splice(0)) c.remove();
    resetSettingsSeamForTest();
  });

  it('HTML: a click, then triggerLastExport() with no click at all, download the SAME real artifact — one dispatcher, not two', async () => {
    const { app, container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    resetSettingsSeamForTest(); // isolate this row's write from the fresh mount's own load()

    await commands.armExportDownload();
    htmlRowIn(panel).click();
    // Read SYNCHRONOUSLY, before any await — `exportPanel.browser.test.ts`'s own write-proof
    // tests use this exact shape for the same reason: a still-pending `settingsPort.load()` from
    // this same mount can otherwise resolve during the real async gap below and clobber the
    // in-memory snapshot with a stale persisted value (measured: this raced on Firefox once).
    expect(currentSettings().lastExportFormat, 'the click must write synchronously').toBe('html');
    const fromClick = await commands.collectExportDownload();
    expect(fromClick.consoleErrors).toEqual([]);
    expect(fromClick.suggestedFilename).toBe('alpha.html');

    // Re-pin the precondition `triggerLastExport()` itself reads — the download-collection await
    // above reopens the same race window a second time. This is NOT restating the click's own
    // effect (already proven synchronously above); it isolates THIS test's actual claim —
    // triggerLastExport() dispatches on whatever `lastExportFormat` says — from an unrelated
    // settings-load timing race in the test scaffolding.
    saveSettings({ lastExportFormat: 'html' });

    await commands.armExportDownload();
    app.triggerLastExport(); // the Ctrl+S path's own call — no row click involved
    const fromShortcut = await commands.collectExportDownload();

    expect(fromShortcut.consoleErrors).toEqual([]);
    expect(fromShortcut.suggestedFilename).toBe(fromClick.suggestedFilename);
    expect(fromShortcut.h1Text).toBe(fromClick.h1Text);
  });

  it('PDF: triggerLastExport() calls window.print() exactly like the row does, through the SAME guard', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    try {
      const { app, container, toggle } = await mountWithFile();
      const panel = await openPanel(container, toggle);

      pdfRowIn(panel).click();
      expect(printSpy).toHaveBeenCalledTimes(1);
      expect(currentSettings().lastExportFormat).toBe('pdf');

      app.triggerLastExport();
      expect(printSpy).toHaveBeenCalledTimes(2); // the SAME call, reached via the dispatcher
    } finally {
      printSpy.mockRestore();
    }
  });

  it('null lastExportFormat: triggerLastExport() is a graceful no-op — no default picked, no export runs', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    try {
      const { app } = await mountWithFile();
      resetSettingsSeamForTest(); // isolate from the fresh mount's own load(); back to null
      expect(currentSettings().lastExportFormat).toBeNull();

      expect(() => app.triggerLastExport()).not.toThrow();

      expect(printSpy).not.toHaveBeenCalled();
      expect(currentSettings().lastExportFormat).toBeNull(); // still no default picked
    } finally {
      printSpy.mockRestore();
    }
  });
});
