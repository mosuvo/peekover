// The DIAGRAM IMPORT FENCE — 007 task 3.4's static half, in `diffEngine.test.ts`'s source-text
// shape (006 §1.4, the architectural proof the M6 retraction left standing).
//
// ── WHY THIS EXISTS WHEN THE BYTE FENCE ALREADY PASSES ────────────────────────────────────────
//
// All milestone long the guarantee "mermaid never reaches the content script" has been carried by
// a BYTE observation: `.output/*/content-scripts/peekover.js` has measured 315,974 B unchanged
// across every diagram commit, and `grep -c mermaid` over it returns 0. That is a
// COINCIDENCE-DETECTOR. It catches a leak only because the leak happens to move bytes. A static
// `import { enhanceDiagrams } from './diagramEnhancer'` added to a content-script module whose
// every named export tree-shook away would move few bytes or none — and the byte fence would call
// that green while the architecture had changed underneath it. (M6's own lesson, `spread defeats
// tree-shaking`, is the mirror case: bytes moved for a reason that had nothing to do with the
// architecture. Bytes are evidence about bytes.)
//
// So this file asserts the guarantee STRUCTURALLY, over the SOURCE GRAPH: which modules the
// content-script entrypoint can reach at all, by any edge, static or dynamic. It reds on the edge
// itself, regardless of what the bundler later does with it.
//
// ── WHAT IT IS NOT ────────────────────────────────────────────────────────────────────────────
//
// It is NOT `scripts/check-dynamic-imports.ts` again. That script enforces SPECIFIER STATICNESS —
// no `import(someVariable)`, no `import('https://…')` — a property of the specifier, scanned
// file-by-file with no notion of who reaches whom. This file enforces REACHABILITY — a property of
// the graph. `import('mermaid')` passes that script (a static string literal) and is exactly the
// edge this file measures the position of. Neither subsumes the other, and neither is extended
// here.
//
// ── THE FOUR CLAUSES ──────────────────────────────────────────────────────────────────────────
//
//   A — THE FENCE. Walking every edge out of `entrypoints/peekover.content.ts`, the content-script
//       graph reaches neither `diagramEnhancer.ts` nor `diagramEngine.ts`, and imports no `mermaid`
//       specifier anywhere. This is §3.2's gate stated as what it actually is: the module graph,
//       not a runtime check (`diagramEnhancer.ts:337`).
//   B — THE CONTROL, and the reason clause A is worth reading. The APP-PAGE graph — same walker,
//       same run — MUST reach both modules and MUST import `mermaid`. A traversal that had broken
//       (a resolver typo, a renamed directory, a regex that stopped matching) would satisfy clause
//       A vacuously and forever; it cannot satisfy clause B at the same time.
//   C — THE LAZINESS PIN. Across the whole production tree the `mermaid` PACKAGE is imported by
//       exactly one module, `diagramEngine.ts` (D-13), and by exactly one DYNAMIC edge. A static
//       `import … from 'mermaid'` anywhere — including in `diagramEngine.ts` itself, which would
//       pull the engine into whatever chunk that module lands in — reds here even if it tree-shook
//       to zero bytes. `mermaid/package.json` is the deliberate exception and is asserted BY NAME
//       (`diagramEngine.ts:77`: a JSON leaf read for the version string, static and eager on
//       purpose — it carries no engine code).
//   D — TRAVERSAL NON-VACUITY. Both graphs are non-trivial and contain named landmarks, and every
//       relative/aliased specifier in them RESOLVED. An unresolved edge is a hole the fence cannot
//       see through, so it fails loudly rather than being skipped.
//
// TYPE-ONLY IMPORTS COUNT AS EDGES, deliberately. `import type … from './diagramEngine'` erases at
// compile time and moves no bytes, so the byte fence is blind to it by construction — but it is
// still a content-script module that "learns the enhancer exists", and it is one keystroke from
// becoming a value import. Counting it is the stricter reading and costs nothing today: no
// content-script-reachable module type-imports a diagram module (clause A passes green as written).

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd(); // vitest runs from the project root

