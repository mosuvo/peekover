import { defineContentScript } from '#imports';
import { isRenderableContext } from '@/src/detect/isRenderableContext';
import { mountReader } from '@/src/render/mountReader';

// Peekover content script. The manifest `matches` below are a COARSE, host-level
// gate (they decide where the browser injects at all); `isRenderableContext` is
// the authoritative in-script gate that narrows to actual markdown resources.
// Every pattern here is justified in docs/trust/PERMISSIONS.md (AGENTS.md #4).
//
// The reader composition itself lives in src/render/mountReader.ts (extracted so
// its page-mutating core is unit-testable; the entrypoint only gates + invokes).
// Task 3.3: in a matched context we read the page's raw markdown source and mount
// the rendered, sanitized document into a shadow root — replacing the old
// hello-shell marker. Still M1: UNSTYLED (design tokens land at 4.1) and no Raw
// toggle yet (4.2). The reader is the proven parse -> sanitize -> mount pipeline.

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
