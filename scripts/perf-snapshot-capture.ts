// scripts/perf-snapshot-capture.ts — spec 006 task 7.1 measurement (NOT wired into CI).
//
// WHAT SNAPSHOT CAPTURE COSTS THE READER, AND WHAT IT ACCUMULATES ON DISK.
//
// Two questions 7.2 (the human decision gate for D-8's bound values) needs answered with numbers:
//
//   (1) CAPTURE COST — does capture materially extend the window in which the reader cannot
//       respond? Measured through production's own `createWatchController` → `renderNow`, with
//       capture OFF and capture ON as a LIKE-FOR-LIKE CONTROL over the same document, same host,
//       same surface, same iteration.
//   (2) SNAPSHOT SIZE + ACCUMULATION — what one snapshot actually weighs for a 50 KB and a 1 MB
//       document, and how many snapshots a realistic sequence of agent edits produces. This is the
//       raw material for D-8's count-per-document / bytes-global / age-global numbers.
//
// ★ THIS SCRIPT CHOOSES NOTHING AND RECOMMENDS NOTHING. Not a bound, not a threshold, not a
// direction. No exit-code gate is emitted on any number here (only `perf-first-paint.ts` carries a
// hard gate, because <150 ms typical first paint is a SHIPPED M1 acceptance gate; nothing measured
// in this file is). tasks.md 7.1 says it twice — "This task MEASURES and is FORBIDDEN from choosing
// the bounds" — and the split is load-bearing: 004's task 4.1 inferred a bound from a measurement,
// and 005's 5.1/5.2 split exists because of it. A soft "seems about right" here is the same failure
// as a hard constant, arriving a beat later. 7.2 is the human gate; 7.3 implements what it decides.
//
// ════ THE DELTA IS THE NUMBER. NEITHER ABSOLUTE VALUE IS. ═══════════════════════════════════════
//
// The number that answers "does capture materially extend the unresponsive window?" is the DELTA
// between OFF and ON at the same size, not either absolute value. Both arms pay the full re-render
// (parse, sanitize, replaceChildren, chrome, the reading-anchor restore and the layout it forces);
// only ON additionally pays the capture check. Quoting the ON absolute alone would attribute ~700 ms
// of 1 MB re-render to a feature that contributes a fraction of it.
//
// This is 005's lesson applied a second time. There, the like-for-like control was the only thing
// that made "continuity MOVED layout rather than ADDING it" visible — the synchronous times said
// one thing and the to-2nd-rAF pair said the opposite. So both windows are measured here too:
//   • SYNC   — `renderNow` entry → exit, the block in which nothing can scroll, fire or cancel;
//   • →2ndRAF — the same start out to the second animation frame, the whole span in which the page
//               cannot respond. If capture moved work rather than adding it, these two disagree.
//
// ════ WHAT IS AND IS NOT ON THE SYNCHRONOUS PATH (read before quoting the delta) ════════════════
//
// `renderNow`'s capture block (`watchController.ts:472-480`) is:
//     getCaptureFlag() && docId != null && outgoing != null && normalise(outgoing) !== normalise(text)
//         → void storeSnapshot(docId, outgoing)
// `getCaptureFlag()` is a synchronous module-level boolean (`captureFlag.ts` — deliberately not an
// IDB read, for exactly this reason). `storeSnapshot` is FIRE-AND-FORGET (`void`), so only its
// synchronous prefix — up to its first `await` — is inside the measured block. What IS inside, and
// is the bulk of the ON arm's added synchronous work, is the D-5 equality check: TWO full-document
// `normalise()` passes (a `/\r\n/g` replace over the whole string, both sides).
//
// So the IDB write is NOT in the SYNC or →2ndRAF columns. It is measured SEPARATELY below, by
// awaiting the same `storeSnapshot` the controller fires and forgets — labelled as the off-critical-
// path number it is, never folded into the delta. That separation is the honest reading: capture's
// cost to the READER and capture's cost to the DISK are different numbers with different budgets.
//
// ════ THE NON-VACUITY CONTROL — WITHOUT IT THE DELTA COULD BE THE COST OF A NO-OP ═══════════════
//
// A control that is not actually exercising the feature reports a small, plausible, meaningless
// delta (005's first draft measured 0 px of drift on every cell for exactly this reason, and the
// same vacuous shape is what task 3.3's red-first pass caught). So every ON cell PROVES capture ran
// by reading `getSnapshotMeta()` after the measured render and asserting the snapshot count went UP;
// every OFF cell proves it did NOT, by asserting the count stayed flat. A cell that fails either
// check throws rather than reporting a number.
//
// ════ WHAT THIS HARNESS DOES NOT REACH, STATED RATHER THAN IMPLIED ══════════════════════════════
//
// tasks.md's shape for this measurement is "open a folder, select the document, enable watch".
// THAT PATH IS NOT AUTOMATABLE AND THE LIMIT IS ALREADY ON RECORD: `showDirectoryPicker` requires a
// user gesture and opens a native dialog Playwright cannot drive (the M2 harness limit, restated in
// perf-watch.ts). So no folder is opened and no fixture is picked from a tree. Instead the harness
// drives the production controller directly — `createWatchController({ detector, docId, contained })`
// with the SAME `docId != null` app-page gate the real `appShell.installWatchForFile` satisfies —
// over an injected detector that emits text on command. Everything downstream of `onText` is
// production's own code: `renderNow`, `mount`, the capture guard, `storeSnapshot`, real IndexedDB on
// the real extension origin. What is faked is the FILE, not the feature.
//
// WHY A BUNDLE, AND WHAT IT COSTS IN FIDELITY — perf-watch.ts's argument, unchanged and reused:
// the content script runs in an isolated world and exports nothing, so the measured modules are
// bundled from the SAME SOURCE the extension builds from (esbuild, minified, fonts inlined as Vite
// inlines them) and evaluated in the page. The honest residual is that this is the production
// SOURCE, not the production BUILD ARTIFACT — a different bundler with different chunking. Nothing
// measured here depends on chunk layout, and a test-only export in shipped code is forbidden (no
// measurement-only code ships — established when 004's task 4.2 removed 4.1's marks).
//
// esbuild is reached through `tsx`'s own dependency rather than added to package.json (D-2 governs
// `dependencies`, and 7.1 adds none). Same line perf-watch.ts uses; if `tsx` ever stops bundling
// esbuild it breaks loudly at build time.
//
// ════ PROTOCOL ══════════════════════════════════════════════════════════════════════════════════
// 7 iterations per cell, run 1 discarded as cold, MEDIAN of the warm 6, min/max as the spread —
// the M1 standing protocol, unchanged since M1 so every number stays comparable to the recorded
// baselines. Deviating silently would make every past baseline incomparable.
//
// ENGINE: CHROMIUM ONLY. Playwright exposes no Firefox add-on installation API (recorded since M1;
// perf-first-paint.ts, perf-theme-flash.ts, perf-watch.ts all carry the same constraint). Firefox
// capture cost is UNMEASURED here and no Firefox number is faked.
//
// PORTS: this harness hosts nothing. It navigates to `file://` and to the extension's own
// `chrome-extension://<id>/app.html`, so the Windows `EACCES ::1:63315` reserved-port collision
// (decisions.md 2026-07-21) cannot arise and no port override is involved.
//
// Runner: `tsx` (package script "perf:snapshot-capture"), for the tsc/moduleResolution reason
// documented at the top of perf-first-paint.ts.

