// 7.1-walk polish (012 R28, R29) — the real-engine layout and legibility checks the walk found missing.
//
// All of it runs on the REAL app shell (`mountAppShell`: header, folder pane, scrolling reader pane,
// the watch chrome and the capture notice an opened folder registers), in both engines, because every
// finding is a property of where things sit on that page, not of the editor alone:
//   (a) the Ctrl-F search panel is legible and styled from tokens in both themes;
//   (b) the split fills the reader pane's height, its panes scroll with themed scrollbars, and a long
//       line wraps (R28) instead of scrolling sideways;
//   (c) below the stated breakpoint, edit hides the TOC rail so each pane keeps a usable width;
//   (d) the capture notice never sits on top of the document or the editor.
// Group 3's rule applies: the fixtures here open a folder file but never start a watch.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import {
  EDITOR_PREVIEW_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  editorSessionFor,
  teardownEditorShell,
} from '../../src/render/editorView';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { WATCH_DISCLOSURE_CLASS, resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';
import { resetSettingsSeamForTest } from '../../src/settings/settingsSeam';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';

const NARROW = { width: 414, height: 896 }; // the harness default
const WIDE = { width: 1400, height: 900 };
const TEXT_BAR = 4.5; // WCAG 2.1 AA, 1.4.3

/** How far the split's bottom edge may sit above the viewport's: the reader pane's own 1.5rem
 *  (24px) padding + the 130px bottom clearance the pill stack has always had + 8px of border and
 *  rounding. The fixed 60vh split left 227px at 900 high and ran 137px PAST the viewport stacked. */
const BOTTOM_GAP_MAX = 24 + 130 + 8;
/** A usable pane: the width below which the walk found the split unreadable (E-6 measured 100px). */
const PANE_MIN = 360;
/** The viewport width at or below which edit hides the rail — see EDITOR_CSS. At 1400 with the rail
 *  open each pane measured 359px: the folder pane (320) + reader padding (48) + split margins (64)
 *  + the rail (250 + 32) leave 720 for the two panes. */
const RAIL_BREAKPOINT = 1400;

const HEADINGS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
const LONG_LINE = `${'unbroken-wrapping-words '.repeat(60)}end`;
const DOC = `${HEADINGS.map((h) => `## ${h}\n\nBody text under ${h}.\n`).join('\n')}\n${LONG_LINE}\n\nThe last paragraph.\n`;

/** The shell loads the persisted theme asynchronously and applies it over any earlier
 *  `setThemeSetting`, so the theme under test is the STORE's answer, not a call made beforehand. */
function fakeStore(theme: 'light' | 'dark' | 'auto'): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    getSettings: async () => ({ ...DEFAULT_SETTINGS, theme }),
  };
}

function memorySource(text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: 'doc.md', name: 'doc.md', read: async () => text }],
  };
}

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 15000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

const containers: HTMLElement[] = [];

function resetAll(): void {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetSettingsSeamForTest();
}

beforeEach(async () => {
  resetAll();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(async () => {
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  __resetConnectionForTest();
  resetAll();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

/** The production path: shell → open a folder → click the file. Returns the mounted reader host. */
async function openFile(
  theme: 'light' | 'dark' | 'auto' = 'light',
  text: string = DOC,
): Promise<{ host: HTMLElement; container: HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource(text) }),
    store: fakeStore(theme),
  });
  await app.openFolder();
  const fileBtn = await waitFor(
    () => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
    'the file in the tree',
  );
  fileBtn.click();
  const host = await waitFor(
    () => container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    'the reader host',
  );
  await waitFor(() => host.shadowRoot?.querySelector(`.${EDIT_CONTROL_CLASS}`), 'the edit control');
  if (theme !== 'auto') await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme="${theme}"`);
  await frames();
  return { host, container };
}

const inHost = (host: HTMLElement, cls: string): HTMLElement | null =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${cls}`);

async function enterEdit(host: HTMLElement): Promise<void> {
  inHost(host, EDIT_CONTROL_CLASS)!.click();
  await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
  await waitFor(() => host.shadowRoot!.querySelector('.cm-editor'), 'the editor');
  await frames(4);
}

