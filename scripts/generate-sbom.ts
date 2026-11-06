// scripts/generate-sbom.ts — the software bill of materials: what ships in the packages (spec §6-9; M13 7.3a).
//
// ── WHAT IT LISTS: THE BUILD, NOT THE DEPENDENCY TREE ─────────────────────────────────────────────────────────
//
// Until 013 task 7.3a this walked `pnpm list --prod`, the production dependency TREE. That tree is not what ships:
// it named 87 packages that put no byte in either package (types, tree-shaken d3 modules, Shiki's facade) and missed
// six kinds of code that does — the runtime parts of four devDependencies (wxt, @wxt-dev/browser, vite, rolldown) and
// the 15 packages that @mermaid-js/parser and mermaid PRE-BUNDLED before publishing. Now the components are read from
// the same build-derived inventory THIRD_PARTY_LICENSES.txt is made from (7.2a, scripts/licenceInventory.ts): every
// package with at least one rendered byte in the Chrome or Firefox build, plus the packages those pre-bundled (named
// by their source maps). `mergedEntries` is the one source of both lists, and this script refuses to write an SBOM
// whose components differ from the licences file's packages (`compareWithLicences`).
//
// ── WHY HAND-ROLLED, NOT `@cyclonedx/cyclonedx-npm` ───────────────────────────────────────────────────────────
//
// That tool reads the dependency tree — the wrong source, above. And a devDependency is more transitive supply chain
// in the tree the SBOM is meant to make auditable; this needs no library. Its other input is `pnpm-lock.yaml`: the
// `integrity` hash pnpm verifies, for every component installed from the registry. A pre-bundled package was never
// installed — its bytes are inside its host's tarball — so it carries no hash of its own and names its host instead.
//
// ── DETERMINISM ───────────────────────────────────────────────────────────────────────────────────────────────
//
// The `serialNumber` is a SHA-256 over the component list, not a random UUID, and the timestamp honours
// `SOURCE_DATE_EPOCH`. Same commit, same epoch → the same bytes.
//
// Usage: `pnpm sbom [out.json]` builds both engines (the build's licence guard runs) and writes sbom.cdx.json;
// `--no-build` reuses the inventories already in .output/ (written by any `wxt build`).

import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ENGINES, LICENCE_SOURCE, inventoryPath } from './licenceInventory';
import { ENGINE_LABEL, mergedEntries, parseFile, type FileEntry, type Inventory } from './licenceNotices';

/** One SBOM component: a package with code in a package, from the build. */
export interface ShippedComponent {
  name: string;
  version: string;
  spdx: string;
  engines: string[];
  /** Packages that carry this one pre-bundled (empty when it ships from its own install). */
  bundledInside: string[];
  /** True when the build's module graph saw it (installed and shipped in its own right). */
  inGraph: boolean;
  /** `sha512-…` from pnpm-lock.yaml; absent for a package that was never installed. */
  integrity?: string;
}

export function splitKey(key: string): { name: string; version: string } {
  const at = key.lastIndexOf('@');
  return { name: key.slice(0, at), version: key.slice(at + 1) };
}

/** `pkg:npm/@scope%2Fname@version` — the CycloneDX package URL for an npm component. */
export function purlFor(name: string, version: string): string {
  const encoded = name.startsWith('@') ? `${encodeURIComponent(name.split('/')[0])}%2F${name.split('/')[1]}` : name;
  return `pkg:npm/${encoded}@${version}`;
}

/** The registry tarball pnpm resolved an installed `name@version` from. */
export function tarballFor(name: string, version: string): string {
  const base = name.startsWith('@') ? name.split('/')[1] : name;
  return `https://registry.npmjs.org/${name}/-/${base}-${version}.tgz`;
}

/**
 * `integrity: sha512-…` values out of pnpm-lock.yaml, keyed by `name@version`. A line scan, not a YAML parse: the
 * `packages:` section is a flat map of `name@version:` keys each followed by a `resolution: {integrity: …}` line.
 * Scoped keys are QUOTED in lockfile v9 (`'@types/x@1.0.0':`), plain ones are not.
 */
