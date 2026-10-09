// scripts/perf-edit-preview.ts — 012 tasks 6.2 and 6.3: the edit view's MEASUREMENTS — the
// live-preview debounce (6.2) and the cost of the preview's nested shadow root (6.3).
// NOT wired into CI and not part of any test suite; run by hand (`pnpm perf:edit-preview`).
//
// ════ NOTHING HERE CHOOSES A VALUE OR A MECHANISM ═══════════════════════════════════════════════
//
// tasks.md 6.2 and 6.3 are both "FORBIDDEN from choosing": this produces numbers for the human
// and stops. No threshold is asserted, no candidate or arm is ranked, no production constant is
// read back or written. (6.2's numbers went to the spec §8-2 ruling — R26, applied at 6.4: the
// first render of a burst runs in a 0 ms task, multiplier 1. The provisional constant is gone.)
//
// ════ WHAT IT MEASURES ══════════════════════════════════════════════════════════════════════════
//
//   PART `render` — tasks.md 6.2's own line: the preview re-render's wall-clock across a size
//     corpus mirroring `perf-watch.ts`'s 50 KB / 1 MB shape plus a typical small document; median
//     AND floor. Two numbers per render: the SYNCHRONOUS cost (`renderPreview`: `mount()` into the
//     nested host plus the enhancers' synchronous half — what production's cooldown times) and
//     the time until the preview's DOM is QUIET (the enhancers' asynchronous half — diagrams,
//     math, code — which nothing times today; decisions.md, R7 / 3.4).
//     A-B-A: a reference document (small, prose) is measured before and after every other
//     document in the same session, so drift during the run is on the page beside the numbers.
//
//   PART `typing` — the fixed-vs-adaptive axis §8-2 asks to have laid out, as candidates driven
//     by real keys. Per candidate x size x profile x typing rate: keystroke latency (first key
//     after a pause, and the rest), how long a key keeps the main thread busy, long tasks, how
//     many renders a run costs and how many of them land while the user is still typing, and how
//     stale the preview is after the last key — to the final text, and to the enhancers settled.
//
//   PART `nested` — tasks.md 6.3's own line: what the preview's SECOND shadow root costs, apart
//     from CodeMirror and apart from the preview's content. Five arms on one document — reading
//     only · editor only · editor + the preview in the SAME root (the ablated control) · editor +
//     the preview in a NESTED root (the harness's copy of what ships) · production's `buildEditor`
//     — and the editor-only arm a second time, as the same-session control (A-B-A). Per arm: the
//     time from entering edit to the edit view painted (a first entry, engine load included, and
//     later entries), one preview re-render (the call, and out to the 2nd frame), and memory
//     after a forced collection. EVERY SAMPLE IS A FRESH BROWSER, arms interleaved inside each
//     repetition. The arms, and which of them are the harness's own constructions, are described
//     in `perf-edit-preview.page.ts`.
//     Memory is three readings: the JS heap and Blink's own heap (Chromium only — the DevTools
//     protocol; Firefox exposes no heap figure to an automation harness), and the PRIVATE BYTES
//     OF THE WHOLE BROWSER, every process, read from the OS (both engines, Windows only; coarse
//     — read it against the control beside it).
//
// ════ THE CANDIDATES — implemented in `perf-edit-preview.page.ts`, never in `src/` ═════════════
//
//   C1   what SHIPS: production's `createPreviewCooldown`, imported. Since task 6.4 (R26) that is
//        the first render in a 0 ms task, then a cooldown equal to what the render cost. (At 6.2
//        this row was "today": the first render inside the keystroke.)
//   C1-copy  the harness's copy of the cooldown AS IT WAS AT 6.2 — first render inside the
//        keystroke. The old behaviour, kept beside the shipped row.
//   C2   the harness's copy with the first render moved into a 0 ms task — since 6.4, a copy of
//        what ships, and so the control for the candidates built from the copy.
//   C3   multiplier 2, and 3.
//   C4   a fixed trailing debounce, 150 ms and 300 ms — renders only once typing pauses.
//
// ════ HOW TYPING IS DRIVEN, AND HOW THE CLOCKS ARE KEPT APART ═══════════════════════════════════
//
// Real key events through the browser's input path (`page.keyboard`), one per character, sent at
// FIXED wall-clock times by timers in THIS process — never awaited one after another. So a key is
// sent on schedule whether or not the page has finished with the one before, as a person's is,
// and a key that arrives during a render waits behind it. (A loop that awaited each key would
// slow the typist down whenever the page was busy and hide exactly that wait. A driven burst
// with no interval is not typing at all — finding P-3.)
//
// Every page-side time is an epoch on the page's clock; every send time is an epoch on this
// process's. The offset between the two is calibrated per page (the minimum-round-trip sample of
// 25) and subtracted. Latencies therefore include the automation protocol's own delivery — the
// floor every row shares, visible in the rows where no render runs during typing.
//
// The rates: 250 ms between keys (~48 wpm, ordinary prose typing), 150 ms (~80 wpm, a fast
// typist) and 80 ms (~150 wpm, a burst). Stated, not chosen: `--rates` overrides them.
//
// ════ FIDELITY, AND ITS LIMITS ══════════════════════════════════════════════════════════════════
//
// The page runs production SOURCE — `mount`, `enterEditMode`, `loadEditorEngine`,
// `buildEditorShell`, `renderPreview` and everything they import, the lazy engines included —
// bundled and minified by esbuild (reached through `tsx`, as `perf-watch.ts` does) with code
// splitting, and served from a loopback HTTP server this script starts. It is the production
// source, not the production build artifact: a different bundler and chunk layout, an http
// origin rather than the extension's, and a bare page rather than the app shell around the
// reader. Headless browsers on a developer machine. Timings are for comparing rows with each
// other on this machine, not for quoting as what a user's machine does.
//
// ════ RUNNING IT ════════════════════════════════════════════════════════════════════════════════
//
//   pnpm perf:edit-preview                       everything, both engines (long: ~1.5 h)
//   pnpm perf:edit-preview -- --engine chromium --part render
//   pnpm perf:edit-preview -- --engine firefox --part typing --sizes small --profiles prose
//   pnpm perf:edit-preview -- --part nested      6.3's measurement, both engines (~40 min)
//   pnpm perf:edit-preview -- --part nested --docs prose:50k --nested-reps 3
//   pnpm perf:edit-preview -- --report           print the tables from the results on disk
//
// Each invocation writes one JSON file per (engine, part, size, profile) into `--out` (default: a
// `peekover-perf-edit-preview` directory under the OS temp directory) and `--report` reads them
// all, so a long run can be done in pieces. The JSON is not committed; the tables are —
// `perf-edit-preview.results.md` (6.2) and `perf-edit-preview.nested.results.md` (6.3) — and the
// reading notes are in `docs/ai/decisions.md`.
//
// `--part nested` starts and closes one browser per sample. Run it with no other Playwright
// browser open: its whole-browser memory reading sums every process under `ms-playwright`.

