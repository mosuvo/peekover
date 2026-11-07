import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../src/render/parse';

// THE PRIVACY PIN (013 task 9.1; plan §9-1, D-12 — the D-1 pattern: one source, pinned). The site's privacy page,
// `site/privacy/index.html`, carries `docs/trust/PRIVACY.md`'s text. PRIVACY.md is the source; the page's <main> is
// that file rendered through Peekover's own parser (`src/render/parse.ts`). This test renders PRIVACY.md the same way
// and compares the two as normalized text, line by line, and on a difference names the first line that differs — so
// a word changed in either file goes red and says where.
//
// Normalized text: block-level closing tags (and <br>) end a line, every other tag is dropped, entities decoded,
// whitespace collapsed, empty lines dropped. Markup and indentation may differ; the words and their order may not.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const PRIVACY_MD = 'docs/trust/PRIVACY.md';
const PAGE = 'site/privacy/index.html';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (t: string): string =>
  t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ''), /^#x/i.test(e) ? 16 : 10)) : ENTITIES[e.toLowerCase()] ?? m,
  );

const BLOCK_END = /<\/(h[1-6]|p|li|ul|ol|blockquote|pre|tr|table|div|section|header|footer)>|<br\s*\/?>/gi;

export function htmlLines(html: string): string[] {
  return decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(BLOCK_END, '\n').replace(/<[^>]+>/g, ' '))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** The inner HTML of the page's single <main>. */
function mainOf(html: string): string {
  const m = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (!m) throw new Error(`${PAGE}: no <main>`);
  if ((html.match(/<main\b/gi) ?? []).length !== 1) throw new Error(`${PAGE}: more than one <main>`);
  return m[1];
}

/** The first line where the two differ, as a readable message; null when equal. */
export function firstDifference(expected: string[], actual: string[]): string | null {
  const n = Math.max(expected.length, actual.length);
  for (let i = 0; i < n; i += 1) {
    if (expected[i] !== actual[i]) {
      return `line ${i + 1} differs:\n  PRIVACY.md: ${expected[i] ?? '(nothing)'}\n  the page:   ${actual[i] ?? '(nothing)'}`;
    }
  }
  return null;
}

describe('the site privacy page carries PRIVACY.md (013 task 9.1, §9-1)', () => {
  it('exists', () => {
    expect(existsSync(join(ROOT, PAGE)), `${PAGE} exists`).toBe(true);
  });

  it("its <main> is PRIVACY.md rendered by Peekover's parser, line for line", () => {
    const expected = htmlLines(parse(read(PRIVACY_MD)));
    const actual = htmlLines(mainOf(read(PAGE)));
    expect(expected.length, 'PRIVACY.md renders to text').toBeGreaterThan(10);
    expect(firstDifference(expected, actual)).toBeNull();
  });

  it('names the first differing line when one word changes in either file (the instrument fires)', () => {
    const expected = htmlLines(parse(read(PRIVACY_MD)));
    const changed = [...expected];
    changed[3] = changed[3].replace(/\b\w+\b/, 'Changed');
    expect(firstDifference(expected, changed)).toMatch(/^line 4 differs:/);
    expect(firstDifference(changed, expected)).toMatch(/^line 4 differs:/);
  });
});
