// DIAGRAMS FOLLOW THE EFFECTIVE THEME — real engines, Chromium AND Firefox (007 task 5.1, D-7).
//
// ── ★ WHY THE CENTRAL TEST IS AN *OS FLIP*, NOT A SETTING CHANGE ──────────────────────────────
//
// D-7 chose `themeRegistry.applyTheme` over `reader.onThemeSettingChange` as the re-theme trigger.
// A test driven by `setThemeSetting('dark')` cannot tell those two seams apart — both channels fire
// on a setting write — so it would pass against the WRONG one and prove nothing about the decision.
//
// The distinguishing case is the one the setting channel deliberately does not report, in its own
// words (`reader.ts:108-112`): *an OS flip under `auto` changes what paints but NOT what the user
// picked, so it deliberately does not notify.* `DEFAULT_SETTINGS.theme` is `'auto'`, so that case is
// not exotic — it is the DEFAULT configuration, and the most likely way a user first meets a
// re-theme at all. Every test here therefore leaves the setting at `auto` and flips the emulated OS,
// and the setting is asserted STILL `'auto'` afterwards: nothing on the setting channel moved.
//
// REVERT-AND-FAIL, RUN: with `diagramEnhancer.ts` subscribing to `onThemeSettingChange` instead
// (resolving the effective theme itself, so the build is otherwise honest), this file reds on both
// engines with the stale rendering NAMED —
//
//   AssertionError: the rendered diagram is still at its OLD theme ...: expected 'light' to be 'dark'
//   - Expected: "dark"   + Received: "light"
//
// — on `data-diagram-theme`, not on a bare boolean. The host's own `data-theme` reads `dark` in that
// same failing run, which is exactly why it is NOT the observable: the page repaints correctly while
// the diagram inside it stays a light-themed picture. That is the defect D-7 exists to prevent.
//
// ── WHAT `data-diagram-theme` IS FOR ──────────────────────────────────────────────────────────
//
// `data-theme` on a host says what the page is PAINTING; `data-diagram-theme` on a figure says what
// its SVG was DRAWN for. Staleness is precisely a disagreement between the two, so it needs both to
// be visible. (`diagramEnhancer.ts` writes it — see its doc comment.)
//
// ── NEVER BLANK IS ASSERTED ACROSS THE TRANSITION, NOT AT THE DESTINATION ─────────────────────
//
// §4's *keep the previously rendered diagram visible until its replacement is ready* is a claim
// about the SWAP, and the settled end state cannot see it: a figure emptied and refilled looks
// identical once it is over. So the swap is observed two ways at once, because each covers the
// other's blind spot:
//
//   • a `requestAnimationFrame` sampler — every frame from before the flip to after it lands must
//     show exactly one <svg>. Catches a figure left empty ACROSS frames (an await between empty and
//     fill), which is what a naive "clear, then render, then fill" implementation would do.
//   • a MutationObserver REPLAY — the childList records are replayed in order to reconstruct the
//     <svg> count after each one. Catches a blank that opens and closes within a SINGLE task, which
//     no frame sampler can ever see (`replaceChildren()` followed by `append(svg)` reads as two
//     records: 1 -> 0 -> 1).
//
// Both are non-vacuous only because the same test proves the swap HAPPENED: the theme attribute
// flips AND the original <svg> node is gone from the figure, so "never blank" is not the trivial
// truth of a figure nothing touched.

