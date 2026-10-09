// editorEnhancer — the edit-entry control and the wiring behind it (012 task 3.2; D-1's control
// half, D-3). One `enhanceEditor(host, { save })` call per app-page mount path, after the mount
// has committed — the same post-mount shape as `enhanceDiagrams` / `enhanceMath`, and for the same
// reason: `mount()` stays a read-only library, and what is app-page-only is kept off the
// content-script graph by WHO IMPORTS IT, not by a runtime check.
//
// ── WHAT IT INSTALLS ───────────────────────────────────────────────────────────────────────────
//
// One real `<button>` in the host's shadow root, directly after the mode pill, and one `<style>`
// for it (`EDIT_CONTROL_CSS`). `mount()` rebuilds a host's whole shadow root on every call, so both
// are gone after any re-mount; the two call sites run this after every mount, and it is idempotent
// — a host that still has its control gets nothing added.
//
// It installs nothing on a host with no `data-mode`: that is `mount()`'s render-failure fallback
// (a banner over the raw source), where there is no document view to edit.
//
// ── THE CONTROL IS THE ENTRY AND THE EXIT (D-1; human ruling R3, 2026-10-05) ───────────────────
//
// The bare `\` key and the mode pill stay a binary reading <-> raw toggle; edit has its own
// control. At rest it reads "Edit". Activating it loads the engine, builds the edit view, and only
// then flips the mode (`enterEditMode`'s order — never 'edit' with nothing behind it); it then
// reads "Stop editing", and activating it again runs `exitEditMode` and the edit view's teardown
// together. While the host is in edit the mode pill is hidden (EDITOR_CSS), so this is the only
// way out — the pill left edit without a teardown, which is the bypass R3 closes.
//
// The state is in the control's TEXT and its accessible name, never in colour alone.
//
// ★ WHAT IT DOES NOT DO, STATED SO IT IS NOT ASSUMED. The click handler below leaves edit and
// DISCARDS whatever in the buffer was not saved — it asks nothing. The question is the app page's
// (6.1): `appShell.ts` hears the click first and, when there are unsaved changes, holds it until
// the user has answered. What WAS saved is shown by the reading view once edit is left — also
// the app page's doing, not this module's (4.3, R19).
//
// `save` is called by the edit view's own Save control (5.3), never from here. A watch update that
// arrives during an edit no longer touches the editor: it is held until edit is left (4.1–4.2).
//
// ── THE ENGINE LOAD IS KEYED ON THE OUTER HOST (human ruling R2) ───────────────────────────────
//
// `loadEditorEngine(host)` memoizes per element. The element handed to it is the DOCUMENT host —
// the one this function is called with — which outlives every edit session on it, so edit ->
// reading -> edit is one load. (The edit view's own nested host is built after the load and
// discarded on exit; keyed on that, every entry would load again.)
//
// ── DEGRADE (spec §3.7) ────────────────────────────────────────────────────────────────────────
//
// If the engine cannot load, `enterEditMode` rejects before it has built or flipped anything: the
// document stays in the mode it was in, no editor node exists, and the control says the editor is
// unavailable. The engine does not remember a failure, so activating the control again retries.
//
// ── SAVE IS INJECTED (D-3) ─────────────────────────────────────────────────────────────────────
//
// `save` arrives as a function from the app page and is passed straight into the edit session.
// This module, like every render module, names no handle type and reaches for no file.

import { enterEditMode, exitEditMode } from './readerMode';
import { loadEditorEngine, type EditorModuleLoader } from './editorEngine';
import {
  buildEditor,
  dropStaleEditorSession,
  teardownEditorShell,
  type EditorSave,
} from './editorView';
import { EDIT_CONTROL_CSS } from '../theme/readerCss';

export type { EditorSave, EditorSaveOutcome } from './editorView';

export const EDIT_CONTROL_CLASS = 'peekover-edit-toggle';

/** Marks the control's own `<style>`, so a second call does not append a second sheet. */
const EDIT_STYLE_MARKER = 'data-peekover-edit-style';

/** What `enhanceEditor` is handed. */
export interface EditorEnhanceOptions {
  /** The save capability, from the app page. Carried into the edit session; not called here. */
  save?: EditorSave;
  /** Where the CodeMirror modules come from. Tests inject one; production passes nothing and
   *  gets the engine's own two dynamic imports. */
  loader?: EditorModuleLoader;
}

type ControlState = 'rest' | 'editing' | 'unavailable';

/** The control's visible text and accessible name, per state. */
const LABELS: Record<ControlState, { text: string; name: string }> = {
  rest: { text: 'Edit', name: 'Edit this document' },
  editing: { text: 'Stop editing', name: 'Stop editing and return to the document' },
  unavailable: {
    text: 'Editor unavailable',
    name: 'The editor could not be loaded. Activate to try again.',
  },
};

function label(control: HTMLButtonElement, state: ControlState): void {
  control.textContent = LABELS[state].text;
  control.setAttribute('aria-label', LABELS[state].name);
}

/** Inject the control's sheet into `shadow`, once. */
function ensureControlStyle(shadow: ShadowRoot): void {
  if (shadow.querySelector(`style[${EDIT_STYLE_MARKER}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(EDIT_STYLE_MARKER, '');
  style.textContent = EDIT_CONTROL_CSS;
  shadow.appendChild(style);
}

/**
 * Install the edit control on a mounted app-page host. Called from both app-page mount paths —
 * `readerPane.ts` and `appShell.ts`, immediately after `enhanceMath` — and from nowhere else.
 *
 * No-ops on a host with no shadow root, on a failed render (no `data-mode`), and on a host that
 * already has its control. A session left behind by the re-mount that preceded this call is
 * ended here, so its dirty attribute does not outlive the document it described.
 */
export function enhanceEditor(host: HTMLElement, options: EditorEnhanceOptions = {}): void {
  const shadow = host.shadowRoot;
  if (!shadow || !host.hasAttribute('data-mode')) return;
  if (shadow.querySelector(`.${EDIT_CONTROL_CLASS}`)) return;
  dropStaleEditorSession(host);

  const control = document.createElement('button');
  control.type = 'button';
  control.className = EDIT_CONTROL_CLASS;
  label(control, 'rest');

  let entering = false;
  control.addEventListener('click', () => {
    if (host.getAttribute('data-mode') === 'edit') {
      exitEditMode(host);
      teardownEditorShell(host);
      label(control, 'rest');
      return;
    }
    if (entering) return;
    entering = true;
    enterEditMode(host, {
      loader: () => loadEditorEngine(host, options.loader),
      build: (engine, h) => {
        buildEditor(engine, h, { save: options.save });
      },
    }).then(
      () => label(control, 'editing'),
      () => label(control, 'unavailable'),
    ).finally(() => {
      entering = false;
    });
  });

  ensureControlStyle(shadow);
  const pill = shadow.querySelector('.peekover-mode-toggle');
  if (pill) pill.after(control);
  else shadow.appendChild(control);
}
