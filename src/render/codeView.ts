// codeView — D-6's retained/highlighted/failed structure and its lifecycle attribute. It builds no
// markup from the fence's text, imports no engine, and knows nothing about Shiki: it is the shape
// `codeEnhancer.ts` mutates, never the module that decides WHAT to build. The toolbar controls and
// the collapse structure plan.md §2's Create list also assigns this module land in the later tasks
// that need them (4.3's toolbar, 6.1's collapse) — task 4.1 built the pending/rendered pair
// (mirroring `diagramView.ts`'s task-3.1 scope exactly); task 4.2 adds {@link markCodeFailed}, the
// pair's third state, still no markup and still no engine knowledge.
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
 * `failed` — produced by {@link markCodeFailed} (task 4.2's per-fence catch): visually identical
 * to `pending` (the retained `<pre>` is still the only visible thing), distinguished only so a
 * later pass can tell "never attempted" from "attempted and declined" without re-deriving it.
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
  // Task 6.1 (D-10): decided the instant the content lands, off the SAME node — see the §6
  // section at the end of this file for why this is the only call site.
  if (content instanceof HTMLElement) applyCollapseIfNeeded(wrapper, content);
}

/**
 * D-4's other outcome (task 4.2): a per-fence failure — engine-load, tokenize, or theme-apply —
 * that the caller's `try`/`catch` caught. Nothing is appended or removed; the pair is left
 * exactly where {@link insertCodeWrapper} put it, `pending`'s own visible state (§3.9's
 * "degradation is the default state" — 007 D-15's same property). Only the state attribute moves,
 * to `'failed'` rather than back to `'pending'`, so a later pass (the toolbar, the collapse
 * threshold) can tell "never attempted" from "attempted and declined" without re-deriving it.
 */
export function markCodeFailed(pre: HTMLElement, wrapper: HTMLElement): void {
  wrapper.setAttribute(CODE_STATE_ATTR, 'failed');
  pre.setAttribute(CODE_STATE_ATTR, 'failed');
}

// ── §3.11: THE PER-FENCE TOOLBAR (task 4.3, D-7) ──────────────────────────────────────────────
//
// ── IN-FLOW, NOT A HOVER-REVEALED CORNER GROUP — AND THAT IS §3.11's OWN ROUTING, NOT A STYLE
// PREFERENCE ──────────────────────────────────────────────────────────────────────────────────
//
// `diagramView.ts`'s control group is `position:absolute`, revealed on hover/focus over the
// figure's corner (`readerCss.ts:656`). This toolbar is NOT that shape. §3.11's routing table
// (plan.md) routes rows 7, 9 and 10 OUT for exactly this reason: *"the toolbar is IN-FLOW inside
// the reading column, not a fixed-position chrome or a modal overlay"* — row 10 names the actual
// precedent, *"deliberately IN flow (row 5's equivalent, same as 008's table toolbar)"*. So this
// mirrors `tableTools.ts`'s toolbar (`table.before(toolbar)`, `display:flex`, normal document
// flow), not `diagramView.ts`'s. It is the FIRST child of D-6's wrapper — the wrapper already
// gives it a box to live in — pushing both `<pre>`s down rather than floating over either one.
// `readerCss.ts` never gives this class `position:absolute`/`position:fixed`.
//
// ── D-7: NO STATE LIVES ANYWHERE BUT THE DOM THIS CALL BUILT ─────────────────────────────────
//
// No module-scope variable, no `WeakMap`. The two toggles read and write ONE attribute each on
// the wrapper this same call built (`CODE_LINE_NUMBERS_ATTR` / `CODE_WRAP_ATTR`), and every
// `enhanceCode` call builds a fresh wrapper via `insertCodeWrapper` — `mount()`'s `replaceChildren`
// (§3.3) discards the old one. A re-render therefore starts every toggle at its default (absent =
// off) BY CONSTRUCTION, the same way D-6's retained/highlighted pair has no cross-mount memory —
// not a reset this module performs, a state that never had anywhere else to live.
//
// ── COPY READS THE RETAINED <pre>, NEVER THE HIGHLIGHTED SIBLING (D-6) ───────────────────────
//
// `pre` is the exact node `codeEnhancer.ts`'s prologue passed to `insertCodeWrapper` — re-parented,
// never rebuilt, so its `textContent` is what 4.2's own test already proved byte-identical to the
// fence's original source. Reading the highlighted sibling's `textContent` instead would walk
// Shiki's span-fragmented tokens, which is exactly the lossy round-trip this module must not risk.

