// tableFilter — 008 task 3.1. THIS FILE'S HEADER *IS* THE FILTER'S ENUMERATED PROPERTY SET.
// THERE IS NO ASSERTION BELOW IT YET, AND THAT IS THE POINT.
//
// ══ WHY AN ENUMERATION LANDS BEFORE ANY TABLE-TOOLS TEST EXISTS ════════════════════════════════
//
// M6 retro finding 4 has two halves. The first is an assertion lost in transcription: a suite that
// cites `watchControl` by name borrowed the scoping decision (assert at WIDE) and dropped the
// assertion — every test passed, and the property that should have been tested was absent. The
// second half is the storage panel: no positioning coverage at all, no sibling to transcribe from,
// no baseline. **"The assertion was dropped in transcription" and "there was no sibling to
// transcribe from" are the two ways the same audit fails, and the second is the more dangerous
// because there is nothing to notice missing.** The rule that came out of it: before writing
// coverage for a new piece of chrome, ENUMERATE the property set from every existing sibling suite
// and record each item as present / absent / explicitly out of scope — and *"if no sibling suite
// exists, THAT IS THE SIGNAL."*
//
// ★ THE FILTER IS THAT SIGNAL. plan §3.11 row 24: **no existing control filters anything**, so its
// sibling source column reads NONE. D-12 found the same hole from the other side — `design/
// mockup.html` §s2 has a sort affordance and a copy affordance and **no filter at all** — so there
// is no design precedent either. Rows 12, 15, 17 and 20 are where the filter LANDS on the audit;
// everything else it needs is enumerated FRESH, below.
//
// ★ AND THE ORDER IS THE WHOLE POINT. This set is written BEFORE `tableTools.ts` exists and BEFORE
// its first assertion exists, so 3.7 checks the code against a spec written first. A property set
// written after the code would be a description of the implementation wearing a spec's clothes —
// it would agree with whatever shipped, including the parts that are wrong, and the thing nobody
// built is exactly the thing it would fail to mention. So NOTHING HERE NAMES AN IMPLEMENTATION:
// every entry says WHAT must hold, never HOW. (`hidden` is 3.7's mechanism and is deliberately not
// written into the set; F6 states the checkable property the mechanism has to satisfy.)
//
// ══ THE §3.11 ROUTING — TOOLBAR COLUMN, READ AND CONFIRMED AGAINST THE TREE ════════════════════
//
// Each row's landing task named, and each landing task's own citation footer checked (tasks.md):
//
//   rows 1, 2, 3, 4 (INVERTS), 23 ......... 3.4   [D-6 sites 1–2, D-8; §4 table tools; rows 1,2,3,4,23]
//   rows 5 (INVERTS), 6, 8 ................ 3.5   [D-12; §4 table tools; rows 5, 6, 8; finding 2]
//   rows 11, 15, 16, 17, 18, 19 ........... 3.6   [§3.6, D-12; §4 table tools; rows 11,15,16,17,18,19]
//   rows 12, 15, 16, 20 + ROW 24'S SET .... 3.7   [§3.6; §4 table tools; rows 12, 15, 16, 20, 24]
//   row 16 ................................ 3.8   [D-10, §3.6; §4 table tools + Trust; §3.8; row 16]
//   rows 13, 14 ........................... 3.9   [D-8, D-9; §7-4, §7-8; rows 13, 14]
//   row 2's cost half .................. 3.10 / 4.2   [D-11 (i),(ii); §5; finding 1; row 2] / [row 2]
//   row 22 ............................... 3.11   [row 22; §4 Trust; §5 zero-network; finding 1]
//   rows 1, 23 on the content script ... 4.1 / 4.2   [D-6; §3.7; §4 table tools; rows 1, 23]
//   rows 7, 10 ............................ OUT   the toolbar shares no band; it is deliberately IN flow
//   rows 9, 21 ....................... INACTIVE   gate-2 Q2 ruled TWO BUTTONS, so no task activates them
//
// All ten landing tasks exist in the tree by number, below this one, with matching row citations.
// The gate-2 split added 3.3, 3.4 and 3.5 and moved none of them above 3.1.
//
// ══ ROW 24 — THE FILTER'S PROPERTY SET ═════════════════════════════════════════════════════════
//
// Every entry is CHECKABLE (3.7 can assert it, or name it as unasserted) and DERIVED (it carries
// either its sibling source or an explicit "NO BASELINE — enumerated here" with the requirement it
// comes from). Nothing here is invented, and nothing here is an implementation.
//
// ── A · WHERE THE FILTER IS OFFERED ────────────────────────────────────────────────────────────
//
//  F1  A rendered table WITH A HEADER ROW offers a filter over that table's rows.
//      NO BASELINE — enumerated here. §4: *"When a rendered document contains a table with a header
//      row, the system shall offer per-column sorting, a filter over that table's rows, and
//      copy-out of that table."* Lands: 3.7 (the affordance's structure is 3.4's).
//
//  F2  A table with NO header row is left exactly as rendered and offers NO filter.
//      NO BASELINE — enumerated here. §4 *"shall leave it exactly as rendered"*; §3.8 *"a table that
//      cannot be enhanced … stays exactly the table it is today."* ★ This is a REAL condition, not a
//      formality: `sanitize.ts:36` allows `table/thead/tbody/tr/th/td`, so a hand-written HTML table
//      with no `<thead>` reaches the column from source (plan §0.2). Lands: 3.2 (entry condition).
//
//  F3  A document with NO table grows no filter chrome and adds no listener.
//      SIBLING SOURCE: row 2 (`watchControl:198`; `diffChrome:242`) — *"grows NO chrome where the
//      capability is absent"*, which is also D-11 (ii)'s arm 2. §4: *"When a document contains no
//      table, the system shall add no table chrome and no listener."* Lands: 3.10 / 4.2.
//
//  F4  Each table's filter acts on ITS OWN table. On a two-table document, filtering table 2 hides
//      rows in table 2 and changes nothing in table 1.
//      NO BASELINE FOR THE FILTER — enumerated here; the SHAPE is row 11's (`diagramLightbox:354,
//      429`, the multi-instance case where 007 found this defect class), and row 11 is routed to 3.6
//      for sort. §3.6 ships the filter PER-TABLE. Lands: 3.7.
//
// ── B · WHAT THE FILTER DOES — the half with no sibling anywhere ────────────────────────────────
//
//  F5  The match is over the row's DISPLAYED text. A row matches when what the reader typed occurs
//      in the text the row shows; text that exists only in the source markdown and not on screen
//      (a link's href, an emphasis marker) does not by itself make a row match.
//      NO BASELINE — enumerated here. §3.6: *"Filter matches displayed row text."* The negative half
//      is the checkable consequence of *displayed*. Lands: 3.7 (unit).
//
//  F6  Non-matching rows are HIDDEN, NEVER REMOVED. The same row nodes are still in the table
//      afterwards — asserted on NODE IDENTITY, because a rebuild-and-restore passes a text
//      assertion and fails this one — and they are not rendered.
//      NO BASELINE — enumerated here. §3.6: *"HIDES non-matching rows; it never removes them"*, so
//      that *"clearing the filter is exact rather than a re-render."* Lands: 3.7 (unit).
//
//  F7  Only matching rows are shown. NO BASELINE — enumerated here. §4: *"the system shall show only
//      matching rows."* Lands: 3.7.
//
//  F8  The system says HOW MANY ARE SHOWN OUT OF HOW MANY. The denominator is the table's data
//      rows; the header row is not one of them and is never counted.
//      NO BASELINE — enumerated here. §4: *"shall say how many are shown out of how many."* The
//      header clause is the checkable consequence of *rows*. Lands: 3.7.
//
//  F9  With no filter text, EVERY row is shown and the count says nothing.
//      SIBLING SOURCE for the silent half: row 20 (`diffChrome:651`) — *"polite live region, OUT of
//      the a11y tree while empty."* Lands: 3.7.
//
//  F10 Clearing the filter restores EVERY row, and the table's footprint returns to where it
//      started — asserted as a RECT EQUALITY against the pre-filter measurement, red against a clear
//      that leaves one row hidden.
//      SIBLING SOURCE: row 12 (`storagePanelOverlay:169`) — *"closing returns the slot to zero
//      footprint"*, read for the filter. §4: *"shall restore every row when the filter is cleared."*
//      Lands: 3.7.
//
//  F11 A filter matching NO row shows a DESIGNED EMPTY STATE WITHIN THE TABLE, and never an empty
//      table with no explanation. Checkable as: zero visible data rows ⇒ an explanatory element
//      exists inside that table.
//      NO BASELINE — enumerated here. §4, in terms. Lands: 3.7.
//
//  F12 The table's HEADER stays visible while a filter is active, so the empty state of F11 is read
//      inside a table that still names its columns.
//      NO BASELINE — enumerated here; the checkable consequence of §4's *"within the table"* and
//      *"never … an empty table with no explanation."* Lands: 3.7.
//
// ── C · THE FILTER'S a11y — the four rows row 24 lands on ───────────────────────────────────────
//
//  F13 The count is a POLITE live region, and it is OUT of the a11y tree while empty.
//      SIBLING SOURCE: row 20 (`diffChrome:651`, re-asserted). §5: *"the filter's result count is
//      announced politely."* Lands: 3.7.
//
//  F14 The filter's state is in TEXT — never colour alone, never an icon alone.
//      SIBLING SOURCE: row 15 (`watchControl:310`). Lands: 3.7.
//
//  F15 The clear control is a REAL `<button>`, keyboard-operable, with no `tabindex` of its own; the
//      filter's own field is reachable the same way.
//      SIBLING SOURCE: row 16 (`watchControl:339`; `themeControl:260`) — D-12 divergence 1, which
//      turned the mockup's `onclick` on a bare `<th>` into a real button. Lands: 3.7 (row 16 also
//      routes to 3.6 and 3.8 for the other controls).
//
//  F16 Accessible names carry SELECTION AND ACTION and move with the state — the field names the
//      table it filters, the clear control names what it clears, and neither is identified by
//      position alone.
//      SIBLING SOURCE: row 17 (`themeControl:250`). Lands: 3.7 (row 17 routes to 3.6 for sort).
//
//  F17 Every filter action is reachable BY KEYBOARD, and the filter adds NO new global single-key
//      shortcut. (The negative half is not decoration: a global single-key shortcut and a text field
//      the reader types into are the same keystroke.)
//      NO BASELINE for the negative half — enumerated here. §4, both clauses. Lands: 3.6 asserts the
//      shortcut clause for the toolbar; 3.7 for the field.
//
//  F18 CONDITIONAL — only if a transition ships with the filter: instant under
//      `prefers-reduced-motion`, AND it DOES animate without it (the second half is what makes the
//      first non-vacuous).
//      SIBLING SOURCE: row 19 (`watchControl:358,694,709`). Lands: 3.6.
//
// ── D · THE FILTER IN THE PAGE'S LIFECYCLE ─────────────────────────────────────────────────────
//
//  F19 Filter state deliberately does NOT survive a re-render. After a watch re-render that changes
//      the source, no row is hidden and no stale filter text remains — the degradation is to
//      "unfiltered", never to "the wrong rows shown from the new source".
//      SIBLING SOURCE: row 13's INVERSE (`watchControl:236` asserts a host attribute that survives;
//      D-9 asserts that this state does not). §7-4; §6 *"decided per-render for now."* Lands: 3.9.
//
//  F20 After a re-render the filter's handlers reach the CURRENT table, not the destroyed one.
//      SIBLING SOURCE: row 14 (`watchControl:251,278`) — closure death; the signature of the defect
//      is a control that mutates nothing. Lands: 3.9.
//
//  F21 The filter does not reach the DIFF view or the RAW view. Both are siblings of the reading
//      column, and a diff's hunks can contain real tables — the product's own spec-v1-vs-spec-v2
//      example does.
//      SIBLING SOURCE: row 4, INVERTED (the toolbar is INSIDE `.peekover-reader`, so the scope is
//      the column, not the shadow root); D-8. Lands: 3.2 (unit half) / 3.9 (real-engine half).
//
// ── E · THE FILTER'S CONTRACT WITH THE OTHER TWO TOOLS ─────────────────────────────────────────
//
//  F22 Copy-out reads the rows CURRENTLY SHOWN, IN THE ORDER CURRENTLY SHOWN — a row the filter hid
//      is absent from the copied output. The filter's half of the contract is that its result is
//      expressed in the visible-row set copy reads.
//      NO BASELINE — enumerated here. §4: *"the system shall copy the rows currently shown, in the
//      order currently shown"*; §3.6: *"a copy that silently disagrees with what is visible is a
//      wrong answer that looks right."* Lands: 3.8 (enumerated here because it is a property OF the
//      filter that another task asserts).
//
//  F23 SORT AND FILTER COMPOSE. Filtering a sorted table leaves the sort's order among the rows
//      still shown; sorting a filtered table un-hides no hidden row and loses no hidden row.
//      NO BASELINE — enumerated here, and NO TASK'S VERIFY CURRENTLY NAMES IT. §3.6 makes both
//      operations node operations over the same `<tr>`s (*"Sorting is reordering `<tr>` nodes,
//      filtering is hiding them"*), which is what makes their composition a real property rather
//      than an assumption. ★ This entry is what an enumeration is FOR: it is the property that has
//      no sibling, no mockup and no Verify clause, and it is therefore the one nothing would have
//      noticed missing. Lands: NOWHERE YET — 3.7 either asserts it or NAMES it as unasserted.
//
// ── F · TRUST ──────────────────────────────────────────────────────────────────────────────────
//
//  F24 The filter makes NO network request — proven at the REQUEST level on both engines, with a
//      control that fires under the same conditions the negative claim disclaims.
//      SIBLING SOURCE: row 22 (`remoteMedia:83-92,120,140`, the `/^https?:/i` predicate verbatim).
//      ★ jsdom cannot see bytes on the wire, and a control routed through a sanitizer reads NO-FETCH
//      while the route is wide open. Lands: 3.11 (sort → filter → copy).
//
//  F25 The filter introduces NO HTML STRING. Hiding a row is a node operation on already-sanitized
//      nodes, and every node the filter creates is built as DOM. Nothing re-enters the sanitizer.
//      NO ROW — enumerated here. §5 Trust; AGENTS.md #3. Lands: 3.7.
//
//  F26 A filter action that FAILS says so and leaves the table readable.
//      SIBLING SOURCE for the announcement: row 20's second half (*"any action-failure message"*).
//      §4: *"If a table action fails, then the system shall say so and shall leave the table
//      readable"*; §3.8. Lands: 3.7.
//
// ══ WHAT THIS SET DELIBERATELY DOES NOT DECIDE ═════════════════════════════════════════════════
//
//  · §8-2's per-table-vs-per-document question. The set states PER-TABLE because §3.6 decided it;
//    the scope question is MEASURED at 5.2 and CHOSEN at 5.5, and F4 is written so that a change of
//    scope would change the property rather than be smuggled past it.
//  · §8-3's threshold below which a table grows no tools. No entry assumes a minimum row count.
//  · The toolbar's GEOMETRY. Containment and the measure are rows 5, 6 and 8, routed to 3.5 for the
//    toolbar as a whole; they are not re-enumerated per control.
//  · Any mechanism. No attribute, element, class, selector or algorithm is named. The one place this
//    set gets specific — F6's node identity — is specific about the OBSERVATION, not the mechanism,
//    because "never removes them" has no other checkable form.
//
// ══ HOW THIS SET IS DISCHARGED ═════════════════════════════════════════════════════════════════
//
// 3.7 writes the first assertion in this file, and its report checks this set off PROPERTY BY
// PROPERTY. ★ Any property enumerated here and not asserted there is NAMED, not dropped — an
// enumeration that quietly loses an entry is finding 4 happening again, one rung further up.

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3.7 — THE FIRST ASSERTIONS IN THIS FILE
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// The set above was written at 3.1 with nothing below it, and this is the discharge finding 4 asks
// for. Every case below names the `F<n>` it satisfies; the checklist of which entries land HERE,
// which land in `src/render/tableTools.test.ts`, and which are NAMED as another task's is in the
// task report and in `docs/ai/progress.md`.
//
// ★ WHAT IS HERE RATHER THAN IN THE UNIT, AND WHY. `tableTools.test.ts` answers DOM shape, node
// identity, the predicate, the count string and the composition — exactly and cheaply, in jsdom.
// Five things it cannot answer at all are below, and each is a property whose whole content is
// that a real engine does something:
//
//   • F6's second half — the hidden rows are NOT RENDERED. `hidden` is a UA-stylesheet
//     `display:none`, and jsdom has no cascade to resolve and no box to measure; a `<tr hidden>`
//     that some rule un-hid would satisfy every attribute assertion in the unit suite.
//   • F10 / row 12 — the table's footprint RETURNS TO WHERE IT STARTED, which is a rect equality
//     against a pre-filter measurement and cannot exist without layout.
//   • F15 — a real tab stop and a real activation. jsdom focuses anything you ask it to and has
//     no default `<button>` behaviour, so the claim is untestable there.
//   • F14 — the count is PAINTED. §5's *"state in text"* is a claim about what a sighted reader
//     can see, and a `width:0` span passes every `textContent` assertion ever written.
//   • F11 — the empty state is on the screen, in a table that still draws its header (F12).
//
// ★ AND NOTHING BELOW CALLS `enhanceTables`. The filter arrives through the app page's own click
// chain or it does not arrive — the M5 "built, tested, wired to nothing" defect is why.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';
import {
  FILTER_CLEAR_CLASS,
  FILTER_COUNT_CLASS,
  FILTER_EMPTY_CLASS,
  FILTER_FIELD_CLASS,
  SORT_BUTTON_CLASS,
} from '../../src/render/tableTools';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

