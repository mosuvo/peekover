import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// THE SIZE GUARD (013 task 9.2, batch 6; HUMAN RULING 2026-11-11). The site says "The whole extension is under 7 MB."
// (ledger row 110: the unpacked build output, 7,000,000 B). This test reads each built engine in `.output` and fails
// once either passes 6,900,000 B, so the sentence is re-worded or the build trimmed before it goes false. It checks
// whatever `.output` holds when the unit suite runs; CI runs the unit suite before it builds, so the release-day gate
// (`docs/store/GO-LIVE.md`, step 0.5) builds both engines first and then runs this file.

const ROOT = process.cwd();
export const SIZE_CLAIM_BYTES = 7_000_000;
export const SIZE_GUARD_BYTES = 6_900_000;
const ENGINES = ['chrome-mv3', 'firefox-mv3'] as const;

/** The total bytes of every file under a folder (what `du -sb` counts for files). */
export function folderBytes(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    total += s.isDirectory() ? folderBytes(p) : s.size;
  }
  return total;
}

/** True when a build of this size must be looked at before the "under 7 MB" sentence goes false. */
export function overGuard(bytes: number): boolean {
  return bytes > SIZE_GUARD_BYTES;
}

describe('the "under 7 MB" sentence has a guard (ledger row 110)', () => {
  it('the guard fires above 6.9 MB and stays quiet at the measured size (the instrument)', () => {
    expect(overGuard(SIZE_GUARD_BYTES + 1)).toBe(true);
    expect(overGuard(SIZE_CLAIM_BYTES)).toBe(true);
    expect(overGuard(6_659_446)).toBe(false); // Chromium, measured 2026-11-11 (9.2)
    expect(SIZE_GUARD_BYTES).toBeLessThan(SIZE_CLAIM_BYTES);
  });

  it('the site still makes the claim this guard protects', () => {
    expect(readFileSync(join(ROOT, 'site/index.html'), 'utf8')).toContain('The whole extension is under 7 MB.');
  });

  for (const engine of ENGINES) {
    const dir = join(ROOT, '.output', engine);
    it.skipIf(!existsSync(dir))(`.output/${engine} is at most 6,900,000 B (skipped when not built)`, () => {
      const bytes = folderBytes(dir);
      expect(
        overGuard(bytes),
        `.output/${engine} is ${bytes.toLocaleString('en-US')} B, above the ${SIZE_GUARD_BYTES.toLocaleString('en-US')} B guard for the site's "The whole ` +
          'extension is under 7 MB." (ledger row 110): trim the build or re-word the sentence before release',
      ).toBe(false);
    });
  }
});