import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildHugeDoc, HUGE_DOC_SECTIONS } from '../tests/golden/hugeDoc';

// --- Constants ---------------------------------------------------------------

/** Absolute path to the built Chrome MV3 extension Playwright will --load. */
const EXT_DIR = path.resolve('.output', 'chrome-mv3');

/** Total iterations per cell; the FIRST run is printed but discarded from stats. */
const ITERATIONS = 7;

/** First heading buildHugeDoc() emits — the render-succeeded sanity marker. */
const EXPECTED_H1 = 'Peekover huge-document golden fixture';

/** Where the reader is parked before a measured re-render, as a fraction of the scrollable height.
 *  Mid-document, for perf-watch.ts's reason: at the top the anchor capture picks nothing and at the
 *  bottom it picks the last heading, and neither exercises the ladder a real reader does. */
const READ_POSITION = 0.4;

/** How many sequential edits the ACCUMULATION cell drives (measurement 5). Not a proposed bound and
 *  not a projection — it is a sample length long enough that per-snapshot bytes can be read off a
 *  real sequence rather than off one write. What the cell reports is per-snapshot size and the
 *  observed count for THIS sequence; extrapolating either into a retention bound is 7.2's call. */
const EDIT_SEQUENCE = 12;

/** How many times the isolated D-5 guard cell repeats the guard expression per iteration. Enough
 *  that the per-check cost is resolvable against `performance.now()`'s own granularity. */
const GUARD_REPEATS = 20;

// --- Types -------------------------------------------------------------------

/** Capture state for a cell — the like-for-like control axis. */
type CaptureState = 'off' | 'on';

/** One capture-cost iteration, times in ms, measured in-page with performance.now(). */
interface CaptureMetrics {
  /** `renderNow` entry → exit: the synchronous block nothing else can run during. */
  sync: number;
  /** The same start → 2nd rAF: the whole window in which the page cannot respond. The
   *  like-for-like counterpart of `sync` (005's moved-vs-added distinction). */
  frame: number;
  /** Snapshot count in the store BEFORE the measured render. */
  metaBefore: number;
  /** Snapshot count AFTER it (plus a settle) — the NON-VACUITY control: must rise on `on`, must
   *  stay flat on `off`, or the delta above could be the cost of a no-op. */
  metaAfter: number;
  /** Rendered `<h2>` count after the measured render — the render-succeeded proof. */
  sections: number;
  /** Rendered `<h1>` text — the other half of that proof. */
  h1: string | null;
  /** Where the reader was parked, and the box it was parked in. A parked position of 0 means the
   *  park did not take and the anchor had nothing to do. */
  parked: number;
  scrollHeight: number;
}

/** One iteration of the AWAITED capture write — deliberately OFF the synchronous path. */
interface WriteMetrics {
  /** `storeSnapshot(docId, text)` start → resolved: plan + meta put + content put + evictions. */
  write: number;
  /** The bytes `bytesOf()` recorded for the snapshot just written. */
  bytes: number;
  /** Snapshot count in the store after this write. */
  count: number;
}

/** The accumulation cell's result for one fixture (measurement 5). */
interface AccumulationResult {
  /** Snapshots present after driving {@link EDIT_SEQUENCE} edits through the controller. */
  count: number;
  /** Total bytes those snapshots account for, per `snapshotMeta` (never read from content — D-4). */
  totalBytes: number;
  /** Every snapshot's individual byte size, in store order. */
  sizes: number[];
  /** Wall-clock from the first edit to the last snapshot landing, ms. */
  elapsed: number;
  /** How many of the {@link EDIT_SEQUENCE} edits were actually rendered (the coalescer may drop
   *  intermediate states — a dropped render captures nothing, which is exactly the real behaviour
   *  the count needs to reflect rather than hide). */
  renders: number;
  /** Snapshot count after EACH edit. A count that stops rising while renders continue is eviction
   *  binding under the PROPOSED (not chosen) `DEFAULT_BOUNDS` — visible here rather than inferred
   *  from the end state. */
  counts: number[];
}

// --- Helpers -----------------------------------------------------------------

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(n: number | null): string {
  return n === null ? 'n/a' : `${n.toFixed(1)}ms`;
}

function fmtBytes(n: number): string {
  return n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
}

function summarize(name: string, values: number[]): string {
  return `${name} median ${fmt(median(values))} (min ${fmt(Math.min(...values))}, max ${fmt(Math.max(...values))})`;
}

/** Sub-millisecond formatter. The guard cell measures a single expression, which lands well under
 *  0.1 ms — `fmt`'s one decimal would print "0.0ms" and destroy the only number in this script that
 *  is resolvable above its own noise. */
function fmtMicro(n: number): string {
  return `${n.toFixed(4)}ms (${(n * 1000).toFixed(1)}µs)`;
}

function summarizeMicro(name: string, values: number[]): string {
  return (
    `${name} median ${fmtMicro(median(values))} ` +
    `(min ${fmtMicro(Math.min(...values))}, max ${fmtMicro(Math.max(...values))})`
  );
}

/** Same deterministic target-bytes → section-count mapping the other perf scripts use, so the 50 KB
 *  and 1 MB fixtures here are the SAME documents the recorded baselines were taken on. */
function sectionsForBytes(target: number): number {
  const a = buildHugeDoc(100).length;
  const b = buildHugeDoc(200).length;
  const bytesPerSection = (b - a) / 100;
  const header = a - bytesPerSection * 100;
  return Math.max(1, Math.round((target - header) / bytesPerSection));
}

