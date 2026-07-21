// scripts/perf-watch.ts — spec 005 task 5.1 measurement (NOT wired into CI).
//
// TWO NUMBERS THIS MILESTONE HAS CARRIED AS UNKNOWNS SINCE THE TASK-0 PROBE.
//
//   (a) OBSERVER LATENCY — mark -> PROGRAMMATIC write -> `ChangeDetector` callback, with NO
//       human in the loop. The probe's single 5127 ms sample is HUMAN REACTION TIME (click
//       MARK, alt-tab, type a command) and decisions.md says in as many words: "do not quote a
//       number". This replaces it with a clean one.
//   (b) RE-RENDER COST at 50 KB and 1 MB, through the SHIPPED watch path —
//       `mount(text, host, { preserveReading: true })`. `mount()` is synchronous with no
//       scheduling and no abort, so this is the length of the window in which nothing can
//       scroll, fire or cancel. It is the number the debounce decision actually turns on.
//
// NO THRESHOLD IS ASSERTED AND NO DEBOUNCE WINDOW IS CHOSEN HERE (standing M1 retro rule, and
// tasks.md 5.1 states it twice). 5.2 is a HUMAN decision gate; 5.3 implements what it decides.
// The split is load-bearing: in 004, task 4.1 was forbidden from choosing and flagged its own
// inference as untested — which is the only reason 4.2's re-measure caught a design that
// breached the budget on every cold open. Nothing below recommends a number.
//
// ════ (a) IS AN INFERENCE ABOUT LOCAL DISK, NOT A MEASUREMENT OF IT. READ THIS BEFORE QUOTING.
//
// `FileSystemObserver.observe()` needs a `FileSystemHandle`, and the ONLY handle obtainable
// with no human is OPFS (`navigator.storage.getDirectory()`) — task 1.2 measured that this
// works in Chromium and fires a real `["modified"]` record. `showDirectoryPicker` needs a user
// gesture and opens a native dialog Playwright cannot drive (recorded M2 harness limit), so
// there is no automated route to a LOCAL-DISK handle. None was faked.
//
// But OPFS is BROWSER-MANAGED STORAGE, not local disk: same-origin, no filesystem watcher, no
// editor doing an atomic rename, no antivirus filter driver, no OS notification queue. Its
// write->callback path may be nothing like a real file rewritten by an agent. So the number
// below bounds the observer's IN-BROWSER dispatch cost and licenses NOTHING about local disk.
//
// THIS IS RETRO FINDING 2's EXACT SHAPE, and that entry exists so it is not repeated silently:
// 004's isolated settings probe predicted ~26 ms and the real content-script path measured
// ~72 ms — the probe under-predicted by ~13x. Treat (a) the same way.
//   -> WHERE THE REAL NUMBER COMES FROM: the human milestone gate (7.1), on a real local file
//      rewritten by a real agent, on a fresh production build. Recorded as discovered task 5.1a
//      in specs/005-watch-diff/tasks.md. It does NOT block 5.2 — see that task for why.
//
// ════ (b) IS MEASURED ON THE SHIPPED PATH, AND HOW IT GETS THERE MATTERS ════════════════════
//
// The measured function is production's own `mount()`, with `preserveReading: true`, in a REAL
// headless Chromium, on the REAL host the production content script built (`<peekover-root>`,
// open shadow root, production reader CSS, real full-page geometry) after a real `file://`
// navigation of the fixture. Both surfaces are measured, because the mount seam serves both and
// they resolve DIFFERENT scroll containers (task 3.1's trap):
//   full-page — the content-script takeover, `:host{position:fixed;inset:0}` IS the scroll box.
//               Comparable to the recorded first-paint baselines, which are taken here.
//   contained — `<main class="peekover-app__reader">` (overflow:auto) around the host, the
//               app-page pane. THIS IS THE SURFACE THE DECISION GOVERNS: `watchController` — the
//               only caller that ever sets `preserveReading` — is wired ONLY by `appShell.ts`
//               (the content script registers task 4.1's thin detector adapter, which does not
//               re-render at all; see decisions.md 2026-07-21, 4.6 finding (2)).
//
// WHY A BUNDLE, AND WHAT THAT COSTS IN FIDELITY. `mount()` is not reachable from the main world:
// the content script runs in an isolated world and exports nothing. So this harness bundles the
// SAME SOURCE the extension builds from (`src/render/mount.ts` and its graph, minified, fonts
// inlined exactly as the shipped build inlines them) with esbuild, and evaluates it in the page.
// The honest residual: this is the production SOURCE, not the production BUILD ARTIFACT — a
// different bundler with different chunking. Nothing measured below depends on chunk layout, and
// the alternative (a test-only export in shipped code) is forbidden — no measurement-only code
// ships, established when task 4.2 removed 4.1's marks.
// The bundle carries its OWN module state, so `buildWatchChrome(host)` finds no registered watch
// target and returns []: the measured mount omits ONE small chrome element that a live watch
// would build. Stated, not hidden; it is a pill, not a fifth of the document.
//
// esbuild is reached through `tsx`'s own dependency (`createRequire(import.meta.resolve('tsx'))`)
// rather than added to package.json. D-2 governs `dependencies` and this is not one — but a new
// devDependency for a measurement harness is still scope this task was not given, so the
// existing one is reused. If `tsx` ever stops bundling esbuild this line is the thing that
// breaks, loudly, at build time.
//
// ════ PROTOCOL ══════════════════════════════════════════════════════════════════════════════
// 7 iterations per cell, run 1 discarded as cold, MEDIAN of the warm 6, min/max as the spread —
// unchanged since M1 so every number stays comparable to the recorded baselines. Deviating
// silently would make every past baseline incomparable.
//
// ENGINE: CHROMIUM ONLY, for two independent reasons, both already recorded. Playwright exposes
// no Firefox add-on installation API (perf-first-paint.ts, perf-theme-flash.ts, harness ledger),
// and `FileSystemObserver` does not exist on Firefox at all (measured at task 1.2) — Firefox
// never takes the observer path in production either. Firefox re-render cost is therefore
// unmeasured here and is evidenced only by the 7.1 human gate. No Firefox number is faked.
//
// Runner: `tsx` (package script "perf:watch"), for the tsc/moduleResolution reason documented at
// the top of perf-first-paint.ts.

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

