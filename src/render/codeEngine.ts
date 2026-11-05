// codeEngine — the ONE module in the tree that imports Shiki's core, and the gate that decides
// whether the engine is ever fetched at all (plan 009 D-3). It owns three things and nothing else:
// the feature-detect, the engine choice — LOCKED to the pure-JS regex engine, never Oniguruma/WASM
// — and a bare highlighter core ready for a later task's per-fence language/theme loading. It
// renders nothing — D-4's direct-DOM adoption is group 4's enhancer, which takes the handle this
// module returns.
//
// ── D-3: THE ENGINE CHOICE IS LOCKED HERE, NOT LEFT TO SHIKI'S DEFAULT ────────────────────────
//
// Shiki's own top-level shorthands (`codeToHtml`, `createHighlighter`) default to the Oniguruma/
// WASM engine, which needs `'wasm-unsafe-eval'` in the extension's CSP — a manifest change this
// milestone forbids by construction (AGENTS.md #4). `createHighlighterCore` takes the engine
// EXPLICITLY instead, so `createJavaScriptRegexEngine()` is passed every time and neither
// shorthand is ever called from this file.
//
// ── LANGUAGE/THEME REGISTRATION: A CURATED, EXPLICITLY-BOUNDED SET — NOT SHIKI'S FULL CATALOG
//    (the bundle-bloat finding, task 4.2, measured not assumed) ───────────────────────────────
//
// `createHighlighterCore` (D-3's fine-grained, WASM-free entry) ships with NO language/theme
// registry attached — verified this session by calling `loadLanguage('javascript')` with a bare
// string, which throws. The FIRST fix tried was importing Shiki's own barrel manifests,
// `shiki/langs` / `shiki/themes` (each a map of every bundled grammar/theme's lazy loader) — and
// it was a real defect, caught by measurement, not by inspection: `shiki/langs` alone makes
// Vite/Rollup discover and chunk EVERY one of Shiki's ~700 language files as a build output
// (because the manifest's own source literally writes one `import()` per language), regardless of
// which are ever called at runtime. Built and measured: packed `.output` **13.6 MB** (AGENTS.md's
// budget: ≤5 MB) and the Chrome zip **2.99 MB** (this milestone's own stated bound: <2 MB) — a
// severe, standing-invariant-breaking regression, reverted before it reached a commit.
//
// The fix: {@link LANGUAGE_LOADERS}/{@link THEME_LOADERS} below are a SMALL, EXPLICIT, HAND-
// WRITTEN map — each entry its own literal `import('shiki/langs/<name>.mjs')` /
// `import('shiki/themes/<name>.mjs')` specifier (the exact per-file import shape
// `codeEngine.test.ts` already used at task 1.2 to capture `codeToTokens`'s shape, now the
// PRODUCTION pattern too), so Vite only ever discovers and chunks the languages/themes actually
// listed — proportional cost, not the whole catalog. Each loader is handed to `HighlighterCore`'s
// own `loadLanguage`/`loadTheme` UNRESOLVED (verified this session: both accept the bare lazy
// function directly, the same shape Shiki's own bundled-key loaders use, so no `.default`
// unwrapping is needed here). ★ **LANGUAGE_LOADERS IS A CURATED, EXPLICITLY BOUNDED SET** — six
// languages (`javascript`, `python`, `json`, `css`, `html`, `bash`) at 009; seven more at 013 task
// 5.11 (`typescript`, `tsx`, `diff`, `yaml`, `markdown`, `toml`, `sql` — the human's ruling R2 on
// 5.9's measured costs: each its own on-demand chunk, the content script untouched), plus fence
// aliases ({@link grammarKeyFor}). Growing it is a product decision made on measured bytes, one
// language at a time — never Shiki's whole catalog. An unlisted language degrades exactly like an unresolvable one always
// has (module header, below): `loadLanguage` no-ops on `undefined`, `codeToTokens` then raises,
// the caller's per-fence `try`/`catch` reads it the same way it reads any other tokenize failure —
// no special case.
//
// ★ **THEME_LOADERS IS A DIFFERENT SHAPE — MECHANICALLY SELECTED, NOT EDITORIALLY CURATED (task
//    5.2, D-9)** — tasks.md 5.2's own text rules out a hand-picked favorites list the way
// LANGUAGE_LOADERS above is one: *"the listbox offers ≥14 entries, drawn from Shiki's own bundled
// theme set (not hand-curated)"*. But the SAME bundle-bloat regression this section just described
// applies to themes too (`@shikijs/themes` 4.4.3 bundles 65 themes, 1,465,107 B total, measured
// this task) — so "not hand-curated" cannot mean "all of them" against a 5 MB `.output` ceiling
// with ~330 KB of headroom at this task's start. The rule actually used: **the 20 smallest bundled
// themes by raw `.mjs` byte size, ascending**, then swap out any candidate that fails a WCAG AA
// 4.5:1 contrast check (own `editor.background` vs. own `editor.foreground`, Shiki's own
// `normalizeTheme` fg/bg resolution — spec §4's a11y bullet, "every code theme meets contrast
// requirements against its own background") for the next-smallest theme that passes. Both criteria
// are objective and reproducible — a resource constraint and a measured a11y floor, not a taste
// call — which is what "not hand-curated" is read to mean here. One swap was needed:
// `solarized-light` (7,474 B, ratio 4.13:1) failed AA and was replaced by `vitesse-black`
// (15,243 B, ratio 14.59:1), the next-smallest passing candidate. Total: 217,343 B for all 20,
// ~204,598 B of which is new (`github-dark` was already shipped at 5.1). {@link CODE_THEME_IDS}
// exports the id list for `codeThemeControl.ts` to build its picker from, so that module never
// duplicates this one's catalog. Count and set are still open to 8.5's own future ruling, same as
// LANGUAGE_LOADERS above — this task fixes the SELECTION RULE, not a permanent catalog.
//
// ── THE DYNAMIC/STATIC EDGE COUNT — TASK 4.5's OWN PROSPECTIVE TEXT DOES NOT YET SURVIVE
//    CONTACT, NAMED HERE RATHER THAN SILENTLY CARRIED (task 4.2 finding) ──────────────────────
//
// tasks.md 4.5 (not yet implemented) predicts, prospectively, exactly ONE dynamic edge
// (`import('shiki/core')`) plus TWO static leaves (`shiki/package.json`, `shiki/engine/
// javascript`) across the whole tree. This file now adds SEVEN more dynamic edges (six language
// loaders, one theme loader), each its own literal specifier, plus a third PRE-EXISTING static
// leaf 4.5's text did not account for (the type-only `import type { HighlighterCore } from
// 'shiki/core'` a few lines down, which the same source-scanning fence counts as a static edge
// distinct from the dynamic `import('shiki/core')` inside {@link loadShikiCore}). Task 4.5's own
// text already anticipates its clause C needs adjustment ("this task must not copy
// `diagramImportFence.test.ts`'s `toHaveLength(1)` clause-C shape unadjusted") — this is that
// adjustment's real shape, left for 4.5 to measure and pin when it is actually written, not
// asserted here. D-3's own invariant — this file is the ONE module that names a `shiki/…`
// specifier — still holds: every new edge lands here, not in `codeEnhancer.ts`.
//
// ── THE INJECTABLE LOADER (retro finding 1) ───────────────────────────────────────────────────
//
// `loadCodeEngine` takes an injected loader, mirroring `diagramEngine.ts`'s `EngineLoader`: a
// unit test can assert the CALL COUNT of a spy it owns, without pulling the real engine into
// jsdom. An un-called spy and a missing spy look identical — the fence-free case is proven
// negative only alongside a fenced-root case that proves the SAME spy fires.
//
// ── A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE (carried from 4.1, resolved here) ──
//
// `CODE_FENCE_SELECTOR` matches `language-mermaid` too (it starts with `language-`), and
// `codeEnhancer.ts` excludes it in its own `codeFencesIn` (4.1's finding — see that module's
// header). This file had the SAME unscoped selector in {@link hasCodeFence} and was named there
// as a carried gap for whichever task first calls it for real: a mermaid-only document would
// otherwise make {@link loadCodeEngine} decide "yes, load Shiki" for nothing to highlight. Fixed
// below with the same literal class check, confined to this file (plan §2's "no interaction
// between the two engines is scoped" line forbids importing `diagramView.ts` to check the real
// attribute).

