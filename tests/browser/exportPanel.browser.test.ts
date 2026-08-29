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

import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent, commands } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';

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
/** ★ Live as of task 3.3 — the LAST enabled stop in DOM order (close, html, copy-html), which is
 *  what the wrap tests below need: 3.2's own trap test was written when `html` was still last. */
const copyHtmlRowIn = (panel: HTMLElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>('[data-export="copy-html"]')!;

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
    // ★ Live as of task 3.3: copy-html is now the LAST enabled stop in DOM order (close, html,
    // copy-html) — `html` (3.2's own last stop) is now a MIDDLE stop.
    const last = copyHtmlRowIn(panel);

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
    const last = copyHtmlRowIn(panel);

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
    // (close, HTML, copy-HTML as of task 3.3); without it, Tab would eventually walk into the
    // document behind, and `behind` (a real, focusable control already on screen) is exactly what
    // it would reach.
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

describe('rows 6 + 7 — every row is a real <button> with a non-bare accessible name', () => {
  it('all 5 rows are real buttons, keyboard-operable, no tabindex of their own', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const rows = rowsIn(panel);

    expect(rows).toHaveLength(5);
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
    };
    for (const [key, label] of Object.entries(expected)) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.getAttribute('aria-label')).toBe(label);
    }
  });
});

// ── Q1(a) — HTML'S ROW IS WIRED LIVE; THE OTHER 4 WERE INERT AT 3.2 ──────────────────────────
//
// ★ UPDATED AT TASK 3.3: copy-html went live at that task (its own `copyAsHtml.browser.test.ts`
// is where THAT row's liveness is proven) — this file only re-states the DAY-ONE-SHAPE remainder
// (Q4's disabled-not-hidden decision, `decisions.md`'s 2026-08-29 M10 task-3.2 entry): the 3 rows
// with no task landed yet stay disabled, and this task's own scope is unaffected by 3.3's edit.

describe('Q1(a) — the HTML row drives the real exportHtml codepath; disabled rows stay disabled', () => {
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

  it('the 3 rows with no task landed yet render disabled — no click handler, nothing to drive', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    for (const key of ['copy-plain-text', 'copy-rich-text', 'pdf']) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.disabled, `row "${key}" should still be inert`).toBe(true);
    }
    // copy-html went live at task 3.3 — asserted NOT disabled here as the boundary check for this
    // file's own claim; its actual liveness (click -> real clipboard write) is 3.3's own test.
    expect(panel.querySelector<HTMLButtonElement>('[data-export="copy-html"]')!.disabled).toBe(
      false,
    );
  });
});
