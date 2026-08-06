// tableCost — D-11 (ii)'s THREE-ARM CONDITIONALITY GUARD, and D-11 (i)'s directly assertable
// negative half, in a real engine (008 task 3.10). Chromium AND Firefox.
//
// ══ ★ WHAT THIS FILE IS, AND — LOUDLY — WHAT IT IS NOT ════════════════════════════════════════
//
// THIS IS NOT A BUDGET. It reports NO millisecond figure and it must never be read as "within
// budget", because there is no budget on this surface to be within: **the app page has NO
// first-paint instrument at all** (D-11 (iii); `progress.md` § Baselines, *THE APP-PAGE RENDER
// PATH HAS NO FIRST-PAINT INSTRUMENT AT ALL*). All seven `perf-*` harnesses drive the content
// script or a sub-part; the one programmatic seam, `__peekover.selectFile`, is
// `import.meta.env.DEV`-guarded and therefore stripped from the very build a harness would have
// to measure. M8 does not fund that harness (human ruling) — it CARRIES the hole with its trigger
// named.
//
// So what this file proves is STRUCTURAL, not quantitative: the enhancement step is CONDITIONAL.
// On a document with nothing to enhance it adds NO node and binds NO listener — the same shadow
// root, to the node, that `mount()` alone produces. That is §5's *"a document with no table and
// no recognized name shall pay nothing measurable"* in the strongest form this repo can actually
// check, and it STANDS IN FOR the number the surface cannot produce. It is strictly weaker than a
// measurement, and it is labelled as such here so that nobody reading the green infers otherwise.
//
// ══ ★ THE EQUALITY IS THE PROPERTY; THE INEQUALITY IS THE POSITIVE CONTROL THAT FIRES ═════════
//
// Retro finding 1, and it is the load-bearing structure of this file rather than a nicety.
// `(1) == (2)` — mount alone versus mount + the enhancements, on the SAME document — is what the
// conditionality claim reduces to. But an equality of counters is VACUOUS ON ITS OWN: a counter
// that never moves reads equal whether or not the code under test ran at all, whether or not the
// instrument is wired, whether or not the enhancer was even called. A broken tape measure reports
// two objects the same length.
//
// So arm 3 exists to make the tape measure move. In the SAME run, through the SAME instrument, on
// a document that DOES have something to enhance, both counters go up. Without arm 3 the equality
// proves nothing; with arm 3 it is a measurement.
//
// ══ THE ARMS, AND THE ONE READING THAT IS NOT IN D-11's LIST ══════════════════════════════════
//
//   arm 1  mount() alone, no enhancement       DOC_BARE   name `notes.md`   — the floor
//   arm 2  mount() + M8's enhancements         DOC_BARE   name `notes.md`   — nothing to enhance
//   arm 3  mount() + M8's enhancements         DOC_TABLE  name `CLAUDE.md`  — something to enhance
//
// Arms 1 and 2 differ in EXACTLY ONE THING — whether the two enhancer calls run — because they go
// through one parameterised runner. Same fixture, same name, same `{contained: true}`, same fresh
// host, same instrument installed at the same point. Any other construction (arm 2 driven through
// `mountAppShell` while arm 1 called `mount` directly, say) would put the app shell's own chrome
// inside the delta and the equality would be measuring the harness.
//
// ★ AND ONE MORE READING, WHICH D-11 DOES NOT NAME AND THIS FILE ADDS ON PURPOSE:
//
//   arm 3's FLOOR   mount() alone               DOC_TABLE  name `CLAUDE.md`
//
// Because `(3) > (2)` compares two DIFFERENT DOCUMENTS. On the node counter that inequality is
// CONFOUNDED — arm 3's markdown contains a table, so its shadow root is larger before any
// enhancer runs. An inequality that the FIXTURE could have produced is not a control for the
// ENHANCER. Arm 3's floor removes the confound: `arm3 − arm3floor` is the enhancer's own delta on
// the same document, and THAT is the number that proves the instrument responds to the enhancer
// rather than to the fixture. (The listener counter is not confounded — plain table markup binds
// nothing — and it is asserted both ways.)
//
// ══ WHAT IS COUNTED ══════════════════════════════════════════════════════════════════════════
//
//   • TOTAL SHADOW-ROOT NODE COUNT — every node, of every type, under the host's shadow root:
//     elements, text nodes and comments alike, via a `SHOW_ALL` TreeWalker. Elements alone would
//     miss a text node, and the badge's whole cost on a hit is one `<p>` and its text.
//   • `addEventListener` CALLS, recorded by instrumenting `EventTarget.prototype.addEventListener`
//     for the DURATION OF EACH ARM. Not "listeners on the shadow root" — the prototype, so a
//     listener bound to `document`, to `window`, or to a node not yet inserted is counted too.
//
// The two are ONE instrument and are asserted in ONE `expect` per property (see below), because a
// ladder of narrow checks lets the first clause hide the one written to find the defect.
//
// ══ D-11 (i)'s NEGATIVE HALF — SPIES, EACH WITH A CONTROL THAT FIRES ══════════════════════════
//
// D-11 (i) prices the table tools as *"node creation … with no `parse()`, no `sanitize()`, and no
// layout read"*, and says the negative half is directly assertable. It is, and here it is:
//
//   • `parse` / `sanitize` — MODULE-MOCKED to delegate to the real implementation and count. The
//     control is FREE and is the strongest possible one: `mount()` itself calls
//     `sanitize(parse(source))` (`mount.ts:118`) THROUGH THE SAME MOCK, in the same test, moments
//     before the measured window. So each spy is SEEN to record a call, and then seen to record
//     none while the enhancer runs. A spy that was never wired would read zero for mount too, and
//     the test would be red.
//   • `getBoundingClientRect` / `getClientRects` / `getComputedStyle` / `offsetWidth` /
//     `offsetHeight` — patched on the prototypes (and on `window`) for the measured window. Their
//     control is a PROBE inside the same window, after the enhancer: five direct calls, one per
//     spy, each of which must be recorded. An unwired spy reads zero for the probe and the test
//     is red.
//
// ★ AND THE CLAIM IS MADE ON BOTH DOCUMENTS, not only the bail case. D-11 (i) claims no parse, no
// sanitize and no layout read on the TABLE-BEARING document as well — the enhancer that actually
// does work is also the enhancer that re-parses nothing. A "prologue only" reading would leave the
// expensive half of the claim untested. Each is paired IN THE SAME `expect` with the enhancement
// footprint, so a run in which the enhancer silently did nothing cannot pass as a run in which it
// did nothing EXPENSIVE.
//
// ══ WHY REAL-ENGINE ══════════════════════════════════════════════════════════════════════════
//
// The unit is a shadow root's node count and the engine's own `EventTarget` prototype. jsdom
// composes a different tree (and 3.2 measured a selector that resolves in a browser and returns
// `null` under jsdom inside a shadow root), so an equality established there would be an equality
// about jsdom. Both engines, because the conditionality is a property of the shipped surface.
//
// ══ ONE INSTRUMENT PER PROPERTY ══════════════════════════════════════════════════════════════
//
// Paid for seven times in this milestone, and now a design rule rather than a reflex. Every
// property below is ONE `expect` whose value carries the whole claim — the counts AND the control
// AND the footprint that proves the arm was not vacuous — so a failure shows every part at once
// instead of stopping at the cheapest clause. Selectors are BY CLASS ALONE, never tag-qualified.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// ── The parse / sanitize spies ────────────────────────────────────────────────────────────────
// Hoisted so the `vi.mock` factories (hoisted above the imports) can read them. They delegate to
// the real implementations and COUNT — the module graph under test is production's, not a stub's,
// and `mount()` reaching `sanitize(parse(source))` through these very wrappers is what proves the
// spies are wired at all.
const injected = vi.hoisted(() => ({ parse: 0, sanitize: 0, sanitizeSvg: 0 }));

