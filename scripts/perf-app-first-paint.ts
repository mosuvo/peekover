// scripts/perf-app-first-paint.ts — task 2.2 measurement (NOT wired into CI).
//
// THE FIRST app-page first-paint number this codebase has ever recorded (D-1, Ruling 1,
// Ruling 4 — decisions.md's M9 GATE 2 entry). Mirrors scripts/perf-first-paint.ts's shape
// (same ITERATIONS=7/cold-discard, same GATE_MS=165, same median+floor statistics, same
// buildHugeDoc() generator, same sanity-before-timing discipline) driving the APP PAGE
// instead of the content script, through task 2.1's `__peekoverHarness` seam
// (`window.__peekoverHarness.openFromHandle(handle)`).
//
// THIS TASK PRODUCES A NUMBER; IT DOES NOT RULE ON IT. PRODUCED, PROVISIONAL — sanity-read
// at 9.1, banked as the standing baseline at 9.3 (Ruling 4); consumed by 8.1's M-2 pre-Shiki
// floor for the within-milestone A-B-A against post-Shiki app-page first paint in the interim.
//
// ═══ FIXTURE: THE SAME 50.4 KB DOC THE CONTENT-SCRIPT "TYPICAL DOC" ROW USES ═══════════════
//
// tasks.md 2.2 asks for "the same fixture perf-first-paint.ts uses, so the two numbers are
// comparable" and to report against `GATE_MS = 165`. `perf-first-paint.ts`'s own default
// argument-less fixture is the 1 MB/1400-section doc, which that file's own scope logic
// treats as "large-doc (informational)" against a <1.7s bound, not the <165 ms gate — so a
// literal default-argument copy would not be comparable to GATE_MS=165 at all. The reading
// that IS held to <165 ms, and the one the standing 26.9 ms/29.9 ms headroom and 3.8 ms/
// 2.5 ms A-vs-A figures this task's kickoff cites were taken on, is the 50.4 KB "typical
// doc" — `buildHugeDoc(sectionsForBytes(50 * 1024))`, produced by `pnpm perf -- --size 50kb`
// (docs/ai/progress.md § Baselines, "THE GATED 50.4 KB FIXTURE"). `sectionsForBytes` is not
// exported by perf-first-paint.ts (a private helper), so it is duplicated here verbatim —
// the SAME pattern already used independently by perf-watch.ts, perf-snapshot-capture.ts and
// perf-theme-flash.ts for this exact fixture. Same generator (`tests/golden/hugeDoc.ts`),
// same deterministic probe, same target bytes -> the SAME 51,564 B / 62-section document.
//
// ═══ THE EVENT PAIR, AND WHERE IT DELIBERATELY DIVERGES FROM THE CONTENT-SCRIPT PAIR ═══════
//
// Content-script "first paint" = navigationStart -> the reader's shadow content populated
// (double-rAF after detection). The app page has no equivalent single navigation: by the time
// `__peekoverHarness.openFromHandle` can be called, the extension UI has already loaded, and
// — traced this session, not assumed — `applyOutcome` (appShell.ts) explicitly leaves the
// reader in a NO-SELECTION state after a folder opens (`await selectFile(null)`); a real user,
// and this harness, must additionally select a file before anything paints. So THIS task's
// primary pair is: **t0 (immediately before calling `openFromHandle`) -> painted** (double-rAF
// after `.peekover-app__reader__host`'s shadow `.peekover-reader` gets content), which
// necessarily brackets a synthetic click on the sole file entry in between. Two biases follow
// from this, both named rather than smoothed over:
//   (i)  this number INCLUDES an in-page click dispatch with no content-script analogue
//        (content-script documents have no browse-then-select step);
//   (ii) this number EXCLUDES the app-shell's own page load (unlike the content-script number,
//        which includes the browser's file:// document load) — timing starts only once the
//        extension UI and the harness seam are already ready.
// The folder-populate (`openFromHandle` alone) and click-to-paint sub-spans are reported
// alongside the primary number, not blended silently into it.
//
// ═══ QUIESCENCE / PROTOCOL — mirrors perf-first-paint.ts exactly ═══════════════════════════
// 7 iterations, run 1 (cold) discarded from stats, median + floor (min) over the warm 6.
// A-vs-A agreement is established EXTERNALLY, by running this script twice back-to-back under
// the same quiesced conditions and comparing the two invocations' printed medians/floors —
// exactly how the 2026-08-03 content-script re-measurement compared its three arms (this file
// has no embedded dual-run/exit-code A-vs-A gate; that would diverge from the shape being
// mirrored). Chromium only — Playwright cannot load extensions into Firefox (perf-first-
// paint.ts, perf-watch.ts, the harness ledger).
//
// Runner: `tsx` (package script "perf:app"), for the tsc/moduleResolution reason documented at
// the top of perf-first-paint.ts.

