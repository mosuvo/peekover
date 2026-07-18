// scripts/perf-theme-flash.ts — spec 004 task 4.1 measurement (NOT wired into CI).
//
// THE QUESTION THIS ANSWERS. When a user has persisted a non-default theme (say
// Dark) and opens a markdown document, the content-script reader must read that
// setting from the extension's IndexedDB — which it cannot touch directly, so it
// messages the background (plan §1.2). That read is ASYNC; the first paint is not.
// So either the setting arrives BEFORE the reader paints (no flash — the persisted
// theme IS the first painted state), or it arrives after (a light->dark flip the
// user sees). Which one happens is a MEASUREMENT, not an argument: this harness
// takes the number, and a human picks the D-2 mitigation from it (block-until-read
// vs paint-and-transition). See specs/004-themes-settings/plan.md §0 D-2, §1.5.
//
// NO THRESHOLD IS ASSERTED HERE. This harness prints numbers; it never passes or
// fails (M1 retro standing rule — no un-measured gate, and equally no gate bolted
// onto a measurement task). Unlike scripts/perf-first-paint.ts, which carries the
// spec-001 <150 ms gate line, there is deliberately no `GATE_MS` in this file.
//
// WHAT IT MEASURES, per (fixture x service-worker state):
//   resolved  — performance.now() when the content script's port.load() RESOLVED
//               (i.e. the persisted settings are in hand and themeable).
//   painted   — performance.now() at the 2nd rAF after <peekover-root> first has
//               populated open-shadow content. IDENTICAL metric + detector to
//               perf-first-paint.ts, so `painted` is directly comparable to the
//               recorded 003 baseline (133.5 ms on the <=50 KB fixture).
//   committed — performance.now() when runReader committed the mount (the moment a
//               "block the reveal" design would be gating). Diagnostic.
//   DELTA     — painted - resolved. THE D-2 NUMBER:
//                 delta > 0  => settings landed BEFORE paint: no flash, and a block
//                               would have stalled the paint by ~0 ms (it was free).
//                 delta < 0  => settings landed AFTER paint: the user sees a flip,
//                               and a block would have stalled the paint by |delta|.
//
// HOW THE TWO TIMESTAMPS MEET (the isolated-world problem, solved not assumed).
// A Chrome content script runs in an ISOLATED WORLD: its `window` is NOT the page's
// window, so a global it sets is invisible to page.evaluate(). The DOM, however, IS
// shared. So the content-script side writes its marks as data-attributes on
// <html> (src/render/runReader.ts, the 4.1 scaffolding), and the main-world init
// script reads them. Both worlds are also asked for a Date.now() alongside their
// performance.now(), so the harness can CHECK that the two worlds share a timeOrigin
// rather than assuming it — a cross-world timebase skew would silently corrupt every
// delta. The check is printed per run and asserted (see TIMEBASE_TOLERANCE_MS).
//
// SERVICE-WORKER STATE (--sw warm|cold|both). The MV3 background is the flash
// variable: a sleeping worker adds spin-up to the round-trip (plan §4).
//   warm — the worker is already running (the seeding round-trip woke it, and each
//          measured run's own message keeps it alive).
//   cold — the worker is TERMINATED via CDP `Target.closeTarget` immediately before
//          each navigation, and the harness ASSERTS context.serviceWorkers() is
//          empty before proceeding. That is what "cold" means here: no running
//          worker process, so the content script's first message must spin one up.
//          It is not a fresh-profile cold start (that would also cold-start the
//          browser and the disk cache, conflating three variables into one number).
//
// ENGINES: CHROMIUM ONLY, by construction. Playwright can only load an unpacked
// extension via chromium.launchPersistentContext + --load-extension; it exposes no
// Firefox add-on installation API (no installTemporaryAddon anywhere in
// playwright-core 1.61.1). This is the same recorded constraint as perf-first-paint.ts
// (progress.md, PERF HARNESS SCOPE). The Firefox no-flash property is therefore NOT
// automatable here and is routed to the 8.1 human gate. No Firefox number is faked.
//
// Runner: `tsx` (package script "perf:flash"), for the same tsc/moduleResolution
// reason documented at the top of perf-first-paint.ts.

