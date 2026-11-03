// Automated PROXIES for the informal eyeball owed at 012 task 3.2 — Chromium AND Firefox.
//
// ══ WHAT THIS FILE IS, AND IS NOT ═══════════════════════════════════════════════════════════════
//
// WORKFLOW §7.2 owes a cheap human glance at a new rendering surface the moment it first renders,
// and tasks.md 3.2 placed that glance at 3.2. The human DEFERRED it to the 7.1 milestone-close
// walk (2026-10-05, `decisions.md`'s "M12 TASK 3.2 — informal eyeball DEFERRED to 7.1" entry).
// This file is the compensation: every part of that glance a real engine can answer with a number
// is measured here. It is NOT the eyeball. Whether the editor looks right, reads comfortably or
// feels right is not a number and stays the human's, at 7.1.
//
// Five proxies:
//   1. CONTRAST of CodeMirror's own surfaces under the light and the dark effective theme.
//   2. COLLISIONS at the top-right: the mode pill, the TOC handle, the rail and the split pane
//      (the edit control's pairs retired at 013 task 4.3), at a narrow and a wide viewport, rail open and collapsed.
//   3. GFM and R1's dialect AS DRAWN: which ranges get a highlight-styled span, and its style.
//   4. The Ctrl/Cmd+S hazard 3.2 read from code, OBSERVED with `entrypoints/app/main.ts`'s
//      listener installed.
//   5. (No test.) The load path — see the note on the harness below.
//
// ══ ★ 3.4 TURNED THREE FINDINGS INTO ASSERTIONS (decisions.md, M12 TASK 3.4) ═══════════════════
//
// What the block below says about proxies 1 and 3 was true of every pair when this file landed.
// Task 3.4 fixed three of the findings, and the pairs they named are now ASSERTED, in both themes:
//   • E-2 — selected text on the selection (focused and unfocused), the current search match's
//     text, an unselected autocomplete option: `E2_PAIRS`, proxy 1;
//   • E-3 — every highlight-styled span on the pane, and that the colours ARE the design tokens:
//     proxy 3;
//   • E-1 — the split pane against the collapsed TOC handle: proxy 2, its pin deleted.
// Every other pair is still a measurement, reported and not asserted.
//
// ══ A PROXY THAT FINDS A DEFECT REPORTS IT; IT DOES NOT FAIL ════════════════════════════════════
//
// Proxies 1, 3 and 4 are MEASUREMENTS. Their numbers are printed as `EYEBALL {json}` lines and
// filed in `progress.md`; a contrast pair below the bar is a FINDING for the human, not a red
// test, and what Ctrl+S SHOULD do in the editor is a pending ruling (5.x), so nothing is asserted
// about it. What those tests DO assert is that the instrument works and saw the surface: the
// contrast arithmetic against known values, the theme attribute really on the host, each surface
// really open. Proxy 2 is the one that asserts its subject — see its own block for exactly which
// geometric relations are asserted and which are reported.
//
// ══ THE BAR, STATED BEFORE MEASURING ═══════════════════════════════════════════════════════════
//
// WCAG 2.1 AA: text 4.5:1 (1.4.3), non-text UI 3:1 (1.4.11). The LIGHT arm is the control: a
// pair that fails on dark and passes on light is the dark theme's own defect; a pair that fails on
// both is the engine's default (or a token), whatever the theme.
//
// ══ THE METHOD — the M7 sweep's, plus compositing ══════════════════════════════════════════════
//
// `diagramTheme.browser.test.ts` (007's dark-mode contrast sweep) measures WCAG 2.1 relative
// luminance of the COMPUTED colour against the background actually painted behind the element,
// found by walking up the ancestors and across the shadow boundary. The same formula and the same
// walk are used here. That sweep stops at the first ancestor that is not fully transparent and
// treats it as opaque; CodeMirror's active-line band, selection-match and search-match colours are
// TRANSLUCENT, so here the walk continues to the first OPAQUE ancestor and every translucent layer
// on the way is composited source-over in sRGB, bottom to top:
//
//     out = top.rgb * top.a + under.rgb * (1 - top.a)        (per channel, 0..255, non-linear)
//
// which is what both engines do for a plain `background-color` stack. Two things the DOM walk
// cannot see are added by hand, and named in each row's `how`:
//   • THE SELECTION is not an ancestor of the text. CodeMirror draws it in `.cm-selectionLayer`,
//     a sibling of `.cm-content` painted BEHIND it inside `.cm-scroller`'s stacking context. A row
//     for selected text inserts the selection's colour beneath every layer that lives inside
//     `.cm-content` and above every layer outside it.
//   • A GRADIENT (`.cm-button`) has no single colour. Each colour stop is measured as its own
//     opaque background and the row reports the WORST stop.
// A foreground with alpha, or under an `opacity` below 1, is composited over its own backdrop
// before the ratio is taken. A "band against the pane" row (non-text) composites the band over
// what is behind it and compares the result with what is behind it.
//
// ══ THE ROUTE, AND THE HARNESS (proxy 5) ═══════════════════════════════════════════════════════
//
// Proxies 1–3 go through `createReaderPane(document).select(file)` — production's call site 1,
// `editorRender.browser.test.ts`'s own route — so the control and the view are the ones
// `enhanceEditor` installed there. Proxy 4 loads the real `entrypoints/app/main.ts`
// (`exportShortcut.browser.test.ts`'s `loadMain()` route) and opens its document through that
// module's dev-only `__peekover` handle.
//
// Both engines run this file in the vitest browser harness page — NOT a loaded extension. An
// extension cannot be loaded into Firefox by the driver (plan §5), and the harness page is not
// `chrome-extension://…/app.html`: fonts, the extension CSP, the real settings store and the
// browser's own handling of Ctrl+S / Ctrl+F at the chrome level are all outside what is measured
// here. Those are the human's, at 7.1.
//
// ══ EVERY FIXTURE ASSERTS IT IS UNWATCHED (tasks.md, group 3's rule) ═══════════════════════════
//
// As in `editorRender`: no active `data-watch`, no registered watch target, nothing watching.
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ═══════════════════════════════════════════════════════════
//
// Files run serially on one `document`. `main.ts` installs a document-level keydown listener that
// nothing removes, and earlier files leave theirs behind — each bound to its own app. So proxy 4
// never reads an absolute count: reactions are `reactionsTo()`'s per-dispatch delta on a
// `preventDefault` spy, and "an export ran" is matched by SPECIFIC CONTENT — a blob whose text
// carries this file's own fixture heading — never "some blob was minted". The theme setting, the
// viewport, the settings seam and the watch registries are restored after every test.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { createReaderPane } from '../../src/app/readerPane';
import { toggleEdit } from '../../src/render/editorEnhancer';
import {
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  editorSessionFor,
  teardownEditorShell,
} from '../../src/render/editorView';
import {
  getWatchTarget,
  isWatching,
  resetWatchRegistryForTest,
  watchAvailable,
} from '../../src/watch/watchRegistry';
import { WATCH_HOST_ATTR, resetWatchControlsForTest } from '../../src/watch/watchControl';
import { setThemeSetting } from '../../src/theme/reader';
import { THEME_CONTROL_CLASS } from '../../src/theme/themeControl';
import { currentSettings, resetSettingsSeamForTest, saveSettings } from '../../src/settings/settingsSeam';
import {
  type RGBA,
  type Backdrop,
  WHITE,
  parseColor,
  over,
  flatten,
  contrastRatio,
  hex,
  backdropOf,
  effectiveOpacity,
  gradientStops,
} from './helpers/contrast';

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

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
/** CodeMirror's `Mod` and `main.ts`'s `ctrlKey || metaKey`: Meta on a mac-like run, else Control. */
const MAC_LIKE = /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = MAC_LIKE ? 'Meta' : 'Control';

