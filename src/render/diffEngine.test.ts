// diffEngine unit tests (Piece 3) AND the source-text import fence pin (Piece 4).
//
// The engine cases below are PURE — no DOM, so this file needs no `// @vitest-environment jsdom`
// pragma and runs in the unit project's default node environment. They pin the mapping from
// `diff`'s change objects to Peekover's `DiffHunk` shape, including the D-5 CRLF boundary.
//
// The fence pin below is the FIRST of the two-layer fence (plan §1.4): a SOURCE-TEXT allowlist
// asserting that the `diff` package is imported by exactly one production module (`diffEngine.ts`)
// and that nothing `mount.ts` reaches imports the engine yet (D-15 — "mount() stays read-only
// library"). The SECOND layer — a bundle-grep + byte-delta check that `diff`'s bytes never reach
// the content-script bundle — is a VERIFY-ONLY step (building bundles is too slow for the unit hot
// path); its evidence lives in the 5.1 report and commit message and is re-run at task 8.1.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { computeDiff, type DiffHunk } from './diffEngine';

describe('computeDiff', () => {
  it('identical multi-line input yields one unchanged hunk of every line', () => {
    expect(computeDiff('a\nb\nc', 'a\nb\nc')).toEqual([
      { kind: 'unchanged', lines: ['a', 'b', 'c'] },
    ]);
  });

  it('two empty inputs yield no hunks (nothing to show)', () => {
    expect(computeDiff('', '')).toEqual([]);
  });

  it('pure addition (empty before) yields one added hunk with every after-line', () => {
    expect(computeDiff('', 'x\ny\nz')).toEqual([{ kind: 'added', lines: ['x', 'y', 'z'] }]);
  });

  it('pure removal (empty after) yields one removed hunk with every before-line', () => {
    expect(computeDiff('x\ny\nz', '')).toEqual([{ kind: 'removed', lines: ['x', 'y', 'z'] }]);
  });

  it('a middle modification yields unchanged/removed/added/unchanged in document order', () => {
    const hunks = computeDiff('a\nb\nc', 'a\nX\nc');
    // Order is the property under test — assert the sequence, then the exact lines.
    expect(hunks.map((h) => h.kind)).toEqual(['unchanged', 'removed', 'added', 'unchanged']);
    expect(hunks).toEqual([
      { kind: 'unchanged', lines: ['a'] },
      { kind: 'removed', lines: ['b'] },
      { kind: 'added', lines: ['X'] },
      { kind: 'unchanged', lines: ['c'] },
    ]);
  });

  it('preserves an interior blank line rather than collapsing it', () => {
    expect(computeDiff('a\n\nc', 'a\n\nc')).toEqual([
      { kind: 'unchanged', lines: ['a', '', 'c'] },
    ]);
  });

  it('a pure CRLF→LF change is no change (D-5), and the green is non-vacuous', () => {
    // normalise() collapses CRLF to LF on BOTH sides, so text that differs only in EOLs is
    // identical by the time diffLines sees it — no added/removed hunk.
    const eolFlip = computeDiff('a\r\nb\r\nc', 'a\nb\nc');
    expect(eolFlip.every((h) => h.kind === 'unchanged')).toBe(true);
    expect(eolFlip.some((h) => h.kind === 'added' || h.kind === 'removed')).toBe(false);
    // Non-vacuity: the SAME engine reports a real content change — the CRLF green is not just an
    // engine that never detects anything. (If normalise were dropped from one side, THIS case
    // stays green while `eolFlip` above reddens — the red-first the plan names.)
    const real = computeDiff('a', 'b');
    expect(real.some((h) => h.kind === 'removed')).toBe(true);
    expect(real.some((h) => h.kind === 'added')).toBe(true);
  });

  it('characterises trailing-newline sensitivity (D-5 normalises CRLF, not a trailing LF)', () => {
    // diffLines tokenises by line INCLUDING the terminator, so `b` and `b\n` are distinct tokens:
    // adding a trailing newline is reported as a change. normalise only touches \r\n, so it does
    // NOT paper this over — an honest boundary, pinned so a future reader sees it is deliberate.
    expect(computeDiff('a\nb', 'a\nb\n')).toEqual([
      { kind: 'unchanged', lines: ['a'] },
      { kind: 'removed', lines: ['b'] },
      { kind: 'added', lines: ['b'] },
    ]);
  });

  it('returns the Peekover-owned DiffHunk shape (type sourced from ./diffEngine, never from diff)', () => {
    // The type import at the top of this file is `DiffHunk` from './diffEngine' — never from
    // 'diff'. This is the stable shape that insulates callers from the library's version churn.
    const hunks: DiffHunk[] = computeDiff('a\nb', 'a\nB');
    for (const h of hunks) {
      expect(Object.keys(h).sort()).toEqual(['kind', 'lines']);
      expect(['added', 'removed', 'unchanged']).toContain(h.kind);
      expect(Array.isArray(h.lines)).toBe(true);
    }
  });
});

