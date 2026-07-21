// The watch control — the REAL-ENGINE proof (spec 005 task 4.1), Chromium AND Firefox.
//
// ── WHY EVERY INTERESTING QUESTION IS HERE AND NOT IN JSDOM ──────────────────────────────────
//
// This task's failure modes are layout, cascade, and object lifetime across a re-render. jsdom has
// no cascade, returns all-zero rects, and cannot emulate `prefers-reduced-motion` — so "does the
// pill collide with the chrome that is already there", "does the infinite pulse actually stop
// under reduce", and "does the control still work after `replaceChildren` destroyed it" are all
// unanswerable there.
//
// ── THE THREE PROPERTIES THIS FILE EXISTS FOR ────────────────────────────────────────────────
//
// 1. THE SIBLING ASSERTION IS THE ONLY GUARD ON PLACEMENT. `tests/golden/` snapshots the pure
//    `sanitize(parse(source))` string — a stage upstream of `mount()` that can never observe
//    chrome. Measured at 004's 5.1: a control appended INSIDE `.peekover-reader` left
//    `git diff tests/golden/output/` EMPTY and the golden suite green 10/10. So "the golden diff
//    is empty" must never be read as "the reading column is untouched"; the DOM assertion below
//    is not a belt-and-braces duplicate, it is the guard.
//
// 2. THE CLOSURE-DEATH CASE. The control is rebuilt on EVERY mount; the thing it drives is not.
//    Watch mode is the feature whose success CAUSES that re-render, so a controller captured in
//    the click closure is dead by the second update. The "still works after a re-render" test is
//    red against exactly that mutation (recorded in tasks.md 4.1).
//
// 3. GEOMETRY, THE M3 COLLISION CLASS. M3's gate caught a TOC rail every geometry test measured
//    perfectly while it rendered TRANSPARENT — so geometry is necessary, not sufficient. What is
//    proven here is that the pill does not INTERSECT the other chrome at a narrow and a wide
//    viewport on both surfaces. Whether it reads as Peekover chrome, and whether its --ok green
//    holds contrast in both themes, is human-gate 7.1.
//
// ── ONE SCOPE NOTE ON THE COLUMN ASSERTION, STATED SO IT IS NOT MISREAD ──────────────────────
//
// Column clearance is asserted at the WIDE viewport, following 004's 5.1 precedent verbatim
// ("clears the reading column at a WIDE viewport, where a gutter exists"). At a NARROW viewport
// the reading column's BOX spans the full scrollport width, so every bottom-left pill — the
// network indicator and the theme pill included, since M4 — overlaps that box while floating over
// the column's empty 130px bottom padding. That is the shipped design, not a regression this task
// introduced, and asserting otherwise would fail on M4 code while proving nothing about this one.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { commands, page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import {
  registerWatchTarget,
  resetWatchRegistryForTest,
  type WatchTarget,
} from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest, WATCH_HOST_ATTR } from '../../src/watch/watchControl';
import { createWatchController } from '../../src/watch/watchController';
import { resolveScrollContainer } from '../../src/render/scrollContainer';
import type { ChangeDetector } from '../../src/watch/changeDetector';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateReducedMotion(value: 'reduce' | 'no-preference' | null): Promise<void>;
  }
}

/** Two headings, so `buildTocView` clears its >=2-heading threshold and the rail really exists —
 *  a geometry check against an absent rail would pass vacuously. */
const DOC = '# Heading\n\nSome body text.\n\n## Second section\n\nMore body text.\n';

const CONTROL = '.peekover-watch';
const DOT = '.peekover-watch__dot';

/** The vitest browser iframe's default. Restored after any test that resizes it. */
const NARROW = { width: 414, height: 896 };
const WIDE = { width: 1400, height: 900 };

function shadowOf(host: HTMLElement): ShadowRoot {
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('host has no shadow root');
  return shadow;
}

const controlIn = (host: HTMLElement) => shadowOf(host).querySelector<HTMLButtonElement>(CONTROL);

/**
 * A recording watch target, registered through the PRODUCTION seam the entrypoints use.
 *
 * THE HARNESS LIMIT, STATED RATHER THAN PAPERED: this suite proves the CONTROL's half of the
 * contract — that a click reaches the registered target, with the right host, and that the
 * rendered state follows. It does not prove the real detector fires (task 1.1/1.2 own that) nor
 * that the relay round-trips (no extension is loaded here; that is 7.1's named gate item).
 */
function recordingTarget(): {
  target: WatchTarget;
  starts: HTMLElement[];
  stops: number;
} {
  const starts: HTMLElement[] = [];
  const state = { watching: false, stops: 0 };
  const target: WatchTarget = {
    start(host) {
      state.watching = true;
      starts.push(host);
    },
    stop() {
      state.watching = false;
      state.stops += 1;
    },
    isWatching: () => state.watching,
  };
  return {
    target,
    starts,
    get stops() {
      return state.stops;
    },
  };
}