import { chromium } from 'playwright';
import type { BrowserContext, CDPSession, Page } from 'playwright';
import { execSync } from 'node:child_process';
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

/** The persisted, NON-DEFAULT theme seeded before measuring. The whole question is
 *  whether THIS value is in hand before the first paint, so it must not be the
 *  default (`auto`) — a default would be indistinguishable from having read nothing. */
const SEEDED_THEME = 'dark';

/** Max tolerated |skew| between the isolated world's and the main world's clocks,
 *  derived from (Date.now() - performance.now()) in each. They share a document, so
 *  this should be ~0; anything larger means the deltas below are not comparable. */
const TIMEBASE_TOLERANCE_MS = 2;

/** How long to wait for the settings-resolved mark to appear after paint. Generously
 *  above settingsPort's LOAD_TIMEOUT_MS (1500), since load() ALWAYS settles by then
 *  (it falls back to the default) — so a timeout here is a wiring bug, not slowness. */
const MARK_TIMEOUT_MS = 10_000;

// --- Types -------------------------------------------------------------------

/** A (performance.now(), Date.now()) pair, so timebases can be cross-checked. */
interface Stamp {
  now: number;
  epoch: number;
  detail: string;
}

/** What the in-page (MAIN world) instrumentation records. */
interface Observed {
  /** Main-world paint stamp — the 2nd rAF after populated shadow content. */
  painted: Stamp;
  /** Isolated-world settings-resolved stamp, read back off <html>. */
  resolved: Stamp | null;
  /** Isolated-world mount-committed stamp, read back off <html>. */
  committed: Stamp | null;
  /** Render-succeeded proof. */
  h1: string | null;
  sections: number;
}

/** One iteration's derived metrics. */
interface Metrics {
  resolved: number;
  painted: number;
  committed: number | null;
  /** painted - resolved. Positive = settings won the race (no flash). */
  delta: number;
  /** The theme the content script actually resolved (must be SEEDED_THEME). */
  theme: string;
  /** |isolated-world timeOrigin - main-world timeOrigin|, ms. Expected ~0. */
  timebaseSkew: number;
}

type SwMode = 'warm' | 'cold';

// --- In-page instrumentation (MAIN world) ------------------------------------
// Passed as a STRING for the same reason as perf-first-paint.ts: tsc/eslint do not
// parse browser globals here. Detector is a byte-for-byte behavioural copy of
// perf-first-paint.ts's (self-sustaining rAF poll + MutationObserver bonus, double
// rAF on detection) so `painted` is comparable to the 003 baseline. The only
// addition is Date.now() alongside performance.now() for the timebase cross-check.

const INIT_SCRIPT = String.raw`
(() => {
  var HOST = 'peekover-root';
  var w = window;
  w.__peekoverFlash = null;
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
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        w.__peekoverFlash = { now: performance.now(), epoch: Date.now(), detail: 'paint' };
      });
    });
  }
  (function poll() { if (done) return; record(); if (!done) requestAnimationFrame(poll); })();
  try {
    var target = document.documentElement || document;
    new MutationObserver(record).observe(target, { childList: true, subtree: true });
  } catch (e) { void e; }
  record();
})();
`;

/**
 * Read the paint stamp + BOTH isolated-world marks (data-attributes on <html>,
 * written by the 4.1 scaffolding in src/render/runReader.ts) + the render-succeeded
 * proof, in one main-world evaluation. Mark format: "now|epoch|detail".
 */
