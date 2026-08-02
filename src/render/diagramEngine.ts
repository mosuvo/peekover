// diagramEngine — the ONE module in the tree that imports `mermaid`, and the gate that decides
// whether the engine is ever fetched at all (plan 007 D-13). It owns three things and nothing else:
// the feature-detect, the engine's configuration, and the version string D-3's cache key needs.
// It renders nothing — D-6's render/sanitize/adopt sequence is group 3's enhancer, which takes the
// handle this module returns.
//
// ── D-13: ONE IMPORTER, ONE STATIC LITERAL SPECIFIER ──────────────────────────────────────────
//
// `import('mermaid')` appears exactly once in the repository — below, inside {@link loadMermaid} —
// and the specifier is a STATIC STRING LITERAL. That is the precise shape
// `scripts/check-dynamic-imports.ts` sanctions (its MUST_NOT_FIRE fixture at `:302`, "bare-specifier
// lazy chunk (spec §10 Shiki pattern)"): the bundler resolves it at BUILD time, so the chunk it names
// is inside the signed package by construction. The scanner therefore stays green **because the rule
// permits this shape, not because the rule is being avoided** — and 007 is the first code in the
// repository to exercise a rule written before it had any subject.
//
// The mirror is `diffEngine.ts`'s single-importer fence (006 §1.4), for the same reason: keeping the
// package's bytes off the content-script graph is a property of who imports it.
//
// ── THE FEATURE-DETECT IS THE POINT, NOT A COURTESY ───────────────────────────────────────────
//
// §4: "When a document contains no mermaid block, the system shall not load the diagram engine."
// {@link loadDiagramEngine} checks {@link hasDiagramFence} FIRST and returns `null` without touching
// the loader, so on the overwhelmingly common fence-free document the dynamic import is never
// evaluated and its chunk is never fetched. The loader is INJECTABLE for exactly one reason: a unit
// test can then assert the CALL COUNT of a spy it owns (an un-called spy and a missing spy look
// identical — retro 2026-07-27 finding 1), without pulling the real engine into jsdom.
//
// ── D-6 STEP 3: THE CONFIGURATION LIVES HERE ──────────────────────────────────────────────────
//
// `securityLevel: 'strict'` — deliberately NOT `'sandbox'`, which creates an iframe in the live
// document (verified in the engine's source) and breaks the string-return path D-6 step 4 adopts
// through. `htmlLabels: false` keeps the output pure SVG with no HTML subtree, which is what makes
// the §3.5 sanitizer profile's `foreignObject` denial cheap rather than lossy. NO ICON PACKS are
// registered — `registerIconPacks` is never called from anywhere in this tree, which is how "no icon
// packs" is enforced: by absence. `bindFunctions` is likewise never called (D-6 step 5); it attaches
// click handlers to a live SVG, which is the interactivity §3.11 declines.
//
// `suppressErrorRendering: true` is §3.8 stated as configuration (added by task 3.2, the first code
// to call `render`). Without it, a fence that fails to PARSE does not simply reject: mermaid draws
// its own error graphic — the "Syntax error in text" bomb — into the container and only then throws
// (`mermaid.core.mjs:1289,1308`). Our container is ours and goes in a `finally`, so that graphic
// could never be adopted; suppressing it at the source is nonetheless the honest expression of
// "showing the user their source is more useful than showing them a rendered apology" (spec §3.8),
// and it keeps the engine from laying out a diagram we have already decided to discard. The key is
// in the `secure` list below, so a `%%{init}%%` directive cannot turn the graphic back on.
//
// `startOnLoad: false` is the fifth value, and it is a guard rather than a preference: the engine's
// module body registers a `load` listener that calls `mermaid.run()` over the LIVE document when
// `startOnLoad` is true (its default), which would let the engine walk a page we never asked it to
// touch. We drive every render explicitly through our own container (D-6 step 1), so the auto-run
// path must be off. It is not a D-6 value; it protects D-6's premise.
//
// ── THE VERSION: A RESOLVED-PACKAGE READ, NOT A RUNTIME PROPERTY ──────────────────────────────
//
// D-3 composes the cache key as `hash + SEP + theme + SEP + engineVersion` and specifies the version
// be read from the engine rather than hardcoded. **Mermaid exposes no such runtime value:** its dist
// entry exports only `{ mermaid_default as default }`, and that object carries no `version` member —
// the number survives only build-inlined inside the renderer and in a lazy plugin chunk's
// un-re-exported `getVersion()`. So the version is read from the RESOLVED `mermaid/package.json`,
// per the D-3/D-13 amendment (`decisions.md`, 2026-07-28, commit `bddd5af`), which extends D-13 to
// permit this ONE additional static-literal specifier in this module and nowhere else.
//
// Two properties make that read honest rather than a hardcoded constant wearing a disguise: no human
// writes the number, and it re-derives from the *resolved* dependency on every build, so the
// Dependabot bump that D-3 exists to survive moves the key. Being a static string literal, the
// specifier passes the dynamic-import scanner on the same specifier-staticness rule that passes
// `import('mermaid')`.
//
// The import is STATIC and EAGER on purpose. It is deliberately NOT the dynamic
// `import('mermaid/package.json', { with: { type: 'json' } })` form: that builds clean (EXIT=0) and
// then ships a bare specifier plus an orphan chunk nothing references — silent-green-broken, proved
// by the amendment's own probe. The static form is inlined by the bundler and pulls NO engine code:
// `mermaid/package.json` is metadata, not the module graph's entry, so reading the version never
// costs the lazy chunk this file's whole design exists to defer.

