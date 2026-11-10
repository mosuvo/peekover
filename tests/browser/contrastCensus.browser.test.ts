// THE CONTRAST CENSUS (013 task 2.2; plan D-16; gate-2 G-4, G-5; gate-3 Q4, Q5) — Chromium and Firefox.
//
// On every covered surface, in light and dark, every visible element that carries its own text is
// measured: its computed text colour (alpha and ancestor opacity folded in) over the background
// actually painted behind it (helpers/contrast.ts: the backdrop walk, translucent layers composited
// source-over). The bar is WCAG 2.1 AA 1.4.3 — 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
//
// SCOPE (tasks.md 2.2): the content-script reader (a file:// fixture — watching, the agent badge, a
// blocked image — and a raw-host fixture; from 013 task 5.6 also the network used, the Raw view and the
// render-failure banner), the app shell, the reader pane (code highlighted, math
// rendered), the editor, the three panels (Stored data, Export, the code-theme picker), the
// unsaved-changes dialog and (013 task 5.4) the Compare picker with a snapshot, the diff view and the diagram
// lightbox, and (5.5) every app state. NOT measured here: SVG text (diagram labels — diagramTheme.browser.test.ts
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
// failure not on it is a red, and a row on it that no longer fails is a red too ("remove it"). By 8.1
// every row is fixed or accepted by name. It is separate from the M12 accepted list. EMPTY since
// 013 task 5.8: its 8 rows (the old default code theme's comments) were resolved by the Peekover
// code theme, now the default; the fixture's code blocks carry every token kind it paints.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from '../../src/app/folderSource';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetCodeThemeControlsForTest } from '../../src/theme/codeThemeControl';
import { registerWatchTarget, resetWatchRegistryForTest, type WatchTarget } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_HOST_ATTR, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { getDiffContext, resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { storeSnapshot } from '../../src/app/snapshots';
import { clearDiagramCache, eraseSnapshots } from '../../src/app/store';
import { editorSessionFor } from '../../src/render/editorView';
import { mountOnboarding, type OnboardingDeps } from '../../src/app/onboarding';
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

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C098); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

/** A segment of the app page's toolbar (013 task 4.3, D-6: Edit is the toolbar's segment). */
const segmentFor = (host: Element | null | undefined, mode: 'reading' | 'edit' | 'raw'): HTMLButtonElement | null =>
  host?.closest('.peekover-app')?.querySelector<HTMLButtonElement>(`.peekover-toolbar__seg [data-mode="${mode}"]`) ?? null;
/** KEEPS: each test's own property here (C097). RE-SPELLED at 4.3: the removed shadow-root control's
 *  toggle is the toolbar's segment — Edit to enter, Read to leave (these sessions are entered from
 *  Read, so the exit lands where the control's did; a dirty Read is guarded, ruling E). */
const segmentToggle = (host: HTMLElement): HTMLElement =>
  segmentFor(host, host.getAttribute('data-mode') === 'edit' ? 'reading' : 'edit')!;

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
  // 013 task 5.8: every token kind the code theme paints, in each shipped language — keywords,
  // comments, strings, numbers and constants, types and attributes, functions and tags, default text.
  '```javascript',
  "import { render } from './reader.js';",
  'export class Doc extends Base { greet(name) { return `Hi ${name}`.repeat(2) || null; } }',
  '```',
  '',
  '```python',
  '# count headings',
  'def count(lines: list[str]) -> int:',
  '    return sum(1 for l in lines if l.startswith("#")) or None',
  '```',
  '',
  '```json',
  '{ "name": "peekover", "private": true, "files": 42 }',
  '```',
  '',
  '```html',
  '<!-- one article --><article class="doc" lang="en">Hi &amp; bye</article>',
  '```',
  '',
  '```css',
  '/* the column */ .doc { max-width: 68ch; font-family: "Literata", serif; color: #fff !important; }',
  '```',
  '',
  '```bash',
  '# build',
  'for b in chrome firefox; do pnpm exec wxt build -b "$b" --retries 3; done',
  '```',
  '',
  // 013 task 5.11: a sample of each new grammar, so the census measures the scopes the theme now
  // maps for them — TypeScript types, YAML and TOML keys, a Markdown heading, a diff's +/- lines,
  // SQL keywords — on both themes and every code surface.
  '```typescript',
  'interface Doc { size: number } // a type',
  '```',
  '',
  '```tsx',
  'const el = <Note title="x">hi</Note>;',
  '```',
  '',
  '```yaml',
  'name: peekover # a key',
  'files: 42',
  '```',
  '',
  '```toml',
  '[package]',
  'name = "peekover"',
  '```',
  '',
  '```markdown',
  '# A heading',
  '```',
  '',
  '```diff',
  '-old line',
  '+new line',
  '```',
  '',
  '```sql',
  'SELECT name FROM docs WHERE size > 42;',
  '```',
  '',
  '$$',
  'E = mc^2',
  '$$',
  '',
  '![a blocked image](https://example.invalid/a.png)',
  '',
].join('\n');

