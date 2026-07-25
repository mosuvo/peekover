// assertRegistrationsUseFactory — D-2 (task 4.1): the SHARED, CALL-SITE-SCOPED seam pin.
//
// ── WHAT THIS REPLACES, AND WHY IT HAD TO GROW A SECOND CLAUSE ──────────────────────────────────
//
// M5 shipped a FILE-scoped pin (contentWatch.test.ts:117-119, pre-4.1): it asked whether a file
// that registers a watch target ALSO contains `createWatchController(` ANYWHERE in its text. That
// passes a file holding one correct and one hand-built registration side by side — which is exactly
// the shape appShell.installWatchForFile takes after 2.1 (`registerWatchTarget` + `registerDiffContext`
// in the same block). This helper inspects each `registerX(...)` call's ACTUAL argument instead, and
// serves BOTH registries (watch AND diff) so the check is written once and applied twice.
//
// ── THE ARGUMENT-CHECK IS SOURCE-TEXT, TWO CLAUSES — NOT AN AST ─────────────────────────────────
//
// AST parsing is off the table: entrypoints import the virtual `#imports` module that neither Vitest
// project can resolve, so the pin must read files as TEXT (the standing rule the M5 pin and
// watchRelay.test.ts both obey). The scanner below is a small comment/string-aware state machine —
// enough to locate a call and balance its parentheses without miscounting a `)` inside a comment or
// string. For each production `registerName(` call site it extracts the argument and classifies it:
//
//   Clause 1 — INLINE FACTORY: the argument's first token is `factoryName(`  →  PASS.
//              (e.g. contentWatch.ts: `registerWatchTarget(createWatchController({...}))`.)
//
//   Clause 2 — SAME-FILE BARE-IDENTIFIER TRACE: the argument is a bare identifier, and the same file
//              assigns `<ident> = factoryName(`  →  PASS, recording the resolved assignment line.
//              (e.g. appShell.ts: `let controller; ... controller = createWatchController({...});
//               registerWatchTarget(controller);` — the DELIBERATE mutable-ref pattern its onDead
//               closure requires, which no inline form can express.)
//
//   Anything else — object literal, member access, a non-factory call, a bare identifier with no
//   matching assignment in the file — is a VIOLATION, reported with its file:line and argument text.
//
// ── KNOWN LAX EDGES (both copy-paste / typo class, not adversarial) ─────────────────────────────
//
//   • The clause-2 trace is file-global, not lexically scoped: a same-file assignment to the same
//     identifier satisfies the pin regardless of block/function scope.
//   • A re-assignment `ident = factoryX(); ident = handBuilt; registerX(ident)` is a false positive
//     — the first (factory) assignment satisfies the trace even though the second shadows it.
//   Neither is a shape a hand-built target arrives through by accident, and neither is worth an AST.
//   They are named here so a future reader sees the boundary rather than assuming there is none.
//
// The failure message names EVERY inspected call site with what its trace resolved to (a green
// clause-2 trace prints `traced to <file>:<line>`), so a reviewer reading a red can see both the
// offending site AND what the passing traces resolved to — the retro rule "a pin certifies exactly
// the stage it observes" applied to the pin itself.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

/** Project root — this file lives at `tests/util/`, two levels below it. `roots`/`entrypointPins`
 *  paths in the config are resolved relative to here. */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export interface SeamPinConfig {
  /** Directories to walk (e.g. `['src', 'entrypoints']`), project-root-relative. Test files
   *  (`*.test.ts`) are excluded — a test registering its own target is the legitimate case the
   *  pin must never flag. Both `.ts` production sources and `.ts.fixture` corpora are read. */
  roots: readonly string[];
  /** The registration function name — e.g. `'registerWatchTarget'`. */
  registerName: string;
  /** The factory whose call must build the registered argument — e.g. `'createWatchController'`. */
  factoryName: string;
  /** Non-vacuity floor: at least this many production call sites must exist. The pin is worth
   *  nothing if a refactor silently removed every registration (the M5 hazard, applied to the pin
   *  itself). */
  minCallSites: number;
  /** Additional literal source-text pins for un-loadable entrypoints (the M5 precedent at
   *  contentWatch.test.ts:70-99 — a WXT entrypoint imports `#imports`, so Vitest cannot load it and
   *  it must be pinned by scanning its text). */
  entrypointPins?: readonly { path: string; requiredSubstring: string }[];
}

