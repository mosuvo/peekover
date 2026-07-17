// scripts/perf-toc.ts — spec 003 task 5.1 measurement gate (NOT wired into CI).
//
// MEASUREMENT, not a threshold (M1 retro standing rule: no acceptance bar ships
// un-measured). This times the REAL production TOC hot path — the pure heading
// model build (tocModel.buildTocModel) plus the DOM rail construction
// (tocView.buildTocView) — as a function of heading count, and the JS overhead of
// the scroll-spy recompute our code runs per scroll frame. It is the TOC analogue
// of perf-folder-tree.ts (spec 002 6.2): quantify the pure/JS-construction half
// faithfully, and — per the same honesty split the M2 retro praised — DEFER the
// browser's real layout/paint cost to a real engine rather than fake it in jsdom.
//
// ── What this measures faithfully, and against what environment ─────────────────
//   (a) BUILD vs heading count — buildTocModel(root) + buildTocView(host, model)
//       over a synthetic rendered reader root of N headings (mixed h1..h4 nesting),
//       swept across N. This is the "one DOM node per heading" suspect tasks.md 5.1
//       names (6.2-analogous to treeView's one-node-per-file). The construction code
//       is production-real; jsdom builds real DOM nodes, so the JS-side node-creation
//       cost is representative — exactly as perf-folder-tree measured real walk+build.
//   (b) SCROLL-SPY per-frame JS overhead — the real installScrollSpy recompute()
//       (its O(N) live-geometry scan + single-active attribute churn) driven over N
//       headings by dispatched scroll events. GEOMETRY IS STUBBED (deterministic tops
//       that sweep as scrollTop advances), so this isolates OUR per-frame JS cost —
//       it is NOT the browser's real getBoundingClientRect/layout cost (see below).
//
// ── What this DELIBERATELY does NOT assert, and why (honesty split, à la 6.2) ────
// jsdom has NO layout: getBoundingClientRect/clientHeight/scrollHeight are all 0, and
// IntersectionObserver is absent (installScrollSpy guards itself off there). So the
// scroll-spy's DOMINANT real cost — the browser forcing layout on each live
// getBoundingClientRect during an active scroll over a large rendered document — CANNOT
// be measured here without a stub masquerading as the real number, which the M1/M2 retro
// forbids. That real cost is covered, measured, elsewhere:
//   • The rail's real build+layout+observer-install on the SAME ~1400-heading fixture is
//     inside 5.2's first-paint number (pnpm perf, default 1 MB = buildHugeDoc → 1401
//     headings) — a real headless-Chromium measurement.
//   • The scroll-spy's real-engine correctness AND smoothness on a many-section doc is
//     proven on BOTH Chromium + Firefox in tests/browser/tocScroll.browser.test.ts (3.2):
//     it tracks the read section across scroll with a clean single-active handoff and no
//     observed jank. That is the real-layout evidence; this harness quantifies the JS half.
// So (b) below is our code's per-frame JS floor, honestly labeled; the browser's layout
// cost rides to those two real-engine measurements. No threshold is asserted from either.
//
// Runner: `tsx` (package script "perf:toc"), same rationale as perf-first-paint.ts /
// perf-folder-tree.ts (this file is under tsconfig include, so tsc --noEmit type-checks
// it; tsx resolves the extensionless relative imports at runtime). jsdom (a devDependency
// already used by the unit project) provides the DOM the pure+construction code needs.

import { performance } from 'node:perf_hooks';
import { JSDOM } from 'jsdom';
import { buildTocModel } from '../src/render/tocModel';
import { buildTocView } from '../src/render/tocView';
// jsdom has no bundled types; scripts/jsdom.d.ts declares the sliver this harness uses.

// --- Constants ---------------------------------------------------------------

/** Iterations per size; the FIRST (cold) run is printed but discarded (JIT warmup). */
const ITERATIONS = 7;

/** Heading counts swept for the build measurement. 1401 mirrors buildHugeDoc (1 h1 +
 *  1400 h2), so (a) at 1401 is the build half of the same doc 5.2 measures end-to-end. */
