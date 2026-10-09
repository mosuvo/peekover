// scripts/perf-edit-never-entered.ts — 012 task 6.3's second table: FIRST PAINT WITH EDIT MODE
// NEVER ENTERED, against a build from before the editor existed. NOT wired into CI; run by hand.
//
// ════ NOTHING HERE CHOOSES, AND NOTHING HERE IS A NEW INSTRUMENT ════════════════════════════════
//
// The two numbers are the EXISTING first-paint gates, run exactly as they ship:
//   `perf-first-paint.ts --size 50kb`   the content-script reader, the gated 50.4 KB document
//   `perf-app-first-paint.ts`           the app page, the same document
// Both measure whatever build sits in `<cwd>/.output/chrome-mv3`. This script only RUNS them —
// the same script files, from this checkout — with the working directory pointed at each build in
// turn, interleaved, and prints the readings side by side. Arm A is this checkout's build; every
// `--baseline` is another tree's. A is first and last in every round (A-B-A), so A against itself
// is on the page beside every difference. No threshold is asserted; `GATE_MS` is theirs.
//
// CHROMIUM ONLY, as both gates are: Playwright cannot load an extension into Firefox.
//
// ════ THE STRUCTURAL HALF: IS THE EDITOR FETCHED BEFORE EDIT IS ENTERED? ════════════════════════
//
// A timing difference between two builds cannot say WHY. So, on arm A's build, the app page is
// opened on the same document and every request it makes is recorded up to first paint; then the
// Edit control is activated and the requests it causes are recorded too. The second list is the
// firing control — it must be non-empty, or the instrument cannot see chunk requests at all — and
// the claim is that none of its URLs is in the first list.
//
// ════ RUNNING IT ════════════════════════════════════════════════════════════════════════════════
//
//   pnpm build                                            arm A must be built first
//   git archive <commit> | tar -x -C <dir>                a baseline tree, outside this checkout,
//   (cd <dir> && pnpm install --frozen-lockfile && pnpm build)      ...installed and built
//   pnpm exec tsx scripts/perf-edit-never-entered.ts --baseline pre-m12=<dir> [--baseline x=<dir>]
//       [--rounds 5] [--skip-probe] [--skip-gates]
//
// Leave the machine alone while it runs: one stray command moved a reading by 8 ms (measured —
// the first run of this task, whose last app-page arm overlapped a process listing).

import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildHugeDoc } from '../tests/golden/hugeDoc';

const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
function option(name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

interface Arm {
  label: string;
  dir: string;
}

const HERE = process.cwd();
const ROUNDS = Number(option('rounds', '5'));
const BASELINES: Arm[] = argv.flatMap((a, i) => {
  if (a !== '--baseline' || !argv[i + 1]) return [];
  const [label, ...rest] = argv[i + 1].split('=');
  return [{ label, dir: path.resolve(rest.join('=')) }];
});

interface Gate {
  name: string;
  script: string;
  args: string[];
  /** The per-run line's own label for the gated span. */
  span: RegExp;
}
const GATES: Gate[] = [
  { name: 'content script (`pnpm perf -- --size 50kb`)', script: 'perf-first-paint.ts', args: ['--size', '50kb'], span: /^\[run (\d+)\].*?\(a\) nav->paint ([\d.]+)ms/ },
  { name: 'app page (`pnpm perf:app`)', script: 'perf-app-first-paint.ts', args: [], span: /^\[run (\d+)\].*?\(a\) start->paint ([\d.]+)ms/ },
];

const sorted = (xs: number[]): number[] => [...xs].sort((a, b) => a - b);
function median(xs: number[]): number {
  const s = sorted(xs);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
const signed = (x: number): string => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x).toFixed(1)}`;

/** One invocation of a gate against the build in `dir`: its warm runs (run 1 is its cold run). */
function runGate(gate: Gate, dir: string): number[] {
  if (!fs.existsSync(path.join(dir, '.output', 'chrome-mv3', 'manifest.json'))) {
    throw new Error(`no build at ${dir}/.output/chrome-mv3 — build that tree first`);
  }
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(HERE, 'scripts', gate.script), ...gate.args], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`${gate.script} in ${dir} exited ${result.status}:\n${result.stdout}\n${result.stderr}`);
  const warm: number[] = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    const m = gate.span.exec(line);
    if (m && Number(m[1]) > 1) warm.push(Number(m[2]));
  }
  if (warm.length === 0) throw new Error(`${gate.script}: no warm runs parsed from its output`);
  return warm;
}

function gates(arms: Arm[]): void {
  const order = [arms[0], ...arms.slice(1)];
  for (const gate of GATES) {
    const invocations = new Map<string, number[][]>(arms.map((a) => [a.label, []]));
    for (let round = 0; round < ROUNDS; round += 1) {
      for (const arm of order) {
        const warm = runGate(gate, arm.dir);
        invocations.get(arm.label)!.push(warm);
        console.log(`[${gate.script}] round ${round + 1} · ${arm.label.padEnd(10)} median ${median(warm).toFixed(1)} floor ${Math.min(...warm).toFixed(1)}`);
      }
    }
    // The closing A of the A-B-A.
    const last = runGate(gate, arms[0].dir);
    invocations.get(arms[0].label)!.push(last);
    console.log(`[${gate.script}] closing  · ${arms[0].label.padEnd(10)} median ${median(last).toFixed(1)} floor ${Math.min(...last).toFixed(1)}`);

    console.log(`\n### First paint, edit never entered — ${gate.name}\n`);
    console.log('| Build | invocations | warm runs | median, ms | floor, ms | per-invocation medians, ms | per-invocation floors, ms |');
    console.log('|---|--:|--:|--:|--:|--:|--:|');
    const pooled = new Map<string, number[]>();
    for (const arm of arms) {
      const runs = invocations.get(arm.label)!;
      const all = runs.flat();
      pooled.set(arm.label, all);
      const medians = runs.map(median);
      const floors = runs.map((r) => Math.min(...r));
      console.log(
        `| ${arm.label} | ${runs.length} | ${all.length} | ${median(all).toFixed(1)} | ${Math.min(...all).toFixed(1)} | ` +
          `${Math.min(...medians).toFixed(1)} – ${Math.max(...medians).toFixed(1)} | ${Math.min(...floors).toFixed(1)} – ${Math.max(...floors).toFixed(1)} |`,
      );
    }
    const a = pooled.get(arms[0].label)!;
    const aMedians = invocations.get(arms[0].label)!.map(median);
    const aFloors = invocations.get(arms[0].label)!.map((r) => Math.min(...r));
    console.log('');
    for (const arm of arms.slice(1)) {
      const b = pooled.get(arm.label)!;
      console.log(`- ${arms[0].label} − ${arm.label}: median ${signed(median(a) - median(b))} ms, floor ${signed(Math.min(...a) - Math.min(...b))} ms.`);
    }
    console.log(
      `- ${arms[0].label} against itself, across its ${aMedians.length} invocations: medians span ${(Math.max(...aMedians) - Math.min(...aMedians)).toFixed(1)} ms, ` +
        `floors span ${(Math.max(...aFloors) - Math.min(...aFloors)).toFixed(1)} ms.\n`,
    );
  }
}