/**
 * Three data rows over three columns. `dept` has two `eng` rows so a filter can leave more than
 * one row standing (a one-row result cannot tell "kept the order" from "kept the row"), and `n` is
 * 10 / 9 / 2 so the sort has somewhere to move them to — F23 needs both controls to have work.
 *
 * The trailing prose is what makes a reflow visible below the table.
 */
const FILTER_DOC = [
  '# Report',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
  '',
  'Trailing prose, below the table.',
  '',
].join('\n');

/** Two filterable tables in one document — F4's shape, on the live app page. */
const TWO_TABLE_DOC = [
  '# Report',
  '',
  '| one | n |',
  '| --- | --- |',
  '| b | 2 |',
  '| a | 1 |',
  '',
  '| two | n |',
  '| --- | --- |',
  '| d | 4 |',
  '| c | 3 |',
  '',
].join('\n');

/** A hand-written HTML table with NO `<thead>` — F2's REAL input, not one invented to be declined:
 *  `parse.ts` runs `html: true` and `sanitize.ts:36` allows the table elements. */
const HEADLESS_HTML = '<table><tbody><tr><td>a</td><td>1</td></tr></tbody></table>';
const MIXED_DOC = `${FILTER_DOC}\n${HEADLESS_HTML}\n`;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── The app-page harness (call site 1 — `readerPane.ts`'s paint) ──────────────────────────────

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

/** Mount the shell and open the file — the real gesture chain, never a direct `selectFile`. */
async function openDoc(doc: string): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({
      ok: true,
      source: sourceOf([{ path: 'report.md', name: 'report.md', read: async () => doc }]),
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
  return host;
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const columnOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
const tablesIn = (host: HTMLElement) => [...columnOf(host).querySelectorAll('table')];
const toolbarOf = (table: HTMLTableElement) => table.previousElementSibling as HTMLElement;

/**
 * The filter's controls, found BY CLASS ALONE — never `input.${FILTER_FIELD_CLASS}` or
 * `button.${FILTER_CLEAR_CLASS}`.
 *
 * ★ THE SELECTOR MUST NOT ENCODE THE ANSWER. F15's whole claim is that the clear control IS a real
 * `<button>` and the field a real form control. A tag-qualified selector makes that unfalsifiable:
 * a non-button control returns NOTHING, every case dies on an undefined dereference, and the focus
 * assertion written to catch exactly this never runs. (Paid for at 3.5 and again at 3.6.)
 */
const fieldOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
const clearOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${FILTER_CLEAR_CLASS}`)!;
const countOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLElement>(`.${FILTER_COUNT_CLASS}`)!;
const emptyStateOf = (table: HTMLTableElement) =>
  table.querySelector<HTMLElement>(`.${FILTER_EMPTY_CLASS}`)!;
const sortButtonsIn = (table: HTMLTableElement) => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];

const bodyRowsOf = (table: HTMLTableElement) => [...table.tBodies[0].rows];
const columnText = (table: HTMLTableElement, index: number) =>
  bodyRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());

/** ★ RENDERED, not merely un-`hidden`. This is the reading the whole browser half exists for. */
const isPainted = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};
const paintedRowsOf = (table: HTMLTableElement) => bodyRowsOf(table).filter(isPainted);
const paintedText = (table: HTMLTableElement, index: number) =>
  paintedRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());

/** Type into the field the way a reader does — a real focus and real key presses. */
async function typeInto(table: HTMLTableElement, text: string): Promise<void> {
  fieldOf(table).focus();
  await userEvent.keyboard(text);
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

// ══ F1 / F2 — WHERE THE FILTER IS OFFERED ═════════════════════════════════════════════════════

describe('3.7 · F1 / F2 — a header table offers a filter; a headerless one offers none', () => {
  it('F1 — the filter is in the toolbar strip, on the table it belongs to, through production', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];

    // The firing control: the document really rendered a table.
    expect(tablesIn(host), 'the fixture must actually render a table').toHaveLength(1);

    // ★ THE STRIP HAS ITS FIRST CONTROL. Through 3.6 this host was empty — D-12 divergence 1 puts
    // the sort inside its own `<th>` — and 3.5 measured the containment of an empty strip. This is
    // the task where that measurement faces a control with real width.
    const bar = toolbarOf(table);
    expect(bar.classList.contains(TABLE_TOOLBAR_CLASS)).toBe(true);
    expect(bar.contains(fieldOf(table))).toBe(true);
    expect(bar.contains(clearOf(table))).toBe(true);
    expect(bar.contains(countOf(table))).toBe(true);
    expect(isPainted(fieldOf(table)), 'the field is not on screen').toBe(true);
    expect(isPainted(clearOf(table)), 'the clear control is not on screen').toBe(true);
  });

  it('F2 — a headerless table in the SAME document is left exactly as rendered', async () => {
    const host = await openDoc(MIXED_DOC);
    const tables = tablesIn(host);

    expect(tables, 'the fixture must render BOTH tables').toHaveLength(2);
    expect(tables[0].tHead, 'fixture: the first table is the header one').not.toBeNull();
    expect(tables[1].tHead, 'fixture: the second table is the headerless one').toBeNull();

    // Ungated, BOTH tables would carry a field and this reads 2; unwired it reads 0. Only "the
    // gate is the header row" reads 1 — which makes this a claim about the property.
    expect(columnOf(host).querySelectorAll(`.${FILTER_FIELD_CLASS}`)).toHaveLength(1);
    expect(tables[1].querySelectorAll(`.${FILTER_EMPTY_CLASS}`)).toHaveLength(0);
    expect(tables[1].tBodies).toHaveLength(1);
  });
});

// ══ F6 / F7 — HIDDEN, NOT REMOVED, AND GENUINELY NOT RENDERED ═════════════════════════════════

describe('3.7 · ★ F6 / F7 — the rows are hidden and NOT RENDERED, and they never left the table', () => {
  it('a filtered-out row has no box, keeps its node identity, and is still in the tbody', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];
    const before = bodyRowsOf(table);
    // A handle no rebuild could carry across — a property on the live node itself.
    before.forEach((row, i) => {
      (row as HTMLTableRowElement & { __probe?: number }).__probe = i;
    });
    expect(before.every(isPainted), 'every row must start painted').toBe(true);

    await typeInto(table, 'eng');

    // F7 — only matching rows are SHOWN, read off the engine's own boxes rather than an attribute.
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam']);

    // ★ F6 — AND THE ROW IS STILL THERE. A remove-and-restore filter reads identically on the line
    // above and fails every line below: `bodyRowsOf` would hold one row, the node would be
    // disconnected, and the restored rows would carry no `__probe`.
    //
    // ★ THE IDENTITY CLAUSES COME FIRST, BEFORE ANYTHING READS ROW 2. Written the other way round
    // — `bodyRowsOf(table)[2]` into a `getComputedStyle` — the ablation dies on an undefined
    // dereference and the identity claim is never reached. Measured in the unit suite on the first
    // ablation run; the clause that finds the defect has to be the clause seen to fail.
    expect(bodyRowsOf(table)).toHaveLength(3);
    expect(bodyRowsOf(table)).toEqual(before);
    const gone = bodyRowsOf(table)[2];
    expect(gone.isConnected).toBe(true);
    expect(gone.parentElement).toBe(table.tBodies[0]);
    // ...and it is genuinely NOT RENDERED, which is the half jsdom cannot see at all.
    expect(isPainted(gone), 'the non-matching row is still being drawn').toBe(false);
    expect(getComputedStyle(gone).display).toBe('none');
    expect(gone.offsetParent).toBeNull();

    clearOf(table).click();

    expect(bodyRowsOf(table)).toEqual(before);
    expect(
      bodyRowsOf(table).map((row) => (row as HTMLTableRowElement & { __probe?: number }).__probe),
      'a rebuilt row carries nothing that was hung on the original',
    ).toEqual([0, 1, 2]);
    expect(paintedRowsOf(table)).toHaveLength(3);
  });
});

// ══ F10 / ROW 12 — THE FOOTPRINT RETURNS TO WHERE IT STARTED ══════════════════════════════════

describe('3.7 · ★ F10 (row 12) — clearing restores every row AND the table`s footprint', () => {
  it('the table`s rect after a clear equals its rect before the filter, to the pixel', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];
    const prose = [...columnOf(host).querySelectorAll('p')].at(-1)!;

    const tableBefore = table.getBoundingClientRect();
    const proseBefore = prose.getBoundingClientRect();
    // Non-vacuous: a zero-rect table would compare equal to itself for free.
    expect(tableBefore.height, 'the table has no height to restore').toBeGreaterThan(0);
    expect(proseBefore.height, 'nothing below the table to be pushed around').toBeGreaterThan(0);

    await typeInto(table, 'bo');

    // ★ THE FIRING CONTROL, BEFORE THE ASSERTION IT GUARDS. The filter really changed the
    // geometry — two rows' worth of height left the table and the prose below it came up. Without
    // this, "the rect came back" is equally true of a filter that never did anything.
    const tableDuring = table.getBoundingClientRect();
    expect(
      tableDuring.height,
      `the filter did not reflow: table ${fmt(tableBefore)} -> ${fmt(tableDuring)}`,
    ).toBeLessThan(tableBefore.height);
    expect(prose.getBoundingClientRect().top).toBeLessThan(proseBefore.top);

    clearOf(table).click();

    // THE ASSERTION. §4's *"restore every row"* has a geometric half, and this is it: a clear that
    // leaves ONE row hidden restores the right node set and the wrong footprint, and only a rect
    // equality against the pre-filter measurement can tell the two apart.
    const tableAfter = table.getBoundingClientRect();
    const detail = `table ${fmt(tableBefore)} -> ${fmt(tableAfter)}`;
    expect(tableAfter.top, `top moved: ${detail}`).toBeCloseTo(tableBefore.top, 1);
    expect(tableAfter.left, `left moved: ${detail}`).toBeCloseTo(tableBefore.left, 1);
    expect(tableAfter.right, `right moved: ${detail}`).toBeCloseTo(tableBefore.right, 1);
    expect(tableAfter.bottom, `bottom moved: ${detail}`).toBeCloseTo(tableBefore.bottom, 1);
    // ...and everything below it is back where it was too.
    expect(prose.getBoundingClientRect().top).toBeCloseTo(proseBefore.top, 1);
    expect(paintedRowsOf(table)).toHaveLength(3);
  });
});

