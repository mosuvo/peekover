// The diagram lightbox (007 task 7.2, §3.11 · §5 a11y) in a REAL ENGINE, Chromium AND Firefox.
//
// ── ★ ROW 21: THERE IS NO SIBLING SUITE, AND THAT IS THE SIGNAL ──────────────────────────────
//
// Plan §3.5's audit row 21 records that NO existing element in this codebase traps focus. There was
// nothing to transcribe from, and — the part that matters — nothing would have been noticed
// missing. `storagePanelOverlay.browser.test.ts` is the only baseline for the out-of-flow half
// (rows 10, 12) and it has no focus assertions at all. This file is that baseline.
//
// ── WHY EVERY ASSERTION HERE IS ABOUT WHERE FOCUS WENT ───────────────────────────────────────
//
// 7.1's defect shape was "the control produced the wrong BYTES". This one's is "focus escaped, or
// Escape did not close, or focus never came back". A test that asserts "activating the diagram
// opened an overlay" passes against every one of those, so it is worth nothing. Each case below
// reads `shadow.activeElement` — the element actually holding focus inside the shadow root — and
// names it by IDENTITY, never by "something inside the group".
//
// ── ★ WHY THE KEYBOARD HALF NEEDS `userEvent`, NOT A DISPATCHED EVENT ────────────────────────
//
// A synthetic `new KeyboardEvent('keydown', {key:'Tab'})` does NOT move focus: the focus advance is
// a browser default action reserved to trusted events. Dispatching one would make the NO-TRAP build
// look identical to the trapped one — focus sitting where it already was — and the revert would
// leave the suite green, which is a dead control, not a passing test (7.1's own finding). So Tab
// and Escape here go through `userEvent`, which is Playwright's real keyboard. Nothing in
// production grew a seam for either: `activeElement` is a browser global and the keys are real.
//
// ── HAND-ROLLED, THEREFORE EVERY CLAIM IS LOAD-BEARING ───────────────────────────────────────
//
// The trap is NOT `<dialog>.showModal()` (the reasons are in `diagramView.ts`'s header). That means
// trap, wrap, Escape, initial focus and restore are all ours, and each has a real defect available
// to it — which is what lets the reverts recorded in the task report actually go red. A `<dialog>`
// would have made four of the six tests below assertions about the browser.

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { page, userEvent, commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import {
  DIAGRAM_MEASURE_CLASS,
  enhanceDiagrams,
  resetDiagramThemeForTest,
} from '../../src/render/diagramEnhancer';
import {
  DIAGRAM_ACTION_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_LIGHTBOX_CLASS,
  DIAGRAM_LIGHTBOX_CLOSE_CLASS,
  DIAGRAM_LIGHTBOX_PANEL_CLASS,
  DIAGRAM_LIGHTBOX_VIEW_CLASS,
  DIAGRAM_OPEN_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import { clearDiagramCache } from '../../src/app/store';
import { setThemeSetting } from '../../src/theme/reader';
import {
  resetThemeHostsForTest,
  resetEffectiveThemeListenersForTest,
} from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 }; // `diffChrome.browser.test.ts`'s own WIDE

// Distinct node labels: `htmlLabels:false` makes every label an SVG <text>, so these strings appear
// VERBATIM in the artifact — which is what lets "the lightbox shows diagram 2" be asserted by
// LANDMARK rather than by counting nodes that all look alike.
const FENCE_ONE = '```mermaid\ngraph TD; Alpha-->Bravo;\n```';
const FENCE_TWO = '```mermaid\ngraph LR; Xray-->Yankee-->Zulu;\n```';

const docOf = (...fences: string[]): string =>
  '# Diagram lightbox\n\n' +
  'Paragraph before the diagram, real text in the reading column so that "the page under the ' +
  'overlay did not move" has a box with a position to compare.\n\n' +
  `${fences.join('\n\n')}\n\n` +
  'Paragraph after the diagram, likewise real text in the reading column.\n';

// `buildTocView` returns null below two headings (`tocView.ts:546`), so rows 8 + 9's rail simply
// would not exist against `docOf`'s single `#`. A second heading is what makes that assertion
// capable of being non-vacuous at all.
const tocDocOf = (...fences: string[]): string =>
  `${docOf(...fences)}\n## A second heading, so the TOC rail clears its two-heading threshold\n\n` +
  'More text under it.\n';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const cleanup: HTMLElement[] = [];

// ── The harness (duplicated from `diagramActions`; plan §4-8 carries the missing shared module) ──

/** No loader is injected: these cases run the PRODUCTION `import('mermaid')`, because the artifact
 *  the lightbox clones has to be real engine output for any of this to mean anything. */
function enhancedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host);
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return { host, shadow: host.shadowRoot };
}

