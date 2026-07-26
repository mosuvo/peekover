// scripts/perf-diff.ts — spec 006 task 7.1 measurement (NOT wired into CI).
//
// WHAT THE DIFF VIEW COSTS AT 1 MB — TIME AND MEMORY.
//
// Plan §1.6 names this as the milestone's real ceiling: "This is where §7-2's real ceiling sits, now
// that capture no longer adds a copy (D-1). Rendering a diff holds: the current source (WeakMap), the
// snapshot's text (fetched), the hunks, and the rendered output." §1.6 asserts no threshold and
// leaves the measurement to §5. This is that measurement.
//
// Five timings and a memory trace, at 1 MB, over 7 iterations (run 1 discarded as cold):
//
//   (a) computeDiff        — the engine alone (5.1), `diffLines` over two LF-normalised 1 MB strings
//   (b) hunk pipeline      — parse → sanitize for BOTH sides, the §3.8 discipline every hunk pays
//   (c) DOM construction   — what `enterDiff` costs beyond (b): template, media policy, adopt,
//                            append, the anchor capture, the attribute flip. DERIVED, see below.
//   (d) TOTAL enter        — click to visible diff, through the REAL 6.2 affordance path
//   (e) interactive frames — 5 sequential 100px scrolls with a diff on screen, per-frame latency
//
//   + MEMORY at four points: before enter, after enter, after the scrolls, after exit.
//
// ★ THIS SCRIPT CHOOSES NOTHING AND RECOMMENDS NOTHING. No bound, no threshold, no "acceptable" or
// "concerning". tasks.md 7.1: "This task MEASURES and is FORBIDDEN from choosing the bounds" — 7.2 is
// the human decision gate for D-8's count-per-document / bytes-global / age-global values. No
// exit-code gate is emitted on any number here; only `perf-first-paint.ts` carries one, because
// <150 ms typical first paint is a SHIPPED M1 acceptance gate and nothing in this file is.
//
// ════ (d) GOES THROUGH THE REAL AFFORDANCE, AND THAT IS THE POINT ═══════════════════════════════
//
// `enterDiff` is not hand-called for the TOTAL number. The harness registers a diff context exactly
// as `appShell.installWatchForFile` does — `registerDiffContext(createDiffContext({ ..., showDiff:
// (host, before, after) => enterDiff(host, computeDiff(before, after)), hideDiff: exitDiff }))`,
// the same provisioning, byte-for-byte in shape — then mounts, so `mount()` builds 6.2's affordance
// through `buildDiffChrome` (gated on `isDiffContextRegistered()`). The measured gesture is a real
// `click` on the real pill, which opens the real picker over REAL `snapshotMeta` rows, and a real
// click on a real picker item, which runs `compareWith` → `fetchText` (real IndexedDB) →
// `showDiff`. The M5 seam rule — "built, tested, wired to nothing" was that milestone's recurring
// defect — applies to a measurement harness as much as to a test: a hand-called `enterDiff` would
// time a function nobody reaches that way.
//
// So (d) INCLUDES the IDB fetch of the snapshot text and the picker round-trip. That is the honest
// user-visible number, and it is reported as such rather than quietly trimmed to the fast part.
//
// ════ (a), (b), (c): HOW THE BREAKDOWN IS OBTAINED WITHOUT TOUCHING src/ ════════════════════════
//
// 7.1 is a measure-only task: no `src/` file is modified, so no instrumentation mark can be added
// inside `enterDiff`. The breakdown is therefore built from OUTSIDE, and how each part is obtained
// is stated rather than implied:
//
//   (a) DIRECT — `computeDiff(before, after)` is pure and exported; it is called and timed. This is
//       the same call `showDiff` makes, on the same two strings.
//   (b) REPLICATED, NOT INTERCEPTED — `renderHunk` runs `sanitize(parse(hunk.lines.join('\n')))`
//       per hunk (`diffView.ts:122`). The harness runs exactly that expression over exactly the
//       hunks (a) produced, summing the per-hunk cost. It is a faithful replica of production's own
//       line using production's own `parse` and `sanitize`; it is not the same invocation, and that
//       distinction is why this comment exists.
//   (c) DERIVED — `enterDiff(host, hunks)` is timed with the hunks PRECOMPUTED, and (b) is
//       subtracted. What remains is the template parse, `applyMediaPolicy`, the adopt/append, the
//       reading-anchor capture and the `data-diff` flip. A derived number is stated as derived.
//
// (a)+(b)+(c) will NOT sum to (d): (d) additionally carries the picker open, the `fetchMeta` and
// `fetchText` IDB round-trips, event dispatch and the browser's own style/layout for a newly
// appended 1 MB-scale subtree. The gap is real and is left visible rather than reconciled away.
//
// ════ THE FIXTURE IS DETERMINISTIC, AND ~5% CHANGED IS A CHOICE THIS FILE ARGUES ════════════════
//
// A diff's cost is a function of how much CHANGED, not just of document size: an all-changed diff
// and a nothing-changed diff at the same byte count do very different amounts of work. So the
// "before" document is generated from the "after" by rewriting every 20th line — 5% of lines,
// scattered evenly rather than clustered, with no randomness anywhere (no `Math.random`, no
// timestamps: the same two strings every run, so the 7 iterations differ only in machine noise).
//
// WHY 5%: it is the scale of an agent revising sections of a large document rather than rewriting
// it — the workload watch exists for. It is a FIXTURE PARAMETER, not a proposed threshold and not a
// claim about typical documents. A 50% fixture would produce larger numbers and a 1% fixture smaller
// ones; the number reported is the number for THIS fixture, and it says so.
//
// ════ MEMORY: DIRECTIONAL, NOT EXACT — READ THE CAVEATS BEFORE QUOTING ══════════════════════════
//
//   • `performance.memory` is CHROMIUM-ONLY and non-standard. There is no Firefox number here, as
//     there is no Firefox number anywhere in this milestone's harnesses.
//   • It reports the V8 heap. It does NOT include DOM node allocation, which for a diff of a 1 MB
//     document is a large share of the real cost. A small heap delta is therefore NOT evidence that
//     the diff is cheap in memory.
//   • Without `--enable-precise-memory-info` Chromium quantises `usedJSHeapSize` and updates it
//     lazily, which would make small deltas meaningless. The flag is passed (see `main`), which is
//     itself a deviation from the shipped browser configuration and is stated for that reason.
//   • It is GC-TIMING DEPENDENT. A collection between two reads can make a delta negative; a
//     collection that does not happen can make one look permanent. The exit-point reading in
//     particular says nothing about whether memory was RELEASED — only about whether it had been
//     reclaimed by the moment it was read.
//
// The numbers are reported with their spread across 7 iterations precisely so a reader can see how
// unstable they are, rather than being handed one confident median.
//
// ════ PROTOCOL ══════════════════════════════════════════════════════════════════════════════════
// 7 iterations, run 1 discarded as cold, MEDIAN of the warm 6, min/max as the spread — the M1
// standing protocol, unchanged so every number stays comparable to the recorded baselines.
//
// ENGINE: CHROMIUM ONLY (Playwright exposes no Firefox add-on installation API — recorded since M1).
// PORTS: this harness hosts nothing; it navigates to the extension's own `chrome-extension://` app
// page, so the Windows `EACCES ::1:63315` reserved-port collision (decisions.md 2026-07-21) cannot
// arise and no port override is involved.
//
// Runner: `tsx` (package script "perf:diff"), for the tsc/moduleResolution reason documented at the
// top of perf-first-paint.ts. esbuild comes from `tsx`'s own dependency, not from package.json —
// D-2 governs `dependencies` and 7.1 adds none.

