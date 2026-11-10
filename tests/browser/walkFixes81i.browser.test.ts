// M13 8.1i — walk D's fixes on the app page (HUMAN 2026-11-10; `docs/ai/walk-8.1.md` items 17–19).
// Each describe is one part of the brief, red first.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { teardownEditorShell } from '../../src/render/editorView';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';
import { resetSettingsSeamForTest } from '../../src/settings/settingsSeam';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { mount } from '../../src/render/mount';
import { lightNetworkIndicator } from '../../src/render/remoteMediaUi';
import { registerWatchTarget } from '../../src/watch/watchRegistry';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { contrastRatio, flatten, hex, luminance, parseColor } from './helpers/contrast';

const DOC = [
  '# Search index rollout',
  '',
  'A plan for moving the docs search to the new index, written for the team and for the agents that help run it.',
  '',
  '## Checklist',
  '',
  'Body text under the checklist.',
  '',
  '## Phases',
  '',
  'Body text under phases.',
  '',
].join('\n');

function fakeStore(theme: 'light' | 'dark'): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
    getSettings: async () => ({ ...DEFAULT_SETTINGS, theme }),
  };
}

function memorySource(text: string): FolderSource {
  return { name: 'docs', truncated: false, persistable: true, files: [{ path: 'doc.md', name: 'doc.md', read: async () => text }] };
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

const segment = (container: HTMLElement, mode: 'reading' | 'edit' | 'raw'): HTMLButtonElement =>
  container.querySelector<HTMLButtonElement>(`.peekover-toolbar__seg [data-mode="${mode}"]`)!;

const containers: HTMLElement[] = [];
function resetAll(): void {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetSettingsSeamForTest();
  resetDocIdentityForTest();
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
  await page.viewport(414, 896);
});

async function openFile(theme: 'light' | 'dark', text = DOC): Promise<{ host: HTMLElement; container: HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: memorySource(text) }), store: fakeStore(theme) });
  await app.openFolder();
  (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the file')).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the host');
  await waitFor(() => segment(container, 'edit')?.disabled === false, 'the Edit segment');
  await waitFor(() => host.getAttribute('data-theme') === theme, `data-theme="${theme}"`);
  await frames(4);
  return { host, container };
}

const intersects = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

// ── (b) Raw view, app page — surface 7 + CC flag 3 ─────────────────────────────────────────────
// The raw block had its own 76ch box, centred on the pane and blind to the open rail, so at 1280
// the rail card sat over its right edge. It now takes the reading column's content box: its left
// edge is Read view's text edge, open rail or not, and it never runs under the rail.
describe('8.1i (b) — the raw block uses the reading column’s box', () => {
  for (const width of [1080, 1280, 1440]) {
    for (const rail of ['open', 'collapsed'] as const) {
      it(`${width}px, rail ${rail}: raw's left edge = Read's text edge; no overlap with the rail`, async () => {
        await page.viewport(width, 900);
        const { host, container } = await openFile('light');
        const sr = host.shadowRoot!;
        await waitFor(() => host.getAttribute('data-toc') === 'open', 'the rail open (wide pane default)');
        if (rail === 'collapsed') {
          sr.querySelector<HTMLButtonElement>('.peekover-toc__toggle')!.click();
          await waitFor(() => host.getAttribute('data-toc') === 'collapsed', 'the rail collapsed');
        }
        await frames(3);
        const textEdge = sr.querySelector('.peekover-reader p')!.getBoundingClientRect().left;
        segment(container, 'raw').click();
        await waitFor(() => host.getAttribute('data-mode') === 'raw', 'data-mode="raw"');
        await frames(3);
        const raw = sr.querySelector<HTMLElement>('.peekover-raw')!.getBoundingClientRect();
        expect(Math.abs(raw.left - textEdge), `raw left ${raw.left} vs Read's text ${textEdge}`).toBeLessThanOrEqual(0.5);
        const railBox =
          rail === 'open'
            ? sr.querySelector<HTMLElement>('.peekover-toc')!.getBoundingClientRect()
            : sr.querySelector<HTMLElement>('.peekover-toc__toggle')!.getBoundingClientRect();
        expect(railBox.width, 'the rail is drawn (control)').toBeGreaterThan(0);
        expect(intersects(raw, railBox), `raw ${raw.left}–${raw.right} × ${raw.top}–${raw.bottom} meets the rail ${railBox.left}–${railBox.right} × ${railBox.top}–${railBox.bottom}`).toBe(false);
      });
    }
  }
});

