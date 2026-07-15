// appShell — the M2 active-surface app page skeleton (DOM-UI only).
//
// Spec 002 introduces Peekover's SECOND surface: an extension-owned app page
// (chrome-extension://…/app.html) opened deliberately from the toolbar action. This
// module renders that page's shell — a header, a folder pane, and a reader pane —
// with an inert empty state. It is the application shell every future active
// capability (folder mode, editor, watch/diff) will mount into.
//
// SCOPE (task 1.1): this stands the surface up and nothing more. There is NO folder
// logic, NO IndexedDB, NO reader integration, NO tree here — the "Open a folder"
// affordance is INERT this task; wiring it is task 3. Kept pure DOM-UI per the
// approved module list (plan.md §Files/modules): appShell never imports src/render/*
// or any store, so it stays unit-testable in jsdom and can't drift into a god-module.
//
// Styling is design-token-only (values copied verbatim from design/tokens.css, as
// src/theme/readerCss.ts does). No new fonts or assets: the app chrome uses the
// system font stack (the bundled Literata is the reader's, added when the reader
// pane is wired). Themes follow the OS via prefers-color-scheme — the app page owns
// its whole document, so there is no host to isolate from and no shadow root.

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

/**
 * Render the app-page shell into `container`. Idempotent: a second call replaces the
 * previous shell rather than appending a duplicate. Builds:
 *   - a header (brand + zero-network tagline),
 *   - a folder pane carrying the INERT "Open a folder to begin" empty state,
 *   - a reader pane placeholder.
 * No behavior is wired this task — the CTA is a plain, disabled-in-spirit affordance
 * (task 3 gives it the at-use grant flow).
 */
export function mountAppShell(container: HTMLElement): void {
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

  const reader = doc.createElement('main');
  reader.className = `${SHELL_CLASS}__reader`;
  reader.setAttribute('role', 'main');
  const readerPlaceholder = doc.createElement('p');
  readerPlaceholder.className = `${SHELL_CLASS}__hint`;
  readerPlaceholder.textContent = 'Select a file to read it here.';
  reader.append(readerPlaceholder);

  body.append(folders, reader);
  shell.append(buildStyle(doc), header, body);

  container.replaceChildren(shell);
}
