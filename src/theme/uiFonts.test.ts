// @vitest-environment jsdom
//
// uiFonts (013 task 2.4): idempotence and failure-swallowing, against a stubbed CSS Font Loading
// API — jsdom has none. The real-engine half (the faces load, the computed faces, zero network)
// lives in tests/browser/uiFonts.browser.test.ts and uiFontsNetwork.browser.test.ts.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  UI_FONT_FACES,
  UI_MONO_FAMILY,
  UI_SANS_FAMILY,
  registerUiFonts,
  resetUiFontsForTest,
} from './uiFonts';

interface StubFace {
  family: string;
  source: string;
  descriptors: Record<string, string>;
}

/** Install a FontFace / document.fonts stub; `rejectLoad` makes every load() reject. */
function stubFontApi(rejectLoad: boolean): { constructed: StubFace[]; added: StubFace[] } {
  const constructed: StubFace[] = [];
  const added: StubFace[] = [];
  class FakeFontFace {
    family: string;
    source: string;
    descriptors: Record<string, string>;
    constructor(family: string, source: string, descriptors: Record<string, string>) {
      this.family = family;
      this.source = source;
      this.descriptors = descriptors;
      constructed.push(this);
    }
    load(): Promise<this> {
      return rejectLoad ? Promise.reject(new Error('decode failed')) : Promise.resolve(this);
    }
  }
  vi.stubGlobal('FontFace', FakeFontFace);
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { add: (f: StubFace) => added.push(f) },
  });
  return { constructed, added };
}

describe('uiFonts — the app page interface and code faces (D-2)', () => {
  beforeEach(() => resetUiFontsForTest());
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (document as { fonts?: unknown }).fonts;
    resetUiFontsForTest();
  });

  it('runs where a document exists (the DOM environment named on line 1)', () => {
    expect(typeof document).toBe('object');
  });

  it('declares exactly the shipped faces: Bricolage 400 / 600 / 700, Sometype 400 / 500', () => {
    expect(UI_FONT_FACES.map((f) => `${f.family} ${f.weight}`)).toEqual([
      `${UI_SANS_FAMILY} 400`,
      `${UI_SANS_FAMILY} 600`,
      `${UI_SANS_FAMILY} 700`,
      `${UI_MONO_FAMILY} 400`,
      `${UI_MONO_FAMILY} 500`,
    ]);
    // Package assets, never remote (AGENTS.md #1).
    for (const f of UI_FONT_FACES) expect(f.url).not.toMatch(/^https?:\/\/(?!localhost)/i);
  });

  it('is a safe no-op where the Font Loading API is absent', () => {
    expect(() => registerUiFonts()).not.toThrow();
    expect(registerUiFonts()).toBeUndefined();
  });

  it('registers each face once, with swap display, and a second call adds nothing', async () => {
    const { constructed, added } = stubFontApi(false);
    await registerUiFonts();
    expect(added.map((f) => `${f.family} ${f.descriptors.weight}`)).toEqual(
      UI_FONT_FACES.map((f) => `${f.family} ${f.weight}`),
    );
    expect(constructed.every((f) => f.descriptors.display === 'swap')).toBe(true);
    expect(registerUiFonts()).toBeUndefined();
    expect(added).toHaveLength(UI_FONT_FACES.length);
  });

  it('swallows a rejecting FontFace.load: the call resolves and nothing throws', async () => {
    const { added } = stubFontApi(true);
    const settled = registerUiFonts();
    expect(settled).toBeInstanceOf(Promise);
    await expect(settled).resolves.toBeUndefined();
    expect(added).toHaveLength(UI_FONT_FACES.length);
  });
});