import pkg from 'mermaid/package.json';
import type { EffectiveTheme } from '../settings/settings';

/**
 * The fence markdown-it emits for a ```mermaid block, after sanitization. Confirmed empirically, not
 * assumed: `parse.ts` installs no custom fence renderer, and `tests/golden/output/code.html:2` holds
 * markdown-it's default `<pre><code class="language-…">` shape in a committed golden file.
 */
export const DIAGRAM_FENCE_SELECTOR = 'pre > code.language-mermaid';

/** The subset of `MermaidConfig` this project sets. Every value is D-6 step 3's, or guards it. */
export interface DiagramEngineConfig {
  readonly securityLevel: 'strict';
  readonly htmlLabels: false;
  readonly startOnLoad: false;
  readonly suppressErrorRendering: true;
  /**
   * Typed as a MUTABLE `string[]` on purpose. Mermaid's own `MermaidConfig.secure` is
   * `string[]`, and TypeScript will not assign a `readonly string[]` to it — so declaring the
   * honest-looking `readonly string[]` here makes `DiagramEngineConfig` un-assignable to
   * `MermaidConfig`, and the real mermaid module stops satisfying {@link DiagramEngineModule}.
   * That would trade a real structural guarantee (the interface is a subset the engine
   * satisfies) for a cosmetic one. The array is frozen at RUNTIME instead — asserted in the
   * unit mirror — so the guarantee is kept where it actually bites.
   */
  readonly secure: string[];
  /**
   * The paint (007 §3.7 / D-7, the 9.1 walk finding). OPTIONAL because
   * {@link DIAGRAM_ENGINE_CONFIG} — the theme-free load-time configuration — deliberately carries
   * none: the mapping depends on which theme is about to be drawn, which is not known until a
   * fence is rendered. {@link diagramEngineConfigFor} is the one that sets it.
   */
  readonly themeVariables?: DiagramThemeVariables;
}

/**
 * A mermaid theme-variable map. `string | boolean` because `darkMode` is a boolean and every other
 * key is a colour; mermaid types the whole thing `any` (`config.type.d.ts:70`), so nothing stricter
 * is enforced at the boundary and the honest shape belongs here instead.
 */
export type DiagramThemeVariables = Readonly<Record<string, string | boolean>>;

/** What `mermaid.render()` resolves to. Declared for group 3; this module never calls `render`. */
export interface DiagramRenderResult {
  readonly svg: string;
  readonly bindFunctions?: (element: Element) => void;
}

/**
 * The engine surface this project uses — a structural subset of mermaid's `Mermaid`, so the real
 * module satisfies it and a test fake can too. Everything mermaid exposes that we deliberately do
 * NOT use (`run`, `init`, `contentLoaded`, `registerIconPacks`, `registerExternalDiagrams`) is
 * absent here by design: what the type does not name, no caller can reach by accident.
 */
export interface DiagramEngine {
  initialize(config: DiagramEngineConfig): void;
  render(id: string, definition: string, container?: Element): Promise<DiagramRenderResult>;
}

/** The shape of the engine module. Injectable so tests never import the real engine into jsdom. */
export interface DiagramEngineModule {
  readonly default: DiagramEngine;
}

/** A function that produces the engine module. The default one is the only `import('mermaid')`. */
export type EngineLoader = () => Promise<DiagramEngineModule>;