const HEADING_SWEEP = [50, 100, 250, 500, 1000, 1401, 2000];

/** Heading counts the scroll-spy JS-overhead pass runs at (the large, many-heading docs
 *  where an O(N)-per-frame scan would matter). */
const SPY_SWEEP = [1401, 2000];

/** Scroll frames driven per spy measurement — enough to sweep the active section across
 *  the whole document so setActive churns realistically, not a single static recompute. */
const SPY_FRAMES = 240;

// --- Helpers -----------------------------------------------------------------

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function fmt(ms: number): string {
  return `${ms.toFixed(3)}ms`;
}

/**
 * A synthetic rendered reader root of `n` headings under a `.peekover-reader` div — the
 * exact shape mount() passes buildTocModel (headings live inside the reader column). Levels
 * cycle h2/h3/h3/h4 after a leading h1 so the model builds a real ~3-deep nested tree (the
 * nesting recursion is part of the cost), and each heading carries realistic text.
 */
function buildReaderRoot(doc: Document, n: number): HTMLElement {
  const root = doc.createElement('div');
  root.className = 'peekover-reader';
  const levelCycle = [2, 3, 3, 4];
  for (let i = 0; i < n; i++) {
    const level = i === 0 ? 1 : levelCycle[(i - 1) % levelCycle.length];
    const h = doc.createElement(`h${level}`);
    h.textContent = `Section ${i}: rendering markdown into beautiful reading`;
    root.append(h);
  }
  return root;
}

/** Count DOM nodes buildTocView creates for `n` headings (nav + opener + resizer + per
 *  entry: li + row + link, plus a twist per parent and an ol per list). Reported so the
 *  per-heading node cost is explicit — the one-node-per-heading lever's raw magnitude. */
function countRailNodes(rail: Node): number {
  let n = 1;
  for (const child of Array.from((rail as Element).children ?? [])) n += countRailNodes(child);
  return n;
}

// --- (a) Build cost vs heading count -----------------------------------------
//
// A PLAIN jsdom window (no requestAnimationFrame, no IntersectionObserver on the global) so
// buildTocView takes ONLY its synchronous construction path: applyInitialTocState's deferred
// correction and installScrollSpy's start() are both rAF-guarded and so never fire here, and
// the IntersectionObserver-guarded spy never constructs. The measured window is pure model
// build + rail DOM construction — the number tasks.md 5.1(a) asks for.

interface BuildSample {
  modelMs: number;
  viewMs: number;
  headings: number;
  nodes: number;
}

function measureBuild(doc: Document, n: number): BuildSample {
  const root = buildReaderRoot(doc, n);
  const host = doc.createElement('div');

  const t0 = performance.now();
  const model = buildTocModel(root);
  const t1 = performance.now();
  const rail = buildTocView(host, model, { contained: false });
  const t2 = performance.now();

  return {
    modelMs: t1 - t0,
    viewMs: t2 - t1,
    headings: n,
    nodes: rail ? countRailNodes(rail) : 0,
  };
}

function runBuildSweep(doc: Document): void {
  console.log('=== (a) TOC BUILD vs heading count — MEASUREMENT, no threshold asserted ===');
  console.log(`  buildTocModel(root) + buildTocView(host, model), ${ITERATIONS} iters/size (run 1 cold, discarded)`);
  console.log(`  environment: jsdom (real DOM node construction; no layout — the JS-construction cost)\n`);
  console.log(
    '  headings |  model build (median)  |  rail build (median)   |  total   | rail nodes',
  );
  console.log('  ---------+------------------------+------------------------+----------+-----------');
  for (const n of HEADING_SWEEP) {
    const samples: BuildSample[] = [];
    for (let i = 0; i < ITERATIONS; i++) samples.push(measureBuild(doc, n));
    const warm = samples.slice(1);
    const model = median(warm.map((s) => s.modelMs));
    const view = median(warm.map((s) => s.viewMs));
    const nodes = warm[0].nodes;
    console.log(
      `  ${String(n).padStart(8)} | ${fmt(model).padStart(22)} | ${fmt(view).padStart(22)} | ` +
        `${fmt(model + view).padStart(8)} | ${String(nodes).padStart(9)}`,
    );
  }
  console.log('');
}

