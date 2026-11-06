// scripts/licenceInventory.ts — which third-party packages ship, read from the build itself (M13 task 7.2a).
//
// A Vite plugin reads every output chunk's module list (the bundler's own module graph) in every build step WXT
// runs — the entrypoints, the content script, every on-demand grammar / theme chunk — and keeps the modules that
// rendered at least one byte. Each module is attributed to the npm package whose `node_modules/<name>` directory
// holds it (pnpm's real path), or to the bundler for its own runtime helpers. At `build:done` the inventory is
// written to `.output/licence-inventory.<browser>.json` (outside the packaged tree, so it never ships), and
// THIRD_PARTY_LICENSES.txt must equal what scripts/licenceNotices.ts renders from it (`checkFile`): a package that
// ships without its entry, an entry for one that no longer ships, a moved version or a changed licence text fails
// the build. `pnpm licences` (scripts/third-party-licences.ts) regenerates the file.
//
// Pure helpers are exported for tests/thirdPartyLicences.test.ts, which drives these functions, not copies.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { checkFile, type Engine, type Inventory, type ShippedPackage } from './licenceNotices';

export const ENGINES: readonly Engine[] = ['chrome', 'firefox'];

/** The file, as committed (public/ — WXT copies it to the package root) and as shipped. */
export const LICENCE_FILE = 'THIRD_PARTY_LICENSES.txt';
export const LICENCE_SOURCE = `public/${LICENCE_FILE}`;
export const inventoryPath = (outBaseDir: string, engine: Engine): string =>
  path.join(outBaseDir, `licence-inventory.${engine}.json`);

export type { Engine, Inventory, ShippedPackage } from './licenceNotices';

/**
 * The bundler's own runtime modules: code it writes into the output that lives in no file. Each maps to the
 * package that authors it. An id not listed here and not under node_modules or Peekover's own directories is
 * "unattributed" and fails the build.
 */
export const VIRTUAL_OWNERS: readonly { test: RegExp; pkg: string }[] = [
  // Matched after `attribute` drops the bundler's leading U+0000 marker on virtual ids.
  { test: /^vite\/(modulepreload-polyfill|preload-helper)/, pkg: 'vite' },
  { test: /^rolldown\/runtime/, pkg: 'rolldown' },
  // WXT's generated entry wrappers and plugin lists: templates from the wxt package.
  { test: /^virtual:wxt-/, pkg: 'wxt' },
];

/** Peekover's own source: never a third-party entry. */
const OWN_DIRS = ['src/', 'entrypoints/', 'assets/', 'design/', 'public/', '.wxt/'];

const posix = (p: string): string => p.replace(/\\/g, '/');

/** `…/node_modules/@scope/name/dist/x.js?query` → `…/node_modules/@scope/name`, or null outside node_modules. */
export function packageDirOf(id: string): string | null {
  const clean = posix(id).replace(/\?.*$/, '');
  const marker = '/node_modules/';
  const i = clean.lastIndexOf(marker);
  if (i < 0) return null;
  const rest = clean.slice(i + marker.length).split('/');
  const take = rest[0].startsWith('@') ? 2 : 1;
  if (rest.length < take) return null;
  return clean.slice(0, i + marker.length) + rest.slice(0, take).join('/');
}

type Attribution = { kind: 'own' } | { kind: 'package'; dir: string } | { kind: 'virtual'; pkg: string } | { kind: 'unattributed' };

export function attribute(id: string, root: string): Attribution {
  const bare = id.charCodeAt(0) === 0 ? id.slice(1) : id;
  const owner = VIRTUAL_OWNERS.find((v) => v.test.test(bare));
  if (owner) return { kind: 'virtual', pkg: owner.pkg };
  const dir = packageDirOf(id);
  if (dir) return { kind: 'package', dir };
  const clean = posix(id).replace(/\?.*$/, '');
  const rootPosix = posix(root).replace(/\/$/, '') + '/';
  if (clean.toLowerCase().startsWith(rootPosix.toLowerCase())) {
    const rel = clean.slice(rootPosix.length);
    if (OWN_DIRS.some((d) => rel.startsWith(d))) return { kind: 'own' };
  }
  return { kind: 'unattributed' };
}

/** Module ids with their rendered length, as one output chunk reports them. */
export interface ChunkModules {
  modules: Record<string, { renderedLength: number }>;
}

/** Collects across every build step of one `wxt build`. */
export class Collector {
  /** package dir (absolute, POSIX) → rendered bytes */
  readonly dirs = new Map<string, number>();
  /** package dir → its files that shipped (relative) */
  readonly files = new Map<string, Set<string>>();
  readonly virtualPkgs = new Map<string, number>();
  readonly unattributed = new Set<string>();

  constructor(private readonly root: string) {}

