// scripts/normalizeZip.ts — make WXT's zips the same bytes on every build (M13 task 7.3, D-14).
//
// Two clean builds of one commit gave byte-identical unpacked packages but different zips (decisions.md "M13 TASK
// 7.3"). WXT writes each zip with JSZip, which (1) stamps every entry with the time of the build and (2) adds
// entries in the order tinyglobby's crawl returns them, which varies run to run. Nothing else differed: the
// compressed data is JSZip's pure-JS deflate of the same bytes.
//
// `normalizeZip` repacks a zip: entries sorted by name (byte order), every stored date/time set to one constant
// (1980-01-01 00:00, the earliest a zip can hold — so no clock, time zone or SOURCE_DATE_EPOCH is involved), and the
// compressed data copied unchanged (nothing is recompressed, so no zlib version can creep in). Run from WXT's
// `zip:extension:done` and `zip:sources:done` hooks (wxt.config.ts). It accepts only the zip shape JSZip writes here
// — no data descriptors, no zip64, no archive comment — and throws on anything else rather than guess.

/** 1980-01-01 00:00:00 in the zip format's DOS date and time fields. */
export const FIXED_DOS_DATE = (0 << 9) | (1 << 5) | 1;
export const FIXED_DOS_TIME = 0;

interface Entry {
  name: Buffer;
  /** The central-directory record, name/extra/comment included. */
  central: Buffer;
  /** The local header, name/extra included, followed by the compressed data. */
  local: Buffer;
}

export function normalizeZip(buf: Buffer): Buffer {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error('normalizeZip: no end-of-central-directory record');
  if (buf.readUInt16LE(eocd + 20) !== 0) throw new Error('normalizeZip: archive comment not supported');
  const count = buf.readUInt16LE(eocd + 10);
  if (count === 0xffff) throw new Error('normalizeZip: zip64 not supported');
  let at = buf.readUInt32LE(eocd + 16);
  const entries: Entry[] = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error(`normalizeZip: bad central-directory record at ${at}`);
    const flags = buf.readUInt16LE(at + 8);
    if (flags & 0x0008) throw new Error('normalizeZip: data descriptors not supported');
    const compressed = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28);
    const centralLen = 46 + nameLen + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
    const localAt = buf.readUInt32LE(at + 42);
    if (buf.readUInt32LE(localAt) !== 0x04034b50) throw new Error(`normalizeZip: bad local header at ${localAt}`);
    const localLen = 30 + buf.readUInt16LE(localAt + 26) + buf.readUInt16LE(localAt + 28) + compressed;
    entries.push({
      name: Buffer.from(buf.subarray(at + 46, at + 46 + nameLen)),
      central: Buffer.from(buf.subarray(at, at + centralLen)),
      local: Buffer.from(buf.subarray(localAt, localAt + localLen)),
    });
    at += centralLen;
  }
  entries.sort((a, b) => Buffer.compare(a.name, b.name));

  const parts: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    e.local.writeUInt16LE(FIXED_DOS_TIME, 10);
    e.local.writeUInt16LE(FIXED_DOS_DATE, 12);
    e.central.writeUInt16LE(FIXED_DOS_TIME, 12);
    e.central.writeUInt16LE(FIXED_DOS_DATE, 14);
    e.central.writeUInt32LE(offset, 42);
    parts.push(e.local);
    centrals.push(e.central);
    offset += e.local.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.from(buf.subarray(eocd, eocd + 22));
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}
