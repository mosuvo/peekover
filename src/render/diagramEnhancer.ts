// diagramEnhancer — the synchronous prologue (007 D-12, D-15) and the async render body (D-6).
// Given a reader host that mount() has already committed, it finds the mermaid fences, puts D-15's
// structure around each one, and RETURNS; the engine load, the render, the sanitize and the
// adoption all happen afterwards, off the caller's stack.
//
// ── WHY THE ENTRY POINT IS SYNCHRONOUS, AND WHY THAT IS A CONSTRAINT RATHER THAN A STYLE ──────
//
// Two independent reasons, either of which alone would force it:
//
//   1. §4 / AGENTS.md #5 — never a blank page. The placeholder must exist before the first paint
//      that follows the mount, so a document that will never get its diagrams (engine fails to
//      load, user is offline of a chunk, the render throws) is already sitting in its designed
//      degraded state rather than transitioning into one. D-15 makes that free: the state this
//      function leaves behind IS the degraded state.
//
//   2. D-12's cooldown constraint — `watchController` times its whole synchronous block to set a
//      cost-proportional cooldown (`watchController.ts:422`). It measures `render(...)` end to end,
//      and the app page's render closure calls this function. Anything awaited in here would be
//      billed to every diagram-bearing watched document as inflated idle. (3.4 asserts this.)
//
// ── D-6: THE MEASURED OBJECT AND THE ADOPTED OBJECT ARE DIFFERENT OBJECTS ─────────────────────
//
// `mermaid.render()` returns `{ svg, bindFunctions }` where **`svg` is a STRING**. That string is
// the only thing that ever crosses into the reader:
//
//   1. We pass OUR OWN container (D-6 step 1). Not because `document.body` would fail — the engine
//      appends and removes a temp div of its own there — but because we then own its lifetime (a
//      throw inside the engine leaves *its* temp element behind; ours goes in our own `finally`),
//      its CSS context and its teardown.
//   2. That container is LIVE and IN-DOCUMENT, and that is required rather than conceded (D-6
//      step 2). Text measurement needs a browsing context, and this project's fonts are registered
//      through the FontFace API on `document.fonts` (`src/theme/fonts.ts`) — an in-document
//      container is exactly where those faces participate in matching. A `<template>` cannot
//      measure at all, so "make the measuring container inert" is not on the table. It must also
//      be in the LIGHT DOM: the engine locates its own temp elements with document-scoped
//      selectors, which do not pierce a shadow root.
//      ★ The residual hole this opens — a remote reference emitted by the engine DURING
//      measurement, before we ever serialize — is closed on three sides: by configuration
//      (`diagramEngine.ts`'s hardened `secure` list) for the directive route, by the SOURCE GUARD
//      below for the two routes an author writes into the fence itself, and measured by task 3.3's
//      real-engine request-level guard. jsdom cannot see any of it (`mount.ts:119-129`).
//   3. Adoption is the `mount.ts:131-133` pattern, VERBATIM: `sanitizeSvg(svg)` → assign to a
//      `<template>`'s innerHTML (parsed inert: no browsing context, so nothing in it can fetch) →
//      adopt `tpl.content`. Never `innerHTML` on a live element, and never a move of the engine's
//      own nodes out of the measuring container.
//   4. `bindFunctions` is NOT called (D-6 step 5). It attaches click handlers to a live SVG, which
//      is the interactivity §3.11 declines; we destructure `svg` and nothing else.
//
// ── §4's SOURCE GUARD: THE FENCE SOURCE IS PRE-SCANNED, AND A CARRYING FENCE NEVER RENDERS ────
//
// (decisions.md 2026-07-30.) §4 requires that the reader "render no diagram content that
// references a remote resource, whether the reference originates in the diagram SOURCE or in the
// engine's output". The output half is the profile's (`sanitize.ts`). The SOURCE half cannot be
// closed downstream of `engine.render`, because the engine is where the fetch happens: two
// author-reachable routes put `http(s)` on the wire from inside `render()`, before anything is
// serialized and long before anything is inspectable —
//
//   • flowchart `A@{ img: "URL" }` -> `imageSquare`, which both constructs an `Image` and appends
//     a live `<image href>`, then awaits `decode()` and THROWS. The fence degrades either way, so
//     the leak looks exactly like a bad diagram.
//   • sequenceDiagram `properties A: {"icon": "URL"}` -> `drawImage`'s live `<image xlink:href>`,
//     which RENDERS SUCCESSFULLY. This is the sharp one: a normal-looking diagram paints while the
//     request has already gone out, and every DOM-shape assertion over it reads green, because the
//     profile denies `image` and the ADOPTED artifact really is clean.
//
// No engine option closes either: `securityLevel` gates `%%{init}%%` directive keys, and both of
// these are diagram SOURCE. So the guard sits at the only remaining point — here, between reading
// the source and handing it over.
//
// THE PREDICATE IS OVER THE TEXT, NOT OVER A KEYWORD LIST, and that is the load-bearing property.
// An enumerated fix ("strip `img:`, strip `properties.icon`") under-scoped this same surface twice
// in one milestone; a whole-source predicate is surface-complete by construction, so a future
// mermaid shape carrying a URL cannot silently fall out of scope. The source is READ and never
// rewritten — D-15's read-only-source invariant holds — and a carrying fence takes §3.8's existing
// degrade path with a reason naming this cause, so it is the fourth outcome of one shape, not a
// fourth shape.
//
// ── §3.8's THREE FAILURES, EACH TO THE SAME PLACE ─────────────────────────────────────────────
//
// Engine load, parse/render, and sanitize rejection all end at `markDiagramFailed` — the source
// fence, visible, with an inline marker naming which one it was. Because D-15 keeps the <pre>,
// none of them has anything to rebuild. The render/adopt pair is caught PER FENCE, which is §4's
// "shall render every other diagram in the document normally": one bad fence cannot reach another.
// The engine-load catch is necessarily document-wide — there is no per-fence half of it — and its
// full proof (every fence intact, no placeholder stranded) is task 6.1's.
//
// ── THE SOURCE IS READ AS TEXT, ALWAYS ────────────────────────────────────────────────────────
//
// The fence's contents are untrusted markdown. This module reads `textContent` and never assigns
// markup to anything live — the one `innerHTML` it performs is onto a `<template>`, on a string
// `sanitizeSvg` has already returned. D-15 RETAINS the <pre> that mount() committed through
// `sanitize(parse(source))` instead of rebuilding it, so there is no second place for the source
// to be re-serialized, and `diagramView.ts` has no innerHTML at all.

