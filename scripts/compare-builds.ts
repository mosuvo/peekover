// scripts/compare-builds.ts — are two builds of the same commit the same bytes? (M13 task 7.3, D-14; G-8)
//
// Compares two `.output` directories: every file of both unpacked packages (`chrome-mv3/`, `firefox-mv3/`) by
// SHA-256, every zip as a whole file, and every zip's entries (names, order, contents) — so a difference is named
// where it is: a file, a zip's entry list, or only the zip's container bytes.
//
//   pnpm exec tsx scripts/compare-builds.ts <outA> <outB>   compare two .output directories
//   pnpm exec tsx scripts/compare-builds.ts --twice [--ref R] clone HEAD (or ref R) twice into a temp directory, frozen install,
//                                                           build + zip both engines in each, compare (the CI job)
//   pnpm exec tsx scripts/compare-builds.ts --hashes <out>  print `sha256  path` for every output file (SHA256SUMS form)
//
// Exit 1 on any difference. Pure functions are exported for tests/compareBuilds.test.ts.

import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { inflateRawSync } from 'node:zlib';

/** The unpacked packages compared file by file. */
export const TREES = ['chrome-mv3', 'firefox-mv3'] as const;

const sha256 = (b: Buffer | Uint8Array): string => crypto.createHash('sha256').update(b).digest('hex');