const READ_SCRIPT = String.raw`
(() => {
  function stamp(attr) {
    var raw = document.documentElement && document.documentElement.getAttribute(attr);
    if (!raw) return null;
    var parts = raw.split('|');
    return { now: parseFloat(parts[0]), epoch: parseFloat(parts[1]), detail: parts[2] || '' };
  }
  var host = document.querySelector('peekover-root');
  var sr = host && host.shadowRoot;
  var reader = sr && sr.querySelector('.peekover-reader');
  return {
    painted: window.__peekoverFlash,
    resolved: stamp('data-peekover-settings-resolved'),
    committed: stamp('data-peekover-mount-committed'),
    h1: reader ? (reader.querySelector('h1') ? reader.querySelector('h1').textContent : null) : null,
    sections: reader ? reader.querySelectorAll('h2').length : 0,
  };
})();
`;

// --- Helpers -----------------------------------------------------------------

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(n: number | null): string {
  return n === null ? 'n/a' : `${n.toFixed(1)}ms`;
}

/** Signed format — the delta's SIGN carries the meaning, so never hide it. */
function fmtSigned(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}ms`;
}

function fmtBytes(n: number): string {
  return n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(2)} MB`;
}

/** Same deterministic target-bytes -> section-count mapping as perf-first-paint.ts
 *  (duplicated rather than exported-from-there: that script is a task-5.2 artifact
 *  whose surface is deliberately frozen, and two probe generations are three lines). */
function sectionsForBytes(target: number): number {
  const a = buildHugeDoc(100).length;
  const b = buildHugeDoc(200).length;
  const bytesPerSection = (b - a) / 100;
  const header = a - bytesPerSection * 100;
  return Math.max(1, Math.round((target - header) / bytesPerSection));
}

/**
 * Build unless --no-build. A measurement harness that silently measures a STALE
 * build is worse than no harness — this instrumentation only exists in src/ as of
 * task 4.1, so a pre-4.1 .output/ would produce a run with no `resolved` mark at
 * all (which is caught below, but slowly and confusingly). Default is to rebuild.
 */
function ensureBuild(rebuild: boolean): void {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (rebuild) {
    console.log('[flash] running `pnpm build` (pass --no-build to measure the existing .output/)...');
    execSync('pnpm build', { stdio: 'inherit' });
  } else if (!fs.existsSync(manifest)) {
    console.log(`[flash] --no-build given but no build at ${EXT_DIR} — building anyway.`);
    execSync('pnpm build', { stdio: 'inherit' });
  } else {
    console.log(`[flash] --no-build: measuring the EXISTING build at ${EXT_DIR}.`);
  }
  if (!fs.existsSync(manifest)) throw new Error(`build did not produce ${manifest}`);
}

/** Wait for the extension's service worker to exist and return its origin id. */
async function extensionId(ctx: BrowserContext): Promise<string> {
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 30_000 });
  const id = new URL(sw.url()).host;
  if (!id) throw new Error(`could not derive extension id from service worker url ${sw.url()}`);
  return id;
}

/**
 * Persist SEEDED_THEME through the REAL path: an extension-origin page messages the
 * background's settings listener, which writes the real IndexedDB. Read it back and
 * assert, so a measurement never runs against a store that does not actually hold a
 * non-default theme (that would make every "no flash" result vacuous).
 */