async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await sleep(25);
  }
  throw new Error('enhancement never completed');
}

async function renderedFigures(shadow: ShadowRoot): Promise<HTMLElement[]> {
  await settleDiagrams(shadow);
  const figures = [
    ...shadow.querySelectorAll<HTMLElement>(`${FIGURE_SELECTOR}[${DIAGRAM_STATE_ATTR}="rendered"]`),
  ];
  if (figures.length === 0) throw new Error('no diagram reached `rendered`');
  return figures;
}

async function oneFigure(markdown = docOf(FENCE_ONE)): Promise<{
  host: HTMLElement;
  shadow: ShadowRoot;
  figure: HTMLElement;
  trigger: HTMLButtonElement;
}> {
  const { host, shadow } = enhancedHost(markdown);
  const [figure] = await renderedFigures(shadow);
  return { host, shadow, figure, trigger: triggerIn(figure) };
}

const triggerIn = (figure: HTMLElement): HTMLButtonElement =>
  figure.querySelector<HTMLButtonElement>(`.${DIAGRAM_OPEN_CLASS}`)!;

const lightboxIn = (shadow: ShadowRoot): HTMLElement | null =>
  shadow.querySelector<HTMLElement>(`.${DIAGRAM_LIGHTBOX_CLASS}`);

const panelIn = (shadow: ShadowRoot): HTMLElement =>
  shadow.querySelector<HTMLElement>(`.${DIAGRAM_LIGHTBOX_PANEL_CLASS}`)!;
const closeIn = (shadow: ShadowRoot): HTMLButtonElement =>
  shadow.querySelector<HTMLButtonElement>(`.${DIAGRAM_LIGHTBOX_CLOSE_CLASS}`)!;
const viewIn = (shadow: ShadowRoot): HTMLElement =>
  shadow.querySelector<HTMLElement>(`.${DIAGRAM_LIGHTBOX_VIEW_CLASS}`)!;

/**
 * ★ The element that actually holds focus, inside the shadow root.
 *
 * `document.activeElement` is the HOST for anything focused in a shadow tree, so it can never tell
 * the close button from the reader behind it — it reports the same node for both. Reading the
 * root's own `activeElement` is what makes "focus is inside the lightbox" and "focus escaped to the
 * document behind" distinguishable at all.
 */
const activeIn = (shadow: ShadowRoot): Element | null => shadow.activeElement;

/** Name whatever holds focus, for a failure message that says where focus LANDED rather than that
 *  an equality failed. This is the "naming the element it landed on" half of row 21's revert. */
function describeActive(shadow: ShadowRoot): string {
  const el = activeIn(shadow);
  if (!el) return `<none> (document.activeElement=${document.activeElement?.tagName ?? 'null'})`;
  const cls = el.className && typeof el.className === 'string' ? `.${el.className}` : '';
  return `${el.tagName.toLowerCase()}${cls}`;
}

/** Open through the SHIPPED path — a real activation of the trigger — and wait for the modal. */
async function open(shadow: ShadowRoot, trigger: HTMLButtonElement): Promise<HTMLElement> {
  trigger.click();
  return until(() => lightboxIn(shadow));
}

async function until<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(25);
  }
  throw new Error('until() timed out');
}

/**
 * ★ Plant a marker INSIDE the live, already-adopted `<svg>` (7.1's `probe`, same purpose).
 *
 * Nothing upstream can know about it: it is written after `sanitizeSvg` ran, after the inert parse,
 * after adoption. A lightbox that carries it cloned THE NODE ON SCREEN. One that does not
 * re-rendered, read a cached raw string, or took a copy at build time — the three shapes AGENTS.md
 * #3 rules out, because each of them re-admits the `<style>` and `<foreignObject>` the §3.5 profile
 * stripped, and none of them can see a mutation made after adoption.
 */
function probe(svg: SVGSVGElement, text: string): void {
  const desc = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'desc');
  desc.textContent = text;
  svg.appendChild(desc);
}

