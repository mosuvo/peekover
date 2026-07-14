// readerMode — the Raw <-> Reading view toggle for a mounted reader. Two ways in:
// a focusable pill inside the shadow root, and a single bare-key shortcut. State is
// a `data-mode` attribute on the shadow host ('reading' | 'raw'); CSS in readerCss.ts
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

export type ReaderMode = 'reading' | 'raw';

/**
 * Per-host raw source, stashed so the raw view can be built lazily on first toggle
 * without re-reading or re-parsing. A WeakMap (not a DOM attribute) keeps the
 * untrusted source off the DOM and lets it be GC'd with the host.
 */
const sources = new WeakMap<HTMLElement, string>();

/** Remember a host's raw source for a later lazy Raw view. Called by mount() on the
 *  successful render path (the failure path builds its raw <pre> eagerly itself). */
export function registerReaderSource(host: HTMLElement, source: string): void {
  sources.set(host, source);
}

/** Reflect the current mode onto the toggle button's label + aria-label. In reading
 *  mode the control offers "Raw" (the next view); in raw mode it offers "Reading". */
function labelToggle(host: HTMLElement, mode: ReaderMode): void {
  const btn = host.shadowRoot?.querySelector<HTMLButtonElement>('.peekover-mode-toggle');
  if (!btn) return;
  btn.textContent = mode === 'reading' ? 'Raw' : 'Reading';
  btn.setAttribute(
    'aria-label',
    mode === 'reading' ? 'Show raw markdown source' : 'Show reading view',
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

/** Set the reader's view mode: build the raw view if needed, flip the host attribute
 *  (CSS swaps visibility), and relabel the control. No reparse on any path. */
export function setReaderMode(host: HTMLElement, mode: ReaderMode): void {
  if (mode === 'raw') ensureRawView(host);
  host.setAttribute('data-mode', mode);
  labelToggle(host, mode);
}

/** Flip reading <-> raw. Pure view swap — reader content identity is preserved. */
export function toggleReaderMode(host: HTMLElement): void {
  setReaderMode(host, host.getAttribute('data-mode') === 'raw' ? 'reading' : 'raw');
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
    e.preventDefault();
    toggleReaderMode(host);
  });
}
