// @vitest-environment jsdom
//
// codeEngine — the gate, the engine choice, and the version. Four properties, each with the
// control that makes its green mean something:
//
//   1. THE FENCE PREDICATE. Positive AND negative cases — a direct `pre > code[class^="language-
//      "]` child, and every near-miss (bare `code`, an unclassed fence, a `code` behind an
//      intervening element) that must NOT trip it.
//   2. THE FEATURE-DETECT. "The engine is never loaded on a fence-free document" is a claim about
//      something NOT happening, and the classic way to fake it is a spy that was never wired up at
//      all — an un-called spy and a missing spy are indistinguishable (retro 2026-07-27 finding
//      1). So the fence-free assertion is paired, IN THE SAME TEST, with a fence-bearing document
//      that drives the same spy and must show a call.
//   3. THE ENGINE CHOICE (D-3). Asserted by IDENTITY, not shape: `shiki/engine/javascript`'s
//      `createJavaScriptRegexEngine` is spied in place (wrapping the real implementation), and the
//      object `createHighlighterCore` receives as `engine` is asserted to be the EXACT value that
//      spy returned. A fixture that temporarily swaps the import for `shiki/engine/oniguruma`'s
//      `createOnigurumaEngine` must fail this assertion — run once, red, pasted into the task
//      report, then reverted (retro finding 5, revert-and-fail is the standard).
//   4. `codeToTokens`'S SHAPE. A REAL highlighter (real engine, one theme, one language) tokenizes
//      a trivial fixture, and the full return structure is captured — the ground truth a later
//      task's DOM-adoption code is written against, not assumed from memory (plan risk 4).
//
// The real `shiki/core` module graph is never imported for tests 1-2: `loadCodeEngine` takes an
// injected loader, so jsdom never sees the tokenizer's bytes and the test measures our gate
// rather than the engine's behaviour. Test 3 and 4 use the real, installed 4.4.3 package —
// pure JS module loading + tokenization, no layout/paint/rAF/pointer concerns, so jsdom is fine.

import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// Wraps the REAL `createJavaScriptRegexEngine` in a spy rather than replacing it: the returned
// engine stays genuine (so test 4's highlighter, built the same way, stays representative), but
// the call becomes observable. `vi.mock` replaces the module in the whole registry, so
// codeEngine.ts's own static `import … from 'shiki/engine/javascript'` resolves to this SAME
// mock — the spy below and codeEngine.ts's internal call are the same function.
vi.mock('shiki/engine/javascript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('shiki/engine/javascript')>();
  return { ...actual, createJavaScriptRegexEngine: vi.fn(actual.createJavaScriptRegexEngine) };
});

import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlighterCore } from 'shiki/core';
import {
  CODE_FENCE_SELECTOR,
  engineVersion,
  hasCodeFence,
  loadCodeEngine,
  languageInputFor,
  grammarKeyFor,
  themeInputFor,
  CODE_THEME_IDS,
  PEEKOVER_CODE_THEME,
  PEEKOVER_THEME,
  type CodeEngineModule,
} from './codeEngine';
import { contrastRatio } from '../theme/codeThemeControl';
import { DEFAULT_SETTINGS } from '../settings/settings';

/** A stand-in for the `shiki/core` module, carrying a `createHighlighterCore` spy that returns a
 *  fake highlighter — so "not called" is an assertion about a thing that EXISTS and could have
 *  been called. */
function fakeCodeEngineModule() {
  const highlighter = { codeToTokens: vi.fn() } as unknown as HighlighterCore;
  const createHighlighterCore = vi.fn<CodeEngineModule['createHighlighterCore']>(async () => highlighter);
  return { module: { createHighlighterCore } as CodeEngineModule, createHighlighterCore, highlighter };
}

/** A document fragment holding markdown-it's committed fence shape for a labelled code block. */
function rootWithFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<pre><code class="language-js">const x = 1;</code></pre>';
  return host;
}

/** The same shape minus any fenced code — must NOT trip the detect. */
function rootWithoutFence(): ParentNode {
  const host = document.createElement('div');
  host.innerHTML = '<h1>No code here</h1><p>Just prose.</p>';
  return host;
}