import {
  DIAGRAM_FENCE_SELECTOR,
  diagramEngineConfigFor,
  engineVersion,
  loadDiagramEngine,
  type DiagramEngine,
  type EngineLoader,
} from './diagramEngine';
import { diagramCacheKey, readDiagram, storeDiagram } from '../app/diagramCache';
import { currentEffectiveTheme } from '../theme/reader';
import { onEffectiveThemeChange } from '../theme/themeRegistry';
import type { EffectiveTheme } from '../settings/settings';
import { sanitizeSvg } from './sanitize';
import {
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
  insertDiagramPlaceholder,
  markDiagramFailed,
  markDiagramRendered,
} from './diagramView';

/**
 * The fence seam, empirically confirmed rather than assumed: `parse.ts` installs no custom fence
 * renderer, markdown-it's default output is `<pre><code class="language-…">` (the committed golden
 * `tests/golden/output/code.html:2` reads exactly that), and `pre`, `code` and `class` all survive
 * sanitization (`sanitize.ts:26,28,62`).
 *
 * Re-exported from `diagramEngine`, which owns it. Task 3.1 declared a second copy here and pinned
 * the two equal by test, for one reason only: importing this module was what would have put the
 * engine on the app-page graph before 3.2 was ready to account for its bytes. 3.2 imports it for
 * real, so the copy is gone and the constant has one home again.
 */
export { DIAGRAM_FENCE_SELECTOR };

/** Options exist for the tests, and for one thing: injecting the loader. See {@link enhanceDiagrams}. */
export interface EnhanceOptions {
  /**
   * Overrides the `import('mermaid')` in `diagramEngine.ts`. Production passes nothing. A test that
   * needs the real engine to FAIL to load, or that needs to watch what we hand it, has no other
   * seam — the import specifier is a static literal by D-13 and must stay one.
   */
  readonly loader?: EngineLoader;
}

/** The pair D-15 maintains: the retained source fence and its sibling figure. */
interface DiagramPair {
  readonly pre: HTMLElement;
  readonly figure: HTMLElement;
}

/**
 * The class on the offscreen measuring container (D-6 step 1). Exported so a test can assert the
 * container's ABSENCE after a render by the same name the code creates it under — an assertion
 * spelled against a private string is an assertion about nothing.
 */
export const DIAGRAM_MEASURE_CLASS = 'peekover-diagram-measure';

