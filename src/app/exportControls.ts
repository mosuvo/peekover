// exportControls — the export panel (task 3.2, D-2, Ruling 2). Mirrors `storageControls.ts`'s
// `createStorageView` shape EXACTLY: a pure `(doc, opts) -> {element}` builder, stateless, rebuilt
// fresh on every open — `appShell.ts` owns the open/close state, the insertion, and the focus
// RESTORE half of Ruling 2's trap. What lives HERE is the trap's other half: the panel's own
// keydown listener (Tab wrap + Escape), copied inline from `diagramView.ts`'s
// `openDiagramLightbox` shape — the only other trap in this codebase, and the shape tasks.md's
// own §3.2 body names as the one to reproduce. No shared trap helper exists anywhere in the tree,
// and extracting one is OUT OF SCOPE here (rule-of-three: `diagramLightbox` plus this panel is two
// call sites, not three; a future extract is a question for whenever a third trap appears).
//
// Of the mockup's 7 rows (`design/mockup.html:861-874`), 5 survive M10 — Word/DOCX (struck at
// task 5.1, §3.10 gate) and the ZIP bundle (struck at task 3.5, §3.1(cont.) gate) are gone, and
// the 2 publish rows (Gist, Medium/Dev.to) were never in scope (D-10). Task 3.2 built all 5
// surviving rows as real buttons and wired exactly ONE live: HTML export (`exportHtml`, task 3.1).
// Task 3.3 flips a second: Copy-as-HTML (`copyAsHtml`, task 3.3). Task 3.4 flips a third:
// Copy-as-plain-text (`copyAsPlainText`, task 3.4). Task 4.1 flips a fourth: Copy-as-rich-text
// (`copyAsRichText`, task 4.1) — this is the INTENTIONAL day-one shape (task 3.2's own decision,
// `decisions.md`): the panel shows its whole feature set from day one, discoverable, never a
// surprise row appearing later; `disabled` is the honest "exists, not ready yet" signal, matching
// `__cta`/`__pin`'s own disabled-not-hidden precedent. Task 7.1 flips the fifth and last: PDF
// (`exportPdf`, task 7.1) — every row is now live, closing the day-one-shape shown-but-disabled
// state this module opened with.
//
// ── M11 task 6.2-R adds a SIXTH row, not in the original M10 mockup: "Copy formulas as MathML"
// (§8-1(b)'s document-level action, D-6-R). Gate 3's own ruling (`decisions.md`, 2026-09-06 M11
// GATE 3 FINDING 2) named this panel — "the M10 export-panel precedent" — as the home for that
// action, NEVER a toolbar button or a keyboard shortcut. It is wired live from the day it lands
// (there is no "not ready yet" period to show `disabled` for, unlike the four rows above), and it
// rejects with no clipboard write when the open document has no rendered formula — never a false
// "Copied" (AGENTS.md #5) — surfaced through the SAME `reportCopyOutcome` shape the three other
// copy rows already use, no new outcome vocabulary.
//
// ── §8-1(b) FIX adds a SEVENTH row: "Copy formulas as LaTeX" ─────────────────────────────────
//
// The 8.1-R milestone-close walk RULED fix-before-close (`decisions.md`, 2026-09-10): a
// successfully-rendered inline formula had no way to recover its LaTeX source at all (6.2-R's own
// measured gap). `mathView.ts` gained a `MATH_INLINE_SOURCE_ATTR` retention mechanism (see that
// file's own §8-1(b) FIX header for the two-mechanism diagnosis) and the aggregate read side,
// `copyAllMathAsLatex` — this row is that action's SAME panel/menu-row home, the identical
// gate-3-ruled placement `copy-math-mathml` already uses, wired live from day one the same way.

