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
  loadDiagramEngine,
  type DiagramEngine,
  type EngineLoader,
} from './diagramEngine';
import { sanitizeSvg } from './sanitize';
import {
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
      // Step zero: §4's source guard. Read once, scan, and hand the SAME string to the engine —
      // a second read is a second thing to keep in agreement. A carrying fence never reaches
      // `render()`, which is the only moment at which its reference could have gone out; it takes
      // §3.8's degrade path and the fences around it are untouched (§4's per-fence isolation).
      const source = diagramSourceOf(pair.pre);
      if (hasRemoteReference(source)) {
        markDiagramFailed(pair.pre, pair.figure, REMOTE_REFERENCE);
        continue;
      }

      renderSeq += 1;
      const id = `peekover-diagram-${renderSeq}`;

      // Step one: the engine. Its failure is §3.8's second, and it is caught per fence so the
      // fences after it still draw.
      let drawn: string;
      try {
        drawn = (await engine.render(id, source, container)).svg;
      } catch {
        markDiagramFailed(pair.pre, pair.figure, RENDER_FAILED);
        continue;
      }

      // Step two: sanitize and adopt. Its failure is §3.8's third, and it lands AFTER the engine
      // has already succeeded — the latest-moment case D-15 is shaped for.
      try {
        const content = adoptSanitizedSvg(doc, sanitizeSvg(drawn));
        if (!content) {
          markDiagramFailed(pair.pre, pair.figure, SANITIZE_REJECTED);
          continue;
        }
        markDiagramRendered(pair.pre, pair.figure, content);
      } catch {
        markDiagramFailed(pair.pre, pair.figure, SANITIZE_REJECTED);
      }
    }
  } finally {
    // OURS to remove, which is the whole reason we passed one (D-6 step 1). Runs even if the loop
    // throws for a reason neither catch above names.
    container.remove();
  }
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

  // Everything above is synchronous and already committed; everything below is off this stack.
  void renderDiagrams(host.ownerDocument, shadow, pairs, options.loader);
}
