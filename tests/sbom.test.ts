import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINES, LICENCE_SOURCE, inventoryPath } from '../scripts/licenceInventory';
import { mergedEntries, parseFile, type Inventory } from '../scripts/licenceNotices';
import {
  buildBom,
  compareWithLicences,
  purlFor,
  readIntegrity,
  shippedComponents,
  tarballFor,
  type ShippedComponent,
} from '../scripts/generate-sbom';

// THE SBOM LISTS WHAT SHIPS (M13 task 7.3a). scripts/generate-sbom.ts reads its components from the same
// build-derived inventory THIRD_PARTY_LICENSES.txt is made from (7.2a) — not from the dependency tree — and refuses
// to write when the two lists differ. This file drives that comparison on fixtures and, when a build is in .output,
// on the real inventories: equal to the licences file, and every one of its packages ablated in turn → red naming it.
//
// CI runs the unit suite BEFORE it builds (ci.yml), so the half that reads .output runs when a build is there and is
// skipped otherwise (the tests/thirdPartyLicences.test.ts precedent). supply-chain.yml's SBOM job builds both engines
// and runs the generator, whose own check is this comparison.

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');
const LICENCES = read(LICENCE_SOURCE);

function inventories(): Inventory[] | null {
  const paths = ENGINES.map((e) => inventoryPath(join(ROOT, '.output'), e));
  return paths.every((p) => existsSync(p)) ? paths.map((p) => JSON.parse(readFileSync(p, 'utf8')) as Inventory) : null;
}

const component = (key: string, extra: Partial<ShippedComponent> = {}): ShippedComponent => {
  const at = key.lastIndexOf('@');
  return { name: key.slice(0, at), version: key.slice(at + 1), spdx: 'MIT', engines: ['Chrome', 'Firefox'], bundledInside: [], inGraph: true, ...extra };
};

describe('compareWithLicences — the SBOM and the licences file list the same packages', () => {
  const keys = parseFile(LICENCES).map((e) => e.key);

  it('the licences file has entries to compare against (the fixture is not empty)', () => {
    expect(keys.length).toBeGreaterThan(100);
  });

  it('is empty when the SBOM lists exactly the file’s packages', () => {
    expect(compareWithLicences(keys.map((k) => component(k)), LICENCES)).toEqual([]);
  });

  it('is red, naming it, when the SBOM misses a package the file lists', () => {
    expect(compareWithLicences(keys.slice(1).map((k) => component(k)), LICENCES)).toEqual([
      `${keys[0]} is in ${LICENCE_SOURCE} but not in the SBOM`,
    ]);
  });

  it('is red, naming it, when the SBOM lists a package the file does not (one that ships nothing)', () => {
    const extra = [...keys.map((k) => component(k)), component('@types/markdown-it@14.1.2')];
    expect(compareWithLicences(extra, LICENCES)).toEqual([`@types/markdown-it@14.1.2 is in the SBOM but not in ${LICENCE_SOURCE}`]);
  });

  it('is red when a version moved', () => {
    const moved = keys.map((k, i) => (i === 0 ? component(`${k}.1`) : component(k)));
    expect(compareWithLicences(moved, LICENCES)).toHaveLength(2);
  });
});

