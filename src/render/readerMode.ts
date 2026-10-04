// readerMode — the Raw <-> Reading view toggle for a mounted reader. Two ways in:
// a focusable pill inside the shadow root, and a single bare-key shortcut. State is
// a `data-mode` attribute on the shadow host ('reading' | 'raw' | 'edit'); CSS in readerCss.ts
// keys view visibility off it, so a toggle is a pure attribute flip — it NEVER
// re-runs parse/sanitize (that happened once, at mount). The raw view is built lazily
// the first time the user switches to it — just the source as textContent, no parse —
// and reused after, so a document that is never toggled pays nothing and its untrusted
// source never enters the shadow tree.
//
// No persistence: mode lives on the live host only and resets on every fresh mount
// (persisted reading preferences arrive with the settings milestone, spec 004).
//
// Scoping is the delicate part (see installToggleShortcut): the key listener must
// never swallow keys on pages we did not render.
//
// 'edit' (012 D-1) is the third mode and the one that is NOT a pure attribute flip: it is
// reached only through the async enterEditMode, never through setReaderMode or the toggle.
// This module imports no editor — the engine arrives as an injected loader.

const HOST_TAG = 'peekover-root';

/**
 * The keyboard shortcut: a BARE backslash. Chosen deliberately — it is not a Ctrl/Cmd
 * combination (those belong to the browser), and it is not a plain letter or `/` or
 * `'` (Firefox binds the latter two to quick-find, and bare letters collide with
 * host-site shortcuts). `\` has no default browser or OS action, so claiming it cannot
 * shadow anything the user expects. It only ever fires inside our mounted reader — see
 * installToggleShortcut for the guards.
 */
export const TOGGLE_KEY = '\\';

export type ReaderMode = 'reading' | 'raw' | 'edit';

/**
 * Per-host raw source, stashed so the raw view can be built lazily on first toggle
 * without re-reading or re-parsing. A WeakMap (not a DOM attribute) keeps the
 * untrusted source off the DOM and lets it be GC'd with the host.
 */
const sources = new WeakMap<HTMLElement, string>();

/** Remember a host's raw source for a later lazy Raw view. Called by mount() on BOTH
 *  the successful render path and the fallback path — the WeakMap holds what is
 *  currently on screen, with no exception. */
export function registerReaderSource(host: HTMLElement, source: string): void {
  sources.set(host, source);
}

/** Read a host's registered raw source, or `undefined` when it was never registered.
 *  The counterpart to registerReaderSource — set it there, get it here. Returns the
 *  bare Map result (no empty-string fallback) so a caller can tell "never registered"
 *  apart from a genuinely empty document. */
export function readerSourceFor(host: HTMLElement): string | undefined {
  return sources.get(host);
}

/** Reflect the current mode onto the toggle button's label + aria-label. In reading
 *  mode the control offers "Raw" (the next view); in raw mode it offers "Reading". In
 *  edit it offers "Raw" too — toggleReaderMode is binary, so that is where a click goes. */
function labelToggle(host: HTMLElement, mode: ReaderMode): void {
  const btn = host.shadowRoot?.querySelector<HTMLButtonElement>('.peekover-mode-toggle');
  if (!btn) return;
  btn.textContent = mode === 'raw' ? 'Reading' : 'Raw';
  btn.setAttribute(
    'aria-label',
    mode === 'raw' ? 'Show reading view' : 'Show raw markdown source',
  );
}

/**
 * Ensure the raw <pre> exists in the host's shadow root, building it once (source as
 * textContent — escaped plain text, never parsed as HTML). Idempotent: reused on every
 * later toggle, so switching back and forth never rebuilds and never reparses.
 */
function ensureRawView(host: HTMLElement): void {
  const shadow = host.shadowRoot;
  if (!shadow || shadow.querySelector('.peekover-raw')) return;
  const pre = document.createElement('pre');
  pre.className = 'peekover-raw';
  pre.textContent = sources.get(host) ?? '';
  shadow.appendChild(pre);
}

/** Flip the host attribute (CSS swaps visibility) and relabel the control. */
function applyMode(host: HTMLElement, mode: ReaderMode): void {
  host.setAttribute('data-mode', mode);
  labelToggle(host, mode);
}

