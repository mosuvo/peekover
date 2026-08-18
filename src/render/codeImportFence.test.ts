// The CODE IMPORT FENCE — 009 task 4.5's static half, mirroring `diagramImportFence.test.ts`'s
// (007 task 3.4) four-clause shape in `diffEngine.test.ts`'s source-text discipline (006 §1.4).
//
// ── WHY THIS EXISTS WHEN THE BYTE FENCE ALREADY PASSES ────────────────────────────────────────
//
// The guarantee "shiki never reaches the content script" has, up to 4.4, been carried by a BYTE
// observation only. A static edge added to a content-script-reachable module whose exports
// tree-shook away would move few bytes or none, and the byte fence would call that green while the
// architecture had changed underneath it (`spread defeats tree-shaking`, the mirror case: bytes
// moved for a reason unrelated to architecture). So this file asserts the guarantee STRUCTURALLY,
// over the SOURCE GRAPH — same walker shape as 007's own precedent, `shiki`/`codeEnhancer.ts`/
// `codeEngine.ts` substituted for `mermaid`/`diagramEnhancer.ts`/`diagramEngine.ts`.
//
// ── THE FOUR CLAUSES (tasks.md 4.5, D-2) ──────────────────────────────────────────────────────
//
//   A — THE FENCE. The content-script graph, walked from `entrypoints/peekover.content.ts`,
//       reaches neither `codeEnhancer.ts` nor `codeEngine.ts`, and imports no `shiki` specifier
//       anywhere.
//   B — THE CONTROL. The APP-PAGE graph, walked from `entrypoints/app/main.ts` — same walker, same
//       run — MUST reach both modules and MUST import `shiki`. Real for the first time at 4.5
//       because 4.1 wired both call sites (`readerPane.ts:205`, `appShell.ts:163`); a broken
//       traversal would satisfy clause A vacuously and forever, and cannot satisfy clause B too.
//   C — THE LAZINESS PIN, RE-DERIVED AGAINST codeEngine.ts AT HEAD, NOT TASKS.MD'S ORIGINAL
//       PREDICTION. tasks.md 4.5's own prose still literally predicts "ONE dynamic edge
//       (`import('shiki/core')`) plus TWO static leaves (`shiki/package.json`,
//       `shiki/engine/javascript`)" — a prediction `codeEngine.ts`'s own module header (§"THE
//       DYNAMIC/STATIC EDGE COUNT", written at task 4.2's close) already names as stale: task 4.2
//       added seven more dynamic edges (six curated language loaders, one theme loader), each its
//       own literal specifier, and there is a THIRD static leaf tasks.md's text never accounted
//       for — the type-only `import type { HighlighterCore, ... } from 'shiki/core'` a few lines
//       above the dynamic loader. This file's walker (mirroring 007's own, unchanged) does not
//       distinguish type-only imports from value imports — by the SAME deliberate policy 007's own
//       header states ("TYPE-ONLY IMPORTS COUNT AS EDGES, deliberately... still a module that
//       'learns the engine exists'"), which was written for clause A/B's reachability question but
//       applies unchanged to clause C's specifier-count question: an edge is an edge regardless of
//       which clause is counting it. So tasks.md's "TWO" static leaves is read here as a
//       PREDICTION superseded by measurement — the same way 007's own `toHaveLength(1)` clause-C
//       shape was itself explicitly flagged by tasks.md 4.5 as not to be copied unadjusted — not as
//       a design rule this file must force the type-only import to dodge. The resolution: THREE
//       static specifiers (`shiki/package.json`, `shiki/engine/javascript`, and the type-only
//       `shiki/core`), asserted `toHaveLength(3)`, named here so a future reader does not re-derive
//       the reasoning. The one property 007's clause C actually cares about — the ENGINE edge
//       itself must be DYNAMIC, or its chunk ships eager — is preserved unchanged and pinned
//       separately below; the six-language/one-theme loader set is curated and PROVISIONAL
//       (`codeEngine.ts`'s own header), expected to move at task 8.5 (M-5, the language-catalog
//       decision) — its count is asserted too, but named explicitly as the expected next mutation
//       point, not a ceiling this fence enforces beyond "still lazy".
//
//       A SECOND, NARROWER WRINKLE FOUND WRITING THIS FILE (not anticipated by the kickoff that
//       produced it): `codeEngine.ts:138` has `(typeof import('shiki/core'))['createHighlighterCore']`
//       — TypeScript's `typeof import(...)` type-query operator, which textually matches the same
//       `import(` shape as the REAL runtime dynamic import a few lines below (`:147`) but is fully
//       type-erased and can never make a chunk eager. A raw-text walker cannot otherwise tell the
//       two apart, so `edgesOf` explicitly reclassifies a `typeof import(...)` match as a static
//       (non-dynamic) edge — see {@link isTypeQueryPosition}. This keeps the engine's laziness pin
//       ("exactly ONE dynamic `shiki/core` edge") honest, and folds the type-query occurrence into
//       the SAME static `shiki/core` specifier the type-only `import type` already contributes,
//       counted by distinct specifier text rather than by source line (clause C's third test).
//   D — TRAVERSAL NON-VACUITY. Both graphs are non-trivial with named landmarks, and every local
//       specifier resolved — an unresolved edge is a hole the fence cannot see through.
//
//   ADDENDUM (task 5.2, D-9): the "six-language/one-theme" count in clause C's own paragraph above
//   is a DATED snapshot of task 4.2's close, left untouched as evidence rather than edited to lie
//   about when it held (the D-10(b)/9.3 precedent this milestone already established elsewhere).
//   `THEME_LOADERS` now carries 20 themes (task 5.2's byte-budget/contrast-filtered selection,
//   `codeEngine.ts`'s own module header), so the loader-edge count below is 26, not 7 — the number
//   the "every language/theme loader edge is dynamic" test actually asserts.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd(); // vitest runs from the project root