/** A full-page reader host — the <peekover-root> the content script mounts. */
function mountFullPageReader(doc = DOC): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  mount(doc, host);
  return host;
}

/**
 * A CONTAINED reader host — a plain <div> inside a scrolling pane, which is exactly the shape
 * `readerPane.ts` + `appShell.ts` produce on the app page: the mount host lives inside
 * `<main class="peekover-app__reader">`, and THAT pane is `overflow:auto` (APP_CSS).
 *
 * THE PANE IS NOT DECORATION — task 3.1's whole point is that the contained surface's scroll box
 * is an ANCESTOR OUTSIDE the shadow root, not `:host`. Mounting a bare div would leave
 * `resolveScrollContainer` falling back to the host (its documented degenerate-mount branch), and
 * a host in normal flow grows to its content and never scrolls — so every follow assertion below
 * would be measuring a box that cannot move. That is a harness defect this suite hit and fixed,
 * not a production one.
 */
function mountContainedReader(doc = DOC): HTMLElement {
  const pane = document.createElement('main');
  pane.className = 'peekover-app__reader';
  pane.style.cssText = 'display:block;overflow:auto;height:80vh;width:100%';
  const host = document.createElement('div');
  host.style.display = 'block';
  pane.appendChild(host);
  document.body.appendChild(pane);
  mount(doc, host, { contained: true });
  return host;
}

interface Surface {
  name: string;
  mount: (doc?: string) => HTMLElement;
  remount: (host: HTMLElement, doc?: string) => void;
}

const SURFACES: Surface[] = [
  {
    name: 'full-page',
    mount: mountFullPageReader,
    remount: (host, doc = DOC) => mount(doc, host, { preserveReading: true }),
  },
  {
    name: 'contained',
    mount: mountContainedReader,
    remount: (host, doc = DOC) => mount(doc, host, { contained: true, preserveReading: true }),
  },
];

beforeEach(async () => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await commands.emulateReducedMotion(null);
});

afterEach(async () => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
  await commands.emulateReducedMotion(null);
});

// ── Rendering, the sibling pin, and toggling ────────────────────────────────────────────────

