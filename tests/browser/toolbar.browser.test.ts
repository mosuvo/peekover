// THE APP-PAGE TOOLBAR (013 group 4, plan D-5), against the approved mock (`design/toolbar-mock.html`;
// decisions.md "M13 GATE — 3.1 TOOLBAR MOCK APPROVED"). 4.1: the skeleton — the mark, the open
// file's name, Read / Raw — on the real shell, both engines.
//
// What 4.1 asserts, each with the instrument that would see it fail:
// - contents and order in the header, and the "Zero network by default" tag gone (the 4.0 census
//   ruling F);
// - Read / Raw drive the reader host's `data-mode` (the same state the mode pill uses), and the
//   toolbar reflects a flip it did not make — a click on the still-rendered mode pill (ruling B: `\`
//   stays inert on the app page) — and a document switch;
// - the toolbar is outside the reader's shadow root, so a re-render does not replace it;
// - the mark's lids blink only when the user allows motion, measured in the same run both ways;
// - the file-name chip's contrast, light and dark, through the shared 2.2 helper.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page, commands } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { TOOLBAR_CLASS } from '../../src/app/toolbar';
import { setThemeSetting } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { TEXT_BAR, backdropOf, gradientStops, inkOf, ratioOver } from './helpers/contrast';

const C = TOOLBAR_CLASS;
const DOC_A = '# Alpha\n\nThe first document.\n\n## Second\n\nMore.\n';
const DOC_B = '# Beta\n\nThe second document.\n';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('until: timed out');
}

function source(): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [
      { path: 'alpha.md', name: 'alpha.md', read: async () => DOC_A },
      { path: 'beta.md', name: 'beta.md', read: async () => DOC_B },
    ],
  };
}

const store = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
});

let container: HTMLElement;

async function openShell(): Promise<HTMLElement> {
  container = document.createElement('div');
  document.body.appendChild(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: source() }), store: store() });
  await app.openFolder();
  return container;
}

/** Click a file in the tree and wait until the reader has rendered it and the toolbar names it. */
async function open(name: string): Promise<HTMLElement> {
  const row = await until(() =>
    [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
      (b) => b.textContent === name,
    ),
  );
  row.click();
  await until(() => container.querySelector(`.${C}__file`)?.textContent === name);
  return until(() => {
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    return host?.shadowRoot?.querySelector('.peekover-reader h1') ? host : null;
  });
}

const toolbar = () => container.querySelector<HTMLElement>(`.${C}`)!;
const segButton = (mode: string) => toolbar().querySelector<HTMLButtonElement>(`.${C}__seg [data-mode="${mode}"]`)!;
const pressed = () =>
  [...toolbar().querySelectorAll<HTMLButtonElement>(`.${C}__seg button`)].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.mode);

beforeEach(async () => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
  await page.viewport(1280, 900);
});

afterEach(async () => {
  document.body.replaceChildren();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  setThemeSetting('auto');
  await commands.emulateReducedMotion(null);
  await page.viewport(414, 896);
});