// ── Piece 4 — the source-text import fence (plan §1.4, D-15) ──────────────────────────────────
//
// APPROACH: allowlist-against-the-target, not import-graph traversal. Walk every PRODUCTION `.ts`
// under `src/` and `entrypoints/` (test files excluded — a test may import anything), scan each
// file's import specifiers (comment-aware), and assert two clauses:
//   Clause A — the `diff` PACKAGE is imported by exactly { src/render/diffEngine.ts }.
//   Clause B — the ENGINE module is imported by NOTHING in production yet (wired to nothing until
//              6.1, whose diffView.ts becomes the sole entry — added to ALLOWED_ENGINE_IMPORTERS
//              in that commit, the one-line change that documents the architecture change).
// Trade-off vs traversal: the allowlist cannot tell "imported but unreachable from the content
// script" from "not imported at all" — but at 5.1 the engine is imported by no production file at
// all, and the SECOND fence layer (bundle-grep, verify-only) proves the bytes never land in the
// content-script bundle. The allowlist's virtue is a direct, legible correspondence between a test
// change and an architecture change when a new consumer arrives.

const ROOT = process.cwd(); // vitest runs from the project root (D:\Dev\peekover)

const ALLOWED_DIFF_IMPORTERS = ['src/render/diffEngine.ts'];
// 6.2: `appShell.installWatchForFile` provisions the engine's `computeDiff` onto the DiffContext —
// the ONE production engine-importer, in the app-page graph only. (The 5.1 comment here predicted
// 6.1's `diffView.ts`; 6.1 recorded why that did not happen — the view is engine-BLIND.)
const ALLOWED_ENGINE_IMPORTERS = ['src/app/appShell.ts'];
// 6.2 adds CLAUSE C, and it is not decoration. Plan §1.4 fences the VIEW too — "`diffView.ts` …
// Imported by `appShell.ts`, never by `mount.ts` — `mount.ts` importing it would drag the view into
// the content-script graph and put the hole back in the fence it is the point of §1.4 to close" —
// and tasks.md 6.2's Verify says so in as many words: "`mount.ts`'s graph excludes
// `diff`/`diffEngine`/`diffView`". Clauses A and B alone would let 6.2 satisfy the letter of the
// fence (no engine import in `diffChrome.ts`) while breaking it in fact, by having the affordance —
// which `mount.ts` DOES import — import the view. That is exactly why the affordance reaches BOTH
// through `showDiff`/`hideDiff` closures the app page provisions (diffRegistry.ts's header).
const ALLOWED_VIEW_IMPORTERS = ['src/app/appShell.ts'];

/** 1-based line of `index` in `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

/** Blank out `//` and block comments, preserving length AND newline positions (so match indices
 *  still map to true line numbers) and leaving string/template literals intact (the specifier we
 *  scan for IS a string). Known lax edge: comments INSIDE a `${}` template span are not blanked —
 *  no import statement is ever written there, so it is not a real fence hazard. */
