// tablePlacement — the REAL-ENGINE RECT PROBE for the table toolbar's CONTAINMENT (008 task 3.5,
// D-12), Chromium AND Firefox, at BOTH `GEOMETRY_WIDTHS`. §3.11 rows 5 (INVERTS), 6 and 8.
//
// ══ WHY THIS IS A SEPARATE SUITE FROM 3.3's UNIT AND 3.4's STRUCTURE ══════════════════════════
//
// 3.3 asserted the CSS DECLARATION — that `.peekover-table-tools` states no `max-width` of its own
// — as a byte check on the shipped `READER_CSS` string. 3.4 asserted the toolbar's STRUCTURE — that
// it reaches the screen inside `.peekover-reader`, immediately before its `<table>`, through both
// app-page call sites — and deliberately read no rect and no computed style, because asserting a
// geometry at one incidental viewport would have ratified a geometry nobody had measured.
//
// ★ A RESOLVED VALUE IS jsdom-BLIND, AND THAT IS THE WHOLE REASON THIS FILE EXISTS. jsdom hands
// back the string it was handed: it applies no cascade, runs no layout, and returns all-zero rects.
// A declaration can be read there; a RESOLVED px cannot. Everything below reads
// `getBoundingClientRect()` and `getComputedStyle()`'s resolved output in a real engine — which is
// the difference between "the sheet says so" and "the engine did so".
//
// ══ ★ WHAT THE MEASUREMENT FOUND, AND HOW IT CHANGED THE ASSERTION ════════════════════════════
//
// Row 6 is carried in tasks.md as *"the toolbar's RESOLVED `max-width` equals `--reader-measure`
// (748px)"*. Measured, the engine does not report that, and the reason is not a defect:
//
//   • `max-width` IS NOT A CSS-INHERITED PROPERTY, and `.peekover-table-tools` declares none. Both
//     engines report `getComputedStyle(toolbar).maxWidth === 'none'`. The word "inherits" in
//     readerCss.ts and in plan §3.11 is the LOOSE sense — the toolbar takes its width bound from
//     the column that contains it — not the CSS cascade sense. Asserting a px value on the
//     toolbar's own `max-width` would assert a mechanism that does not exist.
//
//   • ★ AND THE COLUMN IS NOT ALWAYS AT THE MEASURE. `:host([data-toc="open"]) .peekover-reader`
//     (readerCss.ts:584-588) sets `width:auto` + `margin-right:var(--toc-w)`, and that rule's own
//     comment says it in as many words: *"on a narrow scrollport it takes what remains and on a
//     wide one it caps at the measure"*. Measured, with the rail OPEN:
//
//         1280 (host 912) → column 662px, content box 598px, toolbar 598px
//         1400 (host 1032) → column 748px, content box 684px, toolbar 684px
//
//     ★ SO `684` IS THE ANSWER THREE OF THE FOUR STATES HAND YOU. A row-6 assertion written as
//     that constant is GREEN at 1400 in both rail states and at 1280 collapsed, and RED at 1280
//     rail-open — a value pinned to an incidental state, which is finding 2's defect class one
//     axis over. That is why the rail state is this probe's SECOND axis and not an afterthought:
//     one width ratified nothing at 1.5, and one rail state ratifies nothing here.
//
// So row 6 is asserted as the RELATION plan §3.11's own row-6 cell states — *"the toolbar inherits
// the measure; a toolbar WIDER THAN THE MEASURE breaks the centring the variable exists to
// preserve"* — in four clauses: the toolbar declares no `max-width` of its own, the COLUMN's cap is
// `--reader-measure`, the toolbar's resolved width IS the column's content box, and it is never
// wider than the measure. Measured, not chosen: every number below was read off the engine first.
//
// ══ THE EMPTY HOST HAS ZERO HEIGHT, AND ROW 8 IS INSTRUMENTED AROUND THAT ═════════════════════
//
// The controls are 3.6-3.8, so the toolbar measured here is EMPTY and both engines give it
// `height: 0` (width 598/684, height 0.0). ★ A whole-rect overlap check against a zero-height box
// is VACUOUS — it clears every chrome on the page for free, which is the same "a zero rect clears
// everything trivially" trap the sibling suites guard with an explicit non-vacuity assertion.
// So row 8 — plan §3.11's *"Y via row 5's containment"* — is asserted on the toolbar's HORIZONTAL
// band, which is real (598/684px) and, being fixed by the column rather than by the contents, is
// the half that will still hold once 3.6-3.8 give the host a height. Two x-bands that do not
// intersect cannot produce overlapping rects at ANY height.
//
// ★ RECORDED, NOT PAPERED OVER — THE COLLAPSED RAIL HANDLE IS AN OVERLAY OVER THE WHOLE COLUMN.
// With `data-toc="collapsed"` the rail shrinks to its handle and stops reserving column width
// (readerCss.ts:557-563), so the handle floats OVER the column's top-right — measured at 1280,
// `.peekover-toc__toggle` [1120.9,129.2,1240,159.2] against the column [426,77.2,1174,696.2] and
// against the `<h1>` [458,133.2,1142,182.5]. That is a pre-existing 2.2-era condition of EVERY
// block in the column — the h1, the prose and the table all sit under it — not something the
// toolbar introduces, and not 3.5's to fix. Row 8 is therefore asserted with the rail OPEN, which
// is the state `diffChrome.browser.test.ts:374-384` forces for exactly the same reason, and the
// mode toggle — which the column clears in BOTH rail states — is asserted in both.
//
// ══ THE ABLATION CARRIES ITS OWN FIRING CONTROL ═══════════════════════════════════════════════
//
// Row 5's second half needs the first content block measured WITH and WITHOUT the toolbar, so the
// test removes the toolbar and re-reads. ★ "The h1 did not move" is worthless if the removal
// produced no reflow at all — an ablation that cannot move anything reads identical to one that
// moved nothing. The `<table>`'s own top edge is the control: it MUST move (measured: exactly 8px,
// the toolbar's `margin-bottom` released, both engines), and the test fails if it does not.
//
// ══ RED-FIRST (each verified by cp-aside + restore, never `git checkout`) ══════════════════════
//
//   row 6, clause 1   `max-width:900px` added to `.peekover-table-tools` → the toolbar reports a px
//                     value where it must report `none`; the bound stops being the column's.
//   rows 5 + 6 + 8    `min-width:calc(100% + 120px)` on the toolbar → 804px against a 748px measure:
//                     the containment reds, the width-equals-content-box clause reds, the
//                     never-wider-than-the-measure clause reds, and the row-8 x-band reds.
//   row 5, half 2     `tableEnhancer.ts`'s `table.before(toolbar)` → prepended to the column
//                     instead: the h1 moves down 30px and the first-block equality reds.
//
// ★ THE TWO ROW-5 HALVES HAVE DIFFERENT SIGNATURES, AND ONE RED DOES NOT COVER BOTH. tasks.md
// compresses them to *"red-first by letting it overflow the measure, whose signature is a first
// block that has moved"*. Measured, an overflow does NOT move the first block — a later sibling
// that overflows its container reflows nothing above it, and the h1's rect is byte-identical under
// the overflow ablation. The overflow's signature is the CONTAINMENT clause; a moved first block is
// a DIFFERENT defect (a toolbar inserted where it reflows preceding content) and gets its own
// ablation above. Two defects, two reds, each failing in its own units.
//
// ══ WHAT THIS SUITE DOES NOT DO ═══════════════════════════════════════════════════════════════
//
// No control geometry — sort, filter and copy are 3.6-3.8 and the host is empty here. No judgement
// about whether the strip READS as part of its table or as clutter above it: that is a walk, it is
// 6.1's, and this task measures without judging. Nothing here touches `src/`.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

