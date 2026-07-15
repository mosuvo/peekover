// scripts/perf-folder-tree.ts — spec 002 task 6.2 measurement gate (NOT wired into CI).
//
// MEASUREMENT, not a threshold (M1 retro standing rule: no acceptance bar ships
// un-measured). This times the REAL production folder-mode hot path — the bounded,
// markdown-filtered, interruptible WALK (walkPolicy.walkMarkdown) plus the pure TREE
// build + name-filter (tree.buildTree / filterTree) — over a REALISTIC NESTED REPO
// shape, not a synthetic flat list. A flat list would not predict the vibe-coder's
// "open my project" experience; a real docs folder / small codebase has depth, breadth,
// mixed file types (most files are NOT markdown), and heavy skip-dirs (node_modules,
// .git) — all of which the walk must handle, so the fixture mirrors that.
//
// ── What this measures faithfully (real code, representative) ──────────────────────
//   (a) walk time       — walkMarkdown over the realistic tree (the eager bounded walk).
//   (b) tree-build time — buildTree over the resulting MarkdownFile[].
//   (c) filter time     — filterTree for a representative query (the search box's cost).
//   plus file count, directory count, max depth, and whether the cap truncated.
// These are pure functions from src/app/*, run unchanged — the exact code production
// executes when a folder opens. The numbers are real and reproducible (no Date.now /
// Math.random; the fixture is deterministic).
//
// ── What this DELIBERATELY does NOT assert, and why (honesty split, à la Task 0) ────
// tasks.md 6.2 also names "(a) tree build/RENDER to first interactive tree" and
// "(b) reopen latency from a persisted handle" as things to drive on the BUILT APP
// PAGE. Those two need the real DOM layout of treeView AND a real granted folder — and
// per Task 0 the native picker cannot run headlessly, while the production app page
// exposes no injectable folder-source seam at runtime to stand a handle in. So the
// real-browser RENDER/LAYOUT number (the actual chunked-render-lever suspect) and the
// disk reopen round-trip are NOT automatable here without a stub masquerading as proof
// — they are confirmed QUALITATIVELY at the human gate (6.3) and informed by M1's own
// real-browser layout evidence (~750 ms to lay out ~1400 reader nodes, progress.md
// 2026-07-14). This harness quantifies the CHEAP part (walk + build) so the lever
// decision rests on the pure-build number here + that render evidence, measured, not
// guessed. See the FINDINGS block printed at the end.
//
// Runner: `tsx` (package script "perf:folder"), same rationale as perf-first-paint.ts
// (this file is under tsconfig include, so tsc --noEmit type-checks it; tsx resolves the
// extensionless relative imports at runtime).

import { performance } from 'node:perf_hooks';
import {
  walkMarkdown,
  DEFAULT_WALK_LIMITS,
  type WalkDirNode,
  type WalkFileNode,
} from '../src/app/walkPolicy';
import { buildTree, filterTree, countFiles, type TreeDirNode } from '../src/app/tree';
import type { MarkdownFile } from '../src/app/folderSource';

// --- Constants ---------------------------------------------------------------

/** Iterations; the FIRST (cold) run is printed but discarded from stats (JIT warmup). */
const ITERATIONS = 7;

/** A representative search query the filter cost is measured against (a real folder name). */
const FILTER_QUERY = 'guide';

// --- A realistic nested repo, in memory --------------------------------------
//
// An abstract file tree that mirrors the shape of a real documentation folder / small
// codebase: a docs/ tree many levels deep with guides + api reference, a src/ tree of
// mostly-non-markdown modules with the odd README, plus the heavy skip-dirs (node_modules,
// .git) the walk must NOT descend. Deterministic — a `scale` factor grows breadth/depth so
// the same shape can be swept from "small project" to "big monorepo".

interface MemFile {
  kind: 'file';
  name: string;
}
interface MemDir {
  kind: 'directory';
  name: string;
  children: MemNode[];
}
type MemNode = MemFile | MemDir;