import { chromium, firefox } from 'playwright';
import type { Page } from 'playwright';
import type { NestedArm, NestedEntry } from './perf-edit-preview.page';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

// ── Arguments ─────────────────────────────────────────────────────────────────────────────────

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const flag = (name: string): boolean => process.argv.includes(`--${name}`);
const list = (name: string, fallback: string): string[] => arg(name, fallback).split(',').filter(Boolean);

const OUT_DIR = arg('out', path.join(os.tmpdir(), 'peekover-perf-edit-preview'));
const ENGINES = arg('engine', 'both') === 'both' ? ['chromium', 'firefox'] : [arg('engine', 'both')];
const PARTS = arg('part', 'all') === 'all' ? ['render', 'typing', 'nested'] : [arg('part', 'all')];
const SIZES = list('sizes', 'small,50k,1m');
const PROFILES = list('profiles', 'prose,heavy');
const RATES = list('rates', '250,150,80').map(Number);
const REPS = Number(arg('reps', '2'));
const ONLY = arg('candidates', '');
/** PART nested: `profile:size` pairs, and fresh browsers per arm. */
const NESTED_DOCS = list('docs', 'prose:small,prose:50k,prose:1m,heavy:50k');
const NESTED_REPS = Number(arg('nested-reps', '5'));

const SIZE_BYTES: Record<string, number> = { small: 2_000, '50k': 50_000, '1m': 1_000_000 };
const TYPED_KEYS = 24;
const QUIET_MS = 400;
const SETTLE_CAP_MS = 120_000;

// ── The corpus ────────────────────────────────────────────────────────────────────────────────

const PROSE = [
  'Peekover renders raw markdown entirely on this device, with **zero network** by default.',
  'A paragraph of ordinary prose gives the parser and the sanitizer honest inline work: `code spans`, _emphasis_, a [link](https://example.com/), and a sentence long enough to wrap.',
  'Nothing here is special; it is the kind of text a README or a set of meeting notes is made of.',
];

function proseSection(i: number): string {
  return [
    `## Section ${i}: notes on reading and writing`,
    '',
    PROSE[i % 3],
    '',
    PROSE[(i + 1) % 3],
    '',
    '- a first point, stated plainly',
    '- a second point with `inline code`',
    `- a third point, numbered ${i}`,
    '',
    `> A short quotation closes section ${i}.`,
    '',
  ].join('\n');
}

/** One enhancer-heavy section: a code fence, inline and block math and a table — and, every
 *  fourth section, a mermaid diagram. Each diagram's source is distinct, as real ones are. */
function heavySection(i: number): string {
  const parts = [
    `## Section ${i}: a worked example`,
    '',
    `${PROSE[i % 3]} With $a_${i}^2 + b^2 = c^2$ inline, and $e^{i\\pi} + 1 = 0$ beside it.`,
    '',
    '```ts',
    `export function step${i}(input: readonly number[]): number {`,
    '  let total = 0;',
    '  for (const value of input) {',
    `    if (value % ${(i % 7) + 2} === 0) total += value;`,
    '  }',
    '  return total;',
    '}',
    '```',
    '',
    '$$',
    `\\int_0^{${i + 1}} x^2 \\, dx = \\frac{${i + 1}^3}{3}`,
    '$$',
    '',
    '| Step | Input | Output | Note |',
    '|---|---:|---:|---|',
    `| ${i}.1 | 12 | 24 | doubled |`,
    `| ${i}.2 | 24 | 8 | divided |`,
    `| ${i}.3 | 8 | 9 | incremented |`,
    '',
  ];
  if (i % 4 === 0) {
    parts.push(
      '```mermaid',
      'flowchart LR',
      `  A${i}[Read ${i}] --> B${i}{Changed?}`,
      `  B${i} -- yes --> C${i}[Render]`,
      `  B${i} -- no --> D${i}[Wait]`,
      '```',
      '',
    );
  }
  return parts.join('\n');
}

