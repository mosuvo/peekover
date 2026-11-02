import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import config from '../wxt.config';

// THE ICON FILES (013 task 2.6; plan D-15). Every icon the manifest declares exists in `public/` (WXT
// copies it into each build) with the pixel size it is declared at, and the store assets exist at the
// sizes the stores require — the Chrome Web Store icon with its 16 px fully transparent border around
// visible artwork (developer.chrome.com/docs/webstore/images: "96x96 for square icons, with 16 px of
// transparent padding per side").
//
// No image library (no new dependency): the PNG is read by hand — the IHDR for the size, and for the
// border check the IDAT stream inflated and unfiltered. Only the format the renderer writes is decoded
// (8-bit RGBA, not interlaced — Chromium's screenshot encoder), and that is asserted first, so a PNG in
// any other format fails loudly instead of being misread.

const ROOT = process.cwd();
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface Png {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
  idat: Buffer;
}

function readPng(path: string): Png {
  const buf = readFileSync(join(ROOT, path));
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`${path} is not a PNG`);
  let off = 8;
  let ihdr: Buffer | undefined;
  const idat: Buffer[] = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  if (!ihdr) throw new Error(`${path} has no IHDR`);
  return {
    width: ihdr.readUInt32BE(0),
    height: ihdr.readUInt32BE(4),
    bitDepth: ihdr[8],
    colorType: ihdr[9],
    interlace: ihdr[12],
    idat: Buffer.concat(idat),
  };
}

/** The alpha channel, row-major, for an 8-bit RGBA non-interlaced PNG (filters 0–4 undone). */
function alphaOf(png: Png): Uint8Array {
  const bpp = 4;
  const stride = png.width * bpp;
  const raw = inflateSync(png.idat);
  const out = new Uint8Array(png.width * png.height);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < png.height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = new Uint8Array(stride);
    for (let i = 0; i < stride; i += 1) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`);
      cur[i] = (line[i] + pred) & 0xff;
    }
    for (let x = 0; x < png.width; x += 1) out[y * png.width + x] = cur[x * bpp + 3];
    prev = cur;
  }
  return out;
}

type ManifestFn = (env: { browser: string }) => Record<string, unknown>;
const manifestFor = (browser: string): Record<string, unknown> => (config.manifest as ManifestFn)({ browser });

/** Every (declared size, path) pair in `icons` and `action.default_icon`. */
function declaredIcons(m: Record<string, unknown>): Array<{ key: string; size: number; path: string }> {
  const out: Array<{ key: string; size: number; path: string }> = [];
  const icons = (m.icons ?? {}) as Record<string, string>;
  const action = ((m.action ?? {}) as Record<string, unknown>).default_icon as Record<string, string> | undefined;
  for (const [s, p] of Object.entries(icons)) out.push({ key: 'icons', size: Number(s), path: p });
  for (const [s, p] of Object.entries(action ?? {})) out.push({ key: 'action.default_icon', size: Number(s), path: p });
  return out;
}

describe.each(['chrome', 'firefox'])('every declared icon file exists at its declared pixel size (%s)', (browser) => {
  const declared = declaredIcons(manifestFor(browser));

  it('declares icons at all', () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  it('each declared PNG is in public/ with an IHDR of exactly size × size, 8-bit RGBA', () => {
    const problems: string[] = [];
    for (const d of declared) {
      const file = `public/${d.path}`;
      if (!existsSync(join(ROOT, file))) {
        problems.push(`${d.key}[${d.size}]: ${file} missing`);
        continue;
      }
      const png = readPng(file);
      if (png.width !== d.size || png.height !== d.size) {
        problems.push(`${d.key}[${d.size}]: ${file} is ${png.width}×${png.height}`);
      }
      if (png.bitDepth !== 8 || png.colorType !== 6) problems.push(`${d.key}[${d.size}]: ${file} is not 8-bit RGBA`);
    }
    expect(problems).toEqual([]);
  });
});

describe('the store icon assets (docs/store/assets/, not packaged)', () => {
  const STORE = [
    { file: 'docs/store/assets/cws-icon-128.png', size: 128, store: 'Chrome Web Store icon' },
    { file: 'docs/store/assets/edge-logo-300.png', size: 300, store: 'Edge logo (1:1, 300 recommended)' },
  ];

  it.each(STORE)('$store: $file exists at $size × $size, 8-bit RGBA', ({ file, size }) => {
    expect(existsSync(join(ROOT, file)), `${file} missing`).toBe(true);
    const png = readPng(file);
    expect(`${png.width}×${png.height}`).toBe(`${size}×${size}`);
    expect([png.bitDepth, png.colorType, png.interlace]).toEqual([8, 6, 0]);
  });

  it('the CWS icon has a fully transparent 16 px border and visible artwork inside it', () => {
    const png = readPng('docs/store/assets/cws-icon-128.png');
    expect([png.bitDepth, png.colorType, png.interlace], 'the decoder reads 8-bit RGBA, non-interlaced only').toEqual([8, 6, 0]);
    const alpha = alphaOf(png);
    let borderOpaque = 0;
    let insideVisible = 0;
    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const inBorder = x < 16 || y < 16 || x >= png.width - 16 || y >= png.height - 16;
        const a = alpha[y * png.width + x];
        if (inBorder && a !== 0) borderOpaque += 1;
        if (!inBorder && a > 0) insideVisible += 1;
      }
    }
    expect(borderOpaque, 'pixels with any alpha inside the 16 px transparent border').toBe(0);
    expect(insideVisible, 'no visible artwork inside the 96 × 96 box').toBeGreaterThan(1000);
  });
});
