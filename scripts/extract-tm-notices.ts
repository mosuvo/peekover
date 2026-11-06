// scripts/extract-tm-notices.ts — the upstream licences of the Shiki grammar and theme files Peekover ships (M13 7.2a).
//
// Each `@shikijs/langs` / `@shikijs/themes` file is converted from another project's grammar or theme, under that
// project's licence. Shiki builds them from the `tm-grammars` / `tm-themes` packages, whose NOTICE files carry one
// section per file: `Files:`, `License:` (a URL), `SPDX:` and the full text. This script copies the sections for
// the files the build ships into scripts/licences/shiki/, and writes scripts/licences/shiki-upstream.json.
//
// Usage (the tarballs come from `npm pack tm-grammars@<v> tm-themes@<v>`, the versions Shiki's own lockfile pins):
//   tsx scripts/extract-tm-notices.ts <tm-grammars NOTICE> <tm-themes NOTICE> <tm-grammars version> <tm-themes version>
// It reads the shipped file lists from .output/licence-inventory.chrome.json (a build must have run).
//
// Two grammars have no NOTICE section — YAML and TOML, from textmate/yaml.tmbundle and textmate/toml.tmbundle,
// whose READMEs grant use without a named licence. Their text is TEXTMATE_GRANT below, copied from those READMEs.

import * as fs from 'node:fs';
import * as path from 'node:path';

export const TEXTMATE_GRANT = [
  'If not otherwise specified (see below), files in this repository fall under the following license:',
  '',
  '\tPermission to copy, use, modify, sell and distribute this',
  '\tsoftware is granted. This software is provided "as is" without',
  '\texpress or implied warranty, and with no claim as to its',
  '\tsuitability for any purpose.',
  '',
  // One line, as in the READMEs.
  'An exception is made for files in readable text which contain their own license information, or files where an ' +
    'accompanying file exists (in the same directory) with a “-license” suffix added to the base-name name of the ' +
    'original file, and an extension of txt, html, or similar. For example “tidy” is accompanied by “tidy-license.txt”.',
  '',
].join('\n');

const TEXTMATE_BUNDLES: Record<string, string> = {
  'yaml.json': 'https://github.com/textmate/yaml.tmbundle',
  'toml.json': 'https://github.com/textmate/toml.tmbundle',
};

interface Section {
  url: string;
  spdx: string;
  body: string;
}

function readSections(noticePath: string): Map<string, Section> {
  const text = fs.readFileSync(noticePath, 'utf8').replace(/\r\n/g, '\n');
  const out = new Map<string, Section>();
  // A section opens with a rule of `=`, then Files / License / SPDX, a rule of `-`, then the text up to the next
  // `=` rule that is followed by `Files:` (licence texts contain `=` rules of their own).
  const opener = /\n=+\nFiles:\s+(.+)\nLicense:\s+(.*)\nSPDX:\s+(.*)\n-+\n/g;
  const starts = [...text.matchAll(opener)];
  starts.forEach((m, i) => {
    const bodyStart = (m.index ?? 0) + m[0].length;
    const bodyEnd = i + 1 < starts.length ? (starts[i + 1].index ?? text.length) : text.length;
    for (const f of m[1].split(/,\s*/)) {
      out.set(f.trim(), { url: m[2].trim(), spdx: m[3].trim(), body: text.slice(bodyStart, bodyEnd).replace(/\s+$/, '') + '\n' });
    }
  });
  return out;
}

/** `https://raw.githubusercontent.com/<owner>/<repo>/…` → `<owner>/<repo>` and a file slug `<owner>-<repo>`. */
function repoOf(url: string): { repo: string; slug: string } {
  const m = /githubusercontent\.com\/([^/]+)\/([^/]+)\//.exec(url) ?? /github\.com\/([^/]+)\/([^/#]+)/.exec(url);
  if (!m) throw new Error(`no repository in ${url}`);
  return { repo: `${m[1]}/${m[2]}`, slug: `${m[1]}-${m[2]}`.toLowerCase().replace(/\.tmbundle$/, '') };
}

export interface UpstreamRow {
  /** `@shikijs/langs/dist/css.mjs` */
  file: string;
  /** owner/repo */
  upstream: string;
  spdx: string;
  licenceUrl: string;
  /** relative to scripts/licences/ */
  text: string;
  from: string;
}

function main(): void {
  const [gNotice, tNotice, gVersion, tVersion] = process.argv.slice(2);
  if (!tVersion) throw new Error('usage: extract-tm-notices <grammars NOTICE> <themes NOTICE> <grammars v> <themes v>');
  const inv = JSON.parse(fs.readFileSync('.output/licence-inventory.chrome.json', 'utf8')) as {
    packages: { name: string; files: string[] }[];
  };
  const outDir = path.join('scripts', 'licences', 'shiki');
  fs.mkdirSync(outDir, { recursive: true });
  const rows: UpstreamRow[] = [];
  const sources: [string, Map<string, Section>, string][] = [
    ['@shikijs/langs', readSections(gNotice), `tm-grammars ${gVersion} NOTICE`],
    ['@shikijs/themes', readSections(tNotice), `tm-themes ${tVersion} NOTICE`],
  ];
  for (const [pkg, sections, from] of sources) {
    const files = inv.packages.find((p) => p.name === pkg)?.files ?? [];
    for (const f of files) {
      const json = path.posix.basename(f).replace(/\.mjs$/, '.json');
      const s = sections.get(json);
      if (s) {
        if (!/^(MIT|ISC|BSD-[23]-Clause|Apache-2\.0)$/.test(s.spdx)) throw new Error(`${pkg}/${f}: upstream licence ${s.spdx} is not permissive`);
        const { repo, slug } = repoOf(s.url);
        fs.writeFileSync(path.join(outDir, `${slug}.txt`), s.body);
        rows.push({ file: `${pkg}/${f}`, upstream: repo, spdx: s.spdx, licenceUrl: s.url, text: `shiki/${slug}.txt`, from });
      } else if (TEXTMATE_BUNDLES[json]) {
        const url = TEXTMATE_BUNDLES[json];
        const { repo, slug } = repoOf(url);
        fs.writeFileSync(path.join(outDir, `${slug}.txt`), TEXTMATE_GRANT);
        rows.push({ file: `${pkg}/${f}`, upstream: repo, spdx: 'LicenseRef-TextMate-bundle', licenceUrl: `${url}#license`, text: `shiki/${slug}.txt`, from: `${url} README` });
      } else {
        throw new Error(`${pkg}/${f}: no section in the NOTICE and no known upstream`);
      }
    }
  }
  rows.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join('scripts', 'licences', 'shiki-upstream.json'), JSON.stringify(rows, null, 2) + '\n');
  console.log(`${rows.length} files, ${new Set(rows.map((r) => r.text)).size} licence texts`);
}

main();
