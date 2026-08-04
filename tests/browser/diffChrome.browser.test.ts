// diffChrome — the REAL-ENGINE proofs for task 6.2 (the diff AFFORDANCE, D-14), Chromium AND Firefox.
//
// WHY THESE CASES ARE NOT jsdom CASES. Three of the four things this task can get wrong are
// invisible to jsdom:
//   • THE D-14 SURFACE GATE is an ARCHITECTURAL fact about which production graph reaches the
//     registry (§3.2). `diffChrome.test.ts` hand-registers a context to test build logic — which is
//     exactly the M5 "built, tested, wired to nothing" defect if it were left to stand alone. Here
//     the content-script case drives the real `installContentWatch` and observes the affordance
//     stay absent because `contentWatch.ts` reaches no diff registration at all.
//   • THE SIBLING RELATIONSHIP (`.peekover-diff-affordance` beside `.peekover-reader`, never
//     inside it) is the one the golden pin CANNOT see — the golden snapshots `sanitize(parse(src))`
//     upstream of chrome composition entirely, so it stays EMPTY even for chrome wrongly appended
//     into the reading column (mount.ts:159-166 says so in as many words).
//   • PLACEMENT and the enter/exit visibility flip are layout: jsdom returns all-zero rects and
//     applies no cascade, so `display:none` on the reading column is unobservable there.
// The picker/fallback BRANCHING is unit-tested in `src/render/diffChrome.test.ts`; what runs here
// is the same flow end-to-end through the REAL engine (`computeDiff`) and the REAL view
// (`enterDiff`), reached the only way production reaches them — the `showDiff`/`hideDiff` closures
// `appShell.installWatchForFile` provisions over the plan §1.4 import fence.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { page } from 'vitest/browser';

// Hoisted so the vi.mock factories (hoisted above the imports) can read them — the
// diffView.browser / readerSource.browser precedent. Both default OFF; each fallback case flips one
// around a single gesture and clears it in afterEach.
const injected = vi.hoisted(() => ({ parseShouldThrow: false, snapshotTextIsGone: false }));

vi.mock('../../src/render/parse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/render/parse')>();
  return {
    ...actual,
    parse: (markdown: string): string => {
      if (injected.parseShouldThrow) throw new Error('forced parse failure (test-only)');
      return actual.parse(markdown);
    },
  };
});

// The 1.2 dangling-meta window, forced: meta survives, the content row does not. Mocking the
// PRODUCTION module `appShell` reads through means the real `fetchText` closure is still the thing
// under test — only the row it finds is gone.
vi.mock('../../src/app/snapshots', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app/snapshots')>();
  return {
    ...actual,
    getSnapshotText: async (id: string): Promise<string | undefined> =>
      injected.snapshotTextIsGone ? undefined : actual.getSnapshotText(id),
  };
});

import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { installContentWatch } from '../../src/watch/contentWatch';
import {
  DIFF_AFFORDANCE_CLASS,
  DIFF_PICKER_CLASS,
  DIFF_STATUS_CLASS,
} from '../../src/render/diffChrome';
import { DIFF_VIEW_CLASS } from '../../src/render/diffView';
import {
  getDiffContext,
  isDiffContextRegistered,
  registerDiffContext,
  createDiffContext,
  resetDiffRegistryForTest,
} from '../../src/render/diffRegistry';
import { storeSnapshot } from '../../src/app/snapshots';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { WATCH_READ, type WatchMessage } from '../../src/watch/watchRelay';

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 }; // watchControl.browser.test.ts's own WIDE
// Recovery B1: the geometry cases run at BOTH of these. 1400 alone sat on the clean side of the
// finding-2 collision (the reading column's left margin was wide enough there to hide it); 1280 is
// the width at which the app pane's column goes flush-left, which is where the pill's old
// top:56 landed on the h1. A single wide width let that class of defect ship.
const GEOMETRY_WIDTHS = [
  ['1280', { width: 1280, height: 900 }],
  ['1400', WIDE],
] as const;

