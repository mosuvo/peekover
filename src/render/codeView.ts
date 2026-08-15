// codeView — D-6's retained/highlighted structure and its lifecycle attribute, and nothing else at
// this task. It builds no markup from the fence's text, imports no engine, and knows nothing about
// Shiki: it is the shape the enhancer (from task 4.2 on) mutates. The toolbar controls, the collapse
// structure and the failure marker plan.md §2's Create list also assigns this module land in the
// later tasks that need them (4.2's `markCodeFailed`, 4.3's toolbar, 6.1's collapse) — task 4.1's own
// surface is the pending/rendered pair only, mirroring `diagramView.ts`'s task-3.1 scope exactly.
//
// ── D-6: THE RETAINED <pre> IS THE STATE, AND THE WRAPPER OWNS BOTH HALVES ────────────────────
//
// `plan.md`'s D-6 text is explicit that the wrapper "wraps BOTH the retained `<pre>` … and the
// newly-built highlighted `<pre>`" — unlike `diagramView.ts`'s figure, which sits as a plain SIBLING
// of the source `<pre>` it never contains. So the original `<pre>` is not left where markdown-it put
// it: a `<div class="peekover-code">` wrapper is inserted at that position (`pre.after(wrapper)`) and
// the `<pre>` is then MOVED inside it (`wrapper.append(pre)`). Re-parenting is not mutation — the
// node keeps its attributes, its children and its identity, so a caller holding a reference to it
// (4.3's copy control, reading `pre.textContent`) sees nothing different. The wrapper is what gives
// the toolbar (4.3) a single `position:relative` box to anchor its corner controls against, without
// needing a second query to find "the pair" once a highlighted sibling exists alongside the retained
// one.
//
// ── WHY THE WRAPPER IS NOT `aria-hidden` WHILE PENDING ─────────────────────────────────────────
//
// `diagramView.ts`'s placeholder `<figure>` is `aria-hidden` while pending because it is EMPTY —
// there is nothing for a screen reader to announce until the diagram renders. The code wrapper is
// the opposite: it contains the retained `<pre>`'s real, already-readable text from the moment it is
// built, so hiding it from assistive technology would hide content that was already accessible
// before this task's own code ran. Nothing is hidden until `markCodeRendered` flips the retained
// `<pre>` to `display:none` (`readerCss.ts`), at which point the newly-adopted content takes its
// place in the accessibility tree by ordinary means (it is live DOM, not `aria-hidden`).
//
// ── THE STATE ATTRIBUTE IS `data-code`, NOT `data-code-state` ─────────────────────────────────
//
// `data-code-state` is task 6.1's own name for the COLLAPSE axis (`"collapsed"` / `"expanded"`) —
// a different state machine over the same element. Reusing it here for the pending/rendered/failed
// lifecycle would collide two independent axes on one attribute the moment 6.1 lands. `data-code`
// mirrors `data-diagram`'s naming exactly: the attribute name matches the feature name, and the two
// axes stay on two attributes, never sharing one.

/**
 * The lifecycle attribute both halves of the pair carry while a highlight pass owns them. Mirrors
 * `diagramView.ts`'s `DIAGRAM_STATE_ATTR`. Distinct from task 6.1's `data-code-state` (the collapse
 * axis) — see the module header.
 */
export const CODE_STATE_ATTR = 'data-code';

/** Class on the wrapper `<div>`. `readerCss.ts`'s rules and the group-4 toolbar controls key off it. */
export const CODE_WRAPPER_CLASS = 'peekover-code';

/**
 * The three states a fence can be in, mirroring `diagramView.ts`'s `DiagramState` shape.
 *
 * `pending` — the wrapper is in the tree, the retained `<pre>` is inside it and fully visible. This
 * is the state the synchronous prologue leaves behind, and — critically — the state a document STAYS
 * in forever if the engine never loads or this task's own code is all that ever runs on it. It is a
 * designed state, not a transient one (007 D-15's "degradation is the default state" property).
 *
 * `rendered` — the only state that hides the retained `<pre>`.
 *
 * `failed` — not produced by this task (task 4.2's per-fence catch produces it); reserved here so
 * later tasks share one type rather than each inventing their own string union.
 */
export type CodeState = 'pending' | 'rendered' | 'failed';

/**
 * Wrap a source `<pre>` in D-6's `<div class="peekover-code">`, and mark the pair pending.
 *
 * The wrapper is inserted at the `<pre>`'s CURRENT position (`pre.after(wrapper)`) and the `<pre>`
 * is then moved inside it — so the wrapper ends up exactly where the `<pre>` used to be, which,
 * since `mount()` commits the fence inside `.peekover-reader`, is inside the reading column by
 * construction rather than by a second rule (§3.11 row 4's containment property).
 *
 * Returns the wrapper so the caller can hold it without a second query.
 */
export function insertCodeWrapper(pre: Element): HTMLElement {
  const wrapper = pre.ownerDocument.createElement('div');
  wrapper.className = CODE_WRAPPER_CLASS;
  wrapper.setAttribute(CODE_STATE_ATTR, 'pending');
  pre.setAttribute(CODE_STATE_ATTR, 'pending');
  pre.after(wrapper);
  wrapper.append(pre);
  return wrapper;
}

/**
 * D-6's flip: commit already-prepared highlighted content into the wrapper and hide the retained
 * source.
 *
 * `content` is a NODE, never a string — this module has no `innerHTML` assignment and must never
 * acquire one. Task 4.2 hands it the DOM `adoptHighlighted` builds directly from `codeToTokens`'s
 * structured result (D-4) — no sanitizer, no markup string, nothing for a profile to have a gap in.
 *
 * Order matters on a slow frame: the content is committed BEFORE the source is hidden, so there is
 * no instant in which neither is on screen.
 */
export function markCodeRendered(pre: HTMLElement, wrapper: HTMLElement, content: Node): void {
  wrapper.append(content);
  wrapper.setAttribute(CODE_STATE_ATTR, 'rendered');
  pre.setAttribute(CODE_STATE_ATTR, 'rendered');
}