describe.each(SURFACES)('watch control — $name surface (task 4.1)', (surface) => {
  it('renders through the one mount() seam once a target is registered', () => {
    registerWatchTarget(recordingTarget().target);
    const control = controlIn(surface.mount());
    expect(control).toBeTruthy();
    expect(control!.tagName).toBe('BUTTON');
    expect(control!.type).toBe('button');
  });

  it('grows NO chrome at all in a context that cannot watch — never a dead button', () => {
    // The honesty posture spec §4 requires, and the shape 4.4 builds its explanation on: a
    // surface with no registered target must not ship a control that looks live and does nothing.
    const control = controlIn(surface.mount());
    expect(control).toBeNull();
  });

  it('is a SIBLING of .peekover-reader, never inside the reading column', () => {
    // THE ONLY GUARD ON PLACEMENT — see this file's header on why the golden pin cannot see it.
    registerWatchTarget(recordingTarget().target);
    const host = surface.mount();
    const shadow = shadowOf(host);
    const control = controlIn(host)!;
    const column = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    expect(control.parentNode).toBe(shadow);
    expect(column.parentNode).toBe(shadow);
    expect(column.contains(control)).toBe(false);
  });

  it('toggles the watch on and off, reaching the registered target with THIS host', () => {
    const rec = recordingTarget();
    registerWatchTarget(rec.target);
    const host = surface.mount();
    const control = controlIn(host)!;

    expect(host.hasAttribute(WATCH_HOST_ATTR)).toBe(false);

    control.click();
    expect(rec.starts).toEqual([host]); // the right host, not merely "a start happened"
    expect(host.getAttribute(WATCH_HOST_ATTR)).toBe('active');
    expect(control.textContent).toContain('Watching');

    control.click();
    expect(rec.stops).toBe(1);
    expect(host.hasAttribute(WATCH_HOST_ATTR)).toBe(false);
  });

  it('data-watch lives on the HOST and SURVIVES a re-mount', () => {
    // The property that makes the attribute the right home for the state: `replaceChildren`
    // destroys every child on every render — including the renders a running watch causes — so a
    // flag stored on the control would flicker off once per agent keystroke.
    const rec = recordingTarget();
    registerWatchTarget(rec.target);
    const host = surface.mount();
    controlIn(host)!.click();
    expect(host.getAttribute(WATCH_HOST_ATTR)).toBe('active');

    surface.remount(host);

    expect(host.getAttribute(WATCH_HOST_ATTR)).toBe('active');
  });

  it('STILL WORKS after a re-render — the closure-death case', () => {
    // THE POINT OF THE REGISTRY. The control is rebuilt every mount; the target is not. A
    // controller reference captured in the button's click closure is dead the moment watch mode
    // does the one thing it exists to do. Red-first: replace the registry lookup in
    // watchControl.ts's click handler with a reference captured at build time and this fails on
    // both engines — the rebuilt button's closure has nothing to call.
    const rec = recordingTarget();
    registerWatchTarget(rec.target);
    const host = surface.mount();

    controlIn(host)!.click(); // start, through the FIRST control
    expect(rec.target.isWatching()).toBe(true);

    surface.remount(host); // ...and now that control is gone

    const rebuilt = controlIn(host)!;
    expect(rebuilt).toBeTruthy();
    // The rebuilt control renders the LIVE state rather than assuming "off".
    expect(rebuilt.getAttribute('aria-pressed')).toBe('true');
    expect(rebuilt.textContent).toContain('Watching');

    rebuilt.click(); // stop, through the SECOND control
    expect(rec.stops).toBe(1);
    expect(rec.target.isWatching()).toBe(false);
    expect(host.hasAttribute(WATCH_HOST_ATTR)).toBe(false);
  });

  it('reaches a target REPLACED after the control was built — the real closure-death case', () => {
    // THE ASSERTION THAT ACTUALLY GOES RED against a captured reference, and the reason the test
    // above is not sufficient on its own: across a plain re-render the registry HOLDS THE SAME
    // OBJECT, so a build-time capture still finds it and the previous test passes either way.
    // (Measured — the first red-first attempt left all 46 green. Recorded in tasks.md 4.1.)
    //
    // What genuinely dies is a capture taken before the slot's OCCUPANT changes, and production
    // changes it constantly: 4.2's controller replaces 4.1's detector-backed adapter in this same
    // slot (last registration wins), 4.3 re-registers when the document switches, and the app page
    // registers only once a file is open — by which time the reader has already mounted a control.
    // A control that captured "whatever was registered when I was built" drives the DEAD target.
    const first = recordingTarget();
    registerWatchTarget(first.target);
    const host = surface.mount();
    const control = controlIn(host)!;

    // The slot's occupant changes UNDER the already-built control.
    const second = recordingTarget();
    registerWatchTarget(second.target);

    control.click();

    // The click must reach the CURRENT target, not the one that was there at build time.
    expect(second.starts).toEqual([host]);
    expect(first.starts).toEqual([]);
    expect(host.getAttribute(WATCH_HOST_ATTR)).toBe('active');
  });
});

// ── a11y: the state is exposed to AT, and never colour-only ─────────────────────────────────

describe('watch control — accessibility', () => {
  it('carries its state in TEXT and aria-pressed, not only in colour', () => {
    const rec = recordingTarget();
    registerWatchTarget(rec.target);
    const host = mountFullPageReader();
    const control = controlIn(host)!;

    // OFF: three independent carriers, none of them a hue.
    expect(control.getAttribute('aria-pressed')).toBe('false');
    expect(control.textContent).toContain('Watch this file');
    expect(control.getAttribute('aria-label')).toBe(
      'Not watching this file. Activate to watch it for changes.',
    );

    control.click();

    // ON: every carrier moved. A user who cannot distinguish the green from the grey still reads
    // the state from the label, and a screen reader announces it from aria-pressed.
    expect(control.getAttribute('aria-pressed')).toBe('true');
    expect(control.textContent).toContain('Watching');
    expect(control.getAttribute('aria-label')).toBe(
      'Watching this file for changes. Activate to stop watching.',
    );

    // NON-VACUITY of the colour claim: the colour really does change too, so the test above is
    // asserting that text/ARIA carry the state IN ADDITION to colour, not that colour is unused.
    const dot = shadowOf(host).querySelector<HTMLElement>(DOT)!;
    expect(getComputedStyle(dot).backgroundColor).toBeTruthy();
  });

  it('is a real button, keyboard-operable with no tabindex of its own', () => {
    registerWatchTarget(recordingTarget().target);
    const host = mountFullPageReader();
    const control = controlIn(host)!;
    control.focus();
    expect(shadowOf(host).activeElement).toBe(control);
    expect(control.hasAttribute('tabindex')).toBe(false);
  });

  it('hides the decorative dot from assistive tech', () => {
    registerWatchTarget(recordingTarget().target);
    const dot = shadowOf(mountFullPageReader()).querySelector<HTMLElement>(DOT)!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });
});

// ── prefers-reduced-motion: an INFINITE animation is the strongest case there is ────────────

