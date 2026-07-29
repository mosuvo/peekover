// diagramView — D-15's structure and its three states, and nothing else. It builds no markup from
// the document's text, imports no engine, and knows nothing about mermaid: it is the shape the
// enhancer (and, from group 3.2, the render path) mutates.
//
// ── D-15: DEGRADATION IS THE DEFAULT STATE, SUCCESS IS THE MUTATION ───────────────────────────
//
// The rendered diagram is a SIBLING <figure>; the source <pre> is HIDDEN, never removed. §3.8
// requires three distinct failures — engine load, parse/render, and sanitize rejection — to all
// degrade to the visible source fence, and the last of those happens AFTER the engine already
// succeeded, i.e. at the latest possible moment. An enhancer that removed the <pre> on the way in
// would have to rebuild it, from text it must then separately retain, on every one of those paths.
//
// Keeping the <pre> in the tree and toggling one attribute makes the never-blank invariant (§4,
// AGENTS.md #5) STRUCTURAL rather than something spread across three catch blocks: the only state
// that hides the source is `rendered`, so every other outcome — including "the engine never loaded
// and no code in this module ever ran a second time" — leaves the fence exactly as mount() left it.
//
// This is `readerMode.ts:69-84`'s mechanism reused rather than re-derived: build the alternate
// view, flip an attribute, let CSS swap. (The plan cites `:60-80`, which is one block early;
// corrected here rather than propagated.)
//
// ── WHY THE ATTRIBUTE IS ON THE <pre> ─────────────────────────────────────────────────────────
//
// The CSS rule that hides the source keys off it (`readerCss.ts`), mirroring `data-mode` on the
// host and `data-diff` on the reader root. A sibling-combinator rule off the <figure> would work
// equally well in the engine but reads the DOM backwards: the <pre> is the thing whose visibility
// is in question, so it carries the state.

/** The state attribute both halves of the pair carry. Mirrors `data-mode` / `data-diff`. */
export const DIAGRAM_STATE_ATTR = 'data-diagram';

/** Class on the sibling <figure>. The `readerCss.ts` rules and the group 7 controls key off it. */
export const DIAGRAM_FIGURE_CLASS = 'peekover-diagram';

/** Class on §3.8's inline marker. Group 7.1 owns its a11y treatment (§3.5 rows 15, 20). */
export const DIAGRAM_ERROR_CLASS = 'peekover-diagram-error';

/**
 * The three states a fence can be in.
 *
 * `pending` — the placeholder is in the tree and the source is still visible. This is the state the
 * synchronous prologue leaves behind, and — critically — the state a document STAYS in forever if
 * the engine never loads. It is a designed state, not a transient one.
 *
 * `rendered` — the only state that hides the source <pre>.
 *
 * `failed` — indistinguishable from `pending` to the eye (source visible), but distinct in the DOM
 * so the group 3.2 per-fence catch can attach §3.8's inline marker to it without re-deriving which
 * fences it owns.
 */
export type DiagramState = 'pending' | 'rendered' | 'failed';

/**
 * Insert the placeholder <figure> as the NEXT SIBLING of a source <pre>, and mark the pair pending.
 *
 * Sibling, not wrapper and not replacement: the <pre> keeps its position and its parent, so the
 * <figure> lands wherever the <pre> already was — which, since mount() commits the fence inside
 * `.peekover-reader`, is inside the reading column by construction rather than by a second rule.
 *
 * `aria-hidden` while pending (§3.5 row 18): an empty box has nothing to announce, and a screen
 * reader that met it before the diagram arrived would read a gap between the prose and the source
 * fence that is still right there below it. {@link markDiagramRendered} lifts it.
 *
 * Returns the figure so the caller can hold it without a second query.
 */
export function insertDiagramPlaceholder(pre: Element): HTMLElement {
  const figure = pre.ownerDocument.createElement('figure');
  figure.className = DIAGRAM_FIGURE_CLASS;
  figure.setAttribute(DIAGRAM_STATE_ATTR, 'pending');
  figure.setAttribute('aria-hidden', 'true');
  pre.setAttribute(DIAGRAM_STATE_ATTR, 'pending');
  pre.after(figure);
  return figure;
}

/**
 * D-15's flip: commit already-prepared content into the figure and hide the source.
 *
 * `content` is a NODE, never a string — this module has no innerHTML assignment and must never
 * acquire one. Group 3.2 hands it the adopted `<template>.content` from `mount.ts:131-133`'s
 * sanitize-then-inert-parse-then-adopt sequence; the sanitization and the inert parse are that
 * task's, and keeping this signature node-shaped is what stops a later caller from taking the
 * shortcut.
 *
 * Order matters on a slow frame: the content is committed BEFORE the source is hidden, so there is
 * no instant in which neither is on screen.
 */
export function markDiagramRendered(pre: Element, figure: HTMLElement, content: Node): void {
  figure.replaceChildren(content);
  figure.setAttribute(DIAGRAM_STATE_ATTR, 'rendered');
  figure.removeAttribute('aria-hidden');
  pre.setAttribute(DIAGRAM_STATE_ATTR, 'rendered');
}

/**
 * The degraded state: drop the placeholder, name the failure, leave the source fence visible.
 *
 * The empty <figure> is REMOVED rather than left in place — it never received content, and an empty
 * bordered box below a code fence reads as a broken image rather than as "this stayed source". The
 * marker takes its place in the flow, so the slot the diagram would have occupied says why it did
 * not. The <pre> is marked `failed` rather than reverted to `pending` so a re-enhancement pass can
 * tell "not tried yet" from "tried and did not work".
 *
 * `reason` is REQUIRED, not optional: §4 asks for "an inline marker naming the failure", and an
 * optional parameter is how the three §3.8 paths would drift into one indistinguishable message.
 * It is written with `textContent` — this module still has no innerHTML assignment (see the header)
 * and the copy is ours, but the rule is the construction, not the provenance of one string.
 */
export function markDiagramFailed(pre: Element, figure: HTMLElement, reason: string): void {
  figure.remove();
  pre.setAttribute(DIAGRAM_STATE_ATTR, 'failed');

  // Idempotent: a second failure on the same fence replaces its marker rather than stacking one.
  const existing = pre.nextElementSibling;
  if (existing?.classList.contains(DIAGRAM_ERROR_CLASS)) existing.remove();

  const marker = pre.ownerDocument.createElement('p');
  marker.className = DIAGRAM_ERROR_CLASS;
  marker.textContent = `Diagram not shown — ${reason}.`;
  pre.after(marker);
}
