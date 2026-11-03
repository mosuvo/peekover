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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { page, commands, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { TOOLBAR_CLASS, createToolbar } from '../../src/app/toolbar';
import { mount } from '../../src/render/mount';
import { setReaderMode } from '../../src/render/readerMode';
import { enhanceEditor } from '../../src/render/editorEnhancer';
import { loadCodeMirror, type EditorModuleLoader } from '../../src/render/editorEngine';
import { EDITOR_DIRTY_ATTR, editorSessionFor, teardownEditorShell } from '../../src/render/editorView';
import { setThemeSetting } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { TEXT_BAR, backdropOf, gradientStops, inkOf, ratioOver } from './helpers/contrast';
import { isWatching, resetWatchRegistryForTest, setWatchNote, stopWatch, watchNote } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_NOTE_CLASS } from '../../src/watch/watchControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { DIFF_HOST_ATTR } from '../../src/render/diffView';
import { DEAD_READ_NOTE, CHANGED_AGAIN_NOTE } from '../../src/watch/watchController';

const C = TOOLBAR_CLASS;
const DOC_A = '# Alpha\n\nThe first document.\n\n## Second\n\nMore.\n';
const DOC_B = '# Beta\n\nThe second document.\n';
const LONG_NAME = 'architecture-decisions-and-the-long-running-migration-notes.md';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('until: timed out');
}

/** A PERSISTABLE folder (4.2): the app page can then watch and compare, so the toolbar carries Watch
 *  and Compare. `persistable: false` is the "cannot watch here" route the watch-note test takes. */
function source(persistable = true): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable,
    files: [
      { path: 'alpha.md', name: 'alpha.md', read: async () => DOC_A },
      { path: 'beta.md', name: 'beta.md', read: async () => DOC_B },
      { path: 'CLAUDE.md', name: 'CLAUDE.md', read: async () => DOC_B },
      // 4.4 — a name long enough that the compact toolbar must truncate it.
      { path: LONG_NAME, name: LONG_NAME, read: async () => DOC_A },
    ],
  };
}

const store = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
});

let container: HTMLElement;

async function openShell(persistable = true): Promise<HTMLElement> {
  container = document.createElement('div');
  document.body.appendChild(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source: source(persistable) }), store: store() });
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
  stopWatch();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDiffRegistryForTest();
  resetDocIdentityForTest();
  document.body.replaceChildren();
  await page.viewport(1280, 900);
});