// --- (b) Scroll-spy per-frame JS overhead ------------------------------------
//
// Install the REAL scroll-spy (via buildTocView) and drive its recompute over dispatched
// scroll events, timing OUR per-frame JS work. Requires the guarded globals the spy needs:
// a QUEUED requestAnimationFrame (so start()/applyInitialTocState defer until after we attach
// the rail + host to the document — recompute self-heals to teardown if the links aren't
// connected), a no-op IntersectionObserver (the spy's efficient trigger; we drive recompute
// via the scroll listener our code attaches for real), and stubbed geometry that sweeps with
// scrollTop. The stub is the geometry SOURCE only — the code under measurement (the O(N) scan
// + setActive churn) is production-real. This is NOT the browser's layout cost (see header).

interface SpyRig {
  flushRaf: () => void;
  setScrollTop: (v: number) => void;
  scrollHeight: number;
}

/** Install harness globals on a jsdom window's realm and wire deterministic geometry onto the
 *  host + its N headings so the real recompute does representative work. Returns controls to
 *  flush queued rAF callbacks and to advance the simulated scroll position. */
function riggedWindow(n: number): { doc: Document; root: HTMLElement; host: HTMLElement; rig: SpyRig } {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const win = dom.window as unknown as typeof globalThis & {
    IntersectionObserver: unknown;
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
  };

  // Queued rAF: callbacks run only when flushRaf() drains them, so the spy's deferred start()
  // fires after we've connected the rail (not mid-build against a detached nav).
  const queue: FrameRequestCallback[] = [];
  const flushRaf = (): void => {
    while (queue.length) {
      const cb = queue.shift();
      if (cb) cb(0);
    }
  };
  win.requestAnimationFrame = (cb: FrameRequestCallback): number => queue.push(cb);
  win.cancelAnimationFrame = (): void => void 0; // teardown won't run while connected; no-op is safe

  // A no-op IntersectionObserver: the spy's trigger. We drive recompute through the real scroll
  // listener buildTocView attaches, so the observer never needs to fire.
  class NoopIO {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] { return []; }
  }
  win.IntersectionObserver = NoopIO as unknown as typeof IntersectionObserver;

  // Bind the module's global lookups (document/rAF/IO/getComputedStyle) to this realm.
  const g = globalThis as unknown as Record<string, unknown>;
  g.document = win.document;
  g.requestAnimationFrame = win.requestAnimationFrame;
  g.cancelAnimationFrame = win.cancelAnimationFrame;
  g.IntersectionObserver = win.IntersectionObserver;

  const doc = win.document;
  const root = buildReaderRoot(doc, n);
  const host = doc.createElement('div');
  doc.body.append(root); // headings connected + findable via querySelector('.peekover-reader')
  doc.body.append(host); // host connected BEFORE the deferred start() runs (isConnected guard)

  // Deterministic geometry: a 800px scrollport over an N*100px document; each heading sits at
  // index*100 and moves up as scrollTop advances, so the active section sweeps as we scroll.
  const SPACING = 100;
  const CLIENT_H = 800;
  const scrollHeight = n * SPACING;
  let scrollTop = 0;
  Object.defineProperty(host, 'clientHeight', { get: () => CLIENT_H, configurable: true });
  Object.defineProperty(host, 'scrollHeight', { get: () => scrollHeight, configurable: true });
  Object.defineProperty(host, 'scrollTop', { get: () => scrollTop, configurable: true });
  host.getBoundingClientRect = (): DOMRect =>
    ({ top: 0, left: 0, right: 250, bottom: CLIENT_H, width: 250, height: CLIENT_H, x: 0, y: 0, toJSON() {} } as DOMRect);
  const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  headings.forEach((h, i) => {
    h.getBoundingClientRect = (): DOMRect =>
      ({ top: i * SPACING - scrollTop, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} } as DOMRect);
  });

  return {
    doc,
    root,
    host,
    rig: { flushRaf, setScrollTop: (v: number) => { scrollTop = v; }, scrollHeight },
  };
}

