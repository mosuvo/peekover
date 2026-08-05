// tableEnhancer — the orchestration behind F5's table tools (008 plan §1.3, D-7 · D-8 · D-12).
// Given a reader host that mount() has already committed, it finds the tables the tools can
// operate, and puts an empty toolbar host in front of each one. Sort, filter and copy fill that
// host at 3.6-3.8; NOTHING calls this function yet — the four call sites are D-6's and land at
// 3.4 (app page) and 4.1 (content script).
//
// It imports ONE module, `tableTools.ts`, and that one is on the same graphs for the same reason
// and imports nothing itself (plan §2, plan §1.3's split): this file owns the WALK — which tables
// qualify, the toolbar host, D-7's totality — and `tableTools` owns what a qualifying table then
// GETS. Anything beyond that pair would be an import the content script pays for.
//
// ── D-7 · THE FUNCTION IS TOTAL, AND ON ONE SURFACE THAT IS LOAD-BEARING ──────────────────────
//
// `enhanceDiagrams` (`diagramEnhancer.ts:678`) has no top-level try and does not need one: neither
// of its call sites sits in a teardown path. This one's does. `mountReader`'s catch
// (`mountReader.ts:106-114`) responds to a throw by REMOVING the host — exactly right for a mount
// that produced nothing, and exactly wrong for a toolbar that failed on a document the reader had
// ALREADY rendered correctly. A throw out of here would tear down a working reader to save a
// sort button. So the guarantee is taken into the function instead of asked of every caller:
//
//   • a PER-TABLE try, so §4's *"every other table on the page is enhanced normally"* holds — one
//     bad table costs one table, not the rest of the loop; and
//   • a TOTAL OUTER BOUNDARY, so a failure that no per-table try can be inside (the host, the
//     shadow root, the column query) still cannot reach `mountReader`'s catch.
//
// The two are separately load-bearing and separately tested. Collapsing them into one outer try
// would still make the function total — and would silently abandon every table after the first
// failure, which is the defect the per-table half exists to have.
//
// On failure a table is left EXACTLY as rendered: the toolbar is un-inserted and the state
// attribute removed, so the catch leaves no half-enhanced table behind and a later render starts
// from the same place a never-enhanced table does.
//
// ── D-8 · THE SCOPE IS `.peekover-reader`, AND THE SCOPING IS REQUIRED, NOT DEFENSIVE ─────────
//
// `shadow.querySelectorAll('table')` would be wrong, not merely broad. `renderHunk`
// (`diffView.ts:119-128`) runs `sanitize(parse(hunk.lines))` — the FULL parser — so a diff of two
// table-bearing specs, which is the product's own example, contains REAL `<table>`s inside
// `.peekover-diff`. Both alternate views are SIBLINGS of the reading column rather than
// descendants (`diffView.ts:148-159`; `readerMode.ts:66-74`), so querying the column excludes
// both BY CONSTRUCTION — there is no entry-condition branch here to get wrong, and adding one
// would be the thing that could rot.
//
// ── THE TOOLBAR IS A PRECEDING SIBLING — BECAUSE THE MOCKUP'S WRAPPER DOES NOT EXIST ──────────
//
// `design/mockup.html` hangs its table chrome on a `.tablewrap`. We have no such element:
// markdown-it emits a BARE `<table>`, and `readerCss.ts:169-179` puts the border, radius and
// `overflow:hidden` on the table itself. D-12's call is therefore to insert the toolbar as a
// PRECEDING SIBLING — no wrapper element, no move of the table. Fewer mutations than wrapping,
// and the `<table>`'s node identity and position in the column are untouched, which is what keeps
// the committed column shape close to what the golden fixtures describe.
//
// A wrap-and-restore would pass a shape assertion and fail an identity one; `tableEnhancer.test.ts`
// asserts identity for that reason.
//
// ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────────────────────────
//
// The toolbar host was STILL EMPTY after 3.6, and that was not an oversight — it is where D-12 put
// the sort. Divergence 1 places the control INSIDE its own `<th>`, so the sort never enters the
// strip. TASK 3.7's FILTER is the first control that does fill it (a field, a clear button and the
// count); the two copy buttons are 3.8's.
//
// ★ THE HOST STILL CARRIES NO `role`, AND THAT IS NOW A DECISION RATHER THAN A WAIT. `role="toolbar"`
// is a composite widget: it promises arrow-key navigation and a single roving tab stop. Declaring
// it without implementing it tells a screen-reader user to press arrows that do nothing, which is
// worse than three native controls each reachable by Tab — the shape §4 actually asks for. See
// `tableTools.ts`'s filter section, where the reasoning is recorded beside the control it governs.

import { installTableFilter, installTableSort } from './tableTools';

/**
 * The state attribute the enhanced `<table>` carries. Mirrors `DIAGRAM_STATE_ATTR`
 * (`diagramView.ts:30`, consumed `diagramEnhancer.ts:684`) and, one level up, `data-mode` /
 * `data-diff`: the element whose state is in question is the element that carries it.
 *
 * It is what makes a second pass over the same DOM a no-op. In production every mount arrives
 * through `replaceChildren` (`mount.ts:210`) and the tables are always fresh, so — exactly as the
 * diagram guard's own comment says of itself — this is a property, not a path the app relies on.
 */
export const TABLE_STATE_ATTR = 'data-table-tools';