// ══ F11 / F12 — THE DESIGNED EMPTY STATE, INSIDE A TABLE THAT STILL NAMES ITS COLUMNS ═════════

describe('3.7 · F11 / F12 — no match shows an explanation IN the table, under a live header', () => {
  it('zero painted data rows, an explanation that is painted, and a header that still is', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];
    const empty = emptyStateOf(table);
    const headerRow = table.tHead!.rows[0];

    expect(isPainted(empty), 'the empty state must start out of sight').toBe(false);

    await typeInto(table, 'nothing matches this');

    expect(paintedRowsOf(table)).toHaveLength(0);
    // ★ §4: *"never an empty table with no explanation."* The explanation is INSIDE the table and
    // it is ON THE SCREEN — a `hidden` attribute removed from a span nobody can see would satisfy
    // every DOM assertion the unit suite makes and show the reader an empty table.
    expect(table.contains(empty)).toBe(true);
    expect(isPainted(empty)).toBe(true);
    expect(empty.textContent).toBe('No rows match this filter.');
    // F12 — the header is still drawn, so the empty state is read in a table that names its
    // columns. RED-FIRST target: a filter that hid `thead`'s row along with the body's.
    expect(isPainted(headerRow)).toBe(true);
    expect(headerRow.getBoundingClientRect().top).toBeLessThan(empty.getBoundingClientRect().top);
    // ...and the table is still a table, not a collapsed strip.
    expect(table.getBoundingClientRect().height).toBeGreaterThan(0);

    clearOf(table).click();
    expect(isPainted(empty)).toBe(false);
    expect(paintedRowsOf(table)).toHaveLength(3);
  });
});

