// THE GANTT DATE AXIS DOES NOT OVERPRINT — real engines, Chromium AND Firefox (the 9.1 walk's
// SECOND human-gate finding, M7:2).
//
// ── THE DEFECT, AND WHY THE OBSERVABLE IS A BOUNDING BOX ──────────────────────────────────────
//
// The 9.1 walk saw the gantt's date ticks stacked on top of one another into an unreadable smear,
// at BOTH themes and on BOTH engines, on the SPARSE `diagrams-10` gantt (three days, three tasks) —
// so it is a product defect, not a dense-fixture artifact. The mechanism is mermaid's own:
//
//   `ganttDiagram-NO4QXBWP.mjs:1508`   w = elem.parentElement.offsetWidth
//   `ganttDiagram-NO4QXBWP.mjs:1512`   if (conf.useWidth !== undefined) w = conf.useWidth
//
// The gantt is the ONLY diagram type in all of mermaid that asks its PARENT how wide to be, and
// D-6 step 1's measuring container (`createMeasureContainer`) sets no width by design. So the
// container shrink-wraps the `<svg>`'s replaced-element intrinsic default and the axis lays out at
// **300** — mermaid's own `w === undefined -> 1200` fallback never fires, because 0 is not
// undefined and 300 is not 0. d3 picks tick COUNT by count, never by pixels, and mermaid never
// thins ticks: it only scales. Thirteen `2026-08-01` labels are therefore drawn into 300 units.
//
// The defect is a LAYOUT property, so the assertion is a layout one: adjacent tick `<text>` boxes
// must not intersect. Nothing about colour, nothing about the string — two labels that occupy the
// same pixels are illegible whatever they say, and that is exactly what the human saw.
//
// ── WHY WIDTH ALONE IS NOT THE FIX (measured, and why this file asserts the format too) ───────
//
// A prior session measured three container widths on this same sparse fixture: none -> 12 of 12
// adjacent labels overlap; 700px -> 12 of 12; 1200px -> 0. The reading column is 684px
// (`--reader-measure` 748 minus the reader's 32px side padding, `readerCss.ts:83,87`) and 684 sits
// INSIDE the overlapping regime. Nor does any larger constant fix the general case: required width
// grows with the gantt's span, and `useMaxWidth` then scales an over-wide layout back DOWN, shrinking
// the glyph below its designed size — an illegibility defect traded for an overlap one.
//
// So the lever is the axis FORMAT (`gantt.axisFormat: '%b %d'`, short labels), and it needs a layout
// width to work IN (`gantt.useWidth`, the 684 design width). Both, or neither works. This file
// asserts the pair through the PRODUCTION path and then proves the three properties the choice of a
// CONSTANT width rests on: it survives being scaled down, the author can still override it, and the
// un-fixed geometry really does overlap.
//
// ── THE FOUR ARMS ─────────────────────────────────────────────────────────────────────────────
//
//   1. PRODUCTION PATH — `mount` + `enhanceDiagrams`, the real width-less measuring container, no
//      hand-set width anywhere. 0 overlaps. This is the arm the fix exists for.
//   2. THE ABLATION / FIRING CONTROL — the SAME document through the SAME production path with the
//      pre-fix geometry restated as explicit config (`useWidth: 300`, `axisFormat: '%Y-%m-%d'`).
//      It must report MANY overlaps. Without it, "0 overlaps" could be a broken detector: an
//      always-zero overlap count and a fixed axis are indistinguishable.
//   3. SCALED DISPLAY — the fixed rendering shown in a host NARROWER than 684. Still 0 overlaps.
//      This is the property the constant rests on: `useMaxWidth` scales the whole `<svg>` uniformly
//      through its viewBox, so glyphs shrink but their relative positions — and therefore their
//      overlaps — are preserved. Asserted rather than argued, and non-vacuous because the same test
//      proves the displayed width actually SHRANK.
//   4. AUTHOR PRECEDENCE — an in-fence `axisFormat %Y-%m-%d` still yields full-year labels
//      (`ganttDiagram-NO4QXBWP.mjs:1856-1862`: the db's user format is consulted BEFORE
//      `conf.axisFormat`). We set a DEFAULT, not a mandate, and the dropped year is recoverable by
//      any author who needs it.
//
// ── WHAT IS NOT FIXED HERE ────────────────────────────────────────────────────────────────────
//
// On a three-day gantt d3 lands on 6-hour ticks, so four consecutive ticks format to the same
// `Aug 01`. That is a REPEATED-LABEL artifact, not an overprint: the labels are legible and do not
// intersect. Fixing it needs a span-dependent `tickInterval`, a different and harder mechanism, and
// it is filed as its own carried polish rather than bundled here.

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import mermaid from 'mermaid';
import { mount } from '../../src/render/mount';
import { DIAGRAM_MEASURE_CLASS, enhanceDiagrams } from '../../src/render/diagramEnhancer';
import type {
  DiagramEngine,
  DiagramEngineConfig,
  DiagramEngineModule,
  EngineLoader,
} from '../../src/render/diagramEngine';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR } from '../../src/render/diagramView';
import { clearDiagramCache } from '../../src/app/store';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