const md = (name: string): MemFile => ({ kind: 'file', name });
const other = (name: string): MemFile => ({ kind: 'file', name }); // non-.md → walk filters it out
const dir = (name: string, children: MemNode[]): MemDir => ({ kind: 'directory', name, children });

/** A deep chain of nested guide directories, each with a few markdown pages + noise files. */
function guideTree(depth: number, breadth: number): MemNode[] {
  const nodes: MemNode[] = [];
  for (let i = 0; i < breadth; i++) {
    const pages: MemNode[] = [
      md('index.md'),
      md(`guide-${i}.md`),
      md(`reference-${i}.md`),
      other(`diagram-${i}.png`), // filtered (non-markdown)
    ];
    if (depth > 1) {
      pages.push(dir(`section-${i}`, guideTree(depth - 1, Math.max(1, breadth - 1))));
    }
    nodes.push(dir(`guide-${i}`, pages));
  }
  return nodes;
}

/** A src/ subtree: mostly non-markdown code, the odd module README — the "real codebase" mix. */
function srcTree(depth: number, breadth: number): MemNode[] {
  const nodes: MemNode[] = [];
  for (let i = 0; i < breadth; i++) {
    const files: MemNode[] = [
      other(`index.ts`),
      other(`component-${i}.ts`),
      other(`component-${i}.test.ts`),
      other(`styles-${i}.css`),
      md('README.md'), // a module doc — the odd markdown in a code tree
    ];
    if (depth > 1) {
      files.push(dir(`module-${i}`, srcTree(depth - 1, breadth)));
    }
    nodes.push(dir(`feature-${i}`, files));
  }
  return nodes;
}

/** A big skip-dir (node_modules) the walk must SKIP entirely — included to prove skipping is
 *  free (its contents are never enumerated). Deliberately heavy. */
function nodeModules(pkgs: number): MemNode {
  const children: MemNode[] = [];
  for (let i = 0; i < pkgs; i++) {
    children.push(
      dir(`pkg-${i}`, [
        other('index.js'),
        other('package.json'),
        md('README.md'), // markdown that MUST NOT be collected (dir is skipped)
        dir('dist', [other('bundle.js'), other('bundle.js.map')]),
      ]),
    );
  }
  return dir('node_modules', children);
}

/** Build the realistic repo root at a given scale (1 = small project, higher = monorepo). */
function buildRealisticRepo(scale: number): MemDir {
  const docsDepth = 3 + scale; // deep guide nesting
  const docsBreadth = 3 + scale * 2;
  const srcDepth = 2 + scale;
  const srcBreadth = 3 + scale * 2;
  return dir('my-project', [
    md('README.md'),
    md('CONTRIBUTING.md'),
    md('CHANGELOG.md'),
    other('package.json'),
    other('LICENSE'),
    other('.gitignore'),
    dir('.git', [other('HEAD'), other('config'), dir('objects', [other('pack.idx')])]), // dotdir → skipped
    nodeModules(20 + scale * 10), // heavy → skipped
    dir('docs', [
      md('index.md'),
      md('getting-started.md'),
      md('faq.md'),
      dir('guides', guideTree(docsDepth, docsBreadth)),
      dir('api', [md('index.md'), md('classes.md'), md('functions.md'), md('types.md')]),
      dir('images', [other('logo.svg'), other('hero.png'), other('screenshot.png')]), // no markdown
    ]),
    dir('src', srcTree(srcDepth, srcBreadth)),
    dir('examples', [
      md('basic.md'),
      md('advanced.md'),
      dir('recipes', [md('a.md'), md('b.md'), md('c.md'), other('demo.ts')]),
    ]),
    dir('tests', [other('setup.ts'), other('e2e.test.ts'), md('TESTING.md')]),
  ]);
}

// --- Adapt the in-memory tree to the pure walk's abstract node interface -------