export interface ExportViewOptions {
  /** Trigger the real HTML file-download export (task 3.1's `exportHtml`) — wired here since no
   *  other task in tasks.md claims this row. */
  onExportHtml(): void;
  /** Trigger the clipboard copy-as-HTML export (task 3.3's `copyAsHtml`) — SAME artifact as
   *  `onExportHtml`, a different sink. */
  onCopyHtml(): void;
  /** Trigger the clipboard copy-as-plain-text export (task 3.4's `copyAsPlainText`) — the raw
   *  authored source, not the clone `onCopyHtml` works from. Sync signature matching `onCopyHtml`'s
   *  own shape deliberately: the async read+write happens INSIDE `copyAsPlainText` itself, and the
   *  caller (`appShell.ts`) attaches `.then(onCopied, onFailed)` to report the outcome through
   *  `ExportViewController.reportCopyOutcome` (task 9.1) — never a silent no-op (AGENTS.md #5). */
  onCopyPlainText(): void;
  /** Trigger the clipboard copy-as-rich-text export (task 4.1's `copyAsRichText`) — the clone's
   *  semantic markup alone, no bundled `<style>` block, so a paste target's own styling applies.
   *  Sync signature matching `onCopyHtml`/`onCopyPlainText`'s own shape — the async write happens
   *  INSIDE `copyAsRichText`, and the caller reports its outcome the same `.then(...)` way. */
  onCopyRichText(): void;
  /** Trigger PDF export (task 7.1's `exportPdf`) — the browser's own print pipeline
   *  (`window.print()`), §3.6-sealed: no second rendering path. Unlike every other row above, this
   *  one is NOT host/clone-scoped — `window.print()` prints the whole document, so there is nothing
   *  for a handler to receive; the caller still gates the call on an active render existing (the
   *  same "nothing to export yet" guard `onExportHtml` etc. use), it just does so without passing
   *  anything through. */
  onExportPdf(): void;
  /** Trigger the document-level copy-all-formulas-as-MathML action (M11 task 6.2-R, D-6-R,
   *  §8-1(b)) — the sole home §8-1(b)'s ruling gives inline math's copy-as-MathML, since inline
   *  has no per-formula control group of its own (D-7-R). Sync signature matching the three other
   *  copy rows' own shape — the async collect+write happens INSIDE `copyAllMathAsMathml`, and the
   *  caller reports its outcome through the same `.then(onCopied, onFailed)` -> `reportCopyOutcome`
   *  path. Rejects (never resolves falsely) when the document has no rendered formula yet. */
  onCopyMathMathml(): void;
  /** Trigger the document-level copy-all-formulas-as-LaTeX action (§8-1(b) FIX) — the sole home
   *  for recovering an inline formula's LaTeX source, since inline has no per-formula control
   *  group of its own (D-7-R) and row 11 forbids adding one. Sync signature matching the other
   *  copy rows' own shape — the async collect+write happens INSIDE `copyAllMathAsLatex`, and the
   *  caller reports its outcome through the same `.then(onCopied, onFailed)` -> `reportCopyOutcome`
   *  path. Rejects (never resolves falsely) when the document has no rendered formula yet. */
  onCopyMathLatex(): void;
  /** Dismiss the panel. Called by the close button AND by the trap's own Escape handler — one
   *  close path, not two (appShell owns what "closed" means: emptying the slot + the focus
   *  restore, per Ruling 2). */
  onClose(): void;
}

/** The rows whose action can produce a "Copied"/"Copy failed" completion state (task 9.1,
 *  human-ruled — `decisions.md`'s M10 9.1 entry — extended to `'copy-math-mathml'` at M11 task
 *  6.2-R and to `'copy-math-latex'` at the §8-1(b) FIX, the identical shape both times). HTML
 *  export and PDF are deliberately excluded: each already has its own native browser signal for
 *  SUCCESS (the download shelf; the print dialog), so a Peekover "Exported!" would be redundant
 *  with it — the same "still justified / not redundant" discipline that dropped ZIP export earlier
 *  this milestone. */
export type CopyRowKey =
  | 'copy-html'
  | 'copy-plain-text'
  | 'copy-rich-text'
  | 'copy-math-mathml'
  | 'copy-math-latex';