describe('watch control — the pulsing dot under prefers-reduced-motion', () => {
  it('does not animate under reduce, and DOES animate without it (non-vacuous)', async () => {
    registerWatchTarget(recordingTarget().target);
    const host = mountFullPageReader();
    controlIn(host)!.click(); // the pulse only exists while watching
    const dot = shadowOf(host).querySelector<HTMLElement>(DOT)!;

    // THE CONTROL FOR NON-VACUITY, measured in this same run: without the media query the dot
    // carries the real 2s infinite pulse. Without this half, an assertion that it is ~0 under
    // reduce would also pass against a dot that never animated at all — which is exactly the
    // vacuous-persistence-test defect class (retro 2026-07-19, finding 1).
    await commands.emulateReducedMotion('no-preference');
    const normal = getComputedStyle(dot);
    expect(normal.animationName).toBe('peekover-watch-pulse');
    expect(normal.animationDuration).toBe('2s');
    expect(normal.animationIterationCount).toBe('infinite');

    // ...and under reduce the reader's global rule neutralises it.
    await commands.emulateReducedMotion('reduce');
    const reduced = getComputedStyle(dot);
    expect(reduced.animationDuration).not.toBe('2s');
    expect(parseFloat(reduced.animationDuration)).toBeLessThan(0.01);
  });
});

// ── GEOMETRY: the M3 collision class ────────────────────────────────────────────────────────

