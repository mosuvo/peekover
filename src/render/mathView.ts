// mathView — D-15's structure reused for block/fence math (D-8-R): the same three states, the
// same sibling-<figure>-hides-the-<pre> mechanism `diagramView.ts` established, with NO control
// group and NO live region — those are 6.1-R's own job (§3.5 row 11: block math's control group
// exists, but only once copy-as-LaTeX/MathML lands; until then the figure holds only the rendered
// `<math>` tree). Builds no markup from a formula's LaTeX source and imports no engine: it is the
// shape `mathEnhancer.ts` mutates.
//
// ── WHY THE STATE ATTRIBUTE IS ITS OWN NAME, NOT `data-diagram` ───────────────────────────────
//
// D-8-R's own sealed text: "The `data-math` three-state attribute (`pending`/`rendered`/`failed`),
// kept distinct from `data-diagram`" (`plan.md`, D-8-R). A shared attribute would let a selector
// meant for one engine's fences silently match the other's — the exact cross-engine selector
// collision D-8-R names as the reason to keep them apart.
//
// ── WHY THIS FILE HAS NO CONTROL GROUP YET ────────────────────────────────────────────────────
//
// `diagramView.ts`'s own `markDiagramRendered` builds (or re-attaches) a hover/focus control group
// on every call — this module's `markMathRendered` does not, because 4.2-R ships no copy action to
// put in one (`plan.md`'s §3.5 audit, row 11: "D — D-6's mechanism, exercised through the SAME
// hover/focus control-group shape row 11 gives block math", landing at task 6.1-R). Building an
// empty control group now would be chrome with nothing to control — 6.1-R adds it to this same
// `markMathRendered`, not a new function.
//
// ── INLINE (D-7-R, 5.1-R) — THE MUTATE-IN-PLACE INVERSION, NO SIBLING AT ALL ────────────────────
//
// Block/fence math sits BESIDE its source (a sibling `<figure>` hides the `<pre>`); inline math has
// no "beside" to use, so `markMathInlineRendered`/`markMathInlineFailed` mutate the SAME
// `<code class="peekover-math-inline">` element `mathEnhancer.ts` found — never removing it, never
// wrapping it, never inserting a sibling. `MATH_STATE_ATTR` is reused unchanged (a different tag +
// class selector from block's `pre[data-math]`, so there is no cross-shape collision to worry
// about — D-8-R's own "kept distinct from `data-diagram`" concern is about a DIFFERENT engine's
// selector, not a different SHAPE of the same engine's own attribute). On success the element's
// children are replaced with the sanitized `<math>` fragment; on failure they are left untouched
// (the literal `$…$` source stays the visible, accessible content) and the element gains an
// ANNOTATION — `title` (a native tooltip) plus `data-math-failed` (the reason, machine-readable) —
// never a new node, since a sibling would break inline prose flow (the named reason D-7 rejected
// one). This satisfies §3.5 row 15's own **D** requirement ("text+aria, never colour alone") more
// directly than block's own text-only marker does; that inconsistency between the two engines'
// failure UI is a real one, not resolved here (out of this task's Files scope) — routed to 6.1-R/
// 8.1-R's own carried-item list, per 4.3-R's own flag (`tasks.md`, 4.3-R RESULT).

/** The state attribute both halves of the pair carry. Distinct from `data-diagram` (D-8-R). */
export const MATH_STATE_ATTR = 'data-math';

/** Class on the sibling <figure>. `readerCss.ts`'s math rules key off it. */
export const MATH_FIGURE_CLASS = 'peekover-math';

/** Class on §3.9's inline marker (this task builds the structure; 4.3-R proves every failure path
 *  red-first). */
export const MATH_ERROR_CLASS = 'peekover-math-error';

/** The in-place annotation attribute inline math's own failure state carries (D-7-R). Named by
 *  `plan.md`'s D-7-R text exactly — never a class, since nothing new is inserted for it to style. */
export const MATH_INLINE_FAILED_ATTR = 'data-math-failed';

/** The three states a math marker can be in — identical in shape to `DiagramState`. */
export type MathState = 'pending' | 'rendered' | 'failed';