/**
 * Build unless --no-build. A measurement harness that silently measures a STALE build is worse than
 * no harness (perf-theme-flash.ts's rule, kept). The build supplies the app page this harness runs
 * on; the measured modules are bundled from source below.
 */
function ensureBuild(rebuild: boolean): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (rebuild) {
    console.log('[capture] running `pnpm build` (pass --no-build to measure against the existing .output/)...');
    execSync('pnpm build', { stdio: 'inherit' });
  } else if (!fs.existsSync(manifest)) {
    console.log(`[capture] --no-build given but no build at ${EXT_DIR} — building anyway.`);
    execSync('pnpm build', { stdio: 'inherit' });
  } else {
    console.log(`[capture] --no-build: using the EXISTING build at ${EXT_DIR}.`);
  }
  if (!fs.existsSync(manifest)) throw new Error(`build did not produce ${manifest}`);
}

/**
 * Bundle production's own watch + snapshot + render modules into one IIFE publishing
 * `globalThis.__peekoverPerf`. See the header for why a bundle, and what fidelity it costs.
 *
 * The `?inline` font imports are Vite's syntax (src/theme/fonts.ts), which esbuild does not know:
 * the plugin strips the query and the `dataurl` loader reproduces exactly what Vite's `?inline`
 * produces — a data-URL default export — so the reader CSS mounted here carries the same inlined
 * @font-face payload the shipped build does.
 */
async function bundleProductionModules(): Promise<string> {
  const require_ = createRequire(import.meta.resolve('tsx'));
  const esbuildPath = pathToFileURL(require_.resolve('esbuild')).href;
  const esbuild = (await import(esbuildPath)) as {
    build(options: Record<string, unknown>): Promise<{ outputFiles?: { text: string }[] }>;
  };

  const entry = [
    "export { mount } from './src/render/mount';",
    "export { createWatchController } from './src/watch/watchController';",
    "export { setCaptureFlag, getCaptureFlag } from './src/app/captureFlag';",
    "export { storeSnapshot, getSnapshotMeta, bytesOf, normalise } from './src/app/snapshots';",
    "export { eraseSnapshots } from './src/app/store';",
    "export { resolveScrollContainer } from './src/render/scrollContainer';",
    "export { readerSourceFor } from './src/render/readerMode';",
  ].join('\n');

  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts', sourcefile: 'perf-capture-entry.ts' },
    bundle: true,
    format: 'iife',
    globalName: '__peekoverPerf',
    platform: 'browser',
    target: 'es2022',
    minify: true, // the shipped build minifies; measure the same shape of code
    write: false,
    loader: { '.woff2': 'dataurl' },
    plugins: [
      {
        name: 'peekover-inline-query',
        setup(build: { onResolve(o: unknown, cb: (a: { path: string; resolveDir: string }) => { path: string }): void }) {
          build.onResolve({ filter: /\?inline$/ }, (args) => ({
            path: path.resolve(args.resolveDir, args.path.replace(/\?inline$/, '')),
          }));
        },
      },
    ],
  });

  const code = result.outputFiles?.[0]?.text;
  if (!code) throw new Error('esbuild produced no output for the measurement bundle');
  // Wrapped so the IIFE's `var __peekoverPerf` binding is published no matter what scope Playwright
  // evaluates the string in, plus the in-page waits every cell needs.
  return `(() => {
${code}
globalThis.__peekoverPerf = __peekoverPerf;
globalThis.__pwFrame2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
// SETTLE, NOT OVERFLOW — the 3.2 lesson (perf-watch.ts carries the measured numbers): the reader is
// still restyling when it first overflows, and a scrollTop write in that window CLAMPS to a stale
// maximum and silently parks the reader at the document bottom. Wait for geometry to STOP MOVING.
globalThis.__pwSettle = async (el) => {
  let h = -1, t = -1, stable = 0;
  for (let i = 0; i < 600 && stable < 3; i += 1) {
    await new Promise((r) => requestAnimationFrame(r));
    if (el.scrollHeight === h && el.scrollTop === t) stable += 1;
    else { stable = 0; h = el.scrollHeight; t = el.scrollTop; }
  }
};
// Total snapshots across every document, read from snapshotMeta ONLY (D-4: listing and accounting
// never touch a content row).
globalThis.__pwCount = async () => {
  const all = await globalThis.__peekoverPerf.getSnapshotMeta();
  return all.reduce((n, m) => n + m.entries.length, 0);
};
})()`;
}

// --- In-page measurement (passed as STRINGS, per the house convention: tsc/eslint do not parse
//     browser globals here, and the same convention carries every other perf script's
//     instrumentation).
//
//     EVERY parameter is INLINED into the source rather than passed as Playwright's `arg`. Measured
//     at 005, not assumed: `page.evaluate(functionString, arg)` silently returns `undefined` — a
//     string is evaluated as an EXPRESSION, so `(async (a) => {...})` yields a function object and
//     the arg is never applied. That failure is invisible (no throw, just an undefined result). ----

/** Stash the fixture source in the page once, rather than shipping 1 MB over CDP per iteration. */
function storeFixtureScript(source: string): string {
  return `(() => { globalThis.__pwText = ${JSON.stringify(source)}; return globalThis.__pwText.length; })()`;
}

/**
 * Build the surface capture actually runs on: the app page's contained pane — `<main
 * class="peekover-app__reader">` with `overflow:auto` around the host.
 *
 * CONTAINED IS NOT A CONVENIENCE HERE, IT IS THE ONLY CORRECT SURFACE. Capture is app-page-only by
 * §3.2: the content script constructs no `docId`, so `watchController`'s `docId != null` guard makes
 * capture unreachable there. Measuring capture on the full-page takeover would be measuring a
 * combination production never runs.
 *
 * The 4.2 harness defect, not repeated: mounting a bare div makes `resolveScrollContainer` take its
 * documented degenerate-mount fallback to the host, which in normal flow grows to its content and
 * NEVER SCROLLS — every geometry number would then be measured against an immovable box.
 */
const BUILD_CONTAINED = String.raw`
(async () => {
  const pane = document.createElement('main');
  pane.className = 'peekover-app__reader';
  pane.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#fff;z-index:2147483646;';
  const host = document.createElement('div');
  pane.appendChild(host);
  document.body.appendChild(pane);
  globalThis.__pwPane = pane;
  globalThis.__pwHost = host;
  return { ok: true };
})()
`;