/** Where the reader is parked before a measured re-render, as a fraction of the scrollable
 *  height. Mid-document on purpose: at the top the anchor capture picks nothing and at the
 *  bottom it picks the last heading, and neither exercises the ladder the way a reader who is
 *  actually reading does. */
const READ_POSITION = 0.4;

/** How long a single observer callback may take before the run is called vacuous. Generous:
 *  the point of the bound is to fail loudly rather than hang, not to judge the latency. */
const OBSERVER_TIMEOUT_MS = 30_000;

// --- Types -------------------------------------------------------------------

type Surface = 'full-page' | 'contained';

/** One re-render iteration, all times in ms, measured in-page with performance.now(). */
interface RenderMetrics {
  /** `sanitize(parse(text))` alone — the pure pipeline half, upstream of any DOM. */
  pure: number;
  /** `mount(text, host, { contained })` — no continuity. The A/B control for the anchor's cost. */
  plain: number;
  /** Plain-mount start -> 2nd rAF. The like-for-like control for `frame`: a plain mount defers
   *  the layout that `preserveReading` forces synchronously, so only these two are comparable. */
  plainFrame: number;
  /** `mount(text, host, { contained, preserveReading: true })` — THE SHIPPED WATCH PATH. */
  preserve: number;
  /** Preserve-mount start -> 2nd rAF: the whole window in which the page cannot respond. */
  frame: number;
  /** How far the reader moved across the PRESERVE mount (px). Near-zero = the anchor worked. */
  preserveDrift: number;
  /** How far the reader moved across the PLAIN mount (px). The non-vacuity control: if this is
   *  also near zero the engine is holding the position by itself and `preserveDrift` proves
   *  nothing (the exact vacuous shape task 3.3's red-first pass caught). */
  plainDrift: number;
  /** Rendered `<h2>` count after the measured mount — the render-succeeded proof. */
  sections: number;
  /** Rendered `<h1>` text — the other half of that proof. */
  h1: string | null;
  /** Where the reader was parked before each mount, and the box it was parked in. A parked
   *  position of 0 means the park did not take and every drift number is meaningless. */
  parkedPlain: number;
  parkedPreserve: number;
  scrollHeight: number;
  clientHeight: number;
}

