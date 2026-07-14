// runReader — the content-script orchestration that lets the reader mount at
// `document_start` WITHOUT the user ever seeing the browser's raw-text render flash
// past (and without paying its layout cost). Extracted from the entrypoint so this
// timing-and-visibility logic is unit-testable in jsdom; the entrypoint (which binds
// WXT's '#imports') just calls runReader().
//
// Why document_start + hide-the-raw (see docs/ai/decisions.md): on a 1 MB file:// doc
// the browser spends ~1 s laying out the raw <pre>, and the old document_idle script
// only ran AFTER that. Running at document_start and setting the raw container to
// `display:none` before it can paint removes that layout cost entirely (display:none,
// not visibility:hidden — the latter still lays out). Programmatic injection (the
// route simov/markdown-viewer takes) would need `scripting` + host_permissions; our
// permissions:[] model is settled ground truth, so this is the only path open to us.
//
// The invariant that outranks the perf target (AGENTS.md #5): the user must NEVER be
// left staring at a blank page. Hiding the raw text opens a window where the page is
// hidden and the reader is not up yet — so every path out of that window ends by
// revealing something:
//   - detection miss ..... we never hide; the page is completely untouched.
//   - mount success ...... mountReader has already hidden the originals inline and put
//                          the reader on screen; we drop the hide <style> (its job done).
//   - mount failure ...... mountReader restored the originals (or never hid them); we
//                          drop the hide <style> so the raw text is visible.
//   - unforeseen throw ... a finally still drops the hide <style> (raw text visible).
//   - mount never runs ... a safety timer + the window `load` event drop it anyway.
// reveal() is idempotent and once-only, so these overlap harmlessly.

// Relative (not '@/…') import: the vitest runner resolves no '@/' alias, and this
// module is exercised directly by runReader.test.ts.
import { isRenderableContext } from '../detect/isRenderableContext';
import { mountReader } from './mountReader';

/** id of the injected hide <style>, so we can find and remove exactly it. */
export const HIDE_STYLE_ID = 'peekover-hide-raw';

/**
 * Safety backstop: if the reader has not mounted within this many ms, reveal the raw
 * text anyway. 3 s is deliberately generous over the observed worst case (~1.2 s
 * first-paint on the 1 MB fixture, task 5.2) so it never pre-empts a legitimately slow
 * mount, yet short enough that a user is never left in front of a hidden page for long
 * if something we did not foresee goes wrong. The window `load` event is a second,
 * usually-earlier backstop (see runReader).
 */
export const SAFETY_UNHIDE_MS = 3000;

/**
 * The hide rule. `display:none` (NOT visibility:hidden) is the whole point: it keeps
 * the raw <pre> out of layout, which is where the ~1 s cost lives. Scoped to body's
 * non-host children so our own appended <peekover-root> reader is never hidden by it,
 * and `!important` so a page stylesheet cannot override the hide before we mount.
 */
const HIDE_CSS = 'body > :not(peekover-root){display:none !important}';

/**
 * Synchronously hide the raw text. Called at document_start, where <head>/<body> may
 * not exist yet but documentElement (<html>) does — a <style> parented to <html> still
 * applies in both Chrome and Firefox. Idempotent, and a no-op if documentElement is
 * somehow absent (then we simply never hide, and the page renders raw as before —
 * never-blank preserved).
 */
export function injectHideStyle(): void {
  const root = document.documentElement;
  if (!root) return;
  if (document.getElementById(HIDE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HIDE_STYLE_ID;
  style.textContent = HIDE_CSS;
  root.appendChild(style);
}

/** Remove the hide <style> if present. Idempotent. getElementById finds it even though
 *  it lives under <html> rather than in <body>. */
export function removeHideStyle(): void {
  document.getElementById(HIDE_STYLE_ID)?.remove();
}

/** Injectable seams so the orchestration is unit-testable without a real navigation. */
export interface RunReaderOptions {
  /** Context gate (defaults to isRenderableContext against location.href). */
  isRenderable?: (url: string) => boolean;
  /** The page-mutating mount step (defaults to mountReader). */
  mount?: () => void;
}

/**
 * Orchestrate the document_start reader:
 *   1. Detect FIRST. On a miss, return without touching the DOM at all.
 *   2. Hide SECOND — synchronously, in the same task, before yielding, so the browser
 *      cannot paint the raw <pre>.
 *   3. Arm the safety backstops (timer + window `load`) that reveal the raw text if the
 *      mount never happens.
 *   4. Wait for the COMPLETE source (DOMContentLoaded) — reading a partially-streamed
 *      <pre> mid-parse would silently truncate a large document — then mount.
 *   5. However mount resolves, reveal(): drop the hide <style>. On success the originals
 *      are already inline-hidden by mountReader and the reader is up, so this just hands
 *      visibility control back to mount/the toggle; on failure it makes the raw text
 *      visible. A finally guarantees this even on an unforeseen throw.
 */
export function runReader(options: RunReaderOptions = {}): void {
  const isRenderable = options.isRenderable ?? isRenderableContext;
  const mount = options.mount ?? mountReader;

  // 1. Detect first, hide second — an untouched page on a miss.
  if (!isRenderable(location.href)) return;
  injectHideStyle();

  let settled = false;

  // The single, idempotent exit. Cancels the backstops and drops the hide <style>.
  // Guarded so success, failure, the timer and `load` can all call it and only the
  // first wins — no double-toggle, no fighting the toggle's own post-mount control.
  // (`timer` is referenced through this closure; it is initialized just below, before
  // reveal can ever run.)
  const reveal = (): void => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    window.removeEventListener('load', reveal);
    removeHideStyle();
  };

  // Mount, then reveal no matter what. mountReader already keeps the never-blank
  // invariant internally (renders before hiding originals; restores them on failure);
  // the finally is the belt-and-suspenders drop of the hide <style> for anything we did
  // not foresee, so a throw here can never leave the page hidden with nothing shown.
  const mountThenReveal = (): void => {
    try {
      mount();
    } finally {
      reveal();
    }
  };

  // 3. Backstops: whichever fires first reveals the raw text if the mount never ran.
  const timer = setTimeout(reveal, SAFETY_UNHIDE_MS);
  window.addEventListener('load', reveal);

  // 4. Mount once the source is complete. At document_start readyState is 'loading', so
  //    we wait for DOMContentLoaded; if we somehow ran later, mount immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountThenReveal, { once: true });
  } else {
    mountThenReveal();
  }
}