/**
 * D-6 step 3, frozen so a caller cannot mutate the configuration the guarantees rest on.
 *
 * ── `secure`: THE HARDENED LIST (decisions.md 2026-07-28, commit `16c7790`) ──────────────────
 *
 * `secure` names the config keys `config.sanitize()` DELETES from every `%%{init}%%` directive
 * before merging it. Mermaid's own default list is the first six entries below; the last four
 * are ours, and they close a LIVE pre-sanitize fetch route. Without them an untrusted markdown
 * author can inject arbitrary CSS into the engine's GENERATED `<style>`, and the engine fetches
 * the resulting `url(…)` DURING `render()` — inside D-6's measurement window, BEFORE
 * `sanitizeSvg` ever sees the string. Denying `<style>` downstream is therefore too late, and
 * `securityLevel: 'strict'` does not close it either ('loose' behaves identically). Proven
 * red-first over both live routes in `tests/browser/diagramSecure.browser.test.ts`:
 *
 *   `themeCSS`      — arbitrary CSS, verbatim. The live route is ORDINARY url()-bearing
 *                     properties (`background-image` et al), NOT `@import`, which mermaid's
 *                     constructed-stylesheet parse drops on its own.
 *   `fontFamily`    — interpolated into `:root{--mermaid-font-family: …}`; mermaid's
 *                     `sanitizeCss` only checks BRACE BALANCE, so a balanced payload passes.
 *   `altFontFamily` — the same interpolation, same guard, same hole.
 *   `themeVariables`— defense-in-depth: values are already pattern-guarded to a set admitting
 *                     no `:` and no `/`. Included anyway, at ONE ACCEPTED COST — an author's
 *                     `%%{init}%%` themeVariables stop applying. Deliberate: neither spec nor
 *                     plan promises author directives, and §3.7/D-7 make the effective theme
 *                     OURS to choose rather than the markdown author's.
 *
 * The list guards ITSELF: `sanitize()` iterates `['secure', ...siteConfig.secure]`, so a
 * `%%{init:{"secure":[]}}%%` cannot re-widen it. This constrains only DIRECTIVE-supplied keys —
 * a `themeCSS` we set here ourselves still applies, so this closes the route, not the feature.
 */
export const DIAGRAM_ENGINE_CONFIG: DiagramEngineConfig = Object.freeze({
  securityLevel: 'strict',
  htmlLabels: false,
  startOnLoad: false,
  suppressErrorRendering: true,
  // `as string[]` below concedes the TYPE to mermaid's mutable signature, never the guarantee:
  // the array is genuinely frozen (see {@link DiagramEngineConfig.secure}).
  secure: Object.freeze([
    // mermaid's own defaults — re-stated because `secure` REPLACES the default rather than
    // extending it, so dropping one here would silently un-secure `securityLevel` itself.
    'secure',
    'securityLevel',
    'startOnLoad',
    'maxTextSize',
    'suppressErrorRendering',
    'maxEdges',
    // ── ours: the CSS-bearing keys, per the header above ──
    'themeCSS',
    'fontFamily',
    'altFontFamily',
    'themeVariables',
  ]) as string[],
});

// ── §3.7 / D-7: THE PAINT IS OURS, AND UNTIL NOW WE NEVER CLAIMED IT ──────────────────────────
//
// The 9.1 human gate found the pie's title and legend and the gantt's date axis rendering
// near-black on near-black paper in dark mode. The cause was not a mis-set colour: the effective
// theme reached the CACHE KEY (`diagramCacheKey`) and nothing else, so the engine below was
// initialized from a theme-free constant and drew mermaid's default LIGHT picture at every theme.
// Dark mode was that light picture on dark paper — labels sitting on a mermaid FILL stayed legible
// (the fill came with them), labels sitting on the CANVAS did not. Measured pre-fix, dark:
// pie title and legend 1.14:1, gantt tick and title 1.45:1, gantt section title 1.32:1; the same
// five labels on light, 12–20:1. That asymmetry is the whole defect.
//
// It also means D-1/D-6's addendum ("the theme rides in the `<style>`, so a flip re-renders and
// the cache key is meaningful") described an intention rather than a fact: the two renderings were
// byte-identical. This is the change that makes it true, and D-7's flip machinery — which was
// correct all along — finally has two different pictures to swap between.
//
// ── WHY OUR TOKENS AND NOT `theme: 'dark'` ───────────────────────────────────────────────────
//
// §3.7/D-7 make the effective theme OURS to choose (decisions.md, the D-6 `secure` entry), and a
// diagram is part of the reading column, not a guest in it. mermaid's own dark theme is a coherent
// palette — of somebody else's brand. The reader is paper/ink/one-highlighter, so the diagram is
// painted from the SAME tokens as the prose beside it.
//
// ── THE HEX IS TRANSCRIBED, NOT INVENTED ─────────────────────────────────────────────────────
//
// `design/tokens.css` is the source of truth and `readerCss.ts:30-52` already copies it verbatim
// for the same reason this does: these values cross into a context that cannot resolve a CSS
// custom property. mermaid interpolates them into a stylesheet it GENERATES and runs colour maths
// (khroma) over some of them, so `var(--ink)` is not a value it can accept. Any token edit must
// land in all three places; `design/tokens.css` remains the one that decides.
//
// ── EVERY KEY BELOW EARNED ITS PLACE BY MEASUREMENT ──────────────────────────────────────────
//
// Not a transcription of mermaid's documentation. Each key was added because a real diagram went
// unreadable without it, and the set was ABLATED afterwards — `nodeBkg`, `arrowheadColor`,
// `labelBackground` and `stateLabelColor` were all dropped when removing them changed no
// measurement, and `compositeBackground`/`compositeTitleBackground`/`altBackground` were kept
// because removing them put a composite state's label at 1.02:1.
//
// The keys are LEAF keys, deliberately, and that is a property of mermaid's theme machinery rather
// than a style choice: `theme-default`'s `calculate()` applies overrides, runs `updateColors()`,
// then applies the overrides AGAIN (`chunk-WYO6CB5R.mjs:1180-1187`). A leaf key therefore survives;
// a base key like `primaryColor` is consumed by the derivation and silently overwritten for the
// keys `theme-default` hardcodes. Setting `primaryTextColor` alone was measured doing nothing to
// the gantt's axis.
//
// ★ THE PAIRING RULE, which is what makes this a legibility fix rather than a colour change: a text
// colour is only ever moved TOGETHER WITH the fill it sits on. Flipping label ink to near-white
// without darkening the node behind it was measured at 1.02:1 — a worse defect than the one being
// fixed, and the reason this map names fills at all.