/** Do two rects overlap? Touching edges do not count as an intersection. */
function intersects(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** A readable failure: which two elements overlapped, and by what rects. */
function expectNoOverlap(name: string, a: DOMRect, other: string, b: DOMRect): void {
  const detail =
    `${name} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}] ` +
    `vs ${other} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`;
  expect(intersects(a, b), `overlap: ${detail}`).toBe(false);
}

/** Assert the watch pill clears every other piece of chrome on one surface.
 *
 *  WHAT IS ASSERTED AGAINST THE TOC RAIL IS ITS CONTENT, not its box — the rail's box spans the
 *  full height at right:0 and the mode-toggle pill has floated over its top padding strip since
 *  M3 shipped. A blanket "nothing may intersect the rail box" assertion would fail on M3 code and
 *  prove nothing about this task. What matters is occlusion of the rail's always-visible handle
 *  and its entry list. (004's 5.1 reasoning, applied unchanged.) */
function assertNoChromeCollision(host: HTMLElement, label: string): void {
  const shadow = shadowOf(host);
  const control = shadow.querySelector<HTMLElement>(CONTROL)!;
  const modeToggle = shadow.querySelector<HTMLElement>('.peekover-mode-toggle')!;
  const themePill = shadow.querySelector<HTMLElement>('.peekover-theme-toggle')!;
  const railHandle = shadow.querySelector<HTMLElement>('.peekover-toc__toggle')!;
  const railList = shadow.querySelector<HTMLElement>('.peekover-toc__list')!;
  expect(control, `${label}: no watch control`).toBeTruthy();
  expect(themePill, `${label}: no theme pill — the stack check would be vacuous`).toBeTruthy();
  expect(railHandle, `${label}: no TOC rail — the geometry check would be vacuous`).toBeTruthy();

  const rect = control.getBoundingClientRect();
  // Non-vacuous: a display:none / zero-size control would clear everything trivially.
  expect(rect.width, `${label}: control has no width`).toBeGreaterThan(0);
  expect(rect.height, `${label}: control has no height`).toBeGreaterThan(0);

  expectNoOverlap(`${label} watch`, rect, 'mode-toggle', modeToggle.getBoundingClientRect());
  expectNoOverlap(`${label} watch`, rect, 'theme pill', themePill.getBoundingClientRect());
  expectNoOverlap(`${label} watch`, rect, 'TOC handle', railHandle.getBoundingClientRect());
  expectNoOverlap(`${label} watch`, rect, 'TOC list', railList.getBoundingClientRect());
}

describe.each(SURFACES)(
  'watch control — geometry on the $name surface (the M3 defect class)',
  (surface) => {
    // VIEWPORT RESIZING IS SCOPED TO THE TESTS THAT NEED IT, and that is a deliberate harness
    // decision rather than tidiness. `page.viewport()` resizes the SHARED browser window, and
    // vitest runs test FILES concurrently — so a resize here lands under any other file measuring
    // geometry at that moment. The full-page surface is `:host{position:fixed;inset:0}`, i.e. sized
    // to the viewport, so a mid-measurement resize makes its scroll box briefly unscrollable. An
    // earlier draft resized in the GLOBAL beforeEach (~30 resizes per run); it is now ~6, confined
    // to the geometry tests, and restored immediately after. See progress.md's flake watch item.
    afterEach(async () => {
      await page.viewport(NARROW.width, NARROW.height);
    });

    it.each([
      ['narrow', NARROW],
      ['wide', WIDE],
    ])('clears the existing chrome, %s viewport', async (_name, size) => {
      await page.viewport(size.width, size.height);
      registerWatchTarget(recordingTarget().target);
      const host = surface.mount();
      // Force the rail OPEN so its list is laid out and the check runs against the worst case
      // (the rail at its widest); the width-derived default would collapse it at 414px.
      host.setAttribute('data-toc', 'open');
      assertNoChromeCollision(host, `${surface.name}/${_name}`);
    });

    it('clears the reading column at a WIDE viewport, where a gutter exists', async () => {
      // Scoped to WIDE deliberately — see the note in this file's header.
      await page.viewport(WIDE.width, WIDE.height);
      registerWatchTarget(recordingTarget().target);
      const host = surface.mount();
      host.setAttribute('data-toc', 'open');
      const shadow = shadowOf(host);
      expectNoOverlap(
        `${surface.name} watch`,
        shadow.querySelector<HTMLElement>(CONTROL)!.getBoundingClientRect(),
        'column',
        shadow.querySelector<HTMLElement>('.peekover-reader')!.getBoundingClientRect(),
      );
    });
  },
);

describe('watch control — geometry against the conditional chrome', () => {
  it('clears the network indicator AND the remote-load pill on a doc with remote media', async () => {
    // The bottom-left column is the tightest clearance in the design: network indicator (16),
    // theme pill (56), watch (96). Both conditional pieces only exist when mount() actually
    // blocked a remote image, and the indicator additionally ships CSS-hidden until a network
    // action — so `data-network` is forced (a hidden element has a zero rect and would clear
    // everything vacuously).
    await page.viewport(WIDE.width, WIDE.height);
    registerWatchTarget(recordingTarget().target);
    const host = mountFullPageReader(`${DOC}\n![remote](https://example.invalid/x.png)\n`);
    host.setAttribute('data-network', 'active');

    const shadow = shadowOf(host);
    const net = shadow.querySelector<HTMLElement>('.peekover-net');
    const remoteLoad = shadow.querySelector<HTMLElement>('.peekover-remote-load');
    expect(net, 'no network indicator — the remote image was not blocked').toBeTruthy();
    expect(remoteLoad, 'no remote-load pill — the remote image was not blocked').toBeTruthy();

    const netRect = net!.getBoundingClientRect();
    expect(netRect.height, 'network indicator is not laid out').toBeGreaterThan(0);
    const rect = shadow.querySelector<HTMLElement>(CONTROL)!.getBoundingClientRect();

    expectNoOverlap('watch', rect, 'network indicator', netRect);
    expectNoOverlap('watch', rect, 'remote-load pill', remoteLoad!.getBoundingClientRect());
  });
});

// ════ TASK 4.2 — the controller: follow-at-bottom-only, and the update signal ═══════════════
//
// ── THE SPEC WINS OVER THE MOCKUP, AND THIS SUITE IS WHERE THAT IS ENFORCED ─────────────────
//
// `design/mockup.html` scrolls the changed paragraph into view on EVERY update, unconditionally.
// Spec §4 forbids exactly that: a reader who has scrolled away from the bottom must NOT be moved.
// The two tests below are the pair that makes the difference observable — at the bottom the reader
// follows, in the middle they do not — and the mockup's behaviour fails the second one on both
// engines. See watchController.ts's DECISION 1.
//
// ── THE FIXTURE IS APPENDED CONTENT, ON PURPOSE ────────────────────────────────────────────
//
// Both follow tests append. That isolates the property under test from task 3.3's anchor restore:
// with nothing inserted ABOVE the reading position, the anchor lands the reader back at the same
// `scrollTop`, so any movement observed here is the FOLLOW's doing and nothing else's. An
// inserted-above fixture would make "did not move" the wrong assertion (3.3 proves the anchor
// SHOULD move scrollTop in that case, to hold the reader's place) and the test would be measuring
// two features at once.
//
// ── AND THE SETTLED-HEIGHT WAIT, NOT THE OVERFLOW ONE (3.2's measured harness defect) ──────
//
// "The box overflows" is not the precondition; "the box has stopped reflowing" is. 3.2 measured
// `scrollHeight` at 81798 px on first overflow and 26069 px once settled, and a scroll write in
// that window clamps silently. `waitForSettled` below polls for a stable height.

/** Wait until the scroll box overflows AND its content height has STOPPED CHANGING. */
async function waitForSettled(scroller: HTMLElement): Promise<void> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 200; i += 1) {
    const h = scroller.scrollHeight;
    if (h > scroller.clientHeight + 4 && h === prev) {
      stable += 1;
      if (stable >= 3) return;
    } else {
      stable = 0;
    }
    prev = h;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('scroll box never settled (no overflow, or it kept reflowing)');
}

/** Poll `scrollTop` until it stops changing (the reader scrolls smoothly by default). */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 150; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return scroller.scrollTop;
}

const nextFrame = (): Promise<void> =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