/** One measurement, as one greppable line. `progress.md`'s tables are built from these. */
const record = (proxy: string, row: Record<string, unknown>): void =>
  console.log(`EYEBALL ${JSON.stringify({ engine: ENGINE, proxy, ...row })}`);

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 };

const TEXT_BAR = 4.5; // WCAG 2.1 AA, 1.4.3
const NON_TEXT_BAR = 3; // WCAG 2.1 AA, 1.4.11

const cleanup: HTMLElement[] = [];

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest(); // reset WITH the registry, always — see its doc comment
  resetSettingsSeamForTest(); // a stored tocOpen from an earlier file would pin the rail's state
});

afterEach(async () => {
  for (const el of cleanup.splice(0)) {
    el.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    teardownEditorShell(el);
    el.remove();
  }
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetSettingsSeamForTest();
  setThemeSetting('auto');
  await page.viewport(NARROW.width, NARROW.height);
});

/** Group 3's precondition, asserted — not assumed — on every fixture. */
function expectUnwatched(host: HTMLElement): void {
  expect(host.getAttribute(WATCH_HOST_ATTR), 'the host carries no active data-watch').not.toBe(
    'active',
  );
  expect(getWatchTarget(), 'no watch target is registered').toBeNull();
  expect(watchAvailable()).toBe(false);
  expect(isWatching()).toBe(false);
}

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 15000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

/** `waitFor` for a surface that may honestly never open: `null` instead of a throw. */
async function maybe<T>(fn: () => T | null | undefined | false, ms = 4000): Promise<T | null> {
  try {
    return await waitFor(fn, 'optional surface', ms);
  } catch {
    return null;
  }
}

const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

/** Production call site 1: the reader pane selects a file. Returns the mounted host. */
async function openInPane(text: string): Promise<HTMLElement> {
  const pane = createReaderPane(document);
  document.body.prepend(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => text });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('the reader pane produced no mounted host');
  expectUnwatched(host);
  return host;
}