/**
 * The effective theme a rendered <figure>'s CONTENT was drawn at (007 D-7, task 5.1). Written
 * here rather than in `diagramView.ts` because it is a fact about the RENDER, not about D-15's
 * three states — the view module owns the state machine and has no notion of a theme.
 *
 * It earns its place twice over:
 *
 *   1. It is what makes the re-theme idempotent. `applyTheme` broadcasts on every theme write,
 *      including one that re-applies the theme already showing; comparing this attribute is how
 *      a subscriber tells "the picture is stale" from "the picture is already right" without
 *      re-rendering the document to find out.
 *   2. It is the OBSERVABLE the staleness claim is spelled against. `data-theme` on the host says
 *      what the page is painting; this says what the diagram was drawn for. A test asserting only
 *      the former cannot see a stale diagram at all — the host re-themes either way. The failure
 *      of a wrong-channel subscription therefore reads as `expected 'light' to be 'dark'` on this
 *      attribute, naming the stale rendering, rather than as a bare boolean.
 */
export const DIAGRAM_THEME_ATTR = 'data-diagram-theme';

/** §3.8's three failures, in the words the inline marker shows. */
const ENGINE_LOAD_FAILED = 'the diagram engine could not be loaded';
const RENDER_FAILED = 'this diagram could not be drawn';
const SANITIZE_REJECTED = 'the drawn diagram was rejected by the sanitizer';

/**
 * §4's source guard, in the same words-the-user-sees form. A distinct string because it is a
 * distinct CAUSE: the other three say something went wrong, this one says we declined.
 */
const REMOTE_REFERENCE = 'its source references a remote resource';

/**
 * Does this diagram source carry a reference to a remote resource? Two sub-patterns, both over the
 * raw text and neither knowing anything about mermaid's grammar (see the module header for why
 * that is the point rather than a shortcut).
 *
 * **`\bhttps?:` followed by a non-space, non-quote character.** The scheme, glued to what follows.
 * "Followed by a non-space" is load-bearing in the negative direction: without it the prose label
 * `A["Use HTTP: the fast one"]` would degrade for a colon, which is a predicate bug rather than
 * §4's stance. The word boundary is what keeps `xhttp:local` — a scheme named `xhttp`, no
 * authority, nothing fetchable — from matching here. `http:h.example/x` (no slashes) DOES match,
 * correctly: `http` is a special scheme, so the URL parser resolves it to `http://h.example/x`.
 *
 * **A `//` at a value position, followed by a host character.** "At a value position" means
 * preceded by the start of the source, whitespace, or one of the delimiters a URL is written
 * after; that alone excludes `TCP//IP`, `and//or` and `50//50`, where the `//` follows a word
 * character. "Followed by a host character" excludes mermaid's OWN `--//`, `//--`, `-//` and `//-`
 * sequence arrows (`sequenceDiagram-DBY2YBRQ.mjs:1155`), whose slashes are followed by `-` or by
 * whitespace — a real, non-contrived case, and the reason that trailing class is not optional.
 *
 * `:` is in the delimiter set, so this arm also catches `scheme://host` for ANY scheme, not only
 * the two spelled out above. That is deliberate in both directions: it closes `img://h.example/x`,
 * the unspaced spelling of the flowchart image route, and it declines to ask which schemes THIS
 * browser and THIS engine version happen to fetch — the version-coupled question the decision
 * exists to stop asking. A `scheme://host` is a remote reference in form, which is what §4 names.
 *
 * What DOES still degrade without fetching is banked as an accepted cost, not an oversight: a URL
 * in a node label, in a `%%` comment, in `click A href`, in a sequence `link`. §4 forbids diagram
 * content that *references* a remote resource; making that depend on whether this engine version
 * happens to fetch it is the version-coupled narrowness the decision exists to remove.
 *
 * No `g` flag: this is a pure test, and a stateful `lastIndex` would make it answer differently on
 * the second call with the same string.
 */
const REMOTE_REFERENCE_RE = /\bhttps?:[^\s"'`]|(?:^|[\s"'`([{,;:=|])\/\/[A-Za-z0-9]/i;

/** {@link REMOTE_REFERENCE_RE} as a predicate. Exported so the boundary can be asserted case by case. */
export function hasRemoteReference(source: string): boolean {
  return REMOTE_REFERENCE_RE.test(source);
}

/**
 * Per-render element id. Mermaid uses it as a document-scoped `#id` selector internally, so it must
 * be unique across every render in the page's lifetime, not merely within one document.
 */
let renderSeq = 0;

/**
 * The source <pre> of every mermaid fence under `root`, in document order.
 *
 * The selector matches the <code>; the element this returns is its <pre> parent, because the <pre>
 * is what D-15 hides and what the placeholder is inserted beside. `pre > code` guarantees the
 * parent exists, so the cast is structural rather than optimistic.
 */
export function diagramFencesIn(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll(DIAGRAM_FENCE_SELECTOR),
    (code) => code.parentElement as HTMLElement,
  );
}