describe('4.1 — the toolbar skeleton on the app page', () => {
  it('sits first in the header: the mark and word, the file name, Read / Raw — and the tag is gone', async () => {
    await openShell();
    await open('alpha.md');
    const header = container.querySelector<HTMLElement>('.peekover-app__header')!;
    expect(header.firstElementChild, 'the toolbar is the header\'s first part').toBe(toolbar());
    expect([...toolbar().children].map((el) => el.className.split(' ')[0])).toEqual([
      `${C}__brand`,
      `${C}__file`,
      `${C}__seg`,
    ]);
    expect(toolbar().querySelector(`.${C}__brand`)?.textContent).toBe('Peekover');
    expect(toolbar().querySelector(`.${C}__mark`)).not.toBeNull();
    expect(toolbar().querySelector(`.${C}__file`)?.textContent).toBe('alpha.md');
    expect([...toolbar().querySelectorAll(`.${C}__seg button`)].map((b) => b.textContent)).toEqual(['Read', 'Raw']);
    // Ruling F: the header's tag is removed; the status line carries the network claim from 4.7.
    expect(header.textContent).not.toContain('Zero network by default');
    // Outside the reader's shadow root — the reader's `replaceChildren` can never reach it.
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
    expect(host.contains(toolbar())).toBe(false);
  });

  it('Read / Raw switch the reader, and the toolbar reflects a flip it did not make (the mode pill)', async () => {
    await openShell();
    const host = await open('alpha.md');
    expect(pressed()).toEqual(['reading']);

    segButton('raw').click();
    expect(host.getAttribute('data-mode')).toBe('raw');
    await until(() => pressed()[0] === 'raw');
    segButton('reading').click();
    expect(host.getAttribute('data-mode')).toBe('reading');
    await until(() => pressed()[0] === 'reading');

    // Ruling B: an outside flip — the reader's own mode pill, still rendered until 4.5.
    host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-mode-toggle')!.click();
    expect(host.getAttribute('data-mode')).toBe('raw');
    await sleep(50);
    expect(pressed(), 'the toolbar missed the mode pill\'s flip').toEqual(['raw']);
  });

  it('a document switch: the toolbar names the new file, shows its mode, and survives the re-render', async () => {
    await openShell();
    await open('alpha.md');
    const before = toolbar();
    segButton('raw').click();
    await until(() => pressed()[0] === 'raw');

    const host = await open('beta.md');
    expect(toolbar(), 'the toolbar element was replaced').toBe(before);
    expect(toolbar().querySelector(`.${C}__file`)?.textContent).toBe('beta.md');
    // A fresh document lands in Reading (mount's reset), and the toolbar says so.
    expect(host.getAttribute('data-mode')).toBe('reading');
    await until(() => pressed()[0] === 'reading');
    segButton('raw').click();
    expect(host.getAttribute('data-mode')).toBe('raw');
  });

  it('the mark blinks only when motion is allowed: running without reduced motion, none under it', async () => {
    await openShell();
    await open('alpha.md');
    const lid = toolbar().querySelector<SVGGElement>(`.${C}__lid`)!;

    await commands.emulateReducedMotion('no-preference');
    await sleep(50);
    const moving = getComputedStyle(lid);
    expect(moving.animationName, 'the lids do not blink with motion allowed').toBe(`${C}-blink`);
    expect(moving.animationPlayState).toBe('running');

    await commands.emulateReducedMotion('reduce');
    await sleep(50);
    expect(getComputedStyle(lid).animationName, 'the lids still blink under reduced motion').toBe('none');
  });

  it.each(['light', 'dark'] as const)('the file-name chip reads at AA in the %s theme (the 2.2 helper)', async (theme) => {
    await openShell();
    await open('alpha.md');
    setThemeSetting(theme);
    await sleep(450); // colour transitions settle (the 2.2 census's measurement rule)
    const file = toolbar().querySelector<HTMLElement>(`.${C}__file`)!;
    const ink = inkOf(file);
    const backdrop = backdropOf(file);
    // The chip's own highlighter: in light a half-height marker (a gradient), in dark a full fill.
    const ratios = [ratioOver(ink, backdrop).ratio];
    for (const stop of gradientStops(file)) ratios.push(ratioOver(ink, { layers: [...backdrop.layers, stop], how: '' }).ratio);
    const worst = Math.min(...ratios);
    expect(worst, `${theme}: the file name reads at ${worst.toFixed(2)}:1 (${backdrop.how})`).toBeGreaterThanOrEqual(TEXT_BAR);
  });
});

// THE HEADER'S PANELS STAY INSIDE THE WINDOW (013 task 4.1; a regression the full suite found in
// this task and fixed in the same commit — gate-3 Q1). Adding the toolbar to the header moved the
// Export button onto a third row at 414 px; the Export panel, right-aligned to its button, then opened
// at x −195…185 — partly off-screen, its rows unclickable. All three header-anchored panels are held
// to the same property: fully inside the viewport, every row hit-testable at its centre, at 414, 1080
// and 1440, light and dark, both engines. Each panel is opened alone and closed before the next.
describe('4.1 — the header panels stay inside the window, their rows reachable', () => {
  const PANELS = [
    { name: 'Export', toggle: '.peekover-app__export-toggle', panel: '.peekover-app__export-slot', rows: '.peekover-app__export-slot button' },
    { name: 'Code theme', toggle: '.peekover-code-theme-toggle', panel: '.peekover-code-theme-picker', rows: '.peekover-code-theme-picker__item' },
    { name: 'Stored data', toggle: '.peekover-app__storage-toggle', panel: '.peekover-app__storage-slot', rows: '.peekover-app__storage-slot button' },
  ];

  const cases = [414, 1080, 1440].flatMap((w) => (['light', 'dark'] as const).map((t) => [w, t] as const));
  it.each(cases)('at %i px, %s: Export, Code theme and Stored data open fully inside the viewport', async (width, theme) => {
    await page.viewport(width, 900);
    await openShell();
    await open('alpha.md');
    setThemeSetting(theme);
    await document.fonts.ready;
    await sleep(450);

    const problems: string[] = [];
    for (const p of PANELS) {
      const toggle = container.querySelector<HTMLButtonElement>(p.toggle)!;
      expect(toggle, `${p.name}: its toggle is in the header`).not.toBeNull();
      await until(() => !toggle.disabled);
      toggle.click();
      const panel = await until(() => {
        const el = container.querySelector<HTMLElement>(p.panel);
        return el && el.getBoundingClientRect().height > 0 && container.querySelectorAll(p.rows).length > 0 ? el : null;
      });
      await sleep(50);
      const r = panel.getBoundingClientRect();
      if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) {
        problems.push(`${p.name}: panel [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] leaves the ${innerWidth}x${innerHeight} viewport`);
      }
      const rows = [...container.querySelectorAll<HTMLElement>(p.rows)].filter((el) => el.getBoundingClientRect().height > 0);
      expect(rows.length, `${p.name}: rows to test`).toBeGreaterThan(0);
      for (const row of rows) {
        row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const b = row.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (!hit || !row.contains(hit)) problems.push(`${p.name}: row "${row.textContent?.trim().slice(0, 30)}" is not hit-testable at its centre`);
      }
      toggle.click(); // close before the next panel
      await sleep(30);
    }
    expect(problems, `at ${width} px, ${theme}`).toEqual([]);
  });
});
