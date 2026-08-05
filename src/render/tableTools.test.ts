// @vitest-environment jsdom
//
// The SORT (008 task 3.6) — its mechanism, its ordering, and the accessibility D-12 diverged from
// the mockup to get. §3.11 rows 11, 15, 16, 17, 18; row 19 is INACTIVE (its condition is *"only if
// a transition ships"* and no transition does — `readerCss.ts` is not in this task's file list).
//
// The fixtures are REAL `mount()` output, `tableEnhancer.test.ts`'s discipline for its own reason:
// what is under test is a sort over the table markdown-it and the sanitizer actually produce, cell
// text and all. A `createElement` table would test the comparator against a DOM no document makes.
//
// ══ WHAT THIS SUITE CAN AND CANNOT SEE, AND WHERE THE REST IS ═════════════════════════════════
//
// Everything below is DOM SHAPE, NODE IDENTITY or an ordering — all of which jsdom answers
// exactly. What it CANNOT answer is whether the button takes a real tab stop and activates on a
// real Enter in a real engine: jsdom has no focus ring, no default `<button>` activation
// behaviour and no shadow-root `activeElement` semantics worth asserting on. That half of row 16
// is `tests/browser/tableTools.browser.test.ts`'s, in Chromium AND Firefox — and it is the half
// D-12 divergence 1 exists for, so it is asserted where it is real.
//
// ══ THE FIXTURES ARE THE INSTRUMENTS ══════════════════════════════════════════════════════════
//
// ★ AN UNSTABLE SORT ON DISTINCT KEYS LOOKS IDENTICAL TO A STABLE ONE. §4's *"when rows are equal
// on the sorted column, the system shall preserve their document order"* is unfalsifiable against
// a fixture whose keys are all different — every comparator passes. So `STABLE_DOC` has TWO rows
// equal on the sorted column, adjacent, and distinguishable by a SECOND column in an order no
// tie-break would reproduce (`zoe` before `adam`). The fixture is what makes the assertion
// possible; the assertion alone would be theatre.
//
// ★ AND A LEXICOGRAPHIC SORT LOOKS CORRECT ON SINGLE DIGITS. `NUMERIC_DOC` uses 10 / 9 / 2, whose
// text order (10, 2, 9) and numeric order (2, 9, 10) share no position.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from './mount';
import { TABLE_STATE_ATTR, TABLE_TOOLBAR_CLASS, enhanceTables } from './tableEnhancer';
import {
  COPY_BUTTON_CLASS,
  COPY_CSV_CLASS,
  COPY_MARKDOWN_CLASS,
  COPY_STATUS_CLASS,
  FILTER_CLEAR_CLASS,
  FILTER_COUNT_CLASS,
  FILTER_EMPTY_CLASS,
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  SORT_BUTTON_CLASS,
  SORT_GLYPH_CLASS,
  SORT_STATE_CLASS,
  compareCellText,
  copiedText,
  copyMatrix,
  csvField,
  filterCountText,
  installTableCopy,
  installTableFilter,
  installTableSort,
  markdownField,
  nextSortDirection,
  normalizeFilterQuery,
  rowMatchesFilter,
  shownRowsIn,
  sortedRows,
  toCsv,
  toMarkdownTable,
} from './tableTools';

const HOST_TAG = 'peekover-root';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  vi.restoreAllMocks();
});

/** A real mounted reader with its tables enhanced — the shipped chain, not a hand-built DOM. */
function enhanced(markdown: string): { host: HTMLElement; column: Element } {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('mount() produced no shadow root');
  enhanceTables(host);
  const column = shadow.querySelector('.peekover-reader');
  if (!column) throw new Error('mount() produced no reading column');
  return { host, column };
}

const tableIn = (column: Element, n = 0): HTMLTableElement =>
  [...column.querySelectorAll('table')][n];

const bodyRowsOf = (table: HTMLTableElement): HTMLTableRowElement[] => [...table.tBodies[0].rows];

/** The visible text of a body column, top to bottom — the ordering every assertion reads. */
const columnText = (table: HTMLTableElement, index: number): string[] =>
  bodyRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());

/**
 * The sort controls, found BY CLASS ALONE and never by `button.${SORT_BUTTON_CLASS}`.
 *
 * ★ THE SELECTOR MUST NOT ENCODE THE ANSWER. Row 16's claim is that the control IS a `<button>`;
 * a tag-qualified selector makes that claim unfalsifiable, because a `<span>` control simply
 * returns nothing and every test dies on an undefined dereference instead of on the assertion
 * that was written to catch it. Selecting by class means the ablation's control is FOUND and the
 * shape assertion is the clause seen to fail — the 3.5 lesson, one suite over.
 */
const buttonsOf = (table: HTMLTableElement): HTMLButtonElement[] => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];

const headerCellsOf = (table: HTMLTableElement): HTMLTableCellElement[] => [
  ...table.tHead!.rows[table.tHead!.rows.length - 1].cells,
];

/** The direction as the reader SEES it — the state span's text, with the aria-hidden glyph left
 *  out on purpose. This is the reading D-12 divergence 2 is about. */
const visibleState = (button: HTMLButtonElement): string =>
  (button.querySelector(`.${SORT_STATE_CLASS}`)?.textContent ?? '').trim();

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const STABLE_DOC = [
  '| dept | who |',
  '| --- | --- |',
  '| eng | zoe |',
  '| eng | adam |',
  '| ops | bo |',
  '',
].join('\n');

const NUMERIC_DOC = [
  '| n | who |',
  '| --- | --- |',
  '| 10 | a |',
  '| 9 | b |',
  '| 2 | c |',
  '',
].join('\n');

const gfmTable = (label: string, ...rows: string[]): string =>
  [`| ${label} | n |`, '| --- | --- |', ...rows, ''].join('\n');

// ══ THE PURE ORDERING ═════════════════════════════════════════════════════════════════════════

describe('the comparator — numeric-aware on displayed text, and it breaks no ties', () => {
  it('compares numbers as numbers, not as text', () => {
    expect(compareCellText('2', '10')).toBeLessThan(0);
    expect(compareCellText('10', '9')).toBeGreaterThan(0);
    expect(compareCellText('-3', '2')).toBeLessThan(0);
    expect(compareCellText('1.5', '1.25')).toBeGreaterThan(0);
    // Whitespace is display, not data — the cell text markdown-it emits is padded.
    expect(compareCellText(' 7 ', '8')).toBeLessThan(0);
  });

  it('compares anything that is not unambiguously a number as text, case-insensitively', () => {
    expect(compareCellText('adam', 'zoe')).toBeLessThan(0);
    expect(compareCellText('Zoe', 'adam')).toBeGreaterThan(0);
    // A mixed column: `1e5`, `0x10` and `Infinity` are things `Number()` accepts and a reader did
    // not write. They fall to the text branch rather than sorting as astronomical numbers.
    expect(compareCellText('1e5', '9')).toBeLessThan(0); // '1e5' < '9' as text, not 100000 > 9
    expect(compareCellText('Infinity', '9')).toBeGreaterThan(0); // 'i' > '9' as text, not Infinity > 9
    // ★ An empty cell is NOT zero, and `-1` is the negative number that can tell the two apart:
    // as text the blank sorts FIRST, but if `Number('')`'s 0 were taken it would sort AFTER -1.
    expect(compareCellText('', '-1')).toBeLessThan(0);
  });

  it('★ returns exactly 0 for equal keys — the stability mechanism, asserted directly', () => {
    // RED-FIRST target: a comparator that tie-broke on a second column would return non-zero
    // here, and `Array.prototype.sort`'s ES2019 stability would stop being reachable.
    expect(compareCellText('eng', 'eng')).toBe(0);
    expect(compareCellText('7', '7.0')).toBe(0);
    expect(compareCellText('ENG', ' eng ')).toBe(0);
  });
});

describe('the three-state cycle', () => {
  it('goes none -> ascending -> descending -> none', () => {
    expect(nextSortDirection('none')).toBe('ascending');
    expect(nextSortDirection('ascending')).toBe('descending');
    expect(nextSortDirection('descending')).toBe('none');
  });
});

describe('sortedRows — computed from document order every time', () => {
  it('returns a NEW array and leaves the input untouched', () => {
    const { column } = enhanced(NUMERIC_DOC);
    const table = tableIn(column);
    const order = bodyRowsOf(table);
    const copy = [...order];

    const out = sortedRows(order, 0, 'ascending');

    expect(out).not.toBe(order);
    expect(order).toEqual(copy); // the caller's document order is not consumed by sorting
  });

  it('"none" is the document order verbatim', () => {
    const { column } = enhanced(NUMERIC_DOC);
    const order = bodyRowsOf(tableIn(column));
    expect(sortedRows(order, 0, 'none')).toEqual(order);
  });
});

// ══ THE MECHANISM — MOVED, NEVER REBUILT ══════════════════════════════════════════════════════

describe('★ the sort MOVES the <tr> nodes; it never rebuilds them', () => {
  it('the rows after a sort are the SAME nodes, reordered', () => {
    const { column } = enhanced(NUMERIC_DOC);
    const table = tableIn(column);
    const before = bodyRowsOf(table);
    // A handle no rebuild could carry across: a property set on the live node itself.
    const marked = before.map((row, i) => {
      (row as HTMLTableRowElement & { __probe?: number }).__probe = i;
      return row;
    });

    buttonsOf(table)[0].click();

    const after = bodyRowsOf(table);
    // ★ THE ORDER REALLY CHANGED — without this, "the same nodes" is satisfied by doing nothing.
    expect(columnText(table, 0)).toEqual(['2', '9', '10']);
    // ★ AND THEY ARE THE SAME NODES. A rebuild-from-source would produce a table whose text reads
    // identically here and whose every row is a NEW node: `__probe` would be undefined on all
    // three, and the set comparison below would hold no element in common.
    expect(new Set(after)).toEqual(new Set(marked));
    expect(
      after.map((row) => (row as HTMLTableRowElement & { __probe?: number }).__probe),
      'a rebuilt row carries nothing that was hung on the original',
    ).toEqual([2, 1, 0]);
  });

  it('★ "off" restores DOCUMENT ORDER exactly — the same nodes in the same sequence', () => {
    const { column } = enhanced(NUMERIC_DOC);
    const table = tableIn(column);
    const documentOrder = bodyRowsOf(table);
    const documentText = columnText(table, 0);
    expect(documentText, 'the fixture is not in sorted order to begin with').toEqual([
      '10',
      '9',
      '2',
    ]);

    const button = buttonsOf(table)[0];
    button.click(); // ascending
    expect(columnText(table, 0)).toEqual(['2', '9', '10']);
    button.click(); // descending
    expect(columnText(table, 0)).toEqual(['10', '9', '2']);

    // ★ Descending happens to READ like the document here, so identity is what separates
    // "restored" from "coincidentally similar" — and the third click is the one under test.
    button.click(); // off
    expect(columnText(table, 0)).toEqual(documentText);
    expect(bodyRowsOf(table), 'off must restore the ORDER OF THE NODES, not merely the text').toEqual(
      documentOrder,
    );
  });

  it('nothing is created or destroyed across a full cycle — the row COUNT and the SET hold', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const original = new Set(bodyRowsOf(table));
    const button = buttonsOf(table)[0];

    for (let i = 0; i < 7; i += 1) {
      button.click();
      expect(bodyRowsOf(table)).toHaveLength(3);
      expect(new Set(bodyRowsOf(table))).toEqual(original);
    }
  });
});