const FILLER = Array.from(
  { length: 10 },
  (_, i) => `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
).join('\n\n');

/** The document on screen — the diff's "after" side. */
function docV2(): string {
  return ['# Watched doc', FILLER, '## Section two', 'The line that is NEW in version two.'].join('\n\n');
}
/** What a snapshot holds — the diff's "before" side. One line differs, so the real engine must
 *  produce at least one added AND one removed hunk. */
function docV1(): string {
  return ['# Watched doc', FILLER, '## Section two', 'The line that was OLD in version one.'].join('\n\n');
}

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** A PERSISTABLE in-memory folder source — `persistable:true` is what makes the app-page surface
 *  watchable, so `installWatchForFile` reaches its `registerDiffContext` site (2.1's note).
 *
 *  `others` (task 2.3) is the OTHER markdown beside the open document — the material 2.2's
 *  `fetchFiles` offers, minus the open file itself. It defaults to NONE, which is what keeps every
 *  case above and below this line on the SNAPSHOT-ONLY path: the single-file folder is 006's picker,
 *  and the D-4 non-regression is measured against exactly the source those cases drive. */
function memorySource(name: string, text: string, others: [string, string | null][] = []): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [
      { path: name, name, read: async () => text },
      ...others.map(([path, body]) => ({
        path,
        name: path,
        // ★ 2.5, §3.8: a `null` body is a file that CANNOT BE READ, and it fails the way a real one
        // does — `MarkdownFile.read` REJECTS. That is the shape 2.2's `fetchFileText` turns into
        // `undefined` in its own catch; stubbing the `undefined` directly would skip the production
        // code that produces it and prove the fallback over a fixture instead of over the seam.
        read: async () => {
          if (body == null) throw new Error('forced read failure (test-only)');
          return body;
        },
      })),
    ],
  };
}

/** Stand-in for the background relay, answering the real `WATCH_READ` wire shape. */
function fakeBackground(initial: string): (m: WatchMessage) => Promise<unknown> {
  return async (m) => {
    expect(m.type).toBe(WATCH_READ);
    return { ok: true, text: initial };
  };
}

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const flush = () => new Promise<void>((r) => setTimeout(r, 30));

const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];

/** The content-script surface, driven the way the entrypoint drives it: `installContentWatch` at
 *  document_start (no host yet), then the reader mounts. */
function mountContentScript(doc = docV2()): HTMLElement {
  installContentWatch({
    url: 'file:///tmp/watched.md',
    send: fakeBackground(doc),
    backgroundCanReadFileUrls: true,
    intervalMs: 10_000,
  });
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  hosts.push(host);
  mount(doc, host); // `contained` omitted — the full-page content-script surface
  return host;
}

/** The app-page surface, driven through the real user gesture chain. NEVER hand-registers a diff
 *  context: the only registration observed is the one `installWatchForFile` performs (M5 seam rule). */
async function mountAppPage(
  doc = docV2(),
  others: [string, string | null][] = [],
): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc, others) }),
    store: fakeStore(),
  });
  await app.openFolder();
  // `doc.md` is the FIRST file in the source, so this selects the open document whether or not the
  // folder holds others — the file rows that appear in the picker are then genuinely "another file".
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  await waitFor(() => isDiffContextRegistered());
  return host;
}

/** Seed one snapshot for the document now on screen, through the PRODUCTION capture function and
 *  the PRODUCTION docId the app page registered. (The genuine capture trigger is a watch update —
 *  1.4's path, proven in snapshotCapture.browser.test.ts. What 6.2 is about is what the affordance
 *  does with a snapshot that exists, so this seeds one directly rather than re-proving capture.) */
async function seedSnapshot(text = docV1()): Promise<string> {
  const docId = getDiffContext()!.docId;
  await storeSnapshot(docId, text);
  await waitFor(async () => (await getDiffContext()!.fetchMeta()).length > 0);
  return docId;
}

const shadowOf = (host: HTMLElement) => host.shadowRoot!;
const pillIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLButtonElement>(`.${DIFF_AFFORDANCE_CLASS}`);
const pickerIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>(`.${DIFF_PICKER_CLASS}`);
const statusIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>(`.${DIFF_STATUS_CLASS}`);
const readerIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>('.peekover-reader')!;
const diffIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLElement>(`.${DIFF_VIEW_CLASS}`);

const isHidden = (el: HTMLElement) => getComputedStyle(el).display === 'none';

function intersects(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
function expectNoOverlap(name: string, a: DOMRect, other: string, b: DOMRect): void {
  const detail =
    `${name} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}] ` +
    `vs ${other} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`;
  expect(intersects(a, b), `overlap: ${detail}`).toBe(false);
}

beforeEach(async () => {
  injected.parseShouldThrow = false;
  injected.snapshotTextIsGone = false;
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(async () => {
  injected.parseShouldThrow = false;
  injected.snapshotTextIsGone = false;
  __resetConnectionForTest();
  for (const h of hosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

// ── D-14: the surface gate, on BOTH surfaces, as an architectural fact ────────────────────────

describe('D-14 — the affordance exists exactly where a diff target is registered (§3.2)', () => {
  it('CONTENT SCRIPT: neither an affordance NOR an explanation (§3.2 verbatim: "Do not add one.")', () => {
    const host = mountContentScript();

    // The architectural fact underneath: this production path reaches no diff registration.
    expect(isDiffContextRegistered()).toBe(false);
    expect(pillIn(host)).toBeNull();
    // ...and NO note branch. This is the clause that separates buildDiffChrome from
    // buildWatchChrome's four-state: the user never saw a history feature here, so there is
    // nothing to be told they are missing.
    expect(pickerIn(host)).toBeNull();
    expect(statusIn(host)).toBeNull();
    const chromeText = [...shadowOf(host).children]
      .filter((el) => !el.classList.contains('peekover-reader') && el.tagName !== 'STYLE')
      .map((el) => el.textContent ?? '')
      .join(' ');
    expect(chromeText).not.toMatch(/snapshot|compare|comparison|diff|histor/i);

    // NON-VACUOUS: the surface really did render, and it really did grow OTHER chrome — so the
    // absence above is the diff gate, not a reader that failed to mount.
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
    expect(shadowOf(host).querySelector('.peekover-theme-toggle')).not.toBeNull();
  });

  it('APP PAGE: the SAME document grows the affordance, because a context IS registered', async () => {
    const host = await mountAppPage();
    expect(isDiffContextRegistered()).toBe(true);
    const pill = pillIn(host);
    expect(pill).not.toBeNull();
    expect(pill!.textContent).toBe('Compare');
    expect(pill!.getAttribute('aria-label')).toBe('Compare this document with a saved snapshot');
  });

  it('RED-FIRST: the gate is the REGISTRY, not some other property of the content script', async () => {
    // Ungate it by hand — register a diff context on the content-script surface, bypassing the
    // architectural fact — and the affordance appears there. ONE thing changes and ONE thing goes
    // red, which is what proves the gate above is `isDiffContextRegistered()` and not `contained`,
    // not `watchAvailable()`, and not an accident of the content script's chrome order.
    const before = mountContentScript();
    expect(pillIn(before)).toBeNull();

    registerDiffContext(
      createDiffContext({
        docId: 'hand-registered/doc.md',
        getCurrentSource: () => docV2(),
        fetchMeta: async () => [],
        fetchText: async () => undefined,
        showDiff: () => ({ ok: true }),
        hideDiff: () => undefined,
      }),
    );

    const after = document.createElement('peekover-root');
    document.body.appendChild(after);
    hosts.push(after);
    mount(docV2(), after);
    expect(pillIn(after)).not.toBeNull(); // ← the red-first: ungated, it shows up

    // Restore, and the very next render is clean again — the gate is live, not a build-time fact.
    resetDiffRegistryForTest();
    const restored = document.createElement('peekover-root');
    document.body.appendChild(restored);
    hosts.push(restored);
    mount(docV2(), restored);
    expect(pillIn(restored)).toBeNull();
  });
});

// ── The structural DOM relationship the golden pin cannot see ─────────────────────────────────

describe('the affordance is a SIBLING of the reading column, never inside it', () => {
  it('pill, picker and status all sit beside .peekover-reader in the shadow root', async () => {
    const host = await mountAppPage();
    const shadow = shadowOf(host);
    const reader = readerIn(host);

    for (const [label, el] of [
      ['pill', pillIn(host)!],
      ['picker', pickerIn(host)!],
      ['status', statusIn(host)!],
    ] as const) {
      expect(el, `${label} missing`).not.toBeNull();
      // THE ASSERTION. Verified red by appending into `.peekover-reader` instead: the golden pin
      // stays EMPTY (it snapshots sanitize(parse(source)), upstream of chrome entirely), and only
      // this fails — which is precisely why it is written as a parent identity, not a `contains`.
      expect(el.parentNode, `${label} is not a shadow-root child`).toBe(shadow);
      expect(reader.contains(el), `${label} leaked INTO the reading column`).toBe(false);
    }
    // Non-vacuous: the reading column exists and has real content to have leaked into.
    expect(reader.querySelector('h1')).not.toBeNull();
  });
});

// ── Placement (the M3 collision class; measured at 4.1, asserted here) ────────────────────────

// GEOMETRY IS ASSERTED AT THE WIDE VIEWPORT, ON THE CONTAINED SURFACE, and both halves of that are
// findings rather than convenience:
//   • CONTAINED, because D-14 ships this chrome to the app page ONLY. Measuring the full-page
//     reader — which is what every other pill in readerCss.ts was measured against — answers a
//     question about a surface this affordance never appears on. The first 6.2 probe did exactly
//     that, "cleared" top-left, and was contradicted the moment the real surface was measured.
//   • WIDE, because at 414x896 the app shell's tree leaves the reader host 146px wide — narrower
//     than a single 130px pill — so every candidate collides there AND the existing bottom-left
//     stack already self-overlaps (watch note vs capture disclosure) before this task adds
//     anything. Asserting at that width would pin a pre-existing 3.1-era condition of the contained
//     pane onto 6.2. readerCss.ts records the measured rects; the full reasoning lives there.
// This mirrors watchControl.browser.test.ts's own scoped-to-WIDE column check and 004's 5.1
// precedent ("clears the reading column at a WIDE viewport, where a gutter exists").
describe('placement clears the existing chrome (measured, not chosen)', () => {
  it.each(GEOMETRY_WIDTHS)('clears the aside stack, the mode toggle and the TOC rail at %s', async (_w, size) => {
    await page.viewport(size.width, size.height);
    const host = await mountAppPage();
    await seedSnapshot();

    // Force the rail OPEN and measure SYNCHRONOUSLY: tocView's width-derived initial state lands a
    // frame later and stomps an early data-toc="open" back to "collapsed" (a stomp that silently
    // hid the rail's entry list during the 6.2 placement probe and nearly cleared a candidate that
    // in fact sat on the rail's entry list).
    await flush();
    host.setAttribute('data-toc', 'open');

    const shadow = shadowOf(host);
    const pill = pillIn(host)!;
    const rect = pill.getBoundingClientRect();
    // Non-vacuous: a zero-size or display:none pill would clear everything trivially.
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);

    for (const [name, sel] of [
      ['mode-toggle', '.peekover-mode-toggle'],
      ['theme pill', '.peekover-theme-toggle'],
      ['watch pill', '.peekover-watch'],
      ['watch note', '.peekover-watch-note'],
      ['capture disclosure', '.peekover-watch-disclosure'],
      ['TOC handle', '.peekover-toc__toggle'],
      ['TOC list', '.peekover-toc__list'],
    ] as const) {
      const el = shadow.querySelector<HTMLElement>(sel);
      if (!el || el.hidden) continue; // a hidden aside has no rect to clear
      const other = el.getBoundingClientRect();
      if (other.width === 0 || other.height === 0) continue;
      expectNoOverlap('diff affordance', rect, name, other);
    }
    // The stack really was populated — otherwise the loop above cleared nothing.
    expect(shadow.querySelector('.peekover-theme-toggle')).not.toBeNull();
    expect(shadow.querySelector('.peekover-toc__toggle')).not.toBeNull();
  });

  it('the OPEN picker clears that chrome too — a pill whose list has nowhere to go is not a placement', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const host = await mountAppPage();
    await seedSnapshot();
    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    await flush();
    host.setAttribute('data-toc', 'open');

    const shadow = shadowOf(host);
    const rect = pickerIn(host)!.getBoundingClientRect();
    expect(rect.height).toBeGreaterThan(0);
    for (const [name, sel] of [
      ['mode-toggle', '.peekover-mode-toggle'],
      ['theme pill', '.peekover-theme-toggle'],
      ['watch pill', '.peekover-watch'],
      ['TOC handle', '.peekover-toc__toggle'],
      ['TOC list', '.peekover-toc__list'],
    ] as const) {
      const el = shadow.querySelector<HTMLElement>(sel);
      if (!el || el.hidden) continue;
      const other = el.getBoundingClientRect();
      if (other.width === 0 || other.height === 0) continue;
      expectNoOverlap('diff picker', rect, name, other);
    }
  });

  // ── THE ASSERTION 6.2 DROPPED IN TRANSCRIPTION (recovery B1, finding 2) ─────────────────────
  // The loop above checks six sibling chromes and the rail. It did NOT check the READING COLUMN,
  // and that omission IS finding 2: the pill shipped at top:56px and the column's padding-top is
  // also 56px, so the pill's top edge was flush with the h1's — overlapping at every app-page width
  // where the column's left margin fell under ~114px. watchControl.browser.test.ts:453-466 and
  // themeControl.browser.test.ts:349 both DO check reader clearance; this file's header cites
  // watchControl by name but borrowed only its SCOPING decision (assert at a wide viewport) and left
  // the assertion itself behind. One line lost in transcription, one defect shipped.
  //
  // ★ WHY THE TARGET IS THE h1 AND NOT `.peekover-reader`'s OWN RECT. The fix puts the pill INSIDE
  // the column's box deliberately — the top 56px of `padding:56px 32px 130px` is empty at every
  // width, forever, and a 32px pill fits wholly within it. A whole-box assertion is therefore
  // unsatisfiable BY CONSTRUCTION: it would forbid the fix rather than guard it. What must never be
  // overlapped is the column's rendered CONTENT, and the h1 is both the topmost content box and the
  // tightest case.
  it.each(GEOMETRY_WIDTHS)("clears the reading column's first content box at %s", async (_w, size) => {
    await page.viewport(size.width, size.height);
    const host = await mountAppPage();
    await seedSnapshot();
    await flush();
    host.setAttribute('data-toc', 'open');

    const h1 = readerIn(host).querySelector<HTMLElement>('h1')!;
    expect(h1).not.toBeNull();
    const h1Rect = h1.getBoundingClientRect();
    // Non-vacuous: a zero-rect or display:none h1 would clear everything trivially.
    expect(h1Rect.width).toBeGreaterThan(0);
    expect(h1Rect.height).toBeGreaterThan(0);

    const compare = pillIn(host)!.getBoundingClientRect();
    expect(compare.height).toBeGreaterThan(0);
    expectNoOverlap('diff affordance (Compare)', compare, 'reader h1', h1Rect);

    // ...and in the EXIT state, where the label is at its widest. The column is display:none'd while
    // a diff is up, so this reuses the rect captured above — the invariant being asserted is "the
    // pill the user clicks to come BACK does not sit on the document it restores".
    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    pickerIn(host)!.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await waitFor(() => host.getAttribute('data-diff') === 'active');
    expect(pillIn(host)!.textContent).toBe('Close comparison'); // the wide label really is up
    expectNoOverlap(
      'diff affordance (exit)',
      pillIn(host)!.getBoundingClientRect(),
      'reader h1',
      h1Rect,
    );
  });

  // ── THE --reader-measure COUPLING, ASSERTED RATHER THAN DOCUMENTED ──────────────────────────
  // The reading column's measure is referenced TWICE — `.peekover-reader{max-width}` and the
  // data-toc="open" margin-left that centres it — and the two MUST resolve to the same length or the
  // centring is silently wrong at every wide viewport. readerCss.ts holds one `--reader-measure`
  // variable so they cannot drift by construction; this is the runtime proof that they haven't. It
  // is a px constant rather than `76ch` for a measured reason (the `ch` unit inside a margin calc
  // cost ~28ms of first paint by pulling font metrics into layout — readerCss.ts's B1 .ts block has
  // the numbers), which is exactly the kind of trade a later session might undo without knowing why.
  // If someone edits max-width to a different measure and leaves the variable behind, this reds.
  it.each(GEOMETRY_WIDTHS)('--reader-measure is the SAME length max-width resolves to at %s', async (_w, size) => {
    await page.viewport(size.width, size.height);
    const host = await mountAppPage();
    await flush();
    const reader = readerIn(host);
    const computedMaxWidth = getComputedStyle(reader).maxWidth;
    const computedMeasure = getComputedStyle(host).getPropertyValue('--reader-measure').trim();

    // Non-vacuous: two empty strings, or a pair of `none`s, would match trivially.
    expect(computedMeasure).toMatch(/^\d+(\.\d+)?px$/);
    expect(computedMaxWidth).toMatch(/^\d+(\.\d+)?px$/);
    expect(computedMaxWidth).toBe(computedMeasure);
  });

  // ── THE CONDITIONAL-CLEARANCE OBJECTION, NOW ANSWERED RATHER THAN RECORDED ──────────────────
  // diffChrome.ts:64-66 recorded top-left-at-16 as "taken on exactly the documents that have blocked
  // media" — watchControl.ts:22-23's objection — and left it standing, which was fine while 6.2's
  // pill sat BELOW that slot at top:56. Finding 2's fix moves the pill INTO the band remote-load
  // occupies, so the objection stops being a note and becomes a thing that must be answered: the two
  // get distinct LANES (pill at left:16, opt-in displaced to left:176 in CONTAINED_CSS). This is the
  // assertion that the lanes hold.
  it.each(GEOMETRY_WIDTHS)('clears the remote-load opt-in that shares the top band at %s', async (_w, size) => {
    await page.viewport(size.width, size.height);
    const host = await mountAppPage(`${docV2()}\n\n![blocked](https://example.invalid/x.png)\n`);
    await seedSnapshot();
    await flush();
    host.setAttribute('data-toc', 'open');

    const remote = shadowOf(host).querySelector<HTMLElement>('.peekover-remote-load');
    // Non-vacuous: the fixture's image really was blocked, so the opt-in really is on screen. Without
    // this the whole case passes by the element being absent.
    expect(remote, 'remote-load opt-in absent — the blocked-media fixture stopped working').not.toBeNull();
    const remoteRect = remote!.getBoundingClientRect();
    expect(remoteRect.width).toBeGreaterThan(0);
    expect(remoteRect.height).toBeGreaterThan(0);

    expectNoOverlap(
      'diff affordance (Compare)',
      pillIn(host)!.getBoundingClientRect(),
      'remote-load',
      remoteRect,
    );

    // The picker drops out of the pill's lane and must clear the opt-in too.
    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    expectNoOverlap('diff picker', pickerIn(host)!.getBoundingClientRect(), 'remote-load', remoteRect);

    // ★ THE WIDE LABEL IS THE REAL CASE: "Close comparison" measures 136px against "Compare"'s 85px,
    // so it is the only state that can reach across into the opt-in's lane. The 176px offset is set
    // off the WIDER of the two, which is what makes it deterministic — both labels are fixed
    // constants in diffChrome.ts, unlike remote-load's own count-dependent copy.
    pickerIn(host)!.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await waitFor(() => host.getAttribute('data-diff') === 'active');
    expect(pillIn(host)!.textContent).toBe('Close comparison');
    expectNoOverlap(
      'diff affordance (exit)',
      pillIn(host)!.getBoundingClientRect(),
      'remote-load',
      remoteRect,
    );
  });
});

