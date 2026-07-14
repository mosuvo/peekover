// fonts — Literata, bundled and registered zero-network.
//
// AGENTS.md #1 (zero network by default) is the whole point here: the woff2 files
// are imported with Vite's `?inline` suffix, which embeds each font as a base64
// `data:` URI at build time. Nothing is ever fetched — not from a remote host, not
// even from the packaged extension over the network — so there is no request to
// light the network indicator and no `web_accessible_resources` entry to add to the
// manifest. See docs/ai/decisions.md (2026-07-14, font strategy).
//
// The imports use RELATIVE paths (not the `@/` alias) so the same specifier
// resolves under both the WXT/Vite build and the vitest runner, which has no alias
// config.
//
// Registration goes through the CSS Font Loading API into `document.fonts` rather
// than an `@font-face` rule inside the shadow root. Chromium does not reliably apply
// `@font-face` declared inside a shadow tree, whereas faces added to `document.fonts`
// participate in font matching for the WHOLE document, shadow trees included, in
// both Chrome and Firefox. Adding a font FACE does not restyle any host-page element
// (nothing on the host page asks for "Literata"), so this does not violate the
// "don't leak styles into the page" rule — it only makes a family available.

import literata400 from '../../assets/fonts/literata-latin-400-normal.woff2?inline';
import literata700 from '../../assets/fonts/literata-latin-700-normal.woff2?inline';
import literata400i from '../../assets/fonts/literata-latin-400-italic.woff2?inline';
import literata700i from '../../assets/fonts/literata-latin-700-italic.woff2?inline';

/** One bundled Literata weight/style and its inlined `data:` source. */
export interface FontFaceSpec {
  readonly weight: string;
  readonly style: string;
  /** A base64 `data:` URI (see the `?inline` imports above) — never remote. */
  readonly src: string;
}

/**
 * The Latin-subset Literata faces the reader ships: regular, bold, italic and
 * bold-italic. Covers body text, `**bold**`, `_italic_` and their combination.
 */
export const FONT_FACES: readonly FontFaceSpec[] = [
  { weight: '400', style: 'normal', src: literata400 },
  { weight: '700', style: 'normal', src: literata700 },
  { weight: '400', style: 'italic', src: literata400i },
  { weight: '700', style: 'italic', src: literata700i },
];

let registered = false;

/**
 * Register the bundled Literata faces on `document.fonts` (idempotent — safe to
 * call on every render). A no-op where the CSS Font Loading API is unavailable
 * (e.g. jsdom under tests, or very old engines): the reader then falls back to the
 * `--serif` stack's Georgia/serif, never breaking. Loading is kicked off eagerly
 * but its promise is swallowed — a font that fails to decode must not throw into
 * the render path (AGENTS.md #5, never a blank page).
 */
export function registerReaderFonts(): void {
  if (registered) return;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) {
    return;
  }
  registered = true;
  for (const face of FONT_FACES) {
    try {
      const ff = new FontFace('Literata', `url(${face.src}) format('woff2')`, {
        weight: face.weight,
        style: face.style,
        display: 'swap',
      });
      document.fonts.add(ff);
      void ff.load().catch(() => {
        /* a single face failing to decode is non-fatal; the stack falls back */
      });
    } catch {
      /* never let font setup break rendering */
    }
  }
}