function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Meta' : 'Control';

// ── colour arithmetic (the proxy's method: source-over compositing, WCAG relative luminance) ────
type RGBA = readonly [number, number, number, number];

function parseColor(value: string): RGBA {
  const v = value.trim();
  if (v === 'transparent') return [0, 0, 0, 0];
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(v);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4]) / (m[5] ? 100 : 1)];
  const s = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(v);
  if (s) return [Number(s[1]) * 255, Number(s[2]) * 255, Number(s[3]) * 255, s[4] === undefined ? 1 : Number(s[4]) / (s[5] ? 100 : 1)];
  throw new Error(`not a colour this file can read: ${value}`);
}
const over = (top: RGBA, under: RGBA): RGBA => [
  top[0] * top[3] + under[0] * (1 - top[3]),
  top[1] * top[3] + under[1] * (1 - top[3]),
  top[2] * top[3] + under[2] * (1 - top[3]),
  1,
];
const lin = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (c: RGBA): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a: RGBA, b: RGBA): number => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const sameColour = (a: RGBA, b: RGBA): boolean => [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) < 1.5) && Math.abs(a[3] - b[3]) < 0.02;

/** A token's resolved colour in `host`'s shadow root, read the way the page paints it. */
function tokenColour(host: HTMLElement, token: string): RGBA {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  host.shadowRoot!.appendChild(probe);
  const c = parseColor(getComputedStyle(probe).color);
  probe.remove();
  return c;
}

