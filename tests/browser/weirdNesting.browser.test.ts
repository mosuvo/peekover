// M13 walk fix 8.1k, part 3 — the human's weird-nesting fixture (`tests/fixtures/weird-nesting.md`, as-is) pinned as a
// regression, both engines: the tag structure of each section AS RENDERED NOW, no fallback banner, the contents list
// and where each entry goes, table tools on every real table, and an export that loses nothing.
//
// Two notes the tests encode rather than paper over:
//   • `# #` and `## ##` (§3) are EMPTY headings — CommonMark's closing-sequence rule strips a `#` run after a space —
//     so §3 holds five empty headings, and `#hashtag-not-a-heading` / `\# escaped` are paragraphs.
//   • Peekover gives headings NO `id` (navigation is by element reference; permalinks are deferred — `tocModel.ts`).
//     So "distinct anchors" is pinned as distinct TARGETS: every contents entry, empty headings included, points at
//     its own heading element, and selecting it scrolls that element into view.
//   • §4's pipe lines are not a table (no blank line before them, inside a list item): text in the second item. GitHub's
//     own renderer (file mode) gives the same structure (recorded in `decisions.md`, "M13 TASK 8.1k").

import { describe, it, expect, afterEach } from 'vitest';
import fixture from '../fixtures/weird-nesting.md?raw';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { parse } from '../../src/render/parse';
import { sanitize } from '../../src/render/sanitize';
import { mount } from '../../src/render/mount';
import { enhanceTables } from '../../src/render/tableEnhancer';
import { tocHeadingRef } from '../../src/render/tocView';
import { serializeReaderDocument, wrapInStandaloneDocument } from '../../src/export/htmlExport';

const cleanup: (() => void)[] = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()!();
});

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

/** The fixture's sanitized HTML, cut into its sections (`## n.` headings) — what the reader is built from. */
function sections(): Record<string, string[]> {
  const t = document.createElement('template');
  t.innerHTML = sanitize(parse(fixture));
  const out: Record<string, string[]> = {};
  let key = '(title)';
  const box: Element[] = [];
  const flush = () => {
    const frag = document.createElement('div');
    for (const el of box) frag.append(el.cloneNode(true));
    out[key] = shape(frag);
    box.length = 0;
  };
  for (const el of [...t.content.children]) {
    if (el.tagName === 'H2' && /^\d\./.test(el.textContent ?? '')) {
      flush();
      key = (el.textContent ?? '').trim();
    }
    box.push(el);
  }
  flush();
  return out;
}

const EXPECTED: Record<string, string[]> = {
  '(title)': ['h1 "Weird nesting test"', 'p'],
  '1. The exact combo': [
    'h2 "1. The exact combo"',
    'ul', '  li', '    p', '    blockquote', '      p', '      pre', '        code .language-js', '      p',
    'table', '  thead', '    tr', '      th', '      th', '  tbody', '    tr', '      td', '      td',
    'h1 ""', 'p',
  ],
  '2. Same, but the table is inside the list item': [
    'h2 "2. Same, but the table is inside the list item"',
    'ol', '  li', '    p', '    blockquote', '      pre', '        code .language-python',
    '    table', '      thead', '        tr', '          th', '          th', '      tbody', '        tr', '          td', '          td',
    '  li', '    p',
  ],
  '3. Empty and odd headings': [
    'h2 "3. Empty and odd headings"',
    'h1 ""', 'h2 ""', 'h3 ""', 'h1 ""', 'h2 ""', 'p', 'p', 'h2 "Duplicate"', 'h2 "Duplicate"',
  ],
  '4. Lazy continuation and tight spacing': [
    'h2 "4. Lazy continuation and tight spacing"',
    'ul', '  li', '    blockquote', '      p', '      pre', '        code', '  li',
  ],
  '5. Deep nesting': [
    'h2 "5. Deep nesting"',
    'ul', '  li', '    ul', '      li', '        blockquote', '          p', '          ul', '            li', '              blockquote', '                p', '                pre', '                  code .language-sh',
  ],
  '6. Unclosed fence inside a quote in a list': [
    'h2 "6. Unclosed fence inside a quote in a list"',
    'ul', '  li', '    blockquote', '      pre', '        code',
    'p', 'table', '  thead', '    tr', '      th', '      th', '  tbody', '    tr', '      td', '      td',
    'h1 ""',
  ],
};

const store = { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined } as AppStore;

async function appPage(): Promise<ShadowRoot> {
  const container = document.createElement('div');
  container.style.cssText = 'width:1300px;height:900px';
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const file = { path: 'weird-nesting.md', name: 'weird-nesting.md', read: async () => fixture };
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [file] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
  await app.openFolder();
  (await until(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'tree item')).click();
  const host = await until(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'reader host');
  await until(() => host.shadowRoot?.querySelector('h1'), 'render');
  const shadow = host.shadowRoot!;
  await until(() => [...shadow.querySelectorAll('.peekover-code')].every((w) => w.querySelector('pre.shiki')), 'highlighting');
  return shadow;
}