/**
 * Insert the placeholder <figure> as the NEXT SIBLING of a source <pre>, and mark the pair pending.
 *
 * Sibling, not wrapper and not replacement — mirrors `insertDiagramPlaceholder` exactly (D-8-R's
 * "reuse 007's sibling-figure machinery verbatim"). `aria-hidden` while pending: an empty box has
 * nothing to announce, and `markMathRendered` lifts it.
 */
export function insertMathPlaceholder(pre: Element): HTMLElement {
  const figure = pre.ownerDocument.createElement('figure');
  figure.className = MATH_FIGURE_CLASS;
  figure.setAttribute(MATH_STATE_ATTR, 'pending');
  figure.setAttribute('aria-hidden', 'true');
  pre.setAttribute(MATH_STATE_ATTR, 'pending');
  pre.after(figure);
  return figure;
}

/**
 * D-15's flip, for one rendered formula: commit already-sanitized content into the figure and hide
 * the source.
 *
 * `content` is a NODE, never a string — mirrors `markDiagramRendered`'s own signature discipline.
 * The caller hands the adopted `<template>.content` from `sanitizeMath` -> inert-parse -> adopt,
 * so this module never needs (and must never acquire) an innerHTML assignment.
 *
 * Order matters on a slow frame: content committed BEFORE the source is hidden, so there is no
 * instant in which neither is on screen (the same D-15 property `diagramView.ts` states).
 */
export function markMathRendered(pre: Element, figure: HTMLElement, content: Node): void {
  figure.replaceChildren(content);
  figure.setAttribute(MATH_STATE_ATTR, 'rendered');
  figure.removeAttribute('aria-hidden');
  pre.setAttribute(MATH_STATE_ATTR, 'rendered');
}

/**
 * The degraded state: drop the placeholder, name the failure in TEXT (§3.5 row 15), leave the
 * source fence visible.
 *
 * Mirrors `markDiagramFailed` exactly, including the idempotent-marker-replace behaviour (a second
 * failure on the same fence replaces its marker rather than stacking one) and the `textContent`
 * discipline (the copy is ours, but the construction — not the provenance — is the rule this module
 * still has no innerHTML assignment to break).
 */
export function markMathFailed(pre: Element, figure: HTMLElement, reason: string): void {
  figure.remove();
  pre.setAttribute(MATH_STATE_ATTR, 'failed');

  const existing = pre.nextElementSibling;
  if (existing?.classList.contains(MATH_ERROR_CLASS)) existing.remove();

  const marker = pre.ownerDocument.createElement('p');
  marker.className = MATH_ERROR_CLASS;
  marker.textContent = `Formula not shown — ${reason}.`;
  pre.after(marker);
}

/**
 * D-7-R's flip, for one rendered inline formula: replace the `<code class="peekover-math-inline">`
 * element's OWN children with the sanitized `<math>` fragment. The element itself is never removed,
 * never wrapped, never replaced — this is the persistence property `mathInline.browser.test.ts`
 * proves red-first. `content` is a NODE, mirroring {@link markMathRendered}'s own signature
 * discipline — this module never acquires an innerHTML assignment.
 *
 * No aria-label is set: §3.5 row 17's own D requirement is that the accessible name comes from the
 * `<math>` tree itself post-render, so nothing here should override it.
 */
export function markMathInlineRendered(code: Element, content: Node): void {
  code.replaceChildren(content);
  code.setAttribute(MATH_STATE_ATTR, 'rendered');
}

/**
 * The degraded state for inline math: the element's content — the literal `$…$` source — is left
 * completely UNTOUCHED (no `replaceChildren`, no removal), and gains an in-place annotation naming
 * the failure: `title` (a native tooltip) plus {@link MATH_INLINE_FAILED_ATTR} (machine-readable,
 * §3.5 row 15's own D requirement — a colour-blind or non-hover reader still learns which formula
 * failed and why). Never a sibling node — D-7's own named reason: a sibling would break inline prose
 * flow mid-sentence.
 */
export function markMathInlineFailed(code: Element, reason: string): void {
  code.setAttribute(MATH_STATE_ATTR, 'failed');
  code.setAttribute(MATH_INLINE_FAILED_ATTR, reason);
  code.setAttribute('title', `Formula not shown — ${reason}.`);
}