const TAIL = '\nA closing paragraph, where the typing happens: ';

function buildDoc(profile: string, bytes: number): string {
  const section = profile === 'heavy' ? heavySection : proseSection;
  const blocks = [`# A ${profile} document`, ''];
  let size = 0;
  for (let i = 0; size < bytes; i += 1) {
    const block = section(i);
    blocks.push(block);
    size += block.length + 1;
  }
  return blocks.join('\n') + TAIL;
}

function describeDoc(profile: string, text: string): string {
  const count = (re: RegExp): number => (text.match(re) ?? []).length;
  const bytes = Buffer.byteLength(text, 'utf8');
  if (profile !== 'heavy') return `${bytes} B, ${count(/^## /gm)} sections, prose only`;
  return (
    `${bytes} B, ${count(/^## /gm)} sections: ${count(/^```mermaid$/gm)} mermaid, ${count(/^```ts$/gm)} code fences, ` +
    `${count(/^\$\$$/gm) / 2} block + ${count(/\$[^$\n]+\$/g)} inline math, ${count(/^\|---/gm)} tables`
  );
}

// ── Bundle + serve ────────────────────────────────────────────────────────────────────────────

async function bundle(dir: string): Promise<void> {
  const require_ = createRequire(import.meta.resolve('tsx'));
  const esbuild = (await import(pathToFileURL(require_.resolve('esbuild')).href)) as {
    build(options: Record<string, unknown>): Promise<unknown>;
  };
  await esbuild.build({
    entryPoints: { entry: path.resolve('scripts/perf-edit-preview.page.ts') },
    bundle: true,
    format: 'esm',
    splitting: true, // the lazy engines stay lazy, as they ship
    outdir: dir,
    platform: 'browser',
    target: 'es2022',
    minify: true, // the shipped build minifies; measure the same shape of code
    loader: { '.woff2': 'dataurl' },
    logLevel: 'error',
    plugins: [
      {
        // `?inline` is Vite's syntax (src/theme/fonts.ts); the `dataurl` loader reproduces it.
        name: 'peekover-inline-query',
        setup(build: { onResolve(o: unknown, cb: (a: { path: string; resolveDir: string }) => { path: string }): void }) {
          build.onResolve({ filter: /\?inline$/ }, (args) => ({
            path: path.resolve(args.resolveDir, args.path.replace(/\?inline$/, '')),
          }));
        },
      },
    ],
  });
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    '<!doctype html><meta charset="utf-8"><title>perf-edit-preview</title><body>' +
      '<script type="module">import * as perf from "./entry.js"; window.__perf = perf;</script>',
  );
}

function serve(dir: string): Promise<{ url: string; close: () => void }> {
  const types: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' };
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(dir, name);
    if (!file.startsWith(dir) || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    // Loopback only: nothing is reachable from, or reaches, another machine.
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      resolve({ url: `http://127.0.0.1:${port}/index.html`, close: () => server.close() });
    });
  });
}

// ── The page, from here ───────────────────────────────────────────────────────────────────────

interface PageRun {
  bufferAt: number[];
  freeAt: number[];
  renders: { at: number; ms: number }[];
  finalAt: number | null;
  lastMutationAt: number;
  longTasks: number[];
  bufferOk: boolean;
}
interface Perf {
  CANDIDATES: Record<string, unknown>;
  open(text: string, candidate: string): Promise<void>;
  close(): void;
  begin(endsWith: string): void;
  settled(quietMs: number): boolean;
  end(): PageRun;
  timeRender(quietMs: number, capMs: number): Promise<{ sync: number; settle: number | null }>;
  census(): Record<string, number>;
  nestedOpen(text: string): Promise<void>;
  nestedEnter(arm: NestedArm): Promise<NestedEntry>;
  nestedExit(arm: NestedArm): Promise<void>;
  nestedRerender(arm: NestedArm, suffix: string): Promise<{ sync: number; paint: number }>;
  nestedCensus(arm: NestedArm): Record<string, number>;
}
declare global {
  interface Window {
    __perf: Perf;
  }
}

const epoch = (): number => performance.timeOrigin + performance.now();

/** Page clock minus this process's clock, from the tightest of 25 round trips. */
async function clockOffset(page: Page): Promise<number> {
  let best = { rtt: Infinity, offset: 0 };
  for (let i = 0; i < 25; i += 1) {
    const before = epoch();
    const there = await page.evaluate(() => performance.timeOrigin + performance.now());
    const after = epoch();
    if (after - before < best.rtt) best = { rtt: after - before, offset: there - (before + after) / 2 };
  }
  return best.offset;
}

