// scripts/licenceNotices.ts — THIRD_PARTY_LICENSES.txt, rendered from one build's inventory (M13 task 7.2a).
//
// `entriesFor(inventory)` turns what one engine's build shipped into one entry per package: its licence (SPDX),
// where it comes from, its full licence text, and what it carries from elsewhere — packages it pre-bundled (read
// from the source maps of its shipped files), code it copied in (licenceSources.ts's EMBEDDED, checked against the
// shipped files), and for Shiki's grammars and themes each file's upstream project. `renderFile` writes the file;
// `checkFile` is the build's guard: the committed file must equal what this build renders, entry for entry, with
// the other engine's entries taken as the file states them (one build cannot see the other engine's).

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BUNDLED,
  EMBEDDED,
  LICENCE_OVERRIDES,
  MAP_SOURCE_RULES,
  PERMISSIVE,
  PER_FILE_UPSTREAM,
  SHARED_TEXTS,
  SHIKI_UPSTREAM_JSON,
  TEXT_OVERRIDES,
  type SharedText,
} from './licenceSources';

export type Engine = 'chrome' | 'firefox';
export const ENGINE_LABEL: Record<Engine, string> = { chrome: 'Chrome', firefox: 'Firefox' };

export interface ShippedPackage {
  name: string;
  version: string;
  /** POSIX, relative to the repo root. */
  dir: string;
  renderedBytes: number;
  /** Relative to `dir`. */
  files: string[];
}

export interface Inventory {
  engine: Engine;
  packages: ShippedPackage[];
  unattributed: string[];
}

export interface Entry {
  key: string;
  spdx: string;
  /** Every line after `Ships in:`, up to the next rule. */
  body: string;
}

export const LICENCE_DIR = 'scripts/licences';
const RULE = '='.repeat(80);
const THIN = '-'.repeat(80);

export const HEADER = [
  'THIRD-PARTY LICENCES',
  '',
  'Peekover is free software, released under the MIT licence. It is built with open-source code from the projects',
  'listed below, each under its own licence. For each one this file gives its name and version, its licence, where',
  'it comes from, and the full licence text.',
  '',
  'The fonts Peekover includes are not listed here: their licence texts are in the licenses folder of this package,',
  "and Peekover's NOTICE file describes them.",
  '',
  "This file is generated from the build itself (scripts/third-party-licences.ts in Peekover's source code), and a",
  'build fails if it is out of date.',
].join('\n');

const norm = (t: string): string => (t.charCodeAt(0) === 0xfeff ? t.slice(1) : t).replace(/\r\n?/g, '\n').replace(/\s+$/, '') + '\n';
const readText = (root: string, rel: string): string => norm(fs.readFileSync(path.join(root, LICENCE_DIR, rel), 'utf8'));
const npmUrl = (name: string, version: string): string =>
  /^\d+\.\d+\.\d+/.test(version) ? `https://www.npmjs.com/package/${name}/v/${version}` : `https://www.npmjs.com/package/${name}`;
const splitKey = (key: string): { name: string; version: string } => {
  const at = key.lastIndexOf('@');
  return { name: key.slice(0, at), version: key.slice(at + 1) };
};
const sharedRef = (t: SharedText): string =>
  `the ${SHARED_TEXTS[t].title.replace(/ \(.*$/, '')}, under "Shared licence texts" at the end of this file`;

/** The package's own licence file: LICENSE / LICENCE / COPYING / license.txt / LICENSE-MIT.txt, any case. */
export function licenceFileOf(dir: string): string | null {
  const hits = fs.readdirSync(dir).filter((f) => /^(licen[cs]e|copying)(-mit)?(\.(md|txt|markdown))?$/i.test(f));
  return hits.length > 0 ? hits.sort()[0] : null;
}

// ── What a package pre-bundled: its shipped files' source maps ───────────────────────────────────────────────

