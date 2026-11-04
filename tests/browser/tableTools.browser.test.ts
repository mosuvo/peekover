// tableTools — the REAL-ENGINE proof that the table toolbar is LIVE on the app page (008 task
// 3.4, D-6 sites 1-2), Chromium AND Firefox, `describe.each` over BOTH app-page call sites
// (§3.11 row 23) — and, from task 3.6, that its FIRST control really works there.
//
// ══ WHY THIS SUITE EXISTS, AND WHY `tableEnhancer.test.ts` COULD NOT BE IT ════════════════════
//
// 3.2 unit-tested the enhancer against a host the test built by hand and called the function
// itself. That suite passes, unchanged, against a build in which NOTHING IN PRODUCTION EVER CALLS
// `enhanceTables` — which is precisely what shipped at 3.2 and 3.3: the module existed, the CSS
// existed, and `.peekover-table-tools` matched no element in any rendered document. A test that
// calls the thing under test cannot tell a wired seam from an unwired one (the M5 "built, tested,
// wired to nothing" defect). ★ SO NOTHING BELOW CALLS `enhanceTables`. The toolbar arrives
// through the shell's own click chain and through the shell's own watch re-render, or it does not
// arrive.
//
// ══ THE ROWS THIS DISCHARGES (plan §3.11, routed to 3.4 by tasks.md) ══════════════════════════
//
//   row 1   the toolbar renders — asserted PER CALL SITE, because the toolbar does not come
//           through the one `mount()` seam the badge and the pills come through; D-6 gives it
//           four explicit sites and two of them are this task's
//   row 2   a table-free document grows NO chrome
//   row 3   red-first that the gate is the RIGHT property — the HEADER ROW
//   row 4   ★ INVERTS — INSIDE `.peekover-reader`, immediately before its `<table>`
//   row 23  `describe.each` over both app-page call sites
//
// ★ ROWS 5 AND 6 ARE NOT HERE, AND THEIR ABSENCE IS DELIBERATE. Nothing below reads a rect or a
// computed style. The toolbar's resolved `max-width` against `--reader-measure` (row 6) and its
// containment within the column at BOTH `GEOMETRY_WIDTHS` (row 5's inversion) are task 3.5's rect
// probe. Asserting them here at one incidental viewport would ratify a geometry nobody measured —
// finding 2's defect exactly, which is why 3.5 runs at 1280 AND 1400.
//
// ★ THE HOST WAS STILL EMPTY AFTER 3.6, AND THAT WAS NOT AN OVERSIGHT: D-12 divergence 1 puts the
// sort control inside its own `<th>`, so the sort never enters the strip. ★ 3.7's FILTER IS WHAT
// FILLS IT — three children, and 3.8's two copy buttons plus their status region make six (3.7
// forecast five, before the copy was given a status region of its own). The two emptiness assertions
// this file carried are updated where they stood, to the specific claim they always meant (no SORT
// control is in the strip) rather than to a count that would now be false. The filter's own
// behaviour is `tests/browser/tableFilter.browser.test.ts`'s, where row 24's set is discharged.
//
// ══ WHAT TASK 3.6 ADDED, AND WHY IT IS HERE RATHER THAN IN THE UNIT ═══════════════════════════
//
// `src/render/tableTools.test.ts` asserts the sort's ORDERING, its NODE IDENTITY and its ARIA in
// jsdom, exactly and cheaply. Four things it cannot assert at all live below, and each is the
// half D-12 diverged from the mockup to get:
//
//   • a `<th>` with a click handler is NOT FOCUSABLE and a `<button>` IS — jsdom will focus
//     anything you ask it to, so the mockup's shape only fails where focus is real;
//   • ENTER and SPACE activate a native button with no key handling of ours — jsdom has no
//     default activation behaviour, so the claim is untestable there;
//   • TAB really lands on the next control, which is what "no `tabindex` of its own" is FOR;
//   • the direction text is really PAINTED — a non-zero rect. §5's *"not carried by an icon
//     alone"* is a claim about what a sighted reader can SEE, and a `width:0` span would satisfy
//     every textContent assertion in the unit suite while showing nothing at all.
//
// ══ WHY SITE 2 IS DRIVEN THROUGH A REAL POLL AND NOT THROUGH A HANDED-OVER `render` ═══════════
//
// `renderWithEnhancements` is a module-level `const` in `appShell.ts` with no export. The only way
// to reach it is the way production does: open a file, start the watch, change what the file says
// on disk, and let `createWatchController` call it. Importing it, or handing a fake `render` to a
// controller this suite built, would leave the assertion about a function production might not
// provision — and `render: renderWithEnhancements` at `appShell.ts:938` is the one line that
// provisions it (`appShell.ts:939`). That line is what site 2's arm is really testing.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS, TABLE_STATE_ATTR } from '../../src/render/tableEnhancer';
import {
  FILTER_COUNT_CLASS,
  FILTER_FIELD_CLASS,
  SORT_BUTTON_CLASS,
  SORT_GLYPH_CLASS,
  SORT_STATE_CLASS,
  filterCountText,
} from '../../src/render/tableTools';
// ★ 4.1's content-script surface (D-6 sites 3-4). `runReader` is the entrypoint orchestration
// that reaches `mountReader`; `installContentWatch` is the whole watch wiring the entrypoint
// delegates. Neither `enhanceTables` nor a hand-built `WatchTarget` is imported here on purpose.
import { runReader } from '../../src/render/runReader';
import { installContentWatch } from '../../src/watch/contentWatch';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { backdropOf, inkOf, parseColor, ratioOver, TEXT_BAR } from './helpers/contrast';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

/** A GFM table — markdown-it's `table` rule emits `<thead><tr><th>`, the header gate's ordinary
 *  input. The heading gives every fixture a node the harness can wait on. */
const TABLE_DOC = ['# Report', '', '| col | n |', '| --- | --- |', '| a | 1 |', ''].join('\n');

/** A hand-written HTML table with NO `<thead>`. `parse.ts` runs `html: true` and `sanitize.ts:36`
 *  allows the table elements, so this really reaches the reading column from source (plan §0.2) —
 *  the gate's non-hypothetical input rather than a fixture invented to be declined. */
const HEADLESS_HTML = '<table><tbody><tr><td>a</td><td>1</td></tr></tbody></table>';

/** Both tables in ONE document, so the gate's two answers are read off a single render. */
const MIXED_DOC = `${TABLE_DOC}\n${HEADLESS_HTML}\n`;

const NO_TABLE_DOC = '# Report\n\nProse only, and a list:\n\n- one\n- two\n';

/**
 * ★ TASK 3.6's FIXTURE, AND ITS TWO PROPERTIES ARE BOTH DELIBERATE.
 *
 * Column 1 (`dept`) has TWO EQUAL KEYS, adjacent, distinguishable by column 2 in an order no
 * tie-break would reproduce (`zoe` before `adam`) — §4's stability is unfalsifiable without it.
 * Column 3 (`n`) is 10 / 9 / 2, whose text order and numeric order share no position, so a
 * lexicographic comparator cannot pass by luck.
 */