// ══ ORDERING — NUMERIC-AWARE AND STABLE ═══════════════════════════════════════════════════════

describe('the ordering §4 asks for', () => {
  it('numeric-aware on displayed cell text — 2, 9, 10 and never 10, 2, 9', () => {
    const { column } = enhanced(NUMERIC_DOC);
    const table = tableIn(column);
    const button = buttonsOf(table)[0];

    button.click();
    // A lexicographic comparator reads `['10','2','9']` here — no position in common.
    expect(columnText(table, 0)).toEqual(['2', '9', '10']);
    button.click();
    expect(columnText(table, 0)).toEqual(['10', '9', '2']);
  });

  it('★ STABLE on equal keys — ascending', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    expect(columnText(table, 1), 'the fixture puts the two eng rows in THIS order').toEqual([
      'zoe',
      'adam',
      'bo',
    ]);

    buttonsOf(table)[0].click();

    expect(columnText(table, 0)).toEqual(['eng', 'eng', 'ops']);
    // ★ THE ASSERTION. A comparator that tie-broke on the second column reads
    // `['adam','zoe','bo']` — every key-ordering assertion above still passes in that arm, and
    // only this line moves. §4: rows equal on the sorted column preserve their document order.
    expect(columnText(table, 1)).toEqual(['zoe', 'adam', 'bo']);
  });

  it('★ STABLE on equal keys — DESCENDING too, which negating a comparator can silently lose', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const button = buttonsOf(table)[0];

    button.click();
    button.click();

    expect(columnText(table, 0)).toEqual(['ops', 'eng', 'eng']);
    // Descending reverses the KEYS, never the ties: `zoe` still precedes `adam`. A descending
    // sort implemented as "sort ascending, then reverse the array" reads `['bo','adam','zoe']`
    // here and passes the key line above.
    expect(columnText(table, 1)).toEqual(['bo', 'zoe', 'adam']);
  });

  it('sorting a SECOND column sorts by it and releases the first', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const [dept, who] = buttonsOf(table);

    dept.click();
    who.click();

    expect(columnText(table, 1)).toEqual(['adam', 'bo', 'zoe']);
    // The first column's state is released in BOTH places it was written.
    expect(headerCellsOf(table)[0].getAttribute('aria-sort')).toBe('none');
    expect(visibleState(dept)).toBe('');
    expect(headerCellsOf(table)[1].getAttribute('aria-sort')).toBe('ascending');
  });
});

// ══ ROW 16 (jsdom's half) + ROW 15 + ROW 17 + ROW 18 — D-12's TWO DIVERGENCES ═════════════════

describe('★ D-12 divergence 1 — a real <button> inside the <th>, not a handler on the <th>', () => {
  it('every header cell carries a real BUTTON, with no tabindex of its own', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const buttons = buttonsOf(table);

    expect(buttons).toHaveLength(2);
    for (const [i, button] of buttons.entries()) {
      // ★ The mockup's shape is `<th onclick="sortTbl(0,this)">` — a `<th>` that is not
      // focusable, takes no tab stop and answers no Enter. A BUTTON is what makes §4's "reachable
      // by keyboard" true with no key handling of our own.
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.hasAttribute('tabindex'), 'a tabindex of its own is the shape row 16 forbids')
        .toBe(false);
      // Inside its OWN header cell, and the cell is a `<th>`.
      expect(button.parentElement).toBe(headerCellsOf(table)[i]);
      expect(button.parentElement?.tagName).toBe('TH');
    }
    // And no `onclick` attribute anywhere — the mockup's mechanism, absent by construction.
    expect(table.querySelectorAll('[onclick]')).toHaveLength(0);
  });

  it('the header cell`s OWN inline markup is MOVED into the button, not flattened to text', () => {
    const { column } = enhanced(gfmTable('`dept`', '| eng | 1 |'));
    const table = tableIn(column);
    const code = table.querySelector('th code');

    expect(code, 'the fixture must really render inline markup in the header').not.toBeNull();
    // A button whose label was rebuilt from `textContent` would have a text node here and no
    // `<code>` at all — the same rebuild-vs-move distinction the rows are asserted on.
    expect(buttonsOf(table)[0].contains(code!)).toBe(true);
    expect(code!.textContent).toBe('dept');
  });
});

describe('★ D-12 divergence 2 — aria-sort PLUS text; the glyph is hidden from AT', () => {
  it('row 15 — the direction is in aria-sort AND in visible text, at every state', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const th = headerCellsOf(table)[0];
    const button = buttonsOf(table)[0];

    expect(th.getAttribute('aria-sort')).toBe('none');
    expect(visibleState(button)).toBe('');

    button.click();
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    // ★ THE RED-FIRST TARGET, IN TERMS: drop the text and leave the `▲` glyph, and this line
    // is the only one that moves. §5 forbids state carried by an icon alone, so the direction has
    // to be readable as TEXT — by a screen reader and by someone who cannot resolve a triangle.
    expect(visibleState(button)).toBe('ascending');

    button.click();
    expect(th.getAttribute('aria-sort')).toBe('descending');
    expect(visibleState(button)).toBe('descending');

    button.click();
    expect(th.getAttribute('aria-sort')).toBe('none');
    expect(visibleState(button)).toBe('');
  });

  it('the text carrying the state is NOT hidden from assistive technology', () => {
    // The half that makes the assertion above non-vacuous: a state span marked `aria-hidden`
    // would satisfy every text assertion here and announce nothing at all.
    const { column } = enhanced(STABLE_DOC);
    const state = tableIn(column).querySelector(`.${SORT_STATE_CLASS}`)!;
    expect(state.hasAttribute('aria-hidden')).toBe(false);
  });

  it('row 18 — the direction glyph IS hidden from assistive technology', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const button = buttonsOf(table)[0];
    const glyph = button.querySelector(`.${SORT_GLYPH_CLASS}`)!;

    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(glyph.textContent, 'nothing to hide while unsorted').toBe('');

    button.click();
    // Non-vacuous: the glyph really is drawn, so hiding it is a decision and not a description of
    // an empty span. It restates what the text already says — decorative, by row 18's definition.
    expect(glyph.textContent).toBe('\u25B2');
    button.click();
    expect(glyph.textContent).toBe('\u25BC');
  });

  it('row 17 — the accessible name carries the SELECTION and the ACTION, and moves with the state', () => {
    const { column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const button = buttonsOf(table)[0];

    // `themeControl.browser.test.ts:250`'s shape: what is selected AND what activating will do.
    // Never position alone — the column's own text is the name.
    expect(button.getAttribute('aria-label')).toBe('Sort by dept, ascending');
    button.click();
    expect(button.getAttribute('aria-label')).toBe(
      'Sorted by dept, ascending. Activate to sort descending.',
    );
    button.click();
    expect(button.getAttribute('aria-label')).toBe(
      'Sorted by dept, descending. Activate to restore the document order.',
    );
    button.click();
    expect(button.getAttribute('aria-label')).toBe('Sort by dept, ascending');
  });

  it('a header cell with no text falls back to its POSITION, because there is nothing else', () => {
    const { column } = enhanced(
      '<table><thead><tr><th></th><th>n</th></tr></thead><tbody><tr><td>a</td><td>1</td></tr></tbody></table>\n',
    );
    const buttons = buttonsOf(tableIn(column));
    expect(buttons[0].getAttribute('aria-label')).toBe('Sort by Column 1, ascending');
    expect(buttons[1].getAttribute('aria-label')).toBe('Sort by n, ascending');
  });
});

// ══ ROW 11 — THE CONTROLS ACT ON THEIR OWN TABLE ══════════════════════════════════════════════

describe('★ row 11 — on a multi-table document, table 2`s controls act on table 2', () => {
  it('sorting the second table reorders the second table and leaves the first alone', () => {
    const { column } = enhanced(
      `${gfmTable('one', '| b | 2 |', '| a | 1 |')}\n${gfmTable('two', '| d | 4 |', '| c | 3 |')}`,
    );
    const first = tableIn(column, 0);
    const second = tableIn(column, 1);
    expect(columnText(first, 0)).toEqual(['b', 'a']);
    expect(columnText(second, 0)).toEqual(['d', 'c']);

    buttonsOf(second)[0].click();

    // RED-FIRST target: a handler written against `column.querySelector('table')` — or against
    // any document-time lookup rather than the closed-over `<tbody>` — reorders the FIRST table
    // and leaves the second as it was. Both lines below move in that arm, in opposite directions.
    expect(columnText(second, 0), 'the clicked table must be the one that sorted').toEqual([
      'c',
      'd',
    ]);
    expect(columnText(first, 0), 'the OTHER table must not have moved').toEqual(['b', 'a']);
    // The ARIA state is the second table's too.
    expect(headerCellsOf(second)[0].getAttribute('aria-sort')).toBe('ascending');
    expect(headerCellsOf(first)[0].getAttribute('aria-sort')).toBe('none');
  });

  it('each table keeps its OWN document order to restore to', () => {
    const { column } = enhanced(
      `${gfmTable('one', '| b | 2 |', '| a | 1 |')}\n${gfmTable('two', '| d | 4 |', '| c | 3 |')}`,
    );
    const first = tableIn(column, 0);
    const second = tableIn(column, 1);

    buttonsOf(first)[0].click();
    buttonsOf(second)[0].click();
    expect(columnText(first, 0)).toEqual(['a', 'b']);
    expect(columnText(second, 0)).toEqual(['c', 'd']);

    buttonsOf(first)[0].click(); // desc
    buttonsOf(first)[0].click(); // off
    expect(columnText(first, 0)).toEqual(['b', 'a']);
    expect(columnText(second, 0), 'the other table`s sort is untouched by it').toEqual(['c', 'd']);
  });
});