// ── (c) Diagram lightbox at narrow widths — surface 25 ─────────────────────────────────────────
// The card kept the wide layout's insets (64 / 96 and the rail's width on the right), so at 414 it
// was a 225 px column with the diagram small in the middle. At ≤ 863 px it now fills the viewport
// less a small margin, and the diagram takes the card's width.
const DIAGRAM_DOC = `${DOC}\n\`\`\`mermaid\ngraph LR; Query-->Index-->Rank-->Answer;\n\`\`\`\n`;

describe('8.1i (c) — the diagram lightbox fills a narrow viewport', () => {
  for (const width of [414, 600]) {
    it(`${width}px: card ≥ viewport − 32; diagram ≥ 90% of the card's inner width`, async () => {
      await page.viewport(width, 896);
      const { host } = await openFile('light', DIAGRAM_DOC);
      const sr = host.shadowRoot!;
      const trigger = await waitFor(
        () => sr.querySelector<HTMLButtonElement>('figure.peekover-diagram[data-diagram="rendered"] .peekover-diagram-open'),
        'a rendered diagram',
        30000,
      );
      trigger.click();
      const panel = await waitFor(() => sr.querySelector<HTMLElement>('.peekover-diagram-lightbox__panel'), 'the lightbox');
      await Promise.all(panel.getAnimations().map((a) => a.finished)); // the 180 ms zoom-in scales the card
      await frames(3);
      const card = panel.getBoundingClientRect();
      expect(card.width, `card ${card.width} in a ${window.innerWidth} viewport`).toBeGreaterThanOrEqual(window.innerWidth - 32 - 0.5);
      const cs = getComputedStyle(panel);
      const inner =
        card.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
      const svg = panel.querySelector('svg')!.getBoundingClientRect();
      expect(svg.width, `diagram ${svg.width} in a card ${inner} wide inside`).toBeGreaterThanOrEqual(0.9 * inner);
    });
  }
});