/** One observer iteration, all times in ms. */
interface ObserverMetrics {
  /** createWritable -> write -> close, i.e. the cost of PRODUCING the change. Not the latency. */
  write: number;
  /** close() resolved -> the detector's `cb(text)` fired. THE LATENCY NUMBER. */
  latency: number;
  /** write start -> callback. What a naive stopwatch around "change the file" would report. */
  total: number;
  /** Length of the text the callback delivered — proof it read the NEW content, not a stale one. */
  delivered: number;
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

/** Same deterministic target-bytes -> section-count mapping the other perf scripts use, so the
 *  50 KB and 1 MB fixtures here are the SAME documents the first-paint baselines were taken on. */
function sectionsForBytes(target: number): number {
  const a = buildHugeDoc(100).length;
  const b = buildHugeDoc(200).length;
  const bytesPerSection = (b - a) / 100;
  const header = a - bytesPerSection * 100;
  return Math.max(1, Math.round((target - header) / bytesPerSection));
}

/**
 * Build unless --no-build. A measurement harness that silently measures a STALE build is worse
 * than no harness (perf-theme-flash.ts's rule, kept). The build supplies the HOST this harness
 * measures on — the production content script's real `<peekover-root>` — not the measured
 * `mount()` itself, which is bundled from source below.
 */
function ensureBuild(rebuild: boolean): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (rebuild) {
    console.log('[watch] running `pnpm build` (pass --no-build to measure against the existing .output/)...');
    execSync('pnpm build', { stdio: 'inherit' });
  } else if (!fs.existsSync(manifest)) {
    console.log(`[watch] --no-build given but no build at ${EXT_DIR} — building anyway.`);
    execSync('pnpm build', { stdio: 'inherit' });
  } else {
    console.log(`[watch] --no-build: using the EXISTING build at ${EXT_DIR} for the host page.`);
  }
  if (!fs.existsSync(manifest)) throw new Error(`build did not produce ${manifest}`);
}

/**
 * Bundle production's own render + watch modules into one IIFE that publishes
 * `globalThis.__peekoverPerf`. See the header for why a bundle, and what fidelity it costs.
 *
 * The `?inline` font imports are Vite's syntax (src/theme/fonts.ts), which esbuild does not
 * know: the plugin strips the query and the `dataurl` loader reproduces exactly what Vite's
 * `?inline` produces — a data-URL default export. So the reader CSS this harness mounts carries
 * the same inlined @font-face payload the shipped build does, rather than a different one.
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
    "export { resolveScrollContainer } from './src/render/scrollContainer';",
    "export { observerDetector } from './src/watch/observerDetector';",
  ].join('\n');

  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts', sourcefile: 'perf-watch-entry.ts' },
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
  // Wrapped so the IIFE's `var __peekoverPerf` binding is published no matter what scope
  // Playwright evaluates the string in, plus the two in-page waits every cell needs.
  return `(() => {
${code}
globalThis.__peekoverPerf = __peekoverPerf;
globalThis.__pwFrame2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
// SETTLE, NOT OVERFLOW — the 3.2 lesson, applied to a measurement harness. The reader is still
// restyling when it first overflows (measured: scrollHeight 81798 px at first overflow, 26069 px
// once settled, a 3x reflow), and a scrollTop write in that window CLAMPS to a stale maximum and
// silently parks the reader at the document bottom. So wait for the geometry to STOP MOVING.
globalThis.__pwSettle = async (el) => {
  let h = -1, t = -1, stable = 0;
  for (let i = 0; i < 600 && stable < 3; i += 1) {
    await new Promise((r) => requestAnimationFrame(r));
    if (el.scrollHeight === h && el.scrollTop === t) stable += 1;
    else { stable = 0; h = el.scrollHeight; t = el.scrollTop; }
  }
};
})()`;
}

// --- In-page measurement (passed as STRINGS, per the house convention: tsc/eslint do not parse
//     browser globals here, and the same convention carries perf-first-paint's and
//     perf-theme-flash's instrumentation).
//
//     EVERY parameter is INLINED into the source rather than passed as Playwright's `arg`.
//     Measured, not assumed: `page.evaluate(functionString, arg)` silently returns `undefined`
//     here — a string is evaluated as an EXPRESSION, so `(async (a) => {...})` yields a function
//     object and the arg is never applied. That failure is invisible (no throw, just an undefined
//     result), so the whole harness passes values the one way that cannot misfire. ------------

/** Stash the fixture source in the page once, rather than shipping 1 MB over CDP per iteration. */
function storeFixtureScript(source: string): string {
  return `(() => { globalThis.__pwText = ${JSON.stringify(source)}; return globalThis.__pwText.length; })()`;
}

/**
 * Build the CONTAINED surface: the app page's real shape — `<main class="peekover-app__reader">`
 * with `overflow:auto` around the host, which is what `resolveScrollContainer` must walk to.
 *
 * TASK 4.2's HARNESS DEFECT, NOT REPEATED HERE: mounting a bare div makes the resolver take its
 * documented degenerate-mount fallback to the host, which in normal flow grows to its content and
 * NEVER SCROLLS — every geometry number would then be measured against an immovable box. The
 * production full-page host is hidden (inline style beats the shadow `:host` rule) so the two
 * surfaces are never laid out at once.
 */