/** Whole-pixel geometry, so sub-pixel layout noise between engines cannot red this
 *  (`storagePanelOverlay.browser.test.ts:108-118`'s shape, reused verbatim in spirit). */
function box(el: Element): { top: number; left: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top),
    left: Math.round(r.left),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

const rectOf = (el: Element): DOMRect => el.getBoundingClientRect();

const intersects = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

function expectNoOverlap(name: string, a: DOMRect, other: string, b: DOMRect): void {
  const detail =
    `${name} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}] ` +
    `vs ${other} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`;
  expect(intersects(a, b), `overlap: ${detail}`).toBe(false);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetEffectiveThemeListenersForTest();
  resetDiagramThemeForTest();
  setThemeSetting('light'); // pins the cache key's theme component
  await clearDiagramCache(); // 4.3's rule: no prior test's cache may feed this one
  await commands.emulateReducedMotion('no-preference');
});

afterEach(async () => {
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN — a render can still be in flight, and its measuring container lives in `document.body`.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await sleep(25);
  }
  await commands.emulateReducedMotion('no-preference');
  await page.viewport(NARROW.width, NARROW.height);
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetEffectiveThemeListenersForTest();
});

// ── ★ ROW 21, THE NEW BASELINE: TRAP AND RESTORE ─────────────────────────────────────────────

describe('row 21 — the lightbox traps focus and restores it (007 establishes this baseline)', () => {
  it('SUCCESS-vs-NOTHING: no modal + trigger focused -> modal + focus INSIDE -> gone + trigger focused', async () => {
    const { shadow, trigger } = await oneFigure();

    // BEFORE: nothing is open, and focus is on the opener.
    trigger.focus();
    expect(lightboxIn(shadow)).toBeNull();
    expect(activeIn(shadow)).toBe(trigger);

    // AFTER OPEN: the modal exists AND focus moved into it. Both halves — a modal that opened
    // without taking focus leaves a keyboard user stranded behind it, and passes any
    // "an overlay appeared" assertion.
    const lb = await open(shadow, trigger);
    expect(lb.isConnected).toBe(true);
    const active = await until(() => activeIn(shadow));
    expect(lb.contains(active), `focus landed on ${describeActive(shadow)}, outside the lightbox`).toBe(true);
    expect(active).toBe(closeIn(shadow));

    // AFTER CLOSE: the modal is GONE and focus is back on the opener, BY IDENTITY.
    closeIn(shadow).click();
    await until(() => lightboxIn(shadow) === null);
    expect(lightboxIn(shadow)).toBeNull();
    expect(activeIn(shadow), `focus landed on ${describeActive(shadow)}, not the trigger`).toBe(trigger);
  });

  it('Tab from the LAST focusable inside lands on the FIRST — an actual focus move', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);

    const close = closeIn(shadow);
    const view = viewIn(shadow);

    // Park focus on the LAST stop, then Tab. Without the trap the engine would carry focus out of
    // the lightbox entirely, because nothing in the shadow tree follows it.
    view.focus();
    expect(activeIn(shadow)).toBe(view);

    await userEvent.tab();

    const landed = activeIn(shadow);
    expect(
      lightboxIn(shadow)!.contains(landed),
      `Tab escaped the lightbox and landed on ${describeActive(shadow)}`,
    ).toBe(true);
    expect(landed).toBe(close);
    // ...and it genuinely MOVED, rather than being where it already was.
    expect(landed).not.toBe(view);
  });

  it('Shift-Tab from the FIRST focusable wraps back to the LAST', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);

    const close = closeIn(shadow);
    const view = viewIn(shadow);
    close.focus();
    expect(activeIn(shadow)).toBe(close);

    await userEvent.tab({ shift: true });

    const landed = activeIn(shadow);
    expect(
      lightboxIn(shadow)!.contains(landed),
      `Shift-Tab escaped the lightbox and landed on ${describeActive(shadow)}`,
    ).toBe(true);
    expect(landed).toBe(view);
    expect(landed).not.toBe(close);
  });

  it('★ Escape closes the lightbox AND returns focus to the trigger BY IDENTITY', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);
    expect(activeIn(shadow)).toBe(closeIn(shadow));

    await userEvent.keyboard('{Escape}');
    await until(() => lightboxIn(shadow) === null);

    expect(lightboxIn(shadow), 'Escape left the lightbox open').toBeNull();
    // ★ THE ANCHOR CLAIM. Not `body`, not the reader host, not "a button in the group" — the exact
    // element that was activated to open it.
    expect(
      activeIn(shadow),
      `Escape closed but focus landed on ${describeActive(shadow)} instead of the opener`,
    ).toBe(trigger);
  });

  it('the close button restores focus to the trigger BY IDENTITY', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);

    closeIn(shadow).click();
    await until(() => lightboxIn(shadow) === null);

    expect(activeIn(shadow), `focus landed on ${describeActive(shadow)}`).toBe(trigger);
  });

  it('a click on the backdrop closes and restores; a click on the panel does NOT', async () => {
    const { shadow, trigger } = await oneFigure();
    const lb = await open(shadow, trigger);

    // The panel is inside the backdrop — a click there must not close what the user is looking at.
    panelIn(shadow).click();
    await sleep(50);
    expect(lightboxIn(shadow), 'clicking the panel closed the lightbox').not.toBeNull();

    lb.click(); // the backdrop itself
    await until(() => lightboxIn(shadow) === null);
    expect(activeIn(shadow), `focus landed on ${describeActive(shadow)}`).toBe(trigger);
  });

  it('★ on a MULTI-diagram document, diagram 2 restores to DIAGRAM 2’s trigger', async () => {
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);
    expect(figures).toHaveLength(2);
    const first = triggerIn(figures[0]);
    const second = triggerIn(figures[1]);

    await open(shadow, second);
    await userEvent.keyboard('{Escape}');
    await until(() => lightboxIn(shadow) === null);

    expect(
      activeIn(shadow),
      `focus returned to ${describeActive(shadow)} — the wrong diagram's trigger`,
    ).toBe(second);
    expect(activeIn(shadow)).not.toBe(first);
  });
});

