import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// THE TRUTH PINS (013 task 1.2; plan D-12, gate-2 note G-1; spec §4 Truth). README.md and
// docs/trust/SECURITY.md may say only what ships, or say "Planned". Every sentence in them has a row
// in the claims ledger (docs/store/claims.md) with its evidence and its status, and the known false
// claims of the pre-M13 text cannot come back. Extended by 1.3 (the site) and 7.2 (PRIVACY,
// THREAT-MODEL, SECURITY final).
//
// Plain-text checks over our own markdown, not a markdown parser: no new dependency, and the shapes
// are ours. The documents are written one sentence per line (a paragraph's lines join when rendered),
// so a sentence is a line, or a line split after ". ", once markdown syntax is stripped.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const SURFACES = { README: 'README.md', SECURITY: 'docs/trust/SECURITY.md' } as const;
type Surface = keyof typeof SURFACES;
const LEDGER = 'docs/store/claims.md';
const STATUSES = ['true now', 'live at release', 'planned', 'withdrawn'] as const;

/** Strip inline markdown: links become "text (url)", code ticks and emphasis go. */
function inline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The document's sentences, outside headings and code fences, each tagged with its section heading. */
function sentences(md: string): Array<{ section: string; text: string }> {
  const out: Array<{ section: string; text: string }> = [];
  let section = '';
  let fenced = false;
  for (const raw of md.split('\n')) {
    if (/^\s*```/.test(raw)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const heading = /^#{1,6}\s+(.*)$/.exec(raw);
    if (heading) {
      section = heading[1].trim();
      continue;
    }
    const line = inline(raw.replace(/^\s*(?:>\s*|[-*]\s+|\d+\.\s+)/, ''));
    if (!line) continue;
    for (const s of line.split(/(?<=\.)\s+(?=[A-Z])/)) out.push({ section, text: s.trim() });
  }
  return out;
}

/** Everything in the document outside code fences, with its section heading. */
function linesWithSection(md: string): Array<{ section: string; text: string }> {
  const out: Array<{ section: string; text: string }> = [];
  let section = '';
  let fenced = false;
  for (const raw of md.split('\n')) {
    if (/^\s*```/.test(raw)) fenced = !fenced;
    const heading = /^#{1,6}\s+(.*)$/.exec(raw);
    if (!fenced && heading) section = heading[1].trim();
    out.push({ section, text: raw });
  }
  return out;
}

type Row = { n: string; surface: string; sentence: string; evidence: string; status: string };

function ledgerRows(): Row[] {
  if (!existsSync(join(ROOT, LEDGER))) return [];
  return read(LEDGER)
    .split('\n')
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => {
      const cells = l.split('|').slice(1, -1).map((c) => c.trim());
      return { n: cells[0], surface: cells[1], sentence: inline(cells[2] ?? ''), evidence: cells[3] ?? '', status: cells[4] ?? '' };
    });
}

const docs = Object.fromEntries(
  (Object.keys(SURFACES) as Surface[]).map((s) => [s, read(SURFACES[s])]),
) as Record<Surface, string>;

const isPlanned = (section: string): boolean => /planned/i.test(section);

describe('the claims ledger (013 task 1.2, D-12)', () => {
  it('exists, and every row has a known status; every "true now" row names evidence that exists', () => {
    const rows = ledgerRows();
    expect(rows.length, `${LEDGER} has ledger rows`).toBeGreaterThan(0);
    const badStatus = rows.filter((r) => !(STATUSES as readonly string[]).includes(r.status)).map((r) => `#${r.n}: ${r.status}`);
    expect(badStatus, 'rows with an unknown status').toEqual([]);
    const noEvidence = rows.filter((r) => r.status !== 'withdrawn' && r.evidence === '').map((r) => `#${r.n}`);
    expect(noEvidence, 'rows with an empty evidence cell').toEqual([]);
    // A backticked path in an evidence cell must exist: an evidence pointer that rots is no evidence.
    const missing = rows.flatMap((r) =>
      [...r.evidence.matchAll(/`([^`]+)`/g)]
        .map((m) => m[1].replace(/:\d+$/, ''))
        .filter((p) => /^[\w.-]+\//.test(p) || /\.(ts|md|yml|json|html)$/.test(p))
        .filter((p) => !existsSync(join(ROOT, p)))
        .map((p) => `#${r.n}: ${p}`),
    );
    expect(missing, 'evidence paths that do not exist').toEqual([]);
  });

  it.each(Object.keys(SURFACES) as Surface[])('every sentence in %s has a ledger row for that surface', (surface) => {
    const rows = ledgerRows().filter((r) => r.surface === surface && r.status !== 'withdrawn');
    const known = new Set(rows.map((r) => r.sentence));
    const unledgered = sentences(docs[surface]).map((s) => s.text).filter((t) => !known.has(t));
    expect(unledgered, `${surface} sentences with no ledger row`).toEqual([]);
  });
});

