// The bundled sample (0.1.2, D4; decisions.md, "0.1.2 B3: THE SETUP GUIDE"). The setup guide's "Try it" opens the
// app page with `?sample`; the entry then shows this file through the shell's STORE-FREE seam
// (`AppController.selectFile`): no folder, recent or pin is written, and the text is part of the app page's bundle
// (a `?raw` import), so opening it makes no request. Its sentences are the "sample" surface of the claims ledger.
import type { ReaderFile } from './readerPane';
import SAMPLE_TEXT from './sample.md?raw';

/** The query that asks the app page for the sample. */
export const SAMPLE_QUERY = 'sample';
/** The name the toolbar and status line show. */
export const SAMPLE_NAME = 'sample.md';

/** Whether this app-page address asks for the sample. Never throws. */
export function wantsSample(href: string): boolean {
  try {
    return new URL(href).searchParams.has(SAMPLE_QUERY);
  } catch {
    return false;
  }
}

/** The sample as a reader file: the bundled text, read with no request. */
export function sampleFile(): ReaderFile {
  return { name: SAMPLE_NAME, read: async () => SAMPLE_TEXT };
}

export { SAMPLE_TEXT };
