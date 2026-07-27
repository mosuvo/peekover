// scripts/perf-first-paint.ts — task 5.2 measurement gate (NOT wired into CI).
//
// Measures the REAL, in-browser first-paint of the Peekover reader over a
// deterministic huge-document fixture, in headless Chromium driving the actual
// built extension. This is the end-to-end number the pure-pipeline perf test
// (src/render/pipeline.perf.test.ts) deliberately does NOT measure: that test
// times parse+sanitize only, with no shadow-DOM mount, layout, style or paint.
//
// This is a MEASUREMENT task, not an optimization task. If the number misses the
// target we record it honestly with a breakdown; we do NOT touch src/ to chase
// it. Nothing here is asserted in CI — wall-clock gates flake on shared runners,
// so this stays a local, recorded gate (see docs/ai/progress.md).
//
// FIXTURE SIZE (task 5.2b size-sweep). The gate was written pre-measurement for a
// single 1 MB doc; to rescope it honestly against the TYPICAL document we sweep
// several sizes. Pass `--size <value>` to pick the fixture:
//   pnpm perf                 -> default 1 MB (1400 sections, the historical
//                                fixture that pins the golden SHA-256 digest)
//   pnpm perf -- --size 10kb  -> ~10 KB     pnpm perf -- --size 200kb -> ~200 KB
//   pnpm perf -- --size 50kb  -> ~50 KB     pnpm perf -- --size 1mb   -> full 1 MB
// Accepted forms: `10kb` / `50kb` / `200kb`, `1mb` / `full` (both = the default
// 1400-section fixture), or a raw byte count. Non-default sizes derive a section
// count from a deterministic bytes-per-section probe of buildHugeDoc() and report
// the ACTUAL generated size; the default path calls buildHugeDoc() with NO
// argument so the 1 MB fixture stays byte-identical to what the golden digest and
// the prior 5.2/5.2b measurements pin. (`--` separates pnpm's args from ours.)
//
// Runner: `tsx` (package script "perf"). We use tsx rather than Node's native TS
// type-stripping because this file is under tsconfig's `include` and so is type-
// checked by `pnpm lint` (tsc --noEmit). tsc uses moduleResolution:"bundler",
// which resolves EXTENSIONLESS relative imports (./tests/golden/hugeDoc) but
// REJECTS explicit `.ts` import extensions unless `allowImportingTsExtensions` is
// enabled project-wide. Node's native stripping is the opposite — it REQUIRES the
// `.ts` extension in the specifier. tsx resolves the extensionless form at
// runtime, so the same import satisfies both tsc and execution with no config
// change and no new project-wide TS setting. (No lighter already-present runner
// exists: vite-node is not installed as a bin, and native stripping loses lint.)

import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildHugeDoc, HUGE_DOC_SECTIONS } from '../tests/golden/hugeDoc';

// --- Constants ---------------------------------------------------------------

/** Absolute path to the built Chrome MV3 extension Playwright will --load. */
const EXT_DIR = path.resolve('.output', 'chrome-mv3');

/** Total iterations; the FIRST (cold) run is printed but discarded from stats. */
const ITERATIONS = 7;

/**
 * The typical-document acceptance gate from specs/001-core-rendering/spec.md:
 * nav->paint median < 165 ms. This is the bar the rescoped gate holds for docs
 * up to ~50 KB; the 1 MB fixture is measured against its own honest bound (the
 * number lands ~8x over M1's original 150 ms bar — see progress.md / decisions.md
 * 2026-07-14).
 *
 * RE-BASELINED at M6 close from M1's original 150 ms (9.1 human decision, option B —
 * see decisions.md 2026-07-26). The 150 ms bar breached on working-day machines by
 * ~5-8 ms while passing on quiesced ones: the codebase grew ~40% since M1 and the
 * gate had drifted down to the machine-state noise floor, so it was measuring the
 * machine, not the code. 165 ms keeps the gate a real codebase-discipline signal
 * (any regression past it is genuine) while leaving ~15 ms of honest headroom. This
 * is the FIRST re-baseline of the M1 gate; the revisit triggers are in decisions.md.
 */
const GATE_MS = 165;

/** First heading buildHugeDoc() emits — the render-succeeded sanity marker. */
const EXPECTED_H1 = 'Peekover huge-document golden fixture';

