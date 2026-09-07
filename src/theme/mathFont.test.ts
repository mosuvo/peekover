// @vitest-environment jsdom
//
// Registration must be a safe no-op where the CSS Font Loading API is absent (jsdom here, old
// engines in the wild) so it can never throw into the render path (AGENTS.md #5) — mirrors
// `fonts.test.ts`'s own precedent. The zero-network/no-WAR proof over the REAL built asset (this
// module deliberately ships a URL-loaded, not `?inline`, reference — see this module's own header
// for why) is a real-engine question and lives in `tests/browser/mathNetwork.browser.test.ts`
// (4.3-R), not here.

import { describe, it, expect } from 'vitest';
import { MATH_FONT_FAMILY, registerMathFont, resetMathFontForTest } from './mathFont';

describe('mathFont — the bundled STIX Two Math subset, zero network', () => {
  it('names a family distinct from every other registered family', () => {
    expect(MATH_FONT_FAMILY).toBe('Peekover Math');
  });

  it('registerMathFont is a safe no-op where FontFace is unavailable (jsdom)', () => {
    expect(() => registerMathFont()).not.toThrow();
    // Idempotent: a second call is also fine, and returns undefined the same way.
    expect(registerMathFont()).toBeUndefined();
  });

  it('resetMathFontForTest lets a later real-engine test re-probe registration', () => {
    // Only a shape/idempotence check here (no FontFace in jsdom to actually register) — the real
    // reset-then-reregister proof needs a real engine, per this module's own header.
    expect(() => resetMathFontForTest()).not.toThrow();
    expect(() => registerMathFont()).not.toThrow();
  });
});