/** The content script's single entry — the graph the fence protects. */
const CONTENT_ENTRY = 'entrypoints/peekover.content.ts';
/** The app page's single entry — clause B's control graph. */
const APP_ENTRY = 'entrypoints/app/main.ts';

const ENHANCER = 'src/render/codeEnhancer.ts';
const ENGINE = 'src/render/codeEngine.ts';

// ── Source scanning (the diagramImportFence.test.ts / diffEngine.test.ts shape, unchanged) ─────

/** 1-based line of `index` in `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

/** Blank `//` and block comments, preserving length AND newline positions so match indices still
 *  map to true line numbers, and leaving string/template literals intact (the specifier we scan
 *  for IS a string). Without this the prose in `codeEngine.ts`'s header — which discusses
 *  `import('shiki/core')` and every language-loader specifier at length — would be read as edges. */
function blankComments(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    const nx = src[i + 1];
    if (ch === '/' && nx === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && nx === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < n) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        if (c === '\\') {
          out += c + (src[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += c;
        i += 1;
        if (c === q) break;
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

interface Edge {
  /** The specifier as written. */
  readonly spec: string;
  /** 1-based line in the importing file. */
  readonly line: number;
  /** `import('x')` rather than `import … from 'x'`. Clause C reads this. Type-only imports are
   *  NOT dynamic — they match the static `fromRe` below, deliberately (see module header). */
  readonly dynamic: boolean;
}

/** True when the `import(` at `matchIndex` in `code` is actually TypeScript's `typeof import(...)`
 *  type-query operator — e.g. `(typeof import('shiki/core'))['createHighlighterCore']`
 *  (`codeEngine.ts:138`) — rather than a runtime dynamic import. `typeof import(...)` is a TYPE
 *  position: it is fully erased at compile time (unlike `import type … from 'x'`, it does not even
 *  leave a bare specifier in the emitted JS) and can never make a chunk eager. A raw text scan
 *  cannot otherwise tell it apart from `() => import('shiki/core')` a few lines below, which IS a
 *  real runtime edge — so this is checked explicitly rather than silently double-counted as
 *  dynamic. Found this session (task 4.5): codeEngine.ts's own module header claims "THE single
 *  `import('shiki/core')` in the repository", which is true in TS-semantics terms and false as a
 *  raw textual match count — this function reconciles the two. */
function isTypeQueryPosition(code: string, matchIndex: number): boolean {
  return /\btypeof\s*$/.test(code.slice(0, matchIndex));
}

/** Every module specifier `src` imports: `import … from 'x'` (value AND type-only), `export …
 *  from 'x'`, side-effect `import 'x'`, and dynamic `import('x')` — excluding a `typeof import(…)`
 *  type query, which is reclassified as a static (non-dynamic) edge; see {@link isTypeQueryPosition}. */
function edgesOf(src: string): Edge[] {
  const code = blankComments(src);
  const out: Edge[] = [];
  const fromRe = /\b(?:import|export)\b[^;]*?\bfrom\s*(['"])([^'"]+)\1/g;
  const sideEffectRe = /\bimport\s+(['"])([^'"]+)\1/g;
  const dynamicRe = /\bimport\s*\(\s*(['"])([^'"]+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  while ((m = sideEffectRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  while ((m = dynamicRe.exec(code)) !== null) {
    out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: !isTypeQueryPosition(code, m.index) });
  }
  return out;
}

// ── Resolution ───────────────────────────────────────────────────────────────────────────────

/** WXT's virtual module. Not a file on disk and not ours; it contributes no application edge. */
const VIRTUAL = new Set(['#imports']);

/** True for a specifier that names a file in THIS repository rather than a package. */
function isLocal(spec: string): boolean {
  return spec.startsWith('.') || spec.startsWith('@/');
}

/** Repo-relative path (POSIX separators) of an absolute path. */
function rel(abs: string): string {
  return abs.slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, '');
}

/**
 * Resolve a LOCAL specifier to a repo-relative `.ts` path, or `null` if it names something that is
 * not a TypeScript module (the `?inline` font assets, `shiki/package.json`-style JSON leaves are
 * non-local so they never reach this function) — those are leaves, not graph nodes.
 * Returns `undefined` when resolution FAILS, which clause D treats as a hole and fails on.
 */
function resolveLocal(fromFile: string, spec: string): string | null | undefined {
  const bare = spec.split('?')[0];
  const abs = bare.startsWith('@/')
    ? resolve(ROOT, bare.slice(2))
    : resolve(dirname(join(ROOT, fromFile)), bare);
  if (/\.(woff2?|css|svg|png|json|html)$/i.test(bare)) return null; // an asset leaf, not a module
  for (const candidate of [`${abs}.ts`, join(abs, 'index.ts'), abs]) {
    if (existsSync(candidate) && candidate.endsWith('.ts')) return rel(candidate);
  }
  return undefined;
}

interface Graph {
  /** Every repo-relative `.ts` module reachable from the entry, the entry included. */
  readonly modules: Set<string>;
  /** Every non-local (package) specifier imported from somewhere in the graph. */
  readonly packages: Array<{ from: string; spec: string; line: number; dynamic: boolean }>;
  /** Specifiers that looked local and did not resolve — clause D's holes. */
  readonly unresolved: string[];
}

/** Walk every edge — static AND dynamic, value AND type — out of `entry`. */
function graphFrom(entry: string): Graph {
  const modules = new Set<string>();
  const packages: Graph['packages'] = [];
  const unresolved: string[] = [];
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (modules.has(file)) continue;
    modules.add(file);

    for (const { spec, line, dynamic } of edgesOf(readFileSync(join(ROOT, file), 'utf8'))) {
      if (VIRTUAL.has(spec)) continue;
      if (!isLocal(spec)) {
        packages.push({ from: file, spec, line, dynamic });
        continue;
      }
      const target = resolveLocal(file, spec);
      if (target === undefined) {
        unresolved.push(`${file}:${line} — '${spec}'`);
        continue;
      }
      if (target === null) continue; // asset leaf
      if (!modules.has(target)) queue.push(target);
    }
  }
  return { modules, packages, unresolved };
}

/** True if `spec` pulls the `shiki` package (bare, or any subpath). */
function isShiki(spec: string): boolean {
  return spec === 'shiki' || spec.startsWith('shiki/');
}

// ── The graphs, walked once ──────────────────────────────────────────────────────────────────

const contentGraph = graphFrom(CONTENT_ENTRY);
const appGraph = graphFrom(APP_ENTRY);

describe('the code import fence — clause D, the traversal itself (non-vacuity)', () => {
  it('walks two non-trivial graphs whose landmarks are present', () => {
    // If either walk collapsed to the entry alone, clause A below would pass on an empty set.
    expect(contentGraph.modules.size).toBeGreaterThan(10);
    expect(appGraph.modules.size).toBeGreaterThan(20);

    expect([...contentGraph.modules]).toEqual(
      expect.arrayContaining([
        CONTENT_ENTRY,
        'src/render/runReader.ts',
        'src/render/mountReader.ts',
        'src/render/mount.ts',
        'src/watch/contentWatch.ts',
      ]),
    );
    expect([...appGraph.modules]).toEqual(
      expect.arrayContaining([APP_ENTRY, 'src/app/appShell.ts', 'src/app/readerPane.ts']),
    );
  });

  it('resolved every local specifier in both graphs — an unresolved edge is a hole', () => {
    // A specifier that looks local and does not resolve is a subtree the walk never entered. The
    // fence would then be silent about whatever lives down it, which is indistinguishable from the
    // fence holding. So it fails here, naming the edge.
    expect(
      [...contentGraph.unresolved, ...appGraph.unresolved],
      'these specifiers looked local but resolved to no .ts file — the walk could not follow them, ' +
        'so the fence below cannot speak for what they reach. Fix the resolver or the import:',
    ).toEqual([]);
  });
});

describe('the code import fence — clause A, the content-script graph (§3.2, D-2)', () => {
  it('reaches NEITHER codeEnhancer NOR codeEngine, by any edge', () => {
    const offenders = [ENHANCER, ENGINE].filter((m) => contentGraph.modules.has(m));
    expect(
      offenders,
      `the content-script entry (${CONTENT_ENTRY}) must not reach the code modules by any edge — ` +
        `static, dynamic, or type-only. §3.2's gate IS the module graph, not a runtime check: the ` +
        `content-script reader leaves a code fence as an ordinary block because it never learns the ` +
        `enhancer exists. Reached:`,
    ).toEqual([]);
  });

  it('imports no `shiki` specifier anywhere in that graph', () => {
    const offenders = contentGraph.packages
      .filter((p) => isShiki(p.spec))
      .map((p) => `${p.from}:${p.line} — import '${p.spec}'`);
    expect(
      offenders,
      '`shiki` in the content-script graph = the fence broke and §3.2 with it (tasks.md 4.5: ' +
        'STOP-and-flag). Offending import(s):',
    ).toEqual([]);
  });
});

describe('the code import fence — clause B, the app-page graph IS the control', () => {
  it('reaches BOTH code modules — so clause A is a real absence, not a broken walk', () => {
    // THE CONTROL FIRES HERE OR CLAUSE A MEANS NOTHING. Same walker, same run, opposite verdict.
    // Real for the first time at 4.5 (tasks.md's own framing): 4.1 wired both call sites
    // (`readerPane.ts:205`, `appShell.ts:163`), which is what makes this graph actually reach here.
    expect(
      [...appGraph.modules],
      `the app-page entry (${APP_ENTRY}) MUST reach both code modules — it is the only surface that ` +
        `enhances. If this fails, the walker is broken and clause A's empty result is vacuous.`,
    ).toEqual(expect.arrayContaining([ENHANCER, ENGINE]));
  });

  it('imports `shiki` from within that graph', () => {
    const found = appGraph.packages.filter((p) => isShiki(p.spec));
    expect(
      found.map((p) => `${p.from}:${p.line} — '${p.spec}'${p.dynamic ? ' (dynamic)' : ''}`),
      'the app-page graph MUST import shiki — the package-specifier half of the same control.',
    ).not.toEqual([]);
  });
});

describe('the code import fence — clause C, the chunk stays LAZY (D-2, D-3)', () => {
  // Scanned over the UNION of both graphs: the whole production tree any entry can reach. Deduped
  // by call site + specifier + dynamic-ness, because a module reachable from BOTH entries is walked
  // twice and its imports would otherwise be counted twice — exactly the state a broken clause A
  // leaves behind, which would garble clause C's message at the moment it matters most.
  const all = [
    ...new Map(
      [...contentGraph.packages, ...appGraph.packages]
        .filter((p) => isShiki(p.spec))
        .map((p) => [`${p.from}:${p.line}:${p.spec}:${p.dynamic}`, p] as const),
    ).values(),
  ];

  it('the shiki ENGINE is loaded by exactly ONE dynamic `shiki/core` edge, in codeEngine.ts', () => {
    const engineEdges = all.filter((p) => p.spec === 'shiki/core' && p.dynamic);
    expect(
      engineEdges.map((p) => `${p.from}:${p.line} — '${p.spec}'${p.dynamic ? ' (dynamic)' : ' (STATIC)'}`),
      `D-2/D-3: exactly one dynamic \`import('shiki/core')\` edge in the repository, in ${ENGINE}. Found:`,
    ).toHaveLength(1);
    expect(engineEdges[0]?.from).toBe(ENGINE);

    // THE STRUCTURAL CLAIM THE BYTE FENCE CANNOT MAKE (mirrors 007's own clause-C claim for
    // mermaid). A static `import … from 'shiki/core'` here would put the engine in whatever chunk
    // `codeEngine.ts` lands in — the app page's EAGER chunk — and the lazy entry would stop being
    // lazy, possibly while tree-shaking to bytes the byte fence reads as green. This assertion does
    // not care about bytes.
  });

  it('every language/theme loader edge is dynamic too — a static one would ship it eagerly', () => {
    const loaderEdges = all.filter(
      (p) => p.spec !== 'shiki/core' && p.spec !== 'shiki/package.json' && p.spec !== 'shiki/engine/javascript',
    );
    expect(loaderEdges.length, 'non-vacuity: this sub-check needs at least one loader edge to mean anything').toBeGreaterThan(0);

    const staticLeaks = loaderEdges
      .filter((p) => !p.dynamic)
      .map((p) => `${p.from}:${p.line} — '${p.spec}' (STATIC)`);
    expect(
      staticLeaks,
      'every shiki/langs or shiki/themes specifier must be a DYNAMIC edge — a static one pulls that ' +
        'grammar/theme into the eager app-page chunk regardless of whether the language is ever used:',
    ).toEqual([]);

    // Six curated languages + twenty themes = 26 loader edges today (codeEngine.ts's own header:
    // languages stay PROVISIONAL AND EXPLICITLY BOUNDED, expected to move at task 8.5; the theme
    // set is task 5.2's byte-budget/contrast-filtered selection — see that module's header for the
    // full rule). This count is the expected mutation point for whichever task next changes either
    // catalog — named here, not enforced as a ceiling beyond "lazy".
    expect(loaderEdges.map((p) => p.spec).sort()).toEqual(
      [
        'shiki/langs/css.mjs',
        'shiki/langs/html.mjs',
        'shiki/langs/javascript.mjs',
        'shiki/langs/json.mjs',
        'shiki/langs/python.mjs',
        'shiki/langs/shellscript.mjs',
        'shiki/themes/andromeeda.mjs',
        'shiki/themes/aurora-x.mjs',
        'shiki/themes/dark-plus.mjs',
        'shiki/themes/github-dark.mjs',
        'shiki/themes/github-light.mjs',
        'shiki/themes/horizon-bright.mjs',
        'shiki/themes/horizon.mjs',
        'shiki/themes/laserwave.mjs',
        'shiki/themes/light-plus.mjs',
        'shiki/themes/min-dark.mjs',
        'shiki/themes/min-light.mjs',
        'shiki/themes/monokai.mjs',
        'shiki/themes/plastic.mjs',
        'shiki/themes/red.mjs',
        'shiki/themes/slack-dark.mjs',
        'shiki/themes/slack-ochin.mjs',
        'shiki/themes/solarized-dark.mjs',
        'shiki/themes/vesper.mjs',
        'shiki/themes/vitesse-black.mjs',
        'shiki/themes/vitesse-light.mjs',
      ].sort(),
    );
  });

  it('the only STATIC shiki specifiers are the three named leaves — two value, one type-only', () => {
    // Re-derived against codeEngine.ts at HEAD, NOT tasks.md 4.5's original "TWO" prediction — see
    // module header §C above for the full reasoning. The type-only `import type {...} from
    // 'shiki/core'` (line 84) is counted here because this file's walker does not (and per 007's
    // own stated policy, should not) distinguish it from a value-level static import. `shiki/core`
    // ALSO appears a second time in static/type position via `typeof import('shiki/core')`
    // (`codeEngine.ts:138`, reclassified non-dynamic by {@link isTypeQueryPosition}) — counted by
    // DISTINCT SPECIFIER TEXT, not by source occurrence, because tasks.md 4.5's own clause-C prose
    // names "the two allowed static, non-dynamic SPECIFIERS" — a specifier is a string identity,
    // not a line — so two static occurrences of the same 'shiki/core' text are still one specifier.
    const statics = all.filter((p) => !p.dynamic);
    const staticSpecs = [...new Set(statics.map((p) => p.spec))].sort();
    expect(
      statics.map((p) => `${p.from}:${p.line} — '${p.spec}'`),
      'the only static shiki specifiers permitted are `shiki/package.json` (a version string, no ' +
        `engine code), \`shiki/engine/javascript\` (the locked JS-regex engine, D-3), and the ` +
        `type-only \`shiki/core\` (an \`import type\` and a \`typeof import\` occurrence, same ` +
        `specifier) — all in ${ENGINE}. Found:`,
    ).not.toEqual([]);
    expect(staticSpecs, 'distinct static specifier TEXTS — this is the count clause C pins').toHaveLength(3);
    expect(staticSpecs).toEqual(['shiki/core', 'shiki/engine/javascript', 'shiki/package.json'].sort());
    expect(statics.every((p) => p.from === ENGINE)).toBe(true);
  });
});