// ── ★ THE CONTENT SCRIPT'S ENHANCE GATE (task 4.2) ────────────────────────────────────────────
//
// The app-page arms above can toggle the enhancement by simply not calling it: 3.10's runner owns
// the two lines. The CONTENT SCRIPT cannot be driven that way. `enhanceTables` is called from
// INSIDE production — `mountReader.ts:110` (site 3) and `contentWatch.ts:90` (site 4) — so an arm
// that "mounts without enhancing" has no seam to pass and reconstructing `mountReader`'s body here
// would measure the harness rather than the surface.
//
// So the ablation is moved one level down, to the module boundary the two sites import across. The
// wrapper is ALWAYS called and ALWAYS counted; `enabled` decides only whether the REAL body runs.
// That is what makes the floor arm exact: it is the production path, reaching the production call
// site, with the enhancer's BODY and nothing else removed.
//
// ★ AND `calls` IS THE FLOOR ARM'S OWN FIRING CONTROL, which an enhancement flag alone would not
// give. A floor that added no node because the site never reached the enhancer is indistinguishable
// — on the counters — from a floor that reached it and was gated off. The counter tells them apart,
// and every arm below asserts it.
const csEnhanceGate = vi.hoisted(() => ({ enabled: true, calls: 0 }));

vi.mock('../../src/render/tableEnhancer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/render/tableEnhancer')>();
  return {
    ...actual,
    enhanceTables: (host: HTMLElement): void => {
      csEnhanceGate.calls += 1;
      if (!csEnhanceGate.enabled) return;
      actual.enhanceTables(host);
    },
  };
});

