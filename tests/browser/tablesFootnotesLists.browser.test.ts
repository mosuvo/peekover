// The second user report (from X, 2026-11-11): the human's `tests/fixtures/tables-footnotes-lists.md`, used as-is,
// pinned as a regression AS RENDERED NOW, both engines: the tag structure of each section, then each point the human
// checked against GFM, named:
//   • an unescaped `|` inside code still splits the cell, and a cell past the header's count is dropped;
//   • an escaped `\|` stays in one cell (in code, in text, in bold);
//   • a fence line ends a table; the next pipe rows start a new one;
//   • `<br>` in a cell is kept (the sanitizer allows it);
//   • the 5-level list, including the 4-space indent under "10.";
//   • ordered numbering comes from the first item only ("10." does not renumber; no `start`, no `value`);
//   • footnotes are LITERAL TEXT: Peekover has no footnote syntax yet.
// ★ UPDATE WHEN FOOTNOTES SHIP (`progress.md` § Carried items, POST-RELEASE, "Footnotes"): the footnote case below,
//   and the §1 / §4 paragraphs in EXPECTED, pin today's literal text and must change with that work.
// The table copy over this fixture is `tablePipeCopy.browser.test.ts`.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fixture from '../fixtures/tables-footnotes-lists.md?raw';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { parse } from '../../src/render/parse';
import { sanitize } from '../../src/render/sanitize';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

async function until<T>(fn: () => T | null | undefined | false, what: string, ms = 10000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > end) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** A compact tag tree: one line per element, indented by depth; headings carry their text in quotes. */
function shape(root: ParentNode): string[] {
  const out: string[] = [];
  const walk = (el: Element, depth: number) => {
    const tag = el.tagName.toLowerCase();
    const text = /^h[1-6]$/.test(tag) ? ` "${(el.textContent ?? '').trim()}"` : '';
    const lang = tag === 'code' && el.className ? ` .${el.className}` : '';
    out.push(`${'  '.repeat(depth)}${tag}${lang}${text}`);
    for (const c of el.children) walk(c, depth + 1);
  };
  for (const c of (root as Element).children) walk(c, 0);
  return out;
}

/** The fixture's sanitized HTML (what both surfaces are built from), inert. */
function rendered(): DocumentFragment {
  const t = document.createElement('template');
  t.innerHTML = sanitize(parse(fixture));
  return t.content;
}

/** The fixture cut into its sections (`## n.` headings). */
function sections(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  let key = '(title)';
  const box: Element[] = [];
  const flush = () => {
    const frag = document.createElement('div');
    for (const el of box) frag.append(el.cloneNode(true));
    out[key] = shape(frag);
    box.length = 0;
  };
  for (const el of [...rendered().children]) {
    if (el.tagName === 'H2' && /^\d\./.test(el.textContent ?? '')) {
      flush();
      key = (el.textContent ?? '').trim();
    }
    box.push(el);
  }
  flush();
  return out;
}

const row = (...cells: string[]) => ['    tr', ...cells];
const td = '      td';

const EXPECTED: Record<string, string[]> = {
  '(title)': ['h1 "Tables, footnotes and deep lists"', 'p'],
  '1. Pipes in tables': [
    'h2 "1. Pipes in tables"',
    'p',
    'p', // "[^early]: …" — literal text (footnotes)
    'table', '  thead', '    tr', '      th', '      th', '      th', '  tbody',
    ...row(td, td, td),
    ...row(td, td, '        code', td),
    ...row(td, td, td),
    ...row(td, td, td),
    ...row(td, td, '        strong', td),
    ...row(td, td, td),
    'p',
  ],
  '2. Fenced code inside a table cell': [
    'h2 "2. Fenced code inside a table cell"',
    'p',
    'table', '  thead', '    tr', '      th', '      th', '  tbody',
    ...row(td, td, '        code'),
    ...row(td, td),
    'pre', '  code .language-js',
    'table', '  thead', '    tr', '      th', '      th', '  tbody',
    ...row(td, td),
    'p',
    'table', '  thead', '    tr', '      th', '      th', '  tbody',
    ...row(td, '        br', td, '        code'),
  ],
  '3. A 5-level list mixing ordered and unordered': [
    'h2 "3. A 5-level list mixing ordered and unordered"',
    'ol',
    '  li',
    '    ul',
    '      li',
    '        ol',
    '          li',
    '            ul',
    '              li',
    '                blockquote',
    '                  p',
    '                  ol',
    '                    li',
    '                    li',
    '                  pre',
    '                    code .language-python',
    '              li',
    '          li',
    '      li',
    '  li',
    '    ul',
    '      li',
    '        ol',
    '          li',
    '            ul',
    '              li',
    '                ul',
    '                  li',
    'blockquote',
    '  ol',
    '    li',
    '      ul',
    '        li',
    '          blockquote',
    '            p',
    '            ul',
    '              li',
  ],
  '4. Late footnote definition': ['h2 "4. Late footnote definition"', 'p', 'p'],
};

const text = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const cells = (table: Element) =>
  [...table.querySelectorAll('tr')].map((r) => [...r.querySelectorAll('th,td')].map(text));

// ── The two surfaces ─────────────────────────────────────────────────────────────────────────

const store = { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined } as AppStore;

async function appPage(): Promise<ShadowRoot> {
  const container = document.createElement('div');
  container.style.cssText = 'width:1300px;height:900px';
  document.body.appendChild(container);
  const file = { path: 'tables-footnotes-lists.md', name: 'tables-footnotes-lists.md', read: async () => fixture };
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [file] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
  await app.openFolder();
  (await until(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'tree item')).click();
  const host = await until(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'reader host');
  await until(() => host.shadowRoot?.querySelector('.peekover-reader table'), 'render');
  return host.shadowRoot!;
}