/** One theme's slice of `design/tokens.css`, in the spellings the diagram paint needs. */
interface DiagramTokens {
  readonly paper: string;
  readonly panel: string;
  readonly ink: string;
  readonly line: string;
  readonly muted: string;
  /** The highlighter, and the LITERAL dark ink that goes on it. `--hl` is yellow in EVERY theme,
   *  so text on it must never be `--ink` — `readerCss.ts:124-126`'s trap guard, which mermaid's
   *  note sticky (`noteBkgColor`) walks straight into. */
  readonly hl: string;
  readonly hlInk: string;
  readonly darkMode: boolean;
}

/** `design/tokens.css` — verbatim. Sepia takes the light palette except for the two values the
 *  token file actually overrides (`--paper`, `--ink`), which is exactly what the stylesheet does. */
const DIAGRAM_TOKENS: Readonly<Record<EffectiveTheme, DiagramTokens>> = Object.freeze({
  light: {
    paper: '#FBFBF8', panel: '#F4F4EF', ink: '#16171F', line: '#E6E6DF', muted: '#5D6070',
    hl: '#FFE94A', hlInk: '#26210a', darkMode: false,
  },
  dark: {
    paper: '#12141C', panel: '#181B26', ink: '#EAEBF3', line: '#262A38', muted: '#A0A4B8',
    hl: '#FFD84D', hlInk: '#191504', darkMode: true,
  },
  sepia: {
    paper: '#F6EEDF', panel: '#F4F4EF', ink: '#3B2F1E', line: '#E6E6DF', muted: '#5D6070',
    hl: '#FFE94A', hlInk: '#26210a', darkMode: false,
  },
});

/**
 * One theme's tokens as mermaid theme variables. Grouped by WHAT EACH ONE PAINTS, because the
 * grouping is the argument: a fill and the ink that lands on it are chosen together (see the
 * pairing rule above), and a key in the wrong group is a legibility bug waiting to happen.
 */
function themeVariablesFrom(t: DiagramTokens): DiagramThemeVariables {
  return Object.freeze({
    // mermaid's own light/dark switch — it decides the DIRECTION of every derived value we do not
    // name here (borders lighten rather than darken, and so on).
    darkMode: t.darkMode,
    background: t.paper,

    // ── boxes, and the ink inside them (the pairing rule) ──
    mainBkg: t.panel,
    nodeBorder: t.line,
    nodeTextColor: t.ink,
    clusterBkg: t.panel,
    clusterBorder: t.line,
    actorBkg: t.panel,
    actorBorder: t.line,
    actorTextColor: t.ink,
    classText: t.ink,
    stateBkg: t.panel,
    compositeBackground: t.panel,
    compositeTitleBackground: t.panel,
    altBackground: t.panel,

    // ── the note sticky: highlighter paper, literal dark ink (readerCss.ts's trap guard) ──
    noteBkgColor: t.hl,
    noteBorderColor: t.hl,
    noteTextColor: t.hlInk,

    // ── text drawn straight onto the canvas: the five labels the 9.1 walk was judging ──
    textColor: t.ink, // gantt date axis, class title, and the inherited default fill
    titleColor: t.ink, // gantt title + section titles, flowchart cluster labels
    signalTextColor: t.ink, // sequence message text — also broken on dark, not in the walk's list
    pieTitleTextColor: t.ink,
    pieLegendTextColor: t.ink,
    transitionLabelColor: t.ink,

    // ── the chip behind an edge label. mermaid's default is TRANSLUCENT
    // (`rgba(232,232,232,0.8)`), which composites to a mid-grey over dark paper and drags its own
    // label to 2.30:1. An opaque paper chip is the same shape at both themes. ──
    edgeLabelBackground: t.paper,
    labelBackgroundColor: t.paper,

    // ── strokes ──
    lineColor: t.muted,
  });
}

