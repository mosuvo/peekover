// The export panel (task 3.2, D-2, Ruling 2) in a REAL ENGINE, Chromium AND Firefox.
//
// This is `exportControls.ts`'s + `appShell.ts`'s own panel test — tasks.md's §3.2 body is
// explicit that the export ROWS themselves (their live behaviour) land at tasks 3.1, 3.3, 3.4,
// 4.1, 6.1/7.1; THIS task tests the PANEL: §3.11 rows 3, 4, 5 (out-of-flow overlay mechanics,
// inherited from `storagePanelOverlay.browser.test.ts`'s own baseline), row 11 (Ruling 2's focus
// trap, real-engine or nothing, `diagramLightbox.browser.test.ts`'s own baseline reused rather
// than re-derived), and rows 6/7 (every row a real button with an accessible name). Q1's own
// resolution (the ONE row this task wires live is HTML export, since no later task claims that
// wiring) gets one sanity check reusing 3.1's own `armExportDownload`/`collectExportDownload`
// commands — proving the panel's button actually drives the real download, not a second
// assertion of 3.1's own already-proven codepath.
//
// The panel is APP-PAGE DOM, not a shadow-root surface (D-2) — unlike `diagramLightbox`'s own
// trap test, `document.activeElement` IS the element actually holding focus here; there is no
// shadow boundary to read through.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { page, userEvent, commands, cdp } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { currentSettings, resetSettingsSeamForTest, saveSettings } from '../../src/settings/settingsSeam';

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

const WIDE = { width: 1400, height: 900 };
const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test

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

// A single file, deliberately — this suite never depends on tree ordering, only on there being
// exactly one document to select (Q2's enabled state) and export (Q1's HTML-row sanity check).
function memorySource(): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [mdFile('alpha.md')],
  };
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const containers: HTMLElement[] = [];
afterEach(async () => {
  for (const c of containers.splice(0)) c.remove();
  await page.viewport(NARROW.width, NARROW.height);
  resetSettingsSeamForTest(); // task 8.2's write-proof block (below) leaves the seam dirty
});

/** Mount the shell with an in-memory folder granted (no file selected yet — `activeFile` is
 *  null, the Q2 disabled state). */
async function mountGranted(): Promise<{
  container: HTMLElement;
  header: HTMLElement;
  toggle: HTMLButtonElement;
  control: HTMLElement;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource() }),
    store: fakeStore(),
  });
  await app.openFolder();
  await waitFor(() => container.querySelector('[role="treeitem"][data-kind="file"]'));

  return {
    container,
    header: container.querySelector<HTMLElement>('.peekover-app__header')!,
    toggle: container.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!,
    control: container.querySelector<HTMLElement>('.peekover-app__export-control')!,
  };
}

/** `mountGranted` PLUS selecting a file — `activeFile` is set, the Q2 enabled state, and the
 *  reader host is really mounted (the real `mount()` pipeline, not a stub). */
async function mountWithFile(): Promise<
  Awaited<ReturnType<typeof mountGranted>> & { fileBtn: HTMLButtonElement }
> {
  const granted = await mountGranted();
  const fileBtn = granted.container.querySelector<HTMLButtonElement>(
    '[role="treeitem"][data-kind="file"]',
  )!;
  fileBtn.click();
  await waitFor(() => granted.container.querySelector('.peekover-app__reader__host'));
  return { ...granted, fileBtn };
}

async function openPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return waitFor(() => container.querySelector<HTMLElement>('.peekover-export'));
}

function box(el: Element): { top: number; left: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top),
    left: Math.round(r.left),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

const rowsIn = (panel: HTMLElement): HTMLButtonElement[] => [
  ...panel.querySelectorAll<HTMLButtonElement>('.peekover-export__row'),
];
const closeIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('.peekover-export__close')!;
const htmlRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="html"]')!;
/** ★ Live as of M11 task 6.2-R — the LAST enabled stop in DOM order (close, html, copy-html,
 *  copy-plain-text, copy-rich-text, pdf, copy-math-mathml), which is what the wrap tests below
 *  need: 7.1's own trap test was written when `pdf` was still last. */
const mathMlRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="copy-math-mathml"]')!;

function describeActive(): string {
  const el = document.activeElement;
  if (!el) return '<none>';
  const cls = el.className && typeof el.className === 'string' ? `.${el.className}` : '';
  return `${el.tagName.toLowerCase()}${cls}`;
}

