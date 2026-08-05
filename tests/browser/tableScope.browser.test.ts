// tableScope — D-8's EXCLUSIONS and D-9's PER-RENDER DEGRADATION, in a real engine (008 task 3.9,
// §3.11 rows 13 and 14). Chromium AND Firefox.
//
// ══ WHAT THIS TASK IS, AND WHY IT ADDS NO PRODUCTION BYTE ═════════════════════════════════════
//
// D-8 and D-9 are the two properties `enhanceTables`'s SHAPE already makes true. Neither is a
// branch anybody wrote, and that is the decision rather than an accident:
//
//   • D-8 — `enhanceTables` queries `.peekover-reader` (`tableEnhancer.ts:181`) and walks THAT.
//     The diff view and the raw view are SIBLINGS of the reading column in the same shadow root
//     (`diffView.ts:148-159`, `readerMode.ts:66-74`), so they are excluded BY CONSTRUCTION. Plan
//     D-8's own words: *"there is no entry-condition branch here to get wrong, and adding one
//     would be the thing that could rot."*
//   • D-9 — `mount()` builds a fresh `root` (`mount.ts:140-142`) and commits it with
//     `shadow.replaceChildren(...children)` (`:210`). Every `<table>` and every `<tr>` on the
//     screen after a watch re-render is new DOM parsed from the new source, so §7-4's *"wrong
//     rows in the right order"* has no surviving row to be wrong with. `preserveReading` carries
//     the scroll anchor and the view mode and nothing else (`:208, :215, :228`).
//
// ★ SO THE WHOLE TASK IS THE ASSERTIONS. `src/` is untouched, and both bundles are byte-identical
// to 3.8's. A property that costs nothing to hold still costs a test to KNOW you hold it — and
// both of these are one careless line away from being false, which is what the four ablations
// below were run to show.
//
// ══ ★ WHY THE DIFF LEG IS THE ONE THAT CARRIES THE RED, AND THE RAW LEG IS NOT ════════════════
//
// The two exclusions are NOT symmetrical, and saying so is the difference between a suite that
// means something and one that reports green twice:
//
//   • THE DIFF VIEW CONTAINS REAL `<table>` ELEMENTS. `renderHunk` (`diffView.ts:119-128`) runs
//     `sanitize(parse(hunk.lines.join('\n')))` — the FULL parser — so a hunk holding a complete
//     markdown table produces a genuine `<table>` inside `.peekover-diff`. It is enhanceable in
//     every respect except its address. Widen the query one element (`.peekover-reader` →
//     the shadow root) and it grows a toolbar and three sort buttons. That red IS D-8's argument:
//     the scoping is REQUIRED, not defensive.
//   • THE RAW VIEW CONTAINS NONE. `ensureRawView` sets `pre.textContent = source` — the markdown
//     is TEXT, never parsed — so the table's pipes are on the screen and no `<table>` element
//     exists to walk. Its exclusion is OVER-DETERMINED: the address AND the absence. The widening
//     ablation does not red it, and this file does not pretend otherwise. What it asserts instead
//     is the pair that makes the claim non-vacuous: the table's SOURCE really is in there, and
//     `<table>` element count is zero. A "no toolbar" assertion alone, over a subtree that could
//     not have grown one, would be a green that discriminates nothing.
//
// ══ THE FOUR ABLATIONS, EACH cp-aside + RESTORE ON `tableEnhancer.ts` ═════════════════════════
//
//   A1  the walk widened to the shadow root         → the diff's table grows a toolbar + 3 sorts
//   A2  the walk narrowed to a selector matching    → the reading column's OWN table loses its
//       nothing (the too-broad exclusion)              toolbar — the precision clause fires
//   A3  the sorted rows carried across a re-render  → an OLD-source row sitting in the NEW table
//   A4  the installers handed a captured `<table>`  → the rebuilt toolbar's click mutates nothing
//
// A1/A2 are the two directions of "excludes exactly the right set". A3 is D-9's revert-and-fail
// (row 13's inverse — state deliberately does NOT survive). A4 is row 14 (closure death).
//
// ══ ★ ONE INSTRUMENT PER PROPERTY, BECAUSE A CHEAP GUARD IN FRONT SWALLOWS THE RED ════════════
//
// Paid for six times in this milestone. Every property below is asserted by ONE `expect` whose
// value carries every part of the claim at once — a matrix, or an object of counts — rather than
// by a ladder of narrow checks where the first one to fail hides the one written to find the
// defect. The re-render cases wait on the `<h1>`, which is NOT under test, precisely so the table
// assertion runs in the ablated arm instead of timing out ahead of it.
//
// Selectors are BY CLASS ALONE, never tag-qualified: `button.peekover-table-sort` cannot falsify
// "it IS a button", and the shape clause written to catch that never runs.
//
// ══ THE DIFF IS ENTERED THROUGH PRODUCTION'S OWN COMPOSITION ══════════════════════════════════
//
// `enterDiff(host, computeDiff(before, after))` is `appShell.ts:983` verbatim — the `showDiff`
// closure the app page registers. The picker → snapshot → IndexedDB route in FRONT of that
// closure is `diffChrome.browser.test.ts`'s subject and adds nothing here: what is under test is
// where the walk goes once a `.peekover-diff` exists, not how the user asked for one.
//
// ★ AND IN PRODUCTION TODAY THE WALK IS NEVER RUN WHILE A DIFF IS OPEN — a change arriving during
// a displayed comparison is DEFERRED to the exit (D-11, task 6.3), and `exitDiff` removes the
// view before anything re-renders. That is a TIMING accident of one surface at one moment, and it
// is exactly why D-8 is asserted structurally instead: the day a fifth call site or an eager
// re-render changes that timing, the scoping is what still holds, and A1 is what proves it is the
// scoping doing the holding.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import {
  TABLE_STATE_ATTR,
  TABLE_TOOLBAR_CLASS,
  enhanceTables,
} from '../../src/render/tableEnhancer';
import {
  FILTER_FIELD_CLASS,
  SORT_BUTTON_CLASS,
} from '../../src/render/tableTools';
import { computeDiff } from '../../src/render/diffEngine';
import { DIFF_VIEW_CLASS, enterDiff, exitDiff } from '../../src/render/diffView';
import { WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const TABLE_LINES = [
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
];

/** What the reader has open. `n` is 10 / 9 / 2, so a sort by `n` MOVES every row. */
const DOC_A = ['# Report', '', ...TABLE_LINES, '', 'The trailing line, as it was.', ''].join('\n');

/**
 * The diff's "before" side. It differs from `DOC_A` ONLY BELOW THE TABLE, so `computeDiff` puts
 * the heading, the blank line and all five table lines into ONE `unchanged` hunk — which
 * `renderHunk` then parses into a COMPLETE, REAL `<table>` inside `.peekover-diff`. That is the
 * fixture property D-8's whole argument depends on, and it is asserted rather than assumed below.
 */
const DIFF_BEFORE = ['# Report', '', ...TABLE_LINES, '', 'The trailing line, as it WAS.', ''].join(
  '\n',
);

/**
 * What the file BECOMES on disk while the reader is watching it.
 *
 * ★ NO NAME AND NO NUMBER IS SHARED WITH `DOC_A`. That is what makes D-9's defect legible in its
 * own units: a row reading `zoe` in a table built from this source is unmistakably an OLD row in
 * a NEW table, not a coincidence of ordering.
 *
 * The `<h1>` changes too, and it is the RE-RENDER SIGNAL the waits below key off — never the
 * table, which is the thing under test.
 */
const DOC_B = [
  '# Report — rewritten',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| ops | quinn | 7 |',
  '| eng | rae | 4 |',
  '| eng | sol | 12 |',
  '',
  'The trailing line, rewritten.',
  '',
].join('\n');

/** `DOC_A`'s rows in DOCUMENT order, and in sort-by-`n`-ascending order. Disjoint by construction. */
const A_DOCUMENT_ORDER = [
  ['eng', 'zoe', '10'],
  ['eng', 'adam', '9'],
  ['ops', 'bo', '2'],
];
const A_SORTED_BY_N = [
  ['ops', 'bo', '2'],
  ['eng', 'adam', '9'],
  ['eng', 'zoe', '10'],
];

/** `DOC_B`'s rows, the same two ways. */
const B_DOCUMENT_ORDER = [
  ['ops', 'quinn', '7'],
  ['eng', 'rae', '4'],
  ['eng', 'sol', '12'],
];
const B_SORTED_BY_N = [
  ['eng', 'rae', '4'],
  ['ops', 'quinn', '7'],
  ['eng', 'sol', '12'],
];

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 600): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── The app-page harness (the production gesture chain — never a direct `selectFile`) ─────────

