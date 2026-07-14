import { defineContentScript } from '#imports';
import { isRenderableContext } from '@/src/detect/isRenderableContext';
import { mount } from '@/src/render/mount';

// Peekover content script. The manifest `matches` below are a COARSE, host-level
// gate (they decide where the browser injects at all); `isRenderableContext` is
// the authoritative in-script gate that narrows to actual markdown resources.
// Every pattern here is justified in docs/trust/PERMISSIONS.md (AGENTS.md #4).
//
// Task 3.3: in a matched context we read the page's raw markdown source and mount
// the rendered, sanitized document into a shadow root — replacing the old
// hello-shell marker. Still M1: UNSTYLED (design tokens land at 4.1) and no Raw
// toggle yet (4.2). The reader is the proven parse -> sanitize -> mount pipeline.

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
function readPageSource(): string {
  const pre = document.body?.querySelector('pre');
  if (pre?.textContent) return pre.textContent;
  // Fallback for a text page the browser did not wrap in <pre>.
  return document.body?.innerText ?? '';
}

/**
 * Replace the browser's raw-text rendering with the Peekover reader. Idempotent:
 * a second call is a no-op (the host already exists). We HIDE the original page
 * nodes rather than remove them so task 4.2's Raw toggle can reveal them again
 * without a reload; the reader mounts into its own shadow-root host appended last.
 */
function mountReader(): void {
  if (document.querySelector(HOST_TAG)) return;

  const source = readPageSource();
  // Guard (AGENTS.md #5 in spirit): if we cannot read a source, leave the page's
  // own rendering untouched rather than blanking it or guessing.
  if (!source.trim()) return;

  for (const child of Array.from(document.body.children)) {
    (child as HTMLElement).style.display = 'none';
  }

  const host = document.createElement(HOST_TAG);
  // Minimal structural layout only (custom elements default to display:inline) —
  // NOT design tokens; real theming/typography arrives at task 4.1.
  host.style.display = 'block';
  document.body.appendChild(host);

  mount(source, host);
}

export default defineContentScript({
  matches: [
    // (a) Local markdown files opened via file:// — one pattern per extension.
    'file:///*.md',
    'file:///*.mkd',
    'file:///*.mdx',
    'file:///*.markdown',
    'file:///*.mdown',
    'file:///*.mkdn',
    'file:///*.mdwn',
    'file:///*.mdtxt',
    'file:///*.mdtext',
    // (b) Named raw-content hosts (exact host).
    'https://raw.githubusercontent.com/*',
    'https://gist.githubusercontent.com/*',
    // (b) Path-scoped raw views so we do not inject across the whole site.
    'https://gitlab.com/*/-/raw/*',
    'https://bitbucket.org/*/raw/*',
  ],
  runAt: 'document_idle',
  main() {
    // Authoritative gate: on any non-markdown context, do literally nothing.
    if (!isRenderableContext(location.href)) return;
    mountReader();
  },
});