/** Default fixture: the historical 1 MB doc (buildHugeDoc()'s own default). */
const DEFAULT_SECTIONS = HUGE_DOC_SECTIONS;

// --- Types -------------------------------------------------------------------

/** What the in-page instrumentation records into window.__peekoverFirstPaint. */
interface FirstPaint {
  /** performance.now() when the reader was first detected as populated. */
  detected: number;
  /** performance.now() at the 2nd rAF after detection = navigationStart -> painted (ms). */
  painted: number;
  /** PerformanceNavigationTiming.responseEnd (ms, timeOrigin-relative) or null. */
  responseEnd: number | null;
  /** domContentLoadedEventEnd (ms) or null — a navigation mark. */
  domContentLoaded: number | null;
  /** loadEventEnd (ms) or null — a navigation mark. */
  loadEnd: number | null;
  /** first-contentful-paint startTime (ms) or null — the browser's RAW-text paint. */
  fcp: number | null;
}

/** The render-succeeded proof read out of the open shadow root. */
interface Sanity {
  h1: string | null;
  sections: number;
}

/** One iteration's derived metrics. */
interface Metrics {
  /** (a) navigationStart -> reader painted — the honest end-to-end number. */
  navToPaint: number;
  /** (b) responseEnd -> reader painted. */
  responseToPaint: number;
  /** (c) browser first-contentful-paint (the raw-text baseline), or null. */
  fcp: number | null;
  fp: FirstPaint;
  sanity: Sanity;
}

// --- In-page instrumentation (passed as a STRING so tsc/eslint don't parse browser
//     globals here; the DOM logic was validated by a throwaway probe). Installed
//     via context.addInitScript so it runs BEFORE any page script. It watches the
//     light DOM for <peekover-root> appearing with populated OPEN shadow content,
//     then records performance.now() at the 2nd rAF after detection (double-rAF =
//     the frame after content could first have painted). A rAF poll backs up the
//     MutationObserver because shadow-internal fills don't bubble to a light-DOM
//     observer. ------------------------------------------------------------------

const INIT_SCRIPT = String.raw`
(() => {
  var HOST = 'peekover-root';
  var w = window;
  w.__peekoverFirstPaint = null;
  var done = false;
  function painted() {
    var host = document.querySelector(HOST);
    if (!host) return false;
    var sr = host.shadowRoot;
    if (!sr) return false;
    var reader = sr.querySelector('.peekover-reader');
    return !!(reader && reader.childElementCount > 0);
  }
  function record() {
    if (done || !painted()) return;
    done = true;
    var detected = performance.now();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var t = performance.now();
        var nav = performance.getEntriesByType('navigation')[0] || {};
        var paints = performance.getEntriesByType('paint');
        var fcp = null;
        for (var i = 0; i < paints.length; i++) {
          if (paints[i].name === 'first-contentful-paint') { fcp = paints[i].startTime; break; }
        }
        w.__peekoverFirstPaint = {
          detected: detected,
          painted: t,
          responseEnd: typeof nav.responseEnd === 'number' ? nav.responseEnd : null,
          domContentLoaded: typeof nav.domContentLoadedEventEnd === 'number' ? nav.domContentLoadedEventEnd : null,
          loadEnd: typeof nav.loadEventEnd === 'number' ? nav.loadEventEnd : null,
          fcp: fcp,
        };
      });
    });
  }
  // A self-sustaining rAF poll is the RELIABLE detector: shadow-internal fills
  // don't bubble to a light-DOM MutationObserver, and this script is installed at
  // document-start (before document.documentElement necessarily exists). Start the
  // poll FIRST so nothing below can abort it, then attach an observer as a bonus,
  // null-safe on its target.
  (function poll() { if (done) return; record(); if (!done) requestAnimationFrame(poll); })();
  try {
    var target = document.documentElement || document;
    new MutationObserver(record).observe(target, { childList: true, subtree: true });
  } catch (e) { void e; }
  record();
})();
`;

/** Reads the open shadow root's h1 + section count as the render-succeeded proof. */
const SANITY_SCRIPT = String.raw`
(() => {
  var host = document.querySelector('peekover-root');
  var sr = host && host.shadowRoot;
  var reader = sr && sr.querySelector('.peekover-reader');
  return {
    h1: reader ? (reader.querySelector('h1') ? reader.querySelector('h1').textContent : null) : null,
    sections: reader ? reader.querySelectorAll('h2').length : 0,
  };
})();
`;

