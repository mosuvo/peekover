import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// SOCIAL PREVIEW (pre-launch, 2026-11-17). A link to peekover.dev shared on X, or anywhere else that reads Open Graph,
// shows a card only if the page's STATIC <head> carries the tags: those crawlers run no JavaScript. Both site pages
// must carry every tag below in <head>, exactly once and non-empty; og:url is the page's canonical https URL; every
// image URL is absolute https on peekover.dev and names a file that exists in site/; that file is a PNG whose real
// dimensions are the ones og:image:width / og:image:height state, and it is under 1 MB.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const ORIGIN = 'https://peekover.dev';
const PAGES = [
  { file: 'site/index.html', url: `${ORIGIN}/` },
  { file: 'site/privacy/index.html', url: `${ORIGIN}/privacy/` },
] as const;

const OG = ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt'];
const TWITTER = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'];

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (t: string): string =>
  t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ''), /^#x/i.test(e) ? 16 : 10)) : ENTITIES[e.toLowerCase()] ?? m,
  );

/** Every <meta property|name=… content=…> in the page's <head> (not its body), as key → all its values. */
export function headMeta(html: string): Map<string, string[]> {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '';
  const out = new Map<string, string[]>();
  for (const m of head.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = m[1];
    const key = /\b(?:property|name)\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
    const content = /\bcontent\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
    if (key === undefined || content === undefined) continue;
    out.set(key, [...(out.get(key) ?? []), decode(content)]);
  }
  return out;
}

/** The problems with a page's social tags: missing, duplicated or empty tags, and image URLs that are not absolute. */
export function socialProblems(html: string, canonical: string): string[] {
  const meta = headMeta(html);
  const problems: string[] = [];
  for (const key of [...OG, ...TWITTER]) {
    const v = meta.get(key) ?? [];
    if (v.length !== 1) problems.push(`${key}: ${v.length} tags`);
    else if (!v[0].trim()) problems.push(`${key}: empty`);
  }
  const one = (k: string): string => meta.get(k)?.[0] ?? '';
  if (one('og:type') !== 'website') problems.push(`og:type is "${one('og:type')}"`);
  if (one('og:site_name') !== 'Peekover') problems.push(`og:site_name is "${one('og:site_name')}"`);
  if (one('twitter:card') !== 'summary_large_image') problems.push(`twitter:card is "${one('twitter:card')}"`);
  if (one('og:url') !== canonical) problems.push(`og:url is "${one('og:url')}", not ${canonical}`);
  for (const k of ['og:image', 'twitter:image']) {
    if (!one(k).startsWith(`${ORIGIN}/`)) problems.push(`${k} is not an absolute ${ORIGIN}/ URL: "${one(k)}"`);
  }
  return problems;
}

/** A PNG's width and height, read from its IHDR chunk; null when the bytes are not a PNG. */
export function pngSize(bytes: Buffer): { width: number; height: number } | null {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || SIG.some((b, i) => bytes[i] !== b) || bytes.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('the site carries social preview tags in its static <head> (pre-launch, 2026-11-17)', () => {
  for (const { file, url } of PAGES) {
    it(`${file}: every Open Graph and Twitter tag, once, og:url ${url}, absolute image URLs`, () => {
      expect(socialProblems(read(file), url)).toEqual([]);
    });

    it(`${file}: the image it names exists in site/, is a PNG of the stated size, under 1 MB`, () => {
      const meta = headMeta(read(file));
      const image = meta.get('og:image')?.[0] ?? '';
      expect(meta.get('twitter:image')?.[0], 'twitter:image is og:image').toBe(image);
      const local = join(ROOT, 'site', decodeURI(image.slice(`${ORIGIN}/`.length)));
      expect(existsSync(local), `${image} → ${local} exists`).toBe(true);
      const size = pngSize(readFileSync(local));
      expect(size, `${local} is a PNG`).not.toBeNull();
      expect(size).toEqual({ width: Number(meta.get('og:image:width')?.[0]), height: Number(meta.get('og:image:height')?.[0]) });
      expect(size).toEqual({ width: 1200, height: 630 });
      expect(statSync(local).size, 'under 1 MB').toBeLessThan(1024 * 1024);
    });
  }

  it('the instruments fire: a missing, doubled, body-only or relative tag, a wrong og:url, a non-PNG', () => {
    const tag = (k: string, v: string): string => `<meta ${k.startsWith('og:') ? 'property' : 'name'}="${k}" content="${v}">`;
    const good: Record<string, string> = {
      'og:type': 'website', 'og:site_name': 'Peekover', 'og:title': 'T', 'og:description': 'D', 'og:url': `${ORIGIN}/`,
      'og:image': `${ORIGIN}/og-image.png`, 'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': 'A',
      'twitter:card': 'summary_large_image', 'twitter:title': 'T', 'twitter:description': 'D',
      'twitter:image': `${ORIGIN}/og-image.png`, 'twitter:image:alt': 'A',
    };
    const page = (tags: Record<string, string>, extraHead = '', body = ''): string =>
      `<html><head>${Object.entries(tags).map(([k, v]) => tag(k, v)).join('')}${extraHead}</head><body>${body}</body></html>`;
    expect(socialProblems(page(good), `${ORIGIN}/`)).toEqual([]);

    const noAlt = Object.fromEntries(Object.entries(good).filter(([k]) => k !== 'og:image:alt'));
    expect(socialProblems(page(noAlt), `${ORIGIN}/`)).toEqual(['og:image:alt: 0 tags']);
    expect(socialProblems(page(noAlt, '', tag('og:image:alt', 'A')), `${ORIGIN}/`)).toEqual(['og:image:alt: 0 tags']);
    expect(socialProblems(page(good, tag('og:title', 'U')), `${ORIGIN}/`)).toEqual(['og:title: 2 tags']);
    expect(socialProblems(page({ ...good, 'og:image': '/og-image.png' }), `${ORIGIN}/`)).toEqual([
      'og:image is not an absolute https://peekover.dev/ URL: "/og-image.png"',
    ]);
    expect(socialProblems(page({ ...good, 'twitter:image': 'http://peekover.dev/og-image.png' }), `${ORIGIN}/`)).toHaveLength(1);
    expect(socialProblems(page(good), `${ORIGIN}/privacy/`)).toEqual([`og:url is "${ORIGIN}/", not ${ORIGIN}/privacy/`]);
    expect(socialProblems(page({ ...good, 'twitter:card': 'summary' }), `${ORIGIN}/`)).toEqual(['twitter:card is "summary"']);

    expect(pngSize(readFileSync(join(ROOT, 'site/fonts/literata-var.woff2')))).toBeNull();
    expect(pngSize(readFileSync(join(ROOT, 'docs/store/assets/cws-icon-128.png')))).toEqual({ width: 128, height: 128 });
  });
});