/** Every file under `dir`, POSIX path relative to it → SHA-256, sorted by path (byte order). */
export function digestTree(dir: string): Map<string, string> {
  const out: [string, string][] = [];
  const walk = (d: string, rel: string): void => {
    for (const name of fs.readdirSync(d)) {
      const abs = path.join(d, name);
      const r = rel ? `${rel}/${name}` : name;
      if (fs.statSync(abs).isDirectory()) walk(abs, r);
      else out.push([r, sha256(fs.readFileSync(abs))]);
    }
  };
  walk(dir, '');
  return new Map(out.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export interface ZipEntry {
  name: string;
  sha256: string;
  /** The entry's DOS date/time and external attributes, as stored — what makes equal contents unequal zips. */
  dosTime: number;
  dosDate: number;
  externalAttrs: number;
}

/** A zip's entries in central-directory order, each entry's content inflated and hashed. No zip64 (not needed here). */
export function readZip(buf: Buffer): ZipEntry[] {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error('no end-of-central-directory record');
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error(`bad central-directory entry at ${at}`);
    const method = buf.readUInt16LE(at + 10);
    const dosTime = buf.readUInt16LE(at + 12);
    const dosDate = buf.readUInt16LE(at + 14);
    const size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28);
    const extraLen = buf.readUInt16LE(at + 30);
    const commentLen = buf.readUInt16LE(at + 32);
    const externalAttrs = buf.readUInt32LE(at + 38);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString('utf8', at + 46, at + 46 + nameLen);
    const dataAt = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(dataAt, dataAt + size);
    const content = method === 0 ? data : method === 8 ? inflateRawSync(data) : null;
    if (!content) throw new Error(`${name}: compression method ${method} not supported`);
    entries.push({ name, sha256: sha256(content), dosTime, dosDate, externalAttrs });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** One line per difference between two digests of the same thing. */
export function diffDigests(label: string, a: ReadonlyMap<string, string>, b: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  for (const [p, h] of a) {
    if (!b.has(p)) out.push(`${label}: ${p} only in A`);
    else if (b.get(p) !== h) out.push(`${label}: ${p} differs`);
  }
  for (const p of b.keys()) if (!a.has(p)) out.push(`${label}: ${p} only in B`);
  return out;
}

/** Compare two zips: their entries' contents and order, then their stored metadata, then the container bytes. */
export function diffZips(label: string, a: Buffer, b: Buffer): string[] {
  const ea = readZip(a);
  const eb = readZip(b);
  const out = diffDigests(`${label} (entries)`, new Map(ea.map((e) => [e.name, e.sha256])), new Map(eb.map((e) => [e.name, e.sha256])));
  if (out.length > 0) return out;
  if (ea.map((e) => e.name).join('\n') !== eb.map((e) => e.name).join('\n')) out.push(`${label}: same entries, different order`);
  const meta = (e: ZipEntry): string => `${e.dosDate}/${e.dosTime}/${e.externalAttrs}`;
  const byName = new Map(eb.map((e) => [e.name, e]));
  const metaDiff = ea.filter((e) => meta(e) !== meta(byName.get(e.name)!));
  if (metaDiff.length > 0) out.push(`${label}: ${metaDiff.length} entries differ in stored date/time or attributes (e.g. ${metaDiff[0].name})`);
  if (out.length === 0 && sha256(a) !== sha256(b)) out.push(`${label}: same entries, order and metadata, different container bytes`);
  return out;
}

/** Every difference between two `.output` directories: both unpacked trees, then every zip. */
export function compareOutputs(outA: string, outB: string): string[] {
  const problems: string[] = [];
  for (const t of TREES) {
    const [da, db] = [path.join(outA, t), path.join(outB, t)];
    if (!fs.existsSync(da) || !fs.existsSync(db)) {
      problems.push(`${t}: missing in ${fs.existsSync(da) ? 'B' : 'A'}`);
      continue;
    }
    problems.push(...diffDigests(t, digestTree(da), digestTree(db)));
  }
  const zips = (d: string): string[] => fs.readdirSync(d).filter((f) => f.endsWith('.zip')).sort();
  const [za, zb] = [zips(outA), zips(outB)];
  if (za.join() !== zb.join()) problems.push(`zips: A has [${za.join(', ')}], B has [${zb.join(', ')}]`);
  if (za.length === 0) problems.push('zips: none to compare');
  for (const z of za.filter((x) => zb.includes(x))) {
    problems.push(...diffZips(z, fs.readFileSync(path.join(outA, z)), fs.readFileSync(path.join(outB, z))));
  }
  return problems;
}

/** `sha256  path` for every packaged file and every zip under `.output`, sorted — SHA256SUMS form. */
export function hashLines(outDir: string): string[] {
  const lines: string[] = [];
  for (const t of TREES) {
    const d = path.join(outDir, t);
    if (fs.existsSync(d)) for (const [p, h] of digestTree(d)) lines.push(`${h}  ${t}/${p}`);
  }
  for (const z of fs.readdirSync(outDir).filter((f) => f.endsWith('.zip')).sort()) {
    lines.push(`${sha256(fs.readFileSync(path.join(outDir, z)))}  ${z}`);
  }
  return lines;
}

/**
 * The same commands REPRODUCING.md gives, in a fresh clone (HEAD, or `ref` fetched into it). Returns the clone's
 * `.output`. `withEpoch` sets SOURCE_DATE_EPOCH to the commit time; the two builds differ in it on purpose, so equal
 * output also shows the build reads no clock and no SOURCE_DATE_EPOCH.
 */
function cloneAndBuild(repo: string, into: string, ref: string | null, expected: string, withEpoch: boolean): string {
  const git = (args: string[]): string => execFileSync('git', args, { cwd: into, encoding: 'utf8' }).trim();
  const run = (cmd: string, args: string[], env: NodeJS.ProcessEnv): void => {
    execFileSync(cmd, args, { cwd: into, stdio: 'inherit', shell: process.platform === 'win32', env });
  };
  execFileSync('git', ['clone', '--quiet', '--no-local', repo, into], { stdio: 'inherit' });
  if (ref) {
    git(['fetch', '--quiet', 'origin', ref]);
    git(['checkout', '--quiet', 'FETCH_HEAD']);
  } else if (git(['rev-parse', 'HEAD']) !== expected) {
    git(['checkout', '--quiet', expected]); // the source's HEAD is detached (CI's checkout): the clone carries it
  }
  if (git(['rev-parse', 'HEAD']) !== expected) throw new Error(`${into}: checked out ${git(['rev-parse', 'HEAD'])}, not ${expected}`);
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.SOURCE_DATE_EPOCH;
  if (withEpoch) env.SOURCE_DATE_EPOCH = git(['log', '-1', '--format=%ct']);
  run('pnpm', ['install', '--frozen-lockfile'], env);
  run('pnpm', ['zip'], env);
  run('pnpm', ['zip', '-b', 'firefox'], env);
  console.log(`${into}: ${git(['rev-parse', 'HEAD'])}, SOURCE_DATE_EPOCH ${env.SOURCE_DATE_EPOCH ?? 'unset'}`);
  return path.join(into, '.output');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args[0] === '--hashes') {
    console.log(hashLines(args[1] ?? '.output').join('\n'));
    return;
  }
  let outA: string;
  let outB: string;
  if (args[0] === '--twice') {
    const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'peekover-repro-'));
    const refAt = args.indexOf('--ref');
    const ref = refAt >= 0 ? args[refAt + 1] : null;
    const started = Date.now();
    const expected = execFileSync('git', ['rev-parse', ref ?? 'HEAD'], { encoding: 'utf8' }).trim();
    outA = cloneAndBuild(repo, path.join(tmp, 'a'), ref, expected, false);
    outB = cloneAndBuild(repo, path.join(tmp, 'b'), ref, expected, true);
    console.log(`built twice in ${Math.round((Date.now() - started) / 1000)} s (${tmp})`);
  } else if (args.length === 2) {
    [outA, outB] = args;
  } else {
    throw new Error('usage: compare-builds.ts <outA> <outB> | --twice [--ref R] | --hashes [out]');
  }
  const problems = compareOutputs(outA, outB);
  for (const line of hashLines(outA)) console.log(line);
  if (problems.length > 0) {
    console.error(`\nNOT REPRODUCIBLE — ${problems.length} difference(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log('\nREPRODUCIBLE — every packaged file and every zip is byte-identical.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