describe('hasCodeFence / CODE_FENCE_SELECTOR', () => {
  it('matches a language-classed fence and nothing else', () => {
    const positive = document.createElement('div');
    positive.innerHTML = '<pre><code class="language-python">x = 1</code></pre>';
    expect(hasCodeFence(positive)).toBe(true);

    const bareCode = document.createElement('div');
    bareCode.innerHTML = '<code class="language-js">x</code>';
    expect(hasCodeFence(bareCode)).toBe(false);

    const unclassedFence = document.createElement('div');
    unclassedFence.innerHTML = '<pre><code>x</code></pre>';
    expect(hasCodeFence(unclassedFence)).toBe(false);

    const indirectChild = document.createElement('div');
    indirectChild.innerHTML = '<pre><div><code class="language-x">x</code></div></pre>';
    expect(hasCodeFence(indirectChild)).toBe(false);
  });

  it('is the literal selector the predicate uses', () => {
    expect(CODE_FENCE_SELECTOR).toBe('pre > code[class^="language-"]');
  });

  it('excludes a mermaid-only document — 007 already owns that fence (task 4.2, carried from 4.1)', () => {
    // The raw selector WOULD match (language-mermaid starts with language-) — the control that
    // makes the negative below meaningful rather than an artefact of an empty document. Mirrors
    // `codeEnhancer.test.ts`'s own mermaid-exclusion test shape (4.1).
    const mermaidOnly = document.createElement('div');
    mermaidOnly.innerHTML = '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>';
    expect(mermaidOnly.querySelectorAll(CODE_FENCE_SELECTOR)).toHaveLength(1);
    expect(hasCodeFence(mermaidOnly)).toBe(false);

    // CONTROL: a mermaid fence ALONGSIDE a real code fence still detects — the exclusion is
    // per-fence, not a document-wide "any mermaid present" veto.
    const mixed = document.createElement('div');
    mixed.innerHTML =
      '<pre><code class="language-mermaid">graph TD; A--&gt;B;</code></pre>' +
      '<pre><code class="language-javascript">const a = 1;</code></pre>';
    expect(hasCodeFence(mixed)).toBe(true);
  });
});

