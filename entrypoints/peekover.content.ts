import { defineContentScript, browser } from '#imports';
import { markSettingsResolved, runReader } from '@/src/render/runReader';
import { messagingPort } from '@/src/settings/settingsPort';

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
    // Build the content-script settings port and fire load() at document_start, IN PARALLEL with
    // runReader's injectHideStyle() (plan §1.5). The reader's own origin cannot read the extension
    // DB, so this port reaches settings by messaging the background (entrypoints/background.ts).
    // `load()` is bounded and falls back to Auto, so a dead background can never stall here.
    //
    // TASK 4.1 = MEASUREMENT ONLY. `markSettingsResolved` timestamps the moment the persisted
    // settings are in hand, so scripts/perf-theme-flash.ts can measure it against the reader's
    // first paint and answer the D-2 question: does the persisted theme arrive before the paint
    // (no flash) or after it (a visible flip)? Nothing here CONSUMES the settings yet — the
    // snapshot is still not threaded into mount, and the reveal is not gated. Applying the
    // resolved theme and choosing block-vs-transition is task 4.2, decided by these numbers.
    //
    // Note `load()` never rejects (settingsPort's withTimeout resolves to the default on timeout
    // or failure), so there is no rejection path to handle — the mark always lands.
    const settings = messagingPort((message) => browser.runtime.sendMessage(message));
    void settings.load().then((resolved) => markSettingsResolved(resolved.theme));

    runReader();
  },
});
