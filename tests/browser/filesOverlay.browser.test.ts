// filesOverlay — the real-engine half of 013 task 4.8 (D-10; gate-1 Q12; the approved 3.1 mock), Chromium AND Firefox.
//
// THE BREAKPOINT, MEASURED (`decisions.md` "M13 TASK 4.8" and "M13 TASK 4.8 FIX"): the narrowest width keeping >= 60ch
// of reading text beside the 228 px folder pane (013 task 5.1; 1282 beside 4.8's 320 px pane), with the TOC rail open
// (its default there), is 1190 px — set by Chromium on Linux, which draws Literata's "0" at a whole 10 px (60ch = 600 px;
// 590.6 / 591 px on Windows). So at <= 1189 px,
// while a document is open, the pane is an overlay behind "Files". Above it the pane stays in the row, "Files" hidden.
// Every ch-based check first proves the paragraph is DRAWN in Literata (`literataDrawn`), and its message names the
// font it saw: a font-dependent red explains itself.
//
// What is proven, in both themes, at 414 and 1189 (overlay) and 1190 and 1440 (sidebar):
//   • "Files" shows exactly where the overlay applies; the pane is out of the row there and the reading column keeps
//     its full measure (684 px of text) at 1189; above it the pane sits beside the reader;
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
import type { FolderSource, OpenFolderOutcome } from '../../src/app/folderSource';
import type { FolderRecord, PinRecord, RecentRecord } from '../../src/app/store';
import { backdropOf, contrastRatio, inkOf, parseColor, ratioOver } from './helpers/contrast';
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
const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
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

/** The width of `n` ch in `el`'s own font, measured in place. */
function chWidth(el: HTMLElement, n: number): number {
  const probe = document.createElement('span');
  probe.style.cssText = `display:inline-block;width:${n}ch;height:0`;
  el.prepend(probe);
  const w = probe.getBoundingClientRect().width;
  probe.remove();
  return w;
}

/**
 * Before any ch-based check: the reader face is loaded and the paragraph is DRAWN in it — its text measured in its
 * own stack differs from the same text without Literata. The message names what was seen, so a red that depends on
 * the font (a load race, a fallback, an engine's rounding) says so.
 */
async function literataDrawn(p: HTMLElement): Promise<void> {
  const faces = (): FontFace[] => [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Literata');
  await Promise.all(faces().map((f) => f.loaded.catch(() => undefined)));
  await frames(2);
  const cs = getComputedStyle(p);
  const width = (family: string): number => {
    const span = document.createElement('span');
    span.textContent = 'Peekover renders the markdown 0123456789';
    span.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:${cs.fontSize};font-weight:${cs.fontWeight};font-family:${family}`;
    p.append(span);
    const w = span.getBoundingClientRect().width;
    span.remove();
    return w;
  };
  const rest = cs.fontFamily.split(',').slice(1).join(',');
  const seen =
    `${ENGINE}: font-family ${cs.fontFamily}; Literata faces [${faces().map((f) => `${f.weight}/${f.style} ${f.status}`).join(', ')}]; ` +
    `text ${width(cs.fontFamily).toFixed(1)} px in its stack vs ${width(rest).toFixed(1)} px without Literata; 60ch = ${chWidth(p, 60).toFixed(1)} px`;
  expect(/^"?Literata"?,/.test(cs.fontFamily), `the paragraph's stack leads with Literata — ${seen}`).toBe(true);
  expect(document.fonts.check(`${cs.fontSize} Literata`), `the Literata face is loaded — ${seen}`).toBe(true);
  expect(Math.abs(width(cs.fontFamily) - width(rest)) > 0.5, `the paragraph is drawn in Literata — ${seen}`).toBe(true);
}

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
    expect(FILES_OVERLAY_MAX).toBe(1189);
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
        const p = host()!.shadowRoot!.querySelector<HTMLElement>('.peekover-reader p')!;
        await literataDrawn(p);
        const text = p.getBoundingClientRect().width;
        expect(text, 'at the breakpoint the column keeps its full measure').toBeCloseTo(MEASURE_TEXT, 0);
        expect(text, `and that is more than 60ch (${chWidth(p, 60).toFixed(1)} px on ${ENGINE})`).toBeGreaterThan(chWidth(p, 60));
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
      await literataDrawn(para);
      const text = para.getBoundingClientRect().width;
      const ch60 = chWidth(para, 60);
      expect(text, `the text keeps >= 60ch beside the pane (text ${text.toFixed(1)} px, 60ch ${ch60.toFixed(1)} px, ${ENGINE})`).toBeGreaterThanOrEqual(ch60);
      // Pressing where "Files" would be does nothing: there is no overlay to open.
      files().click();
      expect(overlayOpen()).toBe(false);
    },
  );

  // RETIRED at 013 task 5.5 by the HUMAN RULING (2026-11-05, "Mock + uniform"): "with no document open the pane stays
  // in the row and Files is hidden (it holds Open a folder)" — 4.8's deviation. With no folder the call to action is
  // now the setup card in the body and there is no pane; with a folder open and no file the pane is the overlay at
  // <= the breakpoint. KEEPS the property that matters to it — "Open a folder" is always on screen with no folder —
  // in "5.5 — the no-document layout" below, at 414 and 1440.
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

