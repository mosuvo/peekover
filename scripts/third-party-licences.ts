// scripts/third-party-licences.ts — regenerate public/THIRD_PARTY_LICENSES.txt from the build itself (M13 7.2a).
//
// `pnpm licences`. Builds both engines with PEEKOVER_LICENCE_RECORD=1 (the inventory is written, the stale-file
// check is skipped), renders each engine's entries (scripts/licenceNotices.ts), merges them — an entry both engines
// ship must render identically in each — and writes the file. A normal `pnpm build` afterwards passes its guard.
// `--no-build` reuses the inventories already in .output/.

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ENGINES, LICENCE_SOURCE, inventoryPath } from './licenceInventory';
import { mergedEntries, renderFile, type Inventory } from './licenceNotices';

const root = process.cwd();

if (!process.argv.includes('--no-build')) {
  for (const engine of ENGINES) {
    execFileSync('pnpm', ['exec', 'wxt', 'build', '-b', engine], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, PEEKOVER_LICENCE_RECORD: '1' },
    });
  }
}

const inventories = ENGINES.map(
  (engine) => JSON.parse(fs.readFileSync(inventoryPath(path.join(root, '.output'), engine), 'utf8')) as Inventory,
);
const entries = mergedEntries(root, inventories);
const text = renderFile(root, entries);
fs.writeFileSync(path.join(root, LICENCE_SOURCE), text);
console.log(`${LICENCE_SOURCE}: ${entries.length} entries, ${Buffer.byteLength(text)} bytes`);
