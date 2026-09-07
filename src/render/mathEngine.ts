// mathEngine — the ONE module in the tree that imports `temml`, and the gate that decides
// whether the engine is ever fetched at all (D-2-R). It owns three things and nothing else:
// the feature-detect, the engine's config lockdown (D-4-R), and nothing that renders on its
// own — group 4-R/5-R's enhancer takes the handle this module returns and drives
// render → sanitize → adopt.
//
// ── D-2-R: ONE IMPORTER, ONE STATIC LITERAL SPECIFIER ─────────────────────────────────────────
//
// `import('temml')` appears exactly once in the repository — below, inside {@link loadTemml} —
// and the specifier is a STATIC STRING LITERAL, the same shape `diagramEngine.ts:77` and
// `check-dynamic-imports.ts`'s own MUST_NOT_FIRE fixture ("bare-specifier lazy chunk") sanction.
// `mathImportFence.test.ts` proves the single-importer guarantee over the SOURCE TEXT, not over
// entry-point reachability — see that file's own header for why: unlike `diagramEnhancer.ts`/
// `codeEnhancer.ts`, no call site imports this module yet (that lands at 4.2-R/5.1-R), so an
// entry-walk fence would find `mathEngine.ts` unreached from EITHER graph and prove nothing.
//
// ── THE FEATURE-DETECT IS THE POINT, NOT A COURTESY ───────────────────────────────────────────
//
// §4: "when a document contains no math syntax, the system shall not load the math rendering
// engine." {@link loadMathEngine} checks {@link hasMathMarker} FIRST and returns `null` without
// touching the loader, so on the overwhelmingly common math-free document the dynamic import is
// never evaluated and temml's chunk is never fetched. The loader is INJECTABLE for exactly one
// reason: a unit test can assert the CALL COUNT of a spy it owns (an un-called spy and a missing
// spy look identical — retro 2026-07-27 finding 1, `diagramEngine.test.ts`'s own precedent),
// without pulling the real engine into jsdom.
//
// The two selectors below are 3.2-R's own landed marker shapes (`parse.ts`), not re-derived here:
// `<code class="peekover-math-inline">` for `$…$`, `<pre><code class="language-math">` for both
// `$$…$$` and a ` ```math ` fence (D-8-R's shared block/fence shape — one selector covers both,
// since a fence's `info` string never survives into the DOM).
//
// ── D-4-R: THE CONFIG LOCKDOWN, RE-DERIVED AGAINST REAL INSTALLED TEMML — NOT PORTED ──────────
//
// D-4's own KaTeX-era pins were `trust: false`, `throwOnError: true` (documented default, kept),
// `output: 'htmlAndMathml'`. Temml is a different engine with different option names and
// different defaults; each field below was re-derived by reading `node_modules/temml/src/
// Settings.js` and `node_modules/temml/temml.js` directly — carried plan-input (3), never
// assumed to mirror KaTeX's shape.
//
// `throwOnError: true` — THE LOAD-BEARING ONE. `temml.js`'s `renderToMathMLTree` wraps
// `parseTree`/`buildMathML` in a try/catch; a caught error goes to `renderError(error,
// expression, settings)` (`temml.js:103-111`), whose own first line is
// `if (options.throwOnError || !(error instanceof ParseError)) { throw error; }`. With
// `throwOnError: true` that condition is true UNCONDITIONALLY, so `renderError` re-throws on
// every failure — a malformed formula, a `\class`/`\href`-style trust rejection (below), or a
// genuine internal error — and NEVER reaches the branch that would otherwise build a
// `<span class="temml-error">` node styled with `errorColor` (`temml.js:107-110`, an HTML `Span`
// from `domTree.js`, not a MathML element the sanitizer profile enumerated). That branch is
// Temml's OWN error UI D-4-R's own text says a formula's failure must never reach; pinning
// `throwOnError: true` is what keeps it unreachable, so `errorColor` is deliberately absent
// below — it configures a code path this project's own pin makes dead.
//
// `trust: false` — Settings.js's own default (`Settings.js:48`), pinned EXPLICITLY rather than
// left unstated, per D-4-R's own "pin a security-relevant default explicitly rather than trust
// an unstated one" instruction. `Settings.prototype.isTrusted` (`Settings.js:70-80`) is what
// `\class`/`\id`/`\style`/`\data` (`functions/html.js:68-70`) and `\includegraphics`
// (`functions/includegraphics.js`) consult before letting LaTeX source reach a DOM attribute;
// with `trust: false` every one of those throws `Function "…" is not trusted` — 2.1-R's own
// finding (`sanitize.ts` RESULT), re-confirmed here as a genuine ablation in
// `mathEngine.test.ts` (trust flipped `true` in the test only, never in this file), not merely
// cited. `\href`/`\url` are separately unsupported function names outright in this Temml build
// (2.1-R's own finding) — not a trust question at all, so this pin does not need to (and cannot)
// cover them.
//
// `annotate: false` — Settings.js's own default (`Settings.js:37`), pinned explicitly for the
// SAME reason `trust` is: `sanitize.test.ts:967-969` (2.1-R's own 97-formula survey) already
// found and documented "temml's own default trust/annotate, both false ... the defaults 4.1-R
// will re-derive" — naming this field by name as this task's own obligation, not a field this
// task invented unprompted. D-5-R's sanitizer profile (2.1-R) confirmed `<semantics>`/
// `<annotation>` are ABSENT from Temml's real output specifically because `annotate` defaults
// false; a future Temml version flipping that default would start emitting a subtree the
// sanitizer profile's own enumerated allow-list does not admit, silently stripped rather than
// silently drifting the profile itself. Pinning it here, asserted by value in this file's own
// test, is what keeps that assumption from moving out from under `sanitize.ts` unnoticed.
//
// `output` — CORRECTLY ABSENT, not forgotten (D-4-R's own explicit VACATE). D-4's pin existed to
// keep KaTeX's dual HTML-visual/MathML-accessibility output both present in one string; Temml
// has no `output` option at all (absent from `Settings.js`'s full field list above) because
// MathML is the only output a MathML-output-strategy engine produces by construction. There is
// no configuration question here for a future reader to go looking for.
//
// `displayMode` is DELIBERATELY NOT part of the frozen base config: it is `true` for block/fence
// math and `false`/absent for inline math, a per-CALL fact group 4-R/5-R's own enhancer knows
// and this module does not. {@link mathEngineOptionsFor} merges it in per call, mirroring
// `diagramEngineConfigFor`'s per-theme merge shape (`diagramEngine.ts:417-419`) — the SAME base
// object every call starts from, so a config drift can only ever happen in ONE place.
//
// ── 4.3-R: THE ENGINE-LOAD-FAILURE GUARD IS {@link loadMathEngine}'S OWN CATCH SITE, ALREADY HERE ─
//
// D-4-R's "engine-failure" case (§3.9's first failure: the chunk fails to load, document-wide) is
// not new code — it is `mathEnhancer.ts`'s `renderMathBlocks` awaiting {@link loadMathEngine} inside
// a try/catch, so a rejected `import('temml')` (a 404, a CSP block, an exhausted retry) degrades
// every pending fence identically, in one place, because this function's own promise is the single
// seam every failure of that shape passes through. `tests/browser/mathDegrade.browser.test.ts`
// (task 4.3-R) proves the degradation, real engine, both browsers, RED-FIRST via a fixture-level
// ablation (the identical document rendering successfully once the injected rejecting loader is
// removed) rather than a fresh source-level revert of an already-precedented mechanism (D-8-R's own
// "reuse 007's sibling-figure machinery verbatim" — `diagramDegrade.browser.test.ts`'s own "6.1"
// block already earned that shape's red-first proof against `mermaid`, cited as standing precedent
// per AGENTS.md's own ablation rule). `tests/browser/mathNetwork.browser.test.ts` (same task) proves
// the OTHER half of D-4-R's own name for this task — that the exact call sequence this function
// gates (`import('temml')` here, `renderToString`/`sanitizeMath`/adopt/`registerMathFont` in
// `mathEnhancer.ts`) issues zero off-origin network, with a firing control specific to §3.7's own
// named font-fetch trap.