// ── The flow, end to end, through the REAL engine and the REAL view ───────────────────────────

describe('the picker → diff → exit round trip (real computeDiff, real enterDiff)', () => {
  it('picks a snapshot and enters the diff: data-diff active, reader hidden, .peekover-diff present', async () => {
    const host = await mountAppPage();
    await seedSnapshot();

    pillIn(host)!.click();
    const picker = await waitFor(() => (pickerIn(host)!.hidden ? null : pickerIn(host)));
    const items = [...picker!.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    expect(items).toHaveLength(1);
    // Divergence 1 again, on the real surface: an inline listbox, not a dialog.
    expect(shadowOf(host).querySelector('[role="dialog"]')).toBeNull();
    expect(shadowOf(host).querySelector('[aria-modal]')).toBeNull();

    items[0].click();
    await waitFor(() => host.getAttribute('data-diff') === 'active');

    // D-15: the flip, and CSS — not a DOM edit — hides the reading column.
    expect(host.getAttribute('data-diff')).toBe('active');
    expect(isHidden(readerIn(host))).toBe(true);
    const diff = diffIn(host)!;
    expect(diff).not.toBeNull();

    // The REAL engine ran: one line differs, so there is an added block AND a removed block, and
    // the unchanged prose is carried too. (This is the proof the engine reached production — via
    // appShell's provisioned closure, with no engine import anywhere mount.ts can see.)
    expect(diff.querySelector('.diff-added')).not.toBeNull();
    expect(diff.querySelector('.diff-removed')).not.toBeNull();
    expect(diff.textContent).toContain('NEW in version two');
    expect(diff.textContent).toContain('OLD in version one');
    // More than colour (§5): removed carries line-through as well as hue.
    expect(getComputedStyle(diff.querySelector<HTMLElement>('.diff-removed')!).textDecorationLine)
      .toContain('line-through');

    // The picker closed itself, and success says nothing — the diff IS the answer.
    expect(pickerIn(host)!.hidden).toBe(true);
    expect(statusIn(host)!.hidden).toBe(true);
  });

  it('the pill becomes EXIT, and exiting restores the document', async () => {
    const host = await mountAppPage();
    await seedSnapshot();
    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    pickerIn(host)!.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await waitFor(() => host.getAttribute('data-diff') === 'active');

    const pill = pillIn(host)!;
    expect(pill.textContent).toBe('Close comparison');
    expect(pill.dataset.diffOpen).toBe('true');

    pill.click();
    await waitFor(() => !host.hasAttribute('data-diff'));
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(isHidden(readerIn(host))).toBe(false);
    expect(diffIn(host)).toBeNull();
    expect(readerIn(host).querySelector('h1')).not.toBeNull(); // the document is back, untouched
    expect(pillIn(host)!.textContent).toBe('Compare');
  });
});

// ── The fallback and the empty state: explain, never blank ────────────────────────────────────

describe('never blank (AGENTS.md #5) — the fallback states, on the real surface', () => {
  it('EMPTY STATE: no snapshots yet is answered beside the untouched reader', async () => {
    const host = await mountAppPage(); // no seedSnapshot — the store is wiped in beforeEach
    pillIn(host)!.click();
    await waitFor(() => statusIn(host)!.hidden === false);

    expect(statusIn(host)!.textContent).toContain('No snapshots yet');
    expect(pickerIn(host)!.hidden).toBe(true);
    // The reader is exactly as it was: no diff, no re-render.
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(isHidden(readerIn(host))).toBe(false);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
  });

  it('DANGLING META (1.2 self-reclaim window): "comparison unavailable", data-diff never set', async () => {
    const host = await mountAppPage();
    await seedSnapshot();
    injected.snapshotTextIsGone = true; // meta survives, the content row does not

    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    pickerIn(host)!.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await waitFor(() => statusIn(host)!.hidden === false);

    expect(statusIn(host)!.textContent).toContain('Comparison unavailable');
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(diffIn(host)).toBeNull();
    expect(isHidden(readerIn(host))).toBe(false);
    expect(pillIn(host)!.textContent).toBe('Compare'); // still offering, not stuck in exit
  });

  it('RENDER FAILURE: the real enterDiff returns {ok:false} and its reason is surfaced', async () => {
    const host = await mountAppPage();
    await seedSnapshot();
    injected.parseShouldThrow = true; // the REAL view's fallback path, not a stubbed one

    pillIn(host)!.click();
    await waitFor(() => pickerIn(host)!.hidden === false);
    pickerIn(host)!.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    await waitFor(() => statusIn(host)!.hidden === false);

    expect(statusIn(host)!.textContent).toContain('forced parse failure');
    // §1.5: nothing inserted, data-diff never set, the document stays exactly on screen.
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(diffIn(host)).toBeNull();
    expect(isHidden(readerIn(host))).toBe(false);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
  });

  it('the status line is a polite live region, out of the a11y tree while empty', async () => {
    const host = await mountAppPage();
    const status = statusIn(host)!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true); // `hidden`, not merely transparent
    pillIn(host)!.click();
    await waitFor(() => status.hidden === false);
    expect(status.textContent!.length).toBeGreaterThan(0);
  });
});

