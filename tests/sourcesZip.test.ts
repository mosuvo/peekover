import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { join } from 'node:path';
import config from '../wxt.config';
import { checkSourcesZip, sourcesZipPath, strayEntries, trackedFiles, zipEntryNames } from '../scripts/check-sources-zip';

// Local files never reach a store or sources zip (post-launch cleanup, 2026-11-15; `docs/ai/decisions.md`, "LOCAL
// FILES AND THE SOURCES ZIP"). Local-only working files live in `.local/` (gitignored); the promo-video tooling once
// lived in `video/`. WXT zips the working directory, so both are named in `zip.excludeSources`, and the built zip is
// checked entry by entry against `git ls-files`. Firing control, run by hand on 2026-11-15 (the decisions entry):
// canaries planted in `.local/`, `video/` and the repository root, then `pnpm zip -b firefox` — the check named the
// root canary only; with `video/**` removed from the list it named the `video/` canary too.

const ROOT = process.cwd();

/** A stored (method 8, deflated) zip holding the given names, built here so the reader is tested on real bytes. */
function zipOf(names: string[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const name of names) {
    const n = Buffer.from(name, 'utf8');
    const data = deflateRawSync(Buffer.from(`content of ${name}`));
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, n, data);
    centrals.push(central, n);
    offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(names.length, 8);
  eocd.writeUInt16LE(names.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

describe('local files stay out of the sources zip', () => {
  it('wxt.config.ts excludes .local/ and video/ from the sources zip', () => {
    const exclude = config.zip?.excludeSources ?? [];
    expect(exclude).toContain('.local/**');
    expect(exclude).toContain('video/**');
  });

  it('.gitignore ignores .local/, and eslint skips .local/ and video/', () => {
    expect(readFileSync(join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/)).toContain('.local/');
    const eslint = readFileSync(join(ROOT, 'eslint.config.mjs'), 'utf8');
    expect(eslint).toContain("'.local/**'");
    expect(eslint).toContain("'video/**'");
  });

  it('the check reads a zip and fires on every untracked file entry (the instrument)', () => {
    const zip = zipOf(['src/', 'src/a.ts', '.local/notes.md', 'video/edit.mjs', 'scratch.ts', '.nvmrc']);
    expect(zipEntryNames(zip)).toEqual(['src/', 'src/a.ts', '.local/notes.md', 'video/edit.mjs', 'scratch.ts', '.nvmrc']);
    const tracked = new Set(['src/a.ts', '.nvmrc']);
    expect(strayEntries(zipEntryNames(zip), tracked)).toEqual(['.local/notes.md', 'video/edit.mjs', 'scratch.ts']);
    expect(strayEntries(['src/', 'src/a.ts'], tracked), 'directory entries are not files').toEqual([]);
  });

  it('trackedFiles reads this repository: it holds the tracked config and not an ignored build file', () => {
    const tracked = trackedFiles(ROOT);
    expect(tracked.has('wxt.config.ts')).toBe(true);
    expect(tracked.has('.nvmrc')).toBe(true);
    expect([...tracked].some((p) => p.startsWith('.output/') || p.startsWith('node_modules/'))).toBe(false);
  });

  const local = sourcesZipPath(ROOT);
  it.skipIf(!existsSync(local))('the local sources zip in .output holds only tracked files', () => {
    expect(checkSourcesZip(local, ROOT), `${local}: untracked entries`).toEqual([]);
  });
});