// ── (g) The editor's active-line gutter cell — CC flag 6 ───────────────────────────────────────
// Nothing styled `.cm-activeLineGutter`, so the cell kept CodeMirror's light-page default (#e2f2ff)
// in the dark editor, and the active line its default translucent blue (#cceeff44). Both now draw
// one band from Peekover's tokens: the cell matches the line, in dark it is not lighter than the
// editor's background, and the gutter numbers read no worse on it than on the plain gutter (E-4).
describe('8.1i (g) — the active line and its gutter cell are one band from the tokens', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: cell = line; no CodeMirror default; dark not lighter than the editor`, async () => {
      await page.viewport(1440, 900);
      const { host, container } = await openFile(theme);
      segment(container, 'edit').click();
      const sr = host.shadowRoot!;
      await waitFor(() => sr.querySelector('.cm-activeLineGutter') && sr.querySelector('.cm-activeLine'), 'the active line');
      await frames(3);
      const pane = sr.querySelector<HTMLElement>('.peekover-editor__source')!;
      const base = parseColor(getComputedStyle(pane).backgroundColor);
      const cellEl = sr.querySelector<HTMLElement>('.cm-activeLineGutter')!;
      const cellRaw = getComputedStyle(cellEl).backgroundColor;
      const lineRaw = getComputedStyle(sr.querySelector<HTMLElement>('.cm-activeLine')!).backgroundColor;
      for (const raw of [cellRaw, lineRaw]) {
        expect(['rgb(226, 242, 255)', 'rgba(204, 238, 255, 0.267)'], `a CodeMirror default: ${raw}`).not.toContain(raw);
      }
      const cell = flatten([base, parseColor(cellRaw)]);
      const line = flatten([base, parseColor(lineRaw)]);
      expect(hex(cell), `the cell ${cellRaw} vs the line ${lineRaw}`).toBe(hex(line));
      if (theme === 'dark') expect(luminance(cell), `${hex(cell)} lighter than the editor ${hex(base)}`).toBeLessThanOrEqual(luminance(base));
      const ink = parseColor(getComputedStyle(cellEl).color);
      expect(contrastRatio(ink, cell), 'the numbers on the cell vs on the plain gutter').toBeGreaterThanOrEqual(contrastRatio(ink, base) - 0.01);
    });
  }
});

// ── (a) Narrow widths — surfaces 5, 6, 17 + CC flag 2 (app page) and the tab reader ───────────
// At ≤ 863 px (the compact toolbar's breakpoint) the collapsed "On this page" opener floated over
// the document's top right — over the title, the code toolbar, the table's controls. It now sits in
// the document flow above the title; opened, the contents list is a full-width sheet over the page
// with a Close button, and the reading column keeps its width.
const deepActive = (): Element | null => {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

/** Every text line box and control in the document under `sr` that is NOT part of the contents nav. */
function textAndControls(sr: ShadowRoot): { what: string; r: DOMRect }[] {
  const out: { what: string; r: DOMRect }[] = [];
  const nav = sr.querySelector('.peekover-toc');
  for (const root of sr.querySelectorAll(':scope > *')) {
    if (root === nav || root.tagName === 'STYLE') continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) out.push({ what: `text "${n.textContent.trim().slice(0, 24)}"`, r });
    }
    const controls = root.matches('button, input, a') ? [root] : [...root.querySelectorAll('button, input, a')];
    for (const c of controls) {
      const r = c.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out.push({ what: `control .${c.className || c.tagName}`, r });
    }
  }
  return out;
}

async function narrowChecks(host: HTMLElement, sr: ShadowRoot, viewport: number): Promise<void> {
  const opener = sr.querySelector<HTMLButtonElement>('.peekover-toc__toggle')!;
  const o = opener.getBoundingClientRect();
  expect(o.width, 'the opener is drawn').toBeGreaterThan(0);
  const h1 = sr.querySelector('.peekover-reader h1')!.getBoundingClientRect();
  expect(o.bottom, `the opener (${o.top}–${o.bottom}) is above the title (${h1.top})`).toBeLessThanOrEqual(h1.top);
  const under = textAndControls(sr).filter(({ r }) => intersects(o, r)).map(({ what, r }) => `${what} [${r.left.toFixed(0)},${r.top.toFixed(0)}–${r.right.toFixed(0)},${r.bottom.toFixed(0)}]`);
  expect(under, `under the opener [${o.left.toFixed(0)},${o.top.toFixed(0)}–${o.right.toFixed(0)},${o.bottom.toFixed(0)}]`).toEqual([]);
  // The hit-test itself: the opener is the topmost element across its own box.
  for (const [fx, fy] of [[0.1, 0.5], [0.5, 0.5], [0.9, 0.5]]) {
    const hit = sr.elementFromPoint(o.left + o.width * fx, o.top + o.height * fy);
    expect(hit === opener || opener.contains(hit), `topmost at the opener's ${fx}: ${hit?.className}`).toBe(true);
  }

  // Open: a full-width sheet; the column keeps its width; focus moves into the list.
  const column = sr.querySelector<HTMLElement>('.peekover-reader')!;
  const before = column.getBoundingClientRect().width;
  opener.click();
  await frames(3);
  const nav = sr.querySelector<HTMLElement>('.peekover-toc')!.getBoundingClientRect();
  expect(nav.width, 'the sheet spans the viewport').toBeGreaterThanOrEqual(viewport - 1);
  expect(column.getBoundingClientRect().width, "the reading column's width").toBe(before);
  expect(opener.getAttribute('aria-expanded')).toBe('true');
  const inList = deepActive();
  expect(inList?.classList.contains('peekover-toc__link'), `focus in the list: ${inList?.className}`).toBe(true);
  const close = sr.querySelector<HTMLButtonElement>('.peekover-toc__close')!;
  expect(close.getBoundingClientRect().width, 'a visible Close').toBeGreaterThan(0);
  expect(close.textContent).toBe('Close');

  // Close: focus back on the opener; the sheet gone; the list hidden.
  close.click();
  await frames(3);
  expect(deepActive(), 'focus back on the opener').toBe(opener);
  expect(opener.getAttribute('aria-expanded')).toBe('false');
  expect(sr.querySelector('.peekover-toc__list')!.getClientRects().length, 'the list hidden again').toBe(0);
  expect(column.getBoundingClientRect().width).toBe(before);

  // Escape closes it too.
  opener.click();
  await frames(2);
  deepActive()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
  await frames(2);
  expect(deepActive(), 'Escape: focus back on the opener').toBe(opener);
  expect(opener.getAttribute('aria-expanded')).toBe('false');
}