export interface ExportViewController {
  /** The panel root — the caller slots this into the shell. */
  readonly element: HTMLElement;
  /** Task 9.1: report a copy row's outcome once its clipboard promise settles — swaps THAT row's
   *  own title text to "Copied"/"Copy failed", rewrites its `aria-label`, sets `data-state`, and
   *  announces via the panel's own live region. `codeView.ts`'s copy-button shape (row 15/20),
   *  REPRODUCED here, not imported — `buildCodeToolbar`'s `announce` closure is module-private to
   *  the content-script render graph, unreachable from this app-page panel — the module doc
   *  comment's own rule-of-three precedent (`diagramLightbox`'s trap plus this panel's), applied
   *  again here. Never called for `'html'`/`'pdf'` — see `CopyRowKey`'s own doc comment. */
  reportCopyOutcome(key: CopyRowKey, copied: boolean): void;
  /** Task 9.1: report that HTML export itself threw before any download began (a serialization
   *  throw — `htmlExport.ts`'s `serializeReaderDocument` — §3.9's own named failure mode) by
   *  swapping the HTML row's title to "Export failed" + the same aria/data-state/announce shape
   *  `reportCopyOutcome` uses. The HTML row's SUCCESS half is deliberately never reported (ruling:
   *  the browser's own download UI already signals it) — this is the one-sided failure-only
   *  counterpart, not a second completion affordance. */
  reportExportFailure(key: 'html'): void;
}

const EC_CLASS = 'peekover-export';

/** `data-state` on a row's own button once task 9.1's outcome reporters have resolved it —
 *  `codeView.ts`'s `CODE_COPY_STATE_ATTR` name AND values (`'done'`/`'failed'`) reproduced
 *  verbatim, not just the attribute name, so the two toolbars stay one vocabulary even though
 *  they are two separate implementations (module doc comment: reproduced, not imported). */
export const EXPORT_ROW_STATE_ATTR = 'data-state';

/** Class on the panel's own polite live region (task 9.1) — `codeView.ts`'s `CODE_STATUS_CLASS`
 *  role, a SEPARATE element in this module's own tree (see the doc comment above the region's own
 *  construction, below). Exported so a test can select it directly, matching that sibling's own
 *  precedent. */
export const EXPORT_STATUS_CLASS = `${EC_CLASS}__status`;

const EC_CSS = /* css */ `
.${EC_CLASS}{display:flex; flex-direction:column; gap:2px; min-width:0; padding:0 8px 8px; color:var(--ink)}
.${EC_CLASS}__head{display:flex; align-items:center; gap:10px; margin:0 -8px 6px; padding:14px 18px; border-bottom:1px solid var(--line)}
.${EC_CLASS}__title{flex:1 1 auto; margin:0; font:700 13.5px/1.3 var(--sans)}
.${EC_CLASS}__row{
  display:flex; align-items:center; gap:12px; width:100%; text-align:left; margin:0;
  font:400 13.5px/1.35 var(--sans); color:var(--muted); background:none;
  border:0; border-radius:8px; padding:9px 12px; cursor:pointer;
}
.${EC_CLASS}__row:hover{background:var(--accent-soft); color:var(--ink)}
.${EC_CLASS}__row:disabled{opacity:.5; cursor:default; background:none; color:var(--muted)}
.${EC_CLASS}__row-glyph{flex:0 0 auto; width:1.2em; text-align:center}
.${EC_CLASS}__row-text{display:flex; flex-direction:column; gap:1px; min-width:0}
.${EC_CLASS}__row-title{font-weight:600}
.${EC_CLASS}__row-sub{color:var(--muted); font-size:11.5px}
`;

function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = EC_CSS;
  return style;
}

/** One row's content + (if live) its click handler. `onClick` absent -> the row renders
 *  `disabled`, pending the task named in the module doc comment above. */
interface RowSpec {
  key: string;
  glyph: string;
  title: string;
  subtext: string;
  /** The accessible name, carrying BOTH the selection and the action (row 7) — never a bare
   *  glyph, matching `themeControl`'s and `diagramView.ts`'s own row-17/16 shape. */
  actionLabel: string;
  onClick?: () => void;
}