function blankComments(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    const nx = src[i + 1];
    if (ch === '/' && nx === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (ch === '/' && nx === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; }
      if (i < n) { out += '  '; i += 2; }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      out += ch;
      i++;
      while (i < n) {
        const c = src[i];
        if (c === '\\') { out += c + (src[i + 1] ?? ''); i += 2; continue; }
        out += c;
        i++;
        if (c === q) break;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Every module specifier imported by `src`, with the line it sits on. Covers `import ... from 'x'`,
 *  `export ... from 'x'`, side-effect `import 'x'`, and dynamic `import('x')`. */
function importSpecifiers(src: string): { spec: string; line: number }[] {
  const code = blankComments(src);
  const out: { spec: string; line: number }[] = [];
  const fromRe = /\b(?:import|export)\b[^;]*?\bfrom\s*(['"])([^'"]+)\1/g;
  const bareRe = /\bimport\s*\(?\s*(['"])([^'"]+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index) });
  while ((m = bareRe.exec(code)) !== null) out.push({ spec: m[2], line: lineOf(code, m.index) });
  return out;
}

/** True if `spec` (a relative or `@/`-aliased path) resolves to the module named `module`. */
function importsLocalModule(spec: string, module: string): boolean {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return false;
  const base = spec.replace(/\.[jt]s$/, '').split('/').pop();
  return base === module;
}

/** True if `spec` (a relative or `@/`-aliased path) resolves to `src/render/diffEngine.ts`. */
function importsEngine(spec: string): boolean {
  return importsLocalModule(spec, 'diffEngine');
}

/** True if `spec` resolves to `src/render/diffView.ts` (Clause C — the view is fenced too). */
function importsView(spec: string): boolean {
  return importsLocalModule(spec, 'diffView');
}

/** True if `spec` pulls the `diff` package (bare `diff`, or a `diff/...` subpath). */
function importsDiffPackage(spec: string): boolean {
  return spec === 'diff' || spec.startsWith('diff/');
}

/** Every production `.ts` under `absDir` — `*.test.ts`, `*.d.ts` and `node_modules` excluded. */
function collectProdSources(absDir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(absDir)) {
    const p = join(absDir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules') continue;
      out.push(...collectProdSources(p));
      continue;
    }
    if (name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

describe('import fence: `diff` reaches only the engine (plan §1.4, D-15)', () => {
  const files = ['src', 'entrypoints'].flatMap((r) => collectProdSources(join(ROOT, r)));

  interface Imp { rel: string; line: number; spec: string }
  const diffPackage: Imp[] = [];
  const engine: Imp[] = [];
  const view: Imp[] = [];
  for (const file of files) {
    const rel = file.slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, '');
    for (const { spec, line } of importSpecifiers(readFileSync(file, 'utf8'))) {
      if (importsDiffPackage(spec)) diffPackage.push({ rel, line, spec });
      if (importsEngine(spec)) engine.push({ rel, line, spec });
      if (importsView(spec)) view.push({ rel, line, spec });
    }
  }

  it('walks a non-empty production source set (non-vacuity)', () => {
    // If the traversal broke, the two allowlist checks below would pass vacuously.
    expect(files.length).toBeGreaterThan(20);
  });

  it('the `diff` package is imported by exactly the engine, and the engine really imports it', () => {
    // Clause A. Non-vacuity: the allowed importer must ACTUALLY import diff — a fence that passes
    // because nothing imports diff at all would be worthless.
    expect(
      diffPackage.map((i) => i.rel),
      `the engine (${ALLOWED_DIFF_IMPORTERS.join(', ')}) must import the \`diff\` package`,
    ).toContain('src/render/diffEngine.ts');

    const violations = diffPackage
      .filter((i) => !ALLOWED_DIFF_IMPORTERS.includes(i.rel))
      .map((i) => `${i.rel}:${i.line} — import from '${i.spec}'`);
    expect(
      violations,
      `the \`diff\` package must be imported ONLY by [${ALLOWED_DIFF_IMPORTERS.join(', ')}] ` +
        `(plan §1.4 import fence; D-15 — mount() stays read-only). Any other importer drags the ` +
        `package into whatever bundle reaches that file. Offending import(s):`,
    ).toEqual([]);
  });

  it('the engine is imported by exactly appShell.ts — its ONE production consumer (6.2, D-15)', () => {
    // Clause B. mount.ts (and everything the content script reaches) must not import the engine.
    const violations = engine
      .filter((i) => !ALLOWED_ENGINE_IMPORTERS.includes(i.rel))
      .map((i) => `${i.rel}:${i.line} — import '${i.spec}'`);
    expect(
      violations,
      `the engine's only production consumer is [${ALLOWED_ENGINE_IMPORTERS.join(', ')}], which ` +
        `provisions computeDiff onto the DiffContext (task 6.2). D-15 — entering a diff is an ` +
        `attribute flip; mount() never reaches the engine. Offending import(s):`,
    ).toEqual([]);
  });

  it('the engine allowlist is NOT a rubber stamp — appShell really imports it, at exactly one line', () => {
    // NON-VACUITY for Clause B's allowlist entry. An allowlist naming a file that does not import
    // the engine would pass forever while the architecture said something else — and this is the
    // clause that flipped at 6.2 ([] → ['src/app/appShell.ts']), so the entry has to be earned.
    const fromAppShell = engine.filter((i) => i.rel === 'src/app/appShell.ts');
    expect(
      fromAppShell.map((i) => `${i.rel}:${i.line}`),
      `ALLOWED_ENGINE_IMPORTERS names src/app/appShell.ts, so it must ACTUALLY import the engine — ` +
        `on exactly ONE line (the provisioning site in installWatchForFile). Found:`,
    ).toHaveLength(1);
  });

  it('the VIEW is imported by exactly appShell.ts — never by mount.ts (Clause C, plan §1.4)', () => {
    // Clause C (6.2). The view is fenced for the same reason the engine is: `mount.ts` importing it
    // "would drag the view into the content-script graph and put the hole back in the fence"
    // (plan §1.4). The affordance mount.ts DOES import (`diffChrome.ts`) reaches the view only
    // through the DiffContext's provisioned `showDiff`/`hideDiff`.
    const violations = view
      .filter((i) => !ALLOWED_VIEW_IMPORTERS.includes(i.rel))
      .map((i) => `${i.rel}:${i.line} — import '${i.spec}'`);
    expect(
      violations,
      `diffView.ts may be imported ONLY by [${ALLOWED_VIEW_IMPORTERS.join(', ')}] (plan §1.4). In ` +
        `particular src/render/diffChrome.ts must NOT — mount.ts imports it, so that edge would ` +
        `put the view (and the hole) back in the content-script graph. Offending import(s):`,
    ).toEqual([]);

    // Non-vacuity, same argument as the engine's: the allowed importer must really import it.
    expect(
      view.filter((i) => i.rel === 'src/app/appShell.ts').map((i) => `${i.rel}:${i.line}`),
      `ALLOWED_VIEW_IMPORTERS names src/app/appShell.ts, so it must ACTUALLY import the view.`,
    ).toHaveLength(1);
  });

  it('the affordance mount.ts imports is clean: diffChrome.ts imports no engine, view, or `diff`', () => {
    // The fence stated from the OTHER end — as a property of the one file that bridges the two
    // graphs. Stated separately from the allowlists because this is the edge a future change is
    // most likely to add by reflex ("just import enterDiff"), and this failure names the reason.
    const offenders = [...diffPackage, ...engine, ...view]
      .filter((i) => i.rel === 'src/render/diffChrome.ts')
      .map((i) => `${i.rel}:${i.line} — import '${i.spec}'`);
    expect(
      offenders,
      `diffChrome.ts is THE ONLY diff module mount.ts imports (plan §1.4), so it must import ` +
        `neither the \`diff\` package, nor diffEngine.ts, nor diffView.ts. It reaches all three ` +
        `through the DiffContext's provisioned showDiff/hideDiff closures. Offending import(s):`,
    ).toEqual([]);
    // Non-vacuous: the file must exist and be in the walked set, or this passes trivially.
    expect(
      files.map((f) => f.slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, '')),
    ).toContain('src/render/diffChrome.ts');
  });
});
