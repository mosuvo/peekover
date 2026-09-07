// The MATH IMPORT FENCE — task 4.1-R's static half (D-2-R), in `diagramImportFence.test.ts` /
// `codeImportFence.test.ts`'s source-text scanning discipline (006 §1.4).
//
// ── WHY THIS FILE IS SHAPED DIFFERENTLY FROM ITS TWO PRECEDENTS ───────────────────────────────
//
// `diagramImportFence.test.ts` (007 task 3.4) and `codeImportFence.test.ts` (009 task 4.5) both
// walk the module GRAPH from `entrypoints/peekover.content.ts` and `entrypoints/app/main.ts`,
// and both landed AFTER their engine module already had a real call site: 007's `diagramEngine`
// was wired at task 3.x before 3.4, 009's `codeEngine` at task 4.1 before 4.5 (that file's own
// header states this explicitly — "Real for the first time at 4.5 because 4.1 wired both call
// sites"). Their clause B (the app-page graph MUST reach the engine, or clause A's silence is
// vacuous) depends on that wiring existing.
//
// `mathEngine.ts` has NO call site yet — `enhanceMath` is not wired into `readerPane.ts`/
// `appShell.ts` until 4.2-R/5.1-R. An entry-walk starting from either `entrypoints/
// peekover.content.ts` or `entrypoints/app/main.ts` today reaches neither `mathEngine.ts` nor
// `temml` AT ALL, for either graph — so a graph-shaped clause B would find NOTHING to reach and
// prove nothing (an unreached module and a correctly-fenced module are indistinguishable to a
// walker that never visits either). Copying the graph-walk shape here would produce a fence that
// passes for the wrong reason.
//
// So this file proves the SAME single-importer guarantee (D-2-R) a different way, one that does
// not depend on reachability: a WHOLE-SHIPPED-TREE SPECIFIER SCAN, in `check-dynamic-imports.ts`'s
// own `collectFiles`/self-test discipline (the SHIPPED_ROOTS scan, MUST_FIRE/MUST_NOT_FIRE
// fixtures) rather than `diagramImportFence.test.ts`'s entry-walk discipline. Every `.ts` file
// under `src/`/`entrypoints/` (excluding `*.test.ts`/`*.d.ts`, exactly `check-dynamic-imports.ts`'s
// own exclusion) is scanned directly for a `temml` specifier — no traversal, no resolution, just
// "does this string appear as an import/export specifier anywhere in the shipped tree." That
// property holds regardless of whether anything imports `mathEngine.ts` yet, and keeps holding
// once 4.2-R adds the call site (temml still reaches the tree through exactly one edge). The
// graph-shaped clause-A/B/C/D fence this file's two precedents use becomes MEANINGFUL again once
// a call site exists — flagged here as 4.2-R's own to add, not silently skipped.

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd(); // vitest runs from the project root

/** Trees WXT bundles into the signed package — identical to `check-dynamic-imports.ts`'s own. */
const SHIPPED_ROOTS = ['src', 'entrypoints'] as const;

const ENGINE = 'src/render/mathEngine.ts';

// ── Source scanning (the diagramImportFence.test.ts specifier-extraction shape, reused) ────────

/** 1-based line of `index` in `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

/**
 * Blank `//` and block comments (preserving length AND newlines, so indices still map to true
 * line numbers), and separately RECORD every string/template-literal span. `diagramImportFence
 * .test.ts`'s own `blankComments` leaves strings intact but does not track their spans, which is
 * fine for its own subject file (whose only string content IS the specifier being matched) but is
 * NOT enough for a whole-tree scan: a string literal that merely CONTAINS import-shaped text
 * (`"never write import('temml') here"`, this file's own MUST-NOT-FIRE fixture) would otherwise
 * be matched as a real edge. `check-dynamic-imports.ts`'s own `maskComments`/`insideString` solve
 * exactly this — this function is that same technique, ported here rather than imported, since
 * that script's own exclusion list (`scripts/`) deliberately keeps it out of the shipped-tree scan
 * this file itself performs (it would otherwise import a dev-only Node harness into the vitest
 * unit suite for no reason beyond code reuse).
 */
