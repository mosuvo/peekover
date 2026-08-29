import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import type { BrowserCommand } from 'vitest/node';
import type { Page, Download } from 'playwright';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

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

// ── A REAL `file://` DOCUMENT, for D-10's clipboard residual (008 task 4.2) ───
// The content script runs in the PAGE's context, and one of its two document
// classes is `file://`, whose secure-context status MDN itself hedges ("the same
// is GENERALLY true for file:// URLs"). "Generally" is not a contract, so the
// answer is measured rather than argued — and it can only be measured in a real
// `file://` document.
//
// ★ WHY THIS NEEDS THE SERVER SIDE AT ALL, which is the whole reason the seam
// exists: a browser test runs IN the page, at the runner's `http://localhost`
// origin, and BOTH engines refuse to navigate web content to a `file://` URL
// (this repo already carries the finding — watchContentWiring.browser.test.ts:24,
// "the harness ... cannot serve a `file://`"). An iframe is blocked the same way.
// So there is no in-page route to a real `file://` document, and a SIMULATED one
// — stubbing `isSecureContext`, faking the origin — would prove nothing about the
// surface actually under question. Only the driver can navigate there, and the
// Playwright `page` this provider hands the command is the only cross-engine
// (Chromium AND Firefox) way to reach it. `cdp()` is Chromium-only and would have
// to navigate the test page itself, destroying the runner.
//
// ★ THE FIXTURE IS A RAW `.md` FILE, not an `.html` one, because that IS the
// content-script document class: the browser renders the bytes into a single
// `<pre>`, which is exactly what `readPageSource()` reads. `preCount` is returned
// so the test can assert the harness really landed on that document shape rather
// than on a download or an error page.
//
// ★ IT NEVER TOUCHES THE RUNNER'S OWN PAGE OR CONTEXT. Both arms run in a
// FRESHLY CREATED browser context, so the consent this grants cannot leak into
// tableCopy.browser.test.ts's `prompt` pin (a leak of exactly that shape is a
// finding already carried in that file's own header). The contexts are closed in
// a `finally`.
const FILE_URL_DOC = ['# Report', '', '| dept | n |', '| --- | --- |', '| eng | 10 |', ''].join(
  '\n',
);

interface ClipboardWriteOutcome {
  /** 'resolved', or the rejection's own `name: message`. */
  outcome: string;
  /** The DOMException name a rejection carried — the failure MODE, comparable across origins. */
  errorName: string | null;
  /** What the clipboard held afterwards, when it could be read back at all. */
  readBack: string | null;
}

interface FileUrlClipboardProbe {
  url: string;
  origin: string;
  isSecureContext: boolean;
  hasClipboard: boolean;
  writeTextType: string;
  /** The raw-`.md` document really rendered as the browser's single `<pre>`. */
  preCount: number;
  /** The first bytes of that `<pre>` — the harness landed on OUR file, not an error page. */
  sourceStart: string;
  /** Arm A: a real trusted click, nothing granted to anybody. */
  noConsent: ClipboardWriteOutcome;
  /** Arm B: the same click with the BROWSER CONSENT granted (a user consent, never a manifest key). */
  withConsent: ClipboardWriteOutcome & { grant: 'granted' | 'unsupported' };
}

/** The text the probe writes, and reads back to prove the write really landed. */
const PROBE_TEXT = 'PEEKOVER-FILE-PROBE';

/**
 * Runs INSIDE the `file://` page: arm a `click` listener on the document, then let a REAL mouse
 * click fire it, so the write carries the transient activation both engines require.
 *
 * ★ NO INJECTED ELEMENT AND NO LOCATOR — MEASURED. The first shape of this probe appended a
 * `<button>` and clicked it by id; on the browser's plain-text `.md` document that click never
 * resolved and the command timed out. The document the engines build for a raw text resource is
 * not an authored one, and nothing here needs it to be: a listener on `document` plus a real
 * `mouse.click` is the same trusted activation with nothing to find first.
 *
 * ★ AND NO ARGUMENT IS PASSED ACROSS THE BOUNDARY — the constant is inlined, so this is a plain
 * expression Playwright evaluates the same way in both engines rather than a stringified function
 * it has to recognise as callable.
 */