describe('README and SECURITY.md say only what ships (013 task 1.2)', () => {
  it.each(Object.keys(SURFACES) as Surface[])('%s names no hello@peekover.dev address (G-1: not a working channel)', (surface) => {
    expect(docs[surface]).not.toMatch(/hello@peekover\.dev/i);
  });

  it.each(Object.keys(SURFACES) as Surface[])('%s has no install-shaped link and no store claim while no listing exists', (surface) => {
    const text = docs[surface];
    expect(text, 'a link whose text says Add to / Install').not.toMatch(/\[[^\]]*\b(add to|install)\b[^\]]*\]\(/i);
    expect(text, 'a store URL').not.toMatch(/chromewebstore\.google\.com|chrome\.google\.com\/webstore|addons\.mozilla\.org|microsoftedge\.microsoft\.com\/addons/i);
    expect(text, 'an "available in the store" claim').not.toMatch(/available (in|on|from) (the )?(chrome web store|store|stores|firefox add-ons|amo|edge add-ons)/i);
  });

  it.each(Object.keys(SURFACES) as Surface[])('every peekover.dev URL in %s has a "live at release" ledger row', (surface) => {
    const urls = [...docs[surface].matchAll(/https?:\/\/(?:[\w-]+\.)*peekover\.dev[^\s)>\]]*/gi)].map((m) => m[0].replace(/[.,;]$/, ''));
    const rows = ledgerRows().filter((r) => r.surface === surface && r.status === 'live at release');
    const unmarked = [...new Set(urls)].filter((u) => !rows.some((r) => r.sentence.includes(u)));
    expect(unmarked, `peekover.dev URLs in ${surface} without a "live at release" row`).toEqual([]);
  });

  it.each(Object.keys(SURFACES) as Surface[])(
    '%s presents nothing unbuilt as current: reproducibility, threat model, attestations, signed tags, audits only under "Planned"',
    (surface) => {
      const UNBUILT = /reproducib|threat model|attestation|signed tag|community audit|verified in CI/i;
      const outside = linesWithSection(docs[surface])
        .filter((l) => UNBUILT.test(l.text) && !isPlanned(l.section))
        .map((l) => `[${l.section || 'top'}] ${l.text.trim()}`);
      expect(outside, `unbuilt mechanisms presented outside a "Planned" section of ${surface}`).toEqual([]);
    },
  );

  it.each(Object.keys(SURFACES) as Surface[])('%s carries none of the known false figures', (surface) => {
    const text = docs[surface];
    for (const [what, re] of [
      ['"190+ languages"', /\b190\+?\s*languages\b/i],
      ['KaTeX', /\bKaTeX\b/i],
      ['MathJax', /\bMathJax\b/i],
      ['"30+ themes"', /\b30\+?\s*themes\b/i],
      ['"9 fonts"', /\b(9|nine)\s+(fonts|faces|typefaces)\b/i],
    ] as const) {
      expect(text, `${surface} claims ${what}`).not.toMatch(re);
    }
    // Not built: DOCX / ZIP export, AI features, publishing — allowed only under "Planned".
    const NOT_BUILT = /\bDOCX\b|\bZIP\b|on-device AI|\bBYOK\b|bring[- ]your[- ]own[- ]key|AI (rewrite|features?|assist)|\bpublish(ing)?\b/i;
    const outside = linesWithSection(text)
      .filter((l) => NOT_BUILT.test(l.text) && !isPlanned(l.section))
      .map((l) => `[${l.section || 'top'}] ${l.text.trim()}`);
    expect(outside, `unbuilt features presented outside "Planned" in ${surface}`).toEqual([]);
  });

  it("every line of README's feature list has a ledger row, status true now, with evidence", () => {
    const lines = linesWithSection(docs.README).filter((l) => /^what it does/i.test(l.section) && /^\s*-\s+/.test(l.text));
    expect(lines.length, 'README has a "What it does …" feature list').toBeGreaterThanOrEqual(8);
    const rows = ledgerRows().filter((r) => r.surface === 'README');
    const bad = lines
      .map((l) => inline(l.text.replace(/^\s*-\s+/, '')))
      .flatMap((t) => t.split(/(?<=\.)\s+(?=[A-Z])/))
      .filter((t) => !rows.some((r) => r.sentence === t && r.status === 'true now' && r.evidence !== ''));
    expect(bad, 'feature-list sentences without a "true now" row with evidence').toEqual([]);
  });

  it('README has exactly one "Planned" section', () => {
    const planned = docs.README.split('\n').filter((l) => /^#{1,6}\s+.*planned/i.test(l));
    expect(planned).toHaveLength(1);
  });
});