export function readIntegrity(lockText: string): Map<string, string> {
  const out = new Map<string, string>();
  let currentKey: string | null = null;
  for (const line of lockText.split('\n')) {
    const key = /^ {2}'?(\S+?@[^:']+)'?:\s*$/.exec(line);
    if (key) {
      currentKey = key[1];
      continue;
    }
    const integrity = /integrity:\s*(sha\d+-[A-Za-z0-9+/=]+)/.exec(line);
    if (integrity && currentKey) {
      out.set(currentKey, integrity[1]);
      currentKey = null;
    }
  }
  return out;
}

/** The components, from both engines' merged licence entries and the inventories they came from. */
export function shippedComponents(
  entries: readonly FileEntry[],
  inventories: readonly Inventory[],
  integrity: ReadonlyMap<string, string>,
): ShippedComponent[] {
  const graph = new Set(inventories.flatMap((inv) => inv.packages.map((p) => `${p.name}@${p.version}`)));
  return entries.map((e) => {
    const inside = /^Bundled inside: (.+) \(named by its source maps\)$/m.exec(e.body)?.[1];
    return {
      ...splitKey(e.key),
      spdx: e.spdx,
      engines: e.engines.map((x) => ENGINE_LABEL[x]),
      bundledInside: inside ? inside.split(', ') : [],
      inGraph: graph.has(e.key),
      integrity: integrity.get(e.key),
    };
  });
}

/**
 * Empty when the SBOM's components are exactly THIRD_PARTY_LICENSES.txt's packages; otherwise one line per
 * difference, naming the package. The check this script runs before writing, and tests/sbom.test.ts drives.
 */
export function compareWithLicences(components: readonly { name: string; version: string }[], licencesText: string): string[] {
  const inSbom = new Set(components.map((c) => `${c.name}@${c.version}`));
  const inFile = new Set(parseFile(licencesText).map((e) => e.key));
  const problems: string[] = [];
  for (const k of [...inFile].sort()) if (!inSbom.has(k)) problems.push(`${k} is in ${LICENCE_SOURCE} but not in the SBOM`);
  for (const k of [...inSbom].sort()) if (!inFile.has(k)) problems.push(`${k} is in the SBOM but not in ${LICENCE_SOURCE}`);
  if (inSbom.size !== components.length) problems.push('the SBOM lists a package more than once');
  return problems;
}

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  license?: string;
}

