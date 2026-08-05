// @vitest-environment jsdom
//
// tableEnhancer's four properties (008 task 3.2) — TOTAL (D-7), SCOPED (D-8), IDEMPOTENT, and
// HEADER-GATED (§4) — plus the preceding-sibling placement D-12 chose because the mockup's
// `.tablewrap` does not exist in our DOM.
//
// The fixtures are REAL mount() output, not hand-built tables: what is under test is a walk over
// the column markdown-it and the sanitizer actually produce, and the headerless case only means
// anything because `parse.ts:24` sets `html: true` and `sanitize.ts:36` allows the table tags —
// so a hand-written `<table>` with no `<thead>` genuinely reaches the reading column from source
// (plan §0.2). Building that table with `createElement` would have tested the walk against a DOM
// no document can produce.
//
// The jsdom limit is respected: every assertion here is DOM SHAPE or a call outcome. Whether the
// toolbar stays inside the column's box at a wide viewport (§3.11 rows 5, 6) and whether a LIVE
// diff round trip leaves the column's tables enhanced and the diff's alone (D-8's other half) are
// questions jsdom cannot answer — they are 3.5's and 3.9's, in a real engine.
//
// ── HOW THE TWO D-7 HALVES ARE FORCED, AND WHY NO PRODUCTION SEAM WAS ADDED FOR THEM ──────────
//
// D-7 asks the function to survive failures it cannot predict, so the tests inject failures the
// module has no knowledge of: an own-property poison on ONE DOM method of ONE node. That exercises
// the shipped code path rather than a test-only branch — the alternative, an injectable "attach"
// hook, would have been a seam that exists solely to be broken, and the per-table try would then
// be proven only against the one failure the seam models.
//
//   • the PER-TABLE half is forced by poisoning `before` on the middle table of three — the
//     failure lands inside `attachToolbar`, where the per-table try is;
//   • the OUTER half is forced by poisoning `shadowRoot` on the host — the failure lands before
//     any table exists, so no per-table try can be inside it.
//
// Each is red-first by ABLATION, run and recorded rather than asserted: the red arm's measured
// signature is quoted at the assertion it protects.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from './mount';
import { parse } from './parse';
import { sanitize } from './sanitize';
import { TABLE_STATE_ATTR, TABLE_TOOLBAR_CLASS, enhanceTables } from './tableEnhancer';

const HOST_TAG = 'peekover-root';
const TOOLBAR_SELECTOR = `div.${TABLE_TOOLBAR_CLASS}`;

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  vi.restoreAllMocks();
});

/** A real mounted reader: parse -> sanitize -> shadow DOM, exactly as both surfaces commit it. */
function mountedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('mount() produced no shadow root');
  return { host, shadow };
}

function column(shadow: ShadowRoot): Element {
  const found = shadow.querySelector('.peekover-reader');
  if (!found) throw new Error('mount() produced no reading column');
  return found;
}

/** A GFM pipe table — markdown-it emits `<table><thead><tr><th>`. */
const gfmTable = (label: string): string =>
  `| ${label} | n |\n| --- | --- |\n| a | 1 |\n| b | 2 |\n`;

/** Raw HTML in source, passed through by `html: true` and kept by the sanitizer. */
const HEADERLESS_HTML_TABLE = '<table><tbody><tr><td>a</td><td>1</td></tr></tbody></table>\n';

/** A `<thead>` whose cells are `<td>`, not `<th>` — a header row in shape only. */
const TH_LESS_HEAD_HTML_TABLE =
  '<table><thead><tr><td>h</td></tr></thead><tbody><tr><td>a</td></tr></tbody></table>\n';

// ── HEADER-GATED (§4; §3.11 row 3's unit half) ────────────────────────────────────────────────