describe('the SBOM from the real build (needs both engines built into .output)', () => {
  const invs = inventories();
  const components = invs
    ? shippedComponents(mergedEntries(ROOT, invs), invs, readIntegrity(read('pnpm-lock.yaml')))
    : [];

  it.skipIf(!invs)('its components equal THIRD_PARTY_LICENSES.txt’s packages', () => {
    expect(compareWithLicences(components, LICENCES)).toEqual([]);
    expect(components.length).toBe(parseFile(LICENCES).length);
  });

  it.skipIf(!invs)('every package ablated in turn → red naming it', () => {
    for (let i = 0; i < components.length; i += 1) {
      const c = components[i];
      const problems = compareWithLicences([...components.slice(0, i), ...components.slice(i + 1)], LICENCES);
      expect(problems, `${c.name}@${c.version}`).toEqual([`${c.name}@${c.version} is in ${LICENCE_SOURCE} but not in the SBOM`]);
    }
  });

  it.skipIf(!invs)('lists the runtime code of the four build tools — wxt, @wxt-dev/browser, vite, rolldown — from the graph', () => {
    for (const name of ['wxt', '@wxt-dev/browser', 'vite', 'rolldown']) {
      const c = components.find((x) => x.name === name);
      expect(c?.inGraph, name).toBe(true);
      expect(c?.integrity, name).toMatch(/^sha512-/);
    }
  });

  it.skipIf(!invs)('names a pre-bundled package’s host, which is itself a component, and gives it no hash of its own', () => {
    const pre = components.filter((c) => !c.inGraph);
    expect(pre.length).toBeGreaterThan(0);
    const keys = new Set(components.map((c) => `${c.name}@${c.version}`));
    for (const c of pre) {
      expect(c.bundledInside.length, c.name).toBeGreaterThan(0);
      for (const h of c.bundledInside) expect(keys.has(h), h).toBe(true);
    }
    expect(components.find((c) => c.name === 'chevrotain')?.bundledInside).toEqual(['@mermaid-js/parser@1.2.0']);
  });

  it.skipIf(!invs)('every installed component carries pnpm’s integrity hash', () => {
    expect(components.filter((c) => c.inGraph && !c.integrity).map((c) => c.name)).toEqual([]);
  });
});

describe('buildBom — deterministic CycloneDX', () => {
  const pkg = { name: 'peekover', version: '0.1.0', license: 'MIT' };
  const comps = [
    component('b@1.0.0', { integrity: 'sha512-AAAA' }),
    component('@s/a@2.0.0', { integrity: 'sha512-BBBB' }),
    component('c@3.0.0', { inGraph: false, bundledInside: ['b@1.0.0'] }),
  ];

  it('the same inputs and epoch give the same bytes, in either input order', () => {
    const one = JSON.stringify(buildBom(pkg, comps, 1_700_000_000));
    const two = JSON.stringify(buildBom(pkg, [...comps].reverse(), 1_700_000_000));
    expect(two).toBe(one);
    expect(one).toContain('"timestamp":"2023-11-14T22:13:20Z"');
  });

  it('the package ships the installed components; a pre-bundled one hangs off its host', () => {
    const bom = buildBom(pkg, comps, 0) as { dependencies: { ref: string; dependsOn: string[] }[]; components: { name: string; hashes?: unknown }[] };
    expect(bom.dependencies[0]).toEqual({ ref: purlFor('peekover', '0.1.0'), dependsOn: [purlFor('@s/a', '2.0.0'), purlFor('b', '1.0.0')] });
    expect(bom.dependencies.find((d) => d.ref === purlFor('b', '1.0.0'))?.dependsOn).toEqual([purlFor('c', '3.0.0')]);
    expect(bom.components.find((c) => c.name === 'c')?.hashes).toBeUndefined();
  });

  it('refuses a host that is not a component', () => {
    expect(() => buildBom(pkg, [component('c@3.0.0', { inGraph: false, bundledInside: ['gone@1.0.0'] })], 0)).toThrow(/gone@1.0.0/);
  });

  it('purls and tarballs, scoped and plain', () => {
    expect(purlFor('@wxt-dev/browser', '0.2.2')).toBe('pkg:npm/%40wxt-dev%2Fbrowser@0.2.2');
    expect(tarballFor('@wxt-dev/browser', '0.2.2')).toBe('https://registry.npmjs.org/@wxt-dev/browser/-/browser-0.2.2.tgz');
    expect(tarballFor('vite', '8.1.4')).toBe('https://registry.npmjs.org/vite/-/vite-8.1.4.tgz');
  });
});

describe('readIntegrity — lockfile v9 keys, quoted (scoped) and plain', () => {
  it('reads both', () => {
    const lock = "packages:\n\n  '@s/a@2.0.0':\n    resolution: {integrity: sha512-BBBB}\n\n  b@1.0.0:\n    resolution: {integrity: sha512-AAAA}\n";
    expect([...readIntegrity(lock)]).toEqual([['@s/a@2.0.0', 'sha512-BBBB'], ['b@1.0.0', 'sha512-AAAA']]);
  });
});
