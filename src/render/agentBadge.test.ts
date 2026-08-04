// @vitest-environment jsdom
//
// agentBadge — the seam's contract, end to end in one process: register a name (1.1), have it
// judged (1.2), and get either ONE node or NOTHING (1.3). This file is where the three modules are
// exercised together for the first time.
//
// ── WHAT THIS SUITE CAN AND CANNOT PROVE, STATED SO NOTHING HERE IS READ AS MORE THAN IT IS ───
//
// jsdom answers "what nodes came back and what is on them". It is BLIND to layout, so it cannot
// see WHERE the badge lands, whether it clears the sibling chrome, or whether it is a sibling of
// `.peekover-reader` at all once `mount()` commits — a wrap-and-restore that puts the badge INSIDE
// the column passes every assertion in this file. Those are tasks 1.4 (the structural sibling
// relationship, red-first by putting it inside) and 1.5 (the rect probe at both geometry widths),
// in a REAL engine, and they are not duplicated here in a weaker form.
//
// ── THE RED-FIRST RECORD (task 1.3) ──────────────────────────────────────────────────────────
//
// Every clause below was proven to FIRE by ablating `agentBadge.ts` and watching the failure carry
// the defect's own signature, per the revert-and-fail standard:
//
//   ABLATION A — `return [badge]` unconditionally (the gate deleted): the three empty-state
//     clauses fail with `expected 1 to be 0`, and the "no note in either case" clause fails with a
//     node it should not have. The recognized-name clauses stay green, which is the point: only
//     the emptiness assertions carry the gate.
//   ABLATION B — `return []` unconditionally (the badge deleted): every recognized-name clause
//     fails with `expected 0 to be 1`, and the empty-state clauses stay green — the mirror image,
//     which is what proves neither half is passing for the other's reason.
//   ABLATION C — the `name === undefined ||` guard removed: NOTHING went red, and that is the
//     finding rather than a gap in this suite. The arm is unreachable at runtime (`isAgentFile`
//     already declines `undefined`), so no test can reach it; and `tsc --noEmit` and eslint were
//     both run against the ablated file and both stayed SILENT on interpolating a
//     `string | undefined` into the label. The guard is therefore a deliberate belt against a
//     failure mode the toolchain does NOT catch, and it is documented that way in `agentBadge.ts`
//     rather than asserted here by a test that would have to fake its own precondition.
//
// A suite where only one direction fires is a suite that would pass for a constant function; both
// directions are asserted and both were watched to fail.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildAgentBadge, AGENT_BADGE_CLASS } from './agentBadge';
import { registerDocIdentity, resetDocIdentityForTest } from './docIdentity';

/** The frozen set, written out LITERALLY rather than imported — a test that iterates the set it is
 *  checking would pass for any set, including an empty or a grown one (1.2's own precedent). */
const FROZEN_SET = ['CLAUDE.md', 'AGENTS.md', 'spec.md', 'plan.md', 'tasks.md'];

beforeEach(() => resetDocIdentityForTest());
afterEach(() => resetDocIdentityForTest());

describe('buildAgentBadge — the empty state, which is the resting one (D-2, D-14)', () => {
  it('returns [] when NOTHING is registered', () => {
    // No registerDocIdentity call at all: `getDocIdentity()` is `undefined`, the state a focused
    // test and any render reached before an entrypoint named the document are both in.
    expect(buildAgentBadge()).toEqual([]);
  });

  it('returns [] when a name IS registered but is not recognized', () => {
    registerDocIdentity('README.md');
    expect(buildAgentBadge()).toEqual([]);
  });

  it('returns [] for the CASE VARIANTS — the false-claim direction (1.2 D-2)', () => {
    // These are the names that would put a wrong claim on screen rather than merely omit a badge,
    // so they are asserted here as well as at the predicate: this is the level the user sees.
    for (const wrong of ['claude.md', 'Agents.MD', 'SPEC.MD', 'Tasks.md', 'PLAN.MD']) {
      registerDocIdentity(wrong);
      expect(buildAgentBadge(), `${wrong} must grow no badge`).toEqual([]);
    }
  });

  it('grows NO EXPLANATORY NOTE in either empty case — not one node, of any kind', () => {
    // D-14 / spec §3.8: absence is the resting state, so there is nothing to explain. The
    // assertion is on LENGTH, not on the absence of a particular class, because a note added later
    // under any name must fail this — checking for `.peekover-agent-note` would pass for a note
    // that got a different class.
    expect(buildAgentBadge()).toHaveLength(0);
    registerDocIdentity('notes.md');
    expect(buildAgentBadge()).toHaveLength(0);
  });

  it('returns [] for an empty-string name and for a path that is not a basename', () => {
    for (const notAName of ['', '/', 'docs/CLAUDE.md', './CLAUDE.md', 'CLAUDE']) {
      registerDocIdentity(notAName);
      expect(buildAgentBadge(), `${JSON.stringify(notAName)} must grow no badge`).toEqual([]);
    }
  });
});