// ══ §4 — NO NEW GLOBAL SINGLE-KEY SHORTCUT ════════════════════════════════════════════════════

describe('§4 — the enhancement adds no global listener of any kind', () => {
  it('binds nothing to document or window', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${STABLE_DOC}`, host, { contained: true });

    // Spied around `enhanceTables` ALONE, so `mount`'s own listeners are not in the sample.
    const onDoc = vi.spyOn(document, 'addEventListener');
    const onWin = vi.spyOn(window, 'addEventListener');
    enhanceTables(host);

    // ★ *"The system shall add no new global single-key shortcut"* (§4) — asserted as the absence
    // of the seam a shortcut would need, not as the absence of one particular key. A native
    // `<button>` activates on Enter and Space with no key handling of ours, which is the second
    // reason D-12's divergence 1 is the cheaper shape and not merely the correct one.
    expect(onDoc).not.toHaveBeenCalled();
    expect(onWin).not.toHaveBeenCalled();
    // The firing control: the enhancement really ran in the sample above.
    expect(buttonsOf(tableIn(host.shadowRoot!.querySelector('.peekover-reader')!))).toHaveLength(2);
  });
});

// ══ THE 3.2 PROPERTIES ARE NOT VIOLATED BY THE CONTROL ════════════════════════════════════════

describe('the sort does not break what 3.2 established', () => {
  it('IDEMPOTENT — enhancing twice leaves ONE button per header cell', () => {
    const { host, column } = enhanced(STABLE_DOC);
    const table = tableIn(column);
    const afterFirst = column.innerHTML;

    enhanceTables(host);

    expect(buttonsOf(table)).toHaveLength(2);
    expect(column.innerHTML).toBe(afterFirst);
  });

  it('HEADER-GATED — a headerless table grows no sort control and is untouched', () => {
    const { column } = enhanced(
      '<table><tbody><tr><td>a</td><td>1</td></tr></tbody></table>\n',
    );
    const table = tableIn(column);
    expect(table.hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(buttonsOf(table)).toHaveLength(0);
  });

  it('TOTAL — a table with a header but no body rows is enhanced and gets NO sort control', () => {
    // Not a threshold (§8-3 is 5.5's to choose): there is simply nothing to reorder.
    const { column } = enhanced('<table><thead><tr><th>h</th></tr></thead></table>\n');
    const table = tableIn(column);
    expect(table.getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    expect(buttonsOf(table)).toHaveLength(0);
  });

  it('TOTAL — a RAGGED body sorts by a column half its rows do not have, and does not throw', () => {
    const { column } = enhanced(
      '<table><thead><tr><th>h</th><th>i</th></tr></thead>' +
        '<tbody><tr><td>b</td><td>2</td></tr><tr><td>a</td></tr></tbody></table>\n',
    );
    const table = tableIn(column);
    const button = buttonsOf(table)[1]; // the column the short row is missing

    expect(() => button.click()).not.toThrow();
    // Defined, not merely non-throwing: a missing cell reads as empty text and sorts first.
    expect(columnText(table, 0)).toEqual(['a', 'b']);
  });

  it('a <thead> row of <td> gets no control — the gate is the <th>, here too', () => {
    const { column } = enhanced(
      '<table><thead><tr><td>h</td></tr></thead><tbody><tr><td>a</td></tr></tbody></table>\n',
    );
    expect(buttonsOf(tableIn(column))).toHaveLength(0);
  });
});

// ══ THE UNDO — D-7's "EXACTLY AS RENDERED" ════════════════════════════════════════════════════

describe('D-7 — the sort is a NEW failure source INSIDE the per-table try, and it is caught', () => {
  it('a throw out of the sort install does not escape, and the table is left as rendered', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${STABLE_DOC}\n${STABLE_DOC}`, host, { contained: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const tables = [...column.querySelectorAll('table')];
    expect(tables).toHaveLength(2);
    const htmlBefore = column.innerHTML;

    // A failure the module has no knowledge of, on ONE header cell of ONE table — the injection
    // shape `tableEnhancer.test.ts` argues for, exercising the shipped path rather than a
    // test-only branch. 3.2 proved D-7 against a poisoned `before`; the sort is a SECOND thing
    // that can throw in there, and its being inside the same try is not automatic.
    Object.defineProperty(tables[0].tHead!.rows[0].cells[0], 'append', {
      configurable: true,
      value() {
        throw new Error('the sort install is poisoned');
      },
    });

    expect(() => enhanceTables(host)).not.toThrow();

    // Per-table: this table loses its tools and is EXACTLY as rendered; the other is enhanced.
    expect(tables[0].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(tables[1].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    expect(buttonsOf(tables[0])).toHaveLength(0);
    expect(buttonsOf(tables[1])).toHaveLength(2);
    // ★ RED-FIRST, AND IT FOUND A REAL DEFECT RATHER THAN CONFIRMING A FIX. Against the first
    // shape of `installTableSort` — which recorded a column only once it was fully built — this
    // line read `expected '<table>\n<thead>\n<tr>\n<th></th>…' to be
    // '<table>\n<thead>\n<tr>\n<th>dept</th>…'`: the header's nodes had already been moved into a
    // button that never landed, and no restore existed for a column that had not been pushed yet.
    // 3.2's own D-7 tests stay GREEN in that arm — they poison `table.before`, which fires before
    // any of this runs — which is why the sort needed its own D-7 case and not an inherited one.
    expect(tables[0].outerHTML).toBe(
      new DOMParser().parseFromString(htmlBefore, 'text/html').querySelector('table')!.outerHTML,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('the undo restores the header exactly, which is what D-7`s catch needs', () => {
  it('puts the header`s own nodes back and removes the button and the aria-sort', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${STABLE_DOC}`, host, { contained: true });
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const table = tableIn(column);
    const before = column.innerHTML;
    const documentOrder = bodyRowsOf(table);

    const undo = installTableSort(table)!;
    expect(undo, 'nothing to undo — the fixture did not install').toBeTypeOf('function');
    buttonsOf(table)[0].click(); // and it is undone from a SORTED state, not a pristine one
    undo();

    // Byte-for-byte the markup `mount()` committed. `tableEnhancer`'s per-table catch asserts
    // exactly this on `innerHTML`, so anything left behind here is a defect there.
    expect(column.innerHTML).toBe(before);
    expect(bodyRowsOf(table)).toEqual(documentOrder);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3.7 — THE FILTER
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// This is the jsdom half of row 24's enumerated set. The property list lives in
// `tests/browser/tableFilter.browser.test.ts`'s header, written at 3.1 BEFORE any of this existed,
// and each `F<n>` below names the entry it discharges. The half that needs a real engine — a
// painted count, a real tab stop, a rect equality across a clear (F10), the rows genuinely not
// rendered — is in that file, and neither suite claims the other's ground.
//
// ★ THE SELECTORS ARE BY CLASS ALONE, never `input.${FILTER_FIELD_CLASS}` or
// `button.${FILTER_CLEAR_CLASS}`. F15's claim is that the clear control IS a real `<button>`; a
// tag-qualified selector makes it unfalsifiable, because the ablation returns nothing, every case
// dies on an undefined dereference, and the shape assertion written to catch it never runs.

const FILTER_DOC = [
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
  '',
].join('\n');

/**
 * F5's instrument. `markdown-it` emits `<a href="https://example.com/secret">label</a>` and
 * `sanitize.ts` keeps the href, so the string `secret` really is IN THE DOM of row 1 — as an
 * attribute, which is not text a reader can see. A predicate written over `innerHTML` matches it;
 * one written over `textContent` does not, and that difference is the whole of F5.
 */
const LINK_DOC = [
  '| what | n |',
  '| --- | --- |',
  '| [label](https://example.com/secret) | 1 |',
  '| plain | 2 |',
  '',
].join('\n');

const toolbarOf = (table: HTMLTableElement): HTMLElement =>
  table.previousElementSibling as HTMLElement;

const fieldOf = (table: HTMLTableElement): HTMLInputElement =>
  toolbarOf(table).querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
const clearOf = (table: HTMLTableElement): HTMLButtonElement =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${FILTER_CLEAR_CLASS}`)!;
const countOf = (table: HTMLTableElement): HTMLElement =>
  toolbarOf(table).querySelector<HTMLElement>(`.${FILTER_COUNT_CLASS}`)!;
const emptyStateOf = (table: HTMLTableElement): HTMLElement =>
  table.querySelector<HTMLElement>(`.${FILTER_EMPTY_CLASS}`)!;

/** The reader's own gesture: text into the field, then the event the field really fires. */
function typeFilter(table: HTMLTableElement, text: string): void {
  const field = fieldOf(table);
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

const shownRowsOf = (table: HTMLTableElement): HTMLTableRowElement[] =>
  bodyRowsOf(table).filter((row) => !row.hidden);
const shownText = (table: HTMLTableElement, index: number): string[] =>
  shownRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());

// ══ F5 · THE PREDICATE, AND THE COUNT'S TEXT (the pure half) ══════════════════════════════════

describe('3.7 · normalizeFilterQuery — what the match is actually over', () => {
  it('trims and lower-cases, and an all-whitespace query is NO query', () => {
    expect(normalizeFilterQuery('  Eng ')).toBe('eng');
    expect(normalizeFilterQuery('')).toBe('');
    // F9's edge stated on the normalizer: a field the reader only pressed space in is unfiltered,
    // not "filtered by a space" — which would hide every row that has no space in it.
    expect(normalizeFilterQuery('   ')).toBe('');
  });
});

describe('3.7 · F5 — the match is over the row`s DISPLAYED text', () => {
  it('matches a substring of what the row shows, case-insensitively', () => {
    const { column } = enhanced(FILTER_DOC);
    const rows = bodyRowsOf(tableIn(column));

    expect(rowMatchesFilter(rows[0], 'zoe')).toBe(true);
    expect(rowMatchesFilter(rows[0], 'eng')).toBe(true);
    expect(rowMatchesFilter(rows[2], 'eng')).toBe(false);
    // The query arrives normalized; the ROW's text is lowered by the predicate itself.
    expect(rowMatchesFilter(rows[2], 'bo')).toBe(true);
  });

  it('★ text that is in the SOURCE and not on the SCREEN does not make a row match', () => {
    const { column } = enhanced(LINK_DOC);
    const table = tableIn(column);
    const rows = bodyRowsOf(table);

    // The firing control: the href really IS in this row's markup, so "no match" below is a
    // statement about the predicate and not about a fixture that never carried the string.
    expect(rows[0].innerHTML, 'the fixture must really contain the href').toContain('secret');
    expect(rows[0].textContent, 'and it must NOT be displayed text').not.toContain('secret');

    // RED-FIRST target: a predicate written over `innerHTML` returns true here.
    expect(rowMatchesFilter(rows[0], 'secret')).toBe(false);
    // ...and the same row DOES match on what it shows, so the false above is not vacuous.
    expect(rowMatchesFilter(rows[0], 'label')).toBe(true);
  });

  it('the empty query matches EVERY row — F9 as the predicate`s own edge', () => {
    const { column } = enhanced(FILTER_DOC);
    for (const row of bodyRowsOf(tableIn(column))) {
      expect(rowMatchesFilter(row, '')).toBe(true);
    }
  });
});

describe('3.7 · F8 — how many are shown out of how many', () => {
  it('the count reads n of m, and singular m is not "1 rows"', () => {
    expect(filterCountText(2, 3)).toBe('Showing 2 of 3 rows');
    expect(filterCountText(0, 3)).toBe('Showing 0 of 3 rows');
    expect(filterCountText(1, 1)).toBe('Showing 1 of 1 row');
  });
});

// ══ F6 · THE MECHANISM — HIDDEN, NEVER REMOVED ════════════════════════════════════════════════

describe('3.7 · ★ F6 — the rows are HIDDEN and stay in the table; clearing is exact', () => {
  it('a filtered row is still in the tbody, is the SAME node, and comes back unchanged', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const before = bodyRowsOf(table);
    // A handle no rebuild could carry across — a property on the live node itself.
    before.forEach((row, i) => {
      (row as HTMLTableRowElement & { __probe?: number }).__probe = i;
    });

    typeFilter(table, 'eng');

    // ★ SOMETHING REALLY HAPPENED. Without this the identity assertions below are satisfied by a
    // filter that does nothing at all.
    expect(shownText(table, 1)).toEqual(['zoe', 'adam']);

    // ★ AND IT WAS DONE BY HIDING. A remove-and-restore filter reads identically on the line above
    // and fails every line below: `bodyRowsOf` would hold ONE row, and the restored rows would be
    // new nodes with no `__probe` on them.
    //
    // ★ THE COUNT AND THE IDENTITY COME BEFORE THE PER-ROW `hidden` READ, AND THAT ORDER IS THE
    // LESSON. Written the other way round — a `bodyRowsOf(table)[2].hidden` guard first — the
    // remove-and-restore ablation died on `Cannot read properties of undefined (reading 'hidden')`
    // at that guard and said NOTHING about identity: measured, in this suite, on the first run.
    // The clause that finds the defect has to be the clause seen to fail.
    const during = bodyRowsOf(table);
    expect(during).toHaveLength(3);
    expect(during).toEqual(before);
    expect(during.every((row) => row.isConnected)).toBe(true);
    expect(during[2].parentElement).toBe(table.tBodies[0]);
    expect(during[2].hidden, 'the non-matching row must be hidden').toBe(true);

    clearOf(table).click();

    expect(bodyRowsOf(table), 'clearing must restore the same nodes in the same order').toEqual(
      before,
    );
    expect(
      bodyRowsOf(table).map((row) => (row as HTMLTableRowElement & { __probe?: number }).__probe),
      'a rebuilt row carries nothing that was hung on the original',
    ).toEqual([0, 1, 2]);
    expect(bodyRowsOf(table).every((row) => row.hidden)).toBe(false);
    expect(shownRowsOf(table)).toHaveLength(3);
  });

  it('F10 — clearing restores EVERY row, from a state where only one was left', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    typeFilter(table, 'bo');
    expect(shownRowsOf(table)).toHaveLength(1); // the firing control for the restore below

    clearOf(table).click();

    // RED-FIRST target: a clear that unhides only the rows it remembers hiding, or that leaves one
    // behind. The rect half of row 12 — the table's footprint returns to where it started — is the
    // browser suite's, because jsdom has no layout to measure.
    expect(shownRowsOf(table)).toHaveLength(3);
    expect(fieldOf(table).value).toBe('');
    expect(countOf(table).hidden).toBe(true);
  });
});

// ══ F7, F9, F11, F12 · WHAT IS SHOWN ══════════════════════════════════════════════════════════

describe('3.7 · F7 / F9 — only matching rows are shown, and no query shows everything', () => {
  it('with no filter text, every row is shown and the count says nothing', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    expect(shownRowsOf(table)).toHaveLength(3);
    expect(countOf(table).textContent).toBe('');
    expect(countOf(table).hidden, 'F13: OUT of the a11y tree while empty').toBe(true);
    expect(emptyStateOf(table).hidden).toBe(true);
  });

  it('only matching rows are shown, and the count says how many of how many', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    typeFilter(table, 'eng');

    expect(shownText(table, 0)).toEqual(['eng', 'eng']);
    expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');
    expect(countOf(table).hidden).toBe(false);
    // ★ F8's header clause: the denominator is the DATA rows. A count taken over `table.rows`
    // reads 4 here — the header row is not a row a reader is filtering.
    expect(countOf(table).textContent).not.toContain('of 4');
  });
});

describe('3.7 · F11 / F12 — a filter matching NO row explains itself INSIDE the table', () => {
  it('zero visible data rows ⇒ an explanatory element inside that table, under a live header', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const empty = emptyStateOf(table);

    typeFilter(table, 'nothing matches this');

    expect(shownRowsOf(table)).toHaveLength(0);
    // ★ WITHIN the table (§4), never an empty table with no explanation.
    expect(table.contains(empty)).toBe(true);
    expect(empty.hidden).toBe(false);
    expect(empty.textContent).toBe('No rows match this filter.');
    expect(countOf(table).textContent).toBe('Showing 0 of 3 rows');
    // F12 — the header is still there to name the columns the empty state is read under.
    expect(table.tHead!.hidden).toBe(false);
    expect(table.tHead!.rows[0].hidden).toBe(false);
    // The empty state spans the table, so it reads as one statement and not as a first cell.
    expect(empty.querySelector('td')!.colSpan).toBe(3);

    // ...and it goes away again, so its presence is a state and not a permanent row.
    clearOf(table).click();
    expect(empty.hidden).toBe(true);
    expect(shownRowsOf(table)).toHaveLength(3);
  });

  it('★ the empty state is NOT a data row — it is in its own tbody and is never counted', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    // The denominator stayed 3 above, and this is why: `tBodies[0]` — what the count, the sort and
    // the row scan all read — does not contain it. A sibling `<tbody>` keeps that true by
    // construction rather than by a filter someone has to remember to keep correct.
    expect(table.tBodies).toHaveLength(2);
    expect(table.tBodies[0].rows).toHaveLength(3);
    expect(emptyStateOf(table).parentElement).toBe(table.tBodies[1]);
  });
});

// ══ F13, F14, F15, F16 · THE a11y ═════════════════════════════════════════════════════════════

describe('3.7 · F13 — the count is a POLITE live region, out of the a11y tree while empty', () => {
  it('role="status" and `hidden` until it has something to say', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const count = countOf(table);

    // `diffChrome.ts:336`'s shape exactly (`diffChrome.browser.test.ts:651`'s property).
    expect(count.getAttribute('role')).toBe('status');
    expect(count.hidden, '`hidden`, not merely empty — an empty region still has a node').toBe(true);

    typeFilter(table, 'eng');
    expect(count.hidden).toBe(false);
    expect(count.textContent).toBe('Showing 2 of 3 rows');

    typeFilter(table, '');
    expect(count.hidden, 'and it leaves the tree again when there is nothing to say').toBe(true);
    expect(count.textContent).toBe('');
  });
});

describe('3.7 · F15 — a real <button>, keyboard-operable, with no tabindex of its own', () => {
  it('the clear control is a BUTTON and the field is a real form control', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const clear = clearOf(table);
    const field = fieldOf(table);

    // Found by class above; the SHAPE is what is asserted here. RED-FIRST target: D-12's own
    // mockup shape, a handler on a bare element — which takes no tab stop and answers no Enter.
    expect(clear.tagName).toBe('BUTTON');
    expect(clear.getAttribute('type')).toBe('button'); // never a submit inside a form
    expect(clear.hasAttribute('tabindex'), 'no tabindex of its own').toBe(false);
    expect(clear.textContent, 'F14: the control is named in TEXT, not by an icon').toBe('Clear');

    expect(field.tagName).toBe('INPUT');
    expect(field.getAttribute('type')).toBe('text');
    expect(field.hasAttribute('tabindex')).toBe(false);
    // ...and it is labelled by a real <label> as well as named — the visible text a sighted
    // reader gets, which `aria-label` alone would not provide.
    const label = toolbarOf(table).querySelector(`.${FILTER_LABEL_CLASS}`)!;
    expect(label.tagName).toBe('LABEL');
    expect(label.contains(field)).toBe(true);
    expect(label.textContent).toContain('Filter');
  });
});

describe('3.7 · F16 — the names carry selection AND action, and the clear`s moves with the state', () => {
  it('the field names the TABLE it filters, never its position', () => {
    const { column } = enhanced(FILTER_DOC);
    const field = fieldOf(tableIn(column));

    // RED-FIRST target: `aria-label="Filter"` — correct about the action, silent about which of
    // the page's tables it acts on, which is exactly row 17's failure.
    expect(field.getAttribute('aria-label')).toBe('Filter the dept, who, n table');
    // ...and the visible label text is a PREFIX of it, so label-in-name holds.
    expect(field.getAttribute('aria-label')!.startsWith('Filter')).toBe(true);
  });

  it('★ the clear control names what it clears, and its name MOVES with the state', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const clear = clearOf(table);

    expect(clear.getAttribute('aria-label')).toBe('Clear the filter on the dept, who, n table');

    typeFilter(table, 'eng');
    // RED-FIRST target: a static name. It reads correctly on the line above and says nothing
    // about the state on this one.
    expect(clear.getAttribute('aria-label')).toBe(
      'Clear the filter on the dept, who, n table. Showing 2 of 3 rows.',
    );

    clear.click();
    expect(clear.getAttribute('aria-label')).toBe('Clear the filter on the dept, who, n table');
  });

  it('a header row that names nothing falls back to "this table", never to an index', () => {
    const { column } = enhanced(
      '<table><thead><tr><th></th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>\n',
    );
    // RED-FIRST target: `Filter table 2`. Position is what row 17 forbids, and it is the fallback
    // a nameless header invites — so the nameless case is where the rule is actually tested.
    expect(fieldOf(tableIn(column)).getAttribute('aria-label')).toBe('Filter this table');
  });
});

