// diagramEnhancer — the synchronous prologue (007 D-12, D-15). Given a reader host that mount()
// has already committed, it finds the mermaid fences and puts D-15's structure around each one,
// then returns. Task 3.1's whole surface is that prologue; the async body that loads the engine and
// renders into these placeholders is 3.2's.
//
// ── WHY IT IS SYNCHRONOUS, AND WHY THAT IS A CONSTRAINT RATHER THAN A STYLE ───────────────────
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
// ── THE ENGINE IS DELIBERATELY NOT IMPORTED HERE ──────────────────────────────────────────────
//
// `diagramEngine.ts` is the ONE importer of `mermaid` (D-13), and it is currently reachable from no
// entrypoint at all — which is why the built package contains no mermaid chunk. Importing it from
// this module, even for the selector constant alone, would make it reachable from the app-page
// graph and materialize that chunk. Task 3.2 is where that happens and where those bytes are
// accounted; 3.1 is scaffolding and must not move them, so {@link DIAGRAM_FENCE_SELECTOR} is
// declared here rather than imported.
//
// That duplication is deliberate and PINNED: `diagramEnhancer.test.ts` imports both constants and
// asserts they are equal, so the two cannot drift apart silently while they coexist. A test import
// costs no bundle bytes.
//
// ── THE SOURCE IS READ AS TEXT, ALWAYS ────────────────────────────────────────────────────────
//
// The fence's contents are untrusted markdown. This module reads `textContent` and never assigns
// markup anywhere — and it never needs to, because D-15 RETAINS the <pre> that mount() already
// committed through `sanitize(parse(source))` instead of rebuilding it. There is no innerHTML in
// this module or in `diagramView.ts`, and that is the property the D-1 profile would otherwise be
// reached around through the back door.

import { insertDiagramPlaceholder, DIAGRAM_STATE_ATTR } from './diagramView';

/**
 * The fence seam, empirically confirmed rather than assumed: `parse.ts` installs no custom fence
 * renderer, markdown-it's default output is `<pre><code class="language-…">` (the committed golden
 * `tests/golden/output/code.html:2` reads exactly that), and `pre`, `code` and `class` all survive
 * sanitization (`sanitize.ts:26,28,62`).
 *
 * Mirrors `diagramEngine.DIAGRAM_FENCE_SELECTOR` — see the module header for why it is not imported
 * from there, and `diagramEnhancer.test.ts` for the equality pin that keeps them honest.
 */
export const DIAGRAM_FENCE_SELECTOR = 'pre > code.language-mermaid';

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
 * D-15's states live and where §3.8's inline marker will be attached, and a marker's copy must
 * never be able to end up inside what we hand an engine.
 */
export function diagramSourceOf(pre: Element): string {
  return pre.querySelector('code')?.textContent ?? '';
}

/**
 * D-12's entry point: put D-15's structure around every mermaid fence in a freshly mounted reader,
 * and return.
 *
 * Called from both app-page mount paths and from nowhere else — `readerPane.ts` after its `mount`,
 * and the `render` closure `appShell.ts` passes into `createWatchController`. The content script
 * reaches neither, which is why its reader leaves a mermaid fence as an ordinary code fence with no
 * affordance and no note (§3.2, rows 2 + 3): the gate is the module graph, not a runtime check.
 *
 * No-ops on a host with no shadow root and on a document with no fences — the overwhelmingly common
 * case, and the one §4 cares about ("when a document contains no mermaid block, the system shall
 * not load the diagram engine"). Here that is trivially true because nothing downstream of the
 * empty-fence-list return exists yet; 3.2 keeps it true by putting the engine load behind the same
 * return.
 *
 * Idempotent over an already-enhanced tree: a fence that already carries a state attribute is
 * skipped, so a second call cannot produce a second placeholder. In production every mount arrives
 * via `replaceChildren` and the fences are always fresh, so this guard is a property, not a path
 * the app relies on.
 */
export function enhanceDiagrams(host: HTMLElement): void {
  const shadow = host.shadowRoot;
  if (!shadow) return;
  for (const pre of diagramFencesIn(shadow)) {
    if (pre.hasAttribute(DIAGRAM_STATE_ATTR)) continue;
    insertDiagramPlaceholder(pre);
  }
}
