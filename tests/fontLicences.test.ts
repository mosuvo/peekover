import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

// THE FONT LICENCES (013 task 2.3; plan §9-2(a) / gate-2 G-6; tasks.md F-8). Every font family the
// package carries ships its SIL OFL 1.1 text in `public/licenses/` (WXT copies `public/` verbatim into
// each build), and the root NOTICE credits it. The OFL requires the licence to travel with the font,
// so a bundled family without its text is a licence breach, not a docs gap.
//
// "Bundled" is read from two places, so neither can drift on its own:
//   1. every font file in `assets/fonts/`, mapped to its family by file name;
//   2. every font file production code imports (`src/`, `entrypoints/`), which must resolve into
//      `assets/fonts/` — a font imported from anywhere else would escape (1).
// A font file whose name maps to no family fails: a new face cannot land without a row here.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const FONT_DIR = 'assets/fonts';
const FONT_EXT = /\.(woff2?|ttf|otf)$/;
const OFL_TITLE = 'SIL OPEN FONT LICENSE Version 1.1';

interface Family {
  readonly name: string;
  /** File-name prefix in `assets/fonts/`. */
  readonly prefix: RegExp;
  /** `public/licenses/<slug>.txt`. */
  readonly slug: string;
  /** The copyright line from the family's upstream METADATA.pb / OFL.txt (google/fonts). */
  readonly copyright: string;
}

const FAMILIES: readonly Family[] = [
  {
    name: 'Literata',
    prefix: /^literata-/,
    slug: 'literata',
    copyright: 'Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata)',
  },
  {
    name: 'STIX Two Math',
    prefix: /^stix-two-math-/,
    slug: 'stix-two-math',
    copyright: 'Copyright 2001-2021 The STIX Fonts Project Authors (https://github.com/stipub/stixfonts)',
  },
  {
    name: 'Bricolage Grotesque',
    prefix: /^bricolage-/,
    slug: 'bricolage-grotesque',
    copyright:
      'Copyright 2022 The Bricolage Grotesque Project Authors (https://github.com/ateliertriay/bricolage)',
  },
  {
    name: 'Sometype Mono',
    prefix: /^sometype-mono-/,
    slug: 'sometype-mono',
    copyright:
      'Copyright 2018 The Sometype Mono Project Authors (https://github.com/googlefonts/sometype-mono)',
  },
];

const familyOf = (file: string): Family | undefined => FAMILIES.find((f) => f.prefix.test(file));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    const p = join(dir, name);
    if (statSync(join(ROOT, p)).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Font files imported by production code, resolved to repo-relative paths. */
function importedFonts(): string[] {
  const sources = [...walk('src'), ...walk('entrypoints')].filter(
    (p) => /\.(ts|tsx|mts)$/.test(p) && !/\.test\.ts$/.test(p),
  );
  const found: string[] = [];
  const spec = /\bfrom\s+['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const file of sources) {
    for (const m of read(file).matchAll(spec)) {
      const target = (m[1] ?? m[2] ?? '').replace(/\?.*$/, '');
      if (!FONT_EXT.test(target)) continue;
      // `relative` writes the host's separator; the checks below compare POSIX paths (Windows wrote `\`).
      found.push(relative(ROOT, resolve(ROOT, dirname(file), target)).split(sep).join('/'));
    }
  }
  return found;
}

/** The families actually bundled: the font files in assets/fonts/, by name. */
function bundledFamilies(): Family[] {
  const files = readdirSync(join(ROOT, FONT_DIR)).filter((f) => FONT_EXT.test(f));
  const fams = new Set<Family>();
  for (const f of files) {
    const fam = familyOf(f);
    if (fam) fams.add(fam);
  }
  return [...fams];
}

describe('font licences ship with the fonts (G-6)', () => {
  it('every font file in assets/fonts/ maps to a known family', () => {
    const files = readdirSync(join(ROOT, FONT_DIR)).filter((f) => FONT_EXT.test(f));
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((f) => !familyOf(f))).toEqual([]);
  });

  it('every font file production code imports lives in assets/fonts/', () => {
    const imported = importedFonts();
    // Today: four Literata faces (fonts.ts) and the STIX subset (mathFont.ts).
    expect(imported.length).toBeGreaterThan(0);
    expect(imported.filter((p) => !p.startsWith(`${FONT_DIR}/`) || !existsSync(join(ROOT, p)))).toEqual(
      [],
    );
  });

  it('every bundled family has public/licenses/<family>.txt with the OFL 1.1 text and its copyright line', () => {
    const problems: string[] = [];
    for (const fam of bundledFamilies()) {
      const path = `public/licenses/${fam.slug}.txt`;
      if (!existsSync(join(ROOT, path))) {
        problems.push(`${fam.name}: ${path} missing`);
        continue;
      }
      const text = read(path);
      if (!text.includes(OFL_TITLE)) problems.push(`${fam.name}: ${path} lacks "${OFL_TITLE}"`);
      if (!text.includes(fam.copyright)) problems.push(`${fam.name}: ${path} lacks its copyright line`);
    }
    expect(problems).toEqual([]);
  });

  it('NOTICE credits every bundled family, its licence and its licence file', () => {
    const notice = existsSync(join(ROOT, 'NOTICE')) ? read('NOTICE') : '';
    const headings = new Set(notice.split('\n'));
    const problems: string[] = [];
    for (const fam of bundledFamilies()) {
      // The family's own heading line: the name alone would also match inside its copyright line.
      if (!headings.has(fam.name)) problems.push(`${fam.name}: no "${fam.name}" heading line in NOTICE`);
      if (!notice.includes(fam.copyright)) problems.push(`${fam.name}: copyright line not in NOTICE`);
      if (!notice.includes(`licenses/${fam.slug}.txt`)) {
        problems.push(`${fam.name}: NOTICE does not point at licenses/${fam.slug}.txt`);
      }
    }
    if (!notice.includes('SIL Open Font License, Version 1.1')) {
      problems.push('NOTICE does not name the SIL Open Font License, Version 1.1');
    }
    expect(problems).toEqual([]);
  });
});