// ── 5.1 — THE FOLDER PANE, RESTYLED (013 task 5.1; `mockup.html:74–87` rows / hover / active; the approved 3.1 mock's
// pane — `toolbar-mock.html:123–126`, caps heads in --muted). The pane is 228 px in the row; its section heads are
// caps; a row is --muted, --ink on --panel under the pointer, and the open file is --accent on --accent-soft at 600;
// the search field and the pin / revoke / unpin buttons wear the mock's `.iconbtn` (--panel, a --line border, radius 8).
// Every one of those texts, in each state, is >= 4.5:1 over what is painted behind it.
const memStore = (theme: 'light' | 'dark'): AppStore => {
  const rows = { folders: new Map<string, FolderRecord>(), recents: new Map<string, RecentRecord>(), pins: new Map<string, PinRecord>() };
  return {
    ...store(theme),
    putFolder: async (r) => void rows.folders.set(r.id, r),
    deleteFolder: async (id) => void rows.folders.delete(id),
    getFolders: async () => [...rows.folders.values()],
    putRecent: async (r) => void rows.recents.set(r.id, r),
    getRecents: async () => [...rows.recents.values()],
    deleteRecent: async (id) => void rows.recents.delete(id),
    putPin: async (r) => void rows.pins.set(r.id, r),
    getPins: async () => [...rows.pins.values()],
    deletePin: async (id) => void rows.pins.delete(id),
  };
};

/** A design token of the shell, resolved to the colour the engine computes for it. */
function token(name: string): string {
  const probe = document.createElement('i');
  probe.style.color = `var(${name})`;
  shell().append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}
const textRatio = (el: Element): number => ratioOver(inkOf(el), backdropOf(el)).ratio;
const settle = (ms = 300): Promise<unknown> => new Promise((r) => setTimeout(r, ms));

