// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { READER_CSS } from '../src/theme/readerCss';
import { LIGHT_TOKENS, DARK_TOKENS, APP_BASE_TOKENS } from '../src/app/appShell';
import { ONBOARDING_LIGHT_TOKENS, ONBOARDING_DARK_TOKENS, ONBOARDING_BASE_TOKENS, ONBOARDING_CSS } from '../src/app/onboarding';

// THE TOKEN PIN (013 task 2.1; plan D-1; gate-1 Q2, Q4). `design/tokens.css` is the single source of
// every colour, radius and shadow value. The code carries COPIES of it — the reader's three `:host`
// blocks, the app shell's token sets, the Mermaid palette, and `var(--x,#hex)` fallbacks in the app
// sheets — because a shadow root and a page sheet each need their own declarations. This test parses
// tokens.css at test time and asserts every copy equals it, both themes, so a value cannot drift in
// one copy without a red that names the copy and the token. A colour literal anywhere else in `src/`
// is an untracked copy and fails, unless it is on the named allow-list below.
//
// Deliberate exceptions are listed by name, each with its ruling — never a silent skip.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const stripCssComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

type Tokens = Record<string, string>;

/** `--name:value;` declarations of one block body, values whitespace-normalized. */
function declarations(body: string): Tokens {
  const out: Tokens = {};
  for (const m of stripCssComments(body).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[m[1]] = m[2].replace(/\s+/g, ' ').trim();
  }
  return out;
}

/** The body of the FIRST rule whose selector is exactly `selector`. */
function block(css: string, selector: string): string {
  const src = stripCssComments(css);
  const at = src.indexOf(`${selector}{`);
  if (at < 0) throw new Error(`no ${selector}{ block`);
  const start = at + selector.length + 1;
  return src.slice(start, src.indexOf('}', start));
}

const same = (a: string, b: string): boolean => a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase();

// ── The source ──────────────────────────────────────────────────────────────────────────────────
const TOKENS_CSS = read('design/tokens.css');
const LIGHT = declarations(block(TOKENS_CSS, ':root'));
const DARK_OVERRIDES = declarations(block(TOKENS_CSS, '[data-theme="dark"]'));
const SEPIA_OVERRIDES = declarations(block(TOKENS_CSS, '[data-theme="sepia"]'));
const THEMES: Record<'light' | 'dark' | 'sepia', Tokens> = {
  light: LIGHT,
  dark: { ...LIGHT, ...DARK_OVERRIDES },
  sepia: { ...LIGHT, ...SEPIA_OVERRIDES },
};

/** Compare a copy with the source over `keys`; one message per mismatch, naming copy and token. */
function diff(copy: string, actual: Tokens, expected: Tokens, keys: string[]): string[] {
  return keys.flatMap((k) =>
    actual[k] === undefined
      ? [`${copy}: ${k} is missing (tokens.css: ${expected[k]})`]
      : expected[k] === undefined
        ? [`${copy}: ${k} is not in tokens.css`]
        : same(actual[k], expected[k])
          ? []
          : [`${copy}: ${k} is ${actual[k]}, tokens.css says ${expected[k]}`],
  );
}

// ── Named exceptions, each with its ruling ──────────────────────────────────────────────────────
/** Tokens the app SHELL does not carry, deliberately. */
const SHELL_EXCEPTIONS: Record<string, string> = {
  // KEEPS: the shell's token sets equal tokens.css. 013 task 4.1 ENDS the --logo-ink / --logo-eye
  // exceptions: the toolbar's mark draws with those tokens, so the shell now carries them and the
  // pin checks them (AGENTS.md: a provisional exception goes when its mechanism becomes real).
};
/** Colour literals allowed outside the tracked copies, each with its reason. `files` scopes it. */
const ALLOW_LIST: Array<{ value: string; files: RegExp; reason: string }> = [
  { value: '#26210a', files: /^src\/(theme\/readerCss|render\/diagramEngine)\.ts$/, reason: 'text on the light highlighter — the 2026-07-10 trap guard (readerCss.ts)' },
  { value: '#191504', files: /^src\/(theme\/readerCss|render\/diagramEngine)\.ts$/, reason: 'text on the dark highlighter — the 2026-07-10 trap guard (readerCss.ts)' },
  { value: '#16171F', files: /logo|icon/i, reason: "the logo's FIXED ink, the same in every theme (AGENTS.md; tokens.css --logo-ink)" },
  { value: '#FBFBF8', files: /logo|icon/i, reason: "the logo's FIXED eye, the same in every theme (tokens.css --logo-eye)" },
];