// ── TASK 2.3: TWO KINDS IN ONE LISTBOX (D-3's row discriminant, D-4's groups) ──────────────────
//
// WHY HERE AND NOT ONLY IN jsdom. The branching logic is unit-tested next door; what these cases
// add is the REAL ENGINE and the REAL production path: the file rows come from the closures
// `appShell.installWatchForFile` actually provisions over a real folder source (2.2), not from a
// hand-written fake, and the ARIA structure is asserted in the two engines that will compute the
// accessibility tree from it — `role="group"` owned by `role="listbox"` is a claim about how a real
// engine reads the markup, and Firefox and Chromium are the two that have to agree.

/** A STRUCTURAL fingerprint — tag + ARIA role + depth, no text, no data attributes. Deliberately a
 *  printed tree: the non-regression below reds by NAMING the node that appeared (`div[role=group]`)
 *  rather than by a count that says only that something changed. (The same shape probe exists in the
 *  unit suite; it is duplicated rather than shared because a five-line test helper is cheaper to
 *  read twice than to import across the jsdom/browser project boundary.) */
function shapeOf(el: Element, depth = 0): string {
  const line = `${'  '.repeat(depth)}${el.tagName.toLowerCase()}[role=${el.getAttribute('role') ?? '-'}]`;
  return [line, ...[...el.children].map((c) => shapeOf(c, depth + 1))].join('\n');
}