// The site's own font copies (013 task 9.1; D-12; HUMAN RULING 2 after 2.5: the site self-hosts its own variable
// Bricolage). The site is not in the extension package, so its fonts travel with the site: every font file in
// `site/fonts/` maps to a family, that family's OFL text sits beside it as `site/fonts/<slug>.txt`, the provenance is
// in `site/fonts/README.md`, and every @font-face in a site page loads from `site/fonts/` only.
const SITE_FONT_DIR = 'site/fonts';
const SITE_PAGES = ['site/index.html', 'site/privacy/index.html'];

describe("the site's font copies carry their licences (013 task 9.1)", () => {
  it('site/fonts/ holds font files, each mapped to a known family', () => {
    expect(existsSync(join(ROOT, SITE_FONT_DIR)), `${SITE_FONT_DIR}/ exists`).toBe(true);
    const files = readdirSync(join(ROOT, SITE_FONT_DIR)).filter((f) => FONT_EXT.test(f));
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((f) => !familyOf(f))).toEqual([]);
  });

  it('every family in site/fonts/ has its OFL 1.1 text and copyright line beside it, and a README row', () => {
    const files = readdirSync(join(ROOT, SITE_FONT_DIR)).filter((f) => FONT_EXT.test(f));
    const readme = existsSync(join(ROOT, SITE_FONT_DIR, 'README.md')) ? read(`${SITE_FONT_DIR}/README.md`) : '';
    const problems: string[] = [];
    for (const fam of new Set(files.map(familyOf).filter((f): f is Family => !!f))) {
      const path = `${SITE_FONT_DIR}/${fam.slug}.txt`;
      if (!existsSync(join(ROOT, path))) problems.push(`${fam.name}: ${path} missing`);
      else {
        const text = read(path);
        if (!text.includes(OFL_TITLE)) problems.push(`${fam.name}: ${path} lacks "${OFL_TITLE}"`);
        if (!text.includes(fam.copyright)) problems.push(`${fam.name}: ${path} lacks its copyright line`);
      }
    }
    for (const f of files) if (!readme.includes(`\`${f}\``)) problems.push(`${f}: no row in ${SITE_FONT_DIR}/README.md`);
    expect(problems).toEqual([]);
  });

  it("every @font-face src in a site page points into the site's fonts folder, at a file that exists", () => {
    const problems: string[] = [];
    for (const page of SITE_PAGES) {
      if (!existsSync(join(ROOT, page))) {
        problems.push(`${page} missing`);
        continue;
      }
      const faces = [...read(page).matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
      if (faces.length === 0) problems.push(`${page}: no @font-face`);
      for (const face of faces) {
        for (const u of face.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
          const target = resolve(ROOT, dirname(page), u[1]);
          const rel = relative(ROOT, target).split(sep).join('/');
          if (!rel.startsWith(`${SITE_FONT_DIR}/`) || !existsSync(target)) problems.push(`${page}: ${u[1]} → ${rel}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