import { describe, it, expect, afterEach, beforeEach, vi, type Mock } from 'vitest';
import { commands } from 'vitest/browser';
import mermaid from 'mermaid';
import { mount } from '../../src/render/mount';
import {
  DIAGRAM_MEASURE_CLASS,
  DIAGRAM_THEME_ATTR,
  enhanceDiagrams,
  resetDiagramThemeForTest,
} from '../../src/render/diagramEnhancer';
import type { DiagramEngine, DiagramEngineModule, EngineLoader } from '../../src/render/diagramEngine';
import { DIAGRAM_FIGURE_CLASS, DIAGRAM_STATE_ATTR } from '../../src/render/diagramView';
import { clearDiagramCache, describeStored, __resetConnectionForTest } from '../../src/app/store';
import { setThemeSetting, currentThemeSetting, resetThemeWatchForTest } from '../../src/theme/reader';
import {
  resetThemeHostsForTest,
  resetEffectiveThemeListenersForTest,
} from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateColorScheme(value: 'light' | 'dark' | null): Promise<void>;
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)';
const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

const FENCE_A = '```mermaid\ngraph TD; A-->B;\n```\n';
const FENCE_B = '```mermaid\ngraph TD; X-->Y-->Z;\n```\n';

const doc = (...fences: string[]): string =>
  `# Themed document\n\nProse before.\n\n${fences.join('\n')}\nProse after.\n`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const cleanup: HTMLElement[] = [];

/** The real engine, wrapped to COUNT invocations — `diagramCache.browser.test.ts`'s `counting`,
 *  verbatim. Wrapping rather than patching the singleton matters: sibling suites in this project
 *  import the same mermaid instance. */
function counting(): { loader: EngineLoader; render: Mock<() => void> } {
  const render: Mock<() => void> = vi.fn();
  const engine: DiagramEngine = {
    initialize: (config) => mermaid.initialize(config as never),
    render: async (id, definition, container) => {
      render();
      return await mermaid.render(id, definition, container);
    },
  };
  return { loader: async () => ({ default: engine }) as unknown as DiagramEngineModule, render };
}

/** mount + enhance by hand — D-12's second call site, the only seam an injected loader enters by.
 *  A plain <div> is exactly what `readerPane.ts` mounts into on the app page. */
function enhancedHost(markdown: string, loader: EngineLoader): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(host);
  mount(markdown, host, { contained: true, preserveReading: true });
  enhanceDiagrams(host, { loader });
  if (!host.shadowRoot) throw new Error('expected a mounted host');
  return { host, shadow: host.shadowRoot };
}

/** Wait until no fence is still `pending` — `diagramRender.browser.test.ts:302`'s helper. */
async function settleDiagrams(shadow: ShadowRoot, tries = 600): Promise<void> {
  for (let i = 0; i < tries; i += 1) {
    if (shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0) return;
    await sleep(25);
  }
  throw new Error('enhancement never completed — the theme pass did not settle');
}

/** Apply an emulated OS color scheme and WAIT until the page observes it. The command runs
 *  server-side (Playwright), so the change reaches the page asynchronously and a synchronous
 *  assertion after the await races it. `themeRuntime.browser.test.ts:53`, verbatim. */
async function emulateOs(scheme: 'light' | 'dark'): Promise<void> {
  await commands.emulateColorScheme(scheme);
  const want = scheme === 'dark';
  for (let i = 0; i < 50; i += 1) {
    if (window.matchMedia(DARK_QUERY).matches === want) return;
    await sleep(20);
  }
  throw new Error(`emulated color scheme never reached the page: wanted ${scheme}`);
}

/** Flip the emulated OS scheme and return only once the engine DELIVERED a `change` event to a
 *  control listener on the page — `matches` and the event are not simultaneous on Chromium. This
 *  is also what makes the negative assertions honest: the event our runtime listener receives
 *  demonstrably arrived, so a diagram that did not follow it did not follow a real flip.
 *  `themeRuntime.browser.test.ts:78`, verbatim. */
async function flipOsAndAwaitDelivery(scheme: 'light' | 'dark'): Promise<void> {
  const mq = window.matchMedia(DARK_QUERY);
  let delivered = false;
  const onChange = () => {
    delivered = true;
  };
  mq.addEventListener('change', onChange);
  try {
    await emulateOs(scheme);
    for (let i = 0; i < 100; i += 1) {
      if (delivered) return;
      await sleep(20);
    }
    throw new Error(`OS flip to ${scheme} never delivered a change event to the page`);
  } finally {
    mq.removeEventListener('change', onChange);
  }
}