import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildHugeDoc } from '../tests/golden/hugeDoc';

// --- Constants ---------------------------------------------------------------

/** Absolute path to the built Chrome MV3 extension Playwright will --load. */
const EXT_DIR = path.resolve('.output', 'chrome-mv3');

/** Total iterations; the FIRST run is printed but discarded from stats. */
const ITERATIONS = 7;

/** First heading buildHugeDoc() emits — the render-succeeded sanity marker. */
const EXPECTED_H1 = 'Peekover huge-document golden fixture';

/** Rewrite every Nth line to build the "before" document. 20 → 5% of lines changed. A FIXTURE
 *  PARAMETER, deliberately not a claim about real documents (see the header). */
const CHANGE_EVERY_NTH_LINE = 20;

/** How many 100px scrolls the interactive-frame cell performs, and by how much. */
const SCROLL_STEPS = 5;
const SCROLL_PX = 100;

// --- Types -------------------------------------------------------------------

/** One iteration's timings + memory trace, all times ms, all memory bytes. */
interface DiffMetrics {
  /** (a) computeDiff(before, after) — the engine alone. */
  engine: number;
  /** (b) Σ per-hunk sanitize(parse(...)) — the §3.8 pipeline, replicated over (a)'s hunks. */
  pipeline: number;
  /** enterDiff(host, precomputed hunks) — the input (c) is derived from. */
  enterOnly: number;
  /** (c) enterOnly − pipeline: DOM construction, media policy, anchor capture, attribute flip. */
  dom: number;
  /** (d) click on the affordance → `data-diff="active"` present and the diff sibling in the DOM. */
  totalEnter: number;
  /** (e) per-frame latency for each of SCROLL_STEPS scrolls, ms. */
  frames: number[];
  /** Hunk counts — the non-vacuity proof that a real diff was computed, not an empty one. */
  hunks: number;
  added: number;
  removed: number;
  unchanged: number;
  /** Blocks actually rendered into the diff sibling. */
  blocks: number;
  /** performance.memory.usedJSHeapSize at the four points (bytes), or null when unavailable. */
  memBeforeEnter: number | null;
  memAfterEnter: number | null;
  memAfterScroll: number | null;
  memAfterExit: number | null;
  /** Proof the reading column really was hidden and really came back. */
  readerHiddenDuringDiff: boolean;
  readerVisibleAfterExit: boolean;
  /** Picker rows the real affordance offered — proof the real gesture path ran. */
  pickerItems: number;
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

/** Signed byte delta, for the memory rows where the sign carries meaning (GC can make it negative). */
function fmtDelta(n: number | null): string {
  if (n === null) return 'n/a';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}${fmtBytes(Math.abs(n))}`;
}

function summarize(name: string, values: number[]): string {
  return `${name} median ${fmt(median(values))} (min ${fmt(Math.min(...values))}, max ${fmt(Math.max(...values))})`;
}

function summarizeBytes(name: string, values: number[]): string {
  return (
    `${name} median ${fmtDelta(median(values))} ` +
    `(min ${fmtDelta(Math.min(...values))}, max ${fmtDelta(Math.max(...values))})`
  );
}

/**
 * Build the "before" document from the "after" by rewriting every Nth line. Deterministic — no
 * randomness, no clock — so the same two strings are diffed on every iteration and every run.
 *
 * Rewriting rather than deleting keeps the line COUNT identical, so the diff is a clean scatter of
 * one-line removed/added pairs rather than a single large structural shift. That is the shape an
 * agent's revision pass produces, and it exercises many small hunks (the view's per-hunk pipeline
 * cost) rather than one huge one.
 */
function perturb(after: string, everyNth: number): { before: string; changedLines: number } {
  const lines = after.split('\n');
  let changed = 0;
  for (let i = 0; i < lines.length; i += everyNth) {
    lines[i] = `Prior revision of line ${i}.`;
    changed += 1;
  }
  return { before: lines.join('\n'), changedLines: changed };
}

/**
 * Build unless --no-build. A measurement harness that silently measures a STALE build is worse than
 * no harness (perf-theme-flash.ts's rule, kept).
 */
function ensureBuild(rebuild: boolean): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (rebuild) {
    console.log('[diff] running `pnpm build` (pass --no-build to measure against the existing .output/)...');
    execSync('pnpm build', { stdio: 'inherit' });
  } else if (!fs.existsSync(manifest)) {
    console.log(`[diff] --no-build given but no build at ${EXT_DIR} — building anyway.`);
    execSync('pnpm build', { stdio: 'inherit' });
  } else {
    console.log(`[diff] --no-build: using the EXISTING build at ${EXT_DIR}.`);
  }
  if (!fs.existsSync(manifest)) throw new Error(`build did not produce ${manifest}`);
}

/**
 * Bundle production's own diff + render + snapshot modules into one IIFE publishing
 * `globalThis.__peekoverPerf`. perf-watch.ts's argument for bundling, unchanged: the content script
 * runs in an isolated world and exports nothing, so the measured modules are bundled from the SAME
 * SOURCE the extension builds from and evaluated in the page. The honest residual is that this is
 * the production SOURCE, not the production BUILD ARTIFACT.
 *
 * NOTE WHAT THIS BUNDLE PROVES NOTHING ABOUT: the import fence (plan §1.4). This entry deliberately
 * pulls the engine and the view into ONE bundle for measurement; that says nothing about whether
 * `diff` reaches the shipped content script. The fence is pinned statically by
 * `diffEngine.test.ts` and by measured bytes on the built artifact (group 8) — never by this file.
 */
async function bundleProductionModules(): Promise<string> {
  const require_ = createRequire(import.meta.resolve('tsx'));
  const esbuildPath = pathToFileURL(require_.resolve('esbuild')).href;
  const esbuild = (await import(esbuildPath)) as {
    build(options: Record<string, unknown>): Promise<{ outputFiles?: { text: string }[] }>;
  };

  const entry = [
    "export { mount } from './src/render/mount';",
    "export { parse } from './src/render/parse';",
    "export { sanitize } from './src/render/sanitize';",
    "export { computeDiff } from './src/render/diffEngine';",
    "export { enterDiff, exitDiff, DIFF_HOST_ATTR, DIFF_ACTIVE, DIFF_VIEW_CLASS } from './src/render/diffView';",
    "export { DIFF_AFFORDANCE_CLASS, DIFF_PICKER_CLASS, DIFF_STATUS_CLASS } from './src/render/diffChrome';",
    "export { registerDiffContext, createDiffContext } from './src/render/diffRegistry';",
    "export { storeSnapshot, getSnapshotMeta, getSnapshotText } from './src/app/snapshots';",
    "export { eraseSnapshots } from './src/app/store';",
    "export { readerSourceFor } from './src/render/readerMode';",
    "export { resolveScrollContainer } from './src/render/scrollContainer';",
  ].join('\n');

  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts', sourcefile: 'perf-diff-entry.ts' },
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
  return `(() => {
${code}
globalThis.__peekoverPerf = __peekoverPerf;
globalThis.__pwFrame2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
globalThis.__pwSettle = async (el) => {
  let h = -1, t = -1, stable = 0;
  for (let i = 0; i < 600 && stable < 3; i += 1) {
    await new Promise((r) => requestAnimationFrame(r));
    if (el.scrollHeight === h && el.scrollTop === t) stable += 1;
    else { stable = 0; h = el.scrollHeight; t = el.scrollTop; }
  }
};
globalThis.__pwMem = () => (performance.memory ? performance.memory.usedJSHeapSize : null);
})()`;
}

// --- In-page instrumentation (STRINGS, per the house convention; every parameter INLINED rather
//     than passed as Playwright's `arg`, because a string is evaluated as an EXPRESSION and an arg
//     is silently never applied — measured at 005, and the failure is invisible). ----------------

/** Stash both fixture sources in the page once, rather than shipping 2 MB over CDP per iteration. */
function storeFixturesScript(before: string, after: string): string {
  return `(() => {
    globalThis.__pwBefore = ${JSON.stringify(before)};
    globalThis.__pwAfter = ${JSON.stringify(after)};
    return { before: globalThis.__pwBefore.length, after: globalThis.__pwAfter.length };
  })()`;
}

/**
 * Set the page up exactly as the app page does, then mount.
 *
 * ORDER IS LOAD-BEARING: `registerDiffContext` runs BEFORE `mount`, because `buildDiffChrome` gates
 * on `isDiffContextRegistered()` at BUILD time (D-14 — "a surface that registered no diff target
 * grows no diff chrome at all"). Registering after the mount would produce a page with no
 * affordance to click, and (d) would silently become unmeasurable.
 *
 * The context is provisioned with the SAME closures `appShell.installWatchForFile` provisions:
 * `showDiff: (host, before, after) => enterDiff(host, computeDiff(before, after))` and
 * `hideDiff: exitDiff` — the engine and the view reached over the fence as one coarse capability,
 * exactly as `diffRegistry.ts`'s header specifies. `fetchMeta`/`fetchText` are closures over the
 * real `getSnapshotMeta`/`getSnapshotText` against real IndexedDB, filtered to this docId, as the
 * production site does. `getCurrentSource` closes over `readerSourceFor(host)` — 1.3's getter.
 *
 * A REAL SNAPSHOT IS STORED through `storeSnapshot`, so the picker lists a real `snapshotMeta` row
 * and `fetchText` performs a real IDB read of a real 1 MB content row. The alternative — a stub
 * returning the string from memory — would delete the IDB round-trip from (d), which is exactly the
 * part of the user-visible cost a harness is most tempted to lose.
 */
const SETUP = String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  await P.eraseSnapshots();

  const pane = document.createElement('main');
  pane.className = 'peekover-app__reader';
  pane.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#fff;z-index:2147483646;';
  const host = document.createElement('div');
  pane.appendChild(host);
  document.body.appendChild(pane);
  globalThis.__pwPane = pane;
  globalThis.__pwHost = host;

  // SEP is U+0000 — via String.fromCharCode so no control byte exists in this source file
  // (AGENTS.md #control-chars; a literal NUL is invisible in every normal diff).
  const SEP = String.fromCharCode(0);
  const docId = 'perf-folder' + SEP + 'perf-diff.md';
  globalThis.__pwDocId = docId;

  // The real snapshot the picker will offer and fetchText will read back out of IndexedDB.
  await P.storeSnapshot(docId, globalThis.__pwBefore);

  P.registerDiffContext(P.createDiffContext({
    docId: docId,
    getCurrentSource: () => P.readerSourceFor(host),
    fetchMeta: async () => {
      const all = await P.getSnapshotMeta();
      const rec = all.find((m) => m.docId === docId);
      return rec ? rec.entries : [];
    },
    fetchText: (id) => P.getSnapshotText(id),
    showDiff: (h, before, after) => P.enterDiff(h, P.computeDiff(before, after)),
    hideDiff: (h) => P.exitDiff(h),
  }));

  // Mount AFTER the registration, so mount()'s chrome build sees a registered context (D-14).
  P.mount(globalThis.__pwAfter, host, { contained: true });
  await globalThis.__pwSettle(pane);

  const sr = host.shadowRoot;
  return {
    affordance: !!sr.querySelector('.' + P.DIFF_AFFORDANCE_CLASS),
    reader: !!sr.querySelector('.peekover-reader'),
    sections: sr.querySelector('.peekover-reader').querySelectorAll('h2').length,
    h1: sr.querySelector('.peekover-reader h1') ? sr.querySelector('.peekover-reader h1').textContent : null,
  };
})()
`;

/**
 * ONE iteration. Order and what each step is for:
 *
 *   1. read memory at rest (before enter);
 *   2. (a) time `computeDiff` on the two 1 MB strings, and keep the hunks;
 *   3. (b) time the per-hunk `sanitize(parse(...))` sum over those hunks — the replica of
 *      `renderHunk`'s pipeline line;
 *   4. time `enterDiff` with the hunks PRECOMPUTED, then exit again. (c) = that minus (b);
 *   5. (d) the REAL gesture: click the affordance pill, wait for the picker to populate from real
 *      snapshotMeta, click the first item, and wait until `data-diff="active"` is on the host AND
 *      the diff sibling is in the shadow root. Timed from the pill click;
 *   6. memory after enter;
 *   7. (e) five 100px scrolls with the diff on screen, each timed to the next animation frame;
 *   8. memory after the scrolls;
 *   9. exit via the pill's SECOND click — the same one control, whose gesture is EXIT while a diff
 *      is shown (6.2's two-state pill), not a hand-called `exitDiff`;
 *  10. memory after exit.
 *
 * Step 4 mutates the page (it enters and exits a diff) BEFORE step 5 measures the real path. That
 * is deliberate: it warms the same code paths for both, so (d) is not paying first-call JIT that
 * (a)–(c) already paid. It also means (d) is measured on a host that has already carried one diff —
 * stated, because it is the kind of ordering that quietly flatters a number.
 */
function measureScript(): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const host = globalThis.__pwHost;
  const pane = globalThis.__pwPane;
  const sr = host.shadowRoot;
  const before = globalThis.__pwBefore;
  const after = globalThis.__pwAfter;
  const frameNext = () => new Promise((r) => requestAnimationFrame(r));