const BUILD_CONTAINED = String.raw`
(async () => {
  const prod = document.querySelector('peekover-root');
  if (prod) prod.style.display = 'none';
  const pane = document.createElement('main');
  pane.className = 'peekover-app__reader';
  pane.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#fff;z-index:2147483646;';
  const host = document.createElement('div');
  pane.appendChild(host);
  document.body.appendChild(pane);
  globalThis.__pwHost = host;
  // Prime it with a real first render so the measured re-renders have a previous document to
  // capture an anchor FROM — a first mount with the flag set has nothing to preserve.
  globalThis.__peekoverPerf.mount(globalThis.__pwText, host, { contained: true });
  await globalThis.__pwSettle(pane);
  return { scrolls: pane.scrollHeight > pane.clientHeight, scrollHeight: pane.scrollHeight };
})()
`;

/** Point `__pwHost` at the production content-script host for the full-page cells. */
const USE_FULL_PAGE = String.raw`
(async () => {
  const host = document.querySelector('peekover-root');
  if (!host) throw new Error('no <peekover-root> — the content script did not mount');
  globalThis.__pwHost = host;
  await globalThis.__pwSettle(host);
  return { scrolls: host.scrollHeight > host.clientHeight, scrollHeight: host.scrollHeight };
})()
`;

/**
 * ONE re-render iteration. Order matters and is deliberate:
 *   1. park the reader mid-document and let the geometry SETTLE (so the anchor has real work);
 *   2. time `sanitize(parse(text))` alone — the pure half, upstream of any DOM;
 *   3. time a PLAIN mount, AND its window out to the 2nd rAF — the control for BOTH numbers;
 *   4. re-park, then time the SHIPPED `preserveReading` mount and ITS window to the 2nd rAF.
 *
 * WHY BOTH A SYNCHRONOUS TIME AND A TO-2nd-rAF TIME, and this is the difference between two
 * opposite conclusions for 5.2: `preserveReading` reads `getBoundingClientRect` after the commit,
 * which FORCES SYNCHRONOUS LAYOUT of the new document inside `mount()`. A plain mount defers that
 * same layout to the browser's next frame. So comparing the two SYNCHRONOUS times alone would
 * credit the anchor with work the plain path also pays, just later. The to-2nd-rAF pair is the
 * like-for-like comparison — the whole span in which the page cannot respond either way.
 *
 * THE CHANGE IS INSERTED ABOVE, NOT APPENDED, and that is a correctness requirement of this
 * harness rather than a flourish. Appending is the case `scrollTop` already gets right: the engine
 * leaves `scrollTop` alone when `replaceChildren` leaves the box tall enough, so BOTH mounts drift
 * 0 px and the control proves nothing — measured in the first run of this script, and the same
 * vacuous shape task 3.3's red-first pass caught. With content inserted above, a plain mount holds
 * `scrollTop` (and so shows the reader different content) while the anchor MOVES it to keep the
 * same heading in place. `preserveDrift` >> `plainDrift` is therefore the evidence that the
 * continuity path ran at all — without which the cost below could be the cost of a no-op.
 */