describe('the entry condition — a header row, and it is a real condition', () => {
  it('enhances a table WITH a <thead> <th>', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    enhanceTables(host);

    const tables = column(shadow).querySelectorAll('table');
    expect(tables).toHaveLength(1);
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(1);
    expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
  });

  it('leaves a headerless HTML table EXACTLY as rendered — no toolbar, no attribute', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${HEADERLESS_HTML_TABLE}`);
    const tables = column(shadow).querySelectorAll('table');
    // The premise the gate is a real condition rests on: this table exists in the column.
    expect(tables).toHaveLength(1);
    expect(tables[0].querySelector('th')).toBeNull();
    const htmlBefore = column(shadow).innerHTML;

    enhanceTables(host);

    // RED-FIRST (measured): with `if (!hasHeaderRow(table)) continue;` removed, this reads
    // `expected <div class="peekover-table-tools"></div> to have a length of +0 but got 1` —
    // a headerless table grows the chrome §4 says it must not, which is §3.11 row 3's "ungate
    // the header check" arm at unit level. (4 of 19 red in that arm.)
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(0);
    expect(tables[0].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(column(shadow).innerHTML).toBe(htmlBefore);
  });

  it('leaves a <thead> of <td> untouched — the gate is the <th>, not the <thead>', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${TH_LESS_HEAD_HTML_TABLE}`);
    expect(column(shadow).querySelector('thead')).not.toBeNull();

    enhanceTables(host);

    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(0);
  });

  it('enhances only the qualifying tables when a document mixes both', () => {
    const { host, shadow } = mountedHost(
      `# Doc\n\n${gfmTable('one')}\n${HEADERLESS_HTML_TABLE}\n${gfmTable('two')}`,
    );
    enhanceTables(host);

    const tables = [...column(shadow).querySelectorAll('table')];
    expect(tables).toHaveLength(3);
    expect(tables.map((t) => t.hasAttribute(TABLE_STATE_ATTR))).toEqual([true, false, true]);
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(2);
  });
});

// ── THE TOOLBAR IS A PRECEDING SIBLING (D-12) ─────────────────────────────────────────────────

describe('the toolbar host is a PRECEDING SIBLING — no wrapper, no move', () => {
  it('inserts immediately before its own table, in the table’s own parent', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    const table = column(shadow).querySelector('table');
    if (!table) throw new Error('no table');

    enhanceTables(host);

    const toolbar = column(shadow).querySelector(TOOLBAR_SELECTOR);
    expect(toolbar).not.toBeNull();
    expect(table.previousElementSibling).toBe(toolbar);
    expect(toolbar?.parentElement).toBe(table.parentElement);
  });

  it('leaves the <table>’s NODE IDENTITY and position unchanged — a wrap-and-restore fails here', () => {
    const { host, shadow } = mountedHost(`# Doc\n\nintro\n\n${gfmTable('col')}\n\noutro\n`);
    const col = column(shadow);
    const table = col.querySelector('table');
    if (!table) throw new Error('no table');
    const parentBefore = table.parentElement;
    const siblingAfterBefore = table.nextElementSibling;

    enhanceTables(host);

    // Asserted on IDENTITY, not on shape: a wrap-and-restore (insert a <div>, move the table into
    // it, put the toolbar in front) leaves a `previousElementSibling`-shaped tree and a table
    // whose parentElement is a NEW node. These three lines are what tells them apart.
    // RED-FIRST (measured) against a wrap-and-restore build of `attachToolbar`: the
    // `parentElement` line reads `expected <div class="peekover-table-wrap">…(2)</div> to be
    // <div class="peekover-reader">…(4)</div> // Object.is equality` — AND the
    // preceding-sibling test above still PASSES in that arm, which is the whole reason this
    // test is written on identity.
    expect(col.querySelector('table')).toBe(table);
    expect(table.parentElement).toBe(parentBefore);
    expect(table.nextElementSibling).toBe(siblingAfterBefore);
    // And no wrapper exists anywhere: every element between the column and the table is the
    // column itself.
    expect(table.parentElement).toBe(col);
  });

  it('the host carries 3.7’s FILTER and nothing else — and still no attribute but its class', () => {
    // ★ UPDATED AT 3.7, WHERE THE STRIP STOPPED BEING EMPTY. Through 3.6 this case read
    // `childNodes` of length 0, because D-12 divergence 1 puts the sort inside its own `<th>` and
    // nothing entered the strip. The filter is the first control that does: a `<label>` wrapping
    // the field, the clear `<button>` and the count region — three, and the two copy buttons of
    // 3.8 are what will make it five.
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    enhanceTables(host);

    const toolbar = column(shadow).querySelector(TOOLBAR_SELECTOR);
    expect(toolbar?.childNodes).toHaveLength(3);
    // ★ AND THE HOST ITSELF STILL DECLARES NO `role` AND NO LABEL, which is now a DECISION rather
    // than a wait: `role="toolbar"` promises arrow-key navigation and a roving tab stop, and
    // declaring it without implementing it is worse than three native controls in document order.
    expect(toolbar?.attributes).toHaveLength(1); // class, and nothing else
  });

  it('anchors each toolbar to ITS OWN table on a multi-table document', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('one')}\n${gfmTable('two')}`);
    enhanceTables(host);

    const tables = [...column(shadow).querySelectorAll('table')];
    const toolbars = [...column(shadow).querySelectorAll(TOOLBAR_SELECTOR)];
    expect(toolbars).toHaveLength(2);
    expect(tables[0].previousElementSibling).toBe(toolbars[0]);
    expect(tables[1].previousElementSibling).toBe(toolbars[1]);
    expect(toolbars[0]).not.toBe(toolbars[1]);
  });
});

// ── IDEMPOTENT (the DIAGRAM_STATE_ATTR precedent) ─────────────────────────────────────────────

describe('idempotence — twice is once', () => {
  it('counts ONE toolbar after enhancing twice', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('one')}\n${gfmTable('two')}`);

    enhanceTables(host);
    const afterFirst = column(shadow).innerHTML;
    enhanceTables(host);

    // RED-FIRST (measured): with `if (table.hasAttribute(TABLE_STATE_ATTR)) continue;` removed,
    // this reads `expected …(4) to have a length of 2 but got 4` — one toolbar per table per
    // pass, which is what a re-render-driven call site would produce on every re-render.
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(2);
    expect(column(shadow).innerHTML).toBe(afterFirst);
  });

  it('is a no-op on a third pass too', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    enhanceTables(host);
    enhanceTables(host);
    enhanceTables(host);
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(1);
  });
});