  const memBeforeEnter = globalThis.__pwMem();

  // (a) THE ENGINE ALONE.
  const e0 = performance.now();
  const hunks = P.computeDiff(before, after);
  const engine = performance.now() - e0;

  let added = 0, removed = 0, unchanged = 0;
  for (const h of hunks) {
    if (h.kind === 'added') added += 1;
    else if (h.kind === 'removed') removed += 1;
    else unchanged += 1;
  }

  // (b) THE §3.8 PIPELINE, both sides — a REPLICA of renderHunk's own line, over the same hunks.
  const p0 = performance.now();
  for (const h of hunks) P.sanitize(P.parse(h.lines.join('\n')));
  const pipeline = performance.now() - p0;

  // enterDiff with hunks PRECOMPUTED — the input (c) is derived from. Exited immediately so the
  // real gesture below starts from the same state every iteration.
  const d0 = performance.now();
  const res = P.enterDiff(host, hunks);
  const enterOnly = performance.now() - d0;
  if (!res.ok) throw new Error('enterDiff (precomputed) failed: ' + res.reason);
  P.exitDiff(host);
  await globalThis.__pwSettle(pane);

  // (d) THE REAL 6.2 GESTURE PATH — pill click, picker, item click.
  const pill = sr.querySelector('.' + P.DIFF_AFFORDANCE_CLASS);
  const picker = sr.querySelector('.' + P.DIFF_PICKER_CLASS);
  if (!pill || !picker) throw new Error('affordance or picker missing from the shadow root');