/** Send `text` one key at a time at fixed wall-clock intervals. Returns each key's send time. */
async function typeAt(page: Page, text: string, rateMs: number): Promise<number[]> {
  const sent: number[] = [];
  const done: Promise<void>[] = [];
  await new Promise<void>((resolve) => {
    [...text].forEach((ch, i) => {
      setTimeout(() => {
        sent.push(epoch());
        done.push(page.keyboard.press(ch === ' ' ? 'Space' : ch).catch(() => undefined));
        if (i === text.length - 1) resolve();
      }, i * rateMs);
    });
  });
  await Promise.all(done);
  return sent;
}

const sorted = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN;
  const s = sorted(xs);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
}
const median = (xs: number[]): number => quantile(xs, 0.5);
const floor = (xs: number[]): number => (xs.length ? Math.min(...xs) : NaN);
const peak = (xs: number[]): number => (xs.length ? Math.max(...xs) : NaN);

// ── PART render ───────────────────────────────────────────────────────────────────────────────

interface RenderRow {
  doc: string;
  describe: string;
  census: Record<string, number>;
  n: number;
  sync: number[];
  settle: (number | null)[];
}

const C1 = 'C1 shipped (R26: x1, first render in a 0 ms task)';

async function measureRenders(page: Page, text: string, n: number): Promise<Omit<RenderRow, 'doc' | 'describe'>> {
  await page.evaluate(([t, c]) => window.__perf.open(t, c), [text, C1] as const);
  // Two unrecorded renders: the lazy engines load and their caches fill, as in a session that
  // has been open for more than a moment.
  for (let i = 0; i < 2; i += 1) await page.evaluate(([q, cap]) => window.__perf.timeRender(q, cap), [QUIET_MS, SETTLE_CAP_MS] as const);
  const sync: number[] = [];
  const settle: (number | null)[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = await page.evaluate(([q, cap]) => window.__perf.timeRender(q, cap), [QUIET_MS, SETTLE_CAP_MS] as const);
    sync.push(r.sync);
    settle.push(r.settle);
  }
  const census = await page.evaluate(() => window.__perf.census());
  return { census, n, sync, settle };
}

async function partRender(page: Page, engine: string): Promise<void> {
  const rows: RenderRow[] = [];
  const reference = buildDoc('prose', SIZE_BYTES.small);
  const ref = async (label: string): Promise<void> => {
    rows.push({ doc: `REFERENCE ${label} (prose, small)`, describe: describeDoc('prose', reference), ...(await measureRenders(page, reference, 10)) });
  };
  await ref('before');
  for (const profile of PROFILES) {
    for (const size of SIZES) {
      const text = buildDoc(profile, SIZE_BYTES[size]);
      const n = size === '1m' ? 5 : 12;
      console.log(`[render][${engine}] ${profile} ${size} — ${describeDoc(profile, text)}`);
      rows.push({ doc: `${profile} ${size}`, describe: describeDoc(profile, text), ...(await measureRenders(page, text, n)) });
      await ref(`after ${profile} ${size}`);
    }
  }
  save(`render-${engine}-${PROFILES.join('+')}-${SIZES.join('+')}`, { part: 'render', engine, rows });
}

// ── PART typing ───────────────────────────────────────────────────────────────────────────────

interface TypingRow {
  candidate: string;
  size: string;
  profile: string;
  rate: number;
  rep: number;
  keys: number;
  bufferOk: boolean;
  settled: boolean;
  /** send → in the buffer, per key (ms). Index 0 is the first key after a pause. */
  latency: number[];
  /** send → main thread free, per key (ms). */
  busy: number[];
  renders: number;
  rendersWhileTyping: number;
  renderMs: number[];
  staleText: number | null;
  staleSettled: number | null;
  longTasks: number[];
}

async function typingRun(page: Page, text: string, candidate: string, rate: number, rep: number): Promise<Omit<TypingRow, 'candidate' | 'size' | 'profile' | 'rate' | 'rep'>> {
  await page.evaluate(([t, c]) => window.__perf.open(t, c), [text, candidate] as const);
  // Let the first preview and its enhancers finish, then leave a pause: the run's first key is
  // a "first key after a pause" (finding P-2), with every cooldown long expired.
  await page.evaluate(([q, cap]) => window.__perf.timeRender(q, cap), [QUIET_MS, SETTLE_CAP_MS] as const);
  await page.waitForTimeout(600);
  const offset = await clockOffset(page);
  const typed = `quick brown fox jumps z${rep}q`.padEnd(TYPED_KEYS, 'x').slice(0, TYPED_KEYS);
  await page.evaluate((m) => window.__perf.begin(m), typed);
  const sent = await typeAt(page, typed, rate);
  const settled = await page
    .waitForFunction((q) => window.__perf.settled(q), QUIET_MS, { timeout: SETTLE_CAP_MS, polling: 50 })
    .then(() => true, () => false);
  const r = await page.evaluate(() => window.__perf.end());
  const last = sent[sent.length - 1];
  const onPage = (t: number): number => t - offset;
  return {
    keys: sent.length,
    bufferOk: r.bufferOk && r.bufferAt.length === sent.length,
    settled,
    latency: r.bufferAt.map((t, i) => onPage(t) - sent[i]),
    busy: r.freeAt.map((t, i) => onPage(t) - sent[i]),
    renders: r.renders.length,
    rendersWhileTyping: r.renders.filter((x) => onPage(x.at) < last).length,
    renderMs: r.renders.map((x) => x.ms),
    staleText: r.finalAt === null ? null : onPage(r.finalAt) - last,
    staleSettled: r.finalAt === null ? null : onPage(r.lastMutationAt) - last,
    longTasks: r.longTasks,
  };
}