describe('3.7 · F17 — no new global single-key shortcut, and the field is the only way in', () => {
  it('the filter binds NOTHING on document or window', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${FILTER_DOC}`, host, { contained: true });

    const onDoc = vi.spyOn(document, 'addEventListener');
    const onWin = vi.spyOn(window, 'addEventListener');
    enhanceTables(host);

    // ★ *"a global single-key shortcut and a text field the reader types into are the same
    // keystroke"* (F17). Asserted as the absence of the seam a shortcut would need.
    expect(onDoc).not.toHaveBeenCalled();
    expect(onWin).not.toHaveBeenCalled();
    // The firing control: the filter really installed in this same sample.
    const table = tableIn(host.shadowRoot!.querySelector('.peekover-reader')!);
    expect(fieldOf(table)).not.toBeNull();
    typeFilter(table, 'eng');
    expect(shownRowsOf(table)).toHaveLength(2);
  });
});

// ══ F4 · PER TABLE ════════════════════════════════════════════════════════════════════════════

describe('3.7 · F4 — each table`s filter acts on ITS OWN table', () => {
  it('filtering table 2 hides rows in table 2 and changes nothing in table 1', () => {
    const { column } = enhanced(
      `${gfmTable('one', '| b | 2 |', '| a | 1 |')}\n${gfmTable('two', '| d | 4 |', '| c | 3 |')}`,
    );
    const first = tableIn(column, 0);
    const second = tableIn(column, 1);
    expect(bodyRowsOf(first)).toHaveLength(2);
    expect(bodyRowsOf(second)).toHaveLength(2);

    typeFilter(second, 'd');

    // RED-FIRST target: a handler resolving its table with a document-time `querySelector` reaches
    // the FIRST table — the `diagramLightbox:354,429` defect class, where 007 found it. Both lines
    // below move in that arm, in opposite directions.
    expect(shownText(second, 0)).toEqual(['d']);
    expect(shownRowsOf(first), 'the OTHER table must not have been filtered').toHaveLength(2);
    expect(countOf(first).hidden).toBe(true);
    expect(countOf(second).hidden).toBe(false);
  });
});

// ══ F23 · SORT ∘ FILTER COMPOSE — the property with no sibling, no mockup and no Verify clause ══
//
// 3.1 enumerated F23 and routed it NOWHERE: it is the composition of two controls, so it could not
// exist until both did. 3.6 built the sort and 3.7 builds the filter, so 3.7 is the first task
// where it is a question at all — and it is ASSERTED here rather than named, in BOTH orders,
// because "they compose" is one claim per direction and a build can get one right and the other
// wrong. The real-engine half (the same two orders, driven through a live keyboard and a live
// click) is `tableFilter.browser.test.ts`'s.

describe('3.7 · ★ F23 — sort and filter compose, in both orders', () => {
  it('FILTERING A SORTED TABLE leaves the sort`s order among the rows still shown', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    buttonsOf(table)[2].click(); // sort by n, ascending: 2, 9, 10
    expect(columnText(table, 1)).toEqual(['bo', 'adam', 'zoe']);

    typeFilter(table, 'eng');

    // ★ THE ROWS STILL SHOWN ARE IN THE SORT'S ORDER, not the document's. A filter that rebuilt
    // the body from source — or that re-appended the matches — reads ['zoe','adam'] here.
    expect(shownText(table, 1)).toEqual(['adam', 'zoe']);
    expect(shownText(table, 2)).toEqual(['9', '10']);
    // And the sort is still ON, in the ARIA and in the text.
    expect(headerCellsOf(table)[2].getAttribute('aria-sort')).toBe('ascending');
  });

  it('SORTING A FILTERED TABLE un-hides no hidden row and loses no hidden row', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const documentOrder = bodyRowsOf(table);

    typeFilter(table, 'eng');
    expect(shownText(table, 1)).toEqual(['zoe', 'adam']);
    const hiddenBefore = bodyRowsOf(table).filter((row) => row.hidden);
    expect(hiddenBefore, 'the fixture must really have a hidden row to lose').toHaveLength(1);

    buttonsOf(table)[2].click(); // sort by n while the filter is applied

    // ★ NOTHING WAS UN-HIDDEN. A sort that rebuilt the rows, or that restored the captured
    // document children as fresh nodes, would show `bo` again — the exact defect F23 names.
    expect(shownText(table, 1)).toEqual(['adam', 'zoe']);
    expect(bodyRowsOf(table).filter((row) => row.hidden)).toEqual(hiddenBefore);
    // ★ AND NOTHING WAS LOST: the hidden row is still in the table, in the sorted position it
    // would have taken had it been visible (2 < 9 < 10, so it leads).
    expect(bodyRowsOf(table)).toHaveLength(3);
    expect(new Set(bodyRowsOf(table))).toEqual(new Set(documentOrder));
    expect(columnText(table, 2)).toEqual(['2', '9', '10']);

    // ...and clearing from the sorted state restores every row into the SORTED order, because the
    // filter never had an order of its own to impose.
    clearOf(table).click();
    expect(shownRowsOf(table)).toHaveLength(3);
    expect(columnText(table, 1)).toEqual(['bo', 'adam', 'zoe']);
  });

  it('the sort`s "off" restores document order WITHOUT disturbing the filter', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);

    typeFilter(table, 'eng');
    const button = buttonsOf(table)[2];
    button.click(); // ascending
    button.click(); // descending
    button.click(); // off — replays the captured child list

    expect(columnText(table, 1)).toEqual(['zoe', 'adam', 'bo']);
    // The captured list is the same live nodes, so their `hidden` rides back with them.
    expect(shownText(table, 1)).toEqual(['zoe', 'adam']);
    expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');
  });
});