const isIdent = (ch: string | undefined): boolean => ch !== undefined && /[A-Za-z0-9_$]/.test(ch);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 1-based line number of `index` within `source`. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

/** If a comment or string literal STARTS at `i`, return the index just past it; else null. Shared
 *  by the top-level scan and the parenthesis matcher so both skip trivia identically. */
function skipTrivia(src: string, i: number): number | null {
  const ch = src[i];
  const nx = src[i + 1];
  if (ch === '/' && nx === '/') {
    let j = i + 2;
    while (j < src.length && src[j] !== '\n') j++;
    return j;
  }
  if (ch === '/' && nx === '*') {
    let j = i + 2;
    while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j++;
    return Math.min(j + 2, src.length);
  }
  if (ch === '"' || ch === "'") {
    let j = i + 1;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === ch) { j++; break; }
      j++;
    }
    return j;
  }
  if (ch === '`') return skipTemplate(src, i);
  return null;
}

/** Skip a template literal from its opening backtick at `i`, descending into `${ ... }` spans (which
 *  are code and may themselves hold parens, comments, or strings). Returns the index past the
 *  closing backtick. */
function skipTemplate(src: string, i: number): number {
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '`') return j + 1;
    if (c === '$' && src[j + 1] === '{') {
      j += 2;
      let depth = 1;
      while (j < src.length && depth > 0) {
        const t = skipTrivia(src, j);
        if (t !== null) { j = t; continue; }
        if (src[j] === '{') depth++;
        else if (src[j] === '}') depth--;
        j++;
      }
      continue;
    }
    j++;
  }
  return j;
}

/** From `(` at `openIndex`, return the index of the matching `)`, skipping trivia. */
function matchParen(src: string, openIndex: number): number {
  let depth = 0;
  let j = openIndex;
  while (j < src.length) {
    const t = skipTrivia(src, j);
    if (t !== null) { j = t; continue; }
    const c = src[j];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return j; }
    j++;
  }
  return src.length;
}

/** True if the token immediately before `i` (skipping whitespace) is `function` — i.e. `i` is the
 *  `registerName` of its own `export function registerName(` declaration, not a call. */
function precededByFunction(src: string, i: number): boolean {
  let j = i - 1;
  while (j >= 0 && /\s/.test(src[j])) j--;
  let start = j;
  while (start >= 0 && isIdent(src[start])) start--;
  return src.slice(start + 1, j + 1) === 'function';
}

interface CallSite {
  line: number;
  /** Raw source text between the call's parentheses. */
  argText: string;
}

/** Every `registerName(` CALL in `source` (declaration, comments and strings excluded), with the
 *  raw argument text and the call's line. */
function findCallSites(source: string, registerName: string): CallSite[] {
  const sites: CallSite[] = [];
  const needle = registerName + '(';
  let i = 0;
  while (i < source.length) {
    const t = skipTrivia(source, i);
    if (t !== null) { i = t; continue; }
    if (
      source.startsWith(needle, i) &&
      !isIdent(source[i - 1]) &&
      !precededByFunction(source, i)
    ) {
      const openParen = i + registerName.length;
      const close = matchParen(source, openParen);
      sites.push({ line: lineOf(source, i), argText: source.slice(openParen + 1, close) });
      i = close + 1;
      continue;
    }
    i++;
  }
  return sites;
}

/** Trim whitespace and leading comments off an argument, so the FIRST token is exposed. */
function stripArg(argText: string): string {
  let a = argText;
  for (;;) {
    const before = a.length;
    a = a.trimStart();
    if (a.startsWith('//')) {
      const nl = a.indexOf('\n');
      a = nl < 0 ? '' : a.slice(nl + 1);
    } else if (a.startsWith('/*')) {
      const end = a.indexOf('*/');
      a = end < 0 ? '' : a.slice(end + 2);
    }
    if (a.length === before) break;
  }
  return a.trimEnd();
}

type Classification =
  | { ok: true; note: string }
  | { ok: false; note: string };

