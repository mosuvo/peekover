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

/** Class on §3.11's per-diagram control group. Positioned INSIDE the figure (row 11). */
export const DIAGRAM_ACTIONS_CLASS = 'peekover-diagram-actions';

/** Class on each action button in that group. */
export const DIAGRAM_ACTION_CLASS = 'peekover-diagram-action';

/** Class on the per-diagram polite live region (row 20) — §4's "a failing action says so". */
export const DIAGRAM_STATUS_CLASS = 'peekover-diagram-status';

/** `data-action` on the two buttons. Exported so the suite names them once, not twice. */
export const DIAGRAM_COPY_ACTION = 'copy';
export const DIAGRAM_DOWNLOAD_ACTION = 'download';

/** §3.11's lightbox trigger: the transparent `<button>` laid over the diagram itself, so that
 *  "activating the diagram" (pointer OR keyboard) is activating a real button (row 16). */
export const DIAGRAM_OPEN_CLASS = 'peekover-diagram-open';

/** The lightbox's own classes. The root is a SIBLING of `.peekover-reader` (row 4's other half),
 *  so none of these may be namespaced under it — see `readerCss.ts`. */
export const DIAGRAM_LIGHTBOX_CLASS = 'peekover-diagram-lightbox';
export const DIAGRAM_LIGHTBOX_PANEL_CLASS = 'peekover-diagram-lightbox__panel';
export const DIAGRAM_LIGHTBOX_VIEW_CLASS = 'peekover-diagram-lightbox__view';
export const DIAGRAM_LIGHTBOX_CLOSE_CLASS = 'peekover-diagram-lightbox__close';

/** `data-state` on a button once its action has resolved — row 15's third carrier, beside the
 *  visible text and the accessible name. It is the ONLY one of the three a colour keys off. */
export const DIAGRAM_ACTION_STATE_ATTR = 'data-state';

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
 *
 * ── WHY THE CONTROL GROUP IS RE-INSERTED RATHER THAN REBUILT (§3.11, row 14) ───────────────────
 *
 * This function is the ONE seam a figure becomes `rendered` through, and it is called TWICE per
 * figure in the ordinary life of a document: once on the first render, and again on every theme
 * flip, where `drawStaleFigures` hands it a fresh SVG for the SAME figure element. So the group is
 * built on the first call and MOVED BACK IN on every later one — the same button objects, with the
 * same listeners, across a swap that replaces everything they act on.
 *
 * That is deliberate, and it is what gives row 14 a defect to have. A handler that captured the
 * `<svg>` (or its serialization) when the group was built would be holding a node the next theme
 * flip detaches, and would copy the PREVIOUS theme's picture while the user looks at the current
 * one. So no handler captures anything: each resolves its figure from the button and its `<svg>`
 * from the figure, at ACTIVATION time. `diagramActions.browser.test.ts` reverts to a build-time
 * capture and requires the saved bytes to go red naming the stale node.
 *
 * The swap stays ONE synchronous `replaceChildren` — `diagramTheme.browser.test.ts` samples the
 * figure per frame and requires it never to be seen without an `<svg>` — and the content stays
 * FIRST, which `diagramEnhancer.test.ts:232` pins.
 */