/**
 * ONE capture-cost iteration. Order matters and every step is deliberate:
 *
 *   1. wipe the snapshot store, so the count check below is an absolute statement, not a relative
 *      one, and so no earlier cell's accumulation shifts this one's eviction work;
 *   2. set the capture flag to this cell's arm — THE ONLY DIFFERENCE BETWEEN THE TWO ARMS. Same
 *      document, same host, same controller, same texts, same park, same iteration index;
 *   3. PRIME: start the controller and emit text A. This render is not measured; it exists so the
 *      measured render has a previous document to (a) capture a reading anchor from and (b) read as
 *      `outgoing` from the reader-source WeakMap — the value capture actually stores (D-1);
 *   4. stop() then start() — production API, and the ONLY purpose is to clear the cost-proportional
 *      cooldown `renderNow` armed on the priming render (`start()` sets `readyAt = 0`, its own
 *      documented "the first render of a watch is immediate"). Without this the measured emit would
 *      be COALESCED into a timer and the harness would time a branch, not a render;
 *   5. park the reader mid-document and let geometry SETTLE, so the anchor has real work;
 *   6. time the emit: `onText` → `renderNow` entry → exit is the SYNC number; out to the 2nd rAF is
 *      the FRAME number. `onText`'s own work before `renderNow` is two boolean reads and a clock
 *      read, identical in both arms, so it cancels in the delta;
 *   7. settle, then re-read the snapshot count — the non-vacuity control.
 *
 * THE TEXTS DIFFER BY AN INSERTED BLOCK, and it has to be an insertion above rather than an append:
 * an append is the case raw `scrollTop` already gets right, so the anchor would have nothing to
 * correct (005's first-draft defect). Both texts are otherwise byte-identical, so the two arms
 * render the same document and the render costs are comparable.
 *
 * WHY THE D-5 EQUALITY CHECK IS REAL WORK HERE: `normalise(outgoing) !== normalise(text)` runs a
 * whole-document regex replace over BOTH strings inside the measured block. It is the bulk of what
 * the ON arm adds synchronously, and it is production's own line, not an artefact of this harness.
 */
function measureScript(tick: number): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const host = globalThis.__pwHost;
  const pane = globalThis.__pwPane;
  const base = globalThis.__pwText;

  // The inserted block — content ABOVE the reading position, so the anchor must do real work.
  let block = 'Watch tick ${tick}.\n\n';
  for (let i = 0; i < 60; i += 1) block += 'Shift line ' + i + ' for tick ${tick}.\n\n';
  const textA = base;
  const textB = block + '\n\n' + base;

  const metaBefore = await globalThis.__pwCount();

  // PRIME — not measured. Emits textA so the measured render has an outgoing source and a layout.
  globalThis.__pwEmit(textA);
  await globalThis.__pwSettle(pane);

  // Clear the cost-proportional cooldown through the production API (see the doc comment).
  globalThis.__pwController.stop();
  globalThis.__pwController.start(host);

  const scroller = P.resolveScrollContainer(host, true);
  scroller.scrollTop = Math.round(scroller.scrollHeight * ${READ_POSITION});
  await globalThis.__pwSettle(scroller);
  const parked = scroller.scrollTop;

  const t0 = performance.now();
  globalThis.__pwEmit(textB);
  const sync = performance.now() - t0;
  await globalThis.__pwFrame2();
  const frame = performance.now() - t0;

  // Let the fire-and-forget write land before counting. This wait is OUTSIDE both timings above.
  await globalThis.__pwSettle(pane);
  for (let i = 0; i < 40; i += 1) await new Promise((r) => setTimeout(r, 25));
  const metaAfter = await globalThis.__pwCount();

  const reader = host.shadowRoot.querySelector('.peekover-reader');
  const h1 = reader && reader.querySelector('h1') ? reader.querySelector('h1').textContent : null;
  return {
    sync: sync, frame: frame,
    metaBefore: metaBefore, metaAfter: metaAfter,
    sections: reader ? reader.querySelectorAll('h2').length : 0, h1: h1,
    parked: parked, scrollHeight: scroller.scrollHeight,
  };
})()
`;
}

/**
 * Install a controller over an injected detector. Everything downstream of `__pwEmit` is
 * production's own code — this only supplies the text a real file read would have supplied.
 *
 * `docId` is a REAL app-page-shaped id (`folderId + SEP + path`); `contained: true` matches the
 * surface. `render`, `signal` and `now` are left at their production defaults deliberately: they are
 * the injection points the unit test uses, and taking any of them would remove real cost from the
 * measurement.
 */
const INSTALL_CONTROLLER = String.raw`
(() => {
  const P = globalThis.__peekoverPerf;
  let emit = null;
  const detector = {
    start(onText) { emit = onText; },
    stop() { emit = null; },
  };
  globalThis.__pwEmit = (text) => { if (emit) emit(text); };
  // SEP is U+0000 — written here as a code-unit escape via String.fromCharCode so no control byte
  // ever exists in this file (AGENTS.md #control-chars; the NUL has bitten this milestone twice).
  const SEP = String.fromCharCode(0);
  globalThis.__pwController = P.createWatchController({
    detector: detector,
    docId: 'perf-folder' + SEP + 'perf-doc.md',
    contained: true,
  });
  globalThis.__pwController.start(globalThis.__pwHost);
  return { installed: true };
})()
`;

/**
 * THE AWAITED CAPTURE WRITE — the disk cost, deliberately separated from the reader cost.
 *
 * `renderNow` fires `void storeSnapshot(...)`, so this work is NOT in the SYNC or →2ndRAF columns
 * above and must never be folded into the delta. It is the same exported function the controller
 * calls, awaited here so it can be timed at all. Each iteration writes a DISTINCT text (the tick is
 * appended) because an identical write would still store — `storeSnapshot` has no dedupe, that is
 * the caller's D-5 equality check — but distinct texts keep the eviction arithmetic honest.
 */
function measureWriteScript(iterations: number): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const base = globalThis.__pwText;
  const SEP = String.fromCharCode(0);
  const docId = 'perf-folder' + SEP + 'perf-write.md';
  await P.eraseSnapshots();
  const out = [];
  for (let i = 1; i <= ${iterations}; i += 1) {
    const text = base + '\n\nWrite tick ' + i + '.\n';
    const t0 = performance.now();
    await P.storeSnapshot(docId, text);
    const write = performance.now() - t0;
    out.push({ write: write, bytes: P.bytesOf(text), count: await globalThis.__pwCount() });
  }
  return out;
})()
`;
}