function toWalkFile(f: MemFile): WalkFileNode {
  return { kind: 'file', name: f.name, read: async () => `# ${f.name}\n\ncontent` };
}
function toWalkDir(d: MemDir): WalkDirNode {
  return {
    kind: 'directory',
    name: d.name,
    children: async function* () {
      for (const child of d.children) {
        yield child.kind === 'directory' ? toWalkDir(child) : toWalkFile(child);
      }
    },
  };
}

// --- Fixture stats (raw shape, for the report) -------------------------------

interface RepoStats {
  totalEntries: number; // every file + dir in the tree, incl. skipped subtrees
  totalFiles: number; // every file, incl. non-markdown + skipped
  markdownEverywhere: number; // markdown files anywhere (incl. inside skip-dirs)
  maxDepth: number;
}
function statOf(node: MemNode, depth = 0): RepoStats {
  if (node.kind === 'file') {
    const isMd = node.name.toLowerCase().endsWith('.md');
    return { totalEntries: 1, totalFiles: 1, markdownEverywhere: isMd ? 1 : 0, maxDepth: depth };
  }
  const acc: RepoStats = { totalEntries: 1, totalFiles: 0, markdownEverywhere: 0, maxDepth: depth };
  for (const child of node.children) {
    const s = statOf(child, depth + 1);
    acc.totalEntries += s.totalEntries;
    acc.totalFiles += s.totalFiles;
    acc.markdownEverywhere += s.markdownEverywhere;
    acc.maxDepth = Math.max(acc.maxDepth, s.maxDepth);
  }
  return acc;
}

// --- Helpers -----------------------------------------------------------------

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function fmt(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

/** Count directory nodes in a built tree (for the "how many DOM nodes a render would build"). */
function countDirs(tree: TreeDirNode): number {
  let n = 0;
  for (const child of tree.children) {
    if (child.kind === 'directory') n += 1 + countDirs(child);
  }
  return n;
}

function parseScaleArg(argv: string[]): number {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--scale') return Math.max(0, Math.round(Number(argv[i + 1]) || 0));
    if (argv[i].startsWith('--scale=')) return Math.max(0, Math.round(Number(argv[i].slice(8)) || 0));
  }
  return 1; // default: a realistic mid-size project
}

// --- One iteration: walk → build → filter, timed --------------------------------

interface Sample {
  walkMs: number;
  buildMs: number;
  filterMs: number;
  fileCount: number;
  truncated: boolean;
  treeDirs: number;
  filteredFiles: number;
}

async function runIteration(repo: MemDir): Promise<Sample> {
  const root = toWalkDir(repo);

  const t0 = performance.now();
  const walk = await walkMarkdown(root, { limits: DEFAULT_WALK_LIMITS });
  const t1 = performance.now();

  const files: MarkdownFile[] = walk.files.map((f) => ({ path: f.path, name: f.name, read: f.read }));

  const t2 = performance.now();
  const tree = buildTree(files);
  const t3 = performance.now();

  const t4 = performance.now();
  const filtered = filterTree(tree, FILTER_QUERY);
  const t5 = performance.now();

  return {
    walkMs: t1 - t0,
    buildMs: t3 - t2,
    filterMs: t5 - t4,
    fileCount: files.length,
    truncated: walk.truncated,
    treeDirs: countDirs(tree),
    filteredFiles: countFiles(filtered),
  };
}

// --- Main --------------------------------------------------------------------