// ══ F25, F26 · TRUST AND FAILURE ══════════════════════════════════════════════════════════════

describe('3.7 · F25 — the filter introduces NO HTML string', () => {
  it('★ nothing the filter builds or does assigns innerHTML — with a control that fires', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${FILTER_DOC}`, host, { contained: true });
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const table = tableIn(column);
    const toolbar = document.createElement('div');
    table.before(toolbar);

    // The spy goes on AFTER the mount, so what is under measurement is this module and not the
    // sanitizer's own commit.
    const setHtml = vi.spyOn(Element.prototype, 'innerHTML', 'set');

    const undo = installTableFilter(table, toolbar)!;
    typeFilter(table, 'eng');
    typeFilter(table, 'nothing matches');
    clearOf(table).click();
    undo();

    // AGENTS.md #3 / §5 Trust: hiding a row is a node operation on already-sanitized nodes, and
    // every node the filter creates is built as DOM. Nothing re-enters the sanitizer.
    expect(setHtml).not.toHaveBeenCalled();
    // ★ THE FIRING CONTROL. Without it, "not called" is equally true of a spy that was never
    // wired to anything — the instrument has to be seen to record.
    document.createElement('div').innerHTML = '<b>x</b>';
    expect(setHtml).toHaveBeenCalledTimes(1);
  });
});

describe('3.7 · F26 — a filter action that FAILS says so and leaves the table readable', () => {
  it('★ a row whose own text accessor throws: every row shown, and a message that says why', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // A failure the module has no knowledge of, injected where it really can happen: reading a
    // row's displayed text is a DOM accessor call, and this is the shipped path, not a test-only
    // branch. It is injected on the SECOND row so the loop is already partway through.
    Object.defineProperty(bodyRowsOf(table)[1], 'textContent', {
      configurable: true,
      get() {
        throw new Error('the row text accessor is poisoned');
      },
    });

    expect(() => typeFilter(table, 'eng')).not.toThrow();

    // ★ READABLE — and specifically NOT left half-filtered. Row 0 matched and row 1 threw, so a
    // loop that simply gave up would have left row 2 hidden with no explanation and no way back.
    expect(shownRowsOf(table), 'every row must be shown again').toHaveLength(3);
    expect(emptyStateOf(table).hidden).toBe(true);
    // ★ AND IT SAYS SO (§4), in the same polite region the count uses (row 20's second half).
    expect(countOf(table).hidden).toBe(false);
    expect(countOf(table).textContent).toBe('Filter unavailable. Showing every row.');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

// ══ THE 3.2 / 3.6 PROPERTIES, AND D-7 ═════════════════════════════════════════════════════════

describe('3.7 · the filter does not break what 3.2 and 3.6 established', () => {
  it('IDEMPOTENT — enhancing twice leaves ONE filter, one clear and one count', () => {
    const { host, column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const afterFirst = column.innerHTML;

    enhanceTables(host);

    expect(toolbarOf(table).querySelectorAll(`.${FILTER_FIELD_CLASS}`)).toHaveLength(1);
    expect(toolbarOf(table).querySelectorAll(`.${FILTER_CLEAR_CLASS}`)).toHaveLength(1);
    expect(table.querySelectorAll(`.${FILTER_EMPTY_CLASS}`)).toHaveLength(1);
    expect(column.innerHTML).toBe(afterFirst);
  });

  it('HEADER-GATED — a headerless table grows no filter (F2)', () => {
    const { column } = enhanced('<table><tbody><tr><td>a</td></tr></tbody></table>\n');
    const table = tableIn(column);
    expect(table.hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(table.previousElementSibling?.querySelector(`.${FILTER_FIELD_CLASS}`) ?? null).toBeNull();
  });

  it('TOTAL — a header table with no body rows is enhanced and gets NO filter', () => {
    // Not a threshold (§8-3 is 5.5's): there is simply nothing to filter.
    const { column } = enhanced('<table><thead><tr><th>h</th></tr></thead></table>\n');
    const table = tableIn(column);
    expect(table.getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    expect(toolbarOf(table).querySelectorAll(`.${FILTER_FIELD_CLASS}`)).toHaveLength(0);
  });

  it('TOTAL — a RAGGED body filters and does not throw', () => {
    const { column } = enhanced(
      '<table><thead><tr><th>h</th><th>i</th></tr></thead>' +
        '<tbody><tr><td>b</td><td>2</td></tr><tr><td>a</td></tr></tbody></table>\n',
    );
    const table = tableIn(column);
    expect(() => typeFilter(table, 'a')).not.toThrow();
    // Defined, not merely non-throwing: the short row's displayed text is still matched.
    expect(shownRowsOf(table)).toHaveLength(1);
    expect(countOf(table).textContent).toBe('Showing 1 of 2 rows');
  });

  it('the SORT still works, unchanged, with the filter installed beside it', () => {
    const { column } = enhanced(FILTER_DOC);
    const table = tableIn(column);
    const documentOrder = bodyRowsOf(table);

    buttonsOf(table)[0].click();
    expect(columnText(table, 0)).toEqual(['eng', 'eng', 'ops']);
    expect(columnText(table, 1), '3.6`s stability, still stable').toEqual(['zoe', 'adam', 'bo']);
    buttonsOf(table)[0].click();
    buttonsOf(table)[0].click();
    expect(bodyRowsOf(table)).toEqual(documentOrder);
  });
});

