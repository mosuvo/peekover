// tableTools — the table toolbar's CONTROLS (008 plan §1.3). This task ships the FIRST of them:
// the sort (task 3.6). The filter (3.7) and the copy-out (3.8) land beside it in this file.
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