  addChunk(chunk: ChunkModules): void {
    for (const [id, info] of Object.entries(chunk.modules)) {
      if (!(info.renderedLength > 0)) continue; // tree-shaken away: nothing of it ships
      const a = attribute(id, this.root);
      if (a.kind === 'package') {
        this.dirs.set(a.dir, (this.dirs.get(a.dir) ?? 0) + info.renderedLength);
        const rel = posix(id).replace(/\?.*$/, '').slice(a.dir.length + 1);
        const set = this.files.get(a.dir) ?? new Set<string>();
        set.add(rel);
        this.files.set(a.dir, set);
      }
      else if (a.kind === 'virtual') this.virtualPkgs.set(a.pkg, (this.virtualPkgs.get(a.pkg) ?? 0) + info.renderedLength);
      else if (a.kind === 'unattributed') this.unattributed.add(posix(id));
    }
  }

  /** Resolve directories to name@version through each package's own package.json. */
  inventory(engine: Engine): Inventory {
    const byKey = new Map<string, ShippedPackage>();
    const add = (dir: string, bytes: number, files: string[]): void => {
      const pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { name: string; version: string };
      const key = `${pj.name}@${pj.version}`;
      const prev = byKey.get(key);
      if (prev) {
        prev.renderedBytes += bytes;
        prev.files = [...new Set([...prev.files, ...files])].sort();
      } else {
        const rel = posix(path.relative(this.root, fs.realpathSync(dir)));
        byKey.set(key, { name: pj.name, version: pj.version, dir: rel, renderedBytes: bytes, files: [...files].sort() });
      }
    };
    for (const [dir, bytes] of this.dirs) add(dir, bytes, [...(this.files.get(dir) ?? [])]);
    for (const [pkg, bytes] of this.virtualPkgs) add(resolvePackageDir(this.root, pkg), bytes, []);
    const packages = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
    return { engine, packages, unattributed: [...this.unattributed].sort() };
  }
}

/**
 * The directory of a package the bundler itself authors (vite, rolldown): resolved from WXT's own install, since
 * neither is a direct dependency of Peekover.
 */
export function resolvePackageDir(root: string, pkg: string): string {
  const pnpmDir = path.join(root, 'node_modules', '.pnpm');
  const hits = fs
    .readdirSync(pnpmDir)
    .filter((d) => d === pkg || d.startsWith(`${pkg.replace('/', '+')}@`))
    .map((d) => path.join(pnpmDir, d, 'node_modules', pkg))
    .filter((d) => fs.existsSync(path.join(d, 'package.json')));
  if (hits.length !== 1) throw new Error(`licence inventory: expected one installed ${pkg}, found ${hits.length}`);
  return hits[0];
}

// ── The plugin and the WXT hooks ─────────────────────────────────────────────────────────────────────────────

let current: Collector | null = null;

/** A Vite plugin that adds every chunk's modules to the current build's collector. */
export function licenceInventoryPlugin(): { name: string; apply: 'build'; generateBundle: (o: unknown, bundle: Record<string, unknown>) => void } {
  return {
    name: 'peekover:licence-inventory',
    apply: 'build',
    generateBundle(_options, bundle) {
      if (!current) return;
      for (const out of Object.values(bundle)) {
        const o = out as { type?: string } & Partial<ChunkModules>;
        if (o.type === 'chunk' && o.modules) current.addChunk(o as ChunkModules);
      }
    },
  };
}

interface WxtLike {
  config: { root: string; outBaseDir: string; browser: string; command: string; mode: string };
}

export function onBuildBefore(wxt: WxtLike): void {
  current = wxt.config.command === 'build' ? new Collector(wxt.config.root) : null;
}

/**
 * Write the inventory and, unless `PEEKOVER_LICENCE_RECORD=1` (the generator's own builds), fail the build when
 * the committed file does not match what shipped.
 */
export function onBuildDone(wxt: WxtLike): void {
  const collector = current;
  current = null;
  if (!collector) return;
  const engine = wxt.config.browser as Engine;
  if (!ENGINES.includes(engine)) throw new Error(`licence inventory: no licence file covers browser "${wxt.config.browser}"`);
  const inv = collector.inventory(engine);
  fs.mkdirSync(wxt.config.outBaseDir, { recursive: true });
  fs.writeFileSync(inventoryPath(wxt.config.outBaseDir, engine), JSON.stringify(inv, null, 2) + '\n');
  if (process.env.PEEKOVER_LICENCE_RECORD === '1') return;
  const file = path.join(wxt.config.root, LICENCE_SOURCE);
  const problems = fs.existsSync(file) ? checkFile(wxt.config.root, inv, fs.readFileSync(file, 'utf8')) : [`${LICENCE_SOURCE} is missing`];
  if (problems.length > 0) {
    throw new Error(
      `${LICENCE_FILE} is stale for the ${engine} build — run \`pnpm licences\`:\n  ` + problems.join('\n  '),
    );
  }
}
