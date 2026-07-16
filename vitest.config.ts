import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import type { BrowserCommand } from 'vitest/node';

// ── Reduced-motion media emulation for the browser project (task 3.3) ──────────
// Vitest's in-page `page` API exposes viewport/screenshot/locators but NO
// `emulateMedia`, and `cdp()` is Chromium-only — neither can toggle
// `prefers-reduced-motion` across BOTH engines. The Playwright provider augments
// the browser-command context with the real Playwright `page`, so this thin
// server-side command is the one cross-engine (Chromium AND Firefox) way to
// emulate the media query. Consumed only by tests/browser/tocScroll.browser.test.ts
// to prove TOC-nav scrolls instantly under reduce / smooth without; a no-op for
// every other browser test. `null` resets to the system default.
const emulateReducedMotion: BrowserCommand<[value: 'reduce' | 'no-preference' | null]> = async (
  { page },
  value,
) => {
  await page.emulateMedia({ reducedMotion: value });
};

// Two Vitest projects, run independently:
//
//   pnpm test          -> vitest run --project unit     (fast, jsdom/node)
//   pnpm test:browser  -> vitest run --project browser  (real Chromium + Firefox)
//
// Splitting them keeps the everyday suite fast and free of a browser toolchain,
// while the security-critical sanitize pass ALSO runs against real engine parsing.
// This exists because jsdom's HTML parser diverges from real browsers on mXSS
// (SVG/MathML foreign content, template/noscript reparsing) — a payload inert
// under jsdom is not proof it is inert in Chrome/Firefox (decisions.md 2026-07-14
// "Security tests run in jsdom; add an in-browser sanitize check at the golden/e2e
// milestone").
export default defineConfig({
  test: {
    projects: [
      {
        // unit — the pre-existing suite, behavior unchanged: the default node
        // environment with per-file `// @vitest-environment jsdom` pragmas deciding
        // which tests get a DOM. It must NOT pick up the real-browser tests under
        // tests/browser/ (they only run in the `browser` project below).
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
          exclude: ['tests/browser/**', '**/node_modules/**'],
        },
      },
      {
        // browser — the scheduled in-browser mXSS re-check: the SAME sanitize()
        // run against real engine parsing in headless Chromium and Firefox.
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // Custom cross-engine commands callable from browser tests via
            // `commands` from 'vitest/browser' (see emulateReducedMotion above).
            commands: { emulateReducedMotion },
            instances: [
              { browser: 'chromium' },
              { browser: 'firefox' },
            ],
          },
        },
      },
    ],
  },
});