// ── Geometry axes ─────────────────────────────────────────────────────────────────────────────

// `GEOMETRY_WIDTHS` copied from `diffChrome.browser.test.ts:83-86` rather than re-picked, on the
// same recovery-B1 reasoning `agentBadge.browser.test.ts:524-537` records: 1400 alone sat on the
// CLEAN side of the finding-2 collision, and 1280 is where the app pane's column goes flush-left.
const GEOMETRY_WIDTHS = [
  ['1280', { width: 1280, height: 900 }],
  ['1400', { width: 1400, height: 900 }],
] as const;

// ★ THE SECOND AXIS, AND IT IS NOT DECORATION. The rail's open state is what decides whether the
// column sits AT its measure or takes what is left beside the rail (readerCss.ts:584-588), and the
// two answers differ at 1280 — 748px collapsed against 662px open. A probe run in one rail state
// would pin whichever number that state happens to hand it. Row 8 needs the OPEN state besides,
// because a collapsed rail reserves no column width to clear.
const TOC_STATES = ['collapsed', 'open'] as const;

const CASES = GEOMETRY_WIDTHS.flatMap(([label, size]) =>
  TOC_STATES.map((toc) => [`${label} · rail ${toc}`, size, toc] as const),
);

/** Sub-pixel slack. Both engines agreed on every width below to the tenth of a px (598.0 / 684.0 /
 *  748.0 exactly), so this is tolerance for rounding, not for a disagreement being smoothed over. */