describe('5.1 — the folder pane, restyled', () => {
  it.each(THEMES)('%s: the open row; 228 px; rows at rest and under the pointer; caps heads; the search field; pin buttons — every text >= 4.5:1', async (theme) => {
    await page.viewport(1440, 900);
    container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: source() }), store: memStore(theme) });
    await app.openFolder();
    (await until(() => treeItem('alpha.md'), 'alpha.md in the tree')).click();
    await until(() => openFile() === 'alpha.md' && host()?.getAttribute('data-theme') === theme, 'alpha.md open, themed');
    (await until(() => container.querySelector<HTMLButtonElement>('.peekover-app__pin[data-pin="folder"]:not(:disabled)'), 'Pin this folder')).click();
    await until(() => container.querySelector('.peekover-recents__unpin'), 'the Pinned section');
    await settle(); // the hub re-renders as its load lands; colour transitions settle

    // The open file is the one row drawn as open (the restyle's key rule; its instrument runs first).
    const open = treeItem('alpha.md')!;
    const rest = treeItem('beta.md')!;
    expect([...pane().querySelectorAll('[aria-current]')], 'exactly one row is marked open').toEqual([open]);
    expect(open.getAttribute('aria-current')).toBe('page');
    const o = getComputedStyle(open);
    expect([o.backgroundColor, o.color, o.fontWeight], 'the open row: --accent on --accent-soft, 600').toEqual([token('--accent-soft'), token('--accent'), '600']);
    expect(textRatio(open), 'the open row text').toBeGreaterThanOrEqual(4.5);

    // The pane: 228 px in the row, on --paper.
    expect(pane().getBoundingClientRect().width, 'the pane is 228 px').toBeCloseTo(228, 1);
    expect(getComputedStyle(pane()).backgroundColor).toBe(token('--paper'));

    // A row at rest, then under the pointer.
    const r = getComputedStyle(rest);
    expect([r.backgroundColor, r.color], 'a row at rest: --muted, no fill').toEqual(['rgba(0, 0, 0, 0)', token('--muted')]);
    expect(textRatio(rest), 'a row at rest').toBeGreaterThanOrEqual(4.5);
    await userEvent.hover(rest);
    await settle(250);
    const h = getComputedStyle(rest);
    expect([h.backgroundColor, h.color], 'a row under the pointer: --ink on --panel').toEqual([token('--panel'), token('--ink')]);
    expect(textRatio(rest), 'a row under the pointer').toBeGreaterThanOrEqual(4.5);
    await userEvent.unhover(rest);

    // The section head: caps, --muted, 700, tracked (queried now: the hub re-renders as each load lands).
    const head = pane().querySelector<HTMLElement>('.peekover-recents__title')!;
    expect(head.isConnected && head.textContent, 'the Pinned head').toBe('Pinned');
    const hd = getComputedStyle(head);
    expect([hd.textTransform, hd.color, hd.fontWeight], 'a section head').toEqual(['uppercase', token('--muted'), '700']);
    expect(parseFloat(hd.letterSpacing), 'tracked').toBeGreaterThan(0);
    expect(textRatio(head), 'the section head').toBeGreaterThanOrEqual(4.5);

    // The search field: the .iconbtn fill and border; its placeholder in --muted at full opacity.
    const search = pane().querySelector<HTMLInputElement>('.peekover-tree__search')!;
    const s = getComputedStyle(search);
    expect([s.backgroundColor, s.borderTopStyle, s.borderTopWidth, s.borderTopColor, s.borderTopLeftRadius], 'the search field').toEqual([token('--panel'), 'solid', '1px', token('--line'), '8px']);
    const ph = getComputedStyle(search, '::placeholder');
    expect([ph.color, ph.opacity], 'the placeholder').toEqual([token('--muted'), '1']);
    expect(contrastRatio(parseColor(ph.color), parseColor(s.backgroundColor)), 'the placeholder text').toBeGreaterThanOrEqual(4.5);

    // Pin / revoke / unpin: the mock's .iconbtn.
    const buttons = [
      pane().querySelector<HTMLElement>('.peekover-app__pin[data-pin="file"]')!,
      pane().querySelector<HTMLElement>('.peekover-app__chip-revoke')!,
      pane().querySelector<HTMLElement>('.peekover-recents__unpin')!,
    ];
    for (const b of buttons) {
      const cs = getComputedStyle(b);
      expect(
        [cs.backgroundColor, cs.color, cs.borderTopStyle, cs.borderTopWidth, cs.borderTopColor, cs.borderTopLeftRadius, cs.fontWeight, cs.fontSize],
        `${b.className} "${b.textContent}" is an .iconbtn`,
      ).toEqual([token('--panel'), token('--muted'), 'solid', '1px', token('--line'), '8px', '600', '12.5px']);
      expect(textRatio(b), `${b.className} text`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the open row follows the open file, and a search repaint keeps it', async () => {
    await page.viewport(1440, 900);
    container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: source() }), store: store('light') });
    await app.openFolder();
    await until(() => treeItem('alpha.md'), 'alpha.md');
    expect(pane().querySelector('[aria-current]'), 'nothing is open yet').toBeNull();
    treeItem('alpha.md')!.click();
    await until(() => treeItem('alpha.md')?.getAttribute('aria-current') === 'page', 'alpha.md marked open');
    treeItem('beta.md')!.click();
    await until(() => treeItem('beta.md')?.getAttribute('aria-current') === 'page', 'beta.md marked open');
    expect(treeItem('alpha.md')!.hasAttribute('aria-current'), 'the previous file is no longer marked').toBe(false);
    const search = pane().querySelector<HTMLInputElement>('.peekover-tree__search')!;
    await userEvent.type(search, 'bet');
    await until(() => !treeItem('alpha.md'), 'the search filtered');
    expect(treeItem('beta.md')!.getAttribute('aria-current'), 'repainted, still marked').toBe('page');
  });
});

