// THE TABLE TOOLS' ZERO-NETWORK GUARD — real-engine bytes on the wire (008 task 3.11, §3.11
// row 22), Chromium AND Firefox. The three controls are SORT, FILTER and COPY.
//
// ══ THE CLAIM, AND WHY IT IS WORTH EXACTLY WHAT ITS CONTROL IS WORTH ══════════════════════════
//
// §4 Trust: *"The system shall make no network request for any part of file comparison, agent-file
// recognition, or any table action — proven at the request level on both engines, non-vacuously."*
// This file discharges the TABLE-ACTION third of that clause. (Agent-file recognition is 1.6's,
// already banked; file comparison is group 2's and 6.1's walk. This task's Verify clause is the
// three controls, and it does not reach past them.)
//
// By construction there is nothing here to leak: a sort `appendChild`s existing `<tr>` nodes
// (`tableTools.ts:315-317`), a filter sets `hidden` on them (`:599`), and a copy reads
// `textContent` and hands a string to `navigator.clipboard.writeText` (`:922-934`). No URL, no
// element with a `src`, no `@import`, no `fetch`. That is precisely the shape of claim that ships
// wrong: AGENTS.md #1 is a non-negotiable, and a guard that watches for requests and sees none
// proves NOTHING unless something in the SAME run WOULD have tripped it.
//
// ★ SO THE ABSENCE IS VACUOUS WITHOUT THE FIRING CONTROL, AND THAT IS SAID HERE RATHER THAN
// ASSUMED. "No request" has two readings — the controls are quiet, or the probe is blind — and
// only a control that FIRES tells them apart (retro finding 1; 3.10's confounded-control lesson
// one task earlier). Every case below ARMS the probe in its own body, and re-arms it after the
// measurement, so a probe that went blind midway cannot report a clean zero.
//
// ══ REAL ENGINE OR NOTHING ════════════════════════════════════════════════════════════════════
//
// jsdom has no network layer and loads no subresources, so a jsdom reading is a DOM-SHAPE PROXY
// that would report NO-FETCH over a WIDE-OPEN route — the exact false green that stayed lit
// through the entire M1 remote-image leak (progress.md 2026-07-14). This suite asserts on the
// engine's OWN Resource Timing buffer, where an entry appears only when Chromium/Firefox actually
// put a request on the wire.
//
// ★ THE INSTRUMENT IS REUSED VERBATIM, NOT REINVENTED. The `/^https?:/i` predicate is
// `remoteMedia.browser.test.ts`'s (`:83-92`), and `awaitProbeUrls` is its `awaitFetchedUrls`
// (`:120`) in shape and reason: you can WAIT for a request that should arrive, and you cannot wait
// for one that should never come, so the zero stays `flush()`-then-assert-empty (`:140`). 1.6
// established both for the badge; nothing about the table's path calls for a different one, and a
// new instrument would be an unproven one.
//
// ══ ★ TWO CONTROL LANES, AND WHY THE SECOND MUST EXIST ════════════════════════════════════════
//
// A `fetch()` control proves the buffer records the FETCH lane. It says nothing about the lane
// these three controls could plausibly leak through, which is a SUBRESOURCE dispatched by a node
// the DOM path committed — a `<tr>` moved, an empty-state `<tbody>` inserted, a toolbar child
// appended. So the second control is markup.
//
// ★ AND THE CONTROL MUST NOT BE PRE-EMPTED BY A LAYER IN FRONT OF IT — THE CONFOUND CLASS 3.10
// CAUGHT, IN ITS NETWORK FORM. A control routed through `sanitize()` measures DOMPurify's own
// internal `DOMParser` pass and not the adopted artifact: in Firefox that parse CONSUMES an
// eagerly-loaded URL, and a later adoption of the same URL is never retried, so the control reads
// NO-FETCH WHILE THE ROUTE IS WIDE OPEN (decisions.md 2026-07-29). A control that reads NO-FETCH
// for the wrong reason makes every zero beside it vacuous — 3.10's confounded arm-3, one lane
// over. So the markup below is HAND-WRITTEN, parsed ONCE, adopted ONCE, and touches no sanitizer
// and no `parse()`.
//
// ★ THE PARSE-TIME CONFOUND IS AVOIDED BY THE ELEMENT CHOICE, NOT BY LUCK. Only `@import` is
// loaded eagerly enough for an inert parse to consume it. An `<img src>` is not fetched by an
// inert parse at all, which is exactly why the two halves below can share ONE URL and mean two
// different things: the template parse fires nothing, and the adoption of the SAME BYTES fires.
//
// ══ ★ THE INERT `<template>`, WHICH IS BOTH THE NEUTRALIZATION AND HALF THE CONTROL ═══════════
//
// Probe markup is parsed into a `<template>`'s `.content` — an inert document with NO browsing
// context — never a "detached" div. `document.createElement('div').innerHTML = html` IS owned by
// this document and DOES dispatch the fetch, which is the leak that shipped (`mount.ts:120-127`
// records it in as many words). And 1.6 MEASURED the finer point: the fetch fires at
// `document.importNode`, not at `appendChild` — an imported fragment is detached but
// `document`-OWNED, and that is what dispatches. So "detached" is not the property that keeps a
// node quiet; "no browsing context" is.
//
// ══ WHAT IS MEASURED, AND WHAT IS DELIBERATELY OUTSIDE THE WINDOW ═════════════════════════════
//
// The app page's own gesture chain: open the folder, click the file, and let
// `appShell.ts:153-157`'s `renderWithEnhancements` mount and enhance. Then SORT (a real click on a
// real `<button>`), FILTER (a real focus and real key presses) and COPY (a real trusted click,
// which is what carries the user activation both engines require of an async clipboard write).
// Nothing here calls `enhanceTables` by hand and nothing dispatches a synthetic `click()`.
//
// The mount-and-enhance step is INSIDE the first window too — it is where the toolbar's own nodes
// are created — and its zero is read with the same predicate. What is outside is everything the
// content script does, because the enhancer does not reach that surface until 4.1.
//
// SCOPING, honestly: the fixture is a heading, a small table and one line of prose — no remote
// media, no code fences (Shiki), no math (KaTeX), no mermaid — so nothing on the render path
// lazy-loads a chunk, and the whole module graph is statically imported at file load, before any
// measured window. Therefore ANY http(s) entry inside a measured window is attributable, and the
// zeros are read with the verbatim predicate over the WHOLE buffer rather than through a token
// filter, so a leak to ANY host would land in them.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { registerUiFonts } from '../../src/theme/uiFonts';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { isSentinel, wireSettled } from './helpers/diagramWindow';
import { userEvent, cdp } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';
import {
  COPY_BUTTON_CLASS,
  COPY_CSV_CLASS,
  COPY_MARKDOWN_CLASS,
  COPY_STATUS_CLASS,
  FILTER_CLEAR_CLASS,
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
 * Three data rows over three columns. `n` is 10 / 9 / 2 and `who` is zoe / adam / bo, so a sort by
 * `who` makes ALL THREE states distinct (ascending, descending and the document's own order) and a
 * filter on `eng` keeps exactly two rows. A zero measured over a control that moved nothing would
 * be a reading about nothing, and these orderings are what let each step say it really acted.
 */
const DOC = [
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

const DOCUMENT_ORDER = [
  ['eng', 'zoe', '10'],
  ['eng', 'adam', '9'],
  ['ops', 'bo', '2'],
];
const SORTED_BY_N_ASC = [
  ['ops', 'bo', '2'],
  ['eng', 'adam', '9'],
  ['eng', 'zoe', '10'],
];
const SORTED_BY_WHO_ASC = [
  ['eng', 'adam', '9'],
  ['ops', 'bo', '2'],
  ['eng', 'zoe', '10'],
];
const SORTED_BY_WHO_DESC = [
  ['eng', 'zoe', '10'],
  ['ops', 'bo', '2'],
  ['eng', 'adam', '9'],
];

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── The instrument — `remoteMedia:83-92`, `:120`, `:140`, VERBATIM in predicate and in shape ───

let seq = 0;
/** A unique path token per probe, so one case's control entries can never be read as another's
 *  (the Resource Timing buffer belongs to the whole page). */
const nextToken = (): string => `tabletools-${(seq += 1)}-${Math.trunc(performance.now())}`;

/**
 * ★ THE VERBATIM PREDICATE (`remoteMedia`/`tocNetwork`/1.6's `/^https?:/i`), applied to the WHOLE
 * buffer rather than to a token — a leak to ANY host, expected or not, lands in this reading. This
 * is what every ZERO assertion below is made of.
 */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

/** Entry names recorded for ONE probe token — the CONTROL's reading, scoped so a control can never
 *  be satisfied by an unrelated request. */
function probeUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_table_probe__/${token}/`));
}

/**
 * A macrotask + rAF + settle — long enough that a request fired during the window has reached the
 * Resource Timing buffer (`remoteMedia:140`'s own window). If a request fired it is recorded here;
 * if none did the buffer stays empty however long we wait, so this is a sound "zero requests"
 * proof AND IT IS USED ONLY IN THAT DIRECTION.
 */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/**
 * THE CONTROL'S WAIT — await the entries, never sample for them (`remoteMedia:120`, verbatim in
 * shape). The buffer is written asynchronously after the response completes, so a fixed window can
 * expire before the engine records a request it genuinely made (measured as a Firefox-only flake at
 * 1-in-10 runs). A control that reads empty when the request DID fire can read empty when it did
 * NOT, and the assertion it guards is AGENTS.md #1. Returns the buffer rather than throwing, so a
 * genuine failure fails on the CALLER's `toContain` with the real diff.
 */
const CONTROL_BUDGET_MS = 5000;
async function awaitProbeUrls(token: string, expected: string[]): Promise<string[]> {
  const deadline = performance.now() + CONTROL_BUDGET_MS;
  let seen = probeUrls(token);
  while (!expected.every((u) => seen.includes(u)) && performance.now() < deadline) {
    await sleep(25);
    seen = probeUrls(token);
  }
  return seen;
}

/** Same-origin, so even a regression hits the vitest dev server (a 404) and never the public
 *  internet — but the http(s) scheme still classifies as on-wire exactly as a CDN URL would. */
function probeUrl(token: string, leaf: string): string {
  return new URL(`/__peekover_table_probe__/${token}/${leaf}`, location.origin).href;
}

/**
 * Flush and assert NOTHING hit the wire.
 *
 * ★ CUMULATIVE BY DESIGN — the buffer is NOT re-cleared between steps. Clearing between them would
 * open a window in which an entry the engine records LATE for step N is thrown away before step
 * N+1 reads, which is the one way a zero here could be false. So every reading below includes
 * every step before it, and `label` names the step that had just run so a failure still points at
 * the first one that leaked.
 */
async function assertNoNetwork(label: string): Promise<void> {
  await flush();
  expect(networkedUrls(), `the table's "${label}" step put bytes on the wire`).toEqual([]);
}

// ── ★ ARMING THE PROBE — both lanes, in the SAME test body as the zeros they license ──────────

const adopted: Element[] = [];

/**
 * CONTROL LANE 1 — a bare `fetch()`. Proves this engine's buffer records a request at all, through
 * this exact `flush()`/`await` window.
 */
async function armFetchLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.txt');
  await fetch(url).catch(() => undefined);
  const seen = await awaitProbeUrls(token, [url]);
  expect(seen, 'CONTROL (fetch lane): the buffer must see a real request — else it is blind').toContain(
    url,
  );
  expect(networkedUrls(), 'CONTROL (fetch lane): the verbatim predicate must ALSO see it').toContain(
    url,
  );
}

/**
 * CONTROL LANE 2 — the SUBRESOURCE lane, on markup NO SANITIZER HAS TOUCHED, with the inert
 * `<template>` neutralization proven in the same breath.
 *
 * Step 1 parses hand-written `<img src>` markup into a `<template>`'s `.content` and asserts ZERO —
 * the inert document has no browsing context, so nothing is dispatched. Step 2 adopts THE SAME
 * NODES into the live document and asserts the request DOES fire. Because both steps use the same
 * bytes and the same URL, neither reading can be explained away: the zero is not "an unfetchable
 * URL" (it fetches one line later) and the fire is not "some other request" (it is token-scoped).
 *
 * ★ NOTHING HERE ROUTES THROUGH `sanitize()` OR `parse()` — see the header. And `<img>` rather than
 * `@import` is what keeps the inert half from being consumed at parse time, which is why one URL
 * can carry both halves.
 */
async function armSubresourceLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.png');

  // Step 1 — INERT PARSE. A <template>'s content, never a "detached" div: that div is owned by this
  // document and WOULD dispatch the fetch (mount.ts:120-127 — the leak that actually shipped).
  const tpl = document.createElement('template');
  tpl.innerHTML = `<img src="${url}" alt="">`;
  expect(
    tpl.content.querySelector('img')?.getAttribute('src'),
    'the probe markup did not survive the inert parse — this control would measure nothing',
  ).toBe(url);
  await flush();
  expect(probeUrls(token), 'the inert <template> parse dispatched a request').toEqual([]);

  // Step 2 — ADOPTION. The same nodes, now owned by a document WITH a browsing context. 1.6
  // measured that the fetch fires at `importNode` rather than at `appendChild`; both run here.
  const node = document.importNode(tpl.content, true);
  const img = node.querySelector('img')!;
  document.body.appendChild(node);
  adopted.push(img);
  const seen = await awaitProbeUrls(token, [url]);
  expect(
    seen,
    'CONTROL (subresource lane): adopted markup must fetch — else this probe cannot see a leak',
  ).toContain(url);
  expect(
    networkedUrls(),
    'CONTROL (subresource lane): the verbatim predicate must ALSO see it',
  ).toContain(url);
}

