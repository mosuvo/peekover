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
import { entriesFor, renderFile, type Engine, type FileEntry, type Inventory } from './licenceNotices';

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

const merged = new Map<string, FileEntry>();
for (const engine of ENGINES) {
  const inv = JSON.parse(fs.readFileSync(inventoryPath(path.join(root, '.output'), engine), 'utf8')) as Inventory;
  for (const e of entriesFor(root, inv)) {
    const prev = merged.get(e.key);
    if (!prev) merged.set(e.key, { ...e, engines: [engine as Engine] });
    else if (prev.body !== e.body) throw new Error(`${e.key} renders differently for ${prev.engines.join(', ')} and ${engine}`);
    else prev.engines.push(engine);
  }
}

const text = renderFile(root, [...merged.values()]);
fs.writeFileSync(path.join(root, LICENCE_SOURCE), text);
console.log(`${LICENCE_SOURCE}: ${merged.size} entries, ${Buffer.byteLength(text)} bytes`);
