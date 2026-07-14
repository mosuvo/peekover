import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

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