/** Arm BOTH lanes, then hand back a clean buffer for the measurement. */
async function armTheProbe(): Promise<void> {
  performance.clearResourceTimings();
  await armFetchLane();
  await armSubresourceLane();
  for (const el of adopted.splice(0)) el.remove(); // the control's node never rides into the window
  performance.clearResourceTimings();
}

// ── The app-page harness (the production gesture chain — never a direct `selectFile`) ──────────

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

// ── Readers (BY CLASS ALONE — never `button.${CLASS}`, which would encode the answer) ──────────

const columnOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
const tableOf = (host: HTMLElement) => columnOf(host).querySelector<HTMLTableElement>('table')!;
const toolbarOf = (table: HTMLTableElement) => table.previousElementSibling as HTMLElement;
const sortButtonsIn = (table: HTMLTableElement) => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];
const fieldOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
const clearOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${FILTER_CLEAR_CLASS}`)!;
const csvButtonOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_CSV_CLASS}`)!;
const markdownButtonOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_MARKDOWN_CLASS}`)!;
const statusOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLElement>(`.${COPY_STATUS_CLASS}`)!;
const emptyRowOf = (table: HTMLTableElement) =>
  table.querySelector<HTMLTableRowElement>(`.${FILTER_EMPTY_CLASS}`)!;

/** Every body row's cells, in DOM order — the table as it stands. */
const matrixOf = (table: HTMLTableElement): string[][] =>
  [...table.tBodies[0].rows].map((row) => [...row.cells].map((c) => (c.textContent ?? '').trim()));

/** ★ RENDERED, not merely un-`hidden` — the filter hides rows, and `hidden` is not the claim. */
const isPainted = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/** Only the rows a reader can see — the filter's own units. */
const paintedMatrixOf = (table: HTMLTableElement): string[][] =>
  [...table.tBodies[0].rows]
    .filter(isPainted)
    .map((row) => [...row.cells].map((c) => (c.textContent ?? '').trim()));

/** Type into the filter the way a reader does — a real focus and real key presses. */
async function typeInto(table: HTMLTableElement, text: string): Promise<void> {
  fieldOf(table).focus();
  await userEvent.keyboard(text);
}

/**
 * A REAL trusted click on a copy button, then the copy's own settle.
 *
 * Playwright's real mouse carries the user activation both engines require of an async clipboard
 * write. The settle is the status region acquiring text, because the write is a promise and
 * `userEvent.click` returns long before it resolves — so without this wait the measured window
 * would close BEFORE the clipboard call it exists to measure.
 */
async function copyAndSettle(
  table: HTMLTableElement,
  button: HTMLButtonElement,
): Promise<string> {
  statusOf(table).textContent = '';
  await userEvent.click(button);
  return waitFor(() => statusOf(table).textContent || null);
}

// ── The engines' clipboard consent (`tableCopy.browser.test.ts:230-270`'s shape, and its reason) ─
//
// ★ THE COPY MUST ACTUALLY SUCCEED HERE, AND THAT IS A MEASUREMENT DECISION RATHER THAN TIDINESS.
// A REFUSED write is a SHORTER path: the engine declines before it does whatever it does with the
// string. A zero measured over a refusal would therefore be a zero over less than the copy. So the
// Chromium consent is granted — a BROWSER CONSENT, not a manifest permission, which is 3.8's own
// finding and the whole of D-10 — and both engines then run the resolving path.
//
// Firefox has no `clipboard-write` `PermissionName` at all: the gesture is the entire gate, so
// there is nothing to grant and nothing to reset. Branching on the CAPABILITY rather than on
// `navigator.userAgent` keeps the case honest about WHY the engines diverge.

let grantedContextId: string | undefined;
let consentGranted = false;

async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

async function ownContextId(): Promise<string | undefined> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  return info?.targetInfo?.browserContextId;
}

/**
 * Grant the BROWSER-CONTEXT clipboard consent — Chromium only, over CDP. Nothing is rebuilt and
 * nothing is re-manifested; only the browser's consent moves.
 *
 * ★ THE CONTEXT ID IS KEPT BECAUSE THE RESET NEEDS IT TOO — measured at 3.8: a
 * `Browser.resetPermissions` sent with no `browserContextId` clears the DEFAULT context and leaves
 * a Playwright page's own context granted, and the browser window is shared across every file in
 * the run. So this file cleans up by id, and pins the cleanup in `afterEach`.
 */
async function grantClipboardConsent(): Promise<void> {
  grantedContextId = await ownContextId();
  consentGranted = true;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const el of adopted.splice(0)) el.remove();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
}

// 013 task 2.4: the app shell now registers the design faces (src/theme/uiFonts.ts). In this
// harness their package URLs are same-origin dev-server fetches (http://localhost…); shipped, they are
// chrome-extension:// / moz-extension:// URLs this file's predicate excludes by scheme. They are
// loaded once here, before any measured window, so the shell's own call is the idempotent no-op it
// is built to be and this file keeps measuring its own feature. The faces' own zero-network proof:
// tests/browser/uiFontsNetwork.browser.test.ts.
beforeAll(async () => {
  await registerUiFonts();
});

beforeEach(async () => {
  reset();
  if ((await clipboardWriteConsent()) === 'unsupported') return; // Gecko has nothing to grant
  await grantClipboardConsent();
});

afterEach(async () => {
  reset();
  if (!consentGranted) return;
  consentGranted = false;
  await cdp().send('Browser.resetPermissions', {
    browserContextId: grantedContextId,
  } as never);
  // The instrument for the cleanup itself: if the consent survived, say so HERE rather than in
  // whichever file happens to run next and pins `prompt`.
  expect(await clipboardWriteConsent(), 'the granted consent outlived this file').toBe('prompt');
});

// ══ THE SEQUENCE — SORT → FILTER → COPY, IN ONE ARMED WINDOW ══════════════════════════════════

describe('3.11 · row 22 — sort → filter → copy put NOTHING on the wire', () => {
  it(
    'the three actions in sequence: ZERO requests at the request level, against an ARMED probe',
    async () => {
      // ★ ARM FIRST, IN THIS TEST'S OWN BODY. Both lanes fire here — a bare fetch, and adopted
      // markup no sanitizer has touched — so every zero below is measured against an instrument
      // that has JUST been shown to record requests in THIS engine, in THIS run. Without this the
      // zeros are indistinguishable from a blind probe, and that is the whole of finding 1.
      await armTheProbe();

      // MOUNT + ENHANCE, through the app page's own gesture chain. The toolbar's nodes are created
      // inside this window too, which is where a leak would be introduced if one existed.
      const host = await openDoc(DOC);
      const table = tableOf(host);
      expect(
        toolbarOf(table).classList.contains(TABLE_TOOLBAR_CLASS),
        'no toolbar was built — this window would measure nothing',
      ).toBe(true);
      await assertNoNetwork('mount + enhance');

      // ── SORT ──────────────────────────────────────────────────────────────────────────────────
      await userEvent.click(sortButtonsIn(table)[2]);
      expect(
        matrixOf(table),
        'the sort moved no row — a zero over a control that did nothing measures nothing',
      ).toEqual(SORTED_BY_N_ASC);
      await assertNoNetwork('sort');

      // ── FILTER ────────────────────────────────────────────────────────────────────────────────
      await typeInto(table, 'eng');
      expect(
        paintedMatrixOf(table),
        'the filter hid no row — a zero over a control that did nothing measures nothing',
      ).toEqual([
        ['eng', 'adam', '9'],
        ['eng', 'zoe', '10'],
      ]);
      await assertNoNetwork('filter');

      // ── COPY ──────────────────────────────────────────────────────────────────────────────────
      // The confirmation IS the non-vacuity: it names the row count, so it can only be produced by
      // a handler that serialized the SHOWN rows and got a RESOLVED clipboard write back.
      const announced = await copyAndSettle(table, csvButtonOf(table));
      expect(
        announced,
        'the copy did not complete — a zero over a refused write measures less than the copy',
      ).toBe('Copied 2 rows as CSV.');
      await wireSettled();
      await assertNoNetwork('copy');

      // ★ AND THE PROBE IS STILL LIVE. Without this, a probe that went blind midway through the
      // measurement would report a clean zero and be indistinguishable from quiet controls.
      await armFetchLane();
      await armSubresourceLane();
    },
    30_000,
  );
});

// ══ EACH ACTION AGAINST ITS OWN FRESHLY ARMED PROBE ═══════════════════════════════════════════
//
// The sequence above measures the three actions against ONE arming, which is row 22's claim as
// written. This narrows it: the probe is RE-ARMED immediately before every action, so each zero
// rests on a control that fired moments earlier rather than several actions ago — and the six legs
// cover the states the sequence does not reach, each of which CREATES OR MOVES DOM and is
// therefore exactly where a subresource would be dispatched:
//
//   • the sort's full three-state cycle, including the restore to document order;
//   • the filter's empty state, whose `<tr>` is UNHIDDEN into the live table when nothing matches;
//   • the clear control;
//   • BOTH copy formats, not only CSV.

interface Leg {
  readonly label: string;
  readonly run: (table: HTMLTableElement) => Promise<void>;
}

const LEGS: readonly Leg[] = [
  {
    label: 'sort · the whole three-state cycle',
    run: async (table) => {
      const seen: string[][][] = [];
      for (let i = 0; i < 3; i += 1) {
        await userEvent.click(sortButtonsIn(table)[1]);
        seen.push(matrixOf(table));
      }
      // ONE assertion carrying the whole cycle, so no cheap clause in front can swallow the red.
      expect(seen, 'the sort cycle did not visit ascending, descending and the document order').toEqual([
        SORTED_BY_WHO_ASC,
        SORTED_BY_WHO_DESC,
        DOCUMENT_ORDER,
      ]);
    },
  },
  {
    label: 'filter · a query that matches',
    run: async (table) => {
      await typeInto(table, 'eng');
      expect(paintedMatrixOf(table), 'the filter hid nothing').toEqual([
        ['eng', 'zoe', '10'],
        ['eng', 'adam', '9'],
      ]);
    },
  },
  {
    label: 'filter · a query that matches NOTHING (the empty state is inserted)',
    run: async (table) => {
      await typeInto(table, 'zzz');
      expect(
        { painted: paintedMatrixOf(table), emptyStateShown: isPainted(emptyRowOf(table)) },
        'the empty state did not arrive — this leg measured no insertion',
      ).toEqual({ painted: [], emptyStateShown: true });
    },
  },
  {
    label: 'filter · the clear control',
    run: async (table) => {
      await userEvent.click(clearOf(table));
      expect(
        { painted: paintedMatrixOf(table), field: fieldOf(table).value },
        'the clear did not restore every row',
      ).toEqual({ painted: DOCUMENT_ORDER, field: '' });
    },
  },
  {
    label: 'copy · CSV',
    run: async (table) => {
      expect(await copyAndSettle(table, csvButtonOf(table))).toBe('Copied 3 rows as CSV.');
    },
  },
  {
    label: 'copy · Markdown',
    run: async (table) => {
      expect(await copyAndSettle(table, markdownButtonOf(table))).toBe(
        'Copied 3 rows as Markdown.',
      );
    },
  },
];

describe('3.11 · row 22 — every action, each measured against a probe armed just before it', () => {
  it(
    'six legs, six armings: every one reads ZERO',
    async () => {
      const host = await openDoc(DOC);
      const table = tableOf(host);
      expect(sortButtonsIn(table), 'the fixture must really be enhanced').toHaveLength(3);
      expect(
        toolbarOf(table).querySelectorAll(`.${COPY_BUTTON_CLASS}`),
        'both copy buttons must exist before any leg runs',
      ).toHaveLength(2);

      for (const leg of LEGS) {
        await armTheProbe(); // fires both lanes, then hands back a clean buffer
        await leg.run(table);
        await wireSettled();
        await assertNoNetwork(leg.label);
      }

      // The probe outlived every leg.
      await armFetchLane();
      await armSubresourceLane();
    },
    60_000,
  );
});
