import { defineContentScript } from '#imports';
import { runReader } from '@/src/render/runReader';

// Peekover content script. The manifest `matches` below are a COARSE, host-level
// gate (they decide where the browser injects at all); `isRenderableContext` is
// the authoritative in-script gate that narrows to actual markdown resources.
// Every pattern here is justified in docs/trust/PERMISSIONS.md (AGENTS.md #4).
//
// Runs at document_start with a hidden-raw strategy: runReader detects the context,
// hides the browser's raw <pre> before it can paint (skipping its ~1 s layout cost
// on large docs and the raw-text flash), waits for the complete source, then mounts
// the reader — and always reveals the raw text again if the mount cannot succeed, so
// the page is never left blank (AGENTS.md #5). The timing/visibility orchestration
// lives in src/render/runReader.ts and the page-mutating mount core in
// src/render/mountReader.ts, both extracted from here so they are unit-testable; the
// entrypoint only wires WXT's config to runReader().

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
  // document_start (was document_idle): hide the raw <pre> before the browser paints
  // it, then mount at DOMContentLoaded. runReader owns the never-blank guarantees.
  runAt: 'document_start',
  main() {
    runReader();
  },
});