/** Choosing an entry in the sheet closes it, lands on the heading, and gives focus back to the opener. */
async function entryCloses(sr: ShadowRoot): Promise<void> {
  const opener = sr.querySelector<HTMLButtonElement>('.peekover-toc__toggle')!;
  opener.click();
  await frames(2);
  const links = [...sr.querySelectorAll<HTMLButtonElement>('.peekover-toc__link')];
  links[links.length - 1].click();
  await frames(3);
  expect(opener.getAttribute('aria-expanded'), 'an entry closes the sheet').toBe('false');
  expect(sr.querySelector('.peekover-toc__list')!.getClientRects().length).toBe(0);
  expect(deepActive(), 'focus back on the opener').toBe(opener);
}

describe('8.1i (a) — at narrow widths the opener is in the flow; the list opens as a sheet (app page)', () => {
  for (const width of [414, 600]) {
    it(`${width}px, app page`, async () => {
      await page.viewport(width, 896);
      const { host } = await openFile('light');
      await frames(3);
      await narrowChecks(host, host.shadowRoot!, width);
      await entryCloses(host.shadowRoot!);
    });
  }
  it('414px: a remembered OPEN rail does not open the sheet on load', async () => {
    await page.viewport(414, 896);
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const store: AppStore = { ...fakeStore('light'), getSettings: async () => ({ ...DEFAULT_SETTINGS, theme: 'light', tocOpen: true }) };
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: memorySource(DOC) }), store });
    await app.openFolder();
    (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the file')).click();
    const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the host');
    await waitFor(() => host.getAttribute('data-toc') === 'open', 'the remembered open state applied');
    await frames(4);
    const sr = host.shadowRoot!;
    expect(sr.querySelector('.peekover-toc__toggle')!.getAttribute('aria-expanded')).toBe('false');
    expect(sr.querySelector('.peekover-toc__list')!.getClientRects().length, 'no list on load').toBe(0);
    expect(getComputedStyle(sr.querySelector('.peekover-toc')!).position).toBe('static');
  });
});

const TAB_DOC = `${DOC}\n![a picture from the web](https://example.invalid/p.png)\n\n${'More text under phases. '.repeat(40)}\n`;

describe('8.1i (a) — the same on the tab reader', () => {
  for (const width of [414, 600]) {
    it(`${width}px, tab reader (file://: Watch, the agent badge, a blocked image)`, async () => {
      await page.viewport(width, 896);
      registerWatchTarget({ start: () => undefined, stop: () => undefined, isWatching: () => false });
      registerDocIdentity('CLAUDE.md');
      const host = document.createElement('div');
      document.body.appendChild(host);
      containers.push(host);
      mount(TAB_DOC, host);
      await frames(4);
      await narrowChecks(host, host.shadowRoot!, width);
      await entryCloses(host.shadowRoot!);
    });
  }
});

// ── (d) The editor at 414 — surface 29 ─────────────────────────────────────────────────────────
// The split started 56 px below the pane's top (the column's old top padding, kept to clear the
// floating opener): an empty band under the toolbar. With the opener in the flow, the editor
// starts where Read view's first box (the opener) starts.
describe('8.1i (d) — at 414 the editor starts under the toolbar like Read view', () => {
  it('the gap toolbar → editor equals the gap toolbar → Read view’s first box', async () => {
    await page.viewport(414, 896);
    const { host, container } = await openFile('light');
    const sr = host.shadowRoot!;
    const header = container.querySelector<HTMLElement>('.peekover-app__header')!.getBoundingClientRect().bottom;
    const readGap = sr.querySelector('.peekover-toc__toggle')!.getBoundingClientRect().top - header;
    segment(container, 'edit').click();
    await waitFor(() => sr.querySelector('.cm-editor'), 'the editor');
    await frames(4);
    const editGap = sr.querySelector('.peekover-editor')!.getBoundingClientRect().top - header;
    expect(Math.abs(editGap - readGap), `edit ${editGap} vs read ${readGap}`).toBeLessThanOrEqual(0.5);
    expect(editGap, 'no band: the pane padding only').toBeLessThanOrEqual(32);
  });
});