export function markDiagramRendered(pre: Element, figure: HTMLElement, content: Node): void {
  const controls = diagramControlsOf(figure) ?? buildDiagramControls(figure);
  figure.replaceChildren(content, controls.open, controls.group, controls.status);
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

// ── §3.11: THE PER-DIAGRAM CONTROL GROUP (task 7.1) ───────────────────────────────────────────
//
// Copy-as-image and download-as-SVG, revealed on hover AND on keyboard focus. Not a context menu:
// `contextMenus` is a manifest permission and neither action may need one (§3.11, §7-6).
//
// ── THE ARTIFACT BOTH ACTIONS OPERATE ON IS THE ONE ON SCREEN ────────────────────────────────
//
// Both read the figure's LIVE `<svg>` — the artifact `diagramEnhancer` sanitized through the §3.5
// profile and adopted out of an inert `<template>`. Neither re-renders, and neither can reach the
// engine's raw pre-sanitize string, because this module has no engine and no cache: the only SVG
// in scope is the one the reader is showing. That is a correctness property (what you copy is what
// you see) and a security one (a path back to the raw string would re-admit the `<style>` and
// `<foreignObject>` the profile stripped). It is also why the raster below cannot taint its canvas
// — the sanitized artifact carries no external reference for the canvas to be tainted by.
//
// ── NEITHER ACTION IS A NETWORK CALL (AGENTS.md #1, §3-6) ────────────────────────────────────
//
// `URL.createObjectURL` mints a `blob:` URL over bytes already in this page; loading one into an
// `<img>` and handing another to `<a download>` are same-document reads, not requests. Nothing here
// is reachable except from a click. Task 7.3 re-proves both empirically, in the loaded build, and
// re-reads both built manifests for `permissions: []`.

/** The MIME types the two products carry. Named once — the suite asserts against these. */
const DIAGRAM_PNG_MIME = 'image/png';
const DIAGRAM_SVG_MIME = 'image/svg+xml';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** The trigger, the group and the live region, as {@link markDiagramRendered} moves them across a
 *  re-theme. All three outlive the `<svg>` they sit beside. */
interface DiagramControls {
  readonly open: HTMLElement;
  readonly group: HTMLElement;
  readonly status: HTMLElement;
}

/** The controls already on a figure, or `null` on the first render. Read from the DOM rather than
 *  a map: a WeakMap keyed by figure would be cross-mount state, which §3.3 forbids. */
function diagramControlsOf(figure: HTMLElement): DiagramControls | null {
  const open = figure.querySelector<HTMLElement>(`.${DIAGRAM_OPEN_CLASS}`);
  const group = figure.querySelector<HTMLElement>(`.${DIAGRAM_ACTIONS_CLASS}`);
  const status = figure.querySelector<HTMLElement>(`.${DIAGRAM_STATUS_CLASS}`);
  return open && group && status ? { open, group, status } : null;
}

/**
 * Which diagram this is, counted over the figures in the same tree.
 *
 * Row 17's accessible names must carry the SELECTION as well as the action, and on a document with
 * four diagrams "copy as an image" names no selection at all. The prologue inserts every
 * placeholder before any render begins (`enhanceDiagrams`), so the count is complete and stable by
 * the time any figure reaches `rendered`.
 */
function diagramOrdinal(figure: HTMLElement): number {
  const root = figure.getRootNode() as ParentNode;
  const figures = root.querySelectorAll?.(`figure.${DIAGRAM_FIGURE_CLASS}`);
  const index = figures ? Array.prototype.indexOf.call(figures, figure) : -1;
  return index < 0 ? 1 : index + 1;
}

/** The live `<svg>` of the figure a button belongs to, resolved at ACTIVATION time (row 14). */
function currentDiagramSvg(figure: HTMLElement): SVGSVGElement {
  const svg = figure.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) throw new Error('this diagram is not on screen');
  return svg;
}

/**
 * The size to export at: what the reader is actually showing.
 *
 * `getBoundingClientRect` is the laid-out box, so a diagram the column scaled down exports at the
 * size it is seen. The `viewBox` fallback covers the one case the rect cannot serve — an engine
 * with no layout — and a diagram with neither is not exportable, which is a failure the live region
 * reports rather than a silent 0x0 file.
 */
function diagramPixelSize(svg: SVGSVGElement): { width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  if (rect.width >= 1 && rect.height >= 1) {
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  }
  const box = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (box.length === 4 && box[2] >= 1 && box[3] >= 1) {
    return { width: Math.round(box[2]), height: Math.round(box[3]) };
  }
  throw new Error('this diagram has no measurable size');
}