describe('3.7 · D-7 — the filter is a NEW failure source inside the per-table try', () => {
  it('a throw out of the filter install does not escape, and the table is left as rendered', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${FILTER_DOC}\n${FILTER_DOC}`, host, { contained: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const tables = [...column.querySelectorAll('table')];
    expect(tables).toHaveLength(2);
    const htmlBefore = column.innerHTML;

    // The filter's LAST mutation, poisoned: the empty state's insertion, which lands after the
    // sort has already moved every header cell's nodes into a button. Nothing may survive it.
    Object.defineProperty(tables[0].tBodies[0], 'after', {
      configurable: true,
      value() {
        throw new Error('the filter install is poisoned');
      },
    });

    expect(() => enhanceTables(host)).not.toThrow();

    expect(tables[0].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(tables[1].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    // ★ EXACTLY as rendered — the sort's buttons AND the filter's three controls are gone, and so
    // is the toolbar host they were in. A `<th>` left holding a button, or a strip left holding a
    // field, is a visible defect and not an untidiness.
    expect(tables[0].outerHTML).toBe(
      new DOMParser().parseFromString(htmlBefore, 'text/html').querySelector('table')!.outerHTML,
    );
    expect(tables[0].previousElementSibling?.className).not.toBe(TABLE_TOOLBAR_CLASS);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('3.7 · the filter`s undo restores the table exactly', () => {
  it('removes the controls and the empty state, and un-hides everything it hid', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${FILTER_DOC}`, host, { contained: true });
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const table = tableIn(column);
    const before = column.innerHTML;
    const toolbar = document.createElement('div');
    table.before(toolbar);

    const undo = installTableFilter(table, toolbar)!;
    expect(undo, 'nothing to undo — the fixture did not install').toBeTypeOf('function');
    typeFilter(table, 'eng'); // undone from a FILTERED state, not a pristine one
    expect(bodyRowsOf(table).filter((row) => row.hidden)).toHaveLength(1);

    undo();

    // The undo owns its own controls; the host is `tableEnhancer`'s to remove (it does, in the
    // per-table catch), so the two are separated here rather than conflated.
    expect(toolbar.childNodes, 'the undo must empty the strip it filled').toHaveLength(0);
    toolbar.remove();

    // Byte-for-byte the markup `mount()` committed: no second tbody, and no `hidden` left behind.
    expect(column.innerHTML).toBe(before);
    expect(table.tBodies).toHaveLength(1);
    expect(bodyRowsOf(table).some((row) => row.hidden)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3.8 — THE COPY-OUT (F22 · D-10 · gate-2 ruling Q2)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ★ THE SERIALIZER IS A UNIT AND NOT A GLANCE, AND THE THREE CHARACTERS ARE WHY. A cell containing
// a COMMA is two cells in every spreadsheet that reads an unquoted CSV; a cell containing a QUOTE
// terminates the field early; a cell containing a PIPE ends the row in every markdown renderer.
// All three are silent — the output is well formed, just not the table. So the escaping is asserted
// by ROUND-TRIPPING the serialized text back into fields, which is the reading that can actually
// fail: an assertion on the string alone would be satisfied by whatever the serializer emitted.
//
// ★ WHAT IS HERE AND WHAT IS IN `tests/browser/tableCopy.browser.test.ts`. This suite answers the
// serializer, the row set, the button shape, the failure path and the properties — all of which are
// DOM shape and pure functions. What it CANNOT answer is whether a REAL engine's clipboard accepts
// a gesture-driven write at `permissions: []`, which is the whole of D-10 and is asserted there, in
// Chromium AND Firefox, against the real `navigator.clipboard`.

const COPY_DOC = [
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
  '',
].join('\n');

/**
 * The body's named fixture, as a DOCUMENT rather than a hand-built string: a cell containing a
 * COMMA, a QUOTE and a PIPE at once. The pipe is written `\|` in the GFM source because that is how
 * a pipe reaches a cell at all; what the reader SEES — and what must be re-escaped on the way out —
 * is the bare `|`. `typographer` is off (`parse.ts:26`), so the quotes stay the ASCII ones.
 */
const ESCAPE_DOC = ['| what | n |', '| --- | --- |', '| a, "b" \\| c | 1 |', ''].join('\n');

const copyButtonsOf = (table: HTMLTableElement): HTMLButtonElement[] => [
  ...toolbarOf(table).querySelectorAll<HTMLButtonElement>(`.${COPY_BUTTON_CLASS}`),
];
const csvButtonOf = (table: HTMLTableElement): HTMLButtonElement =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_CSV_CLASS}`)!;
const markdownButtonOf = (table: HTMLTableElement): HTMLButtonElement =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_MARKDOWN_CLASS}`)!;
const statusOf = (table: HTMLTableElement): HTMLElement =>
  toolbarOf(table).querySelector<HTMLElement>(`.${COPY_STATUS_CLASS}`)!;

/** The task the promise settles in — the write is async even when it cannot happen at all. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

interface ClipboardStub {
  readonly written: string[];
  restore: () => void;
}

/**
 * Replace `navigator.clipboard` with a recorder.
 *
 * jsdom implements NO clipboard at all, so the property is absent by default — which is why the
 * unavailable case below needs no stub, and why a case that wants a SUCCESS needs this one. It is
 * defined on the window's own navigator, which is exactly what `writeToClipboard` reads.
 */
function stubClipboard(behaviour: 'resolve' | 'reject' | 'throw' = 'resolve'): ClipboardStub {
  const written: string[] = [];
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText(text: string): Promise<void> {
        if (behaviour === 'throw') throw new Error('writeText threw synchronously');
        if (behaviour === 'reject') return Promise.reject(new Error('NotAllowedError'));
        written.push(text);
        return Promise.resolve();
      },
    },
  });
  return {
    written,
    restore: () => Reflect.deleteProperty(window.navigator, 'clipboard'),
  };
}

/** CSV back into fields — RFC 4180 in reverse, so the escaping is checked by what it DECODES to. */
function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      i += 1;
    } else field += ch;
  }
  row.push(field);
  records.push(row);
  return records;
}

/** A GFM table row back into cells: split on UNESCAPED pipes, then unescape. */
function parseMarkdownRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let escaped = false;
  for (const ch of line.trim().replace(/^\|/, '').replace(/\|$/, '')) {
    if (escaped) {
      cell += ch;
      escaped = false;
    } else if (ch === '\\') escaped = true;
    else if (ch === '|') {
      cells.push(cell);
      cell = '';
    } else cell += ch;
  }
  cells.push(cell);
  return cells.map((text) => text.trim());
}

// ══ THE SERIALIZER — THE PURE HALF ════════════════════════════════════════════════════════════

describe('3.8 · csvField — RFC 4180, the three conditions that need a quote', () => {
  it('leaves an ordinary field alone', () => {
    expect(csvField('eng')).toBe('eng');
    expect(csvField('')).toBe('');
    expect(csvField('a b')).toBe('a b');
  });

  it('★ a COMMA quotes the field — the defect is two cells where there was one', () => {
    expect(csvField('a, b')).toBe('"a, b"');
  });

  it('★ a QUOTE is DOUBLED, and the field is quoted', () => {
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('a NEWLINE quotes the field — the RFC allows the break INSIDE a quoted field', () => {
    expect(csvField('a\nb')).toBe('"a\nb"');
    expect(csvField('a\r\nb')).toBe('"a\r\nb"');
  });
});

describe('3.8 · markdownField — the pipe, and the backslash that must go first', () => {
  it('★ a PIPE is escaped — the defect is a row that ends mid-cell', () => {
    expect(markdownField('a | b')).toBe('a \\| b');
  });

  it('★ the BACKSLASH is escaped FIRST, so a cell holding one survives its own escape', () => {
    // A cell whose displayed text is `a\|b`. Escaping the pipe ALONE emits `a\\|b`, which markdown
    // reads as an escaped BACKSLASH followed by a BARE pipe — the table breaks on exactly the
    // character the escape was for. The ORDER is the correctness, and this is the fixture that can
    // tell the two orders apart.
    expect(markdownField('a\\|b')).toBe('a\\\\\\|b');
    expect(parseMarkdownRow(`| ${markdownField('a\\|b')} |`)).toEqual(['a\\|b']);
  });

  it('a newline becomes a space — a GFM table row IS one line', () => {
    expect(markdownField('a\nb')).toBe('a b');
    expect(markdownField('a\r\nb')).toBe('a b');
  });
});

describe('3.8 · toCsv / toMarkdownTable — the shapes the two formats have', () => {
  const MATRIX = [
    ['dept', 'who'],
    ['eng', 'zoe'],
  ];

  it('CSV records are separated by CRLF, with no trailing terminator', () => {
    expect(toCsv(MATRIX)).toBe('dept,who\r\neng,zoe');
  });

  it('the markdown table carries the DELIMITER row that makes it a table at all', () => {
    expect(toMarkdownTable(MATRIX)).toBe('| dept | who |\n| --- | --- |\n| eng | zoe |');
  });

  it('an empty matrix is the empty string, not a lone delimiter', () => {
    expect(toMarkdownTable([])).toBe('');
    expect(toCsv([])).toBe('');
  });
});

describe('3.8 · ★ the body`s named fixture — a cell with a COMMA, a QUOTE and a PIPE', () => {
  it('★ the CSV round-trips to the SAME cell, which an un-escaped serializer cannot', () => {
    const { column } = enhanced(ESCAPE_DOC);
    const table = tableIn(column);
    const cell = bodyRowsOf(table)[0].cells[0].textContent ?? '';

    // The FIRING CONTROL: the fixture really does put all three characters on the screen. Without
    // it, every assertion below is equally true of a cell that never contained them.
    expect(cell, 'the fixture must show a comma').toContain(',');
    expect(cell, 'the fixture must show a quote').toContain('"');
    expect(cell, 'the fixture must show a pipe').toContain('|');

    const matrix = copyMatrix(['what', 'n'], bodyRowsOf(table));
    expect(matrix[1][0]).toBe('a, "b" | c');

    // RED-FIRST TARGET: a serializer that does not quote the comma emits `a, "b" | c,1`, which
    // decodes to THREE fields. The round trip is what sees that; a string comparison would only
    // ever restate whatever was emitted.
    const decoded = parseCsv(toCsv(matrix));
    expect(decoded).toHaveLength(2);
    expect(decoded[1], 'the record must decode back to exactly two fields').toHaveLength(2);
    expect(decoded[1][0]).toBe('a, "b" | c');
    expect(decoded[1][1]).toBe('1');
  });

  it('★ the MARKDOWN round-trips to the SAME cell — the pipe does not end the row', () => {
    const { column } = enhanced(ESCAPE_DOC);
    const table = tableIn(column);
    const matrix = copyMatrix(['what', 'n'], bodyRowsOf(table));

    const lines = toMarkdownTable(matrix).split('\n');
    expect(lines).toHaveLength(3); // header, delimiter, one row

    // RED-FIRST TARGET: an un-escaped pipe makes this row decode to THREE cells against a
    // two-column delimiter — a table every renderer draws wrong.
    const decoded = parseMarkdownRow(lines[2]);
    expect(decoded, 'the row must decode back to exactly two cells').toHaveLength(2);
    expect(decoded[0]).toBe('a, "b" | c');
    expect(decoded[1]).toBe('1');
  });
});