async function tabSurface(): Promise<ShadowRoot> {
  const pre = document.createElement('pre');
  pre.textContent = fixture;
  document.body.appendChild(pre);
  runReader({ isRenderable: () => true });
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  await until(() => host.shadowRoot?.querySelector('.peekover-reader table'), 'render');
  return host.shadowRoot!;
}

function reset(): void {
  removeHideStyle();
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  document.body.replaceChildren();
}
beforeEach(reset);
afterEach(reset);

// ── The cases ────────────────────────────────────────────────────────────────────────────────

describe('the tables-footnotes-lists fixture, pinned as rendered now (second user report)', () => {
  it('the tag structure of each section', () => {
    expect(sections()).toEqual(EXPECTED);
  });

  it('§1: an unescaped | in code splits the cell and drops the extra; an escaped \\| stays in one cell', () => {
    const [first] = rendered().querySelectorAll('table');
    expect(cells(first)).toEqual([
      ['Case', 'Cell', 'Note'],
      ['Unescaped pipe in code', '`a', 'b`'],
      ['Escaped pipe in code', 'a|b', 'Shows as `a'],
      ['Escaped pipe in text', 'left | right', 'One cell, literal pipe'],
      ['Footnote in a cell', 'see this[^early]', 'Superscript link'],
      ['Bold and pipe', 'x | y', 'Bold, literal pipe'],
      ['Empty cell', '', 'Third cell still here'],
    ]);
    // The dropped text is nowhere in the table: GFM discards a cell past the header's count.
    expect(text(first)).not.toContain('GFM splits here');
    expect(text(first)).not.toContain('in one cell');
    // The escaped pipe in code is ONE code element holding the pipe.
    expect(text(first.querySelector('code'))).toBe('a|b');
    expect(text(first.querySelector('strong'))).toBe('x | y');
  });

  it('§2: a fence line ends the table; the pipe rows after it are a new table', () => {
    const frag = rendered();
    const tables = [...frag.querySelectorAll('table')];
    expect(tables).toHaveLength(4);
    expect(cells(tables[1])).toEqual([['Language', 'Example'], ['JS', 'const x = 1;'], ['Shell', '`echo "a']]);
    const fence = tables[1].nextElementSibling!;
    expect(fence.tagName).toBe('PRE');
    expect(text(fence)).toContain('const afterTable = true;');
    expect(fence.nextElementSibling).toBe(tables[2]);
    expect(cells(tables[2])).toEqual([['Back', 'to a table?'], ['yes', 'a new table starts here']]);
  });

  it('§3: ordered numbering comes from the first item only, and "10." nests with a 4-space indent', () => {
    const frag = rendered();
    const top = [...frag.children].find((el) => el.tagName === 'OL')!;
    expect(top.hasAttribute('start'), 'the list starts at 1: no start attribute').toBe(false);
    const items = [...top.children];
    expect(items).toHaveLength(2);
    expect(items.some((li) => li.hasAttribute('value')), '"10." does not renumber its item').toBe(false);
    expect(text(items[1]).startsWith('Level 1 jumps to 10')).toBe(true);
    // Under "10.": ul > li > ol > li > ul > li > ul > li "Level 5" — five levels from the top item.
    const level5 = items[1].querySelector(':scope > ul > li > ol > li > ul > li > ul > li');
    expect(text(level5)).toBe('Level 5');
    // Level 3 continues as item 2 of its own list, with no value of its own.
    const level3 = items[0].querySelector(':scope > ul > li > ol')!;
    expect(level3.hasAttribute('start')).toBe(false);
    expect([...level3.children].map((li) => li.firstChild?.textContent?.trim())).toEqual([
      'Level 3, ordered',
      'Level 3 continues as "2."',
    ]);
  });

  // ★ UPDATE WHEN FOOTNOTES SHIP: this case pins today's literal text, not the wanted behaviour.
  it('footnotes are literal text for now: no references, no notes section', () => {
    const frag = rendered();
    const all = text(frag as unknown as Element);
    expect(all).toContain('[^early]: This footnote is defined before its reference.');
    expect(all).toContain('see this[^early]');
    expect(all).toContain('A second reference to the same footnote[^early], and a normal one[^late].');
    expect(all).toContain('[^late]: This footnote is defined after its reference, at the bottom.');
    expect(frag.querySelector('sup, section.footnotes, .footnotes, a[href^="#fn"]')).toBeNull();
  });

  for (const surface of ['app page', 'tab'] as const) {
    it(`${surface}: no fallback banner; four tables with tools; <br> kept in its cell; footnotes literal`, async () => {
      const shadow = surface === 'app page' ? await appPage() : await tabSurface();
      expect(shadow.querySelector('.peekover-reader'), 'the reading column rendered').not.toBeNull();
      expect(shadow.querySelector('.peekover-fallback, .peekover-error-banner, [data-state="fallback"]'), 'no fallback banner').toBeNull();
      const tables = [...shadow.querySelectorAll('.peekover-reader table')];
      expect(tables).toHaveLength(4);
      expect(shadow.querySelectorAll('.peekover-table-tools').length, 'a toolbar per table').toBe(4);
      const brCell = tables[3].querySelector('tbody td')!;
      expect(brCell.querySelector('br'), '<br> survives the sanitizer, on the page').not.toBeNull();
      expect([...brCell.childNodes].map((n) => n.nodeName)).toEqual(['#text', 'BR', '#text']);
      const reader = text(shadow.querySelector('.peekover-reader'));
      expect(reader).toContain('see this[^early]');
      expect(shadow.querySelector('.peekover-reader :is(sup, .footnotes, a[href^="#fn"])')).toBeNull();
    }, 30000);
  }
});
