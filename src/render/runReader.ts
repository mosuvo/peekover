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
//   - mount commit ....... mountReader has already hidden the originals inline and put
//                          the reader on screen; we drop the hide <style> (its job done).
//   - source not ready ... a mount attempt that finds no readable source yet is NOT a
//                          failure: we keep the hide + backstops and retry at `load`.
//                          (Committing reveal-and-teardown here was the Gecko bug.)
//   - final give-up ...... the LAST attempt still finds no source: drop the hide <style>
//                          (raw visible) + a console breadcrumb.
//   - unforeseen throw ... the catch drops the hide <style> (raw visible), then rethrows.
//   - mount never runs ... a safety timer floor drops the hide <style> anyway — WITHOUT
//                          disarming the attempts, so a late mount can still take over.
// finish() is idempotent and once-only, so the real-outcome paths overlap harmlessly;
// the safety timer only ever reveals raw, never commits.

// Relative (not '@/…') import: the vitest runner resolves no '@/' alias, and this
// module is exercised directly by runReader.test.ts.
import { isRenderableContext } from '../detect/isRenderableContext';
import { mountReader } from './mountReader';
// The identity seam (008 task 1.4, D-1/D-2). Both modules import NOTHING and hold no state beyond
// a string, so neither adds an edge the 007 content-script fence has to reason about — that is the
// property `docIdentity.ts`'s header argues for itself, and it is why this surface can name its
// document at all. `agentFile` is already on this graph through `mount -> agentBadge`; this adds an
// edge to it, not a module.
import { registerDocIdentity } from './docIdentity';
import { basenameOf } from './agentFile';

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
  /** The page-mutating mount step (defaults to mountReader). Returns whether it
   *  COMMITTED a reader host (see mountReader) — `false` means "no source yet". */
  mount?: () => boolean;
}

/**
 * Orchestrate the document_start reader:
 *   1. Detect FIRST. On a miss, return without touching the DOM at all.
 *   2. Hide SECOND — synchronously, in the same task, before yielding, so the browser
 *      cannot paint the raw <pre>.
 *   3. Arm the safety timer — a never-blank FLOOR that reveals the raw text if nothing
 *      has mounted, WITHOUT disarming the mount attempts (a later mount still takes
 *      over; the raw flash in between is an accepted tradeoff, see docs/ai/decisions.md).
 *   4. Try to mount at DOMContentLoaded, and AGAIN at `load`. The source is not always
 *      readable at DOMContentLoaded (Gecko can have the raw <pre> empty until `load`),
 *      so a no-source attempt is NOT a failure — it leaves the hide + backstops in place
 *      and waits. Only a commit hands off, and only the final attempt gives up.
 *   5. On a commit, finish(): cancel the backstops and drop the hide <style>. The
 *      originals are already inline-hidden by mountReader and the reader is up, so this
 *      just hands visibility control off to mount/the toggle.
 *
 * Why commit-aware (the invariant restored here): the OLD code revealed-and-tore-down on
 * EVERY DOMContentLoaded attempt, including a "source wasn't ready yet" no-op — which on
 * Firefox permanently killed the mount path and left raw text forever, silently. So:
 * never commit reveal() on a no-source no-op — only on a real commit, a real throw, or
 * the final backstop (which also leaves a console breadcrumb).
 */
