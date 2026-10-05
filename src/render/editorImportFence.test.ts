// The EDITOR IMPORT FENCE — 012 task 3.1 (D-2, D-10; gate-3 Q1), on `diagramImportFence.test.ts`'s
// (007 task 3.4) four-clause shape, with `codeImportFence.test.ts`'s (009 task 4.5) adjustment for
// MORE than one permitted specifier.
//
// ── WHY THIS FILE IS THE EXCLUSION PROOF ──────────────────────────────────────────────────────
//
// Plan D-10's draft named `scripts/check-dynamic-imports.ts`'s MUST_NOT_FIRE list as the thing
// that keeps CodeMirror off the content script. It is not (tasks.md F-1): that script enforces
// SPECIFIER STATICNESS, file by file, with no notion of who reaches whom, and MUST_NOT_FIRE is its
// stay-silent self-test. `import('codemirror')` passes it — a static string literal — and is
// exactly the edge this file measures the position of. REACHABILITY is a property of the graph,
// and the graph is what is walked here (gate 3, Q1 — the decision of record).
//
// A byte observation cannot carry it either: a static edge whose exports tree-shook away moves few
// bytes or none (`spread defeats tree-shaking` is the mirror case). This reds on the edge itself.
//
// ── THE FOUR CLAUSES ──────────────────────────────────────────────────────────────────────────
//
//   A — THE FENCE. The content-script graph, walked from `entrypoints/peekover.content.ts`,
//       reaches no editor module (`src/render/editor*.ts`, matched by NAME so a module a later
//       task adds is covered without an edit here) and imports no `codemirror` / `@codemirror/*`
//       specifier anywhere.
//   B — THE CONTROL. ★ NOT YET THE APP-PAGE GRAPH. `editorEngine.ts` has no production caller
//       until task 3.2 wires the edit control, so at 3.1 no entry reaches it and "the app page
//       imports codemirror" would be false. Until then clause B is the engine module's OWN edge
//       (tasks.md 3.1): the same walker, started at `editorEngine.ts`, MUST find both specifiers.
//       That is what makes clause A's empty result an absence rather than a matcher that stopped
//       matching. 3.2 owes the app-page half — `appGraph` reaching the engine — beside this one.
//       ★ PAID AT 3.2: `enhanceEditor` is wired at the two app-page call sites, and the app-page
//       half is its own describe block below, BESIDE the engine's own edge rather than in place of
//       it — the 3.1 assertions are unedited.
//   C — THE LAZINESS PIN. Scanned over EVERY shipped `.ts` file under `src/` and `entrypoints/`
//       (tests and `.d.ts` excluded — never bundled), not over the union of the two entry graphs
//       as 007 does: with no caller yet, the engine is in neither graph, and a union scan would
//       pass on nothing. The permitted set is EXACTLY TWO edges, both DYNAMIC, both in
//       `editorEngine.ts`: `codemirror` and `@codemirror/lang-markdown`. There is NO static
//       specifier at all — 007 has one named JSON leaf and 009 three named leaves; this has none.
//   D — TRAVERSAL NON-VACUITY. The graphs are non-trivial with named landmarks, every local
//       specifier resolved, and the tree scan saw the files it is claimed to have seen.
//
// TYPE-ONLY IMPORTS COUNT AS EDGES (007's stated policy, applied to clause C by 009). 009 met one
// in its engine and PERMITTED it by name. This fence permits none, because the engine needs none:
// its types are inferred from the two dynamic edges themselves, so no `import type` and no
// `typeof import(…)` type query is written. The walker is 007's, unadjusted — it would read a
// `typeof import('codemirror')` as a third dynamic edge and red clause C's count, which is the
// stricter reading and the intended one.
//
// The pattern's red-first ablation is standing precedent — 007 task 3.4's and 009 task 4.5's — and
// is cited, not re-earned (AGENTS.md). What 3.1 did see red is this file before the module existed.

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd(); // vitest runs from the project root

/** The content script's single entry — the graph the fence protects. */
const CONTENT_ENTRY = 'entrypoints/peekover.content.ts';
/** The app page's single entry — walked for clause D, and clause B's graph from task 3.2 on. */
const APP_ENTRY = 'entrypoints/app/main.ts';

const ENGINE = 'src/render/editorEngine.ts';
/** 2.2's shell — a second editor module that already exists, so clause A's name match is seen to
 *  match something other than the engine. */
const EDITOR_VIEW = 'src/render/editorView.ts';
/** 3.2's enhancer — the module the two app-page call sites import, and so the first edge from
 *  the app-page graph into the editor. */
const ENHANCER = 'src/render/editorEnhancer.ts';

/** The two specifiers clause C permits, and the only ones. */
const PERMITTED = ['@codemirror/lang-markdown', 'codemirror'];

