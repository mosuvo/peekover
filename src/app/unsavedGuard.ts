// unsavedGuard — the unsaved-changes question (012 task 6.1; human ruling R23, 2026-10-09).
//
// APP-PAGE ONLY: `appShell.ts` is the one importer, so nothing here is on the content-script
// graph. Its sheet is its own `<style>`, inside the dialog — never READER_CSS.
//
// ── WHEN IT IS ASKED (`hasUnsavedEdit`) ────────────────────────────────────────────────────────
//
// The reader host is in edit AND carries the dirty attribute — the buffer differs from the file.
// A clean session is left without a word. After a DOWNLOAD the attribute is still there (the file
// in the folder is unchanged — 5.4), so the question is still asked: intended.
//
// ── THE DIALOG (R23) ───────────────────────────────────────────────────────────────────────────
//
// An in-page dialog, not `window.confirm()`: two real buttons, "Keep editing" first and focused as
// it opens, so Enter, Space and Escape are all the safe answer. It names the file. Its state is in
// its text — the title asks, the body says what is lost, each button says what it does.
//
// MODAL FOR THE APP. While it is open every other child of the shell is `inert`: not focusable,
// not clickable, out of the accessibility tree. The dialog is a child of the shell too, so it
// inherits the shell's theme tokens, and it covers the shell. Tab wraps between the two buttons —
// the same hand-rolled trap as the export panel (`exportControls.ts`) and the diagram lightbox.
// It is hand-rolled for the same reason this module is testable in jsdom, which has neither
// `showModal()` nor `inert`'s behaviour: the ATTRIBUTE and the key handling are asserted there,
// what the attribute does is asserted in the real engines (editorUnsaved.browser.test.ts).
//
// ANNOUNCED: `role="dialog"`, `aria-modal`, named by its title and described by its body, with
// focus moved inside — a screen reader reads all three as it opens.
//
// ── THE ANSWER IS GIVEN INSIDE THE CLICK ───────────────────────────────────────────────────────
//
// `onDiscard` is called synchronously from the "Discard edits" click, after the dialog is closed
// and the page is live again. That is load-bearing: what follows may open the folder picker or
// ask for a handle's permission, and both need the click's user activation. Each answer is given
// once; the dialog is gone before it is.
//
// Tab close and reload cannot be asked here — a page may only raise the browser's own dialog
// there. That is `editorView.ts`'s `beforeunload` claim.

import { EDITOR_DIRTY_ATTR } from '../render/editorView';

export const UNSAVED_DIALOG_CLASS = 'peekover-unsaved';
export const UNSAVED_KEEP_CLASS = `${UNSAVED_DIALOG_CLASS}__keep`;
export const UNSAVED_DISCARD_CLASS = `${UNSAVED_DIALOG_CLASS}__discard`;

const TITLE = 'Discard unsaved edits?';
const NO_NAME = 'This document';
const BODY_REST = ' has edits that are not saved to the file in its folder. If you discard them, they are gone.';
const KEEP_LABEL = 'Keep editing';
const DISCARD_LABEL = 'Discard edits';

const UNSAVED_CSS = /* css */ `
.${UNSAVED_DIALOG_CLASS}{
  position:absolute; inset:0; z-index:20; display:flex; align-items:flex-start; justify-content:center;
  padding:14vh 1rem 1rem; background:color-mix(in srgb,var(--logo-ink) 45%,transparent); backdrop-filter:blur(3px);
}
.${UNSAVED_DIALOG_CLASS}__card{
  width:min(430px,100%); background:var(--paper); color:var(--ink); font-family:var(--sans);
  border:1px solid var(--line); border-radius:14px; box-shadow:var(--shadow); overflow:hidden;
}
.${UNSAVED_DIALOG_CLASS}__title{margin:0; padding:14px 18px; border-bottom:1px solid var(--line); font:700 13.5px/1.3 var(--sans)}
.${UNSAVED_DIALOG_CLASS}__body{margin:0; padding:18px; font-size:13px; line-height:1.65; color:var(--muted); overflow-wrap:anywhere}
.${UNSAVED_DIALOG_CLASS}__actions{display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; padding:14px 18px; border-top:1px solid var(--line)}
`;