/** By CLASS ALONE — a tag-qualified selector could not then be asked what tag it found. */
const inHost = (host: HTMLElement, cls: string): HTMLElement | null =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${cls}`);
const modeIs = (host: HTMLElement, mode: string) => (): boolean =>
  host.getAttribute('data-mode') === mode;

/** KEEPS: each proxy's own property (C164, C166, C167). RE-SPELLED at 4.3: edit is entered by
 *  `toggleEdit` — what the toolbar's Edit segment calls (D-6); this pane harness has no toolbar. */
async function enterEdit(host: HTMLElement): Promise<void> {
  void toggleEdit(host);
  await waitFor(modeIs(host, 'edit'), 'data-mode="edit"');
  await frames();
}

/** The focused element, drilled through every open shadow root. */
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/** The innermost element at a point, drilling through every open shadow root on the way. */
function deepElementAt(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

async function focusEditor(host: HTMLElement): Promise<void> {
  editorSessionFor(host)!.view.focus();
  await waitFor(() => deepActiveElement()?.closest('.cm-content'), 'focus in the editor content');
}

const chord = (key: string): string => `{${MOD}>}${key}{/${MOD}}`;

// ── Colour arithmetic ────────────────────────────────────────────────────────────────────────

// The colour arithmetic and the backdrop walk live in the shared helper (013 task 2.2, D-16):
// tests/browser/helpers/contrast.ts — moved there unchanged; this file's assertions are unchanged.

interface ContrastRow {
  theme: string;
  surface: string;
  pair: string;
  kind: 'text' | 'non-text';
  fg: string;
  bg: string;
  how: string;
  ratio: number;
  bar: number;
  pass: boolean;
}

function row(
  theme: string,
  surface: string,
  pair: string,
  kind: 'text' | 'non-text',
  fg: RGBA,
  backdrop: Backdrop,
  note = '',
): ContrastRow {
  const bg = flatten(backdrop.layers);
  const drawn = over(fg, bg);
  const ratio = Number(contrastRatio(drawn, bg).toFixed(2));
  const bar = kind === 'text' ? TEXT_BAR : NON_TEXT_BAR;
  const out: ContrastRow = {
    theme,
    surface,
    pair,
    kind,
    fg: hex(fg) + (fg[3] < 1 ? ` -> ${hex(drawn)}` : ''),
    bg: hex(bg),
    how: backdrop.how + (note ? ` · ${note}` : ''),
    ratio,
    bar,
    pass: ratio >= bar,
  };
  record('contrast', { ...out });
  return out;
}

/** The text colour an element draws with, its own and its ancestors' `opacity` folded in. */
const inkOf = (el: Element): RGBA => {
  const c = parseColor(getComputedStyle(el).color);
  return [c[0], c[1], c[2], c[3] * effectiveOpacity(el)];
};

// ── 0 · The instrument ───────────────────────────────────────────────────────────────────────

describe('3.2 eyeball proxies — the instrument itself', () => {
  it('the contrast arithmetic reads known pairs correctly, and compositing is source-over', () => {
    const black: RGBA = [0, 0, 0, 1];
    expect(contrastRatio(black, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5);
    // #767676 on white is the textbook 4.54:1 — the smallest grey that clears AA for text.
    expect(Number(contrastRatio([0x76, 0x76, 0x76, 1], WHITE).toFixed(2))).toBe(4.54);
    // Half-black over white is mid-grey; a translucent layer read as OPAQUE would be black.
    expect(over([0, 0, 0, 0.5], WHITE)).toEqual([127.5, 127.5, 127.5, 1]);
    expect(flatten([WHITE, [0, 0, 0, 0.5], [255, 0, 0, 0.5]])).toEqual([191.25, 63.75, 63.75, 1]);
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3, 1]);
    expect(parseColor('rgba(1, 2, 3, 0.25)')).toEqual([1, 2, 3, 0.25]);
    expect(parseColor('rgb(1 2 3 / 50%)')).toEqual([1, 2, 3, 0.5]);
    expect(parseColor('color(srgb 1 0 0.5 / 0.5)')).toEqual([255, 0, 127.5, 0.5]);
    expect(() => parseColor('oklch(0.5 0.1 20)')).toThrow();
  });

  it('the backdrop walk composites a translucent layer over the opaque one behind it', () => {
    const outer = document.createElement('div');
    outer.style.background = 'rgb(0, 0, 0)';
    const band = document.createElement('div');
    band.style.background = 'rgba(255, 255, 255, 0.5)';
    const leaf = document.createElement('span');
    leaf.textContent = 'x';
    band.append(leaf);
    outer.append(band);
    document.body.append(outer);
    try {
      expect(flatten(backdropOf(leaf).layers)).toEqual([127.5, 127.5, 127.5, 1]);
      // skipSelf: the band against what is BEHIND it is plain black.
      expect(flatten(backdropOf(band, { skipSelf: true }).layers)).toEqual([0, 0, 0, 1]);
    } finally {
      outer.remove();
    }
  });
});

// ── 1 · Contrast of CodeMirror's own surfaces ────────────────────────────────────────────────

// Line 1 heading · 3 body · 5 heading · 7 body · 8 empty (the last line, where `<` is typed).
const CONTRAST_DOC = '# Sample document\n\nBody text for the eyeball.\n\n## Second heading\n\nMore body text.\n';
const BODY_LINE = 3;
const FAR_LINE = 7;

const lineEl = (host: HTMLElement, n: number): HTMLElement =>
  host.shadowRoot!.querySelectorAll<HTMLElement>('.cm-content .cm-line')[n - 1];

const lineStart = (doc: string, n: number): number =>
  doc.split('\n').slice(0, n - 1).reduce((sum, l) => sum + l.length + 1, 0);

/** E-2 (3.4): the text pairs the 3.2 sweep found below AA on dark. Asserted on BOTH themes — light
 *  passed before the fix and is the control arm that must not have been traded away for dark. */
const E2_PAIRS = [
  'selection (focused) — selected text on the selection',
  'selection (unfocused) — selected text on the selection',
  'search match (selected) — the current match’s text on its colour',
  'autocomplete — an option’s text on the tooltip',
] as const;

/** Text pairs that cleared AA on both themes at 3.2 and sit on or beside a surface 3.4 restyled:
 *  the fix must not have cost any of them. */
const E2_NEIGHBOURS = [
  'content — body text on the pane',
  'active line — body text on the band',
  'search match — matched text on the match colour',
  'autocomplete — the SELECTED option’s text on its band',
] as const;

describe('3.2 eyeball proxy 1 — contrast of CodeMirror’s own surfaces, light (control) and dark', () => {
  it.each(['light', 'dark'] as const)(
    '%s: every pair is MEASURED and recorded against the stated bar; E-2’s pairs are ASSERTED at AA (3.4)',
    async (theme) => {
      await page.viewport(WIDE.width, WIDE.height);
      setThemeSetting(theme);
      const host = await openInPane(CONTRAST_DOC);
      expect(host.getAttribute('data-theme'), 'the effective theme is really on the host').toBe(theme);
      await enterEdit(host);
      const shadow = host.shadowRoot!;
      const { view } = editorSessionFor(host)!;
      const slot = inHost(host, EDITOR_SOURCE_CLASS)!;
      const pane = backdropOf(slot);
      expect(pane.layers.length, 'the pane itself is one opaque colour').toBe(1);
      const rows: ContrastRow[] = [];
      const opened: Record<string, boolean> = {};

      // ── content, active line, gutter, caret — the cursor parked on a body line ──────────────
      view.dispatch({ selection: { anchor: lineStart(CONTRAST_DOC, BODY_LINE) } });
      await focusEditor(host);
      await frames();

      const far = lineEl(host, FAR_LINE);
      expect(far.textContent).toBe('More body text.');
      expect(far.classList.contains('cm-activeLine'), 'the far line is not the active one').toBe(false);
      rows.push(row(theme, 'content', 'body text on the pane', 'text', inkOf(far), backdropOf(far)));

      const active = lineEl(host, BODY_LINE);
      expect(active.classList.contains('cm-activeLine'), 'the cursor line carries the active band').toBe(true);
      const band = parseColor(getComputedStyle(active).backgroundColor);
      rows.push(
        row(theme, 'active line', 'the band against the pane', 'non-text', band, backdropOf(active, { skipSelf: true })),
        row(theme, 'active line', 'body text on the band', 'text', inkOf(active), backdropOf(active)),
      );

      const numbers = [...shadow.querySelectorAll<HTMLElement>('.cm-lineNumbers .cm-gutterElement')].filter(
        (el) => /^\d+$/.test(el.textContent ?? '') && el.getBoundingClientRect().height > 0,
      );
      const plainNumber = numbers.find((el) => !el.classList.contains('cm-activeLineGutter'));
      const activeNumber = numbers.find((el) => el.classList.contains('cm-activeLineGutter'));
      opened['gutter'] = !!plainNumber && !!activeNumber;
      if (plainNumber) {
        rows.push(row(theme, 'gutter', 'line number on the gutter', 'text', inkOf(plainNumber), backdropOf(plainNumber)));
      }
      if (activeNumber) {
        rows.push(
          row(theme, 'gutter', 'ACTIVE line number on its band', 'text', inkOf(activeNumber), backdropOf(activeNumber)),
          row(
            theme,
            'gutter',
            'the active-number band against the gutter',
            'non-text',
            parseColor(getComputedStyle(activeNumber).backgroundColor),
            backdropOf(activeNumber, { skipSelf: true }),
          ),
        );
      }
      const gutters = shadow.querySelector<HTMLElement>('.cm-gutters');
      if (gutters) {
        rows.push(
          row(
            theme,
            'gutter',
            'the gutter rule (border-right) against the pane',
            'non-text',
            parseColor(getComputedStyle(gutters).borderRightColor),
            backdropOf(gutters),
          ),
        );
      }

      const cursor = await maybe(() => shadow.querySelector<HTMLElement>('.cm-cursor'));
      opened['caret'] = !!cursor;
      if (cursor) {
        // The drawn caret sits on the active line, so the band is behind it.
        rows.push(
          row(
            theme,
            'caret',
            'the drawn caret (.cm-cursor border-left) on the active line',
            'non-text',
            parseColor(getComputedStyle(cursor).borderLeftColor),
            backdropOf(active),
            `native caret-color: ${getComputedStyle(shadow.querySelector('.cm-content')!).caretColor}`,
          ),
        );
      }

      // ── the selection — made with real keys ────────────────────────────────────────────────
      await userEvent.keyboard('{Shift>}{End}{/Shift}');
      await frames();
      const sel = view.state.selection.main;
      expect(view.state.sliceDoc(sel.from, sel.to), 'a real selection of the body line').toBe(
        'Body text for the eyeball.',
      );
      const selectionRect = await maybe(() => shadow.querySelector<HTMLElement>('.cm-selectionBackground'));
      opened['selection'] = !!selectionRect;
      if (selectionRect) {
        const focused = parseColor(getComputedStyle(selectionRect).backgroundColor);
        rows.push(
          row(theme, 'selection (focused)', 'the selection against the pane', 'non-text', focused, pane),
          row(
            theme,
            'selection (focused)',
            'selected text on the selection',
            'text',
            inkOf(active),
            backdropOf(active, { behindContent: [['.cm-selectionBackground', focused]] }),
          ),
        );
        // The editor loses focus the moment the search panel takes it, so the unfocused
        // selection colour is on screen whenever a search has found something.
        (deepActiveElement() as HTMLElement | null)?.blur();
        await frames();
        const blurredRect = shadow.querySelector<HTMLElement>('.cm-selectionBackground');
        if (blurredRect) {
          const blurred = parseColor(getComputedStyle(blurredRect).backgroundColor);
          rows.push(
            row(theme, 'selection (unfocused)', 'the selection against the pane', 'non-text', blurred, pane),
            row(
              theme,
              'selection (unfocused)',
              'selected text on the selection',
              'text',
              inkOf(lineEl(host, BODY_LINE)),
              backdropOf(lineEl(host, BODY_LINE), { behindContent: [['.cm-selectionBackground', blurred]] }),
            ),
          );
        }
      }

      // ── the search panel — opened with a REAL Mod-F; `@codemirror/search` is never imported ──
      view.dispatch({ selection: { anchor: 0 } });
      await focusEditor(host);
      await userEvent.keyboard(chord('f'));
      const panel = await maybe(() => shadow.querySelector<HTMLElement>('.cm-panels .cm-search'));
      opened['search panel'] = !!panel;
      if (panel) {
        const panels = shadow.querySelector<HTMLElement>('.cm-panels')!;
        rows.push(
          row(
            theme,
            'search panel',
            'the panel against the pane',
            'non-text',
            parseColor(getComputedStyle(panels).backgroundColor),
            pane,
          ),
          row(
            theme,
            'search panel',
            'the panel’s top rule against the pane',
            'non-text',
            parseColor(getComputedStyle(panels).borderTopColor),
            pane,
          ),
        );
        const label = panel.querySelector<HTMLElement>('label');
        if (label) rows.push(row(theme, 'search panel', 'label text on the panel', 'text', inkOf(label), backdropOf(label)));
        const field = panel.querySelector<HTMLElement>('.cm-textfield');
        if (field) {
          rows.push(
            row(theme, 'search panel', 'typed text in the field', 'text', inkOf(field), backdropOf(field)),
            row(
              theme,
              'search panel',
              'the field’s border against the panel',
              'non-text',
              parseColor(getComputedStyle(field).borderTopColor),
              backdropOf(field, { skipSelf: true }),
            ),
            row(
              theme,
              'search panel',
              'the field’s fill against the panel',
              'non-text',
              parseColor(getComputedStyle(field).backgroundColor),
              backdropOf(field, { skipSelf: true }),
            ),
          );
        }
        const button = panel.querySelector<HTMLElement>('.cm-button');
        if (button) {
          const stops = gradientStops(button);
          const ink = inkOf(button);
          if (stops.length) {
            // Worst stop: each is measured as its own opaque background.
            const worst = stops
              .map((stop) => ({ stop, ratio: contrastRatio(over(ink, over(stop, WHITE)), over(stop, WHITE)) }))
              .sort((a, b) => a.ratio - b.ratio)[0];
            rows.push(
              row(
                theme,
                'search panel',
                'button text on its gradient (worst stop)',
                'text',
                ink,
                { layers: [over(worst.stop, WHITE)], how: `.cm-button gradient ${stops.map(hex).join(' → ')}` },
              ),
            );
          } else {
            rows.push(row(theme, 'search panel', 'button text on the button', 'text', ink, backdropOf(button)));
          }
        }
        const close = panel.querySelector<HTMLElement>('[name="close"]');
        if (close) rows.push(row(theme, 'search panel', 'the close ×', 'text', inkOf(close), backdropOf(close)));

        // A query, typed into the field the panel focused, then Enter to select the first match.
        expect(deepActiveElement()?.closest('.cm-search'), 'Mod-F put focus in the panel').not.toBeNull();
        await userEvent.keyboard('body');
        const match = await maybe(() => shadow.querySelector<HTMLElement>('.cm-content .cm-searchMatch'));
        opened['search match'] = !!match;
        await userEvent.keyboard('{Enter}');
        await frames();
        const plainMatch = shadow.querySelector<HTMLElement>('.cm-content .cm-searchMatch:not(.cm-searchMatch-selected)');
        if (plainMatch) {
          rows.push(row(theme, 'search match', 'matched text on the match colour', 'text', inkOf(plainMatch), backdropOf(plainMatch)));
        }
        const selectedMatch = shadow.querySelector<HTMLElement>('.cm-content .cm-searchMatch-selected');
        opened['search match (selected)'] = !!selectedMatch;
        if (selectedMatch) {
          const behind = shadow.querySelector<HTMLElement>('.cm-selectionBackground');
          const behindContent = behind
            ? [['.cm-selectionBackground', parseColor(getComputedStyle(behind).backgroundColor)] as const]
            : [];
          rows.push(
            row(
              theme,
              'search match (selected)',
              'the current match’s text on its colour',
              'text',
              inkOf(selectedMatch),
              backdropOf(selectedMatch, { behindContent }),
            ),
          );
        }
        await userEvent.keyboard('{Escape}');
        await frames();
      }

      // ── the autocomplete tooltip — `<` on the empty last line is completeHTMLTags ───────────
      view.dispatch({ selection: { anchor: view.state.doc.length } });
      await focusEditor(host);
      await userEvent.keyboard('<');
      const tooltip = await maybe(() => shadow.querySelector<HTMLElement>('.cm-tooltip-autocomplete'));
      opened['autocomplete'] = !!tooltip;
      if (tooltip) {
        const tooltipBg = parseColor(getComputedStyle(tooltip).backgroundColor);
        rows.push(
          row(theme, 'autocomplete', 'the tooltip against the pane', 'non-text', tooltipBg, pane),
          row(
            theme,
            'autocomplete',
            'the tooltip’s border against the pane',
            'non-text',
            parseColor(getComputedStyle(tooltip).borderTopColor),
            pane,
          ),
        );
        const options = [...tooltip.querySelectorAll<HTMLElement>('li')];
        const chosen = options.find((li) => li.getAttribute('aria-selected') === 'true');
        const other = options.find((li) => li.getAttribute('aria-selected') !== 'true');
        const labelOf = (li: HTMLElement): HTMLElement => li.querySelector<HTMLElement>('.cm-completionLabel') ?? li;
        if (other) {
          rows.push(row(theme, 'autocomplete', 'an option’s text on the tooltip', 'text', inkOf(labelOf(other)), backdropOf(labelOf(other))));
        }
        if (chosen) {
          rows.push(
            row(theme, 'autocomplete', 'the SELECTED option’s text on its band', 'text', inkOf(labelOf(chosen)), backdropOf(labelOf(chosen))),
            row(
              theme,
              'autocomplete',
              'the selected band against the tooltip',
              'non-text',
              parseColor(getComputedStyle(chosen).backgroundColor),
              backdropOf(chosen, { skipSelf: true }),
            ),
          );
        }
        await userEvent.keyboard('{Escape}');
      }

      record('contrast-surfaces', { theme, opened });
      record('contrast-summary', {
        theme,
        measured: rows.length,
        belowBar: rows.filter((r) => !r.pass).map((r) => `${r.surface} — ${r.pair}: ${r.ratio}:1 (bar ${r.bar}:1)`),
      });
      // Non-vacuity only: the sweep saw the editor. Which pairs clear the bar is the REPORT.
      expect(rows.length, 'the sweep measured the always-present surfaces').toBeGreaterThanOrEqual(6);
      expect(rows.every((r) => Number.isFinite(r.ratio) && r.ratio >= 1)).toBe(true);

      // ── E-2, ASSERTED (3.4) ────────────────────────────────────────────────────────────────
      const measured = new Map(rows.map((r) => [`${r.surface} — ${r.pair}`, r]));
      for (const pairs of [E2_PAIRS, E2_NEIGHBOURS]) {
        // Measured FIRST: a surface that never opened has no row, and no row is not a pass.
        expect(pairs.filter((name) => !measured.has(name)), `${theme}: pairs the sweep did not reach`).toEqual([]);
      }
      const below = (pairs: readonly string[]): string[] =>
        pairs.filter((name) => measured.get(name)!.ratio < TEXT_BAR).map((name) => `${name}: ${measured.get(name)!.ratio}:1`);
      expect(below(E2_PAIRS), `${theme}: E-2 pairs below AA (text ${TEXT_BAR}:1)`).toEqual([]);
      expect(below(E2_NEIGHBOURS), `${theme}: pairs that passed at 3.2 and no longer do`).toEqual([]);
      expectUnwatched(host);
    },
  );
});

// ── 2 · Collisions at the top-right ──────────────────────────────────────────────────────────
//
// WHAT IS ASSERTED, AND WHAT IS REPORTED. The rail (`.peekover-toc`) is a positioned box with an
// opaque paper fill and a 56px (open) / 52px (collapsed) top padding that exists precisely so the
// top-right pills can sit OVER it: the mode pill has always been inside the rail's box. So a
// rect intersection between a pill-family control and the rail's BOX is the design, not a
// collision, and it is reported in px beside the mode pill's own identical figure as its
// precedent. What IS asserted — a covered or covering control being the defect this proxy is for:
//   • reading: a hit-test at the TOC handle's centre returns the handle (the check that shows a
//     covered control; the mode pill it was paired with is gone from the app page since 4.5);
//   • edit: at these widths the rail and its handle are hidden (R29(c)), and the split pane keeps
//     its size.
// RETIRED (C165, in part): every pair with the EDIT CONTROL in it — 013 task 4.3 (D-6) removed the
// shadow-root control; Edit is the toolbar's segment, outside the reader. RETIRED at 013 task 4.5 (C165,
// the rest of the census's retirement): every clause with the MODE PILL in it — the pill × handle pair,
// the pill's hit-test and the pill's reported overlaps; the app page mounts its reader with
// `pills: false`, so there is no pill (Read / Raw are the toolbar's). KEPT: the handle's own hit-test,
// the hidden rail and handle in edit, and the split's size.
// Every violation is collected and recorded before the one assertion, so a first red cannot hide
// a second.
//
// ★ E-1 — THE ONE FINDING THIS PROXY PINNED IS FIXED, AND ITS PIN IS DELETED (3.4). In EDIT with
// the rail COLLAPSED the TOC handle sat over the split pane's top-right corner — 103×26px at both
// viewports on both engines: the collapsed rail puts its handle at 52–82px, and EDITOR_CSS started
// the pane at 56px, reserving the rail's width only while the rail is OPEN. A human ruling
// (2026-10-05) pinned that one relation in that one state out of `violations` and asserted it
// STILL PRESENT, so that the fixing commit had to delete the pin. 3.4 is that commit: the pane now
// starts below the collapsed handle, and `split pane × handle` is asserted like every other pair,
// in every state.

const COLLISION_DOC = '# Sample document\n\nBody text.\n\n## Second heading\n\nMore body.\n\n### Third\n\nEnd.\n';

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
};
const fmt = (b: Box): string =>
  `${Math.round(b.left)},${Math.round(b.top)} → ${Math.round(b.right)},${Math.round(b.bottom)}`;
/** Intersection in px, `null` when the boxes are disjoint (touching edges are disjoint). */
const overlapPx = (a: Box, b: Box): { w: number; h: number } | null => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0.5 && h > 0.5 ? { w: Number(w.toFixed(1)), h: Number(h.toFixed(1)) } : null;
};
const px = (o: { w: number; h: number } | null): string => (o ? `${o.w}×${o.h}px` : 'none');
const hitAtCentre = (el: Element): Element | null => {
  const r = el.getBoundingClientRect();
  return deepElementAt(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
};

async function setRail(host: HTMLElement, state: 'open' | 'collapsed'): Promise<void> {
  await frames(); // the rail's own width-derived first-frame decision lands before it is driven
  if (host.getAttribute('data-toc') !== state) inHost(host, 'peekover-toc__toggle')!.click();
  await frames();
  expect(host.getAttribute('data-toc'), `the rail is ${state}`).toBe(state);
}

describe('3.2 eyeball proxy 2 — nothing collides at the top-right', () => {
  const CASES = [
    ['NARROW', 'open', NARROW],
    ['NARROW', 'collapsed', NARROW],
    ['WIDE', 'open', WIDE],
    ['WIDE', 'collapsed', WIDE],
  ] as const;

  it.each(CASES)('%s, rail %s: reading mode, then edit mode', async (name, rail, size) => {
    await page.viewport(size.width, size.height);
    const host = await openInPane(COLLISION_DOC);
    const viewport = `${name} ${size.width}x${size.height}`;
    const handle = inHost(host, 'peekover-toc__toggle')!;
    const railEl = inHost(host, 'peekover-toc')!;
    expect(inHost(host, 'peekover-mode-toggle'), 'the app page builds no mode pill (4.5)').toBeNull();
    expect(inHost(host, THEME_CONTROL_CLASS), 'nor a theme pill').toBeNull();
    expect(handle, 'a document with three headings has a rail').not.toBeNull();
    await setRail(host, rail);
    const violations: string[] = [];

    // ── reading ───────────────────────────────────────────────────────────────────────────────
    expect(host.getAttribute('data-mode')).toBe('reading');
    const reading = {
      handle: boxOf(handle),
      rail: boxOf(railEl),
    };
    const readingHits = {
      handle: hitAtCentre(handle) === handle,
    };
    for (const [who, hit] of Object.entries(readingHits)) {
      if (!hit) violations.push(`reading: the ${who}'s centre does not hit the ${who}`);
    }
    record('collision', {
      viewport,
      rail,
      mode: 'reading',
      rects: { handle: fmt(reading.handle), rail: fmt(reading.rail) },
      hitTests: readingHits,
    });

    // ── edit ──────────────────────────────────────────────────────────────────────────────────
    await enterEdit(host);
    const shellEl = inHost(host, EDITOR_SHELL_CLASS)!;
    const edit = {
      handle: boxOf(handle),
      rail: boxOf(railEl),
      shell: boxOf(shellEl),
    };
    // R29(c) (012 7.1-walk polish): at <= 1400px wide the rail is hidden while editing, so the rail
    // and its handle are ABSENT here (this test's two viewports are 414 and 1400).
    const hidden = (b: Box): boolean => b.right - b.left === 0 && b.bottom - b.top === 0;
    if (!hidden(edit.rail)) violations.push(`edit: the rail is still laid out (${fmt(edit.rail)}) at ${size.width}px`);
    if (!hidden(edit.handle)) violations.push(`edit: the rail handle is still laid out (${fmt(edit.handle)}) at ${size.width}px`);
    const paneClearance = Number((edit.rail.left - edit.shell.right).toFixed(1));
    const sourcePane = inHost(host, EDITOR_SOURCE_CLASS)!;
    record('collision', {
      viewport,
      rail,
      mode: 'edit',
      rects: { handle: fmt(edit.handle), rail: fmt(edit.rail), shell: fmt(edit.shell) },
      paneRightToRailLeft: `${paneClearance}px`,
      paneTopToHandleBottom: `${Number((edit.shell.top - edit.handle.bottom).toFixed(1))}px`,
      reported: {
        'split pane × collapsed rail BOX': rail === 'collapsed' ? px(overlapPx(edit.shell, edit.rail)) : 'n/a (open)',
        'split pane size': `${Math.round(edit.shell.right - edit.shell.left)}×${Math.round(edit.shell.bottom - edit.shell.top)}px`,
        'source pane width': `${Math.round(sourcePane.getBoundingClientRect().width)}px`,
      },
    });
    record('collision-summary', { viewport, rail, violations });

    expect(violations, `${viewport}, rail ${rail}: overlaps or covered controls`).toEqual([]);
    // The clearance is not bought by shrinking the pane to nothing.
    expect(edit.shell.bottom - edit.shell.top, 'the split pane still has its height').toBeGreaterThan(300);
    expect(edit.shell.right - edit.shell.left, 'the split pane still has a width').toBeGreaterThan(90);
    expectUnwatched(host);
  });
});

