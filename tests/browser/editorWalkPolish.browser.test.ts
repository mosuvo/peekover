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
import {
  EDITOR_PREVIEW_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  editorSessionFor,
  teardownEditorShell,
} from '../../src/render/editorView';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';
import { resetSettingsSeamForTest } from '../../src/settings/settingsSeam';
import { mount } from '../../src/render/mount';
import { NETWORK_ATTR } from '../../src/render/remoteMediaUi';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';

/** A segment of the app page's toolbar (013 task 4.3, D-6: Edit is the toolbar's segment). */
const segmentFor = (host: Element | null | undefined, mode: 'reading' | 'edit' | 'raw'): HTMLButtonElement | null =>
  host?.closest('.peekover-app')?.querySelector<HTMLButtonElement>(`.peekover-toolbar__seg [data-mode="${mode}"]`) ?? null;
/** KEEPS: each test's own property here (C222–C227). RE-SPELLED at 4.3: the removed shadow-root control's
 *  toggle is the toolbar's segment — Edit to enter, Read to leave (these sessions are entered from
 *  Read, so the exit lands where the control's did; a dirty Read is guarded, ruling E). */
const segmentToggle = (host: HTMLElement): HTMLElement =>
  segmentFor(host, host.getAttribute('data-mode') === 'edit' ? 'reading' : 'edit')!;

const NARROW = { width: 414, height: 896 }; // the harness default
const WIDE = { width: 1400, height: 900 };
/** 013 task 4.6's widths: 1440 × 900, 1080 × 900 and the stacked 414 × 896. */
const SIZES = [
  { width: 1440, height: 900 },
  { width: 1080, height: 900 },
  NARROW,
] as const;
const TEXT_BAR = 4.5; // WCAG 2.1 AA, 1.4.3

/** The reader pane's own 1.5rem bottom padding (`.peekover-app__reader`). */
const PANE_PAD = 24;
/** How far the split's bottom edge may sit above the viewport's: the reader pane's own padding + 4px of
 *  border and rounding. RE-SPELLED at 013 task 4.6 (C225; D-7): it was `24 + 130 + 8` (R29 Decision 2) — the
 *  130px was the clearance the bottom-left pill stack had always had, and the app page has no pill stack since
 *  4.5, so the band is RETIRED there and the split runs to the pane's own padding. (The fixed 60vh split left
 *  227px at 900 high and ran 137px PAST the viewport stacked.) */
const BOTTOM_GAP_MAX = PANE_PAD + 4;
/** The reading column's and the diff's bottom padding on the app page since 013 task 4.6: their top value. */
const COLUMN_FOOT = 56;
/** The content script's band, unchanged: its pills remain. */
const BAND = 130;
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
  await waitFor(() => segmentFor(host, 'edit')?.disabled === false, 'the Edit segment');
  if (theme !== 'auto') await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme="${theme}"`);
  await frames();
  return { host, container };
}

const inHost = (host: HTMLElement, cls: string): HTMLElement | null =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${cls}`);

