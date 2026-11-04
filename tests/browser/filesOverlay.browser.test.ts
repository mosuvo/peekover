// filesOverlay — the real-engine half of 013 task 4.8 (D-10; gate-1 Q12; the approved 3.1 mock), Chromium AND Firefox.
//
// THE BREAKPOINT, MEASURED (4.8 step 1; `decisions.md` "M13 TASK 4.8"): the narrowest width keeping >= 60ch of reading
// text beside the folder pane is 1273 px with the TOC rail open (its default there) — so at <= 1272 px, while a
// document is open, the pane is an overlay behind "Files". Above it the pane stays in the row and "Files" is hidden.
//
// What is proven, in both themes, at 414 and 1272 (overlay) and 1273 and 1440 (sidebar):
//   • "Files" shows exactly where the overlay applies; the pane is out of the row there and the reading column keeps
//     its full measure (684 px of text) at 1272; above it the pane sits beside the reader;
//   • "Files" opens the pane over the reader: focus moves in, Tab and Shift+Tab stay inside, nothing in the toolbar
//     moves, the status line is not covered; it closes three ways — Escape and the scrim (focus back on "Files"),
//     and a press on another toolbar control (that control keeps it);
//   • choosing a file opens it AND closes the overlay; while editing, the unsaved-changes guard asks first — "Keep
//     editing" leaves the overlay open on the same document, "Discard edits" opens the file and closes it;
//   • the compact toolbar keeps two rows with "Files" in row 1 (414 and 863, an agent file — the widest row 1).
// Real input throughout (`userEvent`): a press, Tab and Escape as a user makes them.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { FILES_OVERLAY_MAX, TOOLBAR_CLASS } from '../../src/app/toolbar';
import { STATUS_LINE_CLASS } from '../../src/app/statusLine';
import { UNSAVED_DIALOG_CLASS, UNSAVED_DISCARD_CLASS, UNSAVED_KEEP_CLASS } from '../../src/app/unsavedGuard';
import { EDITOR_DIRTY_ATTR, editorSessionFor, teardownEditorShell } from '../../src/render/editorView';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetWatchRegistryForTest, stopWatch } from '../../src/watch/watchRegistry';

const C = TOOLBAR_CLASS;
const MEASURE_TEXT = 684; // --reader-measure 748 px less the column's 2 × 32 px padding (readerCss.ts)
const PARA = 'Peekover renders the markdown your tools and agents write, on this device, with nothing sent anywhere. '.repeat(6);
const DOC = (title: string): string => [`# ${title}`, '## One', PARA, '## Two', PARA, '## Three', PARA].join('\n\n');
const FILES: Record<string, string> = { 'alpha.md': DOC('Alpha'), 'beta.md': DOC('Beta'), 'CLAUDE.md': DOC('Agent') };

const store = (theme: 'light' | 'dark'): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, theme }),
  putSettings: async () => undefined,
});
const source = (): FolderSource => ({
  name: 'docs',
  truncated: false,
  persistable: true,
  files: Object.entries(FILES).map(([name, text]) => ({ path: name, name, read: async () => text })),
});

async function until<T>(fn: () => T | null | undefined | false, what: string, ms = 10000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > end) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}
const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

let container: HTMLElement;
const containers: HTMLElement[] = [];
beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
});
afterEach(async () => {
  stopWatch();
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  __resetConnectionForTest();
  await page.viewport(414, 896);
});

const shell = (): HTMLElement => container.querySelector<HTMLElement>('.peekover-app')!;
const pane = (): HTMLElement => container.querySelector<HTMLElement>('.peekover-app__folders')!;
const files = (): HTMLButtonElement => container.querySelector<HTMLButtonElement>(`.${C}__files-btn`)!;
const toolbar = (): HTMLElement => container.querySelector<HTMLElement>(`.${C}`)!;
const statusLine = (): HTMLElement => container.querySelector<HTMLElement>(`.${STATUS_LINE_CLASS}`)!;
const host = (): HTMLElement | null => container.querySelector<HTMLElement>('.peekover-app__reader__host');
const openFile = (): string => container.querySelector(`.${STATUS_LINE_CLASS}__file`)?.textContent ?? '';
const shown = (el: Element | null | undefined): boolean => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};
const treeItem = (name: string): HTMLElement | undefined =>
  [...container.querySelectorAll<HTMLElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent?.includes(name));