function maskCommentsTrackStrings(src: string): { masked: string; stringSpans: Array<[number, number]> } {
  const out = src.split('');
  const stringSpans: Array<[number, number]> = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') {
        out[i] = ' ';
        i += 1;
      }
      continue;
    }
    if (c === '/' && next === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] !== '\n') out[i] = ' ';
        i += 1;
      }
      if (i < src.length) {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      const start = i;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      stringSpans.push([start, i]);
      continue;
    }
    if (c === '`') {
      // Template literal: only its TEXT chunks are string spans; `${…}` holes stay classified as
      // code (an import hidden in an interpolation must still be seen). Mirrors
      // `check-dynamic-imports.ts`'s own template handling exactly.
      i += 1;
      let chunkStart = i;
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          stringSpans.push([chunkStart - 1, i]);
          let depth = 1;
          i += 2;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth += 1;
            else if (src[i] === '}') depth -= 1;
            i += 1;
          }
          chunkStart = i + 1;
          continue;
        }
        i += 1;
      }
      stringSpans.push([chunkStart - 1, i + 1]);
      i += 1;
      continue;
    }
    i += 1;
  }
  return { masked: out.join(''), stringSpans };
}

/** True if `index` falls strictly inside one of the recorded string-literal spans. */
function insideString(index: number, spans: ReadonlyArray<[number, number]>): boolean {
  return spans.some(([s, e]) => index > s && index < e);
}

interface Edge {
  readonly spec: string;
  readonly line: number;
  /** `import('x')` rather than `import … from 'x'`. */
  readonly dynamic: boolean;
}

/** Every module specifier `src` imports: `import … from 'x'`, `export … from 'x'`, side-effect
 *  `import 'x'`, and dynamic `import('x')` — a match is discarded when its OWN start position
 *  (the `import`/`export` keyword) falls inside a string span, i.e. it is prose data, not code. */
