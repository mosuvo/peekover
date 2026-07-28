// scripts/generate-sbom.ts — the "SBOM published per release" half of spec §6-9.
//
// §6-9 promises "Locked, minimal dependencies; `npm audit` + OSV scanning in CI; no install
// scripts; Dependabot; SBOM published per release." The spec-coverage audit found four of
// those five unbuilt. This file is the SBOM one; the other three are in
// `.github/workflows/supply-chain.yml` and `.github/dependabot.yml`.
//
// ── WHY THIS IS HAND-ROLLED AND NOT `@cyclonedx/cyclonedx-npm` ────────────────────────────
//
// Adding a dependency to satisfy a MINIMAL-DEPENDENCIES claim is close to self-defeating, and
// in this repo a `dependencies` addition is a governed act (the `diff` package needed a plan
// gate — decisions.md 2026-07-23). A devDependency is cheaper than that but not free: it is
// more transitive supply chain in the tree the SBOM is meant to make auditable, and this
// generator needs no library. Everything it emits comes from three sources pnpm already has:
//   • `pnpm list --prod --depth Infinity --json`  → the runtime tree + resolved tarball URLs
//   • `pnpm licenses list --prod --json`          → SPDX license per package
//   • `pnpm-lock.yaml`                            → the `integrity` hash pnpm itself verifies
// If the format outgrows this (VEX documents, full provenance attestations), revisit — the
// decision is recorded in decisions.md with that trigger.
//
// ── PRODUCTION TREE ONLY, AND WHY THAT IS THE HONEST SCOPE ────────────────────────────────
//
// `--prod` throughout. An SBOM describes what SHIPS, and devDependencies (wxt, vitest,
// playwright, eslint) are not in the signed package — no user ever executes them. Including
// them would inflate a 12-package bill of materials into a ~700-package one and bury the four
// libraries that actually reach a user's browser. The dev tree is not unexamined, though: the
// audit workflow scans it separately and reports (see supply-chain.yml on why that half is
// advisory rather than blocking).
//
// ── DETERMINISM ───────────────────────────────────────────────────────────────────────────
//
// §6-10 wants reproducible builds, so this SBOM is reproducible too: the `serialNumber` is
// derived from a SHA-256 over the component list rather than a random UUID, and the timestamp
// honours `SOURCE_DATE_EPOCH` when set. Same inputs → byte-identical output, so a release
// SBOM can be re-derived and compared by anyone.

import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT_PATH = process.argv[2] ?? 'sbom.cdx.json';

/** Shape of the `pnpm list --json` node we consume (only the fields we use). */
export interface PnpmNode {
  from?: string;
  version?: string;
  resolved?: string;
  dependencies?: Record<string, PnpmNode>;
}

export interface Component {
  name: string;
  version: string;
  license?: string;
  resolved?: string;
  integrity?: string;
  deps: Set<string>;
}