const overlayOpen = (): boolean => shell().getAttribute('data-files') === 'open';

/** The app page at `width`, the folder open and `name` chosen from the pane — in the row, as a first choice is. */
async function openApp(width: number, theme: 'light' | 'dark', name = 'alpha.md'): Promise<void> {
  await page.viewport(width, 900);
  container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: source() }), store: store(theme) });
  await app.openFolder();
  (await until(() => treeItem(name), `${name} in the tree`)).click();
  await until(() => openFile() === name && shell().hasAttribute('data-document'), `${name} open`);
  await until(() => host()?.getAttribute('data-theme') === theme, `data-theme=${theme}`);
  await until(() => host()?.shadowRoot?.querySelector('.peekover-reader p'), 'the reading column');
  await document.fonts.ready;
  await frames();
}

/** Open the overlay with a real press on "Files". */
async function openOverlay(): Promise<void> {
  await userEvent.click(files());
  await until(() => overlayOpen() && shown(pane()), 'the overlay open');
  await frames(2);
}
const inPane = (): boolean => pane().contains(document.activeElement);

/** Every toolbar item's rect, by class — "nothing else in the toolbar moves". */
function toolbarRects(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const el of toolbar().querySelectorAll<HTMLElement>(':scope > *, :scope button')) {
    if (!shown(el) || el === files()) continue;
    const r = el.getBoundingClientRect();
    out[`${el.className}|${el.textContent?.slice(0, 20)}`] = [r.left, r.top, r.width, r.height].map((v) => v.toFixed(1)).join(',');
  }
  return out;
}

const THEMES = ['light', 'dark'] as const;
const OVERLAY_WIDTHS = [414, FILES_OVERLAY_MAX];
const SIDEBAR_WIDTHS = [FILES_OVERLAY_MAX + 1, 1440];

describe('4.8 — the breakpoint: "Files" and the overlay only at <= the measured width', () => {
  it('the measured value is the one shipped', () => {
    expect(FILES_OVERLAY_MAX).toBe(1272);
  });

  it.each(THEMES.flatMap((t) => OVERLAY_WIDTHS.map((w) => [w, t] as const)))(
    'at %i px, %s: "Files" is shown, the pane is out of the row and closed, the reader takes the width',
    async (width, theme) => {
      await openApp(width, theme);
      expect(shown(files()), '"Files" is shown').toBe(true);
      expect(files().getAttribute('aria-expanded')).toBe('false');
      expect(files().getAttribute('aria-controls')).toBe(pane().id);
      expect(document.getElementById(files().getAttribute('aria-controls')!)).toBe(pane());
      expect(shown(pane()), 'the pane is closed').toBe(false);
      const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!.getBoundingClientRect();
      expect(reader.left, 'the reader starts at the window\'s left edge').toBeLessThan(1);
      expect(Math.abs(reader.width - innerWidth), 'and takes its width').toBeLessThan(1);
      if (width === FILES_OVERLAY_MAX) {
        const text = host()!.shadowRoot!.querySelector<HTMLElement>('.peekover-reader p')!.getBoundingClientRect().width;
        expect(text, 'at the breakpoint the column keeps its full measure').toBeCloseTo(MEASURE_TEXT, 0);
      }
    },
  );

  it.each(THEMES.flatMap((t) => SIDEBAR_WIDTHS.map((w) => [w, t] as const)))(
    'at %i px, %s: "Files" is hidden; the pane is a sidebar beside the reader, >= 60ch of text',
    async (width, theme) => {
      await openApp(width, theme);
      expect(shown(files()), '"Files" is hidden above the breakpoint').toBe(false);
      expect(shown(pane()), 'the pane is in the row').toBe(true);
      const p = pane().getBoundingClientRect();
      const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!.getBoundingClientRect();
      expect(Math.abs(p.right - reader.left), 'beside the reader, not over it').toBeLessThan(1);
      const para = host()!.shadowRoot!.querySelector<HTMLElement>('.peekover-reader p')!;
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:60ch;height:0';
      para.prepend(probe);
      expect(para.getBoundingClientRect().width, 'the text keeps >= 60ch beside the pane').toBeGreaterThanOrEqual(probe.getBoundingClientRect().width);
      probe.remove();
      // Pressing where "Files" would be does nothing: there is no overlay to open.
      files().click();
      expect(overlayOpen()).toBe(false);
    },
  );

  it('with no document open the pane stays in the row and "Files" is hidden (it holds "Open a folder")', async () => {
    await page.viewport(414, 900);
    container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    mountAppShell(container, { openFolder: async () => ({ ok: true, source: source() }), store: store('light') });
    const cta = await until(() => container.querySelector<HTMLElement>('.peekover-app__cta'), 'the CTA');
    expect(shown(cta), '"Open a folder" is on screen').toBe(true);
    expect(shown(files())).toBe(false);
  });
});