/**
 * ★ THE STALENESS BARRIER, and the assertion the wrong-channel build reds on.
 *
 * Polls the OBSERVABLE rather than asserting straight after the flip: the runtime's listener and
 * this test's control listener are on different MediaQueryList objects and engines do not agree on
 * notification order (`themeRuntime.browser.test.ts:106`), and the re-theme itself is async by
 * design (re-key, look up, render on a miss). It cannot mask a broken trigger — a diagram that is
 * never re-themed simply times out and reports the theme it is stuck at.
 */
async function waitForDiagramTheme(figure: Element, expected: string): Promise<void> {
  for (let i = 0; i < 240; i += 1) {
    if (figure.getAttribute(DIAGRAM_THEME_ATTR) === expected) return;
    await sleep(25);
  }
  expect(
    figure.getAttribute(DIAGRAM_THEME_ATTR),
    'the rendered diagram is still at its OLD theme after the effective theme changed — the page ' +
      'repainted and this figure did not follow it. D-7: subscribing to `onThemeSettingChange` ' +
      'rather than `applyTheme` is exactly this defect, because an OS flip under `auto` never ' +
      'reaches the setting channel',
  ).toBe(expected);
}

/** Wait until `host` carries the expected `data-theme` — the half a wrong-channel build ALSO gets
 *  right, asserted here so the test says out loud which observable is doing the work. */
async function waitForHostTheme(host: HTMLElement, expected: string): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (host.getAttribute('data-theme') === expected) return;
    await sleep(20);
  }
  expect(host.getAttribute('data-theme')).toBe(expected);
}

/**
 * Observe a figure ACROSS the swap, two ways (see the header for why one is not enough).
 * `frames` is one <svg>-count sample per animation frame; `replay` is the <svg> count after each
 * childList mutation, reconstructed in record order.
 */
function watchFigure(figure: Element): { stop(): { frames: number[]; replay: number[] } } {
  const initial = figure.querySelectorAll('svg').length;
  const frames: number[] = [];
  const replay: number[] = [initial];
  let count = initial;
  let running = true;

  const sample = (): void => {
    if (!running) return;
    frames.push(figure.querySelectorAll('svg').length);
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);

  const apply = (records: MutationRecord[]): void => {
    for (const record of records) {
      if (record.type !== 'childList') continue;
      for (const node of record.removedNodes) if (node instanceof SVGSVGElement) count -= 1;
      for (const node of record.addedNodes) if (node instanceof SVGSVGElement) count += 1;
      replay.push(count);
    }
  };
  const observer = new MutationObserver(apply);
  observer.observe(figure, { childList: true });

  return {
    stop() {
      running = false;
      apply(observer.takeRecords()); // records queued but not yet delivered are still evidence
      observer.disconnect();
      return { frames, replay };
    },
  };
}

beforeEach(async () => {
  // Re-install the OS listener per test — TEST ISOLATION across the Vitest test boundary, not a
  // product limitation (see `resetThemeWatchForTest`'s note: a listener installed in an earlier
  // test stops receiving EMULATED flips in later ones).
  resetThemeWatchForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetEffectiveThemeListenersForTest();
  resetDiagramThemeForTest();
  setThemeSetting('auto'); // THE DEFAULT — and the configuration the whole file turns on
  document.body.replaceChildren();
  await emulateOs('light');
  await clearDiagramCache();
});