// ══ F13 / F14 — THE COUNT: POLITE, OUT OF THE TREE WHILE EMPTY, AND PAINTED ═══════════════════

describe('3.7 · F13 / F14 — the count is a polite live region, and its text is really on screen', () => {
  it('role="status", `hidden` while empty, and a non-zero rect once it speaks', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];
    const count = countOf(table);

    // `diffChrome.browser.test.ts:651`'s property, re-asserted for the filter.
    expect(count.getAttribute('role')).toBe('status');
    expect(count.hidden, '`hidden`, not merely transparent').toBe(true);
    expect(isPainted(count)).toBe(false);

    await typeInto(table, 'eng');

    expect(count.hidden).toBe(false);
    expect(count.textContent).toBe('Showing 2 of 3 rows');
    // ★ THE ONLY PLACE §5's CLAIM IS ACTUALLY TESTED. *"State in text, never colour alone, never
    // an icon alone"* is a claim about what a sighted reader can SEE: a `width:0`,
    // `visibility:hidden` or `font-size:0` region passes every `textContent` assertion in the unit
    // suite and shows nothing at all.
    expect(isPainted(count), 'the count has no box — it is not on screen').toBe(true);
    const style = getComputedStyle(count);
    expect(style.visibility).toBe('visible');
    expect(style.display).not.toBe('none');

    clearOf(table).click();
    expect(count.hidden, 'and it leaves the a11y tree again').toBe(true);
    expect(count.textContent).toBe('');
  });
});

