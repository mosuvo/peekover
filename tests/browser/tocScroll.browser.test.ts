// TOC click-to-scroll — the REAL-ENGINE proof (task 3.1). jsdom is BLIND to scroll:
// `getBoundingClientRect` is all-zero and `scrollIntoView` is a no-op there, so "the entry
// scrolled to its heading" cannot be asserted in the unit suite — it can only be measured in
// a laid-out engine. This suite drives the real mount() in headless Chromium AND Firefox and
// asserts on MEASURED geometry: activating a TOC entry moves the scroll box so that entry's
// OWN heading is brought to the top of the scrollport (never a re-derived or fixed node).
//
// Two surfaces, ONE mechanism. The scroll target is `entry.headingRef.scrollIntoView(
// {block:'start'})` with NO `behavior` arg, so the reader's `:host{scroll-behavior}` rule
// governs and the top-chrome offset is the CSS `scroll-margin-top` on h1..h6 (2.2) — no JS
// pixel math (plan §3-#2). `scrollIntoView` scrolls whichever ancestor is scrollable, which
// DIFFERS by surface: on the full-page content-script host that is `:host` itself
// (position:fixed; inset:0; overflow:auto); in the contained app-page pane it is
// `.peekover-app__reader` (overflow:auto), while the contained `:host` sits in normal flow.
// The test measures the correct scroll box per surface; the wiring is a single code path.
//
// NON-VACUOUS by construction: each surface clicks TWO different entries and asserts the
// second scrolls FURTHER than the first, brings ITS heading to the top, and pushes the first
// heading ABOVE the top. A handler wired to the wrong/fixed heading fails these. Red-first was
// additionally demonstrated by temporarily wiring the handler to model[0] and observing the
// suite go red on both engines (recorded in progress.md). OBSERVER SANITY mirrors the
// remote-media control-fetch discipline: before any scroll assertion we prove the harness can
// SEE scroll at all (a control `scrollTop` write that is observed), so a zero/failed assertion
// can never pass by the harness being blind.

import { describe, it, expect, afterEach } from 'vitest';
// `commands` is vitest's bridge to the server-side browser commands registered in
// vitest.config.ts; we use it for `emulateReducedMotion` (Playwright `page.emulateMedia`) —
// the one cross-engine way to toggle prefers-reduced-motion (task 3.3). The augmentation
// below types our custom command onto the extensible `BrowserCommands` interface.
import { commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { TOC_MIN_WIDTH, TOC_MAX_WIDTH } from '../../src/render/tocView';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateReducedMotion(value: 'reduce' | 'no-preference' | null): Promise<void>;
  }
}