// ── ★ NO NEW GLOBAL BARE KEY (§3.11 · 006 D-7's rule) ────────────────────────────────────────

describe('Escape is MODAL-SCOPED, not a new global bare key', () => {
  it('Escape with no lightbox open changes nothing — no document-level handler was registered', async () => {
    const { shadow, figure, trigger } = await oneFigure();

    // Focus something in the reader and press Escape. If 7.2 had bound Escape at the document or
    // window, this is where it would fire with nothing to act on.
    const copy = figure.querySelector<HTMLButtonElement>(`.${DIAGRAM_ACTION_CLASS}`)!;
    copy.focus();
    const before = box(figure);

    await userEvent.keyboard('{Escape}');
    await sleep(50);

    expect(lightboxIn(shadow), 'Escape opened or left a lightbox with none open').toBeNull();
    expect(activeIn(shadow), 'Escape moved focus with no modal open').toBe(copy);
    expect(box(figure)).toEqual(before);
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    // NON-VACUITY: the same key DOES do something once the modal is open, so the null above is a
    // fact about the binding's scope and not about a key the harness cannot deliver.
    await open(shadow, trigger);
    await userEvent.keyboard('{Escape}');
    await until(() => lightboxIn(shadow) === null);
    expect(lightboxIn(shadow)).toBeNull();
  });
});

// ── ★ THE CONTENT IS THE LIVE SANITIZED ARTIFACT (AGENTS.md #3) ──────────────────────────────

describe('what the lightbox shows is the ADOPTED, profile-passed <svg> — not a re-render', () => {
  it('carries a marker planted into the LIVE <svg> after adoption', async () => {
    const { shadow, figure, trigger } = await oneFigure();
    const live = figure.querySelector('svg')!;
    const MARK = 'peekover-live-node-7-2';
    probe(live, MARK);

    await open(shadow, trigger);

    const shown = viewIn(shadow).querySelector('svg');
    expect(shown, 'the lightbox has no <svg> at all').not.toBeNull();
    expect(
      shown!.textContent ?? '',
      'the enlarged diagram does not carry a marker written into the adopted <svg> — the ' +
        'lightbox re-rendered, read a cached raw string, or copied the node at build time',
    ).toContain(MARK);
  });

  it('is a CLONE — opening does not empty the reader’s own figure', async () => {
    const { shadow, figure, trigger } = await oneFigure();
    await open(shadow, trigger);

    expect(figure.querySelector('svg'), 'the lightbox MOVED the reader’s <svg> instead of cloning').not.toBeNull();
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
  });

  it('★ on a MULTI-diagram document, diagram 2’s lightbox shows DIAGRAM 2 (landmark)', async () => {
    const { shadow } = enhancedHost(docOf(FENCE_ONE, FENCE_TWO));
    const figures = await renderedFigures(shadow);

    await open(shadow, triggerIn(figures[1]));
    const text = viewIn(shadow).textContent ?? '';

    expect(text, 'the lightbox shows diagram 1’s artifact').not.toContain('Alpha');
    expect(text).toContain('Zulu'); // FENCE_TWO's own label — the discriminator
    expect(shadow.querySelector(`.${DIAGRAM_LIGHTBOX_CLASS}`)!.getAttribute('aria-label')).toBe(
      'Diagram 2, enlarged',
    );
  });
});

