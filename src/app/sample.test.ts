// The bundled sample (0.1.2, D4; decisions.md, "0.1.2 B3: THE SETUP GUIDE"): the route that asks for it, the file it
// gives, and the app entry's wiring through the store-free seam. Rendering, storage and network: the browser test
// (`tests/browser/sample.browser.test.ts`).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SAMPLE_NAME, SAMPLE_TEXT, sampleFile, wantsSample } from './sample';

const read = (p: string): string => readFileSync(join(process.cwd(), p), 'utf8');

describe('the sample route', () => {
  it('only an app-page address with ?sample asks for it; a bad address never throws', () => {
    expect(wantsSample('chrome-extension://abc/app.html?sample')).toBe(true);
    expect(wantsSample('moz-extension://abc/app.html?x=1&sample=')).toBe(true);
    expect(wantsSample('chrome-extension://abc/app.html')).toBe(false);
    expect(wantsSample('chrome-extension://abc/app.html?samples')).toBe(false);
    expect(wantsSample('chrome-extension://abc/app.html#sample')).toBe(false);
    expect(wantsSample('not a url')).toBe(false);
  });

  it('the file is the bundled text, byte for byte, under its own name', async () => {
    const f = sampleFile();
    expect(f.name).toBe(SAMPLE_NAME);
    expect(await f.read()).toBe(read('src/app/sample.md'));
    expect(SAMPLE_TEXT.startsWith('# A sample file\n')).toBe(true);
  });

  it('the app entry shows it through the store-free seam, and only on the sample route', () => {
    const main = read('entrypoints/app/main.ts');
    expect(main).toMatch(/if \(wantsSample\(location\.href\)\) void app\.selectFile\(sampleFile\(\)\);/);
    // The seam renders a file the shell holds no record of: it must not be the folder route, which stores a folder.
    expect(main).not.toMatch(/openFolder[^\n]*sample/i);
    // The module reads no store and makes no request.
    expect(read('src/app/sample.ts')).not.toMatch(/\bfetch\(|XMLHttpRequest|from '\.\/store'/);
  });
});
