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
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

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

function mountFullPage(): {
  host: HTMLElement;
  buttons: HTMLElement[];
  headings: Element[];
} {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(buildDoc(), host);
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

async function mountContained(): Promise<{
  scroller: HTMLElement;
  buttons: HTMLElement[];
  headings: Element[];
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', buildDoc()) }),
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
