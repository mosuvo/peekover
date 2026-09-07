// mathFont — the bundled STIX Two Math subset (D-13), registered zero-network, exactly like
// `fonts.ts`'s own Literata pattern — but a SEPARATE module, not a new export on `fonts.ts`.
//
// ★ WHY A SEPARATE FILE, NOT A FOURTH FontFaceSpec ON fonts.ts's OWN ARRAY: `fonts.ts` is imported
// unconditionally from `mount.ts` (`initReaderRuntime` -> `registerReaderFonts`), and `mount.ts` is
// on BOTH the content-script and app-page graphs. This font is D-3-R's app-page-only asset — it
// must be reachable ONLY from `mathEnhancer.ts`'s own call sites (`readerPane.ts`/`appShell.ts`,
// both app-page-only), never from `mount.ts`. Folding it into `fonts.ts` would put its ~86 KB
// asset on the content-script bundle the moment `fonts.ts` is imported for Literata alone — a
// content-script byte-invariant violation this module's own isolation is what prevents.
//
// ★ THE MECHANISM — document.fonts.add(), NOT a shadow-root @font-face (task 1.1-R's own real
// finding, `fonts.ts`'s header comment): Chromium does not reliably apply `@font-face` declared
// inside a shadow tree, whereas a face added to `document.fonts` participates in font matching for
// the WHOLE document, shadow trees included, in both Chrome and Firefox. This is a correction to
// D-13/4.2-R's own sealed text (which assumed a shadow-root `@font-face`), flagged in 1.1-R's own
// RESULT block and carried forward here, not the sealed framing.
//
// ★ URL-LOADED, NOT `?inline` — the byte-forecast spike (docs/ai/progress.md, 2026-09-07) measured
// both forms for real: `?inline` (base64 data: URI) costs +115,356 B `.output`; a plain import (no
// `?inline`) lets Vite emit the asset as its own file (default `assetsInlineLimit` is 4096 B, well
// under this subset's 86,224 B, so Vite already chooses a URL without the suffix) at +86,516 B — a
// measured ~28.2 KiB recovery, taken here given 1.1-R's own "~33 KiB headroom, on a knife edge"
// finding. The same spike also re-verified (from an app-page-only call site, matching this module's
// own architecture) that a same-origin `chrome-extension://…` reference needs no
// `web_accessible_resources` key — `mathNetwork.browser.test.ts` (task 4.3-R) re-proves this on the
// real shipped build.
import stixTwoMathSubsetUrl from '../../assets/fonts/stix-two-math-subset.woff2';

/** The family name every math CSS rule (`readerCss.ts`) and every registered `FontFace` share. */
export const MATH_FONT_FAMILY = 'Peekover Math';

let registered = false;

/**
 * Register the bundled STIX Two Math subset on `document.fonts` (idempotent — safe to call on
 * every enhancement pass). Mirrors `registerReaderFonts()`'s own swallow-on-failure discipline: a
 * font that fails to decode must not throw into the render path (AGENTS.md #5), and rendering
 * degrades to the browser's own generic math stack rather than breaking.
 *
 * Returns the face's `load()` promise (or `undefined` where the CSS Font Loading API is
 * unavailable, e.g. jsdom under unit tests) so a caller that wants the font settled before
 * measuring anything — a real-engine test, or `mathEnhancer.ts`'s own async render body — can
 * await it; production callers may ignore the return value, matching `registerReaderFonts()`'s own
 * fire-and-forget call site.
 */
export function registerMathFont(): Promise<void> | undefined {
  if (registered) return undefined;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) {
    return undefined;
  }
  registered = true;
  try {
    const ff = new FontFace(MATH_FONT_FAMILY, `url(${stixTwoMathSubsetUrl}) format('woff2')`, {
      display: 'swap',
    });
    document.fonts.add(ff);
    return ff.load().then(
      () => undefined,
      () => undefined, // a single face failing to decode is non-fatal; the stack falls back
    );
  } catch {
    /* never let font setup break rendering */
    return undefined;
  }
}

/** Test-only: forget registration so a suite can re-probe `registerMathFont()`'s own idempotence
 *  without a real font ever having been added by an earlier test in the same file. */
export function resetMathFontForTest(): void {
  registered = false;
}