import shikiPkg from 'shiki/package.json';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type {
  HighlighterCore,
  LanguageRegistration,
  ThemeRegistrationAny,
  TokensResult,
} from 'shiki/core';

/** The shape every `shiki/langs/<name>.mjs` leaf's `.default` export actually has (verified
 *  against the installed 4.4.3's own `.d.mts` files — a single language file may register more
 *  than one grammar, e.g. embedded sub-languages). */
type LanguageLoader = () => Promise<{ default: LanguageRegistration | LanguageRegistration[] }>;

/** Same idea for `shiki/themes/<name>.mjs`. */
type ThemeLoader = () => Promise<{ default: ThemeRegistrationAny }>;

/** See the module header's "LANGUAGE/THEME REGISTRATION" section — curated, explicitly
 *  bounded. Each value is its own literal `import()` specifier so Vite only chunks THESE
 *  languages, never Shiki's full ~700-language catalog. */
const LANGUAGE_LOADERS: Readonly<Record<string, LanguageLoader>> = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  bash: () => import('shiki/langs/shellscript.mjs'),
  // 013 task 5.11 (the human's ruling R2, on 5.9's measured costs): seven more, each its own chunk,
  // fetched only when a fence of that language is highlighted. None imports another grammar.
  typescript: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
};

/**
 * Fence labels that name a shipped grammar by another common name (013 task 5.11). Each maps to a
 * {@link LANGUAGE_LOADERS} key, never to a new chunk. `console` is deliberately absent: a console
 * transcript mixes prompts with program output, which the shell grammar would colour as code.
 */