export const MATH_INLINE_SELECTOR = 'code.peekover-math-inline';
export const MATH_BLOCK_SELECTOR = 'pre > code.language-math';

/** The re-derived D-4-R lockdown. Every field here was read from real installed `temml@0.13.5`
 *  source, never ported from KaTeX's own D-4 shape. See the header above for each field's own
 *  justification. */
export interface MathEngineConfig {
  readonly trust: false;
  readonly throwOnError: true;
  readonly annotate: false;
}

/** What actually reaches `temml.renderToString` — the frozen config plus the one per-call fact
 *  it deliberately excludes. */
export interface MathEngineOptions extends MathEngineConfig {
  readonly displayMode: boolean;
}

/** The engine surface this project uses — `renderToString` only. Temml's `render(node, …)`
 *  mutates a DOM node directly and is never called: D-6-R's render → sanitize → adopt sequence
 *  needs a STRING to hand to `sanitizeMath`/DOMPurify before anything touches the live DOM. */
export interface MathEngine {
  renderToString(expression: string, options: MathEngineOptions): string;
}

/** The shape of the engine module. Injectable so tests never import the real engine into jsdom. */
export interface MathEngineModule {
  readonly default: MathEngine;
}

/** A function that produces the engine module. The default one is the only `import('temml')`. */
export type EngineLoader = () => Promise<MathEngineModule>;

