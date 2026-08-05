// tableTools — the table toolbar's CONTROLS (008 plan §1.3). All three ship here: the sort
// (task 3.6), the FILTER (task 3.7) and the COPY-OUT (task 3.8).
//
// `tableEnhancer.ts` owns the WALK — which tables qualify, the toolbar host, and D-7's totality.
// This module owns what a qualifying table then GETS. The split is why 3.6 could add a control
// without reopening the walk's four properties.
//
// This module imports nothing, for `tableEnhancer.ts`'s reason and not a weaker one: it reaches
// the content-script graph at 4.1 (plan §2), so an import it does not need is an import the
// content script pays for.
//
// ── THE MECHANISM: THE ROWS ARE MOVED, NEVER REBUILT ──────────────────────────────────────────
//
// A sort is `appendChild` over the EXISTING `<tr>` nodes, in the order the comparator produced.
// `appendChild` on an attached node RELOCATES it, so every row keeps its node identity, its
// children, and anything a later enhancement hung on it. Three things follow, and all three are
// the reason spec §3.6 rejected "re-render the table from source on each sort":
//
//   • OFF IS AVAILABLE. The document's own order is a captured array of the same live nodes, so
//     restoring it is another reorder — not a re-parse, and not a rebuild that would have to
//     reproduce the original markup byte for byte to be correct.
//   • NOTHING RE-ENTERS THE PARSER OR THE SANITIZER. No HTML string exists at any point here
//     (§5, AGENTS.md #3), and no other enhancement on the page is lost to a replaced subtree.
//   • A REBUILD WOULD PASS A TEXT ASSERTION AND FAIL AN IDENTITY ONE. That is why
//     `tableTools.test.ts` asserts on the `<tr>` references themselves.
//
// ★ AND EVERY SORT RUNS FROM DOCUMENT ORDER, NEVER FROM THE CURRENT ORDER. Sorting the already
// sorted rows would make "stable" mean "carries the previous sort's tie-break", so descending
// would not be the reverse of ascending on equal keys and the third state would be reachable only
// by luck. The captured order is the input every time; the DOM is only ever the output.
//
// ── D-12's TWO DIVERGENCES FROM THE MOCKUP, EACH RECORDED WHERE IT IS MADE ─────────────────────
//
// `design/mockup.html:565-580` sorts with `<th onclick="sortTbl(0,this)">` and a bare
// `<span class="arr">▲</span>`. The spec wins on both, and the divergences are these:
//
//   1. A REAL `<button>` INSIDE THE `<th>`, not a handler on the `<th>`. A click handler on a
//      `<th>` is unreachable by keyboard: the cell is not focusable, takes no tab stop and
//      responds to no Enter. §4 requires every table action to be reachable by keyboard, and
//      `watchControl.browser.test.ts:339` / `themeControl.browser.test.ts:250` pin the shipped
//      shape a real control has here — a `<button>`, keyboard-operable, with NO `tabindex` of its
//      own, whose accessible name carries the selection AND the action.
//   2. `aria-sort` ON THE `<th>` **PLUS** TEXT, not a `▲` alone. §5 forbids state carried by an
//      icon alone: a screen reader hears nothing from a glyph, and a reader who cannot resolve a
//      4px triangle sees nothing either. So the direction is in the `<th>`'s `aria-sort` (the ARIA
//      state) AND in the button's visible text. The glyph stays, and is hidden from assistive
//      technology (§3.11 row 18) because it now restates what the text already says.
//
// ── WHY THE HEADER'S OWN NODES ARE MOVED INTO THE BUTTON ──────────────────────────────────────
//
// A `<th>`'s content is inline markdown — `<code>`, `<em>`, a link. Rebuilding the button's label
// from `textContent` would silently flatten all of it, so the existing child nodes are MOVED into
// the button and moved back out if the enhancement unwinds. Same discipline as the rows, one
// level down, and it keeps this module free of any HTML string.
//
// ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────────────────────────
//
// No threshold. Spec §8-3 asks below what size a table should grow no tools at all; that is
// MEASURED at 5.1-5.4 and CHOSEN by a human at 5.5, so inventing one here would be choosing it
// quietly. The one size check below — a `<tbody>` with no rows gets no sort control — is not a
// threshold but a definition: there is nothing to reorder.
//
// No styling. `readerCss.ts` is not in this task's file list, so the button ships with the
// engine's own default chrome; §3.11 row 19 (reduced motion) is therefore INACTIVE, because its
// condition is *"only if a transition ships"* and none does.
//
// No global key handling. §4: *"the system shall add no new global single-key shortcut"* — a
// native `<button>` needs none, which is the second reason divergence 1 is the cheaper shape and
// not merely the correct one.

/** The three states of a column, in ARIA's own vocabulary so the attribute needs no mapping. */
export type SortDirection = 'none' | 'ascending' | 'descending';

/** Class on the sort `<button>`. `readerCss.ts` does not key off it yet — see the note above. */
export const SORT_BUTTON_CLASS = 'peekover-table-sort';

/** Class on the span carrying the direction as TEXT (D-12 divergence 2). */
export const SORT_STATE_CLASS = 'peekover-table-sort__state';

/** Class on the direction glyph, which is hidden from assistive technology (§3.11 row 18). */
export const SORT_GLYPH_CLASS = 'peekover-table-sort__glyph';

/** Written as escapes rather than literal bytes (AGENTS.md), so no encoding step can alter them
 *  silently. `U+25B2` / `U+25BC` are the mockup's own `▲` / `▼`. */
