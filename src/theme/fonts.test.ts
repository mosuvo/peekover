// @vitest-environment jsdom
//
// The bundled fonts must be INLINE (zero network — AGENTS.md #1): every face's src
// is a base64 `data:` URI produced by Vite's `?inline`, never a remote or extension
// URL. And registration must be a safe no-op where the Font Loading API is absent
// (jsdom here, old engines in the wild) so it can never throw into the render path.

import { describe, it, expect } from 'vitest';
import { FONT_FACES, registerReaderFonts } from './fonts';

describe('fonts — bundled Literata, zero network', () => {
  it('ships the four required faces (regular, bold, italic, bold-italic)', () => {
    expect(FONT_FACES).toHaveLength(4);
    const key = (f: (typeof FONT_FACES)[number]) => `${f.weight}/${f.style}`;
    expect(FONT_FACES.map(key).sort()).toEqual(
      ['400/italic', '400/normal', '700/italic', '700/normal'],
    );
  });

  it('every face is an inline data: URI — no remote, no network', () => {
    for (const face of FONT_FACES) {
      expect(face.src.startsWith('data:')).toBe(true);
      // Guard against a regression to a URL-based (fetchable) source.
      expect(face.src).not.toMatch(/^https?:/);
      expect(face.src).not.toContain('chrome-extension');
    }
  });

  it('registerReaderFonts is a safe no-op where FontFace is unavailable (jsdom)', () => {
    expect(() => registerReaderFonts()).not.toThrow();
    // Idempotent: a second call is also fine.
    expect(() => registerReaderFonts()).not.toThrow();
  });
});