/** The opaque colour behind `el`: its own background and every ancestor's, across shadow roots. */
function backdrop(el: Element): RGBA {
  const stack: RGBA[] = [];
  let node: Element | null = el;
  while (node) {
    const bg = parseColor(getComputedStyle(node).backgroundColor);
    if (bg[3] > 0) stack.push(bg);
    if (bg[3] >= 1) break;
    const root = node.getRootNode();
    node = node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return stack.reverse().reduce((acc, l) => (acc[3] === 1 && l[3] < 1 ? over(l, acc) : l), [255, 255, 255, 1] as RGBA);
}
const inkOf = (el: Element): RGBA => parseColor(getComputedStyle(el).color);

// ── (a) the search panel ────────────────────────────────────────────────────────────────────────
describe('R29(a) — the Ctrl-F search panel is legible and drawn from tokens, both themes', () => {
  it.each(['light', 'dark'] as const)('%s', async (theme) => {
    await page.viewport(WIDE.width, WIDE.height);
    const { host } = await openFile(theme);
    expect(host.getAttribute('data-theme')).toBe(theme);
    await enterEdit(host);
    editorSessionFor(host)!.view.focus();
    await waitFor(() => deepActiveElement()?.closest('.cm-content'), 'focus in the editor');
    await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
    const panel = await waitFor(() => host.shadowRoot!.querySelector<HTMLElement>('.cm-panels .cm-search'), 'the search panel');

    const panels = host.shadowRoot!.querySelector<HTMLElement>('.cm-panels')!;
    const field = panel.querySelector<HTMLElement>('.cm-textfield')!;
    const button = panel.querySelector<HTMLElement>('.cm-button')!;
    const close = panel.querySelector<HTMLElement>('[name="close"]')!;
    const labels = [...panel.querySelectorAll<HTMLElement>('label')];
    expect(labels.length, 'the panel has its option labels').toBeGreaterThan(0);

    // Text pairs, ≥ AA.
    const pairs: Array<[string, Element]> = [
      ['the field’s text', field],
      ['the button’s text', button],
      ['the close ×', close],
      ...labels.map((l, i): [string, Element] => [`label ${i}`, l]),
    ];
    const failures = pairs
      .map(([what, el]) => ({ what, r: ratio(inkOf(el), backdrop(el)) }))
      .filter(({ r }) => r < TEXT_BAR)
      .map(({ what, r }) => `${what} ${r.toFixed(2)}:1`);
    expect(failures, `${theme}: search panel text pairs under ${TEXT_BAR}:1`).toEqual([]);

    // Styled from tokens, not left at the engine's light-page / native defaults.
    expect(sameColour(parseColor(getComputedStyle(panels).backgroundColor), tokenColour(host, '--panel')), 'panel fill is --panel').toBe(true);
    expect(sameColour(parseColor(getComputedStyle(field).backgroundColor), tokenColour(host, '--paper')), 'field fill is --paper').toBe(true);
    expect(sameColour(inkOf(field), tokenColour(host, '--ink')), 'field text is --ink').toBe(true);
    expect(getComputedStyle(button).backgroundImage, 'the button’s gradient is gone').toBe('none');
    expect(sameColour(parseColor(getComputedStyle(button).backgroundColor), tokenColour(host, '--panel')), 'button fill is --panel').toBe(true);
    expect(sameColour(parseColor(getComputedStyle(button).borderTopColor), tokenColour(host, '--line')), 'button border is --line').toBe(true);
  });
});

// ── (b) the split, its scrollbars, line wrapping ───────────────────────────────────────────────
describe('R29(b), R28 — the split fills the pane; its scrollbars are themed; long lines wrap', () => {
  it.each([
    ['NARROW', NARROW],
    ['WIDE', WIDE],
  ] as const)('%s: the split’s bottom edge is within the pane padding of the viewport', async (_name, size) => {
    await page.viewport(size.width, size.height);
    const { host } = await openFile();
    await enterEdit(host);
    const shell = inHost(host, EDITOR_SHELL_CLASS)!.getBoundingClientRect();
    const gap = window.innerHeight - shell.bottom;
    expect(gap, `the split ends ${gap.toFixed(0)}px above the viewport bottom (max ${BOTTOM_GAP_MAX})`).toBeLessThanOrEqual(BOTTOM_GAP_MAX);
    expect(gap, 'and does not run past it').toBeGreaterThanOrEqual(0);
    // Both panes (side by side at WIDE, stacked at NARROW) are real boxes with height.
    expect(inHost(host, EDITOR_SOURCE_CLASS)!.getBoundingClientRect().height).toBeGreaterThan(150);
    expect(inHost(host, EDITOR_PREVIEW_CLASS)!.getBoundingClientRect().height).toBeGreaterThan(150);
  });

  it.each([
    ['NARROW', NARROW],
    ['WIDE', WIDE],
  ] as const)('%s: a long line wraps — the editor has no horizontal scroll', async (_name, size) => {
    await page.viewport(size.width, size.height);
    const { host } = await openFile();
    await enterEdit(host);
    const scroller = host.shadowRoot!.querySelector<HTMLElement>('.cm-scroller')!;
    expect(scroller.scrollWidth, 'scrollWidth ≤ clientWidth').toBeLessThanOrEqual(scroller.clientWidth);
    expect(getComputedStyle(host.shadowRoot!.querySelector<HTMLElement>('.cm-content')!).whiteSpace, 'CodeMirror’s wrapping style').toMatch(/pre-wrap|break-spaces/);
  });

  it.each(['light', 'dark'] as const)('%s: both panes’ scrollbars take their colours from tokens', async (theme) => {
    await page.viewport(WIDE.width, WIDE.height);
    const { host } = await openFile(theme);
    await enterEdit(host);
    const faint = tokenColour(host, '--faint');
    for (const [name, el] of [
      ['source scroller', host.shadowRoot!.querySelector<HTMLElement>('.cm-scroller')!],
      ['preview pane', inHost(host, EDITOR_PREVIEW_CLASS)!],
    ] as const) {
      const sc = getComputedStyle(el).getPropertyValue('scrollbar-color');
      expect(sc, `${name}: scrollbar-color is set, not the browser default`).not.toMatch(/^(auto)?$/);
      const thumb = parseColor(sc.match(/(rgba?\([^)]*\)|color\([^)]*\))/)![1]);
      expect(sameColour(thumb, faint), `${name}: the thumb is --faint (${sc})`).toBe(true);
    }
  });
});