async function enterEdit(host: HTMLElement): Promise<void> {
  segmentToggle(host).click();
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
  // KEEPS: the split fills the pane to its foot (C225). RE-SPELLED at 013 task 4.6: the tolerance is the pane's
  // own padding (the band's allowance RETIRED — see BOTTOM_GAP_MAX), at 1440 / 1080 / 414, both themes.
  it.each([
    ['1440', 'light', SIZES[0]],
    ['1440', 'dark', SIZES[0]],
    ['1080', 'light', SIZES[1]],
    ['1080', 'dark', SIZES[1]],
    ['414 (stacked)', 'light', SIZES[2]],
    ['414 (stacked)', 'dark', SIZES[2]],
  ] as const)('%s, %s: the split’s bottom edge is within the pane padding of the viewport', async (_name, theme, size) => {
    await page.viewport(size.width, size.height);
    const { host } = await openFile(theme);
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
    segmentToggle(host).click();
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

// REPLACED (C228) at 013 task 4.5: "R29(d) — the capture notice never sits on top of the document or the editor".
// The app page builds no in-reader notice now (`pills: false`): the capture disclosure is the one-time snapshot
// notice in the page flow ABOVE the reader pane, so it cannot sit over the text or the edit split. Its placement —
// below the header, above the reader, over no line of text, at 1440 / 1280 / 1080 / 414 — is
// tests/browser/snapshotNotice.browser.test.ts's.

// ── 013 task 4.6 — the 130 px band reclaimed on the app page (D-7; F-2) ─────────────────────────
//
// The band was reserved in three places, each sized for the bottom-left pill stack: the reading column's bottom
// padding and the diff's (READER_CSS, shared with the content script) and the split's bottom margin
// (`--edit-bottom`, EDITOR_CSS, app page only). Since 4.5 the app page has no pill stack, so on the app page the
// column and the diff end at their top value (CONTAINED_CSS) and the split at the pane's own padding; the
// content script keeps 130px — its pills remain. The one piece of chrome still drawn at the reader's foot on the
// app page is the network indicator, and only after the user loads something: while it shows, the split keeps
// clearance for it.

/** Two files, so the toolbar's Compare can open a diff against the other one. */
const LONG_DOC = `${Array.from({ length: 70 }, (_, i) => `${i % 10 === 0 ? `## Section ${i / 10}\n\n` : ''}Paragraph ${i} of a long document, long enough to scroll.`).join('\n\n')}\n\nThe last line.\n`;
/** The same, with one remote image: blocked by default (nothing is fetched), so the reader builds its network
 *  indicator — the one piece of chrome still drawn at the reader's foot on the app page. */
const REMOTE_DOC = `![remote](https://example.invalid/peekover-4-6.png)\n\n${LONG_DOC}`;
function pairSource(first: string = LONG_DOC): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [
      { path: 'a.md', name: 'a.md', read: async () => first },
      { path: 'b.md', name: 'b.md', read: async () => LONG_DOC.replace('Paragraph 3 ', 'Changed 3 ') },
    ],
  };
}

async function openLong(theme: 'light' | 'dark', first: string = LONG_DOC): Promise<{ host: HTMLElement; container: HTMLElement; pane: HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: pairSource(first) }),
    store: fakeStore(theme),
  });
  await app.openFolder();
  (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'a file')).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader host');
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader')?.textContent?.includes('The last line.'), 'the document');
  await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme="${theme}"`);
  await frames();
  return { host, container, pane: container.querySelector<HTMLElement>('.peekover-app__reader')! };
}

/** Scrolled to its end, how far the LAST block of `column` sits above the bottom of `foot`'s box, less the
 *  block's own bottom margin — i.e. the band the column itself reserves, plus `foot`'s padding. */
async function footGap(scroller: HTMLElement, foot: Element, column: Element): Promise<number> {
  scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' }); // the reader may scroll smoothly
  await frames();
  const last = column.lastElementChild!;
  return foot.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom - parseFloat(getComputedStyle(last).marginBottom);
}

const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
const laidOut = (r: DOMRect): boolean => r.width > 0 && r.height > 0;

describe('013 task 4.6 — the band reclaimed on the app page; the content script keeps it', () => {
  const CASES = SIZES.flatMap((size) => (['light', 'dark'] as const).map((theme) => [`${size.width}`, theme, size] as const));

  it.each(CASES)('%s, %s: the last line of a long document, and of a diff, sit within the new gap of the pane\'s foot', async (_w, theme, size) => {
    await page.viewport(size.width, size.height);
    const { host, container, pane } = await openLong(theme);
    const reader = host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
    const reading = await footGap(pane, pane, reader);
    expect(reading, `reading: the last line ends ${reading.toFixed(1)}px above the pane's foot`).toBeLessThanOrEqual(PANE_PAD + COLUMN_FOOT + 2);
    expect(reading).toBeGreaterThanOrEqual(PANE_PAD + COLUMN_FOOT - 2);

    container.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-diff-affordance')!.click();
    const item = await waitFor(() => {
      const picker = container.querySelector<HTMLElement>('.peekover-diff-picker');
      return picker && !picker.hidden ? picker.querySelector<HTMLButtonElement>('[data-target-kind="file"]') : null;
    }, 'a file to compare with');
    item.click();
    await waitFor(() => host.getAttribute('data-diff') === 'active', 'the diff');
    const diff = host.shadowRoot!.querySelector<HTMLElement>('.peekover-diff')!;
    const diffGap = await footGap(pane, pane, diff);
    expect(diffGap, `diff: the last row ends ${diffGap.toFixed(1)}px above the pane's foot`).toBeLessThanOrEqual(PANE_PAD + COLUMN_FOOT + 2);
    expect(diffGap).toBeGreaterThanOrEqual(PANE_PAD + COLUMN_FOOT - 2);
  });

  it.each(CASES)('%s, %s: in edit nothing overlaps — the notice area, the toolbar, the rail and the split', async (_w, theme, size) => {
    await page.viewport(size.width, size.height);
    const { host, container } = await openLong(theme);
    await enterEdit(host);
    const split = inHost(host, EDITOR_SHELL_CLASS)!.getBoundingClientRect();
    const others: Array<[string, DOMRect]> = [
      ['the header', container.querySelector('.peekover-app__header')!.getBoundingClientRect()],
      ['the notice area', container.querySelector('.peekover-app__notices')!.getBoundingClientRect()],
      ['the rail', inHost(host, 'peekover-toc')!.getBoundingClientRect()],
    ];
    const hits = others.filter(([, r]) => laidOut(r) && overlaps(split, r)).map(([name]) => name);
    expect(hits, `${size.width}: the split overlaps`).toEqual([]);
    // The split's bottom edge sits at the pane's foot (C225's property, at this test's widths too).
    const gap = window.innerHeight - split.bottom;
    expect(gap).toBeLessThanOrEqual(BOTTOM_GAP_MAX);
    expect(gap).toBeGreaterThanOrEqual(0);
  });

  it.each(SIZES.map((s) => [`${s.width}`, s] as const))('%s: while the network indicator shows, the split keeps clear of it', async (_w, size) => {
    await page.viewport(size.width, size.height);
    const { host } = await openLong('light', REMOTE_DOC);
    await enterEdit(host);
    host.setAttribute(NETWORK_ATTR, 'active'); // the indicator's own state — set when the user loads remote media
    await frames();
    const net = inHost(host, 'peekover-net')!.getBoundingClientRect();
    expect(laidOut(net), 'firing control: the indicator is drawn').toBe(true);
    const split = inHost(host, EDITOR_SHELL_CLASS)!.getBoundingClientRect();
    expect(overlaps(split, net), `the split (bottom ${split.bottom.toFixed(0)}) overlaps the indicator (top ${net.top.toFixed(0)})`).toBe(false);
    expect(window.innerHeight - split.bottom, 'and it gives up no more than that clearance').toBeLessThanOrEqual(PANE_PAD + COLUMN_FOOT + 4);
  });

  it('CONTROL — the content script (file://, mount without `contained`) keeps its 130px band', async () => {
    await page.viewport(SIZES[0].width, SIZES[0].height);
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    containers.push(host);
    mount(LONG_DOC, host);
    await frames();
    const reader = host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
    expect(getComputedStyle(reader).paddingBottom).toBe(`${BAND}px`);
    const gap = await footGap(host, host, reader);
    expect(gap, `the last line ends ${gap.toFixed(1)}px above the viewport (${host.scrollTop}/${host.scrollHeight}/${host.clientHeight})`).toBeGreaterThanOrEqual(BAND - 2);
    expect(gap).toBeLessThanOrEqual(BAND + 2);
  });
});
