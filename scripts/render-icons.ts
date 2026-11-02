// scripts/render-icons.ts — M13 task 2.6 (plan D-15). Renders the extension icons and the store icon
// assets from the committed SVGs, in the Chromium that Playwright already provides (no new tool).
//
//   pnpm exec tsx scripts/render-icons.ts
//
// Inputs: `assets/icons/icon-{16,32,48,128}.svg` — each is `design/icons.html`'s own drawing for that
// size (the 16 is a different, outline-free mark; 32 / 48 / 128 drop detail as they shrink), never one
// drawing scaled down. Outputs, each a PNG with a transparent background:
//   public/icons/icon-{16,32,48,128}.png      the manifest `icons` and `action.default_icon` (packaged)
//   docs/store/assets/cws-icon-128.png         Chrome Web Store: 128×128, the 128 drawing's artwork fitted
//                                              into 96×96 with 16 px of transparent padding per side
//   docs/store/assets/edge-logo-300.png        Edge: 300×300 (1:1, minimum 128, 300 recommended), the 128
//                                              drawing re-rendered at that size
// (`docs/store/assets/` is not packaged.)
//
// SQUARE CANVASES. The 32 / 48 / 128 drawings are not square (viewBox 60×52: 32×28, 48×42, 128×111), and
// every manifest icon is square. Each is centred on a transparent square of its size at a WHOLE-pixel
// offset (top = floor of half the spare height), so no edge lands between pixels and blurs.
//
// The committed PNGs are the source of truth: a renderer's output can change with its version. This
// script prints each input's SHA-256 and each output's size and SHA-256 so a re-render can be compared.

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Job {
  /** Source SVG under assets/icons/. */
  readonly svg: string;
  /** Output PNG path, repo-relative. */
  readonly out: string;
  /** Square canvas size in px. */
  readonly canvas: number;
  /** The box the artwork is fitted into (centred), in px — the canvas minus any padding. */
  readonly box: number;
}

const JOBS: readonly Job[] = [
  ...[16, 32, 48, 128].map((s) => ({ svg: `icon-${s}.svg`, out: `public/icons/icon-${s}.png`, canvas: s, box: s })),
  { svg: 'icon-128.svg', out: 'docs/store/assets/cws-icon-128.png', canvas: 128, box: 96 },
  { svg: 'icon-128.svg', out: 'docs/store/assets/edge-logo-300.png', canvas: 300, box: 300 },
];

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

/** The SVG's viewBox aspect (width / height). */
function aspectOf(svg: string): { w: number; h: number } {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!vb) throw new Error('an icon SVG without a viewBox');
  return { w: Number(vb[1]), h: Number(vb[2]) };
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const job of JOBS) {
      const source = fs.readFileSync(path.join('assets/icons', job.svg));
      const svg = source.toString('utf8');
      const { w, h } = aspectOf(svg);
      // Fit the artwork into the box, keeping its aspect; whole-pixel size and offsets.
      const scale = Math.min(job.box / w, job.box / h);
      const artW = Math.round(w * scale);
      const artH = Math.round(h * scale);
      const left = Math.floor((job.canvas - artW) / 2);
      const top = Math.floor((job.canvas - artH) / 2);
      const sized = svg.replace(/\swidth="[^"]*"/, ` width="${artW}"`).replace(/\sheight="[^"]*"/, ` height="${artH}"`);
      await page.setViewportSize({ width: job.canvas, height: job.canvas });
      await page.setContent(
        `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}` +
          `svg{position:absolute;left:${left}px;top:${top}px;display:block}</style></head><body>${sized}</body></html>`,
      );
      const png = await page.screenshot({
        omitBackground: true,
        clip: { x: 0, y: 0, width: job.canvas, height: job.canvas },
      });
      fs.mkdirSync(path.dirname(job.out), { recursive: true });
      fs.writeFileSync(job.out, png);
      console.log(
        `${job.out}  ${job.canvas}×${job.canvas}  art ${artW}×${artH} at (${left},${top})  ${png.length} B  ` +
          `sha256 ${sha256(png)}  ← ${job.svg} sha256 ${sha256(source)}`,
      );
    }
  } finally {
    await browser.close();
  }
}

void main();