/**
 * Read a fence's diagram source. `textContent`, never markup — see the module header.
 *
 * Reads from the <code>, not the <pre>: they carry the same text today, but the <pre> is where
 * D-15's states live and where §3.8's inline marker sits beside, and a marker's copy must never be
 * able to end up inside what we hand an engine.
 */
export function diagramSourceOf(pre: Element): string {
  return pre.querySelector('code')?.textContent ?? '';
}

/**
 * D-6 step 1's container: ours, live, in the light DOM, offscreen.
 *
 * Positioned rather than hidden — `display:none` and `visibility:hidden` are both measurable-in-
 * name-only, and text measurement is the entire reason this element is in the document. No width is
 * set: with `htmlLabels:false` every label is an SVG `<text>` the engine measures and lays out
 * itself, so a parent box would constrain nothing and would only be a magic number.
 */
function createMeasureContainer(doc: Document): HTMLElement {
  const container = doc.createElement('div');
  container.className = DIAGRAM_MEASURE_CLASS;
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.pointerEvents = 'none';
  doc.body.appendChild(container);
  return container;
}

/**
 * D-6 step 4 — `mount.ts:131-133`'s adoption, on an already-sanitized string.
 *
 * Returns `null` when nothing survived: an SVG artifact with no <svg> root is a sanitize rejection,
 * not a diagram, and the caller degrades. That check is also what stops an over-stripping profile
 * change from silently committing an empty figure — the "never an empty box" half of §3.8.
 */
function adoptSanitizedSvg(doc: Document, svg: string): DocumentFragment | null {
  const tpl = doc.createElement('template');
  tpl.innerHTML = svg; // parsed inert: no browsing context -> nothing here fetches
  return tpl.content.querySelector('svg') ? tpl.content : null;
}

/**
 * The outcome of drawing ONE diagram at ONE theme: either adopted content ready to commit, or the
 * §3.8/§4 reason it did not draw. A returned value rather than a `markDiagramFailed` call inside,
 * because the two callers degrade DIFFERENTLY — see {@link reThemeHost}, which must not turn a
 * diagram that is already on screen into a failure marker.
 */
type DrawOutcome = { readonly content: DocumentFragment } | { readonly failure: string };

/**
 * Source guard → cache lookup → engine on a miss → sanitize → adopt → cache write, for one fence
 * at one effective theme. Extracted at task 5.1 so the first render and the re-theme share ONE
 * implementation: a second copy is where the cache write's three ordering constraints below would
 * drift apart, and the re-theme is precisely a second pass through this sequence at a new theme.
 *
 * `theme` is a parameter rather than a `currentEffectiveTheme()` read inside, and that is
 * load-bearing for the re-theme: the listener is handed the theme that was just BROADCAST, and
 * keying on anything else would let the key disagree with what the hosts now carry.
 */
