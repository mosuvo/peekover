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

/** A CONTAINED reader host — a plain <div>, exactly what readerPane.ts mounts into on the app
 *  page. The recurring two-surface gotcha: the one mount() seam must ship the control to both. */
function mountContainedReader(doc = DOC): HTMLElement {
  const host = document.createElement('div');
  host.style.display = 'block';
  document.body.appendChild(host);
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
  await page.viewport(NARROW.width, NARROW.height);
});

afterEach(async () => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
  await commands.emulateReducedMotion(null);
  await page.viewport(NARROW.width, NARROW.height);
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