function buildRow(doc: Document, spec: RowSpec): HTMLButtonElement {
  const row = doc.createElement('button');
  row.type = 'button';
  row.className = `${EC_CLASS}__row`;
  row.dataset.export = spec.key;
  row.disabled = !spec.onClick;
  row.setAttribute('aria-label', spec.actionLabel);

  const glyph = doc.createElement('span');
  glyph.className = `${EC_CLASS}__row-glyph`;
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = spec.glyph;

  const text = doc.createElement('span');
  text.className = `${EC_CLASS}__row-text`;
  const title = doc.createElement('span');
  title.className = `${EC_CLASS}__row-title`;
  title.textContent = spec.title;
  const sub = doc.createElement('span');
  sub.className = `${EC_CLASS}__row-sub`;
  sub.textContent = spec.subtext;
  text.append(title, sub);

  row.append(glyph, text);
  if (spec.onClick) row.addEventListener('click', spec.onClick);
  return row;
}

/**
 * PDF export (task 7.1, §3.6-sealed): the SAME pipeline the browser's own print command drives —
 * no second rendering path, no PDF-generation dependency. `window.print()` is document-global (it
 * has no target argument), so unlike `exportHtml`/`copyAsHtml`/`copyAsRichText` this takes no
 * host/clone — there is nothing for it to receive. Chrome hiding, the fixed-viewport de-clip, and
 * page-break rules live in readerCss.ts + appShell.ts's own `@media print` blocks (task 6.1); the
 * `@page` margin-box rule that gives the printed output page numbers lives in BOTH files too — see
 * appShell.ts's own comment on why relocation, not just chrome-hiding, was needed for that part.
 */
export function exportPdf(): void {
  window.print();
}

/** The tabbable stops inside the open panel, in DOM order (`lightboxStops`'s own shape,
 *  `diagramView.ts`) — every real, ENABLED button this module put there. Disabled rows are
 *  excluded deliberately: the browser's own Tab order already skips them, and the wrap logic
 *  below must agree with that or it would name the wrong first/last stop. */
function exportPanelStops(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>('button:not(:disabled)')];
}

/**
 * Create the export panel. Stateless — `appShell.ts` rebuilds it fresh on every open and owns
 * insertion, initial focus, and the close-time focus restore (mirroring `createStorageView`'s own
 * split with `appShell.ts`'s `toggleStorage`/`renderStorage`). This function's own job is the DOM
 * plus Ruling 2's trap (Tab wrap + Escape), copied inline from `openDiagramLightbox`'s shape.
 */