afterEach(async () => {
  for (const el of cleanup.splice(0)) el.remove();
  // DRAIN — removing a host does not cancel an in-flight render, and its measuring container lives
  // in `document.body` (D-6 step 1), where a stray one reads as the NEXT test's.
  for (let i = 0; i < 400 && document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`); i += 1) {
    await sleep(25);
  }
  resetDiagramThemeForTest();
  resetEffectiveThemeListenersForTest();
  resetThemeHostsForTest();
  setThemeSetting('auto');
  document.body.replaceChildren();
  await commands.emulateColorScheme(null);
  await clearDiagramCache();
  __resetConnectionForTest();
});

describe('diagrams follow the EFFECTIVE theme (007 D-7; task 5.1)', () => {
  it('★ an OS flip under `auto` re-themes EVERY rendered diagram — the wrong-channel red-first', async () => {
    const { loader, render } = counting();
    const { host, shadow } = enhancedHost(doc(FENCE_A, FENCE_B), loader);
    await settleDiagrams(shadow);

    // CONTROLS, before the flip. Without these the assertions below could pass on a document that
    // never rendered, or on a setting that was never `auto`.
    const figures = Array.from(shadow.querySelectorAll(FIGURE_SELECTOR));
    expect(figures).toHaveLength(2);
    expect(render, 'the first render must invoke the engine — the control for everything after').
      toHaveBeenCalledTimes(2);
    for (const figure of figures) {
      expect(figure.querySelectorAll('svg')).toHaveLength(1);
      expect(figure.getAttribute(DIAGRAM_THEME_ATTR)).toBe('light');
    }
    expect(currentThemeSetting(), 'the whole point is the DEFAULT configuration').toBe('auto');

    await flipOsAndAwaitDelivery('dark');

    // The half a `onThemeSettingChange` build ALSO gets right — the page repaints. Asserted first
    // so the failure below cannot be read as "the flip never happened".
    await waitForHostTheme(host, 'dark');

    // ★ THE CLAIM. Every rendered diagram followed the EFFECTIVE theme.
    for (const figure of figures) await waitForDiagramTheme(figure, 'dark');
    for (const figure of figures) {
      expect(figure.querySelectorAll('svg'), 'a re-themed figure is still a diagram').toHaveLength(1);
      expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    }

    // ...and the SETTING never moved. This is what makes the seam distinction real rather than
    // asserted: nothing on the channel D-7 rejected could have carried this change.
    expect(currentThemeSetting()).toBe('auto');
  });

  it('★ NEVER BLANK during the swap — asserted at every observed frame AND between mutations', async () => {
    const { loader } = counting();
    const { shadow } = enhancedHost(doc(FENCE_A), loader);
    await settleDiagrams(shadow);

    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!figure) throw new Error('expected a rendered figure to watch');
    const originalSvg = figure.querySelector('svg');
    expect(originalSvg, 'nothing to keep visible unless something was rendered first').not.toBeNull();

    const watch = watchFigure(figure);
    await flipOsAndAwaitDelivery('dark');
    await waitForDiagramTheme(figure, 'dark');
    await sleep(120); // a few more frames past the swap, so the window brackets it on both sides
    const { frames, replay } = watch.stop();

    // The observation itself was real — a sampler that never ran would make every claim below
    // vacuously true.
    expect(frames.length, 'the frame sampler must actually have sampled across the swap').
      toBeGreaterThan(5);

    // ★ NEVER BLANK, across frames.
    expect(
      Math.min(...frames),
      `a frame observed the figure with no <svg> — keep-previous-visible was violated (samples: ${frames.join(',')})`,
    ).toBe(1);
    expect(Math.max(...frames), 'never two diagrams at once either').toBe(1);

    // ★ NEVER BLANK, between mutations in the SAME task — the blank no frame could see.
    expect(
      Math.min(...replay),
      `the figure passed through an empty state between two mutations (replay: ${replay.join(',')})`,
    ).toBeGreaterThanOrEqual(1);

    // ── AND THE SWAP GENUINELY HAPPENED, which is what makes all of the above non-vacuous ──
    expect(replay.length, 'the figure was mutated at least once — a swap, not a no-op').
      toBeGreaterThanOrEqual(2);
    expect(figure.getAttribute(DIAGRAM_THEME_ATTR)).toBe('dark');
    expect(
      figure.contains(originalSvg),
      're-theming must REPLACE the rendering, not mutate the adopted SVG in place (D-7)',
    ).toBe(false);
    expect(figure.querySelectorAll('svg')).toHaveLength(1);
  });

  it('★ the SECOND flip is a CACHE HIT — §3.7\'s round trip on group 4\'s two rows', async () => {
    const { loader, render } = counting();
    const { shadow } = enhancedHost(doc(FENCE_A), loader);
    await settleDiagrams(shadow);

    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!figure) throw new Error('expected a rendered figure');
    expect(render, 'the initial render is a miss — the control').toHaveBeenCalledTimes(1);

    // FLIP 1 — light -> dark. This rendering has never existed, so it is a MISS and the engine runs.
    const beforeFirst = render.mock.calls.length;
    await flipOsAndAwaitDelivery('dark');
    await waitForDiagramTheme(figure, 'dark');
    expect(
      render.mock.calls.length - beforeFirst,
      'the FIRST flip to a theme never rendered before must invoke the engine — this is the ' +
        'control that makes the zero below a cache hit rather than a re-theme that never ran',
    ).toBe(1);

    // Both renderings are rows now (§3.7's coexistence, 4.1's two-row property, through the REAL
    // store) — which is precisely why the flip back costs nothing.
    expect((await describeStored()).diagrams.count).toBe(2);

    // FLIP 2 — dark -> light. The light rendering was cached on the very first pass.
    const beforeSecond = render.mock.calls.length;
    await flipOsAndAwaitDelivery('light');
    await waitForDiagramTheme(figure, 'light');
    expect(
      render.mock.calls.length - beforeSecond,
      'the SECOND flip must be served from cache — a non-zero count is the re-theme re-rendering ' +
        'what group 4 already stored',
    ).toBe(0);

    // A hit that served nothing would ALSO leave the engine uninvoked — and would leave an empty
    // box. Both halves, or the claim is hollow.
    expect(figure.querySelectorAll('svg')).toHaveLength(1);
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');

    // And a third flip, back to dark, is a hit too: neither row displaced the other.
    const beforeThird = render.mock.calls.length;
    await flipOsAndAwaitDelivery('dark');
    await waitForDiagramTheme(figure, 'dark');
    expect(render.mock.calls.length - beforeThird).toBe(0);
    expect((await describeStored()).diagrams.count).toBe(2);
  });

  it('a host removed from the document is PRUNED — with a live host as the control', async () => {
    const dead = counting();
    const live = counting();
    const deadHost = enhancedHost(doc(FENCE_A), dead.loader);
    const liveHost = enhancedHost(doc(FENCE_B), live.loader);
    await settleDiagrams(deadHost.shadow);
    await settleDiagrams(liveHost.shadow);

    const deadFigure = deadHost.shadow.querySelector(FIGURE_SELECTOR);
    const liveFigure = liveHost.shadow.querySelector(FIGURE_SELECTOR);
    if (!deadFigure || !liveFigure) throw new Error('expected both figures rendered');
    expect(dead.render).toHaveBeenCalledTimes(1);
    expect(live.render).toHaveBeenCalledTimes(1);

    deadHost.host.remove(); // unmounted reader / re-rendered pane

    const beforeDead = dead.render.mock.calls.length;
    await flipOsAndAwaitDelivery('dark');

    // THE CONTROL, in the same test and the same flip: a live host IS re-themed. Without it, the
    // zero below could just mean the flip never reached the subscriber at all.
    await waitForDiagramTheme(liveFigure, 'dark');

    // The detached host's engine was never touched, and its figure never written to — the
    // `isConnected` prune, one level up from `themeRegistry`'s own (`pruneThemeHosts`).
    expect(dead.render.mock.calls.length - beforeDead, 'a dead host must not drive a render').toBe(0);
    expect(deadFigure.getAttribute(DIAGRAM_THEME_ATTR)).toBe('light');
  });
});

// ── ★ THE DIAGRAM IS LEGIBLE AT THE THEME IT WAS DRAWN FOR (the 9.1 walk's finding) ───────────
//
// Every test ABOVE proves the diagram is RE-RENDERED when the effective theme changes, and every
// one of them was green while the two renderings were PIXEL-IDENTICAL: until this file's fix, the
// effective theme reached the cache key and nothing else, so mermaid drew its default LIGHT picture
// at both themes and the flip swapped a picture for its own twin. `data-diagram-theme` flipped, the
// <svg> node was replaced, no frame was blank — all true, and none of it about colour.
//
// So this block asserts the property those cannot see: that the text mermaid draws ON THE CANVAS is
// READABLE against the paper it lands on. The 9.1 human gate found it unreadable on dark — the pie's
// title and legend and the gantt's date axis rendering near-black on near-black paper — and the
// measurement below is that finding stated as a number.
//
// ── WHY CONTRAST, AND WHY NOT "the fill is not #333" ──────────────────────────────────────────
//
// A test that pins specific hexes pins the MAPPING, not the PROPERTY: re-tune one token and it goes
// red without anything having become unreadable. WCAG 2.1 contrast against the actual painted
// background is the property the walk was judging by eye, and it survives a palette change.
//
// ── WHY THE LIGHT ARM IS NOT DECORATION ──────────────────────────────────────────────────────
//
// Light was CORRECT before the fix and must stay correct after it — the binding constraint the
// finding was filed with. Running the SAME assertion on light is what makes the dark arm mean
// something: pre-fix, light PASSED and dark FAILED, so the assertion discriminates a broken picture
// from a broken assertion. A check that red on both, or passed on both, would prove neither.
//
// ── EACH LABEL IS NAMED SEPARATELY, ON PURPOSE ───────────────────────────────────────────────
//
// Five labels, five assertions, because they are FIVE DIFFERENT mermaid colour sources
// (`pieTitleTextColor`, `pieLegendTextColor`, `textColor`, `titleColor` twice over) — a mapping that
// catches four and misses one must red on the fifth rather than pass on an average. Two of the five
// (the gantt's title and its section title) were NOT in the walk's list; the pre-fix survey found
// them failing by the same mechanism, so they are covered here rather than left to be re-found.

/** WCAG 2.1 AA for normal text. The gantt's task-bar text sits at 2.95:1 at BOTH themes — mermaid's
 *  own default, identical before and after this fix, and therefore not this block's subject. */
const MIN_CONTRAST = 4.5;

const PIE_FENCE =
  '```mermaid\npie title Fence mix, section 7\n  "flowchart" : 30\n  "sequence" : 25\n  "other" : 45\n```\n';
const GANTT_FENCE =
  '```mermaid\ngantt\n  title Enhancement pass 6\n  dateFormat YYYY-MM-DD\n  section Fence 6\n' +
  '  parse     :p6, 2026-08-01, 1d\n  sanitize  :s6, after p6, 1d\n  adopt     :a6, after s6, 1d\n```\n';

/** The five canvas-drawn labels, each with the figure it belongs to and the mermaid colour source
 *  behind it — named in the failure message so a red says WHICH source is wrong. */
const CANVAS_LABELS: ReadonlyArray<{
  readonly label: string;
  readonly figure: number;
  readonly selector: string;
  readonly source: string;
}> = [
  { label: 'pie title', figure: 0, selector: '.pieTitleText', source: 'pieTitleTextColor' },
  { label: 'pie legend', figure: 0, selector: '.legend text', source: 'pieLegendTextColor' },
  { label: 'gantt date-axis tick', figure: 1, selector: '.grid .tick text', source: 'textColor' },
  { label: 'gantt title', figure: 1, selector: '.titleText', source: 'titleColor' },
  { label: 'gantt section title', figure: 1, selector: '.sectionTitle', source: 'titleColor' },
];

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/** WCAG relative luminance. */
const luminance = ([r, g, b]: readonly [number, number, number]): number =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

function parseRgb(value: string): [number, number, number] {
  const m = /(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/.exec(value);
  if (!m) throw new Error(`not an rgb colour: ${value}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Strip the per-render `peekover-diagram-N` so two renderings can be compared for their PAINT.
 *  `renderSeq` increments per render and mermaid stamps the id into the root element and into
 *  every selector of the stylesheet it generates. */
const normalizeRenderIds = (svg: string): string => svg.replace(/peekover-diagram-\d+/g, 'ID');

function contrastRatio(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The colour actually painted behind `el` — the nearest ancestor with a non-transparent
 * background, crossing the shadow boundary to the host if it gets that far.
 *
 * These five labels are drawn straight onto the canvas: mermaid paints no shape under them, so the
 * reader's own paper IS their background. Resolving it by walking rather than by naming `--paper`
 * keeps the test measuring what is on screen instead of what the stylesheet intends.
 */
function paintedBackgroundOf(el: Element): [number, number, number] {
  let node: Element | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(bg) && bg !== 'transparent') return parseRgb(bg);
    const parent: Element | null = node.parentElement;
    if (parent) {
      node = parent;
      continue;
    }
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  throw new Error('no painted background found above the label');
}

/** Assert every canvas label in a settled two-figure document clears {@link MIN_CONTRAST}. */
function expectCanvasLabelsLegible(shadow: ShadowRoot, theme: string): void {
  const figures = shadow.querySelectorAll(FIGURE_SELECTOR);
  expect(figures.length, 'expected the pie and the gantt to have rendered').toBe(2);

  for (const { label, figure, selector, source } of CANVAS_LABELS) {
    const nodes = figures[figure].querySelectorAll(selector);
    expect(nodes.length, `no "${label}" node matched ${selector} — the assertion would be vacuous`)
      .toBeGreaterThan(0);

    const el = nodes[0];
    const fill = parseRgb(getComputedStyle(el).fill);
    const behind = paintedBackgroundOf(el);
    const ratio = contrastRatio(fill, behind);

    expect(
      Number(ratio.toFixed(2)),
      `${theme}: the ${label} is drawn rgb(${fill.join(',')}) on rgb(${behind.join(',')}) — ` +
        `${ratio.toFixed(2)}:1, below WCAG AA ${MIN_CONTRAST}:1. mermaid draws this label on the ` +
        `CANVAS, so its colour comes from the engine's \`${source}\` theme variable; if the engine ` +
        `is not configured for the effective theme it falls back to mermaid's light-picture default ` +
        `and the text lands near-invisible on ${theme} paper (007 §3.7 / D-7, the 9.1 walk finding)`,
    ).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }
}

describe('canvas-drawn diagram text is LEGIBLE at the effective theme (9.1 walk finding)', () => {
  it('★ DARK: pie title, pie legend, gantt tick, gantt title, gantt section all clear WCAG AA', async () => {
    await emulateOs('dark');
    const { shadow } = enhancedHost(doc(PIE_FENCE, GANTT_FENCE), counting().loader);
    await settleDiagrams(shadow);
    expectCanvasLabelsLegible(shadow, 'dark');
  });

  it('the LIGHT control: the SAME five labels, the SAME threshold — light was never broken', async () => {
    await emulateOs('light');
    const { shadow } = enhancedHost(doc(PIE_FENCE, GANTT_FENCE), counting().loader);
    await settleDiagrams(shadow);
    expectCanvasLabelsLegible(shadow, 'light');
  });

  /**
   * ★ THE FLIP NOW SWAPS TWO DIFFERENT PICTURES — the fact every test above was blind to.
   *
   * Before the theme reached the engine, `mermaid.render` returned the same bytes at both themes
   * and the re-theme replaced an <svg> with its own twin. The suite was green throughout, because
   * "was it re-rendered" and "does it look different" are different questions. This asks the
   * second one, so a regression that quietly stops the paint from reaching the engine cannot hide
   * behind a passing flip test again.
   */
  it('★ the light and dark renderings of one fence are DIFFERENT artifacts, not twins', async () => {
    await emulateOs('light');
    const { shadow } = enhancedHost(doc(PIE_FENCE), counting().loader);
    await settleDiagrams(shadow);
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!figure) throw new Error('expected a rendered figure');

    const lightSvg = normalizeRenderIds(figure.querySelector('svg')?.outerHTML ?? '');
    await flipOsAndAwaitDelivery('dark');
    await waitForDiagramTheme(figure, 'dark');
    const darkSvg = normalizeRenderIds(figure.querySelector('svg')?.outerHTML ?? '');

    expect(lightSvg.length, 'the light rendering must exist to be compared').toBeGreaterThan(0);
    // The id normalisation above is what makes this assertion mean anything: every render gets a
    // fresh `peekover-diagram-N`, which mermaid writes into the root id AND into every selector of
    // its generated <style>, so two renderings ALWAYS differ textually. Without normalising, this
    // passed against a build with the paint ablated — measured, not assumed.
    expect(
      darkSvg,
      'the dark rendering is identical to the light one once the render id is normalised — the ' +
        'flip re-rendered and swapped, but the engine drew the same picture twice, which is ' +
        'exactly the state the 9.1 walk found',
    ).not.toBe(lightSvg);
  });

  /**
   * ★ DECISION 2's OTHER HALF: the per-render configuration rides the RENDER path, never the hit
   * path. A cache hit serves a stored string and never calls `render`, so it must not pay to
   * configure an engine it will not invoke — the fast path group 4 exists to create.
   *
   * Counted by the THEMED configuration specifically (`themeVariables` present), because
   * `loadDiagramEngine` also calls `initialize` with the theme-free load-time constant on every
   * pass including a re-theme's; counting bare calls would conflate the two and prove nothing.
   */
  it('★ a cache HIT does not re-configure the engine — themed initialize tracks render exactly', async () => {
    const themed: unknown[] = [];
    const render: Mock<() => void> = vi.fn();
    const engine: DiagramEngine = {
      initialize: (config) => {
        if (config.themeVariables !== undefined) themed.push(config.themeVariables);
        mermaid.initialize(config as never);
      },
      render: async (id, definition, container) => {
        render();
        return await mermaid.render(id, definition, container);
      },
    };
    const loader: EngineLoader = async () => ({ default: engine }) as unknown as DiagramEngineModule;

    await emulateOs('light');
    const { shadow } = enhancedHost(doc(FENCE_A), loader);
    await settleDiagrams(shadow);
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!figure) throw new Error('expected a rendered figure');
    expect(themed).toHaveLength(1);
    expect(render).toHaveBeenCalledTimes(1);

    // FLIP 1 — a theme never rendered before: a MISS, so one render and one themed configure.
    await flipOsAndAwaitDelivery('dark');
    await waitForDiagramTheme(figure, 'dark');
    expect(render, 'the miss is the control — without it the zero below is not a cache hit')
      .toHaveBeenCalledTimes(2);
    expect(themed).toHaveLength(2);

    // FLIP 2 — back to a rendering already stored: a HIT. Neither counter may move.
    const beforeHit = themed.length;
    await flipOsAndAwaitDelivery('light');
    await waitForDiagramTheme(figure, 'light');
    expect(render, 'the flip back is served from cache').toHaveBeenCalledTimes(2);
    expect(
      themed.length - beforeHit,
      'a cache hit configured the engine anyway — the per-render initialize has drifted off the ' +
        'render path and onto the hit path, which is the fast path it must never touch',
    ).toBe(0);

    // The hit really served a diagram — otherwise "no configure" would be the trivial truth of
    // nothing having happened.
    expect(figure.querySelectorAll('svg')).toHaveLength(1);
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
  });
});