// ══ F22 — THE ROWS CURRENTLY SHOWN, IN THE ORDER CURRENTLY SHOWN ══════════════════════════════

describe('3.8 · shownRowsIn — the row set is the filter`s own definition of shown', () => {
  it('skips the hidden rows and keeps DOM order', () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);
    const rows = bodyRowsOf(table);
    rows[1].hidden = true;

    expect(shownRowsIn(table.tBodies[0])).toEqual([rows[0], rows[2]]);
  });
});

describe('3.8 · ★ F22 — what you SEE is what you COPY, composed with BOTH controls', () => {
  it('★ a SORTED and FILTERED table copies the shown rows in the shown order', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      buttonsOf(table)[2].click(); // sort by `n`, ascending: 2, 9, 10
      typeFilter(table, 'eng'); // hides the `ops` row

      // ★ THE FIXTURE IS THE INSTRUMENT: document order is zoe / adam / bo and screen order is
      // adam / zoe, so the two share NO position and NO row set. A copy reading `documentOrder`,
      // or the source, emits three rows in the other order — F22's exact defect, and it cannot
      // look right here.
      expect(columnText(table, 1), 'the fixture must really be re-ordered').toEqual([
        'bo',
        'adam',
        'zoe',
      ]);
      expect(shownText(table, 1), 'and really be filtered').toEqual(['adam', 'zoe']);

      csvButtonOf(table).click();
      await settle();

      expect(clipboard.written).toHaveLength(1);
      expect(clipboard.written[0]).toBe('dept,who,n\r\neng,adam,9\r\neng,zoe,10');
      expect(statusOf(table).textContent).toBe('Copied 2 rows as CSV.');
    } finally {
      clipboard.restore();
    }
  });

  it('★ the same table, as MARKDOWN — the same set and the same order', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      buttonsOf(table)[2].click();
      typeFilter(table, 'eng');
      markdownButtonOf(table).click();
      await settle();

      expect(clipboard.written[0]).toBe(
        [
          '| dept | who | n |',
          '| --- | --- | --- |',
          '| eng | adam | 9 |',
          '| eng | zoe | 10 |',
        ].join('\n'),
      );
      expect(statusOf(table).textContent).toBe('Copied 2 rows as Markdown.');
    } finally {
      clipboard.restore();
    }
  });
});

describe('3.8 · ★ F22, continued — the header, the empty result, the count', () => {
  it('★ the header carries the COLUMN NAMES, not the sort control`s state and glyph', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);
      buttonsOf(table)[0].click(); // sort by `dept`, ascending

      // The FIRING CONTROL: by now the `<th>` really does read more than its own label, so the
      // assertion below is about WHERE the labels come from and not about a header that never
      // changed. RED-FIRST TARGET: a `textContent` read at CLICK time copies this string.
      expect(
        headerCellsOf(table)[0].textContent,
        'the sort must have painted its state into the header',
      ).toContain('ascending');

      csvButtonOf(table).click();
      await settle();

      expect(clipboard.written[0].split('\r\n')[0]).toBe('dept,who,n');
    } finally {
      clipboard.restore();
    }
  });

  it('a filter matching NO row copies the header alone, and says zero', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);
      typeFilter(table, 'nothing matches');
      csvButtonOf(table).click();
      await settle();

      expect(clipboard.written[0]).toBe('dept,who,n');
      expect(statusOf(table).textContent).toBe('Copied 0 rows as CSV.');
    } finally {
      clipboard.restore();
    }
  });

  it('copiedText is singular at one row', () => {
    expect(copiedText(1, 'CSV')).toBe('Copied 1 row as CSV.');
    expect(copiedText(0, 'Markdown')).toBe('Copied 0 rows as Markdown.');
  });
});

describe('3.8 · copyMatrix — rectangular at the widest thing on screen', () => {
  it('pads a SHORT row and keeps an OVER-WIDE row`s extra cell', () => {
    const { column } = enhanced(
      '<table><thead><tr><th>h</th><th>i</th></tr></thead>' +
        '<tbody><tr><td>a</td></tr><tr><td>b</td><td>2</td><td>x</td></tr></tbody></table>\n',
    );
    const table = tableIn(column);
    const matrix = copyMatrix(['h', 'i'], bodyRowsOf(table));

    expect(matrix).toEqual([
      ['h', 'i', ''],
      ['a', '', ''],
      ['b', '2', 'x'],
    ]);
    // Every record has the same field count, which is what both formats require of themselves.
    expect(new Set(matrix.map((row) => row.length)).size).toBe(1);
  });

  it('collapses the whitespace the SCREEN collapses', () => {
    const { column } = enhanced(
      '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>a\n   b</td></tr></tbody></table>\n',
    );
    const table = tableIn(column);
    expect(copyMatrix(['h'], bodyRowsOf(table))[1][0]).toBe('a b');
  });
});

// ══ GATE-2 RULING Q2 — TWO BUTTONS, NO MENU ═══════════════════════════════════════════════════

describe('3.8 · ★ gate-2 Q2 — TWO real buttons in the strip, and no overlay of any kind', () => {
  it('exactly two, each a real <button> with no tabindex of its own', () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);
    const copies = copyButtonsOf(table);

    expect(copies).toHaveLength(2);
    for (const button of copies) {
      // Selected BY CLASS above, so a non-button control is FOUND and this is the clause seen to
      // fail — never a `querySelector` that returns nothing and dies on a dereference instead.
      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.hasAttribute('tabindex')).toBe(false);
    }
    expect(copies[0]).toBe(csvButtonOf(table));
    expect(copies[1]).toBe(markdownButtonOf(table));
  });

  it('★ NO menu, NO popup, NO focus trap — §3.11 rows 9 and 21 stay inactive', () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);

    // The ruling is CHECKABLE rather than merely recorded: a menu version needs at least one of
    // these, and none of them exists anywhere in the reading column.
    expect(column.querySelectorAll('[aria-haspopup]')).toHaveLength(0);
    expect(
      column.querySelectorAll('[role="menu"], [role="menuitem"], [role="dialog"]'),
    ).toHaveLength(0);
    expect(column.querySelectorAll('dialog')).toHaveLength(0);
    expect(toolbarOf(table).hasAttribute('role')).toBe(false);
    for (const button of copyButtonsOf(table)) {
      expect(button.hasAttribute('aria-expanded')).toBe(false);
      expect(button.hasAttribute('aria-controls')).toBe(false);
    }
  });

  it('the accessible name carries ACTION and SELECTION, and the visible text is inside it', () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);

    expect(csvButtonOf(table).textContent).toBe('Copy CSV');
    expect(csvButtonOf(table).getAttribute('aria-label')).toBe(
      'Copy CSV from the dept, who, n table',
    );
    expect(markdownButtonOf(table).getAttribute('aria-label')).toBe(
      'Copy Markdown from the dept, who, n table',
    );
    // WCAG 2.5.3 label-in-name: the accessible name CONTAINS the visible text, so a voice-control
    // reader saying what they can see reaches the control they can see.
    for (const button of copyButtonsOf(table)) {
      expect(button.getAttribute('aria-label')).toContain(button.textContent);
    }
  });
});