/** `tests/golden/fixtures/diagrams-10.md`'s gantt — the SPARSE one the walk judged: three days,
 *  three tasks. `title` varies per arm so no two arms can share a D-3 cache row (the key is
 *  source + theme + engine version, and a hit would serve one arm's picture to another). */
const sparseGantt = (title: string, extra = ''): string =>
  '```mermaid\ngantt\n' +
  `  title ${title}\n` +
  '  dateFormat YYYY-MM-DD\n' +
  `${extra}` +
  '  section Fence 6\n' +
  '  parse     :p6, 2026-08-01, 1d\n' +
  '  sanitize  :s6, after p6, 1d\n' +
  '  adopt     :a6, after s6, 1d\n' +
  '```\n';

const doc = (fence: string): string =>
  `# Gantt document\n\nProse before the fence.\n\n${fence}\nProse after the fence.\n`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const cleanup: HTMLElement[] = [];

/**
 * The real engine behind our own handle, with an optional `gantt` OVERRIDE merged over whatever
 * `diagramEngineConfigFor` produced.
 *
 * The override is how the ablation restates the pre-fix geometry EXPLICITLY (`useWidth: 300`,
 * `axisFormat: '%Y-%m-%d'`) rather than by deleting keys: `mermaid.initialize` MERGES into a site
 * config that persists across renders, so "the key is absent" is not a state a later test can
 * reliably return the engine to. Every arm therefore sets both keys outright and no arm can inherit
 * another's. Wrapping rather than patching the singleton matters — sibling suites in this project
 * import the same mermaid instance.
 */
function engineWith(ganttOverride?: Record<string, unknown>): EngineLoader {
  const engine: DiagramEngine = {
    initialize: (config: DiagramEngineConfig) => {
      const base = config as unknown as { gantt?: Record<string, unknown> };
      const merged = ganttOverride
        ? { ...config, gantt: { ...base.gantt, ...ganttOverride } }
        : config;
      mermaid.initialize(merged as never);
    },
    render: async (id, definition, container) => await mermaid.render(id, definition, container),
  };
  return async () => ({ default: engine }) as unknown as DiagramEngineModule;
}

/** mount + enhance by hand — D-12's second call site, the only seam an injected loader enters by,
 *  and the one that goes through the REAL width-less measuring container. `width` sizes the HOST,
 *  never the container: arm 3 needs a narrow viewport, not a narrow measurement. */
function enhancedHost(markdown: string, loader: EngineLoader, width?: string): ShadowRoot {
  const host = document.createElement('div');
  if (width !== undefined) host.style.width = width;
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host, { loader });
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return host.shadowRoot;
}

/** Wait until no fence is still `pending` — `diagramRender.browser.test.ts:302`'s helper. */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await sleep(25);
  }
  throw new Error('enhancement never completed');
}

/**
 * The date axis's tick labels, in painted order.
 *
 * `g.grid` is the group mermaid calls the d3 axis into (`ganttDiagram-NO4QXBWP.mjs:1914`), and a
 * gantt without `topAxis` has exactly ONE — asserted, because silently reading the wrong group (or
 * an empty selection) is precisely how this file would go vacuous.
 */
function axisTicks(shadow: ShadowRoot): SVGTextElement[] {
  const svg = shadow.querySelector(`${FIGURE_SELECTOR} svg`);
  expect(svg, 'the fence did not render an <svg> at all').not.toBeNull();
  const grids = svg!.querySelectorAll('g.grid');
  expect(grids.length, 'expected exactly one axis group on a gantt without a top axis').toBe(1);
  const texts = Array.from(grids[0].querySelectorAll<SVGTextElement>('g.tick text'));
  expect(texts.length, 'no date-axis tick labels — the detector would be vacuous').toBeGreaterThan(4);
  return texts;
}