// --- Helpers -----------------------------------------------------------------

function ensureBuild(): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (fs.existsSync(manifest)) {
    console.log(`[perf] using existing build at ${EXT_DIR}`);
    console.log('[perf] NOTE: this measures whatever is built. If src/ changed, run `pnpm build` first.');
    return;
  }
  console.log(`[perf] no build at ${EXT_DIR} — running \`pnpm build\` (precondition)...`);
  execSync('pnpm build', { stdio: 'inherit' });
  if (!fs.existsSync(manifest)) {
    throw new Error(`build did not produce ${manifest}`);
  }
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(n: number | null): string {
  return n === null ? 'n/a' : `${n.toFixed(1)}ms`;
}

/** Human-readable byte size (KB under 1 MB, else MB). */
function fmtBytes(n: number): string {
  return n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
}

/**
 * Parse a `--size <value>` / `--size=<value>` CLI argument into a TARGET byte
 * count, or null when the default (1 MB historical fixture) should be used.
 * Accepts `1mb`/`full` (→ null = default), `Nkb`, `Nmb`, or a raw byte integer.
 */
function parseSizeArg(argv: string[]): number | null {
  let raw: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size') raw = argv[i + 1];
    else if (a.startsWith('--size=')) raw = a.slice('--size='.length);
  }
  if (raw === undefined) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'full' || v === '1mb' || v === '1m') return null; // default fixture
  const m = /^(\d+(?:\.\d+)?)(kb|mb|k|m|b)?$/.exec(v);
  if (!m) throw new Error(`--size: cannot parse "${raw}" (try 10kb | 50kb | 200kb | 1mb | <bytes>)`);
  const num = parseFloat(m[1]);
  const unit = m[2] ?? 'b';
  const mult = unit === 'kb' || unit === 'k' ? 1024 : unit === 'mb' || unit === 'm' ? 1_048_576 : 1;
  return Math.round(num * mult);
}

/**
 * Deterministically map a target byte count to a buildHugeDoc() section count.
 * Derives bytes-per-section from two probe generations (no Date/Math.random, so
 * it stays reproducible), then rounds to the nearest whole section (min 1). The
 * caller reports the ACTUAL generated length, so approximation here is fine.
 */
function sectionsForBytes(target: number): number {
  const a = buildHugeDoc(100).length;
  const b = buildHugeDoc(200).length;
  const bytesPerSection = (b - a) / 100;
  const header = a - bytesPerSection * 100;
  return Math.max(1, Math.round((target - header) / bytesPerSection));
}