async function drawDiagram(
  doc: Document,
  engine: DiagramEngine,
  container: HTMLElement,
  source: string,
  theme: EffectiveTheme,
): Promise<DrawOutcome> {
  // Step zero: §4's source guard. The caller read the source once and hands the SAME string on —
  // a second read is a second thing to keep in agreement. A carrying fence never reaches
  // `render()`, which is the only moment at which its reference could have gone out; it takes
  // §3.8's degrade path and the fences around it are untouched (§4's per-fence isolation).
  if (hasRemoteReference(source)) return { failure: REMOTE_REFERENCE };

  // Step one: THE CACHE (D-3, D-4, task 4.3). The key is content-addressed over the three
  // things that change what this diagram LOOKS like — the source, the effective theme, and the
  // engine version — so a hit is only ever the same picture (`diagramCache.ts`'s D-3 note).
  //
  // The theme is always an EffectiveTheme, never a `ThemeSetting`: `'auto'` renders as two
  // different pictures, and keying on it would serve a dark render into a light reader.
  //
  // A hit skips `engine.render` entirely — that IS the cache, and it is what makes §3.3's
  // *every re-render re-enhances* affordable rather than merely correct (4.4 measures it under
  // watch). The cached string then rejoins the SAME sanitize-and-adopt path a fresh render
  // takes: nothing that came out of storage is trusted more than what came out of the engine.
  // It is also what makes the SECOND theme flip free: the rendering this pass stores is the row
  // the flip back reads (§3.7's two coexisting rows, 4.3's D-3 component-2 case).
  let key: string | null;
  let cached: string | undefined;
  try {
    key = await diagramCacheKey(source, theme, engineVersion());
    cached = await readDiagram(key);
  } catch {
    key = null; // hashing unavailable → no cache this pass; the render below is unaffected.
  }

  let drawn: string;
  if (cached === undefined) {
    renderSeq += 1;
    const id = `peekover-diagram-${renderSeq}`;

    // Step two: the engine — reached only on a MISS. Its failure is §3.8's second, and it is
    // caught per fence so the fences after it still draw.
    //
    // ── ★ THE ENGINE IS CONFIGURED PER RENDER, TO *THIS* FENCE'S THEME (§3.7 / D-7) ────────
    //
    // Not once per load, and the difference is a real defect rather than a preference.
    // `loadDiagramEngine` runs `initialize` ONCE, but `renderDiagrams` reads the effective theme
    // PER FENCE (see its loop) precisely so a flip landing mid-pass leaves the fences behind it at
    // the new theme. A theme baked in at load time would draw those remaining fences with the OLD
    // paint while `markDiagramRendered` stamped them `data-diagram-theme="<new>"` — a stale
    // picture that D-7 prevents today, reintroduced by the fix meant to make theming work. Here,
    // the picture and the stamp are read from the same `theme` argument, so they cannot disagree.
    //
    // It is CONFIGURATION, not a reload: `initialize()` merges a plain object into mermaid's site
    // config. The engine stays the one `import('mermaid')` D-13 permits, and the chunk is fetched
    // once. Renders are already sequential (the shared measuring container — see
    // `renderDiagrams`), so no other render can be in flight between this call and the one below.
    //
    // ★ It sits INSIDE the miss branch on purpose: a cache HIT serves a stored string and never
    // reaches `engine.render`, so it must not pay for a configuration it will not use. The hit
    // path is what makes §3.3's *every re-render re-enhances* affordable, and it stays untouched.
    try {
      engine.initialize(diagramEngineConfigFor(theme));
      drawn = (await engine.render(id, source, container)).svg;
    } catch {
      return { failure: RENDER_FAILED };
    }
  } else {
    drawn = cached;
  }

  // Step three: sanitize and adopt — on the engine's string OR the cached one, indistinguishably.
  // Its failure is §3.8's third, and it lands AFTER the engine has already succeeded (or after a
  // hit) — the latest-moment case D-15 is shaped for.
  try {
    const content = adoptSanitizedSvg(doc, sanitizeSvg(drawn));
    if (!content) return { failure: SANITIZE_REJECTED };

    // ── ★ THE WRITE: AFTER SANITIZE SURVIVED, BEFORE THE FENCE LEAVES `pending` ────────────
    //
    // Three constraints, and this one position satisfies all three.
    //
    //   1. STORE THE ENGINE'S STRING, NOT THE SANITIZED ONE. `drawn` is what `sanitizeSvg` was
    //      handed, so every cache HIT re-runs the CURRENT profile over it (the sanitize step
    //      above does not care where its string came from). Storing the post-sanitize artifact
    //      would freeze one profile version into storage: tighten `sanitize.ts` tomorrow and
    //      the new rule would apply to fresh renders and silently NOT to cached ones.
    //
    //   2. DO NOT STORE AN ARTIFACT THE SANITIZER JUST REJECTED. Writing before the sanitize
    //      check POISONS the cache — the rejected string is stored, and every later sight of
    //      that diagram is served it again and re-rejected, without the engine ever getting
    //      another attempt. §3.8's failure would stop being transient and become permanent,
    //      cached, and invisible. (Caught by `diagramRender.browser.test.ts`'s sanitize-
    //      rejection case, whose success control re-renders the same fence and demands
    //      `rendered`: it read `failed` against a write placed before this check.)
    //
    //   3. BEFORE the caller commits, which is what clears the `pending` state. That makes
    //      "the document has settled" mean "and its diagrams are cached" — one observable
    //      instead of two, and no window in which a re-render races an in-flight write.
    //
    // The cost lands only on the MISS path, which has just paid for a full engine render; a
    // HIT writes nothing here (`readDiagram` already touched `lastUsed`), so the fast path the
    // cache exists to create never waits on storage at all.
    //
    // `storeDiagram` swallows its own failures (§4) — a diagram that could not be cached simply
    // re-renders next time, which is a cost, not an error the user has an action for.
    if (cached === undefined && key !== null) await storeDiagram(key, drawn);

    return { content };
  } catch {
    return { failure: SANITIZE_REJECTED };
  }
}