const EPS = 0.5;

// ── Fixture ───────────────────────────────────────────────────────────────────────────────────

/**
 * A GFM table with prose above and below it, and ★ TWO headings — `buildTocView` returns `null`
 * below 2 (`tocView.ts:520-527`), so a single-heading document has no rail at all and row 8 would
 * assert clearance from an element that is not there.
 *
 * The `<h1>` is the column's FIRST content block and the table is well below it: that ordering is
 * what makes row 5's second half a real question (a toolbar that reflowed what precedes it would
 * move the h1) rather than a tautology.
 */
const TABLE_DOC = [
  '# Report',
  '',
  'Intro paragraph, above the table and above the toolbar.',
  '',
  '## Numbers',
  '',
  '| col | n |',
  '| --- | --- |',
  '| a | 1 |',
  '| b | 2 |',
  '',
  '## After',
  '',
  'Trailing prose, below the table.',
  '',
].join('\n');

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

const flush = (): Promise<void> =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

const containers: HTMLElement[] = [];

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

/**
 * Open the app page on the fixture and settle it into `toc` — the real gesture chain (mount the
 * shell, open the folder, click the file), never a direct `selectFile`, so the toolbar under
 * measurement is the one call site 1 produced.
 *
 * ★ THE `flush()` BEFORE THE ATTRIBUTE IS LOAD-BEARING, and it is `diffChrome.browser.test.ts`'s
 * own note: `tocView`'s width-derived initial state lands a frame later and stomps an early
 * `data-toc` write back. Setting it after the frame is what makes the rail state the one measured.
 */
async function openAt(
  size: { width: number; height: number },
  toc: string,
): Promise<HTMLElement> {
  await page.viewport(size.width, size.height);
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: sourceOf([
      { path: 'report.md', name: 'report.md', read: async () => TABLE_DOC },
    ]) }),
    store: fakeStore(),
  });
  await app.openFolder();

  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === 'report.md')!;
  btn.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  await flush();
  host.setAttribute('data-toc', toc);
  await flush();
  return host;
}

const columnOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
const toolbarOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${TABLE_TOOLBAR_CLASS}`)!;

/**
 * The column's first block OF THE DOCUMENT — the first child that is not the toolbar itself.
 *
 * ★ NOT `firstElementChild`, and the difference is the whole assertion. Taking the literal first
 * child makes a toolbar prepended into the column ITS OWN first block: the target becomes the
 * zero-height strip, the non-vacuity guard trips on that instead, and the equality clause — the
 * one that would have reported the h1 moved down 30px — never runs. Verified: under exactly that
 * ablation the suite went red on *"the first content block has no height"* and said nothing about
 * anything moving. A cheap guard ahead of the real check swallowing its red is how an instrument
 * gets masked; the clause that finds the defect has to be the clause seen to fail.
 */
const firstBlockOf = (col: HTMLElement) =>
  col.querySelector<HTMLElement>(`:scope > *:not(.${TABLE_TOOLBAR_CLASS})`)!;

/** The column's CONTENT box — its rect minus its own horizontal padding. `box-sizing:border-box`
 *  is global in this sheet (readerCss.ts:73), so the 748px measure INCLUDES the 32px padding and
 *  the box a child fills is 64px narrower. Derived from the engine's own numbers, never assumed. */
function contentBoxOf(col: HTMLElement): { left: number; right: number; width: number } {
  const rect = col.getBoundingClientRect();
  const cs = getComputedStyle(col);
  const left = rect.left + parseFloat(cs.paddingLeft);
  const right = rect.right - parseFloat(cs.paddingRight);
  return { left, right, width: right - left };
}

/** `--reader-measure` as a number, read off the live host rather than restated from the sheet. */
function measurePxOf(host: HTMLElement): number {
  const raw = getComputedStyle(host).getPropertyValue('--reader-measure').trim();
  expect(raw, '--reader-measure is not a resolved length').toMatch(/^\d+(\.\d+)?px$/);
  return parseFloat(raw);
}

const fmt = (r: DOMRect): string =>
  `[${r.left.toFixed(1)},${r.top.toFixed(1)},${r.right.toFixed(1)},${r.bottom.toFixed(1)}]`;

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
}

beforeEach(reset);
afterEach(reset);

// ══ HARNESS SANITY ════════════════════════════════════════════════════════════════════════════
//
// Every geometry case below reads a rect off a toolbar the app page produced. If the toolbar
// stopped arriving, those cases would fail on a null dereference and look like a geometry defect.
// This is the control that separates the two readings — and it also pins the two preconditions the
// fixture is built for: a rail exists (>= 2 headings) and the `<h1>` is the column's first block.

describe('harness sanity — the surface really produces what the probe measures', () => {
  it('a toolbar, a rail, and an h1 as the column`s first content block', async () => {
    const host = await openAt({ width: 1400, height: 900 }, 'open');
    const col = columnOf(host);
    expect(toolbarOf(host), 'no toolbar — every geometry case below would be measuring nothing')
      .not.toBeNull();
    expect(col.querySelectorAll('table')).toHaveLength(1);
    expect(firstBlockOf(col)?.tagName, 'the fixture`s first block is not the h1').toBe('H1');
    expect(
      host.shadowRoot!.querySelector('.peekover-toc__toggle'),
      'no TOC rail — the fixture dropped below buildTocView`s 2-heading floor',
    ).not.toBeNull();
  });
});

// ══ ROW 6 — THE WIDTH BOUND IS THE COLUMN'S, NEVER ONE OF THE TOOLBAR'S OWN ═══════════════════

