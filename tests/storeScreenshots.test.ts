import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// M13 task 9.3: the screenshot picks (the reviewer's, under the human's delegation of 2026-11-11), copied into docs/store/assets/ as <store>-<n>-<shot>.png (n is the
// listing order). Each store's rule is from its own page, re-checked 2026-11-07 (decisions.md, "M13 TASK 9.3 —
// captures"): Chrome Web Store 1–5 at 1280×800 or 640×400; Edge Add-ons 0–6 at 1280×800 or 640×480; AMO 1.6:1.
// The PNG's size is read from its IHDR (bytes 16–23), as tests/icons.test.ts does; no image library.

const ROOT = join(import.meta.dirname, '..');
const ASSETS = join(ROOT, 'docs', 'store', 'assets');

const RULES = {
  chrome: { min: 1, max: 5, fits: (w: number, h: number) => (w === 1280 && h === 800) || (w === 640 && h === 400) },
  edge: { min: 0, max: 6, fits: (w: number, h: number) => (w === 1280 && h === 800) || (w === 640 && h === 480) },
  amo: { min: 0, max: Infinity, fits: (w: number, h: number) => w * 10 === h * 16 },
} as const;
type Store = keyof typeof RULES;

function pngSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  expect(b.subarray(1, 4).toString('latin1'), `${file} is not a PNG`).toBe('PNG');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const shots = (store: Store): string[] =>
  readdirSync(ASSETS)
    .filter((f) => new RegExp(`^${store}-\\d+-[a-z0-9-]+\\.png$`).test(f))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));

describe('store screenshots (docs/store/assets/, the picks; not packaged)', () => {
  it('the size rules fire: the 128 × 128 store icon fits no store', () => {
    const { width, height } = pngSize(join(ASSETS, 'cws-icon-128.png'));
    for (const store of Object.keys(RULES) as Store[]) expect(RULES[store].fits(width, height), store).toBe(false);
  });

  it('no PNG in the folder escapes the naming the checks below read', () => {
    const known = /^(chrome|edge|amo)-\d+-[a-z0-9-]+\.png$|^cws-icon-128\.png$|^edge-logo-300\.png$/;
    expect(readdirSync(ASSETS).filter((f) => f.endsWith('.png') && !known.test(f))).toEqual([]);
  });

  it.each(Object.keys(RULES) as Store[])('%s: a count the store takes, numbered 1…n, every size fits', (store) => {
    const files = shots(store);
    const rule = RULES[store];
    expect(files.length, `${store} count`).toBeGreaterThanOrEqual(rule.min);
    expect(files.length, `${store} count`).toBeLessThanOrEqual(rule.max);
    expect(files.map((f) => Number(f.split('-')[1]))).toEqual(files.map((_, i) => i + 1));
    for (const f of files) {
      const { width, height } = pngSize(join(ASSETS, f));
      expect(rule.fits(width, height), `${f} is ${width}×${height}`).toBe(true);
    }
  });
});