describe('loadCodeEngine — the feature-detect gate (D-3, §4)', () => {
  it('does NOT invoke the loader on a fence-free document — with the control that it CAN be invoked', async () => {
    const { module, createHighlighterCore } = fakeCodeEngineModule();
    const loader = vi.fn(async () => module);

    // The negative claim: no fence ⇒ the engine import is never evaluated. The CALL COUNT is
    // asserted first and deliberately: a regression reds in the defect's own units
    // ("expected 0, got 1") rather than on the returned value's shape.
    const engine = await loadCodeEngine(rootWithoutFence(), loader);
    expect(loader).toHaveBeenCalledTimes(0);
    expect(createHighlighterCore).toHaveBeenCalledTimes(0);
    expect(engine).toBeNull();

    // The control, in the SAME test and on the SAME spy: the ONLY variable changed is the
    // presence of a fence. If this does not fire, the zero above measured a disconnected spy,
    // not a gate.
    const loaded = await loadCodeEngine(rootWithFence(), loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(createHighlighterCore).toHaveBeenCalledTimes(1);
    expect(loaded).not.toBeNull();
  });

  it('returns the highlighter the loader produced', async () => {
    const { module, highlighter } = fakeCodeEngineModule();
    const loaded = await loadCodeEngine(rootWithFence(), async () => module);
    expect(loaded).toBe(highlighter);
  });
});

describe('D-3 — the configured engine is createJavaScriptRegexEngine, never the default', () => {
  it('passes createHighlighterCore the EXACT object createJavaScriptRegexEngine returned', async () => {
    const spy = vi.mocked(createJavaScriptRegexEngine);
    spy.mockClear();

    const { module, createHighlighterCore } = fakeCodeEngineModule();
    await loadCodeEngine(rootWithFence(), async () => module);

    expect(spy).toHaveBeenCalledTimes(1);
    const passedEngine = createHighlighterCore.mock.calls[0][0].engine;
    expect(passedEngine).toBe(spy.mock.results[0].value);
  });

  // ★ RED-FIRST PROOF (retro finding 5), run manually and pasted into the task report — not a
  // permanent fixture, because the swap under test is codeEngine.ts's own STATIC import binding,
  // not this test's mock. The procedure: temporarily change codeEngine.ts's
  // `import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'` to
  // `import { createOnigurumaEngine as createJavaScriptRegexEngine } from 'shiki/engine/
  // oniguruma'`, rerun this file, observe `expect(spy).toHaveBeenCalledTimes(1)` FAIL with
  // "number of calls: 0" (the mocked javascript-module export codeEngine.ts no longer calls),
  // then revert. See the task report for the captured failure output.
});

describe('languageInputFor / themeInputFor — resolving a bundled key (task 4.2)', () => {
  it('resolves a known bundled language/theme key to something loadLanguage/loadTheme can use', () => {
    expect(languageInputFor('javascript')).toBeDefined();
    expect(themeInputFor('github-dark')).toBeDefined();
  });

  it('resolves an unknown key to undefined — no throw, the caller decides what that means', () => {
    expect(languageInputFor('notarealanguage')).toBeUndefined();
    expect(themeInputFor('notarealtheme')).toBeUndefined();
  });
});

describe('engineVersion — the resolved Shiki version', () => {
  it('returns the RESOLVED shiki package version, read independently off disk', () => {
    const resolved = createRequire(import.meta.url).resolve('shiki/package.json');
    const onDisk = JSON.parse(readFileSync(resolved, 'utf8')) as { version: string };

    expect(engineVersion()).toBe(onDisk.version);
    expect(engineVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('codeToTokens — captured shape (plan risk 4, ground truth for a later task)', () => {
  it('tokenizes a trivial fixture with a real engine, real theme, real language', async () => {
    const { createHighlighterCore } = await import('shiki/core');
    const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript');
    const theme = (await import('shiki/themes/github-dark.mjs')).default;
    const lang = (await import('shiki/langs/javascript.mjs')).default;

    const highlighter = await createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      themes: [theme],
      langs: [lang],
    });

    const result = highlighter.codeToTokens("console.log('hi')", {
      lang: 'javascript',
      theme: 'github-dark',
    });

    // The shape smoke: structural, not a snapshot — a snapshot would pin colour hexes to this
    // exact theme build and red on every legitimate theme update. What must hold regardless of
    // theme: a 2D line/token array, each token carrying content + a colour.
    expect(Array.isArray(result.tokens)).toBe(true);
    expect(result.tokens.length).toBeGreaterThan(0);
    for (const line of result.tokens) {
      expect(Array.isArray(line)).toBe(true);
      for (const token of line) {
        expect(typeof token.content).toBe('string');
        expect(typeof token.offset).toBe('number');
        expect(typeof token.color).toBe('string');
      }
    }
    expect(typeof result.fg).toBe('string');
    expect(typeof result.bg).toBe('string');

    // The reassembled line text must equal the source line — no token boundary may drop or
    // duplicate a character (the property a later task's DOM adoption depends on holding).
    const reassembled = result.tokens.map((line) => line.map((t) => t.content).join('')).join('\n');
    expect(reassembled).toBe("console.log('hi')");
  });
});

// ── 013 task 5.8: the Peekover code theme ───────────────────────────────────────────────────────
//
// Every colour the theme can paint is a design token. The values are parsed from design/tokens.css
// at test time (light = :root, dark = :root + [data-theme="dark"]) and each is measured on
// --code-bg with the WCAG formula, bar 4.5:1. The real tokenizer then runs the six shipped
// languages and every emitted colour must be one of the theme's own tokens — so no scope can paint
// a colour this table did not measure.
describe('the Peekover code theme (013 task 5.8)', () => {
  const css = readFileSync(`${process.cwd()}/design/tokens.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const blockOf = (selector: string): Record<string, string> => {
    const at = css.indexOf(`${selector}{`);
    const body = css.slice(at + selector.length + 1, css.indexOf('}', at));
    return Object.fromEntries([...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((m) => [m[1], m[2].trim()]));
  };
  const LIGHT = blockOf(':root');
  const THEMES = { light: LIGHT, dark: { ...LIGHT, ...blockOf('[data-theme="dark"]') } };
  const tokenOf = (value: string): string => {
    const m = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (!m) throw new Error(`a Peekover theme colour that is not a design token: ${value}`);
    return m[1];
  };
  const PAINTED = [
    PEEKOVER_THEME.colors['editor.foreground'],
    ...PEEKOVER_THEME.tokenColors.map((rule) => rule.settings.foreground),
  ].map(tokenOf);

  it('is the default code theme, and the first in the picker', () => {
    expect(DEFAULT_SETTINGS.codeTheme).toBe(PEEKOVER_CODE_THEME);
    expect(CODE_THEME_IDS[0]).toBe(PEEKOVER_CODE_THEME);
    expect(themeInputFor(PEEKOVER_CODE_THEME)).toBeDefined();
    expect(tokenOf(PEEKOVER_THEME.colors['editor.background'])).toBe('--code-bg');
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`every colour it paints reaches 4.5:1 on --code-bg — ${theme}`, () => {
      const tokens = THEMES[theme];
      const rows = [...new Set(PAINTED)].map((t) => ({
        token: t,
        value: tokens[t],
        ratio: Math.round(contrastRatio(tokens[t], tokens['--code-bg']) * 100) / 100,
      }));
      for (const r of rows) expect(r.value, `${r.token} is in tokens.css`).toMatch(/^#[0-9a-f]{6}$/i);
      const below = rows.filter((r) => r.ratio < 4.5);
      expect(below.map((r) => `${r.token} ${r.value} on --code-bg ${tokens['--code-bg']}: ${r.ratio}:1 (${theme})`)).toEqual([]);
    });
  }

  it("the six shipped languages emit only the theme's own token colours", async () => {
    const { createHighlighterCore } = await import('shiki/core');
    const actual = await vi.importActual<typeof import('shiki/engine/javascript')>('shiki/engine/javascript');
    const hl = await createHighlighterCore({ engine: actual.createJavaScriptRegexEngine() });
    await hl.loadTheme(themeInputFor(PEEKOVER_CODE_THEME)!);
    const SAMPLES: Record<string, string> = {
      javascript: "// c\nimport { a } from './a.js';\nconst MAX = 42;\nexport function f(x) { return `s ${x}` + null + /r/g; }\nclass A extends B {}",
      python: '# c\ndef f(xs: list[str]) -> int:\n    return sum(1 for x in xs if x) or None',
      json: '{ "a": "b", "c": true, "d": 1, "e": null }',
      html: "<!-- c --><a class=\"x\" href='y'>t &amp; u</a>",
      css: '/* c */ .a #b:hover { width: 68ch; font-family: "L", serif; color: #fff !important; }',
      bash: '# c\nfor b in x y; do pnpm exec wxt -b "$b" --n 3; done',
    };
    const seen = new Set<string>();
    for (const [lang, code] of Object.entries(SAMPLES)) {
      await hl.loadLanguage(languageInputFor(lang)!);
      for (const line of hl.codeToTokens(code, { lang, theme: PEEKOVER_CODE_THEME }).tokens) {
        for (const token of line) seen.add(tokenOf(token.color ?? ''));
      }
    }
    expect([...seen].filter((t) => !PAINTED.includes(t))).toEqual([]);
    // Non-vacuous: every token kind the 3.1 mock shows was emitted.
    expect([...seen].sort()).toEqual(['--accent', '--code-num', '--code-str', '--code-type', '--ink', '--muted']);
  });
});

// ── 013 task 5.11: seven more grammars, on demand; fence aliases (the human's ruling R2) ────────
//
// A fence label resolves to a shipped grammar key through ONE function, `grammarKeyFor`: the label
// lowercased, an alias mapped to its key, anything else undefined, so an unknown label keeps the
// one failure surface it always had (plain text). `console` is deliberately NOT an alias of bash:
// a console transcript mixes prompts and program output, which the shell grammar would colour as
// code (Shiki ships a separate `shellsession` grammar for it, not shipped here).
describe('fence labels → grammar keys (013 task 5.11)', () => {
  const NEW = ['typescript', 'tsx', 'diff', 'yaml', 'markdown', 'toml', 'sql'];
  const ALIASES: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    py: 'python',
    yml: 'yaml',
    md: 'markdown',
  };

  it('every new language resolves to itself, with a loader', () => {
    for (const lang of NEW) {
      expect(grammarKeyFor(lang), lang).toBe(lang);
      expect(languageInputFor(lang), lang).toBeTypeOf('function');
    }
  });

  it('every alias resolves to its grammar key, and to that key’s own loader', () => {
    for (const [alias, key] of Object.entries(ALIASES)) {
      expect(grammarKeyFor(alias), alias).toBe(key);
      expect(languageInputFor(alias), alias).toBe(languageInputFor(key));
    }
  });

  it('matches regardless of case', () => {
    expect(grammarKeyFor('TypeScript')).toBe('typescript');
    expect(grammarKeyFor('YML')).toBe('yaml');
    expect(grammarKeyFor('Bash')).toBe('bash');
  });

  it('an unknown label, an empty one and an Object.prototype name resolve to nothing', () => {
    for (const label of ['rust', 'console', 'jsx', 'notarealanguage', '', 'constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(grammarKeyFor(label), JSON.stringify(label)).toBeUndefined();
      expect(languageInputFor(label), JSON.stringify(label)).toBeUndefined();
    }
  });
});

describe('the seven new grammars tokenize, in the Peekover theme’s own colours (013 task 5.11)', () => {
  const tokenOf = (value: string): string => {
    const m = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (!m) throw new Error(`a colour that is not a design token: ${value}`);
    return m[1];
  };
  const PAINTED = [PEEKOVER_THEME.colors['editor.foreground'], ...PEEKOVER_THEME.tokenColors.map((r) => r.settings.foreground)].map(tokenOf);

  /** label → [sample, [token text, the design token it must be painted in]...] */
  const CASES: Record<string, [string, [string, string][]]> = {
    typescript: ['interface Doc { size: number }\nconst d: Doc = { size: 1 };', [['Doc', '--code-type'], ['number', '--code-type'], ['interface', '--accent']]],
    tsx: ['const el = <Note title="x">hi</Note>;\ntype P = { n: number };', [['Note', '--code-type'], ['title', '--code-type'], ['number', '--code-type']]],
    diff: ['--- a/doc.md\n+++ b/doc.md\n@@ -1 +1 @@\n-old line\n+new line', [['-old line', '--code-num'], ['+new line', '--code-str']]],
    yaml: ['name: peekover\nfiles: 42\nprivate: true', [['name', '--code-type'], ['files', '--code-type'], ['42', '--code-num']]],
    markdown: ['# Heading one\n\nSome *text* and `code`.', [['# Heading one', '--accent']]],
    toml: ['[package]\nname = "peekover"\nfiles = 42', [['name', '--code-type'], ['files', '--code-type'], ['"peekover"', '--code-str'], ['42', '--code-num']]],
    // Lowercase keywords: UNDER NODE the JS regex engine leaves UPPERCASE `SELECT` / `FROM` / `WHERE`
    // unscoped (the grammar's `(?i:…)` group); Chromium and Firefox scope both, which
    // tests/browser/codeLanguages.browser.test.ts proves — decisions.md, "M13 TASK 5.11".
    sql: ['select name from docs where size > 42;', [['select', '--accent'], ['from', '--accent'], ['where', '--accent'], ['42', '--code-num']]],
  };

  it('each sample paints its named tokens, and only the theme’s own colours', async () => {
    const { createHighlighterCore } = await import('shiki/core');
    const actual = await vi.importActual<typeof import('shiki/engine/javascript')>('shiki/engine/javascript');
    const hl = await createHighlighterCore({ engine: actual.createJavaScriptRegexEngine() });
    await hl.loadTheme(themeInputFor(PEEKOVER_CODE_THEME)!);
    const wrong: string[] = [];
    const stray = new Set<string>();
    for (const [lang, [code, expected]] of Object.entries(CASES)) {
      await hl.loadLanguage(languageInputFor(lang)!);
      const tokens = hl.codeToTokens(code, { lang: grammarKeyFor(lang)!, theme: PEEKOVER_CODE_THEME }).tokens.flat();
      for (const t of tokens) if (!PAINTED.includes(tokenOf(t.color ?? ''))) stray.add(`${lang}: "${t.content}" ${t.color}`);
      for (const [text, want] of expected) {
        const hit = tokens.find((t) => t.content.trim() === text);
        const got = hit ? tokenOf(hit.color ?? '') : 'NO SUCH TOKEN';
        if (got !== want) wrong.push(`${lang}: "${text}" painted ${got}, want ${want}`);
      }
    }
    expect(wrong).toEqual([]);
    expect([...stray]).toEqual([]);
  });

  it('an alias tokenizes exactly as its grammar does', async () => {
    const { createHighlighterCore } = await import('shiki/core');
    const actual = await vi.importActual<typeof import('shiki/engine/javascript')>('shiki/engine/javascript');
    const hl = await createHighlighterCore({ engine: actual.createJavaScriptRegexEngine() });
    await hl.loadTheme(themeInputFor(PEEKOVER_CODE_THEME)!);
    const code = 'const n: number = 42;';
    await hl.loadLanguage(languageInputFor('ts')!);
    const viaAlias = hl.codeToTokens(code, { lang: grammarKeyFor('ts')!, theme: PEEKOVER_CODE_THEME }).tokens;
    const viaKey = hl.codeToTokens(code, { lang: 'typescript', theme: PEEKOVER_CODE_THEME }).tokens;
    expect(viaAlias).toEqual(viaKey);
    expect(viaAlias.flat().some((t) => t.color === 'var(--code-type)'), 'the alias produced no type colour').toBe(true);
  });
});
