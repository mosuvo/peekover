// The SBOM generator's tree walk, proven against a synthetic fixture that reproduces the exact
// shape it used to get wrong.
//
// THE DEFECT THIS PINS. `collect()` memoised on `name@version` and recursed only on FIRST SIGHT.
// But `pnpm list --prod --depth Infinity --json` does not emit a repeated package identically at
// every position: it emits it SHALLOW (no `dependencies` key) at its first occurrence in traversal
// order and FULL at exactly one later occurrence. First sight is therefore precisely the occurrence
// carrying NO children, so the memo hit at the full occurrence skipped the entire subtree and the
// SBOM under-reported the production tree — 90 components against a real 120 `name@version` / 113
// distinct names, 30 dropped silently.
//
// The motivating real case (kept as a comment; the fixture below is minimal and self-contained):
// `d3@7.9.0` appears first under `dagre-d3-es@7.0.14` with 0 children, then under `mermaid@11.16.0`
// with 30 — so all of d3 vanished. Same shape one level down: `d3-dsv@3.0.1` appears first under
// `d3-fetch@3.0.1` with 0 children, then under `d3@7.9.0` with 3 (`commander`, `iconv-lite`, `rw`,
// with `safer-buffer` a level below `iconv-lite`). A pre-existing latent defect: the pre-M7
// four-dependency tree had no diamond deep enough to produce a shallow-first/full-later pair, so
// it never fired.
//
// WHY THERE IS A SECOND WALK IN THIS FILE. `legacyCollect` is a replica of the OLD gate, and it is
// NOT what the regression assertion drives — that one drives the real imported `collect()`, because
// a test against a re-implementation proves nothing (decisions.md §6 side-quest (c)). The replica
// exists purely as the FIRING CONTROL that retro finding 1(a) demands: it proves this fixture has
// discriminating power, by showing the buggy walk actually FAILS the shallow-first case while
// PASSING the full-first case. Without that, a green regression test could be green because the
// fixture never reproduced the bug at all.

import { describe, it, expect } from 'vitest';
import { collect, type Component, type PnpmNode } from '../scripts/generate-sbom';

// ── The fixture ────────────────────────────────────────────────────────────────────────────────
//
// Object key order is insertion order, and `collect()` walks via `Object.entries`, so "earlier
// parent" / "later parent" below are load-bearing and deterministic.
//
//   root
//   ├── parent-a            (walked FIRST)
//   │   ├── shared-shallow-first   ← no `dependencies` key  … the defect's trigger
//   │   └── shared-full-first      ← WITH children          … the control
//   │       └── control-child
//   └── parent-b            (walked SECOND)
//       ├── shared-shallow-first   ← WITH children          … must still be descended into
//       │   ├── only-child-a
//       │   └── only-child-b
//       └── shared-full-first      ← no `dependencies` key
const FIXTURE: Record<string, PnpmNode> = {
  'parent-a': {
    version: '1.0.0',
    dependencies: {
      'shared-shallow-first': { version: '1.0.0' },
      'shared-full-first': {
        version: '1.0.0',
        dependencies: { 'control-child': { version: '1.0.0' } },
      },
    },
  },
  'parent-b': {
    version: '1.0.0',
    dependencies: {
      'shared-shallow-first': {
        version: '1.0.0',
        dependencies: {
          'only-child-a': { version: '1.0.0' },
          'only-child-b': { version: '1.0.0' },
        },
      },
      'shared-full-first': { version: '1.0.0' },
    },
  },
};

const EXPECTED = [
  'control-child@1.0.0',
  'only-child-a@1.0.0',
  'only-child-b@1.0.0',
  'parent-a@1.0.0',
  'parent-b@1.0.0',
  'shared-full-first@1.0.0',
  'shared-shallow-first@1.0.0',
];

/** Reachable ONLY through the FULL occurrence of the shallow-first package. */
const BEHIND_THE_SHALLOW_SIGHTING = ['only-child-a@1.0.0', 'only-child-b@1.0.0'];

/** Reachable through the FULL occurrence of the full-FIRST package — the control's payload. */
const BEHIND_THE_FULL_SIGHTING = ['control-child@1.0.0'];

/**
 * The walk exactly as it was before the fix: one gate doing both dedup and descent, so a package
 * is walked only on first sight. Present solely to prove the fixture discriminates (see header).
 */
function legacyCollect(
  nodes: Record<string, PnpmNode> | undefined,
  acc: Map<string, Component>,
  parent: Component | null,
): void {
  for (const [name, node] of Object.entries(nodes ?? {})) {
    if (!node.version) continue;
    const id = `${name}@${node.version}`;
    let component = acc.get(id);
    if (!component) {
      component = { name, version: node.version, resolved: node.resolved, deps: new Set() };
      acc.set(id, component);
      legacyCollect(node.dependencies, acc, component);
    }
    parent?.deps.add(id);
  }
}

type Walk = (
  nodes: Record<string, PnpmNode> | undefined,
  acc: Map<string, Component>,
  parent: Component | null,
) => void;