vi.mock('../../src/render/parse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/render/parse')>();
  return {
    ...actual,
    parse: (markdown: string): string => {
      injected.parse += 1;
      return actual.parse(markdown);
    },
  };
});

vi.mock('../../src/render/sanitize', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/render/sanitize')>();
  return {
    ...actual,
    sanitize: (html: string): string => {
      injected.sanitize += 1;
      return actual.sanitize(html);
    },
    sanitizeSvg: (svg: string): string => {
      injected.sanitizeSvg += 1;
      return actual.sanitizeSvg(svg);
    },
  };
});

import { mount } from '../../src/render/mount';
import { enhanceDiagrams } from '../../src/render/diagramEnhancer';
import { enhanceTables, TABLE_STATE_ATTR, TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';
import {
  COPY_BUTTON_CLASS,
  COPY_STATUS_CLASS,
  FILTER_COUNT_CLASS,
  FILTER_FIELD_CLASS,
  SORT_BUTTON_CLASS,
} from '../../src/render/tableTools';
import { AGENT_BADGE_CLASS } from '../../src/render/agentBadge';
import {
  getDocIdentity,
  registerDocIdentity,
  resetDocIdentityForTest,
} from '../../src/render/docIdentity';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
// ★ 4.2's content-script surface. `runReader` is the entrypoint's own document_start
// orchestration, which reaches `mountReader` (D-6 site 3) and through it the enhancer. Nothing
// below calls `enhanceTables`, hands a `render` to a controller, or reconstructs `mountReader`'s
// body — the arms drive the production path and vary the gate above.
import { runReader, removeHideStyle } from '../../src/render/runReader';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

/**
 * NOTHING TO ENHANCE. No `<table>`, no fence, no diagram — and the name registered beside it is
 * `notes.md`, which `AGENT_FILE_NAMES` does not contain, so `buildAgentBadge()` returns `[]`.
 * BOTH of M8's app-page triggers are absent, which is what makes this arm 2 rather than a partial
 * one: a fixture missing only the table would still grow a badge and the equality would be false
 * for a reason that has nothing to do with the enhancer.
 *
 * One `<h1>` only — `buildTocView` needs two headings before it returns a rail, so no rail chrome
 * enters either fixture and the two documents differ in the table and the name alone.
 */
const DOC_BARE = [
  '# Report',
  '',
  'A paragraph with nothing in it that any enhancer can reach.',
  '',
  '- one',
  '- two',
  '',
].join('\n');

/**
 * SOMETHING TO ENHANCE. A three-column GFM table with a header row (so `hasHeaderRow` opens the
 * gate) and the name `CLAUDE.md`, which IS in `AGENT_FILE_NAMES`. Both triggers fire: the badge
 * from the name, the toolbar and its controls from the table.
 */
const DOC_TABLE = [
  '# Report',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| ops | bo | 2 |',
  '',
].join('\n');

/** Unrecognized — asserted rather than assumed by arm 2's zero badge count. */
const BARE_NAME = 'notes.md';
/** Recognized — `agentFile.ts:78`. */
const AGENT_NAME = 'CLAUDE.md';

// ── The instruments ───────────────────────────────────────────────────────────────────────────

const hosts: HTMLElement[] = [];

/** The app page's own host shape: a plain `<div>` mounted `{contained: true}` (`readerPane.ts:181`). */
function makeHost(): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

/**
 * TOTAL shadow-root node count — every node type, not just elements. A `SHOW_ALL` TreeWalker
 * rooted at the shadow root; `nextNode()` starts below the root, so the root itself is excluded
 * from both sides of every comparison alike.
 */
function nodeCount(root: ShadowRoot): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
  let n = 0;
  while (walker.nextNode()) n += 1;
  return n;
}

/**
 * `addEventListener` calls, counted on the PROTOTYPE for the duration of an arm — so a listener
 * bound to `document`, to `window`, or to a node that has not been inserted yet is counted just
 * the same. Restored by `stop()`, which is called from a `finally`.
 */
function countListeners(): { calls: () => number; stop: () => void } {
  const original = EventTarget.prototype.addEventListener;
  let calls = 0;
  EventTarget.prototype.addEventListener = function patched(
    this: EventTarget,
    ...args: Parameters<EventTarget['addEventListener']>
  ): void {
    calls += 1;
    original.apply(this, args);
  };
  return {
    calls: () => calls,
    stop: () => {
      EventTarget.prototype.addEventListener = original;
    },
  };
}

interface ArmCounts {
  nodes: number;
  listeners: number;
}