// ══ F15 / F17 — REACHABLE BY KEYBOARD, AND NO SHORTCUT OF ITS OWN ═════════════════════════════

describe('3.7 · F15 / F17 — real controls, a real tab order, and no global single-key shortcut', () => {
  it('★ the field takes focus and typing into it really filters', async () => {
    const host = await openDoc(FILTER_DOC);
    const shadow = host.shadowRoot!;
    const table = tablesIn(host)[0];
    const field = fieldOf(table);

    field.focus();
    expect(shadow.activeElement, 'the field is not focusable').toBe(field);
    expect(field.tagName).toBe('INPUT');
    expect(field.hasAttribute('tabindex'), 'no tabindex of its own').toBe(false);

    await userEvent.keyboard('eng');

    expect(field.value).toBe('eng');
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam']);
  });

  it('★ TAB reaches the clear control from the field — which is what "no tabindex" is FOR', async () => {
    const host = await openDoc(FILTER_DOC);
    const shadow = host.shadowRoot!;
    const table = tablesIn(host)[0];

    fieldOf(table).focus();
    await userEvent.tab();

    // A real tab advance through the shadow tree, in the engine's own tab order. RED-FIRST target:
    // D-12's mockup shape, a handler on a bare element — it takes no tab stop at all, and an
    // element made focusable with a `tabindex` hack can satisfy `.focus()` and still sit outside
    // the natural order.
    expect(shadow.activeElement, 'tab did not reach the clear control').toBe(clearOf(table));
    expect(clearOf(table).tagName).toBe('BUTTON');
    expect(clearOf(table).hasAttribute('tabindex')).toBe(false);
  });

  it('★ ENTER and SPACE activate the clear control, with no key handling of ours', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];

    await typeInto(table, 'bo');
    expect(paintedRowsOf(table)).toHaveLength(1);

    clearOf(table).focus();
    await userEvent.keyboard('{Enter}');
    expect(paintedRowsOf(table), 'Enter did not clear the filter').toHaveLength(3);
    expect(fieldOf(table).value).toBe('');

    // And again on Space, from a fresh filtered state — a native <button> answers both by
    // default, which is the second reason D-12 divergence 1 is the cheaper shape.
    await typeInto(table, 'bo');
    expect(paintedRowsOf(table)).toHaveLength(1);
    clearOf(table).focus();
    await userEvent.keyboard(' ');
    expect(paintedRowsOf(table), 'Space did not clear the filter').toHaveLength(3);
  });

  it('F17 — typing OUTSIDE the field filters nothing: no new global single-key shortcut', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];

    // Focus something that is NOT the filter, then press the keys a shortcut would claim — and the
    // letters of a query that WOULD match, because "e", "n", "g" typed at the document is exactly
    // the collision §4 forbids.
    columnOf(host).querySelector<HTMLElement>('h1')!.click();
    for (const key of ['e', 'n', 'g', 'f', '/', '{ArrowDown}']) {
      await userEvent.keyboard(key);
    }

    expect(fieldOf(table).value).toBe('');
    expect(paintedRowsOf(table)).toHaveLength(3);
    expect(countOf(table).hidden).toBe(true);
    // The firing control: the filter itself DOES work in this same run, so "nothing happened" is a
    // statement about the keys and not about a control that was never wired.
    await typeInto(table, 'eng');
    expect(paintedRowsOf(table)).toHaveLength(2);
  });
});