// ── SCOPED TO `.peekover-reader` (D-8's unit half) ────────────────────────────────────────────

describe('the scope is the reading column, and the scoping is REQUIRED', () => {
  /** A `.peekover-diff` sibling built the way `renderHunk` builds one: the FULL parser. */
  function appendDiffSibling(shadow: ShadowRoot): Element {
    const diff = document.createElement('div');
    diff.className = 'peekover-diff';
    const block = document.createElement('div');
    block.className = 'diff-add';
    const tpl = document.createElement('template');
    tpl.innerHTML = sanitize(parse(gfmTable('hunk')));
    block.append(tpl.content);
    diff.append(block);
    shadow.append(diff);
    return diff;
  }

  it('enhances the column’s tables and NOT a sibling diff view’s', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    const diff = appendDiffSibling(shadow);
    // The premise: the diff really does contain a real, enhanceable table.
    expect(diff.querySelectorAll('table')).toHaveLength(1);
    expect(diff.querySelector('thead th')).not.toBeNull();
    expect(shadow.querySelectorAll('table')).toHaveLength(2);

    enhanceTables(host);

    // RED-FIRST (measured): with the walk written as `host.shadowRoot` rather than the column,
    // the diff line reads `expected <div class="peekover-table-tools"></div> to have a length
    // of +0 but got 1` — the diff's table grows sort chrome, which is exactly what D-8 exists
    // to stop. (It fires first, so the attribute line below never runs in that arm.)
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(1);
    expect(diff.querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(0);
    expect(diff.querySelector('table')?.getAttribute(TABLE_STATE_ATTR)).toBeNull();
  });

  it('enhances nothing at all when the column is absent but tables are not', () => {
    const { host, shadow } = mountedHost('# Doc\n');
    column(shadow).remove();
    const diff = appendDiffSibling(shadow);

    expect(() => enhanceTables(host)).not.toThrow();
    expect(diff.querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(0);
  });
});

// ── TOTAL (D-7) ───────────────────────────────────────────────────────────────────────────────

describe('the function is TOTAL — no input throws', () => {
  it('returns quietly for a host with no shadow root', () => {
    const bare = document.createElement(HOST_TAG);
    hosts.push(bare);
    expect(bare.shadowRoot).toBeNull();
    expect(() => enhanceTables(bare)).not.toThrow();
  });

  it('returns quietly for a shadow root with no reading column', () => {
    const { host, shadow } = mountedHost('# Doc\n');
    column(shadow).remove();
    expect(() => enhanceTables(host)).not.toThrow();
  });

  it('returns quietly for a document with no table at all — and adds no chrome', () => {
    const { host, shadow } = mountedHost('# Doc\n\nJust prose, a list:\n\n- one\n- two\n');
    const htmlBefore = column(shadow).innerHTML;

    expect(() => enhanceTables(host)).not.toThrow();

    expect(column(shadow).innerHTML).toBe(htmlBefore);
    expect(shadow.querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(0);
  });

  it('returns quietly for empty and malformed tables', () => {
    const { host, shadow } = mountedHost(
      '# Doc\n\n' +
        '<table></table>\n\n' +
        '<table><thead></thead></table>\n\n' +
        '<table><thead><tr><th>h</th></tr></thead></table>\n\n' +
        '<table><thead><tr><th>h</th><th>i</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>\n',
    );

    expect(() => enhanceTables(host)).not.toThrow();

    // Defined, not merely non-throwing: the two with a `<th>` are enhanced, the two without
    // are left exactly as rendered. A ragged body is not a reason to withhold the tools.
    const tables = [...column(shadow).querySelectorAll('table')];
    expect(tables).toHaveLength(4);
    expect(tables.map((t) => t.hasAttribute(TABLE_STATE_ATTR))).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it('D-7 OUTER BOUNDARY: a throw the per-table try cannot be inside does not escape', () => {
    const { host } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A failure that happens BEFORE any table is found, so nothing per-table can catch it.
    Object.defineProperty(host, 'shadowRoot', {
      configurable: true,
      get() {
        throw new Error('shadowRoot is poisoned');
      },
    });

    // RED-FIRST (measured): with the outer try/catch removed from `enhanceTables`, this reads
    // `expected [Function] to not throw an error but 'Error: shadowRoot is poisoned' was
    // thrown` — the signature D-7 names, and on the content script it is the throw that reaches
    // `mountReader`'s catch and removes a reader that had already rendered correctly.
    expect(() => enhanceTables(host)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('D-7 PER-TABLE: one table fails and EVERY OTHER table on the page is enhanced normally', () => {
    const { host, shadow } = mountedHost(
      `# Doc\n\n${gfmTable('one')}\n${gfmTable('two')}\n${gfmTable('three')}`,
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tables = [...column(shadow).querySelectorAll('table')];
    expect(tables).toHaveLength(3);
    // Poison the insertion of the MIDDLE table only.
    Object.defineProperty(tables[1], 'before', {
      configurable: true,
      value() {
        throw new Error('insertion is poisoned');
      },
    });

    expect(() => enhanceTables(host)).not.toThrow();

    // RED-FIRST (measured): with the per-table try removed — one outer try only, which is still
    // TOTAL and leaves the other 18 assertions in this file GREEN — the loop aborts at table 2
    // and this reads `expected [ true, false, false ] to deeply equal [ true, false, true ]`:
    // TWO tables un-enhanced instead of one, and table 3 is the one §4 promises is enhanced
    // normally. That the outer try alone passes every other test is why both halves are here.
    expect(tables.map((t) => t.hasAttribute(TABLE_STATE_ATTR))).toEqual([true, false, true]);
    expect(column(shadow).querySelectorAll(TOOLBAR_SELECTOR)).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('a failed table is left EXACTLY as rendered — no orphan toolbar, no state attribute', () => {
    const { host, shadow } = mountedHost(`# Doc\n\n${gfmTable('col')}`);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = column(shadow).querySelector('table');
    if (!table) throw new Error('no table');
    const htmlBefore = column(shadow).innerHTML;
    Object.defineProperty(table, 'before', {
      configurable: true,
      value(node: Node) {
        // Insert, then fail — the half-enhanced case the unwind exists for.
        table.parentElement?.insertBefore(node, table);
        throw new Error('failed after inserting');
      },
    });

    enhanceTables(host);

    expect(column(shadow).innerHTML).toBe(htmlBefore);
    expect(table.hasAttribute(TABLE_STATE_ATTR)).toBe(false);
  });
});