async function partTyping(page: Page, engine: string): Promise<void> {
  const candidates = (await page.evaluate(() => Object.keys(window.__perf.CANDIDATES))).filter(
    (name) => !ONLY || ONLY.split(',').some((want) => name.startsWith(want)),
  );
  for (const profile of PROFILES) {
    for (const size of SIZES) {
      const text = buildDoc(profile, SIZE_BYTES[size]);
      // The 1 MB documents are measured at ONE rate, once: a single run there is minutes long.
      const rates = size === '1m' ? [150] : RATES;
      const reps = size === '1m' ? 1 : REPS;
      const rows: TypingRow[] = [];
      for (let rep = 0; rep < reps; rep += 1) {
        for (const rate of rates) {
          // Candidates interleaved inside each (rep, rate): no candidate owns a stretch of the run.
          for (const candidate of candidates) {
            const row = await typingRun(page, text, candidate, rate, rep);
            rows.push({ candidate, size, profile, rate, rep, ...row });
            console.log(
              `[typing][${engine}] ${profile} ${size} @${rate}ms rep${rep} · ${candidate} · ` +
                `latency p50 ${median(row.latency.slice(1)).toFixed(1)} max ${peak(row.latency).toFixed(0)} · ` +
                `renders ${row.renders} (${row.rendersWhileTyping} while typing) · stale ${row.staleText?.toFixed(0)} / ${row.staleSettled?.toFixed(0)}` +
                (row.bufferOk ? '' : ' · BUFFER MISMATCH') + (row.settled ? '' : ' · NOT SETTLED'),
            );
          }
        }
      }
      save(`typing-${engine}-${profile}-${size}`, { part: 'typing', engine, describe: describeDoc(profile, text), rows });
    }
  }
}

// ── PART nested (tasks.md 6.3) ────────────────────────────────────────────────────────────────

/** The arms in the order a repetition runs them: the editor-only arm FIRST AND LAST, so the same
 *  arm twice in one session is the control every difference is read against (A-B-A). The three
 *  between them rotate by repetition, so none owns a position. */
const NESTED_MIDDLE: NestedArm[] = ['S', 'N', 'P'];
const NESTED_ORDER_LABELS = ['R', 'E', 'S', 'N', 'P', 'E again'];
const NESTED_SETTLE_MS = 700;
const NESTED_SETTLE_HEAVY_MS = 2500;

interface NestedMemory {
  /** V8's heap in use, after a forced collection (Chromium). */
  js: number | null;
  /** Blink's own heap in use — DOM nodes, style, layout (Chromium). */
  blink: number | null;
  /** Live DOM nodes in the process (Chromium). */
  nodes: number | null;
  /** Private bytes of every browser process, from the OS (Windows). */
  process: number | null;
  processes: number | null;
}

interface NestedSample {
  arm: string;
  rep: number;
  /** The first entry on a fresh page: the engine's chunks are fetched and compiled inside it. */
  first: NestedEntry | null;
  /** Entries after an exit, on the same page: the engine is memoized. */
  later: NestedEntry[];
  rerender: { sync: number; paint: number }[];
  memory: NestedMemory;
  census: Record<string, number> | null;
}

/** Private bytes summed over every process started from Playwright's browser directory. */
function browserPrivateBytes(): { bytes: number; count: number } | null {
  if (process.platform !== 'win32') return null;
  try {
    const out = execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "$p = @(Get-Process | Where-Object { $_.Path -like '*ms-playwright*' }); " +
          "Write-Output ((($p | Measure-Object PrivateMemorySize64 -Sum).Sum).ToString() + ' ' + $p.Count)",
      ],
      { encoding: 'utf8' },
    );
    const [bytes, count] = out.trim().split(/\s+/).map(Number);
    return Number.isFinite(bytes) && count > 0 ? { bytes, count } : null;
  } catch {
    return null;
  }
}

async function readMemory(page: Page, engine: string): Promise<NestedMemory> {
  let js: number | null = null;
  let blink: number | null = null;
  let nodes: number | null = null;
  await page.requestGC();
  if (engine === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.collectGarbage');
    const heap = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number; embedderHeapUsedSize?: number };
    js = heap.usedSize;
    blink = heap.embedderHeapUsedSize ?? null;
    nodes = (await cdp.send('Memory.getDOMCounters')).nodes;
    await cdp.detach();
  }
  await page.waitForTimeout(300);
  const os_ = browserPrivateBytes();
  return { js, blink, nodes, process: os_?.bytes ?? null, processes: os_?.count ?? null };
}