// ── Q2: THE DOCUMENT-SCOPED TRIGGER ──────────────────────────────────────────────────────────

describe('Q2 — the export toggle is document-scoped, unlike the global storage toggle', () => {
  it('is DISABLED with no document open, and ENABLED once one is selected', async () => {
    const { toggle, container } = await mountGranted();
    expect(toggle.disabled, 'no file is selected yet — the toggle must not be clickable').toBe(true);

    const fileBtn = container.querySelector<HTMLButtonElement>(
      '[role="treeitem"][data-kind="file"]',
    )!;
    fileBtn.click();
    await waitFor(() => !toggle.disabled);

    expect(toggle.disabled).toBe(false);
  });

  it('a disabled toggle does not open the panel on click', async () => {
    const { toggle, container } = await mountGranted();
    toggle.click();
    await new Promise<void>((r) => setTimeout(r, 100));
    expect(container.querySelector('.peekover-export')).toBeNull();
  });
});

// ── ROWS 3, 4, 5 — OUT OF FLOW, ANCHORED AT ITS OWN TRIGGER, ZERO RESIDUAL FOOTPRINT ─────────

describe('rows 3, 4, 5 — the export panel is an out-of-flow overlay anchored at its own trigger', () => {
  it('is OUT OF FLOW (absolute or fixed), not a band that pushes the page', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    expect(['absolute', 'fixed']).toContain(getComputedStyle(panel.parentElement!).position);
  });

  it('opening does NOT move or resize the reader pane', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { container, toggle } = await mountWithFile();
    const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!;
    const before = box(reader);

    const panel = await openPanel(container, toggle);
    expect(box(panel).height).toBeGreaterThan(0); // non-vacuity: it really has a box

    expect(box(reader)).toEqual(before);
  });

  it('is anchored under ITS OWN toggle, not the storage toggle', async () => {
    const { container, toggle, control } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const slot = panel.parentElement!; // .peekover-app__export-slot — the positioned box itself

    const controlBox = control.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    const EPS = 1;
    expect(Math.abs(slotBox.top - controlBox.bottom)).toBeLessThanOrEqual(EPS);
    expect(Math.abs(slotBox.right - controlBox.right)).toBeLessThanOrEqual(EPS);
  });

  it('row 5 — closing returns the slot to ZERO footprint', async () => {
    const { container, toggle } = await mountWithFile();
    const slot = container.querySelector<HTMLElement>('.peekover-app__export-slot')!;
    const panel = await openPanel(container, toggle);
    expect(box(panel).height).toBeGreaterThan(0);

    toggle.click(); // close
    await waitFor(() => (container.querySelector('.peekover-export') ? null : true));

    expect(box(slot).height).toBe(0);
  });
});

// ── ROW 11 — RULING 2'S FOCUS TRAP, REAL-ENGINE OR NOTHING ───────────────────────────────────

describe('row 11 — the export panel traps focus and restores it (Ruling 2)', () => {
  it('opening moves focus INSIDE the panel; closing restores it to the toggle BY IDENTITY', async () => {
    const { container, toggle } = await mountWithFile();
    toggle.focus();
    expect(document.activeElement).toBe(toggle);

    const panel = await openPanel(container, toggle);
    const active = await waitFor(() => document.activeElement);
    expect(panel.contains(active), `focus landed on ${describeActive()}, outside the panel`).toBe(true);

    closeIn(panel).click();
    await waitFor(() => (container.querySelector('.peekover-export') ? null : true));
    expect(document.activeElement, `focus landed on ${describeActive()}, not the toggle`).toBe(toggle);
  });

  it('Tab from the LAST stop wraps to the FIRST — an actual focus move', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const close = closeIn(panel);
    // ★ Live as of M11 task 6.2-R: copy-math-mathml is now the LAST enabled stop in DOM order
    // (close, html, copy-html, copy-plain-text, copy-rich-text, pdf, copy-math-mathml) — `pdf`
    // (7.1's own last stop) is now a MIDDLE stop.
    const last = mathMlRowIn(panel);

    last.focus();
    expect(document.activeElement).toBe(last);
    await userEvent.tab();

    expect(document.activeElement, `landed on ${describeActive()}`).toBe(close);
    expect(document.activeElement).not.toBe(last);
  });

  it('Shift-Tab from the FIRST stop wraps back to the LAST', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const close = closeIn(panel);
    const last = mathMlRowIn(panel);

    close.focus();
    expect(document.activeElement).toBe(close);
    await userEvent.tab({ shift: true });

    expect(document.activeElement, `landed on ${describeActive()}`).toBe(last);
    expect(document.activeElement).not.toBe(close);
  });

  it('★ Escape closes AND returns focus to the toggle BY IDENTITY', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    closeIn(panel).focus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => (container.querySelector('.peekover-export') ? null : true));

    expect(container.querySelector('.peekover-export'), 'Escape left the panel open').toBeNull();
    expect(document.activeElement, `focus landed on ${describeActive()}`).toBe(toggle);
  });

  it('★ THE NEGATIVE: a control BEHIND the panel cannot receive Tab focus while it is open', async () => {
    const { container, toggle } = await mountWithFile();
    const behind = container.querySelector<HTMLButtonElement>(
      '[role="treeitem"][data-kind="file"]',
    )!;
    const panel = await openPanel(container, toggle);

    // Tab repeatedly — with the trap working this only ever cycles the panel's own enabled stops
    // (close, HTML, copy-HTML, copy-plain-text, copy-rich-text as of task 4.1); without it, Tab
    // would eventually walk into the document behind, and `behind` (a real, focusable control
    // already on screen) is exactly what it would reach.
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      expect(
        document.activeElement,
        `Tab escaped the panel onto ${describeActive()} after ${i + 1} presses`,
      ).not.toBe(behind);
      expect(panel.contains(document.activeElement), `focus escaped to ${describeActive()}`).toBe(
        true,
      );
    }
  });
});