  const t0 = performance.now();
  pill.click();
  // openPicker() is async (it awaits fetchMeta over IndexedDB): wait for the rows to arrive.
  for (let i = 0; i < 600 && picker.hidden; i += 1) await frameNext();
  const items = picker.querySelectorAll('.peekover-diff-picker__item');
  if (items.length === 0) {
    const status = sr.querySelector('.' + P.DIFF_STATUS_CLASS);
    throw new Error('the picker offered no snapshots' + (status ? ' — status says: ' + status.textContent : ''));
  }
  items[0].click();
  // compareWith() is async (fetchText over IndexedDB, then showDiff): wait for the diff to exist.
  for (let i = 0; i < 900; i += 1) {
    if (host.getAttribute(P.DIFF_HOST_ATTR) === P.DIFF_ACTIVE && sr.querySelector('.' + P.DIFF_VIEW_CLASS)) break;
    await frameNext();
  }
  const totalEnter = performance.now() - t0;
  if (host.getAttribute(P.DIFF_HOST_ATTR) !== P.DIFF_ACTIVE) {
    const status = sr.querySelector('.' + P.DIFF_STATUS_CLASS);
    throw new Error('the diff never became active' + (status ? ' — status says: ' + status.textContent : ''));
  }

  const view = sr.querySelector('.' + P.DIFF_VIEW_CLASS);
  const blocks = view ? view.childElementCount : 0;
  const readerEl = sr.querySelector('.peekover-reader');
  const readerHiddenDuringDiff = getComputedStyle(readerEl).display === 'none';