/**
 * The async body: load the engine once, then draw each pending fence into its placeholder.
 *
 * SEQUENTIAL, deliberately. The container is shared, and the engine empties it at the top of every
 * `render()` (mermaid 11.16.0 assigns `svgContainingElement.innerHTML = ''`), so two overlapping
 * renders would race for one box. Diagrams are also cheap relative to the chunk that had to arrive
 * before any of them could start.
 */
async function renderDiagrams(
  doc: Document,
  root: ParentNode,
  pairs: readonly DiagramPair[],
  loader: EngineLoader | undefined,
): Promise<void> {
  let engine: DiagramEngine | null;
  try {
    engine = await (loader ? loadDiagramEngine(root, loader) : loadDiagramEngine(root));
  } catch {
    // §3.8's first failure. Document-wide by nature: no fence got as far as having its own.
    for (const pair of pairs) markDiagramFailed(pair.pre, pair.figure, ENGINE_LOAD_FAILED);
    return;
  }
  if (!engine) return; // §4's feature-detect said no fence; the prologue disagrees, so do nothing.

  const container = createMeasureContainer(doc);
  try {
    for (const pair of pairs) {
      // Read the theme PER FENCE, as this loop always has: a flip that lands mid-pass leaves the
      // fences behind it keyed at the new theme and the ones in front of it stale, and the stale
      // ones are exactly what the re-theme listener then repairs (it compares each figure's own
      // recorded theme, not the document's).
      const theme = currentEffectiveTheme();
      const outcome = await drawDiagram(doc, engine, container, diagramSourceOf(pair.pre), theme);
      if ('failure' in outcome) {
        markDiagramFailed(pair.pre, pair.figure, outcome.failure);
        continue;
      }
      markDiagramRendered(pair.pre, pair.figure, outcome.content);
      pair.figure.setAttribute(DIAGRAM_THEME_ATTR, theme);
    }
  } finally {
    // OURS to remove, which is the whole reason we passed one (D-6 step 1). Runs even if the loop
    // throws for a reason neither catch above names.
    container.remove();
  }
}

// ── D-7: THE RE-THEME, AND WHY IT SUBSCRIBES WHERE IT DOES ────────────────────────────────────
//
// §4 requires re-theming *"when the EFFECTIVE theme changes"*. `applyTheme` is the one broadcast
// every effective-theme change goes through — the setting writer (`reader.ts:89`) AND the OS-flip
// listener (`reader.ts:157`) — so that is where this subscribes (`themeRegistry.ts`'s
// `onEffectiveThemeChange`). `onThemeSettingChange` is the seam that looks right and is not: by its
// own doc comment (`reader.ts:108-112`) an OS flip under `auto` *"changes what paints but NOT what
// the user picked, so it deliberately does not notify"*, and `DEFAULT_SETTINGS.theme` IS `'auto'`.
// A subscriber there would leave every diagram stale on an OS dark-mode flip in the DEFAULT
// configuration. `diagramTheme.browser.test.ts` reverts to that channel and requires the flip to go
// red, so the choice is pinned by the defect it avoids rather than by this comment.
//
// THE MECHANISM IS RE-RENDER-AND-SWAP, NOT MUTATE-IN-PLACE. A themed mermaid SVG differs in fills,
// strokes, marker defs and its generated <style> block; there is no set of attributes to patch that
// is equivalent to what the engine emits at the other theme. So the fence is re-keyed at the new
// theme, looked up, rendered on a miss, and the RESULT replaces the figure's children.
//
// KEEP-PREVIOUS-VISIBLE IS FREE, AND THAT IS D-15's DOING. Nothing here empties a figure or returns
// a fence to `pending`: the old rendering stays on screen, untouched, for the whole of the async
// re-key/look-up/render, and the swap is one synchronous `replaceChildren` with the replacement
// ALREADY built. There is no instant — not a frame, not a task — in which the figure has no <svg>.
// A failure at the new theme leaves the OLD rendering standing rather than calling
// `markDiagramFailed`: the diagram on screen is still a correct picture of the source, merely at
// the previous theme, and replacing it with an error marker would be a strictly worse outcome than
// the staleness it reports.