/** `pnpm` is `pnpm.cmd` on Windows; execFileSync needs the shell there to resolve it. */
function pnpm(args: string[]): string {
  return execFileSync('pnpm', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
}

/** `pkg:npm/@scope%2Fname@version` — the CycloneDX package URL for an npm component. */
function purlFor(name: string, version: string): string {
  const encoded = name.startsWith('@')
    ? `${encodeURIComponent(name.split('/')[0])}%2F${name.split('/')[1]}`
    : name;
  return `pkg:npm/${encoded}@${version}`;
}

/**
 * Parse `integrity: sha512-…` values out of pnpm-lock.yaml, keyed by `name@version`. A light
 * line scan rather than a YAML parse: the lockfile's `packages:` section is a flat map of
 * `name@version:` keys each followed by a `resolution: {integrity: …}` line, and depending on
 * a YAML library to read two fields would be exactly the dependency this file avoids.
 */
function readIntegrity(lockPath: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!fs.existsSync(lockPath)) return out;
  const lines = fs.readFileSync(lockPath, 'utf8').split('\n');
  let currentKey: string | null = null;
  for (const line of lines) {
    // Scoped keys are QUOTED in pnpm-lock v9 (`'@types/trusted-types@2.0.7':`) while plain
    // ones are not (`diff@9.0.0:`). Missing the quoted form silently drops every scoped
    // package's hash — caught by the generator's own "no integrity hash" report.
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

/**
 * Flatten pnpm's nested tree into one component per `name@version`, recording edges.
 *
 * ── WHY DEDUP AND DESCENT ARE TWO SETS, NOT ONE ───────────────────────────────────────────
 *
 * This walk used to do both jobs with one gate: `if (!acc.has(id))` created the component AND
 * recursed, so a package was walked only on FIRST SIGHT. That is wrong, because `pnpm list
 * --json` does not emit a repeated package identically at every position. It emits the package
 * SHALLOW (no `dependencies` key at all) at its first occurrence in traversal order and FULL at
 * exactly one later occurrence. First sight is therefore precisely the occurrence that carries
 * NO children, so the memo hit at the full occurrence skipped the whole subtree.
 *
 * Measured on this repo's tree at the time of the fix: `d3@7.9.0` appears first under
 * `dagre-d3-es@7.0.14` with 0 children, then under `mermaid@11.16.0` with 30; `d3-dsv@3.0.1`
 * appears first under `d3-fetch@3.0.1` with 0 children, then under `d3@7.9.0` with 3
 * (`commander`, `iconv-lite`, `rw` — and `safer-buffer` one level below `iconv-lite`). The
 * generator reported 90 components against a real production tree of 120 `name@version` / 113
 * distinct names — 30 dropped, silently.
 *
 * This is a LATENT defect, not a mermaid regression: the pre-M7 four-dependency tree had no
 * diamond deep enough to produce a shallow-first/full-later pair, so it never fired.
 *
 * The fix separates the two concerns the old gate conflated:
 *   • DEDUP  — `acc` keyed by `name@version`, so each component is emitted exactly once.
 *   • DESCENT — `expanded`, so we walk into any node that actually CARRIES children, whether or
 *     not we have already emitted that component from an earlier shallow sighting.
 *
 * TERMINATION. Two independent reasons, both verified against real `pnpm list` output rather
 * than assumed. (1) The input is a `JSON.parse` result — a finite tree with no shared or
 * circular references — so an ungated walk already halts; on this tree it visits 177 node
 * occurrences. (2) `expanded` admits each id at most once, bounding the recursion at one
 * expansion per distinct package regardless of tree shape. The `.length > 0` test matters:
 * marking an id expanded on a childless sighting would reintroduce the very bug being fixed.
 * Checked on the real tree: no package is ever emitted with children more than once, and no
 * node carries a present-but-empty `dependencies` object.
 *
 * Exported for `tests/sbomWalk.test.ts`, which drives THIS function rather than a copy — a
 * regression test against a re-implementation proves nothing (decisions.md §6 side-quest (c)).
 */
export function collect(
  nodes: Record<string, PnpmNode> | undefined,
  acc: Map<string, Component>,
  parent: Component | null,
  expanded: Set<string> = new Set(),
): void {
  for (const [name, node] of Object.entries(nodes ?? {})) {
    if (!node.version) continue;
    const id = `${name}@${node.version}`;
    let component = acc.get(id);
    if (!component) {
      component = { name, version: node.version, resolved: node.resolved, deps: new Set() };
      acc.set(id, component);
    }
    if (Object.keys(node.dependencies ?? {}).length > 0 && !expanded.has(id)) {
      expanded.add(id);
      collect(node.dependencies, acc, component, expanded);
    }
    parent?.deps.add(id);
  }
}

function main(): void {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
    name: string;
    version: string;
    description?: string;
    license?: string;
  };

  // 1. The runtime tree.
  const listed = JSON.parse(pnpm(['list', '--prod', '--depth', 'Infinity', '--json'])) as Array<{
    dependencies?: Record<string, PnpmNode>;
  }>;
  const components = new Map<string, Component>();
  const rootEdges = new Set<string>();
  const rootStub: Component = { name: pkg.name, version: pkg.version, deps: rootEdges };
  // One `expanded` set across every importer: the component map is shared already, so sharing
  // the descent ledger too just avoids re-walking a package two importers both depend on.
  const expanded = new Set<string>();
  for (const importer of listed) collect(importer.dependencies, components, rootStub, expanded);

  // 2. Licenses, keyed by name@version.
  const licenseGroups = JSON.parse(pnpm(['licenses', 'list', '--prod', '--json'])) as Record<
    string,
    Array<{ name: string; versions: string[] }>
  >;
  for (const [license, entries] of Object.entries(licenseGroups)) {
    for (const entry of entries) {
      for (const version of entry.versions) {
        const c = components.get(`${entry.name}@${version}`);
        if (c) c.license = license;
      }
    }
  }

  // 3. Integrity hashes from the lockfile.
  const integrity = readIntegrity('pnpm-lock.yaml');
  for (const [id, c] of components) c.integrity = integrity.get(id);

  // 4. Emit CycloneDX 1.6. Components sorted so the output is order-stable.
  const sorted = [...components.values()].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
  );

  const cdxComponents = sorted.map((c) => {
    const [alg, b64] = (c.integrity ?? '').split('-');
    return {
      type: 'library' as const,
      'bom-ref': purlFor(c.name, c.version),
      name: c.name,
      version: c.version,
      purl: purlFor(c.name, c.version),
      scope: 'required' as const,
      ...(c.license
        ? { licenses: [c.license.includes(' ') ? { expression: c.license } : { license: { id: c.license } }] }
        : {}),
      ...(c.integrity && alg && b64
        ? {
            hashes: [
              {
                alg: alg.toUpperCase().replace('SHA', 'SHA-'),
                content: Buffer.from(b64, 'base64').toString('hex'),
              },
            ],
          }
        : {}),
      ...(c.resolved ? { externalReferences: [{ type: 'distribution', url: c.resolved }] } : {}),
    };
  });

  const dependencies = [
    { ref: purlFor(pkg.name, pkg.version), dependsOn: [...rootEdges].sort().map((id) => {
      const c = components.get(id)!;
      return purlFor(c.name, c.version);
    }) },
    ...sorted.map((c) => ({
      ref: purlFor(c.name, c.version),
      dependsOn: [...c.deps].sort().map((id) => {
        const d = components.get(id)!;
        return purlFor(d.name, d.version);
      }),
    })),
  ];

  // Deterministic serial number: a digest of the bill itself, not randomness.
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify(cdxComponents))
    .digest('hex');
  const serialNumber = `urn:uuid:${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;

  const epoch = process.env.SOURCE_DATE_EPOCH;
  const timestamp = new Date(epoch ? Number(epoch) * 1000 : Date.now())
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z');

  const bom = {
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
      tools: {
        components: [
          { type: 'application', name: 'scripts/generate-sbom.ts', version: pkg.version },
        ],
      },
      properties: [
        { name: 'peekover:scope', value: 'production-runtime-only' },
        { name: 'peekover:rationale', value: 'devDependencies are not in the signed package' },
      ],
    },
    components: cdxComponents,
    dependencies,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(bom, null, 2)}\n`, 'utf8');

  const unlicensed = sorted.filter((c) => !c.license).map((c) => c.name);
  const unhashed = sorted.filter((c) => !c.integrity).map((c) => c.name);
  console.log(`✅ ${OUT_PATH} — CycloneDX 1.6, ${cdxComponents.length} runtime components.`);
  console.log(`   serial: ${serialNumber}`);
  if (unlicensed.length) console.log(`   ⚠️  no license resolved: ${unlicensed.join(', ')}`);
  if (unhashed.length) console.log(`   ⚠️  no integrity hash: ${unhashed.join(', ')}`);
}

// Run only when invoked as a script (`pnpm sbom`, or CI's `pnpm exec tsx scripts/generate-sbom.ts`).
// `tests/sbomWalk.test.ts` imports `collect` from this module, and an import must not shell out to
// pnpm or write an SBOM. Compared as file URLs so Windows path separators normalise; verified under
// BOTH entry paths — `pnpm sbom` still emits, and the test import does not.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