// ── ROWS 10 + 12: OUT OF FLOW, AND ZERO FOOTPRINT ON CLOSE ───────────────────────────────────

describe('rows 10 + 12 — the page under the lightbox does not move', () => {
  it('the open lightbox is OUT OF FLOW (absolute or fixed)', async () => {
    const { shadow, trigger } = await oneFigure();
    const lb = await open(shadow, trigger);
    // `static` is the value that would have put it in the layout; anything out of flow satisfies it.
    expect(['absolute', 'fixed']).toContain(getComputedStyle(lb).position);
  });

  it('opening does NOT move or resize the reading column', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { shadow, trigger } = await oneFigure();
    const reader = shadow.querySelector<HTMLElement>('.peekover-reader')!;
    const para = reader.querySelector('p')!;
    const readerBefore = box(reader);
    const paraBefore = box(para);

    await open(shadow, trigger);

    // NON-VACUITY: the panel has a real box. A zero-height overlay would move nothing and the
    // assertions below would pass for free (`storagePanelOverlay:129`'s guard).
    const panel = box(panelIn(shadow));
    expect(panel.height).toBeGreaterThan(0);
    expect(panel.width).toBeGreaterThan(0);

    expect(box(reader)).toEqual(readerBefore);
    expect(box(para)).toEqual(paraBefore);
  });

  it('row 12 — closing returns the slot to ZERO footprint and the page is where it started', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const { shadow, trigger } = await oneFigure();
    const reader = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    // Bring the trigger on screen FIRST. Restoring focus to an off-screen element scrolls it into
    // view — correct behaviour, and a scroll is not a layout change — but it would otherwise be
    // indistinguishable here from the overlay having pushed the column. Removing the confound is
    // what leaves this test measuring row 12's actual claim: the closed lightbox occupies nothing.
    trigger.scrollIntoView({ block: 'center' });
    await sleep(50);
    const before = box(reader);

    await open(shadow, trigger);
    expect(box(panelIn(shadow)).height).toBeGreaterThan(0); // it really was there

    closeIn(shadow).click();
    await until(() => lightboxIn(shadow) === null);

    // No emptied husk left behind painting a sliver over the column.
    expect(shadow.querySelectorAll(`.${DIAGRAM_LIGHTBOX_CLASS}`)).toHaveLength(0);
    expect(box(reader)).toEqual(before);
  });
});

// ── ROWS 8 + 9: THE OPEN OVERLAY CLEARS THE CHROME ───────────────────────────────────────────

describe('rows 8 + 9 — the open lightbox panel clears the TOC rail, the mode toggle and the chrome', () => {
  it('clears all of it at a WIDE viewport', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const host = document.createElement('div');
    document.body.appendChild(host);
    cleanup.push(host);
    // The conditional chrome only exists when mount() actually blocked a remote image, and the
    // indicator ships CSS-hidden until a network action — `data-network` is forced, because a
    // hidden element has a zero rect and would be cleared vacuously (7.1's row-7 note).
    // KEEPS: the open lightbox clears the document-bound chrome (C117). RE-SPELLED at 013 task 4.5: mounted as the app
    // page mounts (`pills: false`), so the mode toggle and theme pill are not in this tree to clear — dropped below.
    mount(`${tocDocOf(FENCE_ONE)}\n![remote](https://example.invalid/x.png)\n`, host, {
      contained: true,
      pills: false,
      preserveReading: true,
    });
    enhanceDiagrams(host);
    host.setAttribute('data-network', 'active');
    host.setAttribute('data-toc', 'open');
    const shadow = host.shadowRoot!;
    const [figure] = await renderedFigures(shadow);

    await open(shadow, triggerIn(figure));
    const rect = rectOf(panelIn(shadow));
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);

    for (const [name, sel] of [
      ['TOC rail', '.peekover-toc'],
      ['network indicator', '.peekover-net'],
      ['remote-load pill', '.peekover-remote-load'],
    ] as const) {
      const el = shadow.querySelector<HTMLElement>(sel);
      expect(el, `${name} is not in this tree — this assertion would be vacuous`).not.toBeNull();
      const other = rectOf(el!);
      expect(other.width, `${name} has a zero rect`).toBeGreaterThan(0);
      expectNoOverlap('lightbox panel', rect, name, other);
    }
  });
});