/** Is `host` a document being edited with changes that are not saved? */
export function hasUnsavedEdit(host: Element | null | undefined): boolean {
  return host?.getAttribute('data-mode') === 'edit' && host.hasAttribute(EDITOR_DIRTY_ATTR);
}

/** What the dialog is answered with. Exactly one is called, once. */
export interface UnsavedAnswers {
  onKeep(): void;
  onDiscard(): void;
}

/** The focused element, followed into shadow roots — the edit control lives in one. */
function focusedIn(doc: Document): HTMLElement | null {
  let el: Element | null = doc.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el as HTMLElement | null;
}

/**
 * Ask whether the unsaved edits to `fileName` may be discarded. The dialog is appended to
 * `shell`, whose other children are inert until it is answered.
 */
export function openUnsavedDialog(
  shell: HTMLElement,
  fileName: string | undefined,
  { onKeep, onDiscard }: UnsavedAnswers,
): void {
  const doc = shell.ownerDocument;
  const returnTo = focusedIn(doc);

  const dialog = doc.createElement('div');
  dialog.className = UNSAVED_DIALOG_CLASS;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', `${UNSAVED_DIALOG_CLASS}-title`);
  dialog.setAttribute('aria-describedby', `${UNSAVED_DIALOG_CLASS}-body`);

  const style = doc.createElement('style');
  style.textContent = UNSAVED_CSS;
  const card = doc.createElement('div');
  card.className = `${UNSAVED_DIALOG_CLASS}__card`;
  const title = doc.createElement('h2');
  title.className = `${UNSAVED_DIALOG_CLASS}__title`;
  title.id = `${UNSAVED_DIALOG_CLASS}-title`;
  title.textContent = TITLE;
  const body = doc.createElement('p');
  body.className = `${UNSAVED_DIALOG_CLASS}__body`;
  body.id = `${UNSAVED_DIALOG_CLASS}-body`;
  body.textContent = (fileName ? `“${fileName}”` : NO_NAME) + BODY_REST;
  const actions = doc.createElement('div');
  actions.className = `${UNSAVED_DIALOG_CLASS}__actions`;
  const keep = doc.createElement('button');
  keep.type = 'button';
  keep.className = UNSAVED_KEEP_CLASS;
  keep.textContent = KEEP_LABEL;
  const discard = doc.createElement('button');
  discard.type = 'button';
  discard.className = UNSAVED_DISCARD_CLASS;
  discard.textContent = DISCARD_LABEL;
  actions.append(keep, discard);
  card.append(title, body, actions);
  dialog.append(style, card);

  // Only what this call made inert is released by it.
  const behind = [...shell.children].filter((el) => !el.hasAttribute('inert'));
  for (const el of behind) el.setAttribute('inert', '');

  function close(answer: () => void): void {
    if (!dialog.parentNode) return; // answered already
    dialog.remove();
    for (const el of behind) el.removeAttribute('inert');
    if (returnTo?.isConnected) returnTo.focus();
    answer();
  }

  keep.addEventListener('click', () => close(onKeep));
  discard.addEventListener('click', () => close(onDiscard));
  // A press on the veil must not take focus out of the dialog: Escape is handled on it.
  dialog.addEventListener('mousedown', (event) => {
    if (event.target !== keep && event.target !== discard) event.preventDefault();
  });
  dialog.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(onKeep);
      return;
    }
    if (event.key !== 'Tab') return;
    const active = focusedIn(doc);
    if (event.shiftKey && active === keep) {
      event.preventDefault();
      discard.focus();
    } else if (!event.shiftKey && active === discard) {
      event.preventDefault();
      keep.focus();
    }
  });

  shell.append(dialog);
  keep.focus();
}
