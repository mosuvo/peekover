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
// Copy-as-plain-text (`copyAsPlainText`, task 3.4). Each remaining row's own task (4.1, 6.1/7.1)
// touches `exportControls.ts` again to flip ITS row from inert to live — this is the INTENTIONAL
// day-one shape (task 3.2's own decision, `decisions.md`): the panel shows its whole feature set
// from day one, discoverable, never a surprise row appearing later; `disabled` is the honest
// "exists, not ready yet" signal, matching `__cta`/`__pin`'s own disabled-not-hidden precedent. The
// remaining 2 (Copy-as-rich-text, PDF) still render as real, accessibly-named buttons that are
// `disabled`, inert until their own task supplies a click handler.

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
   *  caller (`appShell.ts`) discards the returned promise the same way it already does for
   *  `onCopyHtml` — a rejection surfaces as a genuine unhandled-rejection error, never a silent
   *  no-op (AGENTS.md #5). */
  onCopyPlainText(): void;
  /** Dismiss the panel. Called by the close button AND by the trap's own Escape handler — one
   *  close path, not two (appShell owns what "closed" means: emptying the slot + the focus
   *  restore, per Ruling 2). */
  onClose(): void;
}

export interface ExportViewController {
  /** The panel root — the caller slots this into the shell. */
  readonly element: HTMLElement;
}

const EC_CLASS = 'peekover-export';

const EC_CSS = /* css */ `
.${EC_CLASS}{
  display:flex; flex-direction:column; gap:.4rem; min-width:0;
  padding:.7rem .8rem; background:var(--panel,#F4F4EF); color:var(--ink,#16171F);
}
.${EC_CLASS}__head{display:flex; align-items:baseline; gap:.6rem; padding:0 .1rem .3rem}
.${EC_CLASS}__title{font-size:.9rem; font-weight:650; letter-spacing:-.01em; flex:1 1 auto}
.${EC_CLASS}__close{
  font:inherit; font-size:.78rem; color:var(--ink,#16171F); background:transparent;
  border:1px solid var(--line,#E6E6DF); border-radius:999px; padding:.1rem .6rem; cursor:pointer;
}
.${EC_CLASS}__close:hover{background:var(--accent-soft,#ECECE3)}
.${EC_CLASS}__row{
  display:flex; align-items:center; gap:.6rem; width:100%; text-align:left;
  font:inherit; color:var(--ink,#16171F); background:var(--paper,#FBFBF8);
  border:1px solid var(--line,#E6E6DF); border-radius:8px; padding:.5rem .7rem; cursor:pointer;
}
.${EC_CLASS}__row:hover{background:var(--accent-soft,#ECECE3)}
.${EC_CLASS}__row:disabled{opacity:.5; cursor:default}
.${EC_CLASS}__row-glyph{flex:0 0 auto; font-size:1rem; color:var(--muted,#5D6070)}
.${EC_CLASS}__row-text{display:flex; flex-direction:column; gap:.05rem; min-width:0}
.${EC_CLASS}__row-title{font-weight:600}
.${EC_CLASS}__row-sub{color:var(--muted,#5D6070); font-size:.78rem}
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
    },
    {
      key: 'pdf',
      glyph: '⎙', // ⎙
      title: 'PDF',
      subtext: "The browser's own print pipeline",
      actionLabel: 'Export as PDF',
    },
  ];
  for (const spec of rows) element.append(buildRow(doc, spec));

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

  return { element };
}