import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildHugeDoc } from '../tests/golden/hugeDoc';

// --- Constants ---------------------------------------------------------------

/** Absolute path to the built Chrome MV3 extension Playwright will --load. */
const EXT_DIR = path.resolve('.output', 'chrome-mv3');

/** Total iterations; the FIRST (cold) run is printed but discarded from stats. Mirrors
 *  perf-first-paint.ts's ITERATIONS exactly (tasks.md 2.2). */
const ITERATIONS = 7;

/** The typical-doc acceptance gate (tasks.md 2.2's own GATE_MS, mirroring perf-first-paint.ts's
 *  constant of the same name and value). PRINTED for reference only — this task PRODUCES a
 *  number, it does not rule pass/fail/worrying/fine on it; see the header. */
const GATE_MS = 165;

/** First heading buildHugeDoc() emits — the render-succeeded sanity marker. */
const EXPECTED_H1 = 'Peekover huge-document golden fixture';

/** OPFS directory the fixture is written into once, then re-opened fresh by every iteration's
 *  page (OPFS is origin-scoped storage, not page-scoped — see header). */
const OPFS_DIR_NAME = 'peekover-perf-app-fixture';
const FIXTURE_FILE_NAME = 'huge.md';

// --- Types -------------------------------------------------------------------

/** One iteration's raw in-page timing, all values performance.now() ms (page-relative). */
interface RawTiming {
  /** Immediately before `openFromHandle` is called — the primary span's start. */
  t0: number;
  /** Immediately after `openFromHandle` resolves — the folder is populated. */
  folderReady: number;
  /** Immediately before the sole file entry is clicked. */
  clickStart: number;
  /** 2nd rAF after `.peekover-app__reader__host`'s shadow `.peekover-reader` first has
   *  content — the paint event, same double-rAF definition perf-first-paint.ts uses. */
  painted: number;
  h1: string | null;
  sections: number;
}

/** One iteration's derived metrics, all in ms. */
interface Metrics {
  /** (a) t0 -> painted — THE PRIMARY NUMBER (openFromHandle call through paint, click incl.). */
  startToPaint: number;
  /** (b) t0 -> folderReady — openFromHandle's own resolution time. Informational. */
  folderPopulate: number;
  /** (c) clickStart -> painted — click dispatch through paint. Informational sub-span of (a). */
  clickToPaint: number;
  raw: RawTiming;
}

// --- Helpers -----------------------------------------------------------------

function ensureBuild(): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (fs.existsSync(manifest)) {
    console.log(`[perf:app] using existing build at ${EXT_DIR}`);
    console.log('[perf:app] NOTE: this measures whatever is built. If src/ changed, run `pnpm build` first.');
    return;
  }
  console.log(`[perf:app] no build at ${EXT_DIR} — running \`pnpm build\` (precondition)...`);
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

function fmt(n: number): string {
  return `${n.toFixed(1)}ms`;
}

function fmtBytes(n: number): string {
  return n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
}

/**
 * Same deterministic target-bytes -> section-count mapping perf-watch.ts / perf-snapshot-
 * capture.ts / perf-theme-flash.ts each already duplicate locally (not exported by
 * perf-first-paint.ts) — reproduces the SAME 50.4 KB / 62-section fixture those baselines use.
 */
function sectionsForBytes(target: number): number {
  const a = buildHugeDoc(100).length;
  const b = buildHugeDoc(200).length;
  const bytesPerSection = (b - a) / 100;
  const header = a - bytesPerSection * 100;
  return Math.max(1, Math.round((target - header) / bytesPerSection));
}

/** Wait for the extension's service worker so the extension id can be derived (perf-watch.ts's
 *  own helper, duplicated — not imported, scripts/ has no shared-module convention). */
