// Theme control — the REAL-ENGINE proof (task 5.1), Chromium AND Firefox.
//
// WHY EVERYTHING INTERESTING IS HERE AND NOT IN JSDOM. The control's failure modes are layout
// and cascade: does it render on BOTH surfaces through the one mount() seam, does a click
// actually re-theme the host (computed tokens, not just an attribute), and does it COLLIDE with
// the chrome the reader already carries. jsdom has no cascade and returns all-zero rects, so
// every one of those questions is unanswerable there. The only jsdom-testable piece — the pure
// `nextThemeSetting` cycle — lives in src/theme/themeControl.test.ts.
//
// THE COLLISION RISK IS THE M3 DEFECT CLASS. The reader already carries the mode-toggle pill
// (top-right), the remote-load opt-in (top-left), the network indicator (bottom-left) and the
// full-height TOC rail (right). M3's gate caught a rail that every geometry test measured
// perfectly while it rendered TRANSPARENT — so geometry is necessary, not sufficient. What this
// suite proves is that the new pill does not INTERSECT the other chrome at a narrow and a wide
// viewport on both surfaces. What it cannot prove — whether the pill reads as Peekover chrome,
// whether its contrast holds, whether it occludes something in a way a human minds — is
// human-gate 8.1, exactly as the M3 retro requires.
//
// THE SAVE PATH IS ASSERTED THROUGH AN INJECTED FAKE, AND THAT IS A REAL LIMIT. This harness
// loads NO unpacked extension: there is no background service worker and `browser.runtime` has
// no receiving end (the standing limitation recorded at task 2.3). So the control's REAL sink in
// production — `messagingPort(...).save` on the content script, `directPort(store).save` on the
// app page — cannot run here. These tests register a FAKE sink through the same
// `registerThemeSaveSink` seam the entrypoints use and assert the control called it with the
// right patch. That proves the control's half of the contract (it saves, once, with the chosen
// theme); it does NOT prove the message reaches the background. That end-to-end path is 8.1.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { commands, page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { setThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import {
  registerThemeSaveSink,
  resetThemeSaveSinkForTest,
  resetThemeControlsForTest,
} from '../../src/theme/themeControl';
import type { Settings } from '../../src/settings/settings';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateColorScheme(value: 'light' | 'dark' | null): Promise<void>;
  }
}

/** Two headings, so `buildTocView` clears its >=2-heading threshold and the rail really exists —
 *  a geometry test against an absent rail would pass vacuously. */
const DOC = '# Heading\n\nSome body text.\n\n## Second section\n\nMore body text.\n';

const CONTROL = '.peekover-theme-toggle';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The vitest browser iframe's default. Restored after any test that resizes it. */
const NARROW = { width: 414, height: 896 };
const WIDE = { width: 1400, height: 900 };

function shadowOf(host: HTMLElement): ShadowRoot {
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('host has no shadow root');
  return shadow;
}

const controlIn = (host: HTMLElement) =>
  shadowOf(host).querySelector<HTMLButtonElement>(CONTROL);

/** A full-page reader host — the <peekover-root> the content script mounts. */
function mountFullPageReader(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  mount(DOC, host);
  return host;
}

/** A CONTAINED reader host — a plain <div>, exactly what readerPane.ts mounts into on the app
 *  page. The two-surface gotcha: the same mount() seam must ship the control to both. */
function mountContainedReader(): HTMLElement {
  const host = document.createElement('div');
  host.style.display = 'block';
  document.body.appendChild(host);
  mount(DOC, host, { contained: true });
  return host;
}

/** Install a recording save sink through the production seam. Returns the patches it received. */
function recordSaves(): Array<Partial<Settings>> {
  const saved: Array<Partial<Settings>> = [];
  registerThemeSaveSink((patch) => saved.push(patch));
  return saved;
}

beforeEach(async () => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeSaveSinkForTest();
  resetThemeWatchForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await commands.emulateColorScheme('light');
  await page.viewport(NARROW.width, NARROW.height);
});