// ══ F4 — EACH TABLE'S FILTER ACTS ON ITS OWN TABLE ════════════════════════════════════════════

describe('3.7 · F4 — on a two-table document, table 2`s filter acts on table 2', () => {
  it('filtering the second table leaves the first exactly where it was', async () => {
    const host = await openDoc(TWO_TABLE_DOC);
    const [first, second] = tablesIn(host);
    expect(tablesIn(host), 'the fixture must render BOTH tables').toHaveLength(2);
    expect(paintedRowsOf(first)).toHaveLength(2);
    expect(paintedRowsOf(second)).toHaveLength(2);

    await typeInto(second, 'd');

    // RED-FIRST target: a handler that resolves its table with a document-time `querySelector`
    // reaches the FIRST table — the `diagramLightbox:354,429` multi-instance defect class, where
    // 007 found it. Both lines below move in that arm, in opposite directions.
    expect(paintedText(second, 0), 'the filtered table is the one that must change').toEqual(['d']);
    expect(paintedRowsOf(first), 'the OTHER table must not have been filtered').toHaveLength(2);
    expect(countOf(first).hidden).toBe(true);
    expect(countOf(second).hidden).toBe(false);
  });
});

// ══ F23 — SORT ∘ FILTER COMPOSE, IN A REAL ENGINE, IN BOTH ORDERS ═════════════════════════════
//
// 3.1 enumerated F23 and routed it NOWHERE: it is a property of two controls composing, so it
// could not exist until both did. 3.6 shipped the sort and 3.7 ships the filter, which makes this
// the first task where it is a question at all — and it is ASSERTED, in both orders, rather than
// named. Both directions are here because a build can get one right and the other wrong.

