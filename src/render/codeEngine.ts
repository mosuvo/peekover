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
// ── ONE DYNAMIC EDGE, TWO STATIC LEAVES (D-2's fence, task 4.5) ───────────────────────────────
//
// `import('shiki/core')` is the ONE dynamic edge in this module, evaluated only once
// {@link hasCodeFence} has already seen a fence — the mirror of `diagramEngine.ts`'s
// `import('mermaid')`. `shiki/package.json` (a version-only JSON leaf) and `shiki/engine/
// javascript` (the pure-JS engine factory — no WASM, no grammar tables) are read STATIC and
// EAGER: both are cheap enough that deferring them buys nothing, and `codeImportFence.test.ts`
// names them as the two permitted static, non-dynamic specifiers alongside the one dynamic edge.
//
// ── THE INJECTABLE LOADER (retro finding 1) ───────────────────────────────────────────────────
//
// `loadCodeEngine` takes an injected loader, mirroring `diagramEngine.ts`'s `EngineLoader`: a
// unit test can assert the CALL COUNT of a spy it owns, without pulling the real engine into
// jsdom. An un-called spy and a missing spy look identical — the fence-free case is proven
// negative only alongside a fenced-root case that proves the SAME spy fires.
//
// ── NO THEMES OR LANGUAGES BAKED IN HERE ──────────────────────────────────────────────────────
//
// `createHighlighterCore` is created with an empty theme/language set. Shiki's `HighlighterCore`
// exposes `loadLanguage`/`loadTheme` for on-demand registration; a later task's per-fence
// language loading and D-9's theme picker call those against the ONE instance this module hands
// back, rather than this module pre-baking a set it does not yet own the choice of.

import shikiPkg from 'shiki/package.json';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlighterCore } from 'shiki/core';

/**
 * The fence markdown-it emits for a fenced code block carrying a language class, after
 * sanitization. Matches ONLY a `code` that is a DIRECT child of a `pre`, whose class starts with
 * `language-` — no bare `code`, no unlabelled fence, no `code` behind an intervening element
 * (D-6's retained-sibling structure needs a direct child to attach beside).
 */
export const CODE_FENCE_SELECTOR = 'pre > code[class^="language-"]';

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
 */
export function hasCodeFence(root: ParentNode): boolean {
  return root.querySelector(CODE_FENCE_SELECTOR) !== null;
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
