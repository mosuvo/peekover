// mathEnhancer — the synchronous prologue and the async render body for BOTH block/fence math
// (D-8-R, sibling-figure) and inline math (D-7-R, mutate-in-place) — one `enhanceMath(host)` call
// site per D-3-R, never two. Inline's own half (5.1-R) is added to this same file/function rather
// than a sibling one, exactly as D-3-R names.
//
// ── WHY THIS IS SIMPLER THAN diagramEnhancer.ts, AND WHERE THAT SIMPLICITY COMES FROM ───────────
//
// Three deliberate omissions, each cited rather than accidental:
//   1. NO CACHE (D-12-R) — group 7-R measures render timing before any cache is designed; a formula
//      always re-renders through the engine on every mount.
//   2. NO THEME RE-RENDER SUBSCRIPTION (D-9-R) — native MathML paints text via ordinary CSS `color`
//      inheritance (`currentColor`), unlike mermaid's baked-hex SVG output; a theme flip needs no JS
//      to repaint an already-rendered formula. This is a LEAN, task-measured
//      (`mathBlock.browser.test.ts`'s own contrast measurement), not assumed.
//   3. NO PER-RENDER ENGINE CONFIGURATION — Temml is stateless (`mathEngine.ts`'s own doc comment);
//      `mathEngineOptionsFor(true)` is the SAME frozen object merge on every call, unlike mermaid's
//      per-theme `initialize()`.
//
// ── THE FONT REGISTRATION LIVES HERE, NOT IN fonts.ts (D-13) ─────────────────────────────────────
//
// `registerMathFont()` (`../theme/mathFont`) is called from this module's own async render body —
// the ONLY call site, so the font's ~86 KB asset is reachable exclusively from this app-page-only
// graph (`readerPane.ts`/`appShell.ts`), never from `mount.ts`'s own unconditional
// `registerReaderFonts()` (which the content script reaches too — see `mathFont.ts`'s own header
// for why folding this into `fonts.ts` would break the content-script byte invariant). Registration
// is fire-and-forget (idempotent, non-blocking): a formula can start laying out before the face
// finishes loading, and the CSS `font-family` fallback stack (`mathCss.ts`, injected by
// `ensureMathStyle` below — a SECOND `<style>`, never folded into the shared `readerCss.ts`;
// see `mathCss.ts`'s own header for the real content-script leak this avoids) degrades to the
// browser's own generic math font in that window — never a blank formula.

import {
  MATH_BLOCK_SELECTOR,
  MATH_INLINE_SELECTOR,
  loadMathEngine,
  mathEngineOptionsFor,
  type EngineLoader,
  type MathEngine,
} from './mathEngine';
import { sanitizeMath } from './sanitize';
import { registerMathFont } from '../theme/mathFont';
import { buildMathStyle } from '../theme/mathCss';
import {
  MATH_STATE_ATTR,
  insertMathPlaceholder,
  markMathFailed,
  markMathInlineFailed,
  markMathInlineRendered,
  markMathRendered,
} from './mathView';

/** Marks the extra `<style>` this module injects, so a second `enhanceMath` call on an
 *  already-styled shadow root does not append a duplicate sheet. */
const MATH_STYLE_MARKER = 'data-peekover-math-style';

/**
 * Inject {@link buildMathStyle}'s sheet into `shadow`, once. A SEPARATE `<style>` from the one
 * `mount.ts` commits (`READER_CSS`) — see `mathCss.ts`'s own header for why this cannot live
 * inside that shared, always-loaded stylesheet. Appended rather than prepended: cascade order
 * does not matter here (every selector below is scoped under `.peekover-math`/`math`, which
 * `READER_CSS` never targets), so there is no equal-specificity race to win by source order the
 * way `buildContainedStyle()` has to.
 */
function ensureMathStyle(shadow: ShadowRoot): void {
  if (shadow.querySelector(`style[${MATH_STYLE_MARKER}]`)) return;
  const style = buildMathStyle();
  style.setAttribute(MATH_STYLE_MARKER, '');
  shadow.appendChild(style);
}

/** Options exist for the tests, and for one thing: injecting the loader. Mirrors `EnhanceOptions`
 *  (`diagramEnhancer.ts`) — the import specifier stays a static literal (D-2-R) either way. */
export interface MathEnhanceOptions {
  readonly loader?: EngineLoader;
}

