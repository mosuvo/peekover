// mountReader — the content-script composition that swaps the browser's raw-text
// rendering for the Peekover reader. Extracted from the entrypoint so this
// page-mutating core is unit-testable in jsdom; the entrypoint (which binds WXT's
// '#imports') just gates on context and invokes this.
//
// The pure parse -> sanitize -> shadow mount lives in ./mount. Here we deal with
// the HOST page: reading its raw markdown source and hiding its original nodes.
//
// AGENTS.md #5 (never a blank page) is the whole reason this module orders things
// the way it does. mount() already degrades a failed render to raw text inside its
// own shadow root — but mount() cannot see the step that hides the ORIGINAL page.
// So mountReader renders into the shadow host and confirms it produced visible
// content FIRST, and only then hides the page's original nodes. On any throw — or
// an empty render — it tears our host back out and leaves the browser's own
// rendering exactly as it was. The invariant: the user is never left with the
// original page hidden AND nothing valid shown.

import { mount, stopRestTracking } from './mount';
import { enhanceTables } from './tableEnhancer';

/** The custom-element tag whose shadow root hosts the rendered reader. */
const HOST_TAG = 'peekover-root';

/**
 * Read the page's RAW markdown source.
 *
 * When the browser navigates to a raw markdown resource (a `file://` .md file or
 * a raw-host URL served as text/plain), it does not build a rich DOM — it renders
 * the file's bytes as plain text, virtually always wrapped in a single `<pre>`.
 * So the raw source is the TEXT of that `<pre>`.
 *
 * We read `textContent` (or, without a <pre>, `innerText`), NEVER `innerHTML`:
 * innerHTML would hand us HTML-escaped entities (`&lt;` for `<`) and any DOM the
 * browser synthesized, corrupting the markdown before it reaches the parser.
 * `<pre>` textContent preserves newlines and whitespace exactly, which markdown
 * is whitespace-sensitive about.
 *
 * @returns The raw markdown text, or '' if no source could be read.
 */
export function readPageSource(): string {
  const pre = document.body?.querySelector('pre');
  if (pre?.textContent) return pre.textContent;
  // Fallback for a text page the browser did not wrap in <pre>.
  return document.body?.innerText ?? '';
}

/**
 * Replace the browser's raw-text rendering with the Peekover reader. Idempotent:
 * a second call is a no-op (the host already exists). We HIDE the original page
 * nodes (`display:none`) rather than remove them so task 4.2's Raw toggle can
 * reveal them again without a reload; the reader mounts into its own shadow-root
 * host appended last.
 *
 * Never-blank ordering (AGENTS.md #5) on the REAL injection path: append the host
 * and render into it FIRST, confirm it produced non-empty shadow content, and only
 * THEN hide the original nodes. A failure — a throw or an empty render — never
 * reaches the hide step, so it cannot leave the page hidden with nothing shown. On
 * failure we remove our host, which fully restores the browser's own rendering.
 *
 * Return value — did this call COMMIT a reader host? The document_start orchestrator
 * (runReader) needs to tell "a source wasn't ready yet, try again later" apart from
 * "a reader is up, hand off visibility": the former must keep the raw hidden and the
 * backstops armed; committing reveal-and-teardown on the former is the Gecko timing
 * bug (see docs/ai/decisions.md). So:
 *   - `true`  — a reader host is committed: a fresh successful mount, the degraded
 *               raw-fallback that mount() itself renders (non-empty shadow), OR the
 *               idempotent already-mounted early return (re-entry over a live reader).
 *   - `false` — ONLY the no-source no-op: no `<pre>`/text to read yet, page untouched.
 * mountReader stays silent about `false` — runReader owns any breadcrumb. (A deeper
 * render failure — mount() throwing past its own fallback, or an empty shadow — also
 * returns `false` after restoring the page; runReader's floor then reveals the raw.)
 */
export function mountReader(): boolean {
  // Re-entry over a live reader counts as committed — visibility is already ours.
  if (document.querySelector(HOST_TAG)) return true;

  const source = readPageSource();
  // Guard (AGENTS.md #5 in spirit): if we cannot read a source, leave the page's
  // own rendering untouched rather than blanking it or guessing. Nothing is hidden
  // yet at this point, so an early return is a full no-op — and NOT committed, so
  // the caller keeps waiting for a source rather than tearing the mount path down.
  if (!source.trim()) return false;

  const host = document.createElement(HOST_TAG);
  // Minimal structural layout only (custom elements default to display:inline) —
  // NOT design tokens; real theming/typography arrives at task 4.1.
  host.style.display = 'block';

  try {
    document.body.appendChild(host);
    mount(source, host);
    // ── 008 D-6 SITE 3 — the content script's INITIAL mount ─────────────────
    // The table toolbar does not come through mount()'s one seam the way the
    // badge and the pills do: D-6 gives it four EXPLICIT call sites, and this
    // is the third. `enhanceTables` and NOTHING ELSE — no shared enhance(host),
    // no registry. `readerPane`'s site runs enhanceDiagrams first; this one
    // must never learn that module exists, because 007's fence IS a static walk
    // of this graph and a shared seam (or worse, a runtime registration) would
    // put mermaid's 3.3 MB behind the gated path. The asymmetry between the two
    // surfaces' call sites is that fence expressed in imports.
    //
    // D-7 — and the reason the enhancer is TOTAL rather than this line being
    // wrapped: we are INSIDE the try below, whose catch removes the host. A
    // throw out of an enhancement would tear down a reader that had already
    // rendered the document correctly, which is the one failure this whole
    // module is ordered to prevent. `enhanceTables` takes that guarantee into
    // itself (tableEnhancer.ts's outer boundary) so no call site has to.
    // Site 4 — contentWatch's re-render — lands with this one or the toolbar
    // vanishes the first time a watching agent rewrites the file.
    enhanceTables(host);

    // mount() degrades to a non-empty raw <pre> even on a failed render, so an
    // empty shadow here means something more fundamental broke. Treat it as a
    // failure and bail rather than hiding the page behind an empty reader.
    if (!host.shadowRoot?.childNodes.length) {
      throw new Error('reader produced no visible content');
    }

    // Only now — with visible content committed — hide the originals. Skip our own
    // host so we do not hide what we just mounted.
    for (const child of Array.from(document.body.children)) {
      if (child === host) continue;
      (child as HTMLElement).style.display = 'none';
    }
    return true;
  } catch (err) {
    // Never-blank invariant: our host never got to hide anything, so removing it
    // restores the page to exactly what the browser originally showed. Dev-only
    // signal; the user-facing error banner arrives with task 4.2. Not committed —
    // the caller's never-blank floor (timer / final attempt) reveals the raw text.
    console.warn('[peekover] reader mount failed; leaving original page', err);
    stopRestTracking(host); // 8.1i (f): the band's frame and listeners go with the reader
    host.remove();
    return false;
  }
}