describe('4.8 — the overlay: open, hold focus, close three ways, return focus', () => {
  it.each(THEMES.flatMap((t) => OVERLAY_WIDTHS.map((w) => [w, t] as const)))(
    'at %i px, %s',
    async (width, theme) => {
      await openApp(width, theme);
      const before = toolbarRects();
      await openOverlay();
      expect(files().getAttribute('aria-expanded')).toBe('true');

      // Over the reader, at the body's left edge, the mock's width; below the toolbar and above the status line.
      const p = pane().getBoundingClientRect();
      expect(p.left).toBeLessThan(1);
      expect(Math.abs(p.width - Math.min(300, 0.86 * innerWidth)), 'the mock\'s width').toBeLessThan(1);
      expect(p.top, 'below the toolbar').toBeGreaterThanOrEqual(toolbar().getBoundingClientRect().bottom - 0.5);
      const line = statusLine().getBoundingClientRect();
      expect(p.bottom, 'the status line is not covered').toBeLessThanOrEqual(line.top + 0.5);
      expect(document.elementFromPoint(line.left + line.width / 2, line.top + line.height / 2)?.closest(`.${STATUS_LINE_CLASS}`)).toBe(statusLine());
      // The scrim covers the reader: a point right of the pane hits the body, not the reader.
      const scrimAt = document.elementFromPoint(Math.min(innerWidth - 4, p.right + 20), p.top + 40);
      expect(scrimAt, 'the scrim is over the reader').toBe(container.querySelector('.peekover-app__body'));
      expect(container.querySelector('.peekover-app__reader')!.hasAttribute('inert'), 'the reader behind is inert').toBe(true);
      expect(toolbarRects(), 'nothing else in the toolbar moves').toEqual(before);

      // Focus moved in, and Tab / Shift+Tab stay inside.
      expect(inPane(), 'focus moves into the pane').toBe(true);
      for (let i = 0; i < 8; i += 1) {
        await userEvent.tab();
        expect(inPane(), `Tab ${i + 1} stays inside`).toBe(true);
      }
      for (let i = 0; i < 8; i += 1) {
        await userEvent.tab({ shift: true });
        expect(inPane(), `Shift+Tab ${i + 1} stays inside`).toBe(true);
      }

      // 1 · Escape closes it and returns focus to "Files".
      await userEvent.keyboard('{Escape}');
      expect(overlayOpen(), 'Escape closes it').toBe(false);
      expect(document.activeElement, 'Escape returns focus to "Files"').toBe(files());
      expect(files().getAttribute('aria-expanded')).toBe('false');
      expect(container.querySelector('.peekover-app__reader')!.hasAttribute('inert')).toBe(false);

      // 2 · A press on the scrim closes it and returns focus to "Files".
      await openOverlay();
      const r = pane().getBoundingClientRect();
      await userEvent.click(container.querySelector<HTMLElement>('.peekover-app__body')!, {
        position: { x: Math.min(innerWidth - 4, r.right + 20), y: 40 },
      });
      expect(overlayOpen(), 'the scrim closes it').toBe(false);
      expect(document.activeElement, 'the scrim returns focus to "Files"').toBe(files());

      // 3 · A press on another toolbar control closes it; that control does its job.
      await openOverlay();
      const raw = toolbar().querySelector<HTMLButtonElement>(`.${C}__seg [data-mode="raw"]`)!;
      await userEvent.click(raw);
      expect(overlayOpen(), 'a press outside closes it').toBe(false);
      await until(() => host()?.getAttribute('data-mode') === 'raw', 'Raw did its job');

      // "Files" itself toggles it.
      await openOverlay();
      await userEvent.click(files());
      expect(overlayOpen(), '"Files" closes it again').toBe(false);
    },
  );
});