// ── 013 task 1.3 — the site (site/index.html) joins: the same rules, over HTML ─────────────────
// The site's VISIBLE text is extracted without a parser dependency: tags are tokenized, the
// content of <script>, <style>, <svg> and <head> is skipped (the hero's demo document, `class="demo"`,
// is sample content, not a claim, and is skipped too), every tag boundary is a word break, and a
// block element (headings, paragraphs, list items, divs, buttons …) ends a text block. A link to an
// http(s) URL is written "text (url)", as in the markdown surfaces. The feature explorer's items
// live in the page script (`const F = {…}`) and are rendered at load, so they are visible text too:
// their category names and item strings are extracted from that literal. The ONE planned section is
// the element with id="planned"; text inside it is planned.

const SITE = 'site/index.html';
const site = read(SITE);

type Block = { text: string; planned: boolean; section: string; label: boolean };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…' };
const decode = (t: string): string =>
  t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ''), /^#x/i.test(e) ? 16 : 10)) : ENTITIES[e.toLowerCase()] ?? m,
  );

const SKIP = new Set(['script', 'style', 'svg', 'head', 'title']);
const BLOCK = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'ul', 'ol', 'div', 'section', 'header', 'footer', 'nav', 'table', 'tr', 'td', 'th', 'button', 'main', 'aside']);
const VOID = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'wbr']);

function siteBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const stack: Array<{ tag: string; skip: boolean; planned: boolean; section: string; label: boolean; href?: string }> = [];
  let buf = '';
  const top = () => stack[stack.length - 1];
  const flush = () => {
    const t = decode(buf).replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
    if (t) blocks.push({ text: t, planned: top()?.planned ?? false, section: top()?.section ?? '', label: top()?.label ?? false });
    buf = '';
  };
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<!DOCTYPE[^>]*>/i, '');
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/g)) {
    const [, close, rawTag, attrs, text] = m;
    if (text !== undefined) {
      if (!top()?.skip) buf += text;
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (close) {
      const i = stack.map((s) => s.tag).lastIndexOf(tag);
      if (i < 0) continue;
      const el = stack[i];
      if (!el.skip && el.href) buf += ` (${el.href}) `;
      if (BLOCK.has(tag) && !el.skip) flush();
      stack.length = i;
      buf += ' ';
      continue;
    }
    if (VOID.has(tag)) {
      buf += ' ';
      continue;
    }
    const parent = top();
    const cls = /\bclass="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const id = /\bid="([^"]*)"/.exec(attrs)?.[1];
    const href = /\bhref="(https?:[^"]*)"/.exec(attrs)?.[1];
    // Icon-only elements (a card's glyph, the theme and menu buttons, the search box's glyph) carry no words.
    const skip = (parent?.skip ?? false) || SKIP.has(tag) || /(^|\s)(demo|ic|mode|burger|exsearch)(\s|$)/.test(cls);
    if (BLOCK.has(tag) && !parent?.skip) flush();
    stack.push({
      tag,
      skip,
      planned: (parent?.planned ?? false) || id === 'planned',
      section: (tag === 'section' || tag === 'header' || tag === 'footer' || tag === 'nav') && id ? id : parent?.section ?? '',
      // A label, not a claim: headings, the navigation (top and mobile) and the footer's link lists.
      label: (parent?.label ?? false) || /^h[1-6]$/.test(tag) || tag === 'nav' || tag === 'footer' || /(^|\s)mnav(\s|$)/.test(cls),
      href,
    });
    buf += ' ';
  }
  flush();
  // The explorer's rendered items: the category names and item strings of the page script's `F`.
  const F = /const F\s*=\s*\{([\s\S]*?)\n\};/.exec(html)?.[1] ?? '';
  for (const m of F.matchAll(/"((?:[^"\\]|\\.)*)"\s*:|\["((?:[^"\\]|\\.)*)"/g)) {
    // A category name is a label; an item is a claim.
    blocks.push({ text: decode(m[1] ?? m[2]), planned: false, section: 'everything', label: m[1] !== undefined });
  }
  return blocks;
}

const siteSentences = (): Array<Block> =>
  siteBlocks(site).flatMap((b) => b.text.split(/(?<=\.)\s+(?=[A-Z])/).map((s) => ({ ...b, text: s.trim() })));

