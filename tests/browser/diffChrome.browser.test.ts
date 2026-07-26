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
 *  watchable, so `installWatchForFile` reaches its `registerDiffContext` site (2.1's note). */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: name, name, read: async () => text }],
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
async function mountAppPage(doc = docV2()): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc) }),
    store: fakeStore(),
  });
  await app.openFolder();
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