describe('3.7 · ★ F23 — sort and filter compose, both orders, driven live', () => {
  it('FILTERING A SORTED TABLE keeps the sort`s order among the rows still shown', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];

    sortButtonsIn(table)[2].click(); // by n, ascending: 2, 9, 10
    expect(columnText(table, 1)).toEqual(['bo', 'adam', 'zoe']);

    await typeInto(table, 'eng');

    // ★ A filter that rebuilt the body, or re-appended its matches, reads ['zoe','adam'] here.
    expect(paintedText(table, 1)).toEqual(['adam', 'zoe']);
    expect(table.tHead!.rows[0].cells[2].getAttribute('aria-sort')).toBe('ascending');
  });

  it('SORTING A FILTERED TABLE un-hides no hidden row and loses no hidden row', async () => {
    const host = await openDoc(FILTER_DOC);
    const table = tablesIn(host)[0];
    const documentOrder = bodyRowsOf(table);

    await typeInto(table, 'eng');
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam']);
    const hiddenBefore = bodyRowsOf(table).filter((row) => !isPainted(row));
    expect(hiddenBefore, 'the fixture must really have a hidden row to lose').toHaveLength(1);

    sortButtonsIn(table)[2].click(); // sort while the filter is applied

    // ★ NOTHING WAS UN-HIDDEN — the defect F23 names, and the one a sort that rebuilt its rows
    // would produce: `bo` back on screen in a table the reader had filtered it out of.
    expect(paintedText(table, 1)).toEqual(['adam', 'zoe']);
    expect(bodyRowsOf(table).filter((row) => !isPainted(row))).toEqual(hiddenBefore);
    // ★ AND NOTHING WAS LOST: the hidden row is still there, in the sorted position it would have
    // taken had it been visible (2 < 9 < 10, so it leads).
    expect(bodyRowsOf(table)).toHaveLength(3);
    expect(new Set(bodyRowsOf(table))).toEqual(new Set(documentOrder));
    expect(columnText(table, 2)).toEqual(['2', '9', '10']);
    expect(countOf(table).textContent, 'the count did not move either').toBe('Showing 2 of 3 rows');

    // ...and the sort's own third state does not disturb the filter: "off" replays a captured list
    // of the SAME live nodes, so each row's hidden state rides back with it.
    const button = sortButtonsIn(table)[2];
    button.click(); // descending
    button.click(); // off
    expect(columnText(table, 1)).toEqual(['zoe', 'adam', 'bo']);
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam']);
  });
});