const SORT_DOC = [
  '# Report',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
  '',
].join('\n');

/** Two sortable tables in one document — §3.11 row 11's shape, on the live app page. */
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

/** The document site 2's arm starts from. Deliberately table-free and clearly marked: the
 *  assertions run only after the reader is showing the OTHER document, so a test that somehow
 *  read the first render would fail on this text rather than pass by luck. */
const SEED_DOC = '# Report\n\nthe seed render, before the agent wrote anything.\n';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── The app-page harness ──────────────────────────────────────────────────────────────────────

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

/** Mount the shell and open the folder — the real gesture chain, never a direct `selectFile`. */
async function openShell(files: MarkdownFile[]): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: sourceOf(files) }),
    store: fakeStore(),
  });
  await app.openFolder();
  return container;
}

async function clickFile(container: HTMLElement, name: string): Promise<HTMLElement> {
  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === name)!;
  btn.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

/**
 * ★ CALL SITE 1 — `readerPane.ts`'s `paint`, the app page's initial select. The document reaches
 * the screen once, through `mount` + the two enhancers, and is asserted on that first render.
 */
async function openViaInitialSelect(doc: string): Promise<HTMLElement> {
  const container = await openShell([{ path: 'report.md', name: 'report.md', read: async () => doc }]);
  return clickFile(container, 'report.md');
}

/**
 * ★ CALL SITE 2 — `appShell.ts`'s `renderWithEnhancements`, the app page's watch re-render. The
 * reader is opened on a DIFFERENT document, the watch is started with a real click, the file's
 * text is changed, and the assertions run only once the reader is showing the new text — so the
 * DOM under test was produced by site 2 and could not have survived from site 1.
 *
 * The destruction witness is the `<h1>` of the seed render, NOT its toolbar: the seed document is
 * table-free, and taking the witness from site 1's output would make this arm depend on site 1
 * being wired — which is the very thing the both-or-neither ablation needs to vary independently.
 */
async function openViaWatchRerender(doc: string): Promise<HTMLElement> {
  let text = SEED_DOC;
  let reads = 0;
  const container = await openShell([
    {
      path: 'report.md',
      name: 'report.md',
      read: async () => {
        reads += 1;
        return text;
      },
    },
  ]);
  const host = await clickFile(container, 'report.md');
  const seedHeading = host.shadowRoot!.querySelector('.peekover-reader h1')!;

  // This surface polls at the shipped `WATCH_INTERVAL_MS` (1000 ms) — `installWatchForFile`
  // passes no interval — and `pollingDetector`'s first read is a SILENT baseline (`lastText ===
  // null` means "nothing to compare against"). A write landing before that read is absorbed and
  // nothing ever re-renders, so the write waits on the read COUNT rather than on a sleep. `reads`
  // is already non-zero from the initial select; wait for one MORE than we have.
  const before = reads;
  // KEEPS (C289–C291): RE-SPELLED at 013 task 4.5 — on the app page, the toolbar's Watch (no reader pills); the
  // content script keeps its pill.
  (host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector<HTMLButtonElement>('.peekover-watch')!.click();
  expect(isWatching(), 'the watch must really be running or nothing re-renders').toBe(true);
  await waitFor(() => reads > before);
  text = doc;

  await waitFor(() => !seedHeading.isConnected);
  // The re-render really happened AND it really destroyed the previous column — without this a
  // "no toolbar" reading could be a re-render that never occurred rather than one that produced
  // no chrome, which is the vacuity that would make row 2's arm worthless.
  expect(seedHeading.isConnected).toBe(false);
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const columnOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
const tablesIn = (host: HTMLElement) => [...columnOf(host).querySelectorAll('table')];
const toolbarsIn = (host: HTMLElement) => [
  ...host.shadowRoot!.querySelectorAll<HTMLElement>(`.${TABLE_TOOLBAR_CLASS}`),
];

// ── Task 3.6's readers ────────────────────────────────────────────────────────────────────────

/**
 * The sort controls, found BY CLASS ALONE and never by `button.${SORT_BUTTON_CLASS}`.
 *
 * ★ THE SELECTOR MUST NOT ENCODE THE ANSWER. Row 16's whole claim is that the control IS a real
 * `<button>` — D-12 divergence 1, against the mockup's `<th onclick>`. A tag-qualified selector
 * makes that unfalsifiable: a non-button control returns NOTHING, every test below dies on an
 * undefined dereference, and the focus assertion written to catch exactly this never runs. Found
 * by class, the ablation's control is located and the keyboard clause is the clause seen to fail.
 * (3.5 paid for this lesson on its own non-vacuity guard; this is it one suite over.)
 */
const sortButtonsIn = (table: HTMLTableElement) => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];
const headerCellsOf = (table: HTMLTableElement) => [
  ...table.tHead!.rows[table.tHead!.rows.length - 1].cells,
];
const bodyRowsOf = (table: HTMLTableElement) => [...table.tBodies[0].rows];
const columnText = (table: HTMLTableElement, index: number) =>
  bodyRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());
const ariaSortOf = (table: HTMLTableElement) =>
  headerCellsOf(table).map((cell) => cell.getAttribute('aria-sort'));
/** The direction as a sighted reader gets it — the state span, with the aria-hidden glyph left
 *  out on purpose. That separation IS D-12 divergence 2. */
const visibleState = (button: HTMLButtonElement) =>
  (button.querySelector(`.${SORT_STATE_CLASS}`)?.textContent ?? '').trim();

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

// ══ HARNESS SANITY — THE CONTROL THAT STAYS GREEN WHEN THE CALL SITES ARE UNWIRED ═════════════
//
// Every other test in this file goes RED against a build with its call site removed — that is the
// point of them, and both sites were demonstrated that way one at a time. An all-red run is only
// evidence if something in the SAME run stays green, or "the site is unwired" and "the harness is
// broken" produce identical output. This is that control: it names neither the toolbar nor the
// enhancer, and it drives BOTH sites.

