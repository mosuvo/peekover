// codeEnhancer — the synchronous prologue (D-5, D-6). Given a reader host that mount() has already
// committed, it finds the language-classed code fences and puts D-6's retained/wrapper structure
// around each one, then returns. This task's whole surface is that prologue; the async body that
// loads the engine, tokenizes and adopts the highlighted result into these wrappers is task 4.2's
// (mirroring `diagramEnhancer.ts`'s task-3.1-vs-3.2 split exactly).
//
// ── WHY THE ENTRY POINT IS SYNCHRONOUS, AND WHY THAT IS A CONSTRAINT RATHER THAN A STYLE ──────
//
// Two independent reasons, either of which alone would force it (007 D-12's reasons, unchanged):
//
//   1. §4 / AGENTS.md #5 — never a blank page. The wrapper must exist before the first paint that
//      follows the mount, so a document that will never get its highlighting (engine fails to load,
//      the tokenize throws) is already sitting in its designed degraded state — the retained `<pre>`,
//      visible — rather than transitioning into one.
//
//   2. D-5's cooldown constraint — `watchController` times its whole synchronous block to set a
//      cost-proportional cooldown (`watchController.ts:422`). It measures `render(...)` end to end,
//      and the app page's render closure calls this function. Anything awaited in here would be
//      billed to every code-bearing watched document as inflated idle. (Task 4.5 re-asserts this.)
//
// ── THE ENGINE IS DELIBERATELY NOT IMPORTED HERE ──────────────────────────────────────────────
//
// `codeEngine.ts` is the ONE importer of `shiki` (D-3), and reaching it from this module — even for
// the selector constant alone — would put it on the app-page graph and move bundle bytes for a task
// whose own Files list (`specs/009-code-blocks/tasks.md` 4.1) does not name `codeEngine.ts` and whose
// Verify text names no tokenize, no adoption. Task 4.5's own text states bundle bytes move for the
// first time THIS MILESTONE at 4.5, after task 4.2 has wired the real import — so `CODE_FENCE_SELECTOR`
// is re-declared here rather than imported, exactly as `diagramEnhancer.ts` re-declared
// `DIAGRAM_FENCE_SELECTOR` at 007 task 3.1 (`git show 1e09164`, its own module header states the same
// reasoning verbatim). The duplication is pinned by a unit test that imports both constants and
// asserts equality, so the two cannot drift apart while they coexist.
//
// ── THE SOURCE IS READ AS TEXT, ALWAYS ────────────────────────────────────────────────────────
//
// The fence's contents are untrusted markdown. This module never assigns markup anywhere, and it
// never needs to: D-6 RETAINS the `<pre>` that mount() already committed through
// `sanitize(parse(source))` instead of rebuilding it, and `codeView.ts` has no `innerHTML` at all.
//
// ── A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE (discovered this task, not specified) ─
//
// `CODE_FENCE_SELECTOR` below is `pre > code[class^="language-"]`, the literal tasks.md 4.1/plan.md
// §1.3 both give verbatim — and `language-mermaid` starts with `language-`, so it matches too.
// 007's `diagramEnhancer.ts` runs FIRST at both call sites (D-5's own ordering) and already claims
// a mermaid fence's `<pre>` with its own D-15 sibling structure; if this module re-parented that
// same `<pre>` into a `.peekover-code` wrapper, it would corrupt 007's already-shipped structure —
// `pre.nextElementSibling` would stop being the diagram `<figure>` the moment this task's own code
// ran. Verified this session: wiring `enhanceCode` at the real call sites (not merely importing it)
// reds `diagramRender.browser.test.ts`'s D-12 parity case with exactly that signature. No spec, plan
// or tasks.md text names this exclusion — plan §2's "no interaction between the two engines is
// scoped" line forbids this module from IMPORTING any diagram module to check for it structurally,
// so the exclusion is a literal class check instead, confined entirely to this file. `codeEngine.ts`
// (task 1.2, unchanged by this task) has the SAME unscoped selector and therefore the SAME gap in
// its own `hasCodeFence` feature-detect — named here as a carried finding for task 4.2, which is the
// first task to actually call it: a document with only a mermaid fence and no other code would
// otherwise make 4.2 load Shiki's engine for nothing to highlight.

import { insertCodeWrapper, CODE_STATE_ATTR } from './codeView';

/** See the module header's "A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE" section. */
const MERMAID_FENCE_CLASS = 'language-mermaid';

/**
 * The fence markdown-it emits for a fenced code block carrying a language class, after
 * sanitization. Matches ONLY a `code` that is a DIRECT child of a `pre`, whose class starts with
 * `language-` — no bare `code`, no unlabelled fence, no `code` behind an intervening element (D-6's
 * wrapper needs a direct child to re-parent).
 *
 * Mirrors `codeEngine.CODE_FENCE_SELECTOR` — see the module header for why it is not imported from
 * there, and `codeEnhancer.test.ts` for the equality pin that keeps them honest.
 */
export const CODE_FENCE_SELECTOR = 'pre > code[class^="language-"]';

/**
 * The source `<pre>` of every language-classed code fence under `root`, in document order — EXCEPT
 * a mermaid fence, which 007's `diagramEnhancer.ts` already owns (module header).
 *
 * The selector matches the `<code>`; the element this returns is its `<pre>` parent, because the
 * `<pre>` is what D-6's wrapper re-parents. `pre > code` guarantees the parent exists, so the cast
 * is structural rather than optimistic.
 */
export function codeFencesIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll(CODE_FENCE_SELECTOR))
    .filter((code) => !code.classList.contains(MERMAID_FENCE_CLASS))
    .map((code) => code.parentElement as HTMLElement);
}

/**
 * D-5's entry point: put D-6's structure around every language-classed code fence in a freshly
 * mounted reader, and return.
 *
 * Called from both app-page mount paths and from nowhere else — `readerPane.ts` after its `mount`,
 * and the `render` closure `appShell.ts` passes into `createWatchController`. The content script
 * reaches neither, which is why its reader leaves a code fence exactly as markdown-it/sanitize
 * committed it, with no affordance and no note (§3.8, rows 2 + 3): the gate is the module graph, not
 * a runtime check, and it is what keeps `codeEngine.ts` (and Shiki's chunk behind it) off the
 * content-script graph entirely.
 *
 * No-ops on a host with no shadow root and on a document with no fences — the overwhelmingly common
 * case, and the one §4 cares about ("when a document contains no code fence, the system shall not
 * load the code engine"). Here that is trivially true because nothing downstream of the empty-fence-
 * list return exists yet; task 4.2 keeps it true by putting the engine load behind the same return.
 *
 * Idempotent over an already-enhanced tree: a fence whose `<pre>` already carries the state
 * attribute is skipped, so a second call cannot re-wrap an already-wrapped fence. In production
 * every mount arrives via `replaceChildren` and the fences are always fresh, so this guard is a
 * property, not a path the app relies on.
 */
export function enhanceCode(host: HTMLElement): void {
  const shadow = host.shadowRoot;
  if (!shadow) return;
  for (const pre of codeFencesIn(shadow)) {
    if (pre.hasAttribute(CODE_STATE_ATTR)) continue;
    insertCodeWrapper(pre);
  }
}
