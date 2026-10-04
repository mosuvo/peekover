// editorView — the edit view's SHELL (012 task 2.2, D-4 as re-ruled): a split pane built inside
// the document host's shadow root, beside the reading column. One half is an empty slot the
// editor is built into (a later task's); the other is the live preview.
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
// through `renderPreview` below, the ONE place it is written. `chrome: false` is load-bearing, not
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
// App-page only, and not on the content-script graph: nothing the content script imports reaches
// this module.

import { mount } from './mount';
import { readerSourceFor } from './readerMode';
import { EDITOR_CSS } from '../theme/readerCss';
import { unregisterThemeHost } from '../theme/themeRegistry';

export const EDITOR_SHELL_CLASS = 'peekover-editor';
export const EDITOR_SOURCE_CLASS = 'peekover-editor__source';
export const EDITOR_PREVIEW_CLASS = 'peekover-editor__preview';
export const EDITOR_PREVIEW_HOST_CLASS = 'peekover-editor__preview-host';

const ARIA_PREVIEW = 'Live preview';

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

/** Remove exactly what `buildEditorShell` added. Called beside `exitEditMode`; a no-op for a host
 *  with no shell. */
export function teardownEditorShell(host: HTMLElement): void {
  const built = shells.get(host);
  if (!built) return;
  shells.delete(host);
  for (const node of built.added) node.remove();
  unregisterThemeHost(built.shell.previewHost);
}