// A tall multi-heading document: 8 flat h2 sections, each with enough filler that a section is
// taller than a viewport, so headings sit at well-separated offsets and a mid-doc section can
// be scrolled fully to the top (there is >1 viewport of content below it).
const FILLER = Array.from(
  { length: 30 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');
const SECTIONS = 8;
function buildDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SECTIONS; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** Poll `scroller.scrollTop` until it stops changing (smooth scroll animates over several
 *  frames) or we time out, then return the settled offset. Instant scrolls settle on the
 *  first read; this makes the measurement independent of smooth-vs-instant behavior. */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 160; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  return scroller.scrollTop;
}

/** Wait until the scroll box has laid out and its content overflows (so it can actually
 *  scroll). mount() is synchronous but the engine lays out on a later frame, so immediately
 *  after mount `scrollHeight === clientHeight` and a `scrollTop` write clamps to 0 — this
 *  polls until the overflow is real, making the observer-sanity control meaningful. */
async function waitForScrollable(scroller: HTMLElement): Promise<void> {
  for (let i = 0; i < 160; i += 1) {
    if (scroller.scrollHeight > scroller.clientHeight + 4) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('scroll box never became scrollable (content did not overflow)');
}

/** Click a TOC entry and wait for its scroll to finish. `.click()` dispatches exactly the
 *  `click` event that Enter/Space on a focused native <button> produce — so this measures the
 *  same handler keyboard activation routes through (see the keyboard note in the tests). */
async function activate(scroller: HTMLElement, button: HTMLElement): Promise<number> {
  button.click();
  return settle(scroller);
}

/** Vertical offset of an element's top relative to the scroll box's top. After a block:'start'
 *  scroll the target lands just below the scrollport top (scroll-margin-top + any pane padding),
 *  so a small positive value = "brought to the top"; a large positive = "far below"; negative =
 *  "scrolled above the top". */
function topOffset(el: Element, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

/** The shared, surface-agnostic assertions: observer sanity, click-to-scroll, and the
 *  non-vacuous two-entry / wrong-heading guard. Runs identically on both surfaces because the
 *  scroll mechanism is one path — only which element is the scroll box differs. */
async function assertClickScrolls(
  scroller: HTMLElement,
  buttons: HTMLElement[],
  headings: Element[],
): Promise<void> {
  expect(buttons.length).toBe(SECTIONS);
  expect(headings.length).toBe(SECTIONS);

  // Layout is asynchronous after a synchronous mount(); wait until the box actually overflows
  // so the observer-sanity write below is not clamped to 0 by a not-yet-laid-out scrollport.
  await waitForScrollable(scroller);

  // OBSERVER SANITY (control): prove this harness can OBSERVE scroll on this container before we
  // trust any scroll assertion — if a control write does not move it, the container is not the
  // scroll box and every later "scrolled" assertion would be vacuously satisfiable. NOTE the box
  // may have scroll-behavior:smooth (the full-page :host does), so a `scrollTop` write ANIMATES;
  // we settle before reading, then reset to the top and settle again for a clean baseline.
  scroller.scrollTop = 400;
  const observed = await settle(scroller);
  scroller.scrollTop = 0;
  await settle(scroller);
  expect(observed).toBeGreaterThan(0);

  const mid = 2; // Section 3
  const later = 5; // Section 6 — 2 full sections of content remain below it, so it reaches the top

  // Baseline: from the top, the mid heading is far down the document (not already near the top).
  await settle(scroller);
  expect(topOffset(headings[mid], scroller)).toBeGreaterThan(200);

  // Click the mid entry → its heading is brought to the top and the box really scrolled.
  const s1 = await activate(scroller, buttons[mid]);
  expect(s1).toBeGreaterThan(0);
  expect(topOffset(headings[mid], scroller)).toBeGreaterThan(-4); // not above the top
  expect(topOffset(headings[mid], scroller)).toBeLessThan(100); // in the near-top band

  // Click a LATER entry → NON-VACUOUS: it must scroll FURTHER than the mid entry, bring ITS own
  // heading to the top, and push the mid heading ABOVE the top. A handler that scrolled to a
  // fixed/wrong heading (ignoring the button's carried ref) fails all three of these.
  const s2 = await activate(scroller, buttons[later]);
  expect(s2).toBeGreaterThan(s1);
  expect(topOffset(headings[later], scroller)).toBeGreaterThan(-4);
  expect(topOffset(headings[later], scroller)).toBeLessThan(100);
  expect(topOffset(headings[mid], scroller)).toBeLessThan(-4); // mid is now scrolled above the top
}

// ── Surface 1: the full-page content-script host (:host is the scroll box) ──────────────────
const fullPageHosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
});

function mountFullPage(doc: string = buildDoc()): {
  host: HTMLElement;
  buttons: HTMLElement[];
  headings: Element[];
} {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  const shadow = host.shadowRoot!;
  const buttons = [...shadow.querySelectorAll<HTMLElement>('button.peekover-toc__link')];
  const headings = [...shadow.querySelectorAll('.peekover-reader h2')];
  return { host, buttons, headings };
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

async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

async function mountContained(doc: string = buildDoc()): Promise<{
  scroller: HTMLElement;
  buttons: HTMLElement[];
  headings: Element[];
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc) }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = container.querySelector<HTMLButtonElement>(
    '[role="treeitem"][data-kind="file"]',
  );
  fileBtn!.click();

  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));
  const shadow = host.shadowRoot!;
  const scroller = container.querySelector<HTMLElement>('.peekover-app__reader')!;
  const buttons = [...shadow.querySelectorAll<HTMLElement>('button.peekover-toc__link')];
  const headings = [...shadow.querySelectorAll('.peekover-reader h2')];
  return { scroller, buttons, headings };
}