// ── 3 · GFM and R1's dialect, as drawn ───────────────────────────────────────────────────────

const DIALECT_LINES = [
  '# Heading control',
  '',
  '- [ ] task',
  '- [x] done task',
  '',
  '| a | b |',
  '|---|---|',
  '| 1 | 2 |',
  '',
  '~~struck~~ after',
  '',
  'H~2~O water',
  '',
  'x^2^ squared',
  '',
  'smile :smile: emoji',
  '',
  'plain control line',
] as const;
const DIALECT_DOC = `${DIALECT_LINES.join('\n')}\n`;

interface DrawnSpan {
  text: string;
  /** The span's own computed colour, as `#rrggbb`. */
  ink: string;
  differs: Record<string, string>;
  contrast: number;
}

/** What a design token computes to on `host`, as `#rrggbb` — read off a probe that draws in it,
 *  so the answer is whatever the theme attribute on the host makes of the token right now. */
function tokenColour(host: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  host.shadowRoot!.append(probe);
  try {
    return hex(parseColor(getComputedStyle(probe).color));
  } finally {
    probe.remove();
  }
}

/** The highlight-styled spans of one drawn line: each span's text and every watched property on
 *  which it differs from the line it sits in. A span that differs in nothing is still listed —
 *  it received a class — with `differs: {}`. */