// ── ROWS 6 + 7 — EVERY ROW IS A REAL BUTTON, ACCESSIBLE NAME CARRIES SELECTION + ACTION ──────

// ★ M11 task 6.2-R added a SIXTH row ('copy-math-mathml', §8-1(b)'s document-level "copy all
// formulas as MathML" action) to this SAME panel — the gate-3-ruled home for it, per
// `decisions.md`'s M11 GATE 3 FINDING 2. This file's own row-count/label assertions below are
// updated to 6 accordingly; that row's OWN live behaviour (collect+serialize+clipboard) is proven
// in `mathActions.browser.test.ts`, not here — this file only re-confirms the shared PANEL
// mechanics (count, real-button shape, accessible-name shape) still hold with a 6th row present.

describe('rows 6 + 7 — every row is a real <button> with a non-bare accessible name', () => {
  it('all 6 rows are real buttons, keyboard-operable, no tabindex of their own', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const rows = rowsIn(panel);

    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.tagName).toBe('BUTTON');
      expect(row.type).toBe('button');
      expect(row.hasAttribute('tabindex')).toBe(false);
      expect(row.getAttribute('aria-label'), `row ${row.dataset.export} has no accessible name`).not.toBeNull();
    }
  });

  it('each accessible name carries BOTH the selection and the action — never a bare glyph', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    const expected: Record<string, string> = {
      html: 'Export as HTML',
      'copy-html': 'Copy as HTML',
      'copy-plain-text': 'Copy as plain text',
      'copy-rich-text': 'Copy as rich text',
      pdf: 'Export as PDF',
      'copy-math-mathml': 'Copy formulas as MathML',
    };
    for (const [key, label] of Object.entries(expected)) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.getAttribute('aria-label')).toBe(label);
    }
  });
});

// ── Q1(a) — HTML'S ROW IS WIRED LIVE; THE OTHER 4 WERE INERT AT 3.2 ──────────────────────────
//
// ★ UPDATED AT TASKS 3.3/3.4/4.1/7.1: copy-html went live at 3.3, copy-plain-text at 3.4,
// copy-rich-text at 4.1, pdf at 7.1 (each row's own browser test — `copyAsHtml.browser.test.ts` /
// `copyAsPlainText.browser.test.ts` / `copyAsRichText.browser.test.ts` / `printMode.browser.test.ts`
// — is where THAT row's liveness is proven) — this file only re-states the DAY-ONE-SHAPE remainder
// (Q4's disabled-not-hidden decision, `decisions.md`'s 2026-08-29 M10 task-3.2 entry): as of 7.1
// there is no row left with no task landed, and this task's own scope is unaffected by any of the
// four edits.