describe('harness sanity — both app-page call sites really render a document (non-vacuous guard)', () => {
  it('SITE 1 (initial select): the click chain puts a table on screen, with chrome beside it', async () => {
    const host = await openViaInitialSelect(TABLE_DOC);
    expect(tablesIn(host)).toHaveLength(1);
    // KEEPS: the document arrives with the app page's chrome beside it (C288, C289). RE-SPELLED at 013 task 4.5:
    // on the app page the chrome is the toolbar's (no reader pills) — its theme control stands for it.
    expect((host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('SITE 2 (watch re-render): the poll really replaces the document', async () => {
    const host = await openViaWatchRerender(TABLE_DOC);
    expect(columnOf(host).textContent).not.toMatch(/the seed render/);
    expect(tablesIn(host)).toHaveLength(1);
    // KEEPS: the document arrives with the app page's chrome beside it (C288, C289). RE-SPELLED at 013 task 4.5:
    // on the app page the chrome is the toolbar's (no reader pills) — its theme control stands for it.
    expect((host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });
});

// ══ ROWS 1, 2, 3, 4, 23 — THE TOOLBAR, ON BOTH APP-PAGE CALL SITES ════════════════════════════
//
// ★ BOTH SITES OR NEITHER (D-6). This `describe.each` is row 23 as it applies to a chrome that
// does NOT come through `mount()`: the audit's row 1 says the two-surface case is asserted PER
// CALL SITE, and on this surface the two sites are the initial select and the watch re-render.
// Wiring only the first ships a toolbar that DISAPPEARS the first time an agent rewrites the file
// on disk — 007 D-12's bug class, one surface over — and the site-2 column below is the only
// thing that can see it.

const SITES = [
  ['initial select (readerPane.ts, D-6 site 1)', openViaInitialSelect],
  ['watch re-render (appShell renderWithEnhancements, D-6 site 2)', openViaWatchRerender],
] as const;

describe.each(SITES)('the table toolbar is LIVE through the %s (row 23)', (_label, open) => {
  it('row 1 — a header table reaches the screen WITH a toolbar, through production only', async () => {
    const host = await open(TABLE_DOC);

    // The firing control: the document really rendered a table. Without it, "one toolbar" and
    // "no toolbar" would be indistinguishable from a mount that produced nothing at all.
    const tables = tablesIn(host);
    expect(tables, 'the fixture must actually render a table').toHaveLength(1);

    expect(toolbarsIn(host)).toHaveLength(1); // one per table, never one per render
    expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    // ★ THE HOST WAS EMPTY THROUGH 3.6 AND IS NOT ANY MORE. D-12 divergence 1 kept the sort in its
    // own `<th>`; 3.7's filter is the first control in the strip (a field, a clear button and the
    // count), and 3.8 adds the two copy buttons and their own status region — SIX. The host still
    // carries no `role` — see `tableEnhancer.ts` for why that is now a decision rather than a wait.
    expect(toolbarsIn(host)[0].children).toHaveLength(6);
    expect(toolbarsIn(host)[0].hasAttribute('role')).toBe(false);
  });

  it('★ row 4 INVERTS — INSIDE `.peekover-reader`, immediately BEFORE its table', async () => {
    // Four sibling suites assert the opposite direction for their chrome (`watchControl:205`,
    // `diffChrome:312`, `mount.ts:154-203`) and transcribing that row unexamined would produce a
    // WRONG test. The toolbar belongs to a block in document flow: it is a CHILD of the column
    // and the table's PRECEDING sibling.
    const host = await open(TABLE_DOC);
    const column = columnOf(host);
    const table = tablesIn(host)[0];
    const toolbar = toolbarsIn(host)[0];

    expect(column.contains(toolbar), 'INSIDE the column — this row inverts').toBe(true);
    expect(toolbar.parentElement).toBe(table.parentElement); // siblings; no wrapper element
    expect(table.previousElementSibling).toBe(toolbar); // IMMEDIATELY before
    // The `<table>` was not moved to achieve it. `design/mockup.html`'s `.tablewrap` does not
    // exist here, and a wrap-and-restore would pass every check above while changing this one.
    expect(table.parentElement).toBe(column);
  });

  it('★ row 3 — the gate is the HEADER ROW: a headerless table in the SAME document gets nothing', async () => {
    // The gate with its firing control inside the fixture. Ungated, BOTH tables carry a toolbar
    // and the count reads 2; unwired, it reads 0. Only "the gate is the header row" reads 1 —
    // which is what makes this an assertion about the property rather than about presence.
    const host = await open(MIXED_DOC);

    const tables = tablesIn(host);
    expect(tables, 'the fixture must render BOTH tables').toHaveLength(2);
    expect(tables[0].tHead, 'fixture: the first table is the header one').not.toBeNull();
    expect(tables[1].tHead, 'fixture: the second table is the headerless one').toBeNull();

    expect(toolbarsIn(host)).toHaveLength(1);
    expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
    // §4: left EXACTLY as rendered — no toolbar, no state attribute, nothing before it.
    expect(tables[1].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
    expect(tables[1].previousElementSibling?.classList.contains(TABLE_TOOLBAR_CLASS)).not.toBe(
      true,
    );
  });

  it('row 2 — a table-free document grows NO toolbar anywhere', async () => {
    const host = await open(NO_TABLE_DOC);

    expect(columnOf(host).querySelector('h1'), 'it really rendered').not.toBeNull();
    expect(tablesIn(host)).toHaveLength(0);
    expect(toolbarsIn(host)).toHaveLength(0);
    // Total absence, over the whole shadow root rather than the column: a toolbar appended beside
    // the reader instead of inside it would satisfy a column-scoped check and still be chrome
    // grown where the capability is absent.
    expect(host.shadowRoot!.querySelectorAll(`[${TABLE_STATE_ATTR}]`)).toHaveLength(0);
    // ★ THE LISTENER HALF OF ROW 2 IS INERT AT 3.4 AND IS NAMED, NOT ASSERTED VACUOUSLY. The
    // toolbar is empty and the enhancer binds nothing, so "no listener" is true of EVERY document
    // in this build and would discriminate nothing. It becomes a real assertion at 3.6-3.8, where
    // the controls that could bind one first exist.
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 3.6 — THE SORT, IN A REAL ENGINE
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// Everything below runs on call site 1 unless it says otherwise, and the reason is not economy:
// the sort's ORDERING and its ARIA are already asserted exactly in `src/render/tableTools.test.ts`
// and re-running them per site would assert the same function twice. What a second site can tell
// you that the first cannot is whether the handlers reach the CURRENT table after the column has
// been destroyed and rebuilt — §3.11 row 14's question — and that gets its own arm at the end.

describe('3.6 · the SORT lives in the <th>, never in the strip (D-12 divergence 1)', () => {
  it('every sort control is inside a <th>, and none of them is in the toolbar host', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];

    // The firing control: the controls really exist somewhere.
    expect(sortButtonsIn(table)).toHaveLength(3);
    // ★ THE STRIP IS NO LONGER EMPTY — 3.7's filter fills it — so the claim this case makes is now
    // the SPECIFIC one it always meant: whatever is in the strip, no SORT control is. Through 3.6
    // an emptiness check said this for free; after 3.7 it would have said something false.
    expect(toolbarsIn(host)[0].querySelectorAll(`.${SORT_BUTTON_CLASS}`)).toHaveLength(0);
    for (const button of sortButtonsIn(table)) {
      expect(button.parentElement?.tagName).toBe('TH');
    }
  });
});

describe('3.6 · row 16 — a REAL button, keyboard-operable, no tabindex of its own', () => {
  it('★ the <th> itself is NOT focusable and the button IS — the mockup`s shape, failing live', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const shadow = host.shadowRoot!;
    const table = tablesIn(host)[0];
    const th = headerCellsOf(table)[0];
    const button = sortButtonsIn(table)[0];

    // `design/mockup.html:565-580` hangs the sort on `<th onclick=…>`. A `<th>` takes no focus:
    // asking for it is a no-op, so a keyboard user can never reach that control. THIS is the
    // assertion jsdom cannot make — it will focus anything you ask it to.
    th.focus();
    expect(shadow.activeElement, 'a <th> must not be focusable — if it is, this test is vacuous')
      .not.toBe(th);

    button.focus();
    expect(shadow.activeElement).toBe(button);
    expect(button.tagName).toBe('BUTTON');
    expect(button.hasAttribute('tabindex'), 'row 16: no tabindex of its own').toBe(false);
  });

  it('★ TAB really lands on the next control — which is what "no tabindex" is FOR', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const shadow = host.shadowRoot!;
    const [first, second] = sortButtonsIn(tablesIn(host)[0]);

    first.focus();
    await userEvent.tab();

    // A real tab advance through the shadow tree, in the engine's own tab order. An element made
    // "focusable" with a tabindex hack can satisfy `.focus()` above and still sit outside it.
    expect(shadow.activeElement, 'tab did not reach the next sort control').toBe(second);
  });

  it('★ ENTER and SPACE activate it, with no key handling of ours', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const button = sortButtonsIn(table)[0];
    expect(columnText(table, 0)).toEqual(['eng', 'eng', 'ops']);
    expect(columnText(table, 1), 'the fixture starts unsorted').toEqual(['zoe', 'adam', 'bo']);

    button.focus();
    await userEvent.keyboard('{Enter}');

    // A native <button> activates on Enter and on Space by default. The mockup's `<th onclick>`
    // does neither — it is not even reachable to be pressed — and that is D-12 divergence 1.
    expect(ariaSortOf(table)[0]).toBe('ascending');

    await userEvent.keyboard(' ');
    expect(ariaSortOf(table)[0]).toBe('descending');
    expect(columnText(table, 0)).toEqual(['ops', 'eng', 'eng']);

    await userEvent.keyboard('{Enter}');
    expect(ariaSortOf(table)[0]).toBe('none');
    expect(columnText(table, 1), 'the third state is back to the document`s own order').toEqual([
      'zoe',
      'adam',
      'bo',
    ]);
  });
});

describe('3.6 · rows 15, 17, 18 — aria-sort PLUS text (D-12 divergence 2), and the text is PAINTED', () => {
  it('★ the direction is in aria-sort AND in text a sighted reader can actually SEE', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const button = sortButtonsIn(table)[0];
    const state = button.querySelector<HTMLElement>(`.${SORT_STATE_CLASS}`)!;

    expect(ariaSortOf(table)).toEqual(['none', 'none', 'none']);
    expect(visibleState(button)).toBe('');

    button.click();

    expect(ariaSortOf(table)).toEqual(['ascending', 'none', 'none']);
    expect(visibleState(button)).toBe('ascending');
    // ★ THE REAL-ENGINE HALF, AND THE ONLY PLACE §5's CLAIM IS ACTUALLY TESTED. "Not carried by
    // an icon alone" is a claim about what is on the screen: a `width:0` / `visibility:hidden` /
    // `font-size:0` span passes every textContent assertion in the unit suite and shows nothing.
    const rect = state.getBoundingClientRect();
    expect(rect.width, 'the direction text has no width — it is not on screen').toBeGreaterThan(0);
    expect(rect.height, 'the direction text has no height — it is not on screen').toBeGreaterThan(
      0,
    );
    const style = getComputedStyle(state);
    expect(style.visibility).toBe('visible');
    expect(style.display).not.toBe('none');
  });

  it('row 18 — the glyph is drawn AND hidden from assistive technology', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const button = sortButtonsIn(table)[0];
    const glyph = button.querySelector<HTMLElement>(`.${SORT_GLYPH_CLASS}`)!;

    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    button.click();
    // Non-vacuous: the glyph really is painted, so hiding it from AT is a decision about a real
    // thing rather than a description of an empty span. It restates what the text already says.
    expect(glyph.textContent).toBe('\u25B2');
    expect(glyph.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('row 17 — the accessible name carries selection AND action, and moves with the state', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const button = sortButtonsIn(tablesIn(host)[0])[0];

    expect(button.getAttribute('aria-label')).toBe('Sort by dept, ascending');
    button.click();
    expect(button.getAttribute('aria-label')).toBe(
      'Sorted by dept, ascending. Activate to sort descending.',
    );
    button.click();
    expect(button.getAttribute('aria-label')).toBe(
      'Sorted by dept, descending. Activate to restore the document order.',
    );
  });
});

describe('3.6 · the mechanism — the <tr> nodes are MOVED, never rebuilt', () => {
  it('★ the same row NODES survive a three-state cycle, and "off" restores document order', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const documentOrder = bodyRowsOf(table);
    const documentText = columnText(table, 1);
    const button = sortButtonsIn(table)[2]; // the numeric column

    button.click();
    // Numeric-aware in the engine that renders it: 2, 9, 10 and never 10, 2, 9.
    expect(columnText(table, 2)).toEqual(['2', '9', '10']);
    // ★ THE ORDER MOVED AND THE NODES DID NOT CHANGE. A rebuild-from-source reads identically on
    // the line above and holds NO element in common on the line below.
    expect(new Set(bodyRowsOf(table))).toEqual(new Set(documentOrder));

    button.click();
    expect(columnText(table, 2)).toEqual(['10', '9', '2']);
    button.click();
    expect(bodyRowsOf(table), 'off must restore the nodes IN their document order').toEqual(
      documentOrder,
    );
    expect(columnText(table, 1)).toEqual(documentText);
  });

  it('★ STABLE on equal keys — the two `eng` rows keep their document order, both directions', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const button = sortButtonsIn(table)[0];

    button.click();
    expect(columnText(table, 0)).toEqual(['eng', 'eng', 'ops']);
    // A comparator that tie-broke on a second column reads ['adam','zoe','bo'] here and passes
    // the key line above — which is why the fixture, not the assertion, is the instrument.
    expect(columnText(table, 1)).toEqual(['zoe', 'adam', 'bo']);

    button.click();
    expect(columnText(table, 0)).toEqual(['ops', 'eng', 'eng']);
    // A descending sort written as "ascending, then reverse" reads ['bo','adam','zoe'] here.
    expect(columnText(table, 1)).toEqual(['bo', 'zoe', 'adam']);
  });
});

describe('3.6 · row 11 — on a two-table document, table 2`s controls act on table 2', () => {
  it('sorting the second table moves it and leaves the first exactly where it was', async () => {
    const host = await openViaInitialSelect(TWO_TABLE_DOC);
    const [first, second] = tablesIn(host);
    expect(tablesIn(host), 'the fixture must render BOTH tables').toHaveLength(2);
    expect(columnText(first, 0)).toEqual(['b', 'a']);
    expect(columnText(second, 0)).toEqual(['d', 'c']);

    sortButtonsIn(second)[0].click();

    // RED-FIRST target: a handler that resolves its table with a document-time `querySelector`
    // reaches the FIRST table — the `diagramLightbox:354,429` multi-instance defect class, where
    // 007 found it. Both lines below move in that arm, in opposite directions.
    expect(columnText(second, 0), 'the clicked table is the one that must sort').toEqual(['c', 'd']);
    expect(columnText(first, 0), 'the OTHER table must not have moved').toEqual(['b', 'a']);
    expect(ariaSortOf(second)[0]).toBe('ascending');
    expect(ariaSortOf(first)[0]).toBe('none');
  });
});

describe('3.6 · §4 — no new global single-key shortcut', () => {
  it('typing at the document sorts nothing — the only way in is the control', async () => {
    const host = await openViaInitialSelect(SORT_DOC);
    const table = tablesIn(host)[0];
    const before = columnText(table, 1);

    // Focus something that is NOT a sort control, then press the keys a shortcut would claim.
    columnOf(host).querySelector<HTMLElement>('h1')!.click();
    for (const key of ['s', 'n', 'd', '1', '{ArrowDown}']) {
      await userEvent.keyboard(key);
    }

    expect(ariaSortOf(table)).toEqual(['none', 'none', 'none']);
    expect(columnText(table, 1)).toEqual(before);
    // The firing control: the control itself DOES work in this same run, so "nothing happened"
    // is a statement about the keys and not about a table that was never wired.
    sortButtonsIn(table)[0].click();
    expect(ariaSortOf(table)[0]).toBe('ascending');
  });
});

describe('3.6 · row 14`s question — the handlers reach the CURRENT table after a re-render', () => {
  it('SITE 2 (watch re-render): the sort works on the document the re-render produced', async () => {
    const host = await openViaWatchRerender(SORT_DOC);
    const table = tablesIn(host)[0];

    // This column was built by `renderWithEnhancements` after `replaceChildren` destroyed the
    // seed render — so a handler that had captured the previous table (or the previous rows)
    // would be pointing at nodes that are no longer in the tree.
    expect(columnOf(host).textContent).not.toMatch(/the seed render/);
    expect(sortButtonsIn(table)).toHaveLength(3);

    sortButtonsIn(table)[2].click();

    expect(columnText(table, 2)).toEqual(['2', '9', '10']);
    expect(ariaSortOf(table)[2]).toBe('ascending');
  });
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 4.1 — THE CONTENT-SCRIPT CALL SITES, D-6 SITES 3 AND 4
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ── WHY THESE ARMS EXIST, AND WHY THE APP-PAGE ONES ABOVE CANNOT STAND IN ────────────────────
//
// Everything above drives `mountAppShell`. That surface reaches `enhanceTables` through
// `readerPane`'s `paint` (site 1) and `appShell`'s `renderWithEnhancements` (site 2), and it would
// go on passing, unchanged, against a build in which the CONTENT SCRIPT enhanced nothing at all —
// which is exactly what shipped from 3.4 through 3.11. §3.11 row 23 asks for both SURFACES, and
// this is the second one: `runReader` → `mountReader` (site 3) and `installContentWatch`'s
// controller (site 4). ★ Nothing below calls `enhanceTables`, and nothing below hands a `render`
// to a controller it built itself — the same discipline the app-page arms hold to, because a
// suite that provisions the seam it is testing cannot tell a wired seam from an unwired one.
//
// ── D-6: BOTH SITES OR NEITHER, AND SITE 4 IS THE ONE THAT WOULD HAVE BEEN MISSED ────────────
//
// `contentWatch.ts` passed NO `render` through three milestones, so its controller fell through to
// `watchController`'s bare `mount` default. Ship site 3 alone and the toolbar appears on the first
// paint and DISAPPEARS the first time a watching agent rewrites the file on disk — 007 D-12's bug
// class, one surface over, and worse than shipping nothing, because the reader has already learned
// the tools are there. The re-render column below is the only arm that can see it, and it is the
// arm the revert-and-fail was run against.
//
// ── D-7'S TEARDOWN IS REACHABLE HERE AND NOWHERE ELSE ────────────────────────────────────────
//
// Site 3 sits INSIDE `mountReader`'s try, whose catch REMOVES the host and restores the browser's
// own raw rendering (`mountReader.ts:106-114`). No app-page site has that shape. So the
// consequence D-7 was written for — an enhancement failure tearing down a reader that had already
// rendered the document correctly — is observable only from this surface, and it is asserted in
// its own units: the host still connected and the raw `<pre>` still hidden.

/** A watchable `file://` document — `isWatchableFileUrl`'s own shape, so `installContentWatch`
 *  takes its watchable branch through the real capability decision rather than around it. */
const CS_FILE_URL = 'file:///D:/notes/report.md';

/** The page a browser builds for a raw `.md` resource: the bytes in a single `<pre>`. That is what
 *  `readPageSource` reads, and seeding it is the only fake in the content-script harness. */
function seedRawPage(doc: string): void {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
}

const rawPre = (): HTMLElement => document.body.querySelector('pre')!;
const contentHost = (): HTMLElement => document.querySelector<HTMLElement>('peekover-root')!;

/** Did this host COMMIT a render? `mountReader` returns false and REMOVES the host on a failure,
 *  so a connected host with a non-empty shadow root is the commit, read straight off the DOM. */
function committedReader(host: HTMLElement): boolean {
  return host.isConnected && (host.shadowRoot?.childNodes.length ?? 0) > 0;
}

/**
 * ★ CALL SITE 3 — `mountReader.ts`, the content script's INITIAL mount, driven through
 * `runReader`'s real document_start orchestration. `isRenderable` is overridden because the
 * runner's own page is not a markdown document; that seam exists for exactly this and is the one
 * the WXT entrypoint fills with `isRenderableContext`. Everything downstream of it — the source
 * read, the host append, `mount`, the enhancer, the hide of the originals — is production.
 */
async function openViaContentMount(doc: string): Promise<HTMLElement> {
  seedRawPage(doc);
  runReader({ isRenderable: () => true });
  const host = contentHost();
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader'));
  return host;
}

/**
 * ★ CALL SITE 4 — `contentWatch.ts`'s controller, the content script's WATCH RE-RENDER.
 *
 * The order is production's and it is load-bearing: `installContentWatch` runs at
 * `document_start`, BEFORE any host exists, and `runReader` mounts afterwards — registering after
 * the first mount would leave that render with no pill at all (005 4.7's second defect). The
 * messenger is the only fake and it answers the real `WATCH_READ` wire shape, so `relayRead`,
 * `pollingDetector` and the real `createWatchController` are all production code under test.
 *
 * The destruction witness is the SEED render's `<h1>`, not its toolbar: the seed document is
 * table-free, so this arm cannot be made to pass or fail by whether site 3 is wired — which is
 * what D-6's both-or-neither ablation needs, since it varies the two sites independently.
 */
async function openViaContentWatchRerender(doc: string): Promise<HTMLElement> {
  let text = SEED_DOC;
  let reads = 0;
  const send = async (message: WatchMessage): Promise<unknown> => {
    reads += 1;
    expect(message.type).toBe(WATCH_READ);
    return { ok: true, text };
  };

  installContentWatch({ url: CS_FILE_URL, send, backgroundCanReadFileUrls: true, intervalMs: 20 });
  seedRawPage(SEED_DOC);
  runReader({ isRenderable: () => true });
  const host = contentHost();
  const seedHeading = await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));

  // `pollingDetector`'s first read is a SILENT baseline (`lastText === null` means "nothing to
  // compare against"), so a write landing before it is absorbed and nothing ever re-renders. The
  // write therefore waits on the read COUNT rather than on a sleep.
  const before = reads;
  // KEEPS (C289–C291): RE-SPELLED at 013 task 4.5 — on the app page, the toolbar's Watch (no reader pills); the
  // content script keeps its pill.
  (host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector<HTMLButtonElement>('.peekover-watch')!.click();
  expect(isWatching(), 'the watch must really be running or nothing re-renders').toBe(true);
  await waitFor(() => reads > before);
  text = doc;

  await waitFor(() => !seedHeading.isConnected);
  // The re-render really happened AND really destroyed the previous column. Without this a
  // "no toolbar" reading could be a re-render that never occurred rather than one that produced no
  // chrome — the vacuity that would make the site-4 column worthless.
  expect(seedHeading.isConnected).toBe(false);
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

// ══ HARNESS SANITY — THE CONTROL THAT STAYS GREEN WHEN THE CS CALL SITES ARE UNWIRED ══════════
//
// The same control the app-page block has, for the same reason: with both content-script sites
// removed every other arm below goes red at once, and an all-red run is only evidence if something
// in the SAME run stays green. This names neither the toolbar nor the enhancer.

describe('4.1 · harness sanity — both content-script call sites really render (non-vacuous)', () => {
  it('SITE 3 (initial mount): runReader puts the reader up and hides the raw <pre>', async () => {
    const host = await openViaContentMount(TABLE_DOC);
    expect(tablesIn(host)).toHaveLength(1);
    expect(rawPre().style.display, 'the originals are hidden by the committed mount').toBe('none');
    // KEEPS: the document arrives with the app page's chrome beside it (C288, C289). RE-SPELLED at 013 task 4.5:
    // on the app page the chrome is the toolbar's (no reader pills) — its theme control stands for it.
    expect((host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('SITE 4 (watch re-render): the poll really replaces the document', async () => {
    const host = await openViaContentWatchRerender(TABLE_DOC);
    expect(columnOf(host).textContent).not.toMatch(/the seed render/);
    expect(tablesIn(host)).toHaveLength(1);
    // KEEPS: the document arrives with the app page's chrome beside it (C288, C289). RE-SPELLED at 013 task 4.5:
    // on the app page the chrome is the toolbar's (no reader pills) — its theme control stands for it.
    expect((host.closest('.peekover-app')?.querySelector('.peekover-toolbar') ?? host.shadowRoot!).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });
});

// ══ ROWS 1 + 23 — THE TOOLBAR, ON BOTH CONTENT-SCRIPT CALL SITES ═══════════════════════════════
//
// ★ BOTH SITES OR NEITHER (D-6). Together with the app-page `describe.each` above this completes
// row 23's "over both surfaces": row 1 says the two-surface case is asserted PER CALL SITE,
// because the toolbar does not come through the one `mount()` seam the badge and the pills do.

const CONTENT_SITES = [
  ['initial mount (mountReader.ts, D-6 site 3)', openViaContentMount],
  ['watch re-render (contentWatch renderWithTables, D-6 site 4)', openViaContentWatchRerender],
] as const;

describe.each(CONTENT_SITES)(
  '4.1 · the toolbar is LIVE on the CONTENT SCRIPT through the %s (rows 1, 23)',
  (_label, open) => {
    it('row 1 — a header table reaches the content-script reader WITH a toolbar', async () => {
      const host = await open(TABLE_DOC);

      // The firing control: the document really rendered a table. Without it "one toolbar" and "no
      // toolbar" are indistinguishable from a mount that produced nothing at all.
      const tables = tablesIn(host);
      expect(tables, 'the fixture must actually render a table').toHaveLength(1);

      expect(toolbarsIn(host)).toHaveLength(1); // one per table, never one per render
      expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
      // The same six children the app page gets — the filter's three, the copy's three. The
      // enhancer is one enhancer; this asserts the CALL SITE reached all of it.
      expect(toolbarsIn(host)[0].children).toHaveLength(6);
      expect(toolbarsIn(host)[0].hasAttribute('role')).toBe(false);
    });

    it('★ row 4 holds here too — INSIDE `.peekover-reader`, immediately BEFORE its table', async () => {
      const host = await open(TABLE_DOC);
      const column = columnOf(host);
      const table = tablesIn(host)[0];
      const toolbar = toolbarsIn(host)[0];

      expect(column.contains(toolbar), 'INSIDE the column — this row inverts').toBe(true);
      expect(toolbar.parentElement).toBe(table.parentElement); // siblings; no wrapper element
      expect(table.previousElementSibling).toBe(toolbar); // IMMEDIATELY before
      expect(table.parentElement).toBe(column);
    });

    it('★ row 3 — the gate is still the HEADER ROW on the content script', async () => {
      const host = await open(MIXED_DOC);

      const tables = tablesIn(host);
      expect(tables, 'the fixture must render BOTH tables').toHaveLength(2);
      expect(tables[0].tHead, 'fixture: the first table is the header one').not.toBeNull();
      expect(tables[1].tHead, 'fixture: the second table is the headerless one').toBeNull();

      expect(toolbarsIn(host)).toHaveLength(1);
      expect(tables[0].getAttribute(TABLE_STATE_ATTR)).toBe('enhanced');
      // §4: left EXACTLY as rendered — no toolbar, no state attribute, nothing before it.
      expect(tables[1].hasAttribute(TABLE_STATE_ATTR)).toBe(false);
      expect(tables[1].previousElementSibling?.classList.contains(TABLE_TOOLBAR_CLASS)).not.toBe(
        true,
      );
    });

    it('row 2 — a table-free content-script document grows NO toolbar anywhere', async () => {
      const host = await open(NO_TABLE_DOC);

      expect(columnOf(host).querySelector('h1'), 'it really rendered').not.toBeNull();
      expect(tablesIn(host)).toHaveLength(0);
      expect(toolbarsIn(host)).toHaveLength(0);
      // Total absence over the whole shadow root, not just the column: a toolbar appended beside
      // the reader would satisfy a column-scoped check and still be chrome grown where the
      // capability is absent.
      expect(host.shadowRoot!.querySelectorAll(`[${TABLE_STATE_ATTR}]`)).toHaveLength(0);
    });
  },
);

// ══ D-7 · THE TEARDOWN, REACHABLE AT NO OTHER CALL SITE ═══════════════════════════════════════

describe('4.1 · D-7 — site 3 enhances INSIDE the teardown catch, and the reader survives it', () => {
  it('the reader is NOT torn down: host connected, originals still hidden, and it had rendered', () => {
    // ★ THIS ARM DRIVES `runReader` ITSELF RATHER THAN `openViaContentMount`, AND THAT IS THE
    // WHOLE POINT. The harness resolves the host through a non-null assertion, so under the
    // revert-and-fail the host is GONE and the harness dies on `null.shadowRoot` — a TypeError
    // from the fixture, thrown BEFORE any assertion below could run. The check that finds the
    // defect has to be the check seen to fail, so nothing dereferences the host until after the
    // teardown has been read off the document.
    seedRawPage(TABLE_DOC);
    runReader({ isRenderable: () => true });
    const host = document.querySelector<HTMLElement>('peekover-root');

    // ★ THE TEARDOWN'S OWN SIGNATURE, IN ITS OWN UNITS, AND ASSERTED FIRST. `mountReader`'s catch
    // answers a throw by REMOVING the host and leaving the browser's raw rendering exactly as it
    // was, so a non-total `enhanceTables` shows up HERE — as a reader gone from a document it had
    // already rendered correctly, with the raw `<pre>` back — and not as a missing toolbar.
    expect(host, 'the host must still be in the document — D-7').not.toBeNull();
    expect(rawPre().style.display, 'the originals must still be hidden — D-7').toBe('none');
    expect(committedReader(host!), 'and it must still hold a committed render — D-7').toBe(true);

    // The reader had something to lose: this document really rendered a table and really got the
    // toolbar. Without this the assertions above would also pass on a page that never enhanced.
    expect(tablesIn(host!)).toHaveLength(1);
    expect(toolbarsIn(host!)).toHaveLength(1);
  });
});

// ══ THE CONTROLS THEMSELVES WORK ON THIS SURFACE ══════════════════════════════════════════════
//
// The hardening — 3.9's exclusions, 3.10's conditionality, 3.11's zero network — is a property of
// `enhanceTables`, which is byte-identical here (4.1 imports it; it does not change it), so it is
// INHERITED rather than re-argued. What is NOT inherited is that the controls actually operate
// once the enhancer is reached from a different call site, on a surface whose `:host` is the
// fixed, inset:0 page takeover rather than the app page's contained pane. Sort and filter are
// asserted here. ★ COPY DELIBERATELY IS NOT: its content-script question is clipboard
// availability on `file://`, which MDN itself hedges, and that is task 4.2's empirical residual —
// asserting it here on the runner's `http://` origin would ratify the wrong secure context.

describe('4.1 · the sort and the filter really operate on the content-script surface', () => {
  it('the sort reorders the content-script table', async () => {
    const host = await openViaContentMount(SORT_DOC);
    const table = tablesIn(host)[0];
    expect(sortButtonsIn(table), 'one real button per column').toHaveLength(3);

    sortButtonsIn(table)[2].click();

    expect(columnText(table, 2)).toEqual(['2', '9', '10']);
    expect(ariaSortOf(table)[2]).toBe('ascending');
  });

  it('the filter HIDES rows on the content-script table and says how many are shown', async () => {
    const host = await openViaContentMount(SORT_DOC);
    const table = tablesIn(host)[0];
    const toolbar = toolbarsIn(host)[0];
    const field = toolbar.querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
    const count = toolbar.querySelector<HTMLElement>(`.${FILTER_COUNT_CLASS}`)!;

    field.focus();
    await userEvent.keyboard('ops');

    const shown = bodyRowsOf(table).filter((row) => !row.hidden);
    expect(shown).toHaveLength(1);
    expect(shown[0].cells[1].textContent).toBe('bo');
    // HIDE, never remove (F6) — the node count is unchanged on this surface too.
    expect(bodyRowsOf(table)).toHaveLength(3);
    expect(count.textContent).toBe(filterCountText(1, 3));
  });
});

describe('4.1 · site 4 — the controls reach the CURRENT table after a content-script re-render', () => {
  it('the sort works on the document `renderWithTables` produced', async () => {
    const host = await openViaContentWatchRerender(SORT_DOC);
    const table = tablesIn(host)[0];

    // This column was built by site 4's closure after `replaceChildren` destroyed the seed render,
    // so a handler that had captured the previous table would be pointing at detached nodes.
    expect(columnOf(host).textContent).not.toMatch(/the seed render/);
    expect(sortButtonsIn(table)).toHaveLength(3);

    sortButtonsIn(table)[2].click();

    expect(columnText(table, 2)).toEqual(['2', '9', '10']);
    expect(ariaSortOf(table)[2]).toBe('ascending');
  });
});

// ══ 013 TASK 5.3 — THE TABLE'S CONTROLS FROM TOKENS (gate-1 Q14; carried (f)) ═════════════════
//
// The filter field, its Clear, the sort buttons and Copy CSV / Copy Markdown used to be the
// browser's own controls (2 px outset, light grey, the system face — in dark too). Now: Clear and
// the two copies are the mock's copy button (`mockup.html:154–156`); the field is a `--paper` box
// with a 1 px `--line` border, radius 7, `--ink` text in the UI face; the sort button is the mock's
// header (`:145–147`) — it takes the `<th>`'s own type and colour, `--ink` under the pointer and
// while it is the sorted column, its glyph `--accent`. Both surfaces that build the toolbar (the
// app page and the content-script reader), both themes; every text >= 4.5:1 in every state.
// Behaviour is the file's other tests', unchanged.

type TableState = 'rest' | 'hover' | 'focus';

function tokenOf(near: Element, token: string, property: 'color' | 'font-family' = 'color'): string {
  const probe = document.createElement('span');
  probe.style.setProperty(property, `var(${token})`);
  near.parentElement!.appendChild(probe);
  const cs = getComputedStyle(probe);
  const value = property === 'color' ? cs.color : cs.fontFamily;
  probe.remove();
  return value;
}

function lookOf(el: HTMLElement): Record<string, string> {
  const cs = getComputedStyle(el);
  const borders = new Set(
    (['top', 'right', 'bottom', 'left'] as const).map(
      (s) => `${cs.getPropertyValue(`border-${s}-style`)} ${cs.getPropertyValue(`border-${s}-width`)} ${cs.getPropertyValue(`border-${s}-color`)}`,
    ),
  );
  return {
    background: cs.backgroundColor,
    border: [...borders].join(' | '),
    radius: cs.borderTopLeftRadius,
    font: `${cs.fontSize} ${cs.fontWeight}`,
    padding: `${cs.paddingTop} ${cs.paddingRight}`,
    face: cs.fontFamily,
    colour: cs.color,
  };
}

/** The mock's copy button (codeToolbar.browser.test.ts's spec, this file's own copy). */
function copyButtonLook(el: HTMLElement, state: TableState): Record<string, string> {
  const t = (name: string) => tokenOf(el, name);
  return {
    background: t('--paper'),
    border: `solid 1px ${t('--line')}`,
    radius: '7px',
    font: '11.5px 600',
    padding: '5px 11px',
    face: tokenOf(el, '--sans', 'font-family'),
    colour: state === 'hover' ? t('--ink') : t('--muted'),
  };
}

/** The filter field: a `--paper` box, `--line` border (`--faint` under the pointer), `--ink` text. */
function fieldLook(el: HTMLElement, state: TableState): Record<string, string> {
  const t = (name: string) => tokenOf(el, name);
  return {
    background: t('--paper'),
    border: `solid 1px ${state === 'hover' ? t('--faint') : t('--line')}`,
    radius: '7px',
    font: '12px 400',
    padding: '5px 9px',
    face: tokenOf(el, '--sans', 'font-family'),
    colour: t('--ink'),
  };
}

const textRatio = (el: HTMLElement): number => ratioOver(inkOf(el), backdropOf(el)).ratio;
const borderRatio = (el: HTMLElement): number =>
  ratioOver(parseColor(getComputedStyle(el).borderTopColor), backdropOf(el, { skipSelf: true })).ratio;

async function expectLook(label: string, el: HTMLElement, state: TableState, want: Record<string, string>): Promise<void> {
  await sleep(220);
  expect(lookOf(el), `${label} — ${state}`).toEqual(want);
  const ratio = textRatio(el);
  console.log(`CONTRAST-5.3 ${label} · ${state} · text ${ratio.toFixed(2)} · border ${borderRatio(el).toFixed(2)}`);
  expect(ratio, `${label} — ${state}: text >= 4.5:1 (${ratio.toFixed(2)})`).toBeGreaterThanOrEqual(TEXT_BAR);
}

function expectRing(label: string, el: HTMLElement): void {
  const cs = getComputedStyle(el);
  expect(`${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, `${label}: the focus ring`).toBe(
    `solid 2px ${tokenOf(el, '--accent')}`,
  );
}

async function tabOnto(shadow: ShadowRoot, el: HTMLElement, label: string): Promise<void> {
  el.focus();
  await userEvent.tab({ shift: true });
  await userEvent.tab();
  expect(shadow.activeElement, `${label}: Tab reaches it`).toBe(el);
}

const TABLE_SURFACES = [
  ['app page', openViaInitialSelect],
  ['content-script reader', openViaContentMount],
] as const;

describe('013 5.3 · the table’s controls are drawn from tokens, every state, both themes', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
  });
  afterEach(async () => {
    setThemeSetting('auto');
    resetThemeWatchForTest();
    await page.viewport(414, 896);
  });

  for (const [surface, open] of TABLE_SURFACES) {
    for (const theme of ['light', 'dark'] as const) {
      it(`${surface} — ${theme}`, async () => {
        setThemeSetting(theme);
        const host = await open(SORT_DOC);
        setThemeSetting(theme); // again: the app shell's settings load (this file's store has none) resets it
        await waitFor(() => host.getAttribute('data-theme') === theme);
        const shadow = host.shadowRoot!;
        const table = tablesIn(host)[0];
        const toolbar = toolbarsIn(host)[0];
        table.scrollIntoView({ block: 'center' });
        const away = columnOf(host).querySelector<HTMLElement>('h1')!;
        const where = `${surface} · ${theme}`;

        // The buttons in the strip: Clear, Copy CSV, Copy Markdown — the copy button. By class alone.
        for (const button of toolbar.querySelectorAll<HTMLElement>('.peekover-table-filter__clear, .peekover-table-copy')) {
          const label = `${where} · ${button.textContent}`;
          await userEvent.hover(away);
          await expectLook(label, button, 'rest', copyButtonLook(button, 'rest'));
          await userEvent.hover(button);
          await expectLook(label, button, 'hover', copyButtonLook(button, 'hover'));
          await userEvent.hover(away);
          await tabOnto(shadow, button, label);
          expectRing(label, button);
          await expectLook(label, button, 'focus', copyButtonLook(button, 'focus'));
          button.blur();
        }

        // The filter field, at rest, under the pointer, focused and typed into; its "Filter" label.
        const field = toolbar.querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
        const fieldLabel = `${where} · the filter field`;
        await expectLook(fieldLabel, field, 'rest', fieldLook(field, 'rest'));
        await userEvent.hover(field);
        await expectLook(fieldLabel, field, 'hover', fieldLook(field, 'hover'));
        await userEvent.hover(away);
        await tabOnto(shadow, field, fieldLabel);
        expectRing(fieldLabel, field);
        await userEvent.keyboard('e');
        await expectLook(fieldLabel, field, 'focus', fieldLook(field, 'focus'));
        await userEvent.keyboard('{Backspace}');
        field.blur();
        const labelText = field.closest('label')!.querySelector<HTMLElement>('span')!;
        const labelRatio = textRatio(labelText);
        console.log(`CONTRAST-5.3 ${where} · the "Filter" label · rest · text ${labelRatio.toFixed(2)}`);
        expect(labelRatio, `${where}: the "Filter" label >= 4.5:1`).toBeGreaterThanOrEqual(TEXT_BAR);

        // The sort buttons: the <th>'s own type and colour; --ink under the pointer and while sorted.
        const th = headerCellsOf(table)[2];
        const sort = sortButtonsIn(table)[2];
        const sortLabel = `${where} · sort "${th.textContent?.trim()}"`;
        const sortLook = (state: 'rest' | 'ink'): Record<string, string> => {
          const thStyle = getComputedStyle(th);
          return {
            background: 'rgba(0, 0, 0, 0)',
            border: `none 0px ${state === 'rest' ? tokenOf(sort, '--muted') : tokenOf(sort, '--ink')}`,
            radius: '4px',
            font: `${thStyle.fontSize} ${thStyle.fontWeight}`,
            padding: '0px 0px',
            face: thStyle.fontFamily,
            colour: state === 'rest' ? tokenOf(sort, '--muted') : tokenOf(sort, '--ink'),
          };
        };
        await userEvent.hover(away);
        await expectLook(sortLabel, sort, 'rest', sortLook('rest'));
        expect(getComputedStyle(sort).textTransform, `${sortLabel}: the header's caps`).toBe('uppercase');
        await userEvent.hover(sort);
        await expectLook(sortLabel, sort, 'hover', sortLook('ink'));
        await userEvent.hover(away);
        await tabOnto(shadow, sort, sortLabel);
        expectRing(sortLabel, sort);
        await expectLook(sortLabel, sort, 'focus', sortLook('rest'));
        await userEvent.keyboard('{Enter}');
        expect(th.getAttribute('aria-sort')).toBe('ascending');
        sort.blur();
        await expectLook(`${sortLabel} · sorted`, sort, 'rest', sortLook('ink'));
        const glyph = sort.querySelector<HTMLElement>(`.${SORT_GLYPH_CLASS}`)!;
        expect(getComputedStyle(glyph).color, `${sortLabel}: the glyph is --accent`).toBe(tokenOf(sort, '--accent'));
        const state = sort.querySelector<HTMLElement>(`.${SORT_STATE_CLASS}`)!;
        expect(state.textContent, 'the painted direction is kept (D-12 divergence 2)').toBe(' ascending');
      });
    }
  }
});