/** 013 task 5.4: a document with one diagram, for the lightbox. */
const DIAGRAM_DOC = '# Diagram\n\n```mermaid\ngraph LR; Raw-->Peekover-->Reading;\n```\n';

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
 * THE PENDING LIST (gate-3 Q4) — `engine · surface · theme · selector`. EMPTY: its 8 rows (the old default code
 * theme's comment colour, #6a737d on #24292e, 3.05:1 — app page and editor, light and dark, both engines) were
 * resolved by task 5.8 (decisions.md "M13 RULING — the Peekover code theme"; "M13 TASK 5.8"). It may only shrink,
 * so a failure anywhere is now a red.
 */
const PENDING: ReadonlySet<string> = new Set<string>([]);

/** 013 task 5.8: every Peekover code-token colour as painted — `surface · theme · token` → its lowest ratio. */
const codeTokens = new Map<string, { fg: string; bg: string; ratio: number }>();
const PEEKOVER_TOKENS = ['--accent', '--code-num', '--code-str', '--code-type', '--ink', '--muted'];

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
    const token = el instanceof HTMLElement && el.closest('pre.shiki') ? /^var\((--[a-z0-9-]+)\)$/.exec(el.style.color)?.[1] : undefined;
    if (token) {
      const k = `${surface} · ${theme} · ${token}`;
      const prior = codeTokens.get(k);
      if (!prior || ratio < prior.ratio) codeTokens.set(k, { fg: hex(drawn), bg: hex(bg), ratio: Number(ratio.toFixed(2)) });
    }
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
/** The census's OWN settings (013 task 4.5, carried addendum). The app shell loads settings as it mounts and
 *  APPLIES them (`setThemeSetting(resolved.theme)`) whenever that load resolves. Without a `getSettings` of its own
 *  the census got the defaults' theme, "auto", which landed AFTER the test had set "light" or "dark" — a theme
 *  change that can re-render the code block while the census reads it, so a pending code-comment row measured as
 *  passing on Firefox, depending on timing and file order. The load now answers the test's own theme and the
 *  default code theme, so applying it changes nothing; it saves nothing, so it leaves nothing behind. */
let censusTheme: Theme = 'light';
const store = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, theme: censusTheme }),
  putSettings: async () => undefined,
});