interface Arm extends ArmCounts {
  host: HTMLElement;
}

/**
 * ONE runner for every arm. The ONLY difference between arm 1 and arm 2 is the `enhance` flag —
 * same fixture, same registered name, same host shape, same mount options, same instrument
 * installed at the same point. That is what makes the equality a statement about the enhancer.
 *
 * The enhanced body is `appShell.ts:153-157`'s verbatim: `mount`, then `enhanceDiagrams`, then
 * `enhanceTables`, in that order (plan §4 risk 5), after the mount has committed.
 */
function runArm(doc: string, name: string, enhance: boolean): Arm {
  const host = makeHost();
  registerDocIdentity(name);
  const listeners = countListeners();
  try {
    mount(doc, host, { contained: true });
    if (enhance) {
      enhanceDiagrams(host);
      enhanceTables(host);
    }
  } finally {
    listeners.stop();
  }
  return { host, nodes: nodeCount(host.shadowRoot!), listeners: listeners.calls() };
}

const countsOf = (arm: Arm): ArmCounts => ({ nodes: arm.nodes, listeners: arm.listeners });

/**
 * EVERY class M8 puts on the app page, counted in one place — the table tools' five visible
 * classes, the enhanced-table attribute, and the agent badge. One object, so an arm-2 violation
 * names every way M8 could have reached in rather than stopping at the first.
 */
function m8Footprint(root: ParentNode): Record<string, number> {
  return {
    toolbars: root.querySelectorAll(`.${TABLE_TOOLBAR_CLASS}`).length,
    sortButtons: root.querySelectorAll(`.${SORT_BUTTON_CLASS}`).length,
    filterFields: root.querySelectorAll(`.${FILTER_FIELD_CLASS}`).length,
    filterCounts: root.querySelectorAll(`.${FILTER_COUNT_CLASS}`).length,
    copyButtons: root.querySelectorAll(`.${COPY_BUTTON_CLASS}`).length,
    copyStatuses: root.querySelectorAll(`.${COPY_STATUS_CLASS}`).length,
    markedTables: root.querySelectorAll(`[${TABLE_STATE_ATTR}]`).length,
    badges: root.querySelectorAll(`.${AGENT_BADGE_CLASS}`).length,
  };
}

const NO_M8_FOOTPRINT = {
  toolbars: 0,
  sortButtons: 0,
  filterFields: 0,
  filterCounts: 0,
  copyButtons: 0,
  copyStatuses: 0,
  markedTables: 0,
  badges: 0,
};

/** One three-column table enhanced, plus the badge a recognized name earns. */
const ENHANCED_M8_FOOTPRINT = {
  toolbars: 1,
  sortButtons: 3,
  filterFields: 1,
  filterCounts: 1,
  copyButtons: 2,
  copyStatuses: 1,
  markedTables: 1,
  badges: 1,
};

// ── The three arms, run ONCE, before anything asserts ──────────────────────────────────────────
//
// D-11 (ii) says "three arms in ONE run", and this is that run: the arms are measured together,
// in order, through one instrument, and the assertions below read the SAME four sets of counters.
// Splitting them into separate `it`s is deliberate and is the masked-instrument rule: if the
// equality and the inequality shared one `it`, a red equality would stop the file before the
// control that gives the equality its meaning was ever seen to run.

interface Measured {
  bareFloor: Arm;
  bareEnhanced: Arm;
  tableFloor: Arm;
  tableEnhanced: Arm;
}

let measured: Measured;

beforeAll(() => {
  // A WARM-UP MOUNT, DISCARDED. Any first-call cost inside the render path — a lazily built
  // parser, a module-level registration that happens once — would otherwise land in arm 1 alone
  // and show up as an inequality the enhancer had nothing to do with. Paying it before the arms
  // is what makes arm 1 and arm 2 comparable; it is a property of the harness, and it is stated
  // rather than hidden because a reader is entitled to know why it is here.
  runArm(DOC_BARE, BARE_NAME, true);

  measured = {
    bareFloor: runArm(DOC_BARE, BARE_NAME, false),
    bareEnhanced: runArm(DOC_BARE, BARE_NAME, true),
    tableFloor: runArm(DOC_TABLE, AGENT_NAME, false),
    tableEnhanced: runArm(DOC_TABLE, AGENT_NAME, true),
  };
});

afterAll(() => {
  for (const host of hosts) host.remove();
  hosts.length = 0;
  resetDocIdentityForTest();
  resetThemeHostsForTest();
});