function measureScript(contained: boolean, tick: number): string {
  return String.raw`
(async () => {
  const P = globalThis.__peekoverPerf;
  const host = globalThis.__pwHost;
  const contained = ${contained};
  const base = globalThis.__pwText;
  const scroller = P.resolveScrollContainer(host, contained);
  const park = async () => {
    scroller.scrollTop = Math.round(scroller.scrollHeight * ${READ_POSITION});
    await globalThis.__pwSettle(scroller);
  };
  // THE SAME BLOCK, MOVED — not two different documents. Both mounts render an identical byte
  // count, paragraph count and heading set, so their render costs are comparable; the ONLY
  // difference is WHERE the block sits, which is what makes the geometry shift.
  //   plain   <- block BELOW the reading position (an append: the case raw scrollTop gets right)
  //   preserve<- block ABOVE it (the case D-3 exists for: an agent inserting above you)
  // Going A -> B pushes every heading down by the block's height, so a correct anchor MUST move
  // scrollTop and a plain mount must not. That difference is the non-vacuity control below.
  //
  // The first draft of this harness inserted the block above for BOTH mounts and measured 0 px of
  // drift on every cell — the two documents had identical geometry, so there was nothing for the
  // anchor to correct and the control could never have gone positive. Same lesson as task 3.3's
  // red-first pass: an assertion satisfied by the fixture rather than by the code.
  const block = (label) => {
    let out = 'Watch tick ' + label + '.\n\n';
    for (let i = 0; i < 60; i += 1) out += 'Shift line ' + i + ' for tick ' + label + '.\n\n';
    return out;
  };

  const textA = base + '\n\n' + block('${tick}a'); // appended BELOW
  const textB = block('${tick}b') + '\n\n' + base; // inserted ABOVE

  const p0 = performance.now();
  P.sanitize(P.parse(textA));
  const pure = performance.now() - p0;

  await park();
  const beforePlain = scroller.scrollTop;
  const a0 = performance.now();
  P.mount(textA, host, { contained: contained });
  const plain = performance.now() - a0;
  await globalThis.__pwFrame2();
  const plainFrame = performance.now() - a0;
  // DRIFT IS READ AFTER A SETTLE, NEVER AT THE 2nd rAF, and the two surfaces are why: the
  // full-page ':host' is scroll-behavior:smooth, so the anchor's scrollTop write ANIMATES and has
  // moved ~2 px by the 2nd rAF, while the contained pane is 'auto' and has already jumped the full
  // 2738 px. Reading drift on the timing frame therefore reports "the anchor did nothing" on
  // exactly one surface — a plausible wrong answer, not an error. The timing numbers above are
  // already captured, so waiting here costs them nothing.
  await globalThis.__pwSettle(scroller);
  const plainDrift = Math.abs(scroller.scrollTop - beforePlain);

  await park();
  const beforePreserve = scroller.scrollTop;
  const b0 = performance.now();
  P.mount(textB, host, { contained: contained, preserveReading: true });
  const preserve = performance.now() - b0;
  await globalThis.__pwFrame2();
  const frame = performance.now() - b0;
  await globalThis.__pwSettle(scroller); // see the note on plainDrift — smooth vs auto per surface
  const preserveDrift = Math.abs(scroller.scrollTop - beforePreserve);

  const reader = host.shadowRoot.querySelector('.peekover-reader');
  const h1 = reader && reader.querySelector('h1') ? reader.querySelector('h1').textContent : null;
  return {
    pure: pure, plain: plain, plainFrame: plainFrame, preserve: preserve, frame: frame,
    plainDrift: plainDrift, preserveDrift: preserveDrift,
    parkedPlain: beforePlain, parkedPreserve: beforePreserve,
    scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
    sections: reader ? reader.querySelectorAll('h2').length : 0, h1: h1,
  };
})()
`;
}

/**
 * OBSERVER LATENCY over OPFS, through production's own `observerDetector` — not a bare
 * `FileSystemObserver`. That is deliberate: what watch actually waits for is the DETECTOR's
 * `cb(text)`, which fires only after `getFile().text()` has resolved and the content comparison
 * has passed, so timing the raw record would report a number production never experiences.
 *
 * The handshake write before the loop is not politeness — `observerDetector.start()` establishes
 * `observe()` ASYNCHRONOUSLY, so a write issued immediately can land before the observation
 * exists and be missed. Waiting for one real callback proves the instrument is live before any
 * number is taken; a run where it never arrives is an ERROR, not a slow latency.
 */
