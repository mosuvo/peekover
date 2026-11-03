// editorEnhancer — entering and leaving edit on an app-page document (012 task 3.2, D-1, D-3;
// 013 task 4.3, D-6). One `enhanceEditor(host, { save })` call per app-page mount path, after the
// mount has committed — the same post-mount shape as `enhanceDiagrams` / `enhanceMath`, and for the
// same reason: `mount()` stays a read-only library, and what is app-page-only is kept off the
// content-script graph by WHO IMPORTS IT, not by a runtime check.
//
// ── WHAT IT DOES ───────────────────────────────────────────────────────────────────────────────
//
// `enhanceEditor` makes a mounted host EDITABLE: it records the host's options (the save, the
// loader) and ends a session a re-mount left behind. It builds no control — since 013 task 4.3 the
// way in is the toolbar's Edit segment (D-6), which calls `toggleEdit(host)`. It is idempotent and
// does nothing on a host with no `data-mode`: that is `mount()`'s render-failure fallback (a banner
// over the raw source), where there is no document view to edit.
//
// It also injects ONE app-only rule, `CAPTURE_NOTICE_SEAT_CSS` (readerCss.ts): the capture
// notice's seat, which shared the removed control's sheet. The notice leaves the shadow root at
// 4.5 (D-8); the rule goes with it.
//
// ── ENTERING AND LEAVING (`toggleEdit`, `leaveEdit`) ───────────────────────────────────────────
//
// Entering loads the engine, builds the edit view, and only then flips the mode
// (`enterEditMode`'s order — never 'edit' with nothing behind it). It resolves to the state the
// Edit segment shows: 'editing', or 'unavailable' when the engine could not load. A second
// activation while a load is pending joins it — one entry, one loader call.
//
// Leaving is the exit and the edit view's teardown together — always both, which is the bypass
// R3 closed. `leaveEdit(host, to)` goes to the mode clicked (the segment: ruling E, the one you
// click is where you go); without `to` it returns to the mode edit was entered from. While the
// host is in edit the reader's mode pill is hidden (EDITOR_CSS), so it cannot leave without them.
//
// ★ WHAT IT DOES NOT DO, STATED SO IT IS NOT ASSUMED. `leaveEdit` DISCARDS whatever in the buffer
// was not saved — it asks nothing. The question is the app page's (6.1): `appShell.ts` hears the
// segment's click first and, when there are unsaved changes, holds it until the user has
// answered. What WAS saved is shown by the reading view once edit is left — also the app page's
// doing, not this module's (4.3, R19).
//
// `save` is called by the edit view's own Save control (5.3), never from here. A watch update that
// arrives during an edit no longer touches the editor: it is held until edit is left (4.1–4.2).
//
// ── THE ENGINE LOAD IS KEYED ON THE OUTER HOST (human ruling R2) ───────────────────────────────
//
// `loadEditorEngine(host)` memoizes per element. The element handed to it is the DOCUMENT host,
// which outlives every edit session on it, so edit -> reading -> edit is one load. (The edit
// view's own nested host is built after the load and discarded on exit; keyed on that, every
// entry would load again.)
//
// ── DEGRADE (spec §3.7) ────────────────────────────────────────────────────────────────────────
//
// If the engine cannot load, `enterEditMode` rejects before it has built or flipped anything: the
// document stays in the mode it was in, no editor node exists, and `toggleEdit` resolves
// 'unavailable' — the Edit segment says so in text. The engine does not remember a failure, so
// activating Edit again retries.
//
// ── SAVE IS INJECTED (D-3) ─────────────────────────────────────────────────────────────────────
//
// `save` arrives as a function from the app page and is passed straight into the edit session.
// This module, like every render module, names no handle type and reaches for no file.

import { enterEditMode, exitEditMode, setReaderMode, type ReaderMode } from './readerMode';
import { loadEditorEngine, type EditorModuleLoader } from './editorEngine';
import {
  buildEditor,
  dropStaleEditorSession,
  teardownEditorShell,
  type EditorSave,
} from './editorView';
import { CAPTURE_NOTICE_SEAT_CSS } from '../theme/readerCss';