describe('Q1(a) — the HTML row drives the real exportHtml codepath; every row is live as of 7.1', () => {
  it('clicking "Export as HTML" downloads the real file (3.1\'s own codepath, driven through the panel)', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    await commands.armExportDownload();
    htmlRowIn(panel).click();
    const probe = await commands.collectExportDownload();

    expect(probe.consoleErrors).toEqual([]);
    expect(probe.suggestedFilename).toBe('alpha.html'); // basenameForExport() strips ".md"
    expect(probe.h1Text).toBe('alpha.md');
  });

  it('no row renders disabled any more — 7.1 closed the last gap', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    for (const key of [
      'html',
      'copy-html',
      'copy-plain-text',
      'copy-rich-text',
      'pdf',
      'copy-math-mathml',
    ]) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.disabled, `row "${key}" should be live`).toBe(false);
    }
    // copy-html (3.3), copy-plain-text (3.4), copy-rich-text (4.1), pdf (7.1), and
    // copy-math-mathml (M11 6.2-R) all went live already — asserted NOT disabled here as the
    // boundary check for this file's own claim; each row's actual liveness (click -> real
    // clipboard write / real print) is proven in its own task's test.
  });
});

// ── TASK 8.2 (D-6): THE WRITE — every row persists ITS OWN key as `lastExportFormat` ───────────
//
// The row → format-string wiring lives in `appShell.ts`'s handlers, not `exportControls.ts` (the
// panel itself never sees `Settings`) — so this is the panel's own test file, alongside Q1(a)'s
// codepath proof above, not a new file. `saveSettings` updates `settingsSeam.ts`'s module-level
// snapshot SYNCHRONOUSLY (it does not await the seam's sink), so `currentSettings()` reflects the
// write the instant `.click()` returns — no polling, no dependence on the underlying clipboard
// write/print call actually succeeding (which is proven independently by each row's own task).

/** `copyAsHtml.browser.test.ts`'s own `grantClipboardConsent`/reset shape, reused verbatim
 *  (Chromium-only real browser CONSENT, never a manifest permission) — WITHOUT it the copy rows'
 *  real clipboard write rejects `NotAllowedError`, which is irrelevant to this block's own claim
 *  (the WRITE to `lastExportFormat` is synchronous, before the clipboard call) but pollutes the
 *  suite with an unhandled rejection. */
let grantedContextId: string | undefined;
let consentGranted = false;
async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported'; // Firefox: no such PermissionName — the trusted gesture alone suffices
  }
}
async function grantClipboardConsent(): Promise<void> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  grantedContextId = info?.targetInfo?.browserContextId;
  consentGranted = true;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
}

describe('task 8.2 (D-6) — clicking a row persists its own key as lastExportFormat', () => {
  afterEach(async () => {
    if (!consentGranted) return;
    consentGranted = false;
    await cdp().send('Browser.resetPermissions', { browserContextId: grantedContextId } as never);
  });

  it('HTML export writes lastExportFormat: "html"', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    resetSettingsSeamForTest(); // isolate from the fresh mount's own load()
    // The DEFAULT is now 'html' too (Ruling M-1), so seed a DIFFERENT value first — otherwise
    // "not already html" below would be true by construction, not because the click did anything.
    saveSettings({ lastExportFormat: 'pdf' });
    await commands.armExportDownload();

    expect(currentSettings().lastExportFormat).not.toBe('html'); // firing control: genuinely not html yet
    htmlRowIn(panel).click();
    expect(currentSettings().lastExportFormat).toBe('html');

    await commands.collectExportDownload(); // drain the armed listener, like Q1(a) above
  });

  it('each remaining row writes ITS OWN row key — copy-html, copy-plain-text, copy-rich-text, pdf', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined); // pdf row, no real dialog
    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

    const cases: Array<[string, string]> = [
      ['copy-html', 'copy-html'],
      ['copy-plain-text', 'copy-plain-text'],
      ['copy-rich-text', 'copy-rich-text'],
      ['pdf', 'pdf'],
    ];
    for (const [dataKey, expected] of cases) {
      const { container, toggle } = await mountWithFile();
      const panel = await openPanel(container, toggle);
      resetSettingsSeamForTest(); // isolate this row's write from the fresh mount's own load()

      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${dataKey}"]`)!;
      // A TRUSTED gesture, not a raw DOM `.click()` — the copy rows call the real Clipboard API,
      // which (like `copyAsHtml.browser.test.ts`'s own real-clipboard tests) needs one; `pdf`'s
      // `window.print()` is stubbed above regardless.
      await userEvent.click(row);
      expect(currentSettings().lastExportFormat, `row "${dataKey}"`).toBe(expected);
    }

    printSpy.mockRestore();
  });
});