describe('TOC click-to-scroll — real engine, both surfaces (task 3.1)', () => {
  it('full-page host: activating an entry scrolls its heading into view (:host is the scroll box)', async () => {
    const { host, buttons, headings } = mountFullPage();
    // On the full-page surface :host is itself the scroll box (position:fixed; overflow:auto).
    await assertClickScrolls(host, buttons, headings);
  });

  it('contained pane: activating an entry scrolls its heading into view (.peekover-app__reader is the scroll box)', async () => {
    const { scroller, buttons, headings } = await mountContained();
    await assertClickScrolls(scroller, buttons, headings);
  });

  it('keyboard: Enter/Space on a focused entry scrolls too (native <button> → click, same handler)', async () => {
    // A native <button> dispatches a `click` event on Enter and Space; our scroll wiring is on
    // `click`, so keyboard activation routes through the SAME handler with no separate keydown
    // listener (task 3.1 "a <button> gives this for free; don't add a redundant handler"). The
    // browser test harness has no trusted-keystroke primitive here, so we assert the property
    // that guarantees keyboard works: the focused entry, activated via the click event keyboard
    // produces, scrolls to its heading.
    const { host, buttons, headings } = mountFullPage();
    const later = 5;
    await waitForScrollable(host);
    host.scrollTop = 0;
    await settle(host);
    buttons[later].focus();
    const s = await activate(host, buttons[later]);
    expect(s).toBeGreaterThan(0);
    expect(topOffset(headings[later], host)).toBeGreaterThan(-4);
    expect(topOffset(headings[later], host)).toBeLessThan(100);
  });

  it('URL untouched: activating every entry mutates neither location nor history', async () => {
    // The 2.1 carried assertion, now REAL: a handler exists and runs on every click, so this
    // guards actual behavior (in 2.1 it was vacuous — no handler had run). Scrolling by element
    // ref must never touch location/hash or push a history entry (spec In-scope "URL untouched").
    const { host, buttons } = mountFullPage();
    const hrefBefore = location.href;
    const historyBefore = history.length;
    for (const b of buttons) b.click();
    await settle(host);
    expect(location.href).toBe(hrefBefore);
    expect(history.length).toBe(historyBefore);
  });
});

// ── Task 3.2 — scroll-spy: the active entry tracks the section being read ────────────────────
// One IntersectionObserver rooted on the reader's ACTUAL scroll container (resolved per surface,
// NOT assumed to be :host — see tocView.ts) marks the current section with aria-current="location"
// + .is-active. jsdom has neither IntersectionObserver nor layout, so this is a real-engine proof;
// it runs on Chromium AND Firefox, on BOTH surfaces (the per-surface root correctness is the point).

// A spy doc where every section but the LAST is taller than a viewport (well-separated,
// reachable-to-top offsets) and the FINAL section is a single short line — so its heading can
// NEVER reach the activation line at max scroll. That is exactly what forces the trailing-edge
// promotion: without it the highlight would stall on the second-to-last section.
const SPY_SECTIONS = 8;
function buildSpyDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SPY_SECTIONS; i += 1) {
    parts.push(`## Section ${i}`);
    parts.push(i === SPY_SECTIONS ? 'Short trailing section.' : FILLER);
  }
  return parts.join('\n\n');
}

/** Index of the entry currently marked active (aria-current="location"), or -1 if none. */
function activeIndex(links: HTMLElement[]): number {
  return links.findIndex((l) => l.getAttribute('aria-current') === 'location');
}

/** How many entries are marked active — must be exactly 1 whenever the spy has run. */
function activeCount(links: HTMLElement[]): number {
  return links.filter((l) => l.getAttribute('aria-current') === 'location').length;
}