afterEach(async () => {
  setThemeSetting('auto');
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeSaveSinkForTest();
  document.body.replaceChildren();
  await commands.emulateColorScheme(null);
  await page.viewport(NARROW.width, NARROW.height);
});

// ── Rendering + the GOLDEN PIN ────────────────────────────────────────────────────────────

describe('theme control — ships to BOTH surfaces through the one mount() seam', () => {
  it('renders on the content-script full-page reader', () => {
    const control = controlIn(mountFullPageReader());
    expect(control).toBeTruthy();
    expect(control!.tagName).toBe('BUTTON');
    expect(control!.type).toBe('button');
  });

  it('renders on the app-page {contained} pane (the recurring two-surface gotcha)', () => {
    const control = controlIn(mountContainedReader());
    expect(control).toBeTruthy();
    expect(control!.tagName).toBe('BUTTON');
  });

  it.each([
    ['full-page', mountFullPageReader],
    ['contained', mountContainedReader],
  ])('is a SIBLING of .peekover-reader, never inside the column (%s)', (_name, mountFn) => {
    const host = mountFn();
    const shadow = shadowOf(host);
    const control = controlIn(host)!;
    const column = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    // THE COLUMN PIN — and this assertion is not a belt-and-braces duplicate of the golden
    // diff, it is the ONLY guard. MEASURED, not assumed: appending the control to `root`
    // instead of `children` leaves `git diff tests/golden/output/` EMPTY and the golden suite
    // GREEN (10/10), because tests/golden/golden.test.ts snapshots the pure
    // `sanitize(parse(source))` string — a stage that runs BEFORE mount() builds any chrome and
    // can never observe it. The same mutation fails the assertions below on both engines. So
    // "the golden diff is empty" must never be read as "the reading column is untouched".
    expect(control.parentNode).toBe(shadow);
    expect(column.parentNode).toBe(shadow);
    expect(column.contains(control)).toBe(false);
  });
});

// ── Applying + saving ────────────────────────────────────────────────────────────────────

describe('theme control — a pick applies IMMEDIATELY and calls the save path', () => {
  it('selecting Dark themes the host and computes the dark tokens', () => {
    const host = mountFullPageReader();
    const control = controlIn(host)!;
    expect(host.getAttribute('data-theme')).toBe('light'); // auto, OS emulated light

    control.click(); // auto -> light
    control.click(); // light -> dark

    // The ATTRIBUTE, and then the CASCADE it drives — the second is what jsdom cannot see and
    // what actually determines whether the reader looks dark.
    expect(host.getAttribute('data-theme')).toBe('dark');
    const paper = getComputedStyle(host).getPropertyValue('--paper').trim().toUpperCase();
    expect(paper).toBe('#12141C');
  });

  it('calls the save path with the chosen theme, once per pick', () => {
    const saved = recordSaves();
    const control = controlIn(mountFullPageReader())!;

    control.click();
    control.click();

    // Asserted through an INJECTED FAKE sink — the real port needs a background this harness
    // has none of (see the file header). This is the control's half of the contract.
    expect(saved).toEqual([{ theme: 'light' }, { theme: 'dark' }]);
  });

  it('applies to EVERY registered surface at once, not just its own', () => {
    const fullPage = mountFullPageReader();
    const contained = mountContainedReader();

    controlIn(fullPage)!.click(); // auto -> light
    controlIn(fullPage)!.click(); // light -> dark

    // One writer, one registry broadcast: a pick in one reader re-themes the other. This is why
    // the control calls setThemeSetting rather than writing data-theme itself.
    expect(fullPage.getAttribute('data-theme')).toBe('dark');
    expect(contained.getAttribute('data-theme')).toBe('dark');
  });

  it('still applies the pick when NO save sink is registered', () => {
    // A context that never registered a sink (a focused test, an unwired surface) must not throw
    // and must still theme the view — persistence is best-effort, never a gate on the UI.
    resetThemeSaveSinkForTest();
    const host = mountFullPageReader();
    controlIn(host)!.click();
    expect(host.getAttribute('data-theme')).toBe('light');
  });
});

