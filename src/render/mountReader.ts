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

import { mount } from './mount';

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
 */
export function mountReader(): void {
  if (document.querySelector(HOST_TAG)) return;

  const source = readPageSource();
  // Guard (AGENTS.md #5 in spirit): if we cannot read a source, leave the page's
  // own rendering untouched rather than blanking it or guessing. Nothing is hidden
  // yet at this point, so an early return is a full no-op.
  if (!source.trim()) return;

  const host = document.createElement(HOST_TAG);
  // Minimal structural layout only (custom elements default to display:inline) —
  // NOT design tokens; real theming/typography arrives at task 4.1.
  host.style.display = 'block';

  try {
    document.body.appendChild(host);
    mount(source, host);

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
  } catch (err) {
    // Never-blank invariant: our host never got to hide anything, so removing it
    // restores the page to exactly what the browser originally showed. Dev-only
    // signal; the user-facing error banner arrives with task 4.2.
    console.warn('[peekover] reader mount failed; leaving original page', err);
    host.remove();
  }
}