describe('the app page pays nothing for a document with nothing to enhance (D-11 (ii))', () => {
  it('arm 1 == arm 2 — mount alone and mount + M8 enhancement produce the SAME shadow root, to the node and to the listener', () => {
    // THE PROPERTY. One `expect` carrying both counters, because they are one claim: the
    // enhancement step added no node AND bound no listener. Read on its own this equality is
    // vacuous — see the next test, which is what makes it a measurement.
    expect(countsOf(measured.bareEnhanced)).toEqual(countsOf(measured.bareFloor));
  });

  it('arm 3 > arm 2 — the SAME instrument, in the SAME run, moves when there IS something to enhance (the positive control)', () => {
    const bare = countsOf(measured.bareEnhanced);
    const table = countsOf(measured.tableEnhanced);
    const floor = countsOf(measured.tableFloor);
    // THE CONTROL, in one instrument, with the raw numbers carried so a failure shows what the
    // counters actually read. Two independent forms of it:
    //   • `movedVsArm2`   — D-11 (ii)'s literal (3) > (2), on both counters.
    //   • `movedVsFloor`  — the SAME document mounted without enhancement, which is what makes the
    //     node inequality the ENHANCER's rather than the fixture's larger markup.
    expect({
      arm2: bare,
      arm3: table,
      arm3Floor: floor,
      movedVsArm2: { nodes: table.nodes > bare.nodes, listeners: table.listeners > bare.listeners },
      movedVsFloor: {
        nodes: table.nodes > floor.nodes,
        listeners: table.listeners > floor.listeners,
      },
    }).toMatchObject({
      movedVsArm2: { nodes: true, listeners: true },
      movedVsFloor: { nodes: true, listeners: true },
    });
  });

  it('no element carrying any M8 class exists anywhere in arm 2 — and arm 3 carries all of them', () => {
    // The structural half of the same claim, with its own firing control in the same object: an
    // all-zero footprint means something only beside a non-zero one from the same reader.
    expect({
      arm2: m8Footprint(measured.bareEnhanced.host.shadowRoot!),
      arm3: m8Footprint(measured.tableEnhanced.host.shadowRoot!),
    }).toEqual({ arm2: NO_M8_FOOTPRINT, arm3: ENHANCED_M8_FOOTPRINT });
  });
});

