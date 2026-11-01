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