function drawnSpans(line: HTMLElement): DrawnSpan[] {
  const base = getComputedStyle(line);
  const watched = ['color', 'fontWeight', 'fontStyle', 'textDecorationLine', 'backgroundColor', 'verticalAlign', 'fontSize'] as const;
  return [...line.querySelectorAll<HTMLElement>('span')].map((span) => {
    const cs = getComputedStyle(span);
    const differs: Record<string, string> = {};
    for (const prop of watched) {
      // A span's own background is transparent unless it sets one; the line's may be the band.
      const lineValue = prop === 'backgroundColor' ? 'rgba(0, 0, 0, 0)' : base[prop];
      if (cs[prop] !== lineValue) differs[prop] = cs[prop];
    }
    const backdrop = backdropOf(span);
    const bg = flatten(backdrop.layers);
    return {
      text: span.textContent ?? '',
      ink: hex(parseColor(cs.color)),
      differs,
      contrast: Number(contrastRatio(over(inkOf(span), bg), bg).toFixed(2)),
    };
  });
}

describe('3.2 eyeball proxy 3 — GFM and R1’s dialect, as drawn', () => {
  it.each(['light', 'dark'] as const)(
    '%s: which ranges receive a highlight-styled span, and its computed style; E-3’s colours are ASSERTED tokens at AA (3.4)',
    async (theme) => {
      await page.viewport(WIDE.width, WIDE.height);
      setThemeSetting(theme);
      const host = await openInPane(DIALECT_DOC);
      expect(host.getAttribute('data-theme')).toBe(theme);
      await enterEdit(host);
      const { view } = editorSessionFor(host)!;
      // Park the cursor on the last (empty) line so no fixture line carries the active band.
      view.dispatch({ selection: { anchor: view.state.doc.length } });
      await frames();

      const lines = [...host.shadowRoot!.querySelectorAll<HTMLElement>('.cm-content .cm-line')];
      expect(lines.map((l) => l.textContent).slice(0, DIALECT_LINES.length)).toEqual([...DIALECT_LINES]);
      const pane = flatten(backdropOf(lines[0]).layers);
      const byLine = new Map<string, DrawnSpan[]>();
      DIALECT_LINES.forEach((source, i) => {
        if (!source) return;
        const spans = drawnSpans(lines[i]);
        byLine.set(source, spans);
        record('dialect', {
          theme,
          line: source,
          lineColor: hex(parseColor(getComputedStyle(lines[i]).color)),
          pane: hex(pane),
          spans: spans.map((s) => ({
            text: s.text,
            style: Object.fromEntries(
              Object.entries(s.differs).map(([k, v]) => [k, /^rgb/.test(v) ? hex(parseColor(v)) : v]),
            ),
            contrastOnPane: s.contrast,
          })),
        });
      });

      // The instrument fires and stays silent where it should — the R1 lines are NOT asserted.
      expect(byLine.get('# Heading control')!.length, 'a heading is highlighted (the instrument fires)').toBeGreaterThan(0);
      expect(byLine.get('plain control line'), 'plain prose gets no styled span (the instrument is silent)').toEqual([]);

      // ── E-3, ASSERTED (3.4) ────────────────────────────────────────────────────────────────
      const drawn = [...byLine.entries()].flatMap(([line, spans]) => spans.map((span) => ({ line, ...span })));
      expect(drawn.length, 'the sweep saw the dialect’s spans').toBeGreaterThan(20);
      expect(
        drawn
          .filter((s) => s.contrast < TEXT_BAR)
          .map((s) => `${JSON.stringify(s.text)} in ${JSON.stringify(s.line)}: ${s.ink}, ${s.contrast}:1`),
        `${theme}: highlight-styled spans below AA (text ${TEXT_BAR}:1) on the pane`,
      ).toEqual([]);

      // And the colours ARE the tokens, whatever the theme makes of them — the three ranges the
      // 3.2 sweep named: a task marker, the table's pipes, the emoji shortcode.
      const muted = tokenColour(host, '--muted');
      const ink = tokenColour(host, '--ink');
      expect(muted, 'the two tokens are told apart').not.toBe(ink);
      const inkOfSpan = (line: string, text: string): string[] =>
        byLine.get(line)!.filter((s) => s.text === text).map((s) => s.ink);
      expect(inkOfSpan('- [ ] task', '[ ]'), 'the task marker draws in --muted').toEqual([muted]);
      expect(inkOfSpan('| a | b |', '|'), 'every pipe of the header row draws in --muted').toEqual([muted, muted, muted]);
      expect(inkOfSpan('smile :smile: emoji', ':smile:'), 'the emoji shortcode draws in --ink').toEqual([ink]);
      // No span anywhere draws in a colour that is neither token.
      expect([...new Set(drawn.map((s) => s.ink))].filter((c) => c !== muted && c !== ink)).toEqual([]);

      // ── REPORTED, not asserted (human ruling, 2026-10-06): a --muted mark on the ACTIVE line.
      // The band is CodeMirror's own default and stays so; this is a 7.1 walk item.
      const taskLine = DIALECT_LINES.indexOf('- [ ] task');
      view.dispatch({ selection: { anchor: lineStart(DIALECT_DOC, taskLine + 1) } });
      await focusEditor(host);
      await frames();
      const onBand = [...host.shadowRoot!.querySelectorAll<HTMLElement>('.cm-content .cm-line')][taskLine];
      expect(onBand.classList.contains('cm-activeLine'), 'the task line now carries the active band').toBe(true);
      const marker = drawnSpans(onBand).find((s) => s.text === '[ ]');
      record('active-band', {
        theme,
        pair: 'a --muted mark on the active-line band',
        ink: marker?.ink,
        ratio: marker?.contrast,
        bar: TEXT_BAR,
        pass: (marker?.contrast ?? 0) >= TEXT_BAR,
      });
      expect(marker, 'the marker was measured on the band').toBeDefined();
      expectUnwatched(host);
    },
  );
});