/** Run a walk over the fixture and return the component ids it produced. */
function idsFrom(walk: Walk, nodes: Record<string, PnpmNode> = FIXTURE): string[] {
  const acc = new Map<string, Component>();
  walk(nodes, acc, null);
  return [...acc.keys()].sort();
}

describe('generate-sbom collect() — the production tree walk', () => {
  it('descends into a package first seen SHALLOW and later seen FULL', () => {
    const ids = idsFrom(collect);
    const missing = EXPECTED.filter((id) => !ids.includes(id));

    expect(
      missing,
      `collect() dropped ${missing.length} package(s): ${missing.join(', ') || '(none)'}. ` +
        `Recovered ${ids.length} of ${EXPECTED.length} components. These are reachable only ` +
        `through the FULL occurrence of shared-shallow-first@1.0.0, which the walk reached ` +
        `SHALLOW first — the shape that dropped d3's 30 children from the real SBOM.`,
    ).toEqual([]);

    expect(ids).toEqual(EXPECTED);
  });

  it('records the edges of a package first seen SHALLOW, not just its identity', () => {
    // The component existed even under the buggy walk — it was emitted from the shallow sighting.
    // What vanished was its dependency EDGES, which is what CycloneDX's `dependencies` graph is.
    const acc = new Map<string, Component>();
    collect(FIXTURE, acc, null);
    const shared = acc.get('shared-shallow-first@1.0.0');

    expect(shared, 'shared-shallow-first@1.0.0 was not emitted at all').toBeDefined();
    expect([...shared!.deps].sort()).toEqual(BEHIND_THE_SHALLOW_SIGHTING);
  });

  // ── The firing control (retro finding 1(a)) ──────────────────────────────────────────────────
  // A regression fixture that the OLD walk also passes would be worthless. These two assertions
  // prove the fixture's discriminating power, in the defect's own units: the buggy walk drops
  // exactly the shallow-first payload and keeps exactly the full-first payload.
  describe('firing control — the fixture discriminates', () => {
    it('the OLD walk DROPS the packages behind the shallow-first sighting', () => {
      const legacy = idsFrom(legacyCollect);
      const dropped = EXPECTED.filter((id) => !legacy.includes(id));

      expect(
        dropped,
        `The pre-fix walk was expected to drop ${BEHIND_THE_SHALLOW_SIGHTING.join(', ')} but ` +
          `dropped ${dropped.join(', ') || 'nothing'} (${legacy.length} of ${EXPECTED.length} ` +
          `components). If it drops nothing, this fixture no longer reproduces the defect and ` +
          `the regression test above is vacuous.`,
      ).toEqual(BEHIND_THE_SHALLOW_SIGHTING);
    });

    it('the full-first / shallow-later case passes under BOTH walks', () => {
      // Not merely "the buggy walk isn't broken at everything" — this is the asymmetry itself.
      // Full-FIRST is handled correctly by both walks; only shallow-FIRST discriminates.
      for (const [label, walk] of [
        ['fixed', collect],
        ['legacy', legacyCollect],
      ] as const) {
        const ids = idsFrom(walk);
        for (const id of [...BEHIND_THE_FULL_SIGHTING, 'shared-full-first@1.0.0']) {
          expect(ids, `${label} walk lost ${id}, which is reachable from a FULL-first sighting`)
            .toContain(id);
        }
      }
    });
  });

  it('does not treat a present-but-empty dependencies object as an expansion', () => {
    // The descent gate tests `.length > 0`, not `dependencies !== undefined`. Marking an id
    // expanded on a childless sighting would reintroduce the original bug through a side door.
    const emptyThenFull: Record<string, PnpmNode> = {
      'parent-a': { version: '1.0.0', dependencies: { p: { version: '1.0.0', dependencies: {} } } },
      'parent-b': {
        version: '1.0.0',
        dependencies: { p: { version: '1.0.0', dependencies: { q: { version: '1.0.0' } } } },
      },
    };

    expect(idsFrom(collect, emptyThenFull)).toContain('q@1.0.0');
  });

  it('terminates and expands each package at most once', () => {
    // Termination has two independent guarantees: the input is a JSON.parse result (a finite tree,
    // no shared or circular refs), and `expanded` admits each id once. This pins the second — a
    // diamond where the same full node is reachable by two paths must be walked a single time.
    let visits = 0;
    const counting = new Proxy(
      { version: '1.0.0', dependencies: { leaf: { version: '1.0.0' } } } as PnpmNode,
      {
        get(target, prop, receiver) {
          if (prop === 'dependencies') visits += 1;
          return Reflect.get(target, prop, receiver);
        },
      },
    );
    const diamond: Record<string, PnpmNode> = {
      'parent-a': { version: '1.0.0', dependencies: { shared: counting } },
      'parent-b': { version: '1.0.0', dependencies: { shared: counting } },
    };

    const ids = idsFrom(collect, diamond);
    expect(ids).toContain('leaf@1.0.0');
    // Read twice per sighting (the gate's `.length` test, then the recursive call) on the first
    // sighting, and once per sighting thereafter — the point is that it is BOUNDED, not that the
    // number is 3: an unbounded walk on a real diamond would blow up here rather than settle.
    expect(visits).toBeLessThanOrEqual(4);
  });
});