describe('the site says only what ships (013 task 1.3, D-12; F-3)', () => {
  it('has no dead link: no href="#", and every in-page anchor names an id that exists', () => {
    expect(site.match(/href="#"/g) ?? [], 'href="#" links').toEqual([]);
    const ids = new Set([...site.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const missing = [...site.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((t) => !ids.has(t));
    expect(missing, 'in-page anchors without a target').toEqual([]);
  });

  it('has no install-shaped link or button and no store claim while no listing exists', () => {
    const text = siteBlocks(site).map((b) => b.text).join('\n');
    expect(text, 'an "Add to …" / "Install" call to action').not.toMatch(/\badd to (chrome|edge|firefox)\b|\binstall (now|free)\b|\bone click from your browser/i);
    expect(site, 'a store URL').not.toMatch(/chromewebstore\.google\.com|chrome\.google\.com\/webstore|addons\.mozilla\.org|microsoftedge\.microsoft\.com\/addons/i);
    expect(text, 'an "available in the store" claim').not.toMatch(/available (in|on|from) (the )?(chrome web store|store|stores|firefox add-ons|amo|edge add-ons)/i);
  });

  it('every sentence of visible site text has a ledger row for the site', () => {
    const rows = ledgerRows().filter((r) => r.surface === 'site' && r.status !== 'withdrawn');
    const known = new Set(rows.map((r) => r.sentence));
    const unledgered = [...new Set(siteSentences().map((s) => s.text))].filter((t) => !known.has(t));
    expect(unledgered, 'site sentences with no ledger row').toEqual([]);
  });

  it('carries none of the known false figures, and unbuilt features appear only in the planned section', () => {
    const outside = siteSentences().filter((s) => !s.planned).map((s) => s.text);
    for (const [what, re] of [
      ['"190+ languages"', /\b190\+?\s*languages\b/i],
      ['KaTeX', /\bKaTeX\b/i],
      ['MathJax', /\bMathJax\b/i],
      ['"30+ themes"', /\b30\+?\s*themes\b/i],
      ['"9 fonts"', /\b(9|nine)\s+(research-picked\s+)?(fonts|faces|typefaces)\b/i],
      ['an unmeasured speed figure', /<\s*150\s*ms|\b150\s*ms\b/i],
      ['the feature/first counts', /\b78 features\b|\b36 (industry )?firsts\b|\bFIRST\b|industry first/],
    ] as const) {
      expect(outside.filter((t) => re.test(t)), `the site claims ${what}`).toEqual([]);
    }
    const NOT_BUILT =
      /\bDOCX\b|\bZIP\b|on-device AI|\bBYOK\b|bring[- ]your[- ]own[- ]key|chat with the document|\bAI (rewrite|features?|assist|web-clip)|\bpublish(ing)?\b|side-by-side|presentation mode|read-aloud|text-to-speech|\bTTS\b|reproducible build|threat model|attestation|signed release|hall[- ]of[- ]fame|\bcoming (soon|to)\b|\bphase 2\b/i;
    const bad = outside.filter((t) => NOT_BUILT.test(t));
    expect(bad, 'unbuilt features presented outside the planned section').toEqual([]);
    expect(site.match(/\bid="planned"/g) ?? [], 'exactly one planned section').toHaveLength(1);
  });

  it('states app-page-only features as such (the 1.2 surface table)', () => {
    // Snapshots, comparison, diagrams, math, code highlighting, export / print / copy of the document,
    // the editor and folder browsing work on the app page only (decisions.md "M13 TASK 1.2", addendum).
    // A sentence naming one must say "app page", or sit in the #editor section, whose label says it.
    // Labels (headings, navigation, category names) are exempt: they name a card, not a surface.
    const APP_ONLY = /\bsnapshot|\bcompar(e|ison)\b|\bdiagram|\bmermaid\b|\bmath\b|\btemml\b|\bhighlight|\bexport|print to PDF|\beditor\b|\bfolder\b/i;
    const unstated = siteSentences()
      .filter((s) => !s.planned && !s.label && s.section !== 'editor' && APP_ONLY.test(s.text) && !/app page/i.test(s.text))
      .map((s) => `[${s.section || 'top'}] ${s.text}`);
    expect(unstated, 'app-page-only features not stated as such').toEqual([]);
  });

  it('names no hello@peekover.dev address, and every peekover.dev / repo URL has a "live at release" row', () => {
    expect(site).not.toMatch(/hello@peekover\.dev/i);
    const urls = [...site.matchAll(/https?:\/\/(?:[\w-]+\.)*(?:peekover\.dev|github\.com\/mosuvo\/peekover)[^\s"'<)]*/gi)].map((m) => m[0]);
    const rows = ledgerRows().filter((r) => r.surface === 'site' && r.status === 'live at release');
    const unmarked = [...new Set(urls)].filter((u) => !rows.some((r) => r.sentence.includes(u)));
    expect(unmarked, 'site URLs without a "live at release" row').toEqual([]);
  });
});