/** Trees WXT bundles — `scripts/check-dynamic-imports.ts`'s SHIPPED_ROOTS. */
const SHIPPED_ROOTS = ['src', 'entrypoints'];

// ── Source scanning (the diagramImportFence.test.ts shape, unchanged) ────────────────────────

/** 1-based line of `index` in `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

/** Blank `//` and block comments, preserving length AND newline positions so match indices still
 *  map to true line numbers, and leaving string/template literals intact (the specifier we scan
 *  for IS a string). Without this the prose in `editorEngine.ts`'s header would be read as edges. */
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

/** Every module specifier `src` imports: `import … from 'x'` (value AND type-only), `export …
 *  from 'x'`, side-effect `import 'x'`, and dynamic `import('x')`. */
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

interface PackageEdge extends Edge {
  /** The importing file, repo-relative. */
  readonly from: string;
}

interface Graph {
  /** Every repo-relative `.ts` module reachable from the entry, the entry included. */
  readonly modules: Set<string>;
  /** Every non-local (package) specifier imported from somewhere in the graph. */
  readonly packages: PackageEdge[];
  /** Specifiers that looked local and did not resolve — clause D's holes. */
  readonly unresolved: string[];
}

/** Walk every edge — static AND dynamic, value AND type — out of `entry`. An entry that is not on
 *  disk yields an EMPTY graph rather than a throw, so a missing engine module reds the clauses
 *  that name it instead of failing the file at collection. */
function graphFrom(entry: string): Graph {
  const modules = new Set<string>();
  const packages: PackageEdge[] = [];
  const unresolved: string[] = [];
  const queue = existsSync(join(ROOT, entry)) ? [entry] : [];

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

/** True if `spec` pulls CodeMirror: the `codemirror` meta-package or any `@codemirror/*` package. */
function isCodeMirror(spec: string): boolean {
  return spec === 'codemirror' || spec.startsWith('codemirror/') || spec.startsWith('@codemirror/');
}

/** True for an editor module — matched by name, so the fence covers ones not written yet. */
function isEditorModule(file: string): boolean {
  return /^src\/render\/editor[A-Z]\w*\.ts$/.test(file);
}

/** Every shipped `.ts` file under the bundled roots: no tests, no type declarations. */
function shippedFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
        out.push(path);
      }
    }
  };
  for (const root of SHIPPED_ROOTS) walk(root);
  return out;
}

const describeEdge = (p: PackageEdge): string =>
  `${p.from}:${p.line} — '${p.spec}'${p.dynamic ? ' (dynamic)' : ' (STATIC)'}`;

// ── The graphs and the tree, walked once ─────────────────────────────────────────────────────

const contentGraph = graphFrom(CONTENT_ENTRY);
const appGraph = graphFrom(APP_ENTRY);
const engineGraph = graphFrom(ENGINE);
const shipped = shippedFiles();
const treeEdges: PackageEdge[] = shipped.flatMap((from) =>
  edgesOf(readFileSync(join(ROOT, from), 'utf8'))
    .filter((e) => isCodeMirror(e.spec))
    .map((e) => ({ ...e, from })),
);