async function seedTheme(ctx: BrowserContext, extId: string): Promise<void> {
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${extId}/app.html`);
  const readBack = await page.evaluate(
    String.raw`
    (async () => {
      await chrome.runtime.sendMessage({ type: 'peekover:setSettings', patch: { theme: '${SEEDED_THEME}' } });
      return await chrome.runtime.sendMessage({ type: 'peekover:getSettings' });
    })()
  `,
  );
  await page.close();
  const theme = (readBack as { theme?: string } | null)?.theme;
  if (theme !== SEEDED_THEME) {
    throw new Error(
      `seed failed: persisted theme read back as ${JSON.stringify(theme)}, want "${SEEDED_THEME}". ` +
        `Every measurement below would be vacuous, so refusing to continue.`,
    );
  }
  console.log(`[flash] seeded persisted theme = "${SEEDED_THEME}" (written + read back via the background).`);
}

/** Service-worker targets currently alive, per CDP. See terminateServiceWorker for why
 *  this — and NOT Playwright's ctx.serviceWorkers() — is the authority on liveness. */
async function liveServiceWorkers(cdp: CDPSession): Promise<{ targetId: string }[]> {
  const { targetInfos } = (await cdp.send('Target.getTargets')) as {
    targetInfos: { targetId: string; type: string }[];
  };
  return targetInfos.filter((t) => t.type === 'service_worker');
}

/**
 * Terminate the extension's MV3 service worker and PROVE it is gone.
 *
 * Mechanism: CDP `Target.closeTarget` on the service_worker target. The alternative —
 * waiting out MV3's ~30 s idle timeout — is genuinely cold too, but costs ~30 s per
 * iteration (~15 min across the cold cells) and is not observable, so we would be
 * trusting a sleep. This is observable, and it is asserted below: a run is never
 * LABELLED cold on the strength of having asked for it.
 *
 * TWO MECHANISMS WERE PROBED; only one works (measured, not assumed):
 *   - `ServiceWorker.enable` + `ServiceWorker.stopAllWorkers` — accepted without error
 *     but the service_worker target SURVIVED. Does not terminate an extension worker.
 *   - `Target.closeTarget` on the service_worker targetId — returns {success:true} and
 *     the target DISAPPEARS from a follow-up Target.getTargets. This is the one used.
 *
 * AND THE LIVENESS CHECK IS A TRAP. Playwright's `ctx.serviceWorkers()` still reports
 * the worker AFTER it has been terminated — that list is a client-side cache that is
 * not pruned on termination. Polling it (the first version of this function) made every
 * cold run look like a failure. `Target.getTargets` is the browser's own answer, so the
 * check below asks CDP, not Playwright. (ctx is therefore unused here — deliberately.)
 *
 * That the worker then genuinely COLD-STARTS is proven downstream, not assumed: the
 * content script's message must wake it, and runIteration asserts the reply carried the
 * seeded theme. A worker that never respawned would fail that assertion, not quietly
 * produce a fast number.
 */
async function terminateServiceWorker(cdp: CDPSession): Promise<void> {
  for (const t of await liveServiceWorkers(cdp)) {
    await cdp.send('Target.closeTarget', { targetId: t.targetId });
  }
  for (let i = 0; i < 100; i++) {
    if ((await liveServiceWorkers(cdp)).length === 0) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('service worker target still listed 5 s after Target.closeTarget — cannot certify a COLD run');
}

/**
 * Measure the settings round-trip IN ISOLATION, on an extension page doing no render
 * work, warm and cold. This exists because the in-page `resolved` number turned out to
 * be CONTAMINATED and the contamination has to be quantified rather than guessed at.
 *
 * The tell: cold `resolved` measured 135 ms on the 50 KB fixture but 972 ms on the 1 MB
 * one — for what is the same service-worker wake. A content script shares the page's
 * main thread, so `load().then(...)` cannot run while that thread is busy laying out the
 * reader; `resolved` therefore records when the settings became USABLE (the first moment
 * the content script got a turn), not when the background answered. That is the honest
 * quantity for the flash question — you cannot theme before you can run code — but it is
 * NOT the service-worker cost, and reading it as such would badly overstate cold start.
 *
 * This probe removes the render entirely, so what is left is transport + worker spin-up +
 * one IndexedDB read. Together the two numbers separate "how slow is the background" from
 * "how long until the reader can act on it".
 */
async function measureSwWake(
  ctx: BrowserContext,
  cdp: CDPSession,
  extId: string,
  cold: boolean,
  runs: number,
): Promise<number[]> {
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${extId}/app.html`);
  const out: number[] = [];
  for (let i = 0; i < runs; i++) {
    if (cold) await terminateServiceWorker(cdp);
    const ms = (await page.evaluate(
      String.raw`
      (async () => {
        const t0 = performance.now();
        const r = await chrome.runtime.sendMessage({ type: 'peekover:getSettings' });
        const dt = performance.now() - t0;
        return r && r.theme === '${SEEDED_THEME}' ? dt : -1;
      })()
    `,
    )) as number;
    if (ms < 0) throw new Error(`sw-wake probe: background did not return the seeded theme (${cold ? 'cold' : 'warm'})`);
    out.push(ms);
  }
  await page.close();
  return out;
}