/** What the app page requests before first paint, and what activating Edit then adds. */
async function probe(): Promise<void> {
  const ext = path.join(HERE, '.output', 'chrome-mv3');
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-never-entered-'));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  try {
    let [sw] = ctx.serviceWorkers();
    if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 30_000 });
    const url = `chrome-extension://${new URL(sw.url()).host}/app.html?__peekoverHarness=1`;
    const page = await ctx.newPage();
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url().replace(/^chrome-extension:\/\/[^/]+\//, '')));
    await page.goto(url, { waitUntil: 'load' });
    // Predicates are FUNCTIONS: the extension page's CSP refuses a string predicate's eval.
    await page.waitForFunction(() => '__peekoverHarness' in window);
    await page.evaluate(
      `(async () => {
        const root = await navigator.storage.getDirectory();
        const dir = await root.getDirectoryHandle('peekover-never-entered', { create: true });
        const fh = await dir.getFileHandle('doc.md', { create: true });
        const w = await fh.createWritable();
        await w.write(${JSON.stringify(buildHugeDoc(62))});
        await w.close();
        await window.__peekoverHarness.openFromHandle(dir);
        document.querySelector('[role="treeitem"][data-kind="file"]').click();
      })()`,
    );
    await page.waitForFunction(() => {
      const reader = document.querySelector('.peekover-app__reader__host')?.shadowRoot?.querySelector('.peekover-reader');
      return !!reader && reader.childElementCount > 0;
    });
    await page.waitForTimeout(1500); // well past first paint: anything "post-mount but unasked" would have gone by now
    const before = [...requests];
    await page.locator('.peekover-edit-toggle').click();
    await page.waitForFunction(() => document.querySelector('.peekover-app__reader__host')?.getAttribute('data-mode') === 'edit');
    await page.waitForTimeout(500);
    const after = requests.slice(before.length);
    const early = after.filter((u) => before.includes(u));
    console.log('\n### Is the editor fetched before edit is entered? (app page, this checkout\'s build)\n');
    console.log(`- Requests from page load to 1.5 s after first paint, edit never entered: **${before.length}**.`);
    console.log(`- Requests caused by activating Edit (the firing control — must be more than none): **${after.length}** — ${after.map((u) => `\`${u}\``).join(', ') || 'NONE: the instrument saw nothing, so the line below proves nothing'}.`);
    console.log(`- Of those, already requested before edit was entered: **${early.length}**${early.length ? ` — ${early.join(', ')}` : ''}.\n`);
  } finally {
    await ctx.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const arms: Arm[] = [{ label: 'HEAD', dir: HERE }, ...BASELINES];
  console.log(`Machine: ${os.cpus()[0]?.model.trim()} x${os.cpus().length}, ${Math.round(os.totalmem() / 2 ** 30)} GB, ${os.platform()} ${os.release()}, node ${process.version}.`);
  console.log(`Arms: ${arms.map((a) => `${a.label} = ${a.dir}`).join(' · ')}. ${ROUNDS} round(s), each gate's own 7 iterations (first discarded).\n`);
  if (!flag('skip-probe')) await probe();
  if (!flag('skip-gates')) {
    if (arms.length < 2) throw new Error('no --baseline label=dir given: there is nothing to compare against');
    gates(arms);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