function measureObserverScript(iterations: number): string {
  return String.raw`
(async () => {
  if (typeof FileSystemObserver === 'undefined') return { unavailable: 'FileSystemObserver is undefined' };
  const P = globalThis.__peekoverPerf;
  const base = globalThis.__pwText;
  const dir = await navigator.storage.getDirectory();
  const handle = await dir.getFileHandle('peekover-perf-watch.md', { create: true });

  const write = async (content) => {
    const w = await handle.createWritable();
    await w.write(content);
    await w.close();
  };
  await write(base);

  let pending = null;
  const det = P.observerDetector(handle);
  det.start((text) => { const t = performance.now(); if (pending) { const p = pending; pending = null; p({ t: t, len: text.length }); } });

  const await1 = (label) => new Promise((res, rej) => {
    pending = res;
    setTimeout(() => rej(new Error(label + ': no callback within ${OBSERVER_TIMEOUT_MS} ms')), ${OBSERVER_TIMEOUT_MS});
  });

  const runs = [];
  try {
    // Handshake: prove the observation is live before measuring anything.
    const hs = await1('handshake');
    await write(base + '\n\nHandshake.\n');
    await hs;

    for (let i = 1; i <= ${iterations}; i += 1) {
      const content = base + '\n\nWatch tick ' + i + '.\n';
      const p = await1('run ' + i);
      const w0 = performance.now();
      await write(content);
      const w1 = performance.now();
      const r = await p;
      runs.push({ write: w1 - w0, latency: r.t - w1, total: r.t - w0, delivered: r.len });
    }

    // Per-tick READ cost — the polled path's real per-tick work (the whole file, every tick).
    // Context, not a driver: debounce coalesces RENDERS, not reads.
    const reads = [];
    for (let i = 0; i < ${iterations}; i += 1) {
      const t = performance.now();
      const f = await handle.getFile();
      await f.text();
      reads.push(performance.now() - t);
    }
    return { runs: runs, reads: reads };
  } finally {
    det.stop();
    try { await dir.removeEntry('peekover-perf-watch.md'); } catch (e) { void e; }
  }
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
 *  `page.evaluate` goes through CDP and so is not subject to the page's CSP — which matters on
 *  the extension origin, where an injected inline <script> would simply be blocked. */
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

/** Re-render cost for one (fixture x surface) cell. */
async function runRenderCell(
  page: Page,
  fixture: { name: string; sections: number },
  surface: Surface,
  errors: string[],
): Promise<RenderMetrics[]> {
  console.log(`\n--- CELL: re-render · ${fixture.name} · ${surface} ---`);
  const box = (await page.evaluate(surface === 'contained' ? BUILD_CONTAINED : USE_FULL_PAGE)) as {
    scrolls: boolean;
    scrollHeight: number;
  };
  if (!box.scrolls) {
    throw new Error(
      `${fixture.name}/${surface}: the resolved scroll box does not scroll ` +
        `(scrollHeight ${box.scrollHeight}). Every drift number below would be measured against an ` +
        `immovable box — the task-4.2 harness defect. Refusing to report.`,
    );
  }

  const out: RenderMetrics[] = [];
  for (let i = 1; i <= ITERATIONS; i += 1) {
    const m = (await page.evaluate(measureScript(surface === 'contained', i))) as RenderMetrics;
    if (m.h1 !== EXPECTED_H1) {
      throw new Error(`${fixture.name}/${surface} run ${i}: reader h1 mismatch — got ${JSON.stringify(m.h1)}`);
    }
    if (m.sections < fixture.sections) {
      throw new Error(`${fixture.name}/${surface} run ${i}: only ${m.sections} sections rendered (< ${fixture.sections})`);
    }
    if (errors.length) {
      throw new Error(`${fixture.name}/${surface} run ${i}: console error(s):\n  ${errors.join('\n  ')}`);
    }
    out.push(m);
    console.log(
      `[run ${i}]${i === 1 ? ' (cold, discarded)' : '                  '} ` +
        `preserve ${fmt(m.preserve)} (->2nd rAF ${fmt(m.frame)}) | plain ${fmt(m.plain)} (->2nd rAF ${fmt(m.plainFrame)}) | ` +
        `parse+sanitize ${fmt(m.pure)} | parked ${m.parkedPlain.toFixed(0)}/${m.parkedPreserve.toFixed(0)} of ${m.scrollHeight.toFixed(0)}px | ` +
        `drift preserve ${m.preserveDrift.toFixed(0)}px vs plain ${m.plainDrift.toFixed(0)}px`,
    );
  }
  return out.slice(1);
}

/** Observer latency + per-tick read cost for one fixture, on OPFS. */
async function runObserverCell(
  page: Page,
  fixture: { name: string },
): Promise<{ runs: ObserverMetrics[]; reads: number[] }> {
  console.log(`\n--- CELL: observer latency (OPFS) · ${fixture.name} ---`);
  const r = (await page.evaluate(measureObserverScript(ITERATIONS))) as {
    unavailable?: string;
    runs?: ObserverMetrics[];
    reads?: number[];
  };
  if (r.unavailable) throw new Error(`observer cell: ${r.unavailable}`);
  const runs = r.runs ?? [];
  const reads = r.reads ?? [];
  runs.forEach((m, i) => {
    console.log(
      `[run ${i + 1}]${i === 0 ? ' (cold, discarded)' : '                  '} ` +
        `latency ${fmt(m.latency)} | write ${fmt(m.write)} | write->cb ${fmt(m.total)} | delivered ${m.delivered} chars`,
    );
  });
  return { runs: runs.slice(1), reads: reads.slice(1) };
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  ensureBuild(!argv.includes('--no-build'));

  console.log('[watch] bundling production render + watch modules (esbuild via tsx)...');
  const bundle = await bundleProductionModules();
  console.log(`[watch] bundle ready (${fmtBytes(bundle.length)} of JS, fonts inlined as in the shipped build).`);

  // The two fixtures tasks.md names, built by the SAME generator the first-paint baselines use.
  const smallSections = sectionsForBytes(50 * 1024);
  const specs = [
    { name: '50kb', sections: smallSections, source: buildHugeDoc(smallSections) },
    { name: '1mb', sections: HUGE_DOC_SECTIONS, source: buildHugeDoc() },
  ];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-watchperf-'));
  const fixtures = specs.map((s) => {
    const p = path.join(tmpDir, `${s.name}.md`); // lowercase .md — manifest match patterns
    fs.writeFileSync(p, s.source, 'utf8');
    return { name: s.name, url: pathToFileURL(p).href, sections: s.sections, bytes: s.source.length, source: s.source };
  });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-watchperf-udd-'));

  console.log(`[watch] extension: ${EXT_DIR}`);
  console.log(`[watch] fixtures: ${fixtures.map((f) => `${f.name}=${fmtBytes(f.bytes)}`).join(', ')}`);
  console.log(`[watch] iterations per cell: ${ITERATIONS} (run 1 discarded as cold; median of the warm ${ITERATIONS - 1})`);
  console.log('[watch] engine: CHROMIUM ONLY — Playwright cannot load an extension into Firefox, and');
  console.log('        FileSystemObserver does not exist on Firefox (measured, task 1.2).\n');

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`],
  });

  const render: { fixture: string; surface: Surface; runs: RenderMetrics[] }[] = [];
  const observer: { fixture: string; runs: ObserverMetrics[]; reads: number[] }[] = [];
  try {
    const extId = await extensionId(ctx);
    console.log(`[watch] extension id: ${extId}`);

    for (const fixture of fixtures) {
      // (b) RE-RENDER — on the real content-script surface, after a real file:// navigation.
      const errors: string[] = [];
      const page = await openInstrumented(ctx, fixture.url, bundle, errors);
      await page.evaluate(storeFixtureScript(fixture.source));
      for (const surface of ['full-page', 'contained'] as Surface[]) {
        render.push({ fixture: fixture.name, surface, runs: await runRenderCell(page, fixture, surface, errors) });
      }
      await page.close();

      // (a) OBSERVER — on the extension origin, the app page's own origin and the only surface
      // that ever takes the observer path in production. OPFS needs a secure, non-opaque origin,
      // which a file:// page is not.
      const obsErrors: string[] = [];
      const obsPage = await openInstrumented(ctx, `chrome-extension://${extId}/app.html`, bundle, obsErrors);
      await obsPage.evaluate(storeFixtureScript(fixture.source));
      const o = await runObserverCell(obsPage, fixture);
      observer.push({ fixture: fixture.name, ...o });
      await obsPage.close();
    }
  } finally {
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // --- Summary ---------------------------------------------------------------

  console.log(`\n=== SUMMARY (run 1 excluded from every cell; n=${ITERATIONS - 1}) ===`);

  console.log('\n--- (a) OBSERVER LATENCY — OPFS, NOT LOCAL DISK. See the caveat block below. ---');
  for (const r of observer) {
    console.log(`\n[${r.fixture}]`);
    console.log(`  ${summarize('close() -> detector cb  ', r.runs.map((m) => m.latency))}`);
    console.log(`  ${summarize('write (createWritable..close)', r.runs.map((m) => m.write))}`);
    console.log(`  ${summarize('write start -> detector cb  ', r.runs.map((m) => m.total))}`);
    console.log(`  ${summarize('per-tick read (getFile().text())', r.reads)}`);
  }

  console.log('\n--- (b) RE-RENDER COST — the shipped path, real engine, real host ---');
  for (const r of render) {
    console.log(`\n[${r.fixture} / ${r.surface}]`);
    const preserveMed = median(r.runs.map((m) => m.preserve));
    const plainMed = median(r.runs.map((m) => m.plain));
    const frameMed = median(r.runs.map((m) => m.frame));
    const plainFrameMed = median(r.runs.map((m) => m.plainFrame));
    const pureMed = median(r.runs.map((m) => m.pure));
    console.log(`  ${summarize('preserveReading mount, SYNCHRONOUS (SHIPPED)', r.runs.map((m) => m.preserve))}`);
    console.log(`  ${summarize('preserveReading, start -> 2nd rAF (SHIPPED) ', r.runs.map((m) => m.frame))}`);
    console.log(`  ${summarize('plain mount, synchronous (control)          ', r.runs.map((m) => m.plain))}`);
    console.log(`  ${summarize('plain mount, start -> 2nd rAF (control)     ', r.runs.map((m) => m.plainFrame))}`);
    console.log(`  ${summarize('parse+sanitize only                        ', r.runs.map((m) => m.pure))}`);
    console.log(
      `  BREAKDOWN of the ${fmt(preserveMed)} synchronous block: parse+sanitize ${fmt(pureMed)} · ` +
        `everything else in mount() ${fmt(plainMed - pureMed)} (from the plain control) · ` +
        `continuity + the layout it forces ${fmt(preserveMed - plainMed)}`,
    );
    console.log(
      `  MOVED vs ADDED — the distinction that decides whether the anchor is a lever: ` +
        `continuity lengthens the SYNCHRONOUS block by ${fmt(preserveMed - plainMed)}, but the ` +
        `whole unresponsive window (start -> 2nd rAF) goes ${fmt(plainFrameMed)} -> ${fmt(frameMed)}, ` +
        `i.e. ${fmt(frameMed - plainFrameMed)} added. The rest is layout the plain path pays anyway, ` +
        `just after the call returns instead of inside it.`,
    );
    const pd = median(r.runs.map((m) => m.preserveDrift));
    const ld = median(r.runs.map((m) => m.plainDrift));
    console.log(
      `  continuity ran (non-vacuity control): with content INSERTED ABOVE, preserve moved the box ` +
        `${pd.toFixed(0)}px vs plain ${ld.toFixed(0)}px — ` +
        (pd <= ld
          ? 'NOT a valid reading: the anchor moved the box no more than a plain mount did, so the cost above may be the cost of a no-op. INVESTIGATE before quoting it.'
          : 'the anchor did work the plain mount did not, so the cost above is the cost of real continuity.'),
    );
  }

  console.log('\n=== TABLE (medians) ===');
  console.log('                    |  SHIPPED (preserveReading) |   control (plain mount)   |');
  console.log('fixture | surface   |     sync |  ->2ndrAF |     sync |  ->2ndrAF | parse+san');
  for (const r of render) {
    console.log(
      `${r.fixture.padEnd(7)} | ${r.surface.padEnd(9)} | ` +
        `${fmt(median(r.runs.map((m) => m.preserve))).padStart(8)} | ` +
        `${fmt(median(r.runs.map((m) => m.frame))).padStart(9)} | ` +
        `${fmt(median(r.runs.map((m) => m.plain))).padStart(8)} | ` +
        `${fmt(median(r.runs.map((m) => m.plainFrame))).padStart(9)} | ` +
        `${fmt(median(r.runs.map((m) => m.pure))).padStart(9)}`,
    );
  }
  console.log('\nfixture | obs latency | write    | read/tick');
  for (const r of observer) {
    console.log(
      `${r.fixture.padEnd(7)} | ${fmt(median(r.runs.map((m) => m.latency))).padStart(11)} | ` +
        `${fmt(median(r.runs.map((m) => m.write))).padStart(8)} | ` +
        `${fmt(median(r.reads)).padStart(9)}`,
    );
  }

  console.log(`
=== WHAT THESE NUMBERS DO AND DO NOT LICENSE ===

(a) OBSERVER LATENCY IS AN INFERENCE ABOUT LOCAL DISK, NOT A MEASUREMENT OF IT.
    MEASURED ON: OPFS (navigator.storage.getDirectory()), Chromium, through production's own
    observerDetector, on the extension origin. Programmatic write, no human in the loop — which
    is the one thing it definitively fixes: the task-0 probe's 5127 ms sample was human reaction
    time and must never be quoted as a latency again.
    NOT MEASURED: a local-disk file rewritten by an external agent. OPFS is browser-managed
    storage — same process, no filesystem watcher, no atomic rename, no OS notification queue.
    The only route to a local-disk handle is showDirectoryPicker, which needs a user gesture and
    a native dialog Playwright cannot drive (recorded M2 limit). No such number was faked.
    THE PRECEDENT: retro finding 2 — 004's isolated probe under-predicted the real path by ~13x.
    WHERE THE REAL NUMBER COMES FROM: the 7.1 human gate, on a fresh production build with a real
    agent rewriting a real file. Tracked as discovered task 5.1a. It does NOT block 5.2.

(b) RE-RENDER COST IS MEASURED, on production's own mount() with preserveReading:true, in a real
    engine, on the real content-script host and on the app page's contained pane shape.
    RESIDUALS, stated: the module graph is bundled from SOURCE by esbuild rather than taken from
    the shipped WXT artifact; and the bundle's own registry holds no watch target, so the measured
    mount omits the watch pill one live chrome element. Neither is a fifth of a millisecond at
    these sizes, but both are real and neither is hidden.
    CHROMIUM ONLY. Firefox's app-page watch (drag-opened folders) is a shipped surface whose
    re-render cost is UNMEASURED here — Playwright cannot load an extension into Firefox. That gap
    is the same one every recorded first-paint number carries, and it is evidenced only at 7.1.

NO THRESHOLD IS ASSERTED. NO DEBOUNCE WINDOW IS CHOSEN. 5.2 is the human decision gate.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