describe('design/tokens.css is the single source (013 task 2.1, D-1)', () => {
  it('runs where the app shell can be imported (a DOM-backed environment)', () => {
    // appShell imports the sanitizer, which needs a window; the environment line at the top provides it.
    expect(typeof window).toBe('object');
  });

  it('names itself the source of truth, and carries the dark shadow ruled at gate 1 (Q2)', () => {
    expect(TOKENS_CSS.split('\n')[0]).toMatch(/source of truth: design\/tokens\.css/i);
    expect(DARK_OVERRIDES['--shadow'], 'tokens.css dark --shadow (Q2: the mockup\'s value)').toBe('0 10px 30px rgba(0,0,0,.5)');
  });

  // M13 walk item III-3 (HUMAN 2026-11-10, FIX): `--faint` draws boundaries (scrollbar thumbs, the tree's twisty, a
  // hovered border, a pressed toggle), so it must reach WCAG 1.4.11's 3:1 on the paper in BOTH themes. It was 2.60:1
  // in light (#9A9DAC); dark (3.70) is unchanged. The source is checked here; the copies by the pins below.
  // The published site and the design references carry their own light token block. They illustrate tokens.css and
  // were never pinned whole (some values differ there by long standing: the site's --accent-soft / --shadow, brand's
  // --del, the font stacks). 8.1j's follow-up (HUMAN 2026-11-11) syncs and pins the LIGHT --faint only, so the 3:1
  // value cannot drift back in the pages people read. harness/math-fidelity is a test harness and is left out.
  it('the site and design pages carry tokens.css’s light --faint', () => {
    const pages = ['site/index.html', 'site/privacy/index.html', 'design/brand.html', 'design/icons.html', 'design/mockup.html'];
    const wrong = pages.flatMap((p) => {
      const css = read(p);
      const light = declarations(block(css, ':root'));
      return same(light['--faint'] ?? '', LIGHT['--faint']) ? [] : [`${p}: light --faint is ${light['--faint']}, tokens.css says ${LIGHT['--faint']}`];
    });
    expect(wrong).toEqual([]);
  });

  it('--faint reaches 3:1 (WCAG 1.4.11) on --paper, light and dark', () => {
    const lin = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string): number => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    expect(ratio('#FFFFFF', '#000000'), 'the arithmetic (control)').toBeCloseTo(21, 5);
    for (const theme of ['light', 'dark'] as const) {
      const t = THEMES[theme];
      const r = ratio(t['--faint'], t['--paper']);
      expect(r, `${theme}: --faint ${t['--faint']} on --paper ${t['--paper']} = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    }
  });

  it("the reader's :host blocks equal tokens.css, light, dark and sepia", () => {
    const light = declarations(block(READER_CSS, ':host'));
    const dark = declarations(block(READER_CSS, ':host([data-theme="dark"])'));
    const sepia = declarations(block(READER_CSS, ':host([data-theme="sepia"])'));
    expect([
      ...diff('READER_CSS :host', light, LIGHT, [...new Set([...Object.keys(LIGHT), ...Object.keys(light)])]),
      ...diff('READER_CSS :host([data-theme="dark"])', dark, DARK_OVERRIDES, [...new Set([...Object.keys(DARK_OVERRIDES), ...Object.keys(dark)])]),
      ...diff('READER_CSS :host([data-theme="sepia"])', sepia, SEPIA_OVERRIDES, [...new Set([...Object.keys(SEPIA_OVERRIDES), ...Object.keys(sepia)])]),
    ]).toEqual([]);
  });

  it("the app shell's token sets equal tokens.css, light and dark, except the named exceptions", () => {
    const light = { ...declarations(LIGHT_TOKENS), ...declarations(APP_BASE_TOKENS) };
    const dark = declarations(DARK_TOKENS);
    const lightKeys = Object.keys(LIGHT).filter((k) => !(k in SHELL_EXCEPTIONS));
    const darkKeys = Object.keys(DARK_OVERRIDES).filter((k) => !(k in SHELL_EXCEPTIONS));
    // Nothing the shell declares may be outside tokens.css, except an exception it overrides.
    const extra = [...Object.keys(light), ...Object.keys(dark)].filter((k) => !(k in LIGHT) && !(k in SHELL_EXCEPTIONS));
    expect([
      ...diff('appShell LIGHT_TOKENS + base', light, LIGHT, lightKeys),
      ...diff('appShell DARK_TOKENS', dark, DARK_OVERRIDES, darkKeys),
      ...extra.map((k) => `appShell: ${k} is not in tokens.css`),
    ]).toEqual([]);
    // Sepia is dormant (gate-1 Q6): the shell carries no sepia set, and that is the ruling, not drift.
  });

  // 013 task 6.1 (D-11): the setup guide's own sheet carries its own copies — the same three sets.
  it("the setup guide's token sets equal tokens.css, light and dark, and its sheet uses them", () => {
    const light = { ...declarations(ONBOARDING_LIGHT_TOKENS), ...declarations(ONBOARDING_BASE_TOKENS) };
    const dark = declarations(ONBOARDING_DARK_TOKENS);
    const extra = [...Object.keys(light), ...Object.keys(dark)].filter((k) => !(k in LIGHT));
    expect([
      ...diff('onboarding LIGHT + base', light, LIGHT, Object.keys(LIGHT)),
      ...diff('onboarding DARK', dark, DARK_OVERRIDES, Object.keys(DARK_OVERRIDES)),
      ...extra.map((k) => `onboarding: ${k} is not in tokens.css`),
    ]).toEqual([]);
    // The three layers (appShell's cascade): the light base, the OS dark default, the explicit overrides.
    const css = ONBOARDING_CSS.replace(/\s+/g, '');
    for (const [what, sel, body] of [
      ['base', '.peekover-onboard{', ONBOARDING_LIGHT_TOKENS],
      ['OS dark', '@media(prefers-color-scheme:dark){.peekover-onboard{', ONBOARDING_DARK_TOKENS],
      ['explicit light', '.peekover-onboard[data-theme="light"]{', ONBOARDING_LIGHT_TOKENS],
      ['explicit dark', '.peekover-onboard[data-theme="dark"]{', ONBOARDING_DARK_TOKENS],
    ] as const) {
      expect(css, what).toContain(sel + body.replace(/\s+/g, ''));
    }
  });

  it('every var(--x,#hex) fallback in the app sheets equals the LIGHT value of --x', () => {
    const SHEETS = ['exportControls', 'storageControls', 'treeView', 'recentsView', 'readerPane', 'appShell'].map((f) => `src/app/${f}.ts`);
    const bad: string[] = [];
    let seen = 0;
    for (const f of SHEETS) {
      for (const m of read(f).matchAll(/var\((--[a-z0-9-]+)\s*,\s*(#[0-9a-f]{3,8})\)/gi)) {
        seen += 1;
        if (LIGHT[m[1]] === undefined) bad.push(`${f}: fallback for ${m[1]}, which is not in tokens.css`);
        else if (!same(m[2], LIGHT[m[1]])) bad.push(`${f}: var(${m[1]},${m[2]}) — tokens.css light says ${LIGHT[m[1]]}`);
      }
    }
    expect(seen, 'the fallback scan found the copies it governs').toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });

  it('the Mermaid palette (diagramEngine.ts DIAGRAM_TOKENS) equals tokens.css per theme', () => {
    const src = read('src/render/diagramEngine.ts');
    const obj = /const DIAGRAM_TOKENS[^=]*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\);/.exec(src)?.[1];
    expect(obj, 'DIAGRAM_TOKENS found').toBeDefined();
    const KEY: Record<string, string> = { paper: '--paper', panel: '--panel', ink: '--ink', line: '--line', muted: '--muted', hl: '--hl' };
    const INK: Record<string, string> = { light: '#26210a', dark: '#191504', sepia: '#26210a' };
    const bad: string[] = [];
    for (const theme of ['light', 'dark', 'sepia'] as const) {
      const body = new RegExp(`\\b${theme}:\\s*\\{([^}]*)\\}`).exec(obj!)?.[1] ?? '';
      const entries = Object.fromEntries([...body.matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]));
      for (const [k, token] of Object.entries(KEY)) {
        if (entries[k] === undefined) bad.push(`DIAGRAM_TOKENS.${theme}.${k} is missing`);
        else if (!same(entries[k], THEMES[theme][token])) bad.push(`DIAGRAM_TOKENS.${theme}.${k} is ${entries[k]}, tokens.css ${token} (${theme}) says ${THEMES[theme][token]}`);
      }
      if (!same(entries.hlInk ?? '', INK[theme])) bad.push(`DIAGRAM_TOKENS.${theme}.hlInk is ${entries.hlInk}, the allow-listed highlighter ink is ${INK[theme]}`);
    }
    expect(bad).toEqual([]);
  });

  it('no untracked colour literal anywhere in src/ (tests excluded), except the named allow-list', () => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const p = `${dir}/${name}`;
        if (statSync(join(ROOT, p)).isDirectory()) walk(p);
        else if (p.endsWith('.ts') && !p.endsWith('.test.ts') && !p.endsWith('.d.ts')) files.push(p);
      }
    };
    walk('src');
    const bad: string[] = [];
    for (const f of files) {
      let text = read(f);
      // Remove the TRACKED copies first (each is pinned above), then every comment.
      if (f === 'src/theme/readerCss.ts') {
        for (const sel of [':host', ':host([data-theme="dark"])', ':host([data-theme="sepia"])']) {
          text = text.replace(`${sel}{${block(text, sel)}}`, '');
        }
      }
      if (f === 'src/app/appShell.ts') {
        text = text.replace(/const (LIGHT|DARK)_TOKENS = \/\* css \*\/ `[^`]*`;/g, '').replace(/const APP_BASE_TOKENS = \/\* css \*\/ `[^`]*`;/, '');
      }
      if (f === 'src/app/onboarding.ts') text = text.replace(/const ONBOARDING_(LIGHT|DARK|BASE)_TOKENS = \/\* css \*\/ `[^`]*`;/g, '');
      if (f === 'src/render/diagramEngine.ts') text = text.replace(/const DIAGRAM_TOKENS[^=]*=\s*Object\.freeze\(\{[\s\S]*?\n\}\);/, '');
      text = text.replace(/var\(--[a-z0-9-]+\s*,\s*#[0-9a-f]{3,8}\)/gi, '');
      text = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\([^)]*\)/gi)) {
          const rel = relative(ROOT, join(ROOT, f)).replace(/\\/g, '/');
          if (ALLOW_LIST.some((a) => same(a.value, m[0]) && a.files.test(rel))) continue;
          bad.push(`${rel}:${i + 1}: ${m[0]}`);
        }
      });
    }
    expect(bad, 'colour literals outside a tracked copy and off the allow-list').toEqual([]);
  });
});
