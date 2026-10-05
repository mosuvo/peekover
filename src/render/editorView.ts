// editorView — the edit view (012 tasks 2.2 and 3.2). Its SHELL (D-4 as re-ruled) is a split pane
// built inside the document host's shadow root, beside the reading column: one half is the slot
// the editor is built into, the other is the live preview. Its EDITOR half (3.2) puts the engine's
// view in that slot and keeps the session that goes with it.
//
// ── WHY THE PREVIEW HAS ITS OWN HOST ───────────────────────────────────────────────────────────
//
// `mount()` owns a host's ENTIRE shadow root: every call ends in `replaceChildren`. Rendering a
// preview into the document's own host would therefore destroy the editor on every keystroke. So
// the preview is `mount()` called on a NESTED host — an element in this shell with a shadow root
// of its own — and this module never calls `mount()` on the outer host. That call is always
//
//     mount(text, previewHost, { contained: true, preserveReading: true, chrome: false })
//
// through `renderPreview` below, the ONE place it is written. At 3.2 that still runs once, at
// build; feeding it from the editor's buffer is 3.3's. `chrome: false` is load-bearing, not
// cosmetic: the watch target, the diff context and the document identity are module-level
// singletons, so a nested mount that composed chrome would wire a watch control, a diff affordance
// and a TOC rail to the PREVIEW (decisions.md, M12 D-4 RE-RULED). It is the same single
// parse -> sanitize -> inert-template path every other render takes; nothing is duplicated here.
//
// ── THE SCROLL BOX ─────────────────────────────────────────────────────────────────────────────
//
// `preserveReading` restores the reader's place against `resolveScrollContainer(host, true)`,
// which walks `host.parentElement` for the nearest ancestor that scrolls and FALLS BACK to the
// host when there is none. A nested host placed directly in a shadow root has no parent element,
// so it would get the fallback — an element that does not scroll under CONTAINED_CSS — and every
// restore would silently do nothing. The nested host therefore sits INSIDE a wrapper
// (`EDITOR_PREVIEW_CLASS`) that is the pane's scroll box, so the walk finds a real scroller by its
// computed overflow. Chosen over making the nested host itself scroll: that would be reached only
// through the fallback, which is indistinguishable from the failure it stands in for.
//
// ── VISIBILITY, AND WHAT A BYPASS LEAVES BEHIND ────────────────────────────────────────────────
//
// The shell is `display:none` unless the host carries `data-mode="edit"` (EDITOR_CSS). The mode
// pill leaves edit through `toggleReaderMode`, which does not come through `exitEditMode` — so no
// teardown runs on that path. The shell is then still in the DOM, hidden, and a later
// `buildEditorShell` finds and reuses it rather than building a second one.
//
// ── THE SESSION: THE SEED, originalText, AND THE DIRTY ATTRIBUTE (3.2; D-7, F-4) ───────────────
//
// `buildEditor` seeds the view from the host's registered source — the string the file's own
// `read()` returned, which `mount()` registered untouched — and keeps that same string as the
// session's `originalText`. It is kept RAW: the save-time conflict compare (D-7) is against what
// was read off disk, and CodeMirror's document does not hold that. Its document is a sequence of
// lines with no memory of what separated them, so a CRLF file reads back out with LF endings
// before the user has typed anything (measured at 3.1, `editorEngine.test.ts`).
//
// So "has the user changed anything" cannot be `buffer !== originalText` — that marks every CRLF
// file dirty on entry. The dirty attribute compares the buffer against originalText put through
// the SAME line-break rule the editor applies, `normaliseLineBreaks` below. 006 D-5's existing
// normaliser (`normalise`, `app/snapshots.ts`) was not reused: it rewrites CRLF pairs only, and
// the editor also turns a LONE carriage return into a break, so a file with one would still enter
// dirty.
//
// The attribute is `data-edit-dirty="true"` on the OUTER host — the `data-mode` / `data-diff`
// precedent — and is REMOVED, not set to "false", when the buffer matches again. It is a literal
// because the modules that read it (the watch deferral, the unsaved-changes guard) sit on the far
// side of an import fence and may not import this one (tasks.md F-4).
//
// Nothing here writes a file, asks for a permission or names a handle type. `save` is a function
// the app page hands in; the session carries it and, at 3.2, nothing calls it.
//
// App-page only, and not on the content-script graph: nothing the content script imports reaches
// this module.

