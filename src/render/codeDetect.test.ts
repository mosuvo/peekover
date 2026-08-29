// codeDetect — the structural non-code detectors (each with a positive AND a negative case, so a
// decline means the SHAPE fired, not that nothing was tried), the margin gate, and the accuracy
// reproduction against this repository's own unlabeled-fence corpus (8.3's methodology, re-run
// live rather than pinned to a deleted scratch snapshot — codeImportFence.test.ts's own
// `process.cwd()` convention for a repo-wide scan).

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectLanguage } from './codeDetect';

describe('detectLanguage — structural non-code detectors (checked before any language signature)', () => {
  it('declines a bare file list, three or more path-like lines and nothing else', () => {
    const fileList = ['LICENSE', 'scripts/perf-watch.ts', 'src/theme/reader.ts', 'src/theme/readerCss.ts'].join(
      '\n',
    );
    expect(detectLanguage(fileList)).toBeUndefined();
  });

  it('does NOT decline a path-prefixed fence when not EVERY line is bare (the detector needs ALL lines path-like)', () => {
    // Negative control for the SAME detector: two genuine path lines ahead of real code must not
    // suppress the guess a change-manifest-only fence would correctly decline.
    const mixed = ['LICENSE', 'src/theme/reader.ts', 'interface Foo {', '  bar: string;', '}'].join('\n');
    expect(detectLanguage(mixed)).toBe('typescript');
  });

  it('declines a directory tree (box-drawing characters)', () => {
    const tree = ['repo/', '├── AGENTS.md', '│   └── nested.md', '└── docs/'].join('\n');
    expect(detectLanguage(tree)).toBeUndefined();
  });

  it('declines an arrow-diagram / ellipsis pseudocode shape', () => {
    const arrows = ['toolbar action ─(click)→ tabs.create(app.html)', 'openFolder() ── feature-detect'].join('\n');
    expect(detectLanguage(arrows)).toBeUndefined();

    const ellipsis = ['onText(text):', '    ...', '    if (x) { y = 1; return }'].join('\n');
    expect(detectLanguage(ellipsis)).toBeUndefined();
  });

  it('declines this repository\'s own "# annotated pseudocode" convention (2+ trailing `#` annotations)', () => {
    const pseudocode = [
      'enhanceTables(host):                        # total (D-7); returns immediately',
      '    column = host.shadowRoot?.querySelector(\'.peekover-reader\')     # D-8',
      '    if (!column) return',
    ].join('\n');
    expect(detectLanguage(pseudocode)).toBeUndefined();
  });

  it('does NOT decline a single incidental `#` comment as pseudocode (needs 2+)', () => {
    // Negative control: real bash uses `#` too — one inline comment alone must not trip the
    // pseudocode detector, only the REPEATED convention this repo's plan.md files carry.
    const oneComment = ['export FOO=bar   # only one', 'pnpm build'].join('\n');
    expect(detectLanguage(oneComment)).not.toBeUndefined();
  });
});

describe('detectLanguage — language signatures, positive cases', () => {
  it('identifies a TypeScript interface declaration', () => {
    const ts = [
      'interface SettingsPort {',
      '  snapshot(): Settings;',
      '  load(): Promise<Settings>;',
      '  save(patch: Partial<Settings>): Promise<void>;',
      '}',
    ].join('\n');
    expect(detectLanguage(ts)).toBe('typescript');
  });

  it('identifies a bash script (shebang + common commands)', () => {
    const bash = ['#!/usr/bin/env bash', 'cd "$ROOT"', 'export NODE_ENV=production', 'pnpm build && git status'].join(
      '\n',
    );
    expect(detectLanguage(bash)).toBe('bash');
  });

  it('identifies CSS (selector + curated property declarations)', () => {
    const css = ['.peekover-code {', '  display: flex;', '  background-color: var(--code-bg);', '}'].join('\n');
    expect(detectLanguage(css)).toBe('css');
  });
});

describe('detectLanguage — the margin gate declines a mixed-signal fence', () => {
  it('declines when two signatures score within MARGIN of each other', () => {
    // One `=>` (JavaScript, weight 1) beside one bracketed token (HTML, weight 1) is a tied,
    // ambiguous score — the fence must decline rather than guess either way.
    const tied = 'x => 1; <br>';
    const result = detectLanguage(tied);
    expect(result === 'javascript' || result === 'html').toBe(false);
  });

  it('excludes a generic type parameter from the HTML signature (`Promise<T>` is not a tag)', () => {
    // The one place this distinction is load-bearing: without it, `interface`-heavy TypeScript
    // carrying `Promise<X>`/`Partial<X>` return types would tie against its own HTML miscount.
    const ts = 'interface Port {\n  load(): Promise<Settings>;\n  save(v: Partial<Settings>): Promise<void>;\n}';
    expect(detectLanguage(ts)).toBe('typescript');
  });
});

