// @vitest-environment jsdom
//
// Perf harness for the render pipeline. Measures parse -> sanitize (-> serialize
// to an HTML string) wall time over a representative mid-size markdown document
// and asserts it stays under a budget with headroom.
//
// WHAT THIS MEASURES: the PURE PIPELINE only (markdown text in, sanitized HTML
// string out). It does NOT measure real browser first-paint — no shadow-DOM
// mount, no layout, no style/paint. That end-to-end, in-browser first-paint on a
// 1MB fixture is the separate measurement recorded at task 5.2 (see tasks.md /
// spec.md: user-facing target <150ms end-to-end). Because the pure pipeline has
// large headroom under that end-to-end target, we assert a generous CEILING and
// PRINT the measured per-run number: a tight assert would be flaky across
// machines and CI runners, and the value's job is to catch a regression in
// ORDER of magnitude, not to police single-digit-ms jitter.

import { describe, it, expect } from 'vitest';
import { parse } from './parse';
import { sanitize } from './sanitize';

/**
 * Build a representative mid-size document: headings, paragraphs, ordered and
 * unordered lists, a GFM table, a fenced code block, inline emphasis, links and a
 * task list — repeated across `sections` blocks. Deterministic (index-derived, no
 * randomness) so the fixture is stable run to run.
 */
function buildFixture(sections: number): string {
  const blocks: string[] = ['# Peekover mid-size perf fixture', ''];
  for (let i = 0; i < sections; i++) {
    blocks.push(
      `## Section ${i}: rendering markdown into **beautiful** reading`,
      '',
      `Peekover renders raw markdown _entirely on device_ with [zero network](https://example.com/${i}) ` +
        `by default. This paragraph exists to give the parser and sanitizer some real inline work: ` +
        `\`code spans\`, ~~strikethrough~~, **bold**, and _italics_ all in one line number ${i}.`,
      '',
      '- unordered item alpha',
      '- unordered item beta with `inline code`',
      '- unordered item gamma',
      '',
      '1. ordered first',
      '2. ordered second',
      '3. ordered third',
      '',
      '- [ ] a pending task',
      '- [x] a done task',
      '',
      '| Feature | Status | Notes |',
      '|---------|--------|-------|',
      `| Parse | ok | section ${i} |`,
      '| Sanitize | ok | strict allow-list |',
      '| Mount | ok | shadow DOM |',
      '',
      '```js',
      `const section = ${i};`,
      'function render(md) { return sanitize(parse(md)); }',
      '```',
      '',
      '> A blockquote to close the section, with a bit of prose so the block is not trivial.',
      '',
    );
  }
  return blocks.join('\n');
}

describe('render pipeline — perf (pure parse+sanitize, NOT browser first-paint)', () => {
  it('parse+sanitize of a mid-size document stays under budget', () => {
    const source = buildFixture(20); // a few hundred lines of mixed markdown
    const lineCount = source.split('\n').length;

    // Prove we exercised the real pipeline (guards against a silently-empty run).
    const sampleOut = sanitize(parse(source));
    expect(sampleOut).toContain('<table>');
    expect(sampleOut).toContain('<pre><code class="language-js">');

    // Warm up (module init / JIT) so the timed loop measures steady-state cost.
    for (let i = 0; i < 3; i++) sanitize(parse(source));

    const RUNS = 20;
    const start = performance.now();
    for (let i = 0; i < RUNS; i++) sanitize(parse(source));
    const perRun = (performance.now() - start) / RUNS;

    // Budget: generous ceiling with headroom under the <150ms end-to-end target.
    // The pure pipeline is expected to be well under this; the assert catches an
    // order-of-magnitude regression, not ms-level jitter.
    const BUDGET_MS = 100;

    console.log(
      `[perf] parse+sanitize mid-size (${lineCount} lines): ` +
        `${perRun.toFixed(2)}ms/run over ${RUNS} runs (budget ${BUDGET_MS}ms)`,
    );

    expect(perRun).toBeLessThan(BUDGET_MS);
  });
});