import { mount } from './mount';
import { readerSourceFor } from './readerMode';
import type { EditorEngine, EditorViewHandle } from './editorEngine';
import { EDITOR_CSS } from '../theme/readerCss';
import { unregisterThemeHost } from '../theme/themeRegistry';

export const EDITOR_SHELL_CLASS = 'peekover-editor';
export const EDITOR_SOURCE_CLASS = 'peekover-editor__source';
export const EDITOR_PREVIEW_CLASS = 'peekover-editor__preview';
export const EDITOR_PREVIEW_HOST_CLASS = 'peekover-editor__preview-host';

/** On the OUTER host while the buffer differs from the document it was seeded from. Present or
 *  absent — never "false". Read BY LITERAL from modules that may not import this one. */
export const EDITOR_DIRTY_ATTR = 'data-edit-dirty';

const ARIA_PREVIEW = 'Live preview';

/** What a save reports back. A refusal carries its reason as text, for a status line to show. */
export type EditorSaveOutcome = { ok: true } | { ok: false; reason: string };

/** The save capability, injected from the app page. This module calls it and knows nothing else
 *  about where the text goes. */
export type EditorSave = (text: string) => Promise<EditorSaveOutcome>;

/** One edit session: the view, what it was seeded from, and the capability it was handed. */
export interface EditorSession {
  /** The engine's view, built in the shell's source slot. */
  readonly view: EditorViewHandle;
  /** The registered source the view was seeded from — RAW, exactly as the file was read. */
  readonly originalText: string;
  /** The injected save, or `undefined` on a surface that provided none. */
  readonly save: EditorSave | undefined;
}

/** What `buildEditor` is handed beside the engine. */
export interface BuildEditorOptions {
  save?: EditorSave;
}

/**
 * The editor's own line-break rule, applied to a string: a CRLF pair and a lone CR each become one
 * LF. CodeMirror splits a document on exactly these (`@codemirror/state`'s default separator), so
 * `normaliseLineBreaks(text)` is what a view seeded with `text` reads back.
 */
export function normaliseLineBreaks(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/** The parts of a built shell a caller works with. */
export interface EditorShell {
  /** The empty slot the editor's own DOM is built into. */
  source: HTMLElement;
  /** The preview pane — and its scroll box. */
  preview: HTMLElement;
  /** The nested host: the only element this module ever passes to `mount()`. */
  previewHost: HTMLElement;
}

interface BuiltShell {
  shell: EditorShell;
  /** Exactly what build appended to the outer shadow root — and so exactly what teardown removes. */
  added: Element[];
}

/** Per outer host: its built shell. Weak, so a discarded host takes its entry with it. */
const shells = new WeakMap<HTMLElement, BuiltShell>();

/** A host's entry, only while its nodes are still in that host's shadow root — a re-mount of the
 *  outer host drops them with `replaceChildren`, and a stale entry must not be handed back. */
function liveShell(host: HTMLElement): BuiltShell | undefined {
  const built = shells.get(host);
  if (!built) return undefined;
  if (built.added.every((node) => node.parentNode === host.shadowRoot)) return built;
  shells.delete(host);
  return undefined;
}

/** Per outer host: its edit session. */
const sessions = new WeakMap<HTMLElement, EditorSession>();

/** The host's session, only while its view is still in that host's shell — an outer re-mount
 *  drops the view with the shell, and a stale session must not be handed back. */
export function editorSessionFor(host: HTMLElement): EditorSession | undefined {
  const session = sessions.get(host);
  if (!session) return undefined;
  if (liveShell(host)?.shell.source.contains(session.view.dom)) return session;
  return undefined;
}

/** End the host's session, live or stale: destroy the view and clear the dirty attribute. */
function endEditorSession(host: HTMLElement): void {
  const session = sessions.get(host);
  if (!session) return;
  sessions.delete(host);
  session.view.destroy();
  host.removeAttribute(EDITOR_DIRTY_ATTR);
}

/**
 * Build the edit view in `host`: the shell, then the engine's view in its source slot, seeded
 * from the host's registered source. Idempotent while a session is live.
 *
 * Shaped to be `enterEditMode`'s `build` step, under the same contract as `buildEditorShell`: if
 * the view cannot be built, the shell this call added is removed again before the throw leaves.
 */
export function buildEditor(
  engine: EditorEngine,
  host: HTMLElement,
  { save }: BuildEditorOptions = {},
): EditorSession {
  const live = editorSessionFor(host);
  if (live) return live;
  endEditorSession(host); // a session an outer re-mount left behind

  const shell = buildEditorShell(host);
  const originalText = readerSourceFor(host) ?? '';
  const baseline = normaliseLineBreaks(originalText);
  try {
    const view = engine.createView(
      shell.source,
      originalText,
      engine.EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        const { doc } = update.state;
        // Length first: a different length settles it without building the string.
        const dirty = doc.length !== baseline.length || doc.toString() !== baseline;
        if (dirty) host.setAttribute(EDITOR_DIRTY_ATTR, 'true');
        else host.removeAttribute(EDITOR_DIRTY_ATTR);
      }),
    );
    const session: EditorSession = { view, originalText, save };
    sessions.set(host, session);
    return session;
  } catch (err) {
    teardownEditorShell(host);
    throw err;
  }
}