/** What 006 ships, written out: ONE snapshot row, sitting DIRECTLY in the listbox. (One row, not
 *  two, because `seedSnapshot()` seeds one — this is the picker the cases above all drive.) */
const SNAPSHOT_ONLY_SHAPE = [
  'div[role=listbox]',
  '  button[role=option]',
  '    span[role=-]',
  '    span[role=-]',
].join('\n');

const SIBLINGS: [string, string][] = [
  ['sibling-one.md', '# Sibling one\n\nA different file in the same folder.'],
  ['sibling-two.md', '# Sibling two\n\nAnother one.'],
];

/** Open the picker and hand it back, once it is really open. */
async function openPickerIn(host: HTMLElement): Promise<HTMLElement> {
  pillIn(host)!.click();
  return waitFor(() => (pickerIn(host)!.hidden ? null : pickerIn(host)));
}

describe('the picker carries TWO KINDS — one listbox, two groups (D-3, D-4)', () => {
  it('BOTH kinds → ONE listbox, TWO labelled groups, each row carrying its own kind', async () => {
    const host = await mountAppPage(docV2(), SIBLINGS);
    await seedSnapshot();
    const picker = await openPickerIn(host);

    // ONE listbox. The groups are its DIRECT children — the ARIA ownership D-4 rests on, asserted
    // as a parent identity in a real engine rather than as a `contains`.
    expect(shadowOf(host).querySelectorAll('[role="listbox"]')).toHaveLength(1);
    const groups = [...picker!.querySelectorAll<HTMLElement>('[role="group"]')];
    expect(groups).toHaveLength(2);
    for (const g of groups) expect(g.parentNode).toBe(picker);
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'Snapshots of this document',
      'Other files in this folder',
    ]);

    // THE DISCRIMINANT, on the rows the PRODUCTION closures produced: the snapshot the app page
    // captured, and the two siblings `fetchFiles` offered (the open `doc.md` excluded by 2.2).
    const rows = [...picker!.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(rows.map((r) => r.dataset.targetKind)).toEqual(['snapshot', 'file', 'file']);
    expect(rows.filter((r) => r.dataset.targetKind === 'file').map((r) => r.dataset.filePath)).toEqual([
      'sibling-one.md',
      'sibling-two.md',
    ]);
    expect([...groups[0].children].map((r) => (r as HTMLElement).dataset.targetKind)).toEqual(['snapshot']);
    expect([...groups[1].children].map((r) => (r as HTMLElement).dataset.targetKind)).toEqual(['file', 'file']);

    // A file row NAMES the file and SAYS IT IS A FILE, in text — never inferred from which group it
    // landed in, and readable with the row alone (§5).
    const fileRow = rows.find((r) => r.dataset.targetKind === 'file')!;
    expect(fileRow.textContent).toContain('sibling-one.md');
    expect(fileRow.textContent).toContain('File');
    expect(fileRow.getAttribute('aria-label')).toBe('Compare with the file sibling-one.md');

    // Grouping is the ARIA answer to "one list, two kinds", and it adds NO control: §3.2 rejected a
    // second pill and divergence 1 rejected the modal — both still hold with two kinds in the list.
    const shadow = shadowOf(host);
    expect(shadow.querySelector('[role="dialog"]')).toBeNull();
    expect(shadow.querySelector('[role="menu"]')).toBeNull();
    expect(shadow.querySelector('[aria-modal]')).toBeNull();
    expect(shadow.querySelectorAll(`.${DIFF_AFFORDANCE_CLASS}`)).toHaveLength(1);

    // The picker's own label widened with it: a listbox that still said "snapshots" would misname
    // its contents for exactly the users who cannot see the two groups.
    const label = picker!.getAttribute('aria-label')!;
    expect(label).toMatch(/snapshot/i);
    expect(label).toMatch(/file/i);
  });

  it('★ ONE KIND → the picker is STRUCTURALLY what 006 ships: no groups at all', async () => {
    // THE NON-REGRESSION. The single-file folder is the source every case above this line drives,
    // so if the two-group scaffolding leaked into the snapshot-only path they would all keep
    // passing while the DOM an AT user meets had changed underneath them. Pinned as a printed
    // shape: a build that always groups reds here NAMING the `div[role=group]` that appeared.
    const host = await mountAppPage(); // no siblings → fetchFiles returns []
    await seedSnapshot();
    const picker = await openPickerIn(host);

    expect(shapeOf(picker!)).toBe(SNAPSHOT_ONLY_SHAPE);
    expect(picker!.querySelectorAll('[role="group"]')).toHaveLength(0);
    // ...and it is really the production path that produced it: the context has the D-3 pair, it
    // simply has no other file to offer. (Without this the case could pass on a surface where
    // `fetchFiles` was never provisioned at all — a different single-kind state.)
    expect(getDiffContext()!.fetchFiles).toBeTypeOf('function');
    expect(await getDiffContext()!.fetchFiles!()).toEqual([]);
  });

  it('★ ...and the shape probe DISCRIMINATES — the both-kinds picker is a different tree', async () => {
    // The control for the case above: without it, `shapeOf` could be blind to grouping and the
    // non-regression would pass by measuring nothing.
    const host = await mountAppPage(docV2(), SIBLINGS);
    await seedSnapshot();
    const grouped = shapeOf((await openPickerIn(host))!);
    expect(grouped).not.toBe(SNAPSHOT_ONLY_SHAPE);
    expect(grouped).toContain('div[role=group]');
  });

  it('FILES ONLY (no snapshots) is single-kind too — flat file rows, no lone group', async () => {
    const host = await mountAppPage(docV2(), SIBLINGS); // no seedSnapshot — the store is wiped
    const picker = await openPickerIn(host);
    expect(picker!.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect([...picker!.children].map((c) => c.getAttribute('role'))).toEqual(['option', 'option']);
    // The document is untouched behind it — this is a picker, not a diff (2.5 wires the gesture).
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
  });
});