export type { EditorSave, EditorSaveOutcome } from './editorView';

/** Marks the app-only seat sheet, so a second call does not append a second one. */
const SEAT_STYLE_MARKER = 'data-peekover-seat-style';

/** What `enhanceEditor` is handed. */
export interface EditorEnhanceOptions {
  /** The save capability, from the app page. Carried into the edit session; not called here. */
  save?: EditorSave;
  /** Where the CodeMirror modules come from. Tests inject one; production passes nothing and
   *  gets the engine's own two dynamic imports. */
  loader?: EditorModuleLoader;
}

/** What the Edit segment shows: at rest, editing, or the engine could not be loaded. */
export type EditState = 'rest' | 'editing' | 'unavailable';

/** The Edit segment's visible text and accessible name, per state. */
export const EDIT_LABELS: Record<EditState, { text: string; name: string }> = {
  rest: { text: 'Edit', name: 'Edit this document' },
  editing: { text: 'Edit', name: 'Editing this document' },
  unavailable: {
    text: 'Editor unavailable',
    name: 'The editor could not be loaded. Activate to try again.',
  },
};

/** Each editable host's options, as its last `enhanceEditor` call gave them. */
const editable = new WeakMap<HTMLElement, EditorEnhanceOptions>();
/** An entry in flight, per host: a second activation joins it. */
const entering = new WeakMap<HTMLElement, Promise<EditState>>();

/**
 * Make a mounted app-page host editable. Called from both app-page mount paths — `readerPane.ts`
 * and `appShell.ts`, immediately after `enhanceMath` — and from nowhere else.
 *
 * No-ops on a host with no shadow root and on a failed render (no `data-mode`). A session left
 * behind by the re-mount that preceded this call is ended here, so its dirty attribute does not
 * outlive the document it described.
 */
export function enhanceEditor(host: HTMLElement, options: EditorEnhanceOptions = {}): void {
  const shadow = host.shadowRoot;
  if (!shadow || !host.hasAttribute('data-mode')) return;
  editable.set(host, options);
  if (!shadow.querySelector(`style[${SEAT_STYLE_MARKER}]`)) {
    dropStaleEditorSession(host);
    const style = document.createElement('style');
    style.setAttribute(SEAT_STYLE_MARKER, '');
    style.textContent = CAPTURE_NOTICE_SEAT_CSS;
    shadow.appendChild(style);
  }
}

/** Can `host` be edited — enhanced, and still a rendered document (not the failure fallback)? */
export function isEditable(host: HTMLElement | null | undefined): boolean {
  return !!host && editable.has(host) && !!host.shadowRoot && host.hasAttribute('data-mode');
}

/** Leave edit: the exit and the edit view's teardown, together. `to` is the mode to go to (the
 *  segment clicked); without it, the mode edit was entered from. Does nothing outside edit. */
export function leaveEdit(host: HTMLElement, to?: Exclude<ReaderMode, 'edit'>): void {
  if (host.getAttribute('data-mode') !== 'edit') return;
  if (to) setReaderMode(host, to);
  else exitEditMode(host);
  teardownEditorShell(host);
}

/**
 * Enter edit on an editable host, or leave it if it is in edit. Resolves to the state the Edit
 * segment shows. `options` defaults to what `enhanceEditor` recorded for the host.
 */
export function toggleEdit(host: HTMLElement, options?: EditorEnhanceOptions): Promise<EditState> {
  if (host.getAttribute('data-mode') === 'edit') {
    leaveEdit(host);
    return Promise.resolve('rest');
  }
  const pending = entering.get(host);
  if (pending) return pending;
  if (!isEditable(host)) return Promise.resolve('rest');
  const opts = options ?? editable.get(host) ?? {};
  const entry = enterEditMode(host, {
    loader: () => loadEditorEngine(host, opts.loader),
    build: (engine, h) => {
      buildEditor(engine, h, { save: opts.save });
    },
  })
    .then(
      (): EditState => (host.getAttribute('data-mode') === 'edit' ? 'editing' : 'rest'),
      (): EditState => 'unavailable',
    )
    .finally(() => entering.delete(host));
  entering.set(host, entry);
  return entry;
}