/** Class on the toolbar `<div>`, the FIRST child of the wrapper. `readerCss.ts` lays it out with
 *  `display:flex`, in normal document flow — see the module header. */
export const CODE_TOOLBAR_CLASS = 'peekover-code-toolbar';

/** Class on the decorative language label (row 18 — `aria-hidden`, purely decorative alongside the
 *  toolbar's own accessible controls). */
export const CODE_LANG_CLASS = 'peekover-code-toolbar__lang';

/** Class on the line-numbers toggle `<button>`. */
export const CODE_LINE_NUMBERS_CLASS = 'peekover-code-toolbar__line-numbers';

/** Class on the word-wrap toggle `<button>`. */
export const CODE_WRAP_CLASS = 'peekover-code-toolbar__wrap';

/** Class on the copy `<button>`. */
export const CODE_COPY_CLASS = 'peekover-code-toolbar__copy';

/** Class on the toolbar's own polite live region (row 20) — the copy confirmation and any
 *  toolbar-action-failure message. `diffChrome.ts`/`tableTools.ts`'s shape: `role="status"`,
 *  `hidden` while empty so it is OUT of the accessibility tree until it has something to say. */
export const CODE_STATUS_CLASS = 'peekover-code-toolbar__status';

/** `data-state` on the copy button once its action has resolved (row 15's third carrier, beside
 *  the visible text and the accessible name) — mirrors `DIAGRAM_ACTION_STATE_ATTR`. */
export const CODE_COPY_STATE_ATTR = 'data-state';

/** The two toggles' own state, on the WRAPPER — see the module header's D-7 note. Absent means
 *  off; `readerCss.ts` keys its gutter/wrap rules off the presence of these attributes. */
export const CODE_LINE_NUMBERS_ATTR = 'data-line-numbers';
export const CODE_WRAP_ATTR = 'data-wrap';

/** Class on a highlighted `.line` span (D-8's consumer — `codeEnhancer.ts`'s `adoptHighlighted`
 *  applies it from `parseLineRanges(code.dataset.fenceMeta)`). Background ONLY — row 15's text/
 *  `aria-*` half is the `aria-label` `adoptHighlighted` sets on the same span, not this class. */
export const CODE_LINE_HIGHLIGHT_CLASS = 'peekover-code-line--highlighted';

/** Which code block this is, counted over the wrappers in the same tree — `diagramView.ts`'s
 *  `diagramOrdinal` shape exactly, and for the same reason: row 17's accessible names must carry
 *  the SELECTION as well as the action, and "copy this code block" names no selection at all on a
 *  document with more than one. The prologue inserts every wrapper before any highlighting begins,
 *  so document order is what this counts. */
function codeOrdinal(wrapper: HTMLElement): number {
  const root = wrapper.getRootNode() as ParentNode;
  const wrappers = root.querySelectorAll?.(`.${CODE_WRAPPER_CLASS}`);
  const index = wrappers ? Array.prototype.indexOf.call(wrappers, wrapper) : -1;
  return index < 0 ? 1 : index + 1;
}

/**
 * The write, as a promise that NEVER throws synchronously — `tableTools.ts`'s `writeToClipboard`
 * shape exactly, for the same reason: `navigator.clipboard` is `undefined` outside a secure
 * context, so the property read alone can throw one line before the call that was supposed to.
 */
