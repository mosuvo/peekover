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

// ── Print-media emulation for the browser project (task 6.1) ──────────────────
// Same seam as the two commands above: the in-page `page` API has no `emulateMedia`, and `cdp()`
// is Chromium-only, so this server-side command is the one cross-engine (Chromium AND Firefox)
// way to engage `@media print` — consumed by tests/browser/printMode.browser.test.ts. `null`
// resets to the system default.
const emulatePrintMedia: BrowserCommand<[value: 'print' | 'screen' | null]> = async (
  { page },
  value,
) => {
  await page.emulateMedia({ media: value });
};

// ── The `@page` margin-box fidelity PROBE's render half (task 6.1, D-7, §7-4) ─────────────────
// The CSSOM-parse half of this probe (does the engine even RETAIN the `@top-center`/`@bottom-center`
// nested at-rules) runs entirely in-page — plain `document`/shadow-root `styleSheets` reads, no
// seam needed. This command is for the other half: does the engine's REAL PRINT PIPELINE actually
// PAINT that content on the page. There is no in-page API for that (margin-box content is
// generated print content, never a DOM node `getComputedStyle` can read), so it needs the
// server-side Playwright `page`'s own `pdf()` — which drives the SAME underlying print pipeline
// `window.print()` does (verified this session: Chromium's `page.pdf()` under `emulateMedia({media:
// 'print'})` is print-css-driven exactly like a real print, not a separate renderer).
//
// ★ CHROMIUM-ONLY, AND THE FAILURE IS THE OTHER HALF OF THE FINDING, NOT AN ERROR TO SWALLOW —
// verified this session: Playwright's `page.pdf()` throws `"PDF generation is only supported for
// Headless Chromium"` on Firefox. That message is returned as `error`, not thrown across the
// command boundary, so the test can assert on it and state Firefox's status plainly (the CSSOM-
// parse half above is what actually carries Firefox's part of this probe's verdict).
//
// ★ A FRESH, ISOLATED PAGE — NOT THE `page` THE TEST RUNS IN — same isolation reasoning as
// `probeFileUrlClipboard`/`collectExportDownload` above, but for a DIFFERENT hazard specific to
// this command: verified this session, vitest's browser-mode test runs INSIDE AN IFRAME
// (`location.href` carries its own `iframeId=` query param, `window.top !== window`). `page.pdf()`
// always captures the TOP-LEVEL page — the runner shell wrapping that iframe — never the iframe's
// own document, so calling it on the shared `page` silently produces a one-page PDF of the wrong
// document (measured: a 43,000px-tall real fixture still came back as `pageCount: 1` before this
// fix). The caller therefore serializes ITS OWN rendered DOM (including shadow roots, via
// Declarative Shadow DOM `<template shadowrootmode="open">` — `open`-mode shadow roots only,
// matching `mount.ts`'s own `SHADOW_MODE`) and hands the HTML string across the command boundary;
// this command loads it into a genuinely fresh, top-level page and prints THAT.
//
// Text extraction uses `pdfjs-dist` (a new devDependency, TEST-ONLY — never touches the shipped
// bundle, the manifest, or `permissions: []`; not one of §3.4's "up to two additions", which counts
// PRODUCTION dependencies only) because a Chromium-generated PDF's content streams are not
// grep-able raw bytes (FlateDecode-compressed) — there is no simpler dependency-free route to
// "does this string appear on the rendered page" than a real PDF text-layer reader.
interface PageMarginBoxProbe {
  ok: boolean;
  error: string | null;
  pageCount: number;
  perPageText: string[];
}

const printToPdfAndExtractText: BrowserCommand<[html: string]> = async (
  { page },
  html,
): Promise<PageMarginBoxProbe> => {
  const browser = page.context().browser();
  if (!browser) {
    return { ok: false, error: 'no Playwright Browser — cannot isolate a fresh page', pageCount: 0, perPageText: [] };
  }
  const context = await browser.newContext();
  try {
    const freshPage = await context.newPage();
    await freshPage.setContent(html, { waitUntil: 'load' });
    await freshPage.emulateMedia({ media: 'print' });
    const buf = await freshPage.pdf({ printBackground: true, preferCSSPageSize: true });
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    const perPageText: string[] = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const p = await doc.getPage(i);
      const content = await p.getTextContent();
      const text = content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' ');
      perPageText.push(text);
    }
    return { ok: true, error: null, pageCount: doc.numPages, perPageText };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), pageCount: 0, perPageText: [] };
  } finally {
    await context.close();
  }
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

// ── Shared probe shape for a bare, standalone HTML document — task 2.2's D-3 structural claim ──
// (bodyPosition/bodyBackgroundColor/hostSelectorLiteralPresent/h1Text/consoleErrors, computed
// against a fresh, isolated browser context/page opened on the document, never the runner's own
// page or context — the same isolation `probeFileUrlClipboard` uses and for the same reason).
// `ExportDownloadProbe` below extends this for the real file-download exit.
interface StandaloneRenderProbe {
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
}

// ── THE REAL FILE-DOWNLOAD CODEPATH — task 3.1's own Verify demand ────────────
// D-3's "renders visually equivalent" was already proven at the SERIALIZATION exit by task 2.2's
// own browser test (since superseded by task 3.1's rewrite — see `docs/ai/decisions.md`). Task
// 3.1's own Verify calls that "re-proven at the file-download exit specifically, since a clipboard
// write and a file write are different browser codepaths" — so this drives `exportHtml`'s REAL
// `downloadAs` (a synthetic `<a download>` click over a `blob:` URL, `htmlExport.ts`'s own doc
// comment), captures the resulting Playwright `Download` on the SAME page the click fires on, and
// opens the SAVED FILE bare in a fresh isolated context (a browser test cannot navigate the
// runner's own page to `file://`/a downloaded path).
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
              emulatePrintMedia,
              printToPdfAndExtractText,
              probeFileUrlClipboard,
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