/** Run one iteration on a fresh page; assert the render + the marks before trusting timings. */
async function runIteration(
  ctx: BrowserContext,
  cdp: CDPSession,
  fileUrl: string,
  sectionCount: number,
  sw: SwMode,
  label: string,
): Promise<Metrics> {
  if (sw === 'cold') await terminateServiceWorker(cdp);

  const page: Page = await ctx.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(fileUrl, { waitUntil: 'load' });
  // Wait for BOTH sides: the main-world paint stamp AND the isolated-world resolved
  // mark. Either missing means the measurement is incomplete, so we never average
  // over a run that only half-happened.
  await page.waitForFunction(
    `window.__peekoverFlash != null &&
     document.documentElement.hasAttribute('data-peekover-settings-resolved')`,
    undefined,
    { timeout: MARK_TIMEOUT_MS },
  );

  const o = (await page.evaluate(READ_SCRIPT)) as Observed;
  await page.close();

  if (o.h1 !== EXPECTED_H1) {
    throw new Error(`${label}: reader h1 mismatch — got ${JSON.stringify(o.h1)}, want "${EXPECTED_H1}"`);
  }
  if (o.sections < sectionCount) {
    throw new Error(`${label}: only ${o.sections} sections rendered (< expected ${sectionCount})`);
  }
  if (consoleErrors.length) {
    throw new Error(`${label}: ${consoleErrors.length} console error(s):\n  ${consoleErrors.join('\n  ')}`);
  }
  if (!o.resolved) throw new Error(`${label}: no settings-resolved mark (instrumentation missing from the build?)`);
  if (o.resolved.detail !== SEEDED_THEME) {
    throw new Error(
      `${label}: content script resolved theme "${o.resolved.detail}", want "${SEEDED_THEME}" — ` +
        `the persisted value did not reach the reader, so this run measures nothing.`,
    );
  }

  // Cross-world timebase check: (epoch - now) is each world's timeOrigin. They share
  // a document, so these must agree; if they do not, `delta` compares two different
  // clocks and is meaningless.
  const skew = Math.abs(o.painted.epoch - o.painted.now - (o.resolved.epoch - o.resolved.now));
  if (skew > TIMEBASE_TOLERANCE_MS) {
    throw new Error(
      `${label}: isolated/main world timeOrigin skew ${skew.toFixed(1)}ms > ${TIMEBASE_TOLERANCE_MS}ms — ` +
        `the two stamps are not on one clock; deltas would be fiction.`,
    );
  }

  return {
    resolved: o.resolved.now,
    painted: o.painted.now,
    committed: o.committed ? o.committed.now : null,
    delta: o.painted.now - o.resolved.now,
    theme: o.resolved.detail,
    timebaseSkew: skew,
  };
}