/** The content script's single entry — the graph the fence protects. */
const CONTENT_ENTRY = 'entrypoints/peekover.content.ts';
/** The app page's single entry — clause B's control graph. */
const APP_ENTRY = 'entrypoints/app/main.ts';

const ENHANCER = 'src/render/diagramEnhancer.ts';
const ENGINE = 'src/render/diagramEngine.ts';

/** The one `mermaid` specifier that is NOT the engine: a JSON leaf (`diagramEngine.ts:77`). */
const MERMAID_PACKAGE_JSON = 'mermaid/package.json';

// ── Source scanning (the diffEngine.test.ts shape) ───────────────────────────────────────────

/** 1-based line of `index` in `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

/** Blank `//` and block comments, preserving length AND newline positions so match indices still
 *  map to true line numbers, and leaving string/template literals intact (the specifier we scan
 *  for IS a string). Without this the prose in `diagramEngine.ts`'s header — which discusses
 *  `import('mermaid')` at length — would be read as five more edges. */
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
  /** `import('x')` rather than `import … from 'x'`. Clause C reads this. */
  readonly dynamic: boolean;
}

/** Every module specifier `src` imports: `import … from 'x'`, `export … from 'x'`, side-effect
 *  `import 'x'`, and dynamic `import('x')`. */