describe.each(CASES)('3.5 · row 6 — the resolved width bound at %s', (label, size, toc) => {
  it('the toolbar declares no max-width, fills the column`s content box, and never exceeds the measure', async () => {
    const host = await openAt(size, toc);
    const col = columnOf(host);
    const bar = toolbarOf(host);

    const measure = measurePxOf(host);
    const content = contentBoxOf(col);
    const barRect = bar.getBoundingClientRect();

    // Non-vacuous: a zero-width toolbar or an unresolved measure would satisfy the bounds below
    // for free. Both are read from the engine before anything is compared against them.
    expect(barRect.width, 'the toolbar has no width to bound').toBeGreaterThan(0);
    expect(measure, '--reader-measure did not resolve').toBeGreaterThan(0);

    // CLAUSE 1 — the toolbar states no max-width of its own, so the bound can only come from the
    // column. This is 3.3's declaration read back as the engine RESOLVED it; a toolbar given its
    // own cap reports a px value here and the mechanism row 6 names stops being true.
    expect(
      getComputedStyle(bar).maxWidth,
      'the toolbar carries a max-width of its own — its bound is no longer the column`s',
    ).toBe('none');

    // CLAUSE 2 — the cap that DOES bound it is the column's, and it is `--reader-measure`. This is
    // `diffChrome.browser.test.ts:498`'s coupling re-read here, because it is the toolbar's bound
    // and not merely the column's: if someone re-points the column's max-width, the toolbar moves.
    expect(getComputedStyle(col).maxWidth).toBe(`${measure}px`);

    // CLAUSE 3 — the toolbar resolves to exactly the column's content box. ★ NOT to a constant:
    // 598px at 1280 with the rail open, 684px in the other three states, and both are correct.
    expect(
      barRect.width,
      `toolbar ${barRect.width} != column content box ${content.width} at ${label}`,
    ).toBeCloseTo(content.width, 1);

    // CLAUSE 4 — the property plan §3.11 row 6 states as the consequence: a toolbar wider than the
    // measure breaks the centring `--reader-measure` exists to preserve.
    expect(
      barRect.width,
      `toolbar ${barRect.width} exceeds the measure ${measure} at ${label}`,
    ).toBeLessThanOrEqual(measure + EPS);
  });
});

// ══ ROW 5 (INVERTS) — CONTAINMENT, NOT CLEARANCE ══════════════════════════════════════════════

describe.each(CASES)('3.5 · row 5 — containment at %s', (label, size, toc) => {
  it('the toolbar stays within the column`s content box on every edge', async () => {
    const host = await openAt(size, toc);
    const col = columnOf(host);
    const bar = toolbarOf(host);

    const colRect = col.getBoundingClientRect();
    const content = contentBoxOf(col);
    const barRect = bar.getBoundingClientRect();

    // Non-vacuous on the axis being asserted: the toolbar has a real horizontal extent, and the
    // column a real box. (Its HEIGHT is legitimately 0 — the host is empty until 3.6-3.8 — which
    // is why nothing here is phrased as a whole-rect overlap test.)
    expect(barRect.width).toBeGreaterThan(0);
    expect(colRect.width).toBeGreaterThan(0);
    expect(colRect.height).toBeGreaterThan(0);

    const detail = `toolbar ${fmt(barRect)} vs column content [${content.left.toFixed(1)},${content.right.toFixed(1)}] / box ${fmt(colRect)} at ${label}`;
    expect(barRect.left, `overflows LEFT: ${detail}`).toBeGreaterThanOrEqual(content.left - EPS);
    expect(barRect.right, `overflows RIGHT: ${detail}`).toBeLessThanOrEqual(content.right + EPS);
    expect(barRect.top, `above the column: ${detail}`).toBeGreaterThanOrEqual(colRect.top - EPS);
    expect(barRect.bottom, `below the column: ${detail}`).toBeLessThanOrEqual(colRect.bottom + EPS);
  });

  it('the column`s first content block does not move when the toolbar arrives', async () => {
    const host = await openAt(size, toc);
    const col = columnOf(host);
    const bar = toolbarOf(host);
    const first = firstBlockOf(col);
    const table = col.querySelector('table')!;

    // Non-vacuous: a zero-rect first block would compare equal to itself for free.
    const before = first.getBoundingClientRect();
    expect(before.width, 'the first content block has no width').toBeGreaterThan(0);
    expect(before.height, 'the first content block has no height').toBeGreaterThan(0);
    const tableBefore = table.getBoundingClientRect();

    // The ablation — the same document, with the toolbar taken back out. `getBoundingClientRect`
    // forces layout synchronously, so the reads below are of the reflowed tree.
    bar.remove();
    const after = first.getBoundingClientRect();
    const tableAfter = table.getBoundingClientRect();

    // ★ THE FIRING CONTROL, BEFORE THE ASSERTION IT GUARDS. "The h1 did not move" proves nothing
    // unless the removal reflowed SOMETHING; the table is what must move, by the toolbar's
    // released `margin-bottom`. An ablation that cannot move anything is not a measurement.
    expect(
      tableAfter.top,
      `the ablation did not reflow: table ${fmt(tableBefore)} -> ${fmt(tableAfter)} at ${label}`,
    ).not.toBeCloseTo(tableBefore.top, 1);

    // THE ASSERTION. All four edges: "off-measure" is a horizontal claim and "pushed down" a
    // vertical one, and the toolbar must do neither to what precedes it.
    const detail = `first block ${fmt(before)} -> ${fmt(after)} at ${label}`;
    expect(after.left, `left moved: ${detail}`).toBeCloseTo(before.left, 1);
    expect(after.right, `right moved: ${detail}`).toBeCloseTo(before.right, 1);
    expect(after.top, `top moved: ${detail}`).toBeCloseTo(before.top, 1);
    expect(after.bottom, `bottom moved: ${detail}`).toBeCloseTo(before.bottom, 1);
  });
});