/** One cell = fixture x service-worker state. Returns the warm-run metrics. */
async function runCell(
  ctx: BrowserContext,
  cdp: CDPSession,
  fixture: { name: string; url: string; sections: number; bytes: number },
  sw: SwMode,
): Promise<Metrics[]> {
  console.log(`\n--- CELL: ${fixture.name} (${fmtBytes(fixture.bytes)}, ${fixture.sections} sections) x SW ${sw.toUpperCase()} ---`);
  const out: Metrics[] = [];
  for (let i = 1; i <= ITERATIONS; i++) {
    const label = `${fixture.name}/${sw} run ${i}`;
    const m = await runIteration(ctx, cdp, fixture.url, fixture.sections, sw, label);
    out.push(m);
    console.log(
      `[run ${i}]${i === 1 ? ' (discarded)' : '           '} ` +
        `resolved ${fmt(m.resolved)} | painted ${fmt(m.painted)} | committed ${fmt(m.committed)} | ` +
        `DELTA painted-resolved ${fmtSigned(m.delta)} ` +
        `[theme "${m.theme}", skew ${m.timebaseSkew.toFixed(2)}ms]`,
    );
  }
  return out.slice(1);
}

function summarize(name: string, values: number[], signed = false): string {
  const f = signed ? fmtSigned : (n: number) => fmt(n);
  return `${name}: median ${f(median(values))}  (min ${f(Math.min(...values))}, max ${f(Math.max(...values))})`;
}

// --- Main --------------------------------------------------------------------