/** Poll until the active index stops changing (the spy updates over a frame or two after a
 *  scroll settles) or we time out, then return it. Waiting for STABILITY — not for an expected
 *  value — keeps the assertion non-vacuous: a wrong-but-stable active index is returned and then
 *  fails the caller's `expect`, rather than being masked by a poll-until-equal. */
async function stableActiveIndex(links: HTMLElement[]): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 160; i += 1) {
    const cur = activeIndex(links);
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  return activeIndex(links);
}

/** Scroll `scroller` so `heading` sits just below the scrollport top (direct scrollTop write —
 *  instant, independent of smooth-vs-instant behavior; `settle` handles either). */
function scrollToHeading(scroller: HTMLElement, heading: Element): void {
  const delta = heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop = scroller.scrollTop + delta - 4;
}

/** Shared, surface-agnostic scroll-spy assertions: observer sanity (non-vacuous: two different
 *  positions → two different actives), tracking at top / mid / bottom, exactly-one-active, and
 *  the trailing-section edge. One code path; only which element is the scroll box differs. */
async function assertSpyTracks(
  scroller: HTMLElement,
  links: HTMLElement[],
  headings: Element[],
): Promise<void> {
  expect(links.length).toBe(SPY_SECTIONS);
  expect(headings.length).toBe(SPY_SECTIONS);
  await waitForScrollable(scroller);

  // Baseline: at the very top, section 1 is the current section.
  scroller.scrollTop = 0;
  await settle(scroller);
  expect(await stableActiveIndex(links)).toBe(0);
  expect(activeCount(links)).toBe(1);

  // OBSERVER SANITY / NON-VACUOUS: two DIFFERENT scroll positions must yield two DIFFERENT active
  // entries. A mis-rooted observer (against the viewport, not this box) or a blind one would never
  // change the active — so a stuck highlight cannot pass here. Section 3:
  scrollToHeading(scroller, headings[2]);
  await settle(scroller);
  const atThree = await stableActiveIndex(links);
  expect(atThree).toBe(2);
  expect(activeCount(links)).toBe(1);

  // A different position (Section 6) → a different active entry (the highlight MOVED).
  scrollToHeading(scroller, headings[5]);
  await settle(scroller);
  const atSix = await stableActiveIndex(links);
  expect(atSix).toBe(5);
  expect(atSix).not.toBe(atThree);
  expect(activeCount(links)).toBe(1);

  // The mark follows the scroll both ways — back to the top → section 1 again.
  scroller.scrollTop = 0;
  await settle(scroller);
  expect(await stableActiveIndex(links)).toBe(0);

  // TRAILING-SECTION EDGE: scroll to the very bottom → the LAST entry is active, even though the
  // short final section's heading never reaches the activation line. Without the trailing-edge
  // promotion the highlight would stall on section 7 (index 6) — this asserts index 7.
  scroller.scrollTop = scroller.scrollHeight;
  await settle(scroller);
  expect(await stableActiveIndex(links)).toBe(SPY_SECTIONS - 1);
  expect(activeCount(links)).toBe(1);
}

describe('TOC scroll-spy — real engine, both surfaces (task 3.2)', () => {
  it('full-page host: the active entry tracks the section being read (:host is the scroll box)', async () => {
    const { host, buttons, headings } = mountFullPage(buildSpyDoc());
    await assertSpyTracks(host, buttons, headings);
  });

  it('contained pane: the active entry tracks the section being read (.peekover-app__reader is the scroll box)', async () => {
    const { scroller, buttons, headings } = await mountContained(buildSpyDoc());
    await assertSpyTracks(scroller, buttons, headings);
  });

  it('composes with 3.1: after click-to-scroll the active mark lands on the clicked section', async () => {
    // Click-to-scroll (3.1) and scroll-spy (3.2) compose: clicking an entry scrolls to it, then
    // the spy updates the active mark to THAT section — not stuck on the previously-read one.
    const { host, buttons, headings } = mountFullPage(buildSpyDoc());
    await waitForScrollable(host);
    host.scrollTop = 0;
    await settle(host);

    buttons[5].click(); // 3.1 scrolls to section 6
    await settle(host);
    expect(await stableActiveIndex(buttons)).toBe(5); // spy caught up to section 6

    buttons[2].click(); // 3.1 scrolls back up to section 3
    await settle(host);
    expect(await stableActiveIndex(buttons)).toBe(2); // spy moved to section 3, not stuck on 6
    expect(topOffset(headings[2], host)).toBeLessThan(100); // 3.1 really brought it to the top
    expect(activeCount(buttons)).toBe(1);
  });
});