// ── M13 task 5.5 — the empty and denied app states (tasks.md 5.5: composed from the mock's `.alert`,
// mockup.html:130-131 and :380-381, and the setup card, :327-329 in the `.panelbox`, :194 — no new vocabulary) ──
//
// HUMAN RULING (2026-11-05, 5.5's no-document question: "Mock + uniform"): with no folder there is no pane — the setup
// card ("Open a folder to begin", the grant line, an ink-primary "Open a folder", the reopen hub) sits centred in the
// body (the approved toolbar mock, toolbar-mock.html:296-298); with a folder open, at <= FILES_OVERLAY_MAX the pane is
// the overlay behind "Files" whether or not a file is open, and it opens by itself until a file is picked.
//
// Every state the app page has, each reached the way a test can: the open outcome injected through `openFolder` (the
// same painter the real picker, drop and reopen routes reach), the folder source shaped (empty, truncated, a file whose
// read rejects or is blank, persistable false), or a gesture (revoke, a search). For each: NEVER BLANK first (its
// message is on screen — AGENTS.md #5), then the look (an alert, or the card), then every text >= 4.5:1 as painted.

type Outcome = OpenFolderOutcome;
const NOT: (reason: 'cancelled' | 'error' | 'denied', message: string) => Outcome = (reason, message) => ({ ok: false, reason, message });

/** A probe's computed value for a token expression, read inside the shell. */
function tok(prop: 'color' | 'box-shadow' | 'background-color', value: string): string {
  const probe = document.createElement('i');
  probe.style.setProperty(prop, value);
  shell().append(probe);
  const out = getComputedStyle(probe).getPropertyValue(prop);
  probe.remove();
  return out;
}
const ratioOf = (el: Element): number => ratioOver(inkOf(el), backdropOf(el)).ratio;

/** The mock's `.alert` (or `.alert.warn`): a 3 px left rule in --accent (--warn), the soft fill at 55%, square left. */
function expectAlert(el: HTMLElement, name: string, warn = false): void {
  const cs = getComputedStyle(el);
  const [rule, soft] = warn ? ['--warn', '--hl-soft'] : ['--accent', '--accent-soft'];
  expect(
    `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor} | ${cs.backgroundColor} | ${cs.borderTopLeftRadius} ${cs.borderTopRightRadius}`,
    `${name}: the mock's .alert${warn ? '.warn' : ''}`,
  ).toBe(`3px solid ${tok('color', `var(${rule})`)} | ${tok('background-color', `color-mix(in srgb,var(${soft}) 55%,transparent)`)} | 0px 10px`);
}

