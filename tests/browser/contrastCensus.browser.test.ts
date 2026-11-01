// THE CONTRAST CENSUS (013 task 2.2; plan D-16; gate-2 G-4, G-5; gate-3 Q4, Q5) — Chromium and Firefox.
//
// On every covered surface, in light and dark, every visible element that carries its own text is
// measured: its computed text colour (alpha and ancestor opacity folded in) over the background
// actually painted behind it (helpers/contrast.ts: the backdrop walk, translucent layers composited
// source-over). The bar is WCAG 2.1 AA 1.4.3 — 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
//
// SCOPE (tasks.md 2.2): the content-script reader (a file:// fixture — watching, the agent badge, a
// blocked image — and a raw-host fixture), the app shell, the reader pane (code highlighted, math
// rendered), the editor, the three panels (Stored data, Export, the code-theme picker) and the
// unsaved-changes dialog. NOT measured here: SVG text (diagram labels — diagramTheme.browser.test.ts
// owns them), pseudo-element content (list markers, code line numbers, glyph icons), non-text UI
// boundaries (WCAG 1.4.11 — the editor eyeball proxy measures CodeMirror's), and hover/focus states.
//
// EXEMPT, BY NAME — never a silent skip:
//   • disabled controls — WCAG 1.4.3 exempts text in an inactive user-interface component;
//   • the M12 ACCEPTED list (progress.md § Carried items 7; the human, 2026-10-30): E-4 the editor's
//     gutter numbers, R12 the --muted mark on the dark active-line band, `invalid` tokens in --del.
//     (E-5 and E-9 are non-text and outside this census.) It stays separate and unchanged.
//   • G-5's decorative --faint uses, each with its reason (the human's G-5: information-bearing
//     --faint text → --muted; decorative ones listed): the file tree's twisty glyph.
//
// THE PENDING LIST (gate-3 Q4): today's remaining failures, each row named. It may only SHRINK: a
// failure not on it is a red, and a row on it that no longer fails is a red too ("remove it"). Every
// row awaits the human's 2.2 ruling (Q5: one batched question) and, by 8.1, is fixed or accepted by
// name. It is separate from the M12 accepted list.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetCodeThemeControlsForTest } from '../../src/theme/codeThemeControl';
import { registerWatchTarget, resetWatchRegistryForTest, type WatchTarget } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_HOST_ATTR, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import { editorSessionFor } from '../../src/render/editorView';
import {
  TEXT_BAR,
  LARGE_TEXT_BAR,
  backdropOf,
  hex,
  inkOf,
  isLargeText,
  nameOf,
  parentAcrossShadow,
  ratioOver,
} from './helpers/contrast';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
type Theme = 'light' | 'dark';

/** The fixture document: every markdown construct the reader styles with its own colour. */
const DOC = [
  '# Census heading one',
  '',
  'A paragraph with a [link](https://example.invalid/page), `inline code`, <mark>marked</mark> text,',
  '~~struck~~ text and **bold** and *italic*.',
  '',
  '## Heading two',
  '### Heading three',
  '#### Heading four',
  '##### Heading five',
  '###### Heading six',
  '',
  '> A blockquote line.',
  '',
  '- a bullet',
  '- [ ] a task',
  '- [x] a done task',
  '',
  '1. first',
  '2. second',
  '',
  '| Name | Value |',
  '|------|-------|',
  '| alpha | 1 |',
  '| beta | 2 |',
  '',
  '```javascript',
  'const answer = 42; // a comment',
  '```',
  '',
  '$$',
  'E = mc^2',
  '$$',
  '',
  '![a blocked image](https://example.invalid/a.png)',
  '',
].join('\n');