describe('the editor import fence — clause D, the traversal itself (non-vacuity)', () => {
  it('walks two non-trivial entry graphs whose landmarks are present', () => {
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

  it('resolved every local specifier in all three graphs — an unresolved edge is a hole', () => {
    expect(
      [...contentGraph.unresolved, ...appGraph.unresolved, ...engineGraph.unresolved],
      'these specifiers looked local but resolved to no .ts file — the walk could not follow them, ' +
        'so the fence below cannot speak for what they reach. Fix the resolver or the import:',
    ).toEqual([]);
  });

  it('the tree scan saw the shipped tree, the editor modules included', () => {
    // Clause C's "nowhere else" is only as wide as this list.
    expect(shipped.length).toBeGreaterThan(50);
    expect(shipped).toEqual(
      expect.arrayContaining([CONTENT_ENTRY, APP_ENTRY, 'src/render/mount.ts', ENGINE, EDITOR_VIEW]),
    );
    // Clause A matches editor modules by NAME; the name match must be seen to match.
    expect(shipped.filter(isEditorModule)).toEqual(expect.arrayContaining([ENGINE, EDITOR_VIEW]));
  });
});

describe('the editor import fence — clause A, the content-script graph (spec §3.2, D-10)', () => {
  it('reaches NO editor module, by any edge', () => {
    const offenders = [...contentGraph.modules].filter(isEditorModule);
    expect(
      offenders,
      `the content-script entry (${CONTENT_ENTRY}) must not reach an editor module by any edge — ` +
        `static, dynamic, or type-only. The editor is app-page-only because the content script ` +
        `never learns it exists; there is no runtime check behind this. Reached:`,
    ).toEqual([]);
  });

  it('imports no `codemirror` / `@codemirror/*` specifier anywhere in that graph', () => {
    const offenders = contentGraph.packages.filter((p) => isCodeMirror(p.spec)).map(describeEdge);
    expect(
      offenders,
      'CodeMirror in the content-script graph = the fence broke (tasks.md standing invariants: a ' +
        'hard stop). Offending import(s):',
    ).toEqual([]);
  });
});

describe('the editor import fence — clause B, the control (the engine module\'s own edge)', () => {
  it('the SAME walker, started at editorEngine.ts, finds both CodeMirror specifiers', () => {
    // THE CONTROL FIRES HERE OR CLAUSE A MEANS NOTHING. Same walker, same matcher, same run,
    // opposite verdict. ★ Until task 3.2 this is the engine's own edge, not the app-page graph:
    // nothing imports the engine yet (see the header). 3.2 adds the app-page half.
    expect(
      [...engineGraph.modules],
      `${ENGINE} must exist and be walkable — it is the control graph until 3.2 wires a caller.`,
    ).toContain(ENGINE);
    const found = engineGraph.packages.filter((p) => isCodeMirror(p.spec));
    expect(
      [...new Set(found.map((p) => p.spec))].sort(),
      'the walk from the engine MUST find both CodeMirror specifiers — if it finds none, the ' +
        "matcher is broken and clause A's empty result is vacuous. Found: " +
        found.map(describeEdge).join(', '),
    ).toEqual(PERMITTED);
  });
});

describe("the editor import fence — clause B's APP-PAGE half (task 3.2: the app graph reaches the engine)", () => {
  // 3.1 left this half owed: with no production caller, "the app page imports codemirror" was
  // false. 3.2 wires `enhanceEditor` at the two app-page call sites, so the firing control is now
  // the graph a user's edit actually travels — the same walker, the same matcher, the same run as
  // clause A, started one entry over.
  it('the app-page graph reaches the enhancer, the view and the engine', () => {
    expect([...appGraph.modules]).toEqual(expect.arrayContaining([ENHANCER, EDITOR_VIEW, ENGINE]));
    // And they are the editor modules the name match sees — clause A's matcher, firing.
    expect([...appGraph.modules].filter(isEditorModule).sort()).toEqual(
      [ENGINE, ENHANCER, EDITOR_VIEW].sort(),
    );
    expect(shipped).toContain(ENHANCER);
  });

  it('the SAME walker over the app-page graph finds both CodeMirror specifiers — in the engine alone', () => {
    const found = appGraph.packages.filter((p) => isCodeMirror(p.spec));
    expect(
      [...new Set(found.map((p) => p.spec))].sort(),
      'the app-page walk MUST find both CodeMirror specifiers — if it finds none, nothing on the ' +
        "app page can load the editor and clause A's empty result proves no exclusion. Found: " +
        found.map(describeEdge).join(', '),
    ).toEqual(PERMITTED);
    expect(found.every((p) => p.from === ENGINE && p.dynamic)).toBe(true);
  });
});

describe('the editor import fence — clause C, the chunk stays LAZY (D-2)', () => {
  it('the ONLY CodeMirror imports in the shipped tree are the TWO dynamic edges in editorEngine.ts', () => {
    expect(
      treeEdges.map(describeEdge),
      `D-2: exactly two CodeMirror imports in the repository's shipped tree — \`import('codemirror')\` ` +
        `and \`import('@codemirror/lang-markdown')\`, both in ${ENGINE}. A third specifier ` +
        `(\`@codemirror/state\`, \`@codemirror/view\`) is not permitted: use the \`codemirror\` ` +
        `re-export, or stop and ask. Found:`,
    ).toHaveLength(2);
    expect(treeEdges.map((p) => p.spec).sort()).toEqual(PERMITTED);
    expect(treeEdges.every((p) => p.from === ENGINE)).toBe(true);
  });

  it('both are DYNAMIC, and there is no static CodeMirror specifier — type-only included', () => {
    // THE STRUCTURAL CLAIM THE BYTE FENCE CANNOT MAKE. A static `import … from 'codemirror'` puts
    // the engine in whatever chunk its importer lands in — from 3.2 on, the app page's EAGER
    // chunk. An `import type` erases, but it is one keystroke from a value import and 007's policy
    // counts it; the engine infers its types from the dynamic edges and needs none.
    expect(
      treeEdges.filter((p) => !p.dynamic).map(describeEdge),
      'no static CodeMirror specifier is permitted anywhere in the shipped tree. Found:',
    ).toEqual([]);
    expect(treeEdges.filter((p) => p.dynamic)).toHaveLength(2);
  });
});