// ── Task 3.3 — reduced-motion: instant under prefers-reduced-motion, smooth without ──────────
// The scroll wiring (3.1) calls `scrollIntoView({block:'start'})` with NO `behavior` arg, so the
// scroll box's CSS `scroll-behavior` governs: readerCss.ts sets `:host{scroll-behavior:smooth}`
// and flips it to `auto` under `@media (prefers-reduced-motion:reduce)`. jsdom is blind to both
// media emulation AND scroll animation, so this can only be proven in a real engine — and it must
// hold in Chromium AND Firefox (reduced motion is an accessibility obligation, spec §5), so it
// runs on both. Media is emulated via the `emulateReducedMotion` command (Playwright
// `page.emulateMedia`; vitest.config.ts) — the harness has no in-page emulateMedia and cdp() is
// Chromium-only, so the server-side Playwright command is the only cross-engine route.
//
// DISTINGUISHING INSTANT FROM SMOOTH (the assertion must be able to FAIL): a smooth scroll
// animates the target over many frames; an instant scroll lands in one. Right after triggering a
// TOC-entry scroll we sample scrollTop on each of the next several frames, BEFORE it could have
// finished animating:
//   • instant/reduce → already AT the target (within a px) on the first post-trigger frame, and
//     never observed partway;
//   • smooth/default → still STRICTLY between start (0) and target on an early frame, reaching the
//     target only later.
// The two signatures are mutually exclusive, so asserting both (per mode) is non-vacuous BY
// CONSTRUCTION: if the engine ignored the media query and behaved identically in both modes, one
// signature would be absent and the test would go red. Red-first was additionally demonstrated by
// swapping the emulated media (asserting the reduce signature under default media FAILS) — recorded
// in progress.md.