/**
 * THE D-5 EQUALITY CHECK IN ISOLATION — because at 1 MB the in-situ delta is BELOW THE RESOLUTION
 * OF THE IN-SITU MEASUREMENT, and that was measured rather than assumed.
 *
 * Two independent 6-run passes of the OFF/ON cells above produced 1 MB synchronous deltas of
 * OPPOSITE SIGN (one negative, one positive), because a single 1 MB re-render varies by ~200 ms
 * run-to-run (GC, layout of 1400 sections) while the work capture adds is far smaller than that.
 * Quoting either pass's delta as "the capture cost" would be reporting a noise draw. So the
 * dominant added term is measured directly, where the signal is not buried:
 *
 *     getCaptureFlag() && docId != null && outgoing != null && normalise(outgoing) !== normalise(text)
 *
 * That is `watchController.ts:472-480` verbatim — the whole synchronous capture guard. `storeSnapshot`
 * is fire-and-forget, so everything after it is off this path; what remains is a boolean read, two
 * null checks, and TWO whole-document `normalise()` passes plus a string comparison. This cell runs
 * the same expression over the same two texts, REPEAT times per iteration, and reports the per-check
 * cost — the same decomposition perf-watch.ts applies when it reports "parse+sanitize only" beside
 * the mount it is part of.
 *
 * IT IS A COMPONENT COST, NOT A REPLACEMENT FOR THE IN-SITU DELTA. It measures the guard in a hot
 * loop with both strings resident and warm, so it is a FLOOR on the added synchronous work, not a
 * prediction of it. Retro finding 2 is the standing warning about exactly this move: 004's isolated
 * settings probe predicted ~26 ms where the real content-script path measured ~72 ms — an isolated
 * probe under-predicted the real path by ~13x. Both numbers are therefore reported, and neither is
 * presented as the other.
 */
function measureGuardScript(iterations: number, repeats: number): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const base = globalThis.__pwText;
  let block = 'Guard tick.\n\n';
  for (let i = 0; i < 60; i += 1) block += 'Shift line ' + i + ' for the guard cell.\n\n';
  const outgoing = base;
  const text = block + '\n\n' + base;

  // The exact production expression. Kept in a sink so nothing can be optimised away as dead.
  let sink = 0;
  const check = () => {
    if (P.getCaptureFlag() && outgoing != null && P.normalise(outgoing) !== P.normalise(text)) sink += 1;
  };

  const out = [];
  for (let i = 0; i < ${iterations}; i += 1) {
    const t0 = performance.now();
    for (let r = 0; r < ${repeats}; r += 1) check();
    out.push((performance.now() - t0) / ${repeats});
    await new Promise((r) => setTimeout(r, 0));
  }
  return { per: out, sink: sink };
})()
`;
}

/**
 * ACCUMULATION (measurement 5) — what a realistic edit sequence actually leaves on disk.
 *
 * The sequence is a deterministic stand-in for an agent revising a document: each edit appends one
 * short paragraph AND rewrites one existing line, so consecutive states are never equal under
 * `normalise` (a pure CRLF↔LF change would store nothing — D-5) and never wholly disjoint either.
 *
 * IT IS DRIVEN THROUGH THE CONTROLLER, NOT THROUGH `storeSnapshot` — so the coalescer is in the
 * loop exactly as in production: an edit arriving inside the cost-proportional cooldown is COALESCED
 * and never renders, and a render that never happens captures nothing. `renders` reports how many of
 * the ${EDIT_SEQUENCE} edits actually reached `renderNow`, so the snapshot count can be read against
 * what really happened rather than against the edit count.
 *
 * Each edit waits for the previous render to land before issuing, which makes the sequence
 * reproducible; a burstier writer would coalesce more and capture less. That is a property of the
 * WRITER, not of capture, and it is stated here rather than folded into a number.
 *
 * ★ NOTHING IS PROJECTED FROM THIS. It reports a count, a total, and every individual size for ONE
 * sequence at ONE document size. Turning that into a retention bound is 7.2's decision, not this
 * script's arithmetic.
 */
function measureAccumulationScript(edits: number): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const host = globalThis.__pwHost;
  const pane = globalThis.__pwPane;
  const base = globalThis.__pwText;
  await P.eraseSnapshots();
  P.setCaptureFlag(true);

  globalThis.__pwController.stop();
  globalThis.__pwController.start(host);

  // Seed: the state every later edit diverges from.
  globalThis.__pwEmit(base);
  await globalThis.__pwSettle(pane);

  const t0 = performance.now();
  let renders = 0;
  let text = base;
  const counts = [];
  for (let i = 1; i <= ${edits}; i += 1) {
    // One appended paragraph + one rewritten existing line — never equal to the previous state.
    const lines = text.split('\n');
    const target = Math.min(40 + i * 7, lines.length - 1);
    lines[target] = 'Revised at edit ' + i + '.';
    text = lines.join('\n') + '\n\nAppended paragraph ' + i + ' by the edit sequence.\n';
    globalThis.__pwEmit(text);
    await globalThis.__pwSettle(pane);
    // DID THAT EMIT RENDER, OR WAS IT COALESCED? The reader-source WeakMap is the discriminator:
    // mount() re-stashes the displayed source on every render, so a render happened if and only if
    // the source now registered for this host is the text just emitted. Counting emissions instead
    // would report the sequence length back to itself and hide every coalesced edit.
    if (P.readerSourceFor(host) === text) renders += 1;
    // Wait out the cost-proportional cooldown so the NEXT edit is a render rather than a coalesce.
    // Generous and measured against the render just performed, not a magic constant: the cooldown
    // equals the last render's cost (COOLDOWN_MULTIPLIER = 1), so twice that always clears it.
    await new Promise((r) => setTimeout(r, 1600));
    // The store's size AFTER this edit. Recorded per edit rather than only at the end, because the
    // end state alone cannot distinguish "few edits captured" from "many captured, most evicted" —
    // and at 1 MB the PROPOSED (not chosen) DEFAULT_BOUNDS make that difference the whole story.
    counts.push(await globalThis.__pwCount());
  }
  // Let the last fire-and-forget write land.
  for (let i = 0; i < 40; i += 1) await new Promise((r) => setTimeout(r, 25));
  const elapsed = performance.now() - t0;

  const all = await P.getSnapshotMeta();
  const sizes = [];
  for (const m of all) for (const e of m.entries) sizes.push(e.bytes);
  return {
    count: sizes.length,
    totalBytes: sizes.reduce((a, b) => a + b, 0),
    sizes: sizes,
    elapsed: elapsed,
    renders: renders,
    counts: counts,
  };
})()
`;
}

