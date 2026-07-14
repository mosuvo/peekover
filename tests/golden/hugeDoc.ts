// Deterministic ~1 MB markdown generator for the golden + perf suites.
//
// Extends the pattern in src/render/pipeline.perf.test.ts's buildFixture: every
// byte is index-derived, with ZERO randomness, so the generated document — and
// therefore the pipeline's output over it — is byte-stable run to run and machine
// to machine. This is what lets golden.test.ts assert a fixed SHA-256 digest of
// the sanitized output. Task 5.2 (perf) reuses this generator; it is exported and
// must stay deterministic. Do NOT introduce Date/Math.random/env here.

/**
 * Number of sections in the huge document. Chosen so the generated markdown is
 * a little over 1 MB (see hugeDocByteLength() / the golden length-band assert).
 */
export const HUGE_DOC_SECTIONS = 1400;

/** A marker present in the OUTPUT exactly once per section (an <h2> id-free). */
export const HUGE_DOC_SECTION_HEADING_RE = /<h2>Section \d+:/g;

/**
 * Build a deterministic ~1 MB markdown document of `sections` mixed blocks:
 * headings, prose with inline emphasis/code/links, unordered + ordered lists, a
 * task list, a GFM table, a fenced code block, and a blockquote — the same block
 * shape as the perf fixture, repeated. Index-derived only; no randomness.
 *
 * @param sections How many section blocks to emit (default HUGE_DOC_SECTIONS).
 * @returns The markdown source string.
 */
export function buildHugeDoc(sections: number = HUGE_DOC_SECTIONS): string {
  const blocks: string[] = ['# Peekover huge-document golden fixture', ''];
  for (let i = 0; i < sections; i++) {
    blocks.push(
      `## Section ${i}: rendering markdown into **beautiful** reading`,
      '',
      `Peekover renders raw markdown _entirely on device_ with ` +
        `[zero network](https://example.com/${i}) by default. This paragraph gives the ` +
        `parser and sanitizer real inline work: \`code spans\`, ~~strikethrough~~, ` +
        `**bold**, and _italics_ all on one line, in section number ${i}.`,
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
      `> A blockquote closing section ${i}, with enough prose that the block is not trivial.`,
      '',
    );
  }
  return blocks.join('\n');
}
