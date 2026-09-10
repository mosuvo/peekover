// Watch continuity — the REAL-ENGINE proofs for spec 005 group 3 (tasks 3.1 + 3.2).
//
// WHY THIS IS NOT A jsdom SUITE. Everything under test here is layout: which element actually
// scrolls (a COMPUTED overflow question), where a heading's top sits relative to a scroll box
// (`getBoundingClientRect`, all-zero in jsdom), and whether a restore lands the reader back at
// the same visual place after the document changed underneath it. jsdom can see none of it.
// The pure selection/fallback ladder IS unit-tested, in src/render/readingAnchor.test.ts —
// that split is deliberate, not duplication.
//
// ── TASK 3.1 — resolveScrollContainer, extracted and pinned ────────────────────────────────
//
// The extraction is a PURE MOVE, so its real proof is that `tocScroll.browser.test.ts` stays
// green UNCHANGED (it exercises the scroll-spy that consumes this function on both surfaces).
// What this file adds is the regression pin 003's in-code trap asked for and never had: the
// resolved ELEMENT IDENTITY per surface. Asserting "something scrollable came back" would pass
// against the exact bug the trap describes — a wrong root does not throw, it silently observes
// the viewport and tracks nothing. So both assertions here are `toBe`, against the element the
// surface is known to scroll: `:host` full-page, `.peekover-app__reader` when contained.
//
// ── TASK 3.2 — the reading anchor ──────────────────────────────────────────────────────────
//
// NON-VACUITY, and it is the entire point of the task: content is INSERTED ABOVE the reading
// position, which is the case a naive `scrollTop` restore gets wrong. The anchor assertion is
// paired with a MEASURED naive-restore control in the SAME fixture — we restore the captured
// raw `scrollTop` onto the changed document, measure where that actually lands the heading, and
// assert the anchor landed somewhere DIFFERENT (and correct). Without that control the test
// would pass on any fixture where the anchor happens to agree with the fallback and would prove
// nothing (retro 2026-07-19, finding 1 — the vacuous-persistence-test class).

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { resolveScrollContainer } from '../../src/render/scrollContainer';
import { captureReadingAnchor, restoreReadingAnchor } from '../../src/render/readingAnchor';
import { buildTocModel } from '../../src/render/tocModel';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────

const FILLER = Array.from(
  { length: 24 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');

const SECTIONS = 8;

/** The base document: 8 well-separated h2 sections, each taller than the harness viewport. */
function buildDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SECTIONS; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/**
 * The SAME document with a whole new section INSERTED ABOVE everything — exactly what an agent
 * rewriting a file does, and the case D-3 exists for. Every original heading keeps its text and
 * its relative order but moves DOWN the document by one section's height, so a raw `scrollTop`
 * restore lands the reader a full section short of where they were.
 */
function buildDocWithInsertionAbove(): string {
  return ['## Inserted Section', FILLER, buildDoc()].join('\n\n');
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/**
 * Wait until the scroll box overflows AND its content height has STOPPED CHANGING.
 *
 * WHY THE SECOND HALF IS LOAD-BEARING, measured rather than assumed: waiting only for overflow
 * returns while the reader is still restyling. On the full-page surface `scrollHeight` was
 * measured at **81798 px** at first overflow and **26069 px** once the reader stylesheet had
 * settled — a 3× reflow. A heading offset read in that window is stale by tens of thousands of
 * pixels, and the subsequent `scrollTop` write CLAMPS to the (now much smaller) maximum, silently
 * parking the test at the document bottom. That is not a flake: it made the anchor capture pick
 * the LAST heading every time, on both engines. Stability, not mere overflow, is the real
 * precondition for any geometry assertion in this file.
 */
// ★ 8 consecutive stable reads, not 3 (AGENTS.md #9 — widened this session): the 3-read/60ms
// window above was measured against an isolated run of this file; running alongside another
// browser test file adds enough CPU/layout contention that the SAME reflow this header already
// names can outlast 60ms, and this session caught it doing exactly that (`readingAt`/`offsetAfter`
// reading a stale 0 only when a second file shared the run, never in isolation). Widening the
// window changes nothing about what is asserted — only how long this waits for the geometry it
// measures to actually be final.
async function waitForScrollable(scroller: HTMLElement): Promise<void> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 400; i += 1) {
    const h = scroller.scrollHeight;
    if (h > scroller.clientHeight + 4 && h === prev) {
      stable += 1;
      if (stable >= 8) return;
    } else {
      stable = 0;
    }
    prev = h;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('scroll box never settled (content did not overflow, or kept reflowing)');
}

/** Poll `scrollTop` until it stops changing (the full-page :host scrolls smoothly). Same
 *  8-consecutive-stable-read widening as `waitForScrollable` above, same reason. */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 300; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 8) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return scroller.scrollTop;
}

