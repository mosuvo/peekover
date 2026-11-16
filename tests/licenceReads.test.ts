import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync as realRead } from 'node:fs';
import { join, normalize } from 'node:path';

// 0.1.2 B2 (decisions.md, "0.1.2 B2: THE TWO FLAKES"). thirdPartyLicences.test.ts timed out on a cold disk: each
// `entriesFor` opened every shipped file of every package twice (once for the EMBEDDED markers, once for the notice
// scan) plus its source maps, about 31 MB per derivation. This pins the read-once shape: every shipped file is read
// exactly once per derivation. Counted through a wrapped `node:fs`, the module the script itself imports.
const reads = vi.hoisted(() => new Map<string, number>());
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const readFileSync = ((p: Parameters<typeof actual.readFileSync>[0], ...rest: unknown[]) => {
    const key = normalize(String(p));
    reads.set(key, (reads.get(key) ?? 0) + 1);
    return (actual.readFileSync as (...a: unknown[]) => unknown)(p, ...rest);
  }) as typeof actual.readFileSync;
  return { ...actual, default: { ...actual, readFileSync }, readFileSync };
});

const { entriesFor } = await import('../scripts/licenceNotices');
const { inventoryPath } = await import('../scripts/licenceInventory');

const ROOT = process.cwd();
const invFile = inventoryPath(join(ROOT, '.output'), 'chrome');

describe.skipIf(!existsSync(invFile))('licence derivation reads (0.1.2 B2)', () => {
  it('reads each shipped file exactly once per derivation', () => {
    const inv = JSON.parse(realRead(invFile, 'utf8')) as { packages: { dir: string; files: string[] }[] };
    // A shipped `package.json` (mermaid bundles its own) is also read once as the package's metadata: not a repeat scan.
    const shipped = inv.packages.flatMap((p) => p.files.filter((f) => !/(^|\/)package\.json$/.test(f)).map((f) => normalize(join(ROOT, p.dir, f))));
    expect(shipped.length).toBeGreaterThan(500); // firing control: the inventory names the shipped files
    reads.clear();
    entriesFor(ROOT, inv as never);
    const counts = shipped.map((f) => reads.get(f) ?? 0);
    expect(counts.filter((n) => n === 0).length, 'shipped files never read (the wrapper missed them)').toBe(0);
    expect(shipped.filter((_, i) => counts[i] > 1).slice(0, 3), 'shipped files read more than once').toEqual([]);
  });
});