/** The pair D-8-R reuses: the retained source fence and its sibling figure. */
interface MathPair {
  readonly pre: HTMLElement;
  readonly figure: HTMLElement;
}

/** §3.9's failures, in the words the inline marker shows (this task builds the structure; 4.3-R
 *  proves each red-first, real-engine). */
const ENGINE_LOAD_FAILED = 'the math engine could not be loaded';
const RENDER_FAILED = 'this formula could not be rendered';
const SANITIZE_REJECTED = 'the rendered formula was rejected by the sanitizer';

/** One formula's outcome: rendered content ready to adopt, or the §3.9 reason it did not. */
type MathOutcome = { readonly content: DocumentFragment } | { readonly failure: string };

/**
 * The source <pre> of every block/fence math marker under `root`, in document order. Mirrors
 * `diagramFencesIn` exactly — `MATH_BLOCK_SELECTOR` matches the <code>, the <pre> parent is what
 * D-8-R hides and what the placeholder sits beside.
 */
export function mathFencesIn(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll(MATH_BLOCK_SELECTOR),
    (code) => code.parentElement as HTMLElement,
  );
}

/**
 * Read a fence's bare LaTeX source, peeling `$$…$$` for dollar-block origin ONLY — never for fence
 * origin, whose content `parse.ts` passes unpeeled (`parse.ts:140-142`, D-8-R). One selector covers
 * both origins (a fence's `info` string never survives into the DOM, `mathEngine.ts`'s own header),
 * so this is a CONTENT-SHAPE test, not an origin-metadata one: content that is both `$$`-prefixed
 * and `$$`-suffixed is dollar-block-origin; anything else (including a bare fence's raw text) is
 * used as-is. `textContent`, never markup — the source is untrusted and must never be re-parsed.
 */
export function mathSourceOf(pre: Element): string {
  const raw = pre.querySelector('code')?.textContent ?? '';
  if (raw.length >= 4 && raw.startsWith('$$') && raw.endsWith('$$')) {
    return raw.slice(2, -2);
  }
  return raw;
}

/**
 * Every inline math marker under `root`, in document order (D-7-R). Mirrors `mathFencesIn`'s own
 * shape, but there is no `<pre>` parent to climb to — the `<code class="peekover-math-inline">`
 * element itself is both the source and, on success, the mutated target.
 */
export function mathInlineMarkersIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(MATH_INLINE_SELECTOR));
}

/**
 * Read an inline marker's bare LaTeX source. `parse.ts`'s own marker (`parse.ts:114`) wraps content
 * in a single leading/trailing `$` (never `$$` — that shape is block/fence-only, D-8-R), so this
 * peels exactly those two delimiter characters, content-shape only, never origin metadata.
 * `textContent`, never markup — same untrusted-source discipline as {@link mathSourceOf}.
 */
export function mathInlineSourceOf(code: Element): string {
  const raw = code.textContent ?? '';
  return raw.length >= 2 && raw.startsWith('$') && raw.endsWith('$') ? raw.slice(1, -1) : raw;
}

/**
 * D-6-R's render -> sanitize -> adopt sequence, for one formula — shared by block/fence AND inline
 * (only `displayMode` differs between them, D-4-R's own per-call fact). Extracted so every marker in
 * the loop below shares ONE implementation — mirrors `drawDiagram`'s own extraction, minus the
 * cache/theme parameters neither D-12-R nor D-9-R need here.
 *
 * Adoption mirrors `mount.ts:131-133`'s pattern: the sanitized string is parsed into a
 * `<template>`'s content (inert — no browsing context, so nothing in it can fetch), never assigned
 * to a live element. A fragment with no `<math>` root is a sanitize rejection, not a formula — the
 * same "never an empty box" check `adoptSanitizedSvg` performs for diagrams.
 */
function renderMathFormula(
  doc: Document,
  engine: MathEngine,
  source: string,
  displayMode: boolean,
): MathOutcome {
  let rendered: string;
  try {
    rendered = engine.renderToString(source, mathEngineOptionsFor(displayMode));
  } catch {
    return { failure: RENDER_FAILED };
  }
  try {
    const tpl = doc.createElement('template');
    tpl.innerHTML = sanitizeMath(rendered); // parsed inert: no browsing context -> nothing fetches
    if (!tpl.content.querySelector('math')) return { failure: SANITIZE_REJECTED };
    return { content: tpl.content };
  } catch {
    return { failure: SANITIZE_REJECTED };
  }
}

