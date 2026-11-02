// The UI-FONTS IMPORT FENCE (013 task 2.4; plan D-2). Bricolage Grotesque and Sometype Mono are
// app-page assets: the content-script reader must add no font bytes (gate-1 Q3 / Q10), so neither
// `uiFonts.ts` nor any of its woff2 files may be reachable from the content-script entry.
//
// The established shape, ported (the fences' helpers are module-private): `mathImportFence.test.ts`
// clauses A–D — a graph walk from both entries over every static, dynamic and type-only edge, the
// app-page graph as the control that makes the content-script absence real, plus a whole-shipped-
// tree importer scan. The walker's ablation is that file's (and `diagramImportFence.test.ts`'s)
// standing precedent, cited rather than re-earned (AGENTS.md); the in-memory firing controls below
// prove this copy of the scanner is live.

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const SHIPPED_ROOTS = ['src', 'entrypoints'] as const;
const CONTENT_ENTRY = 'entrypoints/peekover.content.ts';
const APP_ENTRY = 'entrypoints/app/main.ts';
const MODULE = 'src/theme/uiFonts.ts';
const SOLE_IMPORTER = 'src/app/appShell.ts';
/** The 2.3 font files this module owns. */
const isUiFontAsset = (p: string): boolean => /assets\/fonts\/(bricolage|sometype)-[^/]*\.woff2$/.test(p);

/** Blank comments (keeping offsets and newlines) and record string-literal spans — mathImportFence's technique. */
function mask(src: string): { code: string; spans: Array<[number, number]> } {
  const out = src.split('');
  const spans: Array<[number, number]> = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') out[i++] = ' ';
      continue;
    }
    if (c === '/' && n === '*') {
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
    if (c === "'" || c === '"' || c === '`') {
      const start = i;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') i += 1;
        i += 1;
      }
      i += 1;
      spans.push([start, i]);
      continue;
    }
    i += 1;
  }
  return { code: out.join(''), spans };
}