/**
 * Hosts with at least one rendered diagram, and the loader each was enhanced with.
 *
 * A Map rather than a Set because the re-theme has to reach the engine the SAME way the first
 * render did — a test that injected a loader (the only seam D-13's static import leaves) must not
 * silently fall back to the production `import('mermaid')` on a flip.
 */
const enhancedHosts = new Map<HTMLElement, EngineLoader | undefined>();

/** Subscribed once, lazily, on the first host that actually has diagrams — never at module scope
 *  (side effects belong to call sites) and never per host (that is the leak the prune prevents). */
let themeSubscribed = false;

/** Ids re-theme passes, so one can tell whether it is still the pass that owns its host. */
let themePassSeq = 0;

/**
 * The pass each host currently has IN FLIGHT, and the theme it is producing. One map answers both
 * questions the re-theme has to get right when broadcasts arrive faster than renders finish.
 *
 * **A duplicate is declined before it starts.** A second broadcast of a theme a host is already
 * re-rendering to has nothing to add, and starting it would run the engine again for a picture
 * already on its way. Duplicate broadcasts are ordinary, not pathological: `applyTheme` fires on
 * every theme write, so a settings load landing on the theme the OS already resolved to, or two
 * surfaces writing the same theme, both arrive here twice. (The test harness makes it vivid —
 * `resetThemeWatchForTest` leaves each test's OS listener installed, so by the third test in a
 * file one flip arrives three times. Without this the flip ran the engine three times per diagram.)
 *
 * **A superseded pass does not commit.** Two flips in quick succession would otherwise race: the
 * first pass's render can land AFTER the second's, and its swap would put the older theme back on
 * screen permanently — a stale diagram produced by the mechanism that exists to prevent one. A
 * pass commits only while it is still the one recorded here.
 *
 * The two interact, and the ordering matters: only a pass that ACTUALLY STARTS claims the slot, so
 * a coalesced duplicate cannot supersede the very pass it deferred to. (Counting supersession per
 * broadcast instead had exactly that bug — every flip cancelled itself and nothing ever re-themed.)
 */
const inFlightThemes = new Map<HTMLElement, { theme: EffectiveTheme; pass: number }>();

/** Drop every host no longer in the document — `themeRegistry.ts`'s `pruneThemeHosts` discipline,
 *  one level up, as its `onEffectiveThemeChange` doc comment requires of a lasting subscriber.
 *  Deleting during Map iteration is safe. */
function pruneEnhancedHosts(): void {
  for (const host of enhancedHosts.keys()) {
    if (!host.isConnected) {
      enhancedHosts.delete(host);
      inFlightThemes.delete(host);
    }
  }
}

/** Re-render every stale diagram in one host at `effective`, and swap each when it is ready. */
async function reThemeHost(
  host: HTMLElement,
  loader: EngineLoader | undefined,
  effective: EffectiveTheme,
): Promise<void> {
  const shadow = host.shadowRoot;
  if (!shadow) return;

  // Already on its way to this exact theme — see `inFlightThemes`. Checked before the stale scan
  // because the in-flight pass has not committed yet, so the figures still READ stale.
  if (inFlightThemes.get(host)?.theme === effective) return;

  // Only figures whose CONTENT is at another theme. This is what makes the listener idempotent:
  // `applyTheme` also broadcasts when the theme did not actually change (every `setThemeSetting`
  // call does), and re-rendering a document to discover that would be the cost the cache exists
  // to avoid, paid on every write.
  const stale: DiagramPair[] = [];
  for (const figure of shadow.querySelectorAll<HTMLElement>(
    `figure.${DIAGRAM_FIGURE_CLASS}[${DIAGRAM_STATE_ATTR}="rendered"]`,
  )) {
    if (figure.getAttribute(DIAGRAM_THEME_ATTR) === effective) continue;
    const pre = figure.previousElementSibling;
    if (pre instanceof HTMLElement) stale.push({ pre, figure });
  }
  if (stale.length === 0) return;

  themePassSeq += 1;
  const pass = themePassSeq;
  inFlightThemes.set(host, { theme: effective, pass });
  try {
    await drawStaleFigures(host, shadow, loader, stale, effective, pass);
  } finally {
    // Ours to clear only if a newer pass has not already claimed the slot.
    if (inFlightThemes.get(host)?.pass === pass) inFlightThemes.delete(host);
  }
}

/** The engine load, the measuring container and the per-figure swap — split out so
 *  {@link reThemeHost}'s in-flight bookkeeping has one `finally` covering all of it. */