// ══ ROW 8 — VIA ROW 5's CONTAINMENT ═══════════════════════════════════════════════════════════

describe.each(GEOMETRY_WIDTHS)('3.5 · row 8 — the toolbar clears the rail and the toggle at %s', (
  label,
  size,
) => {
  it('with the rail OPEN, the toolbar`s horizontal band clears both, at any height it later grows', async () => {
    const host = await openAt(size, 'open');
    const bar = toolbarOf(host);
    const barRect = bar.getBoundingClientRect();
    const shadow = host.shadowRoot!;

    // ★ The x-band is the instrument, and the reason is above: the EMPTY host is zero-height, so a
    // rect-overlap check would clear everything for free. Disjoint x-bands cannot overlap at ANY
    // height — so this is the clause that survives 3.6-3.8 filling the host.
    expect(barRect.width, 'no horizontal band to clear with').toBeGreaterThan(0);

    let compared = 0;
    for (const [name, sel] of [
      ['TOC rail', '.peekover-toc'],
      ['TOC handle', '.peekover-toc__toggle'],
      ['TOC list', '.peekover-toc__list'],
      // KEEPS: the table toolbar's band clears the TOC rail (C280). RE-SPELLED at 013 task 4.5: the mode-toggle
      // entry is dropped — no mode pill on the app page (`pills: false`), and an absent entry would skip silently.
    ] as const) {
      const el = shadow.querySelector<HTMLElement>(sel);
      if (!el || el.hidden) continue;
      const other = el.getBoundingClientRect();
      if (other.width === 0 || other.height === 0) continue;
      compared += 1;
      const overlaps = barRect.left < other.right && other.left < barRect.right;
      expect(
        overlaps,
        `x-band overlap: toolbar [${barRect.left.toFixed(1)},${barRect.right.toFixed(1)}] vs ${name} [${other.left.toFixed(1)},${other.right.toFixed(1)}] at ${label}`,
      ).toBe(false);
    }
    // The loop really compared something — an all-absent rail would clear the band for free, and
    // that is exactly the vacuity the >= 2-heading fixture exists to prevent.
    expect(compared, 'no chrome was on screen to clear').toBeGreaterThanOrEqual(3);

    // Row 8 is "Y VIA ROW 5's CONTAINMENT", so the containment is asserted in the same breath:
    // the band above is the column's band, and the toolbar is inside it.
    const content = contentBoxOf(columnOf(host));
    expect(barRect.left).toBeGreaterThanOrEqual(content.left - EPS);
    expect(barRect.right).toBeLessThanOrEqual(content.right + EPS);
  });

  // RETIRED (C279) at 013 task 4.5: "the mode toggle is clear in BOTH rail states" — Read / Raw are the toolbar's,
  // outside the reader pane; the app page builds no mode pill (`pills: false`).
});