  const memAfterEnter = globalThis.__pwMem();

  // (e) INTERACTIVE FRAME TIMING with the diff on screen.
  const scroller = P.resolveScrollContainer(host, true);
  const frames = [];
  for (let i = 0; i < ${SCROLL_STEPS}; i += 1) {
    const s0 = performance.now();
    scroller.scrollTop = scroller.scrollTop + ${SCROLL_PX};
    await frameNext();
    frames.push(performance.now() - s0);
  }
  await globalThis.__pwSettle(scroller);

  const memAfterScroll = globalThis.__pwMem();

  // EXIT through the SAME pill — its gesture is EXIT while a diff is on screen (6.2's two states).
  pill.click();
  for (let i = 0; i < 600 && host.hasAttribute(P.DIFF_HOST_ATTR); i += 1) await frameNext();
  await globalThis.__pwSettle(pane);
  const readerVisibleAfterExit = getComputedStyle(sr.querySelector('.peekover-reader')).display !== 'none';

  const memAfterExit = globalThis.__pwMem();

  return {
    engine: engine, pipeline: pipeline, enterOnly: enterOnly, dom: enterOnly - pipeline,
    totalEnter: totalEnter, frames: frames,
    hunks: hunks.length, added: added, removed: removed, unchanged: unchanged, blocks: blocks,
    memBeforeEnter: memBeforeEnter, memAfterEnter: memAfterEnter,
    memAfterScroll: memAfterScroll, memAfterExit: memAfterExit,
    readerHiddenDuringDiff: readerHiddenDuringDiff, readerVisibleAfterExit: readerVisibleAfterExit,
    pickerItems: items.length,
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

/** Open a page, fail loudly on console errors, and publish the measurement bundle into it. */
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

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  ensureBuild(!argv.includes('--no-build'));

  console.log('[diff] bundling production diff + render + snapshot modules (esbuild via tsx)...');
  const bundle = await bundleProductionModules();
  console.log(`[diff] bundle ready (${fmtBytes(bundle.length)} of JS, fonts inlined as in the shipped build).`);

  // The 1 MB fixture — buildHugeDoc()'s own default, the SAME document every recorded baseline uses.
  const after = buildHugeDoc();
  const { before, changedLines } = perturb(after, CHANGE_EVERY_NTH_LINE);
  const totalLines = after.split('\n').length;

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-diffperf-udd-'));

  console.log(`[diff] fixture: ${fmtBytes(after.length)} "after" / ${fmtBytes(before.length)} "before"`);
  console.log(
    `[diff] deterministic perturbation: every ${CHANGE_EVERY_NTH_LINE}th line rewritten — ` +
      `${changedLines} of ${totalLines} lines (${((changedLines / totalLines) * 100).toFixed(1)}%). ` +
      `A FIXTURE PARAMETER, not a threshold and not a claim about real documents.`,
  );
  console.log(`[diff] extension: ${EXT_DIR}`);
  console.log(`[diff] iterations: ${ITERATIONS} (run 1 discarded as cold; median of the warm ${ITERATIONS - 1})`);
  console.log('[diff] engine: CHROMIUM ONLY — Playwright cannot load an extension into Firefox.');
  console.log('[diff] memory: performance.memory (Chromium-only, V8 heap only, GC-timing dependent).');
  console.log('       --enable-precise-memory-info is passed, which is itself a deviation from the');
  console.log('       shipped browser configuration; without it the deltas would be quantised.\n');

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${EXT_DIR}`,
      `--load-extension=${EXT_DIR}`,
      // See the memory caveat block in the header. Without this, usedJSHeapSize is bucketed and
      // lazily updated, and every delta below would be an artefact of the bucketing.
      '--enable-precise-memory-info',
    ],
  });

  const results: DiffMetrics[] = [];
  try {
    const extId = await extensionId(ctx);
    console.log(`[diff] extension id: ${extId}`);

    const errors: string[] = [];
    const page = await openInstrumented(ctx, `chrome-extension://${extId}/app.html`, bundle, errors);
    const sizes = (await page.evaluate(storeFixturesScript(before, after))) as { before: number; after: number };
    console.log(`[diff] fixtures in page: before ${sizes.before} chars, after ${sizes.after} chars`);

    const setup = (await page.evaluate(SETUP)) as {
      affordance: boolean;
      reader: boolean;
      sections: number;
      h1: string | null;
    };
    if (!setup.affordance) {
      throw new Error(
        'the diff affordance was not built. D-14 gates buildDiffChrome on isDiffContextRegistered(), ' +
          'so this means the registration did not happen before mount() — every (d) number would be unmeasurable.',
      );
    }
    if (setup.h1 !== EXPECTED_H1) throw new Error(`reader h1 mismatch — got ${JSON.stringify(setup.h1)}`);
    console.log(`[diff] setup ok: affordance present, reader rendered ${setup.sections} sections.\n`);

    for (let i = 1; i <= ITERATIONS; i += 1) {
      const m = (await page.evaluate(measureScript())) as DiffMetrics;

      // Non-vacuity: a diff that found nothing would make every timing below the cost of an empty
      // render. The fixture guarantees added+removed > 0; assert it rather than assume it.
      if (m.added === 0 || m.removed === 0) {
        throw new Error(
          `run ${i}: the diff found ${m.added} added / ${m.removed} removed hunks. The fixture is not ` +
            `producing a real diff, so every timing here would be the cost of a no-op. Refusing to report.`,
        );
      }
      if (!m.readerHiddenDuringDiff) throw new Error(`run ${i}: the reading column was NOT hidden while the diff showed.`);
      if (!m.readerVisibleAfterExit) throw new Error(`run ${i}: the reading column did not come back after exit.`);
      if (errors.length) throw new Error(`run ${i}: console error(s):\n  ${errors.join('\n  ')}`);

      results.push(m);
      console.log(
        `[run ${i}]${i === 1 ? ' (cold, discarded)' : '                  '} ` +
          `(a) engine ${fmt(m.engine)} | (b) pipeline ${fmt(m.pipeline)} | (c) DOM ${fmt(m.dom)} | ` +
          `(d) TOTAL enter ${fmt(m.totalEnter)} | (e) frames ${m.frames.map((f) => f.toFixed(1)).join('/')}ms | ` +
          `${m.hunks} hunks (${m.added}+ ${m.removed}- ${m.unchanged}=) -> ${m.blocks} blocks | ` +
          `heap ${m.memBeforeEnter === null ? 'n/a' : fmtBytes(m.memBeforeEnter)} -> ` +
          `${m.memAfterEnter === null ? 'n/a' : fmtBytes(m.memAfterEnter)}`,
      );
    }

    await page.evaluate('globalThis.__peekoverPerf.eraseSnapshots()');
    await page.close();
  } finally {
    await ctx.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // --- Summary ---------------------------------------------------------------

  const warm = results.slice(1);
  console.log(`\n=== SUMMARY (run 1 excluded; n=${warm.length}) ===`);

  console.log('\n--- TIMINGS at 1 MB ---');
  console.log(`  ${summarize('(a) computeDiff — engine alone       ', warm.map((m) => m.engine))}`);
  console.log(`  ${summarize('(b) parse+sanitize, all hunks        ', warm.map((m) => m.pipeline))}`);
  console.log(`  ${summarize('    enterDiff(precomputed hunks)     ', warm.map((m) => m.enterOnly))}`);
  console.log(`  ${summarize('(c) DOM construction  [DERIVED: enterDiff - (b)]', warm.map((m) => m.dom))}`);
  console.log(`  ${summarize('(d) TOTAL enter, real affordance path', warm.map((m) => m.totalEnter))}`);

  const allFrames = warm.flatMap((m) => m.frames);
  console.log(`  ${summarize('(e) scroll frame latency (all frames)', allFrames)}`);
  for (let s = 0; s < SCROLL_STEPS; s += 1) {
    console.log(`      ${summarize(`    scroll ${s + 1} of ${SCROLL_STEPS}`.padEnd(36), warm.map((m) => m.frames[s]))}`);
  }

  console.log('\n--- MEMORY (Chromium performance.memory — DIRECTIONAL, NOT EXACT; see the caveats) ---');
  const memAt = (pick: (m: DiffMetrics) => number | null): number[] | null => {
    const v = warm.map(pick);
    return v.some((x) => x === null) ? null : (v as number[]);
  };
  const b = memAt((m) => m.memBeforeEnter);
  const ae = memAt((m) => m.memAfterEnter);
  const as = memAt((m) => m.memAfterScroll);
  const ax = memAt((m) => m.memAfterExit);
  if (!b || !ae || !as || !ax) {
    console.log('  performance.memory unavailable in this run — no memory numbers reported (none faked).');
  } else {
    console.log(`  usedJSHeapSize at rest (before enter): median ${fmtBytes(median(b))}`);
    console.log(`  ${summarizeBytes('delta: before enter -> after enter  ', ae.map((v, i) => v - b[i]))}`);
    console.log(`  ${summarizeBytes('delta: after enter  -> after scroll ', as.map((v, i) => v - ae[i]))}`);
    console.log(`  ${summarizeBytes('delta: after scroll -> after exit   ', ax.map((v, i) => v - as[i]))}`);
    console.log(`  ${summarizeBytes('net:   before enter -> after exit   ', ax.map((v, i) => v - b[i]))}`);
    console.log(`  raw per-run usedJSHeapSize (before/after-enter/after-scroll/after-exit), bytes:`);
    warm.forEach((m, i) => {
      console.log(
        `    run ${i + 2}: ${m.memBeforeEnter} / ${m.memAfterEnter} / ${m.memAfterScroll} / ${m.memAfterExit}`,
      );
    });
  }

  console.log('\n--- FIXTURE / NON-VACUITY ---');
  const m0 = warm[0];
  console.log(
    `  ${m0.hunks} hunks (${m0.added} added, ${m0.removed} removed, ${m0.unchanged} unchanged) → ` +
      `${m0.blocks} rendered blocks; the picker offered ${m0.pickerItems} snapshot(s) from real IndexedDB.`,
  );
  console.log('  Every run asserted: added>0, removed>0, the reading column hidden during the diff and');
  console.log('  visible after exit. A diff that found nothing would have thrown rather than reported.');

  console.log(`
=== WHAT THESE NUMBERS DO AND DO NOT LICENSE ===

(d) IS THE USER-VISIBLE NUMBER and it goes through the REAL 6.2 path: a click on the real affordance
    pill, a picker populated from real snapshotMeta rows, a click on a real item, fetchText reading a
    real 1 MB content row out of real IndexedDB, then showDiff. It therefore INCLUDES two IDB
    round-trips and event dispatch. (a)+(b)+(c) do not sum to it, and the gap is that work plus the
    browser's own style/layout for the appended subtree. The gap is left visible, not reconciled.

(c) IS DERIVED, not measured directly: enterDiff-with-precomputed-hunks minus (b). 7.1 is a
    measure-only task, so no mark could be added inside enterDiff. (b) is likewise a REPLICA of
    renderHunk's own parse+sanitize line over the same hunks, not an interception of it.

THE FIXTURE'S CHANGE RATE IS A PARAMETER, NOT A FINDING. ~5% of lines rewritten, deterministically,
    evenly scattered. A different change rate produces different numbers; nothing here claims 5% is
    typical, and nothing here should be read as a bound on how much change a diff can absorb.

MEMORY IS DIRECTIONAL. Chromium-only, V8 heap only (DOM nodes are NOT counted — a large share of a
    1 MB diff's real cost is invisible to it), GC-timing dependent, and measured with a non-default
    browser flag. Spread is printed alongside every median so the instability is visible.

CHROMIUM ONLY. No Firefox number exists here or anywhere else in this milestone's harnesses —
    Playwright cannot load an extension into Firefox. Firefox diff behaviour is evidenced only by
    the group-9 human gate.

NO THRESHOLD IS ASSERTED. NO BOUND IS CHOSEN OR RECOMMENDED — not count-per-document, not
bytes-global, not age-global (D-8; the axes are already fixed by D-16). 7.2 is the human decision
gate. This script emits no exit-code gate on anything.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