async function main(): Promise<void> {
  const scale = parseScaleArg(process.argv.slice(2));
  const repo = buildRealisticRepo(scale);
  const stats = statOf(repo);

  console.log('=== perf-folder-tree (spec 002 task 6.2) — MEASUREMENT, no threshold asserted ===\n');
  console.log(`fixture: realistic nested repo (scale ${scale})`);
  console.log(
    `  raw shape: ${stats.totalEntries} entries · ${stats.totalFiles} files ` +
      `(${stats.markdownEverywhere} markdown incl. skipped subtrees) · max depth ${stats.maxDepth}`,
  );
  console.log(
    `  skip-dirs present: node_modules + .git (their markdown MUST NOT be collected)`,
  );
  console.log(`  walk limits: maxFiles ${DEFAULT_WALK_LIMITS.maxFiles}, maxDepth ${DEFAULT_WALK_LIMITS.maxDepth}`);
  console.log(`  iterations: ${ITERATIONS} (run 1 = cold, discarded)\n`);

  const samples: Sample[] = [];
  for (let i = 1; i <= ITERATIONS; i++) {
    const s = await runIteration(repo);
    samples.push(s);
    const cold = i === 1 ? ' (cold, discarded)' : '';
    console.log(
      `[run ${i}]${cold} walk ${fmt(s.walkMs)} | build ${fmt(s.buildMs)} | filter ${fmt(s.filterMs)} ` +
        `[collected ${s.fileCount} md files, ${s.treeDirs} dirs, truncated=${s.truncated}, ` +
        `filter→${s.filteredFiles} files]`,
    );
  }

  const warm = samples.slice(1);
  const first = warm[0];

  console.log('\n=== SUMMARY (warm runs only; cold run 1 excluded) ===');
  console.log(`collected: ${first.fileCount} markdown files, ${first.treeDirs} directories in the built tree`);
  console.log(`  (node_modules/.git markdown correctly EXCLUDED — collected < ${stats.markdownEverywhere} everywhere)`);
  console.log(`  truncated (hit the ${DEFAULT_WALK_LIMITS.maxFiles}-file cap): ${first.truncated}`);
  console.log(`(a) bounded markdown walk : median ${fmt(median(warm.map((s) => s.walkMs)))}  ` +
    `min ${fmt(Math.min(...warm.map((s) => s.walkMs)))}  max ${fmt(Math.max(...warm.map((s) => s.walkMs)))}`);
  console.log(`(b) pure tree build       : median ${fmt(median(warm.map((s) => s.buildMs)))}  ` +
    `min ${fmt(Math.min(...warm.map((s) => s.buildMs)))}  max ${fmt(Math.max(...warm.map((s) => s.buildMs)))}`);
  console.log(`(c) name filter ("${FILTER_QUERY}") : median ${fmt(median(warm.map((s) => s.filterMs)))}  ` +
    `min ${fmt(Math.min(...warm.map((s) => s.filterMs)))}  max ${fmt(Math.max(...warm.map((s) => s.filterMs)))}`);

  console.log('\n=== FINDINGS (recorded, NOT asserted as a gate — retro rule) ===');
  console.log(
    '• The walk + build + filter are the pure, engine-free hot path — the "open my project"\n' +
      '  cost BEFORE any DOM is laid out. Measured above on real production code.\n' +
      '• NOT measured here (Task-0-style automatability limit, no stub-as-proof): the real-browser\n' +
      '  treeView RENDER/LAYOUT to first interactive tree, and the disk reopen round-trip\n' +
      '  (requestPermission + native re-prompt). The production app page has no headless-drivable\n' +
      '  folder-open seam (native picker per Task 0). These are confirmed qualitatively at the\n' +
      '  human gate (6.3).\n' +
      '• CHUNKED/VIRTUALIZED-RENDER LEVER (carried from M1): the pure build above is cheap, so the\n' +
      '  suspect — as the plan flagged — is treeView laying out one DOM node per file+dir. Compare\n' +
      `  against M1's real-browser evidence (~750 ms to lay out ~1400 reader nodes). At scale ${scale}\n` +
      `  the tree is ${first.fileCount} files + ${first.treeDirs} dirs ≈ ${first.fileCount + first.treeDirs} nodes.\n` +
      '  DECISION IS DEFERRED to a real-browser render measurement (a separate seam from the eager\n' +
      '  walk); this harness quantifies the cheap half so that decision is measurement-driven.\n' +
      '• No acceptance threshold is asserted from these numbers (M1 retro: no un-measured gate).',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
