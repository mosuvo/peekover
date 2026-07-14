// The scheduled in-browser mXSS re-check (decisions.md 2026-07-14; task 5.1 part
// B). The unit sanitize suite runs in jsdom, whose HTML parser diverges from real
// engines — especially for mXSS (SVG/MathML foreign content, template/noscript,
// form-in-table reparse). This file runs the SAME sanitize() against REAL engine
// parsing in headless Chromium AND Firefox (see vitest.config.ts `browser`
// project), so a payload that is inert under jsdom but live in a real browser
// cannot hide.
//
// Two layers:
//   1. Every MALICIOUS_CASE re-checked with the same forbidden/survives asserts,
//      now against real-engine parsing.
//   2. Every EXECUTION_CASE actually inserted into the live DOM: we then prove
//      nothing ran (no window.__peekoverPwned, no <script>, no on* attribute).
//
// Zero network: every payload uses only relative/invalid URLs (src="x").

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sanitize } from '../../src/render/sanitize';
import { MALICIOUS_CASES, EXECUTION_CASES } from '../fixtures/malicious-html';

// The exact structural vectors the jsdom suite forbids, asserted here too so the
// two suites stay in lockstep — but now judged by the real browser's parser.
function assertNoLiveVectors(out: string): void {
  const lower = out.toLowerCase();
  expect(lower).not.toContain('<script');
  expect(lower).not.toContain('<iframe');
  expect(lower).not.toContain('<object');
  expect(lower).not.toContain('<embed');
  expect(lower).not.toContain('<style');
  expect(lower).not.toContain('<svg');
  expect(lower).not.toContain('<math');
  expect(lower).not.toMatch(/\son\w+=/); // no on* handler attributes
  expect(lower).not.toContain('javascript:');
}

describe('sanitize in a real browser — malicious fixtures are neutralized', () => {
  it.each(MALICIOUS_CASES)('neutralizes: $name', (testCase) => {
    const out = sanitize(testCase.html);
    const lower = out.toLowerCase();
    for (const bad of testCase.forbidden) {
      expect(lower).not.toContain(bad.toLowerCase());
    }
    assertNoLiveVectors(out);
  });

  it('preserves benign text of neutralized payloads (never a blank page)', () => {
    for (const testCase of MALICIOUS_CASES) {
      const out = sanitize(testCase.html);
      for (const text of testCase.survives ?? []) {
        expect(out).toContain(text);
      }
    }
  });
});

// A macrotask + rAF (+ a short settle) so any async handler — img onerror on a
// failed load, svg/iframe onload on insertion — has fired before we assert.
function flush(): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => setTimeout(() => resolve(), 0));
    }, 30);
  });
}

describe('sanitize in a real browser — nothing executes when mounted live', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    delete window.__peekoverPwned;
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
    delete window.__peekoverPwned;
  });

  it.each(EXECUTION_CASES)('stays inert when live: $name', async (execCase) => {
    // Insert the SANITIZED output into the real DOM — the actual reader path.
    host.innerHTML = sanitize(execCase.html);
    await flush();

    // No handler ran, no script body executed.
    expect(window.__peekoverPwned).toBeUndefined();
    // No live <script> element survived in the mounted subtree.
    expect(host.querySelectorAll('script').length).toBe(0);
    // No element in the subtree carries an on* (event handler) attribute.
    for (const el of host.querySelectorAll('*')) {
      for (const attr of el.attributes) {
        expect(attr.name.startsWith('on')).toBe(false);
      }
    }
  });
});