async function extensionId(ctx: BrowserContext): Promise<string> {
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 30_000 });
  const id = new URL(sw.url()).host;
  if (!id) throw new Error(`could not derive extension id from service worker url ${sw.url()}`);
  return id;
}

/**
 * The whole per-iteration in-page flow, as a STRING — the house convention (perf-first-paint.ts,
 * perf-watch.ts): tsc/eslint don't parse browser globals here, and args are INLINED into the
 * source rather than passed via `evaluate`'s arg parameter (perf-watch.ts's own documented
 * pitfall: a string evaluated as an expression silently drops that argument).
 *
 * 1. Opens the OPFS dir written once before the loop, gets a fresh handle to it.
 * 2. t0, calls `openFromHandle(dir)` (task 2.1's seam), folderReady.
 * 3. Finds the sole file entry (`[role="treeitem"][data-kind="file"]` — the exact selector
 *    tests/browser/appHarnessSeam.browser.test.ts already proved reaches the granted state),
 *    asserts it exists (never polls for it — `applyOutcome` paints the tree synchronously
 *    before `openFromHandle`'s promise resolves, so polling here would inject arbitrary latency
 *    into the measurement rather than reflect real work).
 * 4. clickStart, clicks it.
 * 5. rAF-polls for `.peekover-app__reader__host`'s shadow `.peekover-reader` to gain content,
 *    then double-rAF — the SAME paint definition perf-first-paint.ts uses, retargeted from the
 *    content script's `<peekover-root>` tag to the app page's `.peekover-app__reader__host`
 *    class host (readerPane.ts mounts through the SAME shared `mount()`).
 */
const RUN_SCRIPT = String.raw`
(async () => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(${JSON.stringify(OPFS_DIR_NAME)});

  const t0 = performance.now();
  await window.__peekoverHarness.openFromHandle(dir);
  const folderReady = performance.now();

  const fileBtn = document.querySelector('[role="treeitem"][data-kind="file"]');
  if (!fileBtn) throw new Error('no [role="treeitem"][data-kind="file"] found after openFromHandle');

  const clickStart = performance.now();
  fileBtn.click();

  const detected = await new Promise((resolve, reject) => {
    const deadline = performance.now() + 15000;
    function check() {
      const host = document.querySelector('.peekover-app__reader__host');
      const sr = host && host.shadowRoot;
      const reader = sr && sr.querySelector('.peekover-reader');
      if (reader && reader.childElementCount > 0) { resolve(performance.now()); return; }
      if (performance.now() > deadline) { reject(new Error('timeout waiting for .peekover-reader paint')); return; }
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  });
  void detected;
  const painted = await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())));
  });

  const reader = document.querySelector('.peekover-app__reader__host').shadowRoot.querySelector('.peekover-reader');
  const h1 = reader.querySelector('h1') ? reader.querySelector('h1').textContent : null;
  const sections = reader.querySelectorAll('h2').length;

  return { t0: t0, folderReady: folderReady, clickStart: clickStart, painted: painted, h1: h1, sections: sections };
})()
`;

/** Writes the fixture into a fresh OPFS directory ONCE, on a throwaway page, before the loop —
 *  mirrors perf-first-paint.ts writing its tmp .md file once outside the iteration loop. OPFS is
 *  ORIGIN-scoped storage (not page-scoped), so every later page at the same extension origin
 *  sees the same directory without rewriting it. */
async function seedFixture(ctx: BrowserContext, harnessUrl: string, source: string): Promise<void> {
  const page = await ctx.newPage();
  await page.goto(harnessUrl, { waitUntil: 'load' });
  await page.evaluate(
    `(async () => {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle(${JSON.stringify(OPFS_DIR_NAME)}, { create: true });
      const fh = await dir.getFileHandle(${JSON.stringify(FIXTURE_FILE_NAME)}, { create: true });
      const w = await fh.createWritable();
      await w.write(${JSON.stringify(source)});
      await w.close();
    })()`,
  );
  await page.close();
}

/** Run one iteration on a fresh page (fresh `main.ts` top-level evaluation each time, exactly
 *  like perf-first-paint.ts's fresh-page-per-iteration); assert render succeeded before trusting
 *  any timing (sanity-before-timing, perf-first-paint.ts's own discipline). */