const clipboardProbeExpression = (): string => `(() => {
  window.__peekoverProbeDone = new Promise((resolve) => {
    document.addEventListener('click', async () => {
      const r = { outcome: 'resolved', errorName: null, readBack: null };
      try {
        await navigator.clipboard.writeText(${JSON.stringify(PROBE_TEXT)});
      } catch (e) {
        r.outcome = e.name + ': ' + e.message;
        r.errorName = e.name;
      }
      try { r.readBack = await navigator.clipboard.readText(); } catch { r.readBack = null; }
      resolve(r);
    }, { once: true });
  });
  return true;
})()`;

const probeFileUrlClipboard: BrowserCommand<[]> = async ({ page }): Promise<FileUrlClipboardProbe> => {
  const browser = page.context().browser();
  if (!browser) throw new Error('no Playwright Browser — the file:// probe cannot isolate a context');

  const dir = mkdtempSync(join(tmpdir(), 'peekover-file-probe-'));
  const doc = join(dir, 'report.md');
  writeFileSync(doc, FILE_URL_DOC, 'utf8');
  const url = pathToFileURL(doc).href;

  /** One arm: a fresh context, a real navigation, a real click. `grant` is attempted only if asked. */
  const runArm = async (grant: boolean): Promise<ClipboardWriteOutcome & { grant: string }> => {
    const context = await browser.newContext();
    let granted: 'granted' | 'unsupported' = 'unsupported';
    try {
      if (grant) {
        try {
          await context.grantPermissions(['clipboard-read', 'clipboard-write']);
          granted = 'granted';
        } catch {
          // Gecko has no `clipboard-write` PermissionName to grant — that IS the finding,
          // not an obstacle, and the arm still runs on the gesture alone.
          granted = 'unsupported';
        }
      }
      const probe = await context.newPage();
      await probe.goto(url);
      const armed = await probe.evaluate(clipboardProbeExpression());
      if (armed !== true) throw new Error('the file:// probe failed to arm its click listener');
      await probe.mouse.click(40, 40);
      const result = (await probe.evaluate(
        'window.__peekoverProbeDone',
      )) as ClipboardWriteOutcome;
      return { ...result, grant: granted };
    } finally {
      await context.close();
    }
  };

  try {
    const context = await browser.newContext();
    let shape: Omit<FileUrlClipboardProbe, 'noConsent' | 'withConsent'>;
    try {
      const probe = await context.newPage();
      await probe.goto(url);
      shape = (await probe.evaluate(`({
        url: location.href,
        origin: location.origin,
        isSecureContext: window.isSecureContext,
        hasClipboard: 'clipboard' in navigator,
        writeTextType: typeof navigator.clipboard?.writeText,
        preCount: document.querySelectorAll('pre').length,
        sourceStart: (document.body?.textContent ?? '').slice(0, 8),
      })`)) as Omit<FileUrlClipboardProbe, 'noConsent' | 'withConsent'>;
    } finally {
      await context.close();
    }
    const noConsent = await runArm(false);
    const withConsent = await runArm(true);
    return {
      ...shape,
      noConsent,
      withConsent: withConsent as ClipboardWriteOutcome & { grant: 'granted' | 'unsupported' },
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

// ── A REAL, BARE, STANDALONE HTML DOCUMENT — task 2.2's D-3 structural claim ──
// "Opened standalone (no extension loaded, a bare `file://` … document)" cannot be simulated
// in-page for the same reason the clipboard `file://` probe above cannot: a browser test runs
// INSIDE the vitest browser-mode page, at its own `http://localhost` runner origin, and neither
// engine will navigate that page to `file://` (the standing finding this file already carries).
// So this command takes an ALREADY-SERIALIZED standalone document string (built in-page, by the
// real `serializeReaderDocument`/`wrapInStandaloneDocument`, against a real mounted reader —
// only the "open it bare" half needs the server side), writes it to a temp `.html` file, and
// opens it in a FRESH, isolated browser context/page — never the runner's own page or context,
// the same isolation `probeFileUrlClipboard` uses and for the same reason.
interface StandaloneRenderProbe {
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
}

const renderStandaloneDocument: BrowserCommand<[html: string]> = async (
  { page },
  html,
): Promise<StandaloneRenderProbe> => {
  const browser = page.context().browser();
  if (!browser) throw new Error('no Playwright Browser — the standalone-document probe cannot isolate a context');

  const dir = mkdtempSync(join(tmpdir(), 'peekover-standalone-export-'));
  const file = join(dir, 'export.html');
  writeFileSync(file, html, 'utf8');
  const url = pathToFileURL(file).href;

  const context = await browser.newContext();
  try {
    const probe = await context.newPage();
    const consoleErrors: string[] = [];
    probe.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    probe.on('pageerror', (err) => consoleErrors.push(String(err)));
    await probe.goto(url);
    const result = (await probe.evaluate(`({
      bodyPosition: getComputedStyle(document.body).position,
      bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
      hostSelectorLiteralPresent: document.documentElement.outerHTML.includes(':host'),
      h1Text: document.querySelector('h1')?.textContent ?? null,
    })`)) as Omit<StandaloneRenderProbe, 'consoleErrors'>;
    return { ...result, consoleErrors };
  } finally {
    await context.close();
    rmSync(dir, { recursive: true, force: true });
  }
};

// ── THE REAL FILE-DOWNLOAD CODEPATH — task 3.1's own Verify demand ────────────
// D-3's "renders visually equivalent" was already proven above at the SERIALIZATION exit
// (`renderStandaloneDocument`, task 2.2). Task 3.1's own Verify calls that "re-proven at the
// file-download exit specifically, since a clipboard write and a file write are different browser
// codepaths" — so this drives `exportHtml`'s REAL `downloadAs` (a synthetic `<a download>` click
// over a `blob:` URL, `htmlExport.ts`'s own doc comment), captures the resulting Playwright
// `Download` on the SAME page the click fires on, and opens the SAVED FILE bare in a fresh
// isolated context — same isolation as `renderStandaloneDocument`, for the same reason (a browser
// test cannot navigate the runner's own page to `file://`/a downloaded path).
//
// Two commands, not one, because arming a `page.waitForEvent('download')` listener and the
// synchronous in-page click that satisfies it are necessarily different steps: the browser test
// (running IN-PAGE, so it can call the real `exportHtml` import directly — the actual codepath,
// not a re-implementation here) arms the listener first, then calls `exportHtml()` in-page, then
// collects the result. `pendingDownloads` is keyed by the Playwright `Page` object itself (stable
// across both command calls within one test), not a module-level singleton, so two engine
// instances (Chromium + Firefox) running this same file never share state.
const pendingDownloads = new WeakMap<Page, Promise<Download>>();

const armExportDownload: BrowserCommand<[]> = async ({ page }) => {
  pendingDownloads.set(page, page.waitForEvent('download'));
  return true;
};

interface ExportDownloadProbe extends StandaloneRenderProbe {
  suggestedFilename: string;
  /** The downloaded file's own raw HTML text — for structural assertions (e.g. the local-`<img>`
   *  passthrough) the computed-style probe above can't express. */
  html: string;
}

const collectExportDownload: BrowserCommand<[]> = async ({ page }): Promise<ExportDownloadProbe> => {
  const pending = pendingDownloads.get(page);
  if (!pending) {
    throw new Error('collectExportDownload: no download was armed — call armExportDownload() first');
  }
  pendingDownloads.delete(page);
  const download = await pending;

  const browser = page.context().browser();
  if (!browser) throw new Error('no Playwright Browser — the export-download probe cannot isolate a context');

  const suggestedFilename = download.suggestedFilename();
  const dir = mkdtempSync(join(tmpdir(), 'peekover-html-export-'));
  const savePath = join(dir, suggestedFilename);
  await download.saveAs(savePath);
  const html = readFileSync(savePath, 'utf8');
  const url = pathToFileURL(savePath).href;

  const context = await browser.newContext();
  try {
    const probe = await context.newPage();
    const consoleErrors: string[] = [];
    probe.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    probe.on('pageerror', (err) => consoleErrors.push(String(err)));
    await probe.goto(url);
    const result = (await probe.evaluate(`({
      bodyPosition: getComputedStyle(document.body).position,
      bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
      hostSelectorLiteralPresent: document.documentElement.outerHTML.includes(':host'),
      h1Text: document.querySelector('h1')?.textContent ?? null,
    })`)) as Omit<StandaloneRenderProbe, 'consoleErrors'>;
    return { ...result, consoleErrors, suggestedFilename, html };
  } finally {
    await context.close();
    rmSync(dir, { recursive: true, force: true });
  }
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
            commands: {
              emulateReducedMotion,
              emulateColorScheme,
              probeFileUrlClipboard,
              renderStandaloneDocument,
              armExportDownload,
              collectExportDownload,
            },
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