async function appPage(theme: Theme, persistable = false): Promise<{ container: HTMLElement; host: HTMLElement }> {
  censusTheme = theme;
  const container = freshHost();
  const source: FolderSource = { name: 'docs', truncated: false, persistable, files: [mem('CLAUDE.md', DOC), mem('other.md', '# Other\n\nText.\n')] };
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

    // 013 task 5.6: the tab reader's states the fixtures above do not reach — the load bar used (the network
    // indicator lit, the watch pill at rest), the user's Raw view, and the render-failure banner.
    it(`content-script reader, network used and the Raw view — ${theme}`, async () => {
      registerWatchTarget(watchTarget());
      const host = freshHost();
      mount(DOC, host);
      await themed(host, theme);
      host.shadowRoot!.querySelector<HTMLElement>('.peekover-remote-load')!.click();
      await waitFor(() => host.getAttribute('data-network') === 'active', 'the network indicator lit');
      await sleep(250);
      census(host, 'tab reader (network used)', theme);
      host.shadowRoot!.querySelector<HTMLElement>('.peekover-mode-toggle')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'raw', 'the Raw view');
      await sleep(250);
      census(host, 'tab reader (Raw view)', theme);
    });

    it(`content-script reader, the render-failure banner — ${theme}`, async () => {
      const host = freshHost();
      const root = host.attachShadow({ mode: 'open' });
      const commit = ShadowRoot.prototype.replaceChildren;
      root.replaceChildren = function forced(this: ShadowRoot, ...nodes: (Node | string)[]): void {
        if (nodes.some((n) => n instanceof Element && n.classList.contains('peekover-reader'))) throw new Error('forced render failure');
        commit.apply(this, nodes);
      };
      const warn = console.warn;
      console.warn = () => undefined;
      try {
        mount(DOC, host);
      } finally {
        console.warn = warn;
      }
      await themed(host, theme);
      await waitFor(() => host.shadowRoot!.querySelector('.peekover-alert'), 'the banner');
      census(host, 'tab reader (render failure)', theme);
    });

    it(`app shell and reader pane — ${theme}`, async () => {
      // The theme is set BEFORE the page mounts: a theme change after it can re-render the code block,
      // and a census read mid-swap misses its tokens.
      setThemeSetting(theme);
      const { container, host } = await appPage(theme);
      await themed(host, theme);
      census(container, 'app page', theme);
    });

    it(`the three panels — ${theme}`, async () => {
      // The theme is set BEFORE the page mounts: a theme change after it can re-render the code block,
      // and a census read mid-swap misses its tokens.
      setThemeSetting(theme);
      const { container, host } = await appPage(theme);
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
      const { container, host } = await appPage(theme);
      await themed(host, theme);
      segmentToggle(host).click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = await waitFor(() => editorSessionFor(host), 'the edit session');
      await sleep(200);
      census(host, 'editor', theme);
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' typed' } });
      segmentToggle(host).click();
      const dialog = await waitFor(() => container.querySelector<HTMLElement>('.peekover-unsaved'), 'the unsaved dialog');
      census(dialog, 'unsaved-changes dialog', theme);
    });

    // 013 task 5.7: the editor's save bar in the two states the case above does not reach — a save RUNNING (Save reads
    // "Saving…"; measured in the click's own task, before the save's first await) and a save's OUTCOME in the status
    // line (the download route; the anchor's click is swallowed, nothing leaves the page).
    it(`the editor's save bar: saving, and a save's outcome — ${theme}`, async () => {
      setThemeSetting(theme);
      const { host } = await appPage(theme);
      await themed(host, theme);
      segmentToggle(host).click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = await waitFor(() => editorSessionFor(host), 'the edit session');
      await sleep(200);
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: ' typed' } });
      const bar = host.shadowRoot!.querySelector<HTMLElement>('.peekover-editor__bar')!;
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      try {
        bar.querySelector<HTMLButtonElement>('.peekover-editor__save')!.click();
        census(bar, 'editor save bar (saving)', theme);
        await waitFor(() => !bar.querySelector<HTMLElement>('.peekover-editor__status')!.hidden, 'the status line');
        census(bar, 'editor save bar (a save’s outcome)', theme);
      } finally {
        click.mockRestore();
      }
    });

    // 013 task 5.4: the Compare picker open with a seeded snapshot (diffChrome's way: the production capture
    // function, the docId the app page registered — the folder is persistable so it registers one), then the diff
    // view that snapshot opens. The snapshot differs in a heading and in the paragraph with the link, so the diff
    // holds removed, added and unchanged hunks, a link in each changed kind.
    it(`the Compare picker and the diff view — ${theme}`, async () => {
      setThemeSetting(theme);
      const { container, host } = await appPage(theme, true);
      await themed(host, theme);
      try {
        const ctx = await waitFor(() => getDiffContext(), 'the diff context');
        await storeSnapshot(ctx.docId, DOC.replace('## Heading two', '## Heading 2').replace('A paragraph with a [link]', 'An older paragraph with a [link]'));
        for (let i = 0; i < 100 && (await ctx.fetchMeta()).length === 0; i += 1) await sleep(20);
        container.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-diff-affordance')!.click();
        const row = await waitFor(() => container.querySelector<HTMLButtonElement>('.peekover-toolbar .peekover-diff-picker:not([hidden]) [data-target-kind="snapshot"]'), 'a snapshot row');
        census(container.querySelector<HTMLElement>('.peekover-toolbar__drop')!, 'Compare picker', theme);
        row.click();
        const diff = await waitFor(() => host.getAttribute('data-diff') === 'active' && host.shadowRoot!.querySelector<HTMLElement>('.peekover-diff'), 'the diff view');
        await waitFor(() => diff.querySelector('.diff-added') && diff.querySelector('.diff-removed'), 'added and removed hunks');
        census(diff, 'diff view', theme);
      } finally {
        await eraseSnapshots();
      }
    });

    // 013 task 5.4: the diagram lightbox, open (the production mermaid load, as its own tests run it).
    it(`the diagram lightbox — ${theme}`, async () => {
      censusTheme = theme;
      setThemeSetting(theme);
      const container = freshHost();
      const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [mem('diagram.md', DIAGRAM_DOC)] };
      const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: store() });
      try {
        await app.openFolder();
        (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the tree item')).click();
        const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
        await themed(host, theme);
        const open = await waitFor(() => host.shadowRoot?.querySelector<HTMLButtonElement>('.peekover-diagram[data-diagram="rendered"] .peekover-diagram-open'), 'a rendered diagram', 1500);
        open.click();
        const box = await waitFor(() => host.shadowRoot!.querySelector<HTMLElement>('.peekover-diagram-lightbox'), 'the lightbox');
        await sleep(250);
        census(box, 'diagram lightbox', theme);
      } finally {
        await clearDiagramCache();
      }
    }, 60_000);

    // 013 task 5.5: every app state the census did not measure — the first run (no folder: the setup card in the body),
    // the idle notices (cancelled, could not open, access denied; 5.6 removed `unsupported`, which nothing produced), a folder with no markdown files, a
    // search with no match, a folder too large to list, a folder open with no file chosen, an empty file and an
    // unreadable file. Each is its own surface; the read-only-snapshot note is already in "app page" (persistable false).
    it(`the app states — ${theme}`, async () => {
      censusTheme = theme;
      setThemeSetting(theme);
      const memFile = (name: string, read: () => Promise<string>): MarkdownFile => ({ path: name, name, read });
      const folder = (over: Partial<FolderSource> = {}): FolderSource => ({
        name: 'docs', truncated: false, persistable: true, files: [mem('alpha.md', '# Alpha\n\nText.\n')], ...over,
      });
      const STATES: Array<{ name: string; outcome: OpenFolderOutcome | null; then?: (c: HTMLElement) => Promise<void>; root: string }> = [
        { name: 'first run', outcome: null, root: '.peekover-app__start' },
        { name: 'cancelled', outcome: { ok: false, reason: 'cancelled', message: 'No folder was opened.' }, root: '.peekover-app__start' },
        { name: 'could not open', outcome: { ok: false, reason: 'error', message: 'Could not open that folder. Please try again.' }, root: '.peekover-app__start' },
        { name: 'access denied', outcome: { ok: false, reason: 'denied', message: 'Access to this folder wasn’t granted. Click it again to re-allow it.' }, root: '.peekover-app__start' },
        { name: 'empty folder', outcome: { ok: true, source: folder({ files: [] }) }, root: '.peekover-app__body' },
        { name: 'too large', outcome: { ok: true, source: folder({ truncated: true }) }, root: '.peekover-app__body' },
        {
          name: 'no match',
          outcome: { ok: true, source: folder() },
          then: async (c) => {
            const search = await waitFor(() => c.querySelector<HTMLInputElement>('.peekover-tree__search'), 'the search');
            search.value = 'zzz';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            await waitFor(() => c.querySelector('[data-state="no-matches"]'), 'no matches');
          },
          root: '.peekover-app__body',
        },
        { name: 'no file chosen', outcome: { ok: true, source: folder() }, root: '.peekover-app__body' },
        {
          name: 'empty file',
          outcome: { ok: true, source: folder({ files: [memFile('blank.md', async () => '  \n')] }) },
          then: async (c) => {
            (await waitFor(() => c.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the file')).click();
            await waitFor(() => c.querySelector('[data-state="empty-file"]'), 'the empty-file state');
          },
          root: '.peekover-app__body',
        },
        {
          name: 'unreadable file',
          outcome: { ok: true, source: folder({ files: [memFile('gone.md', () => Promise.reject(new Error('gone')))] }) },
          then: async (c) => {
            (await waitFor(() => c.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the file')).click();
            await waitFor(() => c.querySelector('[data-state="unreadable"]'), 'the unreadable state');
          },
          root: '.peekover-app__body',
        },
      ];
      for (const s of STATES) {
        const container = freshHost();
        const app = mountAppShell(container, { openFolder: async () => s.outcome!, store: store() });
        await waitFor(() => container.querySelector('.peekover-app')?.getAttribute('data-theme') === theme, `${s.name}: data-theme`);
        if (s.outcome) await app.openFolder();
        await s.then?.(container);
        await sleep(300);
        census(container.querySelector<HTMLElement>(s.root)!, `state: ${s.name}`, theme);
        container.remove();
      }
    });
  }

  // 013 task 6.1: the setup guide (D-11), each detection state its own surface — on, off (with the deep link's
  // fallback showing, so its alert is measured), unknown and Firefox. Its own page and sheet, themed by its
  // own data-theme.
  for (const theme of ['light', 'dark'] as const) {
    it(`the setup guide — ${theme}`, async () => {
      const STATES: Array<[string, OnboardingDeps, boolean]> = [
        ['on', { engine: 'chromium', readFileAccess: async () => true, readSiteAccess: async () => true }, false],
        // 8.1f: site access off — the file-URL step gives way to the site step (its `file:///*` code) and the
        // raw-hosts line becomes a warning sentence.
        ['blocked', { engine: 'chromium', readFileAccess: async () => true, readSiteAccess: async () => false }, false],
        // 8.1g: with the toggle off the browser answers false for file sites, so the off state shows its conditional
        // site line (`file:///*` code) — measured here; the same state, so the count does not move.
        ['off', { engine: 'chromium', readFileAccess: async () => false, readSiteAccess: async (w) => w === 'web', openDetails: () => Promise.reject(new Error('x')) }, true],
        ['unknown', { engine: 'chromium' }, false],
        ['firefox', { engine: 'firefox' }, false],
      ];
      for (const [name, deps, clickOpen] of STATES) {
        const container = freshHost();
        const ctl = mountOnboarding(container, deps);
        ctl.element.dataset.theme = theme;
        await waitFor(() => name === 'firefox' || ctl.element.dataset.access === name, `setup guide: ${name}`);
        if (clickOpen) {
          ctl.element.querySelector<HTMLButtonElement>('.peekover-onboard__cta')!.click();
          await waitFor(() => !ctl.element.querySelector<HTMLElement>('[data-part="open-failed"]')!.hidden, 'the fallback');
        }
        await sleep(300);
        census(ctl.element, `setup guide: ${name}`, theme);
        ctl.destroy();
        container.remove();
      }
    });
  }

  it('INVENTORY: no failure off the pending list, and no pending row that now passes', () => {
    const failing = new Map(results.map((r) => [r.key, r]));
    for (const r of [...failing.values()].sort((a, b) => a.key.localeCompare(b.key))) console.log(`CENSUS ${JSON.stringify(r)}`);
    console.log(`CENSUS-COVERED ${JSON.stringify([...covered])}`);
    console.log(`CENSUS-EXEMPT ${JSON.stringify({ disabled: exempt.disabled, m12: Object.fromEntries(exempt.m12), g5: Object.fromEntries(exempt.g5) })}`);
    // Non-vacuous: every surface and theme was measured. KEEPS: every surface × theme measured (C093); RE-SPELLED at
    // 013 task 5.4 by the count alone, 16 → 22 (the Compare picker, the diff view and the lightbox added), and at 5.5,
    // 22 → 44 (eleven app states), and at 5.6, 44 → 42 (`unsupported` removed: no browser Peekover supports produces it)
    // → 48 (the tab reader's network-used, Raw-view and render-failure states), and at 5.7, 48 → 52 (the editor's save bar
    // saving, and with a save's outcome), and at 6.1, 52 → 60 (the setup guide's four states), and at 8.1f, 60 → 62
    // (the setup guide's site-access-off state).
    expect(covered.size, 'surfaces × themes measured').toBe(62);
    const unlisted = [...failing.values()].filter((r) => !PENDING.has(r.key)).map((r) => `${r.key} — "${r.text}" ${r.fg} on ${r.bg}: ${r.ratio}:1 < ${r.bar}`);
    const nowPassing = [...PENDING].filter((k) => k.startsWith(`${ENGINE} ·`) && !failing.has(k));
    expect(unlisted, 'below-AA text not on the pending list').toEqual([]);
    expect(nowPassing, 'pending rows that now pass — remove them (the list only shrinks)').toEqual([]);
  });

  it('CODE: the default (Peekover) theme paints every one of its token kinds on both code surfaces, both themes (013 5.8)', () => {
    for (const [k, v] of [...codeTokens].sort()) console.log(`CENSUS-CODE ${ENGINE} · ${k} ${v.fg} on ${v.bg}: ${v.ratio}:1`);
    for (const surface of ['app page', 'editor']) {
      for (const theme of ['light', 'dark']) {
        const painted = PEEKOVER_TOKENS.filter((t) => codeTokens.has(`${surface} · ${theme} · ${t}`));
        expect(painted, `${surface} · ${theme}: the code tokens measured`).toEqual(PEEKOVER_TOKENS);
      }
    }
    // Each is also held to the bar by the INVENTORY test above (any failure is unlisted); stated here too.
    expect([...codeTokens].filter(([, v]) => v.ratio < TEXT_BAR).map(([k, v]) => `${k}: ${v.ratio}:1`)).toEqual([]);
  });
});