/**
 * The async body: register the font, load the engine once for BOTH block/fence and inline markers
 * (D-3-R's single call site — one engine load per `enhanceMath` invocation, never two), then draw
 * every pending marker.
 *
 * Sequential, in document order — Temml has no shared measuring container to race over the way
 * mermaid does (`renderDiagrams`'s own comment), but a document with many formulas should not fan
 * out an unbounded number of simultaneous engine calls on first paint either. Block/fence pairs are
 * drawn before inline markers; both loops are otherwise independent (a failure in one is invisible
 * to the other, per §4's isolation criterion).
 */
async function renderMath(
  doc: Document,
  shadow: ShadowRoot,
  pairs: readonly MathPair[],
  inline: readonly HTMLElement[],
  loader: EngineLoader | undefined,
): Promise<void> {
  registerMathFont(); // fire-and-forget; see the module header

  let engine: MathEngine | null;
  try {
    engine = await loadMathEngine(shadow, loader);
  } catch {
    // §3.9's first failure. Document-wide by nature: no marker got as far as having its own.
    for (const pair of pairs) markMathFailed(pair.pre, pair.figure, ENGINE_LOAD_FAILED);
    for (const code of inline) markMathInlineFailed(code, ENGINE_LOAD_FAILED);
    return;
  }
  if (!engine) return; // the feature-detect said no marker; the prologue disagrees, so do nothing.

  for (const pair of pairs) {
    const outcome = renderMathFormula(doc, engine, mathSourceOf(pair.pre), true);
    if ('failure' in outcome) {
      markMathFailed(pair.pre, pair.figure, outcome.failure);
      continue;
    }
    markMathRendered(pair.pre, pair.figure, outcome.content);
  }

  for (const code of inline) {
    const outcome = renderMathFormula(doc, engine, mathInlineSourceOf(code), false);
    if ('failure' in outcome) {
      markMathInlineFailed(code, outcome.failure);
      continue;
    }
    markMathInlineRendered(code, outcome.content);
  }
}

/**
 * D-3-R's entry point: put D-8-R's structure around every block/fence math marker, claim every
 * inline marker (D-7-R), schedule the render, and return.
 *
 * Called from both app-page mount paths and from nowhere else — `readerPane.ts` and `appShell.ts`,
 * immediately after `enhanceDiagrams` (D-3-R). The content script reaches neither, which is why a
 * math marker there renders as an ordinary `<code>`/`<pre>` with no affordance (3.1-R's own priced
 * behavioral cousin): the gate is the module graph, not a runtime check, and it is what keeps
 * `temml` and the STIX font off the content script entirely.
 *
 * No-ops on a host with no shadow root and on a document with no math markers at all — the
 * overwhelmingly common case. The empty-check return is in front of every await, so on a math-free
 * document neither `registerMathFont()` nor `loadMathEngine`'s dynamic `import('temml')` is ever
 * evaluated.
 *
 * Idempotent over an already-enhanced tree: a block/fence fence or an inline marker that already
 * carries `data-math` is skipped, so a second call cannot produce a second placeholder, a second
 * render, or a second `replaceChildren` of the same marker.
 *
 * Inline markers get NO synchronous structure inserted (D-7-R: "their pending state IS their
 * already-committed literal `$…$` text") — only `MATH_STATE_ATTR` is set on the element itself, to
 * claim it against a second, concurrent `enhanceMath` call before this one's async body settles.
 */
export function enhanceMath(host: HTMLElement, options: MathEnhanceOptions = {}): void {
  const shadow = host.shadowRoot;
  if (!shadow) return;

  const pairs: MathPair[] = [];
  for (const pre of mathFencesIn(shadow)) {
    if (pre.hasAttribute(MATH_STATE_ATTR)) continue;
    pairs.push({ pre, figure: insertMathPlaceholder(pre) });
  }

  const inline: HTMLElement[] = [];
  for (const code of mathInlineMarkersIn(shadow)) {
    if (code.hasAttribute(MATH_STATE_ATTR)) continue;
    code.setAttribute(MATH_STATE_ATTR, 'pending');
    inline.push(code);
  }

  if (pairs.length === 0 && inline.length === 0) return;

  ensureMathStyle(shadow);

  // Everything above is synchronous and already committed; everything below is off this stack.
  void renderMath(host.ownerDocument, shadow, pairs, inline, options.loader);
}