async function nestedSample(
  engine: string,
  url: string,
  text: string,
  arm: NestedArm,
  heavy: boolean,
  big: boolean,
): Promise<Omit<NestedSample, 'arm' | 'rep'>> {
  const browser = await (engine === 'firefox' ? firefox : chromium).launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (err) => console.log(`[page error][${engine}] ${err.message}`));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.__perf === 'object');
    await page.evaluate((t) => window.__perf.nestedOpen(t), text);
    const first = arm === 'R' ? null : await page.evaluate((a) => window.__perf.nestedEnter(a), arm);
    // Memory is read on the FIRST entry, before anything has been built twice.
    await page.waitForTimeout(heavy ? NESTED_SETTLE_HEAVY_MS : NESTED_SETTLE_MS);
    const memory = await readMemory(page, engine);
    const census = arm === 'R' ? null : await page.evaluate((a) => window.__perf.nestedCensus(a), arm);
    const later: NestedEntry[] = [];
    const rerender: { sync: number; paint: number }[] = [];
    if (arm !== 'R') {
      for (let i = 0; i < (big ? 3 : 6); i += 1) {
        await page.evaluate((a) => window.__perf.nestedExit(a), arm);
        later.push(await page.evaluate((a) => window.__perf.nestedEnter(a), arm));
      }
    }
    if (arm === 'S' || arm === 'N' || arm === 'P') {
      for (let i = 0; i < (big ? 5 : 10); i += 1) {
        rerender.push(await page.evaluate(([a, suffix]) => window.__perf.nestedRerender(a, suffix), [arm, 'x'.repeat(i + 1)] as const));
      }
    }
    return { first, later, rerender, memory, census };
  } finally {
    await browser.close();
  }
}

async function partNested(engine: string, url: string): Promise<void> {
  for (const doc of NESTED_DOCS) {
    const [profile, size] = doc.split(':');
    if (!SIZE_BYTES[size]) throw new Error(`--docs: "${doc}" is not profile:size`);
    const text = buildDoc(profile, SIZE_BYTES[size]);
    const big = size === '1m';
    const reps = big ? Math.min(3, NESTED_REPS) : NESTED_REPS;
    const rows: NestedSample[] = [];
    console.log(`[nested][${engine}] ${profile} ${size} — ${describeDoc(profile, text)}`);
    for (let rep = 0; rep < reps; rep += 1) {
      const middle = NESTED_MIDDLE.map((_, i) => NESTED_MIDDLE[(i + rep) % NESTED_MIDDLE.length]);
      const order: [string, NestedArm][] = [['E', 'E'], ...middle.map((a): [string, NestedArm] => [a, a]), ['R', 'R'], ['E again', 'E']];
      for (const [label, arm] of order) {
        // A fresh browser occasionally never loads the page (seen once in ~20 launches). Such a
        // sample measured nothing: it is thrown away whole and taken again, and the log says so.
        let row: Awaited<ReturnType<typeof nestedSample>> | null = null;
        for (let attempt = 1; row === null; attempt += 1) {
          try {
            row = await nestedSample(engine, url, text, arm, profile === 'heavy', big);
          } catch (err) {
            console.log(`[nested][${engine}] ${profile} ${size} rep${rep} · ${label} · attempt ${attempt} FAILED, retaken: ${(err as Error).message.split('\n')[0]}`);
            if (attempt === 3) throw err;
          }
        }
        rows.push({ arm: label, rep, ...row });
        console.log(
          `[nested][${engine}] ${profile} ${size} rep${rep} · ${label.padEnd(7)} · ` +
            `first ${ms(row.first?.paint, 1)} · later ${ms(median(row.later.map((x) => x.paint)), 1)} · ` +
            `re-render ${ms(median(row.rerender.map((x) => x.sync)), 1)} / ${ms(median(row.rerender.map((x) => x.paint)), 1)} · ` +
            `js ${kb(row.memory.js)} blink ${kb(row.memory.blink)} process ${mb(row.memory.process)} (${row.memory.processes ?? '—'})`,
        );
      }
    }
    save(`nested-${engine}-${profile}-${size}`, { part: 'nested', engine, doc: `${profile} ${size}`, describe: describeDoc(profile, text), rows });
  }
}

// ── Results on disk, and the report ───────────────────────────────────────────────────────────

function save(name: string, data: unknown): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), machine: machine(), ...(data as object) }));
  console.log(`[saved] ${file}`);
}

function machine(): string {
  return `${os.cpus()[0]?.model.trim()} x${os.cpus().length}, ${Math.round(os.totalmem() / 2 ** 30)} GB, ${os.platform()} ${os.release()}, node ${process.version}`;
}