/** Run one iteration on a fresh page in the shared context; assert render succeeded. */
async function runIteration(
  ctx: BrowserContext,
  fileUrl: string,
  i: number,
  sectionCount: number,
): Promise<Metrics> {
  const page: Page = await ctx.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForFunction(
    'window.__peekoverFirstPaint !== null && window.__peekoverFirstPaint !== undefined',
    undefined,
    { timeout: 15_000 },
  );

  const fp = (await page.evaluate('window.__peekoverFirstPaint')) as FirstPaint;
  const sanity = (await page.evaluate(SANITY_SCRIPT)) as Sanity;

  // Sanity-assert BEFORE trusting any timing (fail loudly, don't average garbage).
  if (sanity.h1 !== EXPECTED_H1) {
    await page.close();
    throw new Error(`run ${i}: reader h1 mismatch — got ${JSON.stringify(sanity.h1)}, want "${EXPECTED_H1}"`);
  }
  // buildHugeDoc emits exactly one <h2> per section; fewer rendered = truncation.
  if (sanity.sections < sectionCount) {
    await page.close();
    throw new Error(`run ${i}: only ${sanity.sections} sections rendered (< expected ${sectionCount})`);
  }
  if (consoleErrors.length) {
    await page.close();
    throw new Error(`run ${i}: page produced ${consoleErrors.length} console error(s):\n  ${consoleErrors.join('\n  ')}`);
  }

  await page.close();

  const responseEnd = fp.responseEnd ?? 0;
  return {
    navToPaint: fp.painted,
    responseToPaint: fp.painted - responseEnd,
    fcp: fp.fcp,
    fp,
    sanity,
  };
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  ensureBuild();

  // Choose the fixture size. No `--size` (or `--size 1mb`/`full`) => the default
  // buildHugeDoc() fixture: 1400 sections, byte-identical to the golden digest.
  const targetBytes = parseSizeArg(process.argv.slice(2));
  const sectionCount = targetBytes === null ? DEFAULT_SECTIONS : sectionsForBytes(targetBytes);
  const source =
    targetBytes === null ? buildHugeDoc() : buildHugeDoc(sectionCount);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-perf-'));
  const mdPath = path.join(tmpDir, 'huge.md'); // lowercase .md — manifest match patterns
  fs.writeFileSync(mdPath, source, 'utf8');
  const fileUrl = pathToFileURL(mdPath).href;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-udd-'));

  const sizeNote = targetBytes === null ? ' (default, matches golden digest)' : ` (--size target ${fmtBytes(targetBytes)})`;
  console.log(`[perf] fixture: ${fmtBytes(source.length)} markdown, ${sectionCount} sections${sizeNote} -> ${mdPath}`);
  console.log(`[perf] extension: ${EXT_DIR}`);
  console.log(`[perf] iterations: ${ITERATIONS} (run 1 = cold, discarded from stats)\n`);

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    // channel:'chromium' enables extensions in headless mode (Playwright docs).
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`],
  });
  // Install the instrumentation on the CONTEXT so it runs before any page script
  // on every page we open in the loop below.
  await ctx.addInitScript(INIT_SCRIPT);

  const results: Metrics[] = [];
  try {
    for (let i = 1; i <= ITERATIONS; i++) {
      const m = await runIteration(ctx, fileUrl, i, sectionCount);
      results.push(m);
      const cold = i === 1 ? ' (cold, discarded)' : '';
      console.log(
        `[run ${i}]${cold} ` +
          `(a) nav->paint ${fmt(m.navToPaint)} | ` +
          `(b) responseEnd->paint ${fmt(m.responseToPaint)} | ` +
          `(c) browser FCP ${fmt(m.fcp)} ` +
          `[sanity: h1 ok, ${m.sanity.sections} sections, 0 console errors] ` +
          `[marks: responseEnd ${fmt(m.fp.responseEnd)}, DCL ${fmt(m.fp.domContentLoaded)}, load ${fmt(m.fp.loadEnd)}]`,
      );
    }
  } finally {
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // Summary over the WARM runs (drop run 1).
  const warm = results.slice(1);
  const aVals = warm.map((m) => m.navToPaint);
  const bVals = warm.map((m) => m.responseToPaint);

  console.log('\n=== SUMMARY (warm runs only; cold run 1 excluded) ===');
  console.log(`metric definition: reader first-paint = performance.now() at the 2nd rAF after`);
  console.log(`  <peekover-root> first has populated open-shadow content, timeOrigin-relative.`);
  console.log(`(a) navigationStart -> reader painted (end-to-end; incl. browser's 1MB file:// load + document_idle wait):`);
  console.log(`      median ${fmt(median(aVals))}  min ${fmt(Math.min(...aVals))}  max ${fmt(Math.max(...aVals))}`);
  console.log(`(b) responseEnd -> reader painted:`);
  console.log(`      median ${fmt(median(bVals))}  min ${fmt(Math.min(...bVals))}  max ${fmt(Math.max(...bVals))}`);
  console.log(`(c) browser first-contentful-paint (raw-text baseline, printed per-run above; not the reader metric).`);

  const gateVal = median(aVals);
  const pass = gateVal < GATE_MS;
  // The rescoped gate (spec 001) holds the <165 ms bar for TYPICAL docs (<=50 KB);
  // the 1 MB fixture is judged against its own honest measured bound, not this line.
  // Tolerance band (64 KB) so a ~50 KB target that generates a hair over 51200 B
  // still reads as the typical-doc tier it represents.
  const scope = source.length <= 64 * 1024 ? 'typical-doc gate' : 'large-doc (informational vs typical-doc gate)';
  console.log(`\ngate [${fmtBytes(source.length)}, ${scope}]: (a) median ${fmt(gateVal)} vs <${GATE_MS}ms -> ${pass ? 'PASS' : 'FAIL'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