async function runIteration(ctx: BrowserContext, harnessUrl: string, i: number, sectionCount: number): Promise<Metrics> {
  const page: Page = await ctx.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(harnessUrl, { waitUntil: 'load' });
  await page.waitForFunction(
    "typeof window.__peekoverHarness !== 'undefined' && typeof window.__peekoverHarness.openFromHandle === 'function'",
    undefined,
    { timeout: 15_000 },
  );

  const raw = (await page.evaluate(RUN_SCRIPT)) as RawTiming;

  if (raw.h1 !== EXPECTED_H1) {
    await page.close();
    throw new Error(`run ${i}: reader h1 mismatch — got ${JSON.stringify(raw.h1)}, want "${EXPECTED_H1}"`);
  }
  if (raw.sections < sectionCount) {
    await page.close();
    throw new Error(`run ${i}: only ${raw.sections} sections rendered (< expected ${sectionCount})`);
  }
  if (consoleErrors.length) {
    await page.close();
    throw new Error(`run ${i}: page produced ${consoleErrors.length} console error(s):\n  ${consoleErrors.join('\n  ')}`);
  }

  await page.close();

  return {
    startToPaint: raw.painted - raw.t0,
    folderPopulate: raw.folderReady - raw.t0,
    clickToPaint: raw.painted - raw.clickStart,
    raw,
  };
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  ensureBuild();

  const sectionCount = sectionsForBytes(50 * 1024);
  const source = buildHugeDoc(sectionCount);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-appperf-udd-'));

  console.log(`[perf:app] fixture: ${fmtBytes(source.length)} markdown, ${sectionCount} sections (--size 50kb equivalent, matches the content-script "typical doc" row)`);
  console.log(`[perf:app] extension: ${EXT_DIR}`);
  console.log(`[perf:app] iterations: ${ITERATIONS} (run 1 = cold, discarded from stats)\n`);

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`],
  });

  const results: Metrics[] = [];
  try {
    const extId = await extensionId(ctx);
    console.log(`[perf:app] extension id: ${extId}`);
    const harnessUrl = `chrome-extension://${extId}/app.html?__peekoverHarness=1`;

    await seedFixture(ctx, harnessUrl, source);

    for (let i = 1; i <= ITERATIONS; i++) {
      const m = await runIteration(ctx, harnessUrl, i, sectionCount);
      results.push(m);
      const cold = i === 1 ? ' (cold, discarded)' : '';
      console.log(
        `[run ${i}]${cold} ` +
          `(a) start->paint ${fmt(m.startToPaint)} | ` +
          `(b) folder-populate ${fmt(m.folderPopulate)} | ` +
          `(c) click->paint ${fmt(m.clickToPaint)} ` +
          `[sanity: h1 ok, ${m.raw.sections} sections, 0 console errors]`,
      );
    }
  } finally {
    await ctx.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // Summary over the WARM runs (drop run 1).
  const warm = results.slice(1);
  const aVals = warm.map((m) => m.startToPaint);
  const bVals = warm.map((m) => m.folderPopulate);
  const cVals = warm.map((m) => m.clickToPaint);

  console.log('\n=== SUMMARY (warm runs only; cold run 1 excluded) ===');
  console.log('metric definition: app-page first paint = performance.now() at the 2nd rAF after');
  console.log('  .peekover-app__reader__host\'s shadow .peekover-reader first has content.');
  console.log('(a) openFromHandle call -> reader painted (PRIMARY — includes an in-page click on the sole file entry; see header bias notes):');
  console.log(`      median ${fmt(median(aVals))}  min ${fmt(Math.min(...aVals))}  max ${fmt(Math.max(...aVals))}`);
  console.log('(b) openFromHandle call -> folder populated (informational sub-span of (a)):');
  console.log(`      median ${fmt(median(bVals))}  min ${fmt(Math.min(...bVals))}  max ${fmt(Math.max(...bVals))}`);
  console.log('(c) file click -> reader painted (informational sub-span of (a)):');
  console.log(`      median ${fmt(median(cVals))}  min ${fmt(Math.min(...cVals))}  max ${fmt(Math.max(...cVals))}`);

  const gateVal = median(aVals);
  const pass = gateVal < GATE_MS;
  console.log(`\ngate [${fmtBytes(source.length)}, typical-doc gate, printed for reference — no verdict rendered by this task]: (a) median ${fmt(gateVal)} vs <${GATE_MS}ms -> ${pass ? 'PASS' : 'FAIL'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