async function drawStaleFigures(
  host: HTMLElement,
  shadow: ShadowRoot,
  loader: EngineLoader | undefined,
  stale: readonly DiagramPair[],
  effective: EffectiveTheme,
  pass: number,
): Promise<void> {
  /** Still the pass that owns this host? A newer flip claiming the slot ends this one. */
  const current = (): boolean => inFlightThemes.get(host)?.pass === pass;

  let engine: DiagramEngine | null;
  try {
    engine = await (loader ? loadDiagramEngine(shadow, loader) : loadDiagramEngine(shadow));
  } catch {
    return; // the engine that already drew these is gone; the existing renderings stay on screen.
  }
  if (!engine) return;

  const container = createMeasureContainer(host.ownerDocument);
  try {
    for (const pair of stale) {
      if (!current()) return; // a newer flip owns the screen now
      const outcome = await drawDiagram(
        host.ownerDocument,
        engine,
        container,
        diagramSourceOf(pair.pre),
        effective,
      );
      // A failure keeps the previous rendering (see the header): still a diagram, merely stale.
      if ('failure' in outcome) continue;
      if (!current() || !pair.figure.isConnected) continue;

      // ★ THE SWAP. One synchronous call, with the replacement already built — the figure is
      // REPLACED, never emptied, so no observer can catch it without an <svg>.
      markDiagramRendered(pair.pre, pair.figure, outcome.content);
      pair.figure.setAttribute(DIAGRAM_THEME_ATTR, effective);
    }
  } finally {
    container.remove();
  }
}

/** The effective-theme subscriber. Prunes first, then re-themes each live host independently —
 *  one host's slow engine must not hold another host's diagrams at the old theme. */
function reThemeAllHosts(effective: EffectiveTheme): void {
  pruneEnhancedHosts();
  for (const [host, loader] of enhancedHosts) {
    void reThemeHost(host, loader, effective);
  }
}

/**
 * Test-only: forget every enhanced host and the subscription itself, so a suite does not leave a
 * listener re-rendering into a later suite's document. Pairs with
 * `themeRegistry.resetEffectiveThemeListenersForTest`, which clears the other half.
 */
export function resetDiagramThemeForTest(): void {
  enhancedHosts.clear();
  inFlightThemes.clear();
  themeSubscribed = false;
  themePassSeq = 0;
}

/**
 * D-12's entry point: put D-15's structure around every mermaid fence in a freshly mounted reader,
 * schedule the render, and return.
 *
 * Called from both app-page mount paths and from nowhere else — `readerPane.ts` after its `mount`,
 * and the `render` closure `appShell.ts` passes into `createWatchController`. The content script
 * reaches neither, which is why its reader leaves a mermaid fence as an ordinary code fence with no
 * affordance and no note (§3.2, rows 2 + 3): the gate is the module graph, not a runtime check, and
 * it is what keeps mermaid's chunk off the content script entirely.
 *
 * No-ops on a host with no shadow root and on a document with no fences — the overwhelmingly common
 * case, and the one §4 cares about ("when a document contains no mermaid block, the system shall
 * not load the diagram engine"). The empty-list return below is in front of every await, so on a
 * fence-free document `import('mermaid')` is never evaluated and its chunk is never fetched.
 *
 * Idempotent over an already-enhanced tree: a fence that already carries a state attribute is
 * skipped, so a second call cannot produce a second placeholder or a second render of the same
 * fence. In production every mount arrives via `replaceChildren` and the fences are always fresh,
 * so this guard is a property, not a path the app relies on.
 */
export function enhanceDiagrams(host: HTMLElement, options: EnhanceOptions = {}): void {
  const shadow = host.shadowRoot;
  if (!shadow) return;

  const pairs: DiagramPair[] = [];
  for (const pre of diagramFencesIn(shadow)) {
    if (pre.hasAttribute(DIAGRAM_STATE_ATTR)) continue;
    pairs.push({ pre, figure: insertDiagramPlaceholder(pre) });
  }
  if (pairs.length === 0) return;

  // D-7: this host now has diagrams, so it follows the effective theme from here on. Both lines
  // are AFTER the empty-list return by design — a fence-free document subscribes to nothing and
  // is not retained, which keeps the no-diagram case exactly as cheap as it was.
  enhancedHosts.set(host, options.loader);
  if (!themeSubscribed) {
    themeSubscribed = true;
    onEffectiveThemeChange(reThemeAllHosts);
  }

  // Everything above is synchronous and already committed; everything below is off this stack.
  void renderDiagrams(host.ownerDocument, shadow, pairs, options.loader);
}
