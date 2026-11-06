import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { compareOutputs, diffDigests, digestTree, diffZips, readZip, hashLines } from '../scripts/compare-builds';
import { FIXED_DOS_DATE, FIXED_DOS_TIME, normalizeZip } from '../scripts/normalizeZip';

// REPRODUCIBLE BUILDS (M13 task 7.3, D-14). Two clean builds of one commit gave identical packaged files but zips
// that differed in entry order and stored dates (JSZip, inside WXT). scripts/normalizeZip.ts repacks every zip WXT
// writes (wxt.config.ts's zip hooks); scripts/compare-builds.ts compares two builds and is ci.yml's double-build job.
// This file drives both on hand-made zips and trees — the firing control is a one-byte change — and, when a build
// is in .output, checks the real zips are in the repacked form and hold exactly the packaged files.

const crc32 = (buf: Buffer): number => {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

/** A minimal zip writer for fixtures: the shape JSZip writes here (no descriptors, no extras, no comment). */
function makeZip(files: { name: string; data: string; date: number; time: number; deflate?: boolean }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const raw = Buffer.from(f.data);
    const body = f.deflate ? deflateRawSync(raw) : raw;
    const name = Buffer.from(f.name);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(10, 4);
    head.writeUInt16LE(f.deflate ? 8 : 0, 8);
    head.writeUInt16LE(f.time, 10);
    head.writeUInt16LE(f.date, 12);
    head.writeUInt32LE(crc32(raw), 14);
    head.writeUInt32LE(body.length, 18);
    head.writeUInt32LE(raw.length, 22);
    head.writeUInt16LE(name.length, 26);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(10, 6);
    cen.writeUInt16LE(f.deflate ? 8 : 0, 10);
    cen.writeUInt16LE(f.time, 12);
    cen.writeUInt16LE(f.date, 14);
    cen.writeUInt32LE(crc32(raw), 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(raw.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    locals.push(head, name, body);
    centrals.push(cen, name);
    offset += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const A = { name: 'a.txt', data: 'alpha', deflate: true };
const B = { name: 'b/c.js', data: 'console.log(1)' };
const at = (date: number, time: number) => ({ date, time });

describe('normalizeZip — sorted entries, one fixed date, the compressed data unchanged', () => {
  const zip1 = makeZip([{ ...B, ...at(23910, 8654) }, { ...A, ...at(23910, 8655) }]);
  const zip2 = makeZip([{ ...A, ...at(23911, 1000) }, { ...B, ...at(23911, 1001) }]);

  it('the fixture differs the way two builds did: order and dates (firing control)', () => {
    expect(diffZips('z', zip1, zip2)).toEqual([
      'z: same entries, different order',
      'z: 2 entries differ in stored date/time or attributes (e.g. b/c.js)',
    ]);
  });

  it('two such zips normalize to the same bytes; the entries keep their contents', () => {
    const [n1, n2] = [normalizeZip(zip1), normalizeZip(zip2)];
    expect(n1.equals(n2)).toBe(true);
    expect(diffZips('z', n1, n2)).toEqual([]);
    const entries = readZip(n1);
    expect(entries.map((e) => e.name)).toEqual(['a.txt', 'b/c.js']);
    expect(entries.every((e) => e.dosDate === FIXED_DOS_DATE && e.dosTime === FIXED_DOS_TIME)).toBe(true);
    expect(entries.map((e) => e.sha256)).toEqual(readZip(zip1).map((e) => e.sha256).reverse());
  });

  it('is idempotent', () => {
    const n = normalizeZip(zip1);
    expect(normalizeZip(n).equals(n)).toBe(true);
  });

  it('a one-byte change to an entry still shows after normalizing', () => {
    const changed = normalizeZip(makeZip([{ ...A, data: 'alphb', ...at(1, 1) }, { ...B, ...at(1, 1) }]));
    expect(diffZips('z', normalizeZip(zip1), changed)).toEqual(['z (entries): a.txt differs']);
  });

  it('refuses a shape it does not handle, rather than guess', () => {
    const withComment = Buffer.concat([zip1.subarray(0, zip1.length - 2), Buffer.from([1, 0, 0x78])]);
    expect(() => normalizeZip(withComment)).toThrow(/comment/);
  });
});

describe('compareOutputs — two .output directories', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  function output(contentScript: string): string {
    const d = mkdtempSync(join(tmpdir(), 'peekover-cmp-'));
    dirs.push(d);
    for (const t of ['chrome-mv3', 'firefox-mv3']) {
      mkdirSync(join(d, t, 'content-scripts'), { recursive: true });
      writeFileSync(join(d, t, 'manifest.json'), '{}');
      writeFileSync(join(d, t, 'content-scripts', 'peekover.js'), contentScript);
    }
    writeFileSync(join(d, 'peekover-chrome.zip'), normalizeZip(makeZip([{ name: 'manifest.json', data: '{}', ...at(5, 5) }])));
    return d;
  }

  it('identical builds compare clean', () => {
    expect(compareOutputs(output('x=1'), output('x=1'))).toEqual([]);
  });

  it('a one-byte change in one tree is red, naming the file (firing control)', () => {
    expect(compareOutputs(output('x=1'), output('x=2'))).toEqual([
      'chrome-mv3: content-scripts/peekover.js differs',
      'firefox-mv3: content-scripts/peekover.js differs',
    ]);
  });

  it('a file in one build only is red', () => {
    const [a, b] = [output('x=1'), output('x=1')];
    writeFileSync(join(b, 'firefox-mv3', 'extra.js'), '');
    expect(compareOutputs(a, b)).toEqual(['firefox-mv3: extra.js only in B']);
  });

  it('digests sort by path, so a listing never depends on the file system', () => {
    const d = output('x');
    expect([...digestTree(join(d, 'chrome-mv3')).keys()]).toEqual(['content-scripts/peekover.js', 'manifest.json']);
    expect(diffDigests('t', new Map([['a', '1']]), new Map([['a', '1']]))).toEqual([]);
    expect(hashLines(d).at(-1)).toMatch(/^[0-9a-f]{64} {2}peekover-chrome\.zip$/);
  });
});

describe('the real zips in .output (when built) are repacked and hold exactly the packaged files', () => {
  const out = join(process.cwd(), '.output');
  const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
  for (const engine of ['chrome', 'firefox'] as const) {
    const zip = join(out, `peekover-${version}-${engine}.zip`);
    it.skipIf(!existsSync(zip))(`${engine}: sorted, one fixed date, entries == ${engine}-mv3/`, () => {
      const buf = readFileSync(zip);
      const entries = readZip(buf);
      expect(entries.map((e) => e.name)).toEqual([...entries.map((e) => e.name)].sort((x, y) => Buffer.compare(Buffer.from(x), Buffer.from(y))));
      expect(entries.every((e) => e.dosDate === FIXED_DOS_DATE && e.dosTime === FIXED_DOS_TIME)).toBe(true);
      expect(normalizeZip(buf).equals(buf), 'already in normal form').toBe(true);
      const files = new Map(entries.filter((e) => !e.name.endsWith('/')).map((e) => [e.name, e.sha256]));
      expect(diffDigests(engine, digestTree(join(out, `${engine}-mv3`)), files)).toEqual([]);
    });
  }
});