// ── 4 · The Ctrl/Cmd+S hazard, observed ──────────────────────────────────────────────────────

const SHORTCUT_H1 = 'Eyeball Ctrl-S fixture 3.2';
const SHORTCUT_DOC = `# ${SHORTCUT_H1}\n\nOn-disk body.\n\n## Second heading\n\nMore body.\n`;
const BUFFER_MARK = 'UNSAVEDBUFFERMARK';

function preventDefaultSpy(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(KeyboardEvent.prototype, 'preventDefault');
}

/** `exportShortcut.browser.test.ts`'s dispatch, with `composed` so a key dispatched INSIDE a
 *  shadow root crosses it the way a real key does (retargeted to the host at `document`). */
function dispatchModS(target: EventTarget, opts: { meta?: boolean } = {}): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: !opts.meta,
      metaKey: !!opts.meta,
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
  );
}

/** That file's `reactionsTo`: how many `preventDefault()` calls THIS ONE dispatch produced. */
function reactionsTo(spy: ReturnType<typeof vi.spyOn>, target: EventTarget, opts: { meta?: boolean } = {}): number {
  spy.mockClear();
  dispatchModS(target, opts);
  return spy.mock.calls.length;
}

let importSeq = 0;
/** That file's `loadMain`: a fresh top-level evaluation of the real entrypoint. */
async function loadMain(): Promise<void> {
  importSeq += 1;
  await import(/* @vite-ignore */ `../../entrypoints/app/main.ts?eyeballProxyTest=${importSeq}`);
}

