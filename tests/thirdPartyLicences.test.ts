import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { ENGINES, LICENCE_FILE, LICENCE_SOURCE, inventoryPath } from '../scripts/licenceInventory';
import { checkEntries, checkFile, entriesFor, parseFile, renderFile, type Engine, type Inventory } from '../scripts/licenceNotices';
import { PERMISSIVE } from '../scripts/licenceSources';

// THIRD-PARTY LICENCES (M13 task 7.2a). public/THIRD_PARTY_LICENSES.txt ships at the package root of both engines
// and lists every third-party package whose code the build bundled — read from the bundler's module graph by
// scripts/licenceInventory.ts, with packages pre-bundled inside them read from their source maps. The build itself
// fails when the file is stale (`checkFile`, run at WXT's build:done); this file checks the same function against
// the last build's inventory, ablates every entry in turn, and checks the shipped copies in .output and the zips.
//
// CI runs the unit suite BEFORE it builds (ci.yml), so the checks that read .output run when a build is there and
// are skipped otherwise — as tests/manifest.test.ts does. The CI build step runs the guard itself.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');
const RULE = '='.repeat(80) + '\n';
const version = (JSON.parse(read('package.json')) as { version: string }).version;

function inventory(engine: Engine): Inventory | null {
  const p = inventoryPath(join(ROOT, '.output'), engine);
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as Inventory) : null;
}

/** The file with the entry for `key` removed. */
function without(text: string, key: string): string {
  const parts = text.split(RULE);
  const i = parts.findIndex((p) => p.startsWith(`Package: ${key}\n`));
  if (i < 0) throw new Error(`no entry for ${key}`);
  parts.splice(i, 1);
  return parts.join(RULE);
}

/** One file's bytes out of a zip (stored or deflated), read from the central directory. */
function fromZip(zipPath: string, name: string): Buffer | null {
  const z = readFileSync(zipPath);
  let eocd = z.length - 22;
  while (eocd >= 0 && z.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error(`${zipPath}: no end-of-central-directory record`);
  const count = z.readUInt16LE(eocd + 10);
  let at = z.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i += 1) {
    const method = z.readUInt16LE(at + 10);
    const size = z.readUInt32LE(at + 20);
    const nameLen = z.readUInt16LE(at + 28);
    const extraLen = z.readUInt16LE(at + 30);
    const commentLen = z.readUInt16LE(at + 32);
    const local = z.readUInt32LE(at + 42);
    const entry = z.toString('utf8', at + 46, at + 46 + nameLen);
    if (entry === name) {
      const dataAt = local + 30 + z.readUInt16LE(local + 26) + z.readUInt16LE(local + 28);
      const data = z.subarray(dataAt, dataAt + size);
      return method === 0 ? Buffer.from(data) : inflateRawSync(data);
    }
    at += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

describe('the third-party licence file (task 7.2a)', () => {
  const text = read(LICENCE_SOURCE);
  const entries = parseFile(text);

  it('is LF-only, carries no control character but newline and tab, and every licence is permissive', () => {
    expect(text.includes('\r')).toBe(false);
    expect([...text].filter((c) => c < ' ' && c !== '\n' && c !== '\t')).toEqual([]);
    expect(entries.length).toBeGreaterThan(100);
    expect(entries.filter((e) => !PERMISSIVE.has(e.spdx)).map((e) => `${e.key} ${e.spdx}`)).toEqual([]);
  });

  it('is exactly what the generator renders from its own entries (contents list, header and shared texts)', () => {
    expect(renderFile(ROOT, entries)).toBe(text);
  });

  it('NOTICE and README point a reader at it', () => {
    expect(read('NOTICE')).toContain(`${LICENCE_FILE}, which ships at the root of the`);
    expect(read('README.md')).toContain(`[${LICENCE_FILE}](${LICENCE_SOURCE})`);
  });

  it('names no GPL-licensed upstream and no longer lists the aurora-x theme (HUMAN RULING, 7.2a)', () => {
    expect(text).not.toMatch(/\bGPL/);
    expect(text).not.toContain('aurora-x');
  });

  for (const engine of ENGINES) {
    const inv = inventory(engine);
    describe.skipIf(!inv)(`against the last ${engine} build's inventory`, () => {
      it('matches what the build shipped, entry for entry', () => {
        expect(checkFile(ROOT, inv!, text)).toEqual([]);
      });

      it('lists every package of the inventory (module graph) and every package pre-bundled inside one', () => {
        const keys = new Set(entries.filter((e) => e.engines.includes(engine)).map((e) => e.key));
        expect(inv!.packages.map((p) => `${p.name}@${p.version}`).filter((k) => !keys.has(k))).toEqual([]);
        // The source-map half: the parser's chevrotain and the vscode-uri webpack bundle are named.
        for (const k of ['chevrotain@11.1.2', 'vscode-uri@3.1.0', 'js-yaml@4.1.1']) expect(keys.has(k)).toBe(true);
      });

      it('ABLATION: removing any one entry makes the guard red, naming that package', () => {
        const generated = entriesFor(ROOT, inv!);
        const silent: string[] = [];
        for (const e of entries.filter((x) => x.engines.includes(engine))) {
          const problems = checkEntries(ROOT, engine, generated, without(text, e.key));
          if (!problems.some((p) => p.startsWith(`${e.key} ships in the ${engine} build`))) silent.push(`${e.key}: ${problems.join(' | ')}`);
        }
        expect(silent).toEqual([]);
      });

      it('ABLATION: a changed licence text or version is red, naming the package', () => {
        const edited = text.replace('Copyright (c) 2016-2026, The Cytoscape Consortium.', 'Copyright (c) 2016, Someone.');
        expect(edited).not.toBe(text);
        expect(checkFile(ROOT, inv!, edited)).toContain(`cytoscape@3.34.0: its entry differs from what the ${engine} build renders`);
        const moved = text.replace('Package: diff@9.0.0\n', 'Package: diff@9.0.1\n');
        expect(checkFile(ROOT, inv!, moved)).toEqual(
          expect.arrayContaining([
            `diff@9.0.0 ships in the ${engine} build but has no entry for it in the file`,
            `diff@9.0.1 is listed for ${engine} but does not ship in that build`,
          ]),
        );
      });

      const shipped = join(ROOT, '.output', `${engine}-mv3`, LICENCE_FILE);
      it('ships at the root of the built package, byte-identical to public/', () => {
        expect(existsSync(shipped)).toBe(true);
        expect(readFileSync(shipped, 'utf8')).toBe(text);
      });

      const zip = join(ROOT, '.output', `peekover-${version}-${engine}.zip`);
      it.skipIf(!existsSync(zip))(`is in peekover-${version}-${engine}.zip, byte-identical`, () => {
        expect(fromZip(zip, LICENCE_FILE)?.toString('utf8')).toBe(text);
      });
    });
  }
});