/** `name@version` of every package a shipped file's source map names, plus anything no rule explains. */
export function bundledVia(root: string, pkg: ShippedPackage): { components: Set<string>; unexplained: Set<string> } {
  const components = new Set<string>();
  const unexplained = new Set<string>();
  const key = `${pkg.name}@${pkg.version}`;
  for (const f of pkg.files) {
    const mapPath = path.join(root, pkg.dir, `${f}.map`);
    if (!fs.existsSync(mapPath)) continue;
    const sources = (JSON.parse(fs.readFileSync(mapPath, 'utf8')) as { sources?: string[] }).sources ?? [];
    for (const s of sources) {
      const rule = MAP_SOURCE_RULES.find((r) => r.in === key && r.test.test(s));
      if (rule) {
        components.add(rule.component);
        continue;
      }
      const m = /node_modules\/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(s);
      const v = m ? /node_modules\/\.pnpm\/((?:@[^+/]+\+)?[^@/]+)@([^_/]+)/.exec(s) : null;
      if (m && v) {
        components.add(`${m[1]}@${v[2]}`);
        continue;
      }
      if (/node_modules\//.test(s) || /^[a-z]+:\/\//.test(s)) unexplained.add(`${key}: ${s}`);
      // Otherwise a relative path into the package's own source tree: its own code.
    }
  }
  components.delete(key);
  return { components, unexplained };
}

// ── Notice comments in shipped files that nothing accounts for ───────────────────────────────────────────────

/** Lines that open a copyright or licence notice inside a block comment. */
export function noticeLines(src: string): { comment: string; line: string }[] {
  const out: { comment: string; line: string }[] = [];
  for (const m of src.matchAll(/\/\*[\s\S]*?\*\//g)) {
    for (const raw of m[0].split('\n')) {
      const line = raw.replace(/^[\s/*!]+/, '').trim();
      if (/^(?:[Cc]opyright|COPYRIGHT(?! HOLDERS))\s*(?:\([cC]\)|©|\d|[A-Z])/.test(line) || /^\([cC]\)\s*\S/.test(line) || /@license\b/.test(line)) {
        out.push({ comment: m[0], line: line.slice(0, 160) });
      }
    }
    // A notice can sit mid-line in a one-line comment (`/*! Bezier … Copyright Gaetan Renaudeau. … */`).
    if (!m[0].includes('\n')) {
      const hit = /(?:[Cc]opyright|\([cC]\))\s+[A-Z][^.*]{2,60}/.exec(m[0]);
      if (hit && !out.some((o) => o.comment === m[0])) out.push({ comment: m[0], line: m[0].slice(0, 160) });
    }
  }
  return out;
}

/** Lower-case words, punctuation dropped: how notice lines and licence texts are compared. */
const words = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The holder a notice line names — its first two significant words — for matching against licence texts. */
export function holderOf(line: string): string {
  const after = line.replace(/^.*?(@license|[Cc]opyright|COPYRIGHT|\([cC]\)|©)/, '');
  return words(after)
    .split(' ')
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !['the', 'and', 'present', 'copyright'].includes(w))
    .slice(0, 2)
    .join(' ');
}

/** A package name's stem as a notice would spell it: no scope, no `-es` / `.js` / `-js` suffix. */
const stem = (name: string): string => name.replace(/^@[^/]+\//, '').replace(/(-es|[-.]js)$/, '').toLowerCase();

// ── Entries ──────────────────────────────────────────────────────────────────────────────────────────────────

interface UpstreamRow {
  file: string;
  upstream: string;
  spdx: string;
  licenceUrl: string;
  text: string;
  from: string;
}

function permissive(key: string, spdx: string): string {
  if (!PERMISSIVE.has(spdx)) throw new Error(`${key}: licence "${spdx}" is not on Peekover's permissive list — stop and ask`);
  return spdx;
}

/** One entry per package the build shipped, and per package those pre-bundled. Throws on anything unexplained. */
export function entriesFor(root: string, inv: Inventory): Entry[] {
  if (inv.unattributed.length > 0) throw new Error(`modules no package accounts for: ${inv.unattributed.join(', ')}`);
  const problems: string[] = [];
  const shiki = JSON.parse(fs.readFileSync(path.join(root, LICENCE_DIR, SHIKI_UPSTREAM_JSON), 'utf8')) as UpstreamRow[];
  const entries = new Map<string, Entry>();
  const bundledInside = new Map<string, Set<string>>();

  for (const p of inv.packages) {
    const key = `${p.name}@${p.version}`;
    const dir = path.join(root, p.dir);
    const pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { license?: string };
    const override = LICENCE_OVERRIDES[key];
    const spdx = permissive(key, override?.spdx ?? pj.license ?? 'UNKNOWN');
    const head: string[] = [`Licence: ${spdx}`, `Source: ${npmUrl(p.name, p.version)}`];
    let text: string;
    const textOverride = TEXT_OVERRIDES[key];
    const own = licenceFileOf(dir);
    if (textOverride?.file) {
      text = readText(root, textOverride.file);
      head.push(`Licence text: from ${textOverride.from}`);
    } else if (textOverride?.cut && own) {
      const full = norm(fs.readFileSync(path.join(dir, own), 'utf8'));
      const at = full.indexOf(`\n${textOverride.cut}\n`);
      if (at < 0) {
        problems.push(`${key}: "${textOverride.cut}" is not a line of its ${own}`);
        continue;
      }
      text = norm(full.slice(0, at));
      head.push(`Licence text: from ${textOverride.from}`);
    } else if (override?.shared && own) {
      text = '';
      head.push(`Licence text: ${sharedRef(override.shared)}.`);
    } else if (own) {
      text = norm(fs.readFileSync(path.join(dir, own), 'utf8'));
      head.push(`Licence text: the package's own ${own} file`);
    } else {
      problems.push(`${key}: no licence file in the package and no TEXT_OVERRIDES row`);
      continue;
    }
    if (override?.note) head.push(`Note: ${override.note}`);

    // Pre-bundled packages, from the source maps.
    const via = bundledVia(root, p);
    for (const u of via.unexplained) problems.push(`source-map path no rule explains — ${u}`);
    if (via.components.size > 0) {
      head.push(`Contains, pre-bundled (named by its source maps; each has its own entry): ${[...via.components].sort().join(', ')}`);
      for (const c of via.components) bundledInside.set(c, (bundledInside.get(c) ?? new Set()).add(key));
    }

    // Code copied in from elsewhere, by its notice comment.
    const sources = p.files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
    const embedded = EMBEDDED.filter((e) => e.in === key);
    for (const e of embedded) {
      if (!sources.some((s) => s.includes(e.marker))) problems.push(`${key}: EMBEDDED "${e.component}" — marker "${e.marker}" is in no shipped file`);
    }
    if (embedded.length > 0) {
      head.push('Contains code from elsewhere (named by notices in its shipped code):');
      for (const e of embedded) {
        head.push(`  - ${e.component} — ${permissive(key, e.spdx)}. ${e.notice.replace(/\.$/, '')}. Licence text: ${sharedRef(e.text)}.`);
      }
    }
    // Every notice comment in the shipped files must be accounted for: an EMBEDDED row's marker, a holder named in
    // the package's own licence text or a pre-bundled package's, or a banner naming the package or one it bundled.
    const knownTexts = words([text, ...[...via.components].map((c) => (BUNDLED[c] ? bundledText(root, c) : ''))].join('\n'));
    const names = [p.name, ...[...via.components].map((c) => splitKey(c).name)].map((n) => words(stem(n))).filter((n) => n.length >= 4);
    const apacheEmbedded = embedded.some((e) => e.spdx === 'Apache-2.0');
    for (const f of p.files) {
      for (const n of noticeLines(fs.readFileSync(path.join(dir, f), 'utf8'))) {
        if (embedded.some((e) => n.comment.includes(e.marker))) continue;
        // The Apache License's own text, carried by code an EMBEDDED row already names under Apache-2.0.
        if (apacheEmbedded && n.comment.includes('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION')) continue;
        const holder = holderOf(n.line);
        if (holder.length >= 4 && knownTexts.includes(holder)) continue;
        if (names.some((name) => words(n.line).includes(name) || words(n.comment).split(' ').slice(0, 12).join(' ').includes(name))) continue;
        problems.push(`${key}: a notice in ${f} that no licence text or EMBEDDED row accounts for: ${n.line}`);
      }
    }

    // Shiki's grammars and themes: each file's upstream.
    let tail = '';
    if (PER_FILE_UPSTREAM.has(p.name)) {
      const rows = p.files.map((f) => {
        const row = shiki.find((r) => r.file === `${p.name}/${f}`);
        if (!row) problems.push(`${p.name}/${f}: no upstream row in ${LICENCE_DIR}/${SHIKI_UPSTREAM_JSON} (run scripts/extract-tm-notices.ts)`);
        return row;
      }).filter((r): r is UpstreamRow => !!r);
      for (const r of rows) permissive(r.file, r.spdx);
      const from = [...new Set(rows.map((r) => r.from))].sort().join('; ');
      head.push(`Files that ship, each converted from another project under that project's licence (from ${from}):`);
      for (const r of rows) head.push(`  - ${r.file.slice(p.name.length + 1)}: ${r.upstream}, ${r.spdx}`);
      const texts = [...new Map(rows.map((r) => [r.text, r])).values()].sort((a, b) => a.upstream.localeCompare(b.upstream));
      for (const r of texts) {
        tail += `\n${THIN.slice(0, 40)}\nUpstream: ${r.upstream} (${r.spdx}) — ${r.licenceUrl}\n\n${readText(root, r.text)}`;
      }
    }
    entries.set(key, { key, spdx, body: text ? `${head.join('\n')}\n${THIN}\n${text}${tail}` : `${head.join('\n')}\n${tail}` });
  }

  for (const [c, hosts] of bundledInside) {
    const inside = `Bundled inside: ${[...hosts].sort().join(', ')} (named by its source maps)`;
    const existing = entries.get(c);
    if (existing) {
      // Also installed and shipped in its own right: one entry, with the pre-bundled copy noted.
      existing.body = existing.body.replace(`\n${THIN}\n`, `\n${inside}\n${THIN}\n`);
      continue;
    }
    const b = BUNDLED[c];
    if (!b) {
      problems.push(`${c}: pre-bundled inside ${[...hosts].join(', ')} but has no BUNDLED row in licenceSources.ts`);
      continue;
    }
    const { name, version } = splitKey(c);
    const head = [`Licence: ${permissive(c, b.spdx)}`, `Source: ${npmUrl(name, version)}`, inside];
    if (b.author) head.push(`Author: ${b.author} (its package.json; its licence file carries no copyright line)`);
    const isShared = b.text in SHARED_TEXTS;
    head.push(isShared ? `Licence text: ${sharedRef(b.text as SharedText)}.` : `Licence text: from ${b.from}`);
    entries.set(c, { key: c, spdx: b.spdx, body: isShared ? head.join('\n') + '\n' : `${head.join('\n')}\n${THIN}\n${bundledText(root, c)}` });
  }
  for (const c of Object.keys(BUNDLED)) if (!bundledInside.has(c)) problems.push(`${c}: a BUNDLED row no shipped source map names (stale)`);

  if (problems.length > 0) throw new Error(`third-party licences:\n  ${problems.join('\n  ')}`);
  return [...entries.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function bundledText(root: string, key: string): string {
  const b = BUNDLED[key];
  return b.text in SHARED_TEXTS ? readText(root, SHARED_TEXTS[b.text as SharedText].file) : readText(root, b.text);
}

// ── The file ─────────────────────────────────────────────────────────────────────────────────────────────────

export interface FileEntry extends Entry {
  engines: Engine[];
}

/**
 * Both engines' entries as one list, each naming the engines that ship it. An entry both engines ship must render
 * identically in each. The one source of the file's entries (`pnpm licences`) and of the SBOM's components
 * (scripts/generate-sbom.ts, 013 task 7.3a).
 */
export function mergedEntries(root: string, inventories: readonly Inventory[]): FileEntry[] {
  const merged = new Map<string, FileEntry>();
  for (const inv of inventories) {
    for (const e of entriesFor(root, inv)) {
      const prev = merged.get(e.key);
      if (!prev) merged.set(e.key, { ...e, engines: [inv.engine] });
      else if (prev.body !== e.body) throw new Error(`${e.key} renders differently for ${prev.engines.join(', ')} and ${inv.engine}`);
      else prev.engines.push(inv.engine);
    }
  }
  return [...merged.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function renderFile(root: string, entries: readonly FileEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.key.localeCompare(b.key));
  const width = Math.max(...sorted.map((e) => e.key.length)) + 2;
  const contents = sorted.map((e) => `  ${e.key.padEnd(width)}${e.spdx}`).join('\n');
  const blocks = sorted.map(
    (e) => `${RULE}\nPackage: ${e.key}\nShips in: ${e.engines.map((x) => ENGINE_LABEL[x]).join(', ')}\n${e.body}`,
  );
  const shared = (Object.keys(SHARED_TEXTS) as SharedText[])
    .map((t) => `${THIN}\n${SHARED_TEXTS[t].title}\n\n${readText(root, SHARED_TEXTS[t].file)}`)
    .join('');
  return `${HEADER}\n\nContents (${sorted.length} entries):\n${contents}\n\n${blocks.join('')}${RULE}\nShared licence texts\n${shared}`;
}

/** The entries the file holds, read back from it. */
export function parseFile(text: string): FileEntry[] {
  const parts = text.replace(/\r\n/g, '\n').split(`${RULE}\n`).slice(1);
  const out: FileEntry[] = [];
  for (const part of parts) {
    const m = /^Package: (\S+)\nShips in: ([^\n]*)\n([\s\S]*)$/.exec(part);
    if (!m) continue;
    const engines = m[2]
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is Engine => s === 'chrome' || s === 'firefox');
    const spdx = /^Licence: (\S+)/.exec(m[3])?.[1] ?? '';
    out.push({ key: m[1], engines, spdx, body: m[3] });
  }
  return out;
}

/**
 * The build's guard. Empty when the committed file is exactly what this engine's build renders (the other engine's
 * entries as the file states them); otherwise one line per difference, naming the package.
 */
export function checkFile(root: string, inv: Inventory, fileText: string): string[] {
  return checkEntries(root, inv.engine, entriesFor(root, inv), fileText);
}

/** {@link checkFile} with this build's entries already rendered. */
export function checkEntries(root: string, engine: Engine, generated: readonly Entry[], fileText: string): string[] {
  const inv = { engine };
  const inFile = parseFile(fileText);
  const fileByKey = new Map(inFile.map((e) => [e.key, e]));
  const problems: string[] = [];
  const merged: FileEntry[] = [];
  const genKeys = new Set(generated.map((g) => g.key));
  for (const g of generated) {
    const f = fileByKey.get(g.key);
    if (!f || !f.engines.includes(inv.engine)) problems.push(`${g.key} ships in the ${inv.engine} build but has no entry for it in the file`);
    else if (f.body !== g.body) problems.push(`${g.key}: its entry differs from what the ${inv.engine} build renders`);
    const others = (f?.engines ?? []).filter((x) => x !== inv.engine);
    merged.push({ ...g, engines: ([inv.engine, ...others] as Engine[]).sort() });
  }
  for (const f of inFile) {
    if (genKeys.has(f.key)) continue;
    if (f.engines.includes(inv.engine)) problems.push(`${f.key} is listed for ${inv.engine} but does not ship in that build`);
    const others = f.engines.filter((x) => x !== inv.engine);
    if (others.length > 0) merged.push({ ...f, engines: others });
  }
  if (problems.length === 0 && renderFile(root, merged) !== fileText.replace(/\r\n/g, '\n')) {
    problems.push('the header, contents list or shared licence texts differ from what the generator writes');
  }
  return problems;
}