describe('the enhancer re-parses nothing, re-sanitizes nothing and reads no layout (D-11 (i))', () => {
  it('calls neither parse nor sanitize — on either document — while the same spies record mount', () => {
    const host = makeHost();
    registerDocIdentity(AGENT_NAME);

    const start = { ...injected };
    mount(DOC_TABLE, host, { contained: true });
    // THE CONTROL, and it is free: `mount()` reaches `sanitize(parse(source))` (`mount.ts:118`)
    // THROUGH THESE VERY WRAPPERS. A spy that was never wired reads zero here too.
    const afterMount = { ...injected };
    enhanceDiagrams(host);
    enhanceTables(host);
    const afterEnhance = { ...injected };

    const bare = makeHost();
    registerDocIdentity(BARE_NAME);
    mount(DOC_BARE, bare, { contained: true });
    const afterBareMount = { ...injected };
    enhanceDiagrams(bare);
    enhanceTables(bare);
    const afterBareEnhance = { ...injected };

    // ONE instrument: the control's deltas, the enhancer's deltas, and the footprint proving each
    // enhancer call was not a no-op — a run in which the enhancer did nothing at all must not read
    // the same as a run in which it did nothing EXPENSIVE.
    expect({
      controlOnMount: {
        parse: afterMount.parse - start.parse,
        sanitize: afterMount.sanitize - start.sanitize,
      },
      enhancerOnTableDoc: {
        parse: afterEnhance.parse - afterMount.parse,
        sanitize: afterEnhance.sanitize - afterMount.sanitize,
        sanitizeSvg: afterEnhance.sanitizeSvg - afterMount.sanitizeSvg,
      },
      enhancerOnBareDoc: {
        parse: afterBareEnhance.parse - afterBareMount.parse,
        sanitize: afterBareEnhance.sanitize - afterBareMount.sanitize,
        sanitizeSvg: afterBareEnhance.sanitizeSvg - afterBareMount.sanitizeSvg,
      },
      enhanced: m8Footprint(host.shadowRoot!),
    }).toEqual({
      controlOnMount: { parse: 1, sanitize: 1 },
      enhancerOnTableDoc: { parse: 0, sanitize: 0, sanitizeSvg: 0 },
      enhancerOnBareDoc: { parse: 0, sanitize: 0, sanitizeSvg: 0 },
      enhanced: ENHANCED_M8_FOOTPRINT,
    });
  });

  it('touches no layout-reading API — on either document — while the same spies record a probe', () => {
    const host = makeHost();
    registerDocIdentity(AGENT_NAME);
    mount(DOC_TABLE, host, { contained: true });

    const bare = makeHost();
    registerDocIdentity(BARE_NAME);
    mount(DOC_BARE, bare, { contained: true });

    const layout = installLayoutSpies();
    let onTableDoc!: LayoutCounts;
    let onBareDoc!: LayoutCounts;
    let controlOnProbe!: LayoutCounts;
    let probe!: Record<string, boolean>;
    try {
      enhanceDiagrams(host);
      enhanceTables(host);
      onTableDoc = layout.read();

      enhanceDiagrams(bare);
      enhanceTables(bare);
      onBareDoc = layout.since(onTableDoc);

      // THE CONTROL: one direct call per spy, inside the same window, through the same patched
      // prototypes. Each must be recorded — an unwired spy reads zero here and this test is red.
      const before = layout.read();
      probe = {
        rect: host.getBoundingClientRect().width >= 0,
        rects: host.getClientRects().length >= 0,
        style: typeof window.getComputedStyle(host).display === 'string',
        width: host.offsetWidth >= 0,
        height: host.offsetHeight >= 0,
      };
      controlOnProbe = layout.since(before);
    } finally {
      // Restored BEFORE the assertion, so a red leaves no patched prototype behind for the rest
      // of the file (or, on a shared page, the rest of the suite).
      layout.restore();
    }

    expect({
      onTableDoc,
      onBareDoc,
      probe,
      controlOnProbe,
      enhanced: m8Footprint(host.shadowRoot!),
    }).toEqual({
      onTableDoc: NO_LAYOUT_READS,
      onBareDoc: NO_LAYOUT_READS,
      probe: { rect: true, rects: true, style: true, width: true, height: true },
      controlOnProbe: {
        getBoundingClientRect: 1,
        getClientRects: 1,
        getComputedStyle: 1,
        offsetWidth: 1,
        offsetHeight: 1,
      },
      enhanced: ENHANCED_M8_FOOTPRINT,
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 4.2 — THE SAME GUARD, ON THE CONTENT SCRIPT (D-11 (ii), the second surface)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ── WHY THE APP-PAGE ARMS ABOVE CANNOT STAND IN FOR THIS ─────────────────────────────────────
//
// Everything above composes `mount` + the two enhancer calls the way `appShell` does, and it would
// go on passing, unchanged, against a build in which the CONTENT SCRIPT enhanced nothing at all —
// which is exactly what shipped from 3.4 through 3.11 and what 4.1 fixed. §5's *"a document with no
// table and no recognized name shall pay nothing measurable"* is a claim about BOTH surfaces, and
// the content script is the one that runs in the page's own context on every allowlisted document
// the reader ever sees. So the guard is re-established here, through `runReader`.
//
// ── THE ARMS, AND THE FLOOR THAT KEEPS THE CONTROL HONEST ────────────────────────────────────
//
//   arm 1  runReader, enhancer gated OFF    CS_BARE    — the floor
//   arm 2  runReader, enhancer gated ON     CS_BARE    — nothing to enhance
//   arm 3  runReader, enhancer gated ON     CS_TABLE   — something to enhance
//   arm 3's FLOOR  runReader, gated OFF     CS_TABLE   — the SAME document, unenhanced
//
// ★ THE FLOOR IS NOT OPTIONAL, AND 3.10 IS WHY. `(3) > (2)` compares two DIFFERENT DOCUMENTS: arm
// 3's markdown carries a table, so its shadow root is larger BEFORE any enhancer runs. On the node
// counter that inequality is CONFOUNDED — a completely dead enhancer would still produce it, and
// the "control that fires" would be reading the fixture rather than the code. `arm3 − arm3floor`
// is the enhancer's OWN delta on ONE document, and that is the reading that proves the instrument
// responds to the enhancer. Both forms are asserted, and the floor-corrected one is what the claim
// rests on. (The listener counter is not confounded — plain table markup binds nothing — so it is
// asserted both ways too.)
//
// ── ONE DIFFERENCE FROM THE APP-PAGE FOOTPRINT, MEASURED RATHER THAN ASSUMED ─────────────────
//
// M8's app-page footprint has two triggers, the table and the recognized NAME. On this surface the
// name is not the fixture's to choose: `runReader` registers `basenameOf(location.href)` (`:149`),
// which is the RUNNER's own URL, and no test runner is called `CLAUDE.md`. So no CS arm grows a
// badge — and the identity is carried INTO the assertion rather than left implicit, so a zero badge
// count is read beside the name that explains it instead of being mistaken for a badge that failed
// to render. What that leaves in the CS delta is `enhanceTables` and nothing else, which is exactly
// what D-6 puts on this surface.

/** NOTHING TO ENHANCE, as the content script receives it: no `<table>`, no fence. */
const CS_BARE = ['# Report', '', 'Prose only, and nothing any enhancer can reach.', ''].join('\n');

/** SOMETHING TO ENHANCE: a three-column GFM table with a header row, so the gate opens. */
const CS_TABLE = [
  '# Report',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| ops | bo | 2 |',
  '',
].join('\n');

const HOST_TAG = 'peekover-root';

/**
 * The page a browser builds for a raw `.md` resource: the bytes in a single `<pre>`. That is what
 * `readPageSource()` reads, and seeding it is the ONLY fake in this harness — measured against the
 * real thing in `tableCopy.browser.test.ts`'s `file://` probe, which reports the `<pre>` count a
 * real engine produces for a real `.md` file.
 */
function seedRawPage(doc: string): void {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
}

/** Leave the document as this file found it: no host, no seeded source, no hide rule. */
function clearContentPage(): void {
  document.querySelector(HOST_TAG)?.remove();
  removeHideStyle();
  document.body.replaceChildren();
  resetThemeHostsForTest();
  resetDocIdentityForTest();
}

interface ContentArm extends Arm {
  /** Wrapper invocations during the arm — the floor's proof that the call SITE was reached. */
  enhancerCalls: number;
}

/**
 * ONE runner for every content-script arm. The only difference between an enhanced arm and its
 * floor is `csEnhanceGate.enabled` — same fixture handling, same `runReader` options, same
 * instrument installed at the same point, same production path from `runReader` through
 * `mountReader` to the call site.
 *
 * `isRenderable` is overridden because the runner's own page is not a markdown document; that seam
 * exists for exactly this and is the one the WXT entrypoint fills with `isRenderableContext`.
 * Everything downstream of it — the source read, the host append, `mount`, the enhancer, the hide
 * of the originals — is production. `runReader` reaches its mount SYNCHRONOUSLY here (the runner's
 * `readyState` is `complete`, so `tryMount(true)` runs in the same task), which is what lets the
 * counters be read the way the app-page arms read theirs.
 */
function runContentArm(doc: string, enhance: boolean): ContentArm {
  clearContentPage();
  seedRawPage(doc);
  const callsBefore = csEnhanceGate.calls;
  csEnhanceGate.enabled = enhance;
  const listeners = countListeners();
  try {
    runReader({ isRenderable: () => true });
  } finally {
    listeners.stop();
    csEnhanceGate.enabled = true;
  }
  const host = document.querySelector<HTMLElement>(HOST_TAG)!;
  return {
    host,
    nodes: nodeCount(host.shadowRoot!),
    listeners: listeners.calls(),
    enhancerCalls: csEnhanceGate.calls - callsBefore,
  };
}

interface ContentMeasured {
  bareFloor: ContentArm;
  bareEnhanced: ContentArm;
  tableFloor: ContentArm;
  tableEnhanced: ContentArm;
  /** The name `runReader` derived from the runner's URL — what the badge counts are read against. */
  identity: string | undefined;
}

let cs: ContentMeasured;

describe('the CONTENT SCRIPT pays nothing for a document with nothing to enhance (D-11 (ii))', () => {
  beforeAll(() => {
    // The same discarded warm-up the app-page arms take, for the same reason: any first-call cost
    // inside this path would otherwise land in whichever arm ran first.
    runContentArm(CS_BARE, true);

    cs = {
      bareFloor: runContentArm(CS_BARE, false),
      bareEnhanced: runContentArm(CS_BARE, true),
      tableFloor: runContentArm(CS_TABLE, false),
      tableEnhanced: runContentArm(CS_TABLE, true),
      identity: getDocIdentity(),
    };
  });

  afterAll(clearContentPage);

  it('arm 1 == arm 2 — runReader alone and runReader + the enhancer produce the SAME shadow root, to the node and to the listener', () => {
    // THE PROPERTY, and the enhancer-call counts ride in the SAME `expect` because they are what
    // make it non-vacuous: BOTH arms reached the call site exactly once, and the gated-off one is
    // therefore a measurement of the enhancer's body rather than of a site that never fired.
    expect({
      floor: { ...countsOf(cs.bareFloor), enhancerCalls: cs.bareFloor.enhancerCalls },
      enhanced: { ...countsOf(cs.bareEnhanced), enhancerCalls: cs.bareEnhanced.enhancerCalls },
    }).toEqual({
      floor: { ...countsOf(cs.bareFloor), enhancerCalls: 1 },
      enhanced: { ...countsOf(cs.bareFloor), enhancerCalls: 1 },
    });
  });

  it('★ arm 3 moves the SAME instrument — against arm 2 AND against its own FLOOR (the un-confounded control)', () => {
    const bare = countsOf(cs.bareEnhanced);
    const table = countsOf(cs.tableEnhanced);
    const floor = countsOf(cs.tableFloor);
    // ★ `movedVsFloor` IS THE CONTROL. `movedVsArm2` is D-11 (ii)'s literal wording and it is
    // carried, but on the node counter it is confounded by arm 3's larger markup — a dead enhancer
    // produces it. The floor comparison is the same document with the enhancer's body removed, so
    // the delta it reports belongs to the enhancer and to nothing else. Raw numbers travel with the
    // booleans so a failure shows what the counters actually read.
    expect({
      arm2: bare,
      arm3: table,
      arm3Floor: floor,
      enhancerCalls: {
        arm3: cs.tableEnhanced.enhancerCalls,
        arm3Floor: cs.tableFloor.enhancerCalls,
      },
      movedVsArm2: { nodes: table.nodes > bare.nodes, listeners: table.listeners > bare.listeners },
      movedVsFloor: {
        nodes: table.nodes > floor.nodes,
        listeners: table.listeners > floor.listeners,
      },
    }).toMatchObject({
      enhancerCalls: { arm3: 1, arm3Floor: 1 },
      movedVsArm2: { nodes: true, listeners: true },
      movedVsFloor: { nodes: true, listeners: true },
    });
  });

  it('no element carrying any M8 class exists anywhere in arm 2`s shadow root — and arm 3 carries the toolbar', () => {
    // The structural half, with its firing control in the same object. `badges: 0` on BOTH arms is
    // the measured consequence of the identity `runReader` derived from the runner's URL, which is
    // carried here so the zero is read beside its reason.
    expect({
      identityIsAnAgentFile: cs.identity === 'CLAUDE.md' || cs.identity === 'AGENTS.md',
      arm2: m8Footprint(cs.bareEnhanced.host.shadowRoot!),
      arm3: m8Footprint(cs.tableEnhanced.host.shadowRoot!),
    }).toEqual({
      identityIsAnAgentFile: false,
      arm2: NO_M8_FOOTPRINT,
      arm3: { ...ENHANCED_M8_FOOTPRINT, badges: 0 },
    });
  });
});

// ── The layout spies ──────────────────────────────────────────────────────────────────────────
//
// The five APIs D-11 (i) names (`getClientRects` included: it is the same forced reflow by another
// name, and leaving it out would let the one substitution nobody would notice through). Patched on
// the prototypes rather than on an instance, so a read of ANY element is caught — including one
// the enhancer created and has not inserted.

interface LayoutCounts {
  getBoundingClientRect: number;
  getClientRects: number;
  getComputedStyle: number;
  offsetWidth: number;
  offsetHeight: number;
}

const NO_LAYOUT_READS: LayoutCounts = {
  getBoundingClientRect: 0,
  getClientRects: 0,
  getComputedStyle: 0,
  offsetWidth: 0,
  offsetHeight: 0,
};

function installLayoutSpies(): {
  read: () => LayoutCounts;
  since: (base: LayoutCounts) => LayoutCounts;
  restore: () => void;
} {
  const counts: LayoutCounts = { ...NO_LAYOUT_READS };

  const rect = Element.prototype.getBoundingClientRect;
  const rects = Element.prototype.getClientRects;
  const computed = window.getComputedStyle;
  const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
  const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;

  Element.prototype.getBoundingClientRect = function patched(this: Element): DOMRect {
    counts.getBoundingClientRect += 1;
    return rect.call(this);
  };
  Element.prototype.getClientRects = function patched(this: Element): DOMRectList {
    counts.getClientRects += 1;
    return rects.call(this);
  };
  window.getComputedStyle = function patched(
    ...args: Parameters<typeof window.getComputedStyle>
  ): CSSStyleDeclaration {
    counts.getComputedStyle += 1;
    return computed.apply(window, args);
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    ...width,
    get(this: HTMLElement): number {
      counts.offsetWidth += 1;
      return width.get!.call(this) as number;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    ...height,
    get(this: HTMLElement): number {
      counts.offsetHeight += 1;
      return height.get!.call(this) as number;
    },
  });

  const read = (): LayoutCounts => ({ ...counts });
  return {
    read,
    since: (base) => ({
      getBoundingClientRect: counts.getBoundingClientRect - base.getBoundingClientRect,
      getClientRects: counts.getClientRects - base.getClientRects,
      getComputedStyle: counts.getComputedStyle - base.getComputedStyle,
      offsetWidth: counts.offsetWidth - base.offsetWidth,
      offsetHeight: counts.offsetHeight - base.offsetHeight,
    }),
    restore: () => {
      Element.prototype.getBoundingClientRect = rect;
      Element.prototype.getClientRects = rects;
      window.getComputedStyle = computed;
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', width);
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height);
    },
  };
}