describe('4.8 — choosing a file from the overlay', () => {
  it.each(THEMES.flatMap((t) => OVERLAY_WIDTHS.map((w) => [w, t] as const)))(
    'at %i px, %s: the file opens and the overlay closes; focus on "Files"',
    async (width, theme) => {
      await openApp(width, theme);
      await openOverlay();
      await userEvent.click(treeItem('beta.md')!);
      await until(() => openFile() === 'beta.md', 'beta.md open');
      expect(overlayOpen(), 'the choice closes the overlay').toBe(false);
      expect(shown(pane())).toBe(false);
      expect(document.activeElement).toBe(files());
      await until(() => host()?.shadowRoot?.querySelector('h1')?.textContent === 'Beta', 'Beta on screen');
    },
  );

  it.each(THEMES.flatMap((t) => OVERLAY_WIDTHS.map((w) => [w, t] as const)))(
    'at %i px, %s, while editing: the guard asks; Keep leaves it open on the same document; Discard opens the file and closes it',
    async (width, theme) => {
      await openApp(width, theme);
      await userEvent.click(toolbar().querySelector<HTMLButtonElement>(`.${C}__seg [data-mode="edit"]`)!);
      await until(() => host()?.getAttribute('data-mode') === 'edit' && editorSessionFor(host()!), 'editing');
      const session = editorSessionFor(host()!)!;
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' zqxunsaved' } });
      expect(host()!.hasAttribute(EDITOR_DIRTY_ATTR), 'the fixture is dirty').toBe(true);

      await openOverlay();
      await userEvent.click(treeItem('beta.md')!);
      const dialog = await until(() => container.querySelector<HTMLElement>(`.${UNSAVED_DIALOG_CLASS}`), 'the guard asks');
      expect(dialog).not.toBeNull();
      expect(openFile(), 'nothing opened yet').toBe('alpha.md');
      await userEvent.click(container.querySelector<HTMLElement>(`.${UNSAVED_KEEP_CLASS}`)!);
      await frames(2);
      expect(container.querySelector(`.${UNSAVED_DIALOG_CLASS}`)).toBeNull();
      expect(openFile(), 'Keep: the same document').toBe('alpha.md');
      expect(host()!.getAttribute('data-mode'), 'still editing').toBe('edit');
      expect(overlayOpen(), 'Keep: the overlay stays open').toBe(true);

      await userEvent.click(treeItem('beta.md')!);
      await until(() => container.querySelector(`.${UNSAVED_DIALOG_CLASS}`), 'the guard asks again');
      await userEvent.click(container.querySelector<HTMLElement>(`.${UNSAVED_DISCARD_CLASS}`)!);
      await until(() => openFile() === 'beta.md', 'Discard: beta.md open');
      expect(overlayOpen(), 'Discard: the overlay closes').toBe(false);
      expect(document.activeElement).toBe(files());
    },
  );
});

describe('4.8 — the compact toolbar keeps two rows with "Files" present', () => {
  it.each(THEMES.flatMap((t) => [414, 863].map((w) => [w, t] as const)))('at %i px, %s, an agent file', async (width, theme) => {
    await openApp(width, theme, 'CLAUDE.md');
    await until(() => toolbar().querySelector('.peekover-agent-badge'), 'the badge');
    await frames(2);
    const items = [
      ...toolbar().children,
      ...toolbar().querySelectorAll(`.${C}__badge > *, .${C}__watch > *, .${C}__compare > button, .${C}__app > *`),
    ].filter((el) => getComputedStyle(el).display !== 'contents' && shown(el));
    const tops: number[] = [];
    for (const el of items) {
      const top = el.getBoundingClientRect().top;
      if (!tops.some((t) => Math.abs(t - top) < 6)) tops.push(top);
    }
    expect(tops.length, `rows at ${tops.map(Math.round).join(', ')}`).toBe(2);
    expect(shown(files())).toBe(true);
    const rowOneTop = Math.min(...tops);
    expect(Math.abs(files().getBoundingClientRect().top - rowOneTop) < 6, '"Files" is in row 1').toBe(true);
    const brand = toolbar().querySelector<HTMLElement>(`.${C}__brand`)!.getBoundingClientRect();
    expect(files().getBoundingClientRect().right, '"Files" leads row 1').toBeLessThanOrEqual(brand.left + 0.5);
    const r = toolbar().getBoundingClientRect();
    expect(r.right <= innerWidth + 0.5 && r.left >= -0.5, 'inside the window').toBe(true);
  });
});