// ── TASK 2.4: THE TWO HALF-EMPTY STATES, AND THE LANE THAT MAKES THEM POSSIBLE ─────────────────
//
// WHY THIS IS A GEOMETRY SUITE AND NOT ONLY A COPY ONE. D-4 puts every empty state in the existing
// `role="status"` line, and for the HALF-empty states that means the picker LISTS one kind while
// the status SPEAKS the other — both open at once. But `readerCss.ts` parked them in ONE slot, and
// said so (`:421-428`: "safe because the two are mutually exclusive by construction"). The 2.4
// probe measured what that costs on the real surface: the status painted OVER the list, and
// `elementFromPoint` over a row returned `peekover-diff-status`. So the copy is only half the task;
// the other half is a lane, and a lane is a claim about LAYOUT that only a real engine can settle.
//
// ★ HIT-TEST, NOT RECTS. Two boxes can have non-intersecting rects and still deliver a click to the
// wrong one (transforms, z-index, a scrolled container). The defect this task fixes was found by
// hit-testing and is closed by hit-testing: for every row the picker offers, the element the engine
// hands a click at that row's centre must BE that row.

/** What the engine would deliver a click to at `el`'s centre, inside `host`'s shadow tree. */
function hitTestCentre(host: HTMLElement, el: HTMLElement): Element | null {
  const r = el.getBoundingClientRect();
  return shadowOf(host).elementFromPoint(
    Math.round(r.left + r.width / 2),
    Math.round(r.top + r.height / 2),
  );
}

/** The row a hit landed in — `elementFromPoint` legitimately returns a row's own `<span>`, and a
 *  span INSIDE the row is a hit ON the row. Anything else (notably the status line) is not. */
function rowHitAt(host: HTMLElement, row: HTMLElement): Element | null {
  const hit = hitTestCentre(host, row);
  return hit && row.contains(hit) ? row : hit;
}

/**
 * The whole no-overlap claim, asserted the same way at both widths and in both half-empty states.
 *
 * ★ THE CAP IS THE POINT. The second assertion compares the status's top against the picker's
 * `max-height` — its CAP — not against its CURRENT height. The picker is 44px tall with one row and
 * up to the token with a full retention window, and CSS cannot read a sibling's rendered height; a
 * lane that only cleared TODAY's row count would overlap the moment a second snapshot existed. So
 * what is pinned is that the lane clears the tallest picker the token permits, which is a property
 * of the derivation rather than of this fixture's content.
 */
function expectLaneClears(host: HTMLElement, label: string): void {
  const picker = pickerIn(host)!;
  const status = statusIn(host)!;
  expect(picker.hidden, `${label}: the picker must be OPEN — this is a half-empty state`).toBe(false);
  expect(status.hidden, `${label}: the status must be SPEAKING the empty half`).toBe(false);

  // ★ THE HIT-TEST IS FIRST, AND THE ORDER IS DELIBERATE. It is the instrument that FOUND the
  // defect, so it is the one that must be seen to close it: with the lane removed this is what
  // reds, naming `p.peekover-diff-status` as the element the engine would hand the click to. Put
  // the cheaper rect check first and it fires instead, and the suite never demonstrates that its
  // primary instrument still works.
  const rows = [...picker.querySelectorAll<HTMLElement>('[role="option"]')];
  expect(rows.length, `${label}: there must be rows to be covered`).toBeGreaterThan(0);
  for (const row of rows) {
    const hit = rowHitAt(host, row);
    expect(
      hit,
      `${label}: hit-test at a row's centre returned ` +
        `${hit ? `${hit.tagName.toLowerCase()}.${hit.className}` : 'null'} — the row must receive its own click`,
    ).toBe(row);
  }

  const pickerRect = picker.getBoundingClientRect();
  const statusRect = status.getBoundingClientRect();
  expectNoOverlap(`${label} status`, statusRect, 'picker', pickerRect);

  const cap = parseFloat(getComputedStyle(picker).maxHeight);
  expect(Number.isFinite(cap) && cap > 0, `${label}: the picker's max-height cap must resolve`).toBe(true);
  expect(
    statusRect.top >= pickerRect.top + cap,
    `${label}: status top ${Math.round(statusRect.top)} must clear the picker's CAP ` +
      `${Math.round(pickerRect.top + cap)} (top ${Math.round(pickerRect.top)} + cap ${Math.round(cap)}), ` +
      'so the lane holds at every height the picker can reach — not just at this row count',
  ).toBe(true);
}

describe('the HALF-EMPTY states: one kind listed, the other SAID — in a measured lane (2.4, D-4)', () => {
  describe.each(GEOMETRY_WIDTHS)('at %s', (_label, size) => {
    it('SNAPSHOTS but no other markdown: the list stays clickable under the sentence', async () => {
      await page.viewport(size.width, size.height);
      const host = await mountAppPage(); // single-file folder → fetchFiles returns []
      await seedSnapshot();
      await openPickerIn(host);
      await waitFor(() => statusIn(host)!.hidden === false);

      // NAMED IN TEXT (§5) — the state is readable as a sentence, never carried by an absence.
      expect(statusIn(host)!.textContent).toContain('No other markdown file in this folder');
      expectLaneClears(host, `no-other-files @${_label}`);
      // ...and NOT by a fake row: the sentence is the empty state, so the list holds only real
      // targets and no group wraps a kind that has none.
      expect(pickerIn(host)!.querySelectorAll('[role="option"]')).toHaveLength(1);
      expect(pickerIn(host)!.querySelectorAll('[role="group"]')).toHaveLength(0);
      expect(pickerIn(host)!.querySelectorAll('[disabled],[aria-disabled="true"]')).toHaveLength(0);
      // The document is untouched behind all of it (§3.8).
      expect(host.hasAttribute('data-diff')).toBe(false);
      expect(isHidden(readerIn(host))).toBe(false);
    });

    it('FILES but no snapshots: the same, with the other kind listed', async () => {
      await page.viewport(size.width, size.height);
      const host = await mountAppPage(docV2(), SIBLINGS); // no seedSnapshot — the store is wiped
      await openPickerIn(host);
      await waitFor(() => statusIn(host)!.hidden === false);

      expect(statusIn(host)!.textContent).toContain('No snapshots yet');
      expectLaneClears(host, `no-snapshots @${_label}`);
      expect(pickerIn(host)!.querySelectorAll('[role="option"]')).toHaveLength(2);
      expect(pickerIn(host)!.querySelectorAll('[role="group"]')).toHaveLength(0);
      expect(pickerIn(host)!.querySelectorAll('[disabled],[aria-disabled="true"]')).toHaveLength(0);
      expect(host.hasAttribute('data-diff')).toBe(false);
      expect(isHidden(readerIn(host))).toBe(false);
    });

    it('★ BOTH-EMPTY is UNCHANGED: the picker closes and the status keeps its ORIGINAL slot', async () => {
      // The lane is `.peekover-diff-picker:not([hidden]) ~ …`, so a closed picker means the rule
      // does not match and 006's shipped branch is untouched — asserted as the resolved `top`
      // rather than as an absence, because "the lane did not apply" is exactly what a resolved
      // 50px says and an absence does not. A lane that leaked onto this path reds HERE.
      await page.viewport(size.width, size.height);
      const host = await mountAppPage(); // no snapshots, no siblings
      pillIn(host)!.click();
      await waitFor(() => statusIn(host)!.hidden === false);

      expect(pickerIn(host)!.hidden).toBe(true); // closePicker() — today's shipped behaviour
      expect(statusIn(host)!.textContent).toContain('No snapshots yet');
      expect(getComputedStyle(statusIn(host)!).top).toBe('50px'); // CONTAINED_CSS's original slot
      expect(host.hasAttribute('data-diff')).toBe(false);
      expect(readerIn(host).querySelector('h1')).not.toBeNull();
    });

    it('the OPEN picker itself is still where 6.2 put it — the lane moved the STATUS only', async () => {
      // The control for the three above: if the lane had been implemented by moving the PICKER
      // instead, they would all pass while 6.2's measured placement had silently changed.
      await page.viewport(size.width, size.height);
      const host = await mountAppPage(docV2(), SIBLINGS);
      await seedSnapshot();
      const picker = await openPickerIn(host);
      expect(getComputedStyle(picker!).top).toBe('50px');
    });
  });

  it('the status line KEEPS its "out of the a11y tree while empty" property (re-asserted, not assumed)', async () => {
    // The class of assertion M6 lost in transcription, and 2.4 moves this element — so it is
    // re-proven here rather than inherited from the case above this block.
    const host = await mountAppPage();
    await seedSnapshot();
    const status = statusIn(host)!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden).toBe(true);
    expect(isHidden(status)).toBe(true); // and really unrendered, not merely transparent
    await openPickerIn(host);
    await waitFor(() => status.hidden === false);
    expect(status.textContent!.length).toBeGreaterThan(0);
  });
});

