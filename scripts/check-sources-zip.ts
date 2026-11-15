#!/usr/bin/env tsx
// The Firefox sources zip holds only files git tracks (post-launch cleanup, 2026-11-15; `docs/ai/decisions.md`,
// "LOCAL FILES AND THE SOURCES ZIP"). WXT zips the working directory, not the git tree: anything untracked that is not a
// dotfile and not in `zip.excludeSources` goes in. A local zip built on 2026-11-14 carried an untracked scratch script
// (`scripts/_scratch-shots-fx.ts`); the released zip, built from a clean clone, did not. This check reads a sources zip's
// entry names and fails on any file entry git does not track.
//
//   tsx scripts/check-sources-zip.ts                 .output/peekover-<package.json version>-sources.zip, this repo
//   tsx scripts/check-sources-zip.ts <zip> [repo]    that zip, against that repository's tracked files
//
// `scripts/compare-builds.ts` runs it on each clean-clone build (CI's reproducible job and the release workflow).

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/** A zip's entry names, in central-directory order (directory entries end in `/`). No zip64 (not needed here). */
export function zipEntryNames(buf: Buffer): string[] {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error('no end-of-central-directory record');
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error(`bad central-directory entry at ${at}`);
    const nameLen = buf.readUInt16LE(at + 28);
    names.push(buf.toString('utf8', at + 46, at + 46 + nameLen));
    at += 46 + nameLen + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
  }
  return names;
}

/** Every file entry that is not a tracked path. Directory entries are skipped: git tracks files only. */
export function strayEntries(entries: readonly string[], tracked: ReadonlySet<string>): string[] {
  return entries.filter((e) => !e.endsWith('/') && !tracked.has(e));
}

/** The files git tracks in `repo` (`git ls-files`), as forward-slash paths. */
export function trackedFiles(repo: string): Set<string> {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return new Set(out.split('\0').filter(Boolean));
}

/** `<outDir>/peekover-<version>-sources.zip`, the version read from `repo`'s package.json. */
export function sourcesZipPath(repo: string, outDir = path.join(repo, '.output')): string {
  const { version } = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')) as { version: string };
  return path.join(outDir, `peekover-${version}-sources.zip`);
}

/** The stray entries of a sources zip against a repository's tracked files. */
export function checkSourcesZip(zip: string, repo: string): string[] {
  return strayEntries(zipEntryNames(fs.readFileSync(zip)), trackedFiles(repo));
}

function main(): void {
  const [zipArg, repoArg] = process.argv.slice(2);
  const repo = path.resolve(repoArg ?? process.cwd());
  const zip = zipArg ? path.resolve(zipArg) : sourcesZipPath(repo);
  const stray = checkSourcesZip(zip, repo);
  if (stray.length > 0) {
    console.error(`${zip}: ${stray.length} file(s) git does not track:\n  ${stray.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`${zip}: every file entry is tracked.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
