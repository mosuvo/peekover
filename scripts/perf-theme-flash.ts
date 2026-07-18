// scripts/perf-theme-flash.ts — spec 004 theme-flash measurement (NOT wired into CI).
//
// THE QUESTION THIS ANSWERS. When a user has persisted a non-default theme (say
// Dark) and opens a markdown document, the content-script reader must read that
// setting from the extension's IndexedDB — which it cannot touch directly, so it
// messages the background (plan §1.2). That read is ASYNC; the first paint is not.
// So either the persisted theme is the FIRST PAINTED STATE (no flash), or the
// reader paints Auto first and flips (a flash the user sees). Which one happens is
// a MEASUREMENT, not an argument.
//
// WHAT CHANGED AT TASK 4.2 (and why this file survived).
//
// Task 4.1 answered the question INDIRECTLY, by timestamping two moments — when
// `port.load()` resolved and when the mount committed — and comparing them. Those
// timestamps needed custom marks written onto the host page's <html>, which was
// measurement-only code sitting in the shipped content script on every matched
// page. 4.2 REMOVED it; no measurement-only code ships.
//
// This harness survived the removal because it no longer needs marks. The reader's
// `data-theme` attribute on <peekover-root> is written by PRODUCTION code (the theme
// registry), so "which theme was applied at first paint" is DIRECTLY OBSERVABLE from
// the main world — and it is the better measurement anyway: 4.1 could only prove a
// timestamp ordering held, while this reads the theme that was actually on the
// element at the moment the reader first had content. There is no isolated-world
// boundary to cross and therefore no cross-world timebase to verify.
//
// NO THRESHOLD IS ASSERTED HERE. This harness prints numbers; it never passes or
// fails on a timing (M1 retro standing rule — no un-measured gate, and equally no
// gate bolted onto a measurement task). Unlike scripts/perf-first-paint.ts, which
// carries the spec-001 <150 ms gate line, there is deliberately no `GATE_MS` here.
// It DOES refuse to report a vacuous run (see runIteration): a run in which the
// persisted theme never reached the reader at all measures nothing, and is an error
// rather than a "flash".
//
// WHAT IT MEASURES, per (fixture x service-worker state):
//   painted      — performance.now() at the 2nd rAF after <peekover-root> first has
//                  populated open-shadow content. IDENTICAL metric + detector to
//                  perf-first-paint.ts, so it is directly comparable to the recorded
//                  003 baseline (133.5 ms on the <=50 KB fixture).
//   themeAtPaint — the value of <peekover-root data-theme> AT that same moment.
//                  THE FLASH NUMBER: equal to the seeded theme => that theme was the
//                  first painted state (no flash). Anything else => the reader
//                  painted Auto first and the persisted theme arrived later, i.e. a
//                  visible flip.
//   themeFinal   — the same attribute after settling. Proves the setting did land
//                  eventually, which is what separates "flashed" from "never arrived".
//
// SERVICE-WORKER STATE (--sw warm|cold|both). The MV3 background is the flash
// variable: a sleeping worker adds spin-up to the round-trip (plan §4).
//   warm — the worker is already running (the seeding round-trip woke it, and each
//          measured run's own message keeps it alive).
//   cold — the worker is TERMINATED via CDP `Target.closeTarget` immediately before
//          each navigation, and the harness ASSERTS the target is gone before
//          proceeding. That is what "cold" means here: no running worker process, so
//          the content script's first message must spin one up. It is not a
//          fresh-profile cold start (that would also cold-start the browser and the
//          disk cache, conflating three variables into one number).
//
// ENGINES: CHROMIUM ONLY, by construction. Playwright can only load an unpacked
// extension via chromium.launchPersistentContext + --load-extension; it exposes no
// Firefox add-on installation API (no installTemporaryAddon anywhere in
// playwright-core 1.61.1), and the tracking issue was CLOSED as out-of-scope
// (playwright#7297). Same recorded constraint as perf-first-paint.ts. The Firefox
// no-flash property is therefore NOT automatable here and is routed to the 8.1 human
// gate. No Firefox number is faked.
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
 *  whether THIS value is the one painted, so it must not be the default (`auto`) —
 *  a default would be indistinguishable from having read nothing. */