// ── TASK 2.5: THE PICKER BECOMES A FEATURE — ONE BRANCH, AND A CAPTION ON ONE SIDE OF IT ───────
//
// WHY THESE ARE REAL-ENGINE CASES. The branch itself is unit-provable and is proven next door; what
// only a real engine can settle is everything the branch is FOR:
//   • the file's text reaches the REAL `computeDiff` and the REAL `enterDiff` through the closures
//     `appShell.installWatchForFile` actually provisions over a real folder source — so the added
//     and removed blocks below are the engine's own output, and the caption can be checked AGAINST
//     them rather than against itself;
//   • §4's "restores the document and the reading place" is an attribute flip over a column that
//     was never re-mounted (006 D-15) — node identity through a CSS-driven hide/show, and jsdom
//     applies no cascade;
//   • §4's "does not carry a comparison across" a document switch runs through the app page's real
//     select → render path;
//   • §4's content-script clause is an ABSENCE, and an absence is only evidence beside a control
//     that fires — so the app page's file rows are built in the SAME test, from the same run.

/** The other file's own text — deliberately sharing NO line with `docV2()`, so the real engine must
 *  produce both an added and a removed block, and each block's provenance is unambiguous. */
const OTHER_FILE_TEXT = '# Sibling one\n\nA line that exists ONLY in the other file.';
const READABLE_SIBLING: [string, string | null][] = [['sibling-one.md', OTHER_FILE_TEXT]];
/** The §3.8 fixture: a folder whose other markdown REJECTS on `read()`. */
const UNREADABLE_SIBLING: [string, string | null][] = [['sibling-one.md', null]];

const fileRowIn = (host: HTMLElement) =>
  pickerIn(host)!.querySelector<HTMLButtonElement>('[data-target-kind="file"]')!;
const snapshotRowIn = (host: HTMLElement) =>
  pickerIn(host)!.querySelector<HTMLButtonElement>('[data-target-kind="snapshot"]')!;

/** Open the picker and pick the other file, settling once the gesture has produced its answer —
 *  either a diff or a sentence, never a hang. */
async function compareWithTheFile(host: HTMLElement): Promise<void> {
  await openPickerIn(host);
  fileRowIn(host).click();
  await waitFor(() => host.getAttribute('data-diff') === 'active' || statusIn(host)!.hidden === false);
}