/**
 * How many ADJACENT tick labels intersect, measured on painted boxes rather than on the SVG's own
 * coordinates — a `viewBox` scale is invisible in user units and is the whole subject of arm 3.
 *
 * Sorted by `left` because "adjacent" is a property of the painted row, not of document order, and
 * a half-pixel of tolerance because sub-pixel text metrics differ between the two engines and a
 * hairline touch is not what the human saw.
 */
function overlapCount(texts: SVGTextElement[]): number {
  const boxes = texts.map((t) => t.getBoundingClientRect()).sort((a, b) => a.left - b.left);
  let overlaps = 0;
  for (let i = 1; i < boxes.length; i += 1) {
    if (boxes[i].left < boxes[i - 1].right - 0.5) overlaps += 1;
  }
  return overlaps;
}

const labelsOf = (texts: SVGTextElement[]): string[] => texts.map((t) => t.textContent ?? '');

beforeEach(async () => {
  await clearDiagramCache();
});

afterEach(async () => {
  await clearDiagramCache();
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN — a render still in flight owns a measuring container in the light DOM, and a stray one
  // reads as the NEXT test's container (`diagramRender.browser.test.ts`'s afterEach, verbatim).
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await sleep(25);
  }
});

describe('gantt date axis — legibility is a layout property', () => {
  it('lays out adjacent date ticks without overprinting, through the production path', async () => {
    const shadow = enhancedHost(doc(sparseGantt('Production path')), engineWith());
    await settleDiagrams(shadow);

    const ticks = axisTicks(shadow);
    expect(
      overlapCount(ticks),
      `adjacent date ticks overprint — the 9.1 walk's smear. Labels: ${labelsOf(ticks).join(' | ')}`,
    ).toBe(0);
  });

  it('ABLATION: the pre-fix geometry (300 units, full-date labels) really does overprint', async () => {
    const shadow = enhancedHost(
      doc(sparseGantt('Ablation')),
      engineWith({ useWidth: 300, axisFormat: '%Y-%m-%d' }),
    );
    await settleDiagrams(shadow);

    const ticks = axisTicks(shadow);
    // The FIRING CONTROL for every `toBe(0)` in this file. Not a tight count — the exact number
    // depends on d3's tick choice and on engine text metrics — but "most adjacent pairs collide"
    // is the defect, and a detector that cannot report it proves nothing when it reports zero.
    expect(
      overlapCount(ticks),
      'the un-fixed geometry reported no overlaps — the detector is broken, and the 0 asserted ' +
        'elsewhere in this file is meaningless',
    ).toBeGreaterThan(ticks.length / 2);
  });

  it('stays un-overprinted when the column is NARROWER than the design width', async () => {
    // 400px of host: the reader's own 32px side padding leaves ~336 of column, so `useMaxWidth`
    // must scale the 684-unit layout down by roughly half.
    const shadow = enhancedHost(doc(sparseGantt('Scaled display')), engineWith(), '400px');
    await settleDiagrams(shadow);

    const svg = shadow.querySelector(`${FIGURE_SELECTOR} svg`) as SVGSVGElement;
    const painted = svg.getBoundingClientRect().width;
    // Non-vacuity: the scale actually happened. Without this the arm would pass on a diagram that
    // was never constrained at all, which is the same test as arm 1 wearing a narrow host.
    expect(painted, 'the <svg> was not scaled down — this arm would be arm 1 in disguise').toBeLessThan(
      500,
    );

    const ticks = axisTicks(shadow);
    expect(
      overlapCount(ticks),
      `scaling to ${Math.round(painted)}px re-introduced overprinting, which is the one property ` +
        'the fixed design width depends on. Labels: ' + labelsOf(ticks).join(' | '),
    ).toBe(0);
  });

  it('lets an in-fence axisFormat override our default — a default, not a mandate', async () => {
    const shadow = enhancedHost(
      doc(sparseGantt('Author precedence', '  axisFormat %Y-%m-%d\n')),
      engineWith(),
    );
    await settleDiagrams(shadow);

    const labels = labelsOf(axisTicks(shadow));
    expect(
      labels.every((l) => /^\d{4}-\d{2}-\d{2}$/.test(l)),
      `the author's own axisFormat did not survive our default. Labels: ${labels.join(' | ')}`,
    ).toBe(true);
  });
});