/**
 * The adopted artifact, serialized standalone.
 *
 * A CLONE, so nothing here can perturb what the reader is showing. `xmlns` is set because a
 * serialized fragment out of an HTML document may carry none and a standalone file needs one;
 * `width`/`height` are set because an `<img>` and a downloaded file both need intrinsic size. Only
 * the inline `max-width` is dropped — mermaid sets it to keep the diagram inside the column, and it
 * would otherwise clamp the raster below the size just measured. The rest of the inline style,
 * including the background colour, is the picture and stays.
 */
function diagramSvgText(svg: SVGSVGElement, size: { width: number; height: number }): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NAMESPACE);
  clone.setAttribute('width', String(size.width));
  clone.setAttribute('height', String(size.height));
  clone.style.removeProperty('max-width');
  return new XMLSerializer().serializeToString(clone);
}

/** Rasterize the serialized artifact to PNG through an `<img>` and a canvas. The `blob:` URL is
 *  revoked in a `finally`, so a decode failure leaks nothing. */
async function diagramPng(
  doc: Document,
  text: string,
  size: { width: number; height: number },
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([text], { type: DIAGRAM_SVG_MIME }));
  try {
    const img = new Image(size.width, size.height);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('this diagram could not be decoded'));
      img.src = url;
    });
    const canvas = doc.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('this diagram could not be drawn');
    ctx.drawImage(img, 0, 0, size.width, size.height);
    const png = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, DIAGRAM_PNG_MIME);
    });
    if (!png) throw new Error('this diagram could not be rasterized');
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Copy the CURRENT figure's diagram to the clipboard as a PNG. */
async function copyDiagramAsImage(figure: HTMLElement): Promise<void> {
  const svg = currentDiagramSvg(figure);
  const size = diagramPixelSize(svg);
  const png = await diagramPng(figure.ownerDocument, diagramSvgText(svg, size), size);
  const clipboard = navigator.clipboard;
  if (!clipboard?.write) throw new Error('the clipboard is unavailable');
  await clipboard.write([new ClipboardItem({ [DIAGRAM_PNG_MIME]: png })]);
}

/**
 * Download the CURRENT figure's diagram as a standalone `.svg`.
 *
 * The anchor is put in the document before it is clicked and removed straight after: a detached
 * anchor's `download` is honoured inconsistently across engines, and the element is gone again
 * within the same synchronous block. Revocation is deferred a task so the engine has taken the blob
 * before the URL dies.
 */