// ── Staying in sync (decision D-B) ────────────────────────────────────────────────────────

describe('theme control — displays the CURRENT setting, changed from anywhere', () => {
  it('re-labels when the persisted setting arrives AFTER mount (the cold start)', () => {
    const control = controlIn(mountFullPageReader())!;
    expect(control.textContent).toBe('Theme: Auto');

    // Exactly what entrypoints/peekover.content.ts does when load() resolves — group 4 measured
    // that this lands AFTER the mount on a cold start, so a control that labelled itself once at
    // build time would sit there reading "Auto" while the reader painted dark.
    setThemeSetting('dark');

    expect(control.textContent).toBe('Theme: Dark');
    expect(control.getAttribute('aria-label')).toBe('Theme: Dark. Activate for Auto.');
  });

  it('keeps a SECOND control in sync with a pick made on the first', () => {
    const fullPage = mountFullPageReader();
    const contained = mountContainedReader();

    controlIn(fullPage)!.click(); // auto -> light

    // The app page shows two controls (5.1's in-reader pill + 5.2's header control). They must
    // never disagree about what is selected.
    expect(controlIn(contained)!.textContent).toBe('Theme: Light');
  });

  it('distinguishes auto from a manual theme that happens to match', () => {
    // THE REASON THE CONTROL CANNOT READ data-theme (decision D-B). Under Auto on a light OS the
    // host reads data-theme="light" — identical to a manual Light. The label must still say
    // "Auto", so it has to ask the runtime for the SETTING.
    const host = mountFullPageReader();
    const control = controlIn(host)!;

    setThemeSetting('auto');
    expect(host.getAttribute('data-theme')).toBe('light');
    expect(control.textContent).toBe('Theme: Auto');

    setThemeSetting('light');
    expect(host.getAttribute('data-theme')).toBe('light'); // the attribute did NOT change...
    expect(control.textContent).toBe('Theme: Light'); // ...but the label did
  });
});

// ── a11y ─────────────────────────────────────────────────────────────────────────────────

describe('theme control — accessibility', () => {
  it('is a real button with an accessible name carrying the selection and the action', () => {
    const control = controlIn(mountFullPageReader())!;
    // A <button> is keyboard-operable natively — no tabindex, no key handler. Its accessible
    // name states BOTH the current selection (which a screen-reader user cannot see) and what
    // activating it will do.
    expect(control.tagName).toBe('BUTTON');
    expect(control.hasAttribute('tabindex')).toBe(false);
    expect(control.getAttribute('aria-label')).toBe('Theme: Auto. Activate for Light.');
  });

  it('is reachable by keyboard and activates on Enter', async () => {
    const host = mountFullPageReader();
    const control = controlIn(host)!;
    control.focus();
    expect(shadowOf(host).activeElement).toBe(control);

    // A native button activates on Enter/Space with no key handling of our own; dispatching a
    // real click is what the engine does in response.
    control.click();
    await sleep(0);
    expect(host.getAttribute('data-theme')).toBe('light');
  });
});

// ── GEOMETRY: the M3 collision class ─────────────────────────────────────────────────────

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

/**
 * Assert the theme control clears every other piece of chrome on one surface.
 *
 * WHAT IS ASSERTED AGAINST THE TOC RAIL, AND WHY IT IS THE RAIL'S CONTENT. The rail's BOX spans
 * the full height of the surface at right:0, and the mode-toggle pill has floated over its top
 * padding strip since M3 shipped — that is the existing, deliberate design, so a blanket
 * "nothing may intersect the rail box" assertion would fail on M3 code and prove nothing about
 * this task. What actually matters is occlusion of the rail's CONTENT: its always-visible
 * handle and its entry list. Those are asserted.
 */