/**
 * The engine configuration for ONE effective theme: {@link DIAGRAM_ENGINE_CONFIG} plus that
 * theme's paint. Precomputed and frozen per theme rather than built per call — the render path
 * asks for one of these immediately before every `render()`, and there are exactly three answers.
 */
const DIAGRAM_ENGINE_CONFIGS: Readonly<Record<EffectiveTheme, DiagramEngineConfig>> = Object.freeze({
  light: Object.freeze({ ...DIAGRAM_ENGINE_CONFIG, themeVariables: themeVariablesFrom(DIAGRAM_TOKENS.light) }),
  dark: Object.freeze({ ...DIAGRAM_ENGINE_CONFIG, themeVariables: themeVariablesFrom(DIAGRAM_TOKENS.dark) }),
  sepia: Object.freeze({ ...DIAGRAM_ENGINE_CONFIG, themeVariables: themeVariablesFrom(DIAGRAM_TOKENS.sepia) }),
});

/**
 * The configuration to draw ONE fence at ONE effective theme.
 *
 * ★ Every theme returns the SAME KEY SET. That is not tidiness: `mermaid.initialize()` MERGES into
 * its site config rather than replacing it, so a key set at dark and merely absent at light would
 * survive the flip and paint the light picture with dark values. The themes differ in what the
 * keys are worth, never in which keys exist.
 *
 * `secure` still lists `themeVariables` (see {@link DIAGRAM_ENGINE_CONFIG}) and still must: that
 * list governs `%%{init}%%` DIRECTIVES, and the values here arrive through `initialize()`, which
 * the hardening deliberately leaves open ("a `themeCSS` WE set through `initialize()` still
 * applies, so the hardening blocks the DIRECTIVE route, not the feature" — decisions.md). The
 * markdown author still cannot repaint a diagram; we can, which is what §3.7 asks for.
 */
export function diagramEngineConfigFor(theme: EffectiveTheme): DiagramEngineConfig {
  return DIAGRAM_ENGINE_CONFIGS[theme];
}

/**
 * THE single `import('mermaid')` in the repository (D-13). A static string literal, evaluated only
 * when {@link loadDiagramEngine} has already seen a fence.
 */
export const loadMermaid: EngineLoader = () => import('mermaid');

/**
 * The resolved mermaid version, for D-3's cache key. Read from `mermaid/package.json` at build time
 * (see the header): mermaid publishes no runtime version, and a hardcoded constant is what D-3
 * forbids. A dependency bump moves this value, which is exactly what makes stale rows unreachable.
 */
export function engineVersion(): string {
  return pkg.version;
}

/**
 * §4's feature-detect: does this subtree contain anything the engine would be needed for? Cheap, DOM
 * only, and the sole thing standing between a fence-free document and the engine's bytes.
 */
export function hasDiagramFence(root: ParentNode): boolean {
  return root.querySelector(DIAGRAM_FENCE_SELECTOR) !== null;
}

/**
 * Load and configure the engine — but ONLY if `root` actually contains a mermaid fence. Returns
 * `null` on a fence-free document WITHOUT invoking `loader`, which is §4's "shall not load the
 * diagram engine" stated as code rather than as an intention.
 *
 * `loader` is injectable for tests; production callers pass nothing and get {@link loadMermaid}.
 * Configuration (D-6 step 3) is applied here, once, before the handle is returned, so no caller can
 * hold a differently-configured engine.
 */
export async function loadDiagramEngine(
  root: ParentNode,
  loader: EngineLoader = loadMermaid,
): Promise<DiagramEngine | null> {
  if (!hasDiagramFence(root)) return null;
  const engine = (await loader()).default;
  engine.initialize(DIAGRAM_ENGINE_CONFIG);
  return engine;
}
