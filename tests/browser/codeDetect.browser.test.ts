// codeDetect — the real-engine half of task 8.6's heuristic proof. `codeDetect.test.ts` (unit,
// jsdom-free) already proves the algorithm's correctness against this repository's own corpus;
// this file exists only for the ONE property that is not a jsdom-vs-browser concern but a
// "does the shipped module behave the same way once it actually runs inside Chromium/Firefox"
// concern — pure string/regex logic carries no real jsdom-blind risk (no layout, no paint, no
// pointer geometry), but the module is UNREACHABLE from any entrypoint at this task (module
// header, `codeDetect.ts`), so there is no live page to exercise it through. This file imports it
// directly and drives it inside the real engine both suites run against, Cr+Fx — never a guessed
// language presented as confident on an inconclusive fence (§4).

import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../../src/render/codeDetect';

describe('detectLanguage — real-engine degradation: inconclusive detection declines, never a false guess', () => {
  it('declines an unlabeled, genuinely ambiguous fence rather than presenting a guessed language as confident', () => {
    // A short, low-signal snippet with no structural non-code shape and no language whose
    // signature clears the margin — the resting state §4 requires: stays undetected, never a
    // confident-but-wrong label.
    const ambiguous = 'x\ny\nz';
    expect(detectLanguage(ambiguous)).toBeUndefined();
  });

  it('declines the corpus\'s own documented mixed-signal shape (arrow/ellipsis pseudocode)', () => {
    const pseudocode = 'onText(text):\n    ...\n    if (x) { y = 1; return }';
    expect(detectLanguage(pseudocode)).toBeUndefined();
  });

  it('still returns a real guess for an unambiguous fence, so decline is a genuine branch, not the only path', () => {
    // The positive control the negative claims above disclaim against (finding 1): if this were
    // undefined too, "declines when inconclusive" would be indistinguishable from "always
    // declines."
    const ts = 'interface Foo {\n  bar: string;\n}';
    expect(detectLanguage(ts)).toBe('typescript');
  });
});