/** End a session that an outer re-mount orphaned — its view is gone from the DOM, but its dirty
 *  attribute is on the host, which survives. A no-op while the session is live, or absent. */
export function dropStaleEditorSession(host: HTMLElement): void {
  if (!editorSessionFor(host)) endEditorSession(host);
}

/** The host's shell, or `undefined` when none is built (or a re-mount has since dropped it). */
export function editorShellFor(host: HTMLElement): EditorShell | undefined {
  return liveShell(host)?.shell;
}

/**
 * Build the shell in `host`'s shadow root and render the document into its preview. Idempotent:
 * a host that already has a live shell gets that one back, with nothing added.
 *
 * Shaped to be `enterEditMode`'s `build` step, whose contract is that a failed build leaves the
 * host's DOM as it found it: a host with no shadow root throws before anything is created, and a
 * throw after the append removes what was appended.
 */
export function buildEditorShell(host: HTMLElement): EditorShell {
  const existing = liveShell(host);
  if (existing) return existing.shell;
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('editorView: the host has no shadow root to build the edit view in');

  const style = document.createElement('style');
  style.textContent = EDITOR_CSS;

  const root = document.createElement('div');
  root.className = EDITOR_SHELL_CLASS;
  const source = document.createElement('div');
  source.className = EDITOR_SOURCE_CLASS;
  const preview = document.createElement('div');
  preview.className = EDITOR_PREVIEW_CLASS;
  preview.setAttribute('role', 'region');
  preview.setAttribute('aria-label', ARIA_PREVIEW);
  const previewHost = document.createElement('div');
  previewHost.className = EDITOR_PREVIEW_HOST_CLASS;
  preview.append(previewHost);
  root.append(source, preview);

  const shell: EditorShell = { source, preview, previewHost };
  shells.set(host, { shell, added: [style, root] });
  shadow.append(style, root);
  try {
    renderPreview(host, readerSourceFor(host) ?? '');
  } catch (err) {
    teardownEditorShell(host);
    throw err;
  }
  return shell;
}

/** Render `text` into the host's preview. Does nothing when the host has no shell. */
export function renderPreview(host: HTMLElement, text: string): void {
  const built = liveShell(host);
  if (!built) return;
  mount(text, built.shell.previewHost, { contained: true, preserveReading: true, chrome: false });
}

/** Remove exactly what `buildEditorShell` added, ending the edit session built in it first.
 *  Called beside `exitEditMode`; a no-op for a host with no shell and no session. */
export function teardownEditorShell(host: HTMLElement): void {
  endEditorSession(host);
  const built = shells.get(host);
  if (!built) return;
  shells.delete(host);
  for (const node of built.added) node.remove();
  unregisterThemeHost(built.shell.previewHost);
}
