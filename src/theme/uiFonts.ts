// uiFonts — the design's interface and code faces, Bricolage Grotesque and Sometype Mono, for the
// APP PAGE only (M13 plan D-2; gate-1 Q3 / Q10). The twin of `mathFont.ts`: plain asset imports,
// registered on `document.fonts`, zero network.
//
// ★ APP PAGES ONLY. Imported by `appShell.ts` and the setup guide's `onboarding.ts` (6.1). The content-script
// reader never reaches this module (`uiFontsImportFence.test.ts`), so it adds no font bytes there:
// `tokens.css`'s `--sans` / `--mono` lead with these families and fall through to close system
// faces when nothing registered them (plan D-3).
//
// ★ URL-LOADED, NOT `?inline` — `mathFont.ts`'s header records the measurement: Vite emits each
// woff2 as its own package file (they are over the 4,096 B inline limit), where base64 would cost
// about a third more. On the shipped app page each URL is a same-origin `chrome-extension://` /
// `moz-extension://` package URL: no `web_accessible_resources` and no network
// (`uiFontsNetwork.browser.test.ts`).
//
// ★ document.fonts.add(), NOT an @font-face rule. The reader pane renders inside a shadow root,
// and an @font-face declared there is ignored — measured at task 2.4 on both engines (the text
// kept the fallback face's width exactly); a face on `document.fonts` reaches shadow trees on both.
// `fonts.ts` records the same finding for Literata.
//
// The files and their provenance: `assets/fonts/README.md`. Bricolage is three static instances
// (opsz 12), committed provisionally — task 2.5 rules static vs variable.
import bricolage400 from '../../assets/fonts/bricolage-latin-400-normal.woff2';
import bricolage600 from '../../assets/fonts/bricolage-latin-600-normal.woff2';
import bricolage700 from '../../assets/fonts/bricolage-latin-700-normal.woff2';
import sometype400 from '../../assets/fonts/sometype-mono-latin-400-normal.woff2';
import sometype500 from '../../assets/fonts/sometype-mono-latin-500-normal.woff2';

/** The interface family, first in `--sans`. */
export const UI_SANS_FAMILY = 'Bricolage Grotesque';
/** The code family, first in `--mono`. */
export const UI_MONO_FAMILY = 'Sometype Mono';

/** One bundled face: its family, weight and package URL. */
export interface UiFontFaceSpec {
  readonly family: string;
  readonly weight: string;
  /** A package asset URL (Vite-emitted) — never remote. */
  readonly url: string;
}

/** Every face this module registers: the weights the design uses (tasks.md 2.3). */
export const UI_FONT_FACES: readonly UiFontFaceSpec[] = [
  { family: UI_SANS_FAMILY, weight: '400', url: bricolage400 },
  { family: UI_SANS_FAMILY, weight: '600', url: bricolage600 },
  { family: UI_SANS_FAMILY, weight: '700', url: bricolage700 },
  { family: UI_MONO_FAMILY, weight: '400', url: sometype400 },
  { family: UI_MONO_FAMILY, weight: '500', url: sometype500 },
];

let registered = false;

/**
 * Register the interface and code faces on `document.fonts` (idempotent — the second call is a
 * no-op). A no-op where the CSS Font Loading API is absent (jsdom, old engines): the stacks then
 * fall through to system faces. A face that fails to load is swallowed — it must never throw into
 * the render path (AGENTS.md #5).
 *
 * Returns a promise that settles when every face has loaded or failed (or `undefined` when
 * nothing was registered), for a caller that wants the faces settled before measuring — the
 * production caller ignores it.
 */
export function registerUiFonts(): Promise<void> | undefined {
  if (registered) return undefined;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) {
    return undefined;
  }
  registered = true;
  const loads: Promise<unknown>[] = [];
  for (const face of UI_FONT_FACES) {
    try {
      const ff = new FontFace(face.family, `url(${face.url}) format('woff2')`, {
        weight: face.weight,
        style: 'normal',
        display: 'swap',
      });
      document.fonts.add(ff);
      loads.push(ff.load().catch(() => undefined));
    } catch {
      /* one face failing to construct is non-fatal; the stack falls back */
    }
  }
  return Promise.all(loads).then(() => undefined);
}

/** Test-only: forget registration so a test can re-probe idempotence. */
export function resetUiFontsForTest(): void {
  registered = false;
}