// ── (f) The tab reader's floating pills at rest — CC flags 4 + 5 (II-9) ────────────────────────
// At the top of the page, before any scroll, the bottom-left stack (Watch, Theme, the network
// indicator) sat over the first screen's text where the column reaches the left gutter: the
// "Phases" heading at 414, the table's Filter and header at 1080 with the contents open. While the
// page is at its top a plain band of paper now reserves the stack's corner of the viewport (the
// page reads as ending above it); from the first scroll on the pills float as ruled at 5.6.
const PILLS = ['.peekover-theme-toggle', '.peekover-watch', '.peekover-net'];
const REST_DOC = [
  DOC,
  '| Phase | Traffic | Duration |',
  '| --- | --- | --- |',
  ...Array.from({ length: 8 }, (_, i) => `| ${i + 1} · Step | ${i * 10}% | ${i + 2} days |`),
  '',
  ...Array.from({ length: 12 }, (_, i) => `## Section ${i + 1}\n\n${'Body text that wraps across the reading column. '.repeat(12)}\n`),
].join('\n');

/** What the pills hide at rest: every text line and control of the page whose box meets a pill's,
 *  hit-tested with the pills themselves hidden — a hit on page content means the pill covers it. */
function coveredAtRest(sr: ShadowRoot): string[] {
  const pills = PILLS.map((s) => sr.querySelector<HTMLElement>(s)).filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0);
  const boxes = pills.map((p) => [p, p.getBoundingClientRect()] as const);
  for (const p of pills) p.style.visibility = 'hidden';
  const content = [...sr.querySelectorAll<HTMLElement>('.peekover-reader, .peekover-watch-note[data-place="aside"]')];
  const found: string[] = [];
  try {
    for (const root of content) {
      const items: DOMRect[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        items.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
      }
      for (const c of root.querySelectorAll('button, input')) items.push(c.getBoundingClientRect());
      for (const r of items) {
        for (const [p, b] of boxes) {
          if (!intersects(r, b)) continue;
          const x = (Math.max(r.left, b.left) + Math.min(r.right, b.right)) / 2;
          const y = (Math.max(r.top, b.top) + Math.min(r.bottom, b.bottom)) / 2;
          const hit = sr.elementFromPoint(x, y);
          if (hit && content.some((c) => c.contains(hit))) found.push(`${p.className} over ${hit.tagName.toLowerCase()} at ${x.toFixed(0)},${y.toFixed(0)}`);
        }
      }
    }
  } finally {
    for (const p of pills) p.style.visibility = '';
  }
  return found;
}

describe('8.1i (f) — at rest the tab reader’s pills cover no text or control', () => {
  for (const width of [414, 1080, 1280, 1440]) {
    for (const contents of ['closed', 'open'] as const) {
      it(`${width}px, contents ${contents}`, async () => {
        await page.viewport(width, width === 414 ? 896 : 800);
        registerWatchTarget({ start: () => undefined, stop: () => undefined, isWatching: () => false });
        const host = document.createElement('div');
        document.body.appendChild(host);
        containers.push(host);
        mount(REST_DOC, host);
        host.style.scrollBehavior = 'auto';
        await frames(4);
        const sr = host.shadowRoot!;
        lightNetworkIndicator(host);
        const opener = sr.querySelector<HTMLButtonElement>('.peekover-toc__toggle')!;
        if ((opener.getAttribute('aria-expanded') === 'true') !== (contents === 'open')) opener.click();
        host.scrollTop = 0;
        await frames(4);
        expect(opener.getAttribute('aria-expanded'), 'the contents state').toBe(String(contents === 'open'));
        expect(host.scrollHeight, 'the page scrolls (non-vacuous)').toBeGreaterThan(host.clientHeight + 200);
        expect(sr.querySelector('.peekover-watch')!.getClientRects().length, 'the Watch pill is drawn').toBeGreaterThan(0);
        expect(coveredAtRest(sr), `at rest, ${width}px, contents ${contents}`).toEqual([]);
      });
    }
  }
});
