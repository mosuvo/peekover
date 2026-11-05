// SEVEN MORE GRAMMARS, ON DEMAND, AND FENCE ALIASES (013 task 5.11; the human's ruling R2).
//
// Real engine, Chromium and Firefox: each new language highlights a real sample, and a named token in
// it is painted in the Peekover theme's design token for its kind (TypeScript types, YAML and TOML
// keys, Markdown headings, diff added / removed lines, SQL keywords). Each alias highlights exactly
// as its grammar. A label in capitals resolves. An unknown label (`rust`), `console` (deliberately
// not an alias of bash — a transcript mixes prompts with output) and `jsx` stay plain: the fence ends
// `failed`, nothing highlighted is added, the source stays visible.
//
// The colour is read twice: the span's own inline `var(--…)` (what the theme mapped) and its computed
// colour against the host's resolved token (what the engine drew) — so a mapping that names the right
// token but never resolves still reds.
//
// SQL is sampled in UPPERCASE and lowercase: both engines scope both. (Under Node — the unit runner —
// the same JS regex engine leaves uppercase `SELECT` / `FROM` / `WHERE` unscoped; decisions.md, "M13
// TASK 5.11". This file is the product's evidence.)

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { CODE_STATE_ATTR, CODE_WRAPPER_CLASS } from '../../src/render/codeView';

const cleanup: HTMLElement[] = [];
afterEach(() => {
  for (const el of cleanup.splice(0)) el.remove();
});

const fence = (lang: string, body: string): string => '```' + lang + '\n' + body + '\n```\n\n';

/** label → [sample, [token text, the design token it must be painted in]...] */
const LANGUAGES: [string, string, [string, string][]][] = [
  ['typescript', 'interface Doc { size: number }', [['Doc', '--code-type'], ['number', '--code-type'], ['interface', '--accent']]],
  ['tsx', 'const el = <Note title="x">hi</Note>;', [['Note', '--code-type'], ['title', '--code-type']]],
  ['diff', '--- a/doc.md\n+++ b/doc.md\n@@ -1 +1 @@\n-old line\n+new line', [['-old line', '--code-num'], ['+new line', '--code-str']]],
  ['yaml', 'name: peekover\nfiles: 42', [['name', '--code-type'], ['42', '--code-num']]],
  ['markdown', '# Heading one\n\nSome text.', [['# Heading one', '--accent']]],
  ['toml', '[package]\nname = "peekover"', [['name', '--code-type'], ['"peekover"', '--code-str']]],
  ['sql', 'SELECT name FROM docs WHERE size > 42;\nselect id from t;', [['SELECT', '--accent'], ['FROM', '--accent'], ['WHERE', '--accent'], ['select', '--accent'], ['42', '--code-num']]],
];

/** alias → [sample, a token it must paint] — the same token its grammar paints. */
const ALIASES: [string, string, [string, string]][] = [
  ['ts', 'const n: number = 1;', ['number', '--code-type']],
  ['js', 'const n = 42;', ['const', '--accent']],
  ['mjs', 'const n = 42;', ['const', '--accent']],
  ['cjs', 'const n = 42;', ['const', '--accent']],
  ['sh', 'for b in x; do echo "$b"; done', ['for', '--accent']],
  ['shell', 'for b in x; do echo "$b"; done', ['for', '--accent']],
  ['zsh', 'for b in x; do echo "$b"; done', ['for', '--accent']],
  ['py', 'def f(): return None', ['def', '--accent']],
  ['yml', 'name: peekover', ['name', '--code-type']],
  ['md', '# Heading', ['# Heading', '--accent']],
  ['TypeScript', 'const n: number = 1;', ['number', '--code-type']],
];

const UNKNOWN = ['rust', 'console', 'jsx'];

function directHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true });
  enhanceCode(host);
  if (!host.shadowRoot) throw new Error('mount produced no shadow root');
  return { host, shadow: host.shadowRoot };
}

/** rgb()/rgba() or #hex → lowercase #rrggbb, so a computed colour compares with a token's value. */
function toHex(colour: string): string {
  const probe = document.createElement('span');
  probe.style.color = colour;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!m) throw new Error(`unreadable colour ${colour} → ${rgb}`);
  return '#' + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