describe('3.8 · the copy`s own status region (row 20 / F13`s property, one control over)', () => {
  it('is POLITE and OUT of the a11y tree while silent', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      expect(statusOf(table).getAttribute('role')).toBe('status');
      expect(statusOf(table).hidden, 'a silent region stays OUT of the tree').toBe(true);
      expect(statusOf(table).textContent).toBe('');

      csvButtonOf(table).click();
      await settle();
      expect(statusOf(table).hidden).toBe(false);
    } finally {
      clipboard.restore();
    }
  });

  it('★ it is NOT the filter`s count — a copy never erases "n of m shown"', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);
      typeFilter(table, 'eng');
      expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');

      csvButtonOf(table).click();
      await settle();

      // §4's "how many are shown out of how many" survives an unrelated action.
      expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');
      expect(statusOf(table).textContent).toBe('Copied 2 rows as CSV.');
    } finally {
      clipboard.restore();
    }
  });
});

// ══ §3.8 / D-7 — THE CLIPBOARD CAN REFUSE, AND THAT IS A STATED FAILURE ═══════════════════════

describe('3.8 · ★ an unavailable clipboard degrades to a STATED failure, never a throw', () => {
  it('★ NO clipboard at all (jsdom`s own state) — announced, not thrown, table untouched', async () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // The FIRING CONTROL for the condition itself: this environment really has no clipboard, so
    // the failure below is the shipped path and not an injected branch.
    expect(window.navigator.clipboard, 'jsdom must have no clipboard').toBeUndefined();
    const before = table.outerHTML;

    expect(() => csvButtonOf(table).click()).not.toThrow();
    await settle();

    expect(statusOf(table).hidden).toBe(false);
    expect(statusOf(table).textContent).toBe('Copy unavailable. The table is unchanged.');
    // §3.8: a stated failure BESIDE A STILL-READABLE TABLE — never a broken button.
    expect(table.outerHTML).toBe(before);
    expect(shownRowsOf(table)).toHaveLength(3);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('★ a REJECTED write — the rejection is async, and it is caught ON THE PROMISE', async () => {
    const clipboard = stubClipboard('reject');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      // RED-FIRST TARGET: a synchronous `try` around the call catches nothing here, so the
      // rejection escapes as an unhandled promise rejection out of a click handler — D-7's
      // totality broken on the one path that is not synchronous.
      expect(() => markdownButtonOf(table).click()).not.toThrow();
      await settle();

      expect(statusOf(table).textContent).toBe('Copy unavailable. The table is unchanged.');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      clipboard.restore();
    }
  });

  it('a write that throws SYNCHRONOUSLY is the same stated failure', async () => {
    const clipboard = stubClipboard('throw');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      expect(() => csvButtonOf(table).click()).not.toThrow();
      await settle();

      expect(statusOf(table).textContent).toBe('Copy unavailable. The table is unchanged.');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      clipboard.restore();
    }
  });

  it('a SERIALIZATION failure says the same thing and writes NOTHING', async () => {
    const clipboard = stubClipboard();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { column } = enhanced(COPY_DOC);
      const table = tableIn(column);

      // Reading a cell's displayed text is a DOM accessor call and can therefore throw. Injected
      // where it really happens, not at a seam invented for the test.
      Object.defineProperty(bodyRowsOf(table)[1].cells[0], 'textContent', {
        configurable: true,
        get() {
          throw new Error('the cell text accessor is poisoned');
        },
      });

      expect(() => csvButtonOf(table).click()).not.toThrow();
      await settle();

      expect(clipboard.written, 'nothing may reach the clipboard').toHaveLength(0);
      expect(statusOf(table).textContent).toBe('Copy unavailable. The table is unchanged.');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      clipboard.restore();
    }
  });
});

// ══ THE 3.2 / 3.6 / 3.7 PROPERTIES, AND D-7 ═══════════════════════════════════════════════════

describe('3.8 · the copy does not break what 3.2, 3.6 and 3.7 established', () => {
  it('IDEMPOTENT — enhancing twice leaves TWO copy buttons and ONE status', () => {
    const { host, column } = enhanced(COPY_DOC);
    const table = tableIn(column);
    const afterFirst = column.innerHTML;

    enhanceTables(host);

    expect(copyButtonsOf(table)).toHaveLength(2);
    expect(toolbarOf(table).querySelectorAll(`.${COPY_STATUS_CLASS}`)).toHaveLength(1);
    expect(column.innerHTML).toBe(afterFirst);
  });

  it('HEADER-GATED — a headerless table grows no copy button', () => {
    const { column } = enhanced('<table><tbody><tr><td>a</td></tr></tbody></table>\n');
    const table = tableIn(column);
    expect(table.hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(
      table.previousElementSibling?.querySelectorAll(`.${COPY_BUTTON_CLASS}`) ?? [],
    ).toHaveLength(0);
  });

  it('TOTAL — a header table with no body rows is enhanced and gets NO copy button', () => {
    const { column } = enhanced('<table><thead><tr><th>h</th></tr></thead></table>\n');
    const table = tableIn(column);
    expect(table.getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    expect(toolbarOf(table).querySelectorAll(`.${COPY_BUTTON_CLASS}`)).toHaveLength(0);
  });

  it('the SORT and the FILTER still work, unchanged, with the copy installed beside them', () => {
    const { column } = enhanced(COPY_DOC);
    const table = tableIn(column);
    const documentOrder = bodyRowsOf(table);

    buttonsOf(table)[0].click();
    expect(columnText(table, 0)).toEqual(['eng', 'eng', 'ops']);
    expect(columnText(table, 1), '3.6`s stability, still stable').toEqual(['zoe', 'adam', 'bo']);
    buttonsOf(table)[0].click();
    buttonsOf(table)[0].click();
    expect(bodyRowsOf(table)).toEqual(documentOrder);

    typeFilter(table, 'eng');
    expect(shownText(table, 1)).toEqual(['zoe', 'adam']);
    expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');
    clearOf(table).click();
    expect(shownRowsOf(table)).toHaveLength(3);
  });
});

describe('3.8 · ★ SCOPED (row 11 / F4) — table 2`s buttons copy table 2', () => {
  it('each table`s copy reads its OWN rows, with the other table as the firing control', async () => {
    const clipboard = stubClipboard();
    try {
      const { column } = enhanced(
        `${gfmTable('one', '| b | 2 |', '| a | 1 |')}\n${gfmTable('two', '| d | 4 |', '| c | 3 |')}`,
      );

      csvButtonOf(tableIn(column, 1)).click();
      await settle();
      expect(clipboard.written[0]).toBe('two,n\r\nd,4\r\nc,3');

      // The FIRING CONTROL for the scope: table 1's own button copies table 1, so "table 2" above
      // is a statement about which handler ran and not about a document with one table in it.
      csvButtonOf(tableIn(column, 0)).click();
      await settle();
      expect(clipboard.written[1]).toBe('one,n\r\nb,2\r\na,1');
    } finally {
      clipboard.restore();
    }
  });
});

describe('3.8 · the copy introduces NO HTML string (§5, AGENTS.md #3)', () => {
  it('★ nothing the copy builds or does assigns innerHTML — with a control that fires', async () => {
    const clipboard = stubClipboard();
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${COPY_DOC}`, host, { contained: true });
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const table = tableIn(column);
    const toolbar = document.createElement('div');
    table.before(toolbar);

    // The spy goes on AFTER the mount, so what is measured is this module and not the sanitizer.
    const setHtml = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    try {
      const undo = installTableCopy(table, toolbar)!;
      toolbar.querySelector<HTMLButtonElement>(`.${COPY_CSV_CLASS}`)!.click();
      await settle();
      undo();

      expect(setHtml).not.toHaveBeenCalled();
      // ★ THE FIRING CONTROL — "not called" is equally true of a spy wired to nothing.
      document.createElement('div').innerHTML = '<b>x</b>';
      expect(setHtml).toHaveBeenCalledTimes(1);
    } finally {
      clipboard.restore();
    }
  });
});

describe('3.8 · D-7 — the copy is a NEW failure source inside the per-table try', () => {
  it('a throw out of the copy install does not escape, and the table is left as rendered', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${COPY_DOC}\n${COPY_DOC}`, host, { contained: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const tables = [...column.querySelectorAll('table')];
    expect(tables).toHaveLength(2);
    const htmlBefore = column.innerHTML;

    // The copy is the LAST install, so its throw lands after the sort has moved every header's
    // nodes into a button AND the filter has inserted its second `<tbody>`. Nothing may survive.
    // Poisoned on the copy's own attach call — three nodes into the strip — and on the FIRST
    // table only, so table 2 is the untouched arm.
    let fired = 0;
    const realAppend = HTMLElement.prototype.append;
    vi.spyOn(HTMLElement.prototype, 'append').mockImplementation(function (
      this: HTMLElement,
      ...nodes: (Node | string)[]
    ) {
      if (this.className === TABLE_TOOLBAR_CLASS && nodes.length === 3 && fired === 0) {
        fired += 1;
        throw new Error('the copy install is poisoned');
      }
      return realAppend.apply(this, nodes);
    });

    expect(() => enhanceTables(host)).not.toThrow();

    // The FIRING CONTROL: the injection really did fire, exactly once, on the first table.
    expect(fired, 'the poison never fired — the case would prove nothing').toBe(1);
    expect(tables[0].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(tables[1].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    // ★ EXACTLY as rendered: the sort's buttons, the filter's controls and its second `<tbody>`
    // are all gone, and so is the toolbar host they were in.
    expect(tables[0].outerHTML).toBe(
      new DOMParser().parseFromString(htmlBefore, 'text/html').querySelector('table')!.outerHTML,
    );
    expect(tables[0].previousElementSibling?.className).not.toBe(TABLE_TOOLBAR_CLASS);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('3.8 · the copy`s undo restores the strip exactly', () => {
  it('removes both buttons and the status region, and touches nothing else', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    mount(`# Doc\n\n${COPY_DOC}`, host, { contained: true });
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const table = tableIn(column);
    const before = column.innerHTML;
    const toolbar = document.createElement('div');
    table.before(toolbar);

    const undo = installTableCopy(table, toolbar)!;
    expect(undo, 'nothing to undo — the fixture did not install').toBeTypeOf('function');
    expect(toolbar.childNodes).toHaveLength(3);

    undo();

    expect(toolbar.childNodes, 'the undo must empty the strip it filled').toHaveLength(0);
    toolbar.remove();
    expect(column.innerHTML).toBe(before);
  });
});