describe('2.5 — the file row is a GESTURE: one branch, the real engine, both sides named (D-5)', () => {
  it('★ picks another FILE and enters the diff — the picked file is "before", the document is "after"', async () => {
    const host = await mountAppPage(docV2(), READABLE_SIBLING); // no snapshot: files-only, flat rows
    await compareWithTheFile(host);

    // The SAME inline diff a snapshot comparison uses (§4), reached through the SAME closures.
    expect(host.getAttribute('data-diff')).toBe('active');
    expect(isHidden(readerIn(host))).toBe(true);
    const diff = diffIn(host)!;
    expect(diff).not.toBeNull();

    // ★ THE DIRECTION, MEASURED OFF THE ENGINE'S OWN OUTPUT rather than off the copy. `before` is
    // the picked file and `after` is what is on screen (§9-5, current-vs-picked), so the REMOVED
    // block is the other file's and the ADDED block is this document's. Swap the two arguments and
    // this pair reds naming both blocks — the caption alone could not tell.
    // (Read over ALL blocks of each kind: the engine emits one hunk per contiguous run, so the
    // other file's two lines land in two removed blocks, not one.)
    const textOf = (kind: string) =>
      [...diff.querySelectorAll(`.diff-${kind}`)].map((b) => b.textContent).join('\n');
    expect(textOf('removed')).toContain('ONLY in the other file');
    expect(textOf('removed')).toContain('Sibling one');
    expect(textOf('added')).toContain('NEW in version two');
    expect(textOf('added')).not.toContain('ONLY in the other file');
  });

  it('★ THE CAPTION NAMES BOTH SIDES, in text, and says which side is which (D-5, §4, §5)', async () => {
    const host = await mountAppPage(docV2(), READABLE_SIBLING);
    await compareWithTheFile(host);

    const status = statusIn(host)!;
    expect(status.hidden).toBe(false);
    const caption = status.textContent!;
    // BOTH sides, by name. A one-side caption ("Comparing with sibling-one.md") reds on the first
    // of these; a caption naming only the document reds on the second.
    expect(caption).toContain('doc.md'); // the document on screen
    expect(caption).toContain('sibling-one.md'); // the file that was picked
    // ★ AND THE DIRECTION IS IN THE TEXT — never left to position or colour (§5). The clause is
    // asserted against the same provenance the engine produced above, so a caption that named both
    // sides the wrong way round reds here rather than reading plausibly.
    expect(caption).toContain("removed lines are sibling-one.md's");
    expect(caption).toContain("added lines are doc.md's");
    // It is the line that ALREADY EXISTS (D-5), not a new element: one status region, still polite.
    expect(status.getAttribute('role')).toBe('status');
    expect(shadowOf(host).querySelectorAll(`.${DIFF_STATUS_CLASS}`)).toHaveLength(1);
  });

  it('★ A SNAPSHOT diff is UNCHANGED — no caption, an empty status, out of the a11y tree (Q1)', async () => {
    // GATE-2 RULING Q1, verbatim: "leave snapshot diffs VERBATIM". The caption is ADDITIVE — it
    // exists on one side of one branch — and this is the assertion that says so on the real
    // surface. A build that captioned both kinds reds here, naming the sentence it added.
    const host = await mountAppPage(docV2(), READABLE_SIBLING);
    await seedSnapshot();
    await openPickerIn(host);
    snapshotRowIn(host).click();
    await waitFor(() => host.getAttribute('data-diff') === 'active');

    expect(diffIn(host)!.textContent).toContain('OLD in version one'); // the diff really ran
    const status = statusIn(host)!;
    expect(status.hidden).toBe(true);
    expect(status.textContent).toBe('');
    expect(isHidden(status)).toBe(true); // really unrendered, not merely transparent
  });

  it('★ LEAVING a file-vs-file diff restores the document EXACTLY as leaving a snapshot one does', async () => {
    // §4's clause, asserted as the property 006 D-15 makes true: an ATTRIBUTE FLIP over an UNTOUCHED
    // column. Node identity is what distinguishes that from a re-render that happens to look the
    // same — a build that re-mounted the reader on exit would satisfy every visible assertion and
    // fail these two, which is why they are here rather than a `querySelector('h1') != null`.
    const host = await mountAppPage(docV2(), READABLE_SIBLING);
    await seedSnapshot();

    const column = readerIn(host);
    const h1 = column.querySelector('h1')!;

    /** Enter through `pick`'s row, leave through the pill, and report what the round trip left. */
    async function roundTrip(pick: (h: HTMLElement) => HTMLButtonElement): Promise<{
      sameColumn: boolean;
      sameH1: boolean;
      diffAttr: boolean;
      diffNode: boolean;
      columnHidden: boolean;
      statusHidden: boolean;
      pill: string | null;
    }> {
      await openPickerIn(host);
      pick(host).click();
      await waitFor(() => host.getAttribute('data-diff') === 'active');
      pillIn(host)!.click();
      await waitFor(() => !host.hasAttribute('data-diff'));
      return {
        sameColumn: readerIn(host) === column,
        sameH1: readerIn(host).querySelector('h1') === h1,
        diffAttr: host.hasAttribute('data-diff'),
        diffNode: diffIn(host) !== null,
        columnHidden: isHidden(readerIn(host)),
        statusHidden: statusIn(host)!.hidden,
        pill: pillIn(host)!.textContent,
      };
    }

    const afterFile = await roundTrip(fileRowIn);
    const afterSnapshot = await roundTrip(snapshotRowIn);

    // ★ "EXACTLY AS" IS MEASURED, NOT ASSERTED TWICE: the two round trips must leave the SAME
    // state, and that state must be the restored one. Either half alone would pass over a pair of
    // exits that agreed on being wrong.
    expect(afterFile).toEqual(afterSnapshot);
    expect(afterFile).toEqual({
      sameColumn: true, // never a re-mount — the same element, unhidden
      sameH1: true,
      diffAttr: false,
      diffNode: false,
      columnHidden: false,
      statusHidden: true, // ★ and the CAPTION went with the diff (`showCompare`'s say(null))
      pill: 'Compare',
    });
  });

  it('★ SWITCHING DOCUMENTS does not carry a comparison across (§4)', async () => {
    // The signature of the defect this guards is a NEW document rendering INSIDE a stale diff: the
    // column hidden by a `data-diff` nobody cleared, with the previous document's hunks on screen.
    // So the assertions are about the new document's own render, not merely about the attribute.
    const host = await mountAppPage(docV2(), READABLE_SIBLING);
    await compareWithTheFile(host);
    expect(host.getAttribute('data-diff')).toBe('active'); // non-vacuous: a diff really is open

    const container = containers[containers.length - 1];
    const rows = [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')];
    expect(rows).toHaveLength(2);
    rows[1].click(); // the OTHER file, opened as a document in its own right

    const next = await waitFor(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    await waitFor(
      () => next.shadowRoot?.querySelector('.peekover-reader h1')?.textContent === 'Sibling one',
    );

    expect(next.hasAttribute('data-diff')).toBe(false);
    expect(diffIn(next)).toBeNull();
    expect(isHidden(readerIn(next))).toBe(false);
    // ...and the affordance came back offering, not stuck mid-comparison.
    expect(pillIn(next)!.textContent).toBe('Compare');
    expect(statusIn(next)!.hidden).toBe(true);
  });

  it('★ AN UNREADABLE other file SAYS SO beside the untouched document, and never enters (§3.8)', async () => {
    // REVERT-AND-FAIL, not enter-then-fail. The signature of the wrong shape is a BLANKED COLUMN
    // behind an error: `data-diff` set, the reader hidden, and a sentence over the top of it. Every
    // assertion below is chosen to red on that shape rather than only on the message.
    const host = await mountAppPage(docV2(), UNREADABLE_SIBLING);
    await compareWithTheFile(host);

    const status = statusIn(host)!;
    expect(status.hidden).toBe(false);
    expect(status.textContent).toContain('sibling-one.md'); // it names the file it could not read…
    expect(status.textContent).not.toContain('snapshot'); // …and not a thing the user did not pick
    // The document is EXACTLY where it was: no attribute, no diff node, nothing hidden.
    expect(host.hasAttribute('data-diff')).toBe(false);
    expect(diffIn(host)).toBeNull();
    expect(isHidden(readerIn(host))).toBe(false);
    expect(readerIn(host).querySelector('h1')).not.toBeNull();
    expect(pillIn(host)!.textContent).toBe('Compare'); // still offering, not stuck in exit
  });

  it('★ NO file comparison on the CONTENT-SCRIPT reader — with the app page as the control that fires', async () => {
    // §4's last compare clause. An absence nothing could have produced discriminates nothing, so
    // the control is not a different run or a different fixture: the SAME test, immediately after,
    // builds file rows on the surface that is supposed to have them.
    const cs = mountContentScript();
    await flush();
    expect(isDiffContextRegistered()).toBe(false); // the architectural fact underneath the absence
    expect(pillIn(cs)).toBeNull();
    expect(pickerIn(cs)).toBeNull();
    expect(shadowOf(cs).querySelector('[data-target-kind]')).toBeNull();
    expect(shadowOf(cs).querySelector('[data-target-kind="file"]')).toBeNull();

    // ★ THE CONTROL, IN THE SAME RUN: the app page, same document, offers exactly what the content
    // script does not — and the same selector that read `null` above reads a real row here.
    const app = await mountAppPage(docV2(), READABLE_SIBLING);
    await openPickerIn(app);
    expect(shadowOf(app).querySelector('[data-target-kind="file"]')).not.toBeNull();
    expect(fileRowIn(app).dataset.filePath).toBe('sibling-one.md');
    // ...and it really is a gesture there, so what the content script lacks is a working feature.
    fileRowIn(app).click();
    await waitFor(() => app.getAttribute('data-diff') === 'active');
    expect(statusIn(app)!.textContent).toContain('sibling-one.md');
    expect(cs.hasAttribute('data-diff')).toBe(false); // and none of it reached the other surface
  });
});