// ── ★ ROW 4's OTHER HALF: THE LIGHTBOX IS A SIBLING OF `.peekover-reader` ────────────────────

describe('row 4b — the lightbox is OUTSIDE the reading column, a sibling', () => {
  it('mounts as a sibling of `.peekover-reader`, never inside it', async () => {
    const { shadow, trigger, figure } = await oneFigure();
    const reader = shadow.querySelector<HTMLElement>('.peekover-reader')!;

    // The INVERSION, both halves in one test: the FIGURE is inside the column (3.1's assertion,
    // re-stated here so the pair is visible), and the LIGHTBOX is outside it.
    expect(reader.contains(figure), 'the figure left the reading column').toBe(true);

    const lb = await open(shadow, trigger);
    expect(reader.contains(lb), 'the lightbox was appended INSIDE the reading column').toBe(false);
    expect(lb.parentNode, 'the lightbox is not a child of the shadow root').toBe(shadow);
    expect([...shadow.children]).toContain(reader);
    expect([...shadow.children]).toContain(lb);
  });
});

// ── ROW 19: THE ZOOM ANIMATES, AND IS INSTANT UNDER `prefers-reduced-motion` ─────────────────

describe('row 19 — the zoom animates, and is instant under prefers-reduced-motion', () => {
  it('DOES animate without the media query, and is instant under it (non-vacuous)', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);
    const panel = panelIn(shadow);

    // THE NON-VACUITY HALF, measured in this same run: without the query the panel carries the
    // real zoom. Without it, "instant under reduce" would also pass against a panel that never
    // animated at all — the vacuous-persistence defect class.
    await commands.emulateReducedMotion('no-preference');
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
    expect(getComputedStyle(panel).animationName).toBe('peekover-diagram-zoom');
    expect(getComputedStyle(panel).animationDuration).toBe('0.18s');

    await commands.emulateReducedMotion('reduce');
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(parseFloat(getComputedStyle(panel).animationDuration)).toBeLessThan(0.01);
  });
});

// ── ROW 16 + §3.11: THE TRIGGER IS A REAL BUTTON, REACHED BY POINTER *OR* KEYBOARD ───────────

describe('row 16 — the trigger is a real <button>, and both input paths open it', () => {
  it('is a <button type=button> with no tabindex of its own, carrying selection AND action', async () => {
    const { figure, trigger } = await oneFigure();
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.type).toBe('button');
    expect(trigger.hasAttribute('tabindex')).toBe(false);
    expect(trigger.getAttribute('aria-label')).toBe('Diagram 1. Activate to open it larger.');
    expect(figure.contains(trigger)).toBe(true);
  });

  it('opens by POINTER — activating the diagram itself', async () => {
    const { shadow, trigger } = await oneFigure();
    await userEvent.click(trigger);
    const lb = await until(() => lightboxIn(shadow));
    expect(lb.contains(activeIn(shadow))).toBe(true);
  });

  it('opens by KEYBOARD — Enter on the focused trigger', async () => {
    const { shadow, trigger } = await oneFigure();
    trigger.focus();
    expect(activeIn(shadow)).toBe(trigger);

    await userEvent.keyboard('{Enter}');

    const lb = await until(() => lightboxIn(shadow));
    expect(lb.contains(activeIn(shadow)), `focus is on ${describeActive(shadow)}`).toBe(true);
  });

  it('activating twice does not stack two modals', async () => {
    const { shadow, trigger } = await oneFigure();
    await open(shadow, trigger);
    trigger.click();
    await sleep(50);
    expect(shadow.querySelectorAll(`.${DIAGRAM_LIGHTBOX_CLASS}`)).toHaveLength(1);
  });
});