/** D-4-R, frozen so a caller cannot mutate the guarantees it rests on. */
export const MATH_ENGINE_CONFIG: MathEngineConfig = Object.freeze({
  trust: false,
  throwOnError: true,
  annotate: false,
});

/**
 * The options for ONE render call: {@link MATH_ENGINE_CONFIG} plus that call's display mode.
 * Mirrors `diagramEngineConfigFor`'s per-variant frozen-merge shape (`diagramEngine.ts:417-419`)
 * — every call starts from the SAME base object, so the lockdown can only drift in one place.
 */
export function mathEngineOptionsFor(displayMode: boolean): MathEngineOptions {
  return Object.freeze({ ...MATH_ENGINE_CONFIG, displayMode });
}

/**
 * THE single `import('temml')` in the repository (D-2-R). A static string literal, evaluated
 * only when {@link loadMathEngine} has already seen a math marker.
 */
export const loadTemml: EngineLoader = () => import('temml');

/**
 * §4's feature-detect: does this subtree contain anything the engine would be needed for? Cheap,
 * DOM only, and the sole thing standing between a math-free document and temml's bytes. Matches
 * BOTH 3.2-R's marker shapes — inline `$…$` and block/fence `$$…$$`/` ```math ` (D-8-R's shared
 * shape means one selector covers both origins).
 */
export function hasMathMarker(root: ParentNode): boolean {
  return root.querySelector(`${MATH_INLINE_SELECTOR}, ${MATH_BLOCK_SELECTOR}`) !== null;
}

/**
 * Load the engine — but ONLY if `root` actually contains a math marker. Returns `null` on a
 * math-free document WITHOUT invoking `loader`, which is §4's "shall not load the math rendering
 * engine" stated as code rather than as an intention.
 *
 * `loader` is injectable for tests; production callers pass nothing and get {@link loadTemml}.
 * Unlike `loadDiagramEngine`, there is no `engine.initialize(config)` step: Temml is stateless —
 * `renderToString` takes its options per call (see {@link mathEngineOptionsFor}) — so this
 * function returns the engine handle unconfigured; the caller supplies options at each render.
 */
export async function loadMathEngine(
  root: ParentNode,
  loader: EngineLoader = loadTemml,
): Promise<MathEngine | null> {
  if (!hasMathMarker(root)) return null;
  return (await loader()).default;
}
