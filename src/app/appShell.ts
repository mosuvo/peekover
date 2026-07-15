// appShell — the M2 active-surface app page shell (DOM-UI + selection wiring).
//
// Spec 002 introduces Peekover's SECOND surface: an extension-owned app page
// (chrome-extension://…/app.html) opened deliberately from the toolbar action. This
// module renders that page's shell — a header, a folder pane, and a reader pane — and
// wires a selected file into the reader. It is the application shell every future
// active capability (folder mode, editor, watch/diff) will mount into.
//
// SCOPE (task 1.2): the shell layout + the selection→reader seam. There is still NO
// folder logic, NO IndexedDB, and NO tree here — the "Open a folder" affordance stays
// INERT this task (folder mode is group 3). What 1.2 adds over 1.1 is the reader pane:
// a selected file's text renders through the UNCHANGED M1 `mount()` pipeline, and every
// non-render outcome (no selection, empty file, unreadable file) degrades to a designed
// never-blank state (AGENTS.md #5). The rendering itself lives in readerPane.ts (the
// DOM/engine glue); appShell composes the panes and exposes `selectFile()` as the seam
// group 3 hands real `MarkdownFile`s to. appShell still imports no store and no parser —
// only the reader pane (which reuses `mount()`), so it stays unit-testable in jsdom.
//
// Styling is design-token-only (values copied verbatim from design/tokens.css, as
// src/theme/readerCss.ts does). No new fonts or assets: the app chrome uses the
// system font stack (the bundled Literata is the reader's, inside mount()'s shadow
// root). Themes follow the OS via prefers-color-scheme — the app page owns its whole
// document, so there is no host to isolate from and no shadow root at the shell level.

import { createReaderPane, type ReaderFile, type ReaderPaneController } from './readerPane';

/** CSS class on the shell root; scopes every rule so nothing leaks to the document. */
const SHELL_CLASS = 'peekover-app';

/** The shell stylesheet: design tokens (light + dark) + minimal layout. */
const APP_CSS = /* css */ `
.${SHELL_CLASS}{
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --accent:#16171F; --accent-soft:#ECECE3; --hl-soft:#FFF6BF;
  --r:10px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--paper); color:var(--ink);
  font-family:var(--sans); font-size:15px; line-height:1.55;
  -webkit-text-size-adjust:100%;
}
@media (prefers-color-scheme:dark){
  .${SHELL_CLASS}{
    --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
    --line:#262A38; --accent:#EAEBF3; --accent-soft:#232838; --hl-soft:#3A3413;
  }
}
.${SHELL_CLASS} *,.${SHELL_CLASS} *::before,.${SHELL_CLASS} *::after{box-sizing:border-box}
.${SHELL_CLASS} :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

.${SHELL_CLASS}__header{
  flex:0 0 auto; display:flex; align-items:center; gap:.6rem;
  padding:.7rem 1rem; border-bottom:1px solid var(--line); background:var(--panel);
}
.${SHELL_CLASS}__brand{font-weight:650; letter-spacing:-.01em}
.${SHELL_CLASS}__tag{color:var(--muted); font-size:.8rem}

.${SHELL_CLASS}__body{flex:1 1 auto; display:flex; min-height:0}
.${SHELL_CLASS}__folders{
  flex:0 0 clamp(220px,28%,320px); min-width:0; overflow:auto;
  border-right:1px solid var(--line); background:var(--panel); padding:1rem;
}
.${SHELL_CLASS}__reader{flex:1 1 auto; min-width:0; overflow:auto; padding:1.5rem}

.${SHELL_CLASS}__empty{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:.5rem; height:100%; text-align:center; color:var(--muted);
}
.${SHELL_CLASS}__cta{
  font:inherit; color:var(--ink); background:var(--paper);
  border:1px solid var(--line); border-radius:var(--r);
  padding:.55rem 1rem; cursor:pointer;
}
.${SHELL_CLASS}__cta:hover{background:var(--accent-soft)}
.${SHELL_CLASS}__hint{color:var(--faint); font-size:.8rem}
`;

/** Build the shell style element. */
function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = APP_CSS;
  return style;
}

/** The seam appShell exposes to its caller (main.ts today, group 3's tree later). */
export interface AppController {
  /**
   * Select a file to render in the reader pane, or `null` to clear it back to the
   * no-selection state. Delegates to the reader pane, which reads the file and renders
   * it through the unchanged `mount()` pipeline (or a designed never-blank state).
   * Resolves once the pane has settled; never rejects.
   */
  selectFile(file: ReaderFile | null): Promise<void>;
}

/**
 * Render the app-page shell into `container` and return its controller. Idempotent: a
 * second call replaces the previous shell rather than appending a duplicate. Builds:
 *   - a header (brand + zero-network tagline),
 *   - a folder pane carrying the INERT "Open a folder to begin" empty state,
 *   - a reader pane (readerPane.ts) showing the designed no-selection state initially.
 * The folder CTA stays inert this task (group 3 gives it the at-use grant flow); the
 * only wired behavior is `selectFile()` → the reader pane, the seam group 3 drives.
 */
export function mountAppShell(container: HTMLElement): AppController {
  const doc = container.ownerDocument;

  const shell = doc.createElement('div');
  shell.className = SHELL_CLASS;

  // Header ------------------------------------------------------------------
  const header = doc.createElement('header');
  header.className = `${SHELL_CLASS}__header`;
  header.setAttribute('role', 'banner');
  const brand = doc.createElement('span');
  brand.className = `${SHELL_CLASS}__brand`;
  brand.textContent = 'Peekover';
  const tag = doc.createElement('span');
  tag.className = `${SHELL_CLASS}__tag`;
  tag.textContent = 'Zero network by default';
  header.append(brand, tag);

  // Body: folder pane + reader pane ----------------------------------------
  const body = doc.createElement('div');
  body.className = `${SHELL_CLASS}__body`;

  const folders = doc.createElement('nav');
  folders.className = `${SHELL_CLASS}__folders`;
  folders.setAttribute('aria-label', 'Folders');

  const empty = doc.createElement('div');
  empty.className = `${SHELL_CLASS}__empty`;
  const emptyMsg = doc.createElement('p');
  emptyMsg.textContent = 'Open a folder to begin';
  const cta = doc.createElement('button');
  cta.type = 'button';
  cta.className = `${SHELL_CLASS}__cta`;
  cta.textContent = 'Open a folder';
  // Inert this task — the at-use grant flow is wired in task 3.
  cta.setAttribute('data-peekover-inert', 'true');
  const hint = doc.createElement('p');
  hint.className = `${SHELL_CLASS}__hint`;
  hint.textContent = 'Folder mode arrives next — this surface is the foundation.';
  empty.append(emptyMsg, cta, hint);
  folders.append(empty);

  // The reader pane owns its own <main> element, designed states, and the mount host.
  // appShell just slots it into the body and drives it via selectFile().
  const readerPane: ReaderPaneController = createReaderPane(doc);

  body.append(folders, readerPane.element);
  shell.append(buildStyle(doc), header, body);

  container.replaceChildren(shell);

  return {
    selectFile: (file) => readerPane.select(file),
  };
}