/** Every module specifier in `src`: `import … from`, `export … from`, side-effect and dynamic imports. */
function specifiers(src: string): string[] {
  const { code, spans } = mask(src);
  const inString = (at: number): boolean => spans.some(([s, e]) => at > s && at < e);
  const found: string[] = [];
  for (const re of [
    /\b(?:import|export)\b[^;]*?\bfrom\s*(['"])([^'"]+)\1/g,
    /\bimport\s+(['"])([^'"]+)\1/g,
    /\bimport\s*\(\s*(['"])([^'"]+)\1/g,
  ]) {
    for (const m of code.matchAll(re)) if (!inString(m.index ?? 0)) found.push(m[2]);
  }
  return found;
}

const rel = (p: string): string => path.relative(ROOT, p).replace(/\\/g, '/');

/** Resolve a local specifier to a repo-relative module or asset path; `undefined` if unresolvable. */
function resolveLocal(from: string, spec: string): { module?: string; asset?: string } | undefined {
  const bare = spec.split('?')[0];
  const abs = bare.startsWith('@/')
    ? path.resolve(ROOT, bare.slice(2))
    : path.resolve(path.dirname(path.join(ROOT, from)), bare);
  if (/\.(woff2?|ttf|otf|css|svg|png|json|html)$/i.test(bare)) return { asset: rel(abs) };
  for (const c of [`${abs}.ts`, path.join(abs, 'index.ts'), abs]) {
    if (fs.existsSync(c) && c.endsWith('.ts')) return { module: rel(c) };
  }
  return undefined;
}

interface Graph {
  readonly modules: Set<string>;
  readonly assets: Set<string>;
  readonly unresolved: string[];
}

function graphFrom(entry: string): Graph {
  const modules = new Set<string>();
  const assets = new Set<string>();
  const unresolved: string[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (modules.has(file)) continue;
    modules.add(file);
    for (const spec of specifiers(fs.readFileSync(path.join(ROOT, file), 'utf8'))) {
      if (spec === '#imports' || !(spec.startsWith('.') || spec.startsWith('@/'))) continue;
      const hit = resolveLocal(file, spec);
      if (!hit) unresolved.push(`${file} — '${spec}'`);
      else if (hit.asset) assets.add(hit.asset);
      else if (hit.module && !modules.has(hit.module)) queue.push(hit.module);
    }
  }
  return { modules, assets, unresolved };
}

function shippedFiles(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) shippedFiles(p, acc);
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') && !e.name.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
}

/** Files (by label) whose specifiers resolve to `MODULE` or to a UI font asset. */
function importersIn(files: Array<{ label: string; src: string }>): { module: string[]; asset: string[] } {
  const module: string[] = [];
  const asset: string[] = [];
  for (const { label, src } of files) {
    for (const spec of specifiers(src)) {
      if (!(spec.startsWith('.') || spec.startsWith('@/'))) continue;
      const hit = resolveLocal(label, spec);
      if (hit?.module === MODULE) module.push(label);
      if (hit?.asset && isUiFontAsset(hit.asset)) asset.push(label);
    }
  }
  return { module, asset };
}

const contentGraph = graphFrom(CONTENT_ENTRY);
const appGraph = graphFrom(APP_ENTRY);
const tree = SHIPPED_ROOTS.flatMap((r) => shippedFiles(r)).map((label) => ({
  label,
  src: fs.readFileSync(path.join(ROOT, label), 'utf8'),
}));

describe('the UI-fonts import fence — clause D, the traversal (non-vacuity)', () => {
  it('walks two non-trivial graphs with no unresolved local edge', () => {
    expect(contentGraph.modules.size).toBeGreaterThan(10);
    expect(appGraph.modules.size).toBeGreaterThan(20);
    expect(tree.length).toBeGreaterThan(50);
    expect([...contentGraph.unresolved, ...appGraph.unresolved]).toEqual([]);
  });
});

describe('the UI-fonts import fence — clause A, the content-script graph adds no font bytes', () => {
  it('reaches neither uiFonts.ts nor any Bricolage / Sometype file, by any edge', () => {
    const offenders = [
      ...[...contentGraph.modules].filter((m) => m === MODULE),
      ...[...contentGraph.assets].filter(isUiFontAsset),
    ];
    expect(offenders, `the content-script entry (${CONTENT_ENTRY}) reached app-page font code or files:`).toEqual([]);
  });
});

describe('the UI-fonts import fence — clause B, the app-page graph is the control', () => {
  it('reaches uiFonts.ts and all five font files — so clause A is a real absence', () => {
    expect([...appGraph.modules]).toContain(MODULE);
    expect([...appGraph.assets].filter(isUiFontAsset).sort()).toEqual([
      'assets/fonts/bricolage-latin-400-normal.woff2',
      'assets/fonts/bricolage-latin-600-normal.woff2',
      'assets/fonts/bricolage-latin-700-normal.woff2',
      'assets/fonts/sometype-mono-latin-400-normal.woff2',
      'assets/fonts/sometype-mono-latin-500-normal.woff2',
    ]);
  });
});

describe('the UI-fonts import fence — clause C, one importer each (the whole shipped tree)', () => {
  it(`uiFonts.ts is imported by ${SOLE_IMPORTER} alone, and the font files by uiFonts.ts alone`, () => {
    const found = importersIn(tree);
    expect(found.module).toEqual([SOLE_IMPORTER]);
    expect([...new Set(found.asset)]).toEqual([MODULE]);
  });

  it('MUST FIRE: a second module importing uiFonts.ts or a font file is detected', () => {
    const rogue = {
      label: 'src/render/scratchRogue.ts',
      src: "import { registerUiFonts } from '../theme/uiFonts';\nimport u from '../../assets/fonts/sometype-mono-latin-400-normal.woff2';\n",
    };
    const found = importersIn([...tree, rogue]);
    expect(found.module).toContain(rogue.label);
    expect(found.asset).toContain(rogue.label);
  });

  it('MUST NOT FIRE: a comment or string mentioning the module is not an edge', () => {
    const prose = {
      label: 'src/render/scratchProse.ts',
      src: "// import { registerUiFonts } from '../theme/uiFonts';\nconst s = \"import '../theme/uiFonts'\";\n",
    };
    expect(importersIn([prose])).toEqual({ module: [], asset: [] });
  });
});