const ms = (x: number | null | undefined, digits = 0): string => (x === null || x === undefined || Number.isNaN(x) ? '—' : x.toFixed(digits));
const kb = (x: number | null | undefined): string => (x === null || x === undefined || Number.isNaN(x) ? '—' : `${(x / 1024).toFixed(0)}`);
const mb = (x: number | null | undefined): string => (x === null || x === undefined || Number.isNaN(x) ? '—' : `${(x / 2 ** 20).toFixed(1)}`);
const signed = (x: number, digits: number): string => (Number.isNaN(x) ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(digits)}`);
const present = (xs: (number | null | undefined)[]): number[] => xs.filter((x): x is number => typeof x === 'number' && !Number.isNaN(x));

/** The nested-host tables for one (engine, document): what each arm measured, then the
 *  differences between arms — median first, floor second — beside the same arm measured twice. */
function reportNested(out: string[], engine: string, doc: string, describe: string, rows: NestedSample[]): void {
  const of = (arm: string): NestedSample[] => rows.filter((r) => r.arm === arm);
  const arms = NESTED_ORDER_LABELS.filter((arm) => of(arm).length);
  type Pick = (r: NestedSample) => (number | null | undefined)[];
  const firstPaint: Pick = (r) => [r.first?.paint];
  const firstBuild: Pick = (r) => [r.first?.build];
  const laterPaint: Pick = (r) => r.later.map((x) => x.paint);
  const laterBuild: Pick = (r) => r.later.map((x) => x.build);
  const reSync: Pick = (r) => r.rerender.map((x) => x.sync);
  const rePaint: Pick = (r) => r.rerender.map((x) => x.paint);
  const js: Pick = (r) => [r.memory.js];
  const blink: Pick = (r) => [r.memory.blink];
  const proc: Pick = (r) => [r.memory.process];
  const values = (arm: string, pick: Pick): number[] => present(of(arm).flatMap(pick));
  const cell = (arm: string, pick: Pick, show: (x: number) => string): string => {
    const xs = values(arm, pick);
    return xs.length ? `${show(median(xs))} / ${show(floor(xs))}` : '—';
  };
  const t1 = (x: number): string => x.toFixed(1);

  out.push(`### Nested host — ${engine} · ${doc}`, '', `*${describe}. ${of('E').length} fresh browser(s) per arm.*`, '');
  out.push('**Entering edit, ms (median / floor).** *first* = the first entry on a fresh page (engine load included); *later* = re-entries on the same page. *paint* = before entry → 2nd frame after; *build* = the build step alone.', '');
  out.push('| Arm | n first | first: paint | first: build | n later | later: paint | later: build |', '|---|--:|--:|--:|--:|--:|--:|');
  for (const arm of arms.filter((a) => a !== 'R')) {
    out.push(`| ${arm} | ${values(arm, firstPaint).length} | ${cell(arm, firstPaint, t1)} | ${cell(arm, firstBuild, t1)} | ${values(arm, laterPaint).length} | ${cell(arm, laterPaint, t1)} | ${cell(arm, laterBuild, t1)} |`);
  }
  out.push('', '**One preview re-render, ms (median / floor).**', '');
  out.push('| Arm | n | the call | to the 2nd frame |', '|---|--:|--:|--:|');
  for (const arm of arms.filter((a) => values(a, reSync).length)) {
    out.push(`| ${arm} | ${values(arm, reSync).length} | ${cell(arm, reSync, t1)} | ${cell(arm, rePaint, t1)} |`);
  }
  out.push('', '**Memory after a forced collection (median / floor), and what the arm built.**', '');
  out.push(
    '| Arm | n | JS heap, KB | Blink heap, KB | DOM nodes | whole browser, MB | shadow roots | preview elements | preview height, px | nested `<style>` chars |',
    '|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|',
  );
  for (const arm of arms) {
    const census = of(arm)[0]?.census;
    out.push(
      `| ${arm} | ${of(arm).length} | ${cell(arm, js, kb)} | ${cell(arm, blink, kb)} | ${ms(median(present(of(arm).map((r) => r.memory.nodes))))} | ${cell(arm, proc, mb)} | ` +
        `${census ? census.shadowRoots : 1} | ${census ? census.previewColumnElements : 0} | ${census ? census.previewColumnHeight : 0} | ${census ? census.nestedStyleChars : 0} |`,
    );
  }
  const pairs: [string, string, string][] = [
    ['N − S — the nested root itself', 'N', 'S'],
    ['S − E — the preview content, one root', 'S', 'E'],
    ['N − E — the preview, nested', 'N', 'E'],
    ['P − N — production beside the harness copy', 'P', 'N'],
    ['E − R — CodeMirror and the shell', 'E', 'R'],
    ['E again − E — THE SAME ARM TWICE (the control)', 'E again', 'E'],
  ];
  const diff = (a: string, b: string, pick: Pick, digits: number, scale = 1): string => {
    const xa = values(a, pick);
    const xb = values(b, pick);
    if (!xa.length || !xb.length) return '—';
    return `${signed((median(xa) - median(xb)) / scale, digits)} / ${signed((floor(xa) - floor(xb)) / scale, digits)}`;
  };
  out.push('', '**Differences between arms (median / floor).** Read each against the last row: the same arm, measured twice.', '');
  out.push(
    '| Difference | first: paint, ms | later: paint, ms | later: build, ms | re-render call, ms | re-render to frame, ms | JS heap, KB | Blink heap, KB | whole browser, MB |',
    '|---|--:|--:|--:|--:|--:|--:|--:|--:|',
  );
  for (const [label, a, b] of pairs) {
    if (!of(a).length || !of(b).length) continue;
    out.push(
      `| ${label} | ${diff(a, b, firstPaint, 1)} | ${diff(a, b, laterPaint, 1)} | ${diff(a, b, laterBuild, 1)} | ${diff(a, b, reSync, 1)} | ${diff(a, b, rePaint, 1)} | ` +
        `${diff(a, b, js, 0, 1024)} | ${diff(a, b, blink, 0, 1024)} | ${diff(a, b, proc, 1, 2 ** 20)} |`,
    );
  }
  out.push('');
}