function tabSurface(): ShadowRoot {
  const host = document.createElement('div');
  host.style.cssText = 'display:block;width:1300px;height:900px';
  document.body.appendChild(host);
  cleanup.push(() => host.remove());
  mount(fixture, host);
  enhanceTables(host);
  return host.shadowRoot!;
}

const HEADING_LABELS = [
  'Weird nesting test',
  '1. The exact combo',
  'Untitled section',
  '2. Same, but the table is inside the list item',
  '3. Empty and odd headings',
  'Untitled section',
  'Untitled section',
  'Untitled section',
  'Untitled section',
  'Untitled section',
  'Duplicate',
  'Duplicate',
  '4. Lazy continuation and tight spacing',
  '5. Deep nesting',
  '6. Unclosed fence inside a quote in a list',
  'Untitled section',
];

describe('the weird-nesting fixture, pinned as rendered now (M13 8.1k)', () => {
  it('the tag structure of each section', () => {
    expect(sections()).toEqual(EXPECTED);
  });

  for (const surface of ['app page', 'tab'] as const) {
    it(`${surface}: no fallback banner; table tools on every real table (three); §4's pipes are text`, async () => {
      const shadow = surface === 'app page' ? await appPage() : tabSurface();
      expect(shadow.querySelector('.peekover-reader'), 'the reading column rendered').not.toBeNull();
      expect(shadow.querySelector('.peekover-fallback, .peekover-error-banner, [data-state="fallback"]'), 'no fallback banner').toBeNull();
      const tables = [...shadow.querySelectorAll('.peekover-reader table')];
      expect(tables).toHaveLength(3);
      for (const t of tables) expect(t.querySelectorAll('.peekover-table-sort').length, 'sort buttons on each column').toBe(2);
      expect(shadow.querySelectorAll('.peekover-table-tools').length, 'a toolbar per table').toBe(3);
    }, 30000);
  }

  it('app page: the contents list — every heading, empty ones labelled, each entry its own target, each scrolls there', async () => {
    const shadow = await appPage();
    const links = [...shadow.querySelectorAll<HTMLElement>('button.peekover-toc__link')];
    expect(links.map((l) => (l.textContent ?? '').trim())).toEqual(HEADING_LABELS);
    const targets = links.map((l) => tocHeadingRef(l));
    const headings = [...shadow.querySelectorAll('.peekover-reader :is(h1,h2,h3,h4,h5,h6)')];
    expect(targets.every((t) => t && t.isConnected), 'every entry resolves to a heading on the page').toBe(true);
    expect(new Set(targets).size, 'every entry has its OWN target (the two "Duplicate" and the empty ones included)').toBe(links.length);
    expect(targets).toEqual(headings);
    // Selecting an entry brings ITS heading into the visible reading pane (the empty ones too). A heading near the end
    // of a short document cannot reach the pane's top, so "in view" is the test, not "at the top". The order jumps
    // back and forth, so each pass must move the pane to a different heading.
    // The pane that scrolls is the app page's <main> (the host grows with the document, so its box is not the view).
    const pane = (shadow.host as HTMLElement).closest('.peekover-app__reader')!;
    expect(pane.scrollHeight, 'the document is taller than the pane, so scrolling is real').toBeGreaterThan(pane.clientHeight * 2);
    const inView = (el: Element) => {
      const r = el.getBoundingClientRect();
      const box = pane.getBoundingClientRect();
      return r.top >= box.top - 2 && r.top < box.bottom - 2;
    };
    for (const i of [15, 0, 11, 2, 12, 6]) {
      links[i].click();
      await until(() => inView(targets[i]!), `entry ${i} (${HEADING_LABELS[i]}) scrolled into view`, 5000);
    }
  }, 30000);

  it('app page: the exported document loses nothing — headings, code, tables, and the same text', async () => {
    const shadow = await appPage();
    const { clone, theme } = serializeReaderDocument(shadow.host as HTMLElement);
    const doc = new DOMParser().parseFromString(wrapInStandaloneDocument(clone, theme), 'text/html');
    expect(doc.doctype?.name).toBe('html');
    const col = shadow.querySelector('.peekover-reader')!;
    const out = doc.querySelector('.peekover-reader')!;
    expect(out, 'the reading column is in the export').not.toBeNull();
    const count = (root: ParentNode, sel: string) => root.querySelectorAll(sel).length;
    for (const sel of ['h1,h2,h3,h4,h5,h6', 'blockquote', 'table', 'ul,ol', 'pre.shiki', 'pre:not(.shiki) code']) {
      expect(count(out, sel), `export keeps every ${sel}`).toBe(count(col, sel));
    }
    expect(count(out, 'button'), 'no controls in the export').toBe(0);
    const words = (s: string) => s.replace(/\s+/g, ' ').trim();
    expect(words(out.textContent ?? ''), 'the same text').toBe(words(clone.textContent ?? ''));
  }, 30000);
});
