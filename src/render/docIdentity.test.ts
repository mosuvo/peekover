// docIdentity — the pure holder's behaviour, plus the STRUCTURAL proof that its import list is
// empty (task 1.1).
//
// The PRODUCTION-PATH proof (which name production registers on each surface, and that it is
// registered before the mount) is 1.4's real-engine seam test; this file pins only the holder's own
// contract — register, last-write-wins, reset clears — and the one architectural property that makes
// the module safe on BOTH graphs.
//
// ── WHY THE IMPORT-LIST CLAUSE IS STRUCTURAL AND NOT A BYTE CHECK ─────────────────────────────
//
// "This module imports nothing" is the property D-1 leans on to call the registry safe on the
// content-script graph, and bytes cannot see it: a type-only `import type … from './x'` erases at
// compile time and moves ZERO bytes, so a byte-identical bundle is consistent with the edge having
// been added (007 §3.4's own argument for scanning source text rather than output). So the clause
// reads the SOURCE, and it carries its own firing control — `diffRegistry.ts`, whose single edge is
// exactly that invisible kind, scanned by the SAME function in the SAME test (finding 1).

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerDocIdentity, getDocIdentity, resetDocIdentityForTest } from './docIdentity';

const ROOT = process.cwd(); // vitest runs from the project root

/** Source text with comments removed, so the words "import" and "require" inside a header comment
 *  cannot be mistaken for an edge. Neither file scanned here contains a string literal with `//`
 *  or `/*` in it, so the naive strip is exact for this pair; it is asserted non-vacuous below. */
function strippedSource(relPath: string): string {
  const text = readFileSync(resolve(ROOT, relPath), 'utf8');
  expect(text.length, `${relPath} read as empty — the scan would be vacuous`).toBeGreaterThan(0);
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Every module edge out of a file: static (`import … from`), bare side-effect (`import 'x'`),
 * TYPE-ONLY (`import type … from`), dynamic (`import('x')`) and CommonJS (`require('x')`).
 * Type-only edges COUNT, deliberately — they are the ones bytes cannot see.
 */
function moduleEdges(relPath: string): string[] {
  const src = strippedSource(relPath);
  const specifiers: string[] = [];
  for (const m of src.matchAll(/(?:^|[\s;}])import\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/g)) {
    specifiers.push(m[1]);
  }
  for (const m of src.matchAll(/(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    specifiers.push(m[1]);
  }
  return specifiers;
}

beforeEach(() => {
  resetDocIdentityForTest();
});

describe('docIdentity — the register-once holder (task 1.1)', () => {
  it('starts empty: read BEFORE any register returns undefined', () => {
    expect(getDocIdentity()).toBeUndefined();
  });

  it('register STORES — the name read back is the name registered', () => {
    registerDocIdentity('AGENTS.md');
    expect(getDocIdentity()).toBe('AGENTS.md');
  });

  it('register REPLACES — last write wins across two registers (mirrors registerWatchTarget)', () => {
    registerDocIdentity('AGENTS.md');
    registerDocIdentity('tasks.md');
    expect(getDocIdentity()).toBe('tasks.md');
    expect(getDocIdentity()).not.toBe('AGENTS.md');
  });

  it('the stale name is OVERWRITTEN even by an unrecognized one — no unregister exists', () => {
    registerDocIdentity('CLAUDE.md');
    registerDocIdentity('notes.md');
    expect(getDocIdentity()).toBe('notes.md');
  });

  it('reset returns to empty — a registration does not leak into the next suite', () => {
    registerDocIdentity('plan.md');
    expect(getDocIdentity()).toBe('plan.md');
    resetDocIdentityForTest();
    expect(getDocIdentity()).toBeUndefined();
  });

  it('read is repeatable and non-consuming — the badge reads it on EVERY render', () => {
    registerDocIdentity('spec.md');
    expect(getDocIdentity()).toBe('spec.md');
    expect(getDocIdentity()).toBe('spec.md');
  });
});

describe('docIdentity — DATA ONLY: the import list is EMPTY, asserted structurally (D-1)', () => {
  it('the module has ZERO edges — and the scanner PROVES it can see one, on a sibling registry', () => {
    // THE CONTROL, first and in the same test: `diffRegistry.ts` is the closest sibling — a
    // data-only registry that imports exactly ONE thing, and that one thing is a TYPE-only edge,
    // the kind a byte check is blind to by construction. If the scanner had gone blind (a bad
    // path, a regex that stopped matching), it could not report this.
    const control = moduleEdges('src/render/diffRegistry.ts');
    expect(control).toContain('../app/snapshots');
    expect(control.length).toBeGreaterThan(0);

    // THE CLAIM, under the same conditions: docIdentity imports nothing at all — not a value, not
    // a type, not a dynamic edge. That is what keeps it off every fence's reasoning on both graphs.
    expect(moduleEdges('src/render/docIdentity.ts')).toEqual([]);
  });

  it('the module exports exactly the three-symbol seam — no presence predicate, no extra surface', () => {
    const src = strippedSource('src/render/docIdentity.ts');
    const exported = [...src.matchAll(/export\s+(?:function|const|let|class|interface|type)\s+(\w+)/g)]
      .map((m) => m[1])
      .sort();
    expect(exported).toEqual(['getDocIdentity', 'registerDocIdentity', 'resetDocIdentityForTest']);
  });
});