/** Classify one call site's argument against the two clauses. `rel` is the file's project-relative
 *  path, used in the resolved-trace note so the message points at the right file. */
function classify(argText: string, source: string, factoryName: string, rel: string): Classification {
  const arg = stripArg(argText);

  // Clause 1 — inline factory.
  if (new RegExp('^' + escapeRegExp(factoryName) + '\\s*\\(').test(arg)) {
    return { ok: true, note: `inline ${factoryName}(...)` };
  }

  // Clause 2 — same-file bare-identifier trace.
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(arg)) {
    const assign = new RegExp(
      '(?:(?:const|let|var)\\s+)?\\b' + escapeRegExp(arg) + '\\b\\s*=\\s*' + escapeRegExp(factoryName) + '\\s*\\(',
    );
    const m = assign.exec(source);
    if (m) {
      return { ok: true, note: `argument \`${arg}\` traced to ${rel}:${lineOf(source, m.index)}` };
    }
    return {
      ok: false,
      note: `argument \`${arg}\` is a bare identifier with no \`${factoryName}(\` assignment in ${rel}`,
    };
  }

  // Anything else — object literal, member access, non-factory call, arbitrary expression.
  const shown = arg.length > 80 ? arg.slice(0, 77) + '...' : arg;
  return {
    ok: false,
    note: `argument \`${shown}\` is neither \`${factoryName}(...)\` nor a factory-traced identifier`,
  };
}

/** Every production `.ts` (and `.ts.fixture`) under `absDir` — `*.test.ts` and `node_modules`
 *  excluded. */
function collectSources(absDir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(absDir)) {
    const p = join(absDir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules') continue;
      out.push(...collectSources(p));
      continue;
    }
    const isFixture = name.endsWith('.ts.fixture');
    const isProdTs = name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.d.ts');
    if (isFixture || isProdTs) out.push(p);
  }
  return out;
}

/**
 * Assert that every production `registerName(...)` call site under `roots` builds its argument with
 * `factoryName` — inline (clause 1) or via a same-file identifier traced to a `factoryName(`
 * assignment (clause 2). Throws (via `expect`) on any other shape, on fewer than `minCallSites`
 * call sites, or on an unmet `entrypointPin`.
 */
export function assertRegistrationsUseFactory(config: SeamPinConfig): void {
  const { roots, registerName, factoryName, minCallSites, entrypointPins = [] } = config;

  const files = roots.flatMap((r) => collectSources(join(ROOT, r)));

  interface Record { rel: string; line: number; ok: boolean; note: string }
  const records: Record[] = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const rel = file.slice(ROOT.length).replace(/\\/g, '/');
    for (const cs of findCallSites(source, registerName)) {
      const c = classify(cs.argText, source, factoryName, rel);
      records.push({ rel, line: cs.line, ok: c.ok, note: c.note });
    }
  }

  // Non-vacuity first, so an absent corpus trips HERE rather than passing a violation-free check.
  expect(
    records.length,
    `no ${registerName} call sites found under [${roots.join(', ')}] — expected at least ` +
      `${minCallSites}. Did the registration seam move, or did a refactor delete it?`,
  ).toBeGreaterThanOrEqual(minCallSites);

  const inspected = records
    .map((r) => `  ${r.ok ? '✓' : '✗'} ${r.rel}:${r.line} — ${r.note}`)
    .join('\n');
  const violations = records.filter((r) => !r.ok).map((r) => `${r.rel}:${r.line} — ${r.note}`);
  expect(
    violations,
    `every production ${registerName}(...) call site must build its argument with ${factoryName} ` +
      `(inline, or a same-file identifier assigned from ${factoryName}(...)).\n` +
      `Inspected ${records.length} call site(s):\n${inspected}\n` +
      `Offending call site(s):`,
  ).toEqual([]);

  for (const pin of entrypointPins) {
    const source = readFileSync(join(ROOT, pin.path), 'utf8');
    expect(
      source.includes(pin.requiredSubstring),
      `${pin.path} must contain ${JSON.stringify(pin.requiredSubstring)} — an un-loadable ` +
        `entrypoint pinned by source text (the #imports rule).`,
    ).toBe(true);
  }
}