// --- Cells -------------------------------------------------------------------

/** Wait for the extension's service worker so the extension id can be derived. */
async function extensionId(ctx: BrowserContext): Promise<string> {
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 30_000 });
  const id = new URL(sw.url()).host;
  if (!id) throw new Error(`could not derive extension id from service worker url ${sw.url()}`);
  return id;
}

/** Open a page, fail loudly on console errors, and publish the measurement bundle into it.
 *  `page.evaluate` goes through CDP and so is not subject to the page's CSP — which matters on the
 *  extension origin, where an injected inline <script> would simply be blocked. */
async function openInstrumented(ctx: BrowserContext, url: string, bundle: string, errors: string[]): Promise<Page> {
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(bundle);
  return page;
}

/** Capture cost for one (fixture × capture-state) cell. */
async function runCaptureCell(
  page: Page,
  fixture: { name: string; sections: number },
  state: CaptureState,
  errors: string[],
): Promise<CaptureMetrics[]> {
  console.log(`\n--- CELL: capture ${state.toUpperCase()} · ${fixture.name} · contained (app-page surface) ---`);
  const out: CaptureMetrics[] = [];
  for (let i = 1; i <= ITERATIONS; i += 1) {
    // Wipe + set the arm's flag per iteration, so each iteration is independent and the count check
    // below is absolute. `eraseSnapshots()` is production's own D-13 control.
    await page.evaluate(
      `(async () => { await globalThis.__peekoverPerf.eraseSnapshots(); ` +
        `globalThis.__peekoverPerf.setCaptureFlag(${state === 'on'}); return true; })()`,
    );
    const m = (await page.evaluate(measureScript(i))) as CaptureMetrics;

    if (m.h1 !== EXPECTED_H1) {
      throw new Error(`${fixture.name}/${state} run ${i}: reader h1 mismatch — got ${JSON.stringify(m.h1)}`);
    }
    if (m.sections < fixture.sections) {
      throw new Error(`${fixture.name}/${state} run ${i}: only ${m.sections} sections rendered (< ${fixture.sections})`);
    }
    // THE NON-VACUITY CONTROL. Without it the OFF/ON delta could be the cost of a code path that
    // never executed — the exact defect class 005's drift control exists for.
    const captured = m.metaAfter - m.metaBefore;
    if (state === 'on' && captured < 1) {
      throw new Error(
        `${fixture.name}/on run ${i}: capture was ENABLED but the snapshot count did not rise ` +
          `(${m.metaBefore} -> ${m.metaAfter}). The ON arm is not exercising the capture path, so its ` +
          `delta would be the cost of a no-op. Refusing to report.`,
      );
    }
    if (state === 'off' && captured !== 0) {
      throw new Error(
        `${fixture.name}/off run ${i}: capture was DISABLED but the snapshot count moved ` +
          `(${m.metaBefore} -> ${m.metaAfter}). The control arm is not a control. Refusing to report.`,
      );
    }
    if (m.parked === 0) {
      throw new Error(`${fixture.name}/${state} run ${i}: the park did not take (scrollTop 0 of ${m.scrollHeight}px).`);
    }
    if (errors.length) {
      throw new Error(`${fixture.name}/${state} run ${i}: console error(s):\n  ${errors.join('\n  ')}`);
    }

    out.push(m);
    console.log(
      `[run ${i}]${i === 1 ? ' (cold, discarded)' : '                  '} ` +
        `sync ${fmt(m.sync)} | ->2nd rAF ${fmt(m.frame)} | snapshots ${m.metaBefore}->${m.metaAfter} | ` +
        `parked ${m.parked.toFixed(0)} of ${m.scrollHeight.toFixed(0)}px | ${m.sections} sections`,
    );
  }
  return out.slice(1);
}

/** The awaited-write cell for one fixture (off the synchronous path). */
async function runWriteCell(page: Page, fixture: { name: string }): Promise<WriteMetrics[]> {
  console.log(`\n--- CELL: awaited storeSnapshot (OFF the synchronous render path) · ${fixture.name} ---`);
  const runs = (await page.evaluate(measureWriteScript(ITERATIONS))) as WriteMetrics[];
  runs.forEach((m, i) => {
    console.log(
      `[run ${i + 1}]${i === 0 ? ' (cold, discarded)' : '                  '} ` +
        `write ${fmt(m.write)} | snapshot ${fmtBytes(m.bytes)} | store now holds ${m.count}`,
    );
  });
  return runs.slice(1);
}

/** The accumulation cell for one fixture. */
async function runAccumulationCell(page: Page, fixture: { name: string }): Promise<AccumulationResult> {
  console.log(`\n--- CELL: accumulation over ${EDIT_SEQUENCE} sequential edits · ${fixture.name} ---`);
  const r = (await page.evaluate(measureAccumulationScript(EDIT_SEQUENCE))) as AccumulationResult;
  console.log(
    `  ${r.renders} of ${EDIT_SEQUENCE} edits rendered · ${r.count} snapshots stored · ` +
      `${fmtBytes(r.totalBytes)} total · ${(r.elapsed / 1000).toFixed(1)}s wall-clock`,
  );
  console.log(`  snapshot count after each edit: ${r.counts.join(', ')}`);
  console.log(`  individual snapshot sizes: ${r.sizes.map((b) => fmtBytes(b)).join(', ')}`);
  return r;
}

