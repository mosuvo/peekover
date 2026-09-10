// mathView — D-15's structure reused for block/fence math (D-8-R): the same three states, the
// same sibling-<figure>-hides-the-<pre> mechanism `diagramView.ts` established. Builds no markup
// from a formula's LaTeX source and imports no engine: it is the shape `mathEnhancer.ts` mutates.
// (Imports ONE pure string constant from `mathEngine.ts` below, §8-1(b)'s own fix — that module's
// `temml` import is a dynamic one gated inside a function, never evaluated by this static import,
// so nothing here changes what graph either module is reachable from, D-3-R's own invariant.)
//
// ── 6.1-R: THE PER-FORMULA CONTROL GROUP (D-6-R, §8-1) ────────────────────────────────────────
//
// `markMathRendered` now builds (or re-attaches) a hover/focus control group exactly the way
// `diagramView.ts`'s own `markDiagramRendered` does for diagrams — same `mathControlsOf(figure)
// ?? buildMathControls(figure)` reuse shape, same "content stays FIRST" ordering (row 14,
// `mathEnhancer.test.ts:235`'s own firstElementChild pin). Two actions, copy-as-LaTeX and
// copy-as-MathML — D-6-R's own SIMPLIFICATION from the original two-output-choice design: Temml
// produces exactly ONE rendered tree, so copy-as-MathML has no mode to pick.
//
// Both actions resolve their artifact from the LIVE DOM AT ACTIVATION TIME (row 14), never from a
// build-time closure: `sourcePreOf` reads the figure's PREVIOUS SIBLING (the `<pre>`
// `insertMathPlaceholder` put it beside and nothing ever moves), `currentMathRoot` reads the
// figure's OWN `<math>` descendant. Copy-as-LaTeX therefore reads the RETAINED SOURCE TEXT — never
// a round-trip through the rendered tree — and copy-as-MathML clones and serializes the SAME
// `<math>` tree the reader is looking at, mirroring `diagramView.ts`'s own "the artifact both
// actions operate on is the one on screen" property exactly, one engine's output instead of two.
//
// `retainedMathSource` DUPLICATES (rather than imports) `mathEnhancer.ts`'s own `mathSourceOf`
// peeling rule. The two cannot share one function without a `mathView` <-> `mathEnhancer` import
// cycle — `mathEnhancer.ts` already imports FROM this module (`MATH_STATE_ATTR`,
// `insertMathPlaceholder`, `markMathRendered`, ...), so this module importing back would be
// circular. The peel is two lines and content-shape-only (never origin metadata, same discipline
// `mathSourceOf`'s own doc comment states), so the duplication is a small, low-drift-risk cost
// bought for keeping this task's own diff inside `mathView.ts` alone (its sealed Files line).
//
// ── 6.2-R: THE DOCUMENT-LEVEL "COPY ALL FORMULAS AS MathML" ACTION (§8-1(b)) ───────────────────
//
// Inline math has no per-formula control group to put a copy-as-MathML button in (D-7-R: a
// sibling would break prose flow) — §8-1(b)'s ruling routes inline's own copy-as-MathML through
// ONE document-level action instead, that collects EVERY currently-rendered `<math>` root (block
// AND inline) and serializes each with the SAME `serializedMathMl` helper 6.1-R's per-formula
// action already uses. This module owns the collection/serialization (`copyAllMathAsMathml`); the
// panel/menu-row itself lives in `exportControls.ts` (the M10 export-panel precedent named at
// gate 3) — a document-level action is app-page chrome, not a per-figure control, so it belongs
// beside the other document-level copy rows, not in this file's own per-formula group.
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
//
// ── §8-1(b) FIX — INLINE SOURCE-RECOVERY (D-7-R, ruled fix-before-close at 8.1-R) ────────────────
//
// 6.2-R measured the gate-2 ruling's own claim FALSE for the common case: once `markMathInlineRendered`
// replaces a `<code class="peekover-math-inline">` element's children with the rendered `<math>` tree,
// the literal `$…$` source is gone — text-selection of the element then copies the rendered GLYPH
// string, never the source (this file's own header above still describes the PRE-fix shape; see
// `mathActions.browser.test.ts`'s own header for the full measured account).
//
// TWO candidate mechanisms were diagnosed against real engine behaviour before picking one:
//
//   1. A `data-*` ATTRIBUTE on the `<code>` element, set via `Element.setAttribute` — the mechanism
//      below, `MATH_INLINE_SOURCE_ATTR`. Diagnosed: `sanitizeMath`'s `ALLOW_DATA_ATTR: false`
//      (`sanitize.ts`) is IRRELEVANT here — that config gates the RENDERED FORMULA STRING Temml
//      produces (what becomes the `<math>` fragment `replaceChildren`s the element's CHILDREN), never
//      the `<code>` CONTAINER's own attributes, which this fix sets directly on an already-mounted
//      DOM node the same way `markMathInlineFailed` already sets `title`/`MATH_INLINE_FAILED_ATTR` on
//      it — no sanitizer profile is touched or widened. Measured directly (a scratch real-browser
//      probe, both engines): a value containing a literal newline AND a backslash
//      (`retainedMathInlineSource`'s own worst-case shape) round-trips `setAttribute`/`getAttribute`
//      byte-identical, and survives an `outerHTML`-serialize-then-reparse round trip identically too.
//   2. A VISUALLY-HIDDEN SOURCE NODE beside the `<math>` tree, so ordinary text-selection of the
//      `<code>` element keeps recovering the source (preserving §8-1(b)'s ORIGINAL mechanism).
//      Diagnosed, both engines, with a real `Range`/`Selection`/Ctrl+C round trip: selecting a whole
//      SENTENCE around an inline formula pollutes the copied prose with the hidden source mid-word
//      (`"Before text \r\nx\r\n$x+y$ after text."` Chromium / `"Before text x$x+y$ after text."`
//      Firefox) — a regression to the single most common text-copy action, for any document
//      containing inline math. Adding `user-select:none` to the hidden node closes THAT hole (both
//      engines correctly exclude it from a whole-sentence copy) but, measured immediately after,
//      ALSO removes it from a copy that selects ONLY the `<code>` element itself — the one selection
//      §8-1(b)'s own mechanism depends on. There is no CSS-only middle ground: browser text selection
//      is RANGE-based, not node-scoped, so "selectable in isolation, excluded from a wider selection"
//      is not an available state. Mechanism 2 REJECTED on this measured, unresolvable trade-off.
//
// PICKED: mechanism 1. It costs nothing in the sanitizer, adds no visible/selectable DOM (no prose-
// copy or double-announce risk), and needs no new per-formula inline chrome (row 11, still negative).
// What it DOES need: a way to READ the attribute, since inline has no per-formula control group to
// put a copy affordance in (D-7-R) and row 11 forbids adding one — routed through a NEW document-
// level "copy all formulas as LaTeX" action below, parallel to 6.2-R's own "copy all formulas as
// MathML" (`allMathRootsIn`/`serializedMathMlDocument`/`copyAllMathAsMathml`), the exact shape the
// diagnosis above names as the clean fit. Lives beside that action in `exportControls.ts` — a
// document-level action is app-page chrome, not a per-figure control (this file's own 6.2-R header,
// restated).

