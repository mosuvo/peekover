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

// ── OS color-scheme emulation for the browser project (task 3.2) ──────────────
// Same seam, same reason: a PAGE cannot fake `prefers-color-scheme` — it is an OS/browser
// setting, and no in-page API sets it. Driving it needs the browser control protocol, which
// only the server-side Playwright `page` reaches. This is what makes the spec §3.4 staleness
// property (an OS flip re-themes an ALREADY-OPEN app-page reader) testable as a REAL OS flip
// rather than a hand-fired signal at the seam: Playwright's emulation dispatches a genuine
// `change` on the live `matchMedia` list in BOTH Chromium and Firefox (verified — see
// themeRuntime.browser.test.ts's harness-sanity test, which fails loudly if an engine ever
// stops delivering it, so this can never degrade into a silently vacuous suite).
// `null` resets to the system default.
const emulateColorScheme: BrowserCommand<[value: 'light' | 'dark' | null]> = async (
  { page },
  value,
) => {
  await page.emulateMedia({ colorScheme: value });
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
          // ── Run the browser files SERIALLY (task 4.5) ──────────────────────────────
          // Root-caused at spec-005 group 4 (docs/ai/progress.md, tasks.md 4.5): the
          // in-browser files share ONE browser window per engine, and its VIEWPORT is a
          // window-global property. When two files run concurrently, one file's
          // `page.viewport()` resize (its full-page `:host{position:fixed;inset:0}` scroll
          // box) lands under another file's scroll-geometry measurement — producing a
          // PLAUSIBLE WRONG POSITION (`expected 0 to be greater than 0`), never an error.
          // Signature: ALWAYS Firefox, ALWAYS the full-page surface, ALWAYS a geometry
          // assertion — the same silent-wrong-answer class as 003's mis-resolved scroll root.
          //
          // This is a HARNESS isolation defect, not a product one, and the proof is that
          // `--no-file-parallelism` fixes it WHILE THE SAME TEST STILL RESIZES THE SAME
          // VIEWPORT: the variable that flips pass→fail is cross-file concurrency, not the
          // resize. Measured: parallel ~40% of runs fail (~26s); serial 0 failures across
          // repeated runs (~62s). A narrower per-instance serialization (Firefox only)
          // was measured too and saved ~5s (~57s) for an asymmetric, harder-to-justify
          // config — not worth it while the whole suite runs in under a minute. The +36s
          // is dev/CI wall-clock only; `pnpm test:browser` time is not a shipped metric.
          // NO assertion was weakened — every one of these geometry checks is a real,
          // red-first-proven guard, and the failure is the instrument, not the code.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // Custom cross-engine commands callable from browser tests via
            // `commands` from 'vitest/browser' (see emulateReducedMotion above).
            commands: { emulateReducedMotion, emulateColorScheme },
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