/** The setup card: the .panelbox — radius 14, the --shadow token, --paper, 1 px --line — with a header row. */
function expectCard(el: HTMLElement, title: HTMLElement, name: string): void {
  const cs = getComputedStyle(el);
  expect(`${cs.borderTopLeftRadius} ${cs.boxShadow} ${cs.backgroundColor} ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, `${name}: the setup card`).toBe(
    `14px ${tok('box-shadow', 'var(--shadow)')} ${tok('color', 'var(--paper)')} 1px solid ${tok('color', 'var(--line)')}`,
  );
  const ts = getComputedStyle(title);
  expect(`${ts.fontWeight} ${ts.fontSize} ${ts.borderBottomWidth} ${ts.borderBottomStyle} ${ts.borderBottomColor}`, `${name}: its header row`).toBe(
    `700 13.5px 1px solid ${tok('color', 'var(--line)')}`,
  );
}

/** Every text-bearing element under `root` draws at >= 4.5:1; returns the lowest, for the record. */
function expectText(root: HTMLElement, name: string): number {
  let least = Infinity;
  const low: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const own = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
    if (!own || !shown(el) || el.closest(':disabled')) continue;
    const r = ratioOf(el);
    least = Math.min(least, r);
    if (r < 4.5) low.push(`${el.className || el.tagName} "${el.textContent!.trim().slice(0, 30)}" ${r.toFixed(2)}`);
  }
  expect(low, `${name}: text below 4.5:1`).toEqual([]);
  return least;
}

/** Mount the shell at `width` in `theme`. `outcome` answers the first "Open a folder"; with none, nothing is opened. */
async function mountState(width: number, theme: 'light' | 'dark', src: FolderSource | Outcome | null): Promise<ReturnType<typeof mountAppShell>> {
  await page.viewport(width, 900);
  container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const outcome: Outcome | null = src && 'files' in src ? { ok: true, source: src } : (src as Outcome | null);
  const app = mountAppShell(container, { openFolder: async () => outcome ?? NOT('cancelled', 'No folder was opened.'), store: store(theme) });
  await until(() => shell().getAttribute('data-theme') === theme, `data-theme=${theme}`);
  if (outcome) await app.openFolder();
  await frames(2);
  return app;
}
const folderOf = (over: Partial<FolderSource> = {}): FolderSource => ({ ...source(), ...over });
const looks: string[] = [];
afterEach(() => {
  for (const l of looks.splice(0)) console.log(`LOOK-5.5 ${l}`);
});

describe('5.5 — the no-document layout (HUMAN RULING 2026-11-05: "Mock + uniform")', () => {
  it.each([414, 1440])('at %i px, no folder: no pane, no "Files"; the setup card is in the body with "Open a folder"', async (width) => {
    await mountState(width, 'light', null);
    const card = await until(() => container.querySelector<HTMLElement>('.peekover-app__start .peekover-app__empty'), 'the card in the body');
    expect(shown(card), 'the card is on screen').toBe(true);
    expect(shown(pane()), 'no pane').toBe(false);
    expect(shown(files()), 'no "Files"').toBe(false);
    expect(shown(container.querySelector('.peekover-app__reader')), 'no reader pane behind the card').toBe(false);
    const cta = card.querySelector<HTMLElement>('.peekover-app__cta')!;
    expect(shown(cta), '"Open a folder" is in the card').toBe(true);
    const r = card.getBoundingClientRect();
    expect(Math.abs((r.left + r.right) / 2 - innerWidth / 2), 'centred in the body').toBeLessThan(2);
  });

  // Found by the full suite at 5.5 (editorEyeballProxy, proxy 4): `AppController.selectFile` opens a document with no
  // folder, and the first cut of the rule hid the reader whenever no folder was open — a blank page (AGENTS.md #5).
  it.each([414, 1440])('at %i px, a document opened with no folder: the reader shows it, and the card yields', async (width) => {
    const app = await mountState(width, 'light', null);
    await app.selectFile({ name: 'loose.md', read: async () => '# Loose\n\nA document with no folder.\n' });
    const h1 = await until(() => host()?.shadowRoot?.querySelector<HTMLElement>('.peekover-reader h1'), 'the document rendered');
    expect(shown(h1), 'the document is on screen').toBe(true);
    expect(shown(container.querySelector('.peekover-app__start')), 'the start card has yielded').toBe(false);
  });

  it.each(OVERLAY_WIDTHS)('at %i px, a folder open and no file: the pane is the Files overlay, open; a pick closes it', async (width) => {
    await mountState(width, 'light', folderOf());
    await until(() => overlayOpen() && shown(pane()), 'the overlay open by itself');
    expect(shown(files()), '"Files" is shown').toBe(true);
    expect(files().getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.peekover-app__reader')!.hasAttribute('inert'), 'the reader behind is inert').toBe(true);
    expect(inPane(), 'focus is in the pane').toBe(true);
    await userEvent.click(treeItem('beta.md')!);
    await until(() => openFile() === 'beta.md' && !overlayOpen(), 'beta.md open, the overlay closed');
    expect(shown(pane())).toBe(false);
  });

  it('at <= the breakpoint, Escape closes the self-opened overlay and the reader says to pick a file', async () => {
    await mountState(414, 'light', folderOf());
    await until(() => overlayOpen(), 'the overlay open by itself');
    await userEvent.keyboard('{Escape}');
    await until(() => !overlayOpen(), 'closed');
    expect(document.activeElement, 'focus returns to "Files"').toBe(files());
    const state = container.querySelector<HTMLElement>('.peekover-app__reader__state[data-state="no-selection"]');
    expect(shown(state), 'the no-selection card is on screen').toBe(true);
  });

  it.each(SIDEBAR_WIDTHS)('at %i px, a folder open and no file: the pane is in the row, no overlay, no "Files"', async (width) => {
    await mountState(width, 'light', folderOf());
    await until(() => shown(pane()), 'the pane');
    expect(overlayOpen()).toBe(false);
    expect(shown(files())).toBe(false);
    const p = pane().getBoundingClientRect();
    const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!.getBoundingClientRect();
    expect(Math.abs(p.right - reader.left), 'beside the reader').toBeLessThan(1);
  });
});

describe('5.5 — every app state: never blank, the mock vocabulary, text >= 4.5:1 (1440, light and dark)', () => {
  interface StateCase {
    name: string;
    arrange: (theme: 'light' | 'dark') => Promise<void>;
    /** The element the state draws, its message, and its look. */
    find: () => HTMLElement | null;
    message: string;
    look: (el: HTMLElement) => void;
  }
  const idleNotice = (name: string, outcome: Outcome): StateCase => ({
    name,
    arrange: async (t) => void (await mountState(1440, t, outcome)),
    find: () => container.querySelector<HTMLElement>('.peekover-app__start .peekover-app__notice'),
    message: (outcome as { message: string }).message,
    look: (el) => expectAlert(el, name),
  });
  const card = (): HTMLElement => container.querySelector<HTMLElement>('.peekover-app__empty')!;
  const readerState = (kind: string): (() => HTMLElement | null) => () => container.querySelector<HTMLElement>(`.peekover-app__reader__state[data-state="${kind}"]`);
  const readerLook = (name: string) => (el: HTMLElement): void => expectCard(el, el.querySelector<HTMLElement>('.peekover-app__reader__state-title')!, name);
  const pickFile = async (name: string): Promise<void> => {
    (await until(() => treeItem(name), `${name} in the tree`)).click();
    await frames(3);
  };
  const CASES: StateCase[] = [
    {
      name: 'first run (no folder)',
      arrange: async (t) => void (await mountState(1440, t, null)),
      find: () => container.querySelector<HTMLElement>('.peekover-app__start .peekover-app__empty'),
      message: 'Open a folder to begin',
      look: (el) => {
        expectCard(el, el.querySelector<HTMLElement>('.peekover-app__start-title')!, 'first run');
        const cta = el.querySelector<HTMLElement>('.peekover-app__cta')!;
        const cs = getComputedStyle(cta);
        expect(`${cs.backgroundColor} ${cs.color} ${cs.borderTopColor} ${cs.borderTopLeftRadius} ${cs.fontWeight} ${cs.fontSize}`, '"Open a folder": the ink primary').toBe(
          `${tok('color', 'var(--ink)')} ${tok('color', 'var(--paper)')} ${tok('color', 'var(--ink)')} 7px 600 11.5px`,
        );
      },
    },
    idleNotice('the picker cancelled', NOT('cancelled', 'No folder was opened.')),
    idleNotice('a folder that could not be opened', NOT('error', 'Could not open that folder. Please try again.')),
    idleNotice('access denied', NOT('denied', 'Access to this folder wasn’t granted. Click it again to re-allow it.')),
    {
      name: 'access revoked',
      arrange: async (t) => {
        await mountState(1440, t, folderOf());
        (await until(() => container.querySelector<HTMLButtonElement>('.peekover-app__chip-revoke'), 'Revoke')).click();
        await until(() => container.querySelector('.peekover-app__start .peekover-app__empty'), 'back to the start');
      },
      find: () => container.querySelector<HTMLElement>('.peekover-app__start .peekover-app__empty'),
      message: 'Open a folder to begin',
      look: (el) => expectCard(el, el.querySelector<HTMLElement>('.peekover-app__start-title')!, 'access revoked'),
    },
    {
      name: 'a folder with no markdown files',
      arrange: async (t) => void (await mountState(1440, t, folderOf({ files: [] }))),
      find: () => container.querySelector<HTMLElement>('.peekover-tree__empty[data-state="empty-folder"]'),
      message: 'No markdown files in this folder.',
      look: (el) => expectAlert(el, 'empty folder'),
    },
    {
      name: 'a search with no match',
      arrange: async (t) => {
        await mountState(1440, t, folderOf());
        const search = await until(() => container.querySelector<HTMLInputElement>('.peekover-tree__search'), 'the search');
        await userEvent.fill(search, 'zzz');
        await frames(3);
      },
      find: () => container.querySelector<HTMLElement>('.peekover-tree__empty[data-state="no-matches"]'),
      message: 'No files match “zzz”.',
      look: (el) => expectAlert(el, 'no matches'),
    },
    {
      name: 'a folder too large to list',
      arrange: async (t) => void (await mountState(1440, t, folderOf({ truncated: true }))),
      find: () => container.querySelector<HTMLElement>('.peekover-tree__notice[data-state="too-large"]'),
      message: 'This folder is very large',
      look: (el) => expectAlert(el, 'too large', true),
    },
    {
      name: 'a read-only snapshot (Firefox)',
      arrange: async (t) => void (await mountState(1440, t, folderOf({ persistable: false }))),
      find: () => container.querySelector<HTMLElement>('.peekover-app__notice[data-state="read-only-snapshot"]'),
      message: 'read-only, point-in-time snapshot',
      look: (el) => expectAlert(el, 'read-only snapshot', true),
    },
    {
      name: 'a folder open, no file chosen',
      arrange: async (t) => void (await mountState(1440, t, folderOf())),
      find: readerState('no-selection'),
      message: 'Select a file to read it here',
      look: readerLook('no selection'),
    },
    {
      name: 'an empty file',
      arrange: async (t) => {
        await mountState(1440, t, folderOf({ files: [{ path: 'blank.md', name: 'blank.md', read: async () => '  \n' }] }));
        await pickFile('blank.md');
      },
      find: readerState('empty-file'),
      message: 'This file is empty',
      look: readerLook('empty file'),
    },
    {
      name: 'an unreadable file',
      arrange: async (t) => {
        await mountState(1440, t, folderOf({ files: [{ path: 'gone.md', name: 'gone.md', read: async () => Promise.reject(new Error('gone')) }] }));
        await pickFile('gone.md');
      },
      find: readerState('unreadable'),
      message: "Couldn't read this file",
      look: readerLook('unreadable'),
    },
  ];

  it.each(THEMES.flatMap((t) => CASES.map((c) => [c.name, t, c] as const)))('%s — %s', async (name, theme, c) => {
    await c.arrange(theme);
    // NEVER BLANK (the instrument tasks.md names; red-first by a throw in the state builder): the message is on screen.
    const el = await until(() => {
      const e = c.find();
      return e && shown(e) ? e : null;
    }, `${name}: the state on screen`, 4000);
    expect(el.textContent, `${name}: its message`).toContain(c.message);
    c.look(el);
    looks.push(`${name} (${theme}): lowest text ${expectText(name === 'first run (no folder)' || name === 'access revoked' ? card() : el, name).toFixed(2)}`);
  });
});