interface SpySample {
  perFrameMs: number;
  headings: number;
}

function measureSpyOn(doc: Document, host: HTMLElement, rig: SpyRig, n: number): SpySample {
  void doc;
  const model = buildTocModel(host.ownerDocument!.querySelector('.peekover-reader')!);
  const rail = buildTocView(host, model, { contained: false });
  if (rail) host.append(rail); // connect the links BEFORE flushing the deferred start()
  rig.flushRaf(); // runs applyInitialTocState correction + installScrollSpy start() (observer + scroll listener)

  const eventCtor = (host.ownerDocument!.defaultView as unknown as { Event: typeof Event }).Event;
  const step = rig.scrollHeight / SPY_FRAMES;

  const t0 = performance.now();
  for (let f = 0; f < SPY_FRAMES; f++) {
    rig.setScrollTop(Math.round(f * step));
    host.dispatchEvent(new eventCtor('scroll'));
    rig.flushRaf(); // runs the rAF-coalesced recompute for this frame
  }
  const t1 = performance.now();

  return { perFrameMs: (t1 - t0) / SPY_FRAMES, headings: n };
}

function runSpySweep(): void {
  console.log('=== (b) SCROLL-SPY per-frame JS overhead — MEASUREMENT, JS-half only (see header) ===');
  console.log(`  real installScrollSpy recompute() over ${SPY_FRAMES} scroll frames, ${ITERATIONS} iters/size`);
  console.log(`  environment: jsdom + STUBBED geometry — OUR O(N) scan + active-churn, NOT browser layout\n`);
  console.log('  headings |  per-frame recompute (median)  |  per-frame min / max');
  console.log('  ---------+--------------------------------+----------------------');
  for (const n of SPY_SWEEP) {
    const samples: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const { doc, host, rig } = riggedWindow(n);
      samples.push(measureSpyOn(doc, host, rig, n).perFrameMs);
    }
    const warm = samples.slice(1);
    console.log(
      `  ${String(n).padStart(8)} | ${fmt(median(warm)).padStart(30)} | ${fmt(Math.min(...warm))} / ${fmt(Math.max(...warm))}`,
    );
  }
  console.log('');
}

// --- Main --------------------------------------------------------------------

function main(): void {
  console.log('=== perf-toc (spec 003 task 5.1) — MEASUREMENT, no threshold asserted (M1 retro rule) ===\n');

  // (a) build sweep on a plain jsdom (no rAF/IO globals → pure synchronous construction path).
  const plain = new JSDOM('<!doctype html><html><body></body></html>');
  (globalThis as unknown as Record<string, unknown>).document = plain.window.document;
  runBuildSweep(plain.window.document);

  // (b) scroll-spy JS overhead on rigged jsdom windows (real spy, stubbed geometry).
  runSpySweep();

  console.log('=== FINDINGS (recorded, NOT asserted as a gate — M1/M2 retro rule) ===');
  console.log(
    '• (a) TOC build (model + rail DOM) is the pure/JS-construction hot path — the "one DOM node\n' +
      '  per heading" suspect (6.2-analogous to treeView). Measured above on production code over a\n' +
      '  jsdom real-DOM build; the browser paint/layout of that same rail is in 5.2 first-paint.\n' +
      '• (b) is OUR scroll-spy recompute JS cost per frame (O(N) live-geometry scan + single-active\n' +
      "  churn), geometry STUBBED. It is NOT the browser's real getBoundingClientRect/layout cost —\n" +
      '  that is jsdom-blind and rides to the real engine: 5.2 first-paint on the same ~1400-heading\n' +
      '  doc + tocScroll.browser.test.ts (3.2) proving clean single-active tracking on BOTH engines.\n' +
      '• CHUNKED/VIRTUALIZED TOC-TREE LEVER (carried): decide from (a) above — if the rail build at a\n' +
      '  pathological heading count is cheap, the lever is not needed for the TOC; if it dominates,\n' +
      '  it is the same one-node-per-heading suspect as the folder tree. A post-measurement call.\n' +
      '• No acceptance threshold is asserted from these numbers (M1 retro: no un-measured gate).',
  );
}

main();