import { MATH_INLINE_SELECTOR } from './mathEngine';

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

/** §8-1(b) FIX — the inline-only source-retention attribute {@link markMathInlineRendered} sets
 *  directly on the `<code>` element BEFORE replacing its children, so a rendered inline formula's
 *  LaTeX source survives past the instant its "AT REST" text content stops being it. Set via
 *  `Element.setAttribute` on an already-mounted node — never through `sanitizeMath` (which only
 *  ever sees the RENDERED formula string, never this container's own attributes) — the identical
 *  posture {@link MATH_INLINE_FAILED_ATTR} already established on this same element. See this
 *  file's own §8-1(b) FIX header for the two-mechanism diagnosis that picked this one. */
export const MATH_INLINE_SOURCE_ATTR = 'data-math-source';

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
 *
 * ── WHY THE CONTROL GROUP IS RE-INSERTED RATHER THAN REBUILT (6.1-R, §3.5 row 14) ───────────────
 *
 * Mirrors `markDiagramRendered`'s own reasoning exactly: this is the one seam a figure becomes
 * `rendered` through, so the group is built on the first call and MOVED BACK IN (never rebuilt) on
 * any later one. Content stays FIRST (`mathEnhancer.test.ts:235`'s own firstElementChild pin).
 */
export function markMathRendered(pre: Element, figure: HTMLElement, content: Node): void {
  const controls = mathControlsOf(figure) ?? buildMathControls(figure);
  figure.replaceChildren(content, controls.group, controls.status);
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
 *
 * ── 6.1-R: NOW ALSO CARRIES `title` + {@link MATH_INLINE_FAILED_ATTR} ON THE `<pre>` ────────────
 *
 * 4.3-R/5.1-R flagged a real inconsistency: inline's own failure annotation (`title` + a
 * machine-readable attribute, `markMathInlineFailed` below) satisfies §3.5 row 15's "text+aria,
 * never colour alone" more literally than this function's own text-only paragraph did. This task
 * owns this file already (the control-group task), and the fix is small, mechanical, and carries no
 * visual change (a `title` attribute paints no chrome; a `data-*` attribute is inert to layout), so
 * it is DECIDED HERE — both engines' failure UI now carry the SAME annotation shape, on the element
 * that stays visible as the source (the `<pre>` here, the `<code>` there). The constant keeps its
 * "INLINE"-named identifier (renaming it would ripple into `mathDegrade.browser.test.ts`, outside
 * this task's own Files line) — only its VALUE (`'data-math-failed'`) is now shared by both markers.
 */
export function markMathFailed(pre: Element, figure: HTMLElement, reason: string): void {
  figure.remove();
  pre.setAttribute(MATH_STATE_ATTR, 'failed');
  pre.setAttribute(MATH_INLINE_FAILED_ATTR, reason);
  pre.setAttribute('title', `Formula not shown — ${reason}.`);

  const existing = pre.nextElementSibling;
  if (existing?.classList.contains(MATH_ERROR_CLASS)) existing.remove();

  const marker = pre.ownerDocument.createElement('p');
  marker.className = MATH_ERROR_CLASS;
  marker.textContent = `Formula not shown — ${reason}.`;
  pre.after(marker);
}

/**
 * Read an inline marker's bare LaTeX source. DUPLICATES `mathEnhancer.ts`'s own
 * `mathInlineSourceOf` peeling rule exactly (content-shape only, never origin metadata) rather than
 * importing it — this file's own header states why (a `mathView` <-> `mathEnhancer` import cycle).
 * Must be called BEFORE {@link markMathInlineRendered} replaces `code`'s children — `code.textContent`
 * is only still the literal `$…$` source at that instant (D-7-R's own "AT REST" property).
 */
function retainedMathInlineSource(code: Element): string {
  const raw = code.textContent ?? '';
  return raw.length >= 2 && raw.startsWith('$') && raw.endsWith('$') ? raw.slice(1, -1) : raw;
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
 *
 * ── §8-1(b) FIX ────────────────────────────────────────────────────────────────────────────────
 *
 * {@link MATH_INLINE_SOURCE_ATTR} is set FIRST, reading the source while it is still `code`'s own
 * text content — the one instant this function has it — so it survives the `replaceChildren` call
 * that follows. See this file's own §8-1(b) FIX header for the two-mechanism diagnosis.
 */
export function markMathInlineRendered(code: Element, content: Node): void {
  code.setAttribute(MATH_INLINE_SOURCE_ATTR, retainedMathInlineSource(code));
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

// ── §8-1 / D-6-R: BLOCK MATH'S PER-FORMULA CONTROL GROUP (task 6.1-R) ─────────────────────────
//
// Copy-as-LaTeX and copy-as-MathML — `diagramView.ts`'s own §3.11 control-group MECHANISM (real
// buttons, resolved-at-activation-time actions, the reuse-across-re-render shape) reused verbatim.
// Not a context menu: `contextMenus` is a manifest permission and neither action needs one.
//
// ★ NO CSS IS ADDED HERE — a deliberate scope decision, not an oversight. Diagram's own hover/
// focus-reveal chrome lives in `mathCss.ts`'s sibling `readerCss.ts`; the equivalent for math would
// have to live in THIS module's own separate stylesheet (`mathCss.ts`, per that file's own header —
// folding it into the always-loaded `readerCss.ts` would bloat content-script bytes the same way
// that file's header already found once). None of this task's own Verify rows (11, 14, 16, 20)
// mandate a hover-reveal ANIMATION — row 11 is about the group's EXISTENCE, row 16 about real
// `<button>`s, row 20 about the live region — so the two buttons ship VISIBLE-BY-DEFAULT (unstyled,
// inheriting the browser's own button chrome) rather than reaching into `mathCss.ts`, which is
// outside this task's own sealed Files line. Visual polish (a hover-reveal treatment matching
// diagram's own) is left for a follow-up/8.1-R's own visual walk to add, if wanted.
//
// ── ZERO NEW DEPENDENCIES (D-6-R) ─────────────────────────────────────────────────────────────
//
// Copy-as-MathML is `Element.cloneNode` + the browser's own `XMLSerializer` — both platform
// built-ins already used by `diagramView.ts`'s own `diagramSvgText`. No MathML library is priced
// or imported; the serialized string comes for free from the tree Temml already rendered.

/** Class on the group. `readerCss.ts`/`mathCss.ts` may key hover/focus reveal off it. */
export const MATH_ACTIONS_CLASS = 'peekover-math-actions';

/** Class on each action button in that group. */
export const MATH_ACTION_CLASS = 'peekover-math-action';

/** Class on the per-formula polite live region (row 20). */
export const MATH_STATUS_CLASS = 'peekover-math-status';

/** `data-action` on the two buttons. */
export const MATH_COPY_LATEX_ACTION = 'copy-latex';
export const MATH_COPY_MATHML_ACTION = 'copy-mathml';

/** `data-state` on a button once its action has resolved — mirrors
 *  `DIAGRAM_ACTION_STATE_ATTR`'s own role as row 15's third carrier. */
export const MATH_ACTION_STATE_ATTR = 'data-state';

/** MathML's namespace URI. Set explicitly on the SERIALIZED clone's root — mirrors
 *  `diagramSvgText`'s own explicit `xmlns` — a fragment cloned out of an HTML document may not
 *  carry one on serialization, and a standalone MathML string needs one to be well-formed. */
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

/** The group and its live region, as {@link markMathRendered} moves them across a re-render. */
interface MathControls {
  readonly group: HTMLElement;
  readonly status: HTMLElement;
}

/** The controls already on a figure, or `null` on the first render. Read from the DOM, never a
 *  map — mirrors `diagramControlsOf`'s own reasoning (§3.3 forbids cross-mount state). */
function mathControlsOf(figure: HTMLElement): MathControls | null {
  const group = figure.querySelector<HTMLElement>(`.${MATH_ACTIONS_CLASS}`);
  const status = figure.querySelector<HTMLElement>(`.${MATH_STATUS_CLASS}`);
  return group && status ? { group, status } : null;
}

/** Which formula this is, counted over the figures in the same tree — mirrors `diagramOrdinal`. */
function mathOrdinal(figure: HTMLElement): number {
  const root = figure.getRootNode() as ParentNode;
  const figures = root.querySelectorAll?.(`figure.${MATH_FIGURE_CLASS}`);
  const index = figures ? Array.prototype.indexOf.call(figures, figure) : -1;
  return index < 0 ? 1 : index + 1;
}

/**
 * The source `<pre>` a rendered figure sits beside, resolved from the LIVE DOM at activation time
 * (row 14) — never captured in a build-time closure. `insertMathPlaceholder` puts the figure
 * immediately after the pre (`pre.after(figure)`) and nothing in this module ever moves either
 * one, so the sibling relationship IS the figure's own answer to "which formula is this."
 */
function sourcePreOf(figure: HTMLElement): Element {
  const pre = figure.previousElementSibling;
  if (!pre) throw new Error('this formula has no retained source');
  return pre;
}

/**
 * Read a fence's bare LaTeX source. DUPLICATES `mathEnhancer.ts`'s own `mathSourceOf` peeling rule
 * exactly (content-shape only, never origin metadata) rather than importing it — see this file's
 * own header for why (a `mathView` <-> `mathEnhancer` import cycle).
 */
function retainedMathSource(pre: Element): string {
  const raw = pre.querySelector('code')?.textContent ?? '';
  if (raw.length >= 4 && raw.startsWith('$$') && raw.endsWith('$$')) {
    return raw.slice(2, -2);
  }
  return raw;
}

/** The figure's own live `<math>` root, resolved at ACTIVATION time (row 14) — mirrors
 *  `currentDiagramSvg`'s own reasoning. */
function currentMathRoot(figure: HTMLElement): Element {
  const math = figure.querySelector('math');
  if (!math) throw new Error('this formula is not on screen');
  return math;
}

/** A CLONE of the live `<math>` tree, serialized standalone. `xmlns` is set on the clone so the
 *  round-tripped string carries its own namespace declaration (mirrors `diagramSvgText`). */
function serializedMathMl(math: Element): string {
  const clone = math.cloneNode(true) as Element;
  clone.setAttribute('xmlns', MATHML_NAMESPACE);
  return new XMLSerializer().serializeToString(clone);
}

/**
 * The write, as a promise that never throws synchronously — mirrors `tableTools.ts`'s own
 * `writeToClipboard` shape (`navigator.clipboard` is `undefined` outside a secure context, so the
 * property read alone can throw one line before `writeText` itself would).
 */
async function writeMathText(doc: Document, text: string): Promise<void> {
  const clipboard = doc.defaultView?.navigator?.clipboard;
  if (!clipboard?.writeText) throw new Error('the clipboard is unavailable');
  await clipboard.writeText(text);
}

/** Copy the CURRENT figure's retained LaTeX source to the clipboard, byte-identical (D-6-R). */
async function copyMathAsLatex(figure: HTMLElement): Promise<void> {
  const source = retainedMathSource(sourcePreOf(figure));
  await writeMathText(figure.ownerDocument, source);
}

/** Copy the CURRENT figure's rendered `<math>` tree to the clipboard, serialized MathML (D-6-R). */
async function copyMathAsMathml(figure: HTMLElement): Promise<void> {
  const mathml = serializedMathMl(currentMathRoot(figure));
  await writeMathText(figure.ownerDocument, mathml);
}

// ── §8-1(b) / D-6-R: THE DOCUMENT-LEVEL "COPY ALL FORMULAS AS MathML" ACTION (task 6.2-R) ────
//
// The gate-2 ruling routes inline copy-as-MathML through ONE document-level action, since
// text-selection (inline's own copy-as-LaTeX mechanism, §8-1(b)) cannot produce a rendered TREE
// for inline math — there is no per-formula inline control group to put a button in (D-7-R, 5.1-R
// re-confirmed). This action collects every CURRENTLY RENDERED `<math>` root — block/fence AND
// inline, in document order — and serializes each with the SAME `serializedMathMl` clone-and-
// -XMLSerializer helper 6.1-R's per-formula action already uses. Zero new dependencies (D-6-R):
// still just `Element.cloneNode` + `XMLSerializer`, now looped rather than called once.
//
// A `<math>` element exists in the DOM only once its own formula has actually rendered — a
// pending or failed marker never contains one — so `querySelectorAll('math')` needs no separate
// `data-math` filtering of its own to exclude them.

/** Every rendered `<math>` root under `root` (a shadow root, in production), in document order —
 *  both block/fence figures and inline markers, whichever have actually settled to `rendered`. */
export function allMathRootsIn(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('math'));
}

/**
 * Serialize every rendered formula into ONE clipboard payload — one well-formed `<math>` root per
 * line (each individually round-trip-parseable; the payload as a whole is not itself one
 * well-formed XML document, since multiple root elements can never be). Throws when the document
 * has nothing rendered yet — never a false "Copied" (AGENTS.md #5); the caller (the panel row's
 * `onClick`) surfaces the rejection as `reportCopyOutcome(key, false)`, the same shape every other
 * copy row already uses for a failed write.
 */
export function serializedMathMlDocument(root: ParentNode): string {
  const roots = allMathRootsIn(root);
  if (roots.length === 0) throw new Error('this document has no rendered formulas');
  return roots.map(serializedMathMl).join('\n');
}

/**
 * Copy every rendered formula in `host`'s shadow tree to the clipboard as MathML (§8-1(b)). The
 * panel/menu-row action's own entry point — `host` is the app-page reader host `appShell.ts`
 * already resolves for every other export/copy row, never a build-time closure over a specific
 * figure (mirrors this module's own per-formula actions' "resolve from the live DOM" discipline,
 * widened to the whole document).
 */
export async function copyAllMathAsMathml(host: HTMLElement): Promise<void> {
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('this document has no rendered formulas');
  const mathml = serializedMathMlDocument(shadow);
  await writeMathText(host.ownerDocument, mathml);
}

// ── §8-1(b) FIX: THE DOCUMENT-LEVEL "COPY ALL FORMULAS AS LaTeX" ACTION ───────────────────────
//
// This file's own §8-1(b) FIX header names this action as the read side of the inline
// source-recovery fix (mechanism 1, `MATH_INLINE_SOURCE_ATTR`): inline has no per-formula control
// group to put a copy affordance in (D-7-R) and row 11 forbids adding one, so recovering an
// inline formula's LaTeX source is routed through ONE document-level action, mirroring
// `copyAllMathAsMathml` immediately above — block math keeps its own EXISTING per-figure
// copy-as-LaTeX button (`copyMathAsLatex`, unaffected), this action just adds an aggregate reading
// each RENDERED formula's retained source (block: its sibling `<pre>`, already exposed via
// {@link retainedMathSource}; inline: the attribute this fix sets on `markMathInlineRendered`).

/**
 * Every rendered formula's retained LaTeX source, in document order — block/fence figures (their
 * sibling `<pre>`) and inline markers ({@link MATH_INLINE_SOURCE_ATTR}) alike. ONE combined
 * selector (mirrors {@link allMathRootsIn}'s own single-query shape) so block/inline interleaving
 * in the document survives — two separate queries concatenated would group every block before every
 * inline regardless of where each actually sits. Only `rendered` markers are included — a pending
 * or failed marker has no settled source for this action to report (mirrors `allMathRootsIn`'s own
 * "only what has actually rendered" scope).
 */
export function allMathSourcesIn(root: ParentNode): string[] {
  const selector = [
    `figure.${MATH_FIGURE_CLASS}[${MATH_STATE_ATTR}="rendered"]`,
    `${MATH_INLINE_SELECTOR}[${MATH_STATE_ATTR}="rendered"]`,
  ].join(', ');
  return Array.from(root.querySelectorAll<HTMLElement>(selector), (el) =>
    el.tagName === 'FIGURE'
      ? retainedMathSource(sourcePreOf(el))
      : (el.getAttribute(MATH_INLINE_SOURCE_ATTR) ?? ''),
  );
}

/**
 * Serialize every rendered formula's LaTeX source into ONE clipboard payload, one formula per
 * BLANK-LINE-separated paragraph — a bare `\n` (mirrors {@link serializedMathMlDocument}'s own
 * join) would be ambiguous for a genuinely multi-line block source (a formula's own retained text
 * can itself carry interior newlines, unlike a single well-formed MathML root, which is always
 * self-delimiting XML). Throws when the document has nothing rendered yet — never a false "Copied"
 * (AGENTS.md #5), the same contract {@link serializedMathMlDocument} holds.
 */
export function serializedMathSourceDocument(root: ParentNode): string {
  const sources = allMathSourcesIn(root);
  if (sources.length === 0) throw new Error('this document has no rendered formulas');
  return sources.join('\n\n');
}

/**
 * Copy every rendered formula's LaTeX source in `host`'s shadow tree to the clipboard (§8-1(b)
 * FIX) — mirrors {@link copyAllMathAsMathml}'s own shape exactly, one artifact type earlier in the
 * render pipeline.
 */
export async function copyAllMathAsLatex(host: HTMLElement): Promise<void> {
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('this document has no rendered formulas');
  const source = serializedMathSourceDocument(shadow);
  await writeMathText(host.ownerDocument, source);
}

/** One action's strings — mirrors `DiagramActionCopy` exactly. Row 17's names carry BOTH the
 *  selection and the action; row 15's state is carried by the visible text AND the accessible name
 *  AND `data-state`. */
interface MathActionCopy {
  readonly action: string;
  readonly idleText: string;
  readonly doneText: string;
  readonly failedText: string;
  readonly idleName: (n: number) => string;
  readonly doneName: (n: number) => string;
  readonly failedName: (n: number) => string;
  readonly doneStatus: (n: number) => string;
  readonly failedStatus: (n: number) => string;
}

const MATH_ACTION_COPY: readonly MathActionCopy[] = [
  {
    action: MATH_COPY_LATEX_ACTION,
    idleText: 'Copy LaTeX',
    doneText: 'Copied',
    failedText: 'Copy failed',
    idleName: (n) => `Formula ${n}. Activate to copy it as LaTeX.`,
    doneName: (n) => `Formula ${n} copied as LaTeX. Activate to copy it again.`,
    failedName: (n) => `Formula ${n} could not be copied as LaTeX. Activate to try again.`,
    doneStatus: (n) => `Formula ${n} copied as LaTeX.`,
    failedStatus: (n) => `Formula ${n} could not be copied as LaTeX.`,
  },
  {
    action: MATH_COPY_MATHML_ACTION,
    idleText: 'Copy MathML',
    doneText: 'Copied',
    failedText: 'Copy failed',
    idleName: (n) => `Formula ${n}. Activate to copy it as MathML.`,
    doneName: (n) => `Formula ${n} copied as MathML. Activate to copy it again.`,
    failedName: (n) => `Formula ${n} could not be copied as MathML. Activate to try again.`,
    doneStatus: (n) => `Formula ${n} copied as MathML.`,
    failedStatus: (n) => `Formula ${n} could not be copied as MathML.`,
  },
];

/**
 * Build the control group and its live region for a figure that has just become `rendered`.
 *
 * Real `<button>`s with no `tabindex` of their own (row 16) — keyboard-operable and in the tab
 * order natively. Nothing here registers a key handler. The live region is `role="status"` and
 * `hidden` while empty (row 20) — `diagramView.ts`'s own shape, a `<div>` so it never inherits the
 * reading column's own paragraph typography.
 */
function buildMathControls(figure: HTMLElement): MathControls {
  const doc = figure.ownerDocument;
  const ordinal = mathOrdinal(figure);

  const status = doc.createElement('div');
  status.className = MATH_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;

  const group = doc.createElement('div');
  group.className = MATH_ACTIONS_CLASS;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', `Formula ${ordinal} actions`);

  for (const copy of MATH_ACTION_COPY) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = MATH_ACTION_CLASS;
    button.dataset.action = copy.action;
    button.textContent = copy.idleText;
    button.setAttribute('aria-label', copy.idleName(ordinal));
    button.addEventListener('click', () => {
      void runMathAction(button, copy);
    });
    group.appendChild(button);
  }

  return { group, status };
}

/**
 * Run one action and report the outcome in text, in `aria-*` and in the live region — mirrors
 * `runDiagramAction` exactly. Everything is resolved from the button, here, now (row 14): the
 * figure via `closest`, the source/tree via {@link sourcePreOf}/{@link currentMathRoot}.
 */
async function runMathAction(button: HTMLButtonElement, copy: MathActionCopy): Promise<void> {
  const figure = button.closest<HTMLElement>(`figure.${MATH_FIGURE_CLASS}`);
  if (!figure) return;
  const controls = mathControlsOf(figure);
  const ordinal = mathOrdinal(figure);

  const settle = (text: string, name: string, state: string, message: string): void => {
    button.textContent = text;
    button.setAttribute('aria-label', name);
    button.setAttribute(MATH_ACTION_STATE_ATTR, state);
    if (!controls) return;
    controls.status.textContent = message;
    controls.status.hidden = false;
  };

  try {
    if (copy.action === MATH_COPY_LATEX_ACTION) await copyMathAsLatex(figure);
    else await copyMathAsMathml(figure);
    settle(copy.doneText, copy.doneName(ordinal), 'done', copy.doneStatus(ordinal));
  } catch {
    settle(copy.failedText, copy.failedName(ordinal), 'failed', copy.failedStatus(ordinal));
  }
}