function edgesOf(src: string): Edge[] {
  const { masked: code, stringSpans } = maskCommentsTrackStrings(src);
  const out: Edge[] = [];
  const fromRe = /\b(?:import|export)\b[^;]*?\bfrom\s*(['"])([^'"]+)\1/g;
  const sideEffectRe = /\bimport\s+(['"])([^'"]+)\1/g;
  const dynamicRe = /\bimport\s*\(\s*(['"])([^'"]+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(code)) !== null) {
    if (insideString(m.index, stringSpans)) continue;
    out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  }
  while ((m = sideEffectRe.exec(code)) !== null) {
    if (insideString(m.index, stringSpans)) continue;
    out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: false });
  }
  while ((m = dynamicRe.exec(code)) !== null) {
    if (insideString(m.index, stringSpans)) continue;
    out.push({ spec: m[2], line: lineOf(code, m.index), dynamic: true });
  }
  return out;
}

/** True for a specifier that names the `temml` package (bare, or any subpath). */
function isTemml(spec: string): boolean {
  return spec === 'temml' || spec.startsWith('temml/');
}

/** Recursively collect shipped `.ts` files — identical exclusion to `check-dynamic-imports.ts`'s
 *  own `collectFiles` (never bundled: `*.test.ts`, `*.d.ts`). */
function collectShippedFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectShippedFiles(full, acc);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.d.ts')) continue;
    acc.push(full);
  }
  return acc;
}

/** Repo-relative path (POSIX separators) of an absolute-or-cwd-relative path. */
function rel(p: string): string {
  return path.resolve(p).slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, '');
}

interface TemmlEdge {
  readonly file: string;
  readonly line: number;
  readonly spec: string;
  readonly dynamic: boolean;
}

/** Scan one already-read source string for `temml` specifiers, tagged with a caller-supplied
 *  file label. Exported implicitly via the describe blocks below driving it directly — the same
 *  function powers both the real-tree scan and the firing control, so a firing-control pass
 *  proves something about the ACTUAL scanner, not a re-implementation of it. */
function temmlEdgesIn(fileLabel: string, src: string): TemmlEdge[] {
  return edgesOf(src)
    .filter((e) => isTemml(e.spec))
    .map((e) => ({ file: fileLabel, line: e.line, spec: e.spec, dynamic: e.dynamic }));
}

// ── The real scan, run once ─────────────────────────────────────────────────────────────────

const shippedFiles = SHIPPED_ROOTS.flatMap((root) => collectShippedFiles(root));
const realTemmlEdges = shippedFiles.flatMap((f) => temmlEdgesIn(rel(f), fs.readFileSync(f, 'utf8')));

describe('the math import fence — non-vacuity', () => {
  it('scanned a non-trivial shipped tree', () => {
    // If this collapsed to a handful of files, the scan below would be near-meaningless.
    expect(shippedFiles.length).toBeGreaterThan(50);
    expect(shippedFiles.map((f) => rel(f))).toContain(ENGINE);
  });
});

describe('the math import fence — the single-importer guarantee (D-2-R)', () => {
  it('finds exactly ONE `temml` specifier in the whole shipped tree, dynamic, in mathEngine.ts', () => {
    expect(
      realTemmlEdges.map((e) => `${e.file}:${e.line} — '${e.spec}'${e.dynamic ? ' (dynamic)' : ' (STATIC)'}`),
      'D-2-R: exactly one `import(\'temml\')` in the repository, in ' + ENGINE + '. Found:',
    ).toHaveLength(1);
    expect(realTemmlEdges[0]?.file).toBe(ENGINE);
    expect(realTemmlEdges[0]?.spec).toBe('temml');
    // Dynamic, not static: a static `import temml from 'temml'` would put the engine in whatever
    // chunk `mathEngine.ts` lands in — the app page's EAGER chunk once a call site exists — and
    // the lazy-load property §4/D-2-R protect would break silently.
    expect(
      realTemmlEdges[0]?.dynamic,
      'the temml import must be DYNAMIC — a static one makes the chunk eager on whatever graph ' +
        ENGINE + ' sits in once a call site is wired.',
    ).toBe(true);
  });
});

describe('the math import fence — the firing control (this scanner is not silently broken)', () => {
  // Same discipline as `check-dynamic-imports.ts`'s own MUST_FIRE/MUST_NOT_FIRE self-test: the
  // scan above finding exactly one hit is meaningless unless the SAME function can be shown to
  // find MORE than one when a second module really does import temml, and to find NONE when
  // temml is only ever mentioned in prose/strings. Both fixtures are in-memory only — nothing on
  // disk changes, matching the kickoff's own "reference temml from a second module in the test's
  // own probe" description.

  it('MUST FIRE: a second module statically importing temml is detected', () => {
    const rogueModule = `import temml from 'temml';\nexport const oops = temml.version;\n`;
    const found = [
      ...temmlEdgesIn(ENGINE, fs.readFileSync(ENGINE, 'utf8')),
      ...temmlEdgesIn('src/render/scratchRogueModule.ts', rogueModule),
    ];
    expect(found.length, 'the firing control must detect the SECOND edge, proving the scanner is live').toBe(2);
    expect(found.some((e) => e.file === 'src/render/scratchRogueModule.ts')).toBe(true);
  });

  it('MUST FIRE: a second dynamic `import(\'temml\')` from a different module is detected', () => {
    const rogueModule = `export async function sneaky() {\n  return (await import('temml')).default;\n}\n`;
    const found = temmlEdgesIn('src/render/scratchRogueModule.ts', rogueModule);
    expect(found).toHaveLength(1);
    expect(found[0]?.dynamic).toBe(true);
  });

  it('MUST NOT FIRE: a comment or string merely mentioning temml is not an edge', () => {
    const prose = [
      `// this module never imports temml, on purpose`,
      `/* see temml's own docs for the renderToString shape */`,
      `const msg = "never write import('temml') outside mathEngine.ts";`,
    ].join('\n');
    expect(temmlEdgesIn('src/render/scratchProse.ts', prose)).toEqual([]);
  });

  it('MUST NOT FIRE: an unrelated package sharing no prefix with temml is not an edge', () => {
    const other = `import katex from 'katex';\nimport temmlLike from 'temml-adjacent-but-different';\n`;
    // `temml-adjacent-but-different` does not equal 'temml' and does not start with 'temml/', so
    // `isTemml` must reject it — a prefix-only match would be a false positive on an unrelated pkg.
    expect(temmlEdgesIn('src/render/scratchOther.ts', other)).toEqual([]);
  });
});