afterEach(async () => {
  stopWatch();
  document.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
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
    // KEEPS: the skeleton's parts in the mock's order (4.1's own test). RE-SPELLED at 4.2: the badge,
    // Watch and Compare slots sit between the file name and Read / Raw.
    // RE-SPELLED again at 4.4 (C362): the Files slot leads (empty until 4.8), and the row break, the
    // app controls' group, "⋯" and its menu follow Read · Edit · Raw.
    expect([...toolbar().children].map((el) => el.className.split(' ')[0])).toEqual([
      `${C}__files`,
      `${C}__brand`,
      `${C}__file`,
      `${C}__badge`,
      `${C}__watch`,
      `${C}__compare`,
      `${C}__break`,
      `${C}__seg`,
      `${C}__app`,
      `${C}__more`,
      `${C}__menu`,
    ]);
    expect(toolbar().querySelector(`.${C}__brand`)?.textContent).toBe('Peekover');
    expect(toolbar().querySelector(`.${C}__mark`)).not.toBeNull();
    expect(toolbar().querySelector(`.${C}__file`)?.textContent).toBe('alpha.md');
    // KEEPS: the segment's views in the mock's order (C357). RE-SPELLED at 4.3: Edit joins, between
    // Read and Raw (D-6).
    expect([...toolbar().querySelectorAll(`.${C}__seg button`)].map((b) => b.textContent)).toEqual(['Read', 'Edit', 'Raw']);
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

    // Ruling B: an outside flip. KEEPS: the toolbar reflects a mode change it did not make (C368). RE-SPELLED at
    // 013 task 4.5: the reader's mode pill is gone from the app page (`pills: false`), so the outside flip is the
    // programmatic one — `setReaderMode`, the call the pill made.
    expect(host.shadowRoot!.querySelector('.peekover-mode-toggle'), 'no mode pill on the app page').toBeNull();
    setReaderMode(host, 'raw');
    expect(host.getAttribute('data-mode')).toBe('raw');
    await sleep(50);
    expect(pressed(), 'the toolbar missed the outside flip').toEqual(['raw']);
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
    // 4.2 — the toolbar's Compare picker joins the same property.
    { name: 'Compare', toggle: '.peekover-toolbar .peekover-diff-affordance', panel: '.peekover-toolbar .peekover-diff-picker', rows: '.peekover-toolbar .peekover-diff-picker__item' },
  ];

  const cases = [414, 1080, 1440].flatMap((w) => (['light', 'dark'] as const).map((t) => [w, t] as const));
  it.each(cases)('at %i px, %s: Export, Code theme, Stored data and Compare open fully inside the viewport', async (width, theme) => {
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
      // KEEPS: each panel, opened the way a user opens it, lies inside the window with every row
      // reachable (4.1's own test; C364). RE-SPELLED at 4.4: at ≤ 863 px the four app controls are behind
      // "⋯", so the panel is opened from its menu item there; Compare stays in the toolbar.
      await openFromToolbar(toggle, p.name);
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

// ── 4.2 — Watch, Compare and the agent badge in the toolbar; the watch note below it ──────────────
//
// Each control comes from the SAME builder the reader's pill uses, so the state is shared, not
// copied: the watch registry for Watch, the host's `data-diff` for Compare. 4.2 asserted every sync in
// both directions against the still-rendered pills (F-6); from 4.5 the app page has no pills, so the
// other direction is the state changed from outside the toolbar (C368–C371).

const shadowOfHost = () => container.querySelector<HTMLElement>('.peekover-app__reader__host')!.shadowRoot!;
const tbWatch = () => toolbar().querySelector<HTMLButtonElement>('.peekover-watch')!;
const tbCompare = () => toolbar().querySelector<HTMLButtonElement>('.peekover-diff-affordance')!;
/** A token's colour as the engine computes it, where `el` sits (a probe span inheriting its tokens). */
function rgb(token: string, el: Element): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  el.parentElement!.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

describe('4.2 — Watch, Compare and the agent badge in the toolbar', () => {
  // KEEPS: the toolbar's Watch is the SAME watch (the registry), in both directions (C369). RE-SPELLED at 013 task
  // 4.5: the reader's watch pill is gone from the app page (`pills: false`), so the other direction is a stop made
  // outside the toolbar — the registry's own `stopWatch()`, what the pill's click reached.
  it('Watch: the toolbar toggles the registry\'s watch, and reflects a stop it did not make', async () => {
    await openShell();
    const host = await open('alpha.md');
    expect(tbWatch(), 'the toolbar carries Watch on a watchable folder').not.toBeNull();
    expect(host.shadowRoot!.querySelector('.peekover-watch'), 'no watch pill on the app page').toBeNull();
    expect([isWatching(), tbWatch().getAttribute('aria-pressed')]).toEqual([false, 'false']);

    tbWatch().click();
    await until(() => isWatching());
    await until(() => tbWatch().getAttribute('aria-pressed') === 'true');
    expect([isWatching(), tbWatch().getAttribute('aria-pressed')], 'after the toolbar click').toEqual([true, 'true']);

    stopWatch(); // a stop the toolbar did not make
    await until(() => tbWatch().getAttribute('aria-pressed') === 'false');
    expect([isWatching(), tbWatch().getAttribute('aria-pressed')], 'after the outside stop').toEqual([false, 'false']);
  });

  it.each(['light', 'dark'] as const)('Watching looks per the mock in %s: ink text, green dot, green border, text at AA', async (theme) => {
    await openShell();
    await open('alpha.md');
    setThemeSetting(theme);
    tbWatch().click();
    await until(() => tbWatch().getAttribute('aria-pressed') === 'true');
    await sleep(450);
    const w = tbWatch();
    const cs = getComputedStyle(w);
    expect(cs.color, 'ink text (G-4)').toBe(rgb('--ink', w));
    expect(cs.borderTopColor, 'green border').toBe(rgb('--ok', w));
    expect(getComputedStyle(w.querySelector('.peekover-watch__dot')!).backgroundColor, 'green dot').toBe(rgb('--ok', w));
    const text = w.querySelector<HTMLElement>('.peekover-watch__text')!;
    const ratio = ratioOver(inkOf(text), backdropOf(text)).ratio;
    expect(ratio, `${theme}: "Watching" at ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(TEXT_BAR);
  });

  it('Compare: the picker opens under its own button; a comparison opens and closes from the toolbar', async () => {
    await openShell();
    await open('alpha.md');
    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host')!;

    tbCompare().click();
    const picker = await until(() => {
      const el = toolbar().querySelector<HTMLElement>('.peekover-diff-picker');
      return el && !el.hidden && el.querySelector('.peekover-diff-picker__item') ? el : null;
    });
    const b = tbCompare().getBoundingClientRect();
    const p = picker.getBoundingClientRect();
    expect(p.top, 'the picker opens BELOW its button').toBeGreaterThanOrEqual(b.bottom - 1);
    expect(p.left <= b.right && p.right >= b.left, 'the picker sits under its own button').toBe(true);

    // KEEPS: the toolbar's Compare opens a comparison and closes it, and shows the state (C370). RE-SPELLED at 013
    // task 4.5: the reader's Compare pill is gone from the app page, so the round trip is the toolbar's own.
    expect(shadowOfHost().querySelector('.peekover-diff-affordance'), 'no Compare pill on the app page').toBeNull();
    picker.querySelector<HTMLButtonElement>('[data-target-kind="file"]')!.click();
    await until(() => host.getAttribute(DIFF_HOST_ATTR) === 'active');
    await until(() => tbCompare().textContent === 'Close comparison');
    expect(tbCompare().dataset.diffOpen).toBe('true');
    tbCompare().click();
    await until(() => host.getAttribute(DIFF_HOST_ATTR) === null);
    await until(() => tbCompare().textContent === 'Compare');
    expect(tbCompare().dataset.diffOpen, 'the toolbar returned to Compare').toBeUndefined();
  });

  it('the agent badge shows for an agent file, with its full label, and not for a plain one — refreshed on a switch', async () => {
    await openShell();
    await open('CLAUDE.md');
    const badge = () => toolbar().querySelector<HTMLElement>('.peekover-agent-badge');
    expect(badge()?.textContent).toBe('Agent file · CLAUDE.md');
    await open('alpha.md');
    expect(badge(), 'a plain file carries no badge — the old one is gone').toBeNull();
    await open('CLAUDE.md');
    expect(badge()?.textContent).toBe('Agent file · CLAUDE.md');
  });
});

describe('4.2 — the watch note in the notice area below the toolbar (ruling A)', () => {
  const noticeNote = () => container.querySelector<HTMLElement>(`.peekover-app__notices .${WATCH_NOTE_CLASS}`)!;
  // KEEPS: the notice area's watch note says what the watch registry has to say, for each case (C371). RE-SPELLED
  // at 013 task 4.5: the reader's own note is gone from the app page (`pills: false`) — the registry's text is
  // the reference now, and none is in the reader.
  it('says what the watch has to say, for each case it covers: unavailable, stopped, changed again — and the reader says none', async () => {
    await openShell(false); // a folder this surface cannot watch — the real "not available" route
    await open('alpha.md');
    const unavailable = watchNote();
    expect(unavailable, 'the route explains why watching is missing').toBeTruthy();
    await until(() => noticeNote().textContent === unavailable);
    expect(noticeNote().hidden).toBe(false);
    expect(shadowOfHost().querySelector(`.${WATCH_NOTE_CLASS}`), 'no note in the reader').toBeNull();
    for (const text of [DEAD_READ_NOTE, CHANGED_AGAIN_NOTE]) {
      setWatchNote(text);
      await until(() => noticeNote().textContent === text);
      expect(noticeNote().textContent).toBe(watchNote());
    }
    setWatchNote(null);
    await until(() => noticeNote().hidden);
  });

  it.each([414, 1080, 1440])('at %i px it sits in the page flow: below the header, above the reader, overlapping neither', async (width) => {
    await page.viewport(width, 900);
    await openShell(false);
    await open('alpha.md');
    await until(() => !noticeNote().hidden);
    await document.fonts.ready;
    const note = noticeNote().getBoundingClientRect();
    const header = container.querySelector<HTMLElement>('.peekover-app__header')!.getBoundingClientRect();
    const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!.getBoundingClientRect();
    expect(note.height, 'the note is laid out').toBeGreaterThan(0);
    expect(note.top, 'below the header and toolbar').toBeGreaterThanOrEqual(header.bottom - 0.5);
    expect(note.bottom, 'above the reading column — never over text').toBeLessThanOrEqual(reader.top + 0.5);
    expect(note.left >= -0.5 && note.right <= innerWidth + 0.5, 'inside the window').toBe(true);
    const el = document.elementFromPoint(note.left + note.width / 2, note.top + note.height / 2);
    expect(el && noticeNote().contains(el), 'nothing covers it').toBe(true);
  });
});

// ── 4.3 — the Edit segment (D-6; the 4.0 census ruling E) ───────────────────────────────────────
//
// Read · Edit · Raw. Edit enters edit through `toggleEdit` — the shadow-root control is gone. Read and
// Raw stay offered while editing and leave edit for the mode clicked, through the unsaved-changes
// guard: a clean buffer switches at once; a dirty one asks, "Keep editing" changes nothing, "Discard
// edits" switches. Escape on the question puts focus back on Edit. A failed engine load says
// "Editor unavailable" on the Edit segment, and a second activation retries. The guard over every
// other exit is editorUnsaved.browser.test.ts's; these are the segment's own.

const TYPED = ' zq43typed';
const DIALOG = '.peekover-unsaved'; // by literal — unsavedGuard.test.ts pins it to the module
const buffer = (host: HTMLElement): string => editorSessionFor(host)?.view.state.doc.toString() ?? '<no live edit session — the buffer is gone>';
function deepActive(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

async function editViaSegment(host: HTMLElement): Promise<void> {
  segButton('edit').click();
  await until(() => host.getAttribute('data-mode') === 'edit' && editorSessionFor(host), 400);
}

function typeInto(host: HTMLElement, text: string): void {
  const view = editorSessionFor(host)!.view;
  view.dispatch({ changes: { from: view.state.doc.length, insert: text } });
}

describe('4.3 — the Edit segment (ruling E)', () => {
  it('the segment is Read · Edit · Raw; Edit enters edit; Read and Raw stay offered while editing; no shadow-root control', async () => {
    await openShell();
    const host = await open('alpha.md');
    expect([...toolbar().querySelectorAll(`.${C}__seg button`)].map((b) => b.textContent)).toEqual(['Read', 'Edit', 'Raw']);
    expect(host.shadowRoot!.querySelector('.peekover-edit-toggle'), 'the shadow-root Edit control is gone (by class alone)').toBeNull();
    await editViaSegment(host);
    expect(pressed()).toEqual(['edit']);
    expect([segButton('reading').disabled, segButton('raw').disabled], 'Read and Raw are offered while editing').toEqual([false, false]);
    expect(host.shadowRoot!.querySelector('.peekover-edit-toggle')).toBeNull();
  });

  it.each(['reading', 'raw'] as const)('a CLEAN buffer: %s leaves edit at once, for that mode, asking nothing', async (mode) => {
    await openShell();
    const host = await open('alpha.md');
    await editViaSegment(host);
    segButton(mode).click();
    await until(() => host.getAttribute('data-mode') === mode);
    expect(container.querySelector(DIALOG), 'nothing is asked').toBeNull();
    expect(editorSessionFor(host), 'the edit view is torn down').toBeFalsy();
    expect(pressed()).toEqual([mode]);
  });

  it.each(['reading', 'raw'] as const)('a DIRTY buffer: %s asks first — Keep editing changes nothing; Discard edits goes there', async (mode) => {
    await openShell();
    const host = await open('alpha.md');
    await editViaSegment(host);
    typeInto(host, TYPED);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'the fixture is dirty').toBe(true);
    segButton(mode).click();
    await sleep(100);
    // The instrument that sees a bypass: the typed text, read from the live session FIRST.
    expect(buffer(host), 'the switch must not lose the buffer').toContain(TYPED);
    const dialog = await until(() => container.querySelector<HTMLElement>(DIALOG));
    expect(host.getAttribute('data-mode')).toBe('edit');
    dialog.querySelector<HTMLElement>('.peekover-unsaved__keep')!.click();
    await sleep(50);
    expect([host.getAttribute('data-mode'), buffer(host).endsWith(TYPED)], 'Keep editing changes nothing').toEqual(['edit', true]);
    segButton(mode).click();
    (await until(() => container.querySelector<HTMLElement>(`${DIALOG} .peekover-unsaved__discard`))).click();
    await until(() => host.getAttribute('data-mode') === mode);
    expect(editorSessionFor(host), 'Discard edits ends the session').toBeFalsy();
    expect(pressed()).toEqual([mode]);
  });

  it('Escape on the question keeps editing, and focus returns to the Edit segment', async () => {
    await openShell();
    const host = await open('alpha.md');
    await editViaSegment(host);
    typeInto(host, TYPED);
    segButton('raw').focus();
    segButton('raw').click();
    await until(() => container.querySelector(DIALOG));
    await userEvent.keyboard('{Escape}');
    await until(() => !container.querySelector(DIALOG));
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(buffer(host)).toContain(TYPED);
    expect(deepActive(), 'focus is on the Edit segment').toBe(segButton('edit'));
  });
});

describe('4.3 — "Editor unavailable" on the Edit segment (ruling E)', () => {
  it('a failed engine load says so on the segment, keeps the mode, and a second activation retries and enters', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    mount(DOC_A, host, { contained: true });
    let fail = true;
    const loader = vi.fn<EditorModuleLoader>(() => (fail ? Promise.reject(new Error('chunk failed to load')) : loadCodeMirror()));
    enhanceEditor(host, { loader });
    const tb = createToolbar(document);
    container = document.createElement('div');
    container.append(tb.element);
    document.body.prepend(container);
    tb.setDocument('alpha.md', host);

    const edit = segButton('edit');
    edit.click();
    await until(() => edit.textContent === 'Editor unavailable');
    expect(edit.getAttribute('aria-label'), 'the name says it can be tried again').toMatch(/could not be loaded.*try again/i);
    expect([host.getAttribute('data-mode'), editorSessionFor(host) ?? null], 'the mode is kept, nothing built').toEqual(['reading', null]);

    fail = false;
    edit.click();
    await until(() => host.getAttribute('data-mode') === 'edit', 400);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(edit.textContent, 'the segment says Edit again').toBe('Edit');
    expect(pressed()).toEqual(['edit']);
  });
});

// ── 4.4 — the app controls in the toolbar; one theme control; the compact toolbar (D-5; ruling C) ──
//
// Above 863 px the four app controls — Theme, Code theme, Stored data, Export — sit in the toolbar's
// right-hand group, in the mock's order. At ≤ 863 px (the approved compact breakpoint) they are behind
// "⋯": the wordmark is hidden, the file name truncates, the badge reads "Agent file", and the toolbar
// keeps two rows in every state — row 1 the mark, the file name, the badge and "⋯"; row 2 Watch,
// Compare and Read · Edit · Raw. The menu's items open the same panels the buttons do.

const appGroup = () => toolbar().querySelector<HTMLElement>(`.${C}__app`)!;
const more = () => toolbar().querySelector<HTMLButtonElement>(`.${C}__more`)!;
const menu = () => toolbar().querySelector<HTMLElement>(`.${C}__menu`)!;
const menuItems = () => [...menu().querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
const shown = (el: Element | null | undefined): boolean => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

/** Open an app control's panel as a user would at this width: its own button, or its "⋯" item. */
async function openFromToolbar(toggle: HTMLElement, name: string): Promise<void> {
  if (shown(toggle)) {
    toggle.click();
    return;
  }
  expect(shown(more()), `${name}: hidden, so "⋯" must be offered`).toBe(true);
  more().click();
  const item = await until(() => menuItems().find((b) => b.dataset.control === toggle.dataset.toolbarControl));
  item.click();
}

/** The toolbar's laid-out items and the distinct rows they sit on (tops within 6 px are one row). */
function rowsOf(): { rows: number; tops: number[] } {
  const items = [
    ...toolbar().children,
    ...toolbar().querySelectorAll(`.${C}__badge > *, .${C}__watch > *, .${C}__compare > button, .${C}__app > *`),
  ].filter((el) => !['contents'].includes(getComputedStyle(el).display) && shown(el));
  const tops: number[] = [];
  for (const el of items) {
    const top = el.getBoundingClientRect().top;
    if (!tops.some((t) => Math.abs(t - top) < 6)) tops.push(top);
  }
  return { rows: tops.length, tops: tops.sort((a, b) => a - b).map(Math.round) };
}

describe('4.4 — the app controls in the toolbar, above 863 px', () => {
  it.each([1080, 1440])('at %i px they sit in the right-hand group in the mock\'s order, no "⋯"; keyboard order runs left to right', async (width) => {
    await page.viewport(width, 900);
    await openShell();
    await open('alpha.md');
    await document.fonts.ready;
    const labels = [...appGroup().querySelectorAll<HTMLElement>('button')].filter(shown).map((b) => b.textContent ?? '');
    expect(labels.map((l) => l.replace(/:.*/, ':'))).toEqual(['Theme:', 'Code theme:', 'Stored data', 'Export']);
    expect(shown(more()), 'no "⋯" above the compact breakpoint').toBe(false);
    expect(container.querySelector('.peekover-app__header')!.contains(appGroup())).toBe(true);
    expect(toolbar().contains(container.querySelector('.peekover-app__theme-toggle'))).toBe(true);
    const tb = toolbar().getBoundingClientRect();
    expect(Math.abs(appGroup().getBoundingClientRect().right - tb.right), 'the group ends at the toolbar\'s right edge').toBeLessThan(2);

    // Tab order = reading order: the focusable controls, in DOM order, run left to right, row by row.
    const focusable = [...toolbar().querySelectorAll<HTMLElement>('button')].filter((b) => shown(b) && !(b as HTMLButtonElement).disabled);
    const reading = [...focusable].sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return Math.abs(ra.top - rb.top) < 6 ? ra.left - rb.left : ra.top - rb.top;
    });
    expect(focusable.map((b) => b.textContent)).toEqual(reading.map((b) => b.textContent));
  });

  it('the one theme control themes the shell and the reader together, on computed tokens', async () => {
    await page.viewport(1280, 900);
    await openShell();
    const host = await open('alpha.md');
    const theme = toolbar().querySelector<HTMLButtonElement>('.peekover-app__theme-toggle')!;
    const shell = container.querySelector<HTMLElement>('.peekover-app')!;
    const paper = (el: Element) => getComputedStyle(el).getPropertyValue('--paper').trim();
    for (let i = 0; i < 3 && theme.textContent !== 'Theme: Dark'; i += 1) theme.click();
    expect(theme.textContent).toBe('Theme: Dark');
    await sleep(100);
    const reader = getComputedStyle(host.shadowRoot!.querySelector('.peekover-reader')!).getPropertyValue('--paper').trim();
    expect(reader, 'the reader follows the toolbar\'s theme control').toBe(paper(shell));
    theme.click(); // Dark → Auto
    for (let i = 0; i < 3 && theme.textContent !== 'Theme: Light'; i += 1) theme.click();
    await sleep(100);
    const light = getComputedStyle(host.shadowRoot!.querySelector('.peekover-reader')!).getPropertyValue('--paper').trim();
    expect(light).toBe(paper(shell));
    expect(light, 'and the two picks really differ').not.toBe(reader);
  });
});

describe('4.4 — the compact toolbar at ≤ 863 px ("⋯"; two rows in every state)', () => {
  const STATES: { name: string; file: string; arrange?: (host: HTMLElement) => Promise<void> }[] = [
    { name: 'reading', file: 'alpha.md' },
    { name: 'an agent file (the widest)', file: 'CLAUDE.md' },
    { name: 'a long file name', file: LONG_NAME },
    { name: 'watching', file: 'CLAUDE.md', arrange: async () => { tbWatch().click(); await until(() => tbWatch().getAttribute('aria-pressed') === 'true'); } },
    { name: 'editing', file: 'CLAUDE.md', arrange: async (host) => editViaSegment(host) },
    { name: 'the Compare picker open', file: 'CLAUDE.md', arrange: async () => { tbCompare().click(); await until(() => toolbar().querySelector('.peekover-diff-picker:not([hidden])')); } },
    {
      name: 'a comparison on screen',
      file: 'CLAUDE.md',
      arrange: async (host) => {
        tbCompare().click();
        (await until(() => toolbar().querySelector<HTMLButtonElement>('.peekover-diff-picker [data-target-kind="file"]'))).click();
        await until(() => host.getAttribute(DIFF_HOST_ATTR) === 'active' && tbCompare().textContent === 'Close comparison');
      },
    },
  ];
  const cases = [414, 860, 863].flatMap((w) => STATES.map((s) => [w, s.name, s] as const));

  it.each(cases)('at %i px, %s: two rows; the word hidden, the app controls behind "⋯"', async (width, _name, state) => {
    await page.viewport(width, 900);
    await openShell();
    const host = await open(state.file);
    await state.arrange?.(host);
    await document.fonts.ready;
    await sleep(60);
    const { rows, tops } = rowsOf();
    expect(rows, `rows at ${tops.join(', ')}`).toBe(2);
    expect(shown(more()), '"⋯" is offered').toBe(true);
    expect(shown(toolbar().querySelector(`.${C}__word`)), 'no wordmark beside the mark').toBe(false);
    for (const sel of ['.peekover-app__theme-toggle', '.peekover-code-theme-toggle', '.peekover-app__storage-toggle', '.peekover-app__export-toggle']) {
      expect(shown(container.querySelector(sel)), `${sel} is behind "⋯"`).toBe(false);
    }
    // The mock's order on each row, left to right: row 1 the mark, the file name, the badge, "⋯";
    // row 2 Watch, Compare, Read · Edit · Raw.
    const rowOf = (el: Element): number => (el.getBoundingClientRect().top < (tops[0] + tops[1]) / 2 ? 1 : 2);
    const seq = [
      ['mark', toolbar().querySelector(`.${C}__brand`)],
      ['file', toolbar().querySelector(`.${C}__file`)],
      ['badge', toolbar().querySelector('.peekover-agent-badge')],
      ['⋯', more()],
      ['Watch', tbWatch()],
      ['Compare', tbCompare()],
      ['Read · Edit · Raw', toolbar().querySelector(`.${C}__seg`)],
    ].filter(([, el]) => shown(el as Element)) as [string, Element][];
    const placed = seq.map(([n, el]) => `${rowOf(el)}:${n}`);
    const byScreen = [...seq]
      .sort(([, a], [, b]) => rowOf(a) - rowOf(b) || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      .map(([n, el]) => `${rowOf(el)}:${n}`);
    expect(byScreen, 'each row, left to right, in the mock\'s order').toEqual(placed);
    expect(placed.filter((s) => s.startsWith('1:')).map((s) => s.slice(2)), 'row 1').toEqual(
      ['mark', 'file', 'badge', '⋯'].filter((n) => seq.some(([m]) => m === n)),
    );
    const r = toolbar().getBoundingClientRect();
    expect(r.right <= innerWidth + 0.5 && r.left >= -0.5, 'inside the window').toBe(true);
    if (state.file === 'CLAUDE.md') {
      const badge = toolbar().querySelector<HTMLElement>('.peekover-agent-badge')!;
      expect(badge.innerText.trim(), 'the badge reads "Agent file" — the name is beside it').toBe('Agent file');
    }
    if (state.file === LONG_NAME) {
      const file = toolbar().querySelector<HTMLElement>(`.${C}__file`)!;
      expect(file.scrollWidth, 'the file name truncates').toBeGreaterThan(file.clientWidth);
      expect(getComputedStyle(file).textOverflow).toBe('ellipsis');
    }
  });

  it.each([414, 860])('at %i px "⋯" is a menu button: Enter opens it on the first item; arrows, Home / End and Tab move; Escape closes to "⋯"', async (width) => {
    await page.viewport(width, 900);
    await openShell();
    await open('alpha.md');
    expect(more().getAttribute('aria-haspopup')).toBe('menu');
    expect(more().getAttribute('aria-expanded')).toBe('false');
    more().focus();
    await userEvent.keyboard('{Enter}');
    await until(() => shown(menu()));
    expect(more().getAttribute('aria-expanded')).toBe('true');
    expect(menu().getAttribute('role')).toBe('menu');
    const items = menuItems();
    expect(items.map((b) => (b.textContent ?? '').replace(/:.*/, ':'))).toEqual(['Theme:', 'Code theme:', 'Stored data', 'Export']);
    expect(document.activeElement, 'focus moves to the first item').toBe(items[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items[3]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement, 'ArrowDown wraps').toBe(items[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement, 'ArrowUp wraps').toBe(items[3]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items[0]);
    await userEvent.tab();
    expect(document.activeElement, 'Tab moves through it too').toBe(items[1]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(items[0]);
    await userEvent.keyboard('{Escape}');
    await until(() => !shown(menu()));
    expect(more().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement, 'Escape returns focus to "⋯"').toBe(more());

    // Space opens it too; a click outside closes it.
    await userEvent.keyboard(' ');
    await until(() => shown(menu()));
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await until(() => !shown(menu()));
  });

  it('a menu item opens the same panel its button does — Export, inside the window — and the menu closes; closing Export returns focus to "⋯"', async () => {
    await page.viewport(414, 900);
    await openShell();
    await open('alpha.md');
    more().click();
    const exportItem = await until(() => menuItems().find((b) => b.textContent === 'Export'));
    exportItem.click();
    const panel = await until(() => container.querySelector<HTMLElement>('.peekover-app__export-slot:not(:empty)'));
    expect(shown(menu()), 'the menu closed').toBe(false);
    const r = panel.getBoundingClientRect();
    expect(r.left >= -0.5 && r.right <= innerWidth + 0.5, `panel [${Math.round(r.left)}, ${Math.round(r.right)}] inside the window`).toBe(true);
    await userEvent.keyboard('{Escape}');
    await until(() => !container.querySelector('.peekover-app__export-slot:not(:empty)'));
    expect(document.activeElement, 'its button is behind "⋯", so focus returns there').toBe(more());
  });
});