const containers: HTMLElement[] = [];

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/**
 * `persistable: true` is what `watchCapability` (`watchAvailability.ts:149`) reads to decide the
 * app page can watch at all — so it is what puts a REAL watch pill in the shadow root and a REAL
 * `createWatchController({render: renderWithEnhancements})` in the registry. Without it there is
 * no toggle and D-9's re-render has no production seam to arrive through.
 */
function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

interface Opened {
  host: HTMLElement;
  /** Swap what the file reads as, from the next poll onwards. */
  setText(next: string): void;
  /** How many times production has called `read()` — the detector's baseline poll is countable. */
  reads(): number;
}

async function openDoc(doc: string): Promise<Opened> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  let text = doc;
  let reads = 0;
  const app = mountAppShell(container, {
    openFolder: async () => ({
      ok: true,
      source: sourceOf([
        {
          path: 'report.md',
          name: 'report.md',
          read: async () => {
            reads += 1;
            return text;
          },
        },
      ]),
    }),
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
  return {
    host,
    setText: (next) => {
      text = next;
    },
    reads: () => reads,
  };
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
const columnOf = (host: HTMLElement) => shadowOf(host).querySelector<HTMLElement>('.peekover-reader')!;
const diffOf = (host: HTMLElement) => shadowOf(host).querySelector<HTMLElement>(`.${DIFF_VIEW_CLASS}`);
const rawOf = (host: HTMLElement) => shadowOf(host).querySelector<HTMLElement>('.peekover-raw');
const headingOf = (host: HTMLElement) => (columnOf(host).querySelector('h1')?.textContent ?? '').trim();
const tablesIn = (root: ParentNode) => [...root.querySelectorAll<HTMLTableElement>('table')];
const columnTableOf = (host: HTMLElement) => tablesIn(columnOf(host))[0];
const toolbarOf = (table: HTMLTableElement) => table.previousElementSibling as HTMLElement | null;

const sortButtonsIn = (table: HTMLTableElement) => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];
const fieldOf = (table: HTMLTableElement) =>
  toolbarOf(table)!.querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;

/** ★ RENDERED, not merely un-`hidden` — the filter hides rows, and `hidden` is not the claim. */
const isPainted = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/** Every body row's cells, in DOM order — the table as it stands. */
const matrixOf = (table: HTMLTableElement): string[][] =>
  [...table.tBodies[0].rows].map((row) => [...row.cells].map((c) => (c.textContent ?? '').trim()));

/** Only the rows a reader can see — the filter's own units. */
const paintedMatrixOf = (table: HTMLTableElement): string[][] =>
  [...table.tBodies[0].rows]
    .filter(isPainted)
    .map((row) => [...row.cells].map((c) => (c.textContent ?? '').trim()));

/**
 * Everything M8 puts ON a subtree, counted in one place — so an exclusion claim is ONE `expect`
 * whose failure names every way the walk could have reached in, instead of a ladder whose first
 * clause hides the rest.
 */
function enhancementFootprint(root: ParentNode): {
  toolbars: number;
  sortButtons: number;
  markedTables: number;
} {
  return {
    toolbars: root.querySelectorAll(`.${TABLE_TOOLBAR_CLASS}`).length,
    sortButtons: root.querySelectorAll(`.${SORT_BUTTON_CLASS}`).length,
    markedTables: root.querySelectorAll(`[${TABLE_STATE_ATTR}]`).length,
  };
}

const NO_ENHANCEMENT = { toolbars: 0, sortButtons: 0, markedTables: 0 };
/** One table, one toolbar, three sort buttons (three header cells) — the reading column's share. */
const ONE_ENHANCED_TABLE = { toolbars: 1, sortButtons: 3, markedTables: 1 };

/** Sort by `n` ascending through a real click, then prove the screen really disagrees with source. */
async function sortByN(table: HTMLTableElement): Promise<void> {
  await userEvent.click(sortButtonsIn(table)[2]);
  expect(matrixOf(table), 'the fixture must really be sorted before the property is asserted').toEqual(
    A_SORTED_BY_N,
  );
}

/** Type into the filter the way a reader does — a real focus and real key presses. */
async function typeInto(table: HTMLTableElement, text: string): Promise<void> {
  fieldOf(table).focus();
  await userEvent.keyboard(text);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

async function reset(): Promise<void> {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
  await wipeAll();
  __resetConnectionForTest();
}

beforeEach(reset);
afterEach(reset);

// ══ D-8 · THE DIFF VIEW — THE EXCLUSION THAT CARRIES THE RED ══════════════════════════════════

describe('3.9 · D-8 — a diff whose hunks contain a complete markdown table grows NO sort affordance', () => {
  it('the diff has REAL tables, and the walk goes past every one of them', async () => {
    const { host } = await openDoc(DOC_A);

    // The precision half, stated FIRST as a precondition: the reading column's own table IS
    // enhanced. An exclusion that also excluded this would be a silently dropped feature, and
    // ablation A2 is what proves this clause fires.
    expect(
      enhancementFootprint(columnOf(host)),
      'the reading column`s own table must be enhanced — the exclusion is not allowed to be broad',
    ).toEqual(ONE_ENHANCED_TABLE);

    // `appShell.ts:983`'s `showDiff` closure, verbatim.
    const entered = enterDiff(host, computeDiff(DIFF_BEFORE, DOC_A));
    expect(entered.ok, 'the diff must actually render for this case to mean anything').toBe(true);

    const diff = diffOf(host)!;
    expect(diff, 'no .peekover-diff — nothing to exclude').not.toBeNull();

    // ★ NON-VACUITY, AND IT IS THE WHOLE CASE. If the diff contains no `<table>`, "no toolbar in
    // the diff" is true of an empty set and proves nothing. This asserts the enhanceable thing
    // exists, WITH A HEADER ROW, so the header gate is not what is doing the excluding either.
    const diffTables = tablesIn(diff);
    expect(
      diffTables.map((t) => (t.tHead?.rows[0]?.cells.length ?? 0)),
      'the diff must contain at least one REAL table WITH a header row',
    ).toEqual([3]);

    // The walk, re-run over a shadow root that now holds a diff.
    enhanceTables(host);

    expect(
      enhancementFootprint(diff),
      `the diff's ${diffTables.length} real table(s) were enhanced — the walk reached outside .peekover-reader`,
    ).toEqual(NO_ENHANCEMENT);

    // …and the second pass changed nothing about the column (IDEMPOTENT), so the green above is
    // not the green of a walk that did nothing at all.
    expect(
      enhancementFootprint(columnOf(host)),
      'the second walk double-enhanced or un-enhanced the column',
    ).toEqual(ONE_ENHANCED_TABLE);
  });

  it('the exclusion is STABLE across renders — a re-walked diff is still walked past', async () => {
    const { host } = await openDoc(DOC_A);
    enterDiff(host, computeDiff(DIFF_BEFORE, DOC_A));
    const diff = diffOf(host)!;
    expect(tablesIn(diff).length, 'fixture: the diff carries a real table').toBeGreaterThan(0);

    enhanceTables(host);
    enhanceTables(host);
    enhanceTables(host);

    expect(
      enhancementFootprint(diff),
      'three walks over the same diff — an excluded table must stay excluded',
    ).toEqual(NO_ENHANCEMENT);
  });
});

// ══ D-8 · THE RAW VIEW — OVER-DETERMINED, AND SAID SO ═════════════════════════════════════════

describe('3.9 · D-8 — the raw view grows none either, and the reason is stronger than an address', () => {
  it('holds the table`s SOURCE as text, zero <table> elements, and no enhancement', async () => {
    const { host } = await openDoc(DOC_A);

    // The real gesture: the mode pill, not a direct `setReaderMode`.
    shadowOf(host).querySelector<HTMLButtonElement>('.peekover-mode-toggle')!.click();
    await waitFor(() => host.getAttribute('data-mode') === 'raw');

    const raw = rawOf(host)!;
    expect(raw, 'no .peekover-raw — nothing to exclude').not.toBeNull();

    // ★ A SIBLING OF THE COLUMN, NOT A DESCENDANT. This is the structural half of the exclusion,
    // and it is the half `readerMode.ts:66-74` (`shadow.appendChild(pre)`) is responsible for.
    expect(
      { parentIsShadowRoot: raw.parentNode === shadowOf(host), insideColumn: columnOf(host).contains(raw) },
      'the raw view moved inside the reading column — the walk would then reach it',
    ).toEqual({ parentIsShadowRoot: true, insideColumn: false });

    // ★ AND THE NON-VACUOUS HALF: the table's SOURCE is on screen, and no `<table>` exists there.
    // Without the first clause, "no toolbar in the raw view" is a claim about an empty subtree.
    expect(
      {
        carriesTheTableSource: (raw.textContent ?? '').includes('| eng | zoe | 10 |'),
        tableElements: tablesIn(raw).length,
      },
      'the raw view either lost the table`s source or started parsing it into elements',
    ).toEqual({ carriesTheTableSource: true, tableElements: 0 });

    enhanceTables(host);

    expect(enhancementFootprint(raw), 'the raw view grew enhancement chrome').toEqual(NO_ENHANCEMENT);
    expect(
      enhancementFootprint(columnOf(host)),
      'and the hidden reading column keeps exactly its own',
    ).toEqual(ONE_ENHANCED_TABLE);
  });
});

// ══ D-8's POSITIVE CONSEQUENCE — A DIFF ROUND TRIP DESTROYS NOTHING ═══════════════════════════
//
// 006 D-15: entering and leaving a diff is an ATTRIBUTE FLIP over an untouched column, never a
// re-mount. So a sorted, filtered table comes back sorted and filtered — and nothing has to be
// restored, because nothing was destroyed. Asserted as a positive because it is a testable
// consequence rather than a hope, and NODE IDENTITY is what separates "restored" from "untouched".

describe('3.9 · D-8 — a diff round trip leaves the column`s own table STILL sorted and filtered', () => {
  it('same <table> node, same toolbar node, same sort, same filter', async () => {
    const { host } = await openDoc(DOC_A);
    const table = columnTableOf(host);
    const toolbar = toolbarOf(table)!;

    await sortByN(table);
    await typeInto(table, 'eng');
    expect(
      paintedMatrixOf(table),
      'the fixture must really be sorted AND filtered before the round trip',
    ).toEqual([
      ['eng', 'adam', '9'],
      ['eng', 'zoe', '10'],
    ]);

    expect(enterDiff(host, computeDiff(DIFF_BEFORE, DOC_A)).ok).toBe(true);
    await waitFor(() => host.getAttribute('data-diff') === 'active');
    exitDiff(host);
    await waitFor(() => host.getAttribute('data-diff') === null);

    const after = columnTableOf(host);
    expect(
      {
        sameTableNode: after === table,
        sameToolbarNode: toolbarOf(after) === toolbar,
        stillMarked: after.getAttribute(TABLE_STATE_ATTR),
        filterField: fieldOf(after).value,
        painted: paintedMatrixOf(after),
      },
      'the round trip re-mounted, rebuilt or reset the column — D-15 says it does none of those',
    ).toEqual({
      sameTableNode: true,
      sameToolbarNode: true,
      stillMarked: 'enhanced',
      filterField: 'eng',
      painted: [
        ['eng', 'adam', '9'],
        ['eng', 'zoe', '10'],
      ],
    });
  });
});

// ══ D-9 · ROW 13's INVERSE — THE STATE DELIBERATELY DOES NOT SURVIVE ══════════════════════════
//
// The watch is started through the REAL pill, and the re-render arrives through the REAL
// production controller — `installWatchForFile` (`appShell.ts:864`) built it with
// `render: renderWithEnhancements` (`:939`, `:153`), which is `mount()` then `enhanceDiagrams`
// then `enhanceTables`. Nothing here re-implements that seam.
//
// ★ THE WAIT IS ON THE `<h1>`, NOT THE TABLE. Waiting for the table's text to change would time
// out in ablation A3 — where the carried rows keep the OLD text — and the matrix assertion
// written to catch exactly that defect would never run. The heading is a re-render signal that is
// not under test, so both arms reach the instrument.

async function startWatchAndRewrite(opened: Opened): Promise<void> {
  const pill = shadowOf(opened.host).querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`);
  expect(pill, 'no watch pill — `persistable:true` should have made the app page watchable').not.toBeNull();

  const before = opened.reads();
  pill!.click();

  // The detector's FIRST poll is the BASELINE and fires nothing (`changeDetector.ts:66-71`).
  // Counting production's own `read()` calls waits for it exactly, rather than guessing at the
  // 1 s interval.
  await waitFor(() => opened.reads() > before);

  opened.setText(DOC_B);
  await waitFor(() => headingOf(opened.host) === 'Report — rewritten', 900);
}

describe('3.9 · D-9 — a watch re-render that CHANGES the source lands in document order, new rows', () => {
  it(
    'the sorted arrangement does not survive, and no old row survives with it',
    async () => {
      const opened = await openDoc(DOC_A);
      const table = columnTableOf(opened.host);

      await sortByN(table);
      expect(
        matrixOf(table),
        'the sort must really have moved the rows away from document order',
      ).not.toEqual(A_DOCUMENT_ORDER);

      await startWatchAndRewrite(opened);

      // ★ THE INSTRUMENT. One assertion carrying BOTH halves the plan names — DOCUMENT ORDER and
      // NEW-SOURCE ROW TEXT — so a build that carries the sort across reds with the defect in its
      // own units: a row reading `zoe` (or `adam`, or `bo`) sitting in a table built from DOC_B.
      const fresh = columnTableOf(opened.host);
      expect(
        matrixOf(fresh),
        'the re-render did not land in document order on the new source — table state survived a `replaceChildren` that leaves none',
      ).toEqual(B_DOCUMENT_ORDER);

      // …and the fresh table is enhanced from scratch: sort off, filter clear, one toolbar.
      // `aria-sort` reads the literal `none` rather than being absent — measured here, and it is
      // the right shape: `installTableSort` writes the state on every header at install, so the
      // attribute is a declared "sortable, currently unsorted" and not an omission. The clicked
      // column would read `ascending`, which is what makes this clause discriminate.
      expect(
        {
          footprint: enhancementFootprint(columnOf(opened.host)),
          ariaSort: sortButtonsIn(fresh).map((b) => b.closest('th')?.getAttribute('aria-sort') ?? null),
          filterField: fieldOf(fresh).value,
        },
        'the rebuilt toolbar did not start from `unsorted` with the filter cleared (§6)',
      ).toEqual({
        footprint: ONE_ENHANCED_TABLE,
        ariaSort: ['none', 'none', 'none'],
        filterField: '',
      });
    },
    30_000,
  );
});

// ══ D-9 · ROW 14 — THE REBUILT TOOLBAR REACHES THE CURRENT TABLE ══════════════════════════════

describe('3.9 · row 14 — after a re-render the toolbar`s handlers act on the CURRENT table', () => {
  it(
    'a click on the rebuilt sort button reorders the NEW table',
    async () => {
      const opened = await openDoc(DOC_A);
      await sortByN(columnTableOf(opened.host));
      await startWatchAndRewrite(opened);

      const fresh = columnTableOf(opened.host);
      const buttons = sortButtonsIn(fresh);
      // Guarded, deliberately: a bare `buttons[2]` would throw on an undefined dereference and
      // kill the case BEFORE the instrument below ever runs — the masked-instrument pattern this
      // milestone has paid for six times. An absent button is a RESULT, and it is reported as one.
      if (buttons[2]) await userEvent.click(buttons[2]);

      // ★ THE INSTRUMENT, CARRYING BOTH HALVES OF ROW 14 AT ONCE. A build whose installers were
      // handed a CAPTURED `<table>` reds here showing exactly what went wrong: `sortButtons: 0`
      // (the affordance was built on the destroyed table) together with the current table's rows
      // still sitting in document order — *"a click that mutates nothing"*, in its own units.
      // Splitting this into a count check and then a matrix check would let the count swallow the
      // red, and the clause written to find the defect would never be seen to fail.
      expect(
        { sortButtons: buttons.length, matrix: matrixOf(fresh) },
        'the rebuilt sort did not move the CURRENT table`s rows — its handler is reaching the destroyed one',
      ).toEqual({ sortButtons: 3, matrix: B_SORTED_BY_N });
    },
    30_000,
  );
});
