// tableTools — the REAL-ENGINE proof that the table toolbar is LIVE on the app page (008 task
// 3.4, D-6 sites 1-2), Chromium AND Firefox, `describe.each` over BOTH app-page call sites
// (§3.11 row 23).
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
// ★ AND THE HOST IS STILL EMPTY. There is no sort control, no filter, no copy button and no
// `role` to assert: the toolbar is a styled strip with nothing in it until 3.6-3.8. Every
// assertion below is about a container reaching the screen in the right place.
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
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS, TABLE_STATE_ATTR } from '../../src/render/tableEnhancer';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest, isWatching } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

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
  host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-watch')!.click();
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
    expect(host.shadowRoot!.querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('SITE 2 (watch re-render): the poll really replaces the document', async () => {
    const host = await openViaWatchRerender(TABLE_DOC);
    expect(columnOf(host).textContent).not.toMatch(/the seed render/);
    expect(tablesIn(host)).toHaveLength(1);
    expect(host.shadowRoot!.querySelector('.peekover-theme-toggle')).not.toBeNull();
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
    // The host is EMPTY at 3.4 and that is the shipped state, not an oversight: sort (3.6),
    // filter (3.7) and copy (3.8) are what fill it, and a `role="toolbar"` over no widget would
    // describe a group that does not exist.
    expect(toolbarsIn(host)[0].children).toHaveLength(0);
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
