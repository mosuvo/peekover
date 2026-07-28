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
// `startOnLoad: false` is the fourth value, and it is a guard rather than a preference: the engine's
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
}

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

/** D-6 step 3, frozen so a caller cannot mutate the configuration the guarantees rest on. */
export const DIAGRAM_ENGINE_CONFIG: DiagramEngineConfig = Object.freeze({
  securityLevel: 'strict',
  htmlLabels: false,
  startOnLoad: false,
});

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