/** The isolated D-5 guard cell — the component cost, where the in-situ delta is below resolution. */
async function runGuardCell(page: Page, fixture: { name: string }): Promise<number[]> {
  console.log(`\n--- CELL: the D-5 capture guard in isolation (component cost) · ${fixture.name} ---`);
  const r = (await page.evaluate(measureGuardScript(ITERATIONS, GUARD_REPEATS))) as {
    per: number[];
    sink: number;
  };
  if (r.sink === 0) {
    throw new Error(
      `${fixture.name}: the guard expression never evaluated true, so the normalise() comparison ` +
        `short-circuited and the measured cost is not the guard's. Refusing to report.`,
    );
  }
  r.per.forEach((v, i) => {
    console.log(
      `[run ${i + 1}]${i === 0 ? ' (cold, discarded)' : '                  '} ` +
        `${fmtMicro(v)} per check (mean of ${GUARD_REPEATS} repeats)`,
    );
  });
  return r.per.slice(1);
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  ensureBuild(!argv.includes('--no-build'));

  console.log('[capture] bundling production watch + snapshot + render modules (esbuild via tsx)...');
  const bundle = await bundleProductionModules();
  console.log(`[capture] bundle ready (${fmtBytes(bundle.length)} of JS, fonts inlined as in the shipped build).`);

  // The two fixtures tasks.md names, built by the SAME generator the recorded baselines use.
  const smallSections = sectionsForBytes(50 * 1024);
  const specs = [
    { name: '50kb', sections: smallSections, source: buildHugeDoc(smallSections) },
    { name: '1mb', sections: HUGE_DOC_SECTIONS, source: buildHugeDoc() },
  ];
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-captureperf-udd-'));

  console.log(`[capture] extension: ${EXT_DIR}`);
  console.log(`[capture] fixtures: ${specs.map((s) => `${s.name}=${fmtBytes(s.source.length)}`).join(', ')}`);
  console.log(`[capture] iterations per cell: ${ITERATIONS} (run 1 discarded as cold; median of the warm ${ITERATIONS - 1})`);
  console.log('[capture] surface: CONTAINED (the app page) — capture is app-page-only by §3.2, so this is');
  console.log('          the only surface on which the measured code path is reachable at all.');
  console.log('[capture] engine: CHROMIUM ONLY — Playwright cannot load an extension into Firefox.\n');

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`],
  });

  const capture: { fixture: string; state: CaptureState; runs: CaptureMetrics[] }[] = [];
  const writes: { fixture: string; runs: WriteMetrics[] }[] = [];
  const guards: { fixture: string; runs: number[] }[] = [];
  const accum: { fixture: string; result: AccumulationResult }[] = [];
  try {
    const extId = await extensionId(ctx);
    console.log(`[capture] extension id: ${extId}`);

    for (const fixture of specs) {
      // The EXTENSION ORIGIN, not file:// — IndexedDB on a file:// page is opaque-origin storage in
      // Chromium, and the app page is where capture runs in production anyway.
      const errors: string[] = [];
      const page = await openInstrumented(ctx, `chrome-extension://${extId}/app.html`, bundle, errors);
      await page.evaluate(storeFixtureScript(fixture.source));
      await page.evaluate(BUILD_CONTAINED);
      await page.evaluate(INSTALL_CONTROLLER);

      for (const state of ['off', 'on'] as CaptureState[]) {
        capture.push({ fixture: fixture.name, state, runs: await runCaptureCell(page, fixture, state, errors) });
      }
      guards.push({ fixture: fixture.name, runs: await runGuardCell(page, fixture) });
      writes.push({ fixture: fixture.name, runs: await runWriteCell(page, fixture) });
      accum.push({ fixture: fixture.name, result: await runAccumulationCell(page, fixture) });

      await page.evaluate('globalThis.__peekoverPerf.eraseSnapshots()');
      await page.close();
    }
  } finally {
    await ctx.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // --- Summary ---------------------------------------------------------------

  console.log(`\n=== SUMMARY (run 1 excluded from every cell; n=${ITERATIONS - 1}) ===`);

  console.log('\n--- (1) CAPTURE COST — like-for-like control, capture OFF vs ON ---');
  for (const fixture of specs) {
    const off = capture.find((c) => c.fixture === fixture.name && c.state === 'off');
    const on = capture.find((c) => c.fixture === fixture.name && c.state === 'on');
    if (!off || !on) continue;
    console.log(`\n[${fixture.name}]`);
    console.log(`  ${summarize('capture OFF, synchronous (control)   ', off.runs.map((m) => m.sync))}`);
    console.log(`  ${summarize('capture ON,  synchronous (shipped)   ', on.runs.map((m) => m.sync))}`);
    console.log(`  ${summarize('capture OFF, start -> 2nd rAF        ', off.runs.map((m) => m.frame))}`);
    console.log(`  ${summarize('capture ON,  start -> 2nd rAF        ', on.runs.map((m) => m.frame))}`);
    const dSync = median(on.runs.map((m) => m.sync)) - median(off.runs.map((m) => m.sync));
    const dFrame = median(on.runs.map((m) => m.frame)) - median(off.runs.map((m) => m.frame));
    console.log(`  DELTA (on - off), synchronous : ${fmt(dSync)}`);
    console.log(`  DELTA (on - off), ->2nd rAF   : ${fmt(dFrame)}`);
    console.log(
      `  non-vacuity: ON captured ${on.runs.map((m) => m.metaAfter - m.metaBefore).join('/')} snapshot(s) per run; ` +
        `OFF captured ${off.runs.map((m) => m.metaAfter - m.metaBefore).join('/')}.`,
    );
    // RESOLUTION, STATED PER CELL. A delta smaller than the spread of the arms it is a difference
    // of is not a measurement of anything. Reporting the comparison lets a reader see that directly
    // instead of taking a median on trust.
    const spread = Math.max(
      Math.max(...off.runs.map((m) => m.sync)) - Math.min(...off.runs.map((m) => m.sync)),
      Math.max(...on.runs.map((m) => m.sync)) - Math.min(...on.runs.map((m) => m.sync)),
    );
    console.log(
      `  RESOLUTION: the widest within-arm spread is ${fmt(spread)}; the synchronous delta is ${fmt(dSync)}. ` +
        (Math.abs(dSync) < spread
          ? 'The delta is SMALLER THAN THE NOISE it is drawn from — it is not resolvable at this ' +
            'sample size, and its sign is not meaningful. Use the isolated guard cost below for the ' +
            'component number, and do not quote this delta as "the capture cost".'
          : 'The delta exceeds the within-arm spread.'),
    );
  }

  console.log('\n--- (1b) THE D-5 CAPTURE GUARD IN ISOLATION — the component cost, per check ---');
  for (const g of guards) {
    console.log(`\n[${g.fixture}]`);
    console.log(`  ${summarizeMicro('getCaptureFlag() + two normalise() + compare', g.runs)}`);
    console.log(`  per-run: ${g.runs.map((v) => (v * 1000).toFixed(1)).join(', ')} µs`);
  }
  console.log(
    '\n  This is the whole synchronous addition capture makes to renderNow (storeSnapshot is\n' +
      '  fire-and-forget, so nothing after it is on this path). It is measured in a hot loop with\n' +
      '  both strings warm, so it is a FLOOR on the added work, not a prediction of it — retro\n' +
      "  finding 2's standing warning: 004's isolated probe under-predicted the real path by ~13x.",
  );

  console.log('\n--- (2) AWAITED CAPTURE WRITE — off the synchronous path, never part of the delta ---');
  for (const w of writes) {
    console.log(`\n[${w.fixture}]`);
    console.log(`  ${summarize('storeSnapshot() start -> resolved', w.runs.map((m) => m.write))}`);
    console.log(`  snapshot bytes: ${w.runs.map((m) => fmtBytes(m.bytes)).join(', ')}`);
  }

  console.log('\n--- (3) SNAPSHOT SIZES + ACCUMULATION — the raw material for D-8, chosen at 7.2 ---');
  for (const a of accum) {
    const r = a.result;
    const per = r.count > 0 ? r.totalBytes / r.count : 0;
    console.log(`\n[${a.fixture}]`);
    console.log(
      `  edits rendered: ${r.renders} of ${EDIT_SEQUENCE} · snapshots stored: ${r.count} · ` +
        `wall-clock ${(r.elapsed / 1000).toFixed(1)}s`,
    );
    console.log(`  total bytes: ${fmtBytes(r.totalBytes)} (${r.totalBytes} B) · mean per snapshot ${fmtBytes(per)}`);
    console.log(`  min ${fmtBytes(Math.min(...r.sizes))} · max ${fmtBytes(Math.max(...r.sizes))}`);
    console.log(`  snapshot count after each edit: ${r.counts.join(', ')}`);
    console.log(`  every size: ${r.sizes.join(', ')} B`);
    // WHAT THE COUNT SEQUENCE SHOWS, as an observation about the run — never as a bound proposal.
    const peak = Math.max(...r.counts, 0);
    if (r.count < peak || r.counts.some((c, i) => i > 0 && c <= r.counts[i - 1])) {
      console.log(
        `  OBSERVED: the count stopped rising (peak ${peak}, final ${r.count}) while renders continued — ` +
          `eviction bound under the PROPOSED DEFAULT_BOUNDS. Which bound bit, and whether these are the ` +
          `right numbers, is 7.2's decision; this line records only that eviction occurred in this run.`,
      );
    }
  }

  console.log('\n=== TABLE (medians) ===');
  console.log('fixture | capture |     sync |  ->2ndrAF | snapshots captured');
  for (const c of capture) {
    console.log(
      `${c.fixture.padEnd(7)} | ${c.state.padEnd(7)} | ` +
        `${fmt(median(c.runs.map((m) => m.sync))).padStart(8)} | ` +
        `${fmt(median(c.runs.map((m) => m.frame))).padStart(9)} | ` +
        `${c.runs.reduce((n, m) => n + (m.metaAfter - m.metaBefore), 0)} over ${c.runs.length} runs`,
    );
  }
  console.log('\nfixture | DELTA sync | DELTA ->2ndrAF | guard/check | awaited write | mean snapshot');
  for (const fixture of specs) {
    const off = capture.find((c) => c.fixture === fixture.name && c.state === 'off');
    const on = capture.find((c) => c.fixture === fixture.name && c.state === 'on');
    const w = writes.find((x) => x.fixture === fixture.name);
    const a = accum.find((x) => x.fixture === fixture.name);
    const g = guards.find((x) => x.fixture === fixture.name);
    if (!off || !on || !w || !a || !g) continue;
    const per = a.result.count > 0 ? a.result.totalBytes / a.result.count : 0;
    console.log(
      `${fixture.name.padEnd(7)} | ` +
        `${fmt(median(on.runs.map((m) => m.sync)) - median(off.runs.map((m) => m.sync))).padStart(10)} | ` +
        `${fmt(median(on.runs.map((m) => m.frame)) - median(off.runs.map((m) => m.frame))).padStart(14)} | ` +
        `${`${(median(g.runs) * 1000).toFixed(1)}µs`.padStart(11)} | ` +
        `${fmt(median(w.runs.map((m) => m.write))).padStart(13)} | ` +
        `${fmtBytes(per).padStart(13)}`,
    );
  }

  console.log(`
=== WHAT THESE NUMBERS DO AND DO NOT LICENSE ===

THE DELTA IS THE CAPTURE COST. The number that answers "does capture materially extend the
unresponsive window?" is the DELTA between OFF and ON at the same size — NOT either absolute value.
Both arms pay the whole re-render; only ON pays the capture check on top of it. The two windows are
both reported because 005 showed a feature can MOVE work rather than ADD it, and only the pair makes
that visible: if the synchronous delta and the ->2nd-rAF delta disagree, the work moved.

...BUT ONLY WHERE THE DELTA IS ABOVE THE NOISE, AND AT 1 MB IT IS NOT. A single 1 MB re-render
varies by ~200 ms run-to-run in this harness, which is far larger than anything capture adds; two
independent 6-run passes produced 1 MB deltas of OPPOSITE SIGN. Each cell therefore prints its own
within-arm spread beside its delta, and the isolated guard cell (1b) exists to give the component
cost a number that IS resolvable. Do not quote an unresolvable delta as a cost, in either direction.

THE AWAITED WRITE IS NOT PART OF THE DELTA. renderNow fires \`void storeSnapshot(...)\`, so the IDB
work is off the synchronous path by construction. It is measured and reported separately because it
is a real cost to the DISK and to the event loop — just not to the block the reader waits on.

WHAT IS MEASURED: production's own createWatchController -> renderNow -> mount -> capture guard ->
storeSnapshot, on the real extension origin, against real IndexedDB, on the contained app-page pane
(the only surface where capture is reachable — §3.2). The capture flag is production's own
D-12 off-switch, so the two arms differ by one boolean and nothing else.

WHAT IS NOT MEASURED: any Firefox number (Playwright cannot load an extension into Firefox — the
constraint every recorded perf baseline carries). A real folder opened through showDirectoryPicker
(needs a user gesture and a native dialog Playwright cannot drive — the M2 harness limit): the
document is supplied to the production controller directly rather than read off disk, so file I/O
is outside every number here. The module graph is bundled from SOURCE by esbuild rather than taken
from the shipped WXT artifact.

NO THRESHOLD IS ASSERTED. NO BOUND IS CHOSEN OR RECOMMENDED — not count-per-document, not
bytes-global, not age-global. 7.2 is the human decision gate for all three (D-8); D-16 already fixed
the AXES, so only the numbers go to that gate. This script emits no exit-code gate on anything.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