function writeCodeToClipboard(doc: Document, text: string): Promise<void> {
  try {
    const clipboard = doc.defaultView?.navigator?.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      return Promise.reject(new Error('the clipboard is unavailable'));
    }
    return Promise.resolve(clipboard.writeText(text));
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

/** Row 17's names for the two toggles — SELECTION (which code block) and ACTION, moving with
 *  state (`themeControl.browser.test.ts:250`'s shape). Visible text stays static; the moving half
 *  is the accessible name, mirroring `aria-pressed`'s own on/off semantics. */
const CODE_LINE_NUMBERS_NAME = {
  off: (n: number) => `Code block ${n}. Activate to show line numbers.`,
  on: (n: number) => `Code block ${n}. Line numbers shown. Activate to hide them.`,
};
const CODE_WRAP_NAME = {
  off: (n: number) => `Code block ${n}. Activate to wrap long lines.`,
  on: (n: number) => `Code block ${n}. Long lines wrapped. Activate to stop wrapping.`,
};

/**
 * Build one code block's toolbar: the decorative language label, the two toggles, the copy
 * control and its live region. Built as DOM and never as an HTML string (AGENTS.md #3) — this
 * module still has no `innerHTML` assignment.
 *
 * `pre` is D-6's retained source — copy's one and only source of truth (module header). `lang` is
 * `codeEnhancer.ts`'s already-derived `classToLang` result, passed in rather than re-derived so the
 * toolbar's label and the highlighter's own language choice can never read the class differently.
 *
 * Returns the toolbar element, not yet attached — the caller (`codeEnhancer.ts`'s prologue)
 * `prepend`s it to the wrapper, ahead of the retained `<pre>` (module header: first child, in flow).
 */
export function buildCodeToolbar(wrapper: HTMLElement, pre: HTMLElement, lang: string): HTMLElement {
  const doc = wrapper.ownerDocument;
  const ordinal = codeOrdinal(wrapper);

  const toolbar = doc.createElement('div');
  toolbar.className = CODE_TOOLBAR_CLASS;

  const langLabel = doc.createElement('span');
  langLabel.className = CODE_LANG_CLASS;
  langLabel.setAttribute('aria-hidden', 'true');
  langLabel.textContent = lang;

  const status = doc.createElement('div');
  status.className = CODE_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;
  const announce = (text: string): void => {
    status.textContent = text;
    status.hidden = text === '';
  };

  const lineNumbersButton = doc.createElement('button');
  lineNumbersButton.type = 'button';
  lineNumbersButton.className = CODE_LINE_NUMBERS_CLASS;
  lineNumbersButton.textContent = 'Line numbers';
  lineNumbersButton.setAttribute('aria-pressed', 'false');
  lineNumbersButton.setAttribute('aria-label', CODE_LINE_NUMBERS_NAME.off(ordinal));
  lineNumbersButton.addEventListener('click', () => {
    const on = wrapper.getAttribute(CODE_LINE_NUMBERS_ATTR) !== 'on';
    if (on) wrapper.setAttribute(CODE_LINE_NUMBERS_ATTR, 'on');
    else wrapper.removeAttribute(CODE_LINE_NUMBERS_ATTR);
    lineNumbersButton.setAttribute('aria-pressed', String(on));
    lineNumbersButton.setAttribute(
      'aria-label',
      on ? CODE_LINE_NUMBERS_NAME.on(ordinal) : CODE_LINE_NUMBERS_NAME.off(ordinal),
    );
  });

  const wrapButton = doc.createElement('button');
  wrapButton.type = 'button';
  wrapButton.className = CODE_WRAP_CLASS;
  wrapButton.textContent = 'Wrap';
  wrapButton.setAttribute('aria-pressed', 'false');
  wrapButton.setAttribute('aria-label', CODE_WRAP_NAME.off(ordinal));
  wrapButton.addEventListener('click', () => {
    const on = wrapper.getAttribute(CODE_WRAP_ATTR) !== 'on';
    if (on) wrapper.setAttribute(CODE_WRAP_ATTR, 'on');
    else wrapper.removeAttribute(CODE_WRAP_ATTR);
    wrapButton.setAttribute('aria-pressed', String(on));
    wrapButton.setAttribute('aria-label', on ? CODE_WRAP_NAME.on(ordinal) : CODE_WRAP_NAME.off(ordinal));
  });

  const copyButton = doc.createElement('button');
  copyButton.type = 'button';
  copyButton.className = CODE_COPY_CLASS;
  copyButton.textContent = 'Copy';
  copyButton.setAttribute('aria-label', `Code block ${ordinal}. Activate to copy it.`);
  copyButton.addEventListener('click', () => {
    // D-6: the RETAINED <pre> — never the highlighted sibling, never a duplicated string.
    const text = pre.textContent ?? '';
    writeCodeToClipboard(doc, text).then(
      () => {
        copyButton.textContent = 'Copied';
        copyButton.setAttribute(
          'aria-label',
          `Code block ${ordinal} copied. Activate to copy it again.`,
        );
        copyButton.setAttribute(CODE_COPY_STATE_ATTR, 'done');
        announce(`Code block ${ordinal} copied.`);
      },
      () => {
        copyButton.textContent = 'Copy failed';
        copyButton.setAttribute(
          'aria-label',
          `Code block ${ordinal} could not be copied. Activate to try again.`,
        );
        copyButton.setAttribute(CODE_COPY_STATE_ATTR, 'failed');
        announce(`Code block ${ordinal} could not be copied.`);
      },
    );
  });

  toolbar.append(langLabel, lineNumbersButton, wrapButton, copyButton, status);
  return toolbar;
}

// ── §6: COLLAPSIBLE LONG BLOCKS (task 6.1, D-10) ──────────────────────────────────────────────
//
// `readerMode.ts`'s shape, reused at block scope (this module's header: "THE STATE ATTRIBUTE IS
// `data-code`, NOT `data-code-state`" — the latter is this axis's name, reserved from the start).
// A pure attribute flip over content that already exists: unlike `readerMode.ts`'s raw view,
// there is nothing to build lazily here — {@link markCodeRendered} already committed the full,
// already-highlighted block before this code ever runs. Collapsing only clamps its PRESENTATION
// (`readerCss.ts`'s max-height/overflow rule, keyed off {@link CODE_COLLAPSE_ATTR}'s value) and
// reveals it again on a click — never a re-parse, a re-highlight, or a second copy of the block.
//
// Line count is read off the content `markCodeRendered` just appended — one `.line` span per
// source line (`codeEnhancer.ts`'s `adoptHighlighted`) — so applying the threshold costs one
// `querySelectorAll` over nodes already in memory, not a re-count of the raw source.
//
// UNDER threshold: no attribute is ever set, no control is ever built — "grows no chrome where
// absent" (§3.11 row 2's shape, applied to this axis), tasks.md 6.1's own Verify line. A short
// block's wrapper therefore ends up byte-identical to what task 4.2 already produced.
//
// A theme repaint (`reapplyCodeTheme`) replaces the adopted `pre.shiki` in place and never calls
// {@link markCodeRendered} again, so it never re-decides collapse either — D-9's theme/collapse
// independence holds by construction, not by a guard this code has to remember to keep.

/** How many source lines a highlighted block may carry before it collapses by default.
 *
 *  PROVISIONAL, and deliberately NOT an asserted acceptance threshold (the standing "no
 *  un-measured threshold" rule — mirrors `settings.ts`'s `codeTheme` default and
 *  `watchController.ts`'s dead-watch-read count, both named PROVISIONAL for the same reason).
 *  Group 8's M-4 walks this repository's own fenced blocks and the golden fixtures against line
 *  count, byte size, and whether line-highlighting meta is present (spec §7-3/§8), then RE-TUNES
 *  or replaces this — this task exists to ship SOME threshold so the collapse mechanism has
 *  something to fire against at all, not to choose the right one (same discipline as 5.1's
 *  provisional default theme id). */
export const CODE_COLLAPSE_LINE_THRESHOLD = 40;

/** The collapse axis attribute, on the WRAPPER — a second, independent axis from {@link
 *  CODE_STATE_ATTR} (module header). Absent on a block under threshold (no chrome at all); set to
 *  `'collapsed'` the instant a block over threshold is committed, flipped to `'expanded'` by the
 *  control's own click handler and back again. `readerCss.ts` keys its max-height/overflow clamp
 *  off this attribute's VALUE, never off a JS-measured height — row 12 requires a repeat collapse
 *  to return to EXACTLY the same rect, which a pure CSS rule guarantees by construction and a
 *  JS-cached height could drift from (a stale measurement, a font not yet loaded, a fractional
 *  pixel rounding differently the second time). */
export const CODE_COLLAPSE_ATTR = 'data-code-state';

/** The two values {@link CODE_COLLAPSE_ATTR} takes once a block has collapse chrome at all. */
export type CodeCollapseState = 'collapsed' | 'expanded';

/** Class on the expand/collapse `<button>` — appended as the wrapper's LAST child, after the
 *  highlighted `pre.shiki`, below the clamped preview where a reader's eye lands once the content
 *  cuts off. */
export const CODE_COLLAPSE_CONTROL_CLASS = 'peekover-code-toolbar__collapse';

/** Row 17's shape again (this module's toolbar section, above): SELECTION + ACTION, moving with
 *  state, never carried by the button's static visible text alone. */
const CODE_COLLAPSE_NAME = {
  collapsed: (n: number) =>
    `Code block ${n} truncated at ${CODE_COLLAPSE_LINE_THRESHOLD} lines. Activate to show the full block.`,
  expanded: (n: number) => `Code block ${n} expanded. Activate to collapse it.`,
};

/** Flip {@link CODE_COLLAPSE_ATTR}, and relabel the control's text and `aria-expanded` (row 15:
 *  state in TEXT and `aria-*`, never carried by an icon alone) — the one place both the initial
 *  collapse and every later click funnel through, so the two can never drift apart. */
function setCollapseState(
  wrapper: HTMLElement,
  button: HTMLButtonElement,
  ordinal: number,
  state: CodeCollapseState,
): void {
  wrapper.setAttribute(CODE_COLLAPSE_ATTR, state);
  const expanded = state === 'expanded';
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = expanded ? 'Collapse code' : 'Show full code';
  button.setAttribute('aria-label', CODE_COLLAPSE_NAME[state](ordinal));
}

/**
 * markdown-it's fence token content always ends in exactly one `\n` (the last content line's own
 * terminator — a fence-token-contract property, not this file's choice), which Shiki's line split
 * turns into one PHANTOM trailing empty `.line` span every highlighted block carries, regardless
 * of the source (verified empirically against the installed engine, this task). Not a real source
 * line, so it is excluded here — a real user-typed trailing blank line still counts (it is the
 * SECOND-to-last span in that case, this being the guaranteed terminator's own artifact instead).
 */
function visibleLineCount(content: HTMLElement): number {
  const lines = content.querySelectorAll('.line');
  const last = lines.item(lines.length - 1);
  return last && last.textContent === '' ? lines.length - 1 : lines.length;
}

/**
 * Task 6.1's entry point — called by {@link markCodeRendered} right after `content` lands in the
 * wrapper, the ONLY call site (module header above). `content` is the exact node just appended:
 * its `.line` spans are counted directly, no second parse, no second highlight pass, no second
 * copy of the block (tasks.md 6.1's own text, verbatim).
 *
 * A real `<button type="button">`, keyboard-reachable for free (no `tabindex` of its own — row 16,
 * §4's keyboard-reach criterion), built and appended ONLY when the block is over threshold — a
 * block at or under it gets no attribute and no control at all.
 */
function applyCollapseIfNeeded(wrapper: HTMLElement, content: HTMLElement): void {
  const lineCount = visibleLineCount(content);
  if (lineCount <= CODE_COLLAPSE_LINE_THRESHOLD) return; // under threshold: no chrome at all.

  const ordinal = codeOrdinal(wrapper);
  const button = wrapper.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = CODE_COLLAPSE_CONTROL_CLASS;
  button.addEventListener('click', () => {
    const next: CodeCollapseState =
      wrapper.getAttribute(CODE_COLLAPSE_ATTR) === 'expanded' ? 'collapsed' : 'expanded';
    setCollapseState(wrapper, button, ordinal, next);
  });
  wrapper.append(button);
  setCollapseState(wrapper, button, ordinal, 'collapsed');
}