/** The CycloneDX 1.6 document. Pure: the same inputs and epoch give the same bytes. */
export function buildBom(pkg: PackageJson, components: readonly ShippedComponent[], epochSeconds: number | null): object {
  const ref = (c: { name: string; version: string }): string => purlFor(c.name, c.version);
  const sorted = [...components].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
  const cdxComponents = sorted.map((c) => {
    const [alg, b64] = (c.integrity ?? '').split('-');
    const properties = [{ name: 'peekover:ships-in', value: c.engines.join(', ') }];
    if (c.bundledInside.length > 0) properties.push({ name: 'peekover:bundled-inside', value: c.bundledInside.join(', ') });
    return {
      type: 'library' as const,
      'bom-ref': ref(c),
      name: c.name,
      version: c.version,
      purl: ref(c),
      scope: 'required' as const,
      licenses: [c.spdx.startsWith('LicenseRef-') ? { expression: c.spdx } : { license: { id: c.spdx } }],
      ...(c.integrity && alg && b64
        ? { hashes: [{ alg: alg.toUpperCase().replace('SHA', 'SHA-'), content: Buffer.from(b64, 'base64').toString('hex') }] }
        : {}),
      ...(c.integrity ? { externalReferences: [{ type: 'distribution', url: tarballFor(c.name, c.version) }] } : {}),
      properties,
    };
  });

  // The packages ship the components installed in their own right; a pre-bundled one ships inside its host.
  const byKey = new Map(sorted.map((c) => [`${c.name}@${c.version}`, c]));
  const dependencies = [
    { ref: purlFor(pkg.name, pkg.version), dependsOn: sorted.filter((c) => c.inGraph).map(ref) },
    ...sorted.map((host) => ({
      ref: ref(host),
      dependsOn: sorted.filter((c) => c.bundledInside.includes(`${host.name}@${host.version}`)).map(ref),
    })),
  ];
  for (const c of sorted) {
    for (const h of c.bundledInside) if (!byKey.has(h)) throw new Error(`${c.name}@${c.version}: its host ${h} is not a component`);
  }

  const digest = crypto.createHash('sha256').update(JSON.stringify(cdxComponents)).digest('hex');
  const serialNumber = `urn:uuid:${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
  const timestamp = new Date(epochSeconds !== null ? epochSeconds * 1000 : Date.now()).toISOString().replace(/\.\d{3}Z$/, 'Z');

  return {
    $schema: 'http://cyclonedx.org/schema/bom-1.6.schema.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber,
    version: 1,
    metadata: {
      timestamp,
      component: {
        type: 'application',
        'bom-ref': purlFor(pkg.name, pkg.version),
        name: pkg.name,
        version: pkg.version,
        ...(pkg.description ? { description: pkg.description } : {}),
        ...(pkg.license ? { licenses: [{ license: { id: pkg.license } }] } : {}),
      },
      tools: { components: [{ type: 'application', name: 'scripts/generate-sbom.ts', version: pkg.version }] },
      properties: [
        { name: 'peekover:scope', value: 'shipped-code' },
        {
          name: 'peekover:rationale',
          value:
            'Read from the build: every package with code in the Chrome or Firefox package, and the packages those ' +
            'pre-bundled (named by their source maps). The same list as THIRD_PARTY_LICENSES.txt.',
        },
      ],
    },
    components: cdxComponents,
    dependencies,
  };
}

function main(): void {
  const root = process.cwd();
  const args = process.argv.slice(2);
  const outPath = args.find((a) => !a.startsWith('--')) ?? 'sbom.cdx.json';
  if (!args.includes('--no-build')) {
    for (const engine of ENGINES) {
      execFileSync('pnpm', ['exec', 'wxt', 'build', '-b', engine], { stdio: 'inherit', shell: process.platform === 'win32' });
    }
  }
  const inventories = ENGINES.map((engine) => {
    const file = inventoryPath(path.join(root, '.output'), engine);
    if (!fs.existsSync(file)) throw new Error(`${file} is missing — build both engines first, or drop --no-build`);
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Inventory;
  });
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as PackageJson;
  const integrity = readIntegrity(fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'));
  const components = shippedComponents(mergedEntries(root, inventories), inventories, integrity);

  const problems = compareWithLicences(components, fs.readFileSync(path.join(root, LICENCE_SOURCE), 'utf8'));
  if (problems.length > 0) throw new Error(`the SBOM and ${LICENCE_SOURCE} disagree:\n  ${problems.join('\n  ')}`);
  const unhashed = components.filter((c) => c.inGraph && !c.integrity).map((c) => `${c.name}@${c.version}`);
  if (unhashed.length > 0) throw new Error(`installed but no integrity hash in pnpm-lock.yaml: ${unhashed.join(', ')}`);

  const epoch = process.env.SOURCE_DATE_EPOCH;
  const bom = buildBom(pkg, components, epoch ? Number(epoch) : null);
  fs.writeFileSync(outPath, `${JSON.stringify(bom, null, 2)}\n`, 'utf8');
  const bundled = components.filter((c) => !c.inGraph).length;
  console.log(`${outPath} — CycloneDX 1.6, ${components.length} components (${components.length - bundled} from the module graph, ${bundled} pre-bundled); equal to ${LICENCE_SOURCE}.`);
}

// Run only when invoked as a script — tests/sbom.test.ts imports the pure functions, and an import must not build.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