/** Resolve on the next animation frame — one tick of a smooth scroll's interpolation. */
function nextFrame(): Promise<void> {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/** Trigger a scroll from the top and capture its trajectory: `immediate` (scrollTop synchronously
 *  after the trigger), `early` (scrollTop on each of the next `frames` animation frames), and
 *  `final` (the settled destination — mode-independent; only the PATH there differs). The reset to
 *  0 + settle is itself smooth-safe (settle waits out any animated reset). */
async function scrollTrajectory(
  scroller: HTMLElement,
  trigger: () => void,
  frames = 8,
): Promise<{ immediate: number; early: number[]; final: number }> {
  scroller.scrollTop = 0;
  await settle(scroller);
  trigger();
  const immediate = scroller.scrollTop;
  const early: number[] = [];
  for (let i = 0; i < frames; i += 1) {
    await nextFrame();
    early.push(scroller.scrollTop);
  }
  const final = await settle(scroller);
  return { immediate, early, final };
}

const LAND_EPS = 4; // px slack for "landed on the target" (fractional device-pixel positions)
const MOVE_EPS = 4; // px past which the box has demonstrably started moving (not still at 0)
const REDUCE_TARGET = 5; // Section 6 — a large, deterministic scroll distance so smooth clearly animates

/** Assert the mode-distinguishing trajectory signatures on `scroller` for the entry `button`,
 *  proving BOTH directions of the media query with mutually-exclusive (hence non-vacuous) checks. */
async function assertReducedMotion(scroller: HTMLElement, button: HTMLElement): Promise<void> {
  await waitForScrollable(scroller);

  // Harness sanity: the emulation actually reaches the test iframe (matchMedia flips both ways).
  // If this control fails, media emulation is not wired to the page and nothing below is trustworthy.
  await commands.emulateReducedMotion('reduce');
  expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  const reduce = await scrollTrajectory(scroller, () => button.click());

  await commands.emulateReducedMotion('no-preference');
  expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
  const smooth = await scrollTrajectory(scroller, () => button.click());

  // Same destination in both modes — the media query changes the PATH, never the target.
  expect(reduce.final).toBeGreaterThan(400); // it really scrolled a large distance
  expect(Math.abs(reduce.final - smooth.final)).toBeLessThan(LAND_EPS);

  // REDUCE → instant: at the target within one frame, and NEVER observed partway.
  expect(reduce.early[0]).toBeGreaterThan(reduce.final - LAND_EPS);
  expect(reduce.early.every((s) => s >= reduce.final - LAND_EPS)).toBe(true);

  // DEFAULT → smooth: NOT landed on the first frame, and observed STRICTLY mid-flight on some early
  // frame (0 < s < target). This is exactly what fails if the engine ignored the media query (it
  // would have gone instant like reduce and never been caught mid-flight).
  expect(smooth.early[0]).toBeLessThan(smooth.final - LAND_EPS);
  expect(smooth.early.some((s) => s > MOVE_EPS && s < smooth.final - LAND_EPS)).toBe(true);
}

describe('TOC reduced-motion — real engine (task 3.3)', () => {
  afterEach(async () => {
    // Media emulation is page-scoped and persists across tests in this file; reset so later
    // specs (and reruns) start from the system default rather than a leaked 'reduce'/'no-preference'.
    await commands.emulateReducedMotion(null);
  });

  it('full-page host: instant under reduce, smooth without (:host{scroll-behavior} governs)', async () => {
    const { host, buttons } = mountFullPage();
    await assertReducedMotion(host, buttons[REDUCE_TARGET]);
  });
});

// ── Task 3.4 — resize drag: a pointer-draggable handle rewrites the per-view --toc-w ──────────
// The rail's width is the `--toc-w` custom property on the host (readerCss.ts default 250px). A
// pointer drag on `.peekover-toc__resizer` (the handle 3.4 builds + wires) rewrites it, clamped
// to [TOC_MIN_WIDTH, TOC_MAX_WIDTH]. jsdom has no pointer geometry and does not resolve the
// custom property from the shadow stylesheet, so this is a real-engine proof on Chromium AND
// Firefox (pointer-event + setPointerCapture handling differs across engines — exactly why it is
// here). The handle sits on the rail's INNER (left) edge and the rail is anchored to the viewport
// RIGHT edge, so dragging the pointer LEFT (outward) WIDENS the rail and RIGHT (inward) NARROWS it.
//
// NON-VACUOUS by construction: a ZERO-delta drag must leave --toc-w unchanged while a real drag
// must move it — an unwired handle would leave EVERY drag at the default (indistinguishable from
// the zero-delta case), so the "grew"/"shrank" assertions would fail. That is the red-first proof:
// with the pointer wiring absent, `--toc-w` never moves and the direction assertions go red (they
// reduce to the zero-delta invariant). PER VIEW ONLY: the width is an inline style on the host and
// resizing invokes NO store method (asserted on the contained surface with a spy store).

/** The host's live --toc-w in px (what the drag rewrites; the CSS `:host` default resolves it
 *  before any drag). Reading THIS property — not a re-derived rendered width — is the exact
 *  channel tasks.md 3.4's red-first names ("FAILS if the drag does not move --toc-w"). */
function tocWidthPx(host: HTMLElement): number {
  return parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'));
}

/** Dispatch a real PointerEvent at the handle. Events are dispatched directly ON the resizer, so
 *  the handler runs regardless of whether the browser could route an OS pointer here — the drag
 *  math (delta + captured start width) is what is under test, not capture routing (a browser
 *  primitive). `clientY` is fixed; only the horizontal delta matters for a vertical resizer. */
function firePointer(resizer: Element, type: string, clientX: number): void {
  resizer.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** One full press→drag→release gesture from a fixed anchor X by a horizontal delta (negative =
 *  outward/left = wider; positive = inward/right = narrower). Returns the resulting --toc-w. */
function dragBy(host: HTMLElement, resizer: Element, anchorX: number, delta: number): number {
  firePointer(resizer, 'pointerdown', anchorX);
  firePointer(resizer, 'pointermove', anchorX + delta);
  firePointer(resizer, 'pointerup', anchorX + delta);
  return tocWidthPx(host);
}

const ANCHOR_X = 600; // arbitrary; only the delta from it matters (events fire directly on the handle)

describe('TOC resize drag — real engine (task 3.4)', () => {
  it('full-page host: drag outward grows, inward shrinks, zero-delta leaves --toc-w unchanged (non-vacuous)', async () => {
    const { host } = mountFullPage();
    host.setAttribute('data-toc', 'open'); // open → the rail renders at var(--toc-w)
    await waitForScrollable(host);
    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;

    const start = tocWidthPx(host);
    expect(start).toBe(250); // the readerCss.ts :host default, before any drag

    // ZERO-delta: no movement → width unchanged. This is the red-first anchor: if the pointer
    // wiring were absent, the grow/shrink drags below would ALSO leave the width here, so their
    // assertions would be indistinguishable from this no-op and fail.
    expect(dragBy(host, resizer, ANCHOR_X, 0)).toBeCloseTo(start, 0);

    // GROW: drag outward (left, clientX decreases) → wider by |delta|.
    const grown = dragBy(host, resizer, ANCHOR_X, -60);
    expect(grown).toBeGreaterThan(start);
    expect(grown).toBeCloseTo(start + 60, 0);

    // SHRINK: drag inward (right, clientX increases) from the now-grown width → narrower.
    const shrunk = dragBy(host, resizer, ANCHOR_X, 40);
    expect(shrunk).toBeLessThan(grown);
    expect(shrunk).toBeCloseTo(grown - 40, 0);
  });

  it('full-page host: dragging past a bound clamps at TOC_MIN_WIDTH / TOC_MAX_WIDTH', async () => {
    const { host } = mountFullPage();
    host.setAttribute('data-toc', 'open');
    await waitForScrollable(host);
    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;

    // Far outward (250 + 1000 → clamped): stops AT the max, never wider.
    expect(dragBy(host, resizer, ANCHOR_X, -1000)).toBe(TOC_MAX_WIDTH);
    // Far inward from the max (480 − 1000 → clamped): stops AT the min, never narrower.
    expect(dragBy(host, resizer, ANCHOR_X, 1000)).toBe(TOC_MIN_WIDTH);
  });

  it('contained pane: resizing writes to NO storage (per view) and the width holds for the view', async () => {
    // Persistence is spec 004 — resizing must invoke no store method. A spy store records every
    // call; we snapshot the count AFTER the folder open (which legitimately persists recents), then
    // assert the resize adds none.
    const calls: string[] = [];
    const spyStore: AppStore = {
      putFolder: async () => {
        calls.push('putFolder');
      },
      deleteFolder: async () => {
        calls.push('deleteFolder');
      },
      putRecent: async () => {
        calls.push('putRecent');
      },
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const app = mountAppShell(container, {
      openFolder: async () => ({ ok: true, source: memorySource('doc.md', buildDoc()) }),
      store: spyStore,
    });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    const host = await waitFor(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    await waitFor(() => host.shadowRoot?.querySelector('.peekover-toc__resizer'));
    const resizer = host.shadowRoot!.querySelector('.peekover-toc__resizer')!;

    const before = calls.length; // whatever opening the folder persisted — the resize must add 0
    const grown = dragBy(host, resizer, ANCHOR_X, -50);
    expect(grown).toBeGreaterThan(250); // the drag really moved --toc-w on the contained host
    expect(calls.length).toBe(before); // ...and touched no persistence path

    // Holds for the view: the inline override persists (no reset on a later tick).
    await new Promise<void>((r) => setTimeout(r, 60));
    expect(tocWidthPx(host)).toBe(grown);
  });
});