/**
 * Set the reader's view mode: build the raw view if needed, flip the host attribute
 * (CSS swaps visibility), and relabel the control. No reparse on any path. Synchronous.
 *
 * 'edit' is NOT settable here — it lands in 'reading'. The type admits it only because
 * mount()'s carried-mode restore hands back whatever `data-mode` was live, and a
 * `preserveReading` re-render during an edit session (a watch tick, until 012 D-8 defers
 * it) has by then dropped the editor with `replaceChildren`. Writing a bare 'edit' there
 * would hide the reading column and the raw view with nothing in their place — a blank
 * page. Any call here also ends the edit session, so a later exit cannot return to a
 * mode remembered from a session that no longer exists.
 */
export function setReaderMode(host: HTMLElement, mode: ReaderMode): void {
  if (mode === 'raw') ensureRawView(host);
  editReturn.delete(host);
  applyMode(host, mode === 'edit' ? 'reading' : mode);
}

/** Flip reading <-> raw. Pure view swap — reader content identity is preserved. */
export function toggleReaderMode(host: HTMLElement): void {
  setReaderMode(host, host.getAttribute('data-mode') === 'raw' ? 'reading' : 'raw');
}

/** Per-host: the mode an edit session was entered from, so its exit can return there. */
const editReturn = new WeakMap<HTMLElement, ReaderMode>();

/** What enterEditMode is handed: where the engine comes from, and what to build with it. */
export interface EnterEditOptions<E> {
  /** Loads the editor engine. Injected, so this module never names it. */
  loader: () => Promise<E>;
  /** Builds the edit view from the loaded engine, before the mode flips. It owns its own
   *  cleanup: if it rejects, it must leave the host's DOM as it found it. */
  build?: (engine: E, host: HTMLElement) => void | Promise<void>;
}

/**
 * Enter edit mode: load, THEN build, THEN flip `data-mode` and relabel — in that order, so
 * the host is never in 'edit' with no editor behind it. A rejection from either step
 * propagates to the caller with the mode, the attribute and the control untouched. The
 * mode to return to is read at the flip, not at the call, so a toggle made while the
 * engine was loading is the one honoured.
 */
export async function enterEditMode<E>(
  host: HTMLElement,
  { loader, build }: EnterEditOptions<E>,
): Promise<void> {
  const engine = await loader();
  await build?.(engine, host);
  const from = host.getAttribute('data-mode');
  if (from === 'edit') return;
  editReturn.set(host, from === 'raw' ? 'raw' : 'reading');
  applyMode(host, 'edit');
}

/** Leave edit mode for the mode it was entered from. Does nothing outside edit. */
export function exitEditMode(host: HTMLElement): void {
  if (host.getAttribute('data-mode') !== 'edit') return;
  setReaderMode(host, editReturn.get(host) ?? 'reading');
}

/**
 * Build the on-screen toggle: one focusable <button> pill, committed by the caller
 * into the shadow root (so it inherits reader tokens and the host page cannot restyle
 * it). setReaderMode() gives it its label once it is in the tree.
 */
export function buildModeToggle(host: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'peekover-mode-toggle';
  btn.addEventListener('click', () => toggleReaderMode(host));
  return btn;
}

/** True when focus is in a field we must not hijack keystrokes from. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable === true;
}

let shortcutInstalled = false;

/**
 * Install the single document-level key listener, ONCE. The scoping guarantees (it
 * must NEVER swallow keys on a page we did not render):
 *   - only the bare TOGGLE_KEY with no Ctrl/Cmd/Alt modifier is even considered;
 *   - it does nothing — and crucially does NOT call preventDefault — unless a mounted
 *     Peekover reader with a toggle-able reading view exists (the host carries
 *     `data-mode`). So on a render failure (raw + banner, no data-mode) and on any
 *     page without our reader, the key passes straight through untouched;
 *   - it ignores the event when focus is in an input/textarea/select/contenteditable;
 *   - it does nothing while the host is in 'edit' (012 F-2). The guard above cannot cover
 *     an editor: a key typed inside the shadow root reaches this listener retargeted to
 *     the host, which is not editable, so a typed backslash would be swallowed and would
 *     throw the user out to Raw;
 *   - preventDefault fires ONLY after we have decided to handle it.
 * The content script that calls this runs only in matched markdown contexts, so the
 * listener is never even added on other pages; the once-guard prevents duplicate
 * listeners across re-renders.
 */
export function installToggleShortcut(): void {
  if (shortcutInstalled) return;
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  shortcutInstalled = true;
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== TOGGLE_KEY) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isEditableTarget(e.target)) return;
    const host = document.querySelector<HTMLElement>(HOST_TAG);
    if (!host || !host.hasAttribute('data-mode')) return;
    if (host.getAttribute('data-mode') === 'edit') return;
    e.preventDefault();
    toggleReaderMode(host);
  });
}
