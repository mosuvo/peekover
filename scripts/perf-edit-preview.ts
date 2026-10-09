// scripts/perf-edit-preview.ts — 012 task 6.2: the live-preview debounce MEASUREMENT.
// NOT wired into CI and not part of any test suite; run by hand (`pnpm perf:edit-preview`).
//
// ════ NOTHING HERE CHOOSES A VALUE OR A MECHANISM ═══════════════════════════════════════════════
//
// tasks.md 6.2 is "FORBIDDEN from choosing": this produces numbers for the human's spec §8-2
// ruling and stops. No threshold is asserted, no candidate is ranked, no production constant is
// read back or written. `PREVIEW_COOLDOWN_MULTIPLIER` stays 1 and PROVISIONAL; 6.4 applies the
// ruling.
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
// ════ THE CANDIDATES — implemented in `perf-edit-preview.page.ts`, never in `src/` ═════════════
//
//   C1   today: production's `createPreviewCooldown` — first render inside the keystroke, then a
//        cooldown equal to what the render cost (multiplier 1).
//   C1-copy  the harness's own copy of that cooldown, measured beside the real one: the control
//        for every candidate built from the copy.
//   C2   the same, with the first render moved off the keystroke into a 0 ms task.
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
//   pnpm perf:edit-preview                       everything, both engines (long: ~1 h)
//   pnpm perf:edit-preview -- --engine chromium --part render
//   pnpm perf:edit-preview -- --engine firefox --part typing --sizes small --profiles prose
//   pnpm perf:edit-preview -- --report           print the tables from the results on disk
//
// Each invocation writes one JSON file per (engine, part, size, profile) into `--out` (default: a
// `peekover-perf-edit-preview` directory under the OS temp directory) and `--report` reads them
// all, so a long run can be done in pieces. Results are not committed; the tables are pasted
// into `docs/ai/decisions.md`.

import { chromium, firefox } from 'playwright';
import type { Page } from 'playwright';
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
const PARTS = arg('part', 'all') === 'all' ? ['render', 'typing'] : [arg('part', 'all')];
const SIZES = list('sizes', 'small,50k,1m');
const PROFILES = list('profiles', 'prose,heavy');
const RATES = list('rates', '250,150,80').map(Number);
const REPS = Number(arg('reps', '2'));
const ONLY = arg('candidates', '');

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

const C1 = 'C1 today (x1, first render in the key)';

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

function report(): void {
  if (!fs.existsSync(OUT_DIR)) throw new Error(`no results in ${OUT_DIR}`);
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort();
  const all = files.map((f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')) as { part: string; engine: string; machine: string; at: string; describe?: string; rows: unknown[] });
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