export function runReader(options: RunReaderOptions = {}): void {
  const isRenderable = options.isRenderable ?? isRenderableContext;
  const mount = options.mount ?? mountReader;

  // 1. Detect first, hide second — an untouched page on a miss.
  if (!isRenderable(location.href)) return;

  // 1a. NAME THE DOCUMENT (008 task 1.4, D-1) — the content script's half of the identity seam,
  // and the only place on this surface where a filename exists at all: a content script holds a
  // `location.href` and never a `MarkdownFile`, so the name has to be parsed out of the URL.
  //
  // WHY HERE, precisely:
  //   • AFTER the gate, which has already decided this is a document we render and has already
  //     held and parsed `location.href` for its own purposes. Registering before it would name a
  //     document on a page the reader then leaves completely untouched (the miss contract above).
  //   • BEFORE any mount attempt. `buildAgentBadge` reads the registry at BUILD time inside
  //     `mount()` (reached from `mountReader`), so a name registered after the first mount would
  //     leave that render un-badged — the 005 task 4.7 defect, one chrome over.
  //   • ONCE per document, not per render, and that is sufficient BY DESIGN: the badge re-reads
  //     this registry on every render rather than capturing it (D-1), so a watch re-render on this
  //     surface — `contentWatch.ts`'s controller, which passes no `render` and gets bare `mount` —
  //     rebuilds the badge from the CURRENT name. A name threaded through `MountOptions` would be
  //     dropped outright at that exact call, which is the argument that forced this seam.
  //
  // THROW-SAFE, which AGENTS.md #5 makes load-bearing rather than tidy: a throw on this line would
  // land between `isRenderable` and `injectHideStyle`, i.e. before the hide — so it could not blank
  // the page, but it WOULD abort the mount and leave the raw text unrendered forever. `basenameOf`
  // never throws (it catches both `new URL` and `decodeURIComponent`, returning `''`, which
  // `isAgentFile` then simply declines) and `registerDocIdentity` is one assignment.
  registerDocIdentity(basenameOf(location.href));

  injectHideStyle();

  // Set once a reader host is committed (or we've given up): stops all backstops and
  // further attempts. Distinct from "raw is revealed" — the safety timer can reveal the
  // raw WITHOUT committing, so a slow-but-eventual mount still wins.
  let committed = false;

  const onLoad = (): void => tryMount(true);

  // The single, idempotent hand-off, called only on a real outcome (commit / throw /
  // final give-up). Cancels the backstops and drops the hide <style>; the toggle owns
  // visibility from here. (`timer` is captured through this closure; it is initialized
  // below, before any mount attempt — DOMContentLoaded/load are async, and the else
  // branch's synchronous attempt runs after `timer` is set.)
  const finish = (): void => {
    if (committed) return;
    committed = true;
    clearTimeout(timer);
    window.removeEventListener('load', onLoad);
    removeHideStyle();
  };

  // One mount attempt. `final` = this is the last chance (the `load` attempt, or an
  // already-past-readyState immediate attempt) — a no-source result then gives up with a
  // breadcrumb, rather than waiting for a `load` that has already happened.
  const tryMount = (final: boolean): void => {
    if (committed) return;
    let didCommit: boolean;
    try {
      didCommit = mount();
    } catch (err) {
      // Never-blank over everything: mountReader never throws (it catches internally),
      // so this is the belt-and-suspenders path for an unforeseen throw. Reveal, then
      // stop — the throw surfaces to the caller / the event loop.
      finish();
      throw err;
    }
    if (didCommit) {
      finish(); // reader is up — hand visibility off to mount/the toggle.
      return;
    }
    if (final) {
      // Last attempt, and no source was ever readable. Reveal the raw and leave a light
      // on for the next investigation — a SILENT give-up here is exactly what cost the
      // Gecko-timing bug an investigation.
      finish();
      console.warn('Peekover: no readable source found');
    }
    // else (!didCommit && !final): source not ready yet. Keep the hide + backstops
    // armed and wait for `load` (or the safety floor). This is the bug fix.
  };

  // 3. Safety FLOOR: reveal the raw text if nothing has mounted in time — but do NOT
  //    disarm the mount attempts. A later successful mount still takes over (accepted
  //    returned-flash tradeoff). Only removeHideStyle here; the attempts stay live.
  const timer = setTimeout(() => {
    if (!committed) removeHideStyle();
  }, SAFETY_UNHIDE_MS);
  window.addEventListener('load', onLoad);

  // 4. Attempt at DOMContentLoaded (source may not be ready — not final), and always
  //    again at `load` (final). If we ran past 'loading' already, attempt immediately —
  //    but only 'complete' is final. At 'interactive' `load` is still pending and the
  //    source may not be readable yet (the same Gecko window), so that attempt is NOT
  //    final: a no-source result leaves the hide + backstops armed for the `load` listener.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryMount(false), { once: true });
  } else {
    tryMount(document.readyState === 'complete');
  }
}
