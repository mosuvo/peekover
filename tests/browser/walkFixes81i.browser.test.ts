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