// ── (c) the rail in edit ────────────────────────────────────────────────────────────────────────
describe('R29(c) — edit hides the TOC rail at or below the breakpoint; each pane keeps its width', () => {
  const visible = (el: HTMLElement | null): boolean => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;

  it.each([
    [RAIL_BREAKPOINT - 100, false],
    [RAIL_BREAKPOINT, false],
    [RAIL_BREAKPOINT + 100, true],
  ] as const)('viewport %d: in edit the rail is %s', async (width, railShown) => {
    await page.viewport(width, 900);
    const { host } = await openFile();
    await frames(4);
    expect(visible(inHost(host, 'peekover-toc')), 'reading mode: the rail is unchanged at every width').toBe(true);
    await enterEdit(host);
    expect(visible(inHost(host, 'peekover-toc')), `edit at ${width}px: rail shown = ${railShown}`).toBe(railShown);
    const source = inHost(host, EDITOR_SOURCE_CLASS)!.getBoundingClientRect().width;
    const preview = inHost(host, EDITOR_PREVIEW_CLASS)!.getBoundingClientRect().width;
    expect(source, 'source pane width').toBeGreaterThanOrEqual(PANE_MIN - 1);
    expect(preview, 'preview pane width').toBeGreaterThanOrEqual(PANE_MIN - 1);
    // Leaving edit brings the rail back.
    inHost(host, EDIT_CONTROL_CLASS)!.click();
    await waitFor(() => host.getAttribute('data-mode') === 'reading', 'back to reading');
    await frames(3);
    expect(visible(inHost(host, 'peekover-toc')), 'after leaving edit').toBe(true);
  });

  it('stacked (414): the rail is hidden in edit and the panes are full width', async () => {
    await page.viewport(NARROW.width, NARROW.height);
    const { host } = await openFile();
    await enterEdit(host);
    expect(visible(inHost(host, 'peekover-toc'))).toBe(false);
  });
});

// ── (d) the capture notice ──────────────────────────────────────────────────────────────────────
const rectsOfText = (root: Element): DOMRect[] => {
  const out: DOMRect[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!(n.textContent ?? '').trim()) continue;
    const r = document.createRange();
    r.selectNodeContents(n);
    out.push(...Array.from(r.getClientRects()).filter((q) => q.width > 0 && q.height > 0));
  }
  return out;
};
const intersects = (a: DOMRect, b: DOMRect): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;

describe('R29(d) — the capture notice never sits on top of the document or the editor (WIDE only)', () => {
  // The NARROW case is carried (decisions.md, R29 decision 1): the folder pane leaves a ~150px
  // reader there, so the notice cannot fit beside the pills. The notice itself is app-page-only.
  it('WIDE: reading, then edit', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { host } = await openFile();
    const notice = await waitFor(() => inHost(host, WATCH_DISCLOSURE_CLASS), 'the capture notice');
    expect(notice.hidden).toBe(false);
    const reader = inHost(host, 'peekover-reader')!;
    const pane = host.closest<HTMLElement>('.peekover-app__reader')!;
    const pills = ['peekover-watch', 'peekover-theme-toggle'].map((c) => inHost(host, c)).filter((e): e is HTMLElement => !!e);
    expect(pills.length, 'the pill stack is present to be cleared').toBeGreaterThan(0);
    const check = (mode: string): void => {
      const n = notice.getBoundingClientRect();
      for (const p of pills) expect(intersects(p.getBoundingClientRect(), n), `${mode}: the notice overlaps ${p.className}`).toBe(false);
    };
    pane.scrollTop = pane.scrollHeight;
    await frames(2);
    const hit = rectsOfText(reader).filter((r) => intersects(r, notice.getBoundingClientRect()));
    expect(hit.length, `reading: ${hit.length} text line box(es) sit under the notice`).toBe(0);
    check('reading');

    await enterEdit(host);
    pane.scrollTop = pane.scrollHeight;
    await frames(2);
    const shell = inHost(host, EDITOR_SHELL_CLASS)!.getBoundingClientRect();
    expect(intersects(shell, notice.getBoundingClientRect()), 'edit: the notice overlaps the split').toBe(false);
    check('edit');
  });
});