/** Every wrapper, in document order, once each has left `pending`. */
async function settledWrappers(shadow: ShadowRoot, count: number): Promise<HTMLElement[]> {
  let wrappers: HTMLElement[] = [];
  await vi.waitFor(
    () => {
      wrappers = [...shadow.querySelectorAll<HTMLElement>(`.${CODE_WRAPPER_CLASS}`)];
      expect(wrappers).toHaveLength(count);
      for (const w of wrappers) expect(w.getAttribute(CODE_STATE_ATTR)).not.toBe('pending');
    },
    { timeout: 15_000, interval: 25 },
  );
  return wrappers;
}

/** What paints `text` in this wrapper's highlighted block: the inline token and the drawn colour. */
function paintOf(host: HTMLElement, wrapper: HTMLElement, text: string): { inline: string; drawn: string; want: (t: string) => string } | null {
  const span = [...wrapper.querySelectorAll<HTMLElement>('pre.shiki .line span')].find((s) => s.textContent?.trim() === text);
  if (!span) return null;
  const inline = /var\((--[a-z0-9-]+)\)/.exec(span.getAttribute('style') ?? '')?.[1] ?? 'NONE';
  const tokenValue = (t: string): string => toHex(getComputedStyle(host.shadowRoot!.querySelector('.peekover-reader')!).getPropertyValue(t).trim());
  return { inline, drawn: toHex(getComputedStyle(span).color), want: tokenValue };
}

describe('5.11 — the seven new grammars highlight, each token in its design token', () => {
  it('typescript, tsx, diff, yaml, markdown, toml and sql', async () => {
    const { host, shadow } = directHost('# Langs\n\n' + LANGUAGES.map(([l, s]) => fence(l, s)).join(''));
    const wrappers = await settledWrappers(shadow, LANGUAGES.length);
    const wrong: string[] = [];
    LANGUAGES.forEach(([lang, , expected], i) => {
      const w = wrappers[i];
      if (w.getAttribute(CODE_STATE_ATTR) !== 'rendered') {
        wrong.push(`${lang}: ${w.getAttribute(CODE_STATE_ATTR)}`);
        return;
      }
      for (const [text, token] of expected) {
        const p = paintOf(host, w, text);
        if (!p) wrong.push(`${lang}: no span "${text}"`);
        else if (p.inline !== token || p.drawn !== p.want(token)) wrong.push(`${lang}: "${text}" inline ${p.inline} drawn ${p.drawn}, want ${token} = ${p.want(token)}`);
      }
    });
    expect(wrong).toEqual([]);
  }, 30_000);
});

describe('5.11 — fence aliases and a capitalised label highlight as their grammar', () => {
  it('ts, js, mjs, cjs, sh, shell, zsh, py, yml, md, TypeScript', async () => {
    const { host, shadow } = directHost('# Aliases\n\n' + ALIASES.map(([l, s]) => fence(l, s)).join(''));
    const wrappers = await settledWrappers(shadow, ALIASES.length);
    const wrong: string[] = [];
    ALIASES.forEach(([label, , [text, token]], i) => {
      const w = wrappers[i];
      if (w.getAttribute(CODE_STATE_ATTR) !== 'rendered') {
        wrong.push(`${label}: ${w.getAttribute(CODE_STATE_ATTR)}`);
        return;
      }
      const p = paintOf(host, w, text);
      if (!p) wrong.push(`${label}: no span "${text}"`);
      else if (p.inline !== token || p.drawn !== p.want(token)) wrong.push(`${label}: "${text}" inline ${p.inline} drawn ${p.drawn}, want ${token}`);
    });
    expect(wrong).toEqual([]);
  }, 30_000);
});

describe('5.11 — an unknown label stays plain', () => {
  it('rust, console and jsx: failed, nothing highlighted, the source visible', async () => {
    const { shadow } = directHost('# Plain\n\n' + UNKNOWN.map((l) => fence(l, 'fn main() { println!("hi"); }')).join(''));
    const wrappers = await settledWrappers(shadow, UNKNOWN.length);
    UNKNOWN.forEach((label, i) => {
      const w = wrappers[i];
      expect(w.getAttribute(CODE_STATE_ATTR), label).toBe('failed');
      expect(w.querySelectorAll('pre.shiki'), label).toHaveLength(0);
      const source = w.querySelector<HTMLElement>('pre[data-code]')!;
      expect(getComputedStyle(source).display, label).not.toBe('none');
      expect(source.textContent, label).toContain('println!');
    });
  }, 30_000);
});