const GLYPH: Record<SortDirection, string> = {
  none: '',
  ascending: '\u25B2',
  descending: '\u25BC',
};

/** asc -> desc -> off -> asc. The third state is what §4 means by *"a way back to the document's
 *  own row order"*, and it is a state of the control rather than a second control. */
export function nextSortDirection(current: SortDirection): SortDirection {
  if (current === 'none') return 'ascending';
  if (current === 'ascending') return 'descending';
  return 'none';
}

/**
 * A number, or `null` if the text is not one.
 *
 * Deliberately strict: an optional sign, digits, one optional decimal point. `Number('')` is 0 and
 * `Number(' 12 ')` is 12, so a bare `Number()` call would sort an empty cell as zero and would
 * accept `0x10`, `1e5` and `Infinity` as numbers a reader never wrote. A cell that is not
 * unambiguously a number is compared as text — which is the only answer that cannot surprise.
 */
function numericValue(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * Compare two cells by their DISPLAYED text (§3.6), numeric-aware.
 *
 * ★ IT RETURNS 0 FOR EQUAL KEYS AND BREAKS NO TIES, AND THAT IS THE STABILITY MECHANISM.
 * `Array.prototype.sort` has been stable since ES2019, so a comparator that reports "equal"
 * leaves equal-key rows in the order it was handed them — and the order it is handed is always
 * the document's. §4 requires exactly that. A comparator that tie-broke on a second column would
 * satisfy every ordering assertion on distinct keys and quietly violate this one.
 *
 * ★ NOT `localeCompare`. Its ordering depends on the engine's ICU data and the ambient locale, so
 * an assertion about it would mean different things in Chromium and in Firefox — and this
 * milestone asserts the sort in BOTH. Lower-casing then comparing code units is case-insensitive,
 * deterministic, and identical on every engine. Collation beyond that is not something §4 asks
 * for, and choosing it silently would be choosing it.
 */
export function compareCellText(a: string, b: string): number {
  const na = numericValue(a);
  const nb = numericValue(b);
  if (na !== null && nb !== null) {
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  }
  const la = a.trim().toLowerCase();
  const lb = b.trim().toLowerCase();
  if (la < lb) return -1;
  if (la > lb) return 1;
  return 0;
}

/** The displayed text of a row's cell in a column, `''` where the row is short. A ragged body is
 *  not a reason to refuse the sort — §4 promises the table is left usable, not that it is well
 *  formed. */
function cellTextAt(row: HTMLTableRowElement, columnIndex: number): string {
  return row.cells[columnIndex]?.textContent ?? '';
}

/**
 * The rows in the order a direction asks for, computed from DOCUMENT ORDER every time.
 *
 * Pure: it returns a new array and moves nothing. Exported because the ordering is the half of
 * this module a unit can interrogate directly, without a click and without a layout.
 */
export function sortedRows(
  documentOrder: readonly HTMLTableRowElement[],
  columnIndex: number,
  direction: SortDirection,
): HTMLTableRowElement[] {
  if (direction === 'none') return [...documentOrder];
  const sign = direction === 'ascending' ? 1 : -1;
  // `-0` is what negating a tie produces, and the sort spec treats it as neither `< 0` nor `> 0`
  // — so descending is stable on equal keys for the same reason ascending is.
  return [...documentOrder].sort(
    (a, b) => sign * compareCellText(cellTextAt(a, columnIndex), cellTextAt(b, columnIndex)),
  );
}

interface SortColumn {
  readonly cell: HTMLTableCellElement;
  readonly index: number;
  readonly label: string;
  readonly button: HTMLButtonElement;
  readonly state: HTMLElement;
  readonly glyph: HTMLElement;
}

/**
 * The accessible name, carrying the SELECTION and the ACTION and moving with the state
 * (§3.11 row 17) — `themeControl.browser.test.ts:250`'s shape, whose own name is
 * *"Theme: Auto. Activate for Light."*
 *
 * Never position alone: the column's own text is the name, and a column with no text at all falls
 * back to its position only because there is nothing else to call it.
 */
function accessibleName(label: string, direction: SortDirection): string {
  if (direction === 'ascending') {
    return `Sorted by ${label}, ascending. Activate to sort descending.`;
  }
  if (direction === 'descending') {
    return `Sorted by ${label}, descending. Activate to restore the document order.`;
  }
  return `Sort by ${label}, ascending`;
}

/**
 * Give one table's header cells their sort controls.
 *
 * Returns an UNDO, or `undefined` when the table has nothing to sort — no `<thead>`, no `<tbody>`,
 * no body rows, or a header row with no `<th>` in it. The undo exists for `tableEnhancer`'s
 * per-table catch (D-7): a table whose enhancement fails must be left EXACTLY as rendered, and
 * "exactly" is asserted on `innerHTML`, so a button left behind would be a defect and not an
 * untidiness.
 *
 * Every handler closes over ITS OWN table's `<tbody>` and `<th>` (§3.11 row 11). Nothing here
 * queries the document at click time, which is what makes table 2's controls act on table 2 on a
 * multi-table page — the defect class 007 found at `diagramLightbox:354,429`.
 */
export function installTableSort(table: HTMLTableElement): (() => void) | undefined {
  const head = table.tHead;
  const body = table.tBodies[0];
  if (!head || !body) return undefined;

  // The LAST header row: on a multi-row header the bottom row is the one that labels the columns.
  const headerRow = head.rows[head.rows.length - 1];
  if (!headerRow) return undefined;

  const documentOrder = [...body.rows];
  if (documentOrder.length === 0) return undefined;

  // ★ THE `<tbody>` IS NOT ONLY ROWS, AND MEASURING IT IS WHAT SAID SO. markdown-it separates its
  // `<tr>`s with `\n` text nodes, so reordering the ROWS alone leaves those separators behind and
  // the restored markup is no longer the markup `mount()` committed. It renders identically —
  // which is exactly why it would not have been noticed — but `tableEnhancer`'s per-table catch
  // promises a failed table is left EXACTLY as rendered and asserts that on `innerHTML`, so
  // "identical to look at" is not the bar. So the WHOLE child list is captured, and "off" replays
  // that list rather than replaying the rows and hoping the rest stayed put. While a sort IS
  // applied the separators lead, which is where they already end up once the rows move past them.
  const documentChildren = [...body.childNodes];
  const rowSet = new Set<ChildNode>(documentOrder);
  const separators = documentChildren.filter((node) => !rowSet.has(node));

  const doc = table.ownerDocument;
  const columns: SortColumn[] = [];

  /**
   * ★ EACH CELL'S RESTORE IS REGISTERED BEFORE THAT CELL IS TOUCHED, AND A MEASUREMENT IS WHY.
   *
   * The first shape of this loop recorded a column only once it was fully built. Under a failure
   * injected at `cell.append(button)` — the D-7 half `tableTools.test.ts` now pins — the header's
   * own nodes had ALREADY been moved into a button that then never landed, so the `<th>` was left
   * EMPTY and no restore existed for it: measured as `<th></th>` where `<th>dept</th>` belongs.
   * That is `tableEnhancer`'s *"left exactly as rendered"* broken by the very control this task
   * adds, and 3.2's own D-7 tests could not see it — they poison `table.before`, which fires
   * BEFORE any of this runs. Registering the undo first makes the window unreachable rather than
   * unlikely.
   */
  const restores: (() => void)[] = [];
  const restoreAll = (): void => {
    for (const restore of restores) restore();
  };

  for (const cell of headerRow.cells) {
    // The gate is the `<th>`, exactly as `tableEnhancer`'s entry condition is: a `<td>` in a head
    // row is not a column header and does not get a control.
    if (cell.tagName !== 'TH') continue;

    const label = (cell.textContent ?? '').trim() || `Column ${cell.cellIndex + 1}`;
    const original = [...cell.childNodes];
    restores.push(() => {
      cell.removeAttribute('aria-sort');
      cell.replaceChildren(...original);
    });

    try {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = SORT_BUTTON_CLASS;
      // MOVED, not rebuilt — the header's inline markup survives (see the note above).
      button.append(...original);

      const state = doc.createElement('span');
      state.className = SORT_STATE_CLASS;

      const glyph = doc.createElement('span');
      glyph.className = SORT_GLYPH_CLASS;
      glyph.setAttribute('aria-hidden', 'true');

      button.append(state, glyph);
      cell.append(button);

      columns.push({ cell, index: cell.cellIndex, label, button, state, glyph });
    } catch (err) {
      // Every cell touched so far, including this half-built one, goes back to what it was — and
      // then the throw continues to `tableEnhancer`'s per-table catch, which owns the decision to
      // give this one table up.
      restoreAll();
      throw err;
    }
  }

  if (columns.length === 0) return undefined;

  let active: { column: SortColumn; direction: SortDirection } | null = null;

  const directionOf = (column: SortColumn): SortDirection =>
    active?.column === column ? active.direction : 'none';

  /** The state, written to the ARIA attribute AND to the visible text, for EVERY column — so
   *  sorting column 2 clears column 1 in both places at once and they cannot disagree. */
  function paint(): void {
    for (const column of columns) {
      const direction = directionOf(column);
      column.cell.setAttribute('aria-sort', direction);
      column.state.textContent = direction === 'none' ? '' : ` ${direction}`;
      column.glyph.textContent = GLYPH[direction];
      column.button.setAttribute('aria-label', accessibleName(column.label, direction));
    }
  }

  /** The reorder. `appendChild` on an attached node MOVES it — no node is created or destroyed,
   *  which is what leaves `documentOrder` a valid description of where everything came from. */
  function reorder(order: readonly ChildNode[]): void {
    for (const node of order) body.appendChild(node);
  }

  /** Every state is expressed as ONE full child list for the `<tbody>`, so the DOM is a function
   *  of the direction and "off" is the captured list itself rather than an inverse operation. */
  function childrenFor(column: SortColumn, direction: SortDirection): ChildNode[] {
    if (direction === 'none') return [...documentChildren];
    return [...separators, ...sortedRows(documentOrder, column.index, direction)];
  }

  for (const column of columns) {
    column.button.addEventListener('click', () => {
      const next = nextSortDirection(directionOf(column));
      active = next === 'none' ? null : { column, direction: next };
      reorder(childrenFor(column, next));
      paint();
    });
  }

  paint();

  return () => {
    // The same restores the build registered — each moves its header's own nodes back out of the
    // button and drops the button with them.
    restoreAll();
    reorder(documentChildren);
  };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE FILTER — task 3.7, §3.11 rows 12, 15, 16, 20, and row 24's enumerated set
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ── THE MECHANISM: THE ROWS ARE HIDDEN, NEVER REMOVED (F6) ────────────────────────────────────
//
// Filtering sets `hidden` on the `<tr>`s that do not match. It detaches nothing, so:
//
//   • CLEARING IS EXACT RATHER THAN A RE-RENDER (§3.6). Every row is still where it was, with its
//     own node identity, its own children and whatever a later enhancement hung on it — so "show
//     everything again" is dropping an attribute, not reconstructing a table from source.
//   • A REBUILD-AND-RESTORE WOULD PASS A TEXT ASSERTION AND FAIL AN IDENTITY ONE, which is why
//     `tableTools.test.ts` asserts on the `<tr>` references and on a rect, never on text alone.
//   • IT COMPOSES WITH THE SORT BY CONSTRUCTION (F23). The sort MOVES row nodes and the filter
//     sets an attribute ON row nodes: neither operation can undo the other, because they are
//     writing to different things about the same live elements. Sorting carries each row's
//     `hidden` along with it; filtering never touches the order. That is a property with no
//     sibling anywhere in the repo, and it is asserted rather than assumed.
//
// ── WHERE THE CONTROL LIVES, AND WHAT THE STRIP GETS ──────────────────────────────────────────
//
// D-12 divergence 1 put the sort INSIDE its own `<th>`, so 3.4's toolbar host was still empty
// after 3.6. This is the control that fills it: a field, a clear button and the count. `readerCss`
// already lays the strip out (`display:flex`, a gap) and is NOT in this task's file list, so the
// three ship with the engine's own default chrome — the same statement 3.6 made about its button,
// and 6.1's walk is where that judgement belongs.
//
// ★ THE STRIP DOES NOT ACQUIRE `role="toolbar"` HERE, AND THAT IS A DECISION. An ARIA toolbar is a
// composite widget: it promises arrow-key navigation between its controls and a single tab stop
// managed with a roving `tabindex`. Declaring the role without implementing it is worse than not
// declaring it — a screen-reader user would be told to press arrows that do nothing. Three native
// controls in document order are each reachable by Tab with no script at all (F15, F17), which is
// what §4 actually asks for.
//
// ── THE EMPTY STATE LIVES IN A SECOND `<tbody>` (F11, F12) ────────────────────────────────────
//
// §4 requires a filter matching no row to show a designed empty state WITHIN THE TABLE. It is one
// `<tr>` in a `<tbody>` of its own, inserted after the data body, and the second body is what
// keeps it out of everything else's way:
//
//   • `table.tBodies[0]` is the data body, so the sort's `documentOrder`, the filter's own row
//     scan and the count's denominator (F8) never see it — no filter of "which rows are real"
//     has to exist and be kept correct;
//   • it is INSIDE the `<table>`, below a `<thead>` that is never hidden, so the empty state is
//     read in a table that still names its columns (F12).
//
// ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────────────────────────
//
// No scope decision. The filter is PER-TABLE because §3.6 decided it; §8-2's per-table-vs-
// per-document question is MEASURED at 5.2 and CHOSEN at 5.5, and inventing an answer here would
// be choosing it quietly. No threshold (§8-3, same reason). No global key handling: §4 forbids a
// new single-key shortcut, and a text field the reader types into is the exact reason why.

/** Class on the filter `<input>`. Selected BY CLASS in the suites, never `input.<class>` — a
 *  tag-qualified selector would make "it is a real field" unfalsifiable. */
export const FILTER_FIELD_CLASS = 'peekover-table-filter';

/** Class on the `<label>` that wraps the field and its visible text. */
export const FILTER_LABEL_CLASS = 'peekover-table-filter__label';

/** Class on the clear control (row 16: a real `<button>`, no `tabindex` of its own). */
export const FILTER_CLEAR_CLASS = 'peekover-table-filter__clear';

/** Class on the polite live region carrying *"n of m shown"* — and any action failure (row 20). */
export const FILTER_COUNT_CLASS = 'peekover-table-filter__count';

/** Class on the empty-state `<tr>` (F11). */
export const FILTER_EMPTY_CLASS = 'peekover-table-filter__empty';

/** The visible label text. A prefix of the field's accessible name, so the two never disagree
 *  (WCAG 2.5.3's label-in-name, which an `aria-label` that replaced the visible text would break). */
const FILTER_LABEL_TEXT = 'Filter';

/** F11's designed empty state. A fixed string: the query itself is in the field directly beside
 *  it, so interpolating it here would restate what the reader can already see. */
const FILTER_EMPTY_TEXT = 'No rows match this filter.';

/** F26. §4: *"If a table action fails, then the system shall say so and shall leave the table
 *  readable."* The message says which half happened, because "showing every row" is the recovery
 *  and a reader who is not told will read the unfiltered table as the filtered one. */
const FILTER_FAILED_TEXT = 'Filter unavailable. Showing every row.';

/**
 * The reader's typed text, reduced to what the match is actually over.
 *
 * Trimmed, because trailing whitespace from a paste is not something a reader meant to search for,
 * and lower-cased for the same reason `compareCellText` lower-cases: code-unit comparison after
 * lowering is deterministic and identical on every engine, where `localeCompare`-style folding is
 * not. An all-whitespace query normalizes to `''` — i.e. to NO filter — which is what makes F9's
 * *"the count says nothing"* true of a field the reader has only pressed space in.
 */
export function normalizeFilterQuery(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * F5 — the match is over the row's DISPLAYED text.
 *
 * `textContent` is what the row shows, and deliberately NOT its markup: a link's `href`, an image's
 * `src` and an emphasis marker exist in the source and not on the screen, so a row must not match
 * on them. A substring test is what §3.6 asks for (*"Filter matches displayed row text"*) — no
 * globbing, no regular expression, nothing a reader would have to know they were writing.
 *
 * The empty query matches EVERY row, which is F9 stated as the predicate's own edge.
 */
export function rowMatchesFilter(row: HTMLTableRowElement, query: string): boolean {
  if (query === '') return true;
  return (row.textContent ?? '').toLowerCase().includes(query);
}

/**
 * F8 — *"how many are shown out of how many"*, in text (F14).
 *
 * The denominator is the table's DATA rows. The header row is not one of them and is never
 * counted, which is a checkable consequence of §4's *"rows"* and the reason the count is computed
 * over `tBodies[0]` rather than over `table.rows`.
 */
export function filterCountText(shown: number, total: number): string {
  return `Showing ${shown} of ${total} ${total === 1 ? 'row' : 'rows'}`;
}

/**
 * What the field and the clear control CALL the table they act on (F16 — never position alone).
 *
 * The name is the table's own COLUMN HEADERS, because that is the thing that actually
 * distinguishes one table from another on a multi-table page. Position is the last resort and is
 * only reached by a header row that names nothing, where there is genuinely nothing else to call
 * it — and even then it is *"this table"* rather than an index.
 *
 * ★ NO `<caption>` BRANCH, AND THAT IS MEASURED RATHER THAN AN OVERSIGHT. A caption would be the
 * better name where one exists, but `sanitize.ts:36` does not allow the element: markdown-it emits
 * none, and a hand-written `<caption>` from source is removed before the reading column ever sees
 * it. A branch no document can reach is a branch no test can honestly cover.
 *
 * Read at install time, when the header cells still hold exactly their own text: the sort paints
 * its state and glyph EMPTY at `none`, so this reading is the same whether the sort was installed
 * first or not.
 */
function tableName(headerRow: HTMLTableRowElement): string {
  const labels = [...headerRow.cells]
    .filter((cell) => cell.tagName === 'TH')
    .map((cell) => (cell.textContent ?? '').trim())
    .filter((text) => text.length > 0);
  if (labels.length > 0) return `the ${labels.join(', ')} table`;
  return 'this table';
}

/**
 * The clear control's accessible name — SELECTION (which table), ACTION (clear it) and the STATE,
 * which MOVES (§3.11 row 17's shape, `themeControl.browser.test.ts:250`).
 *
 * The FIELD's name does not move, and that is the same principle rather than an exception: an
 * `<input>`'s value is exposed to assistive technology as its value, so restating it in the name
 * would announce the reader's own typing back at them twice.
 */
function clearFilterName(name: string, query: string, shown: number, total: number): string {
  if (query === '') return `Clear the filter on ${name}`;
  return `Clear the filter on ${name}. ${filterCountText(shown, total)}.`;
}

/**
 * Give one table a filter over its rows, with its controls in `toolbar`.
 *
 * Returns an UNDO, or `undefined` when there is nothing to filter — no `<thead>`, no `<tbody>`, no
 * header row, no body rows. Same contract as `installTableSort` and for the same reason:
 * `tableEnhancer`'s per-table catch (D-7) asserts a failed table is left EXACTLY as rendered.
 *
 * Every handler closes over ITS OWN table's `<tbody>` and its own controls (§3.11 row 11, F4).
 * Nothing here queries the document at input time, which is what makes table 2's filter act on
 * table 2 — the defect class 007 found at `diagramLightbox:354,429`.
 */
export function installTableFilter(
  table: HTMLTableElement,
  toolbar: HTMLElement,
): (() => void) | undefined {
  const head = table.tHead;
  const body = table.tBodies[0];
  if (!head || !body) return undefined;

  const headerRow = head.rows[head.rows.length - 1];
  if (!headerRow) return undefined;
  if (body.rows.length === 0) return undefined;

  const doc = table.ownerDocument;
  const name = tableName(headerRow);

  // ★ EVERYTHING IS BUILT DETACHED, THEN ATTACHED IN TWO CALLS. A throw during construction has
  // touched no rendered node at all, so there is no half-enhanced table for an undo to miss — the
  // window 3.6 had to close with per-cell restores does not exist on this control's shape.
  const label = doc.createElement('label');
  label.className = FILTER_LABEL_CLASS;
  const labelText = doc.createElement('span');
  labelText.textContent = FILTER_LABEL_TEXT;
  const field = doc.createElement('input');
  field.type = 'text';
  field.className = FILTER_FIELD_CLASS;
  field.setAttribute('aria-label', `${FILTER_LABEL_TEXT} ${name}`);
  label.append(labelText, field);

  const clear = doc.createElement('button');
  clear.type = 'button';
  clear.className = FILTER_CLEAR_CLASS;
  clear.textContent = 'Clear';
  clear.setAttribute('aria-label', clearFilterName(name, '', 0, 0));

  // Row 20 / F13: a POLITE live region, and `hidden` — not merely empty — so it is OUT of the
  // accessibility tree until it has something to say. `diffChrome.ts:336`'s shape exactly.
  const count = doc.createElement('span');
  count.className = FILTER_COUNT_CLASS;
  count.setAttribute('role', 'status');
  count.hidden = true;

  const emptyBody = doc.createElement('tbody');
  const emptyRow = doc.createElement('tr');
  emptyRow.className = FILTER_EMPTY_CLASS;
  emptyRow.hidden = true;
  const emptyCell = doc.createElement('td');
  emptyCell.colSpan = headerRow.cells.length || 1;
  emptyCell.textContent = FILTER_EMPTY_TEXT;
  emptyRow.append(emptyCell);
  emptyBody.append(emptyRow);

  try {
    toolbar.append(label, clear, count);
    body.after(emptyBody);
  } catch (err) {
    label.remove();
    clear.remove();
    count.remove();
    emptyBody.remove();
    throw err;
  }

  /** Show every row again. The recovery path AND the undo path, so "readable" means one thing. */
  function showEveryRow(): void {
    for (const row of body.rows) row.hidden = false;
  }

  /**
   * The whole filter, expressed as a function of the field's current value.
   *
   * ★ THE TABLE IS NEVER LEFT PARTLY FILTERED. `rowMatchesFilter` reads `textContent`, which is a
   * DOM accessor and can therefore throw; a loop that gave up halfway would leave some rows hidden
   * with no message and no way back, which is §4's *"leave the table readable"* broken by the
   * failure path itself. So the catch shows everything and SAYS SO (F26) in the same polite region
   * the count uses (row 20's second half).
   */
  function apply(): void {
    const query = normalizeFilterQuery(field.value);
    try {
      const rows = [...body.rows];
      let shown = 0;
      for (const row of rows) {
        const match = rowMatchesFilter(row, query);
        row.hidden = !match; // HIDDEN, never removed — the node stays exactly where it is (F6)
        if (match) shown += 1;
      }
      emptyRow.hidden = !(query !== '' && shown === 0);
      count.textContent = query === '' ? '' : filterCountText(shown, rows.length);
      count.hidden = query === '';
      clear.setAttribute('aria-label', clearFilterName(name, query, shown, rows.length));
    } catch (err) {
      showEveryRow();
      emptyRow.hidden = true;
      count.textContent = FILTER_FAILED_TEXT;
      count.hidden = false;
      clear.setAttribute('aria-label', clearFilterName(name, '', 0, 0));
      // Dev-only signal, like `tableEnhancer.ts:175`. The reader already has the message above.
      console.warn('[peekover] table filter failed; showing every row', err);
    }
  }

  field.addEventListener('input', apply);
  clear.addEventListener('click', () => {
    field.value = '';
    apply();
  });

  return () => {
    label.remove();
    clear.remove();
    count.remove();
    emptyBody.remove();
    showEveryRow();
  };
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE COPY-OUT — task 3.8, F22, D-10, gate-2 ruling Q2
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ── WHAT YOU SEE IS WHAT YOU COPY (F22) ───────────────────────────────────────────────────────
//
// §4: *"the system shall copy the rows CURRENTLY SHOWN, IN THE ORDER CURRENTLY SHOWN"*; §3.6:
// *"a copy that silently disagrees with what is visible is a wrong answer that looks right."*
//
// Both halves are read off the LIVE `<tbody>` at click time and neither is tracked separately:
//
//   • THE ORDER is `body.rows` order, and the sort MOVES its `<tr>` nodes, so DOM order already
//     IS the order on screen. Nothing here consults the sort's state, and there is no second copy
//     of it to disagree with the first.
//   • THE SET is `body.rows` minus the ones the filter set `hidden` on, and the filter HIDES
//     rather than removes, so a hidden row is a row still present and skippable rather than a row
//     that has to be remembered.
//
// ★ THE DEFECT THIS SHAPE MAKES UNREACHABLE is a copy that reads the SOURCE markdown, or that
// re-reads `documentOrder`: either produces every row in document order, ignoring both controls,
// which is exactly the wrong answer that looks right. `tableTools.test.ts` reds against it with a
// filtered AND sorted fixture, where document order and screen order share no position.
//
// ── THE HEADER'S LABELS ARE CAPTURED AT INSTALL, AND THAT IS LOAD-BEARING ─────────────────────
//
// By copy time each `<th>` also contains the sort's state text and its glyph, so a `textContent`
// read AT CLICK TIME of a sorted table yields `dept ascending` and a `▲` in the header cell of
// the copied output. The labels are therefore read ONCE, at install, when the header cells hold
// exactly their own text — `installTableSort` paints `none` as the empty string, so this reading is
// the same whether the sort was installed first or not. Same timing, same reason, as `tableName`.
//
// ── TWO BUTTONS, NO MENU (gate-2 ruling Q2) ───────────────────────────────────────────────────
//
// CSV and Markdown are two native `<button>`s in the strip, in document order, each its own tab
// stop. NO popup, NO menu, NO focus trap — §3.11 rows 9 and 21 stay inactive, which is checkable
// here rather than merely asserted: nothing below creates an overlay, moves focus or listens for a
// key. *"A table is not a data grid"* (§6) is what the ruling was taken on.
//
// ── THE CLIPBOARD IS ASKED FOR NOTHING (D-10) ─────────────────────────────────────────────────
//
// `navigator.clipboard.writeText` needs TRANSIENT ACTIVATION, which a click supplies by
// construction — every call below is inside a click handler. It needs no manifest permission, and
// the harder case already ships at `permissions: []` (`diagramView.ts:306-315` writes a
// `ClipboardItem`). The built manifests are re-read and re-asserted in `tableCopy.browser.test.ts`
// AFTER a copy has actually run, because `permissions: []` read on its own would be equally true of
// a build in which the copy did not exist.
//
// ── AND IT CAN REFUSE, WHICH IS A STATED FAILURE AND NEVER A THROW (§3.8, D-7) ────────────────
//
// The write is ASYNCHRONOUS and rejects with `NotAllowedError` where the engine declines it; the
// property is missing entirely outside a secure context. Both are handled, both say so in the same
// polite region the confirmation uses, and the table is untouched either way — §3.8's *"a stated
// failure beside a still-readable table, never a broken button."* A rejection that escaped would be
// an unhandled rejection out of a click handler, which is D-7's totality broken on the one path
// that is not synchronous.

/** Class on BOTH copy buttons — the handle `readerCss.ts` will key off, and the one a suite can
 *  count to know there are exactly two of them. */
export const COPY_BUTTON_CLASS = 'peekover-table-copy';

/** Class on the CSV button. */
export const COPY_CSV_CLASS = 'peekover-table-copy--csv';

/** Class on the Markdown button. */
export const COPY_MARKDOWN_CLASS = 'peekover-table-copy--markdown';

/**
 * Class on the copy's OWN polite live region.
 *
 * ★ NOT the filter's count region, and that is a decision. Writing *"Copied 2 rows"* into the
 * region carrying *"Showing 2 of 3 rows"* would destroy an active filter's answer to §4's *"how
 * many are shown out of how many"* as a side effect of an unrelated action — and the copy has to
 * work on a table whose filter never installed. Two regions saying two things.
 */
export const COPY_STATUS_CLASS = 'peekover-table-copy__status';

/** §3.8 / F26's shape, one control over. It names the recovery — nothing happened to the table —
 *  because a reader told only *"failed"* does not know whether the table is still the table. */
const COPY_FAILED_TEXT = 'Copy unavailable. The table is unchanged.';

/**
 * The DISPLAYED text of a node, with HTML's own whitespace processing applied.
 *
 * `textContent` preserves the source's newlines and indentation; the screen does not, because
 * `white-space: normal` collapses every run to one space. Copying the raw `textContent` would put
 * line breaks and runs of spaces into cells that show neither — the same *"disagrees with what is
 * visible"* defect F22 names, one level down. So the collapse is fidelity, not tidying.
 */
function displayedText(node: Node): string {
  return (node.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The column names, read at install (see the note above on why the timing matters). */
function headerLabels(headerRow: HTMLTableRowElement): string[] {
  return [...headerRow.cells].map(displayedText);
}

/**
 * F22's row set: the rows CURRENTLY SHOWN, in the order CURRENTLY SHOWN.
 *
 * Exported because it is the half of F22 a unit can interrogate without a clipboard — and because
 * "shown" having exactly one definition, shared with the filter's own `hidden`, is what makes the
 * two controls compose rather than agree by coincidence.
 */
export function shownRowsIn(body: HTMLTableSectionElement): HTMLTableRowElement[] {
  return [...body.rows].filter((row) => !row.hidden);
}

/**
 * The grid the serializers take: the header labels, then one array per shown row.
 *
 * ★ RECTANGULAR, AT THE WIDEST THING ON SCREEN. A ragged body is reachable (§4 promises the table
 * is left usable, not that it is well formed), and both formats need a fixed width: a short row
 * would otherwise emit fewer CSV fields than its header, and a markdown row wider than its
 * delimiter has its extra cells dropped by every renderer. The width is therefore the MAXIMUM of
 * the header's and every shown row's — padding short rows with empty cells, and giving an
 * over-wide row an unnamed column rather than silently not copying a cell the reader can see.
 */
export function copyMatrix(
  labels: readonly string[],
  rows: readonly HTMLTableRowElement[],
): string[][] {
  let width = labels.length;
  for (const row of rows) width = Math.max(width, row.cells.length);

  const padded = (cells: string[]): string[] => {
    while (cells.length < width) cells.push('');
    return cells;
  };

  const matrix = [padded([...labels])];
  for (const row of rows) {
    matrix.push(padded([...row.cells].map(displayedText)));
  }
  return matrix;
}

/**
 * RFC 4180 — a field is quoted when it contains a quote, the delimiter, or a line break, and an
 * embedded quote is DOUBLED.
 *
 * Three characters, one regular expression rather than three branches: the rule is a single
 * predicate in the format itself, and splitting it would invite a test per branch instead of a test
 * per rule. A cell with a comma that was NOT quoted becomes two cells in every spreadsheet that
 * reads it — silent data corruption, which is why this is a unit and not a glance.
 */
export function csvField(text: string): string {
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

/** The matrix as RFC 4180 CSV. CRLF between records is the RFC's own terminator, and every
 *  spreadsheet reads it; no trailing terminator, because the RFC makes the final one optional and
 *  a paste is not a file. */
export function toCsv(matrix: readonly (readonly string[])[]): string {
  return matrix.map((row) => row.map(csvField).join(',')).join('\r\n');
}

/**
 * A cell as GFM table content.
 *
 * ★ THE BACKSLASH IS ESCAPED FIRST, AND THE ORDER IS THE WHOLE CORRECTNESS. A cell reading
 * `a\|b` escaped for the pipe alone emits `a\\|b`, which markdown reads as an escaped BACKSLASH
 * followed by a bare pipe — the table breaks on the very character the escape was for. Escaping
 * backslashes first and pipes second emits `a\\\|b`, which reads back as the cell.
 *
 * A newline becomes a space because a GFM table row IS one line: there is no escape that survives
 * it, and `<br>` would be an HTML string — which this module does not produce (§5, AGENTS.md #3)
 * and which would arrive as markup in whatever document the reader pastes into.
 */
export function markdownField(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/[\r\n]+/g, ' ');
}

/** The matrix as a GFM table: the header, the delimiter row that makes it a table at all, then the
 *  shown rows. An empty matrix is the empty string rather than a lone delimiter. */
export function toMarkdownTable(matrix: readonly (readonly string[])[]): string {
  if (matrix.length === 0) return '';
  const line = (cells: readonly string[]): string => `| ${cells.map(markdownField).join(' | ')} |`;
  const delimiter = `| ${matrix[0].map(() => '---').join(' | ')} |`;
  return [line(matrix[0]), delimiter, ...matrix.slice(1).map(line)].join('\n');
}

/** The two formats, and the name each is called by in text. */
const COPY_FORMATS = [
  { key: 'csv', label: 'CSV', className: COPY_CSV_CLASS, serialize: toCsv },
  { key: 'markdown', label: 'Markdown', className: COPY_MARKDOWN_CLASS, serialize: toMarkdownTable },
] as const;

/** §4: *"shall confirm that it copied."* The COUNT is in it because the copy composes with the
 *  filter, and *"Copied 2 rows"* on a table showing 2 of 3 is the confirmation actually doing its
 *  job — a bare *"Copied"* would read identically whether or not the filter was respected. */
export function copiedText(count: number, format: string): string {
  return `Copied ${count} ${count === 1 ? 'row' : 'rows'} as ${format}.`;
}

/**
 * The write, as a promise that NEVER throws synchronously.
 *
 * `navigator.clipboard` is `undefined` outside a secure context, so the property read alone can
 * produce a `TypeError` one line later; `writeText` may also throw before it returns. Both are
 * converted to a rejection, so the caller has exactly ONE failure shape to handle and the click
 * handler has none.
 */
function writeToClipboard(doc: Document, text: string): Promise<void> {
  try {
    const clipboard = doc.defaultView?.navigator?.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      return Promise.reject(new Error('the clipboard is unavailable'));
    }
    return Promise.resolve(clipboard.writeText(text));
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Give one table its two copy buttons, in `toolbar`.
 *
 * Returns an UNDO, or `undefined` when there is nothing to copy — the same four entry conditions
 * `installTableFilter` has, for `tableEnhancer`'s per-table catch (D-7) and its *"exactly as
 * rendered"* assertion.
 *
 * Every handler closes over ITS OWN table's `<tbody>` and its own labels (§3.11 row 11, F4).
 * Nothing here queries the document at click time, which is what makes table 2's buttons copy
 * table 2 — the defect class 007 found at `diagramLightbox:354,429`.
 */
export function installTableCopy(
  table: HTMLTableElement,
  toolbar: HTMLElement,
): (() => void) | undefined {
  const head = table.tHead;
  const body = table.tBodies[0];
  if (!head || !body) return undefined;

  const headerRow = head.rows[head.rows.length - 1];
  if (!headerRow) return undefined;
  if (body.rows.length === 0) return undefined;

  const doc = table.ownerDocument;
  const name = tableName(headerRow);
  const labels = headerLabels(headerRow);

  // Built DETACHED, then attached in ONE call — `installTableFilter`'s shape and its reason: a
  // throw during construction has touched no rendered node, so there is no half-built strip.
  const buttons = COPY_FORMATS.map((format) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = `${COPY_BUTTON_CLASS} ${format.className}`;
    // The visible text is a PREFIX of the accessible name (WCAG 2.5.3 label-in-name), and the name
    // carries the SELECTION as well as the ACTION (§3.11 row 17).
    button.textContent = `Copy ${format.label}`;
    button.setAttribute('aria-label', `Copy ${format.label} from ${name}`);
    return { format, button };
  });

  // Row 20 / F13's property, re-asserted for this control: POLITE, and `hidden` rather than merely
  // empty, so it is OUT of the accessibility tree until it has something to say.
  const status = doc.createElement('span');
  status.className = COPY_STATUS_CLASS;
  status.setAttribute('role', 'status');
  status.hidden = true;

  const nodes = [...buttons.map((entry) => entry.button), status];
  try {
    toolbar.append(...nodes);
  } catch (err) {
    for (const node of nodes) node.remove();
    throw err;
  }

  function announce(text: string): void {
    status.textContent = text;
    status.hidden = text === '';
  }

  function fail(err: unknown): void {
    announce(COPY_FAILED_TEXT);
    // Dev-only signal, like `tableEnhancer.ts:186`. The reader already has the message above.
    console.warn('[peekover] table copy failed; the table is unchanged', err);
  }

  for (const { format, button } of buttons) {
    button.addEventListener('click', () => {
      let text: string;
      let count: number;
      try {
        // ★ READ HERE, FROM THE LIVE `<tbody>` — never from a captured order and never from the
        // source. This one line is F22.
        const rows = shownRowsIn(body);
        count = rows.length;
        text = format.serialize(copyMatrix(labels, rows));
      } catch (err) {
        // Serialization reads `textContent`, which is a DOM accessor and can therefore throw.
        fail(err);
        return;
      }
      // The rejection is ASYNCHRONOUS, so the catch is on the promise. A `try` around this call
      // would catch nothing a refused write does.
      writeToClipboard(doc, text).then(() => announce(copiedText(count, format.label)), fail);
    });
  }

  return () => {
    for (const node of nodes) node.remove();
  };
}