function downloadDiagramAsSvg(figure: HTMLElement, ordinal: number): void {
  const svg = currentDiagramSvg(figure);
  const size = diagramPixelSize(svg);
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n${diagramSvgText(svg, size)}`;
  const doc = figure.ownerDocument;
  const url = URL.createObjectURL(new Blob([text], { type: DIAGRAM_SVG_MIME }));
  const anchor = doc.createElement('a');
  anchor.href = url;
  anchor.download = `diagram-${ordinal}.svg`;
  anchor.hidden = true;
  doc.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    doc.defaultView?.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** One action's four strings: what the button says and is named, before and after it resolves. */
interface DiagramActionCopy {
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

/**
 * Row 17's names carry BOTH the selection and the action, in `themeControl`'s shape
 * ("Theme: Auto. Activate for Light."). Row 15's state is carried by the visible text AND the
 * accessible name AND `data-state` — a reader who cannot tell the highlighter from the paper still
 * reads which of the two actions succeeded, and which diagram it was.
 */
const DIAGRAM_ACTION_COPY: readonly DiagramActionCopy[] = [
  {
    action: DIAGRAM_COPY_ACTION,
    idleText: 'Copy image',
    doneText: 'Copied',
    failedText: 'Copy failed',
    idleName: (n) => `Diagram ${n}. Activate to copy it as an image.`,
    doneName: (n) => `Diagram ${n} copied as an image. Activate to copy it again.`,
    failedName: (n) => `Diagram ${n} could not be copied as an image. Activate to try again.`,
    doneStatus: (n) => `Diagram ${n} copied as an image.`,
    failedStatus: (n) => `Diagram ${n} could not be copied as an image.`,
  },
  {
    action: DIAGRAM_DOWNLOAD_ACTION,
    idleText: 'Download SVG',
    doneText: 'Downloaded',
    failedText: 'Download failed',
    idleName: (n) => `Diagram ${n}. Activate to download it as SVG.`,
    doneName: (n) => `Diagram ${n} downloaded as SVG. Activate to download it again.`,
    failedName: (n) => `Diagram ${n} could not be downloaded as SVG. Activate to try again.`,
    doneStatus: (n) => `Diagram ${n} downloaded as SVG.`,
    failedStatus: (n) => `Diagram ${n} could not be downloaded as SVG.`,
  },
];

/**
 * Build the control group and its live region for a figure that has just become `rendered`.
 *
 * Real `<button>`s with no `tabindex` of their own (row 16): a button is keyboard-operable and in
 * the tab order natively, and the CSS reveals the group on `:focus-within` as well as on `:hover`,
 * so the keyboard path is the same path. Nothing here registers a key handler — §3.11 and §4 both
 * forbid a new global single-key shortcut, and the way to not have one is to not write one.
 *
 * The live region is `role="status"` and `hidden` while empty, `diffChrome.ts:193-199`'s shape: a
 * polite region that is out of the accessibility tree until it has something to say (row 20).
 *
 * It is a `<div>` and NOT a `<p>`, which `diffChrome` can afford to be because it sits outside the
 * reading column and this does not. A `<p>` here is a paragraph OF THE DOCUMENT as far as every
 * `.peekover-reader p` rule and selector is concerned — it would inherit the reader's prose
 * typography, and it broke `diagramRender.browser.test.ts`'s row-5 control, which walks the
 * column's paragraphs and requires each to have a real box (this one is `hidden`, so it has none).
 * The status line is chrome that lives inside the column, not text the document contains.
 */
function buildDiagramControls(figure: HTMLElement): DiagramControls {
  const doc = figure.ownerDocument;
  const ordinal = diagramOrdinal(figure);

  // §5: every rendered diagram carries an accessible name (row 17's other half).
  figure.setAttribute('aria-label', `Diagram ${ordinal}`);

  const status = doc.createElement('div');
  status.className = DIAGRAM_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;

  // §3.11's lightbox trigger. A real <button> (row 16) laid transparently OVER the picture, so
  // "the lightbox opens by activating the diagram — pointer or keyboard" is satisfied by one
  // element: clicking the diagram is clicking it, and tabbing to it is the keyboard half. It is a
  // sibling of the `<svg>` rather than a wrapper because `diagramEnhancer.test.ts:232` pins the
  // content as the figure's FIRST element child, and a wrapper would take that place.
  const open = doc.createElement('button');
  open.type = 'button';
  open.className = DIAGRAM_OPEN_CLASS;
  open.setAttribute('aria-label', `Diagram ${ordinal}. Activate to open it larger.`);
  open.addEventListener('click', () => {
    openDiagramLightbox(open);
  });

  const group = doc.createElement('div');
  group.className = DIAGRAM_ACTIONS_CLASS;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', `Diagram ${ordinal} actions`);

  for (const copy of DIAGRAM_ACTION_COPY) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = DIAGRAM_ACTION_CLASS;
    button.dataset.action = copy.action;
    button.textContent = copy.idleText;
    button.setAttribute('aria-label', copy.idleName(ordinal));
    button.addEventListener('click', () => {
      void runDiagramAction(button, copy);
    });
    group.appendChild(button);
  }

  return { open, group, status };
}

// ── §3.11: THE LIGHTBOX (task 7.2) ────────────────────────────────────────────────────────────
//
// ── WHY THE TRAP IS HAND-ROLLED AND NOT `<dialog>.showModal()` ────────────────────────────────
//
// `showModal()` would hand us the trap, the top layer and Escape for free. It is NOT used, and the
// reason is that the free version is the wrong shape here:
//
//   • The reader lives in a SHADOW ROOT, and the top layer is per-DOCUMENT. A `<dialog>` promoted
//     out of the shadow tree escapes `READER_CSS`'s scope, so the panel would have to be styled
//     from a second sheet in the page — the one place this codebase has no stylesheet.
//   • `::backdrop` and the top layer put the panel over the ENTIRE viewport including the TOC rail
//     and the chrome pills, which is precisely what rows 8 + 9 forbid.
//   • Escape on a `<dialog>` is a document-level cancel we cannot scope. §3.11 forbids a new global
//     bare key; the listener below is on the lightbox ROOT and only ever sees a key because focus
//     is trapped inside it, so the binding is modal-scoped by construction rather than by promise.
//
// The cost of hand-rolling is that trap, restore, Escape and initial focus are all OURS, so each
// one has a real defect available to it and `diagramLightbox.browser.test.ts` reverts each in turn.
// Row 21 records that NO existing element in this codebase traps focus — there was nothing to
// transcribe, and nothing would have been noticed missing. This is that baseline.
//
// ── WHAT IT SHOWS IS THE NODE ON SCREEN, CLONED ──────────────────────────────────────────────
//
// A clone of the figure's LIVE `<svg>` — the artifact `diagramEnhancer` put through the §3.5
// profile. Not a re-render and not the engine's raw pre-sanitize string, for the same reason 7.1's
// two actions are not: a path back to the raw string re-admits the `<style>` and `<foreignObject>`
// the profile stripped. A clone rather than a move, so closing cannot leave the reader's own figure
// empty if anything between here and there throws.

/** The lightbox currently open in a given root, or `null`. Read from the DOM, never held in a
 *  module variable: §3.3 destroys and rebuilds the whole tree and cross-mount state is forbidden. */
function openLightboxIn(root: ShadowRoot | Document): HTMLElement | null {
  return root.querySelector<HTMLElement>(`.${DIAGRAM_LIGHTBOX_CLASS}`);
}

/** The tabbable stops inside the open lightbox, in DOM order. Both are elements this module put
 *  there, so this is an enumeration of our own panel rather than a general tabbable scanner. */
function lightboxStops(box: HTMLElement): HTMLElement[] {
  return [
    ...box.querySelectorAll<HTMLElement>(
      `.${DIAGRAM_LIGHTBOX_CLOSE_CLASS}, .${DIAGRAM_LIGHTBOX_VIEW_CLASS}`,
    ),
  ];
}

/**
 * Close the lightbox and give focus back to the button that opened it.
 *
 * ★ THE RESTORE IS THE ANCHOR CLAIM. `trigger` is the exact element activated to open this — not
 * "a button in the group", not the figure, not the reader. A modal that drops focus on `body`
 * strands a keyboard user at the top of the document with no way back to where they were, and it
 * is the one focus property that would still be load-bearing had this been a `<dialog>`: the
 * platform does not restore focus to the opener for us.
 *
 * `isConnected` is checked because §3.3 can re-render the document out from under an open lightbox,
 * at which point the trigger is a detached node and focusing it would silently move focus to the
 * body — the very defect this function exists to prevent, arrived at by a different road.
 */
function closeDiagramLightbox(box: HTMLElement, trigger: HTMLElement): void {
  box.remove();
  if (trigger.isConnected) trigger.focus();
}

/**
 * Open the enlarged view of the diagram `trigger` belongs to.
 *
 * Everything is resolved from the trigger AT ACTIVATION TIME — the figure by `closest`, the `<svg>`
 * from the figure, the ordinal from the tree. That is row 14 again: the trigger survives a theme
 * flip that replaces the `<svg>` under it, and what it must enlarge is whatever is on screen now.
 *
 * The root is the figure's own root node, so the lightbox lands as a SIBLING of `.peekover-reader`
 * (row 4's other half) — chrome beside the reading column, never a node inside the document the
 * user is reading.
 */
function openDiagramLightbox(trigger: HTMLElement): void {
  const figure = trigger.closest<HTMLElement>(`figure.${DIAGRAM_FIGURE_CLASS}`);
  if (!figure) return;
  const root = figure.getRootNode() as ShadowRoot | Document;
  if (openLightboxIn(root)) return; // already open — activating twice must not stack two modals
  const svg = currentDiagramSvg(figure);
  const ordinal = diagramOrdinal(figure);
  const doc = figure.ownerDocument;

  const box = doc.createElement('div');
  box.className = DIAGRAM_LIGHTBOX_CLASS;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', `Diagram ${ordinal}, enlarged`);

  const panel = doc.createElement('div');
  panel.className = DIAGRAM_LIGHTBOX_PANEL_CLASS;

  const close = doc.createElement('button');
  close.type = 'button';
  close.className = DIAGRAM_LIGHTBOX_CLOSE_CLASS;
  close.textContent = 'Close';
  close.setAttribute('aria-label', `Close diagram ${ordinal}.`);

  // The scroll region is `tabindex="0"` ON PURPOSE and it is not row 16's exception: row 16 is
  // about BUTTONS not inventing their own tab order. A scrollable box that only a mouse can pan is
  // a WCAG 2.1.1 failure, and this is §3.11's "pan" half — the keyboard reaches it here.
  const view = doc.createElement('div');
  view.className = DIAGRAM_LIGHTBOX_VIEW_CLASS;
  view.tabIndex = 0;
  view.setAttribute('role', 'img');
  view.setAttribute('aria-label', `Diagram ${ordinal}, enlarged`);

  const enlarged = svg.cloneNode(true) as SVGSVGElement;
  enlarged.style.removeProperty('max-width');
  view.appendChild(enlarged);

  panel.replaceChildren(close, view);
  box.appendChild(panel);

  // ★ THE TRAP. Tab off either end wraps to the other, and the wrap is an explicit `focus()` after
  // `preventDefault()` — the engine's own default would carry focus to whatever follows the
  // lightbox in the shadow tree, which is the document behind it.
  box.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDiagramLightbox(box, trigger);
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = lightboxStops(box);
    if (stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = root.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Clicking the dim area around the panel closes; clicking the panel does not. The target test
  // keeps a click that started on the diagram and drifted onto the backdrop from closing it.
  box.addEventListener('click', (event: MouseEvent) => {
    if (event.target === box) closeDiagramLightbox(box, trigger);
  });
  close.addEventListener('click', () => {
    closeDiagramLightbox(box, trigger);
  });

  root.appendChild(box);
  close.focus(); // initial focus is INSIDE, on the exit — never left on the page behind
}

/**
 * Run one action and report the outcome in text, in `aria-*` and in the live region.
 *
 * ★ EVERYTHING IS RESOLVED FROM THE BUTTON, HERE, NOW. The figure comes from `closest`, the `<svg>`
 * from the figure and the ordinal from the tree — none of it from the closure that built the
 * button. That is row 14: the group outlives a theme swap and is rebuilt by the next mount, and in
 * both cases the thing it must act on is whatever is on screen at the moment of the click.
 *
 * A failure leaves the diagram alone (§4): the `<svg>` is never touched on this path, only the
 * button's own labels and the region below it.
 */
async function runDiagramAction(button: HTMLButtonElement, copy: DiagramActionCopy): Promise<void> {
  const figure = button.closest<HTMLElement>(`figure.${DIAGRAM_FIGURE_CLASS}`);
  if (!figure) return;
  const controls = diagramControlsOf(figure);
  const ordinal = diagramOrdinal(figure);

  const settle = (text: string, name: string, state: string, message: string): void => {
    button.textContent = text;
    button.setAttribute('aria-label', name);
    button.setAttribute(DIAGRAM_ACTION_STATE_ATTR, state);
    if (!controls) return;
    controls.status.textContent = message;
    controls.status.hidden = false;
  };

  try {
    if (copy.action === DIAGRAM_COPY_ACTION) await copyDiagramAsImage(figure);
    else downloadDiagramAsSvg(figure, ordinal);
    settle(copy.doneText, copy.doneName(ordinal), 'done', copy.doneStatus(ordinal));
  } catch {
    settle(copy.failedText, copy.failedName(ordinal), 'failed', copy.failedStatus(ordinal));
  }
}