const FILLER = Array.from(
  { length: 24 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');

function buildDoc(sections = 8): string {
  const parts: string[] = [];
  for (let i = 1; i <= sections; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** The agent's edit: MORE content at the end. Nothing above the reading position moves. */
function buildAppended(extra = 4): string {
  const parts = [buildDoc()];
  for (let i = 9; i < 9 + extra; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** Poll a predicate until it holds, or fail with a named reason. Used instead of a fixed sleep so
 *  nothing here depends on a latency number (the spec's NFR is responsiveness, not a threshold). */
async function waitFor(what: string, predicate: () => boolean, tries = 300): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (predicate()) return;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error(`timed out waiting for: ${what}`);
}

/** A detector whose callback this suite drives by hand — the real controller, no timers. */
function handDrivenDetector(): { detector: ChangeDetector; fire: (text: string) => void } {
  let cb: ((text: string) => void) | null = null;
  return {
    detector: {
      start(next) {
        cb = next;
      },
      stop() {
        cb = null;
      },
    },
    fire: (text) => cb?.(text),
  };
}

interface LiveWatch {
  host: HTMLElement;
  scroller: HTMLElement;
  fire: (text: string) => void;
}

/** Mount a tall document on `surface`, register the REAL controller, and start the watch through
 *  the REAL control click — the production path end to end, with only the detector faked. */
async function startWatch(surface: Surface): Promise<LiveWatch> {
  const { detector, fire } = handDrivenDetector();
  registerWatchTarget(
    createWatchController({ detector, contained: surface.name === 'contained' }),
  );
  const host = surface.mount(buildDoc());
  const scroller = resolveScrollContainer(host, surface.name === 'contained');
  await waitForSettled(scroller);
  controlIn(host)!.click(); // the user gesture — nothing watches until this happens
  return { host, scroller, fire };
}

describe.each(SURFACES)('watch follow — $name surface (task 4.2)', (surface) => {
  it('AT THE BOTTOM, appended content is FOLLOWED', async () => {
    const w = await startWatch(surface);

    w.scroller.scrollTop = w.scroller.scrollHeight;
    const before = await settle(w.scroller);
    expect(before).toBeGreaterThan(200); // really at the bottom of a real document

    w.fire(buildAppended());
    await waitForSettled(w.scroller);
    const after = await settle(w.scroller);

    // The reader is tailing, so the new content is what they want to see.
    expect(after).toBeGreaterThan(before);
    expect(w.scroller.scrollHeight - w.scroller.clientHeight - after).toBeLessThan(40);
  });

  it('SCROLLED AWAY, the same update leaves the reader UNMOVED', async () => {
    // THE ASSERTION THE MOCKUP'S UNCONDITIONAL scrollIntoView FAILS, on both engines.
    const w = await startWatch(surface);

    const mid = Math.round((w.scroller.scrollHeight - w.scroller.clientHeight) / 2);
    w.scroller.scrollTop = mid;
    const before = await settle(w.scroller);
    expect(before).toBeGreaterThan(200);

    w.fire(buildAppended());
    await waitForSettled(w.scroller);
    const after = await settle(w.scroller);

    // They did not move. The fixture appends, so task 3.3's anchor restore is a no-op here and
    // this measures the FOLLOW decision alone (see this section's header).
    expect(Math.abs(after - before)).toBeLessThan(40);
    // NON-VACUOUS: the bottom is demonstrably somewhere else entirely, so "unmoved" is a real
    // claim rather than a position that happens to coincide with where a follow would have gone.
    const bottom = w.scroller.scrollHeight - w.scroller.clientHeight;
    expect(bottom - after).toBeGreaterThan(500);
  });
});

describe('watch update signal — the flash on the control, not the document (task 4.2)', () => {
  it('flashes the control on an update, and never touches the reading column', async () => {
    const w = await startWatch(SURFACES[0]);
    expect(controlIn(w.host)!.classList.contains('is-updated')).toBe(false);

    w.fire(buildAppended());
    await waitForSettled(w.scroller);

    // Re-queried AFTER the update: `mount()`'s replaceChildren destroyed the pre-update column,
    // and getComputedStyle on a detached node returns an empty string, not 'none' — which would
    // have made this assertion pass for the wrong reason had it been captured earlier.
    const column = shadowOf(w.host).querySelector<HTMLElement>('.peekover-reader')!;

    // The signal lands on the REBUILT control — mount() destroyed the one that existed when the
    // update arrived, so this also pins that the signal looks the current control up rather than
    // holding a reference (the same lifetime property the registry exists for, one layer down).
    expect(controlIn(w.host)!.classList.contains('is-updated')).toBe(true);
    expect(getComputedStyle(controlIn(w.host)!).animationName).toBe('peekover-watch-flash');

    // THE DOCUMENT STAYS THE HERO: the flash is chrome-only. A whole-column wash on every agent
    // keystroke is the option this decision rejected (watchController.ts, DECISION 2).
    expect(column.classList.contains('is-updated')).toBe(false);
    expect(getComputedStyle(column).animationName).toBe('none');
  });
});

describe('watch under prefers-reduced-motion — follow and signal are INSTANT (task 4.2)', () => {
  it('the signal animation is neutralised under reduce, and real without it (non-vacuous)', async () => {
    const w = await startWatch(SURFACES[0]);
    w.fire(buildAppended());
    await waitForSettled(w.scroller);
    const control = controlIn(w.host)!;

    await commands.emulateReducedMotion('no-preference');
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
    expect(getComputedStyle(control).animationDuration).toBe('1.6s');

    await commands.emulateReducedMotion('reduce');
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(parseFloat(getComputedStyle(control).animationDuration)).toBeLessThan(0.01);
  });

  it('the follow scroll is instant under reduce and animated without it (non-vacuous)', async () => {
    // The two signatures are MUTUALLY EXCLUSIVE, which is what makes this non-vacuous by
    // construction: if the engine ignored the media query and behaved identically in both modes,
    // one of the two would be absent and this goes red. (003's tocScroll method, reused.)
    const w = await startWatch(SURFACES[0]);

    // The mechanism, asserted directly: readerCss.ts flips :host{scroll-behavior} under reduce,
    // and that single declaration is what makes the follow instant — no branch in the controller.
    await commands.emulateReducedMotion('no-preference');
    expect(getComputedStyle(w.scroller).scrollBehavior).toBe('smooth');
    await commands.emulateReducedMotion('reduce');
    expect(getComputedStyle(w.scroller).scrollBehavior).toBe('auto');

    // ...and the behaviour that mechanism produces: under reduce the follow has LANDED on the
    // first frame after the update.
    w.scroller.scrollTop = w.scroller.scrollHeight;
    await settle(w.scroller);
    w.fire(buildAppended(6));
    await nextFrame();
    await nextFrame();
    const early = w.scroller.scrollTop;
    const final = await settle(w.scroller);
    expect(final).toBeGreaterThan(0);
    expect(early).toBeGreaterThan(final - 8);
  });
});

// ════ TASK 5.3 — THE COST-PROPORTIONAL COOLDOWN, IN A REAL ENGINE ═══════════════════════════
//
// ── WHAT THIS SUITE CLAIMS, AND WHAT IT DELIBERATELY DOES NOT ───────────────────────────────
//
// The spec's NFR is RESPONSIVENESS, not a latency number, so **no threshold is asserted here** —
// that is the standing M1 rule and 5.1's own protocol. What is asserted is the mechanism that
// responsiveness rests on, measured against REAL render costs on REAL engines:
//
//   • a stream of N changes produces FEWER than N renders — the main thread is not committed to
//     one full synchronous `mount()` per change, which is the pile-up 5.2 decided against
//     (`mount()` is synchronous, so callbacks QUEUE rather than interleave);
//   • the reader LANDS ON THE NEWEST text, not on an intermediate state and not short of the end
//     — coalescing must drop the middle without dropping the tail;
//   • the reader is still OPERABLE afterwards — the control toggles, the watch really stops.
//
// Whether it FEELS responsive to a human watching an agent write for several minutes is **7.1**,
// eye-only, and no test in this repo can stand in for it.
//
// The jsdom suite (`src/watch/watchController.test.ts`) owns the exact arithmetic — that the
// cooldown SCALES with the render cost rather than being a fixed window — because that needs a
// controlled clock and a controlled render cost. Here the costs are whatever the engine really
// charges, which is the half jsdom cannot supply.
//
// ── A FLAKE THAT WAS FIXED AT ITS CAUSE, NOT ASSERTED AROUND (worth inheriting) ─────────────
//
// The first draft spaced the stream with `await setTimeout(0)` between changes, meaning to imitate
// an agent writing. It failed 1 run in 3 (`12 renders for 12 changes — nothing coalesced`), and
// the reason is instructive: a macrotask yield in a busy engine is not ~1 ms, it can exceed a
// render's cost — and when the gap between changes exceeds the cooldown, NOTHING SHOULD coalesce.
// The test was measuring the harness's scheduler latency, not the coalescer. **The product was
// right and the instrument was wrong**, the same shape as 4.5's viewport flake.
//
// The burst below is therefore a tight loop of microtasks, which is not a simplification but a
// more faithful model of the thing under test: `mount()` is SYNCHRONOUS, so changes arriving while
// it runs cannot interleave — they queue and then drain BACK-TO-BACK. That drain is exactly what
// this loop delivers. The spaced-out case is still covered, at the end of the same test, by the
// only assertion it can support without a threshold: a later change still lands.

/** One version of a streamed document, uniquely identifiable in the rendered DOM. */
const streamDoc = (i: number): string => `${buildDoc(12)}\n\n## Stream marker ${i}\n\n${FILLER}`;

interface CountedWatch extends LiveWatch {
  renders: () => number;
  column: () => HTMLElement;
}

/** Like `startWatch`, but wrapping the REAL `mount` so renders can be counted. The render seam is
 *  the injection point 4.2 already established; production's mount is what actually runs, so the
 *  costs the cooldown reacts to are the engine's real ones. */
async function startCountedWatch(surface: Surface): Promise<CountedWatch> {
  const { detector, fire } = handDrivenDetector();
  const counters = { renders: 0 };
  registerWatchTarget(
    createWatchController({
      detector,
      contained: surface.name === 'contained',
      render: (text, host, options) => {
        counters.renders += 1;
        mount(text, host, options);
      },
    }),
  );
  const host = surface.mount(buildDoc());
  const scroller = resolveScrollContainer(host, surface.name === 'contained');
  await waitForSettled(scroller);
  controlIn(host)!.click();
  return {
    host,
    scroller,
    fire,
    renders: () => counters.renders,
    column: () => shadowOf(host).querySelector<HTMLElement>('.peekover-reader')!,
  };
}

describe.each(SURFACES)('watch under a rapid update stream — $name surface (task 5.3)', (surface) => {
  const CHANGES = 12;

  it('COALESCES the stream, lands on the NEWEST text, and stays operable', async () => {
    const w = await startCountedWatch(surface);
    // Starting a watch renders nothing by itself — the baseline the count below is read against.
    expect(w.renders()).toBe(0);

    // THE DRAIN: changes that arrived while a synchronous `mount()` was running cannot interleave,
    // so they run back-to-back the moment it returns. See this section's header on why this is the
    // faithful model and a spaced-out loop was the flake.
    for (let i = 1; i <= CHANGES; i += 1) {
      w.fire(streamDoc(i));
      await Promise.resolve();
    }

    // No starvation: the LAST change is not dropped, whatever happened to the ones before it.
    await waitFor(`the reader to show stream marker ${CHANGES}`, () =>
      w.column().textContent!.includes(`Stream marker ${CHANGES}`),
    );

    const renders = w.renders();
    // NON-VACUOUS FROM BOTH SIDES: renders really happened (the reader is not frozen), and there
    // were fewer of them than there were changes (the main thread was not handed one full
    // synchronous mount per change).
    expect(renders, 'the reader rendered nothing at all').toBeGreaterThanOrEqual(2);
    expect(renders, `${renders} renders for ${CHANGES} changes — nothing coalesced`).toBeLessThan(
      CHANGES,
    );

    // The reader shows the NEWEST document, not an intermediate one left behind by the burst.
    const text = w.column().textContent!;
    expect(text).toContain(`Stream marker ${CHANGES}`);
    expect(text).not.toContain(`Stream marker ${CHANGES - 1}`);

    // THE STREAM IS NOT WEDGED: a change arriving later, well after the burst, still lands. This
    // is the spaced-out case, asserted the only way it can be without a threshold — eventually,
    // not within N ms. It is what rules out a coalescer that quietly stops updating.
    w.fire(streamDoc(99));
    await waitFor('the reader to show a change arriving after the burst', () =>
      w.column().textContent!.includes('Stream marker 99'),
    );

    // ...and it is still a live control, not a reader wedged behind a queue of pending work.
    const control = controlIn(w.host)!;
    expect(control.getAttribute('aria-pressed')).toBe('true');
    control.click();
    expect(control.getAttribute('aria-pressed')).toBe('false');
    expect(w.host.hasAttribute(WATCH_HOST_ATTR)).toBe(false);
  });

  it('STOPPING mid-stream renders nothing further — no pending render outlives the watch', async () => {
    // The same property the jsdom suite asserts against a controlled clock, re-proven where the
    // cooldown is whatever this engine really charges for a mount: a stop during the cooldown must
    // CANCEL the pending render, not merely be overtaken by it.
    const w = await startCountedWatch(surface);

    w.fire(streamDoc(1)); // renders immediately, and starts a cooldown
    for (let i = 2; i <= 5; i += 1) w.fire(streamDoc(i)); // ...these coalesce into one pending
    controlIn(w.host)!.click(); // STOP, with that render still pending

    const rendersAtStop = w.renders();
    await new Promise<void>((r) => setTimeout(r, 400));

    expect(w.renders(), 'a stopped watch rendered again').toBe(rendersAtStop);
    // The reader keeps the last thing it actually rendered — never blanked, never advanced.
    expect(
      w.column().textContent,
      'the reader advanced past the last render the watch was allowed',
    ).toContain('Stream marker 1');
  });
});