function edgesOf(src: string): Edge[] {
  const code = blankComments(src);
  const out: Edge[] = [];
  const fromRe = /\b(?:import|export)\b[^;]*?\bfrom\s*(['"])([^'"]+)\1/g;
  const sideEffectRe = /\bimport\s+(['"])([^'"]+)\1/g;
  const dynamicRe = /\bimport\s*\(\s*(['"])([^'"]+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  while ((m = sideEffectRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  while ((m = dynamicRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: true });
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
 * not a TypeScript module (the `?inline` font assets) — those are leaves, not graph nodes.
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

/** True if `spec` pulls the `mermaid` package (bare, or any subpath). */
function isMermaid(spec: string): boolean {
  return spec === 'mermaid' || spec.startsWith('mermaid/');
}

// ── The graphs, walked once ──────────────────────────────────────────────────────────────────

const contentGraph = graphFrom(CONTENT_ENTRY);
const appGraph = graphFrom(APP_ENTRY);

describe('the diagram import fence — clause D, the traversal itself (non-vacuity)', () => {
  it('walks two non-trivial graphs whose landmarks are present', () => {
    // If either walk collapsed to the entry alone, clause A below would pass on an empty set.
    expect(contentGraph.modules.size).toBeGreaterThan(10);
    expect(appGraph.modules.size).toBeGreaterThan(20);

    // Named landmarks, so "non-trivial" is not merely "large". These are the modules §3.1 calls
    // the ones the content script traverses.
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
    // fence would then be silent about whatever lives down it, which is indistinguishable from
    // the fence holding. So it fails here, naming the edge.
    expect(
      [...contentGraph.unresolved, ...appGraph.unresolved],
      'these specifiers looked local but resolved to no .ts file — the walk could not follow them, ' +
        'so the fence below cannot speak for what they reach. Fix the resolver or the import:',
    ).toEqual([]);
  });
});

describe('the diagram import fence — clause A, the content-script graph (§3.2, D-12)', () => {
  it('reaches NEITHER diagramEnhancer NOR diagramEngine, by any edge', () => {
    const offenders = [ENHANCER, ENGINE].filter((m) => contentGraph.modules.has(m));
    expect(
      offenders,
      `the content-script entry (${CONTENT_ENTRY}) must not reach the diagram modules by any ` +
        `edge — static, dynamic, or type-only. §3.2's gate IS the module graph, not a runtime ` +
        `check: the content-script reader leaves a mermaid fence as an ordinary code fence ` +
        `because it never learns the enhancer exists. Reached:`,
    ).toEqual([]);
  });

  it('imports no `mermaid` specifier anywhere in that graph', () => {
    const offenders = contentGraph.packages
      .filter((p) => isMermaid(p.spec))
      .map((p) => `${p.from}:${p.line} — import '${p.spec}'`);
    expect(
      offenders,
      '`mermaid` in the content-script graph = the fence broke and §3.2 with it (tasks.md 3.4: ' +
        'STOP-and-flag). Offending import(s):',
    ).toEqual([]);
  });
});

describe('the diagram import fence — clause B, the app-page graph IS the control', () => {
  it('reaches BOTH diagram modules — so clause A is a real absence, not a broken walk', () => {
    // THE CONTROL FIRES HERE OR CLAUSE A MEANS NOTHING. Same walker, same run, opposite verdict.
    expect(
      [...appGraph.modules],
      `the app-page entry (${APP_ENTRY}) MUST reach both diagram modules — it is the only surface ` +
        `that enhances. If this fails, the walker is broken and clause A's empty result is vacuous.`,
    ).toEqual(expect.arrayContaining([ENHANCER, ENGINE]));
  });

  it('imports `mermaid` from within that graph', () => {
    const found = appGraph.packages.filter((p) => isMermaid(p.spec));
    expect(
      found.map((p) => `${p.from}:${p.line} — '${p.spec}'${p.dynamic ? ' (dynamic)' : ''}`),
      'the app-page graph MUST import mermaid — the package-specifier half of the same control.',
    ).not.toEqual([]);
  });
});

describe('the diagram import fence — clause C, the chunk stays LAZY (D-13)', () => {
  // Scanned over the UNION of both graphs: the whole production tree any entry can reach. Deduped
  // by call site, because a module reachable from BOTH entries is walked twice and its one import
  // would otherwise be counted twice — which is exactly the state a broken clause A leaves behind,
  // so the double count would garble clause C's message at the moment it matters most.
  const all = [...new Map(
    [...contentGraph.packages, ...appGraph.packages]
      .filter((p) => isMermaid(p.spec))
      .map((p) => [`${p.from}:${p.line}:${p.spec}`, p] as const),
  ).values()];

  it('the ONLY `mermaid` module import in the tree is the ONE dynamic edge, in diagramEngine.ts', () => {
    const engineImports = all.filter((p) => p.spec !== MERMAID_PACKAGE_JSON);
    expect(
      engineImports.map((p) => `${p.from}:${p.line} — '${p.spec}'${p.dynamic ? ' (dynamic)' : ' (STATIC)'}`),
      `D-13: exactly one \`import('mermaid')\` in the repository, in ${ENGINE}. Found:`,
    ).toHaveLength(1);
    expect(engineImports[0]?.from).toBe(ENGINE);
    expect(engineImports[0]?.spec).toBe('mermaid');

    // THE STRUCTURAL CLAIM THE BYTE FENCE CANNOT MAKE. A static `import mermaid from 'mermaid'`
    // here would put the engine in whatever chunk `diagramEngine.ts` lands in — the app page's
    // EAGER chunk — and the 34,946 B lazy entry would stop being lazy. It might also tree-shake
    // to almost nothing and leave the byte fence green. This assertion does not care about bytes.
    expect(
      engineImports[0]?.dynamic,
      `the mermaid import must be DYNAMIC — a static one makes the chunk eager on whatever graph ` +
        `${ENGINE} sits in, and no byte measurement reliably catches that.`,
    ).toBe(true);
  });

  it('the one STATIC `mermaid` specifier is the JSON leaf, named on purpose', () => {
    const statics = all.filter((p) => !p.dynamic);
    expect(
      statics.map((p) => `${p.from}:${p.line} — '${p.spec}'`),
      `the only static \`mermaid\` specifier permitted is '${MERMAID_PACKAGE_JSON}' — a version ` +
        `string, no engine code (${ENGINE}:77). Found:`,
    ).toHaveLength(1);
    expect(statics[0]?.spec).toBe(MERMAID_PACKAGE_JSON);
    expect(statics[0]?.from).toBe(ENGINE);
  });
});