/** Class on the toolbar host. `readerCss.ts` keys off it at 3.3; the controls at 3.6-3.8. */
export const TABLE_TOOLBAR_CLASS = 'peekover-table-tools';

/**
 * The entry condition (§4: *"When a table has no header row, the system shall leave it exactly as
 * rendered and shall offer no sort affordance for it"*).
 *
 * It is a REAL condition, not a formality. `sanitize.ts:36` allows `table/thead/tbody/tr/th/td`,
 * so a hand-written HTML `<table>` with no `<thead>` reaches the reading column from source
 * (plan §0.2) — markdown-it's own GFM tables are not the only tables here.
 *
 * ★ IT IS ASKED THROUGH THE TABLE DOM API, NOT A SELECTOR, AND THAT IS A MEASURED CHOICE.
 * `thead th` is wrong on its face — a table nested inside another table's header would answer the
 * question for its parent. The `:scope`-anchored fix for that (`:scope > thead > tr > th`) reads
 * correct and IS correct in a browser, but **returns `null` inside a shadow root under jsdom**
 * (nwsapi): measured at 3.2, where the identical selector resolved against the same markup in a
 * light-DOM `<div>` and found nothing once the column was in the shadow tree. A gate that closes
 * in the unit environment and opens in the real one is worse than either. `tHead` / `rows` /
 * `cells` are the table's OWN structure by construction — nothing nested can be reached through
 * them, no selector engine is involved, and both environments agree.
 */
function hasHeaderRow(table: HTMLTableElement): boolean {
  const head = table.tHead;
  if (!head) return false;
  for (const row of head.rows) {
    for (const cell of row.cells) {
      if (cell.tagName === 'TH') return true;
    }
  }
  return false;
}

/**
 * The toolbar host, built as DOM and never as an HTML string (§5, AGENTS.md #3 — nothing in this
 * module may acquire an `innerHTML` assignment).
 */
function buildTableToolbar(doc: Document): HTMLElement {
  const toolbar = doc.createElement('div');
  toolbar.className = TABLE_TOOLBAR_CLASS;
  return toolbar;
}

/**
 * Attach the tools to one table. Ordered so that a throw at any step leaves the table exactly as
 * rendered: the host is built detached, inserted, the controls installed, and only THEN is the
 * table marked enhanced — so a failure at any point marks nothing, and every mutation that did
 * land is unwound in the reverse order it was made.
 *
 * ★ "Exactly as rendered" is asserted on `innerHTML` (`tableEnhancer.test.ts`), which is why the
 * sort's undo is called here rather than left to a garbage collector: a `<button>` left inside a
 * `<th>` of a table whose enhancement failed is a visible defect, not an untidiness.
 */
function attachToolbar(table: HTMLTableElement): void {
  let toolbar: HTMLElement | undefined;
  let undoSort: (() => void) | undefined;
  let undoFilter: (() => void) | undefined;
  try {
    toolbar = buildTableToolbar(table.ownerDocument);
    table.before(toolbar);
    undoSort = installTableSort(table);
    // AFTER the sort, so `installTableSort` captures a `<tbody>` the filter has not yet added a
    // sibling body to, and reads header cells that hold exactly their own text.
    undoFilter = installTableFilter(table, toolbar);
    table.setAttribute(TABLE_STATE_ATTR, 'enhanced');
  } catch (err) {
    // Leave the table exactly as rendered — readable, styled, and indistinguishable from one the
    // walk never reached. All four cleanups are no-ops in the ordinary case, and they unwind in
    // the reverse order the mutations landed.
    undoFilter?.();
    undoSort?.();
    toolbar?.remove();
    table.removeAttribute(TABLE_STATE_ATTR);
    throw err;
  }
}

/**
 * Put an empty toolbar host in front of every enhanceable `<table>` in `host`'s reading column.
 *
 * TOTAL (D-7): it never throws, for any input — no shadow root, no reading column, a malformed or
 * headerless table, a DOM that throws out of its own accessors. Every one of those is a defined
 * no-op rather than an escape into `mountReader`'s teardown catch.
 *
 * SCOPED (D-8): the walk is `.peekover-reader`'s, so the diff view's real tables and the raw
 * view's text are excluded by construction.
 *
 * IDEMPOTENT: re-running over the same DOM adds nothing — `TABLE_STATE_ATTR` is the guard.
 *
 * HEADER-GATED (§4): a table with no `<thead>` containing a `<th>` is left untouched.
 */
export function enhanceTables(host: HTMLElement): void {
  try {
    // D-8: the scope IS the exclusion. Never `shadow.querySelectorAll('table')`.
    const column = host.shadowRoot?.querySelector('.peekover-reader');
    if (!column) return;

    for (const table of column.querySelectorAll<HTMLTableElement>('table')) {
      if (table.hasAttribute(TABLE_STATE_ATTR)) continue;
      if (!hasHeaderRow(table)) continue;
      try {
        attachToolbar(table);
      } catch (err) {
        // D-7's per-table half: this table loses its tools; every other table on the page is
        // enhanced normally. Dev-only signal, like `mountReader.ts:108`.
        console.warn('[peekover] table enhancement failed; leaving the table as rendered', err);
      }
    }
  } catch (err) {
    // D-7's outer boundary: a failure no per-table try can be inside. On the content script the
    // caller is `mountReader`'s try, whose catch REMOVES the host — so escaping here would tear
    // down a reader that had already rendered the document correctly.
    console.warn('[peekover] table enhancement aborted; leaving the reader as rendered', err);
  }
}