const SEEDED_THEME = 'dark';

/** How long to wait after paint for the persisted theme to land, before calling a run
 *  vacuous. Generously above settingsPort's LOAD_TIMEOUT_MS (1500), by which time
 *  load() has ALWAYS settled (it falls back to the default) — so exceeding this is a
 *  wiring bug, not slowness. */
const SETTLE_TIMEOUT_MS = 10_000;

// --- Types -------------------------------------------------------------------

/** What the in-page (MAIN world) instrumentation records. */
interface Observed {
  /** performance.now() at the 2nd rAF after populated shadow content, or null. */
  painted: number | null;
  /** <peekover-root data-theme> AT the paint moment. */
  themeAtPaint: string | null;
  /** <peekover-root data-theme> read live, now. */
  themeNow: string | null;
  /** Render-succeeded proof. */
  h1: string | null;
  sections: number;
}

/** One iteration's derived metrics. */
interface Metrics {
  painted: number;
  themeAtPaint: string | null;
  themeFinal: string | null;
  /** themeAtPaint === SEEDED_THEME — i.e. the persisted theme was the first painted state. */
  noFlash: boolean;
}

type SwMode = 'warm' | 'cold';

// --- In-page instrumentation (MAIN world) ------------------------------------
// Passed as a STRING for the same reason as perf-first-paint.ts: tsc/eslint do not
// parse browser globals here. The paint detector is a byte-for-byte behavioural copy
// of perf-first-paint.ts's (self-sustaining rAF poll + MutationObserver bonus, double
// rAF on detection) so `painted` stays comparable to the 003 baseline.
//
// The one addition is reading `data-theme` off the host INSIDE the same rAF callback
// that stamps the time — not afterwards. Reading it later would race the very flip we
// are trying to detect and would report "no flash" for a reader that had already
// flipped by the time we looked.