const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
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

/** The Peekover code theme's id — the DEFAULT code theme (013 task 5.8; the human's 2.2 ruling). */
export const PEEKOVER_CODE_THEME = 'peekover';

/**
 * The Peekover code theme (013 task 5.8): every colour is a design token, `var(--…)`, so one theme
 * follows the page theme — the reader's `:host` blocks (from `design/tokens.css`) resolve it to
 * light or dark with no re-highlight. Shiki 4.4.3's `normalizeTheme` accepts a non-hex colour:
 * it swaps in a placeholder for TextMate and maps it back on every token (`colorReplacements`),
 * so a token's colour arrives as the `var(--…)` string itself.
 *
 * The mapping (the 3.1 approval): default text, functions and tags `--ink`; keywords `--accent`
 * (ink; weight 500, `READER_CSS`); comments `--muted` (italic, `READER_CSS`); strings
 * `--code-str`; numbers and constants `--code-num`; types, attributes and property names
 * `--code-type`. A rule listed later wins over an earlier one with the same depth (TextMate), and a
 * deeper scope wins over a shallower one — so the "default text" rules below carve operators,
 * template expressions, CSS units and selectors back out of the broader keyword / string / type
 * rules.
 */
export const PEEKOVER_THEME = {
  name: PEEKOVER_CODE_THEME,
  type: 'light',
  colors: { 'editor.background': 'var(--code-bg)', 'editor.foreground': 'var(--ink)' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--muted)' } },
    { scope: ['keyword', 'storage', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.logical.python', 'variable.language'], settings: { foreground: 'var(--accent)' } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: 'var(--code-str)' } },
    { scope: ['constant', 'support.constant', 'variable.other.constant', 'keyword.other.unit'], settings: { foreground: 'var(--code-num)' } },
    { scope: ['entity.name.type', 'entity.name.class', 'entity.other.inherited-class', 'support.type', 'support.class', 'entity.other.attribute-name', 'punctuation.support.type.property-name'], settings: { foreground: 'var(--code-type)' } },
    { scope: ['keyword.operator', 'punctuation', 'meta.template.expression', 'entity.name.function', 'support.function', 'entity.name.tag', 'entity.other.attribute-name.class', 'entity.other.attribute-name.id', 'entity.other.attribute-name.pseudo-class', 'variable', 'string.unquoted', 'constant.other.option'], settings: { foreground: 'var(--ink)' } },
    // 013 task 5.11 — the new grammars' own scopes, from the same six tokens. Each is deeper than the
    // rule it would otherwise fall under, so it wins: YAML and TOML keys are property names
    // (`--code-type`, as JSON's); a Markdown heading, its `#` included, is `--accent` (ink, 500);
    // a diff's added line `--code-str` and removed line `--code-num`, each with its +/- marker.
    { scope: ['entity.name.tag.yaml', 'variable.other.key.toml'], settings: { foreground: 'var(--code-type)' } },
    { scope: ['markup.heading', 'punctuation.definition.heading.markdown'], settings: { foreground: 'var(--accent)' } },
    { scope: ['markup.inserted', 'punctuation.definition.inserted'], settings: { foreground: 'var(--code-str)' } },
    { scope: ['markup.deleted', 'punctuation.definition.deleted'], settings: { foreground: 'var(--code-num)' } },
  ],
};

/** Same shape as {@link LANGUAGE_LOADERS}, for themes — see the module header's "THEME_LOADERS IS
 *  A DIFFERENT SHAPE" section for the selection rule (20 smallest bundled themes by byte size,
 *  contrast-filtered, not editorially curated). The Peekover theme (013 task 5.8) comes first:
 *  it is the default, built here from the design tokens rather than drawn from Shiki's set. */
const THEME_LOADERS: Readonly<Record<string, ThemeLoader>> = {
  [PEEKOVER_CODE_THEME]: async () => ({ default: PEEKOVER_THEME as ThemeRegistrationAny }),
  'min-dark': () => import('shiki/themes/min-dark.mjs'),
  red: () => import('shiki/themes/red.mjs'),
  'min-light': () => import('shiki/themes/min-light.mjs'),
  'solarized-dark': () => import('shiki/themes/solarized-dark.mjs'),
  monokai: () => import('shiki/themes/monokai.mjs'),
  horizon: () => import('shiki/themes/horizon.mjs'),
  'horizon-bright': () => import('shiki/themes/horizon-bright.mjs'),
  andromeeda: () => import('shiki/themes/andromeeda.mjs'),
  'dark-plus': () => import('shiki/themes/dark-plus.mjs'),
  'slack-dark': () => import('shiki/themes/slack-dark.mjs'),
  plastic: () => import('shiki/themes/plastic.mjs'),
  'slack-ochin': () => import('shiki/themes/slack-ochin.mjs'),
  'light-plus': () => import('shiki/themes/light-plus.mjs'),
  laserwave: () => import('shiki/themes/laserwave.mjs'),
  'github-light': () => import('shiki/themes/github-light.mjs'),
  'github-dark': () => import('shiki/themes/github-dark.mjs'),
  vesper: () => import('shiki/themes/vesper.mjs'),
  'aurora-x': () => import('shiki/themes/aurora-x.mjs'),
  'vitesse-light': () => import('shiki/themes/vitesse-light.mjs'),
  'vitesse-black': () => import('shiki/themes/vitesse-black.mjs'),
};

/** Every theme id {@link THEME_LOADERS} resolves, in the map's own declared (byte-ascending)
 *  order — `codeThemeControl.ts`'s listbox source, so the picker's catalog and the engine's
 *  loader map can never drift apart into two lists naming different themes. */
export const CODE_THEME_IDS: readonly string[] = Object.freeze(Object.keys(THEME_LOADERS));

/** Re-exported so `codeEnhancer.ts` (D-3) never names a `shiki/…` specifier of its own — it gets
 *  the engine handle's type and `codeToTokens`'s return shape through this module's own exports,
 *  the same as it already gets {@link loadCodeEngine}'s value. */
export type { HighlighterCore, TokensResult };

/**
 * The fence markdown-it emits for a fenced code block carrying a language class, after
 * sanitization. Matches ONLY a `code` that is a DIRECT child of a `pre`, whose class starts with
 * `language-` — no bare `code`, no unlabelled fence, no `code` behind an intervening element
 * (D-6's retained-sibling structure needs a direct child to attach beside).
 */
export const CODE_FENCE_SELECTOR = 'pre > code[class^="language-"]';

/** See the module header's "A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE" section.
 *  Mirrors `codeEnhancer.ts`'s own private copy of the same literal (each module keeps its own,
 *  per plan §2 — no import between the two engines is scoped). */
const MERMAID_FENCE_CLASS = 'language-mermaid';

/** The shape of the `shiki/core` module this file needs. Injectable so tests never import the
 *  real module graph into jsdom. */
export interface CodeEngineModule {
  readonly createHighlighterCore: (typeof import('shiki/core'))['createHighlighterCore'];
}

/** A function that produces the `shiki/core` module. The default one is the only
 *  `import('shiki/core')` in the repository. */
export type EngineLoader = () => Promise<CodeEngineModule>;

/** THE single `import('shiki/core')` in the repository (D-2/D-3), evaluated only when
 *  {@link loadCodeEngine} has already seen a fence via {@link hasCodeFence}. */
export const loadShikiCore: EngineLoader = () => import('shiki/core');

/**
 * The resolved Shiki version. Read from `shiki/package.json` at build time — a static leaf, not
 * the engine's runtime code, so reading it never costs the lazy `shiki/core` chunk.
 */
export function engineVersion(): string {
  return shikiPkg.version;
}

/**
 * §4's feature-detect: does this subtree contain a fenced code block at all? Cheap, DOM only,
 * and the sole thing standing between a fence-free document and the engine's bytes.
 *
 * EXCLUDES a mermaid fence (module header) — `enhanceDiagrams` already owns it, and a
 * mermaid-only document has nothing for this engine to highlight.
 */
export function hasCodeFence(root: ParentNode): boolean {
  for (const code of root.querySelectorAll(CODE_FENCE_SELECTOR)) {
    if (!code.classList.contains(MERMAID_FENCE_CLASS)) return true;
  }
  return false;
}

/**
 * Resolve a `language-…` class suffix to this file's curated lazy `LanguageInput` loader, or
 * `undefined` if the key names no CURATED grammar (module header — this is deliberately NOT
 * "no bundled grammar"; Shiki ships far more than {@link LANGUAGE_LOADERS} lists). `undefined` is
 * a normal result, not a bug: the caller skips `engine.loadLanguage` on it, and `codeToTokens` is
 * what actually raises for an unloaded language — one failure surface, not two.
 */
export function languageInputFor(lang: string): LanguageLoader | undefined {
  const key = grammarKeyFor(lang);
  return key === undefined ? undefined : LANGUAGE_LOADERS[key];
}

/**
 * A fence label → the shipped grammar key it names, or `undefined` (013 task 5.11). Lowercased
 * first (every key and alias is lowercase, so no two labels collide), then an alias is mapped to its
 * key. Own properties only, so `constructor` or `__proto__` never resolve through `Object.prototype`.
 * The highlighter is asked for this KEY, not the raw label, so an alias tokenizes exactly as its grammar.
 */
export function grammarKeyFor(lang: string): string | undefined {
  const label = lang.toLowerCase();
  const key = Object.hasOwn(LANGUAGE_ALIASES, label) ? LANGUAGE_ALIASES[label] : label;
  return Object.hasOwn(LANGUAGE_LOADERS, key) ? key : undefined;
}

/**
 * Resolve a code-theme id to this file's curated lazy `ThemeInput` loader, or `undefined` if the
 * id names no curated theme — same "no separate failure branch" property as
 * {@link languageInputFor}.
 */
export function themeInputFor(theme: string): ThemeLoader | undefined {
  return THEME_LOADERS[theme];
}

/**
 * Load and configure the engine — but ONLY if `root` actually contains a fenced code block.
 * Returns `null` on a fence-free document WITHOUT invoking `loader` — §4's "shall not load the
 * code engine" stated as code, not intention.
 *
 * `loader` is injectable for tests; production callers pass nothing and get {@link loadShikiCore}.
 * The JS-regex engine is passed EXPLICITLY (D-3) — never the `createHighlighter`/`codeToHtml`
 * top-level shorthand, which defaults to Oniguruma/WASM.
 */
export async function loadCodeEngine(
  root: ParentNode,
  loader: EngineLoader = loadShikiCore,
): Promise<HighlighterCore | null> {
  if (!hasCodeFence(root)) return null;
  const { createHighlighterCore } = await loader();
  return createHighlighterCore({ engine: createJavaScriptRegexEngine() });
}