export function createExportView(doc: Document, opts: ExportViewOptions): ExportViewController {
  const element = doc.createElement('div');
  element.className = EC_CLASS;
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  element.setAttribute('aria-label', 'Export document');
  element.append(buildStyle(doc));

  const head = doc.createElement('div');
  head.className = `${EC_CLASS}__head`;
  const title = doc.createElement('h2');
  title.className = `${EC_CLASS}__title`;
  title.textContent = 'Export';
  const close = doc.createElement('button');
  close.type = 'button';
  close.className = `${EC_CLASS}__close`;
  close.textContent = 'Close';
  close.addEventListener('click', opts.onClose);
  head.append(title, close);
  element.append(head);

  const rows: RowSpec[] = [
    {
      key: 'html',
      glyph: '◧', // ◧
      title: 'HTML',
      subtext: 'A single file — your current theme, rendered diagrams included',
      actionLabel: 'Export as HTML',
      onClick: opts.onExportHtml,
    },
    {
      key: 'copy-html',
      glyph: '⧉', // ⧉
      title: 'Copy as HTML',
      subtext: 'The same standalone HTML, to the clipboard',
      actionLabel: 'Copy as HTML',
      onClick: opts.onCopyHtml,
    },
    {
      key: 'copy-plain-text',
      glyph: '¶', // ¶
      title: 'Copy as plain text',
      subtext: 'The raw markdown source, exactly as authored',
      actionLabel: 'Copy as plain text',
      onClick: opts.onCopyPlainText,
    },
    {
      key: 'copy-rich-text',
      glyph: '✂', // ✂
      title: 'Copy as rich text',
      subtext: 'Paste straight into Google Docs or Word',
      actionLabel: 'Copy as rich text',
      onClick: opts.onCopyRichText,
    },
    {
      key: 'pdf',
      glyph: '⎙', // ⎙
      title: 'PDF',
      subtext: "The browser's own print pipeline",
      actionLabel: 'Export as PDF',
      onClick: opts.onExportPdf,
    },
    {
      key: 'copy-math-mathml',
      glyph: '∑', // ∑
      title: 'Copy formulas as MathML',
      subtext: 'Every rendered formula in this document, as MathML',
      actionLabel: 'Copy formulas as MathML',
      onClick: opts.onCopyMathMathml,
    },
    {
      key: 'copy-math-latex',
      glyph: '∫', // ∫
      title: 'Copy formulas as LaTeX',
      subtext: 'Every rendered formula in this document, as LaTeX source',
      actionLabel: 'Copy formulas as LaTeX',
      onClick: opts.onCopyMathLatex,
    },
  ];
  for (const spec of rows) element.append(buildRow(doc, spec));

  // ── TASK 9.1's LIVE REGION — `codeView.ts`'s `CODE_STATUS_CLASS` shape, reproduced verbatim
  // (role="status", hidden while empty so it sits outside the a11y tree until it has something to
  // say; no dedicated CSS rule either, matching that module's own unstyled block precedent — grepped
  // `readerCss.ts` to confirm before reproducing the choice, not just the markup). Placed after the
  // rows, mirroring `buildCodeToolbar`'s own toolbar-then-status append order.
  const status = doc.createElement('div');
  status.className = EXPORT_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;
  const announce = (text: string): void => {
    status.textContent = text;
    status.hidden = text === '';
  };
  element.append(status);

  /** Row lookup shared by both outcome reporters below — `buildRow`'s own `data-export` attribute
   *  is the seam (already set on every row for a different reason: the focus-trap's stop list). */
  function rowButton(key: string): HTMLButtonElement | null {
    return element.querySelector<HTMLButtonElement>(`button[data-export="${key}"]`);
  }
  function rowTitleSpan(button: HTMLButtonElement): HTMLElement | null {
    return button.querySelector<HTMLElement>(`.${EC_CLASS}__row-title`);
  }
  function rowActionLabel(key: string): string {
    return rows.find((r) => r.key === key)?.actionLabel ?? '';
  }

  function reportCopyOutcome(key: CopyRowKey, copied: boolean): void {
    const button = rowButton(key);
    const titleSpan = button && rowTitleSpan(button);
    if (!button || !titleSpan) return;
    const label = rowActionLabel(key);
    if (copied) {
      titleSpan.textContent = 'Copied';
      button.setAttribute('aria-label', `${label} — copied. Activate to copy again.`);
      button.setAttribute(EXPORT_ROW_STATE_ATTR, 'done');
      announce(`${label} copied.`);
    } else {
      titleSpan.textContent = 'Copy failed';
      button.setAttribute('aria-label', `${label} — copy failed. Activate to try again.`);
      button.setAttribute(EXPORT_ROW_STATE_ATTR, 'failed');
      announce(`${label} could not be copied.`);
    }
  }

  function reportExportFailure(key: 'html'): void {
    const button = rowButton(key);
    const titleSpan = button && rowTitleSpan(button);
    if (!button || !titleSpan) return;
    const label = rowActionLabel(key);
    titleSpan.textContent = 'Export failed';
    button.setAttribute('aria-label', `${label} — failed. Activate to try again.`);
    button.setAttribute(EXPORT_ROW_STATE_ATTR, 'failed');
    announce(`${label} failed.`);
  }

  // ★ THE TRAP — copied inline from `openDiagramLightbox`'s own shape (`diagramView.ts`), not a
  // shared helper (see the module doc comment above). Tab off either end wraps to the other;
  // Escape asks the caller to close (appShell owns the open/close state and the restore).
  element.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      opts.onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = exportPanelStops(element);
    if (stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = doc.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { element, reportCopyOutcome, reportExportFailure };
}
