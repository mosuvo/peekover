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
import { TABLE_STATE_ATTR, enhanceTables } from './tableEnhancer';
import {
  SORT_BUTTON_CLASS,
  SORT_GLYPH_CLASS,
  SORT_STATE_CLASS,
  compareCellText,
  installTableSort,
  nextSortDirection,
  sortedRows,
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