const INIT_SCRIPT = String.raw`
(() => {
  var HOST = 'peekover-root';
  var w = window;
  w.__peekoverFlash = null;
  var done = false;
  function hostEl() { return document.querySelector(HOST); }
  function painted() {
    var host = hostEl();
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
        var host = hostEl();
        w.__peekoverFlash = {
          now: performance.now(),
          theme: host ? host.getAttribute('data-theme') : null
        };
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

/** Read the paint stamp + the theme at paint + the LIVE theme + the render-succeeded
 *  proof, in one main-world evaluation. No custom marks: `data-theme` is written by
 *  production code, so nothing measurement-only has to exist in src/ for this to work. */
const READ_SCRIPT = String.raw`
(() => {
  var host = document.querySelector('peekover-root');
  var sr = host && host.shadowRoot;
  var reader = sr && sr.querySelector('.peekover-reader');
  var f = window.__peekoverFlash;
  return {
    painted: f ? f.now : null,
    themeAtPaint: f ? f.theme : null,
    themeNow: host ? host.getAttribute('data-theme') : null,
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
 * Build unless --no-build. A measurement harness that silently measures a STALE build
 * is worse than no harness. Default is to rebuild.
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
 * check below asks CDP, not Playwright.
 *
 * That the worker then genuinely COLD-STARTS is proven downstream, not assumed: the
 * content script's message must wake it, and runIteration asserts the seeded theme
 * reached the reader. A worker that never respawned would fail that assertion, not
 * quietly produce a fast number.
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
 * work, warm and cold. This is the BACKGROUND's own cost — transport + worker spin-up +
 * one IndexedDB read — with no page main thread to contend with.
 *
 * KEEP READING BEFORE QUOTING IT (task 4.2 correction of record). 4.1 used this probe to
 * INFER what settings availability would be inside a content script behind a paint gate,
 * and predicted ~26 ms cold. 4.2 measured the gated configuration directly and got ~72 ms
 * — the probe under-predicts the content-script path by ~13x. It measures a page that is
 * already loaded and idle; a content script at document_start is competing with an active
 * navigation. So this number bounds how slow the BACKGROUND is, and nothing else. Do not
 * infer in-page availability from it a second time.
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

/** Run one iteration on a fresh page; assert the render + that the theme ARRIVED before
 *  trusting the result. Whether it arrived before or after the paint is the measurement. */
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
  await page.waitForFunction('window.__peekoverFlash != null', undefined, { timeout: SETTLE_TIMEOUT_MS });

  // Then wait for the persisted theme to be LIVE on the host. This is deliberately a
  // separate wait from the paint: the gap between them is exactly the flash window, and
  // collapsing them into one condition would hide it.
  let settled = true;
  try {
    await page.waitForFunction(
      `(() => { var h = document.querySelector('peekover-root');
                return !!h && h.getAttribute('data-theme') === '${SEEDED_THEME}'; })()`,
      undefined,
      { timeout: SETTLE_TIMEOUT_MS },
    );
  } catch {
    settled = false;
  }

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
  if (o.painted === null) throw new Error(`${label}: no paint stamp recorded`);
  if (!settled) {
    throw new Error(
      `${label}: the persisted theme "${SEEDED_THEME}" NEVER reached the reader ` +
        `(data-theme settled at ${JSON.stringify(o.themeNow)}). This is a wiring failure, not a flash — ` +
        `the run measures nothing, so refusing to report it.`,
    );
  }

  return {
    painted: o.painted,
    themeAtPaint: o.themeAtPaint,
    themeFinal: o.themeNow,
    noFlash: o.themeAtPaint === SEEDED_THEME,
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
        `painted ${fmt(m.painted)} | theme AT PAINT "${m.themeAtPaint}" | settled "${m.themeFinal}" | ` +
        `${m.noFlash ? 'NO FLASH' : 'FLASH (painted Auto first, then flipped)'}`,
    );
  }
  return out.slice(1);
}

function summarize(name: string, values: number[]): string {
  return `${name}: median ${fmt(median(values))}  (min ${fmt(Math.min(...values))}, max ${fmt(Math.max(...values))})`;
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

    // A CDP session needs a page to hang off; this one is only used for the browser-wide
    // Target domain (getTargets/closeTarget), never navigated.
    const cdpHost = await ctx.newPage();
    const cdp = await ctx.newCDPSession(cdpHost);

    console.log('\n--- PROBE: settings round-trip in isolation (extension page, no render work) ---');
    console.log('  (the BACKGROUND\'s own cost. Do NOT infer in-page availability from it — 4.1 did,');
    console.log('   predicted ~26 ms cold, and 4.2 measured ~72 ms. See measureSwWake\'s note.)');
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
  console.log('painted      = 2nd rAF after <peekover-root> has populated shadow content (same metric as `pnpm perf`)');
  console.log('theme@paint  = <peekover-root data-theme> AT that moment, read by PRODUCTION code, no marks.');
  console.log(`NO FLASH     = theme@paint was the persisted "${SEEDED_THEME}", i.e. it was the FIRST painted state.`);

  for (const r of rows) {
    const clean = r.runs.filter((m) => m.noFlash).length;
    console.log(`\n[${r.fixture} / SW ${r.sw}]`);
    console.log(`  ${summarize('painted', r.runs.map((m) => m.painted))}`);
    console.log(`  NO FLASH in ${clean}/${r.runs.length} runs ` +
      `=> the persisted theme ${clean === r.runs.length ? 'WAS' : clean === 0 ? 'was NOT' : 'was SOMETIMES'} the first painted state`);
  }

  console.log('\n=== TABLE (medians) ===');
  console.log('fixture | sw   | painted  | no-flash');
  for (const r of rows) {
    const clean = r.runs.filter((m) => m.noFlash).length;
    console.log(
      `${r.fixture.padEnd(7)} | ${r.sw.padEnd(4)} | ` +
        `${fmt(median(r.runs.map((m) => m.painted))).padStart(8)} | ${clean}/${r.runs.length}`,
    );
  }

  console.log('\n[flash] NO timing threshold asserted — these are numbers, not a gate (M1 retro rule).');
  console.log('[flash] A run in which the persisted theme NEVER arrived is an ERROR, not a flash: that');
  console.log('        is a wiring failure and would make every no-flash count vacuous.');
  console.log('[flash] Firefox NOT measured (Playwright cannot load extensions there) -> human gate 8.1.');
  console.log('[flash] Whether a human EYE sees a flip is also 8.1 — no engine here can see a flash;');
  console.log('        this measures the attribute present at the paint, which is the best proxy available.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