/** Vertical offset of an element's top relative to the scroll box's top — the number that says
 *  "the reader is looking at the same place", independent of absolute scroll pixels. */
function topOffset(el: Element, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

/** The rendered reader root inside a host's shadow — what buildTocModel reads. */
function readerRoot(host: HTMLElement): HTMLElement {
  return host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
}

/** Find a heading by its exact text in the live reader. */
function headingByText(host: HTMLElement, text: string): Element {
  return [...host.shadowRoot!.querySelectorAll('.peekover-reader h2')].find(
    (h) => (h.textContent ?? '').trim() === text,
  )!;
}

// ── Surface 1: the full-page content-script takeover (:host is the scroll box) ───────────────

const fullPageHosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
});

/** A mounted surface, described uniformly so every property below is asserted on BOTH via
 *  describe.each — the structural close 6.1 used, one parameterised suite rather than two
 *  hand-written ones that drift. */
interface Surface {
  /** The shadow host mount() renders into. */
  host: HTMLElement;
  /** The element that ACTUALLY scrolls on this surface — the identity 3.1 must resolve to. */
  expectedScroller: HTMLElement;
  /** Whether this surface passes `{contained: true}` to mount(). */
  contained: boolean;
  /** Re-render `text` into the same host, the way watch mode will. */
  remount(text: string): void;
}

function mountFullPage(doc: string = buildDoc()): Surface {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  return {
    host,
    expectedScroller: host,
    contained: false,
    remount: (text) => mount(text, host),
  };
}

// ── Surface 2: the contained app-page reader pane (.peekover-app__reader is the scroll box) ──

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

async function mountContained(doc: string = buildDoc()): Promise<Surface> {
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
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));
  const pane = container.querySelector<HTMLElement>('.peekover-app__reader')!;
  return {
    host,
    expectedScroller: pane,
    contained: true,
    // The contained surface re-renders through the SAME mount() seam readerPane uses.
    remount: (text) => mount(text, host, { contained: true }),
  };
}

const SURFACES: { name: string; mount: (doc?: string) => Promise<Surface> }[] = [
  { name: 'full-page', mount: async (doc) => mountFullPage(doc) },
  { name: 'contained', mount: (doc) => mountContained(doc) },
];

// ── Task 3.1 — the extracted resolver, pinned by ELEMENT IDENTITY ───────────────────────────

describe.each(SURFACES)(
  'resolveScrollContainer — $name surface (task 3.1, the 003 trap pinned)',
  ({ mount: mountSurface }) => {
    it('resolves the EXACT element that scrolls on this surface (identity, not "something scrollable")', async () => {
      const s = await mountSurface();
      await waitForScrollable(s.expectedScroller);

      const resolved = resolveScrollContainer(s.host, s.contained);

      // IDENTITY, per 003's trap: `:host` full-page, the ancestor pane when contained. A
      // resolver that returned the host on BOTH surfaces passes any "is it scrollable" check
      // (the contained :host has overflow:auto from the base sheet) and fails this.
      expect(resolved).toBe(s.expectedScroller);

      // ...and the element it named is genuinely the one that moves, so the identity above is
      // anchored to observed behaviour rather than to our own expectation of the DOM shape.
      resolved.scrollTop = 300;
      expect(await settle(resolved)).toBeGreaterThan(0);
      resolved.scrollTop = 0;
      await settle(resolved);
    });
  },
);