// ── Exemptions, by name ─────────────────────────────────────────────────────────────────────────
/** M12's accepted below-AA list (text members), matched by element. */
const M12_ACCEPTED: Array<{ id: string; matches: (el: Element) => boolean }> = [
  { id: 'E-4 (editor gutter numbers)', matches: (el) => el.closest('.cm-gutters') !== null },
  {
    id: 'R12 (--muted mark on the dark active-line band)',
    // CodeMirror's mark spans carry only generated class names, so R12 is matched by what it IS: a span
    // on the active line drawn in the host's --muted.
    matches: (el) => {
      if (!el.closest('.cm-activeLine')) return false;
      const host = (el.getRootNode() as ShadowRoot).host as HTMLElement | undefined;
      const muted = host ? getComputedStyle(host).getPropertyValue('--muted').trim() : '';
      const probe = document.createElement('i');
      probe.style.color = muted;
      document.body.append(probe);
      const mutedRgb = getComputedStyle(probe).color;
      probe.remove();
      return muted !== '' && getComputedStyle(el).color === mutedRgb;
    },
  },
  { id: '`invalid` (tokens drawn in --del)', matches: (el) => el.matches('.tok-invalid') },
];
/** G-5's decorative --faint uses (kept --faint), each with its reason. */
const G5_DECORATIVE: Array<{ selector: string; reason: string }> = [
  { selector: '.peekover-tree__twist', reason: 'the folder twisty glyph; its state is also in aria-expanded and the visible child list' },
];
/** G-5's decorative --faint uses drawn by a pseudo-element — outside this census (it reads text
 *  nodes), recorded here so the G-5 list is complete in one place. */
export const G5_DECORATIVE_PSEUDO: Array<{ rule: string; reason: string }> = [
  { rule: '.peekover-toc__toggle::before (the ☰ glyph)', reason: 'an icon; the button is named by its aria-label' },
  { rule: '.peekover-code … .line::before (code line numbers)', reason: "they repeat each line's position; the same kind as the editor gutter numbers M12 accepted (E-4)" },
];

/**
 * THE PENDING LIST (gate-3 Q4) — `engine · surface · theme · selector`. Every row is "awaiting the
 * human's 2.2 ruling". It may only shrink.
 */
const PENDING: ReadonlySet<string> = new Set<string>([
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'chromium · app page · light · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'chromium · app page · dark · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'chromium · editor · light · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'chromium · editor · dark · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'firefox · app page · light · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'firefox · app page · dark · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'firefox · editor · light · .line > span',
  // awaiting the human's 2.2 ruling — the default code theme's comment colour (#6a737d on #24292e, 3.05:1)
  'firefox · editor · dark · .line > span',
]);

// ── Measurement ─────────────────────────────────────────────────────────────────────────────────
interface Row {
  key: string;
  engine: string;
  surface: string;
  theme: Theme;
  selector: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
  bar: number;
}

/** Every element (light DOM and open shadow roots) under `root`, document order. */
function* elementsUnder(root: Element | ShadowRoot): Generator<Element> {
  // The root's OWN shadow root first (a reader host carries everything there), then its light tree.
  if (root instanceof Element && root.shadowRoot) yield* elementsUnder(root.shadowRoot);
  for (const el of root.querySelectorAll('*')) {
    yield el;
    if (el.shadowRoot) yield* elementsUnder(el.shadowRoot);
  }
}

const ownText = (el: Element): string =>
  [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? '').join('').replace(/\s+/g, ' ').trim();