describe('detectLanguage — accuracy against this repository\'s own unlabeled-fence corpus (8.3\'s methodology)', () => {
  // Re-scans live rather than reading a pinned snapshot: 8.3's own scratch corpus was deleted
  // before commit (the standing scratch-file-then-delete convention), and 8.4 already proved this
  // exact re-scan reproduces 8.3's banked count with zero drift. Mirrors codeImportFence.test.ts's
  // `process.cwd()` convention for a repo-wide, real-tree scan.
  const ROOT = process.cwd();
  const EXCLUDE = new Set(['node_modules', '.git', '.output', '.wxt']);

  interface UnlabeledFence {
    readonly file: string; // repo-relative, forward-slashed
    readonly startLine: number;
    readonly body: string;
  }

  function scanUnlabeledFences(dir: string, out: UnlabeledFence[]): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDE.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanUnlabeledFences(full, out);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const lines = readFileSync(full, 'utf8').split('\n');
      const rel = full.slice(ROOT.length + 1).replace(/\\/g, '/');
      let i = 0;
      while (i < lines.length) {
        const open = /^(`{3,})(.*)$/.exec(lines[i]);
        if (!open) {
          i += 1;
          continue;
        }
        const marker = open[1];
        const info = open[2].trim();
        const startLine = i + 1;
        const body: string[] = [];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== marker) {
          body.push(lines[j]);
          j += 1;
        }
        if (info === '') out.push({ file: rel, startLine, body: body.join('\n') });
        i = j + 1;
      }
    }
  }

  const corpus: UnlabeledFence[] = [];
  scanUnlabeledFences(ROOT, corpus);

  // 8.3's banked count (HEAD 8b62a2c) held with ZERO drift through 8.4 (HEAD b102f85). Re-pinned
  // at M10 hygiene (HEAD 4b16a23, n=23→26) after confirming the drift is legitimate corpus growth —
  // 3 new unlabeled fences in specs/010-local-exports/plan.md (a file that didn't exist at 8.3/8.4),
  // each independently confirmed non-code — not a detectLanguage regression: the pre-existing
  // 23-item subset still splits 7/16 under today's code. A future change in this number is again a
  // FLAG condition for the task that observes it, not a silent re-baseline.
  it('reproduces the current banked corpus size (n=26), zero drift since the M10 hygiene re-pin', () => {
    expect(corpus.length).toBe(26);
  });

  // Ground truth assigned by inspection (8.3's own methodology) — 7 genuine code items, 16
  // non-code (this repo's "annotated pseudocode" convention, directory trees, a bare file list,
  // and tests/golden/fixtures/code.md's one deliberate prose fixture). 8.3's own per-item labels
  // were never banked past the aggregate 7/16 split and the one named false positive
  // (specs/008-persona-1-qol/plan.md:220's placeholder angle brackets) — this table is this
  // task's OWN independent re-assignment against that same aggregate, not a transcription.
  const CODE_ITEMS = new Set([
    'specs/002-active-source-foundation/plan.md:138',
    'specs/004-themes-settings/plan.md:30',
    'specs/004-themes-settings/plan.md:41',
    'specs/005-watch-diff/plan.md:42',
    'specs/005-watch-diff/plan.md:62',
    'specs/005-watch-diff/plan.md:87',
    'specs/009-code-blocks/plan.md:118',
  ]);

  it('reproduces the 7/19 code/non-code split this task\'s own re-assignment converged on', () => {
    const key = (f: UnlabeledFence): string => `${f.file}:${f.startLine}`;
    const codeCount = corpus.filter((f) => CODE_ITEMS.has(key(f))).length;
    expect(codeCount).toBe(7);
    expect(corpus.length - codeCount).toBe(19);
  });

  it('scores every corpus item\'s CODE-vs-DECLINE call correctly (26/26 on this task\'s own re-assignment)', () => {
    const key = (f: UnlabeledFence): string => `${f.file}:${f.startLine}`;
    const misses: string[] = [];
    for (const fence of corpus) {
      const isCode = CODE_ITEMS.has(key(fence));
      const guessed = detectLanguage(fence.body) !== undefined;
      if (guessed !== isCode) misses.push(key(fence));
    }
    expect(misses).toEqual([]);
  });
});