describe('resolveScrollContainer — the degenerate fallback (task 3.1)', () => {
  it('falls back to the host when a contained mount has NO scrolling ancestor', async () => {
    // A host parented outside any scrolling pane. Returning the host keeps the resolved box a
    // valid shadow-including ancestor of the headings, so a consumer degrades rather than throws.
    const orphan = document.createElement('div');
    document.body.appendChild(orphan);
    fullPageHosts.push(orphan);
    const host = document.createElement('div');
    orphan.appendChild(host);
    mount(buildDoc(), host, { contained: true });

    expect(resolveScrollContainer(host, true)).toBe(host);
  });
});

// ── Task 3.2 — the reading anchor, against content INSERTED ABOVE ───────────────────────────

describe.each(SURFACES)(
  'readingAnchor — $name surface (task 3.2, D-3)',
  ({ mount: mountSurface }) => {
    it('restores the SAME heading at the SAME offset when content is inserted ABOVE — where naive scrollTop lands elsewhere', async () => {
      const s = await mountSurface();
      const scroller = s.expectedScroller;
      await waitForScrollable(scroller);

      // Read mid-document, having scrolled PAST a heading: Section 5's top sits 40px ABOVE the
      // scrollport top, so the captured delta is a non-zero 40. A zero delta would let a bug that
      // simply pins the heading to the very top pass unnoticed.
      const target = 'Section 5';
      const before = headingByText(s.host, target);
      scroller.scrollTop = scroller.scrollTop + topOffset(before, scroller) + 40;
      const readingAt = await settle(scroller);
      const offsetBefore = topOffset(before, scroller);
      expect(readingAt).toBeGreaterThan(0); // genuinely mid-document, not at the top

      // CAPTURE — through the production seam, off the live pre-change DOM, reusing the same
      // buildTocModel(root) mount() runs immediately before its commit.
      const anchor = captureReadingAnchor(scroller, buildTocModel(readerRoot(s.host)));
      expect(anchor.text).toBe(target); // the LAST heading at or above the reading position
      expect(anchor.delta).toBeGreaterThan(0); // ...and the reader had genuinely scrolled past it

      // The document changes: a whole section is INSERTED ABOVE everything.
      s.remount(buildDocWithInsertionAbove());
      await waitForScrollable(scroller);

      // ── THE NAIVE CONTROL, MEASURED IN THIS EXACT FIXTURE ──────────────────────────────
      // Restore the captured raw scrollTop (what a scrollTop-based implementation would do) and
      // measure where that actually lands the target heading. This is what makes the anchor
      // assertions below non-vacuous: if the two agreed, the anchor would be proving nothing.
      scroller.scrollTop = anchor.scrollTop;
      await settle(scroller);
      const naiveOffset = topOffset(headingByText(s.host, target), scroller);

      // ...and it IS wrong: the inserted section pushed the target down, so the naive restore
      // leaves it far below where the reader left it. If this ever stops holding, the FIXTURE
      // stopped exercising the case — fix the fixture, never relax the assertion.
      expect(Math.abs(naiveOffset - offsetBefore)).toBeGreaterThan(100);

      // ── THE ANCHOR ────────────────────────────────────────────────────────────────────
      restoreReadingAnchor(scroller, buildTocModel(readerRoot(s.host)), anchor);
      await settle(scroller);
      const offsetAfter = topOffset(headingByText(s.host, target), scroller);

      // Same heading, same offset — the reader's place, not the reader's pixels.
      expect(Math.abs(offsetAfter - offsetBefore)).toBeLessThan(8);
      // ...and demonstrably NOT where the fallback would have put it (the non-vacuity assertion).
      expect(Math.abs(offsetAfter - naiveOffset)).toBeGreaterThan(100);
    });

    it('falls back to raw scrollTop when the new document has NO headings (never a jump to the top)', async () => {
      const s = await mountSurface();
      const scroller = s.expectedScroller;
      await waitForScrollable(scroller);

      scroller.scrollTop = 500;
      const at = await settle(scroller);
      const anchor = captureReadingAnchor(scroller, buildTocModel(readerRoot(s.host)));

      // A heading-free re-render: nothing to match by text or by index.
      s.remount([FILLER, FILLER, FILLER, FILLER].join('\n\n'));
      await waitForScrollable(scroller);
      restoreReadingAnchor(scroller, buildTocModel(readerRoot(s.host)), anchor);
      await settle(scroller);

      expect(Math.abs(scroller.scrollTop - at)).toBeLessThan(8);
    });
  },
);