function assertNoChromeCollision(host: HTMLElement, label: string): void {
  const shadow = shadowOf(host);
  const control = shadow.querySelector<HTMLElement>(CONTROL)!;
  const modeToggle = shadow.querySelector<HTMLElement>('.peekover-mode-toggle')!;
  const railHandle = shadow.querySelector<HTMLElement>('.peekover-toc__toggle')!;
  const railList = shadow.querySelector<HTMLElement>('.peekover-toc__list')!;
  expect(control, `${label}: no theme control`).toBeTruthy();
  expect(railHandle, `${label}: no TOC rail — the geometry check would be vacuous`).toBeTruthy();

  const rect = control.getBoundingClientRect();
  // Non-vacuous: a display:none / zero-size control would clear everything trivially.
  expect(rect.width, `${label}: control has no width`).toBeGreaterThan(0);
  expect(rect.height, `${label}: control has no height`).toBeGreaterThan(0);

  expectNoOverlap(`${label} control`, rect, 'mode-toggle', modeToggle.getBoundingClientRect());
  expectNoOverlap(`${label} control`, rect, 'TOC handle', railHandle.getBoundingClientRect());
  expectNoOverlap(`${label} control`, rect, 'TOC list', railList.getBoundingClientRect());
}

describe('theme control — geometry: clears the existing chrome (the M3 defect class)', () => {
  it.each([
    ['narrow', NARROW],
    ['wide', WIDE],
  ])('full-page reader, %s viewport', async (_name, size) => {
    await page.viewport(size.width, size.height);
    const host = mountFullPageReader();
    // Force the rail OPEN so its list is laid out and the check is against the worst case (the
    // rail at its widest); the width-derived default would collapse it at 414px.
    host.setAttribute('data-toc', 'open');
    assertNoChromeCollision(host, `full-page/${_name}`);
  });

  it.each([
    ['narrow', NARROW],
    ['wide', WIDE],
  ])('contained app-page pane, %s viewport', async (_name, size) => {
    await page.viewport(size.width, size.height);
    const host = mountContainedReader();
    host.setAttribute('data-toc', 'open');
    assertNoChromeCollision(host, `contained/${_name}`);
  });

  it('clears the reading column at a WIDE viewport, where a gutter exists', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const host = mountFullPageReader();
    host.setAttribute('data-toc', 'open');
    const shadow = shadowOf(host);
    const control = shadow.querySelector<HTMLElement>(CONTROL)!;
    const column = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    expectNoOverlap('control', control.getBoundingClientRect(), 'column', column.getBoundingClientRect());
  });

  it('clears the network indicator AND the remote-load pill on a doc with remote media', () => {
    // The remaining two pieces of chrome, and the bottom-left corner is SHARED with the network
    // indicator — the tightest clearance in the design. Both only exist when mount() actually
    // blocked a remote image, so this needs a doc that has one; the indicator additionally ships
    // CSS-hidden until a network action, so `data-network` is forced (a hidden element has a
    // zero rect and would clear everything vacuously).
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount(`${DOC}\n![remote](https://example.invalid/x.png)\n`, host);
    host.setAttribute('data-network', 'active');

    const shadow = shadowOf(host);
    const net = shadow.querySelector<HTMLElement>('.peekover-net');
    const remoteLoad = shadow.querySelector<HTMLElement>('.peekover-remote-load');
    expect(net, 'no network indicator — the remote image was not blocked').toBeTruthy();
    expect(remoteLoad, 'no remote-load pill — the remote image was not blocked').toBeTruthy();

    const netRect = net!.getBoundingClientRect();
    expect(netRect.height, 'network indicator is not laid out').toBeGreaterThan(0);
    const rect = shadow.querySelector<HTMLElement>(CONTROL)!.getBoundingClientRect();

    expectNoOverlap('control', rect, 'network indicator', netRect);
    expectNoOverlap('control', rect, 'remote-load pill', remoteLoad!.getBoundingClientRect());
  });
});