function parseSwArg(argv: string[]): SwMode[] {
  let raw: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sw') raw = argv[i + 1];
    else if (argv[i].startsWith('--sw=')) raw = argv[i].slice('--sw='.length);
  }
  const v = (raw ?? 'both').trim().toLowerCase();
  if (v === 'both') return ['warm', 'cold'];
  if (v === 'warm' || v === 'cold') return [v];
  throw new Error(`--sw: expected warm | cold | both, got "${raw}"`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  ensureBuild(!argv.includes('--no-build'));
  const swModes = parseSwArg(argv);

  // The two fixtures the plan names: the TYPICAL doc (<=50 KB — the one carrying the
  // <150 ms first-paint budget, where the round-trip has nowhere to hide) and the
  // 1 MB doc (where the browser's own ~1 s layout may absorb the round-trip entirely).
  const smallSections = sectionsForBytes(50 * 1024);
  const specs = [
    { name: '50kb', sections: smallSections, source: buildHugeDoc(smallSections) },
    { name: '1mb', sections: HUGE_DOC_SECTIONS, source: buildHugeDoc() },
  ];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-flash-'));
  const fixtures = specs.map((s) => {
    const p = path.join(tmpDir, `${s.name}.md`); // lowercase .md — manifest match patterns
    fs.writeFileSync(p, s.source, 'utf8');
    return { name: s.name, url: pathToFileURL(p).href, sections: s.sections, bytes: s.source.length };
  });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-flash-udd-'));

  console.log(`[flash] extension: ${EXT_DIR}`);
  console.log(`[flash] fixtures: ${fixtures.map((f) => `${f.name}=${fmtBytes(f.bytes)}`).join(', ')}`);
  console.log(`[flash] service-worker modes: ${swModes.join(', ')}`);
  console.log(`[flash] iterations per cell: ${ITERATIONS} (run 1 discarded)`);
  console.log(`[flash] engine: CHROMIUM ONLY — Playwright cannot load an extension into Firefox.\n`);

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${EXT_DIR}`, `--load-extension=${EXT_DIR}`],
  });
  await ctx.addInitScript(INIT_SCRIPT);

  const rows: { fixture: string; sw: SwMode; runs: Metrics[] }[] = [];
  try {
    const extId = await extensionId(ctx);
    console.log(`[flash] extension id: ${extId}`);
    await seedTheme(ctx, extId);

    // A CDP session needs a page to hang off; this one is only used for the
    // browser-wide Target domain (getTargets/closeTarget), never navigated.
    const cdpHost = await ctx.newPage();
    const cdp = await ctx.newCDPSession(cdpHost);

    // Isolate the background cost first, so the in-page numbers below can be read
    // against it (see measureSwWake's note on why `resolved` alone is not enough).
    console.log('\n--- PROBE: settings round-trip in isolation (extension page, no render work) ---');
    for (const cold of [false, true]) {
      const ms = await measureSwWake(ctx, cdp, extId, cold, ITERATIONS);
      const warmup = ms.slice(1);
      console.log(
        `  SW ${cold ? 'COLD' : 'WARM'}: ${summarize('round-trip', warmup)}  [runs: ${warmup.map((v) => v.toFixed(1)).join(', ')}]`,
      );
    }

    for (const fixture of fixtures) {
      for (const sw of swModes) {
        rows.push({ fixture: fixture.name, sw, runs: await runCell(ctx, cdp, fixture, sw) });
      }
    }
  } finally {
    await ctx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  console.log('\n=== SUMMARY (warm-up run 1 excluded from every cell; n=%d per cell) ===', ITERATIONS - 1);
  console.log('resolved  = port.load() resolved in the content script (isolated world)');
  console.log('painted   = 2nd rAF after <peekover-root> has populated shadow content (same metric as `pnpm perf`)');
  console.log('DELTA     = painted - resolved. POSITIVE => settings were in hand BEFORE the paint (no flash;');
  console.log('            a block would have stalled the paint by ~0 ms). NEGATIVE => the paint beat the');
  console.log('            settings by |DELTA| (the user sees a flip; a block would stall the paint that long).');

  for (const r of rows) {
    const d = r.runs.map((m) => m.delta);
    const beforePaint = r.runs.filter((m) => m.delta >= 0).length;
    console.log(`\n[${r.fixture} / SW ${r.sw}]`);
    console.log(`  ${summarize('resolved ', r.runs.map((m) => m.resolved))}`);
    console.log(`  ${summarize('painted  ', r.runs.map((m) => m.painted))}`);
    console.log(`  ${summarize('committed', r.runs.map((m) => m.committed ?? NaN))}`);
    console.log(`  ${summarize('DELTA    ', d, true)}`);
    console.log(`  resolved BEFORE painted in ${beforePaint}/${r.runs.length} runs ` +
      `=> persisted theme ${beforePaint === r.runs.length ? 'WAS' : beforePaint === 0 ? 'was NOT' : 'was SOMETIMES'} available for the first paint`);
  }

  console.log('\n=== TABLE (medians) ===');
  console.log('fixture | sw   | resolved | painted  | delta     | theme-before-paint');
  for (const r of rows) {
    const before = r.runs.filter((m) => m.delta >= 0).length;
    console.log(
      `${r.fixture.padEnd(7)} | ${r.sw.padEnd(4)} | ` +
        `${fmt(median(r.runs.map((m) => m.resolved))).padStart(8)} | ` +
        `${fmt(median(r.runs.map((m) => m.painted))).padStart(8)} | ` +
        `${fmtSigned(median(r.runs.map((m) => m.delta))).padStart(9)} | ${before}/${r.runs.length}`,
    );
  }
  console.log('\n=== READ THIS BEFORE QUOTING THE COLD NUMBERS ===');
  console.log('`resolved` is when the content script could ACT on the settings, not when the background');
  console.log('answered. A content script shares the page main thread, so a reply that arrives while the');
  console.log('reader is parsing/mounting is not delivered until that thread yields. The isolation probe');
  console.log('above is the background\'s real cost (sub-ms warm, ~5 ms cold); the cold in-page figures are');
  console.log('dominated by that delivery wait, which is why 50kb/cold and 1mb/cold differ by ~800 ms for');
  console.log('the same worker wake. Corollary: the +0.2 ms 50kb/cold delta is a PHOTO FINISH, not comfort —');
  console.log('both stamps are flushed in the same main-thread turn, and their order within it is not');
  console.log('something this harness (or anything currently in src/) guarantees.');
  console.log('\n[flash] NO threshold asserted — these are numbers for the D-2 decision, not a gate.');
  console.log('[flash] Firefox NOT measured (Playwright cannot load extensions there) -> human gate 8.1.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