describe('buildAgentBadge — the recognized state (D-2, D-12)', () => {
  it('returns EXACTLY ONE node for every name in the frozen set', () => {
    for (const name of FROZEN_SET) {
      registerDocIdentity(name);
      const nodes = buildAgentBadge();
      expect(nodes, `${name} must produce exactly one node`).toHaveLength(1);
    }
  });

  it('carries the recognized name in its TEXT, not in colour or an icon (§5, row 15)', () => {
    for (const name of FROZEN_SET) {
      registerDocIdentity(name);
      const [node] = buildAgentBadge() as HTMLElement[];
      // The whole label, asserted as an exact string: a `toContain` would pass for a label that
      // also announced the tuned-rendering claim §8-4 has not made.
      expect(node.textContent).toBe(`Agent file · ${name}`);
    }
  });

  it('sets NO inline colour and NO style attribute — the mockup eyebrow used `var(--ok)` (§5)', () => {
    registerDocIdentity('CLAUDE.md');
    const [node] = buildAgentBadge() as HTMLElement[];
    expect(node.getAttribute('style')).toBeNull();
    expect(node.style.color).toBe('');
  });

  it('is NOT interactive — no button, no role, no tabindex, no aria-* (rows 12, 15, 16)', () => {
    registerDocIdentity('AGENTS.md');
    const [node] = buildAgentBadge() as HTMLElement[];
    expect(node.tagName).toBe('P');
    expect(node.getAttribute('role')).toBeNull();
    expect(node.getAttribute('tabindex')).toBeNull();
    const ariaAttrs = [...node.attributes].map((a) => a.name).filter((n) => n.startsWith('aria-'));
    expect(ariaAttrs).toEqual([]);
  });

  it('carries the SHIPPED class, read from the module rather than re-typed', () => {
    registerDocIdentity('spec.md');
    const [node] = buildAgentBadge() as HTMLElement[];
    expect(node.className).toBe(AGENT_BADGE_CLASS);
    // And the shipped name is what the CSS rule and the browser suites select on, so it is pinned
    // literally once — here — rather than in each of the three consumers.
    expect(AGENT_BADGE_CLASS).toBe('peekover-agent-badge');
  });
});

describe('buildAgentBadge — read at BUILD time, never captured (D-1, row 14)', () => {
  it('re-derives from the CURRENT registry on every call — a document switch, twice over', () => {
    // The stranded-name signature: a badge built by render N+1 that still names document N. This
    // is the property the whole registry exists for, and it is red against any implementation that
    // reads `getDocIdentity()` once at module scope.
    registerDocIdentity('CLAUDE.md');
    expect((buildAgentBadge()[0] as HTMLElement).textContent).toBe('Agent file · CLAUDE.md');

    registerDocIdentity('AGENTS.md');
    expect((buildAgentBadge()[0] as HTMLElement).textContent).toBe('Agent file · AGENTS.md');

    // …and the switch that must REMOVE the badge, which the text assertions above cannot see.
    registerDocIdentity('README.md');
    expect(buildAgentBadge()).toEqual([]);
  });

  it('returns a FRESH node per call — two renders never share one element', () => {
    // `replaceChildren` drops the previous chrome, so a shared node would be moved out of the
    // committed tree by the next render rather than rebuilt into it.
    registerDocIdentity('plan.md');
    const [first] = buildAgentBadge() as HTMLElement[];
    const [second] = buildAgentBadge() as HTMLElement[];
    expect(first).not.toBe(second);
    expect(first.isEqualNode(second)).toBe(true);
  });
});