function visible(el: Element): boolean {
  const rects = el.getClientRects();
  if (rects.length === 0) return false;
  const r = el.getBoundingClientRect();
  if (r.width * r.height <= 1) return false;
  for (let n: Element | null = el; n; n = parentAcrossShadow(n)) {
    const cs = getComputedStyle(n);
    if (cs.visibility !== 'visible' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
  }
  return true;
}

const selectorOf = (el: Element): string => {
  const own = nameOf(el);
  const parent = parentAcrossShadow(el);
  return parent && !el.classList.length ? `${nameOf(parent)} > ${own}` : own;
};

const exempt = { disabled: 0, m12: new Map<string, number>(), g5: new Map<string, number>() };

function measure(root: Element, surface: string, theme: Theme): Row[] {
  const rows = new Map<string, Row>();
  for (const el of elementsUnder(root)) {
    if (el.closest('svg') || el instanceof SVGElement) continue;
    const text = ownText(el);
    if (!text || !visible(el)) continue;
    if (el.closest(':disabled, [aria-disabled="true"]')) {
      exempt.disabled += 1;
      continue;
    }
    const m12 = M12_ACCEPTED.find((a) => a.matches(el));
    if (m12) {
      exempt.m12.set(m12.id, (exempt.m12.get(m12.id) ?? 0) + 1);
      continue;
    }
    const g5 = G5_DECORATIVE.find((d) => el.matches(d.selector));
    if (g5) {
      exempt.g5.set(g5.selector, (exempt.g5.get(g5.selector) ?? 0) + 1);
      continue;
    }
    const { ratio, drawn, bg } = ratioOver(inkOf(el), backdropOf(el));
    const bar = isLargeText(el) ? LARGE_TEXT_BAR : TEXT_BAR;
    if (ratio + 1e-9 >= bar) continue;
    const selector = selectorOf(el);
    const key = `${ENGINE} · ${surface} · ${theme} · ${selector}`;
    const row: Row = { key, engine: ENGINE, surface, theme, selector, text: text.slice(0, 40), fg: hex(drawn), bg: hex(bg), ratio: Number(ratio.toFixed(2)), bar };
    const prior = rows.get(key);
    if (!prior || row.ratio < prior.ratio) rows.set(key, row);
  }
  return [...rows.values()];
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}
async function themed(el: HTMLElement, theme: Theme): Promise<void> {
  setThemeSetting(theme);
  await waitFor(() => el.getAttribute('data-theme') === theme, `data-theme=${theme}`);
  // Let colour transitions (e.g. the code toolbar's 120ms) finish: a row read mid-transition measures
  // the previous theme's colour.
  await sleep(400);
}

const cleanup: HTMLElement[] = [];
function freshHost(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  return host;
}

function watchTarget(): WatchTarget {
  let on = false;
  return { start: () => void (on = true), stop: () => void (on = false), isWatching: () => on };
}

function mem(name: string, text: string): MarkdownFile {
  return { path: name, name, read: async () => text };
}
const store = (): AppStore => ({ putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined });

async function appPage(): Promise<{ container: HTMLElement; host: HTMLElement }> {
  const container = freshHost();
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [mem('CLAUDE.md', DOC), mem('other.md', '# Other\n\nText.\n')] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: store() });
  await app.openFolder();
  const item = await waitFor(() => [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find((b) => b.textContent === 'CLAUDE.md'), 'the tree item');
  item.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
  // The app page highlights code and renders math after the commit: wait for both.
  // Highlighting waits for a block to come into view: scroll each code block in, then wait.
  for (const pre of host.shadowRoot!.querySelectorAll<HTMLElement>('.peekover-code pre')) pre.scrollIntoView();
  await waitFor(() => host.shadowRoot?.querySelector('pre.shiki') && host.shadowRoot?.querySelector('math'), 'code and math enhanced', 300);
  await waitFor(() => host.shadowRoot?.querySelector('[data-code="rendered"]'), 'the code block rendered', 300);
  return { container, host };
}

const results: Row[] = [];
const covered = new Set<string>();
function census(root: Element, surface: string, theme: Theme): void {
  covered.add(`${surface} · ${theme}`);
  results.push(...measure(root, surface, theme));
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  resetCodeThemeControlsForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
  resetDiffRegistryForTest();
});
afterEach(() => {
  setThemeSetting('auto');
  for (const el of cleanup.splice(0)) el.remove();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetDocIdentityForTest();
});