function report(): void {
  if (!fs.existsSync(OUT_DIR)) throw new Error(`no results in ${OUT_DIR}`);
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort();
  const all = files.map((f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')) as { part: string; engine: string; machine: string; at: string; describe?: string; doc?: string; rows: unknown[] });
  const out: string[] = [];
  out.push(`Machine: ${all[0]?.machine}. Results: ${files.length} files, ${all[0]?.at.slice(0, 10)}.`, '');

  for (const engine of ['chromium', 'firefox']) {
    const renders = all.filter((r) => r.part === 'render' && r.engine === engine);
    if (renders.length) {
      out.push(`### Render wall-clock — ${engine}`, '');
      out.push('| Document | n | sync median | sync floor | quiet median | quiet floor | Corpus |', '|---|--:|--:|--:|--:|--:|---|');
      for (const file of renders) {
        for (const row of file.rows as RenderRow[]) {
          const settle = row.settle.filter((x): x is number => x !== null);
          out.push(
            `| ${row.doc} | ${row.n} | ${ms(median(row.sync), 1)} | ${ms(floor(row.sync), 1)} | ${ms(median(settle))} | ${ms(floor(settle))} | ` +
              `${row.doc.startsWith('REFERENCE') ? '' : `${row.describe} → ${row.census.nodes} nodes, ${row.census.svg} svg, ${row.census.math} math`} |`,
          );
        }
      }
      out.push('');
    }
    for (const file of all.filter((r) => r.part === 'nested' && r.engine === engine)) {
      reportNested(out, engine, file.doc ?? '', file.describe ?? '', file.rows as NestedSample[]);
    }
    const typing = all.filter((r) => r.part === 'typing' && r.engine === engine).flatMap((r) => r.rows as TypingRow[]);
    if (!typing.length) continue;
    const groups = new Map<string, TypingRow[]>();
    for (const row of typing) {
      const key = `${row.profile} · ${row.size} · ${row.rate} ms between keys`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    for (const [key, rows] of groups) {
      out.push(`### Typing — ${engine} · ${key} (${TYPED_KEYS} keys, ${new Set(rows.map((r) => r.rep)).size} run(s) per candidate)`, '');
      out.push(
        '| Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |',
        '|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|',
      );
      for (const candidate of [...new Set(rows.map((r) => r.candidate))]) {
        const mine = rows.filter((r) => r.candidate === candidate);
        const rest = mine.flatMap((r) => r.latency.slice(1));
        const busy = mine.flatMap((r) => r.busy);
        const keys = mine.reduce((n, r) => n + r.keys, 0);
        const flags = (mine.some((r) => !r.bufferOk) ? ' ⚠buffer' : '') + (mine.some((r) => !r.settled) ? ' ⚠unsettled' : '');
        out.push(
          `| ${candidate}${flags} | ${ms(median(mine.map((r) => r.latency[0])))} | ${ms(median(rest), 1)} | ${ms(quantile(rest, 0.95))} | ${ms(peak(mine.flatMap((r) => r.latency)))} | ` +
            `${ms(quantile(busy, 0.95))} | ${ms(peak(busy))} | ${busy.filter((x) => x >= 50).length}/${keys} | ` +
            `${engine === 'chromium' ? mine.reduce((n, r) => n + r.longTasks.length, 0) : 'n/a'} | ` +
            `${ms(median(mine.map((r) => r.renders)))} | ${ms(median(mine.map((r) => r.rendersWhileTyping)))} | ${ms(median(mine.flatMap((r) => r.renderMs)), 1)} | ` +
            `${ms(median(mine.map((r) => r.staleText).filter((x): x is number => x !== null)))} | ${ms(median(mine.map((r) => r.staleSettled).filter((x): x is number => x !== null)))} |`,
        );
      }
      out.push('');
    }
  }
  console.log(out.join('\n'));
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (flag('report')) {
    report();
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-perf-edit-preview-bundle-'));
  console.log(`[bundle] production source → ${dir}`);
  await bundle(dir);
  const server = await serve(dir);
  try {
    for (const engine of ENGINES) {
      if (PARTS.includes('render') || PARTS.includes('typing')) {
        const browser = await (engine === 'firefox' ? firefox : chromium).launch({ headless: true });
        try {
          const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
          page.on('pageerror', (err) => console.log(`[page error][${engine}] ${err.message}`));
          await page.goto(server.url);
          await page.waitForFunction(() => typeof window.__perf === 'object');
          if (PARTS.includes('render')) await partRender(page, engine);
          if (PARTS.includes('typing')) await partTyping(page, engine);
        } finally {
          await browser.close();
        }
      }
      // After the long-lived browser is closed: every nested sample starts its own.
      if (PARTS.includes('nested')) await partNested(engine, server.url);
    }
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