interface DevApp {
  selectFile(file: { name: string; read: () => Promise<string> } | null): Promise<void>;
}

describe('3.2 eyeball proxy 4 — Ctrl/Cmd+S with focus in the editor, OBSERVED (nothing asserted about what it should do)', () => {
  it('with main.ts’s listener installed: does the export shortcut react, and does an export dispatch — lastExportFormat "html" and null', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const appRoot = document.createElement('div');
    appRoot.id = 'app';
    document.body.appendChild(appRoot);
    cleanup.push(appRoot);
    const input = document.createElement('input');
    document.body.appendChild(input);
    cleanup.push(input);

    await loadMain();
    // main.ts hands its controller to a dev-only global (`import.meta.env.DEV`); it is the one
    // way to open a document in THE app whose `triggerLastExport` that listener calls.
    const app = (globalThis as unknown as { __peekover?: DevApp }).__peekover;
    expect(app, 'main.ts exposed its dev handle in the harness').toBeDefined();
    await app!.selectFile({ name: 'eyeball-ctrl-s.md', read: async () => SHORTCUT_DOC });
    const host = await waitFor(
      () => appRoot.querySelector<HTMLElement>('.peekover-app__reader__host'),
      'main.ts’s app rendered the fixture',
    );
    // Let the app's own settings load publish before this test pins the format (the race
    // exportShortcut's HTML test documents), then drop the sink so nothing here is persisted.
    await new Promise<void>((r) => setTimeout(r, 400));
    resetSettingsSeamForTest();
    expectUnwatched(host);

    await enterEdit(host);
    const { view } = editorSessionFor(host)!;
    view.dispatch({ selection: { anchor: view.state.doc.length } });
    await focusEditor(host);
    await userEvent.keyboard(BUFFER_MARK);
    expect(view.state.doc.toString().endsWith(BUFFER_MARK), 'the buffer now differs from the file').toBe(true);
    const content = host.shadowRoot!.querySelector<HTMLElement>('.cm-content')!;
    expect(deepActiveElement()?.closest('.cm-content'), 'focus is inside CodeMirror’s content').toBe(content);
    expect(content.isContentEditable, 'the content IS editable — the guard’s own test').toBe(true);

    const spy = preventDefaultSpy();
    const minted: Blob[] = [];
    const realCreate = URL.createObjectURL.bind(URL);
    const blobSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      if (obj instanceof Blob) minted.push(obj);
      return realCreate(obj);
    });
    /** Exports of THIS fixture since the last call — matched by content, never by count alone. */
    const drainExports = async (): Promise<Array<{ carriesBufferMark: boolean; carriesEditorMarkup: boolean; bytes: number }>> => {
      const texts = await Promise.all(minted.splice(0).map((b) => b.text()));
      return texts
        .filter((t) => t.includes(SHORTCUT_H1))
        .map((t) => ({
          carriesBufferMark: t.includes(BUFFER_MARK),
          carriesEditorMarkup: t.includes('cm-editor') || t.includes(EDITOR_SHELL_CLASS),
          bytes: t.length,
        }));
    };

    try {
      // ── dispatched keys: where the guard does and does not engage ──────────────────────────
      saveSettings({ lastExportFormat: null }); // no export while the guard is being located
      const atDocument = reactionsTo(spy, document);
      const atInput = reactionsTo(spy, input);
      const atContent = reactionsTo(spy, content);
      const atContentMeta = reactionsTo(spy, content, { meta: true });
      expect(atDocument, 'firing control: the freshly installed listener reacts at document').toBeGreaterThan(0);
      expect(atInput, 'firing control: the guard holds for a light-DOM input').toBe(0);
      await drainExports();
      record('ctrl-s', {
        arm: 'dispatched',
        reactions: { atDocument, atLightDomInput: atInput, atEditorContent: atContent, atEditorContentMeta: atContentMeta },
        note: 'reactions = preventDefault() calls for that one dispatch, across every installed listener',
      });

      // ── the REAL key, focus in the editor ──────────────────────────────────────────────────
      // Sent only if the dispatched key showed the listener reacting: a real Mod-S that nothing
      // prevents opens the browser's own Save dialog, which a headless run cannot dismiss.
      if (atContent === 0) {
        record('ctrl-s', { arm: 'real key', sent: false, why: 'the guard engaged on the dispatched key; a real key would reach the native dialog' });
      } else {
        for (const format of ['html', null] as const) {
          await focusEditor(host);
          saveSettings({ lastExportFormat: format });
          spy.mockClear();
          await userEvent.keyboard(chord('s'));
          await frames();
          const reactions = spy.mock.calls.length;
          const formatAfter = currentSettings().lastExportFormat;
          const exports = await drainExports();
          record('ctrl-s', {
            arm: 'real key',
            sent: true,
            key: `${MOD}+S`,
            lastExportFormat: format,
            lastExportFormatAfter: formatAfter,
            preventDefaultCalls: reactions,
            exportsOfThisDocument: exports.length,
            exports,
            modeAfter: host.getAttribute('data-mode'),
            bufferIntact: view.state.doc.toString().endsWith(BUFFER_MARK),
          });
        }

        // ── the same key through exportShortcut's own instrument: the real download ────────────
        // Armed only now that an export is known to dispatch — an armed listener nothing
        // satisfies rejects server-side after 30s with no one awaiting it.
        saveSettings({ lastExportFormat: 'html' });
        await focusEditor(host);
        spy.mockClear();
        await userEvent.keyboard(chord('s'));
        await frames();
        const probe = (await drainExports()).length > 0;
        if (probe) {
          await focusEditor(host);
          await commands.armExportDownload();
          await userEvent.keyboard(chord('s'));
          const download = await commands.collectExportDownload();
          record('ctrl-s', {
            arm: 'real key → real download',
            suggestedFilename: download.suggestedFilename,
            h1Text: download.h1Text,
            isThisDocument: download.h1Text === SHORTCUT_H1,
            carriesBufferMark: download.html.includes(BUFFER_MARK),
            carriesEditorMarkup: download.html.includes('cm-editor') || download.html.includes(EDITOR_SHELL_CLASS),
            consoleErrors: download.consoleErrors,
          });
        } else {
          record('ctrl-s', { arm: 'real key → real download', armed: false, why: 'no export of this document dispatched on the probe press' });
        }
      }
      expect(host.getAttribute('data-mode'), 'the editor is still open').toBe('edit');
    } finally {
      spy.mockRestore();
      blobSpy.mockRestore();
    }
  });
});