describe('the contrast census (013 task 2.2, D-16)', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`content-script reader, file:// fixture (watching, agent badge, blocked image) — ${theme}`, async () => {
      registerWatchTarget(watchTarget());
      registerDocIdentity('CLAUDE.md');
      const host = freshHost();
      mount(DOC, host);
      await themed(host, theme);
      host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_CONTROL_CLASS}`)!.click();
      await waitFor(() => host.getAttribute(WATCH_HOST_ATTR) === 'active', 'watching');
      await sleep(400); // the pill's colour transition settles before it is read
      census(host, 'tab reader (file)', theme);
    });

    it(`content-script reader, raw-host fixture — ${theme}`, async () => {
      const host = freshHost();
      mount(DOC, host);
      await themed(host, theme);
      census(host, 'tab reader (raw host)', theme);
    });

    it(`app shell and reader pane — ${theme}`, async () => {
      // The theme is set BEFORE the page mounts: a theme change after it can re-render the code block,
      // and a census read mid-swap misses its tokens.
      setThemeSetting(theme);
      const { container, host } = await appPage();
      await themed(host, theme);
      census(container, 'app page', theme);
    });

    it(`the three panels — ${theme}`, async () => {
      // The theme is set BEFORE the page mounts: a theme change after it can re-render the code block,
      // and a census read mid-swap misses its tokens.
      setThemeSetting(theme);
      const { container, host } = await appPage();
      await themed(host, theme);
      for (const [name, toggle, panel] of [
        ['Stored data panel', '.peekover-app__storage-toggle', '.peekover-storage'],
        ['Export panel', '.peekover-app__export-toggle', '.peekover-export'],
        ['code-theme picker', '.peekover-code-theme-toggle', '.peekover-code-theme-picker:not([hidden])'],
      ] as const) {
        container.querySelector<HTMLButtonElement>(toggle)!.click();
        const el = await waitFor(() => container.querySelector<HTMLElement>(panel), name);
        census(el, name, theme);
        container.querySelector<HTMLButtonElement>(toggle)!.click();
        await sleep(30);
      }
    });

    it(`the editor and the unsaved-changes dialog — ${theme}`, async () => {
      // The theme is set BEFORE the page mounts: a theme change after it can re-render the code block,
      // and a census read mid-swap misses its tokens.
      setThemeSetting(theme);
      const { container, host } = await appPage();
      await themed(host, theme);
      host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = await waitFor(() => editorSessionFor(host), 'the edit session');
      await sleep(200);
      census(host, 'editor', theme);
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' typed' } });
      host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!.click();
      const dialog = await waitFor(() => container.querySelector<HTMLElement>('.peekover-unsaved'), 'the unsaved dialog');
      census(dialog, 'unsaved-changes dialog', theme);
    });
  }

  it('INVENTORY: no failure off the pending list, and no pending row that now passes', () => {
    const failing = new Map(results.map((r) => [r.key, r]));
    for (const r of [...failing.values()].sort((a, b) => a.key.localeCompare(b.key))) console.log(`CENSUS ${JSON.stringify(r)}`);
    console.log(`CENSUS-COVERED ${JSON.stringify([...covered])}`);
    console.log(`CENSUS-EXEMPT ${JSON.stringify({ disabled: exempt.disabled, m12: Object.fromEntries(exempt.m12), g5: Object.fromEntries(exempt.g5) })}`);
    // Non-vacuous: every surface and theme was measured.
    expect(covered.size, 'surfaces × themes measured').toBe(16);
    const unlisted = [...failing.values()].filter((r) => !PENDING.has(r.key)).map((r) => `${r.key} — "${r.text}" ${r.fg} on ${r.bg}: ${r.ratio}:1 < ${r.bar}`);
    const nowPassing = [...PENDING].filter((k) => k.startsWith(`${ENGINE} ·`) && !failing.has(k));
    expect(unlisted, 'below-AA text not on the pending list').toEqual([]);
    expect(nowPassing, 'pending rows that now pass — remove them (the list only shrinks)').toEqual([]);
  });
});
